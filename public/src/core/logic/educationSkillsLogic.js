import { Utils } from '../../ui/utils.js';
import { SKILL_TRACKS } from '../constants.js';
import { adjustStat } from './playerStatsLogic.js';
export * from './educationLogic.js';

export function ensureUserSkills(user) {
    if (!user) return {};
    if (!user.skills || typeof user.skills !== 'object' || Array.isArray(user.skills)) {
        user.skills = {};
    }
    SKILL_TRACKS.forEach(skill => {
        const existing = user.skills[skill.key];
        if (!existing || typeof existing !== 'object') {
            user.skills[skill.key] = {
                xp: 0,
                tiersCompleted: [],
                certified: false,
                parentApproved: false,
                deniedAge: null
            };
        } else {
            existing.xp = Math.max(0, Math.min(100, Number(existing.xp) || 0));
            existing.tiersCompleted = Array.isArray(existing.tiersCompleted)
                ? existing.tiersCompleted.filter(t => typeof t === 'number')
                : [];
            existing.certified = Boolean(existing.certified || existing.tiersCompleted.includes(3));
            existing.parentApproved = Boolean(existing.parentApproved);
            existing.deniedAge = typeof existing.deniedAge === 'number' ? existing.deniedAge : null;
        }
    });
    if (typeof user.skillActionsThisYear !== 'number' || Number.isNaN(user.skillActionsThisYear)) {
        user.skillActionsThisYear = 0;
    }
    if (typeof user.instrumentPracticesThisYear !== 'number' || Number.isNaN(user.instrumentPracticesThisYear)) {
        user.instrumentPracticesThisYear = 0;
    }
    if (typeof user.instrumentLessonsThisYear !== 'number' || Number.isNaN(user.instrumentLessonsThisYear)) {
        user.instrumentLessonsThisYear = 0;
    }
    return user.skills;
}

export function getSkillState(user, skillKey) {
    if (!user) return { xp: 0, tiersCompleted: [], certified: false };
    const skills = ensureUserSkills(user);
    return skills[skillKey] || { xp: 0, tiersCompleted: [], certified: false };
}

export function getSkillXp(user, skillKey) {
    if (!user || !user.skills || !user.skills[skillKey]) return 0;
    return Math.max(0, Math.min(100, Number(user.skills[skillKey].xp) || 0));
}

export function hasCareerSkillCertification(user, trackKey) {
    if (!user || !trackKey || !user.skills) return null;
    for (const skill of SKILL_TRACKS) {
        if (Array.isArray(skill.unlocksCareers) && skill.unlocksCareers.includes(trackKey)) {
            const st = user.skills[skill.key];
            if (st && (st.certified || (Array.isArray(st.tiersCompleted) && st.tiersCompleted.includes(3)))) {
                return skill;
            }
        }
    }
    return null;
}

export function getCareerUnlockingSkills(trackKey) {
    if (!trackKey) return [];
    return SKILL_TRACKS.filter(s => Array.isArray(s.unlocksCareers) && s.unlocksCareers.includes(trackKey));
}

