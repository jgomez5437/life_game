import {
    ACHIEVEMENTS_CATALOG,
    getUnlockedAchievements,
    getAchievementProgress,
    getSingleAchievementProgress
} from '../../core/achievementManager.js';
import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

let _activeFilter = 'all';

function renderAchievementsModalContent(replaceExisting = false) {
    const unlockedMap = getUnlockedAchievements();
    const progress = getAchievementProgress();
    const user = state.gameState?.user;

    // Filter items
    let filteredList = ACHIEVEMENTS_CATALOG;
    if (_activeFilter === 'unlocked') {
        filteredList = ACHIEVEMENTS_CATALOG.filter(a => unlockedMap[a.id]?.unlocked);
    } else if (_activeFilter === 'locked') {
        filteredList = ACHIEVEMENTS_CATALOG.filter(a => !unlockedMap[a.id]?.unlocked);
    } else if (_activeFilter === 'wild') {
        filteredList = ACHIEVEMENTS_CATALOG.filter(a => a.isWild);
    } else if (_activeFilter !== 'all') {
        filteredList = ACHIEVEMENTS_CATALOG.filter(a => a.category === _activeFilter);
    }

    const counts = {
        all: ACHIEVEMENTS_CATALOG.length,
        unlocked: progress.unlockedCount,
        locked: progress.total - progress.unlockedCount,
        wild: ACHIEVEMENTS_CATALOG.filter(a => a.isWild).length,
        life: ACHIEVEMENTS_CATALOG.filter(a => a.category === 'life').length,
        business: ACHIEVEMENTS_CATALOG.filter(a => a.category === 'business').length,
        crime: ACHIEVEMENTS_CATALOG.filter(a => a.category === 'crime').length,
        luck: ACHIEVEMENTS_CATALOG.filter(a => a.category === 'luck').length
    };

    const filterPills = [
        { id: 'all', label: `All (${counts.all})` },
        { id: 'unlocked', label: `Unlocked (${counts.unlocked})` },
        { id: 'locked', label: `Locked (${counts.locked})` },
        { id: 'wild', label: `Wild (${counts.wild})` },
        { id: 'life', label: `Life (${counts.life})` },
        { id: 'business', label: `Wealth (${counts.business})` },
        { id: 'crime', label: `Crime (${counts.crime})` },
        { id: 'luck', label: `Luck (${counts.luck})` }
    ];

    const cardsHtml = filteredList.length === 0 ? `
        <div class="p-8 text-center text-slate-400 bg-slate-800/60 rounded-xl border border-slate-700">
            <i class="fas fa-trophy text-3xl text-slate-600 mb-2"></i>
            <p class="text-sm font-semibold">No achievements found in this category.</p>
        </div>
    ` : filteredList.map(item => {
        const record = unlockedMap[item.id];
        const isUnlocked = !!record?.unlocked;

        if (isUnlocked) {
            const dateStr = record.unlockedAt ? new Date(record.unlockedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Unlocked';

            return `
                <div class="bg-gradient-to-r from-slate-800 to-amber-950/20 p-3.5 rounded-xl border border-amber-500/40 hover:border-amber-500/70 transition shadow-md flex items-start gap-3">
                    <div class="w-11 h-11 rounded-xl ${item.iconBg} ${item.iconColor} border ${item.badgeColor} flex items-center justify-center text-lg shrink-0 shadow-inner mt-0.5">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-1.5 flex-wrap">
                            <h4 class="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>${Utils.escapeHtml(item.title)}</span>
                                ${item.isWild ? '<span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-950/60 text-orange-400 border border-orange-500/40">Wild</span>' : ''}
                            </h4>
                            <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <i class="fas fa-check-circle text-[9px]"></i> Unlocked
                            </span>
                        </div>
                        <p class="text-xs text-slate-300 mt-1 leading-relaxed">${Utils.escapeHtml(item.description)}</p>
                        <div class="text-[11px] text-amber-400/90 font-medium mt-2 flex items-center gap-2 border-t border-slate-700/60 pt-1.5 truncate">
                            <span class="truncate"><i class="fas fa-user text-[10px] mr-1"></i>${Utils.escapeHtml(record.characterName || 'Hero')}</span>
                            <span>•</span>
                            <span class="shrink-0"><i class="fas fa-calendar-alt text-[10px] mr-1"></i>${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        const singleProgress = getSingleAchievementProgress(item.id, user);
        const progressHtml = singleProgress ? `
            <div class="mt-2 space-y-1">
                <div class="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                    <span>${Utils.escapeHtml(singleProgress.label)}</span>
                    <span class="text-amber-400">${singleProgress.percent}%</span>
                </div>
                <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div class="bg-amber-500/80 h-1.5 rounded-full transition-all duration-300" style="width: ${singleProgress.percent}%"></div>
                </div>
            </div>
        ` : '';

        // Locked Card
        return `
            <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-slate-400 flex items-start gap-3 opacity-85 hover:opacity-100 transition">
                <div class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-lg shrink-0 mt-0.5">
                    <i class="fas fa-lock"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1.5">
                        <h4 class="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                            <span>${Utils.escapeHtml(item.title)}</span>
                            ${item.isWild ? '<span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-800 text-orange-400/80 border border-slate-700">Wild</span>' : ''}
                        </h4>
                        <span class="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                            Locked
                        </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                        ${item.isWild && item.hint 
                            ? `<span class="italic text-amber-400/80"><i class="fas fa-eye-slash mr-1"></i>Clue: ${Utils.escapeHtml(item.hint)}</span>` 
                            : Utils.escapeHtml(item.description)}
                    </p>
                    ${progressHtml}
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="space-y-4">
            <!-- Header Progress Card -->
            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-4 rounded-xl border border-amber-500/30">
                <div class="flex items-center justify-between gap-3 mb-2.5">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl shadow-lg shadow-amber-900/30">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div>
                            <h3 class="font-black text-white text-base">Trophy Room</h3>
                            <div class="text-xs text-amber-300 font-bold">
                                ${progress.unlockedCount} / ${progress.total} Unlocked (${progress.percentage}%)
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-black text-white">${progress.percentage}%</span>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/80">
                    <div class="bg-gradient-to-r from-amber-500 to-yellow-400 h-2.5 rounded-full transition-all duration-500" style="width: ${progress.percentage}%"></div>
                </div>
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                ${filterPills.map(p => `
                    <button data-action="filterAchievementsCategory" data-args="'${p.id}'" class="px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${_activeFilter === p.id ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}">
                        ${p.label}
                    </button>
                `).join('')}
            </div>

            <!-- Achievement Cards Grid -->
            <div class="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                ${cardsHtml}
            </div>

            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-600 flex items-center justify-center gap-2 mt-3">
                <i class="fas fa-times"></i> Close Achievements
            </button>
        </div>
    `;

    const overlay = document.getElementById('modal-overlay');
    if (replaceExisting && overlay && !overlay.classList.contains('hidden')) {
        UI.replaceModalContent("Achievements & Trophies", html);
    } else {
        UI.showCustomModal({
            title: "Achievements & Trophies",
            content: html,
            showCloseBtn: true
        });
    }
}

export function openAchievementsModal(filter = null) {
    _activeFilter = filter || 'all';
    renderAchievementsModalContent(false);
}

export function filterAchievementsCategory(filter) {
    _activeFilter = filter || 'all';
    renderAchievementsModalContent(true);
}

export function dismissAchievementToast(toastId) {
    if (typeof document === 'undefined') return;
    if (toastId) {
        const el = document.getElementById(String(toastId));
        if (el) {
            el.remove();
            return;
        }
    }
    const fallback = document.querySelector('.achievement-toast');
    if (fallback) fallback.remove();
}

/**
 * Displays a non-blocking floating celebration toast for newly unlocked achievements.
 */
export function showAchievementToast(achievement) {
    if (typeof document === 'undefined' || !achievement) return;

    let toastContainer = document.getElementById('achievement-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'achievement-toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = `ach_toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'achievement-toast pointer-events-auto bg-slate-900/95 border-2 border-amber-400/80 p-3.5 rounded-xl shadow-2xl shadow-amber-950/60 text-white flex items-center gap-3 transform transition-all duration-300 translate-y-[-20px] opacity-0';
    toastEl.innerHTML = `
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
            <i class="fas fa-trophy"></i>
        </div>
        <div class="flex-1 min-w-0">
            <div class="text-[10px] font-black text-amber-400 uppercase tracking-wider">Achievement Unlocked!</div>
            <div class="font-bold text-white text-xs truncate">${Utils.escapeHtml(achievement.title)}</div>
            <div class="text-[11px] text-slate-300 truncate">${Utils.escapeHtml(achievement.description)}</div>
        </div>
        <button type="button" class="text-slate-400 hover:text-white text-xs p-1" data-action="dismissAchievementToast" data-args="'${toastId}'" aria-label="Dismiss achievement toast">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toastEl);

    // Animate in
    setTimeout(() => {
        toastEl.classList.remove('translate-y-[-20px]', 'opacity-0');
        toastEl.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
        if (toastEl.parentElement) {
            toastEl.classList.add('opacity-0', 'translate-y-[-20px]');
            setTimeout(() => {
                if (toastEl.parentElement) {
                    toastEl.remove();
                }
            }, 300);
        }
    }, 4500);
}
