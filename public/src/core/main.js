import { login, configureAuth, getAuthToken } from '../auth/auth.js';
import { renderLoginScreen } from '../auth/loginScreen.js';
import { state, setVerifiedPurchases } from './state.js';
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';
import { migrateState, getSlotsStore } from './saveSlotManager.js';
import { resolveAdState } from './adManager.js';
import { preloadForContext, attachIntentPreloaders } from './moduleLoader.js';
import {
    applyTheme,
    renderLifeDashboard,
    renderDeathScreen,
    renderCharCreation
} from './lazyActions.js';
import {
    updateGameInfo,
    saveGame,
    syncPurchasesFromCloud,
    showPurchaseSuccessModal,
    fetchCloudSave,
    showCloudLoadRecoveryModal
} from './cloudSync.js';
import './actionRouter.js';

export {
    MAJORS,
    CAREER_TRACKS,
    SPECIAL_CAREER_TRACKS,
    PART_TIME_JOBS,
    INDUSTRIES,
    SUPPLIERS
} from './constants.js';

export * from './lazyActions.js';
export {
    updateGameInfo,
    loadAndRenderGame,
    saveGame,
    flushPendingSave,
    syncPurchasesFromCloud,
    showPurchaseSuccessModal,
    fetchCloudSave,
    showCloudLoadRecoveryModal,
    resetGame
} from './cloudSync.js';
export {
    routeHandlers,
    DEATH_ACTION_WHITELIST,
    FUNERAL_ACTION_WHITELIST,
    parseActionArgs
} from './actionRouter.js';

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);

// --- Unified Entry Point ---
export const onload = async () => {
    try {
        // Wrap this in a robust try/catch to silence SDK errors
        await configureAuth().catch(err => {
            console.warn("Auth0 check skipped or blocked (Guest Mode active).", err);
        }); 
        console.log("Auth0 Configured.");
    } catch (e) {
        console.warn("Auth Initialization warning:", e);
    }

    attachIntentPreloaders();

    // Ensure active theme is synchronized into the DOM and UI
    try {
        if (typeof applyTheme === 'function') {
            applyTheme().catch(err => console.warn("Theme initialization warning:", err));
        }
    } catch (themeErr) {
        console.warn("Theme initialization warning:", themeErr);
    }

    // Continue to game initialization regardless of Auth0 errors
    await initGame();

    if (state.gameState) {
        preloadForContext(state.gameState);
    }
};

