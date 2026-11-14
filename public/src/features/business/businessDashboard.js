import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { saveGame } from '../../core/main.js';
import { SUPPLIERS } from '../../core/constants.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, MARKETING_CHANNELS, BUSINESS_DECISION_EVENTS } from './businessTypes.js';
import { GameLogic } from '../../core/gameLogic.js';
import { unlockAchievement } from '../../core/achievementManager.js';
import { SoundManager } from '../../core/soundManager.js';
import {
    BUSINESS_UPGRADES,
    renderTabOverview,
    renderTabOperations,
    renderTabMarketing,
    renderTabHR,
    renderTabFinance,
    attachDashboardListeners,
    updateDashboardCalculations
} from './businessTabsRenderer.js';
export { BUSINESS_UPGRADES };

let activeBusinessTab = 'overview';
let isProcessingBusinessAction = false;


export function enterBusinessMode() {
    renderBusinessDashboard();
}

export function setBusinessTab(tabId) {
    activeBusinessTab = tabId;
    renderBusinessDashboard();
    UI.scrollTabIntoView('business-tab-nav', `[data-action="setBusinessTab"][data-args*="${activeBusinessTab}"]`, { behavior: 'smooth', align: 'center' });
}

// ─── MAIN DASHBOARD RENDER ───────────────────────────────────────────────────

export function renderBusinessDashboard() {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness) {
        renderActivities();
        return;
    }

    GameLogic.ensureBusinessState(user);

    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const valuation = GameLogic.calculateCompanyValuation(user);
    const overhead = GameLogic.calculateBusinessOverhead(user);

    // Dynamic Tab Navigation Bar
    const tabs = [
        { id: 'overview',   name: 'HQ Overview',   icon: 'fa-landmark' },
        { id: 'operations', name: 'Operations',    icon: 'fa-industry' },
        { id: 'marketing',  name: 'Sales & Growth', icon: 'fa-bullhorn' },
        { id: 'hr',         name: 'HR & Culture',  icon: 'fa-users' },
        { id: 'finance',    name: 'Finance & VC',  icon: 'fa-coins' }
    ];

    const tabNavHtml = `
        <div id="business-tab-nav" class="flex border-b border-slate-700 mb-6 space-x-1 overflow-x-auto pb-1 touch-pan-x overscroll-contain select-none">
            ${tabs.map(t => `
                <button data-action="setBusinessTab" data-args="&apos;${t.id}&apos;"
                        class="px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${activeBusinessTab === t.id ? 'bg-indigo-600 text-white border-b-2 border-indigo-400 font-extrabold shadow-sm' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700'}">
                    <i class="fas ${t.icon}"></i> ${t.name}
                </button>
            `).join('')}
        </div>
    `;

    // Last quarter banner
    const lastEntry = user.businessHistory[user.businessHistory.length - 1];
    const lastEventBanner = (lastEntry && lastEntry.event)
        ? `<div class="bg-indigo-900/40 border border-indigo-500/40 rounded-xl p-3 mb-4 text-xs text-indigo-200 flex items-center justify-between">
               <span class="flex items-center gap-2"><i class="fas fa-bolt text-yellow-400"></i> <strong>Last Qtr Event:</strong> ${Utils.escapeHtml(lastEntry.event)}</span>
               <span class="${lastEntry.profit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono font-bold">${lastEntry.profit >= 0 ? '+' : ''}${Utils.formatMoney(lastEntry.profit)}</span>
           </div>`
        : '';

    let contentHtml = '';

    if (activeBusinessTab === 'overview') {
        contentHtml = renderTabOverview(user, ind, hq, valuation, overhead);
    } else if (activeBusinessTab === 'operations') {
        contentHtml = renderTabOperations(user, ind, hq, overhead);
    } else if (activeBusinessTab === 'marketing') {
        contentHtml = renderTabMarketing(user, ind);
    } else if (activeBusinessTab === 'hr') {
        contentHtml = renderTabHR(user, ind);
    } else if (activeBusinessTab === 'finance') {
        contentHtml = renderTabFinance(user, ind, valuation, overhead);
    }

    const prevScrollLeft = document.getElementById('business-tab-nav')?.scrollLeft;

    UI.updateBottomNav('work');
    UI.renderScreen(`
        <div class="fade-in pb-24 max-w-4xl mx-auto">
            <!-- Header Top Bar -->
            <div class="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                <div class="flex items-center gap-3 min-w-0">
                    <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50 flex-shrink-0">
                        <i class="fas fa-arrow-left"></i> Exit Office
                    </button>
                    <div class="min-w-0">
                        <h1 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2 truncate">
                            <span class="truncate">${Utils.escapeHtml(user.companyName)}</span>
                            <span class="text-xs font-normal px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                                Y${user.companyYear} Q${user.companyQuarter}
                            </span>
                        </h1>
                        <div class="text-xs text-slate-400 truncate">${ind.name} &bull; ${hq.name}</div>
                    </div>
                </div>
                <div class="flex items-center gap-4 flex-shrink-0 ml-auto">
                    <div class="text-right">
                        <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Company Treasury</div>
                        <div class="text-base sm:text-lg font-bold text-green-400 font-mono" title="${Utils.formatMoney(user.compCash)}">${Utils.formatCompactMoney(user.compCash)}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Est. Valuation</div>
                        <div class="text-base sm:text-lg font-bold text-indigo-300 font-mono" title="${Utils.formatMoney(valuation)}">${Utils.formatCompactMoney(valuation)}</div>
                    </div>
                </div>
            </div>

            ${lastEventBanner}
            ${tabNavHtml}
            ${contentHtml}
        </div>
    `);

    attachDashboardListeners();
    updateDashboardCalculations();
    UI.preserveTabScroll('business-tab-nav', `[data-action="setBusinessTab"][data-args*="${activeBusinessTab}"]`, prevScrollLeft);
}


