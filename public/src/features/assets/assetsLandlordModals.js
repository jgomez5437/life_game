import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { captureAnnualSnapshot } from '../../core/timeMachine.js';
import { addLog } from '../player/mainScreen.js';
import { processNextFuneral } from '../relationships/funeralScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { renderPropertyManager } from './assetsPropertySalesModals.js';

export const openTenantScreening = (propertyId) => {
    const user = state.gameState.user;
    const property = (user.assets || []).find(a => a.id === propertyId);
    if (!property) return;

    const applicants = GameLogic.generateTenantApplicants(property);
    property._screeningApplicants = applicants;

    const applicantsHtml = applicants.map(app => `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-900 shrink-0 shadow-md">
                ${renderAvatar(app)}
            </div>
            <div class="flex-1 space-y-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-white text-base">${Utils.escapeHtml(app.name)}</h4>
                        <span class="text-xs text-blue-400 font-semibold">${Utils.escapeHtml(app.type)}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold text-base">${Utils.formatMoney(app.monthlyRent)}/mo</div>
                        <div class="text-[11px] text-slate-400">${app.leaseYears}-Year Lease</div>
                    </div>
                </div>
                <p class="text-xs text-slate-300">${Utils.escapeHtml(app.desc)}</p>
                <div class="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span class="text-xs ${app.quality === 'excellent' ? 'text-green-400' : app.quality === 'good' ? 'text-blue-400' : 'text-amber-400'} font-bold uppercase">Credit: ${app.quality}</span>
                    <button data-action="acceptTenantLease" data-args="${property.id}, '${app.id}'" class="bg-green-600 hover:bg-green-500 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition">
                        Sign Lease
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const modalHtml = `
        <div class="space-y-4">
            <p class="text-slate-300 text-sm">Screen and select a tenant for <span class="font-bold text-white">${Utils.escapeHtml(property.name)}</span>:</p>
            <div class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                ${applicantsHtml}
            </div>
        </div>
    `;

    UI.showModal(`Screen Applicants - ${Utils.escapeHtml(property.name)}`, modalHtml);
};

export const acceptTenantLease = (propertyId, applicantId) => {
    const user = state.gameState.user;
    const result = GameLogic.acceptTenantLease(user, propertyId, applicantId);

    if (result.success) {
        addLog(`Signed a ${result.tenant.leaseYears}-year lease with ${result.tenant.name} for ${result.propertyName} (${Utils.formatMoney(result.tenant.monthlyRent)}/month).`, 'good');
        saveGame();
        UI.hideModal();
        UI.updateHeader(user);
        renderPropertyManager(propertyId);
        UI.showModal("Lease Signed!", `You rented ${Utils.escapeHtml(result.propertyName)} to ${Utils.escapeHtml(result.tenant.name)} for ${Utils.formatMoney(result.tenant.monthlyRent)}/month!`);
    } else {
        UI.showModal("Lease Error", result.reason);
    }
};

export const evictTenantAction = (propertyId) => {
    const user = state.gameState.user;
    const result = GameLogic.evictTenant(user, propertyId);

    if (result.success) {
        addLog(`Evicted tenant ${result.tenantName} from ${result.propertyName}. Property is now vacant.`, 'neutral');
        saveGame();
        UI.updateHeader(user);
        renderPropertyManager(propertyId);
        UI.showModal("Tenant Evicted", `You evicted ${Utils.escapeHtml(result.tenantName)} from ${Utils.escapeHtml(result.propertyName)}.`);
    } else {
        UI.showModal("Eviction Failed", result.reason);
    }
};

export const processNextTenantDefaultEvent = () => {
    const queue = state.gameState.pendingTenantEvents;
    if (!queue || queue.length === 0) {
        processNextFuneral();
        return;
    }

    const event = queue[0];
    const user = state.gameState.user;

    // Check for property manager annual report FIRST before per-property checks
    if (event.eventType === 'manager_report') {
        const report = user?.propertyManager?.lastReport;
        if (!report) {
            queue.shift();
            processNextTenantDefaultEvent();
            return;
        }
        renderAnnualManagerReportModal(report, true);
        return;
    }

    const property = (user && user.assets || []).find(a => a.id === event.propertyId);

    // Stale event validation: if property is gone, not rented, or has no tenant, purge and skip
    if (!property || !property.isRented || !property.tenant || (event.tenantId && property.tenant.id !== event.tenantId)) {
        queue.shift();
        processNextTenantDefaultEvent();
        return;
    }

    // Managed property validation: the property manager handles renewals, overdue rent, and damage
    if (GameLogic.isPropertyManaged(user, property)) {
        queue.shift();
        processNextTenantDefaultEvent();
        return;
    }

    const tenantAvatarObj = event.tenant || { name: event.tenantName, age: 35 };

    if (event.eventType === 'lease_expiration') {
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-blue-900/30 p-4 rounded-xl border border-blue-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(tenantAvatarObj)}
                    </div>
                    <h3 class="text-white font-bold text-lg">${Utils.escapeHtml(event.tenantName)} Wants to Renew!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        Your tenant in <span class="font-bold text-white">${Utils.escapeHtml(event.propertyName)}</span> reached the end of their lease and would like to renew for <span class="text-blue-400 font-bold">${event.requestedYears} year${event.requestedYears === 1 ? '' : 's'}</span>.
                    </p>
                    <div class="mt-3 text-blue-300 font-bold text-base bg-blue-950/60 py-2 rounded-lg border border-blue-800/60">
                        Current Rent: ${Utils.formatMoney(event.currentRent)}/mo
                    </div>
                </div>

                <p class="text-xs text-slate-400 text-center">Choose how to handle this renewal:</p>

                <div class="space-y-2">
                    <button data-action="renewLeaseSameRate" data-args="${event.propertyId}, '${event.tenantId}', ${event.requestedYears}, ${event.currentRent}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-file-contract"></i> Renew at Same Rate (${Utils.formatMoney(event.currentRent)}/mo)</span>
                        <span class="text-[11px] text-blue-200">${event.requestedYears}-Yr Term</span>
                    </button>

                    <button data-action="renewLeaseWithIncrease" data-args="${event.propertyId}, '${event.tenantId}', ${event.requestedYears}, ${event.increasedRent}" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-chart-line"></i> Offer Renewal with 5% Increase (${Utils.formatMoney(event.increasedRent)}/mo)</span>
                        <span class="text-[11px] text-green-200">+5% Rent</span>
                    </button>

                    <button data-action="declineLeaseRenewal" data-args="${event.propertyId}" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-times-circle text-red-400"></i> Don't Renew</span>
                        <span class="text-[11px] text-slate-400">Vacate Property</span>
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal({
            title: `Lease Expiration - ${Utils.escapeHtml(event.propertyName)}`,
            content: modalHtml,
            showCloseBtn: false
        });
        return;
    }

    if (event.eventType === 'damage') {
        const modalHtml = `
            <div class="space-y-4">
                <div class="bg-amber-900/30 p-4 rounded-xl border border-amber-700/50 text-center shadow-lg">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-800 mx-auto mb-2 shadow-md">
                        ${renderAvatar(tenantAvatarObj)}
                    </div>
                    <h3 class="text-white font-bold text-lg">${Utils.escapeHtml(event.tenantName)} Caused Damage!</h3>
                    <p class="text-slate-300 text-sm mt-1">
                        Your tenant in <span class="font-bold text-white">${Utils.escapeHtml(event.propertyName)}</span> caused property damage (-10% condition).
                    </p>
                    <div class="mt-3 text-amber-300 font-bold text-base bg-amber-950/60 py-2 rounded-lg border border-amber-800/60">
                        Estimated Repair Cost: ${Utils.formatMoney(event.repairCost)}
                    </div>
                </div>

                <p class="text-xs text-slate-400 text-center">Choose how to handle this tenant:</p>

                <div class="space-y-2">
                    <button data-action="demandTenantRepairPayment" data-args="${event.propertyId}, '${event.tenantId}', ${event.repairCost}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-wrench"></i> Ask ${Utils.escapeHtml(event.tenantName)} to Pay for Repairs</span>
                        <span class="text-[11px] text-blue-200">Attempt Recovery</span>
                    </button>

                    <button data-action="forgiveTenantDamage" data-args="${event.propertyId}, '${event.tenantId}'" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-heart text-amber-400"></i> Forgive Them & Let It Go</span>
                        <span class="text-[11px] text-slate-400">Absorb Damage</span>
                    </button>

                    <button data-action="evictTenantFromEvent" data-args="${event.propertyId}" class="w-full bg-red-900/50 hover:bg-red-800/70 border border-red-700 text-red-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                        <span class="flex items-center gap-2"><i class="fas fa-user-slash"></i> Evict Tenant</span>
                        <span class="text-[11px] text-red-300">Vacate Property</span>
                    </button>
                </div>
            </div>
        `;

        UI.showCustomModal({
            title: `Tenant Damage - ${Utils.escapeHtml(event.propertyName)}`,
            content: modalHtml,
            showCloseBtn: false
        });
        return;
    }

    const modalHtml = `
        <div class="space-y-4">
            <div class="bg-red-900/30 p-4 rounded-xl border border-red-700/50 text-center shadow-lg">
                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-red-400 bg-slate-800 mx-auto mb-2 shadow-md">
                    ${renderAvatar(tenantAvatarObj)}
                </div>
                <h3 class="text-white font-bold text-lg">${Utils.escapeHtml(event.tenantName)} is Overdue!</h3>
                <p class="text-slate-300 text-sm mt-1">
                    Your tenant in <span class="font-bold text-white">${Utils.escapeHtml(event.propertyName)}</span> has fallen <span class="text-red-400 font-bold">2 months behind</span> on rent.
                </p>
                <div class="mt-3 text-red-300 font-bold text-base bg-red-950/60 py-2 rounded-lg border border-red-800/60">
                    Overdue Amount: ${Utils.formatMoney(event.missedAmount)}
                </div>
            </div>

            <p class="text-xs text-slate-400 text-center">Choose how to handle this tenant:</p>

            <div class="space-y-2">
                <button data-action="demandTenantRentPayment" data-args="${event.propertyId}, '${event.tenantId}', ${event.missedAmount}" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-hand-holding-usd"></i> Ask ${Utils.escapeHtml(event.tenantName)} to Pay</span>
                    <span class="text-[11px] text-blue-200">Attempt Recovery</span>
                </button>

                <button data-action="forgiveTenantRent" data-args="${event.propertyId}, '${event.tenantId}'" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-heart text-amber-400"></i> Forgive Them & Let It Go</span>
                    <span class="text-[11px] text-slate-400">Waive ${Utils.formatMoney(event.missedAmount)}</span>
                </button>

                <button data-action="evictTenantFromEvent" data-args="${event.propertyId}" class="w-full bg-red-900/50 hover:bg-red-800/70 border border-red-700 text-red-200 font-bold py-3 rounded-xl text-xs flex items-center justify-between px-4 transition">
                    <span class="flex items-center gap-2"><i class="fas fa-user-slash"></i> Evict Tenant</span>
                    <span class="text-[11px] text-red-300">Vacate Property</span>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: `Tenant Overdue - ${Utils.escapeHtml(event.propertyName)}`,
        content: modalHtml,
        showCloseBtn: false
    });
};

