import { isAlive } from './playerStatsLogic.js';
export * from './npcGeneratorLogic.js';

/**
 * Calculates new relationship status after yearly decay.
 * @param {number} currentStatus
 * @param {boolean} interactedThisYear
 * @param {string} [category] - relationship category; 'family' is exempt while the player is a minor, 'classmate' is always exempt
 * @param {number} [userAge] - the player's current age
 * @returns {number} New status
 */
export function calculateRelationshipDecay(currentStatus, interactedThisYear, category, userAge) {
    if (interactedThisYear) return currentStatus;
    // Family bonds don't erode just from growing up — a minor's relationship with
    // parents/siblings only worsens from an actual negative interaction (e.g. Insult).
    if (category === 'family' && userAge !== undefined && userAge <= 18) return currentStatus;
    // Classmates only exist as a category while you're actually in school together —
    // seeing them daily means no passive decay, only direct negative interactions hurt it.
    if (category === 'classmate') return currentStatus;
    return Math.max(0, currentStatus - 5);
}

/**
 * Checks if a relationship should shift category based on status.
 * @param {string} category 
 * @param {number} status 
 * @returns {string|null} The new category if shifted, otherwise null
 */
export function checkRelationshipCategoryShift(category, status, type) {
    const familyTypes = ['Mother', 'Father', 'Brother', 'Sister', 'Son', 'Daughter', 'Child', 'Parent', 'Grandmother', 'Grandfather', 'Uncle', 'Aunt', 'Cousin', 'Niece', 'Nephew'];
    if (['family', 'spouse', 'child', 'classmate', 'partner', 'ex'].includes(category) || (type && familyTypes.includes(type))) {
        return null;
    }

    if (status < 30 && category !== 'enemy') return 'enemy';
    if (status >= 30 && category === 'enemy') return 'friend';
    return null;
}

/**
 * Single source of truth for every per-person relationship interaction:
 * name/icon/desc for rendering, cost/statusChange for effect, and the
 * conditions that decide whether it's shown at all (category/gender/type
 * filters) vs. shown-but-disabled (age/funds/status/hostility gates).
 */
