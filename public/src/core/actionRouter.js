import { login, logout } from '../auth/auth.js';
import { startGuestMode } from '../auth/loginScreen.js';
import { state } from './state.js';
import { UI } from '../ui/ui.js';
import { loadModule } from './moduleLoader.js';
import { resetGame } from './cloudSync.js';
import {
    processQuarter, enterBusinessMode, hireEmployee, layoffEmployee, sellBusiness,
    purchaseUpgrade, setBusinessTab, selectSupplierDashboard, upgradeHQTier, upgradeMarketingChannel,
    adjustRoleCount, acceptVCPitch, launchIPO, chooseEventChoice, selectIndustry,
    selectSupplier, renderBusinessSetup, initBusiness, renderCareerMarket, applyForJob,
    applyForCareerTrack, joinSpecialCareer, confirmJoinSpecialCareer, openProSportsEntryModal, selectProSportTab,
    enterProSportsDraft, enterProSportsTryout, answerInterview, retryInterview, confirmQuitCareer,
    quitCareer, confirmRetire, retire, renderCareerManager, renderAthleteManager,
    attemptAthleteAction, workHarderJob, slackOffJob, attemptMafiaCrime, renderJobMarket,
    renderEducation, workHarder, skipSchool, renderClassmates, attemptEnrollment,
    openGradEnrollmentModal, attemptGradEnrollment, renderGradSchoolMarket, openUniversityModal, renderActivities,
    selectGender, submitCharacter, cycleTrait, randomizeSection, randomizeAllTraits,
    updateCityDropdown, maxCreationGodStats, setCharTab, pickTraitOption, randomizePlayerName,
    cyclePreviewAge, updateLocationEconBadge, ageUp, continueAsChild, renderLifeDashboard,
    renderDeathScreen, showFullEulogy, openPlayerOverviewModal, openCashflowModal, renderAssets,
    renderVehicleManager, repairVehicle, sellVehicle, renderPropertyManager, payOffMortgage,
    openSellPropertyModal, submitPropertyListing, acceptBuyerOffer, doPropertyMaintenance, doPropertyRenovation,
    openTenantScreening, acceptTenantLease, evictTenantAction, demandTenantRentPayment, forgiveTenantRent,
    evictTenantFromEvent, demandTenantRepairPayment, forgiveTenantDamage, renewLeaseSameRate, renewLeaseWithIncrease,
    declineLeaseRenewal, openHirePropertyManagerModal, confirmHirePropertyManager, openFirePropertyManagerConfirm, viewLastManagerReport,
    approveManagerRepairAction, declineManagerRepairAction, approveAllManagerRepairsAction, dismissManagerReportAction, renderJewelryManager,
    toggleWearJewelry, toggleInsureJewelry, sellJewelry, openGiftJewelryModal, confirmGiftJewelry,
    setPrimaryVehicle, toggleInsureVehicle, takeJoyride, openGiftVehicleModal, confirmGiftVehicle,
    renderShoppingHub, renderVehicleDealer, buyVehicle, buyVehicleCash, buyVehicleLoan,
    openTradeInModal, executeTradeInPurchase, renderRealEstateDealer, buyPropertyCash, buyPropertyMortgage,
    renderJewelryDealer, buyJewelry, renderInvestmentsScreen, switchInvestmentTab, setStockFilter,
    openStockDetailsModal, openBuyStockModal, confirmBuyStock, openSellStockModal, confirmSellStock,
    openDepositSavingsModal, confirmDepositSavings, openWithdrawSavingsModal, confirmWithdrawSavings, renderRelationships,
    renderPersonInteraction, openRelationshipConfirm, spendTimeWithAll, goOutMeetSomeone, openMeetPeopleModal,
    setAttractionPreference, handleBlindDate, handleDatingApp, renderDatingAppModal, selectDatingAppMatch,
    handleMeetFriend, handleNightOut, renderLuxeMatchModal, selectLuxeAgePreset, selectLuxeWealthTier,
    confirmLuxeMatch, handleMakeAMove, confirmHookupChoice, handleEndAffair, handleCheatingConfrontationChoice,
    handleProposeAction, openRingSelectionModal, proposeWithRing, chooseFuneralType, cancelFuneralPlan,
    confirmFuneralPlan, donateBody, lookTheOtherWay, goToFuneral, skipFuneral,
    respondNewTeacher, processNextTeacherReplacement, selectLifeEventChoice, finishLifeEvent, processNextLifeEvent,
    openWeddingPlanner, confirmWeddingPlan, openNameChangeChoice, chooseNameChange, renderMoreDashboard,
    buyGymMembership, cancelGymMembership, visitGymOneTime, startBetterDiet, cancelBetterDiet,
    visitDoctor, treatDisease, generalCheckup, openTravelModal, bookTrip,
    openDietSelectionModal, selectDiet, openLotteryModal, buyLotteryTicket, openMoveCountryModal,
    updateRelocateCityDropdown, confirmMoveCountry, askPartnerToMove, confirmMoveAlone, renderSkillsHub,
    setSkillsCategory, openSkillDetail, backToSkillsHub, openSkillsModal, toggleSkillExpand,
    collapseSkills, closeSkillsModal, practiceSkill, enrollSkillCourse, askParentInstrumentPermission,
    takeInstrumentLesson, renderCrimeDashboard, openCrimeModal, commitCrimeAction, showArrestModal,
    openBribeModal, submitBribeAction, handleArrestChoice, showCourtArraignmentModal, selectLegalCounsel,
    finishCourtSentencing, returnFromCrimeOrArrest, renderCasinoHub, openBlackjackBetting, startBlackjackGame,
    blackjackHit, blackjackStand, openRouletteModal, confirmRouletteBet, confirmRouletteSingleNumberBet,
    openSlotsModal, confirmSlotsSpin, openSettingsModal, triggerManualSave, promptResetGame,
    promptSignOut, handleSignOut, toggleSettingSFX, toggleSettingCompact, toggleSettingBottomNav,
    toggleSettingTheme, openFeedbackModal, selectFeedbackCategory, submitFeedback, openAchievementsModal,
    filterAchievementsCategory, renderStoreScreen, filterStoreCategory, previewPackDetails, buyPack,
    restorePurchases, renderGodModeModal, maxGodModeStats, applyGodModeStats, openGodModeHubModal,
    renderGodModeAvatarModal, updateGodModeAvatarTrait, cycleGodModeTrait, randomizeGodModeAvatarTraits, saveGodModeAvatar,
    grantInstantHighSchool, grantInstantUniversityDegree, grantInstantGradDegree, renderInstantDiplomaHub, claimInstantUniversityMajor,
    renderVipLoungeModal, selectTheme, renderGraveyardModal, showAncestorEulogy, renderPrisonDashboard,
    setPrisonTab, handleCellmateAction, handleYardWorkout, handleInmateInteract, handleSelectPrisonJob,
    handleBuyCanteen, handleStudyLaw, handleFileAppeal, handlePrisonVisit, handleSendPrisonLetter,
    handleConjugalVisit, handleParoleHearing, handlePrisonEscapeAction, openContrabandPhoneModal, submitContrabandPhoneAction,
    openDealerBuyModal, openDealerSellModal, handleSellContrabandAction, handleSolitaryActivity, openInmateDetailModal,
    openAttackPromptModal, executeInmateAttack, renderTimeMachineModal, rewindToAge, renderSaveSlotManagerModal,
    loadSlot, branchCurrentSave, deleteSlot, startNewLifeInNewSlot
} from './lazyActions.js';

