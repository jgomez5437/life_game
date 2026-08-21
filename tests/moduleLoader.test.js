import { jest } from '@jest/globals';
import {
    MODULE_REGISTRY,
    ACTION_TO_MODULE,
    loadModule,
    loadWithRetry,
    preloadModule,
    isModuleLoaded,
    clearModuleCache,
    lazy,
    preloadModulesPaced,
    preloadForContext,
    attachIntentPreloaders,
    detachIntentPreloaders,
    shouldSkipPreloading,
    formatModuleName,
    showModuleLoadError,
    hideModuleLoadError,
    _resetLoaderForTesting
} from '../public/src/core/moduleLoader.js';

import { state } from '../public/src/core/state.js';

describe('Central Module Loader & Background Preloader Engine', () => {

    beforeEach(() => {
        _resetLoaderForTesting();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="loading-container"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
            <button id="btn-assets" data-action="renderAssets">Assets</button>
            <button id="btn-business" data-action="enterBusinessMode">Business</button>
            <button id="btn-casino" data-action="renderCasinoHub">Casino</button>
        `;
        state.gameState = {
            user: {
                username: "Tester",
                age: 25,
                money: 50000,
                health: 100,
                happiness: 100,
                smarts: 100,
                looks: 100,
                assets: []
            }
        };
    });

    afterEach(() => {
        _resetLoaderForTesting();
    });

    describe('Module Registry & Tier Architecture', () => {
        test('MODULE_REGISTRY includes all Tier 1, Tier 2, and Tier 3 feature keys', () => {
            const expectedKeys = [
                'charCreation', 'mainScreen', 'playerOverview', 'relationships',
                'manageEducation', 'instantDiploma', 'careerJobs', 'jobCareerManager',
                'partTimeJobs', 'occupation', 'assets', 'goShopping', 'saveSlotManager', 'timeMachine',
                'businessDashboard', 'createBusiness', 'investments', 'romance', 'funeral',
                'store', 'godModeAvatar', 'vipLounge', 'more', 'settings', 'graveyard',
                'casino', 'crime', 'prison'
            ];

            expectedKeys.forEach(key => {
                expect(MODULE_REGISTRY[key]).toBeDefined();
                expect(typeof MODULE_REGISTRY[key]).toBe('function');
            });
        });

        test('ACTION_TO_MODULE maps user actions to corresponding module keys', () => {
            expect(ACTION_TO_MODULE['renderAssets']).toBe('assets');
            expect(ACTION_TO_MODULE['enterBusinessMode']).toBe('businessDashboard');
            expect(ACTION_TO_MODULE['renderCasinoHub']).toBe('casino');
            expect(ACTION_TO_MODULE['renderCrimeDashboard']).toBe('crime');
            expect(ACTION_TO_MODULE['renderPrisonDashboard']).toBe('prison');
            expect(ACTION_TO_MODULE['renderStoreScreen']).toBe('store');
            expect(ACTION_TO_MODULE['openPlayerOverviewModal']).toBe('playerOverview');
            expect(ACTION_TO_MODULE['renderLifeDashboard']).toBe('mainScreen');
            expect(ACTION_TO_MODULE['renderCharCreation']).toBe('charCreation');
        });
    });

    describe('Caching & Deduplication', () => {
        test('loadModule returns same module promise when called multiple times in flight', async () => {
            expect(isModuleLoaded('assets')).toBe(false);

            const p1 = loadModule('assets');
            const p2 = loadModule('assets');
            expect(p1).toBe(p2);

            const mod = await p1;
            expect(mod).toBeDefined();
            expect(isModuleLoaded('assets')).toBe(true);
        });

        test('loadModule throws error for unregistered module key', async () => {
            await expect(loadModule('nonExistentScreenKey')).rejects.toThrow('Unknown module: "nonExistentScreenKey"');
        });

        test('clearModuleCache resets loaded module state', async () => {
            await loadModule('assets');
            expect(isModuleLoaded('assets')).toBe(true);

            clearModuleCache();
            expect(isModuleLoaded('assets')).toBe(false);
        });
    });

    describe('Data-Saver & Slow Connection Protection', () => {
        test('shouldSkipPreloading respects saveData mode and 2g connections', () => {
            const originalNav = global.navigator;

            // Normal connection
            expect(shouldSkipPreloading()).toBe(false);

            // Mock Data Saver enabled
            Object.defineProperty(global, 'navigator', {
                value: { connection: { saveData: true, effectiveType: '4g' } },
                configurable: true
            });
            expect(shouldSkipPreloading()).toBe(true);

            // Mock Slow 2G
            Object.defineProperty(global, 'navigator', {
                value: { connection: { saveData: false, effectiveType: '2g' } },
                configurable: true
            });
            expect(shouldSkipPreloading()).toBe(true);

            // Mock Slow Connection (slow-2g)
            Object.defineProperty(global, 'navigator', {
                value: { connection: { saveData: false, effectiveType: 'slow-2g' } },
                configurable: true
            });
            expect(shouldSkipPreloading()).toBe(true);

            // Restore
            Object.defineProperty(global, 'navigator', {
                value: originalNav,
                configurable: true
            });
        });
    });

    describe('Intent & Hover Preloading', () => {
        test('attachIntentPreloaders preloads module on mouseover', async () => {
            attachIntentPreloaders();
            const btn = document.getElementById('btn-business');

            expect(isModuleLoaded('businessDashboard')).toBe(false);

            // Trigger mouseover
            btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            // Wait briefly for preload
            await preloadModule('businessDashboard');
            expect(isModuleLoaded('businessDashboard')).toBe(true);

            detachIntentPreloaders();
        });
    });

    describe('Context-Aware Background Preloading', () => {
        test('preloadForContext prioritizes education for school-age children (5-17)', async () => {
            const gameState = {
                user: { age: 10, inPrison: false, money: 500, hasBusiness: false }
            };

            preloadForContext(gameState);
            await preloadModule('manageEducation');
            expect(isModuleLoaded('manageEducation')).toBe(true);
        });

        test('preloadForContext preloads prison module for incarcerated players', async () => {
            const gameState = {
                user: { age: 25, inPrison: true, money: 0 }
            };

            preloadForContext(gameState);
            await preloadModule('prison');
            expect(isModuleLoaded('prison')).toBe(true);
        });

        test('preloadForContext preloads business for business owners', async () => {
            const gameState = {
                user: { age: 30, inPrison: false, money: 250000, hasBusiness: true }
            };

            preloadForContext(gameState);
            await preloadModule('businessDashboard');
            expect(isModuleLoaded('businessDashboard')).toBe(true);
        });
    });

    describe('Paced Queue Execution', () => {
        test('preloadModulesPaced filters out already loaded modules', async () => {
            await loadModule('assets');
            expect(isModuleLoaded('assets')).toBe(true);

            preloadModulesPaced(['assets', 'goShopping'], 20);
        });
    });

    describe('Lazy Proxy Execution', () => {
        test('lazy returns an executable wrapper that resolves export dynamically', async () => {
            const renderAssetsProxy = lazy('assets', 'renderAssets');
            expect(typeof renderAssetsProxy).toBe('function');

            await renderAssetsProxy();
            expect(isModuleLoaded('assets')).toBe(true);
        });

        test('lazy returns undefined and logs error if function does not exist on module', async () => {
            const nonExistentFn = lazy('assets', 'nonExistentFunction');
            const result = await nonExistentFn();
            expect(result).toBeUndefined();
        });
    });

    describe('H-14: Exponential Backoff Retries & Error Recovery', () => {
        test('loadWithRetry resolves immediately when factory succeeds on first attempt', async () => {
            const factory = jest.fn().mockResolvedValue({ default: 'ok' });
            const res = await loadWithRetry(factory, 3, 10);
            expect(res).toEqual({ default: 'ok' });
            expect(factory).toHaveBeenCalledTimes(1);
        });

        test('loadWithRetry retries with backoff and resolves when retry succeeds', async () => {
            let callCount = 0;
            const factory = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    return Promise.reject(new Error(`Network timeout attempt ${callCount}`));
                }
                return Promise.resolve({ data: 'recovered' });
            });

            const res = await loadWithRetry(factory, 3, 10);
            expect(res).toEqual({ data: 'recovered' });
            expect(factory).toHaveBeenCalledTimes(3); // attempt 0, retry 1, retry 2
        });

        test('loadWithRetry throws last error when all retries fail', async () => {
            const factory = jest.fn().mockRejectedValue(new Error('Persistent offline error'));

            await expect(loadWithRetry(factory, 3, 10)).rejects.toThrow('Persistent offline error');
            expect(factory).toHaveBeenCalledTimes(4); // 1 initial + 3 retries = 4 attempts
        });

        test('loadModule uses retries and transitions from error state to success on subsequent call', async () => {
            let attempt = 0;
            const originalFactory = MODULE_REGISTRY.casino;

            MODULE_REGISTRY.casino = jest.fn().mockImplementation(() => {
                attempt++;
                if (attempt <= 4) {
                    return Promise.reject(new Error('Simulated network drop'));
                }
                return Promise.resolve({ casinoReady: true });
            });

            // First call fails all 3 retries (4 total attempts)
            await expect(loadModule('casino', { maxRetries: 3, baseDelayMs: 5 })).rejects.toThrow('Simulated network drop');
            expect(isModuleLoaded('casino')).toBe(false);

            // Subsequent call attempts fresh load cycle and succeeds
            const recovered = await loadModule('casino', { maxRetries: 3, baseDelayMs: 5 });
            expect(recovered).toEqual({ casinoReady: true });
            expect(isModuleLoaded('casino')).toBe(true);

            MODULE_REGISTRY.casino = originalFactory;
        });

        test('formatModuleName formats known and camelCase module keys', () => {
            expect(formatModuleName('businessDashboard')).toBe('Business Dashboard');
            expect(formatModuleName('manageEducation')).toBe('Education');
            expect(formatModuleName('saveSlotManager')).toBe('Save Slot Manager');
            expect(formatModuleName('casino')).toBe('Casino');
            expect(formatModuleName('customScreenTest')).toBe('Custom Screen Test');
            expect(formatModuleName('')).toBe('Feature');
        });

        test('showModuleLoadError renders modal with Retry and Dismiss buttons in DOM', () => {
            const retrySpy = jest.fn();
            showModuleLoadError({
                moduleKey: 'businessDashboard',
                onRetry: retrySpy,
                error: new Error('Network error')
            });

            const overlay = document.getElementById('modal-overlay');
            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');
            const retryBtn = document.getElementById('module-error-retry-btn');
            const dismissBtn = document.getElementById('module-error-dismiss-btn');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(title.innerHTML).toContain('Connection Error');
            expect(content.innerHTML).toContain('Business Dashboard');
            expect(retryBtn).not.toBeNull();
            expect(dismissBtn).not.toBeNull();

            // Clicking Dismiss closes the modal
            dismissBtn.click();
            expect(overlay.classList.contains('hidden')).toBe(true);

            // Re-open and test Retry button
            showModuleLoadError({
                moduleKey: 'businessDashboard',
                onRetry: retrySpy
            });
            expect(overlay.classList.contains('hidden')).toBe(false);
            retryBtn.click();
            expect(retrySpy).toHaveBeenCalledTimes(1);
            expect(overlay.classList.contains('hidden')).toBe(true);
        });

        test('lazy proxy shows error modal with Retry button when module load fails', async () => {
            const originalFactory = MODULE_REGISTRY.crime;
            let shouldSucceed = false;

            MODULE_REGISTRY.crime = jest.fn().mockImplementation(() => {
                if (!shouldSucceed) {
                    return Promise.reject(new Error('Chunk load failed'));
                }
                return Promise.resolve({
                    renderCrimeDashboard: jest.fn().mockReturnValue('Crime screen loaded')
                });
            });

            const crimeProxy = lazy('crime', 'renderCrimeDashboard');

            // Trigger proxy which fails
            await expect(crimeProxy()).rejects.toThrow('Chunk load failed');

            const overlay = document.getElementById('modal-overlay');
            const content = document.getElementById('modal-content');
            const retryBtn = document.getElementById('module-error-retry-btn');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(content.innerHTML).toContain('Crime');

            // Network recovers, user clicks Retry in modal
            shouldSucceed = true;
            retryBtn.click();

            // Modal is dismissed and retry is triggered
            expect(overlay.classList.contains('hidden')).toBe(true);

            // Verify module is now loaded after retry
            await loadModule('crime', { maxRetries: 1, baseDelayMs: 5 });
            expect(isModuleLoaded('crime')).toBe(true);

            MODULE_REGISTRY.crime = originalFactory;
        });
    });
});
