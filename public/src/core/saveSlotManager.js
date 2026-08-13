import { state } from './state.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../ui/utils.js';
import { hasPurchasedPack, buyPack } from '../features/store/storeScreen.js';
import { renderAvatar } from '../ui/avatarRenderer.js';

const STORAGE_KEY = 'life_game_slots';

/**
 * Gets slots object from localStorage (with fallback migration for single save).
 */
export function getSlotsStore() {
    let store = { activeSlotId: 'slot_1', slots: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            store = JSON.parse(raw);
            
            // Clean up orphan slots with missing data
            if (store.slots) {
                let changed = false;
                Object.keys(store.slots).forEach(key => {
                    if (store.slots[key].data === undefined) {
                        delete store.slots[key];
                        changed = true;
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
            const name = activeData.user?.username || activeData.user?.name || 'Main Life';
            store.slots['slot_1'] = {
                id: 'slot_1',
                name: name,
                lastSaved: Date.now(),
                data: activeData
            };
            store.activeSlotId = 'slot_1';
            persistSlotsStore(store);
        }
    }

    return store;
}

/**
 * Persists slots store to localStorage.
 */
export function persistSlotsStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
        console.error("Failed to persist save slots store:", e);
    }
}

/**
 * Saves current active game state into a designated slot.
 */
export function saveToSlot(slotId = null, customName = null) {
    if (!state.gameState || !state.gameState.user) return;

    const store = getSlotsStore();
    // Strictly isolate by state.gameState._slotId if available
    const targetId = slotId || state.gameState._slotId || store.activeSlotId || 'slot_1';
    state.gameState._slotId = targetId;

    const user = state.gameState.user;
    const defaultName = user.username || user.name || `Life (Age ${user.age})`;

    const slotName = customName || defaultName;

    store.slots[targetId] = {
        id: targetId,
        name: slotName,
        lastSaved: Date.now(),
        data: JSON.parse(JSON.stringify(state.gameState))
    };

    store.activeSlotId = targetId;
    persistSlotsStore(store);

    // Also update legacy key for backward compatibility
    try {
        localStorage.setItem('life_game_save', JSON.stringify(state.gameState));
    } catch (e) {}
}

/**
 * Loads a specified save slot into state.gameState.
 */
export function loadSlot(slotId) {
    const store = getSlotsStore();
    const slot = store.slots[slotId];
    
    if (!slot || !slot.data) {
        UI.showModal("Load Error", "Selected save slot does not exist or is corrupted.");
        return;
    }

    // Set active slot pointer and restore state with strict _slotId binding
    store.activeSlotId = slotId;
    persistSlotsStore(store);
    
    const restoredState = JSON.parse(JSON.stringify(slot.data));
    restoredState._slotId = slotId;

    // Check if slot has higher recorded annual snapshot to recover past age
    if (Array.isArray(restoredState.snapshots) && restoredState.snapshots.length > 0) {
        const highestSnapshot = restoredState.snapshots.slice().sort((a, b) => b.age - a.age)[0];
        if (highestSnapshot && highestSnapshot.data && highestSnapshot.age > (restoredState.user?.age || 0)) {
            const snapshotData = JSON.parse(JSON.stringify(highestSnapshot.data));
            snapshotData.snapshots = restoredState.snapshots;
            snapshotData._slotId = slotId;
            state.gameState = snapshotData;
        } else {
            state.gameState = restoredState;
        }
    } else {
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

    // Re-render main dashboard
    if (typeof window !== 'undefined' && typeof window.renderLifeDashboard === 'function') {
        window.renderLifeDashboard(state.gameState);
    } else {
        import('../features/player/mainScreen.js').then(m => {
            if (typeof m.renderLifeDashboard === 'function') {
                m.renderLifeDashboard(state.gameState);
            }
        }).catch(() => {});
    }

    UI.showModal("Save Slot Loaded", `Loaded "${slot.name}" (Age ${state.gameState.user?.age || 0}) successfully!`);
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
    UI.showModal("Branch Created!", `Created new save slot: "${defaultName}".`);
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
                            <div class="text-sm font-bold text-white">Multi-Save Branch Slots</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Unlock <strong>Time Machine & Multi-Save Slots</strong> to play up to ${MAX_SLOTS} characters simultaneously in separate save slots.
                    </p>
                </div>
            `,
            confirmText: "Unlock ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    if (slotCount >= MAX_SLOTS) {
        UI.showModal("Slot Limit Reached", `You have reached the maximum limit of ${MAX_SLOTS} save slots. Delete an unwanted slot to start a new life.`);
        return;
    }

    // 1. Save current active character to its current slot
    saveToSlot();

    // 2. Re-read the store AFTER saveToSlot persisted it (avoids stale-store overwrite)
    const freshStore = getSlotsStore();
    const newSlotId = `slot_${Date.now()}`;
    freshStore.slots[newSlotId] = {
        id: newSlotId,
        name: 'New Life',
        lastSaved: Date.now(),
        data: null
    };
    freshStore.activeSlotId = newSlotId;
    persistSlotsStore(freshStore);

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
export function deleteSlot(slotId) {
    const store = getSlotsStore();
    if (!store.slots[slotId]) return;

    if (Object.keys(store.slots).length <= 1) {
        UI.showModal("Cannot Delete", "You must keep at least one active save slot.");
        return;
    }

    const slotName = store.slots[slotId].name;

    UI.showConfirm(
        "Delete Save Slot",
        `Are you sure you want to delete "${slotName}"? This action cannot be undone.`,
        "Delete",
        () => {
            delete store.slots[slotId];
            if (store.activeSlotId === slotId) {
                store.activeSlotId = Object.keys(store.slots)[0];
            }
            persistSlotsStore(store);
            renderSaveSlotManagerModal();
            UI.showModal("Slot Deleted", `Deleted "${slotName}".`);
        }
    );
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
                            ${slot.name} ${isActive ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">Active</span>' : ''}
                        </div>
                        <div class="text-[11px] text-slate-400 mt-0.5">
                            Age ${u.age || 0} • ${u.jobTitle || 'Unemployed'} • <span class="text-emerald-400 font-semibold">${moneyFormatted}</span>
                        </div>
                        <div class="text-[9px] text-slate-500 mt-0.5">Saved: ${dateStr}</div>
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
        </div>
    `;

    UI.showCustomModal({
        title: "Save & Load Slots",
        content: modalHTML,
        confirmText: "Close",
        onConfirm: () => {}
    });
}
