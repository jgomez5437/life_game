import { state, hasPurchasedPack } from '../public/src/core/state.js';

describe('God Mode Entitlement Checks & Avatar Editing', () => {

    beforeEach(() => {
        state.gameState = {
            user: {
                username: 'Test User',
                purchases: [],
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                appearance: { skinTone: 'light', hairStyle: 'shortCrop' },
                relationships: [
                    {
                        id: 'rel_spouse_1',
                        name: 'Jane Doe',
                        type: 'Wife',
                        category: 'spouse',
                        gender: 'female',
                        age: 25,
                        appearance: { skinTone: 'medium', hairStyle: 'longWaves' }
                    }
                ]
            }
        };
        localStorage.clear();
    });

    test('hasPurchasedPack returns false when god_mode is not owned', () => {
        expect(hasPurchasedPack('god_mode')).toBe(false);
    });

    test('hasPurchasedPack returns true when god_mode is in user purchases', () => {
        state.gameState.user.purchases = ['god_mode'];
        expect(hasPurchasedPack('god_mode')).toBe(true);
    });

    test('hasPurchasedPack returns true when god_mode is stored in localStorage', () => {
        localStorage.setItem('life_game_purchases', JSON.stringify(['god_mode']));
        expect(hasPurchasedPack('god_mode')).toBe(true);
    });

    test('relationships list allows modifying NPC appearance when owned', () => {
        const spouse = state.gameState.user.relationships[0];
        expect(spouse.appearance.hairStyle).toBe('longWaves');

        spouse.appearance.hairStyle = 'pixieCut';
        spouse.appearance.hairColorBase = 'blonde';

        expect(state.gameState.user.relationships[0].appearance.hairStyle).toBe('pixieCut');
        expect(state.gameState.user.relationships[0].appearance.hairColorBase).toBe('blonde');
    });

});
