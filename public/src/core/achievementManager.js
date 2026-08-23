import { state, addLog } from './state.js';
import { Utils } from '../ui/utils.js';

export const ACHIEVEMENTS_CATALOG = [
    {
        id: 'centenarian',
        title: 'The Centenarian',
        category: 'life',
        categoryName: 'Life & Longevity',
        description: 'Live to celebrate your 100th birthday in a single lifetime.',
        icon: 'fa-birthday-cake',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        badgeColor: 'border-amber-500/40 text-amber-300',
        isWild: false,
        hint: null
    },
    {
        id: 'unicorn_tycoon',
        title: 'Unicorn Tycoon',
        category: 'business',
        categoryName: 'Business & Wealth',
        description: 'Scale a company valuation beyond $1,000,000,000 (1 Billion) or launch a public IPO.',
        icon: 'fa-rocket',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        badgeColor: 'border-emerald-500/40 text-emerald-300',
        isWild: false,
        hint: null
    },
    {
        id: 'the_godfather',
        title: 'The Godfather',
        category: 'crime',
        categoryName: 'Crime & Underworld',
        description: 'Rise through the mafia ranks to become the Don or Godfather of the Crime Syndicate.',
        icon: 'fa-user-ninja',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        badgeColor: 'border-red-500/40 text-red-300',
        isWild: false,
        hint: null
    },
    {
        id: 'supermax_houdini',
        title: 'Supermax Houdini',
        category: 'wild',
        categoryName: 'Wild & Absurd',
        description: 'Successfully escape from a maximum security prison facility.',
        icon: 'fa-dungeon',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        badgeColor: 'border-orange-500/40 text-orange-300',
        isWild: true,
        hint: 'Find a way through the barbed wire and prison walls.'
    },
    {
        id: 'mega_jackpot',
        title: 'Mega Jackpot Winner',
        category: 'luck',
        categoryName: 'Casino & Luck',
        description: 'Win a mega jackpot on the Casino Slots or the Mega Lottery.',
        icon: 'fa-dice-five',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        badgeColor: 'border-purple-500/40 text-purple-300',
        isWild: false,
        hint: null
    },
    {
        id: 'living_on_the_edge',
        title: 'Living on the Edge',
        category: 'wild',
        categoryName: 'Wild & Absurd',
        description: 'Survive an entire year (Age Up) with Health ≤ 5% and Happiness ≤ 5% without dying.',
        icon: 'fa-skull-crossbones',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
        badgeColor: 'border-rose-500/40 text-rose-300',
        isWild: true,
        hint: 'Push your body and mind to the brink of disaster and survive.'
    },
    {
        id: 'real_estate_baron',
        title: 'Real Estate Baron',
        category: 'business',
        categoryName: 'Assets & Wealth',
        description: 'Own at least 5 rental properties simultaneously with active paying tenants.',
        icon: 'fa-building',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        badgeColor: 'border-blue-500/40 text-blue-300',
        isWild: false,
        hint: null
    },
    {
        id: 'polymath_scholar',
        title: 'Polymath Scholar',
        category: 'life',
        categoryName: 'Education & Intellect',
        description: 'Graduate University with ≥ 95% Smarts and complete Medical, Law, or Business Graduate School.',
        icon: 'fa-graduation-cap',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        badgeColor: 'border-indigo-500/40 text-indigo-300',
        isWild: false,
        hint: null
    },
    {
        id: 'gold_digger',
        title: "Gold Digger's Paradise",
        category: 'wild',
        categoryName: 'Romance & Wealth',
        description: 'Marry a wealthy partner or spouse with a net worth over $5,000,000.',
        icon: 'fa-ring',
        iconBg: 'bg-yellow-500/20',
        iconColor: 'text-yellow-400',
        badgeColor: 'border-yellow-500/40 text-yellow-300',
        isWild: true,
        hint: 'Find love in the highest tax bracket.'
    },
    {
        id: 'diamond_hands',
        title: 'Diamond Hands',
        category: 'business',
        categoryName: 'Investments & Markets',
        description: 'Accumulate $10,000,000 or more in stocks, crypto, or investment portfolios.',
        icon: 'fa-gem',
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
        badgeColor: 'border-cyan-500/40 text-cyan-300',
        isWild: false,
        hint: null
    },
    {
        id: 'junk_food_immortal',
        title: 'Junk Food Immortal',
        category: 'wild',
        categoryName: 'Wild & Absurd',
        description: 'Survive on the Junk Food diet continuously from age 18 to age 60 without changing plans.',
        icon: 'fa-hamburger',
        iconBg: 'bg-amber-600/20',
        iconColor: 'text-amber-500',
        badgeColor: 'border-amber-600/40 text-amber-400',
        isWild: true,
        hint: 'Processed cheese, soda, and fried meals for over 4 decades.'
    },
    {
        id: 'clean_getaway',
        title: 'The Clean Getaway',
        category: 'crime',
        categoryName: 'Crime & Underworld',
        description: 'Successfully pull off a Bank Heist and escape without getting arrested.',
        icon: 'fa-sack-dollar',
        iconBg: 'bg-red-600/20',
        iconColor: 'text-red-400',
        badgeColor: 'border-red-600/40 text-red-300',
        isWild: false,
        hint: null
    },
    {
        id: 'dynasty_founder',
        title: 'House of Dynasties',
        category: 'life',
        categoryName: 'Lineage & Legacy',
        description: 'Reach Generation 3 or higher in your family lineage via the Graveyard system.',
        icon: 'fa-monument',
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
        badgeColor: 'border-teal-500/40 text-teal-300',
        isWild: false,
        hint: null
    },
    {
        id: 'globe_trotter',
        title: 'The Globe Trotter',
        category: 'life',
        categoryName: 'Lifestyle & Travel',
        description: 'Emigrate and relocate to 3 different countries in a single lifetime.',
        icon: 'fa-plane-departure',
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
        badgeColor: 'border-sky-500/40 text-sky-300',
        isWild: false,
        hint: null
    },
    {
        id: 'near_death_experience',
        title: 'Near Death Experience',
        category: 'wild',
        categoryName: 'Wild & Absurd',
        description: 'Survive a catastrophic accident or supercar joyride crash with under 5% health remaining.',
        icon: 'fa-car-crash',
        iconBg: 'bg-rose-600/20',
        iconColor: 'text-rose-400',
        badgeColor: 'border-rose-600/40 text-rose-300',
        isWild: true,
        hint: 'Cheating death by the narrowest possible margin.'
    }
];

