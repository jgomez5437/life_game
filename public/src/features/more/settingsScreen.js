import { state, hasPurchasedPack } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { saveGame, resetGame } from '../../core/main.js';
import { renderLifeDashboard } from '../player/mainScreen.js';
import { logout, getAuthToken } from '../../auth/auth.js';
import { getAchievementProgress } from '../../core/achievementManager.js';
import { SoundManager } from '../../core/soundManager.js';

const APP_VERSION = '1.7.2';
const MIN_FEEDBACK_LENGTH = 5;
const MAX_FEEDBACK_LENGTH = 2000;

export function openSettingsModal() {
    const isCloud = !!state.userAuthId;
    const modeLabel = isCloud ? 'Cloud Sync Active' : 'Guest Local Mode';
    const modeBadgeColor = isCloud ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50' : 'bg-amber-950/60 text-amber-400 border-amber-500/50';
    
    const sfxEnabled = localStorage.getItem('life_game_sfx') !== 'false';
    const compactMode = localStorage.getItem('life_game_compact') === 'true';
    const bottomNavEnabled = localStorage.getItem('life_game_bottom_nav') !== 'false';
    const currentTheme = localStorage.getItem('life_game_theme') || 'dark';
    
    const isVip = hasPurchasedPack('vip_supporter');
    const achievementProgress = getAchievementProgress();

    const htmlContent = `
        <div class="space-y-4">
            <!-- Account & Save Status -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
                            <i class="fas fa-cloud text-sm"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-sm">Save & Storage</h3>
                            <div class="text-[11px] px-2 py-0.5 rounded-full border inline-block font-semibold mt-0.5 ${modeBadgeColor}">
                                ${modeLabel}
                            </div>
                        </div>
                    </div>
                    <button data-action="triggerManualSave" class="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5">
                        <i class="fas fa-save"></i> ${isCloud ? 'Save Now' : 'Save Local'}
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-700/70">
                    <button data-action="openTimeMachineModal" class="bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5">
                        <i class="fas fa-hourglass-half text-cyan-400"></i> Time Machine
                    </button>
                    <button data-action="openSaveSlotManager" class="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5">
                        <i class="fas fa-layer-group text-cyan-400"></i> Save & Load Slots
                    </button>
                </div>

                ${!isCloud ? `
                <div class="mt-3 pt-2.5 border-t border-slate-700/70">
                    <p class="text-xs text-slate-300 mb-2.5">
                        <i class="fas fa-info-circle text-blue-400 mr-1"></i>
                        Log in to save your current character to the cloud and sync across devices.
                    </p>
                    <button data-action="login" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs shadow-md shadow-blue-900/40 transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Log In & Save to Cloud</span>
                    </button>
                </div>
                ` : `
                <div class="mt-3 pt-2.5 border-t border-slate-700/70 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                        <div class="text-slate-400 flex items-center gap-1.5 truncate">
                            <i class="fas fa-user-circle text-blue-400 shrink-0"></i>
                            <span class="truncate text-slate-300 font-medium">${Utils.escapeHtml(state.userEmail || state.gameState?.user?.username || 'Cloud Account')}</span>
                        </div>
                    </div>
                    <button data-action="promptSignOut" id="btn-settings-signout" class="w-full bg-slate-700/80 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700/60 border border-slate-600/80 text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-2">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
                `}
            </div>

            <!-- Achievements Hub -->
            <div class="bg-gradient-to-r from-slate-800 via-slate-800 to-amber-950/30 p-3.5 rounded-xl border border-amber-500/30 shadow-md">
                <div class="flex justify-between items-center gap-2">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <i class="fas fa-trophy text-sm"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-bold text-white text-sm truncate">Achievements Trophy Room</h3>
                            <div class="text-[11px] text-amber-300 font-semibold mt-0.5 truncate">
                                ${achievementProgress.unlockedCount} / ${achievementProgress.total} Unlocked (${achievementProgress.percentage}%)
                            </div>
                        </div>
                    </div>
                    <button data-action="openAchievementsModal" class="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-900/30 shrink-0">
                        <i class="fas fa-medal"></i> Trophies
                    </button>
                </div>
            </div>

            <!-- Preferences -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i class="fas fa-sliders-h"></i> Preferences
                </div>
                
                <!-- Theme Mode Option -->
                <div class="space-y-1.5">
                    <div class="font-bold text-white text-sm flex items-center justify-between">
                        <span class="flex items-center gap-1.5"><i class="fas fa-palette text-amber-400"></i> UI Theme Appearance</span>
                        ${isVip ? '<span class="text-[10px] font-black text-amber-400 uppercase tracking-wider"><i class="fas fa-crown mr-0.5"></i> VIP Unlocked</span>' : ''}
                    </div>
                    
                    <div class="grid grid-cols-3 gap-1.5 pt-1">
                        <button data-action="selectTheme" data-args="'dark'" class="py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${currentTheme === 'dark' ? 'bg-slate-700 text-white border-2 border-blue-500' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'}">
                            <i class="fas fa-moon text-blue-400"></i>
                            <span>Dark</span>
                        </button>

                        <button data-action="selectTheme" data-args="'light'" class="py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${currentTheme === 'light' ? 'bg-amber-100 text-slate-950 border-2 border-amber-500' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'}">
                            <i class="fas fa-sun text-amber-500"></i>
                            <span>Light</span>
                        </button>

                        <button data-action="selectTheme" data-args="'onyx-gold'" class="py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${currentTheme === 'onyx-gold' ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 border-2 border-amber-300' : 'bg-slate-900 text-amber-300 border border-amber-500/40 hover:bg-amber-950/40'}">
                            <i class="fas ${isVip ? 'fa-gem text-amber-300' : 'fa-lock text-slate-500'}"></i>
                            <span>Onyx & Gold</span>
                        </button>
                    </div>
                </div>

                <div class="flex justify-between items-center py-1 border-t border-slate-700/60 pt-2">
                    <div>
                        <div class="font-bold text-white text-sm">Bottom Navigation Bar</div>
                        <div class="text-xs text-slate-400">Show 5-option navigation bar at bottom of screen</div>
                    </div>
                    <button data-action="toggleSettingBottomNav" id="setting-bottom-nav-btn" class="toggle-switch w-11 h-6 rounded-full p-0.5 border cursor-pointer ${bottomNavEnabled ? 'bg-emerald-500 border-emerald-400/50 shadow-sm shadow-emerald-500/40' : 'bg-slate-700/80 border-slate-600/60'} flex items-center">
                        <div class="toggle-knob w-5 h-5 rounded-full bg-white shadow-md ${bottomNavEnabled ? 'translate-x-5' : 'translate-x-0'}"></div>
                    </button>
                </div>

                <div class="flex justify-between items-center py-1 border-t border-slate-700/60 pt-2">
                    <div>
                        <div class="font-bold text-white text-sm">Sound Effects</div>
                        <div class="text-xs text-slate-400">Audio feedback on actions</div>
                    </div>
                    <button data-action="toggleSettingSFX" id="setting-sfx-btn" class="toggle-switch w-11 h-6 rounded-full p-0.5 border cursor-pointer ${sfxEnabled ? 'bg-emerald-500 border-emerald-400/50 shadow-sm shadow-emerald-500/40' : 'bg-slate-700/80 border-slate-600/60'} flex items-center">
                        <div class="toggle-knob w-5 h-5 rounded-full bg-white shadow-md ${sfxEnabled ? 'translate-x-5' : 'translate-x-0'}"></div>
                    </button>
                </div>

                <div class="flex justify-between items-center py-1 border-t border-slate-700/60 pt-2">
                    <div>
                        <div class="font-bold text-white text-sm">Compact View</div>
                        <div class="text-xs text-slate-400">Reduce spacing in dashboard history</div>
                    </div>
                    <button data-action="toggleSettingCompact" id="setting-compact-btn" class="toggle-switch w-11 h-6 rounded-full p-0.5 border cursor-pointer ${compactMode ? 'bg-emerald-500 border-emerald-400/50 shadow-sm shadow-emerald-500/40' : 'bg-slate-700/80 border-slate-600/60'} flex items-center">
                        <div class="toggle-knob w-5 h-5 rounded-full bg-white shadow-md ${compactMode ? 'translate-x-5' : 'translate-x-0'}"></div>
                    </button>
                </div>
            </div>

            ${isCloud ? `
            <!-- Feedback & Feature Requests (Signed-in Users Only) -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-indigo-500/30 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                            <i class="fas fa-comment-dots text-sm"></i>
                        </div>
                        <div class="min-w-0">
                            <h3 class="font-bold text-white text-sm">Feedback &amp; Feature Requests</h3>
                            <p class="text-[11px] text-slate-400">Share suggestions, ideas, or report bugs</p>
                        </div>
                    </div>
                </div>
                <button data-action="openFeedbackModal" id="btn-settings-feedback" class="w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm">
                    <i class="fas fa-paper-plane"></i>
                    <span>Submit Feedback</span>
                </button>
            </div>
            ` : ''}

            <!-- Danger Zone / Game Reset -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-red-900/40 space-y-2">
                <div class="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <i class="fas fa-exclamation-triangle"></i> Restart Life
                </div>
                <p class="text-xs text-slate-400">Abandon your current character progress and start a brand new life.</p>
                <button data-action="promptResetGame" class="w-full bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-300 font-bold py-2 rounded-lg text-xs transition">
                    Start New Life
                </button>
            </div>

            <!-- Footer -->
            <div class="text-center pt-2 border-t border-slate-700 text-xs text-slate-500">
                <span>Version ${APP_VERSION}</span>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Settings",
        content: htmlContent,
        showCloseBtn: true
    });
}

export function applyTheme(theme) {
    const activeTheme = theme || localStorage.getItem('life_game_theme') || 'dark';
    document.body.classList.remove('light-mode', 'onyx-gold-mode');
    if (document.documentElement) {
        document.documentElement.classList.remove('light-mode', 'onyx-gold-mode');
    }
    if (activeTheme === 'light') {
        document.body.classList.add('light-mode');
        if (document.documentElement) document.documentElement.classList.add('light-mode');
    } else if (activeTheme === 'onyx-gold') {
        document.body.classList.add('onyx-gold-mode');
        if (document.documentElement) document.documentElement.classList.add('onyx-gold-mode');
    }

    const isLight = activeTheme === 'light';
    const loginIcon = document.getElementById('login-theme-icon');
    if (loginIcon) {
        loginIcon.className = `fas ${isLight ? 'fa-sun text-amber-400' : 'fa-moon text-blue-400'} text-sm`;
    }
    const loginLabel = document.getElementById('login-theme-label');
    if (loginLabel) {
        loginLabel.textContent = `Theme: ${isLight ? 'Light Mode' : 'Dark Mode'}`;
    }
    const loginBadge = document.getElementById('login-theme-action-badge');
    if (loginBadge) {
        loginBadge.textContent = `Switch to ${isLight ? 'Dark' : 'Light'}`;
    }
}

export function toggleSettingTheme() {
    const currentTheme = localStorage.getItem('life_game_theme') || 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('life_game_theme', nextTheme);
    applyTheme(nextTheme);
    
    // Refresh active life dashboard if open behind modal
    if (state.gameState && state.gameState.user && typeof renderLifeDashboard === 'function') {
        const dashboard = document.querySelector('[data-action="ageUp"]');
        if (dashboard) {
            renderLifeDashboard();
        }
    }
}

export async function triggerManualSave() {
    if (typeof saveGame === 'function') {
        const isCloud = !!state.userAuthId;
        const result = await saveGame(true);
        if (result) {
            UI.showModal(
                "Save Successful",
                isCloud 
                    ? "Your game progress has been synchronized to your cloud account." 
                    : "Your game progress has been saved locally on this device."
            );
        } else {
            UI.showModal(
                "Save Warning",
                "Progress was saved locally, but cloud synchronization could not be confirmed. Please check your connection."
            );
        }
    }
}

export function promptResetGame() {
    UI.showConfirm(
        "Start New Life?", 
        "Are you sure you want to abandon your current character? All current life progress will be erased.", 
        "Reset & Start New Life", 
        () => {
            if (typeof UI !== 'undefined' && typeof UI.closeAllModals === 'function') {
                UI.closeAllModals();
            }
            if (typeof resetGame === 'function') {
                resetGame();
            }
        }
    );
}

export function promptSignOut() {
    UI.showConfirm(
        "Sign Out?",
        "Are you sure you want to sign out of your account? Your current character progress will be saved to your cloud save.",
        "Sign Out",
        () => {
            handleSignOut();
        }
    );
}

export async function handleSignOut() {
    if (typeof UI !== 'undefined' && UI.renderLoadingScreen) {
        UI.renderLoadingScreen("Signing Out...", "Saving your progress and disconnecting...");
    }
    if (typeof saveGame === 'function' && state.userAuthId) {
        try {
            await saveGame();
        } catch (e) {
            console.warn("Save before sign out failed:", e);
        }
    }

    // Purge local device save data so cloud character does not remain playable in guest mode
    try {
        localStorage.removeItem('life_game_slots');
        localStorage.removeItem('life_game_save');
    } catch (e) {}
    if (Utils && Utils.guestStorage && typeof Utils.guestStorage.clearSave === 'function') {
        Utils.guestStorage.clearSave();
    }
    state.gameState = null;
    state.userAuthId = null;
    state.userEmail = null;

    if (typeof UI !== 'undefined' && typeof UI.closeAllModals === 'function') {
        UI.closeAllModals();
    }

    if (typeof logout === 'function') {
        await logout();
    }
}

export function toggleSettingSFX() {
    const current = localStorage.getItem('life_game_sfx') !== 'false';
    const next = !current;
    localStorage.setItem('life_game_sfx', next.toString());
    if (next) {
        SoundManager.play('toggleOn');
    }
    
    const btn = document.getElementById('setting-sfx-btn');
    if (btn) {
        const knob = btn.querySelector('.toggle-knob');
        if (next) {
            btn.classList.remove('bg-slate-700/80', 'border-slate-600/60');
            btn.classList.add('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            if (knob) {
                knob.classList.remove('translate-x-0');
                knob.classList.add('translate-x-5');
            }
        } else {
            btn.classList.remove('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            btn.classList.add('bg-slate-700/80', 'border-slate-600/60');
            if (knob) {
                knob.classList.remove('translate-x-5');
                knob.classList.add('translate-x-0');
            }
        }
    } else {
        openSettingsModal();
    }
}

export function toggleSettingCompact() {
    const current = localStorage.getItem('life_game_compact') === 'true';
    const next = !current;
    localStorage.setItem('life_game_compact', next.toString());
    
    const btn = document.getElementById('setting-compact-btn');
    if (btn) {
        const knob = btn.querySelector('.toggle-knob');
        if (next) {
            btn.classList.remove('bg-slate-700/80', 'border-slate-600/60');
            btn.classList.add('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            if (knob) {
                knob.classList.remove('translate-x-0');
                knob.classList.add('translate-x-5');
            }
        } else {
            btn.classList.remove('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            btn.classList.add('bg-slate-700/80', 'border-slate-600/60');
            if (knob) {
                knob.classList.remove('translate-x-5');
                knob.classList.add('translate-x-0');
            }
        }
    } else {
        openSettingsModal();
    }

    // Refresh active life dashboard if open behind modal
    if (state.gameState && state.gameState.user && typeof renderLifeDashboard === 'function') {
        const dashboard = document.querySelector('[data-action="ageUp"]');
        if (dashboard) {
            renderLifeDashboard();
        }
    }
}

export function toggleSettingBottomNav() {
    const current = localStorage.getItem('life_game_bottom_nav') !== 'false';
    const next = !current;
    localStorage.setItem('life_game_bottom_nav', next.toString());
    
    const btn = document.getElementById('setting-bottom-nav-btn');
    if (btn) {
        const knob = btn.querySelector('.toggle-knob');
        if (next) {
            btn.classList.remove('bg-slate-700/80', 'border-slate-600/60');
            btn.classList.add('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            if (knob) {
                knob.classList.remove('translate-x-0');
                knob.classList.add('translate-x-5');
            }
        } else {
            btn.classList.remove('bg-emerald-500', 'border-emerald-400/50', 'shadow-sm', 'shadow-emerald-500/40');
            btn.classList.add('bg-slate-700/80', 'border-slate-600/60');
            if (knob) {
                knob.classList.remove('translate-x-5');
                knob.classList.add('translate-x-0');
            }
        }
    } else {
        openSettingsModal();
    }

    if (next) {
        UI.updateBottomNav('home');
    } else {
        UI.hideBottomNav();
    }

    // Refresh active life dashboard if open behind modal
    if (state.gameState && state.gameState.user && typeof renderLifeDashboard === 'function') {
        const dashboard = document.querySelector('[data-action="ageUp"]') || document.getElementById('game-container');
        if (dashboard) {
            renderLifeDashboard();
        }
    }
}

function showFeedbackError(msg) {
    const banner = document.getElementById('feedback-error-banner');
    const textEl = document.getElementById('feedback-error-text');
    if (banner && textEl) {
        textEl.textContent = msg;
        banner.classList.remove('hidden');
    }
}

function clearFeedbackError() {
    const banner = document.getElementById('feedback-error-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

export function selectFeedbackCategory(category = 'general') {
    const valid = ['general', 'feature', 'bug'].includes(category) ? category : 'general';
    const hiddenInput = document.getElementById('feedback-category-input');
    if (hiddenInput) {
        hiddenInput.value = valid;
    }

    const buttons = document.querySelectorAll('[data-feedback-category]');
    buttons.forEach(btn => {
        const isSelected = btn.getAttribute('data-feedback-category') === valid;
        if (isSelected) {
            btn.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-700');
            btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-400');
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-400');
            btn.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-700');
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

export function openFeedbackModal() {
    if (!state.userAuthId) {
        UI.showModal(
            "Sign In Required",
            "Please sign in to your account to submit feedback or feature requests."
        );
        return;
    }

    const accountLabel = Utils.escapeHtml(
        state.userEmail || state.gameState?.user?.username || 'Signed-in Player'
    );

    const content = `
        <div class="space-y-3 text-left">
            <div class="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
                <i class="fas fa-user-check text-emerald-400 shrink-0"></i>
                <span class="text-slate-400 shrink-0">Sending as:</span>
                <span class="text-slate-200 font-semibold truncate">${accountLabel}</span>
            </div>

            <div class="space-y-1.5">
                <div class="text-xs font-bold text-slate-300">Topic</div>
                <input type="hidden" id="feedback-category-input" value="general" />
                <div class="grid grid-cols-3 gap-1.5">
                    <button type="button" data-action="selectFeedbackCategory" data-args="'general'" data-feedback-category="general" aria-pressed="true" class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition bg-indigo-600 text-white border-indigo-400 flex items-center justify-center gap-1">
                        <i class="fas fa-comment-alt text-[10px]"></i> General
                    </button>
                    <button type="button" data-action="selectFeedbackCategory" data-args="'feature'" data-feedback-category="feature" aria-pressed="false" class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-1">
                        <i class="fas fa-lightbulb text-[10px]"></i> Feature
                    </button>
                    <button type="button" data-action="selectFeedbackCategory" data-args="'bug'" data-feedback-category="bug" aria-pressed="false" class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-1">
                        <i class="fas fa-bug text-[10px]"></i> Bug
                    </button>
                </div>
            </div>

            <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                    <label for="feedback-message-input" class="text-xs font-bold text-slate-300">Your Feedback or Feature Idea</label>
                    <span id="feedback-char-count" class="text-[11px] text-slate-400 font-mono">0 / ${MAX_FEEDBACK_LENGTH}</span>
                </div>
                <textarea
                    id="feedback-message-input"
                    rows="5"
                    maxlength="${MAX_FEEDBACK_LENGTH}"
                    placeholder="Share feedback, report a bug, or request a new feature..."
                    class="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm p-3 focus:outline-none focus:border-blue-500"
                ></textarea>
            </div>

            <div id="feedback-error-banner" class="hidden bg-red-950/60 border border-red-500/50 text-red-300 text-xs rounded-lg px-3 py-2 flex items-start gap-2">
                <i class="fas fa-exclamation-circle mt-0.5 shrink-0"></i>
                <span id="feedback-error-text"></span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" data-action="hideModal" id="btn-cancel-feedback" class="w-full border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 transition text-xs">
                    Cancel
                </button>
                <button type="button" data-action="submitFeedback" id="btn-submit-feedback" class="w-full btn-primary text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                    <i class="fas fa-paper-plane"></i>
                    <span>Send Feedback</span>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Submit Feedback",
        content,
        showCloseBtn: true
    });

    const textarea = document.getElementById('feedback-message-input');
    const charCount = document.getElementById('feedback-char-count');
    if (textarea) {
        textarea.addEventListener('input', () => {
            clearFeedbackError();
            if (charCount) {
                charCount.textContent = `${textarea.value.length} / ${MAX_FEEDBACK_LENGTH}`;
            }
        });
    }
}

