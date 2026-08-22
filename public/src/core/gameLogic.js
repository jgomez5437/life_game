import { state, addLog } from './state.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../ui/utils.js';
import { AvatarLogic } from './avatarLogic.js';
import { HQ_TIERS, BUSINESS_INDUSTRIES, VC_INVESTOR_TYPES } from '../features/business/businessTypes.js';

function sanitizeName(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
        return { isValid: false, error: "Name cannot be empty." };
    }

    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');
    const nameParts = cleanedName.split(' ');

    if (nameParts.length < 2) {
        return { isValid: false, error: "You must enter both a first and last name." };
    }

    if (cleanedName.length > 25) {
        return { isValid: false, error: "Keep the name to 25 characters or less." };
    }

    const validFormatRegex = /^[A-Za-z]+(?:[- ][A-Za-z]+)*$/;

    if (!validFormatRegex.test(cleanedName)) {
        return { isValid: false, error: "Name can only contain letters, spaces, and single hyphens. Cannot start or end with a hyphen." };
    }

    return { isValid: true, cleanedName };
}

function sanitizeBusinessName(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
        return { isValid: false, error: "Company name cannot be empty." };
    }

    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');

    if (cleanedName.length < 2) {
        return { isValid: false, error: "Company name must be at least 2 characters long." };
    }

    if (cleanedName.length > 35) {
        return { isValid: false, error: "Keep the company name to 35 characters or less." };
    }

    const validFormatRegex = /^[A-Za-z0-9][A-Za-z0-9 .,'&,-]*$/;

    if (!validFormatRegex.test(cleanedName)) {
        return { isValid: false, error: "Company name can only contain letters, numbers, spaces, and standard punctuation (., &, -, ')." };
    }

    return { isValid: true, cleanedName };
}

function clampStat(val, fallback = 50) {
    const num = typeof val === 'number' && !isNaN(val) ? val : fallback;
    return Math.max(0, Math.min(100, num));
}

export function isAlive(user) {
    if (!user) return false;
    if (user.lifeStatus === 'Deceased' || user.isDead === true || user.isAlive === false) return false;
    if (user.deathCause !== undefined || user.deathAge !== undefined) return false;
    const health = user.health ?? user.stats?.health ?? 100;
    return typeof health === 'number' && !isNaN(health) && health > 0;
}

function generateRandomStats() {
    return {
        health: 100,
        happiness: 100,
        smarts: Math.floor(Math.random() * 56) + 40,
        looks: Math.floor(Math.random() * 56) + 40
    };
}

function calculateSmartsDelta(age, isStudent) {
    if (isStudent && age <= 18) {
        return Math.floor(Math.random() * 3) + 1;
    }
    return 0;
}

function calculateLooksDelta(age) {
    if (age > 45) {
        return Math.random() < 0.6 ? -(Math.floor(Math.random() * 2) + 1) : 0;
    }
    return 0;
}

const CITY_COST_OF_LIVING = {
    'San Francisco': 33000,
    'New York': 30000,
    'Los Angeles': 30000,
    'Chicago': 27000,
    'Houston': 18000,
    'Miami': 24000,
    'Tucson': 18000,
    'London': 30000,
    'Manchester': 24000,
    'Edinburgh': 24000,
    'Tokyo': 30000,
    'Osaka': 24000,
    'Kyoto': 22000,
    'Berlin': 21000,
    'Munich': 25000,
    'Frankfurt': 25000,
    'Paris': 30000,
    'Lyon': 22000,
    'Marseille': 21000,
    'Madrid': 21000,
    'Barcelona': 23000,
    'Rome': 24000,
    'Milan': 26000,
    'Venice': 23000,
    'Toronto': 24000,
    'Vancouver': 26000,
    'Montreal': 21000,
    'Mexico City': 15000,
    'Guadalajara': 14000,
    'Beijing': 21000,
    'Shanghai': 24000,
    'Shenzhen': 23000,
    'Seoul': 25000,
    'Busan': 20000,
    'Sydney': 28000,
    'Melbourne': 26000,
    'Brisbane': 23000,
    'Mumbai': 14000,
    'New Delhi': 14000,
    'Bengaluru': 15000,
    'Rio de Janeiro': 16000,
    'São Paulo': 17000,
    'Cape Town': 16000,
    'Johannesburg': 15000,
    'Dubai': 30000,
    'Abu Dhabi': 28000,
    'Singapore': 32000,
    'Stockholm': 26000,
    'Bandar Seri Begawan': 15000,
    'Cairo': 15000,
    'Buenos Aires': 14000
};

function addLivingExpenses(age, currentlyStudent, city) {
    if (age >= 19 && !currentlyStudent) {
        return CITY_COST_OF_LIVING[city] || 24000;
    }
    return 0;
}

function getCityCostMultiplier(city) {
    const livingCost = CITY_COST_OF_LIVING[city] || 24000;
    return livingCost / 24000;
}

function calculateScaledSalary(baseSalary, city) {
    if (!baseSalary || typeof baseSalary !== 'number') return 0;
    const mult = getCityCostMultiplier(city);
    return Math.round(baseSalary * mult);
}

function calculateBirthdayMoney() {
    return Math.floor(Math.random() * 71) + 10;
}

function addStudentLoanPayment(age, studentLoanAmount, isStudent) {
        if (age >= 18 && studentLoanAmount > 0 && !isStudent) {
            return Math.min(2400, studentLoanAmount);
        }
        return 0;
};

function checkSchoolGraduated(currentSchoolYear, enrolledSchoolYears) {
    return currentSchoolYear >= enrolledSchoolYears;
}

function checkLifeStatus(user) {
    if (user.inPrison) {
        return user.facilityName ? `Inmate (${user.facilityName})` : "Inmate";
    } else if (user.gradSchoolEnrolled) {
       return `${user.gradSchoolType} Student`;
    } else if (user.universityEnrolled) {
       return "University Student";
    } else if (user.hasBusiness) {
       return "CEO & Founder";
    } else if (user.jobTitle) {
       return user.jobTitle;
    } else if (user.gradSchoolDegree) {
       return `${user.gradSchoolDegree} Graduate`;
    } else if (user.universityGraduated) {
       return "University Graduate";
    } else if (user.highSchoolGraduated) {
       return "High School Graduate";
    } else if (user.age > 17 && user.highSchoolRetained) {
       return "Student (Retaking)";
    } else if (user.age > 17 && !user.jobTitle) {
       return "Unemployed";
    } else if (user.age === 0) {
       return "Baby";
    } else if (user.age < 5) {
       return "Toddler";
    } else if (user.age < 18 && !user.highSchoolGraduated) {
       return "Student";
    } else if (user.age < 18 && user.highSchoolGraduated) {
       return "High School Graduate";
    }
}

const VEHICLE_TYPES = {
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

const VEHICLES_FOR_SALE = [
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

function getVehicleIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return VEHICLE_TYPES[key] || VEHICLE_TYPES.default;
}

function calculateAutoLoan(price, downPaymentPercent = 0.15, termYears = 4) {
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

function calculateTotalAutoLoanMonthlyOutflow(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'vehicle' && asset.loan && asset.loan.remainingBalance > 0) {
            return sum + (asset.loan.monthlyPayment || 0);
        }
        return sum;
    }, 0);
}

