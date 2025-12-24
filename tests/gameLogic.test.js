const GameLogic = require('../public/gameLogic')

test("sanitizeName validates name and returns", () => {
    expect(GameLogic.sanitizeName("1234")).toEqual({
        isValid: false, 
        error: "Name can only contain letters, spaces, and hyphens."
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
    expect(GameLogic.checkGradSchoolGraduated(1, 4)).toBe(false);
    expect(GameLogic.checkGradSchoolGraduated(3, 4)).toBe(false);
    expect(GameLogic.checkGradSchoolGraduated(4, 4)).toBe(true);
});