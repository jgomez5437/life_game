import { login, logout, configureAuth, getAuthToken } from '../auth/auth.js';
import { startGuestMode, renderLoginScreen } from '../auth/loginScreen.js';
import { state } from './state.js';
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';

// --- Dynamic Module Loader & Background Preloader ---
import { lazy, preloadForContext, attachIntentPreloaders } from './moduleLoader.js';

export {
    MAJORS,
    CAREER_TRACKS,
    SPECIAL_CAREER_TRACKS,
    PART_TIME_JOBS,
    INDUSTRIES,
    SUPPLIERS
} from './constants.js';

// --- Dynamic Feature Screen Proxies via Central ModuleLoader ---
// Business
export const processQuarter = lazy('businessDashboard', 'processQuarter');
export const enterBusinessMode = lazy('businessDashboard', 'enterBusinessMode');
export const hireEmployee = lazy('businessDashboard', 'hireEmployee');
export const layoffEmployee = lazy('businessDashboard', 'layoffEmployee');
export const sellBusiness = lazy('businessDashboard', 'sellBusiness');
export const purchaseUpgrade = lazy('businessDashboard', 'purchaseUpgrade');
export const setBusinessTab = lazy('businessDashboard', 'setBusinessTab');
export const selectSupplierDashboard = lazy('businessDashboard', 'selectSupplierDashboard');
export const upgradeHQTier = lazy('businessDashboard', 'upgradeHQTier');
export const upgradeMarketingChannel = lazy('businessDashboard', 'upgradeMarketingChannel');
export const adjustRoleCount = lazy('businessDashboard', 'adjustRoleCount');
export const acceptVCPitch = lazy('businessDashboard', 'acceptVCPitch');
export const chooseEventChoice = lazy('businessDashboard', 'chooseEventChoice');

export const selectIndustry = lazy('createBusiness', 'selectIndustry');
export const selectSupplier = lazy('createBusiness', 'selectSupplier');
export const renderBusinessSetup = lazy('createBusiness', 'renderBusinessSetup');
export const initBusiness = lazy('createBusiness', 'initBusiness');

// Career & Jobs
export const renderCareerMarket = lazy('careerJobs', 'renderCareerMarket');
export const applyForJob = lazy('careerJobs', 'applyForJob');
export const applyForCareerTrack = lazy('careerJobs', 'applyForCareerTrack');
export const joinSpecialCareer = lazy('careerJobs', 'joinSpecialCareer');
export const confirmJoinSpecialCareer = lazy('careerJobs', 'confirmJoinSpecialCareer');
export const answerInterview = lazy('careerJobs', 'answerInterview');
export const retryInterview = lazy('careerJobs', 'retryInterview');

export const confirmQuitCareer = lazy('jobCareerManager', 'confirmQuitCareer');
export const quitCareer = lazy('jobCareerManager', 'quitCareer');
export const renderCareerManager = lazy('jobCareerManager', 'renderCareerManager');
export const workHarderJob = lazy('jobCareerManager', 'workHarderJob');
export const slackOffJob = lazy('jobCareerManager', 'slackOffJob');
export const attemptMafiaCrime = lazy('jobCareerManager', 'attemptMafiaCrime');

export const renderJobMarket = lazy('partTimeJobs', 'renderJobMarket');

// Education
export const renderEducation = lazy('manageEducation', 'renderEducation');
export const workHarder = lazy('manageEducation', 'workHarder');
export const skipSchool = lazy('manageEducation', 'skipSchool');
export const renderClassmates = lazy('manageEducation', 'renderClassmates');

// Occupation / University / Grad School
export const attemptEnrollment = lazy('occupation', 'attemptEnrollment');
export const openGradEnrollmentModal = lazy('occupation', 'openGradEnrollmentModal');
export const attemptGradEnrollment = lazy('occupation', 'attemptGradEnrollment');
export const renderGradSchoolMarket = lazy('occupation', 'renderGradSchoolMarket');
export const openUniversityModal = lazy('occupation', 'openUniversityModal');
export const renderActivities = lazy('occupation', 'renderActivities');

// Character Creation
export const selectGender = lazy('charCreation', 'selectGender');
export const submitCharacter = lazy('charCreation', 'submitCharacter');
export const renderCharCreation = lazy('charCreation', 'renderCharCreation');
export const cycleTrait = lazy('charCreation', 'cycleTrait');
export const randomizeSection = lazy('charCreation', 'randomizeSection');
export const randomizeAllTraits = lazy('charCreation', 'randomizeAllTraits');
export const updateCityDropdown = lazy('charCreation', 'updateCityDropdown');
export const maxCreationGodStats = lazy('charCreation', 'maxCreationGodStats');

// Main Screen
export const ageUp = lazy('mainScreen', 'ageUp');
export const continueAsChild = lazy('mainScreen', 'continueAsChild');
export const renderLifeDashboard = lazy('mainScreen', 'renderLifeDashboard');
export const addLog = lazy('mainScreen', 'addLog');
export const renderDeathScreen = lazy('mainScreen', 'renderDeathScreen');
export const showFullEulogy = lazy('mainScreen', 'showFullEulogy');

