import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { saveGame, resetGame } from '../../core/main.js';
import { renderLifeDashboard } from '../player/mainScreen.js';

export function openSettingsModal() {
    const isCloud = !!state.userAuthId;
    const modeLabel = isCloud ? 'Cloud Sync Active' : 'Guest Local Mode';
    const modeBadgeColor = isCloud ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50' : 'bg-amber-950/60 text-amber-400 border-amber-500/50';
    
    const sfxEnabled = localStorage.getItem('life_game_sfx') !== 'false';
    const compactMode = localStorage.getItem('life_game_compact') === 'true';
    const currentTheme = localStorage.getItem('life_game_theme') || 'dark';
    const isLightMode = currentTheme === 'light';

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
                ` : ''}
            </div>

            <!-- Preferences -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i class="fas fa-sliders-h"></i> Preferences
                </div>
                
                <!-- Theme Mode Option -->
                <div class="flex justify-between items-center py-1">
                    <div>
                        <div class="font-bold text-white text-sm flex items-center gap-1.5">
                            <i class="fas ${isLightMode ? 'fa-sun text-amber-400' : 'fa-moon text-blue-400'}"></i> Theme Mode
                        </div>
                        <div class="text-xs text-slate-400">Default: Dark Mode. Enable Light Mode appearance</div>
                    </div>
                    <button data-action="toggleSettingTheme" id="setting-theme-btn" class="toggle-switch w-11 h-6 rounded-full p-0.5 border cursor-pointer ${isLightMode ? 'bg-amber-500 border-amber-400/50 shadow-sm shadow-amber-500/40' : 'bg-slate-700/80 border-slate-600/60'} flex items-center" title="Toggle Light / Dark Mode">
                        <div class="toggle-knob w-5 h-5 rounded-full bg-white shadow-md ${isLightMode ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center text-[10px]">
                            <i class="fas ${isLightMode ? 'fa-sun text-amber-600' : 'fa-moon text-slate-600'}"></i>
                        </div>
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
            <div class="flex justify-between items-center pt-2 border-t border-slate-700 text-xs text-slate-500">
                <span>Version 1.0.0</span>
                <button data-action="hideModal" class="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition">
                    Close
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal("Settings", htmlContent);
}

export function applyTheme(theme) {
    const activeTheme = theme || localStorage.getItem('life_game_theme') || 'dark';
    if (activeTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

export function toggleSettingTheme() {
    const currentTheme = localStorage.getItem('life_game_theme') || 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('life_game_theme', nextTheme);
    applyTheme(nextTheme);
    
    const btn = document.getElementById('setting-theme-btn');
    if (btn) {
        const knob = btn.querySelector('.toggle-knob');
        const isLight = nextTheme === 'light';
        if (isLight) {
            btn.classList.remove('bg-slate-700/80', 'border-slate-600/60');
            btn.classList.add('bg-amber-500', 'border-amber-400/50', 'shadow-sm', 'shadow-amber-500/40');
            if (knob) {
                knob.classList.remove('translate-x-0');
                knob.classList.add('translate-x-5');
                knob.innerHTML = '<i class="fas fa-sun text-amber-600"></i>';
            }
        } else {
            btn.classList.remove('bg-amber-500', 'border-amber-400/50', 'shadow-sm', 'shadow-amber-500/40');
            btn.classList.add('bg-slate-700/80', 'border-slate-600/60');
            if (knob) {
                knob.classList.remove('translate-x-5');
                knob.classList.add('translate-x-0');
                knob.innerHTML = '<i class="fas fa-moon text-slate-600"></i>';
            }
        }
    } else {
        openSettingsModal();
    }

    // Refresh active life dashboard if open behind modal to ensure smooth rerender
    if (state.gameState && state.gameState.user && typeof renderLifeDashboard === 'function') {
        const dashboard = document.querySelector('[data-action="ageUp"]');
        if (dashboard) {
            renderLifeDashboard();
        }
    }
}

export function triggerManualSave() {
    if (typeof saveGame === 'function') {
        saveGame();
        UI.showModal("Save Successful", "Your game progress has been saved.");
    }
}

export function promptResetGame() {
    UI.showConfirm(
        "Start New Life?", 
        "Are you sure you want to abandon your current character? All current life progress will be erased.", 
        "Reset & Start New Life", 
        () => {
            if (typeof resetGame === 'function') {
                resetGame();
            }
        }
    );
}

export function toggleSettingSFX() {
    const current = localStorage.getItem('life_game_sfx') !== 'false';
    const next = !current;
    localStorage.setItem('life_game_sfx', next.toString());
    
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

