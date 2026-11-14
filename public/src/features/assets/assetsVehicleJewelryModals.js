import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAssets } from './assetsScreen.js';

const get = id => document.getElementById(id);

export const renderVehicleManager = (id) => {
    const user = state.gameState.user;
    
    const vehicle = user.assets.find(a => a.id === id);
    if (!vehicle) {
        console.error("Vehicle not found!"); 
        renderAssets(); 
        return;
    }

    if (vehicle.name && typeof vehicle.name === 'string' && vehicle.name.startsWith('New ')) {
        vehicle.name = vehicle.name.replace(/^New\s+/i, '');
    }

    const style = GameLogic.getVehicleIcon(vehicle.type);
    const currentAge = user.age || 18;
    const acquiredAge = vehicle.acquiredAge !== undefined ? vehicle.acquiredAge : currentAge;
    const ownedYears = Math.max(0, currentAge - acquiredAge);

    const damage = 100 - vehicle.condition;
    const baseRepairCost = damage * 20; 
    const luxuryMultiplier = Math.max(1, vehicle.value / 20000);
    const repairCost = Math.floor(baseRepairCost * luxuryMultiplier);
    
    const canRepair = user.money >= repairCost && vehicle.condition < 100;
    const hasLoan = vehicle.loan && vehicle.loan.remainingBalance > 0;
    const insuranceFee = Math.max(20, Math.floor(vehicle.value * 0.008));
    const stars = "★".repeat(vehicle.reliability || 3) + "☆".repeat(5 - (vehicle.reliability || 3));

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mx-auto mb-3">
                    <i class="fas ${style.icon} ${style.color} text-3xl"></i>
                </div>
                <div class="flex items-center justify-center gap-2 mb-1">
                    <h2 class="text-2xl font-bold text-white">${Utils.escapeHtml(vehicle.name)}</h2>
                    ${vehicle.isPrimary ? `<span class="bg-blue-900/80 text-blue-300 text-xs font-bold px-2 py-0.5 rounded border border-blue-700">Primary Ride</span>` : ''}
                </div>
                <div class="text-green-400 font-bold text-xl">${Utils.formatMoney(vehicle.value)}</div>
                <div class="text-slate-400 text-xs mt-1 flex items-center justify-center gap-3 flex-wrap">
                    <span>Age: <strong class="text-white">${ownedYears} yrs</strong></span> •
                    <span>Purchased: <strong class="text-white">${Utils.formatMoney(vehicle.purchasePrice || vehicle.value)}</strong></span> •
                    <span>Reliability: <strong class="text-amber-400">${stars}</strong></span>
                </div>
            </div>

            <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-5">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Condition</span>
                    <span class="${vehicle.condition < 50 ? 'text-red-400' : 'text-green-400'} font-bold">${vehicle.condition}%</span>
                </div>
                <div class="w-full bg-slate-900 h-3 rounded-full overflow-hidden mb-3">
                    <div class="h-full ${vehicle.condition < 50 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500" style="width: ${vehicle.condition}%"></div>
                </div>

                ${hasLoan ? `
                    <div class="bg-slate-900 p-3 rounded-lg border border-amber-900/50 flex items-center justify-between text-xs mt-2">
                        <div>
                            <div class="text-amber-400 font-bold">Active Auto Loan</div>
                            <div class="text-slate-400">Payment: ${Utils.formatMoney(vehicle.loan.monthlyPayment)}/mo</div>
                        </div>
                        <div class="text-right font-bold text-white">${Utils.formatMoney(vehicle.loan.remainingBalance)} balance</div>
                    </div>
                ` : ''}

                <div class="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>Insurance Coverage: <strong class="${vehicle.insured ? 'text-teal-400' : 'text-slate-500'}">${vehicle.insured ? 'Active (' + Utils.formatMoney(insuranceFee) + '/yr)' : 'Uninsured'}</strong></span>
                    ${vehicle.statusBonus > 0 ? `<span class="text-amber-300 font-bold">+${vehicle.statusBonus} Status Boost</span>` : ''}
                </div>
            </div>

            <div class="grid grid-cols-1 gap-2.5 pb-8">
                
                <!-- Primary Ride Toggle -->
                <button data-action="setPrimaryVehicle" data-args="${vehicle.id}" class="${vehicle.isPrimary ? 'bg-blue-900/40 border-blue-500/80 text-blue-300' : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'} p-3.5 rounded-xl border flex items-center justify-between transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-sm">${vehicle.isPrimary ? 'Set as Primary Ride (Active)' : 'Make Primary Ride'}</h3>
                            <div class="text-xs text-slate-400">${vehicle.isPrimary ? 'Drive this vehicle for daily commuting & status boosts' : 'Drive this car daily'}</div>
                        </div>
                    </div>
                    <i class="fas fa-check-circle ${vehicle.isPrimary ? 'text-blue-400' : 'text-slate-600'}"></i>
                </button>

                <!-- Take for a Joyride -->
                <button data-action="takeJoyride" data-args="${vehicle.id}" class="bg-slate-800 hover:bg-slate-750 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                            <i class="fas fa-route"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-sm">Take for a Joyride</h3>
                            <div class="text-xs text-slate-400">Go for a scenic drive for happiness & fun</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </button>

                <!-- Auto Insurance Toggle -->
                <button data-action="toggleInsureVehicle" data-args="${vehicle.id}" class="bg-slate-800 hover:bg-slate-750 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-teal-900/30 flex items-center justify-center text-teal-400">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-sm">${vehicle.insured ? 'Cancel Insurance Policy' : 'Insure Vehicle'}</h3>
                            <div class="text-xs text-slate-400">${vehicle.insured ? 'Currently covered against accident damage' : 'Protect against repair costs (' + Utils.formatMoney(insuranceFee) + '/yr)'}</div>
                        </div>
                    </div>
                    <span class="text-xs font-bold ${vehicle.insured ? 'text-teal-400' : 'text-slate-400'}">${vehicle.insured ? 'Insured' : 'Uninsured'}</span>
                </button>

                <!-- Repair & Detail -->
                <button data-action="repairVehicle" data-args="${vehicle.id}, ${repairCost}" 
                    ${canRepair ? '' : 'disabled'}
                    class="${canRepair ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white' : 'bg-slate-800 opacity-50 cursor-not-allowed border-slate-700 text-slate-500'} p-3.5 rounded-xl border flex items-center justify-between transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                            <i class="fas fa-wrench"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-sm">Repair & Detail</h3>
                            <div class="text-xs text-blue-200">Restore condition to 100% (${Utils.formatMoney(repairCost)})</div>
                        </div>
                    </div>
                </button>

                <!-- Gift Vehicle -->
                <button data-action="openGiftVehicleModal" data-args="${vehicle.id}" class="bg-slate-800 hover:bg-slate-750 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-sm">Gift Vehicle</h3>
                            <div class="text-xs text-amber-200">Give to family or partner (+Relationship)</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </button>

                <!-- Sell Vehicle -->
                <button data-action="sellVehicle" data-args="${vehicle.id}" class="bg-red-900/30 hover:bg-red-900/50 p-3.5 rounded-xl border border-red-800/50 flex items-center justify-between transition mt-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-red-900/40 flex items-center justify-center text-red-400">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-sm">Sell Vehicle</h3>
                            <div class="text-xs text-red-300">Sell for market value (${Utils.formatMoney(vehicle.value)})</div>
                        </div>
                    </div>
                </button>

            </div>
        </div>
    `;
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
        saveGame();
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
    saveGame();
    UI.updateHeader(user);
    
    // Go back to the main list since this car is gone
    renderAssets();
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

    UI.updateBottomNav('assets');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
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
    saveGame();
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
    saveGame();
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
    saveGame();
    UI.updateHeader(user);
    renderAssets();
    UI.showModal("Item Sold", `You sold ${Utils.escapeHtml(item.name)} for ${Utils.formatMoney(item.value)}.`);
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
                <div class="text-sm text-white font-bold">${Utils.escapeHtml(rel.name)}</div>
                <div class="text-xs text-slate-400 capitalize">${Utils.escapeHtml(rel.type)} • ${rel.status}% Relationship</div>
            </div>
            <i class="fas fa-gift text-pink-400"></i>
        </button>
    `).join('');

    const modalHtml = `
        <div class="text-center mb-4">
            <h3 class="text-lg font-bold text-white">Gift ${Utils.escapeHtml(item.name)}</h3>
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
    saveGame();
    UI.hideModal();
    renderAssets();
    UI.showModal("Gift Received!", `${Utils.escapeHtml(person.name)} was thrilled to receive the ${Utils.escapeHtml(item.name)}! Your relationship improved by +${statusBoost}%.`);
};

export const setPrimaryVehicle = (id) => {
    const user = state.gameState.user;
    if (!user.assets) return;

    user.assets.forEach(a => {
        if (a.category === 'vehicle') {
            a.isPrimary = (a.id === id);
        }
    });

    const target = user.assets.find(a => a.id === id);
    if (target) {
        addLog(`Set ${target.name} as your primary ride!`, 'good');
    }

    saveGame();
    renderVehicleManager(id);
};

export const toggleInsureVehicle = (id) => {
    const user = state.gameState.user;
    const vehicle = (user.assets || []).find(a => a.id === id);
    if (!vehicle) return;

    vehicle.insured = !vehicle.insured;
    const fee = Math.max(20, Math.floor(vehicle.value * 0.008));

    if (vehicle.insured) {
        addLog(`Insured your ${vehicle.name} (${Utils.formatMoney(fee)}/year premium).`, 'good');
    } else {
        addLog(`Cancelled auto insurance policy for ${vehicle.name}.`, 'neutral');
    }

    saveGame();
    renderVehicleManager(id);
};

export const takeJoyride = (id) => {
    const user = state.gameState.user;
    const vehicle = (user.assets || []).find(a => a.id === id);
    if (!vehicle) return;

    if (vehicle.condition < 15) {
        UI.showModal("Engine Malfunction", "This car is in too terrible condition to drive! Repair it first.");
        return;
    }

    const roll = Math.random();

    if (roll < 0.60) {
        GameLogic.adjustStat(user, 'happiness', 8);
        addLog(`Took your ${vehicle.name} out for a scenic highway cruise. Loved every minute! (+8 Happiness)`, 'good');
        UI.showModal("Scenic Cruise", `You had a fantastic time cruising around in your ${Utils.escapeHtml(vehicle.name)}. People turned their heads! (+8 Happiness)`);
    } else if (roll < 0.85) {
        GameLogic.adjustStat(user, 'happiness', 4);
        addLog(`Took a quick drive around town in your ${vehicle.name}. (+4 Happiness)`, 'good');
        UI.showModal("Nice Drive", `Enjoyed a relaxing drive around the city in your ${Utils.escapeHtml(vehicle.name)}. (+4 Happiness)`);
    } else if (roll < 0.95) {
        const fine = Math.min(350, Math.floor(vehicle.value * 0.005) + 150);
        user.money = Math.max(0, user.money - fine);
        GameLogic.adjustStat(user, 'happiness', -5);
        addLog(`Pulled over while driving your ${vehicle.name}! Received a ${Utils.formatMoney(fine)} speeding ticket. (-5 Happiness)`, 'bad');
        UI.showModal("Speeding Ticket!", `A police officer caught you speeding in your ${Utils.escapeHtml(vehicle.name)}! Fined ${Utils.formatMoney(fine)}. (-5 Happiness)`);
    } else {
        const scratch = Math.floor(Math.random() * 8) + 5;
        vehicle.condition = Math.max(0, vehicle.condition - scratch);
        GameLogic.adjustStat(user, 'happiness', -10);
        if (vehicle.insured) {
            addLog(`Minor fender bender in your ${vehicle.name}! Insured policy covered all major repairs. (-${scratch}% condition, -10 Happiness)`, 'bad');
            UI.showModal("Fender Bender!", `You clipped a curb in your ${Utils.escapeHtml(vehicle.name)}. Fortunately, your auto insurance policy covered the repair process! (-10 Happiness)`);
        } else {
            addLog(`Scratched your ${vehicle.name} while parking! (-${scratch}% condition, -10 Happiness)`, 'bad');
            UI.showModal("Car Scratch!", `You accidentally scraped your ${Utils.escapeHtml(vehicle.name)} against a pillar. (-${scratch}% condition, -10 Happiness)`);
        }
    }

    saveGame();
    UI.updateHeader(user);
    renderVehicleManager(id);
};

export const openGiftVehicleModal = (id) => {
    const user = state.gameState.user;
    const vehicle = (user.assets || []).find(a => a.id === id);
    if (!vehicle) return;

    const rels = user.relationships || [];
    if (rels.length === 0) {
        UI.showModal("No Recipients", "You don't have any family or friends to gift this vehicle to!");
        return;
    }

    const html = `
        <div class="space-y-4">
            <p class="text-sm text-slate-300">Choose who to gift your <strong class="text-white">${Utils.escapeHtml(vehicle.name)}</strong> to:</p>
            <div class="max-h-60 overflow-y-auto space-y-2">
                ${rels.map(r => `
                    <div class="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div>
                            <div class="font-bold text-white text-sm">${Utils.escapeHtml(r.name)}</div>
                            <div class="text-xs text-slate-400 capitalize">${Utils.escapeHtml(r.type || r.relationship)} • Status: ${r.status}%</div>
                        </div>
                        <button data-action="confirmGiftVehicle" data-args="${vehicle.id}, '${r.id}'" class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded text-xs transition">
                            Gift Car
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="text-right">
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">Cancel</button>
            </div>
        </div>
    `;

    UI.showModal(`Gift ${Utils.escapeHtml(vehicle.name)}`, html);
};

export const confirmGiftVehicle = (vehicleId, personId) => {
    const user = state.gameState.user;
    const index = (user.assets || []).findIndex(a => a.id === vehicleId);
    if (index === -1) return;

    const vehicle = user.assets[index];
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person) return;

    const boost = Math.floor(Math.random() * 16) + 25;
    person.status = Math.min(100, (person.status || 50) + boost);

    user.assets.splice(index, 1);

    saveGame();
    UI.hideModal();
    addLog(`Gifted your ${vehicle.name} to ${person.name}! (+${boost}% Relationship Status)`, 'good');
    UI.showModal("Vehicle Gifted!", `You gave your ${Utils.escapeHtml(vehicle.name)} to ${Utils.escapeHtml(person.name)}! They were overwhelmed with gratitude (+${boost}% Relationship).`);
    renderAssets();
};
