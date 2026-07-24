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
        try {
            return new Intl.NumberFormat(info.locale, {
                style: 'currency',
                currency: info.currency,
                maximumFractionDigits: 0
            }).format(num || 0);
        } catch (e) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);
        }
    },
    
    // random integer
    getRandomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

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
            } catch (err) {
                console.error("Save failed:", err);
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
