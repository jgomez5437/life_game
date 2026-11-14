import { addLog } from '../state.js';

export const VEHICLE_TYPES = {
    sedan: { icon: "fa-car", color: "text-blue-400" },
    coupe: { icon: "fa-car-side", color: "text-indigo-400" },
    hatchback: { icon: "fa-car", color: "text-slate-400" },
    suv: { icon: "fa-shuttle-van", color: "text-emerald-400" },
    truck: { icon: "fa-truck-pickup", color: "text-orange-400" },
    van: { icon: "fa-van-shuttle", color: "text-slate-500" },
    motorcycle: { icon: "fa-motorcycle", color: "text-amber-400" },
    sports: { icon: "fa-car-burst", color: "text-red-500" },
    supercar: { icon: "fa-fire", color: "text-red-600" },
    hypercar: { icon: "fa-bolt", color: "text-purple-400" },
    ev: { icon: "fa-charging-station", color: "text-teal-400" },
    luxury_suv: { icon: "fa-gem", color: "text-yellow-400" },
    vintage: { icon: "fa-crown", color: "text-amber-500" },
    default: { icon: "fa-car", color: "text-gray-400" }
};

export const VEHICLES_FOR_SALE = [
    // --- 1. USED CAR LOT ($800 - $11,500) ---
    { id: 1, name: "Beater Hatchback", type: "hatchback", showroom: "used", price: 800, condition: 45, statusBonus: 0, reliability: 2, valuationType: "standard", desc: "High mileage, rusted body, but gets you from A to B." },
    { id: 2, name: "Vintage Moped", type: "motorcycle", showroom: "used", price: 1200, condition: 55, statusBonus: 0, reliability: 2, valuationType: "standard", desc: "Retro 50cc scooter with character and noisy exhaust." },
    { id: 3, name: "Rusty Toyota Camry", type: "sedan", showroom: "used", price: 2000, condition: 60, statusBonus: 0, reliability: 4, valuationType: "standard", desc: "Reliable Japanese sedan with a dented rear bumper." },
    { id: 4, name: "Rusty Honda Civic", type: "sedan", showroom: "used", price: 2200, condition: 60, statusBonus: 0, reliability: 4, valuationType: "standard", desc: "Dependable 2005 commuter with fading clearcoat." },
    { id: 5, name: "Old Ford Ranger", type: "truck", showroom: "used", price: 3200, condition: 60, statusBonus: 0, reliability: 3, valuationType: "standard", desc: "Trusty compact pickup with a dented tailgate and rugged charm." },
    { id: 6, name: "Used Mazda 3", type: "hatchback", showroom: "used", price: 4800, condition: 70, statusBonus: 0, reliability: 4, valuationType: "standard", desc: "Sporty compact hatchback with great fuel efficiency." },
    { id: 7, name: "Used Ford Fiesta", type: "hatchback", showroom: "used", price: 5500, condition: 75, statusBonus: 0, reliability: 3, valuationType: "standard", desc: "Zippy compact city car with 110k miles." },
    { id: 8, name: "Used Honda Fit", type: "hatchback", showroom: "used", price: 6000, condition: 80, statusBonus: 0, reliability: 4, valuationType: "standard", desc: "Versatile hatch with great fuel economy." },
    { id: 9, name: "Used Jeep Grand Cherokee", type: "suv", showroom: "used", price: 6800, condition: 72, statusBonus: 1, reliability: 3, valuationType: "standard", desc: "V6 four-wheel-drive SUV ready for road trips." },
    { id: 10, name: "Used Harley Cruiser", type: "motorcycle", showroom: "used", price: 8500, condition: 80, statusBonus: 1, reliability: 3, valuationType: "standard", desc: "Classic V-twin cruiser with chrome exhausts." },
    { id: 11, name: "Used BMW 328i", type: "sedan", showroom: "used", price: 8900, condition: 75, statusBonus: 1, reliability: 3, valuationType: "luxury", desc: "Older German sports sedan that still looks sharp." },
    { id: 12, name: "Used Nissan Altima", type: "sedan", showroom: "used", price: 9500, condition: 82, statusBonus: 0, reliability: 3, valuationType: "standard", desc: "Smooth midsize sedan with cold AC." },
    { id: 13, name: "Classic VW Beetle", type: "vintage", showroom: "used", price: 11500, condition: 85, statusBonus: 2, reliability: 3, valuationType: "luxury", desc: "Air-cooled vintage icon restored with retro charm." },

    // --- 2. CITY AUTO MALL ($24,000 - $86,000) ---
    { id: 14, name: "Honda Civic LX", type: "sedan", showroom: "mall", price: 24000, condition: 100, statusBonus: 1, reliability: 5, valuationType: "standard", desc: "Brand new efficient sedan with modern safety tech." },
    { id: 15, name: "Toyota Camry SE", type: "sedan", showroom: "mall", price: 28000, condition: 100, statusBonus: 1, reliability: 5, valuationType: "standard", desc: "Sporty styling, bulletproof reliability, and great MPG." },
    { id: 16, name: "Hyundai Elantra N", type: "sedan", showroom: "mall", price: 33000, condition: 100, statusBonus: 2, reliability: 4, valuationType: "standard", desc: "Turbocharged sport compact with track-ready exhaust note." },
    { id: 17, name: "Subaru Forester", type: "suv", showroom: "mall", price: 35000, condition: 100, statusBonus: 2, reliability: 4, valuationType: "standard", desc: "All-wheel drive crossover perfect for all weather." },
    { id: 18, name: "Toyota RAV4 Hybrid", type: "suv", showroom: "mall", price: 36000, condition: 100, statusBonus: 2, reliability: 5, valuationType: "standard", desc: "Best-selling hybrid SUV with exceptional fuel economy." },
    { id: 19, name: "Mazda CX-5 Turbo", type: "suv", showroom: "mall", price: 38000, condition: 100, statusBonus: 2, reliability: 5, valuationType: "standard", desc: "Refined Japanese crossover with upscale interior." },
    { id: 20, name: "Tesla Model 3 EV", type: "ev", showroom: "mall", price: 42000, condition: 100, statusBonus: 3, reliability: 4, valuationType: "standard", desc: "All-electric sedan with autopilot and instant acceleration." },
    { id: 21, name: "Chevrolet Silverado 1500", type: "truck", showroom: "mall", price: 42000, condition: 100, statusBonus: 2, reliability: 4, valuationType: "standard", desc: "V8-powered full-size pickup with heavy towing capacity." },
    { id: 22, name: "Ford Bronco 4x4", type: "suv", showroom: "mall", price: 44000, condition: 100, statusBonus: 3, reliability: 4, valuationType: "standard", desc: "Rugged off-road SUV with removable doors and roof." },
    { id: 23, name: "Ford F-150 XL", type: "truck", showroom: "mall", price: 45500, condition: 100, statusBonus: 2, reliability: 4, valuationType: "standard", desc: "America's top-selling workhorse pickup truck." },
    { id: 24, name: "Audi A4 Quattro", type: "sedan", showroom: "mall", price: 46000, condition: 100, statusBonus: 3, reliability: 4, valuationType: "luxury", desc: "Sleek all-wheel drive German luxury commuter." },
    { id: 25, name: "Tesla Model Y EV", type: "ev", showroom: "mall", price: 48000, condition: 100, statusBonus: 3, reliability: 4, valuationType: "standard", desc: "Spacious electric SUV with long battery range." },
    { id: 26, name: "Ford Mustang GT", type: "coupe", showroom: "mall", price: 48000, condition: 100, statusBonus: 3, reliability: 4, valuationType: "luxury", desc: "Roaring 5.0L V8 American muscle coupe." },
    { id: 27, name: "BMW 3-Series Sedan", type: "sedan", showroom: "mall", price: 49000, condition: 100, statusBonus: 4, reliability: 4, valuationType: "luxury", desc: "German luxury sport sedan with refined handling." },
    { id: 28, name: "Chevrolet Corvette Stingray", type: "sports", showroom: "mall", price: 67000, condition: 100, statusBonus: 5, reliability: 4, valuationType: "luxury", desc: "Mid-engine V8 supercar performance at a fraction of the cost." },
    { id: 29, name: "BMW M4 Competition", type: "sports", showroom: "mall", price: 82000, condition: 100, statusBonus: 6, reliability: 4, valuationType: "luxury", desc: "Aggressive twin-turbo inline-6 Bavarian track weapon." },
    { id: 30, name: "Porsche Macan GTS", type: "luxury_suv", showroom: "mall", price: 86000, condition: 100, statusBonus: 5, reliability: 4, valuationType: "luxury", desc: "High-performance luxury compact SUV with sports car DNA." },

    // --- 3. EXOTIC & LUXURY SHOWROOM ($115,000 - $3,200,000) ---
    { id: 31, name: "Porsche 911 Carrera", type: "sports", showroom: "exotic", price: 115000, condition: 100, statusBonus: 6, reliability: 5, valuationType: "luxury", desc: "Timeless German sports car with rear-engine precision." },
    { id: 32, name: "Mercedes-AMG G 63 SUV", type: "luxury_suv", showroom: "exotic", price: 180000, condition: 100, statusBonus: 8, reliability: 4, valuationType: "luxury", desc: "Iconic twin-turbo V8 luxury box-truck status symbol." },
    { id: 33, name: "Aston Martin DB12", type: "sports", showroom: "exotic", price: 245000, condition: 100, statusBonus: 10, reliability: 4, valuationType: "exotic", desc: "British twin-turbo V8 super tourer with bespoke luxury." },
    { id: 34, name: "Lamborghini Huracán", type: "supercar", showroom: "exotic", price: 255000, condition: 100, statusBonus: 10, reliability: 4, valuationType: "exotic", desc: "Naturally aspirated V10 Italian exotic with aggressive styling." },
    { id: 35, name: "Ferrari Roma", type: "supercar", showroom: "exotic", price: 260000, condition: 100, statusBonus: 10, reliability: 4, valuationType: "exotic", desc: "Elegant front-mid V8 Italian grand tourer." },
    { id: 36, name: "Lamborghini Urus Performante", type: "luxury_suv", showroom: "exotic", price: 270000, condition: 100, statusBonus: 10, reliability: 4, valuationType: "exotic", desc: "657 HP twin-turbo V8 super-SUV with razor-sharp performance." },
    { id: 37, name: "Bentley Continental GT", type: "coupe", showroom: "exotic", price: 285000, condition: 100, statusBonus: 11, reliability: 4, valuationType: "exotic", desc: "Handcrafted grand tourer with effortless twin-turbo power." },
    { id: 38, name: "McLaren 720S", type: "supercar", showroom: "exotic", price: 310000, condition: 100, statusBonus: 11, reliability: 3, valuationType: "exotic", desc: "Dihedral door twin-turbo supercar with rocket acceleration." },
    { id: 39, name: "Rolls-Royce Phantom", type: "luxury_suv", showroom: "exotic", price: 460000, condition: 100, statusBonus: 12, reliability: 4, valuationType: "exotic", desc: "Pinnacle ultra-luxury V12 sedan with starlight headliner." },
    { id: 40, name: "Ferrari SF90 Stradale", type: "supercar", showroom: "exotic", price: 520000, condition: 100, statusBonus: 13, reliability: 4, valuationType: "exotic", desc: "1,000 HP hybrid AWD Italian flagship supercar." },
    { id: 41, name: "Lamborghini Revuelto", type: "hypercar", showroom: "exotic", price: 610000, condition: 100, statusBonus: 13, reliability: 4, valuationType: "exotic", desc: "1,001 HP V12 plug-in hybrid flagship Italian hypercar." },
    { id: 42, name: "Bugatti Chiron Hypercar", type: "hypercar", showroom: "exotic", price: 1800000, condition: 100, statusBonus: 15, reliability: 5, valuationType: "exotic", desc: "Quad-turbo W16 hypercar engineering masterpiece." },
    { id: 43, name: "Pagani Huayra Roadster", type: "hypercar", showroom: "exotic", price: 2500000, condition: 100, statusBonus: 16, reliability: 5, valuationType: "exotic", desc: "Handcrafted Italian carbon-titanium rolling sculpture." },
    { id: 44, name: "Koenigsegg Jesko", type: "hypercar", showroom: "exotic", price: 3200000, condition: 100, statusBonus: 18, reliability: 5, valuationType: "exotic", desc: "1,600 HP Swedish hypercar reaching speeds in excess of 300 MPH." }
];

