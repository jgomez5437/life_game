import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { captureAnnualSnapshot } from '../../core/timeMachine.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { renderAssets } from './assetsScreen.js';

const get = id => document.getElementById(id);

export const renderPropertyManager = (id) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === id);

    if (!property) {
        renderAssets();
        return;
    }

    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    const style = GameLogic.getPropertyIcon(property.type);
    const hasMortgage = property.mortgage && property.mortgage.remainingBalance > 0;
    const remainingBalance = hasMortgage ? property.mortgage.remainingBalance : 0;
    const monthlyPayment = hasMortgage ? property.mortgage.monthlyPayment : 0;
    const canPayOff = hasMortgage && user.money >= remainingBalance;

    const maintenanceCost = GameLogic.calculateMaintenanceCost(property);
    const canMaintain = user.money >= maintenanceCost && property.condition < property.maxCondition;
    const renovationOptions = GameLogic.calculateRenovationOptions(property);
    const isRenovatedThisYear = property.renovatedThisYear || (user.age !== undefined && property.lastRenovationAge === user.age);
    const isPristine = property.condition >= 100 && property.maxCondition >= 100;
    const isManaged = GameLogic.isPropertyManaged(user, property);

    const renovationHtml = renovationOptions.map(opt => {
        const canAffordRenov = user.money >= opt.cost;
        const canRenovate = canAffordRenov && !isRenovatedThisYear && !isPristine;

        let btnText = 'Renovate';
        if (isRenovatedThisYear) btnText = 'Done This Year';
        else if (isPristine) btnText = 'Pristine (100%)';
        else if (!canAffordRenov) btnText = "Can't Afford";

        return `
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-white text-sm">${opt.name}</h4>
                        <p class="text-xs text-slate-400 leading-snug">${opt.desc}</p>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                        <span class="text-green-400 font-bold text-sm">${Utils.formatMoney(opt.cost)}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                    <div>
                        <span class="text-blue-400 font-bold">+${opt.condGain}% Cond</span> • 
                        <span class="text-purple-400 font-bold">+${opt.maxCondGain}% Cap</span> • 
                        <span class="text-green-400 font-bold">Up to +${opt.valueBoostRatio * 100}% Value</span>
                    </div>
                    <button data-action="doPropertyRenovation" data-args="${property.id}, '${opt.id}'"
                        ${canRenovate ? '' : 'disabled'}
                        class="${canRenovate ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} px-2.5 py-1 rounded font-bold text-xs transition">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto overflow-y-auto pb-6">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mx-auto mb-4">
                    <i class="fas ${style.icon} ${style.color} text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${property.name}</h2>
                <div class="text-green-400 font-bold text-xl mt-1">${Utils.formatMoney(property.value)}</div>
                <p class="text-slate-500 text-sm capitalize">${property.type}</p>
            </div>

            <!-- CONDITION CARD -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Property Condition</span>
                    <span class="${property.condition < 40 ? 'text-red-400' : 'text-green-400'} font-bold">${property.condition}% <span class="text-xs text-slate-400 font-normal">(Max: ${property.maxCondition}%)</span></span>
                </div>
                <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden mb-2">
                    <div class="h-full ${property.condition < 40 ? 'bg-red-500' : property.condition < 75 ? 'bg-yellow-500' : 'bg-green-500'} transition-all duration-500" style="width: ${property.condition}%"></div>
                </div>
                <p class="text-xs text-slate-400 text-center">
                    ${property.condition < 40 ? "Disrepair is hurting this property's market value! Renovate soon." : "Property is in good standing."}
                </p>

                <!-- MAINTENANCE BUTTON -->
                <button data-action="doPropertyMaintenance" data-args="${property.id}"
                    ${canMaintain ? '' : 'disabled'}
                    class="w-full mt-4 ${canMaintain ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition">
                    <span class="flex items-center gap-2">
                        <i class="fas fa-wrench"></i> Routine Maintenance
                    </span>
                    <span>Cost: ${Utils.formatMoney(maintenanceCost)}</span>
                </button>
            </div>

            <!-- RENOVATION OPTIONS -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-4">
                <h3 class="font-bold text-white text-base mb-1 flex items-center gap-2">
                    <i class="fas fa-hammer text-amber-400"></i> Property Renovations
                </h3>
                <p class="text-xs text-slate-400 mb-3">Renovations restore condition, raise quality caps, and boost market value proportionally. Limited to once per year per property.</p>
                <div class="space-y-2">
                    ${renovationHtml}
                </div>
            </div>

            <!-- LANDLORD / RENTAL STATUS CARD -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-4">
                <h3 class="font-bold text-white text-base mb-1 flex items-center justify-between">
                    <span class="flex items-center gap-2">
                        <i class="fas fa-user-tie text-blue-400"></i> Rental Management
                    </span>
                    ${property.isRented && property.tenant ? `
                        <span class="bg-green-900/60 text-green-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-green-700/60">Occupied</span>
                    ` : `
                        <span class="bg-slate-700 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-bold">Vacant</span>
                    `}
                </h3>

                ${property.isRented && property.tenant ? `
                    ${isManaged ? `
                        <div class="bg-indigo-950/60 border border-indigo-800/70 rounded-xl p-3 mt-3 flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <div class="w-9 h-9 rounded-full overflow-hidden border border-indigo-400 bg-slate-800 shrink-0">
                                    ${renderAvatar(user.propertyManager)}
                                </div>
                                <div>
                                    <div class="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                                        <i class="fas fa-shield-alt text-[9px]"></i> Managed by ${Utils.escapeHtml(user.propertyManager.name)}
                                    </div>
                                    <div class="text-xs text-slate-300">10% Fee (${Utils.formatMoney(Math.round(property.tenant.monthlyRent * 0.10))}/mo)</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-[9px] uppercase font-bold text-slate-400">Net Rent</div>
                                <div class="text-xs text-green-400 font-bold">${Utils.formatMoney(Math.round(property.tenant.monthlyRent * 0.90))}/mo</div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 mt-3 flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/60 bg-slate-800 shrink-0 shadow-md">
                            ${renderAvatar(property.tenant)}
                        </div>
                        <div class="flex-1 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="font-bold text-white text-base">${Utils.escapeHtml(property.tenant.name)}</h4>
                                <span class="font-bold ${property.tenant.quality === 'excellent' ? 'text-green-400' : property.tenant.quality === 'good' ? 'text-blue-400' : 'text-amber-400'} uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${property.tenant.quality}</span>
                            </div>
                            <div class="text-xs text-blue-400 font-semibold">${Utils.escapeHtml(property.tenant.type)}</div>
                            <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                                <span class="text-slate-400">Rent: <span class="font-bold text-green-400">${Utils.formatMoney(property.tenant.monthlyRent)}/mo</span></span>
                                <span class="text-slate-400">Lease: <span class="font-bold text-slate-200">${property.tenant.leaseYears} yr${property.tenant.leaseYears === 1 ? '' : 's'}</span></span>
                            </div>
                        </div>
                    </div>
                    <button data-action="evictTenantAction" data-args="${property.id}" class="w-full mt-3 bg-red-900/40 hover:bg-red-900/70 border border-red-800 text-red-200 font-bold py-2 rounded-xl text-xs transition">
                        Evict Tenant
                    </button>
                ` : `
                    <p class="text-xs text-slate-400 mt-1 mb-3">List this property on the rental market to screen tenant applicants and earn passive monthly income.</p>
                    <button data-action="openTenantScreening" data-args="${property.id}" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition">
                        <i class="fas fa-bullhorn"></i> List Property For Rent
                    </button>
                `}
            </div>

            <!-- FINANCIAL STATUS -->
            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-4">
                <h3 class="font-bold text-white text-base mb-3 border-b border-slate-700 pb-2">Financial Status</h3>
                ${hasMortgage ? `
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-400">Mortgage Balance</span>
                        <span class="text-yellow-400 font-bold">${Utils.formatMoney(remainingBalance)}</span>
                    </div>
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-400">Monthly Payment</span>
                        <span class="text-red-400 font-bold">${Utils.formatMoney(monthlyPayment)}/mo</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Status</span>
                        <span class="text-yellow-400 font-bold">Financed</span>
                    </div>
                ` : `
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Status</span>
                        <span class="text-green-400 font-bold">Fully Owned (No Mortgage)</span>
                    </div>
                `}
            </div>

            <div class="grid grid-cols-1 gap-3">
                ${hasMortgage ? `
                    <button data-action="payOffMortgage" data-args="${property.id}"
                        ${canPayOff ? '' : 'disabled'}
                        class="${canPayOff ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'} p-4 rounded-xl border border-green-500/50 flex items-center justify-between transition group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-400">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="text-left">
                                <h3 class="font-bold text-white">Pay Off Mortgage Early</h3>
                                <div class="text-xs text-green-200">Cost: ${Utils.formatMoney(remainingBalance)}</div>
                            </div>
                        </div>
                    </button>
                ` : ''}

                <button data-action="openSellPropertyModal" data-args="${property.id}" class="bg-red-900/40 p-4 rounded-xl border border-red-800/50 flex items-center justify-between hover:bg-red-900/60 transition group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Sell Property</h3>
                            <div class="text-xs text-red-300">List on market (${hasMortgage ? 'Net equity: ' + Utils.formatMoney(Math.max(0, property.value - remainingBalance)) : 'Full value'})</div>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    `;
};

export const doPropertyMaintenance = (id) => {
    const user = state.gameState.user;
    const result = GameLogic.performPropertyMaintenance(user, id);

    if (result.success) {
        addLog(`Performed routine maintenance on ${result.propertyName} for ${Utils.formatMoney(result.cost)}.`, 'good');
        saveGame();
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Maintenance Completed", `Restored ${Utils.escapeHtml(result.propertyName)}'s condition to ${result.restoredCondition}% (Max cap: ${result.maxCondition}%).`);
    } else {
        UI.showModal("Maintenance Failed", result.reason);
    }
};

