import { AvatarLogic } from '../core/avatarLogic.js';

// Builds a flat, minimal, layered SVG portrait from a character's stored
// appearance descriptor plus their current age (for hair-graying and
// wrinkle interpolation). Rendered SVG is never stored — only the trait
// descriptor persists (see avatarLogic.js).

const OUTLINE = '#2b2320';
const DARK_LENS = '#141414';

// Module-scope cache: character id/name + avatarVersion -> SVG string.
// Resets on page reload, which is fine — it's a derived-render cache, not
// the source of truth (the descriptor on the character is).
const _cache = new Map();

// --- LAYER 1: HEAD + EARS ---------------------------------------------------

function headShape(faceShape, skinHex) {
    let head;
    switch (faceShape) {
        case 'round':
            head = `<ellipse cx="50" cy="52" rx="33" ry="33"/>`;
            break;
        case 'square':
            head = `<rect x="20" y="20" width="60" height="64" rx="12"/>`;
            break;
        case 'heart':
            head = `<path d="M 50 16 C 68 16 80 30 78 46 C 76 62 64 70 50 88 C 36 70 24 62 22 46 C 20 30 32 16 50 16 Z"/>`;
            break;
        case 'long':
            head = `<ellipse cx="50" cy="54" rx="26" ry="40"/>`;
            break;
        case 'oval':
        default:
            head = `<ellipse cx="50" cy="52" rx="30" ry="36"/>`;
    }
    return `
        <g fill="${skinHex}" stroke="${OUTLINE}" stroke-width="2">
            <ellipse cx="17" cy="54" rx="5" ry="8"/>
            <ellipse cx="83" cy="54" rx="5" ry="8"/>
            ${head}
        </g>
    `;
}

// Crown height (top) and half-width (hw) for each head shape above, so hair
// can be sized/positioned to actually match the skull instead of assuming
// one fixed width. sideDrop is how far down the temples medium/long hair
// styles are allowed to hang before tucking back in.
const FACE_PROFILES = {
    oval:   { top: 16, hw: 30, sideDrop: 56 },
    round:  { top: 19, hw: 33, sideDrop: 58 },
    square: { top: 20, hw: 30, sideDrop: 56 },
    heart:  { top: 16, hw: 29, sideDrop: 54 },
    long:   { top: 14, hw: 26, sideDrop: 58 }
};

function getFaceProfile(faceShape) {
    return FACE_PROFILES[faceShape] || FACE_PROFILES.oval;
}

// --- LAYER 2: EYEBROWS -------------------------------------------------------

function eyebrows(style, colorHex) {
    switch (style) {
        case 'thick':
            return `<g fill="${colorHex}">
                <rect x="28" y="39" width="15" height="5" rx="2"/>
                <rect x="57" y="39" width="15" height="5" rx="2"/>
            </g>`;
        case 'arched':
            return `<g fill="none" stroke="${colorHex}" stroke-width="3" stroke-linecap="round">
                <path d="M 29 44 Q 36 35 43 42"/>
                <path d="M 57 42 Q 64 35 71 44"/>
            </g>`;
        case 'straight':
            return `<g fill="${colorHex}">
                <rect x="28" y="40.5" width="16" height="2.5" rx="1"/>
                <rect x="56" y="40.5" width="16" height="2.5" rx="1"/>
            </g>`;
        case 'medium':
            return `<g fill="${colorHex}">
                <rect x="29" y="40" width="14" height="3" rx="1.5"/>
                <rect x="57" y="40" width="14" height="3" rx="1.5"/>
            </g>`;
        case 'thin':
        default:
            return `<g fill="${colorHex}">
                <rect x="29" y="41" width="14" height="1.6" rx="0.8"/>
                <rect x="57" y="41" width="14" height="1.6" rx="0.8"/>
            </g>`;
    }
}

// --- LAYER 3: EYES ------------------------------------------------------------

