import { getDiseaseDefinition } from './diseasesLogic.js';
export { calculateMedicalVisit } from './diseasesLogic.js';

export const MORTALITY_RATES = [
    { maxAge: 0, rate: 0.005, causes: ["complications at birth.", "SIDS."] },
    { maxAge: 15, rate: 0.0001, causes: ["a tragic childhood accident.", "a rare illness."] },
    { maxAge: 25, rate: 0.001, causes: ["a fatal car crash.", "a reckless accident."] },
    { maxAge: 50, rate: 0.002, causes: ["an unforeseen medical emergency.", "a workplace accident."] },
    { maxAge: 70, rate: 0.01, causes: ["a sudden heart attack.", "cancer."] },
    { maxAge: 90, rate: 0.05, causes: ["a stroke.", "natural causes."] },
    { maxAge: 110, rate: 0.15, causes: ["old age.", "organ failure."] },
    { maxAge: Infinity, rate: 1.0, causes: ["extreme old age."] }
];
export function checkMortality(age, health = 100, diseases = []) {
    const bracket = MORTALITY_RATES.find(b => age <= b.maxAge);
    let chance = bracket.rate;

    // Health Modifier: Scales risk up to 300% if health is critically low (< 30)
    if (health < 30) {
        const penaltyMultiplier = 1 + ((30 - Math.max(0, health)) / 10);
        chance *= penaltyMultiplier;
    }

    const activeDiseases = Array.isArray(diseases) ? diseases : [];
    let severeDisease = null;
    if (activeDiseases.length > 0) {
        let highestWeight = 0;
        for (const d of activeDiseases) {
            const def = getDiseaseDefinition(d?.id) || d;
            const weight = def?.fatalWeight || 0;
            if (!d.treatedThisYear && weight > 0) {
                chance += weight * 0.008;
            }
            if (weight > highestWeight) {
                highestWeight = weight;
                severeDisease = d;
            }
        }
    }

    if (Math.random() < chance) {
        if (severeDisease && health < 50 && Math.random() < 0.7) {
            return { isDead: true, cause: `complications from ${severeDisease.name}.` };
        }
        const cause = bracket.causes[Math.floor(Math.random() * bracket.causes.length)];
        return { isDead: true, cause };
    }
    
    return { isDead: false };
}



/**
 * Calculates base biological health decay per year.
 * @param {number} age - Current player age.
 * @param {number} [roll=Math.random()] - Injected randomness for pure unit testing (0.0 to 0.999).
 * @returns {number} Health points to deduct.
 */
export function calculateHealthDecay(age, roll = Math.random()) {
    if (age <= 18) {
        return roll < 0.10 ? 1 : 0;
    } else if (age <= 30) {
        return roll < 0.30 ? 1 : 0;
    } else if (age <= 50) {
        // 20% chance for 2 decay, 80% chance for 1 decay
        return roll < 0.20 ? 2 : 1;
    } else if (age <= 70) {
        // Uniform distribution: 1, 2, or 3
        return Math.floor(roll * 3) + 1; 
    } else {
        // Extreme Old Age: 2, 3, or 4
        return Math.floor(roll * 3) + 2; 
    }
}


/**
 * Calculates active health improvements from gym and diet.
 * @param {boolean} hasGym - Whether user has active gym membership.
 * @param {boolean} hasDiet - Whether user has better diet.
 * @returns {number} Health points to offset decay.
 */
export const DIET_PLANS = {
    junk: {
        id: 'junk',
        name: 'Fast Food & Junk Food',
        monthlyCost: 0,
        annualCost: 0,
        healthDecayMod: 1.25,
        happinessBonus: 0,
        desc: 'Processed food, takeout, and soda. Cheap, but catches up to your health.'
    },
    balanced: {
        id: 'balanced',
        name: 'Balanced Home-Cooked Diet',
        monthlyCost: 150,
        annualCost: 1800,
        healthDecayMod: 0.90,
        happinessBonus: 1,
        desc: 'Well-rounded meals with fresh veggies, lean meats, and whole grains.'
    },
    organic: {
        id: 'organic',
        name: 'Mediterranean & Organic Diet',
        monthlyCost: 450,
        annualCost: 5400,
        healthDecayMod: 0.75,
        happinessBonus: 2,
        desc: 'Rich in olive oil, fresh seafood, nuts, and organic produce.'
    },
    keto: {
        id: 'keto',
        name: 'Keto & Fitness Diet',
        monthlyCost: 650,
        annualCost: 7800,
        healthDecayMod: 0.80,
        gymBonus: 1.20,
        happinessBonus: 2,
        desc: 'Low-carb, high-protein meal prep designed to maximize physical fitness.'
    },
    gourmet: {
        id: 'gourmet',
        name: 'Personal Chef Gourmet Diet',
        monthlyCost: 2500,
        annualCost: 30000,
        healthDecayMod: 0.50,
        happinessBonus: 4,
        desc: 'Custom farm-to-table meals prepared daily by your private chef.'
    }
};

export function getDietPlan(dietId) {
    return DIET_PLANS[dietId] || DIET_PLANS.junk;
}

export function calculateHealthBenefits(hasGym, hasDiet) {
    let benefit = 0;
    if (hasGym) benefit += 1;
    if (hasDiet) benefit += 1;
    return benefit;
}

export function calculateActiveHealthCosts(hasGymArg, dietArg) {
    let cost = 0;
    let hasGym = false;
    let dietKey = 'junk';

    if (typeof hasGymArg === 'object' && hasGymArg !== null) {
        const u = hasGymArg;
        hasGym = Boolean(u.gymMembership);
        dietKey = u.diet || (u.hasBetterDiet ? 'balanced' : 'junk');
    } else {
        hasGym = Boolean(hasGymArg);
        if (typeof dietArg === 'string') {
            dietKey = dietArg;
        } else if (dietArg === true) {
            cost += 2400; // Legacy test support: hasDiet = true -> $200/mo * 12
            if (hasGym) cost += 600;
            return cost;
        }
    }

    if (hasGym) cost += 600;

    const diet = getDietPlan(dietKey);
    cost += (diet.monthlyCost * 12);

    return cost;
}

/**
 * Calculates monthly outflow for children under age 21.
 * Each child under 21 adds $500 per month. Once a child reaches 21, the amount is removed.
 * @param {Array} relationships - Array of user relationships.
 * @returns {number} Monthly outflow in dollars.
 */
export function calculateChildMonthlyOutflow(relationships) {
    if (!relationships || !Array.isArray(relationships)) return 0;
    const childrenUnder21 = relationships.filter(r => 
        (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') && typeof r.age === 'number' && r.age < 21
    );
    return childrenUnder21.length * 500;
}

/**
 * Returns the immediate health boost and cost for a medical checkup.
 * @returns {object} { boost, cost }
 */

/**
 * Returns the immediate health boost and cost for a one-time gym visit.
 * @returns {object} { boost, cost }
 */
export function calculateOneTimeGymVisit() {
    return { boost: 1, cost: 20 };
}
