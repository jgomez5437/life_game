import { GameLogic } from '../public/src/core/gameLogic.js';
import { Utils } from '../public/src/ui/utils.js';

describe('Smarts & Looks Stats Engine', () => {

    test('generateRandomStats returns core stats within valid range', () => {
        const stats = GameLogic.generateRandomStats();
        expect(stats).toHaveProperty('health', 100);
        expect(stats).toHaveProperty('happiness', 100);
        expect(stats.smarts).toBeGreaterThanOrEqual(40);
        expect(stats.smarts).toBeLessThanOrEqual(95);
        expect(stats.looks).toBeGreaterThanOrEqual(40);
        expect(stats.looks).toBeLessThanOrEqual(95);
    });

    test('calculateSmartsDelta grows during school years for students', () => {
        const delta = GameLogic.calculateSmartsDelta(10, true);
        expect(delta).toBeGreaterThanOrEqual(1);
        expect(delta).toBeLessThanOrEqual(3);
    });

    test('calculateSmartsDelta returns 0 for healthy young adults not in school', () => {
        const delta = GameLogic.calculateSmartsDelta(30, false);
        expect(delta).toBe(0);
    });

    test('calculateLooksDelta decays past age 45', () => {
        let decCount = 0;
        for (let i = 0; i < 100; i++) {
            const delta = GameLogic.calculateLooksDelta(60);
            if (delta < 0) decCount++;
        }
        expect(decCount).toBeGreaterThan(0);
    });

    test('calculateLooksDelta returns 0 for young adults under 45', () => {
        const delta = GameLogic.calculateLooksDelta(25);
        expect(delta).toBe(0);
    });

    test('calculatePromotionChance grants bonus for high smarts', () => {
        const baseChance = GameLogic.calculatePromotionChance(85, 50);
        const highSmartsChance = GameLogic.calculatePromotionChance(85, 90);
        expect(highSmartsChance).toBeGreaterThan(baseChance);
    });

    test('clampStat correctly clamps out-of-range values and handles invalid inputs', () => {
        expect(GameLogic.clampStat(120)).toBe(100);
        expect(GameLogic.clampStat(-25)).toBe(0);
        expect(GameLogic.clampStat(75)).toBe(75);
        expect(GameLogic.clampStat(0)).toBe(0);
        expect(GameLogic.clampStat(100)).toBe(100);
        expect(GameLogic.clampStat(NaN, 50)).toBe(50);
        expect(GameLogic.clampStat(undefined, 80)).toBe(80);
        expect(GameLogic.clampStat(null, 30)).toBe(30);
    });

    test('Utils.clamp and Utils.clampStat clamp values properly', () => {
        expect(Utils.clamp(150, 0, 100)).toBe(100);
        expect(Utils.clamp(-10, 0, 100)).toBe(0);
        expect(Utils.clamp(45, 10, 50)).toBe(45);
        expect(Utils.clampStat(105)).toBe(100);
        expect(Utils.clampStat(-15)).toBe(0);
    });

    test('calculatePromotionChance safely handles out-of-range stats', () => {
        const extremeChance = GameLogic.calculatePromotionChance(150, 200);
        expect(extremeChance).toBeLessThanOrEqual(0.95);
        expect(extremeChance).toBeGreaterThanOrEqual(0);

        const negativeChance = GameLogic.calculatePromotionChance(-50, -100);
        expect(negativeChance).toBe(0);
    });

});

