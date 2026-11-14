import { state, hasPurchasedPack } from './state.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../ui/utils.js';
import { renderAvatar } from '../ui/avatarRenderer.js';
import {
    deepClone,
    sanitizeGameState,
    migrateState,
    isValidSlotId,
    isQuotaExceededError,
    attemptStoreCompaction
} from './stateMigration.js';

export {
    deepClone,
    sanitizeGameState,
    migrateState,
    isValidSlotId,
    isQuotaExceededError,
    attemptStoreCompaction
} from './stateMigration.js';

const buyPack = async (...args) => (await import('../features/store/storeScreen.js')).buyPack(...args);

const STORAGE_KEY = 'life_game_slots';

/**
 * Gets slots object from localStorage (with fallback migration for single save).
 */
export function getSlotsStore() {
    let store = { activeSlotId: 'slot_1', slots: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            store = sanitizeGameState(JSON.parse(raw)) || { activeSlotId: 'slot_1', slots: {} };
            
            // Clean up orphan slots or invalid/dangerous keys and migrate existing slots
            if (store.slots && typeof store.slots === 'object') {
                let changed = false;
                Object.keys(store.slots).forEach(key => {
                    if (['__proto__', 'constructor', 'prototype'].includes(key) || !isValidSlotId(key) || store.slots[key]?.data === undefined) {
                        delete store.slots[key];
                        changed = true;
                    } else if (store.slots[key]?.data) {
                        const migrated = migrateState(store.slots[key].data);
                        if (migrated) {
                            store.slots[key].data = migrated;
                        }
                    }
                });
                if (changed) persistSlotsStore(store);
            }
        }
    } catch (e) {
        console.error("Failed to parse save slots store:", e);
    }

    // Auto-migrate legacy single save if no slots exist yet
    if (!store.slots || Object.keys(store.slots).length === 0) {
        let legacySave = null;
        try {
            const legacyRaw = localStorage.getItem('life_game_save');
            if (legacyRaw) legacySave = JSON.parse(legacyRaw);
        } catch (e) {}

        const activeData = state.gameState || legacySave;
        if (activeData) {
            const migrated = migrateState(activeData);
            if (migrated) {
                const name = migrated.user?.username || migrated.user?.name || 'Main Life';
                store.slots['slot_1'] = {
                    id: 'slot_1',
                    name: name,
                    lastSaved: Date.now(),
                    data: deepClone(migrated)
                };
                store.activeSlotId = 'slot_1';
                persistSlotsStore(store);
            }
        }
    }

    if (!isValidSlotId(store.activeSlotId)) {
        store.activeSlotId = 'slot_1';
    }

    return store;
}

/**
 * Hydrates and synchronizes the save slots store from cloud game data.
 * Supports both multi-slot cloud payloads and legacy single-slot cloud saves.
 * @param {Object} cloudGameData - Raw game data from cloud DB
 * @param {boolean} [forceCloud=false] - If true, ignores local store and hydrates strictly from cloud
 */