const STORAGE_KEY = 'life_game_achievements';

/**
 * Loads all unlocked achievement records from localStorage and state.
 * Returns an object keyed by achievement ID: { [id]: { unlocked: true, unlockedAt, characterName, generation } }
 */
export function getUnlockedAchievements() {
    let unlockedMap = {};
    if (typeof localStorage !== 'undefined') {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    unlockedMap = parsed;
                }
            }
        } catch (e) {
            console.warn('[AchievementManager] Error reading local achievements:', e);
        }
    }

    // Merge with current active character state if present
    if (state.gameState?.achievements && typeof state.gameState.achievements === 'object') {
        for (const [id, record] of Object.entries(state.gameState.achievements)) {
            if (record && record.unlocked && !unlockedMap[id]) {
                unlockedMap[id] = record;
            }
        }
    }

    return unlockedMap;
}

/**
 * Saves unlocked achievements mapping to localStorage and active gameState.
 */
function saveUnlockedAchievements(unlockedMap) {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMap));
        } catch (e) {
            console.warn('[AchievementManager] Error saving local achievements:', e);
        }
    }

    if (state.gameState) {
        state.gameState.achievements = { ...unlockedMap };
    }
}

/**
 * Returns summary progress stats: { total, unlockedCount, percentage }
 */
export function getAchievementProgress() {
    const total = ACHIEVEMENTS_CATALOG.length;
    const unlockedMap = getUnlockedAchievements();
    const unlockedCount = ACHIEVEMENTS_CATALOG.filter(a => unlockedMap[a.id]?.unlocked).length;
    const percentage = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;
    return {
        total,
        unlockedCount,
        percentage
    };
}

/**
 * Checks if a specific achievement is unlocked.
 */
export function isAchievementUnlocked(achievementId) {
    const unlockedMap = getUnlockedAchievements();
    return !!unlockedMap[achievementId]?.unlocked;
}

/**
 * Unlocks an achievement if not already unlocked.
 * Records timestamp, character name, generation, adds a major life log entry,
 * displays celebration toast notification, and persists state.
 * @param {string} achievementId
 * @param {object} [user=null]
 * @param {object} [extraData={}]
 * @returns {boolean} True if newly unlocked, false if already unlocked or invalid.
 */
export function unlockAchievement(achievementId, user = null, extraData = {}) {
    const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
    if (!achievement) {
        console.warn(`[AchievementManager] Unknown achievement ID: ${achievementId}`);
        return false;
    }

    const unlockedMap = getUnlockedAchievements();
    if (unlockedMap[achievementId]?.unlocked) {
        return false; // Already unlocked
    }

    const activeUser = user || state.gameState?.user;
    const characterName = activeUser?.username || activeUser?.name || 'Unknown Adventurer';
    const generation = activeUser?.generation || (state.gameState?.pastLives?.length ? state.gameState.pastLives.length + 1 : 1);

    const record = {
        id: achievementId,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        characterName,
        generation,
        ...extraData
    };

    unlockedMap[achievementId] = record;
    saveUnlockedAchievements(unlockedMap);

    // Add celebration entry to life log
    addLog(`🏆 Achievement Unlocked: ${achievement.title} — ${achievement.description}`, 'major');

    // Trigger celebration toast UI notification
    triggerAchievementToast(achievement);

    console.log(`🎉 [Achievement Unlocked] ${achievement.title} by ${characterName}`);
    return true;
}

