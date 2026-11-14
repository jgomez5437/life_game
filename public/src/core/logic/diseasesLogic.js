import { Utils } from '../../ui/utils.js';
import { adjustStat, isAlive } from './playerStatsLogic.js';

export function calculateMedicalVisit() {
    return { boost: 10, cost: 1000 };
}

export const DISEASES_CATALOG = [
    // 1. Transient / Self-Resolving Sicknesses (go away on their own or faster with a doctor)
    {
        id: 'common_cold',
        name: 'Common Cold',
        category: 'sickness',
        curable: true,
        selfResolving: true,
        minDuration: 1,
        maxDuration: 1,
        minAge: 1,
        maxAge: 120,
        weight: 30,
        cureChance: 0.90,
        healthPenalty: 3,
        happinessPenalty: 3,
        looksPenalty: 0,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 1,
        treatedLooksPenalty: 0,
        initialHealthHit: 3,
        initialHappinessHit: 3,
        initialLooksHit: 0,
        fatalWeight: 0,
        note: 'Mild viral infection. Usually clears up on its own.'
    },
    {
        id: 'seasonal_flu',
        name: 'Seasonal Flu',
        category: 'sickness',
        curable: true,
        selfResolving: true,
        minDuration: 1,
        maxDuration: 2,
        minAge: 2,
        maxAge: 120,
        weight: 22,
        cureChance: 0.80,
        healthPenalty: 6,
        happinessPenalty: 5,
        looksPenalty: 0,
        treatedHealthPenalty: 2,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 6,
        initialHappinessHit: 5,
        initialLooksHit: 0,
        fatalWeight: 1,
        note: 'Short-term illness that typically passes in 1–2 years.'
    },
    {
        id: 'stomach_bug',
        name: 'Stomach Bug',
        category: 'sickness',
        curable: true,
        selfResolving: true,
        minDuration: 1,
        maxDuration: 1,
        minAge: 2,
        maxAge: 120,
        weight: 20,
        cureChance: 0.85,
        healthPenalty: 5,
        happinessPenalty: 6,
        looksPenalty: 0,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 5,
        initialHappinessHit: 5,
        initialLooksHit: 0,
        fatalWeight: 0,
        note: 'Temporary illness that settles after a short recovery.'
    },
    {
        id: 'bronchitis',
        name: 'Bronchitis',
        category: 'sickness',
        curable: true,
        selfResolving: true,
        minDuration: 1,
        maxDuration: 2,
        minAge: 5,
        maxAge: 120,
        weight: 14,
        cureChance: 0.75,
        healthPenalty: 8,
        happinessPenalty: 6,
        looksPenalty: 0,
        treatedHealthPenalty: 3,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 6,
        initialHappinessHit: 4,
        initialLooksHit: 0,
        fatalWeight: 1,
        note: 'Respiratory infection that improves with rest or care.'
    },

    // 2. Persistent Curable Illnesses (do not go away on their own; require doctor visit)
    {
        id: 'pneumonia',
        name: 'Pneumonia',
        category: 'sickness',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 5,
        maxAge: 120,
        weight: 8,
        cureChance: 0.65,
        healthPenalty: 12,
        happinessPenalty: 8,
        looksPenalty: 0,
        treatedHealthPenalty: 4,
        treatedHappinessPenalty: 3,
        treatedLooksPenalty: 0,
        initialHealthHit: 10,
        initialHappinessHit: 6,
        initialLooksHit: 0,
        fatalWeight: 2,
        note: 'Persistent lung infection requiring medical treatment.'
    },
    {
        id: 'ulcers',
        name: 'Stomach Ulcers',
        category: 'sickness',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 18,
        maxAge: 120,
        weight: 8,
        cureChance: 0.70,
        healthPenalty: 6,
        happinessPenalty: 7,
        looksPenalty: 0,
        treatedHealthPenalty: 2,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 5,
        initialHappinessHit: 5,
        initialLooksHit: 0,
        fatalWeight: 1,
        note: 'Ongoing condition that needs medical care to heal.'
    },
    {
        id: 'lyme_disease',
        name: 'Lyme Disease',
        category: 'sickness',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 8,
        maxAge: 120,
        weight: 6,
        cureChance: 0.60,
        healthPenalty: 8,
        happinessPenalty: 6,
        looksPenalty: 0,
        treatedHealthPenalty: 3,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 6,
        initialHappinessHit: 4,
        initialLooksHit: 0,
        fatalWeight: 1,
        note: 'Persistent infection treated with prescription medication.'
    },

    // 3. Chronic / Lifelong Conditions (do not go away; doctor visits manage symptoms)
    {
        id: 'migraines',
        name: 'Chronic Migraines',
        category: 'chronic',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 14,
        maxAge: 120,
        weight: 7,
        cureChance: 0,
        healthPenalty: 3,
        happinessPenalty: 8,
        looksPenalty: 0,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 3,
        initialHappinessHit: 6,
        initialLooksHit: 0,
        fatalWeight: 0,
        note: 'Long-term condition managed with regular doctor visits.'
    },
    {
        id: 'high_bp',
        name: 'High Blood Pressure',
        category: 'chronic',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 30,
        maxAge: 120,
        weight: 8,
        cureChance: 0,
        healthPenalty: 6,
        happinessPenalty: 2,
        looksPenalty: 0,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 0,
        treatedLooksPenalty: 0,
        initialHealthHit: 4,
        initialHappinessHit: 2,
        initialLooksHit: 0,
        fatalWeight: 2,
        note: 'Chronic condition kept under control through medical care.'
    },
    {
        id: 'arthritis',
        name: 'Arthritis',
        category: 'chronic',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 45,
        maxAge: 120,
        weight: 8,
        cureChance: 0,
        healthPenalty: 4,
        happinessPenalty: 6,
        looksPenalty: 0,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 3,
        initialHappinessHit: 4,
        initialLooksHit: 0,
        fatalWeight: 0,
        note: 'Chronic joint condition eased by ongoing treatment.'
    },
    {
        id: 'heart_disease',
        name: 'Heart Disease',
        category: 'chronic',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 45,
        maxAge: 120,
        weight: 5,
        cureChance: 0,
        healthPenalty: 12,
        happinessPenalty: 6,
        looksPenalty: 0,
        treatedHealthPenalty: 4,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 8,
        initialHappinessHit: 5,
        initialLooksHit: 0,
        fatalWeight: 3,
        note: 'Serious lifelong condition requiring annual management.'
    },

    // 4. STDs (contracted from hookups)
    {
        id: 'chlamydia',
        name: 'Chlamydia',
        category: 'std',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 16,
        maxAge: 120,
        weight: 30,
        cureChance: 0.75,
        healthPenalty: 5,
        happinessPenalty: 6,
        looksPenalty: 2,
        treatedHealthPenalty: 2,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 4,
        initialHappinessHit: 8,
        initialLooksHit: 2,
        fatalWeight: 0,
        note: 'Common STD. Curable with medical treatment.'
    },
    {
        id: 'gonorrhea',
        name: 'Gonorrhea',
        category: 'std',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 16,
        maxAge: 120,
        weight: 26,
        cureChance: 0.70,
        healthPenalty: 6,
        happinessPenalty: 7,
        looksPenalty: 3,
        treatedHealthPenalty: 2,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 1,
        initialHealthHit: 5,
        initialHappinessHit: 8,
        initialLooksHit: 2,
        fatalWeight: 0,
        note: 'Treatable STD that needs a doctor visit to clear.'
    },
    {
        id: 'syphilis',
        name: 'Syphilis',
        category: 'std',
        curable: true,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 16,
        maxAge: 120,
        weight: 18,
        cureChance: 0.60,
        healthPenalty: 10,
        happinessPenalty: 8,
        looksPenalty: 4,
        treatedHealthPenalty: 3,
        treatedHappinessPenalty: 3,
        treatedLooksPenalty: 1,
        initialHealthHit: 6,
        initialHappinessHit: 10,
        initialLooksHit: 3,
        fatalWeight: 2,
        note: 'Serious STD that can be cured with medical treatment.'
    },
    {
        id: 'herpes',
        name: 'Genital Herpes',
        category: 'std',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 16,
        maxAge: 120,
        weight: 16,
        cureChance: 0,
        healthPenalty: 3,
        happinessPenalty: 8,
        looksPenalty: 4,
        treatedHealthPenalty: 1,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 3,
        initialHappinessHit: 12,
        initialLooksHit: 3,
        fatalWeight: 0,
        note: 'Lifelong condition managed with doctor visits.'
    },
    {
        id: 'hiv',
        name: 'HIV',
        category: 'std',
        curable: false,
        selfResolving: false,
        minDuration: null,
        maxDuration: null,
        minAge: 16,
        maxAge: 120,
        weight: 10,
        cureChance: 0,
        healthPenalty: 14,
        happinessPenalty: 10,
        looksPenalty: 3,
        treatedHealthPenalty: 2,
        treatedHappinessPenalty: 2,
        treatedLooksPenalty: 0,
        initialHealthHit: 8,
        initialHappinessHit: 15,
        initialLooksHit: 2,
        fatalWeight: 3,
        note: 'Lifelong condition kept stable with ongoing medical care.'
    }
];

