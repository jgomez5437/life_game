import { getAuthToken } from '../auth/auth.js';
import { renderLoginScreen } from '../auth/loginScreen.js';
import { state, setVerifiedPurchases } from './state.js';
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';
import { migrateState, hydrateSlotsStoreFromCloud, buildCloudSavePayload, saveToSlot } from './saveSlotManager.js';
import { resolveAdState, onVipPurchased } from './adManager.js';
import {
    renderDeathScreen,
    renderLifeDashboard,
    renderCharCreation,
    addLog
} from './lazyActions.js';

state.gameState = null;
const API_URL = '/api'
let _saveDebounceTimer = null;
let _isSaveInFlight = false;
let _hasPendingSave = false;

//updates game info
export async function updateGameInfo(dbUser, options = {}) {
    const forceCloud = options.forceCloud || false;
    const verifiedPacks = Array.isArray(options.verifiedPacks) ? options.verifiedPacks.filter(Boolean) : [];
    console.log("Updating game state from DB...");
    let rawData = dbUser.game_data || {};
    if (typeof rawData === 'string') {
        try { rawData = JSON.parse(rawData); } catch (e) {}
    }

    // Authoritative entitlement hydration from server (merging any pack verified during current checkout session)
    const serverPurchases = rawData.user?.purchases || rawData.purchases;
    if (Array.isArray(serverPurchases)) {
        const mergedPurchases = verifiedPacks.length > 0
            ? Array.from(new Set([...serverPurchases, ...verifiedPacks]))
            : serverPurchases;
        setVerifiedPurchases(mergedPurchases);
        resolveAdState(mergedPurchases);
    } else if (verifiedPacks.length > 0) {
        setVerifiedPurchases(verifiedPacks);
        resolveAdState(verifiedPacks);
    } else {
        resolveAdState([]);
    }

    // Hydrate all slots into localStorage store from cloud payload
    const store = hydrateSlotsStoreFromCloud(rawData, forceCloud);

    // Extract active slot data
    const activeSlotId = store.activeSlotId || rawData.activeSlotId || rawData._slotId || 'slot_1';
    const activeSlotData = store.slots[activeSlotId]?.data;
    const fallbackData = (rawData.user || rawData.stats || rawData.username || rawData.name) ? rawData : null;
    const data = activeSlotData || fallbackData || store.slots[Object.keys(store.slots)[0]]?.data;

    state.userAuthId = dbUser.auth0_id;
    state.userEmail = dbUser.email;

    if (data) {
        state.gameState = migrateState(data);
        if (state.gameState) {
            state.gameState._slotId = activeSlotId;
        }
        if (state.gameState?.user) {
            GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
        }
        // Clean up stale guest save on successful authenticated session
        if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
            Utils.guestStorage.clearSave();
        }
        try {
            localStorage.removeItem('life_game_save');
        } catch (e) {}
        // If local progress was newer than cloud data, sync to cloud immediately (unless forceCloud was specified)
        if (!forceCloud && store?._needsCloudSync && state.gameState.user) {
            console.log("Local progress is newer than cloud database. Synchronizing to cloud...");
            saveGame(true);
        }
    }

    // Render
    if (state.gameState?.user?.lifeStatus === "Deceased") {
        console.log("Dead character detected. Locking to death screen.");
        const cause = state.gameState.user.deathCause || "natural causes";
        if (typeof renderDeathScreen === "function") {
            await renderDeathScreen(state.gameState.user, cause);
        }
    } else if (state.gameState?.user && typeof renderLifeDashboard === "function") {
        await renderLifeDashboard(state.gameState); 
    } else if (typeof renderCharCreation === "function") {
        console.log("No valid character state found in save. Directing to Character Creation.");
        await renderCharCreation();
    } else {
        console.error("❌ renderLifeDashboard function not found!");
    }

    console.log("✅ Game Loaded & Ready");
}

//Loads and renders the game
export const loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username || userData.name);
    state.gameState = migrateState({ user: userData });
    if (state.gameState?.user) {
        GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
    }
    //.addLog function contains the renderLifeDashboard call
    addLog(`Born in ${state.gameState.user.city}. Welcome to the world!`, 'good');
};

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);

/**
 * Internal executor that performs the cloud network request with inflight queueing.
 */
