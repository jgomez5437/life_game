import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { UI } from '../../public/src/ui/ui.js';
import '../../public/src/core/main.js';

describe('Global Navigation Locking (Router & Modal Interception)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
                <button id="modal-confirm-btn" data-action="hideModal">Confirm</button>
            </div>
            <div id="game-container"></div>
            <nav id="bottom-nav">
                <button id="nav-assets" data-action="renderAssets">Assets</button>
                <button id="nav-work" data-action="renderActivities">Work</button>
                <button id="nav-home" data-action="ageUp">Age Up</button>
            </nav>
            <header id="header">
                <button id="header-settings-btn" data-action="openSettingsModal">Settings</button>
            </header>
        `;

        state.gameState = {
            user: {
                username: 'Test Subject',
                age: 30,
                money: 50000,
                health: 100,
                happiness: 100,
                lifeStatus: 'Living',
                deathCause: ''
            },
            pendingFunerals: [],
            pendingTeacherReplacements: [],
            lifeLog: []
        };
        localStorage.clear();
    });

    test('When a modal is open, clicks outside modal-overlay are dropped', () => {
        UI.showModal('Active Modal', 'Please resolve this first');
        expect(UI.isModalOpen()).toBe(true);

        const assetsBtn = document.getElementById('nav-assets');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        
        // Clicks on bottom nav button outside modal
        assetsBtn.dispatchEvent(clickEvent);

        // Container should not have been updated to assets
        expect(document.getElementById('game-container').innerHTML).toBe('');
    });

    test('When a modal is open, clicks inside modal-overlay are executed', () => {
        UI.showModal('Active Modal', 'Please resolve this first');
        expect(UI.isModalOpen()).toBe(true);

        const modalBtn = document.getElementById('modal-confirm-btn');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        modalBtn.dispatchEvent(clickEvent);

        expect(UI.isModalOpen()).toBe(false);
    });

    test('When character is Deceased, non-death actions are intercepted and blocked', async () => {
        state.gameState.user.lifeStatus = 'Deceased';
        state.gameState.user.deathCause = 'Old Age';

        const assetsBtn = document.getElementById('nav-assets');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        assetsBtn.dispatchEvent(clickEvent);

        // Allow microtask queue to resolve lazy module loading
        await new Promise(resolve => setTimeout(resolve, 50));

        // Bottom nav is hidden and death screen rendered
        expect(document.getElementById('bottom-nav').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('game-container').innerHTML).toContain('You Died');
    });

    test('When funerals are pending, non-funeral actions are intercepted and blocked', async () => {
        state.gameState.pendingFunerals = [{
            id: 'rel_1',
            name: 'Uncle Bob',
            type: 'Uncle',
            age: 65,
            deathCause: 'Heart Attack',
            category: 'family'
        }];

        const workBtn = document.getElementById('nav-work');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        workBtn.dispatchEvent(clickEvent);

        // Allow microtask queue to resolve
        await new Promise(resolve => setTimeout(resolve, 50));

        // User should not be able to navigate to work screen
        expect(document.getElementById('game-container').innerHTML).not.toContain('Current Status');
    });
});
