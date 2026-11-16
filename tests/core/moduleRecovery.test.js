import { jest } from '@jest/globals';
import {
    RELOAD_COOLDOWN_MS,
    RELOAD_STORAGE_KEY,
    extractEntryModuleSrc,
    diagnoseModuleLoadError,
    canAutoReloadForUpdate,
    markAutoReloadAttempted,
    saveProgressBeforeReload,
    handleModuleLoadFailure,
    showModuleLoadError,
    hideModuleLoadError,
    attachVitePreloadErrorHandler,
    detachVitePreloadErrorHandler,
    _setReloadHandlerForTesting,
    _resetRecoveryForTesting
} from '../../public/src/core/moduleRecovery.js';
import {
    MODULE_REGISTRY,
    lazy,
    loadModuleWithRecovery,
    preloadForContext,
    isModuleLoaded,
    _resetLoaderForTesting
} from '../../public/src/core/moduleLoader.js';
import { state } from '../../public/src/core/state.js';

describe('Module Recovery & Stale Chunk Handling', () => {
    let originalFetch;
    let originalNavigator;

    beforeEach(() => {
        originalFetch = global.fetch;
        originalNavigator = global.navigator;
        _resetLoaderForTesting();
        _resetRecoveryForTesting();
        localStorage.clear();
        sessionStorage.clear();

        document.head.innerHTML = '';
        document.body.innerHTML = `
            <div id="modal-overlay" class="hidden">
                <div id="modal-header">
                    <h2 id="modal-title"></h2>
                    <button id="modal-close-btn"></button>
                </div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            _slotId: 'slot_1',
            user: {
                username: 'Tester',
                name: 'Tester',
                age: 25,
                money: 5000,
                health: 100,
                happiness: 100,
                smarts: 70,
                looks: 60
            }
        };
    });

    afterEach(() => {
        _resetLoaderForTesting();
        _resetRecoveryForTesting();
        global.fetch = originalFetch;
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            configurable: true
        });
        delete window.flushPendingSave;
    });

    test('extractEntryModuleSrc parses module script tags regardless of attribute order', () => {
        expect(extractEntryModuleSrc('<script type="module" crossorigin src="/assets/main-abc123.js"></script>'))
            .toBe('/assets/main-abc123.js');
        expect(extractEntryModuleSrc('<script src="src/core/main.js" type="module"></script>'))
            .toBe('src/core/main.js');
        expect(extractEntryModuleSrc('<script src="/legacy.js"></script>')).toBe('');
    });

    test('diagnoseModuleLoadError returns offline when navigator.onLine is false', async () => {
        Object.defineProperty(global, 'navigator', {
            value: { onLine: false },
            configurable: true
        });

        const reason = await diagnoseModuleLoadError(new Error('Failed to fetch'));
        expect(reason).toBe('offline');
    });

    test('diagnoseModuleLoadError returns offline when /index.html fetch fails or errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        expect(await diagnoseModuleLoadError()).toBe('offline');

        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
        expect(await diagnoseModuleLoadError()).toBe('offline');
    });

    test('diagnoseModuleLoadError returns stale_version when deployed entry script hash differs', async () => {
        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('src', '/assets/main-OLD111.js');
        document.body.appendChild(script);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => '<html><body><script type="module" crossorigin src="/assets/main-NEW222.js"></script></body></html>'
        });

        const reason = await diagnoseModuleLoadError(new Error('404'));
        expect(reason).toBe('stale_version');
    });

    test('diagnoseModuleLoadError returns chunk_error when server is reachable with same entry script', async () => {
        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('src', '/assets/main-SAME111.js');
        document.body.appendChild(script);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => '<html><body><script type="module" crossorigin src="/assets/main-SAME111.js"></script></body></html>'
        });

        const reason = await diagnoseModuleLoadError(new Error('Importing a module script failed'));
        expect(reason).toBe('chunk_error');
    });

    test('canAutoReloadForUpdate enforces 30s sessionStorage cooldown', () => {
        const t0 = 1000000;
        expect(canAutoReloadForUpdate(t0)).toBe(true);
        markAutoReloadAttempted(t0);
        expect(canAutoReloadForUpdate(t0 + 5000)).toBe(false);
        expect(canAutoReloadForUpdate(t0 + RELOAD_COOLDOWN_MS)).toBe(true);
    });

    test('saveProgressBeforeReload persists active slot locally and flushes cloud save', async () => {
        const flushSpy = jest.fn().mockResolvedValue(true);
        window.flushPendingSave = flushSpy;

        await saveProgressBeforeReload();

        const rawSlots = localStorage.getItem('life_game_slots');
        expect(rawSlots).toBeTruthy();
        const parsed = JSON.parse(rawSlots);
        expect(parsed.slots.slot_1.data.user.username).toBe('Tester');
        expect(flushSpy).toHaveBeenCalledTimes(1);
    });

    test('handleModuleLoadFailure silently saves and reloads once on stale build, then shows Update Available modal on cooldown', async () => {
        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('src', '/assets/main-OLD.js');
        document.body.appendChild(script);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => '<script type="module" src="/assets/main-NEW.js"></script>'
        });

        const reloadSpy = jest.fn();
        _setReloadHandlerForTesting(reloadSpy);

        // First failure: auto-reloads once after saving
        const first = await handleModuleLoadFailure({
            moduleKey: 'more',
            error: new Error('Failed to fetch dynamically imported module')
        });
        expect(first).toEqual({ handled: true, action: 'reloaded', reason: 'stale_version' });
        expect(reloadSpy).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem(RELOAD_STORAGE_KEY)).toBeTruthy();
        expect(localStorage.getItem('life_game_slots')).toBeTruthy();

        // Second failure within cooldown: shows Update Available modal instead of looping
        const second = await handleModuleLoadFailure({
            moduleKey: 'more',
            error: new Error('Failed to fetch dynamically imported module')
        });
        expect(second).toEqual({ handled: true, action: 'modal', reason: 'stale_version' });
        expect(reloadSpy).toHaveBeenCalledTimes(1);

        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const reloadBtn = document.getElementById('module-error-reload-btn');
        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(title.innerHTML).toContain('Update Available');
        expect(reloadBtn).not.toBeNull();

        reloadBtn.click();
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(reloadSpy).toHaveBeenCalledTimes(2);
    });

    test('offline error modal includes Refresh Game escape hatch after >= 1 failed retry and wires X close button', () => {
        const retrySpy = jest.fn();
        showModuleLoadError({
            moduleKey: 'more',
            onRetry: retrySpy,
            reason: 'offline',
            retryCount: 1
        });

        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        const retryBtn = document.getElementById('module-error-retry-btn');
        const reloadBtn = document.getElementById('module-error-reload-btn');
        const closeBtn = document.getElementById('modal-close-btn');

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(content.innerHTML).toContain('Failed to load Activities');
        expect(content.innerHTML).toContain('Still unable to reach the server');
        expect(retryBtn).not.toBeNull();
        expect(reloadBtn).not.toBeNull();

        closeBtn.click();
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(closeBtn.onclick).toBeNull();
    });

    test('offline error modal auto-retries when browser fires online event', () => {
        const retrySpy = jest.fn();
        showModuleLoadError({
            moduleKey: 'more',
            onRetry: retrySpy,
            reason: 'offline',
            retryCount: 0
        });

        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(false);

        window.dispatchEvent(new Event('online'));
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(retrySpy).toHaveBeenCalledTimes(1);
    });

    test('vite:preloadError prevents default and routes through handleModuleLoadFailure', async () => {
        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('src', '/assets/main-V1.js');
        document.body.appendChild(script);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => '<script type="module" src="/assets/main-V2.js"></script>'
        });

        const reloadSpy = jest.fn();
        _setReloadHandlerForTesting(reloadSpy);
        attachVitePreloadErrorHandler();

        const evt = new Event('vite:preloadError', { cancelable: true });
        evt.payload = new Error('Unable to preload CSS');
        window.dispatchEvent(evt);

        expect(evt.defaultPrevented).toBe(true);
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(reloadSpy).toHaveBeenCalledTimes(1);

        detachVitePreloadErrorHandler();
    });

    test('lazy proxy increments retryCount and shows Refresh Game fallback after manual retry fails offline', async () => {
        const originalFactory = MODULE_REGISTRY.more;
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Offline'));
        MODULE_REGISTRY.more = jest.fn().mockRejectedValue(new Error('Network offline'));

        const moreProxy = lazy('more', 'renderMoreDashboard');
        await expect(moreProxy()).rejects.toThrow('Network offline');

        expect(document.getElementById('module-error-reload-btn')).toBeNull();
        const retryBtn = document.getElementById('module-error-retry-btn');
        expect(retryBtn).not.toBeNull();

        // Trigger manual retry; wait for fast retry cycle (maxRetries: 1, baseDelayMs: 200)
        retryBtn.click();
        await new Promise(resolve => setTimeout(resolve, 350));

        expect(document.getElementById('module-error-reload-btn')).not.toBeNull();
        MODULE_REGISTRY.more = originalFactory;
    });

    test('preloadForContext includes more and core bottom-nav modules in paced preload', async () => {
        const originalMore = MODULE_REGISTRY.more;
        MODULE_REGISTRY.more = jest.fn().mockResolvedValue({ renderMoreDashboard: jest.fn() });

        preloadForContext(state.gameState);
        // Wait for paced preload (requestIdleCallback fallback setTimeout 200ms)
        await new Promise(resolve => setTimeout(resolve, 300));

        expect(isModuleLoaded('more')).toBe(true);
        MODULE_REGISTRY.more = originalMore;
    });

    test('lazy proxy does not show Connection Error when the loaded feature function itself throws', async () => {
        const originalFactory = MODULE_REGISTRY.crime;
        MODULE_REGISTRY.crime = jest.fn().mockResolvedValue({
            renderCrimeDashboard: () => { throw new Error('UI render bug'); }
        });

        const crimeProxy = lazy('crime', 'renderCrimeDashboard');
        await expect(crimeProxy()).rejects.toThrow('UI render bug');

        const overlay = document.getElementById('modal-overlay');
        expect(overlay.classList.contains('hidden')).toBe(true);
        MODULE_REGISTRY.crime = originalFactory;
    });

    test('loadModuleWithRecovery invokes recovery modal on load failure and runs callback after retry succeeds', async () => {
        const originalFactory = MODULE_REGISTRY.funeral;
        let shouldFail = true;
        MODULE_REGISTRY.funeral = jest.fn().mockImplementation(() => {
            if (shouldFail) return Promise.reject(new Error('Offline'));
            return Promise.resolve({ processNextFuneral: jest.fn().mockReturnValue('done') });
        });
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Offline'));

        const cb = jest.fn(m => m.processNextFuneral());
        const res = await loadModuleWithRecovery('funeral', cb, { maxRetries: 0 });
        expect(res).toBeNull();
        expect(cb).not.toHaveBeenCalled();

        const retryBtn = document.getElementById('module-error-retry-btn');
        expect(retryBtn).not.toBeNull();

        shouldFail = false;
        retryBtn.click();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(cb).toHaveBeenCalledTimes(1);

        MODULE_REGISTRY.funeral = originalFactory;
    });

    test('online event does not auto-retry if another modal replaced the error modal', () => {
        const retrySpy = jest.fn();
        showModuleLoadError({
            moduleKey: 'more',
            onRetry: retrySpy,
            reason: 'offline',
            retryCount: 0
        });

        // Simulate another modal replacing modal-actions content
        document.getElementById('modal-actions').innerHTML = '<button id="modal-btn">Dismiss</button>';
        window.dispatchEvent(new Event('online'));
        expect(retrySpy).not.toHaveBeenCalled();
    });
});
