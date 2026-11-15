import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { PART_TIME_JOBS } from '../../../public/src/core/constants.js';
import { UI } from '../../../public/src/ui/ui.js';
import { migrateState } from '../../../public/src/core/stateMigration.js';
import { routeHandlers } from '../../../public/src/core/actionRouter.js';
import {
    renderCareerManager,
    confirmQuitCareer,
    requestJobRaise
} from '../../../public/src/features/career/jobCareerManagerScreen.js';
import {
    renderActivities,
    openUniversityModal,
    openGradEnrollmentModal
} from '../../../public/src/features/career/occupationScreen.js';
import {
    applyForJob,
    applyForCareerTrack,
    confirmJoinSpecialCareer,
    renderCareerMarket,
    openProSportsEntryModal,
    enterProSportsDraft
} from '../../../public/src/features/career/careerJobsScreen.js';
import { ageUp } from '../../../public/src/features/player/mainScreen.js';
import { saveToSlot } from '../../../public/src/core/saveSlotManager.js';
import { harvestLifeProfile } from '../../../public/src/core/logic/eulogyProfileLogic.js';
import { CAREER_BUSINESS_EVENTS } from '../../../public/src/core/events/careerBusinessEvents.js';

async function waitForCondition(predicate, timeoutMs = 1500) {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) break;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

function setupFullDom() {
    document.body.innerHTML = `
        <div id="game-container"></div>
        <div id="avatar-container"></div>
        <div id="header-brand"></div>
        <div id="header-user-info">
            <span id="header-name">Alex Rivera</span>
            <span id="header-age">20</span>
        </div>
        <div id="header-bank">$2,000</div>
        <div id="ui-health">90%</div>
        <div id="health-container"></div>
        <div id="ui-happiness">75%</div>
        <div id="happiness-container"></div>
        <div id="ui-smarts">70%</div>
        <div id="smarts-container"></div>
        <div id="ui-looks">65%</div>
        <div id="looks-container"></div>
        <div id="modal-overlay" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
            <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-5 flex flex-col max-h-[85vh] overflow-hidden my-auto">
                <div id="modal-header" class="flex items-center justify-between gap-3 mb-3 shrink-0">
                    <h2 id="modal-title" class="text-xl font-bold text-white truncate">Alert</h2>
                    <button id="modal-close-btn" class="w-8 h-8 rounded-full hidden" title="Close" aria-label="Close modal">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div id="modal-content" class="text-slate-300 overflow-y-auto pr-1 flex-1 space-y-3"></div>
                <div id="modal-actions" class="w-full shrink-0 mt-4">
                    <button id="modal-btn" class="w-full btn-primary text-white font-bold py-3 rounded-lg">Dismiss</button>
                </div>
            </div>
        </div>
    `;
}

function makePartTimeUser(overrides = {}) {
    return {
        username: 'Alex Rivera',
        name: 'Alex Rivera',
        age: 20,
        gender: 'male',
        city: 'Houston',
        country: 'United States',
        money: 2000,
        health: 90,
        happiness: 75,
        smarts: 70,
        looks: 65,
        lifeStatus: 'Young Adult',
        jobTitle: 'Security Guard',
        jobSalary: 14560,
        jobPerformance: 60,
        careerTrack: null,
        careerLevel: 0,
        yearsInRole: 0,
        yearsInCareer: 1,
        careerActionTaken: false,
        raiseRequestedThisYear: false,
        hasSeenJobSalary: true,
        isRetired: false,
        retirementPension: 0,
        highSchoolGraduated: true,
        relationships: [],
        assets: [],
        purchases: [],
        skills: {},
        ...overrides
    };
}

