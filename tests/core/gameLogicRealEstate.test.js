import { jest } from '@jest/globals';

jest.unstable_mockModule('../../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../../public/src/core/gameLogic.js');


describe('Real Estate Properties & Mortgage Pure Logic', () => {
    test('calculateMonthlyMortgage returns realistic monthly payment', () => {
        // $100,000 at 6.5% interest for 30 years is ~$632/month
        const payment = GameLogic.calculateMonthlyMortgage(100000, 0.065, 30);
        expect(payment).toBeGreaterThan(600);
        expect(payment).toBeLessThan(700);
        expect(payment).toBe(632);
    });

    test('calculateMonthlyMortgage returns 0 for zero or negative principal', () => {
        expect(GameLogic.calculateMonthlyMortgage(0)).toBe(0);
        expect(GameLogic.calculateMonthlyMortgage(-50000)).toBe(0);
    });

    test('calculateMonthlyMortgage sanitizes zero or negative years to prevent division by zero (H-16)', () => {
        // years = 0 should be sanitized to minimum 1 year (12 payments), not evaluate to Infinity
        const zeroYearPayment = GameLogic.calculateMonthlyMortgage(100000, 0.065, 0);
        expect(Number.isFinite(zeroYearPayment)).toBe(true);
        expect(zeroYearPayment).toBeGreaterThan(0);
        expect(zeroYearPayment).not.toBe(Infinity);
        expect(zeroYearPayment).toBe(8630);

        // Negative years should also clamp to 1 year
        const negativeYearPayment = GameLogic.calculateMonthlyMortgage(100000, 0.065, -5);
        expect(Number.isFinite(negativeYearPayment)).toBe(true);
        expect(negativeYearPayment).toBe(8630);
    });

    test('calculateMonthlyMortgage handles 0% interest and invalid inputs gracefully', () => {
        // 0% interest on $120,000 for 10 years = $1,000/month
        const zeroInterestPayment = GameLogic.calculateMonthlyMortgage(120000, 0, 10);
        expect(zeroInterestPayment).toBe(1000);

        // Non-numeric or NaN principal / rates
        expect(GameLogic.calculateMonthlyMortgage(NaN)).toBe(0);
        expect(GameLogic.calculateMonthlyMortgage(null)).toBe(0);
        expect(GameLogic.calculateMonthlyMortgage(undefined)).toBe(0);

        // Invalid years fallback to default 30 years
        const defaultYearsPayment = GameLogic.calculateMonthlyMortgage(100000, 0.065, NaN);
        expect(defaultYearsPayment).toBe(632);
    });

    test('calculateUserMonthlyIncome aggregates job and business CEO salaries', () => {
        const userWithJob = { jobTitle: 'Software Developer', jobSalary: 120000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithJob)).toBe(10000);

        const userWithBusiness = { hasBusiness: true, ceoSalary: 15000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithBusiness)).toBe(15000);

        const userWithBoth = { jobTitle: 'Engineer', jobSalary: 60000, hasBusiness: true, ceoSalary: 8000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithBoth)).toBe(13000);

        const retiredUser = { isRetired: true, retirementPension: 66000 };
        expect(GameLogic.calculateUserMonthlyIncome(retiredUser)).toBe(5500);

        const retiredUserWithJob = { isRetired: true, retirementPension: 66000, jobTitle: 'Consultant', jobSalary: 48000 };
        expect(GameLogic.calculateUserMonthlyIncome(retiredUserWithJob)).toBe(9500);

        const unemployedUser = { money: 50000 };
        expect(GameLogic.calculateUserMonthlyIncome(unemployedUser)).toBe(0);
    });

    test('getMinRetireYears returns correct years for military, law enforcement, and other tracks', () => {
        expect(GameLogic.getMinRetireYears('military')).toBe(20);
        expect(GameLogic.getMinRetireYears({ careerTrack: 'military' })).toBe(20);

        expect(GameLogic.getMinRetireYears('law_enforcement')).toBe(25);
        expect(GameLogic.getMinRetireYears({ careerTrack: 'law_enforcement' })).toBe(25);

        expect(GameLogic.getMinRetireYears('corporate_track')).toBe(30);
        expect(GameLogic.getMinRetireYears({ careerTrack: 'medicine' })).toBe(30);
        expect(GameLogic.getMinRetireYears({})).toBe(30);
        expect(GameLogic.getMinRetireYears(null)).toBe(30);
    });

    test('calculateTotalMonthlyMortgages sums active property mortgages', () => {
        const user = {
            assets: [
                { category: 'vehicle', value: 20000 },
                { category: 'property', name: 'Apartment', mortgage: { remainingBalance: 100000, monthlyPayment: 600 } },
                { category: 'property', name: 'House', mortgage: { remainingBalance: 300000, monthlyPayment: 1800 } },
                { category: 'property', name: 'Paid Off Condo', mortgage: null }
            ]
        };
        expect(GameLogic.calculateTotalMonthlyMortgages(user)).toBe(2400);
    });

    describe('calculatePropertyMonthlyOutflow', () => {
        test('does not wipe accumulator when mortgaged property is followed by other assets', () => {
            const assets = [
                { category: 'property', name: 'House A', mortgage: { remainingBalance: 200000, monthlyPayment: 1200 } },
                { category: 'vehicle', name: 'Sedan', value: 15000 },
                { category: 'jewelry', name: 'Gold Watch', value: 5000 },
                { category: 'property', name: 'Paid Off Cottage', mortgage: null }
            ];
            expect(GameLogic.calculatePropertyMonthlyOutflow(assets)).toBe(1200);
        });

        test('correctly sums multiple mortgaged properties interspersed with other assets', () => {
            const assets = [
                { category: 'vehicle', name: 'Sports Car', value: 80000 },
                { category: 'property', name: 'Condo', mortgage: { remainingBalance: 150000, monthlyPayment: 850 } },
                { category: 'jewelry', name: 'Diamond Ring', value: 12000 },
                { category: 'property', name: 'Townhouse', mortgage: { remainingBalance: 250000, monthlyPayment: 1450 } },
                { category: 'vehicle', name: 'Truck', value: 30000 }
            ];
            expect(GameLogic.calculatePropertyMonthlyOutflow(assets)).toBe(2300);
        });

        test('returns 0 for empty array, non-array, or falsy inputs', () => {
            expect(GameLogic.calculatePropertyMonthlyOutflow([])).toBe(0);
            expect(GameLogic.calculatePropertyMonthlyOutflow(null)).toBe(0);
            expect(GameLogic.calculatePropertyMonthlyOutflow(undefined)).toBe(0);
            expect(GameLogic.calculatePropertyMonthlyOutflow('not-an-array')).toBe(0);
            expect(GameLogic.calculatePropertyMonthlyOutflow(42)).toBe(0);
        });

        test('gracefully handles sparse arrays, null items, and NaN/missing monthly payments', () => {
            const assets = [
                null,
                undefined,
                { category: 'property', mortgage: { remainingBalance: 100000, monthlyPayment: NaN } },
                { category: 'property', mortgage: { remainingBalance: 100000, monthlyPayment: null } },
                { category: 'property', mortgage: { remainingBalance: 100000 } },
                { category: 'property', mortgage: { remainingBalance: 200000, monthlyPayment: 950 } }
            ];
            expect(GameLogic.calculatePropertyMonthlyOutflow(assets)).toBe(950);
        });

        test('polymorphically supports a user object with assets', () => {
            const user = {
                assets: [
                    { category: 'property', mortgage: { remainingBalance: 180000, monthlyPayment: 1100 } },
                    { category: 'vehicle', value: 10000 }
                ]
            };
            expect(GameLogic.calculatePropertyMonthlyOutflow(user)).toBe(1100);
        });

        test('calculateUserMonthlyOutflow accurately includes mortgage outflow when followed by other assets', () => {
            const user = {
                age: 25,
                city: 'Austin',
                isStudent: false,
                studentLoans: 0,
                relationships: [],
                assets: [
                    { category: 'property', mortgage: { remainingBalance: 200000, monthlyPayment: 1200 } },
                    { category: 'vehicle', value: 20000, insured: false },
                    { category: 'jewelry', value: 5000, insured: false }
                ]
            };
            const baseLiving = Math.round(GameLogic.addLivingExpenses(25, false, 'Austin') / 12);
            const totalOutflow = GameLogic.calculateUserMonthlyOutflow(user);
            expect(totalOutflow).toBe(baseLiving + 1200);
        });
    });

    test('canAffordMortgage blocks mortgage if user has no monthly income', () => {
        const user = { money: 100000 };
        const result = GameLogic.canAffordMortgage(user, 500);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('need monthly income');
    });

    test('canAffordMortgage allows mortgage when total payment < 40% of monthly income', () => {
        // Income = $10,000/mo. 40% limit = $4,000. New mortgage = $1,500/mo (15%).
        const user = { jobTitle: 'Dev', jobSalary: 120000 };
        const result = GameLogic.canAffordMortgage(user, 1500);
        expect(result.allowed).toBe(true);
        expect(result.ratio).toBeCloseTo(0.15);
    });

    test('canAffordMortgage rejects mortgage when payment takes up 40% or more of monthly income', () => {
        // Income = $5,000/mo. 40% limit = $2,000. Proposed mortgage = $2,000/mo (40%).
        const user = { jobTitle: 'Teacher', jobSalary: 60000 };
        const result = GameLogic.canAffordMortgage(user, 2000);
        expect(result.allowed).toBe(false);
        expect(result.ratio).toBeCloseTo(0.40);
        expect(result.reason).toContain('Max: 40%');
    });

    test('canAffordMortgage factors in existing mortgages against 40% limit', () => {
        // Income = $10,000/mo ($120k salary). Limit = $4,000. Existing mortgage = $2,500/mo. New mortgage = $1,800/mo. Total = $4,300 (43%).
        const user = {
            jobTitle: 'Manager',
            jobSalary: 120000,
            assets: [
                { category: 'property', mortgage: { remainingBalance: 200000, monthlyPayment: 2500 } }
            ]
        };
        const result = GameLogic.canAffordMortgage(user, 1800);
        expect(result.allowed).toBe(false);
        expect(result.ratio).toBeCloseTo(0.43);
    });

    test('processMortgagePayments applies interest amortization correctly over 9 years', () => {
        const townhouseMortgage = GameLogic.calculateMonthlyMortgage(280000, 0.065, 30); // 1770/mo
        const user = {
            money: 500000,
            assets: [
                {
                    name: 'Suburban Townhouse',
                    category: 'property',
                    mortgage: { remainingBalance: 280000, monthlyPayment: townhouseMortgage, annualRate: 0.065 }
                }
            ]
        };

        // Age up 9 times (9 years of payments)
        for (let year = 0; year < 9; year++) {
            GameLogic.processMortgagePayments(user);
        }

        // After 9 years on a 30-year 6.5% loan for $280,000, balance should be ~ $242,000 - $243,000 (NOT $88,000!)
        const remaining = user.assets[0].mortgage.remainingBalance;
        expect(remaining).toBeGreaterThan(240000);
        expect(remaining).toBeLessThan(245000);
    });

    test('getPropertyIcon returns correct icon and default fallback', () => {
        expect(GameLogic.getPropertyIcon('apartment').icon).toBe('fa-building');
        expect(GameLogic.getPropertyIcon('house').icon).toBe('fa-house');
        expect(GameLogic.getPropertyIcon('penthouse').icon).toBe('fa-crown');
        expect(GameLogic.getPropertyIcon('unknown').icon).toBe('fa-home');
    });

    test('updateOwnedProperties degrades condition and maxCondition over time', () => {
        const user = {
            assets: [
                { category: 'property', name: 'House', value: 450000, condition: 100, maxCondition: 100 }
            ]
        };

        GameLogic.updateOwnedProperties(user);

        const prop = user.assets[0];
        expect(prop.maxCondition).toBe(99); // Drops 1% per year
        expect(prop.condition).toBeLessThan(100); // Drops 2-4% per year
        expect(prop.condition).toBeLessThanOrEqual(prop.maxCondition);
    });

    test('calculateMaintenanceCost calculates realistic cost proportional to home value', () => {
        const prop450k = { value: 450000 };
        expect(GameLogic.calculateMaintenanceCost(prop450k)).toBe(3375); // 0.75% of $450,000

        const cheapProp = { value: 20000 };
        expect(GameLogic.calculateMaintenanceCost(cheapProp)).toBe(250); // Minimum $250
    });

    test('performPropertyMaintenance restores condition up to current maxCondition ceiling', () => {
        const user = {
            money: 10000,
            assets: [
                { id: 1, category: 'property', name: 'House', value: 450000, condition: 70, maxCondition: 90 }
            ]
        };

        const result = GameLogic.performPropertyMaintenance(user, 1);
        expect(result.success).toBe(true);
        expect(result.restoredCondition).toBe(90); // Restored up to maxCondition cap, NOT 100!
        expect(user.assets[0].condition).toBe(90);
        expect(user.money).toBe(10000 - 3375);
    });

    test('calculateRenovationOptions produces 3 tiers scaled to property value', () => {
        const prop = { value: 500000 };
        const options = GameLogic.calculateRenovationOptions(prop);
        expect(options.length).toBe(3);

        expect(options[0].name).toBe('Minor Cosmetic Refresh');
        expect(options[0].cost).toBe(15000); // 3%

        expect(options[1].name).toBe('Major Interior Remodel');
        expect(options[1].cost).toBe(40000); // 8%

        expect(options[2].name).toBe('Full Gut Renovation');
        expect(options[2].cost).toBe(90000); // 18%
    });

    test('renovateProperty restores condition, raises maxCondition, and increases market value proportionally', () => {
        const user = {
            money: 100000,
            assets: [
                { id: 1, category: 'property', name: 'House', value: 500000, condition: 60, maxCondition: 80 }
            ]
        };

        // Full Gut Renovation (option 'full')
        const result = GameLogic.renovateProperty(user, 1, 'full');
        expect(result.success).toBe(true);
        expect(user.assets[0].condition).toBe(100);
        expect(user.assets[0].maxCondition).toBe(100);
        expect(user.assets[0].renovatedThisYear).toBe(true);
        // Scaled boost: restored 40 cond + 20 cap = 60 out of 150 max potential = 40% of 25% = 10% boost ($50,000)
        expect(result.valueIncrease).toBe(50000);
        expect(user.assets[0].value).toBe(550000);
        expect(user.money).toBe(100000 - 90000);
    });

    test('renovateProperty blocks multiple renovations on the same property in the same year (cooldown)', () => {
        const user = {
            age: 30,
            money: 200000,
            assets: [
                { id: 1, category: 'property', name: 'Apartment', value: 300000, condition: 50, maxCondition: 70 }
            ]
        };

        const first = GameLogic.renovateProperty(user, 1, 'minor');
        expect(first.success).toBe(true);
        expect(user.assets[0].renovatedThisYear).toBe(true);
        expect(user.assets[0].lastRenovationAge).toBe(30);

        // Immediate second attempt in the same year
        const second = GameLogic.renovateProperty(user, 1, 'minor');
        expect(second.success).toBe(false);
        expect(second.reason).toContain('already renovated this property this year');
    });

    test('updateOwnedProperties resets renovatedThisYear flag allowing renovations next year', () => {
        const user = {
            age: 30,
            money: 200000,
            assets: [
                { id: 1, category: 'property', name: 'Townhouse', value: 300000, condition: 50, maxCondition: 70, renovatedThisYear: true, lastRenovationAge: 30 }
            ]
        };

        // Age up to 31
        user.age = 31;
        GameLogic.updateOwnedProperties(user);

        expect(user.assets[0].renovatedThisYear).toBe(false);

        // Renovation is now allowed in the new year
        const result = GameLogic.renovateProperty(user, 1, 'minor');
        expect(result.success).toBe(true);
        expect(user.assets[0].renovatedThisYear).toBe(true);
        expect(user.assets[0].lastRenovationAge).toBe(31);
    });

    test('renovateProperty blocks renovation on pristine properties (100% condition & 100% maxCondition)', () => {
        const user = {
            money: 100000,
            assets: [
                { id: 1, category: 'property', name: 'Brand New Mansion', value: 1000000, condition: 100, maxCondition: 100 }
            ]
        };

        const result = GameLogic.renovateProperty(user, 1, 'minor');
        expect(result.success).toBe(false);
        expect(result.reason).toContain('pristine condition');
        expect(user.money).toBe(100000); // No money deducted
        expect(user.assets[0].value).toBe(1000000); // No value increase
    });

    test('renovateProperty scales value increase proportionally for minor and major options', () => {
        // Minor on distressed property (gains full 20 cond + 10 cap)
        const user = {
            money: 100000,
            assets: [
                { id: 1, category: 'property', name: 'Fixer Upper', value: 200000, condition: 40, maxCondition: 70 }
            ]
        };

        const result = GameLogic.renovateProperty(user, 1, 'minor');
        expect(result.success).toBe(true);
        expect(user.assets[0].condition).toBe(60);
        expect(user.assets[0].maxCondition).toBe(80);
        // Full restoration (20 cond + 10 cap = 30/30) -> 100% of 4% boost = $8,000
        expect(result.valueIncrease).toBe(8000);
        expect(user.assets[0].value).toBe(208000);
    });

    test('generateTenantApplicants returns 3 realistic tenant applicants', () => {
        const prop = { value: 300000 };
        const applicants = GameLogic.generateTenantApplicants(prop);
        expect(applicants.length).toBe(3);
        expect(applicants[0].monthlyRent).toBeGreaterThan(0);
        expect(applicants[1].monthlyRent).toBeGreaterThan(applicants[0].monthlyRent);
        expect(applicants[2].monthlyRent).toBeGreaterThan(applicants[1].monthlyRent);
    });

    test('calculateTotalRentalIncome & calculateUserMonthlyIncome includes rental cashflow', () => {
        const user = {
            jobTitle: 'Software Developer',
            jobSalary: 120000, // $10,000/mo salary
            assets: [
                { category: 'property', isRented: true, tenant: { monthlyRent: 2000 } },
                { category: 'property', isRented: true, tenant: { monthlyRent: 1500 } },
                { category: 'property', isRented: false, tenant: null }
            ]
        };

        expect(GameLogic.calculateTotalRentalIncome(user.assets)).toBe(3500);
        expect(GameLogic.calculateUserMonthlyIncome(user)).toBe(13500);
    });

    test('acceptTenantLease sets isRented and tenant object', () => {
        const user = {
            assets: [
                { id: 10, category: 'property', name: 'Apartment', value: 200000, isRented: false }
            ]
        };

        const result = GameLogic.acceptTenantLease(user, 10, 'applicant_reliable');
        expect(result.success).toBe(true);
        expect(user.assets[0].isRented).toBe(true);
        expect(user.assets[0].tenant.quality).toBe('excellent');
    });

    test('processRentalIncome collects annual rent and logs transactions', () => {
        const user = {
            money: 10000,
            assets: [
                { id: 10, category: 'property', name: 'Apartment', isRented: true, tenant: { monthlyRent: 2000, quality: 'excellent' } }
            ]
        };

        const totalCollected = GameLogic.processRentalIncome(user);
        expect(totalCollected).toBe(24000); // 2000 * 12
        expect(user.money).toBe(34000);
    });

    test('evictTenant clears tenant and resets isRented to false', () => {
        const user = {
            assets: [
                { id: 10, category: 'property', name: 'Apartment', isRented: true, tenant: { name: 'John Doe', monthlyRent: 2000 } }
            ]
        };

        const result = GameLogic.evictTenant(user, 10);
        expect(result.success).toBe(true);
        expect(user.assets[0].isRented).toBe(false);
        expect(user.assets[0].tenant).toBeNull();
    });

    test('calculatePropertySaleTiers returns 5 pricing options ranging from below to above market value', () => {
        const prop = { value: 300000 };
        const tiers = GameLogic.calculatePropertySaleTiers(prop);
        expect(tiers.length).toBe(5);
        expect(tiers[0].id).toBe('below');
        expect(tiers[0].price).toBe(255000); // 300k * 0.85
        expect(tiers[2].id).toBe('at_market');
        expect(tiers[2].price).toBe(300000);
        expect(tiers[4].id).toBe('above');
        expect(tiers[4].price).toBe(354000); // 300k * 1.18
    });

    test('completePropertySale pays off remaining mortgage and adds net proceeds to user money', () => {
        const user = {
            money: 50000,
            assets: [
                {
                    id: 1,
                    category: 'property',
                    name: 'Suburban House',
                    value: 300000,
                    mortgage: { remainingBalance: 120000 },
                    activeOffer: { offerAmount: 300000, buyer: { name: 'Alice' } }
                }
            ]
        };

        const result = GameLogic.completePropertySale(user, 1, 300000);
        expect(result.success).toBe(true);
        expect(result.netProceeds).toBe(180000); // 300k - 120k
        expect(user.money).toBe(230000); // 50k + 180k
        expect(user.assets.length).toBe(0);
    });
});

