import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { SUPPLIERS } from '../../core/main.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, MARKETING_CHANNELS, SPECIALIZED_ROLES, VC_INVESTOR_TYPES, BUSINESS_DECISION_EVENTS } from './businessTypes.js';
import { GameLogic } from '../../core/gameLogic.js';

let activeBusinessTab = 'overview';

// ─── UPGRADES ─────────────────────────────────────────────────────────────

export const BUSINESS_UPGRADES = [
    { id: 'marketing_boost', name: 'Brand PR Blitz',       icon: 'fa-bullhorn',      description: '+15 Reputation & Brand Trust.', cost: 25000 },
    { id: 'warehouse',       name: 'Logistics Expansion', icon: 'fa-warehouse',     description: 'Doubles inventory carry & warehouse capacity.', cost: 50000 },
    { id: 'rd_lab',          name: 'R&D Innovation Lab',  icon: 'fa-flask',         description: 'Increases max price ceiling & product demand by 40%.', cost: 75000 },
    { id: 'hr_perks',        name: 'Executive Benefits',  icon: 'fa-gift',          description: '+20% Employee Morale & lowers layoff severance.', cost: 30000 },
    { id: 'qa_automation',   name: 'QA & AI Automation',  icon: 'fa-robot',         description: 'Reduces unit production cost by 20%.', cost: 60000 }
];

export function enterBusinessMode() {
    renderBusinessDashboard();
}

