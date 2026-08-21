import { GameLogic } from '../../public/src/core/gameLogic.js';
import { state } from '../../public/src/core/state.js';
import { continueAsChild } from '../../public/src/features/player/mainScreen.js';

describe('Inheritance & Estate Distribution Suite', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="header-user-info"></div>
            <div id="header-bank"></div>
        `;
    });

    describe('GameLogic.calculateEstateDistribution', () => {
        test('insolvent estate (negative money/assets) leaves $0 debt to heirs and sets isInsolvent: true', () => {
            const user = {
                money: -250000,
                assets: [{ category: 'vehicle', value: 10000 }],
                hasBusiness: false,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' },
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(-240000);
            expect(dist.distributableEstate).toBe(0);
            expect(dist.spouseShare).toBe(0);
            expect(dist.inheritancePerChild).toBe(0);
            expect(dist.isInsolvent).toBe(true);
        });

        test('positive estate with spouse and children splits 50% to spouse and remainder equally to children', () => {
            const user = {
                money: 400000,
                assets: [{ category: 'property', value: 600000 }],
                hasBusiness: false,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' },
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(1000000);
            expect(dist.distributableEstate).toBe(1000000);
            expect(dist.spouseShare).toBe(500000);
            expect(dist.inheritancePerChild).toBe(250000);
            expect(dist.isInsolvent).toBe(false);
        });

        test('positive estate with spouse and NO children transfers 100% to spouse', () => {
            const user = {
                money: 300000,
                assets: [],
                hasBusiness: true,
                compCash: 200000,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(500000);
            expect(dist.spouseShare).toBe(500000);
            expect(dist.inheritancePerChild).toBe(0);
        });

        test('positive estate with children and NO spouse splits 100% across children', () => {
            const user = {
                money: 900000,
                assets: [],
                hasBusiness: false,
                relationships: [
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' },
                    { id: 'child_3', name: 'Timmy', category: 'child', type: 'Son' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(900000);
            expect(dist.spouseShare).toBe(0);
            expect(dist.inheritancePerChild).toBe(300000);
        });
    });

    describe('continueAsChild Next-Generation Debt Protection', () => {
        test('child starts with $0 money (never negative) when continuing from an insolvent parent', () => {
            state.gameState = {
                user: {
                    username: 'Insolvent Parent',
                    gender: 'male',
                    city: 'Chicago',
                    age: 65,
                    money: -300000,
                    deathCause: 'Heart Attack',
                    generation: 1,
                    pastLives: [],
                    corporateDebt: { principal: 500000, interestRate: 0.10, monthlyPayment: 5000 },
                    relationships: [
                        { id: 'child_1', name: 'Heir Kid', type: 'Son', category: 'child', age: 20 }
                    ],
                    assets: []
                },
                currentEulogy: 'A daring gambler.',
                lifeLog: []
            };

            window.saveGame = () => {};

            // Even if negative amount was passed by mistake, it is clamped to $0
            continueAsChild(0, -300000);

            const newUser = state.gameState.user;
            expect(newUser.username).toBe('Heir Kid');
            expect(newUser.money).toBe(0);
            expect(newUser.corporateDebt.principal).toBe(0);
            expect(newUser.generation).toBe(2);

            const lifeLog = state.gameState.lifeLog[0].events;
            expect(lifeLog.some(e => e.msg.includes('clean financial slate'))).toBe(true);
        });

        test('child receives positive inheritance accurately when estate is solvent', () => {
            state.gameState = {
                user: {
                    username: 'Wealthy Parent',
                    gender: 'female',
                    city: 'Miami',
                    age: 80,
                    money: 2000000,
                    deathCause: 'Old Age',
                    generation: 1,
                    pastLives: [],
                    relationships: [
                        { id: 'child_1', name: 'Lucky Heir', type: 'Daughter', category: 'child', age: 30 }
                    ],
                    assets: []
                },
                currentEulogy: 'A wealthy matriarch.',
                lifeLog: []
            };

            window.saveGame = () => {};

            continueAsChild(0, 2000000);

            const newUser = state.gameState.user;
            expect(newUser.username).toBe('Lucky Heir');
            expect(newUser.money).toBe(2000000);
            expect(newUser.pastLives[0].inheritedMoney).toBe(2000000);
        });
    });

    describe('calculateInheritance and calculateSpousalLifeInsurance non-negative guarantees', () => {
        test('calculateInheritance never returns negative values', () => {
            expect(GameLogic.calculateInheritance(20, 0.05)).toBe(0);
            expect(GameLogic.calculateInheritance(80, 0.99)).toBeGreaterThan(0);
            expect(GameLogic.calculateInheritance(10, 0.5)).toBeGreaterThanOrEqual(0);
        });

        test('calculateSpousalLifeInsurance never returns negative values', () => {
            expect(GameLogic.calculateSpousalLifeInsurance(0.5, 0.5)).toBe(0);
            expect(GameLogic.calculateSpousalLifeInsurance(0.1, 0.5)).toBeGreaterThan(0);
        });
    });
});
