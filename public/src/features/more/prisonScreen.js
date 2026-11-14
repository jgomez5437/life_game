import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

import {
    renderSolitaryContent,
    renderCellBlockContent,
    renderYardContent,
    renderJobsCanteenContent,
    renderLegalContent,
    renderVisitingContent,
    renderEscapeContent
} from './prisonTabsRenderer.js';
export * from './prisonContrabandCombatModals.js';
const get = id => document.getElementById(id);

let activePrisonTab = 'cell_block'; // Default tab: 'cell_block', 'yard', 'jobs_canteen', 'legal', 'visiting', 'escape'

export function renderPrisonDashboard() {
    const user = state.gameState.user;

    if (!user || !user.inPrison) {
        renderLifeDashboard();
        return;
    }

    if (!user.yardInmates || user.yardInmates.length === 0) {
        user.yardInmates = GameLogic.generateYardInmates(user.prisonSecurity || 'Medium');
    }
    if (!user.cellmate && (!user.prisonStats || user.prisonStats.solitaryTurns <= 0)) {
        user.cellmate = GameLogic.generateCellmate(user.prisonSecurity || 'Medium');
    }

    const stats = user.prisonStats || {
        respect: 25,
        guardRelation: 50,
        gang: 'None',
        canteenCash: 50,
        solitaryTurns: 0,
        goodBehaviorPoints: 10,
        prisonJob: 'None',
        lawStudied: 0,
        contraband: []
    };

    UI.updateHeader(user);
    UI.hideBottomNav();

    const securityColor = user.prisonSecurity === 'Supermax' ? 'text-red-500 bg-red-950/80 border-red-800'
        : user.prisonSecurity === 'Maximum' ? 'text-amber-400 bg-amber-950/80 border-amber-800'
        : user.prisonSecurity === 'Medium' ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800'
        : 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

    const solitaryNotice = stats.solitaryTurns > 0 ? `
        <div class="bg-red-950/90 border border-red-700/80 p-3 rounded-xl mb-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-900 flex items-center justify-center text-white text-xl shrink-0">
                <i class="fas fa-lock"></i>
            </div>
            <div>
                <div class="text-xs font-bold uppercase tracking-wider text-red-400">Solitary Confinement Active</div>
                <div class="text-xs text-slate-300">You are locked in solitary isolation for <strong>${stats.solitaryTurns} year(s)</strong> due to prison misconduct. Yard & social privileges are restricted.</div>
            </div>
        </div>
    ` : '';

    const tabNavHtml = `
        <div id="prison-tab-nav" class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-xs font-bold touch-pan-x overscroll-contain select-none">
            <button data-action="setPrisonTab" data-args="cell_block" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'cell_block' ? 'bg-slate-700 text-white border border-amber-500/60 shadow-md ring-1 ring-amber-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-bed text-amber-400"></i> Cell Block
            </button>
            <button data-action="setPrisonTab" data-args="yard" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'yard' ? 'bg-slate-700 text-white border border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-dumbbell text-emerald-400"></i> Yard & Gym
            </button>
            <button data-action="setPrisonTab" data-args="jobs_canteen" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'jobs_canteen' ? 'bg-slate-700 text-white border border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-utensils text-indigo-400"></i> Jobs & Canteen
            </button>
            <button data-action="setPrisonTab" data-args="legal" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'legal' ? 'bg-slate-700 text-white border border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-balance-scale text-cyan-400"></i> Law & Appeals
            </button>
            <button data-action="setPrisonTab" data-args="visiting" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'visiting' ? 'bg-slate-700 text-white border border-pink-500/60 shadow-md ring-1 ring-pink-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-user-friends text-pink-400"></i> Visiting Room
            </button>
            <button data-action="setPrisonTab" data-args="escape" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'escape' ? 'bg-slate-700 text-white border border-red-500/60 shadow-md ring-1 ring-red-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'}">
                <i class="fas fa-person-walking-arrow-right text-red-400"></i> Parole & Escape
            </button>
        </div>
    `;

    const prevScrollLeft = document.getElementById('prison-tab-nav')?.scrollLeft;

    get('game-container').innerHTML = `
        <div class="flex flex-col h-full max-w-lg mx-auto">
            <!-- Facility Header -->
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 text-lg">
                            <i class="fas fa-building-shield"></i>
                        </div>
                        <div>
                            <h2 class="text-sm font-black text-white leading-tight">${Utils.escapeHtml(user.facilityName || 'State Penitentiary')}</h2>
                            <div class="text-[11px] text-slate-400">Serving Year ${user.prisonTotalSentence - user.prisonSentenceRemaining + 1} of ${user.prisonTotalSentence}</div>
                        </div>
                    </div>
                    <span class="text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${securityColor}">
                        ${Utils.escapeHtml(user.prisonSecurity || 'Medium')} Security
                    </span>
                </div>

                <!-- Prison Stats Bar -->
                <div class="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700/60 text-center">
                    <div class="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Sentence</div>
                        <div class="text-xs font-black text-amber-400">${user.prisonSentenceRemaining} yrs left</div>
                    </div>
                    <div class="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Respect</div>
                        <div class="text-xs font-black text-emerald-400">${stats.respect || 25}%</div>
                    </div>
                    <div class="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Guards</div>
                        <div class="text-xs font-black text-indigo-400">${stats.guardRelation || 50}%</div>
                    </div>
                    <div class="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Canteen</div>
                        <div class="text-xs font-black text-green-400">${Utils.formatMoney(stats.canteenCash || 0)}</div>
                    </div>
                </div>
            </div>

            <!-- Age Up Button (Prison) -->
            <div class="mb-3">
                <button data-action="ageUp" class="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 rounded-xl shadow-lg border border-emerald-500/50 flex items-center justify-center gap-2 text-sm transition transform active:scale-95">
                    <i class="fas fa-calendar-plus text-base"></i> + Age 1 Year (Serve Sentence)
                </button>
            </div>

            ${solitaryNotice}
            ${tabNavHtml}

            <!-- Active Tab Content -->
            <div class="flex-1 overflow-y-auto pb-4">
                ${renderActivePrisonTab(user, stats)}
            </div>
        </div>
    `;

    UI.preserveTabScroll('prison-tab-nav', `[data-action="setPrisonTab"][data-args="${activePrisonTab}"]`, prevScrollLeft);
}

