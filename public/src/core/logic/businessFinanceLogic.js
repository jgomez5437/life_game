import { Utils } from '../../ui/utils.js';
import { PART_TIME_JOBS } from '../constants.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, VC_INVESTOR_TYPES } from '../../features/business/businessTypes.js';
import { clampStat, isAlive, adjustStat } from './playerStatsLogic.js';
import { getCareerSkillBonuses } from './educationSkillsLogic.js';
export * from './cashflowTaxLogic.js';

/**
 * Returns the annual promotion chance for a career-track employee based on performance.
 * @param {number} performance - Job performance (0–100)
 * @returns {number} Probability of promotion (0.0 to 0.80); 0 means ineligible
 */
export function calculatePromotionChance(performance, smarts = 50) {
    const clampedPerf = clampStat(performance, 50);
    const clampedSmarts = clampStat(smarts, 50);
    let bonus = 0;
    if (clampedSmarts >= 80) bonus = 0.10;
    else if (clampedSmarts >= 65) bonus = 0.05;

    if (clampedPerf >= 95) return Math.min(0.95, 0.80 + bonus);
    if (clampedPerf >= 85) return Math.min(0.85, 0.50 + bonus);
    if (clampedPerf >= 75) return Math.min(0.75, 0.25 + bonus);
    return 0;
}

/**
 * Determines whether a business owner can process another quarterly turn
 * at their current player age (limit: 1 fiscal year / 4 quarters per age).
 * @param {object} user - The player state object
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canProcessBusinessQuarter(user) {
    if (!user || !user.hasBusiness) {
        return { allowed: false, reason: "No active business." };
    }

    if (!isAlive(user)) {
        return { allowed: false, reason: "Cannot run business while dead or at 0 HP." };
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
export function recordBusinessQuarterProcessed(user, fiscalYearCompleted = false) {
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
export function getRemainingQuartersForAge(user) {
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
export function calculateAutoQuarterCount(user) {
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
export function resetBusinessQuarterTracking(user) {
    if (!user) return user;
    user.quartersProcessedThisAge = 0;
    user.lastBusinessAge = null;
    user.lastCompletedFiscalYearAge = null;
    return user;
}

/**
 * Normalizes companyYear and companyQuarter to valid bounds (1..4) and repairs
 * legacy desyncs where Q4 already completed for the current companyYear without wrapping.
 * @param {object} user
 * @returns {object}
 */
export function normalizeBusinessQuarterState(user) {
    if (!user || !user.hasBusiness) return user;

    let year = Math.floor(Number(user.companyYear));
    if (!Number.isFinite(year) || year < 1) year = 1;

    let quarter = Math.floor(Number(user.companyQuarter));
    if (!Number.isFinite(quarter) || quarter < 1) {
        quarter = 1;
    } else if (quarter > 4) {
        year += Math.floor((quarter - 1) / 4);
        quarter = ((quarter - 1) % 4) + 1;
    }

    const history = Array.isArray(user.businessHistory) ? user.businessHistory : [];
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    if (
        quarter === 4 &&
        lastEntry &&
        Number(lastEntry.year) === year &&
        Number(lastEntry.quarter) === 4
    ) {
        quarter = 1;
        year += 1;
    }

    user.companyYear = year;
    user.companyQuarter = quarter;
    return user;
}

/**
 * Atomically records and advances the company's fiscal quarter (always keeping companyQuarter in 1..4).
 * Returns the year & quarter that were just executed and whether the fiscal year closed.
 * @param {object} user
 * @returns {{ executedYear: number, executedQuarter: number, isFiscalYearEnding: boolean } | null}
 */
