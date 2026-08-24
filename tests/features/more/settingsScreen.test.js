import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { 
    openSettingsModal, 
    promptResetGame,
    promptSignOut, 
    handleSignOut,
    toggleSettingSFX,
    toggleSettingCompact,
    toggleSettingBottomNav,
    toggleSettingTheme,
    applyTheme
} from '../../../public/src/features/more/settingsScreen.js';
import { logout } from '../../../public/src/auth/auth.js';
import { UI } from '../../../public/src/ui/ui.js';
import { resetGame } from '../../../public/src/core/main.js';

describe('Settings Screen & Sign Out Functionality', () => {

    beforeEach(() => {
        localStorage.clear();
        document.body.className = '';
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-brand"></div>
            <div id="header-user-info" class="hidden">
                <span id="header-name">Player</span>
                <span id="header-age">18</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="health-container"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'TestPlayer',
                age: 25,
                money: 50000,
                health: 100,
                city: 'New York',
                purchases: []
            },
            lifeLog: []
        };
        state.userAuthId = null;
        state.userEmail = null;
        state.auth0Client = null;
    });

    test('openSettingsModal displays Guest Local Mode, Login button, Achievements card, version 1.4.2, and no bottom close button', () => {
        state.userAuthId = null;
        openSettingsModal();

        const content = document.getElementById('modal-content');
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain('Guest Local Mode');
        expect(content.innerHTML).toContain('data-action="login"');
        expect(content.innerHTML).toContain('Log In &amp; Save to Cloud');
        expect(content.innerHTML).toContain('Achievements');
        expect(content.innerHTML).toContain('data-action="openAchievementsModal"');
        expect(content.innerHTML).toContain('Bottom Navigation Bar');
        expect(content.innerHTML).toContain('data-action="toggleSettingBottomNav"');
        expect(content.innerHTML).toContain('Version 1.4.2');
        expect(content.innerHTML).not.toContain('data-action="hideModal"');
        expect(content.innerHTML).not.toContain('data-action="promptSignOut"');
    });

    test('openSettingsModal displays Cloud Sync Active and Sign Out button when user is authenticated', () => {
        state.userAuthId = 'auth0|987654';
        state.userEmail = 'player@example.com';
        
        openSettingsModal();

        const content = document.getElementById('modal-content');
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain('Cloud Sync Active');
        expect(content.innerHTML).toContain('player@example.com');
        expect(content.innerHTML).toContain('data-action="promptSignOut"');
        expect(content.innerHTML).toContain('Sign Out');
        expect(content.innerHTML).not.toContain('data-action="login"');
    });

    test('promptResetGame opens confirmation modal and confirms reset life closing all modals', () => {
        openSettingsModal();
        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(false);

        promptResetGame();
        const title = document.getElementById('modal-title');
        const confirmBtn = document.getElementById('modal-confirm');

        expect(title.textContent).toBe('Start New Life?');
        expect(confirmBtn).not.toBeNull();

        // Simulate confirming Reset Life
        confirmBtn.click();

        // Modal overlay must be hidden after confirming reset
        expect(overlay.classList.contains('hidden')).toBe(true);
    });

    test('resetGame wipes local saves and resets in-memory game state', async () => {
        localStorage.setItem('life_game_slots', JSON.stringify({ activeSlotId: 'slot_1', slots: { slot_1: { data: { user: { username: 'Old' } } } } }));
        localStorage.setItem('life_game_save', JSON.stringify({ user: { username: 'Old' } }));
        localStorage.setItem('startALife_saveData', JSON.stringify({ user: { username: 'Old' } }));

        await resetGame();

        expect(state.gameState).toBeNull();
        expect(localStorage.getItem('life_game_slots')).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();
        expect(localStorage.getItem('startALife_saveData')).toBeNull();
        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(true);
    });

    test('promptSignOut opens confirmation modal with Sign Out confirm button', () => {
        openSettingsModal();
        promptSignOut();

        const title = document.getElementById('modal-title');
        const confirmBtn = document.getElementById('modal-confirm');

        expect(title.textContent).toBe('Sign Out?');
        expect(confirmBtn).not.toBeNull();
        expect(confirmBtn.textContent).toBe('Sign Out');
    });

    test('handleSignOut renders loading screen, purges local saves, and invokes logout', async () => {
        state.userAuthId = 'auth0|12345';
        state.userEmail = 'test@example.com';
        localStorage.setItem('life_game_slots', JSON.stringify({ activeSlotId: 'slot_1', slots: { slot_1: { data: { user: { username: 'CloudChar' } } } } }));
        localStorage.setItem('life_game_save', JSON.stringify({ user: { username: 'CloudChar' } }));
        localStorage.setItem('startALife_saveData', JSON.stringify({ user: { username: 'CloudChar' } }));

        const logoutMock = jest.fn();
        state.auth0Client = { logout: logoutMock };

        await handleSignOut();

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Signing Out...');
        expect(localStorage.getItem('life_game_slots')).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();
        expect(localStorage.getItem('startALife_saveData')).toBeNull();
        expect(state.gameState).toBeNull();
        expect(state.userAuthId).toBeNull();
        expect(state.userEmail).toBeNull();
        expect(logoutMock).toHaveBeenCalledWith(expect.objectContaining({
            logoutParams: expect.objectContaining({
                returnTo: expect.any(String)
            })
        }));
    });

    test('logout in auth.js purges local storage saves and handles null auth0Client gracefully without throwing', async () => {
        state.auth0Client = null;
        localStorage.setItem('life_game_slots', '{"some":"data"}');
        localStorage.setItem('life_game_save', '{"some":"data"}');
        localStorage.setItem('startALife_saveData', '{"some":"data"}');
        state.gameState = { user: { name: 'Player' } };

        await expect(logout()).resolves.not.toThrow();

        expect(localStorage.getItem('life_game_slots')).toBeNull();
        expect(localStorage.getItem('life_game_save')).toBeNull();
        expect(localStorage.getItem('startALife_saveData')).toBeNull();
        expect(state.gameState).toBeNull();
    });

    test('toggleSettingSFX toggles sfx in localStorage and updates toggle state', () => {
        openSettingsModal();
        expect(localStorage.getItem('life_game_sfx')).toBeNull(); // default true

        toggleSettingSFX();
        expect(localStorage.getItem('life_game_sfx')).toBe('false');

        toggleSettingSFX();
        expect(localStorage.getItem('life_game_sfx')).toBe('true');
    });

    test('toggleSettingCompact toggles compact mode in localStorage', () => {
        openSettingsModal();
        expect(localStorage.getItem('life_game_compact')).toBeNull();

        toggleSettingCompact();
        expect(localStorage.getItem('life_game_compact')).toBe('true');

        toggleSettingCompact();
        expect(localStorage.getItem('life_game_compact')).toBe('false');
    });

    test('toggleSettingBottomNav toggles bottom nav preference in localStorage and updates toggle state', () => {
        openSettingsModal();
        expect(localStorage.getItem('life_game_bottom_nav')).toBeNull(); // default true

        toggleSettingBottomNav();
        expect(localStorage.getItem('life_game_bottom_nav')).toBe('false');

        toggleSettingBottomNav();
        expect(localStorage.getItem('life_game_bottom_nav')).toBe('true');
    });

    test('toggleSettingTheme switches between dark and light themes', () => {
        toggleSettingTheme();
        expect(localStorage.getItem('life_game_theme')).toBe('light');
        expect(document.body.classList.contains('light-mode')).toBe(true);

        toggleSettingTheme();
        expect(localStorage.getItem('life_game_theme')).toBe('dark');
        expect(document.body.classList.contains('light-mode')).toBe(false);
    });
});