function calculateTradeInValue(vehicle) {
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

function simulateVehicleMarket() {
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

function updateOwnedVehicles(user, marketForce) {
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
                const insuranceFee = Math.max(20, Math.floor(asset.value * 0.008));
                user.money -= insuranceFee;
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

const MORTALITY_RATES = [
    { maxAge: 0, rate: 0.005, causes: ["complications at birth.", "SIDS."] },
    { maxAge: 15, rate: 0.0001, causes: ["a tragic childhood accident.", "a rare illness."] },
    { maxAge: 25, rate: 0.001, causes: ["a fatal car crash.", "a reckless accident."] },
    { maxAge: 50, rate: 0.002, causes: ["an unforeseen medical emergency.", "a workplace accident."] },
    { maxAge: 70, rate: 0.01, causes: ["a sudden heart attack.", "cancer."] },
    { maxAge: 90, rate: 0.05, causes: ["a stroke.", "natural causes."] },
    { maxAge: 110, rate: 0.15, causes: ["old age.", "organ failure."] },
    { maxAge: Infinity, rate: 1.0, causes: ["extreme old age."] }
];
function checkMortality(age, health = 100) {
    const bracket = MORTALITY_RATES.find(b => age <= b.maxAge);
    let chance = bracket.rate;

    // Health Modifier: Scales risk up to 300% if health is critically low (< 30)
    if (health < 30) {
        const penaltyMultiplier = 1 + ((30 - Math.max(0, health)) / 10);
        chance *= penaltyMultiplier;
    }

    if (Math.random() < chance) {
        const cause = bracket.causes[Math.floor(Math.random() * bracket.causes.length)];
        return { isDead: true, cause };
    }
    
    return { isDead: false };
}



/**
 * Calculates base biological health decay per year.
 * @param {number} age - Current player age.
 * @param {number} [roll=Math.random()] - Injected randomness for pure unit testing (0.0 to 0.999).
 * @returns {number} Health points to deduct.
 */
function calculateHealthDecay(age, roll = Math.random()) {
    if (age <= 18) {
        return roll < 0.10 ? 1 : 0;
    } else if (age <= 30) {
        return roll < 0.30 ? 1 : 0;
    } else if (age <= 50) {
        // 20% chance for 2 decay, 80% chance for 1 decay
        return roll < 0.20 ? 2 : 1;
    } else if (age <= 70) {
        // Uniform distribution: 1, 2, or 3
        return Math.floor(roll * 3) + 1; 
    } else {
        // Extreme Old Age: 2, 3, or 4
        return Math.floor(roll * 3) + 2; 
    }
}


/**
 * Calculates active health improvements from gym and diet.
 * @param {boolean} hasGym - Whether user has active gym membership.
 * @param {boolean} hasDiet - Whether user has better diet.
 * @returns {number} Health points to offset decay.
 */
const DIET_PLANS = {
    junk: {
        id: 'junk',
        name: 'Fast Food & Junk Food',
        monthlyCost: 0,
        annualCost: 0,
        healthDecayMod: 1.25,
        happinessBonus: 0,
        desc: 'Processed food, takeout, and soda. Cheap, but catches up to your health.'
    },
    balanced: {
        id: 'balanced',
        name: 'Balanced Home-Cooked Diet',
        monthlyCost: 150,
        annualCost: 1800,
        healthDecayMod: 0.90,
        happinessBonus: 1,
        desc: 'Well-rounded meals with fresh veggies, lean meats, and whole grains.'
    },
    organic: {
        id: 'organic',
        name: 'Mediterranean & Organic Diet',
        monthlyCost: 450,
        annualCost: 5400,
        healthDecayMod: 0.75,
        happinessBonus: 2,
        desc: 'Rich in olive oil, fresh seafood, nuts, and organic produce.'
    },
    keto: {
        id: 'keto',
        name: 'Keto & Fitness Diet',
        monthlyCost: 650,
        annualCost: 7800,
        healthDecayMod: 0.80,
        gymBonus: 1.20,
        happinessBonus: 2,
        desc: 'Low-carb, high-protein meal prep designed to maximize physical fitness.'
    },
    gourmet: {
        id: 'gourmet',
        name: 'Personal Chef Gourmet Diet',
        monthlyCost: 2500,
        annualCost: 30000,
        healthDecayMod: 0.50,
        happinessBonus: 4,
        desc: 'Custom farm-to-table meals prepared daily by your private chef.'
    }
};

function getDietPlan(dietId) {
    return DIET_PLANS[dietId] || DIET_PLANS.junk;
}

const BASE_MEGA_JACKPOT = 20000000; // $20 Million base jackpot

function getMegaJackpotAmount(user) {
    if (!user || typeof user.megaJackpotAmount !== 'number') return BASE_MEGA_JACKPOT;
    return user.megaJackpotAmount;
}

function rollOverMegaJackpot(user) {
    if (!user) return BASE_MEGA_JACKPOT;
    const current = getMegaJackpotAmount(user);
    // Increases by $5M to $25M each year until won
    const growth = (Math.floor(Math.random() * 21) + 5) * 1000000;
    user.megaJackpotAmount = current + growth;
    return user.megaJackpotAmount;
}

const LOTTERY_TYPES = {
    scratch: {
        id: 'scratch',
        name: 'Quick Cash Scratch-Off',
        price: 5,
        icon: 'fa-ticket-alt',
        color: 'text-amber-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.65, payout: 0, title: 'Sorry! Better luck next time.' },
            { minRoll: 0.65, maxRoll: 0.85, payout: 10, title: 'Winner! Won $10 ($5 Profit)' },
            { minRoll: 0.85, maxRoll: 0.95, payout: 25, title: 'Winner! Won $25!' },
            { minRoll: 0.95, maxRoll: 0.995, payout: 100, title: 'Big Winner! Won $100!' },
            { minRoll: 0.995, maxRoll: 1.00, payout: 500, title: 'JACKPOT! Won $500 Top Prize!' }
        ]
    },
    daily: {
        id: 'daily',
        name: 'State Daily Draw',
        price: 20,
        icon: 'fa-star',
        color: 'text-cyan-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.70, payout: 0, title: 'No matching numbers.' },
            { minRoll: 0.70, maxRoll: 0.88, payout: 50, title: 'Matched 2 numbers! Won $50!' },
            { minRoll: 0.88, maxRoll: 0.97, payout: 200, title: 'Matched 3 numbers! Won $200!' },
            { minRoll: 0.97, maxRoll: 0.996, payout: 1000, title: 'Matched 4 numbers! Won $1,000!' },
            { minRoll: 0.996, maxRoll: 1.00, payout: 10000, title: 'GRAND PRIZE! Matched all 5 numbers for $10,000!' }
        ]
    },
    mega: {
        id: 'mega',
        name: 'Mega Powerball Jackpot',
        price: 100,
        icon: 'fa-bolt',
        color: 'text-purple-400',
        prizes: [
            { minRoll: 0.00, maxRoll: 0.75, payout: 0, title: 'No winning combination.' },
            { minRoll: 0.75, maxRoll: 0.92, payout: 250, title: 'Matched Powerball! Won $250!' },
            { minRoll: 0.92, maxRoll: 0.985, payout: 1500, title: 'Matched 3 + Powerball! Won $1,500!' },
            { minRoll: 0.985, maxRoll: 0.998, payout: 15000, title: 'Matched 4 + Powerball! Won $15,000!' },
            { minRoll: 0.998, maxRoll: 1.00, payout: 20000000, title: 'MEGA JACKPOT! Won GRAND PRIZE!' }
        ]
    }
};

function playLotteryTicket(ticketTypeId, user) {
    if (!user) return { success: false, message: 'Invalid user state.' };
    if (!isAlive(user)) return { success: false, message: 'Cannot perform actions while dead or at 0 HP.' };

    if (typeof user.age === 'number' && user.age < 18) {
        return { success: false, message: 'You must be at least 18 years old to play the lottery.' };
    }

    const type = LOTTERY_TYPES[ticketTypeId] || LOTTERY_TYPES.scratch;
    const boughtCount = user.lotteryTicketsBoughtThisYear || 0;

    if (boughtCount >= 10) {
        return { success: false, message: 'You have reached the annual limit of 10 lottery tickets! Age up to buy more.' };
    }

    if (user.money < type.price) {
        return { success: false, message: `Insufficient funds. A ${type.name} ticket costs $${type.price}.` };
    }

    user.money -= type.price;
    user.lotteryTicketsBoughtThisYear = boughtCount + 1;

    const roll = Math.random();
    const prize = type.prizes.find(p => roll >= p.minRoll && roll < p.maxRoll) || type.prizes[0];

    let actualPayout = prize.payout;
    let actualTitle = prize.title;

    if (ticketTypeId === 'mega' && prize.payout > 0 && prize.minRoll >= 0.998) {
        actualPayout = getMegaJackpotAmount(user);
        actualTitle = `MEGA POWERBALL JACKPOT! Won $${actualPayout.toLocaleString()} GRAND PRIZE!`;
        user.megaJackpotAmount = BASE_MEGA_JACKPOT; // Reset to $20M base!
    }

    if (actualPayout > 0) {
        user.money += actualPayout;
    }

    return {
        success: true,
        payout: actualPayout,
        title: actualTitle,
        ticketName: type.name,
        ticketsRemaining: 10 - user.lotteryTicketsBoughtThisYear,
        roll
    };
}

function generateLifeSuggestions(user) {
    if (!user) return [];

    const suggestions = [];

    // 1. Health & Diet
    if (user.health < 40) {
        suggestions.push({
            category: 'Health Alert',
            icon: 'fa-heart-crack text-red-400',
            title: 'Critical Health Warning',
            desc: `Your health is at ${user.health}%. Visit the doctor immediately or upgrade your diet to prevent sudden life complications.`
        });
    } else if (user.health < 75) {
        suggestions.push({
            category: 'Health & Wellness',
            icon: 'fa-apple-alt text-green-400',
            title: 'Upgrade Your Diet & Fitness',
            desc: 'Starting a Mediterranean or Keto diet along with regular gym workouts will boost your longevity.'
        });
    } else {
        suggestions.push({
            category: 'Health & Fitness',
            icon: 'fa-dumbbell text-emerald-400',
            title: 'Peak Physical Condition',
            desc: 'Your health is in top shape! Maintain your current routine to preserve maximum energy.'
        });
    }

    // 2. Career & Education
    if (!user.jobTitle && user.age >= 18 && !user.isStudent) {
        suggestions.push({
            category: 'Career Aspiration',
            icon: 'fa-briefcase text-amber-400',
            title: 'Seek Employment',
            desc: 'You are currently unemployed. Visit the Occupations tab to apply for a job or enroll in University.'
        });
    } else if (user.jobPerformance >= 80) {
        suggestions.push({
            category: 'Career Growth',
            icon: 'fa-chart-line text-blue-400',
            title: 'High Work Performance',
            desc: `Your performance at ${user.jobTitle || 'work'} is outstanding (${user.jobPerformance}%). Keep it up for annual raises and promotion opportunities.`
        });
    } else if (user.jobPerformance < 40 && user.jobTitle) {
        suggestions.push({
            category: 'Work Warning',
            icon: 'fa-triangle-exclamation text-yellow-400',
            title: 'Workplace Risk',
            desc: `Your job performance is low (${user.jobPerformance}%). Work harder or spend time developing career skills to avoid being fired.`
        });
    } else {
        suggestions.push({
            category: 'Personal Development',
            icon: 'fa-graduation-cap text-indigo-400',
            title: 'Continuous Learning',
            desc: 'Enhance your skills or take night classes to qualify for higher-paying executive roles.'
        });
    }

    // 3. Financial & Wealth
    if (user.money > 50000) {
        suggestions.push({
            category: 'Wealth & Assets',
            icon: 'fa-building text-cyan-400',
            title: 'Invest Surplus Capital',
            desc: 'You have significant cash savings! Consider purchasing rental properties, luxury vehicles, or fine jewelry.'
        });
    } else if (user.money < 1000 && user.age >= 18) {
        suggestions.push({
            category: 'Financial Advice',
            icon: 'fa-piggy-bank text-rose-400',
            title: 'Build an Emergency Fund',
            desc: 'Your cash balance is low. Reduce unnecessary luxury expenses and focus on building liquid savings.'
        });
    } else {
        suggestions.push({
            category: 'Financial Planning',
            icon: 'fa-wallet text-teal-400',
            title: 'Balanced Budgeting',
            desc: 'Monitor your monthly outflows (mortgages, loans, gym, and diet costs) to maintain a healthy savings rate.'
        });
    }

    // 4. Social & Relationships
    const relationships = user.relationships || [];
    const spouse = relationships.find(r => r.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(r.type));
    const fiancé = relationships.find(r => ['Fiancé', 'Fiancée', 'Fiance'].includes(r.type));
    const partner = relationships.find(r => r.category === 'partner' && !['Fiancé', 'Fiancée', 'Fiance'].includes(r.type));

    if (spouse) {
        const hasChildren = relationships.some(r => r.category === 'child' || r.type === 'Son' || r.type === 'Daughter');
        if (!hasChildren && !user.isExpecting && user.age >= 18 && user.age < 45) {
            suggestions.push({
                category: 'Romance & Family',
                icon: 'fa-baby text-pink-400',
                title: 'Start a Family',
                desc: `You are married to ${spouse.name}. Select 'Try for a Baby' on their profile in Social to start a family.`
            });
        } else {
            suggestions.push({
                category: 'Romance & Family',
                icon: 'fa-heart text-pink-400',
                title: 'Nurture Your Marriage',
                desc: `Spend quality time or go on dates with your spouse ${spouse.name} to keep your bond strong.`
            });
        }
    } else if (fiancé) {
        suggestions.push({
            category: 'Romance & Family',
            icon: 'fa-ring text-pink-400',
            title: 'Plan Your Wedding',
            desc: `You are engaged to ${fiancé.name}! Tap 'Plan Wedding' on their profile in Social to get married.`
        });
    } else if (partner && partner.status >= 70) {
        suggestions.push({
            category: 'Romance & Future',
            icon: 'fa-ring text-yellow-400',
            title: `Take Next Step with ${partner.name}`,
            desc: `Your relationship with ${partner.name} is exceptional (${partner.status}%). Consider buying an engagement ring and proposing!`
        });
    } else if (!partner && user.age >= 18) {
        suggestions.push({
            category: 'Social Life',
            icon: 'fa-users text-purple-400',
            title: 'Expand Social Network',
            desc: 'Go out to meet new people or spend time with friends to boost your happiness stat.'
        });
    } else {
        suggestions.push({
            category: 'Relationships',
            icon: 'fa-handshake text-orange-400',
            title: 'Nurture Connections',
            desc: 'Regularly interact with family members and close friends to keep relationship meters at 100%.'
        });
    }

    return suggestions;
}

function calculateHealthBenefits(hasGym, hasDiet) {
    let benefit = 0;
    if (hasGym) benefit += 1;
    if (hasDiet) benefit += 1;
    return benefit;
}

function calculateActiveHealthCosts(hasGymArg, dietArg) {
    let cost = 0;
    let hasGym = false;
    let dietKey = 'junk';

    if (typeof hasGymArg === 'object' && hasGymArg !== null) {
        const u = hasGymArg;
        hasGym = Boolean(u.gymMembership);
        dietKey = u.diet || (u.hasBetterDiet ? 'balanced' : 'junk');
    } else {
        hasGym = Boolean(hasGymArg);
        if (typeof dietArg === 'string') {
            dietKey = dietArg;
        } else if (dietArg === true) {
            cost += 2400; // Legacy test support: hasDiet = true -> $200/mo * 12
            if (hasGym) cost += 600;
            return cost;
        }
    }

    if (hasGym) cost += 600;

    const diet = getDietPlan(dietKey);
    cost += (diet.monthlyCost * 12);

    return cost;
}

/**
 * Calculates monthly outflow for children under age 21.
 * Each child under 21 adds $500 per month. Once a child reaches 21, the amount is removed.
 * @param {Array} relationships - Array of user relationships.
 * @returns {number} Monthly outflow in dollars.
 */
function calculateChildMonthlyOutflow(relationships) {
    if (!relationships || !Array.isArray(relationships)) return 0;
    const childrenUnder21 = relationships.filter(r => 
        (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') && typeof r.age === 'number' && r.age < 21
    );
    return childrenUnder21.length * 500;
}

/**
 * Returns the immediate health boost and cost for a medical checkup.
 * @returns {object} { boost, cost }
 */
function calculateMedicalVisit() {
    return { boost: 10, cost: 1000 };
}

/**
 * Returns the immediate health boost and cost for a one-time gym visit.
 * @returns {object} { boost, cost }
 */
function calculateOneTimeGymVisit() {
    return { boost: 1, cost: 20 };
}

/**
 * @returns {Array} A shuffled 52-card deck
 */
function getDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * @param {Array} hand - Array of card objects
 * @returns {number} The best value of the blackjack hand
 */
function calculateBlackjackHand(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else if (card.value === 'A') {
            aces += 1;
            value += 11;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }
    return value;
}

/**
 * @param {Array} playerHand 
 * @param {Array} dealerHand 
 * @returns {string} 'win', 'lose', 'push', or 'bust'
 */
function determineBlackjackOutcome(playerHand, dealerHand) {
    const playerTotal = calculateBlackjackHand(playerHand);
    const dealerTotal = calculateBlackjackHand(dealerHand);
    
    if (playerTotal > 21) return 'bust';
    if (dealerTotal > 21) return 'win'; // dealer busts
    if (playerTotal === dealerTotal) return 'push';
    if (playerTotal > dealerTotal) return 'win';
    return 'lose';
}

const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

/**
 * Simulates a European Roulette wheel spin and evaluates the bet outcome.
 * @param {Object} user - User state object
 * @param {string} betType - 'color' | 'parity' | 'range' | 'number'
 * @param {string|number} betTarget - 'red'/'black', 'even'/'odd', 'low'/'high', or specific number (0-36)
 * @param {number} betAmount - Amount wagered
 * @param {number} [injectedNumber=null] - Optional forced roll for unit tests
 * @returns {Object} { success, winningNumber, winningColor, isWin, multiplier, payout, netProfit, msg }
 */
function playRoulette(user, betType, betTarget, betAmount, injectedNumber = null) {
    if (!isAlive(user)) {
        return { success: false, winningNumber: 0, winningColor: 'none', isWin: false, multiplier: 0, payout: 0, netProfit: 0, msg: 'Cannot gamble while dead or at 0 HP.' };
    }
    const wager = Math.floor(Number(betAmount) || 0);
    if (wager <= 0) {
        return { success: false, msg: 'Please enter a valid bet amount.' };
    }
    if (user.money < wager) {
        return { success: false, msg: `Insufficient funds. You need ${Utils.formatMoney(wager)} to place this bet.` };
    }

    const winningNumber = (injectedNumber !== null && typeof injectedNumber === 'number')
        ? injectedNumber
        : Math.floor(Math.random() * 37);

    let winningColor = 'green';
    if (winningNumber !== 0) {
        winningColor = ROULETTE_RED_NUMBERS.includes(winningNumber) ? 'red' : 'black';
    }

    let isWin = false;
    let multiplier = 0;

    if (betType === 'color') {
        if (betTarget === winningColor) {
            isWin = true;
            multiplier = 1;
        }
    } else if (betType === 'parity') {
        if (winningNumber !== 0) {
            const isEven = winningNumber % 2 === 0;
            if ((betTarget === 'even' && isEven) || (betTarget === 'odd' && !isEven)) {
                isWin = true;
                multiplier = 1;
            }
        }
    } else if (betType === 'range') {
        if (winningNumber !== 0) {
            const isLow = winningNumber >= 1 && winningNumber <= 18;
            if ((betTarget === 'low' && isLow) || (betTarget === 'high' && !isLow)) {
                isWin = true;
                multiplier = 1;
            }
        }
    } else if (betType === 'number') {
        const targetNum = parseInt(betTarget, 10);
        if (targetNum === winningNumber) {
            isWin = true;
            multiplier = 35;
        }
    }

    if (isWin) {
        const netProfit = wager * multiplier;
        const totalPayout = wager + netProfit;
        user.money += netProfit;
        return {
            success: true,
            winningNumber,
            winningColor,
            isWin: true,
            multiplier,
            payout: totalPayout,
            netProfit,
            msg: `Winning number ${winningNumber} (${winningColor.toUpperCase()})! Won ${Utils.formatMoney(totalPayout)}!`
        };
    } else {
        user.money -= wager;
        return {
            success: true,
            winningNumber,
            winningColor,
            isWin: false,
            multiplier: 0,
            payout: 0,
            netProfit: -wager,
            msg: `Landed on ${winningNumber} (${winningColor.toUpperCase()}). Lost ${Utils.formatMoney(wager)}.`
        };
    }
}

const SLOT_SYMBOLS = [
    { icon: '💎', name: 'Diamond', weight: 6, payout3: 50, payout2: 5 },
    { icon: '7️⃣', name: 'Seven', weight: 10, payout3: 15, payout2: 0 },
    { icon: '🔔', name: 'Bell', weight: 16, payout3: 8, payout2: 0 },
    { icon: '🍒', name: 'Cherry', weight: 22, payout3: 4, payout2: 1.5 },
    { icon: '🍋', name: 'Lemon', weight: 23, payout3: 2, payout2: 0 },
    { icon: '🍇', name: 'Grape', weight: 23, payout3: 1.5, payout2: 0 }
];

function getRandomSlotSymbol() {
    const totalWeight = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of SLOT_SYMBOLS) {
        if (rand < sym.weight) return sym;
        rand -= sym.weight;
    }
    return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

/**
 * Simulates a 3-reel high-roller slot machine spin.
 * @param {Object} user 
 * @param {number} betAmount 
 * @param {Array} [injectedReels=null] - Optional forced reels array e.g. [symObj, symObj, symObj]
 * @returns {Object} { success, reels, isWin, isJackpot, multiplier, totalPayout, netProfit, msg }
 */
function spinSlotMachine(user, betAmount, injectedReels = null) {
    if (!isAlive(user)) {
        return { success: false, reels: [], isWin: false, isJackpot: false, multiplier: 0, totalPayout: 0, netProfit: 0, msg: 'Cannot gamble while dead or at 0 HP.' };
    }
    const wager = Math.floor(Number(betAmount) || 0);
    if (wager <= 0) {
        return { success: false, msg: 'Please select a valid bet amount.' };
    }
    if (user.money < wager) {
        return { success: false, msg: `Insufficient funds. You need ${Utils.formatMoney(wager)} to spin.` };
    }

    const reels = injectedReels || [
        getRandomSlotSymbol(),
        getRandomSlotSymbol(),
        getRandomSlotSymbol()
    ];

    const [r1, r2, r3] = reels;
    let multiplier = 0;
    let isJackpot = false;

    if (r1.name === r2.name && r2.name === r3.name) {
        if (r1.name === 'Diamond') {
            multiplier = 50;
            isJackpot = true;
        } else {
            multiplier = r1.payout3;
        }
    } else {
        const diamondCount = reels.filter(r => r.name === 'Diamond').length;
        const cherryCount = reels.filter(r => r.name === 'Cherry').length;

        if (diamondCount === 2) {
            multiplier = 5;
        } else if (cherryCount === 2) {
            multiplier = 1.5;
        } else if (diamondCount === 1) {
            multiplier = 1;
        } else {
            multiplier = 0;
        }
    }

    const isWin = multiplier > 0;
    if (isWin) {
        const totalPayout = Math.floor(wager * multiplier);
        const netProfit = totalPayout - wager;
        user.money += netProfit;
        return {
            success: true,
            reels,
            isWin: true,
            isJackpot,
            multiplier,
            totalPayout,
            netProfit,
            msg: isJackpot 
                ? `🎰 MEGA JACKPOT! 3 Diamonds! Won ${Utils.formatMoney(totalPayout)}! (50x)`
                : `Matched ${reels.map(r => r.icon).join(' ')}! Won ${Utils.formatMoney(totalPayout)}!`
        };
    } else {
        user.money -= wager;
        return {
            success: true,
            reels,
            isWin: false,
            isJackpot: false,
            multiplier: 0,
            totalPayout: 0,
            netProfit: -wager,
            msg: `Spun ${reels.map(r => r.icon).join(' ')}. No match! Lost ${Utils.formatMoney(wager)}.`
        };
    }
}

/**
 * Calculates outcome of a vacation
 * @param {number} tier - 1 (Local), 2 (Cross-Country), 3 (Luxury)
 * @param {number} [roll=Math.random()] - Injectable random roll
 */
function calculateTripOutcome(tier, roll = Math.random()) {
    let baseHealthBoost = 0;
    let baseCost = 0;
    let tripName = "";

    if (tier === 1) {
        baseCost = 500;
        baseHealthBoost = 5;
        tripName = "Local Getaway";
    } else if (tier === 2) {
        baseCost = 2000;
        baseHealthBoost = 10;
        tripName = "Cross-Country Trip";
    } else if (tier === 3) {
        baseCost = 10000;
        baseHealthBoost = 15;
        tripName = "Luxury International Tour";
    }

    const events = [
        { msg: "You had a perfectly relaxing trip.", healthMod: 0, moneyMod: 0 },
        { msg: "You found a hidden gem and felt completely revitalized!", healthMod: 5, moneyMod: 0 },
        { msg: "You were attacked on vacation.", healthMod: -20, moneyMod: 0 },
        { msg: "You got food poisoning from a shady restaurant.", healthMod: -5, moneyMod: 0 },
        { msg: "You lost your wallet at the beach.", healthMod: 0, moneyMod: -200 },
        { msg: "You won a local contest and got some cash!", healthMod: 0, moneyMod: 300 },
        { msg: "Your luggage was lost, ruining your mood.", healthMod: -2, moneyMod: 0 },
        { msg: "You met a fantastic new friend who showed you around.", healthMod: 3, moneyMod: 0 }
    ];

    const eventIndex = Math.floor(roll * events.length);
    const selectedEvent = events[eventIndex];

    const finalHealthBoost = baseHealthBoost + selectedEvent.healthMod;

    return {
        tripName,
        cost: baseCost,
        moneyChange: selectedEvent.moneyMod,
        healthChange: finalHealthBoost,
        eventMessage: selectedEvent.msg
    };
}

/**
 * Calculates new relationship status after yearly decay.
 * @param {number} currentStatus
 * @param {boolean} interactedThisYear
 * @param {string} [category] - relationship category; 'family' is exempt while the player is a minor, 'classmate' is always exempt
 * @param {number} [userAge] - the player's current age
 * @returns {number} New status
 */
function calculateRelationshipDecay(currentStatus, interactedThisYear, category, userAge) {
    if (interactedThisYear) return currentStatus;
    // Family bonds don't erode just from growing up — a minor's relationship with
    // parents/siblings only worsens from an actual negative interaction (e.g. Insult).
    if (category === 'family' && userAge !== undefined && userAge <= 18) return currentStatus;
    // Classmates only exist as a category while you're actually in school together —
    // seeing them daily means no passive decay, only direct negative interactions hurt it.
    if (category === 'classmate') return currentStatus;
    return Math.max(0, currentStatus - 5);
}

/**
 * Checks if a relationship should shift category based on status.
 * @param {string} category 
 * @param {number} status 
 * @returns {string|null} The new category if shifted, otherwise null
 */
function checkRelationshipCategoryShift(category, status, type) {
    const familyTypes = ['Mother', 'Father', 'Brother', 'Sister', 'Son', 'Daughter', 'Child', 'Parent', 'Grandmother', 'Grandfather', 'Uncle', 'Aunt', 'Cousin', 'Niece', 'Nephew'];
    if (['family', 'spouse', 'child', 'classmate', 'partner', 'ex'].includes(category) || (type && familyTypes.includes(type))) {
        return null;
    }

    if (status < 30 && category !== 'enemy') return 'enemy';
    if (status >= 30 && category === 'enemy') return 'friend';
    return null;
}

/**
 * Single source of truth for every per-person relationship interaction:
 * name/icon/desc for rendering, cost/statusChange for effect, and the
 * conditions that decide whether it's shown at all (category/gender/type
 * filters) vs. shown-but-disabled (age/funds/status/hostility gates).
 */
const RELATIONSHIP_INTERACTIONS = [
    { key: 'spend_time', name: 'Spend Time', icon: 'fa-clock', desc: 'Spend quality time together', cost: 0, statusChange: 15, blockedIfAgeLte: 1 },
    { key: 'give_money', name: 'Give Money', icon: 'fa-money-bill', desc: 'Give a monetary gift', cost: 500, statusChange: 10, blockedIfAgeLte: 10, allowedWhileHostile: true },
    { key: 'insult', name: 'Insult', icon: 'fa-angry', desc: 'Say something mean', cost: 0, statusChange: -20, blockedIfAgeLte: 2, allowedWhileHostile: true },
    { key: 'compliment', name: 'Compliment', icon: 'fa-heart', desc: 'Say something nice', cost: 0, statusChange: 15, blockedIfAgeLte: 2 },
    { key: 'call_chat', name: 'Call to Chat', icon: 'fa-phone', desc: 'Have a quick chat over the phone', cost: 0, statusChange: 10, blockedIfAgeLte: 5, blockedForTeacherUnlessFriend: true },
    { key: 'ask_friend', name: 'Ask to be Friends', icon: 'fa-user-plus', desc: 'See if they want to hang out outside of school', cost: 0, statusChange: 0, categories: ['classmate'] },

    // --- Romance (Chunk 1) ---
    { key: 'ask_out', name: 'Ask Out', icon: 'fa-heart', desc: 'Ask them to be your boyfriend/girlfriend', cost: 0, statusChange: 0, categories: ['friend'], requiresOppositeGender: true, monogamyGate: true, minStatusToUnlock: 40, blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'flirt', name: 'Flirt', icon: 'fa-kiss-wink-heart', desc: 'Say something flirty', cost: 0, statusChange: 10, categories: ['partner'], blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'go_on_date', name: 'Go on a Date', icon: 'fa-utensils', desc: 'Take them out for a night together', cost: 100, statusChange: 15, categories: ['partner'], blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'make_love', name: 'Make Love', icon: 'fa-heart-circle-check', desc: 'Spend an intimate night together', cost: 0, statusChange: 10, categories: ['partner', 'spouse'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17 },
    { key: 'make_a_move', name: 'Make a Move', icon: 'fa-fire-flame-curved', desc: 'Try to initiate something intimate', cost: 0, statusChange: 0, categories: ['friend', 'classmate'], directAction: 'handleMakeAMove', blockedIfAgeLte: 15, blockedIfTargetAgeLte: 15 },
    { key: 'end_affair', name: 'End the Affair', icon: 'fa-heart-crack', desc: 'Break off the secret affair', cost: 0, statusChange: -10, requiredTypes: ['Secret Affair'], directAction: 'handleEndAffair' },
    { key: 'break_up', name: 'Break Up', icon: 'fa-heart-crack', desc: 'End the relationship', cost: 0, statusChange: 0, categories: ['partner'] },

    // --- Marriage & Divorce (Chunk 2) ---
    { key: 'propose', name: 'Propose', icon: 'fa-gem', desc: 'Pop the question with a ring', cost: 3000, statusChange: 0, categories: ['partner'], requiredTypes: ['Boyfriend', 'Girlfriend'], minStatusToUnlock: 75, blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17 },
    { key: 'get_married', name: 'Plan Wedding', icon: 'fa-ring', desc: 'Take the next step and get married', cost: 0, statusChange: 0, categories: ['partner'], requiredTypes: ['Fiancé', 'Fiancée'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17, directAction: 'openWeddingPlanner' },
    { key: 'file_divorce', name: 'File for Divorce', icon: 'fa-file-signature', desc: 'End the marriage (legal fee + asset split)', cost: 5000, statusChange: 0, categories: ['spouse'] },

    // --- Pregnancy & Birth (Chunk 3) ---
    { key: 'try_for_baby', name: 'Try for a Baby', icon: 'fa-baby', desc: 'Try to start a family together', cost: 0, statusChange: 0, categories: ['spouse'], blockedIfAgeLte: 17, blockedIfTargetAgeLte: 17, blockedIfUserExpecting: true },
];

/**
 * A relationship "refuses contact" (blocks most interactions) below a status
 * floor. Family/spouse/child get a lower floor (15) than everyone else (30).
 * @param {object} person
 * @returns {boolean}
 */
function isHostile(person) {
    if (!person) return false;
    const isFamilyLike = ['family', 'spouse', 'child'].includes(person.category);
    return isFamilyLike ? (person.status || 0) < 15 : (person.status || 0) < 30;
}

/**
 * Returns the interactions applicable to this person/user pair at all
 * (category/type/gender/relationship-status filters). Does not evaluate
 * age/funds/hostility gates — see isInteractionBlocked for those.
 * @param {object} person
 * @param {object} user
 * @returns {Array}
 */
function getAvailableInteractions(person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || person.deathCause !== undefined) {
        return [];
    }
    const hasPartnerOrSpouse = (user?.relationships || []).some(r => r.category === 'partner' || r.category === 'spouse');
    return RELATIONSHIP_INTERACTIONS.filter(it => {
        if ((user.age <= 17 && person.age >= 18) || (user.age >= 18 && person.age <= 17)) {
            if (['make_a_move', 'make_love', 'ask_out', 'flirt', 'go_on_date', 'propose', 'get_married'].includes(it.key)) return false;
        }
        if (person.type === 'Ex-Lover' && (it.key === 'make_a_move' || it.key === 'make_love')) return false;
        if (it.key === 'make_love' && person.type === 'Secret Affair') return true;
        if (it.categories && !it.categories.includes(person.category)) return false;
        if (it.requiredTypes && !it.requiredTypes.includes(person.type)) return false;
        if (it.requiresOppositeGender && (!person.gender || !user.gender || person.gender === user.gender)) return false;
        if (it.monogamyGate && hasPartnerOrSpouse) return false;
        return true;
    });
}

const HOOKUP_SCENARIOS = [
    "Things are getting steamy with {name}...",
    "One thing leads to another, and the chemistry between you and {name} becomes undeniable...",
    "You lean in close to {name}. After a moment of hesitation, they pull you in...",
    "Sparked by late night drinks, {name} looks at you with a seductive grin...",
    "Away from prying eyes, {name} whispers that they've been wanting this for a long time..."
];

function getRandomHookupScenario(name) {
    const template = HOOKUP_SCENARIOS[Math.floor(Math.random() * HOOKUP_SCENARIOS.length)];
    return template.replace('{name}', name);
}

function calculateMakeAMoveSuccess(person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || person.deathCause !== undefined) {
        return false;
    }
    const status = person.status || 0;
    const chance = Math.min(0.90, Math.max(0.15, status / 100));
    return Math.random() < chance;
}

function checkAgeUpInfidelityDiscovery(user) {
    if (!user || !user.relationships) return null;

    const partner = user.relationships.find(r => r.category === 'spouse' || r.category === 'partner');
    if (!partner) return null;

    const affairs = user.relationships.filter(r => r.type === 'Secret Affair');
    if (affairs.length === 0 && !user.hadUnfaithfulHookupThisYear) return null;

    const discovered = Math.random() < 0.25;
    if (discovered) {
        const affairTarget = affairs.length > 0 ? affairs[Math.floor(Math.random() * affairs.length)] : null;
        const affairName = affairTarget ? affairTarget.name : "someone else";

        user.hadUnfaithfulHookupThisYear = false;

        return {
            partnerId: partner.id,
            partnerName: partner.name,
            affairName: affairName
        };
    }

    return null;
}

/**
 * Evaluates whether a specific interaction is currently blocked for this
 * person/user pair, and why (for UI display). Mirrors the previously
 * duplicated age/affordability/hostility gate logic in relationshipScreen.js.
 * @param {string} interactionKey
 * @param {object} person
 * @param {object} user
 * @returns {{blocked: boolean, reason: string}}
 */
function isInteractionBlocked(interactionKey, person, user) {
    if (!person || !isAlive(person) || person.isDead || person.lifeStatus === 'Deceased' || person.deathCause !== undefined) {
        return { blocked: true, reason: 'Deceased' };
    }
    const it = RELATIONSHIP_INTERACTIONS.find(i => i.key === interactionKey);
    if (!it) return { blocked: true, reason: 'Unknown Action' };

    let blocked = false;
    let reason = '';

    if (['make_a_move', 'make_love', 'ask_out', 'flirt', 'go_on_date', 'propose', 'get_married'].includes(interactionKey)) {
        if ((user.age <= 17 && person.age >= 18) || (user.age >= 18 && person.age <= 17)) {
            blocked = true;
            if (!reason) reason = 'Age Gap (Minor & Adult)';
        }
    }

    if (it.blockedIfAgeLte !== undefined && user.age <= it.blockedIfAgeLte) {
        blocked = true;
        reason = 'Too Young';
    }
    if (it.blockedIfTargetAgeLte !== undefined && person.age <= it.blockedIfTargetAgeLte) {
        blocked = true;
        if (!reason) reason = 'Too Young';
    }

    const canAfford = !it.cost || (user.money || 0) >= it.cost;
    if (!canAfford) {
        blocked = true;
        if (!reason) reason = 'Insufficient Funds';
    }

    if (it.minStatusToUnlock !== undefined && person.status < it.minStatusToUnlock) {
        blocked = true;
        if (!reason) reason = 'Not Close Enough Yet';
    }

    if (it.blockedIfUserExpecting && user.isExpecting) {
        blocked = true;
        if (!reason) reason = 'Already Expecting';
    }

    if (interactionKey === 'try_for_baby') {
        const femaleAge = user.gender === 'female' ? user.age : person.age;
        const maleAge = user.gender === 'male' ? user.age : person.age;
        if (femaleAge >= 45) {
            blocked = true;
            if (!reason) reason = 'Female Too Old';
        } else if (maleAge >= 65) {
            blocked = true;
            if (!reason) reason = 'Male Too Old';
        }
    }

    if (it.blockedForTeacherUnlessFriend && person.type === 'Teacher') {
        blocked = true;
        if (!reason) reason = 'Not Friends Yet';
    }

    if (isHostile(person) && !it.allowedWhileHostile) {
        blocked = true;
        reason = 'Refuses Contact';
    }

    return { blocked, reason };
}

/**
 * Calculates inheritance from a deceased parent based on age and a random roll.
 * @param {number} age - The age of the deceased parent.
 * @param {number} [roll=Math.random()] - Random roll between 0 and 0.999.
 * @returns {number} The inheritance amount in dollars.
 */
function calculateInheritance(age, roll = Math.random()) {
    // 15% chance of dying in debt or having nothing, regardless of age
    if (roll < 0.15) {
        return 0;
    }
    
    // Scale potential savings by age
    let baseSavings = 0;
    if (age < 30) baseSavings = 5000;
    else if (age < 50) baseSavings = 25000;
    else if (age < 70) baseSavings = 100000;
    else baseSavings = 250000;
    
    // The roll determines how much of their "potential" savings they actually had
    // Normalizing the remaining roll from 0.15 to 1.0 down to a multiplier 0.1 to 1.5
    const multiplier = ((roll - 0.15) / 0.85) * 1.4 + 0.1; 
    
    let inheritance = Math.floor(baseSavings * multiplier);
    
    // Round to nearest 100, guaranteed non-negative
    return Math.max(0, Math.round(inheritance / 100) * 100);
}

/**
 * Rolls whether a deceased spouse carried a life insurance policy that pays out.
 * Unlike a parent's independent inheritance (which usually leaves something),
 * married couples already share one household pot, so a payout here is
 * intentionally uncommon — but meaningful when it lands.
 * @param {number} [roll=Math.random()] - payout-odds roll (0-1)
 * @param {number} [amountRoll=Math.random()] - payout-size roll (0-1), for pure unit testing
 * @returns {number} The payout amount in dollars, 0 if no policy pays out.
 */
function calculateSpousalLifeInsurance(roll = Math.random(), amountRoll = Math.random()) {
    // Only ~30% of spouses turn out to have had a payable policy
    if (roll >= 0.3) {
        return 0;
    }

    const payout = 25000 + Math.floor(amountRoll * 175000); // $25,000 - $200,000

    // Round to nearest 100, guaranteed non-negative
    return Math.max(0, Math.round(payout / 100) * 100);
}

/**
 * Calculates net estate value and non-negative inheritance shares for surviving heirs.
 * If the deceased had net negative wealth (debt), debt is absorbed by the estate/creditors
 * and heirs receive $0 (debt is never inherited).
 * @param {object} user - The deceased character's state.
 * @returns {object} { totalEstate, distributableEstate, spouseShare, inheritancePerChild, children, spouse, isInsolvent }
 */
function calculateEstateDistribution(user) {
    if (!user) {
        return {
            totalEstate: 0,
            distributableEstate: 0,
            spouseShare: 0,
            inheritancePerChild: 0,
            children: [],
            spouse: null,
            isInsolvent: false
        };
    }

    const relationships = Array.isArray(user.relationships) ? user.relationships : [];
    const children = relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const spouse = relationships.find(r => r.category === 'spouse');
    const hasChildren = children.length > 0;
    const hasSpouse = !!spouse;

    const assetValue = Array.isArray(user.assets)
        ? user.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0)
        : 0;
    const companyCash = (user.hasBusiness && Number(user.compCash) > 0) ? Number(user.compCash) : 0;
    const rawMoney = Number(user.money) || 0;
    const totalEstate = rawMoney + assetValue + companyCash;

    if (totalEstate <= 0) {
        return {
            totalEstate,
            distributableEstate: 0,
            spouseShare: 0,
            inheritancePerChild: 0,
            children,
            spouse,
            isInsolvent: true
        };
    }

    let spouseShare = 0;
    let remainingEstate = totalEstate;

    if (hasSpouse) {
        spouseShare = hasChildren ? Math.floor(totalEstate * 0.5) : totalEstate;
        remainingEstate = Math.max(0, totalEstate - spouseShare);
    }

    const inheritancePerChild = hasChildren
        ? Math.max(0, Math.floor(remainingEstate / children.length))
        : 0;

    return {
        totalEstate,
        distributableEstate: totalEstate,
        spouseShare: Math.max(0, spouseShare),
        inheritancePerChild,
        children,
        spouse,
        isInsolvent: false
    };
}

const FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'];
const FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

/**
 * Returns a random first name for the given gender.
 * @param {string} gender - 'male' or 'female'
 * @param {number} [roll=Math.random()] - Injected randomness for pure unit testing.
 * @returns {string}
 */
function getRandomFirstName(gender, roll = Math.random()) {
    const pool = gender === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    return pool[Math.floor(roll * pool.length)];
}

function getRandomLastName(roll = Math.random()) {
    return LAST_NAMES[Math.floor(roll * LAST_NAMES.length)];
}

/**
 * Extracts the last word of a full name, treated as the surname.
 * @param {string} fullName
 * @returns {string}
 */
function getLastName(fullName) {
    if (!fullName) return getRandomLastName();
    const parts = (fullName || '').trim().split(' ');
    return parts[parts.length - 1] || getRandomLastName();
}

/**
 * Extracts everything but the last word of a full name, treated as the given name(s).
 * @param {string} fullName
 * @returns {string}
 */
function getFirstName(fullName) {
    const parts = (fullName || '').trim().split(' ');
    return parts.slice(0, -1).join(' ') || parts[0] || '';
}

/**
 * Determines if a spouse accepts taking your last name, mirroring
 * calculateProposalAcceptance's status-derived chance.
 * @param {number} status
 * @param {number} [roll=Math.random()]
 * @returns {boolean}
 */
function calculateNameChangeAcceptance(status, roll = Math.random()) {
    return roll < (status / 100);
}

/**
 * Generates a cohort of classmates and one teacher based on the user's age.
 * @param {number} userAge 
 * @returns {Array} Array of relationship objects
 */
function generateSchoolCohort(userAge) {
    const cohort = [];
    
    // Determine bounds
    let classmateAgeMin = Math.max(5, userAge - 1);
    let classmateAgeMax = userAge + 1;
    
    if (userAge >= 18) {
        classmateAgeMin = 18;
        classmateAgeMax = 25;
    }

    const numClassmates = Math.floor(Math.random() * 5) + 12; // 12 to 16 classmates

    for (let i = 0; i < numClassmates; i++) {
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const first = getRandomFirstName(gender);
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
        const age = Math.floor(Math.random() * (classmateAgeMax - classmateAgeMin + 1)) + classmateAgeMin;
        const occupationInfo = generateNPCOccupation(age);
        cohort.push({
            id,
            name: `${first} ${last}`,
            age,
            type: 'Classmate',
            gender,
            status: Math.floor(Math.random() * 31) + 20, // 20 to 50 starting status
            category: 'classmate',
            isCurrentClassmate: true,
            interactedThisYear: false,
            appearance: AvatarLogic.generateRandomAppearance(id, gender),
            ...occupationInfo
        });
    }

    // Generate one teacher
    const teacherGender = Math.random() < 0.5 ? 'male' : 'female';
    const lastTeacher = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = teacherGender === 'male' ? 'Mr.' : (Math.random() > 0.5 ? 'Ms.' : 'Mrs.');
    const teacherId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    cohort.push({
        id: teacherId,
        name: `${title} ${lastTeacher}`,
        age: Math.floor(Math.random() * 37) + 24, // 24 to 60
        type: 'Teacher',
        gender: teacherGender,
        status: Math.floor(Math.random() * 31) + 20, // 20 to 50
        category: 'classmate', // Keep as 'classmate' category so they show up together
        isCurrentClassmate: true,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(teacherId, teacherGender),
        occupation: "Teacher",
        occupationType: "job",
        income: 50000,
        careerTrack: "education_track",
        careerLevel: 0
    });

    return cohort;
}

/**
 * Generates a replacement teacher when a teacher passes away while player is in school.
 * @param {number} userAge 
 * @returns {object} Relationship object for the replacement teacher
 */
function generateReplacementTeacher(userAge) {
    const teacherGender = Math.random() < 0.5 ? 'male' : 'female';
    const lastTeacher = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = teacherGender === 'male' ? 'Mr.' : (Math.random() > 0.5 ? 'Ms.' : 'Mrs.');
    const teacherId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    return {
        id: teacherId,
        name: `${title} ${lastTeacher}`,
        age: Math.floor(Math.random() * 37) + 24, // 24 to 60
        type: 'Teacher',
        gender: teacherGender,
        status: 30, // Default base starting status
        category: 'classmate',
        isCurrentClassmate: true,
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(teacherId, teacherGender),
        occupation: "Teacher",
        occupationType: "job",
        income: 50000,
        careerTrack: "education_track",
        careerLevel: 0
    };
}

/**
 * Generates a single opposite-gender stranger the player meets while out
 * (e.g. a "Go Out / Meet Someone" action). Starts as a regular friend —
 * romance only begins once the player uses "Ask Out" on them.
 * @param {number} userAge
 * @param {string} userGender - 'male' or 'female'
 * @param {number} [roll=Math.random()] - Injected randomness for the age roll, for pure unit testing.
 * @returns {object} A relationship object
 */
function determineNPCGender(userGender, attractionPreference) {
    if (attractionPreference === 'men' || attractionPreference === 'male') return 'male';
    if (attractionPreference === 'women' || attractionPreference === 'female') return 'female';
    if (attractionPreference === 'everyone' || attractionPreference === 'all') return Math.random() < 0.5 ? 'male' : 'female';
    return userGender === 'male' ? 'female' : 'male';
}

const DATING_APP_BIOS = [
    "Looking for someone to explore local coffee spots with ☕",
    "Passionate traveler, foodie, and dog lover ✈️🐶",
    "Fitness enthusiast by day, movie buff by night 🎬💪",
    "Always looking for good music, banter, and road trips 🎵🚗",
    "Self-proclaimed chef & professional amateur photographer 🎨📷",
    "Looking for a partner in crime for weekend adventures 🌟",
    "Hobbyist gamer, coffee addict, and bookworm 📖☕",
    "Life is short - let's grab drinks and see where it goes 🥂"
];

const DATING_APP_HOBBIES = [
    "Coffee", "Travel", "Fitness", "Hiking", "Photography", "Gaming",
    "Cooking", "Movies", "Music", "Art", "Reading", "Dogs", "Cats", "Concerts"
];

function generateDatingProfiles(user, count = 3) {
    const userAge = user.age || 18;
    const userGender = user.gender || 'male';
    const preference = user.attractionPreference || (userGender === 'male' ? 'women' : 'men');

    const profiles = [];
    for (let i = 0; i < count; i++) {
        const gender = determineNPCGender(userGender, preference);
        const minAge = Math.max(18, userAge - 3);
        const maxAge = userAge + 4;
        const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
        const first = getRandomFirstName(gender);
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'date_profile_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6);
        const occInfo = generateNPCOccupation(age);

        const shuffledHobbies = [...DATING_APP_HOBBIES].sort(() => Math.random() - 0.5);
        const hobbies = shuffledHobbies.slice(0, 2);
        const bio = DATING_APP_BIOS[Math.floor(Math.random() * DATING_APP_BIOS.length)];

        profiles.push({
            id,
            name: `${first} ${last}`,
            age,
            gender,
            occupation: occInfo.occupation || 'Single',
            appearance: AvatarLogic.generateRandomAppearance(id, gender),
            bio,
            hobbies,
            matchChance: 0.75
        });
    }
    return profiles;
}

const LUXURY_AGE_PRESETS = {
    '18-25': { min: 18, max: 25 },
    '26-35': { min: 26, max: 35 },
    '36-45': { min: 36, max: 45 },
    '46-60': { min: 46, max: 60 },
    '60+':   { min: 61, max: 80 }
};

const LUXURY_CAREERS = {
    high_earner: [
        { title: 'Senior Software Engineer', salaryRange: [120000, 180000] },
        { title: 'Attending Physician', salaryRange: [180000, 240000] },
        { title: 'Associate Attorney', salaryRange: [130000, 200000] },
        { title: 'VP of Banking', salaryRange: [150000, 250000] },
        { title: 'Creative Director', salaryRange: [130000, 210000] },
        { title: 'Director of Nursing', salaryRange: [120000, 170000] }
    ],
    wealthy: [
        { title: 'Managing Partner (Law)', salaryRange: [280000, 450000] },
        { title: 'Chief of Medicine', salaryRange: [320000, 500000] },
        { title: 'Chief Banking Officer', salaryRange: [300000, 480000] },
        { title: 'Engineering Director', salaryRange: [250000, 420000] },
        { title: 'Executive VP of Logistics', salaryRange: [260000, 400000] }
    ],
    ultra_wealthy: [
        { title: 'Hedge Fund Manager', salaryRange: [750000, 2500000] },
        { title: 'Tech Founder & CEO', salaryRange: [800000, 3000000] },
        { title: 'Private Equity Managing Director', salaryRange: [900000, 2200000] },
        { title: 'Commercial Real Estate Tycoon', salaryRange: [650000, 1800000] },
        { title: 'Supermodel & Fashion Icon', salaryRange: [600000, 1500000] },
        { title: 'A-List Movie Producer', salaryRange: [850000, 2800000] }
    ]
};

function generateLuxuryMatch(user, { agePreset = '26-35', wealthTier = 'wealthy', genderPreference = null } = {}) {
    const userGender = user.gender || 'male';
    const preference = genderPreference || user.attractionPreference || (userGender === 'male' ? 'women' : 'men');
    const gender = determineNPCGender(userGender, preference);

    const preset = LUXURY_AGE_PRESETS[agePreset] || LUXURY_AGE_PRESETS['26-35'];
    const age = preset.min + Math.floor(Math.random() * (preset.max - preset.min + 1));

    const tierKey = LUXURY_CAREERS[wealthTier] ? wealthTier : 'wealthy';
    const careerPool = LUXURY_CAREERS[tierKey];
    const chosenCareer = careerPool[Math.floor(Math.random() * careerPool.length)];

    let baseSalary = Math.floor(Math.random() * (chosenCareer.salaryRange[1] - chosenCareer.salaryRange[0] + 1)) + chosenCareer.salaryRange[0];
    if (user.city) {
        baseSalary = calculateScaledSalary(baseSalary, user.city);
    }

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'luxe_rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    return {
        id,
        name: `${first} ${last}`,
        age,
        gender,
        type: 'Crush',
        status: Math.floor(Math.random() * 21) + 65, // 65 to 85 starting status (high chemistry guaranteed)
        category: 'friend',
        occupation: chosenCareer.title,
        occupationType: 'job',
        income: baseSalary,
        educationLevel: 'University',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

function generateTargetedStranger(user, categoryPreference = 'friend') {
    const userAge = typeof user === 'number' ? user : (user.age || 18);
    const userGender = typeof user === 'number' ? 'male' : (user.gender || 'male');
    const attractionPref = typeof user === 'object' ? user.attractionPreference : null;

    let gender;
    if (categoryPreference === 'romantic' || categoryPreference === 'date') {
        gender = determineNPCGender(userGender, attractionPref);
    } else {
        gender = Math.random() < 0.5 ? 'male' : 'female';
    }

    const minAge = Math.max(16, userAge - 3);
    const maxAge = Math.max(minAge, userAge + 4);
    const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const occupationInfo = generateNPCOccupation(age);

    const isRomantic = categoryPreference === 'romantic' || categoryPreference === 'date';
    return {
        id,
        name: `${first} ${last}`,
        age,
        type: isRomantic ? 'Crush' : 'Friend',
        gender,
        status: isRomantic ? Math.floor(Math.random() * 21) + 40 : Math.floor(Math.random() * 21) + 30,
        category: 'friend',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender),
        ...occupationInfo
    };
}

function generateStranger(userAge, userGender, roll = Math.random()) {
    const gender = userGender === 'male' ? 'female' : 'male';
    const minAge = Math.max(18, userAge - 3);
    const maxAge = Math.max(minAge, userAge + 5);
    const age = minAge + Math.floor(roll * (maxAge - minAge + 1));

    const first = getRandomFirstName(gender);
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const occupationInfo = generateNPCOccupation(age);

    return {
        id,
        name: `${first} ${last}`,
        age,
        type: 'Friend',
        gender,
        status: Math.floor(Math.random() * 21) + 20, // 20 to 40 starting status
        category: 'friend',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(id, gender),
        ...occupationInfo
    };
}

/**
 * Backfills a missing `gender` on legacy relationship records (saves that
 * predate the romance system) so they aren't permanently invisible to
 * gender-gated interactions like Ask Out. Mutates entries in place.
 * @param {Array} relationships
 * @returns {Array} the same array
 */
function backfillRelationshipGender(relationships) {
    if (!Array.isArray(relationships)) return relationships;
    relationships.forEach(r => {
        if (!r.gender) r.gender = Math.random() < 0.5 ? 'male' : 'female';
    });
    return relationships;
}

/**
 * Determines if a classmate or teacher accepts a friend request.
 * @param {number} status 
 * @param {boolean} isTeacher 
 * @param {number} roll - random roll between 0 and 1
 * @returns {boolean} true if accepted, false if rejected
 */
function attemptBefriend(status, isTeacher, roll = Math.random()) {
    // Base chance depends on status. e.g. status 50 = 50% chance.
    let chance = status / 100;

    // It's harder for teachers
    if (isTeacher) {
        chance *= 0.5; // Half as likely
    }

    return roll < chance;
}

const JEWELRY_TYPES = {
    ring: { icon: "fa-ring", color: "text-amber-400" },
    watch: { icon: "fa-clock", color: "text-blue-400" },
    necklace: { icon: "fa-gem", color: "text-pink-400" },
    earrings: { icon: "fa-shield-halved", color: "text-purple-400" },
    bracelet: { icon: "fa-circle-notch", color: "text-emerald-400" },
    tiara: { icon: "fa-crown", color: "text-yellow-300" },
    default: { icon: "fa-gem", color: "text-amber-300" }
};

function getJewelryIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return JEWELRY_TYPES[key] || JEWELRY_TYPES.default;
}