export function getVehicleIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return VEHICLE_TYPES[key] || VEHICLE_TYPES.default;
}

export function calculateAutoLoan(price, downPaymentPercent = 0.15, termYears = 4) {
    const safePrice = (typeof price === 'number' && Number.isFinite(price) && price > 0) ? price : 0;
    const safeDownPercent = (typeof downPaymentPercent === 'number' && Number.isFinite(downPaymentPercent) && downPaymentPercent >= 0) ? downPaymentPercent : 0.15;
    const safeTermYears = Math.max(1, (typeof termYears === 'number' && Number.isFinite(termYears)) ? termYears : 4);

    const downPayment = Math.floor(safePrice * safeDownPercent);
    const principal = Math.max(0, safePrice - downPayment);
    const annualRate = 0.065; // 6.5% interest rate
    const monthlyRate = annualRate / 12;
    const totalMonths = safeTermYears * 12;

    let monthlyPayment = 0;
    if (principal > 0) {
        monthlyPayment = Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1));
    }

    return {
        price: safePrice,
        downPayment,
        principal,
        termYears: safeTermYears,
        totalMonths,
        monthlyPayment: Number.isFinite(monthlyPayment) ? monthlyPayment : 0,
        annualRate
    };
}

export function calculateTotalAutoLoanMonthlyOutflow(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'vehicle' && asset.loan && asset.loan.remainingBalance > 0) {
            return sum + (asset.loan.monthlyPayment || 0);
        }
        return sum;
    }, 0);
}

