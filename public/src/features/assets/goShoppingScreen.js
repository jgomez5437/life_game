import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';

const get = id => document.getElementById(id);

// screens/shoppingScreen.js

// Main shopping hub
export const renderShoppingHub = () => {
    const user = state.gameState.user;

    if ((user.age || 0) <= 12) {
        UI.showModal("Too Young", "You must be at least 13 years old to go shopping (Age 13+ required).");
        return;
    }

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Life
                </button>
            </div>
            
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Marketplace</h2>
                <p class="text-slate-400">What would you like to buy?</p>
            </div>

            <div class="grid grid-cols-1 gap-4">
                
                <button data-action="renderVehicleDealer" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-blue-500 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 text-xl group-hover:scale-110 transition">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-lg">Car Dealership</h3>
                            <div class="text-xs text-slate-500">Buy transportation</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600 group-hover:text-white"></i>
                </button>

                <button data-action="renderRealEstateDealer" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-green-500 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 text-xl group-hover:scale-110 transition">
                            <i class="fas fa-home"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-lg">Real Estate</h3>
                            <div class="text-xs text-slate-500">Buy houses & condos</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600 group-hover:text-white"></i>
                </button>

                <button data-action="renderJewelryDealer" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-yellow-500 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-400 text-xl group-hover:scale-110 transition">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-lg">Jewelry & Luxury Goods</h3>
                            <div class="text-xs text-slate-500">Watches, rings, fine jewelry</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600 group-hover:text-white"></i>
                </button>

            </div>
        </div>
    `;
};

let currentVehicleShowroom = 'used';

export const renderVehicleDealer = (showroomCategory) => {
    const user = state.gameState.user;
    UI.hideModal();

    if ((user.age || 0) < 16) {
        UI.showModal("Too Young", "You must be at least 16 years old to visit the car dealership.");
        return;
    }

    if (showroomCategory) {
        currentVehicleShowroom = showroomCategory;
    }

    const allVehicles = GameLogic.VEHICLES_FOR_SALE || [];
    const filteredVehicles = allVehicles.filter(v => (v.showroom || 'used') === currentVehicleShowroom);
    const hasOwnedVehicles = (user.assets || []).some(a => a.category === 'vehicle');

    const carListHtml = filteredVehicles.map(car => {
        const canAffordCash = user.money >= car.price;
        const loanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);
        const canAffordDown = user.money >= loanInfo.downPayment;
        const style = GameLogic.getVehicleIcon(car.type);

        const isShowroomNew = (car.showroom === 'mall' || car.showroom === 'exotic');
        const displayName = isShowroomNew && !car.name.startsWith('New ') ? `New ${car.name}` : car.name;

        const stars = "★".repeat(car.reliability || 3) + "☆".repeat(5 - (car.reliability || 3));

        return `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3 mb-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                            <i class="fas ${style.icon} ${style.color} text-xl"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-white text-base leading-tight">${displayName}</h3>
                                ${car.statusBonus > 0 ? `<span class="bg-amber-900/60 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-700">+${car.statusBonus} Status</span>` : ''}
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5">${car.desc}</p>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                        <div class="text-green-400 font-bold text-base">${Utils.formatMoney(car.price)}</div>
                        <div class="text-[11px] text-slate-400 font-semibold">${Utils.formatMoney(loanInfo.monthlyPayment)}/mo est.</div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                    <div class="flex items-center gap-3 text-slate-400">
                        <span>Reliability: <span class="text-amber-400 font-bold">${stars}</span></span>
                        <span>Condition: <span class="text-green-400 font-bold">${car.condition}%</span></span>
                    </div>

                    <div class="flex items-center gap-2">
                        ${hasOwnedVehicles ? `
                            <button data-action="openTradeInModal" data-args="${car.id}" 
                                class="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap flex items-center gap-1">
                                <i class="fas fa-exchange-alt"></i> Trade-In
                            </button>
                        ` : ''}
                        <button data-action="buyVehicleCash" data-args="${car.id}" 
                            ${canAffordCash ? '' : 'disabled'}
                            class="${canAffordCash ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap">
                            Pay Cash
                        </button>
                        
                        <button data-action="buyVehicleLoan" data-args="${car.id}" 
                            ${canAffordDown ? '' : 'disabled'}
                            class="${canAffordDown ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap">
                            Finance (${Utils.formatMoney(loanInfo.downPayment)} down)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderShoppingHub" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Market
                </button>
            </div>

            <div class="text-center mb-4">
                <div class="w-14 h-14 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-2 text-2xl">
                    <i class="fas fa-car"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${user.city} Auto Dealership</h2>
                <p class="text-slate-400 text-xs">Buy outright, finance, or trade in an owned vehicle</p>
            </div>

            <!-- Showroom Tabs -->
            <div class="flex bg-slate-900 p-1 rounded-xl mb-4 border border-slate-700 text-xs">
                <button data-action="renderVehicleDealer" data-args="'used'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${currentVehicleShowroom === 'used' ? 'bg-slate-800 text-amber-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-wrench mr-1"></i> Used Lot
                </button>
                <button data-action="renderVehicleDealer" data-args="'mall'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${currentVehicleShowroom === 'mall' ? 'bg-slate-800 text-blue-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-car mr-1"></i> Auto Mall
                </button>
                <button data-action="renderVehicleDealer" data-args="'exotic'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${currentVehicleShowroom === 'exotic' ? 'bg-slate-800 text-purple-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-fire mr-1"></i> Exotic Showroom
                </button>
            </div>

            <div class="flex-1 overflow-y-auto pb-6">
                ${carListHtml.length > 0 ? carListHtml : '<div class="text-center text-slate-500 py-8 italic">No vehicles available in this showroom section right now.</div>'}
            </div>
        </div>
    `;
};

// Real Estate Screen
export const renderRealEstateDealer = () => {
    const user = state.gameState.user;

    if ((user.age || 0) < 18) {
        UI.showModal("Too Young", "You must be at least 18 years old to buy real estate.");
        return;
    }

    const monthlyIncome = GameLogic.calculateUserMonthlyIncome(user);
    const properties = GameLogic.PROPERTIES_FOR_SALE || [];

    const propertyListHtml = properties.map(prop => {
        const canCash = user.money >= prop.price;
        const monthlyMortgage = GameLogic.calculateMonthlyMortgage(prop.price);
        const canMortgage = GameLogic.canAffordMortgage(user, prop.price);
        const style = GameLogic.getPropertyIcon(prop.type);

        return `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3 mb-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                            <i class="fas ${style.icon} ${style.color} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-base">${prop.name}</h3>
                            <p class="text-xs text-slate-400 mt-0.5">${prop.desc}</p>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                        <div class="text-green-400 font-bold text-base">${Utils.formatMoney(prop.price)}</div>
                        <div class="text-[11px] text-slate-400 font-semibold">${Utils.formatMoney(monthlyMortgage)}/mo est.</div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60 text-xs">
                    <button data-action="buyPropertyCash" data-args="${prop.id}" 
                        ${canCash ? '' : 'disabled'}
                        class="${canCash ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-bold text-xs transition">
                        Pay Cash
                    </button>
                    
                    <button data-action="buyPropertyMortgage" data-args="${prop.id}" 
                        ${canMortgage ? '' : 'disabled'}
                        class="${canMortgage ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-bold text-xs transition">
                        Apply for Mortgage
                    </button>
                </div>
            </div>
        `;
    }).join('');

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderShoppingHub" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Market
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-14 h-14 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 mx-auto mb-2 text-2xl">
                    <i class="fas fa-home"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">Century 21 Real Estate</h2>
                <p class="text-slate-400 text-xs">Buy outright or apply for a 30-year fixed mortgage</p>
            </div>

            <div class="flex-1 overflow-y-auto pb-6">
                ${propertyListHtml}
            </div>
        </div>
    `;
};