export function advanceBusinessQuarter(user) {
    if (!user || !user.hasBusiness) return null;
    normalizeBusinessQuarterState(user);

    const executedYear = user.companyYear;
    const executedQuarter = user.companyQuarter;
    const quartersThisAge = user.lastBusinessAge === user.age ? (user.quartersProcessedThisAge || 0) : 0;
    const isFiscalYearEnding = executedQuarter >= 4 || (quartersThisAge + 1) >= 4;

    recordBusinessQuarterProcessed(user, isFiscalYearEnding);

    if (isFiscalYearEnding) {
        user.companyQuarter = 1;
        user.companyYear = executedYear + 1;
    } else {
        user.companyQuarter = executedQuarter + 1;
        user.companyYear = executedYear;
    }

    return {
        executedYear,
        executedQuarter,
        isFiscalYearEnding
    };
}

export function ensureBusinessState(user) {
    if (!user || !user.hasBusiness) return;

    normalizeBusinessQuarterState(user);

    if (typeof user.isPublic !== 'boolean') user.isPublic = false;
    if (!user.hqTier) user.hqTier = 'garage';
    if (!user.marketingLevels) user.marketingLevels = { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 };
    if (!user.teamRoles) {
        const empCount = user.employees || 5;
        user.teamRoles = {
            engineering: Math.max(1, Math.ceil(empCount * 0.4)),
            sales: Math.max(1, Math.ceil(empCount * 0.2)),
            operations: Math.max(1, Math.ceil(empCount * 0.2)),
            marketing: Math.max(1, Math.ceil(empCount * 0.2))
        };
    }
    if (typeof user.equityOwned !== 'number') user.equityOwned = 1.0;
    if (!Array.isArray(user.investorShares)) user.investorShares = [];
    if (!user.corporateDebt) user.corporateDebt = { principal: 0, interestRate: 0.08, monthlyPayment: 0 };
    if (typeof user.customerSatisfaction !== 'number') user.customerSatisfaction = 75;
    if (typeof user.employeeMorale !== 'number') user.employeeMorale = 80;
    if (!Array.isArray(user.activeResearch)) user.activeResearch = [];
    if (!Array.isArray(user.businessHistory)) user.businessHistory = [];
    if (!Array.isArray(user.businessUpgrades)) user.businessUpgrades = [];
}

export const MAX_COMPANY_VALUATION = 999999999999999; // $999 Trillion (Safe within Number.MAX_SAFE_INTEGER)
export const MAX_COMPANY_CASH = 999999999999999;
export const MAX_PLAYER_MONEY = 999999999999999;

export function calculateCompanyValuation(user) {
    if (!user || !user.hasBusiness) return 0;
    ensureBusinessState(user);

    const indKey = user.industry || 'tech';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas || { valuationMultiple: 3.0, startupCost: 50000, unitCost: 10 };

    const recentQuarters = (user.businessHistory || []).slice(-4);
    const annualRevenue = recentQuarters.reduce((sum, q) => {
        const rev = Number(q.revenue);
        return sum + (isFinite(rev) && rev > 0 ? rev : 0);
    }, 0);
    const annualProfit = recentQuarters.reduce((sum, q) => {
        const prof = Number(q.profit);
        return sum + (isFinite(prof) && prof > 0 ? prof : 0);
    }, 0);

    const rawCash = Number(user.compCash);
    const cashValue = isFinite(rawCash) ? Math.max(0, Math.min(MAX_COMPANY_CASH, rawCash)) : 0;
    const rawInventory = Number(user.inventory);
    const inventoryCount = isFinite(rawInventory) ? Math.max(0, rawInventory) : 0;
    const inventoryValue = inventoryCount * (ind.unitCost || 10);
    const baseAssetValue = cashValue + inventoryValue;

    let revenueValuation = annualRevenue * (ind.valuationMultiple || 3.0);
    if (annualProfit > 0) {
        revenueValuation += annualProfit * 2.0;
    }

    const rep = isFinite(Number(user.businessReputation)) ? Number(user.businessReputation) : 50;
    const reputationBonus = 1 + (rep - 50) / 200;
    const minValuation = (ind.startupCost || 50000) * 1.5;

    const rawValuation = Math.floor((baseAssetValue + revenueValuation) * reputationBonus);
    const safeValuation = isFinite(rawValuation) ? rawValuation : minValuation;

    const finalValuation = Math.min(
        MAX_COMPANY_VALUATION,
        Math.max(minValuation, safeValuation)
    );

    return finalValuation;
}

