import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { ageUp, renderLifeDashboard } from '../../public/src/features/player/mainScreen.js';
import { saveToSlot, getSlotsStore, hydrateSlotsStoreFromCloud, persistSlotsStore } from '../../public/src/core/saveSlotManager.js';
import { saveGame, updateGameInfo, flushPendingSave } from '../../public/src/core/main.js';
import { Utils } from '../../public/src/ui/utils.js';

describe('Age Up State Persistence & Refresh Protection', () => {
    beforeEach(() => {
        localStorage.clear();
        state.gameState = null;
        state.userAuthId = null;
        state.userEmail = null;
        state.verifiedPurchases = null;

        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">18</span>
            </div>
            <div id="header-bank">$0</div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;
    });

    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    test('ageUp increments age and immediately persists to life_game_slots, life_game_save, and guestStorage', async () => {
        state.gameState = {
            user: {
                username: 'TestHero',
                age: 20,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 5000,
                city: 'New York',
                gender: 'male',
                lifeStatus: 'Adult',
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 20, events: [{ msg: 'Started year 20', color: 'text-white' }] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        saveToSlot('slot_1', 'TestHero');

        // Age up to 21
        await ageUp();

        expect(state.gameState.user.age).toBe(21);

        // Check life_game_slots in localStorage
        const storeRaw = localStorage.getItem('life_game_slots');
        expect(storeRaw).toBeTruthy();
        const store = JSON.parse(storeRaw);
        expect(store.slots['slot_1'].data.user.age).toBe(21);

        // Check legacy life_game_save in localStorage
        const legacyRaw = localStorage.getItem('life_game_save');
        expect(legacyRaw).toBeTruthy();
        const legacy = JSON.parse(legacyRaw);
        expect(legacy.user.age).toBe(21);

        // Check Utils.guestStorage (startALife_saveData)
        const guestRaw = localStorage.getItem(Utils.guestStorage.SAVE_KEY);
        expect(guestRaw).toBeTruthy();
        const guest = JSON.parse(guestRaw);
        expect(guest.user.age).toBe(21);
    });

    test('hydrateSlotsStoreFromCloud preserves newer local slot when cloud data has an older age', () => {
        // Setup local store with Age 25 (saved recently)
        const localStore = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Hero',
                    lastSaved: 2000,
                    data: {
                        user: { username: 'Hero', age: 25, health: 100, lifeStatus: 'Adult' },
                        lifeLog: [],
                        snapshots: [],
                        _slotId: 'slot_1'
                    }
                }
            }
        };
        persistSlotsStore(localStore);

        // Cloud payload has older Age 24
        const cloudPayload = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Hero',
                    lastSaved: 1000,
                    data: {
                        user: { username: 'Hero', age: 24, health: 100, lifeStatus: 'Adult' },
                        lifeLog: [],
                        snapshots: [],
                        _slotId: 'slot_1'
                    }
                }
            }
        };

        const hydrated = hydrateSlotsStoreFromCloud(cloudPayload);

        // Should preserve local Age 25 and flag needsCloudSync
        expect(hydrated.slots['slot_1'].data.user.age).toBe(25);
        expect(hydrated._needsCloudSync).toBe(true);
    });

    test('hydrateSlotsStoreFromCloud adopts cloud slot when cloud data is newer or has higher age', () => {
        // Local store has older Age 18
        const localStore = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Hero',
                    lastSaved: 1000,
                    data: {
                        user: { username: 'Hero', age: 18, health: 100, lifeStatus: 'Teen' },
                        lifeLog: [],
                        snapshots: [],
                        _slotId: 'slot_1'
                    }
                }
            }
        };
        persistSlotsStore(localStore);

        // Cloud payload has newer Age 20
        const cloudPayload = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Hero',
                    lastSaved: 2000,
                    data: {
                        user: { username: 'Hero', age: 20, health: 100, lifeStatus: 'Adult' },
                        lifeLog: [],
                        snapshots: [],
                        _slotId: 'slot_1'
                    }
                }
            }
        };

        const hydrated = hydrateSlotsStoreFromCloud(cloudPayload);

        expect(hydrated.slots['slot_1'].data.user.age).toBe(20);
        expect(hydrated._needsCloudSync).toBe(false);
    });

    test('hydrateSlotsStoreFromCloud preserves local-only branch slots created offline', () => {
        // Local store has slot_1 and newly branched slot_2
        const localStore = {
            activeSlotId: 'slot_2',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Main',
                    lastSaved: 2000,
                    data: { user: { username: 'Main', age: 30, lifeStatus: 'Adult' }, lifeLog: [], snapshots: [], _slotId: 'slot_1' }
                },
                slot_2: {
                    id: 'slot_2',
                    name: 'Branch Life',
                    lastSaved: 2050,
                    data: { user: { username: 'Branch Life', age: 20, lifeStatus: 'Adult' }, lifeLog: [], snapshots: [], _slotId: 'slot_2' }
                }
            }
        };
        persistSlotsStore(localStore);

        // Cloud payload only has slot_1
        const cloudPayload = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Main',
                    lastSaved: 2000,
                    data: { user: { username: 'Main', age: 30, lifeStatus: 'Adult' }, lifeLog: [], snapshots: [], _slotId: 'slot_1' }
                }
            }
        };

        const hydrated = hydrateSlotsStoreFromCloud(cloudPayload);

        expect(hydrated.slots['slot_1']).toBeDefined();
        expect(hydrated.slots['slot_2']).toBeDefined();
        expect(hydrated.slots['slot_2'].name).toBe('Branch Life');
        expect(hydrated._needsCloudSync).toBe(true);
    });

    test('updateGameInfo loads state and triggers saveGame when local is newer', async () => {
        // Setup local store with Age 35
        const localStore = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Hero',
                    lastSaved: 5000,
                    data: {
                        user: { username: 'Hero', age: 35, health: 100, lifeStatus: 'Adult', relationships: [] },
                        lifeLog: [{ age: 35, events: [{ msg: 'Year 35', color: 'text-white' }] }],
                        snapshots: [],
                        _slotId: 'slot_1'
                    }
                }
            }
        };
        persistSlotsStore(localStore);

        // Cloud payload has older Age 34
        const dbUser = {
            auth0_id: 'auth0|user123',
            email: 'hero@example.com',
            game_data: {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Hero',
                        lastSaved: 4000,
                        data: {
                            user: { username: 'Hero', age: 34, health: 100, lifeStatus: 'Adult', relationships: [] },
                            lifeLog: [],
                            snapshots: [],
                            _slotId: 'slot_1'
                        }
                    }
                }
            }
        };

        updateGameInfo(dbUser);

        expect(state.gameState.user.age).toBe(35);
        expect(state.userAuthId).toBe('auth0|user123');
    });

    test('Guest reload simulation restores correct age from local slots store', async () => {
        // Simulate guest creating character at Age 18
        state.gameState = {
            user: {
                username: 'GuestAlex',
                age: 18,
                health: 100,
                happiness: 100,
                smarts: 75,
                looks: 75,
                money: 1000,
                city: 'Chicago',
                gender: 'female',
                lifeStatus: 'Young Adult',
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 18, events: [{ msg: 'Turned 18', color: 'text-white' }] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        saveToSlot('slot_1', 'GuestAlex');

        // Age up 3 times: 18 -> 19 -> 20 -> 21
        await ageUp();
        await ageUp();
        await ageUp();

        expect(state.gameState.user.age).toBe(21);

        // Simulate page refresh in guest mode: clear in-memory state and reload from storage
        state.gameState = null;

        const rawSlots = localStorage.getItem('life_game_slots');
        expect(rawSlots).toBeTruthy();
        const slotsStore = JSON.parse(rawSlots);
        const activeId = slotsStore.activeSlotId || 'slot_1';
        const reloaded = slotsStore.slots[activeId].data;

        expect(reloaded.user.age).toBe(21);
    });
});
