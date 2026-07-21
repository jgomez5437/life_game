// Pure appearance/aging logic. No DOM access — see ui/avatarRenderer.js for SVG assembly.

// --- TRAIT CATALOGS -----------------------------------------------------
// Every catalog is a flat array of option keys. None are gender-restricted;
// any character can be assigned any combination.

const SKIN_TONES = ['tone1', 'tone2', 'tone3', 'tone4', 'tone5', 'tone6', 'tone7', 'tone8'];
const SKIN_TONE_HEX = {
    tone1: '#FFE0BD', tone2: '#F5CBA0', tone3: '#E8B283', tone4: '#D69A6B',
    tone5: '#B87F52', tone6: '#8D5B3A', tone7: '#6B4226', tone8: '#4A2E1D'
};

const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'long'];

const EYE_SHAPES = ['almond', 'round', 'hooded', 'monolid'];

const EYE_COLORS = ['brown', 'hazel', 'green', 'blue', 'gray', 'amber'];
const EYE_COLOR_HEX = {
    brown: '#5B3A29', hazel: '#8A6D3B', green: '#4E7A51',
    blue: '#4A7AB5', gray: '#9AA5AB', amber: '#B8860B'
};

const EYEBROW_STYLES = ['thin', 'medium', 'thick', 'arched', 'straight'];

const HAIR_STYLES = [
    'bald', 'buzzed', 'shortCrop', 'shortSidePart', 'pixieSpiky',
    'mediumStraight', 'curly', 'shoulderWave', 'longStraight',
    'longWavy', 'ponytail', 'bun'
];
// Styles whose hair extends behind the ears/shoulders and needs a back layer.
const HAIR_STYLES_WITH_BACK_LAYER = ['shoulderWave', 'longStraight', 'longWavy', 'ponytail', 'bun'];

const HAIR_COLORS = ['black', 'darkBrown', 'brown', 'lightBrown', 'blonde', 'red', 'gray'];
const HAIR_COLOR_HEX = {
    black: '#1B1B1B', darkBrown: '#3B2314', brown: '#6B4423',
    lightBrown: '#8D5B3A', blonde: '#D4B483', red: '#A13D24', gray: '#8C8C8C'
};

const FACIAL_HAIR_STYLES = ['none', 'stubble', 'mustache', 'shortBeard', 'fullBeard', 'goatee'];
// 'matchHair' resolves to the character's own hairColorBase at render time.
const FACIAL_HAIR_COLORS = ['matchHair', ...HAIR_COLORS];

const GLASSES_STYLES = ['none', 'round', 'square', 'catEye', 'sunglasses'];
const GLASSES_COLORS = ['black', 'brown', 'gold', 'silver', 'tortoiseshell'];
const GLASSES_COLOR_HEX = {
    black: '#1B1B1B', brown: '#5B3A29', gold: '#D4AF37',
    silver: '#C0C0C0', tortoiseshell: '#6B4423'
};

const MID_GRAY_HEX = '#9E9E9E';
const WHITE_HAIR_HEX = '#F5F5F5';

// --- SEEDED RANDOMNESS ---------------------------------------------------
// A deterministic PRNG keyed off a string seed, so the same character
// (identified by id/name) always rolls the same appearance and grayStartAge,
// without needing to store anything beyond the chosen traits.

function hashSeed(str) {
    let h = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return h >>> 0;
}

// mulberry32
function makeRng(seedStr) {
    let a = hashSeed(seedStr);
    return function rng() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick(options, rng) {
    return options[Math.floor(rng() * options.length)];
}

// --- COLOR INTERPOLATION -------------------------------------------------

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function rgbToHex({ r, g, b }) {
    const toHex = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex({ r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) });
}

// --- AGING MATH -----------------------------------------------------------

/**
 * Deterministic age (35-50) at which a character's hair starts graying.
 * Same seed always yields the same result, so it stays stable across saves.
 * @param {string|number} seed
 * @returns {number}
 */
function generateGrayStartAge(seed) {
    const rng = makeRng(`${seed}:grayStartAge`);
    return 35 + Math.floor(rng() * 16); // 35 to 50 inclusive
}

