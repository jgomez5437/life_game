import { state, hasPurchasedPack } from './state.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../ui/utils.js';
import { renderAvatar } from '../ui/avatarRenderer.js';

const buyPack = async (...args) => (await import('../features/store/storeScreen.js')).buyPack(...args);

const STORAGE_KEY = 'life_game_slots';

/**
 * Recursively deep clones an object safely.
 * Prefers native structuredClone, falling back to a recursive clone for environments
 * or payloads where structuredClone cannot be applied directly.
 */
export function deepClone(obj, visited = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch (e) {
            // Fallback for non-cloneable objects or errors
        }
    }

    if (visited.has(obj)) {
        return visited.get(obj);
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
        const arrCopy = [];
        visited.set(obj, arrCopy);
        for (let i = 0; i < obj.length; i++) {
            arrCopy[i] = deepClone(obj[i], visited);
        }
        return arrCopy;
    }

    const objCopy = Object.create(Object.getPrototypeOf(obj));
    visited.set(objCopy, objCopy);
    for (const key of Object.keys(obj)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
        objCopy[key] = deepClone(obj[key], visited);
    }
    return objCopy;
}

/**
 * Sanitizes game state recursively:
 * - Clamps Infinity / values > Number.MAX_SAFE_INTEGER to Number.MAX_SAFE_INTEGER.
 * - Clamps -Infinity / values < -Number.MAX_SAFE_INTEGER to -Number.MAX_SAFE_INTEGER.
 * - Replaces NaN with 0.
 * - Strips prototype pollution keys.
 */
export function sanitizeGameState(obj, visited = new WeakSet()) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'number') {
        if (Number.isNaN(obj)) return 0;
        if (obj === Infinity || obj > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
        if (obj === -Infinity || obj < -Number.MAX_SAFE_INTEGER) return -Number.MAX_SAFE_INTEGER;
        return obj;
    }

    if (typeof obj !== 'object') return obj;

    if (visited.has(obj)) return obj;
    visited.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeGameState(item, visited));
    }

    const sanitized = {};
    for (const key of Object.keys(obj)) {
        if (['__proto__', 'constructor', 'prototype', 'purchasedPacks', 'godMode', 'isVIP', 'vipLevel'].includes(key)) continue;
        const val = obj[key];
        if (val !== undefined) {
            sanitized[key] = sanitizeGameState(val, visited);
        }
    }
    return sanitized;
}

/**
 * Comprehensive schema validator and state migrator.
 * Ingests any raw save payload (legacy single-save, partial cloud game_data,
 * save slot object, time machine snapshot, or corrupted state), validates types,
 * fills missing defaults for all game subsystems, strips unknown/dangerous fields,
 * and outputs a guaranteed valid, non-crashing gameState object.
 *
 * @param {object} rawState - Any raw save state payload
 * @returns {object|null} Well-formed gameState object, or null if unrecoverable
 */
