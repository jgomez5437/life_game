//BUSINESS DASHBOARD

function enterBusinessMode() {
    renderBusinessDashboard();
}
function renderBusinessDashboard() {
    const ind = INDUSTRIES[game.industry];
    
    // Input Ranges
    const minPrice = Math.floor(ind.unitPrice * 0.5);
    const maxPrice = Math.floor(ind.unitPrice * 3.0);
    const maxProd = Math.floor(game.compCash / ind.unitCost);
    el('game-container').innerHTML = `
        <div class="fade-in pb-20 max-w-2xl mx-auto">
            
            <!-- Top Bar for Business Mode -->
            <div class="flex justify-between items-center mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Occupation
                </button>
                <div class="text-right">
                     <div class="text-xs text-slate-400">Company Cash</div>
                     <div class="text-xl font-bold text-green-400">${formatMoney(game.compCash)}</div>
                </div>
            </div>
            <div class="mb-6 flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div>
                    <h2 class="text-xl font-bold text-white">${game.companyName}</h2>
                    <div class="text-xs text-slate-400">Fiscal Year ${game.year} - Q${game.quarter}</div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-bold text-white">${game.employees} Employees</div>
                    <div class="text-xs text-slate-400">Rep: ${game.reputation}%</div>
                </div>
            </div>
            <!-- LIVE PREVIEW BOX -->
            <div class="bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-xl mb-6 shadow-inner">
                <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 border-b border-indigo-500/30 pb-2">
                    <i class="fas fa-calculator mr-1"></i> Quarterly Projection
                </h3>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between text-slate-400">
                        <span>Est. Revenue</span> <span id="proj-rev" class="text-green-400 font-mono">$0</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Prod. Costs</span> <span id="proj-cost" class="text-red-300 font-mono">$0</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Employee Wages</span> <span id="proj-wages" class="text-red-300 font-mono">$0</span>
                    </div>
                     <div class="flex justify-between text-slate-400">
                        <span>CEO Salary (You)</span> <span id="proj-ceo" class="text-red-300 font-mono">$0</span>
                    </div>
                    <div class="border-t border-indigo-500/30 my-2 pt-2 flex justify-between font-bold">
                        <span class="text-white">Est. Net Profit</span>
                        <span id="proj-profit" class="text-white">$0</span>
                    </div>
                </div>
            </div>
            <!-- CONTROLS -->
            <div class="space-y-6">
                
                <!-- Production -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold"><i class="fas fa-industry text-slate-400 mr-2"></i> Production Units</h3>
                        <input type="number" id="num-prod" class="num-input" value="${game.productionTarget}" min="0" oninput="syncFromInput('prod')">
                    </div>
                    <input type="range" id="rng-prod" min="0" max="${Math.max(20000, maxProd)}" value="${game.productionTarget}" oninput="syncFromSlider('prod')">
                    <div class="text-xs text-slate-500 text-right mt-1">Inventory: ${game.inventory}</div>
                </div>
                <!-- Price -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold"><i class="fas fa-tag text-slate-400 mr-2"></i> Price ($)</h3>
                        <input type="number" id="num-price" class="num-input" value="${game.sellingPrice}" min="1" oninput="syncFromInput('price')">
                    </div>
                    <input type="range" id="rng-price" min="${minPrice}" max="${maxPrice}" value="${game.sellingPrice}" oninput="syncFromSlider('price')">
                     <div class="text-center mt-2 text-xs" id="price-impact"></div>
                </div>
                <!-- Employee Wages -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold"><i class="fas fa-users text-slate-400 mr-2"></i> Emp. Salary/Mo</h3>
                        <input type="number" id="num-salary" class="num-input" value="${game.salaryOffer}" min="1000" step="100" oninput="syncFromInput('salary')">
                    </div>
                    <input type="range" id="rng-salary" min="${Math.floor(ind.baseSalary * 0.5)}" max="${ind.baseSalary * 2}" step="100" value="${game.salaryOffer}" oninput="syncFromSlider('salary')">
                </div>
                <!-- CEO Salary (New) -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold"><i class="fas fa-user-tie text-slate-400 mr-2"></i> Your Salary/Mo</h3>
                        <input type="number" id="num-ceo" class="num-input" value="${game.ceoSalary}" min="0" step="500" oninput="syncFromInput('ceo')">
                    </div>
                    <input type="range" id="rng-ceo" min="0" max="50000" step="500" value="${game.ceoSalary}" oninput="syncFromSlider('ceo')">
                    <div class="text-xs text-slate-500 mt-2">Goes to your personal bank account.</div>
                </div>
            </div>
            <button onclick="processQuarter()" class="w-full btn-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg mt-6 mb-4">
                End Quarter <i class="fas fa-arrow-right ml-2"></i>
            </button>
        </div>
    `;
    updateCalculations();
}
// --- SYNC INPUTS AND SLIDERS ---
function syncFromSlider(type) {
    const val = el(`rng-${type}`).value;
    el(`num-${type}`).value = val;
    updateCalculations();
}
function syncFromInput(type) {
    const val = el(`num-${type}`).value;
    el(`rng-${type}`).value = val;
    updateCalculations();
}
function updateCalculations() {
    // Update State from Inputs
    game.productionTarget = parseInt(el('num-prod').value) || 0;
    game.sellingPrice = parseInt(el('num-price').value) || 0;
    game.salaryOffer = parseInt(el('num-salary').value) || 0;
    game.ceoSalary = parseInt(el('num-ceo').value) || 0;
    const ind = INDUSTRIES[game.industry];
    const supplier = SUPPLIERS.find(s => s.id === game.supplierId);
    // Costs
    const prodCost = game.productionTarget * (ind.unitCost * supplier.costMod);
    const empWages = game.employees * game.salaryOffer * 3; // 3 months
    const ceoWages = game.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp = prodCost + empWages + ceoWages + fixedCosts;
    // Demand Estimate
    const priceFactor = Math.pow((ind.unitPrice / game.sellingPrice), 1.5);
    const repFactor = 0.5 + (game.reputation / 100);
    const estDemand = Math.floor(ind.baseDemand * repFactor * priceFactor);
    
    // Revenue Estimate
    const estSold = Math.min(game.inventory + game.productionTarget, estDemand);
    const estRev = estSold * game.sellingPrice;
    const estProfit = estRev - totalExp;
    // Update UI
    el('proj-rev').innerText = formatMoney(estRev);
    el('proj-cost').innerText = "-" + formatMoney(prodCost);
    el('proj-wages').innerText = "-" + formatMoney(empWages);
    el('proj-ceo').innerText = "-" + formatMoney(ceoWages);
    el('proj-profit').innerText = (estProfit >= 0 ? "+" : "") + formatMoney(estProfit);
    el('proj-profit').className = estProfit >= 0 ? "text-green-400 font-bold font-mono" : "text-red-400 font-bold font-mono";
    const priceRatio = ind.unitPrice / game.sellingPrice;
    const impactEl = el('price-impact');
    if(priceRatio > 1.1) impactEl.innerHTML = `<span class="text-green-400">Cheap (High Demand)</span>`;
    else if (priceRatio < 0.9) impactEl.innerHTML = `<span class="text-red-400">Expensive (Low Demand)</span>`;
    else impactEl.innerHTML = `<span class="text-slate-400">Fair Price</span>`;
}
// --- BUSINESS TURN LOGIC ---
function processQuarter() {
    const ind = INDUSTRIES[game.industry];
    const supplier = SUPPLIERS.find(s => s.id === game.supplierId);
    // 1. Pay Expenses
    const prodCost = game.productionTarget * (ind.unitCost * supplier.costMod);
    const empWages = game.employees * game.salaryOffer * 3;
    const ceoWages = game.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp = prodCost + empWages + ceoWages + fixedCosts;
    if (totalExp > game.compCash) {
        return showModal("Bankruptcy Risk", "Company has insufficient funds! Reduce production or salaries.");
    }
    game.compCash -= totalExp;
    
    // PAY THE PLAYER
    game.bank += ceoWages;
    // 2. Determine Sales
    const priceFactor = Math.pow((ind.unitPrice / game.sellingPrice), 1.5);
    const repFactor = 0.5 + (game.reputation / 100);
    const volatility = 1 + ((Math.random() - 0.5) * ind.volatility * 2);
    const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility);
    const available = game.inventory + game.productionTarget;
    const sold = Math.min(available, actualDemand);
    game.inventory = available - sold;
    
    const revenue = sold * game.sellingPrice;
    game.compCash += revenue;
    const profit = revenue - totalExp;
    // 3. Reputation & Morale
    if (available < actualDemand) game.reputation -= 2;
    else game.reputation += 1;
    game.reputation = Math.max(0, Math.min(100, game.reputation));
    // 4. Log
    game.history.push({ year: game.year, quarter: game.quarter, profit, revenue });
    // 5. Advance Time
    game.quarter++;
    if (game.quarter > 4) {
        game.quarter = 1;
        game.year++; // Fiscal year ends
        game.age++; // Character Ages Up automatically when business year ends
        
        // Check if currently student at start of year
        const currentlyStudent = isStudent();
        // --- LIVING EXPENSES LOGIC ---
        if (game.age >= 19 && !currentlyStudent) {
            game.bank -= 24000; // $2k * 12
            
            if (!game.hasSeenExpenseMsg) {
                addLog("Your basic living expenses are $2,000 per month.", 'neutral');
                game.hasSeenExpenseMsg = true;
            }
        }
        // Student Loan Deduction Logic for CEO
        if (game.age >= 23 && game.studentLoans > 0 && !game.gradSchoolEnrolled) {
            const yearlyPayment = 2400; 
            game.bank -= yearlyPayment;
        }
        addLog(`Fiscal Year ${game.year-1} complete. Salary earned: ${formatMoney(ceoWages*4)}`, 'good');
        
        // Show Annual Report then go back to Life
        showModal(
            "Annual Report", 
            `Year ${game.year-1} Complete.<br>
            <strong>Company Cash:</strong> ${formatMoney(game.compCash)}<br>
            <strong>Your Bank:</strong> ${formatMoney(game.bank)}<br><br>
            You are now Age ${game.age}.`,
            "Return to Life View",
            () => renderLifeDashboard(window.gameState)
        );
    } else {
        renderBusinessDashboard(); // Next quarter
    }
}