export async function submitFeedback() {
    if (!state.userAuthId) {
        showFeedbackError("You must be signed in to submit feedback.");
        return;
    }

    const textarea = document.getElementById('feedback-message-input');
    const categoryInput = document.getElementById('feedback-category-input');
    const submitBtn = document.getElementById('btn-submit-feedback');

    if (!textarea) return;

    const message = textarea.value.trim();
    const category = categoryInput?.value || 'general';

    if (message.length < MIN_FEEDBACK_LENGTH) {
        showFeedbackError(`Please enter at least ${MIN_FEEDBACK_LENGTH} characters before submitting.`);
        return;
    }

    if (message.length > MAX_FEEDBACK_LENGTH) {
        showFeedbackError(`Feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer.`);
        return;
    }

    clearFeedbackError();

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Sending...</span>';
    }

    try {
        let authToken = await getAuthToken();
        if (!authToken) {
            authToken = await getAuthToken(true);
        }
        if (!authToken) {
            showFeedbackError("Your session could not be verified. Please sign in again.");
            return;
        }

        const payload = JSON.stringify({
            category,
            message,
            email: state.userEmail || null,
            appVersion: APP_VERSION
        });

        let response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: payload
        });

        if (response.status === 401) {
            const refreshedToken = await getAuthToken(true);
            if (refreshedToken) {
                response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${refreshedToken}`
                    },
                    body: payload
                });
            }
        }

        if (response.ok) {
            UI.hideModal();
            UI.showModal(
                "Feedback Sent",
                "Thank you! Your feedback has been submitted and will help improve Start a Life."
            );
            return;
        }

        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
            showFeedbackError(errData.message || "You've submitted feedback recently. Please wait a few minutes before sending another.");
        } else {
            showFeedbackError(errData.error || "Could not submit feedback right now. Please try again.");
        }
    } catch (err) {
        console.error('[Feedback] Submission failed:', err);
        showFeedbackError("Network error while sending feedback. Please check your connection and try again.");
    } finally {
        if (submitBtn && document.body.contains(submitBtn)) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }
}