/**
 * Triggers non-blocking UI celebration toast for newly unlocked achievement.
 */
export async function triggerAchievementToast(achievement) {
    if (typeof document === 'undefined') return;
    try {
        const { showAchievementToast } = await import('../features/more/achievementsScreen.js');
        if (typeof showAchievementToast === 'function') {
            showAchievementToast(achievement);
        }
    } catch (e) {
        console.warn('[AchievementManager] Toast notification trigger warning:', e);
    }
}

/**
 * Batch checks periodic conditions during age up or state changes.
 * @param {object} user
 */
export function checkPeriodicAchievements(user) {
    if (!user) return;

    // 1. The Centenarian (Age >= 100)
    if (user.age >= 100) {
        unlockAchievement('centenarian', user);
    }

    // 2. Living on the Edge (Health <= 5 and Happiness <= 5 while surviving ageUp)
    const health = user.health ?? user.stats?.health ?? 100;
    const happiness = user.happiness ?? user.stats?.happiness ?? 100;
    if (health <= 5 && happiness <= 5 && health > 0 && user.lifeStatus !== 'Deceased') {
        unlockAchievement('living_on_the_edge', user);
    }

    // 3. Near-Death Experience (Survive an event or age with <= 5% HP)
    if (health <= 5 && health > 0 && user.lifeStatus !== 'Deceased') {
        unlockAchievement('near_death_experience', user);
    }

    // 4. Real Estate Baron (>= 5 active properties with tenants)
    const propertyAssets = Array.isArray(user.assets) ? user.assets.filter(a => a.category === 'property' && (a.isRented || a.tenant)) : [];
    const propertyList = Array.isArray(user.properties) ? user.properties.filter(p => p && (p.hasTenant || p.tenant)) : [];
    if (propertyAssets.length >= 5 || propertyList.length >= 5) {
        unlockAchievement('real_estate_baron', user);
    }

    // 5. Diamond Hands (>= $10,000,000 in investments or crypto/stocks)
    let totalInvestments = 0;
    if (user.investments && typeof user.investments === 'object') {
        if (typeof user.investments.savings === 'number') totalInvestments += user.investments.savings;
        if (user.investments.stocks && typeof user.investments.stocks === 'object') {
            const stockMarket = Array.isArray(user.investments.stockMarket) ? user.investments.stockMarket : [];
            for (const [sym, holding] of Object.entries(user.investments.stocks)) {
                const stock = stockMarket.find(s => s.symbol === sym);
                const price = stock ? stock.price : 100;
                totalInvestments += (holding.shares || 0) * price;
            }
        }
    }
    if (Array.isArray(user.investments)) {
        totalInvestments = user.investments.reduce((acc, inv) => acc + (inv.amount || (inv.shares * (inv.currentPrice || 1)) || 0), 0);
    }
    if (totalInvestments >= 10000000 || (user.money >= 10000000 && user.hasInvested)) {
        unlockAchievement('diamond_hands', user);
    }

    // 6. Junk Food Immortal (Age >= 60 and maintained junk food without better diet)
    if (user.age >= 60 && (user.diet === 'junk' || !user.hasBetterDiet)) {
        if (user.junkFoodStreak >= 42 || user.diet === 'junk') {
            unlockAchievement('junk_food_immortal', user);
        }
    }

    // 7. Polymath Scholar
    const hasUniversity = user.education?.university?.completed || user.degrees?.university || user.hasDegree;
    const hasGrad = user.education?.gradSchool?.completed || user.degrees?.gradSchool || user.hasGradDegree;
    const smarts = user.smarts ?? user.stats?.smarts ?? 50;
    if (hasUniversity && hasGrad && smarts >= 95) {
        unlockAchievement('polymath_scholar', user);
    }

    // 8. House of Dynasties (Generation >= 3)
    const gen = user.generation || (state.gameState?.pastLives?.length ? state.gameState.pastLives.length + 1 : 1);
    if (gen >= 3) {
        unlockAchievement('dynasty_founder', user);
    }

    // 9. Globe Trotter (Relocated >= 3 countries)
    if ((user.relocationsCount || 0) >= 3 || (Array.isArray(user.visitedCountries) && user.visitedCountries.length >= 3)) {
        unlockAchievement('globe_trotter', user);
    }

    // 10. The Godfather (Rank: The Don / Level >= 4 on mafia track)
    if (user.careerTrack === 'mafia_syndicate' && (user.careerLevel >= 4 || user.jobTitle === 'The Don')) {
        unlockAchievement('the_godfather', user);
    }
}

/**
 * Resets local achievement records (useful for testing or full hard resets).
 */
export function resetAchievements() {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }
    if (state.gameState) {
        state.gameState.achievements = {};
    }
}

export const AchievementManager = {
    ACHIEVEMENTS_CATALOG,
    getUnlockedAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
    unlockAchievement,
    checkPeriodicAchievements,
    resetAchievements
};
