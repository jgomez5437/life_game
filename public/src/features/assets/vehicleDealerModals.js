import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';

const get = id => document.getElementById(id);

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

    const carListHtml = filteredVehicles.map(car => {
        const loanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);
        const style = GameLogic.getVehicleIcon(car.type);

        const isShowroomNew = (car.showroom === 'mall' || car.showroom === 'exotic');
        const displayName = isShowroomNew && !car.name.startsWith('New ') ? `New ${car.name}` : car.name;
        const stars = "★".repeat(car.reliability || 3) + "☆".repeat(5 - (car.reliability || 3));

        return `
            <button type="button" data-action="openVehicleDetailsModal" data-args="${car.id}"
                class="w-full text-left bg-slate-800 hover:bg-slate-750 hover:border-slate-500 active:scale-[0.99] p-3.5 rounded-xl border border-slate-700 flex items-center justify-between gap-3 transition group">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                        <i class="fas ${style.icon} ${style.color} text-lg"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="font-bold text-white text-sm sm:text-base leading-snug truncate group-hover:text-blue-300 transition">${Utils.escapeHtml(displayName)}</div>
                        <div class="flex items-center gap-2 flex-wrap text-xs text-slate-400 mt-1">
                            <span><span class="text-green-400 font-semibold">${car.condition}%</span> Cond</span>
                            <span class="text-slate-600">•</span>
                            <span class="text-amber-400 font-semibold" title="Reliability ${car.reliability || 3}/5">${stars}</span>
                            ${car.statusBonus > 0 ? `<span class="bg-amber-900/60 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-700/80 whitespace-nowrap shrink-0">+${car.statusBonus} Status</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2.5 shrink-0">
                    <div class="text-right">
                        <div class="text-green-400 font-bold text-sm sm:text-base leading-tight">${Utils.formatMoney(car.price)}</div>
                        <div class="text-[11px] text-slate-400 font-medium">${Utils.formatMoney(loanInfo.monthlyPayment)}/mo</div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-500 group-hover:text-white text-xs transition"></i>
                </div>
            </button>
        `;
    }).join('');

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto w-full min-w-0">
            <div class="mb-3">
                <button data-action="renderShoppingHub" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Market
                </button>
            </div>

            <div class="text-center mb-4">
                <div class="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-2 text-xl">
                    <i class="fas fa-car"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${Utils.escapeHtml(user.city)} Auto Dealership</h2>
                <p class="text-slate-400 text-xs mt-0.5">Tap a vehicle to buy outright, finance, or trade in</p>
            </div>

            <!-- Showroom Tabs -->
            <div class="flex bg-slate-900 p-1 rounded-xl mb-3 border border-slate-700 text-[11px] sm:text-xs gap-1 shrink-0">
                <button data-action="renderVehicleDealer" data-args="'used'" class="flex-1 py-2 px-1.5 rounded-lg font-bold text-center transition whitespace-nowrap ${currentVehicleShowroom === 'used' ? 'bg-slate-800 text-amber-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-wrench mr-1"></i>Used Lot
                </button>
                <button data-action="renderVehicleDealer" data-args="'mall'" class="flex-1 py-2 px-1.5 rounded-lg font-bold text-center transition whitespace-nowrap ${currentVehicleShowroom === 'mall' ? 'bg-slate-800 text-blue-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-car mr-1"></i>Auto Mall
                </button>
                <button data-action="renderVehicleDealer" data-args="'exotic'" class="flex-1 py-2 px-1.5 rounded-lg font-bold text-center transition whitespace-nowrap ${currentVehicleShowroom === 'exotic' ? 'bg-slate-800 text-purple-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-fire mr-1"></i>Exotics
                </button>
            </div>

            <div class="flex-1 overflow-y-auto overflow-x-hidden pb-6 space-y-2.5">
                ${carListHtml.length > 0 ? carListHtml : '<div class="text-center text-slate-500 py-8 italic">No vehicles available in this showroom section right now.</div>'}
            </div>
        </div>
    `;
};

