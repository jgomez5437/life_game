import { state } from '../../../public/src/core/state.js';
import { 
    renderEducation, 
    workHarder, 
    skipSchool, 
    checkSchoolActionTaken 
} from '../../../public/src/features/education/manageEducationScreen.js';

describe('Manage Education Screen & Actions', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="bottom-nav"></div>
            <div id="bottom-nav-container"></div>
            <div id="nav-btn-work"></div>
            <div id="header-brand" class="hidden"></div>
            <div id="header-main-row" class="hidden"></div>
            <div id="stats-ribbon" class="hidden"></div>
            <div id="user-info" class="hidden"></div>
            <div id="bank-wrapper" class="hidden"></div>
            <div id="settings-btn" class="hidden"></div>
            <div id="stat-smarts" class="stat-val">50%</div>
            <div id="stat-smarts-bar" style="width: 50%"></div>
            <div id="stat-happiness" class="stat-val">50%</div>
            <div id="stat-happiness-bar" style="width: 50%"></div>
            <div id="stat-health" class="stat-val">50%</div>
            <div id="stat-health-bar" style="width: 50%"></div>
            <div id="stat-looks" class="stat-val">50%</div>
            <div id="stat-looks-bar" style="width: 50%"></div>
        `;

        state.gameState = {
            user: {
                username: 'Student Sam',
                age: 15,
                smarts: 50,
                happiness: 60,
                health: 80,
                looks: 50,
                schoolPerformance: 50,
                schoolActions: 0,
                grade: 10,
                highSchoolEnrolled: true,
                relationships: [],
                lifeLog: []
            },
            lifeLog: []
        };
    });

    test('renderEducation renders the initial school performance and action limit', () => {
        renderEducation();
        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Actions Remaining: 2/2');
        expect(container.innerHTML).toContain('50%');
        expect(container.innerHTML).toContain('Work Harder');
        expect(container.innerHTML).toContain('Skip School');
    });

    test('workHarder increases performance, adds smarts, logs result, and re-renders real-time without crashing', () => {
        renderEducation();

        // Call workHarder - this previously crashed with ReferenceError: GameLogic is not defined
        expect(() => workHarder()).not.toThrow();

        const user = state.gameState.user;
        expect(user.schoolActions).toBe(1);
        expect(user.schoolPerformance).toBe(70);
        expect(user.smarts).toBeGreaterThan(50); // Gained +2 to +4 smarts

        // Check real-time UI re-render
        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Actions Remaining: 1/2');
        expect(container.innerHTML).toContain('70%');

        // Check log entry
        const allEvents = (state.gameState.lifeLog || []).flatMap(l => l.events || []);
        expect(allEvents.some(e => e.msg.includes('Studied hard! Improved grades (+20%)'))).toBe(true);
    });

    test('workHarder caps performance at 100% and enforces 2 actions limit', () => {
        state.gameState.user.schoolPerformance = 95;
        state.gameState.user.schoolActions = 0;

        workHarder();
        expect(state.gameState.user.schoolPerformance).toBe(100);
        expect(state.gameState.user.schoolActions).toBe(1);

        workHarder();
        expect(state.gameState.user.schoolPerformance).toBe(100);
        expect(state.gameState.user.schoolActions).toBe(2);

        // Attempt 3rd action in the same year
        const smartsBefore = state.gameState.user.smarts;
        workHarder();
        expect(state.gameState.user.schoolActions).toBe(2);
        expect(state.gameState.user.smarts).toBe(smartsBefore);

        // Verify button disabled state rendered in HTML
        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Actions Remaining: 0/2');
        expect(container.innerHTML).toContain('disabled');
    });

    test('skipSchool reduces performance, increases happiness, reduces smarts, and re-renders real-time', () => {
        state.gameState.user.schoolPerformance = 50;
        state.gameState.user.happiness = 60;
        state.gameState.user.smarts = 50;
        state.gameState.user.schoolActions = 0;

        expect(() => skipSchool()).not.toThrow();

        const user = state.gameState.user;
        expect(user.schoolActions).toBe(1);
        expect(user.schoolPerformance).toBe(40);
        expect(user.happiness).toBe(65);
        expect(user.smarts).toBe(48);

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Actions Remaining: 1/2');
        expect(container.innerHTML).toContain('40%');
    });

    test('checkSchoolActionTaken resets schoolActions to 0 on annual transition', () => {
        state.gameState.user.schoolActions = 2;
        checkSchoolActionTaken(state.gameState.user);
        expect(state.gameState.user.schoolActions).toBe(0);
    });
});