export function getCareerSkillBonuses(user, trackKey) {
    const result = {
        salaryMultiplier: 1.0,
        startingLevel: 0,
        workHarderBonus: 0,
        promoBonus: 0,
        raiseRate: 0.05,
        matchedSkill: null,
        fastTracked: false,
        unlockedByCert: null
    };
    if (!user || !trackKey) return result;

    const unlockedByCert = hasCareerSkillCertification(user, trackKey);
    if (unlockedByCert) {
        result.unlockedByCert = unlockedByCert;
    }

    let bestXp = 0;
    let bestSkill = null;
    let isCertifiedInTrack = false;
    let isFastTracked = false;

    for (const skill of SKILL_TRACKS) {
        const st = user.skills?.[skill.key];
        const xp = st ? (Number(st.xp) || 0) : 0;
        const certified = Boolean(st && (st.certified || (Array.isArray(st.tiersCompleted) && st.tiersCompleted.includes(3))));

        const isDirectMatch =
            (Array.isArray(skill.unlocksCareers) && skill.unlocksCareers.includes(trackKey)) ||
            (Array.isArray(skill.fastTrackCareers) && skill.fastTrackCareers.includes(trackKey)) ||
            (Array.isArray(skill.boostsCareers) && skill.boostsCareers.includes(trackKey));

        if (isDirectMatch) {
            if (xp > bestXp || (certified && !isCertifiedInTrack)) {
                bestXp = Math.max(bestXp, xp);
                bestSkill = skill;
            }
            if (certified) {
                isCertifiedInTrack = true;
                if (Array.isArray(skill.fastTrackCareers) && skill.fastTrackCareers.includes(trackKey)) {
                    isFastTracked = true;
                    bestSkill = skill;
                }
            }
        }
    }

    const leadershipXp = getSkillXp(user, 'leadership');
    const leadershipCert = Boolean(user.skills?.leadership?.certified);

    result.matchedSkill = bestSkill || (leadershipXp >= 50 ? SKILL_TRACKS.find(s => s.key === 'leadership') : null);

    if (isFastTracked) {
        result.startingLevel = 1;
        result.fastTracked = true;
        result.salaryMultiplier = 1.20;
    } else if (isCertifiedInTrack || bestXp >= 80) {
        result.salaryMultiplier = 1.20;
    } else if (bestXp >= 50 || leadershipCert) {
        result.salaryMultiplier = 1.10;
    }

    // Work harder bonus (+0 to +8) and promotion probability bonus (+0 to +0.15)
    const effectiveSkillXp = Math.max(bestXp, Math.round(leadershipXp * 0.75));
    if (isCertifiedInTrack || effectiveSkillXp >= 80) {
        result.workHarderBonus = 8;
        result.promoBonus = 0.15;
        result.raiseRate = 0.08;
    } else if (effectiveSkillXp >= 50) {
        result.workHarderBonus = 5;
        result.promoBonus = 0.10;
        result.raiseRate = 0.07;
    } else if (effectiveSkillXp >= 25) {
        result.workHarderBonus = 3;
        result.promoBonus = 0.05;
        result.raiseRate = 0.06;
    }

    return result;
}

export function getLivingParents(user) {
    if (!user || !Array.isArray(user.relationships)) return [];
    return user.relationships.filter(r =>
        r &&
        (r.type === 'Mother' || r.type === 'Father') &&
        !r.deathCause &&
        !r.isDead
    );
}

export function calculateParentInstrumentApprovalOdds(user) {
    const parents = getLivingParents(user);
    if (parents.length === 0) return 1.0;
    const avgStatus = parents.reduce((sum, p) => sum + (typeof p.status === 'number' ? p.status : 50), 0) / parents.length;
    const odds = 0.10 + (avgStatus / 100) * 0.75;
    return Math.min(0.95, Math.max(0.10, odds));
}

