import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, renderDeathScreen, addLog } from '../player/mainScreen.js';
import { processNextFuneral, processNextTeacherReplacement } from '../relationships/funeralScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils, COUNTRIES_DATA } from '../../ui/utils.js';
import { unlockAchievement } from '../../core/achievementManager.js';

const get = id => document.getElementById(id);

function renderSlimOptionRow({ icon, iconBg, iconColor, title, subtitle, badgeText, badgeColor, action, buttonText, buttonStyle, isLocked, lockText }) {
    return `
        <div class="bg-slate-800/90 hover:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 transition flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-lg ${iconBg} ${iconColor} border ${badgeColor || 'border-slate-700'} flex items-center justify-center text-sm shrink-0">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="min-w-0 flex-1 text-left">
                    <div class="font-bold text-white text-xs truncate flex items-center gap-1.5">
                        ${title}
                        ${badgeText ? `<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${badgeColor}">${badgeText}</span>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-400 truncate">${subtitle}</div>
                </div>
            </div>
            ${isLocked ? `
                <span class="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                    <i class="fas fa-lock text-[9px]"></i> ${lockText || 'Locked'}
                </span>
            ` : `
                <button data-action="${action}" class="${buttonStyle || 'bg-slate-700 hover:bg-slate-600 text-white'} font-bold text-xs px-2.5 py-1 rounded-lg transition shrink-0">
                    ${buttonText}
                </button>
            `}
        </div>
    `;
}

export function openSkillsModal() {
    UI.showModal("Skill Workshops & Education", `
        <div class="text-center space-y-3 py-2">
            <div class="text-4xl text-indigo-400">📚</div>
            <h3 class="text-lg font-bold text-white">Skills & Workshops</h3>
            <p class="text-xs text-slate-300">
                Enroll in specialized skill programs to boost your Smarts and open high-paying career paths.
            </p>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1.5">
                <div class="text-slate-300 font-semibold">• Computer Programming & Software</div>
                <div class="text-slate-300 font-semibold">• Public Speaking & Leadership</div>
                <div class="text-slate-300 font-semibold">• Martial Arts & Physical Defense</div>
                <div class="text-slate-300 font-semibold">• Culinary Arts & Gastronomy</div>
            </div>
            <p class="text-[11px] text-indigo-400 italic font-semibold">Skill workshop enrollment will be active in the upcoming expansion!</p>
        </div>
    `);
}

export function renderMoreDashboard() {
    const user = state.gameState?.user;
    if (!user) return;

    if (user.lifeStatus === 'Deceased') {
        renderDeathScreen(user, user.deathCause || 'natural causes');
        return;
    }

    if (state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0) {
        processNextFuneral();
        return;
    }

    if (state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0) {
        processNextTeacherReplacement();
        return;
    }
    const gymLocked = (user.age || 0) < 12;
    const dietLocked = (user.age || 0) <= 12;
    const lotteryLocked = (user.age || 0) < 18;
    const casinoLocked = (user.age || 0) < 18;
    const travelLocked = (user.age || 0) < 16;
    const currentDiet = GameLogic.getDietPlan(user.diet || (user.hasBetterDiet ? 'balanced' : 'junk'));
    const ticketsBought = user.lotteryTicketsBoughtThisYear || 0;
    const ticketsLeft = 10 - ticketsBought;

    UI.updateBottomNav('more');
    get('game-container').innerHTML = `
        <div class="flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-3 flex items-center justify-between">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <div class="mb-3 px-1 text-left">
                <h2 class="text-xl font-extrabold text-white">More Options</h2>
                <p class="text-slate-400 text-xs">Activities, health, entertainment & criminal endeavors.</p>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-6 space-y-4">

                <!-- CATEGORY 0: STORE & SPECIAL FEATURES -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-gem"></i> Store & Special Features
                    </div>
                    ${renderSlimOptionRow({
                        icon: 'fa-store',
                        iconBg: 'bg-amber-500/15',
                        iconColor: 'text-amber-400',
                        badgeColor: 'border-amber-500/40 text-amber-300',
                        title: 'Packs & Features Store',
                        subtitle: 'God Mode, Expansion Packs & Perks',
                        action: 'renderStoreScreen',
                        buttonText: 'Open Store',
                        buttonStyle: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    })}
                </div>

                <!-- CATEGORY 1: HEALTH & WELLNESS -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-heartbeat"></i> Health & Wellness
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-apple-alt',
                            iconBg: 'bg-emerald-950/60',
                            iconColor: 'text-emerald-400',
                            badgeColor: 'border-emerald-800/60 text-emerald-300 bg-emerald-950/40',
                            title: 'Diet Plan',
                            subtitle: `${currentDiet.name} (${currentDiet.monthlyCost > 0 ? `${Utils.formatMoney(currentDiet.monthlyCost)}/mo` : 'Free'})`,
                            action: 'openDietSelectionModal',
                            buttonText: 'Change',
                            buttonStyle: 'bg-emerald-700 hover:bg-emerald-600 text-white',
                            isLocked: dietLocked,
                            lockText: 'Age 13+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-dumbbell',
                            iconBg: 'bg-blue-950/60',
                            iconColor: 'text-blue-400',
                            badgeColor: 'border-blue-800/60 text-blue-300 bg-blue-950/40',
                            title: 'Gym Membership',
                            subtitle: user.gymMembership ? `Active Member ($50/mo)` : `Not a member`,
                            action: user.gymMembership ? 'visitGymOneTime' : 'buyGymMembership',
                            buttonText: user.gymMembership ? 'Workout Day' : `Join ($50/mo)`,
                            buttonStyle: user.gymMembership ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white',
                            isLocked: gymLocked,
                            lockText: 'Age 12+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-stethoscope',
                            iconBg: 'bg-red-950/60',
                            iconColor: 'text-red-400',
                            badgeColor: 'border-red-800/60 text-red-300',
                            title: 'Medical Checkup',
                            subtitle: `Visit Doctor (+10 Health)`,
                            action: 'visitDoctor',
                            buttonText: `Visit ($1,000)`,
                            buttonStyle: 'bg-red-700 hover:bg-red-600 text-white'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 2: EDUCATION & SKILLS -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-graduation-cap"></i> Education & Skills
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-book-open',
                            iconBg: 'bg-indigo-950/60',
                            iconColor: 'text-indigo-400',
                            badgeColor: 'border-indigo-800/60 text-indigo-300 bg-indigo-950/40',
                            title: 'Skill Workshops & Courses',
                            subtitle: 'Coding, Fitness, Cooking & Speaking',
                            action: 'openSkillsModal',
                            buttonText: 'Explore',
                            buttonStyle: 'bg-indigo-700 hover:bg-indigo-600 text-white'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 3: TRAVEL & LIFESTYLE -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-plane"></i> Travel & Lifestyle
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-plane-departure',
                            iconBg: 'bg-cyan-950/60',
                            iconColor: 'text-cyan-400',
                            badgeColor: 'border-cyan-800/60 text-cyan-300 bg-cyan-950/40',
                            title: 'Travel & Vacations',
                            subtitle: 'Local Getaways & Luxury Tours',
                            action: 'openTravelModal',
                            buttonText: 'Book Trip',
                            buttonStyle: 'bg-cyan-700 hover:bg-cyan-600 text-white',
                            isLocked: travelLocked,
                            lockText: 'Age 16+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-globe-americas',
                            iconBg: 'bg-emerald-950/60',
                            iconColor: 'text-emerald-400',
                            badgeColor: 'border-emerald-800/60 text-emerald-300 bg-emerald-950/40',
                            title: 'Relocate Country',
                            subtitle: `Current: ${user.country || 'United States'} (${Utils.formatMoney(2000)})`,
                            action: 'openMoveCountryModal',
                            buttonText: 'Move',
                            buttonStyle: 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 4: ENTERTAINMENT & GAMBLING -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-dice"></i> Entertainment & Gambling
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-ticket-alt',
                            iconBg: 'bg-amber-950/60',
                            iconColor: 'text-amber-400',
                            badgeColor: 'border-amber-800/60 text-amber-300 bg-amber-950/40',
                            title: 'Lottery Station',
                            subtitle: `${ticketsLeft} / 10 tickets left this year`,
                            action: 'openLotteryModal',
                            buttonText: 'Play Lottery',
                            buttonStyle: 'bg-amber-600 hover:bg-amber-500 text-white',
                            isLocked: lotteryLocked,
                            lockText: 'Age 18+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-dice-five',
                            iconBg: 'bg-purple-950/60',
                            iconColor: 'text-purple-300',
                            badgeColor: 'border-purple-800/60 text-purple-300 bg-purple-950/40',
                            title: 'Royal Palm Casino',
                            subtitle: 'Blackjack 21, Roulette & Slots',
                            action: 'renderCasinoHub',
                            buttonText: 'Casino Floor',
                            buttonStyle: 'bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white shadow',
                            isLocked: casinoLocked,
                            lockText: 'Age 18+'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 5: UNDERWORLD & CRIME -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-red-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-user-ninja"></i> Underworld & Crime
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-mask',
                            iconBg: 'bg-red-950/60',
                            iconColor: 'text-red-400',
                            badgeColor: 'border-red-800/60 text-red-300 bg-red-950/40',
                            title: 'Underworld & Crime Hub',
                            subtitle: 'Mischief, Theft & Bank Heists',
                            action: 'renderCrimeDashboard',
                            buttonText: 'Crime Hub',
                            buttonStyle: 'bg-red-700 hover:bg-red-600 text-white shadow'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 6: GOD PERKS & TEMPORAL POWER -->
                <div class="space-y-1.5 text-left pt-2 border-t border-slate-700/60">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-crown text-amber-400"></i> God Perks & Temporal Power
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-bolt',
                            iconBg: 'bg-amber-950/60',
                            iconColor: 'text-amber-400',
                            badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
                            title: 'God Mode Studio',
                            subtitle: 'Edit Character Stats, Appearance & Social Circle',
                            action: 'openGodModeHubModal',
                            buttonText: 'God Mode',
                            buttonStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold shadow'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-hourglass-half',
                            iconBg: 'bg-cyan-950/60',
                            iconColor: 'text-cyan-400',
                            badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
                            title: 'Time Machine Engine',
                            subtitle: 'Rewind up to 5 Years & Undo Death',
                            action: 'openTimeMachineModal',
                            buttonText: 'Time Machine',
                            buttonStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow'
                        })}
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function visitGymOneTime() {
    const user = state.gameState.user;
    if (user.age < 12) {
        UI.showModal("Too Young", "You must be at least 12 to go to the gym.");
        return;
    }
    const { boost, cost } = GameLogic.calculateOneTimeGymVisit();
    const actualCost = user.gymMembership ? 0 : cost;
    
    if (user.money >= actualCost) {
        user.money -= actualCost;
        const healthGain = boost;
        const looksGain = Math.floor(Math.random() * 4) + 2;
        GameLogic.adjustStat(user, 'health', healthGain);
        GameLogic.adjustStat(user, 'looks', looksGain);
        GameLogic.adjustStat(user, 'happiness', 3);
        addLog(`Worked out at the gym! Restored +${healthGain}% Health, +3% Happiness, and gained +${looksGain} Looks.`, 'good');
        UI.updateHeader(user);
        renderMoreDashboard();
    } else {
        UI.showModal("Not enough money", "You cannot afford the one-time gym fee.");
    }
}

