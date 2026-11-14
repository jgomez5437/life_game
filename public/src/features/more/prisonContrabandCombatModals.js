import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { addLog } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { renderPrisonDashboard } from './prisonScreen.js';

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

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Close Phone
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Contraband Cellphone",
        content: html,
        showCloseBtn: true
    });
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

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Exit Store
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Contraband Dealer - Buy",
        content: html,
        showCloseBtn: true
    });
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

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2">
                <i class="fas fa-times"></i> Exit Store
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Contraband Dealer - Sell",
        content: html,
        showCloseBtn: true
    });
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

    let actionButtons = '';

    if (isCellmate) {
        actionButtons = `
            <button data-action="handleCellmateAction" data-args="talk" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
                <i class="fas fa-comments text-amber-400"></i> Talk & Chat
            </button>
            <button data-action="handleCellmateAction" data-args="share_snack" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
                <i class="fas fa-cookie-bite text-green-400"></i> Share Snack ($10)
            </button>
        `;
    } else {
        actionButtons = `
            <button data-action="handleInmateInteract" data-args="${inmate.id}, &apos;chat&apos;" class="bg-slate-700 hover:bg-slate-600 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600">
                <i class="fas fa-comments text-amber-400"></i> Talk & Chat
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
            <i class="fas fa-hand-fist text-red-500 text-sm"></i> Attack Inmate
        </button>
    `;

    actionButtons += `
        <button data-action="hideModal" class="col-span-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-600 mt-1">
            <i class="fas fa-arrow-left"></i> Close Interaction
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
        </div>
    `;

    UI.showCustomModal({
        title: Utils.escapeHtml(inmate.name),
        content: html,
        showCloseBtn: true
    });
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

    UI.showCustomModal({
        title: "Confirm Attack",
        content: html,
        showCloseBtn: true
    });
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

    UI.showCustomModal({
        title: "New Cellmate Assigned",
        content: html,
        showCloseBtn: true
    });
    renderPrisonDashboard();
}

