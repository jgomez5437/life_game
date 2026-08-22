import { jest } from '@jest/globals';
import { UI } from '../../public/src/ui/ui.js';

describe('Header Stats & UI Manager', () => {
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
                    <div id="health-container" class="text-green-400">
                        <span id="ui-health">100%</span>
                    </div>
                    <div id="happiness-container" class="text-amber-400">
                        <span id="ui-happiness">100%</span>
                    </div>
                    <div id="smarts-container" class="text-blue-400">
                        <span id="ui-smarts">50%</span>
                    </div>
                    <div id="looks-container" class="text-pink-400">
                        <span id="ui-looks">50%</span>
                    </div>
                </div>
            </header>
        `;
    });

    test('UI.updateHeader displays all 4 stats and unhides header elements', () => {
        const stats = {
            username: 'Alex Morgan',
            age: 25,
            money: 50000,
            city: 'New York',
            health: 95,
            happiness: 88,
            smarts: 78,
            looks: 82
        };

        UI.updateHeader(stats);

        expect(document.getElementById('header-brand').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('header-main-row').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('header-stats-ribbon').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('header-user-info').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('header-bank-wrapper').classList.contains('hidden')).toBe(false);

        expect(document.getElementById('header-name').textContent).toContain('Alex Morgan');
        expect(document.getElementById('header-age').textContent).toBe('25');
        expect(document.getElementById('header-bank').textContent).toMatch(/\$50,000/);

        expect(document.getElementById('ui-health').textContent).toBe('95%');
        expect(document.getElementById('ui-happiness').textContent).toBe('88%');
        expect(document.getElementById('ui-smarts').textContent).toBe('78%');
        expect(document.getElementById('ui-looks').textContent).toBe('82%');
    });

    test('UI.updateHeader applies dynamic color threshold classes correctly', () => {
        // High stats (> 70)
        UI.updateHeader({ health: 85, happiness: 90, smarts: 80, looks: 75 });
        expect(document.getElementById('health-container').classList.contains('text-green-400')).toBe(true);
        expect(document.getElementById('happiness-container').classList.contains('text-amber-400')).toBe(true);
        expect(document.getElementById('smarts-container').classList.contains('text-blue-400')).toBe(true);
        expect(document.getElementById('looks-container').classList.contains('text-pink-400')).toBe(true);

        // Mid stats (31 - 70)
        UI.updateHeader({ health: 50, happiness: 45, smarts: 60, looks: 55 });
        expect(document.getElementById('health-container').classList.contains('text-yellow-400')).toBe(true);
        expect(document.getElementById('happiness-container').classList.contains('text-yellow-400')).toBe(true);
        expect(document.getElementById('smarts-container').classList.contains('text-indigo-300')).toBe(true);
        expect(document.getElementById('looks-container').classList.contains('text-purple-300')).toBe(true);

        // Low stats (<= 30)
        UI.updateHeader({ health: 20, happiness: 15, smarts: 25, looks: 10 });
        expect(document.getElementById('health-container').classList.contains('text-red-500')).toBe(true);
        expect(document.getElementById('happiness-container').classList.contains('text-red-500')).toBe(true);
        expect(document.getElementById('smarts-container').classList.contains('text-slate-400')).toBe(true);
        expect(document.getElementById('looks-container').classList.contains('text-slate-400')).toBe(true);
    });

    test('UI.updateHeader safely handles fallback stats if values are nested in stats object or missing', () => {
        const statsWithNested = {
            name: 'Sam',
            stats: {
                health: 90,
                happiness: 75,
                smarts: 65,
                looks: 80
            }
        };

        UI.updateHeader(statsWithNested);
        expect(document.getElementById('ui-health').textContent).toBe('90%');
        expect(document.getElementById('ui-happiness').textContent).toBe('75%');
        expect(document.getElementById('ui-smarts').textContent).toBe('65%');
        expect(document.getElementById('ui-looks').textContent).toBe('80%');

        const emptyStats = { name: 'Empty' };
        UI.updateHeader(emptyStats);
        expect(document.getElementById('ui-health').textContent).toBe('100%');
        expect(document.getElementById('ui-happiness').textContent).toBe('100%');
        expect(document.getElementById('ui-smarts').textContent).toBe('50%');
        expect(document.getElementById('ui-looks').textContent).toBe('50%');
    });

    test('UI.resetHeader restores default values and hides in-game elements', () => {
        UI.updateHeader({ health: 30, happiness: 20, smarts: 10, looks: 10, money: 5000 });
        UI.resetHeader();

        expect(document.getElementById('header-brand').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('header-main-row').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('header-stats-ribbon').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('header-name').textContent).toBe('—');
        expect(document.getElementById('header-age').textContent).toBe('—');
        expect(document.getElementById('ui-health').textContent).toBe('100%');
        expect(document.getElementById('ui-happiness').textContent).toBe('100%');
        expect(document.getElementById('ui-smarts').textContent).toBe('50%');
        expect(document.getElementById('ui-looks').textContent).toBe('50%');
        expect(document.getElementById('header-bank').textContent).toMatch(/\$0/);
    });
});