export const doPropertyRenovation = (id, optionId) => {
    const user = state.gameState.user;
    const result = GameLogic.renovateProperty(user, id, optionId);

    if (result.success) {
        addLog(`Renovated ${result.propertyName} (${result.optionName}) for ${Utils.formatMoney(result.cost)}. Value increased by ${Utils.formatMoney(result.valueIncrease)}!`, 'major');
        saveGame();
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Renovation Complete!", `Your ${Utils.escapeHtml(result.propertyName)} underwent a ${Utils.escapeHtml(result.optionName)}! Condition is now ${result.newCondition}% (Max: ${result.newMaxCondition}%) and property value increased to ${Utils.formatMoney(result.newValue)}.`);
    } else {
        UI.showModal("Renovation Failed", result.reason);
    }
};

export const payOffMortgage = (id) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === id);

    if (!property || !property.mortgage) return;

    const cost = property.mortgage.remainingBalance;
    if (user.money >= cost) {
        user.money -= cost;
        property.mortgage = null;

        addLog(`Paid off remaining mortgage of ${Utils.formatMoney(cost)} on ${property.name}!`, 'good');
        saveGame();
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Mortgage Paid Off!", `You now own ${Utils.escapeHtml(property.name)} free and clear!`);
    }
};

export const openSellPropertyModal = (id) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === id);
    if (!property) return;

    const saleTiers = GameLogic.calculatePropertySaleTiers(property);

    const tiersHtml = saleTiers.map(tier => `
        <button data-action="submitPropertyListing" data-args="${property.id}, '${tier.id}'"
            class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between text-left transition group">
            <div>
                <h4 class="font-bold text-white text-sm group-hover:text-green-300 transition">${tier.name}</h4>
                <p class="text-xs text-slate-400">${tier.desc}</p>
            </div>
            <div class="text-right shrink-0">
                <span class="font-bold text-green-400 text-base">${Utils.formatMoney(tier.price)}</span>
            </div>
        </button>
    `).join('');

    const modalHtml = `
        <div class="space-y-4">
            <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
                <div class="text-xs text-slate-400 font-bold uppercase">Estimated Market Value</div>
                <div class="text-2xl font-bold text-green-400 mt-1">${Utils.formatMoney(property.value)}</div>
                <div class="text-xs text-slate-400 mt-1">${Utils.escapeHtml(property.name)}</div>
            </div>

            <p class="text-xs text-slate-300 text-center">Select a listing price point to market your property to potential buyers:</p>

            <div class="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                ${tiersHtml}
            </div>
        </div>
    `;

    UI.showModal(`Sell Property - ${Utils.escapeHtml(property.name)}`, modalHtml);
};

