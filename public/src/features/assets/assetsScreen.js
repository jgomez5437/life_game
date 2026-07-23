import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderShoppingHub } from './goShoppingScreen.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { processNextFuneral } from '../relationships/funeralScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

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

    return vehicles.map(v => {
        let condColor = 'text-green-400';
        if (v.condition < 40) condColor = 'text-red-500'; 
        else if (v.condition < 75) condColor = 'text-yellow-500'; 
        const style = GameLogic.getVehicleIcon(v.type);
        
        return `
            <div data-action="renderVehicleManager" data-args="${v.id}" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                        <i class="fas ${style.icon} ${style.color} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-blue-300 transition">${v.name}</h4>
                        <div class="text-xs text-slate-400 capitalize">
                            ${v.type} • <span class="${condColor}">${v.condition}% Cond.</span>
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
    const properties = assets.filter(a => a.category === 'property');

    if (properties.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any properties.</div>`;
    }

    return properties.map(p => {
        const style = GameLogic.getPropertyIcon(p.type);
        const hasMortgage = p.mortgage && p.mortgage.remainingBalance > 0;
        const subtext = hasMortgage 
            ? `<span class="text-yellow-400 font-bold">Mortgage: ${Utils.formatMoney(p.mortgage.remainingBalance)} (${Utils.formatMoney(p.mortgage.monthlyPayment)}/mo)</span>`
            : `<span class="text-green-400 font-bold">Paid Off</span>`;

        const cond = p.condition !== undefined ? p.condition : 100;
        const maxCond = p.maxCondition !== undefined ? p.maxCondition : 100;
        let condColor = 'text-green-400';
        if (cond < 40) condColor = 'text-red-500';
        else if (cond < 75) condColor = 'text-yellow-500';

        return `
            <div data-action="renderPropertyManager" data-args="${p.id}" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                        <i class="fas ${style.icon} ${style.color} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm group-hover:text-green-300 transition">${p.name}</h4>
                        <div class="text-xs text-slate-400 capitalize">
                            ${p.type} • <span class="${condColor}">${cond}% Cond</span> • ${subtext}
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
    const user = state.gameState.user;

    // --- CALCULATE STATS ---
    let monthlyIncome = GameLogic.calculateUserMonthlyIncome(user);

    let monthlyOutflow = 0;
    if (user.studentLoans > 0 && user.age >= 23 && !user.gradSchoolEnrolled) {
        monthlyOutflow += 200;
    }
    // Living Expenses: Age 19+ AND Not enrolled in ANY school
    if (user.age >= 19 && (typeof isStudent === 'function' ? !isStudent() : !user.isStudent)) {
        monthlyOutflow += 2000;
    }
    
    if (user.gymMembership) {
        monthlyOutflow += 50;
    }
    
    // Child Outflow: $500/mo per child under 21
    monthlyOutflow += GameLogic.calculateChildMonthlyOutflow(user.relationships);
    
    // Property Mortgage Outflow
    monthlyOutflow += GameLogic.calculatePropertyMonthlyOutflow(user.assets);

    user.monthlyOutflow = monthlyOutflow;
    
    // Ensure assets array exists
    const assets = user.assets || [];
    const vehicleHtml = getVehicleListHtml(assets);
    const propertyHtml = getPropertyListHtml(assets);
    const jewelryHtml = getJewelryListHtml(assets);

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
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
                
                <div data-action="renderShoppingHub" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                    <div class="flex items-center gap-3 mb-2">
                         <div class="w-8 h-8 rounded-full bg-yellow-600/30 flex items-center justify-center text-yellow-500">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <h3 class="font-bold text-white">Go Shopping</h3>
                    </div>
                    <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                         <div class="text-sm text-white font-bold">Buy Items</div>
                         <i class="fas fa-chevron-right text-slate-600"></i>
                    </div>
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
                    <div class="flex flex-col">
                        ${propertyHtml}
                    </div>
                </div>

                <div class="mb-4">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                        <i class="fas fa-chart-line text-purple-400"></i> Investments
                    </h3>
                    <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                </div>
            </div>
        </div>
    `;
}

export const renderVehicleManager = (id) => {
    const user = state.gameState.user;
    
    // Find the specific car by ID
    const vehicle = user.assets.find(a => a.id === id);
    if (!vehicle) {
        console.error("Vehicle not found!"); 
        renderAssets(); 
        return;
    }

    const style = GameLogic.getVehicleIcon(vehicle.type);
    
    // Repair Cost Logic: 
    // Example: $100 for every 1% of damage. 
    // A Ferrari repair should cost more than a Honda, so we multiply by value relative to $20k
    const damage = 100 - vehicle.condition;
    const baseRepairCost = damage * 20; 
    const luxuryMultiplier = Math.max(1, vehicle.value / 20000); // Expensive cars cost more to fix
    const repairCost = Math.floor(baseRepairCost * luxuryMultiplier);
    
    // Can we repair?
    const canRepair = user.money >= repairCost && vehicle.condition < 100;
    
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
            </div>

            <div class="text-center mb-8">
                <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mx-auto mb-4">
                    <i class="fas ${style.icon} ${style.color} text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${vehicle.name}</h2>
                <div class="text-green-400 font-bold text-xl mt-1">${Utils.formatMoney(vehicle.value)}</div>
                <p class="text-slate-500 text-sm capitalize">${vehicle.type}</p>
            </div>

            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Condition</span>
                    <span class="${vehicle.condition < 50 ? 'text-red-400' : 'text-green-400'} font-bold">${vehicle.condition}%</span>
                </div>
                <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div class="h-full ${vehicle.condition < 50 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500" style="width: ${vehicle.condition}%"></div>
                </div>
                <p class="text-xs text-slate-500 mt-2 text-center">
                    ${vehicle.condition < 40 ? "This car is a rust bucket. Repair it soon!" : "Vehicle is running smoothly."}
                </p>
            </div>

            <div class="grid grid-cols-1 gap-2">
                
                <button data-action="repairVehicle" data-args="${vehicle.id}, ${repairCost}" 
                    ${canRepair ? '' : 'disabled'}
                    class="${canRepair ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'} p-4 rounded-xl border border-blue-500/50 flex items-center justify-between transition group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                            <i class="fas fa-wrench"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Repair Vehicle</h3>
                            <div class="text-xs text-blue-200">Cost: ${Utils.formatMoney(repairCost)}</div>
                        </div>
                    </div>
                </button>

                <button data-action="sellVehicle" data-args="${vehicle.id}" class="bg-red-900/40 p-4 rounded-xl border border-red-800/50 flex items-center justify-between hover:bg-red-900/60 transition group mt-4 mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Sell Vehicle</h3>
                            <div class="text-xs text-red-300">Sell for market value</div>
                        </div>
                    </div>
                </button>

            </div>
        </div>
    `;
};

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

    const renovationHtml = renovationOptions.map(opt => {
        const canAffordRenov = user.money >= opt.cost;
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
                        <span class="text-green-400 font-bold">+${opt.valueBoostRatio * 100}% Value</span>
                    </div>
                    <button data-action="doPropertyRenovation" data-args="${property.id}, '${opt.id}'"
                        ${canAffordRenov ? '' : 'disabled'}
                        class="${canAffordRenov ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} px-2.5 py-1 rounded font-bold text-xs transition">
                        Renovate
                    </button>
                </div>
            </div>
        `;
    }).join('');

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto overflow-y-auto pb-6">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
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
                <p class="text-xs text-slate-400 mb-3">Renovations restore condition, raise maximum quality caps, and increase property market value.</p>
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
                    <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 mt-3 flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/60 bg-slate-800 shrink-0 shadow-md">
                            ${renderAvatar(property.tenant)}
                        </div>
                        <div class="flex-1 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="font-bold text-white text-base">${property.tenant.name}</h4>
                                <span class="font-bold ${property.tenant.quality === 'excellent' ? 'text-green-400' : property.tenant.quality === 'good' ? 'text-blue-400' : 'text-amber-400'} uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${property.tenant.quality}</span>
                            </div>
                            <div class="text-xs text-blue-400 font-semibold">${property.tenant.type}</div>
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
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Maintenance Completed", `Restored ${result.propertyName}'s condition to ${result.restoredCondition}% (Max cap: ${result.maxCondition}%).`);
    } else {
        UI.showModal("Maintenance Failed", result.reason);
    }
};

