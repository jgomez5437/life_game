import { Asset, PlayerState } from '@/types/player';

export function sanitizeName(rawInput: string | null | undefined): { isValid: boolean; error?: string; cleanedName?: string } {
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

export function addLivingExpenses(age: number, currentlyStudent: boolean): number {
    if (age >= 19 && !currentlyStudent) {
        return 24000; // $2k/month * 12
    }
    return 0;
}

export function calculateBirthdayMoney(): number {
    return Math.floor(Math.random() * 71) + 10;
}

export function addStudentLoanPayment(age: number, studentLoanAmount: number, isStudent: boolean): number {
    if (age >= 18 && studentLoanAmount > 0 && !isStudent) {
        return Math.min(2400, studentLoanAmount);
    }
    return 0;
}

export function checkSchoolGraduated(currentSchoolYear: number, enrolledSchoolYears: number): boolean {
    return currentSchoolYear >= enrolledSchoolYears;
}

export function checkLifeStatus(user: PlayerState): string {
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
    return "Unknown";
}

const VEHICLE_TYPES: Record<string, { icon: string, color: string }> = {
    sedan: { icon: "fa-car", color: "text-blue-400" },
    coupe: { icon: "fa-car-side", color: "text-indigo-400" },
    hatchback: { icon: "fa-car", color: "text-slate-400" },
    suv: { icon: "fa-shuttle-van", color: "text-emerald-400" },
    truck: { icon: "fa-truck-pickup", color: "text-orange-400" },
    van: { icon: "fa-van-shuttle", color: "text-slate-500" },
    sports: { icon: "fa-car-burst", color: "text-red-500" },
    supercar: { icon: "fa-fire", color: "text-red-600" },
    motorcycle: { icon: "fa-motorcycle", color: "text-yellow-400" },
    default: { icon: "fa-car", color: "text-gray-400" }
};

export function getVehicleIcon(type: string | undefined): { icon: string, color: string } {
    const key = type ? type.toLowerCase() : 'default';
    return VEHICLE_TYPES[key] || VEHICLE_TYPES.default;
}

export function simulateVehicleMarket(vehiclesForSale: any[]): number {
    const marketForce = (Math.random() * 0.16) - 0.08;
    
    vehiclesForSale.forEach(car => {
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

export function updateOwnedVehicles(assets: Asset[], marketForce: number): { updatedAssets: Asset[], warnings: { msg: string, type: 'bad' }[] } {
    const warnings: { msg: string, type: 'bad' }[] = [];
    const updatedAssets = [...assets];
    
    updatedAssets.forEach(asset => {
        if (asset.category === 'vehicle') {
            const decay = Math.floor(Math.random() * 5) + 3; 
            asset.condition = Math.max(0, asset.condition - decay);
            
            const baseDepreciation = 0.85; 
            const marketImpact = 1 + (marketForce * 0.5); 
            
            let newValue = Math.floor(asset.value * baseDepreciation * marketImpact);
            
            if (asset.condition < 40) {
                newValue = Math.floor(newValue * 0.80);
            }
            asset.value = Math.max(0, newValue);
            
            if (asset.condition === 0) {
                 warnings.push({ msg: `URGENT: Your ${asset.name} has broken down completely!`, type: 'bad' });
            } else if (asset.condition < 20 && asset.condition + decay >= 20) {
                 warnings.push({ msg: `Your ${asset.name} is falling apart. Repair it soon!`, type: 'bad' });
            }
        }
    });
    return { updatedAssets, warnings };
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

export function checkMortality(age: number, health: number = 100): { isDead: boolean; cause?: string } {
    const bracket = MORTALITY_RATES.find(b => age <= b.maxAge)!;
    let chance = bracket.rate;

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

export function calculateHealthDecay(age: number, roll: number = Math.random()): number {
    if (age <= 18) {
        return roll < 0.10 ? 1 : 0;
    } else if (age <= 30) {
        return roll < 0.30 ? 1 : 0;
    } else if (age <= 50) {
        return roll < 0.20 ? 2 : 1;
    } else if (age <= 70) {
        return Math.floor(roll * 3) + 1; 
    } else {
        return Math.floor(roll * 3) + 2; 
    }
}