const JEWELRY_FOR_SALE = [
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

function updateOwnedJewelry(user) {
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

/**
 * Determines if a partner accepts a marriage proposal. Chance scales with
 * relationship status and ring quality. Supports signatures:
 * - calculateProposalAcceptance(status, roll)
 * - calculateProposalAcceptance(status, ringValue, roll)
 * @param {number} status
 * @param {number} [ringValueOrRoll=0]
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if accepted, false if rejected
 */
function calculateProposalAcceptance(status, ringValueOrRoll = 0, roll = Math.random()) {
    let ringValue = 0;
    let actualRoll = roll;

    if (typeof ringValueOrRoll === 'number') {
        if (ringValueOrRoll > 0 && ringValueOrRoll <= 1) {
            actualRoll = ringValueOrRoll;
            ringValue = 0;
        } else if (ringValueOrRoll > 1) {
            ringValue = ringValueOrRoll;
        }
    }

    let baseChance = status / 100;
    let ringBonus = 0;
    if (ringValue > 0) {
        ringBonus = Math.min(0.25, Math.log10(Math.max(10, ringValue)) * 0.05);
    }
    return actualRoll < Math.min(0.95, baseChance + ringBonus);
}


/**
 * Determines if trying for a baby succeeds this year, based on the
 * female's age and male's age (females 45+ or males 65+ cannot conceive).
 * @param {number} femaleAge - Age of the female partner
 * @param {number|undefined} [maleAgeOrRoll] - Age of male partner, or roll if 2-arg signature
 * @param {number} [roll=Math.random()]
 * @returns {boolean} true if a pregnancy begins
 */
function calculatePregnancyChance(femaleAge, maleAgeOrRoll = undefined, roll = Math.random()) {
    let maleAge;
    let actualRoll = roll;

    if (typeof maleAgeOrRoll === 'number' && maleAgeOrRoll < 1.0 && maleAgeOrRoll >= 0) {
        actualRoll = maleAgeOrRoll;
        maleAge = undefined;
    } else {
        maleAge = maleAgeOrRoll;
    }

    if (femaleAge >= 45) return false;
    if (maleAge !== undefined && maleAge >= 65) return false;

    let chance;
    if (femaleAge < 35) chance = 0.5;
    else if (femaleAge < 40) chance = 0.3;
    else chance = 0.1;

    return actualRoll < chance;
}

/**
 * Returns the annual promotion chance for a career-track employee based on performance.
 * @param {number} performance - Job performance (0–100)
 * @returns {number} Probability of promotion (0.0 to 0.80); 0 means ineligible
 */
function calculatePromotionChance(performance, smarts = 50) {
    const clampedPerf = clampStat(performance, 50);
    const clampedSmarts = clampStat(smarts, 50);
    let bonus = 0;
    if (clampedSmarts >= 80) bonus = 0.10;
    else if (clampedSmarts >= 65) bonus = 0.05;

    if (clampedPerf >= 95) return Math.min(0.95, 0.80 + bonus);
    if (clampedPerf >= 85) return Math.min(0.85, 0.50 + bonus);
    if (clampedPerf >= 75) return Math.min(0.75, 0.25 + bonus);
    return 0;
}

/**
 * Determines whether a business owner can process another quarterly turn
 * at their current player age (limit: 1 fiscal year / 4 quarters per age).
 * @param {object} user - The player state object
 * @returns {{ allowed: boolean, reason?: string }}
 */
function canProcessBusinessQuarter(user) {
    if (!user || !user.hasBusiness) {
        return { allowed: false, reason: "No active business." };
    }

    if (!isAlive(user)) {
        return { allowed: false, reason: "Cannot run business while dead or at 0 HP." };
    }

    if (user.lastCompletedFiscalYearAge === user.age) {
        return {
            allowed: false,
            reason: "You need to age up before continuing a new fiscal year."
        };
    }

    const quartersThisAge = user.lastBusinessAge === user.age ? (user.quartersProcessedThisAge || 0) : 0;

    if (quartersThisAge >= 4) {
        return {
            allowed: false,
            reason: "You need to age up before continuing a new fiscal year."
        };
    }

    return { allowed: true };
}

/**
 * Records that a business quarter was processed at the current player age.
 * Updates user.lastBusinessAge, increments user.quartersProcessedThisAge,
 * and sets user.lastCompletedFiscalYearAge if a fiscal year was completed.
 * @param {object} user - The player state object
 * @param {boolean} [fiscalYearCompleted=false] - Whether this quarter completed a fiscal year
 * @returns {object} The mutated user state
 */
function recordBusinessQuarterProcessed(user, fiscalYearCompleted = false) {
    if (!user) return user;
    if (user.lastBusinessAge !== user.age) {
        user.lastBusinessAge = user.age;
        user.quartersProcessedThisAge = 0;
    }
    user.quartersProcessedThisAge = (user.quartersProcessedThisAge || 0) + 1;
    if (fiscalYearCompleted) {
        user.lastCompletedFiscalYearAge = user.age;
    }
    return user;
}

/**
 * Returns how many quarters remain available to process for the current player age.
 * @param {object} user
 * @returns {number} 0 to 4
 */
function getRemainingQuartersForAge(user) {
    if (!user || !user.hasBusiness) return 0;
    if (user.lastCompletedFiscalYearAge === user.age) return 0;
    const processed = user.lastBusinessAge === user.age ? (user.quartersProcessedThisAge || 0) : 0;
    return Math.max(0, 4 - processed);
}

/**
 * Calculates how many quarters autoProcessBusinessQuarter should run when aging up.
 * If a fiscal year was already completed at the previous age, returns 0.
 * Otherwise returns the remaining quarters needed to complete the fiscal year for that age.
 * @param {object} user
 * @returns {number} Quarters to auto-process (0 to 4)
 */
function calculateAutoQuarterCount(user) {
    if (!user || !user.hasBusiness) return 0;
    const prevAge = user.age - 1;
    if (user.lastCompletedFiscalYearAge === prevAge) {
        return 0;
    }
    if (user.lastBusinessAge === prevAge) {
        const processed = user.quartersProcessedThisAge || 0;
        return Math.max(0, 4 - processed);
    }
    return 4;
}

/**
 * Resets business quarter tracking so a newly acquired or restarted business
 * starts with a fresh fiscal year for the current age.
 * @param {object} user - The player state object
 * @returns {object} The mutated user state
 */
function resetBusinessQuarterTracking(user) {
    if (!user) return user;
    user.quartersProcessedThisAge = 0;
    user.lastBusinessAge = null;
    user.lastCompletedFiscalYearAge = null;
    return user;
}

/**
 * Maps living family members from a deceased parent's state to the new child player.
 * Inherits:
 * - Surviving spouse -> Mother / Father
 * - Other children of parent -> Brother / Sister
 * - Deceased parent's siblings -> Uncle / Aunt
 * - Deceased parent's parents -> Grandfather / Grandmother
 * @param {Array} parentRelationships - Array of relationship objects from deceased parent
 * @param {string} selectedChildId - ID of the child becoming the new player character
 * @returns {Array} Array of relationship objects mapped for the new child player
 */
function inheritFamilyRelationships(parentRelationships, selectedChildId) {
    if (!Array.isArray(parentRelationships)) return [];

    const inherited = [];

    parentRelationships.forEach(r => {
        if (!r || r.id === selectedChildId) return;

        let newType = null;

        if (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') {
            const isMale = r.gender === 'male' || r.type === 'Son';
            newType = isMale ? 'Brother' : 'Sister';
        } else if (r.category === 'spouse' || r.type === 'Husband' || r.type === 'Wife') {
            const isMale = r.gender === 'male' || r.type === 'Husband';
            newType = isMale ? 'Father' : 'Mother';
        } else if (r.type === 'Brother' || r.type === 'Sister') {
            const isMale = r.gender === 'male' || r.type === 'Brother';
            newType = isMale ? 'Uncle' : 'Aunt';
        } else if (r.type === 'Mother' || r.type === 'Father') {
            const isMale = r.gender === 'male' || r.type === 'Father';
            newType = isMale ? 'Grandfather' : 'Grandmother';
        }

        if (newType) {
            inherited.push({
                id: r.id,
                name: r.name,
                age: r.age,
                gender: r.gender || (['Brother', 'Father', 'Uncle', 'Grandfather'].includes(newType) ? 'male' : 'female'),
                type: newType,
                status: r.status !== undefined ? r.status : 80,
                category: 'family',
                appearance: r.appearance,
                avatarVersion: r.avatarVersion || 0,
                interactedThisYear: false
            });
        }
    });

    return inherited;
}

const PROPERTIES_FOR_SALE = [
    { id: 1, name: "Cozy Studio Apartment", type: "apartment", price: 120000, desc: "A modest starter studio in the city." },
    { id: 2, name: "Suburban Townhouse", type: "townhouse", price: 280000, desc: "A cozy 2-bedroom townhouse with a garage." },
    { id: 3, name: "Family Suburban House", type: "house", price: 450000, desc: "Spacious 4-bedroom house with a backyard." },
    { id: 4, name: "Downtown Luxury Condo", type: "condo", price: 850000, desc: "High-rise condo with skyline views." },
    { id: 5, name: "Executive Hillside Villa", type: "villa", price: 2200000, desc: "Gated villa with a private pool." },
    { id: 6, name: "Beachfront Estate", type: "estate", price: 6500000, desc: "Sprawling oceanfront luxury property." },
    { id: 7, name: "Penthouse Skyscraper", type: "penthouse", price: 15000000, desc: "The peak of luxury overlooking the entire city." }
];

const PROPERTY_TYPES = {
    apartment: { icon: "fa-building", color: "text-blue-400" },
    townhouse: { icon: "fa-city", color: "text-indigo-400" },
    house: { icon: "fa-house", color: "text-green-400" },
    condo: { icon: "fa-building-user", color: "text-purple-400" },
    villa: { icon: "fa-place-of-worship", color: "text-amber-400" },
    estate: { icon: "fa-landmark", color: "text-emerald-400" },
    penthouse: { icon: "fa-crown", color: "text-yellow-400" },
    default: { icon: "fa-home", color: "text-slate-400" }
};

function getPropertyIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return PROPERTY_TYPES[key] || PROPERTY_TYPES.default;
}

function calculateMonthlyMortgage(principal, annualRate = 0.065, years = 30) {
    if (!principal || principal <= 0 || !Number.isFinite(principal)) return 0;
    const safeYears = Math.max(1, (typeof years === 'number' && Number.isFinite(years)) ? years : 30);
    const safeAnnualRate = (typeof annualRate === 'number' && Number.isFinite(annualRate) && annualRate >= 0) ? annualRate : 0.065;
    const numPayments = safeYears * 12;

    if (safeAnnualRate === 0) {
        return Math.round(principal / numPayments);
    }

    const monthlyRate = safeAnnualRate / 12;
    const factor = Math.pow(1 + monthlyRate, numPayments);
    const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
    return Number.isFinite(monthlyPayment) ? Math.round(monthlyPayment) : 0;
}

function calculateTotalRentalIncome(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            return sum + asset.tenant.monthlyRent;
        }
        return sum;
    }, 0);
}

