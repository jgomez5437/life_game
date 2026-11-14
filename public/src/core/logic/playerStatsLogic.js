export function sanitizeName(rawInput) {
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

export function sanitizeBusinessName(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
        return { isValid: false, error: "Company name cannot be empty." };
    }

    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');

    if (cleanedName.length < 2) {
        return { isValid: false, error: "Company name must be at least 2 characters long." };
    }

    if (cleanedName.length > 35) {
        return { isValid: false, error: "Keep the company name to 35 characters or less." };
    }

    const validFormatRegex = /^[A-Za-z0-9][A-Za-z0-9 .,'&,-]*$/;

    if (!validFormatRegex.test(cleanedName)) {
        return { isValid: false, error: "Company name can only contain letters, numbers, spaces, and standard punctuation (., &, -, ')." };
    }

    return { isValid: true, cleanedName };
}

export function clampStat(val, fallback = 50) {
    const num = typeof val === 'number' && !isNaN(val) ? val : fallback;
    return Math.max(0, Math.min(100, Math.round(num)));
}

export function setStat(user, statName, value) {
    if (!user || typeof statName !== 'string') return 0;
    const fallback = (statName === 'health' || statName === 'happiness') ? 100 : 50;
    const clamped = clampStat(value, fallback);
    user[statName] = clamped;
    if (user.stats && typeof user.stats === 'object') {
        user.stats[statName] = clamped;
    }
    return clamped;
}

export function adjustStat(user, statName, delta) {
    if (!user || typeof statName !== 'string' || typeof delta !== 'number' || isNaN(delta)) return 0;
    const fallback = (statName === 'health' || statName === 'happiness') ? 100 : 50;
    const current = typeof user[statName] === 'number' && !isNaN(user[statName])
        ? user[statName]
        : (user.stats && typeof user.stats[statName] === 'number' && !isNaN(user.stats[statName]) ? user.stats[statName] : fallback);
    const nextVal = clampStat(current + delta, fallback);
    user[statName] = nextVal;
    if (user.stats && typeof user.stats === 'object') {
        user.stats[statName] = nextVal;
    }
    return nextVal - current;
}

export function isAlive(user) {
    if (!user) return false;
    if (user.lifeStatus === 'Deceased' || user.isDead === true || user.isAlive === false) return false;
    if ((typeof user.deathCause === 'string' && user.deathCause.trim() !== '') || (typeof user.deathAge === 'number' && user.deathAge >= 0)) return false;
    const health = user.health ?? user.stats?.health ?? 100;
    return typeof health === 'number' && !isNaN(health) && health > 0;
}

export function generateRandomStats() {
    return {
        health: 100,
        happiness: 100,
        smarts: Math.floor(Math.random() * 56) + 40,
        looks: Math.floor(Math.random() * 56) + 40
    };
}

export function calculateSmartsDelta(age, isStudent) {
    if (isStudent && age <= 18) {
        return Math.floor(Math.random() * 3) + 1;
    }
    return 0;
}

export function calculateLooksDelta(age) {
    if (age > 45) {
        return Math.random() < 0.6 ? -(Math.floor(Math.random() * 2) + 1) : 0;
    }
    return 0;
}

export const CITY_COST_OF_LIVING = {
    'San Francisco': 33000,
    'New York': 30000,
    'Los Angeles': 30000,
    'Chicago': 27000,
    'Houston': 18000,
    'Miami': 24000,
    'Tucson': 18000,
    'London': 30000,
    'Manchester': 24000,
    'Edinburgh': 24000,
    'Tokyo': 30000,
    'Osaka': 24000,
    'Kyoto': 22000,
    'Berlin': 21000,
    'Munich': 25000,
    'Frankfurt': 25000,
    'Paris': 30000,
    'Lyon': 22000,
    'Marseille': 21000,
    'Madrid': 21000,
    'Barcelona': 23000,
    'Rome': 24000,
    'Milan': 26000,
    'Venice': 23000,
    'Toronto': 24000,
    'Vancouver': 26000,
    'Montreal': 21000,
    'Mexico City': 15000,
    'Guadalajara': 14000,
    'Beijing': 21000,
    'Shanghai': 24000,
    'Shenzhen': 23000,
    'Seoul': 25000,
    'Busan': 20000,
    'Sydney': 28000,
    'Melbourne': 26000,
    'Brisbane': 23000,
    'Mumbai': 14000,
    'New Delhi': 14000,
    'Bengaluru': 15000,
    'Rio de Janeiro': 16000,
    'São Paulo': 17000,
    'Cape Town': 16000,
    'Johannesburg': 15000,
    'Dubai': 30000,
    'Abu Dhabi': 28000,
    'Singapore': 32000,
    'Stockholm': 26000,
    'Bandar Seri Begawan': 15000,
    'Cairo': 15000,
    'Buenos Aires': 14000
};

export function addLivingExpenses(age, currentlyStudent, city) {
    if (age >= 19 && !currentlyStudent) {
        return CITY_COST_OF_LIVING[city] || 24000;
    }
    return 0;
}

export function getCityCostMultiplier(city) {
    const livingCost = CITY_COST_OF_LIVING[city] || 24000;
    return livingCost / 24000;
}

export function calculateScaledSalary(baseSalary, city) {
    if (!baseSalary || typeof baseSalary !== 'number') return 0;
    const mult = getCityCostMultiplier(city);
    return Math.round(baseSalary * mult);
}

export function calculateBirthdayMoney() {
    return Math.floor(Math.random() * 71) + 10;
}


export function generateLifeSuggestions(user) {
    if (!user) return [];

    const suggestions = [];

    // 1. Health & Diet
    if (user.health < 40) {
        suggestions.push({
            category: 'Health Alert',
            icon: 'fa-heart-crack text-red-400',
            title: 'Critical Health Warning',
            desc: `Your health is at ${user.health}%. Visit the doctor immediately or upgrade your diet to prevent sudden life complications.`
        });
    } else if (user.health < 75) {
        suggestions.push({
            category: 'Health & Wellness',
            icon: 'fa-apple-alt text-green-400',
            title: 'Upgrade Your Diet & Fitness',
            desc: 'Starting a Mediterranean or Keto diet along with regular gym workouts will boost your longevity.'
        });
    } else {
        suggestions.push({
            category: 'Health & Fitness',
            icon: 'fa-dumbbell text-emerald-400',
            title: 'Peak Physical Condition',
            desc: 'Your health is in top shape! Maintain your current routine to preserve maximum energy.'
        });
    }

    // 2. Career & Education
    if (!user.jobTitle && user.age >= 18 && !user.isStudent) {
        suggestions.push({
            category: 'Career Aspiration',
            icon: 'fa-briefcase text-amber-400',
            title: 'Seek Employment',
            desc: 'You are currently unemployed. Visit the Occupations tab to apply for a job or enroll in University.'
        });
    } else if (user.jobPerformance >= 80) {
        suggestions.push({
            category: 'Career Growth',
            icon: 'fa-chart-line text-blue-400',
            title: 'High Work Performance',
            desc: `Your performance at ${user.jobTitle || 'work'} is outstanding (${user.jobPerformance}%). Keep it up for annual raises and promotion opportunities.`
        });
    } else if (user.jobPerformance < 40 && user.jobTitle) {
        suggestions.push({
            category: 'Work Warning',
            icon: 'fa-triangle-exclamation text-yellow-400',
            title: 'Workplace Risk',
            desc: `Your job performance is low (${user.jobPerformance}%). Work harder or spend time developing career skills to avoid being fired.`
        });
    } else {
        suggestions.push({
            category: 'Personal Development',
            icon: 'fa-graduation-cap text-indigo-400',
            title: 'Continuous Learning',
            desc: 'Enhance your skills or take night classes to qualify for higher-paying executive roles.'
        });
    }

    // 3. Financial & Wealth
    if (user.money > 50000) {
        suggestions.push({
            category: 'Wealth & Assets',
            icon: 'fa-building text-cyan-400',
            title: 'Invest Surplus Capital',
            desc: 'You have significant cash savings! Consider purchasing rental properties, luxury vehicles, or fine jewelry.'
        });
    } else if (user.money < 1000 && user.age >= 18) {
        suggestions.push({
            category: 'Financial Advice',
            icon: 'fa-piggy-bank text-rose-400',
            title: 'Build an Emergency Fund',
            desc: 'Your cash balance is low. Reduce unnecessary luxury expenses and focus on building liquid savings.'
        });
    } else {
        suggestions.push({
            category: 'Financial Planning',
            icon: 'fa-wallet text-teal-400',
            title: 'Balanced Budgeting',
            desc: 'Monitor your monthly outflows (mortgages, loans, gym, and diet costs) to maintain a healthy savings rate.'
        });
    }

    // 4. Social & Relationships
    const relationships = user.relationships || [];
    const spouse = relationships.find(r => r.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(r.type));
    const fiancé = relationships.find(r => ['Fiancé', 'Fiancée', 'Fiance'].includes(r.type));
    const partner = relationships.find(r => r.category === 'partner' && !['Fiancé', 'Fiancée', 'Fiance'].includes(r.type));

    if (spouse) {
        const hasChildren = relationships.some(r => r.category === 'child' || r.type === 'Son' || r.type === 'Daughter');
        if (!hasChildren && !user.isExpecting && user.age >= 18 && user.age < 45) {
            suggestions.push({
                category: 'Romance & Family',
                icon: 'fa-baby text-pink-400',
                title: 'Start a Family',
                desc: `You are married to ${spouse.name}. Select 'Try for a Baby' on their profile in Social to start a family.`
            });
        } else {
            suggestions.push({
                category: 'Romance & Family',
                icon: 'fa-heart text-pink-400',
                title: 'Nurture Your Marriage',
                desc: `Spend quality time or go on dates with your spouse ${spouse.name} to keep your bond strong.`
            });
        }
    } else if (fiancé) {
        suggestions.push({
            category: 'Romance & Family',
            icon: 'fa-ring text-pink-400',
            title: 'Plan Your Wedding',
            desc: `You are engaged to ${fiancé.name}! Tap 'Plan Wedding' on their profile in Social to get married.`
        });
    } else if (partner && partner.status >= 70) {
        suggestions.push({
            category: 'Romance & Future',
            icon: 'fa-ring text-yellow-400',
            title: `Take Next Step with ${partner.name}`,
            desc: `Your relationship with ${partner.name} is exceptional (${partner.status}%). Consider buying an engagement ring and proposing!`
        });
    } else if (!partner && user.age >= 18) {
        suggestions.push({
            category: 'Social Life',
            icon: 'fa-users text-purple-400',
            title: 'Expand Social Network',
            desc: 'Go out to meet new people or spend time with friends to boost your happiness stat.'
        });
    } else {
        suggestions.push({
            category: 'Relationships',
            icon: 'fa-handshake text-orange-400',
            title: 'Nurture Connections',
            desc: 'Regularly interact with family members and close friends to keep relationship meters at 100%.'
        });
    }

    return suggestions;
}


// ==========================================
// Random Life Event Helpers
// ==========================================

export function calculateFightOutcome(userSmarts, userHealth, opponentSmarts, opponentHealth) {
    // Determine winner based on a mix of health and smarts, with randomness
    const userScore = (userHealth * 0.7) + (userSmarts * 0.3) + (Math.random() * 40);
    const opponentScore = (opponentHealth * 0.7) + (opponentSmarts * 0.3) + (Math.random() * 40);
    
    return userScore >= opponentScore; // true if user wins
}

export function calculatePeerPressureOutcome(userSmarts, choiceRiskLevel) {
    // choiceRiskLevel is 1 to 10
    const resistance = userSmarts + (Math.random() * 50);
    const threshold = choiceRiskLevel * 10;
    return resistance >= threshold;
}

export function calculateTripSatisfaction(parentRelationshipStatus, baseTripQuality) {
    // Mix relationship and trip quality
    const satisfaction = (parentRelationshipStatus * 0.4) + (baseTripQuality * 0.6) + (Math.random() * 20 - 10);
    return Math.min(100, Math.max(0, satisfaction));
}