export const submitPropertyListing = (propertyId, tierId) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === propertyId);
    if (!property) return;

    const result = GameLogic.generatePropertyBuyerOffer(property, tierId);

    if (result.hasOffer) {
        saveGame();
        const buyer = result.buyer;
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-green-900/30 p-4 rounded-xl border border-green-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-green-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(buyer)}
                    </div>
                    <h3 class="text-white font-bold text-lg">Offer Received!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        <span class="font-bold text-white">${Utils.escapeHtml(buyer.name)}</span> submitted an offer to purchase <span class="font-bold text-white">${Utils.escapeHtml(property.name)}</span>.
                    </p>
                    <div class="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1.5 text-xs text-left">
                        <div class="flex justify-between">
                            <span class="text-slate-400">Buyer Offer:</span>
                            <span class="font-bold text-green-400 text-sm">${Utils.formatMoney(result.offerAmount)}</span>
                        </div>
                        ${result.remainingMortgage > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-slate-400">Mortgage Payoff:</span>
                                <span class="font-bold text-yellow-400">-${Utils.formatMoney(result.remainingMortgage)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between border-t border-slate-800 pt-1.5 text-sm">
                            <span class="text-white font-bold">Net Cash Proceeds:</span>
                            <span class="font-bold text-green-300">${Utils.formatMoney(result.netProceeds)}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <button data-action="acceptBuyerOffer" data-args="${property.id}" class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs transition">
                        Accept Offer
                    </button>
                    <button data-action="rejectBuyerOffer" data-args="${property.id}" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs transition">
                        Reject Offer
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal({
            title: `Buyer Offer - ${Utils.escapeHtml(property.name)}`,
            content: modalHtml,
            showCloseBtn: true
        });
    } else {
        saveGame();
        addLog(`Listed ${property.name} at ${result.tierName} (${Utils.formatMoney(result.listPrice)}), but no buyers submitted an offer.`, 'neutral');
        UI.showModal("No Offers Received", `No buyers submitted an offer for ${Utils.escapeHtml(property.name)} at this price point. You can try listing it again at a different price point.`);
    }
};