function calculateUserMonthlyIncome(user) {
    if (!user) return 0;
    let monthlyIncome = 0;
    if (user.hasBusiness && user.ceoSalary) monthlyIncome += user.ceoSalary;
    if (user.jobTitle && user.jobSalary) monthlyIncome += Math.floor(user.jobSalary / 12);
    monthlyIncome += calculateTotalRentalIncome(user.assets);
    return monthlyIncome;
}

function calculateUserMonthlyOutflow(user) {
    if (!user) return 0;
    let monthlyOutflow = 0;

    // 1. Living Expenses (annual / 12)
    const annualLiving = addLivingExpenses(user.age, user.isStudent, user.city);
    monthlyOutflow += Math.round(annualLiving / 12);

    // 2. Student Loans (monthly)
    if (user.studentLoans > 0 && !user.isStudent && user.age >= 18) {
        const annualCap = Math.min(2400, user.studentLoans);
        monthlyOutflow += Math.round(annualCap / 12);
    }

    // 3. Property Mortgages (monthly)
    monthlyOutflow += calculatePropertyMonthlyOutflow(user.assets);

    // 4. Auto Loans (monthly)
    monthlyOutflow += calculateTotalAutoLoanMonthlyOutflow(user.assets);

    // 5. Children ($500/mo per child under 21)
    monthlyOutflow += calculateChildMonthlyOutflow(user.relationships);

    // 6. Active Health & Diet (monthly)
    const annualHealth = calculateActiveHealthCosts(user);
    monthlyOutflow += Math.round(annualHealth / 12);

    // 7. Vehicle & Jewelry Insurance (monthly)
    if (Array.isArray(user.assets)) {
        user.assets.forEach(asset => {
            if (asset.category === 'vehicle' && asset.insured) {
                const annualFee = Math.max(20, Math.floor(asset.value * 0.008));
                monthlyOutflow += Math.round(annualFee / 12);
            } else if (asset.category === 'jewelry' && asset.insured) {
                const annualFee = Math.max(10, Math.floor(asset.value * 0.005));
                monthlyOutflow += Math.round(annualFee / 12);
            }
        });
    }

    return monthlyOutflow;
}

function generateTenantApplicants(property) {
    if (!property || !property.value) return [];
    const val = property.value;
    const seedTime = `${property.id}_${Date.now()}_${Math.random()}`;

    const maleName1 = `${getRandomFirstName('male')} ${getRandomLastName()}`;
    const femaleName2 = `${getRandomFirstName('female')} ${getRandomLastName()}`;
    const maleName3 = `${getRandomFirstName('male')} ${getRandomLastName()}`;

    const app1 = {
        id: 'applicant_reliable',
        name: maleName1,
        gender: 'male',
        age: Math.floor(Math.random() * 25) + 30,
        type: 'Reliable Professional',
        quality: 'excellent',
        monthlyRent: Math.max(500, Math.floor(val * 0.007)),
        leaseYears: 2,
        desc: 'Corporate professional with verified credit and stellar landlord references.'
    };
    app1.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_1`, 'male');

    const app2 = {
        id: 'applicant_roommates',
        name: femaleName2,
        gender: 'female',
        age: Math.floor(Math.random() * 15) + 22,
        type: 'Working Roommates',
        quality: 'good',
        monthlyRent: Math.max(650, Math.floor(val * 0.009)),
        leaseYears: 1,
        desc: 'Steady combined income willing to pay higher rent for a flexible 1-year term.'
    };
    app2.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_2`, 'female');

    const app3 = {
        id: 'applicant_unscreened',
        name: maleName3,
        gender: 'male',
        age: Math.floor(Math.random() * 20) + 25,
        type: 'Unscreened Applicant',
        quality: 'risky',
        monthlyRent: Math.max(800, Math.floor(val * 0.011)),
        leaseYears: 3,
        desc: 'Offers top-tier rent and a long lease, but has an unverified employment history.'
    };
    app3.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_3`, 'male');

    return [app1, app2, app3];
}

function acceptTenantLease(user, propertyId, applicantId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot manage properties while dead or at 0 HP." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.isRented && property.tenant) {
        return { success: false, reason: "Property is already occupied by a tenant." };
    }

    const applicants = generateTenantApplicants(property);
    const selected = applicants.find(a => a.id === applicantId);
    if (!selected) return { success: false, reason: "Invalid applicant selected." };

    property.isRented = true;
    property.tenant = {
        id: selected.id,
        name: selected.name,
        gender: selected.gender,
        age: selected.age,
        type: selected.type,
        quality: selected.quality,
        monthlyRent: selected.monthlyRent,
        leaseYears: selected.leaseYears,
        appearance: selected.appearance,
        renewalPending: false
    };

    return { success: true, propertyName: property.name, tenant: property.tenant };
}

function processRentalIncome(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return 0;

    let totalCollectedThisYear = 0;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            // If renewal is pending from a prior expired lease, do not collect regular income
            if (asset.tenant.renewalPending) {
                return;
            }

            let annualRent = asset.tenant.monthlyRent * 12;

            // Partial defaults for risky or good tenants
            if (asset.tenant.quality === 'risky' && Math.random() < 0.25) {
                const missedMonths = 2;
                const missedAmount = asset.tenant.monthlyRent * missedMonths;
                annualRent -= missedAmount;
                addLog(`Tenant ${asset.tenant.name} fell behind on 2 months of rent for ${asset.name}.`, 'bad');

                if (stateRef && stateRef.gameState) {
                    if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                    const alreadyQueued = stateRef.gameState.pendingTenantEvents.some(
                        e => e.eventType === 'overdue' && e.propertyId === asset.id
                    );
                    if (!alreadyQueued) {
                        stateRef.gameState.pendingTenantEvents.push({
                            eventType: 'overdue',
                            propertyId: asset.id,
                            propertyName: asset.name,
                            tenantId: asset.tenant.id,
                            tenantName: asset.tenant.name,
                            tenant: asset.tenant,
                            monthlyRent: asset.tenant.monthlyRent,
                            missedMonths: 2,
                            missedAmount
                        });
                    }
                }
            } else if (asset.tenant.quality === 'good' && Math.random() < 0.10) {
                const missedMonths = 1;
                annualRent -= asset.tenant.monthlyRent * missedMonths;
                addLog(`Tenant ${asset.tenant.name} paid 1 month late for ${asset.name}.`, 'bad');
            }

            annualRent = Math.max(0, annualRent);
            user.money += annualRent;
            totalCollectedThisYear += annualRent;

            if (annualRent > 0) {
                addLog(`Collected $${annualRent.toLocaleString()} in rental income from ${asset.name}.`, 'good');
            }
        }
    });

    return totalCollectedThisYear;
}

function processTenantEvents(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant) {
            // Check if renewal was already pending from a previous turn or lease was already expired/negative
            if (asset.tenant.renewalPending || asset.tenant.leaseYears <= 0) {
                const lapsedTenantName = asset.tenant.name;
                asset.isRented = false;
                asset.tenant = null;

                // Clean up any pending lease_expiration events for this property
                if (stateRef && stateRef.gameState && Array.isArray(stateRef.gameState.pendingTenantEvents)) {
                    stateRef.gameState.pendingTenantEvents = stateRef.gameState.pendingTenantEvents.filter(
                        e => !(e.propertyId === asset.id && e.eventType === 'lease_expiration')
                    );
                }

                addLog(`Tenant ${lapsedTenantName}'s expired lease on ${asset.name} was not renewed and lapsed. Property is now vacant.`, 'neutral');
                return;
            }

            asset.tenant.leaseYears -= 1;

            if (asset.tenant.leaseYears <= 0) {
                asset.tenant.leaseYears = 0;
                // 70% chance tenant wants to renew for 1-3 years
                if (Math.random() < 0.70 && stateRef && stateRef.gameState) {
                    asset.tenant.renewalPending = true;
                    const requestedYears = Math.floor(Math.random() * 3) + 1;
                    const currentRent = asset.tenant.monthlyRent;
                    const increasedRent = Math.floor(currentRent * 1.05);

                    if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                    const alreadyQueued = stateRef.gameState.pendingTenantEvents.some(
                        e => e.eventType === 'lease_expiration' && e.propertyId === asset.id
                    );
                    if (!alreadyQueued) {
                        stateRef.gameState.pendingTenantEvents.push({
                            eventType: 'lease_expiration',
                            propertyId: asset.id,
                            propertyName: asset.name,
                            tenantId: asset.tenant.id,
                            tenantName: asset.tenant.name,
                            tenant: asset.tenant,
                            currentRent,
                            increasedRent,
                            requestedYears
                        });
                    }
                } else {
                    const expiredTenantName = asset.tenant.name;
                    asset.isRented = false;
                    asset.tenant = null;
                    addLog(`Tenant ${expiredTenantName}'s lease on ${asset.name} has expired. Property is now vacant.`, 'neutral');
                }
            } else {
                const roll = Math.random();
                if (roll < 0.15) {
                    const repairCost = Math.max(300, Math.floor(asset.value * 0.005));
                    addLog(`Tenant ${asset.tenant.name} caused property damage on ${asset.name}.`, 'bad');

                    if (stateRef && stateRef.gameState) {
                        if (!stateRef.gameState.pendingTenantEvents) stateRef.gameState.pendingTenantEvents = [];
                        const alreadyQueued = stateRef.gameState.pendingTenantEvents.some(
                            e => e.eventType === 'damage' && e.propertyId === asset.id
                        );
                        if (!alreadyQueued) {
                            stateRef.gameState.pendingTenantEvents.push({
                                eventType: 'damage',
                                propertyId: asset.id,
                                propertyName: asset.name,
                                tenantId: asset.tenant.id,
                                tenantName: asset.tenant.name,
                                tenant: asset.tenant,
                                conditionLoss: 10,
                                repairCost
                            });
                        }
                    }
                }
            }
        }
    });
}

function evictTenant(user, propertyId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot evict tenants while dead or at 0 HP." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (!property.isRented || !property.tenant) {
        return { success: false, reason: "Property has no active tenant to evict." };
    }

    const tenantName = property.tenant.name;
    property.isRented = false;
    property.tenant = null;

    return { success: true, propertyName: property.name, tenantName };
}


function calculateTotalMonthlyMortgages(user) {
    if (!user || !Array.isArray(user.assets)) return 0;
    return user.assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            return sum + (asset.mortgage.monthlyPayment || 0);
        }
        return sum;
    }, 0);
}

function canAffordMortgage(user, newMonthlyPayment) {
    if (!isAlive(user)) {
        return {
            allowed: false,
            ratio: 1.0,
            currentMortgages: 0,
            monthlyIncome: 0,
            reason: "Cannot apply for a mortgage while dead or at 0 HP."
        };
    }
    const monthlyIncome = calculateUserMonthlyIncome(user);
    if (monthlyIncome <= 0) {
        return {
            allowed: false,
            ratio: 1.0,
            currentMortgages: calculateTotalMonthlyMortgages(user),
            monthlyIncome: 0,
            reason: "You need monthly income from a job or business to qualify for a mortgage."
        };
    }
    const currentMortgages = calculateTotalMonthlyMortgages(user);
    const totalMortgagePayment = currentMortgages + newMonthlyPayment;
    const ratio = totalMortgagePayment / monthlyIncome;

    if (ratio >= 0.40) {
        return {
            allowed: false,
            ratio,
            currentMortgages,
            monthlyIncome,
            reason: `Mortgage payments would take up ${(ratio * 100).toFixed(1)}% of your monthly income (Max: 40%).`
        };
    }

    return {
        allowed: true,
        ratio,
        currentMortgages,
        monthlyIncome,
        reason: "Qualified for mortgage."
    };
}

function processMortgagePayments(user) {
    if (!user || !Array.isArray(user.assets)) return { totalPaid: 0, paidOff: [] };

    let totalPaidThisYear = 0;
    const paidOffProperties = [];

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            const annualRate = asset.mortgage.annualRate || 0.065;
            const monthlyRate = annualRate / 12;
            let paidForThisProperty = 0;

            for (let month = 0; month < 12; month++) {
                if (asset.mortgage.remainingBalance <= 0) break;

                const interestForMonth = asset.mortgage.remainingBalance * monthlyRate;
                const payoffAmount = asset.mortgage.remainingBalance + interestForMonth;
                let paymentThisMonth = asset.mortgage.monthlyPayment;

                if (payoffAmount <= paymentThisMonth) {
                    paymentThisMonth = Math.round(payoffAmount);
                    asset.mortgage.remainingBalance = 0;
                    paidForThisProperty += paymentThisMonth;
                    break;
                } else {
                    const principalThisMonth = paymentThisMonth - interestForMonth;
                    asset.mortgage.remainingBalance -= principalThisMonth;
                    paidForThisProperty += paymentThisMonth;
                }
            }

            asset.mortgage.remainingBalance = Math.max(0, Math.round(asset.mortgage.remainingBalance));
            user.money -= Math.round(paidForThisProperty);
            totalPaidThisYear += Math.round(paidForThisProperty);

            if (asset.mortgage.remainingBalance <= 0) {
                paidOffProperties.push(asset.name);
                asset.mortgage = null;
            }
        }
    });

    return { totalPaid: totalPaidThisYear, paidOff: paidOffProperties };
}

function calculatePropertyMonthlyOutflow(assets) {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            return sum + asset.mortgage.monthlyPayment;
        }
        return 0;
    }, 0);
}

function updateOwnedProperties(user) {
    if (!user || !Array.isArray(user.assets)) return;

    user.assets.forEach(asset => {
        if (asset.category === 'property') {
            delete asset.activeOffer; // Invalidate any unaccepted buyer offers from previous years

            if (asset.condition === undefined) asset.condition = 100;
            if (asset.maxCondition === undefined) asset.maxCondition = 100;

            // Reset annual renovation tracking
            asset.renovatedThisYear = false;

            const decay = Math.floor(Math.random() * 3) + 2; // 2-4% condition drop per year
            asset.maxCondition = Math.max(50, asset.maxCondition - 1); // 1% permanent cap degradation per year
            asset.condition = Math.max(0, Math.min(asset.maxCondition, asset.condition - decay));

            // Value impact based on condition
            let multiplier = 1.03; // Standard 3% appreciation
            if (asset.condition < 25) {
                multiplier = 0.92; // 8% depreciation if severe disrepair
            } else if (asset.condition < 50) {
                multiplier = 0.97; // 3% depreciation if poor condition
            } else if (asset.condition < 80) {
                multiplier = 1.01; // Slower 1% appreciation if fair condition
            }

            asset.value = Math.max(10000, Math.floor(asset.value * multiplier));

            if (asset.condition < 20 && asset.condition + decay >= 20) {
                addLog(`URGENT: Your ${asset.name} is in severe disrepair (${asset.condition}% condition)!`, 'bad');
            }
        }
    });
}

function calculateMaintenanceCost(property) {
    if (!property || !property.value) return 0;
    return Math.max(250, Math.floor(property.value * 0.0075));
}

function performPropertyMaintenance(user, propertyId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot perform maintenance while dead or at 0 HP." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    if (property.condition >= property.maxCondition) {
        return { success: false, reason: "Property is already in peak maintained condition." };
    }

    const cost = calculateMaintenanceCost(property);
    if (user.money < cost) {
        return { success: false, reason: `Insufficient funds. Routine maintenance costs $${cost.toLocaleString()}.` };
    }

    user.money -= cost;
    property.condition = property.maxCondition;

    return { success: true, cost, restoredCondition: property.condition, maxCondition: property.maxCondition, propertyName: property.name };
}

function calculateRenovationOptions(property) {
    if (!property || !property.value) return [];
    const val = property.value;

    return [
        {
            id: 'minor',
            name: 'Minor Cosmetic Refresh',
            cost: Math.floor(val * 0.03),
            condGain: 20,
            maxCondGain: 10,
            valueBoostRatio: 0.04,
            desc: 'Fresh interior paint, minor repairs, and updated lighting fixtures.'
        },
        {
            id: 'major',
            name: 'Major Interior Remodel',
            cost: Math.floor(val * 0.08),
            condGain: 50,
            maxCondGain: 25,
            valueBoostRatio: 0.12,
            desc: 'Modernized kitchen, upgraded bathrooms, and premium flooring.'
        },
        {
            id: 'full',
            name: 'Full Gut Renovation',
            cost: Math.floor(val * 0.18),
            condGain: 100,
            maxCondGain: 50,
            valueBoostRatio: 0.25,
            desc: 'Complete structural overhaul, luxury high-end finishes, and full system upgrades.'
        }
    ];
}

function renovateProperty(user, propertyId, optionId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot renovate properties while dead or at 0 HP." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    // Cooldown: 1 renovation per property per year
    if (property.renovatedThisYear || (user.age !== undefined && property.lastRenovationAge === user.age)) {
        return { success: false, reason: "You have already renovated this property this year. Wait until next year to perform further renovations." };
    }

    // Pristine Condition: already at 100% condition and 100% max condition cap
    if (property.condition >= 100 && property.maxCondition >= 100) {
        return { success: false, reason: "Property is already in pristine condition (100% condition and max capacity)." };
    }

    const options = calculateRenovationOptions(property);
    const selectedOption = options.find(o => o.id === optionId);
    if (!selectedOption) return { success: false, reason: "Invalid renovation option selected." };

    if (user.money < selectedOption.cost) {
        return { success: false, reason: `Insufficient funds. ${selectedOption.name} costs $${selectedOption.cost.toLocaleString()}.` };
    }

    const oldCondition = property.condition;
    const oldMaxCondition = property.maxCondition;

    let newMaxCondition;
    let newCondition;

    if (selectedOption.id === 'full') {
        newMaxCondition = 100;
        newCondition = 100;
    } else {
        newMaxCondition = Math.min(100, oldMaxCondition + selectedOption.maxCondGain);
        newCondition = Math.min(newMaxCondition, oldCondition + selectedOption.condGain);
    }

    const condGained = Math.max(0, newCondition - oldCondition);
    const maxCondGained = Math.max(0, newMaxCondition - oldMaxCondition);
    const actualRestored = condGained + maxCondGained;
    const maxPotential = (selectedOption.condGain || 0) + (selectedOption.maxCondGain || 0);
    const restorationRatio = maxPotential > 0 ? Math.min(1.0, actualRestored / maxPotential) : 0;

    user.money -= selectedOption.cost;

    property.condition = newCondition;
    property.maxCondition = newMaxCondition;
    property.renovatedThisYear = true;
    property.lastRenovationAge = user.age;
    delete property.activeOffer; // Invalidate any existing buyer offers since valuation changed

    const valueIncrease = Math.floor(property.value * selectedOption.valueBoostRatio * restorationRatio);
    property.value += valueIncrease;

    return {
        success: true,
        cost: selectedOption.cost,
        optionName: selectedOption.name,
        propertyName: property.name,
        newCondition: property.condition,
        newMaxCondition: property.maxCondition,
        newValue: property.value,
        valueIncrease,
        restorationRatio
    };
}

function calculatePropertySaleTiers(property) {
    if (!property || !property.value) return [];
    const val = property.value;

    return [
        {
            id: 'below',
            name: 'Below Market Value',
            price: Math.floor(val * 0.85),
            chance: 0.95,
            desc: 'Discounted pricing to attract fast, eager buyers.'
        },
        {
            id: 'slightly_below',
            name: 'Slightly Below Market Value',
            price: Math.floor(val * 0.95),
            chance: 0.85,
            desc: 'Competitive price for a quick and reliable sale.'
        },
        {
            id: 'at_market',
            name: 'At Market Value',
            price: val,
            chance: 0.70,
            desc: 'Accurately priced according to current market comps.'
        },
        {
            id: 'slightly_above',
            name: 'Slightly Above Market Value',
            price: Math.floor(val * 1.08),
            chance: 0.45,
            desc: 'Targeted at interested buyers willing to pay extra.'
        },
        {
            id: 'above',
            name: 'Above Market Value',
            price: Math.floor(val * 1.18),
            chance: 0.25,
            desc: 'Premium pricing aimed at maximizing total profit.'
        }
    ];
}

function generatePropertyBuyerOffer(property, tierId) {
    if (!property || !property.value) return { hasOffer: false };
    const tiers = calculatePropertySaleTiers(property);
    const selectedTier = tiers.find(t => t.id === tierId) || tiers[2];

    const roll = Math.random();
    if (roll > selectedTier.chance) {
        delete property.activeOffer;
        return { hasOffer: false, tierName: selectedTier.name, listPrice: selectedTier.price };
    }

    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const buyerName = `${getRandomFirstName(gender)} ${getLastName()}`;
    const buyerAge = Math.floor(Math.random() * 30) + 28;
    const seed = `buyer_${property.id}_${Date.now()}_${Math.random()}`;
    const appearance = AvatarLogic.generateRandomAppearance(seed, gender);

    const buyer = {
        name: buyerName,
        gender,
        age: buyerAge,
        appearance
    };

    const offerAmount = selectedTier.price;
    const remainingMortgage = (property.mortgage && property.mortgage.remainingBalance > 0) ? property.mortgage.remainingBalance : 0;
    const netProceeds = Math.max(0, offerAmount - remainingMortgage);

    property.activeOffer = {
        offerAmount,
        buyer,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        timestamp: Date.now()
    };

    return {
        hasOffer: true,
        buyer,
        offerAmount,
        remainingMortgage,
        netProceeds,
        tierName: selectedTier.name
    };
}

function completePropertySale(user, propertyId, offerAmount) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot sell properties while dead or at 0 HP." };
    const index = user.assets.findIndex(a => a.id === propertyId);
    if (index === -1) return { success: false, reason: "Property not found." };

    const property = user.assets[index];

    // Security check (C-9): Never trust client-supplied offer amounts.
    // Sale price must strictly come from the verified activeOffer stored on the property state.
    if (!property.activeOffer || typeof property.activeOffer.offerAmount !== 'number' || !isFinite(property.activeOffer.offerAmount) || property.activeOffer.offerAmount <= 0) {
        return { success: false, reason: "No valid active offer found for this property." };
    }

    const verifiedOfferAmount = property.activeOffer.offerAmount;
    const buyerName = property.activeOffer.buyer?.name || "the buyer";
    const remainingMortgage = (property.mortgage && property.mortgage.remainingBalance > 0) ? property.mortgage.remainingBalance : 0;
    const netProceeds = verifiedOfferAmount - remainingMortgage;

    user.money += netProceeds;
    user.assets.splice(index, 1);

    return {
        success: true,
        propertyName: property.name,
        buyerName,
        offerAmount: verifiedOfferAmount,
        remainingMortgage,
        netProceeds
    };
}