describe('Tenant Lifecycle and Event Handling (H-17)', () => {
    test('acceptTenantLease initializes renewalPending to false', () => {
        const user = {
            assets: [
                { id: 'prop_1', category: 'property', name: 'Apartment', value: 200000, isRented: false }
            ]
        };
        const result = GameLogic.acceptTenantLease(user, 'prop_1', 'applicant_reliable');
        expect(result.success).toBe(true);
        expect(user.assets[0].isRented).toBe(true);
        expect(user.assets[0].tenant.renewalPending).toBe(false);
    });

    test('processTenantEvents decrements leaseYears when leaseYears > 1 without expiring', () => {
        const user = {
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 3, monthlyRent: 1500, renewalPending: false }
                }
            ]
        };
        const state = { gameState: { pendingTenantEvents: [] } };
        // Force roll away from damage (e.g. 0.5 > 0.15)
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

        GameLogic.processTenantEvents(user, state);

        expect(user.assets[0].isRented).toBe(true);
        expect(user.assets[0].tenant.leaseYears).toBe(2);
        expect(user.assets[0].tenant.renewalPending).toBe(false);
        expect(state.gameState.pendingTenantEvents.length).toBe(0);

        randomSpy.mockRestore();
    });

    test('processTenantEvents triggers lease_expiration and sets renewalPending when lease reaches 0 and renewal rolls true', () => {
        const user = {
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 1, monthlyRent: 1500, renewalPending: false }
                }
            ]
        };
        const state = { gameState: { pendingTenantEvents: [] } };
        // Roll < 0.70 for renewal
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.3);

        GameLogic.processTenantEvents(user, state);

        expect(user.assets[0].isRented).toBe(true);
        expect(user.assets[0].tenant.leaseYears).toBe(0);
        expect(user.assets[0].tenant.renewalPending).toBe(true);
        expect(state.gameState.pendingTenantEvents.length).toBe(1);
        expect(state.gameState.pendingTenantEvents[0].eventType).toBe('lease_expiration');
        expect(state.gameState.pendingTenantEvents[0].propertyId).toBe('prop_1');
        expect(state.gameState.pendingTenantEvents[0].currentRent).toBe(1500);

        randomSpy.mockRestore();
    });

    test('processTenantEvents vacates property when lease reaches 0 and renewal rolls false', () => {
        const user = {
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 1, monthlyRent: 1500, renewalPending: false }
                }
            ]
        };
        const state = { gameState: { pendingTenantEvents: [] } };
        // Roll >= 0.70 for renewal (tenant decides not to renew)
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.85);

        GameLogic.processTenantEvents(user, state);

        expect(user.assets[0].isRented).toBe(false);
        expect(user.assets[0].tenant).toBeNull();
        expect(state.gameState.pendingTenantEvents.length).toBe(0);

        randomSpy.mockRestore();
    });

    test('processTenantEvents auto-evicts tenant and cleans queue when aging up with unresolved renewalPending', () => {
        const user = {
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 0, monthlyRent: 1500, renewalPending: true }
                }
            ]
        };
        const state = {
            gameState: {
                pendingTenantEvents: [
                    { eventType: 'lease_expiration', propertyId: 'prop_1', tenantName: 'Alice' }
                ]
            }
        };

        GameLogic.processTenantEvents(user, state);

        expect(user.assets[0].isRented).toBe(false);
        expect(user.assets[0].tenant).toBeNull();
        // Stale lease_expiration event should have been cleaned up
        expect(state.gameState.pendingTenantEvents.length).toBe(0);
    });

    test('processTenantEvents auto-evicts tenant defensively when leaseYears is negative or <= 0', () => {
        const user = {
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: -2, monthlyRent: 1500 }
                }
            ]
        };
        const state = { gameState: { pendingTenantEvents: [] } };

        GameLogic.processTenantEvents(user, state);

        expect(user.assets[0].isRented).toBe(false);
        expect(user.assets[0].tenant).toBeNull();
    });

    test('processTenantEvents and processRentalIncome do not push duplicate events for the same property', () => {
        const user = {
            money: 1000,
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    value: 200000,
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 1, monthlyRent: 1500, quality: 'risky' }
                }
            ]
        };
        const state = {
            gameState: {
                pendingTenantEvents: [
                    { eventType: 'overdue', propertyId: 'prop_1' },
                    { eventType: 'lease_expiration', propertyId: 'prop_1' },
                    { eventType: 'damage', propertyId: 'prop_1' }
                ]
            }
        };

        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Triggers risky default, renewal, and damage

        GameLogic.processRentalIncome(user, state);
        expect(state.gameState.pendingTenantEvents.filter(e => e.eventType === 'overdue').length).toBe(1);

        // Turn: renewal is queued, check that duplicate is avoided
        user.assets[0].tenant.leaseYears = 1;
        GameLogic.processTenantEvents(user, state);
        expect(state.gameState.pendingTenantEvents.filter(e => e.eventType === 'lease_expiration').length).toBe(1);

        randomSpy.mockRestore();
    });

    test('processRentalIncome does not collect rent if tenant has renewalPending', () => {
        const user = {
            money: 5000,
            assets: [
                {
                    id: 'prop_1',
                    category: 'property',
                    name: 'Condo',
                    isRented: true,
                    tenant: { id: 't1', name: 'Alice', leaseYears: 0, monthlyRent: 2000, quality: 'excellent', renewalPending: true }
                }
            ]
        };

        const collected = GameLogic.processRentalIncome(user);
        expect(collected).toBe(0);
        expect(user.money).toBe(5000);
    });
});
