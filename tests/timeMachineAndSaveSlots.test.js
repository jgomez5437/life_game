import { state, hasPurchasedPack } from '../public/src/core/state.js';
import { captureAnnualSnapshot, rewindToAge, MAX_SNAPSHOTS } from '../public/src/core/timeMachine.js';
import { getSlotsStore, saveToSlot, loadSlot, branchCurrentSave, deleteSlot, persistSlotsStore, startNewLifeInNewSlot } from '../public/src/core/saveSlotManager.js';
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
        test('captureAnnualSnapshot stores up to MAX_SNAPSHOTS (5)', () => {
            for (let age = 20; age <= 27; age++) {
                state.gameState.user.age = age;
                state.gameState.user.money += 5000;
                captureAnnualSnapshot(state.gameState);
            }

            expect(state.gameState.snapshots.length).toBe(MAX_SNAPSHOTS);
            expect(state.gameState.snapshots[state.gameState.snapshots.length - 1].age).toBe(27);
            expect(state.gameState.snapshots[0].age).toBe(23); // 27 - 5 + 1 = 23
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
});

