import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

const get = id => document.getElementById(id);

export function renderMoreDashboard() {
    const user = state.gameState.user;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-4 px-1">More Options</h2>
            <p class="text-slate-400 text-sm mb-6 px-1">Improve your life and health with these activities.</p>
            
            <div class="flex-1 overflow-y-auto pb-4 space-y-4">
                
                <!-- Travel & Vacations -->
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/50">
                                <i class="fas fa-plane text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Travel</h3>
                                <div class="text-xs text-slate-500">Take a vacation</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-2">Escape the daily grind, restore your health, and maybe have an adventure.</p>
                    <button data-action="openTravelModal" class="bg-cyan-600 hover:bg-cyan-500 w-full py-2 rounded text-sm text-white font-bold transition">
                        View Options
                    </button>
                </div>
                
                <!-- Gym Membership -->
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 border border-blue-500/50">
                                <i class="fas fa-dumbbell text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Gym</h3>
                                <div class="text-xs ${user.gymMembership ? 'text-green-400' : 'text-slate-500'}">
                                    ${user.gymMembership ? 'Monthly Member' : 'Not a member'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-4">
                        <button data-action="visitGymOneTime" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm text-white font-bold transition">
                            ${user.gymMembership ? 'Visit' : 'Visit Once ($20)'}
                        </button>
                        ${user.gymMembership ? `
                            <button data-action="cancelGymMembership" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 p-2 rounded text-sm text-white font-bold transition">
                                Cancel ($50/mo)
                            </button>
                        ` : `
                            <button data-action="buyGymMembership" class="bg-blue-600 hover:bg-blue-500 p-2 rounded text-sm text-white font-bold transition">
                                Join ($50/mo)
                            </button>
                        `}
                    </div>
                </div>

                <!-- Diet Plan -->
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 border border-green-500/50">
                                <i class="fas fa-apple-alt text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Better Diet</h3>
                                <div class="text-xs ${user.hasBetterDiet ? 'text-green-400' : 'text-slate-500'}">
                                    ${user.hasBetterDiet ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-2">Eating better slows down health decay. Costs $200/mo.</p>
                    <div class="flex justify-end">
                        ${user.hasBetterDiet ? `
                            <button data-action="cancelBetterDiet" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 px-4 py-2 rounded text-sm text-white font-bold transition w-full">
                                Go back to cheap food
                            </button>
                        ` : `
                            <button data-action="startBetterDiet" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm text-white font-bold transition w-full">
                                Start Diet ($200/mo)
                            </button>
                        `}
                    </div>
                </div>

                <!-- Medical Visit -->
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 border border-red-500/50">
                                <i class="fas fa-stethoscope text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Medical Checkup</h3>
                                <div class="text-xs text-slate-500">Restore your health</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-2">A full physical can catch issues early and provide a quick health boost.</p>
                    <button data-action="visitDoctor" class="bg-red-600 hover:bg-red-500 w-full py-2 rounded text-sm text-white font-bold transition">
                        Visit Doctor ($1,000)
                    </button>
                </div>

                <!-- Casino -->
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 border border-purple-500/50">
                                <i class="fas fa-dice text-sm"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Casino</h3>
                                <div class="text-xs text-slate-500">Play Blackjack</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-2">Risk your hard-earned money at the tables. 1:1 payout.</p>
                    <button data-action="openBlackjackBetting" class="bg-purple-600 hover:bg-purple-500 w-full py-2 rounded text-sm text-white font-bold transition">
                        Play Blackjack
                    </button>
                </div>

            </div>
        </div>
    `;
}

export function visitGymOneTime() {
    const user = state.gameState.user;
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
    const user = state.gameState.user;
    user.hasBetterDiet = true;
    addLog("You started eating a healthier diet.", 'good');
    renderMoreDashboard();
}

export function cancelBetterDiet() {
    const user = state.gameState.user;
    user.hasBetterDiet = false;
    addLog("You stopped your healthy diet to save money.", 'neutral');
    renderMoreDashboard();
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
