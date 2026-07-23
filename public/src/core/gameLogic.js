import { addLog } from '../features/player/mainScreen.js';
import { UI } from '../ui/ui.js';
import { AvatarLogic } from './avatarLogic.js';

function sanitizeName(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
        return { isValid: false, error: "Name cannot be empty." };
    }

    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');
    const nameParts = cleanedName.split(' ');

    if (nameParts.length < 2) {
        return { isValid: false, error: "You must enter both a first and last name." };
    }

    if (cleanedName.length > 25) {
        return { isValid: false, error: "Keep the name to 25 characters or less." };
    }

    const validFormatRegex = /^[A-Za-z]+(?:[- ][A-Za-z]+)*$/;

    if (!validFormatRegex.test(cleanedName)) {
        return { isValid: false, error: "Name can only contain letters, spaces, and single hyphens. Cannot start or end with a hyphen." };
    }

    return { isValid: true, cleanedName };
}

const CITY_COST_OF_LIVING = {
    'San Francisco': 33000,
    'New York': 30000,
    'Los Angeles': 30000,
    'London': 30000,
    'Tokyo': 30000,
    'Paris': 30000,
    'Miami': 24000,
    'Toronto': 24000,
    'Osaka': 24000,
    'Berlin': 21000,
    'Madrid': 21000,
    'Beijing': 21000,
    'Houston': 18000,
    'Tucson': 18000,
    'Bandar Seri Begawan': 15000,
    'Mexico City': 15000,
    'Cairo': 15000,
};

function addLivingExpenses(age, currentlyStudent, city) {
    if (age >= 19 && !currentlyStudent) {
        return CITY_COST_OF_LIVING[city] || 24000;
    }
    return 0;
}

function calculateBirthdayMoney() {
    return Math.floor(Math.random() * 71) + 10;
}

function addStudentLoanPayment(age, studentLoanAmount, isStudent) {
        if (age >= 18 && studentLoanAmount > 0 && !isStudent) {
            return Math.min(2400, studentLoanAmount);
        }
        return 0;
};

function checkSchoolGraduated(currentSchoolYear, enrolledSchoolYears) {
    return currentSchoolYear >= enrolledSchoolYears;
}

function checkLifeStatus(user) {
    if (user.gradSchoolEnrolled) {
       return `${user.gradSchoolType} Student`;
    } else if (user.universityEnrolled) {
       return "University Student";
    } else if (user.hasBusiness) {
       return "CEO & Founder";
    } else if (user.jobTitle) {
       return user.jobTitle;
    } else if (user.gradSchoolDegree) {
       return `${user.gradSchoolDegree} Graduate`;
    } else if (user.universityGraduated) {
       return "University Graduate";
    } else if (user.age > 17 && user.highSchoolRetained) {
       return "Student (Retaking)";
    } else if (user.age > 17 && !user.jobTitle) {
       return "Unemployed";
    } else if (user.age === 0) {
       return "Baby";
    } else if (user.age < 5) {
       return "Toddler";
    } else if (user.age < 18) {
       return "Student";
    }
}

const VEHICLE_TYPES = {
    // Standard Cars
    sedan: { icon: "fa-car", color: "text-blue-400" },
    coupe: { icon: "fa-car-side", color: "text-indigo-400" },
    hatchback: { icon: "fa-car", color: "text-slate-400" },
    
    // Larger Vehicles
    suv: { icon: "fa-shuttle-van", color: "text-emerald-400" }, // Use shuttle van for SUV
    truck: { icon: "fa-truck-pickup", color: "text-orange-400" },
    van: { icon: "fa-van-shuttle", color: "text-slate-500" },

    // Special
    sports: { icon: "fa-car-burst", color: "text-red-500" }, // "Fast" car icon
    supercar: { icon: "fa-fire", color: "text-red-600" }, // Or use fire/rocket for exotic
    motorcycle: { icon: "fa-motorcycle", color: "text-yellow-400" },
    
    // Default fallback
    default: { icon: "fa-car", color: "text-gray-400" }
};

function getVehicleIcon(type) {
    // Convert type to lowercase to match keys
    const key = type ? type.toLowerCase() : 'default';
    return VEHICLE_TYPES[key] || window.VEHICLE_TYPES.default;
};

    // Simulates market fluctuation
function simulateVehicleMarket() {
    // This generates a number between -0.08 (-8%) and 0.08 (+8%)
    const marketForce = (Math.random() * 0.16) - 0.08;
    
    // 2. Apply to every car
    window.VEHICLES_FOR_SALE.forEach(car => {
        // Each car has a slight individual variance on top of the market force
        const individualVariance = (Math.random() * 0.04) - 0.02; // +/- 2%
        const totalChangePercent = 1 + marketForce + individualVariance;
        
        // Calculate new price
        let newPrice = Math.floor(car.price * totalChangePercent);
        
        // Round to nearest $10 or $100 for cleaner numbers
        if (newPrice > 10000) {
            newPrice = Math.round(newPrice / 100) * 100;
        } else {
            newPrice = Math.round(newPrice / 10) * 10;
        }
        // Safety: Don't let prices drop below 50% of original or go too crazy
        // (Optional, but keeps Rusty Camrys from becoming free)
        newPrice = Math.max(500, newPrice); 
        // Update the global object
        car.price = newPrice;
        
        // Store the % change to show UI arrows later (Optional feature)
        car.lastChange = totalChangePercent > 1 ? 'up' : 'down';
    });
    return marketForce;
};

