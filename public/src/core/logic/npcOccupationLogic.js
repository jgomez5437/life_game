import { MAJORS, CAREER_TRACKS } from '../constants.js';
import { calculateScaledSalary } from './playerStatsLogic.js';

export const NPC_MAJORS = [...MAJORS];

const NPC_TRACK_MAJOR_OVERRIDES = {
    law_enforcement: ['Criminal Justice'],
    education_track: ['Education', 'English', 'Religious Studies'],
    nursing: ['Nursing', 'Biology'],
    banking: ['Business', 'Marketing'],
    journalism: ['Communications', 'English'],
    marketing_track: ['Marketing', 'Business', 'Communications'],
    social_work: ['Psychology', 'Religious Studies'],
    pharmacy: ['Pharmacy', 'Chemistry'],
    law: ['Political Science'],
    medicine: ['Biology', 'Chemistry'],
    psychiatry: ['Psychology', 'Biology'],
    corp_finance: ['Business', 'Marketing']
};

export const NPC_CAREER_TRACKS = CAREER_TRACKS.map(track => ({
    key: track.key,
    label: track.label,
    reqDegree: Boolean(track.reqDegree),
    reqGrad: track.reqGrad || null,
    majors: NPC_TRACK_MAJOR_OVERRIDES[track.key] || (Array.isArray(track.reqMajors) ? [...track.reqMajors] : []),
    levels: track.levels.map(l => ({ title: l.title, salary: l.salary }))
}));

export const LUXURY_TITLE_TO_TRACK = {
    'Senior Software Engineer': { careerTrack: 'software_eng', careerLevel: 2 },
    'Attending Physician': { careerTrack: 'medicine', careerLevel: 2 },
    'Associate Attorney': { careerTrack: 'law', careerLevel: 1 },
    'VP of Banking': { careerTrack: 'banking', careerLevel: 3 },
    'Creative Director': { careerTrack: 'graphic_design', careerLevel: 4 },
    'Director of Nursing': { careerTrack: 'nursing', careerLevel: 3 },
    'Managing Partner (Law)': { careerTrack: 'law', careerLevel: 4 },
    'Chief of Medicine': { careerTrack: 'medicine', careerLevel: 4 },
    'Chief Banking Officer': { careerTrack: 'banking', careerLevel: 4 },
    'Engineering Director': { careerTrack: 'software_eng', careerLevel: 4 },
    'Executive VP of Logistics': { careerTrack: 'logistics', careerLevel: 4 }
};

export function isCloseRelationship(person) {
    if (!person) return false;
    if (['spouse', 'partner', 'family', 'child'].includes(person.category)) return true;
    if (['Brother', 'Sister', 'Son', 'Daughter', 'Mother', 'Father', 'Boyfriend', 'Girlfriend', 'Wife', 'Husband', 'Fiancé', 'Fiancée', 'Fiance'].includes(person.type)) return true;
    return false;
}

function getNonDegreeTracks() {
    return NPC_CAREER_TRACKS.filter(t => !t.reqDegree && !t.reqGrad);
}

function getEntryLevelTracks() {
    return NPC_CAREER_TRACKS.filter(t => ['retail', 'food_service', 'trades', 'logistics'].includes(t.key));
}

function pickTrackForPerson(person, { excludeKey = null, rng = Math.random } = {}) {
    const hasUniDegree = person?.educationLevel === 'University' || Boolean(person?.schoolMajor);
    const nonDegreePool = getNonDegreeTracks().filter(t => t.key !== excludeKey);

    if (hasUniDegree) {
        const major = person?.schoolMajor || '';
        const prevTrackKey = !excludeKey ? person?.lastCareerTrack : null;
        const primaryMatches = NPC_CAREER_TRACKS.filter(t =>
            t.key !== excludeKey &&
            ((major && t.majors.includes(major)) || (prevTrackKey && t.key === prevTrackKey))
        );
        const bachelorDegreePool = NPC_CAREER_TRACKS.filter(t => t.reqDegree && !t.reqGrad && t.key !== excludeKey);

        // University grads usually land a matching/degree role, but can still end up
        // taking a lower-paying non-degree job (especially after losing a job).
        const pathRoll = rng();
        if (primaryMatches.length > 0 && pathRoll < 0.55) {
            return primaryMatches[Math.floor(rng() * primaryMatches.length)];
        }
        if (bachelorDegreePool.length > 0 && pathRoll < 0.75) {
            return bachelorDegreePool[Math.floor(rng() * bachelorDegreePool.length)];
        }
        if (nonDegreePool.length > 0) {
            return nonDegreePool[Math.floor(rng() * nonDegreePool.length)];
        }
    }

    const fallbackPool = nonDegreePool.length > 0 ? nonDegreePool : getNonDegreeTracks();
    return fallbackPool[Math.floor(rng() * fallbackPool.length)] || NPC_CAREER_TRACKS[0];
}

