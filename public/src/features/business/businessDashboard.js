import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { INDUSTRIES, SUPPLIERS } from '../../core/main.js';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const BUSINESS_EVENTS = [
    { id: 'viral_moment',       name: 'Viral Moment',        icon: 'fa-fire',                probability: 0.04, repDelta:  30, demandMult: 1.5, productionCapMult: 1.0, revenueFlat:      0, revenuePenaltyPct: 0.00 },
    { id: 'supplier_shortage',  name: 'Supplier Shortage',   icon: 'fa-exclamation-triangle', probability: 0.04, repDelta:   0, demandMult: 1.0, productionCapMult: 0.5, revenueFlat:      0, revenuePenaltyPct: 0.00 },
    { id: 'product_defect',     name: 'Product Defect',      icon: 'fa-bug',                  probability: 0.04, repDelta: -20, demandMult: 1.0, productionCapMult: 1.0, revenueFlat:      0, revenuePenaltyPct: 0.20 },
    { id: 'competitor_launch',  name: 'Competitor Launch',   icon: 'fa-building',             probability: 0.04, repDelta: -15, demandMult: 0.9, productionCapMult: 1.0, revenueFlat:      0, revenuePenaltyPct: 0.00 },
    { id: 'government_contract', name: 'Government Contract', icon: 'fa-landmark',            probability: 0.03, repDelta:  10, demandMult: 1.0, productionCapMult: 1.0, revenueFlat:  50000, revenuePenaltyPct: 0.00 },
    { id: 'employee_strike',    name: 'Employee Strike',     icon: 'fa-people-line',          probability: 0.03, repDelta:  -5, demandMult: 0.0, productionCapMult: 0.0, revenueFlat:      0, revenuePenaltyPct: 0.00 },
];

export const BUSINESS_UPGRADES = [
    { id: 'marketing',   name: 'Marketing Campaign',  icon: 'fa-bullhorn',      description: 'Immediately +10 Reputation.',              cost: 25000 },
    { id: 'warehouse',   name: 'Warehouse Expansion', icon: 'fa-warehouse',     description: 'Doubles maximum inventory carry capacity.', cost: 50000 },
    { id: 'rd',          name: 'R&D Investment',      icon: 'fa-flask',         description: 'Increases max price ceiling by 50%.',       cost: 75000 },
    { id: 'hr_training', name: 'HR Training Program', icon: 'fa-user-graduate', description: 'Reduces layoff severance cost by 50%.',     cost: 30000 },
];

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

