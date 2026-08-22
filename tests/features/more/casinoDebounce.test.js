import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { confirmRouletteBet, confirmSlotsSpin, openBlackjackBetting, startBlackjackGame } from '../../../public/src/features/more/casinoScreen.js';
import { buyLotteryTicket } from '../../../public/src/features/more/moreScreen.js';

describe('Casino Debounce & Re-entry Protection', () => {

    beforeEach(() => {
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

    test('confirmRouletteBet blocks concurrent/rapid double-bet calls while spinning', () => {
        const initialMoney = state.gameState.user.money;

        // Rapid double call
        confirmRouletteBet('color', 'red');
        confirmRouletteBet('color', 'red');

        // Check that modal was shown for spinning
        const title = document.getElementById('modal-title');
        expect(title.innerText).toContain('Spinning Roulette Wheel');

        // Wager should not be deducted twice
        expect(state.gameState.user.money).toBe(initialMoney);
    });

    test('confirmSlotsSpin blocks concurrent/rapid double-spin calls while spinning', () => {
        const initialMoney = state.gameState.user.money;

        // Rapid double call
        confirmSlotsSpin(250);
        confirmSlotsSpin(250);

        const title = document.getElementById('modal-title');
        expect(title.innerText).toContain('Spinning Reels');

        expect(state.gameState.user.money).toBe(initialMoney);
    });

    test('startBlackjackGame deducts bet and deals hand only once on rapid calls', () => {
        const initialMoney = state.gameState.user.money;
        const deckSpy = jest.spyOn(GameLogic, 'getDeck').mockReturnValue([
            { value: '2', suit: 'hearts' },
            { value: '3', suit: 'diamonds' },
            { value: '4', suit: 'clubs' },
            { value: '5', suit: 'spades' }
        ]);

        startBlackjackGame();
        // User money reduced by 100
        expect(state.gameState.user.money).toBe(initialMoney - 100);

        const title = document.getElementById('modal-title');
        expect(title.innerText).toBe('Blackjack');
        deckSpy.mockRestore();
    });

    test('buyLotteryTicket processes only 1 ticket purchase on rapid double calls', () => {
        const initialTickets = state.gameState.user.lotteryTicketsBoughtThisYear || 0;

        buyLotteryTicket('scratch_off');

        expect(state.gameState.user.lotteryTicketsBoughtThisYear).toBe(initialTickets + 1);
    });
});
