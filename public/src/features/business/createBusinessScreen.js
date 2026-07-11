import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { INDUSTRIES, SUPPLIERS } from '../../core/main.js';
import { renderBusinessDashboard } from './businessDashboard.js';

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
                ${s.id === 'cheap' ? 'Low Cost' : s.id === 'premium' ? 'Best Quality' : 'Balanced'}
            </div>
        </div>
    `).join('');

    get('game-container').innerHTML = `
        <div class="fade-in max-w-lg mx-auto pb-10">
            <button data-action="renderActivities" class="mb-4 text-slate-400 hover:text-white text-sm flex items-center gap-2">
                <i class="fas fa-arrow-left"></i> Cancel
            </button>

            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h2 class="text-2xl font-bold mb-5 text-white">Incorporate Company</h2>

                <label class="block text-sm font-bold mb-2 text-slate-300">Company Name</label>
                <input type="text" id="inp-comp-name"
                       class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 mb-6"
                       placeholder="Enter name...">

                <label class="block text-sm font-bold mb-2 text-slate-300">Select Industry</label>
                <div class="space-y-3 mb-6">
                    ${Object.keys(INDUSTRIES).map(key => `
                        <div class="industry-card cursor-pointer border border-slate-600 p-4 rounded-lg flex items-center hover:bg-slate-700 transition"
                             data-action="selectIndustry" data-args="&apos;${key}&apos;" id="ind-${key}">
                            <div class="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-blue-400 mr-4">
                                <i class="fas ${INDUSTRIES[key].icon}"></i>
                            </div>
                            <div>
                                <div class="font-bold text-white">${INDUSTRIES[key].name}</div>
                                <div class="text-xs text-slate-400">${INDUSTRIES[key].description}</div>
                                <div class="text-xs text-green-400 font-bold mt-1">
                                    Startup: ${Utils.formatMoney(INDUSTRIES[key].startupCost)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <label class="block text-sm font-bold mb-2 text-slate-300">Select Supplier</label>
                <div class="space-y-2 mb-6">${supplierCards}</div>

                <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded mb-6 text-sm text-blue-200">
                    <i class="fas fa-info-circle"></i> Requires <strong>personal capital</strong> to start.
                </div>

                <button data-action="initBusiness" class="w-full btn-primary text-white font-bold py-4 rounded-lg text-lg shadow-lg">
                    Launch Company
                </button>
            </div>
        </div>
    `;

    selectIndustry('tech');
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
    const name = get('inp-comp-name')?.value?.trim();

    if (!name) {
        UI.showModal('Missing Name', 'Enter a company name before launching.');
        return;
    }

    const ind = INDUSTRIES[user.industry];
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

    user.money              -= ind.startupCost;
    user.companyName         = name;
    user.hasBusiness         = true;
    user.compCash            = ind.startupCost;
    user.companyYear         = 1;
    user.companyQuarter      = 1;
    user.employees           = 5;
    user.businessReputation  = 50;
    user.inventory           = 0;
    user.supplierId          = user.supplierId || 'standard';
    user.salaryOffer         = ind.baseSalary;
    user.sellingPrice        = ind.unitPrice;
    user.productionTarget    = Math.floor(ind.baseDemand * 0.8);
    user.businessHistory     = [];
    user.businessUpgrades    = [];

    addLog(`Founded ${name} (${ind.name})! Invested ${Utils.formatMoney(ind.startupCost)}.`, 'good');
    renderBusinessDashboard();
}
