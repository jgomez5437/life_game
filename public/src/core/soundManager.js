/**
 * Web Audio API Sound Effects Manager
 * Connects directly to the built-in Settings preference (`life_game_sfx` in localStorage).
 * Uses zero-dependency procedural synthesis for instant playback with 0 KB asset overhead.
 */

const SFX_STORAGE_KEY = 'life_game_sfx';
const MAX_HISTORY_LENGTH = 50;

let _audioCtx = null;
let _lastPlayedSound = null;
let _playedSoundsHistory = [];
let _lastPrimaryCueTime = 0;

// High-priority cues that briefly suppress automatic header cash-delta chimes
// so they don't collide on the same frame (e.g., during Age Up or Casino payouts).
const PRIMARY_CUES = new Set([
    'ageUp',
    'achievement',
    'milestone',
    'romance',
    'newBaby',
    'casinoWin',
    'casinoLose',
    'jackpot',
    'death',
    'arrest'
]);

/**
 * Checks whether Sound Effects are enabled in user preferences (default: true).
 * Matches `localStorage.getItem('life_game_sfx') !== 'false'` in settingsScreen.js.
 * @returns {boolean}
 */
export function isSfxEnabled() {
    try {
        if (typeof localStorage === 'undefined') return true;
        return localStorage.getItem(SFX_STORAGE_KEY) !== 'false';
    } catch (e) {
        return true;
    }
}

/**
 * Lazily initializes and returns the shared AudioContext instance if supported.
 * @returns {AudioContext|null}
 */