function updateOwnedVehicles(user, marketForce) {
    if (!user.assets || user.assets.length === 0) return;
    user.assets.forEach(asset => {
        // Only affect vehicles
        if (asset.category === 'vehicle') {
            // Lose between 3% and 7% condition every year randomly
            const decay = Math.floor(Math.random() * 5) + 3; 
            asset.condition = Math.max(0, asset.condition - decay);
            // Base depreciation (cars lose ~15% value naturally)
            const baseDepreciation = 0.85; 
            
            // Market Impact: If market is up (+8%), depreciation is less severe
            // We use 0.5 to dampen the market effect on used cars
            const marketImpact = 1 + (marketForce * 0.5); 
            // Calculate new value
            let newValue = Math.floor(asset.value * baseDepreciation * marketImpact);
            
            // Penalty: If condition is terrible (< 40%), value drops harder
            if (asset.condition < 40) {
                newValue = Math.floor(newValue * 0.80); // Extra 20% drop
            }
            asset.value = Math.max(0, newValue);
            // CRITICAL WARNINGS
            // If the car just hit 0% or low condition, warn the user
            if (asset.condition === 0) {
                 addLog(`URGENT: Your ${asset.name} has broken down completely!`, 'bad');
            } else if (asset.condition < 20 && asset.condition + decay >= 20) {
                 addLog(`Your ${asset.name} is falling apart. Repair it soon!`, 'bad');
            }
        }
    });
}