async function _executeCloudSave() {
    if (!state.userAuthId || !state.gameState || !state.gameState.user) {
        return false;
    }

    if (_isSaveInFlight) {
        _hasPendingSave = true;
        return true;
    }

    _isSaveInFlight = true;
    _hasPendingSave = false;

    const activeSlotId = state.gameState._slotId || 'slot_1';
    const cloudGameData = buildCloudSavePayload(state.gameState);

    const payload = {
        auth0_id: state.userAuthId,
        email: state.userEmail,
        slotId: activeSlotId,
        game_data: cloudGameData
    };

    let authToken = '';
    try {
        authToken = await getAuthToken();
    } catch (e) {
        console.warn('Could not get auth token for cloud save:', e);
    }

    let success = false;
    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            keepalive: true,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Save Complete!");
            success = true;
        } else {
            console.error("❌ Save Failed:", await response.text());
        }
    } catch (e) {
        console.error("Network Error:", e);
    } finally {
        _isSaveInFlight = false;
        if (_hasPendingSave) {
            _hasPendingSave = false;
            return await _executeCloudSave();
        }
    }

    return success;
}

/**
 * Saves active game state locally to active slot immediately, and synchronizes with cloud.
 * Supports debounced non-blocking calls (default during gameplay/ageUp) and immediate execution.
 * @param {boolean} [immediate=false] - If true, bypasses debounce and synchronizes to cloud immediately.
 * @returns {Promise<boolean>}
 */
export async function saveGame(immediate = false) {
    // 1. Immediate local persistence to slots store (0ms latency guarantee)
    if (state.gameState && state.gameState.user) {
        saveToSlot();
    }

    // In test environment, skip cloud network unless fetch is explicitly mocked
    if (isTestEnv && !(typeof globalThis.fetch === 'function' && (globalThis.fetch._isMockFunction || globalThis.fetch.mock !== undefined))) {
        return true;
    }

    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!state.userAuthId) {
        console.log("⚠️ Guest mode. Saved locally.");
        return true;
    }
    if (!state.gameState || !state.gameState.user) {
        console.error("⚠️ Game state not ready. Save skipped.");
        return false;
    }

    if (!immediate) {
        // Trailing-edge debounce: reset timer and schedule cloud sync in 400ms
        if (_saveDebounceTimer) {
            clearTimeout(_saveDebounceTimer);
        }
        return new Promise(resolve => {
            _saveDebounceTimer = setTimeout(async () => {
                _saveDebounceTimer = null;
                const result = await _executeCloudSave();
                resolve(result);
            }, 400);
        });
    }

    // Immediate execution: cancel pending debounce timer and sync now
    if (_saveDebounceTimer) {
        clearTimeout(_saveDebounceTimer);
        _saveDebounceTimer = null;
    }
    return await _executeCloudSave();
}

/**
 * Flushes any pending debounced save immediately (e.g. window unload, visibility change).
 */
export async function flushPendingSave() {
    if (_saveDebounceTimer) {
        clearTimeout(_saveDebounceTimer);
        _saveDebounceTimer = null;
    }
    if (state.gameState && state.gameState.user) {
        saveToSlot();
        if (state.userAuthId) {
            return await _executeCloudSave();
        }
    }
    return true;
}

// Attach to window so it is globally accessible
if (typeof window !== 'undefined') {
    window.saveGame = saveGame;
    window.flushPendingSave = flushPendingSave;
    window.renderLifeDashboard = renderLifeDashboard;
    window.renderCharCreation = renderCharCreation;
    window.addEventListener('beforeunload', () => flushPendingSave());
    window.addEventListener('pagehide', () => flushPendingSave());
}

/**
 * Syncs purchases from the user_purchases database table into the client state.
 * Handles the Stripe webhook race condition by retrying if an expected pack is missing.
 * @param {string|null} expectedPackId - If returning from Stripe checkout, the pack_id to wait for.
 * @param {boolean} showNotification - Whether to show a success modal to the user.
 */