export function executeAskParentInstrumentPermission(user, skillKey) {
    if (!user) return { success: false, message: 'No active player.' };
    const skill = SKILL_TRACKS.find(s => s.key === skillKey);
    if (!skill || skill.category !== 'instruments') {
        return { success: false, message: 'Invalid instrument selected.' };
    }
    if ((user.age || 0) < (skill.minAge || 6)) {
        return { success: false, message: `You must be at least age ${skill.minAge || 6} to ask your parents about ${skill.shortName}.` };
    }
    if ((user.age || 0) >= 18) {
        return { success: false, message: 'You are 18 or older and do not need parental permission to play an instrument!' };
    }

    ensureUserSkills(user);
    const st = user.skills[skillKey];
    if (st.parentApproved) {
        return { success: true, alreadyApproved: true, message: `Your parents have already given permission to play ${skill.shortName}!` };
    }

    if (st.deniedAge === user.age) {
        return { success: false, deniedThisYear: true, message: `Your parents already said NO to ${skill.shortName} this year. You can ask again next year!` };
    }

    const parents = getLivingParents(user);
    if (parents.length === 0) {
        st.parentApproved = true;
        st.deniedAge = null;
        return {
            success: true,
            approved: true,
            message: `With no parents around to stop you, you have complete freedom to practice ${skill.shortName}!`
        };
    }

    const odds = calculateParentInstrumentApprovalOdds(user);
    const roll = Math.random();
    const parentNames = parents.map(p => `${p.type} (${p.name})`).join(' and ');
    const primaryParent = parents[0];

    if (roll < odds) {
        st.parentApproved = true;
        st.deniedAge = null;
        adjustStat(user, 'happiness', 4);
        parents.forEach(p => {
            p.status = Math.min(100, (p.status || 50) + 2);
        });
        return {
            success: true,
            approved: true,
            message: `Great news! Your ${parentNames} agreed to let you take up ${skill.shortName}! They even agreed to cover the cost of all lessons and recitals while you are under 18 (+4 Happiness).`
        };
    } else {
        st.deniedAge = user.age;
        adjustStat(user, 'happiness', -3);
        const refusalReasons = [
            `thought it would make way too much noise around the house`,
            `said instruments are a passing fad and told you to focus on schoolwork`,
            `stated money is tight right now and denied your request`,
            `said you aren't responsible enough to stick with it yet`
        ];
        const reason = refusalReasons[Math.floor(Math.random() * refusalReasons.length)];
        return {
            success: false,
            approved: false,
            deniedThisYear: true,
            message: `Request Denied! Your ${primaryParent.type} (${primaryParent.name}) ${reason}. You cannot ask again until next year (-3 Happiness).`
        };
    }
}

export function getInstrumentPracticeXpGain(currentXp) {
    const xp = Math.max(0, Number(currentXp) || 0);
    if (xp >= 90) return 1;
    if (xp >= 75) return 2;
    if (xp >= 50) return 4;
    return 6;
}

export function getInstrumentLessonXpGain(currentXp) {
    const xp = Math.max(0, Number(currentXp) || 0);
    if (xp >= 90) return 2;
    if (xp >= 75) return 3;
    if (xp >= 50) return 5;
    return 8;
}

export function executePracticeSkill(user, skillKey) {
    if (!user) return { success: false, message: 'No active player.' };
    const skill = SKILL_TRACKS.find(s => s.key === skillKey);
    if (!skill) return { success: false, message: 'Invalid skill selected.' };

    const minAge = skill.minAge || (skill.category === 'instruments' ? 6 : 12);
    if ((user.age || 0) < minAge) {
        return { success: false, message: `You must be at least age ${minAge} to practice ${skill.shortName}.` };
    }

    ensureUserSkills(user);
    const st = user.skills[skillKey];

    if (skill.category === 'instruments') {
        if ((user.age || 0) < 18) {
            const parents = getLivingParents(user);
            if (parents.length > 0 && !st.parentApproved) {
                return {
                    success: false,
                    needsPermission: true,
                    message: `Your parents haven't given permission to play ${skill.shortName} yet! Ask them for permission first.`
                };
            }
        }

        if ((user.instrumentPracticesThisYear || 0) >= 3) {
            return {
                success: false,
                message: 'You have already used all 3 self-practice sessions for instruments this year. Age up or take a private lesson!'
            };
        }

        if (st.xp >= 100) {
            return { success: false, message: `You have already reached 100% mastery in ${skill.shortName}!` };
        }

        const xpGain = getInstrumentPracticeXpGain(st.xp);
        st.xp = Math.min(100, st.xp + xpGain);
        user.instrumentPracticesThisYear = (user.instrumentPracticesThisYear || 0) + 1;

        const statDeltas = [];
        if (skill.practiceStats) {
            for (const [statName, delta] of Object.entries(skill.practiceStats)) {
                adjustStat(user, statName, delta);
                statDeltas.push(`+${delta} ${statName.charAt(0).toUpperCase() + statName.slice(1)}`);
            }
        }

        return {
            success: true,
            xpGain,
            newXp: st.xp,
            statDeltas,
            skill,
            message: `Practiced ${skill.shortName} (+${xpGain} Mastery XP${statDeltas.length ? ', ' + statDeltas.join(', ') : ''}).`
        };
    }

    if ((user.skillActionsThisYear || 0) >= 2) {
        return { success: false, message: 'You have already used both of your self-practice sessions this year. Age up or enroll in a workshop!' };
    }

    if (st.xp >= 100) {
        return { success: false, message: `You have already reached 100% mastery in ${skill.shortName}!` };
    }

    const xpGain = 10;
    st.xp = Math.min(100, st.xp + xpGain);
    user.skillActionsThisYear = (user.skillActionsThisYear || 0) + 1;

    const statDeltas = [];
    if (skill.practiceStats) {
        for (const [statName, delta] of Object.entries(skill.practiceStats)) {
            adjustStat(user, statName, delta);
            statDeltas.push(`+${delta} ${statName.charAt(0).toUpperCase() + statName.slice(1)}`);
        }
    }

    return {
        success: true,
        xpGain,
        newXp: st.xp,
        statDeltas,
        skill,
        message: `Practiced ${skill.shortName} (+${xpGain} Mastery XP${statDeltas.length ? ', ' + statDeltas.join(', ') : ''}).`
    };
}

