import { state } from '../../core/state.js';
import { Utils } from '../../ui/utils.js';
import { SUPPLIERS } from '../../core/constants.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, MARKETING_CHANNELS, SPECIALIZED_ROLES } from './businessTypes.js';
import { GameLogic } from '../../core/gameLogic.js';

// ─── UPGRADES ────────────────────────────────────────────────────────────────

export const BUSINESS_UPGRADES = [
    { id: 'marketing_boost', name: 'Brand PR Blitz',       icon: 'fa-bullhorn',  description: '+15 Reputation & Brand Trust.',                       cost: 25000 },
    { id: 'warehouse',       name: 'Logistics Expansion',  icon: 'fa-warehouse', description: 'Doubles inventory carry & warehouse capacity.',        cost: 50000 },
    { id: 'rd_lab',          name: 'R&D Innovation Lab',   icon: 'fa-flask',     description: 'Increases max price ceiling & product demand by 40%.', cost: 75000 },
    { id: 'hr_perks',        name: 'Executive Benefits',   icon: 'fa-gift',      description: '+20% Employee Morale & lowers layoff severance.',      cost: 30000 },
    { id: 'qa_automation',   name: 'QA & AI Automation',   icon: 'fa-robot',     description: 'Reduces unit production cost by 20%.',                 cost: 60000 }
];

// ─── SHARED FORECAST CALCULATOR ──────────────────────────────────────────────

export function computeQuarterlyForecast(user) {
    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas;
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const overhead = GameLogic.calculateBusinessOverhead(user);
    const upgrades = Array.isArray(user.businessUpgrades) ? user.businessUpgrades : [];

    const maxProduction = Math.floor((user.employees || 1) * ind.capacityPerEmployee * hq.capacityBonus);
    const effectiveProd = Math.min(user.productionTarget || 0, maxProduction);
    const unitCostMod = upgrades.includes('qa_automation') ? 0.80 : 1.0;

    const prodCost = effectiveProd * (ind.unitCost * supplier.costMod * unitCostMod);
    const empWages = (user.employees || 1) * (user.salaryOffer || 0) * 3;
    const ceoWages = (user.ceoSalary || 0) * 3;
    const totalExpenses = prodCost + empWages + ceoWages + overhead.totalQuarterly;

    const priceRatio = (user.sellingPrice || 0) > 0 ? ind.unitPrice / user.sellingPrice : 1;
    const priceFactor = Math.pow(priceRatio, 1.4);
    const repFactor = 0.5 + ((user.businessReputation || 50) / 100);

    let mktBoost = 1.0;
    if (user.marketingLevels) {
        MARKETING_CHANNELS.forEach(ch => {
            const lvl = user.marketingLevels[ch.id] || 0;
            mktBoost += ch.demandBoost * lvl;
        });
    }
    if (upgrades.includes('rd_lab')) {
        mktBoost += 0.40;
    }

    const estDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * mktBoost);
    const estSold = Math.min((user.inventory || 0) + effectiveProd, estDemand);
    const estRev = estSold * (user.sellingPrice || 0);
    const estProfit = estRev - totalExpenses;
    const maxInventory = ind.baseDemand * (upgrades.includes('warehouse') ? 4 : 2);

    return {
        ind,
        hq,
        supplier,
        overhead,
        maxProduction,
        effectiveProd,
        prodCost,
        empWages,
        ceoWages,
        totalExpenses,
        priceRatio,
        estDemand,
        estSold,
        estRev,
        estProfit,
        maxInventory
    };
}

// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────────────

