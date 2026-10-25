// ─────────────────────────────────────────────────────────────────────────────
// recommendations.js
// Pure, DOM-free helpers that power the desktop "Next Steps" panel.
//
// - Shared career / part-time job eligibility rules (single source of truth used
//   by careerJobsScreen.js, partTimeJobsScreen.js and the desktop panels).
// - buildRecommendations(user): returns plain data describing contextual
//   suggestions for the player's current life stage. No HTML is produced here.
// ─────────────────────────────────────────────────────────────────────────────
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { CAREER_TRACKS, SPECIAL_CAREER_TRACKS, PART_TIME_JOBS } from './constants.js';

// ─── CAREER ELIGIBILITY (moved verbatim from careerJobsScreen.js) ────────────

export const HIGH_TRUST_TRACKS = ['law_enforcement', 'banking', 'medicine', 'law', 'education_track', 'corp_finance'];

export function hasFelonyRecord(user) {
    if (!Array.isArray(user?.criminalRecord)) return false;
    return user.criminalRecord.some(r => r.severity === 'felony' && r.verdict === 'guilty');
}

export function getTrackWarnings(track, user) {
    const warnings = [];
    if (hasFelonyRecord(user) && HIGH_TRUST_TRACKS.includes(track.key))
        warnings.push('Background Check Failed (Felony Record)');
    if (track.reqGrad && user.gradSchoolDegree !== track.reqGrad)
        warnings.push(`Requires ${track.reqGrad}`);
    const hasSkillCert = GameLogic.hasCareerSkillCertification ? GameLogic.hasCareerSkillCertification(user, track.key) : null;
    if (!hasSkillCert) {
        if (track.reqDegree && !user.universityGraduated)
            warnings.push('University Degree Required');
        if (track.reqMajors && user.universityGraduated && !track.reqMajors.includes(user.major))
            warnings.push(`Major: ${track.reqMajors.join(' or ')}`);
    }
    return warnings;
}

export function isTrackLocked(track, user) {
    if (hasFelonyRecord(user) && HIGH_TRUST_TRACKS.includes(track.key)) return true;
    if (track.reqGrad && user.gradSchoolDegree !== track.reqGrad) return true;
    const hasSkillCert = GameLogic.hasCareerSkillCertification ? GameLogic.hasCareerSkillCertification(user, track.key) : null;
    if (!hasSkillCert) {
        if (track.reqDegree && !user.universityGraduated) return true;
        if (track.reqMajors && user.universityGraduated && !track.reqMajors.includes(user.major)) return true;
        if (track.reqMajors && !user.universityGraduated) return true;
    }
    return false;
}

// ─── PART-TIME ELIGIBILITY (mirrors partTimeJobsScreen.js / applyForJob) ─────

export function isPartTimeJobLocked(job, user) {
    const meetsUniversityReq = !job.reqUniversity || !!user.universityEnrolled || !!user.universityGraduated;
    const meetsAgeReq = !job.minAge || (user.age || 0) >= job.minAge;
    return !meetsUniversityReq || !meetsAgeReq;
}

export function isPartTimeTitle(title) {
    return !!title && PART_TIME_JOBS.some(j => j.title === title);
}

// ─── ELIGIBLE OPPORTUNITY LISTS ──────────────────────────────────────────────

/**
 * Careers the player can apply for right now, sorted by city-scaled starting salary (desc).
 * Mirrors the Work tab rule that full careers unlock at age 18.
 * @param {Object} user
 * @param {{limit?: number, minSalary?: number}} [opts]
 * @returns {Array<{key:string,label:string,icon:string,title:string,salary:number}>}
 */
