import { state } from './state.js';

const MAX_STATE_DEPTH = 32;

/**
 * Recursively deep clones an object safely.
 * Prefers native structuredClone, falling back to a recursive clone for environments
 * or payloads where structuredClone cannot be applied directly.
 */
export function deepClone(obj, visited = new WeakMap(), depth = 0) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (depth > MAX_STATE_DEPTH) {
        return undefined;
    }

    if (depth === 0 && typeof structuredClone === 'function') {
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
            arrCopy[i] = deepClone(obj[i], visited, depth + 1);
        }
        return arrCopy;
    }

    const objCopy = Object.create(Object.getPrototypeOf(obj));
    visited.set(obj, objCopy);
    for (const key of Object.keys(obj)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
        objCopy[key] = deepClone(obj[key], visited, depth + 1);
    }
    return objCopy;
}

/**
 * Sanitizes game state recursively:
 * - Clamps Infinity / values > Number.MAX_SAFE_INTEGER to Number.MAX_SAFE_INTEGER.
 * - Clamps -Infinity / values < -Number.MAX_SAFE_INTEGER to -Number.MAX_SAFE_INTEGER.
 * - Replaces NaN with 0.
 * - Strips prototype pollution keys and caps recursion depth.
 */
export function sanitizeGameState(obj, visited = new WeakSet(), depth = 0) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'number') {
        if (Number.isNaN(obj)) return 0;
        if (obj === Infinity || obj > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
        if (obj === -Infinity || obj < -Number.MAX_SAFE_INTEGER) return -Number.MAX_SAFE_INTEGER;
        return obj;
    }

    if (typeof obj !== 'object') return obj;
    if (depth > MAX_STATE_DEPTH) return null;

    if (visited.has(obj)) return obj;
    visited.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeGameState(item, visited, depth + 1));
    }

    const sanitized = {};
    for (const key of Object.keys(obj)) {
        if (['__proto__', 'constructor', 'prototype', 'purchasedPacks', 'godMode', 'isVIP', 'vipLevel'].includes(key)) continue;
        const val = obj[key];
        if (val !== undefined) {
            sanitized[key] = sanitizeGameState(val, visited, depth + 1);
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

    const sanitizeClassToken = (val, defaultVal = '') => {
        const s = toStr(val, defaultVal);
        if (!s) return defaultVal;
        const cleaned = s.replace(/[^a-zA-Z0-9_\-\s/]/g, '').trim();
        return cleaned || defaultVal;
    };

    const u = rawUser || {};

    // 1. Identity & Core Vitals
    const age = toNum(u.age, 0, 0, 150);
    const health = toNum(u.health, 100, 0, 100);
    const happiness = (origUser && typeof origUser.happiness === 'number' && Number.isNaN(origUser.happiness)) ? 0 : toNum(u.happiness, 100, 0, 100);
    const smarts = (origUser && typeof origUser.smarts === 'number' && Number.isNaN(origUser.smarts)) ? 50 : toNum(u.smarts, 50, 0, 100);
    const looks = toNum(u.looks, 50, 0, 100);
    const money = toNum(u.money, 0, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const rawIsDead = toBool(u.isDead || u.is_dead, false);
    const rawLifeStatus = toStr(u.lifeStatus || u.life_status, '');
    const isDead = rawIsDead || rawLifeStatus === 'Deceased' || (typeof u.deathCause === 'string' && u.deathCause.trim() !== '');
    const inPrison = toBool(u.inPrison, false);

    // Life Status validation
    const validLifeStatuses = ["Baby", "Toddler", "Child", "Teen", "Young Adult", "Adult", "Senior", "Deceased", "Inmate"];
    let lifeStatus = rawLifeStatus;
    if (isDead) {
        lifeStatus = "Deceased";
    } else if (!validLifeStatuses.includes(lifeStatus)) {
        if (inPrison) lifeStatus = "Inmate";
        else if (age < 3) lifeStatus = "Baby";
        else if (age < 5) lifeStatus = "Toddler";
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
    const skillActionsThisYear = toNum(u.skillActionsThisYear, 0, 0, 10);
    const instrumentPracticesThisYear = toNum(u.instrumentPracticesThisYear, 0, 0, 10);
    const instrumentLessonsThisYear = toNum(u.instrumentLessonsThisYear, 0, 0, 10);
    let skills = {};
    if (u.skills && typeof u.skills === 'object' && !Array.isArray(u.skills)) {
        for (const [k, v] of Object.entries(u.skills)) {
            if (v && typeof v === 'object') {
                skills[k] = {
                    xp: toNum(v.xp, 0, 0, 100),
                    tiersCompleted: Array.isArray(v.tiersCompleted) ? v.tiersCompleted.filter(t => typeof t === 'number') : [],
                    certified: toBool(v.certified, false),
                    parentApproved: toBool(v.parentApproved, false),
                    deniedAge: (v.deniedAge !== undefined && v.deniedAge !== null) ? toNum(v.deniedAge, null) : null
                };
            }
        }
    }

    // 3. Career & Finance
    const jobTitle = toStr(u.jobTitle || u.job_title, '');
    const jobSalary = toNum(u.jobSalary || u.job_salary, 0, 0);
    const jobPerformance = toNum(u.jobPerformance, 50, 0, 100);
    const careerActionTaken = toNum(u.careerActionTaken || u.career_action_taken, 0, 0);
    const careerTrack = u.careerTrack ? toStr(u.careerTrack, null) : null;
    const careerLevel = toNum(u.careerLevel, 0, 0);
    const yearsInRole = toNum(u.yearsInRole, 0, 0);
    const yearsInCareer = toNum(u.yearsInCareer, 0, 0);
    const isRetired = toBool(u.isRetired, false);
    const retirementPension = toNum(u.retirementPension, 0, 0);
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
    const diet = toStr(u.diet, hasBetterDiet ? 'balanced' : 'junk');
    const hasSeenExpenseMsg = toBool(u.hasSeenExpenseMsg || u.has_seen_expense_message, false);
    const hasSeenJobSalary = toBool(u.hasSeenJobSalary || u.has_seen_job_salary, false);
    const lifetimeCrimesCommitted = toNum(u.lifetimeCrimesCommitted, 0, 0);
    const mafiaCrimesThisYear = toNum(u.mafiaCrimesThisYear, 0, 0);
    const diseases = Array.isArray(u.diseases)
        ? u.diseases
            .filter(d => d && typeof d === 'object' && typeof d.id === 'string' && d.id.trim() !== '')
            .map(d => ({
                id: toStr(d.id),
                name: toStr(d.name, 'Illness'),
                category: ['sickness', 'chronic', 'std'].includes(d.category) ? d.category : 'sickness',
                curable: toBool(d.curable, true),
                selfResolving: toBool(d.selfResolving, false),
                yearsRemaining: (d.yearsRemaining !== null && d.yearsRemaining !== undefined) ? toNum(d.yearsRemaining, 1, 0, 100) : null,
                cureChance: toNum(d.cureChance, 0, 0, 1),
                healthPenalty: toNum(d.healthPenalty, 0, 0, 100),
                happinessPenalty: toNum(d.happinessPenalty, 0, 0, 100),
                looksPenalty: toNum(d.looksPenalty, 0, 0, 100),
                treatedThisYear: toBool(d.treatedThisYear, false),
                contractedAge: toNum(d.contractedAge, age, 0, 150)
            }))
        : [];
    const isSick = diseases.length > 0 || toBool(u.isSick, false);
    const hasFlu = diseases.some(d => d.id === 'seasonal_flu') || toBool(u.hasFlu, false);

    // Athlete & Pro Sports Subsystem
    const athleteSport = u.athleteSport ? toStr(u.athleteSport, null) : null;
    const athleteContract = (u.athleteContract && typeof u.athleteContract === 'object' && !Array.isArray(u.athleteContract)) ? u.athleteContract : null;
    const athleteCareerEarnings = toNum(u.athleteCareerEarnings, 0, 0);
    const athletePoorSeasons = toNum(u.athletePoorSeasons, 0, 0);
    const athleteGamesThisYear = toNum(u.athleteGamesThisYear, 0, 0);
    const athleteEndorsementThisYear = toBool(u.athleteEndorsementThisYear, false);
    const athleteRings = toNum(u.athleteRings, 0, 0);
    const athleteMvps = toNum(u.athleteMvps, 0, 0);
    const athleteDraftsEntered = (u.athleteDraftsEntered && typeof u.athleteDraftsEntered === 'object' && !Array.isArray(u.athleteDraftsEntered)) ? u.athleteDraftsEntered : {};
    const athleteTryoutYear = (u.athleteTryoutYear && typeof u.athleteTryoutYear === 'object' && !Array.isArray(u.athleteTryoutYear)) ? u.athleteTryoutYear : {};
    const schoolSportsHistory = (u.schoolSportsHistory && typeof u.schoolSportsHistory === 'object' && !Array.isArray(u.schoolSportsHistory)) ? u.schoolSportsHistory : {};

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
    if (u.investments && typeof u.investments === 'object' && !Array.isArray(u.investments)) {
        const rawInv = u.investments;
        const normalizedStocks = {};
        if (Array.isArray(rawInv.stocks)) {
            rawInv.stocks.forEach(s => {
                if (s && typeof s === 'object' && typeof s.symbol === 'string' && s.symbol.trim()) {
                    const sym = s.symbol.trim();
                    const shares = toNum(s.shares, 0, 0);
                    const totalCost = toNum(s.totalCost, 0, 0);
                    if (shares > 0) {
                        normalizedStocks[sym] = { shares, totalCost };
                    }
                }
            });
        } else if (rawInv.stocks && typeof rawInv.stocks === 'object') {
            for (const [sym, holding] of Object.entries(rawInv.stocks)) {
                if (holding && typeof holding === 'object' && typeof sym === 'string' && sym.trim()) {
                    const shares = toNum(holding.shares, 0, 0);
                    const totalCost = toNum(holding.totalCost, 0, 0);
                    if (shares > 0) {
                        normalizedStocks[sym.trim()] = { shares, totalCost };
                    }
                }
            }
        }

        const savings = toNum(
            rawInv.savings !== undefined ? rawInv.savings : rawInv.savingsAccount?.balance,
            0,
            0
        );

        const stockMarket = Array.isArray(rawInv.stockMarket)
            ? rawInv.stockMarket
                .filter(s => s && typeof s === 'object' && typeof s.symbol === 'string' && s.symbol.trim() !== '')
                .map(s => ({
                    ...s,
                    symbol: toStr(s.symbol),
                    name: toStr(s.name, s.symbol),
                    sector: toStr(s.sector, 'Technology'),
                    basePrice: toNum(s.basePrice, 50, 1),
                    price: toNum(s.price, toNum(s.basePrice, 50, 1), 1),
                    prevPrice: toNum(s.prevPrice, toNum(s.price, 50, 1), 1),
                    volatility: toNum(s.volatility, 0.15, 0, 2),
                    dividendYield: toNum(s.dividendYield, 0, 0, 1),
                    desc: toStr(s.desc),
                    icon: sanitizeClassToken(s.icon, 'fa-chart-line'),
                    color: sanitizeClassToken(s.color, 'text-emerald-400'),
                    priceHistory: Array.isArray(s.priceHistory)
                        ? s.priceHistory.map(p => toNum(p, 50, 1)).slice(-12)
                        : [toNum(s.price, 50, 1)]
                }))
            : [];

        const blogPosts = Array.isArray(rawInv.blogPosts)
            ? rawInv.blogPosts
                .filter(b => b && typeof b === 'object' && typeof b.symbol === 'string' && b.symbol.trim() !== '')
                .map(b => ({
                    id: toStr(b.id, `blog_${Date.now()}`),
                    title: toStr(b.title),
                    author: toStr(b.author),
                    symbol: toStr(b.symbol),
                    stockName: toStr(b.stockName, b.symbol),
                    sector: toStr(b.sector, 'General'),
                    sentiment: ['bullish', 'bearish'].includes(b.sentiment) ? b.sentiment : 'bullish',
                    impact: toNum(b.impact, 0, -1, 1),
                    excerpt: toStr(b.excerpt),
                    age: toNum(b.age, age, 0, 150)
                }))
            : [];

        investments = {
            savings,
            stocks: normalizedStocks,
            stockMarket,
            blogPosts
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

    // 10. Property Manager Subsystem
    let propertyManager = null;
    if (u.propertyManager && typeof u.propertyManager === 'object' && toBool(u.propertyManager.hired, false)) {
        const pm = u.propertyManager;
        let lastReport = null;
        if (pm.lastReport && typeof pm.lastReport === 'object' && !Array.isArray(pm.lastReport)) {
            const lr = pm.lastReport;
            lastReport = {
                age: toNum(lr.age, age, 0),
                properties: Array.isArray(lr.properties) ? lr.properties.filter(p => p && typeof p === 'object').map(p => ({
                    propertyId: toStr(p.propertyId),
                    propertyName: toStr(p.propertyName),
                    tenantName: toStr(p.tenantName),
                    monthlyRent: toNum(p.monthlyRent, 0, 0),
                    gross: toNum(p.gross, 0, 0),
                    fee: toNum(p.fee, 0, 0),
                    net: toNum(p.net, 0, 0),
                    note: toStr(p.note)
                })) : [],
                activity: Array.isArray(lr.activity) ? lr.activity.filter(a => a && typeof a === 'object').map(a => ({
                    type: toStr(a.type),
                    icon: sanitizeClassToken(a.icon, 'fa-info-circle'),
                    text: toStr(a.text)
                })) : [],
                repairs: Array.isArray(lr.repairs) ? lr.repairs.filter(r => r && typeof r === 'object').map(r => ({
                    id: toStr(r.id),
                    propertyId: toStr(r.propertyId),
                    propertyName: toStr(r.propertyName),
                    tenantName: toStr(r.tenantName),
                    type: toStr(r.type),
                    icon: sanitizeClassToken(r.icon, 'fa-wrench'),
                    desc: toStr(r.desc),
                    cost: toNum(r.cost, 0, 0),
                    conditionLoss: toNum(r.conditionLoss, 0, 0),
                    conditionGain: toNum(r.conditionGain, 0, 0),
                    status: ['pending', 'approved', 'declined', 'cancelled'].includes(r.status) ? r.status : 'pending'
                })) : [],
                gross: toNum(lr.gross, 0, 0),
                fee: toNum(lr.fee, 0, 0),
                net: toNum(lr.net, 0, 0)
            };
        }

        propertyManager = {
            hired: true,
            id: toStr(pm.id, `pm_${Date.now()}`),
            name: toStr(pm.name, 'Property Manager'),
            gender: ['male', 'female', 'non-binary'].includes(pm.gender) ? pm.gender : 'female',
            age: toNum(pm.age, 35, 18, 120),
            title: toStr(pm.title, 'Licensed Property Manager'),
            appearance: (pm.appearance && typeof pm.appearance === 'object' && !Array.isArray(pm.appearance)) ? { ...pm.appearance } : null,
            feeRate: toNum(pm.feeRate, 0.10, 0, 1),
            hiredAtAge: toNum(pm.hiredAtAge, age, 0, 150),
            lifetimeRentCollected: toNum(pm.lifetimeRentCollected, 0, 0),
            lifetimeFeesPaid: toNum(pm.lifetimeFeesPaid, 0, 0),
            lifetimeRepairSpend: toNum(pm.lifetimeRepairSpend, 0, 0),
            lastReport
        };
    }

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
        isAlive: !isDead,
        deathCause: isDead ? toStr(u.deathCause, 'natural causes') : null,
        deathAge: isDead ? toNum(u.deathAge !== undefined ? u.deathAge : u.age, age, 0, 150) : null,

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
        ...(u.skills !== undefined ? { skills } : {}),
        ...(u.skillActionsThisYear !== undefined ? { skillActionsThisYear } : {}),
        ...(u.instrumentPracticesThisYear !== undefined ? { instrumentPracticesThisYear } : {}),
        ...(u.instrumentLessonsThisYear !== undefined ? { instrumentLessonsThisYear } : {}),

        jobTitle,
        jobSalary,
        jobPerformance,
        hasSeenJobSalary,
        careerActionTaken,
        careerTrack,
        careerLevel,
        yearsInRole,
        yearsInCareer,
        isRetired,
        retirementPension,
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
        diet,
        hasSeenExpenseMsg,
        lifetimeCrimesCommitted,
        mafiaCrimesThisYear,
        diseases,
        isSick,
        hasFlu,

        athleteSport,
        athleteContract,
        athleteCareerEarnings,
        athletePoorSeasons,
        athleteGamesThisYear,
        athleteEndorsementThisYear,
        athleteRings,
        athleteMvps,
        athleteDraftsEntered,
        athleteTryoutYear,
        schoolSportsHistory,

        inPrison,
        prisonSentenceRemaining,
        prisonTotalSentence,
        prisonSecurity,
        facilityName,
        prisonStats,
        cellmate,
        yardInmates,

        assets,
        propertyManager,
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
                            return { msg: toStr(ev.msg), color: sanitizeClassToken(ev.color, 'text-gray-400') };
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