function findTrackByJobTitle(title) {
    if (!title || typeof title !== 'string') return null;
    const trimmed = title.trim();
    const luxuryMapping = LUXURY_TITLE_TO_TRACK[trimmed];
    if (luxuryMapping) {
        const track = NPC_CAREER_TRACKS.find(t => t.key === luxuryMapping.careerTrack);
        if (track) {
            return { track, levelIndex: Math.min(luxuryMapping.careerLevel, track.levels.length - 1) };
        }
    }

    for (const track of NPC_CAREER_TRACKS) {
        const levelIndex = track.levels.findIndex(l => l.title === trimmed);
        if (levelIndex !== -1) {
            return { track, levelIndex };
        }
    }
    return null;
}

/**
 * Repairs legacy or partial NPC occupation records (e.g., Dating App matches
 * that saved `occupation` without `occupationType`, `schoolYear`, `careerTrack`,
 * or `income`). Mutates `person` in place and returns it.
 */
export function repairNPCOccupationMetadata(person, city = null) {
    if (!person || typeof person !== 'object') return person;

    const age = Number(person.age) || 0;
    const rawOcc = typeof person.occupation === 'string' ? person.occupation.trim() : '';

    if (!rawOcc || rawOcc === 'Single') {
        Object.assign(person, generateNPCOccupation(age, city));
        return person;
    }

    const uniMatch = rawOcc.match(/^University Student(?:\s*\((.+)\))?$/i);
    if (uniMatch) {
        person.occupationType = 'school';
        if (!person.educationLevel || person.educationLevel === 'None') {
            person.educationLevel = 'High School';
        }
        if (uniMatch[1] && !person.schoolMajor) {
            person.schoolMajor = uniMatch[1].trim();
        }
        if (typeof person.schoolYear !== 'number' || person.schoolYear < 1) {
            person.schoolYear = Math.max(1, age - 17);
        }
        if (typeof person.income !== 'number') {
            person.income = 0;
        }
        return person;
    }

    if (['Baby', 'Toddler', 'Elementary Student', 'Middle School Student', 'High School Student', 'High School Graduate'].includes(rawOcc)) {
        person.occupationType = 'school';
        if (!person.educationLevel || person.educationLevel === 'None') {
            if (rawOcc === 'Elementary Student') person.educationLevel = 'Elementary';
            else if (rawOcc === 'Middle School Student') person.educationLevel = 'Middle School';
            else if (rawOcc === 'High School Student' || rawOcc === 'High School Graduate') person.educationLevel = 'High School';
            else person.educationLevel = 'None';
        }
        if (typeof person.income !== 'number') person.income = 0;
        return person;
    }

    if (rawOcc === 'Unemployed') {
        person.occupationType = 'unemployed';
        if (!person.educationLevel) person.educationLevel = 'High School';
        person.income = 0;
        return person;
    }

    if (rawOcc === 'Retired') {
        person.occupationType = 'retired';
        if (!person.educationLevel) person.educationLevel = 'High School';
        if (typeof person.income !== 'number' || person.income <= 0) {
            person.income = city ? calculateScaledSalary(25000, city) : 25000;
        }
        return person;
    }

    // Job title path: backfill occupationType, careerTrack, careerLevel, educationLevel, and income if missing
    if (!person.occupationType || !person.careerTrack || typeof person.income !== 'number') {
        const match = findTrackByJobTitle(rawOcc);
        if (!person.occupationType) {
            person.occupationType = 'job';
        }
        if (match) {
            if (!person.careerTrack) person.careerTrack = match.track.key;
            if (typeof person.careerLevel !== 'number') person.careerLevel = match.levelIndex;
            const hasDegree = Boolean(match.track.reqDegree || match.track.reqGrad);
            if (!person.educationLevel) {
                person.educationLevel = hasDegree ? 'University' : 'High School';
            }
            if (!person.schoolMajor && hasDegree && match.track.majors.length > 0) {
                person.schoolMajor = match.track.majors[0];
            }
            if (typeof person.income !== 'number' || person.income <= 0) {
                const baseSal = match.track.levels[match.levelIndex]?.salary || 40000;
                person.income = city ? calculateScaledSalary(baseSal, city) : baseSal;
            }
        } else {
            if (!person.educationLevel) {
                person.educationLevel = age >= 22 ? 'University' : 'High School';
            }
            if (typeof person.income !== 'number' || person.income <= 0) {
                person.income = city ? calculateScaledSalary(45000, city) : 45000;
            }
        }
    }

    return person;
}

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
            const entryTracks = getEntryLevelTracks();
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
            const hasDegree = Boolean(track.reqDegree || track.reqGrad);
            const major = hasDegree
                ? (track.majors.length > 0 ? track.majors[0] : NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)])
                : null;
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