const MORTALITY_RATES = [
    { maxAge: 0, rate: 0.005, causes: ["complications at birth.", "SIDS."] },
    { maxAge: 15, rate: 0.0001, causes: ["a tragic childhood accident.", "a rare illness."] },
    { maxAge: 25, rate: 0.001, causes: ["a fatal car crash.", "a reckless accident."] },
    { maxAge: 50, rate: 0.002, causes: ["an unforeseen medical emergency.", "a workplace accident."] },
    { maxAge: 70, rate: 0.01, causes: ["a sudden heart attack.", "cancer."] },
    { maxAge: 90, rate: 0.05, causes: ["a stroke.", "natural causes."] },
    { maxAge: 110, rate: 0.15, causes: ["old age.", "organ failure."] },
    { maxAge: Infinity, rate: 1.0, causes: ["extreme old age."] }
];
function checkMortality(age, health = 100) {
    const bracket = MORTALITY_RATES.find(b => age <= b.maxAge);
    let chance = bracket.rate;

    // Health Modifier: Scales risk up to 300% if health is critically low (< 30)
    if (health < 30) {
        const penaltyMultiplier = 1 + ((30 - Math.max(0, health)) / 10);
        chance *= penaltyMultiplier;
    }

    if (Math.random() < chance) {
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
function calculateHealthDecay(age, roll = Math.random()) {
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

function compressLifeLog(lifeLog) {
    // 1. Create a shallow copy and reverse it to true chronological order (Birth -> Death)
    const chronologicalLog = [...lifeLog].reverse();

    return chronologicalLog
        .map(year => {
            // 2. Filter out UI fluff and annual spam loops
            const significantEvents = year.events
                .filter(e => {
                    const msg = e.msg;
                    if (msg === "You didn't do much all year.") return false;
                    if (msg.startsWith("Earned $")) return false; // Ignore annual salary
                    if (msg.includes("basic living expenses")) return false; // Ignore annual expenses
                    if (msg.includes("Completed year")) return false; // Ignore mid-degree updates
                    return true;
                })
                .map(e => e.msg)
                .join(" ");
            
            return significantEvents ? `Age ${year.age}: ${significantEvents}` : null;
        })
        .filter(Boolean) // Remove years that are now empty after filtering
        .join("\n");
};

/**
 * Calculates active health improvements from gym and diet.
 * @param {boolean} hasGym - Whether user has active gym membership.
 * @param {boolean} hasDiet - Whether user has better diet.
 * @returns {number} Health points to offset decay.
 */
function calculateHealthBenefits(hasGym, hasDiet) {
    let benefit = 0;
    if (hasGym) benefit += 1;
    if (hasDiet) benefit += 1;
    return benefit;
}

/**
 * Calculates the cost of active health mechanics per year.
 * @param {boolean} hasGym - Whether user has active monthly gym membership.
 * @param {boolean} hasDiet - Whether user has better diet.
 * @returns {number} Yearly cost to deduct.
 */
function calculateActiveHealthCosts(hasGym, hasDiet) {
    let cost = 0;
    if (hasGym) cost += 600; // $50/mo * 12
    if (hasDiet) cost += 2400; // $200/mo * 12
    return cost;
}

/**
 * Calculates monthly outflow for children under age 21.
 * Each child under 21 adds $500 per month. Once a child reaches 21, the amount is removed.
 * @param {Array} relationships - Array of user relationships.
 * @returns {number} Monthly outflow in dollars.
 */
function calculateChildMonthlyOutflow(relationships) {
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
function calculateMedicalVisit() {
    return { boost: 10, cost: 1000 };
}

/**
 * Returns the immediate health boost and cost for a one-time gym visit.
 * @returns {object} { boost, cost }
 */
function calculateOneTimeGymVisit() {
    return { boost: 1, cost: 20 };
}

/**
 * @returns {Array} A shuffled 52-card deck
 */
function getDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * @param {Array} hand - Array of card objects
 * @returns {number} The best value of the blackjack hand
 */
function calculateBlackjackHand(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else if (card.value === 'A') {
            aces += 1;
            value += 11;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }
    return value;
}

/**
 * @param {Array} playerHand 
 * @param {Array} dealerHand 
 * @returns {string} 'win', 'lose', 'push', or 'bust'
 */
function determineBlackjackOutcome(playerHand, dealerHand) {
    const playerTotal = calculateBlackjackHand(playerHand);
    const dealerTotal = calculateBlackjackHand(dealerHand);
    
    if (playerTotal > 21) return 'bust';
    if (dealerTotal > 21) return 'win'; // dealer busts
    if (playerTotal === dealerTotal) return 'push';
    if (playerTotal > dealerTotal) return 'win';
    return 'lose';
}

/**
 * Calculates outcome of a vacation
 * @param {number} tier - 1 (Local), 2 (Cross-Country), 3 (Luxury)
 * @param {number} [roll=Math.random()] - Injectable random roll
 */
function calculateTripOutcome(tier, roll = Math.random()) {
    let baseHealthBoost = 0;
    let baseCost = 0;
    let tripName = "";

    if (tier === 1) {
        baseCost = 500;
        baseHealthBoost = 5;
        tripName = "Local Getaway";
    } else if (tier === 2) {
        baseCost = 2000;
        baseHealthBoost = 10;
        tripName = "Cross-Country Trip";
    } else if (tier === 3) {
        baseCost = 10000;
        baseHealthBoost = 15;
        tripName = "Luxury International Tour";
    }

    const events = [
        { msg: "You had a perfectly relaxing trip.", healthMod: 0, moneyMod: 0 },
        { msg: "You found a hidden gem and felt completely revitalized!", healthMod: 5, moneyMod: 0 },
        { msg: "You were attacked on vacation.", healthMod: -20, moneyMod: 0 },
        { msg: "You got food poisoning from a shady restaurant.", healthMod: -5, moneyMod: 0 },
        { msg: "You lost your wallet at the beach.", healthMod: 0, moneyMod: -200 },
        { msg: "You won a local contest and got some cash!", healthMod: 0, moneyMod: 300 },
        { msg: "Your luggage was lost, ruining your mood.", healthMod: -2, moneyMod: 0 },
        { msg: "You met a fantastic new friend who showed you around.", healthMod: 3, moneyMod: 0 }
    ];

    const eventIndex = Math.floor(roll * events.length);
    const selectedEvent = events[eventIndex];

    const finalHealthBoost = baseHealthBoost + selectedEvent.healthMod;

    return {
        tripName,
        cost: baseCost,
        moneyChange: selectedEvent.moneyMod,
        healthChange: finalHealthBoost,
        eventMessage: selectedEvent.msg
    };
}

/**
 * Calculates new relationship status after yearly decay.
 * @param {number} currentStatus
 * @param {boolean} interactedThisYear
 * @param {string} [category] - relationship category; 'family' is exempt while the player is a minor, 'classmate' is always exempt
 * @param {number} [userAge] - the player's current age
 * @returns {number} New status
 */
function calculateRelationshipDecay(currentStatus, interactedThisYear, category, userAge) {
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
function checkRelationshipCategoryShift(category, status) {
    if (['family', 'spouse', 'child', 'classmate', 'partner', 'ex'].includes(category)) return null;

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
const RELATIONSHIP_INTERACTIONS = [
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
function isHostile(person) {
    const isFamilyLike = ['family', 'spouse', 'child'].includes(person.category);
    return isFamilyLike ? person.status < 15 : person.status < 30;
}

/**
 * Returns the interactions applicable to this person/user pair at all
 * (category/type/gender/relationship-status filters). Does not evaluate
 * age/funds/hostility gates — see isInteractionBlocked for those.
 * @param {object} person
 * @param {object} user
 * @returns {Array}
 */
function getAvailableInteractions(person, user) {
    const hasPartnerOrSpouse = (user.relationships || []).some(r => r.category === 'partner' || r.category === 'spouse');
    return RELATIONSHIP_INTERACTIONS.filter(it => {
        if (it.categories && !it.categories.includes(person.category)) return false;
        if (it.requiredTypes && !it.requiredTypes.includes(person.type)) return false;
        if (it.requiresOppositeGender && (!person.gender || !user.gender || person.gender === user.gender)) return false;
        if (it.monogamyGate && hasPartnerOrSpouse) return false;
        return true;
    });
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
function isInteractionBlocked(interactionKey, person, user) {
    const it = RELATIONSHIP_INTERACTIONS.find(i => i.key === interactionKey);
    if (!it) return { blocked: true, reason: 'Unknown Action' };

    let blocked = false;
    let reason = '';

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
function calculateInheritance(age, roll = Math.random()) {
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
    
    // Round to nearest 100
    return Math.round(inheritance / 100) * 100;
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
function calculateSpousalLifeInsurance(roll = Math.random(), amountRoll = Math.random()) {
    // Only ~30% of spouses turn out to have had a payable policy
    if (roll >= 0.3) {
        return 0;
    }

    const payout = 25000 + Math.floor(amountRoll * 175000); // $25,000 - $200,000

    // Round to nearest 100
    return Math.round(payout / 100) * 100;
}

const FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'];
const FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

/**
 * Returns a random first name for the given gender.
 * @param {string} gender - 'male' or 'female'
 * @param {number} [roll=Math.random()] - Injected randomness for pure unit testing.
 * @returns {string}
 */
function getRandomFirstName(gender, roll = Math.random()) {
    const pool = gender === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    return pool[Math.floor(roll * pool.length)];
}

/**
 * Extracts the last word of a full name, treated as the surname.
 * @param {string} fullName
 * @returns {string}
 */
function getLastName(fullName) {
    const parts = (fullName || '').trim().split(' ');
    return parts[parts.length - 1];
}

/**
 * Extracts everything but the last word of a full name, treated as the given name(s).
 * @param {string} fullName
 * @returns {string}
 */
function getFirstName(fullName) {
    const parts = (fullName || '').trim().split(' ');
    return parts.slice(0, -1).join(' ') || parts[0] || '';
}

/**
 * Determines if a spouse accepts taking your last name, mirroring
 * calculateProposalAcceptance's status-derived chance.
 * @param {number} status
 * @param {number} [roll=Math.random()]
 * @returns {boolean}
 */
function calculateNameChangeAcceptance(status, roll = Math.random()) {
    return roll < (status / 100);
}

/**
 * Generates a cohort of classmates and one teacher based on the user's age.
 * @param {number} userAge 
 * @returns {Array} Array of relationship objects
 */
function generateSchoolCohort(userAge) {
    const cohort = [];
    
    // Determine bounds
    let classmateAgeMin = Math.max(5, userAge - 1);
    let classmateAgeMax = userAge + 1;
    
    if (userAge >= 18) {
        classmateAgeMin = 18;
        classmateAgeMax = 25;
    }

    const numClassmates = Math.floor(Math.random() * 5) + 12; // 12 to 16 classmates

    for (let i = 0; i < numClassmates; i++) {
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const first = getRandomFirstName(gender);
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
        cohort.push({
            id,
            name: `${first} ${last}`,
            age: Math.floor(Math.random() * (classmateAgeMax - classmateAgeMin + 1)) + classmateAgeMin,
            type: 'Classmate',
            gender,
            status: Math.floor(Math.random() * 31) + 20, // 20 to 50 starting status
            category: 'classmate',
            isCurrentClassmate: true,
            interactedThisYear: false,
            appearance: AvatarLogic.generateRandomAppearance(id, gender)
        });
    }

    // Generate one teacher
    const teacherGender = Math.random() < 0.5 ? 'male' : 'female';
    const lastTeacher = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = teacherGender === 'male' ? 'Mr.' : (Math.random() > 0.5 ? 'Ms.' : 'Mrs.');
    const teacherId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    cohort.push({
        id: teacherId,
        name: `${title} ${lastTeacher}`,
        age: Math.floor(Math.random() * 37) + 24, // 24 to 60
        type: 'Teacher',
        gender: teacherGender,
        status: Math.floor(Math.random() * 31) + 20, // 20 to 50
        category: 'classmate', // Keep as 'classmate' category so they show up together
        isCurrentClassmate: true,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(teacherId, teacherGender)
    });

    return cohort;
}

/**
 * Generates a single opposite-gender stranger the player meets while out
 * (e.g. a "Go Out / Meet Someone" action). Starts as a regular friend —
 * romance only begins once the player uses "Ask Out" on them.
 * @param {number} userAge
 * @param {string} userGender - 'male' or 'female'
 * @param {number} [roll=Math.random()] - Injected randomness for the age roll, for pure unit testing.
 * @returns {object} A relationship object
 */
function generateStranger(userAge, userGender, roll = Math.random()) {
    const gender = userGender === 'male' ? 'female' : 'male';
    const minAge = Math.max(18, userAge - 3);
    const maxAge = Math.max(minAge, userAge + 5);
    const age = minAge + Math.floor(roll * (maxAge - minAge + 1));

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    return {
        id,
        name: `${first} ${last}`,
        age,
        type: 'Friend',
        gender,
        status: Math.floor(Math.random() * 21) + 20, // 20 to 40 starting status
        category: 'friend',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

/**
 * Backfills a missing `gender` on legacy relationship records (saves that
 * predate the romance system) so they aren't permanently invisible to
 * gender-gated interactions like Ask Out. Mutates entries in place.
 * @param {Array} relationships
 * @returns {Array} the same array
 */
function backfillRelationshipGender(relationships) {
    if (!Array.isArray(relationships)) return relationships;
    relationships.forEach(r => {
        if (!r.gender) r.gender = Math.random() < 0.5 ? 'male' : 'female';
    });
    return relationships;
}

/**
 * Determines if a classmate or teacher accepts a friend request.
 * @param {number} status 
 * @param {boolean} isTeacher 
 * @param {number} roll - random roll between 0 and 1
 * @returns {boolean} true if accepted, false if rejected
 */
function attemptBefriend(status, isTeacher, roll = Math.random()) {
    // Base chance depends on status. e.g. status 50 = 50% chance.
    let chance = status / 100;

    // It's harder for teachers
    if (isTeacher) {
        chance *= 0.5; // Half as likely
    }

    return roll < chance;
}

/**
 * Determines if a partner accepts a marriage proposal. Chance scales with
 * relationship status, mirroring attemptBefriend's status-derived chance.
 * @param {number} status
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if accepted, false if rejected
 */
function calculateProposalAcceptance(status, roll = Math.random()) {
    return roll < (status / 100);
}

/**
 * Determines if trying for a baby succeeds this year, based on the
 * female's age and male's age (females 45+ or males 65+ cannot conceive).
 * @param {number} femaleAge - Age of the female partner
 * @param {number|undefined} [maleAgeOrRoll] - Age of male partner, or roll if 2-arg signature
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if a pregnancy begins
 */
function calculatePregnancyChance(femaleAge, maleAgeOrRoll = undefined, roll = Math.random()) {
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
 * Returns the annual promotion chance for a career-track employee based on performance.
 * @param {number} performance - Job performance (0–100)
 * @returns {number} Probability of promotion (0.0 to 0.80); 0 means ineligible
 */
function calculatePromotionChance(performance) {
    if (performance >= 95) return 0.80;
    if (performance >= 85) return 0.50;
    if (performance >= 75) return 0.25;
    return 0;
}

/**
 * Determines whether a business owner can process another quarterly turn
 * at their current player age (limit: 1 fiscal year / 4 quarters per age).
 * @param {object} user - The player state object
 * @returns {{ allowed: boolean, reason?: string }}
 */
function canProcessBusinessQuarter(user) {
    if (!user || !user.hasBusiness) {
        return { allowed: false, reason: "No active business." };
    }

    if (user.lastCompletedFiscalYearAge === user.age) {
        return {
            allowed: false,
            reason: "You need to age up before continuing a new fiscal year."
        };
    }

    const quartersThisAge = user.lastBusinessAge === user.age ? (user.quartersProcessedThisAge || 0) : 0;

    if (quartersThisAge >= 4) {
        return {
            allowed: false,
            reason: "You need to age up before continuing a new fiscal year."
        };
    }

    return { allowed: true };
}

/**
 * Records that a business quarter was processed at the current player age.
 * Updates user.lastBusinessAge, increments user.quartersProcessedThisAge,
 * and sets user.lastCompletedFiscalYearAge if a fiscal year was completed.
 * @param {object} user - The player state object
 * @param {boolean} [fiscalYearCompleted=false] - Whether this quarter completed a fiscal year
 * @returns {object} The mutated user state
 */
function recordBusinessQuarterProcessed(user, fiscalYearCompleted = false) {
    if (!user) return user;
    if (user.lastBusinessAge !== user.age) {
        user.lastBusinessAge = user.age;
        user.quartersProcessedThisAge = 0;
    }
    user.quartersProcessedThisAge = (user.quartersProcessedThisAge || 0) + 1;
    if (fiscalYearCompleted) {
        user.lastCompletedFiscalYearAge = user.age;
    }
    return user;
}

/**
 * Returns how many quarters remain available to process for the current player age.
 * @param {object} user
 * @returns {number} 0 to 4
 */
function getRemainingQuartersForAge(user) {
    if (!user || !user.hasBusiness) return 0;
    if (user.lastCompletedFiscalYearAge === user.age) return 0;
    const processed = user.lastBusinessAge === user.age ? (user.quartersProcessedThisAge || 0) : 0;
    return Math.max(0, 4 - processed);
}

/**
 * Calculates how many quarters autoProcessBusinessQuarter should run when aging up.
 * If a fiscal year was already completed at the previous age, returns 0.
 * Otherwise returns the remaining quarters needed to complete the fiscal year for that age.
 * @param {object} user
 * @returns {number} Quarters to auto-process (0 to 4)
 */
function calculateAutoQuarterCount(user) {
    if (!user || !user.hasBusiness) return 0;
    const prevAge = user.age - 1;
    if (user.lastCompletedFiscalYearAge === prevAge) {
        return 0;
    }
    if (user.lastBusinessAge === prevAge) {
        const processed = user.quartersProcessedThisAge || 0;
        return Math.max(0, 4 - processed);
    }
    return 4;
}

/**
 * Resets business quarter tracking so a newly acquired or restarted business
 * starts with a fresh fiscal year for the current age.
 * @param {object} user - The player state object
 * @returns {object} The mutated user state
 */
function resetBusinessQuarterTracking(user) {
    if (!user) return user;
    user.quartersProcessedThisAge = 0;
    user.lastBusinessAge = null;
    user.lastCompletedFiscalYearAge = null;
    return user;
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
function inheritFamilyRelationships(parentRelationships, selectedChildId) {
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

const PROPERTIES_FOR_SALE = [
    { id: 1, name: "Cozy Studio Apartment", type: "apartment", price: 120000, desc: "A modest starter studio in the city." },
    { id: 2, name: "Suburban Townhouse", type: "townhouse", price: 280000, desc: "A cozy 2-bedroom townhouse with a garage." },
    { id: 3, name: "Family Suburban House", type: "house", price: 450000, desc: "Spacious 4-bedroom house with a backyard." },
    { id: 4, name: "Downtown Luxury Condo", type: "condo", price: 850000, desc: "High-rise condo with skyline views." },
    { id: 5, name: "Executive Hillside Villa", type: "villa", price: 2200000, desc: "Gated villa with a private pool." },
    { id: 6, name: "Beachfront Estate", type: "estate", price: 6500000, desc: "Sprawling oceanfront luxury property." },
    { id: 7, name: "Penthouse Skyscraper", type: "penthouse", price: 15000000, desc: "The peak of luxury overlooking the entire city." }
];

const PROPERTY_TYPES = {
    apartment: { icon: "fa-building", color: "text-blue-400" },
    townhouse: { icon: "fa-city", color: "text-indigo-400" },
    house: { icon: "fa-house", color: "text-green-400" },
    condo: { icon: "fa-building-user", color: "text-purple-400" },
    villa: { icon: "fa-place-of-worship", color: "text-amber-400" },
    estate: { icon: "fa-landmark", color: "text-emerald-400" },
    penthouse: { icon: "fa-crown", color: "text-yellow-400" },
    default: { icon: "fa-home", color: "text-slate-400" }
};

function getPropertyIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return PROPERTY_TYPES[key] || PROPERTY_TYPES.default;
}

function calculateMonthlyMortgage(principal, annualRate = 0.065, years = 30) {
    if (!principal || principal <= 0) return 0;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    const factor = Math.pow(1 + monthlyRate, numPayments);
    const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
    return Math.round(monthlyPayment);
}

function calculateTotalRentalIncome(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            return sum + asset.tenant.monthlyRent;
        }
        return sum;
    }, 0);
}

function calculateUserMonthlyIncome(user) {
    if (!user) return 0;
    let monthlyIncome = 0;
    if (user.hasBusiness && user.ceoSalary) monthlyIncome += user.ceoSalary;
    if (user.jobTitle && user.jobSalary) monthlyIncome += Math.floor(user.jobSalary / 12);
    monthlyIncome += calculateTotalRentalIncome(user.assets);
    return monthlyIncome;
}

function generateTenantApplicants(property) {
    if (!property || !property.value) return [];
    const val = property.value;
    const seedTime = `${property.id}_${Date.now()}_${Math.random()}`;

    const maleName1 = `${getRandomFirstName('male')} ${getLastName()}`;
    const femaleName2 = `${getRandomFirstName('female')} ${getLastName()}`;
    const maleName3 = `${getRandomFirstName('male')} ${getLastName()}`;

    const app1 = {
        id: 'applicant_reliable',
        name: maleName1,
        gender: 'male',
        age: Math.floor(Math.random() * 25) + 30,
        type: 'Reliable Professional',
        quality: 'excellent',
        monthlyRent: Math.max(500, Math.floor(val * 0.007)),
        leaseYears: 2,
        desc: 'Corporate professional with verified credit and stellar landlord references.'
    };
    app1.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_1`, 'male');

    const app2 = {
        id: 'applicant_roommates',
        name: femaleName2,
        gender: 'female',
        age: Math.floor(Math.random() * 15) + 22,
        type: 'Working Roommates',
        quality: 'good',
        monthlyRent: Math.max(650, Math.floor(val * 0.009)),
        leaseYears: 1,
        desc: 'Steady combined income willing to pay higher rent for a flexible 1-year term.'
    };
    app2.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_2`, 'female');

    const app3 = {
        id: 'applicant_unscreened',
        name: maleName3,
        gender: 'male',
        age: Math.floor(Math.random() * 20) + 25,
        type: 'Unscreened Applicant',
        quality: 'risky',
        monthlyRent: Math.max(800, Math.floor(val * 0.011)),
        leaseYears: 3,
        desc: 'Offers top-tier rent and a long lease, but has an unverified employment history.'
    };
    app3.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_3`, 'male');

    return [app1, app2, app3];
}

function acceptTenantLease(user, propertyId, applicantId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.isRented && property.tenant) {
        return { success: false, reason: "Property is already occupied by a tenant." };
    }

    const applicants = generateTenantApplicants(property);
    const selected = applicants.find(a => a.id === applicantId);
    if (!selected) return { success: false, reason: "Invalid applicant selected." };

    property.isRented = true;
    property.tenant = {
        id: selected.id,
        name: selected.name,
        gender: selected.gender,
        age: selected.age,
        type: selected.type,
        quality: selected.quality,
        monthlyRent: selected.monthlyRent,
        leaseYears: selected.leaseYears,
        appearance: selected.appearance
    };

    return { success: true, propertyName: property.name, tenant: property.tenant };
}

function processRentalIncome(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return 0;

    let totalCollectedThisYear = 0;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            let annualRent = asset.tenant.monthlyRent * 12;

            // Partial defaults for risky or good tenants
            if (asset.tenant.quality === 'risky' && Math.random() < 0.25) {
                const missedMonths = 2;
                const missedAmount = asset.tenant.monthlyRent * missedMonths;
                annualRent -= missedAmount;
                addLog(`Tenant ${asset.tenant.name} fell behind on 2 months of rent for ${asset.name}.`, 'bad');

                if (stateRef && stateRef.gameState) {
                    if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                    stateRef.gameState.pendingTenantEvents.push({
                        eventType: 'overdue',
                        propertyId: asset.id,
                        propertyName: asset.name,
                        tenantId: asset.tenant.id,
                        tenantName: asset.tenant.name,
                        tenant: asset.tenant,
                        monthlyRent: asset.tenant.monthlyRent,
                        missedMonths: 2,
                        missedAmount
                    });
                }
            } else if (asset.tenant.quality === 'good' && Math.random() < 0.10) {
                const missedMonths = 1;
                annualRent -= asset.tenant.monthlyRent * missedMonths;
                addLog(`Tenant ${asset.tenant.name} paid 1 month late for ${asset.name}.`, 'bad');
            }

            annualRent = Math.max(0, annualRent);
            user.money += annualRent;
            totalCollectedThisYear += annualRent;

            if (annualRent > 0) {
                addLog(`Collected $${annualRent.toLocaleString()} in rental income from ${asset.name}.`, 'good');
            }
        }
    });

    return totalCollectedThisYear;
}

function processTenantEvents(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant) {
            asset.tenant.leaseYears -= 1;

            if (asset.tenant.leaseYears <= 0) {
                // 70% chance tenant wants to renew for 1-3 years
                if (Math.random() < 0.70 && stateRef && stateRef.gameState) {
                    const requestedYears = Math.floor(Math.random() * 3) + 1;
                    const currentRent = asset.tenant.monthlyRent;
                    const increasedRent = Math.floor(currentRent * 1.05);

                    if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                    stateRef.gameState.pendingTenantEvents.push({
                        eventType: 'lease_expiration',
                        propertyId: asset.id,
                        propertyName: asset.name,
                        tenantId: asset.tenant.id,
                        tenantName: asset.tenant.name,
                        tenant: asset.tenant,
                        currentRent,
                        increasedRent,
                        requestedYears
                    });
                } else {
                    const expiredTenantName = asset.tenant.name;
                    asset.isRented = false;
                    asset.tenant = null;
                    addLog(`Tenant ${expiredTenantName}'s lease on ${asset.name} has expired. Property is now vacant.`, 'neutral');
                }
            } else {
                const roll = Math.random();
                if (roll < 0.15) {
                    const repairCost = Math.max(300, Math.floor(asset.value * 0.005));
                    addLog(`Tenant ${asset.tenant.name} caused property damage on ${asset.name}.`, 'bad');

                    if (stateRef && stateRef.gameState) {
                        if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                        stateRef.gameState.pendingTenantEvents.push({
                            eventType: 'damage',
                            propertyId: asset.id,
                            propertyName: asset.name,
                            tenantId: asset.tenant.id,
                            tenantName: asset.tenant.name,
                            tenant: asset.tenant,
                            conditionLoss: 10,
                            repairCost
                        });
                    }
                }
            }
        }
    });
}

function evictTenant(user, propertyId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (!property.isRented || !property.tenant) {
        return { success: false, reason: "Property has no active tenant to evict." };
    }

    const tenantName = property.tenant.name;
    property.isRented = false;
    property.tenant = null;

    return { success: true, propertyName: property.name, tenantName };
}


function calculateTotalMonthlyMortgages(user) {
    if (!user || !Array.isArray(user.assets)) return 0;
    return user.assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            return sum + (asset.mortgage.monthlyPayment || 0);
        }
        return sum;
    }, 0);
}

function canAffordMortgage(user, newMonthlyPayment) {
    const monthlyIncome = calculateUserMonthlyIncome(user);
    if (monthlyIncome <= 0) {
        return {
            allowed: false,
            ratio: 1.0,
            currentMortgages: calculateTotalMonthlyMortgages(user),
            monthlyIncome: 0,
            reason: "You need monthly income from a job or business to qualify for a mortgage."
        };
    }
    const currentMortgages = calculateTotalMonthlyMortgages(user);
    const totalMortgagePayment = currentMortgages + newMonthlyPayment;
    const ratio = totalMortgagePayment / monthlyIncome;

    if (ratio >= 0.40) {
        return {
            allowed: false,
            ratio,
            currentMortgages,
            monthlyIncome,
            reason: `Mortgage payments would take up ${(ratio * 100).toFixed(1)}% of your monthly income (Max: 40%).`
        };
    }

    return {
        allowed: true,
        ratio,
        currentMortgages,
        monthlyIncome,
        reason: "Qualified for mortgage."
    };
}

function processMortgagePayments(user) {
    if (!user || !Array.isArray(user.assets)) return { totalPaid: 0, paidOff: [] };

    let totalPaidThisYear = 0;
    const paidOffProperties = [];

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            const annualRate = asset.mortgage.annualRate || 0.065;
            const monthlyRate = annualRate / 12;
            let paidForThisProperty = 0;

            for (let month = 0; month < 12; month++) {
                if (asset.mortgage.remainingBalance <= 0) break;

                const interestForMonth = asset.mortgage.remainingBalance * monthlyRate;
                const payoffAmount = asset.mortgage.remainingBalance + interestForMonth;
                let paymentThisMonth = asset.mortgage.monthlyPayment;

                if (payoffAmount <= paymentThisMonth) {
                    paymentThisMonth = Math.round(payoffAmount);
                    asset.mortgage.remainingBalance = 0;
                    paidForThisProperty += paymentThisMonth;
                    break;
                } else {
                    const principalThisMonth = paymentThisMonth - interestForMonth;
                    asset.mortgage.remainingBalance -= principalThisMonth;
                    paidForThisProperty += paymentThisMonth;
                }
            }

            asset.mortgage.remainingBalance = Math.max(0, Math.round(asset.mortgage.remainingBalance));
            user.money -= Math.round(paidForThisProperty);
            totalPaidThisYear += Math.round(paidForThisProperty);

            if (asset.mortgage.remainingBalance <= 0) {
                paidOffProperties.push(asset.name);
                asset.mortgage = null;
            }
        }
    });

    return { totalPaid: totalPaidThisYear, paidOff: paidOffProperties };
}