export function calculateBusinessOverhead(user) {
    if (!user || !user.hasBusiness) return { fixedRent: 0, empAdminOverhead: 0, debtInterest: 0, totalQuarterly: 0 };
    ensureBusinessState(user);

    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const quarterlyRent = (hq.monthlyRent || 0) * 3;
    const empCount = user.employees || 1;
    const empAdminOverhead = empCount * 300 * 3;

    const debtInterest = Math.floor(((user.corporateDebt?.principal || 0) * (user.corporateDebt?.interestRate || 0.08)) / 4);

    const totalQuarterly = quarterlyRent + empAdminOverhead + debtInterest;

    return {
        quarterlyRent,
        empAdminOverhead,
        debtInterest,
        totalQuarterly
    };
}

export function calculateVCInvestorOffers(user) {
    if (!user || !user.hasBusiness) return [];
    ensureBusinessState(user);

    if (user.isPublic) return [];

    const valuation = calculateCompanyValuation(user);
    const acceptedInvestorIds = (user.investorShares || []).map(s => s.investorId);

    return VC_INVESTOR_TYPES
        .filter(vc => valuation >= vc.minValuation && !acceptedInvestorIds.includes(vc.id))
        .map(vc => {
            const investmentAmount = Math.min(vc.maxInvestment, Math.floor(valuation * vc.equityTarget));
            const postMoneyValuation = Math.min(MAX_COMPANY_VALUATION, valuation + investmentAmount);
            const actualEquityOffered = Math.round((investmentAmount / postMoneyValuation) * 100) / 100;

            return {
                ...vc,
                offeredAmount: investmentAmount,
                equityRequired: actualEquityOffered,
                postMoneyValuation
            };
        });
}

export function acceptVCOffer(user, investorId) {
    if (!user || !user.hasBusiness) return { success: false, msg: 'No active business.' };
    if (!isAlive(user)) return { success: false, msg: "Cannot accept investment offers while dead or at 0 HP." };
    ensureBusinessState(user);

    if (user.isPublic) {
        return { success: false, msg: 'Cannot accept private VC investments after going public.' };
    }

    if (user.investorShares && user.investorShares.some(s => s.investorId === investorId)) {
        return { success: false, msg: 'This investment offer has already been accepted.' };
    }

    const offers = calculateVCInvestorOffers(user);
    const offer = offers.find(o => o.id === investorId);
    if (!offer) return { success: false, msg: 'Investment offer no longer valid.' };

    const equityPct = offer.equityRequired;
    if (user.equityOwned < equityPct) {
        return { success: false, msg: `You do not own enough remaining equity (${Math.round(user.equityOwned * 100)}%) to fulfill this offer.` };
    }

    user.equityOwned = Math.round((user.equityOwned - equityPct) * 100) / 100;
    user.compCash = Math.min(MAX_COMPANY_CASH, (user.compCash || 0) + offer.offeredAmount);
    user.investorShares.push({
        investorId: offer.id,
        name: offer.name,
        equity: equityPct,
        amountInvested: offer.offeredAmount,
        year: user.companyYear || 1
    });

    return {
        success: true,
        amount: offer.offeredAmount,
        equity: equityPct,
        msg: `Successfully accepted ${Utils.formatMoney(offer.offeredAmount)} investment from ${offer.name} in exchange for ${Math.round(equityPct * 100)}% equity!`
    };
}

