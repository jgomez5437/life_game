import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { initGame, fetchCloudSave, showCloudLoadRecoveryModal } from '../../public/src/core/main.js';
import { getSlotsStore, saveToSlot } from '../../public/src/core/saveSlotManager.js';
import { UI } from '../../public/src/ui/ui.js';
import * as authModule from '../../public/src/auth/auth.js';

describe('Cloud Load Resilience & Failure Safety Test Suite', () => {
    let originalFetch;
    let mockAuth0Client;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-name"></div>
            <div id="header-age"></div>
            <div id="header-bank"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
                <button id="modal-close-btn" class="hidden"></button>
            </div>
        `;

        originalFetch = global.fetch;
        state.gameState = null;
        state.userAuthId = null;
        state.userEmail = null;
        state.verifiedPurchases = [];
        localStorage.clear();
        jest.restoreAllMocks();

        mockAuth0Client = {
            isAuthenticated: jest.fn().mockResolvedValue(true),
            getUser: jest.fn().mockResolvedValue({
                sub: 'auth0|test_resilience_user',
                email: 'player@example.com',
                nickname: 'Tester'
            }),
            getIdTokenClaims: jest.fn().mockResolvedValue({
                __raw: 'valid_initial_id_token',
                exp: Math.floor(Date.now() / 1000) + 3600
            }),
            getTokenSilently: jest.fn().mockResolvedValue({
                id_token: 'refreshed_id_token'
            })
        };
        state.auth0Client = mockAuth0Client;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        localStorage.clear();
        jest.restoreAllMocks();
    });

    test('Critical Scenario: Authenticated user with /api/load 500 error and NO local save NEVER renders Character Creation', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal Server Error' })
        });

        const showCustomModalSpy = jest.spyOn(UI, 'showCustomModal');

        await initGame();

        // Character Creation must NOT have rendered into the container
        expect(document.body.innerHTML).not.toContain('Design your destiny');
        expect(document.body.innerHTML).not.toContain('Start Life');
        expect(state.gameState).toBeNull();

        // Recovery modal must be presented to player
        expect(showCustomModalSpy).toHaveBeenCalled();
        const modalArgs = showCustomModalSpy.mock.calls[0][0];
        expect(modalArgs.title).toBe('Unable to Load Cloud Save');
        expect(modalArgs.confirmText).toBe('Retry Connection');
        expect(modalArgs.cancelText).toBe('Sign In Again');
    });

    test('Critical Scenario: Authenticated user with network drop (fetch throws) and NO local save NEVER renders Character Creation', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

        const showCustomModalSpy = jest.spyOn(UI, 'showCustomModal');

        await initGame();

        expect(document.body.innerHTML).not.toContain('Design your destiny');
        expect(state.gameState).toBeNull();
        expect(showCustomModalSpy).toHaveBeenCalled();
        const modalArgs = showCustomModalSpy.mock.calls[0][0];
        expect(modalArgs.title).toBe('Unable to Load Cloud Save');
    });

    test('401 Unauthorized -> Forces token refresh -> Successful retry -> Character loads normally', async () => {
        let requestCount = 0;
        global.fetch = jest.fn().mockImplementation(async (url, options) => {
            requestCount++;
            const authHeader = options?.headers?.Authorization || options?.headers?.authorization;
            if (authHeader === 'Bearer valid_initial_id_token') {
                return {
                    ok: false,
                    status: 401,
                    json: async () => ({ error: 'Unauthorized token' })
                };
            }
            if (authHeader === 'Bearer refreshed_id_token') {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        auth0_id: 'auth0|test_resilience_user',
                        game_data: {
                            activeSlotId: 'slot_1',
                            slots: {
                                slot_1: {
                                    id: 'slot_1',
                                    name: 'Resilient Hero',
                                    lastSaved: Date.now(),
                                    data: {
                                        user: {
                                            username: 'Resilient Hero',
                                            age: 25,
                                            health: 100,
                                            happiness: 95,
                                            smarts: 80,
                                            looks: 75,
                                            money: 5000,
                                            lifeStatus: 'Young Adult'
                                        },
                                        lifeLog: [],
                                        snapshots: []
                                    }
                                }
                            }
                        }
                    })
                };
            }
            return { ok: false, status: 400 };
        });

        await initGame();

        expect(mockAuth0Client.getTokenSilently).toHaveBeenCalled();
        expect(state.gameState).toBeTruthy();
        expect(state.gameState.user.username).toBe('Resilient Hero');
        expect(state.gameState.user.age).toBe(25);
    });

    test('401 Unauthorized -> Forces token refresh -> 401 again -> Displays Session Expired error without Character Creation', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized token' })
        });

        const showCustomModalSpy = jest.spyOn(UI, 'showCustomModal');

        await initGame();

        expect(mockAuth0Client.getTokenSilently).toHaveBeenCalled();
        expect(document.body.innerHTML).not.toContain('Design your destiny');
        expect(state.gameState).toBeNull();
        expect(showCustomModalSpy).toHaveBeenCalled();
        const modalArgs = showCustomModalSpy.mock.calls[0][0];
        expect(modalArgs.title).toBe('Session Expired');
    });

    test('429 Rate Limit -> Retries and surfaces Rate Limit modal if exhausted without Character Creation', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 429,
            json: async () => ({ error: 'Too many requests' })
        });

        const showCustomModalSpy = jest.spyOn(UI, 'showCustomModal');

        await initGame();

        expect(document.body.innerHTML).not.toContain('Design your destiny');
        expect(state.gameState).toBeNull();
        expect(showCustomModalSpy).toHaveBeenCalled();
        const modalArgs = showCustomModalSpy.mock.calls[0][0];
        expect(modalArgs.content).toContain('Too many requests');
    });

    test('Successful cloud load with no save (404/new user) -> Routes legitimately to Character Creation', async () => {
        global.fetch = jest.fn().mockImplementation(async (url) => {
            if (url.includes('/api/load')) {
                return {
                    ok: false,
                    status: 404,
                    json: async () => ({ error: 'User not found' })
                };
            }
            if (url.includes('/api/login')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        auth0_id: 'auth0|test_resilience_user',
                        game_data: {} // No character
                    })
                };
            }
            return { ok: false, status: 404 };
        });

        await initGame();

        expect(document.body.innerHTML).toContain('Design your destiny');
        expect(document.body.innerHTML).toContain('Start Life');
    });

    test('Successful cloud load with valid save -> Loads character onto Dashboard', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                auth0_id: 'auth0|test_resilience_user',
                game_data: {
                    activeSlotId: 'slot_1',
                    slots: {
                        slot_1: {
                            id: 'slot_1',
                            name: 'Star Player',
                            lastSaved: Date.now(),
                            data: {
                                user: {
                                    username: 'Star Player',
                                    age: 18,
                                    health: 100,
                                    happiness: 100,
                                    smarts: 90,
                                    looks: 85,
                                    money: 1200,
                                    lifeStatus: 'Young Adult'
                                },
                                lifeLog: [],
                                snapshots: []
                            }
                        }
                    }
                }
            })
        });

        await initGame();

        expect(state.gameState).toBeTruthy();
        expect(state.gameState.user.username).toBe('Star Player');
        expect(state.gameState.user.age).toBe(18);
        expect(document.body.innerHTML).not.toContain('Design your destiny');
    });

    test('Cloud load failure WITH valid local save -> Recovers local save with informative notice modal', async () => {
        // Prepare local save
        state.gameState = {
            user: {
                username: 'Offline Hero',
                age: 10,
                health: 100,
                happiness: 100,
                smarts: 70,
                looks: 60,
                money: 300,
                lifeStatus: 'Child'
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };
        saveToSlot('slot_1', 'Offline Hero');
        state.gameState = null; // Clear in-memory state to simulate fresh page boot

        // Cloud API fails with 500
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal Server Error' })
        });

        const showModalSpy = jest.spyOn(UI, 'showModal');

        await initGame();

        expect(state.gameState).toBeTruthy();
        expect(state.gameState.user.username).toBe('Offline Hero');
        expect(state.gameState.user.age).toBe(10);
        expect(showModalSpy).toHaveBeenCalledWith(
            'Offline Notice',
            expect.stringContaining('Could not connect to cloud sync service')
        );
    });
});