export const doPropertyRenovation = (id, optionId) => {
    const user = state.gameState.user;
    const result = GameLogic.renovateProperty(user, id, optionId);

    if (result.success) {
        addLog(`Renovated ${result.propertyName} (${result.optionName}) for ${Utils.formatMoney(result.cost)}. Value increased by ${Utils.formatMoney(result.valueIncrease)}!`, 'major');
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Renovation Complete!", `Your ${result.propertyName} underwent a ${result.optionName}! Condition is now ${result.newCondition}% (Max: ${result.newMaxCondition}%) and property value increased to ${Utils.formatMoney(result.newValue)}.`);
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
        UI.updateHeader(user);
        renderPropertyManager(id);
        UI.showModal("Mortgage Paid Off!", `You now own ${property.name} free and clear!`);
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
                <div class="text-xs text-slate-400 mt-1">${property.name}</div>
            </div>

            <p class="text-xs text-slate-300 text-center">Select a listing price point to market your property to potential buyers:</p>

            <div class="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                ${tiersHtml}
            </div>
        </div>
    `;

    UI.showModal(`Sell Property - ${property.name}`, modalHtml);
};

export const submitPropertyListing = (propertyId, tierId) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === propertyId);
    if (!property) return;

    const result = GameLogic.generatePropertyBuyerOffer(property, tierId);

    if (result.hasOffer) {
        const buyer = result.buyer;
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-green-900/30 p-4 rounded-xl border border-green-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-green-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(buyer)}
                    </div>
                    <h3 class="text-white font-bold text-lg">Offer Received!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        <span class="font-bold text-white">${buyer.name}</span> submitted an offer to purchase <span class="font-bold text-white">${property.name}</span>.
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
                    <button data-action="acceptBuyerOffer" data-args="${property.id}, ${result.offerAmount}, '${buyer.name}'" class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs transition">
                        Accept Offer
                    </button>
                    <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs transition">
                        Reject Offer
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal(`Buyer Offer - ${property.name}`, modalHtml);
    } else {
        addLog(`Listed ${property.name} at ${result.tierName} (${Utils.formatMoney(result.listPrice)}), but no buyers submitted an offer.`, 'neutral');
        UI.showModal("No Offers Received", `No buyers submitted an offer for ${property.name} at this price point. You can try listing it again at a different price point.`);
    }
};

export const acceptBuyerOffer = (propertyId, offerAmount, buyerName) => {
    const user = state.gameState.user;
    const result = GameLogic.completePropertySale(user, propertyId, offerAmount);

    if (result.success) {
        if (result.remainingMortgage > 0) {
            addLog(`Sold ${result.propertyName} to ${buyerName} for ${Utils.formatMoney(result.offerAmount)}, paying off ${Utils.formatMoney(result.remainingMortgage)} mortgage. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`, 'good');
        } else {
            addLog(`Sold ${result.propertyName} to ${buyerName} for ${Utils.formatMoney(result.offerAmount)}. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`, 'good');
        }

        UI.hideModal();
        UI.updateHeader(user);
        renderAssets();
        UI.showModal("Property Sold!", `Congratulations! You sold ${result.propertyName} to ${buyerName} for ${Utils.formatMoney(result.offerAmount)}. Net proceeds: ${Utils.formatMoney(result.netProceeds)}.`);
    } else {
        UI.showModal("Sale Error", result.reason);
    }
};

export const repairVehicle = (id, cost) => {
    const user = state.gameState.user;
    const vehicle = user.assets.find(a => a.id === id);
    
    if (user.money >= cost) {
        user.money -= cost;
        vehicle.condition = 100; // Restore to perfect
        
        // Slight value bump for fixing it?
        vehicle.value = Math.floor(vehicle.value * 1.05); 
        
        addLog(`Repaired ${vehicle.name} for ${Utils.formatMoney(cost)}.`, 'neutral');
        UI.updateHeader(user);
        renderVehicleManager(id); // Refresh screen
    }
};

export const sellVehicle = (id) => {
    const user = state.gameState.user;
    // Find index to remove
    const index = user.assets.findIndex(a => a.id === id);
    if (index === -1) return;

    const vehicle = user.assets[index];
    const salePrice = vehicle.value;

    // Confirm Modal (Optional, but good UX)
    // For now, let's just sell it instantly:
    
    user.money += salePrice;
    user.assets.splice(index, 1); // Remove from array
    
    addLog(`Sold ${vehicle.name} for ${Utils.formatMoney(salePrice)}.`, 'good');
    UI.updateHeader(user);
    
    // Go back to the main list since this car is gone
    renderAssets();
};

export const openTenantScreening = (propertyId) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === propertyId);
    if (!property) return;

    const applicants = GameLogic.generateTenantApplicants(property);

    const applicantsHtml = applicants.map(app => `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-900 shrink-0 shadow-md">
                ${renderAvatar(app)}
            </div>
            <div class="flex-1 space-y-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-white text-base">${app.name}</h4>
                        <span class="text-xs text-blue-400 font-semibold">${app.type}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold text-base">${Utils.formatMoney(app.monthlyRent)}/mo</div>
                        <div class="text-[11px] text-slate-400">${app.leaseYears}-Year Lease</div>
                    </div>
                </div>
                <p class="text-xs text-slate-300">${app.desc}</p>
                <div class="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span class="text-xs ${app.quality === 'excellent' ? 'text-green-400' : app.quality === 'good' ? 'text-blue-400' : 'text-amber-400'} font-bold uppercase">Credit: ${app.quality}</span>
                    <button data-action="acceptTenantLease" data-args="${property.id}, '${app.id}'" class="bg-green-600 hover:bg-green-500 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition">
                        Sign Lease
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const modalHtml = `
        <div class="space-y-4">
            <p class="text-slate-300 text-sm">Screen and select a tenant for <span class="font-bold text-white">${property.name}</span>:</p>
            <div class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                ${applicantsHtml}
            </div>
        </div>
    `;

    UI.showModal(`Screen Applicants - ${property.name}`, modalHtml);
};

export const acceptTenantLease = (propertyId, applicantId) => {
    const user = state.gameState.user;
    const result = GameLogic.acceptTenantLease(user, propertyId, applicantId);

    if (result.success) {
        addLog(`Signed a ${result.tenant.leaseYears}-year lease with ${result.tenant.name} for ${result.propertyName} (${Utils.formatMoney(result.tenant.monthlyRent)}/month).`, 'good');
        UI.hideModal();
        UI.updateHeader(user);
        renderPropertyManager(propertyId);
        UI.showModal("Lease Signed!", `You rented ${result.propertyName} to ${result.tenant.name} for ${Utils.formatMoney(result.tenant.monthlyRent)}/month!`);
    } else {
        UI.showModal("Lease Error", result.reason);
    }
};

export const evictTenantAction = (propertyId) => {
    const user = state.gameState.user;
    const result = GameLogic.evictTenant(user, propertyId);

    if (result.success) {
        addLog(`Evicted tenant ${result.tenantName} from ${result.propertyName}. Property is now vacant.`, 'neutral');
        UI.updateHeader(user);
        renderPropertyManager(propertyId);
        UI.showModal("Tenant Evicted", `You evicted ${result.tenantName} from ${result.propertyName}.`);
    } else {
        UI.showModal("Eviction Failed", result.reason);
    }
};

export const processNextTenantDefaultEvent = () => {
    const queue = state.gameState.pendingTenantEvents;
    if (!queue || queue.length === 0) {
        processNextFuneral();
        return;
    }

    const event = queue[0];
    const tenantAvatarObj = event.tenant || { name: event.tenantName, age: 35 };

    if (event.eventType === 'lease_expiration') {
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-blue-900/30 p-4 rounded-xl border border-blue-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(tenantAvatarObj)}
                    </div>
                    <h3 class="text-white font-bold text-lg">${event.tenantName} Wants to Renew!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        Your tenant in <span class="font-bold text-white">${event.propertyName}</span> reached the end of their lease and would like to renew for <span class="text-blue-400 font-bold">${event.requestedYears} year${event.requestedYears === 1 ? '' : 's'}</span>.
                    </p>
                    <div class="mt-3 text-blue-300 font-bold text-base bg-blue-950/60 py-2 rounded-lg border border-blue-800/60">
                        Current Rent: ${Utils.formatMoney(event.currentRent)}/mo
                    </div>
                </div>

                <p class="text-xs text-slate-400 text-center">Choose how to handle this renewal:</p>

                <div class="space-y-2">
                    <button data-action="renewLeaseSameRate" data-args="${event.propertyId}, '${event.tenantId}', ${event.requestedYears}, ${event.currentRent}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-file-contract"></i> Renew at Same Rate (${Utils.formatMoney(event.currentRent)}/mo)</span>
                        <span class="text-[11px] text-blue-200">${event.requestedYears}-Yr Term</span>
                    </button>

                    <button data-action="renewLeaseWithIncrease" data-args="${event.propertyId}, '${event.tenantId}', ${event.requestedYears}, ${event.increasedRent}" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-chart-line"></i> Offer Renewal with 5% Increase (${Utils.formatMoney(event.increasedRent)}/mo)</span>
                        <span class="text-[11px] text-green-200">+5% Rent</span>
                    </button>

                    <button data-action="declineLeaseRenewal" data-args="${event.propertyId}" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-times-circle text-red-400"></i> Don't Renew</span>
                        <span class="text-[11px] text-slate-400">Vacate Property</span>
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal(`Lease Expiration - ${event.propertyName}`, modalHtml);
        return;
    }

    if (event.eventType === 'damage') {
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-amber-900/30 p-4 rounded-xl border border-amber-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(tenantAvatarObj)}
                    </div>
                    <h3 class="text-white font-bold text-lg">${event.tenantName} Caused Damage!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        Your tenant in <span class="font-bold text-white">${event.propertyName}</span> caused property damage (-10% condition).
                    </p>
                    <div class="mt-3 text-amber-300 font-bold text-base bg-amber-950/60 py-2 rounded-lg border border-amber-800/60">
                        Estimated Repair Cost: ${Utils.formatMoney(event.repairCost)}
                    </div>
                </div>

                <p class="text-xs text-slate-400 text-center">Choose how to handle this tenant:</p>

                <div class="space-y-2">
                    <button data-action="demandTenantRepairPayment" data-args="${event.propertyId}, '${event.tenantId}', ${event.repairCost}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-wrench"></i> Ask ${event.tenantName} to Pay for Repairs</span>
                        <span class="text-[11px] text-blue-200">Attempt Recovery</span>
                    </button>

                    <button data-action="forgiveTenantDamage" data-args="${event.propertyId}, '${event.tenantId}'" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-heart text-amber-400"></i> Forgive Them & Let It Go</span>
                        <span class="text-[11px] text-slate-400">Absorb Damage</span>
                    </button>

                    <button data-action="evictTenantFromEvent" data-args="${event.propertyId}" class="w-full bg-red-900/50 hover:bg-red-800/70 border border-red-700 text-red-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-user-slash"></i> Evict Tenant</span>
                        <span class="text-[11px] text-red-300">Vacate Property</span>
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal(`Tenant Damage - ${event.propertyName}`, modalHtml);
        return;
    }

    const modalHtml = `
        <div class="space-y-4">
            <div class="bg-red-900/30 p-4 rounded-xl border border-red-700/50 text-center shadow-lg">
                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-red-400 bg-slate-800 mx-auto mb-2 shadow-md">
                    ${renderAvatar(tenantAvatarObj)}
                </div>
                <h3 class="text-white font-bold text-lg">${event.tenantName} is Overdue!</h3>
                <p class="text-slate-300 text-sm mt-1">
                    Your tenant in <span class="font-bold text-white">${event.propertyName}</span> has fallen <span class="text-red-400 font-bold">2 months behind</span> on rent.
                </p>
                <div class="mt-3 text-red-300 font-bold text-base bg-red-950/60 py-2 rounded-lg border border-red-800/60">
                    Overdue Amount: ${Utils.formatMoney(event.missedAmount)}
                </div>
            </div>

            <p class="text-xs text-slate-400 text-center">Choose how to handle this tenant:</p>

            <div class="space-y-2">
                <button data-action="demandTenantRentPayment" data-args="${event.propertyId}, '${event.tenantId}', ${event.missedAmount}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-hand-holding-usd"></i> Ask ${event.tenantName} to Pay</span>
                    <span class="text-[11px] text-blue-200">Attempt Recovery</span>
                </button>

                <button data-action="forgiveTenantRent" data-args="${event.propertyId}, '${event.tenantId}'" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-heart text-amber-400"></i> Forgive Them & Let It Go</span>
                    <span class="text-[11px] text-slate-400">Waive ${Utils.formatMoney(event.missedAmount)}</span>
                </button>

                <button data-action="evictTenantFromEvent" data-args="${event.propertyId}" class="w-full bg-red-900/50 hover:bg-red-800/70 border border-red-700 text-red-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-user-slash"></i> Evict Tenant</span>
                    <span class="text-[11px] text-red-300">Vacate Property</span>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal(`Tenant Overdue - ${event.propertyName}`, modalHtml);
};

export const demandTenantRepairPayment = (propertyId, tenantId, repairCost) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const roll = Math.random();
    if (roll < 0.70) {
        addLog(`Asked tenant ${event ? event.tenantName : 'tenant'} to pay for repairs on ${event ? event.propertyName : 'property'}. They agreed and paid ${Utils.formatMoney(repairCost)}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Repairs Covered!", `Tenant ${event ? event.tenantName : ''} agreed to pay the ${Utils.formatMoney(repairCost)} for property repairs.`, () => processNextTenantDefaultEvent());
    } else {
        const prop = (user.assets || []).find(a => a.id === propertyId);
        if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);
        addLog(`Asked tenant ${event ? event.tenantName : 'tenant'} to pay for repairs, but they refused. Property condition decreased by 10%.`, 'bad');
        UI.showModal("Payment Refused", `Tenant ${event ? event.tenantName : ''} refused to pay for repairs. Property condition decreased by 10%.`, () => processNextTenantDefaultEvent());
    }
};

