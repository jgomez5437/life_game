import { state } from '../core/state.js';

export const COUNTRIES_DATA = [
    {
        name: "United States",
        code: "us",
        currency: "USD",
        symbol: "$",
        locale: "en-US",
        cities: ["New York", "Los Angeles", "San Francisco", "Chicago", "Houston", "Miami", "Tucson"]
    },
    {
        name: "United Kingdom",
        code: "gb",
        currency: "GBP",
        symbol: "£",
        locale: "en-GB",
        cities: ["London", "Manchester", "Edinburgh"]
    },
    {
        name: "Japan",
        code: "jp",
        currency: "JPY",
        symbol: "¥",
        locale: "ja-JP",
        cities: ["Tokyo", "Osaka", "Kyoto"]
    },
    {
        name: "Germany",
        code: "de",
        currency: "EUR",
        symbol: "€",
        locale: "de-DE",
        cities: ["Berlin", "Munich", "Frankfurt"]
    },
    {
        name: "France",
        code: "fr",
        currency: "EUR",
        symbol: "€",
        locale: "fr-FR",
        cities: ["Paris", "Lyon", "Marseille"]
    },
    {
        name: "Spain",
        code: "es",
        currency: "EUR",
        symbol: "€",
        locale: "es-ES",
        cities: ["Madrid", "Barcelona"]
    },
    {
        name: "Italy",
        code: "it",
        currency: "EUR",
        symbol: "€",
        locale: "it-IT",
        cities: ["Rome", "Milan", "Venice"]
    },
    {
        name: "Canada",
        code: "ca",
        currency: "CAD",
        symbol: "CA$",
        locale: "en-CA",
        cities: ["Toronto", "Vancouver", "Montreal"]
    },
    {
        name: "Mexico",
        code: "mx",
        currency: "MXN",
        symbol: "MX$",
        locale: "es-MX",
        cities: ["Mexico City", "Guadalajara"]
    },
    {
        name: "China",
        code: "cn",
        currency: "CNY",
        symbol: "CN¥",
        locale: "zh-CN",
        cities: ["Beijing", "Shanghai", "Shenzhen"]
    },
    {
        name: "South Korea",
        code: "kr",
        currency: "KRW",
        symbol: "₩",
        locale: "ko-KR",
        cities: ["Seoul", "Busan"]
    },
    {
        name: "Australia",
        code: "au",
        currency: "AUD",
        symbol: "A$",
        locale: "en-AU",
        cities: ["Sydney", "Melbourne", "Brisbane"]
    },
    {
        name: "India",
        code: "in",
        currency: "INR",
        symbol: "₹",
        locale: "en-IN",
        cities: ["Mumbai", "New Delhi", "Bengaluru"]
    },
    {
        name: "Brazil",
        code: "br",
        currency: "BRL",
        symbol: "R$",
        locale: "pt-BR",
        cities: ["Rio de Janeiro", "São Paulo"]
    },
    {
        name: "South Africa",
        code: "za",
        currency: "ZAR",
        symbol: "R",
        locale: "en-ZA",
        cities: ["Cape Town", "Johannesburg"]
    },
    {
        name: "United Arab Emirates",
        code: "ae",
        currency: "AED",
        symbol: "AED",
        locale: "ar-AE",
        cities: ["Dubai", "Abu Dhabi"]
    },
    {
        name: "Singapore",
        code: "sg",
        currency: "SGD",
        symbol: "S$",
        locale: "en-SG",
        cities: ["Singapore"]
    },
    {
        name: "Sweden",
        code: "se",
        currency: "SEK",
        symbol: "kr",
        locale: "sv-SE",
        cities: ["Stockholm"]
    },
    {
        name: "Brunei",
        code: "bn",
        currency: "BND",
        symbol: "B$",
        locale: "ms-BN",
        cities: ["Bandar Seri Begawan"]
    },
    {
        name: "Egypt",
        code: "eg",
        currency: "EGP",
        symbol: "E£",
        locale: "ar-EG",
        cities: ["Cairo"]
    },
    {
        name: "Argentina",
        code: "ar",
        currency: "ARS",
        symbol: "$",
        locale: "es-AR",
        cities: ["Buenos Aires"]
    }
];

function getCurrencyInfo(cityOrCountry) {
    if (!cityOrCountry) return { currency: 'USD', symbol: '$', locale: 'en-US', country: 'United States', code: 'us' };
    const query = String(cityOrCountry).trim().toLowerCase();
    
    let found = COUNTRIES_DATA.find(c => c.name.toLowerCase() === query);
    if (!found) {
        found = COUNTRIES_DATA.find(c => c.cities.some(city => city.toLowerCase() === query));
    }
    
    return found 
        ? { currency: found.currency, symbol: found.symbol, locale: found.locale, country: found.name, code: found.code } 
        : { currency: 'USD', symbol: '$', locale: 'en-US', country: 'United States', code: 'us' };
}

