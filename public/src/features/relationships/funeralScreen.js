import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { saveGame } from '../../core/main.js';
import { GameLogic } from '../../core/gameLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

export const processNextFuneral = () => {
    if (!state.gameState.pendingFunerals || state.gameState.pendingFunerals.length === 0) {
        // Queue is empty, check pending teacher replacements or proceed to dashboard
        if (state.gameState.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0) {
            processNextTeacherReplacement();
            return;
        }
        renderLifeDashboard(state.gameState);
        if (typeof saveGame === "function") saveGame();
        return;
    }

    // Get the first pending funeral
    const deceased = state.gameState.pendingFunerals[0];
    renderFuneralScreen(deceased);
};

export const processNextTeacherReplacement = () => {
    const queue = state.gameState.pendingTeacherReplacements;
    if (!queue || queue.length === 0) {
        renderLifeDashboard(state.gameState);
        if (typeof saveGame === "function") saveGame();
        return;
    }

    const item = queue[0];
    const user = state.gameState.user;

    // Generate or retrieve the new replacement teacher for this prompt
    if (!item.newTeacher) {
        item.newTeacher = GameLogic.generateReplacementTeacher(user.age);
    }

    const newTeacher = item.newTeacher;

    const modalHtml = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <div class="w-20 h-20 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center mx-auto mb-3 border-2 border-slate-500 shadow-xl">
                ${renderAvatar(newTeacher)}
            </div>
            <div class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Classroom Update</div>
            <h1 class="text-3xl font-bold text-white mb-2">New Teacher Assigned</h1>
            <p class="text-slate-300 text-sm mb-6">
                Following the tragic passing of <span class="font-bold text-amber-300">${Utils.escapeHtml(item.deceasedTeacherName)}</span>, your new teacher is <span class="font-bold text-white">${Utils.escapeHtml(newTeacher.name)}</span> (Age ${newTeacher.age}).
            </p>
            
            <div class="w-full space-y-3">
                <button data-action="respondNewTeacher" data-args="'hello'" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition group shadow-lg">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-hand text-xl"></i>
                        <div class="text-left">
                            <div class="font-bold text-sm">Say Hello</div>
                            <div class="text-[11px] text-emerald-200">Polite & friendly greeting (+15 Status)</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-emerald-300 group-hover:translate-x-1 transition"></i>
                </button>

                <button data-action="respondNewTeacher" data-args="'side_eye'" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition group">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-eye text-xl text-amber-400"></i>
                        <div class="text-left">
                            <div class="font-bold text-sm text-white">Give ${Utils.escapeHtml(newTeacher.name)} the side eye</div>
                            <div class="text-[11px] text-slate-400">Skeptical & distant reaction (-15 Status)</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-500 group-hover:translate-x-1 transition"></i>
                </button>
            </div>
        </div>
    `;

    UI.hideBottomNav();
    UI.renderScreen(modalHtml);
};

export const respondNewTeacher = (reaction) => {
    const queue = state.gameState.pendingTeacherReplacements;
    if (!queue || queue.length === 0) return;

    const item = queue.shift();
    const user = state.gameState.user;
    const newTeacher = item.newTeacher;

    if (!user.relationships) user.relationships = [];

    if (reaction === 'hello') {
        newTeacher.status = Math.min(100, (newTeacher.status || 30) + 15);
        addLog(`You politely introduced yourself to your new teacher, ${newTeacher.name}. (+15 Relationship)`, 'good');
    } else {
        newTeacher.status = Math.max(0, (newTeacher.status || 30) - 15);
        addLog(`You gave your new teacher, ${newTeacher.name}, the side eye when they entered the classroom. (-15 Relationship)`, 'neutral');
    }

    user.relationships.push(newTeacher);

    processNextTeacherReplacement();
};

const renderFuneralScreen = (deceased) => {
    const user = state.gameState.user;
    
    // Evaluate if they are family
    const isFamily = ['family', 'spouse', 'child'].includes(deceased.category);
    
    // Check Inheritance if parents or spouse
    let inheritanceMsg = '';
    const isSpouse = ['Husband', 'Wife'].includes(deceased.type);
    if (['Mother', 'Father'].includes(deceased.type) || isSpouse) {
        // Roll for inheritance/payout only if we haven't already
        if (deceased.inheritanceAmt === undefined) {
            // A spouse already shares your household finances — there's no separate
            // "savings" to inherit, only the (uncommon) chance of a life insurance payout.
            deceased.inheritanceAmt = Math.max(0, isSpouse
                ? GameLogic.calculateSpousalLifeInsurance()
                : GameLogic.calculateInheritance(deceased.age));
        }

        const inheritanceAmt = deceased.inheritanceAmt;
        const label = isSpouse ? 'Life Insurance' : 'Inheritance';
        if (inheritanceAmt > 0) {
            inheritanceMsg = `<div class="bg-green-900/30 p-3 rounded-xl border border-green-700/50 mb-6 text-center shadow-lg">
                <i class="fas fa-file-invoice-dollar text-green-400 text-2xl mb-2"></i>
                <h3 class="text-green-400 font-bold text-lg">${label}</h3>
                <p class="text-slate-300 text-sm">They left you <span class="font-bold text-white">${Utils.formatMoney(inheritanceAmt)}</span>.</p>
            </div>`;
        } else if (isSpouse) {
            inheritanceMsg = `<div class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-6 text-center">
                <i class="fas fa-file-invoice-dollar text-slate-500 text-2xl mb-2"></i>
                <h3 class="text-slate-400 font-bold text-lg">Life Insurance</h3>
                <p class="text-slate-500 text-sm italic">They didn't have a policy that paid out.</p>
            </div>`;
        } else {
            inheritanceMsg = `<div class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-6 text-center">
                <i class="fas fa-file-invoice-dollar text-slate-500 text-2xl mb-2"></i>
                <h3 class="text-slate-400 font-bold text-lg">Inheritance</h3>
                <p class="text-slate-500 text-sm italic">They didn't leave anything behind.</p>
            </div>`;
        }
    } else {
        // Only parents and spouses leave inheritance currently
        deceased.inheritanceAmt = 0;
    }

    let optionsHtml = '';
    // Minors (< 18) are not expected to plan funerals, even for family members
    if (isFamily && user.age >= 18) {
        optionsHtml = `
            <button data-action="chooseFuneralType" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                        <i class="fas fa-church"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-white font-bold">Plan Their Funeral</div>
                        <div class="text-xs text-slate-400">Costs money</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600 group-hover:text-white transition"></i>
            </button>
            <button data-action="donateBody" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center text-green-400">
                        <i class="fas fa-microscope"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-white font-bold">Donate Body to Science</div>
                        <div class="text-xs text-slate-400">Free</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600 group-hover:text-white transition"></i>
            </button>
            <button data-action="lookTheOtherWay" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center text-red-400">
                        <i class="fas fa-eye-slash"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-white font-bold">Look the Other Way</div>
                        <div class="text-xs text-slate-400">Let the city handle it</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600 group-hover:text-white transition"></i>
            </button>
        `;
    } else {
        optionsHtml = `
            <button data-action="goToFuneral" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-white font-bold">Attend Funeral</div>
                        <div class="text-xs text-slate-400">Pay your respects</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600 group-hover:text-white transition"></i>
            </button>
            <button data-action="skipFuneral" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                        <i class="fas fa-home"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-white font-bold">Not Attend Funeral</div>
                        <div class="text-xs text-slate-400">Stay home</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600 group-hover:text-white transition"></i>
            </button>
        `;
    }

    const html = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <div class="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center mx-auto mb-3 border border-slate-600 opacity-75">
                ${renderAvatar(deceased)}
            </div>
            <i class="fas fa-tombstone text-4xl text-slate-600 mb-6"></i>
            <h1 class="text-3xl font-bold text-white mb-2">Tragedy Strikes</h1>
            <p class="text-slate-300 text-sm mb-6">Your ${Utils.escapeHtml(deceased.type)}, ${Utils.escapeHtml(deceased.name)}, died at age ${deceased.age} from ${Utils.escapeHtml(deceased.deathCause)}</p>
            
            <div class="w-full">
                ${inheritanceMsg}
                <h3 class="text-slate-400 font-bold text-xs uppercase mb-3 text-left pl-1">How will you respond?</h3>
                ${optionsHtml}
            </div>
        </div>
    `;

    UI.hideBottomNav();
    UI.renderScreen(html);
};

