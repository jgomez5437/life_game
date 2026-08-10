import { login, configureAuth } from '../auth/auth.js';
import { startGuestMode, renderLoginScreen } from '../auth/loginScreen.js';
import { processQuarter, enterBusinessMode, hireEmployee, layoffEmployee, sellBusiness, purchaseUpgrade, setBusinessTab, selectSupplierDashboard, upgradeHQTier, upgradeMarketingChannel, adjustRoleCount, acceptVCPitch, chooseEventChoice } from '../features/business/businessDashboard.js';
import { selectIndustry, selectSupplier, renderBusinessSetup, initBusiness } from '../features/business/createBusinessScreen.js';
import { renderCareerMarket, applyForJob, applyForCareerTrack, answerInterview, retryInterview } from '../features/career/careerJobsScreen.js';
import { confirmQuitCareer, quitCareer, renderCareerManager, workHarderJob, slackOffJob } from '../features/career/jobCareerManagerScreen.js';
import { renderJobMarket } from '../features/career/partTimeJobsScreen.js';
import { renderEducation, workHarder, skipSchool, renderClassmates } from '../features/education/manageEducationScreen.js';
import { attemptEnrollment, openGradEnrollmentModal, attemptGradEnrollment, renderGradSchoolMarket, openUniversityModal } from '../features/career/occupationScreen.js';
import { selectGender, submitCharacter, renderCharCreation, cycleTrait, randomizeSection, randomizeAllTraits, updateCityDropdown } from '../features/player/charCreationScreen.js';
import { ageUp, continueAsChild, renderLifeDashboard, addLog, renderDeathScreen, showFullEulogy } from '../features/player/mainScreen.js';
import { openPlayerOverviewModal } from '../features/player/playerOverviewScreen.js';
import { state } from './state.js';
import { GameLogic } from './gameLogic.js';
import { renderAssets, renderVehicleManager, repairVehicle, sellVehicle, renderPropertyManager, payOffMortgage, openSellPropertyModal, submitPropertyListing, acceptBuyerOffer, doPropertyMaintenance, doPropertyRenovation, openTenantScreening, acceptTenantLease, evictTenantAction, demandTenantRentPayment, forgiveTenantRent, evictTenantFromEvent, demandTenantRepairPayment, forgiveTenantDamage, renewLeaseSameRate, renewLeaseWithIncrease, declineLeaseRenewal, renderJewelryManager, toggleWearJewelry, toggleInsureJewelry, sellJewelry, openGiftJewelryModal, confirmGiftJewelry, setPrimaryVehicle, toggleInsureVehicle, takeJoyride, openGiftVehicleModal, confirmGiftVehicle } from '../features/assets/assetsScreen.js';
import { renderShoppingHub, renderVehicleDealer, buyVehicle, buyVehicleCash, buyVehicleLoan, renderRealEstateDealer, buyPropertyCash, buyPropertyMortgage, renderJewelryDealer, buyJewelry } from '../features/assets/goShoppingScreen.js';
import { renderInvestmentsScreen, switchInvestmentTab, setStockFilter, openStockDetailsModal, openBuyStockModal, confirmBuyStock, openSellStockModal, confirmSellStock, openDepositSavingsModal, confirmDepositSavings, openWithdrawSavingsModal, confirmWithdrawSavings } from '../features/assets/investmentsScreen.js';
import { renderActivities } from '../features/career/occupationScreen.js';
import { renderRelationships, renderPersonInteraction, openRelationshipConfirm, spendTimeWithAll, goOutMeetSomeone, openMeetPeopleModal, setAttractionPreference, handleBlindDate, handleDatingApp, renderDatingAppModal, selectDatingAppMatch, handleMeetFriend, handleNightOut, renderLuxeMatchModal, selectLuxeAgePreset, selectLuxeWealthTier, confirmLuxeMatch, handleMakeAMove, confirmHookupChoice, handleEndAffair, handleCheatingConfrontationChoice, handleProposeAction, openRingSelectionModal, proposeWithRing } from '../features/relationships/relationshipScreen.js';
import { chooseFuneralType, cancelFuneralPlan, confirmFuneralPlan, donateBody, lookTheOtherWay, goToFuneral, skipFuneral, respondNewTeacher, processNextTeacherReplacement } from '../features/relationships/funeralScreen.js';
import { openWeddingPlanner, confirmWeddingPlan, openNameChangeChoice, chooseNameChange } from '../features/relationships/romanceScreen.js';
import { renderMoreDashboard, buyGymMembership, cancelGymMembership, visitGymOneTime, startBetterDiet, cancelBetterDiet, visitDoctor, openBlackjackBetting, startBlackjackGame, blackjackHit, blackjackStand, openTravelModal, bookTrip, openDietSelectionModal, selectDiet, openLotteryModal, buyLotteryTicket, openSuggestionsModal, openMoveCountryModal, updateRelocateCityDropdown, confirmMoveCountry, askPartnerToMove, confirmMoveAlone } from '../features/more/moreScreen.js';
import { renderCasinoHub, openRouletteModal, confirmRouletteBet, confirmRouletteSingleNumberBet, openSlotsModal, confirmSlotsSpin } from '../features/more/casinoScreen.js';
import { openSettingsModal, triggerManualSave, promptResetGame, toggleSettingSFX, toggleSettingCompact, toggleSettingTheme, applyTheme } from '../features/more/settingsScreen.js';
import { renderStoreScreen, filterStoreCategory, previewPackDetails, buyPack, restorePurchases } from '../features/store/storeScreen.js';
import { grantInstantHighSchool, grantInstantUniversityDegree, grantInstantGradDegree, renderInstantDiplomaHub, claimInstantUniversityMajor } from '../features/education/instantDiploma.js';
import { renderVipLoungeModal, selectTheme, isVipSupporter } from '../features/store/vipLounge.js';
import { renderGraveyardModal, showAncestorEulogy } from '../features/player/graveyardScreen.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';

