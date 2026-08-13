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

