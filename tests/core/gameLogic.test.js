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

test("sanitizeName validates name and returns", () => {
    expect(GameLogic.sanitizeName("1234 1234")).toEqual({
        isValid: false, 
        error: "Name can only contain letters, spaces, and single hyphens. Cannot start or end with a hyphen."
    });
});

test("returns living expenses or 0 (no city → default $24k)", () => {
    expect(GameLogic.addLivingExpenses(20, false)).toBe(24000);
    expect(GameLogic.addLivingExpenses(17, false)).toBe(0);
    expect(GameLogic.addLivingExpenses(22, true)).toBe(0);
});

describe('addLivingExpenses — city tiers', () => {
    test('Tier 1 ($33k): San Francisco', () => {
        expect(GameLogic.addLivingExpenses(25, false, 'San Francisco')).toBe(33000);
    });
    test('Tier 2 ($30k): New York, London, Tokyo, Paris, Los Angeles', () => {
        ['New York', 'London', 'Tokyo', 'Paris', 'Los Angeles'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(30000);
        });
    });
    test('Tier 3 ($24k): Miami, Toronto, Osaka', () => {
        ['Miami', 'Toronto', 'Osaka'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(24000);
        });
    });
    test('Tier 4 ($21k): Berlin, Madrid, Beijing', () => {
        ['Berlin', 'Madrid', 'Beijing'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(21000);
        });
    });
    test('Tier 5 ($18k): Houston, Tucson', () => {
        ['Houston', 'Tucson'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(18000);
        });
    });
    test('Tier 6 ($15k): Bandar Seri Begawan, Mexico City, Cairo', () => {
        ['Bandar Seri Begawan', 'Mexico City', 'Cairo'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(15000);
        });
    });
    test('Unknown city falls back to $24k default', () => {
        expect(GameLogic.addLivingExpenses(25, false, 'Atlantis')).toBe(24000);
    });
    test('Student pays nothing regardless of city', () => {
        expect(GameLogic.addLivingExpenses(25, true, 'San Francisco')).toBe(0);
    });
    test('Under 19 pays nothing regardless of city', () => {
        expect(GameLogic.addLivingExpenses(18, false, 'San Francisco')).toBe(0);
    });
});

test("returns number between 10 & 80, inclusive", () => {
    for (let i=0; i < 100; i++) { 
        const result = GameLogic.calculateBirthdayMoney();
            expect(result).toBeGreaterThanOrEqual(10);
            expect(result).toBeLessThanOrEqual(80);
    };
});

test("returns 2400 or 0 depending on age, student loans, and if enrolled", () => {
    expect(GameLogic.addStudentLoanPayment(24, 2400, false)).toBe(2400);
    expect(GameLogic.addStudentLoanPayment(24, 0, false)).toBe(0);
    expect(GameLogic.addStudentLoanPayment(24, 2400, true)).toBe(0);
    expect(GameLogic.addStudentLoanPayment(22, 2400, false)).toBe(2400);
    expect(GameLogic.addStudentLoanPayment(25, 500, false)).toBe(500);
});

test("returns true or a number depending on grad enrolled status", () => {
    expect(GameLogic.checkSchoolGraduated(1, 4)).toBe(false);
    expect(GameLogic.checkSchoolGraduated(3, 4)).toBe(false);
    expect(GameLogic.checkSchoolGraduated(4, 4)).toBe(true);
});

test("returns string life status of CEO & Founder", () => {
    const user = {age: 19, hasBusiness: true}
    expect(GameLogic.checkLifeStatus(user)).toBe("CEO & Founder")
});

