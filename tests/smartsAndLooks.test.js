import { GameLogic } from '../public/src/core/gameLogic.js';

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

});
