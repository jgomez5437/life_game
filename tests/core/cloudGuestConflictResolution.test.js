import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { initGame, updateGameInfo, saveGame } from '../../public/src/core/main.js';
import { saveToSlot, getSlotsStore, hydrateSlotsStoreFromCloud } from '../../public/src/core/saveSlotManager.js';
import { Utils } from '../../public/src/ui/utils.js';
import { UI } from '../../public/src/ui/ui.js';

describe('Cloud vs Guest Conflict Resolution & Storage Isolation Suite', () => {
    let originalFetch;

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
        state.auth0Client = null;
        state.userAuthId = null;
        state.userEmail = null;
        state.verifiedPurchases = [];
        localStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        localStorage.clear();
        jest.restoreAllMocks();
    });

    test('saveToSlot in guest mode writes to life_game_slots, life_game_save, and guestStorage', () => {
        state.userAuthId = null;
        state.gameState = {
            user: {
                username: 'Guest Hero',
                age: 5,
                health: 100,
                happiness: 100,
                smarts: 50,
                looks: 50,
                money: 100,
                lifeStatus: 'Child'
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };

        saveToSlot('slot_1', 'Guest Hero');

        const slotsRaw = localStorage.getItem('life_game_slots');
        expect(slotsRaw).toBeTruthy();
        expect(JSON.parse(slotsRaw).slots.slot_1.name).toBe('Guest Hero');

        const legacyRaw = localStorage.getItem('life_game_save');
        expect(legacyRaw).toBeTruthy();
        expect(JSON.parse(legacyRaw).user.username).toBe('Guest Hero');

        const guestRaw = localStorage.getItem(Utils.guestStorage.SAVE_KEY);
        expect(guestRaw).toBeTruthy();
        expect(JSON.parse(guestRaw).user.username).toBe('Guest Hero');
    });

    test('saveToSlot in authenticated mode does NOT write to guestStorage and cleans up legacy guest keys', () => {
        // Pre-populate guest keys as if user played before logging in
        localStorage.setItem(Utils.guestStorage.SAVE_KEY, JSON.stringify({ user: { username: 'Stale Guest' } }));
        localStorage.setItem('life_game_save', JSON.stringify({ user: { username: 'Stale Guest' } }));

        state.userAuthId = 'auth0|cloud_user_456';
        state.userEmail = 'cloud@example.com';
        state.gameState = {
            user: {
                username: 'Cloud Champion',
                age: 30,
                health: 90,
                happiness: 85,
                smarts: 80,
                looks: 75,
                money: 50000,
                lifeStatus: 'Adult'
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };

        saveToSlot('slot_1', 'Cloud Champion');

        // life_game_slots must be updated
        const store = getSlotsStore();
        expect(store.slots.slot_1.name).toBe('Cloud Champion');
        expect(store.slots.slot_1.data.user.age).toBe(30);

        // Guest storage keys must be purged
        expect(localStorage.getItem(Utils.guestStorage.SAVE_KEY)).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();
    });

    test('hydrateSlotsStoreFromCloud with forceCloud=true strictly overrides local stores even if local progress is newer', () => {
        // Local store has older Age 40 character from local guest play
        localStorage.setItem('life_game_slots', JSON.stringify({
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Local Guest Character',
                    lastSaved: 9999999,
                    data: { user: { username: 'Local Guest', age: 40, lifeStatus: 'Adult' } }
                }
            }
        }));

        const cloudPayload = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Cloud Character',
                    lastSaved: 1000,
                    data: { user: { username: 'Cloud Character', age: 10, lifeStatus: 'Child' } }
                }
            },
            user: { username: 'Cloud Character', age: 10, lifeStatus: 'Child' }
        };

        const store = hydrateSlotsStoreFromCloud(cloudPayload, true);

        expect(store._needsCloudSync).toBe(false);
        expect(store.slots.slot_1.name).toBe('Cloud Character');
        expect(store.slots.slot_1.data.user.age).toBe(10);
    });

    test('conflict resolution Keep Cloud Character purges local storage and loads cloud save cleanly', async () => {
        let confirmOptions = null;
        jest.spyOn(UI, 'showConfirm').mockImplementation((title, message, confirmText, onConfirm, cancelText, onCancel) => {
            confirmOptions = { title, message, confirmText, onConfirm, cancelText, onCancel };
        });
        const showModalSpy = jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        // Setup Guest save in localStorage
        const guestData = {
            user: {
                username: 'Guest Dave',
                age: 8,
                health: 100,
                happiness: 100,
                smarts: 70,
                looks: 70,
                money: 50,
                city: 'New York',
                gender: 'male',
                lifeStatus: 'Child',
                relationships: []
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };
        localStorage.setItem(Utils.guestStorage.SAVE_KEY, JSON.stringify(guestData));
        localStorage.setItem('life_game_save', JSON.stringify(guestData));
        localStorage.setItem('life_game_slots', JSON.stringify({
            activeSlotId: 'slot_1',
            slots: { slot_1: { id: 'slot_1', name: 'Guest Dave', lastSaved: 5000, data: guestData } }
        }));

        // Mock Auth0 client
        state.auth0Client = {
            isAuthenticated: jest.fn().mockResolvedValue(true),
            getUser: jest.fn().mockResolvedValue({
                sub: 'auth0|cloud_user_999',
                nickname: 'CloudPlayer',
                email: 'player@example.com'
            }),
            getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: 'mock_token' })
        };

        // Mock cloud load returning Cloud Character (Age 25)
        const cloudData = {
            user: {
                username: 'Cloud Alice',
                age: 25,
                health: 95,
                happiness: 90,
                smarts: 85,
                looks: 80,
                money: 40000,
                city: 'London',
                gender: 'female',
                lifeStatus: 'Adult',
                relationships: []
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                auth0_id: 'auth0|cloud_user_999',
                email: 'player@example.com',
                game_data: cloudData
            })
        });

        // Run initGame
        await initGame();

        // Save conflict modal must have been shown
        expect(UI.showConfirm).toHaveBeenCalledWith(
            "Save Conflict Detected",
            expect.any(String),
            "Use Guest Character",
            expect.any(Function),
            "Keep Cloud Character",
            expect.any(Function)
        );

        // Simulate user clicking "Keep Cloud Character"
        confirmOptions.onCancel();

        // 1. Guest storage keys must be deleted
        expect(localStorage.getItem(Utils.guestStorage.SAVE_KEY)).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();

        // 2. State must be the Cloud character
        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.username).toBe('Cloud Alice');
        expect(state.gameState.user.age).toBe(25);

        // 3. Local slots must hold the Cloud character
        const store = getSlotsStore();
        expect(store.slots.slot_1.data.user.username).toBe('Cloud Alice');

        // 4. Now simulate page refresh: run initGame again
        UI.showConfirm.mockClear();
        await initGame();

        // NO conflict modal should be triggered on refresh!
        expect(UI.showConfirm).not.toHaveBeenCalled();
        expect(state.gameState.user.username).toBe('Cloud Alice');
    });

    test('conflict resolution Use Guest Character overwrites cloud save and purges guest storage', async () => {
        let confirmOptions = null;
        jest.spyOn(UI, 'showConfirm').mockImplementation((title, message, confirmText, onConfirm, cancelText, onCancel) => {
            confirmOptions = { title, message, confirmText, onConfirm, cancelText, onCancel };
        });
        jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        const guestData = {
            user: {
                username: 'Guest Winner',
                age: 12,
                health: 100,
                happiness: 100,
                smarts: 75,
                looks: 75,
                money: 300,
                city: 'Tokyo',
                gender: 'male',
                lifeStatus: 'Teen',
                relationships: []
            },
            lifeLog: [],
            snapshots: [],
            _slotId: 'slot_1'
        };
        localStorage.setItem(Utils.guestStorage.SAVE_KEY, JSON.stringify(guestData));

        state.auth0Client = {
            isAuthenticated: jest.fn().mockResolvedValue(true),
            getUser: jest.fn().mockResolvedValue({
                sub: 'auth0|cloud_user_888',
                nickname: 'CloudPlayer2',
                email: 'player2@example.com'
            }),
            getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: 'mock_token' })
        };

        const fetchSpy = jest.fn().mockImplementation((url) => {
            if (url.includes('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        auth0_id: 'auth0|cloud_user_888',
                        email: 'player2@example.com',
                        game_data: { user: { username: 'Old Cloud Char', age: 50, lifeStatus: 'Adult' } }
                    })
                });
            }
            if (url.includes('/api/saveGame')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ message: 'Saved successfully' })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
        });
        global.fetch = fetchSpy;

        await initGame();

        expect(UI.showConfirm).toHaveBeenCalled();

        // Simulate user clicking "Use Guest Character"
        await confirmOptions.onConfirm();

        // 1. Guest storage must be purged
        expect(localStorage.getItem(Utils.guestStorage.SAVE_KEY)).toBeNull();

        // 2. Active game state is now the migrated guest character
        expect(state.gameState.user.username).toBe('Guest Winner');
        expect(state.gameState.user.age).toBe(12);

        // 3. /api/saveGame was called to overwrite cloud save
        const saveCall = fetchSpy.mock.calls.find(call => call[0].includes('/api/saveGame'));
        expect(saveCall).toBeDefined();
        const payload = JSON.parse(saveCall[1].body);
        expect(payload.game_data.user.username).toBe('Guest Winner');

        // 4. Simulate page refresh: initGame again with new cloud data
        UI.showConfirm.mockClear();
        fetchSpy.mockImplementation((url) => {
            if (url.includes('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        auth0_id: 'auth0|cloud_user_888',
                        email: 'player2@example.com',
                        game_data: { user: { username: 'Guest Winner', age: 12, lifeStatus: 'Teen' } }
                    })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
        });

        await initGame();

        // NO conflict modal should be shown on refresh
        expect(UI.showConfirm).not.toHaveBeenCalled();
        expect(state.gameState.user.username).toBe('Guest Winner');
    });
});