export function calculateTradeInValue(vehicle) {
    if (!vehicle || typeof vehicle.value !== 'number' || isNaN(vehicle.value)) {
        return { tradeInValue: 0, loanPayoff: 0, netEquity: 0 };
    }
    const safeValue = Math.max(0, vehicle.value);
    const tradeInValue = Math.max(100, Math.floor(safeValue * 0.80));
    const loanPayoff = (vehicle.loan && typeof vehicle.loan.remainingBalance === 'number' && vehicle.loan.remainingBalance > 0)
        ? Math.round(vehicle.loan.remainingBalance)
        : 0;
    const netEquity = Math.max(0, tradeInValue - loanPayoff);
    return {
        tradeInValue,
        loanPayoff,
        netEquity
    };
}

export function simulateVehicleMarket() {
    const marketForce = (Math.random() * 0.16) - 0.08;
    
    VEHICLES_FOR_SALE.forEach(car => {
        const individualVariance = (Math.random() * 0.04) - 0.02;
        const totalChangePercent = 1 + marketForce + individualVariance;
        
        let newPrice = Math.floor(car.price * totalChangePercent);
        
        if (newPrice > 10000) {
            newPrice = Math.round(newPrice / 100) * 100;
        } else {
            newPrice = Math.round(newPrice / 10) * 10;
        }
        newPrice = Math.max(500, newPrice); 
        car.price = newPrice;
        car.lastChange = totalChangePercent > 1 ? 'up' : 'down';
    });
    return marketForce;
}