export function setPrisonTab(tabKey) {
    activePrisonTab = tabKey;
    renderPrisonDashboard();
    UI.scrollTabIntoView('prison-tab-nav', `[data-action="setPrisonTab"][data-args="${activePrisonTab}"]`, { behavior: 'smooth', align: 'center' });
}

function renderActivePrisonTab(user, stats) {
    if (stats.solitaryTurns > 0) return renderSolitaryContent(user, stats);
    if (activePrisonTab === 'cell_block') return renderCellBlockContent(user, stats);
    if (activePrisonTab === 'yard') return renderYardContent(user, stats);
    if (activePrisonTab === 'jobs_canteen') return renderJobsCanteenContent(user, stats);
    if (activePrisonTab === 'legal') return renderLegalContent(user, stats);
    if (activePrisonTab === 'visiting') return renderVisitingContent(user, stats);
    if (activePrisonTab === 'escape') return renderEscapeContent(user, stats);
    return renderCellBlockContent(user, stats);
}


export function handleCellmateAction(actionType) {
    const user = state.gameState.user;
    const result = GameLogic.interactCellmate(user, actionType);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Cellmate Interaction", `
            <div class="text-center space-y-3">
                <div class="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 mx-auto overflow-hidden shadow">
                    ${renderAvatar(user.cellmate)}
                </div>
                <h4 class="font-bold text-white text-sm">${Utils.escapeHtml(user.cellmate.name)}</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Cellmate Interaction", `
            <div class="text-center space-y-3">
                <div class="text-3xl">⚠️</div>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    }

    renderPrisonDashboard();
}

export function handleYardWorkout(workoutType) {
    const user = state.gameState.user;
    const result = GameLogic.workoutPrisonYard(user, workoutType);

    const title = workoutType === 'bench_press' ? 'Yard Bench Press' : 'Track Laps';
    const icon = workoutType === 'bench_press' ? '🏋️‍♂️' : '🏃‍♂️';

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal(title, `
            <div class="text-center space-y-3">
                <div class="text-4xl">${icon}</div>
                <h4 class="font-bold text-emerald-400 text-sm">Workout Complete</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal(title, result.msg);
    }

    renderPrisonDashboard();
}

export function handleInmateInteract(inmateId, actionType) {
    const user = state.gameState.user;
    if (inmateId === 'cellmate' || (user.cellmate && String(user.cellmate.id) === String(inmateId))) {
        return handleCellmateAction(actionType === 'chat' ? 'talk' : actionType);
    }
    const inmate = (user.yardInmates || []).find(i => String(i.id) === String(inmateId));
    const result = GameLogic.interactYardInmate(user, inmateId, actionType);

    const avatarHtml = inmate ? `
        <div class="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 mx-auto overflow-hidden shadow">
            ${renderAvatar(inmate)}
        </div>
        <h4 class="font-bold text-white text-sm">${Utils.escapeHtml(inmate.name)} <span class="text-[10px] text-indigo-400">(${Utils.escapeHtml(inmate.role)})</span></h4>
    ` : '<div class="text-3xl">👥</div>';

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Yard Inmate Interaction", `
            <div class="text-center space-y-3">
                ${avatarHtml}
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Inmate Action Failed", `
            <div class="text-center space-y-3">
                ${avatarHtml}
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    }

    renderPrisonDashboard();
}