// --- LOGIC FUNCTIONS (The "Controller") ---

export const buyVehicleCash = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => c.id === carId);
    if (!car) return;

    if (user.money < car.price) {
        UI.showModal("Insufficient Funds", "You cannot afford to pay cash for this vehicle.");
        return;
    }

    user.money -= car.price;

    if (!user.assets) user.assets = [];
    const hasPrimary = user.assets.some(a => a.category === 'vehicle' && a.isPrimary);
    const cleanName = car.name.replace(/^New\s+/i, '');

    const newAsset = {
        id: Date.now(),
        name: cleanName,
        type: car.type,
        purchasePrice: car.price,
        value: car.price,
        condition: car.condition,
        reliability: car.reliability || 3,
        statusBonus: car.statusBonus || 0,
        valuationType: car.valuationType || 'standard',
        category: "vehicle",
        acquiredAge: user.age || 18,
        isPrimary: !hasPrimary,
        insured: false,
        loan: null
    };

    user.assets.push(newAsset);

    GameLogic.adjustStat(user, 'happiness', 10);
    addLog(`Purchased a ${cleanName} for ${Utils.formatMoney(car.price)} in cash. (+10 Happiness)`, 'good');
    saveGame();

    UI.updateHeader(user);
    renderVehicleDealer();
    UI.showModal("Purchase Successful", `You are now the owner of a ${cleanName}!${!hasPrimary ? ' Set as your primary ride.' : ''}`);
};