export function enterBusinessMode() {
    renderBusinessDashboard();
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────

export function renderBusinessDashboard() {
    const user = state.gameState.user;
    const ind = INDUSTRIES[user.industry];
    const maxProduction = user.employees * ind.capacityPerEmployee;
    const minPrice = Math.floor(ind.unitPrice * 0.5);
    const maxPrice = Math.floor(ind.unitPrice * (user.businessUpgrades.includes('rd') ? 4.5 : 3.0));

    // Last event banner (shown if the most recent quarter had an event)
    const lastEntry = user.businessHistory[user.businessHistory.length - 1];
    const eventBanner = (lastEntry && lastEntry.event)
        ? `<div class="bg-yellow-900/40 border border-yellow-500/40 rounded-xl p-3 mb-4 text-sm text-yellow-200 flex items-center gap-2">
               <i class="fas fa-bolt text-yellow-400"></i>
               <span><strong>Last Quarter Event:</strong> ${lastEntry.event}</span>
           </div>`
        : '';

    // P&L history table (last 8 quarters)
    const historyRows = user.businessHistory.slice(-8).reverse().map(q =>
        `<tr class="border-t border-slate-700 text-xs">
            <td class="py-1 px-2 text-slate-400">Y${q.year} Q${q.quarter}</td>
            <td class="py-1 px-2 text-green-400">${Utils.formatMoney(q.revenue)}</td>
            <td class="py-1 px-2 ${q.profit >= 0 ? 'text-green-400' : 'text-red-400'}">${q.profit >= 0 ? '+' : ''}${Utils.formatMoney(q.profit)}</td>
            <td class="py-1 px-2 text-slate-500 italic">${q.event || '—'}</td>
        </tr>`
    ).join('');

    const historySection = user.businessHistory.length > 0
        ? `<details class="bg-slate-800 border border-slate-700 rounded-xl mb-4">
               <summary class="p-4 font-bold text-sm cursor-pointer select-none">
                   <i class="fas fa-chart-bar text-slate-400 mr-2"></i>P&amp;L Reports
               </summary>
               <div class="overflow-x-auto px-2 pb-3">
                   <table class="w-full">
                       <thead><tr class="text-xs text-slate-500 text-left">
                           <th class="py-1 px-2">Period</th>
                           <th class="py-1 px-2">Revenue</th>
                           <th class="py-1 px-2">Profit</th>
                           <th class="py-1 px-2">Event</th>
                       </tr></thead>
                       <tbody>${historyRows}</tbody>
                   </table>
               </div>
           </details>`
        : '';

    // Upgrades section
    const upgradeCards = BUSINESS_UPGRADES.map(u => {
        const owned = user.businessUpgrades.includes(u.id);
        const canAfford = user.compCash >= u.cost;
        return `<div class="bg-slate-800 border ${owned ? 'border-green-600/50' : 'border-slate-700'} rounded-xl p-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <i class="fas ${u.icon} text-slate-400 w-5 text-center"></i>
                <div>
                    <div class="text-sm font-bold ${owned ? 'text-green-400' : 'text-white'}">${u.name} ${owned ? '<i class="fas fa-check-circle text-green-400"></i>' : ''}</div>
                    <div class="text-xs text-slate-400">${u.description}</div>
                </div>
            </div>
            ${owned
                ? `<span class="text-xs text-green-500 font-bold whitespace-nowrap">Owned</span>`
                : `<button data-action="purchaseUpgrade" data-args="&apos;${u.id}&apos;"
                       class="text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                       ${Utils.formatMoney(u.cost)}
                   </button>`
            }
        </div>`;
    }).join('');

    UI.renderScreen(`
        <div class="fade-in pb-24 max-w-2xl mx-auto">

            <!-- Top Bar -->
            <div class="flex justify-between items-center mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Occupation
                </button>
                <div class="text-right">
                    <div class="text-xs text-slate-400">Company Cash</div>
                    <div class="text-xl font-bold text-green-400">${Utils.formatMoney(user.compCash)}</div>
                </div>
            </div>

            ${eventBanner}

            <!-- Company Header -->
            <div class="mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-bold text-white">${user.companyName}</h2>
                        <div class="text-xs text-slate-400">Fiscal Year ${user.companyYear} &mdash; Q${user.companyQuarter}</div>
                        <div class="text-xs text-slate-400 mt-1">${ind.name}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold text-white">${user.employees} Employees</div>
                        <div class="text-xs text-slate-400">Rep: ${user.businessReputation}%</div>
                        <div class="text-xs text-slate-500">Inventory: ${user.inventory.toLocaleString()} units</div>
                    </div>
                </div>
            </div>

            <!-- Quarterly Projection -->
            <div class="bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-xl mb-4 shadow-inner">
                <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 border-b border-indigo-500/30 pb-2">
                    <i class="fas fa-calculator mr-1"></i> Quarterly Projection
                </h3>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between text-slate-400"><span>Est. Revenue</span><span id="proj-rev" class="text-green-400 font-mono">$0</span></div>
                    <div class="flex justify-between text-slate-400"><span>Prod. Costs</span><span id="proj-cost" class="text-red-300 font-mono">$0</span></div>
                    <div class="flex justify-between text-slate-400"><span>Employee Wages</span><span id="proj-wages" class="text-red-300 font-mono">$0</span></div>
                    <div class="flex justify-between text-slate-400"><span>CEO Salary (You)</span><span id="proj-ceo" class="text-red-300 font-mono">$0</span></div>
                    <div class="flex justify-between text-slate-400"><span>Fixed Costs</span><span class="text-red-300 font-mono">-${Utils.formatMoney(10000)}</span></div>
                    <div class="border-t border-indigo-500/30 my-2 pt-2 flex justify-between font-bold">
                        <span class="text-white">Est. Net Profit</span>
                        <span id="proj-profit" class="text-white">$0</span>
                    </div>
                </div>
            </div>

            <!-- Slider Controls -->
            <div class="space-y-4 mb-4">

                <!-- Production -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <h3 class="font-bold text-sm"><i class="fas fa-industry text-slate-400 mr-2"></i>Production Units</h3>
                            <div class="text-xs text-slate-500">Capacity: ${maxProduction.toLocaleString()} units (${user.employees} employees)</div>
                        </div>
                        <input type="number" id="num-prod" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right"
                               value="${user.productionTarget}" min="0" max="${maxProduction}">
                    </div>
                    <input type="range" id="rng-prod" class="w-full" min="0" max="${maxProduction}" value="${user.productionTarget}">
                </div>

                <!-- Price -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-sm"><i class="fas fa-tag text-slate-400 mr-2"></i>Price per Unit ($)</h3>
                        <input type="number" id="num-price" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right"
                               value="${user.sellingPrice}" min="${minPrice}">
                    </div>
                    <input type="range" id="rng-price" class="w-full" min="${minPrice}" max="${maxPrice}" value="${user.sellingPrice}">
                    <div class="text-center mt-1 text-xs" id="price-impact"></div>
                </div>

                <!-- Employee Salary -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-sm"><i class="fas fa-users text-slate-400 mr-2"></i>Employee Salary/Mo</h3>
                        <input type="number" id="num-salary" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right"
                               value="${user.salaryOffer}" min="${Math.floor(ind.baseSalary * 0.5)}" step="100">
                    </div>
                    <input type="range" id="rng-salary" class="w-full" min="${Math.floor(ind.baseSalary * 0.5)}" max="${ind.baseSalary * 2}" step="100" value="${user.salaryOffer}">
                </div>

                <!-- CEO Salary -->
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-sm"><i class="fas fa-user-tie text-slate-400 mr-2"></i>Your Salary/Mo</h3>
                        <input type="number" id="num-ceo" class="num-input w-24 bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm text-right"
                               value="${user.ceoSalary}" min="0" step="500">
                    </div>
                    <input type="range" id="rng-ceo" class="w-full" min="0" max="50000" step="500" value="${user.ceoSalary}">
                    <div class="text-xs text-slate-500 mt-1">Paid directly to your personal bank account.</div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <button data-action="hireEmployee" class="bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm">
                    <i class="fas fa-user-plus mr-1"></i> Hire
                </button>
                <button data-action="layoffEmployee" class="bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm">
                    <i class="fas fa-user-minus mr-1"></i> Layoff
                </button>
            </div>
            <button data-action="processQuarter" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg mb-3">
                End Quarter &rarr;
            </button>
            <button data-action="sellBusiness" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl text-sm mb-6">
                <i class="fas fa-handshake mr-1"></i> Sell Company
            </button>

            <!-- Upgrades -->
            <div class="mb-4">
                <h3 class="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    <i class="fas fa-arrow-up text-slate-400 mr-1"></i> Upgrades
                </h3>
                <div class="space-y-3">${upgradeCards}</div>
            </div>

            ${historySection}
        </div>
    `);

    attachSliderListeners();
    updateCalculations();
}

// ─── SLIDER HELPERS ───────────────────────────────────────────────────────────

function attachSliderListeners() {
    ['prod', 'price', 'salary', 'ceo'].forEach(type => {
        const rng = document.getElementById(`rng-${type}`);
        const num = document.getElementById(`num-${type}`);
        if (rng) rng.addEventListener('input', () => { num.value = rng.value; updateCalculations(); });
        if (num) num.addEventListener('input', () => { rng.value = num.value; updateCalculations(); });
    });
}

function updateCalculations() {
    const user = state.gameState.user;
    const get = id => document.getElementById(id);

    // Read slider values into state
    user.productionTarget = parseInt(get('num-prod')?.value) || 0;
    user.sellingPrice     = parseInt(get('num-price')?.value) || 0;
    user.salaryOffer      = parseInt(get('num-salary')?.value) || 0;
    user.ceoSalary        = parseInt(get('num-ceo')?.value) || 0;

    const ind      = INDUSTRIES[user.industry];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const maxProduction = user.employees * ind.capacityPerEmployee;

    const effectiveProd = Math.min(user.productionTarget, maxProduction);
    const prodCost  = effectiveProd * (ind.unitCost * supplier.costMod);
    const empWages  = user.employees * user.salaryOffer * 3;
    const ceoWages  = user.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp  = prodCost + empWages + ceoWages + fixedCosts;

    const priceFactor = user.sellingPrice > 0 ? Math.pow((ind.unitPrice / user.sellingPrice), 1.5) : 0;
    const repFactor   = 0.5 + (user.businessReputation / 100);
    const estDemand   = Math.floor(ind.baseDemand * repFactor * priceFactor);
    const estSold     = Math.min(user.inventory + effectiveProd, estDemand);
    const estRev      = estSold * user.sellingPrice;
    const estProfit   = estRev - totalExp;

    const profitEl = get('proj-profit');
    if (get('proj-rev'))    get('proj-rev').innerText    = Utils.formatMoney(estRev);
    if (get('proj-cost'))   get('proj-cost').innerText   = '-' + Utils.formatMoney(prodCost);
    if (get('proj-wages'))  get('proj-wages').innerText  = '-' + Utils.formatMoney(empWages);
    if (get('proj-ceo'))    get('proj-ceo').innerText    = '-' + Utils.formatMoney(ceoWages);
    if (profitEl) {
        profitEl.innerText  = (estProfit >= 0 ? '+' : '') + Utils.formatMoney(estProfit);
        profitEl.className  = estProfit >= 0
            ? 'text-green-400 font-bold font-mono'
            : 'text-red-400 font-bold font-mono';
    }

    const priceRatio = user.sellingPrice > 0 ? ind.unitPrice / user.sellingPrice : 1;
    const impactEl = get('price-impact');
    if (impactEl) {
        if (priceRatio > 1.1)       impactEl.innerHTML = `<span class="text-green-400">Cheap (High Demand)</span>`;
        else if (priceRatio < 0.9)  impactEl.innerHTML = `<span class="text-red-400">Expensive (Low Demand)</span>`;
        else                         impactEl.innerHTML = `<span class="text-slate-400">Fair Price</span>`;
    }
}

// ─── ROLL EVENT ──────────────────────────────────────────────────────────────

function rollBusinessEvent() {
    let cumulative = 0;
    const roll = Math.random();
    for (const ev of BUSINESS_EVENTS) {
        cumulative += ev.probability;
        if (roll < cumulative) return ev;
    }
    return null;
}

// ─── QUARTERLY TURN (manual) ─────────────────────────────────────────────────

export function processQuarter() {
    const user = state.gameState.user;
    const ind      = INDUSTRIES[user.industry];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const maxProduction = user.employees * ind.capacityPerEmployee;

    const effectiveProd = Math.min(user.productionTarget, maxProduction);
    const prodCost   = effectiveProd * (ind.unitCost * supplier.costMod);
    const empWages   = user.employees * user.salaryOffer * 3;
    const ceoWages   = user.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp   = prodCost + empWages + ceoWages + fixedCosts;

    if (totalExp > user.compCash) {
        UI.showModal('Bankruptcy Risk', 'Company has insufficient funds! Reduce production or salaries.');
        return;
    }
    user.compCash -= totalExp;
    user.money    += ceoWages;

    // Demand + event
    const activeEvent  = rollBusinessEvent();
    const priceFactor  = user.sellingPrice > 0 ? Math.pow((ind.unitPrice / user.sellingPrice), 1.5) : 0;
    const repFactor    = 0.5 + (user.businessReputation / 100);
    const volatility   = 1 + ((Math.random() - 0.5) * ind.volatility * 2);
    const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility);

    const capMult        = activeEvent ? (activeEvent.productionCapMult ?? 1) : 1;
    const demandMult     = activeEvent ? (activeEvent.demandMult ?? 1) : 1;
    const effectiveDemand = Math.floor(actualDemand * demandMult);
    const cappedProd     = Math.floor(effectiveProd * capMult);
    const available      = user.inventory + cappedProd;
    const sold           = Math.min(available, effectiveDemand);

    const maxInventory  = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 2 : 1);
    user.inventory      = Math.min(available - sold, maxInventory);

    let revenue = sold * user.sellingPrice + (activeEvent ? (activeEvent.revenueFlat ?? 0) : 0);
    if (activeEvent?.revenuePenaltyPct > 0) revenue = Math.floor(revenue * (1 - activeEvent.revenuePenaltyPct));
    user.compCash += revenue;
    const profit = revenue - totalExp;

    // Apply event rep delta
    if (activeEvent?.repDelta) {
        user.businessReputation = Math.max(0, Math.min(100, user.businessReputation + activeEvent.repDelta));
    }
    // Stockout / surplus rep
    if (available < actualDemand) user.businessReputation = Math.max(0, user.businessReputation - 2);
    else user.businessReputation = Math.min(100, user.businessReputation + 1);

    user.businessHistory.push({
        year: user.companyYear,
        quarter: user.companyQuarter,
        profit,
        revenue,
        event: activeEvent ? activeEvent.name : null
    });

    const eventLine = activeEvent
        ? `<div class="mt-2 text-yellow-300 text-xs"><i class="fas fa-bolt mr-1"></i><strong>${activeEvent.name}</strong> — ${activeEvent.description}</div>`
        : '';

    user.companyQuarter++;
    if (user.companyQuarter > 4) {
        user.companyQuarter = 1;
        user.companyYear++;
        const annualRevenue = user.businessHistory.slice(-4).reduce((s, q) => s + q.revenue, 0);
        addLog(`${user.companyName} fiscal year complete. Annual Revenue: ${Utils.formatMoney(annualRevenue)}.`, 'major');
        UI.showModal(
            'Annual Report',
            `<div class="text-sm space-y-2">
                <p>Fiscal Year complete.</p>
                <div class="flex justify-between"><span class="text-slate-400">Annual Revenue</span><span class="text-green-400 font-bold">${Utils.formatMoney(annualRevenue)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Company Cash</span><span class="font-bold text-white">${Utils.formatMoney(user.compCash)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Your Bank</span><span class="font-bold text-white">${Utils.formatMoney(user.money)}</span></div>
                ${eventLine}
             </div>`,
            () => renderLifeDashboard(state.gameState)
        );
    } else {
        addLog(`${user.companyName} Q${user.companyQuarter - 1}: Revenue ${Utils.formatMoney(revenue)}, Profit ${Utils.formatMoney(profit)}.${activeEvent ? ' ⚡ ' + activeEvent.name : ''}`, profit >= 0 ? 'good' : 'bad');
        renderBusinessDashboard();
    }
}

