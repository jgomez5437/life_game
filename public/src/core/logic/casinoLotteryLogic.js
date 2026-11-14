import { state } from '../state.js';
import { Utils } from '../../ui/utils.js';
import { isAlive } from './playerStatsLogic.js';

export const BASE_MEGA_JACKPOT = 20000000; // $20 Million base jackpot

export function getMegaJackpotAmount(user) {
    if (!user || typeof user.megaJackpotAmount !== 'number') return BASE_MEGA_JACKPOT;
    return user.megaJackpotAmount;
}

export function rollOverMegaJackpot(user) {
    if (!user) return BASE_MEGA_JACKPOT;
    const current = getMegaJackpotAmount(user);
    // Increases by $5M to $25M each year until won
    const growth = (Math.floor(Math.random() * 21) + 5) * 1000000;
    user.megaJackpotAmount = current + growth;
    return user.megaJackpotAmount;
}

export const LOTTERY_TYPES = {
    scratch: {
        id: 'scratch',
        name: 'Quick Cash Scratch-Off',
        price: 5,
        icon: 'fa-ticket-alt',
        color: 'text-amber-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.65, payout: 0, title: 'Sorry! Better luck next time.' },
            { minRoll: 0.65, maxRoll: 0.85, payout: 10, title: 'Winner! Won $10 ($5 Profit)' },
            { minRoll: 0.85, maxRoll: 0.95, payout: 25, title: 'Winner! Won $25!' },
            { minRoll: 0.95, maxRoll: 0.995, payout: 100, title: 'Big Winner! Won $100!' },
            { minRoll: 0.995, maxRoll: 1.00, payout: 500, title: 'JACKPOT! Won $500 Top Prize!' }
        ]
    },
    daily: {
        id: 'daily',
        name: 'State Daily Draw',
        price: 20,
        icon: 'fa-star',
        color: 'text-cyan-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.70, payout: 0, title: 'No matching numbers.' },
            { minRoll: 0.70, maxRoll: 0.88, payout: 50, title: 'Matched 2 numbers! Won $50!' },
            { minRoll: 0.88, maxRoll: 0.97, payout: 200, title: 'Matched 3 numbers! Won $200!' },
            { minRoll: 0.97, maxRoll: 0.996, payout: 1000, title: 'Matched 4 numbers! Won $1,000!' },
            { minRoll: 0.996, maxRoll: 1.00, payout: 10000, title: 'GRAND PRIZE! Matched all 5 numbers for $10,000!' }
        ]
    },
    mega: {
        id: 'mega',
        name: 'Mega Powerball Jackpot',
        price: 100,
        icon: 'fa-bolt',
        color: 'text-purple-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.75, payout: 0, title: 'No winning combination.' },
            { minRoll: 0.75, maxRoll: 0.92, payout: 250, title: 'Matched Powerball! Won $250!' },
            { minRoll: 0.92, maxRoll: 0.985, payout: 1500, title: 'Matched 3 + Powerball! Won $1,500!' },
            { minRoll: 0.985, maxRoll: 0.998, payout: 15000, title: 'Matched 4 + Powerball! Won $15,000!' },
            { minRoll: 0.998, maxRoll: 1.00, payout: 20000000, title: 'MEGA JACKPOT! Won GRAND PRIZE!' }
        ]
    }
};

