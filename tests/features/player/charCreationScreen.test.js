import { jest } from '@jest/globals';
import { state, setVerifiedPurchases } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    submitCharacter,
    renderCharCreation,
    setCharTab,
    toggleAvatarZoom,
    setAvatarZoom,
    pickTraitOption,
    randomizePlayerName,
    cycleTrait
} from '../../../public/src/features/player/charCreationScreen.js';
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

    test('renderCharCreation mounts avatar studio stage, tabs, zoom buttons, and dice button', () => {
        const renderScreenSpy = jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });

        renderCharCreation();

        expect(renderScreenSpy).toHaveBeenCalled();
        expect(document.getElementById('avatar-preview')).not.toBeNull();
        expect(document.getElementById('avatar-mini-preview')).not.toBeNull();
        expect(document.getElementById('avatar-zoom-wrapper')).not.toBeNull();
        expect(document.getElementById('btn-zoom-1')).not.toBeNull();
        expect(document.getElementById('btn-zoom-2')).not.toBeNull();
        expect(document.querySelector('[data-action="randomizePlayerName"]')).not.toBeNull();
        expect(document.querySelector('[data-action="setCharTab"]')).not.toBeNull();
    });

    test('toggleAvatarZoom and setAvatarZoom toggle zoom levels and wrapper transforms', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const zoomWrapper = document.getElementById('avatar-zoom-wrapper');
        const miniZoomWrapper = document.getElementById('avatar-mini-zoom-wrapper');

        // Initially at 1x
        expect(zoomWrapper.style.transform).toBe('scale(1) translateY(0)');

        // Toggle to 1.75x
        toggleAvatarZoom();
        expect(zoomWrapper.style.transform).toBe('scale(1.75) translateY(6%)');
        expect(miniZoomWrapper.style.transform).toBe('scale(1.75) translateY(6%)');

        // Toggle back to 1x
        toggleAvatarZoom();
        expect(zoomWrapper.style.transform).toBe('scale(1) translateY(0)');

        // Explicitly set zoom
        setAvatarZoom(1.75);
        expect(zoomWrapper.style.transform).toBe('scale(1.75) translateY(6%)');
    });

    test('setCharTab changes active category and updates appearance panel', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        // Switch to 'hair' tab
        setCharTab('hair');
        const panel = document.getElementById('appearance-panel');
        expect(panel.innerHTML).toContain('Hairstyle');
        expect(panel.innerHTML).toContain('Hair Color');

        // Switch to 'eyes' tab
        setCharTab('eyes');
        expect(panel.innerHTML).toContain('Eye Shape');
        expect(panel.innerHTML).toContain('Eye Color');
    });

    test('pickTraitOption updates selected trait and renders swatch selection', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        setCharTab('face');
        pickTraitOption('skinTone', 'tone4');

        const preview = document.getElementById('avatar-preview');
        expect(preview.innerHTML).toContain('<svg');
        const panel = document.getElementById('appearance-panel');
        expect(panel.innerHTML).toContain('Tone 4');
    });

    test('randomizePlayerName generates a valid name into inp-name and updates badges', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const nameInput = document.getElementById('inp-name');
        nameInput.value = '';

        randomizePlayerName();

        expect(nameInput.value.trim().length).toBeGreaterThan(0);
        expect(nameInput.value).toContain(' '); // First and Last Name
        const mobileDockName = document.getElementById('mobile-dock-name');
        expect(mobileDockName.innerText).toBe(nameInput.value);
    });
});
