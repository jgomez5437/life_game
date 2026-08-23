import { jest } from '@jest/globals';
import { UI } from '../../public/src/ui/ui.js';
import { state } from '../../public/src/core/state.js';
import { renderPrisonDashboard, setPrisonTab } from '../../public/src/features/more/prisonScreen.js';
import { renderBusinessDashboard, setBusinessTab } from '../../public/src/features/business/businessDashboard.js';

describe('Sub-Navigation Scroll Locking & Preservation', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <header>
                <div id="header-brand"></div>
                <div id="header-main-row" class="hidden">
                    <div id="header-user-info" class="hidden">
                        <div id="avatar-container"></div>
                        <h1 id="header-name">Player</h1>
                        <span id="header-age">0</span>
                    </div>
                    <div id="header-bank-wrapper" class="hidden">
                        <div id="header-bank">$0</div>
                    </div>
                    <button id="header-settings-btn" class="hidden"></button>
                </div>
                <div id="header-stats-ribbon" class="hidden">
                    <div id="health-container"><span id="ui-health">100%</span></div>
                    <div id="happiness-container"><span id="ui-happiness">100%</span></div>
                    <div id="smarts-container"><span id="ui-smarts">50%</span></div>
                    <div id="looks-container"><span id="ui-looks">50%</span></div>
                </div>
            </header>

            <main id="game-container" class="flex-1 overflow-y-auto p-4 relative bg-slate-900"></main>

            <nav id="bottom-nav" class="bg-slate-800 border-t border-slate-700 hidden">
                <div id="bottom-nav-container">
                    <button id="nav-btn-assets"></button>
                    <button id="nav-btn-work"></button>
                    <button id="nav-btn-center"></button>
                    <button id="nav-btn-social"></button>
                    <button id="nav-btn-more"></button>
                </div>
            </nav>

            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-close-btn"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                name: 'Alex Mercer',
                age: 30,
                money: 100000,
                inPrison: true,
                facilityName: 'Alcatraz Penitentiary',
                prisonSecurity: 'Medium',
                prisonTotalSentence: 10,
                prisonSentenceRemaining: 7,
                prisonStats: {
                    respect: 40,
                    guardRelation: 60,
                    canteenCash: 120,
                    solitaryTurns: 0,
                    contraband: ['Contraband Cellphone']
                },
                yardInmates: [],
                cellmate: null,
                hasBusiness: true,
                companyName: 'TechVibe Inc',
                industry: 'tech_saas',
                hqTier: 'office_park',
                companyYear: 3,
                companyQuarter: 2,
                compCash: 250000,
                employees: 15,
                equityOwned: 0.85,
                customerSatisfaction: 80,
                employeeMorale: 75,
                businessHistory: [],
                businessUpgrades: [],
                productionTarget: 500,
                sellingPrice: 120,
                salaryOffer: 4500,
                ceoSalary: 10000,
                supplierId: 'standard',
                inventory: 200,
                businessReputation: 50,
                marketingLevels: {}
            }
        };
    });

    describe('UI.scrollTabIntoView and UI.preserveTabScroll', () => {
        test('UI.scrollTabIntoView safely handles non-existent elements without error', () => {
            expect(() => {
                UI.scrollTabIntoView('non-existent-id', '.some-selector');
                UI.scrollTabIntoView(null, null);
                UI.preserveTabScroll('non-existent-id', null, 50);
            }).not.toThrow();
        });

        test('UI.preserveTabScroll restores saved scrollLeft value', () => {
            const container = document.createElement('div');
            container.id = 'test-tab-nav';
            container.scrollLeft = 0;
            document.body.appendChild(container);

            UI.preserveTabScroll('test-tab-nav', null, 145);
            expect(container.scrollLeft).toBe(145);
        });

        test('UI.scrollTabIntoView calculates center offset correctly when mock metrics exist', () => {
            const container = document.createElement('div');
            container.id = 'custom-nav';
            Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true });
            Object.defineProperty(container, 'offsetLeft', { value: 0, configurable: true });
            container.scrollTo = jest.fn((opts) => {
                container.scrollLeft = opts.left;
            });

            const btn = document.createElement('button');
            btn.className = 'tab-btn active';
            Object.defineProperty(btn, 'clientWidth', { value: 80, configurable: true });
            Object.defineProperty(btn, 'offsetLeft', { value: 250, configurable: true });
            btn.getBoundingClientRect = () => ({ width: 80, left: 250, right: 330 });
            container.getBoundingClientRect = () => ({ width: 300, left: 0, right: 300 });

            container.appendChild(btn);
            document.body.appendChild(container);

            UI.scrollTabIntoView(container, btn, { align: 'center' });
            // targetOffset = (250 - 0) - (300/2) + (80/2) = 250 - 150 + 40 = 140
            expect(container.scrollTo).toHaveBeenCalledWith({ left: 140, behavior: 'smooth' });
            expect(container.scrollLeft).toBe(140);
        });
    });

    describe('Prison Screen Horizontal Navigation', () => {
        test('renders prison tab navigation with id="prison-tab-nav"', () => {
            renderPrisonDashboard();
            const tabNav = document.getElementById('prison-tab-nav');
            expect(tabNav).not.toBeNull();
            expect(tabNav.classList.contains('overflow-x-auto')).toBe(true);
            expect(tabNav.classList.contains('touch-pan-x')).toBe(true);
        });

        test('setPrisonTab updates active tab and renders corresponding content', () => {
            renderPrisonDashboard();
            setPrisonTab('jobs_canteen');

            const activeBtn = document.querySelector('#prison-tab-nav [data-args="jobs_canteen"]');
            expect(activeBtn).not.toBeNull();
            expect(activeBtn.classList.contains('bg-slate-700')).toBe(true);

            const canteenHeader = document.querySelector('#game-container');
            expect(canteenHeader.innerHTML).toContain('Canteen &amp; Black Market Store');
        });

        test('preserves tab nav scroll position across re-renders', () => {
            renderPrisonDashboard();
            const nav = document.getElementById('prison-tab-nav');
            nav.scrollLeft = 180;

            // Re-render dashboard
            renderPrisonDashboard();
            const newNav = document.getElementById('prison-tab-nav');
            expect(newNav.scrollLeft).toBe(180);
        });
    });

    describe('Business Dashboard Horizontal Navigation', () => {
        test('renders business tab navigation with id="business-tab-nav"', () => {
            renderBusinessDashboard();
            const tabNav = document.getElementById('business-tab-nav');
            expect(tabNav).not.toBeNull();
            expect(tabNav.classList.contains('overflow-x-auto')).toBe(true);
            expect(tabNav.classList.contains('touch-pan-x')).toBe(true);
        });

        test('setBusinessTab switches tabs and highlights active tab with high contrast', () => {
            renderBusinessDashboard();
            setBusinessTab('finance');

            const activeBtn = document.querySelector('#business-tab-nav [data-args*="finance"]');
            expect(activeBtn).not.toBeNull();
            expect(activeBtn.classList.contains('bg-indigo-600')).toBe(true);

            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('Venture Capital Pitch Room');
        });

        test('preserves business tab nav scroll position across re-renders', () => {
            renderBusinessDashboard();
            const nav = document.getElementById('business-tab-nav');
            nav.scrollLeft = 220;

            renderBusinessDashboard();
            const newNav = document.getElementById('business-tab-nav');
            expect(newNav.scrollLeft).toBe(220);
        });
    });
});
