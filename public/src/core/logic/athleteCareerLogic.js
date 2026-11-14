import { state } from '../state.js';
import { SKILL_TRACKS, PRO_SPORTS_LEAGUES } from '../constants.js';
import { clampStat, adjustStat, calculateScaledSalary } from './playerStatsLogic.js';
import { getSkillState, getSkillXp } from './educationSkillsLogic.js';

export function getSchoolSportsDraftBonus(user, sportKey) {
    if (!user || !sportKey) return 0;
    // Architecture hook for future School Sports Activities feature
    if (Array.isArray(user.schoolSportsHistory)) {
        const entry = user.schoolSportsHistory.find(item => item && (item.sport === sportKey || item.sportKey === sportKey));
        if (entry) {
            if (typeof entry.bonus === 'number') return Math.min(20, Math.max(0, entry.bonus));
            if (entry.performance === 'mvp') return 15;
            if (entry.performance === 'all_state') return 12;
            if (entry.performance === 'varsity') return 8;
            return 5;
        }
    } else if (user.schoolSportsHistory && typeof user.schoolSportsHistory === 'object') {
        const sportData = user.schoolSportsHistory[sportKey];
        if (sportData) {
            if (typeof sportData.bonus === 'number') {
                return Math.min(20, Math.max(0, sportData.bonus));
            }
            if (sportData.performance === 'mvp') return 15;
            return 8;
        }
    }
    return 0;
}

export function evaluateAthleteProspect(user, sportKey = 'football') {
    const league = PRO_SPORTS_LEAGUES[sportKey] || PRO_SPORTS_LEAGUES.football;
    if (!user) {
        return {
            prospectScore: 0,
            score: 0,
            healthPoints: 0,
            sportPoints: 0,
            conditioningPoints: 0,
            schoolBonus: 0,
            passedPhysical: false,
            eligible: false,
            warnings: ['Failed team medical physical (Health must be at least 50%)'],
            grade: 'D (Failed Physical)',
            gradeCode: 'D',
            draftOdds: 0,
            tryoutOdds: 0,
            league
        };
    }

    const health = clampStat(user.health || 0);
    const passedPhysical = health >= 50;

    // Health: 0 to 35 points
    const healthPoints = Math.max(0, Math.min(35, Math.round(((health - 40) / 60) * 35)));

    // Primary Sport Skill: 0 to 45 points
    const sportSkill = getSkillState(user, league.skillKey);
    const sportPoints = Math.min(45, Math.round(((sportSkill.xp || 0) / 100) * 33 + (sportSkill.certified ? 12 : 0)));

    // Strength & Conditioning + Martial Arts synergy: 0 to 20 points
    const conditioningSkill = getSkillState(user, 'conditioning');
    const martialSkill = getSkillState(user, 'martial_arts');
    const conditioningPoints = Math.min(20, Math.round(
        ((conditioningSkill.xp || 0) / 100) * 14 +
        (conditioningSkill.certified ? 6 : 0) +
        ((martialSkill.xp || 0) / 100) * 4
    ));

    // Future School Activities Hook: 0 to 20 points (defaults to 0)
    const schoolBonus = getSchoolSportsDraftBonus(user, sportKey);

    const prospectScore = Math.min(100, Math.max(0, healthPoints + sportPoints + conditioningPoints + schoolBonus));
    const score = passedPhysical ? prospectScore : 0;

    let grade = 'D Longshot';
    let gradeCode = 'D';
    if (!passedPhysical) {
        grade = 'D (Failed Physical - Health < 50)';
        gradeCode = 'D';
    } else if (prospectScore >= 90) {
        grade = 'A+ 1st-Round Lottery Lock';
        gradeCode = 'A+';
    } else if (prospectScore >= 75) {
        grade = 'A 1st-Round Prospect';
        gradeCode = 'A';
    } else if (prospectScore >= 50) {
        grade = 'B+ Mid-Round Prospect';
        gradeCode = 'B';
    } else if (prospectScore >= 35) {
        grade = 'C Developmental Prospect';
        gradeCode = 'C';
    }

    const draftOdds = passedPhysical
        ? Math.min(0.96, Math.max(0.15, 0.15 + (prospectScore / 100) * 0.80))
        : 0;

    const age = user.age || 18;
    const agePenalty = age > 28 ? (age - 28) * 0.04 : 0;
    const tryoutOdds = passedPhysical
        ? Math.min(0.88, Math.max(0.08, 0.10 + (prospectScore / 100) * 0.75 - agePenalty))
        : 0;

    const warnings = passedPhysical ? [] : ['Failed team medical physical (Health must be at least 50%)'];

    return {
        prospectScore,
        score,
        healthPoints,
        sportPoints,
        conditioningPoints,
        schoolBonus,
        passedPhysical,
        eligible: passedPhysical,
        warnings,
        grade,
        gradeCode,
        draftOdds,
        tryoutOdds,
        league
    };
}

