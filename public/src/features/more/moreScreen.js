import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils, COUNTRIES_DATA } from '../../ui/utils.js';
import {
    renderCasinoHub,
    openBlackjackBetting,
    startBlackjackGame,
    renderBlackjackGame,
    blackjackHit,
    blackjackStand,
    openRouletteModal,
    confirmRouletteBet,
    confirmRouletteSingleNumberBet,
    openSlotsModal,
    confirmSlotsSpin
} from './casinoScreen.js';

export {
    renderCasinoHub,
    openBlackjackBetting,
    startBlackjackGame,
    renderBlackjackGame,
    blackjackHit,
    blackjackStand,
    openRouletteModal,
    confirmRouletteBet,
    confirmRouletteSingleNumberBet,
    openSlotsModal,
    confirmSlotsSpin
};

const get = id => document.getElementById(id);

export function renderMoreDashboard() {
    const user = state.gameState.user;
    const gymLocked = user.age < 12;
    const casinoLocked = user.age < 21;
    const currentDiet = GameLogic.getDietPlan(user.diet || (user.hasBetterDiet ? 'balanced' : 'junk'));
    const ticketsBought = user.lotteryTicketsBoughtThisYear || 0;
    const ticketsLeft = 10 - ticketsBought;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4 flex items-center justify-between">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-1 px-1 text-white">More Options</h2>
            <p class="text-slate-400 text-sm mb-4 px-1">Improve your health, try your luck, or get personal life advice.</p>
            
            <div class="flex-1 overflow-y-auto pb-6 space-y-4">

                <!-- SECTION 1: HEALTH & WELLNESS -->
                <div class="text-xs font-bold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-1.5">
                    <i class="fas fa-heartbeat"></i> Health & Wellness
                </div>

                <!-- Custom Diet Selection -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 border border-green-500/50">
                                <i class="fas fa-apple-alt text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Diet Plan</h3>
                                <div class="text-xs text-emerald-400 font-semibold">${currentDiet.name}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold text-white">${currentDiet.monthlyCost > 0 ? `${Utils.formatMoney(currentDiet.monthlyCost)}/mo` : 'Free'}</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">${currentDiet.desc}</p>
                    <button data-action="openDietSelectionModal" class="bg-emerald-600 hover:bg-emerald-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Change Diet Plan
                    </button>
                </div>

                <!-- Gym Membership -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-blue-900/40 flex items-center justify-center text-blue-400 border border-blue-500/50">
                                <i class="fas fa-dumbbell text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Gym Membership</h3>
                                <div class="text-xs ${user.gymMembership ? 'text-blue-400 font-semibold' : 'text-slate-400'}">
                                    ${user.gymMembership ? `Active Member (${Utils.formatMoney(50)}/mo)` : 'Not a member'}
                                </div>
                            </div>
                        </div>
                    </div>
                    ${gymLocked ? `
                        <div class="text-xs font-bold text-red-400 uppercase tracking-wide text-center py-2 border border-dashed border-slate-700 rounded-lg">
                            <i class="fas fa-lock mr-1"></i>Must be 12 or older
                        </div>
                    ` : `
                    <div class="grid grid-cols-2 gap-2 mt-2">
                        <button data-action="visitGymOneTime" class="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-xs text-white font-bold transition">
                            ${user.gymMembership ? 'Workout Day' : `Visit Once (${Utils.formatMoney(20)})`}
                        </button>
                        ${user.gymMembership ? `
                            <button data-action="cancelGymMembership" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 p-2 rounded-lg text-xs text-white font-bold transition">
                                Cancel Membership
                            </button>
                        ` : `
                            <button data-action="buyGymMembership" class="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-xs text-white font-bold transition">
                                Join (${Utils.formatMoney(50)}/mo)
                            </button>
                        `}
                    </div>
                    `}
                </div>

                <!-- Medical Visit -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 border border-red-500/50">
                                <i class="fas fa-stethoscope text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Medical Checkup</h3>
                                <div class="text-xs text-slate-400">Restore your health</div>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-white">${Utils.formatMoney(1000)}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">A full physical catches illnesses early and boosts health (+10 Health).</p>
                    <button data-action="visitDoctor" class="bg-red-600 hover:bg-red-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Visit Doctor (${Utils.formatMoney(1000)})
                    </button>
                </div>

                <!-- SECTION 2: ENTERTAINMENT & LUCK -->
                <div class="text-xs font-bold uppercase tracking-wider text-amber-400 px-1 pt-2 flex items-center gap-1.5">
                    <i class="fas fa-clover"></i> Entertainment & Luck
                </div>

                <!-- Lottery Tickets -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-amber-900/40 flex items-center justify-center text-amber-400 border border-amber-500/50">
                                <i class="fas fa-ticket-alt text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Lottery Tickets</h3>
                                <div class="text-xs ${ticketsLeft > 0 ? 'text-amber-400 font-semibold' : 'text-red-400'}">
                                    ${ticketsLeft} / 10 remaining this year
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Buy instant scratch-offs, daily draws, or mega multi-million powerball tickets.</p>
                    <button data-action="openLotteryModal" class="bg-amber-600 hover:bg-amber-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Play Lottery
                    </button>
                </div>

                <!-- Royal Palm Casino -->
                <div class="bg-gradient-to-br from-amber-950/60 via-slate-800 to-purple-950/60 p-3.5 rounded-xl border border-amber-700/60">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-amber-900/40 flex items-center justify-center text-amber-300 border border-amber-500/50 shadow">
                                <i class="fas fa-dice text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Royal Palm Casino</h3>
                                <div class="text-xs text-amber-400 font-semibold">3 High-Stakes Games</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 mb-3">Step onto the high-stakes floor: Blackjack 21, European Roulette, and Mega Jackpot Slots!</p>
                    ${casinoLocked ? `
                        <div class="text-xs font-bold text-red-400 uppercase tracking-wide text-center py-2 border border-dashed border-slate-700 rounded-lg">
                            <i class="fas fa-lock mr-1"></i>Must be 18 or older
                        </div>
                    ` : `
                    <button data-action="renderCasinoHub" class="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 w-full py-2 rounded-lg text-sm text-white font-bold transition shadow">
                        Enter Casino Floor
                    </button>
                    `}
                </div>

                <!-- Travel & Vacations -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-cyan-900/40 flex items-center justify-center text-cyan-400 border border-cyan-500/50">
                                <i class="fas fa-plane text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Travel & Vacations</h3>
                                <div class="text-xs text-slate-400">Restore health & happiness</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Escape daily stress with local getaways or international luxury tours.</p>
                    <button data-action="openTravelModal" class="bg-cyan-600 hover:bg-cyan-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Book Vacation
                    </button>
                </div>

                <!-- Relocate to a New Country -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-emerald-900/40 flex items-center justify-center text-emerald-400 border border-emerald-500/50">
                                <i class="fas fa-globe text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Relocate Country</h3>
                                <div class="text-xs text-slate-400">Current: <span class="text-emerald-400 font-semibold">${user.country || 'United States'} (${user.city || 'New York'})</span></div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Move to a new country and start fresh in a new city (${Utils.formatMoney(2000)}).</p>
                    <button data-action="openMoveCountryModal" class="bg-emerald-600 hover:bg-emerald-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Move to New Country (${Utils.formatMoney(2000)})
                    </button>
                </div>

                <!-- SECTION 3: PERSONAL GROWTH -->
                <div class="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1 pt-2 flex items-center gap-1.5">
                    <i class="fas fa-lightbulb"></i> Personal Growth & Guidance
                </div>

                <!-- Life Suggestions Box -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-400 border border-indigo-500/50">
                                <i class="fas fa-compass text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Life Suggestions</h3>
                                <div class="text-xs text-slate-400">Personalized advisor</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Receive tailored recommendations for your career, health, finances, and relationships.</p>
                    <button data-action="openSuggestionsModal" class="bg-indigo-600 hover:bg-indigo-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Get Suggestions
                    </button>
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
        user.health = Math.min(100, user.health + boost);
        addLog("You worked out at the gym for a day.", 'good');
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
            <div class="text-right pt-2 border-t border-slate-700">
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Close</button>
            </div>
        </div>
    `;

    UI.showCustomModal("Choose Diet Plan", html);
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
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Close</button>
            </div>
        </div>
    `;

    UI.showCustomModal("Lottery Station", html);
}