// ─── QUARTERLY TURN (silent, called by ageUp) ────────────────────────────────

export function autoProcessBusinessQuarter(user) {
    const ind      = INDUSTRIES[user.industry];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId) || SUPPLIERS[1];
    const maxProduction = user.employees * ind.capacityPerEmployee;

    const effectiveProd = Math.min(user.productionTarget, maxProduction);
    const prodCost   = effectiveProd * (ind.unitCost * supplier.costMod);
    const empWages   = user.employees * user.salaryOffer * 3;
    const ceoWages   = user.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp   = prodCost + empWages + ceoWages + fixedCosts;

    if (totalExp > user.compCash) {
        addLog(`${user.companyName} cannot cover Q${user.companyQuarter} expenses. Visit the office to restructure.`, 'bad');
    }
    user.compCash = Math.max(0, user.compCash - totalExp);
    user.money   += ceoWages;

    const activeEvent  = rollBusinessEvent();
    const priceFactor  = user.sellingPrice > 0 ? Math.pow((ind.unitPrice / user.sellingPrice), 1.5) : 0;
    const repFactor    = 0.5 + (user.businessReputation / 100);
    const volatility   = 1 + ((Math.random() - 0.5) * ind.volatility * 2);
    const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility);

    const capMult         = activeEvent ? (activeEvent.productionCapMult ?? 1) : 1;
    const demandMult      = activeEvent ? (activeEvent.demandMult ?? 1) : 1;
    const effectiveDemand = Math.floor(actualDemand * demandMult);
    const cappedProd      = Math.floor(effectiveProd * capMult);
    const available       = user.inventory + cappedProd;
    const sold            = Math.min(available, effectiveDemand);

    const maxInventory = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 2 : 1);
    user.inventory     = Math.min(available - sold, maxInventory);

    let revenue = sold * user.sellingPrice + (activeEvent ? (activeEvent.revenueFlat ?? 0) : 0);
    if (activeEvent?.revenuePenaltyPct > 0) revenue = Math.floor(revenue * (1 - activeEvent.revenuePenaltyPct));
    user.compCash += revenue;
    const profit = revenue - totalExp;

    if (activeEvent?.repDelta) {
        user.businessReputation = Math.max(0, Math.min(100, user.businessReputation + activeEvent.repDelta));
    }
    if (available < actualDemand) user.businessReputation = Math.max(0, user.businessReputation - 2);
    else user.businessReputation = Math.min(100, user.businessReputation + 1);

    user.businessHistory.push({
        year: user.companyYear,
        quarter: user.companyQuarter,
        profit,
        revenue,
        event: activeEvent ? activeEvent.name : null
    });

    if (activeEvent) {
        addLog(`${user.companyName}: ${activeEvent.name} — ${activeEvent.description}`, activeEvent.repDelta < 0 ? 'bad' : 'good');
    }
    addLog(`${user.companyName} Q${user.companyQuarter}: Revenue ${Utils.formatMoney(revenue)}, Profit ${Utils.formatMoney(profit)}.`, profit >= 0 ? 'good' : 'bad');

    user.companyQuarter++;
    if (user.companyQuarter > 4) {
        user.companyQuarter = 1;
        user.companyYear++;
        const annualRevenue = user.businessHistory.slice(-4).reduce((s, q) => s + q.revenue, 0);
        addLog(`${user.companyName} fiscal year complete. Annual Revenue: ${Utils.formatMoney(annualRevenue)}.`, 'major');
    }
}