export function getEligibleCareers(user, { limit = 3, minSalary = 0 } = {}) {
    if (!user || (user.age || 0) < 18) return [];
    return CAREER_TRACKS
        .filter(t => t.key !== user.careerTrack && !isTrackLocked(t, user))
        .map(t => {
            const bonuses = GameLogic.getCareerSkillBonuses ? GameLogic.getCareerSkillBonuses(user, t.key) : { startingLevel: 0, salaryMultiplier: 1.0 };
            const entryIdx = Math.min(bonuses.startingLevel || 0, t.levels.length - 1);
            const entry = t.levels[entryIdx];
            const baseScaled = GameLogic.calculateScaledSalary(entry.salary, user.city);
            const salary = Math.floor(baseScaled * (bonuses.salaryMultiplier || 1.0));
            return {
                key: t.key,
                label: t.label,
                icon: t.icon,
                title: entry.title,
                salary
            };
        })
        .filter(c => c.salary > minSalary)
        .sort((a, b) => b.salary - a.salary)
        .slice(0, limit);
}

/**
 * Part-time jobs the player can apply for right now, sorted by city-scaled annual pay (desc).
 * Part-time jobs unlock at age 15 (Work tab rule).
 * @param {Object} user
 * @param {{limit?: number}} [opts]
 * @returns {Array<{title:string,icon:string,hourly:number,salary:number}>}
 */
export function getEligiblePartTimeJobs(user, { limit = 2 } = {}) {
    if (!user || (user.age || 0) < 15) return [];
    const mult = GameLogic.getCityCostMultiplier(user.city);
    return PART_TIME_JOBS
        .filter(j => j.title !== user.jobTitle && !isPartTimeJobLocked(j, user))
        .map(j => ({
            title: j.title,
            icon: j.icon,
            hourly: Math.round(j.hourly * mult),
            salary: Math.round(j.salary * mult)
        }))
        .sort((a, b) => b.salary - a.salary)
        .slice(0, limit);
}

/** Number of career tracks that a bachelor's degree (any major) would open up. */
export function countDegreeCareers() {
    return CAREER_TRACKS.filter(t => t.reqDegree && !t.reqGrad).length;
}

// ─── ATTENTION FLAGS (mirror UI.updateBottomNav badge rules) ─────────────────

export function needsWorkAttention(user) {
    if (!user) return false;
    return (
        ((user.age || 0) >= 18 && user.age < 65 && !user.isStudent && !user.universityEnrolled && !user.gradSchoolEnrolled && !user.jobTitle && !user.hasBusiness && !user.isRetired) ||
        (user.careerTrack === 'mafia_syndicate' && (user.mafiaCrimesThisYear || 0) < 3)
    );
}

export function needsAssetsAttention(user) {
    if (!user || !Array.isArray(user.assets)) return false;
    return user.assets.some(a =>
        ((a.category === 'property' || a.type === 'Property') && (a.pendingOffer || a.hasBuyerOffer)) || ((a.condition ?? 100) < 25)
    );
}

// ─── PROMOTION STATUS (mirrors jobCareerManagerScreen.js wording) ────────────

/**
 * @param {Object} user
 * @returns {{state:'none'|'top'|'waiting'|'eligible'|'lowPerf', yearsRemaining:number, nextTitle:string|null, nextSalary:number, trackLabel:string|null, level:number, totalLevels:number}}
 */
export function getPromotionStatus(user) {
    const empty = { state: 'none', yearsRemaining: 0, nextTitle: null, nextSalary: 0, trackLabel: null, level: 0, totalLevels: 0 };
    if (!user || !user.careerTrack) return empty;
    const track = CAREER_TRACKS.find(t => t.key === user.careerTrack) || SPECIAL_CAREER_TRACKS.find(t => t.key === user.careerTrack);
    if (!track) return empty;

    const lvlIdx = user.careerLevel || 0;
    const level = track.levels[lvlIdx];
    const next = track.levels[lvlIdx + 1];
    const base = {
        trackLabel: track.label,
        level: lvlIdx + 1,
        totalLevels: track.levels.length,
        nextTitle: next ? next.title : null,
        nextSalary: next ? GameLogic.calculateScaledSalary(next.salary, user.city) : 0,
        yearsRemaining: 0
    };
    if (!next) return { ...base, state: 'top' };
    const minYears = level?.minYears ?? null;
    const yearsInRole = user.yearsInRole || 0;
    if (minYears !== null && yearsInRole < minYears) {
        return { ...base, state: 'waiting', yearsRemaining: minYears - yearsInRole };
    }
    return { ...base, state: (user.jobPerformance || 0) >= 75 ? 'eligible' : 'lowPerf' };
}

