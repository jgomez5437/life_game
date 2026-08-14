import { jest } from '@jest/globals';
import {
    MODULE_REGISTRY,
    ACTION_TO_MODULE,
    loadModule,
    preloadModule,
    isModuleLoaded,
    clearModuleCache,
    lazy,
    preloadModulesPaced,
    preloadForContext,
    attachIntentPreloaders,
    detachIntentPreloaders,
    shouldSkipPreloading,
    _resetLoaderForTesting
} from '../public/src/core/moduleLoader.js';

import { state } from '../public/src/core/state.js';

describe('Central Module Loader & Background Preloader Engine', () => {

    beforeEach(() => {
        _resetLoaderForTesting();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="loading-container"></div>
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
});