export function handleSelectPrisonJob(jobId) {
    const user = state.gameState.user;
    const result = GameLogic.doPrisonJob(user, jobId);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Prison Job Assignment", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🧹</div>
                <h4 class="font-bold text-emerald-400 text-sm">Assigned to ${jobId}</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Job Assignment Error", result.msg);
    }

    renderPrisonDashboard();
}

export function handleBuyCanteen(itemId) {
    const user = state.gameState.user;
    const result = GameLogic.buyCanteenItem(user, itemId);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Canteen Purchase", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🛍️</div>
                <h4 class="font-bold text-emerald-400 text-sm">Item Acquired</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Canteen Purchase Error", result.msg);
    }

    renderPrisonDashboard();
}

export function handleStudyLaw() {
    const user = state.gameState.user;
    const result = GameLogic.studyPrisonLaw(user);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Prison Law Library", `
            <div class="text-center space-y-3">
                <div class="text-4xl">📚</div>
                <h4 class="font-bold text-indigo-400 text-sm">Law Precedent Studied</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Library Error", result.msg);
    }

    renderPrisonDashboard();
}

export function handleFileAppeal(lawyerTier) {
    const user = state.gameState.user;

    if (lawyerTier === 'private' && (user.money || 0) < 5000) {
        UI.showModal("Insufficient Funds", "You need $5,000 for an appellate attorney defense.");
        return;
    }
    if (lawyerTier === 'private') user.money -= 5000;

    const result = GameLogic.attemptSentenceAppeal(user, lawyerTier);

    if (result.released) {
        addLog(result.msg, 'good');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Conviction Overturned!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">⚖️</div>
                <h3 class="text-xl font-bold text-emerald-400">APPEAL GRANTED</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
        renderLifeDashboard();
    } else {
        addLog(result.msg, 'bad');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Appeal Denied", result.msg);
        renderPrisonDashboard();
    }
}

export function handlePrisonVisit(relId) {
    const user = state.gameState.user;
    const rel = user.relationships.find(r => String(r.id) === String(relId));

    if (!rel) return;

    rel.status = Math.min(100, (rel.status || 50) + 15);
    user.happiness = Math.min(100, (user.happiness || 50) + 10);
    addLog(`Had a visiting room reunion with ${rel.name}. Reconnected and boosted bond!`, 'good');

    UI.showModal("Visiting Hours", `
        <div class="text-center space-y-3">
            <div class="text-4xl">🪟</div>
            <h3 class="text-lg font-bold text-pink-400">Visit with ${Utils.escapeHtml(rel.name)}</h3>
            <p class="text-xs text-slate-300">You spent visiting hours catching up with ${Utils.escapeHtml(rel.name)} behind the visitor glass. Relationship boosted!</p>
        </div>
    `);

    renderPrisonDashboard();
}

export function handleSendPrisonLetter(relId) {
    const user = state.gameState.user;
    const result = GameLogic.sendPrisonLetter(user, relId);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Letter Sent", result.msg);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Letter Error", result.msg);
    }

    renderPrisonDashboard();
}

export function handleConjugalVisit(relId) {
    const user = state.gameState.user;
    const result = GameLogic.requestConjugalVisit(user, relId);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Conjugal Visit Successful", `
            <div class="text-center space-y-3">
                <div class="text-4xl">💖</div>
                <h3 class="text-lg font-bold text-rose-400">Conjugal Visit Granted</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
                ${result.pregnancyOccurred ? '<div class="bg-pink-950 p-2 rounded-lg text-xs font-bold text-pink-300">🍼 Pregnancy Result: Expecting a baby!</div>' : ''}
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Conjugal Visit Denied", result.msg);
    }

    renderPrisonDashboard();
}

export function handleParoleHearing() {
    const user = state.gameState.user;
    const result = GameLogic.attemptParoleBoard(user);

    if (!result.success) {
        UI.showModal("Parole Error", result.msg);
        return;
    }

    if (result.released) {
        addLog(result.msg, 'good');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Parole Granted!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">📜</div>
                <h3 class="text-xl font-bold text-emerald-400">PAROLE BOARD APPROVED</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
        renderLifeDashboard();
    } else {
        addLog(result.msg, 'bad');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Parole Denied", result.msg);
        renderPrisonDashboard();
    }
}

export function handlePrisonEscapeAction(method) {
    const user = state.gameState.user;
    const result = GameLogic.attemptPrisonEscape(user, method);

    if (result.escaped) {
        addLog(result.msg, 'good');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Escaped Prison!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🚨</div>
                <h3 class="text-xl font-bold text-emerald-400">FUGITIVE AT LARGE</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
        renderLifeDashboard();
    } else {
        addLog(result.msg, 'bad');
        if (typeof saveGame === 'function') saveGame();
        UI.showModal("Escape Failed!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🚨</div>
                <h3 class="text-xl font-bold text-red-500">APPREHENDED BY GUARDS</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
        renderPrisonDashboard();
    }
}