export function generateAthleteContract(sportKey, targetLevel = 0, prospectScore = 50, isDraft = false, draftRound = 'late') {
    const league = PRO_SPORTS_LEAGUES[sportKey] || PRO_SPORTS_LEAGUES.football;
    const level = league.levels[targetLevel] || league.levels[0];
    let totalYears = 2;
    let annualSalary = level.salary;
    let contractType = 'Prove-It Deal';
    let signingBonus = 0;

    if (targetLevel === 0) {
        if (isDraft) {
            contractType = 'Rookie Scale';
            if (draftRound === 'round1') {
                totalYears = 3;
                annualSalary = Math.round(level.salary * 2.5);
                signingBonus = league.signingBonuses.round1;
            } else if (draftRound === 'round2') {
                totalYears = 2;
                annualSalary = Math.round(level.salary * 1.5);
                signingBonus = league.signingBonuses.round2;
            } else {
                totalYears = 2;
                annualSalary = level.salary;
                signingBonus = league.signingBonuses.late;
            }
        } else {
            // Free Agent Tryout
            totalYears = prospectScore >= 65 ? 2 : 1;
            annualSalary = level.salary;
            contractType = totalYears === 1 ? 'Prove-It Deal' : 'Reserve Contract';
            signingBonus = 0;
        }
    } else if (targetLevel === 1) {
        totalYears = 3;
        annualSalary = level.salary;
        contractType = 'Starter Extension';
        signingBonus = 0;
    } else if (targetLevel === 2) {
        totalYears = 4;
        annualSalary = level.salary;
        contractType = 'All-Star Deal';
        signingBonus = 0;
    } else if (targetLevel === 3) {
        totalYears = 5;
        annualSalary = level.salary;
        contractType = 'Max Contract';
        signingBonus = 0;
    } else if (targetLevel >= 4) {
        totalYears = 5;
        annualSalary = level.salary;
        contractType = 'Supermax Deal';
        signingBonus = Math.round(level.salary * 0.2);
    }

    return {
        contractType,
        totalYears,
        yearsRemaining: totalYears,
        annualSalary,
        totalValue: totalYears * annualSalary,
        signingBonus
    };
}

export function attemptAthleteDraft(user, sportKey = 'football') {
    if (!user) return { success: false, message: 'Invalid player state.' };
    const league = PRO_SPORTS_LEAGUES[sportKey] || PRO_SPORTS_LEAGUES.football;

    if (user.age < 18 || user.age > 23) {
        return { success: false, reason: 'ineligible_age', message: 'You must be between ages 18 and 23 to declare for the draft combine.' };
    }

    user.athleteDraftsEntered = user.athleteDraftsEntered || {};
    if (user.athleteDraftsEntered[sportKey]) {
        return { success: false, reason: 'already_drafted', message: `You have already entered the ${league.name} Draft Combine in your career. You can attend Free Agent Tryouts instead!` };
    }

    const evaluation = evaluateAthleteProspect(user, sportKey);
    if (!evaluation.passedPhysical) {
        return { success: false, reason: 'failed_physical', message: 'You failed the pre-draft medical physical examination! Pro sports teams require at least 50 Health.' };
    }

    user.athleteDraftsEntered[sportKey] = true;
    const isDrafted = Math.random() < evaluation.draftOdds;

    if (isDrafted) {
        let draftRound = 'late';
        let startingLevel = 0;
        if (evaluation.prospectScore >= 75) {
            draftRound = 'round1';
            if (evaluation.prospectScore >= 90) startingLevel = 1;
        } else if (evaluation.prospectScore >= 50) {
            draftRound = 'round2';
        }

        const contract = generateAthleteContract(sportKey, startingLevel, evaluation.prospectScore, true, draftRound);
        const scaledAnnual = calculateScaledSalary(contract.annualSalary, user.city);
        const scaledBonus = calculateScaledSalary(contract.signingBonus, user.city);

        user.careerTrack = 'pro_athlete';
        user.athleteSport = sportKey;
        user.careerLevel = startingLevel;
        user.yearsInRole = 0;
        user.yearsInCareer = 0;
        user.jobPerformance = 90;
        user.jobTitle = league.levels[startingLevel].title;
        user.jobSalary = scaledAnnual;
        user.lastJobTitle = user.jobTitle;
        if (!user.peakJobTitle || scaledAnnual >= (user.peakJobSalary || 0)) {
            user.peakJobTitle = user.jobTitle;
            user.peakJobSalary = scaledAnnual;
        }
        user.hasSeenJobSalary = true;
        user.athleteContract = contract;
        user.money += scaledBonus;
        user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + scaledBonus;
        user.athleteGamesThisYear = 0;
        user.athleteEndorsementThisYear = false;
        user.athleteRings = user.athleteRings || 0;
        user.athleteMvps = user.athleteMvps || 0;
        user.athletePoorSeasons = 0;
        adjustStat(user, 'happiness', 30);

        const roundLabel = draftRound === 'round1' ? '1st Round' : draftRound === 'round2' ? '2nd Round' : 'Late Round';
        return {
            success: true,
            drafted: true,
            round: draftRound,
            roundLabel,
            contract,
            signingBonus: scaledBonus,
            annualSalary: scaledAnnual,
            jobTitle: user.jobTitle,
            leagueName: league.leagueName,
            message: `Congratulations! You were drafted in the ${roundLabel} of the ${league.leagueName} as a ${user.jobTitle}! Signed a ${contract.totalYears}-Year, $${contract.totalValue.toLocaleString()} contract ($${scaledAnnual.toLocaleString()}/yr) with a $${scaledBonus.toLocaleString()} signing bonus.`
        };
    } else {
        adjustStat(user, 'happiness', -15);
        return {
            success: false,
            drafted: false,
            message: `You went undrafted in the ${league.leagueName}. However, your athletic journey isn't over—you can train your conditioning and sports skills to attend Free Agent Walk-On Tryouts!`
        };
    }
}