// Player Overview
export const openPlayerOverviewModal = lazy('playerOverview', 'openPlayerOverviewModal');

// Assets
export const renderAssets = lazy('assets', 'renderAssets');
export const renderVehicleManager = lazy('assets', 'renderVehicleManager');
export const repairVehicle = lazy('assets', 'repairVehicle');
export const sellVehicle = lazy('assets', 'sellVehicle');
export const renderPropertyManager = lazy('assets', 'renderPropertyManager');
export const payOffMortgage = lazy('assets', 'payOffMortgage');
export const openSellPropertyModal = lazy('assets', 'openSellPropertyModal');
export const submitPropertyListing = lazy('assets', 'submitPropertyListing');
export const acceptBuyerOffer = lazy('assets', 'acceptBuyerOffer');
export const doPropertyMaintenance = lazy('assets', 'doPropertyMaintenance');
export const doPropertyRenovation = lazy('assets', 'doPropertyRenovation');
export const openTenantScreening = lazy('assets', 'openTenantScreening');
export const acceptTenantLease = lazy('assets', 'acceptTenantLease');
export const evictTenantAction = lazy('assets', 'evictTenantAction');
export const demandTenantRentPayment = lazy('assets', 'demandTenantRentPayment');
export const forgiveTenantRent = lazy('assets', 'forgiveTenantRent');
export const evictTenantFromEvent = lazy('assets', 'evictTenantFromEvent');
export const demandTenantRepairPayment = lazy('assets', 'demandTenantRepairPayment');
export const forgiveTenantDamage = lazy('assets', 'forgiveTenantDamage');
export const renewLeaseSameRate = lazy('assets', 'renewLeaseSameRate');
export const renewLeaseWithIncrease = lazy('assets', 'renewLeaseWithIncrease');
export const declineLeaseRenewal = lazy('assets', 'declineLeaseRenewal');
export const renderJewelryManager = lazy('assets', 'renderJewelryManager');
export const toggleWearJewelry = lazy('assets', 'toggleWearJewelry');
export const toggleInsureJewelry = lazy('assets', 'toggleInsureJewelry');
export const sellJewelry = lazy('assets', 'sellJewelry');
export const openGiftJewelryModal = lazy('assets', 'openGiftJewelryModal');
export const confirmGiftJewelry = lazy('assets', 'confirmGiftJewelry');
export const setPrimaryVehicle = lazy('assets', 'setPrimaryVehicle');
export const toggleInsureVehicle = lazy('assets', 'toggleInsureVehicle');
export const takeJoyride = lazy('assets', 'takeJoyride');
export const openGiftVehicleModal = lazy('assets', 'openGiftVehicleModal');
export const confirmGiftVehicle = lazy('assets', 'confirmGiftVehicle');

// Shopping
export const renderShoppingHub = lazy('goShopping', 'renderShoppingHub');
export const renderVehicleDealer = lazy('goShopping', 'renderVehicleDealer');
export const buyVehicle = lazy('goShopping', 'buyVehicle');
export const buyVehicleCash = lazy('goShopping', 'buyVehicleCash');
export const buyVehicleLoan = lazy('goShopping', 'buyVehicleLoan');
export const renderRealEstateDealer = lazy('goShopping', 'renderRealEstateDealer');
export const buyPropertyCash = lazy('goShopping', 'buyPropertyCash');
export const buyPropertyMortgage = lazy('goShopping', 'buyPropertyMortgage');
export const renderJewelryDealer = lazy('goShopping', 'renderJewelryDealer');
export const buyJewelry = lazy('goShopping', 'buyJewelry');

// Investments
export const renderInvestmentsScreen = lazy('investments', 'renderInvestmentsScreen');
export const switchInvestmentTab = lazy('investments', 'switchInvestmentTab');
export const setStockFilter = lazy('investments', 'setStockFilter');
export const openStockDetailsModal = lazy('investments', 'openStockDetailsModal');
export const openBuyStockModal = lazy('investments', 'openBuyStockModal');
export const confirmBuyStock = lazy('investments', 'confirmBuyStock');
export const openSellStockModal = lazy('investments', 'openSellStockModal');
export const confirmSellStock = lazy('investments', 'confirmSellStock');
export const openDepositSavingsModal = lazy('investments', 'openDepositSavingsModal');
export const confirmDepositSavings = lazy('investments', 'confirmDepositSavings');
export const openWithdrawSavingsModal = lazy('investments', 'openWithdrawSavingsModal');
export const confirmWithdrawSavings = lazy('investments', 'confirmWithdrawSavings');