export function getDiseaseDefinition(diseaseId) {
    if (!diseaseId || typeof diseaseId !== 'string') return null;
    return DISEASES_CATALOG.find(d => d.id === diseaseId) || null;
}

export function ensureUserDiseases(user) {
    if (!user || typeof user !== 'object') return [];
    if (!Array.isArray(user.diseases)) {
        user.diseases = [];
    }
    return user.diseases;
}

export function syncDiseaseFlags(user) {
    if (!user || typeof user !== 'object') return;
    const list = ensureUserDiseases(user);
    user.isSick = list.length > 0;
    user.hasFlu = list.some(d => d.id === 'seasonal_flu');
}

export function infectUser(user, diseaseId, durationRoll = Math.random()) {
    if (!user || typeof user !== 'object') return { infected: false, reason: 'invalid_user' };
    const def = getDiseaseDefinition(diseaseId);
    if (!def) return { infected: false, reason: 'unknown_disease' };

    const list = ensureUserDiseases(user);
    if (list.some(d => d.id === def.id)) {
        return { infected: false, reason: 'already_infected' };
    }

    let yearsRemaining = null;
    if (def.selfResolving) {
        const span = Math.max(1, (def.maxDuration || 1) - (def.minDuration || 1) + 1);
        const safeRoll = Math.max(0, Math.min(0.9999, Number(durationRoll) || 0));
        yearsRemaining = (def.minDuration || 1) + Math.floor(safeRoll * span);
    }

    const instance = {
        id: def.id,
        name: def.name,
        category: def.category,
        curable: !!def.curable,
        selfResolving: !!def.selfResolving,
        yearsRemaining,
        cureChance: def.cureChance || 0,
        healthPenalty: def.healthPenalty || 0,
        happinessPenalty: def.happinessPenalty || 0,
        looksPenalty: def.looksPenalty || 0,
        treatedThisYear: false,
        contractedAge: user.age || 0
    };

    list.push(instance);

    if (def.initialHealthHit) adjustStat(user, 'health', -def.initialHealthHit);
    if (def.initialHappinessHit) adjustStat(user, 'happiness', -def.initialHappinessHit);
    if (def.initialLooksHit) adjustStat(user, 'looks', -def.initialLooksHit);

    syncDiseaseFlags(user);
    return { infected: true, disease: instance, definition: def };
}