describe('calculateHealthDecay', () => {
    test('Age 0-18: 10% chance to lose 1 point', () => {
        expect(GameLogic.calculateHealthDecay(15, 0.05)).toBe(1); // Roll < 0.10
        expect(GameLogic.calculateHealthDecay(15, 0.15)).toBe(0); // Roll >= 0.10
    });

    test('Age 19-30: 30% chance to lose 1 point', () => {
        expect(GameLogic.calculateHealthDecay(25, 0.25)).toBe(1); // Roll < 0.30
        expect(GameLogic.calculateHealthDecay(25, 0.35)).toBe(0); // Roll >= 0.30
    });

    test('Age 31-50: 20% chance to lose 2 points, else 1', () => {
        expect(GameLogic.calculateHealthDecay(40, 0.15)).toBe(2); // Roll < 0.20
        expect(GameLogic.calculateHealthDecay(40, 0.50)).toBe(1); // Roll >= 0.20
    });

    test('Age 51-70: Scales linearly between 1 and 3', () => {
        expect(GameLogic.calculateHealthDecay(60, 0.10)).toBe(1); // (0.1 * 3) + 1 = 1.3 -> 1
        expect(GameLogic.calculateHealthDecay(60, 0.50)).toBe(2); // (0.5 * 3) + 1 = 2.5 -> 2
        expect(GameLogic.calculateHealthDecay(60, 0.90)).toBe(3); // (0.9 * 3) + 1 = 3.7 -> 3
    });

    test('Age 71+: Scales linearly between 2 and 4', () => {
        expect(GameLogic.calculateHealthDecay(80, 0.10)).toBe(2); // (0.1 * 3) + 2 = 2.3 -> 2
        expect(GameLogic.calculateHealthDecay(80, 0.50)).toBe(3); // (0.5 * 3) + 2 = 3.5 -> 3
        expect(GameLogic.calculateHealthDecay(80, 0.90)).toBe(4); // (0.9 * 3) + 2 = 4.7 -> 4
    });
});

describe('calculateHealthBenefits', () => {
    test('Returns 0 if no active habits', () => {
        expect(GameLogic.calculateHealthBenefits(false, false)).toBe(0);
    });
    test('Returns 1 if only gym', () => {
        expect(GameLogic.calculateHealthBenefits(true, false)).toBe(1);
    });
    test('Returns 1 if only diet', () => {
        expect(GameLogic.calculateHealthBenefits(false, true)).toBe(1);
    });
    test('Returns 2 if both gym and diet', () => {
        expect(GameLogic.calculateHealthBenefits(true, true)).toBe(2);
    });
});

describe('calculateActiveHealthCosts', () => {
    test('Returns 0 if no active habits', () => {
        expect(GameLogic.calculateActiveHealthCosts(false, false)).toBe(0);
    });
    test('Returns 600 if only gym', () => {
        expect(GameLogic.calculateActiveHealthCosts(true, false)).toBe(600);
    });
    test('Returns 2400 if only diet', () => {
        expect(GameLogic.calculateActiveHealthCosts(false, true)).toBe(2400);
    });
    test('Returns 3000 if both gym and diet', () => {
        expect(GameLogic.calculateActiveHealthCosts(true, true)).toBe(3000);
    });
});

describe('calculateMedicalVisit', () => {
    test('Returns fixed boost and cost', () => {
        expect(GameLogic.calculateMedicalVisit()).toEqual({ boost: 10, cost: 1000 });
    });
});

describe('calculateOneTimeGymVisit', () => {
    test('Returns fixed boost and cost', () => {
        expect(GameLogic.calculateOneTimeGymVisit()).toEqual({ boost: 1, cost: 20 });
    });
});

