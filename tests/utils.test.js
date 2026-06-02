import { jest } from '@jest/globals';
import { Utils } from '../public/src/ui/utils.js';

test('formatMoney adds dollar sign and commas', () => {
    expect(Utils.formatMoney(2000)).toBe('$2,000');
    expect(Utils.formatMoney(1000000)).toBe('$1,000,000');
});