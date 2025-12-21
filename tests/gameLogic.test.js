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