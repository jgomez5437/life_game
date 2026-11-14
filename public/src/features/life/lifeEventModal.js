import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { saveGame } from '../../core/main.js';
import { GameLogic } from '../../core/gameLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { LIFE_EVENTS } from '../../core/eventManager.js';
import { SoundManager } from '../../core/soundManager.js';

function getOptionColorClasses(color, isDisabled) {
    if (isDisabled) {
        return {
            btnBgClass: 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700',
            descColor: 'text-slate-600'
        };
    }

    switch (color) {
        case 'emerald':
        case 'green':
            return { btnBgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white', descColor: 'text-emerald-200' };
        case 'amber':
        case 'yellow':
            return { btnBgClass: 'bg-amber-600 hover:bg-amber-500 text-white', descColor: 'text-amber-200' };
        case 'red':
            return { btnBgClass: 'bg-red-600 hover:bg-red-500 text-white', descColor: 'text-red-200' };
        case 'purple':
            return { btnBgClass: 'bg-purple-600 hover:bg-purple-500 text-white', descColor: 'text-purple-200' };
        case 'pink':
            return { btnBgClass: 'bg-pink-600 hover:bg-pink-500 text-white', descColor: 'text-pink-200' };
        case 'indigo':
            return { btnBgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white', descColor: 'text-indigo-200' };
        case 'cyan':
            return { btnBgClass: 'bg-cyan-600 hover:bg-cyan-500 text-white', descColor: 'text-cyan-200' };
        case 'slate':
        case 'gray':
            return { btnBgClass: 'bg-slate-700 hover:bg-slate-600 text-slate-200', descColor: 'text-slate-400' };
        default:
            return { btnBgClass: 'bg-blue-600 hover:bg-blue-500 text-white', descColor: 'text-blue-200' };
    }
}

function captureOutcomeSnapshot(user, targetNPC) {
    return {
        health: user?.health ?? user?.stats?.health ?? 100,
        happiness: user?.happiness ?? user?.stats?.happiness ?? 100,
        smarts: user?.smarts ?? user?.stats?.smarts ?? 50,
        looks: user?.looks ?? user?.stats?.looks ?? 50,
        money: user?.money ?? 0,
        compCash: user?.compCash ?? 0,
        schoolPerformance: typeof user?.schoolPerformance === 'number' ? user.schoolPerformance : null,
        jobPerformance: typeof user?.jobPerformance === 'number' ? user.jobPerformance : null,
        npcStatus: typeof targetNPC?.status === 'number' ? targetNPC.status : null
    };
}

function buildOutcomeBadges(before, user, targetNPC, customBadges = []) {
    const badges = [];

    const pushDelta = (diff, label, isMoney = false) => {
        if (!diff || Number.isNaN(diff)) return;
        const positive = diff > 0;
        const formatted = isMoney
            ? `${positive ? '+' : '-'}${Utils.formatMoney(Math.abs(diff))}${label ? ' ' + label : ''}`
            : `${positive ? '+' : ''}${Math.round(diff)} ${label}`;
        badges.push({
            label: formatted,
            tone: positive ? 'good' : 'bad'
        });
    };

    const afterHealth = user?.health ?? user?.stats?.health ?? 100;
    const afterHappiness = user?.happiness ?? user?.stats?.happiness ?? 100;
    const afterSmarts = user?.smarts ?? user?.stats?.smarts ?? 50;
    const afterLooks = user?.looks ?? user?.stats?.looks ?? 50;
    const afterMoney = user?.money ?? 0;
    const afterCompCash = user?.compCash ?? 0;

    pushDelta(afterHealth - before.health, 'Health');
    pushDelta(afterHappiness - before.happiness, 'Happiness');
    pushDelta(afterSmarts - before.smarts, 'Smarts');
    pushDelta(afterLooks - before.looks, 'Looks');
    pushDelta(afterMoney - before.money, '', true);
    pushDelta(afterCompCash - before.compCash, 'Co. Cash', true);

    if (before.schoolPerformance !== null && typeof user?.schoolPerformance === 'number') {
        pushDelta(user.schoolPerformance - before.schoolPerformance, 'School Perf');
    }
    if (before.jobPerformance !== null && typeof user?.jobPerformance === 'number') {
        pushDelta(user.jobPerformance - before.jobPerformance, 'Job Perf');
    }
    if (before.npcStatus !== null && typeof targetNPC?.status === 'number') {
        const npcLabel = targetNPC.name ? `${targetNPC.name}` : 'Relationship';
        pushDelta(targetNPC.status - before.npcStatus, npcLabel);
    }

    if (Array.isArray(customBadges)) {
        customBadges.forEach(b => {
            if (b && b.label) {
                badges.push({ label: b.label, tone: b.tone || 'neutral' });
            }
        });
    }

    return badges;
}

export const processNextLifeEvent = () => {
    const queue = state.gameState?.pendingEvents;
    if (!queue || queue.length === 0) {
        renderLifeDashboard(state.gameState);
        if (typeof saveGame === "function") saveGame();
        return;
    }

    const item = queue[0];
    const user = state.gameState.user;
    const evt = LIFE_EVENTS[item.eventId];

    if (!evt) {
        // Unknown or deprecated event, skip safely
        queue.shift();
        processNextLifeEvent();
        return;
    }

    // Resolve target NPC if applicable
    let targetNPC = null;
    if (item.npcId && user.relationships) {
        targetNPC = user.relationships.find(r => r.id === item.npcId) || null;
    } else if (evt.getTargetNPC) {
        targetNPC = evt.getTargetNPC(user, state.gameState);
    }

    const renderData = evt.render(user, targetNPC);
    const badgeColor = renderData.badgeColor || 'bg-blue-600';
    const badgeText = renderData.badge || 'Life Event';
    const titleText = renderData.title || 'Life Event';

    let avatarHtml = '';
    if (renderData.avatar || targetNPC) {
        const npcObj = renderData.avatar || targetNPC;
        avatarHtml = `
            <div class="w-20 h-20 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center mx-auto mb-3 border-2 border-slate-500 shadow-xl">
                ${renderAvatar(npcObj)}
            </div>
        `;
    }

    const optionsHtml = renderData.options.map(opt => {
        const isDisabled = !!opt.disabled;
        const { btnBgClass, descColor } = getOptionColorClasses(opt.color || 'blue', isDisabled);

        const iconHtml = opt.icon ? `<i class="fas ${Utils.escapeHtml(opt.icon)} text-lg sm:text-xl"></i>` : '';
        const disabledAttr = isDisabled ? 'disabled aria-disabled="true"' : '';
        const npcArg = targetNPC && targetNPC.id ? `'${Utils.escapeHtml(targetNPC.id)}'` : 'null';
        const cleanTitle = (opt.title || '').replace(/^[\p{Extended_Pictographic}\u200d\uFE0F\s]+/u, '').trim() || opt.title;
        const badgePillHtml = opt.badge
            ? `<span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDisabled ? 'bg-slate-700/80 text-slate-400 border border-slate-600' : 'bg-black/25 text-white border border-white/20'} shrink-0">${Utils.escapeHtml(opt.badge)}</span>`
            : '';

        return `
            <button data-action="selectLifeEventChoice" data-args="'${Utils.escapeHtml(item.eventId)}', '${Utils.escapeHtml(opt.id)}', ${npcArg}" ${disabledAttr} class="w-full ${btnBgClass} font-bold py-3 px-4 rounded-xl flex items-center justify-between gap-2 transition group shadow-md text-left">
                <div class="flex items-center gap-3 min-w-0">
                    ${iconHtml}
                    <div class="min-w-0">
                        <div class="font-bold text-sm leading-tight">${Utils.escapeHtml(cleanTitle)}</div>
                        ${opt.description ? `<div class="text-[11px] ${descColor} mt-0.5">${Utils.escapeHtml(opt.description)}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    ${badgePillHtml}
                    ${!isDisabled ? '<i class="fas fa-chevron-right text-xs opacity-70 group-hover:translate-x-1 transition"></i>' : ''}
                </div>
            </button>
        `;
    }).join('');

    const modalHtml = `
        <div class="fade-in max-w-md mx-auto py-2 flex flex-col items-center text-center">
            ${avatarHtml}
            <div class="text-[10px] sm:text-xs font-bold uppercase tracking-wider ${badgeColor} text-white px-2.5 py-0.5 rounded-full mb-2 shadow-sm">
                ${Utils.escapeHtml(badgeText)}
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
                ${Utils.escapeHtml(titleText)}
            </h2>
            <p class="text-slate-300 text-sm mb-5 text-left bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                ${Utils.escapeHtml(renderData.narrative)}
            </p>
            <div class="w-full space-y-2.5">
                ${optionsHtml}
            </div>
        </div>
    `;

    SoundManager.play('eventPopup');
    UI.showCustomModal({
        title: titleText,
        content: modalHtml,
        showCloseBtn: false
    });
};

export const selectLifeEventChoice = (eventId, choiceId, targetNpcId) => {
    const queue = state.gameState?.pendingEvents;
    if (!queue || queue.length === 0) {
        UI.hideModal();
        renderLifeDashboard(state.gameState);
        return;
    }

    const user = state.gameState.user;
    const evt = LIFE_EVENTS[eventId];
    if (!evt) {
        queue.shift();
        UI.hideModal();
        processNextLifeEvent();
        return;
    }

    let targetNPC = null;
    if (targetNpcId && user.relationships) {
        targetNPC = user.relationships.find(r => r.id === targetNpcId) || null;
    } else if (evt.getTargetNPC) {
        targetNPC = evt.getTargetNPC(user, state.gameState);
    }

    const beforeSnapshot = captureOutcomeSnapshot(user, targetNPC);
    const result = evt.resolve(user, targetNPC, choiceId);

    if (result?.log) {
        addLog(result.log, result.logType || 'neutral');
    }

    UI.updateHeader(user);

    const outcomeBadges = buildOutcomeBadges(beforeSnapshot, user, targetNPC, result?.badges);
    const badgesHtml = outcomeBadges.length > 0
        ? `
            <div class="flex flex-wrap justify-center gap-1.5 mb-4 w-full" data-testid="outcome-delta-badges">
                ${outcomeBadges.map(b => {
                    let pillClass = 'bg-slate-800 text-slate-300 border-slate-600';
                    if (b.tone === 'good') pillClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
                    else if (b.tone === 'bad') pillClass = 'bg-red-950/70 text-red-300 border-red-700/60';
                    return `<span class="text-[11px] font-bold px-2.5 py-1 rounded-full border ${pillClass}">${Utils.escapeHtml(b.label)}</span>`;
                }).join('')}
            </div>
        `
        : '';

    const outcomeText = result?.outcomeText || result?.log || 'You made your choice.';
    const isGood = result?.logType === 'good';
    const isBad = result?.logType === 'bad';
    let outcomeBg = 'bg-slate-900/80 border-slate-700';
    let outcomeIcon = '<i class="fas fa-info-circle text-blue-400 text-2xl mb-2"></i>';

    if (isGood) {
        outcomeBg = 'bg-emerald-950/40 border-emerald-700/60';
        outcomeIcon = '<i class="fas fa-check-circle text-emerald-400 text-2xl mb-2"></i>';
    } else if (isBad) {
        outcomeBg = 'bg-red-950/40 border-red-700/60';
        outcomeIcon = '<i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>';
    }

    const outcomeHtml = `
        <div class="fade-in max-w-md mx-auto py-3 flex flex-col items-center text-center">
            ${outcomeIcon}
            <h3 class="text-lg font-bold text-white mb-2">Outcome</h3>
            <div class="w-full ${outcomeBg} p-4 rounded-xl border mb-4 text-sm text-slate-200 leading-relaxed text-left shadow-md">
                ${Utils.escapeHtml(outcomeText)}
            </div>
            ${badgesHtml}
            <button data-action="finishLifeEvent" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                <span>Continue</span>
                <i class="fas fa-arrow-right text-xs"></i>
            </button>
        </div>
    `;

    UI.replaceModalContent('Event Outcome', outcomeHtml);
};

export const finishLifeEvent = () => {
    const queue = state.gameState?.pendingEvents;
    if (queue && queue.length > 0) {
        queue.shift();
    }
    UI.hideModal();
    processNextLifeEvent();
};
