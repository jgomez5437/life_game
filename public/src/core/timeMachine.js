import { state, hasPurchasedPack } from './state.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../ui/utils.js';

const buyPack = async (...args) => (await import('../features/store/storeScreen.js')).buyPack(...args);

export const MAX_SNAPSHOTS = 5;

/**
 * Captures an annual snapshot of the current game state.
 * Maintains up to 5 annual snapshots in gameState.snapshots.
 */
export function captureAnnualSnapshot(gameState) {
    if (!gameState || !gameState.user || gameState.user.lifeStatus === 'Deceased') {
        return;
    }

    if (!Array.isArray(gameState.snapshots)) {
        gameState.snapshots = [];
    }

    // Clone state excluding snapshots to prevent recursive bloat
    const clonedState = JSON.parse(JSON.stringify(gameState));
    delete clonedState.snapshots;

    const currentAge = gameState.user.age;
    
    // Remove any existing snapshot for the exact same age
    gameState.snapshots = gameState.snapshots.filter(s => s.age !== currentAge);

    // Push new annual snapshot
    gameState.snapshots.push({
        age: currentAge,
        timestamp: Date.now(),
        summary: {
            jobTitle: gameState.user.jobTitle || 'Unemployed',
            money: gameState.user.money || 0,
            health: gameState.user.health ?? 100,
            happiness: gameState.user.happiness ?? 100,
            city: gameState.user.city || 'Unknown'
        },
        data: clonedState
    });

    // Enforce 5 snapshot rolling limit
    if (gameState.snapshots.length > MAX_SNAPSHOTS) {
        gameState.snapshots = gameState.snapshots.slice(-MAX_SNAPSHOTS);
    }
}

/**
 * Rewinds character state to target age snapshot.
 */
