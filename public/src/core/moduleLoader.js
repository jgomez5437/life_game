/**
 * Module Loader & Background Preloading Engine
 * 
 * Implements a 3-tier hybrid code splitting architecture:
 * - Tier 1: Core / Immediate modules
 * - Tier 2: Background preloaded modules (paced during idle time)
 * - Tier 3: True on-demand lazy modules
 */

export const MODULE_REGISTRY = {
    // --- Tier 1: Core / Immediate ---
    charCreation: () => import('../features/player/charCreationScreen.js'),
    mainScreen: () => import('../features/player/mainScreen.js'),
    playerOverview: () => import('../features/player/playerOverviewScreen.js'),
    relationships: () => import('../features/relationships/relationshipScreen.js'),
    manageEducation: () => import('../features/education/manageEducationScreen.js'),
    instantDiploma: () => import('../features/education/instantDiploma.js'),
    careerJobs: () => import('../features/career/careerJobsScreen.js'),
    jobCareerManager: () => import('../features/career/jobCareerManagerScreen.js'),
    partTimeJobs: () => import('../features/career/partTimeJobsScreen.js'),
    occupation: () => import('../features/career/occupationScreen.js'),
    assets: () => import('../features/assets/assetsScreen.js'),
    goShopping: () => import('../features/assets/goShoppingScreen.js'),
    saveSlotManager: () => import('./saveSlotManager.js'),
    timeMachine: () => import('./timeMachine.js'),

    // --- Tier 2: Background Preload (Conservative) ---
    businessDashboard: () => import('../features/business/businessDashboard.js'),
    createBusiness: () => import('../features/business/createBusinessScreen.js'),
    investments: () => import('../features/assets/investmentsScreen.js'),
    romance: () => import('../features/relationships/romanceScreen.js'),
    funeral: () => import('../features/relationships/funeralScreen.js'),
    store: () => import('../features/store/storeScreen.js'),
    godModeAvatar: () => import('../features/store/godModeAvatarEditor.js'),
    vipLounge: () => import('../features/store/vipLounge.js'),
    more: () => import('../features/more/moreScreen.js'),
    settings: () => import('../features/more/settingsScreen.js'),
    graveyard: () => import('../features/player/graveyardScreen.js'),

    // --- Tier 3: True Lazy Load ---
    casino: () => import('../features/more/casinoScreen.js'),
    crime: () => import('../features/more/crimeScreen.js'),
    prison: () => import('../features/more/prisonScreen.js')
};

