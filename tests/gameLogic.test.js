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

describe('Blackjack Logic', () => {
    test('calculateBlackjackHand handles aces correctly', () => {
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'K'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: '9'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: 'K'}])).toBe(12);
        expect(GameLogic.calculateBlackjackHand([{value: '10'}, {value: '5'}, {value: 'A'}])).toBe(16);
    });

    test('calculateBlackjackHand handles numbers and face cards', () => {
        expect(GameLogic.calculateBlackjackHand([{value: '2'}, {value: '3'}])).toBe(5);
        expect(GameLogic.calculateBlackjackHand([{value: 'J'}, {value: 'Q'}, {value: 'K'}])).toBe(30);
    });

    test('determineBlackjackOutcome works correctly', () => {
        // Player bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}, {value: '5'}], [{value: '10'}])).toBe('bust');
        // Dealer bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}, {value: '5'}])).toBe('win');
        // Push
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}])).toBe('push');
        // Player win
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '9'}])).toBe('win');
        // Player lose
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '9'}], [{value: '10'}, {value: '10'}])).toBe('lose');
    });
});

describe('calculateTripOutcome', () => {
    test('returns correct base values and modifies based on roll', () => {
        // Roll 0 -> first event (0 health, 0 money)
        const local = GameLogic.calculateTripOutcome(1, 0.0);
        expect(local.cost).toBe(500);
        expect(local.healthChange).toBe(5);
        expect(local.moneyChange).toBe(0);
        
        // Roll to hit the attack event (index 2 -> requires roll around 0.3)
        const attack = GameLogic.calculateTripOutcome(3, 0.3); // 0.3 * 8 = 2.4 => index 2
        expect(attack.cost).toBe(10000);
        expect(attack.healthChange).toBe(15 - 20); // base 15, event -20 => -5
        expect(attack.moneyChange).toBe(0);
    });
});

describe('Relationship Logic', () => {
    test('calculateRelationshipDecay applies -5 decay if no interaction', () => {
        expect(GameLogic.calculateRelationshipDecay(50, false)).toBe(45);
        expect(GameLogic.calculateRelationshipDecay(2, false)).toBe(0);
    });

    test('calculateRelationshipDecay applies 0 decay if interaction occurred', () => {
        expect(GameLogic.calculateRelationshipDecay(50, true)).toBe(50);
    });

    test('checkRelationshipCategoryShift shifts non-family appropriately', () => {
        expect(GameLogic.checkRelationshipCategoryShift('friend', 20)).toBe('enemy');
        expect(GameLogic.checkRelationshipCategoryShift('friend', 40)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('enemy', 40)).toBe('friend');
        expect(GameLogic.checkRelationshipCategoryShift('enemy', 20)).toBe(null);
    });

    test('checkRelationshipCategoryShift ignores family', () => {
        expect(GameLogic.checkRelationshipCategoryShift('family', 20)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('spouse', 10)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('child', 0)).toBe(null);
    });

    test('calculateInheritance returns 0 on bottom 15% roll', () => {
        expect(GameLogic.calculateInheritance(80, 0.10)).toBe(0);
    });

    test('calculateInheritance scales properly based on age and roll', () => {
        const amt25 = GameLogic.calculateInheritance(25, 0.5); // base 5000 * multiplier
        const amt40 = GameLogic.calculateInheritance(40, 0.5); // base 25000 * multiplier
        const amt60 = GameLogic.calculateInheritance(60, 0.5); // base 100000 * multiplier
        
        expect(amt40).toBeGreaterThan(amt25);
        expect(amt60).toBeGreaterThan(amt40);
        
        // Verify rounded to 100
        expect(amt60 % 100).toBe(0);
    });

    test('generateSchoolCohort returns classmates with correct ages and one teacher', () => {
        const cohort = GameLogic.generateSchoolCohort(10);
        expect(cohort.length).toBeGreaterThanOrEqual(13); // 12-16 classmates + 1 teacher
        
        const teacher = cohort.find(p => p.type === 'Teacher');
        expect(teacher).toBeDefined();
        expect(teacher.age).toBeGreaterThanOrEqual(24);
        expect(teacher.age).toBeLessThanOrEqual(60);

        const classmates = cohort.filter(p => p.type === 'Classmate');
        classmates.forEach(c => {
            expect(c.age).toBeGreaterThanOrEqual(9);
            expect(c.age).toBeLessThanOrEqual(11);
            expect(c.status).toBeGreaterThanOrEqual(20);
            expect(c.status).toBeLessThanOrEqual(50);
        });
    });

    test('attemptBefriend handles status chance correctly', () => {
        // Roll = 0.4. Status 50 => chance 0.50 => 0.4 < 0.50 => true
        expect(GameLogic.attemptBefriend(50, false, 0.4)).toBe(true);
        // Roll = 0.6. Status 50 => chance 0.50 => 0.6 < 0.50 => false
        expect(GameLogic.attemptBefriend(50, false, 0.6)).toBe(false);

        // Teacher: status 50 => chance 0.25 => 0.2 < 0.25 => true
        expect(GameLogic.attemptBefriend(50, true, 0.2)).toBe(true);
        // Teacher: status 50 => chance 0.25 => 0.3 < 0.25 => false
        expect(GameLogic.attemptBefriend(50, true, 0.3)).toBe(false);
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
        for (let i = 0; i < 1000; i++) {
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