import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { saveGame, resetGame } from '../../core/main.js';

export function openSettingsModal() {
    const isCloud = !!state.userAuthId;
    const modeLabel = isCloud ? 'Cloud Sync Active' : 'Guest Local Mode';
    const modeBadgeColor = isCloud ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50' : 'bg-amber-950/60 text-amber-400 border-amber-500/50';
    
    const sfxEnabled = localStorage.getItem('life_game_sfx') !== 'false';
    const compactMode = localStorage.getItem('life_game_compact') === 'true';

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
                        <i class="fas fa-save"></i> Save Now
                    </button>
                </div>
            </div>

            <!-- Preferences -->
            <div class="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i class="fas fa-sliders-h"></i> Preferences
                </div>
                
                <div class="flex justify-between items-center py-1">
                    <div>
                        <div class="font-bold text-white text-sm">Sound Effects</div>
                        <div class="text-xs text-slate-400">Audio feedback on actions</div>
                    </div>
                    <button data-action="toggleSettingSFX" id="setting-sfx-btn" class="w-12 h-6 rounded-full p-1 transition-colors ${sfxEnabled ? 'bg-emerald-600' : 'bg-slate-700'} flex items-center">
                        <div class="w-4 h-4 rounded-full bg-white transition-transform ${sfxEnabled ? 'translate-x-6' : 'translate-x-0'}"></div>
                    </button>
                </div>

                <div class="flex justify-between items-center py-1 border-t border-slate-700/60 pt-2">
                    <div>
                        <div class="font-bold text-white text-sm">Compact View</div>
                        <div class="text-xs text-slate-400">Reduce spacing in dashboard history</div>
                    </div>
                    <button data-action="toggleSettingCompact" id="setting-compact-btn" class="w-12 h-6 rounded-full p-1 transition-colors ${compactMode ? 'bg-emerald-600' : 'bg-slate-700'} flex items-center">
                        <div class="w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-0'}"></div>
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
    localStorage.setItem('life_game_sfx', (!current).toString());
    openSettingsModal();
}

export function toggleSettingCompact() {
    const current = localStorage.getItem('life_game_compact') === 'true';
    localStorage.setItem('life_game_compact', (!current).toString());
    openSettingsModal();
}
