import { jest } from '@jest/globals';
import { SoundManager } from '../../public/src/core/soundManager.js';
import { state } from '../../public/src/core/state.js';
import { ageUp } from '../../public/src/features/player/mainScreen.js';
import { toggleSettingSFX, openSettingsModal } from '../../public/src/features/more/settingsScreen.js';
import { unlockAchievement, resetAchievements } from '../../public/src/core/achievementManager.js';
import { UI } from '../../public/src/ui/ui.js';
import { processNextLifeEvent } from '../../public/src/features/life/lifeEventModal.js';
import { showArrestModal } from '../../public/src/features/more/crimeScreen.js';
import { confirmWeddingPlan } from '../../public/src/features/relationships/romanceScreen.js';

describe('SoundManager & Settings SFX Integration', () => {
    let mockOscillator;
    let mockGainNode;
    let mockAudioCtx;

    beforeEach(() => {
        localStorage.clear();
        SoundManager.resetSoundManager();
        resetAchievements();

        mockOscillator = {
            type: 'sine',
            frequency: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        mockGainNode = {
            gain: {
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            },
            connect: jest.fn()
        };

        mockAudioCtx = {
            state: 'running',
            currentTime: 0,
            destination: {},
            resume: jest.fn(() => Promise.resolve()),
            createOscillator: jest.fn(() => mockOscillator),
            createGain: jest.fn(() => mockGainNode)
        };

        globalThis.AudioContext = jest.fn(() => mockAudioCtx);
        if (typeof window !== 'undefined') {
            window.AudioContext = globalThis.AudioContext;
        }

        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-brand"></div>
            <div id="header-main-row"></div>
            <div id="header-stats-ribbon"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">18</span>
            </div>
            <div id="header-bank-wrapper">
                <span id="header-bank">$50,000</span>
                <span id="header-bank-sublabel">Bank</span>
            </div>
            <div id="ui-health">100%</div>
            <div id="health-container"><div id="health-bar-fill"></div></div>
            <div id="ui-happiness">100%</div>
            <div id="happiness-container"><div id="happiness-bar-fill"></div></div>
            <div id="ui-smarts">80%</div>
            <div id="smarts-container"><div id="smarts-bar-fill"></div></div>
            <div id="ui-looks">80%</div>
            <div id="looks-container"><div id="looks-bar-fill"></div></div>
            <div id="bottom-nav" class="hidden">
                <button id="nav-btn-assets"></button>
                <button id="nav-btn-work"></button>
                <button id="nav-btn-center"></button>
                <button id="nav-btn-social"></button>
                <button id="nav-btn-more"></button>
            </div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-header"></div>
                <div id="modal-title"></div>
                <button id="modal-close-btn"></button>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'Alex Tester',
                age: 20,
                money: 50000,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                city: 'New York',
                relationships: [],
                assets: [],
                purchases: []
            },
            lifeLog: [],
            pendingEvents: []
        };
    });

    test('isSfxEnabled defaults to true and respects life_game_sfx in localStorage', () => {
        expect(SoundManager.isSfxEnabled()).toBe(true);

        localStorage.setItem('life_game_sfx', 'false');
        expect(SoundManager.isSfxEnabled()).toBe(false);

        localStorage.setItem('life_game_sfx', 'true');
        expect(SoundManager.isSfxEnabled()).toBe(true);
    });

    test('SoundManager.play synthesizes Web Audio tones when enabled and suppresses when disabled', () => {
        const played = SoundManager.play('ageUp');
        expect(played).toBe(true);
        expect(SoundManager.getLastPlayedSound()).toBe('ageUp');
        expect(mockAudioCtx.createOscillator).toHaveBeenCalled();
        expect(mockOscillator.start).toHaveBeenCalled();

        SoundManager.resetSoundManager();
        mockAudioCtx.createOscillator.mockClear();
        localStorage.setItem('life_game_sfx', 'false');

        const mutedResult = SoundManager.play('ageUp');
        expect(mutedResult).toBe(false);
        expect(SoundManager.getLastPlayedSound()).toBeNull();
        expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
    });

    test('toggleSettingSFX in Settings silences SFX when turned OFF and plays toggleOn when turned ON', () => {
        openSettingsModal();
        SoundManager.resetSoundManager();

        // Turn OFF (from default true -> false)
        toggleSettingSFX();
        expect(localStorage.getItem('life_game_sfx')).toBe('false');
        expect(SoundManager.getLastPlayedSound()).toBeNull();

        // Turn ON (from false -> true)
        toggleSettingSFX();
        expect(localStorage.getItem('life_game_sfx')).toBe('true');
        expect(SoundManager.getLastPlayedSound()).toBe('toggleOn');
    });

    test('ageUp plays ageUp sound when SFX is enabled and stays silent when SFX is disabled', async () => {
        await ageUp();
        expect(state.gameState.user.age).toBe(21);
        expect(SoundManager.getPlayedSoundsHistory()).toContain('ageUp');

        SoundManager.resetSoundManager();
        localStorage.setItem('life_game_sfx', 'false');

        await ageUp();
        expect(state.gameState.user.age).toBe(22);
        expect(SoundManager.getPlayedSoundsHistory()).toHaveLength(0);
    });

    test('ageUp plays milestone sound upon High School graduation at age 18', async () => {
        state.gameState.user.age = 17;
        state.gameState.user.isStudent = true;
        state.gameState.user.schoolPerformance = 85;

        await ageUp();
        expect(state.gameState.user.age).toBe(18);
        expect(state.gameState.user.highSchoolGraduated).toBe(true);
        expect(SoundManager.getPlayedSoundsHistory()).toEqual(expect.arrayContaining(['ageUp', 'milestone']));
    });

    test('ageUp plays death sound instead of ageUp sound when character dies', async () => {
        state.gameState.user.age = 115;
        state.gameState.user.health = 0;

        await ageUp();
        expect(state.gameState.user.lifeStatus).toBe('Deceased');
        expect(SoundManager.getPlayedSoundsHistory()).toContain('death');
        expect(SoundManager.getPlayedSoundsHistory()).not.toContain('ageUp');
    });

    test('recommended areas trigger their corresponding sound cues when SFX is enabled', () => {
        // 1. Achievement unlock
        const unlocked = unlockAchievement('centenarian', state.gameState.user);
        expect(unlocked).toBe(true);
        expect(SoundManager.getLastPlayedSound()).toBe('achievement');

        // 2. Money delta (after primary cue cooldown window)
        SoundManager.resetSoundManager();
        UI.showStatDelta('money', 1500, '', '💵', true);
        expect(SoundManager.getLastPlayedSound()).toBe('cashGain');

        UI.showStatDelta('money', -500, '', '💵', true);
        expect(SoundManager.getLastPlayedSound()).toBe('cashSpend');

        // 3. Police Arrest modal
        showArrestModal({ id: 'shoplifting', name: 'Shoplifting' });
        expect(SoundManager.getLastPlayedSound()).toBe('arrest');

        // 4. Wedding / Romance milestone
        state.gameState.user.relationships = [
            { id: 'fiance_1', name: 'Taylor Swift', gender: 'female', category: 'fiance', status: 90 }
        ];
        confirmWeddingPlan('fiance_1', 0);
        expect(SoundManager.getLastPlayedSound()).toBe('romance');

        // 5. Bottom nav tab switching
        UI.updateBottomNav('home');
        UI.updateBottomNav('assets');
        expect(SoundManager.getLastPlayedSound()).toBe('uiClick');

        // 6. Life Event popup modal
        state.gameState.pendingEvents = [{ eventId: 'toddler_daycare_blocks' }];
        processNextLifeEvent();
        expect(SoundManager.getLastPlayedSound()).toBe('eventPopup');
    });
});
