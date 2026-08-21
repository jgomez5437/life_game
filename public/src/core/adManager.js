import { state, hasPurchasedPack } from './state.js';

export const ADSENSE_CLIENT_ID = 'ca-pub-2356499284480204';
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

export const AD_STATE = {
    UNKNOWN: 'UNKNOWN',
    VIP_AD_FREE: 'VIP_AD_FREE',
    ADS_ENABLED: 'ADS_ENABLED'
};

let currentAdState = AD_STATE.UNKNOWN;
let isScriptInjected = false;

/**
 * Gets the current ad state ('UNKNOWN' | 'VIP_AD_FREE' | 'ADS_ENABLED').
 */
export function getAdState() {
    return currentAdState;
}

/**
 * Checks if the current session is in VIP Ad-Free mode.
 * Strictly checks the resolved state machine, which is set by server-verified entitlements.
 */
export function isAdFree() {
    return currentAdState === AD_STATE.VIP_AD_FREE;
}

/**
 * Resolves the ad state once authentication and server-authoritative entitlements are known.
 * @param {string[]} [verifiedPurchases] - Optional array of verified pack IDs directly from the server.
 * @returns {string} The resolved AD_STATE.
 */
export function resolveAdState(verifiedPurchases = null) {
    // Determine VIP status strictly from server-verified purchases or state
    let isVip = false;

    if (Array.isArray(verifiedPurchases)) {
        isVip = verifiedPurchases.includes('vip_supporter');
    } else if (Array.isArray(state.verifiedPurchases)) {
        isVip = state.verifiedPurchases.includes('vip_supporter');
    } else if (typeof hasPurchasedPack === 'function') {
        isVip = hasPurchasedPack('vip_supporter');
    }

    if (isVip) {
        currentAdState = AD_STATE.VIP_AD_FREE;
        console.log("⭐ [AdManager] Verified VIP Supporter detected. AdSense blocked (0 ad requests).");
        // Secondary cleanup in case any ad elements exist
        cleanAdDomElements();
        return currentAdState;
    }

    // Non-VIP user or unauthenticated guest -> enable ads
    currentAdState = AD_STATE.ADS_ENABLED;
    console.log("📢 [AdManager] Non-VIP session resolved. Loading AdSense...");
    injectAdSenseScript();
    return currentAdState;
}

/**
 * Dynamically injects the AdSense script tag into <head> if not already present.
 */
export function injectAdSenseScript() {
    if (currentAdState !== AD_STATE.ADS_ENABLED) {
        console.warn("[AdManager] Cannot inject AdSense script: State is not ADS_ENABLED (current: " + currentAdState + ")");
        return;
    }

    if (isScriptInjected) return;

    if (typeof document === 'undefined') return;

    // Check if script already exists in DOM
    const existing = document.querySelector(`script[src*="${ADSENSE_CLIENT_ID}"]`);
    if (existing) {
        isScriptInjected = true;
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = ADSENSE_SCRIPT_SRC;
    script.crossOrigin = 'anonymous';
    script.id = 'adsense-script-tag';
    script.onerror = () => {
        // Client ad blocker intercepted AdSense script; non-fatal
    };

    document.head.appendChild(script);
    isScriptInjected = true;
    console.log("✅ [AdManager] AdSense script tag dynamically added to <head>.");
}

/**
 * Triggered when VIP Supporter is purchased during an active session.
 * Transitions state to VIP_AD_FREE, purges active ad units, and stops future ad calls.
 */
export function onVipPurchased() {
    currentAdState = AD_STATE.VIP_AD_FREE;
    console.log("⭐ [AdManager] VIP Supporter activated mid-session. Purging active ads...");
    cleanAdDomElements();
}

/**
 * Cleans up any injected AdSense script tags, <ins class="adsbygoogle"> elements, and Google ad frames from the DOM.
 */
export function cleanAdDomElements() {
    if (typeof document === 'undefined') return;

    // 1. Remove script tags matching AdSense
    const scriptTags = document.querySelectorAll(`script[src*="googlesyndication.com"], script#adsense-script-tag`);
    scriptTags.forEach(el => el.remove());
    isScriptInjected = false;

    // 2. Remove manual and auto ad slots (<ins class="adsbygoogle">)
    const adUnits = document.querySelectorAll('ins.adsbygoogle, .adsbygoogle');
    adUnits.forEach(el => el.remove());

    // 3. Remove Google Auto Ad wrappers / iframes if any were rendered
    const autoAdContainers = document.querySelectorAll('iframe[id*="google_ads"], iframe[src*="googlesyndication"], .google-auto-placed');
    autoAdContainers.forEach(el => el.remove());
}

/**
 * Resets the AdManager state back to UNKNOWN. Used during logout or full app reset.
 */
export function resetAdState() {
    currentAdState = AD_STATE.UNKNOWN;
    isScriptInjected = false;
    cleanAdDomElements();
    console.log("🔄 [AdManager] Ad state reset to UNKNOWN.");
}
