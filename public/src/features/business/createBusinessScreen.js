import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { SUPPLIERS } from '../../core/constants.js';
import { BUSINESS_INDUSTRIES } from './businessTypes.js';
import { renderBusinessDashboard } from './businessDashboard.js';
import { GameLogic } from '../../core/gameLogic.js';

const get = id => document.getElementById(id);

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────

export function renderBusinessSetup() {
    const supplierCards = SUPPLIERS.map(s => `
        <div id="sup-${s.id}" class="supplier-card cursor-pointer border border-slate-600 p-3 rounded-lg flex items-center justify-between hover:bg-slate-700 transition"
             data-action="selectSupplier" data-args="&apos;${s.id}&apos;">
            <div>
                <div class="font-bold text-white text-sm">${s.name}</div>
                <div class="text-xs text-slate-400">${s.costMod}× cost &mdash; Quality ${s.quality}%</div>
            </div>
            <div class="text-xs ${s.id === 'cheap' ? 'text-yellow-400' : s.id === 'premium' ? 'text-blue-400' : 'text-slate-400'}">
                ${s.id === 'cheap' ? 'Budget Choice' : s.id === 'premium' ? 'Top Quality' : 'Balanced'}
            </div>
        </div>
    `).join('');

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in max-w-xl mx-auto pb-10">
            <button data-action="renderActivities" class="mb-4 text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                <i class="fas fa-arrow-left"></i> Cancel
            </button>

            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-lg">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">Incorporate Startup</h2>
                        <div class="text-xs text-slate-400">Launch your entrepreneurial empire</div>
                    </div>
                </div>

                <label class="block text-sm font-bold mb-2 text-slate-300">Company Name</label>
                <input type="text" id="inp-comp-name"
                       class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 mb-6"
                       placeholder="e.g. Apex Dynamics, CloudScale Inc...">

                <label class="block text-sm font-bold mb-2 text-slate-300">Select Industry & Business Model</label>
                <div class="space-y-3 mb-6 max-h-96 overflow-y-auto pr-1">
                    ${Object.keys(BUSINESS_INDUSTRIES).map(key => {
                        const ind = BUSINESS_INDUSTRIES[key];
                        return `
                            <div class="industry-card cursor-pointer border border-slate-600 p-4 rounded-lg flex items-start hover:bg-slate-700 transition"
                                 data-action="selectIndustry" data-args="&apos;${key}&apos;" id="ind-${key}">
                                <div class="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-blue-400 mr-4 shrink-0 mt-1">
                                    <i class="fas ${ind.icon} text-xl"></i>
                                </div>
                                <div class="grow">
                                    <div class="flex justify-between items-center">
                                        <div class="font-bold text-white">${ind.name}</div>
                                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-500/30">
                                            ${ind.modelType}
                                        </span>
                                    </div>
                                    <div class="text-xs text-slate-400 mt-1">${ind.description}</div>
                                    <div class="flex justify-between text-xs font-bold mt-2">
                                        <span class="text-green-400">Capital Req: ${Utils.formatMoney(ind.startupCost)}</span>
                                        <span class="text-indigo-300">Valuation: ${ind.valuationMultiple}x ARR</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <label class="block text-sm font-bold mb-2 text-slate-300">Primary Logistics & Supplier Partner</label>
                <div class="space-y-2 mb-6">${supplierCards}</div>

                <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg mb-6 text-sm text-blue-200 flex items-center gap-2">
                    <i class="fas fa-info-circle text-blue-400"></i>
                    <span>Requires personal savings to incorporate. You will start as 100% Equity Owner in a Humble Garage.</span>
                </div>

                <button data-action="initBusiness" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg">
                    Launch Venture &rarr;
                </button>
            </div>
        </div>
    `;

    selectIndustry('tech_saas');
    selectSupplier('standard');
}

// ─── INDUSTRY SELECTION ───────────────────────────────────────────────────────

export function selectIndustry(key) {
    const user = state.gameState.user;
    user.industry = key;
    document.querySelectorAll('.industry-card').forEach(card => {
        card.classList.remove('border-blue-500', 'bg-slate-700');
        card.classList.add('border-slate-600');
    });
    const selected = get(`ind-${key}`);
    if (selected) {
        selected.classList.remove('border-slate-600');
        selected.classList.add('border-blue-500', 'bg-slate-700');
    }
}

// ─── SUPPLIER SELECTION ───────────────────────────────────────────────────────

export function selectSupplier(id) {
    const user = state.gameState.user;
    user.supplierId = id;
    document.querySelectorAll('.supplier-card').forEach(card => {
        card.classList.remove('border-blue-500', 'bg-slate-700');
        card.classList.add('border-slate-600');
    });
    const selected = get(`sup-${id}`);
    if (selected) {
        selected.classList.remove('border-slate-600');
        selected.classList.add('border-blue-500', 'bg-slate-700');
    }
}

// ─── LAUNCH BUSINESS ─────────────────────────────────────────────────────────

export function initBusiness() {
    const user = state.gameState.user;
    const name = get('inp-comp-name')?.value;
    const validation = GameLogic.sanitizeBusinessName(name);

    if (!validation.isValid) {
        UI.showModal('Invalid Company Name', validation.error);
        return;
    }

    const finalCompanyName = validation.cleanedName;

    const indKey = user.industry || 'tech_saas';
    const ind = BUSINESS_INDUSTRIES[indKey];
    if (!ind) {
        UI.showModal('Select Industry', 'Please select an industry first.');
        return;
    }

    if (user.money < ind.startupCost) {
        UI.showModal(
            'Insufficient Funds',
            `You need ${Utils.formatMoney(ind.startupCost)} to start this business. You currently have ${Utils.formatMoney(user.money)}.`
        );
        return;
    }

    user.money               -= ind.startupCost;
    user.companyName          = finalCompanyName;
    user.hasBusiness          = true;
    user.compCash             = ind.startupCost;
    user.companyYear          = 1;
    user.companyQuarter       = 1;
    user.employees            = 5;
    user.businessReputation   = 50;
    user.inventory            = 0;
    user.supplierId           = user.supplierId || 'standard';
    user.industry             = indKey;
    user.salaryOffer          = ind.baseSalary;
    user.sellingPrice         = ind.unitPrice;
    user.productionTarget     = Math.floor(ind.baseDemand * 0.8);
    user.ceoSalary            = 3000;
    user.hqTier               = 'garage';
    user.marketingLevels      = { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 };
    user.teamRoles            = { engineering: 2, sales: 1, operations: 1, marketing: 1 };
    user.equityOwned          = 1.0;
    user.isPublic             = false;
    user.investorShares       = [];
    user.corporateDebt        = { principal: 0, interestRate: 0.08, monthlyPayment: 0 };
    user.customerSatisfaction = 80;
    user.employeeMorale       = 85;
    user.activeResearch       = [];
    user.businessHistory      = [];
    user.businessUpgrades     = [];
    GameLogic.resetBusinessQuarterTracking(user);

    addLog(`Founded ${name} (${ind.name})! Invested ${Utils.formatMoney(ind.startupCost)}.`, 'good');
    renderBusinessDashboard();
}