export const RELATIONSHIP_INTERACTIONS = [
    { key: 'spend_time', name: 'Spend Time', icon: 'fa-clock', desc: 'Spend quality time together', cost: 0, statusChange: 15, blockedIfAgeLte: 1 },
    { key: 'give_money', name: 'Give Money', icon: 'fa-money-bill', desc: 'Give a monetary gift', cost: 500, statusChange: 10, blockedIfAgeLte: 10, allowedWhileHostile: true },
    { key: 'insult', name: 'Insult', icon: 'fa-angry', desc: 'Say something mean', cost: 0, statusChange: -20, blockedIfAgeLte: 2, allowedWhileHostile: true },
    { key: 'compliment', name: 'Compliment', icon: 'fa-heart', desc: 'Say something nice', cost: 0, statusChange: 15, blockedIfAgeLte: 2 },
    { key: 'call_chat', name: 'Call to Chat', icon: 'fa-phone', desc: 'Have a quick chat over the phone', cost: 0, statusChange: 10, blockedIfAgeLte: 5, blockedForTeacherUnlessFriend: true },
    { key: 'ask_friend', name: 'Ask to be Friends', icon: 'fa-user-plus', desc: 'See if they want to hang out outside of school', cost: 0, statusChange: 0, categories: ['classmate'] },

    // --- Romance (Chunk 1) ---
    { key: 'ask_out', name: 'Ask Out', icon: 'fa-heart', desc: 'Ask them to be your boyfriend/girlfriend', cost: 0, statusChange: 0, categories: ['friend'], requiresOppositeGender: true, monogamyGate: true, minStatusToUnlock: 40, blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'flirt', name: 'Flirt', icon: 'fa-kiss-wink-heart', desc: 'Say something flirty', cost: 0, statusChange: 10, categories: ['partner'], blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'go_on_date', name: 'Go on a Date', icon: 'fa-utensils', desc: 'Take them out for a night together', cost: 100, statusChange: 15, categories: ['partner'], blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'make_love', name: 'Make Love', icon: 'fa-heart-circle-check', desc: 'Spend an intimate night together', cost: 0, statusChange: 10, categories: ['partner', 'spouse'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17 },
    { key: 'make_a_move', name: 'Make a Move', icon: 'fa-fire-flame-curved', desc: 'Try to initiate something intimate', cost: 0, statusChange: 0, categories: ['friend', 'classmate'], directAction: 'handleMakeAMove', blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'end_affair', name: 'End the Affair', icon: 'fa-heart-crack', desc: 'Break off the secret affair', cost: 0, statusChange: -10, requiredTypes: ['Secret Affair'], directAction: 'handleEndAffair' },
    { key: 'break_up', name: 'Break Up', icon: 'fa-heart-crack', desc: 'End the relationship', cost: 0, statusChange: 0, categories: ['partner'] },

    // --- Marriage & Divorce (Chunk 2) ---
    { key: 'propose', name: 'Propose', icon: 'fa-gem', desc: 'Pop the question with a ring', cost: 3000, statusChange: 0, categories: ['partner'], requiredTypes: ['Boyfriend', 'Girlfriend'], minStatusToUnlock: 75, blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17 },
    { key: 'get_married', name: 'Plan Wedding', icon: 'fa-ring', desc: 'Take the next step and get married', cost: 0, statusChange: 0, categories: ['partner'], requiredTypes: ['Fiancé', 'Fiancée'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17, directAction: 'openWeddingPlanner' },
    { key: 'file_divorce', name: 'File for Divorce', icon: 'fa-file-signature', desc: 'End the marriage (legal fee + asset split)', cost: 5000, statusChange: 0, categories: ['spouse'] },

    // --- Pregnancy & Birth (Chunk 3) ---
    { key: 'try_for_baby', name: 'Try for a Baby', icon: 'fa-baby', desc: 'Try to start a family together', cost: 0, statusChange: 0, categories: ['spouse'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17, blockedIfUserExpecting: true },
];

/**
 * A relationship "refuses contact" (blocks most interactions) below a status
 * floor. Family/spouse/child get a lower floor (15) than everyone else (30).
 * @param {object} person
 * @returns {boolean}
 */
export function isHostile(person) {
    if (!person) return false;
    const isFamilyLike = ['family', 'spouse', 'child'].includes(person.category);
    return isFamilyLike ? (person.status || 0) < 15 : (person.status || 0) < 30;
}

/**
 * Returns the interactions applicable to this person/user pair at all
 * (category/type/gender/relationship-status filters). Does not evaluate
 * age/funds/hostility gates — see isInteractionBlocked for those.
 * @param {object} person
 * @param {object} user
 * @returns {Array}
 */
export function getAvailableInteractions(person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || (typeof person.deathCause === 'string' && person.deathCause.trim() !== '')) {
        return [];
    }
    const hasPartnerOrSpouse = (user?.relationships || []).some(r => r.category === 'partner' || r.category === 'spouse');
    return RELATIONSHIP_INTERACTIONS.filter(it => {
        if ((user.age <= 17 && person.age >= 18) || (user.age >= 18 && person.age <= 17)) {
            if (['make_a_move', 'make_love', 'ask_out', 'flirt', 'go_on_date', 'propose', 'get_married'].includes(it.key)) return false;
        }
        if (person.type === 'Ex-Lover' && (it.key === 'make_a_move' || it.key === 'make_love')) return false;
        if (it.key === 'make_love' && person.type === 'Secret Affair') return true;
        if (it.categories && !it.categories.includes(person.category)) return false;
        if (it.requiredTypes && !it.requiredTypes.includes(person.type)) return false;
        if (it.requiresOppositeGender && (!person.gender || !user.gender || person.gender === user.gender)) return false;
        if (it.monogamyGate && hasPartnerOrSpouse) return false;
        return true;
    });
}

export const HOOKUP_SCENARIOS = [
    "Things are getting steamy with {name}...",
    "One thing leads to another, and the chemistry between you and {name} becomes undeniable...",
    "You lean in close to {name}. After a moment of hesitation, they pull you in...",
    "Sparked by late night drinks, {name} looks at you with a seductive grin...",
    "Away from prying eyes, {name} whispers that they've been wanting this for a long time..."
];

export function getRandomHookupScenario(name) {
    const template = HOOKUP_SCENARIOS[Math.floor(Math.random() * HOOKUP_SCENARIOS.length)];
    return template.replace('{name}', name);
}

export function calculateMakeAMoveSuccess(person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || (typeof person.deathCause === 'string' && person.deathCause.trim() !== '')) {
        return false;
    }
    const status = person.status || 0;
    const chance = Math.min(0.90, Math.max(0.15, status / 100));
    return Math.random() < chance;
}

export function checkAgeUpInfidelityDiscovery(user) {
    if (!user || !user.relationships) return null;

    const partner = user.relationships.find(r => r.category === 'spouse' || r.category === 'partner');
    if (!partner) return null;

    const affairs = user.relationships.filter(r => r.type === 'Secret Affair');
    if (affairs.length === 0 && !user.hadUnfaithfulHookupThisYear) return null;

    const discovered = Math.random() < 0.25;
    if (discovered) {
        const affairTarget = affairs.length > 0 ? affairs[Math.floor(Math.random() * affairs.length)] : null;
        const affairName = affairTarget ? affairTarget.name : "someone else";

        user.hadUnfaithfulHookupThisYear = false;

        return {
            partnerId: partner.id,
            partnerName: partner.name,
            affairName: affairName
        };
    }

    return null;
}

/**
 * Evaluates whether a specific interaction is currently blocked for this
 * person/user pair, and why (for UI display). Mirrors the previously
 * duplicated age/affordability/hostility gate logic in relationshipScreen.js.
 * @param {string} interactionKey
 * @param {object} person
 * @param {object} user
 * @returns {{blocked: boolean, reason: string}}
 */
export function isInteractionBlocked(interactionKey, person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || (typeof person.deathCause === 'string' && person.deathCause.trim() !== '')) {
        return { blocked: true, reason: 'Deceased' };
    }
    const it = RELATIONSHIP_INTERACTIONS.find(i => i.key === interactionKey);
    if (!it) return { blocked: true, reason: 'Unknown Action' };

    let blocked = false;
    let reason = '';

    if (['make_a_move', 'make_love', 'ask_out', 'flirt', 'go_on_date', 'propose', 'get_married'].includes(interactionKey)) {
        if ((user.age <= 17 && person.age >= 18) || (user.age >= 18 && person.age <= 17)) {
            blocked = true;
            if (!reason) reason = 'Age Gap (Minor & Adult)';
        }
    }

    if (it.blockedIfAgeLte !== undefined && user.age <= it.blockedIfAgeLte) {
        blocked = true;
        reason = 'Too Young';
    }
    if (it.blockedIfTargetAgeLte !== undefined && person.age <= it.blockedIfTargetAgeLte) {
        blocked = true;
        if (!reason) reason = 'Too Young';
    }

    const canAfford = !it.cost || (user.money || 0) >= it.cost;
    if (!canAfford) {
        blocked = true;
        if (!reason) reason = 'Insufficient Funds';
    }

    if (it.minStatusToUnlock !== undefined && person.status < it.minStatusToUnlock) {
        blocked = true;
        if (!reason) reason = 'Not Close Enough Yet';
    }

    if (it.blockedIfUserExpecting && user.isExpecting) {
        blocked = true;
        if (!reason) reason = 'Already Expecting';
    }

    if (interactionKey === 'try_for_baby') {
        const femaleAge = user.gender === 'female' ? user.age : person.age;
        const maleAge = user.gender === 'male' ? user.age : person.age;
        if (femaleAge >= 45) {
            blocked = true;
            if (!reason) reason = 'Female Too Old';
        } else if (maleAge >= 65) {
            blocked = true;
            if (!reason) reason = 'Male Too Old';
        }
    }

    if (it.blockedForTeacherUnlessFriend && person.type === 'Teacher') {
        blocked = true;
        if (!reason) reason = 'Not Friends Yet';
    }

    if (isHostile(person) && !it.allowedWhileHostile) {
        blocked = true;
        reason = 'Refuses Contact';
    }

    return { blocked, reason };
}

