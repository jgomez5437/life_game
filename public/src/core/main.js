import { login, logout, configureAuth, getAuthToken } from '../auth/auth.js';
import { startGuestMode, renderLoginScreen } from '../auth/loginScreen.js';
import { state, setVerifiedPurchases } from './state.js';
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';
import { deepClone, sanitizeGameState, migrateState, hydrateSlotsStoreFromCloud, buildCloudSavePayload } from './saveSlotManager.js';
import { resolveAdState, onVipPurchased, resetAdState, isAdFree, getAdState } from './adManager.js';

// --- Dynamic Module Loader & Background Preloader ---
import { lazy, loadModule, preloadForContext, attachIntentPreloaders } from './moduleLoader.js';

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
export const launchIPO = lazy('businessDashboard', 'launchIPO');
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
export const confirmRetire = lazy('jobCareerManager', 'confirmRetire');
export const retire = lazy('jobCareerManager', 'retire');
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
export const rejectBuyerOffer = lazy('assets', 'rejectBuyerOffer');
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
export const openTradeInModal = lazy('goShopping', 'openTradeInModal');
export const executeTradeInPurchase = lazy('goShopping', 'executeTradeInPurchase');
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
export const finishCourtSentencing = lazy('crime', 'finishCourtSentencing');
export const returnFromCrimeOrArrest = lazy('crime', 'returnFromCrimeOrArrest');


// Casino
export const renderCasinoHub = lazy('casino', 'renderCasinoHub');
export const openBlackjackBetting = lazy('casino', 'openBlackjackBetting');
export const startBlackjackGame = lazy('casino', 'startBlackjackGame');
export const blackjackHit = lazy('casino', 'blackjackHit');
export const blackjackStand = lazy('casino', 'blackjackStand');
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
export const toggleSettingBottomNav = lazy('settings', 'toggleSettingBottomNav');
export const toggleSettingTheme = lazy('settings', 'toggleSettingTheme');
export const applyTheme = lazy('settings', 'applyTheme');

// Achievements
export const openAchievementsModal = lazy('achievements', 'openAchievementsModal');
export const filterAchievementsCategory = lazy('achievements', 'filterAchievementsCategory');

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
let _saveDebounceTimer = null;
let _isSaveInFlight = false;
let _hasPendingSave = false;

//updates game info
export async function updateGameInfo(dbUser, options = {}) {
    const forceCloud = options.forceCloud || false;
    console.log("Updating game state from DB...");
    let rawData = dbUser.game_data || {};
    if (typeof rawData === 'string') {
        try { rawData = JSON.parse(rawData); } catch (e) {}
    }

    // Authoritative entitlement hydration from server
    const serverPurchases = rawData.user?.purchases || rawData.purchases;
    if (Array.isArray(serverPurchases)) {
        setVerifiedPurchases(serverPurchases);
        resolveAdState(serverPurchases);
    } else {
        resolveAdState([]);
    }

    // Hydrate all slots into localStorage store from cloud payload
    const store = hydrateSlotsStoreFromCloud(rawData, forceCloud);

    // Extract active slot data
    const activeSlotId = store.activeSlotId || rawData.activeSlotId || rawData._slotId || 'slot_1';
    const activeSlotData = store.slots[activeSlotId]?.data;
    const fallbackData = (rawData.user || rawData.stats || rawData.username || rawData.name) ? rawData : null;
    const data = activeSlotData || fallbackData || store.slots[Object.keys(store.slots)[0]]?.data;

    state.userAuthId = dbUser.auth0_id;
    state.userEmail = dbUser.email;

    if (data) {
        state.gameState = migrateState(data);
        if (state.gameState) {
            state.gameState._slotId = activeSlotId;
        }
        if (state.gameState?.user) {
            GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
        }
        // Clean up stale guest save on successful authenticated session
        if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
            Utils.guestStorage.clearSave();
        }
        try {
            localStorage.removeItem('life_game_save');
        } catch (e) {}
        // If local progress was newer than cloud data, sync to cloud immediately (unless forceCloud was specified)
        if (!forceCloud && store?._needsCloudSync && state.gameState.user) {
            console.log("Local progress is newer than cloud database. Synchronizing to cloud...");
            saveGame(true);
        }
    }

    // Render
    if (state.gameState?.user?.lifeStatus === "Deceased") {
        console.log("Dead character detected. Locking to death screen.");
        const cause = state.gameState.user.deathCause || "natural causes";
        if (typeof renderDeathScreen === "function") {
            await renderDeathScreen(state.gameState.user, cause);
        }
    } else if (state.gameState?.user && typeof renderLifeDashboard === "function") {
        await renderLifeDashboard(state.gameState); 
    } else if (typeof renderCharCreation === "function") {
        console.log("No valid character state found in save. Directing to Character Creation.");
        await renderCharCreation();
    } else {
        console.error("❌ renderLifeDashboard function not found!");
    }

    console.log("✅ Game Loaded & Ready");
}