export function rewindToAge(targetAge) {
    const isOwned = hasPurchasedPack('time_machine');
    if (!isOwned) {
        UI.showCustomModal({
            title: "Time Machine Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Time Machine & Multi-Save</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Unlock the <strong>Time Machine</strong> to rewind up to 5 years, undo accidental mistakes or deaths, and manage unlimited save branch slots.
                    </p>
                </div>
            `,
            confirmText: "Unlock ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    const currentState = state.gameState;
    if (!currentState || !Array.isArray(currentState.snapshots)) {
        UI.showModal("Time Machine Error", "No past timeline snapshots found for this character.");
        return;
    }

    const snapshotObj = currentState.snapshots.find(s => s.age === Number(targetAge));
    if (!snapshotObj) {
        UI.showModal("Timeline Error", `Could not find timeline snapshot for Age ${targetAge}.`);
        return;
    }

    // Restore state from snapshot
    const restoredState = JSON.parse(JSON.stringify(snapshotObj.data));

    // Restore surviving status if deceased
    if (restoredState.user) {
        restoredState.user.lifeStatus = "Alive";
        delete restoredState.user.deathCause;
    }

    // Keep snapshots up to target age
    restoredState.snapshots = currentState.snapshots.filter(s => s.age <= targetAge);

    // Preserve current slot binding so rewind doesn't corrupt save targets
    const currentSlotId = currentState._slotId;

    // Apply restored state
    state.gameState = restoredState;
    state.gameState._slotId = currentSlotId;

    // Immediately update Header and Avatar DOM
    if (UI && typeof UI.updateHeader === 'function') {
        UI.updateHeader(state.gameState.user);
    }
    const avatarElem = document.getElementById('avatar-container');
    if (avatarElem) {
        import('../ui/avatarRenderer.js').then(m => {
            if (typeof m.renderAvatar === 'function') {
                avatarElem.innerHTML = m.renderAvatar(state.gameState.user);
            }
        }).catch(() => {});
    }

    // Save and re-render main dashboard
    if (typeof window !== 'undefined' && typeof window.saveGame === 'function') {
        window.saveGame();
    }
    if (typeof window !== 'undefined' && typeof window.renderLifeDashboard === 'function') {
        window.renderLifeDashboard(state.gameState);
    } else {
        import('../features/player/mainScreen.js').then(m => {
            if (typeof m.renderLifeDashboard === 'function') {
                m.renderLifeDashboard(state.gameState);
            }
        }).catch(() => {});
    }

    UI.showModal("Time Rewound!", `Successfully traveled back in time to Age ${targetAge}!`);
}

/**
 * Renders the Time Machine timeline scrubber modal.
 */
export function renderTimeMachineModal() {
    const currentState = state.gameState;
    if (!currentState || !currentState.user) return;

    // Ensure at least current state is captured if snapshots array is empty
    if (!Array.isArray(currentState.snapshots) || currentState.snapshots.length === 0) {
        captureAnnualSnapshot(currentState);
    }

    const isOwned = hasPurchasedPack('time_machine');
    const snapshots = (currentState.snapshots || []).slice().sort((a, b) => b.age - a.age);

    let snapshotsHTML = '';
    if (snapshots.length === 0) {
        snapshotsHTML = `
            <div class="text-center py-8 bg-slate-900/60 rounded-xl border border-slate-800">
                <i class="fas fa-clock text-3xl text-slate-600 mb-2"></i>
                <p class="text-slate-400 text-xs">No past timeline snapshots recorded yet.</p>
                <p class="text-slate-500 text-[10px] mt-1">Snapshots are automatically saved each year when you age up.</p>
            </div>
        `;
    } else {
        snapshotsHTML = snapshots.map(s => {
            const isCurrentAge = s.age === currentState.user.age;
            const moneyFormatted = Utils ? Utils.formatMoney(s.summary.money) : '$' + s.summary.money.toLocaleString();

            return `
                <div class="bg-slate-900 border ${isCurrentAge ? 'border-amber-500/50' : 'border-slate-700'} p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-cyan-500/40 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-sm shrink-0">
                            ${s.age}
                        </div>
                        <div>
                            <div class="text-xs font-bold text-white flex items-center gap-1.5">
                                Age ${s.age} ${isCurrentAge ? '<span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">Current</span>' : ''}
                            </div>
                            <div class="text-[11px] text-slate-400 mt-0.5">
                                ${s.summary.jobTitle} • <span class="text-emerald-400 font-semibold">${moneyFormatted}</span>
                            </div>
                        </div>
                    </div>

                    ${isCurrentAge ? `
                        <button disabled class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-500 cursor-default border border-slate-700">
                            Present
                        </button>
                    ` : `
                        <button data-action="executeTimeRewind" data-args="${s.age}" class="px-3 py-1.5 rounded-lg text-xs font-extrabold ${isOwned ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950'} transition flex items-center gap-1">
                            <i class="fas ${isOwned ? 'fa-undo' : 'fa-lock'} text-[10px]"></i> ${isOwned ? 'Rewind' : 'Preview'}
                        </button>
                    `}
                </div>
            `;
        }).join('');
    }

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 p-4 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-extrabold text-white">Time Machine Engine</h3>
                        <p class="text-xs text-cyan-300">Rewind up to ${MAX_SNAPSHOTS} years of life snapshots</p>
                    </div>
                </div>
                ${isOwned ? `
                    <span class="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i class="fas fa-check"></i> Unlocked
                    </span>
                ` : `
                    <span class="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i class="fas fa-store"></i> $1.99 Perk
                    </span>
                `}
            </div>

            <div class="text-xs text-slate-300 leading-relaxed">
                Select a previous age below to travel back in time. All decisions, wealth, and events will revert to that exact year snapshot.
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${snapshotsHTML}
            </div>

            ${!isOwned ? `
                <div class="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
                    <div class="text-xs text-amber-200">
                        <i class="fas fa-bolt text-amber-400 mr-1"></i> Unlock full Time Machine & Multi-Save Slots for $1.99
                    </div>
                    <button data-action="buyPack" data-args="'time_machine'" class="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 transition">
                        Unlock Now
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    UI.showCustomModal({
        title: "Time Machine & Timeline Scrubber",
        content: modalHTML,
        confirmText: "Close",
        onConfirm: () => {}
    });
}