// ─── PROCESS QUARTER (MANUAL TURN) ───────────────────────────────────────────

export function processQuarter() {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness) return;

    const check = GameLogic.canProcessBusinessQuarter(user);
    if (!check.allowed) {
        UI.showModal('Fiscal Year Limit', check.reason || 'You need to age up before continuing a new fiscal year.');
        return;
    }

    GameLogic.ensureBusinessState(user);

    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const overhead = GameLogic.calculateBusinessOverhead(user);

    const maxProduction = Math.floor(user.employees * ind.capacityPerEmployee * hq.capacityBonus);
    const effectiveProd = Math.min(user.productionTarget, maxProduction);

    const prodCost = effectiveProd * (ind.unitCost * supplier.costMod);
    const empWages = user.employees * user.salaryOffer * 3;
    const ceoWages = user.ceoSalary * 3;
    const totalExpenses = prodCost + empWages + ceoWages + overhead.totalQuarterly;

    if (totalExpenses > user.compCash) {
        UI.showModal('Bankruptcy Risk', 'Company has insufficient funds in company cash to pay quarterly expenses! Lower production or adjust salaries.');
        return;
    }

    user.compCash = Math.min(GameLogic.MAX_COMPANY_CASH || 999999999999999, Math.max(0, user.compCash - totalExpenses));
    user.money    = Math.min(GameLogic.MAX_PLAYER_MONEY || 999999999999999, (user.money || 0) + ceoWages);

    // Check random decision event
    let activeEvent = null;
    if (Math.random() < 0.25) {
        const randIndex = Math.floor(Math.random() * BUSINESS_DECISION_EVENTS.length);
        activeEvent = BUSINESS_DECISION_EVENTS[randIndex];
    }

    // Revenue calculations
    const priceRatio = user.sellingPrice > 0 ? ind.unitPrice / user.sellingPrice : 1;
    const priceFactor = Math.pow(priceRatio, 1.4);
    const repFactor = 0.5 + (user.businessReputation / 100);
    const volatility = 1 + ((Math.random() - 0.5) * ind.volatility * 2);

    let mktBoost = 1.0;
    if (user.marketingLevels) {
        MARKETING_CHANNELS.forEach(ch => {
            const lvl = user.marketingLevels[ch.id] || 0;
            mktBoost += ch.demandBoost * lvl;
        });
    }

    const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility * mktBoost);
    const available = user.inventory + effectiveProd;
    const sold = Math.min(available, actualDemand);

    const maxInventory = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 4 : 2);
    user.inventory = Math.min(available - sold, maxInventory);

    const revenue = sold * user.sellingPrice;
    user.compCash = Math.min(GameLogic.MAX_COMPANY_CASH || 999999999999999, user.compCash + revenue);
    const profit = revenue - totalExpenses;

    user.businessHistory.push({
        year: user.companyYear,
        quarter: user.companyQuarter,
        profit,
        revenue,
        event: activeEvent ? activeEvent.name : null
    });

    const isFiscalYearEnding = user.companyQuarter === 4;
    GameLogic.recordBusinessQuarterProcessed(user, isFiscalYearEnding);

    user.companyQuarter++;

    // Trigger Decision Event modal if fired
    if (activeEvent) {
        showDecisionEventModal(activeEvent, () => {
            finishQuarterTurnProcessing(user);
        });
    } else {
        finishQuarterTurnProcessing(user);
    }
}

