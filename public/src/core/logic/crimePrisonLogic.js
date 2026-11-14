import { state } from '../state.js';
import { Utils } from '../../ui/utils.js';
import { unlockAchievement } from '../achievementManager.js';
import { clampStat, adjustStat, isAlive } from './playerStatsLogic.js';
import { getSkillXp } from './educationSkillsLogic.js';
import { initPrisonState } from './prisonSimulationLogic.js';
export * from './prisonSimulationLogic.js';

export const CRIMES = {
    // --- MISCHIEF ---
    prank_call: { id: 'prank_call', name: 'Prank Call', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.85, payoutMin: 0, payoutMax: 0, happinessCost: 5, risk: 'low', desc: 'Call random numbers and talk nonsense.' },
    egging_house: { id: 'egging_house', name: 'Egg a House', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.75, payoutMin: 0, payoutMax: 0, happinessCost: 10, risk: 'low', desc: 'Throw eggs at your rival teacher or neighbor\'s house.' },
    porch_pirate: { id: 'porch_pirate', name: 'Porch Pirating', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.65, payoutMin: 20, payoutMax: 150, happinessCost: 15, risk: 'medium', desc: 'Snatch Amazon packages from neighborhood front porches.' },
    shoplift_minor: { id: 'shoplift_minor', name: 'Shoplift Snacks', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.70, payoutMin: 10, payoutMax: 50, happinessCost: 10, risk: 'low', desc: 'Swipe energy drinks and candy from the corner store.' },

    // --- PETTY & STREET CRIMES ---
    pickpocket: { id: 'pickpocket', name: 'Pickpocket', minAge: 18, category: 'petty', baseSuccessRate: 0.65, payoutMin: 50, payoutMax: 350, happinessCost: 15, risk: 'low', desc: 'Lift wallets and watches in crowded subway stations.' },
    shoplift: { id: 'shoplift', name: 'Shoplifting', minAge: 18, category: 'petty', baseSuccessRate: 0.60, payoutMin: 100, payoutMax: 800, happinessCost: 15, risk: 'medium', desc: 'Steal high-end electronics or clothing from retail stores.' },
    vandalism: { id: 'vandalism', name: 'Vandalism', minAge: 18, category: 'petty', baseSuccessRate: 0.80, payoutMin: 0, payoutMax: 0, happinessCost: 10, risk: 'low', desc: 'Spray paint subway cars and city buildings.' },

    // --- VIOLENT CRIMES ---
    assault: { id: 'assault', name: 'Aggravated Assault', minAge: 18, category: 'violent', baseSuccessRate: 0.55, payoutMin: 0, payoutMax: 200, happinessCost: 30, risk: 'high', desc: 'Attack someone in an alley behind a bar.' },
    attempted_murder: { id: 'attempted_murder', name: 'Attempted Murder', minAge: 18, category: 'violent', baseSuccessRate: 0.40, payoutMin: 0, payoutMax: 0, happinessCost: 45, risk: 'severe', desc: 'Hired hit or severe ambush on an enemy.' },
    murder: { id: 'murder', name: 'Homicide / Murder', minAge: 18, category: 'violent', baseSuccessRate: 0.30, payoutMin: 0, payoutMax: 5000, happinessCost: 60, risk: 'critical', desc: 'Eliminate a rival or target in cold blood.' },

    // --- HIGH-STAKES PROPERTY & HEISTS ---
    burglary: { id: 'burglary', name: 'Residential Burglary', minAge: 18, category: 'heist', baseSuccessRate: 0.50, payoutMin: 1500, payoutMax: 12000, happinessCost: 20, risk: 'high', desc: 'Break into upscale suburban homes at night.' },
    gta: { id: 'gta', name: 'Grand Theft Auto', minAge: 18, category: 'heist', baseSuccessRate: 0.45, payoutMin: 4000, payoutMax: 35000, happinessCost: 25, risk: 'high', desc: 'Hotwire and steal sports cars or luxury SUVs.' },
    bank_robbery: { id: 'bank_robbery', name: 'Bank Robbery', minAge: 18, category: 'heist', baseSuccessRate: 0.25, payoutMin: 25000, payoutMax: 250000, happinessCost: 50, risk: 'critical', desc: 'Storm a downtown bank vault with an armed crew.' }
};

