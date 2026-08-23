import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { 
    openAchievementsModal, 
    filterAchievementsCategory, 
    showAchievementToast 
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
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('openAchievementsModal renders Trophy Room with progress bar and filter pills', () => {
        openAchievementsModal('all');

        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(false);

        const content = document.getElementById('modal-content');
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain('Trophy Room');
        expect(content.innerHTML).toContain('0 / 15 Unlocked');
        expect(content.innerHTML).toContain('data-action="filterAchievementsCategory"');
        expect(content.innerHTML).toContain('All (15)');
        expect(content.innerHTML).toContain('Unlocked (0)');
        expect(content.innerHTML).toContain('Locked (15)');
        expect(content.innerHTML).toContain('Wild (');
    });

    test('openAchievementsModal renders unlocked cards with badges and metadata', () => {
        unlockAchievement('centenarian', state.gameState.user);
        unlockAchievement('supermax_houdini', state.gameState.user);

        openAchievementsModal('all');

        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('2 / 15');
        expect(content.innerHTML).toContain('13%'); // 2/15 is 13%
        expect(content.innerHTML).toContain('The Centenarian');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).toContain('Captain Achievement');
        expect(content.innerHTML).toContain('Unlocked');
    });

    test('filterAchievementsCategory filters by unlocked, locked, and wild', () => {
        unlockAchievement('centenarian', state.gameState.user); // standard
        unlockAchievement('supermax_houdini', state.gameState.user); // wild

        // 1. Unlocked filter
        filterAchievementsCategory('unlocked');
        let content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('The Centenarian');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).not.toContain('Mystery Achievement');

        // 2. Locked filter
        filterAchievementsCategory('locked');
        content = document.getElementById('modal-content');
        expect(content.innerHTML).not.toContain('Captain Achievement');
        expect(content.innerHTML).toContain('Locked');

        // 3. Wild filter
        filterAchievementsCategory('wild');
        content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('Supermax Houdini');
        expect(content.innerHTML).toContain('Wild');
    });

    test('openAchievementsModal shows wild clues for locked wild achievements', () => {
        openAchievementsModal('locked');

        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('Clue:');
        expect(content.innerHTML).toContain('Junk Food Immortal');
        expect(content.innerHTML).toContain('Near Death Experience');
    });

    test('showAchievementToast displays floating banner and removes after timer', () => {
        const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === 'unicorn_tycoon');
        showAchievementToast(achievement);

        let toast = document.querySelector('.achievement-toast');
        expect(toast).not.toBeNull();
        expect(toast.innerHTML).toContain('Achievement Unlocked!');
        expect(toast.innerHTML).toContain('Unicorn Tycoon');

        // Fast-forward animation and auto-removal timer
        jest.advanceTimersByTime(5000);
        toast = document.querySelector('.achievement-toast');
        expect(toast).toBeNull();
    });
});
