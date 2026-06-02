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

test("returns living expenses or 0", () => {
    expect(GameLogic.addLivingExpenses(20, false)).toBe(24000);
    expect(GameLogic.addLivingExpenses(17, false)).toBe(0);
    expect(GameLogic.addLivingExpenses(22, true)).toBe(0);
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