// Map data-action and data-preload names to module keys for intent preloading
export const ACTION_TO_MODULE = {
    // Business
    processQuarter: 'businessDashboard',
    enterBusinessMode: 'businessDashboard',
    setBusinessTab: 'businessDashboard',
    hireEmployee: 'businessDashboard',
    layoffEmployee: 'businessDashboard',
    sellBusiness: 'businessDashboard',
    purchaseUpgrade: 'businessDashboard',
    acceptVCPitch: 'businessDashboard',
    launchIPO: 'businessDashboard',
    selectIndustry: 'createBusiness',
    selectSupplier: 'createBusiness',
    renderBusinessSetup: 'createBusiness',
    initBusiness: 'createBusiness',

    // Education & Career
    renderEducation: 'manageEducation',
    workHarder: 'manageEducation',
    skipSchool: 'manageEducation',
    renderClassmates: 'manageEducation',
    renderJobMarket: 'partTimeJobs',
    renderCareerMarket: 'careerJobs',
    applyForJob: 'careerJobs',
    applyForCareerTrack: 'careerJobs',
    joinSpecialCareer: 'careerJobs',
    confirmJoinSpecialCareer: 'careerJobs',
    renderCareerManager: 'jobCareerManager',
    workHarderJob: 'jobCareerManager',
    slackOffJob: 'jobCareerManager',
    confirmQuitCareer: 'jobCareerManager',
    quitCareer: 'jobCareerManager',
    renderActivities: 'occupation',
    openUniversityModal: 'occupation',
    attemptEnrollment: 'occupation',
    renderGradSchoolMarket: 'occupation',
    openGradEnrollmentModal: 'occupation',
    attemptGradEnrollment: 'occupation',

    // Assets & Shopping
    renderAssets: 'assets',
    renderVehicleManager: 'assets',
    repairVehicle: 'assets',
    sellVehicle: 'assets',
    renderPropertyManager: 'assets',
    payOffMortgage: 'assets',
    openSellPropertyModal: 'assets',
    submitPropertyListing: 'assets',
    acceptBuyerOffer: 'assets',
    doPropertyMaintenance: 'assets',
    doPropertyRenovation: 'assets',
    openTenantScreening: 'assets',
    acceptTenantLease: 'assets',
    evictTenantAction: 'assets',
    demandTenantRentPayment: 'assets',
    forgiveTenantRent: 'assets',
    evictTenantFromEvent: 'assets',
    demandTenantRepairPayment: 'assets',
    forgiveTenantDamage: 'assets',
    renewLeaseSameRate: 'assets',
    renewLeaseWithIncrease: 'assets',
    declineLeaseRenewal: 'assets',
    renderJewelryManager: 'assets',
    toggleWearJewelry: 'assets',
    toggleInsureJewelry: 'assets',
    sellJewelry: 'assets',
    openGiftJewelryModal: 'assets',
    confirmGiftJewelry: 'assets',
    setPrimaryVehicle: 'assets',
    toggleInsureVehicle: 'assets',
    takeJoyride: 'assets',
    openGiftVehicleModal: 'assets',
    confirmGiftVehicle: 'assets',
    renderShoppingHub: 'goShopping',
    renderVehicleDealer: 'goShopping',
    buyVehicle: 'goShopping',
    buyVehicleCash: 'goShopping',
    buyVehicleLoan: 'goShopping',
    openTradeInModal: 'goShopping',
    executeTradeInPurchase: 'goShopping',
    renderRealEstateDealer: 'goShopping',
    buyPropertyCash: 'goShopping',
    buyPropertyMortgage: 'goShopping',
    renderJewelryDealer: 'goShopping',
    buyJewelry: 'goShopping',

    // Investments
    renderInvestmentsScreen: 'investments',
    switchInvestmentTab: 'investments',
    setStockFilter: 'investments',
    openStockDetailsModal: 'investments',
    openBuyStockModal: 'investments',
    confirmBuyStock: 'investments',
    openSellStockModal: 'investments',
    confirmSellStock: 'investments',
    openDepositSavingsModal: 'investments',
    confirmDepositSavings: 'investments',
    openWithdrawSavingsModal: 'investments',
    confirmWithdrawSavings: 'investments',

    // Relationships & Romance
    renderRelationships: 'relationships',
    renderPersonInteraction: 'relationships',
    openRelationshipConfirm: 'relationships',
    spendTimeWithAll: 'relationships',
    goOutMeetSomeone: 'relationships',
    openMeetPeopleModal: 'relationships',
    setAttractionPreference: 'relationships',
    handleBlindDate: 'relationships',
    handleDatingApp: 'relationships',
    renderDatingAppModal: 'relationships',
    selectDatingAppMatch: 'relationships',
    handleMeetFriend: 'relationships',
    handleNightOut: 'relationships',
    renderLuxeMatchModal: 'relationships',
    selectLuxeAgePreset: 'relationships',
    selectLuxeWealthTier: 'relationships',
    confirmLuxeMatch: 'relationships',
    handleMakeAMove: 'relationships',
    confirmHookupChoice: 'relationships',
    handleEndAffair: 'relationships',
    handleCheatingConfrontationChoice: 'relationships',
    handleProposeAction: 'relationships',
    openRingSelectionModal: 'relationships',
    proposeWithRing: 'relationships',
    openWeddingPlanner: 'romance',
    confirmWeddingPlan: 'romance',
    openNameChangeChoice: 'romance',
    chooseNameChange: 'romance',
    chooseFuneralType: 'funeral',
    cancelFuneralPlan: 'funeral',
    confirmFuneralPlan: 'funeral',
    donateBody: 'funeral',
    lookTheOtherWay: 'funeral',
    goToFuneral: 'funeral',
    skipFuneral: 'funeral',
    respondNewTeacher: 'funeral',
    processNextTeacherReplacement: 'funeral',

    // More, Settings & Casino
    renderMoreDashboard: 'more',
    buyGymMembership: 'more',
    cancelGymMembership: 'more',
    visitGymOneTime: 'more',
    startBetterDiet: 'more',
    cancelBetterDiet: 'more',
    visitDoctor: 'more',
    openTravelModal: 'more',
    bookTrip: 'more',
    openDietSelectionModal: 'more',
    selectDiet: 'more',
    openLotteryModal: 'more',
    buyLotteryTicket: 'more',
    openMoveCountryModal: 'more',
    updateRelocateCityDropdown: 'more',
    confirmMoveCountry: 'more',
    askPartnerToMove: 'more',
    confirmMoveAlone: 'more',
    openSkillsModal: 'more',
    renderCasinoHub: 'casino',
    openBlackjackBetting: 'more',
    startBlackjackGame: 'more',
    blackjackHit: 'more',
    blackjackStand: 'more',
    openRouletteModal: 'casino',
    confirmRouletteBet: 'casino',
    confirmRouletteSingleNumberBet: 'casino',
    openSlotsModal: 'casino',
    confirmSlotsSpin: 'casino',
    openSettingsModal: 'settings',
    triggerManualSave: 'settings',
    promptResetGame: 'settings',
    promptSignOut: 'settings',
    handleSignOut: 'settings',
    toggleSettingSFX: 'settings',
    toggleSettingCompact: 'settings',
    toggleSettingBottomNav: 'settings',
    toggleSettingTheme: 'settings',
    applyTheme: 'settings',

    // Crime & Prison
    renderCrimeDashboard: 'crime',
    openCrimeModal: 'crime',
    commitCrimeAction: 'crime',
    showArrestModal: 'crime',
    openBribeModal: 'crime',
    submitBribeAction: 'crime',
    handleArrestChoice: 'crime',
    showCourtArraignmentModal: 'crime',
    selectLegalCounsel: 'crime',
    finishCourtSentencing: 'crime',
    returnFromCrimeOrArrest: 'crime',
    attemptMafiaCrime: 'jobCareerManager',
    renderPrisonDashboard: 'prison',
    setPrisonTab: 'prison',
    handleCellmateAction: 'prison',
    handleYardWorkout: 'prison',
    handleInmateInteract: 'prison',
    handleSelectPrisonJob: 'prison',
    handleBuyCanteen: 'prison',
    handleStudyLaw: 'prison',
    handleFileAppeal: 'prison',
    handlePrisonVisit: 'prison',
    handleSendPrisonLetter: 'prison',
    handleConjugalVisit: 'prison',
    handleParoleHearing: 'prison',
    handlePrisonEscapeAction: 'prison',
    openContrabandPhoneModal: 'prison',
    submitContrabandPhoneAction: 'prison',
    openDealerBuyModal: 'prison',
    openDealerSellModal: 'prison',
    handleSellContrabandAction: 'prison',
    handleSolitaryActivity: 'prison',
    openInmateDetailModal: 'prison',
    openAttackPromptModal: 'prison',
    executeInmateAttack: 'prison',

    // Store & Customization
    renderStoreScreen: 'store',
    filterStoreCategory: 'store',
    previewPackDetails: 'store',
    buyPack: 'store',
    restorePurchases: 'store',
    renderGodModeModal: 'store',
    maxGodModeStats: 'store',
    applyGodModeStats: 'store',
    openGodModeHubModal: 'store',
    renderGodModeAvatarModal: 'godModeAvatar',
    cycleGodModeTrait: 'godModeAvatar',
    randomizeGodModeAvatarTraits: 'godModeAvatar',
    saveGodModeAvatar: 'godModeAvatar',
    renderInstantDiplomaHub: 'instantDiploma',
    grantInstantHighSchool: 'instantDiploma',
    grantInstantUniversityDegree: 'instantDiploma',
    grantInstantGradDegree: 'instantDiploma',
    claimInstantUniversityMajor: 'instantDiploma',
    renderVipLoungeModal: 'vipLounge',
    selectTheme: 'vipLounge',
    renderGraveyardModal: 'graveyard',
    showAncestorEulogy: 'graveyard',

    // Time Machine & Save Slots
    openTimeMachineModal: 'timeMachine',
    executeTimeRewind: 'timeMachine',
    openSaveSlotManager: 'saveSlotManager',
    loadSaveSlot: 'saveSlotManager',
    branchSaveSlot: 'saveSlotManager',
    startNewSlotLife: 'saveSlotManager',
    deleteSaveSlot: 'saveSlotManager',

    // Main Screen & Character Creation
    openPlayerOverviewModal: 'playerOverview',
    renderCharCreation: 'charCreation',
    cycleTrait: 'charCreation',
    randomizeSection: 'charCreation',
    selectGender: 'charCreation',
    submitCharacter: 'charCreation',
    renderLifeDashboard: 'mainScreen',
    ageUp: 'mainScreen',
    showFullEulogy: 'mainScreen',
    showDeathScreen: 'mainScreen',
    renderDeathScreen: 'mainScreen'
};