export function attemptCrime(crimeId, user, targetPersonId = null) {
    if (!isAlive(user)) return { success: false, message: "Cannot commit crimes while dead or at 0 HP." };
    const crime = CRIMES[crimeId];
    if (!crime) return { success: false, message: "Invalid crime requested." };

    if (!Array.isArray(user.criminalRecord)) user.criminalRecord = [];
    user.lifetimeCrimesCommitted = (user.lifetimeCrimesCommitted || 0) + 1;

    const priorConvictions = user.criminalRecord.filter(r => r.verdict === 'guilty').length;
    const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.003;
    const priorPenalty = priorConvictions * 0.05;
    const martialArtsBonus = crime.category !== 'juvenile' ? (getSkillXp(user, 'martial_arts') / 100) * 0.15 : 0;

    const finalChance = Math.min(0.92, Math.max(0.10, crime.baseSuccessRate + smartsBonus + martialArtsBonus - priorPenalty));
    const roll = Math.random();
    const isSuccess = roll < finalChance;

    let targetPerson = null;
    if (targetPersonId && Array.isArray(user.relationships)) {
        targetPerson = user.relationships.find(r => String(r.id) === String(targetPersonId));
    }

    const targetName = targetPerson ? targetPerson.name : (crime.category === 'juvenile' ? 'a classmate' : 'a stranger');

    if (isSuccess) {
        let payout = 0;
        if (crime.payoutMax > 0) {
            payout = Math.floor(Math.random() * (crime.payoutMax - crime.payoutMin + 1)) + crime.payoutMin;
            user.money = (user.money || 0) + payout;
        }

        if (crimeId === 'murder') {
            if (targetPerson) {
                user.relationships = user.relationships.filter(r => String(r.id) !== String(targetPersonId));
                if (user.partner && String(user.partner.id) === String(targetPersonId)) user.partner = null;
                if (user.spouse && String(user.spouse.id) === String(targetPersonId)) user.spouse = null;
            }
            return {
                success: true,
                isMurder: true,
                crime,
                victimName: targetName,
                payout,
                message: `You committed homicide against ${targetName}. Detectives have found no leads and the case remains cold.`
            };
        }

        if (targetPerson && crimeId !== 'murder') {
            targetPerson.status = 0;
            targetPerson.category = 'enemy';
            targetPerson.type = 'Enemy';
        }

        if (crime.category === 'heist') {
            adjustStat(user, 'happiness', 20);
        } else if (crime.category === 'juvenile') {
            adjustStat(user, 'happiness', 5);
        } else if (crimeId !== 'murder') {
            adjustStat(user, 'happiness', 10);
        }

        return {
            success: true,
            isMurder: false,
            crime,
            targetName,
            payout,
            message: `Successfully executed ${crime.name}! ${payout > 0 ? `Scored ${Utils.formatMoney(payout)}.` : ''}`
        };
    } else {
        if (crime.category === 'juvenile') {
            let msg = `You were caught performing ${crime.name}! Your parents grounded you and you lost 15 Happiness.`;
            let hapPenalty = -15;

            if (crime.id === 'prank_call') {
                msg = `Your prank call was traced by an angry recipient who complained to your parents! You were grounded and lost 10 Happiness.`;
                hapPenalty = -10;
            } else if (crime.id === 'egging_house') {
                msg = `The homeowner caught you with an egg in hand and made you scrub their front driveway! You lost 15 Happiness.`;
                hapPenalty = -15;
            } else if (crime.id === 'porch_pirate') {
                msg = `A neighbor caught you taking a package and alerted your school principal. You received 3 days of detention and lost 15 Happiness.`;
                hapPenalty = -15;
            } else if (crime.id === 'shoplift_minor') {
                msg = `The store manager caught you swiping snacks, confiscated the items, and banned you from the store. You lost 15 Happiness.`;
                hapPenalty = -15;
            }

            adjustStat(user, 'happiness', hapPenalty);

            return {
                success: false,
                arrested: false,
                juvenileMischiefFailed: true,
                crime,
                targetName,
                message: msg
            };
        }

        user.pendingTrial = {
            crime,
            targetName,
            evidenceRating: Math.floor(Math.random() * 40) + 50,
            extraCharges: []
        };

        if (targetPerson && crimeId !== 'murder') {
            targetPerson.status = 0;
            targetPerson.category = 'enemy';
            targetPerson.type = 'Enemy';
        }

        adjustStat(user, 'happiness', -20);

        return {
            success: false,
            arrested: true,
            crime,
            targetName,
            message: `Police apprehended you while committing ${crime.name}!`
        };
    }
}