const get = id => document.getElementById(id);
// --- CONSTANTS ---

        export const MAJORS = [
            "Psychology", "Computer Science", "English", "Education", "Marketing",
            "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
            "Political Science", "Criminal Justice", "Communications", "Pharmacy"
        ];

        export const CAREER_TRACKS = [
            // ── NO DEGREE REQUIRED ────────────────────────────────────────────
            {
                key: 'retail', label: 'Retail', icon: 'fa-shopping-bag',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Cashier',          salary:  28000, minYears: 2 },
                    { title: 'Sales Associate',  salary:  34000, minYears: 3 },
                    { title: 'Team Lead',        salary:  45000, minYears: 3 },
                    { title: 'Store Manager',    salary:  65000, minYears: 4 },
                    { title: 'District Manager', salary: 100000, minYears: null }
                ]
            },
            {
                key: 'food_service', label: 'Food Service', icon: 'fa-utensils',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Line Cook',      salary:  30000, minYears: 2 },
                    { title: 'Cook',           salary:  38000, minYears: 2 },
                    { title: 'Sous Chef',      salary:  52000, minYears: 3 },
                    { title: 'Head Chef',      salary:  75000, minYears: 4 },
                    { title: 'Executive Chef', salary:  95000, minYears: null }
                ]
            },
            {
                key: 'trades', label: 'Skilled Trades', icon: 'fa-wrench',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Trade Helper',        salary:  32000, minYears: 1 },
                    { title: 'Apprentice',          salary:  42000, minYears: 2 },
                    { title: 'Journeyman',          salary:  60000, minYears: 3 },
                    { title: 'Foreman',             salary:  78000, minYears: 4 },
                    { title: 'Master Tradesperson', salary: 100000, minYears: null }
                ]
            },
            {
                key: 'law_enforcement', label: 'Law Enforcement', icon: 'fa-user-shield',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Patrol Officer', salary:  55000, minYears: 3 },
                    { title: 'Detective',      salary:  70000, minYears: 4 },
                    { title: 'Sergeant',       salary:  85000, minYears: 4 },
                    { title: 'Lieutenant',     salary: 100000, minYears: 5 },
                    { title: 'Police Captain', salary: 120000, minYears: null }
                ]
            },
            {
                key: 'fire_service', label: 'Fire Service', icon: 'fa-fire-extinguisher',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Firefighter',     salary:  48000, minYears: 2 },
                    { title: 'Driver/Engineer', salary:  62000, minYears: 2 },
                    { title: 'Fire Lieutenant', salary:  76000, minYears: 3 },
                    { title: 'Fire Captain',    salary:  90000, minYears: 4 },
                    { title: 'Fire Chief',      salary: 105000, minYears: null }
                ]
            },
            {
                key: 'logistics', label: 'Logistics & Delivery', icon: 'fa-truck',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Delivery Driver',      salary:  35000, minYears: 2 },
                    { title: 'Senior Driver',        salary:  45000, minYears: 2 },
                    { title: 'Dispatch Coordinator', salary:  60000, minYears: 3 },
                    { title: 'Logistics Manager',    salary:  82000, minYears: 4 },
                    { title: 'VP of Logistics',      salary: 110000, minYears: null }
                ]
            },
            // ── UNDERGRAD DEGREE + MAJOR REQUIRED ────────────────────────────
            {
                key: 'software_eng', label: 'Software Engineering', icon: 'fa-code',
                reqDegree: true, reqGrad: null, reqMajors: ['Computer Science'],
                levels: [
                    { title: 'Jr. Software Developer', salary:  50000, minYears: 2 },
                    { title: 'Software Developer',     salary:  72000, minYears: 3 },
                    { title: 'Senior Developer',       salary: 100000, minYears: 4 },
                    { title: 'Lead Engineer',          salary: 135000, minYears: 5 },
                    { title: 'Engineering Director',   salary: 175000, minYears: null }
                ]
            },
            {
                key: 'graphic_design', label: 'Graphic Design', icon: 'fa-pen-nib',
                reqDegree: true, reqGrad: null, reqMajors: ['Graphic Design'],
                levels: [
                    { title: 'Junior Designer',   salary:  45000, minYears: 2 },
                    { title: 'Graphic Designer',  salary:  58000, minYears: 2 },
                    { title: 'Senior Designer',   salary:  75000, minYears: 3 },
                    { title: 'Art Director',      salary: 100000, minYears: 4 },
                    { title: 'Creative Director', salary: 130000, minYears: null }
                ]
            },
            {
                key: 'education_track', label: 'Education', icon: 'fa-chalkboard-teacher',
                reqDegree: true, reqGrad: null, reqMajors: ['Education'],
                levels: [
                    { title: 'Teacher',          salary:  40000, minYears: 3 },
                    { title: 'Senior Teacher',   salary:  52000, minYears: 3 },
                    { title: 'Department Chair', salary:  70000, minYears: 4 },
                    { title: 'Vice Principal',   salary:  90000, minYears: 4 },
                    { title: 'Principal',        salary: 110000, minYears: null }
                ]
            },
            {
                key: 'nursing', label: 'Nursing', icon: 'fa-heartbeat',
                reqDegree: true, reqGrad: null, reqMajors: ['Nursing'],
                levels: [
                    { title: 'Registered Nurse',      salary:  50000, minYears: 2 },
                    { title: 'Charge Nurse',          salary:  65000, minYears: 3 },
                    { title: 'Nurse Manager',         salary:  85000, minYears: 3 },
                    { title: 'Director of Nursing',   salary: 110000, minYears: 4 },
                    { title: 'Chief Nursing Officer', salary: 150000, minYears: null }
                ]
            },
            {
                key: 'banking', label: 'Banking & Finance', icon: 'fa-money-check-dollar',
                reqDegree: true, reqGrad: null, reqMajors: ['Business', 'Marketing'],
                levels: [
                    { title: 'Bank Teller',           salary:  42000, minYears: 2 },
                    { title: 'Loan Officer',          salary:  55000, minYears: 3 },
                    { title: 'Branch Manager',        salary:  80000, minYears: 3 },
                    { title: 'VP of Banking',         salary: 120000, minYears: 4 },
                    { title: 'Chief Banking Officer', salary: 190000, minYears: null }
                ]
            },
            // ── GRADUATE SCHOOL REQUIRED ──────────────────────────────────────
            {
                key: 'law', label: 'Law', icon: 'fa-balance-scale',
                reqDegree: false, reqGrad: 'Law School', reqMajors: null,
                levels: [
                    { title: 'Law Clerk',          salary:  70000, minYears: 2 },
                    { title: 'Associate Attorney', salary: 100000, minYears: 3 },
                    { title: 'Junior Partner',     salary: 145000, minYears: 4 },
                    { title: 'Senior Partner',     salary: 200000, minYears: 5 },
                    { title: 'Managing Partner',   salary: 250000, minYears: null }
                ]
            },
            {
                key: 'medicine', label: 'Medicine', icon: 'fa-user-md',
                reqDegree: false, reqGrad: 'Medical School', reqMajors: null,
                levels: [
                    { title: 'Resident',            salary:  65000, minYears: 3 },
                    { title: 'Staff Physician',     salary: 120000, minYears: 3 },
                    { title: 'Attending Physician', salary: 200000, minYears: 4 },
                    { title: 'Department Head',     salary: 280000, minYears: 5 },
                    { title: 'Chief of Medicine',   salary: 350000, minYears: null }
                ]
            },
            {
                key: 'psychiatry', label: 'Psychiatry', icon: 'fa-brain',
                reqDegree: false, reqGrad: 'Psychiatry School', reqMajors: null,
                levels: [
                    { title: 'Psychiatry Resident',    salary:  65000, minYears: 3 },
                    { title: 'Psychiatrist',           salary: 130000, minYears: 3 },
                    { title: 'Senior Psychiatrist',    salary: 190000, minYears: 4 },
                    { title: 'Psychiatry Dept. Head',  salary: 240000, minYears: 5 },
                    { title: 'Chief of Psychiatry',    salary: 280000, minYears: null }
                ]
            },
            {
                key: 'corp_finance', label: 'Corporate Finance', icon: 'fa-chart-line',
                reqDegree: false, reqGrad: 'Business School', reqMajors: null,
                levels: [
                    { title: 'Financial Analyst', salary:  65000, minYears: 2 },
                    { title: 'Senior Analyst',    salary:  90000, minYears: 2 },
                    { title: 'Finance Manager',   salary: 130000, minYears: 3 },
                    { title: 'VP of Finance',     salary: 200000, minYears: 4 },
                    { title: 'CFO',               salary: 300000, minYears: null }
                ]
            },
            // ── NO DEGREE REQUIRED (continued) ───────────────────────────────
            {
                key: 'real_estate', label: 'Real Estate', icon: 'fa-house',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Real Estate Agent',   salary:  32000, minYears: 2 },
                    { title: 'Senior Agent',        salary:  52000, minYears: 2 },
                    { title: 'Real Estate Broker',  salary:  78000, minYears: 3 },
                    { title: 'Branch Broker',       salary: 105000, minYears: 4 },
                    { title: 'Regional Director',   salary: 140000, minYears: null }
                ]
            },
            {
                key: 'military', label: 'Military', icon: 'fa-medal',
                reqDegree: false, reqGrad: null, reqMajors: null,
                levels: [
                    { title: 'Enlistee',      salary:  30000, minYears: 2 },
                    { title: 'Private',       salary:  38000, minYears: 2 },
                    { title: 'Corporal',      salary:  50000, minYears: 3 },
                    { title: 'Sergeant',      salary:  63000, minYears: 4 },
                    { title: 'Staff Sergeant',salary:  78000, minYears: null }
                ]
            },
            // ── UNDERGRAD DEGREE + MAJOR REQUIRED (continued) ────────────────
            {
                key: 'journalism', label: 'Journalism & Media', icon: 'fa-newspaper',
                reqDegree: true, reqGrad: null, reqMajors: ['Communications'],
                levels: [
                    { title: 'Reporter',         salary:  38000, minYears: 2 },
                    { title: 'Staff Writer',     salary:  52000, minYears: 2 },
                    { title: 'Senior Reporter',  salary:  70000, minYears: 3 },
                    { title: 'Editor',           salary:  92000, minYears: 4 },
                    { title: 'Editor-in-Chief',  salary: 130000, minYears: null }
                ]
            },
            {
                key: 'marketing_track', label: 'Marketing', icon: 'fa-bullhorn',
                reqDegree: true, reqGrad: null, reqMajors: ['Business', 'Marketing'],
                levels: [
                    { title: 'Junior Copywriter',    salary:  42000, minYears: 2 },
                    { title: 'Copywriter',           salary:  58000, minYears: 2 },
                    { title: 'Marketing Manager',    salary:  85000, minYears: 3 },
                    { title: 'VP of Marketing',      salary: 130000, minYears: 4 },
                    { title: 'CMO',                  salary: 200000, minYears: null }
                ]
            },
            {
                key: 'social_work', label: 'Social Work', icon: 'fa-hands-helping',
                reqDegree: true, reqGrad: null, reqMajors: ['Psychology'],
                levels: [
                    { title: 'Case Worker',        salary:  36000, minYears: 2 },
                    { title: 'Social Worker',      salary:  48000, minYears: 2 },
                    { title: 'Senior Counselor',   salary:  64000, minYears: 3 },
                    { title: 'Program Director',   salary:  82000, minYears: 4 },
                    { title: 'Dept. Head',         salary: 105000, minYears: null }
                ]
            },
            {
                key: 'pharmacy', label: 'Pharmacy', icon: 'fa-pills',
                reqDegree: true, reqGrad: null, reqMajors: ['Pharmacy'],
                levels: [
                    { title: 'Pharmacy Technician',   salary:  35000, minYears: 2 },
                    { title: 'Pharmacist',            salary:  65000, minYears: 2 },
                    { title: 'Senior Pharmacist',     salary:  95000, minYears: 3 },
                    { title: 'Pharmacy Manager',      salary: 120000, minYears: 4 },
                    { title: 'Director of Pharmacy',  salary: 155000, minYears: null }
                ]
            }
        ];

        export const PART_TIME_JOBS = [
            { title: "Babysitter",          hourly: 15, salary: 15600, icon: "fa-baby-carriage" },
            { title: "Amusement Park Crew", hourly: 12, salary: 12480, icon: "fa-ticket-alt" },
            { title: "Movie Theater Crew",  hourly: 11, salary: 11440, icon: "fa-film" },
            { title: "Dog Walker",          hourly: 10, salary: 10400, icon: "fa-dog" },
            { title: "Fast Food Crew",      hourly: 10, salary: 10400, icon: "fa-hamburger" },
            { title: "Security Guard",      hourly: 14, salary: 14560, icon: "fa-shield-alt" },
            { title: "Grocery Clerk",       hourly: 11, salary: 11440, icon: "fa-shopping-cart" },
            { title: "Landscaper",          hourly: 13, salary: 13520, icon: "fa-leaf" },
            { title: "Tutor",               hourly: 18, salary: 18720, icon: "fa-chalkboard-teacher", reqUniversity: true },
            { title: "Waiter/Waitress",     hourly: 14, salary: 14560, icon: "fa-utensils" },
            { title: "Ride-Share Driver",   hourly: 16, salary: 16640, icon: "fa-car", minAge: 21 },
            { title: "Barista",             hourly: 12, salary: 12480, icon: "fa-coffee" },
            { title: "Library Assistant",   hourly: 12, salary: 12480, icon: "fa-book" },
            { title: "Pharmacy Tech",       hourly: 15, salary: 15600, icon: "fa-pills" },
            { title: "Freelancer",          hourly: 20, salary: 20800, icon: "fa-pen-fancy" },
            { title: "Personal Trainer",    hourly: 20, salary: 20800, icon: "fa-dumbbell", minAge: 18 }
        ];

        export const INDUSTRIES = {
            tech: {
                name: "Software Startup",
                icon: "fa-laptop-code",
                description: "High tech, high risk, potential for massive scale.",
                baseDemand: 2500,
                unitPrice: 50,
                unitCost: 5,
                baseSalary: 6000,
                volatility: 0.4,
                startupCost: 150000,
                capacityPerEmployee: 600
            },
            retail: {
                name: "Fashion Brand",
                icon: "fa-tshirt",
                description: "Steady demand, brand loyalty is key.",
                baseDemand: 5000,
                unitPrice: 40,
                unitCost: 15,
                baseSalary: 2500,
                volatility: 0.2,
                startupCost: 75000,
                capacityPerEmployee: 1200
            },
            auto: {
                name: "Auto Manufacturer",
                icon: "fa-car",
                description: "Capital intensive, low margin, high volume.",
                baseDemand: 800,
                unitPrice: 25000,
                unitCost: 18000,
                baseSalary: 3500,
                volatility: 0.1,
                startupCost: 1000000,
                capacityPerEmployee: 200
            }
        };

        export const SUPPLIERS = [
            { id: 'cheap', name: 'Budget', costMod: 0.8, quality: 30, risk: 0.2 },
            { id: 'standard', name: 'Standard', costMod: 1.0, quality: 60, risk: 0.05 },
            { id: 'premium', name: 'Premium', costMod: 1.4, quality: 95, risk: 0.01 }
        ];