const _moduleCache = new Map();
let _intentPreloadersAttached = false;
let _intentHandler = null;
let _activePreloadQueue = [];
let _isPreloadingActive = false;
let _activeLoadingCount = 0;

/**
 * Checks if running under a low-bandwidth or data-saver connection.
 * On slow connections, idle preloading is completely avoided.
 */
export function shouldSkipPreloading() {
    if (typeof navigator === 'undefined') return false;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return false;
    if (conn.saveData) return true;
    if (['slow-2g', '2g'].includes(conn.effectiveType)) return true;
    return false;
}

/**
 * Clears the internal module cache and active queues (useful for tests and reset).
 */
export function clearModuleCache() {
    _moduleCache.clear();
    _activePreloadQueue = [];
    _isPreloadingActive = false;
    _activeLoadingCount = 0;
    hideSubtleLoading();
}

/**
 * Checks synchronously if a module is already loaded in memory.
 * @param {string} moduleKey 
 * @returns {boolean}
 */
export function isModuleLoaded(moduleKey) {
    const entry = _moduleCache.get(moduleKey);
    return entry ? entry.status === 'loaded' : false;
}

/**
 * Friendly display name formatter for module keys.
 * @param {string} moduleKey 
 * @returns {string}
 */
export function formatModuleName(moduleKey) {
    if (!moduleKey) return 'Feature';
    const names = {
        charCreation: 'Character Creation',
        mainScreen: 'Main Screen',
        playerOverview: 'Player Overview',
        relationships: 'Relationships',
        manageEducation: 'Education',
        instantDiploma: 'Instant Diploma',
        careerJobs: 'Careers & Jobs',
        jobCareerManager: 'Career Manager',
        partTimeJobs: 'Part-Time Jobs',
        occupation: 'Occupation',
        assets: 'Assets',
        goShopping: 'Shopping',
        saveSlotManager: 'Save Slot Manager',
        timeMachine: 'Time Machine',
        businessDashboard: 'Business Dashboard',
        createBusiness: 'Create Business',
        investments: 'Investments',
        romance: 'Romance',
        funeral: 'Funeral',
        store: 'Store',
        godModeAvatar: 'God Mode Avatar',
        vipLounge: 'VIP Lounge',
        more: 'Activities',
        settings: 'Settings',
        graveyard: 'Graveyard',
        casino: 'Casino',
        crime: 'Crime',
        prison: 'Prison'
    };
    if (names[moduleKey]) return names[moduleKey];
    return moduleKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Executes an import factory with exponential backoff retries.
 * @param {Function} importFactory 
 * @param {number} maxRetries 
 * @param {number} baseDelayMs 
 * @returns {Promise<any>}
 */
export async function loadWithRetry(importFactory, maxRetries = 3, baseDelayMs = 300) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await importFactory();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

/**
 * Displays a user-friendly error modal with a "Retry" button when module loading fails.
 * @param {Object} options 
 * @param {string} options.moduleKey 
 * @param {Function} [options.onRetry] 
 * @param {Error} [options.error] 
 */
export function showModuleLoadError({ moduleKey, onRetry, error }) {
    if (typeof document === 'undefined') return;

    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    const actions = document.getElementById('modal-actions');

    const friendlyName = formatModuleName(moduleKey);

    if (overlay && title && content && actions) {
        title.innerHTML = `<i class="fas fa-wifi text-red-400 mr-2"></i> Connection Error`;
        title.classList.remove('hidden');

        content.innerHTML = `
            <div class="text-center py-2">
                <div class="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                    <i class="fas fa-exclamation-triangle text-xl"></i>
                </div>
                <p class="text-white font-semibold mb-1">Failed to load ${friendlyName}</p>
                <p class="text-slate-400 text-xs leading-relaxed">
                    A network error occurred while loading this feature. Please check your internet connection and try again.
                </p>
            </div>
        `;

        actions.innerHTML = `
            <div class="w-full grid grid-cols-2 gap-2">
                <button id="module-error-dismiss-btn" class="w-full border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm">
                    Dismiss
                </button>
                <button id="module-error-retry-btn" class="w-full btn-primary text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20">
                    <i class="fas fa-redo-alt text-xs"></i> Retry
                </button>
            </div>
        `;
        actions.classList.remove('hidden');

        const retryBtn = document.getElementById('module-error-retry-btn');
        const dismissBtn = document.getElementById('module-error-dismiss-btn');

        if (retryBtn) {
            retryBtn.onclick = () => {
                hideModuleLoadError();
                if (typeof onRetry === 'function') {
                    onRetry();
                }
            };
        }

        if (dismissBtn) {
            dismissBtn.onclick = () => {
                hideModuleLoadError();
            };
        }

        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
}

/**
 * Hides the module load error modal.
 */
export function hideModuleLoadError() {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

/**
 * Loads a module dynamically with automated retries and exponential backoff.
 * Caches both the promise and the resolved module.
 * @param {string} moduleKey 
 * @param {Object} [options]
 * @param {number} [options.maxRetries=3]
 * @param {number} [options.baseDelayMs=300]
 * @returns {Promise<any>}
 */
export function loadModule(moduleKey, options = {}) {
    const { maxRetries = 3, baseDelayMs = 300 } = options;
    const entry = _moduleCache.get(moduleKey);
    if (entry) {
        if (entry.status === 'loaded') {
            return Promise.resolve(entry.module);
        }
        if (entry.status === 'loading') {
            return entry.promise;
        }
    }

    const importFactory = MODULE_REGISTRY[moduleKey];
    if (!importFactory) {
        return Promise.reject(new Error(`[ModuleLoader] Unknown module: "${moduleKey}"`));
    }

    const promise = loadWithRetry(importFactory, maxRetries, baseDelayMs)
        .then(mod => {
            _moduleCache.set(moduleKey, {
                module: mod,
                promise: Promise.resolve(mod),
                status: 'loaded'
            });
            return mod;
        })
        .catch(err => {
            _moduleCache.set(moduleKey, {
                module: null,
                promise: null,
                status: 'error',
                error: err
            });
            console.error(`[ModuleLoader] Failed to load module "${moduleKey}" after ${maxRetries} retries:`, err);
            throw err;
        });

    _moduleCache.set(moduleKey, {
        module: null,
        promise,
        status: 'loading'
    });

    return promise;
}

/**
 * Preloads a module quietly in the background without blocking.
 * @param {string} moduleKey 
 */
export function preloadModule(moduleKey) {
    if (shouldSkipPreloading()) return Promise.resolve(null);
    if (isModuleLoaded(moduleKey)) return Promise.resolve(_moduleCache.get(moduleKey).module);

    return loadModule(moduleKey).catch(() => {
        // Silently catch background preload errors
        return null;
    });
}

/**
 * Subtle non-blocking loading indicator for requests taking ~300ms+.
 */
function showSubtleLoading() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('module-loading-indicator')) return;

    const el = document.createElement('div');
    el.id = 'module-loading-indicator';
    el.className = 'fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 z-50 opacity-90 animate-pulse pointer-events-none transition-opacity duration-200';
    document.body.appendChild(el);
}

function hideSubtleLoading() {
    if (typeof document === 'undefined') return;
    if (_activeLoadingCount <= 0) {
        _activeLoadingCount = 0;
        const el = document.getElementById('module-loading-indicator');
        if (el) {
            el.remove();
        }
    }
}

/**
 * Creates a lazy function proxy that resolves the module on invocation.
 * Shows a subtle loading bar only if the chunk fetch takes longer than 300ms.
 * Displays a recovery error modal with a "Retry" button if chunk loading fails.
 * @param {string} moduleKey 
 * @param {string} exportName 
 * @returns {Function}
 */
export function lazy(moduleKey, exportName) {
    const lazyProxy = async function(...args) {
        if (isModuleLoaded(moduleKey)) {
            const entry = _moduleCache.get(moduleKey);
            const fn = entry.module[exportName];
            if (typeof fn !== 'function') {
                console.error(`[ModuleLoader] "${exportName}" is not a function in module "${moduleKey}"`);
                return undefined;
            }
            return fn(...args);
        }

        let didShowLoading = false;
        const timeoutId = setTimeout(() => {
            didShowLoading = true;
            _activeLoadingCount++;
            showSubtleLoading();
        }, 300);

        try {
            const mod = await loadModule(moduleKey);
            clearTimeout(timeoutId);
            if (didShowLoading) {
                _activeLoadingCount = Math.max(0, _activeLoadingCount - 1);
            }
            hideSubtleLoading();
            const fn = mod[exportName];
            if (typeof fn !== 'function') {
                console.error(`[ModuleLoader] "${exportName}" is not a function in module "${moduleKey}"`);
                return undefined;
            }
            return fn(...args);
        } catch (err) {
            clearTimeout(timeoutId);
            if (didShowLoading) {
                _activeLoadingCount = Math.max(0, _activeLoadingCount - 1);
            }
            hideSubtleLoading();
            showModuleLoadError({
                moduleKey,
                onRetry: () => lazyProxy(...args),
                error: err
            });
            throw err;
        }
    };
    return lazyProxy;
}

/**
 * Paced background queue that preloads modules one at a time during idle intervals.
 * @param {string[]} moduleKeys 
 * @param {number} delayBetweenMs 
 */
export function preloadModulesPaced(moduleKeys, delayBetweenMs = 800) {
    if (shouldSkipPreloading()) return;
    if (!Array.isArray(moduleKeys) || moduleKeys.length === 0) return;

    // Filter out already loaded or currently queued modules
    const toQueue = moduleKeys.filter(k => MODULE_REGISTRY[k] && !isModuleLoaded(k) && !_activePreloadQueue.includes(k));
    if (toQueue.length === 0) return;

    _activePreloadQueue.push(...toQueue);

    if (!_isPreloadingActive) {
        _isPreloadingActive = true;
        processNextPreload(delayBetweenMs);
    }
}

function processNextPreload(delayBetweenMs) {
    if (_activePreloadQueue.length === 0) {
        _isPreloadingActive = false;
        return;
    }

    const nextModule = _activePreloadQueue.shift();

    const doPreload = async () => {
        if (!isModuleLoaded(nextModule)) {
            try {
                await preloadModule(nextModule);
            } catch (e) {}
        }
        setTimeout(() => {
            processNextPreload(delayBetweenMs);
        }, delayBetweenMs);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => doPreload(), { timeout: 2000 });
    } else {
        setTimeout(doPreload, 200);
    }
}

