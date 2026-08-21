import { jest } from '@jest/globals';
import { UI } from '../../../public/src/ui/ui.js';
import { STORE_PACKS } from '../../../public/src/features/store/storeScreen.js';
import { state, hasPurchasedPack } from '../../../public/src/core/state.js';

describe('Packs & Features Store Catalog & Entitlements', () => {

    beforeEach(() => {
        state.gameState = {
            user: {
                username: 'TestUser',
                purchases: []
            }
        };
    });

    test('STORE_PACKS contains expected store packs and valid status', () => {
        expect(STORE_PACKS.length).toBeGreaterThanOrEqual(5);

        const godMode = STORE_PACKS.find(p => p.id === 'god_mode');
        expect(godMode).toBeDefined();
        expect(godMode.status).toBe('available');
        expect(godMode.price).toBe('$2.99');

        const mafia = STORE_PACKS.find(p => p.id === 'mafia_syndicate');
        expect(mafia).toBeDefined();
        expect(mafia.status).toBe('available');
    });

    test('hasPurchasedPack correctly checks user entitlements array', () => {
        expect(hasPurchasedPack('god_mode')).toBe(false);

        state.gameState.user.purchases.push('god_mode');
        expect(hasPurchasedPack('god_mode')).toBe(true);
        expect(hasPurchasedPack('instant_diplomas')).toBe(false);
    });

    test('hasPurchasedPack initializes empty purchases array if missing on user object', () => {
        delete state.gameState.user.purchases;
        expect(hasPurchasedPack('vip_supporter')).toBe(false);
        expect(Array.isArray(state.gameState.user.purchases)).toBe(true);
    });

    test('UI.showCustomModal correctly handles object options without [object Object]', () => {
        document.body.innerHTML = `
            <div id="modal-overlay">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;
        UI.showCustomModal({
            title: 'Test Pack Title',
            content: '<div>Pack Details Content</div>',
            confirmText: 'Unlock for $2.99'
        });

        expect(document.getElementById('modal-title').innerText).toBe('Test Pack Title');
        expect(document.getElementById('modal-content').innerHTML).toBe('<div>Pack Details Content</div>');
        expect(document.getElementById('modal-actions').innerHTML).toContain('Unlock for $2.99');
    });

    test('buyPack prompts login modal when user is unauthenticated', async () => {
        const { buyPack } = await import('../../../public/src/features/store/storeScreen.js');
        const customModalSpy = jest.spyOn(UI, 'showCustomModal').mockImplementation(() => {});

        state.userAuthId = null;
        await buyPack('god_mode');

        expect(customModalSpy).toHaveBeenCalled();
        const callArgs = customModalSpy.mock.calls[0][0];
        expect(callArgs.title).toBe('Sign In Required to Purchase');
        expect(callArgs.confirmText).toBe('Sign In / Create Account');
        expect(callArgs.cancelText).toBe('Continue Playing as Guest');
        expect(callArgs.content).toContain('Please sign in or create an account to unlock packs');

        customModalSpy.mockRestore();
    });

    test('buyPack shows already unlocked modal when pack is already owned', async () => {
        const { buyPack } = await import('../../../public/src/features/store/storeScreen.js');
        const showModalSpy = jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        state.userAuthId = 'auth0|123';
        state.gameState.user.purchases = ['god_mode'];

        await buyPack('god_mode');

        expect(showModalSpy).toHaveBeenCalledWith('Already Unlocked', expect.stringContaining('already own'));

        showModalSpy.mockRestore();
    });
});