export const buyVehicleLoan = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => c.id === carId);
    if (!car) return;

    const loanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);

    if (user.money < loanInfo.downPayment) {
        UI.showModal("Insufficient Funds", `You need at least ${Utils.formatMoney(loanInfo.downPayment)} cash for the down payment.`);
        return;
    }

    user.money -= loanInfo.downPayment;

    if (!user.assets) user.assets = [];
    const hasPrimary = user.assets.some(a => a.category === 'vehicle' && a.isPrimary);
    const cleanName = car.name.replace(/^New\s+/i, '');

    const newAsset = {
        id: Date.now(),
        name: cleanName,
        type: car.type,
        purchasePrice: car.price,
        value: car.price,
        condition: car.condition,
        reliability: car.reliability || 3,
        statusBonus: car.statusBonus || 0,
        valuationType: car.valuationType || 'standard',
        category: "vehicle",
        acquiredAge: user.age || 18,
        isPrimary: !hasPrimary,
        insured: false,
        loan: {
            principal: loanInfo.principal,
            remainingBalance: loanInfo.principal,
            monthlyPayment: loanInfo.monthlyPayment,
            annualRate: loanInfo.annualRate
        }
    };

    user.assets.push(newAsset);

    GameLogic.adjustStat(user, 'happiness', 10);
    addLog(`Financed a ${cleanName} with ${Utils.formatMoney(loanInfo.downPayment)} down (${Utils.formatMoney(loanInfo.monthlyPayment)}/mo loan). (+10 Happiness)`, 'good');
    saveGame();

    UI.updateHeader(user);
    renderVehicleDealer();
    UI.showModal("Auto Loan Approved!", `You financed a ${cleanName}! Down payment: ${Utils.formatMoney(loanInfo.downPayment)}. Monthly payment: ${Utils.formatMoney(loanInfo.monthlyPayment)}/mo.`);
};