export function executeInstrumentLesson(user, skillKey) {
    if (!user) return { success: false, message: 'No active player.' };
    const skill = SKILL_TRACKS.find(s => s.key === skillKey);
    if (!skill || skill.category !== 'instruments') {
        return { success: false, message: 'Invalid instrument selected.' };
    }
    const minAge = skill.minAge || 6;
    if ((user.age || 0) < minAge) {
        return { success: false, message: `You must be at least age ${minAge} to take ${skill.shortName} lessons.` };
    }

    ensureUserSkills(user);
    const st = user.skills[skillKey];

    const isUnder18 = (user.age || 0) < 18;
    if (isUnder18) {
        const parents = getLivingParents(user);
        if (parents.length > 0 && !st.parentApproved) {
            return {
                success: false,
                needsPermission: true,
                message: `Your parents must give permission before enrolling in ${skill.shortName} lessons! Ask them first.`
            };
        }
    }

    if ((user.instrumentLessonsThisYear || 0) >= 3) {
        return {
            success: false,
            message: 'You have already taken your maximum of 3 instrument lessons this year. Age up to take more next year!'
        };
    }

    if (st.xp >= 100) {
        return { success: false, message: `You have already reached 100% virtuoso mastery in ${skill.shortName}!` };
    }

    const lessonCost = isUnder18 ? 0 : (skill.lessonCost || 200);
    if (!isUnder18 && (user.money || 0) < lessonCost) {
        return {
            success: false,
            message: `Insufficient funds! You need ${Utils.formatMoney(lessonCost)} for a private ${skill.shortName} lesson.`
        };
    }

    if (!isUnder18 && lessonCost > 0) {
        user.money -= lessonCost;
    }

    const xpGain = getInstrumentLessonXpGain(st.xp);
    st.xp = Math.min(100, st.xp + xpGain);
    user.instrumentLessonsThisYear = (user.instrumentLessonsThisYear || 0) + 1;

    adjustStat(user, 'smarts', 2);
    adjustStat(user, 'happiness', 3);

    const costNote = isUnder18 ? ' (Paid by Parents)' : ` (${Utils.formatMoney(lessonCost)})`;
    return {
        success: true,
        xpGain,
        newXp: st.xp,
        skill,
        message: `Completed private ${skill.shortName} lesson with an instructor (+${xpGain} XP, +2 Smarts, +3 Happiness)${costNote}.`
    };
}

