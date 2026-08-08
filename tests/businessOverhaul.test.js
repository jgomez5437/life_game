import { jest } from '@jest/globals';

jest.unstable_mockModule('../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../public/src/core/gameLogic.js');

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
});