export function playLotteryTicket(ticketTypeId, user) {
    if (!user) return { success: false, message: 'Invalid user state.' };
    if (!isAlive(user)) return { success: false, message: 'Cannot perform actions while dead or at 0 HP.' };

    if (typeof user.age === 'number' && user.age < 18) {
        return { success: false, message: 'You must be at least 18 years old to play the lottery.' };
    }

    const type = LOTTERY_TYPES[ticketTypeId] || LOTTERY_TYPES.scratch;
    const boughtCount = user.lotteryTicketsBoughtThisYear || 0;

    if (boughtCount >= 10) {
        return { success: false, message: 'You have reached the annual limit of 10 lottery tickets! Age up to buy more.' };
    }

    if (user.money < type.price) {
        return { success: false, message: `Insufficient funds. A ${type.name} ticket costs $${type.price}.` };
    }

    user.money -= type.price;
    user.lotteryTicketsBoughtThisYear = boughtCount + 1;

    const roll = Math.random();
    const prize = type.prizes.find(p => roll >= p.minRoll && roll < p.maxRoll) || type.prizes[0];

    let actualPayout = prize.payout;
    let actualTitle = prize.title;

    if (ticketTypeId === 'mega' && prize.payout > 0 && prize.minRoll >= 0.998) {
        actualPayout = getMegaJackpotAmount(user);
        actualTitle = `MEGA POWERBALL JACKPOT! Won $${actualPayout.toLocaleString()} GRAND PRIZE!`;
        user.megaJackpotAmount = BASE_MEGA_JACKPOT; // Reset to $20M base!
    }

    if (actualPayout > 0) {
        user.money += actualPayout;
    }

    return {
        success: true,
        payout: actualPayout,
        title: actualTitle,
        ticketName: type.name,
        ticketsRemaining: 10 - user.lotteryTicketsBoughtThisYear,
        roll
    };
}

/**
 * @returns {Array} A shuffled 52-card deck
 */
export function getDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * @param {Array} hand - Array of card objects
 * @returns {number} The best value of the blackjack hand
 */
export function calculateBlackjackHand(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else if (card.value === 'A') {
            aces += 1;
            value += 11;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }
    return value;
}

/**
 * @param {Array} playerHand 
 * @param {Array} dealerHand 
 * @returns {string} 'win', 'lose', 'push', or 'bust'
 */
export function determineBlackjackOutcome(playerHand, dealerHand) {
    const playerTotal = calculateBlackjackHand(playerHand);
    const dealerTotal = calculateBlackjackHand(dealerHand);
    
    if (playerTotal > 21) return 'bust';
    if (dealerTotal > 21) return 'win'; // dealer busts
    if (playerTotal === dealerTotal) return 'push';
    if (playerTotal > dealerTotal) return 'win';
    return 'lose';
}

export const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

/**
 * Simulates a European Roulette wheel spin and evaluates the bet outcome.
 * @param {Object} user - User state object
 * @param {string} betType - 'color' | 'parity' | 'range' | 'number'
 * @param {string|number} betTarget - 'red'/'black', 'even'/'odd', 'low'/'high', or specific number (0-36)
 * @param {number} betAmount - Amount wagered
 * @param {number} [injectedNumber=null] - Optional forced roll for unit tests
 * @returns {Object} { success, winningNumber, winningColor, isWin, multiplier, payout, netProfit, msg }
 */
