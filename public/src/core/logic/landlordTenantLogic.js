import { addLog } from '../state.js';
import { AvatarLogic } from '../avatarLogic.js';
import { isAlive } from './playerStatsLogic.js';
import { getRandomFirstName, getRandomLastName } from './npcGeneratorLogic.js';

export function calculateTotalRentalIncome(assets, user = null) {
    if (!Array.isArray(assets)) return 0;
    const gross = assets.reduce((sum, asset) => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            return sum + asset.tenant.monthlyRent;
        }
        return sum;
    }, 0);
    // A hired property manager keeps a fee on all rent collected
    if (isPropertyManagerHired(user)) {
        return gross - Math.round(gross * PROPERTY_MANAGER_FEE_RATE);
    }
    return gross;
}

export function generateTenantApplicants(property) {
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
        monthlyRent: Math.max(500, Math.round(val * 0.007)),
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
        monthlyRent: Math.max(650, Math.round(val * 0.009)),
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
        monthlyRent: Math.max(800, Math.round(val * 0.011)),
        leaseYears: 3,
        desc: 'Offers top-tier rent and a long lease, but has an unverified employment history.'
    };
    app3.appearance = AvatarLogic.generateRandomAppearance(`${seedTime}_3`, 'male');

    return [app1, app2, app3];
}

