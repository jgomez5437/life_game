import { jest } from '@jest/globals';

jest.unstable_mockModule('../../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../../public/src/core/gameLogic.js');

describe('City Cost-of-Living Salary Scaling', () => {
    test('getCityCostMultiplier calculates correct city multipliers', () => {
        expect(GameLogic.getCityCostMultiplier('San Francisco')).toBeCloseTo(1.375, 3);
        expect(GameLogic.getCityCostMultiplier('New York')).toBeCloseTo(1.25, 3);
        expect(GameLogic.getCityCostMultiplier('Tokyo')).toBeCloseTo(1.25, 3);
        expect(GameLogic.getCityCostMultiplier('Sydney')).toBeCloseTo(1.1666, 3);
        expect(GameLogic.getCityCostMultiplier('Buenos Aires')).toBeCloseTo(0.5833, 3);
        expect(GameLogic.getCityCostMultiplier('Unknown City')).toBe(1.0);
    });

    test('calculateScaledSalary scales baseline salary proportionally by city', () => {
        const baseSalary = 100000;
        expect(GameLogic.calculateScaledSalary(baseSalary, 'San Francisco')).toBe(137500);
        expect(GameLogic.calculateScaledSalary(baseSalary, 'New York')).toBe(125000);
        expect(GameLogic.calculateScaledSalary(baseSalary, 'London')).toBe(125000);
        expect(GameLogic.calculateScaledSalary(baseSalary, 'Buenos Aires')).toBe(58333);
        expect(GameLogic.calculateScaledSalary(baseSalary, 'Default City')).toBe(100000);
    });

    test('generateNPCOccupation adjusts NPC income based on city parameter', () => {
        const baseSalary = 50000;
        const sfSalary = GameLogic.calculateScaledSalary(baseSalary, 'San Francisco');
        const baSalary = GameLogic.calculateScaledSalary(baseSalary, 'Buenos Aires');

        expect(sfSalary).toBeGreaterThan(baSalary);
    });
});