/**
 * Calculates inheritance from a deceased parent based on age and a random roll.
 * @param {number} age - The age of the deceased parent.
 * @param {number} [roll=Math.random()] - Random roll between 0 and 0.999.
 * @returns {number} The inheritance amount in dollars.
 */
export function calculateInheritance(age, roll = Math.random()) {
    // 15% chance of dying in debt or having nothing, regardless of age
    if (roll < 0.15) {
        return 0;
    }
    
    // Scale potential savings by age
    let baseSavings = 0;
    if (age < 30) baseSavings = 5000;
    else if (age < 50) baseSavings = 25000;
    else if (age < 70) baseSavings = 100000;
    else baseSavings = 250000;
    
    // The roll determines how much of their "potential" savings they actually had
    // Normalizing the remaining roll from 0.15 to 1.0 down to a multiplier 0.1 to 1.5
    const multiplier = ((roll - 0.15) / 0.85) * 1.4 + 0.1; 
    
    let inheritance = Math.floor(baseSavings * multiplier);
    
    // Round to nearest 100, guaranteed non-negative
    return Math.max(0, Math.round(inheritance / 100) * 100);
}

/**
 * Rolls whether a deceased spouse carried a life insurance policy that pays out.
 * Unlike a parent's independent inheritance (which usually leaves something),
 * married couples already share one household pot, so a payout here is
 * intentionally uncommon — but meaningful when it lands.
 * @param {number} [roll=Math.random()] - payout-odds roll (0-1)
 * @param {number} [amountRoll=Math.random()] - payout-size roll (0-1), for pure unit testing
 * @returns {number} The payout amount in dollars, 0 if no policy pays out.
 */