export function handleArrestAction(user, actionType, bribeAmount = 0) {
    if (!user.pendingTrial) return { success: false, message: "No active arrest." };
    if (!isAlive(user)) return { success: false, message: "Cannot perform actions while dead or at 0 HP." };

    const pending = user.pendingTrial;

    if (actionType === 'comply') {
        return { success: true, outcome: 'court', message: "You surrendered peacefully to law enforcement." };
    }

    if (actionType === 'bribe') {
        if (typeof bribeAmount !== 'number' || !Number.isFinite(bribeAmount) || bribeAmount <= 0) {
            return { success: false, message: "Invalid bribe amount." };
        }
        bribeAmount = Math.floor(bribeAmount);
        if ((user.money || 0) < bribeAmount) {
            return { success: false, message: "You don't have enough cash for that bribe!" };
        }
        user.money = (user.money || 0) - bribeAmount;

        const looksBonus = (clampStat(user.looks, 50) - 50) * 0.003;
        const bribeRatio = Math.min(1.0, bribeAmount / 10000);
        const bribeChance = Math.min(0.85, (bribeRatio * 0.50) + looksBonus + 0.10);

        if (Math.random() < bribeChance) {
            user.pendingTrial = null;
            adjustStat(user, 'happiness', 15);
            return { success: true, outcome: 'escaped', message: `The officer took your ${Utils.formatMoney(bribeAmount)} bribe and let you walk away!` };
        } else {
            pending.extraCharges.push("Bribery of a Law Enforcement Officer");
            adjustStat(user, 'happiness', -15);
            return { success: true, outcome: 'bribe_failed', message: `The officer rejected your bribe and added felony bribery charges!` };
        }
    }

    if (actionType === 'flee') {
        const martialArtsXp = getSkillXp(user, 'martial_arts');
        const martialFleeBonus = (martialArtsXp / 100) * 0.20;
        const healthChance = Math.min(0.90, (clampStat(user.health, 50) / 100) * 0.55 + martialFleeBonus);
        if (Math.random() < healthChance) {
            user.pendingTrial = null;
            adjustStat(user, 'happiness', 15);
            return { success: true, outcome: 'escaped', message: "You sprinted down an alley, lost the sirens, and escaped police custody!" };
        } else {
            pending.extraCharges.push("Resisting Arrest & Evading Officers");
            const healthPenalty = martialArtsXp >= 50 ? -5 : -10;
            adjustStat(user, 'health', healthPenalty);
            adjustStat(user, 'happiness', -15);
            return { success: true, outcome: 'flee_failed', message: "Officers tackled you to the ground and added resisting arrest charges!" };
        }
    }

    return { success: false, message: "Invalid arrest choice." };
}