export function pickWeightedDisease(candidates, roll = Math.random()) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    const totalWeight = candidates.reduce((sum, c) => sum + (c.weight || 1), 0);
    let target = Math.max(0, Math.min(0.9999, Number(roll) || 0)) * totalWeight;
    for (const candidate of candidates) {
        const w = candidate.weight || 1;
        if (target < w) return candidate;
        target -= w;
    }
    return candidates[candidates.length - 1];
}

/**
 * Processes active diseases for a new year and optionally rolls for a new random illness.
 * @param {Object} user
 * @param {Object} [rolls] - Optional deterministic rolls for unit testing
 * @returns {{ events: Array<{msg: string, type: string}>, contracted: Object|null, recovered: Array<string> }}
 */
export function processAnnualDiseases(user, rolls = {}) {
    if (!user || typeof user !== 'object') {
        return { events: [], contracted: null, recovered: [] };
    }

    const diseases = ensureUserDiseases(user);
    const events = [];
    const recovered = [];

    // 1. Process existing conditions from previous year
    for (let i = diseases.length - 1; i >= 0; i--) {
        const d = diseases[i];
        const def = getDiseaseDefinition(d.id);

        const hPen = d.treatedThisYear
            ? (def?.treatedHealthPenalty ?? Math.floor((d.healthPenalty || 0) / 3))
            : (d.healthPenalty || 0);
        const hapPen = d.treatedThisYear
            ? (def?.treatedHappinessPenalty ?? Math.floor((d.happinessPenalty || 0) / 3))
            : (d.happinessPenalty || 0);
        const lPen = d.treatedThisYear
            ? (def?.treatedLooksPenalty ?? 0)
            : (d.looksPenalty || 0);

        if (hPen > 0) adjustStat(user, 'health', -hPen);
        if (hapPen > 0) adjustStat(user, 'happiness', -hapPen);
        if (lPen > 0) adjustStat(user, 'looks', -lPen);

        if (d.selfResolving && typeof d.yearsRemaining === 'number') {
            d.yearsRemaining -= 1;
            if (d.yearsRemaining <= 0) {
                diseases.splice(i, 1);
                recovered.push(d.name);
                events.push({ msg: `You recovered from ${d.name}.`, type: 'good' });
                continue;
            } else if (!d.treatedThisYear && (hPen > 0 || hapPen > 0)) {
                events.push({
                    msg: `You are still dealing with ${d.name} (-${hPen} Health).`,
                    type: 'bad'
                });
            }
        } else if (!d.treatedThisYear && (hPen > 0 || hapPen > 0 || lPen > 0)) {
            const statNote = hPen > 0 ? `-${hPen} Health` : (lPen > 0 ? `-${lPen} Looks` : `-${hapPen} Happiness`);
            events.push({
                msg: `${d.name} is affecting your health (${statNote}). Consider visiting a doctor.`,
                type: 'bad'
            });
        }

        // Reset yearly treatment flag for the new year
        d.treatedThisYear = false;
    }

    // 2. Roll for contracting a random sickness or chronic condition (non-STD)
    let contracted = null;
    const age = user.age || 0;
    if (age >= 1 && diseases.length < 3) {
        let chance = 0.12;
        const currentHealth = user.health ?? user.stats?.health ?? 100;
        if (currentHealth < 40) chance += 0.05;
        if (age >= 60) chance += 0.04;
        if (user.gymMembership) chance -= 0.02;
        if (user.hasBetterDiet || (user.diet && user.diet !== 'junk')) chance -= 0.02;
        chance = Math.max(0.06, Math.min(0.25, chance));

        const contractionRoll = rolls.contractionRoll !== undefined ? rolls.contractionRoll : Math.random();
        if (contractionRoll < chance) {
            const activeIds = new Set(diseases.map(d => d.id));
            const candidates = DISEASES_CATALOG.filter(def =>
                (def.category === 'sickness' || def.category === 'chronic') &&
                age >= (def.minAge || 0) &&
                age <= (def.maxAge || 120) &&
                !activeIds.has(def.id)
            );
            const pickRoll = rolls.pickRoll !== undefined ? rolls.pickRoll : Math.random();
            const chosen = pickWeightedDisease(candidates, pickRoll);
            if (chosen) {
                const durationRoll = rolls.durationRoll !== undefined ? rolls.durationRoll : Math.random();
                const res = infectUser(user, chosen.id, durationRoll);
                if (res.infected) {
                    contracted = res.disease;
                    const verb = chosen.category === 'chronic' ? 'were diagnosed with' : 'came down with';
                    events.push({
                        msg: `You ${verb} ${chosen.name}. (-${chosen.initialHealthHit} Health, -${chosen.initialHappinessHit} Happiness)`,
                        type: 'bad'
                    });
                }
            }
        }
    }

    syncDiseaseFlags(user);
    return { events, contracted, recovered };
}

