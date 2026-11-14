import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderDeathScreen } from '../player/mainScreen.js';
import { processNextFuneral, processNextTeacherReplacement } from '../relationships/funeralScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
export * from './assetsPropertySalesModals.js';
export * from './assetsLandlordModals.js';
export * from './assetsVehicleJewelryModals.js';

const get = id => document.getElementById(id);

// --- HELPER: Generates the HTML for the list of jewelry ---
function getJewelryListHtml(assets) {
    const jewelry = assets.filter(a => a.category === 'jewelry');

    if (jewelry.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any jewelry or luxury items.</div>`;
    }

    return jewelry.map(j => {
        const style = GameLogic.getJewelryIcon(j.type);
        const wearingBadge = j.wearing ? `<span class="bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Equipped</span>` : '';
        const insuredBadge = j.insured ? `<span class="bg-blue-900/60 text-blue-300 border border-blue-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Insured</span>` : '';

        return `
            <div data-action="renderJewelryManager" data-args="&apos;${j.id}&apos;" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                        <i class="fas ${style.icon} ${style.color} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-amber-300 transition">${j.name}</h4>
                        <div class="text-xs text-slate-400 capitalize flex items-center gap-1.5 mt-0.5">
                            <span class="text-amber-400 font-bold">${j.type}</span>
                            ${wearingBadge}
                            ${insuredBadge}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-green-400 font-bold text-sm">Value: ${Utils.formatMoney(j.value)}</div>
                    <i class="fas fa-chevron-right text-slate-600 text-xs mt-1"></i>
                </div>
            </div>
        `;
    }).join('');
}

// --- HELPER: Generates the HTML for the list of cars ---
function getVehicleListHtml(assets) {
    const vehicles = assets.filter(a => a.category === 'vehicle');

    if (vehicles.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any vehicles.</div>`;
    }

    const currentAge = (state.gameState.user && state.gameState.user.age) || 18;

    return vehicles.map(v => {
        const condColor = v.condition > 70 ? 'text-green-400' : v.condition > 40 ? 'text-yellow-400' : 'text-red-400';
        const primaryBadge = v.isPrimary ? `<span class="bg-blue-900/60 text-blue-300 border border-blue-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Primary</span>` : '';
        const insuredBadge = v.insured ? `<span class="bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Insured</span>` : '';

        return `
            <div data-action="renderVehicleManager" data-args="&apos;${v.id}&apos;" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                        <i class="fas fa-car text-blue-400 text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-blue-300 transition">${v.name}</h4>
                        <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Condition: <span class="${condColor} font-bold">${v.condition}%</span></span>
                            ${primaryBadge}
                            ${insuredBadge}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-green-400 font-bold text-sm">Value: ${Utils.formatMoney(v.value)}</div>
                    <i class="fas fa-chevron-right text-slate-600 text-xs mt-1"></i>
                </div>
            </div>
        `;
    }).join('');
}

// --- HELPER: Generates the HTML for the list of properties ---
function getPropertyListHtml(assets) {
    const user = state.gameState?.user;
    const properties = assets.filter(a => a.category === 'property');

    if (properties.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any real estate.</div>`;
    }

    const isManagerHired = GameLogic.isPropertyManagerHired(user);

    return properties.map(p => {
        const isRented = p.isRented && p.tenant;
        const monthlyRent = p.tenant?.monthlyRent || p.tenant?.rent || 0;
        const tenantBadge = isRented 
            ? `<span class="bg-green-900/60 text-green-300 border border-green-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold"><i class="fas fa-user-check text-[8px] mr-0.5"></i> Rented ($${monthlyRent.toLocaleString()}/mo)</span>`
            : `<span class="bg-slate-700 text-slate-400 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Vacant</span>`;
        
        const isManaged = isRented && isManagerHired;
        const managedBadge = isManaged
            ? `<span class="bg-indigo-900/60 text-indigo-300 border border-indigo-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold"><i class="fas fa-user-tie text-[8px] mr-0.5"></i> Managed</span>`
            : '';

        const mortgageBadge = p.hasMortgage && p.mortgage && p.mortgage.principal > 0
            ? `<span class="bg-amber-900/60 text-amber-300 border border-amber-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold"><i class="fas fa-landmark text-[8px] mr-0.5"></i> Mortgage ($${Math.round(p.mortgage.monthlyPayment).toLocaleString()}/mo)</span>`
            : `<span class="bg-blue-900/40 text-blue-300 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Paid Off</span>`;

        return `
            <div data-action="renderPropertyManager" data-args="&apos;${p.id}&apos;" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                        <i class="fas fa-home text-green-400 text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-green-300 transition">${p.name}</h4>
                        <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            ${tenantBadge}
                            ${managedBadge}
                            ${mortgageBadge}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-green-400 font-bold text-sm">Value: ${Utils.formatMoney(p.value)}</div>
                    <i class="fas fa-chevron-right text-slate-600 text-xs mt-1"></i>
                </div>
            </div>
        `;
    }).join('');
}

