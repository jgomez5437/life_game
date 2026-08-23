import { jest } from '@jest/globals';
import { state, setVerifiedPurchases } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import { submitCharacter } from '../../../public/src/features/player/charCreationScreen.js';
import { getSlotsStore } from '../../../public/src/core/saveSlotManager.js';

describe('Character Creation Screen Suite', () => {
    let originalFetch;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="header-name"></div>
            <div id="header-age"></div>
            <div id="header-bank"></div>
            <div id="avatar-container"></div>
            <input id="inp-name" value="Test Hero" />
            <select id="inp-country"><option value="United States" selected>United States</option></select>
            <select id="inp-city"><option value="New York" selected>New York</option></select>
        `;

        originalFetch = global.fetch;
        state.gameState = null;
        state.auth0Client = null;
        state.userAuthId = null;
        state.userEmail = null;
        setVerifiedPurchases([]);
        localStorage.clear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test('submitCharacter creates character successfully when user is authenticated with Auth0', async () => {
        const mockUser = {
            sub: 'auth0|123456789',
            email: 'test@example.com',
            nickname: 'Hero'
        };

        state.auth0Client = {
            getUser: jest.fn().mockResolvedValue(mockUser),
            getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: 'mock_jwt_token_abc123' })
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ message: 'Game Saved Successfully' })
        });
        global.fetch = fetchSpy;

        await submitCharacter();

        // Verify gameState initialized properly
        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.username).toBe('Test Hero');
        expect(state.gameState.user.age).toBe(0);
        expect(state.gameState.user.city).toBe('New York');
        expect(state.gameState.user.country).toBe('United States');
        expect(state.userAuthId).toBe('auth0|123456789');
        expect(state.userEmail).toBe('test@example.com');

        // Verify save slot exists in local store
        const store = getSlotsStore();
        expect(store.slots[state.gameState._slotId]).toBeDefined();
        expect(store.slots[state.gameState._slotId].name).toBe('Test Hero');

        // Verify lifeLog contains birth event
        expect(state.gameState.lifeLog.length).toBeGreaterThan(0);
    });

    test('submitCharacter creates character successfully in Guest Mode', async () => {
        state.auth0Client = null;
        state.userAuthId = null;

        await submitCharacter();

        expect(state.gameState).not.toBeNull();
        expect(state.gameState.user.username).toBe('Test Hero');
        expect(state.gameState.user.age).toBe(0);
        expect(state.gameState.user.lifeStatus).toBe('Baby');

        const store = getSlotsStore();
        expect(store.slots[state.gameState._slotId]).toBeDefined();
    });

    test('submitCharacter shows validation modal when name is empty or invalid', async () => {
        const nameInput = document.getElementById('inp-name');
        nameInput.value = '   ';

        const showModalSpy = jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        await submitCharacter();

        expect(showModalSpy).toHaveBeenCalledWith("Wait", expect.any(String));
        expect(state.gameState).toBeNull();
    });

    test('submitCharacter applies God Mode custom stats when entitled', async () => {
        setVerifiedPurchases(['god_mode']);

        document.body.innerHTML += `
            <input id="god-create-health" value="95" />
            <input id="god-create-happiness" value="90" />
            <input id="god-create-smarts" value="85" />
            <input id="god-create-looks" value="80" />
        `;

        await submitCharacter();

        expect(state.gameState.user.health).toBe(95);
        expect(state.gameState.user.happiness).toBe(90);
        expect(state.gameState.user.smarts).toBe(85);
        expect(state.gameState.user.looks).toBe(80);
    });

    test('submitCharacter generates newborn parentage logs when born', async () => {
        await submitCharacter();

        const logs = state.gameState.lifeLog.flatMap(l => l.events.map(e => e.msg));
        const hasBirthLog = logs.some(m => m.includes('Born in') || m.includes('born'));
        expect(hasBirthLog).toBe(true);
    });
});