export const forgiveTenantDamage = (propertyId, tenantId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const prop = (user.assets || []).find(a => a.id === propertyId);
    if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);

    addLog(`Forgave tenant ${event ? event.tenantName : ''} for property damage on ${event ? event.propertyName : 'property'} (-10% condition).`, 'neutral');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const demandTenantRentPayment = (propertyId, tenantId, missedAmount) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const roll = Math.random();
    if (roll < 0.70) {
        user.money += missedAmount;
        addLog(`Demanded overdue rent from ${event ? event.tenantName : 'tenant'}. They paid back ${Utils.formatMoney(missedAmount)}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Rent Recovered!", `Tenant ${event ? event.tenantName : ''} apologized and paid the full ${Utils.formatMoney(missedAmount)} in overdue rent.`, () => processNextTenantDefaultEvent());
    } else {
        addLog(`Demanded overdue rent from ${event ? event.tenantName : 'tenant'}, but they were unable to pay ${Utils.formatMoney(missedAmount)}.`, 'bad');
        UI.showModal("Payment Refused", `Tenant ${event ? event.tenantName : ''} claimed they cannot afford to pay the overdue rent.`, () => processNextTenantDefaultEvent());
    }
};

export const forgiveTenantRent = (propertyId, tenantId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    addLog(`Forgave overdue rent for tenant ${event ? event.tenantName : ''}.`, 'neutral');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const evictTenantFromEvent = (propertyId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    if (event && event.eventType === 'damage') {
        const prop = (user.assets || []).find(a => a.id === propertyId);
        if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);
    }

    const result = GameLogic.evictTenant(user, propertyId);
    if (result.success) {
        addLog(`Evicted tenant ${result.tenantName} from ${result.propertyName}. Property is now vacant.`, 'bad');
        UI.updateHeader(user);
        UI.showModal("Tenant Evicted", `You evicted ${result.tenantName} from ${result.propertyName}. The property is now vacant.`, () => processNextTenantDefaultEvent());
    } else {
        processNextTenantDefaultEvent();
    }
};

export const renewLeaseSameRate = (propertyId, tenantId, requestedYears, currentRent) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const property = (user.assets || []).find(a => a.id === propertyId);
    if (property && property.tenant) {
        property.tenant.leaseYears = requestedYears;
    }

    addLog(`Renewed ${event ? event.tenantName : 'tenant'}'s lease on ${event ? event.propertyName : 'property'} for ${requestedYears} year(s) at ${Utils.formatMoney(currentRent)}/mo.`, 'good');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const renewLeaseWithIncrease = (propertyId, tenantId, requestedYears, increasedRent) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const property = (user.assets || []).find(a => a.id === propertyId);

    const roll = Math.random();
    if (roll < 0.80) { // 80% chance tenant accepts 5% increase
        if (property && property.tenant) {
            property.tenant.leaseYears = requestedYears;
            property.tenant.monthlyRent = increasedRent;
        }
        addLog(`Tenant ${event ? event.tenantName : 'tenant'} accepted the 5% rent increase (${Utils.formatMoney(increasedRent)}/mo) for a ${requestedYears}-year lease on ${event ? event.propertyName : 'property'}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Increase Accepted!", `Tenant ${event ? event.tenantName : ''} accepted the 5% rent increase to ${Utils.formatMoney(increasedRent)}/month.`, () => processNextTenantDefaultEvent());
    } else {
        GameLogic.evictTenant(user, propertyId);
        addLog(`Tenant ${event ? event.tenantName : 'tenant'} rejected the 5% rent increase and moved out of ${event ? event.propertyName : 'property'}.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal("Increase Rejected", `Tenant ${event ? event.tenantName : ''} rejected the 5% rent increase and moved out. The property is now vacant.`, () => processNextTenantDefaultEvent());
    }
};

export const declineLeaseRenewal = (propertyId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    GameLogic.evictTenant(user, propertyId);
    addLog(`Declined lease renewal for tenant ${event ? event.tenantName : 'tenant'} on ${event ? event.propertyName : 'property'}. Property is now vacant.`, 'neutral');
    UI.updateHeader(user);
    UI.hideModal();
    processNextTenantDefaultEvent();
};

// --- JEWELRY ASSET MANAGER ---
export const renderJewelryManager = (id) => {
    const user = state.gameState.user;
    const item = (user.assets || []).find(a => a.id === id);
    if (!item) {
        renderAssets();
        return;
    }

    const style = GameLogic.getJewelryIcon(item.type);
    const wearBtnText = item.wearing ? "Take Off (Unequip)" : "Wear (Equip)";
    const wearBtnClass = item.wearing ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400";
    const insureFee = Math.max(10, Math.floor(item.value * 0.005));
    const insureBtnText = item.insured ? "Cancel Insurance Policy" : `Insure Item (${Utils.formatMoney(insureFee)}/yr)`;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mx-auto mb-4 shadow-lg">
                    <i class="fas ${style.icon} ${style.color} text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${item.name}</h2>
                <div class="text-green-400 font-bold text-xl mt-1">${Utils.formatMoney(item.value)}</div>
                <p class="text-slate-400 text-xs capitalize mt-1">${item.tier || 'Fine'} ${item.type} • Purchased for ${Utils.formatMoney(item.purchasePrice)}</p>
            </div>

            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 space-y-2 text-sm">
                <div class="flex justify-between border-b border-slate-700 pb-2">
                    <span class="text-slate-400">Status</span>
                    <span class="font-bold ${item.wearing ? 'text-emerald-400' : 'text-slate-400'}">${item.wearing ? 'Equipped (Wearing)' : 'Stored in Vault'}</span>
                </div>
                <div class="flex justify-between border-b border-slate-700 pb-2">
                    <span class="text-slate-400">Insurance Protection</span>
                    <span class="font-bold ${item.insured ? 'text-blue-400' : 'text-slate-500'}">${item.insured ? 'Active Policy' : 'Uninsured'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Annual Appreciation</span>
                    <span class="font-bold text-amber-400">+${((item.appreciationRate || 0) * 100).toFixed(1)}%/yr</span>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-3">
                <button data-action="toggleWearJewelry" data-args="&apos;${item.id}&apos;" class="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${wearBtnClass}">
                    <i class="fas fa-user-check"></i> ${wearBtnText}
                </button>

                <button data-action="openGiftJewelryModal" data-args="&apos;${item.id}&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition">
                    <i class="fas fa-gift text-pink-400"></i> Gift to Someone
                </button>

                <button data-action="toggleInsureJewelry" data-args="&apos;${item.id}&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition">
                    <i class="fas fa-shield-alt text-blue-400"></i> ${insureBtnText}
                </button>

                <button data-action="sellJewelry" data-args="&apos;${item.id}&apos;" class="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition mt-2">
                    <i class="fas fa-dollar-sign"></i> Sell / Pawn for ${Utils.formatMoney(item.value)}
                </button>
            </div>
        </div>
    `;
};

export const toggleWearJewelry = (id) => {
    const user = state.gameState.user;
    const item = (user.assets || []).find(a => a.id === id);
    if (!item) return;

    item.wearing = !item.wearing;
    if (item.wearing) {
        addLog(`You put on your ${item.name}.`, 'good');
    } else {
        addLog(`You stored your ${item.name} safely back in your vault.`, 'neutral');
    }
    renderJewelryManager(id);
};

export const toggleInsureJewelry = (id) => {
    const user = state.gameState.user;
    const item = (user.assets || []).find(a => a.id === id);
    if (!item) return;

    item.insured = !item.insured;
    if (item.insured) {
        addLog(`Insured ${item.name} for an annual fee of ${Utils.formatMoney(Math.max(10, Math.floor(item.value * 0.005)))}.`, 'good');
    } else {
        addLog(`Cancelled insurance policy on ${item.name}.`, 'neutral');
    }
    renderJewelryManager(id);
};

export const sellJewelry = (id) => {
    const user = state.gameState.user;
    const index = (user.assets || []).findIndex(a => a.id === id);
    if (index === -1) return;

    const item = user.assets[index];
    user.money += item.value;
    user.assets.splice(index, 1);

    addLog(`Sold ${item.name} for ${Utils.formatMoney(item.value)}.`, 'good');
    UI.updateHeader(user);
    renderAssets();
    UI.showModal("Item Sold", `You sold ${item.name} for ${Utils.formatMoney(item.value)}.`);
};

export const openGiftJewelryModal = (id) => {
    const user = state.gameState.user;
    const item = (user.assets || []).find(a => a.id === id);
    if (!item) return;

    const relationships = user.relationships || [];
    if (relationships.length === 0) {
        UI.showModal("No Relationships", "You don't have any family or friends to gift this item to!");
        return;
    }

    const relHtml = relationships.map(rel => `
        <button data-action="confirmGiftJewelry" data-args="&apos;${item.id}&apos;, &apos;${rel.id}&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 text-white font-bold p-3 rounded-xl mb-2 flex items-center justify-between transition">
            <div class="text-left">
                <div class="text-sm text-white font-bold">${rel.name}</div>
                <div class="text-xs text-slate-400 capitalize">${rel.type} • ${rel.status}% Relationship</div>
            </div>
            <i class="fas fa-gift text-pink-400"></i>
        </button>
    `).join('');

    const modalHtml = `
        <div class="text-center mb-4">
            <h3 class="text-lg font-bold text-white">Gift ${item.name}</h3>
            <p class="text-xs text-slate-400">Who would you like to give this to?</p>
        </div>
        <div class="max-h-60 overflow-y-auto custom-scrollbar pr-1">
            ${relHtml}
        </div>
    `;

    UI.showModal("Gift Jewelry", modalHtml);
};

export const confirmGiftJewelry = (jewelryId, relationshipId) => {
    const user = state.gameState.user;
    const itemIndex = (user.assets || []).findIndex(a => a.id === jewelryId);
    const person = (user.relationships || []).find(r => r.id === relationshipId);

    if (itemIndex === -1 || !person) return;

    const item = user.assets[itemIndex];
    user.assets.splice(itemIndex, 1);

    const statusBoost = Math.min(35, Math.max(15, Math.floor(Math.log10(Math.max(10, item.value)) * 8)));
    person.status = Math.min(100, (person.status || 0) + statusBoost);
    person.interactedThisYear = true;

    addLog(`You gifted a ${item.name} (${Utils.formatMoney(item.value)}) to ${person.name}! (+${statusBoost}% Status)`, 'good');
    UI.hideModal();
    renderAssets();
    UI.showModal("Gift Received!", `${person.name} was thrilled to receive the ${item.name}! Your relationship improved by +${statusBoost}%.`);
};



