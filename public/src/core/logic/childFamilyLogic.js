import { AvatarLogic } from '../avatarLogic.js';
import { CAREER_TRACKS } from '../constants.js';
import { isAlive } from './playerStatsLogic.js';
import {
    getRandomFirstName,
    getRandomLastName,
    getLastName,
    generateNPCOccupation
} from './npcGeneratorLogic.js';

export const CHILD_LIFELONG_SINGLE_RATE = 0.25;
export const MAX_CHILDREN_PER_ADULT_CHILD = 3;
export const MAX_UNMARRIED_CHILDREN_PER_ADULT_CHILD = 2;
export const MAX_TOTAL_RELATIONSHIPS = 80;

function generateRelId(prefix = 'rel') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function isLivingRel(r) {
    if (!r || typeof r !== 'object') return false;
    if (r.isDead === true || r.lifeStatus === 'Deceased' || r.isAlive === false) return false;
    if (typeof r.deathCause === 'string' && r.deathCause.trim() !== '') return false;
    if (typeof r.deathAge === 'number' && r.deathAge >= 0) return false;
    return isAlive(r);
}

export function isDirectChildRel(r) {
    return Boolean(r && (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter'));
}

export function isGrandchildRel(r) {
    return Boolean(r && (r.type === 'Grandson' || r.type === 'Granddaughter'));
}

export function isInLawRel(r) {
    return Boolean(r && (r.type === 'Son-in-Law' || r.type === 'Daughter-in-Law'));
}

export function getLivingChildren(user) {
    if (!user || !Array.isArray(user.relationships)) return [];
    return user.relationships.filter(r => isDirectChildRel(r) && isLivingRel(r));
}

export function getChildrenOfChild(relationships, childId) {
    if (!Array.isArray(relationships) || !childId) return [];
    return relationships.filter(r => r && r.parentChildId === childId);
}

export function getSpouseOfChild(relationships, child) {
    if (!Array.isArray(relationships) || !child) return null;
    const spouse = relationships.find(r =>
        isLivingRel(r) &&
        (
            (child.spouseId && r.id === child.spouseId) ||
            (r.spouseOfChildId && r.spouseOfChildId === child.id)
        )
    );
    return spouse || null;
}

/**
 * Computes annual probability that an unmarried adult child gets married this year.
 * @param {object} child
 * @param {Array} relationships
 * @returns {number} Probability in [0, 1]
 */
export function calculateChildMarriageChance(child, relationships = []) {
    if (!child || !isLivingRel(child)) return 0;
    const age = Number(child.age) || 0;
    if (age < 20 || age > 55) return 0;
    if (child.neverMarries === true) return 0;
    if (child.spouseId || getSpouseOfChild(relationships, child)) return 0;

    if (age >= 22 && age <= 34) return 0.12;
    if ((age >= 20 && age <= 21) || (age >= 35 && age <= 44)) return 0.06;
    return 0.02; // 45-55
}

/**
 * Creates a Son-in-Law or Daughter-in-Law NPC and links them to the adult child.
 * @param {object} child
 * @param {object} user
 * @param {object} [rolls] - Optional deterministic rolls for testing
 * @returns {object} Newly created spouse relationship object
 */
export function createChildSpouseNPC(child, user, rolls = {}) {
    const childGender = child.gender === 'female' || child.type === 'Daughter' ? 'female' : 'male';
    const oppositeGender = childGender === 'male' ? 'female' : 'male';

    const genderRoll = typeof rolls.genderRoll === 'number' ? rolls.genderRoll : Math.random();
    const spouseGender = genderRoll < 0.92 ? oppositeGender : childGender;

    const ageDeltaRoll = typeof rolls.ageDeltaRoll === 'number' ? rolls.ageDeltaRoll : Math.random();
    const ageDelta = Math.floor(ageDeltaRoll * 7) - 3; // -3 to +3
    const spouseAge = Math.max(19, (Number(child.age) || 20) + ageDelta);

    const firstRoll = typeof rolls.firstNameRoll === 'number' ? rolls.firstNameRoll : Math.random();
    const lastRoll = typeof rolls.lastNameRoll === 'number' ? rolls.lastNameRoll : Math.random();
    const surnameTakeRoll = typeof rolls.surnameTakeRoll === 'number' ? rolls.surnameTakeRoll : Math.random();
    const statusRoll = typeof rolls.statusRoll === 'number' ? rolls.statusRoll : Math.random();

    const firstName = getRandomFirstName(spouseGender, firstRoll);
    const childLastName = getLastName(child.name);
    const randomLastName = getRandomLastName(lastRoll);
    const spouseLastName = surnameTakeRoll < 0.35 ? childLastName : randomLastName;

    const id = generateRelId('rel');
    const occ = generateNPCOccupation(spouseAge, user?.city || null);
    const status = 65 + Math.floor(statusRoll * 21); // 65-85

    const spouse = {
        id,
        name: `${firstName} ${spouseLastName}`,
        age: spouseAge,
        gender: spouseGender,
        type: spouseGender === 'male' ? 'Son-in-Law' : 'Daughter-in-Law',
        category: 'family',
        status,
        spouseOfChildId: child.id,
        spouseOfChildName: child.name,
        marriedAtAge: spouseAge,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, spouseGender),
        ...occ
    };

    child.spouseId = spouse.id;
    child.isWidowed = false;
    child.marriedAtAge = Number(child.age) || 20;
    if (typeof user?.age === 'number') {
        child.justMarriedAtUserAge = user.age;
    }

    return spouse;
}

/**
 * Computes annual probability that an adult child has a baby this year.
 * Supports both married children and unmarried children (out-of-wedlock).
 * @param {object} child
 * @param {object|null} spouse
 * @param {Array} existingKids
 * @returns {number} Probability in [0, 1]
 */
export function calculateChildParenthoodChance(child, spouse = null, existingKids = []) {
    if (!child || !isLivingRel(child)) return 0;
    const childAge = Number(child.age) || 0;
    const kidsArray = Array.isArray(existingKids) ? existingKids : [];
    const existingCount = kidsArray.length;

    if (existingCount >= MAX_CHILDREN_PER_ADULT_CHILD) return 0;
    // Prevent back-to-back annual births
    if (kidsArray.some(k => Number(k?.age) === 0)) return 0;

    if (spouse && isLivingRel(spouse)) {
        const childGender = child.gender === 'female' || child.type === 'Daughter' ? 'female' : 'male';
        const spouseGender = spouse.gender || (spouse.type === 'Daughter-in-Law' ? 'female' : 'male');

        let femaleAge = null;
        if (childGender === 'female') femaleAge = childAge;
        if (spouseGender === 'female') {
            femaleAge = femaleAge === null ? (Number(spouse.age) || childAge) : Math.min(femaleAge, Number(spouse.age) || childAge);
        }

        if (femaleAge !== null) {
            if (femaleAge < 20 || femaleAge > 42) return 0;
        } else {
            if (childAge < 20 || childAge > 48) return 0;
        }

        const baseChance = existingCount === 0 ? 0.22 : (existingCount === 1 ? 0.14 : 0.07);
        const peakAge = femaleAge !== null ? femaleAge : childAge;
        if (peakAge >= 22 && peakAge <= 35) return baseChance;
        return Number((baseChance * 0.5).toFixed(4));
    }

    // Unmarried child (out-of-wedlock parenthood)
    if (existingCount >= MAX_UNMARRIED_CHILDREN_PER_ADULT_CHILD) return 0;
    if (childAge < 19 || childAge > 39) return 0;
    if (childAge === 19) return existingCount === 0 ? 0.03 : 0;
    return existingCount === 0 ? 0.055 : 0.025;
}

/**
 * Creates a newborn Grandson or Granddaughter NPC linked to `child` (and optional `spouse`).
 * @param {object} child
 * @param {object|null} spouse
 * @param {object} user
 * @param {object} [rolls] - Optional deterministic rolls for testing
 * @returns {object}
 */
export function createGrandchildNPC(child, spouse = null, user = null, rolls = {}) {
    const genderRoll = typeof rolls.genderRoll === 'number' ? rolls.genderRoll : Math.random();
    const firstRoll = typeof rolls.firstNameRoll === 'number' ? rolls.firstNameRoll : Math.random();
    const surnameChoiceRoll = typeof rolls.surnameChoiceRoll === 'number' ? rolls.surnameChoiceRoll : Math.random();

    const isMale = genderRoll < 0.5;
    const gender = isMale ? 'male' : 'female';
    const firstName = getRandomFirstName(gender, firstRoll);

    const childLastName = getLastName(child.name);
    let lastName = childLastName;
    if (spouse && spouse.name) {
        const spouseLastName = getLastName(spouse.name);
        if (spouseLastName !== childLastName) {
            const spouseIsMale = spouse.gender === 'male' || spouse.type === 'Son-in-Law';
            if (spouseIsMale) {
                lastName = surnameChoiceRoll < 0.7 ? spouseLastName : childLastName;
            } else {
                lastName = surnameChoiceRoll < 0.7 ? childLastName : spouseLastName;
            }
        }
    }

    const id = generateRelId('rel');
    const occ = generateNPCOccupation(0, user?.city || null);

    return {
        id,
        name: `${firstName} ${lastName}`,
        age: 0,
        type: isMale ? 'Grandson' : 'Granddaughter',
        gender,
        status: 90,
        category: 'family',
        parentChildId: child.id,
        parentChildName: child.name,
        otherParentId: spouse ? spouse.id : null,
        bornOutOfWedlock: !spouse,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender),
        ...occ
    };
}