export function launchIPO(user, floatEquity = 0.20) {
    if (!user || !user.hasBusiness) return { success: false, msg: 'No active business.' };
    if (!isAlive(user)) return { success: false, msg: "Cannot launch IPO while dead or at 0 HP." };
    ensureBusinessState(user);

    if (user.isPublic) {
        return { success: false, msg: 'Company is already publicly traded.' };
    }

    const valuation = calculateCompanyValuation(user);
    if (valuation < 25000000) {
        return { success: false, msg: `Valuation must be at least $25,000,000 to launch an IPO (Current: ${Utils.formatMoney(valuation)}).` };
    }

    const float = Math.min(user.equityOwned, floatEquity);
    if (float <= 0) {
        return { success: false, msg: 'You do not have sufficient equity to float on the public exchange.' };
    }

    const playerPayout = Math.min(MAX_PLAYER_MONEY, Math.floor(valuation * float));
    user.money = Math.min(MAX_PLAYER_MONEY, (user.money || 0) + playerPayout);
    user.equityOwned = Math.max(0, Math.round((user.equityOwned - float) * 100) / 100);
    user.isPublic = true;

    return {
        success: true,
        valuation,
        floatEquity: float,
        payout: playerPayout,
        msg: `Historic IPO! ${user.companyName} listed publicly at ${Utils.formatMoney(valuation)} valuation. You floated ${Math.round(float * 100)}% equity for ${Utils.formatMoney(playerPayout)} cash payout!`
    };
}

export const PART_TIME_ANNUAL_HOURS = 1040;

export function isPartTimeJob(user) {
    if (!user || !user.jobTitle) return false;
    if (user.careerTrack === 'mafia_syndicate' || user.careerTrack === 'pro_athlete') return false;
    if (!user.careerTrack) return true;
    return PART_TIME_JOBS.some(j => j.title === user.jobTitle);
}

export function formatHourlyWage(annualSalary) {
    const num = Number(annualSalary);
    if (!isFinite(num) || num <= 0) return '$0.00';
    return `$${(num / PART_TIME_ANNUAL_HOURS).toFixed(2)}`;
}

export function calculateAnnualRaise(user, opts = {}) {
    const none = {
        applied: false,
        isPartTime: isPartTimeJob(user),
        oldSalary: Number(user?.jobSalary) || 0,
        newSalary: Number(user?.jobSalary) || 0,
        raiseAmount: 0,
        baseRate: 0,
        meritRate: 0,
        totalRate: 0,
        totalPct: 0,
        hasMerit: false,
        happinessGain: 0,
        logMessage: null
    };

    if (!user || !user.jobTitle) return none;
    if (user.careerTrack === 'mafia_syndicate' || user.careerTrack === 'pro_athlete') return none;
    const oldSalary = Number(user.jobSalary) || 0;
    if (oldSalary <= 0 || opts.wasPromoted) return none;

    const perf = clampStat(user.jobPerformance ?? 50, 50);
    if (perf <= 20) return none;

    const partTime = isPartTimeJob(user);

    if (partTime) {
        const baseRate = 0.01;
        const meritRate = perf >= 90 ? 0.03 : (perf >= 75 ? 0.02 : 0);
        const totalRate = baseRate + meritRate;
        const raiseAmount = Math.max(100, Math.round(oldSalary * totalRate));
        const newSalary = oldSalary + raiseAmount;
        const totalPct = Math.round((raiseAmount / oldSalary) * 1000) / 10;
        const happinessGain = meritRate > 0 ? 5 : 0;
        const hourlyStr = `${formatHourlyWage(newSalary)}/hr`;
        const logMessage = meritRate > 0
            ? `Part-time raise (+${totalPct}%): Received a ${Utils.formatMoney(raiseAmount)}/yr merit & cost-of-living raise as ${user.jobTitle} (${Utils.formatMoney(newSalary)}/yr, ${hourlyStr}). (+${happinessGain} Happiness)`
            : `Part-time annual raise (+${totalPct}%): Received a ${Utils.formatMoney(raiseAmount)}/yr cost-of-living raise as ${user.jobTitle} (${Utils.formatMoney(newSalary)}/yr, ${hourlyStr}).`;

        return {
            applied: true,
            isPartTime: true,
            oldSalary,
            newSalary,
            raiseAmount,
            baseRate,
            meritRate,
            totalRate,
            totalPct,
            hasMerit: meritRate > 0,
            happinessGain,
            logMessage
        };
    }

    const skillBonuses = opts.skillBonuses || getCareerSkillBonuses(user, user.careerTrack);
    const baseRate = 0.02;
    const meritRate = perf >= 80 ? (skillBonuses?.raiseRate || 0.05) : 0;
    const totalRate = baseRate + meritRate;
    const raiseAmount = Math.max(500, Math.floor(oldSalary * totalRate));
    const newSalary = oldSalary + raiseAmount;
    const totalPct = Math.round((raiseAmount / oldSalary) * 1000) / 10;
    const happinessGain = meritRate > 0 ? 8 : 0;
    const logMessage = meritRate > 0
        ? `Outstanding performance! Received an annual raise (+${totalPct}%, +${Utils.formatMoney(raiseAmount)}) at ${user.jobTitle} to ${Utils.formatMoney(newSalary)}/yr. (+${happinessGain} Happiness)`
        : `Annual cost-of-living raise (+${totalPct}%): Your salary as ${user.jobTitle} increased by ${Utils.formatMoney(raiseAmount)} to ${Utils.formatMoney(newSalary)}/yr.`;

    return {
        applied: true,
        isPartTime: false,
        oldSalary,
        newSalary,
        raiseAmount,
        baseRate,
        meritRate,
        totalRate,
        totalPct,
        hasMerit: meritRate > 0,
        happinessGain,
        logMessage
    };
}

