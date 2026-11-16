import { state, addLog } from './state.js';
import { Utils } from '../ui/utils.js';
import { SoundManager } from './soundManager.js';
import { calculateCompanyValuation } from './logic/businessFinanceLogic.js';

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
    },
    {
        id: 'hall_of_fame_goat',
        title: 'Undisputed GOAT',
        category: 'life',
        categoryName: 'Pro Sports',
        description: 'Win 3+ Championship Rings or reach the Hall of Fame Legend tier in Pro Sports.',
        icon: 'fa-trophy',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        badgeColor: 'border-amber-500/40 text-amber-300',
        isWild: false,
        hint: null
    },
    {
        id: 'top_of_the_ladder',
        title: 'Top of the Ladder',
        category: 'life',
        categoryName: 'Career Excellence',
        description: 'Reach the pinnacle rank (Level 5 Executive/Chief) in any corporate, legal, medical, or public-service career.',
        icon: 'fa-briefcase',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        badgeColor: 'border-emerald-500/40 text-emerald-300',
        isWild: false,
        hint: null
    },
    {
        id: 'renaissance_master',
        title: 'Renaissance Virtuoso',
        category: 'life',
        categoryName: 'Skills & Mastery',
        description: 'Master 3 different Skills or Musical Instruments to 100 XP or Tier-3 Certification.',
        icon: 'fa-palette',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400',
        badgeColor: 'border-violet-500/40 text-violet-300',
        isWild: false,
        hint: null
    },
    {
        id: 'full_house',
        title: 'Full House',
        category: 'life',
        categoryName: 'Family & Legacy',
        description: 'Raise a bustling family of 5 or more children in a single lifetime.',
        icon: 'fa-users',
        iconBg: 'bg-pink-500/20',
        iconColor: 'text-pink-400',
        badgeColor: 'border-pink-500/40 text-pink-300',
        isWild: false,
        hint: null
    },
    {
        id: 'yard_kingpin',
        title: 'Yard Kingpin',
        category: 'crime',
        categoryName: 'Prison & Underworld',
        description: 'Reach 90+ Prison Respect while incarcerated and rule the cellblock from the inside.',
        icon: 'fa-fist-raised',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        badgeColor: 'border-orange-500/40 text-orange-300',
        isWild: true,
        hint: 'Command near-total respect inside the prison yard.'
    }
];

const LEGACY_STORAGE_KEY = 'life_game_achievements';
const SLOTS_STORAGE_KEY = 'life_game_slots';

/**
 * Loads unlocked achievement records strictly for the active character in state.gameState.
 * Returns an object keyed by achievement ID: { [id]: { unlocked: true, unlockedAt, characterName, generation } }
 */
export function getUnlockedAchievements() {
    if (!state.gameState) {
        return {};
    }
    if (!state.gameState.achievements || typeof state.gameState.achievements !== 'object' || Array.isArray(state.gameState.achievements)) {
        state.gameState.achievements = {};
    }
    return { ...state.gameState.achievements };
}

/**
 * Saves unlocked achievements mapping to active gameState and its active save slot.
 */
