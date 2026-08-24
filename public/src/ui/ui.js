import { Utils } from './utils.js';
import { renderAvatar } from './avatarRenderer.js';
import { state } from '../core/state.js';

const _elements = {
    get name() { return document.getElementById('header-name'); },
    get age() { return document.getElementById('header-age'); },
    get bank() { return document.getElementById('header-bank'); },
    get healthText() { return document.getElementById('ui-health'); },
    get healthContainer() { return document.getElementById('health-container'); },
    get healthBarFill() { return document.getElementById('health-bar-fill'); },
    get happinessText() { return document.getElementById('ui-happiness'); },
    get happinessContainer() { return document.getElementById('happiness-container'); },
    get happinessBarFill() { return document.getElementById('happiness-bar-fill'); },
    get smartsText() { return document.getElementById('ui-smarts'); },
    get smartsContainer() { return document.getElementById('smarts-container'); },
    get smartsBarFill() { return document.getElementById('smarts-bar-fill'); },
    get looksText() { return document.getElementById('ui-looks'); },
    get looksContainer() { return document.getElementById('looks-container'); },
    get looksBarFill() { return document.getElementById('looks-bar-fill'); },
    get headerMainRow() { return document.getElementById('header-main-row'); },
    get statsRibbon() { return document.getElementById('header-stats-ribbon'); },
    get headerBrand() { return document.getElementById('header-brand'); },
    get userInfo() { return document.getElementById('header-user-info'); },
    get bankWrapper() { return document.getElementById('header-bank-wrapper'); },
    get storeBtn() { return document.getElementById('header-store-btn'); },
    get settingsBtn() { return document.getElementById('header-settings-btn'); },
    get gameContainer() { return document.getElementById('game-container'); },
    get bottomNav() { return document.getElementById('bottom-nav'); },
    get bottomNavContainer() { return document.getElementById('bottom-nav-container'); },
    get navBtnAssets() { return document.getElementById('nav-btn-assets'); },
    get navBtnWork() { return document.getElementById('nav-btn-work'); },
    get navBtnCenter() { return document.getElementById('nav-btn-center'); },
    get navBtnSocial() { return document.getElementById('nav-btn-social'); },
    get navBtnMore() { return document.getElementById('nav-btn-more'); },
    get modalOverlay() { return document.getElementById('modal-overlay'); },
    get modalHeader() { return document.getElementById('modal-header'); },
    get modalTitle() { return document.getElementById('modal-title'); },
    get modalCloseBtn() { return document.getElementById('modal-close-btn'); },
    get modalContent() { return document.getElementById('modal-content'); },
    get modalBtn() { return document.getElementById('modal-btn'); },
    get modalActions() { return document.getElementById('modal-actions'); }
};

//Global UI object

// Modal stack to prevent callback loss when modals overlap
const _modalStack = [];
let _currentModalConfig = null;

function _pushCurrentModal() {
    // Only push if a modal is currently visible
    if (_elements.modalOverlay && !_elements.modalOverlay.classList.contains('hidden') && _currentModalConfig) {
        _modalStack.push({ ..._currentModalConfig });
    }
}

function _renderInfoModal(title, message, onClose = null) {
    if (_elements.modalTitle) {
        _elements.modalTitle.innerText = title;
        _elements.modalTitle.textContent = title;
        _elements.modalTitle.classList.remove('hidden');
    }
    if (_elements.modalCloseBtn) {
        _elements.modalCloseBtn.classList.add('hidden');
    }
    if (_elements.modalContent) {
        _elements.modalContent.innerHTML = message;
    }
    
    if (_elements.modalActions) {
        _elements.modalActions.innerHTML = `
            <button id="modal-btn" class="w-full btn-primary text-white font-bold py-3 rounded-lg">Dismiss</button>
        `;
        _elements.modalActions.classList.remove('hidden');
    }

    const newDismissBtn = document.getElementById('modal-btn');
    if (newDismissBtn) {
        newDismissBtn.onclick = () => {
            UI.hideModal();
            if (onClose) onClose();
        };
    }

    if (_elements.modalOverlay) {
        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    }
}