export function updateOwnedVehicles(user, marketForce) {
    if (!user.assets || !Array.isArray(user.assets)) return;

    user.assets.forEach(asset => {
        if (asset.category === 'vehicle') {
            if (asset.name && typeof asset.name === 'string' && asset.name.startsWith('New ')) {
                asset.name = asset.name.replace(/^New\s+/i, '');
            }
            if (asset.acquiredAge === undefined) {
                asset.acquiredAge = Math.max(0, (user.age || 0) - 1);
            }
            const ownedYears = Math.max(0, user.age - asset.acquiredAge);

            // Condition decay based on reliability rating (1-5)
            const reliability = asset.reliability || 3;
            const decay = Math.max(1, Math.floor(Math.random() * (6 - reliability)) + 2);
            asset.condition = Math.max(0, asset.condition - decay);

            // Realistic Tier-Based Depreciation / Appreciation:
            const originalPrice = asset.purchasePrice || asset.value || 10000;
            const valType = asset.valuationType || 'standard';

            let newValue = asset.value;

            if (valType === 'exotic') {
                // Exotic & Hypercars:
                // Years 1-3: minor 3-5% drop. Years 4-7: hold value. Years 8+: APPRECIATE (+2-4%/yr) as collector items!
                if (ownedYears <= 3) {
                    newValue = Math.floor(asset.value * 0.96);
                } else if (ownedYears <= 7) {
                    newValue = asset.value; // Retains value
                } else {
                    const appreciation = 1.03; // +3% collector appreciation
                    newValue = Math.floor(asset.value * appreciation);
                }
            } else if (valType === 'luxury') {
                // Luxury & Sports cars:
                // Years 1-5: 6% drop/yr. Years 6+: 3% drop/yr with a 30% value floor of original purchase price.
                if (ownedYears <= 5) {
                    newValue = Math.floor(asset.value * 0.94);
                } else {
                    newValue = Math.floor(asset.value * 0.97);
                }
                const valueFloor = Math.floor(originalPrice * 0.30);
                newValue = Math.max(valueFloor, newValue);
            } else {
                // Standard & Budget cars:
                // Year 1: 12% drop. Years 2-6: 8% drop. Years 7+: 4% drop with a 15% value floor of original price.
                if (ownedYears <= 1) {
                    newValue = Math.floor(asset.value * 0.88);
                } else if (ownedYears <= 6) {
                    newValue = Math.floor(asset.value * 0.92);
                } else {
                    newValue = Math.floor(asset.value * 0.96);
                }
                const valueFloor = asset.condition > 15 ? Math.floor(originalPrice * 0.15) : Math.floor(originalPrice * 0.05);
                newValue = Math.max(valueFloor, newValue);
            }

            if (marketForce) {
                newValue = Math.floor(newValue * (1 + marketForce * 0.3));
            }

            if (asset.condition < 40) {
                newValue = Math.floor(newValue * 0.85);
            }

            asset.value = Math.max(100, newValue);

            // Auto Loan Payments
            if (asset.loan && asset.loan.remainingBalance > 0) {
                const annualRate = asset.loan.annualRate || 0.065;
                const monthlyRate = annualRate / 12;
                let loanPaid = 0;

                for (let month = 0; month < 12; month++) {
                    if (asset.loan.remainingBalance <= 0) break;
                    const interest = asset.loan.remainingBalance * monthlyRate;
                    const payoff = asset.loan.remainingBalance + interest;
                    let payment = asset.loan.monthlyPayment;

                    if (payoff <= payment) {
                        payment = Math.round(payoff);
                        asset.loan.remainingBalance = 0;
                        loanPaid += payment;
                        break;
                    } else {
                        const principal = payment - interest;
                        asset.loan.remainingBalance -= principal;
                        loanPaid += payment;
                    }
                }

                asset.loan.remainingBalance = Math.max(0, Math.round(asset.loan.remainingBalance));
                user.money -= Math.round(loanPaid);

                if (asset.loan.remainingBalance <= 0) {
                    addLog(`Fully paid off your auto loan for ${asset.name}!`, 'good');
                    asset.loan = null;
                }
            }

            // Auto Insurance Policy Fee
            if (asset.insured) {
                if (asset.condition > 0) {
                    const insuranceFee = Math.max(20, Math.floor(asset.value * 0.008));
                    user.money -= insuranceFee;
                } else {
                    asset.insured = false;
                    addLog(`Your insurance policy on the ${asset.name} was canceled because it is totaled (0% condition).`, 'bad');
                }
            }

            // Warnings
            if (asset.condition === 0) {
                addLog(`URGENT: Your ${asset.name} has broken down completely!`, 'bad');
            } else if (asset.condition < 20 && asset.condition + decay >= 20) {
                addLog(`Your ${asset.name} is falling apart (${asset.condition}% condition). Repair it soon!`, 'bad');
            }
        }
    });
}