export function hydrateSlotsStoreFromCloud(cloudGameData, forceCloud = false) {
    if (!cloudGameData || typeof cloudGameData !== 'object') {
        return getSlotsStore();
    }

    const localStore = forceCloud ? { activeSlotId: 'slot_1', slots: {} } : getSlotsStore();
    const cleanData = sanitizeGameState(cloudGameData);
    let store = { activeSlotId: 'slot_1', slots: {} };
    let needsCloudSync = false;

    // Case 1: Multi-slot cloud data with .slots object
    if (cleanData.slots && typeof cleanData.slots === 'object' && !Array.isArray(cleanData.slots)) {
        const cloudSlotKeys = Object.keys(cleanData.slots);
        cloudSlotKeys.forEach(key => {
            if (isValidSlotId(key)) {
                const cloudSlot = cleanData.slots[key];
                const localSlot = localStore.slots?.[key];

                if (cloudSlot && typeof cloudSlot === 'object') {
                    const cloudData = cloudSlot.data ? deepClone(sanitizeGameState(cloudSlot.data)) : null;
                    const cloudSaved = cloudSlot.lastSaved || 0;
                    const cloudAge = cloudData?.user?.age ?? -1;

                    const localData = localSlot?.data;
                    const localSaved = localSlot?.lastSaved || 0;
                    const localAge = localData?.user?.age ?? -1;

                    // If local slot has newer progress (higher age or more recent timestamp)
                    const isLocalNewer = !forceCloud && localData?.user &&
                        (localAge > cloudAge || (localAge === cloudAge && localSaved > cloudSaved) || (localSaved > cloudSaved && localAge >= cloudAge));

                    if (isLocalNewer) {
                        store.slots[key] = {
                            id: localSlot.id || key,
                            name: localSlot.name || cloudSlot.name || 'Life Save',
                            lastSaved: localSaved,
                            data: deepClone(localData)
                        };
                        needsCloudSync = true;
                    } else {
                        store.slots[key] = {
                            id: cloudSlot.id || key,
                            name: cloudSlot.name || 'Life Save',
                            lastSaved: cloudSaved || Date.now(),
                            data: cloudData
                        };
                    }
                }
            }
        });

        // Preserve any local-only slots that don't exist in cloud yet (e.g. newly created branches)
        if (!forceCloud && localStore.slots && typeof localStore.slots === 'object') {
            Object.keys(localStore.slots).forEach(localKey => {
                if (!store.slots[localKey] && isValidSlotId(localKey) && localStore.slots[localKey]?.data) {
                    store.slots[localKey] = deepClone(localStore.slots[localKey]);
                    needsCloudSync = true;
                }
            });
        }

        const targetActive = cleanData.activeSlotId || cleanData._slotId || localStore.activeSlotId;
        if (isValidSlotId(targetActive) && store.slots[targetActive]) {
            store.activeSlotId = targetActive;
        } else if (Object.keys(store.slots).length > 0) {
            store.activeSlotId = Object.keys(store.slots)[0];
        } else {
            store.activeSlotId = 'slot_1';
        }
    }

    // Case 2: Legacy single-slot save (or missing/empty slots object)
    if (Object.keys(store.slots).length === 0 && (cleanData.user || cleanData.stats || cleanData.name)) {
        const cloudUser = cleanData.user || cleanData;
        const cloudAge = cloudUser.age ?? -1;
        const localSlot = localStore.slots?.['slot_1'];
        const localData = localSlot?.data;
        const localAge = localData?.user?.age ?? -1;
        const localSaved = localSlot?.lastSaved || 0;

        const isLocalNewer = !forceCloud && localData?.user &&
            (localAge > cloudAge || (localAge === cloudAge && localSaved > Date.now() - 3600000));

        if (isLocalNewer) {
            store.slots['slot_1'] = deepClone(localSlot);
            needsCloudSync = true;
        } else {
            const name = cleanData.user?.username || cleanData.user?.name || cleanData.name || 'Main Life';
            store.slots['slot_1'] = {
                id: 'slot_1',
                name: name,
                lastSaved: Date.now(),
                data: deepClone(cleanData)
            };
        }
        store.activeSlotId = 'slot_1';
    }

    if (Object.keys(store.slots).length > 0) {
        persistSlotsStore(store);
    }

    store._needsCloudSync = forceCloud ? false : needsCloudSync;
    return store;
}

/**
 * Builds the complete multi-slot cloud save payload.
 * Encapsulates all save slots, the active slot ID, and top-level active character summary.
 */
export function buildCloudSavePayload(activeGameState = null) {
    const currentState = activeGameState || state.gameState;
    const store = getSlotsStore();

    if (currentState && currentState.user) {
        const activeSlotId = currentState._slotId || store.activeSlotId || 'slot_1';
        const targetId = isValidSlotId(activeSlotId) ? activeSlotId : 'slot_1';
        store.activeSlotId = targetId;
        currentState._slotId = targetId;

        const user = currentState.user;
        const defaultName = user.username || user.name || `Life (Age ${user.age || 0})`;
        const existingSlotName = store.slots[targetId]?.name || defaultName;

        store.slots[targetId] = {
            id: targetId,
            name: existingSlotName,
            lastSaved: Date.now(),
            data: deepClone(sanitizeGameState(currentState))
        };
        persistSlotsStore(store);
    }

    const activeSlot = store.slots[store.activeSlotId] || Object.values(store.slots)[0];
    const activeData = activeSlot?.data || currentState || {};
    const activeUser = activeData.user || currentState?.user || {};
    const activeSlotId = store.activeSlotId || 'slot_1';

    return {
        _slotId: activeSlotId,
        activeSlotId: activeSlotId,
        slots: store.slots,

        // The "Suitcase" - Contains active slot flags and top-level active character data
        user: activeUser,

        // The Lists
        history: activeData.lifeLog || currentState?.lifeLog || [],
        assets: activeData.assets || activeUser.assets || [],
        achievements: activeData.achievements || currentState?.achievements || {},

        // Time Machine snapshots (paid feature data)
        snapshots: activeData.snapshots || currentState?.snapshots || [],

        // Redundant top-level helpers for easier DB queries later
        bank: activeUser.money || 0,
        job: {
            title: activeUser.jobTitle || '',
            salary: activeUser.jobSalary || 0
        },
        stats: {
            age: activeUser.age || 0,
            health: activeUser.health ?? 100,
            happiness: activeUser.happiness ?? 100,
            smarts: activeUser.smarts ?? 50,
            looks: activeUser.looks ?? 50
        }
    };
}