// --- INVESTMENTS & STOCK MARKET SYSTEM ---
const INITIAL_STOCKS = [
    {
        symbol: 'AETH',
        name: 'Aether Tech',
        sector: 'Technology',
        basePrice: 180,
        price: 180,
        prevPrice: 180,
        volatility: 0.22,
        dividendYield: 0.0,
        desc: 'Global AI, semiconductor, and hardware innovation pioneer.',
        icon: 'fa-microchip',
        color: 'text-cyan-400',
        priceHistory: [165, 172, 168, 175, 180]
    },
    {
        symbol: 'BYTE',
        name: 'Byte Dynamics',
        sector: 'Cybersecurity',
        basePrice: 95,
        price: 95,
        prevPrice: 95,
        volatility: 0.18,
        dividendYield: 0.005,
        desc: 'Enterprise cloud infrastructure and cybersecurity solutions.',
        icon: 'fa-shield-halved',
        color: 'text-indigo-400',
        priceHistory: [88, 90, 92, 91, 95]
    },
    {
        symbol: 'CURE',
        name: 'BioCure Labs',
        sector: 'Healthcare & Biotech',
        basePrice: 45,
        price: 45,
        prevPrice: 45,
        volatility: 0.32,
        dividendYield: 0.0,
        desc: 'Clinical biotech firm developing novel gene therapies.',
        icon: 'fa-dna',
        color: 'text-emerald-400',
        priceHistory: [38, 52, 41, 48, 45]
    },
    {
        symbol: 'VND',
        name: 'Vanguard Shield',
        sector: 'Financials',
        basePrice: 120,
        price: 120,
        prevPrice: 120,
        volatility: 0.10,
        dividendYield: 0.032,
        desc: 'Global investment banking, wealth management & insurance.',
        icon: 'fa-building-columns',
        color: 'text-amber-400',
        priceHistory: [112, 115, 117, 118, 120]
    },
    {
        symbol: 'SOLR',
        name: 'Solaris Energy',
        sector: 'Renewable Energy',
        basePrice: 65,
        price: 65,
        prevPrice: 65,
        volatility: 0.24,
        dividendYield: 0.010,
        desc: 'Solar panel manufacturer and grid battery storage operator.',
        icon: 'fa-sun',
        color: 'text-yellow-400',
        priceHistory: [55, 60, 58, 62, 65]
    },
    {
        symbol: 'APEX',
        name: 'Apex Petroleum',
        sector: 'Energy',
        basePrice: 110,
        price: 110,
        prevPrice: 110,
        volatility: 0.15,
        dividendYield: 0.045,
        desc: 'Multinational oil exploration, natural gas & refining conglomerate.',
        icon: 'fa-oil-well',
        color: 'text-orange-400',
        priceHistory: [102, 105, 108, 104, 110]
    },
    {
        symbol: 'SHOP',
        name: 'HyperCart Retail',
        sector: 'Consumer Goods',
        basePrice: 140,
        price: 140,
        prevPrice: 140,
        volatility: 0.12,
        dividendYield: 0.018,
        desc: 'E-commerce logistics powerhouse and omni-channel retail chain.',
        icon: 'fa-cart-shopping',
        color: 'text-blue-400',
        priceHistory: [130, 134, 136, 138, 140]
    },
    {
        symbol: 'ORBT',
        name: 'OrbitX Aerospace',
        sector: 'Aerospace & Defense',
        basePrice: 210,
        price: 210,
        prevPrice: 210,
        volatility: 0.16,
        dividendYield: 0.020,
        desc: 'Satellite launch systems and defense technology contractor.',
        icon: 'fa-rocket',
        color: 'text-purple-400',
        priceHistory: [195, 200, 204, 208, 210]
    },
    {
        symbol: 'PIX',
        name: 'Pixelverse Media',
        sector: 'Entertainment',
        basePrice: 75,
        price: 75,
        prevPrice: 75,
        volatility: 0.19,
        dividendYield: 0.012,
        desc: 'Global media franchise, video streaming network, and interactive gaming.',
        icon: 'fa-gamepad',
        color: 'text-pink-400',
        priceHistory: [68, 70, 72, 74, 75]
    },
    {
        symbol: 'APXS',
        name: 'Apex Semiconductor',
        sector: 'Technology',
        basePrice: 145,
        price: 145,
        prevPrice: 145,
        volatility: 0.25,
        dividendYield: 0.010,
        desc: 'Precision microchip fabrication and foundry partner for mobile & auto tech.',
        icon: 'fa-microchip',
        color: 'text-cyan-400',
        priceHistory: [132, 138, 140, 142, 145]
    },
    {
        symbol: 'NEUR',
        name: 'NeuralNet AI',
        sector: 'Technology',
        basePrice: 230,
        price: 230,
        prevPrice: 230,
        volatility: 0.30,
        dividendYield: 0.0,
        desc: 'Autonomous AI models, robotics intelligence, and enterprise automation.',
        icon: 'fa-brain',
        color: 'text-cyan-300',
        priceHistory: [190, 210, 205, 220, 230]
    },
    {
        symbol: 'ZTRS',
        name: 'ZeroTrust Systems',
        sector: 'Cybersecurity',
        basePrice: 82,
        price: 82,
        prevPrice: 82,
        volatility: 0.19,
        dividendYield: 0.0,
        desc: 'Identity verification and zero-trust perimeter protection software.',
        icon: 'fa-lock',
        color: 'text-indigo-400',
        priceHistory: [75, 78, 76, 80, 82]
    },
    {
        symbol: 'GENO',
        name: 'Genova Pharma',
        sector: 'Healthcare & Biotech',
        basePrice: 115,
        price: 115,
        prevPrice: 115,
        volatility: 0.16,
        dividendYield: 0.022,
        desc: 'Pharmaceutical giant specializing in rare immunology & cardiology treatments.',
        icon: 'fa-pills',
        color: 'text-emerald-400',
        priceHistory: [108, 110, 112, 114, 115]
    },
    {
        symbol: 'PLSE',
        name: 'Pulse Medical',
        sector: 'Healthcare & Biotech',
        basePrice: 78,
        price: 78,
        prevPrice: 78,
        volatility: 0.14,
        dividendYield: 0.015,
        desc: 'Surgical robotics, cardiac implants, and diagnostic monitoring systems.',
        icon: 'fa-heart-pulse',
        color: 'text-emerald-300',
        priceHistory: [72, 74, 75, 76, 78]
    },
    {
        symbol: 'PRUD',
        name: 'Prudential Trust',
        sector: 'Financials',
        basePrice: 155,
        price: 155,
        prevPrice: 155,
        volatility: 0.08,
        dividendYield: 0.038,
        desc: 'Commercial insurance underwriting and institutional asset management.',
        icon: 'fa-vault',
        color: 'text-amber-400',
        priceHistory: [148, 150, 152, 153, 155]
    },
    {
        symbol: 'FTG',
        name: 'FinTech Global',
        sector: 'Financials',
        basePrice: 62,
        price: 62,
        prevPrice: 62,
        volatility: 0.21,
        dividendYield: 0.008,
        desc: 'Digital payment gateway, merchant acquiring, and mobile banking app.',
        icon: 'fa-credit-card',
        color: 'text-amber-300',
        priceHistory: [54, 58, 56, 60, 62]
    },
    {
        symbol: 'HYDR',
        name: 'HydroPower Systems',
        sector: 'Renewable Energy',
        basePrice: 42,
        price: 42,
        prevPrice: 42,
        volatility: 0.20,
        dividendYield: 0.012,
        desc: 'Hydroelectric dam turbines and green hydrogen fuel storage solutions.',
        icon: 'fa-water',
        color: 'text-yellow-400',
        priceHistory: [36, 38, 40, 39, 42]
    },
    {
        symbol: 'TITN',
        name: 'Titan Power & Gas',
        sector: 'Energy',
        basePrice: 88,
        price: 88,
        prevPrice: 88,
        volatility: 0.11,
        dividendYield: 0.042,
        desc: 'Regulated electric power utility and regional natural gas pipelines.',
        icon: 'fa-bolt',
        color: 'text-orange-400',
        priceHistory: [82, 84, 85, 86, 88]
    },
    {
        symbol: 'WEAR',
        name: 'OmniWear Apparel',
        sector: 'Consumer Goods',
        basePrice: 55,
        price: 55,
        prevPrice: 55,
        volatility: 0.15,
        dividendYield: 0.025,
        desc: 'Global athletic footwear, sportswear brands, and outdoor gear.',
        icon: 'fa-shirt',
        color: 'text-blue-400',
        priceHistory: [50, 52, 51, 53, 55]
    },
    {
        symbol: 'FBITE',
        name: 'FreshBite Foods',
        sector: 'Consumer Goods',
        basePrice: 68,
        price: 68,
        prevPrice: 68,
        volatility: 0.09,
        dividendYield: 0.030,
        desc: 'Packaged organic foods, beverage distribution, and grocery brand portfolio.',
        icon: 'fa-utensils',
        color: 'text-blue-300',
        priceHistory: [64, 65, 66, 67, 68]
    },
    {
        symbol: 'STEL',
        name: 'Stellar Propulsion',
        sector: 'Aerospace & Defense',
        basePrice: 175,
        price: 175,
        prevPrice: 175,
        volatility: 0.17,
        dividendYield: 0.018,
        desc: 'Jet engines, hypersonic test vehicles, and military flight systems.',
        icon: 'fa-plane',
        color: 'text-purple-400',
        priceHistory: [160, 166, 168, 172, 175]
    },
    {
        symbol: 'STRM',
        name: 'StreamMax Global',
        sector: 'Entertainment',
        basePrice: 52,
        price: 52,
        prevPrice: 52,
        volatility: 0.22,
        dividendYield: 0.005,
        desc: 'Subscription video-on-demand platform and live sports broadcasting.',
        icon: 'fa-tv',
        color: 'text-pink-400',
        priceHistory: [45, 48, 47, 50, 52]
    }
];

const BLOG_TEMPLATES = [
    {
        symbol: 'AETH',
        bullish: {
            title: 'Aether Tech AI Chip Leak Crushes Benchmarks',
            author: 'TechInsider Blog',
            excerpt: 'Insiders report Aether Tech’s next-gen neural processing units are outperforming competitors by 40%. Wall Street analysts are raising target estimates ahead of release.',
            impact: 0.28
        },
        bearish: {
            title: 'Supply Shortages Cripple Aether Tech Production',
            author: 'Silicon Wire',
            excerpt: 'Global wafer shortages and fabrication delays are projected to push back Aether Tech’s major product rollout, triggering analyst downgrades.',
            impact: -0.25
        }
    },
    {
        symbol: 'BYTE',
        bullish: {
            title: 'Cybersecurity Surge: Byte Dynamics Signs Multi-Billion Enterprise Deals',
            author: 'Cloud & Security Journal',
            excerpt: 'A surge in enterprise security mandates has led Byte Dynamics to record high recurring revenue growth this quarter.',
            impact: 0.22
        },
        bearish: {
            title: 'Price War Threatens Byte Dynamics Margins',
            author: 'Enterprise Tech Watch',
            excerpt: 'Aggressive price discounting by cloud rivals is putting pressure on Byte Dynamics’ software subscription margins.',
            impact: -0.20
        }
    },
    {
        symbol: 'CURE',
        bullish: {
            title: 'FDA Grants Breakthrough Status to BioCure Oncology Drug',
            author: 'BioPharma Daily',
            excerpt: 'BioCure Labs received expedited FDA review approval for its promising gene therapy treatment, sparking immense investor optimism.',
            impact: 0.40
        },
        bearish: {
            title: 'BioCure Labs Phase 3 Trial Fails Efficacy Thresholds',
            author: 'Biotech Clinical Review',
            excerpt: 'Trial data for BioCure’s lead candidate fell short of primary endpoints, causing concerns over trial continuation.',
            impact: -0.38
        }
    },
    {
        symbol: 'VND',
        bullish: {
            title: 'Vanguard Shield Posts Record Trading Income',
            author: 'Wall Street Chronicle',
            excerpt: 'Higher interest margins and robust investment banking activity drove net profits to historic highs for Vanguard Shield.',
            impact: 0.15
        },
        bearish: {
            title: 'Commercial Credit Defaults Drag Vanguard Shield Profits',
            author: 'Financial Times',
            excerpt: 'Vanguard Shield announced increased provisions for loan losses due to stress in commercial property portfolios.',
            impact: -0.16
        }
    },
    {
        symbol: 'SOLR',
        bullish: {
            title: 'Solaris Energy Awarded Massive Federal Grid Grant',
            author: 'Green Energy Outlook',
            excerpt: 'Solaris Energy will supply battery storage systems for a state-wide clean energy overhaul, bolstering long-term revenue backlog.',
            impact: 0.30
        },
        bearish: {
            title: 'Tariff Escalation Hits Solaris Energy Supply Chain',
            author: 'Renewable Business Weekly',
            excerpt: 'Raw material import tariffs on rare earth minerals threaten solar cell production costs for Solaris Energy.',
            impact: -0.24
        }
    },
    {
        symbol: 'APEX',
        bullish: {
            title: 'OPEC Output Cuts Rally Crude Prices; Apex Petroleum Outperforms',
            author: 'Commodity Trader Monthly',
            excerpt: 'Tight global crude supplies and new offshore strikes position Apex Petroleum for strong free cash flow and dividend hikes.',
            impact: 0.20
        },
        bearish: {
            title: 'Regulatory Crackdowns Target Apex Petroleum Offshore Drilling',
            author: 'Energy Market Monitor',
            excerpt: 'Environmental compliance costs and offshore drilling restrictions are pressuring Apex Petroleum’s exploration guidance.',
            impact: -0.18
        }
    },
    {
        symbol: 'SHOP',
        bullish: {
            title: 'HyperCart Retail Reports Monster Holiday Shopping Figures',
            author: 'Consumer Retail Digest',
            excerpt: 'Record e-commerce order volumes and same-day delivery expansion drove HyperCart’s quarterly earnings past consensus.',
            impact: 0.18
        },
        bearish: {
            title: 'Consumer Spending Slowdown Bites HyperCart Logistics',
            author: 'Retail Analyst Weekly',
            excerpt: 'Softening consumer confidence and elevated freight expenditures weigh heavily on HyperCart Retail’s operating outlook.',
            impact: -0.17
        }
    },
    {
        symbol: 'ORBT',
        bullish: {
            title: 'OrbitX Aerospace Secures $4.5B Defense Satellite Contract',
            author: 'Defense Tech Insider',
            excerpt: 'The Department of Defense awarded OrbitX Aerospace a massive contract for next-gen satellite launch infrastructure.',
            impact: 0.25
        },
        bearish: {
            title: 'Payload Anomaly Triggers Delay for OrbitX Orbital Launch',
            author: 'Space Operations Journal',
            excerpt: 'Pre-flight technical glitches have grounded OrbitX’s flagship rocket booster, delaying lucrative commercial missions.',
            impact: -0.22
        }
    },
    {
        symbol: 'PIX',
        bullish: {
            title: 'Pixelverse Media Franchise Launch Breaks Entertainment Records',
            author: 'Hollywood & Gaming Review',
            excerpt: 'Pixelverse Media’s blockbuster game release and companion streaming series drove unprecedented subscriber growth.',
            impact: 0.26
        },
        bearish: {
            title: 'Streaming Subscriber Churn Hits Pixelverse Media',
            author: 'Digital Media Trends',
            excerpt: 'Heightened competition in digital streaming led to unexpected subscriber cancellations for Pixelverse Media.',
            impact: -0.21
        }
    }
];

function ensureInvestmentState(user) {
    if (!user.investments) {
        user.investments = {
            savings: 0,
            stocks: {},
            stockMarket: JSON.parse(JSON.stringify(INITIAL_STOCKS)),
            blogPosts: []
        };
    }
    if (typeof user.investments.savings !== 'number') user.investments.savings = 0;
    if (!user.investments.stocks) user.investments.stocks = {};
    if (!user.investments.stockMarket || user.investments.stockMarket.length === 0) {
        user.investments.stockMarket = JSON.parse(JSON.stringify(INITIAL_STOCKS));
    }
    if (!user.investments.blogPosts) user.investments.blogPosts = [];
    
    // Ensure all initial stocks are present in market
    INITIAL_STOCKS.forEach(initStock => {
        const existing = user.investments.stockMarket.find(s => s.symbol === initStock.symbol);
        if (!existing) {
            user.investments.stockMarket.push(JSON.parse(JSON.stringify(initStock)));
        } else {
            if (!existing.priceHistory) existing.priceHistory = [existing.price || initStock.basePrice];
        }
    });

    if (user.age >= 18 && user.investments.blogPosts.length === 0) {
        user.investments.blogPosts = generateInvestmentBlogPosts(user.investments.stockMarket, user.age);
    }
}

function generateInvestmentBlogPosts(stockMarket, age) {
    const shuffled = [...BLOG_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    return selected.map((tpl, i) => {
        const isBullish = Math.random() < 0.5;
        const data = isBullish ? tpl.bullish : tpl.bearish;
        const stock = stockMarket.find(s => s.symbol === tpl.symbol);

        return {
            id: `blog_${age}_${i}_${Date.now()}`,
            title: data.title,
            author: data.author,
            symbol: tpl.symbol,
            stockName: stock ? stock.name : tpl.symbol,
            sector: stock ? stock.sector : 'General',
            sentiment: isBullish ? 'bullish' : 'bearish',
            impact: data.impact,
            excerpt: data.excerpt,
            age: age
        };
    });
}

function processInvestmentsAgeUp(user) {
    ensureInvestmentState(user);

    // 1. High-Yield Savings 3.5% APY compounding
    let savingsInterest = 0;
    if (user.investments.savings > 0) {
        savingsInterest = Math.floor(user.investments.savings * 0.035);
        user.investments.savings += savingsInterest;
        if (savingsInterest > 0) {
            addLog(`Your High-Yield Savings Account earned $${savingsInterest.toLocaleString()} in interest (3.5% APY).`, 'good');
        }
    }

    // 2. Stock Market Annual Price Simulation
    const generalMarketDrift = (Math.random() - 0.47) * 0.08; // mild bullish market bias
    const activeBlogs = user.investments.blogPosts || [];
    let totalDividends = 0;

    user.investments.stockMarket.forEach(stock => {
        // Check for active blog hint for this stock
        const hint = activeBlogs.find(b => b.symbol === stock.symbol);
        const hintImpact = hint ? hint.impact : 0;

        const randomNoise = (Math.random() + Math.random() - 1.0) * (stock.volatility || 0.15);

        const totalPctChange = generalMarketDrift + randomNoise + hintImpact;
        const clampedChange = Math.max(-0.55, Math.min(0.75, totalPctChange));

        stock.prevPrice = stock.price;
        const newPrice = Math.max(2.50, Math.round((stock.price * (1 + clampedChange)) * 100) / 100);
        stock.price = newPrice;

        if (!stock.priceHistory) stock.priceHistory = [];
        stock.priceHistory.push(newPrice);
        if (stock.priceHistory.length > 8) {
            stock.priceHistory.shift();
        }

        // Dividend payout if user owns shares
        const holding = user.investments.stocks[stock.symbol];
        if (holding && holding.shares > 0 && stock.dividendYield > 0) {
            const divAmount = Math.floor(holding.shares * stock.price * stock.dividendYield);
            if (divAmount > 0) {
                user.money += divAmount;
                totalDividends += divAmount;
            }
        }
    });

    if (totalDividends > 0) {
        addLog(`Received $${totalDividends.toLocaleString()} in cash dividends from your stock portfolio!`, 'good');
    }

    // 3. Generate NEW blog posts for next year
    user.investments.blogPosts = generateInvestmentBlogPosts(user.investments.stockMarket, user.age);
}

function buyStock(user, symbol, quantity) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot trade stocks while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const sharesToBuy = parseInt(quantity, 10);
    if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
        return { success: false, msg: 'Invalid share quantity.' };
    }

    const stock = user.investments.stockMarket.find(s => s.symbol === symbol);
    if (!stock) {
        return { success: false, msg: 'Stock not found.' };
    }

    const totalCost = Math.round(stock.price * sharesToBuy);
    if (user.money < totalCost) {
        return { success: false, msg: `Insufficient funds. You need $${totalCost.toLocaleString()} to buy ${sharesToBuy} shares of ${symbol}.` };
    }

    user.money -= totalCost;
    if (!user.investments.stocks[symbol]) {
        user.investments.stocks[symbol] = { shares: 0, totalCost: 0 };
    }

    user.investments.stocks[symbol].shares += sharesToBuy;
    user.investments.stocks[symbol].totalCost += totalCost;

    return {
        success: true,
        msg: `Successfully purchased ${sharesToBuy} shares of ${stock.name} (${symbol}) for $${totalCost.toLocaleString()}.`
    };
}

function sellStock(user, symbol, quantity) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot trade stocks while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const sharesToSell = parseInt(quantity, 10);
    if (isNaN(sharesToSell) || sharesToSell <= 0) {
        return { success: false, msg: 'Invalid share quantity.' };
    }

    const holding = user.investments.stocks[symbol];
    if (!holding || holding.shares < sharesToSell) {
        return { success: false, msg: `You do not own ${sharesToSell} shares of ${symbol}.` };
    }

    const stock = user.investments.stockMarket.find(s => s.symbol === symbol);
    if (!stock) {
        return { success: false, msg: 'Stock not found.' };
    }

    const totalProceeds = Math.round(stock.price * sharesToSell);
    const avgCostPerShare = holding.totalCost / holding.shares;
    const costBasisRemoved = Math.round(avgCostPerShare * sharesToSell);

    user.money += totalProceeds;
    holding.shares -= sharesToSell;
    holding.totalCost -= costBasisRemoved;

    if (holding.shares <= 0) {
        delete user.investments.stocks[symbol];
    }

    return {
        success: true,
        msg: `Successfully sold ${sharesToSell} shares of ${stock.name} (${symbol}) for $${totalProceeds.toLocaleString()}.`
    };
}

function depositSavings(user, amount) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot manage savings while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const depositAmt = parseInt(amount, 10);
    if (isNaN(depositAmt) || depositAmt <= 0) {
        return { success: false, msg: 'Invalid deposit amount.' };
    }

    if (user.money < depositAmt) {
        return { success: false, msg: 'Insufficient cash funds available.' };
    }

    user.money -= depositAmt;
    user.investments.savings += depositAmt;

    return {
        success: true,
        msg: `Deposited $${depositAmt.toLocaleString()} into High-Yield Savings.`
    };
}

function withdrawSavings(user, amount) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot manage savings while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const withdrawAmt = parseInt(amount, 10);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
        return { success: false, msg: 'Invalid withdrawal amount.' };
    }

    if (user.investments.savings < withdrawAmt) {
        return { success: false, msg: 'Insufficient funds in High-Yield Savings.' };
    }

    user.investments.savings -= withdrawAmt;
    user.money += withdrawAmt;

    return {
        success: true,
        msg: `Withdrew $${withdrawAmt.toLocaleString()} from High-Yield Savings.`
    };
}

const RELOCATION_COST = 2000;

function getPartner(user) {
    if (!user || !user.relationships) return null;
    return user.relationships.find(r => 
        r.category === 'partner' || 
        r.category === 'spouse' || 
        ['Girlfriend', 'Boyfriend', 'Partner', 'Fiancé', 'Fiancée', 'Fiance', 'Wife', 'Husband', 'Spouse'].includes(r.type)
    ) || null;
}

function calculatePartnerRelocateAcceptance(partner, rollOverride = null) {
    if (!partner) return false;
    const status = partner.status || 50;
    let baseChance = 0.50;
    if (status >= 80) baseChance = 0.85;
    else if (status >= 60) baseChance = 0.70;
    else if (status >= 40) baseChance = 0.50;
    else baseChance = 0.25;

    const roll = rollOverride !== null ? rollOverride : Math.random();
    return roll < baseChance;
}

function breakUpWithPartner(user, partner) {
    if (!isAlive(user) || !partner) return;
    partner.category = 'ex';
    if (['Spouse', 'Husband', 'Wife'].includes(partner.type) || partner.category === 'spouse') {
        partner.type = partner.gender === 'male' ? 'Ex-Husband' : 'Ex-Wife';
    } else if (['Fiancé', 'Fiancée', 'Fiance'].includes(partner.type)) {
        partner.type = 'Ex-Fiancé';
    } else {
        partner.type = partner.gender === 'male' ? 'Ex-Boyfriend' : 'Ex-Girlfriend';
    }
}

function canMoveCountry(user, targetCountry, targetCity = null) {
    if (!user) return { allowed: false, reason: "No character data found." };
    if (!isAlive(user)) return { allowed: false, reason: "Cannot relocate while dead or at 0 HP." };
    if ((user.age || 0) < 18) return { allowed: false, reason: "You must be at least 18 years old to relocate to a new country." };
    if (targetCountry && user.country === targetCountry) return { allowed: false, reason: `You are already living in ${targetCountry}.` };
    if (targetCity && user.city === targetCity) return { allowed: false, reason: `You are already living in ${targetCity}.` };
    if ((user.money || 0) < RELOCATION_COST) return { allowed: false, reason: `You need at least $${RELOCATION_COST.toLocaleString()} to move to a new country.` };
    return { allowed: true };
}

function moveCountry(user, targetCountry, targetCity) {
    if (!isAlive(user)) return { success: false, message: "Cannot relocate while dead or at 0 HP." };
    const check = canMoveCountry(user, targetCountry, targetCity);
    if (!check.allowed) return { success: false, message: check.reason };

    const hadJob = !!user.jobTitle;
    const oldJobTitle = user.jobTitle;

    user.money -= RELOCATION_COST;
    user.country = targetCountry;
    user.city = targetCity;

    if (hadJob) {
        user.jobTitle = null;
        user.jobSalary = 0;
        user.jobPerformance = 50;
        user.careerActionTaken = false;
        user.careerTrack = null;
        user.careerLevel = 0;
        user.yearsInRole = 0;
        user.consecutivePoorYears = 0;
        user.hasSeenJobSalary = false;
    }

    const jobMsg = hadJob ? ` You lost your job as ${oldJobTitle} and are now unemployed.` : '';

    return {
        success: true,
        cost: RELOCATION_COST,
        newCountry: targetCountry,
        newCity: targetCity,
        hadJob,
        oldJobTitle,
        message: `Relocated to ${targetCity}, ${targetCountry} for $${RELOCATION_COST.toLocaleString()}.${jobMsg}`
    };
}