export function calculateTrialVerdict(user, lawyerTier) {
    if (!user.pendingTrial) return null;
    if (!isAlive(user)) return { error: "Cannot stand trial while dead or at 0 HP." };

    const pending = user.pendingTrial;
    const crime = pending.crime;
    const extraChargesCount = (pending.extraCharges || []).length;

    let baseWinRate = 0.25;
    let lawyerCost = 0;
    let lawyerName = "Public Defender";

    if (lawyerTier === 'private_attorney') {
        baseWinRate = 0.55;
        lawyerCost = 2500;
        lawyerName = "Criminal Defense Attorney";
    } else if (lawyerTier === 'top_lawyer') {
        baseWinRate = 0.85;
        lawyerCost = 25000;
        lawyerName = "High-Powered Defense Firm";
    }

    if (lawyerCost > 0 && (user.money || 0) < lawyerCost) {
        return { error: `Insufficient funds for ${lawyerName}. You need ${Utils.formatMoney(lawyerCost)}.` };
    }

    user.money -= lawyerCost;

    const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.002;
    const evidencePenalty = (pending.evidenceRating / 100) * 0.30;
    const extraChargePenalty = extraChargesCount * 0.15;

    const winChance = Math.min(0.95, Math.max(0.05, baseWinRate + smartsBonus - evidencePenalty - extraChargePenalty));
    const acquitted = Math.random() < winChance;

    if (acquitted) {
        user.pendingTrial = null;
        adjustStat(user, 'happiness', 25);
        return {
            verdict: 'not_guilty',
            crime,
            lawyerName,
            lawyerCost,
            message: `JURY VERDICT: NOT GUILTY! You were acquitted of all charges.`
        };
    } else {
        const baseFine = crime.category === 'juvenile' ? 250 : (crime.category === 'heist' ? 15000 : (crime.category === 'violent' ? 25000 : 2500));
        const fine = baseFine + (extraChargesCount * 5000);
        const sentenceYears = crime.category === 'juvenile' ? 0 : (crime.category === 'heist' ? 3 : (crime.id === 'murder' ? 25 : 2));

        const result = {
            verdict: 'guilty',
            crime,
            lawyerName,
            lawyerCost,
            fine,
            sentenceYears,
            extraCharges: pending.extraCharges,
            message: `JURY VERDICT: GUILTY! Sentenced to ${sentenceYears > 0 ? `${sentenceYears} years` : 'probation'} and ${Utils.formatMoney(fine)} in court fines/restitution.`
        };

        applySentencing(user, result);
        user.pendingTrial = null;
        return result;
    }
}

export function applySentencing(user, verdictResult) {
    if (!Array.isArray(user.criminalRecord)) user.criminalRecord = [];

    user.money = (user.money || 0) - verdictResult.fine;

    user.criminalRecord.push({
        year: user.age || 20,
        age: user.age || 20,
        crimeId: verdictResult.crime.id,
        crimeName: verdictResult.crime.name,
        severity: verdictResult.crime.category === 'juvenile' ? 'misdemeanor' : 'felony',
        verdict: 'guilty',
        finePaid: verdictResult.fine,
        sentenceYears: verdictResult.sentenceYears
    });

    if (verdictResult.sentenceYears > 0) {
        initPrisonState(user, verdictResult);
    } else {
        if (verdictResult.crime.category !== 'juvenile' && user.jobTitle) {
            user.jobTitle = null;
            user.salary = 0;
        }
    }

    adjustStat(user, 'happiness', -35);
}


export function studyPrisonLaw(user) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot study law while dead or at 0 HP." };
    const stats = user.prisonStats;
    stats.lawStudied = (stats.lawStudied || 0) + 15;
    adjustStat(user, 'smarts', 2);
    return { success: true, msg: "Spent hours in the prison legal library studying appeal precedent. +15 Law Study points, +2 Smarts!" };
}

