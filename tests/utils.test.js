import { jest } from '@jest/globals';
import { Utils } from '../public/src/ui/utils.js';

test('formatMoney defaults to USD', () => {
    expect(Utils.formatMoney(2000)).toMatch(/\$2,000/);
    expect(Utils.formatMoney(1000000)).toMatch(/\$1,000,000/);
});

test('formatMoney formats custom international cities dynamically', () => {
    expect(Utils.formatMoney(2000, 'London')).toMatch(/£2,000/);
    expect(Utils.formatMoney(5000, 'Tokyo')).toMatch(/[¥￥]5,000/);
    expect(Utils.formatMoney(1000, 'Sydney')).toMatch(/1,000/);
    expect(Utils.getCountryCode('London')).toBe('gb');
    expect(Utils.getCountryCode('Tokyo')).toBe('jp');
    expect(Utils.getCountryCode('Sydney')).toBe('au');
});