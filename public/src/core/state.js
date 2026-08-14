export const state = {
    gameState: null,
    userAuthId: null,
    userEmail: null,
    auth0Client: null,
};

// Global getter/setters aren't strictly necessary if we export an object (it's passed by reference),
// but we can provide helper functions if we need to completely overwrite the state.
export function setGameState(newState) {
    state.gameState = newState;
}

export function clearGameState() {
    state.gameState = null;
    state.userAuthId = null;
    state.userEmail = null;
}

/**
 * Checks if the current user owns a specified pack ID.
 */
export function hasPurchasedPack(packId) {
    const user = state.gameState?.user;
    if (user && !Array.isArray(user.purchases)) {
        user.purchases = [];
    }
    let userP = user?.purchases || [];
    let localP = [];
    try {
        const stored = localStorage.getItem('life_game_purchases');
        if (stored) localP = JSON.parse(stored);
    } catch (e) {}

    const allPurchases = new Set([...userP, ...localP]);
    return allPurchases.has(packId);
}

/**
 * Adds an event entry to the character's life log in gameState.
 * @param {string} msg 
 * @param {'neutral'|'good'|'bad'|'major'|'green'} type 
 */
export function addLog(msg, type = 'neutral') {
    const currentAge = state.gameState?.user?.age ?? 0;
    let color = 'text-slate-400';
    if (type === 'good') color = 'text-green-400';
    else if (type === 'bad') color = 'text-red-400';
    else if (type === 'major') color = 'text-yellow-400 font-bold';
    else if (type === 'green') color = 'text-green-400';

    if (!state.gameState) return;
    if (!Array.isArray(state.gameState.lifeLog)) {
        state.gameState.lifeLog = [];
    }

    let ageLog = state.gameState.lifeLog.find(l => l.age === currentAge);
    if (ageLog) {
        ageLog.events.push({ msg, color });
    } else {
        state.gameState.lifeLog.unshift({ 
            age: currentAge, 
            events: [{ msg, color }] 
        });
    }
}