export async function syncPurchasesFromCloud(expectedPackId = null, showNotification = false) {
    if (!state.userAuthId || !state.auth0Client) return;

    const maxRetries = expectedPackId ? 4 : 1;
    const retryDelay = 2500; // ms between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const authToken = await getAuthToken();
            const response = await fetch('/api/getPurchases', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                const serverPurchases = Array.isArray(data.purchases) ? data.purchases : [];
                const verifiedPurchases = (expectedPackId && !serverPurchases.includes(expectedPackId))
                    ? [...serverPurchases, expectedPackId]
                    : serverPurchases;
                const before = (state.verifiedPurchases || []).length;
                setVerifiedPurchases(verifiedPurchases);
                try {
                    localStorage.setItem('life_game_purchases', JSON.stringify(verifiedPurchases));
                } catch (e) {}
                resolveAdState(verifiedPurchases);
                const newCount = verifiedPurchases.length - before;

                // If we're waiting for a specific pack and it's now present on the server, or we're not waiting for anything
                if (!expectedPackId || serverPurchases.includes(expectedPackId)) {
                    if (newCount > 0 && showNotification) {
                        UI.showModal("Purchase Activated!", `${newCount} new pack(s) have been unlocked and synced to your account.`);
                    }
                    console.log(`Purchase sync complete (attempt ${attempt}): ${verifiedPurchases.length} total packs.`);
                    return;
                }
            }
        } catch (err) {
            console.warn(`Purchase sync attempt ${attempt} failed:`, err);
        }

        // If we're waiting for a specific pack and haven't found it, wait and retry
        if (attempt < maxRetries && expectedPackId) {
            console.log(`Pack "${expectedPackId}" not found yet. Retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    // Final fallback: even if the expected pack wasn't found
    if (expectedPackId && showNotification) {
        UI.showModal("Purchase Processing", "Your payment was received! If your pack isn't active yet, use 'Restore Purchases' in the Store in a moment.");
    }
}

/**
 * Renders a celebratory confirmation modal when a player returns from a successful Stripe checkout.
 * @param {string} packId
 */
export async function showPurchaseSuccessModal(packId) {
    let pack = null;
    try {
        const storeMod = await import('../features/store/storeScreen.js');
        if (storeMod && Array.isArray(storeMod.STORE_PACKS)) {
            pack = storeMod.STORE_PACKS.find(p => p.id === packId);
        }
    } catch (e) {}

    if (packId === 'vip_supporter') {
        onVipPurchased();
    }

    const title = pack?.title || (packId ? packId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Expansion Pack');
    const icon = pack?.icon || 'fa-gem text-amber-400';
    const desc = packId === 'vip_supporter' 
        ? '⭐ VIP Supporter — Ad-Free Active. Your 100% ad-free experience is now active.'
        : (pack?.desc || 'Your purchase was successful and your new features are now active on your account.');

    // Action button customization based on pack
    let actionBtnHtml = '';
    if (packId === 'instant_diplomas') {
        actionBtnHtml = `
            <button data-action="renderInstantDiplomaHub" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                <i class="fas fa-graduation-cap"></i> Open Instant Diploma Hub
            </button>
        `;
    } else if (packId === 'vip_supporter') {
        actionBtnHtml = `
            <button data-action="renderVipLoungeModal" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                <i class="fas fa-crown"></i> Open VIP Lounge
            </button>
        `;
    } else if (packId === 'god_mode') {
        actionBtnHtml = `
            <button data-action="openGodModeHubModal" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                <i class="fas fa-bolt"></i> Open God Mode Editor
            </button>
        `;
    } else if (packId === 'time_machine') {
        actionBtnHtml = `
            <button data-action="openSaveSlotManager" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                <i class="fas fa-hourglass-half"></i> Open Time Machine Slots
            </button>
        `;
    } else if (packId === 'mafia_syndicate' || packId === 'mafia_expansion') {
        actionBtnHtml = `
            <button data-action="renderCrimeDashboard" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                <i class="fas fa-user-ninja"></i> Open Underworld Hub
            </button>
        `;
    } else if (packId === 'athlete_pack') {
        actionBtnHtml = `
            <button data-action="renderActivities" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                <i class="fas fa-football-ball"></i> Open Pro Sports Hub
            </button>
        `;
    }

    const modalContent = `
        <div class="space-y-4 text-center py-2">
            <!-- Celebratory Top Badge -->
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-3xl text-white mx-auto shadow-xl shadow-emerald-900/30">
                <i class="fas fa-check-circle"></i>
            </div>

            <div>
                <div class="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <i class="fas fa-shield-alt"></i> Payment Confirmed
                </div>
                <h3 class="text-2xl font-black text-white tracking-wide">
                    ${title} Unlocked!
                </h3>
                <p class="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                    ${desc}
                </p>
            </div>

            <div class="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-xl text-left flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-white truncate">${title}</div>
                    <div class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <i class="fas fa-lock-open text-[9px]"></i> Permanently Active
                    </div>
                </div>
            </div>

            <div class="space-y-2 pt-1">
                ${actionBtnHtml}
                <button data-action="hideModal" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition">
                    Continue Playing
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "",
        content: modalContent,
        confirmText: null,
        cancelText: null
    });
}