function oneEye(cx, cy, shape, colorHex, skinHex) {
    switch (shape) {
        case 'round':
            return `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="6" ry="6" fill="white" stroke="${OUTLINE}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy}" r="3.6" fill="${colorHex}"/>
                <circle cx="${cx}" cy="${cy}" r="1.6" fill="#1b1b1b"/>
            </g>`;
        case 'hooded':
            return `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="7" ry="3.5" fill="white" stroke="${OUTLINE}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy}" r="3.2" fill="${colorHex}"/>
                <circle cx="${cx}" cy="${cy}" r="1.4" fill="#1b1b1b"/>
                <path d="M ${cx - 7} ${cy - 1} Q ${cx} ${cy - 7} ${cx + 7} ${cy - 1} L ${cx + 7} ${cy - 3} Q ${cx} ${cy - 8} ${cx - 7} ${cy - 3} Z" fill="${skinHex}"/>
            </g>`;
        case 'monolid':
            return `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="7" ry="2.6" fill="white" stroke="${OUTLINE}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy}" r="2.8" fill="${colorHex}"/>
                <circle cx="${cx}" cy="${cy}" r="1.2" fill="#1b1b1b"/>
            </g>`;
        case 'almond':
        default:
            return `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="7" ry="4" fill="white" stroke="${OUTLINE}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy}" r="3.2" fill="${colorHex}"/>
                <circle cx="${cx}" cy="${cy}" r="1.4" fill="#1b1b1b"/>
            </g>`;
    }
}

function eyes(shape, colorHex, skinHex) {
    return oneEye(38, 52, shape, colorHex, skinHex) + oneEye(62, 52, shape, colorHex, skinHex);
}

// --- LAYER 4: MOUTH (fixed, no trait) ----------------------------------------

function mouth() {
    return `<path d="M 42 72 Q 50 78 58 72" fill="none" stroke="${OUTLINE}" stroke-width="2.2" stroke-linecap="round"/>`;
}

// --- LAYER 5: FACIAL HAIR -----------------------------------------------------

function facialHair(style, colorHex) {
    switch (style) {
        case 'stubble': {
            const dots = [
                [36, 74], [42, 78], [50, 80], [58, 78], [64, 74],
                [40, 70], [60, 70], [46, 76], [54, 76], [50, 72]
            ];
            const circles = dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8"/>`).join('');
            return `<g fill="${colorHex}" opacity="0.45">${circles}</g>`;
        }
        case 'mustache':
            return `<path d="M 40 68 Q 50 65 60 68 Q 50 71.5 40 68 Z" fill="${colorHex}"/>`;
        case 'shortBeard':
            // Hugs the jaw/chin only — top edge sits at mouth-corner height (y=72), never above it.
            return `<path d="M 30 72 Q 24 86 50 90 Q 76 86 70 72 Q 60 80 50 80 Q 40 80 30 72 Z" fill="${colorHex}"/>`;
        case 'fullBeard':
            // Sideburns start below eye level (y=58) and taper down through the jaw to the chin.
            return `<path d="M 22 58 Q 16 82 50 94 Q 84 82 78 58 Q 68 76 50 78 Q 32 76 22 58 Z" fill="${colorHex}"/>`;
        case 'goatee':
            return `<path d="M 40 68 Q 50 65 60 68 Q 50 71.5 40 68 Z" fill="${colorHex}"/>` +
                   `<ellipse cx="50" cy="82" rx="7" ry="9" fill="${colorHex}"/>`;
        case 'none':
        default:
            return '';
    }
}

// --- LAYER 6: WRINKLE OVERLAY (generic, opacity-driven) -----------------------

function wrinkles(opacity) {
    if (opacity <= 0) return '';
    return `
        <g fill="none" stroke="${OUTLINE}" stroke-width="1" stroke-linecap="round" stroke-opacity="${opacity.toFixed(2)}">
            <path d="M 30 26 Q 50 23 70 26"/>
            <path d="M 32 31 Q 50 28 68 31"/>
            <path d="M 29 48 L 24 46"/>
            <path d="M 29 55 L 24 57"/>
            <path d="M 71 48 L 76 46"/>
            <path d="M 71 55 L 76 57"/>
            <path d="M 42 68 Q 40 74 41 78"/>
            <path d="M 58 68 Q 60 74 59 78"/>
        </g>
    `;
}

