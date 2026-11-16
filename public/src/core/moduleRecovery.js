import { state } from './state.js';
import { saveToSlot } from './saveSlotManager.js';

export const RELOAD_COOLDOWN_MS = 30000;
export const RELOAD_STORAGE_KEY = 'life_game_chunk_reload_at';

let _isHandlingFailure = false;
let _vitePreloadAttached = false;
let _vitePreloadHandler = null;
let _onlineRetryHandler = null;
let _reloadHandler = null;

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
        skills: 'Skills & Workshops',
        settings: 'Settings',
        achievements: 'Achievements & Trophies',
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

function normalizeScriptSrc(src) {
    if (!src || typeof src !== 'string') return '';
    try {
        const base = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
            ? window.location.origin
            : 'https://localhost';
        return new URL(src, base).pathname;
    } catch (e) {
        return src.trim();
    }
}

export function extractEntryModuleSrc(html) {
    if (!html || typeof html !== 'string') return '';
    const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
    for (const tag of scriptTags) {
        if (/type\s*=\s*["']module["']/i.test(tag)) {
            const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
            if (srcMatch && srcMatch[1]) {
                return srcMatch[1];
            }
        }
    }
    return '';
}

function getCurrentEntryModuleSrc() {
    if (typeof document === 'undefined') return '';
    const el = document.querySelector('script[type="module"][src]');
    return el ? (el.getAttribute('src') || '') : '';
}

/**
 * Probes /index.html with cache: 'no-store' to distinguish genuine offline errors
 * from stale deployments (entry bundle hash changed) or negative-cached chunk errors.
 * @param {Error} [_error]
 * @returns {Promise<'offline' | 'stale_version' | 'chunk_error'>}
 */
export async function diagnoseModuleLoadError(_error) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return 'offline';
    }
    if (typeof fetch !== 'function') {
        return 'offline';
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;

    try {
        const res = await fetch('/index.html', {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            ...(controller ? { signal: controller.signal } : {})
        });
        if (timeoutId) clearTimeout(timeoutId);

        if (!res || !res.ok) {
            return 'offline';
        }

        const html = typeof res.text === 'function' ? await res.text() : '';
        const latestSrc = normalizeScriptSrc(extractEntryModuleSrc(html));
        const currentSrc = normalizeScriptSrc(getCurrentEntryModuleSrc());

        if (latestSrc && currentSrc && latestSrc !== currentSrc) {
            return 'stale_version';
        }

        return 'chunk_error';
    } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        return 'offline';
    }
}

/**
 * Checks whether an automatic page reload for a stale build is permitted
 * under the sessionStorage cooldown guard.
 * @param {number} [now]
 * @returns {boolean}
 */
export function canAutoReloadForUpdate(now = Date.now()) {
    try {
        if (typeof sessionStorage === 'undefined') return false;
        const raw = sessionStorage.getItem(RELOAD_STORAGE_KEY);
        if (!raw) return true;
        const lastReload = Number(raw);
        if (!Number.isFinite(lastReload)) return true;
        return (now - lastReload) >= RELOAD_COOLDOWN_MS;
    } catch (e) {
        return false;
    }
}

/**
 * Records the timestamp of an automatic update reload to prevent reload loops.
 * @param {number} [now]
 */
export function markAutoReloadAttempted(now = Date.now()) {
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(RELOAD_STORAGE_KEY, String(now));
        }
    } catch (e) {}
}

/**
 * Synchronously persists local active slot and performs a bounded flush to cloud save
 * before triggering a page reload.
 */
export async function saveProgressBeforeReload() {
    try {
        if (state.gameState && state.gameState.user) {
            saveToSlot();
        }
    } catch (e) {
        console.warn('[ModuleRecovery] Local slot save before reload failed:', e);
    }

    try {
        if (typeof window !== 'undefined' && typeof window.flushPendingSave === 'function') {
            await Promise.race([
                Promise.resolve(window.flushPendingSave()).catch(() => false),
                new Promise(resolve => setTimeout(resolve, 800))
            ]);
        }
    } catch (e) {
        // Non-fatal: local slot is already persisted synchronously
    }
}