function calculatePropertyMonthlyOutflow(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            return sum + asset.mortgage.monthlyPayment;
        }
        return 0;
    }, 0);
}

function updateOwnedProperties(user) {
    if (!user || !Array.isArray(user.assets)) return;

    user.assets.forEach(asset => {
        if (asset.category === 'property') {
            if (asset.condition === undefined) asset.condition = 100;
            if (asset.maxCondition === undefined) asset.maxCondition = 100;

            const decay = Math.floor(Math.random() * 3) + 2; // 2-4% condition drop per year
            asset.maxCondition = Math.max(50, asset.maxCondition - 1); // 1% permanent cap degradation per year
            asset.condition = Math.max(0, Math.min(asset.maxCondition, asset.condition - decay));

            // Value impact based on condition
            let multiplier = 1.03; // Standard 3% appreciation
            if (asset.condition < 25) {
                multiplier = 0.92; // 8% depreciation if severe disrepair
            } else if (asset.condition < 50) {
                multiplier = 0.97; // 3% depreciation if poor condition
            } else if (asset.condition < 80) {
                multiplier = 1.01; // Slower 1% appreciation if fair condition
            }

            asset.value = Math.max(10000, Math.floor(asset.value * multiplier));

            if (asset.condition < 20 && asset.condition + decay >= 20) {
                addLog(`URGENT: Your ${asset.name} is in severe disrepair (${asset.condition}% condition)!`, 'bad');
            }
        }
    });
}