export function migrateState(rawState) {
    if (!rawState || typeof rawState !== 'object') return null;

    const origUser = (rawState.user && typeof rawState.user === 'object' && !Array.isArray(rawState.user))
        ? rawState.user
        : rawState;

    // Deep sanitize numbers (Infinity, -Infinity, NaN) and strip prototype pollution
    const cleanRaw = sanitizeGameState(rawState);
    if (!cleanRaw || typeof cleanRaw !== 'object') return null;

    const rawUser = (cleanRaw.user && typeof cleanRaw.user === 'object' && !Array.isArray(cleanRaw.user))
        ? cleanRaw.user
        : cleanRaw;

    const toNum = (val, defaultVal = 0, min = -Infinity, max = Infinity) => {
        let n = defaultVal;
        if (typeof val === 'number') {
            n = Number.isNaN(val) ? defaultVal : val;
        } else if (typeof val === 'string' && val.trim() !== '') {
            const parsed = Number(val);
            n = Number.isNaN(parsed) ? defaultVal : parsed;
        }
        if (n === Infinity || n > Number.MAX_SAFE_INTEGER) n = Number.MAX_SAFE_INTEGER;
        if (n === -Infinity || n < -Number.MAX_SAFE_INTEGER) n = -Number.MAX_SAFE_INTEGER;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    };

    const toBool = (val, defaultVal = false) => {
        if (typeof val === 'boolean') return val;
        if (val === 'true') return true;
        if (val === 'false') return false;
        return defaultVal;
    };

    const toStr = (val, defaultVal = '') => {
        if (typeof val === 'string') return val.trim();
        if (typeof val === 'number') return String(val);
        return defaultVal;
    };

    const toArr = (val, defaultVal = []) => {
        return Array.isArray(val) ? val : defaultVal;
    };

    const u = rawUser || {};

    // 1. Identity & Core Vitals
    const age = toNum(u.age, 0, 0, 150);
    const health = toNum(u.health, 100, 0, 100);
    const happiness = (origUser && typeof origUser.happiness === 'number' && Number.isNaN(origUser.happiness)) ? 0 : toNum(u.happiness, 100, 0, 100);
    const smarts = (origUser && typeof origUser.smarts === 'number' && Number.isNaN(origUser.smarts)) ? 50 : toNum(u.smarts, 50, 0, 100);
    const looks = toNum(u.looks, 50, 0, 100);
    const money = toNum(u.money, 0, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const isDead = toBool(u.isDead || u.is_dead, false);
    const inPrison = toBool(u.inPrison, false);

    // Life Status validation
    const validLifeStatuses = ["Baby", "Child", "Teen", "Young Adult", "Adult", "Senior", "Deceased", "Inmate"];
    let lifeStatus = toStr(u.lifeStatus || u.life_status, '');
    if (!validLifeStatuses.includes(lifeStatus)) {
        if (isDead) lifeStatus = "Deceased";
        else if (inPrison) lifeStatus = "Inmate";
        else if (age < 3) lifeStatus = "Baby";
        else if (age < 13) lifeStatus = "Child";
        else if (age < 18) lifeStatus = "Teen";
        else if (age < 25) lifeStatus = "Young Adult";
        else if (age < 65) lifeStatus = "Adult";
        else lifeStatus = "Senior";
    }

    // Appearance object check
    let appearance = null;
    if (u.appearance && typeof u.appearance === 'object' && !Array.isArray(u.appearance)) {
        appearance = { ...u.appearance };
    }

    // 2. Education
    const isStudent = toBool(u.isStudent || u.is_student, false);
    const universityEnrolled = toBool(u.universityEnrolled || u.university_enrolled, false);
    const universitySchoolYear = toNum(u.universitySchoolYear || u.university_school_year, 0, 0, 10);
    const universityGraduated = toBool(u.universityGraduated, false);
    const major = toStr(u.major, '');
    const schoolActions = toNum(u.schoolActions || u.school_actions, 0, 0);
    const schoolPerformance = toNum(u.schoolPerformance || u.school_performance, 50, 0, 100);
    const highSchoolRetained = toBool(u.highSchoolRetained || u.high_school_retained, false);
    const gradSchoolEnrolled = toBool(u.gradSchoolEnrolled || u.grad_school_enrolled, false);
    const gradSchoolType = u.gradSchoolType || u.grad_school_type ? toStr(u.gradSchoolType || u.grad_school_type, null) : null;
    const gradSchoolYear = toNum(u.gradSchoolYear || u.grad_school_year, 0, 0, 10);
    const gradSchoolDegree = u.gradSchoolDegree || u.grad_school_degree ? toStr(u.gradSchoolDegree || u.grad_school_degree, null) : null;
    const parentsTried = toBool(u.parentsTried || u.parents_tried, false);

    // 3. Career & Finance
    const jobTitle = toStr(u.jobTitle || u.job_title, '');
    const jobSalary = toNum(u.jobSalary || u.job_salary, 0, 0);
    const jobPerformance = toNum(u.jobPerformance, 50, 0, 100);
    const careerActionTaken = toNum(u.careerActionTaken || u.career_action_taken, 0, 0);
    const careerTrack = u.careerTrack ? toStr(u.careerTrack, null) : null;
    const careerLevel = toNum(u.careerLevel, 0, 0);
    const yearsInRole = toNum(u.yearsInRole, 0, 0);
    const consecutivePoorYears = toNum(u.consecutivePoorYears, 0, 0);
    const monthlyOutflow = toNum(u.monthlyOutflow || u.monthly_outflow, 0, 0);
    const studentLoans = toNum(u.studentLoans || u.student_loans, 0, 0);
    const monthlyLivingExpense = toNum(u.monthlyLivingExpense || u.monthly_living_expense, 0, 0);

    // 4. Business Subsystem
    const hasBusiness = toBool(u.hasBusiness || u.has_business, false);
    const companyName = u.companyName ? toStr(u.companyName, null) : null;
    const ceoSalary = toNum(u.ceoSalary, 0, 0);
    const industry = u.industry ? toStr(u.industry, null) : null;
    const compCash = toNum(u.compCash, 0, 0);
    const companyYear = toNum(u.companyYear, 1, 1);
    const companyQuarter = toNum(u.companyQuarter, 1, 1, 4);
    const employees = toNum(u.employees, 0, 0);
    const businessReputation = toNum(u.businessReputation, 0, 0, 100);
    const inventory = toNum(u.inventory, 0, 0);
    const productionTarget = toNum(u.productionTarget, 0, 0);
    const sellingPrice = toNum(u.sellingPrice, 0, 0);
    const salaryOffer = toNum(u.salaryOffer, 0, 0);
    const supplierId = u.supplierId ? toStr(u.supplierId, null) : null;
    const hqTier = toStr(u.hqTier, 'garage');

    const rawMkt = (u.marketingLevels && typeof u.marketingLevels === 'object') ? u.marketingLevels : {};
    const marketingLevels = {
        social_ads: toNum(rawMkt.social_ads, 0, 0),
        seo_content: toNum(rawMkt.seo_content, 0, 0),
        influencers: toNum(rawMkt.influencers, 0, 0),
        b2b_sales: toNum(rawMkt.b2b_sales, 0, 0)
    };

    const rawRoles = (u.teamRoles && typeof u.teamRoles === 'object') ? u.teamRoles : {};
    const teamRoles = {
        engineering: toNum(rawRoles.engineering, 2, 0),
        sales: toNum(rawRoles.sales, 1, 0),
        operations: toNum(rawRoles.operations, 1, 0),
        marketing: toNum(rawRoles.marketing, 1, 0)
    };

    const equityOwned = toNum(u.equityOwned, 1.0, 0, 1.0);
    const isPublic = toBool(u.isPublic, false);
    const investorShares = Array.isArray(u.investorShares) ? u.investorShares.filter(s => s && typeof s === 'object') : [];

    const rawDebt = (u.corporateDebt && typeof u.corporateDebt === 'object') ? u.corporateDebt : {};
    const corporateDebt = {
        principal: toNum(rawDebt.principal, 0, 0),
        interestRate: toNum(rawDebt.interestRate, 0.08, 0),
        monthlyPayment: toNum(rawDebt.monthlyPayment, 0, 0)
    };

    const customerSatisfaction = toNum(u.customerSatisfaction, 75, 0, 100);
    const employeeMorale = toNum(u.employeeMorale, 80, 0, 100);
    const activeResearch = toArr(u.activeResearch, []);
    const businessHistory = Array.isArray(u.businessHistory) ? u.businessHistory.filter(h => h && typeof h === 'object') : [];
    const businessUpgrades = toArr(u.businessUpgrades, []);
    const lastCompletedFiscalYearAge = (u.lastCompletedFiscalYearAge !== undefined && u.lastCompletedFiscalYearAge !== null)
        ? toNum(u.lastCompletedFiscalYearAge, 0, 0)
        : null;
    const lastBusinessAge = (u.lastBusinessAge !== undefined && u.lastBusinessAge !== null)
        ? toNum(u.lastBusinessAge, 0, 0)
        : null;
    const quartersProcessedThisAge = toNum(u.quartersProcessedThisAge, 0, 0, 4);

    // 5. Lifestyle & Underworld
    const gymMembership = toBool(u.gymMembership, false);
    const hasBetterDiet = toBool(u.hasBetterDiet, false);
    const hasSeenExpenseMsg = toBool(u.hasSeenExpenseMsg || u.has_seen_expense_message, false);
    const hasSeenJobSalary = toBool(u.hasSeenJobSalary || u.has_seen_job_salary, false);
    const lifetimeCrimesCommitted = toNum(u.lifetimeCrimesCommitted, 0, 0);
    const mafiaCrimesThisYear = toNum(u.mafiaCrimesThisYear, 0, 0);

    // 6. Prison State
    const prisonSentenceRemaining = toNum(u.prisonSentenceRemaining, 0, 0);
    const prisonTotalSentence = toNum(u.prisonTotalSentence, 0, 0);
    const validSecurities = ['Minimum', 'Medium', 'Maximum', 'Supermax'];
    const prisonSecurity = validSecurities.includes(u.prisonSecurity) ? u.prisonSecurity : 'Minimum';
    const facilityName = u.facilityName ? toStr(u.facilityName, null) : null;

    let prisonStats = null;
    if (inPrison || (u.prisonStats && typeof u.prisonStats === 'object')) {
        const rawPs = u.prisonStats || {};
        prisonStats = {
            respect: toNum(rawPs.respect, 25, 0, 100),
            guardRelation: toNum(rawPs.guardRelation, 50, 0, 100),
            gang: toStr(rawPs.gang, 'None'),
            canteenCash: toNum(rawPs.canteenCash, 50, 0),
            solitaryTurns: toNum(rawPs.solitaryTurns, 0, 0),
            goodBehaviorPoints: toNum(rawPs.goodBehaviorPoints, 10, 0),
            prisonJob: toStr(rawPs.prisonJob, 'None'),
            lawStudied: toNum(rawPs.lawStudied, 0, 0),
            contraband: toArr(rawPs.contraband, [])
        };
    }
    const cellmate = (u.cellmate && typeof u.cellmate === 'object' && !Array.isArray(u.cellmate)) ? u.cellmate : null;
    const yardInmates = Array.isArray(u.yardInmates) ? u.yardInmates.filter(i => i && typeof i === 'object') : [];

    // 7. Assets & Investments
    const assets = Array.isArray(u.assets || cleanRaw.assets) ? (u.assets || cleanRaw.assets).filter(a => a && typeof a === 'object') : [];
    let investments = null;
    if (u.investments && typeof u.investments === 'object') {
        const rawInv = u.investments;
        investments = {
            stocks: Array.isArray(rawInv.stocks) ? rawInv.stocks.filter(s => s && typeof s === 'object') : [],
            crypto: Array.isArray(rawInv.crypto) ? rawInv.crypto.filter(c => c && typeof c === 'object') : [],
            savingsAccount: (rawInv.savingsAccount && typeof rawInv.savingsAccount === 'object')
                ? {
                    balance: toNum(rawInv.savingsAccount.balance, 0, 0),
                    apr: toNum(rawInv.savingsAccount.apr, 0.04, 0)
                }
                : { balance: 0, apr: 0.04 }
        };
    }

    // 8. Relationships
    const relationships = Array.isArray(u.relationships)
        ? u.relationships.filter(r => r && typeof r === 'object').map(r => ({
            ...r,
            id: toStr(r.id, `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            name: toStr(r.name, 'Acquaintance'),
            gender: ['male', 'female', 'non-binary'].includes(r.gender) ? r.gender : (['Wife', 'Mother', 'Sister', 'Daughter', 'Girlfriend'].includes(r.type) ? 'female' : 'male'),
            category: toStr(r.category, 'friend'),
            type: toStr(r.type, 'Friend'),
            age: toNum(r.age, 20, 0, 150),
            status: toNum(r.status, 50, 0, 100)
        }))
        : [];
    const hadUnfaithfulHookupThisYear = toBool(u.hadUnfaithfulHookupThisYear, false);
    const isExpecting = toBool(u.isExpecting, false);
    const expectingWithId = u.expectingWithId ? toStr(u.expectingWithId, null) : null;

    // 9. Purchases & Lineage (authoritatively derived from server when logged in)
    const purchases = Array.isArray(state.verifiedPurchases)
        ? [...state.verifiedPurchases]
        : (Array.isArray(u.purchases) ? u.purchases.map(p => toStr(p)).filter(Boolean) : []);
    const pastLives = Array.isArray(u.pastLives) ? u.pastLives.filter(p => p && typeof p === 'object') : [];
    const generation = toNum(u.generation, 1, 1);

    // Build the migrated user object with strict schema whitelist
    const migratedUser = {
        username: toStr(u.username || u.name, "Player"),
        gender: ['male', 'female', 'non-binary'].includes(u.gender) ? u.gender : 'male',
        country: toStr(u.country, "United States"),
        city: toStr(u.city, "New York"),
        appearance,
        avatarVersion: toNum(u.avatarVersion, 0, 0),
        age,
        health,
        happiness,
        smarts,
        looks,
        money,
        lifeStatus,
        isDead,
        deathCause: u.deathCause ? toStr(u.deathCause, 'natural causes') : null,

        isStudent,
        universityEnrolled,
        universitySchoolYear,
        universityGraduated,
        major,
        parentsTried,
        schoolActions,
        schoolPerformance,
        highSchoolRetained,
        gradSchoolEnrolled,
        gradSchoolType,
        gradSchoolYear,
        gradSchoolDegree,

        jobTitle,
        jobSalary,
        jobPerformance,
        hasSeenJobSalary,
        careerActionTaken,
        careerTrack,
        careerLevel,
        yearsInRole,
        consecutivePoorYears,
        monthlyOutflow,
        studentLoans,
        monthlyLivingExpense,

        hasBusiness,
        companyName,
        ceoSalary,
        industry,
        compCash,
        companyYear,
        companyQuarter,
        employees,
        businessReputation,
        inventory,
        productionTarget,
        sellingPrice,
        salaryOffer,
        supplierId,
        hqTier,
        marketingLevels,
        teamRoles,
        equityOwned,
        isPublic,
        investorShares,
        corporateDebt,
        customerSatisfaction,
        employeeMorale,
        activeResearch,
        businessHistory,
        businessUpgrades,
        lastCompletedFiscalYearAge,
        lastBusinessAge,
        quartersProcessedThisAge,
        ...(u.businessValuation !== undefined ? { businessValuation: toNum(u.businessValuation, 0, 0) } : {}),

        gymMembership,
        hasBetterDiet,
        hasSeenExpenseMsg,
        lifetimeCrimesCommitted,
        mafiaCrimesThisYear,

        inPrison,
        prisonSentenceRemaining,
        prisonTotalSentence,
        prisonSecurity,
        facilityName,
        prisonStats,
        cellmate,
        yardInmates,

        assets,
        investments,

        relationships,
        hadUnfaithfulHookupThisYear,
        isExpecting,
        expectingWithId,

        purchases,
        pastLives,
        generation
    };

    // 10. Top-Level lifeLog
    let lifeLog = [];
    const rawHistory = rawState.lifeLog || rawState.history;
    if (Array.isArray(rawHistory)) {
        lifeLog = rawHistory.map(entry => {
            if (typeof entry === 'object' && entry !== null && Array.isArray(entry.events)) {
                return {
                    age: toNum(entry.age, migratedUser.age, 0),
                    events: entry.events.map(ev => {
                        if (typeof ev === 'object' && ev !== null && ev.msg) {
                            return { msg: toStr(ev.msg), color: toStr(ev.color, 'text-gray-400') };
                        }
                        return { msg: toStr(ev), color: 'text-gray-400' };
                    })
                };
            }
            if (typeof entry === 'string') {
                return {
                    age: migratedUser.age,
                    events: [{ msg: entry, color: 'text-gray-400' }]
                };
            }
            return null;
        }).filter(Boolean);
    }
    if (lifeLog.length === 0) {
        lifeLog = [{ age: migratedUser.age, events: [{ msg: "Game Loaded.", color: "text-white" }] }];
    }

    // 11. Top-Level snapshots
    let snapshots = [];
    if (Array.isArray(rawState.snapshots)) {
        snapshots = rawState.snapshots
            .filter(s => s && typeof s === 'object' && typeof s.age === 'number')
            .slice(-5);
    }

    // 12. Top-Level achievements
    let achievements = {};
    const rawAch = rawState.achievements || rawUser.achievements;
    if (rawAch && typeof rawAch === 'object' && !Array.isArray(rawAch)) {
        achievements = { ...rawAch };
    }

    // 13. Top-Level _slotId
    const slotIdCandidate = rawState._slotId || rawState.slotId;
    const _slotId = isValidSlotId(slotIdCandidate) ? slotIdCandidate : 'slot_1';

    return {
        user: migratedUser,
        lifeLog,
        snapshots,
        assets: migratedUser.assets,
        achievements,
        _slotId
    };
}

/**
 * Validates save slot identifier against allowed patterns.
 * Allowed: integer 0-9, string '0'-'9', 'slot_1' through 'slot_10', or timestamped 'slot_<10-15 digits>'.
 */
export function isValidSlotId(slotId) {
    if (slotId === null || slotId === undefined) return false;
    if (typeof slotId === 'number') {
        return Number.isInteger(slotId) && slotId >= 0 && slotId <= 9;
    }
    if (typeof slotId === 'string') {
        const s = slotId.trim();
        if (/^[0-9]$/.test(s)) return true;
        if (/^slot_([1-9]|10|[0-9]{10,15})$/.test(s)) return true;
    }
    return false;
}

/**
 * Gets slots object from localStorage (with fallback migration for single save).
 */
export function getSlotsStore() {
    let store = { activeSlotId: 'slot_1', slots: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            store = sanitizeGameState(JSON.parse(raw)) || { activeSlotId: 'slot_1', slots: {} };
            
            // Clean up orphan slots or invalid/dangerous keys and migrate existing slots
            if (store.slots && typeof store.slots === 'object') {
                let changed = false;
                Object.keys(store.slots).forEach(key => {
                    if (['__proto__', 'constructor', 'prototype'].includes(key) || !isValidSlotId(key) || store.slots[key]?.data === undefined) {
                        delete store.slots[key];
                        changed = true;
                    } else if (store.slots[key]?.data) {
                        const migrated = migrateState(store.slots[key].data);
                        if (migrated) {
                            store.slots[key].data = migrated;
                        }
                    }
                });
                if (changed) persistSlotsStore(store);
            }
        }
    } catch (e) {
        console.error("Failed to parse save slots store:", e);
    }

    // Auto-migrate legacy single save if no slots exist yet
    if (!store.slots || Object.keys(store.slots).length === 0) {
        let legacySave = null;
        try {
            const legacyRaw = localStorage.getItem('life_game_save');
            if (legacyRaw) legacySave = JSON.parse(legacyRaw);
        } catch (e) {}

        const activeData = state.gameState || legacySave;
        if (activeData) {
            const migrated = migrateState(activeData);
            if (migrated) {
                const name = migrated.user?.username || migrated.user?.name || 'Main Life';
                store.slots['slot_1'] = {
                    id: 'slot_1',
                    name: name,
                    lastSaved: Date.now(),
                    data: deepClone(migrated)
                };
                store.activeSlotId = 'slot_1';
                persistSlotsStore(store);
            }
        }
    }

    if (!isValidSlotId(store.activeSlotId)) {
        store.activeSlotId = 'slot_1';
    }

    return store;
}

/**
 * Hydrates and synchronizes the save slots store from cloud game data.
 * Supports both multi-slot cloud payloads and legacy single-slot cloud saves.
 */
export function hydrateSlotsStoreFromCloud(cloudGameData) {
    if (!cloudGameData || typeof cloudGameData !== 'object') {
        return getSlotsStore();
    }

    const cleanData = sanitizeGameState(cloudGameData);
    let store = { activeSlotId: 'slot_1', slots: {} };

    // Case 1: Multi-slot cloud data with .slots object
    if (cleanData.slots && typeof cleanData.slots === 'object' && !Array.isArray(cleanData.slots)) {
        const cloudSlotKeys = Object.keys(cleanData.slots);
        cloudSlotKeys.forEach(key => {
            if (isValidSlotId(key)) {
                const s = cleanData.slots[key];
                if (s && typeof s === 'object') {
                    store.slots[key] = {
                        id: s.id || key,
                        name: s.name || 'Life Save',
                        lastSaved: s.lastSaved || Date.now(),
                        data: s.data ? deepClone(sanitizeGameState(s.data)) : null
                    };
                }
            }
        });

        const targetActive = cleanData.activeSlotId || cleanData._slotId;
        if (isValidSlotId(targetActive) && store.slots[targetActive]) {
            store.activeSlotId = targetActive;
        } else if (Object.keys(store.slots).length > 0) {
            store.activeSlotId = Object.keys(store.slots)[0];
        } else {
            store.activeSlotId = 'slot_1';
        }
    }

    // Case 2: Legacy single-slot save (or missing/empty slots object)
    if (Object.keys(store.slots).length === 0 && (cleanData.user || cleanData.stats || cleanData.name)) {
        const name = cleanData.user?.username || cleanData.user?.name || cleanData.name || 'Main Life';
        store.slots['slot_1'] = {
            id: 'slot_1',
            name: name,
            lastSaved: Date.now(),
            data: deepClone(cleanData)
        };
        store.activeSlotId = 'slot_1';
    }

    if (Object.keys(store.slots).length > 0) {
        persistSlotsStore(store);
    }

    return store;
}

/**
 * Builds the complete multi-slot cloud save payload.
 * Encapsulates all save slots, the active slot ID, and top-level active character summary.
 */
export function buildCloudSavePayload(activeGameState = null) {
    const currentState = activeGameState || state.gameState;
    const store = getSlotsStore();

    if (currentState && currentState.user) {
        const activeSlotId = currentState._slotId || store.activeSlotId || 'slot_1';
        const targetId = isValidSlotId(activeSlotId) ? activeSlotId : 'slot_1';
        store.activeSlotId = targetId;
        currentState._slotId = targetId;

        const user = currentState.user;
        const defaultName = user.username || user.name || `Life (Age ${user.age || 0})`;
        const existingSlotName = store.slots[targetId]?.name || defaultName;

        store.slots[targetId] = {
            id: targetId,
            name: existingSlotName,
            lastSaved: Date.now(),
            data: deepClone(sanitizeGameState(currentState))
        };
        persistSlotsStore(store);
    }

    const activeSlot = store.slots[store.activeSlotId] || Object.values(store.slots)[0];
    const activeData = activeSlot?.data || currentState || {};
    const activeUser = activeData.user || currentState?.user || {};
    const activeSlotId = store.activeSlotId || 'slot_1';

    return {
        _slotId: activeSlotId,
        activeSlotId: activeSlotId,
        slots: store.slots,

        // The "Suitcase" - Contains active slot flags and top-level active character data
        user: activeUser,

        // The Lists
        history: activeData.lifeLog || currentState?.lifeLog || [],
        assets: activeData.assets || activeUser.assets || [],
        achievements: activeData.achievements || currentState?.achievements || {},

        // Time Machine snapshots (paid feature data)
        snapshots: activeData.snapshots || currentState?.snapshots || [],

        // Redundant top-level helpers for easier DB queries later
        bank: activeUser.money || 0,
        job: {
            title: activeUser.jobTitle || '',
            salary: activeUser.jobSalary || 0
        },
        stats: {
            age: activeUser.age || 0,
            health: activeUser.health ?? 100,
            happiness: activeUser.happiness ?? 100,
            smarts: activeUser.smarts ?? 50,
            looks: activeUser.looks ?? 50
        }
    };
}

/**
 * Checks if an exception represents a browser storage quota exceeded error.
 */
export function isQuotaExceededError(err) {
    if (!err) return false;
    return (
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014 ||
        err.number === -2147024882 ||
        (typeof DOMException !== 'undefined' && err instanceof DOMException && (
            err.code === 22 ||
            err.code === 1014 ||
            err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ))
    );
}

/**
 * Attempts automated compaction of stored save slots when quota is exceeded.
 */
export function attemptStoreCompaction(store) {
    try {
        // 1. Remove duplicate legacy keys
        localStorage.removeItem('life_game_save');
        localStorage.removeItem('startALife_saveData');
    } catch (e) {}

    if (!store || !store.slots) return false;

    let compacted = false;

    // 2. Prune snapshots in inactive slots down to 1
    Object.keys(store.slots).forEach(slotId => {
        if (slotId !== store.activeSlotId && Array.isArray(store.slots[slotId]?.data?.snapshots)) {
            if (store.slots[slotId].data.snapshots.length > 1) {
                store.slots[slotId].data.snapshots = store.slots[slotId].data.snapshots.slice(-1);
                compacted = true;
            }
        }
    });

    // 3. Prune snapshots in active slot down to 1
    if (store.slots[store.activeSlotId]?.data?.snapshots?.length > 1) {
        store.slots[store.activeSlotId].data.snapshots = store.slots[store.activeSlotId].data.snapshots.slice(-1);
        compacted = true;
    }

    // 4. Compact older lifeLog in inactive slots if still large (> 30 entries)
    Object.keys(store.slots).forEach(slotId => {
        if (slotId !== store.activeSlotId && Array.isArray(store.slots[slotId]?.data?.lifeLog)) {
            if (store.slots[slotId].data.lifeLog.length > 30) {
                store.slots[slotId].data.lifeLog = store.slots[slotId].data.lifeLog.slice(-30);
                compacted = true;
            }
        }
    });

    return compacted;
}

let lastQuotaAlertTime = 0;

/**
 * Displays user-facing warning modal when local storage quota is completely exhausted.
 */
export function showQuotaExceededAlert() {
    const now = Date.now();
    if (now - lastQuotaAlertTime < 60000) return; // Throttle to max 1 alert per minute
    lastQuotaAlertTime = now;

    if (typeof UI !== 'undefined' && typeof UI.showCustomModal === 'function') {
        UI.showCustomModal({
            title: "Storage Quota Exceeded",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-red-950/40 p-3.5 rounded-xl border border-red-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-red-900/60 text-red-400 border border-red-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Browser Storage Full</div>
                            <div class="text-xs text-red-300 font-medium">Local save could not be completed</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Your device browser has run out of local storage space. To prevent losing your progress, please log in or create a free account to enable automatic <strong>Cloud Saves</strong>.
                    </p>
                </div>
            `,
            confirmText: "Log In / Cloud Save",
            cancelText: "Dismiss",
            onConfirm: () => {
                import('../auth/auth.js').then(m => {
                    if (m && typeof m.login === 'function') m.login();
                }).catch(() => {});
            }
        });
    }
}

/**
 * Persists slots store to localStorage with automatic compaction and error recovery.
 */
export function persistSlotsStore(store) {
    try {
        const sanitizedStore = sanitizeGameState(store);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedStore));
        return { success: true };
    } catch (err) {
        if (isQuotaExceededError(err)) {
            console.warn("Storage quota exceeded. Attempting auto-compaction...");
            const didCompact = attemptStoreCompaction(store);
            if (didCompact) {
                try {
                    const sanitizedCompactedStore = sanitizeGameState(store);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedCompactedStore));
                    console.log("Auto-compaction successful. Save completed.");
                    return { success: true, compacted: true };
                } catch (retryErr) {
                    console.error("Save failed after compaction:", retryErr);
                }
            }
            showQuotaExceededAlert();
            return { success: false, quotaExceeded: true };
        } else {
            console.error("Failed to persist save slots store:", err);
            return { success: false, error: err };
        }
    }
}

