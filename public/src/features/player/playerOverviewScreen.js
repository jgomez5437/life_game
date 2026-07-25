import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { GameLogic } from '../../core/gameLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

export function openPlayerOverviewModal() {
    if (!state.gameState || !state.gameState.user) return;
    const user = state.gameState.user;

    // 1. Identity & Flag
    const displayName = user.username || user.name || "Player";
    const city = user.city || "New York";
    const countryCode = Utils.getCountryCode(city);
    let flagHtml = "";
    if (countryCode) {
        flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                         srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                         width="20" 
                         alt="${city}" 
                         class="ml-1.5 inline-block shadow-sm rounded-sm" 
                         style="vertical-align: text-bottom;">`;
    }

    // 2. Life Status & Occupation
    const statusText = GameLogic.checkLifeStatus(user);

    // 3. Net Worth Calculation
    const cash = user.money || 0;
    const properties = (user.assets || []).filter(a => a.category === 'property');
    const vehicles = (user.assets || []).filter(a => a.category === 'vehicle');
    const jewelry = (user.assets || []).filter(a => a.category === 'jewelry');
    
    const propEquity = properties.reduce((sum, p) => sum + (p.value || 0) - (p.mortgage?.remainingBalance || 0), 0);
    const vehEquity = vehicles.reduce((sum, v) => sum + (v.value || 0) - (v.loan?.remainingBalance || 0), 0);
    const jewelryVal = jewelry.reduce((sum, j) => sum + (j.value || 0), 0);
    const businessCash = (user.hasBusiness && user.compCash > 0) ? user.compCash : 0;

    const netWorth = cash + propEquity + vehEquity + jewelryVal + businessCash;
    const netWorthClass = netWorth >= 0 ? 'text-emerald-400' : 'text-red-400';

    // 4. Income Calculation
    const monthlyIncome = GameLogic.calculateUserMonthlyIncome(user);
    const totalAnnualIncome = monthlyIncome * 12;

    // 5. Monthly Outflow Calculation
    const totalMonthlyOutflow = GameLogic.calculateUserMonthlyOutflow(user);

    // 6. Children Count
    const children = (user.relationships || []).filter(r => r.category === 'child' || r.type === 'Son' || r.type === 'Daughter');
    const childCount = children.length;

    // 7. Marital / Romance Status
    const spouse = (user.relationships || []).find(r => r.category === 'spouse' || r.type === 'Husband' || r.type === 'Wife');
    const partner = (user.relationships || []).find(r => r.category === 'partner');
    
    let romanceText = 'Single';
    let romanceIcon = 'fa-user-slash text-slate-400';
    if (spouse) {
        romanceText = `Married to ${spouse.name}`;
        romanceIcon = 'fa-ring text-amber-400';
    } else if (partner) {
        romanceText = `${partner.type} of ${partner.name}`;
        romanceIcon = 'fa-heart text-pink-400';
    }

    // Health color badge
    const currentHealth = user.health ?? 100;
    const healthBadgeColor = currentHealth > 70 ? 'text-green-400' : currentHealth > 30 ? 'text-yellow-400' : 'text-red-500';

    const modalHtml = `
        <div class="space-y-4">
            <!-- Header Identity Banner -->
            <div class="bg-slate-800/90 p-4 rounded-xl border border-slate-700 text-center flex flex-col items-center shadow-lg">
                <div class="w-16 h-16 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-blue-400 mb-2 shadow-md">
                    ${renderAvatar(user)}
                </div>
                <h3 class="text-white font-bold text-xl flex items-center justify-center gap-1">
                    ${displayName} ${flagHtml}
                </h3>
                <div class="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-0.5">${statusText}</div>
                <div class="text-xs text-slate-400 mt-1">Based in <span class="text-white font-bold">${city}</span></div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-2.5">
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-calendar-alt text-blue-400"></i> Age & Health
                    </div>
                    <div class="text-base font-bold text-white">${user.age} <span class="text-xs text-slate-400 font-normal">yrs old</span></div>
                    <div class="text-xs ${healthBadgeColor} font-bold mt-0.5 flex items-center gap-1">
                        <i class="fas fa-heart text-[10px]"></i> ${currentHealth}% Health
                    </div>
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-wallet text-amber-400"></i> Net Worth
                    </div>
                    <div class="text-base font-bold ${netWorthClass}">${Utils.formatMoney(netWorth)}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Cash: <span class="text-emerald-400 font-semibold">${Utils.formatMoney(cash)}</span></div>
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-arrow-down text-emerald-400"></i> Monthly Income
                    </div>
                    <div class="text-base font-bold text-emerald-400">+${Utils.formatMoney(monthlyIncome)}<span class="text-[10px] text-slate-400 font-normal">/mo</span></div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${Utils.formatMoney(totalAnnualIncome)}<span class="text-[10px] text-slate-500">/yr</span></div>
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-arrow-up text-rose-400"></i> Monthly Outflow
                    </div>
                    <div class="text-base font-bold text-rose-400">-${Utils.formatMoney(totalMonthlyOutflow)}<span class="text-[10px] text-slate-400 font-normal">/mo</span></div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${Utils.formatMoney(totalMonthlyOutflow * 12)}<span class="text-[10px] text-slate-500">/yr</span></div>
                </div>
            </div>

            <!-- Life Context Details -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2.5 text-xs">
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-2">
                    <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                        <i class="fas ${romanceIcon}"></i> Relationship
                    </span>
                    <span class="font-bold text-white text-right">${romanceText}</span>
                </div>

                <div class="flex justify-between items-center border-b border-slate-700/60 pb-2">
                    <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                        <i class="fas fa-baby text-blue-400"></i> Children
                    </span>
                    <span class="font-bold text-white">${childCount} ${childCount === 1 ? 'Child' : 'Children'}</span>
                </div>

                <div class="flex justify-between items-center border-b border-slate-700/60 pb-2">
                    <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                        <i class="fas fa-building text-yellow-400"></i> Real Estate
                    </span>
                    <span class="font-bold text-white">${properties.length} ${properties.length === 1 ? 'Property' : 'Properties'}</span>
                </div>

                <div class="flex justify-between items-center">
                    <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                        <i class="fas fa-car text-cyan-400"></i> Vehicles
                    </span>
                    <span class="font-bold text-white">${vehicles.length} ${vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}</span>
                </div>
            </div>

            <!-- Footer Action -->
            <div class="text-right pt-2 border-t border-slate-700">
                <button data-action="hideModal" class="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">
                    Close Overview
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal("Player Life Overview", modalHtml);
}
