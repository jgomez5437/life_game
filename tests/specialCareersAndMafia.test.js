import { jest } from '@jest/globals';
import { state } from '../public/src/core/state.js';
import { SPECIAL_CAREER_TRACKS } from '../public/src/core/main.js';
import { joinSpecialCareer, confirmJoinSpecialCareer } from '../public/src/features/career/careerJobsScreen.js';
import { attemptMafiaCrime } from '../public/src/features/career/jobCareerManagerScreen.js';
import { GameLogic } from '../public/src/core/gameLogic.js';
import { ageUp } from '../public/src/features/player/mainScreen.js';
import { UI } from '../public/src/ui/ui.js';

describe('Special Careers & Mafia Syndicate System', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">25</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: "Tony Soprano",
                age: 25,
                city: "New York",
                money: 10000,
                health: 100,
                happiness: 80,
                smarts: 70,
                looks: 75,
                careerTrack: null,
                careerLevel: 0,
                yearsInRole: 0,
                jobTitle: null,
                jobSalary: 0,
                jobPerformance: 50,
                lifetimeCrimesCommitted: 0,
                mafiaCrimesThisYear: 0,
                lifeStatus: "Alive",
                lifeLog: [],
                purchases: ['mafia_syndicate']
            }
        };
    });

    describe('SPECIAL_CAREER_TRACKS Catalog', () => {
        test('includes La Cosa Nostra mafia_syndicate track with 5 distinct ranks', () => {
            const mafiaTrack = SPECIAL_CAREER_TRACKS.find(t => t.key === 'mafia_syndicate');
            expect(mafiaTrack).toBeDefined();
            expect(mafiaTrack.label).toBe('La Cosa Nostra');
            expect(mafiaTrack.levels.length).toBe(5);
            expect(mafiaTrack.levels[0].title).toBe('Muscle');
            expect(mafiaTrack.levels[1].title).toBe('Made Man');
            expect(mafiaTrack.levels[2].title).toBe('Street Boss');
            expect(mafiaTrack.levels[3].title).toBe('Underboss');
            expect(mafiaTrack.levels[4].title).toBe('The Don');
        });
    });

    describe('Joining Special Career & Prerequisites', () => {
        test('joinSpecialCareer blocks players with under 3 lifetime crimes', () => {
            state.gameState.user.lifetimeCrimesCommitted = 2;
            const modalSpy = jest.spyOn(UI, 'showModal');

            joinSpecialCareer('mafia_syndicate');

            expect(modalSpy).toHaveBeenCalledWith("Not Reputable Enough", expect.stringContaining("3 crimes"));
            expect(state.gameState.user.careerTrack).toBeNull();
            modalSpy.mockRestore();
        });

        test('joinSpecialCareer shows custom modal prompt when requirements met (3+ crimes)', () => {
            state.gameState.user.lifetimeCrimesCommitted = 3;
            const modalSpy = jest.spyOn(UI, 'showCustomModal');

            joinSpecialCareer('mafia_syndicate');

            expect(modalSpy).toHaveBeenCalledWith("Confirm Job: La Cosa Nostra", expect.stringContaining("Accept Position & Swear Oath"));
            modalSpy.mockRestore();
        });

        test('confirmJoinSpecialCareer initiates player as Muscle in La Cosa Nostra', () => {
            confirmJoinSpecialCareer('mafia_syndicate');

            const user = state.gameState.user;
            expect(user.careerTrack).toBe('mafia_syndicate');
            expect(user.careerLevel).toBe(0);
            expect(user.jobTitle).toBe('Muscle');
            expect(user.jobSalary).toBeGreaterThan(0);
            expect(user.mafiaCrimesThisYear).toBe(0);
            expect(user.jobPerformance).toBe(100);
        });
    });

    describe('Mafia Crime Processing Engine (GameLogic.processMafiaCrime)', () => {
        test('shakedown success awards extortion cash payout and increments annual quota', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
            const user = state.gameState.user;
            user.mafiaCrimesThisYear = 0;
            const initialMoney = user.money;

            const res = GameLogic.processMafiaCrime('shakedown');

            expect(res.success).toBe(true);
            expect(user.mafiaCrimesThisYear).toBe(1);
            expect(user.money).toBe(initialMoney + 5000);

            spy.mockRestore();
        });

        test('smuggle and hijack award higher cash payouts on success', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
            const user = state.gameState.user;
            user.money = 0;

            GameLogic.processMafiaCrime('smuggle');
            expect(user.money).toBe(15000);

            GameLogic.processMafiaCrime('hijack');
            expect(user.money).toBe(15000 + 35000);

            spy.mockRestore();
        });

        test('failing a mafia crime triggers federal arrest with pending trial', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
            const user = state.gameState.user;

            const res = GameLogic.processMafiaCrime('whack');

            expect(res.success).toBe(false);
            expect(res.arrested).toBe(true);
            expect(user.pendingTrial).toBeDefined();
            expect(user.pendingTrial.crime.category).toBe('violent');

            spy.mockRestore();
        });
    });

    describe('Mafia Annual Quota & Promotion Turn Engine', () => {
        test('ageUp inflicts beatings and dock salary if annual quota (<3) not met', () => {
            const user = state.gameState.user;
            confirmJoinSpecialCareer('mafia_syndicate');
            user.mafiaCrimesThisYear = 1; // Failed quota of 3
            user.health = 100;
            const salary = user.jobSalary;
            const initialMoney = user.money;

            ageUp();

            expect(user.health).toBeLessThanOrEqual(75); // -25 penalty plus natural age decay
            expect(user.health).toBeGreaterThanOrEqual(70);
            // Money should equal initialMoney minus living expenses, WITHOUT salary added
            const expectedLivingExpenses = GameLogic.addLivingExpenses(user.age - 1, user.isStudent, user.city);
            expect(user.money).toBe(initialMoney - expectedLivingExpenses);
            expect(user.mafiaCrimesThisYear).toBe(0); // Quota reset for next year
        });

        test('ageUp pays salary and advances yearsInRole when annual quota (>=3) is met', () => {
            const user = state.gameState.user;
            confirmJoinSpecialCareer('mafia_syndicate');
            user.mafiaCrimesThisYear = 3; // Quota met
            user.health = 100;
            const initialMoney = user.money;
            const salary = user.jobSalary;

            ageUp();

            expect(user.health).toBeGreaterThanOrEqual(95);
            const expectedLivingExpenses = GameLogic.addLivingExpenses(user.age - 1, user.isStudent, user.city);
            expect(user.money).toBe(initialMoney + salary - expectedLivingExpenses);
            expect(user.yearsInRole).toBe(1);
            expect(user.mafiaCrimesThisYear).toBe(0);
        });

        test('ageUp promotes Muscle to Made Man after meeting minYears and eligibility roll', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.1);
            const user = state.gameState.user;
            confirmJoinSpecialCareer('mafia_syndicate');
            user.yearsInRole = 2; // Level 0 (Muscle) minYears is 2
            user.mafiaCrimesThisYear = 3;

            ageUp();

            expect(user.careerLevel).toBe(1);
            expect(user.jobTitle).toBe('Made Man');
            expect(user.yearsInRole).toBe(0);

            spy.mockRestore();
        });
    });
});
