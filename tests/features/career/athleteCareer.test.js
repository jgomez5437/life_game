import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { SPECIAL_CAREER_TRACKS, PRO_SPORTS_LEAGUES } from '../../../public/src/core/constants.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { ageUp } from '../../../public/src/features/player/mainScreen.js';
import {
    openProSportsEntryModal,
    selectProSportTab,
    enterProSportsDraft,
    enterProSportsTryout
} from '../../../public/src/features/career/careerJobsScreen.js';
import {
    renderAthleteManager,
    attemptAthleteAction
} from '../../../public/src/features/career/jobCareerManagerScreen.js';

describe('Athlete and Pro Sports Purchasable Track', () => {

    const hasLog = (substr) => {
        if (!state.gameState?.lifeLog) return false;
        return state.gameState.lifeLog.some(entry =>
            Array.isArray(entry.events) && entry.events.some(e => e.msg && e.msg.toLowerCase().includes(substr.toLowerCase()))
        );
    };

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Jordan</span>
                <span id="header-age">21</span>
            </div>
            <div id="header-bank">$5,000</div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: "Jordan",
                age: 21,
                city: "Chicago",
                money: 5000,
                health: 95,
                happiness: 85,
                smarts: 75,
                looks: 80,
                careerTrack: null,
                careerLevel: 0,
                yearsInRole: 0,
                yearsInCareer: 0,
                jobTitle: null,
                jobSalary: 0,
                jobPerformance: 60,
                fame: 20,
                lifeStatus: "Alive",
                lifeLog: [],
                purchases: ['athlete_pack'],
                skills: {
                    basketball: { xp: 85, certified: true },
                    conditioning: { xp: 80, certified: true },
                    football: { xp: 10, certified: false },
                    baseball: { xp: 10, certified: false },
                    soccer: { xp: 10, certified: false }
                },
                athleteSport: null,
                athleteContract: null,
                athleteCareerEarnings: 0,
                athletePoorSeasons: 0,
                athleteGamesThisYear: 0,
                athleteEndorsementThisYear: false,
                athleteRings: 0,
                athleteMvps: 0,
                athleteDraftsEntered: {},
                athleteTryoutYear: {},
                schoolSportsHistory: []
            },
            lifeLog: []
        };
    });

    describe('Catalog and League Setup', () => {
        test('SPECIAL_CAREER_TRACKS contains pro_athlete requiring athlete_pack', () => {
            const athleteTrack = SPECIAL_CAREER_TRACKS.find(t => t.key === 'pro_athlete');
            expect(athleteTrack).toBeDefined();
            expect(athleteTrack.label).toBe('Pro Athlete');
            expect(athleteTrack.premiumPack).toBe('athlete_pack');
            expect(athleteTrack.levels).toHaveLength(5);
        });

        test('PRO_SPORTS_LEAGUES defines all 4 major sports with real-life salary scales', () => {
            const sports = ['basketball', 'football', 'baseball', 'soccer'];
            sports.forEach(sportKey => {
                const league = PRO_SPORTS_LEAGUES[sportKey];
                expect(league).toBeDefined();
                expect(league.name).toBeTruthy();
                expect(league.leagueName).toBeTruthy();
                expect(league.levels).toHaveLength(5);
                expect(league.championshipName).toBeTruthy();
                expect(league.signingBonuses).toBeDefined();
                // Check salary escalations up to seasoned/superstar
                expect(league.levels[0].salary).toBeGreaterThanOrEqual(650000);
                expect(league.levels[4].salary).toBeGreaterThanOrEqual(40000000);
            });

            // Specific sport peak salaries
            expect(PRO_SPORTS_LEAGUES.basketball.levels[4].salary).toBe(58000000);
            expect(PRO_SPORTS_LEAGUES.football.levels[4].salary).toBe(52000000);
            expect(PRO_SPORTS_LEAGUES.baseball.levels[4].salary).toBe(46000000);
            expect(PRO_SPORTS_LEAGUES.soccer.levels[4].salary).toBe(48000000);
        });
    });

    describe('Prospect Evaluation & Scoring', () => {
        test('fails physical health gate if user health < 50', () => {
            const user = state.gameState.user;
            user.health = 45;
            user.skills.basketball.xp = 100;
            user.skills.conditioning.xp = 100;

            const evalResult = GameLogic.evaluateAthleteProspect(user, 'basketball');
            expect(evalResult.eligible).toBe(false);
            expect(evalResult.passedPhysical).toBe(false);
            expect(evalResult.gradeCode).toBe('D');
            expect(evalResult.score).toBe(0);
            expect(evalResult.warnings).toContain('Failed team medical physical (Health must be at least 50%)');
        });

        test('high skills, conditioning, and health yield A/A+ prospect grade', () => {
            const user = state.gameState.user;
            user.health = 100;
            user.skills.basketball.xp = 95;
            user.skills.conditioning.xp = 90;

            const evalResult = GameLogic.evaluateAthleteProspect(user, 'basketball');
            expect(evalResult.eligible).toBe(true);
            expect(evalResult.passedPhysical).toBe(true);
            expect(evalResult.score).toBeGreaterThanOrEqual(75);
            expect(['A', 'A+']).toContain(evalResult.gradeCode);
            expect(evalResult.draftOdds).toBeGreaterThan(0.7);
        });

        test('forward-compatible school sports history bonus boosts prospect score', () => {
            const user = state.gameState.user;
            user.health = 80;
            user.skills.football.xp = 40;
            user.skills.conditioning.xp = 40;

            const baseEval = GameLogic.evaluateAthleteProspect(user, 'football');

            // Add high school varsity MVP performance
            user.schoolSportsHistory = [
                { sport: 'football', level: 'high_school', performance: 'mvp' }
            ];

            const boostedEval = GameLogic.evaluateAthleteProspect(user, 'football');
            expect(boostedEval.schoolBonus).toBe(15);
            expect(boostedEval.score).toBeGreaterThan(baseEval.score);
        });
    });

    describe('Draft Combine & Multi-Year Rookie Contracts', () => {
        test('blocks draft if player is older than 23', () => {
            const user = state.gameState.user;
            user.age = 24;

            const res = GameLogic.attemptAthleteDraft(user, 'basketball');
            expect(res.success).toBe(false);
            expect(res.message).toContain('between ages 18 and 23');
        });

        test('blocks draft if player is younger than 18', () => {
            const user = state.gameState.user;
            user.age = 17;

            const res = GameLogic.attemptAthleteDraft(user, 'basketball');
            expect(res.success).toBe(false);
            expect(res.message).toContain('between ages 18 and 23');
        });

        test('blocks drafting twice in the same sport', () => {
            const user = state.gameState.user;
            user.athleteDraftsEntered.basketball = true;

            const res = GameLogic.attemptAthleteDraft(user, 'basketball');
            expect(res.success).toBe(false);
            expect(res.message).toContain('already entered');
        });

        test('successful draft awards multi-year contract and signing bonus', () => {
            const user = state.gameState.user;
            user.skills.basketball.xp = 100;
            user.skills.conditioning.xp = 100;
            user.health = 100;

            const originalRandom = Math.random;
            Math.random = () => 0.05;

            const initialMoney = user.money;
            const res = GameLogic.attemptAthleteDraft(user, 'basketball');

            Math.random = originalRandom;

            expect(res.success).toBe(true);
            expect(user.careerTrack).toBe('pro_athlete');
            expect(user.athleteSport).toBe('basketball');
            expect(user.athleteContract).toBeDefined();
            expect(user.athleteContract.contractType).toMatch(/Rookie|Starter Extension/i);
            expect(user.athleteContract.totalYears).toBeGreaterThanOrEqual(2);
            expect(user.athleteContract.yearsRemaining).toBe(user.athleteContract.totalYears);
            expect(res.annualSalary).toBe(user.jobSalary);
            expect(user.athleteContract.totalValue).toBe(user.athleteContract.annualSalary * user.athleteContract.totalYears);
            expect(user.money).toBe(initialMoney + res.signingBonus);
            expect(user.athleteDraftsEntered.basketball).toBe(true);
        });
    });

    describe('Free Agent Tryouts & Short-Term Prove-It Contracts', () => {
        test('blocks tryout if player is over 35 years old', () => {
            const user = state.gameState.user;
            user.age = 36;

            const res = GameLogic.attemptAthleteTryout(user, 'football');
            expect(res.success).toBe(false);
            expect(res.message).toContain('between ages 18 and 35');
        });

        test('blocks tryout if player already tried out this year', () => {
            const user = state.gameState.user;
            user.athleteTryoutYear = { baseball: user.age };

            const res = GameLogic.attemptAthleteTryout(user, 'baseball');
            expect(res.success).toBe(false);
            expect(res.message).toContain('already attended');
        });

        test('successful tryout creates a 1 or 2-year prove-it deal', () => {
            const user = state.gameState.user;
            user.skills.soccer = { xp: 80, certified: true };
            user.skills.conditioning = { xp: 80, certified: true };
            user.health = 95;

            const originalRandom = Math.random;
            Math.random = () => 0.05;

            const res = GameLogic.attemptAthleteTryout(user, 'soccer');

            Math.random = originalRandom;

            expect(res.success).toBe(true);
            expect(user.careerTrack).toBe('pro_athlete');
            expect(user.athleteSport).toBe('soccer');
            expect(user.athleteContract).toBeDefined();
            expect(user.athleteContract.contractType).toMatch(/Prove-It|Reserve/i);
            expect([1, 2]).toContain(user.athleteContract.totalYears);
            expect(user.athleteContract.yearsRemaining).toBe(user.athleteContract.totalYears);
            expect(user.athleteTryoutYear.soccer).toBe(user.age);
        });
    });

    describe('In-Season Athletic Actions', () => {
        beforeEach(() => {
            const user = state.gameState.user;
            user.careerTrack = 'pro_athlete';
            user.careerLevel = 2; // Starter / All-Star
            user.athleteSport = 'basketball';
            user.jobTitle = 'Starting Guard';
            user.jobSalary = 12500000;
            user.athleteContract = {
                team: 'Chicago Bulls',
                contractType: 'All-Star Deal',
                totalYears: 3,
                yearsRemaining: 3,
                annualSalary: 12500000,
                totalValue: 37500000,
                signingBonus: 1000000
            };
        });

        test('drills and conditioning boost stats and advance season readiness', () => {
            const user = state.gameState.user;
            const startXp = user.skills.basketball.xp;

            const a1 = GameLogic.processAthleteAction('drills');
            expect(a1.success).toBe(true);
            expect(user.skills.basketball.xp).toBeGreaterThan(startXp);
            expect(user.athleteGamesThisYear).toBe(1);

            const a2 = GameLogic.processAthleteAction('conditioning');
            expect(a2.success).toBe(true);
            expect(user.athleteGamesThisYear).toBe(2);

            const a3 = GameLogic.processAthleteAction('film_study');
            expect(a3.success).toBe(true);
            expect(user.athleteGamesThisYear).toBe(3);
        });

        test('play_match awards game bonus and advances performance', () => {
            const user = state.gameState.user;
            const initialMoney = user.money;

            const originalRandom = Math.random;
            Math.random = () => 0.50; // No injury

            const m1 = GameLogic.processAthleteAction('play_match');

            Math.random = originalRandom;

            expect(m1.success).toBe(true);
            expect(user.athleteGamesThisYear).toBe(1);
            expect(user.money).toBeGreaterThan(initialMoney);
        });

        test('endorsement can be signed once per year and earns money based on fame', () => {
            const user = state.gameState.user;
            const initialMoney = user.money;

            const endRes = GameLogic.processAthleteAction('endorsement');
            expect(endRes.success).toBe(true);
            expect(user.athleteEndorsementThisYear).toBe(true);
            expect(user.money).toBeGreaterThan(initialMoney);

            // Second attempt in same year blocked
            const endRes2 = GameLogic.processAthleteAction('endorsement');
            expect(endRes2.success).toBe(false);
            expect(endRes2.message).toContain('already signed');
        });
    });

    describe('Annual Finances, Aging, and Contract Life Cycle via ageUp', () => {
        beforeEach(() => {
            const user = state.gameState.user;
            user.careerTrack = 'pro_athlete';
            user.athleteSport = 'basketball';
            user.jobTitle = 'Rookie / Bench Player';
            user.jobSalary = 2800000;
            user.athleteContract = {
                team: 'Chicago Bulls',
                contractType: 'Rookie Scale',
                totalYears: 3,
                yearsRemaining: 3,
                annualSalary: 2800000,
                totalValue: 8400000,
                signingBonus: 1000000
            };
            user.athleteGamesThisYear = 3; // Quota fulfilled
            user.athleteEndorsementThisYear = true;
        });

        test('ageUp pays annual salary, tracks career earnings, decrements contract years, and resets quotas', async () => {
            const user = state.gameState.user;
            const startMoney = user.money;

            await ageUp();

            // 2.8M salary minus annual living expenses (~27k)
            expect(user.money).toBeGreaterThan(startMoney + 2700000);
            expect(user.athleteCareerEarnings).toBeGreaterThanOrEqual(2800000);
            expect(user.athleteContract.yearsRemaining).toBe(2);
            // Quota flags reset for next year
            expect(user.athleteGamesThisYear).toBe(0);
            expect(user.athleteEndorsementThisYear).toBe(false);
        });

        test('failing season quota results in 50% salary fine', async () => {
            const user = state.gameState.user;
            user.athleteGamesThisYear = 1; // Missed quota of 3
            const startMoney = user.money;

            await ageUp();

            // Received half salary (1.4M minus living expenses)
            expect(user.money).toBeGreaterThan(startMoney + 1300000);
            expect(user.money).toBeLessThan(startMoney + 1450000);
            expect(user.athletePoorSeasons).toBe(1);
        });

        test('contract expiration triggers multi-year extension when performance is strong', async () => {
            const user = state.gameState.user;
            user.jobPerformance = 85;
            user.careerLevel = 2;
            user.athleteContract.yearsRemaining = 1; // Expiring this season

            await ageUp();

            // Contract was renewed!
            expect(user.careerTrack).toBe('pro_athlete');
            expect(user.athleteContract.yearsRemaining).toBeGreaterThanOrEqual(2);
            expect(user.athleteContract.contractType).toMatch(/Deal|Extension|Contract/i);
            expect(hasLog('contract extension') || hasLog('contract')).toBe(true);
        });

        test('mandatory retirement at age 42', async () => {
            const user = state.gameState.user;
            user.age = 41; // Will turn 42 in ageUp

            await ageUp();

            expect(user.age).toBe(42);
            expect(user.careerTrack).toBeNull();
            expect(user.athleteContract).toBeNull();
            expect(user.jobTitle).toBeNull();
            expect(hasLog('retired from professional sports')).toBe(true);
        });
    });

    describe('UI Modals and Dispatch Flow', () => {
        test('openProSportsEntryModal renders sport tabs, combine, and tryout cards', () => {
            openProSportsEntryModal('basketball');
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');

            expect(modalTitle.textContent).toContain('Pro Sports Combine & Leagues');
            expect(modalContent.textContent).toContain('Basketball');
            expect(modalContent.textContent).toContain('Football');
            expect(modalContent.textContent).toContain('Pro Draft Combine');
            expect(modalContent.textContent).toContain('Walk-On Tryouts');
        });

        test('selectProSportTab updates active sport tab and prospect grades', () => {
            openProSportsEntryModal('basketball');
            selectProSportTab('football');

            const modalContent = document.getElementById('modal-content');
            expect(modalContent.textContent).toContain('Football');
            expect(modalContent.textContent).toContain('Scouting Combine Evaluation');
        });

        test('renderAthleteManager displays active contract dashboard and action buttons', () => {
            const user = state.gameState.user;
            user.careerTrack = 'pro_athlete';
            user.athleteSport = 'basketball';
            user.jobTitle = 'Starter / All-Star';
            user.jobSalary = 28500000;
            user.athleteContract = {
                team: 'Los Angeles Lakers',
                contractType: 'Supermax Deal',
                totalYears: 5,
                yearsRemaining: 4,
                annualSalary: 28500000,
                totalValue: 142500000,
                signingBonus: 10000000
            };

            renderAthleteManager();
            const gameContainer = document.getElementById('game-container');
            expect(gameContainer.textContent).toContain('Los Angeles Lakers');
            expect(gameContainer.textContent).toContain('Starter / All-Star');
            expect(gameContainer.textContent).toContain('$28,500,000');
            expect(gameContainer.textContent).toContain('Position Drills');
            expect(gameContainer.textContent).toContain('Headline Rivalry Match');
            expect(gameContainer.textContent).toContain('Brand Endorsement Deal');
        });
    });
});