export function buyGymMembership() {
    const user = state.gameState.user;
    if (user.age < 12) {
        UI.showModal("Too Young", "You must be at least 12 to join the gym.");
        return;
    }
    user.gymMembership = true;
    addLog("You bought a gym membership.", 'good');
    renderMoreDashboard();
}

export function cancelGymMembership() {
    const user = state.gameState.user;
    user.gymMembership = false;
    addLog("You cancelled your gym membership.", 'neutral');
    renderMoreDashboard();
}

export function startBetterDiet() {
    selectDiet('balanced');
}

export function cancelBetterDiet() {
    selectDiet('junk');
}

export function openDietSelectionModal() {
    const user = state.gameState.user;
    if ((user.age || 0) <= 12) {
        UI.showModal("Too Young", "You must be at least 13 years old to manage your diet plan.");
        return;
    }
    const currentDietId = user.diet || (user.hasBetterDiet ? 'balanced' : 'junk');
    const plans = Object.values(GameLogic.DIET_PLANS);

    const html = `
        <div class="space-y-3">
            <p class="text-xs text-slate-300">Choosing or changing your diet plan requires paying the <strong>first month upfront immediately</strong>. Monthly billing applies during annual financial processing.</p>
            <div class="max-h-80 overflow-y-auto space-y-2 pr-1">
                ${plans.map(plan => {
                    const isSelected = currentDietId === plan.id;
                    return `
                        <div class="p-3 rounded-xl border ${isSelected ? 'border-emerald-500 bg-emerald-950/30' : 'border-slate-700 bg-slate-800/80'} transition">
                            <div class="flex justify-between items-start mb-1">
                                <div>
                                    <div class="font-bold text-white text-sm flex items-center gap-2">
                                        ${plan.name}
                                        ${isSelected ? '<span class="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>' : ''}
                                    </div>
                                    <div class="text-xs text-slate-400 mt-0.5">${plan.desc}</div>
                                </div>
                                <div class="text-right ml-3 shrink-0">
                                    <div class="font-bold text-sm ${plan.monthlyCost > 0 ? 'text-emerald-400' : 'text-slate-400'}">
                                        ${plan.monthlyCost > 0 ? `${Utils.formatMoney(plan.monthlyCost)}/mo` : 'Free'}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2 text-right">
                                ${isSelected ? `
                                    <button disabled class="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-bold rounded cursor-not-allowed">Current Plan</button>
                                ` : `
                                    <button data-action="selectDiet" data-args="${plan.id}" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition">
                                        Select (${plan.monthlyCost > 0 ? `Pay ${Utils.formatMoney(plan.monthlyCost)}` : 'Switch Free'})
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2 mt-3">
                <i class="fas fa-times"></i> Cancel / Keep Current Diet
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Choose Diet Plan",
        content: html,
        showCloseBtn: true
    });
}

export function selectDiet(dietId) {
    const user = state.gameState.user;
    const plan = GameLogic.getDietPlan(dietId);

    if (user.money < plan.monthlyCost) {
        UI.showModal("Insufficient Funds", `You need ${Utils.formatMoney(plan.monthlyCost)} in cash to pay the upfront month fee for ${plan.name}.`);
        return;
    }

    user.money -= plan.monthlyCost;
    user.diet = dietId;
    user.hasBetterDiet = (dietId !== 'junk');

    addLog(`Switched diet plan to ${plan.name}. Paid ${Utils.formatMoney(plan.monthlyCost)} upfront.`, 'good');
    UI.updateHeader(user);
    UI.hideModal();
    renderMoreDashboard();

    UI.showModal("Diet Plan Active", `You are now on the <strong>${plan.name}</strong>! Upfront 1-month fee of ${Utils.formatMoney(plan.monthlyCost)} deducted.`);
}

export function openLotteryModal() {
    const user = state.gameState.user;
    if (!user) return;
    if ((user.age || 0) < 18) {
        UI.showModal("Too Young", "You must be at least 18 years old to play the lottery.");
        return;
    }
    const boughtCount = user.lotteryTicketsBoughtThisYear || 0;
    const ticketsLeft = 10 - boughtCount;
    const types = Object.values(GameLogic.LOTTERY_TYPES);
    const megaJackpot = GameLogic.getMegaJackpotAmount(user);

    const html = `
        <div class="space-y-3">
            <div class="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-xs">
                <span class="text-slate-400">Annual Limit:</span>
                <span class="font-bold ${ticketsLeft > 0 ? 'text-amber-400' : 'text-red-400'}">${ticketsLeft} / 10 tickets remaining</span>
            </div>
            <div class="space-y-2.5">
                ${types.map(t => {
                    const isMega = t.id === 'mega';
                    return `
                        <div class="bg-slate-800 p-3 rounded-xl border ${isMega ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-700'} flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-slate-900/80 flex items-center justify-center ${t.color} text-lg border border-slate-700">
                                    <i class="fas ${t.icon}"></i>
                                </div>
                                <div>
                                    <div class="font-bold text-white text-sm flex items-center gap-2">
                                        ${t.name}
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        Cost: <strong class="text-emerald-400">${Utils.formatMoney(t.price)}</strong>
                                    </div>
                                    ${isMega ? `<div class="text-[11px] font-extrabold text-amber-400 mt-0.5"><i class="fas fa-trophy text-amber-400 mr-1"></i>EST. JACKPOT: ${Utils.formatMoney(megaJackpot)}</div>` : ''}
                                </div>
                            </div>
                            <button data-action="buyLotteryTicket" data-args="${t.id}" ${ticketsLeft <= 0 ? 'disabled' : ''} class="${ticketsLeft <= 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white'} font-bold px-3 py-1.5 text-xs rounded-lg transition shrink-0 ml-2">
                                Buy Ticket
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="text-right pt-2 border-t border-slate-700">
                <button data-action="closeAllModals" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Close</button>
            </div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("Lottery Station", html);
    } else {
        UI.showCustomModal({
            title: "Lottery Station",
            content: html,
            showCloseBtn: true
        });
    }
}

let isLotteryProcessing = false;

export function buyLotteryTicket(ticketTypeId) {
    if (isLotteryProcessing) return;
    isLotteryProcessing = true;
    try {
        const user = state.gameState?.user;
        if (!user) return;
        const result = GameLogic.playLotteryTicket(ticketTypeId, user);

        if (!result.success) {
            UI.showModal("Lottery Notice", result.message);
            return;
        }

        if (result.payout > 0) {
            GameLogic.adjustStat(user, 'happiness', result.payout >= 50000 ? 50 : 25);
            if (result.payout >= 100000 || (ticketTypeId === 'mega' && result.payout >= 50000)) {
                unlockAchievement('mega_jackpot', user);
            }
            addLog(`Won ${Utils.formatMoney(result.payout)} on a ${result.ticketName}!`, 'good');
        } else {
            addLog(`Bought a ${result.ticketName} but didn't win anything.`, 'neutral');
        }

        UI.updateHeader(user);

        const outcomeHtml = result.payout > 0 ? `
            <div class="text-center py-3">
                <div class="text-4xl text-amber-400 mb-2">🎉</div>
                <h3 class="text-xl font-bold text-emerald-400 mb-1">${result.title}</h3>
                <p class="text-sm text-slate-300 mb-4">Congratulations! <strong>+${Utils.formatMoney(result.payout)}</strong> has been added to your bank account.</p>
                <div class="text-xs text-slate-400 mb-4">Tickets remaining this year: ${result.ticketsRemaining}/10</div>
                <div class="flex gap-2">
                    ${result.ticketsRemaining > 0 ? `<button data-action="openLotteryModal" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition">Play Again</button>` : ''}
                    <button data-action="closeAllModals" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">Close</button>
                </div>
            </div>
        ` : `
            <div class="text-center py-3">
                <div class="text-4xl text-slate-500 mb-2">🎟️</div>
                <h3 class="text-lg font-bold text-slate-300 mb-1">${result.title}</h3>
                <p class="text-xs text-slate-400 mb-4">Your numbers didn't hit this time.</p>
                <div class="text-xs text-slate-400 mb-4">Tickets remaining this year: ${result.ticketsRemaining}/10</div>
                <div class="flex gap-2">
                    ${result.ticketsRemaining > 0 ? `<button data-action="openLotteryModal" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition">Try Again</button>` : ''}
                    <button data-action="closeAllModals" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">Close</button>
                </div>
            </div>
        `;

        UI.replaceModalContent("Lottery Reveal", outcomeHtml);
        renderMoreDashboard();
    } finally {
        isLotteryProcessing = false;
    }
}


export function visitDoctor() {
    const user = state.gameState.user;
    const { boost, cost } = GameLogic.calculateMedicalVisit();
    
    if (user.money >= cost) {
        user.money -= cost;
        GameLogic.adjustStat(user, 'health', boost);
        user.hasFlu = false;
        user.isSick = false;
        addLog("You visited the doctor and feel much healthier.", 'good');
        UI.updateHeader(user);
        renderMoreDashboard();
    } else {
        UI.showModal("Not enough money", "You cannot afford to visit the doctor.");
    }
}


export function openTravelModal() {
    const user = state.gameState.user;
    if ((user.age || 0) < 16) {
        UI.showModal("Too Young", "You must be at least 16 years old to travel.");
        return;
    }

    const htmlContent = `
        <div class="flex flex-col gap-3">
            <button data-action="bookTrip" data-args="1" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Local Getaway (${Utils.formatMoney(500)})</div>
                <div class="text-sm text-slate-400">A short break to refresh your mind. (+5 Health, +10 Happiness)</div>
            </button>
            <button data-action="bookTrip" data-args="2" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Cross-Country Trip (${Utils.formatMoney(2000)})</div>
                <div class="text-sm text-slate-400">Explore new horizons and take a breather. (+10 Health, +20 Happiness)</div>
            </button>
            <button data-action="bookTrip" data-args="3" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg border-l-4 border-yellow-400 pl-2">Luxury International Tour (${Utils.formatMoney(10000)})</div>
                <div class="text-sm text-slate-400 pl-3">A once-in-a-lifetime journey across the globe. (+15 Health, +35 Happiness)</div>
            </button>

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2 mt-1">
                <i class="fas fa-times"></i> Cancel Vacation
            </button>
        </div>
    `;
    UI.showCustomModal({
        title: "Travel & Vacations",
        content: htmlContent,
        showCloseBtn: true
    });
}

export function bookTrip(tier) {
    const user = state.gameState.user;
    if ((user.age || 0) < 16) {
        UI.showModal("Too Young", "You must be at least 16 years old to travel.");
        return;
    }
    
    const outcome = GameLogic.calculateTripOutcome(tier);
    if (user.money < outcome.cost) {
        UI.showModal("Not enough money", "You cannot afford this trip.");
        return;
    }
    
    user.money -= outcome.cost;
    user.money += outcome.moneyChange;
    
    GameLogic.adjustStat(user, 'health', outcome.healthChange);
    GameLogic.adjustStat(user, 'happiness', outcome.happinessChange || 10);
    
    let moneyMsg = "";
    if (outcome.moneyChange > 0) moneyMsg = `<br><span class="text-green-400">+$${outcome.moneyChange}</span>`;
    if (outcome.moneyChange < 0) moneyMsg = `<br><span class="text-red-400">-$${Math.abs(outcome.moneyChange)}</span>`;
    
    let logType = 'good';
    if (outcome.healthChange < 0 || outcome.moneyChange < 0) logType = 'bad';
    else if (outcome.healthChange === 0 && outcome.moneyChange === 0) logType = 'neutral';
    
    addLog(`You went on a ${outcome.tripName}. ${outcome.eventMessage}`, logType);
    
    UI.updateHeader(user);
    
    // Show the random event pop up
    UI.showModal("Trip Complete", `
        <div class="text-center">
            <i class="fas fa-plane-arrival text-4xl text-cyan-400 mb-4"></i>
            <p class="mb-4">${outcome.eventMessage}</p>
            <div class="flex justify-center gap-4 text-sm font-bold">
                <div class="${outcome.healthChange >= 0 ? 'text-green-400' : 'text-red-400'}">
                    <i class="fas fa-heart"></i> ${outcome.healthChange > 0 ? '+' : ''}${outcome.healthChange} Health
                </div>
                <div class="${(outcome.happinessChange || 0) >= 0 ? 'text-amber-400' : 'text-red-400'}">
                    <i class="fas fa-smile"></i> +${outcome.happinessChange || 0} Happiness
                </div>
                ${outcome.moneyChange !== 0 ? `
                <div class="${outcome.moneyChange > 0 ? 'text-green-400' : 'text-red-400'}">
                    <i class="fas fa-dollar-sign"></i> ${outcome.moneyChange > 0 ? '+' : ''}${outcome.moneyChange}
                </div>
                ` : ''}
            </div>
        </div>
    `);
}

export function openMoveCountryModal() {
    const user = state.gameState.user;

    if (user.age < 18) {
        UI.showModal("Too Young", "You must be at least 18 years old to relocate to another country.");
        return;
    }
    if (user.money < GameLogic.RELOCATION_COST) {
        UI.showModal("Insufficient Funds", `You need at least ${Utils.formatMoney(GameLogic.RELOCATION_COST)} to move to a new country.`);
        return;
    }

    const currentCountry = user.country || 'United States';
    const currentCity = user.city || 'New York';

    // Target countries excluding current country
    const targetCountries = COUNTRIES_DATA.filter(c => c.name !== currentCountry);
    const defaultTargetCountry = targetCountries[0] || COUNTRIES_DATA[0];

    // Cities for default target country (excluding current city)
    const availableCities = defaultTargetCountry.cities.filter(c => c !== currentCity);

    const jobWarningHtml = user.jobTitle
        ? `<div class="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <i class="fas fa-exclamation-triangle text-amber-400 shrink-0"></i>
            <span>Relocating to another country will force you to leave your current position as <strong>${Utils.escapeHtml(user.jobTitle)}</strong>.</span>
           </div>`
        : '';

    const html = `
        <div class="space-y-4">
            <p class="text-xs text-slate-300">Moving to a new country costs <strong>${Utils.formatMoney(GameLogic.RELOCATION_COST)}</strong>. Your local currency, headers, and living cost calculations will update accordingly.</p>
            ${jobWarningHtml}
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Target Country</label>
                    <select id="relocate-country-select" data-action="updateRelocateCityDropdown" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                        ${targetCountries.map((c, idx) => `
                            <option value="${c.name}" ${idx === 0 ? 'selected' : ''}>
                                ${c.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Target City</label>
                    <select id="relocate-city-select" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                        ${availableCities.map(city => `<option value="${city}">${city}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="flex gap-2 pt-2 border-t border-slate-700">
                <button data-action="confirmMoveCountry" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition">
                    Pay ${Utils.formatMoney(GameLogic.RELOCATION_COST)} & Relocate
                </button>
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">
                    Cancel
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal("Relocate to New Country", html);

    setTimeout(() => {
        const countrySelect = get('relocate-country-select');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                updateRelocateCityDropdown(e.target.value);
            });
        }
    }, 50);
}

export function updateRelocateCityDropdown(selectedCountryName) {
    const user = state.gameState?.user || {};
    const currentCity = user.city || '';
    const selectedCountry = selectedCountryName || (get('relocate-country-select') ? get('relocate-country-select').value : '');
    const countryObj = COUNTRIES_DATA.find(c => c.name === selectedCountry) || COUNTRIES_DATA[0];
    const citySelect = get('relocate-city-select');
    if (citySelect && countryObj) {
        const availableCities = countryObj.cities.filter(c => c !== currentCity);
        citySelect.innerHTML = availableCities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

export function confirmMoveCountry() {
    const user = state.gameState.user;
    const countrySelect = get('relocate-country-select');
    const citySelect = get('relocate-city-select');

    if (!countrySelect || !citySelect) return;

    const targetCountry = countrySelect.value;
    const targetCity = citySelect.value;

    const check = GameLogic.canMoveCountry(user, targetCountry);
    if (!check.allowed) {
        UI.showModal("Relocation Blocked", check.reason);
        return;
    }

    const partner = GameLogic.getPartner(user);

    if (partner) {
        const html = `
            <div class="space-y-4 text-left">
                <p class="text-xs text-slate-300">You are currently in a relationship with <strong>${Utils.escapeHtml(partner.name)}</strong> (${Utils.escapeHtml(partner.type)}). Do you want to ask them to relocate to <strong>${Utils.escapeHtml(targetCountry)}</strong> with you?</p>
                <div class="space-y-2 pt-2 border-t border-slate-700">
                    <button data-action="askPartnerToMove" data-args="&apos;${targetCountry}&apos;, &apos;${targetCity}&apos;" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                        <i class="fas fa-heart mr-1"></i> Ask ${Utils.escapeHtml(partner.name)} to Move With You
                    </button>
                    <button data-action="confirmMoveAlone" data-args="&apos;${targetCountry}&apos;, &apos;${targetCity}&apos;" class="w-full bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-300 font-bold py-2.5 rounded-lg text-xs transition">
                        <i class="fas fa-user-alt mr-1"></i> Move Alone (End Relationship)
                    </button>
                    <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">
                        Cancel Relocation
                    </button>
                </div>
            </div>
        `;
        UI.showCustomModal(`Relocate with ${Utils.escapeHtml(partner.name)}?`, html);
        return;
    }

    executeRelocation(user, targetCountry, targetCity, false, null);
}

export function askPartnerToMove(targetCountry, targetCity) {
    const user = state.gameState.user;
    const partner = GameLogic.getPartner(user);

    if (!partner) {
        executeRelocation(user, targetCountry, targetCity, false, null);
        return;
    }

    const accepted = GameLogic.calculatePartnerRelocateAcceptance(partner);

    if (accepted) {
        partner.status = Math.min(100, (partner.status || 50) + 10);
        addLog(`${partner.name} agreed to move to ${targetCountry} with you!`, 'good');
        executeRelocation(user, targetCountry, targetCity, true, partner);
    } else {
        const html = `
            <div class="space-y-4 text-left">
                <div class="bg-red-950/40 border border-red-800/60 p-3 rounded-lg text-red-300 text-xs flex items-center gap-2">
                    <i class="fas fa-heart-broken text-red-400 text-base shrink-0"></i>
                    <span><strong>${Utils.escapeHtml(partner.name)}</strong> does not want to leave their home country and refused to relocate to <strong>${Utils.escapeHtml(targetCountry)}</strong>.</span>
                </div>
                <p class="text-xs text-slate-300">Would you like to end your relationship and move alone, or cancel and stay?</p>
                <div class="space-y-2 pt-2 border-t border-slate-700">
                    <button data-action="confirmMoveAlone" data-args="&apos;${targetCountry}&apos;, &apos;${targetCity}&apos;" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                        Break Up & Move Alone (${Utils.formatMoney(GameLogic.RELOCATION_COST)})
                    </button>
                    <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">
                        Cancel Relocation & Stay
                    </button>
                </div>
            </div>
        `;
        UI.showCustomModal(`${Utils.escapeHtml(partner.name)} Refused to Move`, html);
    }
}

export function confirmMoveAlone(targetCountry, targetCity) {
    const user = state.gameState.user;
    const partner = GameLogic.getPartner(user);
    const partnerName = partner ? partner.name : null;

    if (partner) {
        GameLogic.breakUpWithPartner(user, partner);
        addLog(`Broke up with ${partnerName} and decided to move to ${targetCountry} alone.`, 'bad');
    }

    executeRelocation(user, targetCountry, targetCity, false, null, partnerName);
}

function executeRelocation(user, targetCountry, targetCity, partnerMovedWith, partnerObj = null, exPartnerName = null) {
    const result = GameLogic.moveCountry(user, targetCountry, targetCity);

    if (!result.success) {
        UI.showModal("Relocation Failed", result.message);
        return;
    }

    user.relocationsCount = (user.relocationsCount || 0) + 1;
    if (user.relocationsCount >= 3) {
        unlockAchievement('globe_trotter', user);
    }

    addLog(result.message, result.hadJob ? 'neutral' : 'good');
    UI.updateHeader(user);

    if (typeof saveGame === 'function') {
        saveGame();
    }

    UI.hideModal();
    renderMoreDashboard();

    const partnerNoticeHtml = partnerMovedWith && partnerObj
        ? `<div class="mt-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50"><i class="fas fa-heart mr-1"></i><strong>${Utils.escapeHtml(partnerObj.name)}</strong> moved with you! (+10 Relationship)</div>`
        : exPartnerName
        ? `<div class="mt-2 text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/50"><i class="fas fa-heart-broken mr-1"></i>You broke up with <strong>${Utils.escapeHtml(exPartnerName)}</strong> to move alone.</div>`
        : '';

    const jobNoticeHtml = result.hadJob
        ? `<div class="mt-2 text-xs text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50"><i class="fas fa-exclamation-circle mr-1"></i>You lost your position as <strong>${Utils.escapeHtml(result.oldJobTitle)}</strong> and must apply for a new job.</div>`
        : '';

    UI.showModal("Welcome to Your New Home!", `
        <div class="text-left space-y-2">
            <p class="text-sm text-slate-200">You have successfully relocated to <strong>${Utils.escapeHtml(targetCity)}, ${Utils.escapeHtml(targetCountry)}</strong>. ${Utils.formatMoney(result.cost)} was deducted for travel expenses.</p>
            ${partnerNoticeHtml}
            ${jobNoticeHtml}
        </div>
    `);
}
