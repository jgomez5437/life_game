import { jest } from '@jest/globals';
import {
    renderProfilePanel,
    renderActionPanel,
    renderDesktopPanels,
    clearDesktopPanels,
    getEducationLabel,
    getCircleSummary,
    serializeArgs
} from '../../public/src/features/player/desktopPanels.js';

import { UI } from '../../public/src/ui/ui.js';
import { state } from '../../public/src/core/state.js';

describe('Desktop Three-Column Panels & UI Lifecycle', () => {

    beforeEach(() => {
        document.body.className = '';
        document.body.innerHTML = `
            <header>
                <div id="header-inner" class="w-full max-w-lg mx-auto flex flex-col gap-1.5 px-1">
                    <div id="header-brand"></div>
                    <div id="header-main-row" class="hidden">
                        <div id="header-user-info">
                            <div id="avatar-container"></div>
                            <h1 id="header-name">Player</h1>
                            <span id="header-age">0</span>
                        </div>
                        <div id="header-bank-wrapper">
                            <div id="header-bank">$0</div>
                        </div>
                        <button id="header-settings-btn"></button>
                    </div>
                    <div id="header-stats-ribbon" class="hidden">
                        <div id="health-container"><span id="ui-health">100%</span></div>
                        <div id="happiness-container"><span id="ui-happiness">100%</span></div>
                        <div id="smarts-container"><span id="ui-smarts">50%</span></div>
                        <div id="looks-container"><span id="ui-looks">50%</span></div>
                    </div>
                </div>
            </header>

            <div id="app-shell" class="flex-1 flex min-h-0 overflow-hidden">
                <aside id="desktop-left-panel" class="desktop-panel desktop-panel-left shrink-0"></aside>
                <main id="game-container" class="flex-1 min-w-0 overflow-y-auto p-4 relative bg-slate-900"></main>
                <aside id="desktop-right-panel" class="desktop-panel desktop-panel-right shrink-0"></aside>
            </div>

            <nav id="bottom-nav" class="hidden">
                <button id="nav-btn-assets" data-action="renderAssets"></button>
                <button id="nav-btn-work" data-action="renderActivities"></button>
                <button id="nav-btn-center" data-action="ageUp"></button>
                <button id="nav-btn-social" data-action="renderRelationships"></button>
                <button id="nav-btn-more" data-action="renderMoreDashboard"></button>
            </nav>
        `;

        state.gameState = {
            user: {
                username: "Alex Mercer",
                name: "Alex Mercer",
                age: 26,
                money: 48500,
                city: "Austin",
                country: "United States",
                health: 92,
                happiness: 78,
                smarts: 85,
                looks: 64,
                generation: 1,
                jobTitle: "Software Engineer",
                jobSalary: 82000,
                jobPerformance: 80,
                careerTrack: "technology",
                careerLevel: 0,
                yearsInRole: 1,
                universityGraduated: true,
                major: "Computer Science",
                assets: [],
                relationships: [
                    { id: "rel_1", name: "Taylor Reed", type: "Wife", category: "spouse", age: 26 }
                ],
                purchases: []
            },
            lifeLog: [
                { age: 26, events: [{ msg: "Promoted to Senior Engineer", color: "text-blue-400 font-bold" }] }
            ]
        };
    });

    afterEach(() => {
        clearDesktopPanels();
        UI.setDesktopPanelsActive(false);
        try { localStorage.clear(); } catch (e) {}
    });

    describe('serializeArgs Helper', () => {
        test('formats numbers, booleans, and strings safely', () => {
            expect(serializeArgs([])).toBe('');
            expect(serializeArgs(['retail'])).toBe("'retail'");
            expect(serializeArgs(['retail', 45000, true])).toBe("'retail', 45000, true");
        });
    });

    describe('Profile Panel (Left Column)', () => {
        test('renderProfilePanel renders identity, financial cards, 4 stat bars, and details', () => {
            const html = renderProfilePanel(state.gameState.user);
            expect(html).toContain('Alex Mercer');
            expect(html).toContain('Austin');
            expect(html).toContain('Age <span id="desktop-profile-age" class="text-white font-bold">26</span>');
            expect(html).toContain('Gen 1');

            // Financial stats
            expect(html).toContain('Bank Balance');
            expect(html).toContain('$48,500');
            expect(html).toContain('Net Worth');
            expect(html).toContain('Cashflow');

            // 4 Stats
            expect(html).toContain('Health');
            expect(html).toContain('92%');
            expect(html).toContain('Happiness');
            expect(html).toContain('78%');
            expect(html).toContain('Smarts');
            expect(html).toContain('85%');
            expect(html).toContain('Looks');
            expect(html).toContain('64%');

            // Detail rows
            expect(html).toContain('Role');
            expect(html).toContain('Circle');
            expect(html).toContain('Married to Taylor');
            expect(html).toContain('Education');
            expect(html).toContain('Degree in Computer Science');
        });

        test('escapes malicious user-controlled strings for XSS safety', () => {
            const maliciousUser = {
                ...state.gameState.user,
                username: '<script>alert("xss")</script>',
                city: '<b onmouseover="evil()">City</b>'
            };
            const html = renderProfilePanel(maliciousUser);
            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
            expect(html).not.toContain('<b onmouseover=');
        });

        test('getEducationLabel formats education levels accurately', () => {
            expect(getEducationLabel({ age: 3 })).toBe('Not in school yet');
            expect(getEducationLabel({ age: 8 })).toBe('Elementary School');
            expect(getEducationLabel({ age: 13 })).toBe('Middle School');
            expect(getEducationLabel({ age: 16, highSchoolGraduated: false })).toBe('High School');
            expect(getEducationLabel({ age: 18, highSchoolGraduated: true })).toBe('High School Diploma');
            expect(getEducationLabel({ age: 20, universityEnrolled: true, universitySchoolYear: 1 })).toBe('University · Year 2');
            expect(getEducationLabel({ universityGraduated: true, major: 'Finance' })).toBe('Degree in Finance');
            expect(getEducationLabel({ gradSchoolDegree: 'Doctorate in Law' })).toBe('Doctorate in Law');
        });

        test('getCircleSummary formats relationships correctly', () => {
            const summary = getCircleSummary(state.gameState.user);
            expect(summary.label).toBe('Married to Taylor');
            expect(summary.total).toBe(1);

            const singleUser = { relationships: [] };
            expect(getCircleSummary(singleUser).label).toBe('Single');
        });
    });

    describe('Action & Recommendations Panel (Right Column)', () => {
        test('renderActionPanel renders Age Up primary button and tab navigation', () => {
            const html = renderActionPanel(state.gameState.user, 'home');
            expect(html).toContain('data-action="ageUp"');
            expect(html).toContain('Age Up');
            expect(html).toContain('Turn 27');

            // Navigation tabs
            expect(html).toContain('data-action="renderAssets"');
            expect(html).toContain('data-action="renderActivities"');
            expect(html).toContain('data-action="renderRelationships"');
            expect(html).toContain('data-action="renderMoreDashboard"');
            expect(html).toContain('Life History');

            // Active tab styling
            expect(html).toContain('nav-tab-home');
        });

        test('marks sub-screen active tab correctly', () => {
            const htmlWork = renderActionPanel(state.gameState.user, 'work');
            expect(htmlWork).toContain('nav-tab-work');
            expect(htmlWork).toContain('aria-current="page"');
            expect(htmlWork).not.toContain('nav-tab-home');

            const htmlAssets = renderActionPanel(state.gameState.user, 'assets');
            expect(htmlAssets).toContain('nav-tab-assets');
        });

        test('renders Next Steps recommendations cards with actions', () => {
            const html = renderActionPanel(state.gameState.user, 'home');
            expect(html).toContain('Next Steps');
            expect(html).toContain('desktop-rec-card');
        });
    });

    describe('DOM Mounting & UI Integration', () => {
        test('renderDesktopPanels and clearDesktopPanels modify left and right asides', () => {
            renderDesktopPanels(state.gameState.user, 'home');

            const left = document.getElementById('desktop-left-panel');
            const right = document.getElementById('desktop-right-panel');

            expect(left.innerHTML).toContain('Alex Mercer');
            expect(right.innerHTML).toContain('data-action="ageUp"');

            clearDesktopPanels();
            expect(left.innerHTML).toBe('');
            expect(right.innerHTML).toBe('');
        });

        test('UI.setDesktopPanelsActive toggles class on document.body', () => {
            UI.setDesktopPanelsActive(true);
            expect(document.body.classList.contains('desktop-panels-active')).toBe(true);

            UI.setDesktopPanelsActive(false);
            expect(document.body.classList.contains('desktop-panels-active')).toBe(false);
        });

        test('UI.updateDesktopPanels respects viewport matchMedia', async () => {
            // Mock window.matchMedia for desktop (>= 1024px)
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(min-width: 1024px)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }));

            await UI.updateDesktopPanels('home');

            expect(document.body.classList.contains('desktop-panels-active')).toBe(true);
            const left = document.getElementById('desktop-left-panel');
            const right = document.getElementById('desktop-right-panel');
            expect(left.innerHTML).toContain('Alex Mercer');
            expect(right.innerHTML).toContain('Age Up');

            // Now test mobile view (matchMedia matches: false)
            window.matchMedia = jest.fn().mockImplementation(() => ({
                matches: false,
                addListener: jest.fn(),
                addEventListener: jest.fn()
            }));

            await UI.updateDesktopPanels('work');
            // When viewport < 1024px, panel DOM is cleared
            expect(left.innerHTML).toBe('');
            expect(right.innerHTML).toBe('');
        });

        test('deactivates desktop panels on deceased or prison status', async () => {
            window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn() });

            state.gameState.user.lifeStatus = 'Deceased';
            await UI.updateDesktopPanels('home');
            expect(document.body.classList.contains('desktop-panels-active')).toBe(false);

            state.gameState.user.lifeStatus = 'Citizen';
            state.gameState.user.inPrison = true;
            await UI.updateDesktopPanels('home');
            expect(document.body.classList.contains('desktop-panels-active')).toBe(false);
        });

        test('desktop panels activate on desktop view even when bottom nav preference is disabled', async () => {
            window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn() });
            localStorage.setItem('life_game_bottom_nav', 'false');

            UI.updateBottomNav('home');
            // Bottom nav bar itself should be hidden
            const bottomNav = document.getElementById('bottom-nav');
            expect(bottomNav.classList.contains('hidden')).toBe(true);

            // But desktop side columns are activated
            expect(document.body.classList.contains('desktop-panels-active')).toBe(true);
        });
    });
});
