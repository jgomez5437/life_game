import { jest } from '@jest/globals';
import { state, setGameState, clearGameState } from '../../public/src/core/state.js';
import { GameLogic } from '../../public/src/core/gameLogic.js';
import { UI } from '../../public/src/ui/ui.js';
import { Utils } from '../../public/src/ui/utils.js';
import {
    migrateState,
    saveToSlot,
    loadSlot,
    getSlotsStore,
    persistSlotsStore,
    hydrateSlotsStoreFromCloud,
    buildCloudSavePayload
} from '../../public/src/core/saveSlotManager.js';
import { captureAnnualSnapshot, rewindToAge } from '../../public/src/core/timeMachine.js';
import { renderDeathScreen, continueAsChild } from '../../public/src/features/player/mainScreen.js';
import { initGame, updateGameInfo, resetGame } from '../../public/src/core/main.js';

describe('Death State Persistence, Cloud Sync Reconciliation & Browser Refresh Suite', () => {

    beforeEach(() => {
        localStorage.clear();
        clearGameState();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-brand"></div>
            <div id="header-user-info" class="hidden">
                <span id="header-name">Player</span>
                <span id="header-age">18</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="health-container"></div>
            <div id="ui-happiness">100%</div>
            <div id="happiness-container"></div>
            <div id="ui-smarts">50%</div>
            <div id="smarts-container"></div>
            <div id="ui-looks">50%</div>
            <div id="looks-container"></div>
            <div id="modal-overlay" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
                <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-5 flex flex-col">
                    <div id="modal-header" class="flex items-center justify-between gap-3 mb-3">
                        <h2 id="modal-title" class="text-xl font-bold text-white">Alert</h2>
                        <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-slate-700/60"></button>
                    </div>
                    <div id="modal-content"></div>
                    <div id="modal-actions"></div>
                </div>
            </div>
        `;
    });

    test('1. migrateState bidirectionally synchronizes isDead, isAlive, lifeStatus, deathCause, and deathAge', () => {
        // Case A: State with only lifeStatus: "Deceased"
        const stateA = {
            user: {
                username: "John Doe",
                age: 4,
                lifeStatus: "Deceased",
                deathCause: "a rare illness"
            }
        };
        const migratedA = migrateState(stateA);
        expect(migratedA.user.lifeStatus).toBe("Deceased");
        expect(migratedA.user.isDead).toBe(true);
        expect(migratedA.user.isAlive).toBe(false);
        expect(migratedA.user.deathCause).toBe("a rare illness");
        expect(migratedA.user.deathAge).toBe(4);

        // Case B: State with only isDead: true
        const stateB = {
            user: {
                username: "Jane Doe",
                age: 28,
                isDead: true,
                deathCause: "a fatal car crash"
            }
        };
        const migratedB = migrateState(stateB);
        expect(migratedB.user.lifeStatus).toBe("Deceased");
        expect(migratedB.user.isDead).toBe(true);
        expect(migratedB.user.isAlive).toBe(false);
        expect(migratedB.user.deathCause).toBe("a fatal car crash");
        expect(migratedB.user.deathAge).toBe(28);

        // Case C: Living character must have isDead: false, isAlive: true, lifeStatus preserved
        const stateC = {
            user: {
                username: "Living Player",
                age: 4,
                lifeStatus: "Toddler",
                health: 100
            }
        };
        const migratedC = migrateState(stateC);
        expect(migratedC.user.lifeStatus).toBe("Toddler");
        expect(migratedC.user.isDead).toBe(false);
        expect(migratedC.user.isAlive).toBe(true);
        expect(migratedC.user.deathCause).toBeNull();
        expect(migratedC.user.deathAge).toBeNull();
    });

    test('2. hydrateSlotsStoreFromCloud preserves newer local deceased state and triggers cloud sync', () => {
        // Local slot has deceased character at age 4 (saved at timestamp 2000)
        const localStore = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Test Life',
                    lastSaved: 2000,
                    data: {
                        user: {
                            username: 'TestHero',
                            age: 4,
                            lifeStatus: 'Deceased',
                            isDead: true,
                            isAlive: false,
                            deathCause: 'a rare illness'
                        },
                        lifeLog: [{ age: 4, events: [{ msg: 'You died.' }] }],
                        snapshots: [{ age: 3 }, { age: 4 }],
                        _slotId: 'slot_1'
                    }
                }
            }
        };
        localStorage.setItem('life_game_slots', JSON.stringify(localStore));

        // Cloud database has older living character at age 2 (saved at timestamp 1000)
        const cloudData = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Test Life',
                    lastSaved: 1000,
                    data: {
                        user: {
                            username: 'TestHero',
                            age: 2,
                            lifeStatus: 'Toddler',
                            isDead: false,
                            health: 100
                        },
                        lifeLog: [{ age: 2, events: [{ msg: 'Walking' }] }],
                        snapshots: [{ age: 1 }, { age: 2 }],
                        _slotId: 'slot_1'
                    }
                }
            }
        };

        const hydrated = hydrateSlotsStoreFromCloud(cloudData, false);

        // Crucial check: local deceased save must NOT be overwritten with older living cloud save
        expect(hydrated.slots['slot_1'].data.user.lifeStatus).toBe('Deceased');
        expect(hydrated.slots['slot_1'].data.user.age).toBe(4);
        expect(hydrated.slots['slot_1'].data.user.deathCause).toBe('a rare illness');
        expect(hydrated._needsCloudSync).toBe(true);
    });

    test('3. Authenticated refresh with deceased cloud data locks directly to Death Screen', async () => {
        const deadCloudUser = {
            auth0_id: 'auth0|user123',
            email: 'player@example.com',
            game_data: {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Hero',
                        lastSaved: Date.now(),
                        data: {
                            user: {
                                username: 'Hero',
                                age: 4,
                                lifeStatus: 'Deceased',
                                isDead: true,
                                isAlive: false,
                                deathCause: 'complications at birth.',
                                money: 500,
                                relationships: []
                            },
                            lifeLog: [{ age: 4, events: [{ msg: 'You died.', color: 'text-red-500' }] }],
                            snapshots: [],
                            _slotId: 'slot_1'
                        }
                    }
                }
            }
        };

        await updateGameInfo(deadCloudUser);

        expect(state.gameState.user.lifeStatus).toBe('Deceased');
        expect(state.gameState.user.isDead).toBe(true);
        expect(state.gameState.user.age).toBe(4);

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('You Died');
        expect(container.innerHTML).toContain('Age 4');
        expect(container.innerHTML).toContain('complications at birth.');
    });

    test('4. Guest refresh with deceased save preserves state and locks to Death Screen (not login screen)', async () => {
        const guestDeadState = {
            user: {
                username: 'Guest Hero',
                age: 4,
                lifeStatus: 'Deceased',
                isDead: true,
                isAlive: false,
                deathCause: 'a tragic childhood accident.',
                money: 0,
                relationships: []
            },
            lifeLog: [{ age: 4, events: [{ msg: 'You died.' }] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const store = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Guest Hero',
                    lastSaved: Date.now(),
                    data: guestDeadState
                }
            }
        };
        localStorage.setItem('life_game_slots', JSON.stringify(store));

        state.auth0Client = {
            isAuthenticated: async () => false
        };

        await initGame();

        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.lifeStatus).toBe('Deceased');
        expect(state.gameState.user.isDead).toBe(true);
        expect(state.gameState.user.age).toBe(4);

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('You Died');
        expect(container.innerHTML).toContain('Age 4');
        expect(container.innerHTML).toContain('a tragic childhood accident.');
    });

    test('5. loadSlot does NOT revive a deceased character with past annual snapshots', () => {
        const deadSlotData = {
            user: {
                username: 'Slot Player',
                age: 4,
                lifeStatus: 'Deceased',
                isDead: true,
                isAlive: false,
                deathCause: 'a rare illness'
            },
            snapshots: [
                { age: 0, data: { user: { username: 'Slot Player', age: 0, lifeStatus: 'Baby' } } },
                { age: 1, data: { user: { username: 'Slot Player', age: 1, lifeStatus: 'Baby' } } },
                { age: 2, data: { user: { username: 'Slot Player', age: 2, lifeStatus: 'Toddler' } } },
                { age: 3, data: { user: { username: 'Slot Player', age: 3, lifeStatus: 'Toddler' } } },
                { age: 4, data: { user: { username: 'Slot Player', age: 4, lifeStatus: 'Toddler' } } }
            ],
            lifeLog: [],
            _slotId: 'slot_1'
        };

        const store = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Slot Player',
                    lastSaved: Date.now(),
                    data: deadSlotData
                }
            }
        };
        localStorage.setItem('life_game_slots', JSON.stringify(store));

        loadSlot('slot_1');

        expect(state.gameState.user.lifeStatus).toBe('Deceased');
        expect(state.gameState.user.isDead).toBe(true);
        expect(state.gameState.user.isAlive).toBe(false);
        expect(state.gameState.user.age).toBe(4);
    });

    test('6. rewindToAge (Time Machine) successfully revives deceased character with valid lifeStatus', () => {
        // Unlock time machine
        state.verifiedPurchases = ['time_machine'];

        const deadState = {
            user: {
                username: 'Doctor Who',
                age: 4,
                lifeStatus: 'Deceased',
                isDead: true,
                isAlive: false,
                deathCause: 'a tragic accident'
            },
            snapshots: [
                { age: 0, data: { user: { username: 'Doctor Who', age: 0, lifeStatus: 'Baby' } } },
                { age: 1, data: { user: { username: 'Doctor Who', age: 1, lifeStatus: 'Baby' } } },
                { age: 2, data: { user: { username: 'Doctor Who', age: 2, lifeStatus: 'Toddler' } } },
                { age: 3, data: { user: { username: 'Doctor Who', age: 3, lifeStatus: 'Toddler' } } }
            ],
            lifeLog: [{ age: 0 }, { age: 1 }, { age: 2 }, { age: 3 }, { age: 4 }],
            _slotId: 'slot_1'
        };

        setGameState(deadState);

        rewindToAge(2);

        expect(state.gameState.user.age).toBe(2);
        expect(state.gameState.user.isDead).toBe(false);
        expect(state.gameState.user.isAlive).toBe(true);
        expect(state.gameState.user.lifeStatus).toBe('Toddler');
        expect(state.gameState.user.deathCause).toBeUndefined();
        expect(state.gameState.user.deathAge).toBeUndefined();
    });

    test('7. continueAsChild isolates child generation, resets snapshots, and starts fresh timeline', () => {
        const parentState = {
            username: 'Parent Hero',
            age: 60,
            lifeStatus: 'Deceased',
            isDead: true,
            isAlive: false,
            deathCause: 'natural causes',
            generation: 1,
            money: 500000,
            city: 'Chicago',
            relationships: [
                { id: 'child_1', name: 'Junior Hero', type: 'Son', category: 'child', age: 10 }
            ]
        };

        setGameState({
            user: parentState,
            lifeLog: [{ age: 60, events: [{ msg: 'Died of natural causes.' }] }],
            snapshots: [{ age: 56 }, { age: 57 }, { age: 58 }, { age: 59 }, { age: 60 }],
            _slotId: 'slot_1'
        });

        continueAsChild(0, 500000);

        const childUser = state.gameState.user;
        expect(childUser.username).toBe('Junior Hero');
        expect(childUser.age).toBe(10);
        expect(childUser.generation).toBe(2);
        expect(childUser.isDead).toBe(false);
        expect(childUser.isAlive).toBe(true);
        expect(childUser.lifeStatus).toBe('Student');
        expect(childUser.money).toBe(500000);

        // Snapshots must be cleanly initialized with only child's age 10 snapshot
        expect(state.gameState.snapshots.length).toBe(1);
        expect(state.gameState.snapshots[0].age).toBe(10);
    });

    test('8. resetGame completely obliterates save slots and allows starting fresh life', async () => {
        const store = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: 'Dead Character',
                    data: { user: { username: 'Dead', age: 4, lifeStatus: 'Deceased' } }
                }
            }
        };
        localStorage.setItem('life_game_slots', JSON.stringify(store));
        localStorage.setItem('life_game_save', JSON.stringify(store.slots.slot_1.data));

        state.gameState = { user: { username: 'Dead', age: 4, lifeStatus: 'Deceased' } };

        await resetGame();

        expect(state.gameState).toBeNull();
        expect(localStorage.getItem('life_game_slots')).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();
    });
});