function saveUnlockedAchievements(unlockedMap) {
    const cleanMap = (unlockedMap && typeof unlockedMap === 'object' && !Array.isArray(unlockedMap))
        ? { ...unlockedMap }
        : {};

    if (state.gameState) {
        state.gameState.achievements = { ...cleanMap };
    }

    if (typeof localStorage !== 'undefined') {
        // Persist directly to the active save slot so mid-turn unlocks survive immediate refresh
        try {
            const rawSlots = localStorage.getItem(SLOTS_STORAGE_KEY);
            if (rawSlots) {
                const store = JSON.parse(rawSlots);
                const slotId = state.gameState?._slotId || store?.activeSlotId;
                if (store?.slots && slotId && store.slots[slotId]?.data) {
                    store.slots[slotId].data.achievements = { ...cleanMap };
                    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(store));
                }
            }
        } catch (e) {
            console.warn('[AchievementManager] Error syncing achievements to active save slot:', e);
        }

        if (!state.userAuthId) {
            for (const key of ['life_game_save', Utils?.guestStorage?.SAVE_KEY].filter(Boolean)) {
                try {
                    const rawGuest = localStorage.getItem(key);
                    if (rawGuest) {
                        const parsed = JSON.parse(rawGuest);
                        if (parsed && typeof parsed === 'object') {
                            parsed.achievements = { ...cleanMap };
                            localStorage.setItem(key, JSON.stringify(parsed));
                        }
                    }
                } catch (e) {}
            }
        }
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

    // Play achievement fanfare sound effect
    SoundManager.play('achievement');

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

// --- Domain Progress Calculation Helpers ---

function getRentalCount(user) {
    if (!user) return 0;
    const propertyAssets = Array.isArray(user.assets)
        ? user.assets.filter(a => a && a.category === 'property' && (a.isRented || a.tenant))
        : [];
    const propertyList = Array.isArray(user.properties)
        ? user.properties.filter(p => p && (p.hasTenant || p.tenant))
        : [];
    return Math.max(propertyAssets.length, propertyList.length);
}

function getInvestmentTotal(user) {
    if (!user) return 0;
    let total = 0;
    if (typeof user.savingsBalance === 'number' && !Number.isNaN(user.savingsBalance)) {
        total += user.savingsBalance;
    }
    if (user.investments && typeof user.investments === 'object' && !Array.isArray(user.investments)) {
        const invSavings = user.investments.savings ?? user.investments.savingsAccount?.balance ?? 0;
        if (typeof invSavings === 'number' && !Number.isNaN(invSavings)) {
            total += invSavings;
        }
        if (user.investments.stocks && typeof user.investments.stocks === 'object') {
            const stockMarket = Array.isArray(user.investments.stockMarket) ? user.investments.stockMarket : [];
            for (const [sym, holding] of Object.entries(user.investments.stocks)) {
                if (!holding || typeof holding !== 'object') continue;
                const stock = stockMarket.find(s => s.symbol === sym);
                const price = stock ? stock.price : 100;
                total += (holding.shares || 0) * price;
            }
        }
    } else if (Array.isArray(user.investments)) {
        total = user.investments.reduce((acc, inv) => acc + (inv.amount || (inv.shares * (inv.currentPrice || 1)) || 0), 0);
    }
    return Math.round(total);
}

function getBusinessValuationSafe(user) {
    if (!user) return 0;
    if (user.hasBusiness) {
        try {
            return Math.max(calculateCompanyValuation(user) || 0, user.businessValuation || 0);
        } catch (e) {
            return user.businessValuation || 0;
        }
    }
    return user.businessValuation || 0;
}

function hasUniversityDegree(user) {
    if (!user) return false;
    return Boolean(user.universityGraduated || user.education?.university?.completed || user.degrees?.university || user.hasDegree);
}

function hasGraduateDegree(user) {
    if (!user) return false;
    return Boolean(
        user.gradSchoolDegree ||
        (Array.isArray(user.gradSchoolDegrees) && user.gradSchoolDegrees.length > 0) ||
        user.education?.gradSchool?.completed ||
        user.degrees?.gradSchool ||
        user.hasGradDegree
    );
}

function isWealthySpouse(rel) {
    if (!rel || typeof rel !== 'object') return false;
    const isSpouse = rel.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(rel.type);
    if (!isSpouse || rel.isDead || rel.isAlive === false) return false;
    const wealthyTier = ['ultra_wealthy', 'wealthy', 'ultra', 'high'].includes(rel.wealthTier);
    const highWorth = (rel.netWorth || rel.money || 0) >= 5000000;
    const highIncome = (rel.income || 0) >= 500000;
    return wealthyTier || highWorth || highIncome;
}

function getRelocationProgress(user) {
    if (!user) return 0;
    const countFromProp = user.relocationsCount || 0;
    // visitedCountries starts with birth/current country at index 0
    const countFromVisited = Array.isArray(user.visitedCountries)
        ? Math.max(0, user.visitedCountries.length - 1)
        : 0;
    return Math.max(countFromProp, countFromVisited);
}

function getMasteredSkillsCount(user) {
    if (!user || !user.skills || typeof user.skills !== 'object') return 0;
    return Object.values(user.skills).filter(st =>
        st && typeof st === 'object' && (
            st.certified ||
            (Number(st.xp) || 0) >= 100 ||
            (Array.isArray(st.tiersCompleted) && st.tiersCompleted.includes(3))
        )
    ).length;
}

function getChildrenCount(user) {
    if (!user || !Array.isArray(user.relationships)) return 0;
    return user.relationships.filter(r =>
        r && (r.category === 'child' || ['Son', 'Daughter', 'Child'].includes(r.type))
    ).length;
}

function getGenerationNumber(user) {
    if (!user) return 1;
    return user.generation || (state.gameState?.pastLives?.length ? state.gameState.pastLives.length + 1 : 1);
}

/**
 * Returns live progress metrics for cumulative achievements (used in Trophy Room UI).
 * @param {string} achievementId
 * @param {object} [user]
 * @returns {{ current: number, target: number, percent: number, label: string } | null}
 */
export function getSingleAchievementProgress(achievementId, user = state.gameState?.user) {
    if (!user) return null;

    const clampPct = (curr, target) => target > 0 ? Math.min(100, Math.max(0, Math.round((curr / target) * 100))) : 0;

    switch (achievementId) {
        case 'centenarian': {
            const current = Math.max(0, user.age || 0);
            return { current, target: 100, percent: clampPct(current, 100), label: `Age ${current} / 100` };
        }
        case 'unicorn_tycoon': {
            const val = getBusinessValuationSafe(user);
            const target = 1000000000;
            return {
                current: val,
                target,
                percent: user.isPublic ? 100 : clampPct(val, target),
                label: user.hasBusiness ? `${Utils.formatMoney(val)} / $1B Valuation` : 'Start a Business to track'
            };
        }
        case 'real_estate_baron': {
            const current = getRentalCount(user);
            return { current, target: 5, percent: clampPct(current, 5), label: `${current} / 5 Rented Properties` };
        }
        case 'diamond_hands': {
            const total = getInvestmentTotal(user);
            const target = 10000000;
            return { current: total, target, percent: clampPct(total, target), label: `${Utils.formatMoney(total)} / $10M Portfolio` };
        }
        case 'polymath_scholar': {
            const smarts = user.smarts ?? user.stats?.smarts ?? 50;
            const steps = (hasUniversityDegree(user) ? 1 : 0) + (hasGraduateDegree(user) ? 1 : 0) + (smarts >= 95 ? 1 : 0);
            return { current: steps, target: 3, percent: clampPct(steps, 3), label: `${steps} / 3 Milestones (Uni, Grad, 95+ Smarts)` };
        }
        case 'dynasty_founder': {
            const gen = getGenerationNumber(user);
            return { current: gen, target: 3, percent: clampPct(gen, 3), label: `Generation ${gen} / 3` };
        }
        case 'globe_trotter': {
            const moves = getRelocationProgress(user);
            return { current: moves, target: 3, percent: clampPct(moves, 3), label: `${moves} / 3 Relocations` };
        }
        case 'junk_food_immortal': {
            const onJunk = (user.diet || 'junk') === 'junk' && !user.hasBetterDiet && !user.everChangedFromJunkDiet;
            const streak = user.junkFoodStreak || 0;
            const current = onJunk ? Math.min(42, streak) : 0;
            return {
                current,
                target: 42,
                percent: clampPct(current, 42),
                label: onJunk ? `${current} / 42 Adult Years on Junk Food` : 'Diet Plan Changed (Restart Lineage)'
            };
        }
        case 'the_godfather': {
            const isMafia = user.careerTrack === 'mafia_syndicate';
            const rank = isMafia ? Math.min(5, (user.careerLevel || 0) + 1) : 0;
            return { current: rank, target: 5, percent: clampPct(rank, 5), label: isMafia ? `Syndicate Rank ${rank} / 5` : 'Join La Cosa Nostra' };
        }
        case 'hall_of_fame_goat': {
            const rings = user.athleteRings || 0;
            const isMax = user.careerTrack === 'pro_athlete' && (user.careerLevel || 0) >= 4;
            const current = isMax ? 3 : rings;
            return { current, target: 3, percent: clampPct(current, 3), label: `Rings: ${rings} / 3` };
        }
        case 'top_of_the_ladder': {
            const validCareer = Boolean(user.careerTrack && user.careerTrack !== 'mafia_syndicate' && user.careerTrack !== 'pro_athlete');
            const rank = validCareer ? Math.min(5, (user.careerLevel || 0) + 1) : 0;
            return { current: rank, target: 5, percent: clampPct(rank, 5), label: validCareer ? `Career Rank ${rank} / 5` : 'Climb a Career Track to Rank 5' };
        }
        case 'renaissance_master': {
            const count = getMasteredSkillsCount(user);
            return { current: count, target: 3, percent: clampPct(count, 3), label: `${count} / 3 Skills Mastered` };
        }
        case 'full_house': {
            const children = getChildrenCount(user);
            return { current: children, target: 5, percent: clampPct(children, 5), label: `${children} / 5 Children` };
        }
        case 'yard_kingpin': {
            const respect = user.inPrison ? (user.prisonStats?.respect ?? user.prisonRespect ?? 0) : 0;
            return {
                current: respect,
                target: 90,
                percent: clampPct(respect, 90),
                label: user.inPrison ? `Respect: ${respect} / 90` : 'Incarcerated Yard Respect Needed'
            };
        }
        default:
            return null;
    }
}

/**
 * Batch checks periodic conditions during age up or state changes.
 * @param {object} user
 */
export function checkPeriodicAchievements(user) {
    if (!user) return;

    const isLiving = !user.isDead && user.lifeStatus !== 'Deceased';

    // 1. The Centenarian (Age >= 100)
    if (user.age >= 100) {
        unlockAchievement('centenarian', user);
    }

    // 2. Living on the Edge (Health <= 5 and Happiness <= 5 while surviving ageUp)
    const health = user.health ?? user.stats?.health ?? 100;
    const happiness = user.happiness ?? user.stats?.happiness ?? 100;
    if (health <= 5 && happiness <= 5 && health > 0 && isLiving) {
        unlockAchievement('living_on_the_edge', user);
    }

    // 3. Near-Death Experience (Survive an event or age with <= 5% HP)
    if (health <= 5 && health > 0 && isLiving) {
        unlockAchievement('near_death_experience', user);
    }

    // 4. Real Estate Baron (>= 5 active properties with tenants)
    if (getRentalCount(user) >= 5) {
        unlockAchievement('real_estate_baron', user);
    }

    // 5. Diamond Hands (>= $10,000,000 in investments or crypto/stocks/savings)
    const totalInvestments = getInvestmentTotal(user);
    if (totalInvestments >= 10000000 || (user.money >= 10000000 && user.hasInvested)) {
        unlockAchievement('diamond_hands', user);
    }

    // 6. Unicorn Tycoon ($1B+ company valuation or public IPO)
    if (user.isPublic || getBusinessValuationSafe(user) >= 1000000000) {
        unlockAchievement('unicorn_tycoon', user);
    }

    // 7. Junk Food Immortal (Age >= 60 continuously on Junk Food diet without changing)
    const isJunkDiet = (user.diet || 'junk') === 'junk' && !user.hasBetterDiet && !user.everChangedFromJunkDiet;
    if (user.age >= 60 && isJunkDiet && (user.junkFoodStreak || 0) >= 42) {
        unlockAchievement('junk_food_immortal', user);
    }

    // 8. Polymath Scholar (University + Grad School + Smarts >= 95)
    const smarts = user.smarts ?? user.stats?.smarts ?? 50;
    if (hasUniversityDegree(user) && hasGraduateDegree(user) && smarts >= 95) {
        unlockAchievement('polymath_scholar', user);
    }

    // 9. House of Dynasties (Generation >= 3)
    if (getGenerationNumber(user) >= 3) {
        unlockAchievement('dynasty_founder', user);
    }

    // 10. Globe Trotter (Relocated >= 3 countries)
    if (getRelocationProgress(user) >= 3) {
        unlockAchievement('globe_trotter', user);
    }

    // 11. The Godfather (Rank: The Don / Level >= 4 on mafia track)
    if (user.careerTrack === 'mafia_syndicate' && (user.careerLevel >= 4 || user.jobTitle === 'The Don')) {
        unlockAchievement('the_godfather', user);
    }

    // 12. Gold Digger's Paradise (Married to wealthy spouse >= $5M net worth)
    if (Array.isArray(user.relationships) && user.relationships.some(isWealthySpouse)) {
        unlockAchievement('gold_digger', user);
    }

    // 13. Undisputed GOAT (3+ Championship Rings or Hall of Fame Pro Athlete)
    if ((user.athleteRings || 0) >= 3 || (user.careerTrack === 'pro_athlete' && (user.careerLevel || 0) >= 4)) {
        unlockAchievement('hall_of_fame_goat', user);
    }

    // 14. Top of the Ladder (Level 5 / index 4 in any standard career track)
    if (user.careerTrack && user.careerTrack !== 'mafia_syndicate' && user.careerTrack !== 'pro_athlete' && (user.careerLevel || 0) >= 4) {
        unlockAchievement('top_of_the_ladder', user);
    }

    // 15. Renaissance Virtuoso (3+ mastered skills/instruments at >= 100 XP or Tier-3 certified)
    if (getMasteredSkillsCount(user) >= 3) {
        unlockAchievement('renaissance_master', user);
    }

    // 16. Full House (5+ children in relationships)
    if (getChildrenCount(user) >= 5) {
        unlockAchievement('full_house', user);
    }

    // 17. Yard Kingpin (90+ Prison Respect while incarcerated)
    if (user.inPrison && (user.prisonStats?.respect ?? user.prisonRespect ?? 0) >= 90) {
        unlockAchievement('yard_kingpin', user);
    }
}

/**
 * Resets local achievement records (useful for testing or full hard resets).
 */
export function resetAchievements() {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (e) {}
        try {
            const rawSlots = localStorage.getItem(SLOTS_STORAGE_KEY);
            if (rawSlots) {
                const store = JSON.parse(rawSlots);
                const slotId = state.gameState?._slotId || store?.activeSlotId;
                if (store?.slots && slotId && store.slots[slotId]?.data) {
                    store.slots[slotId].data.achievements = {};
                    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(store));
                }
            }
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
    getSingleAchievementProgress,
    isAchievementUnlocked,
    unlockAchievement,
    checkPeriodicAchievements,
    resetAchievements
};