//Loads and renders the game
export const loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username || userData.name);
    state.gameState = migrateState({ user: userData });
    if (state.gameState?.user) {
        GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
    }
    //.addLog function contains the renderLifeDashboard call
    addLog(`Born in ${state.gameState.user.city}. Welcome to the world!`, 'good');
};

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);

/**
 * Internal executor that performs the cloud network request with inflight queueing.
 */
async function _executeCloudSave() {
    if (!state.userAuthId || !state.gameState || !state.gameState.user) {
        return false;
    }

    if (_isSaveInFlight) {
        _hasPendingSave = true;
        return true;
    }

    _isSaveInFlight = true;
    _hasPendingSave = false;

    const activeSlotId = state.gameState._slotId || 'slot_1';
    const cloudGameData = buildCloudSavePayload(state.gameState);

    const payload = {
        auth0_id: state.userAuthId,
        email: state.userEmail,
        slotId: activeSlotId,
        game_data: cloudGameData
    };

    let authToken = '';
    try {
        authToken = await getAuthToken();
    } catch (e) {
        console.warn('Could not get auth token for cloud save:', e);
    }

    let success = false;
    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            keepalive: true,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Save Complete!");
            success = true;
        } else {
            console.error("❌ Save Failed:", await response.text());
        }
    } catch (e) {
        console.error("Network Error:", e);
    } finally {
        _isSaveInFlight = false;
        if (_hasPendingSave) {
            _hasPendingSave = false;
            return await _executeCloudSave();
        }
    }

    return success;
}

/**
 * Saves active game state locally to active slot immediately, and synchronizes with cloud.
 * Supports debounced non-blocking calls (default during gameplay/ageUp) and immediate execution.
 * @param {boolean} [immediate=false] - If true, bypasses debounce and synchronizes to cloud immediately.
 * @returns {Promise<boolean>}
 */
export async function saveGame(immediate = false) {
    // 1. Immediate local persistence to slots store (0ms latency guarantee)
    if (state.gameState && state.gameState.user) {
        saveToSlot();
    }

    // In test environment, skip cloud network unless fetch is explicitly mocked
    if (isTestEnv && !(typeof globalThis.fetch === 'function' && (globalThis.fetch._isMockFunction || globalThis.fetch.mock !== undefined))) {
        return true;
    }

    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!state.userAuthId) {
        console.log("⚠️ Guest mode. Saved locally.");
        return true;
    }
    if (!state.gameState || !state.gameState.user) {
        console.error("⚠️ Game state not ready. Save skipped.");
        return false;
    }

    if (!immediate) {
        // Trailing-edge debounce: reset timer and schedule cloud sync in 400ms
        if (_saveDebounceTimer) {
            clearTimeout(_saveDebounceTimer);
        }
        return new Promise(resolve => {
            _saveDebounceTimer = setTimeout(async () => {
                _saveDebounceTimer = null;
                const result = await _executeCloudSave();
                resolve(result);
            }, 400);
        });
    }

    // Immediate execution: cancel pending debounce timer and sync now
    if (_saveDebounceTimer) {
        clearTimeout(_saveDebounceTimer);
        _saveDebounceTimer = null;
    }
    return await _executeCloudSave();
}

/**
 * Flushes any pending debounced save immediately (e.g. window unload, visibility change).
 */
export async function flushPendingSave() {
    if (_saveDebounceTimer) {
        clearTimeout(_saveDebounceTimer);
        _saveDebounceTimer = null;
    }
    if (state.gameState && state.gameState.user) {
        saveToSlot();
        if (state.userAuthId) {
            return await _executeCloudSave();
        }
    }
    return true;
}

