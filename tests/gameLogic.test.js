const GameLogic = require('../public/gameLogic')

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