/**
 * Saves current active game state into a designated slot.
 */
export function saveToSlot(slotId = null, customName = null) {
    if (!state.gameState || !state.gameState.user) return;

    const store = getSlotsStore();
    // Strictly isolate by state.gameState._slotId if available
    const rawTargetId = slotId || state.gameState._slotId || store.activeSlotId || 'slot_1';
    const targetId = isValidSlotId(rawTargetId) ? rawTargetId : 'slot_1';
    state.gameState._slotId = targetId;

    const cleanState = sanitizeGameState(state.gameState);
    state.gameState = cleanState;

    const user = state.gameState.user;
    const defaultName = user?.username || user?.name || `Life (Age ${user?.age || 0})`;
    const existingName = store.slots[targetId]?.name;
    const slotName = customName || existingName || defaultName;

    store.slots[targetId] = {
        id: targetId,
        name: slotName,
        lastSaved: Date.now(),
        data: deepClone(cleanState)
    };

    store.activeSlotId = targetId;
    const persistResult = persistSlotsStore(store);

    // Also update legacy key for backward compatibility if primary save succeeded
    if (persistResult?.success) {
        try {
            localStorage.setItem('life_game_save', JSON.stringify(cleanState));
        } catch (e) {}
    }

    return persistResult;
}

/**
 * Loads a specified save slot into state.gameState.
 */
