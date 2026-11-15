import { jest } from '@jest/globals';
import { Utils } from '../../public/src/ui/utils.js';

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

test('formatMoney uses Western numerals for non-Latin locales like Egypt and UAE', () => {
    expect(Utils.formatMoney(85000, 'Cairo')).toBe('E£85,000');
    expect(Utils.formatMoney(85000, 'Dubai')).toBe('AED 85,000');
    expect(Utils.formatMoney(85000, 'Berlin')).toBe('€85,000');
});

describe('Billion+ large number shortening', () => {
    test('Utils.formatMoney keeps full comma formatting under 1 Billion', () => {
        expect(Utils.formatMoney(1632272)).toBe('$1,632,272');
        expect(Utils.formatMoney(999999999)).toBe('$999,999,999');
        expect(Utils.formatMoney(-50000000)).toBe('-$50,000,000');
    });

    test('Utils.formatMoney shortens Billions, Trillions, Quadrillions, Quintillions, and beyond', () => {
        expect(Utils.formatMoney(1000000000)).toBe('$1B');
        expect(Utils.formatMoney(1250000000)).toBe('$1.25B');
        expect(Utils.formatMoney(-45200000000)).toBe('-$45.2B');
        expect(Utils.formatMoney(1500000000000)).toBe('$1.5T');
        expect(Utils.formatMoney(2500000000000000)).toBe('$2.5Qa');
        expect(Utils.formatMoney(7340000000000000000)).toBe('$7.34Qi');
        expect(Utils.formatMoney(3100000000000000000000)).toBe('$3.1Sx');
    });

    test('Utils.formatMoney promotes 999.999B rollover cleanly to 1T', () => {
        expect(Utils.formatMoney(999999999999)).toBe('$1T');
        expect(Utils.formatMoney(999999999999999)).toBe('$1Qa');
    });

    test('Utils.formatMoney applies international currency prefixes to shortened values', () => {
        expect(Utils.formatMoney(1250000000, 'London')).toBe('£1.25B');
        expect(Utils.formatMoney(1250000000, 'Dubai')).toBe('AED 1.25B');
        expect(Utils.formatMoney(2500000000000000, 'Berlin')).toBe('€2.5Qa');
    });

    test('Utils.formatCompactMoney supports Quadrillions and beyond as well as 999K->1M rollover', () => {
        expect(Utils.formatCompactMoney(999999)).toBe('$1M');
        expect(Utils.formatCompactMoney(2500000000000000)).toBe('$2.5Qa');
        expect(Utils.formatCompactMoney(4200000000000000000)).toBe('$4.2Qi');
    });
});

describe('Utils.escapeHtml', () => {
    test('escapes HTML tags, scripts, and injection payloads', () => {
        expect(Utils.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(Utils.escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
        expect(Utils.escapeHtml('<svg onload=alert(1)>')).toBe('&lt;svg onload=alert(1)&gt;');
    });

    test('escapes quotes and ampersands correctly', () => {
        expect(Utils.escapeHtml('"Hello" & \'World\'')).toBe('&quot;Hello&quot; &amp; &#39;World&#39;');
        expect(Utils.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('handles non-string, null, and undefined values safely', () => {
        expect(Utils.escapeHtml(null)).toBe('');
        expect(Utils.escapeHtml(undefined)).toBe('');
        expect(Utils.escapeHtml(12345)).toBe('12345');
        expect(Utils.escapeHtml(0)).toBe('0');
        expect(Utils.escapeHtml(false)).toBe('false');
    });

    test('leaves clean strings unchanged', () => {
        expect(Utils.escapeHtml('John Doe')).toBe('John Doe');
        expect(Utils.escapeHtml('Software Engineer')).toBe('Software Engineer');
        expect(Utils.escapeHtml('New York')).toBe('New York');
    });
});

