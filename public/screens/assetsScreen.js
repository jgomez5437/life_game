//ASSETS PAGE

// --- HELPER: Generates the HTML for the list of cars ---
function getVehicleListHtml(assets) {
    // 1. Filter for vehicles only
    const vehicles = assets.filter(a => a.category === 'vehicle');

    // 2. Handle Empty State
    if (vehicles.length === 0) {
        return `<div class="bg-slate-800 p-4 rounded border border-slate-700 text-slate-500 italic text-sm text-center">You don't own any vehicles.</div>`;
    }

    // 3. Map to HTML
    return vehicles.map(v => {
        // Get icon
        const style = window.GameLogic.getVehicleIcon(v.type);
        
        return `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between mb-3">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600">
                        <i class="fas ${style.icon} ${style.color} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm">${v.name}</h4>
                        <div class="text-xs text-slate-400 capitalize">${v.type} • Condition: ${v.condition}%</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-green-400 font-bold text-sm">${window.Utils.formatMoney(v.value)}</div>
                    <div class="text-[10px] text-slate-500 uppercase">Value</div>
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

/** 
function renderAssets() {
    const user = window.gameState.user;
    // Calculate Monthly Finance Stats
    let monthlyIncome = 0;
    if (user.hasBusiness) monthlyIncome += user.ceoSalary;
    if (user.jobTitle) monthlyIncome += Math.floor(user.jobSalary / 12);
    let monthlyOutflow = 0;
    if (user.studentLoans > 0 && user.age >= 23 && !user.gradSchoolEnrolled) {
        monthlyOutflow += 200;
    }
    // Living Expenses: Age 19+ AND Not enrolled in ANY school
    if (user.age >= 19 && !isStudent()) {
        monthlyOutflow += 2000;
    }
    
    const assetList = user.assets.length > 0 
        ? user.assets.map(a => `<div class="p-3 bg-slate-900 border border-slate-700 rounded mb-2">${a.name}</div>`).join('')
        : `<div class="text-slate-500 italic text-center py-4 text-xs">You don't own any items yet.</div>`;
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderLifeDashboard(window.gameState)" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-4 px-1">My Assets</h2>
            
            <!-- Finance Stats Grid -->
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
                
                <!-- Go Shopping -->
                <div onclick="renderShoppingHub()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
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
                <!-- Placeholders -->
                <div class="mb-4">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Investments</h3>
                    <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                </div>
                <div class="mb-4">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Properties</h3>
                    <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                </div>
                <div class="mb-4">
                    <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Vehicles</h3>
                    <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                </div>
            </div>
        </div>
    `;
}
*/