function calculateMaintenanceCost(property) {
    if (!property || !property.value) return 0;
    return Math.max(250, Math.floor(property.value * 0.0075));
}

function performPropertyMaintenance(user, propertyId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    if (property.condition >= property.maxCondition) {
        return { success: false, reason: "Property is already in peak maintained condition." };
    }

    const cost = calculateMaintenanceCost(property);
    if (user.money < cost) {
        return { success: false, reason: `Insufficient funds. Routine maintenance costs $${cost.toLocaleString()}.` };
    }

    user.money -= cost;
    property.condition = property.maxCondition;

    return { success: true, cost, restoredCondition: property.condition, maxCondition: property.maxCondition, propertyName: property.name };
}

function calculateRenovationOptions(property) {
    if (!property || !property.value) return [];
    const val = property.value;

    return [
        {
            id: 'minor',
            name: 'Minor Cosmetic Refresh',
            cost: Math.floor(val * 0.03),
            condGain: 20,
            maxCondGain: 10,
            valueBoostRatio: 0.04,
            desc: 'Fresh interior paint, minor repairs, and updated lighting fixtures.'
        },
        {
            id: 'major',
            name: 'Major Interior Remodel',
            cost: Math.floor(val * 0.08),
            condGain: 50,
            maxCondGain: 25,
            valueBoostRatio: 0.12,
            desc: 'Modernized kitchen, upgraded bathrooms, and premium flooring.'
        },
        {
            id: 'full',
            name: 'Full Gut Renovation',
            cost: Math.floor(val * 0.18),
            condGain: 100,
            maxCondGain: 100,
            valueBoostRatio: 0.25,
            desc: 'Complete structural overhaul, luxury high-end finishes, and full system upgrades.'
        }
    ];
}