export const acceptBuyerOffer = (propertyId) => {
    const user = state.gameState.user;
    const result = GameLogic.completePropertySale(user, propertyId);

    if (result.success) {
        const buyerName = result.buyerName || "the buyer";
        if (result.remainingMortgage > 0) {
            addLog(`Sold ${result.propertyName} to ${buyerName} for ${Utils.formatMoney(result.offerAmount)}, paying off ${Utils.formatMoney(result.remainingMortgage)} mortgage. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`, 'good');
        } else {
            addLog(`Sold ${result.propertyName} to ${buyerName} for ${Utils.formatMoney(result.offerAmount)}. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`, 'good');
        }

        saveGame();
        UI.hideModal();
        UI.updateHeader(user);
        renderAssets();
        UI.showModal("Property Sold!", `Congratulations! You sold ${Utils.escapeHtml(result.propertyName)} to ${Utils.escapeHtml(buyerName)} for ${Utils.formatMoney(result.offerAmount)}. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`);
    } else {
        UI.showModal("Sale Error", result.reason);
    }
};

export const rejectBuyerOffer = (propertyId) => {
    const user = state.gameState.user;
    const property = (user?.assets || []).find(a => a.id === propertyId);
    if (property) {
        delete property.activeOffer;
        saveGame();
    }
    UI.hideModal();
};


// --- PROPERTY MANAGER UI HANDLERS ---
let _candidateManager = null;