const closeModal = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-overlay').classList.remove('flex');
};

const showComingSoon = () => {
    UI.showModal('Coming Soon', 'This section is under construction.');
};

export const routeHandlers = {
  resetGame,
  cycleTrait,
  randomizeSection,
  randomizeAllTraits,
  updateCityDropdown,
  maxCreationGodStats,
  setCharTab,
  pickTraitOption,
  randomizePlayerName,
  cyclePreviewAge,
  updateLocationEconBadge,
  applyForJob,
  applyForCareerTrack,
  joinSpecialCareer,
  confirmJoinSpecialCareer,
  openProSportsEntryModal,
  selectProSportTab,
  enterProSportsDraft,
  enterProSportsTryout,
  renderAthleteManager,
  attemptAthleteAction,
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
  openHirePropertyManagerModal,
  confirmHirePropertyManager,
  openFirePropertyManagerConfirm,
  viewLastManagerReport,
  approveManagerRepairAction,
  declineManagerRepairAction,
  approveAllManagerRepairsAction,
  dismissManagerReportAction,
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
  get selectLifeEventChoice() { return selectLifeEventChoice; },
  get finishLifeEvent() { return finishLifeEvent; },
  get processNextLifeEvent() { return processNextLifeEvent; },
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
  treatDisease,
  generalCheckup,
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
  renderSkillsHub,
  setSkillsCategory,
  openSkillDetail,
  backToSkillsHub,
  openSkillsModal,
  toggleSkillExpand,
  collapseSkills,
  closeSkillsModal,
  practiceSkill,
  enrollSkillCourse,
  askParentInstrumentPermission,
  takeInstrumentLesson,
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
  openFeedbackModal,
  selectFeedbackCategory,
  submitFeedback,
  openPlayerOverviewModal,
  openCashflowModal,
  renderStoreScreen,
  filterStoreCategory,
  previewPackDetails,
  buyPack,
  restorePurchases,
  renderGodModeModal,
  maxGodModeStats,
  applyGodModeStats,
  renderGodModeAvatarModal,
  updateGodModeAvatarTrait,
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

export const DEATH_ACTION_WHITELIST = new Set([
    'continueAsChild',
    'resetGame',
    'openTimeMachineModal',
    'executeTimeRewind',
    'showFullEulogy',
    'hideModal',
    'closeAllModals'
]);

export const FUNERAL_ACTION_WHITELIST = new Set([
    'chooseFuneralType',
    'cancelFuneralPlan',
    'confirmFuneralPlan',
    'donateBody',
    'lookTheOtherWay',
    'goToFuneral',
    'skipFuneral',
    'respondNewTeacher',
    'processNextTeacherReplacement',
    'selectLifeEventChoice',
    'finishLifeEvent',
    'processNextLifeEvent',
    // Property manager annual report actions
    'dismissManagerReportAction',
    'approveManagerRepairAction',
    'declineManagerRepairAction',
    'approveAllManagerRepairsAction',
    // Tenant event popups (lease renewal, damage, overdue rent)
    'renewLeaseSameRate',
    'renewLeaseWithIncrease',
    'declineLeaseRenewal',
    'demandTenantRepairPayment',
    'forgiveTenantDamage',
    'demandTenantRentPayment',
    'forgiveTenantRent',
    'evictTenantFromEvent',
    'hideModal',
    'closeAllModals'
]);

export function parseActionArgs(argsStr) {
    if (argsStr === undefined || argsStr === null || argsStr.trim() === '') {
        return [];
    }
    return argsStr.split(',').map(s => {
        let t = s.trim();
        if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1);
        else if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);

        if (t === 'true') return true;
        if (t === 'false') return false;
        if (t === 'null') return null;
        if (t === 'undefined') return undefined;

        return isNaN(t) || t === '' ? t : Number(t);
    });
}

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        if (actionElement.tagName === 'SELECT') {
            return;
        }
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

        // 3. Pending Funerals, Teachers & Life Events Lock: Require choice before switching screens
        const hasPendingFunerals = state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0;
        const hasPendingTeachers = state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0;
        const hasPendingLifeEvents = state.gameState?.pendingEvents && state.gameState.pendingEvents.length > 0;
        if (hasPendingFunerals || hasPendingTeachers || hasPendingLifeEvents) {
            if (!FUNERAL_ACTION_WHITELIST.has(action)) {
                console.warn(`[Navigation Lock] Blocked action "${action}" while prompt is pending.`);
                if (hasPendingFunerals || hasPendingTeachers) {
                    loadModule('funeral').then(m => {
                        if (hasPendingFunerals && m && typeof m.processNextFuneral === 'function') {
                            m.processNextFuneral();
                        } else if (hasPendingTeachers && m && typeof m.processNextTeacherReplacement === 'function') {
                            m.processNextTeacherReplacement();
                        }
                    });
                } else if (hasPendingLifeEvents) {
                    loadModule('lifeEvents').then(m => {
                        if (m && typeof m.processNextLifeEvent === 'function') {
                            m.processNextLifeEvent();
                        }
                    });
                }
                return;
            }
        }

        const args = parseActionArgs(actionElement.dataset.args);
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
        const args = parseActionArgs(actionElement.dataset.args);
        if (routeHandlers[action]) {
            try {
                const callArgs = args.length > 0 ? [...args, e.target.value] : [e.target.value];
                const result = routeHandlers[action](...callArgs);
                if (result && typeof result.catch === 'function') {
                    result.catch(err => console.error(`[Router] Error executing action "${action}":`, err));
                }
            } catch (err) {
                console.error(`[Router] Error executing action "${action}":`, err);
            }
        }
    }
});