/**
 * Current hair color for a character given their base color choice and age.
 * Below grayStartAge: unchanged. Then interpolates to mid-gray over 15 years,
 * then to white over the next 10 years, then stays white. Applies uniformly
 * regardless of the chosen base color (no "keeps dyeing it" exception).
 * @param {string} hairColorBase - one of HAIR_COLORS
 * @param {number} age
 * @param {number} grayStartAge
 * @returns {string} hex color
 */
function getAgedHairColor(hairColorBase, age, grayStartAge) {
    const base = HAIR_COLOR_HEX[hairColorBase] || HAIR_COLOR_HEX.darkBrown;
    if (age < grayStartAge) return base;
    if (age < grayStartAge + 15) {
        return lerpColor(base, MID_GRAY_HEX, (age - grayStartAge) / 15);
    }
    if (age < grayStartAge + 25) {
        return lerpColor(MID_GRAY_HEX, WHITE_HAIR_HEX, (age - grayStartAge - 15) / 10);
    }
    return WHITE_HAIR_HEX;
}

/**
 * Wrinkle-overlay opacity (0 to 0.85) purely as a function of age.
 * @param {number} age
 * @returns {number}
 */
function getWrinkleOpacity(age) {
    if (age < 35) return 0;
    if (age < 55) return lerp(0, 0.4, (age - 35) / 20);
    if (age < 80) return lerp(0.4, 0.85, (age - 55) / 25);
    return 0.85;
}

// --- DESCRIPTOR BUILDING ---------------------------------------------------

/**
 * Returns the stored appearance descriptor as-is. No side effects.
 * @param {object} character
 * @returns {object|undefined}
 */
function buildAppearanceDescriptor(character) {
    return character.appearance;
}

/**
 * Rolls a fully random appearance descriptor from a seed. Every trait is
 * independent of the others (each draws from its own sub-seeded RNG), and
 * grayStartAge is derived the same way generateGrayStartAge would on its own.
 * @param {string|number} seed - something stable about the character (id/name)
 * @returns {object} appearance descriptor
 */
function generateRandomAppearance(seed) {
    const draw = (traitKey, options) => pick(options, makeRng(`${seed}:${traitKey}`));

    return {
        skinTone: draw('skinTone', SKIN_TONES),
        faceShape: draw('faceShape', FACE_SHAPES),
        eyeShape: draw('eyeShape', EYE_SHAPES),
        eyeColor: draw('eyeColor', EYE_COLORS),
        eyebrowStyle: draw('eyebrowStyle', EYEBROW_STYLES),
        hairStyle: draw('hairStyle', HAIR_STYLES),
        hairColorBase: draw('hairColorBase', HAIR_COLORS),
        facialHairStyle: draw('facialHairStyle', FACIAL_HAIR_STYLES),
        facialHairColor: draw('facialHairColor', FACIAL_HAIR_COLORS),
        glassesStyle: draw('glassesStyle', GLASSES_STYLES),
        glassesColor: draw('glassesColor', GLASSES_COLORS),
        grayStartAge: generateGrayStartAge(seed)
    };
}

/**
 * Assigns a random appearance to a character if it doesn't already have one.
 * Call this once at the point a character is generated (or the first time a
 * portrait is actually needed for one that was never given one) rather than
 * regenerating on every render.
 * @param {object} character - must have an `id` or `name` to seed from
 * @returns {object} the character's appearance descriptor
 */
function ensureAppearance(character) {
    if (!character.appearance) {
        character.appearance = generateRandomAppearance(character.id || character.name);
    }
    return character.appearance;
}

export const AvatarLogic = {
    SKIN_TONES, SKIN_TONE_HEX,
    FACE_SHAPES,
    EYE_SHAPES,
    EYE_COLORS, EYE_COLOR_HEX,
    EYEBROW_STYLES,
    HAIR_STYLES, HAIR_STYLES_WITH_BACK_LAYER,
    HAIR_COLORS, HAIR_COLOR_HEX,
    FACIAL_HAIR_STYLES, FACIAL_HAIR_COLORS,
    GLASSES_STYLES, GLASSES_COLORS, GLASSES_COLOR_HEX,
    buildAppearanceDescriptor,
    generateRandomAppearance,
    generateGrayStartAge,
    getAgedHairColor,
    getWrinkleOpacity,
    ensureAppearance
};