let lastQuotaAlertTime = 0;

/**
 * Displays user-facing warning modal when local storage quota is completely exhausted.
 */
export function showQuotaExceededAlert() {
    const now = Date.now();
    if (now - lastQuotaAlertTime < 60000) return; // Throttle to max 1 alert per minute
    lastQuotaAlertTime = now;

    if (typeof UI !== 'undefined' && typeof UI.showCustomModal === 'function') {
        UI.showCustomModal({
            title: "Storage Quota Exceeded",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-red-950/40 p-3.5 rounded-xl border border-red-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-red-900/60 text-red-400 border border-red-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Browser Storage Full</div>
                            <div class="text-xs text-red-300 font-medium">Local save could not be completed</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Your device browser has run out of local storage space. To prevent losing your progress, please log in or create a free account to enable automatic <strong>Cloud Saves</strong>.
                    </p>
                </div>
            `,
            confirmText: "Log In / Cloud Save",
            cancelText: "Dismiss",
            onConfirm: () => {
                import('../auth/auth.js').then(m => {
                    if (m && typeof m.login === 'function') m.login();
                }).catch(() => {});
            }
        });
    }
}

/**
 * Persists slots store to localStorage with automatic compaction and error recovery.
 */
export function persistSlotsStore(store) {
    try {
        const sanitizedStore = sanitizeGameState(store);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedStore));
        return { success: true };
    } catch (err) {
        if (isQuotaExceededError(err)) {
            console.warn("Storage quota exceeded. Attempting auto-compaction...");
            const didCompact = attemptStoreCompaction(store);
            if (didCompact) {
                try {
                    const sanitizedCompactedStore = sanitizeGameState(store);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedCompactedStore));
                    console.log("Auto-compaction successful. Save completed.");
                    return { success: true, compacted: true };
                } catch (retryErr) {
                    console.error("Save failed after compaction:", retryErr);
                }
            }
            showQuotaExceededAlert();
            return { success: false, quotaExceeded: true };
        } else {
            console.error("Failed to persist save slots store:", err);
            return { success: false, error: err };
        }
    }
}

/**
 * Saves current active game state into a designated slot.
 */
export function saveToSlot(slotId = null, customName = null) {
    if (!state.gameState || !state.gameState.user) return;

    const store = getSlotsStore();
    // Strictly isolate by state.gameState._slotId if available
    const rawTargetId = slotId || state.gameState._slotId || store.activeSlotId || 'slot_1';
    const targetId = isValidSlotId(rawTargetId) ? rawTargetId : 'slot_1';
    state.gameState._slotId = targetId;

    const cleanState = sanitizeGameState(state.gameState);
    state.gameState = cleanState;

    const user = state.gameState.user;
    const defaultName = user?.username || user?.name || `Life (Age ${user?.age || 0})`;
    const existingName = store.slots[targetId]?.name;
    const slotName = customName || existingName || defaultName;

    store.slots[targetId] = {
        id: targetId,
        name: slotName,
        lastSaved: Date.now(),
        data: deepClone(cleanState)
    };

    store.activeSlotId = targetId;
    const persistResult = persistSlotsStore(store);

    // Also update legacy and guest keys for backward compatibility if primary save succeeded
    if (persistResult?.success) {
        if (!state.userAuthId) {
            // Guest mode: mirror save into legacy and guest storage keys
            try {
                localStorage.setItem('life_game_save', JSON.stringify(cleanState));
            } catch (e) {}
            try {
                if (Utils && Utils.guestStorage && Utils.guestStorage.SAVE_KEY) {
                    localStorage.setItem(Utils.guestStorage.SAVE_KEY, JSON.stringify(cleanState));
                }
            } catch (e) {}
        } else {
            // Authenticated mode: purge guest storage keys so they never trigger false conflict modals
            try {
                localStorage.removeItem('life_game_save');
            } catch (e) {}
            try {
                if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                    Utils.guestStorage.clearSave();
                }
            } catch (e) {}
        }
    }

    return persistResult;
}

/**
 * Loads a specified save slot into state.gameState.
 */
export function loadSlot(slotId) {
    if (!isValidSlotId(slotId)) {
        UI.showModal("Load Error", "Selected save slot identifier is invalid.");
        return;
    }

    const store = getSlotsStore();
    const slot = store.slots[slotId];
    
    if (!slot || !slot.data) {
        UI.showModal("Load Error", "Selected save slot does not exist or is corrupted.");
        return;
    }

    // Set active slot pointer and restore state with strict _slotId binding
    store.activeSlotId = slotId;
    persistSlotsStore(store);
    
    const restoredState = migrateState(slot.data);
    if (!restoredState || !restoredState.user) {
        UI.showModal("Load Error", "Selected save slot contains invalid data.");
        return;
    }
    restoredState._slotId = slotId;

    // Check if slot has higher recorded annual snapshot to recover past age (only if character is alive)
    if (!restoredState.user.isDead && restoredState.user.lifeStatus !== 'Deceased' && Array.isArray(restoredState.snapshots) && restoredState.snapshots.length > 0) {
        restoredState.snapshots = restoredState.snapshots.slice(-5);
        const highestSnapshot = restoredState.snapshots.slice().sort((a, b) => b.age - a.age)[0];
        if (highestSnapshot && highestSnapshot.data && highestSnapshot.age > (restoredState.user?.age || 0)) {
            const snapshotData = migrateState(highestSnapshot.data);
            if (snapshotData && snapshotData.user && !snapshotData.user.isDead) {
                snapshotData.snapshots = restoredState.snapshots;
                snapshotData._slotId = slotId;
                state.gameState = snapshotData;
            } else {
                state.gameState = restoredState;
            }
        } else {
            state.gameState = restoredState;
        }
    } else {
        if (!Array.isArray(restoredState.snapshots)) restoredState.snapshots = [];
        state.gameState = restoredState;
    }

    // Immediately update Header bar and Avatar DOM
    if (UI && typeof UI.updateHeader === 'function' && state.gameState?.user) {
        UI.updateHeader(state.gameState.user);
    }
    const avatarElem = document.getElementById('avatar-container');
    if (avatarElem && state.gameState?.user) {
        import('../ui/avatarRenderer.js').then(m => {
            if (typeof m.renderAvatar === 'function') {
                avatarElem.innerHTML = m.renderAvatar(state.gameState.user);
            }
        }).catch(() => {});
    }

    // Persist the loaded state directly into the active slot (synchronous, no race)
    saveToSlot(slotId);
    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }

    // Re-render main dashboard or death screen
    if (state.gameState?.user?.lifeStatus === "Deceased") {
        import('../features/player/mainScreen.js').then(m => {
            if (typeof m.renderDeathScreen === 'function') {
                m.renderDeathScreen(state.gameState.user, state.gameState.user.deathCause || "natural causes");
            }
        }).catch(() => {});
    } else if (typeof window !== 'undefined' && typeof window.renderLifeDashboard === 'function') {
        window.renderLifeDashboard(state.gameState);
    } else {
        import('../features/player/mainScreen.js').then(m => {
            if (typeof m.renderLifeDashboard === 'function') {
                m.renderLifeDashboard(state.gameState);
            }
        }).catch(() => {});
    }

    UI.showModal("Save Slot Loaded", `Loaded "${Utils.escapeHtml(slot.name)}" (Age ${state.gameState.user?.age || 0}) successfully!`);
}

export const MAX_SLOTS = 10;

/**
 * Branches current state into a new save slot (Paid Perk check).
 */
export function branchCurrentSave(customName = null) {
    const store = getSlotsStore();
    const slotCount = Object.keys(store.slots).length;
    const isOwned = hasPurchasedPack('time_machine');

    if (!isOwned && slotCount >= 1) {
        UI.showCustomModal({
            title: "Multi-Save Slots Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Multi-Save Branch Slots</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Free players get 1 save slot. Unlock <strong>Time Machine & Multi-Save Slots</strong> to create up to ${MAX_SLOTS} save slots, test risky career choices, and switch between lives.
                    </p>
                </div>
            `,
            confirmText: "Unlock Multi-Save ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    if (slotCount >= MAX_SLOTS) {
        UI.showModal("Slot Limit Reached", `You have reached the maximum limit of ${MAX_SLOTS} save slots. Delete an existing slot to create a new branch.`);
        return;
    }

    const newSlotId = `slot_${Date.now()}`;
    const user = state.gameState?.user;
    const defaultName = customName || (user ? `${user.username || 'Life'} - Branch` : `Branch Save`);

    saveToSlot(newSlotId, defaultName);
    renderSaveSlotManagerModal();
    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }
    UI.showModal("Branch Created!", `Created new save slot: "${Utils.escapeHtml(defaultName)}".`);
}

/**
 * Starts a brand new life in a fresh save slot.
 */
export function startNewLifeInNewSlot() {
    const store = getSlotsStore();
    const slotCount = Object.keys(store.slots).length;
    const isOwned = hasPurchasedPack('time_machine');

    if (!isOwned && slotCount >= 1) {
        UI.showCustomModal({
            title: "Multi-Save Slots Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Start Life in New Slot</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Keep your current life and start fresh in a brand new slot. Requires <strong>Time Machine & Multi-Save Slots</strong>.
                    </p>
                </div>
            `,
            confirmText: "Unlock Multi-Save ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    if (slotCount >= MAX_SLOTS) {
        UI.showModal("Slot Limit Reached", `You have reached the maximum limit of ${MAX_SLOTS} save slots. Delete an old slot to start a new life.`);
        return;
    }

    // 1. Save current active life first
    saveToSlot();

    // 2. Generate new slot ID and set active pointer
    const newSlotId = 'slot_' + Date.now();
    const freshStore = getSlotsStore();
    freshStore.slots[newSlotId] = {
        id: newSlotId,
        name: "New Life",
        lastSaved: Date.now(),
        data: null
    };
    freshStore.activeSlotId = newSlotId;
    persistSlotsStore(freshStore);

    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }

    // 3. Clear active in-memory state and route to Character Creation
    state.gameState = null;
    UI.hideModal();

    if (typeof window !== 'undefined' && typeof window.renderCharCreation === 'function') {
        window.renderCharCreation();
    } else {
        import('../features/player/charCreationScreen.js').then(m => {
            if (m && typeof m.renderCharCreation === 'function') {
                m.renderCharCreation();
            }
        }).catch(() => {});
    }
}

/**
 * Deletes a save slot.
 */
export function deleteSlot(slotId, skipConfirm = false) {
    if (!isValidSlotId(slotId)) return;
    const store = getSlotsStore();
    if (!store.slots[slotId]) return;

    if (Object.keys(store.slots).length <= 1) {
        UI.showModal("Cannot Delete", "You must keep at least one active save slot.");
        return;
    }

    const slotName = store.slots[slotId].name;
    const doDelete = () => {
        delete store.slots[slotId];
        let needsToLoadNewSlot = false;
        if (store.activeSlotId === slotId) {
            store.activeSlotId = Object.keys(store.slots)[0];
            needsToLoadNewSlot = true;
        }
        // Sync in-memory _slotId so saveToSlot() doesn't re-create the deleted slot
        if (state.gameState && state.gameState._slotId === slotId) {
            state.gameState._slotId = store.activeSlotId;
        }
        persistSlotsStore(store);

        if (needsToLoadNewSlot) {
            loadSlot(store.activeSlotId);
            // Wait a tick before showing the deleted modal so it overwrites the "Load" modal from loadSlot
            setTimeout(() => {
                UI.showModal("Slot Deleted", `Deleted "${Utils.escapeHtml(slotName)}".`);
            }, 100);
        } else {
            renderSaveSlotManagerModal();
            if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
                window.saveGame();
            }
            UI.showModal("Slot Deleted", `Deleted "${Utils.escapeHtml(slotName)}".`);
        }
    };

    if (skipConfirm || typeof UI === 'undefined' || typeof UI.showConfirm !== 'function' || typeof document === 'undefined') {
        doDelete();
    } else {
        UI.showConfirm(
            "Delete Save Slot",
            `Are you sure you want to delete "${Utils.escapeHtml(slotName)}"? This action cannot be undone.`,
            "Delete",
            doDelete
        );
    }
}

/**
 * Renders the Save & Load Slot Manager Modal.
 */
export function renderSaveSlotManagerModal() {
    saveToSlot(); // Ensure current state is updated in active slot

    const store = getSlotsStore();
    const isOwned = hasPurchasedPack('time_machine');
    const slotKeys = Object.keys(store.slots);

    let slotsHTML = slotKeys.map(key => {
        const slot = store.slots[key];
        const isActive = key === store.activeSlotId;
        const u = slot.data?.user || {};
        const dateStr = slot.lastSaved ? new Date(slot.lastSaved).toLocaleDateString() + ' ' + new Date(slot.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
        const moneyFormatted = Utils ? Utils.formatMoney(u.money || 0) : '$' + (u.money || 0).toLocaleString();

        const avatarHTML = (u && (u.username || u.name || u.age !== undefined)) ?
            renderAvatar({ ...u, id: `slot-avatar-${key}`, avatarVersion: slot.lastSaved || 1 }) :
            `<i class="fas fa-user text-slate-500 text-base"></i>`;

        return `
            <div class="bg-slate-900 border ${isActive ? 'border-cyan-500 shadow-md shadow-cyan-500/10' : 'border-slate-700'} p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full bg-slate-800 border ${isActive ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-700'} overflow-hidden flex items-center justify-center shrink-0">
                        ${avatarHTML}
                    </div>
                    <div>
                        <div class="text-xs font-extrabold text-white flex items-center gap-1.5">
                            ${Utils.escapeHtml(slot.name)} ${isActive ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">Active</span>' : ''}
                        </div>
                        <div class="text-[11px] text-slate-400 mt-0.5">
                            Age ${u.age || 0} • ${Utils.escapeHtml(u.jobTitle || 'Unemployed')} • <span class="text-emerald-400 font-semibold">${moneyFormatted}</span>
                        </div>
                        <div class="text-[9px] text-slate-500 mt-0.5">Saved: ${Utils.escapeHtml(dateStr)}</div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    ${isActive ? `
                        <button disabled class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700 cursor-default">
                            Active
                        </button>
                    ` : `
                        <button data-action="loadSaveSlot" data-args="'${key}'" class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1">
                            <i class="fas fa-folder-open text-[10px]"></i> Load
                        </button>
                    `}
                    ${slotKeys.length > 1 ? `
                        <button data-action="deleteSaveSlot" data-args="'${key}'" class="px-2 py-1.5 rounded-lg text-xs font-bold bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
                        <i class="fas fa-layer-group text-cyan-400"></i> Multi-Save Manager
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">${slotKeys.length} / ${MAX_SLOTS} Save Slots Used</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button data-action="branchSaveSlot" title="Clone current character into new slot" class="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md transition flex items-center gap-1">
                        <i class="fas fa-code-branch"></i> Branch
                    </button>
                    <button data-action="startNewSlotLife" title="Start brand new character in new slot" class="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md transition flex items-center gap-1">
                        <i class="fas fa-plus-circle"></i> New Life
                    </button>
                </div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                ${slotsHTML}
            </div>

            ${!isOwned ? `
                <div class="bg-slate-900 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
                    <div class="text-xs text-slate-300">
                        <i class="fas fa-lock text-cyan-400 mr-1"></i> Unlock up to ${MAX_SLOTS} save slots for $1.99
                    </div>
                    <button data-action="buyPack" data-args="'time_machine'" class="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 transition">
                        Unlock ($1.99)
                    </button>
                </div>
            ` : ''}

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2 mt-2">
                <i class="fas fa-times"></i> Close Slots Manager
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Save & Load Slots",
        content: modalHTML,
        confirmText: null,
        cancelText: null,
        showCloseBtn: true
    });
}
