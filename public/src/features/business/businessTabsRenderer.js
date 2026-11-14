import { state } from '../../core/state.js';
import { Utils } from '../../ui/utils.js';
import { SUPPLIERS } from '../../core/constants.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, MARKETING_CHANNELS, SPECIALIZED_ROLES } from './businessTypes.js';
import { GameLogic } from '../../core/gameLogic.js';

// ─── UPGRADES ─────────────────────────────────────────────────────────────

export const BUSINESS_UPGRADES = [
    { id: 'marketing_boost', name: 'Brand PR Blitz',       icon: 'fa-bullhorn',      description: '+15 Reputation & Brand Trust.', cost: 25000 },
    { id: 'warehouse',       name: 'Logistics Expansion', icon: 'fa-warehouse',     description: 'Doubles inventory carry & warehouse capacity.', cost: 50000 },
    { id: 'rd_lab',          name: 'R&D Innovation Lab',  icon: 'fa-flask',         description: 'Increases max price ceiling & product demand by 40%.', cost: 75000 },
    { id: 'hr_perks',        name: 'Executive Benefits',  icon: 'fa-gift',          description: '+20% Employee Morale & lowers layoff severance.', cost: 30000 },
    { id: 'qa_automation',   name: 'QA & AI Automation',  icon: 'fa-robot',         description: 'Reduces unit production cost by 20%.', cost: 60000 }
];


// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────────────

export function renderTabOverview(user, ind, hq, valuation, overhead) {
    const recent = user.businessHistory.slice(-4);
    const annRev = recent.reduce((sum, q) => sum + (q.revenue || 0), 0);
    const annProfit = recent.reduce((sum, q) => sum + (q.profit || 0), 0);

    return `
        <div class="space-y-6">
            <!-- HQ Visual Hero Banner -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
                <div class="absolute -right-6 -bottom-6 text-slate-800/30 text-8xl sm:text-9xl pointer-events-none">
                    <i class="fas ${hq.icon}"></i>
                </div>
                <div class="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="min-w-0 flex-1">
                        <div class="text-[11px] text-indigo-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
                            <i class="fas ${hq.icon}"></i> Corporate Headquarters
                        </div>
                        <h2 class="text-xl sm:text-2xl font-bold text-white truncate">
                            ${hq.name}
                        </h2>
                        <p class="text-xs text-slate-300 mt-1 line-clamp-2 max-w-xl">${hq.description}</p>
                        <div class="flex flex-wrap gap-2.5 mt-3 text-xs">
                            <span class="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                                <i class="fas fa-users text-indigo-400"></i> Staff: <strong>${user.employees}/${hq.maxEmployees}</strong>
                            </span>
                            <span class="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                                <i class="fas fa-pie-chart text-green-400"></i> Equity Owned: <strong>${Math.round(user.equityOwned * 100)}%</strong>
                            </span>
                        </div>
                    </div>
                    <div class="w-full sm:w-auto text-right flex-shrink-0">
                        <button data-action="processQuarter" class="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg text-sm transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            <span>Process Quarter (Q${user.companyQuarter})</span>
                            <i class="fas fa-arrow-right text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Metric Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Trailing 12M Revenue</div>
                    <div class="text-lg sm:text-xl font-bold text-white font-mono truncate" title="${Utils.formatMoney(annRev)}">
                        ${Utils.formatCompactMoney(annRev)}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1">Past 4 quarters total</div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Trailing 12M Net Profit</div>
                    <div class="text-lg sm:text-xl font-bold ${annProfit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono truncate" title="${Utils.formatMoney(annProfit)}">
                        ${annProfit >= 0 ? '+' : ''}${Utils.formatCompactMoney(annProfit)}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1">Net trailing cashflow</div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Customer Satisfaction</div>
                    <div class="text-lg sm:text-xl font-bold text-blue-400">${user.customerSatisfaction}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-blue-400 h-1.5 rounded-full" style="width: ${user.customerSatisfaction}%"></div>
                    </div>
                </div>
                <div class="bg-slate-800 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                    <div class="text-[11px] text-slate-400 font-medium mb-1">Employee Morale</div>
                    <div class="text-lg sm:text-xl font-bold text-amber-400">${user.employeeMorale}%</div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div class="bg-amber-400 h-1.5 rounded-full" style="width: ${user.employeeMorale}%"></div>
                    </div>
                </div>
            </div>

            <!-- Quarterly Forecast Card -->
            <div class="bg-slate-800 border border-slate-700/80 p-5 rounded-xl shadow-sm">
                <div class="flex justify-between items-center mb-4 border-b border-slate-700/80 pb-3">
                    <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                        <i class="fas fa-calculator"></i> Current Quarter Forecast
                    </h3>
                    <span id="proj-status-badge" class="text-xs normal-case font-normal text-slate-400"></span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                        <div class="text-xs text-slate-400">Est. Revenue</div>
                        <div id="proj-rev" class="text-base sm:text-lg font-bold text-green-400 font-mono">$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Production / COGS</div>
                        <div id="proj-cost" class="text-base sm:text-lg font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Payroll & CEO Pay</div>
                        <div id="proj-wages" class="text-base sm:text-lg font-bold text-red-400 font-mono">-$0</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400">Fixed HQ Overhead</div>
                        <div class="text-base sm:text-lg font-bold text-red-400 font-mono" title="${Utils.formatMoney(overhead.totalQuarterly)}">-${Utils.formatCompactMoney(overhead.totalQuarterly)}</div>
                    </div>
                </div>
                <div class="border-t border-slate-700/80 pt-3 flex justify-between items-center font-bold">
                    <span class="text-slate-300 text-sm">Projected Net Quarterly Profit:</span>
                    <span id="proj-profit" class="text-lg sm:text-xl font-mono">$0</span>
                </div>
            </div>

            <!-- Quick Department Navigation -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button data-action="setBusinessTab" data-args="&apos;operations&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-4 rounded-xl text-left transition flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-900/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <i class="fas fa-industry text-lg"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">Operations</div>
                        <div class="text-xs text-slate-400">Capacity & suppliers</div>
                    </div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;marketing&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-4 rounded-xl text-left transition flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <i class="fas fa-bullhorn text-lg"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">Sales & Growth</div>
                        <div class="text-xs text-slate-400">Pricing & marketing</div>
                    </div>
                </button>
                <button data-action="setBusinessTab" data-args="&apos;finance&apos;" class="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 p-4 rounded-xl text-left transition flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-yellow-900/40 flex items-center justify-center text-yellow-400 flex-shrink-0">
                        <i class="fas fa-coins text-lg"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">Finance & VC</div>
                        <div class="text-xs text-slate-400">Pitch investors & P&L</div>
                    </div>
                </button>
            </div>
        </div>
    `;
}

