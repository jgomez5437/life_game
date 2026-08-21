import { jest } from '@jest/globals';
import { Utils } from '../../public/src/ui/utils.js';
import { GameLogic } from '../../public/src/core/gameLogic.js';

describe('XSS Protection & HTML Sanitization Suite', () => {
    describe('GameLogic.sanitizeBusinessName', () => {
        test('rejects HTML tags, scripts, and injection characters', () => {
            const raw = '<script>alert("hacked")</script>';
            const res = GameLogic.sanitizeBusinessName(raw);
            expect(res.isValid).toBe(false);
            expect(res.error).toBeDefined();

            const imgXss = '<img src=x onerror=alert(1)>';
            const imgRes = GameLogic.sanitizeBusinessName(imgXss);
            expect(imgRes.isValid).toBe(false);
        });

        test('accepts valid business names and trims excess whitespace', () => {
            const valid = '   Acme & Sons, Inc.   ';
            const res = GameLogic.sanitizeBusinessName(valid);
            expect(res.isValid).toBe(true);
            expect(res.cleanedName).toBe('Acme & Sons, Inc.');
        });

        test('enforces length bounds (between 2 and 35 characters)', () => {
            const tooShort = 'A';
            const resShort = GameLogic.sanitizeBusinessName(tooShort);
            expect(resShort.isValid).toBe(false);
            expect(resShort.error).toContain('at least 2 characters');

            const tooLong = 'A'.repeat(40);
            const resLong = GameLogic.sanitizeBusinessName(tooLong);
            expect(resLong.isValid).toBe(false);
            expect(resLong.error).toContain('35 characters or less');
        });

        test('rejects empty or whitespace-only inputs', () => {
            expect(GameLogic.sanitizeBusinessName('').isValid).toBe(false);
            expect(GameLogic.sanitizeBusinessName('   ').isValid).toBe(false);
            expect(GameLogic.sanitizeBusinessName(null).isValid).toBe(false);
            expect(GameLogic.sanitizeBusinessName(undefined).isValid).toBe(false);
        });
    });

    describe('Utils.escapeHtml Integration in UI Strings', () => {
        test('neutralizes malicious payload in player name formatting', () => {
            const maliciousName = '<img src=x onerror=alert(document.cookie)>';
            const safe = Utils.escapeHtml(maliciousName);
            expect(safe).toBe('&lt;img src=x onerror=alert(document.cookie)&gt;');
            expect(safe).not.toContain('<img');
        });

        test('neutralizes event log message injections', () => {
            const maliciousLog = 'Won lottery <script>stealTokens()</script>!';
            const safe = Utils.escapeHtml(maliciousLog);
            expect(safe).toBe('Won lottery &lt;script&gt;stealTokens()&lt;/script&gt;!');
            expect(safe).not.toContain('<script>');
        });

        test('neutralizes NPC / partner name injections', () => {
            const maliciousSpouse = 'Jane "><iframe src="evil.com"> Doe';
            const safe = Utils.escapeHtml(maliciousSpouse);
            expect(safe).toBe('Jane &quot;&gt;&lt;iframe src=&quot;evil.com&quot;&gt; Doe');
            expect(safe).not.toContain('<iframe');
        });

        test('neutralizes city and job title injections', () => {
            const maliciousCity = '<a href="javascript:alert(1)">Metropolis</a>';
            const safeCity = Utils.escapeHtml(maliciousCity);
            expect(safeCity).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;Metropolis&lt;/a&gt;');
            expect(safeCity).not.toContain('<a href');

            const maliciousJob = 'CEO & "Chairman" <script>';
            const safeJob = Utils.escapeHtml(maliciousJob);
            expect(safeJob).toBe('CEO &amp; &quot;Chairman&quot; &lt;script&gt;');
        });
    });
});