export const JEWELRY_TYPES = {
    ring: { icon: "fa-ring", color: "text-amber-400" },
    watch: { icon: "fa-clock", color: "text-blue-400" },
    necklace: { icon: "fa-gem", color: "text-pink-400" },
    earrings: { icon: "fa-shield-halved", color: "text-purple-400" },
    bracelet: { icon: "fa-circle-notch", color: "text-emerald-400" },
    tiara: { icon: "fa-crown", color: "text-yellow-300" },
    default: { icon: "fa-gem", color: "text-amber-300" }
};

export function getJewelryIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return JEWELRY_TYPES[key] || JEWELRY_TYPES.default;
}

export const JEWELRY_FOR_SALE = [
    // Rings - Women & Men (Budget to Heirloom)
    { id: "ring_1", name: "Silver Band", type: "ring", category: "jewelry", tier: "budget", price: 150, appreciationRate: 0, desc: "A simple, polished silver band for any occasion." },
    { id: "ring_2", name: "Titanium Men's Band", type: "ring", category: "jewelry", tier: "budget", price: 350, appreciationRate: 0, desc: "Durable, brushed titanium ring designed for men." },
    { id: "ring_3", name: "14K Gold Band", type: "ring", category: "jewelry", tier: "fine", price: 1200, appreciationRate: 0.01, desc: "Classic solid 14K yellow gold band." },
    { id: "ring_4", name: "Men's Heavy Gold Ring", type: "ring", category: "jewelry", tier: "fine", price: 2500, appreciationRate: 0.01, desc: "Substantial 18K gold signet ring for men." },
    { id: "ring_5", name: "Classic Diamond Engagement Ring", type: "ring", category: "jewelry", tier: "fine", price: 5000, appreciationRate: 0.02, desc: "Stunning solitaire diamond set in platinum." },
    { id: "ring_6", name: "Platinum Diamond Wedding Ring", type: "ring", category: "jewelry", tier: "luxury", price: 12000, appreciationRate: 0.02, desc: "Pavé diamond wedding band in high-grade platinum." },
    { id: "ring_7", name: "Emerald Cut Solitaire Ring", type: "ring", category: "jewelry", tier: "luxury", price: 25000, appreciationRate: 0.03, desc: "Flawless 3-carat emerald cut diamond." },
    { id: "ring_8", name: "Royal Crown Diamond Ring", type: "ring", category: "jewelry", tier: "heirloom", price: 75000, appreciationRate: 0.04, desc: "Rare pink diamond ring fit for royalty." },

    // Luxury Watches
    { id: "watch_1", name: "Stainless Steel Watch", type: "watch", category: "jewelry", tier: "budget", price: 400, appreciationRate: 0, desc: "Reliable daily quartz timepiece." },
    { id: "watch_2", name: "Designer Automatic Watch", type: "watch", category: "jewelry", tier: "fine", price: 3500, appreciationRate: 0.01, desc: "Swiss-made automatic mechanical watch." },
    { id: "watch_3", name: "Vintage Rolex Submariner", type: "watch", category: "jewelry", tier: "luxury", price: 28000, appreciationRate: 0.03, desc: "Iconic collector luxury watch that retains value." },
    { id: "watch_4", name: "Patek Philippe Grand Complication", type: "watch", category: "jewelry", tier: "heirloom", price: 95000, appreciationRate: 0.04, desc: "Masterpiece horology timepiece with perpetual calendar." },
    { id: "watch_5", name: "Richard Mille Tourbillon", type: "watch", category: "jewelry", tier: "heirloom", price: 350000, appreciationRate: 0.05, desc: "Ultra-rare titanium & sapphire crystal masterpiece." },

    // Fine Necklaces, Earrings & Accessories
    { id: "acc_1", name: "Pearl Earrings", type: "earrings", category: "jewelry", tier: "budget", price: 750, appreciationRate: 0, desc: "Freshwater cultured pearl drop earrings." },
    { id: "acc_2", name: "14K Gold Chain", type: "necklace", category: "jewelry", tier: "fine", price: 2200, appreciationRate: 0.01, desc: "Solid Cuban link 14K gold chain." },
    { id: "acc_3", name: "Platinum Diamond Bracelet", type: "bracelet", category: "jewelry", tier: "luxury", price: 45000, appreciationRate: 0.02, desc: "Tennis bracelet with 10 carats of VVS diamonds." },
    { id: "acc_4", name: "Royal Sapphire Tiara", type: "tiara", category: "jewelry", tier: "heirloom", price: 250000, appreciationRate: 0.04, desc: "Historical Burmese sapphire and diamond tiara." },
    { id: "acc_5", name: "Imperial Diamond Necklace", type: "necklace", category: "jewelry", tier: "heirloom", price: 600000, appreciationRate: 0.05, desc: "One-of-a-kind 50-carat yellow diamond necklace." }
];

export function updateOwnedJewelry(user) {
    if (!user || !Array.isArray(user.assets)) return { totalInsurancePaid: 0, totalAppreciation: 0 };

    let totalInsurancePaid = 0;
    let totalAppreciation = 0;

    user.assets.forEach(asset => {
        if (asset.category === 'jewelry') {
            const rate = asset.appreciationRate || 0;
            if (rate > 0) {
                const increase = Math.floor(asset.value * rate);
                asset.value += increase;
                totalAppreciation += increase;
            }

            if (asset.insured) {
                const insuranceFee = Math.max(10, Math.floor(asset.value * 0.005));
                user.money -= insuranceFee;
                totalInsurancePaid += insuranceFee;
            }
        }
    });

    return { totalInsurancePaid, totalAppreciation };
}
