import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

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
                            <div class="text-xs font-bold text-white">${currentDiet.monthlyCost > 0 ? `$${currentDiet.monthlyCost}/mo` : 'Free'}</div>
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
                                    ${user.gymMembership ? 'Active Member ($50/mo)' : 'Not a member'}
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
                            ${user.gymMembership ? 'Workout Day' : 'Visit Once ($20)'}
                        </button>
                        ${user.gymMembership ? `
                            <button data-action="cancelGymMembership" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 p-2 rounded-lg text-xs text-white font-bold transition">
                                Cancel Membership
                            </button>
                        ` : `
                            <button data-action="buyGymMembership" class="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-xs text-white font-bold transition">
                                Join ($50/mo)
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
                        <span class="text-xs font-bold text-white">$1,000</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">A full physical catches illnesses early and boosts health (+10 Health).</p>
                    <button data-action="visitDoctor" class="bg-red-600 hover:bg-red-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Visit Doctor ($1,000)
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

                <!-- Casino Blackjack -->
                <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-400 border border-purple-500/50">
                                <i class="fas fa-dice text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">Casino Blackjack</h3>
                                <div class="text-xs text-slate-400">High-stakes table game</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-3">Risk your hard-earned cash at the card table for instant 1:1 payouts.</p>
                    ${casinoLocked ? `
                        <div class="text-xs font-bold text-red-400 uppercase tracking-wide text-center py-2 border border-dashed border-slate-700 rounded-lg">
                            <i class="fas fa-lock mr-1"></i>Must be 21 or older
                        </div>
                    ` : `
                    <button data-action="openBlackjackBetting" class="bg-purple-600 hover:bg-purple-500 w-full py-2 rounded-lg text-sm text-white font-bold transition">
                        Play Blackjack
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
                                        ${plan.monthlyCost > 0 ? `$${plan.monthlyCost}/mo` : 'Free'}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2 text-right">
                                ${isSelected ? `
                                    <button disabled class="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-bold rounded cursor-not-allowed">Current Plan</button>
                                ` : `
                                    <button data-action="selectDiet" data-args="${plan.id}" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition">
                                        Select (${plan.monthlyCost > 0 ? `Pay $${plan.monthlyCost}` : 'Switch Free'})
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
        UI.showModal("Insufficient Funds", `You need $${plan.monthlyCost} in cash to pay the upfront month fee for ${plan.name}.`);
        return;
    }

    user.money -= plan.monthlyCost;
    user.diet = dietId;
    user.hasBetterDiet = (dietId !== 'junk');

    addLog(`Switched diet plan to ${plan.name}. Paid $${plan.monthlyCost} upfront.`, 'good');
    UI.updateHeader(user);
    UI.hideModal();
    renderMoreDashboard();

    UI.showModal("Diet Plan Active", `You are now on the <strong>${plan.name}</strong>! Upfront 1-month fee of $${plan.monthlyCost} deducted.`);
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
                                        Cost: <strong class="text-emerald-400">$${t.price}</strong>
                                    </div>
                                    ${isMega ? `<div class="text-[11px] font-extrabold text-amber-400 mt-0.5"><i class="fas fa-trophy text-amber-400 mr-1"></i>EST. JACKPOT: $${megaJackpot.toLocaleString()}</div>` : ''}
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
        addLog(`Won $${result.payout.toLocaleString()} on a ${result.ticketName}!`, 'good');
    } else {
        addLog(`Bought a ${result.ticketName} but didn't win anything.`, 'neutral');
    }

    const outcomeHtml = result.payout > 0 ? `
        <div class="text-center py-3">
            <div class="text-4xl text-amber-400 mb-2">🎉</div>
            <h3 class="text-xl font-bold text-emerald-400 mb-1">${result.title}</h3>
            <p class="text-sm text-slate-300 mb-4">Congratulations! <strong>+$${result.payout.toLocaleString()}</strong> has been added to your bank account.</p>
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

let activeBlackjackState = null;

export function openBlackjackBetting() {
    const user = state.gameState.user;
    if (user.age < 21) {
        UI.showModal("Too Young", "You must be at least 21 to enter the casino.");
        return;
    }
    if (user.money < 25) {
        UI.showModal("Not enough money", "You need at least $25 to play blackjack.");
        return;
    }
    
    const maxBet = Math.floor(Math.min(user.money, 500000) / 25) * 25;
    const htmlContent = `
        <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center">
                <p>Select your bet amount:</p>
                <span id="betValueDisplay" class="font-bold text-2xl text-green-400">$25</span>
            </div>
            
            <input type="range" id="blackjackBetSlider" min="25" max="${maxBet}" step="25" value="25" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer">
            <div class="flex justify-between text-xs text-slate-400 px-1">
                <span>$25</span>
                <span>$${Utils.formatMoney(maxBet).replace('$', '')}</span>
            </div>
            
            <div class="flex gap-2 mt-4">
                <button data-action="startBlackjackGame" class="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded text-white font-bold transition">Bet</button>
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded text-white font-bold transition">Cancel</button>
            </div>
        </div>
    `;
    
    UI.showCustomModal("Place Your Bet", htmlContent);
    
    setTimeout(() => {
        const slider = document.getElementById('blackjackBetSlider');
        const display = document.getElementById('betValueDisplay');
        if(slider && display) {
            slider.addEventListener('input', (e) => {
                display.innerText = '$' + Utils.formatMoney(Number(e.target.value)).replace('$', '');
            });
        }
    }, 100);
}

export function startBlackjackGame() {
    const slider = document.getElementById('blackjackBetSlider');
    if (!slider) return;
    
    const betAmount = Number(slider.value);
    const user = state.gameState.user;
    
    if (user.money < betAmount) {
        UI.showModal("Error", "You don't have enough money.");
        return;
    }
    
    user.money -= betAmount;
    UI.updateHeader(user);
    
    const deck = GameLogic.getDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    
    activeBlackjackState = {
        deck,
        playerHand,
        dealerHand,
        betAmount,
        status: 'playing' // 'playing', 'player_turn', 'dealer_turn', 'finished'
    };
    
    // Check for initial blackjack
    const playerTotal = GameLogic.calculateBlackjackHand(playerHand);
    if (playerTotal === 21) {
        finishBlackjackGame(true); // Player auto-stands/wins on natural blackjack if dealer doesn't have it, but we can just resolve it
    } else {
        renderBlackjackGame();
    }
}

function renderHand(hand, hideSecondCard = false) {
    let html = '<div class="flex gap-2">';
    hand.forEach((card, index) => {
        if (hideSecondCard && index === 1) {
            html += `<div class="w-12 h-16 bg-slate-700 border-2 border-slate-600 rounded flex items-center justify-center font-bold text-slate-500">?</div>`;
        } else {
            const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
            const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];
            html += `<div class="w-12 h-16 bg-white rounded flex flex-col items-center justify-center font-bold ${isRed ? 'text-red-600' : 'text-black'}">
                <div>${card.value}</div>
                <div class="text-xl leading-none">${suitSymbol}</div>
            </div>`;
        }
    });
    html += '</div>';
    return html;
}

export function renderBlackjackGame() {
    if (!activeBlackjackState) return;
    
    const { playerHand, dealerHand, betAmount, status } = activeBlackjackState;
    const hideDealerCard = status === 'playing';
    
    const dealerTotal = hideDealerCard ? GameLogic.calculateBlackjackHand([dealerHand[0]]) : GameLogic.calculateBlackjackHand(dealerHand);
    const playerTotal = GameLogic.calculateBlackjackHand(playerHand);
    
    let actionsHtml = '';
    
    if (status === 'playing') {
        actionsHtml = `
            <div class="flex gap-2 mt-4">
                <button data-action="blackjackHit" class="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded text-white font-bold transition">Hit</button>
                <button data-action="blackjackStand" class="flex-1 bg-yellow-600 hover:bg-yellow-500 py-3 rounded text-white font-bold transition">Stand</button>
            </div>
        `;
    } else {
        let resultText = '';
        let resultColor = '';
        const outcome = GameLogic.determineBlackjackOutcome(playerHand, dealerHand);
        if (outcome === 'win') {
            resultText = `You won $${Utils.formatMoney(betAmount * 2).replace('$', '')}!`;
            resultColor = 'text-green-400';
        } else if (outcome === 'push') {
            resultText = "Push! Bet returned.";
            resultColor = 'text-yellow-400';
        } else {
            resultText = "Dealer wins. You lost.";
            resultColor = 'text-red-400';
        }
        actionsHtml = `
            <div class="mt-4 text-center font-bold text-lg ${resultColor}">${resultText}</div>
            <div class="flex gap-2 mt-4">
                <button data-action="openBlackjackBetting" class="flex-1 bg-purple-600 hover:bg-purple-500 py-3 rounded text-white font-bold transition">Play Again</button>
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded text-white font-bold transition">Close</button>
            </div>
        `;
    }
    
    const htmlContent = `
        <div class="flex flex-col gap-6">
            <div>
                <h4 class="font-bold mb-2">Dealer's Hand (${hideDealerCard ? dealerTotal + ' + ?' : dealerTotal})</h4>
                ${renderHand(dealerHand, hideDealerCard)}
            </div>
            <div>
                <h4 class="font-bold mb-2">Your Hand (${playerTotal})</h4>
                ${renderHand(playerHand, false)}
                <div class="text-sm text-slate-400 mt-2">Bet: $${Utils.formatMoney(betAmount).replace('$', '')}</div>
            </div>
            ${actionsHtml}
        </div>
    `;
    
    UI.showCustomModal("Blackjack", htmlContent);
}

export function blackjackHit() {
    if (!activeBlackjackState) return;
    const { playerHand, deck } = activeBlackjackState;
    playerHand.push(deck.pop());
    
    if (GameLogic.calculateBlackjackHand(playerHand) > 21) {
        finishBlackjackGame(false);
    } else {
        renderBlackjackGame();
    }
}

export function blackjackStand() {
    finishBlackjackGame(false);
}

function finishBlackjackGame(playerNaturalBlackjack) {
    if (!activeBlackjackState) return;
    
    activeBlackjackState.status = 'finished';
    const { playerHand, dealerHand, deck, betAmount } = activeBlackjackState;
    
    const playerTotal = GameLogic.calculateBlackjackHand(playerHand);
    
    if (!playerNaturalBlackjack && playerTotal <= 21) {
        // Dealer hits on soft 17 is standard, but simple logic is hit < 17
        while (GameLogic.calculateBlackjackHand(dealerHand) < 17) {
            dealerHand.push(deck.pop());
        }
    }
    
    const outcome = GameLogic.determineBlackjackOutcome(playerHand, dealerHand);
    const user = state.gameState.user;
    
    if (outcome === 'win') {
        user.money += betAmount * 2;
        addLog(`Won $${Utils.formatMoney(betAmount).replace('$', '')} at Blackjack!`, 'good');
    } else if (outcome === 'push') {
        user.money += betAmount;
        addLog(`Pushed $${Utils.formatMoney(betAmount).replace('$', '')} at Blackjack.`, 'neutral');
    } else {
        addLog(`Lost $${Utils.formatMoney(betAmount).replace('$', '')} at Blackjack.`, 'bad');
    }
    
    UI.updateHeader(user);
    renderBlackjackGame();
}

export function openTravelModal() {
    const htmlContent = `
        <div class="flex flex-col gap-3">
            <button data-action="bookTrip" data-args="1" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Local Getaway ($500)</div>
                <div class="text-sm text-slate-400">A short break to refresh your mind. (+5 Health)</div>
            </button>
            <button data-action="bookTrip" data-args="2" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg">Cross-Country Trip ($2,000)</div>
                <div class="text-sm text-slate-400">Explore new horizons and take a breather. (+10 Health)</div>
            </button>
            <button data-action="bookTrip" data-args="3" class="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left border border-slate-600 transition">
                <div class="font-bold text-white text-lg border-l-4 border-yellow-400 pl-2">Luxury International Tour ($10,000)</div>
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
