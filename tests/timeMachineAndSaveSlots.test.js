import { state, hasPurchasedPack } from '../public/src/core/state.js';
import { captureAnnualSnapshot, rewindToAge, MAX_SNAPSHOTS } from '../public/src/core/timeMachine.js';
import { getSlotsStore, saveToSlot, loadSlot, branchCurrentSave, deleteSlot, persistSlotsStore, startNewLifeInNewSlot, isValidSlotId, isQuotaExceededError, attemptStoreCompaction, deepClone, sanitizeGameState, hydrateSlotsStoreFromCloud, buildCloudSavePayload, migrateState } from '../public/src/core/saveSlotManager.js';
import { isValidSlotId as apiIsValidSlotId, hasDangerousKeys, isValidSnapshotsArray, isValidSlotsObject, validateGameStateSchema } from '../api/lib/validation.js';
import '../public/src/features/player/mainScreen.js';
import '../public/src/features/player/charCreationScreen.js';

describe('Time Machine & Multi-Save Slots Engine', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">20</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'Time Traveler',
                age: 20,
                money: 10000,
                health: 90,
                happiness: 85,
                purchases: []
            },
            lifeLog: [{ age: 20, events: ['Started college'] }],
            snapshots: []
        };
        localStorage.clear();
        window.saveGame = () => {};
        window.renderLifeDashboard = () => {};
        window.renderCharCreation = () => {};
    });

    describe('Time Machine Snapshot Engine', () => {
        test('captureAnnualSnapshot stores up to MAX_SNAPSHOTS (5) across 50 simulated years', () => {
            for (let age = 20; age <= 70; age++) {
                state.gameState.user.age = age;
                state.gameState.user.money += 5000;
                state.gameState.lifeLog.push({ age, events: [`Year ${age} event`] });
                captureAnnualSnapshot(state.gameState);
            }

            expect(state.gameState.snapshots.length).toBe(MAX_SNAPSHOTS);
            expect(state.gameState.snapshots[state.gameState.snapshots.length - 1].age).toBe(70);
            expect(state.gameState.snapshots[0].age).toBe(66);
        });

        test('captureAnnualSnapshot prunes history inside clone and strips recursive snapshots', () => {
            state.gameState.lifeLog = [
                { age: 18, events: ['High school graduation'] },
                { age: 19, events: ['Gap year'] },
                { age: 20, events: ['Started college'] },
                { age: 25, events: ['Future event'] }
            ];
            state.gameState.user.age = 20;

            captureAnnualSnapshot(state.gameState);

            const snapshot = state.gameState.snapshots[0];
            expect(snapshot.data.snapshots).toBeUndefined();
            expect(snapshot.data.lifeLog.length).toBe(3); // only ages 18, 19, 20
            expect(snapshot.data.lifeLog.find(l => l.age === 25)).toBeUndefined();
        });

        test('isValidSnapshotsArray validates bounded snapshot arrays', () => {
            expect(isValidSnapshotsArray(null)).toBe(true);
            expect(isValidSnapshotsArray(undefined)).toBe(true);
            expect(isValidSnapshotsArray([
                { age: 20, summary: {}, data: {} },
                { age: 21, summary: {}, data: {} }
            ])).toBe(true);

            // Rejects arrays longer than limit
            const oversized = Array.from({ length: 15 }, (_, i) => ({ age: i, data: {} }));
            expect(isValidSnapshotsArray(oversized, 10)).toBe(false);

            // Rejects invalid items
            expect(isValidSnapshotsArray(['not an object'])).toBe(false);
            expect(isValidSnapshotsArray([{ age: 'invalid' }])).toBe(false);
            expect(isValidSnapshotsArray([{ age: -5 }])).toBe(false);
        });

        test('rewindToAge requires time_machine entitlement', () => {
            state.gameState.user.age = 25;
            captureAnnualSnapshot(state.gameState);
            state.gameState.user.age = 26;
            captureAnnualSnapshot(state.gameState);

            state.gameState.user.purchases = []; // Not owned
            expect(hasPurchasedPack('time_machine')).toBe(false);

            rewindToAge(25);
            // Without entitlement, age should remain unchanged at 26
            expect(state.gameState.user.age).toBe(26);
        });

        test('rewindToAge successfully restores past state when owned', () => {
            state.gameState.user.purchases = ['time_machine'];
            state.gameState.user.age = 25;
            state.gameState.user.money = 50000;
            captureAnnualSnapshot(state.gameState);

            state.gameState.user.age = 26;
            state.gameState.user.money = 100000;
            captureAnnualSnapshot(state.gameState);

            expect(state.gameState.user.age).toBe(26);

            rewindToAge(25);

            expect(state.gameState.user.age).toBe(25);
            expect(state.gameState.user.money).toBe(50000);
            expect(state.gameState.user.lifeStatus).toBe('Alive');
        });
    });

    describe('Multi-Save Slot Manager', () => {
        test('getSlotsStore migrates single legacy save into slot_1 automatically', () => {
            state.gameState = null;
            const legacyData = {
                user: { username: 'Legacy Player', age: 30, money: 200000 }
            };
            localStorage.setItem('life_game_save', JSON.stringify(legacyData));

            const store = getSlotsStore();
            expect(store.activeSlotId).toBe('slot_1');
            expect(store.slots['slot_1']).toBeDefined();
            expect(store.slots['slot_1'].name).toBe('Legacy Player');
            expect(store.slots['slot_1'].data.user.money).toBe(200000);
        });

        test('branchCurrentSave blocks creating >1 slot for non-paid users', () => {
            state.gameState.user.purchases = [];
            saveToSlot('slot_1', 'Main Save');

            branchCurrentSave('Second Slot');

            const store = getSlotsStore();
            expect(Object.keys(store.slots).length).toBe(1);
        });

        test('branchCurrentSave creates new branch slot for paid users', () => {
            state.gameState.user.purchases = ['time_machine'];
            saveToSlot('slot_1', 'Main Save');

            branchCurrentSave('Branch 2');

            const store = getSlotsStore();
            expect(Object.keys(store.slots).length).toBe(2);
        });

        test('branchCurrentSave enforces MAX_SLOTS limit of 10 slots', () => {
            state.gameState.user.purchases = ['time_machine'];
            for (let i = 1; i <= 10; i++) {
                saveToSlot(`slot_${i}`, `Save ${i}`);
            }

            branchCurrentSave('Eleventh Slot');

            const store = getSlotsStore();
            expect(Object.keys(store.slots).length).toBe(10);
        });

        test('startNewLifeInNewSlot creates new slot for fresh character', () => {
            state.gameState.user.purchases = ['time_machine'];
            saveToSlot('slot_1', 'Character 1');

            startNewLifeInNewSlot();

            const store = getSlotsStore();
            expect(Object.keys(store.slots).length).toBe(2);
            expect(state.gameState).toBeNull();
        });

        test('deleteSlot removes slot but enforces keeping at least 1 slot', () => {
            const store = {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: { id: 'slot_1', name: 'Main', data: state.gameState }
                }
            };
            persistSlotsStore(store);

            deleteSlot('slot_1');
            const updated = getSlotsStore();
            expect(Object.keys(updated.slots).length).toBe(1);
        });

        test('isValidSlotId validates correct slot formats and rejects malicious strings', () => {
            expect(isValidSlotId('slot_1')).toBe(true);
            expect(isValidSlotId('slot_10')).toBe(true);
            expect(isValidSlotId('slot_1710000000000')).toBe(true);
            expect(isValidSlotId(0)).toBe(true);
            expect(isValidSlotId(9)).toBe(true);
            expect(isValidSlotId('5')).toBe(true);

            expect(isValidSlotId('__proto__')).toBe(false);
            expect(isValidSlotId('constructor')).toBe(false);
            expect(isValidSlotId('prototype')).toBe(false);
            expect(isValidSlotId('slot_99999999999999999999')).toBe(false);
            expect(isValidSlotId('../../etc/passwd')).toBe(false);
            expect(isValidSlotId(null)).toBe(false);
            expect(isValidSlotId(undefined)).toBe(false);
            expect(isValidSlotId({})).toBe(false);
        });

        test('server-side isValidSlotId accepts optional/valid slots and rejects malicious patterns', () => {
            expect(apiIsValidSlotId(null)).toBe(true);
            expect(apiIsValidSlotId(undefined)).toBe(true);
            expect(apiIsValidSlotId('slot_1')).toBe(true);
            expect(apiIsValidSlotId('slot_10')).toBe(true);
            expect(apiIsValidSlotId('slot_1710000000000')).toBe(true);
            expect(apiIsValidSlotId('__proto__')).toBe(false);
            expect(apiIsValidSlotId('constructor')).toBe(false);
            expect(apiIsValidSlotId('prototype')).toBe(false);
        });

        test('hasDangerousKeys detects prototype pollution keys recursively', () => {
            expect(hasDangerousKeys({ name: 'Valid Player', age: 25 })).toBe(false);
            expect(hasDangerousKeys({ nested: { deep: { ok: 123 } } })).toBe(false);

            expect(hasDangerousKeys(JSON.parse('{"__proto__": {"admin": true}}'))).toBe(true);
            expect(hasDangerousKeys(JSON.parse('{"constructor": {"name": "exploit"}}'))).toBe(true);
            expect(hasDangerousKeys(JSON.parse('{"prototype": {}}'))).toBe(true);
            expect(hasDangerousKeys(JSON.parse('{"nested": {"__proto__": {}}}'))).toBe(true);
        });

        test('getSlotsStore purges dangerous keys from localStorage', () => {
            const maliciousStoreJson = JSON.stringify({
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: { id: 'slot_1', name: 'Main', data: state.gameState },
                    '__proto__': { id: '__proto__', name: 'Exploit', data: {} }
                }
            });
            localStorage.setItem('life_game_slots', maliciousStoreJson);

            const store = getSlotsStore();
            expect(Object.prototype.hasOwnProperty.call(store.slots, '__proto__')).toBe(false);
            expect(store.slots['slot_1']).toBeDefined();
        });

        test('isQuotaExceededError identifies standard browser quota error signatures', () => {
            expect(isQuotaExceededError(null)).toBe(false);
            expect(isQuotaExceededError(new Error('Generic error'))).toBe(false);

            const quotaErr1 = new Error('Quota exceeded');
            quotaErr1.name = 'QuotaExceededError';
            expect(isQuotaExceededError(quotaErr1)).toBe(true);

            const quotaErr2 = new Error('NS_ERROR');
            quotaErr2.code = 22;
            expect(isQuotaExceededError(quotaErr2)).toBe(true);
        });

        test('attemptStoreCompaction prunes inactive slot snapshots and removes duplicate legacy keys', () => {
            localStorage.setItem('life_game_save', '{"legacy":true}');
            localStorage.setItem('startALife_saveData', '{"legacy":true}');

            const bloatedStore = {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        data: {
                            snapshots: [{ age: 20 }, { age: 21 }, { age: 22 }]
                        }
                    },
                    slot_2: {
                        id: 'slot_2',
                        data: {
                            snapshots: [{ age: 30 }, { age: 31 }, { age: 32 }],
                            lifeLog: Array.from({ length: 50 }, (_, i) => ({ age: i, events: ['event'] }))
                        }
                    }
                }
            };

            const didCompact = attemptStoreCompaction(bloatedStore);
            expect(didCompact).toBe(true);
            expect(localStorage.getItem('life_game_save')).toBeNull();
            expect(localStorage.getItem('startALife_saveData')).toBeNull();
            expect(bloatedStore.slots['slot_1'].data.snapshots.length).toBe(1);
            expect(bloatedStore.slots['slot_2'].data.snapshots.length).toBe(1);
            expect(bloatedStore.slots['slot_2'].data.lifeLog.length).toBe(30);
        });

        test('persistSlotsStore auto-recovers when QuotaExceededError is thrown on initial save', () => {
            let attempt = 0;
            const originalSetItem = Storage.prototype.setItem;

            const store = {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: { id: 'slot_1', name: 'Main', data: { snapshots: [{ age: 10 }, { age: 11 }] } }
                }
            };

            // Override Storage.prototype.setItem to throw QuotaExceeded on first try, succeed on second (after compaction)
            Storage.prototype.setItem = function (key, val) {
                attempt++;
                if (attempt === 1) {
                    const err = new Error('Quota exceeded');
                    err.name = 'QuotaExceededError';
                    throw err;
                }
                return originalSetItem.call(this, key, val);
            };

            try {
                const result = persistSlotsStore(store);
                expect(result.success).toBe(true);
                expect(result.compacted).toBe(true);
            } finally {
                Storage.prototype.setItem = originalSetItem;
            }
        });

        test('deleteSlot syncs state.gameState._slotId when active slot is deleted', () => {
            const store = getSlotsStore();
            // Create two slots
            store.slots['slot_1'] = { id: 'slot_1', name: 'Life A', lastSaved: Date.now(), data: { user: { name: 'A' } } };
            store.slots['slot_2'] = { id: 'slot_2', name: 'Life B', lastSaved: Date.now(), data: { user: { name: 'B' } } };
            store.activeSlotId = 'slot_1';
            persistSlotsStore(store);

            // Set the in-memory slotId to slot_1
            state.gameState = { _slotId: 'slot_1', user: { name: 'A', age: 20, health: 100 } };

            // Delete the active slot
            deleteSlot('slot_1', true);

            // _slotId should now point to the new active slot, not the deleted one
            expect(state.gameState._slotId).not.toBe('slot_1');
            expect(state.gameState._slotId).toBe('slot_2');
        });
    });

    describe('Deep Clone & Infinity/NaN/undefined State Sanitization (H-10)', () => {
        test('deepClone creates an independent copy and does not mutate source', () => {
            const original = {
                user: { name: 'Player', stats: { money: 1000 } },
                inventory: ['car', 'house']
            };
            const clone = deepClone(original);

            expect(clone).toEqual(original);
            expect(clone).not.toBe(original);
            expect(clone.user).not.toBe(original.user);
            expect(clone.inventory).not.toBe(original.inventory);

            clone.user.stats.money = 9999;
            clone.inventory.push('yacht');
            expect(original.user.stats.money).toBe(1000);
            expect(original.inventory.length).toBe(2);
        });

        test('sanitizeGameState clamps Infinity to Number.MAX_SAFE_INTEGER and NaN to 0', () => {
            const malformedState = {
                user: {
                    money: Infinity,
                    debt: -Infinity,
                    health: NaN,
                    business: {
                        valuation: Infinity,
                        revenue: 5000000
                    }
                },
                lifeLog: [
                    { age: 20, netWorth: Infinity, score: NaN }
                ]
            };

            const clean = sanitizeGameState(malformedState);

            expect(clean.user.money).toBe(Number.MAX_SAFE_INTEGER);
            expect(clean.user.debt).toBe(-Number.MAX_SAFE_INTEGER);
            expect(clean.user.health).toBe(0);
            expect(clean.user.business.valuation).toBe(Number.MAX_SAFE_INTEGER);
            expect(clean.user.business.revenue).toBe(5000000);
            expect(clean.lifeLog[0].netWorth).toBe(Number.MAX_SAFE_INTEGER);
            expect(clean.lifeLog[0].score).toBe(0);
        });

        test('sanitizeGameState strips prototype pollution keys recursively', () => {
            const dirty = {
                normal: 'val',
                '__proto__': { polluted: true },
                nested: {
                    'constructor': { exploit: true },
                    safe: 123
                }
            };
            const clean = sanitizeGameState(dirty);
            expect(Object.prototype.hasOwnProperty.call(clean, '__proto__')).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(clean.nested, 'constructor')).toBe(false);
            expect(clean.normal).toBe('val');
            expect(clean.nested.safe).toBe(123);
        });

        test('saveToSlot and loadSlot preserve non-finite values safely without converting to null', () => {
            state.gameState = {
                user: {
                    username: 'Trillionaire',
                    age: 45,
                    money: Infinity, // Extreme business valuation or infinite wealth
                    happiness: NaN,   // Uninitialized / corrupted stat
                    businessValuation: Infinity
                },
                snapshots: []
            };

            saveToSlot('slot_1', 'Trillionaire Run');

            // Verify stored JSON in localStorage did not write null
            const raw = localStorage.getItem('life_game_slots');
            expect(raw).not.toBeNull();
            const parsedStore = JSON.parse(raw);
            const slotData = parsedStore.slots['slot_1'].data;

            expect(slotData.user.money).toBe(Number.MAX_SAFE_INTEGER);
            expect(slotData.user.happiness).toBe(0);
            expect(slotData.user.businessValuation).toBe(Number.MAX_SAFE_INTEGER);
            expect(slotData.user.money).not.toBeNull();
            expect(slotData.user.happiness).not.toBeNull();

            // Load slot back into active game state
            loadSlot('slot_1');

            expect(state.gameState.user.money).toBe(Number.MAX_SAFE_INTEGER);
            expect(state.gameState.user.happiness).toBe(0);

            // Verify financial arithmetic after loading does NOT propagate NaN
            const interest = state.gameState.user.money * 0.05;
            expect(Number.isFinite(interest)).toBe(true);
            expect(Number.isNaN(interest)).toBe(false);

            const total = state.gameState.user.money + 10000;
            expect(Number.isNaN(total)).toBe(false);
        });

        test('timeMachine captureAnnualSnapshot and rewindToAge handle extreme values safely', () => {
            state.gameState = {
                user: {
                    username: 'Snapshot Test',
                    age: 30,
                    money: Infinity,
                    health: NaN,
                    purchases: ['time_machine']
                },
                snapshots: []
            };

            captureAnnualSnapshot(state.gameState);

            expect(state.gameState.snapshots.length).toBe(1);
            const snap = state.gameState.snapshots[0];
            expect(snap.data.user.money).toBe(Number.MAX_SAFE_INTEGER);
            expect(snap.data.user.health).toBe(0);

            state.gameState.user.age = 31;
            state.gameState.user.money = 500;
            captureAnnualSnapshot(state.gameState);

            rewindToAge(30);

            expect(state.gameState.user.age).toBe(30);
            expect(state.gameState.user.money).toBe(Number.MAX_SAFE_INTEGER);
            expect(state.gameState.user.health).toBe(0);
            expect(state.gameState.user.money).not.toBeNull();
        });
    });

    describe('More Dashboard & God Mode Control Center', () => {
        test('renderMoreDashboard includes God Perks & Temporal Power section at bottom with God Mode and Time Machine', async () => {
            const { renderMoreDashboard } = await import('../public/src/features/more/moreScreen.js');
            renderMoreDashboard();

            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('God Perks &amp; Temporal Power');
            expect(container.innerHTML).toContain('openGodModeHubModal');
            expect(container.innerHTML).toContain('openTimeMachineModal');
            expect(container.innerHTML).not.toContain('renderInstantDiplomaHub');
        });

        test('openGodModeHubModal renders control studio modal when owned', async () => {
            const { openGodModeHubModal } = await import('../public/src/features/store/storeScreen.js');
            state.gameState.user.purchases = ['god_mode'];

            openGodModeHubModal();

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');
            expect(title.innerText).toBe('God Mode Control Center');
            expect(content.innerHTML).toContain('Core Stat Editor');
            expect(content.innerHTML).toContain('Avatar Appearance Studio');
        });
    });

    describe('H-15 Multi-Slot Cloud Sync & Device Switch Engine', () => {
        test('buildCloudSavePayload includes all slots in store, activeSlotId, and active character summary', () => {
            state.gameState = {
                _slotId: 'slot_1',
                user: { username: 'Pilot', age: 30, money: 150000, jobTitle: 'Airline Captain', jobSalary: 120000, purchases: ['time_machine'] },
                lifeLog: [{ age: 30, events: ['Landed in Tokyo'] }],
                snapshots: [{ age: 29, data: {} }]
            };
            saveToSlot('slot_1', 'Pilot Career');

            // Create second and third slots
            saveToSlot('slot_2', 'Doctor Career');
            const store = getSlotsStore();
            store.slots['slot_2'].data = {
                user: { username: 'Surgeon', age: 35, money: 300000, jobTitle: 'Neurosurgeon' },
                lifeLog: [{ age: 35, events: ['Completed surgery'] }]
            };
            store.activeSlotId = 'slot_1';
            state.gameState._slotId = 'slot_1';
            persistSlotsStore(store);

            loadSlot('slot_1');
            const payload = buildCloudSavePayload(state.gameState);

            expect(payload._slotId).toBe('slot_1');
            expect(payload.activeSlotId).toBe('slot_1');
            expect(payload.slots).toBeDefined();
            expect(Object.keys(payload.slots).length).toBe(2);
            expect(payload.slots['slot_1'].name).toBe('Pilot Career');
            expect(payload.slots['slot_2'].name).toBe('Doctor Career');
            expect(payload.slots['slot_2'].data.user.jobTitle).toBe('Neurosurgeon');

            // Top-level active slot helpers
            expect(payload.user.username).toBe('Pilot');
            expect(payload.bank).toBe(150000);
            expect(payload.job.title).toBe('Airline Captain');
            expect(payload.stats.age).toBe(30);
        });

        test('hydrateSlotsStoreFromCloud restores all save slots into localStorage on a new device (Device B)', () => {
            // Simulate fresh device environment (empty localStorage)
            localStorage.clear();

            const cloudPayload = {
                activeSlotId: 'slot_2',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Main Life',
                        lastSaved: 1000,
                        data: {
                            user: { username: 'Device A Character 1', age: 25, money: 50000 },
                            lifeLog: [{ age: 25, events: ['Event 1'] }],
                            snapshots: []
                        }
                    },
                    slot_2: {
                        id: 'slot_2',
                        name: 'Branch Character 2',
                        lastSaved: 2000,
                        data: {
                            user: { username: 'Device A Character 2', age: 40, money: 200000 },
                            lifeLog: [{ age: 40, events: ['Event 2'] }],
                            snapshots: []
                        }
                    },
                    slot_3: {
                        id: 'slot_3',
                        name: 'Criminal Branch',
                        lastSaved: 3000,
                        data: {
                            user: { username: 'Device A Character 3', age: 22, money: 5000 },
                            lifeLog: [{ age: 22, events: ['Event 3'] }],
                            snapshots: []
                        }
                    }
                },
                user: { username: 'Device A Character 2', age: 40, money: 200000 }
            };

            const hydratedStore = hydrateSlotsStoreFromCloud(cloudPayload);

            expect(hydratedStore.activeSlotId).toBe('slot_2');
            expect(Object.keys(hydratedStore.slots).length).toBe(3);
            expect(hydratedStore.slots['slot_1'].name).toBe('Main Life');
            expect(hydratedStore.slots['slot_2'].name).toBe('Branch Character 2');
            expect(hydratedStore.slots['slot_3'].name).toBe('Criminal Branch');

            // Verify persisted in localStorage
            const localStore = getSlotsStore();
            expect(Object.keys(localStore.slots).length).toBe(3);
            expect(localStore.activeSlotId).toBe('slot_2');
            expect(localStore.slots['slot_3'].data.user.money).toBe(5000);
        });

        test('hydrateSlotsStoreFromCloud seamlessly migrates legacy single-slot cloud saves into slot_1', () => {
            localStorage.clear();

            const legacyCloudPayload = {
                user: { username: 'Legacy Cloud Player', age: 50, money: 1000000 },
                history: [{ age: 50, events: [{ msg: 'Retired' }] }],
                stats: { age: 50, health: 80, happiness: 90, smarts: 70, looks: 60 }
            };

            const hydratedStore = hydrateSlotsStoreFromCloud(legacyCloudPayload);

            expect(hydratedStore.activeSlotId).toBe('slot_1');
            expect(hydratedStore.slots['slot_1']).toBeDefined();
            expect(hydratedStore.slots['slot_1'].name).toBe('Legacy Cloud Player');
            expect(hydratedStore.slots['slot_1'].data.user.money).toBe(1000000);
        });

        test('isValidSlotsObject validates slots dictionary and blocks invalid payloads', () => {
            expect(isValidSlotsObject(null)).toBe(true);
            expect(isValidSlotsObject(undefined)).toBe(true);
            expect(isValidSlotsObject({})).toBe(true);

            const validSlots = {
                slot_1: { id: 'slot_1', name: 'Main', lastSaved: 1000, data: { user: { name: 'Player' } } },
                slot_2: { id: 'slot_2', name: 'Second', lastSaved: 2000, data: { snapshots: [{ age: 20, data: {} }] } }
            };
            expect(isValidSlotsObject(validSlots)).toBe(true);

            // Rejects arrays or non-objects
            expect(isValidSlotsObject(['not an object'])).toBe(false);
            expect(isValidSlotsObject('string')).toBe(false);

            // Rejects more than max allowed slots (10)
            const oversized = {};
            for (let i = 1; i <= 15; i++) {
                oversized[`slot_${i}`] = { id: `slot_${i}`, name: `Slot ${i}`, data: {} };
            }
            expect(isValidSlotsObject(oversized, 10)).toBe(false);

            // Rejects invalid slot ID keys / prototype pollution
            expect(isValidSlotsObject(JSON.parse('{"__proto__": {"id": "__proto__"}}'))).toBe(false);
            expect(isValidSlotsObject({ 'invalid_key': { id: 'invalid_key' } })).toBe(false);

            // Rejects invalid nested snapshots array
            const invalidSnapshotsSlot = {
                slot_1: {
                    id: 'slot_1',
                    name: 'Bad Snapshots',
                    data: {
                        snapshots: Array.from({ length: 20 }, (_, i) => ({ age: i, data: {} }))
                    }
                }
            };
            expect(isValidSlotsObject(invalidSnapshotsSlot)).toBe(false);
        });

        test('branchCurrentSave, deleteSlot, startNewLifeInNewSlot, and loadSlot trigger cloud sync for authenticated users', () => {
            state.userAuthId = 'auth0|123456789';
            state.gameState.user.purchases = ['time_machine'];

            let saveGameCalls = 0;
            window.saveGame = () => { saveGameCalls++; };

            saveToSlot('slot_1', 'Slot 1');
            saveGameCalls = 0;

            // 1. Branch save
            branchCurrentSave('Branch 2');
            expect(saveGameCalls).toBe(1);

            // 2. Load slot
            loadSlot('slot_1');
            expect(saveGameCalls).toBe(2);

            // 3. Start new life in new slot
            startNewLifeInNewSlot();
            expect(saveGameCalls).toBe(3);

            // 4. Delete slot (trigger confirm)
            deleteSlot('slot_1');
            const confirmBtn = document.getElementById('modal-confirm');
            if (confirmBtn) confirmBtn.click();
            expect(saveGameCalls).toBe(4);
        });
    });

    describe('State Migration & Schema Validation (H-11)', () => {
        test('migrateState returns null for non-object inputs', () => {
            expect(migrateState(null)).toBeNull();
            expect(migrateState(undefined)).toBeNull();
            expect(migrateState('string')).toBeNull();
            expect(migrateState(123)).toBeNull();
        });

        test('migrateState backfills missing properties for legacy flat user saves (v1.0.0 schema)', () => {
            const legacySave = {
                username: 'Old Player',
                age: 28,
                money: 75000,
                health: 95
            };

            const migrated = migrateState(legacySave);

            expect(migrated).not.toBeNull();
            expect(migrated.user.username).toBe('Old Player');
            expect(migrated.user.age).toBe(28);
            expect(migrated.user.money).toBe(75000);
            expect(migrated.user.health).toBe(95);
            expect(migrated.user.happiness).toBe(100);
            expect(migrated.user.smarts).toBe(50);
            expect(migrated.user.looks).toBe(50);
            expect(migrated.user.lifeStatus).toBe('Adult');
            expect(migrated.user.isDead).toBe(false);
            expect(migrated.user.city).toBe('New York');

            // Business defaults
            expect(migrated.user.hasBusiness).toBe(false);
            expect(migrated.user.isPublic).toBe(false);
            expect(migrated.user.marketingLevels).toEqual({ social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 });
            expect(migrated.user.teamRoles).toEqual({ engineering: 2, sales: 1, operations: 1, marketing: 1 });
            expect(migrated.user.corporateDebt).toEqual({ principal: 0, interestRate: 0.08, monthlyPayment: 0 });
            expect(migrated.user.investorShares).toEqual([]);
            expect(migrated.user.customerSatisfaction).toBe(75);
            expect(migrated.user.employeeMorale).toBe(80);

            // Prison defaults
            expect(migrated.user.inPrison).toBe(false);
            expect(migrated.user.prisonStats).toBeNull();
            expect(migrated.user.yardInmates).toEqual([]);

            // Lineage & collections
            expect(migrated.user.purchases).toEqual([]);
            expect(migrated.user.pastLives).toEqual([]);
            expect(migrated.user.generation).toBe(1);
            expect(migrated.lifeLog.length).toBeGreaterThan(0);
            expect(migrated.snapshots).toEqual([]);
            expect(migrated._slotId).toBe('slot_1');
        });

        test('migrateState handles business saves and backfills missing overhaul fields without mutating existing business data', () => {
            const partialBusinessState = {
                user: {
                    username: 'Startup Founder',
                    age: 32,
                    hasBusiness: true,
                    companyName: 'Acme Corp',
                    compCash: 250000,
                    companyYear: 3,
                    companyQuarter: 2,
                    employees: 10
                    // Missing: isPublic, marketingLevels, teamRoles, corporateDebt, investorShares, customerSatisfaction, employeeMorale
                }
            };

            const migrated = migrateState(partialBusinessState);

            expect(migrated.user.hasBusiness).toBe(true);
            expect(migrated.user.companyName).toBe('Acme Corp');
            expect(migrated.user.compCash).toBe(250000);
            expect(migrated.user.companyYear).toBe(3);
            expect(migrated.user.companyQuarter).toBe(2);
            expect(migrated.user.employees).toBe(10);
            expect(migrated.user.isPublic).toBe(false);
            expect(migrated.user.equityOwned).toBe(1.0);
            expect(migrated.user.customerSatisfaction).toBe(75);
            expect(migrated.user.employeeMorale).toBe(80);
            expect(migrated.user.marketingLevels.social_ads).toBe(0);
            expect(migrated.user.teamRoles.engineering).toBe(2);
            expect(migrated.user.corporateDebt.principal).toBe(0);
        });

        test('migrateState safely backfills prisonStats when inPrison is true', () => {
            const inmateSave = {
                user: {
                    username: 'Convict Joe',
                    age: 40,
                    inPrison: true,
                    prisonSentenceRemaining: 5,
                    prisonTotalSentence: 10,
                    prisonSecurity: 'Maximum'
                    // Missing prisonStats
                }
            };

            const migrated = migrateState(inmateSave);

            expect(migrated.user.inPrison).toBe(true);
            expect(migrated.user.lifeStatus).toBe('Inmate');
            expect(migrated.user.prisonSecurity).toBe('Maximum');
            expect(migrated.user.prisonSentenceRemaining).toBe(5);
            expect(migrated.user.prisonTotalSentence).toBe(10);
            expect(migrated.user.prisonStats).not.toBeNull();
            expect(migrated.user.prisonStats.respect).toBe(25);
            expect(migrated.user.prisonStats.guardRelation).toBe(50);
            expect(migrated.user.prisonStats.gang).toBe('None');
            expect(migrated.user.prisonStats.canteenCash).toBe(50);
            expect(migrated.user.yardInmates).toEqual([]);
        });

        test('migrateState coerces types and clamps numerical bounds safely', () => {
            const malformedTypes = {
                user: {
                    username: 12345, // number to string
                    age: '42',       // string to number
                    health: '180',    // clamped to 100
                    happiness: '-50', // clamped to 0
                    smarts: 'invalid_number', // string non-number converted to default 50
                    looks: Infinity,  // clamped
                    money: '250000',  // string to number
                    isStudent: 'true', // string bool to boolean
                    universityGraduated: 'false',
                    equityOwned: 5.0   // clamped to 1.0
                }
            };

            const migrated = migrateState(malformedTypes);

            expect(migrated.user.username).toBe('12345');
            expect(migrated.user.age).toBe(42);
            expect(migrated.user.health).toBe(100);
            expect(migrated.user.happiness).toBe(0);
            expect(migrated.user.smarts).toBe(50);
            expect(migrated.user.looks).toBe(100);
            expect(migrated.user.money).toBe(250000);
            expect(migrated.user.isStudent).toBe(true);
            expect(migrated.user.universityGraduated).toBe(false);
            expect(migrated.user.equityOwned).toBe(1.0);
        });

        test('migrateState prunes unknown and prototype-polluting properties', () => {
            const dirtySave = {
                user: {
                    username: 'Clean Hero',
                    age: 25,
                    '__proto__': { injectedAdmin: true },
                    'constructor': { name: 'exploit' },
                    hacked_infinite_cash: 999999999,
                    unknown_deprecated_flag: true
                },
                injectedRootKey: 'malicious'
            };

            const migrated = migrateState(dirtySave);

            expect(migrated.injectedRootKey).toBeUndefined();
            expect(migrated.user.hacked_infinite_cash).toBeUndefined();
            expect(migrated.user.unknown_deprecated_flag).toBeUndefined();
            expect(migrated.user.username).toBe('Clean Hero');
            expect(Object.prototype.hasOwnProperty.call(migrated.user, '__proto__')).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(migrated.user, 'constructor')).toBe(false);
        });

        test('migrateState normalizes legacy history string array into standard lifeLog format', () => {
            const legacyLogSave = {
                user: { age: 18 },
                history: [
                    'Born in Boston',
                    'Started elementary school',
                    'Graduated high school'
                ]
            };

            const migrated = migrateState(legacyLogSave);

            expect(Array.isArray(migrated.lifeLog)).toBe(true);
            expect(migrated.lifeLog.length).toBe(3);
            expect(migrated.lifeLog[0].events[0].msg).toBe('Born in Boston');
            expect(migrated.lifeLog[0].events[0].color).toBe('text-gray-400');
        });

        test('validateGameStateSchema accepts valid payloads and rejects dangerous/malformed payloads', () => {
            expect(validateGameStateSchema(null)).toBe(false);
            expect(validateGameStateSchema('invalid')).toBe(false);
            expect(validateGameStateSchema([])).toBe(false);

            expect(validateGameStateSchema({ _slotId: 'slot_1', user: { name: 'Player' } })).toBe(true);
            expect(validateGameStateSchema({ snapshots: [{ age: 20 }] })).toBe(true);

            // Rejects prototype pollution
            expect(validateGameStateSchema(JSON.parse('{"__proto__": {"admin": true}}'))).toBe(false);
            expect(validateGameStateSchema(JSON.parse('{"constructor": {"name": "hack"}}'))).toBe(false);

            // Rejects invalid slotId
            expect(validateGameStateSchema({ _slotId: 'slot_99999999999999999999' })).toBe(false);

            // Rejects oversized snapshots
            const oversized = Array.from({ length: 20 }, (_, i) => ({ age: i }));
            expect(validateGameStateSchema({ snapshots: oversized })).toBe(false);
        });

        test('loadSlot and saveToSlot automatically apply migrateState and preserve valid state', () => {
            // Seed localStorage with a legacy partial slot
            const partialSlotStore = {
                activeSlotId: 'slot_1',
                slots: {
                    slot_1: {
                        id: 'slot_1',
                        name: 'Legacy Hero',
                        lastSaved: Date.now(),
                        data: {
                            user: {
                                username: 'Legacy Hero',
                                age: 45,
                                money: 300000
                                // missing modern fields
                            }
                        }
                    }
                }
            };
            localStorage.setItem('life_game_slots', JSON.stringify(partialSlotStore));

            loadSlot('slot_1');

            expect(state.gameState).not.toBeNull();
            expect(state.gameState.user.username).toBe('Legacy Hero');
            expect(state.gameState.user.money).toBe(300000);
            expect(state.gameState.user.isPublic).toBe(false);
            expect(state.gameState.user.marketingLevels).toBeDefined();
            expect(state.gameState.user.teamRoles).toBeDefined();
            expect(state.gameState.user.corporateDebt).toBeDefined();
            expect(state.gameState.lifeLog).toBeDefined();
        });
    });
});