function _getAudioContext() {
    if (_audioCtx) {
        if (_audioCtx.state === 'suspended' && typeof _audioCtx.resume === 'function') {
            try { _audioCtx.resume().catch(() => {}); } catch (e) {}
        }
        return _audioCtx;
    }
    try {
        const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
            || (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
        if (!AudioContextClass) return null;
        _audioCtx = new AudioContextClass();
        if (_audioCtx.state === 'suspended' && typeof _audioCtx.resume === 'function') {
            try { _audioCtx.resume().catch(() => {}); } catch (e) {}
        }
        return _audioCtx;
    } catch (e) {
        return null;
    }
}

/**
 * Schedules a single synthesized oscillator tone with an attack/release gain envelope.
 */
function _scheduleTone(ctx, {
    freq = 440,
    endFreq = null,
    type = 'sine',
    delay = 0,
    duration = 0.12,
    gain = 0.12
}) {
    if (!ctx || typeof ctx.createOscillator !== 'function' || typeof ctx.createGain !== 'function') return;
    try {
        const now = (typeof ctx.currentTime === 'number' ? ctx.currentTime : 0) + delay;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        if (osc.frequency && typeof osc.frequency.setValueAtTime === 'function') {
            osc.frequency.setValueAtTime(freq, now);
            if (endFreq && typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
            }
        }

        if (gainNode.gain && typeof gainNode.gain.setValueAtTime === 'function') {
            const attack = Math.min(0.015, duration * 0.2);
            gainNode.gain.setValueAtTime(0.0001, now);
            if (typeof gainNode.gain.linearRampToValueAtTime === 'function') {
                gainNode.gain.linearRampToValueAtTime(gain, now + attack);
            }
            if (typeof gainNode.gain.exponentialRampToValueAtTime === 'function') {
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            }
        }

        if (typeof osc.connect === 'function') osc.connect(gainNode);
        if (typeof gainNode.connect === 'function' && ctx.destination) gainNode.connect(ctx.destination);

        if (typeof osc.start === 'function') osc.start(now);
        if (typeof osc.stop === 'function') osc.stop(now + duration + 0.01);
    } catch (e) {
        // Ignore synthesis errors in restricted or headless environments
    }
}

/**
 * Synthesizes a named sound preset using Web Audio API oscillators.
 */
const SOUND_PRESETS = {
    // Crisp, uplifting two-note ascending chime for advancing a year
    ageUp: (ctx) => {
        _scheduleTone(ctx, { freq: 523.25, type: 'triangle', delay: 0, duration: 0.09, gain: 0.14 });     // C5
        _scheduleTone(ctx, { freq: 783.99, type: 'sine', delay: 0.055, duration: 0.14, gain: 0.16 });    // G5
    },

    // Confirmation chime when turning Sound Effects ON in Settings
    toggleOn: (ctx) => {
        _scheduleTone(ctx, { freq: 587.33, type: 'sine', delay: 0, duration: 0.08, gain: 0.12 });        // D5
        _scheduleTone(ctx, { freq: 880.00, type: 'triangle', delay: 0.05, duration: 0.12, gain: 0.14 }); // A5
    },

    // 4-note celebratory fanfare when unlocking an achievement trophy
    achievement: (ctx) => {
        _scheduleTone(ctx, { freq: 523.25, type: 'triangle', delay: 0, duration: 0.10, gain: 0.15 });    // C5
        _scheduleTone(ctx, { freq: 659.25, type: 'triangle', delay: 0.08, duration: 0.10, gain: 0.15 }); // E5
        _scheduleTone(ctx, { freq: 783.99, type: 'triangle', delay: 0.16, duration: 0.10, gain: 0.16 }); // G5
        _scheduleTone(ctx, { freq: 1046.50, type: 'sine', delay: 0.24, duration: 0.26, gain: 0.18 });    // C6
    },

    // Bright coin shimmer for positive money delta
    cashGain: (ctx) => {
        _scheduleTone(ctx, { freq: 987.77, type: 'sine', delay: 0, duration: 0.07, gain: 0.10 });        // B5
        _scheduleTone(ctx, { freq: 1318.51, type: 'sine', delay: 0.045, duration: 0.13, gain: 0.12 });   // E6
    },

    // Soft low tick for money spent / deducted
    cashSpend: (ctx) => {
        _scheduleTone(ctx, { freq: 260, endFreq: 175, type: 'triangle', delay: 0, duration: 0.09, gain: 0.09 });
    },

    // Solemn descending minor/bell sequence on character death
    death: (ctx) => {
        _scheduleTone(ctx, { freq: 220.00, type: 'sine', delay: 0, duration: 0.28, gain: 0.16 });        // A3
        _scheduleTone(ctx, { freq: 196.00, type: 'sine', delay: 0.22, duration: 0.28, gain: 0.15 });     // G3
        _scheduleTone(ctx, { freq: 164.81, type: 'triangle', delay: 0.44, duration: 0.32, gain: 0.15 }); // E3
        _scheduleTone(ctx, { freq: 110.00, type: 'sine', delay: 0.68, duration: 0.55, gain: 0.18 });     // A2
    },

    // Dual-tone marimba alert when a Life Event choice modal pops up
    eventPopup: (ctx) => {
        _scheduleTone(ctx, { freq: 698.46, type: 'sine', delay: 0, duration: 0.08, gain: 0.12 });        // F5
        _scheduleTone(ctx, { freq: 880.00, type: 'sine', delay: 0.065, duration: 0.13, gain: 0.13 });    // A5
    },

    // Triumphant major arpeggio for graduations, promotions, job hires, and IPOs
    milestone: (ctx) => {
        _scheduleTone(ctx, { freq: 392.00, type: 'triangle', delay: 0, duration: 0.09, gain: 0.14 });    // G4
        _scheduleTone(ctx, { freq: 493.88, type: 'triangle', delay: 0.07, duration: 0.09, gain: 0.14 }); // B4
        _scheduleTone(ctx, { freq: 587.33, type: 'triangle', delay: 0.14, duration: 0.10, gain: 0.15 }); // D5
        _scheduleTone(ctx, { freq: 783.99, type: 'sine', delay: 0.21, duration: 0.22, gain: 0.17 });     // G5
    },

    // Warm harp-like arpeggio for weddings and romantic milestones
    romance: (ctx) => {
        _scheduleTone(ctx, { freq: 698.46, type: 'sine', delay: 0, duration: 0.11, gain: 0.12 });        // F5
        _scheduleTone(ctx, { freq: 880.00, type: 'sine', delay: 0.07, duration: 0.11, gain: 0.13 });     // A5
        _scheduleTone(ctx, { freq: 1046.50, type: 'sine', delay: 0.14, duration: 0.18, gain: 0.14 });    // C6
    },

    // Gentle lullaby chime for welcoming a new baby
    newBaby: (ctx) => {
        _scheduleTone(ctx, { freq: 659.25, type: 'sine', delay: 0, duration: 0.10, gain: 0.12 });        // E5
        _scheduleTone(ctx, { freq: 783.99, type: 'sine', delay: 0.08, duration: 0.10, gain: 0.12 });     // G5
        _scheduleTone(ctx, { freq: 1046.50, type: 'sine', delay: 0.16, duration: 0.20, gain: 0.14 });    // C6
    },

    // Arcade payout cascade on Casino wins
    casinoWin: (ctx) => {
        _scheduleTone(ctx, { freq: 523.25, type: 'triangle', delay: 0, duration: 0.07, gain: 0.14 });    // C5
        _scheduleTone(ctx, { freq: 659.25, type: 'triangle', delay: 0.06, duration: 0.07, gain: 0.14 }); // E5
        _scheduleTone(ctx, { freq: 783.99, type: 'triangle', delay: 0.12, duration: 0.08, gain: 0.15 }); // G5
        _scheduleTone(ctx, { freq: 987.77, type: 'sine', delay: 0.18, duration: 0.18, gain: 0.16 });     // B5
    },

    // Descending two-note buzzer on Casino loss
    casinoLose: (ctx) => {
        _scheduleTone(ctx, { freq: 246.94, type: 'triangle', delay: 0, duration: 0.12, gain: 0.12 });    // B3
        _scheduleTone(ctx, { freq: 174.61, type: 'triangle', delay: 0.11, duration: 0.20, gain: 0.13 }); // F3
    },

    // High-roller jackpot fanfare
    jackpot: (ctx) => {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
            _scheduleTone(ctx, {
                freq,
                type: idx === notes.length - 1 ? 'sine' : 'triangle',
                delay: idx * 0.065,
                duration: idx === notes.length - 1 ? 0.30 : 0.08,
                gain: 0.16
            });
        });
    },

    // Brief two-tone police siren chirp on arrest
    arrest: (ctx) => {
        _scheduleTone(ctx, { freq: 660, endFreq: 880, type: 'triangle', delay: 0, duration: 0.14, gain: 0.14 });
        _scheduleTone(ctx, { freq: 880, endFreq: 660, type: 'triangle', delay: 0.14, duration: 0.16, gain: 0.14 });
    },

    // Ultra-subtle tactile pop when switching main navigation tabs
    uiClick: (ctx) => {
        _scheduleTone(ctx, { freq: 420, endFreq: 280, type: 'sine', delay: 0, duration: 0.025, gain: 0.05 });
    }
};