export function calculateSpousalLifeInsurance(roll = Math.random(), amountRoll = Math.random()) {
    // Only ~30% of spouses turn out to have had a payable policy
    if (roll >= 0.3) {
        return 0;
    }

    const payout = 25000 + Math.floor(amountRoll * 175000); // $25,000 - $200,000

    // Round to nearest 100, guaranteed non-negative
    return Math.max(0, Math.round(payout / 100) * 100);
}

/**
 * Calculates net estate value and non-negative inheritance shares for surviving heirs.
 * If the deceased had net negative wealth (debt), debt is absorbed by the estate/creditors
 * and heirs receive $0 (debt is never inherited).
 * @param {object} user - The deceased character's state.
 * @returns {object} { totalEstate, distributableEstate, spouseShare, inheritancePerChild, children, spouse, isInsolvent }
 */
export function calculateEstateDistribution(user) {
    if (!user) {
        return {
            totalEstate: 0,
            distributableEstate: 0,
            spouseShare: 0,
            inheritancePerChild: 0,
            children: [],
            spouse: null,
            isInsolvent: false
        };
    }

    const relationships = Array.isArray(user.relationships) ? user.relationships : [];
    const children = relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const spouse = relationships.find(r => r.category === 'spouse');
    const hasChildren = children.length > 0;
    const hasSpouse = !!spouse;

    const assetValue = Array.isArray(user.assets)
        ? user.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0)
        : 0;
    const companyCash = (user.hasBusiness && Number(user.compCash) > 0) ? Number(user.compCash) : 0;
    const rawMoney = Number(user.money) || 0;
    const totalEstate = rawMoney + assetValue + companyCash;

    if (totalEstate <= 0) {
        return {
            totalEstate,
            distributableEstate: 0,
            spouseShare: 0,
            inheritancePerChild: 0,
            children,
            spouse,
            isInsolvent: true
        };
    }

    let spouseShare = 0;
    let remainingEstate = totalEstate;

    if (hasSpouse) {
        spouseShare = hasChildren ? Math.floor(totalEstate * 0.5) : totalEstate;
        remainingEstate = Math.max(0, totalEstate - spouseShare);
    }

    const inheritancePerChild = hasChildren
        ? Math.max(0, Math.floor(remainingEstate / children.length))
        : 0;

    return {
        totalEstate,
        distributableEstate: totalEstate,
        spouseShare: Math.max(0, spouseShare),
        inheritancePerChild,
        children,
        spouse,
        isInsolvent: false
    };
}