export function executeEnrollSkillCourse(user, skillKey, tierNum) {
    if (!user) return { success: false, message: 'No active player.' };
    const skill = SKILL_TRACKS.find(s => s.key === skillKey);
    if (!skill) return { success: false, message: 'Invalid skill selected.' };

    const tier = Number(tierNum);
    const course = skill.courses.find(c => c.tier === tier);
    if (!course) return { success: false, message: 'Invalid course tier.' };

    ensureUserSkills(user);
    const st = user.skills[skillKey];

    if (st.tiersCompleted.includes(tier)) {
        return { success: false, message: `You have already completed ${course.title}.` };
    }

    const minAge = course.minAge || skill.minAge || (skill.category === 'instruments' ? 6 : 12);
    if ((user.age || 0) < minAge) {
        return { success: false, message: `You must be at least age ${minAge} to enroll in ${course.title}.` };
    }

    const isUnder18 = (user.age || 0) < 18;
    const isInstrument = skill.category === 'instruments';

    if (isInstrument && isUnder18) {
        const parents = getLivingParents(user);
        if (parents.length > 0 && !st.parentApproved) {
            return {
                success: false,
                needsPermission: true,
                message: `Your parents must approve ${skill.shortName} before you can participate in conservatory recitals!`
            };
        }
    }

    if (st.xp < (course.minXp || 0)) {
        return { success: false, message: `Requires at least ${course.minXp} Mastery XP in ${skill.shortName} (Current: ${st.xp} XP). Practice or complete an earlier workshop first!` };
    }

    const actualCost = (isInstrument && isUnder18) ? 0 : course.cost;

    if ((user.money || 0) < actualCost) {
        return { success: false, message: `Insufficient funds! You need ${Utils.formatMoney(actualCost)} to enroll in ${course.title}.` };
    }

    if (actualCost > 0) {
        user.money -= actualCost;
    }

    st.xp = Math.min(100, st.xp + course.xpGain);
    st.tiersCompleted.push(tier);
    if (course.grantsCert) {
        st.certified = true;
    }

    const statDeltas = [];
    if (course.stats) {
        for (const [statName, delta] of Object.entries(course.stats)) {
            adjustStat(user, statName, delta);
            statDeltas.push(`+${delta} ${statName.charAt(0).toUpperCase() + statName.slice(1)}`);
        }
    }

    const certMsg = course.grantsCert ? ` Earned Master Certificate: ${skill.certificateTitle}!` : '';
    const paymentNote = (isInstrument && isUnder18) ? ' (Paid by Parents)' : '';
    return {
        success: true,
        course,
        skill,
        xpGain: course.xpGain,
        newXp: st.xp,
        certified: st.certified,
        statDeltas,
        message: `Completed "${course.title}" (+${course.xpGain} Mastery XP${statDeltas.length ? ', ' + statDeltas.join(', ') : ''})${paymentNote}.${certMsg}`
    };
}

export function getArtistInstrumentReadiness(user) {
    if (!user || !user.skills) {
        return {
            bestInstrument: null,
            bestXp: 0,
            certifiedInstruments: [],
            totalInstrumentXp: 0,
            hiringBonus: 0,
            eligible: false
        };
    }
    const instrumentTracks = SKILL_TRACKS.filter(s => s.category === 'instruments');
    let bestInstrument = null;
    let bestXp = 0;
    const certifiedInstruments = [];
    let totalInstrumentXp = 0;

    for (const inst of instrumentTracks) {
        const st = user.skills[inst.key];
        const xp = st ? (Number(st.xp) || 0) : 0;
        totalInstrumentXp += xp;
        if (xp > bestXp) {
            bestXp = xp;
            bestInstrument = inst;
        }
        if (st && st.certified) {
            certifiedInstruments.push(inst);
        }
    }

    let hiringBonus = 0;
    if (certifiedInstruments.length > 0) hiringBonus = 0.30;
    else if (bestXp >= 80) hiringBonus = 0.20;
    else if (bestXp >= 50) hiringBonus = 0.10;

    return {
        bestInstrument,
        bestXp,
        certifiedInstruments,
        totalInstrumentXp,
        hiringBonus,
        eligible: bestXp >= 50 || certifiedInstruments.length > 0
    };
}
