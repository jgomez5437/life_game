import { AvatarLogic } from '../avatarLogic.js';
import { calculateScaledSalary } from './playerStatsLogic.js';

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
export function generateSchoolCohort(userAge) {
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
        const occupationInfo = generateNPCOccupation(age);
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
        income: 50000,
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
        const occInfo = generateNPCOccupation(age);

        const shuffledHobbies = [...DATING_APP_HOBBIES].sort(() => Math.random() - 0.5);
        const hobbies = shuffledHobbies.slice(0, 2);
        const bio = DATING_APP_BIOS[Math.floor(Math.random() * DATING_APP_BIOS.length)];

        profiles.push({
            id,
            name: `${first} ${last}`,
            age,
            gender,
            occupation: occInfo.occupation || 'Single',
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

    let baseSalary = Math.floor(Math.random() * (chosenCareer.salaryRange[1] - chosenCareer.salaryRange[0] + 1)) + chosenCareer.salaryRange[0];
    if (user.city) {
        baseSalary = calculateScaledSalary(baseSalary, user.city);
    }

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'luxe_rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

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
        income: baseSalary,
        educationLevel: 'University',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

export function generateTargetedStranger(user, categoryPreference = 'friend') {
    const userAge = typeof user === 'number' ? user : (user.age || 18);
    const userGender = typeof user === 'number' ? 'male' : (user.gender || 'male');
    const attractionPref = typeof user === 'object' ? user.attractionPreference : null;

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
    const occupationInfo = generateNPCOccupation(age);

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

export const NPC_MAJORS = [
    "Psychology", "Computer Science", "English", "Education", "Marketing",
    "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
    "Political Science", "Criminal Justice", "Communications", "Pharmacy"
];

export const NPC_CAREER_TRACKS = [
    {
        key: 'retail', majors: ['Marketing', 'Business', 'Communications'],
        levels: [
            { title: 'Cashier', salary: 28000 },
            { title: 'Sales Associate', salary: 34000 },
            { title: 'Team Lead', salary: 45000 },
            { title: 'Store Manager', salary: 65000 },
            { title: 'District Manager', salary: 100000 }
        ]
    },
    {
        key: 'food_service', majors: [],
        levels: [
            { title: 'Line Cook', salary: 30000 },
            { title: 'Cook', salary: 38000 },
            { title: 'Sous Chef', salary: 52000 },
            { title: 'Head Chef', salary: 75000 },
            { title: 'Executive Chef', salary: 95000 }
        ]
    },
    {
        key: 'trades', majors: [],
        levels: [
            { title: 'Trade Helper', salary: 32000 },
            { title: 'Apprentice', salary: 42000 },
            { title: 'Journeyman', salary: 60000 },
            { title: 'Foreman', salary: 78000 },
            { title: 'Master Tradesperson', salary: 100000 }
        ]
    },
    {
        key: 'law_enforcement', majors: ['Criminal Justice'],
        levels: [
            { title: 'Patrol Officer', salary: 55000 },
            { title: 'Detective', salary: 70000 },
            { title: 'Sergeant', salary: 85000 },
            { title: 'Lieutenant', salary: 100000 },
            { title: 'Police Captain', salary: 120000 }
        ]
    },
    {
        key: 'fire_service', majors: [],
        levels: [
            { title: 'Firefighter', salary: 48000 },
            { title: 'Driver/Engineer', salary: 62000 },
            { title: 'Fire Lieutenant', salary: 76000 },
            { title: 'Fire Captain', salary: 90000 },
            { title: 'Fire Chief', salary: 105000 }
        ]
    },
    {
        key: 'logistics', majors: ['Business'],
        levels: [
            { title: 'Delivery Driver', salary: 35000 },
            { title: 'Senior Driver', salary: 45000 },
            { title: 'Dispatch Coordinator', salary: 60000 },
            { title: 'Logistics Manager', salary: 82000 },
            { title: 'VP of Logistics', salary: 110000 }
        ]
    },
    {
        key: 'software_eng', majors: ['Computer Science'],
        levels: [
            { title: 'Jr. Software Developer', salary: 50000 },
            { title: 'Software Developer', salary: 72000 },
            { title: 'Senior Developer', salary: 100000 },
            { title: 'Lead Engineer', salary: 135000 },
            { title: 'Engineering Director', salary: 175000 }
        ]
    },
    {
        key: 'graphic_design', majors: ['Graphic Design'],
        levels: [
            { title: 'Junior Designer', salary: 45000 },
            { title: 'Graphic Designer', salary: 58000 },
            { title: 'Senior Designer', salary: 75000 },
            { title: 'Art Director', salary: 100000 },
            { title: 'Creative Director', salary: 130000 }
        ]
    },
    {
        key: 'education_track', majors: ['Education', 'English'],
        levels: [
            { title: 'Teacher', salary: 40000 },
            { title: 'Senior Teacher', salary: 52000 },
            { title: 'Department Chair', salary: 70000 },
            { title: 'Vice Principal', salary: 90000 },
            { title: 'Principal', salary: 110000 }
        ]
    },
    {
        key: 'nursing', majors: ['Nursing', 'Biology'],
        levels: [
            { title: 'Registered Nurse', salary: 50000 },
            { title: 'Charge Nurse', salary: 65000 },
            { title: 'Nurse Manager', salary: 85000 },
            { title: 'Director of Nursing', salary: 110000 },
            { title: 'Chief Nursing Officer', salary: 150000 }
        ]
    },
    {
        key: 'banking', majors: ['Business', 'Marketing', 'Psychology'],
        levels: [
            { title: 'Bank Teller', salary: 42000 },
            { title: 'Loan Officer', salary: 55000 },
            { title: 'Branch Manager', salary: 80000 },
            { title: 'VP of Banking', salary: 120000 },
            { title: 'Chief Banking Officer', salary: 190000 }
        ]
    },
    {
        key: 'law', majors: ['Political Science'],
        levels: [
            { title: 'Law Clerk', salary: 70000 },
            { title: 'Associate Attorney', salary: 100000 },
            { title: 'Junior Partner', salary: 145000 },
            { title: 'Senior Partner', salary: 200000 },
            { title: 'Managing Partner', salary: 250000 }
        ]
    },
    {
        key: 'medicine', majors: ['Biology', 'Chemistry'],
        levels: [
            { title: 'Resident', salary: 65000 },
            { title: 'Staff Physician', salary: 120000 },
            { title: 'Attending Physician', salary: 200000 },
            { title: 'Department Head', salary: 280000 },
            { title: 'Chief of Medicine', salary: 350000 }
        ]
    }
];

export function generateNPCOccupation(age, city = null) {
    if (age === undefined || age === null) age = 18;

    if (age < 5) {
        return {
            occupation: age === 0 ? "Baby" : "Toddler",
            occupationType: 'school',
            educationLevel: 'None',
            income: 0
        };
    }
    if (age >= 5 && age <= 11) {
        return {
            occupation: "Elementary Student",
            occupationType: 'school',
            educationLevel: 'Elementary',
            income: 0
        };
    }
    if (age >= 12 && age <= 13) {
        return {
            occupation: "Middle School Student",
            occupationType: 'school',
            educationLevel: 'Middle School',
            income: 0
        };
    }
    if (age >= 14 && age <= 17) {
        return {
            occupation: "High School Student",
            occupationType: 'school',
            educationLevel: 'High School',
            schoolYear: age - 13,
            income: 0
        };
    }
    if (age >= 18 && age <= 21) {
        const roll = Math.random();
        if (roll < 0.55) {
            const major = NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)];
            return {
                occupation: `University Student (${major})`,
                occupationType: 'school',
                educationLevel: 'High School',
                schoolMajor: major,
                schoolYear: Math.max(1, age - 17),
                income: 0
            };
        } else if (roll < 0.85) {
            const entryTracks = NPC_CAREER_TRACKS.filter(t => ['retail', 'food_service', 'trades', 'logistics'].includes(t.key));
            const track = entryTracks[Math.floor(Math.random() * entryTracks.length)];
            const lvl = track.levels[0];
            const income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            return {
                occupation: lvl.title,
                occupationType: 'job',
                careerTrack: track.key,
                careerLevel: 0,
                income,
                educationLevel: 'High School'
            };
        } else {
            return {
                occupation: "Unemployed",
                occupationType: 'unemployed',
                educationLevel: 'High School',
                income: 0
            };
        }
    }
    if (age >= 22 && age <= 64) {
        const roll = Math.random();
        if (roll < 0.85) {
            const track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            let level = 0;
            if (age >= 45) {
                level = Math.floor(Math.random() * 3) + 2;
            } else if (age >= 32) {
                level = Math.floor(Math.random() * 3) + 1;
            } else {
                level = Math.floor(Math.random() * 2);
            }
            level = Math.min(level, track.levels.length - 1);
            const lvl = track.levels[level];
            const hasDegree = ['software_eng', 'graphic_design', 'education_track', 'nursing', 'banking', 'law', 'medicine'].includes(track.key);
            const major = track.majors.length > 0 ? track.majors[0] : (hasDegree ? NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)] : null);
            const income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;

            return {
                occupation: lvl.title,
                occupationType: 'job',
                careerTrack: track.key,
                careerLevel: level,
                income,
                educationLevel: hasDegree ? 'University' : 'High School',
                schoolMajor: major
            };
        } else {
            return {
                occupation: "Unemployed",
                occupationType: 'unemployed',
                educationLevel: 'High School',
                income: 0
            };
        }
    }
    // age >= 65
    const baseRetirement = Math.floor(Math.random() * 20000) + 18000;
    const income = city ? calculateScaledSalary(baseRetirement, city) : baseRetirement;
    return {
        occupation: "Retired",
        occupationType: 'retired',
        educationLevel: 'High School',
        income
    };
}