/**
 * Determines if a partner accepts a marriage proposal. Chance scales with
 * relationship status and ring quality. Supports signatures:
 * - calculateProposalAcceptance(status, roll)
 * - calculateProposalAcceptance(status, ringValue, roll)
 * @param {number} status
 * @param {number} [ringValueOrRoll=0]
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if accepted, false if rejected
 */
export function calculateProposalAcceptance(status, ringValueOrRoll = 0, roll = Math.random()) {
    let ringValue = 0;
    let actualRoll = roll;

    if (typeof ringValueOrRoll === 'number') {
        if (ringValueOrRoll > 0 && ringValueOrRoll <= 1) {
            actualRoll = ringValueOrRoll;
            ringValue = 0;
        } else if (ringValueOrRoll > 1) {
            ringValue = ringValueOrRoll;
        }
    }

    let baseChance = status / 100;
    let ringBonus = 0;
    if (ringValue > 0) {
        ringBonus = Math.min(0.25, Math.log10(Math.max(10, ringValue)) * 0.05);
    }
    return actualRoll < Math.min(0.95, baseChance + ringBonus);
}


/**
 * Determines if trying for a baby succeeds this year, based on the
 * female's age and male's age (females 45+ or males 65+ cannot conceive).
 * @param {number} femaleAge - Age of the female partner
 * @param {number|undefined} [maleAgeOrRoll] - Age of male partner, or roll if 2-arg signature
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if a pregnancy begins
 */
export function calculatePregnancyChance(femaleAge, maleAgeOrRoll = undefined, roll = Math.random()) {
    let maleAge;
    let actualRoll = roll;

    if (typeof maleAgeOrRoll === 'number' && maleAgeOrRoll < 1.0 && maleAgeOrRoll >= 0) {
        actualRoll = maleAgeOrRoll;
        maleAge = undefined;
    } else {
        maleAge = maleAgeOrRoll;
    }

    if (femaleAge >= 45) return false;
    if (maleAge !== undefined && maleAge >= 65) return false;

    let chance;
    if (femaleAge < 35) chance = 0.5;
    else if (femaleAge < 40) chance = 0.3;
    else chance = 0.1;

    return actualRoll < chance;
}

/**
 * Maps living family members from a deceased parent's state to the new child player.
 * Inherits:
 * - Surviving spouse -> Mother / Father
 * - Other children of parent -> Brother / Sister
 * - Deceased parent's siblings -> Uncle / Aunt
 * - Deceased parent's parents -> Grandfather / Grandmother
 * @param {Array} parentRelationships - Array of relationship objects from deceased parent
 * @param {string} selectedChildId - ID of the child becoming the new player character
 * @returns {Array} Array of relationship objects mapped for the new child player
 */
export function inheritFamilyRelationships(parentRelationships, selectedChildId) {
    if (!Array.isArray(parentRelationships)) return [];

    const inherited = [];

    parentRelationships.forEach(r => {
        if (!r || r.id === selectedChildId) return;

        let newType = null;

        if (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') {
            const isMale = r.gender === 'male' || r.type === 'Son';
            newType = isMale ? 'Brother' : 'Sister';
        } else if (r.category === 'spouse' || r.type === 'Husband' || r.type === 'Wife') {
            const isMale = r.gender === 'male' || r.type === 'Husband';
            newType = isMale ? 'Father' : 'Mother';
        } else if (r.type === 'Brother' || r.type === 'Sister') {
            const isMale = r.gender === 'male' || r.type === 'Brother';
            newType = isMale ? 'Uncle' : 'Aunt';
        } else if (r.type === 'Mother' || r.type === 'Father') {
            const isMale = r.gender === 'male' || r.type === 'Father';
            newType = isMale ? 'Grandfather' : 'Grandmother';
        }

        if (newType) {
            inherited.push({
                id: r.id,
                name: r.name,
                age: r.age,
                gender: r.gender || (['Brother', 'Father', 'Uncle', 'Grandfather'].includes(newType) ? 'male' : 'female'),
                type: newType,
                status: r.status !== undefined ? r.status : 80,
                category: 'family',
                appearance: r.appearance,
                avatarVersion: r.avatarVersion || 0,
                interactedThisYear: false
            });
        }
    });

    return inherited;
}

