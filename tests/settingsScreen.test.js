import { jest } from '@jest/globals';
import { state } from '../public/src/core/state.js';
import { 
    openSettingsModal, 
    promptSignOut, 
    handleSignOut,
    toggleSettingSFX,
    toggleSettingCompact,
    toggleSettingTheme,
    applyTheme
} from '../public/src/features/more/settingsScreen.js';
import { logout } from '../public/src/auth/auth.js';
import { UI } from '../public/src/ui/ui.js';

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

    test('openSettingsModal displays Guest Local Mode and Login button when userAuthId is null', () => {
        state.userAuthId = null;
        openSettingsModal();

        const content = document.getElementById('modal-content');
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain('Guest Local Mode');
        expect(content.innerHTML).toContain('data-action="login"');
        expect(content.innerHTML).toContain('Log In &amp; Save to Cloud');
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

    test('promptSignOut opens confirmation modal with Sign Out confirm button', () => {
        openSettingsModal();
        promptSignOut();

        const title = document.getElementById('modal-title');
        const confirmBtn = document.getElementById('modal-confirm');

        expect(title.textContent).toBe('Sign Out?');
        expect(confirmBtn).not.toBeNull();
        expect(confirmBtn.textContent).toBe('Sign Out');
    });

    test('handleSignOut renders loading screen and invokes logout', async () => {
        state.userAuthId = 'auth0|12345';
        const logoutMock = jest.fn();
        state.auth0Client = { logout: logoutMock };

        await handleSignOut();

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('Signing Out...');
        expect(logoutMock).toHaveBeenCalledWith(expect.objectContaining({
            logoutParams: expect.objectContaining({
                returnTo: expect.any(String)
            })
        }));
    });

    test('logout in auth.js handles null auth0Client gracefully without throwing', async () => {
        state.auth0Client = null;
        await expect(logout()).resolves.not.toThrow();
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

    test('toggleSettingTheme switches between dark and light themes', () => {
        toggleSettingTheme();
        expect(localStorage.getItem('life_game_theme')).toBe('light');
        expect(document.body.classList.contains('light-mode')).toBe(true);

        toggleSettingTheme();
        expect(localStorage.getItem('life_game_theme')).toBe('dark');
        expect(document.body.classList.contains('light-mode')).toBe(false);
    });
});