// Relationships
export const renderRelationships = lazy('relationships', 'renderRelationships');
export const renderPersonInteraction = lazy('relationships', 'renderPersonInteraction');
export const openRelationshipConfirm = lazy('relationships', 'openRelationshipConfirm');
export const spendTimeWithAll = lazy('relationships', 'spendTimeWithAll');
export const goOutMeetSomeone = lazy('relationships', 'goOutMeetSomeone');
export const openMeetPeopleModal = lazy('relationships', 'openMeetPeopleModal');
export const setAttractionPreference = lazy('relationships', 'setAttractionPreference');
export const handleBlindDate = lazy('relationships', 'handleBlindDate');
export const handleDatingApp = lazy('relationships', 'handleDatingApp');
export const renderDatingAppModal = lazy('relationships', 'renderDatingAppModal');
export const selectDatingAppMatch = lazy('relationships', 'selectDatingAppMatch');
export const handleMeetFriend = lazy('relationships', 'handleMeetFriend');
export const handleNightOut = lazy('relationships', 'handleNightOut');
export const renderLuxeMatchModal = lazy('relationships', 'renderLuxeMatchModal');
export const selectLuxeAgePreset = lazy('relationships', 'selectLuxeAgePreset');
export const selectLuxeWealthTier = lazy('relationships', 'selectLuxeWealthTier');
export const confirmLuxeMatch = lazy('relationships', 'confirmLuxeMatch');
export const handleMakeAMove = lazy('relationships', 'handleMakeAMove');
export const confirmHookupChoice = lazy('relationships', 'confirmHookupChoice');
export const handleEndAffair = lazy('relationships', 'handleEndAffair');
export const handleCheatingConfrontationChoice = lazy('relationships', 'handleCheatingConfrontationChoice');
export const handleProposeAction = lazy('relationships', 'handleProposeAction');
export const openRingSelectionModal = lazy('relationships', 'openRingSelectionModal');
export const proposeWithRing = lazy('relationships', 'proposeWithRing');

// Funeral
export const chooseFuneralType = lazy('funeral', 'chooseFuneralType');
export const cancelFuneralPlan = lazy('funeral', 'cancelFuneralPlan');
export const confirmFuneralPlan = lazy('funeral', 'confirmFuneralPlan');
export const donateBody = lazy('funeral', 'donateBody');
export const lookTheOtherWay = lazy('funeral', 'lookTheOtherWay');
export const goToFuneral = lazy('funeral', 'goToFuneral');
export const skipFuneral = lazy('funeral', 'skipFuneral');
export const respondNewTeacher = lazy('funeral', 'respondNewTeacher');
export const processNextTeacherReplacement = lazy('funeral', 'processNextTeacherReplacement');

// Romance
export const openWeddingPlanner = lazy('romance', 'openWeddingPlanner');
export const confirmWeddingPlan = lazy('romance', 'confirmWeddingPlan');
export const openNameChangeChoice = lazy('romance', 'openNameChangeChoice');
export const chooseNameChange = lazy('romance', 'chooseNameChange');

// More Dashboard & Lifestyle
export const renderMoreDashboard = lazy('more', 'renderMoreDashboard');
export const buyGymMembership = lazy('more', 'buyGymMembership');
export const cancelGymMembership = lazy('more', 'cancelGymMembership');
export const visitGymOneTime = lazy('more', 'visitGymOneTime');
export const startBetterDiet = lazy('more', 'startBetterDiet');
export const cancelBetterDiet = lazy('more', 'cancelBetterDiet');
export const visitDoctor = lazy('more', 'visitDoctor');
export const openBlackjackBetting = lazy('more', 'openBlackjackBetting');
export const startBlackjackGame = lazy('more', 'startBlackjackGame');
export const blackjackHit = lazy('more', 'blackjackHit');
export const blackjackStand = lazy('more', 'blackjackStand');
export const openTravelModal = lazy('more', 'openTravelModal');
export const bookTrip = lazy('more', 'bookTrip');
export const openDietSelectionModal = lazy('more', 'openDietSelectionModal');
export const selectDiet = lazy('more', 'selectDiet');
export const openLotteryModal = lazy('more', 'openLotteryModal');
export const buyLotteryTicket = lazy('more', 'buyLotteryTicket');
export const openMoveCountryModal = lazy('more', 'openMoveCountryModal');
export const updateRelocateCityDropdown = lazy('more', 'updateRelocateCityDropdown');
export const confirmMoveCountry = lazy('more', 'confirmMoveCountry');
export const askPartnerToMove = lazy('more', 'askPartnerToMove');
export const confirmMoveAlone = lazy('more', 'confirmMoveAlone');
export const openSkillsModal = lazy('more', 'openSkillsModal');

// Crime
export const renderCrimeDashboard = lazy('crime', 'renderCrimeDashboard');
export const openCrimeModal = lazy('crime', 'openCrimeModal');
export const commitCrimeAction = lazy('crime', 'commitCrimeAction');
export const showArrestModal = lazy('crime', 'showArrestModal');
export const openBribeModal = lazy('crime', 'openBribeModal');
export const submitBribeAction = lazy('crime', 'submitBribeAction');
export const handleArrestChoice = lazy('crime', 'handleArrestChoice');
export const showCourtArraignmentModal = lazy('crime', 'showCourtArraignmentModal');
export const selectLegalCounsel = lazy('crime', 'selectLegalCounsel');

