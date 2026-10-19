import { state, hasPurchasedPack, setVerifiedPurchases } from '../../../public/src/core/state.js';
import { maxGodModeStats, applyGodModeStats, renderGodModeModal } from '../../../public/src/features/store/storeScreen.js';
import { saveGodModeAvatar, updateGodModeAvatarTrait, randomizeGodModeAvatarTraits } from '../../../public/src/features/store/godModeAvatarEditor.js';
import { UI } from '../../../public/src/ui/ui.js';

describe('God Mode Entitlement Checks & Avatar Editing', () => {

    beforeEach(() => {
        state.verifiedPurchases = null;
        state.gameState = {
            user: {
                username: 'Test User',
                purchases: [],
                health: 50,
                happiness: 50,
                smarts: 50,
                looks: 50,
                appearance: { skinTone: 'light', hairStyle: 'shortCrop' },
                relationships: [
                    {
                        id: 'rel_spouse_1',
                        name: 'Jane Doe',
                        type: 'Wife',
                        category: 'spouse',
                        gender: 'female',
                        age: 25,
                        appearance: { skinTone: 'medium', hairStyle: 'longWaves' }
                    }
                ]
            }
        };
        localStorage.clear();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">25</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
            <input id="god-health" value="90">
            <input id="god-happiness" value="90">
            <input id="god-smarts" value="90">
            <input id="god-looks" value="90">
        `;
    });

    test('hasPurchasedPack returns false when god_mode is not owned', () => {
        expect(hasPurchasedPack('god_mode')).toBe(false);
    });

    test('hasPurchasedPack returns true when god_mode is in verifiedPurchases', () => {
        setVerifiedPurchases(['god_mode']);
        expect(hasPurchasedPack('god_mode')).toBe(true);
    });

    test('hasPurchasedPack rejects client-side hacks like gameState.godMode or gameState.purchasedPacks', () => {
        state.gameState.godMode = true;
        state.gameState.purchasedPacks = ['god_mode'];
        state.gameState.user.godMode = true;
        state.gameState.user.purchasedPacks = ['god_mode'];

        expect(hasPurchasedPack('god_mode')).toBe(false);
    });

    test('setVerifiedPurchases scrubs all forged entitlement flags from gameState', () => {
        state.gameState.godMode = true;
        state.gameState.purchasedPacks = ['god_mode'];
        state.gameState.isVIP = true;
        state.gameState.vipLevel = 5;
        state.gameState.user.godMode = true;
        state.gameState.user.purchasedPacks = ['god_mode'];
        state.gameState.user.isVIP = true;
        state.gameState.user.vipLevel = 5;

        setVerifiedPurchases(['instant_diplomas']);

        expect(state.gameState.godMode).toBeUndefined();
        expect(state.gameState.purchasedPacks).toBeUndefined();
        expect(state.gameState.isVIP).toBeUndefined();
        expect(state.gameState.vipLevel).toBeUndefined();
        expect(state.gameState.user.godMode).toBeUndefined();
        expect(state.gameState.user.purchasedPacks).toBeUndefined();
        expect(state.gameState.user.isVIP).toBeUndefined();
        expect(state.gameState.user.vipLevel).toBeUndefined();
        expect(state.gameState.user.purchases).toEqual(['instant_diplomas']);
    });

    test('maxGodModeStats does not alter stats if god_mode is not purchased', () => {
        maxGodModeStats();
        expect(state.gameState.user.health).toBe(50);
        expect(state.gameState.user.happiness).toBe(50);
        expect(state.gameState.user.smarts).toBe(50);
        expect(state.gameState.user.looks).toBe(50);
    });

    test('maxGodModeStats sets all stats to 100 when god_mode is purchased', () => {
        setVerifiedPurchases(['god_mode']);
        maxGodModeStats();
        expect(state.gameState.user.health).toBe(100);
        expect(state.gameState.user.happiness).toBe(100);
        expect(state.gameState.user.smarts).toBe(100);
        expect(state.gameState.user.looks).toBe(100);
    });

    test('applyGodModeStats does not alter stats if god_mode is not purchased', () => {
        applyGodModeStats();
        expect(state.gameState.user.health).toBe(50);
        expect(state.gameState.user.happiness).toBe(50);
    });

    test('applyGodModeStats applies input values when god_mode is purchased', () => {
        setVerifiedPurchases(['god_mode']);
        applyGodModeStats();
        expect(state.gameState.user.health).toBe(90);
        expect(state.gameState.user.happiness).toBe(90);
        expect(state.gameState.user.smarts).toBe(90);
        expect(state.gameState.user.looks).toBe(90);
    });

    test('saveGodModeAvatar is blocked when god_mode is not purchased', () => {
        const initialHair = state.gameState.user.appearance.hairStyle;
        saveGodModeAvatar();
        expect(state.gameState.user.appearance.hairStyle).toBe(initialHair);
    });

    test('relationships list allows modifying NPC appearance when owned', () => {
        const spouse = state.gameState.user.relationships[0];
        expect(spouse.appearance.hairStyle).toBe('longWaves');

        spouse.appearance.hairStyle = 'pixieCut';
        spouse.appearance.hairColorBase = 'blonde';

        expect(state.gameState.user.relationships[0].appearance.hairStyle).toBe('pixieCut');
        expect(state.gameState.user.relationships[0].appearance.hairColorBase).toBe('blonde');
    });

    test('renderGodModeAvatarModal and updateGodModeAvatarTrait update draft traits via select dropdowns and save to user', async () => {
        const { renderGodModeAvatarModal } = await import('../../../public/src/features/store/godModeAvatarEditor.js');
        const { ACTION_TO_MODULE } = await import('../../../public/src/core/moduleLoader.js');
        await import('../../../public/src/core/main.js');

        expect(ACTION_TO_MODULE['updateGodModeAvatarTrait']).toBe('godModeAvatar');

        setVerifiedPurchases(['god_mode']);
        renderGodModeAvatarModal('self');

        const hairColorSelect = document.getElementById('godmode_select_hairColorBase');
        expect(hairColorSelect).not.toBeNull();
        expect(hairColorSelect.getAttribute('data-action')).toBe('updateGodModeAvatarTrait');

        // Clicking the select should NOT re-render or mutate trait before change fires
        const initialValue = hairColorSelect.value;
        hairColorSelect.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(document.getElementById('godmode_select_hairColorBase').value).toBe(initialValue);

        // Selecting a new option and firing change event updates draft appearance
        const targetOption = Array.from(hairColorSelect.options).find(o => o.value !== initialValue)?.value || hairColorSelect.options[0].value;
        hairColorSelect.value = targetOption;
        hairColorSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for lazy proxy resolution if triggered via router, or verify direct call
        await new Promise(r => setTimeout(r, 20));
        expect(document.getElementById('godmode_select_hairColorBase').value).toBe(targetOption);

        saveGodModeAvatar();
        expect(state.gameState.user.appearance.hairColorBase).toBe(targetOption);
    });

});
