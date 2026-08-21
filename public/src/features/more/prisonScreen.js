import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

const get = id => document.getElementById(id);

let activePrisonTab = 'cell_block'; // Default tab: 'cell_block', 'yard', 'jobs_canteen', 'legal', 'visiting', 'escape'

export function renderPrisonDashboard() {
    const user = state.gameState.user;

    if (!user || !user.inPrison) {
        renderLifeDashboard();
        return;
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
        <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-xs font-bold">
            <button data-action="setPrisonTab" data-args="cell_block" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'cell_block' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-bed text-amber-400"></i> Cell Block
            </button>
            <button data-action="setPrisonTab" data-args="yard" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'yard' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-dumbbell text-emerald-400"></i> Yard & Gym
            </button>
            <button data-action="setPrisonTab" data-args="jobs_canteen" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'jobs_canteen' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-utensils text-indigo-400"></i> Jobs & Canteen
            </button>
            <button data-action="setPrisonTab" data-args="legal" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'legal' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-balance-scale text-cyan-400"></i> Law & Appeals
            </button>
            <button data-action="setPrisonTab" data-args="visiting" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'visiting' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-user-friends text-pink-400"></i> Visiting Room
            </button>
            <button data-action="setPrisonTab" data-args="escape" class="px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${activePrisonTab === 'escape' ? 'bg-slate-700 text-white border border-slate-600 shadow' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
                <i class="fas fa-person-walking-arrow-right text-red-400"></i> Parole & Escape
            </button>
        </div>
    `;

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
}

export function setPrisonTab(tabKey) {
    activePrisonTab = tabKey;
    renderPrisonDashboard();
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

function renderSolitaryContent(user, stats) {
    return `
        <div class="bg-red-950/80 border border-red-800 p-5 rounded-xl space-y-4 text-center shadow-xl">
            <div class="w-16 h-16 rounded-full bg-red-900 border border-red-700 mx-auto flex items-center justify-center text-white text-3xl shadow">
                <i class="fas fa-lock"></i>
            </div>
            <div class="space-y-1">
                <h3 class="text-lg font-black text-red-400 uppercase tracking-wide">Solitary Isolation ("The Hole")</h3>
                <p class="text-xs text-slate-300">You are on 23-hour lockdown in a windowless isolation cell for <strong>${stats.solitaryTurns} year(s)</strong> due to prison misconduct. All yard, job, visiting, and inmate social privileges are revoked.</p>
            </div>

            <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-left">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-bed text-amber-400"></i> Cell Activities in Isolation
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button data-action="handleSolitaryActivity" data-args="pushups" class="bg-slate-800 hover:bg-slate-700 text-white font-bold p-2.5 rounded-xl text-xs text-left transition border border-slate-700">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-dumbbell text-emerald-400"></i> Cell Push-ups</div>
                        <div class="text-[10px] text-slate-400 font-normal">+2 Health, +1 Respect</div>
                    </button>
                    <button data-action="handleSolitaryActivity" data-args="meditate" class="bg-slate-800 hover:bg-slate-700 text-white font-bold p-2.5 rounded-xl text-xs text-left transition border border-slate-700">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-brain text-cyan-400"></i> Meditate & Reflect</div>
                        <div class="text-[10px] text-slate-400 font-normal">+5 Smarts, +1 Health</div>
                    </button>
                </div>
            </div>

            ${stats.contraband && stats.contraband.includes('Contraband Cellphone') ? `
                <div class="pt-2">
                    <button data-action="openContrabandPhoneModal" class="w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-600 text-purple-100 font-extrabold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow">
                        <i class="fas fa-mobile-screen text-amber-400 text-sm"></i> Use Smuggled Contraband Cellphone
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderCellBlockContent(user, stats) {
    const cm = user.cellmate;

    const cellmateCardHtml = cm ? `
        <div data-action="openInmateDetailModal" data-args="cellmate" class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow cursor-pointer hover:bg-slate-750 hover:border-amber-500/50 transition group">
            <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0 shadow-inner group-hover:border-amber-400 transition">
                        ${renderAvatar(cm)}
                    </div>
                    <div>
                        <div class="text-xs font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                            Cellmate Profile <i class="fas fa-chevron-right text-[10px] text-slate-500"></i>
                        </div>
                        <h3 class="text-base font-bold text-white">${Utils.escapeHtml(cm.name)} (${cm.age} y/o)</h3>
                        <div class="text-xs text-slate-400">Serving time for: <span class="text-slate-200 font-semibold">${Utils.escapeHtml(cm.crime)}</span></div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">Relationship</div>
                    <div class="text-sm font-black text-emerald-400">${cm.status || 50}%</div>
                </div>
            </div>

            <div class="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Press to chat, trade, or attack cellmate</span>
                <span class="text-amber-400 font-bold text-xs flex items-center gap-1">Interact <i class="fas fa-arrow-right text-[10px]"></i></span>
            </div>
        </div>
    ` : `
        <div class="bg-slate-800/90 p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-1 shadow">
            <div class="text-3xl text-slate-600">🛏️</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Empty Cell Bunk</div>
            <div class="text-[11px] text-slate-500">You currently have no cellmate. A new inmate will be assigned to your bunk in the future.</div>
        </div>
    `;

    return `
        <div class="space-y-3">
            ${cellmateCardHtml}

            <!-- Contraband Locker -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span class="flex items-center gap-1.5"><i class="fas fa-box-archive text-indigo-400"></i> Cell Stash & Contraband</span>
                </div>
                ${stats.contraband && stats.contraband.length > 0 ? `
                    <div class="flex flex-wrap gap-1.5">
                        ${stats.contraband.map(c => `
                            <span class="text-xs bg-slate-900 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                <i class="fas fa-key text-[10px]"></i> ${Utils.escapeHtml(c)}
                            </span>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-xs text-slate-500 italic">No contraband stashed in cell mattress. Buy items from canteen or inmates.</div>
                `}

                ${stats.contraband && stats.contraband.includes('Contraband Cellphone') ? `
                    <button data-action="openContrabandPhoneModal" class="w-full mt-2 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-600 text-purple-100 font-extrabold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow">
                        <i class="fas fa-mobile-screen text-amber-400 text-sm"></i> Use Contraband Cellphone (Outside Contacts & Legal Help)
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderYardContent(user, stats) {
    const inmates = user.yardInmates || [];

    return `
        <div class="space-y-3">
            <!-- Yard Workouts -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2 shadow">
                <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-dumbbell"></i> Prison Yard Fitness
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button data-action="handleYardWorkout" data-args="bench_press" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs text-left transition border border-slate-600">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-weight-hanging text-amber-400"></i> Bench Press</div>
                        <div class="text-[10px] text-slate-400 font-normal">+5 Respect, +4 Health</div>
                    </button>
                    <button data-action="handleYardWorkout" data-args="cardio" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs text-left transition border border-slate-600">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-person-running text-cyan-400"></i> Track Laps</div>
                        <div class="text-[10px] text-slate-400 font-normal">+6 Health, +2 Looks</div>
                    </button>
                </div>
            </div>

            <!-- Inmates & Gang Roster -->
            <div class="space-y-2">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-1">
                    <i class="fas fa-users text-indigo-400"></i> Key Yard Inmates
                </div>
                <div class="space-y-2">
                    ${inmates.map(inmate => `
                        <div data-action="openInmateDetailModal" data-args="${inmate.id}" class="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-750 hover:border-indigo-500/50 transition group">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0 shadow-inner group-hover:border-indigo-400 transition">
                                    ${renderAvatar(inmate)}
                                </div>
                                <div class="space-y-0.5 min-w-0">
                                    <div class="font-bold text-white text-xs flex items-center gap-2 truncate">
                                        ${Utils.escapeHtml(inmate.name)}
                                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-700 font-bold shrink-0">${Utils.escapeHtml(inmate.role)}</span>
                                    </div>
                                    <div class="text-[11px] text-slate-400 truncate">Convicted: ${Utils.escapeHtml(inmate.crime)} • ${Utils.escapeHtml(inmate.perk)}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <span class="bg-slate-700 group-hover:bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                                    Interact <i class="fas fa-chevron-right text-[10px]"></i>
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderJobsCanteenContent(user, stats) {
    return `
        <div class="space-y-3">
            <!-- Prison Job Selection -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2 shadow">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                    <span><i class="fas fa-briefcase mr-1.5"></i> Prison Job Assignment</span>
                    <span class="text-amber-400 font-black">Active: ${stats.prisonJob || 'Unassigned'}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button data-action="handleSelectPrisonJob" data-args="Kitchen Duty" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-left transition border border-slate-600">
                        <div class="font-bold text-white">Kitchen Duty</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">$350 / yr canteen cash</div>
                    </button>
                    <button data-action="handleSelectPrisonJob" data-args="Laundry Detail" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-left transition border border-slate-600">
                        <div class="font-bold text-white">Laundry Detail</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">$250 / yr canteen cash</div>
                    </button>
                    <button data-action="handleSelectPrisonJob" data-args="Library Assistant" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-left transition border border-slate-600">
                        <div class="font-bold text-white">Library Assistant</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">$450 / yr canteen cash</div>
                    </button>
                    <button data-action="handleSelectPrisonJob" data-args="Yard Maintenance" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-left transition border border-slate-600">
                        <div class="font-bold text-white">Yard Maintenance</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">$300 / yr canteen cash</div>
                    </button>
                </div>
            </div>

            <!-- Canteen Store -->
            <div class="space-y-2">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between px-1">
                    <span><i class="fas fa-store text-green-400 mr-1.5"></i> Canteen & Black Market Store</span>
                    <span class="text-xs font-black text-green-400">Cash: ${Utils.formatMoney(stats.canteenCash || 0)}</span>
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">Ramen Packet</div>
                            <div class="text-[10px] text-slate-400">Quick meal (+5 Happiness)</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="ramen" class="bg-green-700 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $5
                        </button>
                    </div>

                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">Chocolate Bar</div>
                            <div class="text-[10px] text-slate-400">Sweet treat (+5 Happiness)</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="chocolate" class="bg-green-700 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $8
                        </button>
                    </div>

                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">Pack of Cigarettes</div>
                            <div class="text-[10px] text-amber-400">Contraband trade currency</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="cigarettes" class="bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $30
                        </button>
                    </div>

                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">Handmade Shank</div>
                            <div class="text-[10px] text-red-400">Weapon for self-defense</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="shank" class="bg-red-800 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $80
                        </button>
                    </div>

                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">Contraband Cellphone</div>
                            <div class="text-[10px] text-purple-400">Outside contact & legal help</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="cellphone" class="bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $180
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLegalContent(user, stats) {
    return `
        <div class="space-y-3">
            <!-- Study Law -->
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow">
                <div class="flex items-center gap-3 border-b border-slate-700/60 pb-2">
                    <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xl shrink-0">
                        <i class="fas fa-book-journal-whills"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-cyan-400 uppercase tracking-wider">Prison Legal Library</div>
                        <h3 class="text-sm font-bold text-white">Study Appellate Precedent</h3>
                        <div class="text-xs text-slate-400">Current Law Study Points: <strong class="text-cyan-300">${stats.lawStudied || 0} pts</strong></div>
                    </div>
                </div>
                <p class="text-xs text-slate-300">Study state penal codes and case precedents to prepare a formal legal petition for appeal.</p>
                <button data-action="handleStudyLaw" class="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs transition">
                    Study Law Precedent (+15 Law Points, +2 Smarts)
                </button>
            </div>

            <!-- Appeal Trial -->
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-gavel"></i> File Legal Sentence Appeal
                </div>
                <p class="text-xs text-slate-300">Submit a formal writ of habeas corpus or appeal to the District Appellate Court to overturn your conviction.</p>
                <div class="space-y-2 pt-1">
                    <button data-action="handleFileAppeal" data-args="self" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition border border-slate-600">
                        <span><i class="fas fa-user-edit mr-2 text-cyan-400"></i>Self-Represented Petition (Pro Se)</span>
                        <span class="text-[10px] font-bold text-emerald-400">FREE</span>
                    </button>
                    <button data-action="handleFileAppeal" data-args="private" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition border border-slate-600">
                        <span><i class="fas fa-briefcase mr-2 text-indigo-400"></i>Appellate Attorney Defense</span>
                        <span class="text-[10px] font-bold text-white">$5,000</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderVisitingContent(user, stats) {
    const relationships = user.relationships || [];
    const isExpecting = user.isExpecting;

    return `
        <div class="space-y-3">
            ${isExpecting ? `
                <div class="bg-pink-950/80 border border-pink-700/80 p-3 rounded-xl flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-pink-900 flex items-center justify-center text-pink-300 text-xl shrink-0">
                        <i class="fas fa-baby"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-pink-300 uppercase tracking-wide">Pregnancy Expecting</div>
                        <div class="text-xs text-slate-300">You are expecting a baby while serving your prison sentence! Delivery will occur on your next age-up.</div>
                    </div>
                </div>
            ` : ''}

            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow">
                <div class="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center justify-between">
                    <span><i class="fas fa-user-group mr-1.5"></i> Outside Visiting Room & Mail</span>
                    <span class="text-[11px] text-slate-400">Cash: ${Utils.formatMoney(stats.canteenCash || 0)}</span>
                </div>
                <p class="text-xs text-slate-300">Incarceration strains social ties. Write handwritten letters or request visits to preserve relationships with spouse, family, and friends.</p>
                
                <div class="space-y-2.5 pt-1 max-h-72 overflow-y-auto">
                    ${relationships.length > 0 ? relationships.map(rel => {
                        const isSpouseOrPartner = rel.category === 'spouse' || rel.category === 'partner';
                        return `
                            <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-bold text-white text-xs flex items-center gap-1.5">
                                            ${Utils.escapeHtml(rel.name)}
                                            <span class="text-[9px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">${Utils.escapeHtml(rel.type || rel.category)}</span>
                                        </div>
                                        <div class="text-[10px] text-slate-400">Status: <strong class="text-emerald-400">${rel.status || 50}%</strong></div>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-1.5 pt-1">
                                    <button data-action="handleSendPrisonLetter" data-args="${rel.id}" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] py-1.5 rounded-lg transition border border-slate-600">
                                        <i class="fas fa-envelope text-amber-400 mr-1"></i> Send Letter ($5)
                                    </button>
                                    <button data-action="handlePrisonVisit" data-args="${rel.id}" class="flex-1 bg-pink-800 hover:bg-pink-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition">
                                        <i class="fas fa-hand-holding-heart mr-1"></i> Standard Visit
                                    </button>
                                    ${isSpouseOrPartner ? `
                                        <button data-action="handleConjugalVisit" data-args="${rel.id}" class="w-full bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 font-bold text-[11px] py-1.5 rounded-lg transition">
                                            <i class="fas fa-heart text-rose-400 mr-1"></i> Request Conjugal Visit (Pregnancy Risk)
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="text-xs text-slate-500 italic">No active outside family or friends.</div>'}
                </div>
            </div>
        </div>
    `;
}

function renderEscapeContent(user, stats) {
    const total = user.prisonTotalSentence || 1;
    const remaining = user.prisonSentenceRemaining || 1;
    const served = total - remaining;
    const isParoleEligible = served >= Math.ceil(total * 0.5);

    return `
        <div class="space-y-3">
            <!-- Parole Hearing -->
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow">
                <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-award"></i> State Parole Board Hearing
                    </div>
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isParoleEligible ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500 border border-slate-800'}">
                        ${isParoleEligible ? 'ELIGIBLE' : 'LOCKED'}
                    </span>
                </div>
                <div class="text-xs text-slate-300 leading-relaxed">
                    Must serve at least <strong>50% of sentence</strong> (${Math.ceil(total * 0.5)} yrs). Good Behavior points (${stats.goodBehaviorPoints || 0}) and Guard Favor (${stats.guardRelation || 50}%) increase approval odds.
                </div>
                <button data-action="handleParoleHearing" class="w-full ${isParoleEligible ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 opacity-60 cursor-not-allowed'} text-white font-bold py-2.5 rounded-xl text-xs transition">
                    Submit Application to Parole Board
                </button>
            </div>

            <!-- Escape Plan -->
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow">
                <div class="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-person-running text-red-500"></i> High-Stakes Prison Escape
                </div>
                <p class="text-xs text-red-300/90 leading-relaxed">
                    <i class="fas fa-exclamation-triangle text-amber-400 mr-1"></i>
                    Failing an escape adds <strong>+5 years sentence</strong>, transfers you to Maximum Security, and places you in Solitary Confinement!
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                    <button data-action="handlePrisonEscapeAction" data-args="tunnel" class="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold p-2.5 rounded-xl text-left transition">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-bore-hole text-amber-400"></i> Dig Cell Tunnel</div>
                        <div class="text-[10px] text-slate-400 font-normal">Uses Smarts & Strength</div>
                    </button>
                    <button data-action="handlePrisonEscapeAction" data-args="bribe_guard" class="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold p-2.5 rounded-xl text-left transition">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-hand-holding-dollar text-green-400"></i> Bribe Guard</div>
                        <div class="text-[10px] text-slate-400 font-normal">Uses Guard Favor & Cash</div>
                    </button>
                    <button data-action="handlePrisonEscapeAction" data-args="laundry_cart" class="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold p-2.5 rounded-xl text-left transition">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-shirt text-indigo-400"></i> Hide in Laundry Cart</div>
                        <div class="text-[10px] text-slate-400 font-normal">Uses Agility & Looks</div>
                    </button>
                    <button data-action="handlePrisonEscapeAction" data-args="fence_cut" class="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold p-2.5 rounded-xl text-left transition">
                        <div class="font-bold flex items-center gap-1.5"><i class="fas fa-scissors text-red-400"></i> Wire Fence Cut</div>
                        <div class="text-[10px] text-slate-400 font-normal">Uses Health & Stamina</div>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Action Event Handlers
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

export function openContrabandPhoneModal() {
    const user = state.gameState.user;
    const relationships = user.relationships || [];

    const contactsHtml = relationships.length > 0 ? `
        <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-300">Select Outside Loved One to Contact</label>
            <div class="space-y-1.5 max-h-40 overflow-y-auto">
                ${relationships.map(r => `
                    <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                        <div>
                            <span class="font-bold text-white">${Utils.escapeHtml(r.name)}</span>
                            <span class="text-[10px] text-slate-400"> (${Utils.escapeHtml(r.type || r.category)})</span>
                        </div>
                        <button data-action="submitContrabandPhoneAction" data-args="contact, ${r.id}" class="bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition">
                            Secret Call / Text
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '<div class="text-xs text-slate-500 italic">No outside contacts available.</div>';

    const html = `
        <div class="space-y-4 text-left">
            <div class="bg-purple-950/60 border border-purple-800/80 p-3 rounded-xl space-y-1">
                <div class="font-bold text-white text-base flex items-center justify-between">
                    <span class="flex items-center gap-2"><i class="fas fa-mobile-screen text-amber-400"></i> Smuggled Contraband Phone</span>
                    <span class="text-xs uppercase font-extrabold text-amber-400">15% RISK</span>
                </div>
                <p class="text-xs text-slate-300">Secretly call family/spouse or contact your appellate legal team directly from your cell mattress.</p>
            </div>

            <div class="space-y-3">
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-scale-balanced"></i> Direct Legal Team Hotline
                    </div>
                    <p class="text-xs text-slate-300">Consult private appellate defense advocates (+35 Law Study Points, +3 Smarts).</p>
                    <button data-action="submitContrabandPhoneAction" data-args="legal, null" class="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs transition">
                        Call Outside Legal Defense Hotline
                    </button>
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div class="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-heart"></i> Secret Outside Contacts
                    </div>
                    ${contactsHtml}
                </div>
            </div>

            <div class="text-[11px] text-amber-400/90 italic flex items-center gap-1.5 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50">
                <i class="fas fa-triangle-exclamation"></i> Guard shakedowns or phone calls carry a 15% risk of discovery (+1 yr sentence penalty & solitary).
            </div>
        </div>
    `;

    UI.showCustomModal("Contraband Cellphone", html);
}

export function submitContrabandPhoneAction(action, targetId) {
    const user = state.gameState.user;
    UI.hideModal();

    const result = GameLogic.useContrabandPhone(user, action, targetId);

    if (result.caught) {
        addLog(result.msg, 'bad');
        UI.showModal("Guard Raid!", result.msg);
    } else if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Phone Call Complete", result.msg);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Phone Error", result.msg);
    }

    if (typeof saveGame === 'function') saveGame();
    renderPrisonDashboard();
}

export function openDealerBuyModal() {
    const user = state.gameState.user;
    const stats = user.prisonStats || {};

    const catalog = [
        { id: 'paper_pen', name: 'Writing Paper & Pen', price: 12, desc: 'Send letters to outside contacts' },
        { id: 'cigarettes', name: 'Pack of Cigarettes', price: 30, desc: 'Prison currency & trade good' },
        { id: 'shank', name: 'Handmade Shank', price: 80, desc: 'Protection in cell brawls (High Risk)' },
        { id: 'cellphone', name: 'Contraband Cellphone', price: 180, desc: 'Secret outside calls & legal help' }
    ];

    const html = `
        <div class="space-y-3 text-left">
            <div class="bg-purple-950/60 border border-purple-800/80 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-purple-400">Contraband Dealer Store</div>
                    <div class="text-xs text-slate-300">Buy illicit goods for canteen cash.</div>
                </div>
                <div class="text-xs font-black text-green-400">Canteen: ${Utils.formatMoney(stats.canteenCash || 0)}</div>
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto">
                ${catalog.map(item => `
                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs">${item.name}</div>
                            <div class="text-[10px] text-slate-400">${item.desc}</div>
                        </div>
                        <button data-action="handleBuyCanteen" data-args="${item.id}" class="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            $${item.price}
                        </button>
                    </div>
                `).join('')}
            </div>

            <button data-action="hideModal" class="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Cancel & Exit
            </button>
        </div>
    `;

    UI.showCustomModal("Contraband Dealer - Buy", html);
}

export function openDealerSellModal() {
    const user = state.gameState.user;
    const stats = user.prisonStats || {};
    const contrabandList = stats.contraband || [];

    const sellValues = {
        'Writing Paper & Pen': 8,
        'Pack of Cigarettes': 20,
        'Handmade Shank': 50,
        'Contraband Cellphone': 120
    };

    const itemsHtml = contrabandList.length > 0 ? `
        <div class="space-y-2 max-h-60 overflow-y-auto">
            ${contrabandList.map((itemName, index) => {
                const price = sellValues[itemName] || 15;
                return `
                    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-xs flex items-center gap-1.5">
                                <i class="fas fa-box text-amber-400 text-xs"></i> ${itemName}
                            </div>
                            <div class="text-[10px] text-slate-400">Sell Value: <strong class="text-green-400">$${price} Canteen Cash</strong></div>
                        </div>
                        <button data-action="handleSellContrabandAction" data-args="${index}" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                            Sell ($${price})
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '<div class="text-xs text-slate-500 italic text-center py-4 bg-slate-900/60 rounded-xl border border-slate-800">You don\'t have any contraband items stashed in your cell to sell.</div>';

    const html = `
        <div class="space-y-3 text-left">
            <div class="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-emerald-400">Sell Contraband to Dealer</div>
                    <div class="text-xs text-slate-300">Convert your cell stash items into canteen cash.</div>
                </div>
                <div class="text-xs font-black text-green-400">Canteen: ${Utils.formatMoney(stats.canteenCash || 0)}</div>
            </div>

            ${itemsHtml}

            <button data-action="hideModal" class="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Cancel & Exit
            </button>
        </div>
    `;

    UI.showCustomModal("Contraband Dealer - Sell", html);
}

export function handleSellContrabandAction(itemIndex) {
    const user = state.gameState.user;
    const result = GameLogic.sellContrabandItem(user, parseInt(itemIndex));

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Item Sold", result.msg);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Sale Error", result.msg);
    }

    renderPrisonDashboard();
}

export function handleSolitaryActivity(actType) {
    const user = state.gameState.user;
    const result = GameLogic.doSolitaryActivity(user, actType);

    if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Solitary Confinement Activity", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🔒</div>
                <h4 class="font-bold text-amber-400 text-sm">Isolation Exercise</h4>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Solitary Activity Error", result.msg);
    }

    renderPrisonDashboard();
}

export function openInmateDetailModal(inmateId) {
    const user = state.gameState.user;
    const stats = user.prisonStats || {};
    let inmate = null;
    let isCellmate = false;

    if (inmateId === 'cellmate') {
        inmate = user.cellmate;
        isCellmate = true;
    } else {
        inmate = (user.yardInmates || []).find(i => String(i.id) === String(inmateId));
    }

    if (!inmate) return;

    let actionButtons = `
        <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;chat&apos;" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
            <i class="fas fa-comments text-amber-400"></i> Talk & Chat
        </button>
    `;

    if (isCellmate) {
        actionButtons += `
            <button data-action="handleCellmateAction" data-args="share_snack" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
                <i class="fas fa-cookie-bite text-green-400"></i> Share Snack ($10)
            </button>
        `;
    }

    if (inmate.role === 'Yard Boss') {
        actionButtons += `
            <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;protection&apos;" class="bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-amber-600">
                <i class="fas fa-shield-halved text-amber-400"></i> Pay Protection ($50)
            </button>
            <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;challenge_boss&apos;" class="bg-red-900/80 hover:bg-red-800 text-red-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-red-700">
                <i class="fas fa-crown text-yellow-400"></i> Challenge Supremacy
            </button>
        `;
    }

    if (inmate.role === 'Contraband Dealer') {
        actionButtons += `
            <button data-action="openDealerBuyModal" class="bg-purple-800/80 hover:bg-purple-700 text-purple-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-purple-600">
                <i class="fas fa-store text-purple-300"></i> Buy Contraband
            </button>
            <button data-action="openDealerSellModal" class="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-emerald-600">
                <i class="fas fa-hand-holding-dollar text-emerald-300"></i> Sell Contraband
            </button>
        `;
    }

    if (inmate.role === 'Gang Recruiter') {
        if (stats.gang === 'None') {
            actionButtons += `
                <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;join_gang&apos;" class="bg-red-800/80 hover:bg-red-700 text-red-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-red-600">
                    <i class="fas fa-users-line text-red-300"></i> Join Prison Gang
                </button>
            `;
        } else {
            actionButtons += `
                <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;gang_mission&apos;" class="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-emerald-600">
                    <i class="fas fa-person-burst text-emerald-300"></i> Accept Gang Favor
                </button>
            `;
        }
    }

    if (inmate.role === 'Prison Snitch') {
        actionButtons += `
            <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;bribe_snitch&apos;" class="bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-amber-600">
                <i class="fas fa-sack-dollar text-amber-300"></i> Bribe Snitch ($25)
            </button>
            <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;confront_snitch&apos;" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
                <i class="fas fa-bullhorn text-amber-400"></i> Confront Snitch
            </button>
        `;
        if (stats.contraband && stats.contraband.length > 0) {
            actionButtons += `
                <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;frame_snitch&apos;" class="bg-purple-900/80 hover:bg-purple-800 text-purple-100 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-purple-700">
                    <i class="fas fa-mask text-purple-300"></i> Frame Snitch
                </button>
            `;
        }
    }

    const targetTypeArg = isCellmate ? 'cellmate' : 'yard_inmate';
    const targetIdArg = isCellmate ? 'cellmate' : inmate.id;

    actionButtons += `
        <button data-action="openAttackPromptModal" data-args="${targetTypeArg}, ${targetIdArg}" class="col-span-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 font-extrabold p-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow">
            <i class="fas fa-hand-fist text-red-500 text-sm"></i> ⚔️ Attack Inmate
        </button>
    `;

    const html = `
        <div class="space-y-4 text-left">
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                <div class="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0 shadow-lg">
                    ${renderAvatar(inmate)}
                </div>
                <div class="space-y-1 min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <h3 class="text-base font-extrabold text-white truncate">${Utils.escapeHtml(inmate.name)}</h3>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-700 font-bold shrink-0">${isCellmate ? 'Cellmate' : Utils.escapeHtml(inmate.role)}</span>
                    </div>
                    <div class="text-xs text-slate-400">Age: ${inmate.age} • Conviction: <span class="text-slate-200 font-semibold">${Utils.escapeHtml(inmate.crime)}</span></div>
                    <div class="text-xs text-slate-400">${inmate.perk ? Utils.escapeHtml(inmate.perk) : 'Cellmate in your block'}</div>
                </div>
            </div>

            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-400">Relationship Status</span>
                    <span class="font-black text-emerald-400">${inmate.status || 50}%</span>
                </div>
                <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${inmate.status || 50}%"></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                ${actionButtons}
            </div>

            <button data-action="hideModal" class="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;

    UI.showCustomModal(Utils.escapeHtml(inmate.name), html);
}

export function openAttackPromptModal(targetType, targetId) {
    const user = state.gameState.user;
    const stats = user.prisonStats || {};
    const hasShank = stats.contraband && stats.contraband.includes('Handmade Shank');

    let targetName = 'Inmate';
    if (targetType === 'cellmate') {
        targetName = user.cellmate ? user.cellmate.name : 'Cellmate';
    } else {
        const found = (user.yardInmates || []).find(i => String(i.id) === String(targetId));
        if (found) targetName = found.name;
    }

    const html = `
        <div class="space-y-4 text-left">
            <div class="bg-red-950/80 border border-red-800 p-3.5 rounded-xl space-y-1">
                <div class="font-bold text-red-400 text-sm flex items-center gap-2">
                    <i class="fas fa-hand-fist text-red-400"></i> Attack ${Utils.escapeHtml(targetName)}
                </div>
                <p class="text-xs text-slate-300">Select your weapon or method for attacking ${Utils.escapeHtml(targetName)}.</p>
            </div>

            <div class="space-y-2">
                <button data-action="executeInmateAttack" data-args="${targetType}, ${targetId}, fists" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-xl text-xs text-left transition border border-slate-700 flex items-center justify-between">
                    <div>
                        <div class="font-extrabold flex items-center gap-2 text-white">
                            <i class="fas fa-hand-fist text-amber-400"></i> Attack with Bare Fists
                        </div>
                        <div class="text-[10px] text-slate-400">Brawling damage</div>
                    </div>
                    <span class="bg-slate-900 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-bold">Fists</span>
                </button>

                <button data-action="executeInmateAttack" data-args="${targetType}, ${targetId}, shank" class="w-full ${hasShank ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border-red-700' : 'bg-slate-900 opacity-50 cursor-not-allowed text-slate-500 border-slate-800'} font-bold p-3 rounded-xl text-xs text-left transition border flex items-center justify-between" ${!hasShank ? 'disabled' : ''}>
                    <div>
                        <div class="font-extrabold flex items-center gap-2 text-red-300">
                            <i class="fas fa-khanda text-red-400"></i> Attack with Handmade Shank
                        </div>
                        <div class="text-[10px] text-slate-300">${hasShank ? 'High Lethality' : 'Requires Handmade Shank in cell stash'}</div>
                    </div>
                    <span class="bg-red-950 text-red-200 text-xs px-2.5 py-1 rounded-lg border border-red-800 font-bold">Shank</span>
                </button>
            </div>

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Cancel Attack
            </button>
        </div>
    `;

    UI.showCustomModal("Confirm Attack", html);
}

export function executeInmateAttack(targetType, targetId, weaponType) {
    const user = state.gameState.user;
    UI.hideModal();

    const result = GameLogic.attackPrisonInmate(user, targetType, targetId, weaponType);

    if (result.killed) {
        addLog(result.msg, 'bad');
        UI.showModal("FATAL ATTACK!", `
            <div class="text-center space-y-3">
                <div class="text-5xl">🩸</div>
                <h3 class="text-lg font-black text-red-500 uppercase tracking-wide">FATAL INMATE HOMICIDE</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else if (result.solitary) {
        addLog(result.msg, 'bad');
        UI.showModal("Guards Intervened!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🚨</div>
                <h3 class="text-base font-bold text-red-500 uppercase tracking-wide">Sent to Solitary Confinement</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else if (result.success) {
        addLog(result.msg, 'good');
        UI.showModal("Brawl Victory!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🥊</div>
                <h3 class="text-base font-bold text-emerald-400">Inmate Overpowered</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    } else {
        addLog(result.msg, 'bad');
        UI.showModal("Brawl Defeat!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🤕</div>
                <h3 class="text-base font-bold text-red-400">Overpowered in Brawl</h3>
                <p class="text-xs text-slate-300">${result.msg}</p>
            </div>
        `);
    }

    renderPrisonDashboard();
}

export function renderNewCellmateModal(newCm) {
    if (!newCm) {
        renderPrisonDashboard();
        return;
    }

    const html = `
        <div class="space-y-4 text-center">
            <div class="w-20 h-20 rounded-full bg-slate-900 border-2 border-amber-400 mx-auto overflow-hidden shadow-lg">
                ${renderAvatar(newCm)}
            </div>
            <div>
                <h3 class="text-lg font-extrabold text-white">${Utils.escapeHtml(newCm.name)}</h3>
                <div class="text-xs text-amber-400 font-bold uppercase tracking-wider">New Cellmate Assigned</div>
                <div class="text-xs text-slate-300 mt-1">Age ${newCm.age} • Serving time for <span class="text-white font-semibold">${Utils.escapeHtml(newCm.crime)}</span></div>
            </div>
            <p class="text-xs text-slate-400 bg-slate-800 p-3 rounded-xl border border-slate-700">
                You have been assigned a new cellmate in your block. Introduce yourself or build a relationship!
            </p>
            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition border border-slate-600">
                Acknowledge Cellmate
            </button>
        </div>
    `;

    UI.showCustomModal("New Cellmate Assigned", html);
    renderPrisonDashboard();
}