// --- Updated Game Initializer ---
export async function initGame() {
    console.log("Initializing Game Logic...");

    // Check for Stripe purchase return parameters early and sanitize URL bar immediately
    const urlParams = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const purchaseSuccess = urlParams.get('purchase_success');
    const purchaseCancelled = urlParams.get('purchase_cancelled');
    const checkoutSessionId = urlParams.get('session_id');
    const purchasedPackId = urlParams.get('pack_id');
    let verifiedPackId = null;

    if (typeof window !== 'undefined' && window.history && (purchaseSuccess || purchaseCancelled || checkoutSessionId || purchasedPackId)) {
        window.history.replaceState({}, document.title, window.location.pathname || '/');
    }

    // 1. Check Auth0 Status
    const isAuthenticated = state.auth0Client ? await state.auth0Client.isAuthenticated() : false;

    if (isAuthenticated) {
        // Render Loading Screen while user details and cloud save are being fetched
        if (typeof UI !== 'undefined' && UI.renderLoadingScreen) {
            UI.renderLoadingScreen("Syncing Account...", "Fetching your cloud save data...");
        }

        // User is logged in! 
        const user = await state.auth0Client.getUser();
        console.log(`Welcome back, ${user.nickname} (${user.sub})`);
        
        // Save ID immediately so we can use it
        state.userAuthId = user.sub;
        state.userEmail = user.email;

        // Check for active guest save
        const guestSave = Utils.guestStorage.loadGame();
        const hasGuestSave = guestSave && guestSave.user && guestSave.user.lifeStatus !== "Deceased";

        // Verify Stripe purchase server-side strictly if session_id is present
        if (checkoutSessionId) {
            try {
                const authToken = await getAuthToken();
                const headers = { 'Content-Type': 'application/json' };
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const verifyRes = await fetch('/api/verify-checkout-session', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ sessionId: checkoutSessionId })
                });

                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    if (verifyData.verified && verifyData.packId) {
                        verifiedPackId = verifyData.packId;
                        let localP = [];
                        try {
                            const stored = localStorage.getItem('life_game_purchases');
                            if (stored) localP = JSON.parse(stored);
                        } catch (e) {}
                        if (!localP.includes(verifiedPackId)) {
                            localP.push(verifiedPackId);
                            try { localStorage.setItem('life_game_purchases', JSON.stringify(localP)); } catch (e) {}
                        }
                        const currentVerified = Array.isArray(state.verifiedPurchases) ? [...state.verifiedPurchases] : [];
                        if (!currentVerified.includes(verifiedPackId)) {
                            currentVerified.push(verifiedPackId);
                        }
                        setVerifiedPurchases(currentVerified);
                        resolveAdState(currentVerified);
                    }
                }
            } catch (vErr) {
                console.error("Stripe session verification failed:", vErr);
            }
        }

        const hasCheckoutReturn = Boolean(verifiedPackId || purchaseSuccess === 'true' || purchaseCancelled === 'true');

        const finalizePostCheckoutFlow = async () => {
            if (verifiedPackId) {
                const currentVerified = Array.isArray(state.verifiedPurchases) ? [...state.verifiedPurchases] : [];
                if (!currentVerified.includes(verifiedPackId)) {
                    currentVerified.push(verifiedPackId);
                }
                setVerifiedPurchases(currentVerified);
                try {
                    localStorage.setItem('life_game_purchases', JSON.stringify(currentVerified));
                } catch (e) {}
                resolveAdState(currentVerified);

                if (state.gameState?.user) {
                    if (!Array.isArray(state.gameState.user.purchases)) state.gameState.user.purchases = [];
                    if (!state.gameState.user.purchases.includes(verifiedPackId)) {
                        state.gameState.user.purchases.push(verifiedPackId);
                    }
                    await saveGame(true);
                    if (state.gameState.user.lifeStatus !== "Deceased" && typeof renderLifeDashboard === "function") {
                        await renderLifeDashboard(state.gameState);
                    }
                }
                console.log(`Verified Stripe checkout completed for pack: ${verifiedPackId}`);
                await showPurchaseSuccessModal(verifiedPackId);
                await syncPurchasesFromCloud(verifiedPackId, false);
            } else if (purchaseSuccess === 'true') {
                UI.showModal("Purchase Unverified", "We could not verify your payment session with Stripe. If you completed a purchase, please use 'Restore Purchases' in the Store or contact support.");
                await syncPurchasesFromCloud(null, false);
            } else if (purchaseCancelled === 'true') {
                UI.showModal("Checkout Cancelled", "Your payment session was cancelled. No charges were made.");
            } else if (state.gameState?.user) {
                // Normal login — silently sync purchases in background (no retry, no notification)
                syncPurchasesFromCloud(null, false);
            }
        };

        // Fetch cloud save state with explicit error categorization
        const cloudResult = await fetchCloudSave(user);
        const dbUser = (cloudResult.status === 'success') ? cloudResult.dbUser : null;

        // SCENARIO 1: Both Guest Save AND Cloud Save exist -> CONFLICT RESOLUTION MODAL
        if (hasGuestSave && dbUser) {
            console.log("Conflict detected: Active guest character AND existing cloud save found.");
            
            const cloudUser = dbUser.game_data.user || dbUser.game_data;
            const cloudName = Utils.escapeHtml(cloudUser.username || cloudUser.name || "Account Character");
            const cloudAge = dbUser.game_data.stats?.age || cloudUser.age || 0;
            
            const guestName = Utils.escapeHtml(guestSave.user.username || guestSave.user.name || "Guest Character");
            const guestAge = guestSave.user.age || 0;

            const modalMsg = `
                <div class="space-y-3 text-left text-sm">
                    <p class="text-slate-300">An existing character was found on your account, as well as an active guest character.</p>
                    
                    <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700 space-y-1">
                        <div class="font-bold text-blue-400 text-xs uppercase tracking-wider">Cloud Save</div>
                        <div class="text-white font-semibold">${cloudName} (Age ${cloudAge})</div>
                    </div>
                    
                    <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700 space-y-1">
                        <div class="font-bold text-amber-400 text-xs uppercase tracking-wider">Current Guest Character</div>
                        <div class="text-white font-semibold">${guestName} (Age ${guestAge})</div>
                    </div>
                    
                    <p class="text-xs text-slate-400">Which character would you like to keep?</p>
                </div>
            `;

            UI.showConfirm(
                "Save Conflict Detected",
                modalMsg,
                "Use Guest Character",
                async () => {
                    console.log("User chose Guest Character. Overwriting Cloud save...");
                    state.gameState = migrateState(guestSave);
                    if (state.gameState?.user) {
                        GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                    }
                    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                        Utils.guestStorage.clearSave();
                    }
                    try {
                        localStorage.removeItem('life_game_save');
                    } catch (e) {}
                    await saveGame(true);
                    renderLifeDashboard(state.gameState);
                    if (hasCheckoutReturn) {
                        await finalizePostCheckoutFlow();
                    } else {
                        UI.showModal("Character Saved!", `Your guest character (${guestName}) has been saved to your account.`);
                        syncPurchasesFromCloud(null, false);
                    }
                },
                "Keep Cloud Character",
                async () => {
                    console.log("User chose Account Character. Loading Cloud save...");
                    // 1. Completely purge ALL local guest storage data
                    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                        Utils.guestStorage.clearSave();
                    }
                    try {
                        localStorage.removeItem('life_game_save');
                        localStorage.removeItem('life_game_slots');
                    } catch (e) {}
                    UI.hideModal();
                    // 2. Load cloud save with forceCloud = true so discarded local guest slots never override cloud save
                    await updateGameInfo(dbUser, { forceCloud: true, verifiedPacks: verifiedPackId ? [verifiedPackId] : [] });
                    if (hasCheckoutReturn) {
                        await finalizePostCheckoutFlow();
                    } else {
                        UI.showModal("Cloud Save Loaded", `Welcome back! Loaded your account character (${cloudName}).`);
                        syncPurchasesFromCloud(null, false);
                    }
                }
            );
            return;
        }

        // SCENARIO 2: Guest Save exists, and Cloud Save is confirmed absent -> Auto Migration
        if (hasGuestSave && cloudResult.status === 'no_save') {
            console.log("Migrating active guest character to logged-in cloud account...");
            state.gameState = migrateState(guestSave);
            if (state.gameState?.user) {
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
            }
            
            // Clean up guest storage keys before saving to cloud
            if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                Utils.guestStorage.clearSave();
            }
            try {
                localStorage.removeItem('life_game_save');
            } catch (e) {}

            await saveGame(true);

            if (typeof renderLifeDashboard === "function") {
                await renderLifeDashboard(state.gameState);
                if (!hasCheckoutReturn) {
                    UI.showModal("Character Saved!", `Welcome ${Utils.escapeHtml(user.nickname || 'Player')}! Your character has been saved to your account.`);
                }
            }
            await finalizePostCheckoutFlow();
            return;
        }

        // SCENARIO 3: Cloud Save cleanly loaded -> Load Cloud Save into UI
        if (cloudResult.status === 'success' && dbUser) {
            await updateGameInfo(dbUser, { verifiedPacks: verifiedPackId ? [verifiedPackId] : [] });
        } else if (cloudResult.status === 'no_save') {
            // SCENARIO 4: Legitimate clean account with no cloud save -> Check local slot recovery or route to Character Creation
            let localRecovered = null;
            let recoveredSlotId = 'slot_1';
            try {
                const store = getSlotsStore();
                const activeId = store.activeSlotId || 'slot_1';
                const activeSlot = store.slots[activeId] || Object.values(store.slots)[0];
                if (activeSlot?.data?.user) {
                    localRecovered = migrateState(activeSlot.data);
                    recoveredSlotId = activeId;
                    if (localRecovered) localRecovered._slotId = activeId;
                }
            } catch (e) {}

            // Also check legacy single save key 'life_game_save'
            if (!localRecovered) {
                try {
                    const legacy = localStorage.getItem('life_game_save');
                    if (legacy) {
                        const parsed = JSON.parse(legacy);
                        if (parsed && (parsed.user || parsed.name || parsed.stats)) {
                            const migrated = migrateState(parsed);
                            if (migrated && migrated.user) {
                                localRecovered = migrated;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (localRecovered && localRecovered.user) {
                console.log(`Recovered active character (${localRecovered.user.username}) from local slot (${recoveredSlotId}). Syncing to cloud...`);
                state.gameState = localRecovered;
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                saveGame(true);
                if (state.gameState.user.lifeStatus === "Deceased") {
                    console.log("Dead character recovered from local slot. Locking to death screen.");
                    const cause = state.gameState.user.deathCause || "natural causes";
                    if (typeof renderDeathScreen === "function") {
                        await renderDeathScreen(state.gameState.user, cause);
                    }
                } else if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
                }
            } else {
                console.log("No save file found on new account. Starting Character Creation.");
                await renderCharCreation();
            }
        } else {
            // SCENARIO 5: Cloud load FAILED (auth_error, rate_limited, network_error)
            console.warn(`[InitGame] Cloud load failed with status: ${cloudResult.status} (${cloudResult.error}). Checking local recovery...`);

            // Try local recovery from slots store, active guest save, or legacy save
            let localRecovered = null;
            let recoveredSlotId = 'slot_1';
            try {
                const store = getSlotsStore();
                const activeId = store.activeSlotId || 'slot_1';
                const activeSlot = store.slots[activeId] || (store.slots && Object.values(store.slots)[0]);
                if (activeSlot?.data?.user) {
                    localRecovered = migrateState(activeSlot.data);
                    recoveredSlotId = activeId;
                    if (localRecovered) localRecovered._slotId = activeId;
                }
            } catch (e) {}

            if (!localRecovered && hasGuestSave) {
                localRecovered = migrateState(guestSave);
            }

            if (!localRecovered) {
                try {
                    const legacy = localStorage.getItem('life_game_save');
                    if (legacy) {
                        const parsed = JSON.parse(legacy);
                        if (parsed && (parsed.user || parsed.name || parsed.stats)) {
                            const migrated = migrateState(parsed);
                            if (migrated && migrated.user) {
                                localRecovered = migrated;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (localRecovered && localRecovered.user) {
                console.log(`Playing from local cached slot (${recoveredSlotId}) due to cloud load failure.`);
                state.gameState = localRecovered;
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
                }
                if (cloudResult.status === 'auth_error') {
                    UI.showModal("Session Notice", "Your session has expired. You are playing from local save cache. Please log in again to sync progress to cloud.");
                } else {
                    UI.showModal("Offline Notice", "Could not connect to cloud sync service. Loaded character from local device storage.");
                }
            } else {
                // Cloud failed AND local recovery failed: NEVER boot to Character Creation!
                const isAuth = cloudResult.status === 'auth_error';
                const title = isAuth ? "Session Expired" : "Unable to Load Cloud Save";
                const message = isAuth
                    ? "Your login session could not be verified to fetch your cloud save. Please sign in again or retry to continue your character."
                    : (cloudResult.status === 'rate_limited'
                        ? "Too many requests to the cloud service. Please wait a moment and click Retry."
                        : "A network error occurred while retrieving your cloud save. Please check your connection and retry.");

                showCloudLoadRecoveryModal({
                    title,
                    message,
                    errorType: isAuth ? 'auth' : (cloudResult.status === 'rate_limited' ? 'rate_limit' : 'network'),
                    onRetry: () => initGame(),
                    onLogin: () => login()
                });
            }
        }

        // Apply verified purchased pack to active user state immediately if verified
        await finalizePostCheckoutFlow();

    } else {
        // Guest Mode - Resolve ads for guest and check Multi-Save Slots Store first
        console.log("Guest mode detected.");
        resolveAdState([]);
        
        let loadedState = null;
        let activeSlotId = 'slot_1';

        try {
            const rawSlots = localStorage.getItem('life_game_slots');
            if (rawSlots) {
                const slotsStore = JSON.parse(rawSlots);
                activeSlotId = slotsStore.activeSlotId || 'slot_1';
                if (slotsStore.slots && slotsStore.slots[activeSlotId] && slotsStore.slots[activeSlotId].data) {
                    loadedState = migrateState(slotsStore.slots[activeSlotId].data);
                    if (loadedState) loadedState._slotId = activeSlotId;
                }
            }
        } catch (e) {}

        if (!loadedState) {
            const rawGuest = Utils.guestStorage.loadGame();
            if (rawGuest) {
                loadedState = migrateState(rawGuest);
                if (loadedState) loadedState._slotId = activeSlotId;
            }
        }
        
        if (loadedState && loadedState.user) {
            state.gameState = loadedState;
            GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);

            if (state.gameState.user.lifeStatus === "Deceased") {
                console.log("Guest character is deceased. Locking to death screen.");
                const cause = state.gameState.user.deathCause || "natural causes";
                if (typeof renderDeathScreen === "function") {
                    await renderDeathScreen(state.gameState.user, cause);
                }
            } else {
                console.log(`Loading active save slot (${loadedState._slotId}) from storage...`);
                if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
                } else {
                    console.error("renderLifeDashboard function not found!");
                }
            }
        } else {
            // No guest save - show login screen
            renderLoginScreen();
        }
    }
};

if (!isTestEnv && typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => onload());
    } else {
        onload();
    }
}
