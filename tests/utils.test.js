const Utils = require('../public/utils')

test('formatMoney adds dollar sign and commas', () => {
    expect(Utils.formatMoney(2000)).toBe('$2,000');
    expect(Utils.formatMoney(1000000)).toBe('$1,000,000');
});