import { jest } from '@jest/globals';
import { GameLogic } from '../../../public/src/core/gameLogic.js';

describe('Prison System Logic', () => {
    let mockUser;

    beforeEach(() => {
        mockUser = {
            username: 'John Doe',
            gender: 'male',
            age: 25,
            money: 1000,
            health: 80,
            happiness: 70,
            smarts: 70,
            looks: 60,
            criminalRecord: [],
            relationships: [
                { id: 'rel_1', name: 'Jane Doe', category: 'spouse', type: 'Wife', gender: 'female', age: 24, status: 80 },
                { id: 'rel_2', name: 'Bob Smith', category: 'friend', type: 'Best Friend', gender: 'male', age: 25, status: 60 },
                { id: 'rel_3', name: 'Mary Doe', category: 'parent', type: 'Mother', gender: 'female', age: 50, status: 75 }
            ]
        };
    });

    test('initPrisonState correctly initializes incarceration state and applies conviction shock', () => {
        const verdict = {
            verdict: 'guilty',
            fine: 5000,
            sentenceYears: 5,
            crime: { id: 'gta', name: 'Grand Theft Auto', category: 'heist' }
        };

        GameLogic.initPrisonState(mockUser, verdict);

        expect(mockUser.inPrison).toBe(true);
        expect(mockUser.prisonSentenceRemaining).toBe(5);
        expect(mockUser.prisonTotalSentence).toBe(5);
        expect(mockUser.prisonSecurity).toBe('Maximum');
        expect(mockUser.prisonStats).toBeDefined();
        expect(mockUser.cellmate).toBeDefined();

        // Conviction shock check
        const spouse = mockUser.relationships.find(r => r.id === 'rel_1');
        const friend = mockUser.relationships.find(r => r.id === 'rel_2');
        const mother = mockUser.relationships.find(r => r.id === 'rel_3');

        expect(spouse.status).toBe(60); // 80 - 20
        expect(friend.status).toBe(35); // 60 - 25
        expect(mother.status).toBe(60); // 75 - 15
    });

    test('processPrisonAgeUp decrements sentence and applies differentiated relationship decay', () => {
        const verdict = {
            verdict: 'guilty',
            fine: 1000,
            sentenceYears: 2,
            crime: { id: 'pickpocket', name: 'Pickpocket', category: 'petty' }
        };

        GameLogic.initPrisonState(mockUser, verdict);
        
        // Initial values post-conviction shock: spouse=60, friend=35, mother=60
        GameLogic.processPrisonAgeUp(mockUser);

        const spouse = mockUser.relationships.find(r => r.id === 'rel_1');
        const friend = mockUser.relationships.find(r => r.id === 'rel_2');
        const mother = mockUser.relationships.find(r => r.id === 'rel_3');

        expect(spouse.status).toBe(48); // 60 - 12
        expect(friend.status).toBe(15); // 35 - 20
        expect(mother.status).toBe(52); // 60 - 8
    });

    test('sendPrisonLetter boosts relationship status with target contact', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'shoplift', category: 'petty' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.prisonStats.canteenCash = 20;
        const initialStatus = mockUser.relationships[0].status;

        const letterRes = GameLogic.sendPrisonLetter(mockUser, 'rel_1');
        expect(letterRes.success).toBe(true);
        expect(mockUser.relationships[0].status).toBe(initialStatus + 15);
        expect(mockUser.prisonStats.canteenCash).toBe(15);
    });

    test('requestConjugalVisit requires high guard relation and triggers pregnancy chance', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'shoplift', category: 'petty' } };
        GameLogic.initPrisonState(mockUser, verdict);

        // Low guard relation denied
        mockUser.prisonStats.guardRelation = 20;
        const deniedRes = GameLogic.requestConjugalVisit(mockUser, 'rel_1');
        expect(deniedRes.success).toBe(false);
        expect(deniedRes.msg).toContain('Guard relation is too low');

        // High guard relation granted
        mockUser.prisonStats.guardRelation = 70;
        const spyMath = jest.spyOn(Math, 'random').mockReturnValue(0.05); // Guarantee pregnancy roll < 0.35

        const grantedRes = GameLogic.requestConjugalVisit(mockUser, 'rel_1');
        expect(grantedRes.success).toBe(true);
        expect(grantedRes.pregnancyOccurred).toBe(true);
        expect(mockUser.isExpecting).toBe(true);
        expect(mockUser.expectingWithId).toBe('rel_1');

        spyMath.mockRestore();
    });

    test('Cellmate interaction builds relationship and canteen cash sharing', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'shoplift', category: 'petty' } };
        GameLogic.initPrisonState(mockUser, verdict);

        const initialStatus = mockUser.cellmate.status;
        const chatRes = GameLogic.interactCellmate(mockUser, 'talk');

        expect(chatRes.success).toBe(true);
        expect(mockUser.cellmate.status).toBeGreaterThan(initialStatus);

        // Share snack
        mockUser.prisonStats.canteenCash = 20;
        const snackRes = GameLogic.interactCellmate(mockUser, 'share_snack');

        expect(snackRes.success).toBe(true);
        expect(mockUser.prisonStats.canteenCash).toBe(10);
    });

    test('Prison job assignment generates annual canteen income', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'burglary', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        GameLogic.doPrisonJob(mockUser, 'Kitchen Duty');
        expect(mockUser.prisonStats.prisonJob).toBe('Kitchen Duty');

        const initialCash = mockUser.prisonStats.canteenCash;
        GameLogic.processPrisonAgeUp(mockUser);

        expect(mockUser.prisonStats.canteenCash).toBe(initialCash + 350);
    });

    test('Canteen store purchases snacks and contraband', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'vandalism', category: 'petty' } };
        GameLogic.initPrisonState(mockUser, verdict);
        mockUser.prisonStats.canteenCash = 100;

        const buySnack = GameLogic.buyCanteenItem(mockUser, 'ramen');
        expect(buySnack.success).toBe(true);
        expect(mockUser.prisonStats.canteenCash).toBe(95);

        const buyContraband = GameLogic.buyCanteenItem(mockUser, 'shank');
        expect(buyContraband.success).toBe(true);
        expect(mockUser.prisonStats.canteenCash).toBe(15);
        expect(mockUser.prisonStats.contraband).toContain('Handmade Shank');
    });

    test('Studying law increases Law Study points and smarts', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'burglary', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        const studyRes = GameLogic.studyPrisonLaw(mockUser);
        expect(studyRes.success).toBe(true);
        expect(mockUser.prisonStats.lawStudied).toBe(15);
        expect(mockUser.smarts).toBe(72);
    });

    test('Parole hearing requires serving at least 50% of total sentence', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 4, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        const premature = GameLogic.attemptParoleBoard(mockUser);
        expect(premature.success).toBe(false);
        expect(premature.msg).toContain('serve at least 50%');

        GameLogic.processPrisonAgeUp(mockUser);
        GameLogic.processPrisonAgeUp(mockUser);

        mockUser.prisonStats.goodBehaviorPoints = 80;
        mockUser.prisonStats.guardRelation = 80;

        const paroleEligible = GameLogic.attemptParoleBoard(mockUser);
        expect(paroleEligible.success).toBe(true);
    });

    test('Failed escape attempt increases sentence and places player in solitary confinement', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.smarts = 0;
        mockUser.health = 10;

        const spyMath = jest.spyOn(Math, 'random').mockReturnValue(0.99);

        const escapeRes = GameLogic.attemptPrisonEscape(mockUser, 'tunnel');

        expect(escapeRes.escaped).toBe(false);
        expect(mockUser.prisonSentenceRemaining).toBe(8);
        expect(mockUser.prisonStats.solitaryTurns).toBe(2);
        expect(mockUser.prisonSecurity).toBe('Maximum');

        spyMath.mockRestore();
    });

    test('generateYardInmates creates first-name-only inmates with avatars', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        expect(mockUser.yardInmates.length).toBeGreaterThan(0);
        mockUser.yardInmates.forEach(inmate => {
            expect(inmate.name.split(' ').length).toBe(1);
            expect(inmate.appearance).toBeDefined();
        });
    });

    test('Enhanced yard inmate interactions work correctly', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        const snitch = mockUser.yardInmates.find(i => i.role === 'Prison Snitch');
        mockUser.prisonStats.contraband = ['Pack of Cigarettes'];

        const frameRes = GameLogic.interactYardInmate(mockUser, snitch.id, 'frame_snitch');
        expect(frameRes.success).toBe(true);
        expect(mockUser.prisonStats.snitchFramed).toBe(true);
        expect(mockUser.prisonStats.contraband.length).toBe(0);
    });

    test('Contraband cellphone allows secret outside contacts and legal help', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.prisonStats.contraband = ['Contraband Cellphone'];

        const spyMath = jest.spyOn(Math, 'random').mockReturnValue(0.99);

        const initialStatus = mockUser.relationships[0].status;
        const callRes = GameLogic.useContrabandPhone(mockUser, 'contact', 'rel_1');

        expect(callRes.success).toBe(true);
        expect(mockUser.relationships[0].status).toBe(initialStatus + 20);

        const legalRes = GameLogic.useContrabandPhone(mockUser, 'legal');
        expect(legalRes.success).toBe(true);
        expect(mockUser.prisonStats.lawStudied).toBe(35);

        spyMath.mockRestore();
    });

    test('sellContrabandItem converts cell stash contraband into canteen cash', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.prisonStats.canteenCash = 10;
        mockUser.prisonStats.contraband = ['Handmade Shank', 'Contraband Cellphone'];

        const res = GameLogic.sellContrabandItem(mockUser, 'Handmade Shank');
        expect(res.success).toBe(true);
        expect(res.sellPrice).toBe(50);
        expect(mockUser.prisonStats.canteenCash).toBe(60);
        expect(mockUser.prisonStats.contraband).toEqual(['Contraband Cellphone']);
    });

    test('Solitary confinement restricts cellmate, yard, and job interactions', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.prisonStats.solitaryTurns = 1;

        const cellmateRes = GameLogic.interactCellmate(mockUser, 'talk');
        expect(cellmateRes.success).toBe(false);
        expect(cellmateRes.msg).toContain('solitary confinement');

        const yardRes = GameLogic.workoutPrisonYard(mockUser, 'bench_press');
        expect(yardRes.success).toBe(false);
        expect(yardRes.msg).toContain('solitary confinement');

        const inmate = mockUser.yardInmates[0];
        const inmateRes = GameLogic.interactYardInmate(mockUser, inmate.id, 'chat');
        expect(inmateRes.success).toBe(false);

        const solitaryAct = GameLogic.doSolitaryActivity(mockUser, 'pushups');
        expect(solitaryAct.success).toBe(true);
    });

    test('attackPrisonInmate handles brawl victory, shank attacks, and fatal homicide penalties', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.health = 100;
        mockUser.smarts = 100;
        mockUser.prisonStats.contraband = ['Handmade Shank'];

        const targetInmate = mockUser.yardInmates[0];
        const spyMath = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Win & Fatal Kill

        const res = GameLogic.attackPrisonInmate(mockUser, 'yard_inmate', targetInmate.id, 'shank');

        expect(res.success).toBe(true);
        expect(res.killed).toBe(true);
        expect(mockUser.prisonSentenceRemaining).toBe(18);
        expect(mockUser.prisonStats.solitaryTurns).toBe(2);
        expect(mockUser.prisonStats.respect).toBe(75);

        spyMath.mockRestore();
    });

    test('checkLifeStatus returns Inmate title when player is incarcerated', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        expect(mockUser.inPrison).toBe(true);
        expect(mockUser.jobTitle).toBeNull();

        const status = GameLogic.checkLifeStatus(mockUser);
        expect(status).toContain('Inmate');
    });

    test('attackPrisonInmate can trigger guard detection and solitary confinement penalty', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 3, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.health = 100;
        mockUser.smarts = 100;
        const targetInmate = mockUser.yardInmates[0];

        // Mock Math.random to simulate winning brawl but getting caught by guards:
        // 1: inmate defense roll, 2: win combat roll, 3: not killed roll, 4: caught by guards roll
        const spyMath = jest.spyOn(Math, 'random')
            .mockReturnValueOnce(0.1)  // inmate defense
            .mockReturnValueOnce(0.01) // win combat
            .mockReturnValueOnce(0.8)  // not killed
            .mockReturnValueOnce(0.1); // caught by guards

        const res = GameLogic.attackPrisonInmate(mockUser, 'yard_inmate', targetInmate.id, 'fists');

        expect(res.success).toBe(true);
        expect(res.solitary).toBe(true);
        expect(mockUser.prisonStats.solitaryTurns).toBe(1);
        expect(res.msg).toContain('BRAWL CAUGHT');

        spyMath.mockRestore();
    });

    test('processPrisonAgeUp decrements remaining sentence even while in solitary confinement', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 5, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.prisonStats.solitaryTurns = 2;
        expect(mockUser.prisonSentenceRemaining).toBe(5);

        const ageRes = GameLogic.processPrisonAgeUp(mockUser);

        expect(mockUser.prisonSentenceRemaining).toBe(4); // 5 - 1 = 4
        expect(mockUser.prisonStats.solitaryTurns).toBe(1); // 2 - 1 = 1
        expect(ageRes.events).toContain("Spent another grueling year in solitary confinement.");
    });

    test('killing cellmate sets cellmate to null during solitary, and assigns new cellmate upon return to Gen Pop', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 5, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.health = 100;
        mockUser.smarts = 100;

        const spyMath = jest.spyOn(Math, 'random').mockReturnValue(0.01); // Win & Fatal Kill
        const attackRes = GameLogic.attackPrisonInmate(mockUser, 'cellmate', 'cellmate', 'fists');
        expect(attackRes.killed).toBe(true);
        expect(mockUser.cellmate).toBeNull();
        expect(mockUser.prisonStats.solitaryTurns).toBe(2);
        spyMath.mockRestore();

        // 1st Year in Solitary: Still no cellmate assigned
        const age1 = GameLogic.processPrisonAgeUp(mockUser);
        expect(mockUser.cellmate).toBeNull();
        expect(mockUser.prisonStats.solitaryTurns).toBe(1);
        expect(age1.newCellmate).toBeNull();

        // 2nd Year in Solitary: Still no cellmate assigned
        const age2 = GameLogic.processPrisonAgeUp(mockUser);
        expect(mockUser.cellmate).toBeNull();
        expect(mockUser.prisonStats.solitaryTurns).toBe(0);
        expect(age2.newCellmate).toBeNull();

        // 3rd Year: Back in Gen Pop! New cellmate assigned and returned in result
        const age3 = GameLogic.processPrisonAgeUp(mockUser);
        expect(mockUser.cellmate).not.toBeNull();
        expect(age3.newCellmate).not.toBeNull();
        expect(age3.newCellmate.name).toBe(mockUser.cellmate.name);
    });

    test('processPrisonAgeUp increments age of outside relationships every year', () => {
        const verdict = { verdict: 'guilty', fine: 500, sentenceYears: 5, crime: { id: 'gta', category: 'heist' } };
        GameLogic.initPrisonState(mockUser, verdict);

        mockUser.relationships = [
            { id: 'rel_mom', name: 'Mary Smith', type: 'Mother', age: 45, status: 80, category: 'family' },
            { id: 'rel_friend', name: 'Bob Jones', type: 'Friend', age: 25, status: 50, category: 'friend' }
        ];

        GameLogic.processPrisonAgeUp(mockUser);

        expect(mockUser.relationships.find(r => r.id === 'rel_mom').age).toBe(46);
        expect(mockUser.relationships.find(r => r.id === 'rel_friend').age).toBe(26);
    });
});