// --- FUNERAL ROUTING & ACTIONS ---

export const chooseFuneralType = () => {
    const deceased = state.gameState.pendingFunerals[0];
    const user = state.gameState.user;

    const options = [
        { name: "Bury", cost: 5000, desc: "A traditional burial plot" },
        { name: "Cremate", cost: 1500, desc: "A standard cremation service" },
        { name: "Scatter Ashes", cost: 3000, desc: "A service at their favorite spot" },
        { name: "Send to Space", cost: 15000, desc: "A memorial spaceflight" }
    ];

    const html = options.map((opt, i) => {
        const canAfford = user.money >= opt.cost;
        if (canAfford) {
            return `
                <button data-action="confirmFuneralPlan" data-args="${i}" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                    <div class="text-left">
                        <div class="text-white font-bold">${opt.name}</div>
                        <div class="text-xs text-slate-400">${opt.desc}</div>
                    </div>
                    <div class="font-bold text-red-400">-${Utils.formatMoney(opt.cost)}</div>
                </button>
            `;
        } else {
            return `
                <button disabled class="w-full bg-slate-900 border border-slate-800 text-slate-500 font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div class="text-left">
                        <div class="font-bold">${opt.name}</div>
                        <div class="text-xs">${opt.desc}</div>
                    </div>
                    <div class="font-bold">INSUFFICIENT FUNDS</div>
                </button>
            `;
        }
    }).join('');

    const screenHtml = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-church text-6xl text-slate-600 mb-6"></i>
            <h1 class="text-3xl font-bold text-white mb-2">Plan Funeral</h1>
            <p class="text-slate-300 text-sm mb-6">Choose how to lay ${Utils.escapeHtml(deceased.name)} to rest.</p>
            <div class="w-full mb-6 text-right">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Bank Balance</span><br>
                <span class="text-green-400 font-bold text-xl">${Utils.formatMoney(user.money)}</span>
            </div>
            <div class="w-full">
                ${html}
                <button data-action="cancelFuneralPlan" class="w-full mt-4 text-slate-400 hover:text-white text-sm">Go Back</button>
            </div>
        </div>
    `;

    UI.hideBottomNav();
    UI.renderScreen(screenHtml);
};

export const cancelFuneralPlan = () => {
    // Go back to the main funeral screen
    const deceased = state.gameState.pendingFunerals[0];
    renderFuneralScreen(deceased);
};

export const confirmFuneralPlan = (index) => {
    const deceased = state.gameState.pendingFunerals[0];
    const user = state.gameState.user;
    
    const options = [
        { name: "Bury", cost: 5000 },
        { name: "Cremate", cost: 1500 },
        { name: "Scatter Ashes", cost: 3000 },
        { name: "Send to Space", cost: 15000 }
    ];
    
    const opt = options[index];
    user.money -= opt.cost;
    
    addLog(`You chose to ${opt.name.toLowerCase()} ${deceased.name} for ${Utils.formatMoney(opt.cost)}.`, 'neutral');
    
    finishFuneralAndNext(deceased);
};

export const donateBody = () => {
    const deceased = state.gameState.pendingFunerals[0];
    addLog(`You donated ${deceased.name}'s body to science.`, 'neutral');
    finishFuneralAndNext(deceased);
};