const NPC_MAJORS = [
    "Psychology", "Computer Science", "English", "Education", "Marketing",
    "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
    "Political Science", "Criminal Justice", "Communications", "Pharmacy"
];

const NPC_CAREER_TRACKS = [
    {
        key: 'retail', majors: ['Marketing', 'Business', 'Communications'],
        levels: [
            { title: 'Cashier', salary: 28000 },
            { title: 'Sales Associate', salary: 34000 },
            { title: 'Team Lead', salary: 45000 },
            { title: 'Store Manager', salary: 65000 },
            { title: 'District Manager', salary: 100000 }
        ]
    },
    {
        key: 'food_service', majors: [],
        levels: [
            { title: 'Line Cook', salary: 30000 },
            { title: 'Cook', salary: 38000 },
            { title: 'Sous Chef', salary: 52000 },
            { title: 'Head Chef', salary: 75000 },
            { title: 'Executive Chef', salary: 95000 }
        ]
    },
    {
        key: 'trades', majors: [],
        levels: [
            { title: 'Trade Helper', salary: 32000 },
            { title: 'Apprentice', salary: 42000 },
            { title: 'Journeyman', salary: 60000 },
            { title: 'Foreman', salary: 78000 },
            { title: 'Master Tradesperson', salary: 100000 }
        ]
    },
    {
        key: 'law_enforcement', majors: ['Criminal Justice'],
        levels: [
            { title: 'Patrol Officer', salary: 55000 },
            { title: 'Detective', salary: 70000 },
            { title: 'Sergeant', salary: 85000 },
            { title: 'Lieutenant', salary: 100000 },
            { title: 'Police Captain', salary: 120000 }
        ]
    },
    {
        key: 'fire_service', majors: [],
        levels: [
            { title: 'Firefighter', salary: 48000 },
            { title: 'Driver/Engineer', salary: 62000 },
            { title: 'Fire Lieutenant', salary: 76000 },
            { title: 'Fire Captain', salary: 90000 },
            { title: 'Fire Chief', salary: 105000 }
        ]
    },
    {
        key: 'logistics', majors: ['Business'],
        levels: [
            { title: 'Delivery Driver', salary: 35000 },
            { title: 'Senior Driver', salary: 45000 },
            { title: 'Dispatch Coordinator', salary: 60000 },
            { title: 'Logistics Manager', salary: 82000 },
            { title: 'VP of Logistics', salary: 110000 }
        ]
    },
    {
        key: 'software_eng', majors: ['Computer Science'],
        levels: [
            { title: 'Jr. Software Developer', salary: 50000 },
            { title: 'Software Developer', salary: 72000 },
            { title: 'Senior Developer', salary: 100000 },
            { title: 'Lead Engineer', salary: 135000 },
            { title: 'Engineering Director', salary: 175000 }
        ]
    },
    {
        key: 'graphic_design', majors: ['Graphic Design'],
        levels: [
            { title: 'Junior Designer', salary: 45000 },
            { title: 'Graphic Designer', salary: 58000 },
            { title: 'Senior Designer', salary: 75000 },
            { title: 'Art Director', salary: 100000 },
            { title: 'Creative Director', salary: 130000 }
        ]
    },
    {
        key: 'education_track', majors: ['Education', 'English'],
        levels: [
            { title: 'Teacher', salary: 40000 },
            { title: 'Senior Teacher', salary: 52000 },
            { title: 'Department Chair', salary: 70000 },
            { title: 'Vice Principal', salary: 90000 },
            { title: 'Principal', salary: 110000 }
        ]
    },
    {
        key: 'nursing', majors: ['Nursing', 'Biology'],
        levels: [
            { title: 'Registered Nurse', salary: 50000 },
            { title: 'Charge Nurse', salary: 65000 },
            { title: 'Nurse Manager', salary: 85000 },
            { title: 'Director of Nursing', salary: 110000 },
            { title: 'Chief Nursing Officer', salary: 150000 }
        ]
    },
    {
        key: 'banking', majors: ['Business', 'Marketing', 'Psychology'],
        levels: [
            { title: 'Bank Teller', salary: 42000 },
            { title: 'Loan Officer', salary: 55000 },
            { title: 'Branch Manager', salary: 80000 },
            { title: 'VP of Banking', salary: 120000 },
            { title: 'Chief Banking Officer', salary: 190000 }
        ]
    },
    {
        key: 'law', majors: ['Political Science'],
        levels: [
            { title: 'Law Clerk', salary: 70000 },
            { title: 'Associate Attorney', salary: 100000 },
            { title: 'Junior Partner', salary: 145000 },
            { title: 'Senior Partner', salary: 200000 },
            { title: 'Managing Partner', salary: 250000 }
        ]
    },
    {
        key: 'medicine', majors: ['Biology', 'Chemistry'],
        levels: [
            { title: 'Resident', salary: 65000 },
            { title: 'Staff Physician', salary: 120000 },
            { title: 'Attending Physician', salary: 200000 },
            { title: 'Department Head', salary: 280000 },
            { title: 'Chief of Medicine', salary: 350000 }
        ]
    }
];

function generateNPCOccupation(age, city = null) {
    if (age === undefined || age === null) age = 18;

    if (age < 5) {
        return {
            occupation: age === 0 ? "Baby" : "Toddler",
            occupationType: 'school',
            educationLevel: 'None',
            income: 0
        };
    }
    if (age >= 5 && age <= 11) {
        return {
            occupation: "Elementary Student",
            occupationType: 'school',
            educationLevel: 'Elementary',
            income: 0
        };
    }
    if (age >= 12 && age <= 13) {
        return {
            occupation: "Middle School Student",
            occupationType: 'school',
            educationLevel: 'Middle School',
            income: 0
        };
    }
    if (age >= 14 && age <= 17) {
        return {
            occupation: "High School Student",
            occupationType: 'school',
            educationLevel: 'High School',
            schoolYear: age - 13,
            income: 0
        };
    }
    if (age >= 18 && age <= 21) {
        const roll = Math.random();
        if (roll < 0.55) {
            const major = NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)];
            return {
                occupation: `University Student (${major})`,
                occupationType: 'school',
                educationLevel: 'High School',
                schoolMajor: major,
                schoolYear: Math.max(1, age - 17),
                income: 0
            };
        } else if (roll < 0.85) {
            const entryTracks = NPC_CAREER_TRACKS.filter(t => ['retail', 'food_service', 'trades', 'logistics'].includes(t.key));
            const track = entryTracks[Math.floor(Math.random() * entryTracks.length)];
            const lvl = track.levels[0];
            const income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;
            return {
                occupation: lvl.title,
                occupationType: 'job',
                careerTrack: track.key,
                careerLevel: 0,
                income,
                educationLevel: 'High School'
            };
        } else {
            return {
                occupation: "Unemployed",
                occupationType: 'unemployed',
                educationLevel: 'High School',
                income: 0
            };
        }
    }
    if (age >= 22 && age <= 64) {
        const roll = Math.random();
        if (roll < 0.85) {
            const track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            let level = 0;
            if (age >= 45) {
                level = Math.floor(Math.random() * 3) + 2;
            } else if (age >= 32) {
                level = Math.floor(Math.random() * 3) + 1;
            } else {
                level = Math.floor(Math.random() * 2);
            }
            level = Math.min(level, track.levels.length - 1);
            const lvl = track.levels[level];
            const hasDegree = ['software_eng', 'graphic_design', 'education_track', 'nursing', 'banking', 'law', 'medicine'].includes(track.key);
            const major = track.majors.length > 0 ? track.majors[0] : (hasDegree ? NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)] : null);
            const income = city ? calculateScaledSalary(lvl.salary, city) : lvl.salary;

            return {
                occupation: lvl.title,
                occupationType: 'job',
                careerTrack: track.key,
                careerLevel: level,
                income,
                educationLevel: hasDegree ? 'University' : 'High School',
                schoolMajor: major
            };
        } else {
            return {
                occupation: "Unemployed",
                occupationType: 'unemployed',
                educationLevel: 'High School',
                income: 0
            };
        }
    }
    // age >= 65
    const baseRetirement = Math.floor(Math.random() * 20000) + 18000;
    const income = city ? calculateScaledSalary(baseRetirement, city) : baseRetirement;
    return {
        occupation: "Retired",
        occupationType: 'retired',
        educationLevel: 'High School',
        income
    };
}

function isCloseRelationship(person) {
    if (!person) return false;
    if (['spouse', 'partner', 'family', 'child'].includes(person.category)) return true;
    if (['Brother', 'Sister', 'Son', 'Daughter', 'Mother', 'Father', 'Boyfriend', 'Girlfriend', 'Wife', 'Husband', 'Fiancé', 'Fiancée', 'Fiance'].includes(person.type)) return true;
    return false;
}

function progressNPCOccupation(person, userAge) {
    if (!person) return null;

    if (!person.occupation) {
        Object.assign(person, generateNPCOccupation(person.age));
        return null;
    }

    const isClose = isCloseRelationship(person);
    let milestoneMessage = null;

    if (person.age === 5) {
        person.occupation = "Elementary Student";
        person.occupationType = 'school';
        person.educationLevel = 'Elementary';
        if (isClose) milestoneMessage = `${person.name} started Elementary School!`;
    } else if (person.age === 12) {
        person.occupation = "Middle School Student";
        person.occupationType = 'school';
        person.educationLevel = 'Middle School';
        if (isClose) milestoneMessage = `${person.name} started Middle School!`;
    } else if (person.age === 14) {
        person.occupation = "High School Student";
        person.occupationType = 'school';
        person.educationLevel = 'High School';
        person.schoolYear = 1;
        if (isClose) milestoneMessage = `${person.name} started High School!`;
    } else if (person.age === 18) {
        const roll = Math.random();
        if (roll < 0.55) {
            const major = NPC_MAJORS[Math.floor(Math.random() * NPC_MAJORS.length)];
            person.occupation = `University Student (${major})`;
            person.occupationType = 'school';
            person.schoolMajor = major;
            person.schoolYear = 1;
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} graduated High School and enrolled in University studying ${major}!`;
        } else if (roll < 0.85) {
            const entryTracks = NPC_CAREER_TRACKS.filter(t => ['retail', 'food_service', 'trades', 'logistics'].includes(t.key));
            const track = entryTracks[Math.floor(Math.random() * entryTracks.length)];
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated High School and started working as a ${lvl.title}!`;
        } else {
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} finished High School and is currently unemployed.`;
        }
    } else if (person.occupationType === 'school' && person.occupation && person.occupation.startsWith("University Student")) {
        person.schoolYear = (person.schoolYear || 1) + 1;
        if (person.schoolYear > 4 || person.age >= 22) {
            const major = person.schoolMajor;
            let track = NPC_CAREER_TRACKS.find(t => t.majors.includes(major));
            if (!track) {
                track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            }
            const lvl = track.levels[0];
            person.educationLevel = 'University';
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} graduated University with a degree in ${major || 'their major'} and got a job as a ${lvl.title}!`;
        }
    } else if (person.occupationType === 'job' && person.age < 65) {
        const roll = Math.random();
        const track = NPC_CAREER_TRACKS.find(t => t.key === person.careerTrack);
        if (track && (person.careerLevel || 0) < track.levels.length - 1 && roll < 0.15) {
            person.careerLevel = (person.careerLevel || 0) + 1;
            const lvl = track.levels[person.careerLevel];
            person.occupation = lvl.title;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} was promoted to ${lvl.title}!`;
        } else if (roll > 0.95) {
            person.occupation = "Unemployed";
            person.occupationType = 'unemployed';
            person.income = 0;
            if (isClose) milestoneMessage = `${person.name} became unemployed.`;
        }
    } else if (person.occupationType === 'unemployed' && person.age >= 18 && person.age < 65) {
        if (Math.random() < 0.25) {
            const track = NPC_CAREER_TRACKS[Math.floor(Math.random() * NPC_CAREER_TRACKS.length)];
            const lvl = track.levels[0];
            person.occupation = lvl.title;
            person.occupationType = 'job';
            person.careerTrack = track.key;
            person.careerLevel = 0;
            person.income = lvl.salary;
            if (isClose) milestoneMessage = `${person.name} found a job as a ${lvl.title}!`;
        }
    } else if (person.age >= 65 && person.occupationType !== 'retired') {
        person.occupation = "Retired";
        person.occupationType = 'retired';
        person.income = Math.floor((person.income || 40000) * 0.4) || 20000;
        if (isClose) milestoneMessage = `${person.name} retired from their career!`;
    }

    return milestoneMessage;
}

function calculateSpousalIncomeContribution(user) {
    if (!user || !Array.isArray(user.relationships)) return { amount: 0, spouseName: null };
    const spouse = user.relationships.find(r => r.category === 'spouse' || r.type === 'Wife' || r.type === 'Husband' || r.type === 'Spouse');
    if (!spouse) return { amount: 0, spouseName: null };

    if (!spouse.occupation) {
        Object.assign(spouse, generateNPCOccupation(spouse.age));
    }

    if (spouse.income > 0) {
        const amount = Math.floor(spouse.income * 0.50);
        return { amount, spouseName: spouse.name, spouseJob: spouse.occupation };
    }
    return { amount: 0, spouseName: spouse.name, spouseJob: spouse.occupation };
}

function ensureBusinessState(user) {
    if (!user || !user.hasBusiness) return;

    if (typeof user.isPublic !== 'boolean') user.isPublic = false;
    if (!user.hqTier) user.hqTier = 'garage';
    if (!user.marketingLevels) user.marketingLevels = { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 };
    if (!user.teamRoles) {
        const empCount = user.employees || 5;
        user.teamRoles = {
            engineering: Math.max(1, Math.ceil(empCount * 0.4)),
            sales: Math.max(1, Math.ceil(empCount * 0.2)),
            operations: Math.max(1, Math.ceil(empCount * 0.2)),
            marketing: Math.max(1, Math.ceil(empCount * 0.2))
        };
    }
    if (typeof user.equityOwned !== 'number') user.equityOwned = 1.0;
    if (!Array.isArray(user.investorShares)) user.investorShares = [];
    if (!user.corporateDebt) user.corporateDebt = { principal: 0, interestRate: 0.08, monthlyPayment: 0 };
    if (typeof user.customerSatisfaction !== 'number') user.customerSatisfaction = 75;
    if (typeof user.employeeMorale !== 'number') user.employeeMorale = 80;
    if (!Array.isArray(user.activeResearch)) user.activeResearch = [];
    if (!Array.isArray(user.businessHistory)) user.businessHistory = [];
    if (!Array.isArray(user.businessUpgrades)) user.businessUpgrades = [];
}

const MAX_COMPANY_VALUATION = 999999999999999; // $999 Trillion (Safe within Number.MAX_SAFE_INTEGER)
const MAX_COMPANY_CASH = 999999999999999;
const MAX_PLAYER_MONEY = 999999999999999;

function calculateCompanyValuation(user) {
    if (!user || !user.hasBusiness) return 0;
    ensureBusinessState(user);

    const indKey = user.industry || 'tech';
    const ind = BUSINESS_INDUSTRIES[indKey] || BUSINESS_INDUSTRIES.tech_saas || { valuationMultiple: 3.0, startupCost: 50000, unitCost: 10 };

    const recentQuarters = (user.businessHistory || []).slice(-4);
    const annualRevenue = recentQuarters.reduce((sum, q) => {
        const rev = Number(q.revenue);
        return sum + (isFinite(rev) && rev > 0 ? rev : 0);
    }, 0);
    const annualProfit = recentQuarters.reduce((sum, q) => {
        const prof = Number(q.profit);
        return sum + (isFinite(prof) && prof > 0 ? prof : 0);
    }, 0);

    const rawCash = Number(user.compCash);
    const cashValue = isFinite(rawCash) ? Math.max(0, Math.min(MAX_COMPANY_CASH, rawCash)) : 0;
    const rawInventory = Number(user.inventory);
    const inventoryCount = isFinite(rawInventory) ? Math.max(0, rawInventory) : 0;
    const inventoryValue = inventoryCount * (ind.unitCost || 10);
    const baseAssetValue = cashValue + inventoryValue;

    let revenueValuation = annualRevenue * (ind.valuationMultiple || 3.0);
    if (annualProfit > 0) {
        revenueValuation += annualProfit * 2.0;
    }

    const rep = isFinite(Number(user.businessReputation)) ? Number(user.businessReputation) : 50;
    const reputationBonus = 1 + (rep - 50) / 200;
    const minValuation = (ind.startupCost || 50000) * 1.5;

    const rawValuation = Math.floor((baseAssetValue + revenueValuation) * reputationBonus);
    const safeValuation = isFinite(rawValuation) ? rawValuation : minValuation;

    const finalValuation = Math.min(
        MAX_COMPANY_VALUATION,
        Math.max(minValuation, safeValuation)
    );

    return finalValuation;
}

function calculateBusinessOverhead(user) {
    if (!user || !user.hasBusiness) return { fixedRent: 0, empAdminOverhead: 0, debtInterest: 0, totalQuarterly: 0 };
    ensureBusinessState(user);

    const hq = HQ_TIERS.find(h => h.id === user.hqTier) || HQ_TIERS[0];
    const quarterlyRent = (hq.monthlyRent || 0) * 3;
    const empCount = user.employees || 1;
    const empAdminOverhead = empCount * 300 * 3;

    const debtInterest = Math.floor(((user.corporateDebt?.principal || 0) * (user.corporateDebt?.interestRate || 0.08)) / 4);

    const totalQuarterly = quarterlyRent + empAdminOverhead + debtInterest;

    return {
        quarterlyRent,
        empAdminOverhead,
        debtInterest,
        totalQuarterly
    };
}

function calculateVCInvestorOffers(user) {
    if (!user || !user.hasBusiness) return [];
    ensureBusinessState(user);

    if (user.isPublic) return [];

    const valuation = calculateCompanyValuation(user);
    const acceptedInvestorIds = (user.investorShares || []).map(s => s.investorId);

    return VC_INVESTOR_TYPES
        .filter(vc => valuation >= vc.minValuation && !acceptedInvestorIds.includes(vc.id))
        .map(vc => {
            const investmentAmount = Math.min(vc.maxInvestment, Math.floor(valuation * vc.equityTarget));
            const postMoneyValuation = Math.min(MAX_COMPANY_VALUATION, valuation + investmentAmount);
            const actualEquityOffered = Math.round((investmentAmount / postMoneyValuation) * 100) / 100;

            return {
                ...vc,
                offeredAmount: investmentAmount,
                equityRequired: actualEquityOffered,
                postMoneyValuation
            };
        });
}

function acceptVCOffer(user, investorId) {
    if (!user || !user.hasBusiness) return { success: false, msg: 'No active business.' };
    if (!isAlive(user)) return { success: false, msg: "Cannot accept investment offers while dead or at 0 HP." };
    ensureBusinessState(user);

    if (user.isPublic) {
        return { success: false, msg: 'Cannot accept private VC investments after going public.' };
    }

    if (user.investorShares && user.investorShares.some(s => s.investorId === investorId)) {
        return { success: false, msg: 'This investment offer has already been accepted.' };
    }

    const offers = calculateVCInvestorOffers(user);
    const offer = offers.find(o => o.id === investorId);
    if (!offer) return { success: false, msg: 'Investment offer no longer valid.' };

    const equityPct = offer.equityRequired;
    if (user.equityOwned < equityPct) {
        return { success: false, msg: `You do not own enough remaining equity (${Math.round(user.equityOwned * 100)}%) to fulfill this offer.` };
    }

    user.equityOwned = Math.round((user.equityOwned - equityPct) * 100) / 100;
    user.compCash = Math.min(MAX_COMPANY_CASH, (user.compCash || 0) + offer.offeredAmount);
    user.investorShares.push({
        investorId: offer.id,
        name: offer.name,
        equity: equityPct,
        amountInvested: offer.offeredAmount,
        year: user.companyYear || 1
    });

    return {
        success: true,
        amount: offer.offeredAmount,
        equity: equityPct,
        msg: `Successfully accepted ${Utils.formatMoney(offer.offeredAmount)} investment from ${offer.name} in exchange for ${Math.round(equityPct * 100)}% equity!`
    };
}

function launchIPO(user, floatEquity = 0.20) {
    if (!user || !user.hasBusiness) return { success: false, msg: 'No active business.' };
    if (!isAlive(user)) return { success: false, msg: "Cannot launch IPO while dead or at 0 HP." };
    ensureBusinessState(user);

    if (user.isPublic) {
        return { success: false, msg: 'Company is already publicly traded.' };
    }

    const valuation = calculateCompanyValuation(user);
    if (valuation < 25000000) {
        return { success: false, msg: `Valuation must be at least $25,000,000 to launch an IPO (Current: ${Utils.formatMoney(valuation)}).` };
    }

    const float = Math.min(user.equityOwned, floatEquity);
    if (float <= 0) {
        return { success: false, msg: 'You do not have sufficient equity to float on the public exchange.' };
    }

    const playerPayout = Math.min(MAX_PLAYER_MONEY, Math.floor(valuation * float));
    user.money = Math.min(MAX_PLAYER_MONEY, (user.money || 0) + playerPayout);
    user.equityOwned = Math.max(0, Math.round((user.equityOwned - float) * 100) / 100);
    user.isPublic = true;

    return {
        success: true,
        valuation,
        floatEquity: float,
        payout: playerPayout,
        msg: `Historic IPO! ${user.companyName} listed publicly at ${Utils.formatMoney(valuation)} valuation. You floated ${Math.round(float * 100)}% equity for ${Utils.formatMoney(playerPayout)} cash payout!`
    };
}

const CRIMES = {
    // --- MISCHIEF ---
    prank_call: { id: 'prank_call', name: 'Prank Call', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.85, payoutMin: 0, payoutMax: 0, happinessCost: 5, risk: 'low', desc: 'Call random numbers and talk nonsense.' },
    egging_house: { id: 'egging_house', name: 'Egg a House', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.75, payoutMin: 0, payoutMax: 0, happinessCost: 10, risk: 'low', desc: 'Throw eggs at your rival teacher or neighbor\'s house.' },
    porch_pirate: { id: 'porch_pirate', name: 'Porch Pirating', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.65, payoutMin: 20, payoutMax: 150, happinessCost: 15, risk: 'medium', desc: 'Snatch Amazon packages from neighborhood front porches.' },
    shoplift_minor: { id: 'shoplift_minor', name: 'Shoplift Snacks', minAge: 12, maxAge: 17, category: 'juvenile', baseSuccessRate: 0.70, payoutMin: 10, payoutMax: 50, happinessCost: 10, risk: 'low', desc: 'Swipe energy drinks and candy from the corner store.' },

    // --- PETTY & STREET CRIMES ---
    pickpocket: { id: 'pickpocket', name: 'Pickpocket', minAge: 18, category: 'petty', baseSuccessRate: 0.65, payoutMin: 50, payoutMax: 350, happinessCost: 15, risk: 'low', desc: 'Lift wallets and watches in crowded subway stations.' },
    shoplift: { id: 'shoplift', name: 'Shoplifting', minAge: 18, category: 'petty', baseSuccessRate: 0.60, payoutMin: 100, payoutMax: 800, happinessCost: 15, risk: 'medium', desc: 'Steal high-end electronics or clothing from retail stores.' },
    vandalism: { id: 'vandalism', name: 'Vandalism', minAge: 18, category: 'petty', baseSuccessRate: 0.80, payoutMin: 0, payoutMax: 0, happinessCost: 10, risk: 'low', desc: 'Spray paint subway cars and city buildings.' },

    // --- VIOLENT CRIMES ---
    assault: { id: 'assault', name: 'Aggravated Assault', minAge: 18, category: 'violent', baseSuccessRate: 0.55, payoutMin: 0, payoutMax: 200, happinessCost: 30, risk: 'high', desc: 'Attack someone in an alley behind a bar.' },
    attempted_murder: { id: 'attempted_murder', name: 'Attempted Murder', minAge: 18, category: 'violent', baseSuccessRate: 0.40, payoutMin: 0, payoutMax: 0, happinessCost: 45, risk: 'severe', desc: 'Hired hit or severe ambush on an enemy.' },
    murder: { id: 'murder', name: 'Homicide / Murder', minAge: 18, category: 'violent', baseSuccessRate: 0.30, payoutMin: 0, payoutMax: 5000, happinessCost: 60, risk: 'critical', desc: 'Eliminate a rival or target in cold blood.' },

    // --- HIGH-STAKES PROPERTY & HEISTS ---
    burglary: { id: 'burglary', name: 'Residential Burglary', minAge: 18, category: 'heist', baseSuccessRate: 0.50, payoutMin: 1500, payoutMax: 12000, happinessCost: 20, risk: 'high', desc: 'Break into upscale suburban homes at night.' },
    gta: { id: 'gta', name: 'Grand Theft Auto', minAge: 18, category: 'heist', baseSuccessRate: 0.45, payoutMin: 4000, payoutMax: 35000, happinessCost: 25, risk: 'high', desc: 'Hotwire and steal sports cars or luxury SUVs.' },
    bank_robbery: { id: 'bank_robbery', name: 'Bank Robbery', minAge: 18, category: 'heist', baseSuccessRate: 0.25, payoutMin: 25000, payoutMax: 250000, happinessCost: 50, risk: 'critical', desc: 'Storm a downtown bank vault with an armed crew.' }
};

function attemptCrime(crimeId, user, targetPersonId = null) {
    if (!isAlive(user)) return { success: false, message: "Cannot commit crimes while dead or at 0 HP." };
    const crime = CRIMES[crimeId];
    if (!crime) return { success: false, message: "Invalid crime requested." };

    if (!Array.isArray(user.criminalRecord)) user.criminalRecord = [];
    user.lifetimeCrimesCommitted = (user.lifetimeCrimesCommitted || 0) + 1;

    const priorConvictions = user.criminalRecord.filter(r => r.verdict === 'guilty').length;
    const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.003;
    const priorPenalty = priorConvictions * 0.05;

    const finalChance = Math.min(0.92, Math.max(0.10, crime.baseSuccessRate + smartsBonus - priorPenalty));
    const roll = Math.random();
    const isSuccess = roll < finalChance;

    let targetPerson = null;
    if (targetPersonId && Array.isArray(user.relationships)) {
        targetPerson = user.relationships.find(r => String(r.id) === String(targetPersonId));
    }

    const targetName = targetPerson ? targetPerson.name : (crime.category === 'juvenile' ? 'a classmate' : 'a stranger');

    if (isSuccess) {
        let payout = 0;
        if (crime.payoutMax > 0) {
            payout = Math.floor(Math.random() * (crime.payoutMax - crime.payoutMin + 1)) + crime.payoutMin;
            user.money = (user.money || 0) + payout;
        }

        if (crimeId === 'murder') {
            if (targetPerson) {
                user.relationships = user.relationships.filter(r => String(r.id) !== String(targetPersonId));
                if (user.partner && String(user.partner.id) === String(targetPersonId)) user.partner = null;
                if (user.spouse && String(user.spouse.id) === String(targetPersonId)) user.spouse = null;
            }
            return {
                success: true,
                isMurder: true,
                crime,
                victimName: targetName,
                payout,
                message: `You committed homicide against ${targetName}. Detectives have found no leads and the case remains cold.`
            };
        }

        if (targetPerson && crimeId !== 'murder') {
            targetPerson.status = 0;
            targetPerson.category = 'enemy';
            targetPerson.type = 'Enemy';
        }

        return {
            success: true,
            isMurder: false,
            crime,
            targetName,
            payout,
            message: `Successfully executed ${crime.name}! ${payout > 0 ? `Scored ${Utils.formatMoney(payout)}.` : ''}`
        };
    } else {
        if (crime.category === 'juvenile') {
            let msg = `You were caught performing ${crime.name}! Your parents grounded you and you lost 15 Happiness.`;
            user.happiness = clampStat((user.happiness || 50) - 15);

            if (crime.id === 'prank_call') {
                msg = `Your prank call was traced by an angry recipient who complained to your parents! You were grounded and lost 10 Happiness.`;
                user.happiness = clampStat((user.happiness || 50) - 10);
            } else if (crime.id === 'egging_house') {
                msg = `The homeowner caught you with an egg in hand and made you scrub their front driveway! You lost 15 Happiness.`;
            } else if (crime.id === 'porch_pirate') {
                msg = `A neighbor caught you taking a package and alerted your school principal. You received 3 days of detention and lost 15 Happiness.`;
            } else if (crime.id === 'shoplift_minor') {
                msg = `The store manager caught you swiping snacks, confiscated the items, and banned you from the store. You lost 15 Happiness.`;
            }

            return {
                success: false,
                arrested: false,
                juvenileMischiefFailed: true,
                crime,
                targetName,
                message: msg
            };
        }

        user.pendingTrial = {
            crime,
            targetName,
            evidenceRating: Math.floor(Math.random() * 40) + 50,
            extraCharges: []
        };

        if (targetPerson && crimeId !== 'murder') {
            targetPerson.status = 0;
            targetPerson.category = 'enemy';
            targetPerson.type = 'Enemy';
        }

        return {
            success: false,
            arrested: true,
            crime,
            targetName,
            message: `Police apprehended you while committing ${crime.name}!`
        };
    }
}

function handleArrestAction(user, actionType, bribeAmount = 0) {
    if (!user.pendingTrial) return { success: false, message: "No active arrest." };
    if (!isAlive(user)) return { success: false, message: "Cannot perform actions while dead or at 0 HP." };

    const pending = user.pendingTrial;

    if (actionType === 'comply') {
        return { success: true, outcome: 'court', message: "You surrendered peacefully to law enforcement." };
    }

    if (actionType === 'bribe') {
        if (typeof bribeAmount !== 'number' || !Number.isFinite(bribeAmount) || bribeAmount <= 0) {
            return { success: false, message: "Invalid bribe amount." };
        }
        bribeAmount = Math.floor(bribeAmount);
        if ((user.money || 0) < bribeAmount) {
            return { success: false, message: "You don't have enough cash for that bribe!" };
        }
        user.money = (user.money || 0) - bribeAmount;

        const looksBonus = (clampStat(user.looks, 50) - 50) * 0.003;
        const bribeRatio = Math.min(1.0, bribeAmount / 10000);
        const bribeChance = Math.min(0.85, (bribeRatio * 0.50) + looksBonus + 0.10);

        if (Math.random() < bribeChance) {
            user.pendingTrial = null;
            return { success: true, outcome: 'escaped', message: `The officer took your ${Utils.formatMoney(bribeAmount)} bribe and let you walk away!` };
        } else {
            pending.extraCharges.push("Bribery of a Law Enforcement Officer");
            return { success: true, outcome: 'bribe_failed', message: `The officer rejected your bribe and added felony bribery charges!` };
        }
    }

    if (actionType === 'flee') {
        const healthChance = (clampStat(user.health, 50) / 100) * 0.55;
        if (Math.random() < healthChance) {
            user.pendingTrial = null;
            return { success: true, outcome: 'escaped', message: "You sprinted down an alley, lost the sirens, and escaped police custody!" };
        } else {
            pending.extraCharges.push("Resisting Arrest & Evading Officers");
            return { success: true, outcome: 'flee_failed', message: "Officers tackled you to the ground and added resisting arrest charges!" };
        }
    }

    return { success: false, message: "Invalid arrest choice." };
}

function calculateTrialVerdict(user, lawyerTier) {
    if (!user.pendingTrial) return null;
    if (!isAlive(user)) return { error: "Cannot stand trial while dead or at 0 HP." };

    const pending = user.pendingTrial;
    const crime = pending.crime;
    const extraChargesCount = (pending.extraCharges || []).length;

    let baseWinRate = 0.25;
    let lawyerCost = 0;
    let lawyerName = "Public Defender";

    if (lawyerTier === 'private_attorney') {
        baseWinRate = 0.55;
        lawyerCost = 2500;
        lawyerName = "Criminal Defense Attorney";
    } else if (lawyerTier === 'top_lawyer') {
        baseWinRate = 0.85;
        lawyerCost = 25000;
        lawyerName = "High-Powered Defense Firm";
    }

    if (lawyerCost > 0 && (user.money || 0) < lawyerCost) {
        return { error: `Insufficient funds for ${lawyerName}. You need ${Utils.formatMoney(lawyerCost)}.` };
    }

    user.money -= lawyerCost;

    const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.002;
    const evidencePenalty = (pending.evidenceRating / 100) * 0.30;
    const extraChargePenalty = extraChargesCount * 0.15;

    const winChance = Math.min(0.95, Math.max(0.05, baseWinRate + smartsBonus - evidencePenalty - extraChargePenalty));
    const acquitted = Math.random() < winChance;

    if (acquitted) {
        user.pendingTrial = null;
        return {
            verdict: 'not_guilty',
            crime,
            lawyerName,
            lawyerCost,
            message: `JURY VERDICT: NOT GUILTY! You were acquitted of all charges.`
        };
    } else {
        const baseFine = crime.category === 'juvenile' ? 250 : (crime.category === 'heist' ? 15000 : (crime.category === 'violent' ? 25000 : 2500));
        const fine = baseFine + (extraChargesCount * 5000);
        const sentenceYears = crime.category === 'juvenile' ? 0 : (crime.category === 'heist' ? 3 : (crime.id === 'murder' ? 25 : 2));

        const result = {
            verdict: 'guilty',
            crime,
            lawyerName,
            lawyerCost,
            fine,
            sentenceYears,
            extraCharges: pending.extraCharges,
            message: `JURY VERDICT: GUILTY! Sentenced to ${sentenceYears > 0 ? `${sentenceYears} years` : 'probation'} and ${Utils.formatMoney(fine)} in court fines/restitution.`
        };

        applySentencing(user, result);
        user.pendingTrial = null;
        return result;
    }
}

function applySentencing(user, verdictResult) {
    if (!Array.isArray(user.criminalRecord)) user.criminalRecord = [];

    user.money = Math.max(0, (user.money || 0) - verdictResult.fine);

    user.criminalRecord.push({
        year: user.age || 20,
        age: user.age || 20,
        crimeId: verdictResult.crime.id,
        crimeName: verdictResult.crime.name,
        severity: verdictResult.crime.category === 'juvenile' ? 'misdemeanor' : 'felony',
        verdict: 'guilty',
        finePaid: verdictResult.fine,
        sentenceYears: verdictResult.sentenceYears
    });

    if (verdictResult.sentenceYears > 0) {
        initPrisonState(user, verdictResult);
    } else {
        if (verdictResult.crime.category !== 'juvenile' && user.jobTitle) {
            user.jobTitle = null;
            user.salary = 0;
        }
    }

    user.happiness = clampStat((user.happiness || 50) - 35);
}

function calculatePrisonSecurity(crimeCategory, crimeId, sentenceYears) {
    if (crimeId === 'murder' || sentenceYears >= 15) {
        return { level: 'Supermax', facilityName: 'Ironwood State Supermax Penitentiary' };
    } else if (crimeCategory === 'violent' || crimeCategory === 'heist' || sentenceYears >= 6) {
        return { level: 'Maximum', facilityName: 'Oakridge Maximum Security Institution' };
    } else if (sentenceYears >= 3) {
        return { level: 'Medium', facilityName: 'Waynesburg Medium Correctional Facility' };
    } else {
        return { level: 'Minimum', facilityName: 'Green Valley Minimum Security Camp' };
    }
}

function generateCellmate(securityLevel) {
    const isMale = Math.random() < 0.5;
    const firstName = getRandomFirstName(isMale ? 'male' : 'female');
    const lastName = getRandomLastName();
    const crimes = ['Armed Robbery', 'Grand Theft', 'Assault', 'Racketeering', 'Burglary', 'Tax Evasion', 'Extortion'];
    const personalities = ['chill', 'volatile', 'scholar', 'intimidating', 'trader'];
    const id = 'cellmate_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const gender = isMale ? 'male' : 'female';
    const age = Math.floor(Math.random() * 30) + 20;
    
    return {
        id,
        name: `${firstName} ${lastName}`,
        gender,
        age,
        crime: crimes[Math.floor(Math.random() * crimes.length)],
        personality: personalities[Math.floor(Math.random() * personalities.length)],
        status: Math.floor(Math.random() * 30) + 35,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

function generateYardInmates(securityLevel) {
    const roles = [
        { role: 'Yard Boss', crime: 'Racketeering', perk: 'Unlocks Yard Respect' },
        { role: 'Contraband Dealer', crime: 'Smuggling', perk: 'Sells Black Market Items' },
        { role: 'Gang Recruiter', crime: 'Extortion', perk: 'Offer Gang Affiliation' },
        { role: 'Prison Snitch', crime: 'Fraud', perk: 'Risk of reporting you' }
    ];

    return roles.map((r, idx) => {
        const isMale = Math.random() < 0.5;
        const firstName = getRandomFirstName(isMale ? 'male' : 'female');
        const lastName = getRandomLastName();
        const id = `yard_inmate_${idx}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const gender = isMale ? 'male' : 'female';
        const age = Math.floor(Math.random() * 30) + 20;

        return {
            id,
            name: `${firstName} ${lastName}`,
            gender,
            age,
            role: r.role,
            crime: r.crime,
            perk: r.perk,
            status: Math.floor(Math.random() * 30) + 30,
            appearance: AvatarLogic.generateRandomAppearance(id, gender)
        };
    });
}