function finishQuarterTurnProcessing(user) {
    if (user.companyQuarter > 4) {
        user.companyQuarter = 1;
        user.companyYear++;
        const annualRevenue = user.businessHistory.slice(-4).reduce((s, q) => s + q.revenue, 0);
        addLog(`${user.companyName} fiscal year complete. Annual Revenue: ${Utils.formatMoney(annualRevenue)}.`, 'major');
        UI.showModal(
            'Annual Fiscal Report',
            `<div class="text-sm space-y-2">
                <p>Fiscal Year complete! You must age up to start the next fiscal year.</p>
                <div class="flex justify-between border-t border-slate-700 pt-2"><span class="text-slate-400">Annual Revenue</span><span class="text-green-400 font-bold">${Utils.formatMoney(annualRevenue)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Company Treasury</span><span class="font-bold text-white">${Utils.formatMoney(user.compCash)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Personal Bank</span><span class="font-bold text-white">${Utils.formatMoney(user.money)}</span></div>
             </div>`,
            () => renderLifeDashboard(state.gameState)
        );
    } else {
        const lastQ = user.businessHistory[user.businessHistory.length - 1];
        addLog(`${user.companyName} Q${user.companyQuarter - 1}: Revenue ${Utils.formatMoney(lastQ.revenue)}, Profit ${Utils.formatMoney(lastQ.profit)}.`, lastQ.profit >= 0 ? 'good' : 'bad');
        renderBusinessDashboard();
    }
}

// ─── DECISION EVENT MODAL ───────────────────────────────────────────────────

function showDecisionEventModal(eventObj, onComplete) {
    const choicesHtml = eventObj.choices.map((c, i) => `
        <button data-action="chooseEventChoice" data-args="${i}"
                class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded-xl text-left transition flex justify-between items-center">
            <div>
                <div class="font-bold text-white text-sm">${c.text}</div>
                ${c.cost > 0 ? `<div class="text-xs text-red-400 font-mono">Cost: ${Utils.formatMoney(c.cost)}</div>` : ''}
            </div>
            <i class="fas fa-chevron-right text-slate-500"></i>
        </button>
    `).join('');

    UI.showCustomModal({
        title: eventObj.name,
        content: `
            <div class="space-y-4">
                <div class="text-xs text-yellow-300 font-bold flex items-center gap-2 mb-1">
                    <i class="fas ${eventObj.icon}"></i> Executive Decision Required
                </div>
                <p class="text-sm text-slate-300 mb-4">${eventObj.description}</p>
                <div class="space-y-2 pt-1">${choicesHtml}</div>
            </div>
        `,
        showCloseBtn: false
    });

    // Attach temporary choice handler
    window._activeEventChoices = eventObj.choices;
    window._activeEventOnComplete = onComplete;
}

export function chooseEventChoice(indexStr) {
    const user = state.gameState.user;
    const index = parseInt(indexStr, 10);
    const choices = window._activeEventChoices;
    const onComplete = window._activeEventOnComplete;

    if (choices && choices[index]) {
        const choice = choices[index];
        if (choice.cost > 0) user.compCash = Math.max(0, user.compCash - choice.cost);
        if (choice.repDelta) user.businessReputation = Math.max(0, Math.min(100, user.businessReputation + choice.repDelta));
        if (choice.moraleDelta) user.employeeMorale = Math.max(0, Math.min(100, user.employeeMorale + choice.moraleDelta));
        if (choice.revenueBonus) user.compCash += choice.revenueBonus;

        addLog(`Company Decision: ${choice.logText}`, choice.repDelta < 0 ? 'bad' : 'good');
        if (typeof saveGame === 'function') saveGame();
    }

    UI.hideModal();
    if (onComplete) onComplete();
}

// ─── ACTION HANDLERS ─────────────────────────────────────────────────────────