/**
 * Loads cloud save state for an authenticated user with explicit status distinction.
 * Distinguishes between:
 * - 'success': Cloud load succeeded and returned valid character save
 * - 'no_save': Account exists or 404, but has no active save file
 * - 'auth_error': 401/403 session expired or invalid
 * - 'rate_limited': 429 rate limit reached
 * - 'network_error': 5xx or fetch network drop
 * 
 * @param {Object} user - Auth0 user object
 * @returns {Promise<{ status: string, dbUser?: Object, error?: string, statusCode?: number }>}
 */
export async function fetchCloudSave(user) {
    if (!user || !user.sub) {
        return { status: 'auth_error', statusCode: 401, error: 'User profile missing' };
    }

    const sub = encodeURIComponent(user.sub);
    let authToken = await getAuthToken(false);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            if (!authToken) {
                authToken = await getAuthToken(true);
            }
            if (!authToken) {
                return { status: 'auth_error', statusCode: 401, error: 'Authentication token unavailable' };
            }

            const response = await fetch(`/api/load?auth0_id=${sub}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            // Handle 200 OK
            if (response.ok) {
                const data = await response.json();
                let parsedGameData = data?.game_data;
                if (typeof parsedGameData === 'string') {
                    try { parsedGameData = JSON.parse(parsedGameData); } catch (e) {}
                }
                if (parsedGameData && typeof parsedGameData === 'object' && Object.keys(parsedGameData).length > 0) {
                    const hasChar = parsedGameData.user || parsedGameData.stats || parsedGameData.name || parsedGameData.username ||
                        (parsedGameData.slots && typeof parsedGameData.slots === 'object' && Object.values(parsedGameData.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                    if (hasChar) {
                        return { status: 'success', dbUser: { ...data, game_data: parsedGameData } };
                    }
                }
                // Account exists in DB but game_data has no active character
                return { status: 'no_save', dbUser: data };
            }

            // Handle 404 Not Found (New player) -> Check /api/login in sync mode
            if (response.status === 404) {
                try {
                    const fallbackResp = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            email: user.email,
                            username: user.nickname || 'Player',
                            gender: 'male',
                            city: 'New York'
                        })
                    });
                    if (fallbackResp.ok) {
                        const fallbackData = await fallbackResp.json();
                        let parsedFallback = fallbackData?.game_data;
                        if (typeof parsedFallback === 'string') {
                            try { parsedFallback = JSON.parse(parsedFallback); } catch (e) {}
                        }
                        if (parsedFallback && typeof parsedFallback === 'object' && Object.keys(parsedFallback).length > 0) {
                            const hasChar = parsedFallback.user || parsedFallback.stats || parsedFallback.name || parsedFallback.username ||
                                (parsedFallback.slots && typeof parsedFallback.slots === 'object' && Object.values(parsedFallback.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                            if (hasChar) {
                                return { status: 'success', dbUser: { ...fallbackData, game_data: parsedFallback } };
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Login fallback initialization skipped:", e);
                }
                return { status: 'no_save' };
            }

            // Handle 401/403 Unauthorized -> Force silent refresh and retry once
            if (response.status === 401 || response.status === 403) {
                console.warn(`[CloudSave] 401/403 received from /api/load (attempt ${attempts}). Force-refreshing token...`);
                authToken = await getAuthToken(true);
                if (!authToken) {
                    return { status: 'auth_error', statusCode: response.status, error: 'Session expired. Please sign in again.' };
                }
                // Retry request once with refreshed token
                const retryRes = await fetch(`/api/load?auth0_id=${sub}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (retryRes.ok) {
                    const data = await retryRes.json();
                    let parsedGameData = data?.game_data;
                    if (typeof parsedGameData === 'string') {
                        try { parsedGameData = JSON.parse(parsedGameData); } catch (e) {}
                    }
                    if (parsedGameData && typeof parsedGameData === 'object' && Object.keys(parsedGameData).length > 0) {
                        const hasChar = parsedGameData.user || parsedGameData.stats || parsedGameData.name || parsedGameData.username ||
                            (parsedGameData.slots && typeof parsedGameData.slots === 'object' && Object.values(parsedGameData.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                        if (hasChar) {
                            return { status: 'success', dbUser: { ...data, game_data: parsedGameData } };
                        }
                    }
                    return { status: 'no_save', dbUser: data };
                }
                if (retryRes.status === 401 || retryRes.status === 403) {
                    return { status: 'auth_error', statusCode: retryRes.status, error: 'Authentication session expired. Please sign in again.' };
                }
                if (retryRes.status === 429) {
                    return { status: 'rate_limited', statusCode: 429, error: 'Too many requests. Please wait a moment.' };
                }
                return { status: 'network_error', statusCode: retryRes.status, error: 'Server temporarily unavailable.' };
            }

            // Handle 429 Rate Limit
            if (response.status === 429) {
                console.warn(`[CloudSave] 429 Rate limited on attempt ${attempts}.`);
                if (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                return { status: 'rate_limited', statusCode: 429, error: 'Rate limit exceeded. Please wait a moment and retry.' };
            }

            // Handle 5xx Server Errors
            if (response.status >= 500) {
                console.warn(`[CloudSave] 5xx Server error (${response.status}) on attempt ${attempts}.`);
                if (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 600 * attempts));
                    continue;
                }
                return { status: 'network_error', statusCode: response.status, error: 'Server error encountered while retrieving save data.' };
            }

        } catch (fetchErr) {
            console.error(`[CloudSave] Network error checking cloud save (attempt ${attempts}):`, fetchErr);
            if (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 600 * attempts));
                continue;
            }
            return { status: 'network_error', error: fetchErr.message || 'Network connection failed' };
        }
    }

    return { status: 'network_error', error: 'Failed to connect to cloud service after multiple attempts.' };
}