export function playRoulette(user, betType, betTarget, betAmount, injectedNumber = null) {
    if (!isAlive(user)) {
        return { success: false, winningNumber: 0, winningColor: 'none', isWin: false, multiplier: 0, payout: 0, netProfit: 0, msg: 'Cannot gamble while dead or at 0 HP.' };
    }
    const wager = Math.floor(Number(betAmount) || 0);
    if (wager <= 0) {
        return { success: false, msg: 'Please enter a valid bet amount.' };
    }
    if (user.money < wager) {
        return { success: false, msg: `Insufficient funds. You need ${Utils.formatMoney(wager)} to place this bet.` };
    }

    const winningNumber = (injectedNumber !== null && typeof injectedNumber === 'number')
        ? injectedNumber
        : Math.floor(Math.random() * 37);

    let winningColor = 'green';
    if (winningNumber !== 0) {
        winningColor = ROULETTE_RED_NUMBERS.includes(winningNumber) ? 'red' : 'black';
    }

    let isWin = false;
    let multiplier = 0;

    if (betType === 'color') {
        if (betTarget === winningColor) {
            isWin = true;
            multiplier = 1;
        }
    } else if (betType === 'parity') {
        if (winningNumber !== 0) {
            const isEven = winningNumber % 2 === 0;
            if ((betTarget === 'even' && isEven) || (betTarget === 'odd' && !isEven)) {
                isWin = true;
                multiplier = 1;
            }
        }
    } else if (betType === 'range') {
        if (winningNumber !== 0) {
            const isLow = winningNumber >= 1 && winningNumber <= 18;
            if ((betTarget === 'low' && isLow) || (betTarget === 'high' && !isLow)) {
                isWin = true;
                multiplier = 1;
            }
        }
    } else if (betType === 'number') {
        const targetNum = parseInt(betTarget, 10);
        if (targetNum === winningNumber) {
            isWin = true;
            multiplier = 35;
        }
    }

    if (isWin) {
        const netProfit = wager * multiplier;
        const totalPayout = wager + netProfit;
        user.money += netProfit;
        return {
            success: true,
            winningNumber,
            winningColor,
            isWin: true,
            multiplier,
            payout: totalPayout,
            netProfit,
            msg: `Winning number ${winningNumber} (${winningColor.toUpperCase()})! Won ${Utils.formatMoney(totalPayout)}!`
        };
    } else {
        user.money -= wager;
        return {
            success: true,
            winningNumber,
            winningColor,
            isWin: false,
            multiplier: 0,
            payout: 0,
            netProfit: -wager,
            msg: `Landed on ${winningNumber} (${winningColor.toUpperCase()}). Lost ${Utils.formatMoney(wager)}.`
        };
    }
}

export const SLOT_SYMBOLS = [
    { icon: '💎', name: 'Diamond', weight: 6, payout3: 50, payout2: 5 },
    { icon: '7️⃣', name: 'Seven', weight: 10, payout3: 15, payout2: 0 },
    { icon: '🔔', name: 'Bell', weight: 16, payout3: 8, payout2: 0 },
    { icon: '🍒', name: 'Cherry', weight: 22, payout3: 4, payout2: 1.5 },
    { icon: '🍋', name: 'Lemon', weight: 23, payout3: 2, payout2: 0 },
    { icon: '🍇', name: 'Grape', weight: 23, payout3: 1.5, payout2: 0 }
];

export function getRandomSlotSymbol() {
    const totalWeight = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of SLOT_SYMBOLS) {
        if (rand < sym.weight) return sym;
        rand -= sym.weight;
    }
    return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

/**
 * Simulates a 3-reel high-roller slot machine spin.
 * @param {Object} user 
 * @param {number} betAmount 
 * @param {Array} [injectedReels=null] - Optional forced reels array e.g. [symObj, symObj, symObj]
 * @returns {Object} { success, reels, isWin, isJackpot, multiplier, totalPayout, netProfit, msg }
 */