export function setBusinessTab(tabId) {
    activeBusinessTab = tabId;
    renderBusinessDashboard();
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
        <div class="flex border-b border-slate-700 mb-6 space-x-1 overflow-x-auto pb-1">
            ${tabs.map(t => `
                <button data-action="setBusinessTab" data-args="&apos;${t.id}&apos;"
                        class="px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${activeBusinessTab === t.id ? 'bg-indigo-600 text-white border-b-2 border-indigo-400' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700'}">
                    <i class="fas ${t.icon}"></i> ${t.name}
                </button>
            `).join('')}
        </div>
    `;

    // Last quarter banner
    const lastEntry = user.businessHistory[user.businessHistory.length - 1];
    const lastEventBanner = (lastEntry && lastEntry.event)
        ? `<div class="bg-indigo-900/40 border border-indigo-500/40 rounded-xl p-3 mb-4 text-xs text-indigo-200 flex items-center justify-between">
               <span class="flex items-center gap-2"><i class="fas fa-bolt text-yellow-400"></i> <strong>Last Qtr Event:</strong> ${lastEntry.event}</span>
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

    UI.renderScreen(`
        <div class="fade-in pb-24 max-w-4xl mx-auto">
            <!-- Header Top Bar -->
            <div class="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                <div class="flex items-center gap-3">
                    <button data-action="renderActivities" class="text-slate-400 hover:text-white text-sm p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition">
                        <i class="fas fa-arrow-left"></i> Exit Office
                    </button>
                    <div>
                        <h1 class="text-xl font-bold text-white flex items-center gap-2">
                            ${user.companyName}
                            <span class="text-xs font-normal px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                                Y${user.companyYear} Q${user.companyQuarter}
                            </span>
                        </h1>
                        <div class="text-xs text-slate-400">${ind.name} &bull; ${hq.name}</div>
                    </div>
                </div>
                <div class="text-right flex items-center gap-4">
                    <div>
                        <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Company Treasury</div>
                        <div class="text-xl font-bold text-green-400 font-mono">${Utils.formatMoney(user.compCash)}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Est. Valuation</div>
                        <div class="text-xl font-bold text-indigo-300 font-mono">${Utils.formatMoney(valuation)}</div>
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
}

// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────────────

function renderTabOverview(user, ind, hq, valuation, overhead) {
    const recent = user.businessHistory.slice(-4);
    const annRev = recent.reduce((sum, q) => sum + (q.revenue || 0), 0);
    const annProfit = recent.reduce((sum, q) => sum + (q.profit || 0), 0);

    return `
        <div class="space-y-6">
            <!-- HQ Visual Hero Banner -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <div class="absolute -right-6 -bottom-6 text-slate-800/40 text-9xl pointer-events-none">
                    <i class="fas ${hq.icon}"></i>
                </div>
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <div class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">HQ Headquarters</div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i class="fas ${hq.icon} text-indigo-400"></i> ${hq.name}
                        </h2>
                        <p class="text-xs text-slate-300 mt-1 max-w-md">${hq.description}</p>
                        <div class="flex gap-4 mt-4 text-xs">
                            <span class="bg-slate-800/80 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
                                <i class="fas fa-users text-indigo-400 mr-1"></i> Capacity: ${user.employees}/${hq.maxEmployees}
                            </span>
                            <span class="bg-slate-800/80 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
                                <i class="fas fa-percentage text-green-400 mr-1"></i> Equity Owned: ${Math.round(user.equityOwned * 100)}%
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <button data-action="processQuarter" class="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg text-sm transition transform hover:-translate-y-0.5">
                            End Quarter (Q${user.companyQuarter}) &rarr;
                        </button>
                    </div>
                </div>
            </div>

            <!-- Metric Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div class="text-xs text-slate-400 mb-1">Trailing Annual Revenue</div>
                    <div class="text-xl font-bold text-white font-mono">${Utils.formatMoney(annRev)}</div>
                    <div class="text-[10px] text-slate-500 mt-1">Last 4 quarters</div>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div class="text-xs text-slate-400 mb-1">Trailing Annual Profit</div>
                    <div class="text-xl font-bold ${annProfit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono">
                        ${annProfit >= 0 ? '+' : ''}${Utils.formatMoney(annProfit)}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1">Net trailing cashflow</div>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div class="text-xs text-slate-400 mb-1">Customer Satisfaction</div>
                    <div class="text-xl font-bold text-blue-400">${user.customerSatisfaction}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-blue-400 h-1.5 rounded-full" style="width: ${user.customerSatisfaction}%"></div>
                    </div>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div class="text-xs text-slate-400 mb-1">Employee Morale</div>
                    <div class="text-xl font-bold text-amber-400">${user.employeeMorale}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-amber-400 h-1.5 rounded-full" style="width: ${user.employeeMorale}%"></div>
                    </div>
                </div>
            </div>

            <!-- Quarterly Forecast Card -->
            <div class="bg-slate-800 border border-slate-700 p-5 rounded-xl">
                <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2 flex justify-between">
                    <span><i class="fas fa-calculator mr-2"></i> Current Quarter Financial Forecast</span>
                    <span id="proj-status-badge" class="text-xs normal-case font-normal text-slate-400"></span>
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                        <div class="text-xs text-slate-400">Est. Revenue</div>
                        <div id="proj-rev" class="text-lg font-bold text-green-400 font-mono">$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Production / COGS</div>
                        <div id="proj-cost" class="text-lg font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Payroll & CEO Pay</div>
                        <div id="proj-wages" class="text-lg font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Fixed Overhead (HQ)</div>
                        <div class="text-lg font-bold text-red-400 font-mono">-${Utils.formatMoney(overhead.totalQuarterly)}</div>
                    </div>
                </div>
                <div class="border-t border-slate-700 pt-3 flex justify-between items-center font-bold">
                    <span class="text-slate-300">Projected Net Quarterly Profit:</span>
                    <span id="proj-profit" class="text-xl font-mono">$0</span>
                </div>
            </div>

            <!-- Quick Management Actions -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button data-action="setBusinessTab" data-args="&apos;operations&apos;" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left transition">
                    <i class="fas fa-industry text-indigo-400 text-lg mb-2"></i>
                    <div class="font-bold text-white text-sm">Operations & Tech</div>
                    <div class="text-xs text-slate-400">Adjust capacity & suppliers</div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;marketing&apos;" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left transition">
                    <i class="fas fa-bullhorn text-blue-400 text-lg mb-2"></i>
                    <div class="font-bold text-white text-sm">Pricing & Campaigns</div>
                    <div class="text-xs text-slate-400">Set prices & ad channels</div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;finance&apos;" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left transition col-span-2 md:col-span-1">
                    <i class="fas fa-coins text-yellow-400 text-lg mb-2"></i>
                    <div class="font-bold text-white text-sm">Raise VC / Corporate Debt</div>
                    <div class="text-xs text-slate-400">Pitch investors & check P&L</div>
                </button>
            </div>
        </div>
    `;
}

// ─── TAB 2: OPERATIONS & PRODUCTION ─────────────────────────────────────────

function renderTabOperations(user, ind, hq, overhead) {
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const maxProduction = Math.floor(user.employees * ind.capacityPerEmployee * hq.capacityBonus);
    const isWarehouseOwned = user.businessUpgrades.includes('warehouse');

    // Supplier choice cards
    const supplierOptions = SUPPLIERS.map(s => `
        <div data-action="selectSupplierDashboard" data-args="&apos;${s.id}&apos;"
             class="cursor-pointer border rounded-xl p-3 flex justify-between items-center transition ${user.supplierId === s.id ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700'}">
            <div>
                <div class="font-bold text-white text-sm">${s.name} Logistics</div>
                <div class="text-xs text-slate-400">${s.costMod}x cost modifier &bull; Quality ${s.quality}%</div>
            </div>
            ${user.supplierId === s.id ? '<span class="text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">Active</span>' : ''}
        </div>
    `).join('');

    // HQ upgrades list
    const hqUpgradeCards = HQ_TIERS.map(h => {
        const isCurrent = user.hqTier === h.id;
        const canAfford = user.compCash >= h.cost;
        return `
            <div class="bg-slate-800 border ${isCurrent ? 'border-indigo-500' : 'border-slate-700'} rounded-xl p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <i class="fas ${h.icon} text-2xl text-indigo-400 w-8 text-center"></i>
                    <div>
                        <div class="font-bold text-white text-sm">${h.name}</div>
                        <div class="text-xs text-slate-400">Rent: ${Utils.formatMoney(h.monthlyRent)}/mo &bull; Max Staff: ${h.maxEmployees}</div>
                        <div class="text-[11px] text-indigo-300">${h.description}</div>
                    </div>
                </div>
                ${isCurrent
                    ? `<span class="text-xs text-indigo-400 font-bold bg-indigo-950 border border-indigo-500/40 px-3 py-1 rounded-lg">Current HQ</span>`
                    : `<button data-action="upgradeHQTier" data-args="&apos;${h.id}&apos;"
                               class="text-xs font-bold px-3 py-2 rounded-lg ${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                               Upgrade ${Utils.formatMoney(h.cost)}
                           </button>`
                }
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-6">
            <!-- Production Volume Controller -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex justify-between items-center mb-3">
                    <div>
                        <h3 class="font-bold text-white text-base flex items-center gap-2">
                            <i class="fas fa-industry text-indigo-400"></i> Production & Capacity Output
                        </h3>
                        <div class="text-xs text-slate-400">Max Capacity: ${maxProduction.toLocaleString()} units (${user.employees} staff &bull; ${hq.name})</div>
                    </div>
                    <input type="number" id="num-prod" class="num-input w-28 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm text-right font-mono"
                           value="${user.productionTarget}" min="0" max="${maxProduction}">
                </div>
                <input type="range" id="rng-prod" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                       min="0" max="${maxProduction}" value="${user.productionTarget}">
                <div class="flex justify-between text-xs text-slate-400 mt-2">
                    <span>0 units</span>
                    <span>Inventory Stock: ${user.inventory.toLocaleString()} units ${isWarehouseOwned ? '(Warehouse Expanded)' : ''}</span>
                    <span>${maxProduction.toLocaleString()} max</span>
                </div>
            </div>

            <!-- Supplier & Logistics Selection -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-truck-loading text-indigo-400"></i> Supplier & Component Partner
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">${supplierOptions}</div>
            </div>

            <!-- Overhead Cost Breakdown -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-receipt text-indigo-400"></i> Quarterly Fixed Overhead Breakdown
                </h3>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between border-b border-slate-700 pb-1">
                        <span class="text-slate-400">HQ Facilities Lease Rent</span>
                        <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.quarterlyRent)}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-700 pb-1">
                        <span class="text-slate-400">Software, IT & Admin Licenses</span>
                        <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.empAdminOverhead)}</span>
                    </div>
                    ${overhead.debtInterest > 0 ? `
                        <div class="flex justify-between border-b border-slate-700 pb-1">
                            <span class="text-slate-400">Corporate Debt Interest</span>
                            <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.debtInterest)}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between pt-1 font-bold text-sm">
                        <span class="text-white">Total Overhead / Quarter</span>
                        <span class="font-mono text-red-400">-${Utils.formatMoney(overhead.totalQuarterly)}</span>
                    </div>
                </div>
            </div>

            <!-- HQ Facility Upgrades -->
            <div>
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-building-circle-arrow-right text-indigo-400"></i> Corporate HQ Relocation & Upgrades
                </h3>
                <div class="space-y-3">${hqUpgradeCards}</div>
            </div>
        </div>
    `;
}