/**
 * Renders a recoverable error modal when cloud save loading fails for an authenticated player.
 * Prevents accidental Character Creation routing that could cause permanent cloud save loss.
 */
export function showCloudLoadRecoveryModal({ title, message, errorType = 'network', onRetry, onLogin }) {
    if (typeof UI !== 'undefined' && typeof UI.showCustomModal === 'function') {
        const iconClass = errorType === 'auth' ? 'fa-user-lock text-amber-400' : 'fa-wifi text-red-400';
        const bgIconClass = errorType === 'auth' ? 'bg-amber-950/60 border-amber-500/40' : 'bg-red-950/60 border-red-500/40';

        UI.showCustomModal({
            title: title || (errorType === 'auth' ? "Session Expired" : "Unable to Load Cloud Save"),
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${bgIconClass} border flex items-center justify-center text-lg shrink-0">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">${Utils.escapeHtml(title || "Cloud Save Sync")}</div>
                            <div class="text-xs text-slate-400 font-medium">Your account data is safe</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        ${Utils.escapeHtml(message || "We encountered an issue retrieving your cloud save data. To protect your characters from being overwritten, please retry or sign in again.")}
                    </p>
                </div>
            `,
            confirmText: "Retry Connection",
            cancelText: "Sign In Again",
            onConfirm: () => {
                if (typeof onRetry === 'function') onRetry();
            },
            onCancel: () => {
                if (typeof onLogin === 'function') onLogin();
            }
        });
    }
}

// --- RESET GAME PIPELINE ---
export async function resetGame() {
    console.log("Resetting game state...");
    if (typeof UI !== 'undefined' && typeof UI.closeAllModals === 'function') {
        UI.closeAllModals();
    }
    UI.resetHeader();

    UI.renderScreen(`
        <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-circle-notch fa-spin text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-2xl font-bold text-white mb-2">Obliterating the Past...</h1>
            <p class="text-slate-400">Preparing your next life.</p>
        </div>
    `);

    // 1. Destroy local state & wipe all local save keys
    state.gameState = null;
    try {
        localStorage.removeItem('life_game_slots');
        localStorage.removeItem('life_game_save');
    } catch (e) {}
    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
        Utils.guestStorage.clearSave();
    }

    // 2. Handle Guest Reset
    if (!state.userAuthId) {
        console.log("Guest save wiped.");
        
        // Route guests back to login so they can choose to authenticate or play as guest again
        if (typeof renderLoginScreen === "function") {
            renderLoginScreen();
            return;
        }
    } 
    // 3. Handle Authenticated User Reset
    else {
        console.log("Wiping Cloud Save...");
        try {
            let authToken = '';
            try {
                authToken = await getAuthToken();
            } catch (e) {}

            await fetch('/api/saveGame', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    auth0_id: state.userAuthId,
                    email: state.userEmail,
                    game_data: {} // Overwrites the DB with empty data, clearing the "Deceased" lock
                })
            });
        } catch (e) {
            console.error("Failed to reset cloud save:", e);
        }
    }

    // 4. Route authenticated users to Character Creation
    if (typeof renderCharCreation === "function") {
        renderCharCreation();
    }
};
