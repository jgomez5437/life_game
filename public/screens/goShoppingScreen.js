// screens/shoppingScreen.js

// Vehicle list
const VEHICLES_FOR_SALE = [
    { id: 1, name: "Rusty Toyota Camry", type: "sedan", price: 2000, condition: 60 },
    { id: 2, name: "Rusty Honda Civic", type: "sedan", price: 2200, condition: 60 },
    { id: 3, name: "Used Honda Fit", type: "hatchback", price: 6000, condition: 80 },
    { id: 4, name: "Used Ford Fiesta", type: "hatchback", price: 5500, condition: 80 },
    { id: 5, name: "New Subaru Forester", type: "suv", price: 35000, condition: 100 },
    { id: 6, name: "New Toyota Rav4", type: "suv", price: 35000, condition: 100 },
    { id: 7, name: "New Ford F-150 XL", type: "truck", price: 45500, condition: 100 },
    { id: 8, name: "New Chevrolet Silverado 1500", type: "truck", price: 42000, condition: 100 },
    { id: 9, name: "New Chevrolet Corvette Stingray", type: "sports", price: 67000, condition: 100 },
    { id: 10, name: "New BMW M2", type: "sports", price: 65000, condition: 100 },
    { id: 11, name: "New Lamborghini Huracán", type: "supercar", price: 255000, condition: 100 },
    { id: 12, name: "New Ferrari Roma", type: "supercar", price: 260000, condition: 100 }
];


// Main shopping hub
window.renderShoppingHub = () => {
    const user = window.gameState.user;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderLifeDashboard()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Life
                </button>
            </div>
            
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Marketplace</h2>
                <p class="text-slate-400">What would you like to buy?</p>
            </div>

            <div class="grid grid-cols-1 gap-4">
                
                <button onclick="renderVehicleDealer()" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-blue-500 transition group">
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

                <button onclick="window.UI.showModal('Coming Soon', 'Real Estate is under construction.')" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-green-500 transition group">
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

                <button onclick="window.UI.showModal('Coming Soon', 'Luxury items are under construction.')" class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-yellow-500 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-400 text-xl group-hover:scale-110 transition">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white text-lg">Luxury Goods</h3>
                            <div class="text-xs text-slate-500">Watches, jewelry, art</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600 group-hover:text-white"></i>
                </button>

            </div>
        </div>
    `;
};

// Vehicle Dealership Screen
window.renderVehicleDealer = () => {
    const user = window.gameState.user;
    
    const carListHtml = VEHICLES_FOR_SALE.map(car => {
        const canAfford = user.money >= car.price;
        const style = window.GameLogic.getVehicleIcon(car.type);
        
        let buyButtonText = canAfford ? "Buy" : "Can't Afford"; 
        
        return `
            <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
                        <i class="fas ${style.icon} ${style.color} text-base"></i>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-white text-base leading-none mb-1">${car.name}</h3>
                        
                        <div class="flex items-center gap-2">
                            <div class="text-xs text-slate-400 capitalize border-r border-slate-600 pr-2">${car.type}</div>
                            <div class="text-green-400 font-bold text-xs">${window.Utils.formatMoney(car.price)}</div>
                        </div>
                    </div>
                </div>
                
                <button onclick="buyVehicle(${car.id})" 
                    ${canAfford ? '' : 'disabled'}
                    class="${canAfford ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap ml-2">
                    ${buyButtonText}
                </button>
            </div>
        `;
    }).join('');

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderShoppingHub()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Market
                </button>
            </div>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-3 text-2xl">
                    <i class="fas fa-car"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${user.city} Vehicle Dealership</h2>
                <p class="text-slate-400 text-sm">Find your new ride.</p>
            </div>

            <div class="grid grid-cols-1 gap-2 pb-6">
                ${carListHtml}
            </div>
        </div>
    `;
};

// --- LOGIC FUNCTIONS (The "Controller") ---

window.buyVehicle = (carId) => {
    const user = window.gameState.user;
    const car = VEHICLES_FOR_SALE.find(c => c.id === carId);

    if (!car) return;

    if (user.money < car.price) {
        window.UI.showModal("Insufficient Funds", "You cannot afford this vehicle.");
        return;
    }

    // 1. Deduct Money
    user.money -= car.price;

    // 2. Add to Assets
    // We create a new object so we don't link directly to the store reference
    const newAsset = {
        name: car.name,
        type: car.type,
        value: car.price,
        condition: car.condition,
        category: "vehicle" // Helpful for filtering later
    };

    // Ensure assets array exists
    if (!user.assets) user.assets = [];
    user.assets.push(newAsset);

    // 3. Feedback
    window.addLog(`Purchased a ${car.name} for ${window.Utils.formatMoney(car.price)}.`, 'good');
    
    // 4. Refresh Screen
    window.UI.updateHeader(user); // Update bank balance in header
    renderVehicleDealer(); // Re-render list to update button states (affordability)
    
    // Optional: Show success modal
    window.UI.showModal("Purchase Successful", `You are now the owner of a ${car.name}!`);
};