export const demandTenantRepairPayment = (propertyId, tenantId, repairCost) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const roll = Math.random();
    UI.closeAllModals();
    if (roll < 0.70) {
        addLog(`Asked tenant ${event ? event.tenantName : 'tenant'} to pay for repairs on ${event ? event.propertyName : 'property'}. They agreed and paid ${Utils.formatMoney(repairCost)}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Repairs Covered!", `Tenant ${event ? Utils.escapeHtml(event.tenantName) : ''} agreed to pay the ${Utils.formatMoney(repairCost)} for property repairs.`, () => processNextTenantDefaultEvent());
    } else {
        const prop = (user.assets || []).find(a => a.id === propertyId);
        if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);
        addLog(`Asked tenant ${event ? event.tenantName : 'tenant'} to pay for repairs, but they refused. Property condition decreased by 10%.`, 'bad');
        UI.showModal("Payment Refused", `Tenant ${event ? Utils.escapeHtml(event.tenantName) : ''} refused to pay for repairs. Property condition decreased by 10%.`, () => processNextTenantDefaultEvent());
    }
};

export const forgiveTenantDamage = (propertyId, tenantId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const prop = (user.assets || []).find(a => a.id === propertyId);
    if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);

    addLog(`Forgave tenant ${event ? event.tenantName : ''} for property damage on ${event ? event.propertyName : 'property'} (-10% condition).`, 'neutral');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const demandTenantRentPayment = (propertyId, tenantId, missedAmount) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const roll = Math.random();
    UI.closeAllModals();
    if (roll < 0.70) {
        user.money += missedAmount;
        addLog(`Demanded overdue rent from ${event ? event.tenantName : 'tenant'}. They paid back ${Utils.formatMoney(missedAmount)}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Rent Recovered!", `Tenant ${event ? Utils.escapeHtml(event.tenantName) : ''} apologized and paid the full ${Utils.formatMoney(missedAmount)} in overdue rent.`, () => processNextTenantDefaultEvent());
    } else {
        addLog(`Demanded overdue rent from ${event ? event.tenantName : 'tenant'}, but they were unable to pay ${Utils.formatMoney(missedAmount)}.`, 'bad');
        UI.showModal("Payment Refused", `Tenant ${event ? Utils.escapeHtml(event.tenantName) : ''} claimed they cannot afford to pay the overdue rent.`, () => processNextTenantDefaultEvent());
    }
};