// --- LAYERS 7 & 9: HAIR (back layer behind shoulders, front cap) -------------
// Every shape below is generated from the face's own {top, hw} profile
// rather than a fixed path, so hair actually matches the skull it's drawn
// on instead of assuming one width for every face shape.

const DOME_BASE_Y = 34;

function domePeak(top) {
    return top - 12;
}

function domeCapPath(hw, top) {
    const peak = domePeak(top);
    const innerTop = peak + 6;
    const innerSide = peak + 14;
    return `M ${50 - hw} ${DOME_BASE_Y} Q 50 ${peak} ${50 + hw} ${DOME_BASE_Y} Q ${50 + hw - 2} ${innerSide} 50 ${innerTop} Q ${50 - hw + 2} ${innerSide} ${50 - hw} ${DOME_BASE_Y} Z`;
}

// Y-coordinate of the dome's own outer curve at a given x — lets decorative
// bits (spikes, a side flip) attach to the actual silhouette instead of
// floating at a fixed height that only happened to line up for one hw.
function domeOuterY(x, hw, top) {
    const peak = domePeak(top);
    const t = (x - (50 - hw)) / (2 * hw);
    return DOME_BASE_Y - 2 * (DOME_BASE_Y - peak) * t * (1 - t);
}

// Small tuft hanging from the temple past the ear — added on top of the
// short dome cap to build out medium/long styles without lowering the
// dome's own hairline (which stayed correct for the short styles).
function templeFlap(edge, sideDrop, dir) {
    return `M ${edge} ${DOME_BASE_Y} Q ${edge + dir * 7} 42 ${edge + dir * 3} ${sideDrop} Q ${edge - dir * 3} ${sideDrop - 6} ${edge} ${DOME_BASE_Y} Z`;
}

function buzzedCapPath(hw, top) {
    const w = hw - 2;
    const peak = top - 4;
    const innerTop = top + 2;
    const innerSide = top + 8;
    return `M ${50 - w} 30 Q 50 ${peak} ${50 + w} 30 Q ${50 + w - 2} ${innerSide} 50 ${innerTop} Q ${50 - w + 2} ${innerSide} ${50 - w} 30 Z`;
}

// Smooth cascade (straight hair), anchored to the head's actual side edge.
function leftCascade(edge, endY) {
    return `M ${edge - 1} 24 C ${edge - 8} 45 ${edge - 8} 75 ${edge - 4} ${endY} L ${edge + 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge + 2} 26 Z`;
}
function rightCascade(edge, endY) {
    return `M ${edge + 1} 24 C ${edge + 8} 45 ${edge + 8} 75 ${edge + 4} ${endY} L ${edge - 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge - 2} 26 Z`;
}

// Rippled cascade (wavy hair) — chains three alternating curves along the
// outer edge instead of one smooth arc, so "wavy" reads distinctly from
// "straight" at the same length.
function leftCascadeWavy(edge, endY) {
    const y1 = 24 + (endY - 24) * 0.35, y2 = 24 + (endY - 24) * 0.62, y3 = 24 + (endY - 24) * 0.85;
    return `M ${edge - 1} 24 C ${edge - 12} ${y1 - 4} ${edge + 2} ${y1 + 4} ${edge - 10} ${y2 - 6} C ${edge - 17} ${y2 + 4} ${edge + 1} ${y3 - 3} ${edge - 4} ${endY} L ${edge + 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge + 2} 26 Z`;
}
function rightCascadeWavy(edge, endY) {
    const y1 = 24 + (endY - 24) * 0.35, y2 = 24 + (endY - 24) * 0.62, y3 = 24 + (endY - 24) * 0.85;
    return `M ${edge + 1} 24 C ${edge + 12} ${y1 - 4} ${edge - 2} ${y1 + 4} ${edge + 10} ${y2 - 6} C ${edge + 17} ${y2 + 4} ${edge - 1} ${y3 - 3} ${edge + 4} ${endY} L ${edge - 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge - 2} 26 Z`;
}

