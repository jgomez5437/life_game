//CREATE BUSINESS SCREEN

function renderBusinessSetup() {
    get('game-container').innerHTML = `
        <div class="fade-in max-w-lg mx-auto">
            <button onclick="renderActivities()" class="mb-4 text-slate-400 hover:text-white text-sm flex items-center gap-2"><i class="fas fa-arrow-left"></i> Cancel</button>
            
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h2 class="text-2xl font-bold mb-4 text-white">Incorporate Company</h2>
                
                <label class="block text-sm font-bold mb-2 text-slate-300">Company Name</label>
                <input type="text" id="inp-comp-name" class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 mb-6" placeholder="Enter name...">
                <label class="block text-sm font-bold mb-2 text-slate-300">Select Industry</label>
                <div class="space-y-3 mb-6">
                    ${Object.keys(INDUSTRIES).map(key => `
                        <div class="industry-card cursor-pointer border border-slate-600 p-4 rounded-lg flex items-center hover:bg-slate-700 transition" onclick="selectIndustry('${key}')" id="ind-${key}">
                            <div class="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-blue-400 mr-4">
                                <i class="fas ${INDUSTRIES[key].icon}"></i>
                            </div>
                            <div>
                                <div class="font-bold text-white">${INDUSTRIES[key].name}</div>
                                <div class="text-xs text-slate-400">${INDUSTRIES[key].description}</div>
                                <div class="text-xs text-green-400 font-bold mt-1">Startup Cost: ${window.Utils.formatMoney(INDUSTRIES[key].startupCost)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded mb-6 text-sm text-blue-200">
                    <i class="fas fa-info-circle"></i> Requires <strong>personal capital</strong> to start.
                </div>
                <button onclick="window.UI.showModal('Coming Soon', 'Currently being developed.')" class="w-full btn-primary text-white font-bold py-4 rounded-lg text-lg shadow-lg">Launch Company</button>
            </div>
        </div>
    `;
    selectIndustry('tech');
}
function selectIndustry(key) {
    const user = window.gameState.user;
    user.industry = key;
    document.querySelectorAll('.industry-card').forEach(get => {
        get.classList.remove('border-blue-500', 'bg-slate-700');
        get.classList.add('border-slate-600');
    });
    const selected = get(`ind-${key}`);
    selected.classList.remove('border-slate-600');
    selected.classList.add('border-blue-500', 'bg-slate-700');
}
function initBusiness() {
    const user = window.gameState.user;
    const name = get('inp-comp-name').value;
    if (!name) return showModal("Error", "Enter a company name.");
    
    const ind = INDUSTRIES[user.industry];
    
    if (user.money < ind.startupCost) {
        return showModal("Insufficient Funds", `You need ${formatMoney(ind.startupCost)} to start this business. You currently have ${formatMoney(user.bank)}.`);
    }
    
    // Deduct cost from personal bank
    user.money -= ind.startupCost;
    
    user.companyName = name;
    user.hasBusiness = true;
    user.compCash = ind.startupCost; // Capital Injection
    user.quarter = 1;
    
    // Set Defaults
    user.salaryOffer = ind.baseSalary;
    user.sellingPrice = ind.unitPrice;
    user.productionTarget = Math.floor(ind.baseDemand * 0.8);
    addLog(`Founded ${name} (${ind.name})! Invested ${formatMoney(ind.startupCost)}.`, 'good');
    renderBusinessDashboard();
}