import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { saveGame } from '../../core/main.js';
import { GameLogic } from '../../core/gameLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { LIFE_EVENTS } from '../../core/eventManager.js';

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
        const color = opt.color || 'blue';
        let btnBgClass = 'bg-blue-600 hover:bg-blue-500 text-white';
        let descColor = 'text-blue-200';

        if (color === 'emerald' || color === 'green') {
            btnBgClass = 'bg-emerald-600 hover:bg-emerald-500 text-white';
            descColor = 'text-emerald-200';
        } else if (color === 'amber' || color === 'yellow') {
            btnBgClass = 'bg-amber-600 hover:bg-amber-500 text-white';
            descColor = 'text-amber-200';
        } else if (color === 'red') {
            btnBgClass = 'bg-red-600 hover:bg-red-500 text-white';
            descColor = 'text-red-200';
        } else if (color === 'slate' || color === 'gray') {
            btnBgClass = 'bg-slate-700 hover:bg-slate-600 text-slate-200';
            descColor = 'text-slate-400';
        }

        if (isDisabled) {
            btnBgClass = 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700';
            descColor = 'text-slate-600';
        }

        const iconHtml = opt.icon ? `<i class="fas ${Utils.escapeHtml(opt.icon)} text-lg sm:text-xl"></i>` : '';
        const disabledAttr = isDisabled ? 'disabled aria-disabled="true"' : '';
        const npcArg = targetNPC ? `'${targetNPC.id}'` : 'null';

        return `
            <button data-action="selectLifeEventChoice" data-args="'${Utils.escapeHtml(item.eventId)}', '${Utils.escapeHtml(opt.id)}', ${npcArg}" ${disabledAttr} class="w-full ${btnBgClass} font-bold py-3 px-4 rounded-xl flex items-center justify-between transition group shadow-md text-left">
                <div class="flex items-center gap-3">
                    ${iconHtml}
                    <div>
                        <div class="font-bold text-sm leading-tight">${Utils.escapeHtml(opt.title)}</div>
                        ${opt.description ? `<div class="text-[11px] ${descColor} mt-0.5">${Utils.escapeHtml(opt.description)}</div>` : ''}
                    </div>
                </div>
                ${!isDisabled ? '<i class="fas fa-chevron-right text-xs opacity-70 group-hover:translate-x-1 transition"></i>' : ''}
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

    const result = evt.resolve(user, targetNPC, choiceId);

    if (result?.log) {
        addLog(result.log, result.logType || 'neutral');
    }

    UI.updateHeader(user);

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
            <div class="w-full ${outcomeBg} p-4 rounded-xl border mb-5 text-sm text-slate-200 leading-relaxed text-left shadow-md">
                ${Utils.escapeHtml(outcomeText)}
            </div>
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
