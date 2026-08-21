import { state, setVerifiedPurchases } from '../../public/src/core/state.js';
import { 
    AD_STATE, 
    ADSENSE_CLIENT_ID, 
    ADSENSE_SCRIPT_SRC, 
    getAdState, 
    isAdFree, 
    resolveAdState, 
    injectAdSenseScript, 
    onVipPurchased, 
    cleanAdDomElements, 
    resetAdState 
} from '../../public/src/core/adManager.js';

describe('AdManager - Server Authoritative VIP Ad-Free System', () => {

    beforeEach(() => {
        resetAdState();
        document.head.innerHTML = '';
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="ad-container">
                <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="1234567890"></ins>
            </div>
        `;
        state.verifiedPurchases = null;
        state.gameState = null;
        state.userAuthId = null;
        localStorage.clear();
    });

    afterEach(() => {
        resetAdState();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        localStorage.clear();
    });

    test('initial ad state is UNKNOWN and no AdSense script is injected', () => {
        expect(getAdState()).toBe(AD_STATE.UNKNOWN);
        expect(isAdFree()).toBe(false);

        // Attempting to inject while UNKNOWN should be prevented
        injectAdSenseScript();
        const script = document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`);
        expect(script).toBeNull();
    });

    test('verified VIP Supporter resolves to VIP_AD_FREE and does NOT load AdSense', () => {
        const verifiedPurchases = ['vip_supporter'];
        const resolved = resolveAdState(verifiedPurchases);

        expect(resolved).toBe(AD_STATE.VIP_AD_FREE);
        expect(getAdState()).toBe(AD_STATE.VIP_AD_FREE);
        expect(isAdFree()).toBe(true);

        // Script must NOT be in the DOM
        const script = document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`);
        expect(script).toBeNull();
    });

    test('non-VIP user or guest resolves to ADS_ENABLED and injects AdSense script', () => {
        const resolved = resolveAdState([]);

        expect(resolved).toBe(AD_STATE.ADS_ENABLED);
        expect(getAdState()).toBe(AD_STATE.ADS_ENABLED);
        expect(isAdFree()).toBe(false);

        // Script MUST be injected into <head>
        const script = document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`);
        expect(script).not.toBeNull();
        expect(script.src).toContain(ADSENSE_CLIENT_ID);
        expect(script.async).toBe(true);
        expect(script.crossOrigin).toBe('anonymous');
    });

    test('localStorage tampering does NOT grant VIP_AD_FREE if server entitlement is missing', () => {
        // Malicious client sets fake localStorage
        localStorage.setItem('life_game_vip_ad_free', 'true');
        localStorage.setItem('life_game_purchases', JSON.stringify(['vip_supporter']));

        // Server returns no verified purchases for authenticated user
        state.userAuthId = 'auth0|12345';
        const serverPurchases = ['god_mode']; // Has God Mode, but NOT vip_supporter

        const resolved = resolveAdState(serverPurchases);

        expect(resolved).toBe(AD_STATE.ADS_ENABLED);
        expect(isAdFree()).toBe(false);
        const script = document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`);
        expect(script).not.toBeNull();
    });

    test('mid-session VIP purchase via onVipPurchased purges existing ads and sets VIP_AD_FREE', () => {
        // Start as guest with ads enabled
        resolveAdState([]);
        expect(getAdState()).toBe(AD_STATE.ADS_ENABLED);
        expect(document.querySelector('ins.adsbygoogle')).not.toBeNull();
        expect(document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`)).not.toBeNull();

        // User buys VIP Supporter mid-session
        onVipPurchased();

        expect(getAdState()).toBe(AD_STATE.VIP_AD_FREE);
        expect(isAdFree()).toBe(true);

        // Active ad elements and script must be cleaned from DOM
        expect(document.querySelector('ins.adsbygoogle')).toBeNull();
        expect(document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`)).toBeNull();
    });

    test('resetAdState resets state to UNKNOWN and cleans DOM', () => {
        resolveAdState([]);
        expect(getAdState()).toBe(AD_STATE.ADS_ENABLED);

        resetAdState();
        expect(getAdState()).toBe(AD_STATE.UNKNOWN);
        expect(isAdFree()).toBe(false);
        expect(document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`)).toBeNull();
    });
});
