export const state = {
    gameState: null,
    userAuthId: null,
    userEmail: null,
    auth0Client: null,
    verifiedPurchases: null,
};

// Global getter/setters aren't strictly necessary if we export an object (it's passed by reference),
// but we can provide helper functions if we need to completely overwrite the state.
export function setGameState(newState) {
    state.gameState = newState;
    if (state.gameState) {
        if (!state.gameState.pendingEvents) state.gameState.pendingEvents = [];
        if (!state.gameState.completedEventsHistory) state.gameState.completedEventsHistory = [];
    }
    if (state.verifiedPurchases && state.gameState?.user) {
        state.gameState.user.purchases = [...state.verifiedPurchases];
    }
}

export function setVerifiedPurchases(purchases) {
    const valid = Array.isArray(purchases) ? purchases : [];
    state.verifiedPurchases = [...valid];
    if (state.gameState?.user) {
        state.gameState.user.purchases = [...valid];
        delete state.gameState.user.purchasedPacks;
        delete state.gameState.user.godMode;
        delete state.gameState.user.isVIP;
        delete state.gameState.user.vipLevel;
    }
    if (state.gameState) {
        delete state.gameState.purchases;
        delete state.gameState.purchasedPacks;
        delete state.gameState.godMode;
        delete state.gameState.isVIP;
        delete state.gameState.vipLevel;
    }
}

export function clearGameState() {
    state.gameState = null;
    state.userAuthId = null;
    state.userEmail = null;
    state.verifiedPurchases = null;
}

/**
 * Checks if the current user owns a specified pack ID.
 * Strictly checks server-authoritative verifiedPurchases or sanitized user.purchases,
 * ignoring client-side hacks like gameState.godMode or gameState.purchasedPacks.
 */
export function hasPurchasedPack(packId) {
    if (!packId) return false;

    // 1. Authoritative verified purchases array in memory
    if (Array.isArray(state.verifiedPurchases)) {
        return state.verifiedPurchases.includes(packId);
    }

    // 2. Verified user.purchases from active game state
    const user = state.gameState?.user;
    if (user) {
        if (!Array.isArray(user.purchases)) {
            user.purchases = [];
        }
        if (user.purchases.includes(packId)) {
            return true;
        }
    }

    // 3. Fallback for offline guest testing only when unauthenticated
    if (!state.userAuthId) {
        try {
            const stored = localStorage.getItem('life_game_purchases');
            if (stored) {
                const localP = JSON.parse(stored);
                if (Array.isArray(localP) && localP.includes(packId)) {
                    return true;
                }
            }
        } catch (e) {}
    }

    return false;
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


