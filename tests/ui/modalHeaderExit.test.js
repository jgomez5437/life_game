import { jest } from '@jest/globals';
import { UI } from '../../public/src/ui/ui.js';
import { state } from '../../public/src/core/state.js';
import { openSettingsModal } from '../../public/src/features/more/settingsScreen.js';
import { openPlayerOverviewModal } from '../../public/src/features/player/playerOverviewScreen.js';
import { renderGraveyardModal } from '../../public/src/features/player/graveyardScreen.js';
import { renderVipLoungeModal } from '../../public/src/features/store/vipLounge.js';
import { renderInstantDiplomaHub } from '../../public/src/features/education/instantDiploma.js';
import { renderSaveSlotManagerModal } from '../../public/src/core/saveSlotManager.js';
import { renderTimeMachineModal } from '../../public/src/core/timeMachine.js';
import { renderGodModeModal, openGodModeHubModal } from '../../public/src/features/store/storeScreen.js';
import { openDietSelectionModal, openTravelModal } from '../../public/src/features/more/moreScreen.js';
import { openAchievementsModal } from '../../public/src/features/more/achievementsScreen.js';
import {
    openInmateDetailModal,
    openDealerBuyModal,
    openDealerSellModal,
    openContrabandPhoneModal
} from '../../public/src/features/more/prisonScreen.js';
import {
    openHookupModal,
    renderAgeUpCheatingDiscoveredModal,
    openRingSelectionModal
} from '../../public/src/features/relationships/relationshipScreen.js';
import {
    showArrestModal,
    openBribeModal,
    showCourtArraignmentModal
} from '../../public/src/features/more/crimeScreen.js';