// public/script.js
state.gameState = null;
const API_URL = '/api'
//updates game info
export function updateGameInfo(dbUser) {
    console.log("Updating game state from DB...");
    const data = dbUser.game_data;
    const savedUser = data.user || data; 
    //Set Global Auth Variables
    state.userAuthId = dbUser.auth0_id;
    state.userEmail = dbUser.email;

    const rawHistory = data.history || [];
    
    const cleanHistory = rawHistory.map(entry => {
        if (typeof entry === 'object' && entry.events) {
            return entry;
        }
        return {
            age: savedUser.age || 0,
            events: [{ msg: entry, color: "text-gray-400" }]
        };
    });
    //CONSTRUCT state.gameState
    state.gameState = {
        user: {
            ...savedUser,
            // --- IDENTITY ---
            username: savedUser.username || savedUser.name || "Player",
            gender: savedUser.gender || "male",
            city: savedUser.city || "New York",
            appearance: savedUser.appearance || null,
            avatarVersion: savedUser.avatarVersion || 0,

            // --- CORE STATS ---
            age: data.stats?.age || savedUser.age || 0,
            health: data.stats?.health || savedUser.health || 100,
            money: data.money || savedUser.money || 0,
            lifeStatus: savedUser.lifeStatus || "Baby",
            isDead: savedUser.isDead || false,

            // --- EDUCATION (Undergrad) ---
            isStudent: savedUser.isStudent || false,
            universityEnrolled: savedUser.universityEnrolled || false,
            universitySchoolYear: savedUser.universitySchoolYear || 0,
            universityGraduated: savedUser.universityGraduated || false,
            major: savedUser.major || '',
            schoolActions: savedUser.schoolActions || 0,
            schoolPerformance: savedUser.schoolPerformance || 50,
            highSchoolRetained: savedUser.highSchoolRetained || false,
            
            // --- EDUCATION (Grad School) ---
            gradSchoolEnrolled: savedUser.gradSchoolEnrolled || false,
            gradSchoolType: savedUser.gradSchoolType || null,
            gradSchoolYear: savedUser.gradSchoolYear || 0,
            gradSchoolDegree: savedUser.gradSchoolDegree || null,
            parentsTried: savedUser.parents_tried || false,

            // --- CAREER & FINANCE ---
            jobTitle: savedUser.jobTitle || (data.job ? data.job.title : ""),
            jobSalary: savedUser.jobSalary || (data.job ? data.job.salary : 0),
            jobPerformance: savedUser.jobPerformance || 50,
            careerActionTaken: savedUser.careerActionTaken || 0,
            careerTrack: savedUser.careerTrack || null,
            careerLevel: savedUser.careerLevel ?? 0,
            yearsInRole: savedUser.yearsInRole || 0,
            consecutivePoorYears: savedUser.consecutivePoorYears || 0,
            monthlyOutflow: savedUser.monthlyOutflow || 0,
            studentLoans: savedUser.studentLoans || 0,
            monthlyLivingExpense: savedUser.monthlyLivingExpense || 0,
            
            // --- BUSINESS ---
            hasBusiness:         savedUser.hasBusiness         || false,
            companyName:         savedUser.companyName         || null,
            ceoSalary:           savedUser.ceoSalary           || 0,
            industry:            savedUser.industry            || null,
            compCash:            savedUser.compCash            || 0,
            companyYear:         savedUser.companyYear         || 1,
            companyQuarter:      savedUser.companyQuarter      || 1,
            employees:           savedUser.employees           || 0,
            businessReputation:  savedUser.businessReputation  || 0,
            inventory:           savedUser.inventory           || 0,
            productionTarget:    savedUser.productionTarget    || 0,
            sellingPrice:        savedUser.sellingPrice        || 0,
            salaryOffer:         savedUser.salaryOffer         || 0,
            supplierId:          savedUser.supplierId          || null,
            hqTier:              savedUser.hqTier               || 'garage',
            marketingLevels:     savedUser.marketingLevels      || { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 },
            teamRoles:           savedUser.teamRoles            || { engineering: 2, sales: 1, operations: 1, marketing: 1 },
            equityOwned:         savedUser.equityOwned          ?? 1.0,
            investorShares:      savedUser.investorShares       || [],
            corporateDebt:       savedUser.corporateDebt        || { principal: 0, interestRate: 0.08, monthlyPayment: 0 },
            customerSatisfaction:savedUser.customerSatisfaction ?? 75,
            employeeMorale:      savedUser.employeeMorale       ?? 80,
            activeResearch:      savedUser.activeResearch       || [],
            businessHistory:     savedUser.businessHistory     || [],
            businessUpgrades:    savedUser.businessUpgrades    || [],
            lastCompletedFiscalYearAge: savedUser.lastCompletedFiscalYearAge ?? null,
            lastBusinessAge:      savedUser.lastBusinessAge      ?? null,
            quartersProcessedThisAge: savedUser.quartersProcessedThisAge || 0,
            purchases:           savedUser.purchases           || [],
            pastLives:           savedUser.pastLives           || [],
            generation:          savedUser.generation          || 1,

            // --- FLAGS ---
            hasSeenExpenseMsg: savedUser.hasSeenExpenseMsg || false,
            hasSeenJobSalary: savedUser.hasSeenJobSalary || false,
            gymMembership: savedUser.gymMembership || false,
            hasBetterDiet: savedUser.hasBetterDiet || false,

            // --- ASSETS & INVESTMENTS ---
            assets: savedUser.assets || [],
            investments: savedUser.investments || null,

            // --- RELATIONSHIPS ---
            relationships: savedUser.relationships || [],
            isExpecting: savedUser.isExpecting || false,
            expectingWithId: savedUser.expectingWithId || null
        },
        
        // --- ASSETS & HISTORY ---
        lifeLog: cleanHistory
    };
    GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
    // 5. Render
   if (state.gameState.user.lifeStatus === "Deceased") {
        console.log("Dead character detected. Locking to death screen.");
        const cause = state.gameState.user.deathCause || "natural causes";
        if (typeof renderDeathScreen === "function") {
            renderDeathScreen(state.gameState.user, cause);
        }
    } else if (typeof renderLifeDashboard === "function") {
        renderLifeDashboard(); 
    } else {
        console.error("❌ renderLifeDashboard function not found!");
    }

    console.log("✅ Game Loaded & Ready");
};
//Loads and renders the game
export const loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username);

    // Initialize the Single Source of Truth
    state.gameState = {
        user: {
            ...userData,
            money: userData.money || 0,
            age: userData.age || 0,
            health: userData.health || 100,
            gender: userData.gender || 'male',
            city: userData.city || "New York",
            appearance: userData.appearance || null,
            avatarVersion: userData.avatarVersion || 0,
            isDead: userData.is_dead || false,
            //education
            isStudent: userData.is_student || false,
            universityEnrolled: userData.university_enrolled || false,
            universitySchoolYear: userData.university_school_year || 0,
            universityGraduated: userData.universityGraduated || false,
            major: userData.major || '',
            parentsTried: userData.parents_tried || false,
            schoolActions: userData.school_actions || 0,
            careerActionTaken: userData.career_action_taken || 0,
            monthlyOutflow: userData.monthly_outflow || 0,
            monthlyLivingExpense: userData.monthlyLivingExpense || 0,
            studentLoans: userData.student_loans || 0,
            gradSchoolEnrolled: userData.grad_school_enrolled || false,
            gradSchoolType: userData.grad_school_type || null,
            gradSchoolYear: userData.grad_school_year || 0,
            gradSchoolDegree: userData.grad_school_degree || null,
            hasSeenExpenseMsg: userData.has_seen_expense_message || false,
            //job
            jobTitle: userData.job_title || '',
            jobSalary: userData.job_salary || 0,
            jobPerformance: userData.jobPerformance || 50,
            hasSeenJobSalary: userData.has_seen_job_salary || false,
            careerTrack: userData.careerTrack || null,
            careerLevel: userData.careerLevel ?? 0,
            yearsInRole: userData.yearsInRole || 0,
            consecutivePoorYears: userData.consecutivePoorYears || 0,
            gymMembership: userData.gymMembership || false,
            hasBetterDiet: userData.hasBetterDiet || false,
            schoolPerformance: userData.school_performance || 50,
            schoolActions: userData.schoolActions || 0,
            highSchoolRetained: userData.high_school_retained || false,
            //ceo / business
            hasBusiness:         userData.has_business         || false,
            companyName:         userData.companyName          || null,
            ceoSalary:           userData.ceoSalary            || 0,
            industry:            userData.industry             || null,
            compCash:            userData.compCash             || 0,
            companyYear:         userData.companyYear          || 1,
            companyQuarter:      userData.companyQuarter       || 1,
            employees:           userData.employees            || 0,
            businessReputation:  userData.businessReputation   || 0,
            inventory:           userData.inventory            || 0,
            productionTarget:    userData.productionTarget     || 0,
            sellingPrice:        userData.sellingPrice         || 0,
            salaryOffer:         userData.salaryOffer          || 0,
            supplierId:          userData.supplierId           || null,
            hqTier:              userData.hqTier               || 'garage',
            marketingLevels:     userData.marketingLevels      || { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 },
            teamRoles:           userData.teamRoles            || { engineering: 2, sales: 1, operations: 1, marketing: 1 },
            equityOwned:         userData.equityOwned          ?? 1.0,
            investorShares:      userData.investorShares       || [],
            corporateDebt:       userData.corporateDebt        || { principal: 0, interestRate: 0.08, monthlyPayment: 0 },
            customerSatisfaction:userData.customerSatisfaction ?? 75,
            employeeMorale:      userData.employeeMorale       ?? 80,
            activeResearch:      userData.activeResearch       || [],
            businessHistory:     userData.businessHistory      || [],
            businessUpgrades:    userData.businessUpgrades     || [],
            lastCompletedFiscalYearAge: userData.lastCompletedFiscalYearAge ?? null,
            lastBusinessAge:      userData.lastBusinessAge      ?? null,
            quartersProcessedThisAge: userData.quartersProcessedThisAge || 0,
            pastLives:           userData.pastLives            || [],
            generation:          userData.generation           || 1,
            lifeStatus: userData.life_status || "Baby",
            assets: userData.assets || [],
            investments: userData.investments || null,

            // --- RELATIONSHIPS ---
            relationships: userData.relationships || [],
            hadUnfaithfulHookupThisYear: userData.hadUnfaithfulHookupThisYear || false
        },
        lifeLog: [{ age: 0, events: [{ msg: "Game Loaded.", color: "text-white" }] }]    
    };
    //.addLog function contains the renderLifeDashboard call
    addLog(`Born in ${userData.city}. Welcome to the world!`, 'good');
};
//save game function
// Attach to window so it is globally accessible
export async function saveGame() {
    
    // 1. Safety Checks
    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!state.userAuthId) {
        Utils.guestStorage.saveGame()
        console.log("⚠️ Guest mode. Saved locally.");
        return;
    }
    if (!state.gameState || !state.gameState.user) {
        console.error("⚠️ Game state not ready. Save skipped.");
        return;
    }

    console.log("Saving to Cloud...");

    // 2. The Payload
    // This captures EVERYTHING: isStudent, loans, history, assets, etc.
    const payload = {
        auth0_id: state.userAuthId,
        email: state.userEmail, // optional helper
        
        game_data: {
            // The "Suitcase" - Contains all flags (isStudent, hasBusiness, etc.)
            user: state.gameState.user, 
            
            // The Lists
            history: state.gameState.lifeLog,
            assets: state.gameState.assets,
            
            // Redundant top-level helpers for easier DB queries later
            bank: state.gameState.user.money,
            job: { 
                title: state.gameState.user.jobTitle, 
                salary: state.gameState.user.jobSalary 
            },
            stats: {
                age: state.gameState.user.age,
                health: state.gameState.user.health
            }
        }
    };

    // 3. Send to API
    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Save Complete!");
            
            // Optional: Visual Feedback (Toast)
            // showToast("Game Saved"); 
        } else {
            console.error("❌ Save Failed:", await response.text());
        }
    } catch (e) {
        console.error("Network Error:", e);
    }
};
// --- Unified Entry Point ---
export const onload = async () => {
    try {
        // Wrap this in a robust try/catch to silence SDK errors
        await configureAuth().catch(err => {
            console.warn("Auth0 check skipped or blocked (Guest Mode active).", err);
        }); 
        console.log("Auth0 Configured.");
    } catch (e) {
        console.warn("Auth Initialization warning:", e);
    }

    // Continue to game initialization regardless of Auth0 errors
    await initGame();
};