// ─── EMPLOYEE MANAGEMENT ─────────────────────────────────────────────────────

export function hireEmployee() {
    const user = state.gameState.user;
    const ind  = INDUSTRIES[user.industry];
    const cost = ind.baseSalary * 2;
    if (user.compCash < cost) {
        UI.showModal('Cannot Hire', `You need ${Utils.formatMoney(cost)} in company cash to hire.`);
        return;
    }
    user.compCash -= cost;
    user.employees++;
    addLog(`Hired a new employee at ${user.companyName}. Team size: ${user.employees}.`, 'good');
    renderBusinessDashboard();
}

export function layoffEmployee() {
    const user = state.gameState.user;
    const ind  = INDUSTRIES[user.industry];
    if (user.employees <= 1) {
        UI.showModal('Cannot Layoff', 'You must keep at least one employee.');
        return;
    }
    const sevMult  = user.businessUpgrades.includes('hr_training') ? 0.5 : 1.0;
    const severance = Math.floor(ind.baseSalary * sevMult);
    user.compCash  -= severance;
    user.employees--;
    addLog(`Laid off an employee. Severance paid: ${Utils.formatMoney(severance)}.`, 'bad');
    renderBusinessDashboard();
}

// ─── SELL BUSINESS ────────────────────────────────────────────────────────────