/**
 * Plays a named sound effect if `life_game_sfx` is enabled in Settings.
 * @param {keyof SOUND_PRESETS} soundName
 * @returns {boolean} True if sound was triggered, false if muted or unknown preset
 */
export function playSound(soundName) {
    if (!soundName || !SOUND_PRESETS[soundName]) return false;
    if (!isSfxEnabled()) return false;

    const nowMs = Date.now();

    // Prevent secondary cashGain/cashSpend chimes from overlapping with a primary cue
    // triggered in the same synchronous turn (e.g., Age Up salary or Casino payout).
    if ((soundName === 'cashGain' || soundName === 'cashSpend') && (nowMs - _lastPrimaryCueTime < 80)) {
        return false;
    }

    if (PRIMARY_CUES.has(soundName)) {
        _lastPrimaryCueTime = nowMs;
    }

    _lastPlayedSound = soundName;
    _playedSoundsHistory.push(soundName);
    if (_playedSoundsHistory.length > MAX_HISTORY_LENGTH) {
        _playedSoundsHistory.shift();
    }

    const ctx = _getAudioContext();
    if (ctx) {
        SOUND_PRESETS[soundName](ctx);
    }

    return true;
}

/**
 * Returns the name of the most recently played sound effect (for testing/diagnostics).
 * @returns {string|null}
 */
export function getLastPlayedSound() {
    return _lastPlayedSound;
}

/**
 * Returns a shallow copy of the played sound history array.
 * @returns {string[]}
 */
export function getPlayedSoundsHistory() {
    return [..._playedSoundsHistory];
}

/**
 * Resets sound history and cached AudioContext (useful for unit tests).
 */
export function resetSoundManager() {
    _lastPlayedSound = null;
    _playedSoundsHistory = [];
    _lastPrimaryCueTime = 0;
    _audioCtx = null;
}

export const SoundManager = {
    isSfxEnabled,
    play: playSound,
    playSound,
    getLastPlayedSound,
    getPlayedSoundsHistory,
    resetSoundManager,
    SOUND_PRESETS
};