export const openHirePropertyManagerModal = () => {
    const user = state.gameState?.user;
    if (!user) return;
    const rented = (user.assets || []).filter(a => a.category === 'property' && a.isRented && a.tenant);
    if (rented.length === 0) {
        UI.showModal(
            "No Rented Properties",
            "You need at least one rented property before hiring a property manager. Buy a property and list it for rent first!"
        );
        return;
    }

    _candidateManager = GameLogic.generatePropertyManagerCandidate();
    const summary = GameLogic.getPropertyManagerSummary(user);

    const modalHtml = `
        <div class="space-y-4">
            <div class="bg-indigo-950/60 p-4 rounded-xl border border-indigo-700/60 text-center shadow-lg">
                <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-800 mx-auto mb-2 shadow-md">
                    ${renderAvatar(_candidateManager)}
                </div>
                <h3 class="text-white font-bold text-lg">${Utils.escapeHtml(_candidateManager.name)}</h3>
                <p class="text-indigo-300 text-xs font-semibold">${Utils.escapeHtml(_candidateManager.title)}</p>
                <div class="mt-2 inline-block bg-indigo-900/80 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full border border-indigo-600/70">
                    Fee: 10% of Collected Rent
                </div>
            </div>

            <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700/80 text-xs space-y-2 text-slate-300">
                <div class="font-bold text-white text-sm mb-1">What your manager handles:</div>
                <div class="flex items-start gap-2">
                    <i class="fas fa-check text-green-400 mt-0.5"></i>
                    <span><strong>Manages only rented properties</strong> (never your personal home or vacant units).</span>
                </div>
                <div class="flex items-start gap-2">
                    <i class="fas fa-check text-green-400 mt-0.5"></i>
                    <span><strong>Collects rent</strong> and resolves late payments quietly.</span>
                </div>
                <div class="flex items-start gap-2">
                    <i class="fas fa-check text-green-400 mt-0.5"></i>
                    <span><strong>Takes care of lease renewals</strong> and finds replacement tenants automatically.</span>
                </div>
                <div class="flex items-start gap-2">
                    <i class="fas fa-check text-green-400 mt-0.5"></i>
                    <span><strong>Contacts you for repairs</strong> so you can approve or decline each request.</span>
                </div>
            </div>

            <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1.5">
                <div class="text-slate-400 font-bold uppercase text-[10px]">Rental Portfolio Preview</div>
                <div class="flex justify-between text-slate-300">
                    <span>Active Rentals:</span>
                    <span class="font-bold text-white">${summary.managedCount} properties</span>
                </div>
                <div class="flex justify-between text-slate-300">
                    <span>Gross Monthly Rent:</span>
                    <span class="font-bold text-green-400">${Utils.formatMoney(summary.grossMonthly)}/mo</span>
                </div>
                <div class="flex justify-between text-slate-300">
                    <span>10% Management Fee:</span>
                    <span class="font-bold text-amber-400">-${Utils.formatMoney(summary.feeMonthly)}/mo</span>
                </div>
                <div class="flex justify-between text-white font-bold pt-1 border-t border-slate-700 text-sm">
                    <span>Net to You:</span>
                    <span class="text-green-400">${Utils.formatMoney(summary.netMonthly)}/mo</span>
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button data-action="confirmHirePropertyManager" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/40">
                    <i class="fas fa-handshake"></i> Hire ${Utils.escapeHtml(_candidateManager.name)} (10% Fee)
                </button>
                <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition">
                    Cancel
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Hire a Property Manager",
        content: modalHtml,
        showCloseBtn: true
    });
};

export const confirmHirePropertyManager = () => {
    const user = state.gameState?.user;
    if (!user) return;
    const res = GameLogic.hirePropertyManager(user, _candidateManager);
    if (!res.success) {
        UI.showModal("Hiring Failed", res.reason);
        return;
    }
    // Drop any pending legacy tenant events for managed properties
    if (state.gameState && Array.isArray(state.gameState.pendingTenantEvents)) {
        state.gameState.pendingTenantEvents = state.gameState.pendingTenantEvents.filter(e => {
            if (e.eventType === 'manager_report') return true;
            const prop = (user.assets || []).find(a => a.id === e.propertyId);
            return !GameLogic.isPropertyManaged(user, prop);
        });
    }
    addLog(`Hired ${res.manager.name} as your Property Manager (10% fee).`, 'good');
    captureAnnualSnapshot(state.gameState);
    saveGame();
    UI.hideModal();
    UI.updateHeader(user);
    renderAssets();
    UI.showModal(
        "Property Manager Hired!",
        `You have hired ${Utils.escapeHtml(res.manager.name)}! They will collect rent (taking a 10% fee), manage lease renewals, and contact you when repairs are needed.`
    );
};

export const openFirePropertyManagerConfirm = () => {
    const user = state.gameState?.user;
    if (!user || !user.propertyManager) return;
    const name = user.propertyManager.name;

    UI.showConfirm(
        "Fire Property Manager?",
        `Are you sure you want to fire ${Utils.escapeHtml(name)}? You will have to collect rent, handle tenant lease renewals, and screen new applicants yourself.`,
        "Fire Manager",
        () => {
            const res = GameLogic.firePropertyManager(user);
            if (res.success) {
                addLog(`Fired property manager ${name}. You are now managing your rentals yourself.`, 'neutral');
                captureAnnualSnapshot(state.gameState);
                saveGame();
                UI.updateHeader(user);
                renderAssets();
                UI.showModal("Manager Fired", `You have let ${Utils.escapeHtml(name)} go. You are now responsible for managing all your properties.`);
            }
        },
        "Keep Manager"
    );
};