export function attemptSentenceAppeal(user, lawyerTier = 'self') {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot appeal while dead or at 0 HP." };
    const stats = user.prisonStats;

    let baseChance = 0.15;
    if (lawyerTier === 'private') baseChance = 0.45;
    if (lawyerTier === 'top') baseChance = 0.75;

    const lawBonus = ((stats.lawStudied || 0) / 100) * 0.20;
    const smartsBonus = (clampStat(user.smarts, 50) / 100) * 0.10;
    const winChance = Math.min(0.90, baseChance + lawBonus + smartsBonus);

    if (Math.random() < winChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        user.money = (user.money || 0) + 250;
        return {
            success: true,
            released: true,
            msg: "APPELLATE COURT OVERTURNED CONVICTION! You walked out of prison a free individual!"
        };
    } else {
        return {
            success: true,
            released: false,
            msg: "The court of appeals rejected your petition. Sentence remains unchanged."
        };
    }
}

export function attemptParoleBoard(user) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot apply for parole while dead or at 0 HP." };
    const total = user.prisonTotalSentence || 1;
    const remaining = user.prisonSentenceRemaining || 1;
    const served = total - remaining;

    if (served < Math.ceil(total * 0.5)) {
        return { success: false, msg: `You must serve at least 50% of your sentence (${Math.ceil(total * 0.5)} years) before applying for parole.` };
    }

    const stats = user.prisonStats;
    const behaviorScore = stats.goodBehaviorPoints || 0;
    const guardScore = stats.guardRelation || 0;

    const paroleChance = Math.min(0.95, (behaviorScore / 100) * 0.5 + (guardScore / 100) * 0.4);

    if (Math.random() < paroleChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        user.money = (user.money || 0) + 250;
        return {
            success: true,
            released: true,
            msg: "PAROLE GRANTED! The Parole Board approved your early release on good behavior!"
        };
    } else {
        stats.goodBehaviorPoints = Math.max(0, behaviorScore - 10);
        return {
            success: true,
            released: false,
            msg: "Parole Board DENIED early release. Continue serving your sentence."
        };
    }
}

export function attemptPrisonEscape(user, method) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot attempt escape while dead or at 0 HP." };
    const stats = user.prisonStats;

    let escapeChance = 0.20;
    if (method === 'tunnel') escapeChance += (clampStat(user.smarts, 50) / 100) * 0.35;
    if (method === 'bribe_guard') escapeChance += ((stats.guardRelation || 50) / 100) * 0.45;
    if (method === 'laundry_cart') escapeChance += (clampStat(user.looks, 50) / 100) * 0.30;
    if (method === 'fence_cut') escapeChance += (clampStat(user.health, 50) / 100) * 0.25;

    if (Math.random() < escapeChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        unlockAchievement('supermax_houdini', user);
        return {
            success: true,
            escaped: true,
            msg: "FEAT OF ESCAPE! You broke out of the prison facility and are now a fugitive on the run!"
        };
    } else {
        user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 5;
        user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 5;
        user.prisonSecurity = 'Maximum';
        stats.solitaryTurns = 2;
        stats.guardRelation = 0;
        stats.respect = Math.max(0, (stats.respect || 25) - 20);

        return {
            success: true,
            escaped: false,
            msg: "ESCAPE ATTEMPT FAILED! Guards captured you, added 5 years to your sentence, transferred you to Max Security, and placed you in 2 years of Solitary Confinement!"
        };
    }
}

export function sendPrisonLetter(user, relId) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot send letters while dead or at 0 HP." };
    const stats = user.prisonStats;
    const rel = (user.relationships || []).find(r => String(r.id) === String(relId));
    if (!rel) return { success: false, msg: "Contact not found." };

    const hasPaper = stats && Array.isArray(stats.contraband) && stats.contraband.includes('Writing Paper & Pen');
    if (!hasPaper) {
        if ((stats.canteenCash || 0) < 5) {
            return { success: false, msg: "You need $5 in canteen cash (or paper & pen) to send a letter." };
        }
        stats.canteenCash -= 5;
    }

    rel.status = Math.min(100, (rel.status || 50) + 15);
    adjustStat(user, 'happiness', 4);

    return {
        success: true,
        msg: `Sent a handwritten prison letter to ${rel.name}. Relationship boosted (+15 status)!`
    };
}