function initPrisonState(user, verdictResult) {
    const sentenceYears = verdictResult.sentenceYears || 1;
    const crime = verdictResult.crime || { category: 'petty', id: 'unknown' };
    const security = calculatePrisonSecurity(crime.category, crime.id, sentenceYears);

    user.inPrison = true;
    user.prisonSentenceRemaining = sentenceYears;
    user.prisonTotalSentence = sentenceYears;
    user.prisonSecurity = security.level;
    user.facilityName = security.facilityName;
    user.prisonStats = {
        respect: 25,
        guardRelation: 50,
        gang: 'None',
        canteenCash: Math.min(250, Math.floor((user.money || 0) * 0.1)),
        solitaryTurns: 0,
        goodBehaviorPoints: 10,
        prisonJob: 'None',
        lawStudied: 0,
        contraband: []
    };
    user.cellmate = generateCellmate(security.level);
    user.yardInmates = generateYardInmates(security.level);

    if (Array.isArray(user.relationships)) {
        user.relationships.forEach(rel => {
            if (rel.category === 'spouse' || rel.category === 'partner') {
                rel.status = Math.max(0, (rel.status || 50) - 20);
            } else if (rel.category === 'friend') {
                rel.status = Math.max(0, (rel.status || 50) - 25);
            } else {
                rel.status = Math.max(0, (rel.status || 50) - 15);
            }
        });
    }

    user.jobTitle = null;
    user.salary = 0;
    user.universityEnrolled = false;
    user.gradSchoolEnrolled = false;
    user.isStudent = false;
}

function processPrisonAgeUp(user) {
    if (!user || !user.inPrison) return { released: false };

    const stats = user.prisonStats || { respect: 25, guardRelation: 50, gang: 'None', canteenCash: 50, solitaryTurns: 0, goodBehaviorPoints: 10, prisonJob: 'None', lawStudied: 0, contraband: [] };
    user.prisonStats = stats;

    const events = [];
    let newlyAssignedCellmate = null;

    // 1. Sentence Countdown (Served time counts towards sentence even in solitary)
    user.prisonSentenceRemaining = Math.max(0, (user.prisonSentenceRemaining || 1) - 1);

    // 2. Solitary Confinement Penalty
    if (stats.solitaryTurns > 0) {
        stats.solitaryTurns--;
        user.happiness = clampStat((user.happiness || 50) - 20);
        user.health = clampStat((user.health || 100) - 10);
        events.push("Spent another grueling year in solitary confinement.");
    } else {
        // 3. New Cellmate Assignment (if in General Population without a cellmate)
        if (!user.cellmate) {
            user.cellmate = generateCellmate(user.prisonSecurity || 'Medium');
            newlyAssignedCellmate = user.cellmate;
            events.push(`Assigned a new cellmate named ${user.cellmate.name}.`);
        }

        // 4. Good Behavior Accrual
        if (stats.guardRelation >= 40) {
            stats.goodBehaviorPoints = (stats.goodBehaviorPoints || 0) + 10;
        }

        // 5. Prison Job Income
        const jobEarnings = {
            'Kitchen Duty': 350,
            'Laundry Detail': 250,
            'Library Assistant': 450,
            'Yard Maintenance': 300
        };
        if (stats.prisonJob && jobEarnings[stats.prisonJob]) {
            const earned = jobEarnings[stats.prisonJob];
            stats.canteenCash = (stats.canteenCash || 0) + earned;
            events.push(`Earned ${Utils.formatMoney(earned)} in canteen funds working ${stats.prisonJob}.`);
        }

        // 6. Outside Relationship Aging, Decay & Abandonment Check
        if (Array.isArray(user.relationships)) {
            for (let i = user.relationships.length - 1; i >= 0; i--) {
                const rel = user.relationships[i];
                rel.age++; // People in social continue aging while player is in prison

                // Progress NPC Occupation and check for milestone events
                const milestoneMsg = progressNPCOccupation(rel, user.age);
                if (milestoneMsg) {
                    events.push(milestoneMsg);
                }

                // Mortality check for aging relationships outside
                const deathCheck = checkMortality(rel.age, rel.health ?? 100);
                if (deathCheck.isDead) {
                    rel.deathCause = deathCheck.cause;
                    let deathMsg = `Your ${rel.type} ${rel.name} passed away at age ${rel.age} from ${deathCheck.cause}.`;
                    
                    // Inheritance / spousal insurance award while incarcerated
                    if (rel.type === 'Mother' || rel.type === 'Father' || rel.category === 'family') {
                        const inheritance = calculateInheritance(rel.age);
                        if (inheritance > 0) {
                            user.money = (user.money || 0) + inheritance;
                            deathMsg += ` You inherited ${Utils.formatMoney(inheritance)} held in outside estate accounts.`;
                        }
                    } else if (rel.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(rel.type)) {
                        const lifeInsurance = calculateSpousalLifeInsurance();
                        if (lifeInsurance > 0) {
                            user.money = (user.money || 0) + lifeInsurance;
                            deathMsg += ` Spousal life insurance policy paid out ${Utils.formatMoney(lifeInsurance)}.`;
                        }
                    }

                    events.push(deathMsg);
                    user.relationships.splice(i, 1);
                    continue;
                }

                // Differentiated relationship decay
                if (rel.category === 'spouse' || rel.category === 'partner') {
                    rel.status = Math.max(0, (rel.status || 50) - 12);
                } else if (rel.category === 'friend') {
                    rel.status = Math.max(0, (rel.status || 50) - 20);
                    if (rel.status < 15) {
                        events.push(`Your friend ${rel.name} stopped taking your prison calls and abandoned contact.`);
                        user.relationships.splice(i, 1);
                        continue;
                    }
                } else {
                    rel.status = Math.max(0, (rel.status || 50) - 8);
                }
            }

            const spouse = user.relationships.find(r => r.category === 'spouse' || r.category === 'partner');
            if (spouse && spouse.status < 30 && Math.random() < 0.25) {
                breakUpWithPartner(user, spouse);
                events.push(`Your partner ${spouse.name} filed for divorce/breakup while you were incarcerated.`);
            }
        }

        // 7. Random Prison Events
        const roll = Math.random();
        if (roll < 0.20 && stats.contraband && stats.contraband.length > 0) {
            // Guard Shakedown
            if (stats.snitchFramed) {
                stats.snitchFramed = false;
                events.push("Guards raided the cellblock during a shakedown, but found contraband planted on the Prison Snitch! Your cell stash was untouched.");
            } else {
                const hadPhoneOrShank = stats.contraband.includes('Contraband Cellphone') || stats.contraband.includes('Handmade Shank');
                stats.contraband = [];
                stats.solitaryTurns = 1;
                stats.guardRelation = Math.max(0, stats.guardRelation - 25);
                stats.goodBehaviorPoints = 0;

                if (hadPhoneOrShank) {
                    user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 1;
                    user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 1;
                    events.push("Guards raided your cell during a shakedown! Found illegal contraband (Phone/Shank): +1 year sentence added, 1 year in solitary confinement, and all contraband confiscated!");
                } else {
                    events.push("Guards raided your cell during a shakedown! Confiscated all contraband and put you in solitary confinement for 1 year.");
                }
            }
        } else if (roll > 0.85) {
            stats.respect = Math.min(100, stats.respect + 10);
            events.push("Gained respect among inmates after standing your ground during a yard standoff.");
        }
    }

    // 8. Release Check
    if (user.prisonSentenceRemaining <= 0) {
        user.inPrison = false;
        user.money = (user.money || 0) + 250; // Gate money
        user.prisonSentenceRemaining = 0;
        return {
            released: true,
            events,
            newCellmate: null,
            message: "You served your full prison sentence and were released back into society with $250 in gate money!"
        };
    }

    return {
        released: false,
        events,
        newCellmate: newlyAssignedCellmate,
        message: `Served 1 year of your sentence. ${user.prisonSentenceRemaining} years remaining.`
    };
}

function interactCellmate(user, actionType) {
    if (!user || !user.cellmate) return { success: false, msg: "No cellmate assigned." };
    if (!isAlive(user)) return { success: false, msg: "Cannot interact while dead or at 0 HP." };
    const cm = user.cellmate;
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot interact with cellmates while locked in solitary confinement." };
    }

    if (actionType === 'talk') {
        cm.status = Math.min(100, (cm.status || 50) + 8);
        user.happiness = clampStat((user.happiness || 50) + 3);
        return { success: true, msg: `Chatted with ${cm.name}. They shared stories about why they are locked up for ${cm.crime}.` };
    }

    if (actionType === 'share_snack') {
        if (!stats.canteenCash || stats.canteenCash < 10) {
            return { success: false, msg: "You need at least $10 in canteen cash to buy a snack to share!" };
        }
        stats.canteenCash -= 10;
        cm.status = Math.min(100, (cm.status || 50) + 20);
        return { success: true, msg: `Gave ${cm.name} a ramen packet and chocolate bar. Relationship boosted!` };
    }

    if (actionType === 'fight') {
        return attackPrisonInmate(user, 'cellmate', 'cellmate', 'fists');
    }

    return { success: false, msg: "Invalid action." };
}

function attackPrisonInmate(user, targetType, targetId, weaponType = 'fists') {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot fight while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot attack inmates while locked in solitary confinement." };
    }

    let target = null;
    if (targetType === 'cellmate') {
        target = user.cellmate;
    } else {
        target = (user.yardInmates || []).find(i => String(i.id) === String(targetId));
    }

    if (!target) return { success: false, msg: "Target inmate not found." };

    const hasShank = stats.contraband && stats.contraband.includes('Handmade Shank');
    const usingShank = weaponType === 'shank' && hasShank;

    if (weaponType === 'shank' && !hasShank) {
        return { success: false, msg: "You do not own a Handmade Shank in your cell mattress stash!" };
    }

    const userPower = clampStat(user.health, 50) + clampStat(user.smarts, 50) + (usingShank ? 40 : 0);
    const inmateDefense = Math.floor(Math.random() * 50) + 40;
    const win = Math.random() < (userPower / (userPower + inmateDefense));

    if (win) {
        const killChance = usingShank ? 0.35 : 0.15;
        const killed = Math.random() < killChance;

        if (killed) {
            if (usingShank) {
                stats.contraband = stats.contraband.filter(c => c !== 'Handmade Shank');
            }

            if (targetType === 'cellmate') {
                user.cellmate = null;
            } else {
                user.yardInmates = (user.yardInmates || []).filter(i => String(i.id) !== String(targetId));
            }

            user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 15;
            user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 15;
            stats.solitaryTurns = 2;
            stats.respect = Math.min(100, (stats.respect || 25) + 50);
            stats.guardRelation = 0;
            stats.goodBehaviorPoints = 0;

            return {
                success: true,
                killed: true,
                solitary: true,
                targetName: target.name,
                msg: `FATAL ATTACK! You inflicted a lethal strike on ${target.name}! Inmate died of injuries. +50 Respect earned (Inmates fear you), but court added +15 YEARS to your sentence and locked you in 2 years of Solitary Confinement!`
            };
        } else {
            target.status = 0;
            stats.respect = Math.min(100, (stats.respect || 25) + 25);

            const guardCaught = Math.random() < 0.45; // 45% chance guards witness the attack

            if (guardCaught) {
                stats.solitaryTurns = Math.max(stats.solitaryTurns || 0, 1);
                stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 25);
                stats.goodBehaviorPoints = 0;

                return {
                    success: true,
                    killed: false,
                    solitary: true,
                    targetName: target.name,
                    msg: `BRAWL CAUGHT! You beat up ${target.name}, but correctional officers rushed in and caught you in the act! You were thrown into Solitary Confinement for 1 year (-25 Guard Relation, +25 Respect).`
                };
            } else {
                stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 10);

                return {
                    success: true,
                    killed: false,
                    solitary: false,
                    targetName: target.name,
                    msg: `VIOLENT BRAWL! You brutally beat up ${target.name} out of sight of guards! Gained +25 Respect.`
                };
            }
        }
    } else {
        user.health = clampStat((user.health || 50) - 35);
        user.happiness = clampStat((user.happiness || 50) - 20);

        const guardCaught = Math.random() < 0.35; // 35% chance guards break up lost fight

        if (guardCaught) {
            stats.solitaryTurns = Math.max(stats.solitaryTurns || 0, 1);
            stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 15);

            return {
                success: false,
                killed: false,
                solitary: true,
                targetName: target.name,
                msg: `BRAWL BROKEN UP! ${target.name} overpowered you in the fight before guards intervened and threw you into Solitary Confinement for 1 year! Lost 35 Health.`
            };
        } else {
            return {
                success: false,
                killed: false,
                solitary: false,
                targetName: target.name,
                msg: `${target.name} retaliated fiercely and overpowered you in the brawl! Lost 35 Health and 20 Happiness.`
            };
        }
    }
}