function renovateProperty(user, propertyId, optionId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    const options = calculateRenovationOptions(property);
    const selectedOption = options.find(o => o.id === optionId);
    if (!selectedOption) return { success: false, reason: "Invalid renovation option selected." };

    if (user.money < selectedOption.cost) {
        return { success: false, reason: `Insufficient funds. ${selectedOption.name} costs $${selectedOption.cost.toLocaleString()}.` };
    }

    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    user.money -= selectedOption.cost;

    if (selectedOption.id === 'full') {
        property.maxCondition = 100;
        property.condition = 100;
    } else {
        property.maxCondition = Math.min(100, property.maxCondition + selectedOption.maxCondGain);
        property.condition = Math.min(property.maxCondition, property.condition + selectedOption.condGain);
    }

    const valueIncrease = Math.floor(property.value * selectedOption.valueBoostRatio);
    property.value += valueIncrease;

    return {
        success: true,
        cost: selectedOption.cost,
        optionName: selectedOption.name,
        propertyName: property.name,
        newCondition: property.condition,
        newMaxCondition: property.maxCondition,
        newValue: property.value,
        valueIncrease
    };
}

function calculatePropertySaleTiers(property) {
    if (!property || !property.value) return [];
    const val = property.value;

    return [
        {
            id: 'below',
            name: 'Below Market Value',
            price: Math.floor(val * 0.85),
            chance: 0.95,
            desc: 'Discounted pricing to attract fast, eager buyers.'
        },
        {
            id: 'slightly_below',
            name: 'Slightly Below Market Value',
            price: Math.floor(val * 0.95),
            chance: 0.85,
            desc: 'Competitive price for a quick and reliable sale.'
        },
        {
            id: 'at_market',
            name: 'At Market Value',
            price: val,
            chance: 0.70,
            desc: 'Accurately priced according to current market comps.'
        },
        {
            id: 'slightly_above',
            name: 'Slightly Above Market Value',
            price: Math.floor(val * 1.08),
            chance: 0.45,
            desc: 'Targeted at interested buyers willing to pay extra.'
        },
        {
            id: 'above',
            name: 'Above Market Value',
            price: Math.floor(val * 1.18),
            chance: 0.25,
            desc: 'Premium pricing aimed at maximizing total profit.'
        }
    ];
}

