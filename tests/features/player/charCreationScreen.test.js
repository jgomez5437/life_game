import { jest } from '@jest/globals';
import { state, setVerifiedPurchases } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    submitCharacter,
    renderCharCreation,
    setCharTab,
    cyclePreviewAge,
    updateLocationEconBadge,
    updateOriginSummary,
    selectGender,
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

    test('renderCharCreation mounts compact horizontal profile card, origin summary, tabs, dice button, and Start Life CTA without zoom controls', () => {
        const renderScreenSpy = jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });

        renderCharCreation();

        expect(renderScreenSpy).toHaveBeenCalled();
        expect(document.getElementById('avatar-stage-card')).not.toBeNull();
        expect(document.getElementById('avatar-preview')).not.toBeNull();
        expect(document.getElementById('avatar-origin-summary')).not.toBeNull();
        expect(document.getElementById('avatar-origin-summary').textContent).toContain('New York');
        expect(document.getElementById('avatar-mini-preview')).toBeNull();
        expect(document.getElementById('avatar-zoom-wrapper')).toBeNull();
        expect(document.getElementById('btn-zoom-1')).toBeNull();
        expect(document.getElementById('btn-zoom-2')).toBeNull();
        expect(document.querySelector('[data-action="randomizePlayerName"]')).not.toBeNull();
        expect(document.querySelector('[data-action="setCharTab"]')).not.toBeNull();
        expect(document.getElementById('btn-start-life')).not.toBeNull();
    });

    test('selectGender and updateOriginSummary update live origin summary on horizontal profile card', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const originSummary = document.getElementById('avatar-origin-summary');
        expect(originSummary.textContent).toContain('Male');

        selectGender('female');
        expect(originSummary.textContent).toContain('Female');

        selectGender('male');
        expect(originSummary.textContent).toContain('Male');
    });

    test('setCharTab changes active category and renders selectable option chips for style traits', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        // Switch to 'hair' tab
        setCharTab('hair');
        const hairPanel = document.getElementById('panel-hair');
        expect(hairPanel.classList.contains('hidden')).toBe(false);
        expect(hairPanel.innerHTML).toContain('Hairstyle');
        expect(hairPanel.innerHTML).toContain('Hair Color');
        // Verify selectable option pills exist for hairstyle options
        expect(hairPanel.innerHTML).toContain("pickTraitOption");
        expect(hairPanel.innerHTML).toContain("Short Crop");

        // Switch to 'eyes' tab
        setCharTab('eyes');
        const eyesPanel = document.getElementById('panel-eyes');
        expect(eyesPanel.classList.contains('hidden')).toBe(false);
        expect(hairPanel.classList.contains('hidden')).toBe(true);
        expect(eyesPanel.innerHTML).toContain('Eye Shape');
        expect(eyesPanel.innerHTML).toContain('Eye Color');
    });

    test('pickTraitOption updates both color swatches and style option pills', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        setCharTab('face');
        pickTraitOption('skinTone', 'tone4');
        pickTraitOption('faceShape', 'square');

        const preview = document.getElementById('avatar-preview');
        expect(preview.innerHTML).toContain('<svg');
        const panel = document.getElementById('panel-face');
        expect(panel.innerHTML).toContain('Tone 4');
        expect(panel.innerHTML).toContain('Square');
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
        const desktopName = document.getElementById('desktop-avatar-name');
        expect(desktopName.innerText).toBe(nameInput.value);
    });

    test('setCharTab preserves input values across tab switches and keeps DOM inputs alive', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const nameInput = document.getElementById('inp-name');
        expect(nameInput).not.toBeNull();
        nameInput.value = 'Sir Lancelot';

        // Switch to hair tab
        setCharTab('hair');
        expect(document.getElementById('panel-hair').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('panel-identity').classList.contains('hidden')).toBe(true);
        // Form input is still alive with value intact
        expect(document.getElementById('inp-name').value).toBe('Sir Lancelot');

        // Switch back to identity
        setCharTab('identity');
        expect(document.getElementById('panel-identity').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('inp-name').value).toBe('Sir Lancelot');
    });

    test('renderCharCreation pre-fills a default randomized name and renders location economy badge', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const nameInput = document.getElementById('inp-name');
        expect(nameInput.value.trim().length).toBeGreaterThan(0);

        const econBadge = document.getElementById('location-econ-badge');
        expect(econBadge).not.toBeNull();
        expect(econBadge.textContent).toContain('x');
    });

    test('cyclePreviewAge cycles preview age badge through 25 -> 68 -> 6 -> 25', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        const ageBtn = document.getElementById('avatar-age-preview-btn');
        expect(ageBtn).not.toBeNull();
        expect(ageBtn.textContent).toContain('Age 25');

        cyclePreviewAge();
        expect(ageBtn.textContent).toContain('Age 68');

        cyclePreviewAge();
        expect(ageBtn.textContent).toContain('Age 6');

        cyclePreviewAge();
        expect(ageBtn.textContent).toContain('Age 25');
    });

    test('updateLocationEconBadge updates economy multiplier badge for selected city', () => {
        jest.spyOn(UI, 'renderScreen').mockImplementation((html) => {
            document.body.innerHTML = html;
        });
        renderCharCreation();

        updateLocationEconBadge('New York');
        const econBadge = document.getElementById('location-econ-badge');
        expect(econBadge.innerHTML).toContain('1.25x');
        expect(econBadge.innerHTML).toContain('High Salaries');
    });
});