export function attemptAthleteTryout(user, sportKey = 'football') {
    if (!user) return { success: false, message: 'Invalid player state.' };
    const league = PRO_SPORTS_LEAGUES[sportKey] || PRO_SPORTS_LEAGUES.football;

    if (user.age < 18 || user.age > 35) {
        return { success: false, reason: 'ineligible_age', message: 'Free Agent Walk-On Tryouts are available between ages 18 and 35.' };
    }

    user.athleteTryoutYear = user.athleteTryoutYear || {};
    if (user.athleteTryoutYear[sportKey] === user.age) {
        return { success: false, reason: 'already_tried_this_year', message: `You have already attended the ${league.name} Free Agent Tryout this year. You can try again next year after training!` };
    }

    const evaluation = evaluateAthleteProspect(user, sportKey);
    if (!evaluation.passedPhysical) {
        return { success: false, reason: 'failed_physical', message: 'You failed the team medical physical examination! Pro sports teams require at least 50 Health.' };
    }

    user.athleteTryoutYear[sportKey] = user.age;
    const isSigned = Math.random() < evaluation.tryoutOdds;

    if (isSigned) {
        const contract = generateAthleteContract(sportKey, 0, evaluation.prospectScore, false);
        const scaledAnnual = calculateScaledSalary(contract.annualSalary, user.city);

        user.careerTrack = 'pro_athlete';
        user.athleteSport = sportKey;
        user.careerLevel = 0;
        user.yearsInRole = 0;
        user.yearsInCareer = 0;
        user.jobPerformance = 80;
        user.jobTitle = league.levels[0].title;
        user.jobSalary = scaledAnnual;
        user.lastJobTitle = user.jobTitle;
        if (!user.peakJobTitle || scaledAnnual >= (user.peakJobSalary || 0)) {
            user.peakJobTitle = user.jobTitle;
            user.peakJobSalary = scaledAnnual;
        }
        user.hasSeenJobSalary = true;
        user.athleteContract = contract;
        user.athleteGamesThisYear = 0;
        user.athleteEndorsementThisYear = false;
        user.athleteRings = user.athleteRings || 0;
        user.athleteMvps = user.athleteMvps || 0;
        user.athletePoorSeasons = 0;
        adjustStat(user, 'happiness', 20);

        return {
            success: true,
            signed: true,
            contract,
            annualSalary: scaledAnnual,
            jobTitle: user.jobTitle,
            leagueName: league.leagueName,
            message: `You impressed the coaching staff at open tryouts and were signed to the ${league.leagueName} roster as a ${user.jobTitle}! Contract: ${contract.totalYears}-Year, $${contract.totalValue.toLocaleString()} (${contract.contractType}).`
        };
    } else {
        adjustStat(user, 'happiness', -10);
        return {
            success: false,
            signed: false,
            message: `You were not offered a contract at the ${league.leagueName} open tryouts. Hit the gym, hone your sports skills in Workshops, and try out again next season!`
        };
    }
}