export function renderTabOverview(user, ind, hq, valuation, overhead) {
    const recent = (user.businessHistory || []).slice(-4);
    const annRev = recent.reduce((sum, q) => sum + (q.revenue || 0), 0);
    const annProfit = recent.reduce((sum, q) => sum + (q.profit || 0), 0);
    const vcOffers = GameLogic.calculateVCInvestorOffers(user);
    const canIPO = !user.isPublic && valuation >= 25000000 && user.equityOwned >= 0.20;
    const forecast = computeQuarterlyForecast(user);
    const lowCash = forecast.totalExpenses > (user.compCash || 0);

    const alerts = [];
    if (lowCash) {
        alerts.push({
            tab: 'operations',
            tone: 'border-rose-500/50 bg-rose-950/30 text-rose-200',
            icon: 'fa-triangle-exclamation text-rose-400',
            title: 'Low Company Treasury',
            subtitle: `Projected costs (${Utils.formatCompactMoney(forecast.totalExpenses)}) exceed treasury. Lower production or raise VC capital.`
        });
    }
    if (canIPO) {
        alerts.push({
            tab: 'finance',
            tone: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200',
            icon: 'fa-building-columns text-emerald-400',
            title: 'IPO Milestone Unlocked!',
            subtitle: 'Your $25M+ valuation qualifies to float 20% on the public stock exchange.'
        });
    } else if (vcOffers.length > 0 && !user.isPublic) {
        alerts.push({
            tab: 'finance',
            tone: 'border-indigo-500/50 bg-indigo-950/30 text-indigo-200',
            icon: 'fa-handshake text-indigo-400',
            title: `${vcOffers.length} VC Offer${vcOffers.length > 1 ? 's' : ''} Waiting`,
            subtitle: `Pitch ${Utils.escapeHtml(vcOffers[0].name)} for up to ${Utils.formatCompactMoney(vcOffers[0].offeredAmount)}.`
        });
    }
    if ((user.employees || 0) >= hq.maxEmployees) {
        alerts.push({
            tab: 'operations',
            tone: 'border-amber-500/40 bg-amber-950/25 text-amber-200',
            icon: 'fa-building text-amber-400',
            title: 'HQ Staff Capacity Full',
            subtitle: `${user.employees}/${hq.maxEmployees} seats filled. Upgrade HQ in Operations to hire more.`
        });
    }

    const alertsHtml = alerts.length > 0 ? `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${alerts.map(a => `
                <button data-action="setBusinessTab" data-args="&apos;${a.tab}&apos;"
                        class="border ${a.tone} p-3.5 rounded-xl text-left transition hover:brightness-110 flex items-start gap-3">
                    <i class="fas ${a.icon} mt-0.5 text-base shrink-0"></i>
                    <div class="min-w-0 flex-1">
                        <div class="font-bold text-xs uppercase tracking-wider">${a.title}</div>
                        <div class="text-xs opacity-90 mt-0.5 leading-snug">${a.subtitle}</div>
                    </div>
                    <i class="fas fa-chevron-right text-xs opacity-60 mt-1 shrink-0"></i>
                </button>
            `).join('')}
        </div>
    ` : '';

    return `
        <div class="space-y-5">
            <!-- HQ Snapshot Card -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-700 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div class="absolute -right-4 -bottom-4 text-slate-800/35 text-8xl pointer-events-none">
                    <i class="fas ${hq.icon}"></i>
                </div>
                <div class="relative z-10">
                    <div class="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                        <i class="fas ${hq.icon}"></i> Corporate Headquarters
                    </div>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <h2 class="text-lg sm:text-xl font-bold text-white">${hq.name}</h2>
                        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700">
                            Reputation: <span class="text-indigo-300">${user.businessReputation || 50}/100</span>
                        </span>
                    </div>
                    <p class="text-xs text-slate-300 mt-1 max-w-xl">${hq.description}</p>
                    <div class="flex flex-wrap gap-2 mt-3 text-xs">
                        <span class="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                            <i class="fas fa-users text-indigo-400"></i> Staff: <strong>${user.employees}/${hq.maxEmployees}</strong>
                        </span>
                        <span class="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                            <i class="fas fa-pie-chart text-emerald-400"></i> Equity: <strong>${Math.round(user.equityOwned * 100)}%</strong>
                        </span>
                        <span class="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                            <i class="fas fa-boxes text-amber-400"></i> Stock: <strong>${(user.inventory || 0).toLocaleString()}</strong>
                        </span>
                    </div>
                </div>
            </div>

            ${alertsHtml}

            <!-- Metric Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Trailing 12M Revenue</div>
                    <div class="text-lg font-bold text-white font-mono truncate" title="${Utils.formatMoney(annRev)}">${Utils.formatCompactMoney(annRev)}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Last 4 quarters</div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Trailing 12M Profit</div>
                    <div class="text-lg font-bold ${annProfit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono truncate" title="${Utils.formatMoney(annProfit)}">
                        ${annProfit >= 0 ? '+' : ''}${Utils.formatCompactMoney(annProfit)}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Net trailing cashflow</div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Customer Satisfaction</div>
                    <div class="text-lg font-bold text-blue-400">${user.customerSatisfaction}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-blue-400 h-1.5 rounded-full" style="width: ${user.customerSatisfaction}%"></div>
                    </div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Employee Morale</div>
                    <div class="text-lg font-bold text-amber-400">${user.employeeMorale}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-amber-400 h-1.5 rounded-full" style="width: ${user.employeeMorale}%"></div>
                    </div>
                </div>
            </div>

            <!-- Detailed Quarterly Forecast Breakdown -->
            <div class="bg-slate-800 border border-slate-700/80 p-5 rounded-xl">
                <div class="flex justify-between items-center mb-4 border-b border-slate-700/80 pb-3">
                    <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                        <i class="fas fa-calculator"></i> Q${user.companyQuarter} Forecast Breakdown
                    </h3>
                    <span id="proj-status-badge" class="text-[11px] font-bold"></span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                        <div class="text-xs text-slate-400">Est. Revenue</div>
                        <div id="proj-rev" class="text-base font-bold text-green-400 font-mono">$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Production / COGS</div>
                        <div id="proj-cost" class="text-base font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Payroll & CEO Pay</div>
                        <div id="proj-wages" class="text-base font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Fixed HQ Overhead</div>
                        <div class="text-base font-bold text-red-400 font-mono" title="${Utils.formatMoney(overhead.totalQuarterly)}">-${Utils.formatCompactMoney(overhead.totalQuarterly)}</div>
                    </div>
                </div>
                <div class="border-t border-slate-700/80 pt-3 flex justify-between items-center font-bold">
                    <span class="text-slate-300 text-sm">Projected Net Quarterly Profit:</span>
                    <span id="proj-profit" class="text-lg font-mono">$0</span>
                </div>
            </div>

            <!-- Quick Department Shortcuts -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button data-action="setBusinessTab" data-args="&apos;operations&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-3.5 rounded-xl text-left transition flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-indigo-900/40 flex items-center justify-center text-indigo-400 shrink-0"><i class="fas fa-industry"></i></div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-xs">Operations</div>
                        <div class="text-[11px] text-slate-400 truncate">Output & HQ</div>
                    </div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;marketing&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-3.5 rounded-xl text-left transition flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-400 shrink-0"><i class="fas fa-bullhorn"></i></div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-xs">Sales</div>
                        <div class="text-[11px] text-slate-400 truncate">Price & Ads</div>
                    </div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;hr&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-3.5 rounded-xl text-left transition flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-400 shrink-0"><i class="fas fa-users"></i></div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-xs">HR & Pay</div>
                        <div class="text-[11px] text-slate-400 truncate">${user.employees} Staff</div>
                    </div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;finance&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-3.5 rounded-xl text-left transition flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-yellow-900/40 flex items-center justify-center text-yellow-400 shrink-0"><i class="fas fa-coins"></i></div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-xs">Finance</div>
                        <div class="text-[11px] text-slate-400 truncate">VC & IPO</div>
                    </div>
                </button>
            </div>
        </div>
    `;
}

