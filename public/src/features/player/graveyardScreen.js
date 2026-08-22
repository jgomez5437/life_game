import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { EulogyGenerator } from '../../core/eulogyGenerator.js';

export function renderGraveyardModal() {
    if (!state.gameState || !state.gameState.user) return;
    const user = state.gameState.user;

    const pastLives = user.pastLives || state.gameState.pastLives || [];
    const currentGen = user.generation || (pastLives.length + 1);

    // Extract family surname if possible
    const nameParts = (user.username || user.name || "Player").split(' ');
    const familyLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Family";

    let contentHtml = '';

    if (pastLives.length === 0) {
        contentHtml = `
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center space-y-3">
                <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto">
                    <i class="fas fa-monument"></i>
                </div>
                <h3 class="font-bold text-white text-lg">1st Generation Founder</h3>
                <p class="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    You are the first of your family lineage! No ancestors have passed down their estate yet.
                </p>
                <div class="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
                    <i class="fas fa-info-circle text-amber-400 mr-1"></i> When you age up, pass away, and choose to <strong>Play as your Child</strong>, your life legacy will be preserved here in the Family Graveyard.
                </div>
            </div>
        `;
    } else {
        const ancestorsCardsHtml = pastLives.map((ancestor, index) => {
            const genNum = ancestor.generation || (pastLives.length - index);
            const avatarHtml = renderAvatar(ancestor);
            if (!ancestor.eulogy) {
                ancestor.eulogy = EulogyGenerator.generate(ancestor, [], ancestor.causeOfDeath || 'Natural Causes');
            }
            const netWorthStr = Utils.formatMoney(ancestor.finalNetWorth || 0);
            const inheritedStr = Utils.formatMoney(ancestor.inheritedMoney || 0);

            return `
                <div class="bg-slate-800/90 p-4 rounded-xl border border-slate-700 hover:border-amber-500/40 transition shadow-md">
                    <div class="flex items-start gap-3.5">
                        <div class="w-14 h-14 rounded-xl bg-slate-900 border border-slate-600 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                            ${avatarHtml}
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2">
                                <h4 class="font-bold text-white text-base truncate">${Utils.escapeHtml(ancestor.name)}</h4>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                    Gen ${genNum}
                                </span>
                            </div>
                            
                            <div class="text-xs text-slate-400 font-medium mt-0.5">
                                Lived to Age <strong class="text-white">${ancestor.ageAtDeath}</strong> • <span class="text-slate-300">${Utils.escapeHtml(ancestor.causeOfDeath || 'Natural Causes')}</span>
                            </div>
                            
                            <div class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                                <i class="fas fa-briefcase text-blue-400 text-[11px]"></i>
                                <span class="text-slate-200">${Utils.escapeHtml(ancestor.occupation || 'Retired')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Estate Breakdown -->
                    <div class="mt-3 pt-2.5 border-t border-slate-700/70 grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Estate</div>
                            <div class="font-bold text-emerald-400 mt-0.5">${netWorthStr}</div>
                        </div>
                        <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passed to Heir</div>
                            <div class="font-bold text-amber-300 mt-0.5">${inheritedStr}</div>
                        </div>
                    </div>

                    ${ancestor.eulogy ? `
                        <button data-action="showAncestorEulogy" data-args="'${ancestor.id}'" class="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold text-slate-300 bg-slate-700/60 hover:bg-slate-700 hover:text-white transition flex items-center justify-center gap-1.5">
                            <i class="fas fa-scroll text-amber-400 text-[11px]"></i> Read Life Summary
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        contentHtml = `
            <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                ${ancestorsCardsHtml}
            </div>
        `;
    }

    const modalHtml = `
        <div class="space-y-4">
            <!-- Lineage Header -->
            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg">
                        <i class="fas fa-monument"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-base">House of ${Utils.escapeHtml(familyLastName)}</h3>
                        <div class="text-xs text-amber-400 font-medium">Generation ${currentGen} Lineage • ${pastLives.length} Past ${pastLives.length === 1 ? 'Life' : 'Lives'}</div>
                    </div>
                </div>
            </div>

            <!-- Graveyard Cards / Content -->
            ${contentHtml}
        </div>
    `;

    UI.showCustomModal("Family Graveyard & Lineage", modalHtml);
}

export function showAncestorEulogy(ancestorId) {
    if (!state.gameState || !state.gameState.user) return;
    const user = state.gameState.user;
    const pastLives = user.pastLives || state.gameState.pastLives || [];

    const ancestor = pastLives.find(a => a.id === ancestorId);
    if (!ancestor) return;
    if (!ancestor.eulogy) {
        ancestor.eulogy = EulogyGenerator.generate(ancestor, [], ancestor.causeOfDeath || 'Natural Causes');
    }

    UI.showModal(
        `${Utils.escapeHtml(ancestor.name)}'s Life Summary`,
        `
        <div class="space-y-3 text-left">
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs text-slate-400 flex justify-between">
                <span>Age at Death: <strong class="text-white">${ancestor.ageAtDeath}</strong></span>
                <span>Estate: <strong class="text-emerald-400">${Utils.formatMoney(ancestor.finalNetWorth || 0)}</strong></span>
            </div>
            <p class="text-slate-300 italic text-sm leading-relaxed">"${Utils.escapeHtml(ancestor.eulogy)}"</p>
        </div>
        `
    );
}