function generatePropertyBuyerOffer(property, tierId) {
    if (!property || !property.value) return { hasOffer: false };
    const tiers = calculatePropertySaleTiers(property);
    const selectedTier = tiers.find(t => t.id === tierId) || tiers[2];

    const roll = Math.random();
    if (roll > selectedTier.chance) {
        return { hasOffer: false, tierName: selectedTier.name, listPrice: selectedTier.price };
    }

    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const buyerName = `${getRandomFirstName(gender)} ${getLastName()}`;
    const buyerAge = Math.floor(Math.random() * 30) + 28;
    const seed = `buyer_${property.id}_${Date.now()}_${Math.random()}`;
    const appearance = AvatarLogic.generateRandomAppearance(seed, gender);

    const buyer = {
        name: buyerName,
        gender,
        age: buyerAge,
        appearance
    };

    const offerAmount = selectedTier.price;
    const remainingMortgage = (property.mortgage && property.mortgage.remainingBalance > 0) ? property.mortgage.remainingBalance : 0;
    const netProceeds = Math.max(0, offerAmount - remainingMortgage);

    return {
        hasOffer: true,
        buyer,
        offerAmount,
        remainingMortgage,
        netProceeds,
        tierName: selectedTier.name
    };
}

function completePropertySale(user, propertyId, offerAmount) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    const index = user.assets.findIndex(a => a.id === propertyId);
    if (index === -1) return { success: false, reason: "Property not found." };

    const property = user.assets[index];
    const remainingMortgage = (property.mortgage && property.mortgage.remainingBalance > 0) ? property.mortgage.remainingBalance : 0;
    const netProceeds = offerAmount - remainingMortgage;

    user.money += netProceeds;
    user.assets.splice(index, 1);

    return {
        success: true,
        propertyName: property.name,
        offerAmount,
        remainingMortgage,
        netProceeds
    };
}

