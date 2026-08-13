import { login, configureAuth } from '../auth/auth.js';
import { startGuestMode, renderLoginScreen } from '../auth/loginScreen.js';
import { state } from './state.js';
import { GameLogic } from './gameLogic.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';

// --- Dynamic Module Lazy Loader ---
const isJest = typeof process !== 'undefined' && (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test');

const _staticMods = {};
if (isJest) {
    _staticMods.businessDashboard = await import('../features/business/businessDashboard.js');
    _staticMods.createBusinessScreen = await import('../features/business/createBusinessScreen.js');
    _staticMods.careerJobsScreen = await import('../features/career/careerJobsScreen.js');
    _staticMods.jobCareerManagerScreen = await import('../features/career/jobCareerManagerScreen.js');
    _staticMods.partTimeJobsScreen = await import('../features/career/partTimeJobsScreen.js');
    _staticMods.manageEducationScreen = await import('../features/education/manageEducationScreen.js');
    _staticMods.occupationScreen = await import('../features/career/occupationScreen.js');
    _staticMods.charCreationScreen = await import('../features/player/charCreationScreen.js');
    _staticMods.mainScreen = await import('../features/player/mainScreen.js');
    _staticMods.playerOverviewScreen = await import('../features/player/playerOverviewScreen.js');
    _staticMods.assetsScreen = await import('../features/assets/assetsScreen.js');
    _staticMods.goShoppingScreen = await import('../features/assets/goShoppingScreen.js');
    _staticMods.investmentsScreen = await import('../features/assets/investmentsScreen.js');
    _staticMods.relationshipScreen = await import('../features/relationships/relationshipScreen.js');
    _staticMods.funeralScreen = await import('../features/relationships/funeralScreen.js');
    _staticMods.romanceScreen = await import('../features/relationships/romanceScreen.js');
    _staticMods.moreScreen = await import('../features/more/moreScreen.js');
    _staticMods.crimeScreen = await import('../features/more/crimeScreen.js');
    _staticMods.casinoScreen = await import('../features/more/casinoScreen.js');
    _staticMods.settingsScreen = await import('../features/more/settingsScreen.js');
    _staticMods.storeScreen = await import('../features/store/storeScreen.js');
    _staticMods.godModeAvatarEditor = await import('../features/store/godModeAvatarEditor.js');
    _staticMods.instantDiploma = await import('../features/education/instantDiploma.js');
    _staticMods.vipLounge = await import('../features/store/vipLounge.js');
    _staticMods.graveyardScreen = await import('../features/player/graveyardScreen.js');
    _staticMods.prisonScreen = await import('../features/more/prisonScreen.js');
    _staticMods.timeMachine = await import('./timeMachine.js');
    _staticMods.saveSlotManager = await import('./saveSlotManager.js');
}

const _modCache = new Map();
const loadMod = (importFn, key) => {
    if (isJest && _staticMods[key]) {
        return Promise.resolve(_staticMods[key]);
    }
    if (!_modCache.has(importFn)) {
        _modCache.set(importFn, importFn());
    }
    return _modCache.get(importFn);
};
const lazy = (importFn, name, key) => async (...args) => {
    const mod = await loadMod(importFn, key);
    return mod[name](...args);
};

// --- Dynamic Feature Screen Proxies ---
const modBusiness = () => import('../features/business/businessDashboard.js');
export const processQuarter = lazy(modBusiness, 'processQuarter', 'businessDashboard');
export const enterBusinessMode = lazy(modBusiness, 'enterBusinessMode', 'businessDashboard');
export const hireEmployee = lazy(modBusiness, 'hireEmployee', 'businessDashboard');
export const layoffEmployee = lazy(modBusiness, 'layoffEmployee', 'businessDashboard');
export const sellBusiness = lazy(modBusiness, 'sellBusiness', 'businessDashboard');
export const purchaseUpgrade = lazy(modBusiness, 'purchaseUpgrade', 'businessDashboard');
export const setBusinessTab = lazy(modBusiness, 'setBusinessTab', 'businessDashboard');
export const selectSupplierDashboard = lazy(modBusiness, 'selectSupplierDashboard', 'businessDashboard');
export const upgradeHQTier = lazy(modBusiness, 'upgradeHQTier', 'businessDashboard');
export const upgradeMarketingChannel = lazy(modBusiness, 'upgradeMarketingChannel', 'businessDashboard');
export const adjustRoleCount = lazy(modBusiness, 'adjustRoleCount', 'businessDashboard');
export const acceptVCPitch = lazy(modBusiness, 'acceptVCPitch', 'businessDashboard');
export const chooseEventChoice = lazy(modBusiness, 'chooseEventChoice', 'businessDashboard');

const modCreateBusiness = () => import('../features/business/createBusinessScreen.js');
export const selectIndustry = lazy(modCreateBusiness, 'selectIndustry', 'createBusinessScreen');
export const selectSupplier = lazy(modCreateBusiness, 'selectSupplier', 'createBusinessScreen');
export const renderBusinessSetup = lazy(modCreateBusiness, 'renderBusinessSetup', 'createBusinessScreen');
export const initBusiness = lazy(modCreateBusiness, 'initBusiness', 'createBusinessScreen');

const modCareerJobs = () => import('../features/career/careerJobsScreen.js');
export const renderCareerMarket = lazy(modCareerJobs, 'renderCareerMarket', 'careerJobsScreen');
export const applyForJob = lazy(modCareerJobs, 'applyForJob', 'careerJobsScreen');
export const applyForCareerTrack = lazy(modCareerJobs, 'applyForCareerTrack', 'careerJobsScreen');
export const joinSpecialCareer = lazy(modCareerJobs, 'joinSpecialCareer', 'careerJobsScreen');
export const confirmJoinSpecialCareer = lazy(modCareerJobs, 'confirmJoinSpecialCareer', 'careerJobsScreen');
export const answerInterview = lazy(modCareerJobs, 'answerInterview', 'careerJobsScreen');
export const retryInterview = lazy(modCareerJobs, 'retryInterview', 'careerJobsScreen');

const modJobCareerManager = () => import('../features/career/jobCareerManagerScreen.js');
export const confirmQuitCareer = lazy(modJobCareerManager, 'confirmQuitCareer', 'jobCareerManagerScreen');
export const quitCareer = lazy(modJobCareerManager, 'quitCareer', 'jobCareerManagerScreen');
export const renderCareerManager = lazy(modJobCareerManager, 'renderCareerManager', 'jobCareerManagerScreen');
export const workHarderJob = lazy(modJobCareerManager, 'workHarderJob', 'jobCareerManagerScreen');
export const slackOffJob = lazy(modJobCareerManager, 'slackOffJob', 'jobCareerManagerScreen');
export const attemptMafiaCrime = lazy(modJobCareerManager, 'attemptMafiaCrime', 'jobCareerManagerScreen');

const modPartTimeJobs = () => import('../features/career/partTimeJobsScreen.js');
export const renderJobMarket = lazy(modPartTimeJobs, 'renderJobMarket', 'partTimeJobsScreen');

const modManageEducation = () => import('../features/education/manageEducationScreen.js');
export const renderEducation = lazy(modManageEducation, 'renderEducation', 'manageEducationScreen');
export const workHarder = lazy(modManageEducation, 'workHarder', 'manageEducationScreen');
export const skipSchool = lazy(modManageEducation, 'skipSchool', 'manageEducationScreen');
export const renderClassmates = lazy(modManageEducation, 'renderClassmates', 'manageEducationScreen');

const modOccupation = () => import('../features/career/occupationScreen.js');
export const attemptEnrollment = lazy(modOccupation, 'attemptEnrollment', 'occupationScreen');
export const openGradEnrollmentModal = lazy(modOccupation, 'openGradEnrollmentModal', 'occupationScreen');
export const attemptGradEnrollment = lazy(modOccupation, 'attemptGradEnrollment', 'occupationScreen');
export const renderGradSchoolMarket = lazy(modOccupation, 'renderGradSchoolMarket', 'occupationScreen');
export const openUniversityModal = lazy(modOccupation, 'openUniversityModal', 'occupationScreen');
export const renderActivities = lazy(modOccupation, 'renderActivities', 'occupationScreen');

const modCharCreation = () => import('../features/player/charCreationScreen.js');
export const selectGender = lazy(modCharCreation, 'selectGender', 'charCreationScreen');
export const submitCharacter = lazy(modCharCreation, 'submitCharacter', 'charCreationScreen');
export const renderCharCreation = lazy(modCharCreation, 'renderCharCreation', 'charCreationScreen');
export const cycleTrait = lazy(modCharCreation, 'cycleTrait', 'charCreationScreen');
export const randomizeSection = lazy(modCharCreation, 'randomizeSection', 'charCreationScreen');
export const randomizeAllTraits = lazy(modCharCreation, 'randomizeAllTraits', 'charCreationScreen');
export const updateCityDropdown = lazy(modCharCreation, 'updateCityDropdown', 'charCreationScreen');
export const maxCreationGodStats = lazy(modCharCreation, 'maxCreationGodStats', 'charCreationScreen');

const modMainScreen = () => import('../features/player/mainScreen.js');
export const ageUp = lazy(modMainScreen, 'ageUp', 'mainScreen');
export const continueAsChild = lazy(modMainScreen, 'continueAsChild', 'mainScreen');
export const renderLifeDashboard = lazy(modMainScreen, 'renderLifeDashboard', 'mainScreen');
export const addLog = lazy(modMainScreen, 'addLog', 'mainScreen');
export const renderDeathScreen = lazy(modMainScreen, 'renderDeathScreen', 'mainScreen');
export const showFullEulogy = lazy(modMainScreen, 'showFullEulogy', 'mainScreen');

const modPlayerOverview = () => import('../features/player/playerOverviewScreen.js');
export const openPlayerOverviewModal = lazy(modPlayerOverview, 'openPlayerOverviewModal', 'playerOverviewScreen');

const modAssets = () => import('../features/assets/assetsScreen.js');
export const renderAssets = lazy(modAssets, 'renderAssets', 'assetsScreen');
export const renderVehicleManager = lazy(modAssets, 'renderVehicleManager', 'assetsScreen');
export const repairVehicle = lazy(modAssets, 'repairVehicle', 'assetsScreen');
export const sellVehicle = lazy(modAssets, 'sellVehicle', 'assetsScreen');
export const renderPropertyManager = lazy(modAssets, 'renderPropertyManager', 'assetsScreen');
export const payOffMortgage = lazy(modAssets, 'payOffMortgage', 'assetsScreen');
export const openSellPropertyModal = lazy(modAssets, 'openSellPropertyModal', 'assetsScreen');
export const submitPropertyListing = lazy(modAssets, 'submitPropertyListing', 'assetsScreen');
export const acceptBuyerOffer = lazy(modAssets, 'acceptBuyerOffer', 'assetsScreen');
export const doPropertyMaintenance = lazy(modAssets, 'doPropertyMaintenance', 'assetsScreen');
export const doPropertyRenovation = lazy(modAssets, 'doPropertyRenovation', 'assetsScreen');
export const openTenantScreening = lazy(modAssets, 'openTenantScreening', 'assetsScreen');
export const acceptTenantLease = lazy(modAssets, 'acceptTenantLease', 'assetsScreen');
export const evictTenantAction = lazy(modAssets, 'evictTenantAction', 'assetsScreen');
export const demandTenantRentPayment = lazy(modAssets, 'demandTenantRentPayment', 'assetsScreen');
export const forgiveTenantRent = lazy(modAssets, 'forgiveTenantRent', 'assetsScreen');
export const evictTenantFromEvent = lazy(modAssets, 'evictTenantFromEvent', 'assetsScreen');
export const demandTenantRepairPayment = lazy(modAssets, 'demandTenantRepairPayment', 'assetsScreen');
export const forgiveTenantDamage = lazy(modAssets, 'forgiveTenantDamage', 'assetsScreen');
export const renewLeaseSameRate = lazy(modAssets, 'renewLeaseSameRate', 'assetsScreen');
export const renewLeaseWithIncrease = lazy(modAssets, 'renewLeaseWithIncrease', 'assetsScreen');
export const declineLeaseRenewal = lazy(modAssets, 'declineLeaseRenewal', 'assetsScreen');
export const renderJewelryManager = lazy(modAssets, 'renderJewelryManager', 'assetsScreen');
export const toggleWearJewelry = lazy(modAssets, 'toggleWearJewelry', 'assetsScreen');
export const toggleInsureJewelry = lazy(modAssets, 'toggleInsureJewelry', 'assetsScreen');
export const sellJewelry = lazy(modAssets, 'sellJewelry', 'assetsScreen');
export const openGiftJewelryModal = lazy(modAssets, 'openGiftJewelryModal', 'assetsScreen');
export const confirmGiftJewelry = lazy(modAssets, 'confirmGiftJewelry', 'assetsScreen');
export const setPrimaryVehicle = lazy(modAssets, 'setPrimaryVehicle', 'assetsScreen');
export const toggleInsureVehicle = lazy(modAssets, 'toggleInsureVehicle', 'assetsScreen');
export const takeJoyride = lazy(modAssets, 'takeJoyride', 'assetsScreen');
export const openGiftVehicleModal = lazy(modAssets, 'openGiftVehicleModal', 'assetsScreen');
export const confirmGiftVehicle = lazy(modAssets, 'confirmGiftVehicle', 'assetsScreen');

const modGoShopping = () => import('../features/assets/goShoppingScreen.js');
export const renderShoppingHub = lazy(modGoShopping, 'renderShoppingHub', 'goShoppingScreen');
export const renderVehicleDealer = lazy(modGoShopping, 'renderVehicleDealer', 'goShoppingScreen');
export const buyVehicle = lazy(modGoShopping, 'buyVehicle', 'goShoppingScreen');
export const buyVehicleCash = lazy(modGoShopping, 'buyVehicleCash', 'goShoppingScreen');
export const buyVehicleLoan = lazy(modGoShopping, 'buyVehicleLoan', 'goShoppingScreen');
export const renderRealEstateDealer = lazy(modGoShopping, 'renderRealEstateDealer', 'goShoppingScreen');
export const buyPropertyCash = lazy(modGoShopping, 'buyPropertyCash', 'goShoppingScreen');
export const buyPropertyMortgage = lazy(modGoShopping, 'buyPropertyMortgage', 'goShoppingScreen');
export const renderJewelryDealer = lazy(modGoShopping, 'renderJewelryDealer', 'goShoppingScreen');
export const buyJewelry = lazy(modGoShopping, 'buyJewelry', 'goShoppingScreen');

const modInvestments = () => import('../features/assets/investmentsScreen.js');
export const renderInvestmentsScreen = lazy(modInvestments, 'renderInvestmentsScreen', 'investmentsScreen');
export const switchInvestmentTab = lazy(modInvestments, 'switchInvestmentTab', 'investmentsScreen');
export const setStockFilter = lazy(modInvestments, 'setStockFilter', 'investmentsScreen');
export const openStockDetailsModal = lazy(modInvestments, 'openStockDetailsModal', 'investmentsScreen');
export const openBuyStockModal = lazy(modInvestments, 'openBuyStockModal', 'investmentsScreen');
export const confirmBuyStock = lazy(modInvestments, 'confirmBuyStock', 'investmentsScreen');
export const openSellStockModal = lazy(modInvestments, 'openSellStockModal', 'investmentsScreen');
export const confirmSellStock = lazy(modInvestments, 'confirmSellStock', 'investmentsScreen');
export const openDepositSavingsModal = lazy(modInvestments, 'openDepositSavingsModal', 'investmentsScreen');
export const confirmDepositSavings = lazy(modInvestments, 'confirmDepositSavings', 'investmentsScreen');
export const openWithdrawSavingsModal = lazy(modInvestments, 'openWithdrawSavingsModal', 'investmentsScreen');
export const confirmWithdrawSavings = lazy(modInvestments, 'confirmWithdrawSavings', 'investmentsScreen');

const modRelationships = () => import('../features/relationships/relationshipScreen.js');
export const renderRelationships = lazy(modRelationships, 'renderRelationships', 'relationshipScreen');
export const renderPersonInteraction = lazy(modRelationships, 'renderPersonInteraction', 'relationshipScreen');
export const openRelationshipConfirm = lazy(modRelationships, 'openRelationshipConfirm', 'relationshipScreen');
export const spendTimeWithAll = lazy(modRelationships, 'spendTimeWithAll', 'relationshipScreen');
export const goOutMeetSomeone = lazy(modRelationships, 'goOutMeetSomeone', 'relationshipScreen');
export const openMeetPeopleModal = lazy(modRelationships, 'openMeetPeopleModal', 'relationshipScreen');
export const setAttractionPreference = lazy(modRelationships, 'setAttractionPreference', 'relationshipScreen');
export const handleBlindDate = lazy(modRelationships, 'handleBlindDate', 'relationshipScreen');
export const handleDatingApp = lazy(modRelationships, 'handleDatingApp', 'relationshipScreen');
export const renderDatingAppModal = lazy(modRelationships, 'renderDatingAppModal', 'relationshipScreen');
export const selectDatingAppMatch = lazy(modRelationships, 'selectDatingAppMatch', 'relationshipScreen');
export const handleMeetFriend = lazy(modRelationships, 'handleMeetFriend', 'relationshipScreen');
export const handleNightOut = lazy(modRelationships, 'handleNightOut', 'relationshipScreen');
export const renderLuxeMatchModal = lazy(modRelationships, 'renderLuxeMatchModal', 'relationshipScreen');
export const selectLuxeAgePreset = lazy(modRelationships, 'selectLuxeAgePreset', 'relationshipScreen');
export const selectLuxeWealthTier = lazy(modRelationships, 'selectLuxeWealthTier', 'relationshipScreen');
export const confirmLuxeMatch = lazy(modRelationships, 'confirmLuxeMatch', 'relationshipScreen');
export const handleMakeAMove = lazy(modRelationships, 'handleMakeAMove', 'relationshipScreen');
export const confirmHookupChoice = lazy(modRelationships, 'confirmHookupChoice', 'relationshipScreen');
export const handleEndAffair = lazy(modRelationships, 'handleEndAffair', 'relationshipScreen');
export const handleCheatingConfrontationChoice = lazy(modRelationships, 'handleCheatingConfrontationChoice', 'relationshipScreen');
export const handleProposeAction = lazy(modRelationships, 'handleProposeAction', 'relationshipScreen');
export const openRingSelectionModal = lazy(modRelationships, 'openRingSelectionModal', 'relationshipScreen');
export const proposeWithRing = lazy(modRelationships, 'proposeWithRing', 'relationshipScreen');

const modFuneral = () => import('../features/relationships/funeralScreen.js');
export const chooseFuneralType = lazy(modFuneral, 'chooseFuneralType', 'funeralScreen');
export const cancelFuneralPlan = lazy(modFuneral, 'cancelFuneralPlan', 'funeralScreen');
export const confirmFuneralPlan = lazy(modFuneral, 'confirmFuneralPlan', 'funeralScreen');
export const donateBody = lazy(modFuneral, 'donateBody', 'funeralScreen');
export const lookTheOtherWay = lazy(modFuneral, 'lookTheOtherWay', 'funeralScreen');
export const goToFuneral = lazy(modFuneral, 'goToFuneral', 'funeralScreen');
export const skipFuneral = lazy(modFuneral, 'skipFuneral', 'funeralScreen');
export const respondNewTeacher = lazy(modFuneral, 'respondNewTeacher', 'funeralScreen');
export const processNextTeacherReplacement = lazy(modFuneral, 'processNextTeacherReplacement', 'funeralScreen');

const modRomance = () => import('../features/relationships/romanceScreen.js');
export const openWeddingPlanner = lazy(modRomance, 'openWeddingPlanner', 'romanceScreen');
export const confirmWeddingPlan = lazy(modRomance, 'confirmWeddingPlan', 'romanceScreen');
export const openNameChangeChoice = lazy(modRomance, 'openNameChangeChoice', 'romanceScreen');
export const chooseNameChange = lazy(modRomance, 'chooseNameChange', 'romanceScreen');

const modMore = () => import('../features/more/moreScreen.js');
export const renderMoreDashboard = lazy(modMore, 'renderMoreDashboard', 'moreScreen');
export const buyGymMembership = lazy(modMore, 'buyGymMembership', 'moreScreen');
export const cancelGymMembership = lazy(modMore, 'cancelGymMembership', 'moreScreen');
export const visitGymOneTime = lazy(modMore, 'visitGymOneTime', 'moreScreen');
export const startBetterDiet = lazy(modMore, 'startBetterDiet', 'moreScreen');
export const cancelBetterDiet = lazy(modMore, 'cancelBetterDiet', 'moreScreen');
export const visitDoctor = lazy(modMore, 'visitDoctor', 'moreScreen');
export const openBlackjackBetting = lazy(modMore, 'openBlackjackBetting', 'moreScreen');
export const startBlackjackGame = lazy(modMore, 'startBlackjackGame', 'moreScreen');
export const blackjackHit = lazy(modMore, 'blackjackHit', 'moreScreen');
export const blackjackStand = lazy(modMore, 'blackjackStand', 'moreScreen');
export const openTravelModal = lazy(modMore, 'openTravelModal', 'moreScreen');
export const bookTrip = lazy(modMore, 'bookTrip', 'moreScreen');
export const openDietSelectionModal = lazy(modMore, 'openDietSelectionModal', 'moreScreen');
export const selectDiet = lazy(modMore, 'selectDiet', 'moreScreen');
export const openLotteryModal = lazy(modMore, 'openLotteryModal', 'moreScreen');
export const buyLotteryTicket = lazy(modMore, 'buyLotteryTicket', 'moreScreen');
export const openMoveCountryModal = lazy(modMore, 'openMoveCountryModal', 'moreScreen');
export const updateRelocateCityDropdown = lazy(modMore, 'updateRelocateCityDropdown', 'moreScreen');
export const confirmMoveCountry = lazy(modMore, 'confirmMoveCountry', 'moreScreen');
export const askPartnerToMove = lazy(modMore, 'askPartnerToMove', 'moreScreen');
export const confirmMoveAlone = lazy(modMore, 'confirmMoveAlone', 'moreScreen');
export const openSkillsModal = lazy(modMore, 'openSkillsModal', 'moreScreen');

const modCrime = () => import('../features/more/crimeScreen.js');
export const renderCrimeDashboard = lazy(modCrime, 'renderCrimeDashboard', 'crimeScreen');
export const openCrimeModal = lazy(modCrime, 'openCrimeModal', 'crimeScreen');
export const commitCrimeAction = lazy(modCrime, 'commitCrimeAction', 'crimeScreen');
export const showArrestModal = lazy(modCrime, 'showArrestModal', 'crimeScreen');
export const openBribeModal = lazy(modCrime, 'openBribeModal', 'crimeScreen');
export const submitBribeAction = lazy(modCrime, 'submitBribeAction', 'crimeScreen');
export const handleArrestChoice = lazy(modCrime, 'handleArrestChoice', 'crimeScreen');
export const showCourtArraignmentModal = lazy(modCrime, 'showCourtArraignmentModal', 'crimeScreen');
export const selectLegalCounsel = lazy(modCrime, 'selectLegalCounsel', 'crimeScreen');

const modCasino = () => import('../features/more/casinoScreen.js');
export const renderCasinoHub = lazy(modCasino, 'renderCasinoHub', 'casinoScreen');
export const openRouletteModal = lazy(modCasino, 'openRouletteModal', 'casinoScreen');
export const confirmRouletteBet = lazy(modCasino, 'confirmRouletteBet', 'casinoScreen');
export const confirmRouletteSingleNumberBet = lazy(modCasino, 'confirmRouletteSingleNumberBet', 'casinoScreen');
export const openSlotsModal = lazy(modCasino, 'openSlotsModal', 'casinoScreen');
export const confirmSlotsSpin = lazy(modCasino, 'confirmSlotsSpin', 'casinoScreen');

const modSettings = () => import('../features/more/settingsScreen.js');
export const openSettingsModal = lazy(modSettings, 'openSettingsModal', 'settingsScreen');
export const triggerManualSave = lazy(modSettings, 'triggerManualSave', 'settingsScreen');
export const promptResetGame = lazy(modSettings, 'promptResetGame', 'settingsScreen');
export const toggleSettingSFX = lazy(modSettings, 'toggleSettingSFX', 'settingsScreen');
export const toggleSettingCompact = lazy(modSettings, 'toggleSettingCompact', 'settingsScreen');
export const toggleSettingTheme = lazy(modSettings, 'toggleSettingTheme', 'settingsScreen');
export const applyTheme = lazy(modSettings, 'applyTheme', 'settingsScreen');

const modStore = () => import('../features/store/storeScreen.js');
export const renderStoreScreen = lazy(modStore, 'renderStoreScreen', 'storeScreen');
export const filterStoreCategory = lazy(modStore, 'filterStoreCategory', 'storeScreen');
export const previewPackDetails = lazy(modStore, 'previewPackDetails', 'storeScreen');
export const buyPack = lazy(modStore, 'buyPack', 'storeScreen');
export const restorePurchases = lazy(modStore, 'restorePurchases', 'storeScreen');
export const renderGodModeModal = lazy(modStore, 'renderGodModeModal', 'storeScreen');
export const maxGodModeStats = lazy(modStore, 'maxGodModeStats', 'storeScreen');
export const applyGodModeStats = lazy(modStore, 'applyGodModeStats', 'storeScreen');
export const openGodModeHubModal = lazy(modStore, 'openGodModeHubModal', 'storeScreen');

const modGodModeAvatar = () => import('../features/store/godModeAvatarEditor.js');
export const renderGodModeAvatarModal = lazy(modGodModeAvatar, 'renderGodModeAvatarModal', 'godModeAvatarEditor');
export const cycleGodModeTrait = lazy(modGodModeAvatar, 'cycleGodModeTrait', 'godModeAvatarEditor');
export const randomizeGodModeAvatarTraits = lazy(modGodModeAvatar, 'randomizeGodModeAvatarTraits', 'godModeAvatarEditor');
export const saveGodModeAvatar = lazy(modGodModeAvatar, 'saveGodModeAvatar', 'godModeAvatarEditor');

const modInstantDiploma = () => import('../features/education/instantDiploma.js');
export const grantInstantHighSchool = lazy(modInstantDiploma, 'grantInstantHighSchool', 'instantDiploma');
export const grantInstantUniversityDegree = lazy(modInstantDiploma, 'grantInstantUniversityDegree', 'instantDiploma');
export const grantInstantGradDegree = lazy(modInstantDiploma, 'grantInstantGradDegree', 'instantDiploma');
export const renderInstantDiplomaHub = lazy(modInstantDiploma, 'renderInstantDiplomaHub', 'instantDiploma');
export const claimInstantUniversityMajor = lazy(modInstantDiploma, 'claimInstantUniversityMajor', 'instantDiploma');

const modVipLounge = () => import('../features/store/vipLounge.js');
export const renderVipLoungeModal = lazy(modVipLounge, 'renderVipLoungeModal', 'vipLounge');
export const selectTheme = lazy(modVipLounge, 'selectTheme', 'vipLounge');
export const isVipSupporter = lazy(modVipLounge, 'isVipSupporter', 'vipLounge');

const modGraveyard = () => import('../features/player/graveyardScreen.js');
export const renderGraveyardModal = lazy(modGraveyard, 'renderGraveyardModal', 'graveyardScreen');
export const showAncestorEulogy = lazy(modGraveyard, 'showAncestorEulogy', 'graveyardScreen');

const modPrison = () => import('../features/more/prisonScreen.js');
export const renderPrisonDashboard = lazy(modPrison, 'renderPrisonDashboard', 'prisonScreen');
export const setPrisonTab = lazy(modPrison, 'setPrisonTab', 'prisonScreen');
export const handleCellmateAction = lazy(modPrison, 'handleCellmateAction', 'prisonScreen');
export const handleYardWorkout = lazy(modPrison, 'handleYardWorkout', 'prisonScreen');
export const handleInmateInteract = lazy(modPrison, 'handleInmateInteract', 'prisonScreen');
export const handleSelectPrisonJob = lazy(modPrison, 'handleSelectPrisonJob', 'prisonScreen');
export const handleBuyCanteen = lazy(modPrison, 'handleBuyCanteen', 'prisonScreen');
export const handleStudyLaw = lazy(modPrison, 'handleStudyLaw', 'prisonScreen');
export const handleFileAppeal = lazy(modPrison, 'handleFileAppeal', 'prisonScreen');
export const handlePrisonVisit = lazy(modPrison, 'handlePrisonVisit', 'prisonScreen');
export const handleSendPrisonLetter = lazy(modPrison, 'handleSendPrisonLetter', 'prisonScreen');
export const handleConjugalVisit = lazy(modPrison, 'handleConjugalVisit', 'prisonScreen');
export const handleParoleHearing = lazy(modPrison, 'handleParoleHearing', 'prisonScreen');
export const handlePrisonEscapeAction = lazy(modPrison, 'handlePrisonEscapeAction', 'prisonScreen');
export const openContrabandPhoneModal = lazy(modPrison, 'openContrabandPhoneModal', 'prisonScreen');
export const submitContrabandPhoneAction = lazy(modPrison, 'submitContrabandPhoneAction', 'prisonScreen');
export const openDealerBuyModal = lazy(modPrison, 'openDealerBuyModal', 'prisonScreen');
export const openDealerSellModal = lazy(modPrison, 'openDealerSellModal', 'prisonScreen');
export const handleSellContrabandAction = lazy(modPrison, 'handleSellContrabandAction', 'prisonScreen');
export const handleSolitaryActivity = lazy(modPrison, 'handleSolitaryActivity', 'prisonScreen');
export const openInmateDetailModal = lazy(modPrison, 'openInmateDetailModal', 'prisonScreen');
export const openAttackPromptModal = lazy(modPrison, 'openAttackPromptModal', 'prisonScreen');
export const executeInmateAttack = lazy(modPrison, 'executeInmateAttack', 'prisonScreen');

const modTimeMachine = () => import('./timeMachine.js');
export const renderTimeMachineModal = lazy(modTimeMachine, 'renderTimeMachineModal', 'timeMachine');
export const rewindToAge = lazy(modTimeMachine, 'rewindToAge', 'timeMachine');

const modSaveSlotManager = () => import('./saveSlotManager.js');
export const renderSaveSlotManagerModal = lazy(modSaveSlotManager, 'renderSaveSlotManagerModal', 'saveSlotManager');
export const loadSlot = lazy(modSaveSlotManager, 'loadSlot', 'saveSlotManager');
export const branchCurrentSave = lazy(modSaveSlotManager, 'branchCurrentSave', 'saveSlotManager');
export const deleteSlot = lazy(modSaveSlotManager, 'deleteSlot', 'saveSlotManager');
export const startNewLifeInNewSlot = lazy(modSaveSlotManager, 'startNewLifeInNewSlot', 'saveSlotManager');
export const saveToSlot = lazy(modSaveSlotManager, 'saveToSlot', 'saveSlotManager');

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

        export const SPECIAL_CAREER_TRACKS = [
            {
                key: 'mafia_syndicate', label: 'La Cosa Nostra', icon: 'fa-user-ninja',
                reqDegree: false, reqGrad: null, reqMajors: null, premiumPack: 'mafia_syndicate',
                levels: [
                    { title: 'Muscle',      salary:   80000, minYears: 2 },
                    { title: 'Made Man',    salary:  150000, minYears: 3 },
                    { title: 'Street Boss', salary:  500000, minYears: 4 },
                    { title: 'Underboss',   salary: 1500000, minYears: 5 },
                    { title: 'The Don',     salary: 4000000, minYears: null }
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

export async function saveGame() {
    
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
        if (state.auth0Client) {
            authToken = await state.auth0Client.getTokenSilently();
        }
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

    // Continue to game initialization regardless of Auth0 errors
    await initGame();
};

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

        // Try to load existing cloud save first
        let dbUser = null;
        try {
            let authToken = '';
            try { authToken = await state.auth0Client.getTokenSilently(); } catch (e) {}
            const response = await fetch(`/api/load?auth0_id=${user.sub}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
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
  deleteSaveSlot: deleteSlot
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