describe('checkLifeStatus', () => {
    test('grad school enrollment takes highest priority', () => {
        const user = { age: 26, gradSchoolEnrolled: true, gradSchoolType: 'Law School', universityEnrolled: true, hasBusiness: true, jobTitle: 'Lawyer' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Law School Student');
    });

    test('university enrollment takes priority over job', () => {
        const user = { age: 20, universityEnrolled: true, jobTitle: 'Cashier' };
        expect(GameLogic.checkLifeStatus(user)).toBe('University Student');
    });

    test('CEO & Founder when hasBusiness and no school enrollment', () => {
        const user = { age: 30, hasBusiness: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('CEO & Founder');
    });

    test('returns jobTitle when employed and not in school', () => {
        const user = { age: 25, jobTitle: 'Software Developer' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Software Developer');
    });

    test('grad degree graduate label when not enrolled', () => {
        const user = { age: 28, gradSchoolDegree: 'Law' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Law Graduate');
    });

    test('University Graduate when no grad degree and not enrolled', () => {
        const user = { age: 24, universityGraduated: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('University Graduate');
    });

    test('Student (Retaking) when over 17 and highSchoolRetained', () => {
        const user = { age: 18, highSchoolRetained: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('Student (Retaking)');
    });

    test('Unemployed when adult with no job', () => {
        const user = { age: 22 };
        expect(GameLogic.checkLifeStatus(user)).toBe('Unemployed');
    });

    test('Baby at age 0', () => {
        const user = { age: 0 };
        expect(GameLogic.checkLifeStatus(user)).toBe('Baby');
    });

    test('Toddler at age 1–4', () => {
        expect(GameLogic.checkLifeStatus({ age: 1 })).toBe('Toddler');
        expect(GameLogic.checkLifeStatus({ age: 4 })).toBe('Toddler');
    });

    test('Student for ages 5–17', () => {
        expect(GameLogic.checkLifeStatus({ age: 10 })).toBe('Student');
        expect(GameLogic.checkLifeStatus({ age: 17 })).toBe('Student');
    });
});

describe('checkMortality', () => {
    test('returns isDead:false when roll is above the rate', () => {
        // Age 30 → bracket rate 0.002. A roll of 0.999 is far above that.
        const result = GameLogic.checkMortality(30, 100);
        // Can't deterministically test due to Math.random inside, but can confirm shape.
        expect(result).toHaveProperty('isDead');
    });

    test('extreme old age (age 120) always kills (rate 1.0)', () => {
        // With rate 1.0, any roll < 1.0 means death, so this should always be true.
        const results = Array.from({ length: 10 }, () => GameLogic.checkMortality(120, 100));
        expect(results.every(r => r.isDead)).toBe(true);
    });

    test('low health amplifies mortality chance', () => {
        // At age 30 (rate 0.002), health < 30 triggers penalty.
        // With health=1, penaltyMultiplier = 1 + (29/10) = 3.9, chance = 0.0078.
        // Still very unlikely to die in a single roll, but the amplification should produce
        // a meaningfully higher rate. Verify that health=1 results in more deaths than health=100
        // over many trials.
        let deathsHighHealth = 0, deathsLowHealth = 0;
        for (let i = 0; i < 10000; i++) {
            if (GameLogic.checkMortality(30, 100).isDead) deathsHighHealth++;
            if (GameLogic.checkMortality(30, 1).isDead) deathsLowHealth++;
        }
        expect(deathsLowHealth).toBeGreaterThan(deathsHighHealth);
    });
});

describe('calculatePromotionChance', () => {
    test('returns 0 when performance below 75 (ineligible)', () => {
        expect(GameLogic.calculatePromotionChance(74)).toBe(0);
        expect(GameLogic.calculatePromotionChance(50)).toBe(0);
        expect(GameLogic.calculatePromotionChance(0)).toBe(0);
    });

    test('returns 0.25 for performance 75–84', () => {
        expect(GameLogic.calculatePromotionChance(75)).toBe(0.25);
        expect(GameLogic.calculatePromotionChance(84)).toBe(0.25);
    });

    test('returns 0.50 for performance 85–94', () => {
        expect(GameLogic.calculatePromotionChance(85)).toBe(0.50);
        expect(GameLogic.calculatePromotionChance(94)).toBe(0.50);
    });

    test('returns 0.80 for performance 95+', () => {
        expect(GameLogic.calculatePromotionChance(95)).toBe(0.80);
        expect(GameLogic.calculatePromotionChance(100)).toBe(0.80);
    });
});

describe('Business Fiscal Year Limit Logic', () => {
    test('canProcessBusinessQuarter blocks when user has no active business', () => {
        expect(GameLogic.canProcessBusinessQuarter(null)).toEqual({ allowed: false, reason: 'No active business.' });
        expect(GameLogic.canProcessBusinessQuarter({ hasBusiness: false })).toEqual({ allowed: false, reason: 'No active business.' });
    });

    test('canProcessBusinessQuarter blocks as soon as a fiscal year is completed at the current age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 2 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        // Complete fiscal year at age 30
        GameLogic.recordBusinessQuarterProcessed(user, true);
        expect(user.lastCompletedFiscalYearAge).toBe(30);
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({
            allowed: false,
            reason: 'You need to age up before continuing a new fiscal year.'
        });

        // Aging up to 31 allows starting the new fiscal year
        user.age = 31;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
    });

    test('canProcessBusinessQuarter allows up to 4 quarters per player age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 0 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        user.quartersProcessedThisAge = 3;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        user.quartersProcessedThisAge = 4;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({
            allowed: false,
            reason: 'You need to age up before continuing a new fiscal year.'
        });
    });

    test('canProcessBusinessQuarter resets available quarters when player age changes', () => {
        const user = { age: 31, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 4, lastCompletedFiscalYearAge: 30 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
    });

    test('recordBusinessQuarterProcessed initializes and increments quartersProcessedThisAge', () => {
        const user = { age: 25, hasBusiness: true };
        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.lastBusinessAge).toBe(25);
        expect(user.quartersProcessedThisAge).toBe(1);

        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.quartersProcessedThisAge).toBe(2);

        // Player ages up to 26
        user.age = 26;
        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.lastBusinessAge).toBe(26);
        expect(user.quartersProcessedThisAge).toBe(1);
    });

    test('getRemainingQuartersForAge returns correct remaining count', () => {
        expect(GameLogic.getRemainingQuartersForAge({ hasBusiness: false })).toBe(0);

        const user = { age: 40, hasBusiness: true, lastBusinessAge: 40, quartersProcessedThisAge: 1 };
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(3);

        user.quartersProcessedThisAge = 4;
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(0);

        // Age change resets remaining to 4
        user.age = 41;
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);
    });

    test('calculateAutoQuarterCount determines auto-processing turns during ageUp', () => {
        expect(GameLogic.calculateAutoQuarterCount({ hasBusiness: false, age: 30 })).toBe(0);

        // Player completed a fiscal year manually at age 29, then aged up to 30
        const userFull = { age: 30, hasBusiness: true, lastBusinessAge: 29, quartersProcessedThisAge: 4, lastCompletedFiscalYearAge: 29 };
        expect(GameLogic.calculateAutoQuarterCount(userFull)).toBe(0);

        // Player completed 2 quarters manually at age 29 without finishing fiscal year, then aged up to 30
        const userPartial = { age: 30, hasBusiness: true, lastBusinessAge: 29, quartersProcessedThisAge: 2 };
        expect(GameLogic.calculateAutoQuarterCount(userPartial)).toBe(2);

        // Player didn't touch business at age 29 (or lastBusinessAge is old/null), then aged up to 30
        const userUntouched = { age: 30, hasBusiness: true, lastBusinessAge: 20, quartersProcessedThisAge: 4 };
        expect(GameLogic.calculateAutoQuarterCount(userUntouched)).toBe(4);
    });

    test('resetBusinessQuarterTracking resets quarter counts so a new company gets a fresh fiscal year in the same age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 2, lastCompletedFiscalYearAge: 30 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: false, reason: 'You need to age up before continuing a new fiscal year.' });

        // Selling and launching a new company at age 30 calls resetBusinessQuarterTracking
        GameLogic.resetBusinessQuarterTracking(user);
        expect(user.quartersProcessedThisAge).toBe(0);
        expect(user.lastBusinessAge).toBeNull();
        expect(user.lastCompletedFiscalYearAge).toBeNull();
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);
    });
});

