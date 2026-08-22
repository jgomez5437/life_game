import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

const get = id => document.getElementById(id);

// --- CASINO HUB MAIN SCREEN ---
export function renderCasinoHub() {
    const user = state.gameState.user;

    if (user.age < 18) {
        UI.showModal("Age Restriction", "You must be at least 18 years old to enter the Casino.");
        return;
    }

    const casinoHtml = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <!-- Header Nav -->
            <div class="mb-4 flex items-center justify-between">
                <button data-action="renderMoreDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to More Options
                </button>
                <span class="text-xs text-amber-400 font-bold uppercase tracking-wider"><i class="fas fa-gem mr-1"></i> High Stakes Floor</span>
            </div>

            <!-- Casino Header Card -->
            <div class="bg-gradient-to-br from-amber-950 via-slate-900 to-purple-950 p-5 rounded-2xl border border-amber-700/60 shadow-xl mb-5 text-center relative overflow-hidden">
                <div class="absolute -right-6 -bottom-6 text-amber-500/10 text-9xl font-extrabold pointer-events-none">🎰</div>
                <div class="w-14 h-14 rounded-full bg-amber-900/40 border border-amber-500/50 flex items-center justify-center text-amber-300 mx-auto mb-2 text-2xl shadow-lg">
                    <i class="fas fa-dice"></i>
                </div>
                <h2 class="text-2xl font-extrabold text-amber-200 tracking-wide">Royal Palm Casino</h2>
                <p class="text-slate-300 text-xs mt-1 max-w-xs mx-auto">Test your luck across high-stakes Blackjack, European Roulette, and Mega Jackpot Slots!</p>
                <div class="mt-4 bg-slate-900/80 border border-amber-500/30 rounded-xl py-2 px-4 inline-block shadow-inner">
                    <span class="text-xs text-slate-400 font-semibold mr-2">Available Bankroll:</span>
                    <span class="text-emerald-400 font-extrabold text-base">${Utils.formatMoney(user.money)}</span>
                </div>
            </div>

            <!-- Games Grid -->
            <div class="flex-1 overflow-y-auto space-y-4 pb-6">
                
                <!-- Game 1: Blackjack -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-purple-500/50 transition shadow-md">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-600/50 flex items-center justify-center text-purple-300 text-xl shrink-0">
                            <span class="font-bold text-2xl leading-none">♠</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h3 class="font-bold text-white text-base truncate">Classic Blackjack 21</h3>
                                <span class="text-[10px] bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-800">3:2 Payout</span>
                            </div>
                            <p class="text-slate-400 text-xs mt-0.5 truncate">Beat the dealer to 21 without busting. Hit, Stand, and win big!</p>
                        </div>
                    </div>
                    <button data-action="openBlackjackBetting" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow">
                        <i class="fas fa-play"></i> Play Blackjack ($25 - $500,000)
                    </button>
                </div>

                <!-- Game 2: European Roulette -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-red-500/50 transition shadow-md">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 rounded-xl bg-red-900/40 border border-red-600/50 flex items-center justify-center text-red-300 text-xl shrink-0">
                            <i class="fas fa-life-ring"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h3 class="font-bold text-white text-base truncate">European Roulette</h3>
                                <span class="text-[10px] bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded border border-red-800">35:1 Max Payout</span>
                            </div>
                            <p class="text-slate-400 text-xs mt-0.5 truncate">Bet Red/Black (1:1), Even/Odd (1:1), or hit single numbers (35:1)!</p>
                        </div>
                    </div>
                    <button data-action="openRouletteModal" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow">
                        <i class="fas fa-play"></i> Play Roulette
                    </button>
                </div>

                <!-- Game 3: Slot Machine -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-amber-500/50 transition shadow-md">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 rounded-xl bg-amber-900/40 border border-amber-600/50 flex items-center justify-center text-amber-300 text-xl shrink-0">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h3 class="font-bold text-white text-base truncate">High-Roller Slots</h3>
                                <span class="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-800">50x Jackpot</span>
                            </div>
                            <p class="text-slate-400 text-xs mt-0.5 truncate">Spin 3 reels for Wilds (💎), Sevens (7️⃣), and the 50x Diamond Jackpot!</p>
                        </div>
                    </div>
                    <button data-action="openSlotsModal" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow">
                        <i class="fas fa-play"></i> Spin Slot Machine
                    </button>
                </div>

            </div>
        </div>
    `;

    UI.updateBottomNav('more');
    UI.renderScreen(casinoHtml);
}


// ==========================================
// GAME 1: CLASSIC BLACKJACK 21
// ==========================================

let activeBlackjackState = null;
let isBlackjackProcessing = false;
let isRouletteSpinning = false;
let isSlotsSpinning = false;

export function openBlackjackBetting() {
    const user = state.gameState.user;
    if (user.age < 18) {
        UI.showModal("Too Young", "You must be at least 18 to play casino games.");
        return;
    }
    if (user.money < 25) {
        UI.showModal("Not enough money", `You need at least ${Utils.formatMoney(25)} to play blackjack.`);
        return;
    }
    
    const maxBet = Math.floor(Math.min(user.money, 500000) / 25) * 25;
    const htmlContent = `
        <div class="flex flex-col gap-4 text-left">
            <div class="flex justify-between items-center">
                <p class="text-xs font-bold text-slate-300">Select your bet amount:</p>
                <span id="betValueDisplay" class="font-bold text-2xl text-green-400">${Utils.formatMoney(25)}</span>
            </div>
            
            <input type="range" id="blackjackBetSlider" min="25" max="${maxBet}" step="25" value="25" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer">
            <div class="flex justify-between text-xs text-slate-400 px-1">
                <span>${Utils.formatMoney(25)}</span>
                <span>${Utils.formatMoney(maxBet)}</span>
            </div>
            
            <div class="flex gap-2 mt-4">
                <button data-action="startBlackjackGame" class="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-lg text-white font-bold text-sm transition">Bet & Deal</button>
                <button data-action="closeAllModals" class="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg text-white font-bold text-sm transition">Cancel</button>
            </div>
        </div>
    `;
    
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("Place Your Bet - Blackjack", htmlContent);
    } else {
        UI.showCustomModal("Place Your Bet - Blackjack", htmlContent);
    }
    
    setTimeout(() => {
        const slider = document.getElementById('blackjackBetSlider');
        const display = document.getElementById('betValueDisplay');
        if(slider && display) {
            slider.addEventListener('input', (e) => {
                display.innerText = Utils.formatMoney(Number(e.target.value));
            });
        }
    }, 100);
}

export function startBlackjackGame() {
    if (isBlackjackProcessing) return;
    const slider = document.getElementById('blackjackBetSlider');
    if (!slider) return;
    
    const betAmount = Number(slider.value);
    const user = state.gameState?.user;
    if (!user) return;
    
    if (user.money < betAmount) {
        UI.showModal("Error", "You don't have enough money.");
        return;
    }
    
    isBlackjackProcessing = true;
    try {
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
            status: 'playing'
        };
        
        const playerTotal = GameLogic.calculateBlackjackHand(playerHand);
        if (playerTotal === 21) {
            finishBlackjackGame(true);
        } else {
            renderBlackjackGame();
        }
    } finally {
        isBlackjackProcessing = false;
    }
}

function renderHand(hand, hideSecondCard = false) {
    let html = '<div class="flex gap-2 justify-center">';
    hand.forEach((card, index) => {
        if (hideSecondCard && index === 1) {
            html += `<div class="w-12 h-16 bg-slate-700 border-2 border-slate-600 rounded flex items-center justify-center font-bold text-slate-500 shadow-md">?</div>`;
        } else {
            const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
            const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];
            html += `<div class="w-12 h-16 bg-white rounded flex flex-col items-center justify-center font-bold ${isRed ? 'text-red-600' : 'text-slate-900'} shadow-md">
                <div class="text-sm">${card.value}</div>
                <div class="text-lg leading-none">${suitSymbol}</div>
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
                <button data-action="blackjackHit" class="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-lg text-white font-bold transition text-sm">Hit</button>
                <button data-action="blackjackStand" class="flex-1 bg-amber-600 hover:bg-amber-500 py-3 rounded-lg text-white font-bold transition text-sm">Stand</button>
            </div>
        `;
    } else {
        let resultText = '';
        let resultColor = '';
        const outcome = GameLogic.determineBlackjackOutcome(playerHand, dealerHand);
        if (outcome === 'win') {
            resultText = `You won ${Utils.formatMoney(betAmount * 2)}!`;
            resultColor = 'text-green-400';
        } else if (outcome === 'push') {
            resultText = "Push! Bet returned.";
            resultColor = 'text-amber-400';
        } else {
            resultText = "Dealer wins. You lost.";
            resultColor = 'text-red-400';
        }
        actionsHtml = `
            <div class="mt-4 text-center font-bold text-lg ${resultColor}">${resultText}</div>
            <div class="flex gap-2 mt-4">
                <button data-action="openBlackjackBetting" class="flex-1 bg-purple-600 hover:bg-purple-500 py-3 rounded-lg text-white font-bold text-sm transition">Play Again</button>
                <button data-action="closeAllModals" class="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg text-white font-bold text-sm transition">Close</button>
            </div>
        `;
    }
    
    const htmlContent = `
        <div class="flex flex-col gap-6 text-center">
            <div>
                <h4 class="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Dealer's Hand (${hideDealerCard ? dealerTotal + ' + ?' : dealerTotal})</h4>
                ${renderHand(dealerHand, hideDealerCard)}
            </div>
            <div>
                <h4 class="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Your Hand (${playerTotal})</h4>
                ${renderHand(playerHand, false)}
                <div class="text-xs font-semibold text-slate-400 mt-2">Bet Wagered: <strong class="text-emerald-400">${Utils.formatMoney(betAmount)}</strong></div>
            </div>
            ${actionsHtml}
        </div>
    `;
    
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("Blackjack", htmlContent);
    } else {
        UI.showCustomModal("Blackjack", htmlContent);
    }
}

export function blackjackHit() {
    if (isBlackjackProcessing || !activeBlackjackState || activeBlackjackState.status !== 'playing') return;
    isBlackjackProcessing = true;
    try {
        const { playerHand, deck } = activeBlackjackState;
        playerHand.push(deck.pop());
        
        if (GameLogic.calculateBlackjackHand(playerHand) > 21) {
            finishBlackjackGame(false);
        } else {
            renderBlackjackGame();
        }
    } finally {
        isBlackjackProcessing = false;
    }
}

export function blackjackStand() {
    if (isBlackjackProcessing || !activeBlackjackState || activeBlackjackState.status !== 'playing') return;
    isBlackjackProcessing = true;
    try {
        finishBlackjackGame(false);
    } finally {
        isBlackjackProcessing = false;
    }
}

function finishBlackjackGame(playerNaturalBlackjack) {
    if (!activeBlackjackState) return;
    
    activeBlackjackState.status = 'finished';
    const { playerHand, dealerHand, deck, betAmount } = activeBlackjackState;
    const playerTotal = GameLogic.calculateBlackjackHand(playerHand);
    
    if (!playerNaturalBlackjack && playerTotal <= 21) {
        while (GameLogic.calculateBlackjackHand(dealerHand) < 17) {
            dealerHand.push(deck.pop());
        }
    }
    
    const outcome = GameLogic.determineBlackjackOutcome(playerHand, dealerHand);
    const user = state.gameState.user;
    
    if (outcome === 'win') {
        user.money += betAmount * 2;
        addLog(`Won ${Utils.formatMoney(betAmount)} at Blackjack!`, 'good');
    } else if (outcome === 'push') {
        user.money += betAmount;
        addLog(`Pushed ${Utils.formatMoney(betAmount)} at Blackjack.`, 'neutral');
    } else {
        addLog(`Lost ${Utils.formatMoney(betAmount)} at Blackjack.`, 'bad');
    }
    
    saveGame();
    UI.updateHeader(user);
    renderBlackjackGame();
}


// ==========================================
// GAME 2: EUROPEAN ROULETTE
// ==========================================

export function openRouletteModal() {
    const user = state.gameState.user;
    if (user.money < 25) {
        UI.showModal("Insufficient Cash", `You need at least ${Utils.formatMoney(25)} to play Roulette.`);
        return;
    }

    const numberOptions = Array.from({ length: 37 }, (_, i) => {
        let colorClass = 'bg-green-600 border-green-500';
        if (i > 0) {
            colorClass = GameLogic.ROULETTE_RED_NUMBERS.includes(i) ? 'bg-red-600 border-red-500' : 'bg-slate-900 border-slate-700';
        }
        return `<option value="${i}" class="${colorClass}">${i} ${i === 0 ? '(Green)' : GameLogic.ROULETTE_RED_NUMBERS.includes(i) ? '(Red)' : '(Black)'}</option>`;
    }).join('');

    const maxWager = Math.min(user.money, 100000);

    const htmlContent = `
        <div class="space-y-4 text-left">
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Bet Amount</label>
                <div class="flex items-center gap-2">
                    <input type="number" id="roulette-bet-amt" value="${Math.min(100, user.money)}" min="25" max="${maxWager}" class="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-red-500">
                </div>
                <div class="grid grid-cols-4 gap-1 mt-2">
                    <button onclick="document.getElementById('roulette-bet-amt').value = 25" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1 rounded font-bold border border-slate-700">${Utils.formatMoney(25)}</button>
                    <button onclick="document.getElementById('roulette-bet-amt').value = 100" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1 rounded font-bold border border-slate-700">${Utils.formatMoney(100)}</button>
                    <button onclick="document.getElementById('roulette-bet-amt').value = 500" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1 rounded font-bold border border-slate-700">${Utils.formatMoney(500)}</button>
                    <button onclick="document.getElementById('roulette-bet-amt').value = ${Math.min(2500, maxWager)}" class="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs py-1 rounded font-bold border border-slate-700">${Utils.formatMoney(Math.min(2500, maxWager))}</button>
                </div>
            </div>

            <div class="pt-2 border-t border-slate-700 space-y-2">
                <label class="block text-xs font-bold text-slate-400 uppercase">1:1 Even-Money Bets</label>
                <div class="grid grid-cols-2 gap-2">
                    <button data-action="confirmRouletteBet" data-args="'color', 'red'" class="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition">
                        🔴 Bet Red (1:1)
                    </button>
                    <button data-action="confirmRouletteBet" data-args="'color', 'black'" class="bg-slate-900 hover:bg-slate-950 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition">
                        ⚫ Bet Black (1:1)
                    </button>
                    <button data-action="confirmRouletteBet" data-args="'parity', 'even'" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-2 rounded-xl text-xs transition">
                        Even (1:1)
                    </button>
                    <button data-action="confirmRouletteBet" data-args="'parity', 'odd'" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-2 rounded-xl text-xs transition">
                        Odd (1:1)
                    </button>
                    <button data-action="confirmRouletteBet" data-args="'range', 'low'" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-2 rounded-xl text-xs transition">
                        1 - 18 Low (1:1)
                    </button>
                    <button data-action="confirmRouletteBet" data-args="'range', 'high'" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-2 rounded-xl text-xs transition">
                        19 - 36 High (1:1)
                    </button>
                </div>
            </div>

            <div class="pt-3 border-t border-slate-700">
                <label class="block text-xs font-bold text-amber-400 uppercase mb-1">35:1 Straight Up Number Bet</label>
                <div class="flex gap-2">
                    <select id="roulette-single-num" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none">
                        ${numberOptions}
                    </select>
                    <button data-action="confirmRouletteSingleNumberBet" class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow">
                        Bet Number (35:1)
                    </button>
                </div>
            </div>

            <div class="pt-3 border-t border-slate-700">
                <button data-action="closeAllModals" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition">
                    Exit to Casino Floor
                </button>
            </div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("European Roulette Floor", htmlContent);
    } else {
        UI.showCustomModal("European Roulette Floor", htmlContent);
    }
}