// Casino
export const renderCasinoHub = lazy('casino', 'renderCasinoHub');
export const openRouletteModal = lazy('casino', 'openRouletteModal');
export const confirmRouletteBet = lazy('casino', 'confirmRouletteBet');
export const confirmRouletteSingleNumberBet = lazy('casino', 'confirmRouletteSingleNumberBet');
export const openSlotsModal = lazy('casino', 'openSlotsModal');
export const confirmSlotsSpin = lazy('casino', 'confirmSlotsSpin');

// Settings
export const openSettingsModal = lazy('settings', 'openSettingsModal');
export const triggerManualSave = lazy('settings', 'triggerManualSave');
export const promptResetGame = lazy('settings', 'promptResetGame');
export const promptSignOut = lazy('settings', 'promptSignOut');
export const handleSignOut = lazy('settings', 'handleSignOut');
export const toggleSettingSFX = lazy('settings', 'toggleSettingSFX');
export const toggleSettingCompact = lazy('settings', 'toggleSettingCompact');
export const toggleSettingTheme = lazy('settings', 'toggleSettingTheme');
export const applyTheme = lazy('settings', 'applyTheme');

// Store & Customization
export const renderStoreScreen = lazy('store', 'renderStoreScreen');
export const filterStoreCategory = lazy('store', 'filterStoreCategory');
export const previewPackDetails = lazy('store', 'previewPackDetails');
export const buyPack = lazy('store', 'buyPack');
export const restorePurchases = lazy('store', 'restorePurchases');
export const renderGodModeModal = lazy('store', 'renderGodModeModal');
export const maxGodModeStats = lazy('store', 'maxGodModeStats');
export const applyGodModeStats = lazy('store', 'applyGodModeStats');
export const openGodModeHubModal = lazy('store', 'openGodModeHubModal');

export const renderGodModeAvatarModal = lazy('godModeAvatar', 'renderGodModeAvatarModal');
export const cycleGodModeTrait = lazy('godModeAvatar', 'cycleGodModeTrait');
export const randomizeGodModeAvatarTraits = lazy('godModeAvatar', 'randomizeGodModeAvatarTraits');
export const saveGodModeAvatar = lazy('godModeAvatar', 'saveGodModeAvatar');

export const grantInstantHighSchool = lazy('instantDiploma', 'grantInstantHighSchool');
export const grantInstantUniversityDegree = lazy('instantDiploma', 'grantInstantUniversityDegree');
export const grantInstantGradDegree = lazy('instantDiploma', 'grantInstantGradDegree');
export const renderInstantDiplomaHub = lazy('instantDiploma', 'renderInstantDiplomaHub');
export const claimInstantUniversityMajor = lazy('instantDiploma', 'claimInstantUniversityMajor');

export const renderVipLoungeModal = lazy('vipLounge', 'renderVipLoungeModal');
export const selectTheme = lazy('vipLounge', 'selectTheme');
export const isVipSupporter = lazy('vipLounge', 'isVipSupporter');

export const renderGraveyardModal = lazy('graveyard', 'renderGraveyardModal');
export const showAncestorEulogy = lazy('graveyard', 'showAncestorEulogy');

// Prison
export const renderPrisonDashboard = lazy('prison', 'renderPrisonDashboard');
export const setPrisonTab = lazy('prison', 'setPrisonTab');
export const handleCellmateAction = lazy('prison', 'handleCellmateAction');
export const handleYardWorkout = lazy('prison', 'handleYardWorkout');
export const handleInmateInteract = lazy('prison', 'handleInmateInteract');
export const handleSelectPrisonJob = lazy('prison', 'handleSelectPrisonJob');
export const handleBuyCanteen = lazy('prison', 'handleBuyCanteen');
export const handleStudyLaw = lazy('prison', 'handleStudyLaw');
export const handleFileAppeal = lazy('prison', 'handleFileAppeal');
export const handlePrisonVisit = lazy('prison', 'handlePrisonVisit');
export const handleSendPrisonLetter = lazy('prison', 'handleSendPrisonLetter');
export const handleConjugalVisit = lazy('prison', 'handleConjugalVisit');
export const handleParoleHearing = lazy('prison', 'handleParoleHearing');
export const handlePrisonEscapeAction = lazy('prison', 'handlePrisonEscapeAction');
export const openContrabandPhoneModal = lazy('prison', 'openContrabandPhoneModal');
export const submitContrabandPhoneAction = lazy('prison', 'submitContrabandPhoneAction');
export const openDealerBuyModal = lazy('prison', 'openDealerBuyModal');
export const openDealerSellModal = lazy('prison', 'openDealerSellModal');
export const handleSellContrabandAction = lazy('prison', 'handleSellContrabandAction');
export const handleSolitaryActivity = lazy('prison', 'handleSolitaryActivity');
export const openInmateDetailModal = lazy('prison', 'openInmateDetailModal');
export const openAttackPromptModal = lazy('prison', 'openAttackPromptModal');
export const executeInmateAttack = lazy('prison', 'executeInmateAttack');