export const openTradeInModal = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => c.id === carId);
    if (!car) return;

    const userVehicles = (user.assets || []).filter(a => a.category === 'vehicle');
    if (userVehicles.length === 0) {
        UI.showModal("No Vehicles to Trade In", "You do not own any vehicles to trade in.");
        return;
    }

    const isShowroomNew = (car.showroom === 'mall' || car.showroom === 'exotic');
    const targetDisplayName = isShowroomNew && !car.name.startsWith('New ') ? `New ${car.name}` : car.name;
    const baseLoanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);

    const vehicleRowsHtml = userVehicles.map(v => {
        const trade = GameLogic.calculateTradeInValue(v);
        const style = GameLogic.getVehicleIcon(v.type);

        // Cash calculations with trade-in
        const cashDue = Math.max(0, car.price - trade.netEquity);
        const canAffordCash = user.money >= cashDue;

        // Finance calculations with trade-in
        const remainingDown = Math.max(0, baseLoanInfo.downPayment - trade.netEquity);
        const canAffordDown = user.money >= remainingDown;

        const excessEquity = Math.max(0, trade.netEquity - baseLoanInfo.downPayment);
        const adjustedPrincipal = Math.max(0, baseLoanInfo.principal - excessEquity);
        const adjustedLoan = adjustedPrincipal > 0
            ? GameLogic.calculateAutoLoan(adjustedPrincipal + remainingDown, remainingDown > 0 ? (remainingDown / (adjustedPrincipal + remainingDown)) : 0, 4)
            : { monthlyPayment: 0 };
        const monthlyEst = adjustedPrincipal > 0 ? adjustedLoan.monthlyPayment : 0;

        return `
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                            <i class="fas ${style.icon} ${style.color}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white text-sm">${Utils.escapeHtml(v.name)}</h4>
                                ${v.isPrimary ? `<span class="bg-blue-900/80 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700">Primary</span>` : ''}
                            </div>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Condition: <strong class="text-white">${v.condition}%</strong> • Value: <strong class="text-slate-300">${Utils.formatMoney(v.value)}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-amber-400 font-bold text-xs">+${Utils.formatMoney(trade.tradeInValue)} Trade-In</div>
                        ${trade.loanPayoff > 0 ? `<div class="text-[10px] text-red-400 font-semibold">-${Utils.formatMoney(trade.loanPayoff)} Loan Payoff</div>` : ''}
                        <div class="text-xs text-green-400 font-bold mt-0.5">Credit: ${Utils.formatMoney(trade.netEquity)}</div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                    <div class="text-slate-300 text-xs">
                        Cash: <strong class="text-green-400 font-bold">${Utils.formatMoney(cashDue)}</strong>
                        <span class="text-slate-500 mx-1">|</span>
                        Finance: <strong class="text-blue-400 font-bold">${Utils.formatMoney(remainingDown)} down</strong> (${Utils.formatMoney(monthlyEst)}/mo)
                    </div>

                    <div class="flex items-center gap-2">
                        <button data-action="executeTradeInPurchase" data-args="${car.id}, ${v.id}, 'cash'"
                            ${canAffordCash ? '' : 'disabled'}
                            class="${canAffordCash ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-2.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap">
                            Pay Cash
                        </button>
                        <button data-action="executeTradeInPurchase" data-args="${car.id}, ${v.id}, 'loan'"
                            ${canAffordDown ? '' : 'disabled'}
                            class="${canAffordDown ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-2.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap">
                            Finance
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const modalContent = `
        <div class="space-y-4">
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                <div>
                    <span class="text-slate-400 uppercase text-[10px] font-bold block">Target Vehicle</span>
                    <strong class="text-white text-sm">${Utils.escapeHtml(targetDisplayName)}</strong>
                </div>
                <div class="text-right">
                    <span class="text-slate-400 uppercase text-[10px] font-bold block">Purchase Price</span>
                    <strong class="text-green-400 text-sm">${Utils.formatMoney(car.price)}</strong>
                </div>
            </div>

            <p class="text-xs text-slate-400">Select which vehicle to trade in. The dealership appraises your vehicle at 80% market value and settles any active loans:</p>

            <div class="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                ${vehicleRowsHtml}
            </div>

            <div class="text-right pt-2">
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Cancel</button>
            </div>
        </div>
    `;

    UI.showModal(`Trade-In Towards ${targetDisplayName}`, modalContent);
};

export const executeTradeInPurchase = (carId, tradeInAssetId, method) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => c.id === carId);
    if (!car) return;

    if (!user.assets || !Array.isArray(user.assets)) user.assets = [];
    const tradeIndex = user.assets.findIndex(a => a.id === tradeInAssetId && a.category === 'vehicle');
    if (tradeIndex === -1) {
        UI.showModal("Trade-In Error", "Selected trade-in vehicle could not be found in your assets.");
        return;
    }

    const tradeAsset = user.assets[tradeIndex];
    const trade = GameLogic.calculateTradeInValue(tradeAsset);
    const cleanName = car.name.replace(/^New\s+/i, '');
    const wasPrimary = !!tradeAsset.isPrimary;
    const hasOtherPrimary = user.assets.some(a => a.category === 'vehicle' && a.id !== tradeAsset.id && a.isPrimary);

    if (method === 'cash') {
        const cashDue = Math.max(0, car.price - trade.netEquity);
        if (user.money < cashDue) {
            UI.showModal("Insufficient Funds", `You need at least ${Utils.formatMoney(cashDue)} cash after trade-in.`);
            return;
        }

        user.money -= cashDue;

        // Remove traded-in asset
        user.assets.splice(tradeIndex, 1);

        const newAsset = {
            id: Date.now(),
            name: cleanName,
            type: car.type,
            purchasePrice: car.price,
            value: car.price,
            condition: car.condition,
            reliability: car.reliability || 3,
            statusBonus: car.statusBonus || 0,
            valuationType: car.valuationType || 'standard',
            category: "vehicle",
            acquiredAge: user.age || 18,
            isPrimary: wasPrimary || !hasOtherPrimary,
            insured: false,
            loan: null
        };

        user.assets.push(newAsset);

        addLog(`Traded in your ${tradeAsset.name} (${Utils.formatMoney(trade.netEquity)} credit) and bought a ${cleanName} for ${Utils.formatMoney(cashDue)} cash.`, 'good');
        saveGame();

        UI.hideModal();
        UI.updateHeader(user);
        renderVehicleDealer();
        UI.showModal("Trade-In Successful!", `You traded in your ${tradeAsset.name} for ${Utils.formatMoney(trade.netEquity)} credit and paid ${Utils.formatMoney(cashDue)} cash for your new ${cleanName}!`);
    } else {
        // Loan / Financing
        const baseLoanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);
        const remainingDown = Math.max(0, baseLoanInfo.downPayment - trade.netEquity);

        if (user.money < remainingDown) {
            UI.showModal("Insufficient Funds", `You need at least ${Utils.formatMoney(remainingDown)} cash for the down payment.`);
            return;
        }

        user.money -= remainingDown;

        // Excess equity reduces principal
        const excessEquity = Math.max(0, trade.netEquity - baseLoanInfo.downPayment);
        const adjustedPrincipal = Math.max(0, baseLoanInfo.principal - excessEquity);
        const adjustedLoan = adjustedPrincipal > 0
            ? GameLogic.calculateAutoLoan(adjustedPrincipal + remainingDown, remainingDown > 0 ? (remainingDown / (adjustedPrincipal + remainingDown)) : 0, 4)
            : { monthlyPayment: 0, annualRate: baseLoanInfo.annualRate };

        // Remove traded-in asset
        user.assets.splice(tradeIndex, 1);

        const newAsset = {
            id: Date.now(),
            name: cleanName,
            type: car.type,
            purchasePrice: car.price,
            value: car.price,
            condition: car.condition,
            reliability: car.reliability || 3,
            statusBonus: car.statusBonus || 0,
            valuationType: car.valuationType || 'standard',
            category: "vehicle",
            acquiredAge: user.age || 18,
            isPrimary: wasPrimary || !hasOtherPrimary,
            insured: false,
            loan: adjustedPrincipal > 0 ? {
                principal: adjustedPrincipal,
                remainingBalance: adjustedPrincipal,
                monthlyPayment: adjustedLoan.monthlyPayment,
                annualRate: baseLoanInfo.annualRate
            } : null
        };

        user.assets.push(newAsset);

        addLog(`Traded in your ${tradeAsset.name} and financed a ${cleanName} with ${Utils.formatMoney(remainingDown)} down (${Utils.formatMoney(adjustedLoan.monthlyPayment)}/mo loan).`, 'good');
        saveGame();

        UI.hideModal();
        UI.updateHeader(user);
        renderVehicleDealer();
        UI.showModal("Trade-In & Financing Approved!", `You traded in your ${tradeAsset.name} and financed your new ${cleanName}! Down payment: ${Utils.formatMoney(remainingDown)}. Monthly payment: ${Utils.formatMoney(adjustedLoan.monthlyPayment)}/mo.`);
    }
};

export const buyVehicle = (carId) => {
    buyVehicleCash(carId);
};

export const buyPropertyCash = (propertyId) => {
    const user = state.gameState.user;
    const prop = (GameLogic.PROPERTIES_FOR_SALE || []).find(p => p.id === propertyId);

    if (!prop) return;

    if (user.money < prop.price) {
        UI.showModal("Insufficient Funds", "You do not have enough cash to purchase this property outright.");
        return;
    }

    user.money -= prop.price;

    const newAsset = {
        id: Date.now(),
        name: prop.name,
        type: prop.type,
        value: prop.price,
        purchasePrice: prop.price,
        condition: 100,
        category: "property",
        mortgage: null
    };

    if (!user.assets) user.assets = [];
    user.assets.push(newAsset);

    GameLogic.adjustStat(user, 'happiness', 20);
    addLog(`Purchased ${prop.name} for ${Utils.formatMoney(prop.price)} in cash. (+20 Happiness)`, 'good');
    saveGame();
    UI.updateHeader(user);
    renderRealEstateDealer();
    UI.showModal("Property Purchased", `Congratulations! You bought ${prop.name} for ${Utils.formatMoney(prop.price)} in cash.`);
};

export const buyPropertyMortgage = (propertyId) => {
    const user = state.gameState.user;
    const prop = (GameLogic.PROPERTIES_FOR_SALE || []).find(p => p.id === propertyId);

    if (!prop) return;

    const monthlyMortgage = GameLogic.calculateMonthlyMortgage(prop.price);
    const qualification = GameLogic.canAffordMortgage(user, monthlyMortgage);

    if (!qualification.allowed) {
        UI.showModal("Mortgage Application Denied", qualification.reason);
        return;
    }

    const newAsset = {
        id: Date.now(),
        name: prop.name,
        type: prop.type,
        value: prop.price,
        purchasePrice: prop.price,
        condition: 100,
        category: "property",
        mortgage: {
            remainingBalance: prop.price,
            monthlyPayment: monthlyMortgage,
            originalPrincipal: prop.price,
            years: 30,
            annualRate: 0.065
        }
    };

    if (!user.assets) user.assets = [];
    user.assets.push(newAsset);

    GameLogic.adjustStat(user, 'happiness', 20);
    addLog(`Acquired ${prop.name} with a mortgage (${Utils.formatMoney(monthlyMortgage)}/month). (+20 Happiness)`, 'good');
    saveGame();
    UI.updateHeader(user);
    renderRealEstateDealer();
    UI.showModal("Mortgage Approved!", `You acquired ${prop.name}! Your monthly mortgage payment is ${Utils.formatMoney(monthlyMortgage)}.`);
};

// --- JEWELRY STORE DEALER ---
export const renderJewelryDealer = (selectedCategory = 'all') => {
    UI.hideModal();
    const user = state.gameState.user;

    if ((user.age || 0) <= 12) {
        UI.showModal("Too Young", "You must be at least 13 years old to buy fine jewelry.");
        return;
    }

    const items = GameLogic.JEWELRY_FOR_SALE || [];

    const categories = [
        { id: 'all', label: 'All Items', icon: 'fa-gem' },
        { id: 'ring', label: 'Rings', icon: 'fa-ring' },
        { id: 'watch', label: 'Watches', icon: 'fa-clock' },
        { id: 'necklace', label: 'Necklaces & Accessories', icon: 'fa-box-open' }
    ];

    const categoryTabsHtml = categories.map(cat => {
        const active = cat.id === selectedCategory ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700';
        return `
            <button data-action="renderJewelryDealer" data-args="&apos;${cat.id}&apos;" class="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition ${active}">
                <i class="fas ${cat.icon}"></i> ${cat.label}
            </button>
        `;
    }).join('');

    const filteredItems = selectedCategory === 'all'
        ? items
        : selectedCategory === 'necklace'
            ? items.filter(i => ['necklace', 'earrings', 'bracelet', 'tiara'].includes(i.type))
            : items.filter(i => i.type === selectedCategory);

    const itemListHtml = filteredItems.map(item => {
        const canAfford = user.money >= item.price;
        const style = GameLogic.getJewelryIcon(item.type);
        const buyBtnText = canAfford ? 'Buy' : "Can't Afford";
        const buyBtnClass = canAfford
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed';

        let tierBadge = 'bg-slate-700 text-slate-300';
        if (item.tier === 'fine') tierBadge = 'bg-blue-900/60 text-blue-300 border border-blue-700';
        else if (item.tier === 'luxury') tierBadge = 'bg-purple-900/60 text-purple-300 border border-purple-700';
        else if (item.tier === 'heirloom') tierBadge = 'bg-amber-900/60 text-amber-300 border border-amber-500';

        return `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 flex items-center justify-between group hover:border-amber-500/50 transition">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                        <i class="fas ${style.icon} ${style.color} text-xl"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-white text-sm">${item.name}</h4>
                            <span class="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${tierBadge}">${item.tier}</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">${item.desc}</p>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end gap-1 pl-2">
                    <div class="text-green-400 font-bold text-sm">${Utils.formatMoney(item.price)}</div>
                    <button data-action="buyJewelry" data-args="&apos;${item.id}&apos;" ${canAfford ? '' : 'disabled'} class="px-3 py-1 rounded text-xs transition ${buyBtnClass}">
                        ${buyBtnText}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    UI.updateBottomNav('assets');
    const prevScrollLeft = document.getElementById('jewelry-tab-nav')?.scrollLeft;
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderShoppingHub" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Marketplace
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400 text-2xl shadow-lg">
                    <i class="fas fa-gem"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">Jewelry & Luxury Boutique</h2>
                <p class="text-slate-400 text-xs mt-1">Fine jewelry, luxury watches, and proposal rings</p>
                <div class="mt-2 font-bold text-sm text-green-400">Cash: ${Utils.formatMoney(user.money)}</div>
            </div>

            <div id="jewelry-tab-nav" class="flex gap-1.5 mb-4 overflow-x-auto pb-1 touch-pan-x overscroll-contain select-none">
                ${categoryTabsHtml}
            </div>

            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${itemListHtml || '<div class="text-slate-500 italic text-center py-8">No items available in this category.</div>'}
            </div>
        </div>
    `;

    UI.preserveTabScroll('jewelry-tab-nav', `[data-action="renderJewelryDealer"][data-args*="${selectedCategory}"]`, prevScrollLeft);
};

export const buyJewelry = (itemId) => {
    const user = state.gameState.user;
    const item = (GameLogic.JEWELRY_FOR_SALE || []).find(i => i.id === itemId);
    if (!item) return;

    if (user.money < item.price) {
        UI.showModal("Insufficient Funds", "You cannot afford this item right now.");
        return;
    }

    user.money -= item.price;
    const newAsset = {
        id: 'jew_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        catalogId: item.id,
        name: item.name,
        type: item.type,
        tier: item.tier,
        category: "jewelry",
        value: item.price,
        purchasePrice: item.price,
        appreciationRate: item.appreciationRate || 0,
        wearing: false,
        insured: false,
        acquiredAge: user.age
    };

    if (!user.assets) user.assets = [];
    user.assets.push(newAsset);

    GameLogic.adjustStat(user, 'happiness', 5);
    addLog(`Purchased ${item.name} for ${Utils.formatMoney(item.price)}. (+5 Happiness)`, 'good');
    saveGame();
    UI.updateHeader(user);
    renderJewelryDealer();
    UI.showModal("Purchase Successful", `You bought a ${item.name}! Check your Assets to wear, gift, or manage it.`);
};