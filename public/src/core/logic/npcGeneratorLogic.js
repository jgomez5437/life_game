import { AvatarLogic } from '../avatarLogic.js';
import { calculateScaledSalary } from './playerStatsLogic.js';
import {
    NPC_MAJORS,
    NPC_CAREER_TRACKS,
    LUXURY_TITLE_TO_TRACK,
    isCloseRelationship,
    repairNPCOccupationMetadata,
    generateNPCOccupation,
    enrollNPCInUniversity,
    progressNPCOccupation,
    calculateSpousalIncomeContribution
} from './npcOccupationLogic.js';

export {
    NPC_MAJORS,
    NPC_CAREER_TRACKS,
    LUXURY_TITLE_TO_TRACK,
    isCloseRelationship,
    repairNPCOccupationMetadata,
    generateNPCOccupation,
    enrollNPCInUniversity,
    progressNPCOccupation,
    calculateSpousalIncomeContribution
};

export const FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'];
export const FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'];
export const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

/**
 * Returns a random first name for the given gender.
 * @param {string} gender - 'male' or 'female'
 * @param {number} [roll=Math.random()] - Injected randomness for pure unit testing.
 * @returns {string}
 */
export function getRandomFirstName(gender, roll = Math.random()) {
    const pool = gender === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    return pool[Math.floor(roll * pool.length)];
}

export function getRandomLastName(roll = Math.random()) {
    return LAST_NAMES[Math.floor(roll * LAST_NAMES.length)];
}

/**
 * Extracts the last word of a full name, treated as the surname.
 * @param {string} fullName
 * @returns {string}
 */
export function getLastName(fullName) {
    if (!fullName) return getRandomLastName();
    const parts = (fullName || '').trim().split(' ');
    return parts[parts.length - 1] || getRandomLastName();
}

/**
 * Extracts everything but the last word of a full name, treated as the given name(s).
 * @param {string} fullName
 * @returns {string}
 */