// --- Updated Game Initializer ---
async function initGame() {
    console.log("Initializing Game Logic...");

    // 1. Check Auth0 Status
    const isAuthenticated = state.auth0Client ? await state.auth0Client.isAuthenticated() : false;

    if (isAuthenticated) {
        // User is logged in! 
        const user = await state.auth0Client.getUser();
        console.log(`Welcome back, ${user.nickname} (${user.sub})`);
        
        // Save ID immediately so we can use it
        state.userAuthId = user.sub;
        state.userEmail = user.email;

        // Check for active guest save
        const guestSave = Utils.guestStorage.loadGame();
        const hasGuestSave = guestSave && guestSave.user && guestSave.user.lifeStatus !== "Deceased";

        // Try to load existing cloud save first
        let dbUser = null;
        try {
            const response = await fetch(`/api/load?auth0_id=${user.sub}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.game_data && Object.keys(data.game_data).length > 0 && (data.game_data.user || data.game_data.stats)) {
                    dbUser = data;
                }
            }
        } catch (e) {
            console.error("Error checking cloud save:", e);
        }

        // SCENARIO 1: Both Guest Save AND Cloud Save exist -> CONFLICT RESOLUTION MODAL
        if (hasGuestSave && dbUser) {
            console.log("Conflict detected: Active guest character AND existing cloud save found.");
            
            const cloudUser = dbUser.game_data.user || dbUser.game_data;
            const cloudName = cloudUser.username || cloudUser.name || "Account Character";
            const cloudAge = dbUser.game_data.stats?.age || cloudUser.age || 0;
            
            const guestName = guestSave.user.username || guestSave.user.name || "Guest Character";
            const guestAge = guestSave.user.age || 0;

            const modalMsg = `
                <div class="space-y-3 text-left text-sm">
                    <p class="text-slate-300">An existing character was found on your account, as well as an active guest character.</p>
                    
                    <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700 space-y-1">
                        <div class="font-bold text-blue-400 text-xs uppercase tracking-wider">Cloud Save</div>
                        <div class="text-white font-semibold">${cloudName} (Age ${cloudAge})</div>
                    </div>
                    
                    <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700 space-y-1">
                        <div class="font-bold text-amber-400 text-xs uppercase tracking-wider">Current Guest Character</div>
                        <div class="text-white font-semibold">${guestName} (Age ${guestAge})</div>
                    </div>
                    
                    <p class="text-xs text-slate-400">Which character would you like to keep?</p>
                </div>
            `;

            UI.showConfirm(
                "Save Conflict Detected",
                modalMsg,
                "Use Guest Character",
                async () => {
                    console.log("User chose Guest Character. Overwriting Cloud save...");
                    state.gameState = guestSave;
                    GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);
                    await saveGame();
                    Utils.guestStorage.clearSave();
                    renderLifeDashboard();
                    UI.showModal("Character Saved!", `Your guest character (${guestName}) has been saved to your account.`);
                }
            );

            const cancelBtn = document.getElementById('modal-cancel');
            if (cancelBtn) {
                cancelBtn.innerText = "Keep Cloud Character";
                cancelBtn.onclick = () => {
                    console.log("User chose Account Character. Loading Cloud save...");
                    Utils.guestStorage.clearSave();
                    UI.hideModal();
                    updateGameInfo(dbUser);
                    UI.showModal("Cloud Save Loaded", `Welcome back! Loaded your account character (${cloudName}).`);
                };
            }
            return;
        }

        // SCENARIO 2: Guest Save exists, but NO Cloud Save exists -> Auto Migration
        if (hasGuestSave) {
            console.log("Migrating active guest character to logged-in cloud account...");
            state.gameState = guestSave;
            GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);
            
            await saveGame();
            Utils.guestStorage.clearSave();

            if (typeof renderLifeDashboard === "function") {
                renderLifeDashboard();
                UI.showModal("Character Saved!", `Welcome ${user.nickname || 'Player'}! Your character has been saved to your account.`);
            }
            return;
        }

        // SCENARIO 3: No Guest Save -> Load Cloud Save or Start Character Creation
        if (dbUser) {
            updateGameInfo(dbUser);
        } else {
            console.log("No save file found. Starting Character Creation.");
            renderCharCreation();
        }

    } else {
        // Guest Mode - Check for local storage save
        console.log("Guest mode detected.");
        const guestSave = Utils.guestStorage.loadGame();
        
    if (guestSave) {
            // THE FIX: Intercept and destroy dead guest saves
            if (guestSave.user && guestSave.user.lifeStatus === "Deceased") {
                console.log("Guest character is dead. Wiping local save.");
                
                // Clear state and overwrite local storage with empty data
                state.gameState = null;
                if (Utils.guestStorage.saveGame) {
                    Utils.guestStorage.saveGame(); 
                }
                
                renderLoginScreen();
            } else {
                console.log("Loading guest save from local storage...");
                state.gameState = guestSave;
                GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);
                if (typeof renderLifeDashboard === "function") {
                    renderLifeDashboard();
                } else {
                    console.error("renderLifeDashboard function not found!");
                }
            }
        } else {
            // No guest save - show login screen
            renderLoginScreen();
        }
    }
};
// script.js

// --- RESET GAME PIPELINE ---
export async function resetGame() {
    console.log("Resetting game state...");
    UI.resetHeader();

    UI.renderScreen(`
        <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-circle-notch fa-spin text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-2xl font-bold text-white mb-2">Obliterating the Past...</h1>
            <p class="text-slate-400">Preparing your next life.</p>
        </div>
    `);

    // 1. Destroy local state
    state.gameState = null;

    // 2. Handle Guest Reset
    if (!state.userAuthId) {
        if (Utils && Utils.guestStorage && typeof Utils.guestStorage.saveGame === 'function') {
            // Saving while gameState is null effectively clears the local storage
            Utils.guestStorage.saveGame(); 
        }
        console.log("Guest save wiped.");
        
        // Route guests back to login so they can choose to authenticate or play as guest again
        if (typeof renderLoginScreen === "function") {
            renderLoginScreen();
            return;
        }
    } 
    // 3. Handle Authenticated User Reset
    else {
        console.log("Wiping Cloud Save...");
        try {
            await fetch('/api/saveGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth0_id: state.userAuthId,
                    email: state.userEmail,
                    game_data: {} // Overwrites the DB with empty data, clearing the "Deceased" lock
                })
            });
        } catch (e) {
            console.error("Failed to reset cloud save:", e);
        }
    }

    // 4. Route authenticated users to Character Creation
    if (typeof renderCharCreation === "function") {
        renderCharCreation();
    }
};

const closeModal = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-overlay').classList.remove('flex');
};

const showComingSoon = () => {
    UI.showModal('Coming Soon', 'This section is under construction.');
};

const routeHandlers = {
  resetGame,
  cycleTrait,
  randomizeSection,
  randomizeAllTraits,
  updateCityDropdown,
  applyForJob,
  applyForCareerTrack,
  answerInterview,
  retryInterview,
  showFullEulogy,
  closeModal,
  showComingSoon,
  workHarder,
  skipSchool,
  workHarderJob,
  slackOffJob,
  login,
  startGuestMode,
  renderVehicleManager,
  renderLifeDashboard,
  renderShoppingHub,
  renderAssets,
  renderInvestmentsScreen,
  switchInvestmentTab,
  setStockFilter,
  openStockDetailsModal,
  openBuyStockModal,
  confirmBuyStock,
  openSellStockModal,
  confirmSellStock,
  openDepositSavingsModal,
  confirmDepositSavings,
  openWithdrawSavingsModal,
  confirmWithdrawSavings,
  repairVehicle,
  sellVehicle,
  renderVehicleDealer,
  buyVehicle,
  renderRealEstateDealer,
  buyPropertyCash,
  buyPropertyMortgage,
  renderPropertyManager,
  payOffMortgage,
  openSellPropertyModal,
  submitPropertyListing,
  acceptBuyerOffer,
  doPropertyMaintenance,
  doPropertyRenovation,
  openTenantScreening,
  acceptTenantLease,
  evictTenantAction,
  demandTenantRentPayment,
  forgiveTenantRent,
  evictTenantFromEvent,
  demandTenantRepairPayment,
  forgiveTenantDamage,
  renewLeaseSameRate,
  renewLeaseWithIncrease,
  declineLeaseRenewal,
  get renderActivities() { return renderActivities; },
  processQuarter,
  setBusinessTab,
  selectSupplierDashboard,
  upgradeHQTier,
  upgradeMarketingChannel,
  adjustRoleCount,
  acceptVCPitch,
  chooseEventChoice,
  selectIndustry,
  selectSupplier,
  initBusiness,
  hireEmployee,
  layoffEmployee,
  sellBusiness,
  purchaseUpgrade,
  confirmQuitCareer,
  quitCareer,
  attemptEnrollment,
  openGradEnrollmentModal,
  attemptGradEnrollment,
  enterBusinessMode,
  renderEducation,
  renderClassmates,
  renderGradSchoolMarket,
  openUniversityModal,
  renderCareerManager,
  renderJobMarket,
  renderCareerMarket,
  renderBusinessSetup,
  selectGender,
  submitCharacter,
  get continueAsChild() { return continueAsChild; },
  get ageUp() { return ageUp; },
  get renderDeathScreen() { return renderDeathScreen; },
  get showFullEulogy() { return showFullEulogy; },
  renderRelationships,
  renderPersonInteraction,
  openRelationshipConfirm,
  spendTimeWithAll,
  goOutMeetSomeone,
  openMeetPeopleModal,
  setAttractionPreference,
  handleBlindDate,
  handleDatingApp,
  renderDatingAppModal,
  selectDatingAppMatch,
  handleMeetFriend,
  handleNightOut,
  renderLuxeMatchModal,
  selectLuxeAgePreset,
  selectLuxeWealthTier,
  confirmLuxeMatch,
  handleMakeAMove,
  confirmHookupChoice,
  handleEndAffair,
  handleCheatingConfrontationChoice,
  openWeddingPlanner,
  confirmWeddingPlan,
  openNameChangeChoice,
  chooseNameChange,
  chooseFuneralType,
  cancelFuneralPlan,
  confirmFuneralPlan,
  donateBody,
  lookTheOtherWay,
  goToFuneral,
  skipFuneral,
  respondNewTeacher,
  processNextTeacherReplacement,
  renderMoreDashboard,
  renderCasinoHub,
  openRouletteModal,
  confirmRouletteBet,
  confirmRouletteSingleNumberBet,
  openSlotsModal,
  confirmSlotsSpin,
  buyGymMembership,
  cancelGymMembership,
  visitGymOneTime,
  startBetterDiet,
  cancelBetterDiet,
  visitDoctor,
  openBlackjackBetting,
  startBlackjackGame,
  blackjackHit,
  blackjackStand,
  hideModal: UI.hideModal,
  openTravelModal,
  bookTrip,
  renderJewelryDealer,
  buyJewelry,
  renderJewelryManager,
  toggleWearJewelry,
  toggleInsureJewelry,
  sellJewelry,
  openGiftJewelryModal,
  confirmGiftJewelry,
  handleProposeAction,
  openRingSelectionModal,
  proposeWithRing,
  buyVehicleCash,
  buyVehicleLoan,
  setPrimaryVehicle,
  toggleInsureVehicle,
  takeJoyride,
  openGiftVehicleModal,
  confirmGiftVehicle,
  openDietSelectionModal,
  selectDiet,
  openLotteryModal,
  buyLotteryTicket,
  openSuggestionsModal,
  openMoveCountryModal,
  updateRelocateCityDropdown,
  confirmMoveCountry,
  askPartnerToMove,
  confirmMoveAlone,
  openSettingsModal,
  triggerManualSave,
  promptResetGame,
  toggleSettingSFX,
  toggleSettingCompact,
  toggleSettingTheme,
  openPlayerOverviewModal,
  renderStoreScreen,
  filterStoreCategory,
  previewPackDetails,
  buyPack,
  restorePurchases,
  grantInstantHighSchool,
  grantInstantUniversityDegree,
  grantInstantGradDegree,
  renderInstantDiplomaHub,
  claimInstantUniversityMajor,
  renderVipLoungeModal,
  selectTheme,
  renderGraveyardModal,
  showAncestorEulogy
};

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        const action = actionElement.dataset.action;
        const argsStr = actionElement.dataset.args;
        let args = [];
        if (argsStr !== undefined && argsStr !== null && argsStr.trim() !== '') {
            args = argsStr.split(',').map(s => {
                let t = s.trim();
                // strip quotes
                if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1);
                else if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
                
                if (t === 'true') return true;
                if (t === 'false') return false;
                if (t === 'null') return null;
                if (t === 'undefined') return undefined;
                
                return isNaN(t) || t === '' ? t : Number(t);
            });
        }
        if (routeHandlers[action]) {
            routeHandlers[action](...args);
        } else {
            console.warn('Unhandled action:', action);
        }
    }
});

document.addEventListener('change', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        const action = actionElement.dataset.action;
        if (routeHandlers[action]) {
            routeHandlers[action](e.target.value);
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => onload());
} else {
    onload();
}