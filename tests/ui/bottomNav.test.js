import { jest } from '@jest/globals';
import { UI } from '../../public/src/ui/ui.js';
import { state } from '../../public/src/core/state.js';
import { renderLifeDashboard, renderDeathScreen } from '../../public/src/features/player/mainScreen.js';
import { renderAssets } from '../../public/src/features/assets/assetsScreen.js';
import { renderActivities } from '../../public/src/features/career/occupationScreen.js';
import { renderRelationships } from '../../public/src/features/relationships/relationshipScreen.js';
import { renderMoreDashboard } from '../../public/src/features/more/moreScreen.js';
import { renderLoginScreen } from '../../public/src/auth/loginScreen.js';
import { renderPrisonDashboard } from '../../public/src/features/more/prisonScreen.js';

describe('Persistent Global Bottom Navigation & Active Tab States', () => {
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

            <nav id="bottom-nav" class="bg-slate-800 border-t border-slate-700 px-3 py-2 shadow-lg z-10 shrink-0 hidden select-none" aria-label="Main Navigation">
                <div id="bottom-nav-container" class="w-full max-w-lg mx-auto grid grid-cols-5 gap-1.5 sm:gap-2 h-16 sm:h-18">
                    <button id="nav-btn-assets" data-action="renderAssets" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Assets">
                        <i class="fas fa-coins mb-1 text-lg sm:text-xl text-yellow-400"></i>
                        <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Assets</span>
                    </button>
                    <button id="nav-btn-work" data-action="renderActivities" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Work & Education">
                        <i class="fas fa-user-graduate mb-1 text-lg sm:text-xl text-blue-400"></i>
                        <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Work</span>
                    </button>
                    <button id="nav-btn-center" data-action="ageUp" class="btn-age-up btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center transition" title="Age Up (+1 Year)">
                        <i class="fas fa-arrow-up mb-1 text-lg sm:text-xl"></i>
                        <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Age Up +</span>
                    </button>
                    <button id="nav-btn-social" data-action="renderRelationships" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Relationships & Social">
                        <i class="fas fa-users mb-1 text-lg sm:text-xl text-pink-400"></i>
                        <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Social</span>
                    </button>
                    <button id="nav-btn-more" data-action="renderMoreDashboard" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="More Options & Activities">
                        <i class="fas fa-ellipsis-h mb-1 text-lg sm:text-xl text-slate-400"></i>
                        <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">More</span>
                    </button>
                </div>
            </nav>

            <div id="modal-overlay" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
                <div>
                    <h2 id="modal-title"></h2>
                    <div id="modal-content"></div>
                    <div id="modal-actions"></div>
                    <button id="modal-close-btn"></button>
                </div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'Jordan Chase',
                name: 'Jordan Chase',
                age: 22,
                money: 25000,
                city: 'New York',
                country: 'United States',
                health: 90,
                happiness: 85,
                smarts: 80,
                looks: 75,
                jobTitle: 'Software Engineer',
                jobSalary: 85000,
                jobPerformance: 70,
                assets: [],
                relationships: [],
                purchases: []
            },
            lifeLog: [
                { age: 22, events: [{ msg: 'Started working as Software Engineer', color: 'text-blue-400 font-bold' }] }
            ]
        };
    });

    test('UI.updateBottomNav("home") renders Age Up button and activates home center tab', () => {
        UI.updateBottomNav('home');

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const assetsBtn = document.getElementById('nav-btn-assets');
        const workBtn = document.getElementById('nav-btn-work');
        const socialBtn = document.getElementById('nav-btn-social');
        const moreBtn = document.getElementById('nav-btn-more');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('ageUp');
        expect(centerBtn.textContent).toContain('Age Up +');
        expect(centerBtn.classList.contains('btn-age-up')).toBe(true);
        expect(centerBtn.classList.contains('btn-primary')).toBe(true);
        expect(centerBtn.classList.contains('nav-tab-active')).toBe(true);
        expect(centerBtn.classList.contains('nav-tab-home')).toBe(true);

        const centerIcon = centerBtn.querySelector('i');
        expect(centerIcon.classList.contains('fa-arrow-up')).toBe(true);
        expect(centerIcon.classList.contains('nav-icon-bounce')).toBe(true);

        // Other buttons should not have active tab state
        expect(assetsBtn.classList.contains('nav-tab-active')).toBe(false);
        expect(workBtn.classList.contains('nav-tab-active')).toBe(false);
        expect(socialBtn.classList.contains('nav-tab-active')).toBe(false);
        expect(moreBtn.classList.contains('nav-tab-active')).toBe(false);
    });

    test('UI.updateBottomNav("assets") transforms Center button into Home and highlights Assets tab', () => {
        UI.updateBottomNav('assets');

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const assetsBtn = document.getElementById('nav-btn-assets');
        const workBtn = document.getElementById('nav-btn-work');

        expect(bottomNav.classList.contains('hidden')).toBe(false);

        // Center button becomes "Home" on non-homepage views
        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(centerBtn.textContent).toContain('Home');
        expect(centerBtn.classList.contains('btn-nav')).toBe(true);
        expect(centerBtn.classList.contains('btn-age-up')).toBe(false);
        expect(centerBtn.querySelector('i').classList.contains('fa-home')).toBe(true);

        // Assets button is highlighted with active glow & bounce
        expect(assetsBtn.classList.contains('nav-tab-active')).toBe(true);
        expect(assetsBtn.classList.contains('nav-tab-assets')).toBe(true);
        expect(assetsBtn.querySelector('i').classList.contains('nav-icon-bounce')).toBe(true);

        // Other tabs inactive
        expect(centerBtn.classList.contains('nav-tab-active')).toBe(false);
        expect(workBtn.classList.contains('nav-tab-active')).toBe(false);
    });

    test('UI.updateBottomNav("work") highlights Work tab and maintains Home Center button', () => {
        UI.updateBottomNav('work');

        const centerBtn = document.getElementById('nav-btn-center');
        const workBtn = document.getElementById('nav-btn-work');
        const assetsBtn = document.getElementById('nav-btn-assets');

        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(centerBtn.textContent).toContain('Home');

        expect(workBtn.classList.contains('nav-tab-active')).toBe(true);
        expect(workBtn.classList.contains('nav-tab-work')).toBe(true);
        expect(workBtn.querySelector('i').classList.contains('nav-icon-bounce')).toBe(true);

        expect(assetsBtn.classList.contains('nav-tab-active')).toBe(false);
    });

    test('UI.updateBottomNav("social") highlights Social tab and maintains Home Center button', () => {
        UI.updateBottomNav('social');

        const centerBtn = document.getElementById('nav-btn-center');
        const socialBtn = document.getElementById('nav-btn-social');

        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(centerBtn.textContent).toContain('Home');

        expect(socialBtn.classList.contains('nav-tab-active')).toBe(true);
        expect(socialBtn.classList.contains('nav-tab-social')).toBe(true);
        expect(socialBtn.querySelector('i').classList.contains('nav-icon-bounce')).toBe(true);
    });

    test('UI.updateBottomNav("more") highlights More tab and maintains Home Center button', () => {
        UI.updateBottomNav('more');

        const centerBtn = document.getElementById('nav-btn-center');
        const moreBtn = document.getElementById('nav-btn-more');

        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(centerBtn.textContent).toContain('Home');

        expect(moreBtn.classList.contains('nav-tab-active')).toBe(true);
        expect(moreBtn.classList.contains('nav-tab-more')).toBe(true);
        expect(moreBtn.querySelector('i').classList.contains('nav-icon-bounce')).toBe(true);
    });

    test('UI.hideBottomNav hides the bottom navigation bar and clears tab states', () => {
        UI.updateBottomNav('work');
        expect(document.getElementById('bottom-nav').classList.contains('hidden')).toBe(false);

        UI.hideBottomNav();

        const bottomNav = document.getElementById('bottom-nav');
        expect(bottomNav.classList.contains('hidden')).toBe(true);
        expect(document.getElementById('nav-btn-work').classList.contains('nav-tab-active')).toBe(false);
    });

    test('renderLifeDashboard activates home tab and renders dashboard cleanly', () => {
        renderLifeDashboard(state.gameState);

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('ageUp');
        expect(centerBtn.textContent).toContain('Age Up +');
        expect(centerBtn.classList.contains('nav-tab-active')).toBe(true);
    });

    test('renderDeathScreen hides the persistent bottom navigation bar', () => {
        UI.updateBottomNav('home');
        renderDeathScreen(state.gameState.user, 'Old Age');

        const bottomNav = document.getElementById('bottom-nav');
        expect(bottomNav.classList.contains('hidden')).toBe(true);
    });

    test('renderAssets activates the assets tab with Home center button', () => {
        renderAssets();

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const assetsBtn = document.getElementById('nav-btn-assets');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(assetsBtn.classList.contains('nav-tab-active')).toBe(true);
    });

    test('renderActivities activates the work tab with Home center button', () => {
        renderActivities();

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const workBtn = document.getElementById('nav-btn-work');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(workBtn.classList.contains('nav-tab-active')).toBe(true);
    });

    test('renderRelationships activates the social tab with Home center button', () => {
        renderRelationships();

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const socialBtn = document.getElementById('nav-btn-social');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(socialBtn.classList.contains('nav-tab-active')).toBe(true);
    });

    test('renderMoreDashboard activates the more tab with Home center button', () => {
        renderMoreDashboard();

        const bottomNav = document.getElementById('bottom-nav');
        const centerBtn = document.getElementById('nav-btn-center');
        const moreBtn = document.getElementById('nav-btn-more');

        expect(bottomNav.classList.contains('hidden')).toBe(false);
        expect(centerBtn.dataset.action).toBe('renderLifeDashboard');
        expect(moreBtn.classList.contains('nav-tab-active')).toBe(true);
    });

    test('renderLoginScreen and renderPrisonDashboard hide the bottom navigation bar', () => {
        UI.updateBottomNav('home');
        renderLoginScreen();
        expect(document.getElementById('bottom-nav').classList.contains('hidden')).toBe(true);

        state.gameState.user.inPrison = true;
        UI.updateBottomNav('home');
        renderPrisonDashboard();
        expect(document.getElementById('bottom-nav').classList.contains('hidden')).toBe(true);
    });

    describe('Optional Bottom Navigation Preference', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        test('UI.isBottomNavEnabled returns true by default and false when toggled off', () => {
            expect(UI.isBottomNavEnabled()).toBe(true);

            localStorage.setItem('life_game_bottom_nav', 'false');
            expect(UI.isBottomNavEnabled()).toBe(false);

            localStorage.setItem('life_game_bottom_nav', 'true');
            expect(UI.isBottomNavEnabled()).toBe(true);
        });

        test('UI.updateBottomNav keeps bottom-nav hidden when disabled in preferences', () => {
            localStorage.setItem('life_game_bottom_nav', 'false');

            UI.updateBottomNav('home');
            const bottomNav = document.getElementById('bottom-nav');
            expect(bottomNav.classList.contains('hidden')).toBe(true);

            UI.updateBottomNav('assets');
            expect(bottomNav.classList.contains('hidden')).toBe(true);
        });

        test('renderLifeDashboard renders inline 5-button action bar when bottom nav is disabled in settings', () => {
            localStorage.setItem('life_game_bottom_nav', 'false');

            renderLifeDashboard(state.gameState);

            const bottomNav = document.getElementById('bottom-nav');
            expect(bottomNav.classList.contains('hidden')).toBe(true);

            const gameContainer = document.getElementById('game-container');
            expect(gameContainer.innerHTML).toContain('data-action="renderAssets"');
            expect(gameContainer.innerHTML).toContain('data-action="renderActivities"');
            expect(gameContainer.innerHTML).toContain('data-action="ageUp"');
            expect(gameContainer.innerHTML).toContain('data-action="renderRelationships"');
            expect(gameContainer.innerHTML).toContain('data-action="renderMoreDashboard"');
        });

        test('renderLifeDashboard does not render inline 5-button action bar when bottom nav is enabled (default)', () => {
            localStorage.setItem('life_game_bottom_nav', 'true');

            renderLifeDashboard(state.gameState);

            const bottomNav = document.getElementById('bottom-nav');
            expect(bottomNav.classList.contains('hidden')).toBe(false);

            const gameContainer = document.getElementById('game-container');
            // The container shouldn't have inline action buttons
            const inlineAgeUp = gameContainer.querySelector('[data-action="ageUp"]');
            expect(inlineAgeUp).toBeNull();
        });
    });
});
