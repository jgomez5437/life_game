function sanitizeName(rawInput) {
if (!rawInput) return { isValid: false, error: "Name cannot be empty." };

    // Clean it (Trim spaces)
    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');
    const nameRegex = /^[a-zA-Z\s-]+$/;

    // Check Rules
    if (cleanedName === "") {
        return { isValid: false, error: "You must enter a name to begin." };
    }
    if (cleanedName.length > 25) {
        return { isValid: false, error: "Keep the name to 25 characters or less." };
    }
    if (!nameRegex.test(cleanedName)) {
        return { isValid: false, error: "Name can only contain letters, spaces, and hyphens." };
    }

    // Success!
    return { isValid: true, cleanedName: cleanedName };
}

function addLivingExpenses(age, currentlyStudent) {
    if (age >= 19 && !currentlyStudent) {
    return 24000; // $2k/month * 12
    }; 
    return 0;
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
    if (user.gradSchoolEnrolled) {
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
    } else if (user.age > 17 && user.highSchoolRetained) {
       return "Student (Retaking)";
    } else if (user.age > 17 && !user.jobTitle) {
       return "Unemployed";
    } else if (user.age === 0) {
       return "Baby";
    } else if (user.age < 5) {
       return "Toddler";
    } else if (user.age < 18) {
       return "Student";
    } else if (user.highSchoolRetained) {
       return "Student (Retaking)";
    }
}

const VEHICLE_TYPES = {
    // Standard Cars
    sedan: { icon: "fa-car", color: "text-blue-400" },
    coupe: { icon: "fa-car-side", color: "text-indigo-400" },
    hatchback: { icon: "fa-car", color: "text-slate-400" },
    
    // Larger Vehicles
    suv: { icon: "fa-shuttle-van", color: "text-emerald-400" }, // Use shuttle van for SUV
    truck: { icon: "fa-truck-pickup", color: "text-orange-400" },
    van: { icon: "fa-van-shuttle", color: "text-slate-500" },

    // Special
    sports: { icon: "fa-car-burst", color: "text-red-500" }, // "Fast" car icon
    supercar: { icon: "fa-fire", color: "text-red-600" }, // Or use fire/rocket for exotic
    motorcycle: { icon: "fa-motorcycle", color: "text-yellow-400" },
    
    // Default fallback
    default: { icon: "fa-car", color: "text-gray-400" }
};

function getVehicleIcon(type) {
    // Convert type to lowercase to match keys
    const key = type ? type.toLowerCase() : 'default';
    return VEHICLE_TYPES[key] || window.VEHICLE_TYPES.default;
};

// gameLogic.js inside window.GameLogic = { ... }

    // Simulates market fluctuation
function simulateVehicleMarket() {
    // This generates a number between -0.08 (-8%) and 0.08 (+8%)
    const marketForce = (Math.random() * 0.16) - 0.08;
    
    // 2. Apply to every car
    window.VEHICLES_FOR_SALE.forEach(car => {
        // Each car has a slight individual variance on top of the market force
        const individualVariance = (Math.random() * 0.04) - 0.02; // +/- 2%
        const totalChangePercent = 1 + marketForce + individualVariance;
        
        // Calculate new price
        let newPrice = Math.floor(car.price * totalChangePercent);
        
        // Round to nearest $10 or $100 for cleaner numbers
        if (newPrice > 10000) {
            newPrice = Math.round(newPrice / 100) * 100;
        } else {
            newPrice = Math.round(newPrice / 10) * 10;
        }
        // Safety: Don't let prices drop below 50% of original or go too crazy
        // (Optional, but keeps Rusty Camrys from becoming free)
        newPrice = Math.max(500, newPrice); 
        // Update the global object
        car.price = newPrice;
        
        // Store the % change to show UI arrows later (Optional feature)
        car.lastChange = totalChangePercent > 1 ? 'up' : 'down';
    });
    return marketForce;
};



const GameLogic = {
    sanitizeName,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    checkLifeStatus,
    getVehicleIcon,
    simulateVehicleMarket
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic; // Node/Jest
} else if (typeof window !== 'undefined') {
    window.GameLogic = GameLogic; // Browser
}