export function buyLotteryTicket(ticketTypeId) {
    const user = state.gameState.user;
    const result = GameLogic.playLotteryTicket(ticketTypeId, user);

    if (!result.success) {
        UI.showModal("Lottery Notice", result.message);
        return;
    }

    UI.updateHeader(user);

    if (result.payout > 0) {
        addLog(`Won ${Utils.formatMoney(result.payout)} on a ${result.ticketName}!`, 'good');
    } else {
        addLog(`Bought a ${result.ticketName} but didn't win anything.`, 'neutral');
    }

    const outcomeHtml = result.payout > 0 ? `
        <div class="text-center py-3">
            <div class="text-4xl text-amber-400 mb-2">🎉</div>
            <h3 class="text-xl font-bold text-emerald-400 mb-1">${result.title}</h3>
            <p class="text-sm text-slate-300 mb-4">Congratulations! <strong>+${Utils.formatMoney(result.payout)}</strong> has been added to your bank account.</p>
            <div class="text-xs text-slate-400 mb-4">Tickets remaining this year: ${result.ticketsRemaining}/10</div>
            <div class="flex gap-2">
                ${result.ticketsRemaining > 0 ? `<button data-action="openLotteryModal" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition">Play Again</button>` : ''}
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">Close</button>
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
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">Close</button>
            </div>
        </div>
    `;

    UI.showCustomModal("Lottery Reveal", outcomeHtml);
    renderMoreDashboard();
}

export function openSuggestionsModal() {
    const user = state.gameState.user;
    const suggestions = GameLogic.generateLifeSuggestions(user);

    const html = `
        <div class="space-y-3">
            <p class="text-xs text-slate-300">Based on your character's current age, career, health, finances, and relationships:</p>
            <div class="max-h-80 overflow-y-auto space-y-2 pr-1">
                ${suggestions.map(s => `
                    <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fas ${s.icon} text-sm"></i>
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${s.category}</span>
                        </div>
                        <h4 class="font-bold text-white text-sm mb-1">${s.title}</h4>
                        <p class="text-xs text-slate-300">${s.desc}</p>
                    </div>
                `).join('')}
            </div>
            <div class="text-right pt-2 border-t border-slate-700">
                <button data-action="hideModal" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition">Got It!</button>
            </div>
        </div>
    `;

    UI.showCustomModal("Personalized Life Suggestions", html);
}

export function visitDoctor() {
    const user = state.gameState.user;
    const { boost, cost } = GameLogic.calculateMedicalVisit();
    
    if (user.money >= cost) {
        user.money -= cost;
        user.health = Math.min(100, user.health + boost);
        addLog("You visited the doctor and feel much healthier.", 'good');
        UI.updateHeader(user);
        renderMoreDashboard();
    } else {
        UI.showModal("Not enough money", "You cannot afford to visit the doctor.");
    }
}


export function openTravelModal() {
    const htmlContent = `
        <div class="flex flex-col gap-3">
            <button data-action="bookTrip" data-args="1" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Local Getaway (${Utils.formatMoney(500)})</div>
                <div class="text-sm text-slate-400">A short break to refresh your mind. (+5 Health)</div>
            </button>
            <button data-action="bookTrip" data-args="2" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Cross-Country Trip (${Utils.formatMoney(2000)})</div>
                <div class="text-sm text-slate-400">Explore new horizons and take a breather. (+10 Health)</div>
            </button>
            <button data-action="bookTrip" data-args="3" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg border-l-4 border-yellow-400 pl-2">Luxury International Tour (${Utils.formatMoney(10000)})</div>
                <div class="text-sm text-slate-400 pl-3">A once-in-a-lifetime journey across the globe. (+15 Health)</div>
            </button>
            <button data-action="hideModal" class="mt-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl text-center text-white font-bold transition">
                Cancel
            </button>
        </div>
    `;
    UI.showCustomModal("Travel & Vacations", htmlContent);
}

export function bookTrip(tier) {
    const user = state.gameState.user;
    
    const dummyOutcome = GameLogic.calculateTripOutcome(tier);
    if (user.money < dummyOutcome.cost) {
        UI.showModal("Not enough money", "You cannot afford this trip.");
        return;
    }

    const outcome = GameLogic.calculateTripOutcome(tier);
    
    user.money -= outcome.cost;
    user.money += outcome.moneyChange;
    
    user.health = Math.min(100, user.health + outcome.healthChange);
    
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
            <span>Relocating to another country will force you to leave your current position as <strong>${user.jobTitle}</strong>.</span>
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
                <p class="text-xs text-slate-300">You are currently in a relationship with <strong>${partner.name}</strong> (${partner.type}). Do you want to ask them to relocate to <strong>${targetCountry}</strong> with you?</p>
                <div class="space-y-2 pt-2 border-t border-slate-700">
                    <button data-action="askPartnerToMove" data-args="&apos;${targetCountry}&apos;, &apos;${targetCity}&apos;" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                        <i class="fas fa-heart mr-1"></i> Ask ${partner.name} to Move With You
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
        UI.showCustomModal(`Relocate with ${partner.name}?`, html);
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
                    <span><strong>${partner.name}</strong> does not want to leave their home country and refused to relocate to <strong>${targetCountry}</strong>.</span>
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
        UI.showCustomModal(`${partner.name} Refused to Move`, html);
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

    addLog(result.message, result.hadJob ? 'neutral' : 'good');
    UI.updateHeader(user);

    if (typeof saveGame === 'function') {
        saveGame();
    }

    UI.hideModal();
    renderMoreDashboard();

    const partnerNoticeHtml = partnerMovedWith && partnerObj
        ? `<div class="mt-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50"><i class="fas fa-heart mr-1"></i><strong>${partnerObj.name}</strong> moved with you! (+10 Relationship)</div>`
        : exPartnerName
        ? `<div class="mt-2 text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/50"><i class="fas fa-heart-broken mr-1"></i>You broke up with <strong>${exPartnerName}</strong> to move alone.</div>`
        : '';

    const jobNoticeHtml = result.hadJob
        ? `<div class="mt-2 text-xs text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50"><i class="fas fa-exclamation-circle mr-1"></i>You lost your position as <strong>${result.oldJobTitle}</strong> and must apply for a new job.</div>`
        : '';

    UI.showModal("Welcome to Your New Home!", `
        <div class="text-left space-y-2">
            <p class="text-sm text-slate-200">You have successfully relocated to <strong>${targetCity}, ${targetCountry}</strong>. ${Utils.formatMoney(result.cost)} was deducted for travel expenses.</p>
            ${partnerNoticeHtml}
            ${jobNoticeHtml}
        </div>
    `);
}
