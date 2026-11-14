import { addLog } from '../state.js';
import { AvatarLogic } from '../avatarLogic.js';
import { isAlive } from './playerStatsLogic.js';
import { getRandomFirstName, getLastName } from './npcGeneratorLogic.js';
import { calculateUserMonthlyIncome } from './cashflowTaxLogic.js';
import { calculatePropertyMonthlyOutflow } from './landlordTenantLogic.js';
export * from './landlordTenantLogic.js';

export const PROPERTIES_FOR_SALE = [
    { id: 1, name: "Cozy Studio Apartment", type: "apartment", price: 120000, desc: "A modest starter studio in the city." },
    { id: 2, name: "Suburban Townhouse", type: "townhouse", price: 280000, desc: "A cozy 2-bedroom townhouse with a garage." },
    { id: 3, name: "Family Suburban House", type: "house", price: 450000, desc: "Spacious 4-bedroom house with a backyard." },
    { id: 4, name: "Downtown Luxury Condo", type: "condo", price: 850000, desc: "High-rise condo with skyline views." },
    { id: 5, name: "Executive Hillside Villa", type: "villa", price: 2200000, desc: "Gated villa with a private pool." },
    { id: 6, name: "Beachfront Estate", type: "estate", price: 6500000, desc: "Sprawling oceanfront luxury property." },
    { id: 7, name: "Penthouse Skyscraper", type: "penthouse", price: 15000000, desc: "The peak of luxury overlooking the entire city." }
];

export const PROPERTY_TYPES = {
    apartment: { icon: "fa-building", color: "text-blue-400" },
    townhouse: { icon: "fa-city", color: "text-indigo-400" },
    house: { icon: "fa-house", color: "text-green-400" },
    condo: { icon: "fa-building-user", color: "text-purple-400" },
    villa: { icon: "fa-place-of-worship", color: "text-amber-400" },
    estate: { icon: "fa-landmark", color: "text-emerald-400" },
    penthouse: { icon: "fa-crown", color: "text-yellow-400" },
    default: { icon: "fa-home", color: "text-slate-400" }
};

export function getPropertyIcon(type) {
    const key = type ? type.toLowerCase() : 'default';
    return PROPERTY_TYPES[key] || PROPERTY_TYPES.default;
}

export function calculateMonthlyMortgage(principal, annualRate = 0.065, years = 30) {
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


export function calculateTotalMonthlyMortgages(user) {
    if (!user || !Array.isArray(user.assets)) return 0;
    return calculatePropertyMonthlyOutflow(user.assets);
}

export function canAffordMortgage(user, newMonthlyPayment) {
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

export function processMortgagePayments(user) {
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


export function updateOwnedProperties(user) {
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

export function calculateMaintenanceCost(property) {
    if (!property || !property.value) return 0;
    return Math.max(250, Math.floor(property.value * 0.0075));
}

export function performPropertyMaintenance(user, propertyId) {
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

export function calculateRenovationOptions(property) {
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

export function renovateProperty(user, propertyId, optionId) {
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

export function calculatePropertySaleTiers(property) {
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

export function generatePropertyBuyerOffer(property, tierId) {
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

export function completePropertySale(user, propertyId, offerAmount) {
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