export function spinSlotMachine(user, betAmount, injectedReels = null) {
    if (!isAlive(user)) {
        return { success: false, reels: [], isWin: false, isJackpot: false, multiplier: 0, totalPayout: 0, netProfit: 0, msg: 'Cannot gamble while dead or at 0 HP.' };
    }
    const wager = Math.floor(Number(betAmount) || 0);
    if (wager <= 0) {
        return { success: false, msg: 'Please select a valid bet amount.' };
    }
    if (user.money < wager) {
        return { success: false, msg: `Insufficient funds. You need ${Utils.formatMoney(wager)} to spin.` };
    }

    const reels = injectedReels || [
        getRandomSlotSymbol(),
        getRandomSlotSymbol(),
        getRandomSlotSymbol()
    ];

    const [r1, r2, r3] = reels;
    let multiplier = 0;
    let isJackpot = false;

    if (r1.name === r2.name && r2.name === r3.name) {
        if (r1.name === 'Diamond') {
            multiplier = 50;
            isJackpot = true;
        } else {
            multiplier = r1.payout3;
        }
    } else {
        const diamondCount = reels.filter(r => r.name === 'Diamond').length;
        const cherryCount = reels.filter(r => r.name === 'Cherry').length;

        if (diamondCount === 2) {
            multiplier = 5;
        } else if (cherryCount === 2) {
            multiplier = 1.5;
        } else if (diamondCount === 1) {
            multiplier = 1;
        } else {
            multiplier = 0;
        }
    }

    const isWin = multiplier > 0;
    if (isWin) {
        const totalPayout = Math.floor(wager * multiplier);
        const netProfit = totalPayout - wager;
        user.money += netProfit;
        return {
            success: true,
            reels,
            isWin: true,
            isJackpot,
            multiplier,
            totalPayout,
            netProfit,
            msg: isJackpot 
                ? `🎰 MEGA JACKPOT! 3 Diamonds! Won ${Utils.formatMoney(totalPayout)}! (50x)`
                : `Matched ${reels.map(r => r.icon).join(' ')}! Won ${Utils.formatMoney(totalPayout)}!`
        };
    } else {
        user.money -= wager;
        return {
            success: true,
            reels,
            isWin: false,
            isJackpot: false,
            multiplier: 0,
            totalPayout: 0,
            netProfit: -wager,
            msg: `Spun ${reels.map(r => r.icon).join(' ')}. No match! Lost ${Utils.formatMoney(wager)}.`
        };
    }
}

/**
 * Calculates outcome of a vacation
 * @param {number} tier - 1 (Local), 2 (Cross-Country), 3 (Luxury)
 * @param {number} [roll=Math.random()] - Injectable random roll
 */
export function calculateTripOutcome(tier, roll = Math.random()) {
    let baseHealthBoost = 0;
    let baseHappinessBoost = 0;
    let baseCost = 0;
    let tripName = "";

    if (tier === 1) {
        baseCost = 500;
        baseHealthBoost = 5;
        baseHappinessBoost = 10;
        tripName = "Local Getaway";
    } else if (tier === 2) {
        baseCost = 2000;
        baseHealthBoost = 10;
        baseHappinessBoost = 20;
        tripName = "Cross-Country Trip";
    } else if (tier === 3) {
        baseCost = 10000;
        baseHealthBoost = 15;
        baseHappinessBoost = 35;
        tripName = "Luxury International Tour";
    }

    const events = [
        { msg: "You had a perfectly relaxing trip.", healthMod: 0, happinessMod: 5, moneyMod: 0 },
        { msg: "You found a hidden gem and felt completely revitalized!", healthMod: 5, happinessMod: 10, moneyMod: 0 },
        { msg: "You were attacked on vacation.", healthMod: -20, happinessMod: -25, moneyMod: 0 },
        { msg: "You got food poisoning from a shady restaurant.", healthMod: -5, happinessMod: -10, moneyMod: 0 },
        { msg: "You lost your wallet at the beach.", healthMod: 0, happinessMod: -10, moneyMod: -200 },
        { msg: "You won a local contest and got some cash!", healthMod: 0, happinessMod: 15, moneyMod: 300 },
        { msg: "Your luggage was lost, ruining your mood.", healthMod: -2, happinessMod: -15, moneyMod: 0 },
        { msg: "You met a fantastic new friend who showed you around.", healthMod: 3, happinessMod: 10, moneyMod: 0 }
    ];

    const eventIndex = Math.floor(roll * events.length);
    const selectedEvent = events[eventIndex];

    const finalHealthBoost = baseHealthBoost + selectedEvent.healthMod;
    const finalHappinessBoost = Math.max(0, baseHappinessBoost + (selectedEvent.happinessMod || 0));

    return {
        tripName,
        cost: baseCost,
        moneyChange: selectedEvent.moneyMod,
        healthChange: finalHealthBoost,
        happinessChange: finalHappinessBoost,
        eventMessage: selectedEvent.msg
    };
}