export const openVehicleDetailsModal = (carId) => {
    const user = state.gameState.user;
    if ((user.age || 0) < 16) {
        UI.showModal("Too Young", "You must be at least 16 years old to visit the car dealership.");
        return;
    }

    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => String(c.id) === String(carId));
    if (!car) return;

    const style = GameLogic.getVehicleIcon(car.type);
    const loanInfo = GameLogic.calculateAutoLoan(car.price, 0.15, 4);
    const canAffordCash = user.money >= car.price;
    const canAffordDown = user.money >= loanInfo.downPayment;
    const hasOwnedVehicles = (user.assets || []).some(a => a.category === 'vehicle');

    const isShowroomNew = (car.showroom === 'mall' || car.showroom === 'exotic');
    const displayName = isShowroomNew && !car.name.startsWith('New ') ? `New ${car.name}` : car.name;
    const stars = "★".repeat(car.reliability || 3) + "☆".repeat(5 - (car.reliability || 3));

    const modalHtml = `
        <div class="space-y-4">
            <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                    <i class="fas ${style.icon} ${style.color} text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-white font-bold text-base leading-tight">${Utils.escapeHtml(displayName)}</span>
                        ${car.statusBonus > 0 ? `<span class="bg-amber-900/60 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-700 whitespace-nowrap">+${car.statusBonus} Status</span>` : ''}
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed mt-1">${Utils.escapeHtml(car.desc)}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5 bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 text-xs">
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Cash Price</span>
                    <span class="text-green-400 font-bold text-sm">${Utils.formatMoney(car.price)}</span>
                </div>
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Est. Monthly Loan</span>
                    <span class="text-blue-400 font-bold text-sm">${Utils.formatMoney(loanInfo.monthlyPayment)}/mo</span>
                </div>
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Condition</span>
                    <span class="text-emerald-400 font-bold">${car.condition}%</span>
                </div>
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Reliability</span>
                    <span class="text-amber-400 font-bold">${stars}</span>
                </div>
            </div>

            <div class="flex items-center justify-between text-xs px-1 text-slate-400">
                <span>Your Bank Balance</span>
                <strong class="${user.money >= 0 ? 'text-green-400' : 'text-red-400'}">${Utils.formatMoney(user.money)}</strong>
            </div>

            <div class="space-y-2 pt-1">
                <button type="button" data-action="buyVehicleCash" data-args="${car.id}"
                    ${canAffordCash ? '' : 'disabled'}
                    class="w-full py-2.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-between ${canAffordCash ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                    <span><i class="fas fa-money-bill-wave mr-2"></i>Pay Cash</span>
                    <span>${Utils.formatMoney(car.price)}</span>
                </button>

                <button type="button" data-action="buyVehicleLoan" data-args="${car.id}"
                    ${canAffordDown ? '' : 'disabled'}
                    class="w-full py-2.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-between ${canAffordDown ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}">
                    <span><i class="fas fa-file-signature mr-2"></i>Finance (4 yr)</span>
                    <span>${Utils.formatMoney(loanInfo.downPayment)} down</span>
                </button>

                ${hasOwnedVehicles ? `
                    <button type="button" data-action="openTradeInModal" data-args="${car.id}"
                        class="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-2">
                        <i class="fas fa-exchange-alt"></i> Trade-In Owned Vehicle
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: displayName,
        content: modalHtml,
        showCloseBtn: true
    });
};

export const buyVehicleCash = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => String(c.id) === String(carId));
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

    if (typeof UI.closeAllModals === 'function') UI.closeAllModals();
    UI.updateHeader(user);
    renderVehicleDealer();
    UI.showModal("Purchase Successful", `You are now the owner of a ${Utils.escapeHtml(cleanName)}!${!hasPrimary ? ' Set as your primary ride.' : ''}`);
};

export const buyVehicleLoan = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => String(c.id) === String(carId));
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

    if (typeof UI.closeAllModals === 'function') UI.closeAllModals();
    UI.updateHeader(user);
    renderVehicleDealer();
    UI.showModal("Auto Loan Approved!", `You financed a ${Utils.escapeHtml(cleanName)}! Down payment: ${Utils.formatMoney(loanInfo.downPayment)}. Monthly payment: ${Utils.formatMoney(loanInfo.monthlyPayment)}/mo.`);
};