export function getRaiseRequestTerms(user) {
    if (!user || !user.jobTitle || user.careerTrack === 'mafia_syndicate' || user.careerTrack === 'pro_athlete') {
        return { eligible: false, isPartTime: false, chance: 0, raiseRate: 0, raisePct: 0, raiseAmount: 0 };
    }
    const salary = Number(user.jobSalary) || 0;
    if (salary <= 0) {
        return { eligible: false, isPartTime: isPartTimeJob(user), chance: 0, raiseRate: 0, raisePct: 0, raiseAmount: 0 };
    }

    const partTime = isPartTimeJob(user);
    const perf = clampStat(user.jobPerformance ?? 50, 50);
    const smarts = clampStat(user.smarts ?? user.stats?.smarts ?? 50, 50);
    const tenure = Math.max(0, Number(user.yearsInCareer) || 0);

    let baseChance;
    if (perf >= 90) {
        baseChance = 0.85;
    } else if (perf >= 75) {
        baseChance = 0.65 + ((perf - 75) / 15) * 0.15;
    } else if (perf >= 50) {
        baseChance = 0.35 + ((perf - 50) / 25) * 0.25;
    } else if (perf >= 30) {
        baseChance = 0.15 + ((perf - 30) / 20) * 0.15;
    } else {
        baseChance = 0.10;
    }

    if (smarts >= 70) baseChance += 0.05;
    baseChance += Math.min(0.10, tenure * 0.03);
    const chance = Math.round(Math.max(0.10, Math.min(0.95, baseChance)) * 100) / 100;

    let raiseRate;
    let raiseAmount;
    if (partTime) {
        raiseRate = perf >= 80 ? 0.03 : 0.02;
        raiseAmount = Math.max(150, Math.round(salary * raiseRate));
    } else {
        const skillBonuses = getCareerSkillBonuses(user, user.careerTrack);
        raiseRate = perf >= 80 ? (skillBonuses?.raiseRate || 0.05) : 0.05;
        raiseAmount = Math.max(1000, Math.round(salary * raiseRate));
    }

    const raisePct = Math.round(raiseRate * 100);
    return {
        eligible: !user.raiseRequestedThisYear,
        isPartTime: partTime,
        chance,
        raiseRate,
        raisePct,
        raiseAmount
    };
}