// Time Machine & Save Slots
export const renderTimeMachineModal = lazy('timeMachine', 'renderTimeMachineModal');
export const rewindToAge = lazy('timeMachine', 'rewindToAge');
export const renderSaveSlotManagerModal = lazy('saveSlotManager', 'renderSaveSlotManagerModal');
export const loadSlot = lazy('saveSlotManager', 'loadSlot');
export const branchCurrentSave = lazy('saveSlotManager', 'branchCurrentSave');
export const deleteSlot = lazy('saveSlotManager', 'deleteSlot');
export const startNewLifeInNewSlot = lazy('saveSlotManager', 'startNewLifeInNewSlot');
export const saveToSlot = lazy('saveSlotManager', 'saveToSlot');

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
            happiness: data.stats?.happiness || savedUser.happiness || 100,
            smarts: data.stats?.smarts || savedUser.smarts || Math.floor(Math.random() * 41) + 40,
            looks: data.stats?.looks || savedUser.looks || Math.floor(Math.random() * 41) + 40,
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

            // --- FLAGS & UNDERWORLD ---
            hasSeenExpenseMsg: savedUser.hasSeenExpenseMsg || false,
            hasSeenJobSalary: savedUser.hasSeenJobSalary || false,
            gymMembership: savedUser.gymMembership || false,
            hasBetterDiet: savedUser.hasBetterDiet || false,
            lifetimeCrimesCommitted: savedUser.lifetimeCrimesCommitted || 0,
            mafiaCrimesThisYear: savedUser.mafiaCrimesThisYear || 0,

            // --- ASSETS & INVESTMENTS ---
            assets: savedUser.assets || [],
            investments: savedUser.investments || null,

            // --- RELATIONSHIPS ---
            relationships: savedUser.relationships || [],
            isExpecting: savedUser.isExpecting || false,
            expectingWithId: savedUser.expectingWithId || null,

            // --- PRISON STATE ---
            inPrison: savedUser.inPrison || false,
            prisonSentenceRemaining: savedUser.prisonSentenceRemaining || 0,
            prisonTotalSentence: savedUser.prisonTotalSentence || 0,
            prisonSecurity: savedUser.prisonSecurity || 'Minimum',
            facilityName: savedUser.facilityName || null,
            prisonStats: savedUser.prisonStats || null,
            cellmate: savedUser.cellmate || null,
            yardInmates: savedUser.yardInmates || []
        },
        
        // --- ASSETS & HISTORY ---
        lifeLog: cleanHistory,

        // --- TIME MACHINE SNAPSHOTS ---
        snapshots: Array.isArray(data.snapshots) ? data.snapshots : []
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
            health: userData.health ?? userData.stats?.health ?? 100,
            happiness: userData.happiness ?? userData.stats?.happiness ?? 100,
            smarts: userData.smarts ?? userData.stats?.smarts ?? Math.floor(Math.random() * 41) + 40,
            looks: userData.looks ?? userData.stats?.looks ?? Math.floor(Math.random() * 41) + 40,
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
            hadUnfaithfulHookupThisYear: userData.hadUnfaithfulHookupThisYear || false,

            // --- PRISON STATE ---
            inPrison: userData.inPrison || false,
            prisonSentenceRemaining: userData.prisonSentenceRemaining || 0,
            prisonTotalSentence: userData.prisonTotalSentence || 0,
            prisonSecurity: userData.prisonSecurity || 'Minimum',
            facilityName: userData.facilityName || null,
            prisonStats: userData.prisonStats || null,
            cellmate: userData.cellmate || null,
            yardInmates: userData.yardInmates || []
        },
        lifeLog: [{ age: 0, events: [{ msg: "Game Loaded.", color: "text-white" }] }]    
    };
    //.addLog function contains the renderLifeDashboard call
    addLog(`Born in ${userData.city}. Welcome to the world!`, 'good');
};
//save game function
// Attach to window so it is globally accessible
if (typeof window !== 'undefined') {
    window.saveGame = saveGame;
    window.renderLifeDashboard = renderLifeDashboard;
    window.renderCharCreation = renderCharCreation;
}

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);

export async function saveGame() {
    if (isTestEnv) {
        return;
    }
    
    // 1. Safety Checks
    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!state.userAuthId) {
        saveToSlot();
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
            
            // Time Machine snapshots (paid feature data)
            snapshots: state.gameState.snapshots || [],
            
            // Redundant top-level helpers for easier DB queries later
            bank: state.gameState.user.money,
            job: { 
                title: state.gameState.user.jobTitle, 
                salary: state.gameState.user.jobSalary 
            },
            stats: {
                age: state.gameState.user.age,
                health: state.gameState.user.health ?? 100,
                happiness: state.gameState.user.happiness ?? 100,
                smarts: state.gameState.user.smarts ?? 50,
                looks: state.gameState.user.looks ?? 50
            }
        }
    };

    // 3. Send to API
    let authToken = '';
    try {
        authToken = await getAuthToken();
    } catch (e) {
        console.warn('Could not get auth token:', e);
    }

    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
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

    attachIntentPreloaders();

    // Continue to game initialization regardless of Auth0 errors
    await initGame();

    if (state.gameState) {
        preloadForContext(state.gameState);
    }
};

