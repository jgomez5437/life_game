import { jest } from '@jest/globals';
import { GameLogic } from '../public/src/core/gameLogic.js';

describe('Underworld, High-Risk & Crime System Engine', () => {

    let user;

    beforeEach(() => {
        user = {
            username: "Test Criminal",
            age: 25,
            money: 50000,
            health: 80,
            happiness: 75,
            smarts: 80,
            looks: 70,
            jobTitle: "Software Developer",
            salary: 72000,
            relationships: [
                { id: "rel_1", name: "Rival Bob", category: "friend", status: 50, type: "Friend" },
                { id: "rel_2", name: "Spouse Alice", category: "spouse", status: 90, type: "Spouse" }
            ],
            spouse: { id: "rel_2", name: "Spouse Alice" },
            criminalRecord: []
        };
    });

    test('CRIMES catalog exposes teen and adult categories', () => {
        expect(GameLogic.CRIMES).toHaveProperty('prank_call');
        expect(GameLogic.CRIMES).toHaveProperty('gta');
        expect(GameLogic.CRIMES).toHaveProperty('murder');
        expect(GameLogic.CRIMES.prank_call.category).toBe('juvenile');
        expect(GameLogic.CRIMES.gta.category).toBe('heist');
        expect(GameLogic.CRIMES.murder.category).toBe('violent');
    });

    test('attemptCrime awards money on non-violent heist success', () => {
        const userHighSmarts = { ...user, smarts: 100 };
        let result = GameLogic.attemptCrime('vandalism', userHighSmarts);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('crime');
    });

    test('attemptCrime against relationship target removes victim on successful murder', () => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

        const result = GameLogic.attemptCrime('murder', user, 'rel_2');

        expect(result.success).toBe(true);
        expect(result.isMurder).toBe(true);
        expect(result.victimName).toBe('Spouse Alice');
        expect(user.relationships.find(r => r.id === 'rel_2')).toBeUndefined();
        expect(user.spouse).toBeNull();

        spy.mockRestore();
    });

    test('attemptCrime non-lethal target converts relationship to enemy', () => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

        const result = GameLogic.attemptCrime('assault', user, 'rel_1');

        expect(result.success).toBe(true);
        const target = user.relationships.find(r => r.id === 'rel_1');
        expect(target.status).toBe(0);
        expect(target.category).toBe('enemy');

        spy.mockRestore();
    });

    test('attemptCrime failure sets pendingTrial on user', () => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

        const result = GameLogic.attemptCrime('gta', user);

        expect(result.success).toBe(false);
        expect(result.arrested).toBe(true);
        expect(user.pendingTrial).not.toBeNull();
        expect(user.pendingTrial.crime.id).toBe('gta');

        spy.mockRestore();
    });

    test('handleArrestAction comply proceeds to court', () => {
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 70, extraCharges: [] };
        const res = GameLogic.handleArrestAction(user, 'comply');
        expect(res.outcome).toBe('court');
    });

    test('handleArrestAction bribe succeeds when bribe amount and looks are high', () => {
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 70, extraCharges: [] };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.05);

        const res = GameLogic.handleArrestAction(user, 'bribe', 5000);

        expect(res.outcome).toBe('escaped');
        expect(user.pendingTrial).toBeNull();

        spy.mockRestore();
    });

    test('calculateTrialVerdict guilty deducts fine, updates record, and removes job', () => {
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 95, extraCharges: [] };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

        const result = GameLogic.calculateTrialVerdict(user, 'public_defender');

        expect(result.verdict).toBe('guilty');
        expect(user.money).toBeLessThan(50000);
        expect(user.criminalRecord.length).toBe(1);
        expect(user.criminalRecord[0].crimeId).toBe('gta');
        expect(user.criminalRecord[0].severity).toBe('felony');
        expect(user.jobTitle).toBeNull();

        spy.mockRestore();
    });

    test('calculateTrialVerdict not_guilty acquits user', () => {
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 50, extraCharges: [] };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

        const result = GameLogic.calculateTrialVerdict(user, 'top_lawyer');

        expect(result.verdict).toBe('not_guilty');
        expect(user.pendingTrial).toBeNull();
        expect(user.criminalRecord.length).toBe(0);

        spy.mockRestore();
    });
    test('calculateTrialVerdict allows free public defender even when player has negative money', () => {
        user.money = -1500; // In debt
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 50, extraCharges: [] };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

        const result = GameLogic.calculateTrialVerdict(user, 'public_defender');

        expect(result).not.toHaveProperty('error');
        expect(result.verdict).toBe('not_guilty');
        expect(user.pendingTrial).toBeNull();

        spy.mockRestore();
    });

    test('calculateTrialVerdict blocks paid private attorney when player has insufficient funds', () => {
        user.money = 1000; // Private attorney costs $2,500
        user.pendingTrial = { crime: GameLogic.CRIMES.gta, evidenceRating: 50, extraCharges: [] };

        const result = GameLogic.calculateTrialVerdict(user, 'private_attorney');

        expect(result).toHaveProperty('error');
        expect(result.error).toContain('Insufficient funds');
    });

});