export function acceptTenantLease(user, propertyId, applicantId) {
    if (!user || !Array.isArray(user.assets)) return { success: false, reason: "No assets found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot manage properties while dead or at 0 HP." };
    const property = user.assets.find(a => a.id === propertyId);
    if (!property || property.category !== 'property') return { success: false, reason: "Property not found." };

    if (property.isRented && property.tenant) {
        return { success: false, reason: "Property is already occupied by a tenant." };
    }

    const applicants = property._screeningApplicants || generateTenantApplicants(property);
    delete property._screeningApplicants;
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

export function processRentalIncome(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return 0;

    let totalCollectedThisYear = 0;
    const managerHired = isPropertyManagerHired(user);
    const report = managerHired ? getCurrentManagerReport(user, true) : null;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant && asset.tenant.monthlyRent) {
            if (managerHired) {
                if (asset.tenant.renewalPending) {
                    asset.tenant.renewalPending = false;
                }
                totalCollectedThisYear += collectManagedRent(user, asset, report);
                return;
            }

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

    if (report && report.properties.length > 0) {
        const count = report.properties.length;
        addLog(`Property manager ${user.propertyManager.name} collected $${report.gross.toLocaleString()} in rent across ${count} ${count === 1 ? 'property' : 'properties'} (10% fee: $${report.fee.toLocaleString()}). You received $${report.net.toLocaleString()}.`, 'good');
    }

    return totalCollectedThisYear;
}

export function processTenantEvents(user, stateRef) {
    if (!user || !Array.isArray(user.assets)) return;

    const managerHired = isPropertyManagerHired(user);
    const report = managerHired ? getCurrentManagerReport(user) : null;

    user.assets.forEach(asset => {
        if (asset.category === 'property' && asset.isRented && asset.tenant) {
            if (managerHired) {
                processManagedTenant(user, asset, report);
                return;
            }

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

    if (managerHired && stateRef && stateRef.gameState) {
        if (!Array.isArray(stateRef.gameState.pendingTenantEvents)) stateRef.gameState.pendingTenantEvents = [];
        // The manager handles overdue rent, renewals and damage for managed properties: drop legacy popups for them
        stateRef.gameState.pendingTenantEvents = stateRef.gameState.pendingTenantEvents.filter(e => {
            if (e.eventType === 'manager_report') return false;
            const prop = user.assets.find(a => a.id === e.propertyId);
            return !isPropertyManaged(user, prop);
        });
        const hasContent = report.properties.length > 0 || report.activity.length > 0 || report.repairs.length > 0;
        if (hasContent) {
            stateRef.gameState.pendingTenantEvents.push({ eventType: 'manager_report', age: report.age });
        }
    }
}

export function evictTenant(user, propertyId) {
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

// --- PROPERTY MANAGER ---
// A hired property manager runs every RENTED property (vacant properties are never managed
// and never charged). They collect rent for a disclosed fee, quietly handle late rent,
// auto-renew leases / place replacement tenants, and only escalate repair requests.

export const PROPERTY_MANAGER_FEE_RATE = 0.10;
export const MANAGER_REPAIR_CHANCE = 0.20;
export const MANAGER_REPAIR_CONDITION_GAIN = 5;
export const MANAGER_BASE_RENEWAL_CHANCE = 0.70;
export const MANAGER_NEGLECTED_RENEWAL_CHANCE = 0.50;

export const MANAGER_REPAIR_TYPES = [
    { type: 'Leaky Roof', icon: 'fa-house-damage', desc: 'Water is getting in during storms. Needs patching before it spreads.' },
    { type: 'HVAC Failure', icon: 'fa-fan', desc: 'The heating/cooling unit stopped working. The tenant is uncomfortable.' },
    { type: 'Water Heater', icon: 'fa-fire', desc: 'The water heater is failing and needs replacement.' },
    { type: 'Plumbing Leak', icon: 'fa-faucet', desc: 'A pipe is leaking under the kitchen sink.' },
    { type: 'Appliance Replacement', icon: 'fa-blender', desc: 'A major appliance broke down and needs replacing.' },
    { type: 'Electrical Issue', icon: 'fa-bolt', desc: 'Faulty wiring is tripping breakers. Should be fixed for safety.' },
    { type: 'Tenant Wear & Tear', icon: 'fa-paint-roller', desc: 'Normal wear and tear: scuffed walls, worn carpet, loose fixtures.' }
];

export function isPropertyManagerHired(user) {
    return !!(user && user.propertyManager && user.propertyManager.hired);
}

export function isPropertyManaged(user, asset) {
    return isPropertyManagerHired(user) &&
        !!asset && asset.category === 'property' && !!asset.isRented && !!asset.tenant;
}

export function getRentedProperties(user) {
    if (!user || !Array.isArray(user.assets)) return [];
    return user.assets.filter(a => a && a.category === 'property' && a.isRented && a.tenant && a.tenant.monthlyRent > 0);
}

export function generatePropertyManagerCandidate() {
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const id = `pm_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    return {
        id,
        name: `${getRandomFirstName(gender)} ${getRandomLastName()}`,
        gender,
        age: Math.floor(Math.random() * 25) + 30,
        title: 'Licensed Property Manager',
        feeRate: PROPERTY_MANAGER_FEE_RATE,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

export function hirePropertyManager(user, candidate = null) {
    if (!user) return { success: false, reason: "No player found." };
    if (!isAlive(user)) return { success: false, reason: "Cannot hire a property manager while dead or at 0 HP." };
    if (isPropertyManagerHired(user)) return { success: false, reason: "You already have a property manager." };
    if (getRentedProperties(user).length === 0) {
        return { success: false, reason: "You need at least one rented property before hiring a property manager." };
    }

    const pick = candidate && candidate.name ? candidate : generatePropertyManagerCandidate();
    user.propertyManager = {
        hired: true,
        id: pick.id,
        name: pick.name,
        gender: pick.gender,
        age: pick.age,
        title: pick.title || 'Licensed Property Manager',
        appearance: pick.appearance,
        feeRate: PROPERTY_MANAGER_FEE_RATE,
        hiredAtAge: user.age,
        lifetimeRentCollected: 0,
        lifetimeFeesPaid: 0,
        lifetimeRepairSpend: 0,
        lastReport: null
    };

    // Clean up any stale renewalPending flags on existing tenants so manager immediately assumes active management
    if (Array.isArray(user.assets)) {
        user.assets.forEach(asset => {
            if (asset && asset.category === 'property' && asset.isRented && asset.tenant) {
                if (asset.tenant.renewalPending) {
                    asset.tenant.renewalPending = false;
                    if (asset.tenant.leaseYears <= 0) {
                        asset.tenant.leaseYears = 1;
                    }
                }
            }
        });
    }

    return { success: true, manager: user.propertyManager };
}

export function firePropertyManager(user) {
    if (!isPropertyManagerHired(user)) return { success: false, reason: "You don't have a property manager." };
    const name = user.propertyManager.name;
    user.propertyManager = null;
    return { success: true, managerName: name };
}

export function getPropertyManagerSummary(user) {
    const rented = getRentedProperties(user);
    const grossMonthly = rented.reduce((sum, p) => sum + p.tenant.monthlyRent, 0);
    const feeMonthly = Math.round(grossMonthly * PROPERTY_MANAGER_FEE_RATE);
    return {
        hired: isPropertyManagerHired(user),
        manager: isPropertyManagerHired(user) ? user.propertyManager : null,
        feeRate: PROPERTY_MANAGER_FEE_RATE,
        managedCount: rented.length,
        grossMonthly,
        feeMonthly,
        netMonthly: grossMonthly - feeMonthly
    };
}

// Returns this year's report, creating a fresh one when the stored report is from a prior year.
export function getCurrentManagerReport(user, forceNew = false) {
    const pm = user.propertyManager;
    if (!forceNew && pm.lastReport && pm.lastReport.age === user.age) return pm.lastReport;
    pm.lastReport = {
        age: user.age,
        properties: [],
        activity: [],
        repairs: [],
        gross: 0,
        fee: 0,
        net: 0
    };
    return pm.lastReport;
}

export function collectManagedRent(user, asset, report) {
    const pm = user.propertyManager;
    const tenant = asset.tenant;
    const monthly = tenant.monthlyRent;
    let months = 12;
    let note = 'Paid in full';

    // Manager chases late payments, so losses are smaller than self-managed and no popups are raised
    if (tenant.quality === 'risky' && Math.random() < 0.25) {
        months = 11;
        note = 'Fell 2 months behind; I recovered 1 month';
    } else if (tenant.quality === 'good' && Math.random() < 0.10) {
        note = 'Paid late; I collected in full';
    }

    const gross = monthly * months;
    const fee = Math.round(gross * PROPERTY_MANAGER_FEE_RATE);
    const net = gross - fee;

    user.money += net;
    pm.lifetimeRentCollected = (pm.lifetimeRentCollected || 0) + gross;
    pm.lifetimeFeesPaid = (pm.lifetimeFeesPaid || 0) + fee;

    report.properties.push({
        propertyId: asset.id,
        propertyName: asset.name,
        tenantName: tenant.name,
        monthlyRent: monthly,
        gross,
        fee,
        net,
        note
    });
    report.gross += gross;
    report.fee += fee;
    report.net += net;
    return net;
}

export function placeReplacementTenant(asset) {
    const applicants = generateTenantApplicants(asset);
    const targetQuality = asset.tenant?.quality || 'excellent';
    const pick = applicants.find(a => a.quality === targetQuality) ||
                 applicants.find(a => a.quality === 'excellent') ||
                 applicants[0];
    if (!pick) {
        asset.isRented = false;
        asset.tenant = null;
        return null;
    }
    asset.isRented = true;
    asset.tenant = {
        id: `${pick.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        name: pick.name,
        gender: pick.gender,
        age: pick.age,
        type: pick.type,
        quality: pick.quality,
        monthlyRent: pick.monthlyRent,
        leaseYears: pick.leaseYears,
        appearance: pick.appearance,
        renewalPending: false
    };
    return asset.tenant;
}

export function processManagedTenant(user, asset, report) {
    const pm = user.propertyManager;
    const tenant = asset.tenant;

    if (tenant.renewalPending) {
        // Renewal left over from before the manager was hired: resolve it now
        tenant.renewalPending = false;
        tenant.leaseYears = 0;
    } else {
        tenant.leaseYears -= 1;
    }

    if (tenant.leaseYears <= 0) {
        const renewChance = tenant.repairNeglect > 0 ? MANAGER_NEGLECTED_RENEWAL_CHANCE : MANAGER_BASE_RENEWAL_CHANCE;
        let leaveReason = `${tenant.name} chose not to renew at ${asset.name}`;

        if (Math.random() < renewChance) {
            const years = Math.floor(Math.random() * 3) + 1;
            const newRent = Math.floor(tenant.monthlyRent * 1.05);
            if (Math.random() < 0.80) {
                tenant.monthlyRent = newRent;
                tenant.leaseYears = years;
                tenant.repairNeglect = 0;
                const text = `Renewed ${tenant.name}'s lease at ${asset.name} for ${years} year${years === 1 ? '' : 's'} at $${newRent.toLocaleString()}/mo (+5%).`;
                report.activity.push({ type: 'renewal', icon: 'fa-file-signature', text });
                addLog(`Property manager ${pm.name}: ${text}`, 'good');
                return;
            }
            leaveReason = `${tenant.name} declined the 5% increase and moved out of ${asset.name}`;
        } else if (tenant.repairNeglect > 0) {
            leaveReason = `${tenant.name} moved out of ${asset.name}, unhappy about unrepaired issues`;
        }

        const newTenant = placeReplacementTenant(asset);
        const text = newTenant
            ? `${leaveReason}. I placed a new tenant, ${newTenant.name}, at $${newTenant.monthlyRent.toLocaleString()}/mo (${newTenant.leaseYears}-yr lease).`
            : `${leaveReason}. The property is now vacant.`;
        report.activity.push({ type: 'new_tenant', icon: 'fa-user-plus', text });
        addLog(`Property manager ${pm.name}: ${text}`, 'neutral');
        return;
    }

    if (Math.random() < MANAGER_REPAIR_CHANCE) {
        const def = MANAGER_REPAIR_TYPES[Math.floor(Math.random() * MANAGER_REPAIR_TYPES.length)];
        const cost = Math.max(300, Math.floor((asset.value || 0) * (0.005 + Math.random() * 0.005)));
        report.repairs.push({
            id: `repair_${asset.id}_${report.age}_${report.repairs.length}`,
            propertyId: asset.id,
            propertyName: asset.name,
            tenantName: tenant.name,
            type: def.type,
            icon: def.icon,
            desc: def.desc,
            cost,
            conditionLoss: 10 + Math.floor(Math.random() * 6),
            conditionGain: MANAGER_REPAIR_CONDITION_GAIN,
            status: 'pending'
        });
    }
}

export function getPendingManagerRepairs(user) {
    if (!isPropertyManagerHired(user) || !user.propertyManager.lastReport) return [];
    return (user.propertyManager.lastReport.repairs || []).filter(r => r.status === 'pending');
}

export function resolveManagerRepair(user, repairId, approve) {
    if (!isPropertyManagerHired(user) || !user.propertyManager.lastReport) {
        return { success: false, reason: "No property manager report found." };
    }
    const pm = user.propertyManager;
    const repair = (pm.lastReport.repairs || []).find(r => r.id === repairId);
    if (!repair) return { success: false, reason: "Repair request not found." };
    if (repair.status !== 'pending') return { success: false, reason: "This repair request was already handled." };

    const property = (user.assets || []).find(a => a.id === repair.propertyId && a.category === 'property');
    if (!property) {
        repair.status = 'cancelled';
        return { success: true, status: 'cancelled', repair };
    }
    if (property.condition === undefined) property.condition = 100;
    if (property.maxCondition === undefined) property.maxCondition = 100;

    if (approve) {
        if ((user.money || 0) < repair.cost) {
            return { success: false, reason: `Insufficient funds. This repair costs $${repair.cost.toLocaleString()}.` };
        }
        user.money -= repair.cost;
        property.condition = Math.min(property.maxCondition, property.condition + repair.conditionGain);
        pm.lifetimeRepairSpend = (pm.lifetimeRepairSpend || 0) + repair.cost;
        repair.status = 'approved';
        return { success: true, status: 'approved', repair, propertyName: property.name };
    }

    property.condition = Math.max(0, property.condition - repair.conditionLoss);
    if (property.tenant) property.tenant.repairNeglect = (property.tenant.repairNeglect || 0) + 1;
    repair.status = 'declined';
    return { success: true, status: 'declined', repair, propertyName: property.name };
}

export function calculatePropertyMonthlyOutflow(assets) {
    const list = Array.isArray(assets) ? assets : (assets && Array.isArray(assets.assets) ? assets.assets : null);
    if (!list) return 0;
    return list.reduce((sum, asset) => {
        if (asset && asset.category === 'property' && asset.mortgage && asset.mortgage.remainingBalance > 0) {
            const payment = Math.max(0, Number(asset.mortgage.monthlyPayment) || 0);
            return sum + payment;
        }
        return sum;
    }, 0);
}
