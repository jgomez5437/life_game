import { Utils } from '../../ui/utils.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, VC_INVESTOR_TYPES } from '../../features/business/businessTypes.js';
import { clampStat, isAlive } from './playerStatsLogic.js';
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

export function ensureBusinessState(user) {
    if (!user || !user.hasBusiness) return;

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