export function confirmRouletteSingleNumberBet() {
    const numSelect = get('roulette-single-num');
    if (!numSelect) return;
    const targetNum = parseInt(numSelect.value, 10);
    confirmRouletteBet('number', targetNum);
}

export function confirmRouletteBet(type, target) {
    if (isRouletteSpinning) return;
    const amtInp = get('roulette-bet-amt');
    if (!amtInp) return;
    const betAmount = parseInt(amtInp.value, 10);
    const user = state.gameState?.user;
    if (!user) return;

    if (isNaN(betAmount) || betAmount < 25) {
        UI.showModal("Invalid Bet", `Minimum roulette bet is ${Utils.formatMoney(25)}.`);
        return;
    }
    if (user.money < betAmount) {
        UI.showModal("Insufficient Cash", `You need ${Utils.formatMoney(betAmount)} to place this bet.`);
        return;
    }

    isRouletteSpinning = true;

    // Spin animation sequence
    const spinHtml = `
        <div class="text-center py-6 space-y-4">
            <div class="w-20 h-20 rounded-full border-4 border-amber-400 border-t-red-600 animate-spin mx-auto flex items-center justify-center text-2xl shadow-xl">
                🎰
            </div>
            <div class="text-sm font-bold text-amber-300 animate-pulse">The ball is rolling...</div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("Spinning Roulette Wheel...", spinHtml);
    } else {
        UI.showCustomModal("Spinning Roulette Wheel...", spinHtml);
    }

    setTimeout(() => {
        try {
            const result = GameLogic.playRoulette(user, type, target, betAmount);
            saveGame();
            UI.updateHeader(user);

            if (result.isWin) {
                addLog(`Roulette Win! ${result.msg}`, 'good');
            } else {
                addLog(`Roulette Loss. ${result.msg}`, 'bad');
            }

            const colorBadge = result.winningColor === 'red' ? 'bg-red-600' : result.winningColor === 'black' ? 'bg-slate-900 border border-slate-700' : 'bg-green-600';

            const resultHtml = `
                <div class="text-center py-4 space-y-4">
                    <div class="w-20 h-20 rounded-full ${colorBadge} mx-auto flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl border-4 border-amber-400">
                        ${result.winningNumber}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold ${result.isWin ? 'text-emerald-400' : 'text-red-400'}">${result.isWin ? 'WINNER!' : 'NO MATCH'}</h3>
                        <p class="text-sm text-slate-300 mt-1">${result.msg}</p>
                    </div>
                    <div class="flex gap-2 pt-2">
                        <button data-action="openRouletteModal" class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition">Spin Again</button>
                        <button data-action="closeAllModals" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition">Exit to Casino Floor</button>
                    </div>
                </div>
            `;

            UI.replaceModalContent("Roulette Outcome", resultHtml);
        } finally {
            isRouletteSpinning = false;
        }
    }, 1200);
}


// ==========================================
// GAME 3: HIGH-ROLLER SLOT MACHINE
// ==========================================

export function openSlotsModal() {
    const user = state.gameState.user;
    if (user.money < 10) {
        UI.showModal("Insufficient Cash", `You need at least ${Utils.formatMoney(10)} to play slots.`);
        return;
    }

    const htmlContent = `
        <div class="space-y-4 text-left">
            <div class="bg-gradient-to-r from-amber-950/60 to-purple-950/60 p-3 rounded-xl border border-amber-500/40 text-center">
                <div class="text-xs font-bold text-amber-300 uppercase tracking-wider">Symbol Multipliers</div>
                <div class="grid grid-cols-3 gap-2 mt-2 text-[11px] text-slate-300">
                    <div>💎 💎 💎 <strong class="text-amber-400">50x Jackpot</strong></div>
                    <div>7️⃣ 7️⃣ 7️⃣ <strong class="text-emerald-400">10x</strong></div>
                    <div>🔔 🔔 🔔 <strong class="text-emerald-400">5x</strong></div>
                    <div>🍒 🍒 🍒 <strong class="text-emerald-400">3x</strong></div>
                    <div>🍋 🍋 🍋 <strong class="text-emerald-400">2x</strong></div>
                    <div>🍇 🍇 🍇 <strong class="text-emerald-400">1.5x</strong></div>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Select Spin Wager</label>
                <div class="grid grid-cols-2 gap-2">
                    <button data-action="confirmSlotsSpin" data-args="10" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-xl text-left transition">
                        <div class="text-xs text-slate-400">Penny Slot</div>
                        <div class="font-bold text-white text-base">${Utils.formatMoney(10)}</div>
                    </button>
                    <button data-action="confirmSlotsSpin" data-args="50" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-xl text-left transition">
                        <div class="text-xs text-slate-400">Regular Spin</div>
                        <div class="font-bold text-white text-base">${Utils.formatMoney(50)}</div>
                    </button>
                    <button data-action="confirmSlotsSpin" data-args="250" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-xl text-left transition">
                        <div class="text-xs text-slate-400">High Roller</div>
                        <div class="font-bold text-amber-300 text-base">${Utils.formatMoney(250)}</div>
                    </button>
                    <button data-action="confirmSlotsSpin" data-args="1000" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-xl text-left transition">
                        <div class="text-xs text-slate-400">VIP Spin</div>
                        <div class="font-bold text-amber-400 text-base">${Utils.formatMoney(1000)}</div>
                    </button>
                </div>
                ${user.money >= 5000 ? `
                    <button data-action="confirmSlotsSpin" data-args="5000" class="w-full mt-2 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-extrabold p-3 rounded-xl text-sm transition shadow">
                        🔥 Whale Spin (${Utils.formatMoney(5000)})
                    </button>
                ` : ''}
            </div>

            <div class="pt-3 border-t border-slate-700">
                <button data-action="closeAllModals" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition">
                    Exit to Casino Floor
                </button>
            </div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("High-Roller Slots", htmlContent);
    } else {
        UI.showCustomModal("High-Roller Slots", htmlContent);
    }
}