export function loadSlot(slotId) {
    if (!isValidSlotId(slotId)) {
        UI.showModal("Load Error", "Selected save slot identifier is invalid.");
        return;
    }

    const store = getSlotsStore();
    const slot = store.slots[slotId];
    
    if (!slot || !slot.data) {
        UI.showModal("Load Error", "Selected save slot does not exist or is corrupted.");
        return;
    }

    // Set active slot pointer and restore state with strict _slotId binding
    store.activeSlotId = slotId;
    persistSlotsStore(store);
    
    const restoredState = migrateState(slot.data);
    if (!restoredState || !restoredState.user) {
        UI.showModal("Load Error", "Selected save slot contains invalid data.");
        return;
    }
    restoredState._slotId = slotId;

    // Check if slot has higher recorded annual snapshot to recover past age
    if (Array.isArray(restoredState.snapshots) && restoredState.snapshots.length > 0) {
        restoredState.snapshots = restoredState.snapshots.slice(-5);
        const highestSnapshot = restoredState.snapshots.slice().sort((a, b) => b.age - a.age)[0];
        if (highestSnapshot && highestSnapshot.data && highestSnapshot.age > (restoredState.user?.age || 0)) {
            const snapshotData = migrateState(highestSnapshot.data);
            if (snapshotData && snapshotData.user) {
                snapshotData.snapshots = restoredState.snapshots;
                snapshotData._slotId = slotId;
                state.gameState = snapshotData;
            } else {
                state.gameState = restoredState;
            }
        } else {
            state.gameState = restoredState;
        }
    } else {
        restoredState.snapshots = [];
        state.gameState = restoredState;
    }

    // Immediately update Header bar and Avatar DOM
    if (UI && typeof UI.updateHeader === 'function' && state.gameState?.user) {
        UI.updateHeader(state.gameState.user);
    }
    const avatarElem = document.getElementById('avatar-container');
    if (avatarElem && state.gameState?.user) {
        import('../ui/avatarRenderer.js').then(m => {
            if (typeof m.renderAvatar === 'function') {
                avatarElem.innerHTML = m.renderAvatar(state.gameState.user);
            }
        }).catch(() => {});
    }

    // Persist the loaded state directly into the active slot (synchronous, no race)
    saveToSlot(slotId);
    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }

    // Re-render main dashboard
    if (typeof window !== 'undefined' && typeof window.renderLifeDashboard === 'function') {
        window.renderLifeDashboard(state.gameState);
    } else {
        import('../features/player/mainScreen.js').then(m => {
            if (typeof m.renderLifeDashboard === 'function') {
                m.renderLifeDashboard(state.gameState);
            }
        }).catch(() => {});
    }

    UI.showModal("Save Slot Loaded", `Loaded "${Utils.escapeHtml(slot.name)}" (Age ${state.gameState.user?.age || 0}) successfully!`);
}