/**
 * Syncs purchases from the user_purchases database table into the client state.
 * Handles the Stripe webhook race condition by retrying if an expected pack is missing.
 * @param {string|null} expectedPackId - If returning from Stripe checkout, the pack_id to wait for.
 * @param {boolean} showNotification - Whether to show a success modal to the user.
 */
async function syncPurchasesFromCloud(expectedPackId = null, showNotification = false) {
    const user = state.gameState?.user;
    if (!user || !state.userAuthId || !state.auth0Client) return;

    const maxRetries = expectedPackId ? 4 : 1;
    const retryDelay = 2500; // ms between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const authToken = await getAuthToken();
            const response = await fetch('/api/getPurchases', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.purchases) && data.purchases.length > 0) {
                    const before = (user.purchases || []).length;
                    user.purchases = Array.from(new Set([...(user.purchases || []), ...data.purchases]));
                    const newCount = user.purchases.length - before;

                    // If we're waiting for a specific pack and it's now present, or we're not waiting for anything
                    if (!expectedPackId || user.purchases.includes(expectedPackId)) {
                        if (newCount > 0) {
                            saveGame();
                            if (showNotification) {
                                UI.showModal("Purchase Activated!", `${newCount} new pack(s) have been unlocked and synced to your account.`);
                            }
                        }
                        console.log(`Purchase sync complete (attempt ${attempt}): ${user.purchases.length} total packs.`);
                        return;
                    }
                }
            }
        } catch (err) {
            console.warn(`Purchase sync attempt ${attempt} failed:`, err);
        }

        // If we're waiting for a specific pack and haven't found it, wait and retry
        if (attempt < maxRetries && expectedPackId) {
            console.log(`Pack "${expectedPackId}" not found yet. Retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    // Final fallback: even if the expected pack wasn't found, save whatever we got
    if (expectedPackId && showNotification) {
        saveGame();
        UI.showModal("Purchase Processing", "Your payment was received! If your pack isn't active yet, use 'Restore Purchases' in the Store in a moment.");
    }
}

/**
 * Renders a celebratory confirmation modal when a player returns from a successful Stripe checkout.
 * @param {string} packId
 */
export async function showPurchaseSuccessModal(packId) {
    let pack = null;
    try {
        const storeMod = await import('../features/store/storeScreen.js');
        if (storeMod && Array.isArray(storeMod.STORE_PACKS)) {
            pack = storeMod.STORE_PACKS.find(p => p.id === packId);
        }
    } catch (e) {}

    const title = pack?.title || (packId ? packId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Expansion Pack');
    const icon = pack?.icon || 'fa-gem text-amber-400';
    const desc = pack?.desc || 'Your purchase was successful and your new features are now active on your account.';

    // Action button customization based on pack
    let actionBtnHtml = '';
    if (packId === 'instant_diplomas') {
        actionBtnHtml = `
            <button data-action="renderInstantDiplomaHub" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                <i class="fas fa-graduation-cap"></i> Open Instant Diploma Hub
            </button>
        `;
    } else if (packId === 'vip_supporter') {
        actionBtnHtml = `
            <button data-action="renderVipLoungeModal" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                <i class="fas fa-crown"></i> Open VIP Lounge
            </button>
        `;
    } else if (packId === 'god_mode') {
        actionBtnHtml = `
            <button data-action="openGodModeHubModal" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                <i class="fas fa-bolt"></i> Open God Mode Editor
            </button>
        `;
    } else if (packId === 'time_machine') {
        actionBtnHtml = `
            <button data-action="openSaveSlotManager" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                <i class="fas fa-hourglass-half"></i> Open Time Machine Slots
            </button>
        `;
    } else if (packId === 'mafia_syndicate' || packId === 'mafia_expansion') {
        actionBtnHtml = `
            <button data-action="renderCrimeDashboard" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                <i class="fas fa-user-ninja"></i> Open Underworld Hub
            </button>
        `;
    }

    const modalContent = `
        <div class="space-y-4 text-center py-2">
            <!-- Celebratory Top Badge -->
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-3xl text-white mx-auto shadow-xl shadow-emerald-900/30">
                <i class="fas fa-check-circle"></i>
            </div>

            <div>
                <div class="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <i class="fas fa-shield-alt"></i> Payment Confirmed
                </div>
                <h3 class="text-2xl font-black text-white tracking-wide">
                    ${title} Unlocked!
                </h3>
                <p class="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                    ${desc}
                </p>
            </div>

            <div class="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-xl text-left flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-white truncate">${title}</div>
                    <div class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <i class="fas fa-lock-open text-[9px]"></i> Permanently Active
                    </div>
                </div>
            </div>

            <div class="space-y-2 pt-1">
                ${actionBtnHtml}
                <button data-action="hideModal" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition">
                    Continue Playing
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "",
        content: modalContent,
        confirmText: null,
        cancelText: null
    });
}

