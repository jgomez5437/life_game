import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { saveGame } from '../../../public/src/core/main.js';
import { migrateState, saveToSlot, loadSlot } from '../../../public/src/core/saveSlotManager.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    renderInvestmentsScreen,
    openStockDetailsModal,
    openBuyStockModal,
    confirmBuyStock,
    openSellStockModal,
    confirmSellStock,
    setInvestmentInputPreset
} from '../../../public/src/features/assets/investmentsScreen.js';

describe('Stock Market Buying, Persistence & Modal Flow', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Investor</span>
                <span id="header-age">25</span>
            </div>
            <div id="header-bank">$50,000</div>
            <div id="ui-health">100%</div>
            <div id="ui-happiness">100%</div>
            <div id="ui-smarts">80%</div>
            <div id="ui-looks">70%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            _slotId: 'slot_1',
            user: {
                username: 'Investor',
                age: 25,
                money: 50000,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 70,
                diet: 'organic',
                hasBetterDiet: true,
                purchases: []
            },
            lifeLog: [{ age: 25, events: [{ msg: 'Ready to invest.', color: 'text-slate-400' }] }],
            snapshots: []
        };
    });

    test('migrateState preserves investments object schema (savings, stocks map, stockMarket, blogPosts) and diet', () => {
        GameLogic.ensureInvestmentState(state.gameState.user);
        const buyRes = GameLogic.buyStock(state.gameState.user, 'AETH', 10);
        expect(buyRes.success).toBe(true);
        state.gameState.user.investments.savings = 5000;

        const migrated = migrateState(state.gameState);
        expect(migrated.user.diet).toBe('organic');
        expect(migrated.user.investments).not.toBeNull();
        expect(Array.isArray(migrated.user.investments.stocks)).toBe(false);
        expect(migrated.user.investments.stocks.AETH).toEqual({
            shares: 10,
            totalCost: 1800
        });
        expect(migrated.user.investments.savings).toBe(5000);
        expect(Array.isArray(migrated.user.investments.stockMarket)).toBe(true);
        expect(migrated.user.investments.stockMarket.length).toBeGreaterThanOrEqual(10);
    });

    test('ensureInvestmentState repairs corrupted array-shaped user.investments.stocks into a plain object', () => {
        const corruptedArr = [];
        corruptedArr.BYTE = { shares: 4, totalCost: 380 };
        const user = {
            age: 30,
            money: 10000,
            investments: {
                savings: 0,
                stocks: corruptedArr,
                crypto: [],
                savingsAccount: { balance: 2500, apr: 0.04 }
            }
        };

        GameLogic.ensureInvestmentState(user);

        expect(Array.isArray(user.investments.stocks)).toBe(false);
        expect(user.investments.stocks).toEqual({ BYTE: { shares: 4, totalCost: 380 } });

        const migrated = migrateState({
            user: {
                age: 30,
                money: 10000,
                investments: {
                    stocks: [{ symbol: 'CURE', shares: 3, totalCost: 135 }],
                    savingsAccount: { balance: 2500, apr: 0.04 }
                }
            }
        });
        expect(migrated.user.investments.stocks).toEqual({ CURE: { shares: 3, totalCost: 135 } });
        expect(migrated.user.investments.savings).toBe(2500);
    });

    test('buying and selling stocks through UI persists across saveGame, saveToSlot, and loadSlot', () => {
        // Simulate a prior slot save having triggered migrateState before opening investments
        saveToSlot('slot_1', 'Investor Run');
        loadSlot('slot_1');

        renderInvestmentsScreen('stocks');
        expect(Array.isArray(state.gameState.user.investments.stocks)).toBe(false);

        // Open Chart -> Buy flow (tests stacked modal cleanup)
        openStockDetailsModal('AETH');
        openBuyStockModal('AETH');
        expect(document.body.innerHTML).not.toContain('onclick="');

        setInvestmentInputPreset('inp-buy-shares', 5);
        expect(document.getElementById('inp-buy-shares').value).toBe('5');

        confirmBuyStock('AETH');

        expect(document.getElementById('modal-title').textContent).toBe('Trade Executed');
        expect(state.gameState.user.money).toBe(50000 - (5 * 180));
        expect(state.gameState.user.investments.stocks.AETH).toEqual({ shares: 5, totalCost: 900 });
        expect(document.getElementById('header-bank').textContent).toContain('$49,100');

        // Closing the result modal should completely close modal overlay (not restore Chart modal)
        UI.hideModal();
        expect(UI.isModalOpen()).toBe(false);

        // Reload from localStorage slot and verify holdings survive save/load round-trip
        loadSlot('slot_1');
        expect(state.gameState.user.investments.stocks.AETH).toEqual({ shares: 5, totalCost: 900 });

        // Sell 2 shares
        openSellStockModal('AETH');
        setInvestmentInputPreset('inp-sell-shares', 2);
        confirmSellStock('AETH');

        expect(state.gameState.user.investments.stocks.AETH.shares).toBe(3);
        expect(state.gameState.user.money).toBe(50000 - (3 * 180));

        saveGame();
        loadSlot('slot_1');
        expect(state.gameState.user.investments.stocks.AETH.shares).toBe(3);
    });
});
