import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { ageUp } from '../../../public/src/features/player/mainScreen.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { saveToSlot } from '../../../public/src/core/saveSlotManager.js';

describe('Student Loan Repayment & Outflow Synchronization', () => {
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

    test('deducts $2,400/yr from user.money and reduces user.studentLoans when age >= 18 and not a student', async () => {
        state.gameState = {
            user: {
                username: 'Graduate',
                age: 22,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 10000,
                city: 'Phoenix',
                gender: 'female',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 20000,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 22, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;
        const initialLoan = state.gameState.user.studentLoans;
        const livingExpense = GameLogic.addLivingExpenses(23, false, 'Phoenix'); // age becomes 23

        await ageUp();

        // user.age advanced to 23
        expect(state.gameState.user.age).toBe(23);
        // Student loan reduced by 2400
        expect(state.gameState.user.studentLoans).toBe(initialLoan - 2400);
        // Money reduced by both living expense and 2400 student loan payment
        expect(state.gameState.user.money).toBe(initialMoney - livingExpense - 2400);
    });

    test('handles final partial loan payment and emits payoff log entry', async () => {
        state.gameState = {
            user: {
                username: 'AlmostDebtFree',
                age: 26,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 5000,
                city: 'Phoenix',
                gender: 'male',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 1000, // Partial balance < 2400
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 26, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;
        const livingExpense = GameLogic.addLivingExpenses(27, false, 'Phoenix');

        await ageUp();

        // Fully paid off
        expect(state.gameState.user.studentLoans).toBe(0);
        expect(state.gameState.user.money).toBe(initialMoney - livingExpense - 1000);

        // Check celebratory log
        const ageLog = state.gameState.lifeLog.find(l => l.age === 27);
        expect(ageLog).toBeDefined();
        const payoffEvent = ageLog.events.find(e => e.msg === 'Fully paid off your student loans!');
        expect(payoffEvent).toBeDefined();
        expect(payoffEvent.color).toBe('text-green-400');
    });

    test('defers payments while enrolled as a student (isStudent: true)', async () => {
        state.gameState = {
            user: {
                username: 'MedStudent',
                age: 24,
                health: 100,
                happiness: 100,
                smarts: 90,
                looks: 80,
                money: 3000,
                city: 'Phoenix',
                gender: 'female',
                lifeStatus: 'Student',
                isStudent: true,
                studentLoans: 40000,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 24, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;

        await ageUp();

        // Student loans and money should NOT be touched for student loan payments
        expect(state.gameState.user.studentLoans).toBe(40000);
        // Living expense for students is 0 in GameLogic.addLivingExpenses(..., true, ...)
        expect(state.gameState.user.money).toBe(initialMoney);
    });

    test('does not deduct or log when studentLoans is 0', async () => {
        state.gameState = {
            user: {
                username: 'DebtFreePlayer',
                age: 30,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 20000,
                city: 'Phoenix',
                gender: 'male',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 0,
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 30, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        const initialMoney = state.gameState.user.money;
        const livingExpense = GameLogic.addLivingExpenses(31, false, 'Phoenix');

        await ageUp();

        expect(state.gameState.user.studentLoans).toBe(0);
        expect(state.gameState.user.money).toBe(initialMoney - livingExpense);

        const ageLog = state.gameState.lifeLog.find(l => l.age === 31);
        const payoffEvent = ageLog ? ageLog.events.find(e => e.msg.includes('student loans')) : null;
        expect(payoffEvent).toBeUndefined();
    });

    test('monthlyOutflow does not compound across multiple consecutive age-ups', async () => {
        state.gameState = {
            user: {
                username: 'CompoundingTest',
                age: 22,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 50000,
                city: 'Phoenix',
                gender: 'male',
                lifeStatus: 'Adult',
                isStudent: false,
                studentLoans: 7200, // exactly 3 years of payments ($2400 * 3)
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 22, events: [] }],
            snapshots: [],
            _slotId: 'slot_1'
        };

        // Year 1 (age 22 -> 23): repayment year 1
        await ageUp();
        const expectedMonthlyLoan = Math.round(2400 / 12); // $200/mo
        const monthlyLiving23 = Math.round(GameLogic.addLivingExpenses(23, false, 'Phoenix') / 12);
        expect(state.gameState.user.monthlyOutflow).toBe(monthlyLiving23 + expectedMonthlyLoan);
        expect(state.gameState.user.studentLoans).toBe(4800);

        // Year 2 (age 23 -> 24): repayment year 2 (loans still active, $4800 -> $2400)
        await ageUp();
        const monthlyLiving24 = Math.round(GameLogic.addLivingExpenses(24, false, 'Phoenix') / 12);
        // CRITICAL CHECK: monthlyOutflow must NOT compound to 400 + living; remains living + 200
        expect(state.gameState.user.monthlyOutflow).toBe(monthlyLiving24 + expectedMonthlyLoan);
        expect(state.gameState.user.studentLoans).toBe(2400);

        // Year 3 (age 24 -> 25): final payment year ($2400 -> $0)! Outflow drops to only living expenses
        await ageUp();
        const monthlyLiving25 = Math.round(GameLogic.addLivingExpenses(25, false, 'Phoenix') / 12);
        expect(state.gameState.user.monthlyOutflow).toBe(monthlyLiving25);
        expect(state.gameState.user.studentLoans).toBe(0);
    });
});