// ─── TAB 2: OPERATIONS & PRODUCTION ──────────────────────────────────────────

export function renderTabOperations(user, ind, hq, overhead) {
    const forecast = computeQuarterlyForecast(user);
    const maxProduction = forecast.maxProduction;
    const maxInventory = forecast.maxInventory;
    const isWarehouseOwned = user.businessUpgrades.includes('warehouse');
    const utilPct = maxProduction > 0 ? Math.min(100, Math.round((forecast.effectiveProd / maxProduction) * 100)) : 0;
    const invPct = maxInventory > 0 ? Math.min(100, Math.round(((user.inventory || 0) / maxInventory) * 100)) : 0;

    const supplierOptions = SUPPLIERS.map(s => {
        const isActive = user.supplierId === s.id;
        return `
            <button type="button" data-action="selectSupplierDashboard" data-args="&apos;${s.id}&apos;"
                    class="text-left border rounded-xl p-3.5 flex justify-between items-center transition ${isActive ? 'border-indigo-500 bg-indigo-900/35 ring-1 ring-indigo-500/40' : 'border-slate-700 bg-slate-900/60 hover:bg-slate-700/70'}">
                <div>
                    <div class="font-bold text-white text-sm">${s.name} Logistics</div>
                    <div class="text-xs text-slate-400 mt-0.5">${s.costMod}x unit cost &bull; Quality ${s.quality}%</div>
                </div>
                ${isActive
                    ? '<span class="text-[11px] bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-full">Active</span>'
                    : '<span class="text-[11px] text-slate-400 font-semibold">Select</span>'}
            </button>
        `;
    }).join('');

    const upgradeCards = BUSINESS_UPGRADES.map(u => {
        const owned = user.businessUpgrades.includes(u.id);
        const canAfford = user.compCash >= u.cost;
        return `
            <div class="bg-slate-900/60 border ${owned ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-slate-700'} rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-lg ${owned ? 'bg-emerald-900/50 text-emerald-400' : 'bg-indigo-900/50 text-indigo-300'} flex items-center justify-center shrink-0">
                        <i class="fas ${u.icon}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-xs sm:text-sm truncate">${u.name}</div>
                        <div class="text-[11px] text-slate-400 leading-snug">${u.description}</div>
                    </div>
                </div>
                ${owned
                    ? '<span class="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg shrink-0"><i class="fas fa-check mr-1"></i>Owned</span>'
                    : `<button data-action="purchaseUpgrade" data-args="&apos;${u.id}&apos;"
                               class="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition ${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 opacity-75'}">
                           ${Utils.formatCompactMoney(u.cost)}
                       </button>`
                }
            </div>
        `;
    }).join('');

    const hqUpgradeCards = HQ_TIERS.map(h => {
        const isCurrent = user.hqTier === h.id;
        const canAfford = user.compCash >= h.cost;
        return `
            <div class="bg-slate-900/60 border ${isCurrent ? 'border-indigo-500 bg-indigo-950/25' : 'border-slate-700'} rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fas ${h.icon} text-xl text-indigo-400 w-7 text-center shrink-0"></i>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-sm truncate">${h.name}</div>
                        <div class="text-xs text-slate-400">Rent: ${Utils.formatMoney(h.monthlyRent)}/mo &bull; Max Staff: ${h.maxEmployees} &bull; ${h.capacityBonus}x Output</div>
                    </div>
                </div>
                ${isCurrent
                    ? '<span class="text-[11px] text-indigo-300 font-bold bg-indigo-950 border border-indigo-500/40 px-2.5 py-1 rounded-lg shrink-0">Current</span>'
                    : `<button data-action="upgradeHQTier" data-args="&apos;${h.id}&apos;"
                               class="text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition ${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 opacity-75'}">
                           ${Utils.formatCompactMoney(h.cost)}
                       </button>`
                }
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-5">
            <!-- Production Volume & Warehouse -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex flex-wrap justify-between items-center gap-3 mb-3">
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
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700/70 text-xs">
                    <div>
                        <div class="flex justify-between text-slate-400 mb-1">
                            <span>Factory Utilization</span>
                            <span id="ops-util-label" class="font-mono text-indigo-300 font-bold">${utilPct}% (${forecast.effectiveProd.toLocaleString()} units)</span>
                        </div>
                        <div class="w-full bg-slate-900 rounded-full h-1.5"><div id="ops-util-bar" class="bg-indigo-500 h-1.5 rounded-full" style="width:${utilPct}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-400 mb-1">
                            <span>Warehouse Inventory ${isWarehouseOwned ? '(Expanded)' : ''}</span>
                            <span class="font-mono text-amber-300 font-bold">${(user.inventory || 0).toLocaleString()} / ${maxInventory.toLocaleString()}</span>
                        </div>
                        <div class="w-full bg-slate-900 rounded-full h-1.5"><div class="bg-amber-400 h-1.5 rounded-full" style="width:${invPct}%"></div></div>
                    </div>
                </div>
            </div>

            <!-- Supplier Selection -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-truck-loading text-indigo-400"></i> Supplier & Logistics Partner
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">${supplierOptions}</div>
            </div>

            <!-- Corporate Upgrades -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-microchip text-indigo-400"></i> Corporate Upgrades
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${upgradeCards}</div>
            </div>

            <!-- HQ Relocation & Overhead -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-2 bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                        <i class="fas fa-building text-indigo-400"></i> Headquarters Facilities
                    </h3>
                    <div class="space-y-2.5">${hqUpgradeCards}</div>
                </div>
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h3 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <i class="fas fa-receipt text-indigo-400"></i> Fixed Overhead / Qtr
                    </h3>
                    <div class="space-y-2.5 text-xs">
                        <div class="flex justify-between border-b border-slate-700 pb-1.5">
                            <span class="text-slate-400">HQ Lease</span>
                            <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.quarterlyRent)}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-1.5">
                            <span class="text-slate-400">IT & Admin</span>
                            <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.empAdminOverhead)}</span>
                        </div>
                        ${overhead.debtInterest > 0 ? `
                            <div class="flex justify-between border-b border-slate-700 pb-1.5">
                                <span class="text-slate-400">Debt Interest</span>
                                <span class="font-mono text-red-300">-${Utils.formatMoney(overhead.debtInterest)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between pt-1 font-bold text-sm">
                            <span class="text-white">Total Overhead</span>
                            <span class="font-mono text-red-400">-${Utils.formatMoney(overhead.totalQuarterly)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ─── TAB 3: SALES & MARKETING ────────────────────────────────────────────────

export function renderTabMarketing(user, ind) {
    const minPrice = Math.floor(ind.unitPrice * 0.4);
    const maxPrice = Math.floor(ind.unitPrice * (user.businessUpgrades.includes('rd_lab') ? 4.5 : 3.0));
    const forecast = computeQuarterlyForecast(user);

    const channelsHtml = MARKETING_CHANNELS.map(ch => {
        const level = user.marketingLevels?.[ch.id] || 0;
        const upgradeCost = ch.costPerLevel * (level + 1);
        const canAfford = user.compCash >= upgradeCost;

        return `
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-lg shrink-0">
                        <i class="fas ${ch.icon}"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="font-bold text-white text-sm flex items-center justify-between gap-2">
                            <span class="truncate">${ch.name}</span>
                            <span class="text-[11px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono shrink-0">Lvl ${level}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5">${ch.description}</div>
                        <div class="text-[11px] text-emerald-400 font-semibold mt-1">+${Math.round(ch.demandBoost * 100 * level)}% Active Boost</div>
                    </div>
                </div>
                <button data-action="upgradeMarketingChannel" data-args="&apos;${ch.id}&apos;"
                        class="w-full text-xs font-bold px-3 py-2 rounded-lg transition ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 opacity-75'}">
                    Boost to Lvl ${level + 1} (${Utils.formatMoney(upgradeCost)})
                </button>
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-5">
            <!-- Unit Pricing & Live Demand Impact -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex flex-wrap justify-between items-center gap-3 mb-2">
                    <div>
                        <h3 class="font-bold text-white text-base flex items-center gap-2">
                            <i class="fas fa-tag text-indigo-400"></i> Unit Selling Price ($)
                        </h3>
                        <div class="text-xs text-slate-400">Market Benchmark: ${Utils.formatMoney(ind.unitPrice)} (Range: ${Utils.formatMoney(minPrice)} – ${Utils.formatMoney(maxPrice)})</div>
                    </div>
                    <input type="number" id="num-price" class="num-input w-28 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm text-right font-mono"
                           value="${user.sellingPrice}" min="${minPrice}" max="${maxPrice}">
                </div>
                <input type="range" id="rng-price" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                       min="${minPrice}" max="${maxPrice}" value="${user.sellingPrice}">
                <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-700/70 text-xs">
                    <div class="font-bold" id="price-impact"></div>
                    <div class="text-slate-300 font-mono">
                        Est. Demand: <strong id="mkt-est-demand" class="text-indigo-300">${forecast.estDemand.toLocaleString()}</strong> units
                        &bull; Available Supply: <strong class="text-white">${((user.inventory || 0) + forecast.effectiveProd).toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            <!-- Marketing Channels -->
            <div>
                <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <i class="fas fa-bullhorn text-indigo-400"></i> Customer Acquisition Channels
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${channelsHtml}</div>
            </div>
        </div>
    `;
}

// ─── TAB 4: HR & CULTURE ─────────────────────────────────────────────────────

export function renderTabHR(user, ind) {
    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const hireCost = ind.baseSalary * 2;
    const severance = Math.floor(ind.baseSalary * (user.businessUpgrades?.includes('hr_perks') ? 0.75 : 1.5));
    const quarterlyPayroll = ((user.employees || 1) * (user.salaryOffer || 0) * 3) + ((user.ceoSalary || 0) * 3);

    const rolesHtml = SPECIALIZED_ROLES.map(r => {
        const count = user.teamRoles?.[r.id] || 0;
        return `
            <div class="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5 flex justify-between items-center gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                        <i class="fas ${r.icon}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-white text-sm truncate">${r.name}</div>
                        <div class="text-xs text-slate-400">${r.benefit}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button data-action="adjustRoleCount" data-args="&apos;${r.id}&apos;, -1" class="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold">-</button>
                    <span class="font-bold text-white font-mono w-7 text-center">${count}</span>
                    <button data-action="adjustRoleCount" data-args="&apos;${r.id}&apos;, 1" class="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold">+</button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-5">
            <!-- Compensation Sliders -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-white text-sm"><i class="fas fa-user-tie text-indigo-400 mr-2"></i>Your CEO Salary/Mo</h3>
                        <input type="number" id="num-ceo" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right font-mono"
                               value="${user.ceoSalary}" min="0" step="500">
                    </div>
                    <input type="range" id="rng-ceo" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                           min="0" max="100000" step="500" value="${user.ceoSalary}">
                    <div class="text-xs text-slate-400 mt-2">Paid directly to your Personal Bank each quarter.</div>
                </div>
            </div>

            <!-- Team Size & Department Allocation -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div class="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-700/80">
                    <div>
                        <h3 class="font-bold text-white text-base"><i class="fas fa-user-plus text-indigo-400 mr-2"></i>Headcount & Department Focus</h3>
                        <div class="text-xs text-slate-400">
                            Active Staff: <strong class="text-white">${user.employees}/${hq.maxEmployees}</strong> &bull;
                            Total Payroll: <strong id="hr-payroll-total" class="text-amber-300 font-mono">${Utils.formatMoney(quarterlyPayroll)}/qtr</strong>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="hireEmployee" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition">
                            <i class="fas fa-plus mr-1"></i> Hire (${Utils.formatCompactMoney(hireCost)})
                        </button>
                        <button data-action="layoffEmployee" class="bg-rose-700 hover:bg-rose-600 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition">
                            <i class="fas fa-minus mr-1"></i> Layoff (${Utils.formatCompactMoney(severance)})
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${rolesHtml}</div>
            </div>
        </div>
    `;
}

// ─── TAB 5: FINANCE & VC FUNDING ─────────────────────────────────────────────

export function renderTabFinance(user, ind, valuation, overhead) {
    const vcOffers = GameLogic.calculateVCInvestorOffers(user);
    const isPublic = Boolean(user.isPublic);
    const ipoTarget = 25000000;
    const ipoPct = Math.min(100, Math.round((valuation / ipoTarget) * 100));
    const canIPO = !isPublic && valuation >= ipoTarget && user.equityOwned >= 0.20;
    const ipoFloatAmount = Math.floor(valuation * 0.20);

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
                        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs shadow-md transition">
                    Accept ${Utils.formatMoney(vc.offeredAmount)} Investment
                </button>
            </div>
        </div>
    `).join('');

    const historyRows = (user.businessHistory || []).slice(-8).reverse().map(q => `
        <tr class="border-t border-slate-700 text-xs">
            <td class="py-2 px-3 text-slate-400 font-mono">Y${q.year} Q${q.quarter}</td>
            <td class="py-2 px-3 text-green-400 font-mono">${Utils.formatMoney(q.revenue)}</td>
            <td class="py-2 px-3 ${q.profit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono">${q.profit >= 0 ? '+' : ''}${Utils.formatMoney(q.profit)}</td>
            <td class="py-2 px-3 text-slate-400 italic">${q.event ? Utils.escapeHtml(q.event) : '—'}</td>
        </tr>
    `).join('');

    return `
        <div class="space-y-5">
            <!-- IPO Milestone & Public Listing -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border ${isPublic ? 'border-emerald-500/50' : 'border-slate-700'} p-5 rounded-xl shadow-lg space-y-3">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <div class="text-[10px] ${isPublic ? 'text-emerald-400' : 'text-indigo-400'} uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                            <i class="fas ${isPublic ? 'fa-check-circle' : 'fa-chart-line'}"></i> ${isPublic ? 'Publicly Listed on Stock Exchange' : 'Initial Public Offering (IPO)'}
                        </div>
                        <h3 class="font-bold text-white text-base flex items-center gap-2">
                            <i class="fas fa-building-columns ${isPublic ? 'text-emerald-400' : 'text-indigo-400'}"></i> ${isPublic ? `${Utils.escapeHtml(user.companyName)} (Public)` : 'Float Company on Stock Exchange'}
                        </h3>
                        <div class="text-xs text-slate-300 mt-0.5">
                            ${isPublic
                                ? `Market Capitalization: ${Utils.formatMoney(valuation)}.`
                                : `Float 20% equity for an immediate personal cashout. Requires $25M+ valuation & 20%+ equity.`
                            }
                        </div>
                    </div>
                    ${isPublic
                        ? '<span class="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-4 py-2 rounded-lg border border-emerald-500/30 whitespace-nowrap"><i class="fas fa-check mr-1"></i> Publicly Traded</span>'
                        : `<button data-action="launchIPO"
                                   class="px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-md transition ${canIPO ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer' : 'bg-slate-700 text-slate-400 opacity-75'}">
                               <i class="fas fa-bullhorn mr-1"></i> Launch IPO (${Utils.formatCompactMoney(ipoFloatAmount)})
                           </button>`
                    }
                </div>
                ${!isPublic ? `
                    <div>
                        <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>IPO Valuation Progress</span>
                            <span class="font-mono text-indigo-300 font-bold">${Utils.formatCompactMoney(valuation)} / $25M (${ipoPct}%)</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-2 border border-slate-700">
                            <div class="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full" style="width: ${ipoPct}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- VC Investor Pitching Room -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-700 p-5 rounded-xl">
                <div class="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div>
                        <h3 class="font-bold text-white text-lg flex items-center gap-2">
                            <i class="fas fa-handshake text-indigo-400"></i> Venture Capital Pitch Room
                        </h3>
                        <div class="text-xs text-slate-300">${isPublic ? 'Company is publicly traded. Early-stage VC rounds are closed.' : `Raise capital to accelerate growth. Valuation: ${Utils.formatMoney(valuation)}`}</div>
                    </div>
                    <div class="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                        Your Equity: ${Math.round(user.equityOwned * 100)}%
                    </div>
                </div>
                ${isPublic
                    ? '<div class="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg"><i class="fas fa-check-circle mr-1"></i> Public Corporation: Early venture rounds are concluded.</div>'
                    : (vcOffers.length > 0
                        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${vcCards}</div>`
                        : '<div class="text-xs text-slate-400 italic">Scale your revenue and valuation to unlock higher-tier VC investor offers.</div>')
                }
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
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h3 class="font-bold text-white text-base flex items-center gap-2">
                        <i class="fas fa-building-flag text-rose-400"></i> Corporate Exit & M&A Sale
                    </h3>
                    <div class="text-xs text-slate-400">Sell your ${Math.round(user.equityOwned * 100)}% equity stake to private equity or a competitor.</div>
                </div>
                <button data-action="sellBusiness" class="bg-slate-700 hover:bg-rose-700/80 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition">
                    <i class="fas fa-handshake mr-1"></i> Sell Company (${Utils.formatCompactMoney(Math.floor(valuation * user.equityOwned))})
                </button>
            </div>
        </div>
    `;
}

// ─── DASHBOARD LISTENERS & REAL-TIME CALCULATIONS ────────────────────────────

export function attachDashboardListeners() {
    ['prod', 'price', 'salary', 'ceo'].forEach(type => {
        const rng = document.getElementById(`rng-${type}`);
        const num = document.getElementById(`num-${type}`);
        if (rng) rng.addEventListener('input', () => { if (num) num.value = rng.value; updateDashboardCalculations(); });
        if (num) num.addEventListener('input', () => { if (rng) rng.value = num.value; updateDashboardCalculations(); });
    });
}

export function updateDashboardCalculations() {
    const user = state.gameState.user;
    if (!user || !user.hasBusiness) return;

    const get = id => document.getElementById(id);
    if (get('num-prod'))   user.productionTarget = parseInt(get('num-prod').value, 10) || 0;
    if (get('num-price'))  user.sellingPrice     = parseInt(get('num-price').value, 10) || 0;
    if (get('num-salary')) user.salaryOffer      = parseInt(get('num-salary').value, 10) || 0;
    if (get('num-ceo'))    user.ceoSalary        = parseInt(get('num-ceo').value, 10) || 0;

    const f = computeQuarterlyForecast(user);
    const lowCash = f.totalExpenses > (user.compCash || 0);

    if (get('proj-rev'))   get('proj-rev').innerText   = Utils.formatMoney(f.estRev);
    if (get('proj-cost'))  get('proj-cost').innerText  = '-' + Utils.formatMoney(f.prodCost);
    if (get('proj-wages')) get('proj-wages').innerText = '-' + Utils.formatMoney(f.empWages + f.ceoWages);

    const profitEl = get('proj-profit');
    if (profitEl) {
        profitEl.innerText = (f.estProfit >= 0 ? '+' : '') + Utils.formatMoney(f.estProfit);
        profitEl.className = f.estProfit >= 0 ? 'text-lg font-bold font-mono text-green-400' : 'text-lg font-bold font-mono text-red-400';
    }
    const statusEl = get('proj-status-badge');
    if (statusEl) {
        statusEl.innerHTML = lowCash
            ? '<span class="text-rose-400"><i class="fas fa-triangle-exclamation mr-1"></i>Insufficient Treasury</span>'
            : (f.estProfit >= 0 ? '<span class="text-emerald-400">Profitable Outlook</span>' : '<span class="text-amber-400">Operating at Loss</span>');
    }

    if (get('exec-proj-rev'))      get('exec-proj-rev').innerText      = Utils.formatCompactMoney(f.estRev);
    if (get('exec-proj-expenses')) get('exec-proj-expenses').innerText = '-' + Utils.formatCompactMoney(f.totalExpenses);
    const execProfitEl = get('exec-proj-profit');
    if (execProfitEl) {
        execProfitEl.innerText = (f.estProfit >= 0 ? '+' : '') + Utils.formatCompactMoney(f.estProfit);
        execProfitEl.className = f.estProfit >= 0 ? 'text-xs sm:text-sm font-bold font-mono text-emerald-400' : 'text-xs sm:text-sm font-bold font-mono text-rose-400';
    }
    if (get('exec-low-cash-warn')) get('exec-low-cash-warn').classList.toggle('hidden', !lowCash);

    const utilPct = f.maxProduction > 0 ? Math.min(100, Math.round((f.effectiveProd / f.maxProduction) * 100)) : 0;
    if (get('ops-util-label')) get('ops-util-label').innerText = `${utilPct}% (${f.effectiveProd.toLocaleString()} units)`;
    if (get('ops-util-bar'))   get('ops-util-bar').style.width = `${utilPct}%`;

    if (get('mkt-est-demand')) get('mkt-est-demand').innerText = f.estDemand.toLocaleString();
    const priceImpactEl = get('price-impact');
    if (priceImpactEl) {
        if (f.priceRatio > 1.15) priceImpactEl.innerHTML = '<span class="text-green-400"><i class="fas fa-arrow-down mr-1"></i> Below Market Average (High Demand)</span>';
        else if (f.priceRatio < 0.85) priceImpactEl.innerHTML = '<span class="text-red-400"><i class="fas fa-arrow-up mr-1"></i> Premium Pricing (Lower Demand)</span>';
        else priceImpactEl.innerHTML = '<span class="text-slate-400"><i class="fas fa-check mr-1"></i> Competitive Market Price</span>';
    }
    if (get('hr-payroll-total')) get('hr-payroll-total').innerText = `${Utils.formatMoney(f.empWages + f.ceoWages)}/qtr`;
}
