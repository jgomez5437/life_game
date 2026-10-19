import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { state } from '../../../public/src/core/state.js';
import { openCashflowModal, openPlayerOverviewModal } from '../../../public/src/features/player/playerOverviewScreen.js';

describe('Feature 1.1: Cashflow & Net Worth Breakdown Modal', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <main id="game-container"></main>
            <div id="modal-overlay" class="hidden">
                <div>
                    <div id="modal-header">
                        <h2 id="modal-title">Alert</h2>
                        <button id="modal-close-btn"></button>
                    </div>
                    <div id="modal-content"></div>
                    <div id="modal-actions">
                        <button id="modal-btn">Dismiss</button>
                    </div>
                </div>
            </div>
        `;
    });

    test('calculateFinancialBreakdown returns safe zero defaults for null user', () => {
        const res = GameLogic.calculateFinancialBreakdown(null);
        expect(res.cashflow.monthlyIncome).toBe(0);
        expect(res.cashflow.monthlyOutflow).toBe(0);
        expect(res.cashflow.netMonthly).toBe(0);
        expect(res.netWorth.netWorth).toBe(0);
        expect(res.netWorth.totalAssets).toBe(0);
        expect(res.netWorth.totalLiabilities).toBe(0);
    });

    test('calculateFinancialBreakdown handles a bare minimal user without throwing', () => {
        const res = GameLogic.calculateFinancialBreakdown({ age: 5, money: 0 });
        expect(res.cashflow.netMonthly).toBe(0);
        expect(res.netWorth.netWorth).toBe(0);
        expect(res.netWorth.liabilityItems).toEqual([]);
    });

    test('calculateFinancialBreakdown itemizes income, expenses, and net worth', () => {
        const user = {
            age: 32,
            city: 'New York', // $30,000/yr ($2,500/mo) living expenses
            isStudent: false,
            money: 120000,
            jobTitle: 'Senior Software Engineer',
            jobSalary: 120000, // $10,000/mo
            hasBusiness: true,
            companyName: 'AlphaTech',
            ceoSalary: 2000, // $2,000/mo
            compCash: 50000,
            studentLoans: 12000, // $200/mo
            gymMembership: true, // $50/mo
            diet: 'organic', // $450/mo
            assets: [
                {
                    id: 'prop_1', name: 'Downtown Condo', category: 'property', value: 500000,
                    isRented: true, tenant: { name: 'Jane Doe', monthlyRent: 3500 },
                    mortgage: { remainingBalance: 300000, monthlyPayment: 2100 }
                },
                {
                    id: 'veh_1', name: 'Tesla Model 3', category: 'vehicle', value: 35000,
                    insured: true, // floor(35000 * 0.008) = 280/yr -> 23/mo
                    loan: { remainingBalance: 15000, monthlyPayment: 400 }
                },
                {
                    id: 'jewel_1', name: 'Diamond Watch', category: 'jewelry', value: 10000,
                    insured: true // floor(10000 * 0.005) = 50/yr -> 4/mo
                }
            ],
            investments: {
                savings: 40000, // 3.5% -> $1,400/yr -> $117/mo
                stockMarket: [{ symbol: 'VND', name: 'Vanguard Shield', price: 100, dividendYield: 0.04 }],
                stocks: { VND: { shares: 500, totalCost: 45000 } } // $50,000 value, $2,000/yr dividends
            },
            relationships: [
                { id: 'c1', name: 'Timmy', category: 'child', type: 'Son', age: 8 },
                { id: 'c2', name: 'Sarah', category: 'child', type: 'Daughter', age: 23 },
                { id: 's1', name: 'Alex', category: 'spouse', type: 'Wife', age: 31, occupation: 'Attorney', income: 120000 }
            ]
        };

        const { cashflow, netWorth } = GameLogic.calculateFinancialBreakdown(user);
        const inc = id => cashflow.incomeItems.find(i => i.id === id);
        const exp = id => cashflow.expenseItems.find(i => i.id === id);

        expect(inc('salary').monthly).toBe(10000);
        expect(inc('salary').annual).toBe(120000);
        expect(inc('ceo_salary').monthly).toBe(2000);
        expect(inc('rental_income').monthly).toBe(3500);
        expect(inc('dividends').annual).toBe(2000);
        expect(inc('dividends').monthly).toBe(167);
        expect(inc('savings_interest').annual).toBe(1400);
        expect(inc('savings_interest').monthly).toBe(117);
        expect(inc('spousal_income').annual).toBe(60000);
        expect(inc('spousal_income').monthly).toBe(5000);

        expect(exp('taxes').monthly).toBe(0);
        expect(exp('living_expenses').monthly).toBe(2500);
        expect(exp('mortgages').monthly).toBe(2100);
        expect(exp('auto_loans').monthly).toBe(400);
        expect(exp('student_loans').monthly).toBe(200);
        expect(exp('diet_gym').monthly).toBe(500);
        expect(exp('child_support').monthly).toBe(500);
        expect(exp('insurance').monthly).toBe(27);

        // Outflow must equal the canonical engine (no taxes set)
        expect(cashflow.monthlyOutflow).toBe(GameLogic.calculateUserMonthlyOutflow(user));
        expect(cashflow.netMonthly).toBe(cashflow.monthlyIncome - cashflow.monthlyOutflow);

        // Assets: 120k + 40k + 50k + 500k + 35k + 10k + 50k
        expect(netWorth.totalAssets).toBe(805000);
        // Liabilities: 300k mortgage + 15k auto + 12k student
        expect(netWorth.totalLiabilities).toBe(327000);
        expect(netWorth.netWorth).toBe(478000);
    });

    test('calculateFinancialBreakdown includes monthlyTaxes in outflow when present', () => {
        const base = { age: 30, city: 'New York', money: 0, jobTitle: 'Dev', jobSalary: 60000 };
        const without = GameLogic.calculateFinancialBreakdown(base);
        const withTax = GameLogic.calculateFinancialBreakdown({ ...base, monthlyTaxes: 800 });
        expect(withTax.cashflow.monthlyOutflow - without.cashflow.monthlyOutflow).toBe(800);
        expect(withTax.cashflow.expenseItems.find(i => i.id === 'taxes').monthly).toBe(800);
    });

    test('negative bank balance is shown as a liability, not a negative asset', () => {
        const { netWorth } = GameLogic.calculateFinancialBreakdown({ age: 30, city: 'New York', money: -5000 });
        expect(netWorth.totalAssets).toBe(0);
        expect(netWorth.totalLiabilities).toBe(5000);
        expect(netWorth.netWorth).toBe(-5000);
        expect(netWorth.liabilityItems.find(i => i.id === 'bank_overdraft').value).toBe(5000);
    });

    test('openCashflowModal renders the itemized ledger in the modal DOM', () => {
        state.gameState = {
            user: {
                username: 'Jordan Belfort', age: 30, city: 'New York', money: 75000,
                jobTitle: 'Stockbroker', jobSalary: 96000, gymMembership: true, diet: 'keto',
                assets: [],
                relationships: [{ id: 'c1', name: 'Leo', category: 'child', type: 'Son', age: 4 }]
            }
        };

        openCashflowModal();

        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(false);
        const content = document.getElementById('modal-content').textContent;
        expect(content).toContain('Salary (Stockbroker)');
        expect(content).toContain('Stock Dividends');
        expect(content).toContain('Rental Income');
        expect(content).toContain('Taxes');
        expect(content).toContain('Living Expenses');
        expect(content).toContain('Property Mortgages');
        expect(content).toContain('Diet & Gym');
        expect(content).toContain('Child Support & Care');
        expect(content).toContain('Net Worth Breakdown');
    });

    test('openCashflowModal is a no-op without a game state', () => {
        state.gameState = null;
        expect(() => openCashflowModal()).not.toThrow();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
    });

    test('Player Overview financial grid triggers openCashflowModal', () => {
        state.gameState = {
            user: { username: 'Test Player', age: 25, city: 'New York', money: 10000, assets: [], relationships: [] }
        };
        openPlayerOverviewModal();
        expect(document.querySelector('#modal-content [data-action="openCashflowModal"]')).not.toBeNull();
    });
});