export function enrollNPCInUniversity(person, major) {
    if (!person || typeof person !== 'object') return;
    const trimmed = typeof major === 'string' ? major.trim() : '';
    const resolvedMajor = trimmed || NPC_MAJORS[0];
    const age = Number(person.age) || 18;
    const wasAlreadyUni = typeof person.occupation === 'string' && person.occupation.startsWith('University Student');
    person.occupation = `University Student (${resolvedMajor})`;
    person.occupationType = 'school';
    person.educationLevel = 'High School';
    person.schoolMajor = resolvedMajor;
    person.proposedMajor = resolvedMajor;
    person.schoolYear = wasAlreadyUni
        ? Math.max(1, Number(person.schoolYear) || (age - 17))
        : Math.max(1, age - 17);
    person.careerTrack = null;
    person.careerLevel = 0;
    person.yearsInRole = 0;
    person.income = 0;
}

export function progressNPCOccupation(person, userAge, city = null, rng = Math.random, options = {}) {
    if (!person) return null;

    const hadMissingOcc = !person.occupation;
    repairNPCOccupationMetadata(person, city);
    if (hadMissingOcc) {
        return null;
    }

    const age = Number(person.age) || 0;
    const isClose = isCloseRelationship(person);
    let milestoneMessage = null;

    if (age >= 1 && age < 5 && person.occupation === 'Baby') {
        person.occupation = 'Toddler';
        person.occupationType = 'school';
        person.educationLevel = 'None';
    } else if (age === 5 || (age > 5 && age < 12 && ['Baby', 'Toddler'].includes(person.occupation))) {
        person.occupation = "Elementary Student";
        person.occupationType = 'school';
        person.educationLevel = 'Elementary';
        if (isClose && age === 5) milestoneMessage = `${person.name} started Elementary School!`;
    } else if (age === 12 || (age > 12 && age < 14 && ['Baby', 'Toddler', 'Elementary Student'].includes(person.occupation))) {
        person.occupation = "Middle School Student";
        person.occupationType = 'school';
        person.educationLevel = 'Middle School';
        if (isClose && age === 12) milestoneMessage = `${person.name} started Middle School!`;
    } else if (age === 14 || (age > 14 && age < 18 && ['Baby', 'Toddler', 'Elementary Student', 'Middle School Student'].includes(person.occupation))) {
        person.occupation = "High School Student";
        person.occupationType = 'school';
        person.educationLevel = 'High School';
        person.schoolYear = age - 13;
        if (isClose && age === 14) milestoneMessage = `${person.name} started High School!`;
    } else if (age >= 18 && age < 65 && person.occupationType === 'school' && (!person.occupation || !person.occupation.startsWith("University Student"))) {
        person.educationLevel = 'High School';
        if (options?.deferAge18Child && age === 18) {
            person.occupation = 'High School Graduate';
            person.occupationType = 'school';
            person.income = 0;
            return null;
        }
        const roll = rng();
        if (age <= 21 && roll < 0.55) {
            const preferredMajor = typeof person.proposedMajor === 'string' && person.proposedMajor.trim()
                ? person.proposedMajor.trim()
                : null;
            const major = preferredMajor || NPC_MAJORS[Math.floor(rng() * NPC_MAJORS.length)];
            enrollNPCInUniversity(person, major);
            person.schoolYear = Math.max(1, age - 17);
            if (isClose) milestoneMessage = `${person.name} graduated High School and enrolled in University studying ${major}!`;
        } else if (roll < 0.85) {
            const entryTracks = getEntryLevelTracks();
            const track = entryTracks[Math.floor(rng() * entryTracks.length)];
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.yearsInRole = 0;
            person.income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated High School and started working as a ${lvl.title}!`;
        } else {
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} finished High School and is currently unemployed.`;
        }
    } else if (person.occupationType === 'school' && person.occupation && person.occupation.startsWith("University Student")) {
        person.schoolYear = (person.schoolYear || 1) + 1;
        if (person.schoolYear > 4 || age >= 22) {
            const major = person.schoolMajor;
            const matchingTracks = major ? NPC_CAREER_TRACKS.filter(t => t.majors.includes(major)) : [];
            const degreeTracks = NPC_CAREER_TRACKS.filter(t => t.reqDegree || t.reqGrad);
            const track = matchingTracks.length > 0
                ? matchingTracks[Math.floor(rng() * matchingTracks.length)]
                : (degreeTracks[Math.floor(rng() * degreeTracks.length)] || NPC_CAREER_TRACKS[Math.floor(rng() * NPC_CAREER_TRACKS.length)]);
            const lvl = track.levels[0];
            person.educationLevel = 'University';
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.yearsInRole = 0;
            person.income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated University with a degree in ${major || 'their major'} and got a job as a ${lvl.title}!`;
        }
    } else if (age >= 65 && person.occupationType !== 'retired') {
        person.occupation = "Retired";
        person.occupationType = 'retired';
        const fallbackBase = city ? calculateScaledSalary(40000, city) : 40000;
        const pension = Math.floor((person.income > 0 ? person.income : fallbackBase) * 0.4);
        person.income = pension || (city ? calculateScaledSalary(20000, city) : 20000);
        if (isClose) milestoneMessage = `${person.name} retired from their career!`;
    } else if (person.occupationType === 'job' && age < 65) {
        person.yearsInRole = (person.yearsInRole || 0) + 1;
        const roll = rng();
        const track = NPC_CAREER_TRACKS.find(t => t.key === person.careerTrack);
        if (track && (person.careerLevel || 0) < track.levels.length - 1 && roll < 0.15) {
            person.careerLevel = (person.careerLevel || 0) + 1;
            const lvl = track.levels[person.careerLevel];
            const scaledSalary = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            person.occupation = lvl.title;
            person.income = Math.max(person.income || 0, scaledSalary);
            person.yearsInRole = 0;
            if (isClose) milestoneMessage = `${person.name} was promoted to ${lvl.title}!`;
        } else if (roll >= 0.15 && roll < 0.20) {
            const newTrack = pickTrackForPerson(person, { excludeKey: person.careerTrack, rng });
            const newLvlIdx = (person.careerLevel || 0) >= 2 && newTrack.levels.length > 1 ? 1 : 0;
            const lvl = newTrack.levels[newLvlIdx];
            person.occupation = lvl.title;
            person.careerTrack = newTrack.key;
            person.careerLevel = newLvlIdx;
            person.yearsInRole = 0;
            person.income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            if (person.wealthTier) delete person.wealthTier;
            if (isClose) milestoneMessage = `${person.name} changed careers and started working as a ${lvl.title}!`;
        } else if (roll > 0.95) {
            person.lastCareerTrack = person.careerTrack || person.lastCareerTrack || null;
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.careerTrack = null;
            person.careerLevel = 0;
            person.yearsInRole = 0;
            person.income = 0;
            if (person.wealthTier) delete person.wealthTier;
            if (isClose) milestoneMessage = `${person.name} became unemployed.`;
        } else if ((person.income || 0) > 0) {
            const raisePct = 1.02 + rng() * 0.02;
            person.income = Math.round(person.income * raisePct);
        }
    } else if (person.occupationType === 'unemployed' && age >= 18 && age < 65) {
        if (rng() < 0.25) {
            const track = pickTrackForPerson(person, { rng });
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.yearsInRole = 0;
            person.income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            if (isClose) milestoneMessage = `${person.name} found a job as a ${lvl.title}!`;
        }
    }

    return milestoneMessage;
}

export function calculateSpousalIncomeContribution(user) {
    if (!user || !Array.isArray(user.relationships)) return { amount: 0, spouseName: null };
    const spouse = user.relationships.find(r => r.category === 'spouse' || r.type === 'Wife' || r.type === 'Husband' || r.type === 'Spouse');
    if (!spouse) return { amount: 0, spouseName: null };

    repairNPCOccupationMetadata(spouse, user.city || null);

    if (spouse.income > 0) {
        const amount = Math.floor(spouse.income * 0.50);
        return { amount, spouseName: spouse.name, spouseJob: spouse.occupation };
    }
    return { amount: 0, spouseName: spouse.name, spouseJob: spouse.occupation };
}