export const forgiveTenantRent = (propertyId, tenantId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    addLog(`Forgave overdue rent for tenant ${event ? event.tenantName : ''}.`, 'neutral');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const evictTenantFromEvent = (propertyId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    if (event && event.eventType === 'damage') {
        const prop = (user.assets || []).find(a => a.id === propertyId);
        if (prop) prop.condition = Math.max(0, (prop.condition || 100) - 10);
    }

    const result = GameLogic.evictTenant(user, propertyId);
    if (state.gameState && Array.isArray(state.gameState.pendingTenantEvents)) {
        state.gameState.pendingTenantEvents = state.gameState.pendingTenantEvents.filter(e => e.propertyId !== propertyId);
    }
    UI.closeAllModals();
    if (result.success) {
        addLog(`Evicted tenant ${result.tenantName} from ${result.propertyName}. Property is now vacant.`, 'bad');
        UI.updateHeader(user);
        UI.showModal("Tenant Evicted", `You evicted ${result.tenantName} from ${result.propertyName}. The property is now vacant.`, () => processNextTenantDefaultEvent());
    } else {
        processNextTenantDefaultEvent();
    }
};

export const renewLeaseSameRate = (propertyId, tenantId, requestedYears, currentRent) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const property = (user.assets || []).find(a => a.id === propertyId);
    if (property && property.tenant) {
        property.tenant.leaseYears = requestedYears;
        property.tenant.renewalPending = false;
    }

    addLog(`Renewed ${event ? event.tenantName : 'tenant'}'s lease on ${event ? event.propertyName : 'property'} for ${requestedYears} year(s) at ${Utils.formatMoney(currentRent)}/mo.`, 'good');
    UI.hideModal();
    processNextTenantDefaultEvent();
};