// --- Updated Game Initializer ---
async function initGame() {
    console.log("Initializing Game Logic...");

    // 1. Check Auth0 Status
    const isAuthenticated = state.auth0Client ? await state.auth0Client.isAuthenticated() : false;

    if (isAuthenticated) {
        // Render Loading Screen while user details and cloud save are being fetched
        if (typeof UI !== 'undefined' && UI.renderLoadingScreen) {
            UI.renderLoadingScreen("Syncing Account...", "Fetching your cloud save data...");
        }

        // User is logged in! 
        const user = await state.auth0Client.getUser();
        console.log(`Welcome back, ${user.nickname} (${user.sub})`);
        
        // Save ID immediately so we can use it
        state.userAuthId = user.sub;
        state.userEmail = user.email;

        // Check for active guest save
        const guestSave = Utils.guestStorage.loadGame();
        const hasGuestSave = guestSave && guestSave.user && guestSave.user.lifeStatus !== "Deceased";

        // Check for Stripe purchase return parameters early
        const urlParams = new URLSearchParams(window.location.search);
        const purchaseSuccess = urlParams.get('purchase_success');
        const purchaseCancelled = urlParams.get('purchase_cancelled');
        const purchasedPackId = urlParams.get('pack_id');

        if (purchaseSuccess || purchaseCancelled) {
            window.history.replaceState({}, document.title, '/');
        }

        // Optimistically record purchased pack locally so entitlements are immediately available
        if (purchaseSuccess === 'true' && purchasedPackId) {
            let localP = [];
            try {
                const stored = localStorage.getItem('life_game_purchases');
                if (stored) localP = JSON.parse(stored);
            } catch (e) {}
            if (!localP.includes(purchasedPackId)) {
                localP.push(purchasedPackId);
                try { localStorage.setItem('life_game_purchases', JSON.stringify(localP)); } catch (e) {}
            }
        }

        // Try to load existing cloud save with retry
        let dbUser = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const authToken = await getAuthToken();
                if (authToken) {
                    const response = await fetch(`/api/load?auth0_id=${encodeURIComponent(user.sub)}`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.game_data && Object.keys(data.game_data).length > 0 && (data.game_data.user || data.game_data.stats)) {
                            dbUser = data;
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error checking cloud save (attempt ${attempt}):`, e);
            }
            if (!dbUser && attempt < 3) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // Fallback: If /api/load failed, check if user exists via /api/login in sync mode
        if (!dbUser) {
            try {
                const fallbackResp = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth0_id: user.sub,
                        email: user.email,
                        username: user.nickname || 'Player',
                        gender: 'male',
                        city: 'New York'
                    })
                });
                if (fallbackResp.ok) {
                    const fallbackData = await fallbackResp.json();
                    if (fallbackData && fallbackData.game_data && Object.keys(fallbackData.game_data).length > 0 && (fallbackData.game_data.user || fallbackData.game_data.stats)) {
                        dbUser = fallbackData;
                    }
                }
            } catch (e) {
                console.warn("Login fallback check skipped:", e);
            }
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

        // Apply purchased pack to active user state immediately if returning from Stripe
        if (purchaseSuccess === 'true' && purchasedPackId) {
            if (state.gameState?.user) {
                if (!Array.isArray(state.gameState.user.purchases)) state.gameState.user.purchases = [];
                if (!state.gameState.user.purchases.includes(purchasedPackId)) {
                    state.gameState.user.purchases.push(purchasedPackId);
                    await saveGame();
                }
            }
            console.log(`Returning from Stripe checkout for pack: ${purchasedPackId}`);
            showPurchaseSuccessModal(purchasedPackId);
            syncPurchasesFromCloud(purchasedPackId, false);
        } else if (purchaseCancelled === 'true') {
            UI.showModal("Checkout Cancelled", "Your payment session was cancelled. No charges were made.");
        } else if (state.gameState?.user) {
            // Normal login — silently sync purchases in background (no retry, no notification)
            syncPurchasesFromCloud(null, false);
        }

    } else {
        // Guest Mode - Check Multi-Save Slots Store first
        console.log("Guest mode detected.");
        
        let loadedState = null;
        let activeSlotId = 'slot_1';

        try {
            const rawSlots = localStorage.getItem('life_game_slots');
            if (rawSlots) {
                const slotsStore = JSON.parse(rawSlots);
                activeSlotId = slotsStore.activeSlotId || 'slot_1';
                if (slotsStore.slots && slotsStore.slots[activeSlotId] && slotsStore.slots[activeSlotId].data) {
                    loadedState = JSON.parse(JSON.stringify(slotsStore.slots[activeSlotId].data));
                    loadedState._slotId = activeSlotId;
                }
            }
        } catch (e) {}

        if (!loadedState) {
            loadedState = Utils.guestStorage.loadGame();
            if (loadedState) loadedState._slotId = activeSlotId;
        }
        
        if (loadedState) {
            // THE FIX: Intercept and destroy dead guest saves
            if (loadedState.user && loadedState.user.lifeStatus === "Deceased") {
                console.log("Guest character is dead. Wiping local save.");
                
                state.gameState = null;
                if (Utils.guestStorage.saveGame) {
                    Utils.guestStorage.saveGame(); 
                }
                
                renderLoginScreen();
            } else {
                console.log(`Loading active save slot (${loadedState._slotId}) from storage...`);
                state.gameState = loadedState;
                GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);
                if (typeof renderLifeDashboard === "function") {
                    renderLifeDashboard(state.gameState);
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
        if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
            Utils.guestStorage.clearSave();
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
  joinSpecialCareer,
  confirmJoinSpecialCareer,
  attemptMafiaCrime,
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
  logout,
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
  get chooseFuneralType() { return chooseFuneralType; },
  get cancelFuneralPlan() { return cancelFuneralPlan; },
  get confirmFuneralPlan() { return confirmFuneralPlan; },
  get donateBody() { return donateBody; },
  get lookTheOtherWay() { return lookTheOtherWay; },
  get goToFuneral() { return goToFuneral; },
  get skipFuneral() { return skipFuneral; },
  get respondNewTeacher() { return respondNewTeacher; },
  get processNextTeacherReplacement() { return processNextTeacherReplacement; },
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
  openSkillsModal,
  openLotteryModal,
  buyLotteryTicket,
  openMoveCountryModal,
  updateRelocateCityDropdown,
  renderPrisonDashboard,
  setPrisonTab,
  handleCellmateAction,
  handleYardWorkout,
  handleInmateInteract,
  handleSelectPrisonJob,
  handleBuyCanteen,
  handleStudyLaw,
  handleFileAppeal,
  handlePrisonVisit,
  handleSendPrisonLetter,
  handleConjugalVisit,
  handleParoleHearing,
  handlePrisonEscapeAction,
  openContrabandPhoneModal,
  submitContrabandPhoneAction,
  openDealerBuyModal,
  openDealerSellModal,
  handleSellContrabandAction,
  handleSolitaryActivity,
  openInmateDetailModal,
  openAttackPromptModal,
  executeInmateAttack,
  confirmMoveCountry,
  askPartnerToMove,
  confirmMoveAlone,
  openSettingsModal,
  triggerManualSave,
  promptResetGame,
  promptSignOut,
  handleSignOut,
  toggleSettingSFX,
  toggleSettingCompact,
  toggleSettingTheme,
  openPlayerOverviewModal,
  renderStoreScreen,
  filterStoreCategory,
  previewPackDetails,
  buyPack,
  restorePurchases,
  renderGodModeModal,
  maxGodModeStats,
  applyGodModeStats,
  renderGodModeAvatarModal,
  cycleGodModeTrait,
  randomizeGodModeAvatarTraits,
  saveGodModeAvatar,
  maxCreationGodStats,
  grantInstantHighSchool,
  grantInstantUniversityDegree,
  grantInstantGradDegree,
  renderInstantDiplomaHub,
  claimInstantUniversityMajor,
  renderVipLoungeModal,
  selectTheme,
  renderGraveyardModal,
  showAncestorEulogy,
  renderCrimeDashboard,
  openCrimeModal,
  commitCrimeAction,
  showArrestModal,
  openBribeModal,
  submitBribeAction,
  handleArrestChoice,
  showCourtArraignmentModal,
  selectLegalCounsel,
  openGodModeHubModal,
  openTimeMachineModal: renderTimeMachineModal,
  executeTimeRewind: rewindToAge,
  openSaveSlotManager: renderSaveSlotManagerModal,
  loadSaveSlot: loadSlot,
  branchSaveSlot: branchCurrentSave,
  startNewSlotLife: startNewLifeInNewSlot,
  deleteSaveSlot: deleteSlot,
  hideModal: () => UI.hideModal()
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
            try {
                const result = routeHandlers[action](...args);
                if (result && typeof result.catch === 'function') {
                    result.catch(err => console.error(`[Router] Error executing action "${action}":`, err));
                }
            } catch (err) {
                console.error(`[Router] Error executing action "${action}":`, err);
            }
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
            try {
                const result = routeHandlers[action](e.target.value);
                if (result && typeof result.catch === 'function') {
                    result.catch(err => console.error(`[Router] Error executing action "${action}":`, err));
                }
            } catch (err) {
                console.error(`[Router] Error executing action "${action}":`, err);
            }
        }
    }
});

if (!isTestEnv && typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => onload());
    } else {
        onload();
    }
}