export function confirmSlotsSpin(betAmount) {
    if (isSlotsSpinning) return;
    const wager = parseInt(betAmount, 10);
    const user = state.gameState?.user;
    if (!user) return;

    if (isNaN(wager) || wager < 10) {
        UI.showModal("Invalid Bet", `Minimum slots wager is ${Utils.formatMoney(10)}.`);
        return;
    }

    if (user.money < wager) {
        UI.showModal("Insufficient Cash", `You need ${Utils.formatMoney(wager)} to spin.`);
        return;
    }

    isSlotsSpinning = true;

    // Animated reel spin phase
    const spinHtml = `
        <div class="text-center py-6 space-y-4">
            <div class="flex justify-center items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-amber-500/40 shadow-inner">
                <div class="w-16 h-20 bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-4xl animate-bounce">🎰</div>
                <div class="w-16 h-20 bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-4xl animate-bounce delay-100">🎰</div>
                <div class="w-16 h-20 bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-4xl animate-bounce delay-200">🎰</div>
            </div>
            <div class="text-xs font-bold text-amber-300 uppercase tracking-widest animate-pulse">Good Luck!</div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        UI.replaceModalContent("Spinning Reels...", spinHtml);
    } else {
        UI.showCustomModal("Spinning Reels...", spinHtml);
    }

    setTimeout(() => {
        try {
            const result = GameLogic.spinSlotMachine(user, wager);
            saveGame();
            UI.updateHeader(user);

            if (result.isWin) {
                addLog(`Slots Win! ${result.msg}`, 'good');
            } else {
                addLog(`Slots Loss. ${result.msg}`, 'bad');
            }

            const reelsHtml = result.reels.map(r => `
                <div class="w-16 h-20 bg-slate-900 border-2 ${result.isWin ? 'border-amber-400' : 'border-slate-700'} rounded-xl flex items-center justify-center text-4xl shadow-md">
                    ${r.icon}
                </div>
            `).join('');

            const resultHtml = `
                <div class="text-center py-4 space-y-4">
                    <div class="flex justify-center items-center gap-3">
                        ${reelsHtml}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold ${result.isWin ? 'text-amber-300' : 'text-slate-400'}">
                            ${result.isJackpot ? '🎉 MEGA JACKPOT! 🎉' : result.isWin ? 'WINNER!' : 'NO MATCH'}
                        </h3>
                        <p class="text-sm text-slate-300 mt-1">${result.msg}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-2 pt-2">
                        <button data-action="confirmSlotsSpin" data-args="${wager}" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition">Spin (${Utils.formatMoney(wager)})</button>
                        <button data-action="openSlotsModal" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition">Change Bet</button>
                        <button data-action="closeAllModals" class="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition">Exit Machine</button>
                    </div>
                </div>
            `;

            UI.replaceModalContent("Slot Result", resultHtml);
        } finally {
            isSlotsSpinning = false;
        }
    }, 1200);
}
