import { jest } from '@jest/globals';
import { UI } from '../../public/src/ui/ui.js';

describe('Floating Stat Delta Badges & Micro-Animations', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = `
            <header>
                <div id="header-brand"></div>
                <div id="header-main-row" class="hidden">
                    <div id="header-user-info" class="hidden">
                        <div id="avatar-container"></div>
                        <h1 id="header-name">Player</h1>
                        <span id="header-age">20</span>
                    </div>
                    <div id="header-bank-wrapper" class="hidden relative">
                        <div id="header-bank">$10,000</div>
                    </div>
                    <button id="header-settings-btn" class="hidden"></button>
                </div>
                <div id="header-stats-ribbon" class="hidden">
                    <div id="health-container" class="header-stat-pill relative text-green-400">
                        <div class="header-stat-fill-track">
                            <div id="health-bar-fill" class="header-stat-fill" style="width: 100%;"></div>
                        </div>
                        <span id="ui-health">100%</span>
                    </div>
                    <div id="happiness-container" class="header-stat-pill relative text-amber-400">
                        <div class="header-stat-fill-track">
                            <div id="happiness-bar-fill" class="header-stat-fill" style="width: 100%;"></div>
                        </div>
                        <span id="ui-happiness">100%</span>
                    </div>
                    <div id="smarts-container" class="header-stat-pill relative text-blue-400">
                        <div class="header-stat-fill-track">
                            <div id="smarts-bar-fill" class="header-stat-fill" style="width: 50%;"></div>
                        </div>
                        <span id="ui-smarts">50%</span>
                    </div>
                    <div id="looks-container" class="header-stat-pill relative text-pink-400">
                        <div class="header-stat-fill-track">
                            <div id="looks-bar-fill" class="header-stat-fill" style="width: 50%;"></div>
                        </div>
                        <span id="ui-looks">50%</span>
                    </div>
                </div>
            </header>
        `;
        UI.resetHeader();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('Initial UI.updateHeader call caches baseline stats without spawning floating badges', () => {
        const initialStats = {
            health: 80,
            happiness: 80,
            smarts: 60,
            looks: 70,
            money: 10000
        };

        UI.updateHeader(initialStats);

        const badges = document.querySelectorAll('.floating-stat-delta');
        expect(badges.length).toBe(0);

        expect(UI.getLastHeaderStats()).toEqual({
            health: 80,
            happiness: 80,
            smarts: 60,
            looks: 70,
            money: 10000
        });
    });

    test('Subsequent UI.updateHeader calls with stat gains spawn positive floating badges and pulse effects', () => {
        // 1. Initial baseline
        UI.updateHeader({ health: 80, happiness: 75, smarts: 60, looks: 50, money: 5000 });

        // 2. Action modifying stats (e.g. Gym: +10 Health, Studying: +15 Smarts)
        UI.updateHeader({ health: 90, happiness: 75, smarts: 75, looks: 50, money: 5000 });

        const healthContainer = document.getElementById('health-container');
        const smartsContainer = document.getElementById('smarts-container');
        const happinessContainer = document.getElementById('happiness-container');

        const healthBadge = healthContainer.querySelector('.floating-stat-delta');
        expect(healthBadge).not.toBeNull();
        expect(healthBadge.textContent).toBe('+10% Health ❤️');
        expect(healthBadge.classList.contains('delta-positive')).toBe(true);
        expect(healthContainer.classList.contains('pill-pulse-pos')).toBe(true);

        const smartsBadge = smartsContainer.querySelector('.floating-stat-delta');
        expect(smartsBadge).not.toBeNull();
        expect(smartsBadge.textContent).toBe('+15% Smarts 🧠');
        expect(smartsBadge.classList.contains('delta-positive')).toBe(true);
        expect(smartsContainer.classList.contains('pill-pulse-pos')).toBe(true);

        // Happiness didn't change -> no badge
        expect(happinessContainer.querySelector('.floating-stat-delta')).toBeNull();

        // Progress fill bars updated
        expect(document.getElementById('health-bar-fill').style.width).toBe('90%');
        expect(document.getElementById('smarts-bar-fill').style.width).toBe('75%');
    });

    test('Subsequent UI.updateHeader calls with stat drops spawn negative floating badges and negative pulse effects', () => {
        // 1. Initial baseline
        UI.updateHeader({ health: 80, happiness: 70, smarts: 60, looks: 50, money: 5000 });

        // 2. Action reducing health by -10% and happiness by -15%
        UI.updateHeader({ health: 70, happiness: 55, smarts: 60, looks: 50, money: 5000 });

        const healthContainer = document.getElementById('health-container');
        const happinessContainer = document.getElementById('happiness-container');

        const healthBadge = healthContainer.querySelector('.floating-stat-delta');
        expect(healthBadge).not.toBeNull();
        expect(healthBadge.textContent).toBe('-10% Health ❤️');
        expect(healthBadge.classList.contains('delta-negative')).toBe(true);
        expect(healthContainer.classList.contains('pill-pulse-neg')).toBe(true);

        const happinessBadge = happinessContainer.querySelector('.floating-stat-delta');
        expect(happinessBadge).not.toBeNull();
        expect(happinessBadge.textContent).toBe('-15% Happiness 😊');
        expect(happinessBadge.classList.contains('delta-negative')).toBe(true);
        expect(happinessContainer.classList.contains('pill-pulse-neg')).toBe(true);
    });

    test('Financial changes trigger formatted money delta badges (+$5,200 💵 / -$500 💵)', () => {
        // 1. Initial baseline
        UI.updateHeader({ health: 80, happiness: 70, smarts: 60, looks: 50, money: 10000 });

        // 2. Received bonus (+$5,200)
        UI.updateHeader({ health: 80, happiness: 70, smarts: 60, looks: 50, money: 15200 });

        const bankWrapper = document.getElementById('header-bank-wrapper');
        let moneyBadge = bankWrapper.querySelector('.floating-stat-delta');
        expect(moneyBadge).not.toBeNull();
        expect(moneyBadge.textContent).toBe('+$5,200 💵');
        expect(moneyBadge.classList.contains('delta-positive')).toBe(true);

        // 3. Paid expense (-$750)
        UI.updateHeader({ health: 80, happiness: 70, smarts: 60, looks: 50, money: 14450 });
        const allMoneyBadges = bankWrapper.querySelectorAll('.floating-stat-delta');
        const latestBadge = allMoneyBadges[allMoneyBadges.length - 1];
        expect(latestBadge.textContent).toBe('-$750 💵');
        expect(latestBadge.classList.contains('delta-negative')).toBe(true);
    });

    test('UI.showStatDelta direct programmatic API handles custom labels and emojis', () => {
        UI.showStatDelta('looks', 8, 'Looks', '✨');

        const looksContainer = document.getElementById('looks-container');
        const badge = looksContainer.querySelector('.floating-stat-delta');
        expect(badge).not.toBeNull();
        expect(badge.textContent).toBe('+8% Looks ✨');
        expect(badge.classList.contains('delta-positive')).toBe(true);

        // Direct DOM element target
        const customDiv = document.createElement('div');
        document.body.appendChild(customDiv);
        UI.showStatDelta(customDiv, -25, 'Karma', '⚡');
        const customBadge = customDiv.querySelector('.floating-stat-delta');
        expect(customBadge).not.toBeNull();
        expect(customBadge.textContent).toBe('-25% Karma ⚡');
        expect(customBadge.classList.contains('delta-negative')).toBe(true);
    });

    test('Floating badges auto-remove on animationend or timeout', () => {
        UI.showStatDelta('smarts', 5);
        const smartsContainer = document.getElementById('smarts-container');
        const badge = smartsContainer.querySelector('.floating-stat-delta');
        expect(badge).not.toBeNull();

        // Simulate animationend event
        badge.dispatchEvent(new Event('animationend'));
        expect(smartsContainer.querySelector('.floating-stat-delta')).toBeNull();

        // Test timeout fallback
        UI.showStatDelta('smarts', 10);
        expect(smartsContainer.querySelector('.floating-stat-delta')).not.toBeNull();
        jest.advanceTimersByTime(1500);
        expect(smartsContainer.querySelector('.floating-stat-delta')).toBeNull();
    });

    test('UI.resetHeader resets baseline state and restores fill bars to defaults', () => {
        UI.updateHeader({ health: 40, happiness: 35, smarts: 20, looks: 25, money: 300 });
        expect(UI.getLastHeaderStats()).not.toBeNull();

        UI.resetHeader();
        expect(UI.getLastHeaderStats()).toBeNull();
        expect(document.getElementById('health-bar-fill').style.width).toBe('100%');
        expect(document.getElementById('happiness-bar-fill').style.width).toBe('100%');
        expect(document.getElementById('smarts-bar-fill').style.width).toBe('50%');
        expect(document.getElementById('looks-bar-fill').style.width).toBe('50%');
    });
});