export const renewLeaseWithIncrease = (propertyId, tenantId, requestedYears, increasedRent) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    const property = (user.assets || []).find(a => a.id === propertyId);

    const roll = Math.random();
    UI.closeAllModals();
    if (roll < 0.80) { // 80% chance tenant accepts 5% increase
        if (property && property.tenant) {
            property.tenant.leaseYears = requestedYears;
            property.tenant.monthlyRent = increasedRent;
            property.tenant.renewalPending = false;
        }
        addLog(`Tenant ${event ? event.tenantName : 'tenant'} accepted the 5% rent increase (${Utils.formatMoney(increasedRent)}/mo) for a ${requestedYears}-year lease on ${event ? event.propertyName : 'property'}!`, 'good');
        UI.updateHeader(user);
        UI.showModal("Increase Accepted!", `Tenant ${event ? event.tenantName : ''} accepted the 5% rent increase to ${Utils.formatMoney(increasedRent)}/month.`, () => processNextTenantDefaultEvent());
    } else {
        GameLogic.evictTenant(user, propertyId);
        if (state.gameState && Array.isArray(state.gameState.pendingTenantEvents)) {
            state.gameState.pendingTenantEvents = state.gameState.pendingTenantEvents.filter(e => e.propertyId !== propertyId);
        }
        addLog(`Tenant ${event ? event.tenantName : 'tenant'} rejected the 5% rent increase and moved out of ${event ? event.propertyName : 'property'}.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal("Increase Rejected", `Tenant ${event ? event.tenantName : ''} rejected the 5% rent increase and moved out. The property is now vacant.`, () => processNextTenantDefaultEvent());
    }
};

export const declineLeaseRenewal = (propertyId) => {
    const user = state.gameState.user;
    const queue = state.gameState.pendingTenantEvents || [];
    const event = queue.shift();

    GameLogic.evictTenant(user, propertyId);
    if (state.gameState && Array.isArray(state.gameState.pendingTenantEvents)) {
        state.gameState.pendingTenantEvents = state.gameState.pendingTenantEvents.filter(e => e.propertyId !== propertyId);
    }
    addLog(`Declined lease renewal for tenant ${event ? event.tenantName : 'tenant'} on ${event ? event.propertyName : 'property'}. Property is now vacant.`, 'neutral');
    UI.updateHeader(user);
    UI.hideModal();
    processNextTenantDefaultEvent();
};


export function getAnnualManagerReportHtml(report, isAgeUpFlow = true) {
    const user = state.gameState?.user;
    const pm = user?.propertyManager;
    if (!pm || !report) return '';

    const propsHtml = (report.properties || []).map(p => `
        <div class="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/80 flex justify-between items-center text-xs">
            <div>
                <div class="font-bold text-white">${Utils.escapeHtml(p.propertyName)}</div>
                <div class="text-[11px] text-slate-400">Tenant: <span class="text-slate-200">${Utils.escapeHtml(p.tenantName)}</span> • ${Utils.escapeHtml(p.note)}</div>
            </div>
            <div class="text-right">
                <div class="text-green-400 font-bold">${Utils.formatMoney(p.gross)}</div>
                <div class="text-[10px] text-slate-400">Net: ${Utils.formatMoney(p.net)}</div>
            </div>
        </div>
    `).join('') || '<div class="text-xs text-slate-400 italic text-center py-2">No active rentals collected this year.</div>';

    const activityHtml = (report.activity || []).map(a => {
        const iconClass = String(a.icon || 'fa-info-circle').replace(/[^a-zA-Z0-9_\-\s]/g, '');
        return `
        <div class="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <i class="fas ${iconClass || 'fa-info-circle'} text-indigo-400 mt-0.5"></i>
            <span>${Utils.escapeHtml(a.text)}</span>
        </div>
    `;
    }).join('');

    const repairs = report.repairs || [];
    const pendingRepairs = repairs.filter(r => r.status === 'pending');

    const repairsHtml = repairs.map(r => {
        const safeRepairId = Utils.escapeHtml(r.id);
        const safeIcon = String(r.icon || 'fa-wrench').replace(/[^a-zA-Z0-9_\-\s]/g, '') || 'fa-wrench';
        let actionContent = '';
        if (r.status === 'approved') {
            actionContent = `<span class="bg-green-900/60 text-green-300 border border-green-700 text-[10px] uppercase px-2 py-0.5 rounded font-bold"><i class="fas fa-check mr-1"></i>Approved (${Utils.formatMoney(r.cost)})</span>`;
        } else if (r.status === 'declined') {
            actionContent = `<span class="bg-red-900/60 text-red-300 border border-red-700 text-[10px] uppercase px-2 py-0.5 rounded font-bold"><i class="fas fa-times mr-1"></i>Declined (-${r.conditionLoss}% Cond)</span>`;
        } else {
            const canAfford = (user?.money || 0) >= r.cost;
            actionContent = `
                <div class="flex items-center gap-2">
                    <button data-action="approveManagerRepairAction" data-args="'${safeRepairId}'"
                        ${canAfford ? '' : 'disabled'}
                        class="${canAfford ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 opacity-50 cursor-not-allowed text-slate-400'} px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                        <i class="fas fa-wrench"></i> Approve (${Utils.formatMoney(r.cost)})
                    </button>
                    <button data-action="declineManagerRepairAction" data-args="'${safeRepairId}'"
                        class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                        Decline
                    </button>
                </div>
            `;
        }

        return `
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-white text-xs flex items-center gap-1.5">
                            <i class="fas ${safeIcon} text-amber-400"></i>
                            ${Utils.escapeHtml(r.type)}
                        </div>
                        <div class="text-[11px] text-slate-400">${Utils.escapeHtml(r.propertyName)} • Tenant: ${Utils.escapeHtml(r.tenantName)}</div>
                    </div>
                    <div class="text-right">
                        <span class="text-amber-300 font-bold text-xs">${Utils.formatMoney(r.cost)}</span>
                    </div>
                </div>
                <p class="text-[11px] text-slate-300">${Utils.escapeHtml(r.desc)}</p>
                <div class="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Impact: <span class="text-green-400">+${r.conditionGain}% condition</span> if approved / <span class="text-red-400">-${r.conditionLoss}%</span> if declined</span>
                    <div>${actionContent}</div>
                </div>
            </div>
        `;
    }).join('');

    const approveAllBtn = pendingRepairs.length > 1 ? `
        <button data-action="approveAllManagerRepairsAction" class="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 mb-2">
            <i class="fas fa-check-double"></i> Approve All Pending Repairs (${pendingRepairs.length})
        </button>
    ` : '';

    return `
        <div class="space-y-4">
            <!-- MANAGER HEADER -->
            <div class="bg-indigo-950/60 p-4 rounded-xl border border-indigo-700/60 text-center shadow-lg">
                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-800 mx-auto mb-2 shadow-md">
                    ${renderAvatar(pm)}
                </div>
                <h3 class="text-white font-bold text-lg">${Utils.escapeHtml(pm.name)}</h3>
                <p class="text-indigo-300 text-xs font-semibold">Annual Rental Portfolio Report • Age ${report.age}</p>
                <p class="text-slate-300 text-xs mt-2 italic">"Here is your annual financial breakdown and property updates for this year."</p>
            </div>

            <!-- FINANCIAL SUMMARY -->
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 grid grid-cols-3 gap-2 text-center">
                <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                    <div class="text-[9px] uppercase font-bold text-slate-400">Gross Rent</div>
                    <div class="text-green-400 font-bold text-xs mt-0.5">${Utils.formatMoney(report.gross)}</div>
                </div>
                <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                    <div class="text-[9px] uppercase font-bold text-amber-400">10% Fee</div>
                    <div class="text-amber-400 font-bold text-xs mt-0.5">-${Utils.formatMoney(report.fee)}</div>
                </div>
                <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
                    <div class="text-[9px] uppercase font-bold text-emerald-400">Net to You</div>
                    <div class="text-emerald-300 font-bold text-xs mt-0.5">+${Utils.formatMoney(report.net)}</div>
                </div>
            </div>

            <!-- PER PROPERTY RENT -->
            <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                <div class="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                    <i class="fas fa-building text-indigo-400"></i> Collected Rent by Property
                </div>
                <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    ${propsHtml}
                </div>
            </div>

            <!-- ACTIVITY (RENEWALS / REPLACEMENTS) -->
            ${activityHtml ? `
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div class="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                        <i class="fas fa-clipboard-check text-indigo-400"></i> Portfolio Activity
                    </div>
                    <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        ${activityHtml}
                    </div>
                </div>
            ` : ''}

            <!-- REPAIRS -->
            ${repairs.length > 0 ? `
                <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div class="flex justify-between items-center">
                        <div class="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                            <i class="fas fa-tools text-amber-400"></i> Repair Requests (${repairs.length})
                        </div>
                        ${pendingRepairs.length > 0 ? '<span class="text-[10px] text-amber-400 font-bold">Action Needed</span>' : '<span class="text-[10px] text-green-400 font-bold">All Resolved</span>'}
                    </div>
                    ${approveAllBtn}
                    <div class="space-y-2">
                        ${repairsHtml}
                    </div>
                </div>
            ` : ''}

            <!-- DISMISS BUTTON -->
            <div class="pt-2">
                <button data-action="${isAgeUpFlow ? 'dismissManagerReportAction' : 'hideModal'}" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-900/40">
                    <i class="fas fa-check mr-1.5"></i> ${isAgeUpFlow ? 'Done & Continue' : 'Close Report'}
                </button>
            </div>
        </div>
    `;
}

function updateManagerReportModal(report) {
    const isAgeUpFlow = Array.isArray(state.gameState?.pendingTenantEvents) && state.gameState.pendingTenantEvents[0]?.eventType === 'manager_report';
    const user = state.gameState?.user;
    const pm = user?.propertyManager;
    const title = pm ? `Annual Report from ${Utils.escapeHtml(pm.name)}` : "Annual Rental Report";
    UI.replaceModalContent(title, getAnnualManagerReportHtml(report, isAgeUpFlow));
}

export const renderAnnualManagerReportModal = (report, isAgeUpFlow = true) => {
    const user = state.gameState?.user;
    const pm = user?.propertyManager;
    const title = pm ? `Annual Report from ${Utils.escapeHtml(pm.name)}` : "Annual Rental Report";
    const content = getAnnualManagerReportHtml(report, isAgeUpFlow);

    UI.showCustomModal({
        title,
        content,
        showCloseBtn: !isAgeUpFlow
    });
};

export const viewLastManagerReport = () => {
    const user = state.gameState?.user;
    if (!user || !user.propertyManager || !user.propertyManager.lastReport) {
        UI.showModal("No Report Available", "Your property manager hasn't submitted an annual report yet. You will receive one after you age up.");
        return;
    }
    renderAnnualManagerReportModal(user.propertyManager.lastReport, false);
};

export const approveManagerRepairAction = (repairId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const result = GameLogic.resolveManagerRepair(user, repairId, true);
    if (!result.success) {
        UI.showModal("Repair Failed", result.reason);
        return;
    }
    addLog(`Approved repair: ${result.repair.type} on ${result.propertyName} for ${Utils.formatMoney(result.repair.cost)}.`, 'good');
    captureAnnualSnapshot(state.gameState);
    saveGame();
    UI.updateHeader(user);
    updateManagerReportModal(user.propertyManager?.lastReport);
};

export const declineManagerRepairAction = (repairId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const result = GameLogic.resolveManagerRepair(user, repairId, false);
    if (!result.success) {
        UI.showModal("Action Failed", result.reason);
        return;
    }
    addLog(`Declined repair: ${result.repair.type} on ${result.propertyName}. Property condition dropped by ${result.repair.conditionLoss}%.`, 'bad');
    captureAnnualSnapshot(state.gameState);
    saveGame();
    UI.updateHeader(user);
    updateManagerReportModal(user.propertyManager?.lastReport);
};

export const approveAllManagerRepairsAction = () => {
    const user = state.gameState?.user;
    if (!user) return;
    const pending = GameLogic.getPendingManagerRepairs(user);
    if (pending.length === 0) return;

    let approvedCount = 0;
    let totalCost = 0;
    for (const r of pending) {
        const res = GameLogic.resolveManagerRepair(user, r.id, true);
        if (res.success) {
            approvedCount++;
            totalCost += r.cost;
        } else {
            break;
        }
    }
    if (approvedCount > 0) {
        addLog(`Approved ${approvedCount} property repair${approvedCount === 1 ? '' : 's'} for a total of ${Utils.formatMoney(totalCost)}.`, 'good');
        captureAnnualSnapshot(state.gameState);
        saveGame();
        UI.updateHeader(user);
    }
    updateManagerReportModal(user.propertyManager?.lastReport);
};

export const dismissManagerReportAction = () => {
    const queue = state.gameState?.pendingTenantEvents;
    if (queue && queue.length > 0 && queue[0].eventType === 'manager_report') {
        queue.shift();
    }
    UI.closeAllModals();
    processNextTenantDefaultEvent();
};