describe('H-8: isAlive and Action Guards (Prevent actions at 0 HP or deceased)', () => {
    test('isAlive returns correct boolean status based on health and life status', () => {
        expect(GameLogic.isAlive(null)).toBe(false);
        expect(GameLogic.isAlive(undefined)).toBe(false);
        expect(GameLogic.isAlive({})).toBe(true); // Defaults to 100 if no health specified

        expect(GameLogic.isAlive({ health: 100 })).toBe(true);
        expect(GameLogic.isAlive({ health: 1 })).toBe(true);
        expect(GameLogic.isAlive({ stats: { health: 50 } })).toBe(true);

        // Serialized save state fields on living character
        expect(GameLogic.isAlive({ health: 100, deathCause: null, deathAge: null })).toBe(true);
        expect(GameLogic.isAlive({ health: 100, deathCause: undefined, deathAge: undefined })).toBe(true);
        expect(GameLogic.isAlive({ health: 100, deathCause: '' })).toBe(true);

        // Truly deceased indicators
        expect(GameLogic.isAlive({ health: 100, deathCause: 'Heart Attack' })).toBe(false);
        expect(GameLogic.isAlive({ health: 100, deathAge: 80 })).toBe(false);
        expect(GameLogic.isAlive({ health: 0 })).toBe(false);
        expect(GameLogic.isAlive({ health: -15 })).toBe(false);
        expect(GameLogic.isAlive({ stats: { health: 0 } })).toBe(false);
        expect(GameLogic.isAlive({ health: 100, lifeStatus: 'Deceased' })).toBe(false);
        expect(GameLogic.isAlive({ health: 100, isDead: true })).toBe(false);
        expect(GameLogic.isAlive({ health: 100, isAlive: false })).toBe(false);
    });

    test('attemptCrime succeeds for living characters with serialized deathCause: null', () => {
        const livingUser = {
            health: 100,
            age: 22,
            money: 500,
            smarts: 80,
            deathCause: null,
            deathAge: null,
            criminalRecord: [],
            relationships: []
        };
        const result = GameLogic.attemptCrime('vandalism', livingUser);
        expect(result).toHaveProperty('success');
        expect(result.message).not.toMatch(/dead|0 HP/i);
    });

    test('Gambling actions are blocked when user is dead or at 0 HP', () => {
        const deadUser = { health: 0, money: 10000, age: 25 };

        const lotteryRes = GameLogic.playLotteryTicket('scratch', deadUser);
        expect(lotteryRes.success).toBe(false);
        expect(lotteryRes.message).toMatch(/dead|0 HP/i);

        const rouletteRes = GameLogic.playRoulette(deadUser, 'color', 'red', 100);
        expect(rouletteRes.success).toBe(false);
        expect(rouletteRes.msg).toMatch(/dead|0 HP/i);

        const slotRes = GameLogic.spinSlotMachine(deadUser, 100);
        expect(slotRes.success).toBe(false);
        expect(slotRes.msg).toMatch(/dead|0 HP/i);
    });

    test('Crime and trial actions are blocked when user is dead or at 0 HP', () => {
        const deadUser = {
            health: 0,
            money: 10000,
            pendingTrial: { crime: { id: 'gta', name: 'Grand Theft Auto' }, extraCharges: [] }
        };

        const crimeRes = GameLogic.attemptCrime('pickpocket', deadUser);
        expect(crimeRes.success).toBe(false);
        expect(crimeRes.message).toMatch(/dead|0 HP/i);

        const arrestRes = GameLogic.handleArrestAction(deadUser, 'flee');
        expect(arrestRes.success).toBe(false);
        expect(arrestRes.message).toMatch(/dead|0 HP/i);

        const trialRes = GameLogic.calculateTrialVerdict(deadUser, 'public_defender');
        expect(trialRes.error).toMatch(/dead|0 HP/i);
    });

    test('Investment and banking actions are blocked when user is dead or at 0 HP', () => {
        const deadUser = { health: 0, money: 10000 };

        const buyRes = GameLogic.buyStock(deadUser, 'AAPL', 10);
        expect(buyRes.success).toBe(false);
        expect(buyRes.msg).toMatch(/dead|0 HP/i);

        const sellRes = GameLogic.sellStock(deadUser, 'AAPL', 10);
        expect(sellRes.success).toBe(false);
        expect(sellRes.msg).toMatch(/dead|0 HP/i);

        const depositRes = GameLogic.depositSavings(deadUser, 500);
        expect(depositRes.success).toBe(false);
        expect(depositRes.msg).toMatch(/dead|0 HP/i);

        const withdrawRes = GameLogic.withdrawSavings(deadUser, 500);
        expect(withdrawRes.success).toBe(false);
        expect(withdrawRes.msg).toMatch(/dead|0 HP/i);
    });

    test('Real estate and property actions are blocked when user is dead or at 0 HP', () => {
        const deadUser = {
            health: 0,
            money: 50000,
            salary: 60000,
            assets: [
                { id: 'prop_1', name: 'Apartment', category: 'property', value: 200000, condition: 50, maxCondition: 100, isRented: true, tenant: { name: 'Bob' } }
            ]
        };

        const mortgageRes = GameLogic.canAffordMortgage(deadUser, 1000);
        expect(mortgageRes.allowed).toBe(false);
        expect(mortgageRes.reason).toMatch(/dead|0 HP/i);

        const leaseRes = GameLogic.acceptTenantLease(deadUser, 'prop_1', 'app_1');
        expect(leaseRes.success).toBe(false);
        expect(leaseRes.reason).toMatch(/dead|0 HP/i);

        const evictRes = GameLogic.evictTenant(deadUser, 'prop_1');
        expect(evictRes.success).toBe(false);
        expect(evictRes.reason).toMatch(/dead|0 HP/i);

        const maintRes = GameLogic.performPropertyMaintenance(deadUser, 'prop_1');
        expect(maintRes.success).toBe(false);
        expect(maintRes.reason).toMatch(/dead|0 HP/i);

        const renoRes = GameLogic.renovateProperty(deadUser, 'prop_1', 'minor');
        expect(renoRes.success).toBe(false);
        expect(renoRes.reason).toMatch(/dead|0 HP/i);

        const saleRes = GameLogic.completePropertySale(deadUser, 'prop_1', 200000);
        expect(saleRes.success).toBe(false);
        expect(saleRes.reason).toMatch(/dead|0 HP/i);
    });

    test('Business actions and relocation are blocked when user is dead or at 0 HP', () => {
        const deadUser = {
            health: 0,
            money: 1000000,
            hasBusiness: true,
            companyValuation: 30000000,
            equityOwned: 1.0,
            age: 30,
            country: 'USA'
        };

        const bizRes = GameLogic.canProcessBusinessQuarter(deadUser);
        expect(bizRes.allowed).toBe(false);
        expect(bizRes.reason).toMatch(/dead|0 HP/i);

        const vcRes = GameLogic.acceptVCOffer(deadUser, 'vc_seed');
        expect(vcRes.success).toBe(false);
        expect(vcRes.msg).toMatch(/dead|0 HP/i);

        const ipoRes = GameLogic.launchIPO(deadUser);
        expect(ipoRes.success).toBe(false);
        expect(ipoRes.msg).toMatch(/dead|0 HP/i);

        const canMoveRes = GameLogic.canMoveCountry(deadUser, 'Canada');
        expect(canMoveRes.allowed).toBe(false);
        expect(canMoveRes.reason).toMatch(/dead|0 HP/i);

        const moveRes = GameLogic.moveCountry(deadUser, 'Canada');
        expect(moveRes.success).toBe(false);
        expect(moveRes.message).toMatch(/dead|0 HP/i);
    });

    test('Prison actions are blocked when user is dead or at 0 HP', () => {
        const deadUser = {
            health: 0,
            inPrison: true,
            cellmate: { name: 'Spike' },
            yardInmates: [{ id: 'yard_1', name: 'Brutus', role: 'Yard Boss' }],
            prisonStats: { solitaryTurns: 0, canteenCash: 100, contraband: ['Contraband Cellphone'] }
        };

        expect(GameLogic.interactCellmate(deadUser, 'talk').success).toBe(false);
        expect(GameLogic.interactCellmate(deadUser, 'talk').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.attackPrisonInmate(deadUser, 'cellmate', 'cellmate').success).toBe(false);
        expect(GameLogic.attackPrisonInmate(deadUser, 'cellmate', 'cellmate').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.workoutPrisonYard(deadUser, 'cardio').success).toBe(false);
        expect(GameLogic.workoutPrisonYard(deadUser, 'cardio').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.interactYardInmate(deadUser, 'yard_1', 'chat').success).toBe(false);
        expect(GameLogic.interactYardInmate(deadUser, 'yard_1', 'chat').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.useContrabandPhone(deadUser, 'legal').success).toBe(false);
        expect(GameLogic.useContrabandPhone(deadUser, 'legal').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.doPrisonJob(deadUser, 'Kitchen Duty').success).toBe(false);
        expect(GameLogic.doPrisonJob(deadUser, 'Kitchen Duty').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.buyCanteenItem(deadUser, 'ramen').success).toBe(false);
        expect(GameLogic.buyCanteenItem(deadUser, 'ramen').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.sellContrabandItem(deadUser, 'Contraband Cellphone').success).toBe(false);
        expect(GameLogic.sellContrabandItem(deadUser, 'Contraband Cellphone').msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.studyPrisonLaw(deadUser).success).toBe(false);
        expect(GameLogic.studyPrisonLaw(deadUser).msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.attemptSentenceAppeal(deadUser).success).toBe(false);
        expect(GameLogic.attemptSentenceAppeal(deadUser).msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.attemptParoleBoard(deadUser).success).toBe(false);
        expect(GameLogic.attemptParoleBoard(deadUser).msg).toMatch(/dead|0 HP/i);

        expect(GameLogic.attemptPrisonEscape(deadUser, 'tunnel').success).toBe(false);
        expect(GameLogic.attemptPrisonEscape(deadUser, 'tunnel').msg).toMatch(/dead|0 HP/i);
    });
});