/**
 * Evaluates STD contraction risk from a hookup encounter.
 * @param {Object} user
 * @param {boolean} isProtection
 * @param {Object} [rolls] - Optional deterministic rolls for unit testing
 * @returns {{ contracted: boolean, disease?: Object, definition?: Object }}
 */
export function rollHookupSTD(user, isProtection, rolls = {}) {
    if (!user || typeof user !== 'object') return { contracted: false };

    const chance = isProtection ? 0.025 : 0.20;
    const triggerRoll = rolls.triggerRoll !== undefined ? rolls.triggerRoll : Math.random();
    if (triggerRoll >= chance) {
        return { contracted: false };
    }

    const activeIds = new Set(ensureUserDiseases(user).map(d => d.id));
    const candidates = DISEASES_CATALOG.filter(def => def.category === 'std' && !activeIds.has(def.id));
    if (candidates.length === 0) {
        return { contracted: false };
    }

    const pickRoll = rolls.pickRoll !== undefined ? rolls.pickRoll : Math.random();
    const chosen = pickWeightedDisease(candidates, pickRoll);
    if (!chosen) return { contracted: false };

    const res = infectUser(user, chosen.id);
    if (!res.infected) return { contracted: false };

    return {
        contracted: true,
        disease: res.disease,
        definition: res.definition
    };
}