export const lookTheOtherWay = () => {
    const deceased = state.gameState.pendingFunerals[0];
    const user = state.gameState.user;
    GameLogic.adjustStat(user, 'happiness', -10);
    addLog(`You ignored the responsibility of ${deceased.name}'s remains. The state handled it. (-10 Happiness)`, 'bad');
    UI.showModal("Shameful", `You turned a blind eye to your own ${Utils.escapeHtml(deceased.type)}'s remains. The city handled a pauper's grave for them.`);
    finishFuneralAndNext(deceased);
};

export const goToFuneral = () => {
    const deceased = state.gameState.pendingFunerals[0];
    addLog(`You attended ${deceased.name}'s funeral and paid your respects.`, 'neutral');
    finishFuneralAndNext(deceased);
};

export const skipFuneral = () => {
    const deceased = state.gameState.pendingFunerals[0];
    const user = state.gameState.user;
    GameLogic.adjustStat(user, 'happiness', -5);
    addLog(`You skipped ${deceased.name}'s funeral.`, 'neutral');
    finishFuneralAndNext(deceased);
};

const finishFuneralAndNext = (deceased) => {
    const user = state.gameState.user;
    
    // Grief deduction based on relationship closeness
    const griefDeduction = ['spouse', 'child'].includes(deceased.category) ? -25 : (['family', 'partner'].includes(deceased.category) ? -15 : -10);
    GameLogic.adjustStat(user, 'happiness', griefDeduction);

    // Process inheritance
    if (deceased.inheritanceAmt > 0) {
        user.money += deceased.inheritanceAmt;
        addLog(`Inherited ${Utils.formatMoney(deceased.inheritanceAmt)} from ${deceased.name}.`, 'good');
    }

    // Archive if family
    if (['family', 'spouse', 'child'].includes(deceased.category)) {
        if (!user.deceasedFamily) user.deceasedFamily = [];
        user.deceasedFamily.push({
            id: deceased.id,
            name: deceased.name,
            type: deceased.type,
            deathAge: deceased.age,
            deathCause: deceased.deathCause,
            yearDied: user.age
        });
    }

    UI.updateHeader(user);

    // Remove from queue
    state.gameState.pendingFunerals.shift();
    
    // Process next
    processNextFuneral();
};