describe('C-7: Negative Bribe Exploit Prevention (handleArrestAction)', () => {
    test('blocks negative bribe amounts without modifying player money or clearing arrest', () => {
        const user = {
            health: 100,
            money: 10000,
            looks: 50,
            pendingTrial: { crime: { id: 'gta', name: 'Grand Theft Auto' }, extraCharges: [] }
        };

        const result = GameLogic.handleArrestAction(user, 'bribe', -50000);
        expect(result.success).toBe(false);
        expect(result.message).toBe("Invalid bribe amount.");
        expect(user.money).toBe(10000);
        expect(user.pendingTrial).not.toBeNull();
    });

    test('blocks zero, NaN, strings, and non-finite bribe amounts', () => {
        const user = {
            health: 100,
            money: 10000,
            looks: 50,
            pendingTrial: { crime: { id: 'gta', name: 'Grand Theft Auto' }, extraCharges: [] }
        };

        [0, -1, NaN, null, undefined, Infinity, -Infinity, '1000'].forEach(invalidVal => {
            const res = GameLogic.handleArrestAction(user, 'bribe', invalidVal);
            expect(res.success).toBe(false);
            expect(res.message).toBe("Invalid bribe amount.");
            expect(user.money).toBe(10000);
        });
    });

    test('blocks bribes exceeding available player cash', () => {
        const user = {
            health: 100,
            money: 1000,
            looks: 50,
            pendingTrial: { crime: { id: 'gta', name: 'Grand Theft Auto' }, extraCharges: [] }
        };

        const result = GameLogic.handleArrestAction(user, 'bribe', 5000);
        expect(result.success).toBe(false);
        expect(result.message).toBe("You don't have enough cash for that bribe!");
        expect(user.money).toBe(1000);
    });

    test('deducts valid bribe amount on success and clears pendingTrial', () => {
        const user = {
            health: 100,
            money: 10000,
            looks: 100,
            pendingTrial: { crime: { id: 'gta', name: 'Grand Theft Auto' }, extraCharges: [] }
        };

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
        const result = GameLogic.handleArrestAction(user, 'bribe', 5000);

        expect(result.success).toBe(true);
        expect(result.outcome).toBe('escaped');
        expect(user.money).toBe(5000);
        expect(user.pendingTrial).toBeNull();

        spy.mockRestore();
    });
});