/**
 * Attempts to treat or manage an active disease at the doctor's clinic.
 * @param {Object} user
 * @param {string} diseaseId
 * @param {number} [roll=Math.random()]
 * @returns {{ success: boolean, cured?: boolean, managed?: boolean, cost?: number, message: string, insufficientFunds?: boolean, alreadyTreated?: boolean, disease?: Object }}
 */
export function treatDiseaseAtDoctor(user, diseaseId, roll = Math.random()) {
    if (!isAlive(user)) {
        return { success: false, message: 'Cannot visit the doctor while deceased.' };
    }

    const diseases = ensureUserDiseases(user);
    const idx = diseases.findIndex(d => d.id === diseaseId);
    if (idx === -1) {
        return { success: false, message: 'Condition not found.' };
    }

    const disease = diseases[idx];
    if (disease.treatedThisYear) {
        return {
            success: false,
            alreadyTreated: true,
            message: `You already saw a doctor for ${disease.name} this year.`
        };
    }

    const cost = (user.age || 0) < 18 ? 0 : calculateMedicalVisit().cost;
    if ((user.money || 0) < cost) {
        return {
            success: false,
            insufficientFunds: true,
            cost,
            message: `Insufficient funds. You need ${Utils.formatMoney(cost)} for this doctor visit.`
        };
    }

    if (cost > 0) {
        user.money -= cost;
    }

    if (disease.curable) {
        const cureChance = typeof disease.cureChance === 'number' ? disease.cureChance : 0.7;
        if (roll < cureChance) {
            diseases.splice(idx, 1);
            adjustStat(user, 'health', 6);
            adjustStat(user, 'happiness', 5);
            syncDiseaseFlags(user);
            return {
                success: true,
                cured: true,
                cost,
                disease,
                message: `Treatment worked! Your ${disease.name} is cured. (+6 Health, +5 Happiness)`
            };
        }

        disease.treatedThisYear = true;
        adjustStat(user, 'health', 2);
        syncDiseaseFlags(user);
        return {
            success: true,
            cured: false,
            cost,
            disease,
            message: `The treatment didn't cure your ${disease.name} this time, though your symptoms eased for now. (+2 Health)`
        };
    }

    // Chronic / lifelong condition: symptom management
    disease.treatedThisYear = true;
    adjustStat(user, 'health', 4);
    adjustStat(user, 'happiness', 2);
    syncDiseaseFlags(user);
    return {
        success: true,
        cured: false,
        managed: true,
        cost,
        disease,
        message: `The doctor prescribed ongoing care to manage your ${disease.name} for the year. (+4 Health, +2 Happiness)`
    };
}