export function requestConjugalVisit(user, relId) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot request conjugal visit while dead or at 0 HP." };
    const stats = user.prisonStats;
    const rel = (user.relationships || []).find(r => String(r.id) === String(relId));

    if (!rel) return { success: false, msg: "Partner not found." };
    if (rel.category !== 'spouse' && rel.category !== 'partner') {
        return { success: false, msg: "Conjugal visits are restricted to married spouses or long-term partners." };
    }

    if ((stats.guardRelation || 50) < 40) {
        return { success: false, msg: "Guard relation is too low (<40%). Correctional officers denied your conjugal visit request." };
    }
    if ((stats.solitaryTurns || 0) > 0) {
        return { success: false, msg: "Conjugal visits are prohibited while in solitary confinement." };
    }

    rel.status = Math.min(100, (rel.status || 50) + 25);
    adjustStat(user, 'happiness', 15);

    let pregnancyOccurred = false;
    const isUserFemale = user.gender === 'female';
    const isPartnerFemale = rel.gender === 'female';

    if (isUserFemale !== isPartnerFemale && (user.age || 20) >= 18 && (user.age || 20) <= 45 && (rel.age || 20) >= 18 && (rel.age || 20) <= 45) {
        const pregChance = 0.35;
        if (Math.random() < pregChance) {
            pregnancyOccurred = true;
            user.isExpecting = true;
            user.expectingWithId = rel.id;
        }
    }

    if (pregnancyOccurred) {
        return {
            success: true,
            pregnancyOccurred: true,
            msg: `Conjugal visit with ${rel.name} was intimate and successful (+25 status, +15 Happiness)! A baby is expecting!`
        };
    }

    return {
        success: true,
        pregnancyOccurred: false,
        msg: `Enjoyed a private conjugal visit with ${rel.name}. Reconnected intimately (+25 status, +15 Happiness)!`
    };
}

export function processMafiaCrime(type) {
    const user = state.gameState?.user;
    if (!isAlive(user)) return { success: false, message: "Cannot commit crimes while dead or at 0 HP." };
    let successChance = 0.6;
    let payout = 0;
    let crimeName = '';

    if (type === 'shakedown') { crimeName = 'Extortion'; successChance = 0.7; payout = 5000; }
    else if (type === 'smuggle') { crimeName = 'Smuggling'; successChance = 0.6; payout = 15000; }
    else if (type === 'hijack') { crimeName = 'Grand Theft'; successChance = 0.5; payout = 35000; }
    else if (type === 'bribe') { crimeName = 'Bribery'; successChance = 0.8; payout = 0; }
    else if (type === 'whack') { crimeName = 'Syndicate Hit'; successChance = 0.4; payout = 0; }

    const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.005;
    const finalChance = Math.min(0.95, Math.max(0.1, successChance + smartsBonus));

    if (Math.random() < finalChance) {
        user.mafiaCrimesThisYear = (user.mafiaCrimesThisYear || 0) + 1;
        if (payout > 0) {
            user.money += payout;
            return { success: true, message: `You successfully completed ${crimeName} and pocketed $${payout.toLocaleString()}.` };
        } else {
            return { success: true, message: `You successfully completed ${crimeName} for the Syndicate.` };
        }
    } else {
        user.pendingTrial = {
            crime: { name: crimeName, category: type === 'whack' ? 'violent' : 'heist', risk: type === 'whack' ? 'critical' : 'high' },
            targetName: 'the Syndicate',
            evidenceRating: Math.floor(Math.random() * 40) + 50,
            extraCharges: []
        };
        return { success: false, arrested: true, message: `You were caught by the feds while attempting ${crimeName}!` };
    }
}