function _renderConfirmModal(title, message, confirmText, onConfirm, cancelText = 'Cancel', onCancel = null) {
    if (_elements.modalTitle) {
        _elements.modalTitle.innerText = title;
        _elements.modalTitle.textContent = title;
        _elements.modalTitle.classList.remove('hidden');
    }
    if (_elements.modalCloseBtn) {
        _elements.modalCloseBtn.classList.add('hidden');
    }
    if (_elements.modalContent) {
        _elements.modalContent.innerHTML = message;
    }

    if (_elements.modalActions) {
        _elements.modalActions.innerHTML = `
            <div class="w-full grid grid-cols-1 gap-2">
                <button id="modal-confirm" class="w-full btn-primary text-white font-bold py-3 rounded-lg">${confirmText}</button>
                <button id="modal-cancel" class="w-full border border-slate-700 text-slate-300 font-bold py-3 rounded-lg bg-slate-800">${cancelText}</button>
            </div>
        `;
        _elements.modalActions.classList.remove('hidden');
    }

    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            UI.hideModal();
            if (onConfirm) onConfirm();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            UI.hideModal();
            if (onCancel) onCancel();
        };
    }

    if (_elements.modalOverlay) {
        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    }
}

function _renderCustomModal(opts) {
    const { title, content, confirmText, cancelText, onConfirm, onClose, showCloseBtn = false } = opts;

    if (_elements.modalTitle) {
        _elements.modalTitle.innerText = title;
        _elements.modalTitle.textContent = title;
        if (!title) {
            _elements.modalTitle.classList.add('hidden');
        } else {
            _elements.modalTitle.classList.remove('hidden');
        }
    }
    if (_elements.modalCloseBtn) {
        if (showCloseBtn === true) {
            _elements.modalCloseBtn.onclick = () => {
                UI.hideModal();
                if (onClose) onClose();
            };
            _elements.modalCloseBtn.classList.remove('hidden');
        } else {
            _elements.modalCloseBtn.classList.add('hidden');
        }
    }
    if (_elements.modalContent) {
        _elements.modalContent.innerHTML = content;
    }

    if (_elements.modalActions) {
        if (confirmText || onConfirm) {
            _elements.modalActions.innerHTML = `
                <div class="w-full grid ${cancelText ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
                    ${cancelText ? `<button id="custom-modal-cancel" class="w-full border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm">${cancelText}</button>` : ''}
                    <button id="custom-modal-confirm" class="w-full btn-primary text-white font-bold py-2.5 rounded-xl text-sm">${confirmText || 'Confirm'}</button>
                </div>
            `;
            _elements.modalActions.classList.remove('hidden');

            const confirmBtn = document.getElementById('custom-modal-confirm');
            const cancelBtn = document.getElementById('custom-modal-cancel');

            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    UI.hideModal();
                    if (onConfirm) onConfirm();
                };
            }
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    UI.hideModal();
                    if (onClose) onClose();
                };
            }
        } else {
            _elements.modalActions.innerHTML = '';
            _elements.modalActions.classList.add('hidden');
        }
    }

    if (_elements.modalOverlay) {
        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    }
}

function _restorePreviousModal() {
    if (_modalStack.length === 0) {
        _currentModalConfig = null;
        if (_elements.modalOverlay) {
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
        }
        return;
    }
    const prev = _modalStack.pop();
    _currentModalConfig = prev;
    if (prev.type === 'custom' && prev.options) {
        _renderCustomModal(prev.options);
    } else if (prev.type === 'confirm') {
        _renderConfirmModal(prev.title, prev.message, prev.confirmText, prev.onConfirm, prev.cancelText, prev.onCancel);
    } else if (prev.type === 'info') {
        _renderInfoModal(prev.title, prev.message, prev.onClose);
    }
}

let _lastHeaderStats = null;