export const MAX_SLOTS = 10;

/**
 * Branches current state into a new save slot (Paid Perk check).
 */
export function branchCurrentSave(customName = null) {
    const store = getSlotsStore();
    const slotCount = Object.keys(store.slots).length;
    const isOwned = hasPurchasedPack('time_machine');

    if (!isOwned && slotCount >= 1) {
        UI.showCustomModal({
            title: "Multi-Save Slots Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Multi-Save Branch Slots</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Free players get 1 save slot. Unlock <strong>Time Machine & Multi-Save Slots</strong> to create up to ${MAX_SLOTS} save slots, test risky career choices, and switch between lives.
                    </p>
                </div>
            `,
            confirmText: "Unlock Multi-Save ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    if (slotCount >= MAX_SLOTS) {
        UI.showModal("Slot Limit Reached", `You have reached the maximum limit of ${MAX_SLOTS} save slots. Delete an existing slot to create a new branch.`);
        return;
    }

    const newSlotId = `slot_${Date.now()}`;
    const user = state.gameState?.user;
    const defaultName = customName || (user ? `${user.username || 'Life'} - Branch` : `Branch Save`);

    saveToSlot(newSlotId, defaultName);
    renderSaveSlotManagerModal();
    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }
    UI.showModal("Branch Created!", `Created new save slot: "${Utils.escapeHtml(defaultName)}".`);
}

/**
 * Starts a brand new life in a fresh save slot.
 */
export function startNewLifeInNewSlot() {
    const store = getSlotsStore();
    const slotCount = Object.keys(store.slots).length;
    const isOwned = hasPurchasedPack('time_machine');

    if (!isOwned && slotCount >= 1) {
        UI.showCustomModal({
            title: "Multi-Save Slots Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">Start Life in New Slot</div>
                            <div class="text-xs text-cyan-400 font-semibold">$1.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Keep your current life and start fresh in a brand new slot. Requires <strong>Time Machine & Multi-Save Slots</strong>.
                    </p>
                </div>
            `,
            confirmText: "Unlock Multi-Save ($1.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('time_machine')
        });
        return;
    }

    if (slotCount >= MAX_SLOTS) {
        UI.showModal("Slot Limit Reached", `You have reached the maximum limit of ${MAX_SLOTS} save slots. Delete an old slot to start a new life.`);
        return;
    }

    // 1. Save current active life first
    saveToSlot();

    // 2. Generate new slot ID and set active pointer
    const newSlotId = 'slot_' + Date.now();
    const freshStore = getSlotsStore();
    freshStore.slots[newSlotId] = {
        id: newSlotId,
        name: "New Life",
        lastSaved: Date.now(),
        data: null
    };
    freshStore.activeSlotId = newSlotId;
    persistSlotsStore(freshStore);

    if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
        window.saveGame();
    }

    // 3. Clear active in-memory state and route to Character Creation
    state.gameState = null;
    UI.hideModal();

    if (typeof window !== 'undefined' && typeof window.renderCharCreation === 'function') {
        window.renderCharCreation();
    } else {
        import('../features/player/charCreationScreen.js').then(m => {
            if (m && typeof m.renderCharCreation === 'function') {
                m.renderCharCreation();
            }
        }).catch(() => {});
    }
}

