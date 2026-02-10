const Utils = {
    //format money
    formatMoney: (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num),
    
    //random integer
    getRandomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

// Return the 2-letter ISO country code
    getCountryCode: (city) => {
        if (!city) return null;

        const CITY_CODES = {
            "New York": "us",
            "Los Angeles": "us",
            "San Francisco": "us",
            "Miami": "us",
            "Tucson": "us",
            "Chicago": "us",
            "Houston": "us",
            "London": "gb",
            "Manchester": "gb",
            "Tokyo": "jp",
            "Osaka": "jp",
            "Paris": "fr",
            "Berlin": "de",
            "Madrid": "es",
            "Rome": "it",
            "Bandar Seri Begawan": "bn",
            "Beijing": "cn",
            "Shanghai": "cn",
            "Seoul": "kr",
            "Sydney": "au",
            "Toronto": "ca",
            "Rio de Janeiro": "br",
            "Mumbai": "in",
            "Mexico City": "mx",
            "Cairo": "eg"
        };

        const cleanInput = city.trim(); // Case sensitive match usually fine here if map is clean
        // Search keys case-insensitively just to be safe
        const foundKey = Object.keys(CITY_CODES).find(k => k.toLowerCase() === cleanInput.toLowerCase());
        
        return foundKey ? CITY_CODES[foundKey] : null;
    },
    // Guest Storage for saving/loading
    guestStorage: {
        SAVE_KEY: 'startALife_saveData',

        /**
         * Saves the current gameState to browser storage
         */
        saveGame: () => {
            const state = window.gameState;
            try {
                // Convert the huge object into a single string
                const serializedState = JSON.stringify(state);
                // Access the key via the parent object structure
                localStorage.setItem(Utils.guestStorage.SAVE_KEY, serializedState);
                console.log("Game saved successfully.");
            } catch (err) {
                console.error("Save failed:", err);
            }
        },

        /**
         * Loads data from storage
         * Returns: The state object OR null if no save exists
         */
        loadGame: () => {
            try {
                const serializedState = localStorage.getItem(Utils.guestStorage.SAVE_KEY);
                if (serializedState === null) {
                    return null; // No save found
                }
                // Turn the string back into a JavaScript Object
                return JSON.parse(serializedState);
            } catch (err) {
                console.error("Load failed:", err);
                return null;
            }
        },

        /**
         * Wipes the save (for Game Over or New Game)
         */
        clearSave: () => {
            localStorage.removeItem(Utils.guestStorage.SAVE_KEY);
            console.log("Save file deleted.");
        }
    }
};

//export for Jest testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils; // Node/Jest
} else {
    window.Utils = Utils;   // Browser
}