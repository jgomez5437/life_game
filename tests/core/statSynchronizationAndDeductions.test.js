import { jest } from '@jest/globals';
import { GameLogic } from '../../public/src/core/gameLogic.js';

describe('Stat Normalization & Synchronization Engine', () => {

    let user;

    beforeEach(() => {
        user = {
            username: "Stat Test User",
            age: 20,
            money: 5000,
            health: 80,
            happiness: 70,
            smarts: 65,
            looks: 60,
            stats: {
                health: 80,
                happiness: 70,
                smarts: 65,
                looks: 60
            },
            relationships: [],
            criminalRecord: []
        };
    });

    test('setStat synchronizes both top-level and stats sub-object and clamps between 0 and 100', () => {
        GameLogic.setStat(user, 'happiness', 95);
        expect(user.happiness).toBe(95);
        expect(user.stats.happiness).toBe(95);

        // Clamping upper bound
        GameLogic.setStat(user, 'health', 150);
        expect(user.health).toBe(100);
        expect(user.stats.health).toBe(100);

        // Clamping lower bound
        GameLogic.setStat(user, 'smarts', -20);
        expect(user.smarts).toBe(0);
        expect(user.stats.smarts).toBe(0);
    });

    test('adjustStat accurately adds and subtracts points with clamping', () => {
        GameLogic.adjustStat(user, 'happiness', 15);
        expect(user.happiness).toBe(85);
        expect(user.stats.happiness).toBe(85);

        GameLogic.adjustStat(user, 'happiness', -30);
        expect(user.happiness).toBe(55);
        expect(user.stats.happiness).toBe(55);

        GameLogic.adjustStat(user, 'looks', 100);
        expect(user.looks).toBe(100);
        expect(user.stats.looks).toBe(100);

        GameLogic.adjustStat(user, 'looks', -200);
        expect(user.looks).toBe(0);
        expect(user.stats.looks).toBe(0);
    });

    describe('Crime & Arrest Stat Impacts', () => {
        test('egging_house juvenile crime failure deducts -15 happiness', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99); // Force failure
            const initialHappiness = user.happiness;

            const result = GameLogic.attemptCrime('egging_house', user);

            expect(result.success).toBe(false);
            expect(user.happiness).toBe(initialHappiness - 15);
            expect(user.stats.happiness).toBe(initialHappiness - 15);

            spy.mockRestore();
        });

        test('prank_call juvenile failure deducts exactly -10 happiness (no double deduction)', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99); // Force failure
            const initialHappiness = user.happiness;

            const result = GameLogic.attemptCrime('prank_call', user);

            expect(result.success).toBe(false);
            expect(user.happiness).toBe(initialHappiness - 10);
            expect(user.stats.happiness).toBe(initialHappiness - 10);

            spy.mockRestore();
        });

        test('successful adult crime grants adrenaline happiness boost', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Force success
            const initialHappiness = user.happiness;

            const result = GameLogic.attemptCrime('pickpocket', user);

            expect(result.success).toBe(true);
            expect(user.happiness).toBeGreaterThan(initialHappiness);

            spy.mockRestore();
        });

        test('adult crime arrest deducts -20 happiness and creates pending trial', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99); // Force arrest
            const initialHappiness = user.happiness;

            const result = GameLogic.attemptCrime('gta', user);

            expect(result.success).toBe(false);
            expect(result.arrested).toBe(true);
            expect(user.happiness).toBe(initialHappiness - 20);

            spy.mockRestore();
        });

        test('fleeing arrest failure deducts health and happiness', () => {
            user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 70, extraCharges: [] };
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99); // Force flee failure
            const initialHealth = user.health;
            const initialHappiness = user.happiness;

            const res = GameLogic.handleArrestAction(user, 'flee');

            expect(res.outcome).toBe('flee_failed');
            expect(user.health).toBe(initialHealth - 10);
            expect(user.happiness).toBe(initialHappiness - 15);

            spy.mockRestore();
        });

        test('fleeing arrest success awards +15 happiness', () => {
            user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 70, extraCharges: [] };
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Force flee success
            const initialHappiness = user.happiness;

            const res = GameLogic.handleArrestAction(user, 'flee');

            expect(res.outcome).toBe('escaped');
            expect(user.happiness).toBe(initialHappiness + 15);

            spy.mockRestore();
        });

        test('trial verdict acquittal awards +25 happiness', () => {
            user.money = 50000;
            user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 30, extraCharges: [] };
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Force acquittal
            const initialHappiness = user.happiness;

            const verdict = GameLogic.calculateTrialVerdict(user, 'top_lawyer');

            expect(verdict.verdict).toBe('not_guilty');
            expect(user.happiness).toBe(initialHappiness + 25);

            spy.mockRestore();
        });

        test('prison sentencing conviction deducts -35 happiness', () => {
            const verdictResult = { crime: GameLogic.CRIMES.gta, sentenceYears: 5 };
            const initialHappiness = user.happiness;

            GameLogic.applySentencing(user, verdictResult, 'State Penitentiary');

            expect(user.inPrison).toBe(true);
            expect(user.happiness).toBe(initialHappiness - 35);
        });
    });

    describe('Prison Activity Stat Modifiers', () => {
        beforeEach(() => {
            user.inPrison = true;
            user.prisonStats = {
                respect: 25,
                guardRelation: 50,
                gang: 'None',
                canteenCash: 50,
                solitaryTurns: 0,
                goodBehaviorPoints: 10,
                prisonJob: 'None',
                lawStudied: 0,
                contraband: []
            };
        });

        test('prison bench press modifies health, looks, and happiness', () => {
            const initialHealth = user.health;

            const res = GameLogic.workoutPrisonYard(user, 'bench_press');

            expect(res.success).toBe(true);
            expect(user.health).toBeGreaterThan(initialHealth);
        });

        test('canteen snack purchase boosts happiness', () => {
            const initialHappiness = user.happiness;

            const res = GameLogic.buyCanteenItem(user, 'ramen');

            expect(res.success).toBe(true);
            expect(user.happiness).toBe(initialHappiness + 5);
        });

        test('legal study in prison library boosts smarts', () => {
            const initialSmarts = user.smarts;

            const res = GameLogic.studyPrisonLaw(user);

            expect(res.success).toBe(true);
            expect(user.smarts).toBe(initialSmarts + 2);
        });
    });

    describe('Vacation & Trip Stat Outcomes', () => {
        test('local, cross-country, and luxury trips yield tiered baseline happiness bonuses', () => {
            // Event index 0: perfectly relaxing trip (+5 extra happiness)
            const localRes = GameLogic.calculateTripOutcome(1, 0.05);
            expect(localRes.happinessChange).toBe(15); // 10 + 5

            const countryRes = GameLogic.calculateTripOutcome(2, 0.05);
            expect(countryRes.happinessChange).toBe(25); // 20 + 5

            const luxuryRes = GameLogic.calculateTripOutcome(3, 0.05);
            expect(luxuryRes.happinessChange).toBe(40); // 35 + 5
        });

        test('trip disaster event (lost luggage / food poisoning) deducts happiness', () => {
            // Event index 2 is Attacked on vacation (-25 happiness)
            const outcome = GameLogic.calculateTripOutcome(1, 0.28);

            expect(outcome.event).not.toBeNull();
            expect(outcome.happinessChange).toBe(0); // 10 base - 25 penalty clamped to 0
        });
    });

    describe('God Mode & Business Stat Mutations', () => {
        test('setStat correctly sets and synchronizes stats across root and stats sub-object', () => {
            GameLogic.setStat(user, 'health', 88);
            GameLogic.setStat(user, 'happiness', 92);
            GameLogic.setStat(user, 'smarts', 76);
            GameLogic.setStat(user, 'looks', 84);

            expect(user.health).toBe(88);
            expect(user.stats.health).toBe(88);
            expect(user.happiness).toBe(92);
            expect(user.stats.happiness).toBe(92);
            expect(user.smarts).toBe(76);
            expect(user.stats.smarts).toBe(76);
            expect(user.looks).toBe(84);
            expect(user.stats.looks).toBe(84);
        });

        test('adjustStat clamps accurately on high value overflows and negative underflows', () => {
            GameLogic.setStat(user, 'health', 95);
            GameLogic.adjustStat(user, 'health', 20);
            expect(user.health).toBe(100);
            expect(user.stats.health).toBe(100);

            GameLogic.adjustStat(user, 'health', -150);
            expect(user.health).toBe(0);
            expect(user.stats.health).toBe(0);
        });
    });

});
