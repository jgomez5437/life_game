import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    isDeadNPC,
    addNewRelationship,
    renderRelationships,
    renderPersonInteraction,
    openRelationshipConfirm,
    performRelationshipAction,
    spendTimeWithAll,
    handleProposeAction,
    openRingSelectionModal,
    proposeWithRing,
    handleMakeAMove,
    renderSteamyHookupModal,
    confirmHookupChoice,
    handleEndAffair,
    renderAgeUpCheatingDiscoveredModal,
    handleCheatingConfrontationChoice
} from '../../../public/src/features/relationships/relationshipScreen.js';
import {
    openWeddingPlanner,
    confirmWeddingPlan,
    openNameChangeChoice,
    chooseNameChange
} from '../../../public/src/features/relationships/romanceScreen.js';
import {
    renderGodModeAvatarModal,
    saveGodModeAvatar
} from '../../../public/src/features/store/godModeAvatarEditor.js';
import { renderClassmates } from '../../../public/src/features/education/manageEducationScreen.js';

describe('Dead NPC Interaction Guard (H-13)', () => {
    let mockUI;

    beforeEach(() => {
        // Prepare DOM container
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="modal-overlay" class="hidden"></div>
            <div id="modal-title"></div>
            <div id="modal-content"></div>
            <div id="modal-actions" class="hidden"></div>
            <div id="avatar-container"></div>
            <div id="header-money"></div>
            <div id="header-age"></div>
        `;

        mockUI = {
            showModal: jest.fn(),
            showConfirm: jest.fn((title, msg, btn, cb) => cb && cb()),
            renderScreen: jest.fn(),
            updateHeader: jest.fn(),
            hideModal: jest.fn()
        };
        UI.showModal = mockUI.showModal;
        UI.showConfirm = mockUI.showConfirm;
        UI.renderScreen = mockUI.renderScreen;
        UI.updateHeader = mockUI.updateHeader;
        UI.hideModal = mockUI.hideModal;

        state.gameState = {
            _slotId: 'slot_1',
            user: {
                name: 'Main Character',
                username: 'Main Character',
                age: 25,
                gender: 'male',
                money: 100000,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                purchases: ['god_mode', 'time_machine'],
                assets: [
                    { id: 'ring_1', name: 'Diamond Ring', category: 'jewelry', type: 'ring', value: 15000 }
                ],
                relationships: [
                    {
                        id: 'npc_alive_partner',
                        name: 'Alive Partner',
                        age: 25,
                        gender: 'female',
                        type: 'Girlfriend',
                        category: 'partner',
                        status: 80
                    },
                    {
                        id: 'npc_dead_flag',
                        name: 'Deceased Partner',
                        age: 30,
                        gender: 'female',
                        type: 'Girlfriend',
                        category: 'partner',
                        status: 80,
                        isDead: true
                    },
                    {
                        id: 'npc_deceased_status',
                        name: 'Deceased Status Friend',
                        age: 40,
                        gender: 'male',
                        type: 'Friend',
                        category: 'friend',
                        status: 90,
                        lifeStatus: 'Deceased'
                    },
                    {
                        id: 'npc_death_cause',
                        name: 'Deceased Cause Friend',
                        age: 70,
                        gender: 'female',
                        type: 'Friend',
                        category: 'friend',
                        status: 85,
                        deathCause: 'Old Age'
                    },
                    {
                        id: 'npc_classmate_dead',
                        name: 'Dead Classmate',
                        age: 16,
                        gender: 'male',
                        type: 'Classmate',
                        category: 'classmate',
                        isCurrentClassmate: true,
                        status: 60,
                        isDead: true
                    }
                ],
                deceasedFamily: []
            },
            pendingFunerals: [],
            lifeLog: []
        };
    });

    describe('isDeadNPC & GameLogic.isAlive checks', () => {
        test('isDeadNPC identifies deceased characters across all death flags', () => {
            expect(isDeadNPC(null)).toBe(true);
            expect(isDeadNPC(undefined)).toBe(true);

            // Living character
            const living = state.gameState.user.relationships[0];
            expect(isDeadNPC(living)).toBe(false);

            // Marked isDead: true
            const deadFlag = state.gameState.user.relationships[1];
            expect(isDeadNPC(deadFlag)).toBe(true);

            // Marked lifeStatus: 'Deceased'
            const deceasedStatus = state.gameState.user.relationships[2];
            expect(isDeadNPC(deceasedStatus)).toBe(true);

            // Marked deathCause
            const deathCause = state.gameState.user.relationships[3];
            expect(isDeadNPC(deathCause)).toBe(true);

            // In pendingFunerals queue
            state.gameState.pendingFunerals = [{ id: 'npc_funeral_target', name: 'Funeral Person', type: 'Friend' }];
            expect(isDeadNPC({ id: 'npc_funeral_target', name: 'Funeral Person', type: 'Friend' })).toBe(true);

            // In deceasedFamily
            state.gameState.user.deceasedFamily = [{ id: 'npc_ancestor_1', name: 'Passed Mother' }];
            expect(isDeadNPC({ id: 'npc_ancestor_1', name: 'Passed Mother' })).toBe(true);
        });

        test('GameLogic.isAlive returns false for dead characters and true for living', () => {
            expect(GameLogic.isAlive(null)).toBe(false);
            expect(GameLogic.isAlive({ isDead: true })).toBe(false);
            expect(GameLogic.isAlive({ lifeStatus: 'Deceased' })).toBe(false);
            expect(GameLogic.isAlive({ deathCause: 'Illness' })).toBe(false);
            expect(GameLogic.isAlive({ health: 0 })).toBe(false);
            expect(GameLogic.isAlive({ health: 100 })).toBe(true);
        });

        test('GameLogic.getAvailableInteractions and isInteractionBlocked block dead NPCs', () => {
            const living = state.gameState.user.relationships[0];
            const dead = state.gameState.user.relationships[1];

            expect(GameLogic.getAvailableInteractions(living, state.gameState.user).length).toBeGreaterThan(0);
            expect(GameLogic.getAvailableInteractions(dead, state.gameState.user)).toEqual([]);

            const blockedResult = GameLogic.isInteractionBlocked('compliment', dead, state.gameState.user);
            expect(blockedResult.blocked).toBe(true);
            expect(blockedResult.reason).toBe('Deceased');
        });
    });

    describe('Relationship Screen & Actions with Dead NPCs', () => {
        test('renderRelationships excludes dead NPCs from rendered category lists', () => {
            renderRelationships();
            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('Alive Partner');
            expect(container.innerHTML).not.toContain('Deceased Partner');
            expect(container.innerHTML).not.toContain('Deceased Status Friend');
            expect(container.innerHTML).not.toContain('Deceased Cause Friend');
        });

        test('renderPersonInteraction blocks opening interaction modal for dead NPC', () => {
            renderPersonInteraction('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");
        });

        test('openRelationshipConfirm and performRelationshipAction block actions on dead NPC', () => {
            const initialMoney = state.gameState.user.money;
            openRelationshipConfirm('npc_dead_flag', 'give_gift');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");

            performRelationshipAction('npc_dead_flag', 'give_gift');
            expect(state.gameState.user.money).toBe(initialMoney);
        });

        test('spendTimeWithAll ignores deceased contacts', () => {
            const living = state.gameState.user.relationships[0];
            const dead = state.gameState.user.relationships[1];
            const initialLivingStatus = living.status;
            const initialDeadStatus = dead.status;

            spendTimeWithAll();

            expect(living.status).toBe(initialLivingStatus + 15);
            expect(dead.status).toBe(initialDeadStatus);
            expect(mockUI.showModal).toHaveBeenCalledWith('Success', expect.stringContaining('You spent time with 1 people'));
        });

        test('proposal flow blocks dead partner', () => {
            handleProposeAction('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");

            openRingSelectionModal('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");

            const initialRingCount = state.gameState.user.assets.length;
            proposeWithRing('npc_dead_flag', 'ring_1');
            expect(state.gameState.user.assets.length).toBe(initialRingCount);
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");
        });

        test('make a move and hookup flow block dead NPC', () => {
            handleMakeAMove('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");

            const deadNpc = state.gameState.user.relationships[1];
            renderSteamyHookupModal(deadNpc, 'test');
            // Does not render
            expect(mockUI.showModal).not.toHaveBeenCalledWith('Steamy Opportunity', expect.anything());

            confirmHookupChoice('protection');
            // No currentHookupPersonId set
            expect(state.gameState.user.isExpecting).toBeUndefined();
        });

        test('handleEndAffair blocks dead NPC', () => {
            handleEndAffair('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");
        });
    });

    describe('Romance & Wedding Screen with Dead NPCs', () => {
        test('openWeddingPlanner and confirmWeddingPlan block dead partners without deducting money', () => {
            const initialMoney = state.gameState.user.money;

            openWeddingPlanner('npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Interact", "This person has passed away.");

            confirmWeddingPlan('npc_dead_flag', 0);
            expect(state.gameState.user.money).toBe(initialMoney);
            expect(state.gameState.user.relationships[1].category).toBe('partner');
        });

        test('openNameChangeChoice and chooseNameChange block dead partners', () => {
            const initialUsername = state.gameState.user.username;
            openNameChangeChoice('npc_dead_flag');
            chooseNameChange('npc_dead_flag', 'take_spouse');
            expect(state.gameState.user.username).toBe(initialUsername);
        });
    });

    describe('God Mode Appearance Editor with Dead NPCs', () => {
        test('renderGodModeAvatarModal and saveGodModeAvatar block editing deceased NPCs', () => {
            renderGodModeAvatarModal('person', 'npc_dead_flag');
            expect(mockUI.showModal).toHaveBeenCalledWith("Cannot Edit", "Cannot edit the appearance of a deceased character.");
        });
    });

    describe('Education Classmates with Dead Classmates', () => {
        test('renderClassmates filters out dead classmates', () => {
            renderClassmates();
            const container = document.getElementById('game-container');
            // Should not render Dead Classmate
            expect(container?.innerHTML || '').not.toContain('Dead Classmate');
        });
    });
});