export function isCloseRelationship(person) {
    if (!person) return false;
    if (['spouse', 'partner', 'family', 'child'].includes(person.category)) return true;
    if (['Brother', 'Sister', 'Son', 'Daughter', 'Mother', 'Father', 'Boyfriend', 'Girlfriend', 'Wife', 'Husband', 'Fiancé', 'Fiancée', 'Fiance'].includes(person.type)) return true;
    return false;
}

export function progressNPCOccupation(person, userAge) {
    if (!person) return null;

    if (!person.occupation) {
        Object.assign(person, generateNPCOccupation(person.age));
        return null;
    }

    const isClose = isCloseRelationship(person);
    let milestoneMessage = null;

    if (person.age === 5) {
        person.occupation = "Elementary Student";
        person.occupationType = 'school';
        person.educationLevel = 'Elementary';
        if (isClose) milestoneMessage = `${person.name} started Elementary School!`;
    } else if (person.age === 12) {
        person.occupation = "Middle School Student";
        person.occupationType = 'school';
        person.educationLevel = 'Middle School';
        if (isClose) milestoneMessage = `${person.name} started Middle School!`;
    } else if (person.age === 14) {
        person.occupation = "High School Student";
        person.occupationType = 'school';
        person.educationLevel = 'High School';
        person.schoolYear = 1;
        if (isClose) milestoneMessage = `${person.name} started High School!`;
    } else if (person.age === 18) {
        const roll = Math.random();
        if (roll < 0.55) {
            const major = NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)];
            person.occupation = `University Student (${major})`;
            person.occupationType = 'school';
            person.schoolMajor = major;
            person.schoolYear = 1;
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} graduated High School and enrolled in University studying ${major}!`;
        } else if (roll < 0.85) {
            const entryTracks = NPC_CAREER_TRACKS.filter(t => ['retail', 'food_service', 'trades', 'logistics'].includes(t.key));
            const track = entryTracks[Math.floor(Math.random() * entryTracks.length)];
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated High School and started working as a ${lvl.title}!`;
        } else {
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} finished High School and is currently unemployed.`;
        }
    } else if (person.occupationType === 'school' && person.occupation && person.occupation.startsWith("University Student")) {
        person.schoolYear = (person.schoolYear || 1) + 1;
        if (person.schoolYear > 4 || person.age >= 22) {
            const major = person.schoolMajor;
            let track = NPC_CAREER_TRACKS.find(t => t.majors.includes(major));
            if (!track) {
                track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            }
            const lvl = track.levels[0];
            person.educationLevel = 'University';
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated University with a degree in ${major || 'their major'} and got a job as a ${lvl.title}!`;
        }
    } else if (person.occupationType === 'job' && person.age < 65) {
        const roll = Math.random();
        const track = NPC_CAREER_TRACKS.find(t => t.key === person.careerTrack);
        if (track && (person.careerLevel || 0) < track.levels.length - 1 && roll < 0.15) {
            person.careerLevel = (person.careerLevel || 0) + 1;
            const lvl = track.levels[person.careerLevel];
            person.occupation = lvl.title;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} was promoted to ${lvl.title}!`;
        } else if (roll > 0.95) {
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} became unemployed.`;
        }
    } else if (person.occupationType === 'unemployed' && person.age >= 18 && person.age < 65) {
        if (Math.random() < 0.25) {
            const track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} found a job as a ${lvl.title}!`;
        }
    } else if (person.age >= 65 && person.occupationType !== 'retired') {
        person.occupation = "Retired";
        person.occupationType = 'retired';
        person.income = Math.floor((person.income || 40000) * 0.4) || 20000;
        if (isClose) milestoneMessage = `${person.name} retired from their career!`;
    }

    return milestoneMessage;
}

export function calculateSpousalIncomeContribution(user) {
    if (!user || !Array.isArray(user.relationships)) return { amount: 0, spouseName: null };
    const spouse = user.relationships.find(r => r.category === 'spouse' || r.type === 'Wife' || r.type === 'Husband' || r.type === 'Spouse');
    if (!spouse) return { amount: 0, spouseName: null };

    if (!spouse.occupation) {
        Object.assign(spouse, generateNPCOccupation(spouse.age));
    }

    if (spouse.income > 0) {
        const amount = Math.floor(spouse.income * 0.50);
        return { amount, spouseName: spouse.name, spouseJob: spouse.occupation };
    }
    return { amount: 0, spouseName: spouse.name, spouseJob: spouse.occupation };
}
