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

export async function getAuthToken() {
    if (!state.auth0Client) return '';
    try {
        const claims = await state.auth0Client.getIdTokenClaims();
        return claims?.__raw || '';
    } catch (e) {
        console.warn("Could not retrieve ID token:", e);
        return '';
    }
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