export function processAthleteAction(actionType) {
    const user = state.gameState?.user;
    if (!user || user.careerTrack !== 'pro_athlete') {
        return { success: false, message: 'You are not currently signed to a pro sports team.' };
    }
    const league = PRO_SPORTS_LEAGUES[user.athleteSport] || PRO_SPORTS_LEAGUES.football;

    if (actionType === 'drills') {
        user.athleteGamesThisYear = (user.athleteGamesThisYear || 0) + 1;
        adjustStat(user, 'health', 1);
        adjustStat(user, 'happiness', 2);
        user.jobPerformance = Math.min(100, (user.jobPerformance || 50) + 6);
        
        // Award XP to the sport skill
        const skill = SKILL_TRACKS.find(s => s.key === league.skillKey);
        if (skill) {
            const st = getSkillState(user, skill.key);
            st.xp = Math.min(100, (st.xp || 0) + 5);
        }

        const injuryRoll = Math.random() < 0.03;
        if (injuryRoll) {
            adjustStat(user, 'health', -8);
            return { success: true, message: `Completed intense position drills with the squad (+5 XP, +1 Health). Suffered a minor ankle sprain (-8 Health).` };
        }
        return { success: true, message: `Completed position drills and scrimmage with first-team coaching staff (+5 ${league.name} XP, +1 Health, +6% Performance).` };
    }

    if (actionType === 'conditioning') {
        user.athleteGamesThisYear = (user.athleteGamesThisYear || 0) + 1;
        adjustStat(user, 'health', 3);
        user.jobPerformance = Math.min(100, (user.jobPerformance || 50) + 4);
        
        const condSkill = SKILL_TRACKS.find(s => s.key === 'conditioning');
        if (condSkill) {
            const st = getSkillState(user, 'conditioning');
            st.xp = Math.min(100, (st.xp || 0) + 5);
        }

        const injuryRoll = Math.random() < 0.04;
        if (injuryRoll) {
            adjustStat(user, 'health', -10);
            return { success: true, message: `Pushed heavy sets in the team weight room (+5 Conditioning XP, +3 Health), but strained a hamstring on the last rep (-10 Health).` };
        }
        return { success: true, message: `Crushed a pro combine workout in the team training facility (+5 Conditioning XP, +3 Health).` };
    }

    if (actionType === 'film_study') {
        user.athleteGamesThisYear = (user.athleteGamesThisYear || 0) + 1;
        adjustStat(user, 'smarts', 2);
        user.jobPerformance = Math.min(100, (user.jobPerformance || 50) + 8);
        return { success: true, message: `Studied opponent tendencies and tactical playbooks with the coaching staff (+2 Smarts, +8% Performance). Zero injury risk!` };
    }

    if (actionType === 'play_match') {
        user.athleteGamesThisYear = (user.athleteGamesThisYear || 0) + 1;
        
        const condXp = getSkillXp(user, 'conditioning');
        const injuryChance = Math.max(0.04, 0.12 - (condXp / 100) * 0.06);
        const gotInjured = Math.random() < injuryChance;

        if (gotInjured) {
            adjustStat(user, 'health', -15);
            adjustStat(user, 'happiness', -10);
            user.jobPerformance = Math.max(10, (user.jobPerformance || 50) - 10);
            return {
                success: true,
                message: `You took a severe collision during the rivalry match! Placed on the injury report (-15 Health, -10 Happiness).`
            };
        } else {
            const lvl = user.careerLevel || 0;
            const baseBonus = [25000, 75000, 175000, 350000, 500000][lvl] || 25000;
            const scaledBonus = calculateScaledSalary(baseBonus, user.city);
            user.money += scaledBonus;
            user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + scaledBonus;
            user.jobPerformance = Math.min(100, (user.jobPerformance || 50) + 15);
            adjustStat(user, 'happiness', 12);

            return {
                success: true,
                message: `Clutch performance in the headline rivalry match! You led the team to a dominant win and earned a $${scaledBonus.toLocaleString()} game incentive bonus (+15% Performance, +12 Happiness).`
            };
        }
    }

    if (actionType === 'endorsement') {
        const lvl = user.careerLevel || 0;
        if (lvl < 1) {
            return { success: false, message: 'You must reach at least Starting Roster (Rank 2) before brands offer endorsement deals.' };
        }
        if (user.athleteEndorsementThisYear) {
            return { success: false, message: 'You have already signed your headline brand endorsement deal this season. Another sponsor will approach you next year!' };
        }

        user.athleteEndorsementThisYear = true;
        const looks = clampStat(user.looks || 50);
        const baseEndorsement = [0, 100000, 600000, 2000000, 5000000][lvl] || 100000;
        const looksMultiplier = 0.7 + (looks / 100) * 0.6; // 0.7x to 1.3x
        const payout = Math.round(calculateScaledSalary(baseEndorsement * looksMultiplier, user.city));

        user.money += payout;
        user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + payout;
        adjustStat(user, 'happiness', 15);
        return {
            success: true,
            message: `Signed a major brand sponsorship campaign for athletic gear and billboard ads! Earned $${payout.toLocaleString()} (+15 Happiness).`
        };
    }

    return { success: false, message: `Unknown athlete action: ${actionType}` };
}