function hairBack(style, colorHex, faceShape) {
    if (!AvatarLogic.HAIR_STYLES_WITH_BACK_LAYER.includes(style)) return '';
    const { hw } = getFaceProfile(faceShape);
    const leftEdge = 50 - hw;
    const rightEdge = 50 + hw;

    switch (style) {
        case 'ponytail':
            // Tie band sits behind/above the ear; the tail is pushed well clear of
            // the front cap's edge so it isn't painted over and reads as a tail,
            // not a stray strand, regardless of face width.
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <rect x="${rightEdge - 2}" y="30" width="10" height="6" rx="2"/>
                <ellipse cx="${rightEdge + 10}" cy="58" rx="6" ry="24" transform="rotate(10 ${rightEdge + 10} 58)"/>
            </g>`;
        case 'bun':
            return `<circle cx="50" cy="15" r="9" fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5"/>`;
        case 'longWavy':
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascadeWavy(leftEdge, 95)}"/>
                <path d="${rightCascadeWavy(rightEdge, 95)}"/>
            </g>`;
        case 'longStraight':
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascade(leftEdge, 95)}"/>
                <path d="${rightCascade(rightEdge, 95)}"/>
            </g>`;
        case 'shoulderWave':
        default:
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascadeWavy(leftEdge, 85)}"/>
                <path d="${rightCascadeWavy(rightEdge, 85)}"/>
            </g>`;
    }
}

function hairFront(style, colorHex, faceShape) {
    const { top, hw, sideDrop } = getFaceProfile(faceShape);
    const dy = top - 16; // shifts decorative top details to match a taller/shorter crown

    switch (style) {
        case 'bald':
            return '';
        case 'buzzed':
            return `<path d="${buzzedCapPath(hw, top)}" fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5"/>`;
        case 'shortSidePart': {
            const flipX = 50 - hw * 0.35;
            const attachY = domeOuterY(flipX, hw, top);
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                <path d="M ${flipX} ${attachY + 2} L ${flipX + 10} ${attachY - 7} L ${flipX + 14} ${attachY + 3} Z"/>
            </g>`;
        }
        case 'pixieSpiky': {
            const spikeXs = [-0.72, -0.4, 0.4, 0.72].map(f => 50 + f * hw);
            const spikes = spikeXs.map(x => {
                const attachY = domeOuterY(x, hw, top);
                return `<path d="M ${x - 3} ${attachY + 2} L ${x} ${attachY - 9} L ${x + 3} ${attachY + 3} Z"/>`;
            }).join('');
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                ${spikes}
            </g>`;
        }
        case 'curly': {
            const xs = [-0.8, -0.47, 0, 0.47, 0.8, -1.03, 1.03];
            const ys = [30, 17, 11, 17, 30, 42, 42];
            const rs = [7, 8, 9, 8, 7, 6, 6];
            const circles = xs.map((f, i) => `<circle cx="${50 + f * hw}" cy="${ys[i] + dy}" r="${rs[i]}"/>`).join('');
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">${circles}</g>`;
        }
        case 'ponytail':
        case 'bun':
        case 'shortCrop':
            return `<path d="${domeCapPath(hw, top)}" fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5"/>`;
        case 'mediumStraight':
        case 'shoulderWave':
        case 'longStraight':
        case 'longWavy':
        default:
            // Same dome/hairline as the short styles (already correctly clears the
            // eyebrows) plus a temple flap on each side for the extra length.
            return `<g fill="${colorHex}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                <path d="${templeFlap(50 - hw, sideDrop, -1)}"/>
                <path d="${templeFlap(50 + hw, sideDrop, 1)}"/>
            </g>`;
    }
}

// --- LAYER 8: GLASSES ----------------------------------------------------------

function bridgeAndTemples(colorHex) {
    return `<g stroke="${colorHex}" stroke-width="2" fill="none">
        <path d="M 47 52 L 53 52"/>
        <path d="M 29 52 L 20 53"/>
        <path d="M 71 52 L 80 53"/>
    </g>`;
}

