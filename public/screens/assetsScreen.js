//ASSETS PAGE

// --- HELPER: Generates the HTML for the list of cars ---
function getVehicleListHtml(assets) {
    // Filter for vehicles only
    const vehicles = assets.filter(a => a.category === 'vehicle');

    // Handle Empty State
    if (vehicles.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any vehicles.</div>`;
    }

    // Map to HTML
    return vehicles.map(v => {
        // Determine color based on condition
        let condColor = 'text-green-400';
        if (v.condition < 40) condColor = 'text-red-500'; 
        else if (v.condition < 75) condColor = 'text-yellow-500'; 
        // Get icon
        const style = window.GameLogic.getVehicleIcon(v.type);
        
        return `
            <div onclick="renderVehicleManager(${v.id})" class="cursor-pointer hover:bg-slate-700 transition bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3 group">
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
                    <div class="text-green-400 font-bold text-sm">Value: ${window.Utils.formatMoney(v.value)}</div>
                    <i class="fas fa-chevron-right text-slate-600 text-xs mt-1"></i>
                </div>
            </div>
        `;
    }).join('');
}

// --- MAIN FUNCTION ---
function renderAssets() {
    const user = window.gameState.user;

    // --- CALCULATE STATS ---
    let monthlyIncome = 0;
    if (user.hasBusiness) monthlyIncome += user.ceoSalary;
    if (user.jobTitle) monthlyIncome += Math.floor(user.jobSalary / 12);

    let monthlyOutflow = 0;
    if (user.studentLoans > 0 && user.age >= 23 && !user.gradSchoolEnrolled) {
        monthlyOutflow += 200;
    }
    // Living Expenses: Age 19+ AND Not enrolled in ANY school
    // Note: Assuming isStudent() checks the user object correctly
    if (user.age >= 19 && (typeof isStudent === 'function' ? !isStudent() : !user.isStudent)) {
        monthlyOutflow += 2000;
    }
    
    // Ensure assets array exists
    const assets = user.assets || [];
    const vehicleHtml = getVehicleListHtml(assets);

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderLifeDashboard(window.gameState)" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-4 px-1">My Assets</h2>
            
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Income</div>
                    <div class="text-green-400 font-bold text-sm">${window.Utils.formatMoney(monthlyIncome)}/mo</div>
                </div>
                <div class="border-x border-slate-700 px-2">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Student Loans</div>
                    <div class="text-red-400 font-bold text-sm">${window.Utils.formatMoney(user.studentLoans)}</div>
                </div>
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Monthly Outflow</div>
                    <div class="text-red-400 font-bold text-sm">${window.Utils.formatMoney(monthlyOutflow)}/mo</div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-4">
                
                <div onclick="renderShoppingHub()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
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
                    <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
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

window.renderVehicleManager = (id) => {
    const user = window.gameState.user;
    
    // Find the specific car by ID
    const vehicle = user.assets.find(a => a.id === id);
    if (!vehicle) {
        console.error("Vehicle not found!"); 
        renderAssets(); 
        return;
    }

    const style = window.GameLogic.getVehicleIcon(vehicle.type);
    
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
                <button onclick="renderAssets()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
            </div>

            <div class="text-center mb-8">
                <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mx-auto mb-4">
                    <i class="fas ${style.icon} ${style.color} text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${vehicle.name}</h2>
                <div class="text-green-400 font-bold text-xl mt-1">${window.Utils.formatMoney(vehicle.value)}</div>
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
                
                <button onclick="repairVehicle(${vehicle.id}, ${repairCost})" 
                    ${canRepair ? '' : 'disabled'}
                    class="${canRepair ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'} p-4 rounded-xl border border-blue-500/50 flex items-center justify-between transition group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                            <i class="fas fa-wrench"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Repair Vehicle</h3>
                            <div class="text-xs text-blue-200">Cost: ${window.Utils.formatMoney(repairCost)}</div>
                        </div>
                    </div>
                </button>

                <button onclick="sellVehicle(${vehicle.id})" class="bg-red-900/40 p-4 rounded-xl border border-red-800/50 flex items-center justify-between hover:bg-red-900/60 transition group mt-4 mb-8">
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

window.repairVehicle = (id, cost) => {
    const user = window.gameState.user;
    const vehicle = user.assets.find(a => a.id === id);
    
    if (user.money >= cost) {
        user.money -= cost;
        vehicle.condition = 100; // Restore to perfect
        
        // Slight value bump for fixing it?
        vehicle.value = Math.floor(vehicle.value * 1.05); 
        
        window.addLog(`Repaired ${vehicle.name} for ${window.Utils.formatMoney(cost)}.`, 'neutral');
        window.UI.updateHeader(user);
        renderVehicleManager(id); // Refresh screen
    }
};

window.sellVehicle = (id) => {
    const user = window.gameState.user;
    // Find index to remove
    const index = user.assets.findIndex(a => a.id === id);
    if (index === -1) return;

    const vehicle = user.assets[index];
    const salePrice = vehicle.value;

    // Confirm Modal (Optional, but good UX)
    // For now, let's just sell it instantly:
    
    user.money += salePrice;
    user.assets.splice(index, 1); // Remove from array
    
    window.addLog(`Sold ${vehicle.name} for ${window.Utils.formatMoney(salePrice)}.`, 'good');
    window.UI.updateHeader(user);
    
    // Go back to the main list since this car is gone
    renderAssets();
};

