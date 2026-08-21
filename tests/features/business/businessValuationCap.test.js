import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { Utils } from '../../../public/src/ui/utils.js';

describe('Business Valuation Cap & Overflow Protection (H-12)', () => {

    test('calculateCompanyValuation strictly caps at MAX_COMPANY_VALUATION ($999T) under extreme numbers', () => {
        const user = {
            hasBusiness: true,
            industry: 'tech_saas',
            compCash: 5000000000000000, // 5 Quadrillion
            inventory: 1000000000,
            businessReputation: 100,
            businessHistory: [
                { revenue: 1000000000000000, profit: 500000000000000 },
                { revenue: 1000000000000000, profit: 500000000000000 },
                { revenue: 1000000000000000, profit: 500000000000000 },
                { revenue: 1000000000000000, profit: 500000000000000 }
            ]
        };

        const valuation = GameLogic.calculateCompanyValuation(user);
        expect(Number.isFinite(valuation)).toBe(true);
        expect(valuation).toBeLessThanOrEqual(GameLogic.MAX_COMPANY_VALUATION);
        expect(valuation).toBe(GameLogic.MAX_COMPANY_VALUATION);
    });

    test('calculateCompanyValuation safely handles NaN and Infinity gracefully without crashing', () => {
        const user = {
            hasBusiness: true,
            industry: 'tech_saas',
            compCash: Infinity,
            inventory: NaN,
            businessReputation: Infinity,
            businessHistory: [
                { revenue: NaN, profit: Infinity },
                { revenue: undefined, profit: null }
            ]
        };

        const valuation = GameLogic.calculateCompanyValuation(user);
        expect(Number.isFinite(valuation)).toBe(true);
        expect(isNaN(valuation)).toBe(false);
        expect(valuation).toBeLessThanOrEqual(GameLogic.MAX_COMPANY_VALUATION);
    });

    test('launchIPO caps player payout and user money at MAX_PLAYER_MONEY', () => {
        const user = {
            hasBusiness: true,
            industry: 'tech_saas',
            companyName: 'Apex Hyper Corp',
            compCash: 100000000000,
            equityOwned: 1.0,
            isPublic: false,
            health: 100,
            businessHistory: [
                { revenue: 500000000000, profit: 200000000000 }
            ]
        };

        const res = GameLogic.launchIPO(user, 0.20);
        expect(res.success).toBe(true);
        expect(Number.isFinite(res.payout)).toBe(true);
        expect(res.payout).toBeLessThanOrEqual(GameLogic.MAX_PLAYER_MONEY);
        expect(user.money).toBeLessThanOrEqual(GameLogic.MAX_PLAYER_MONEY);
    });

    test('Utils.formatCompactMoney formats values in Trillions ($T)', () => {
        expect(Utils.formatCompactMoney(1500000000000, 'New York')).toBe('$1.5T');
        expect(Utils.formatCompactMoney(25000000000000, 'New York')).toBe('$25T');
        expect(Utils.formatCompactMoney(999000000000000, 'New York')).toBe('$999T');
        expect(Utils.formatCompactMoney(500000000000, 'New York')).toBe('$500B');
    });
});
