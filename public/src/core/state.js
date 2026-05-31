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
