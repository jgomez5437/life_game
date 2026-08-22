import { state, hasPurchasedPack } from '../../core/state.js';
import { STORE_PACKS } from './storeScreen.js';
import { UI } from '../../ui/ui.js';
import { applyTheme } from '../more/settingsScreen.js';

/**
 * Checks if the player owns the VIP Supporter & Unique Theme pack.
 */
export function isVipSupporter() {
    return hasPurchasedPack('vip_supporter');
}

/**
 * Opens the VIP Lounge Hub Modal for active VIP Supporters.
 */
export function renderVipLoungeModal() {
    const user = state.gameState?.user;
    if (!user) return;

    if (!isVipSupporter()) {
        UI.showModal("VIP Supporter Required", "Unlock VIP Supporter & Unique Theme in The Spot store to access the VIP Lounge.");
        return;
    }

    const currentTheme = localStorage.getItem('life_game_theme') || 'dark';

    const comingSoonPacks = STORE_PACKS.filter(p => p.status === 'coming_soon');

    const htmlContent = `
        <div class="space-y-4 text-left">
            <!-- VIP Banner -->
            <div class="bg-gradient-to-r from-amber-900/50 via-yellow-900/40 to-slate-900 p-4 rounded-xl border border-amber-500/40 shadow-xl relative overflow-hidden">
                <div class="absolute -right-3 -bottom-3 opacity-20 text-6xl text-amber-300 pointer-events-none">
                    <i class="fas fa-crown"></i>
                </div>
                <div class="relative z-10">
                    <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                        <i class="fas fa-gem"></i> VIP Lounge & Lounge Perks
                    </div>
                    <h3 class="text-xl font-extrabold text-white flex items-center gap-2">
                        Golden VIP Member
                    </h3>
                    <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                        Thank you for supporting game development! Enjoy your ad-free experience, VIP profile badge, and luxury themes.
                    </p>
                </div>
            </div>

            <!-- Ad-Free & VIP Status Badges -->
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-slate-900 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-sm">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white">Ad-Free Active</div>
                        <div class="text-[10px] text-emerald-400">100% Interruption Free</div>
                    </div>
                </div>

                <div class="bg-slate-900 p-3 rounded-xl border border-amber-500/30 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center justify-center text-sm">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white">Gold Badge Active</div>
                        <div class="text-[10px] text-amber-400">Profile Crown Unlocked</div>
                    </div>
                </div>
            </div>

            <!-- Theme Selector -->
            <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <i class="fas fa-palette text-amber-400"></i> Exclusive VIP UI Themes
                </div>
                
                <div class="grid grid-cols-3 gap-2">
                    <button data-action="selectTheme" data-args="'dark'" class="py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 ${currentTheme === 'dark' ? 'bg-slate-700 text-white border-2 border-blue-500 shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'}">
                        <i class="fas fa-moon text-blue-400"></i>
                        <span>Dark Slate</span>
                    </button>

                    <button data-action="selectTheme" data-args="'light'" class="py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 ${currentTheme === 'light' ? 'bg-amber-100 text-slate-950 border-2 border-amber-500 shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'}">
                        <i class="fas fa-sun text-amber-500"></i>
                        <span>Light Mode</span>
                    </button>

                    <button data-action="selectTheme" data-args="'onyx-gold'" class="py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col items-center gap-1.5 ${currentTheme === 'onyx-gold' ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 border-2 border-amber-300 shadow-lg shadow-amber-500/30' : 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'}">
                        <i class="fas fa-gem text-amber-200"></i>
                        <span>Onyx & Gold</span>
                    </button>
                </div>
            </div>

            <!-- Priority Beta Expansion Previews -->
            <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                    <i class="fas fa-flask"></i> Priority Beta Expansion Previews
                </div>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                    ${comingSoonPacks.map(p => `
                        <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                                    <i class="fas ${p.icon}"></i>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-white">${p.title}</div>
                                    <div class="text-[10px] text-slate-400">${p.features[0]}</div>
                                </div>
                            </div>
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                VIP Early Preview
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "VIP Lounge",
        content: htmlContent,
        confirmText: null,
        cancelText: null
    });
}

/**
 * Changes theme mode dynamically.
 */
export function selectTheme(themeName) {
    if (themeName === 'onyx-gold' && !isVipSupporter()) {
        UI.showModal("VIP Perk Locked", "Onyx & Gold Luxury Theme requires VIP Supporter pack purchase.");
        return;
    }

    localStorage.setItem('life_game_theme', themeName);
    applyTheme(themeName);

    // Refresh the appropriate modal based on VIP status
    if (isVipSupporter()) {
        renderVipLoungeModal();
    }
}