export function selectSupplierDashboard(supplierId) {
    const user = state.gameState.user;
    user.supplierId = supplierId;
    addLog(`Switched company logistics supplier to ${supplierId}.`, 'good');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function upgradeHQTier(hqId) {
    const user = state.gameState.user;
    const hq = HQ_TIERS.find(h => h.id === hqId);
    if (!hq) return;

    if (user.compCash < hq.cost) {
        UI.showModal('Insufficient Funds', `You need ${Utils.formatMoney(hq.cost)} in company treasury to relocate HQ.`);
        return;
    }

    user.compCash -= hq.cost;
    user.hqTier = hqId;
    user.employeeMorale = Math.min(100, user.employeeMorale + hq.moraleBonus);
    addLog(`Relocated ${user.companyName} headquarters to ${hq.name}!`, 'major');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function upgradeMarketingChannel(channelId) {
    const user = state.gameState.user;
    GameLogic.ensureBusinessState(user);

    const ch = MARKETING_CHANNELS.find(c => c.id === channelId);
    if (!ch) return;

    const currentLvl = user.marketingLevels[channelId] || 0;
    const cost = ch.costPerLevel * (currentLvl + 1);

    if (user.compCash < cost) {
        UI.showModal('Insufficient Treasury', `Need ${Utils.formatMoney(cost)} in company cash.`);
        return;
    }

    user.compCash -= cost;
    user.marketingLevels[channelId] = currentLvl + 1;
    user.businessReputation = Math.min(100, user.businessReputation + 5);
    addLog(`Boosted ${ch.name} marketing campaign to Level ${currentLvl + 1}!`, 'good');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function adjustRoleCount(roleId, deltaStr) {
    const user = state.gameState.user;
    GameLogic.ensureBusinessState(user);

    const delta = parseInt(deltaStr, 10);
    const current = user.teamRoles[roleId] || 0;
    if (current + delta < 0) return;

    user.teamRoles[roleId] = current + delta;
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function acceptVCPitch(investorId) {
    if (isProcessingBusinessAction) return;
    isProcessingBusinessAction = true;

    try {
        const user = state.gameState?.user;
        if (!user || !user.hasBusiness) return;

        if (user.isPublic) {
            UI.showModal('Public Company', 'Publicly traded corporations cannot accept private early-stage VC investments.');
            return;
        }

        if (user.investorShares && user.investorShares.some(s => s.investorId === investorId)) {
            UI.showModal('Offer Already Accepted', 'You have already secured funding from this investor.');
            return;
        }

        const res = GameLogic.acceptVCOffer(user, investorId);
        if (res.success) {
            addLog(res.msg, 'major');
            if (typeof saveGame === 'function') saveGame();
            UI.showModal('Investment Secured!', res.msg);
        } else {
            UI.showModal('Offer Failed', res.msg);
        }
        renderBusinessDashboard();
    } finally {
        isProcessingBusinessAction = false;
    }
}

export function launchIPO() {
    const user = state.gameState?.user;
    if (!user || !user.hasBusiness) return;

    if (user.isPublic) {
        UI.showModal('Already Public', `${Utils.escapeHtml(user.companyName)} is already a publicly traded corporation.`);
        return;
    }

    if (isProcessingBusinessAction) return;

    const valuation = GameLogic.calculateCompanyValuation(user);
    if (valuation < 25000000) {
        UI.showModal('IPO Ineligible', `Your company needs an estimated valuation of at least $25,000,000 to file for an Initial Public Offering (Current: ${Utils.formatMoney(valuation)}).`);
        return;
    }

    const float = 0.20;
    if (user.equityOwned < float) {
        UI.showModal('Insufficient Equity', `You need at least ${Math.round(float * 100)}% equity to float on the public stock exchange.`);
        return;
    }

    const playerPayout = Math.floor(valuation * float);

    UI.showConfirm(
        'Initial Public Offering (IPO)',
        `Take <strong>${Utils.escapeHtml(user.companyName)}</strong> public on the stock exchange?<br><br>` +
        `Public Listing Valuation: <span class="text-green-400 font-bold font-mono">${Utils.formatMoney(valuation)}</span><br>` +
        `Float 20% Public Shares for <span class="text-yellow-400 font-bold font-mono">${Utils.formatMoney(playerPayout)}</span> Founder Payout.<br>` +
        `<span class="text-xs text-slate-400">Your equity ownership will adjust from ${Math.round(user.equityOwned * 100)}% to ${Math.round((user.equityOwned - float) * 100)}%.</span>`,
        'Ring the Bell (Launch IPO)',
        () => {
            if (isProcessingBusinessAction) return;
            if (!user.hasBusiness || user.isPublic) return;
            isProcessingBusinessAction = true;
            try {
                const res = GameLogic.launchIPO(user, float);
                if (res.success) {
                    SoundManager.play('milestone');
                    unlockAchievement('unicorn_tycoon', user);
                    GameLogic.adjustStat(user, 'happiness', 35);
                    UI.updateHeader(user);
                    addLog(res.msg, 'major');
                    if (typeof saveGame === 'function') saveGame();
                    UI.showModal('🎉 Historic IPO Listing!', res.msg);
                } else {
                    UI.showModal('IPO Failed', res.msg);
                }
                renderBusinessDashboard();
            } finally {
                isProcessingBusinessAction = false;
            }
        }
    );
}

export function hireEmployee() {
    const user = state.gameState.user;
    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];

    if (user.employees >= hq.maxEmployees) {
        UI.showModal('HQ Capacity Reached', `Current HQ (${hq.name}) supports up to ${hq.maxEmployees} employees. Upgrade your HQ facilities to recruit more staff.`);
        return;
    }

    const cost = ind.baseSalary * 2;
    if (user.compCash < cost) {
        UI.showModal('Cannot Hire', `You need ${Utils.formatMoney(cost)} in company cash to recruit staff.`);
        return;
    }

    user.compCash -= cost;
    user.employees++;
    addLog(`Recruited new staff at ${user.companyName}. Total headcount: ${user.employees}.`, 'good');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function layoffEmployee() {
    const user = state.gameState.user;
    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;

    if (user.employees <= 1) {
        UI.showModal('Cannot Layoff', 'You must maintain at least 1 core employee.');
        return;
    }

    const severance = Math.floor(ind.baseSalary * 1.5);
    user.compCash = Math.max(0, user.compCash - severance);
    user.employees--;
    user.employeeMorale = Math.max(0, user.employeeMorale - 10);
    addLog(`Laid off staff member. Severance paid: ${Utils.formatMoney(severance)}.`, 'bad');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

export function sellBusiness() {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness || isProcessingBusinessAction) return;

    const MAX_PLAYER_MONEY = GameLogic.MAX_PLAYER_MONEY || 999999999999999;
    const valuation = GameLogic.calculateCompanyValuation(user);
    const playerPayout = Math.min(MAX_PLAYER_MONEY, Math.floor(valuation * user.equityOwned));

    UI.showConfirm(
        'Sell Company (Corporate Exit)',
        `Sell <strong>${Utils.escapeHtml(user.companyName)}</strong> for <span class="text-green-400 font-bold">${Utils.formatMoney(playerPayout)}</span>?<br><span class="text-xs text-slate-400">Calculated based on valuation ${Utils.formatMoney(valuation)} × your ${Math.round(user.equityOwned * 100)}% equity ownership.</span>`,
        'Confirm Exit Sale',
        () => {
            if (isProcessingBusinessAction || !user || !user.hasBusiness) return;
            isProcessingBusinessAction = true;
            try {
                user.money = Math.min(MAX_PLAYER_MONEY, (user.money || 0) + playerPayout);
                GameLogic.adjustStat(user, 'happiness', 30);
                UI.updateHeader(user);
                addLog(`Completed acquisition sale of ${user.companyName} for ${Utils.formatMoney(playerPayout)}! (+30 Happiness)`, 'major');

                user.hasBusiness        = false;
                user.isPublic           = false;
                user.companyName        = null;
                user.compCash           = 0;
                user.companyYear        = 1;
                user.companyQuarter     = 1;
                user.employees          = 0;
                user.businessReputation = 0;
                user.inventory          = 0;
                user.productionTarget   = 0;
                user.sellingPrice       = 0;
                user.salaryOffer        = 0;
                user.ceoSalary          = 0;
                user.supplierId         = null;
                user.industry           = null;
                user.hqTier             = 'garage';
                user.marketingLevels    = { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 };
                user.teamRoles          = { engineering: 0, sales: 0, operations: 0, marketing: 0 };
                user.equityOwned        = 1.0;
                user.investorShares     = [];
                user.businessHistory    = [];
                user.businessUpgrades   = [];
                GameLogic.resetBusinessQuarterTracking(user);
                if (typeof saveGame === 'function') saveGame();
                renderActivities();
            } finally {
                isProcessingBusinessAction = false;
            }
        }
    );
}

export function purchaseUpgrade(upgradeId) {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness) return;
    GameLogic.ensureBusinessState(user);

    const upgrade = BUSINESS_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (user.businessUpgrades.includes(upgradeId)) {
        UI.showModal('Already Purchased', `You already own the ${upgrade.name} upgrade.`);
        return;
    }

    if (user.compCash < upgrade.cost) {
        UI.showModal('Insufficient Treasury', `Need ${Utils.formatMoney(upgrade.cost)} in company treasury.`);
        return;
    }

    user.compCash -= upgrade.cost;
    user.businessUpgrades.push(upgradeId);

    if (upgradeId === 'marketing_boost') {
        user.businessReputation = Math.min(100, user.businessReputation + 15);
    } else if (upgradeId === 'hr_perks') {
        user.employeeMorale = Math.min(100, user.employeeMorale + 20);
    }

    addLog(`${user.companyName} purchased corporate upgrade: ${upgrade.name}.`, 'good');
    if (typeof saveGame === 'function') saveGame();
    renderBusinessDashboard();
}

// ─── AUTO PROCESS QUARTER (CALLED BY AGE UP) ───────────────────────────────

export function autoProcessBusinessQuarter(user) {
    if (!user || !user.hasBusiness) return;
    GameLogic.ensureBusinessState(user);

    const count = GameLogic.calculateAutoQuarterCount(user);
    for (let i = 0; i < count; i++) {
        executeSingleAutoQuarter(user);
    }
    user.lastBusinessAge = user.age - 1;
    user.quartersProcessedThisAge = 4;
}

function executeSingleAutoQuarter(user) {
    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const overhead = GameLogic.calculateBusinessOverhead(user);

    const maxProduction = Math.floor(user.employees * ind.capacityPerEmployee * hq.capacityBonus);
    const effectiveProd = Math.min(user.productionTarget, maxProduction);

    const prodCost = effectiveProd * (ind.unitCost * supplier.costMod);
    const empWages = user.employees * user.salaryOffer * 3;
    const ceoWages = (user.ceoSalary || 0) * 3;
    const operatingExpenses = prodCost + empWages + overhead.totalQuarterly;

    // Ensure CEO salary cannot exceed available company funds
    const cashBeforeCEO = Math.max(0, (user.compCash || 0) - operatingExpenses);
    const payableCeoWages = Math.min(ceoWages, cashBeforeCEO);
    const totalExpenses = operatingExpenses + payableCeoWages;

    user.compCash = Math.min(GameLogic.MAX_COMPANY_CASH || 999999999999999, Math.max(0, user.compCash - totalExpenses));
    user.money   = Math.min(GameLogic.MAX_PLAYER_MONEY || 999999999999999, (user.money || 0) + payableCeoWages);

    const priceRatio = user.sellingPrice > 0 ? ind.unitPrice / user.sellingPrice : 1;
    const priceFactor = Math.pow(priceRatio, 1.4);
    const repFactor = 0.5 + (user.businessReputation / 100);
    const volatility = 1 + ((Math.random() - 0.5) * ind.volatility * 2);

    let mktBoost = 1.0;
    if (user.marketingLevels) {
        MARKETING_CHANNELS.forEach(ch => {
            const lvl = user.marketingLevels[ch.id] || 0;
            mktBoost += ch.demandBoost * lvl;
        });
    }

    const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility * mktBoost);
    const available = user.inventory + effectiveProd;
    const sold = Math.min(available, actualDemand);

    const maxInventory = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 4 : 2);
    user.inventory = Math.min(available - sold, maxInventory);

    const revenue = sold * user.sellingPrice;
    user.compCash = Math.min(GameLogic.MAX_COMPANY_CASH || 999999999999999, user.compCash + revenue);
    const profit = revenue - totalExpenses;

    user.businessHistory.push({
        year: user.companyYear,
        quarter: user.companyQuarter,
        profit,
        revenue,
        event: null
    });

    user.companyQuarter++;
    if (user.companyQuarter > 4) {
        user.companyQuarter = 1;
        user.companyYear++;
    }
}