export const Utils = {
    getCurrencyInfo,

    // format money based on active character's city or specified city
    formatMoney: (num, customCity = null) => {
        const city = customCity || (state.gameState && state.gameState.user && (state.gameState.user.city || state.gameState.user.country));
        const info = getCurrencyInfo(city);
        const amount = Math.round(num || 0);
        const absFormatted = Math.abs(amount).toLocaleString('en-US');
        const sign = amount < 0 ? '-' : '';
        const symbol = info.symbol || '$';
        
        const formattedSymbol = /[A-Za-z]$/.test(symbol) ? `${symbol} ` : symbol;
        return `${sign}${formattedSymbol}${absFormatted}`;
    },

    formatCompactMoney: (num, customCity = null) => {
        const amount = Math.round(num || 0);
        const absVal = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';
        const city = customCity || (state.gameState && state.gameState.user && (state.gameState.user.city || state.gameState.user.country));
        const info = getCurrencyInfo(city);
        const symbol = info.symbol || '$';
        const formattedSymbol = /[A-Za-z]$/.test(symbol) ? `${symbol} ` : symbol;

        if (absVal >= 1000000000000) {
            const formatted = parseFloat((absVal / 1000000000000).toFixed(2));
            return `${sign}${formattedSymbol}${formatted}T`;
        }
        if (absVal >= 1000000000) {
            const formatted = parseFloat((absVal / 1000000000).toFixed(2));
            return `${sign}${formattedSymbol}${formatted}B`;
        }
        if (absVal >= 1000000) {
            const formatted = parseFloat((absVal / 1000000).toFixed(2));
            return `${sign}${formattedSymbol}${formatted}M`;
        }
        if (absVal >= 100000) {
            const formatted = parseFloat((absVal / 1000).toFixed(1));
            return `${sign}${formattedSymbol}${formatted}K`;
        }
        return Utils.formatMoney(num, customCity);
    },
    
    // random integer
    getRandomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Clamps any numeric value within [min, max]
    clamp: (val, min = 0, max = 100) => {
        const num = typeof val === 'number' && !isNaN(val) ? val : min;
        return Math.max(min, Math.min(max, num));
    },

    // Standard clamp for character core stats (0 - 100)
    clampStat: (val, fallback = 50) => {
        const num = typeof val === 'number' && !isNaN(val) ? val : fallback;
        return Math.max(0, Math.min(100, num));
    },

    // HTML Escaping utility to prevent XSS across template literals & innerHTML
    escapeHtml,

    // Return the 2-letter ISO country code
    getCountryCode: (city) => {
        const info = getCurrencyInfo(city);
        return info ? info.code : 'us';
    },

    // Guest Storage for saving/loading
    guestStorage: {
        SAVE_KEY: 'startALife_saveData',

        saveGame: () => {
            const currentState = state.gameState;
            try {
                const serializedState = JSON.stringify(currentState);
                localStorage.setItem(Utils.guestStorage.SAVE_KEY, serializedState);
                console.log("Game saved successfully.");
                return true;
            } catch (err) {
                console.error("Save failed:", err);
                // Alert user so they know their progress may not be saved
                try {
                    const alertEl = document.getElementById('save-failure-alert');
                    if (!alertEl) {
                        const toast = document.createElement('div');
                        toast.id = 'save-failure-alert';
                        toast.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#7f1d1d;border:1px solid #ef4444;color:#fca5a5;padding:10px 18px;border-radius:10px;font-size:12px;font-weight:600;text-align:center;max-width:90vw;';
                        toast.textContent = '⚠️ Save failed — storage full. Clear browser data or your progress may be lost.';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 8000);
                    }
                } catch (uiErr) {}
                return false;
            }
        },

        loadGame: () => {
            try {
                const serializedState = localStorage.getItem(Utils.guestStorage.SAVE_KEY);
                if (serializedState === null) {
                    return null;
                }
                return JSON.parse(serializedState);
            } catch (err) {
                console.error("Load failed:", err);
                return null;
            }
        },

        clearSave: () => {
            localStorage.removeItem(Utils.guestStorage.SAVE_KEY);
            console.log("Save file deleted.");
        }
    }
};

/**
 * Escapes HTML entities in a string to prevent XSS injection attacks.
 * Converts &, <, >, ", ' into their corresponding HTML character entities.
 * @param {string|any} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

