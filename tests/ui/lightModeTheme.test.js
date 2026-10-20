import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { state } from '../../public/src/core/state.js';
import { renderEducation, renderClassmates } from '../../public/src/features/education/manageEducationScreen.js';
import { renderCareerManager } from '../../public/src/features/career/jobCareerManagerScreen.js';
import { openMeetPeopleModal, renderLuxeMatchModal } from '../../public/src/features/relationships/relationshipScreen.js';
import { renderInvestmentsScreen } from '../../public/src/features/assets/investmentsScreen.js';
import { renderLoginScreen } from '../../public/src/auth/loginScreen.js';
import { renderMoreDashboard } from '../../public/src/features/more/moreScreen.js';
import { renderGraveyardModal } from '../../public/src/features/player/graveyardScreen.js';
import { renderLifeDashboard } from '../../public/src/features/player/mainScreen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Light Mode Theme & UI Contrast Verification', () => {
    let cssContent = '';

    beforeAll(() => {
        const cssPath = path.resolve(__dirname, '../../public/styles.css');
        cssContent = fs.readFileSync(cssPath, 'utf8');
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;
        document.body.className = 'light-mode';

        state.gameState = {
            user: {
                username: 'Jane Doe',
                age: 22,
                money: 150000,
                health: 90,
                happiness: 85,
                smarts: 80,
                looks: 75,
                schoolEnrolled: true,
                schoolName: 'State University',
                schoolPerformance: 80,
                schoolActions: 0,
                jobTitle: 'Junior Developer',
                jobSalary: 65000,
                jobPerformance: 70,
                careerActionTaken: false,
                relationships: [],
                investments: {
                    savings: 10000,
                    stocks: {},
                    stockMarket: [
                        { symbol: 'APPL', name: 'Apex Tech', price: 150, sector: 'Technology', icon: 'fa-microchip', color: 'text-cyan-400', dividendYield: 0.02 }
                    ],
                    blogPosts: []
                }
            }
        };
    });

    describe('CSS Theme Selectors & Contrast Guarantees', () => {
        test('styles.css contains high-specificity subtext rules for solid colored buttons', () => {
            expect(cssContent).toContain('body.light-mode .bg-blue-600 .text-blue-100');
            expect(cssContent).toContain('body.light-mode .bg-blue-600 .text-blue-200');
            expect(cssContent).toContain('body.light-mode .bg-indigo-600 .text-indigo-100');
            expect(cssContent).toContain('body.light-mode .bg-indigo-600 .text-indigo-200');
            expect(cssContent).toContain('rgba(255, 255, 255, 0.88) !important');
        });

        test('styles.css contains light mode override for Investments Hub hero card', () => {
            expect(cssContent).toContain('body.light-mode .bg-gradient-to-br.from-slate-800.to-slate-900');
            expect(cssContent).toContain('linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important');
        });

        test('styles.css contains light mode override for LuxeMatch cards and buttons', () => {
            expect(cssContent).toContain('body.light-mode .luxe-match-card');
            expect(cssContent).toContain('body.light-mode .luxe-fee-card');
            expect(cssContent).toContain('body.light-mode .luxe-wealth-active');
            expect(cssContent).toContain('body.light-mode [class*="from-amber-500"][class*="to-yellow-400"] *');
            expect(cssContent).toContain('#0f172a !important');
        });

        test('styles.css contains high-contrast distinct Age Up button styling for light mode', () => {
            expect(cssContent).toContain('body.light-mode #nav-btn-center[data-action="ageUp"]');
            expect(cssContent).toContain('body.light-mode .btn-age-up');
            expect(cssContent).toContain('linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important');
            expect(cssContent).toContain('body.light-mode .btn-age-up *');
        });

        test('styles.css defines custom Obsidian Studio dark mode variables and Electric Indigo-Cobalt Age Up styling', () => {
            expect(cssContent).toContain('--obsidian-canvas: #080a0f;');
            expect(cssContent).toContain('--obsidian-surface: #111520;');
            expect(cssContent).toContain('--obsidian-well: #0b0e16;');
            expect(cssContent).toContain('linear-gradient(135deg, #6366f1 0%, #3b82f6 100%) !important');
            expect(cssContent).toContain('body:not(.light-mode):not(.onyx-gold-mode) #game-container');
        });

        test('styles.css guarantees white text for more-option-btn, active-age-badge, graveyard header, and dark backgrounds in light mode', () => {
            expect(cssContent).toContain('body.light-mode .more-option-btn');
            expect(cssContent).toContain('body.light-mode .active-age-badge');
            expect(cssContent).toContain('body.light-mode .graveyard-lineage-header h3');
            expect(cssContent).toContain('body.light-mode .bg-cyan-700');
            expect(cssContent).toContain('body.light-mode [class*="from-indigo-"]');
            expect(cssContent).toContain('body.light-mode [class*="from-amber-600"]');
            expect(cssContent).toContain('body.light-mode [class*="from-cyan-"]');
        });
    });

    describe('Feature Screens DOM Markup', () => {
        test('renderLoginScreen renders Light/Dark Mode toggle button reflecting active light mode', () => {
            renderLoginScreen();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('id="login-theme-toggle"');
            expect(container.innerHTML).toContain('data-action="toggleSettingTheme"');
            expect(container.innerHTML).toContain('Theme: Light Mode');
            expect(container.innerHTML).toContain('Switch to Dark');
        });

        test('manageEducationScreen renders Classmates and Work Harder with readable light subtext classes', () => {
            renderEducation();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('data-action="renderClassmates"');
            expect(container.innerHTML).toContain('text-indigo-100');
            expect(container.innerHTML).toContain('data-action="workHarder"');
            expect(container.innerHTML).toContain('text-blue-100');
        });

        test('jobCareerManagerScreen renders Work Harder with readable light subtext classes', () => {
            renderCareerManager();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('data-action="workHarderJob"');
            expect(container.innerHTML).toContain('text-blue-100');
        });

        test('openMeetPeopleModal renders LuxeMatch with luxe-match-card class', () => {
            openMeetPeopleModal();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('data-action="renderLuxeMatchModal"');
            expect(container.innerHTML).toContain('luxe-match-card');
        });

        test('renderLuxeMatchModal renders fee card and confirmation button with light mode styling classes', () => {
            renderLuxeMatchModal();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('luxe-fee-card');
            expect(container.innerHTML).toContain('luxe-action-btn');
            expect(container.innerHTML).toContain('data-action="confirmLuxeMatch"');
        });

        test('renderInvestmentsScreen renders Total Portfolio Value card with gradient overview class', () => {
            renderInvestmentsScreen('hub');
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('Total Portfolio Value');
            expect(container.innerHTML).toContain('bg-gradient-to-br from-slate-800 to-slate-900');
        });

        test('renderMoreDashboard renders all option buttons with more-option-btn and text-white classes for uniform white text', () => {
            renderMoreDashboard();
            const container = document.getElementById('game-container');
            const buttons = container.querySelectorAll('.more-option-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(12);
            buttons.forEach(btn => {
                expect(btn.classList.contains('text-white')).toBe(true);
            });
            expect(container.innerHTML).toContain('Book Trip');
            expect(container.innerHTML).toContain('Casino Floor');
            expect(container.innerHTML).toContain('Time Machine');
            expect(container.innerHTML).toContain('God Mode');
            expect(container.innerHTML).toContain('Open Store');
            expect(container.innerHTML).not.toContain('text-slate-950 font-extrabold shadow');
        });

        test('renderLifeDashboard renders active age badge with active-age-badge and text-white on dark blue gradient', () => {
            state.gameState.lifeLog = [
                { age: 22, events: [{ msg: 'Turned 22 years old', color: 'text-emerald-400' }] },
                { age: 21, events: [{ msg: 'Turned 21 years old', color: 'text-blue-400' }] }
            ];
            renderLifeDashboard();
            const container = document.getElementById('game-container');
            const activeBadge = container.querySelector('.active-age-badge');
            expect(activeBadge).not.toBeNull();
            expect(activeBadge.classList.contains('text-white')).toBe(true);
            expect(activeBadge.innerHTML).toContain('Age 22');
            expect(activeBadge.innerHTML).toContain('• Now');
        });

        test('renderGraveyardModal renders lineage header with graveyard-lineage-header and white House of title', () => {
            state.gameState.pastLives = [];
            renderGraveyardModal();
            const lineageHeader = document.querySelector('.graveyard-lineage-header');
            expect(lineageHeader).not.toBeNull();
            const title = lineageHeader.querySelector('h3');
            expect(title).not.toBeNull();
            expect(title.classList.contains('text-white')).toBe(true);
            expect(title.textContent).toContain('House of Doe');
        });
    });
});