// ─── RECOMMENDATION ENGINE ───────────────────────────────────────────────────

const fmt = (n) => Utils.formatMoney(Math.round(n || 0));

function careerRec(c, currentSalary = 0) {
    const raise = currentSalary > 0 ? c.salary - currentSalary : 0;
    return {
        id: `career-${c.key}`,
        kind: 'career',
        tone: 'info',
        icon: c.icon,
        title: c.label,
        subtitle: raise > 0
            ? `${c.title} · ${fmt(c.salary)}/yr (+${fmt(raise)})`
            : `${c.title} · ${fmt(c.salary)}/yr`,
        action: 'applyForCareerTrack',
        args: [c.key],
        actionLabel: 'Apply'
    };
}

function jobRec(j) {
    return {
        id: `job-${j.title}`,
        kind: 'job',
        tone: 'info',
        icon: j.icon,
        title: j.title,
        subtitle: `Part-time · ${fmt(j.hourly)}/hr (${fmt(j.salary)}/yr)`,
        action: 'applyForJob',
        args: [j.title, j.salary],
        actionLabel: 'Apply'
    };
}

function jobPerformanceRec(user) {
    const p = Math.max(0, Math.min(100, user.jobPerformance ?? 50));
    return {
        id: 'job-performance',
        kind: 'progress',
        tone: p > 75 ? 'good' : (p < 25 ? 'bad' : 'warn'),
        icon: 'fa-briefcase',
        title: user.jobTitle,
        subtitle: `${fmt(user.jobSalary)}/yr · Performance ${p}%`,
        progress: p,
        action: 'renderCareerManager',
        args: [],
        actionLabel: 'Manage'
    };
}

function schoolPerformanceRec(user, label) {
    const p = Math.max(0, Math.min(100, user.schoolPerformance ?? 50));
    return {
        id: 'school-performance',
        kind: 'progress',
        tone: p > 75 ? 'good' : (p < 25 ? 'bad' : 'warn'),
        icon: 'fa-graduation-cap',
        title: label,
        subtitle: `School performance ${p}%${p < 25 ? ' · At risk of failing!' : ''}`,
        progress: p,
        action: 'renderEducation',
        args: [],
        actionLabel: 'Study'
    };
}

function workHarderRec(user) {
    if (!user.jobTitle || user.careerActionTaken) return null;
    return {
        id: 'work-harder',
        kind: 'cta',
        tone: 'good',
        icon: 'fa-bolt',
        title: 'Work Harder',
        subtitle: 'Boost performance this year',
        action: 'workHarderJob',
        args: [],
        actionLabel: 'Go'
    };
}

function universityRec(user) {
    if (user.universityGraduated || user.universityEnrolled || user.gradSchoolEnrolled) return null;
    if ((user.age || 0) < 18 && !user.highSchoolGraduated) return null;
    if (user.highSchoolRetained) return null;
    return {
        id: 'enroll-university',
        kind: 'cta',
        tone: 'info',
        icon: 'fa-university',
        title: 'Enroll in University',
        subtitle: `A degree unlocks ${countDegreeCareers()} more career tracks`,
        action: 'openUniversityModal',
        args: [],
        actionLabel: 'Enroll'
    };
}