/**
 * Evaluates marriage and parenthood milestones for all living adult children on age-up.
 * Mutates `user.relationships` by appending newly married in-laws and newborn grandchildren.
 * @param {object} user
 * @param {object} [rng] - Optional deterministic random generator () => number
 * @returns {{ events: Array<{ msg: string, type: string, kind: string, childId: string, npcId: string }>, newNPCs: Array<object> }}
 */
export function processAdultChildrenMilestones(user, rng = Math.random) {
    const result = { events: [], newNPCs: [] };
    if (!user || !Array.isArray(user.relationships)) return result;

    const livingChildren = getLivingChildren(user);
    if (livingChildren.length === 0) return result;

    const hadGrandchildBefore = user.relationships.some(isGrandchildRel);

    for (const child of livingChildren) {
        if (user.relationships.length >= MAX_TOTAL_RELATIONSHIPS) break;

        const childAge = Number(child.age) || 0;
        const childLabel = (child.type === 'Daughter' || child.gender === 'female') ? 'daughter' : 'son';

        // Roll lifelong single trait once when entering marriageable adulthood (20+)
        if (childAge >= 20 && child.neverMarries === undefined && !child.spouseId) {
            child.neverMarries = rng() < CHILD_LIFELONG_SINGLE_RATE;
        }

        // 1. Evaluate Marriage
        let spouse = getSpouseOfChild(user.relationships, child);
        if (!spouse) {
            const marriageChance = calculateChildMarriageChance(child, user.relationships);
            if (marriageChance > 0 && rng() < marriageChance) {
                spouse = createChildSpouseNPC(child, user, {
                    genderRoll: rng(),
                    ageDeltaRoll: rng(),
                    firstNameRoll: rng(),
                    lastNameRoll: rng(),
                    surnameTakeRoll: rng(),
                    statusRoll: rng()
                });
                user.relationships.push(spouse);
                result.newNPCs.push(spouse);

                const msg = `Your ${childLabel}, ${child.name}, got married to ${spouse.name}!`;
                result.events.push({
                    msg,
                    type: 'good',
                    kind: 'child_marriage',
                    childId: child.id,
                    npcId: spouse.id
                });
            }
        }

        if (user.relationships.length >= MAX_TOTAL_RELATIONSHIPS) break;

        // 2. Evaluate Parenthood (Married or Unmarried / Out-of-Wedlock)
        const existingKids = getChildrenOfChild(user.relationships, child.id);
        const birthChance = calculateChildParenthoodChance(child, spouse, existingKids);
        if (birthChance > 0 && rng() < birthChance) {
            const grandchild = createGrandchildNPC(child, spouse, user, {
                genderRoll: rng(),
                firstNameRoll: rng(),
                surnameChoiceRoll: rng()
            });
            user.relationships.push(grandchild);
            result.newNPCs.push(grandchild);

            const isFirstGrandchild = !hadGrandchildBefore && result.newNPCs.filter(isGrandchildRel).length === 1;
            const babyNoun = grandchild.gender === 'male' ? 'baby boy' : 'baby girl';
            const grandparentSuffix = isFirstGrandchild ? " You're a grandparent!" : '';

            let msg;
            if (spouse) {
                msg = `Your ${childLabel}, ${child.name}, and ${spouse.name} welcomed a ${babyNoun}, ${grandchild.name}!${grandparentSuffix}`;
            } else if (childLabel === 'daughter') {
                msg = `Surprise family news! Your unmarried daughter, ${child.name}, gave birth to a ${babyNoun}, ${grandchild.name}!${grandparentSuffix}`;
            } else {
                msg = `Surprise family news! Your unmarried son, ${child.name}, became a father to a ${babyNoun}, ${grandchild.name}!${grandparentSuffix}`;
            }

            result.events.push({
                msg,
                type: 'good',
                kind: spouse ? 'grandchild_birth_married' : 'grandchild_birth_unmarried',
                childId: child.id,
                npcId: grandchild.id
            });
        }
    }

    return result;
}

