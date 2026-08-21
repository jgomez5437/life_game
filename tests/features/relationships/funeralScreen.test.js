import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../public/src/features/player/mainScreen.js', () => ({
    renderLifeDashboard: jest.fn(),
    addLog: jest.fn()
}));

jest.unstable_mockModule('../../../public/src/core/main.js', () => ({
    saveGame: jest.fn()
}));

jest.unstable_mockModule('../../../public/src/ui/avatarRenderer.js', () => ({
    renderAvatar: jest.fn(() => '<svg></svg>')
}));

const { state } = await import('../../../public/src/core/state.js');
const { UI } = await import('../../../public/src/ui/ui.js');
const { processNextFuneral } = await import('../../../public/src/features/relationships/funeralScreen.js');

describe('Funeral Screen Minor vs Adult Logic', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="game-container"></div>';
        jest.restoreAllMocks();
    });

    test('Family member death for minor (< 18) shows Attend Funeral and Not Attend Funeral options', () => {
        const spyRender = jest.spyOn(UI, 'renderScreen').mockImplementation(() => {});

        state.gameState = {
            user: {
                username: 'Young Alex',
                age: 14,
                money: 100,
                relationships: [],
                deceasedFamily: []
            },
            pendingFunerals: [
                {
                    id: 'father_1',
                    name: 'John Smith',
                    type: 'Father',
                    category: 'family',
                    age: 45,
                    deathCause: 'Illness'
                }
            ]
        };

        processNextFuneral();

        expect(spyRender).toHaveBeenCalledTimes(1);
        const renderedHtml = spyRender.mock.calls[0][0];

        expect(renderedHtml).toContain('Attend Funeral');
        expect(renderedHtml).toContain('Not Attend Funeral');
        expect(renderedHtml).not.toContain('Plan Their Funeral');
        expect(renderedHtml).not.toContain('Donate Body to Science');
    });

    test('Family member death for adult (>= 18) shows Plan Their Funeral options', () => {
        const spyRender = jest.spyOn(UI, 'renderScreen').mockImplementation(() => {});

        state.gameState = {
            user: {
                username: 'Adult Alex',
                age: 25,
                money: 10000,
                relationships: [],
                deceasedFamily: []
            },
            pendingFunerals: [
                {
                    id: 'father_1',
                    name: 'John Smith',
                    type: 'Father',
                    category: 'family',
                    age: 55,
                    deathCause: 'Old Age'
                }
            ]
        };

        processNextFuneral();

        expect(spyRender).toHaveBeenCalledTimes(1);
        const renderedHtml = spyRender.mock.calls[0][0];

        expect(renderedHtml).toContain('Plan Their Funeral');
        expect(renderedHtml).toContain('Donate Body to Science');
        expect(renderedHtml).toContain('Look the Other Way');
    });
});
