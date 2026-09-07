import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { ageUp } from '../../../public/src/features/player/mainScreen.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { saveToSlot, getSlotsStore, migrateState } from '../../../public/src/core/saveSlotManager.js';

describe('Living Expenses & Monthly Unit Synchronization', () => {
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
                <span id="header-age">22</span>
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

    test('stores monthly equivalent (~$2,000/mo) in user.monthlyLivingExpense for adult in Phoenix ($24,000/yr)', async () => {
        state.gameState = {
            user: {
                username: 'AdultPlayer',
                age: 22,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 50000,
                city: 'Phoenix',
                gender: 'female',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 22, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;
        const annualLiving = GameLogic.addLivingExpenses(23, false, 'Phoenix');
        expect(annualLiving).toBe(24000);

        await ageUp(); // age 22 -> 23

        // user.monthlyLivingExpense must store the monthly amount ($2,000), NOT annual ($24,000)
        expect(state.gameState.user.monthlyLivingExpense).toBe(Math.round(annualLiving / 12));
        expect(state.gameState.user.monthlyLivingExpense).toBe(2000);

        // user.money must be deducted by the full annual amount
        expect(state.gameState.user.money).toBe(initialMoney - annualLiving);

        // monthlyOutflow should match monthlyLivingExpense
        expect(state.gameState.user.monthlyOutflow).toBe(2000);
    });

    test('correctly calculates city-scaled monthly living expense for San Francisco ($33,000/yr -> $2,750/mo)', async () => {
        state.gameState = {
            user: {
                username: 'SFPlayer',
                age: 24,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 100000,
                city: 'San Francisco',
                gender: 'male',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 24, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;
        const annualLiving = GameLogic.addLivingExpenses(25, false, 'San Francisco');
        expect(annualLiving).toBe(33000);

        await ageUp();

        expect(state.gameState.user.monthlyLivingExpense).toBe(2750);
        expect(state.gameState.user.money).toBe(initialMoney - 33000);
        expect(state.gameState.user.monthlyOutflow).toBe(2750);
    });

    test('sets user.monthlyLivingExpense to 0 and deducts nothing when user is a student', async () => {
        state.gameState = {
            user: {
                username: 'CollegeStudent',
                age: 20,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 5000,
                city: 'Phoenix',
                gender: 'female',
                lifeStatus: 'Young Adult',
                isStudent: true,
                universityEnrolled: true,
                universitySchoolYear: 2,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 20, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;

        await ageUp();

        expect(state.gameState.user.monthlyLivingExpense).toBe(0);
        expect(state.gameState.user.money).toBe(initialMoney);
    });

    test('sets user.monthlyLivingExpense to 0 when user is under 19', async () => {
        state.gameState = {
            user: {
                username: 'TeenPlayer',
                age: 17,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 100,
                city: 'Phoenix',
                gender: 'male',
                lifeStatus: 'Teen',
                isStudent: true,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 17, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        await ageUp(); // 17 -> 18

        expect(state.gameState.user.monthlyLivingExpense).toBe(0);
    });

    test('resets user.monthlyLivingExpense to 0 when an adult becomes a student (no stale expense values)', async () => {
        state.gameState = {
            user: {
                username: 'ReturningToSchool',
                age: 22,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 40000,
                city: 'Phoenix',
                gender: 'female',
                lifeStatus: 'Adult',
                isStudent: false,
                monthlyLivingExpense: 2000, // previously established monthly living expense
                hasSeenExpenseMsg: true,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 22, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        // User now enrolls in school
        state.gameState.user.isStudent = true;
        state.gameState.user.gradSchoolEnrolled = true;
        state.gameState.user.gradSchoolYear = 0;
        state.gameState.user.gradSchoolType = 'Law School';

        await ageUp(); // 22 -> 23

        // Crucial check: monthlyLivingExpense must be reset to 0, not retain 2000
        expect(state.gameState.user.monthlyLivingExpense).toBe(0);
    });

    test('persists sanitized monthlyLivingExpense properly in save slots and migrateState', () => {
        const testUser = {
            username: 'SaveTest',
            age: 25,
            money: 50000,
            city: 'Chicago',
            monthlyLivingExpense: 2000,
            isStudent: false
        };

        const migrated = migrateState({ user: testUser });
        expect(migrated.user.monthlyLivingExpense).toBe(2000);

        state.gameState = migrated;
        state.gameState._slotId = 'slot_1';
        saveToSlot('slot_1', 'Saved Life');

        const store = getSlotsStore();
        expect(store.slots['slot_1'].data.user.monthlyLivingExpense).toBe(2000);
    });
});