export const GameLogic = {
    sanitizeName,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    checkLifeStatus,
    getVehicleIcon,
    simulateVehicleMarket,
    updateOwnedVehicles,
    checkMortality,
    calculateHealthDecay,
    compressLifeLog,
    calculateHealthBenefits,
    calculateActiveHealthCosts,
    calculateChildMonthlyOutflow,
    calculateMedicalVisit,
    calculateOneTimeGymVisit,
    getDeck,
    calculateBlackjackHand,
    determineBlackjackOutcome,
    calculateTripOutcome,
    calculateRelationshipDecay,
    checkRelationshipCategoryShift,
    isHostile,
    getAvailableInteractions,
    isInteractionBlocked,
    calculateInheritance,
    calculateSpousalLifeInsurance,
    generateSchoolCohort,
    generateStranger,
    backfillRelationshipGender,
    attemptBefriend,
    calculateProposalAcceptance,
    calculatePregnancyChance,
    calculatePromotionChance,
    getRandomFirstName,
    getLastName,
    getFirstName,
    calculateNameChangeAcceptance,
    canProcessBusinessQuarter,
    recordBusinessQuarterProcessed,
    getRemainingQuartersForAge,
    calculateAutoQuarterCount,
    resetBusinessQuarterTracking,
    inheritFamilyRelationships,
    CITY_COST_OF_LIVING,
    PROPERTIES_FOR_SALE,
    getPropertyIcon,
    calculateMonthlyMortgage,
    calculateUserMonthlyIncome,
    calculateTotalMonthlyMortgages,
    canAffordMortgage,
    processMortgagePayments,
    calculatePropertyMonthlyOutflow,
    updateOwnedProperties,
    calculateMaintenanceCost,
    performPropertyMaintenance,
    calculateRenovationOptions,
    renovateProperty,
    calculateTotalRentalIncome,
    generateTenantApplicants,
    acceptTenantLease,
    processRentalIncome,
    processTenantEvents,
    evictTenant,
    calculatePropertySaleTiers,
    generatePropertyBuyerOffer,
    completePropertySale
};