/**
 * Deletes a save slot.
 */
export function deleteSlot(slotId, skipConfirm = false) {
    if (!isValidSlotId(slotId)) return;
    const store = getSlotsStore();
    if (!store.slots[slotId]) return;

    if (Object.keys(store.slots).length <= 1) {
        UI.showModal("Cannot Delete", "You must keep at least one active save slot.");
        return;
    }

    const slotName = store.slots[slotId].name;
    const doDelete = () => {
        delete store.slots[slotId];
        if (store.activeSlotId === slotId) {
            store.activeSlotId = Object.keys(store.slots)[0];
        }
        // Sync in-memory _slotId so saveToSlot() doesn't re-create the deleted slot
        if (state.gameState && state.gameState._slotId === slotId) {
            state.gameState._slotId = store.activeSlotId;
        }
        persistSlotsStore(store);
        renderSaveSlotManagerModal();
        if (typeof window !== 'undefined' && typeof window.saveGame === 'function' && state.userAuthId) {
            window.saveGame();
        }
        UI.showModal("Slot Deleted", `Deleted "${Utils.escapeHtml(slotName)}".`);
    };

    if (skipConfirm || typeof UI === 'undefined' || typeof UI.showConfirm !== 'function' || typeof document === 'undefined') {
        doDelete();
    } else {
        UI.showConfirm(
            "Delete Save Slot",
            `Are you sure you want to delete "${Utils.escapeHtml(slotName)}"? This action cannot be undone.`,
            "Delete",
            doDelete
        );
    }
}