// Attach to window so it is globally accessible
if (typeof window !== 'undefined') {
    window.saveGame = saveGame;
    window.flushPendingSave = flushPendingSave;
    window.renderLifeDashboard = renderLifeDashboard;
    window.renderCharCreation = renderCharCreation;
    window.addEventListener('beforeunload', () => flushPendingSave());
    window.addEventListener('pagehide', () => flushPendingSave());
}

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
    if (!state.userAuthId || !state.auth0Client) return;

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
                const verifiedPurchases = Array.isArray(data.purchases) ? data.purchases : [];
                const before = (state.verifiedPurchases || []).length;
                setVerifiedPurchases(verifiedPurchases);
                resolveAdState(verifiedPurchases);
                const newCount = verifiedPurchases.length - before;

                // If we're waiting for a specific pack and it's now present, or we're not waiting for anything
                if (!expectedPackId || verifiedPurchases.includes(expectedPackId)) {
                    if (newCount > 0 && showNotification) {
                        UI.showModal("Purchase Activated!", `${newCount} new pack(s) have been unlocked and synced to your account.`);
                    }
                    console.log(`Purchase sync complete (attempt ${attempt}): ${verifiedPurchases.length} total packs.`);
                    return;
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

    // Final fallback: even if the expected pack wasn't found
    if (expectedPackId && showNotification) {
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

    if (packId === 'vip_supporter') {
        onVipPurchased();
    }

    const title = pack?.title || (packId ? packId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Expansion Pack');
    const icon = pack?.icon || 'fa-gem text-amber-400';
    const desc = packId === 'vip_supporter' 
        ? '⭐ VIP Supporter — Ad-Free Active. Your 100% ad-free experience is now active.'
        : (pack?.desc || 'Your purchase was successful and your new features are now active on your account.');

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

/**
 * Loads cloud save state for an authenticated user with explicit status distinction.
 * Distinguishes between:
 * - 'success': Cloud load succeeded and returned valid character save
 * - 'no_save': Account exists or 404, but has no active save file
 * - 'auth_error': 401/403 session expired or invalid
 * - 'rate_limited': 429 rate limit reached
 * - 'network_error': 5xx or fetch network drop
 * 
 * @param {Object} user - Auth0 user object
 * @returns {Promise<{ status: string, dbUser?: Object, error?: string, statusCode?: number }>}
 */
export async function fetchCloudSave(user) {
    if (!user || !user.sub) {
        return { status: 'auth_error', statusCode: 401, error: 'User profile missing' };
    }

    const sub = encodeURIComponent(user.sub);
    let authToken = await getAuthToken(false);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            if (!authToken) {
                authToken = await getAuthToken(true);
            }
            if (!authToken) {
                return { status: 'auth_error', statusCode: 401, error: 'Authentication token unavailable' };
            }

            const response = await fetch(`/api/load?auth0_id=${sub}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            // Handle 200 OK
            if (response.ok) {
                const data = await response.json();
                let parsedGameData = data?.game_data;
                if (typeof parsedGameData === 'string') {
                    try { parsedGameData = JSON.parse(parsedGameData); } catch (e) {}
                }
                if (parsedGameData && typeof parsedGameData === 'object' && Object.keys(parsedGameData).length > 0) {
                    const hasChar = parsedGameData.user || parsedGameData.stats || parsedGameData.name || parsedGameData.username ||
                        (parsedGameData.slots && typeof parsedGameData.slots === 'object' && Object.values(parsedGameData.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                    if (hasChar) {
                        return { status: 'success', dbUser: { ...data, game_data: parsedGameData } };
                    }
                }
                // Account exists in DB but game_data has no active character
                return { status: 'no_save', dbUser: data };
            }

            // Handle 404 Not Found (New player) -> Check /api/login in sync mode
            if (response.status === 404) {
                try {
                    const fallbackResp = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            email: user.email,
                            username: user.nickname || 'Player',
                            gender: 'male',
                            city: 'New York'
                        })
                    });
                    if (fallbackResp.ok) {
                        const fallbackData = await fallbackResp.json();
                        let parsedFallback = fallbackData?.game_data;
                        if (typeof parsedFallback === 'string') {
                            try { parsedFallback = JSON.parse(parsedFallback); } catch (e) {}
                        }
                        if (parsedFallback && typeof parsedFallback === 'object' && Object.keys(parsedFallback).length > 0) {
                            const hasChar = parsedFallback.user || parsedFallback.stats || parsedFallback.name || parsedFallback.username ||
                                (parsedFallback.slots && typeof parsedFallback.slots === 'object' && Object.values(parsedFallback.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                            if (hasChar) {
                                return { status: 'success', dbUser: { ...fallbackData, game_data: parsedFallback } };
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Login fallback initialization skipped:", e);
                }
                return { status: 'no_save' };
            }

            // Handle 401/403 Unauthorized -> Force silent refresh and retry once
            if (response.status === 401 || response.status === 403) {
                console.warn(`[CloudSave] 401/403 received from /api/load (attempt ${attempts}). Force-refreshing token...`);
                authToken = await getAuthToken(true);
                if (!authToken) {
                    return { status: 'auth_error', statusCode: response.status, error: 'Session expired. Please sign in again.' };
                }
                // Retry request once with refreshed token
                const retryRes = await fetch(`/api/load?auth0_id=${sub}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (retryRes.ok) {
                    const data = await retryRes.json();
                    let parsedGameData = data?.game_data;
                    if (typeof parsedGameData === 'string') {
                        try { parsedGameData = JSON.parse(parsedGameData); } catch (e) {}
                    }
                    if (parsedGameData && typeof parsedGameData === 'object' && Object.keys(parsedGameData).length > 0) {
                        const hasChar = parsedGameData.user || parsedGameData.stats || parsedGameData.name || parsedGameData.username ||
                            (parsedGameData.slots && typeof parsedGameData.slots === 'object' && Object.values(parsedGameData.slots).some(s => s && (s.data?.user || s.data?.name || s.data?.stats)));
                        if (hasChar) {
                            return { status: 'success', dbUser: { ...data, game_data: parsedGameData } };
                        }
                    }
                    return { status: 'no_save', dbUser: data };
                }
                if (retryRes.status === 401 || retryRes.status === 403) {
                    return { status: 'auth_error', statusCode: retryRes.status, error: 'Authentication session expired. Please sign in again.' };
                }
                if (retryRes.status === 429) {
                    return { status: 'rate_limited', statusCode: 429, error: 'Too many requests. Please wait a moment.' };
                }
                return { status: 'network_error', statusCode: retryRes.status, error: 'Server temporarily unavailable.' };
            }

            // Handle 429 Rate Limit
            if (response.status === 429) {
                console.warn(`[CloudSave] 429 Rate limited on attempt ${attempts}.`);
                if (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                return { status: 'rate_limited', statusCode: 429, error: 'Rate limit exceeded. Please wait a moment and retry.' };
            }

            // Handle 5xx Server Errors
            if (response.status >= 500) {
                console.warn(`[CloudSave] 5xx Server error (${response.status}) on attempt ${attempts}.`);
                if (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 600 * attempts));
                    continue;
                }
                return { status: 'network_error', statusCode: response.status, error: 'Server error encountered while retrieving save data.' };
            }

        } catch (fetchErr) {
            console.error(`[CloudSave] Network error checking cloud save (attempt ${attempts}):`, fetchErr);
            if (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 600 * attempts));
                continue;
            }
            return { status: 'network_error', error: fetchErr.message || 'Network connection failed' };
        }
    }

    return { status: 'network_error', error: 'Failed to connect to cloud service after multiple attempts.' };
}

