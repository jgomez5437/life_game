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

describe('Modal Header Inline Exit Button & Screen Cleanliness', () => {

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
                relationships: [],
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

    test('UI.showCustomModal executes onClose callback when showCloseBtn is true, and hides close button by default', () => {
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

        // Test default showCloseBtn (false)
        UI.showCustomModal({
            title: "No Exit Allowed",
            content: "<div>Locked modal</div>"
        });
        expect(closeBtn.classList.contains('hidden')).toBe(true);
    });

    test('UI.replaceModalContent preserves the inline close button and its dismiss handler when enabled', () => {
        UI.showCustomModal({
            title: "Initial Step",
            content: "<div>Step 1</div>",
            showCloseBtn: true
        });
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close-btn');

        expect(title.textContent).toBe("Initial Step");

        UI.replaceModalContent("Updated Step", "<div>Step 2 Result</div>");

        expect(title.textContent).toBe("Updated Step");
        expect(content.innerHTML).toContain("Step 2 Result");
        expect(closeBtn.classList.contains('hidden')).toBe(false);

        closeBtn.click();
        expect(overlay.classList.contains('hidden')).toBe(true);
    });

    test('Nested modals correctly unwind when clicking the inline close button', () => {
        // Open Modal A
        UI.showCustomModal({
            title: "Parent Modal",
            content: "<div>Parent View</div>",
            showCloseBtn: true
        });
        expect(document.getElementById('modal-title').textContent).toBe("Parent Modal");

        // Open Modal B over Modal A
        UI.showCustomModal({
            title: "Child Modal",
            content: "<div>Child View</div>",
            showCloseBtn: true
        });
        expect(document.getElementById('modal-title').textContent).toBe("Child Modal");

        // Close Modal B via top exit button
        document.getElementById('modal-close-btn').click();

        // Modal A should now be restored
        expect(document.getElementById('modal-title').textContent).toBe("Parent Modal");
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(false);

        // Close Modal A via top exit button
        document.getElementById('modal-close-btn').click();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
    });

    test('Feature Modals render cleanly with title at top and no bottom scroll-to-exit buttons', () => {
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');
        const actionsEl = document.getElementById('modal-actions');

        // 1. Settings Modal
        openSettingsModal();
        expect(titleEl.textContent).toBe("Settings");
        expect(contentEl.innerHTML).not.toContain('data-action="hideModal"');

        // 2. Player Overview Modal
        openPlayerOverviewModal();
        expect(titleEl.textContent).toBe("Player Life Overview");
        expect(contentEl.innerHTML).not.toContain('Close Overview');
        expect(contentEl.innerHTML).not.toContain('data-action="hideModal"');

        // 3. Family Graveyard Modal
        renderGraveyardModal();
        expect(titleEl.textContent).toBe("Family Graveyard & Lineage");
        expect(contentEl.innerHTML).not.toContain('Close Graveyard');
        expect(contentEl.innerHTML).not.toContain('data-action="hideModal"');

        // 4. VIP Lounge Modal
        renderVipLoungeModal();
        expect(titleEl.textContent).toBe("VIP Lounge");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 5. Instant Diploma Hub Modal
        renderInstantDiplomaHub();
        expect(titleEl.textContent).toBe("Instant Diploma Hub");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 6. Save Slot Manager Modal
        renderSaveSlotManagerModal();
        expect(titleEl.textContent).toBe("Save & Load Slots");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 7. Time Machine Modal
        renderTimeMachineModal();
        expect(titleEl.textContent).toBe("Time Machine & Timeline Scrubber");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 8. God Mode Stat Editor Modal
        renderGodModeModal();
        expect(titleEl.textContent).toBe("God Mode Stat Editor");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 9. God Mode Control Center Modal
        openGodModeHubModal();
        expect(titleEl.textContent).toBe("God Mode Control Center");
        expect(actionsEl.innerHTML).toBe(''); // No bottom action buttons

        // 10. Diet Selection Modal
        openDietSelectionModal();
        expect(titleEl.textContent).toBe("Choose Diet Plan");
        expect(contentEl.innerHTML).not.toContain('data-action="hideModal"');

        // 11. Travel Modal
        openTravelModal();
        expect(titleEl.textContent).toBe("Travel & Vacations");
        expect(contentEl.innerHTML).not.toContain('data-action="hideModal"');
    });
});
