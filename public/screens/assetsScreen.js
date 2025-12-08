//ASSETS PAGE

function renderAssets() {
    updateHeader();
    
    // Calculate Monthly Finance Stats
    let monthlyIncome = 0;
    if (game.hasBusiness) monthlyIncome += game.ceoSalary;
    if (game.jobTitle) monthlyIncome += Math.floor(game.jobSalary / 12);
    let monthlyOutflow = 0;
    if (game.studentLoans > 0 && game.age >= 23 && !game.gradSchoolEnrolled) {
        monthlyOutflow += 200;
    }
    // Living Expenses: Age 19+ AND Not enrolled in ANY school
    if (game.age >= 19 && !isStudent()) {
        monthlyOutflow += 2000;
    }
    
    const assetList = game.assets.length > 0 
        ? game.assets.map(a => `<div class="p-3 bg-slate-900 border border-slate-700 rounded mb-2">${a.name}</div>`).join('')
        : `<div class="text-slate-500 italic text-center py-4 text-xs">You don't own any items yet.</div>`;
    el('game-container').innerHTML = `
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
                    <div class="text-green-400 font-bold text-sm">${formatMoney(monthlyIncome)}/mo</div>
                </div>
                <div class="border-x border-slate-700 px-2">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Student Loans</div>
                    <div class="text-red-400 font-bold text-sm">${formatMoney(game.studentLoans)}</div>
                </div>
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Monthly Outflow</div>
                    <div class="text-red-400 font-bold text-sm">${formatMoney(monthlyOutflow)}/mo</div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-4">
                
                <!-- Go Shopping -->
                <div onclick="showModal('Coming Soon', 'Shopping functionality will be added in a future update.')" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
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