export function getFirstName(fullName) {
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
export function calculateNameChangeAcceptance(status, roll = Math.random()) {
    return roll < (status / 100);
}

/**
 * Generates a cohort of classmates and one teacher based on the user's age.
 * @param {number} userAge 
 * @returns {Array} Array of relationship objects
 */
export function generateSchoolCohort(userAge, city = null) {
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
        const age = Math.floor(Math.random() * (classmateAgeMax - classmateAgeMin + 1)) + classmateAgeMin;
        const occupationInfo = generateNPCOccupation(age, city);
        cohort.push({
            id,
            name: `${first} ${last}`,
            age,
            type: 'Classmate',
            gender,
            status: Math.floor(Math.random() * 31) + 20, // 20 to 50 starting status
            category: 'classmate',
            isCurrentClassmate: true,
            interactedThisYear: false,
            appearance: AvatarLogic.generateRandomAppearance(id, gender),
            ...occupationInfo
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
        appearance: AvatarLogic.generateRandomAppearance(teacherId, teacherGender),
        occupation: "Teacher",
        occupationType: "job",
        income: city ? calculateScaledSalary(50000, city) : 50000,
        careerTrack: "education_track",
        careerLevel: 0
    });

    return cohort;
}

/**
 * Generates a replacement teacher when a teacher passes away while player is in school.
 * @param {number} userAge 
 * @returns {object} Relationship object for the replacement teacher
 */
export function generateReplacementTeacher(userAge) {
    const teacherGender = Math.random() < 0.5 ? 'male' : 'female';
    const lastTeacher = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = teacherGender === 'male' ? 'Mr.' : (Math.random() > 0.5 ? 'Ms.' : 'Mrs.');
    const teacherId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    return {
        id: teacherId,
        name: `${title} ${lastTeacher}`,
        age: Math.floor(Math.random() * 37) + 24, // 24 to 60
        type: 'Teacher',
        gender: teacherGender,
        status: 30, // Default base starting status
        category: 'classmate',
        isCurrentClassmate: true,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(teacherId, teacherGender),
        occupation: "Teacher",
        occupationType: "job",
        income: 50000,
        careerTrack: "education_track",
        careerLevel: 0
    };
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
export function determineNPCGender(userGender, attractionPreference) {
    if (attractionPreference === 'men' || attractionPreference === 'male') return 'male';
    if (attractionPreference === 'women' || attractionPreference === 'female') return 'female';
    if (attractionPreference === 'everyone' || attractionPreference === 'all') return Math.random() < 0.5 ? 'male' : 'female';
    return userGender === 'male' ? 'female' : 'male';
}

export const DATING_APP_BIOS = [
    "Looking for someone to explore local coffee spots with ☕",
    "Passionate traveler, foodie, and dog lover ✈️🐶",
    "Fitness enthusiast by day, movie buff by night 🎬💪",
    "Always looking for good music, banter, and road trips 🎵🚗",
    "Self-proclaimed chef & professional amateur photographer 🎨📷",
    "Looking for a partner in crime for weekend adventures 🌟",
    "Hobbyist gamer, coffee addict, and bookworm 📖☕",
    "Life is short - let's grab drinks and see where it goes 🥂"
];

export const DATING_APP_HOBBIES = [
    "Coffee", "Travel", "Fitness", "Hiking", "Photography", "Gaming",
    "Cooking", "Movies", "Music", "Art", "Reading", "Dogs", "Cats", "Concerts"
];

export function generateDatingProfiles(user, count = 3) {
    const userAge = user.age || 18;
    const userGender = user.gender || 'male';
    const preference = user.attractionPreference || (userGender === 'male' ? 'women' : 'men');

    const profiles = [];
    for (let i = 0; i < count; i++) {
        const gender = determineNPCGender(userGender, preference);
        const minAge = Math.max(18, userAge - 3);
        const maxAge = userAge + 4;
        const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
        const first = getRandomFirstName(gender);
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'date_profile_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6);
        const occInfo = generateNPCOccupation(age, user?.city || null);

        const shuffledHobbies = [...DATING_APP_HOBBIES].sort(() => Math.random() - 0.5);
        const hobbies = shuffledHobbies.slice(0, 2);
        const bio = DATING_APP_BIOS[Math.floor(Math.random() * DATING_APP_BIOS.length)];

        profiles.push({
            id,
            name: `${first} ${last}`,
            age,
            gender,
            ...occInfo,
            occupation: occInfo.occupation || 'Unemployed',
            appearance: AvatarLogic.generateRandomAppearance(id, gender),
            bio,
            hobbies,
            matchChance: 0.75
        });
    }
    return profiles;
}

export const LUXURY_AGE_PRESETS = {
    '18-25': { min: 18, max: 25 },
    '26-35': { min: 26, max: 35 },
    '36-45': { min: 36, max: 45 },
    '46-60': { min: 46, max: 60 },
    '60+':   { min: 61, max: 80 }
};

export const LUXURY_CAREERS = {
    high_earner: [
        { title: 'Senior Software Engineer', salaryRange: [120000, 180000] },
        { title: 'Attending Physician', salaryRange: [180000, 240000] },
        { title: 'Associate Attorney', salaryRange: [130000, 200000] },
        { title: 'VP of Banking', salaryRange: [150000, 250000] },
        { title: 'Creative Director', salaryRange: [130000, 210000] },
        { title: 'Director of Nursing', salaryRange: [120000, 170000] }
    ],
    wealthy: [
        { title: 'Managing Partner (Law)', salaryRange: [280000, 450000] },
        { title: 'Chief of Medicine', salaryRange: [320000, 500000] },
        { title: 'Chief Banking Officer', salaryRange: [300000, 480000] },
        { title: 'Engineering Director', salaryRange: [250000, 420000] },
        { title: 'Executive VP of Logistics', salaryRange: [260000, 400000] }
    ],
    ultra_wealthy: [
        { title: 'Hedge Fund Manager', salaryRange: [750000, 2500000] },
        { title: 'Tech Founder & CEO', salaryRange: [800000, 3000000] },
        { title: 'Private Equity Managing Director', salaryRange: [900000, 2200000] },
        { title: 'Commercial Real Estate Tycoon', salaryRange: [650000, 1800000] },
        { title: 'Supermodel & Fashion Icon', salaryRange: [600000, 1500000] },
        { title: 'A-List Movie Producer', salaryRange: [850000, 2800000] }
    ]
};

export function generateLuxuryMatch(user, { agePreset = '26-35', wealthTier = 'wealthy', genderPreference = null } = {}) {
    const userGender = user.gender || 'male';
    const preference = genderPreference || user.attractionPreference || (userGender === 'male' ? 'women' : 'men');
    const gender = determineNPCGender(userGender, preference);

    const preset = LUXURY_AGE_PRESETS[agePreset] || LUXURY_AGE_PRESETS['26-35'];
    const age = preset.min + Math.floor(Math.random() * (preset.max - preset.min + 1));

    const tierKey = LUXURY_CAREERS[wealthTier] ? wealthTier : 'wealthy';
    const careerPool = LUXURY_CAREERS[tierKey];
    const chosenCareer = careerPool[Math.floor(Math.random() * careerPool.length)];
    const trackMeta = LUXURY_TITLE_TO_TRACK[chosenCareer.title] || null;

    let baseSalary = Math.floor(Math.random() * (chosenCareer.salaryRange[1] - chosenCareer.salaryRange[0] + 1)) + chosenCareer.salaryRange[0];
    if (user.city) {
        baseSalary = calculateScaledSalary(baseSalary, user.city);
    }

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'luxe_rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const netWorthRanges = {
        ultra_wealthy: [5500000, 25000000],
        wealthy: [2000000, 6000000],
        high_earner: [500000, 2000000]
    };
    const [nwMin, nwMax] = netWorthRanges[tierKey] || netWorthRanges.wealthy;
    const netWorth = Math.floor(Math.random() * (nwMax - nwMin + 1)) + nwMin;

    return {
        id,
        name: `${first} ${last}`,
        age,
        gender,
        type: 'Crush',
        status: Math.floor(Math.random() * 21) + 65, // 65 to 85 starting status (high chemistry guaranteed)
        category: 'friend',
        occupation: chosenCareer.title,
        occupationType: 'job',
        ...(trackMeta ? { careerTrack: trackMeta.careerTrack, careerLevel: trackMeta.careerLevel } : {}),
        income: baseSalary,
        wealthTier: tierKey,
        netWorth,
        educationLevel: 'University',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

export function generateTargetedStranger(user, categoryPreference = 'friend') {
    const userAge = typeof user === 'number' ? user : (user.age || 18);
    const userGender = typeof user === 'number' ? 'male' : (user.gender || 'male');
    const attractionPref = typeof user === 'object' ? user.attractionPreference : null;
    const userCity = typeof user === 'object' ? (user.city || null) : null;

    let gender;
    if (categoryPreference === 'romantic' || categoryPreference === 'date') {
        gender = determineNPCGender(userGender, attractionPref);
    } else {
        gender = Math.random() < 0.5 ? 'male' : 'female';
    }

    const minAge = Math.max(16, userAge - 3);
    const maxAge = Math.max(minAge, userAge + 4);
    const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const occupationInfo = generateNPCOccupation(age, userCity);

    const isRomantic = categoryPreference === 'romantic' || categoryPreference === 'date';
    return {
        id,
        name: `${first} ${last}`,
        age,
        type: isRomantic ? 'Crush' : 'Friend',
        gender,
        status: isRomantic ? Math.floor(Math.random() * 21) + 40 : Math.floor(Math.random() * 21) + 30,
        category: 'friend',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender),
        ...occupationInfo
    };
}

export function generateStranger(userAge, userGender, roll = Math.random()) {
    const gender = userGender === 'male' ? 'female' : 'male';
    const minAge = Math.max(18, userAge - 3);
    const maxAge = Math.max(minAge, userAge + 5);
    const age = minAge + Math.floor(roll * (maxAge - minAge + 1));

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const occupationInfo = generateNPCOccupation(age);

    return {
        id,
        name: `${first} ${last}`,
        age,
        type: 'Friend',
        gender,
        status: Math.floor(Math.random() * 21) + 20, // 20 to 40 starting status
        category: 'friend',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender),
        ...occupationInfo
    };
}

/**
 * Backfills a missing `gender` on legacy relationship records (saves that
 * predate the romance system) so they aren't permanently invisible to
 * gender-gated interactions like Ask Out. Mutates entries in place.
 * @param {Array} relationships
 * @returns {Array} the same array
 */
export function backfillRelationshipGender(relationships) {
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
export function attemptBefriend(status, isTeacher, roll = Math.random()) {
    // Base chance depends on status. e.g. status 50 = 50% chance.
    let chance = status / 100;

    // It's harder for teachers
    if (isTeacher) {
        chance *= 0.5; // Half as likely
    }

    return roll < chance;
}

