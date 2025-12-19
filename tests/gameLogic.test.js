const GameLogic = require('../public/gameLogic')

test("sanitizeName validates name and returns", () => {
    expect(GameLogic.sanitizeName("1234")).toEqual({
        isValid: false, 
        error: "Name can only contain letters, spaces, and hyphens."
    });
});