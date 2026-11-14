import { lazy } from './moduleLoader.js';

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
export const openProSportsEntryModal = lazy('careerJobs', 'openProSportsEntryModal');
export const selectProSportTab = lazy('careerJobs', 'selectProSportTab');
export const enterProSportsDraft = lazy('careerJobs', 'enterProSportsDraft');
export const enterProSportsTryout = lazy('careerJobs', 'enterProSportsTryout');
export const answerInterview = lazy('careerJobs', 'answerInterview');
export const retryInterview = lazy('careerJobs', 'retryInterview');

export const confirmQuitCareer = lazy('jobCareerManager', 'confirmQuitCareer');
export const quitCareer = lazy('jobCareerManager', 'quitCareer');
export const confirmRetire = lazy('jobCareerManager', 'confirmRetire');
export const retire = lazy('jobCareerManager', 'retire');
export const renderCareerManager = lazy('jobCareerManager', 'renderCareerManager');
export const renderAthleteManager = lazy('jobCareerManager', 'renderAthleteManager');
export const attemptAthleteAction = lazy('jobCareerManager', 'attemptAthleteAction');
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
export const setCharTab = lazy('charCreation', 'setCharTab');
export const pickTraitOption = lazy('charCreation', 'pickTraitOption');
export const randomizePlayerName = lazy('charCreation', 'randomizePlayerName');
export const cyclePreviewAge = lazy('charCreation', 'cyclePreviewAge');
export const updateLocationEconBadge = lazy('charCreation', 'updateLocationEconBadge');

// Main Screen
export const ageUp = lazy('mainScreen', 'ageUp');
export const continueAsChild = lazy('mainScreen', 'continueAsChild');
export const renderLifeDashboard = lazy('mainScreen', 'renderLifeDashboard');
export const addLog = lazy('mainScreen', 'addLog');
export const renderDeathScreen = lazy('mainScreen', 'renderDeathScreen');
export const showFullEulogy = lazy('mainScreen', 'showFullEulogy');

// Player Overview
export const openPlayerOverviewModal = lazy('playerOverview', 'openPlayerOverviewModal');
export const openCashflowModal = lazy('playerOverview', 'openCashflowModal');

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
export const openHirePropertyManagerModal = lazy('assets', 'openHirePropertyManagerModal');
export const confirmHirePropertyManager = lazy('assets', 'confirmHirePropertyManager');
export const openFirePropertyManagerConfirm = lazy('assets', 'openFirePropertyManagerConfirm');
export const viewLastManagerReport = lazy('assets', 'viewLastManagerReport');
export const approveManagerRepairAction = lazy('assets', 'approveManagerRepairAction');
export const declineManagerRepairAction = lazy('assets', 'declineManagerRepairAction');
export const approveAllManagerRepairsAction = lazy('assets', 'approveAllManagerRepairsAction');
export const dismissManagerReportAction = lazy('assets', 'dismissManagerReportAction');
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
export const setInvestmentInputPreset = lazy('investments', 'setInvestmentInputPreset');

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

// Life Events
export const selectLifeEventChoice = lazy('lifeEvents', 'selectLifeEventChoice');
export const finishLifeEvent = lazy('lifeEvents', 'finishLifeEvent');
export const processNextLifeEvent = lazy('lifeEvents', 'processNextLifeEvent');

// Romance
export const openWeddingPlanner = lazy('romance', 'openWeddingPlanner');
export const confirmWeddingPlan = lazy('romance', 'confirmWeddingPlan');
export const openNameChangeChoice = lazy('romance', 'openNameChangeChoice');
export const chooseNameChange = lazy('romance', 'chooseNameChange');

// More Dashboard & Lifestyle
export const renderMoreDashboard = lazy('more', 'renderMoreDashboard');
export const openGymModal = lazy('more', 'openGymModal');
export const buyGymMembership = lazy('more', 'buyGymMembership');
export const cancelGymMembership = lazy('more', 'cancelGymMembership');
export const visitGymOneTime = lazy('more', 'visitGymOneTime');
export const startBetterDiet = lazy('more', 'startBetterDiet');
export const cancelBetterDiet = lazy('more', 'cancelBetterDiet');
export const visitDoctor = lazy('more', 'visitDoctor');
export const treatDisease = lazy('more', 'treatDisease');
export const generalCheckup = lazy('more', 'generalCheckup');
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
export const renderSkillsHub = lazy('skills', 'renderSkillsHub');
export const setSkillsCategory = lazy('skills', 'setSkillsCategory');
export const openSkillDetail = lazy('skills', 'openSkillDetail');
export const backToSkillsHub = lazy('skills', 'backToSkillsHub');
export const openSkillsModal = lazy('skills', 'openSkillsModal');
export const toggleSkillExpand = lazy('skills', 'toggleSkillExpand');
export const collapseSkills = lazy('skills', 'collapseSkills');
export const closeSkillsModal = lazy('more', 'closeSkillsModal');
export const practiceSkill = lazy('skills', 'practiceSkill');
export const enrollSkillCourse = lazy('skills', 'enrollSkillCourse');
export const askParentInstrumentPermission = lazy('skills', 'askParentInstrumentPermission');
export const takeInstrumentLesson = lazy('skills', 'takeInstrumentLesson');

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
export const openFeedbackModal = lazy('settings', 'openFeedbackModal');
export const selectFeedbackCategory = lazy('settings', 'selectFeedbackCategory');
export const submitFeedback = lazy('settings', 'submitFeedback');

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
export const updateGodModeAvatarTrait = lazy('godModeAvatar', 'updateGodModeAvatarTrait');
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