export const RELOCATION_COST = 2000;

export function getPartner(user) {
    if (!user || !user.relationships) return null;
    return user.relationships.find(r => 
        r.category === 'partner' || 
        r.category === 'spouse' || 
        ['Girlfriend', 'Boyfriend', 'Partner', 'Fiancé', 'Fiancée', 'Fiance', 'Wife', 'Husband', 'Spouse'].includes(r.type)
    ) || null;
}

export function calculatePartnerRelocateAcceptance(partner, rollOverride = null) {
    if (!partner) return false;
    const status = partner.status || 50;
    let baseChance = 0.50;
    if (status >= 80) baseChance = 0.85;
    else if (status >= 60) baseChance = 0.70;
    else if (status >= 40) baseChance = 0.50;
    else baseChance = 0.25;

    const roll = rollOverride !== null ? rollOverride : Math.random();
    return roll < baseChance;
}

export function breakUpWithPartner(user, partner) {
    if (!isAlive(user) || !partner) return;
    partner.category = 'ex';
    if (['Spouse', 'Husband', 'Wife'].includes(partner.type) || partner.category === 'spouse') {
        partner.type = partner.gender === 'male' ? 'Ex-Husband' : 'Ex-Wife';
    } else if (['Fiancé', 'Fiancée', 'Fiance'].includes(partner.type)) {
        partner.type = 'Ex-Fiancé';
    } else {
        partner.type = partner.gender === 'male' ? 'Ex-Boyfriend' : 'Ex-Girlfriend';
    }
}

export function canMoveCountry(user, targetCountry, targetCity = null) {
    if (!user) return { allowed: false, reason: "No character data found." };
    if (!isAlive(user)) return { allowed: false, reason: "Cannot relocate while dead or at 0 HP." };
    if ((user.age || 0) < 18) return { allowed: false, reason: "You must be at least 18 years old to relocate to a new country." };
    if (targetCountry && user.country === targetCountry) return { allowed: false, reason: `You are already living in ${targetCountry}.` };
    if (targetCity && user.city === targetCity) return { allowed: false, reason: `You are already living in ${targetCity}.` };
    if ((user.money || 0) < RELOCATION_COST) return { allowed: false, reason: `You need at least $${RELOCATION_COST.toLocaleString()} to move to a new country.` };
    return { allowed: true };
}

export function moveCountry(user, targetCountry, targetCity) {
    if (!isAlive(user)) return { success: false, message: "Cannot relocate while dead or at 0 HP." };
    const check = canMoveCountry(user, targetCountry, targetCity);
    if (!check.allowed) return { success: false, message: check.reason };

    const hadJob = !!user.jobTitle;
    const oldJobTitle = user.jobTitle;

    user.money -= RELOCATION_COST;
    user.country = targetCountry;
    user.city = targetCity;

    if (hadJob) {
        user.lastJobTitle = oldJobTitle;
        user.peakJobTitle = user.peakJobTitle || oldJobTitle;
        if (user.careerTrack) user.lastCareerTrack = user.careerTrack;
        user.totalYearsWorked = (user.totalYearsWorked || 0) + (user.yearsInCareer || 0);
        user.jobTitle = null;
        user.jobSalary = 0;
        user.jobPerformance = 50;
        user.careerActionTaken = false;
        user.careerTrack = null;
        user.careerLevel = 0;
        user.yearsInRole = 0;
        user.yearsInCareer = 0;
        user.consecutivePoorYears = 0;
        user.hasSeenJobSalary = false;
    }

    const jobMsg = hadJob ? ` You lost your job as ${oldJobTitle} and are now unemployed.` : '';

    return {
        success: true,
        cost: RELOCATION_COST,
        newCountry: targetCountry,
        newCity: targetCity,
        hadJob,
        oldJobTitle,
        message: `Relocated to ${targetCity}, ${targetCountry} for $${RELOCATION_COST.toLocaleString()}.${jobMsg}`
    };
}