export function sellBusiness() {
    const user = state.gameState.user;
    const ind  = INDUSTRIES[user.industry];
    const recent     = user.businessHistory.slice(-4);
    const avgRevenue = recent.length > 0
        ? recent.reduce((sum, q) => sum + q.revenue, 0) / recent.length
        : 0;
    const salePrice = Math.max(
        Math.floor(avgRevenue * 4),
        Math.floor(ind.startupCost * 0.3)
    );
    UI.showConfirm(
        'Sell Company',
        `Sell <strong>${user.companyName}</strong> for <span class="text-green-400 font-bold">${Utils.formatMoney(salePrice)}</span>?<br><span class="text-xs text-slate-400">Based on recent quarterly revenue × 4.</span>`,
        'Sell Company',
        () => {
            user.money  += salePrice;
            addLog(`Sold ${user.companyName} for ${Utils.formatMoney(salePrice)}.`, 'major');
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
            user.businessHistory    = [];
            user.businessUpgrades   = [];
            renderActivities();
        }
    );
}

// ─── UPGRADES ─────────────────────────────────────────────────────────────────

export function purchaseUpgrade(upgradeId) {
    const user    = state.gameState.user;
    const upgrade = BUSINESS_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    if (user.businessUpgrades.includes(upgradeId)) {
        UI.showModal('Already Purchased', `You already own the ${upgrade.name} upgrade.`);
        return;
    }
    if (user.compCash < upgrade.cost) {
        UI.showModal('Insufficient Funds', `Need ${Utils.formatMoney(upgrade.cost)} in company cash.`);
        return;
    }
    user.compCash -= upgrade.cost;
    user.businessUpgrades.push(upgradeId);
    if (upgradeId === 'marketing') {
        user.businessReputation = Math.min(100, user.businessReputation + 10);
    }
    addLog(`${user.companyName} purchased: ${upgrade.name}.`, 'good');
    renderBusinessDashboard();
}