export const UI = {
    /**
     * Spawns a transient floating badge indicator and pulse effect over a header stat pill or bank.
     * @param {string|HTMLElement} target - 'health' | 'happiness' | 'smarts' | 'looks' | 'money' or DOM element
     * @param {number} delta - Numerical change (+15, -10, +5200, etc.)
     * @param {string} [customLabel] - Optional label (e.g. 'Smarts', 'Health', etc.)
     * @param {string} [customEmoji] - Optional emoji (e.g. '🧠', '❤️', '💵')
     * @param {boolean} [isMoney] - Whether this is a monetary change
     */
    showStatDelta: (target, delta, customLabel = '', customEmoji = '', isMoney = false) => {
        if (!delta || isNaN(delta) || delta === 0) return;

        let container = null;
        let defaultLabel = '';
        let defaultEmoji = '';

        if (typeof target === 'string') {
            switch (target.toLowerCase()) {
                case 'health':
                    container = _elements.healthContainer;
                    defaultLabel = 'Health';
                    defaultEmoji = '❤️';
                    break;
                case 'happiness':
                    container = _elements.happinessContainer;
                    defaultLabel = 'Happiness';
                    defaultEmoji = '😊';
                    break;
                case 'smarts':
                    container = _elements.smartsContainer;
                    defaultLabel = 'Smarts';
                    defaultEmoji = '🧠';
                    break;
                case 'looks':
                    container = _elements.looksContainer;
                    defaultLabel = 'Looks';
                    defaultEmoji = '✨';
                    break;
                case 'money':
                case 'bank':
                    container = _elements.bankWrapper || _elements.bank;
                    defaultLabel = '';
                    defaultEmoji = '💵';
                    isMoney = true;
                    break;
                default:
                    container = document.getElementById(target);
            }
        } else if (target && target.nodeType) {
            container = target;
        }

        if (!container) return;

        const isPositive = delta > 0;
        const sign = isPositive ? '+' : '-';
        const label = customLabel || defaultLabel;
        const emoji = customEmoji || defaultEmoji;

        let text = '';
        if (isMoney) {
            const formattedAbs = Utils.formatMoney(Math.abs(delta));
            text = `${sign}${formattedAbs} ${emoji}`.trim();
        } else {
            const absVal = Math.abs(delta);
            const labelPart = label ? ` ${label}` : '';
            const emojiPart = emoji ? ` ${emoji}` : '';
            text = `${sign}${absVal}%${labelPart}${emojiPart}`.trim();
        }

        const badge = document.createElement('div');
        badge.className = `floating-stat-delta ${isPositive ? 'delta-positive' : 'delta-negative'}`;
        badge.textContent = text;

        // Container pulse effect
        const pulseClass = isPositive ? 'pill-pulse-pos' : 'pill-pulse-neg';
        container.classList.remove('pill-pulse-pos', 'pill-pulse-neg');
        if (container.offsetWidth !== undefined) {
            void container.offsetWidth;
        }
        container.classList.add(pulseClass);
        setTimeout(() => {
            if (container) container.classList.remove(pulseClass);
        }, 650);

        // Append badge
        container.appendChild(badge);

        // Auto remove badge on animation end or fallback timeout
        const removeBadge = () => {
            if (badge && badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        };

        badge.addEventListener('animationend', removeBadge, { once: true });
        setTimeout(removeBadge, 1400);
    },

    /**
     * Returns current cached header stats for testing or debugging.
     */
    getLastHeaderStats: () => _lastHeaderStats,

    /**
     * Sets cached header stats baseline.
     */
    setLastHeaderStats: (stats) => {
        _lastHeaderStats = stats ? { ...stats } : null;
    },

    /** * @param {Object} stats - { username, name, age, money, city, health, happiness, smarts, looks }
     */
    updateHeader: (stats) => {
        if (!stats) return;
        // Toggle header element visibility for in-game stats view
        if (_elements.headerBrand) _elements.headerBrand.classList.add('hidden');
        if (_elements.headerMainRow) _elements.headerMainRow.classList.remove('hidden');
        if (_elements.statsRibbon) _elements.statsRibbon.classList.remove('hidden');
        if (_elements.userInfo) _elements.userInfo.classList.remove('hidden');
        if (_elements.bankWrapper) _elements.bankWrapper.classList.remove('hidden');
        if (_elements.settingsBtn) _elements.settingsBtn.classList.remove('hidden');

        // 1. NAME & FLAG UPDATE
        const displayNameRaw = stats.username || stats.name || "Player";
        const displayName = Utils.escapeHtml(displayNameRaw);

        const countryCode = Utils.getCountryCode(stats.city);
        
        let flagHtml = "";
        
        if (countryCode) {
            flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                             srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                             width="20" 
                             alt="${Utils.escapeHtml(stats.city || '')}" 
                             class="ml-1.5 inline-block shadow-sm rounded-sm" 
                             style="vertical-align: text-bottom;">`;
        }

        if (_elements.name) _elements.name.innerHTML = `${displayName} ${flagHtml}`;

        // 2. AGE UPDATE
        if (stats.age !== undefined && _elements.age) {
            _elements.age.innerText = stats.age;
            _elements.age.textContent = String(stats.age);
        }

        // 3. HEALTH UPDATE
        const healthVal = stats.health !== undefined ? stats.health : (stats.stats?.health !== undefined ? stats.stats.health : 100);
        if (_elements.healthText) {
            _elements.healthText.innerText = `${healthVal}%`;
            _elements.healthText.textContent = `${healthVal}%`;
        }
        if (_elements.healthBarFill) {
            _elements.healthBarFill.style.width = `${Math.min(100, Math.max(0, healthVal))}%`;
        }
        if (_elements.healthContainer) {
            _elements.healthContainer.classList.remove('text-green-400', 'text-yellow-400', 'text-red-500');
            if (healthVal > 70) {
                _elements.healthContainer.classList.add('text-green-400');
            } else if (healthVal > 30) {
                _elements.healthContainer.classList.add('text-yellow-400');
            } else {
                _elements.healthContainer.classList.add('text-red-500');
            }
        }

        // 4. HAPPINESS UPDATE
        const happinessVal = stats.happiness !== undefined ? stats.happiness : (stats.stats?.happiness !== undefined ? stats.stats.happiness : 100);
        if (_elements.happinessText) {
            _elements.happinessText.innerText = `${happinessVal}%`;
            _elements.happinessText.textContent = `${happinessVal}%`;
        }
        if (_elements.happinessBarFill) {
            _elements.happinessBarFill.style.width = `${Math.min(100, Math.max(0, happinessVal))}%`;
        }
        if (_elements.happinessContainer) {
            _elements.happinessContainer.classList.remove('text-amber-400', 'text-yellow-400', 'text-red-500');
            if (happinessVal > 70) {
                _elements.happinessContainer.classList.add('text-amber-400');
            } else if (happinessVal > 30) {
                _elements.happinessContainer.classList.add('text-yellow-400');
            } else {
                _elements.happinessContainer.classList.add('text-red-500');
            }
        }

        // 5. SMARTS UPDATE
        const smartsVal = stats.smarts !== undefined ? stats.smarts : (stats.stats?.smarts !== undefined ? stats.stats.smarts : 50);
        if (_elements.smartsText) {
            _elements.smartsText.innerText = `${smartsVal}%`;
            _elements.smartsText.textContent = `${smartsVal}%`;
        }
        if (_elements.smartsBarFill) {
            _elements.smartsBarFill.style.width = `${Math.min(100, Math.max(0, smartsVal))}%`;
        }
        if (_elements.smartsContainer) {
            _elements.smartsContainer.classList.remove('text-blue-400', 'text-indigo-300', 'text-slate-400');
            if (smartsVal > 70) {
                _elements.smartsContainer.classList.add('text-blue-400');
            } else if (smartsVal > 30) {
                _elements.smartsContainer.classList.add('text-indigo-300');
            } else {
                _elements.smartsContainer.classList.add('text-slate-400');
            }
        }

        // 6. LOOKS UPDATE
        const looksVal = stats.looks !== undefined ? stats.looks : (stats.stats?.looks !== undefined ? stats.stats.looks : 50);
        if (_elements.looksText) {
            _elements.looksText.innerText = `${looksVal}%`;
            _elements.looksText.textContent = `${looksVal}%`;
        }
        if (_elements.looksBarFill) {
            _elements.looksBarFill.style.width = `${Math.min(100, Math.max(0, looksVal))}%`;
        }
        if (_elements.looksContainer) {
            _elements.looksContainer.classList.remove('text-pink-400', 'text-purple-300', 'text-slate-400');
            if (looksVal > 70) {
                _elements.looksContainer.classList.add('text-pink-400');
            } else if (looksVal > 30) {
                _elements.looksContainer.classList.add('text-purple-300');
            } else {
                _elements.looksContainer.classList.add('text-slate-400');
            }
        }

        // 7. BANK UPDATE
        const moneyVal = stats.money !== undefined ? stats.money : 0;
        if (stats.money !== undefined && _elements.bank) {
            const formattedMoney = Utils.formatMoney(stats.money);
            _elements.bank.innerText = formattedMoney;
            _elements.bank.textContent = formattedMoney;
            
            _elements.bank.classList.remove('text-green-400', 'text-red-400');
            if (stats.money < 0) {
                _elements.bank.classList.add('text-red-400');
            } else {
                _elements.bank.classList.add('text-green-400');
            }
        }

        // 8. STAT DELTA BADGES (Transient Indicators)
        if (_lastHeaderStats !== null) {
            const deltaHealth = healthVal - _lastHeaderStats.health;
            const deltaHappiness = happinessVal - _lastHeaderStats.happiness;
            const deltaSmarts = smartsVal - _lastHeaderStats.smarts;
            const deltaLooks = looksVal - _lastHeaderStats.looks;
            const deltaMoney = (stats.money !== undefined && _lastHeaderStats.money !== undefined)
                ? (moneyVal - _lastHeaderStats.money)
                : 0;

            if (deltaHealth !== 0) UI.showStatDelta('health', deltaHealth, 'Health', '❤️');
            if (deltaHappiness !== 0) UI.showStatDelta('happiness', deltaHappiness, 'Happiness', '😊');
            if (deltaSmarts !== 0) UI.showStatDelta('smarts', deltaSmarts, 'Smarts', '🧠');
            if (deltaLooks !== 0) UI.showStatDelta('looks', deltaLooks, 'Looks', '✨');
            if (deltaMoney !== 0) UI.showStatDelta('money', deltaMoney, '', '💵', true);
        }

        // Cache current stats
        _lastHeaderStats = {
            health: healthVal,
            happiness: happinessVal,
            smarts: smartsVal,
            looks: looksVal,
            money: stats.money !== undefined ? moneyVal : (_lastHeaderStats?.money ?? 0)
        };

        // 9. AVATAR UPDATE
        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer) {
            avatarContainer.innerHTML = renderAvatar(stats);
        }
    },

    /**
     * Resets header to clean login branding for login screen and character creation.
     */
    resetHeader: () => {
        _lastHeaderStats = null;
        if (_elements.headerBrand) _elements.headerBrand.classList.remove('hidden');
        if (_elements.headerMainRow) _elements.headerMainRow.classList.add('hidden');
        if (_elements.statsRibbon) _elements.statsRibbon.classList.add('hidden');
        if (_elements.userInfo) _elements.userInfo.classList.add('hidden');
        if (_elements.bankWrapper) _elements.bankWrapper.classList.add('hidden');
        if (_elements.storeBtn) _elements.storeBtn.classList.add('hidden');
        if (_elements.settingsBtn) _elements.settingsBtn.classList.add('hidden');

        if (_elements.name) {
            _elements.name.innerHTML = '—';
            _elements.name.textContent = '—';
        }
        if (_elements.age) {
            _elements.age.innerText = '—';
            _elements.age.textContent = '—';
        }
        if (_elements.healthText) {
            _elements.healthText.innerText = '100%';
            _elements.healthText.textContent = '100%';
        }
        if (_elements.healthBarFill) {
            _elements.healthBarFill.style.width = '100%';
        }
        if (_elements.healthContainer) {
            _elements.healthContainer.classList.remove('text-yellow-400', 'text-red-500');
            _elements.healthContainer.classList.add('text-green-400');
        }
        if (_elements.happinessText) {
            _elements.happinessText.innerText = '100%';
            _elements.happinessText.textContent = '100%';
        }
        if (_elements.happinessBarFill) {
            _elements.happinessBarFill.style.width = '100%';
        }
        if (_elements.happinessContainer) {
            _elements.happinessContainer.classList.remove('text-yellow-400', 'text-red-500');
            _elements.happinessContainer.classList.add('text-amber-400');
        }
        if (_elements.smartsText) {
            _elements.smartsText.innerText = '50%';
            _elements.smartsText.textContent = '50%';
        }
        if (_elements.smartsBarFill) {
            _elements.smartsBarFill.style.width = '50%';
        }
        if (_elements.smartsContainer) {
            _elements.smartsContainer.classList.remove('text-indigo-300', 'text-slate-400');
            _elements.smartsContainer.classList.add('text-blue-400');
        }
        if (_elements.looksText) {
            _elements.looksText.innerText = '50%';
            _elements.looksText.textContent = '50%';
        }
        if (_elements.looksBarFill) {
            _elements.looksBarFill.style.width = '50%';
        }
        if (_elements.looksContainer) {
            _elements.looksContainer.classList.remove('text-purple-300', 'text-slate-400');
            _elements.looksContainer.classList.add('text-pink-400');
        }
        if (_elements.bank) {
            const zeroMoney = Utils.formatMoney(0);
            _elements.bank.innerText = zeroMoney;
            _elements.bank.textContent = zeroMoney;
            _elements.bank.classList.remove('text-red-400');
            _elements.bank.classList.add('text-green-400');
        }
        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer) {
            avatarContainer.innerHTML = '<i class="fas fa-user text-slate-400 text-base"></i>';
        }
        UI.hideBottomNav();
    },

    /**
     * Checks if a modal dialog is currently open.
     * @returns {boolean}
     */
    isModalOpen: () => {
        const overlay = _elements.modalOverlay || document.getElementById('modal-overlay');
        return !!(overlay && !overlay.classList.contains('hidden'));
    },

    /**
     * Checks if bottom navigation bar is enabled in user preferences (default: true).
     * @returns {boolean}
     */
    isBottomNavEnabled: () => {
        try {
            return localStorage.getItem('life_game_bottom_nav') !== 'false';
        } catch (e) {
            return true;
        }
    },

    /**
     * Updates the persistent global bottom navigation bar state and active tab.
     * @param {'home'|'assets'|'work'|'social'|'more'} activeTab
     */
    updateBottomNav: (activeTab = 'home') => {
        const bottomNav = _elements.bottomNav || document.getElementById('bottom-nav');
        if (!bottomNav) return;

        // Guard 1: Never show bottom navigation if character is dead
        if (state?.gameState?.user?.lifeStatus === 'Deceased') {
            UI.hideBottomNav();
            return;
        }

        // Guard 2: Never show bottom navigation if a funeral or teacher replacement is pending
        if ((state?.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0) ||
            (state?.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0)) {
            UI.hideBottomNav();
            return;
        }

        // Guard 3: User preference check
        if (!UI.isBottomNavEnabled()) {
            UI.hideBottomNav();
            return;
        }

        bottomNav.classList.remove('hidden');

        // Configure Dynamic Center Button (Age Up on Home, Home on Sub-Screens)
        const centerBtn = _elements.navBtnCenter || document.getElementById('nav-btn-center');
        if (centerBtn) {
            if (activeTab === 'home') {
                centerBtn.dataset.action = 'ageUp';
                centerBtn.className = 'btn-age-up btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center transition hover:brightness-110';
                centerBtn.innerHTML = '<i class="fas fa-arrow-up mb-1 text-lg sm:text-xl"></i><span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Age Up +</span>';
                centerBtn.title = 'Age Up (+1 Year)';
            } else {
                centerBtn.dataset.action = 'renderLifeDashboard';
                centerBtn.className = 'btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition';
                centerBtn.innerHTML = '<i class="fas fa-home mb-1 text-lg sm:text-xl text-emerald-400"></i><span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Home</span>';
                centerBtn.title = 'Return to Dashboard & Life History';
            }
        }

        // Tab mapping for active styles
        const tabs = [
            { key: 'assets', btn: _elements.navBtnAssets || document.getElementById('nav-btn-assets'), tabClass: 'nav-tab-assets' },
            { key: 'work', btn: _elements.navBtnWork || document.getElementById('nav-btn-work'), tabClass: 'nav-tab-work' },
            { key: 'home', btn: centerBtn, tabClass: 'nav-tab-home' },
            { key: 'social', btn: _elements.navBtnSocial || document.getElementById('nav-btn-social'), tabClass: 'nav-tab-social' },
            { key: 'more', btn: _elements.navBtnMore || document.getElementById('nav-btn-more'), tabClass: 'nav-tab-more' }
        ];

        tabs.forEach(t => {
            if (!t.btn) return;
            t.btn.classList.remove('nav-tab-active', 'nav-tab-assets', 'nav-tab-work', 'nav-tab-home', 'nav-tab-social', 'nav-tab-more');
            const icon = t.btn.querySelector('i');
            if (icon) icon.classList.remove('nav-icon-bounce');

            if (t.key === activeTab) {
                t.btn.classList.add('nav-tab-active', t.tabClass);
                if (icon) {
                    void icon.offsetWidth;
                    icon.classList.add('nav-icon-bounce');
                }
            }
        });
    },

    /**
     * Hides the bottom navigation bar (used for login, character creation, death screen, and prison).
     */
    hideBottomNav: () => {
        const bottomNav = _elements.bottomNav || document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.classList.add('hidden');
        }
        const tabs = [
            _elements.navBtnAssets || document.getElementById('nav-btn-assets'),
            _elements.navBtnWork || document.getElementById('nav-btn-work'),
            _elements.navBtnCenter || document.getElementById('nav-btn-center'),
            _elements.navBtnSocial || document.getElementById('nav-btn-social'),
            _elements.navBtnMore || document.getElementById('nav-btn-more')
        ];
        tabs.forEach(btn => {
            if (!btn) return;
            btn.classList.remove('nav-tab-active', 'nav-tab-assets', 'nav-tab-work', 'nav-tab-home', 'nav-tab-social', 'nav-tab-more');
            const icon = btn.querySelector('i');
            if (icon) icon.classList.remove('nav-icon-bounce');
        });
    },

    /**
     * @param {string} htmlContent
     */
    renderScreen: (htmlContent) => {
        const container = _elements.gameContainer || document.getElementById('game-container');
        if (container) container.innerHTML = htmlContent;
    },

    /**
     * @param {string} title
     * @param {string} message
     * @param {function} onClose
     */
    showModal: (title, message, onClose = null) => {
        _pushCurrentModal();
        _currentModalConfig = { type: 'info', title, message, onClose };
        _renderInfoModal(title, message, onClose);
    },

    /**
     * @param {string} title
     * @param {string} message 
     * @param {string} confirmText
     * @param {function} onConfirm
     * @param {string} [cancelText='Cancel']
     * @param {function} [onCancel=null]
     */
    showConfirm: (title, message, confirmText, onConfirm, cancelText = 'Cancel', onCancel = null) => {
        _pushCurrentModal();
        _currentModalConfig = { type: 'confirm', title, message, confirmText, onConfirm, cancelText, onCancel };
        _renderConfirmModal(title, message, confirmText, onConfirm, cancelText, onCancel);
    },

    /**
     * @param {string|Object} titleOrOptions
     * @param {string} [htmlContent]
     */
    showCustomModal: (titleOrOptions, htmlContent) => {
        _pushCurrentModal();
        let title, content, confirmText, cancelText, onConfirm, onClose, showCloseBtn;

        if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
            title = titleOrOptions.title || '';
            content = titleOrOptions.content || titleOrOptions.htmlContent || '';
            confirmText = titleOrOptions.confirmText;
            cancelText = titleOrOptions.cancelText;
            onConfirm = titleOrOptions.onConfirm;
            onClose = titleOrOptions.onClose;
            showCloseBtn = titleOrOptions.showCloseBtn;
        } else if (typeof titleOrOptions === 'string' && titleOrOptions.trim().startsWith('<') && !htmlContent) {
            title = '';
            content = titleOrOptions;
        } else {
            title = titleOrOptions || '';
            content = htmlContent || '';
        }

        const opts = { title, content, confirmText, cancelText, onConfirm, onClose, showCloseBtn };
        _currentModalConfig = { type: 'custom', options: opts };
        _renderCustomModal(opts);
    },

    /**
     * Replaces the current modal's content without pushing to the modal stack.
     * Used for transitions within the same flow (e.g., spin animation -> result).
     * @param {string} title
     * @param {string} htmlContent
     */
    replaceModalContent: (title, htmlContent) => {
        if (_currentModalConfig) {
            if (_currentModalConfig.type === 'custom' && _currentModalConfig.options) {
                _currentModalConfig.options.title = title;
                _currentModalConfig.options.content = htmlContent;
                _currentModalConfig.options.confirmText = null;
                _currentModalConfig.options.cancelText = null;
            } else {
                _currentModalConfig.title = title;
                _currentModalConfig.message = htmlContent;
            }
        }
        if (_elements.modalTitle) {
            _elements.modalTitle.innerText = title;
            _elements.modalTitle.textContent = title;
            if (!title) {
                _elements.modalTitle.classList.add('hidden');
            } else {
                _elements.modalTitle.classList.remove('hidden');
            }
        }
        if (_elements.modalContent) {
            _elements.modalContent.innerHTML = htmlContent;
        }
        // Clear any existing action buttons since this is a content-only replacement
        if (_elements.modalActions) {
            _elements.modalActions.innerHTML = '';
            _elements.modalActions.classList.add('hidden');
        }
        if (_elements.modalCloseBtn) {
            _elements.modalCloseBtn.classList.remove('hidden');
            _elements.modalCloseBtn.onclick = () => {
                UI.hideModal();
            };
        }
    },

    hideModal: () => {
        _restorePreviousModal();
    },

    closeAllModals: () => {
        _modalStack.length = 0;
        _currentModalConfig = null;
        if (_elements.modalOverlay) {
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
        }
    },

    /**
     * Renders a centered loading screen with animated spinner and custom messages.
     * @param {string} [title="Loading..."]
     * @param {string} [subtitle="Please wait a moment..."]
     */
    renderLoadingScreen: (title = "Loading...", subtitle = "Please wait a moment...") => {
        UI.resetHeader();
        const html = `
        <div class="h-full flex flex-col items-center justify-center fade-in text-center p-6 select-none">
            <div class="mb-6 relative">
                <div class="absolute inset-0 bg-blue-500 blur-2xl opacity-25 rounded-full"></div>
                <i class="fas fa-globe-americas text-7xl text-blue-400 relative z-10 animate-pulse"></i>
            </div>
            <i class="fas fa-circle-notch fa-spin text-4xl text-blue-400 mb-4"></i>
            <h2 class="text-xl font-bold text-white mb-1 tracking-wide">${title}</h2>
            <p class="text-slate-400 text-sm max-w-xs leading-relaxed">${subtitle}</p>
        </div>
        `;
        UI.renderScreen(html);
    },

    /**
     * Centers or scrolls an active tab element into view inside a horizontally scrollable container.
     * @param {string|HTMLElement} container - The container element or its ID
     * @param {string|HTMLElement} activeElement - The active tab element or its CSS selector
     * @param {Object} [options={}] - Options { behavior: 'smooth'|'auto', align: 'center'|'nearest' }
     */
    scrollTabIntoView: (container, activeElement, options = {}) => {
        const containerEl = typeof container === 'string' ? document.getElementById(container) : container;
        if (!containerEl) return;

        const el = typeof activeElement === 'string' ? containerEl.querySelector(activeElement) : activeElement;
        if (!el) return;

        const behavior = options.behavior || 'smooth';
        const align = options.align || 'center';

        // Check if layout metrics exist (browser DOM vs test DOM)
        if (typeof el.getBoundingClientRect === 'function' && typeof containerEl.getBoundingClientRect === 'function') {
            const containerRect = containerEl.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();

            if (containerRect.width > 0 && elRect.width > 0) {
                if (align === 'center') {
                    // Center the active tab horizontally within container
                    const targetScrollLeft = (el.offsetLeft - containerEl.offsetLeft) - (containerEl.clientWidth / 2) + (el.clientWidth / 2);
                    if (typeof containerEl.scrollTo === 'function') {
                        containerEl.scrollTo({
                            left: Math.max(0, targetScrollLeft),
                            behavior: behavior
                        });
                    } else {
                        containerEl.scrollLeft = Math.max(0, targetScrollLeft);
                    }
                    return;
                } else if (align === 'nearest') {
                    if (elRect.left < containerRect.left) {
                        const diff = containerRect.left - elRect.left;
                        containerEl.scrollLeft = Math.max(0, containerEl.scrollLeft - diff);
                    } else if (elRect.right > containerRect.right) {
                        const diff = elRect.right - containerRect.right;
                        containerEl.scrollLeft = containerEl.scrollLeft + diff;
                    }
                    return;
                }
            }
        }

        // Fallback using offsetLeft / offsetWidth
        if (el.offsetLeft !== undefined && containerEl.clientWidth > 0) {
            const targetOffset = el.offsetLeft - (containerEl.clientWidth / 2) + ((el.offsetWidth || 0) / 2);
            containerEl.scrollLeft = Math.max(0, targetOffset);
            return;
        }

        // Native standard scrollIntoView fallback
        if (typeof el.scrollIntoView === 'function') {
            try {
                el.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
            } catch (e) {
                // Ignore unsupported scrollIntoView option errors in older environments
            }
        }
    },

    /**
     * Preserves scroll position across re-renders, and ensures active tab is locked/centered in view.
     * @param {string|HTMLElement} container - The container element or its ID
     * @param {string|HTMLElement} [activeElement] - The active tab element or its CSS selector
     * @param {number} [savedScrollLeft] - Optional previous scrollLeft captured before re-render
     */
    preserveTabScroll: (container, activeElement = null, savedScrollLeft = null) => {
        const containerEl = typeof container === 'string' ? document.getElementById(container) : container;
        if (!containerEl) return;

        if (typeof savedScrollLeft === 'number' && savedScrollLeft > 0) {
            containerEl.scrollLeft = savedScrollLeft;
        }

        if (activeElement) {
            // Check if active tab is visible; if not or if switching tabs, scroll it into view
            UI.scrollTabIntoView(containerEl, activeElement, { behavior: 'auto', align: 'center' });
        }
    }
};