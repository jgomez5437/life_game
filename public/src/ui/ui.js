import { Utils } from './utils.js';
import { renderAvatar } from './avatarRenderer.js';

const _elements = {
    get name() { return document.getElementById('header-name'); },
    get age() { return document.getElementById('header-age'); },
    get bank() { return document.getElementById('header-bank'); },
    get healthText() { return document.getElementById('ui-health'); },
    get healthContainer() { return document.getElementById('health-container'); },
    get headerBrand() { return document.getElementById('header-brand'); },
    get userInfo() { return document.getElementById('header-user-info'); },
    get bankWrapper() { return document.getElementById('header-bank-wrapper'); },
    get storeBtn() { return document.getElementById('header-store-btn'); },
    get settingsBtn() { return document.getElementById('header-settings-btn'); },
    get gameContainer() { return document.getElementById('game-container'); },
    get modalOverlay() { return document.getElementById('modal-overlay'); },
    get modalTitle() { return document.getElementById('modal-title'); },
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
    const { title, content, confirmText, cancelText, onConfirm, onClose } = opts;

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

export const UI = {
    /** * @param {Object} stats - { username, name, age, money, city, health }
     */
    updateHeader: (stats) => {
        if (!stats) return;
        // Toggle header element visibility for in-game stats view
        if (_elements.headerBrand) _elements.headerBrand.classList.add('hidden');
        if (_elements.userInfo) _elements.userInfo.classList.remove('hidden');
        if (_elements.bankWrapper) _elements.bankWrapper.classList.remove('hidden');
        if (_elements.settingsBtn) _elements.settingsBtn.classList.remove('hidden');

        // 1. NAME & FLAG UPDATE
        const displayNameRaw = stats.username || stats.name || "Player";
        // Sanitize to prevent XSS
        const displayName = String(displayNameRaw)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const countryCode = Utils.getCountryCode(stats.city);
        
        let flagHtml = "";
        
        if (countryCode) {
            flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                             srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                             width="20" 
                             alt="${stats.city}" 
                             class="ml-2 inline-block shadow-sm rounded-sm" 
                             style="vertical-align: text-bottom;">`;
        }

        if (_elements.name) _elements.name.innerHTML = `${displayName} ${flagHtml}`;

        // 2. AGE UPDATE
        if (stats.age !== undefined && _elements.age) _elements.age.innerText = stats.age;

        // 3. HEALTH UPDATE
        if (stats.health !== undefined && _elements.healthText && _elements.healthContainer) {
            _elements.healthText.innerText = `${stats.health}%`;
            
            _elements.healthContainer.classList.remove('text-green-400', 'text-yellow-400', 'text-red-500');
            if (stats.health > 70) {
                _elements.healthContainer.classList.add('text-green-400');
            } else if (stats.health > 30) {
                _elements.healthContainer.classList.add('text-yellow-400');
            } else {
                _elements.healthContainer.classList.add('text-red-500');
            }
        }

        // 4. BANK UPDATE
        if (stats.money !== undefined && _elements.bank) {
            _elements.bank.innerText = Utils.formatMoney(stats.money);
            
            _elements.bank.classList.remove('text-green-400', 'text-red-400');
            if (stats.money < 0) {
                _elements.bank.classList.add('text-red-400');
            } else {
                _elements.bank.classList.add('text-green-400');
            }
        }

        // 5. AVATAR UPDATE
        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer) {
            avatarContainer.innerHTML = renderAvatar(stats);
        }
    },

    /**
     * Resets header to clean login branding for login screen and character creation.
     */
    resetHeader: () => {
        if (_elements.headerBrand) _elements.headerBrand.classList.remove('hidden');
        if (_elements.userInfo) _elements.userInfo.classList.add('hidden');
        if (_elements.bankWrapper) _elements.bankWrapper.classList.add('hidden');
        if (_elements.storeBtn) _elements.storeBtn.classList.add('hidden');
        if (_elements.settingsBtn) _elements.settingsBtn.classList.add('hidden');

        if (_elements.name) _elements.name.innerText = '—';
        if (_elements.age) _elements.age.innerText = '—';
        if (_elements.healthText) _elements.healthText.innerText = '100%';
        if (_elements.healthContainer) {
            _elements.healthContainer.classList.remove('text-yellow-400', 'text-red-500');
            _elements.healthContainer.classList.add('text-green-400');
        }
        if (_elements.bank) {
            _elements.bank.innerText = Utils.formatMoney(0);
            _elements.bank.classList.remove('text-red-400');
            _elements.bank.classList.add('text-green-400');
        }
        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer) {
            avatarContainer.innerHTML = '<i class="fas fa-user text-slate-400 text-base"></i>';
        }
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
        let title, content, confirmText, cancelText, onConfirm, onClose;

        if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
            title = titleOrOptions.title || '';
            content = titleOrOptions.content || titleOrOptions.htmlContent || '';
            confirmText = titleOrOptions.confirmText;
            cancelText = titleOrOptions.cancelText;
            onConfirm = titleOrOptions.onConfirm;
            onClose = titleOrOptions.onClose;
        } else if (typeof titleOrOptions === 'string' && titleOrOptions.trim().startsWith('<') && !htmlContent) {
            title = '';
            content = titleOrOptions;
        } else {
            title = titleOrOptions || '';
            content = htmlContent || '';
        }

        const opts = { title, content, confirmText, cancelText, onConfirm, onClose };
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
    }
};