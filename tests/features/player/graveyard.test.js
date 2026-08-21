import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { continueAsChild } from '../../../public/src/features/player/mainScreen.js';
import { renderGraveyardModal, showAncestorEulogy } from '../../../public/src/features/player/graveyardScreen.js';
import { UI } from '../../../public/src/ui/ui.js';

describe('Family Graveyard & Past Lives Suite', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="game-container"></div>';

        state.gameState = {
            user: {
                username: 'John Founder',
                gender: 'male',
                city: 'New York',
                age: 75,
                money: 500000,
                jobTitle: 'Chief Executive Officer',
                deathCause: 'Old Age',
                generation: 1,
                pastLives: [],
                relationships: [
                    { id: 'child_1', name: 'Junior Founder', type: 'Son', category: 'child', age: 25 }
                ],
                assets: [{ category: 'property', value: 300000 }]
            },
            currentEulogy: 'John was a legendary business visionary who built an immense fortune.',
            lifeLog: []
        };
    });

    test('continueAsChild archives parent into pastLives array with correct metadata', () => {
        // Continue as Junior Founder (child index 0, inheritance $250,000)
        continueAsChild(0, 250000);

        const newUser = state.gameState.user;
        expect(newUser.username).toBe('Junior Founder');
        expect(newUser.generation).toBe(2);
        expect(newUser.pastLives).toHaveLength(1);

        const ancestor = newUser.pastLives[0];
        expect(ancestor.name).toBe('John Founder');
        expect(ancestor.ageAtDeath).toBe(75);
        expect(ancestor.causeOfDeath).toBe('Old Age');
        expect(ancestor.occupation).toBe('Chief Executive Officer');
        expect(ancestor.finalNetWorth).toBe(800000); // 500k cash + 300k assets
        expect(ancestor.inheritedMoney).toBe(250000);
        expect(ancestor.eulogy).toBe('John was a legendary business visionary who built an immense fortune.');
    });

    test('renderGraveyardModal opens modal with ancestor records', () => {
        const spyShowModal = jest.spyOn(UI, 'showCustomModal').mockImplementation(() => {});

        // Add ancestor record
        state.gameState.user.pastLives = [{
            id: 'ancestor_1',
            name: 'Senior Founder',
            gender: 'male',
            ageAtDeath: 80,
            causeOfDeath: 'Heart Attack',
            occupation: 'Architect',
            finalNetWorth: 1000000,
            inheritedMoney: 500000,
            eulogy: 'Great founder.',
            generation: 1
        }];

        renderGraveyardModal();

        expect(spyShowModal).toHaveBeenCalledWith(
            "Family Graveyard & Lineage",
            expect.stringContaining("Senior Founder")
        );

        spyShowModal.mockRestore();
    });

    test('showAncestorEulogy displays specific ancestor life summary modal', () => {
        const spyShowModal = jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        state.gameState.user.pastLives = [{
            id: 'ancestor_123',
            name: 'Grandpa Joe',
            ageAtDeath: 90,
            finalNetWorth: 2000000,
            eulogy: 'A peaceful soul.'
        }];

        showAncestorEulogy('ancestor_123');

        expect(spyShowModal).toHaveBeenCalledWith(
            "Grandpa Joe's Life Summary",
            expect.stringContaining("A peaceful soul.")
        );

        spyShowModal.mockRestore();
    });
});
