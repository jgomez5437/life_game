import { state } from '../../core/state.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

export function renderSolitaryContent(user, stats) {
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

export function renderCellBlockContent(user, stats) {
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

export function renderYardContent(user, stats) {
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

export function renderJobsCanteenContent(user, stats) {
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

export function renderLegalContent(user, stats) {
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

export function renderVisitingContent(user, stats) {
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

export function renderEscapeContent(user, stats) {
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