/**
 * Maps an NPC child's occupation and education fields into player-state fields
 * for `continueAsChild`, preserving their exact NPC income, career track/level,
 * university enrollment/graduation, major, and retirement status.
 *
 * @param {object} npc
 * @returns {object}
 */
export function mapNpcOccupationAndEducationToUser(npc) {
    const age = Number(npc?.age) || 0;
    const occTitle = typeof npc?.occupation === 'string' ? npc.occupation.trim() : '';
    const occType = npc?.occupationType || '';
    const eduLevel = npc?.educationLevel || 'None';
    const rawIncome = Math.max(0, Number(npc?.income) || 0);

    let track = npc?.careerTrack
        ? CAREER_TRACKS.find(t => t.key === npc.careerTrack) || null
        : null;
    let careerLevel = Number.isInteger(npc?.careerLevel) ? npc.careerLevel : 0;

    if (!track && occType === 'job' && occTitle) {
        for (const t of CAREER_TRACKS) {
            const idx = t.levels.findIndex(l => l.title === occTitle);
            if (idx !== -1) {
                track = t;
                careerLevel = idx;
                break;
            }
        }
    }
    if (track) {
        careerLevel = Math.max(0, Math.min(careerLevel, track.levels.length - 1));
    }

    const isUniversityStudent = occType === 'school' && occTitle.startsWith('University Student');
    const matchUniMajor = occTitle.match(/^University Student \((.+)\)$/);
    const resolvedMajor = (typeof npc?.schoolMajor === 'string' ? npc.schoolMajor.trim() : '')
        || (matchUniMajor ? matchUniMajor[1].trim() : '');

    const isUniversityGrad = !isUniversityStudent && (
        eduLevel === 'University' ||
        Boolean(npc?.schoolMajor) ||
        Boolean(track?.reqDegree) ||
        Boolean(track?.reqGrad)
    );

    const gradSchoolDegree = (!isUniversityStudent && track?.reqGrad) ? track.reqGrad : null;
    const gradSchoolDegrees = gradSchoolDegree ? [gradSchoolDegree] : [];

    const isMinorStudent = age >= 5 && age < 18;
    const highSchoolGraduated = !isMinorStudent && (
        age >= 18 ||
        eduLevel === 'High School' ||
        eduLevel === 'University' ||
        isUniversityStudent ||
        isUniversityGrad ||
        occType === 'job' ||
        occType === 'retired'
    );

    const universitySchoolYear = isUniversityStudent
        ? Math.min(3, Math.max(0, (Number(npc?.schoolYear) || 1) - 1))
        : (isUniversityGrad ? 4 : 0);

    const isRetired = occType === 'retired' || occTitle === 'Retired';
    const isEmployed = !isRetired && !isUniversityStudent && !isMinorStudent && (
        occType === 'job' || (rawIncome > 0 && Boolean(occTitle) && occTitle !== 'Unemployed')
    );

    const jobTitle = isEmployed ? (occTitle || track?.levels[careerLevel]?.title || '') : '';
    const jobSalary = isEmployed
        ? (rawIncome > 0 ? rawIncome : (track?.levels[careerLevel]?.salary || 0))
        : 0;
    const retiredFromJobTitle = isRetired && track
        ? (track.levels[careerLevel]?.title || null)
        : null;

    return {
        isStudent: isMinorStudent || isUniversityStudent,
        highSchoolGraduated,
        hasGED: false,
        highSchoolRetained: false,
        schoolPerformance: 50,
        schoolActions: 0,
        universityEnrolled: isUniversityStudent,
        universitySchoolYear,
        universityGraduated: isUniversityGrad,
        major: (isUniversityStudent || isUniversityGrad) ? resolvedMajor : '',
        gradSchoolEnrolled: false,
        gradSchoolType: null,
        gradSchoolYear: 0,
        gradSchoolDegree,
        gradSchoolDegrees,
        jobTitle,
        jobSalary,
        jobPerformance: isEmployed ? 65 : 50,
        hasSeenJobSalary: isEmployed,
        careerActionTaken: false,
        consecutivePoorYears: 0,
        careerTrack: isEmployed && track ? track.key : null,
        careerLevel: isEmployed && track ? careerLevel : 0,
        yearsInRole: 0,
        yearsInCareer: isEmployed ? Math.max(1, careerLevel * 2) : 0,
        lastJobTitle: jobTitle || retiredFromJobTitle || null,
        peakJobTitle: jobTitle || retiredFromJobTitle || null,
        peakJobSalary: jobSalary,
        isRetired,
        retirementPension: isRetired ? rawIncome : 0,
        retiredFromJobTitle
    };
}

