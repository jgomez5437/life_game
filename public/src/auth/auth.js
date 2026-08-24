import { state } from '../core/state.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';
import { resetAdState } from '../core/adManager.js';

let auth0Client = null;

const config = {
    domain: "dev-ofc1agu3ax7gzj2f.us.auth0.com",
    clientId: "SzIrZaBzHZLS9js0HtJEwA35ZwN8hmkT"
};

export async function configureAuth() {
    state.auth0Client = await auth0.createAuth0Client({
        domain: config.domain,
        clientId: config.clientId,
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
        if (typeof UI !== 'undefined' && UI.renderLoadingScreen) {
            UI.renderLoadingScreen("Authenticating Account...", "Processing secure login...");
        }
        await state.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    }
};

export async function getAuthToken(forceRefresh = false) {
    if (!state.auth0Client) return '';

    // 1. Check if we have cached ID token claims that are still valid (not expired)
    if (!forceRefresh) {
        try {
            const claims = await state.auth0Client.getIdTokenClaims();
            const nowSec = Math.floor(Date.now() / 1000);
            // If claims exist with a raw token and expiration is at least 60 seconds in the future
            if (claims?.__raw && typeof claims.exp === 'number' && claims.exp > nowSec + 60) {
                return claims.__raw;
            }
        } catch (e) {
            console.warn("Could not retrieve ID token claims, attempting silent refresh:", e);
        }
    }

    // 2. Token is expired, near expiration, or forceRefresh requested; refresh silently
    try {
        if (typeof state.auth0Client.getTokenSilently === 'function') {
            const options = { detailedResponse: true };
            if (forceRefresh) options.cacheMode = 'off';
            const tokenRes = await state.auth0Client.getTokenSilently(options);
            if (tokenRes?.id_token) {
                return tokenRes.id_token;
            }
            if (typeof tokenRes === 'string' && tokenRes) {
                const refreshedClaims = await state.auth0Client.getIdTokenClaims();
                if (refreshedClaims?.__raw) return refreshedClaims.__raw;
                return tokenRes;
            }
            // If getTokenSilently updated the internal cache, retrieve the fresh claims
            const refreshedClaims = await state.auth0Client.getIdTokenClaims();
            if (refreshedClaims?.__raw) return refreshedClaims.__raw;
        }
    } catch (e2) {
        console.warn("Silent token refresh failed:", e2);
    }

    // 3. Fallback: if silent refresh failed, check if getIdTokenClaims has any token
    try {
        const fallbackClaims = await state.auth0Client.getIdTokenClaims();
        if (fallbackClaims?.__raw) return fallbackClaims.__raw;
    } catch (e3) {
        console.warn("Fallback ID token retrieval failed:", e3);
    }

    return '';
}

export async function login() {
    if (typeof UI !== 'undefined' && UI.renderLoadingScreen) {
        UI.renderLoadingScreen("Connecting to Auth0...", "Redirecting to secure login portal...");
    }
    if (state.gameState && state.gameState.user) {
        console.log("Saving active guest character before login redirect...");
        Utils.guestStorage.saveGame();
    }
    await state.auth0Client.loginWithRedirect();
};

export async function logout() {
    resetAdState();
    try {
        localStorage.removeItem('life_game_slots');
        localStorage.removeItem('life_game_save');
    } catch (e) {}
    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
        Utils.guestStorage.clearSave();
    }
    state.gameState = null;
    state.userAuthId = null;
    state.userEmail = null;

    if (state.auth0Client && typeof state.auth0Client.logout === 'function') {
        await state.auth0Client.logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    } else {
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
            window.location.href = window.location.origin;
        }
    }
};

async function updateAuthUI() {
    const isAuthenticated = await auth0Client.isAuthenticated();
    const loginBtn = document.getElementById("btn-login");
    const logoutBtn = document.getElementById("btn-logout");
    const userDisplay = document.getElementById("header-name");
    if (isAuthenticated) {
        const user = await auth0Client.getUser();
        console.log("Logged in user:", user);
        state.userAuthId = user.sub;
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (userDisplay) userDisplay.innerText = user.nickname || user.email;
    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (userDisplay) userDisplay.innerText = "Guest Player";
    }
};