function workoutPrisonYard(user, workoutType) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot work out while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot go to the prison yard while locked in solitary confinement." };
    }

    if (workoutType === 'bench_press') {
        stats.respect = Math.min(100, (stats.respect || 25) + 5);
        user.health = clampStat((user.health || 50) + 4);
        return { success: true, msg: "Pumped iron at the yard bench press. Built muscle and gained +5 Respect!" };
    }

    if (workoutType === 'cardio') {
        user.health = clampStat((user.health || 50) + 6);
        user.looks = clampStat((user.looks || 50) + 2);
        return { success: true, msg: "Ran laps around the yard track. Improved Health and Stamina!" };
    }

    return { success: false, msg: "Invalid workout." };
}

function interactYardInmate(user, inmateId, actionType) {
    if (!user || !user.yardInmates) return { success: false, msg: "No inmates available." };
    if (!isAlive(user)) return { success: false, msg: "Cannot interact while dead or at 0 HP." };
    const inmate = user.yardInmates.find(i => String(i.id) === String(inmateId));
    if (!inmate) return { success: false, msg: "Inmate not found." };
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot interact with yard inmates while locked in solitary confinement." };
    }

    if (actionType === 'chat') {
        inmate.status = Math.min(100, (inmate.status || 40) + 10);
        return { success: true, msg: `Talked with ${inmate.name} (${inmate.role}). Built rapport!` };
    }

    if (actionType === 'protection') {
        if ((stats.canteenCash || 0) < 50) {
            return { success: false, msg: "You need at least $50 in canteen cash to pay for yard protection." };
        }
        stats.canteenCash -= 50;
        stats.respect = Math.min(100, (stats.respect || 25) + 15);
        return { success: true, msg: `Paid ${inmate.name} $50 protection money. The ${inmate.role} has your back.` };
    }

    if (actionType === 'challenge_boss') {
        const userPower = clampStat(user.health, 50) + clampStat(user.smarts, 50);
        if (Math.random() < (userPower / 180)) {
            stats.respect = Math.min(100, (stats.respect || 25) + 40);
            stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 15);
            return { success: true, msg: `You challenged ${inmate.name} for Yard Supremacy and WON the brawl! Gained +40 Respect!` };
        } else {
            user.health = clampStat((user.health || 50) - 30);
            user.happiness = clampStat((user.happiness || 50) - 20);
            return { success: false, msg: `${inmate.name} defeated you in the yard brawl! Lost 30 Health and 20 Happiness.` };
        }
    }

    if (actionType === 'gang_mission') {
        if (stats.gang === 'None') {
            return { success: false, msg: "You must join a prison gang before accepting gang missions!" };
        }
        stats.respect = Math.min(100, (stats.respect || 25) + 15);
        stats.canteenCash = (stats.canteenCash || 0) + 50;
        return { success: true, msg: `Completed a gang favor for ${inmate.name}! Earned +15 Respect and $50 in canteen cash.` };
    }

    if (actionType === 'bribe_snitch') {
        if ((stats.canteenCash || 0) < 25) {
            return { success: false, msg: "You need $25 in canteen cash to bribe the snitch." };
        }
        stats.canteenCash -= 25;
        stats.snitchPacified = true;
        stats.guardRelation = Math.min(100, (stats.guardRelation || 50) + 10);
        return { success: true, msg: `Paid ${inmate.name} $25 to keep quiet. They promised not to snitch on your cell block!` };
    }

    if (actionType === 'confront_snitch') {
        stats.respect = Math.min(100, (stats.respect || 25) + 10);
        inmate.status = Math.max(0, (inmate.status || 40) - 20);
        return { success: true, msg: `Cornered and intimidated ${inmate.name} in the yard. Showed the block you won't tolerate snitches (+10 Respect)!` };
    }

    if (actionType === 'frame_snitch') {
        if (!stats.contraband || stats.contraband.length === 0) {
            return { success: false, msg: "You need contraband in your cell stash to plant on the snitch!" };
        }
        const planted = stats.contraband.pop();
        stats.snitchFramed = true;
        stats.respect = Math.min(100, (stats.respect || 25) + 20);
        return { success: true, msg: `Planted ${planted} in the snitch's bunk! The block cheered your cunning (+20 Respect).` };
    }

    if (actionType === 'join_gang') {
        if (stats.gang !== 'None') {
            return { success: false, msg: `You are already affiliated with the ${stats.gang}!` };
        }
        stats.gang = inmate.role === 'Yard Boss' ? 'Street Syndicate' : 'Brotherhood';
        stats.respect = Math.min(100, (stats.respect || 25) + 30);
        stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 20);
        return { success: true, msg: `Joined the ${stats.gang}! Gained +30 Respect, but guards will target you (-20 Guard Relation).` };
    }

    return { success: false, msg: "Invalid inmate action." };
}

function useContrabandPhone(user, phoneAction, targetId = null) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot use phone while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!stats || !stats.contraband || !stats.contraband.includes('Contraband Cellphone')) {
        return { success: false, msg: "You do not possess a Contraband Cellphone in your cell stash." };
    }

    // 25% chance guards catch user using phone
    const caught = Math.random() < 0.25;

    if (caught) {
        stats.contraband = stats.contraband.filter(c => c !== 'Contraband Cellphone');
        stats.solitaryTurns = 1;
        stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 30);
        stats.goodBehaviorPoints = 0;
        user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 1;
        user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 1;
        return {
            success: false,
            caught: true,
            msg: "GUARD CAUGHT YOU ON THE PHONE! Officer confiscated your Contraband Cellphone, added +1 year to your sentence, and sent you to Solitary Confinement!"
        };
    }

    if (phoneAction === 'contact') {
        const rel = (user.relationships || []).find(r => String(r.id) === String(targetId));
        if (!rel) return { success: false, msg: "Contact not found." };

        rel.status = Math.min(100, (rel.status || 50) + 20);
        user.happiness = clampStat((user.happiness || 50) + 10);
        return {
            success: true,
            msg: `Secretly texted and called ${rel.name} on your contraband phone! Reconnected outside (+20 status, +10 Happiness)!`
        };
    }

    if (phoneAction === 'legal') {
        stats.lawStudied = (stats.lawStudied || 0) + 35;
        user.smarts = clampStat((user.smarts || 50) + 3);
        return {
            success: true,
            msg: "Called your private legal team hotline. Consulted appellate attorneys directly from your cell (+35 Law Study Points, +3 Smarts)!"
        };
    }

    return { success: false, msg: "Invalid phone action." };
}

function doPrisonJob(user, jobId) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot work while dead or at 0 HP." };
    if (user.prisonStats.solitaryTurns > 0) {
        return { success: false, msg: "Your prison job assignment is suspended while locked in solitary confinement." };
    }
    const validJobs = ['Kitchen Duty', 'Laundry Detail', 'Library Assistant', 'Yard Maintenance'];
    if (!validJobs.includes(jobId)) return { success: false, msg: "Invalid job title." };

    user.prisonStats.prisonJob = jobId;
    return { success: true, msg: `Assigned to ${jobId}. You will earn canteen cash each year.` };
}

function doSolitaryActivity(user, actType) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot perform activities while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!stats || stats.solitaryTurns <= 0) return { success: false, msg: "Not in solitary confinement." };

    if (actType === 'pushups') {
        user.health = clampStat((user.health || 50) + 2);
        stats.respect = Math.min(100, (stats.respect || 25) + 1);
        return { success: true, msg: "Did 100 cell push-ups in solitary confinement (+2 Health, +1 Respect)." };
    }

    if (actType === 'meditate') {
        user.smarts = clampStat((user.smarts || 50) + 3);
        user.health = clampStat((user.health || 50) + 1);
        return { success: true, msg: "Meditated on your life choices in solitary isolation (+3 Smarts, +1 Health)." };
    }

    return { success: false, msg: "Invalid solitary activity." };
}

function buyCanteenItem(user, itemId) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot buy items while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!Array.isArray(stats.contraband)) stats.contraband = [];

    const catalog = {
        ramen: { name: 'Ramen Packet', price: 5, type: 'snack' },
        chocolate: { name: 'Chocolate Bar', price: 8, type: 'snack' },
        paper_pen: { name: 'Writing Paper & Pen', price: 12, type: 'utility' },
        cigarettes: { name: 'Pack of Cigarettes', price: 30, type: 'contraband' },
        shank: { name: 'Handmade Shank', price: 80, type: 'contraband' },
        cellphone: { name: 'Contraband Cellphone', price: 180, type: 'contraband' }
    };

    const item = catalog[itemId];
    if (!item) return { success: false, msg: "Invalid canteen item." };

    if ((stats.canteenCash || 0) < item.price) {
        return { success: false, msg: `Insufficient canteen cash. ${item.name} costs $${item.price}.` };
    }

    stats.canteenCash -= item.price;

    if (item.type === 'snack') {
        user.happiness = clampStat((user.happiness || 50) + 5);
        return { success: true, msg: `Enjoyed a ${item.name}. Gained +5 Happiness!` };
    } else {
        stats.contraband.push(item.name);
        return { success: true, msg: `Purchased ${item.name} from the canteen dealer!` };
    }
}

function sellContrabandItem(user, itemIndexOrName) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot sell contraband while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!Array.isArray(stats.contraband) || stats.contraband.length === 0) {
        return { success: false, msg: "You have no contraband items to sell." };
    }

    const sellValues = {
        'Writing Paper & Pen': 8,
        'Pack of Cigarettes': 20,
        'Handmade Shank': 50,
        'Contraband Cellphone': 120
    };

    let itemIndex = -1;
    if (typeof itemIndexOrName === 'number') {
        itemIndex = itemIndexOrName;
    } else {
        itemIndex = stats.contraband.findIndex(c => c === itemIndexOrName);
    }

    if (itemIndex < 0 || itemIndex >= stats.contraband.length) {
        return { success: false, msg: "Item not found in cell stash." };
    }

    const itemName = stats.contraband[itemIndex];
    const sellPrice = sellValues[itemName] || 15;

    stats.contraband.splice(itemIndex, 1);
    stats.canteenCash = (stats.canteenCash || 0) + sellPrice;

    return {
        success: true,
        itemName,
        sellPrice,
        msg: `Sold ${itemName} to the Contraband Dealer for $${sellPrice} in canteen cash!`
    };
}

function studyPrisonLaw(user) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot study law while dead or at 0 HP." };
    const stats = user.prisonStats;
    stats.lawStudied = (stats.lawStudied || 0) + 15;
    user.smarts = clampStat((user.smarts || 50) + 2);
    return { success: true, msg: "Spent hours in the prison legal library studying appeal precedent. +15 Law Study points, +2 Smarts!" };
}

function attemptSentenceAppeal(user, lawyerTier = 'self') {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot appeal while dead or at 0 HP." };
    const stats = user.prisonStats;

    let baseChance = 0.15;
    if (lawyerTier === 'private') baseChance = 0.45;
    if (lawyerTier === 'top') baseChance = 0.75;

    const lawBonus = ((stats.lawStudied || 0) / 100) * 0.20;
    const smartsBonus = (clampStat(user.smarts, 50) / 100) * 0.10;
    const winChance = Math.min(0.90, baseChance + lawBonus + smartsBonus);

    if (Math.random() < winChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        user.money = (user.money || 0) + 250;
        return {
            success: true,
            released: true,
            msg: "APPELLATE COURT OVERTURNED CONVICTION! You walked out of prison a free individual!"
        };
    } else {
        return {
            success: true,
            released: false,
            msg: "The court of appeals rejected your petition. Sentence remains unchanged."
        };
    }
}

function attemptParoleBoard(user) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot apply for parole while dead or at 0 HP." };
    const total = user.prisonTotalSentence || 1;
    const remaining = user.prisonSentenceRemaining || 1;
    const served = total - remaining;

    if (served < Math.ceil(total * 0.5)) {
        return { success: false, msg: `You must serve at least 50% of your sentence (${Math.ceil(total * 0.5)} years) before applying for parole.` };
    }

    const stats = user.prisonStats;
    const behaviorScore = stats.goodBehaviorPoints || 0;
    const guardScore = stats.guardRelation || 0;

    const paroleChance = Math.min(0.95, (behaviorScore / 100) * 0.5 + (guardScore / 100) * 0.4);

    if (Math.random() < paroleChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        user.money = (user.money || 0) + 250;
        return {
            success: true,
            released: true,
            msg: "PAROLE GRANTED! The Parole Board approved your early release on good behavior!"
        };
    } else {
        stats.goodBehaviorPoints = Math.max(0, behaviorScore - 10);
        return {
            success: true,
            released: false,
            msg: "Parole Board DENIED early release. Continue serving your sentence."
        };
    }
}

function attemptPrisonEscape(user, method) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot attempt escape while dead or at 0 HP." };
    const stats = user.prisonStats;

    let escapeChance = 0.20;
    if (method === 'tunnel') escapeChance += (clampStat(user.smarts, 50) / 100) * 0.35;
    if (method === 'bribe_guard') escapeChance += ((stats.guardRelation || 50) / 100) * 0.45;
    if (method === 'laundry_cart') escapeChance += (clampStat(user.looks, 50) / 100) * 0.30;
    if (method === 'fence_cut') escapeChance += (clampStat(user.health, 50) / 100) * 0.25;

    if (Math.random() < escapeChance) {
        user.inPrison = false;
        user.prisonSentenceRemaining = 0;
        return {
            success: true,
            escaped: true,
            msg: "FEAT OF ESCAPE! You broke out of the prison facility and are now a fugitive on the run!"
        };
    } else {
        user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 5;
        user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 5;
        user.prisonSecurity = 'Maximum';
        stats.solitaryTurns = 2;
        stats.guardRelation = 0;
        stats.respect = Math.max(0, (stats.respect || 25) - 20);

        return {
            success: true,
            escaped: false,
            msg: "ESCAPE ATTEMPT FAILED! Guards captured you, added 5 years to your sentence, transferred you to Max Security, and placed you in 2 years of Solitary Confinement!"
        };
    }
}

function sendPrisonLetter(user, relId) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot send letters while dead or at 0 HP." };
    const stats = user.prisonStats;
    const rel = (user.relationships || []).find(r => String(r.id) === String(relId));
    if (!rel) return { success: false, msg: "Contact not found." };

    const hasPaper = stats && Array.isArray(stats.contraband) && stats.contraband.includes('Writing Paper & Pen');
    if (!hasPaper) {
        if ((stats.canteenCash || 0) < 5) {
            return { success: false, msg: "You need $5 in canteen cash (or paper & pen) to send a letter." };
        }
        stats.canteenCash -= 5;
    }

    rel.status = Math.min(100, (rel.status || 50) + 15);
    user.happiness = clampStat((user.happiness || 50) + 4);

    return {
        success: true,
        msg: `Sent a handwritten prison letter to ${rel.name}. Relationship boosted (+15 status)!`
    };
}

function requestConjugalVisit(user, relId) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot request conjugal visit while dead or at 0 HP." };
    const stats = user.prisonStats;
    const rel = (user.relationships || []).find(r => String(r.id) === String(relId));

    if (!rel) return { success: false, msg: "Partner not found." };
    if (rel.category !== 'spouse' && rel.category !== 'partner') {
        return { success: false, msg: "Conjugal visits are restricted to married spouses or long-term partners." };
    }

    if ((stats.guardRelation || 50) < 40) {
        return { success: false, msg: "Guard relation is too low (<40%). Correctional officers denied your conjugal visit request." };
    }
    if ((stats.solitaryTurns || 0) > 0) {
        return { success: false, msg: "Conjugal visits are prohibited while in solitary confinement." };
    }

    rel.status = Math.min(100, (rel.status || 50) + 25);
    user.happiness = clampStat((user.happiness || 50) + 15);

    let pregnancyOccurred = false;
    const isUserFemale = user.gender === 'female';
    const isPartnerFemale = rel.gender === 'female';

    if (isUserFemale !== isPartnerFemale && (user.age || 20) >= 18 && (user.age || 20) <= 45 && (rel.age || 20) >= 18 && (rel.age || 20) <= 45) {
        const pregChance = 0.35;
        if (Math.random() < pregChance) {
            pregnancyOccurred = true;
            user.isExpecting = true;
            user.expectingWithId = rel.id;
        }
    }

    if (pregnancyOccurred) {
        return {
            success: true,
            pregnancyOccurred: true,
            msg: `Conjugal visit with ${rel.name} was intimate and successful (+25 status, +15 Happiness)! A baby is expecting!`
        };
    }

    return {
        success: true,
        pregnancyOccurred: false,
        msg: `Enjoyed a private conjugal visit with ${rel.name}. Reconnected intimately (+25 status, +15 Happiness)!`
    };
}

export const GameLogic = {
    generateRandomStats,
    calculateSmartsDelta,
    calculateLooksDelta,
    generateNPCOccupation,
    progressNPCOccupation,
    calculateSpousalIncomeContribution,
    sanitizeName,
    sanitizeBusinessName,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    checkLifeStatus,
    getVehicleIcon,
    simulateVehicleMarket,
    updateOwnedVehicles,
    checkMortality,
    calculateHealthDecay,
    calculateHealthBenefits,
    calculateActiveHealthCosts,
    calculateChildMonthlyOutflow,
    calculateMedicalVisit,
    calculateOneTimeGymVisit,
    getDeck,
    calculateBlackjackHand,
    determineBlackjackOutcome,
    calculateTripOutcome,
    calculateRelationshipDecay,
    checkRelationshipCategoryShift,
    isHostile,
    getAvailableInteractions,
    isInteractionBlocked,
    calculateInheritance,
    calculateSpousalLifeInsurance,
    calculateEstateDistribution,
    generateSchoolCohort,
    generateReplacementTeacher,
    generateStranger,
    determineNPCGender,
    generateTargetedStranger,
    generateDatingProfiles,
    generateLuxuryMatch,
    LUXURY_AGE_PRESETS,
    LUXURY_CAREERS,
    getRandomHookupScenario,
    calculateMakeAMoveSuccess,
    checkAgeUpInfidelityDiscovery,
    backfillRelationshipGender,
    attemptBefriend,
    calculateProposalAcceptance,
    calculatePregnancyChance,
    calculatePromotionChance,
    getRandomFirstName,
    getRandomLastName,
    getLastName,
    getFirstName,
    calculateNameChangeAcceptance,
    canProcessBusinessQuarter,
    recordBusinessQuarterProcessed,
    getRemainingQuartersForAge,
    calculateAutoQuarterCount,
    resetBusinessQuarterTracking,
    ensureBusinessState,
    calculateCompanyValuation,
    MAX_COMPANY_VALUATION,
    MAX_COMPANY_CASH,
    MAX_PLAYER_MONEY,
    calculateBusinessOverhead,
    calculateVCInvestorOffers,
    acceptVCOffer,
    launchIPO,
    inheritFamilyRelationships,
    CITY_COST_OF_LIVING,
    getCityCostMultiplier,
    calculateScaledSalary,
    PROPERTIES_FOR_SALE,
    getPropertyIcon,
    calculateMonthlyMortgage,
    calculateUserMonthlyIncome,
    calculateUserMonthlyOutflow,
    calculateTotalMonthlyMortgages,
    canAffordMortgage,
    processMortgagePayments,
    calculatePropertyMonthlyOutflow,
    updateOwnedProperties,
    calculateMaintenanceCost,
    performPropertyMaintenance,
    calculateRenovationOptions,
    renovateProperty,
    calculateTotalRentalIncome,
    generateTenantApplicants,
    acceptTenantLease,
    processRentalIncome,
    processTenantEvents,
    evictTenant,
    calculatePropertySaleTiers,
    generatePropertyBuyerOffer,
    completePropertySale,
    getJewelryIcon,
    JEWELRY_FOR_SALE,
    updateOwnedJewelry,
    VEHICLES_FOR_SALE,
    calculateAutoLoan,
    calculateTotalAutoLoanMonthlyOutflow,
    calculateTradeInValue,
    DIET_PLANS,
    INITIAL_STOCKS,
    ensureInvestmentState,
    generateInvestmentBlogPosts,
    processInvestmentsAgeUp,
    buyStock,
    sellStock,
    depositSavings,
    withdrawSavings,
    getDietPlan,
    LOTTERY_TYPES,
    playLotteryTicket,
    generateLifeSuggestions,
    getMegaJackpotAmount,
    rollOverMegaJackpot,
    RELOCATION_COST,
    canMoveCountry,
    moveCountry,
    getPartner,
    calculatePartnerRelocateAcceptance,
    breakUpWithPartner,
    playRoulette,
    spinSlotMachine,
    ROULETTE_RED_NUMBERS,
    SLOT_SYMBOLS,
    CRIMES,
    attemptCrime,
    handleArrestAction,
    calculateTrialVerdict,
    applySentencing,
    processMafiaCrime: (type) => {
        const user = state.gameState?.user;
        if (!isAlive(user)) return { success: false, message: "Cannot commit crimes while dead or at 0 HP." };
        let successChance = 0.6;
        let payout = 0;
        let crimeName = '';

        if (type === 'shakedown') { crimeName = 'Extortion'; successChance = 0.7; payout = 5000; }
        else if (type === 'smuggle') { crimeName = 'Smuggling'; successChance = 0.6; payout = 15000; }
        else if (type === 'hijack') { crimeName = 'Grand Theft'; successChance = 0.5; payout = 35000; }
        else if (type === 'bribe') { crimeName = 'Bribery'; successChance = 0.8; payout = 0; }
        else if (type === 'whack') { crimeName = 'Syndicate Hit'; successChance = 0.4; payout = 0; }

        const smartsBonus = (clampStat(user.smarts, 50) - 50) * 0.005;
        const finalChance = Math.min(0.95, Math.max(0.1, successChance + smartsBonus));

        if (Math.random() < finalChance) {
            user.mafiaCrimesThisYear = (user.mafiaCrimesThisYear || 0) + 1;
            if (payout > 0) {
                user.money += payout;
                return { success: true, message: `You successfully completed ${crimeName} and pocketed $${payout.toLocaleString()}.` };
            } else {
                return { success: true, message: `You successfully completed ${crimeName} for the Syndicate.` };
            }
        } else {
            user.pendingTrial = {
                crime: { name: crimeName, category: type === 'whack' ? 'violent' : 'heist', risk: type === 'whack' ? 'critical' : 'high' },
                targetName: 'the Syndicate',
                evidenceRating: Math.floor(Math.random() * 40) + 50,
                extraCharges: []
            };
            return { success: false, arrested: true, message: `You were caught by the feds while attempting ${crimeName}!` };
        }
    },
    isAlive,
    launchIPO,
    clampStat,
    calculatePrisonSecurity,
    generateCellmate,
    generateYardInmates,
    initPrisonState,
    processPrisonAgeUp,
    interactCellmate,
    workoutPrisonYard,
    interactYardInmate,
    doPrisonJob,
    buyCanteenItem,
    studyPrisonLaw,
    attemptSentenceAppeal,
    attemptParoleBoard,
    attemptPrisonEscape,
    sendPrisonLetter,
    requestConjugalVisit,
    useContrabandPhone,
    sellContrabandItem,
    doSolitaryActivity,
    attackPrisonInmate
};




