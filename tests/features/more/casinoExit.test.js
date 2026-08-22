import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import { 
    openRouletteModal, 
    confirmRouletteBet, 
    openBlackjackBetting, 
    startBlackjackGame, 
    blackjackStand,
    openSlotsModal, 
    confirmSlotsSpin 
} from '../../../public/src/features/more/casinoScreen.js';
import { openLotteryModal, buyLotteryTicket } from '../../../public/src/features/more/moreScreen.js';

describe('Casino & Gambling Games Exit Options', () => {

    beforeEach(() => {
        jest.useFakeTimers();

        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="header-user-info"></div>
            <div id="header-bank"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
            <input type="number" id="roulette-bet-amt" value="100" />
            <input type="range" id="blackjackBetSlider" value="100" />
        `;

        state.gameState = {
            user: {
                username: 'Casino Player',
                age: 25,
                money: 10000,
                health: 100,
                happiness: 100,
                purchases: [],
                lotteryTicketsBoughtThisYear: 0
            },
            lifeLog: []
        };

        window.saveGame = () => {};
    });

    afterEach(() => {
        jest.useRealTimers();
        UI.closeAllModals();
    });

    test('openRouletteModal provides an Exit to Casino Floor button that dismisses the modal', () => {
        openRouletteModal();

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);
        
        const exitBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(exitBtn).not.toBeNull();
        expect(exitBtn.textContent).toContain('Exit to Casino Floor');

        // Trigger closeAllModals
        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('Roulette outcome screen provides an Exit to Casino Floor button', () => {
        openRouletteModal();
        confirmRouletteBet('color', 'red');

        // Fast-forward spin timeout
        jest.advanceTimersByTime(1300);

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        const exitBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(exitBtn).not.toBeNull();
        expect(exitBtn.textContent).toContain('Exit to Casino Floor');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('openBlackjackBetting provides a Cancel button with closeAllModals', () => {
        openBlackjackBetting();

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        const cancelBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(cancelBtn).not.toBeNull();
        expect(cancelBtn.textContent).toContain('Cancel');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('Blackjack outcome screen provides a Close button with closeAllModals', () => {
        openBlackjackBetting();
        startBlackjackGame();

        // Stand to finish the round
        blackjackStand();

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        const closeBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.textContent).toContain('Close');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('openSlotsModal provides an Exit to Casino Floor button', () => {
        openSlotsModal();

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        const exitBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(exitBtn).not.toBeNull();
        expect(exitBtn.textContent).toContain('Exit to Casino Floor');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('Slots outcome screen provides an Exit Machine button with closeAllModals', () => {
        openSlotsModal();
        confirmSlotsSpin(50);

        // Fast-forward spin timeout
        jest.advanceTimersByTime(1300);

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        const exitBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(exitBtn).not.toBeNull();
        expect(exitBtn.textContent).toContain('Exit Machine');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('Lottery station and reveal modals provide Close buttons with closeAllModals', () => {
        openLotteryModal();

        const modalOverlay = document.getElementById('modal-overlay');
        let modalContent = document.getElementById('modal-content');

        expect(modalOverlay.classList.contains('hidden')).toBe(false);

        let closeBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(closeBtn).not.toBeNull();

        // Buy a ticket and check reveal modal
        buyLotteryTicket('scratch_off');
        modalContent = document.getElementById('modal-content');

        closeBtn = modalContent.querySelector('[data-action="closeAllModals"]');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.textContent).toContain('Close');

        UI.closeAllModals();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });
});
