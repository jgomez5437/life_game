import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { state } from '../../public/src/core/state.js';
import { renderEducation, renderClassmates } from '../../public/src/features/education/manageEducationScreen.js';
import { renderCareerManager } from '../../public/src/features/career/jobCareerManagerScreen.js';
import { openMeetPeopleModal, renderLuxeMatchModal } from '../../public/src/features/relationships/relationshipScreen.js';
import { renderInvestmentsScreen } from '../../public/src/features/assets/investmentsScreen.js';

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
    });

    describe('Feature Screens DOM Markup', () => {
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
    });
});
