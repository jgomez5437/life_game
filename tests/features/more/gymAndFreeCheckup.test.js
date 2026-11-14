import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { UI } from '../../../public/src/ui/ui.js';
import { renderMoreDashboard } from '../../../public/src/features/more/moreScreen.js';
import {
    openGymModal,
    buyGymMembership,
    cancelGymMembership,
    visitGymOneTime,
    selectDiet,
    generalCheckup
} from '../../../public/src/features/more/moreActivitiesModals.js';

describe('Gym Membership Cancellation & Free Actions When In Debt', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">22</span>
            </div>
            <div id="header-bank">$1,000</div>
            <div id="ui-health">70%</div>
            <div id="ui-happiness">70%</div>
            <div id="ui-smarts">60%</div>
            <div id="ui-looks">60%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            _slotId: 'slot_1',
            user: {
                username: 'Test Player',
                age: 22,
                money: 1000,
                health: 70,
                happiness: 70,
                smarts: 60,
                looks: 60,
                gymMembership: false,
                diet: 'junk',
                hasBetterDiet: false,
                diseases: [],
                purchases: []
            },
            lifeLog: [{ age: 22, events: [] }],
            snapshots: []
        };
    });

    test('Gym Membership row opens management modal where player can join, work out, and cancel membership', () => {
        renderMoreDashboard();
        const containerHtml = document.getElementById('game-container').innerHTML;
        expect(containerHtml).toContain('data-action="openGymModal"');

        // Not a member -> modal offers Join Gym Membership ($50/mo)
        openGymModal();
        expect(document.getElementById('modal-title').textContent).toBe('Gym & Fitness');
        expect(document.getElementById('modal-content').innerHTML).toContain('data-action="buyGymMembership"');
        expect(document.getElementById('modal-content').innerHTML).not.toContain('data-action="cancelGymMembership"');

        buyGymMembership();
        expect(state.gameState.user.gymMembership).toBe(true);
        UI.closeAllModals();

        // Active member -> dashboard shows Manage and modal exposes Cancel Gym Membership
        renderMoreDashboard();
        expect(document.getElementById('game-container').innerHTML).toContain('Manage');

        openGymModal();
        const modalHtml = document.getElementById('modal-content').innerHTML;
        expect(modalHtml).toContain('data-action="cancelGymMembership"');
        expect(modalHtml).toContain('Free (Member)');

        cancelGymMembership();
        expect(state.gameState.user.gymMembership).toBe(false);
        expect(document.getElementById('modal-title').textContent).toBe('Membership Cancelled');
        UI.closeAllModals();

        renderMoreDashboard();
        expect(document.getElementById('game-container').innerHTML).toContain('Gym Options');
    });

    test('Free medical checkup succeeds for minors in debt (negative bank balance) while paid adult checkup checks funds', () => {
        state.gameState.user.age = 15;
        state.gameState.user.money = -2500;
        state.gameState.user.health = 65;

        generalCheckup();

        expect(state.gameState.user.health).toBe(75);
        expect(state.gameState.user.money).toBe(-2500);
        expect(document.getElementById('modal-title').textContent).toBe('Medical Checkup');
        expect(document.getElementById('modal-content').innerHTML).toContain('covered by your parents');

        // Adult in debt cannot afford $1,000 checkup
        UI.closeAllModals();
        state.gameState.user.age = 25;
        state.gameState.user.money = -2500;
        state.gameState.user.health = 65;

        generalCheckup();
        expect(state.gameState.user.health).toBe(65);
        expect(document.getElementById('modal-title').textContent).toBe('Not enough money');
    });

    test('Free doctor treatment, free gym member workout, and free junk diet work when in debt', () => {
        // Minor in debt receives free disease treatment
        const minor = { age: 14, money: -1200, health: 80, happiness: 80, diseases: [] };
        GameLogic.infectUser(minor, 'common_cold');
        const treatRes = GameLogic.treatDiseaseAtDoctor(minor, 'common_cold', 0.1);
        expect(treatRes.success).toBe(true);
        expect(treatRes.cost).toBe(0);
        expect(minor.money).toBe(-1200);

        // Active gym member in debt can work out for free
        state.gameState.user.age = 25;
        state.gameState.user.money = -500;
        state.gameState.user.health = 70;
        state.gameState.user.gymMembership = true;
        visitGymOneTime();
        expect(state.gameState.user.health).toBe(71);
        expect(state.gameState.user.money).toBe(-500);
        expect(document.getElementById('modal-title').textContent).toBe('Workout Complete');

        // Adult in debt can switch back to free junk diet
        UI.closeAllModals();
        state.gameState.user.diet = 'keto';
        state.gameState.user.hasBetterDiet = true;
        selectDiet('junk');
        expect(state.gameState.user.diet).toBe('junk');
        expect(state.gameState.user.hasBetterDiet).toBe(false);
        expect(state.gameState.user.money).toBe(-500);
        expect(document.getElementById('modal-title').textContent).toBe('Diet Plan Active');
    });
});