describe('Part-Time Quit Modal Bugfix & Part-Time Raises', () => {
    beforeEach(() => {
        localStorage.clear();
        setupFullDom();
        UI.closeAllModals();
        state.userAuthId = null;
        state.userEmail = null;
        state.verifiedPurchases = null;
        state.gameState = {
            user: makePartTimeUser(),
            lifeLog: [{ age: 20, events: [{ msg: 'Hired as Security Guard!', color: 'text-green-400' }] }],
            snapshots: [],
            _slotId: 'slot_1'
        };
        saveToSlot('slot_1', 'Alex Rivera');
    });

    afterEach(() => {
        localStorage.clear();
        UI.closeAllModals();
        jest.restoreAllMocks();
    });

    describe('Quit Part-Time Job Confirmation Modal (No Deadlock / Empty Button Bug)', () => {
        test('confirmQuitCareer always renders visible Cancel, Yes Quit, and X buttons even after interview/info modals hide #modal-actions and #modal-close-btn', () => {
            // Reproduce exact prior state reported in bug screenshot:
            // 1. Info modal hides #modal-close-btn and then dismisses
            UI.showModal('Hired!', 'Welcome aboard as Security Guard.');
            const closeBtn = document.getElementById('modal-close-btn');
            expect(closeBtn.classList.contains('hidden')).toBe(true);
            document.getElementById('modal-btn').click();

            // 2. Interview / dilemma custom modal without confirmText leaves #modal-actions.hidden = true (and showCloseBtn: false keeps #modal-close-btn hidden)
            UI.showCustomModal({ title: 'Job Interview', content: '<div>Question...</div>', showCloseBtn: false });
            const modalActions = document.getElementById('modal-actions');
            expect(modalActions.classList.contains('hidden')).toBe(true);
            expect(closeBtn.classList.contains('hidden')).toBe(true);
            UI.hideModal();
            expect(UI.isModalOpen()).toBe(false);

            // 3. Open Quit modal from Security Guard part-time manager
            confirmQuitCareer();

            const overlay = document.getElementById('modal-overlay');
            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(overlay.classList.contains('flex')).toBe(true);
            expect(title.textContent).toBe('Quit Job?');
            expect(closeBtn.classList.contains('hidden')).toBe(false);

            const yesBtn = content.querySelector('button[data-action="quitCareer"]');
            const cancelBtn = content.querySelector('button[data-action="hideModal"]');
            expect(yesBtn).not.toBeNull();
            expect(cancelBtn).not.toBeNull();
            expect(yesBtn.textContent).toContain('Yes, Quit');
            expect(cancelBtn.textContent).toContain('Cancel');
        });

        test('clicking Cancel (data-action="hideModal") or top-right X dismisses modal without quitting job', () => {
            confirmQuitCareer();
            const overlay = document.getElementById('modal-overlay');
            const cancelBtn = document.querySelector('#modal-content button[data-action="hideModal"]');
            expect(cancelBtn).not.toBeNull();

            // Click via real delegated actionRouter listener
            cancelBtn.click();
            expect(overlay.classList.contains('hidden')).toBe(true);
            expect(state.gameState.user.jobTitle).toBe('Security Guard');
            expect(UI.isModalOpen()).toBe(false);

            // Re-open and close via top X button
            confirmQuitCareer();
            expect(UI.isModalOpen()).toBe(true);
            document.getElementById('modal-close-btn').click();
            expect(overlay.classList.contains('hidden')).toBe(true);
            expect(state.gameState.user.jobTitle).toBe('Security Guard');
            expect(UI.isModalOpen()).toBe(false);
        });

        test('clicking Yes, Quit executes quitCareer via actionRouter, closes modal, clears job, preserves eulogy resignation log, and updates happiness', async () => {
            confirmQuitCareer();
            const overlay = document.getElementById('modal-overlay');
            const yesBtn = document.querySelector('#modal-content button[data-action="quitCareer"]');

            yesBtn.click();
            await waitForCondition(() => state.gameState.user.jobTitle === null && overlay.classList.contains('hidden'));

            const user = state.gameState.user;
            expect(overlay.classList.contains('hidden')).toBe(true);
            expect(UI.isModalOpen()).toBe(false);
            expect(user.jobTitle).toBeNull();
            expect(user.jobSalary).toBe(0);
            expect(user.raiseRequestedThisYear).toBe(false);
            expect(user.happiness).toBe(70);

            const logs = state.gameState.lifeLog[0].events.map(e => e.msg);
            expect(logs.some(m => m === 'Resigned from position as Security Guard. (-5 Happiness)')).toBe(true);

            // Verify eulogy profile parser still extracts Security Guard from resignation log
            const profile = harvestLifeProfile(user, state.gameState.lifeLog);
            expect(profile.jobTitle).toBe('Security Guard');
        });

        test('confirmQuitCareer uses contextual titles for full-time career, mafia, and pro athlete', () => {
            state.gameState.user = makePartTimeUser({ careerTrack: 'software_eng', jobTitle: 'Software Developer', jobSalary: 72000 });
            confirmQuitCareer();
            expect(document.getElementById('modal-title').textContent).toBe('Quit Career?');
            UI.hideModal();

            state.gameState.user = makePartTimeUser({ careerTrack: 'mafia_syndicate', jobTitle: 'Made Man', jobSalary: 150000 });
            confirmQuitCareer();
            expect(document.getElementById('modal-title').textContent).toBe('Leave Syndicate?');
            UI.hideModal();

            state.gameState.user = makePartTimeUser({ careerTrack: 'pro_athlete', jobTitle: 'Starting Lineup', jobSalary: 4500000 });
            confirmQuitCareer();
            expect(document.getElementById('modal-title').textContent).toBe('Leave Pro Contract?');
            UI.hideModal();
        });
    });

    describe('Part-Time Detection, Hourly Formatting & Raise Math', () => {
        test('isPartTimeJob accurately separates part-time jobs from careers and special tracks', () => {
            expect(GameLogic.isPartTimeJob(makePartTimeUser())).toBe(true);
            // Handles legacy/stale careerTrack if title is in PART_TIME_JOBS
            expect(GameLogic.isPartTimeJob(makePartTimeUser({ careerTrack: 'retail', jobTitle: 'Barista' }))).toBe(true);

            expect(GameLogic.isPartTimeJob(makePartTimeUser({ careerTrack: 'software_eng', jobTitle: 'Software Developer' }))).toBe(false);
            expect(GameLogic.isPartTimeJob(makePartTimeUser({ careerTrack: 'mafia_syndicate', jobTitle: 'Muscle' }))).toBe(false);
            expect(GameLogic.isPartTimeJob(makePartTimeUser({ careerTrack: 'pro_athlete', jobTitle: 'Rookie Roster' }))).toBe(false);
            expect(GameLogic.isPartTimeJob({ jobTitle: null })).toBe(false);
        });

        test('formatHourlyWage matches 1040-hour annual part-time benchmark', () => {
            expect(GameLogic.formatHourlyWage(14560)).toBe('$14.00');
            expect(GameLogic.formatHourlyWage(16640)).toBe('$16.00');
            expect(GameLogic.formatHourlyWage(0)).toBe('$0.00');
        });

        test('calculateAnnualRaise applies lower raise percentages for part-time (1%-4%) than full-time career (2%-10%)', () => {
            // Steady performance (50): part-time 1% COLA vs career 2% COLA
            const ptSteady = GameLogic.calculateAnnualRaise(makePartTimeUser({ jobSalary: 14560, jobPerformance: 50 }));
            const ftSteady = GameLogic.calculateAnnualRaise(makePartTimeUser({
                careerTrack: 'retail',
                jobTitle: 'Cashier',
                jobSalary: 28000,
                jobPerformance: 50
            }));
            expect(ptSteady.applied).toBe(true);
            expect(ptSteady.isPartTime).toBe(true);
            expect(ptSteady.baseRate).toBe(0.01);
            expect(ptSteady.meritRate).toBe(0);
            expect(ptSteady.totalRate).toBeCloseTo(0.01, 5);
            expect(ptSteady.newSalary).toBe(14706);
            expect(ptSteady.logMessage).toContain('Part-time annual raise (+1%)');
            expect(ptSteady.logMessage).toContain('/hr');

            expect(ftSteady.applied).toBe(true);
            expect(ftSteady.isPartTime).toBe(false);
            expect(ftSteady.baseRate).toBe(0.02);
            expect(ftSteady.totalRate).toBeGreaterThan(ptSteady.totalRate);

            // Strong performance (80): part-time 3% (1% + 2% merit) vs career 7% (2% + 5% merit)
            const ptStrong = GameLogic.calculateAnnualRaise(makePartTimeUser({ jobSalary: 14560, jobPerformance: 80 }));
            const ftStrong = GameLogic.calculateAnnualRaise(makePartTimeUser({
                careerTrack: 'retail',
                jobTitle: 'Cashier',
                jobSalary: 28000,
                jobPerformance: 80
            }));
            expect(ptStrong.totalRate).toBeCloseTo(0.03, 5);
            expect(ptStrong.hasMerit).toBe(true);
            expect(ptStrong.happinessGain).toBe(5);
            expect(ftStrong.totalRate).toBeCloseTo(0.07, 5);
            expect(ptStrong.totalRate).toBeLessThan(ftStrong.totalRate);

            // Top performance (95): part-time 4% (1% + 3% merit) still lower than career 7%+
            const ptTop = GameLogic.calculateAnnualRaise(makePartTimeUser({ jobSalary: 14560, jobPerformance: 95 }));
            expect(ptTop.totalRate).toBeCloseTo(0.04, 5);
            expect(ptTop.totalRate).toBeLessThan(ftStrong.totalRate);

            // Poor performance (<=20): no raise
            const ptPoor = GameLogic.calculateAnnualRaise(makePartTimeUser({ jobSalary: 14560, jobPerformance: 20 }));
            expect(ptPoor.applied).toBe(false);
        });
    });

    describe('Annual Age-Up Raises & Logging', () => {
        test('aging up with a part-time job applies lower annual raise, logs it clearly, and updates hourly pay', async () => {
            jest.spyOn(GameLogic, 'checkMortality').mockReturnValue({ isDead: false });
            jest.spyOn(Math, 'random').mockReturnValue(0.99);

            const user = state.gameState.user;
            user.jobTitle = 'Security Guard';
            user.jobSalary = 14560; // $14.00/hr
            user.jobPerformance = 80; // Strong performance => 3% part-time raise
            user.raiseRequestedThisYear = true;

            await ageUp();

            expect(user.age).toBe(21);
            expect(user.jobSalary).toBe(14997); // 14560 + Math.round(14560 * 0.03) = 14997
            expect(GameLogic.formatHourlyWage(user.jobSalary)).toBe('$14.42');
            expect(user.raiseRequestedThisYear).toBe(false);

            const age21Log = state.gameState.lifeLog.find(l => l.age === 21);
            expect(age21Log).toBeDefined();
            const messages = age21Log.events.map(e => e.msg);
            expect(messages.some(m => m.includes('Part-time raise (+3%)') && m.includes('$14.42/hr'))).toBe(true);
        });

        test('full-time career annual raise percentage exceeds part-time career raise over equivalent ageUp', async () => {
            jest.spyOn(GameLogic, 'checkMortality').mockReturnValue({ isDead: false });
            jest.spyOn(Math, 'random').mockReturnValue(0.99); // avoid random promotions

            const ptUser = state.gameState.user;
            ptUser.jobPerformance = 85;
            const ptStart = ptUser.jobSalary;
            await ageUp();
            const ptGrowthRate = (ptUser.jobSalary - ptStart) / ptStart;

            // Reset with full-time career at same performance
            state.gameState = {
                user: makePartTimeUser({
                    careerTrack: 'retail',
                    careerLevel: 0,
                    yearsInRole: 0,
                    jobTitle: 'Cashier',
                    jobSalary: 28000,
                    jobPerformance: 85
                }),
                lifeLog: [],
                snapshots: [],
                _slotId: 'slot_1'
            };
            const ftUser = state.gameState.user;
            const ftStart = ftUser.jobSalary;
            await ageUp();
            const ftGrowthRate = (ftUser.jobSalary - ftStart) / ftStart;

            expect(ptGrowthRate).toBeCloseTo(0.03, 2);
            expect(ftGrowthRate).toBeGreaterThanOrEqual(0.069);
            expect(ptGrowthRate).toBeLessThan(ftGrowthRate);
        });
    });

    describe('Manual Request Raise Flow & Persistence', () => {
        test('requestJobRaise approves raise on favorable roll, updates hourly wage, disables repeat asks, and persists on migrateState', () => {
            expect(routeHandlers.requestJobRaise).toBeDefined();
            jest.spyOn(Math, 'random').mockReturnValue(0.05);

            const user = state.gameState.user;
            user.jobTitle = 'Waiter/Waitress';
            user.jobSalary = 14560; // $14.00/hr
            user.jobPerformance = 82; // +3% raise on request for part-time

            renderCareerManager();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('$14.00/hr');
            expect(container.innerHTML).toContain('Ask for +3% pay');

            requestJobRaise();

            expect(user.raiseRequestedThisYear).toBe(true);
            expect(user.jobSalary).toBe(14997);
            expect(user.happiness).toBe(81); // 75 + 6
            expect(document.getElementById('modal-title').textContent).toBe('Raise Approved!');
            expect(document.getElementById('modal-content').textContent).toContain('$14.42/hr');

            // Button now disabled on manager screen
            const buttons = Array.from(document.querySelectorAll('#game-container button'));
            const raiseBtn = buttons.find(b => b.textContent.includes('Request Raise'));
            expect(document.getElementById('game-container').innerHTML).toContain('Already requested this year');
            expect(document.getElementById('game-container').innerHTML).toContain('$14.42/hr');
            expect(raiseBtn).toBeDefined();
            expect(raiseBtn.disabled).toBe(true);

            // Second attempt in same year is blocked
            UI.hideModal();
            const blocked = GameLogic.processRaiseRequest(user, 0.01);
            expect(blocked.success).toBe(false);
            expect(user.jobSalary).toBe(14997);

            // migrateState preserves raiseRequestedThisYear
            const migrated = migrateState(state.gameState);
            expect(migrated.user.raiseRequestedThisYear).toBe(true);
        });

        test('requestJobRaise handles denial gracefully, lowers happiness, and penalizes low performance (<40)', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.99);

            const user = state.gameState.user;
            user.jobPerformance = 30;
            const startSalary = user.jobSalary;

            requestJobRaise();

            expect(user.raiseRequestedThisYear).toBe(true);
            expect(user.jobSalary).toBe(startSalary);
            expect(user.happiness).toBe(72); // -3
            expect(user.jobPerformance).toBe(25); // -5
            expect(document.getElementById('modal-title').textContent).toBe('Raise Request Denied');
        });

        test('getting hired as part-time clears stale careerTrack state', async () => {
            const user = state.gameState.user;
            user.jobTitle = null;
            user.careerTrack = 'software_eng';
            user.careerLevel = 3;
            user.yearsInRole = 4;
            user.consecutivePoorYears = 1;
            user.raiseRequestedThisYear = true;

            const guardJob = PART_TIME_JOBS.find(j => j.title === 'Security Guard');
            jest.spyOn(Math, 'random').mockReturnValue(0.0);
            applyForJob(guardJob.title, guardJob.salary);

            const modalButtons = Array.from(document.querySelectorAll('#modal-content button[data-action="answerInterview"]'));
            expect(modalButtons.length).toBe(4);
            // Math.random() === 0.0 selects general question 0 whose correct answer is index 1
            modalButtons[1].click();
            await waitForCondition(() => state.gameState.user.jobTitle === 'Security Guard');

            expect(user.jobTitle).toBe('Security Guard');
            expect(user.careerTrack).toBeNull();
            expect(user.careerLevel).toBe(0);
            expect(user.yearsInRole).toBe(0);
            expect(user.consecutivePoorYears).toBe(0);
            expect(user.raiseRequestedThisYear).toBe(false);
        });
    });

    describe('Part-Time Job Manager & Occupation Screen Markup', () => {
        test('part-time Job Manager renders Quit Job, hourly wage, part-time raise tiers, Request Raise, and omits pension Retire', () => {
            renderCareerManager();
            const html = document.getElementById('game-container').innerHTML;

            expect(html).toContain('Security Guard');
            expect(html).toContain('$14.00/hr');
            expect(html).toContain('Part-Time Role');
            expect(html).toContain('Request Raise');
            expect(html).toContain('data-action="requestJobRaise"');
            expect(html).toContain('Quit Job');
            expect(html).not.toContain('Quit Career');
            expect(html).not.toContain('data-action="confirmRetire"');
        });

        test('occupationScreen displays hourly pay for active part-time job and uses hideModal on education Cancel buttons', () => {
            renderActivities();
            const html = document.getElementById('game-container').innerHTML;
            expect(html).toContain('Part-Time Job');
            expect(html).toContain('Security Guard');
            expect(html).toContain('$14.00/hr');

            openUniversityModal();
            expect(document.getElementById('modal-content').innerHTML).toContain('data-action="hideModal"');
            expect(document.getElementById('modal-content').innerHTML).not.toContain('data-action="closeModal"');
            UI.hideModal();

            openGradEnrollmentModal('Law School');
            expect(document.getElementById('modal-content').innerHTML).toContain('data-action="hideModal"');
            expect(document.getElementById('modal-content').innerHTML).not.toContain('data-action="closeModal"');
            UI.hideModal();
        });
    });

    describe('Cross-System Audit: Interview Stack, Special Tracks, Prison, Relocation & Events', () => {
        test('interview wrong answer + Close closes cleanly without reopening Job Interview from modal stack', async () => {
            const user = state.gameState.user;
            user.jobTitle = null;
            const guardJob = PART_TIME_JOBS.find(j => j.title === 'Security Guard');
            jest.spyOn(Math, 'random').mockReturnValue(0.0);

            applyForJob(guardJob.title, guardJob.salary);
            expect(document.getElementById('modal-title').textContent).toBe('Job Interview');

            // Pick wrong option (0)
            document.querySelectorAll('#modal-content button[data-action="answerInterview"]')[0].click();
            await waitForCondition(() => document.getElementById('modal-title').textContent === 'Not Hired');

            expect(document.getElementById('modal-title').textContent).toBe('Not Hired');
            expect(user.money).toBe(1800); // $200 course deducted

            // Clicking Close must close completely rather than popping stale Job Interview
            document.querySelector('#modal-content button[data-action="hideModal"]').click();
            await waitForCondition(() => !UI.isModalOpen());
            expect(UI.isModalOpen()).toBe(false);
            expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
            expect(user.jobTitle).toBeNull();
        });

        test('interview wrong answer -> Try Again -> correct answer closes modal completely without popping Not Hired', async () => {
            const user = state.gameState.user;
            user.jobTitle = null;
            const guardJob = PART_TIME_JOBS.find(j => j.title === 'Security Guard');
            jest.spyOn(Math, 'random').mockReturnValue(0.0);

            applyForJob(guardJob.title, guardJob.salary);

            // Round 1: general[0] wrong answer (0)
            document.querySelectorAll('#modal-content button[data-action="answerInterview"]')[0].click();
            await waitForCondition(() => document.getElementById('modal-title').textContent === 'Not Hired');

            // Click Try Again -> replaces Not Hired with general[1]
            document.querySelector('#modal-content button[data-action="retryInterview"]').click();
            await waitForCondition(() => document.getElementById('modal-title').textContent === 'Job Interview');

            // Round 2: general[1] correct answer is index 2
            document.querySelectorAll('#modal-content button[data-action="answerInterview"]')[2].click();
            await waitForCondition(() => user.jobTitle === 'Security Guard');

            expect(user.jobTitle).toBe('Security Guard');
            expect(UI.isModalOpen()).toBe(false);
            expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('modal-title').textContent).not.toBe('Not Hired');
        });

        test('quitCareer clears Mafia & Pro Athlete active contract state while preserving lifetime trophies for eulogy', async () => {
            // 1. Mafia Syndicate quit
            state.gameState.user = makePartTimeUser({
                careerTrack: 'mafia_syndicate',
                jobTitle: 'Made Man',
                jobSalary: 150000,
                yearsInCareer: 3,
                mafiaCrimesThisYear: 2,
                raiseRequestedThisYear: true
            });
            confirmQuitCareer();
            expect(document.getElementById('modal-title').textContent).toBe('Leave Syndicate?');
            document.querySelector('#modal-content button[data-action="quitCareer"]').click();
            await waitForCondition(() => state.gameState.user.jobTitle === null);

            expect(state.gameState.user.careerTrack).toBeNull();
            expect(state.gameState.user.mafiaCrimesThisYear).toBe(0);
            expect(state.gameState.user.totalYearsWorked).toBe(3);

            // 2. Pro Athlete quit clears contract/season counters but keeps rings/MVPs/earnings
            state.gameState.user = makePartTimeUser({
                careerTrack: 'pro_athlete',
                athleteSport: 'basketball',
                jobTitle: 'League All-Star',
                jobSalary: 28000000,
                yearsInCareer: 5,
                athleteContract: { team: 'Lakers', totalYears: 4, yearsRemaining: 2, annualSalary: 28000000 },
                athleteGamesThisYear: 2,
                athleteEndorsementThisYear: true,
                athletePoorSeasons: 1,
                athleteRings: 2,
                athleteMvps: 1,
                athleteCareerEarnings: 90000000
            });
            confirmQuitCareer();
            expect(document.getElementById('modal-title').textContent).toBe('Leave Pro Contract?');
            document.querySelector('#modal-content button[data-action="quitCareer"]').click();
            await waitForCondition(() => state.gameState.user.jobTitle === null);

            const athlete = state.gameState.user;
            expect(athlete.careerTrack).toBeNull();
            expect(athlete.athleteContract).toBeNull();
            expect(athlete.athleteGamesThisYear).toBe(0);
            expect(athlete.athleteEndorsementThisYear).toBe(false);
            expect(athlete.athletePoorSeasons).toBe(0);
            expect(athlete.athleteSport).toBe('basketball');
            expect(athlete.athleteRings).toBe(2);
            expect(athlete.athleteMvps).toBe(1);
            expect(athlete.athleteCareerEarnings).toBe(90000000);
        });

        test('prison sentencing & felony probation fully clear jobSalary, careerTrack, raise flags, and Career Market Current badge', () => {
            // Probation sentencing (sentenceYears === 0, felony)
            const probUser = makePartTimeUser({
                careerTrack: 'retail',
                careerLevel: 2,
                yearsInCareer: 4,
                jobTitle: 'Team Lead',
                jobSalary: 45000,
                raiseRequestedThisYear: true
            });
            GameLogic.applySentencing(probUser, {
                crime: { id: 'tax_evasion', name: 'Tax Evasion', category: 'white_collar' },
                fine: 1000,
                sentenceYears: 0
            });
            expect(probUser.jobTitle).toBeNull();
            expect(probUser.jobSalary).toBe(0);
            expect(probUser.salary).toBe(0);
            expect(probUser.careerTrack).toBeNull();
            expect(probUser.raiseRequestedThisYear).toBe(false);
            expect(probUser.totalYearsWorked).toBe(4);
            expect(probUser.lastJobTitle).toBe('Team Lead');

            // Incarceration (sentenceYears > 0) clears careerTrack so Career Market no longer shows "Current"
            state.gameState.user = makePartTimeUser({
                careerTrack: 'software_eng',
                careerLevel: 1,
                yearsInCareer: 2,
                jobTitle: 'Software Developer',
                jobSalary: 72000,
                raiseRequestedThisYear: true,
                universityGraduated: true,
                major: 'Computer Science'
            });
            const imprisonedUser = state.gameState.user;
            GameLogic.applySentencing(imprisonedUser, {
                crime: { id: 'gta', name: 'Grand Theft Auto', category: 'heist' },
                fine: 2000,
                sentenceYears: 2
            });
            expect(imprisonedUser.jobTitle).toBeNull();
            expect(imprisonedUser.jobSalary).toBe(0);
            expect(imprisonedUser.salary).toBe(0);
            expect(imprisonedUser.careerTrack).toBeNull();
            expect(imprisonedUser.raiseRequestedThisYear).toBe(false);
            expect(imprisonedUser.totalYearsWorked).toBe(2);

            // Simulate post-release check in Career Market
            imprisonedUser.inPrison = false;
            renderCareerMarket();
            expect(document.getElementById('game-container').innerHTML).not.toContain('>Current<');
        });

        test('moveCountry and direct part-time -> Mafia/Pro Athlete transitions reset cross-track flags without losing tenure', () => {
            const mover = makePartTimeUser({
                careerTrack: 'pro_athlete',
                jobTitle: 'Rookie Roster',
                jobSalary: 795000,
                raiseRequestedThisYear: true,
                athleteContract: { totalYears: 2, yearsRemaining: 1 },
                athleteGamesThisYear: 2,
                athleteEndorsementThisYear: true,
                athletePoorSeasons: 1,
                mafiaCrimesThisYear: 1
            });
            const moveRes = GameLogic.moveCountry(mover, 'Japan', 'Tokyo');
            expect(moveRes.success).toBe(true);
            expect(mover.jobTitle).toBeNull();
            expect(mover.jobSalary).toBe(0);
            expect(mover.raiseRequestedThisYear).toBe(false);
            expect(mover.athleteContract).toBeNull();
            expect(mover.athleteGamesThisYear).toBe(0);
            expect(mover.athleteEndorsementThisYear).toBe(false);
            expect(mover.athletePoorSeasons).toBe(0);
            expect(mover.mafiaCrimesThisYear).toBe(0);

            // Switching directly from Part-Time -> Mafia Syndicate preserves tenure & clears stale flags
            const switcher = state.gameState.user;
            switcher.purchases = ['mafia_syndicate', 'athlete_career'];
            switcher.yearsInCareer = 3;
            switcher.consecutivePoorYears = 1;
            switcher.raiseRequestedThisYear = true;
            switcher.careerActionTaken = true;
            confirmJoinSpecialCareer('mafia_syndicate');
            expect(switcher.careerTrack).toBe('mafia_syndicate');
            expect(switcher.totalYearsWorked).toBe(3);
            expect(switcher.yearsInCareer).toBe(0);
            expect(switcher.consecutivePoorYears).toBe(0);
            expect(switcher.raiseRequestedThisYear).toBe(false);
            expect(switcher.careerActionTaken).toBe(false);

            // Switching directly from Mafia -> Pro Athlete draft preserves cumulative tenure & clears mafiaCrimesThisYear
            switcher.yearsInCareer = 2;
            switcher.mafiaCrimesThisYear = 2;
            switcher.raiseRequestedThisYear = true;
            jest.spyOn(Math, 'random').mockReturnValue(0.0);
            const draftRes = GameLogic.attemptAthleteDraft(switcher, 'basketball');
            expect(draftRes.success).toBe(true);
            expect(switcher.totalYearsWorked).toBe(5);
            expect(switcher.mafiaCrimesThisYear).toBe(0);
            expect(switcher.raiseRequestedThisYear).toBe(false);
        });

        test('enterProSportsDraft keeps Combine out of stack when drafted and preserves Draft Results modal when undrafted', () => {
            const user = state.gameState.user;
            user.purchases = ['athlete_career'];
            user.age = 20;
            user.health = 95;
            user.skills = { basketball: { xp: 80, level: 3 }, conditioning: { xp: 80, level: 3 } };

            // 1. Undrafted path: Draft Results stays on top and returns to refreshed Combine when dismissed
            jest.spyOn(Math, 'random').mockReturnValue(0.99);
            openProSportsEntryModal('basketball');
            enterProSportsDraft('basketball');
            expect(document.getElementById('modal-title').textContent).toBe('Draft Results');
            document.getElementById('modal-btn').click();
            expect(document.getElementById('modal-title').textContent).toBe('Pro Sports Combine & Leagues');
            expect(document.getElementById('modal-content').textContent).toContain('Draft Already Entered');
            UI.hideModal();

            // 2. Drafted path: dismissing Drafted modal closes completely instead of popping Combine back open
            jest.spyOn(Math, 'random').mockReturnValue(0.0);
            openProSportsEntryModal('football');
            enterProSportsDraft('football');
            expect(document.getElementById('modal-title').textContent).toBe('Drafted into Pro League!');
            document.getElementById('modal-btn').click();
            expect(UI.isModalOpen()).toBe(false);
        });

        test('career_headhunter_poach updates peakJobSalary and resets raiseRequestedThisYear when switching firms', () => {
            const user = makePartTimeUser({
                careerTrack: 'software_eng',
                jobTitle: 'Software Developer',
                jobSalary: 100000,
                peakJobTitle: 'Software Developer',
                peakJobSalary: 100000,
                yearsInRole: 3,
                raiseRequestedThisYear: true
            });
            const event = CAREER_BUSINESS_EVENTS.career_headhunter_poach;
            event.resolve(user, null, 'take_signing_bonus');

            expect(user.jobSalary).toBe(108000);
            expect(user.peakJobSalary).toBe(108000);
            expect(user.yearsInRole).toBe(0);
            expect(user.raiseRequestedThisYear).toBe(false);
        });
    });
});