// ─── TAB 3: SALES & MARKETING ────────────────────────────────────────────────

function renderTabMarketing(user, ind) {
    const minPrice = Math.floor(ind.unitPrice * 0.4);
    const maxPrice = Math.floor(ind.unitPrice * (user.businessUpgrades.includes('rd_lab') ? 4.5 : 3.0));

    // Marketing channel cards
    const channelsHtml = MARKETING_CHANNELS.map(ch => {
        const level = user.marketingLevels?.[ch.id] || 0;
        const upgradeCost = ch.costPerLevel * (level + 1);
        const canAfford = user.compCash >= upgradeCost;

        return `
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-lg">
                        <i class="fas ${ch.icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm flex items-center gap-2">
                            ${ch.name}
                            <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-mono">Lvl ${level}</span>
                        </div>
                        <div class="text-xs text-slate-400">${ch.description}</div>
                        <div class="text-[11px] text-green-400 mt-0.5">+${Math.round(ch.demandBoost * 100 * level)}% Demand Boost</div>
                    </div>
                </div>
                <button data-action="upgradeMarketingChannel" data-args="&apos;${ch.id}&apos;"
                        class="text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                    Boost ${Utils.formatMoney(upgradeCost)}
                </button>
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-6">
            <!-- Unit Pricing Slider -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <h3 class="font-bold text-white text-base flex items-center gap-2">
                            <i class="fas fa-tag text-indigo-400"></i> Unit Selling Price ($)
                        </h3>
                        <div class="text-xs text-slate-400">Standard Industry Base: ${Utils.formatMoney(ind.unitPrice)}</div>
                    </div>
                    <input type="number" id="num-price" class="num-input w-28 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm text-right font-mono"
                           value="${user.sellingPrice}" min="${minPrice}" max="${maxPrice}">
                </div>
                <input type="range" id="rng-price" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                       min="${minPrice}" max="${maxPrice}" value="${user.sellingPrice}">
                <div class="text-center mt-2 text-xs font-bold" id="price-impact"></div>
            </div>

            <!-- Marketing Campaigns -->
            <div>
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-bullhorn text-indigo-400"></i> Customer Acquisition & Marketing Channels
                </h3>
                <div class="space-y-3">${channelsHtml}</div>
            </div>
        </div>
    `;
}

// ─── TAB 4: HR & CULTURE ─────────────────────────────────────────────────────

function renderTabHR(user, ind) {
    const rolesHtml = SPECIALIZED_ROLES.map(r => {
        const count = user.teamRoles?.[r.id] || 1;
        return `
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-lg">
                        <i class="fas ${r.icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">${r.name}</div>
                        <div class="text-xs text-slate-400">${r.benefit}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Avg Salary: ${Utils.formatMoney(r.avgSalary)}/mo</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button data-action="adjustRoleCount" data-args="&apos;${r.id}&apos;, -1" class="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold">-</button>
                    <span class="font-bold text-white font-mono w-8 text-center">${count}</span>
                    <button data-action="adjustRoleCount" data-args="&apos;${r.id}&apos;, 1" class="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold">+</button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-6">
            <!-- Salary & Wages Controllers -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Employee Salary Slider -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-white text-sm"><i class="fas fa-users text-indigo-400 mr-2"></i>Employee Salary/Mo</h3>
                        <input type="number" id="num-salary" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right font-mono"
                               value="${user.salaryOffer}" min="${Math.floor(ind.baseSalary * 0.5)}" step="100">
                    </div>
                    <input type="range" id="rng-salary" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                           min="${Math.floor(ind.baseSalary * 0.5)}" max="${ind.baseSalary * 2.5}" step="100" value="${user.salaryOffer}">
                    <div class="text-xs text-slate-400 mt-2">Market Benchmark: ${Utils.formatMoney(ind.baseSalary)}/mo</div>
                </div>

                <!-- CEO Executive Pay Slider -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-white text-sm"><i class="fas fa-user-tie text-indigo-400 mr-2"></i>Your Executive Salary/Mo</h3>
                        <input type="number" id="num-ceo" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right font-mono"
                               value="${user.ceoSalary}" min="0" step="500">
                    </div>
                    <input type="range" id="rng-ceo" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                           min="0" max="100000" step="500" value="${user.ceoSalary}">
                    <div class="text-xs text-slate-400 mt-2">Paid directly to your personal bank balance.</div>
                </div>
            </div>

            <!-- Team Hiring / Layoffs -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-bold text-white text-base"><i class="fas fa-user-plus text-indigo-400 mr-2"></i>Team Size Management</h3>
                        <div class="text-xs text-slate-400">Total Staff: ${user.employees} employees</div>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="hireEmployee" class="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs">
                            <i class="fas fa-plus mr-1"></i> Hire Staff
                        </button>
                        <button data-action="layoffEmployee" class="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-xs">
                            <i class="fas fa-minus mr-1"></i> Layoff
                        </button>
                    </div>
                </div>
                <div class="space-y-3">${rolesHtml}</div>
            </div>
        </div>
    `;
}

// ─── TAB 5: FINANCE & VC FUNDING ─────────────────────────────────────────────

function renderTabFinance(user, ind, valuation, overhead) {
    const vcOffers = GameLogic.calculateVCInvestorOffers(user);

    // VC Cards
    const vcCards = vcOffers.map(vc => `
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">${vc.stage}</span>
                    <span class="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono">${Math.round(vc.equityRequired * 100)}% Equity</span>
                </div>
                <div class="font-bold text-white text-base mb-1">${vc.name}</div>
                <div class="text-xs text-slate-400 mb-3">${vc.personality}</div>
            </div>
            <div class="border-t border-slate-700 pt-3">
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-slate-400">Check Amount</span>
                    <span class="font-bold text-green-400 font-mono">${Utils.formatMoney(vc.offeredAmount)}</span>
                </div>
                <button data-action="acceptVCPitch" data-args="&apos;${vc.id}&apos;"
                        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs shadow-md">
                    Accept ${Utils.formatMoney(vc.offeredAmount)} Investment
                </button>
            </div>
        </div>
    `).join('');

    // P&L History rows
    const historyRows = user.businessHistory.slice(-8).reverse().map(q => `
        <tr class="border-t border-slate-700 text-xs">
            <td class="py-2 px-3 text-slate-400 font-mono">Y${q.year} Q${q.quarter}</td>
            <td class="py-2 px-3 text-green-400 font-mono">${Utils.formatMoney(q.revenue)}</td>
            <td class="py-2 px-3 ${q.profit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono">${q.profit >= 0 ? '+' : ''}${Utils.formatMoney(q.profit)}</td>
            <td class="py-2 px-3 text-slate-400 italic">${q.event || '—'}</td>
        </tr>
    `).join('');

    return `
        <div class="space-y-6">
            <!-- VC Investor Pitching Room -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-bold text-white text-lg flex items-center gap-2">
                            <i class="fas fa-handshake text-indigo-400"></i> Venture Capital Pitch Room
                        </h3>
                        <div class="text-xs text-slate-300">Raise equity funding to accelerate scale. Current Valuation: ${Utils.formatMoney(valuation)}</div>
                    </div>
                    <div class="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                        Remaining Equity: ${Math.round(user.equityOwned * 100)}%
                    </div>
                </div>
                ${vcOffers.length > 0 ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${vcCards}</div>` : '<div class="text-xs text-slate-400 italic">Scale your company revenue to unlock institutional VC offers.</div>'}
            </div>

            <!-- Financial P&L Statement History -->
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 class="font-bold text-white text-base mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-line text-indigo-400"></i> Historical P&L Quarterly Statements
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-xs text-slate-400 border-b border-slate-700">
                                <th class="py-2 px-3">Period</th>
                                <th class="py-2 px-3">Revenue</th>
                                <th class="py-2 px-3">Net Profit</th>
                                <th class="py-2 px-3">Event</th>
                            </tr>
                        </thead>
                        <tbody>${historyRows.length > 0 ? historyRows : '<tr><td colspan="4" class="py-3 text-xs text-slate-500 italic">No quarterly financial records yet.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>

            <!-- Exit Options & Company Sale -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-white text-base flex items-center gap-2">
                        <i class="fas fa-building-flag text-indigo-400"></i> Corporate Exit & M&A Sale
                    </h3>
                    <div class="text-xs text-slate-400">Sell company to private equity or competitor based on valuation multiples.</div>
                </div>
                <button data-action="sellBusiness" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-4 py-2.5 rounded-lg text-xs">
                    <i class="fas fa-handshake mr-1"></i> Sell Company (${Utils.formatMoney(Math.floor(valuation * user.equityOwned))})
                </button>
            </div>
        </div>
    `;
}

// ─── DASHBOARD LISTENERS & REAL-TIME CALCULATIONS ─────────────────────────────

function attachDashboardListeners() {
    ['prod', 'price', 'salary', 'ceo'].forEach(type => {
        const rng = document.getElementById(`rng-${type}`);
        const num = document.getElementById(`num-${type}`);
        if (rng) rng.addEventListener('input', () => { if (num) num.value = rng.value; updateDashboardCalculations(); });
        if (num) num.addEventListener('input', () => { if (rng) rng.value = num.value; updateDashboardCalculations(); });
    });
}

function updateDashboardCalculations() {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness) return;

    const get = id => document.getElementById(id);

    // Sync input slider values into user state
    if (get('num-prod'))   user.productionTarget = parseInt(get('num-prod').value) || 0;
    if (get('num-price'))  user.sellingPrice     = parseInt(get('num-price').value) || 0;
    if (get('num-salary')) user.salaryOffer      = parseInt(get('num-salary').value) || 0;
    if (get('num-ceo'))    user.ceoSalary        = parseInt(get('num-ceo').value) || 0;

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

    // Demand calculation
    const priceRatio = user.sellingPrice > 0 ? ind.unitPrice / user.sellingPrice : 1;
    const priceFactor = Math.pow(priceRatio, 1.4);
    const repFactor = 0.5 + (user.businessReputation / 100);

    // Marketing boost
    let mktBoost = 1.0;
    if (user.marketingLevels) {
        MARKETING_CHANNELS.forEach(ch => {
            const lvl = user.marketingLevels[ch.id] || 0;
            mktBoost += ch.demandBoost * lvl;
        });
    }

    const estDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * mktBoost);
    const estSold = Math.min(user.inventory + effectiveProd, estDemand);
    const estRev = estSold * user.sellingPrice;
    const estProfit = estRev - totalExpenses;

    // Update DOM elements
    if (get('proj-rev'))   get('proj-rev').innerText   = Utils.formatMoney(estRev);
    if (get('proj-cost'))  get('proj-cost').innerText  = '-' + Utils.formatMoney(prodCost);
    if (get('proj-wages')) get('proj-wages').innerText = '-' + Utils.formatMoney(empWages + ceoWages);

    const profitEl = get('proj-profit');
    if (profitEl) {
        profitEl.innerText = (estProfit >= 0 ? '+' : '') + Utils.formatMoney(estProfit);
        profitEl.className = estProfit >= 0
            ? 'text-xl font-bold font-mono text-green-400'
            : 'text-xl font-bold font-mono text-red-400';
    }

    const priceImpactEl = get('price-impact');
    if (priceImpactEl) {
        if (priceRatio > 1.15) priceImpactEl.innerHTML = `<span class="text-green-400"><i class="fas fa-arrow-down mr-1"></i> Below Market Average (High Customer Demand)</span>`;
        else if (priceRatio < 0.85) priceImpactEl.innerHTML = `<span class="text-red-400"><i class="fas fa-arrow-up mr-1"></i> Premium Pricing (Lower Customer Demand)</span>`;
        else priceImpactEl.innerHTML = `<span class="text-slate-400"><i class="fas fa-check mr-1"></i> Competitive Market Price</span>`;
    }
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

    user.compCash -= totalExpenses;
    user.money    += ceoWages;

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
    user.compCash += revenue;
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
        `
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
    }

    UI.hideModal();
    if (onComplete) onComplete();
}

// ─── ACTION HANDLERS ─────────────────────────────────────────────────────────

export function selectSupplierDashboard(supplierId) {
    const user = state.gameState.user;
    user.supplierId = supplierId;
    addLog(`Switched company logistics supplier to ${supplierId}.`, 'good');
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
    renderBusinessDashboard();
}

export function adjustRoleCount(roleId, deltaStr) {
    const user = state.gameState.user;
    GameLogic.ensureBusinessState(user);

    const delta = parseInt(deltaStr, 10);
    const current = user.teamRoles[roleId] || 0;
    if (current + delta < 0) return;

    user.teamRoles[roleId] = current + delta;
    renderBusinessDashboard();
}

export function acceptVCPitch(investorId) {
    const user = state.gameState.user;
    const res = GameLogic.acceptVCOffer(user, investorId);
    if (res.success) {
        addLog(res.msg, 'major');
        UI.showModal('Investment Secured!', res.msg);
    } else {
        UI.showModal('Offer Failed', res.msg);
    }
    renderBusinessDashboard();
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
    renderBusinessDashboard();
}

export function sellBusiness() {
    const user = state.gameState.user;
    const valuation = GameLogic.calculateCompanyValuation(user);
    const playerPayout = Math.floor(valuation * user.equityOwned);

    UI.showConfirm(
        'Sell Company (Corporate Exit)',
        `Sell <strong>${user.companyName}</strong> for <span class="text-green-400 font-bold">${Utils.formatMoney(playerPayout)}</span>?<br><span class="text-xs text-slate-400">Calculated based on valuation ${Utils.formatMoney(valuation)} × your ${Math.round(user.equityOwned * 100)}% equity ownership.</span>`,
        'Confirm Exit Sale',
        () => {
            user.money += playerPayout;
            addLog(`Completed acquisition sale of ${user.companyName} for ${Utils.formatMoney(playerPayout)}!`, 'major');

            user.hasBusiness        = false;
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
            renderActivities();
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
    const ceoWages = user.ceoSalary * 3;
    const totalExpenses = prodCost + empWages + ceoWages + overhead.totalQuarterly;

    user.compCash = Math.max(0, user.compCash - totalExpenses);
    user.money   += ceoWages;

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
    user.compCash += revenue;
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
