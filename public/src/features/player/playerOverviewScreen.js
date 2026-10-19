import { state, hasPurchasedPack } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { GameLogic } from '../../core/gameLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

export function openPlayerOverviewModal() {
    if (!state.gameState || !state.gameState.user) return;
    const user = state.gameState.user;
    const isGodMode = hasPurchasedPack('god_mode');

    // 1. Identity & Flag
    const displayName = Utils.escapeHtml(user.username || user.name || "Player");
    const city = user.city || "New York";
    const countryCode = Utils.getCountryCode(city);
    let flagHtml = "";
    if (countryCode) {
        flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                         srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                         width="20" 
                         alt="${Utils.escapeHtml(city)}" 
                         class="ml-1.5 inline-block shadow-sm rounded-sm" 
                         style="vertical-align: text-bottom;">`;
    }

    // 2. Life Status & Occupation
    const statusText = Utils.escapeHtml(GameLogic.checkLifeStatus(user));

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
        romanceText = `Married to ${Utils.escapeHtml(spouse.name)}`;
        romanceIcon = 'fa-ring text-amber-400';
    } else if (partner) {
        romanceText = `${Utils.escapeHtml(partner.type)} of ${Utils.escapeHtml(partner.name)}`;
        romanceIcon = 'fa-heart text-pink-400';
    }

    // Health & Stats badges
    const currentHealth = user.health ?? user.stats?.health ?? 100;
    const currentHappiness = user.happiness ?? user.stats?.happiness ?? 100;
    const currentSmarts = user.smarts ?? user.stats?.smarts ?? 50;
    const currentLooks = user.looks ?? user.stats?.looks ?? 50;
    const healthBadgeColor = currentHealth > 70 ? 'text-green-400' : currentHealth > 30 ? 'text-yellow-400' : 'text-red-500';

    const isVip = hasPurchasedPack('vip_supporter');
    const vipBadgeTag = isVip ? `
        <div data-action="renderVipLoungeModal" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase shadow border border-amber-300 mt-1 cursor-pointer" title="Open VIP Lounge">
            <i class="fas fa-crown text-[9px]"></i> VIP Supporter
        </div>
    ` : '';

    const pastLivesCount = (user.pastLives || state.gameState.pastLives || []).length;
    const currentGen = user.generation || (pastLivesCount + 1);

    // 8. Education Milestones & Status
    const educationMilestones = GameLogic.getEducationMilestones(user);
    const educationString = GameLogic.formatEducationMilestones(user, ', ', 'No Formal Education');
    const currentEduStatus = GameLogic.getCurrentEducationStatus(user);

    const modalHtml = `
        <div class="space-y-4">
            <!-- Header Identity Banner (Clickable -> Opens Family Graveyard) -->
            <div data-action="renderGraveyardModal" class="bg-slate-800/90 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 text-center flex flex-col items-center shadow-lg cursor-pointer transition group" title="Click to View Family Graveyard & Lineage">
                <div class="w-16 h-16 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-blue-400 mb-2 shadow-md group-hover:border-amber-400 transition">
                    ${renderAvatar(user)}
                </div>
                <h3 class="text-white font-bold text-xl flex items-center justify-center gap-1 group-hover:text-amber-200 transition">
                    ${displayName} ${flagHtml}
                </h3>
                ${vipBadgeTag}
                <div class="text-xs ${user.inPrison ? 'text-red-400 font-bold' : 'text-blue-400 font-semibold'} uppercase tracking-wider mt-0.5">${statusText}</div>
                <div class="text-xs text-slate-400 mt-1">Based in <span class="text-white font-bold">${Utils.escapeHtml(city)}</span></div>
                <div class="text-[10px] text-amber-400 font-bold mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 group-hover:bg-amber-500/20 transition">
                    <i class="fas fa-monument"></i> Generation ${currentGen} Lineage • ${pastLivesCount} Past ${pastLivesCount === 1 ? 'Life' : 'Lives'} &rarr;
                </div>
            </div>

            <!-- Family Graveyard Quick Access Card -->
            <div data-action="renderGraveyardModal" class="bg-slate-800 hover:bg-slate-700/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer transition">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-sm">
                        <i class="fas fa-monument"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white">Family Lineage & Graveyard</div>
                        <div class="text-[10px] text-slate-400">Generation ${currentGen} • ${pastLivesCount} Ancestor ${pastLivesCount === 1 ? 'Record' : 'Records'}</div>
                    </div>
                </div>
                <div class="text-xs font-bold text-amber-400 flex items-center gap-1">
                    View <i class="fas fa-chevron-right text-[10px]"></i>
                </div>
            </div>

            <!-- Core Character Stats Bars -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2.5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span><i class="fas fa-chart-bar text-blue-400 mr-1"></i> Core Life Stats</span>
                    ${isGodMode ? `
                        <div class="flex items-center gap-1.5">
                            <button data-action="renderGodModeModal" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] transition flex items-center gap-1">
                                <i class="fas fa-bolt text-[9px]"></i> Edit Stats
                            </button>
                            <button data-action="renderGodModeAvatarModal" data-args="&apos;self&apos;" class="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-[10px] transition flex items-center gap-1">
                                <i class="fas fa-user-edit text-[9px]"></i> Edit Avatar
                            </button>
                        </div>
                    ` : `
                        <span class="text-xs text-white font-bold">${user.age} yrs old</span>
                    `}
                </div>
                
                <!-- Health Bar -->
                <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                        <span class="text-emerald-400 flex items-center gap-1"><i class="fas fa-heart text-[10px]"></i> Health</span>
                        <span class="${healthBadgeColor}">${currentHealth}%</span>
                    </div>
                    <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${currentHealth}%"></div>
                    </div>
                </div>

                <!-- Happiness Bar -->
                <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                        <span class="text-amber-400 flex items-center gap-1"><i class="fas fa-smile text-[10px]"></i> Happiness</span>
                        <span class="text-amber-400">${currentHappiness}%</span>
                    </div>
                    <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-400 transition-all duration-300" style="width: ${currentHappiness}%"></div>
                    </div>
                </div>

                <!-- Smarts Bar -->
                <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                        <span class="text-blue-400 flex items-center gap-1"><i class="fas fa-brain text-[10px]"></i> Smarts</span>
                        <span class="text-blue-400">${currentSmarts}%</span>
                    </div>
                    <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 transition-all duration-300" style="width: ${currentSmarts}%"></div>
                    </div>
                </div>

                <!-- Looks Bar -->
                <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                        <span class="text-pink-400 flex items-center gap-1"><i class="fas fa-sparkles text-[10px]"></i> Looks</span>
                        <span class="text-pink-400">${currentLooks}%</span>
                    </div>
                    <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div class="h-full bg-pink-500 transition-all duration-300" style="width: ${currentLooks}%"></div>
                    </div>
                </div>
            </div>

            <!-- Financial Summary Grid (Clickable -> Opens Cashflow & Net Worth Modal) -->
            <div data-action="openCashflowModal" class="grid grid-cols-3 gap-2.5 cursor-pointer group" title="Click for Cashflow & Net Worth Breakdown">
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-wallet text-amber-400"></i> Net Worth
                    </div>
                    <div class="text-sm font-bold ${netWorthClass}">${Utils.formatMoney(netWorth)}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">Cash: <span class="text-emerald-400 font-semibold">${Utils.formatMoney(cash)}</span></div>
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-arrow-down text-emerald-400"></i> Income
                    </div>
                    <div class="text-sm font-bold text-emerald-400">+${Utils.formatMoney(monthlyIncome)}<span class="text-[9px] text-slate-400 font-normal">/mo</span></div>
                    <div class="text-[10px] text-slate-400 mt-0.5">${Utils.formatMoney(totalAnnualIncome)}<span class="text-[9px] text-slate-500">/yr</span></div>
                    ${user.isRetired && user.retirementPension > 0 ? `
                        <div class="text-[9px] text-amber-400 font-semibold mt-1 border-t border-slate-700/60 pt-1 flex items-center justify-between">
                            <span><i class="fas fa-cocktail text-[8px] mr-1"></i>Pension</span>
                            <span>${Utils.formatMoney(user.retirementPension)}/yr</span>
                        </div>
                    ` : ''}
                </div>

                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <i class="fas fa-arrow-up text-rose-400"></i> Outflow
                    </div>
                    <div class="text-sm font-bold text-rose-400">-${Utils.formatMoney(totalMonthlyOutflow)}<span class="text-[9px] text-slate-400 font-normal">/mo</span></div>
                    <div class="text-[10px] text-slate-400 mt-0.5">${Utils.formatMoney(totalMonthlyOutflow * 12)}<span class="text-[9px] text-slate-500">/yr</span></div>
                </div>
            </div>

            <!-- Education Milestones Card -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2.5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span><i class="fas fa-graduation-cap text-indigo-400 mr-1"></i> Education Milestones</span>
                    <span class="text-[10px] font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                        ${educationMilestones.length} ${educationMilestones.length === 1 ? 'Credential' : 'Credentials'}
                    </span>
                </div>

                ${educationMilestones.length > 0 ? `
                    <div class="space-y-1.5">
                        ${educationMilestones.map(m => {
                            let colorClass = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
                            let iconClass = m.icon || 'fa-graduation-cap';
                            if (m.category === 'high_school') {
                                colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
                            } else if (m.category === 'undergrad') {
                                colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-300';
                            } else if (m.category === 'grad') {
                                colorClass = 'bg-purple-500/10 border-purple-500/30 text-purple-300';
                            }
                            return `
                                <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${colorClass} text-xs font-semibold">
                                    <i class="fas ${iconClass} text-xs flex-shrink-0"></i>
                                    <span class="truncate">${Utils.escapeHtml(m.title)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs italic text-center">
                        No formal degrees completed
                    </div>
                `}

                ${currentEduStatus.isEnrolled ? `
                    <div class="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-[11px]">
                        <span class="flex items-center gap-1.5 text-amber-400 font-medium truncate">
                            <i class="fas fa-book-reader text-[10px]"></i> Enrolled: ${Utils.escapeHtml(currentEduStatus.label)}
                        </span>
                        <span class="text-[10px] text-slate-400 font-semibold flex-shrink-0">${Utils.escapeHtml(currentEduStatus.detail)}</span>
                    </div>
                ` : ''}
            </div>

            <!-- Life Context Details -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2.5 text-xs">
                ${user.isRetired && user.retirementPension > 0 ? `
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-2">
                        <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                            <i class="fas fa-cocktail text-amber-400"></i> Pension
                        </span>
                        <span class="font-bold text-amber-400 text-right">${Utils.formatMoney(user.retirementPension)}/yr <span class="text-slate-400 text-[10px] font-normal">(+${Utils.formatMoney(Math.floor(user.retirementPension / 12))}/mo)</span></span>
                    </div>
                ` : ''}

                <div class="flex justify-between items-center border-b border-slate-700/60 pb-2">
                    <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                        <i class="fas fa-graduation-cap text-indigo-400"></i> Education
                    </span>
                    <span class="font-bold text-white text-right max-w-[220px] truncate" title="${Utils.escapeHtml(educationString)}">
                        ${Utils.escapeHtml(educationString)}
                    </span>
                </div>

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
        </div>
    `;

    UI.showCustomModal({
        title: "Player Life Overview",
        content: modalHtml,
        showCloseBtn: true
    });
}

export function openCashflowModal() {
    if (!state.gameState || !state.gameState.user) return;
    const user = state.gameState.user;
    const breakdown = GameLogic.calculateFinancialBreakdown(user);
    const { cashflow, netWorth } = breakdown;

    const netMonthlySign = cashflow.netMonthly > 0 ? '+' : '';
    const netMonthlyClass = cashflow.netMonthly > 0
        ? 'text-emerald-400'
        : cashflow.netMonthly < 0
            ? 'text-rose-400'
            : 'text-slate-300';

    const netWorthClass = netWorth.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400';

    const renderLedgerRow = (item, isExpense = false) => {
        const amount = item.monthly || 0;
        const annualAmount = item.annual || 0;
        const isZero = amount === 0 && annualAmount === 0;
        const sign = isZero ? '' : (isExpense ? '-' : '+');
        const valueColor = isZero
            ? 'text-slate-500'
            : (isExpense ? 'text-rose-400' : 'text-emerald-400');

        return `
            <div class="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-b-0">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/70 flex items-center justify-center shrink-0 ${item.color || 'text-slate-400'}">
                        <i class="fas ${item.icon || 'fa-coins'} text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">${Utils.escapeHtml(item.label)}</div>
                        <div class="text-[10px] text-slate-400 truncate">${Utils.escapeHtml(item.sublabel || '')}</div>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-xs font-bold font-mono ${valueColor}">${sign}${Utils.formatMoney(amount)}<span class="text-[9px] text-slate-400 font-normal">/mo</span></div>
                    <div class="text-[10px] text-slate-400 font-mono">${sign}${Utils.formatMoney(annualAmount)}<span class="text-[9px] text-slate-500">/yr</span></div>
                </div>
            </div>
        `;
    };

    const renderBalanceRow = (item, isLiability = false) => {
        const val = item.value || 0;
        const sign = isLiability && val > 0 ? '-' : '';
        const valueColor = val === 0
            ? 'text-slate-500'
            : (isLiability ? 'text-rose-400' : 'text-emerald-400');

        return `
            <div class="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-b-0">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/70 flex items-center justify-center shrink-0 ${item.color || 'text-slate-400'}">
                        <i class="fas ${item.icon || 'fa-coins'} text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">${Utils.escapeHtml(item.label)}</div>
                        <div class="text-[10px] text-slate-400 truncate">${Utils.escapeHtml(item.sublabel || '')}</div>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-xs font-bold font-mono ${valueColor}">${sign}${Utils.formatMoney(val)}</div>
                </div>
            </div>
        `;
    };

    const totalFlowMagnitude = Math.max(1, cashflow.monthlyIncome + cashflow.monthlyOutflow);
    const incomeBarPct = Math.round((cashflow.monthlyIncome / totalFlowMagnitude) * 100);
    const outflowBarPct = 100 - incomeBarPct;

    const modalHtml = `
        <div id="cashflow-breakdown-modal" class="space-y-4 text-left">
            <!-- Top KPI Summary Cards -->
            <div class="grid grid-cols-2 gap-2.5">
                <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-scale-balanced text-amber-400"></i> Net Worth
                    </div>
                    <div id="cashflow-modal-net-worth" class="text-lg font-extrabold font-mono mt-1 ${netWorthClass}">
                        ${Utils.formatMoney(netWorth.netWorth)}
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                        Bank: <span class="${netWorth.cash >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold">${Utils.formatMoney(netWorth.cash)}</span>
                    </div>
                </div>

                <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-arrows-rotate text-blue-400"></i> Net Cashflow
                    </div>
                    <div id="cashflow-modal-net-monthly" class="text-lg font-extrabold font-mono mt-1 ${netMonthlyClass}">
                        ${netMonthlySign}${Utils.formatMoney(cashflow.netMonthly)}<span class="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                        ${netMonthlySign}${Utils.formatMoney(cashflow.netAnnual)}/yr
                    </div>
                </div>
            </div>

            <!-- Income vs Outflow Visual Ratio Bar -->
            <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div class="flex justify-between text-[11px] font-bold mb-1.5">
                    <span class="text-emerald-400"><i class="fas fa-arrow-trend-up mr-1"></i>Inflow: +${Utils.formatMoney(cashflow.monthlyIncome)}/mo</span>
                    <span class="text-rose-400">Outflow: -${Utils.formatMoney(cashflow.monthlyOutflow)}/mo<i class="fas fa-arrow-trend-down ml-1"></i></span>
                </div>
                <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${incomeBarPct}%"></div>
                    <div class="h-full bg-rose-500 transition-all duration-300" style="width: ${outflowBarPct}%"></div>
                </div>
            </div>

            <!-- Section 1: Monthly Income Ledger -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700">
                    <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-circle-plus"></i> Monthly Income Ledger
                    </span>
                    <span class="text-xs font-bold font-mono text-emerald-400">+${Utils.formatMoney(cashflow.monthlyIncome)}/mo</span>
                </div>
                <div id="cashflow-income-list" class="divide-y divide-slate-700/40">
                    ${cashflow.incomeItems.map(item => renderLedgerRow(item, false)).join('')}
                </div>
            </div>

            <!-- Section 2: Monthly Expenses & Outflows Ledger -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700">
                    <span class="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-circle-minus"></i> Monthly Expenses &amp; Outflows
                    </span>
                    <span class="text-xs font-bold font-mono text-rose-400">-${Utils.formatMoney(cashflow.monthlyOutflow)}/mo</span>
                </div>
                <div id="cashflow-expense-list" class="divide-y divide-slate-700/40">
                    ${cashflow.expenseItems.map(item => renderLedgerRow(item, true)).join('')}
                </div>
            </div>

            <!-- Section 3: Net Worth Balance Sheet (Assets vs Liabilities) -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700">
                    <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-vault"></i> Net Worth Breakdown
                    </span>
                    <span class="text-xs font-bold font-mono ${netWorthClass}">${Utils.formatMoney(netWorth.netWorth)}</span>
                </div>

                <div>
                    <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Assets</span>
                        <span class="text-emerald-400 font-mono">${Utils.formatMoney(netWorth.totalAssets)}</span>
                    </div>
                    <div id="networth-assets-list">
                        ${netWorth.assetItems.map(item => renderBalanceRow(item, false)).join('')}
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-700/70">
                    <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Liabilities &amp; Debt</span>
                        <span class="text-rose-400 font-mono">-${Utils.formatMoney(netWorth.totalLiabilities)}</span>
                    </div>
                    <div id="networth-liabilities-list">
                        ${netWorth.liabilityItems.length > 0
                            ? netWorth.liabilityItems.map(item => renderBalanceRow(item, true)).join('')
                            : `<div class="text-xs text-slate-400 italic py-1.5 text-center">Debt-free! No active loans or liabilities ($0).</div>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Cashflow & Net Worth",
        content: modalHtml,
        showCloseBtn: true
    });
}