/**
 * Saves progress and reloads the page to pick up the latest deployed bundle.
 */
export async function attemptSafeReload() {
    await saveProgressBeforeReload();
    if (typeof _reloadHandler === 'function') {
        _reloadHandler();
        return;
    }
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
        window.location.reload();
    }
}

function detachOnlineRetryListener() {
    if (typeof window !== 'undefined' && _onlineRetryHandler) {
        window.removeEventListener('online', _onlineRetryHandler);
        _onlineRetryHandler = null;
    }
}

/**
 * Hides the module load error modal and detaches transient listeners.
 */
export function hideModuleLoadError() {
    detachOnlineRetryListener();
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
        closeBtn.onclick = null;
    }
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

/**
 * Displays a user-friendly error modal tailored to the failure cause:
 * - 'stale_version' / 'chunk_error': prompts to refresh for the latest build.
 * - 'offline': prompts to check connection and retry, with a Refresh Game escape hatch after >= 1 failed retry.
 * @param {Object} options
 * @param {string} [options.moduleKey]
 * @param {Function} [options.onRetry]
 * @param {Error} [options.error]
 * @param {'offline'|'stale_version'|'chunk_error'} [options.reason='offline']
 * @param {number} [options.retryCount=0]
 */
export function showModuleLoadError({ moduleKey, onRetry, error, reason = 'offline', retryCount = 0 }) {
    if (typeof document === 'undefined') return;
    detachOnlineRetryListener();

    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    const actions = document.getElementById('modal-actions');
    const closeBtn = document.getElementById('modal-close-btn');

    const friendlyName = formatModuleName(moduleKey);
    const isUpdateIssue = reason === 'stale_version' || reason === 'chunk_error';

    if (overlay && title && content && actions) {
        if (closeBtn) {
            closeBtn.classList.remove('hidden');
            closeBtn.onclick = () => {
                hideModuleLoadError();
            };
        }

        if (isUpdateIssue) {
            title.innerHTML = `<i class="fas fa-sync-alt text-blue-400 mr-2"></i> Update Available`;
            title.classList.remove('hidden');

            content.innerHTML = `
                <div class="text-center py-2">
                    <div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                        <i class="fas fa-cloud-download-alt text-xl"></i>
                    </div>
                    <p class="text-white font-semibold mb-1">Refresh needed to load ${friendlyName}</p>
                    <p class="text-slate-400 text-xs leading-relaxed">
                        A newer version of Start a Life was deployed while this tab was open. Refresh to load the update—your progress is saved.
                    </p>
                </div>
            `;

            actions.innerHTML = `
                <div class="w-full grid grid-cols-2 gap-2">
                    <button id="module-error-dismiss-btn" class="w-full border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm">
                        Dismiss
                    </button>
                    <button id="module-error-reload-btn" class="w-full btn-primary text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20">
                        <i class="fas fa-sync-alt text-xs"></i> Refresh Game
                    </button>
                </div>
            `;
        } else {
            title.innerHTML = `<i class="fas fa-wifi text-red-400 mr-2"></i> Connection Error`;
            title.classList.remove('hidden');

            const bodyMessage = retryCount >= 1
                ? 'Still unable to reach the server. Check your internet connection, or refresh the game—your progress is saved.'
                : 'A network error occurred while loading this feature. Please check your internet connection and try again.';

            content.innerHTML = `
                <div class="text-center py-2">
                    <div class="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                        <i class="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <p class="text-white font-semibold mb-1">Failed to load ${friendlyName}</p>
                    <p class="text-slate-400 text-xs leading-relaxed">
                        ${bodyMessage}
                    </p>
                </div>
            `;

            const refreshFallbackHtml = retryCount >= 1
                ? `
                    <button id="module-error-reload-btn" class="w-full mt-2 border border-blue-500/30 text-blue-300 font-bold py-2.5 rounded-xl bg-blue-950/30 hover:bg-blue-950/50 transition text-sm flex items-center justify-center gap-1.5">
                        <i class="fas fa-sync-alt text-xs"></i> Refresh Game
                    </button>
                `
                : '';

            actions.innerHTML = `
                <div class="w-full grid grid-cols-2 gap-2">
                    <button id="module-error-dismiss-btn" class="w-full border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm">
                        Dismiss
                    </button>
                    <button id="module-error-retry-btn" class="w-full btn-primary text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20">
                        <i class="fas fa-redo-alt text-xs"></i> Retry
                    </button>
                </div>
                ${refreshFallbackHtml}
            `;
        }

        actions.classList.remove('hidden');

        const retryBtn = document.getElementById('module-error-retry-btn');
        const dismissBtn = document.getElementById('module-error-dismiss-btn');
        const reloadBtn = document.getElementById('module-error-reload-btn');

        if (retryBtn) {
            retryBtn.onclick = () => {
                hideModuleLoadError();
                if (typeof onRetry === 'function') {
                    Promise.resolve(onRetry()).catch(() => {});
                }
            };
        }

        if (dismissBtn) {
            dismissBtn.onclick = () => {
                hideModuleLoadError();
            };
        }

        if (reloadBtn) {
            reloadBtn.onclick = () => {
                reloadBtn.disabled = true;
                reloadBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin text-xs"></i> Refreshing...`;
                attemptSafeReload();
            };
        }

        if (!isUpdateIssue && typeof window !== 'undefined' && typeof onRetry === 'function') {
            _onlineRetryHandler = () => {
                if (!overlay.classList.contains('hidden')) {
                    hideModuleLoadError();
                    Promise.resolve(onRetry()).catch(() => {});
                }
            };
            window.addEventListener('online', _onlineRetryHandler, { once: true });
        }

        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
}

/**
 * Diagnoses a module load failure and either silently saves & refreshes once on stale builds,
 * or displays the appropriate recovery modal.
 * @param {Object} options
 * @param {string} [options.moduleKey]
 * @param {Function} [options.onRetry]
 * @param {Error} [options.error]
 * @param {number} [options.retryCount=0]
 * @returns {Promise<{ handled: boolean, action: string, reason: string }>}
 */
export async function handleModuleLoadFailure({ moduleKey, onRetry, error, retryCount = 0 }) {
    if (_isHandlingFailure) {
        return { handled: false, action: 'skipped', reason: 'already_handling' };
    }

    _isHandlingFailure = true;
    try {
        const reason = await diagnoseModuleLoadError(error);
        if ((reason === 'stale_version' || reason === 'chunk_error') && canAutoReloadForUpdate()) {
            markAutoReloadAttempted();
            await attemptSafeReload();
            return { handled: true, action: 'reloaded', reason };
        }

        showModuleLoadError({ moduleKey, onRetry, error, reason, retryCount });
        return { handled: true, action: 'modal', reason };
    } finally {
        _isHandlingFailure = false;
    }
}

/**
 * Listens for Vite's vite:preloadError event (CSS/dependency preload failure on stale builds)
 * and routes it through the safe recovery pipeline.
 */
export function attachVitePreloadErrorHandler() {
    if (_vitePreloadAttached || typeof window === 'undefined') return;
    _vitePreloadAttached = true;

    _vitePreloadHandler = (event) => {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        handleModuleLoadFailure({ error: event?.payload });
    };

    window.addEventListener('vite:preloadError', _vitePreloadHandler);
}

/**
 * Detaches the vite:preloadError listener.
 */
export function detachVitePreloadErrorHandler() {
    if (typeof window !== 'undefined' && _vitePreloadHandler) {
        window.removeEventListener('vite:preloadError', _vitePreloadHandler);
        _vitePreloadHandler = null;
    }
    _vitePreloadAttached = false;
}

/**
 * Testing helpers for deterministic reload mocking and state reset.
 */
export function _setReloadHandlerForTesting(fn) {
    _reloadHandler = fn;
}

export function _resetRecoveryForTesting() {
    _isHandlingFailure = false;
    _reloadHandler = null;
    detachVitePreloadErrorHandler();
    hideModuleLoadError();
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(RELOAD_STORAGE_KEY);
        }
    } catch (e) {}
}
