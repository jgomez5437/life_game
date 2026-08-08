import { state } from '../public/src/core/state.js';
import { isVipSupporter, renderVipLoungeModal, selectTheme } from '../public/src/features/store/vipLounge.js';
import { UI } from '../public/src/ui/ui.js';
import { applyTheme } from '../public/src/features/more/settingsScreen.js';
import { renderLifeDashboard } from '../public/src/features/player/mainScreen.js';
import { openPlayerOverviewModal } from '../public/src/features/player/playerOverviewScreen.js';

describe('VIP Supporter & Unique Theme Features', () => {

    beforeEach(() => {
        document.body.className = '';
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
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
                username: 'VipPlayer',
                age: 25,
                money: 50000,
                health: 100,
                city: 'New York',
                purchases: ['vip_supporter']
            },
            lifeLog: []
        };
    });

    test('isVipSupporter checks user entitlements array correctly', () => {
        expect(isVipSupporter()).toBe(true);

        state.gameState.user.purchases = [];
        expect(isVipSupporter()).toBe(false);
    });

    test('renderLifeDashboard displays VIP Supporter banner when vip_supporter is owned', () => {
        renderLifeDashboard(state.gameState);

        const container = document.getElementById('game-container');
        expect(container.innerHTML).toContain('VIP Supporter');
        expect(container.innerHTML).toContain('renderVipLoungeModal');
    });

    test('openPlayerOverviewModal displays VIP Supporter badge tag', () => {
        openPlayerOverviewModal();

        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('VIP Supporter');
    });

    test('applyTheme adds onyx-gold-mode and light-mode CSS classes correctly', () => {
        applyTheme('onyx-gold');
        expect(document.body.classList.contains('onyx-gold-mode')).toBe(true);
        expect(document.body.classList.contains('light-mode')).toBe(false);

        applyTheme('light');
        expect(document.body.classList.contains('light-mode')).toBe(true);
        expect(document.body.classList.contains('onyx-gold-mode')).toBe(false);

        applyTheme('dark');
        expect(document.body.classList.contains('light-mode')).toBe(false);
        expect(document.body.classList.contains('onyx-gold-mode')).toBe(false);
    });

    test('selectTheme prevents selection of Onyx & Gold theme if player does not own VIP pack', () => {
        state.gameState.user.purchases = [];
        selectTheme('onyx-gold');

        const title = document.getElementById('modal-title');
        expect(title.innerText).toBe('VIP Perk Locked');
        expect(document.body.classList.contains('onyx-gold-mode')).toBe(false);
    });
});