export function processRaiseRequest(user, roll = Math.random()) {
    if (!user || !user.jobTitle) {
        return { success: false, approved: false, message: 'You do not currently have a job.' };
    }
    if (!isAlive(user)) {
        return { success: false, approved: false, message: 'Cannot request a raise while deceased.' };
    }
    if (user.careerTrack === 'mafia_syndicate' || user.careerTrack === 'pro_athlete') {
        return { success: false, approved: false, message: 'Raises are not available for this special career.' };
    }
    if (user.raiseRequestedThisYear) {
        return { success: false, approved: false, message: 'You have already requested a raise this year. Age up to ask again.' };
    }

    const terms = getRaiseRequestTerms(user);
    if (terms.raiseAmount <= 0) {
        return { success: false, approved: false, message: 'No active salary to raise.' };
    }

    user.raiseRequestedThisYear = true;
    const approved = roll < terms.chance;

    if (approved) {
        const oldSalary = user.jobSalary;
        user.jobSalary = oldSalary + terms.raiseAmount;
        if (!user.peakJobTitle || user.jobSalary >= (user.peakJobSalary || 0)) {
            user.peakJobTitle = user.jobTitle;
            user.peakJobSalary = user.jobSalary;
        }
        const happyGain = terms.isPartTime ? 6 : 8;
        adjustStat(user, 'happiness', happyGain);
        const wageSuffix = terms.isPartTime ? ` (${formatHourlyWage(user.jobSalary)}/hr)` : '';
        const logMessage = terms.isPartTime
            ? `Asked for a part-time raise as ${user.jobTitle} and got +${terms.raisePct}% (+${Utils.formatMoney(terms.raiseAmount)}/yr)! New pay: ${Utils.formatMoney(user.jobSalary)}/yr${wageSuffix}. (+${happyGain} Happiness)`
            : `Negotiated a +${terms.raisePct}% raise (+${Utils.formatMoney(terms.raiseAmount)}/yr) as ${user.jobTitle}! New salary: ${Utils.formatMoney(user.jobSalary)}/yr. (+${happyGain} Happiness)`;

        return {
            success: true,
            approved: true,
            isPartTime: terms.isPartTime,
            oldSalary,
            newSalary: user.jobSalary,
            raiseAmount: terms.raiseAmount,
            raisePct: terms.raisePct,
            chance: terms.chance,
            happinessDelta: happyGain,
            perfDelta: 0,
            logMessage,
            message: terms.isPartTime
                ? `Your supervisor approved a +${terms.raisePct}% (${Utils.formatMoney(terms.raiseAmount)}/yr) part-time raise! Your new pay is ${Utils.formatMoney(user.jobSalary)}/yr (${formatHourlyWage(user.jobSalary)}/hr).`
                : `Your manager approved your +${terms.raisePct}% (${Utils.formatMoney(terms.raiseAmount)}/yr) raise! Your new salary is ${Utils.formatMoney(user.jobSalary)}/yr.`
        };
    }

    const perf = clampStat(user.jobPerformance ?? 50, 50);
    let perfDelta = 0;
    if (perf < 40) {
        const nextPerf = Math.max(0, perf - 5);
        perfDelta = nextPerf - perf;
        user.jobPerformance = nextPerf;
    }
    adjustStat(user, 'happiness', -3);

    const logMessage = perfDelta < 0
        ? `Asked for a raise at ${user.jobTitle} despite low performance and was denied. (-3 Happiness, ${perfDelta}% Performance)`
        : `Asked for a raise at ${user.jobTitle}, but management turned it down for now. (-3 Happiness)`;

    return {
        success: true,
        approved: false,
        isPartTime: terms.isPartTime,
        oldSalary: user.jobSalary,
        newSalary: user.jobSalary,
        raiseAmount: 0,
        raisePct: terms.raisePct,
        chance: terms.chance,
        happinessDelta: -3,
        perfDelta,
        logMessage,
        message: perfDelta < 0
            ? `Your boss rejected your raise request and warned you to improve your ${perf}% performance first.`
            : `Your manager turned down your raise request due to tight budgets, but encouraged you to keep up the effort.`
    };
}