/**
 * Builds contextual "Next Steps" suggestions for the player's current life stage.
 * Pure: reads `user`, never mutates it, returns plain objects.
 *
 * @param {Object} user
 * @returns {Array<{id:string, kind:'alert'|'progress'|'career'|'job'|'cta'|'info', tone:'good'|'bad'|'warn'|'info'|'neutral',
 *   icon:string, title:string, subtitle?:string, action?:string, args?:Array<string|number>, actionLabel?:string, progress?:number}>}
 */
export function buildRecommendations(user) {
    if (!user || user.inPrison || user.lifeStatus === 'Deceased') return [];
    const recs = [];
    const push = (r) => { if (r) recs.push(r); };
    const age = user.age || 0;

    // ── Global alerts ────────────────────────────────────────────────────────
    if ((user.money || 0) < 0) {
        push({
            id: 'alert-debt', kind: 'alert', tone: 'bad', icon: 'fa-exclamation-triangle',
            title: "You're in debt",
            subtitle: 'Your bank balance is negative. Review your cashflow.',
            action: 'openCashflowModal', args: [], actionLabel: 'Review'
        });
    }
    if (needsAssetsAttention(user)) {
        push({
            id: 'alert-assets', kind: 'alert', tone: 'warn', icon: 'fa-coins',
            title: 'Your assets need attention',
            subtitle: 'A buyer offer is waiting or an asset is in poor condition.',
            action: 'renderAssets', args: [], actionLabel: 'View'
        });
    }

    // ── Babies & toddlers ────────────────────────────────────────────────────
    if (age < 5) {
        push({
            id: 'too-young', kind: 'info', tone: 'neutral', icon: 'fa-baby',
            title: 'Too young to do much',
            subtitle: 'School starts at age 5. Keep aging up!',
            action: 'ageUp', args: [], actionLabel: 'Age Up'
        });
        return recs;
    }

    // ── Business owner ───────────────────────────────────────────────────────
    if (user.hasBusiness) {
        push({
            id: 'manage-business', kind: 'cta', tone: 'good', icon: 'fa-building',
            title: `Manage ${user.companyName || 'your company'}`,
            subtitle: `Company cash: ${fmt(user.compCash)}`,
            action: 'enterBusinessMode', args: [], actionLabel: 'Open'
        });
        return recs;
    }

    // ── Mafia syndicate ──────────────────────────────────────────────────────
    if (user.careerTrack === 'mafia_syndicate') {
        const crimes = user.mafiaCrimesThisYear || 0;
        push({
            id: 'mafia-quota', kind: 'progress', tone: crimes >= 3 ? 'good' : 'bad', icon: 'fa-user-ninja',
            title: user.jobTitle || 'Syndicate',
            subtitle: crimes >= 3 ? `Quota met (${crimes}/3). The boss is pleased.` : `Quota: ${crimes}/3 crimes. Fall short and you won't get paid.`,
            progress: Math.min(100, Math.round((crimes / 3) * 100)),
            action: 'renderCareerManager', args: [], actionLabel: 'Jobs'
        });
        return recs;
    }

    // ── Retired ──────────────────────────────────────────────────────────────
    if (user.isRetired && !user.jobTitle) {
        push({
            id: 'retired', kind: 'info', tone: 'good', icon: 'fa-cocktail',
            title: 'Enjoying retirement',
            subtitle: user.retirementPension > 0 ? `Pension: ${fmt(user.retirementPension)}/yr` : 'No pension income',
            action: 'renderMoreDashboard', args: [], actionLabel: 'Activities'
        });
        return recs;
    }

    const inSchoolUnder18 = (age < 18 && !user.highSchoolGraduated) || user.highSchoolRetained;
    const hasJob = !!user.jobTitle;
    const isCareer = hasJob && !!user.careerTrack && !isPartTimeTitle(user.jobTitle);

    // ── Kids & teens in school ───────────────────────────────────────────────
    if (inSchoolUnder18) {
        push(schoolPerformanceRec(user, age < 12 ? 'Elementary School' : (age < 14 ? 'Middle School' : 'High School')));
        if (hasJob) {
            push(jobPerformanceRec(user));
            push(workHarderRec(user));
        } else if (age >= 15) {
            getEligiblePartTimeJobs(user, { limit: 2 }).forEach(j => push(jobRec(j)));
        } else {
            push({
                id: 'jobs-locked', kind: 'info', tone: 'neutral', icon: 'fa-clock',
                title: 'Part-time jobs unlock at 15',
                subtitle: `${15 - age} more year${15 - age === 1 ? '' : 's'} to go`
            });
        }
        return recs;
    }

    // ── Employed: full career track ──────────────────────────────────────────
    if (isCareer) {
        push(jobPerformanceRec(user));
        const promo = getPromotionStatus(user);
        if (promo.state === 'top') {
            push({ id: 'promo', kind: 'info', tone: 'good', icon: 'fa-crown', title: 'Top of your field', subtitle: `${promo.trackLabel} · Level ${promo.level} of ${promo.totalLevels}` });
        } else if (promo.state === 'eligible') {
            push({ id: 'promo', kind: 'info', tone: 'good', icon: 'fa-arrow-up', title: 'Eligible for promotion!', subtitle: `Next: ${promo.nextTitle} · ${fmt(promo.nextSalary)}/yr` });
        } else if (promo.state === 'waiting') {
            push({ id: 'promo', kind: 'info', tone: 'neutral', icon: 'fa-hourglass-half', title: `${promo.yearsRemaining} more year${promo.yearsRemaining === 1 ? '' : 's'} until promotion`, subtitle: `Next: ${promo.nextTitle} · ${fmt(promo.nextSalary)}/yr` });
        } else if (promo.state === 'lowPerf') {
            push({ id: 'promo', kind: 'info', tone: 'warn', icon: 'fa-chart-line', title: 'Performance too low to promote', subtitle: `Reach 75%+ for ${promo.nextTitle}` });
        }
        push(workHarderRec(user));
        getEligibleCareers(user, { limit: 2, minSalary: user.jobSalary || 0 }).forEach(c => push(careerRec(c, user.jobSalary || 0)));
        return recs;
    }

    // ── Employed: part-time (or legacy flat job) ─────────────────────────────
    if (hasJob) {
        push(jobPerformanceRec(user));
        push(workHarderRec(user));
        getEligibleCareers(user, { limit: 3, minSalary: user.jobSalary || 0 }).forEach(c => push(careerRec(c, user.jobSalary || 0)));
        push(universityRec(user));
        return recs;
    }

    // ── University / grad students without a job ─────────────────────────────
    if (user.universityEnrolled || user.gradSchoolEnrolled) {
        push(schoolPerformanceRec(user, user.gradSchoolEnrolled ? (user.gradSchoolType || 'Graduate School') : `University · ${user.major || 'Undeclared'}`));
        getEligiblePartTimeJobs(user, { limit: 2 }).forEach(j => push(jobRec(j)));
        if (user.universityEnrolled) {
            push({
                id: 'careers-at-graduation', kind: 'info', tone: 'neutral', icon: 'fa-unlock',
                title: `${countDegreeCareers()} careers unlock at graduation`,
                subtitle: 'Keep your grades up to graduate on time.'
            });
        }
        return recs;
    }

    // ── Unemployed adult ─────────────────────────────────────────────────────
    push({
        id: 'alert-unemployed', kind: 'alert', tone: 'warn', icon: 'fa-user-clock',
        title: "You're unemployed",
        subtitle: 'Your savings are shrinking every year.',
        action: 'renderActivities', args: [], actionLabel: 'Work'
    });
    getEligibleCareers(user, { limit: 3 }).forEach(c => push(careerRec(c)));
    getEligiblePartTimeJobs(user, { limit: 2 }).forEach(j => push(jobRec(j)));
    push(universityRec(user));
    return recs;
}
