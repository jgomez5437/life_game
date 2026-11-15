import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    renderVehicleDealer,
    openVehicleDetailsModal,
    buyVehicleCash,
    buyVehicleLoan,
    openTradeInModal,
    executeTradeInPurchase
} from '../../../public/src/features/assets/goShoppingScreen.js';

describe('Car Dealership Compact UI & Purchase Modal Flow', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Joshua White</span>
                <span id="header-age">20</span>
            </div>
            <div id="header-bank">$1,632,272</div>
            <div id="ui-health">100%</div>
            <div id="ui-happiness">100%</div>
            <div id="ui-smarts">82%</div>
            <div id="ui-looks">80%</div>
            <div id="modal-overlay" class="hidden">
                <h2 id="modal-title"></h2>
                <button id="modal-close-btn"></button>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;
        UI.closeAllModals();

        state.gameState = {
            _slotId: 'slot_1',
            user: {
                username: 'Joshua White',
                city: 'Miami',
                country: 'United States',
                age: 20,
                money: 1632272,
                health: 100,
                happiness: 100,
                smarts: 82,
                looks: 80,
                assets: [],
                purchases: []
            },
            lifeLog: [{ age: 20, events: [] }],
            snapshots: []
        };
    });

    test('renderVehicleDealer renders compact clickable cards without inline action button clutter or horizontal overflow', () => {
        renderVehicleDealer('mall');

        const containerHtml = document.getElementById('game-container').innerHTML;
        expect(containerHtml).toContain('Miami Auto Dealership');
        expect(containerHtml).toContain('overflow-x-hidden');
        expect(containerHtml).toContain('data-action="openVehicleDetailsModal"');

        // Inline action buttons and verbose descriptions should live in the details modal, not on list cards
        expect(containerHtml).not.toContain('data-action="buyVehicleCash"');
        expect(containerHtml).not.toContain('data-action="buyVehicleLoan"');
        expect(containerHtml).not.toContain('Mid-engine V8 supercar performance');
    });

    test('openVehicleDetailsModal displays vehicle description, specs, and Cash / Finance options', () => {
        const corvette = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('Corvette'));
        expect(corvette).toBeDefined();

        openVehicleDetailsModal(corvette.id);

        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title').textContent;
        const modalContent = document.getElementById('modal-content').innerHTML;

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(modalTitle).toContain('Corvette Stingray');
        expect(modalContent).toContain(corvette.desc);
        expect(modalContent).toContain('data-action="buyVehicleCash"');
        expect(modalContent).toContain('data-action="buyVehicleLoan"');
        // Player owns no vehicles yet, so Trade-In button should be hidden
        expect(modalContent).not.toContain('data-action="openTradeInModal"');
    });

    test('openVehicleDetailsModal shows Trade-In button when player already owns a vehicle', () => {
        state.gameState.user.assets.push({
            id: 999,
            name: 'Honda Civic LX',
            category: 'vehicle',
            type: 'sedan',
            value: 18000,
            condition: 90,
            isPrimary: true,
            loan: null
        });

        const bmw = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('BMW M4'));
        openVehicleDetailsModal(bmw.id);

        const modalContent = document.getElementById('modal-content').innerHTML;
        expect(modalContent).toContain('data-action="openTradeInModal"');
    });

    test('buyVehicleCash clears modal stack before showing Purchase Successful so dismissing returns to dealership', () => {
        const corvette = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('Corvette'));
        openVehicleDetailsModal(corvette.id);
        buyVehicleCash(corvette.id);

        expect(state.gameState.user.assets).toHaveLength(1);
        expect(document.getElementById('modal-title').textContent).toBe('Purchase Successful');

        // Dismissing the success modal should return cleanly to the dealership (overlay hidden)
        UI.hideModal();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
    });

    test('buyVehicleLoan and executeTradeInPurchase clear modal stack before showing confirmation', () => {
        const civic = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('Honda Civic LX'));
        openVehicleDetailsModal(civic.id);
        buyVehicleLoan(civic.id);

        expect(state.gameState.user.assets).toHaveLength(1);
        expect(document.getElementById('modal-title').textContent).toBe('Auto Loan Approved!');
        UI.hideModal();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);

        // Now test Trade-In flow from details modal -> trade-in modal -> executeTradeInPurchase
        const ownedId = state.gameState.user.assets[0].id;
        const bmw = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('BMW M4'));
        openVehicleDetailsModal(bmw.id);
        openTradeInModal(bmw.id);
        expect(document.getElementById('modal-content').innerHTML).toContain('data-action="executeTradeInPurchase"');

        executeTradeInPurchase(bmw.id, ownedId, 'cash');
        expect(document.getElementById('modal-title').textContent).toBe('Trade-In Successful!');
        UI.hideModal();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(true);
    });

    test('clicking dealership card routes via actionRouter and trade-in Back restores details modal', async () => {
        await import('../../../public/src/core/actionRouter.js');
        state.gameState.user.assets.push({
            id: 777,
            name: 'Used Mazda 3',
            category: 'vehicle',
            type: 'hatchback',
            value: 4500,
            condition: 80,
            isPrimary: true,
            loan: null
        });

        renderVehicleDealer('mall');
        const cardBtn = document.querySelector('[data-action="openVehicleDetailsModal"]');
        expect(cardBtn).not.toBeNull();
        cardBtn.click();

        // Lazy action wrapper loads goShopping dynamically; flush microtasks
        await new Promise(resolve => setTimeout(resolve, 25));

        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(false);
        const firstTitle = document.getElementById('modal-title').textContent;

        const tradeBtn = document.querySelector('[data-action="openTradeInModal"]');
        expect(tradeBtn).not.toBeNull();
        tradeBtn.click();
        await new Promise(resolve => setTimeout(resolve, 25));

        expect(document.getElementById('modal-title').textContent).toContain('Trade-In Towards');

        // Back button inside trade-in modal pops back to vehicle details modal
        UI.hideModal();
        expect(document.getElementById('modal-overlay').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('modal-title').textContent).toBe(firstTitle);
    });

    test('openVehicleDetailsModal blocks underage players (< 16)', () => {
        state.gameState.user.age = 15;
        const corvette = GameLogic.VEHICLES_FOR_SALE.find(v => v.name.includes('Corvette'));
        openVehicleDetailsModal(corvette.id);

        expect(document.getElementById('modal-title').textContent).toBe('Too Young');
        expect(document.getElementById('modal-content').innerHTML).toContain('at least 16 years old');
    });
});