function glasses(style, colorHex) {
    switch (style) {
        case 'round':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.5">
                <circle cx="38" cy="52" r="9"/>
                <circle cx="62" cy="52" r="9"/>
            </g>${bridgeAndTemples(colorHex)}`;
        case 'square':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.5">
                <rect x="29" y="44" width="18" height="15" rx="3"/>
                <rect x="53" y="44" width="18" height="15" rx="3"/>
            </g>${bridgeAndTemples(colorHex)}`;
        case 'catEye':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.5">
                <path d="M 29 48 Q 29 44 38 44 Q 47 44 47 52 Q 47 58 38 58 Q 30 58 29 52 Z"/>
                <path d="M 71 48 Q 71 44 62 44 Q 53 44 53 52 Q 53 58 62 58 Q 70 58 71 52 Z"/>
                <path d="M 45 44 L 50 37 L 47 46 Z"/>
                <path d="M 55 44 L 50 37 L 53 46 Z"/>
            </g>${bridgeAndTemples(colorHex)}`;
        case 'sunglasses':
            return `<g stroke="${colorHex}" stroke-width="2.5">
                <circle cx="38" cy="52" r="9" fill="${DARK_LENS}"/>
                <circle cx="62" cy="52" r="9" fill="${DARK_LENS}"/>
            </g>${bridgeAndTemples(colorHex)}`;
        case 'none':
        default:
            return '';
    }
}

// --- ASSEMBLY -------------------------------------------------------------------

function resolveHairFeatureColor(appearance, age) {
    return AvatarLogic.getAgedHairColor(appearance.hairColorBase, age, appearance.grayStartAge);
}

function resolveFacialHairColor(appearance, age) {
    const base = appearance.facialHairColor === 'matchHair' ? appearance.hairColorBase : appearance.facialHairColor;
    return AvatarLogic.getAgedHairColor(base, age, appearance.grayStartAge);
}

function buildSvg(appearance, age) {
    const skinHex = AvatarLogic.SKIN_TONE_HEX[appearance.skinTone] || AvatarLogic.SKIN_TONE_HEX.tone4;
    const eyeHex = AvatarLogic.EYE_COLOR_HEX[appearance.eyeColor] || AvatarLogic.EYE_COLOR_HEX.brown;
    const glassesHex = AvatarLogic.GLASSES_COLOR_HEX[appearance.glassesColor] || AvatarLogic.GLASSES_COLOR_HEX.black;
    const hairHex = resolveHairFeatureColor(appearance, age);
    const facialHairHex = resolveFacialHairColor(appearance, age);
    const wrinkleOpacity = AvatarLogic.getWrinkleOpacity(age);

    const layers = [
        headShape(appearance.faceShape, skinHex),
        eyebrows(appearance.eyebrowStyle, hairHex),
        eyes(appearance.eyeShape, eyeHex, skinHex),
        mouth(),
        facialHair(appearance.facialHairStyle, facialHairHex),
        wrinkles(wrinkleOpacity),
        hairBack(appearance.hairStyle, hairHex, appearance.faceShape),
        glasses(appearance.glassesStyle, glassesHex),
        hairFront(appearance.hairStyle, hairHex, appearance.faceShape)
    ].join('');

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">${layers}</svg>`;
}

/**
 * Returns SVG markup for a character's current portrait, either freshly
 * built or pulled from cache. Backfills a random appearance in place if the
 * character somehow has none yet (e.g. a save from before this feature
 * existed) so old saves render something stable rather than crashing.
 * @param {object} character - anything with `.age` and (ideally) `.id`/`.name`
 * @returns {string} SVG markup
 */
export function renderAvatar(character) {
    const appearance = AvatarLogic.ensureAppearance(character);
    const age = typeof character.age === 'number' ? character.age : 30;
    const cacheKey = `${character.id || character.name || 'unknown'}::${character.avatarVersion || 0}`;

    const cached = _cache.get(cacheKey);
    if (cached) return cached;

    const svg = buildSvg(appearance, age);
    _cache.set(cacheKey, svg);
    return svg;
}