export const openTradeInModal = (carId) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => String(c.id) === String(carId));
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
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                            <i class="fas ${style.icon} ${style.color}"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-bold text-white text-sm truncate">${Utils.escapeHtml(v.name)}</h4>
                                ${v.isPrimary ? `<span class="bg-blue-900/80 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700 whitespace-nowrap">Primary</span>` : ''}
                            </div>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Cond: <strong class="text-white">${v.condition}%</strong> • Value: <strong class="text-slate-300">${Utils.formatMoney(v.value)}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-amber-400 font-bold text-xs">+${Utils.formatMoney(trade.tradeInValue)} Trade</div>
                        ${trade.loanPayoff > 0 ? `<div class="text-[10px] text-red-400 font-semibold">-${Utils.formatMoney(trade.loanPayoff)} Payoff</div>` : ''}
                        <div class="text-xs text-green-400 font-bold mt-0.5">Credit: ${Utils.formatMoney(trade.netEquity)}</div>
                    </div>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-700/60 text-xs">
                    <div class="text-slate-300 text-xs">
                        Cash: <strong class="text-green-400 font-bold">${Utils.formatMoney(cashDue)}</strong>
                        <span class="text-slate-500 mx-1">|</span>
                        Finance: <strong class="text-blue-400 font-bold">${Utils.formatMoney(remainingDown)} down</strong> (${Utils.formatMoney(monthlyEst)}/mo)
                    </div>

                    <div class="flex items-center gap-2 ml-auto">
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
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <span class="text-slate-400 uppercase text-[10px] font-bold block">Target Vehicle</span>
                    <strong class="text-white text-sm truncate block">${Utils.escapeHtml(targetDisplayName)}</strong>
                </div>
                <div class="text-right shrink-0">
                    <span class="text-slate-400 uppercase text-[10px] font-bold block">Purchase Price</span>
                    <strong class="text-green-400 text-sm">${Utils.formatMoney(car.price)}</strong>
                </div>
            </div>

            <p class="text-xs text-slate-400">Select which vehicle to trade in. The dealership appraises your vehicle at 80% market value and settles any active loans:</p>

            <div class="max-h-72 overflow-y-auto overflow-x-hidden space-y-2.5 pr-1">
                ${vehicleRowsHtml}
            </div>

            <div class="text-right pt-2">
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Back</button>
            </div>
        </div>
    `;

    if (typeof UI.showCustomModal === 'function') {
        UI.showCustomModal({
            title: `Trade-In Towards ${targetDisplayName}`,
            content: modalContent,
            showCloseBtn: true
        });
    } else {
        UI.showModal(`Trade-In Towards ${targetDisplayName}`, modalContent);
    }
};

export const executeTradeInPurchase = (carId, tradeInAssetId, method) => {
    const user = state.gameState.user;
    const car = (GameLogic.VEHICLES_FOR_SALE || []).find(c => String(c.id) === String(carId));
    if (!car) return;

    if (!user.assets || !Array.isArray(user.assets)) user.assets = [];
    const tradeIndex = user.assets.findIndex(a => String(a.id) === String(tradeInAssetId) && a.category === 'vehicle');
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

        if (typeof UI.closeAllModals === 'function') UI.closeAllModals();
        else UI.hideModal();
        UI.updateHeader(user);
        renderVehicleDealer();
        UI.showModal("Trade-In Successful!", `You traded in your ${Utils.escapeHtml(tradeAsset.name)} for ${Utils.formatMoney(trade.netEquity)} credit and paid ${Utils.formatMoney(cashDue)} cash for your new ${Utils.escapeHtml(cleanName)}!`);
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

        if (typeof UI.closeAllModals === 'function') UI.closeAllModals();
        else UI.hideModal();
        UI.updateHeader(user);
        renderVehicleDealer();
        UI.showModal("Trade-In & Financing Approved!", `You traded in your ${Utils.escapeHtml(tradeAsset.name)} and financed your new ${Utils.escapeHtml(cleanName)}! Down payment: ${Utils.formatMoney(remainingDown)}. Monthly payment: ${Utils.formatMoney(adjustedLoan.monthlyPayment)}/mo.`);
    }
};

export const buyVehicle = (carId) => {
    buyVehicleCash(carId);
};