/**
 * Renders the Save & Load Slot Manager Modal.
 */
export function renderSaveSlotManagerModal() {
    saveToSlot(); // Ensure current state is updated in active slot

    const store = getSlotsStore();
    const isOwned = hasPurchasedPack('time_machine');
    const slotKeys = Object.keys(store.slots);

    let slotsHTML = slotKeys.map(key => {
        const slot = store.slots[key];
        const isActive = key === store.activeSlotId;
        const u = slot.data?.user || {};
        const dateStr = slot.lastSaved ? new Date(slot.lastSaved).toLocaleDateString() + ' ' + new Date(slot.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
        const moneyFormatted = Utils ? Utils.formatMoney(u.money || 0) : '$' + (u.money || 0).toLocaleString();

        const avatarHTML = (u && (u.username || u.name || u.age !== undefined)) ?
            renderAvatar({ ...u, id: `slot-avatar-${key}`, avatarVersion: slot.lastSaved || 1 }) :
            `<i class="fas fa-user text-slate-500 text-base"></i>`;

        return `
            <div class="bg-slate-900 border ${isActive ? 'border-cyan-500 shadow-md shadow-cyan-500/10' : 'border-slate-700'} p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full bg-slate-800 border ${isActive ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-700'} overflow-hidden flex items-center justify-center shrink-0">
                        ${avatarHTML}
                    </div>
                    <div>
                        <div class="text-xs font-extrabold text-white flex items-center gap-1.5">
                            ${Utils.escapeHtml(slot.name)} ${isActive ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">Active</span>' : ''}
                        </div>
                        <div class="text-[11px] text-slate-400 mt-0.5">
                            Age ${u.age || 0} • ${Utils.escapeHtml(u.jobTitle || 'Unemployed')} • <span class="text-emerald-400 font-semibold">${moneyFormatted}</span>
                        </div>
                        <div class="text-[9px] text-slate-500 mt-0.5">Saved: ${Utils.escapeHtml(dateStr)}</div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    ${isActive ? `
                        <button disabled class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700 cursor-default">
                            Active
                        </button>
                    ` : `
                        <button data-action="loadSaveSlot" data-args="'${key}'" class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1">
                            <i class="fas fa-folder-open text-[10px]"></i> Load
                        </button>
                    `}
                    ${slotKeys.length > 1 ? `
                        <button data-action="deleteSaveSlot" data-args="'${key}'" class="px-2 py-1.5 rounded-lg text-xs font-bold bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
                        <i class="fas fa-layer-group text-cyan-400"></i> Multi-Save Manager
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">${slotKeys.length} / ${MAX_SLOTS} Save Slots Used</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button data-action="branchSaveSlot" title="Clone current character into new slot" class="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md transition flex items-center gap-1">
                        <i class="fas fa-code-branch"></i> Branch
                    </button>
                    <button data-action="startNewSlotLife" title="Start brand new character in new slot" class="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md transition flex items-center gap-1">
                        <i class="fas fa-plus-circle"></i> New Life
                    </button>
                </div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                ${slotsHTML}
            </div>

            ${!isOwned ? `
                <div class="bg-slate-900 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
                    <div class="text-xs text-slate-300">
                        <i class="fas fa-lock text-cyan-400 mr-1"></i> Unlock up to ${MAX_SLOTS} save slots for $1.99
                    </div>
                    <button data-action="buyPack" data-args="'time_machine'" class="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 transition">
                        Unlock ($1.99)
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    UI.showCustomModal({
        title: "Save & Load Slots",
        content: modalHTML,
        confirmText: null,
        cancelText: null
    });
}
