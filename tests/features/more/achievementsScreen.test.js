import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    openAchievementsModal,
    filterAchievementsCategory,
    showAchievementToast,
    dismissAchievementToast
} from '../../../public/src/features/more/achievementsScreen.js';
import {
    unlockAchievement,
    resetAchievements,
    ACHIEVEMENTS_CATALOG
} from '../../../public/src/core/achievementManager.js';

describe('Achievements Screen & Trophy Room UI', () => {

    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;
        UI.closeAllModals();

        state.gameState = {
            user: {
                username: 'Captain Achievement',
                age: 30,
                generation: 1,
                money: 100000
            },
            lifeLog: [],
            achievements: {}
        };
    });

    afterEach(() => {
        resetAchievements();
        UI.closeAllModals();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('openAchievementsModal renders Trophy Room with progress bar and category filter pills', () => {
        openAchievementsModal('all');

        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(false);

        const content = document.getElementById('modal-content');
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain('Trophy Room');
        expect(content.innerHTML).toContain('0 / 20 Unlocked');
        expect(content.innerHTML).toContain('data-action="filterAchievementsCategory"');
        expect(content.innerHTML).toContain('All (20)');
        expect(content.innerHTML).toContain('Unlocked (0)');
        expect(content.innerHTML).toContain('Locked (20)');
        expect(content.innerHTML).toContain('Wild (6)');
        expect(content.innerHTML).toContain('Life (');
        expect(content.innerHTML).toContain('Wealth (');
        expect(content.innerHTML).toContain('Crime (');
        expect(content.innerHTML).toContain('Luck (');
    });

    test('openAchievementsModal renders unlocked cards with badges, metadata, and progress bars on locked cards', () => {
        unlockAchievement('centenarian', state.gameState.user);
        unlockAchievement('supermax_houdini', state.gameState.user);

        openAchievementsModal('all');

        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('2 / 20');
        expect(content.innerHTML).toContain('10%'); // 2 / 20 = 10%
        expect(content.innerHTML).toContain('The Centenarian');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).toContain('Captain Achievement');
        expect(content.innerHTML).toContain('Unlocked');
        expect(content.innerHTML).toContain('0 / 5 Children');
    });

    test('filterAchievementsCategory filters by unlocked, locked, wild, and domain categories', () => {
        unlockAchievement('centenarian', state.gameState.user); // standard
        unlockAchievement('supermax_houdini', state.gameState.user); // wild

        // 1. Unlocked filter
        filterAchievementsCategory('unlocked');
        let content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('The Centenarian');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).not.toContain('Yard Kingpin');

        // 2. Locked filter
        filterAchievementsCategory('locked');
        content = document.getElementById('modal-content');
        expect(content.innerHTML).not.toContain('Captain Achievement');
        expect(content.innerHTML).toContain('Locked');

        // 3. Wild filter
        filterAchievementsCategory('wild');
        content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).toContain('Yard Kingpin');

        // 4. Crime filter
        filterAchievementsCategory('crime');
        content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('The Godfather');
        expect(content.innerHTML).toContain('Yard Kingpin');
    });

    test('openAchievementsModal preserves parent modal on modal stack and restores it on hideModal', () => {
        UI.showCustomModal({ title: 'Parent Settings', content: '<div>Parent Settings Content</div>' });
        openAchievementsModal();

        expect(document.getElementById('modal-content').innerHTML).toContain('Trophy Room');
        UI.hideModal();
        expect(document.getElementById('modal-title').innerText).toBe('Parent Settings');
        expect(document.getElementById('modal-content').innerHTML).toContain('Parent Settings Content');
    });

    test('openAchievementsModal shows wild clues for locked wild achievements', () => {
        openAchievementsModal('locked');

        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('Clue:');
        expect(content.innerHTML).toContain('Junk Food Immortal');
        expect(content.innerHTML).toContain('Near Death Experience');
    });

    test('showAchievementToast displays declarative floating banner with high z-index and supports manual + timer dismiss', () => {
        const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === 'unicorn_tycoon');
        showAchievementToast(achievement);

        const container = document.getElementById('achievement-toast-container');
        expect(container.style.zIndex).toBe('9999');

        let toast = document.querySelector('.achievement-toast');
        expect(toast).not.toBeNull();
        expect(toast.innerHTML).toContain('Achievement Unlocked!');
        expect(toast.innerHTML).toContain('Unicorn Tycoon');
        expect(toast.innerHTML).toContain('data-action="dismissAchievementToast"');
        expect(toast.innerHTML).not.toContain('onclick=');

        // Manual declarative dismissal
        dismissAchievementToast(toast.id);
        expect(document.querySelector('.achievement-toast')).toBeNull();

        // Auto-removal timer
        showAchievementToast(achievement);
        expect(document.querySelector('.achievement-toast')).not.toBeNull();
        jest.advanceTimersByTime(5000);
        expect(document.querySelector('.achievement-toast')).toBeNull();
    });
});