// --- MAIN FUNCTION ---
export function renderAssets() {
    const user = state.gameState?.user;
    if (!user) return;

    if (user.lifeStatus === 'Deceased') {
        renderDeathScreen(user, user.deathCause || 'natural causes');
        return;
    }

    if (state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0) {
        processNextFuneral();
        return;
    }

    if (state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0) {
        processNextTeacherReplacement();
        return;
    }

    let monthlyIncome = GameLogic.calculateUserMonthlyIncome(user);
    let monthlyOutflow = GameLogic.calculateUserMonthlyOutflow(user);
    user.monthlyOutflow = monthlyOutflow;
    
    // Ensure assets array exists
    const assets = user.assets || [];
    const vehicleHtml = getVehicleListHtml(assets);
    const propertyHtml = getPropertyListHtml(assets);
    const jewelryHtml = getJewelryListHtml(assets);

    const hasRealEstate = assets.some(a => a.category === 'property');
    let propertyManagerCardHtml = '';
    if (hasRealEstate) {
        if (GameLogic.isPropertyManagerHired(user)) {
            const pm = user.propertyManager;
            const pmSummary = GameLogic.getPropertyManagerSummary(user);
            propertyManagerCardHtml = `
                <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-4 rounded-xl border border-indigo-700/60 mb-4 shadow-md">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-800 shrink-0 shadow">
                                ${renderAvatar(pm)}
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-white text-sm">${Utils.escapeHtml(pm.name)}</h4>
                                    <span class="bg-indigo-900/80 text-indigo-300 border border-indigo-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold">Active</span>
                                </div>
                                <div class="text-[11px] text-indigo-300 font-semibold">${Utils.escapeHtml(pm.title || 'Licensed Property Manager')}</div>
                                <div class="text-[10px] text-slate-400 mt-0.5">Managing ${pmSummary.managedCount} ${pmSummary.managedCount === 1 ? 'rental' : 'rentals'} • 10% Fee</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] uppercase font-bold text-slate-400">Net Monthly</div>
                            <div class="text-green-400 font-bold text-sm">${Utils.formatMoney(pmSummary.netMonthly)}/mo</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center mb-3">
                        <div>
                            <div class="text-[9px] uppercase font-bold text-slate-400">Gross Rent</div>
                            <div class="text-white font-bold text-xs mt-0.5">${Utils.formatMoney(pmSummary.grossMonthly)}/mo</div>
                        </div>
                        <div class="border-x border-slate-800 px-1">
                            <div class="text-[9px] uppercase font-bold text-amber-400">10% Fee</div>
                            <div class="text-amber-400 font-bold text-xs mt-0.5">-${Utils.formatMoney(pmSummary.feeMonthly)}/mo</div>
                        </div>
                        <div>
                            <div class="text-[9px] uppercase font-bold text-slate-400">Lifetime Paid</div>
                            <div class="text-slate-300 font-bold text-xs mt-0.5">${Utils.formatMoney(pm.lifetimeFeesPaid || 0)}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        ${pm.lastReport ? `
                            <button data-action="viewLastManagerReport" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                                <i class="fas fa-file-invoice-dollar"></i> View Annual Report
                            </button>
                        ` : ''}
                        <button data-action="openFirePropertyManagerConfirm" class="${pm.lastReport ? 'shrink-0' : 'w-full'} bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 hover:border-red-800/80 font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-slate-700">
                            <i class="fas fa-user-times"></i> Fire Manager
                        </button>
                    </div>
                </div>
            `;
        } else {
            propertyManagerCardHtml = `
                <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 rounded-xl border border-slate-700/80 mb-4 flex items-center justify-between gap-3 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
                            <i class="fas fa-user-tie text-lg"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm">Hire a Property Manager</h4>
                            <p class="text-xs text-slate-400 leading-snug">Auto-collect rent & handle tenant renewals for a flat 10% fee.</p>
                        </div>
                    </div>
                    <button data-action="openHirePropertyManagerModal" class="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition shadow-md shadow-indigo-950 flex items-center gap-1.5">
                        <i class="fas fa-user-plus"></i> Hire
                    </button>
                </div>
            `;
        }
    }

    UI.updateBottomNav('assets');
    const backBtnHtml = !UI.isBottomNavEnabled() ? `
        <div class="mb-4">
            <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
    ` : '';
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            ${backBtnHtml}
            
            <h2 class="text-2xl font-bold mb-4 px-1">My Assets</h2>
            
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Income</div>
                    <div class="text-green-400 font-bold text-sm">${Utils.formatMoney(monthlyIncome)}/mo</div>
                </div>
                <div class="border-x border-slate-700 px-2">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Student Loans</div>
                    <div class="text-red-400 font-bold text-sm">${Utils.formatMoney(user.studentLoans)}</div>
                </div>
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Monthly Outflow</div>
                    <div class="text-red-400 font-bold text-sm">${Utils.formatMoney(monthlyOutflow)}/mo</div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-4">
                
                <div class="grid grid-cols-1 gap-3 mb-6">
                    <div data-action="renderShoppingHub" class="bg-slate-800 p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-750 hover:border-yellow-500/50 transition flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-yellow-600/30 flex items-center justify-center text-yellow-500 shrink-0">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-extrabold tracking-wider text-yellow-500">Go Shopping</div>
                                <h3 class="font-bold text-white text-sm">Buy Items & Real Estate</h3>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
                    </div>

                    ${(() => {
                        const isLocked = user.age < 14;
                        return `
                            <div data-action="renderInvestmentsScreen" class="bg-slate-800 p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-750 ${isLocked ? 'hover:border-amber-500/50 opacity-80' : 'hover:border-emerald-500/50'} transition flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl ${isLocked ? 'bg-amber-900/40 text-amber-400' : 'bg-emerald-600/30 text-emerald-400'} flex items-center justify-center shrink-0">
                                        <i class="fas ${isLocked ? 'fa-lock' : 'fa-chart-line'}"></i>
                                    </div>
                                    <div>
                                        <div class="text-[10px] uppercase font-extrabold tracking-wider ${isLocked ? 'text-amber-400' : 'text-emerald-400'}">Investments</div>
                                        <h3 class="font-bold ${isLocked ? 'text-slate-300' : 'text-white'} text-sm">${isLocked ? 'Locked until age 14' : 'Manage Savings & Stock Market'}</h3>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    ${isLocked ? `<span class="bg-amber-950/80 text-amber-300 border border-amber-700/60 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"><i class="fas fa-lock text-[9px]"></i> Unlocks at Age 14</span>` : `<i class="fas fa-chevron-right text-slate-500 text-xs"></i>`}
                                </div>
                            </div>
                        `;
                    })()}

                    ${user.isRetired && user.retirementPension > 0 ? `
                        <div class="bg-slate-800 p-4 rounded-xl border border-amber-500/40 shadow-sm shadow-amber-950/30 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-amber-900/40 text-amber-400 flex items-center justify-center shrink-0">
                                    <i class="fas fa-cocktail"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">Retirement Pension • Guaranteed Annual Payout</div>
                                    <h3 class="font-bold text-white text-sm">${Utils.formatMoney(user.retirementPension)}/yr</h3>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="bg-amber-950/80 text-amber-300 border border-amber-700/60 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full block mb-1">
                                    +${Utils.formatMoney(Math.floor(user.retirementPension / 12))}/mo
                                </span>
                                <span class="text-[10px] text-green-400 font-bold flex items-center justify-end gap-1"><i class="fas fa-check-circle"></i> Active</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="mb-6">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                        <i class="fas fa-gem text-amber-400"></i> Jewelry & Luxury Goods
                    </h3>
                    <div class="flex flex-col">
                        ${jewelryHtml}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                        <i class="fas fa-car text-blue-400"></i> Vehicles
                    </h3>
                    <div class="flex flex-col">
                        ${vehicleHtml}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                        <i class="fas fa-home text-green-400"></i> Properties
                    </h3>
                    ${propertyManagerCardHtml}
                    <div class="flex flex-col">
                        ${propertyHtml}
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;
}