describe('Modal Header Exit Button & Interactive Navigation Suite', () => {

    beforeEach(() => {
        localStorage.clear();
        document.body.className = '';
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-brand"></div>
            <div id="header-user-info" class="hidden">
                <span id="header-name">Player</span>
                <span id="header-age">18</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="health-container"></div>
            <div id="ui-happiness">100%</div>
            <div id="happiness-container"></div>
            <div id="ui-smarts">50%</div>
            <div id="smarts-container"></div>
            <div id="ui-looks">50%</div>
            <div id="looks-container"></div>
            <!-- Full modal structure matching index.html -->
            <div id="modal-overlay" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
                <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-5 flex flex-col max-h-[85vh] overflow-hidden my-auto">
                    <div id="modal-header" class="flex items-center justify-between gap-3 mb-3 shrink-0">
                        <h2 id="modal-title" class="text-xl font-bold text-white truncate">Alert</h2>
                        <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0" title="Close" aria-label="Close modal">
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    </div>
                    <div id="modal-content" class="text-slate-300 overflow-y-auto pr-1 flex-1 space-y-3"></div>
                    <div id="modal-actions" class="w-full shrink-0 mt-4">
                        <button id="modal-btn" class="w-full btn-primary text-white font-bold py-3 rounded-lg">Dismiss</button>
                    </div>
                </div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'TestHero',
                name: 'TestHero',
                age: 28,
                money: 100000,
                health: 95,
                happiness: 90,
                smarts: 80,
                looks: 85,
                city: 'New York',
                purchases: ['vip_supporter', 'god_mode', 'instant_diplomas', 'time_machine'],
                assets: [],
                relationships: [
                    {
                        id: 'npc_1',
                        name: 'Jane Doe',
                        age: 27,
                        gender: 'female',
                        type: 'Friend',
                        category: 'friend',
                        status: 80
                    }
                ],
                cellmate: {
                    id: 'cm_1',
                    name: 'Big Tony',
                    age: 34,
                    crime: 'Armed Robbery',
                    perk: 'Heavy Hitter',
                    role: 'Cellmate',
                    status: 60
                },
                yardInmates: [
                    {
                        id: 'yard_1',
                        name: 'Slick Rick',
                        age: 29,
                        crime: 'Smuggling',
                        role: 'Contraband Dealer',
                        status: 50
                    }
                ],
                prisonStats: {
                    canteenCash: 250,
                    contraband: ['Pack of Cigarettes', 'Writing Paper & Pen']
                },
                pastLives: []
            },
            pastLives: [],
            lifeLog: []
        };
        state.userAuthId = null;
        state.userEmail = null;
        state.auth0Client = null;
        UI.closeAllModals();
    });

    test('UI.showModal displays title, content, Dismiss button, hides top close button, and executes onClose on Dismiss click', () => {
        const onClose = jest.fn();
        UI.showModal("Info Notice", "<p>Hello world</p>", onClose);

        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close-btn');
        const dismissBtn = document.getElementById('modal-btn');

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(title.textContent).toBe("Info Notice");
        expect(content.innerHTML).toContain("Hello world");
        expect(closeBtn.classList.contains('hidden')).toBe(true);
        expect(dismissBtn).not.toBeNull();

        // Click Dismiss button
        dismissBtn.click();

        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('UI.showConfirm displays Confirm/Cancel buttons, hides top close button, and executes onCancel on Cancel click', () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        UI.showConfirm("Are you sure?", "Please confirm", "Yes", onConfirm, "No", onCancel);

        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const closeBtn = document.getElementById('modal-close-btn');
        const cancelBtn = document.getElementById('modal-cancel');

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(title.textContent).toBe("Are you sure?");
        expect(closeBtn.classList.contains('hidden')).toBe(true);
        expect(cancelBtn).not.toBeNull();

        // Click cancel button
        cancelBtn.click();

        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(onConfirm).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('UI.showCustomModal executes onClose callback when showCloseBtn is true, and hides close button when showCloseBtn is false', () => {
        const onClose = jest.fn();
        UI.showCustomModal({
            title: "Custom Header",
            content: "<div>Custom Body</div>",
            showCloseBtn: true,
            onClose
        });

        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const closeBtn = document.getElementById('modal-close-btn');

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(title.textContent).toBe("Custom Header");
        expect(closeBtn.classList.contains('hidden')).toBe(false);

        closeBtn.click();
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);

        // Test showCloseBtn = false
        UI.showCustomModal({
            title: "No Exit Allowed",
            content: "<div>Locked dilemma modal</div>",
            showCloseBtn: false
        });
        expect(closeBtn.classList.contains('hidden')).toBe(true);
    });

    test('Prison Modals render both inline exit buttons and active top close (X) buttons', () => {
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close-btn');

        // 1. Cellmate Inmate Detail Modal
        openInmateDetailModal('cellmate');
        expect(titleEl.textContent).toBe("Big Tony");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('data-action="hideModal"');
        expect(contentEl.innerHTML).toContain('Close Interaction');

        // 2. Contraband Dealer Buy Modal
        openDealerBuyModal();
        expect(titleEl.textContent).toBe("Contraband Dealer - Buy");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('data-action="hideModal"');
        expect(contentEl.innerHTML).toContain('Exit Store');

        // 3. Contraband Dealer Sell Modal
        openDealerSellModal();
        expect(titleEl.textContent).toBe("Contraband Dealer - Sell");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('data-action="hideModal"');
        expect(contentEl.innerHTML).toContain('Exit Store');

        // 4. Contraband Cellphone Modal
        openContrabandPhoneModal();
        expect(titleEl.textContent).toBe("Contraband Cellphone");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('data-action="hideModal"');
        expect(contentEl.innerHTML).toContain('Close Phone');
    });

    test('Feature & Store Modals render with active top close buttons and inline exit buttons', () => {
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close-btn');

        // 1. Family Graveyard Modal
        renderGraveyardModal();
        expect(titleEl.textContent).toBe("Family Graveyard & Lineage");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Graveyard');

        // 2. Achievements Modal
        openAchievementsModal();
        expect(titleEl.textContent).toBe("Achievements & Trophies");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Achievements');

        // 3. VIP Lounge Modal
        renderVipLoungeModal();
        expect(titleEl.textContent).toBe("VIP Lounge");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close VIP Lounge');

        // 4. Instant Diploma Hub Modal
        renderInstantDiplomaHub();
        expect(titleEl.textContent).toBe("Instant Diploma Hub");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Hub');

        // 5. Save Slot Manager Modal
        renderSaveSlotManagerModal();
        expect(titleEl.textContent).toBe("Save & Load Slots");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Slots Manager');

        // 6. Time Machine Modal
        renderTimeMachineModal();
        expect(titleEl.textContent).toBe("Time Machine & Timeline Scrubber");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Time Machine');

        // 7. God Mode Stat Editor Modal
        renderGodModeModal();
        expect(titleEl.textContent).toBe("God Mode Stat Editor");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close');

        // 8. God Mode Control Center Modal
        openGodModeHubModal();
        expect(titleEl.textContent).toBe("God Mode Control Center");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Close Hub');

        // 9. Diet Selection Modal
        openDietSelectionModal();
        expect(titleEl.textContent).toBe("Choose Diet Plan");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Cancel / Keep Current Diet');

        // 10. Travel Modal
        openTravelModal();
        expect(titleEl.textContent).toBe("Travel & Vacations");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Cancel Vacation');

        // 11. Proposal Ring Selection Modal
        openRingSelectionModal('npc_1');
        expect(titleEl.textContent).toBe("Select Proposal Ring");
        expect(closeBtn.classList.contains('hidden')).toBe(false);
        expect(contentEl.innerHTML).toContain('Cancel Proposal');
    });

    test('Mandatory story dilemma events strictly HIDE the top close button so player must make a choice', () => {
        const titleEl = document.getElementById('modal-title');
        const closeBtn = document.getElementById('modal-close-btn');

        // 1. Steamy Opportunity (Hookup choice)
        const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1);
        state.gameState.user.relationships = [
            { id: 'npc_1', name: 'Jane Doe', category: 'partner', type: 'Girlfriend', status: 100, age: 27, gender: 'female' }
        ];
        openHookupModal('npc_1');
        expect(titleEl.textContent).toBe("Steamy Opportunity");
        expect(closeBtn.classList.contains('hidden')).toBe(true);
        randSpy.mockRestore();

        // 2. Cheating Discovered (Confrontation choice)
        renderAgeUpCheatingDiscoveredModal({ partnerId: 'npc_1', affairName: 'Secret Lover' });
        expect(titleEl.textContent).toBe("Cheating Discovered!");
        expect(closeBtn.classList.contains('hidden')).toBe(true);

        // 3. Police Arrest (Comply, Flee, Bribe choice)
        state.gameState.user.pendingTrial = { crime: { name: 'Shoplifting', fine: 500, prisonYears: 1 }, extraCharges: [] };
        showArrestModal();
        expect(titleEl.textContent).toBe("Police Arrest");
        expect(closeBtn.classList.contains('hidden')).toBe(true);

        // 4. Court Trial Arraignment (Counsel choice)
        showCourtArraignmentModal();
        expect(titleEl.textContent).toBe("Court Trial Arraignment");
        expect(closeBtn.classList.contains('hidden')).toBe(true);
    });
});
