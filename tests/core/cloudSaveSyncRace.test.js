import { jest } from '@jest/globals';
import { state, setVerifiedPurchases } from '../../public/src/core/state.js';
import { saveGame, updateGameInfo, flushPendingSave } from '../../public/src/core/main.js';
import { getSlotsStore, saveToSlot, migrateState } from '../../public/src/core/saveSlotManager.js';
import { UI } from '../../public/src/ui/ui.js';

describe('Cloud Save Sync & Rapid Age-Up Persistence Suite', () => {
    let originalFetch;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="header-name"></div>
            <div id="header-age"></div>
            <div id="header-bank"></div>
            <div id="avatar-container"></div>
        `;

        originalFetch = global.fetch;
        state.gameState = null;
        state.auth0Client = null;
        state.userAuthId = 'auth0|test_player_123';
        state.userEmail = 'test@example.com';
        setVerifiedPurchases([]);
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('immediate save persists to local slots store and executes immediate fetch', async () => {
        state.gameState = {
            user: {
                username: 'Jane Doe',
                age: 20,
                health: 100,
                happiness: 95,
                smarts: 80,
                looks: 75,
                money: 5000,
                lifeStatus: 'Young Adult'
            },
            lifeLog: [{ age: 20, events: [{ msg: 'Turned 20', color: 'text-white' }] }],
            _slotId: 'slot_1'
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Game Saved Successfully' })
        });
        global.fetch = fetchSpy;

        // Call immediate save
        await saveGame(true);

        // Local slot store must be populated
        const store = getSlotsStore();
        expect(store.slots['slot_1']).toBeDefined();
        expect(store.slots['slot_1'].name).toBe('Jane Doe');
        expect(store.slots['slot_1'].data.user.age).toBe(20);

        // Fetch must have been called
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchSpy.mock.calls[0];
        expect(url).toBe('/api/saveGame');
        const payload = JSON.parse(opts.body);
        expect(payload.auth0_id).toBe('auth0|test_player_123');
        expect(payload.game_data.user.username).toBe('Jane Doe');
        expect(payload.game_data.user.age).toBe(20);
    });

    test('debounced save queues rapid consecutive ageUp calls into a single consolidated cloud save', async () => {
        state.gameState = {
            user: {
                username: 'Fast Ager',
                age: 0,
                health: 100,
                happiness: 100,
                smarts: 50,
                looks: 50,
                money: 0,
                lifeStatus: 'Baby'
            },
            lifeLog: [],
            _slotId: 'slot_1'
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Game Saved Successfully' })
        });
        global.fetch = fetchSpy;

        // Simulate rapid age up: 10 consecutive debounced saves in rapid succession
        for (let i = 1; i <= 10; i++) {
            state.gameState.user.age = i;
            saveGame(false);
        }

        // Before timers run, local storage is immediately updated on every click
        const store = getSlotsStore();
        expect(store.slots['slot_1'].data.user.age).toBe(10);
        // But zero network calls made yet during rapid clicking
        expect(fetchSpy).toHaveBeenCalledTimes(0);

        // Advance timer past debounce window (400ms)
        await jest.advanceTimersByTimeAsync(450);

        // Exactly ONE consolidated cloud save request is fired carrying the latest Age 10 state
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
        expect(payload.game_data.user.age).toBe(10);
    });

    test('flushPendingSave commits pending state immediately on unload', async () => {
        state.gameState = {
            user: {
                username: 'Unload Hero',
                age: 15,
                health: 90,
                happiness: 85,
                smarts: 70,
                looks: 65,
                money: 200,
                lifeStatus: 'Teen'
            },
            lifeLog: [],
            _slotId: 'slot_1'
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Saved' })
        });
        global.fetch = fetchSpy;

        // Schedule debounced save
        saveGame(false);
        expect(fetchSpy).toHaveBeenCalledTimes(0);

        // Flush immediately (e.g. beforeunload)
        await flushPendingSave();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
        expect(payload.game_data.user.age).toBe(15);
    });

    test('updateGameInfo safely recovers character when slots.data is properly formed', () => {
        const dbUser = {
            auth0_id: 'auth0|test_player_123',
            email: 'test@example.com',
            game_data: {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Recovered Star',
                        lastSaved: Date.now(),
                        data: {
                            user: {
                                username: 'Recovered Star',
                                age: 35,
                                health: 92,
                                happiness: 88,
                                smarts: 78,
                                looks: 80,
                                money: 75000,
                                lifeStatus: 'Adult'
                            },
                            lifeLog: [{ age: 35, events: [{ msg: 'Life going great', color: 'text-green-400' }] }],
                            _slotId: 'slot_1'
                        }
                    }
                }
            }
        };

        updateGameInfo(dbUser);

        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.username).toBe('Recovered Star');
        expect(state.gameState.user.age).toBe(35);
        expect(state.gameState.user.money).toBe(75000);
        expect(state.gameState._slotId).toBe('slot_1');
    });

    test('updateGameInfo parses stringified JSON game_data correctly', () => {
        const stringifiedDbUser = {
            auth0_id: 'auth0|test_player_123',
            email: 'test@example.com',
            game_data: JSON.stringify({
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Stringified Hero',
                        lastSaved: Date.now(),
                        data: {
                            user: {
                                username: 'Stringified Hero',
                                age: 18,
                                health: 100,
                                happiness: 90,
                                smarts: 85,
                                looks: 80,
                                money: 1000,
                                lifeStatus: 'Young Adult'
                            },
                            lifeLog: [],
                            _slotId: 'slot_1'
                        }
                    }
                }
            })
        };

        updateGameInfo(stringifiedDbUser);

        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.username).toBe('Stringified Hero');
        expect(state.gameState.user.age).toBe(18);
    });

    test('cloud save request includes keepalive: true for reload resilience', async () => {
        state.gameState = {
            user: {
                username: 'Keepalive User',
                age: 2,
                health: 100,
                happiness: 100,
                smarts: 50,
                looks: 50,
                money: 0,
                lifeStatus: 'Baby'
            },
            lifeLog: [],
            _slotId: 'slot_1'
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Game Saved Successfully' })
        });
        global.fetch = fetchSpy;

        await saveGame(true);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchSpy.mock.calls[0];
        expect(url).toBe('/api/saveGame');
        expect(opts.keepalive).toBe(true);
    });

    test('triggerManualSave in settings executes immediate cloud save and shows confirmation', async () => {
        const { triggerManualSave } = await import('../../public/src/features/more/settingsScreen.js');

        state.gameState = {
            user: {
                username: 'Manual Saver',
                age: 2,
                health: 100,
                happiness: 100,
                smarts: 50,
                looks: 50,
                money: 0,
                lifeStatus: 'Baby'
            },
            lifeLog: [],
            _slotId: 'slot_1'
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Game Saved Successfully' })
        });
        global.fetch = fetchSpy;

        const showModalSpy = jest.spyOn(UI, 'showModal');

        await triggerManualSave();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(showModalSpy).toHaveBeenCalledWith("Save Successful", expect.stringContaining("cloud account"));
    });
});