// ─── TAB 2: OPERATIONS & PRODUCTION ─────────────────────────────────────────

export function renderTabOperations(user, ind, hq, overhead) {
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

export function renderTabMarketing(user, ind) {
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

export function renderTabHR(user, ind) {
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

export function renderTabFinance(user, ind, valuation, overhead) {
    const vcOffers = GameLogic.calculateVCInvestorOffers(user);
    const isPublic = Boolean(user.isPublic);

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

    const canIPO = !isPublic && valuation >= 25000000 && user.equityOwned >= 0.20;
    const ipoFloatAmount = Math.floor(valuation * 0.20);

    return `
        <div class="space-y-6">
            <!-- VC Investor Pitching Room -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-bold text-white text-lg flex items-center gap-2">
                            <i class="fas fa-handshake text-indigo-400"></i> Venture Capital Pitch Room
                        </h3>
                        <div class="text-xs text-slate-300">${isPublic ? 'Company is publicly traded. Early-stage VC funding rounds are closed.' : `Raise equity funding to accelerate scale. Current Valuation: ${Utils.formatMoney(valuation)}`}</div>
                    </div>
                    <div class="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                        Remaining Equity: ${Math.round(user.equityOwned * 100)}%
                    </div>
                </div>
                ${isPublic
                    ? '<div class="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg"><i class="fas fa-check-circle mr-1"></i> Public Corporation: Early venture rounds are concluded. Financing is available through public equity and corporate bonds.</div>'
                    : (vcOffers.length > 0
                        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${vcCards}</div>`
                        : '<div class="text-xs text-slate-400 italic">Scale your company revenue to unlock institutional VC offers, or you have accepted all current rounds.</div>')
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

            <!-- Initial Public Offering (IPO) Section -->
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border ${isPublic ? 'border-emerald-500/50' : 'border-slate-700'} p-5 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div class="text-[10px] ${isPublic ? 'text-emerald-400' : 'text-indigo-400'} uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                        <i class="fas ${isPublic ? 'fa-check-circle' : 'fa-chart-line'}"></i> ${isPublic ? 'Publicly Listed on Stock Exchange' : 'Initial Public Offering (IPO)'}
                    </div>
                    <h3 class="font-bold text-white text-base flex items-center gap-2">
                        <i class="fas fa-building-columns ${isPublic ? 'text-emerald-400' : 'text-indigo-400'}"></i> ${isPublic ? `${Utils.escapeHtml(user.companyName)} (Public Listing)` : 'Float Company on Stock Exchange'}
                    </h3>
                    <div class="text-xs text-slate-300">
                        ${isPublic
                            ? `Company is publicly traded. Market Capitalization: ${Utils.formatMoney(valuation)}.`
                            : `Float 20% equity shares on the public exchange for an immediate founder cashout. Requires $25M+ valuation.`
                        }
                    </div>
                </div>
                ${isPublic
                    ? `<span class="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-4 py-2 rounded-lg border border-emerald-500/30 whitespace-nowrap"><i class="fas fa-check mr-1"></i> Publicly Traded</span>`
                    : `<button data-action="launchIPO"
                               class="px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-md transition ${canIPO ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                           <i class="fas fa-bullhorn mr-1"></i> Launch IPO (${Utils.formatMoney(ipoFloatAmount)})
                       </button>`
                }
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