/**
 * Context-aware preloader: inspects current player status and preloads
 * only the most probable next modules in paced background intervals.
 * Conservative to prevent downloading large parts of the app prematurely.
 * @param {object} gameState 
 */
export function preloadForContext(gameState) {
    if (!gameState || !gameState.user) return;
    if (shouldSkipPreloading()) return;

    const user = gameState.user;
    const prioritizedModules = [];

    if (user.inPrison) {
        prioritizedModules.push('prison');
    } else if (user.age < 18) {
        prioritizedModules.push('manageEducation');
    } else {
        if (user.hasBusiness) {
            prioritizedModules.push('businessDashboard');
        }
        if ((user.money || 0) >= 100000) {
            prioritizedModules.push('investments');
        }
    }

    if (prioritizedModules.length > 0) {
        preloadModulesPaced(prioritizedModules, 800);
    }
}

/**
 * Attaches hover / intent preloading listeners on desktop devices.
 * Gives a 100-300ms preloading head start before user clicks a button.
 */
export function attachIntentPreloaders() {
    if (_intentPreloadersAttached || typeof document === 'undefined') return;
    _intentPreloadersAttached = true;

    _intentHandler = (e) => {
        const target = e.target?.closest?.('[data-action], [data-preload]');
        if (!target) return;

        const preloadKey = target.dataset.preload;
        if (preloadKey && MODULE_REGISTRY[preloadKey]) {
            preloadModule(preloadKey);
            return;
        }

        const action = target.dataset.action;
        if (action && ACTION_TO_MODULE[action]) {
            preloadModule(ACTION_TO_MODULE[action]);
        }
    };

    // Use pointerenter/mouseover for intent detection without interfering with touch devices
    document.addEventListener('mouseover', _intentHandler, { passive: true });
}

/**
 * Detaches hover intent listeners.
 */
export function detachIntentPreloaders() {
    if (typeof document !== 'undefined' && _intentHandler) {
        document.removeEventListener('mouseover', _intentHandler);
        _intentHandler = null;
    }
    _intentPreloadersAttached = false;
}

/**
 * Testing helper: resets internal cache and queues.
 */
export function _resetLoaderForTesting() {
    clearModuleCache();
    detachIntentPreloaders();
    hideModuleLoadError();
}

export const ModuleLoader = {
    MODULE_REGISTRY,
    ACTION_TO_MODULE,
    isModuleLoaded,
    loadModule,
    loadWithRetry,
    preloadModule,
    lazy,
    preloadModulesPaced,
    preloadForContext,
    attachIntentPreloaders,
    detachIntentPreloaders,
    formatModuleName,
    showModuleLoadError,
    hideModuleLoadError,
    _resetLoaderForTesting
};