/**
 * Renders a recoverable error modal when cloud save loading fails for an authenticated player.
 * Prevents accidental Character Creation routing that could cause permanent cloud save loss.
 */
export function showCloudLoadRecoveryModal({ title, message, errorType = 'network', onRetry, onLogin }) {
    if (typeof UI !== 'undefined' && typeof UI.showCustomModal === 'function') {
        const iconClass = errorType === 'auth' ? 'fa-user-lock text-amber-400' : 'fa-wifi text-red-400';
        const bgIconClass = errorType === 'auth' ? 'bg-amber-950/60 border-amber-500/40' : 'bg-red-950/60 border-red-500/40';

        UI.showCustomModal({
            title: title || (errorType === 'auth' ? "Session Expired" : "Unable to Load Cloud Save"),
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${bgIconClass} border flex items-center justify-center text-lg shrink-0">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">${Utils.escapeHtml(title || "Cloud Save Sync")}</div>
                            <div class="text-xs text-slate-400 font-medium">Your account data is safe</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        ${Utils.escapeHtml(message || "We encountered an issue retrieving your cloud save data. To protect your characters from being overwritten, please retry or sign in again.")}
                    </p>
                </div>
            `,
            confirmText: "Retry Connection",
            cancelText: "Sign In Again",
            onConfirm: () => {
                if (typeof onRetry === 'function') onRetry();
            },
            onCancel: () => {
                if (typeof onLogin === 'function') onLogin();
            }
        });
    }
}

// --- Updated Game Initializer ---
export async function initGame() {
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
        const checkoutSessionId = urlParams.get('session_id');
        const purchasedPackId = urlParams.get('pack_id');
        let verifiedPackId = null;

        if (purchaseSuccess || purchaseCancelled || checkoutSessionId || purchasedPackId) {
            window.history.replaceState({}, document.title, '/');
        }

        // Verify Stripe purchase server-side if session_id is present
        if (checkoutSessionId) {
            try {
                const authToken = await getAuthToken();
                const headers = { 'Content-Type': 'application/json' };
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const verifyRes = await fetch('/api/verify-checkout-session', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ sessionId: checkoutSessionId })
                });

                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    if (verifyData.verified && verifyData.packId) {
                        verifiedPackId = verifyData.packId;
                        let localP = [];
                        try {
                            const stored = localStorage.getItem('life_game_purchases');
                            if (stored) localP = JSON.parse(stored);
                        } catch (e) {}
                        if (!localP.includes(verifiedPackId)) {
                            localP.push(verifiedPackId);
                            try { localStorage.setItem('life_game_purchases', JSON.stringify(localP)); } catch (e) {}
                        }
                    }
                }
            } catch (vErr) {
                console.error("Stripe session verification failed:", vErr);
            }
        }

        // Fallback: If returned with purchase_success and pack_id (e.g. sandbox/direct return)
        if (!verifiedPackId && purchaseSuccess === 'true' && purchasedPackId) {
            verifiedPackId = purchasedPackId;
            let localP = [];
            try {
                const stored = localStorage.getItem('life_game_purchases');
                if (stored) localP = JSON.parse(stored);
            } catch (e) {}
            if (!localP.includes(verifiedPackId)) {
                localP.push(verifiedPackId);
                try { localStorage.setItem('life_game_purchases', JSON.stringify(localP)); } catch (e) {}
            }
        }

        // Fetch cloud save state with explicit error categorization
        const cloudResult = await fetchCloudSave(user);
        const dbUser = (cloudResult.status === 'success') ? cloudResult.dbUser : null;

        // SCENARIO 1: Both Guest Save AND Cloud Save exist -> CONFLICT RESOLUTION MODAL
        if (hasGuestSave && dbUser) {
            console.log("Conflict detected: Active guest character AND existing cloud save found.");
            
            const cloudUser = dbUser.game_data.user || dbUser.game_data;
            const cloudName = Utils.escapeHtml(cloudUser.username || cloudUser.name || "Account Character");
            const cloudAge = dbUser.game_data.stats?.age || cloudUser.age || 0;
            
            const guestName = Utils.escapeHtml(guestSave.user.username || guestSave.user.name || "Guest Character");
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
                    state.gameState = migrateState(guestSave);
                    if (state.gameState?.user) {
                        GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                    }
                    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                        Utils.guestStorage.clearSave();
                    }
                    try {
                        localStorage.removeItem('life_game_save');
                    } catch (e) {}
                    await saveGame(true);
                    renderLifeDashboard(state.gameState);
                    UI.showModal("Character Saved!", `Your guest character (${guestName}) has been saved to your account.`);
                },
                "Keep Cloud Character",
                async () => {
                    console.log("User chose Account Character. Loading Cloud save...");
                    // 1. Completely purge ALL local guest storage data
                    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                        Utils.guestStorage.clearSave();
                    }
                    try {
                        localStorage.removeItem('life_game_save');
                        localStorage.removeItem('life_game_slots');
                    } catch (e) {}
                    UI.hideModal();
                    // 2. Load cloud save with forceCloud = true so discarded local guest slots never override cloud save
                    await updateGameInfo(dbUser, { forceCloud: true });
                    UI.showModal("Cloud Save Loaded", `Welcome back! Loaded your account character (${cloudName}).`);
                }
            );
            return;
        }

        // SCENARIO 2: Guest Save exists, and Cloud Save is confirmed absent -> Auto Migration
        if (hasGuestSave && cloudResult.status === 'no_save') {
            console.log("Migrating active guest character to logged-in cloud account...");
            state.gameState = migrateState(guestSave);
            if (state.gameState?.user) {
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
            }
            
            // Clean up guest storage keys before saving to cloud
            if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
                Utils.guestStorage.clearSave();
            }
            try {
                localStorage.removeItem('life_game_save');
            } catch (e) {}

            await saveGame(true);

            if (typeof renderLifeDashboard === "function") {
                await renderLifeDashboard(state.gameState);
                UI.showModal("Character Saved!", `Welcome ${Utils.escapeHtml(user.nickname || 'Player')}! Your character has been saved to your account.`);
            }
            return;
        }

        // SCENARIO 3: Cloud Save cleanly loaded -> Load Cloud Save into UI
        if (cloudResult.status === 'success' && dbUser) {
            await updateGameInfo(dbUser);
        } else if (cloudResult.status === 'no_save') {
            // SCENARIO 4: Legitimate clean account with no cloud save -> Check local slot recovery or route to Character Creation
            let localRecovered = null;
            let recoveredSlotId = 'slot_1';
            try {
                const store = getSlotsStore();
                const activeId = store.activeSlotId || 'slot_1';
                const activeSlot = store.slots[activeId] || Object.values(store.slots)[0];
                if (activeSlot?.data?.user) {
                    localRecovered = migrateState(activeSlot.data);
                    recoveredSlotId = activeId;
                    if (localRecovered) localRecovered._slotId = activeId;
                }
            } catch (e) {}

            // Also check legacy single save key 'life_game_save'
            if (!localRecovered) {
                try {
                    const legacy = localStorage.getItem('life_game_save');
                    if (legacy) {
                        const parsed = JSON.parse(legacy);
                        if (parsed && (parsed.user || parsed.name || parsed.stats)) {
                            const migrated = migrateState(parsed);
                            if (migrated && migrated.user) {
                                localRecovered = migrated;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (localRecovered && localRecovered.user) {
                console.log(`Recovered active character (${localRecovered.user.username}) from local slot (${recoveredSlotId}). Syncing to cloud...`);
                state.gameState = localRecovered;
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                saveGame(true);
                if (state.gameState.user.lifeStatus === "Deceased") {
                    console.log("Dead character recovered from local slot. Locking to death screen.");
                    const cause = state.gameState.user.deathCause || "natural causes";
                    if (typeof renderDeathScreen === "function") {
                        await renderDeathScreen(state.gameState.user, cause);
                    }
                } else if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
                }
            } else {
                console.log("No save file found on new account. Starting Character Creation.");
                await renderCharCreation();
            }
        } else {
            // SCENARIO 5: Cloud load FAILED (auth_error, rate_limited, network_error)
            console.warn(`[InitGame] Cloud load failed with status: ${cloudResult.status} (${cloudResult.error}). Checking local recovery...`);

            // Try local recovery from slots store, active guest save, or legacy save
            let localRecovered = null;
            let recoveredSlotId = 'slot_1';
            try {
                const store = getSlotsStore();
                const activeId = store.activeSlotId || 'slot_1';
                const activeSlot = store.slots[activeId] || (store.slots && Object.values(store.slots)[0]);
                if (activeSlot?.data?.user) {
                    localRecovered = migrateState(activeSlot.data);
                    recoveredSlotId = activeId;
                    if (localRecovered) localRecovered._slotId = activeId;
                }
            } catch (e) {}

            if (!localRecovered && hasGuestSave) {
                localRecovered = migrateState(guestSave);
            }

            if (!localRecovered) {
                try {
                    const legacy = localStorage.getItem('life_game_save');
                    if (legacy) {
                        const parsed = JSON.parse(legacy);
                        if (parsed && (parsed.user || parsed.name || parsed.stats)) {
                            const migrated = migrateState(parsed);
                            if (migrated && migrated.user) {
                                localRecovered = migrated;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (localRecovered && localRecovered.user) {
                console.log(`Playing from local cached slot (${recoveredSlotId}) due to cloud load failure.`);
                state.gameState = localRecovered;
                GameLogic.backfillRelationshipGender(state.gameState.user.relationships);
                if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
                }
                if (cloudResult.status === 'auth_error') {
                    UI.showModal("Session Notice", "Your session has expired. You are playing from local save cache. Please log in again to sync progress to cloud.");
                } else {
                    UI.showModal("Offline Notice", "Could not connect to cloud sync service. Loaded character from local device storage.");
                }
            } else {
                // Cloud failed AND local recovery failed: NEVER boot to Character Creation!
                const isAuth = cloudResult.status === 'auth_error';
                const title = isAuth ? "Session Expired" : "Unable to Load Cloud Save";
                const message = isAuth
                    ? "Your login session could not be verified to fetch your cloud save. Please sign in again or retry to continue your character."
                    : (cloudResult.status === 'rate_limited'
                        ? "Too many requests to the cloud service. Please wait a moment and click Retry."
                        : "A network error occurred while retrieving your cloud save. Please check your connection and retry.");

                showCloudLoadRecoveryModal({
                    title,
                    message,
                    errorType: isAuth ? 'auth' : (cloudResult.status === 'rate_limited' ? 'rate_limit' : 'network'),
                    onRetry: () => initGame(),
                    onLogin: () => login()
                });
            }
        }

        // Apply verified purchased pack to active user state immediately if verified
        if (verifiedPackId) {
            if (state.gameState?.user) {
                if (!Array.isArray(state.gameState.user.purchases)) state.gameState.user.purchases = [];
                if (!state.gameState.user.purchases.includes(verifiedPackId)) {
                    state.gameState.user.purchases.push(verifiedPackId);
                    await saveGame(true);
                }
            }
            console.log(`Verified Stripe checkout completed for pack: ${verifiedPackId}`);
            showPurchaseSuccessModal(verifiedPackId);
            syncPurchasesFromCloud(verifiedPackId, false);
        } else if (purchaseCancelled === 'true') {
            UI.showModal("Checkout Cancelled", "Your payment session was cancelled. No charges were made.");
        } else if (state.gameState?.user) {
            // Normal login — silently sync purchases in background (no retry, no notification)
            syncPurchasesFromCloud(null, false);
        }

    } else {
        // Guest Mode - Resolve ads for guest and check Multi-Save Slots Store first
        console.log("Guest mode detected.");
        resolveAdState([]);
        
        let loadedState = null;
        let activeSlotId = 'slot_1';

        try {
            const rawSlots = localStorage.getItem('life_game_slots');
            if (rawSlots) {
                const slotsStore = JSON.parse(rawSlots);
                activeSlotId = slotsStore.activeSlotId || 'slot_1';
                if (slotsStore.slots && slotsStore.slots[activeSlotId] && slotsStore.slots[activeSlotId].data) {
                    loadedState = migrateState(slotsStore.slots[activeSlotId].data);
                    if (loadedState) loadedState._slotId = activeSlotId;
                }
            }
        } catch (e) {}

        if (!loadedState) {
            const rawGuest = Utils.guestStorage.loadGame();
            if (rawGuest) {
                loadedState = migrateState(rawGuest);
                if (loadedState) loadedState._slotId = activeSlotId;
            }
        }
        
        if (loadedState && loadedState.user) {
            state.gameState = loadedState;
            GameLogic.backfillRelationshipGender(state.gameState.user?.relationships);

            if (state.gameState.user.lifeStatus === "Deceased") {
                console.log("Guest character is deceased. Locking to death screen.");
                const cause = state.gameState.user.deathCause || "natural causes";
                if (typeof renderDeathScreen === "function") {
                    await renderDeathScreen(state.gameState.user, cause);
                }
            } else {
                console.log(`Loading active save slot (${loadedState._slotId}) from storage...`);
                if (typeof renderLifeDashboard === "function") {
                    await renderLifeDashboard(state.gameState);
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
    if (typeof UI !== 'undefined' && typeof UI.closeAllModals === 'function') {
        UI.closeAllModals();
    }
    UI.resetHeader();

    UI.renderScreen(`
        <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-circle-notch fa-spin text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-2xl font-bold text-white mb-2">Obliterating the Past...</h1>
            <p class="text-slate-400">Preparing your next life.</p>
        </div>
    `);

    // 1. Destroy local state & wipe all local save keys
    state.gameState = null;
    try {
        localStorage.removeItem('life_game_slots');
        localStorage.removeItem('life_game_save');
    } catch (e) {}
    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
        Utils.guestStorage.clearSave();
    }

    // 2. Handle Guest Reset
    if (!state.userAuthId) {
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
            let authToken = '';
            try {
                authToken = await getAuthToken();
            } catch (e) {}

            await fetch('/api/saveGame', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
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
  launchIPO,
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
  confirmRetire,
  retire,
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
  openTradeInModal,
  executeTradeInPurchase,
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
  openAchievementsModal,
  filterAchievementsCategory,
  triggerManualSave,
  promptResetGame,
  promptSignOut,
  handleSignOut,
  toggleSettingSFX,
  toggleSettingCompact,
  toggleSettingBottomNav,
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
  finishCourtSentencing,
  returnFromCrimeOrArrest,
  openGodModeHubModal,
  openTimeMachineModal: renderTimeMachineModal,
  executeTimeRewind: rewindToAge,
  openSaveSlotManager: renderSaveSlotManagerModal,
  loadSaveSlot: loadSlot,
  branchSaveSlot: branchCurrentSave,
  startNewSlotLife: startNewLifeInNewSlot,
  deleteSaveSlot: deleteSlot,
  hideModal: () => UI.hideModal(),
  closeAllModals: () => UI.closeAllModals()
};

const DEATH_ACTION_WHITELIST = new Set([
    'continueAsChild',
    'resetGame',
    'openTimeMachineModal',
    'executeTimeRewind',
    'showFullEulogy',
    'hideModal',
    'closeAllModals'
]);

const FUNERAL_ACTION_WHITELIST = new Set([
    'chooseFuneralType',
    'cancelFuneralPlan',
    'confirmFuneralPlan',
    'donateBody',
    'lookTheOtherWay',
    'goToFuneral',
    'skipFuneral',
    'respondNewTeacher',
    'processNextTeacherReplacement',
    'hideModal',
    'closeAllModals'
]);

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        if (actionElement.disabled || actionElement.hasAttribute('disabled') || actionElement.getAttribute('aria-disabled') === 'true' || actionElement.classList.contains('disabled')) {
            return;
        }

        const action = actionElement.dataset.action;

        // 1. Universal Modal Lock: If a modal is open, block any clicks originating outside the modal
        if (typeof UI !== 'undefined' && typeof UI.isModalOpen === 'function' && UI.isModalOpen()) {
            const isInsideModal = !!actionElement.closest('#modal-overlay');
            if (!isInsideModal) {
                // Drop click to prevent background screen switching
                return;
            }
        }

        // 2. Deceased Character Lock: If deceased, restrict actions to death screen whitelist only
        if (state.gameState?.user?.lifeStatus === 'Deceased') {
            if (!DEATH_ACTION_WHITELIST.has(action)) {
                console.warn(`[Navigation Lock] Blocked action "${action}" for deceased character. Locking to death screen.`);
                if (typeof renderDeathScreen === 'function') {
                    renderDeathScreen(state.gameState.user, state.gameState.user.deathCause || 'natural causes');
                }
                return;
            }
        }

        // 3. Pending Funerals & Teacher Replacements Lock: Require choice before switching screens
        const hasPendingFunerals = state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0;
        const hasPendingTeachers = state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0;
        if (hasPendingFunerals || hasPendingTeachers) {
            if (!FUNERAL_ACTION_WHITELIST.has(action)) {
                console.warn(`[Navigation Lock] Blocked action "${action}" while funeral/teacher prompt is pending.`);
                loadModule('funeral').then(m => {
                    if (hasPendingFunerals && m && typeof m.processNextFuneral === 'function') {
                        m.processNextFuneral();
                    } else if (hasPendingTeachers && m && typeof m.processNextTeacherReplacement === 'function') {
                        m.processNextTeacherReplacement();
                    }
                });
                return;
            }
        }

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
        // Universal Modal Lock check for input changes
        if (typeof UI !== 'undefined' && typeof UI.isModalOpen === 'function' && UI.isModalOpen()) {
            const isInsideModal = !!actionElement.closest('#modal-overlay');
            if (!isInsideModal) {
                return;
            }
        }

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