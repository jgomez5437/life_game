import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../../../public/src/core/gameLogic.js');
const { Utils } = await import('../../../public/src/ui/utils.js');

describe('Business Simulator Overhaul Logic', () => {
    let mockUser;

    beforeEach(() => {
        mockUser = {
            hasBusiness: true,
            companyName: 'Apex Cloud Inc',
            industry: 'tech_saas',
            compCash: 100000,
            companyYear: 1,
            companyQuarter: 1,
            employees: 5,
            businessReputation: 60,
            inventory: 0,
            supplierId: 'standard',
            businessHistory: [
                { year: 1, quarter: 1, revenue: 50000, profit: 15000 },
                { year: 1, quarter: 2, revenue: 60000, profit: 20000 },
                { year: 1, quarter: 3, revenue: 70000, profit: 25000 },
                { year: 1, quarter: 4, revenue: 80000, profit: 30000 }
            ],
            businessUpgrades: []
        };
    });

    test('ensureBusinessState initializes missing overhaul fields', () => {
        GameLogic.ensureBusinessState(mockUser);
        expect(mockUser.isPublic).toBe(false);
        expect(mockUser.hqTier).toBe('garage');
        expect(mockUser.equityOwned).toBe(1.0);
        expect(mockUser.marketingLevels).toEqual({ social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 });
        expect(mockUser.customerSatisfaction).toBe(75);
        expect(mockUser.employeeMorale).toBe(80);
    });

    test('calculateCompanyValuation calculates correct valuation based on annual revenue', () => {
        GameLogic.ensureBusinessState(mockUser);
        const val = GameLogic.calculateCompanyValuation(mockUser);
        // Annual revenue = 260,000, Profit = 85,000, tech_saas multiple = 8.0
        expect(val).toBeGreaterThan(1000000);
    });

    test('calculateBusinessOverhead calculates quarterly fixed costs', () => {
        GameLogic.ensureBusinessState(mockUser);
        const overhead = GameLogic.calculateBusinessOverhead(mockUser);
        expect(overhead.quarterlyRent).toBe(0); // garage rent = 0
        expect(overhead.empAdminOverhead).toBe(mockUser.employees * 300 * 3); // 4500
        expect(overhead.totalQuarterly).toBe(4500);
    });

    test('calculateVCInvestorOffers returns eligible investor offers', () => {
        GameLogic.ensureBusinessState(mockUser);
        const offers = GameLogic.calculateVCInvestorOffers(mockUser);
        expect(Array.isArray(offers)).toBe(true);
        expect(offers.length).toBeGreaterThan(0);
        expect(offers[0].offeredAmount).toBeGreaterThan(0);
        expect(offers[0].equityRequired).toBeGreaterThan(0);
    });

    test('acceptVCOffer dilutes equity and increases company cash treasury', () => {
        GameLogic.ensureBusinessState(mockUser);
        const offers = GameLogic.calculateVCInvestorOffers(mockUser);
        const firstOffer = offers[0];

        const initialCash = mockUser.compCash;
        const res = GameLogic.acceptVCOffer(mockUser, firstOffer.id);

        expect(res.success).toBe(true);
        expect(mockUser.compCash).toBe(initialCash + firstOffer.offeredAmount);
        expect(mockUser.equityOwned).toBeLessThan(1.0);
        expect(mockUser.investorShares.length).toBe(1);
    });

    test('acceptVCOffer prevents duplicate acceptance of the same investor offer (H-7 guard)', () => {
        GameLogic.ensureBusinessState(mockUser);
        const offers = GameLogic.calculateVCInvestorOffers(mockUser);
        const firstOffer = offers[0];

        const res1 = GameLogic.acceptVCOffer(mockUser, firstOffer.id);
        expect(res1.success).toBe(true);

        const cashAfterFirst = mockUser.compCash;
        const equityAfterFirst = mockUser.equityOwned;

        // Second attempt on the same investor offer must fail
        const res2 = GameLogic.acceptVCOffer(mockUser, firstOffer.id);
        expect(res2.success).toBe(false);
        expect(res2.msg).toMatch(/already been accepted|no longer valid/i);
        expect(mockUser.compCash).toBe(cashAfterFirst);
        expect(mockUser.equityOwned).toBe(equityAfterFirst);
        expect(mockUser.investorShares.length).toBe(1);
    });

    test('calculateVCInvestorOffers and acceptVCOffer reject when company is public', () => {
        GameLogic.ensureBusinessState(mockUser);
        mockUser.isPublic = true;

        const offers = GameLogic.calculateVCInvestorOffers(mockUser);
        expect(offers).toEqual([]);

        const res = GameLogic.acceptVCOffer(mockUser, 'seed_vc');
        expect(res.success).toBe(false);
        expect(res.msg).toMatch(/after going public/i);
    });

    test('launchIPO grants founder payout, dilutes equity, and sets isPublic to true', () => {
        GameLogic.ensureBusinessState(mockUser);
        // Elevate history to exceed $25M valuation
        mockUser.businessHistory = [
            { year: 3, quarter: 1, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 2, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 3, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 4, revenue: 2000000, profit: 800000 }
        ];
        mockUser.money = 50000;

        const valuation = GameLogic.calculateCompanyValuation(mockUser);
        expect(valuation).toBeGreaterThanOrEqual(25000000);

        const res = GameLogic.launchIPO(mockUser, 0.20);
        expect(res.success).toBe(true);
        expect(mockUser.isPublic).toBe(true);
        expect(mockUser.equityOwned).toBe(0.80);
        expect(mockUser.money).toBe(50000 + Math.floor(valuation * 0.20));
    });

    test('launchIPO rejects duplicate IPO calls when company is already public (H-7 exploit fix)', () => {
        GameLogic.ensureBusinessState(mockUser);
        mockUser.businessHistory = [
            { year: 3, quarter: 1, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 2, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 3, revenue: 2000000, profit: 800000 },
            { year: 3, quarter: 4, revenue: 2000000, profit: 800000 }
        ];
        mockUser.money = 0;

        // First IPO
        const res1 = GameLogic.launchIPO(mockUser, 0.20);
        expect(res1.success).toBe(true);
        const payoutAfterFirst = mockUser.money;

        // Second IPO attempt on already public company
        const res2 = GameLogic.launchIPO(mockUser, 0.20);
        expect(res2.success).toBe(false);
        expect(res2.msg).toMatch(/already publicly traded/i);
        expect(mockUser.money).toBe(payoutAfterFirst); // Money must not increase
    });

    test('launchIPO rejects when valuation is below $25M threshold', () => {
        GameLogic.ensureBusinessState(mockUser);
        // Low valuation
        mockUser.businessHistory = [
            { year: 1, quarter: 1, revenue: 10000, profit: 2000 }
        ];
        const res = GameLogic.launchIPO(mockUser, 0.20);
        expect(res.success).toBe(false);
        expect(res.msg).toMatch(/Valuation must be at least \$25,000,000/i);
        expect(mockUser.isPublic).toBe(false);
    });

    test('Utils.formatCompactMoney formats large monetary amounts without text overflow', () => {
        expect(Utils.formatCompactMoney(95000)).toBe('$95,000');
        expect(Utils.formatCompactMoney(750000)).toBe('$750K');
        expect(Utils.formatCompactMoney(45200000)).toBe('$45.2M');
        expect(Utils.formatCompactMoney(1250000000)).toBe('$1.25B');
    });
});
