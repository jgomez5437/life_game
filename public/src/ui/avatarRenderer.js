import { AvatarLogic } from '../core/avatarLogic.js';

// Builds a flat, minimal, layered SVG portrait from a character's stored
// appearance descriptor plus their current age (for hair-graying and
// wrinkle interpolation). Rendered SVG is never stored — only the trait
// descriptor persists (see avatarLogic.js).

const OUTLINE = '#2b2320';  // fallback for non-skin elements (wrinkles, baby features)
const DARK_LENS = '#141414';

// Derives a warm outline color from the character's skin tone instead of
// one universal cold brown. Darker skins get deeper/warmer outlines; lighter
// skins get softer brown. Unifies each face's palette.
function skinOutline(skinHex) {
    return shadeColor(skinHex, -55);
}

// --- COLOR HELPERS -----------------------------------------------------------

// Lightens (positive percent) or darkens (negative) a hex color by shifting
// every channel toward white/black. Used to derive hair gradient stops and
// strand/shine details from a single base hue instead of hand-picking shades
// per color in the trait catalog.
function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amt);
    const g = clamp(((num >> 8) & 0x00FF) + amt);
    const b = clamp((num & 0x0000FF) + amt);
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// SVG gradient/pattern ids must be unique document-wide — several avatars
// (e.g. a relationship list) can be inlined into the DOM at once, so ids
// are namespaced per-character rather than per-color.
function sanitizeId(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function strandGroup(pathsD, strokeColor, opacity, width) {
    if (!pathsD.length) return '';
    return `<g fill="none" stroke="${strokeColor}" stroke-width="${width}" stroke-linecap="round" stroke-opacity="${opacity}">${pathsD.map(d => `<path d="${d}"/>`).join('')}</g>`;
}

// Module-scope cache: character id/name + avatarVersion -> SVG string.
// Resets on page reload, which is fine — it's a derived-render cache, not
// the source of truth (the descriptor on the character is).
const _cache = new Map();

// --- LAYER 1: HEAD + EARS ---------------------------------------------------

function headShape(faceShape, skinHex, skinGradUrl, outlineHex) {
    const ol = outlineHex || skinOutline(skinHex);
    const fill = skinGradUrl || skinHex;
    let head;
    let chinShadow = ''; // ambient-occlusion shadow under the chin
    switch (faceShape) {
        case 'round':
            head = `<ellipse cx="50" cy="52" rx="33" ry="33"/>`;
            chinShadow = `<ellipse cx="50" cy="78" rx="22" ry="6" fill="${shadeColor(skinHex, -30)}" opacity="0.12"/>`;
            break;
        case 'square':
            head = `<rect x="20" y="20" width="60" height="64" rx="12"/>`;
            chinShadow = `<ellipse cx="50" cy="80" rx="24" ry="5" fill="${shadeColor(skinHex, -30)}" opacity="0.12"/>`;
            break;
        case 'heart':
            head = `<path d="M 50 16 C 68 16 80 30 78 46 C 76 62 64 70 50 88 C 36 70 24 62 22 46 C 20 30 32 16 50 16 Z"/>`;
            chinShadow = `<ellipse cx="50" cy="82" rx="14" ry="5" fill="${shadeColor(skinHex, -30)}" opacity="0.12"/>`;
            break;
        case 'long':
            head = `<ellipse cx="50" cy="54" rx="26" ry="40"/>`;
            chinShadow = `<ellipse cx="50" cy="88" rx="16" ry="5" fill="${shadeColor(skinHex, -30)}" opacity="0.12"/>`;
            break;
        case 'oval':
        default:
            head = `<ellipse cx="50" cy="52" rx="30" ry="36"/>`;
            chinShadow = `<ellipse cx="50" cy="82" rx="18" ry="5" fill="${shadeColor(skinHex, -30)}" opacity="0.12"/>`;
    }
    return `
        <g fill="${fill}" stroke="${ol}" stroke-width="2.2">
            <ellipse cx="17" cy="54" rx="5" ry="8"/>
            <ellipse cx="83" cy="54" rx="5" ry="8"/>
            ${head}
        </g>
        <!-- ear inner shadows -->
        <ellipse cx="17" cy="55" rx="2.5" ry="4" fill="${shadeColor(skinHex, -25)}" opacity="0.15"/>
        <ellipse cx="83" cy="55" rx="2.5" ry="4" fill="${shadeColor(skinHex, -25)}" opacity="0.15"/>
        <!-- cheekbone highlights -->
        <ellipse cx="33" cy="49" rx="5" ry="3" fill="white" opacity="0.08"/>
        <ellipse cx="67" cy="49" rx="5" ry="3" fill="white" opacity="0.08"/>
        ${chinShadow}
    `;
}

// Crown height (top) and half-width (hw) for each head shape above, so hair
// can be sized/positioned to actually match the skull instead of assuming
// one fixed width. sideDrop is how far down the temples medium/long hair
// styles are allowed to hang before tucking back in.
const FACE_PROFILES = {
    oval:   { top: 16, hw: 30, sideDrop: 56, domeBaseY: 34 },
    round:  { top: 19, hw: 33, sideDrop: 58, domeBaseY: 36 },
    square: { top: 20, hw: 30, sideDrop: 56, domeBaseY: 33 },
    heart:  { top: 16, hw: 29, sideDrop: 54, domeBaseY: 33 },
    long:   { top: 14, hw: 26, sideDrop: 58, domeBaseY: 32 }
};

function getFaceProfile(faceShape) {
    return FACE_PROFILES[faceShape] || FACE_PROFILES.oval;
}

// Per-shape offsets for facial feature placement so each face shape feels
// genuinely different — not just a different outline around the same face.
// eyeY/browY/mouthY/noseY are the vertical center; eyeSpacing is half the
// distance between eye centers (measured from center x=50).
const FEATURE_OFFSETS = {
    oval:   { eyeY: 52, eyeSpacing: 12, browY: 40, mouthY: 72, noseY: 63, blushY: 62 },
    round:  { eyeY: 51, eyeSpacing: 11, browY: 39, mouthY: 70, noseY: 62, blushY: 60 },
    square: { eyeY: 50, eyeSpacing: 13, browY: 38, mouthY: 72, noseY: 62, blushY: 62 },
    heart:  { eyeY: 50, eyeSpacing: 12, browY: 38, mouthY: 74, noseY: 63, blushY: 64 },
    long:   { eyeY: 53, eyeSpacing: 11, browY: 41, mouthY: 74, noseY: 65, blushY: 64 }
};

function getFeaturePos(faceShape) {
    return FEATURE_OFFSETS[faceShape] || FEATURE_OFFSETS.oval;
}

// --- LAYER 1B: BLUSH ----------------------------------------------------------
// Drawn directly on the skin, before eyebrows/eyes so it never sits on top
// of those layers — just a soft flush low on each cheek.

function blush(colorKey, faceShape) {
    if (!colorKey || colorKey === 'none') return '';
    const hex = AvatarLogic.BLUSH_COLOR_HEX[colorKey] || AvatarLogic.BLUSH_COLOR_HEX.pink;
    const { blushY } = getFeaturePos(faceShape);
    const { hw } = getFaceProfile(faceShape);
    const blushX = hw * 0.7;
    return `<g fill="${hex}" opacity="0.35">
        <ellipse cx="${(50 - blushX).toFixed(1)}" cy="${blushY}" rx="7" ry="4.5"/>
        <ellipse cx="${(50 + blushX).toFixed(1)}" cy="${blushY}" rx="7" ry="4.5"/>
    </g>`;
}

// --- LAYER 2: EYEBROWS -------------------------------------------------------

function eyebrows(style, colorHex, faceShape) {
    const { browY, eyeSpacing } = getFeaturePos(faceShape);
    // Left brow spans from inner to outer; right is mirrored.
    const li = 50 - eyeSpacing + 1;  // inner edge (near nose)
    const lo = 50 - eyeSpacing - 7;  // outer edge
    const ri = 50 + eyeSpacing - 1;
    const ro = 50 + eyeSpacing + 7;
    const dark = shadeColor(colorHex, -20);

    switch (style) {
        case 'thick': {
            // Tapered brow: thick in the middle, tapering at both ends
            const lPath = `M ${lo} ${browY + 1} Q ${(lo + li) / 2} ${browY - 4} ${li} ${browY + 0.5} Q ${(lo + li) / 2} ${browY + 4} ${lo} ${browY + 1} Z`;
            const rPath = `M ${ri} ${browY + 0.5} Q ${(ri + ro) / 2} ${browY - 4} ${ro} ${browY + 1} Q ${(ri + ro) / 2} ${browY + 4} ${ri} ${browY + 0.5} Z`;
            // Hair-texture strokes inside thick brows
            const hairL = `<g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.4" stroke-linecap="round">
                <path d="M ${lo + 3} ${browY} L ${lo + 5} ${browY - 1.2}"/>
                <path d="M ${lo + 7} ${browY + 0.5} L ${lo + 9} ${browY - 1}"/>
                <path d="M ${lo + 11} ${browY + 0.3} L ${lo + 12.5} ${browY - 0.8}"/>
            </g>`;
            const hairR = `<g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.4" stroke-linecap="round">
                <path d="M ${ri + 3} ${browY - 1.2} L ${ri + 5} ${browY}"/>
                <path d="M ${ri + 5} ${browY - 1} L ${ri + 7} ${browY + 0.5}"/>
                <path d="M ${ri + 9} ${browY - 0.8} L ${ri + 10.5} ${browY + 0.3}"/>
            </g>`;
            return `<g fill="${colorHex}"><path d="${lPath}"/><path d="${rPath}"/></g>${hairL}${hairR}`;
        }
        case 'arched':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.8" stroke-linecap="round">
                <path d="M ${lo} ${browY + 3} Q ${(lo + li) / 2} ${browY - 6} ${li} ${browY + 1}"/>
                <path d="M ${ri} ${browY + 1} Q ${(ri + ro) / 2} ${browY - 6} ${ro} ${browY + 3}"/>
            </g>`;
        case 'straight':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.2" stroke-linecap="round">
                <path d="M ${lo} ${browY + 0.5} L ${li} ${browY + 0.5}"/>
                <path d="M ${ri} ${browY + 0.5} L ${ro} ${browY + 0.5}"/>
            </g>`;
        case 'medium': {
            // Slightly tapered — wider center, thin tails
            const lPath = `M ${lo} ${browY + 0.5} Q ${(lo + li) / 2} ${browY - 2.5} ${li} ${browY} Q ${(lo + li) / 2} ${browY + 2.8} ${lo} ${browY + 0.5} Z`;
            const rPath = `M ${ri} ${browY} Q ${(ri + ro) / 2} ${browY - 2.5} ${ro} ${browY + 0.5} Q ${(ri + ro) / 2} ${browY + 2.8} ${ri} ${browY} Z`;
            // Subtle hair texture on medium brows
            const hairL = `<g fill="none" stroke="${dark}" stroke-width="0.4" stroke-opacity="0.35" stroke-linecap="round">
                <path d="M ${lo + 4} ${browY + 0.3} L ${lo + 6} ${browY - 0.8}"/>
                <path d="M ${lo + 9} ${browY + 0.2} L ${lo + 10.5} ${browY - 0.6}"/>
            </g>`;
            const hairR = `<g fill="none" stroke="${dark}" stroke-width="0.4" stroke-opacity="0.35" stroke-linecap="round">
                <path d="M ${ri + 4} ${browY - 0.8} L ${ri + 6} ${browY + 0.3}"/>
                <path d="M ${ri + 7} ${browY - 0.6} L ${ri + 8.5} ${browY + 0.2}"/>
            </g>`;
            return `<g fill="${colorHex}"><path d="${lPath}"/><path d="${rPath}"/></g>${hairL}${hairR}`;
        }
        case 'thin':
        default:
            return `<g fill="none" stroke="${colorHex}" stroke-width="1.4" stroke-linecap="round">
                <path d="M ${lo} ${browY + 1} Q ${(lo + li) / 2} ${browY - 1.5} ${li} ${browY + 0.5}"/>
                <path d="M ${ri} ${browY + 0.5} Q ${(ri + ro) / 2} ${browY - 1.5} ${ro} ${browY + 1}"/>
            </g>`;
    }
}

// --- LAYER 3: EYES ------------------------------------------------------------

// Eyelash strokes fanning from the outer corner of each eye.
function eyelashes(cx, cy, rx, ry, style, isLeft) {
    if (!style || style === 'none') return '';
    const dir = isLeft ? -1 : 1;
    const outerX = cx + dir * rx;
    const outerY = cy - ry * 0.3;
    switch (style) {
        case 'subtle':
            return `<g fill="none" stroke="#1b1b1b" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.6">
                <path d="M ${outerX} ${outerY} L ${outerX + dir * 3} ${outerY - 2.5}"/>
                <path d="M ${outerX - dir * 1} ${outerY - 1} L ${outerX + dir * 1.5} ${outerY - 3.5}"/>
            </g>`;
        case 'full':
            return `<g fill="none" stroke="#1b1b1b" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.65">
                <path d="M ${outerX} ${outerY} L ${outerX + dir * 3.5} ${outerY - 2}"/>
                <path d="M ${outerX - dir * 1.5} ${outerY - 0.5} L ${outerX + dir * 1} ${outerY - 3.5}"/>
                <path d="M ${outerX - dir * 3} ${outerY} L ${outerX - dir * 1.5} ${outerY - 3}"/>
            </g>`;
        case 'dramatic':
            return `<g fill="none" stroke="#1b1b1b" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.7">
                <path d="M ${outerX} ${outerY} L ${outerX + dir * 4} ${outerY - 1.5}"/>
                <path d="M ${outerX - dir * 1} ${outerY - 0.3} L ${outerX + dir * 2} ${outerY - 3.5}"/>
                <path d="M ${outerX - dir * 2.5} ${outerY} L ${outerX - dir * 1} ${outerY - 3.5}"/>
                <path d="M ${outerX - dir * 4} ${outerY + 0.5} L ${outerX - dir * 3} ${outerY - 2.5}"/>
            </g>`;
        default:
            return '';
    }
}

function oneEye(cx, cy, shape, colorHex, skinHex, outlineHex, irisGradUrl, eyelashStyle, isLeft) {
    const ol = outlineHex || OUTLINE;
    const irisFill = irisGradUrl || colorHex;

    // Helper: catch light scaled to eye size
    function catchLight(rx, ry) {
        const clR = Math.min(rx, ry) * 0.22;
        return `<circle cx="${(cx - rx * 0.3).toFixed(1)}" cy="${(cy - ry * 0.35).toFixed(1)}" r="${clR.toFixed(1)}" fill="white" opacity="0.85"/>`;
    }

    // Helper: lower eyelid hint scaled to eye size
    function lowerLid(rx, ry) {
        const lidHalfW = rx * 0.75;
        const lidDrop = ry * 0.55;
        const lidSag = ry * 0.85;
        return `<path d="M ${(cx - lidHalfW).toFixed(1)} ${(cy + lidDrop).toFixed(1)} Q ${cx} ${(cy + lidSag).toFixed(1)} ${(cx + lidHalfW).toFixed(1)} ${(cy + lidDrop).toFixed(1)}" fill="none" stroke="${ol}" stroke-width="0.5" stroke-opacity="0.15"/>`;
    }

    let eyeSvg;
    switch (shape) {
        case 'round': {
            const rx = 6, ry = 6;
            eyeSvg = `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="${ol}" stroke-width="1"/>
                <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry} ${cx + rx} ${cy}" fill="none" stroke="${ol}" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="3.6" fill="${irisFill}"/>
                <circle cx="${cx}" cy="${cy}" r="1.6" fill="#1b1b1b"/>
                ${catchLight(rx, ry)}
                ${lowerLid(rx, ry)}
            </g>`;
            return eyeSvg + eyelashes(cx, cy, 6, 6, eyelashStyle, isLeft);
        }
        case 'hooded': {
            const rx = 7, ry = 3.5;
            eyeSvg = `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="${ol}" stroke-width="1"/>
                <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry} ${cx + rx} ${cy}" fill="none" stroke="${ol}" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="3.2" fill="${irisFill}"/>
                <circle cx="${cx}" cy="${cy}" r="1.4" fill="#1b1b1b"/>
                <path d="M ${cx - rx} ${cy - 1} Q ${cx} ${cy - 7} ${cx + rx} ${cy - 1} L ${cx + rx} ${cy - 3} Q ${cx} ${cy - 8} ${cx - rx} ${cy - 3} Z" fill="${skinHex}"/>
                ${catchLight(rx, ry)}
            </g>`;
            return eyeSvg + eyelashes(cx, cy, 7, 3.5, eyelashStyle, isLeft);
        }
        case 'monolid': {
            const rx = 7, ry = 2.6;
            eyeSvg = `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="${ol}" stroke-width="1"/>
                <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry} ${cx + rx} ${cy}" fill="none" stroke="${ol}" stroke-width="1.6" stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="2.8" fill="${irisFill}"/>
                <circle cx="${cx}" cy="${cy}" r="1.2" fill="#1b1b1b"/>
                ${catchLight(rx, ry)}
            </g>`;
            return eyeSvg + eyelashes(cx, cy, 7, 2.6, eyelashStyle, isLeft);
        }
        case 'almond':
        default: {
            const rx = 7, ry = 4;
            eyeSvg = `<g>
                <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="${ol}" stroke-width="1"/>
                <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry} ${cx + rx} ${cy}" fill="none" stroke="${ol}" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="3.2" fill="${irisFill}"/>
                <circle cx="${cx}" cy="${cy}" r="1.4" fill="#1b1b1b"/>
                ${catchLight(rx, ry)}
                ${lowerLid(rx, ry)}
            </g>`;
            return eyeSvg + eyelashes(cx, cy, 7, 4, eyelashStyle, isLeft);
        }
    }
}

function eyes(shape, colorHex, skinHex, faceShape, outlineHex, irisGradUrl, eyelashStyle) {
    const { eyeY, eyeSpacing } = getFeaturePos(faceShape);
    const lcx = 50 - eyeSpacing;
    const rcx = 50 + eyeSpacing;
    return oneEye(lcx, eyeY, shape, colorHex, skinHex, outlineHex, irisGradUrl, eyelashStyle, true) +
           oneEye(rcx, eyeY, shape, colorHex, skinHex, outlineHex, irisGradUrl, eyelashStyle, false);
}

// --- LAYER 4: MOUTH (plain line, or a filled lipstick shape) ------------------

function mouth(lipstickColorKey, faceShape, skinHex) {
    const { mouthY } = getFeaturePos(faceShape);
    const ol = skinHex ? skinOutline(skinHex) : OUTLINE;
    if (!lipstickColorKey || lipstickColorKey === 'none') {
        // Natural lip shape using skin-shadow colors instead of an invisible line
        const lipColor = skinHex ? shadeColor(skinHex, -15) : '#c9908a';
        const lipDark = skinHex ? shadeColor(skinHex, -28) : '#a87070';
        return `<path d="M ${50 - 8} ${mouthY} Q ${50 - 4} ${mouthY - 2.5} 50 ${mouthY - 1} Q ${50 + 4} ${mouthY - 2.5} ${50 + 8} ${mouthY} Q ${50 + 4} ${mouthY + 4} 50 ${mouthY + 4.5} Q ${50 - 4} ${mouthY + 4} ${50 - 8} ${mouthY} Z" fill="${lipColor}" stroke="${lipDark}" stroke-width="0.8" opacity="0.55"/>
            <path d="M ${50 - 7} ${mouthY} Q 50 ${mouthY + 1.2} ${50 + 7} ${mouthY}" fill="none" stroke="${lipDark}" stroke-width="0.6" stroke-opacity="0.45"/>
            <path d="M ${50 - 2} ${mouthY - 0.5} L 50 ${mouthY - 1.2} L ${50 + 2} ${mouthY - 0.5}" fill="none" stroke="${lipDark}" stroke-width="0.4" stroke-opacity="0.2"/>`;
    }
    const hex = AvatarLogic.LIPSTICK_COLOR_HEX[lipstickColorKey] || AvatarLogic.LIPSTICK_COLOR_HEX.red;
    const dark = shadeColor(hex, -25);
    const light = shadeColor(hex, 15);
    // Closed lip shape with gradient-like shading for volume
    return `<path d="M ${50 - 8} ${mouthY} Q ${50 - 4} ${mouthY - 3} 50 ${mouthY - 1} Q ${50 + 4} ${mouthY - 3} ${50 + 8} ${mouthY} Q ${50 + 4} ${mouthY + 4.5} 50 ${mouthY + 5.5} Q ${50 - 4} ${mouthY + 4.5} ${50 - 8} ${mouthY} Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
        <path d="M ${50 - 7} ${mouthY} Q 50 ${mouthY + 1.6} ${50 + 7} ${mouthY}" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.6"/>
        <path d="M ${50 - 3} ${mouthY + 1.5} Q 50 ${mouthY + 3} ${50 + 3} ${mouthY + 1.5}" fill="${light}" opacity="0.25"/>`;
}

// --- LAYER 4B: NOSE -----------------------------------------------------------
// Rendered as shadow-only (no hard outline) so it reads as natural contour
// rather than a bolted-on feature. Uses skin shadow colors at low opacity.

function nose(noseShape, skinHex, faceShape) {
    const { noseY } = getFeaturePos(faceShape);
    const shadow = shadeColor(skinHex, -18);
    const op = '0.35';
    const tipY = noseY + 3;
    const bridgeTop = noseY - 8;

    switch (noseShape) {
        case 'medium':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 48 ${bridgeTop} Q 47 ${noseY} 45 ${tipY}" stroke-width="1.2"/>
                <path d="M 52 ${bridgeTop} Q 53 ${noseY} 55 ${tipY}" stroke-width="1.2"/>
                <path d="M 45 ${tipY} Q 50 ${tipY + 2.5} 55 ${tipY}" stroke-width="1"/>
            </g>`;
        case 'button':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 48.5 ${bridgeTop + 2} Q 48 ${noseY} 47 ${tipY}" stroke-width="1"/>
                <path d="M 51.5 ${bridgeTop + 2} Q 52 ${noseY} 53 ${tipY}" stroke-width="1"/>
                <ellipse cx="50" cy="${tipY}" rx="4" ry="2.5" stroke-width="1"/>
            </g>`;
        case 'pointed':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 49 ${bridgeTop - 1} L 47 ${tipY}" stroke-width="1.3"/>
                <path d="M 51 ${bridgeTop - 1} L 53 ${tipY}" stroke-width="1.3"/>
                <path d="M 47 ${tipY} L 50 ${tipY + 2} L 53 ${tipY}" stroke-width="0.9"/>
            </g>`;
        case 'wide':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 48 ${bridgeTop + 1} Q 47 ${noseY} 43 ${tipY}" stroke-width="1.2"/>
                <path d="M 52 ${bridgeTop + 1} Q 53 ${noseY} 57 ${tipY}" stroke-width="1.2"/>
                <path d="M 43 ${tipY} Q 50 ${tipY + 3} 57 ${tipY}" stroke-width="1.1"/>
            </g>`;
        case 'aquiline':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 48 ${bridgeTop - 2} Q 46 ${bridgeTop + 3} 47.5 ${noseY} Q 46.5 ${noseY + 2} 46 ${tipY}" stroke-width="1.3"/>
                <path d="M 52 ${bridgeTop - 2} Q 54 ${bridgeTop + 3} 52.5 ${noseY} Q 53.5 ${noseY + 2} 54 ${tipY}" stroke-width="1.3"/>
                <path d="M 46 ${tipY} Q 50 ${tipY + 2} 54 ${tipY}" stroke-width="1"/>
            </g>`;
        case 'small':
        default:
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="${op}">
                <path d="M 49 ${bridgeTop + 3} Q 48 ${noseY + 1} 47 ${tipY}" stroke-width="1"/>
                <path d="M 51 ${bridgeTop + 3} Q 52 ${noseY + 1} 53 ${tipY}" stroke-width="1"/>
                <path d="M 47 ${tipY} Q 50 ${tipY + 1.5} 53 ${tipY}" stroke-width="0.8"/>
            </g>`;
    }
}

// Philtrum: tiny V shadow between nose and upper lip
function philtrum(skinHex, faceShape) {
    const { noseY, mouthY } = getFeaturePos(faceShape);
    const shadow = shadeColor(skinHex, -18);
    const top = noseY + 5;
    const bot = mouthY - 2;
    return `<g fill="none" stroke="${shadow}" stroke-width="0.6" stroke-linecap="round" opacity="0.12">
        <path d="M 49 ${top} Q 48.5 ${(top + bot) / 2} 49.5 ${bot}"/>
        <path d="M 51 ${top} Q 51.5 ${(top + bot) / 2} 50.5 ${bot}"/>
    </g>`;
}

// --- LAYER 5: FACIAL HAIR -----------------------------------------------------

function facialHair(style, colorHex, faceShape) {
    const { mouthY } = getFeaturePos(faceShape);
    switch (style) {
        case 'stubble': {
            const dots = [
                [36, mouthY + 2], [42, mouthY + 6], [50, mouthY + 8], [58, mouthY + 6], [64, mouthY + 2],
                [40, mouthY - 2], [60, mouthY - 2], [46, mouthY + 4], [54, mouthY + 4], [50, mouthY]
            ];
            const circles = dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8"/>`).join('');
            return `<g fill="${colorHex}" opacity="0.45">${circles}</g>`;
        }
        case 'mustache':
            return `<path d="M 40 ${mouthY - 4} Q 50 ${mouthY - 7} 60 ${mouthY - 4} Q 50 ${mouthY - 0.5} 40 ${mouthY - 4} Z" fill="${colorHex}"/>`;
        case 'shortBeard':
            // Hugs the jaw/chin only — top edge sits at mouth-corner height, never above it.
            return `<path d="M 30 ${mouthY} Q 24 ${mouthY + 14} 50 ${mouthY + 18} Q 76 ${mouthY + 14} 70 ${mouthY} Q 60 ${mouthY + 8} 50 ${mouthY + 8} Q 40 ${mouthY + 8} 30 ${mouthY} Z" fill="${colorHex}"/>`;
        case 'fullBeard':
            // Sideburns start below eye level and taper down through the jaw to the chin.
            return `<path d="M 22 ${mouthY - 14} Q 16 ${mouthY + 10} 50 ${mouthY + 22} Q 84 ${mouthY + 10} 78 ${mouthY - 14} Q 68 ${mouthY + 4} 50 ${mouthY + 6} Q 32 ${mouthY + 4} 22 ${mouthY - 14} Z" fill="${colorHex}"/>`;
        case 'goatee':
            return `<path d="M 40 ${mouthY - 4} Q 50 ${mouthY - 7} 60 ${mouthY - 4} Q 50 ${mouthY - 0.5} 40 ${mouthY - 4} Z" fill="${colorHex}"/>` +
                   `<ellipse cx="50" cy="${mouthY + 10}" rx="7" ry="9" fill="${colorHex}"/>`;
        case 'none':
        default:
            return '';
    }
}

// --- LAYER 6: WRINKLE OVERLAY (generic, opacity-driven) -----------------------

function wrinkles(opacity, faceShape) {
    if (opacity <= 0) return '';
    const { eyeY, browY, mouthY } = getFeaturePos(faceShape);
    const foreheadY1 = browY - 14;
    const foreheadY2 = browY - 9;
    const crowFeetY1 = eyeY - 4;
    const crowFeetY2 = eyeY + 3;
    const nlFoldY = mouthY - 4;
    const nlFoldEndY = mouthY + 6;
    return `
        <g fill="none" stroke="${OUTLINE}" stroke-width="1" stroke-linecap="round" stroke-opacity="${opacity.toFixed(2)}">
            <path d="M 30 ${foreheadY1} Q 50 ${foreheadY1 - 3} 70 ${foreheadY1}"/>
            <path d="M 32 ${foreheadY2} Q 50 ${foreheadY2 - 3} 68 ${foreheadY2}"/>
            <path d="M 29 ${crowFeetY1} L 24 ${crowFeetY1 - 2}"/>
            <path d="M 29 ${crowFeetY2} L 24 ${crowFeetY2 + 2}"/>
            <path d="M 71 ${crowFeetY1} L 76 ${crowFeetY1 - 2}"/>
            <path d="M 71 ${crowFeetY2} L 76 ${crowFeetY2 + 2}"/>
            <path d="M 42 ${nlFoldY} Q 40 ${nlFoldY + 6} 41 ${nlFoldEndY}"/>
            <path d="M 58 ${nlFoldY} Q 60 ${nlFoldY + 6} 59 ${nlFoldEndY}"/>
        </g>
    `;
}

// --- LAYERS 7 & 9: HAIR (back layer behind shoulders, front cap) -------------
// Every shape below is generated from the face's own {top, hw} profile
// rather than a fixed path, so hair actually matches the skull it's drawn
// on instead of assuming one width for every face shape.
//
// Each fill is a diagonal gradient (built in buildSvg via hairPaint.url)
// rather than a flat hex so the cap/cascade reads as rounded volume, and
// every shape layers thin darker strand strokes + one light rim-highlight
// on top so it reads as combed strands rather than a solid blob.

function domePeak(top) {
    return top - 12;
}

function domeCapPath(hw, top, domeBaseY) {
    const peak = domePeak(top);
    const innerTop = peak + 6;
    const innerSide = peak + 14;
    return `M ${50 - hw} ${domeBaseY} Q 50 ${peak} ${50 + hw} ${domeBaseY} Q ${50 + hw - 2} ${innerSide} 50 ${innerTop} Q ${50 - hw + 2} ${innerSide} ${50 - hw} ${domeBaseY} Z`;
}

// Y-coordinate of the dome's own outer curve at a given x — lets decorative
// bits (spikes, a side flip) attach to the actual silhouette instead of
// floating at a fixed height that only happened to line up for one hw.
function domeOuterY(x, hw, top, domeBaseY) {
    const peak = domePeak(top);
    const t = (x - (50 - hw)) / (2 * hw);
    return domeBaseY - 2 * (domeBaseY - peak) * t * (1 - t);
}

// Fine strand lines following the dome's own curvature, fanning out from
// the crown — reads as combed hair instead of a flat cap.
// 10 strands (up from 6) with slightly varied curvature to avoid the
// "evenly-spaced ruled lines" look.
function domeStrandPaths(hw, top, domeBaseY) {
    return [-0.78, -0.58, -0.38, -0.2, -0.04, 0.1, 0.26, 0.44, 0.6, 0.76].map((f, i) => {
        const x = 50 + f * hw;
        const yTop = domeOuterY(x, hw, top, domeBaseY) + 2.5;
        const yBot = domeBaseY - 1.5;
        // Alternate bend direction slightly for organic feel
        const bend = f * 3 + (i % 2 === 0 ? 0.8 : -0.6);
        return `M ${x.toFixed(1)} ${yTop.toFixed(1)} Q ${(x + bend).toFixed(1)} ${((yTop + yBot) / 2).toFixed(1)} ${x.toFixed(1)} ${yBot.toFixed(1)}`;
    });
}

// A single bright streak near the crown, offset toward the upper-left as if
// lit from that side — the cheapest way to make a flat cap read as glossy.
function domeHighlightPath(hw, top) {
    const peak = domePeak(top);
    const x1 = 50 - hw * 0.42, x2 = 50 - hw * 0.05;
    const yMid = peak + (34 - peak) * 0.3;
    return `M ${x1} ${yMid + 4} Q ${(x1 + x2) / 2} ${peak + 3} ${x2} ${yMid - 2}`;
}

function domeTexture(hw, top, hairHex, domeBaseY) {
    const strands = strandGroup(domeStrandPaths(hw, top, domeBaseY), shadeColor(hairHex, -32), 0.4, 0.7);
    const highlight = `<path d="${domeHighlightPath(hw, top)}" fill="none" stroke="${shadeColor(hairHex, 32)}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.5"/>`;
    return strands + highlight;
}

// Tighter, lower dome cap for shortCrop
function cropDomeCapPath(hw, top, domeBaseY) {
    const peak = top - 8;
    const innerTop = top + 2;
    const innerSide = top + 10;
    return `M ${50 - hw} ${domeBaseY - 2} Q 50 ${peak} ${50 + hw} ${domeBaseY - 2} Q ${50 + hw - 2} ${innerSide} 50 ${innerTop} Q ${50 - hw + 2} ${innerSide} ${50 - hw} ${domeBaseY - 2} Z`;
}

// Slicked-back dome cap hugging closer to skull with flatter crown for ponytail/bun
function slickedDomeCapPath(hw, top, domeBaseY) {
    const peak = top - 8;
    const innerTop = top + 3;
    const innerSide = top + 11;
    return `M ${50 - hw} ${domeBaseY} Q 50 ${peak} ${50 + hw} ${domeBaseY} Q ${50 + hw - 1} ${innerSide} 50 ${innerTop} Q ${50 - hw + 1} ${innerSide} ${50 - hw} ${domeBaseY} Z`;
}

// Tension lines radiating towards pull point (e.g. top-back for bun or side-back for ponytail)
function slickedTexture(hw, top, hairHex, targetX, targetY) {
    const dark = shadeColor(hairHex, -30);
    const light = shadeColor(hairHex, 28);
    const peak = top - 8;
    const innerTop = top + 3;
    const lines = [-0.75, -0.5, -0.25, 0.0, 0.25, 0.5, 0.75].map(f => {
        const xStart = 50 + f * (hw - 3);
        const yStart = innerTop + Math.abs(f) * 6;
        return `M ${xStart.toFixed(1)} ${yStart.toFixed(1)} Q ${(xStart * 0.6 + targetX * 0.4).toFixed(1)} ${(yStart * 0.6 + targetY * 0.4).toFixed(1)} ${(xStart * 0.3 + targetX * 0.7).toFixed(1)} ${(yStart * 0.3 + targetY * 0.7).toFixed(1)}`;
    });
    const strands = strandGroup(lines, dark, 0.45, 0.6);
    const highlight = `<path d="M ${50 - hw * 0.35} ${peak + 3} Q 50 ${peak + 1} ${50 + hw * 0.2} ${peak + 4}" fill="none" stroke="${light}" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.4"/>`;
    return strands + highlight;
}

// Per-style side hair hanging past the ears. Replaces the generic
// teardrop 'templeFlap' with shapes that vary by length and style.

// Medium side hair — tucks behind ear, ends mid-cheek, slight inward curve.
function sideHairMedium(edge, sideDrop, dir, domeBaseY) {
    const endY = sideDrop + 6;
    return `M ${edge} ${domeBaseY} Q ${edge + dir * 6} 40 ${edge + dir * 5} ${endY - 4} Q ${edge + dir * 3} ${endY + 2} ${edge + dir * 1} ${endY} Q ${edge - dir * 1} ${endY - 8} ${edge} ${domeBaseY} Z`;
}

// Long straight side hair — hangs flat and close, sleek lines.
function sideHairLong(edge, sideDrop, dir, domeBaseY) {
    const endY = sideDrop + 18;
    return `M ${edge} ${domeBaseY} Q ${edge + dir * 6} 40 ${edge + dir * 5} ${sideDrop} C ${edge + dir * 6} ${sideDrop + 8} ${edge + dir * 4} ${endY - 4} ${edge + dir * 2} ${endY} Q ${edge} ${endY - 3} ${edge + dir * 0.5} ${endY - 8} C ${edge - dir * 1} ${sideDrop + 4} ${edge - dir * 1} 42 ${edge} ${domeBaseY} Z`;
}

// Wavy side hair — gentle S-curves, wider/more voluminous.
function sideHairWavy(edge, sideDrop, dir, domeBaseY) {
    const endY = sideDrop + 14;
    return `M ${edge} ${domeBaseY} Q ${edge + dir * 7} 38 ${edge + dir * 8} ${sideDrop - 4} C ${edge + dir * 4} ${sideDrop + 3} ${edge + dir * 9} ${sideDrop + 8} ${edge + dir * 5} ${endY - 2} Q ${edge + dir * 2} ${endY + 2} ${edge + dir * 1} ${endY} Q ${edge - dir * 1} ${endY - 6} ${edge - dir * 2} ${sideDrop} C ${edge - dir * 1} 44 ${edge} 38 ${edge} ${domeBaseY} Z`;
}

function sideHairStrand(edge, sideDrop, dir, endY, domeBaseY) {
    return `M ${edge + dir * 2} ${domeBaseY + 4} Q ${edge + dir * 5} ${(domeBaseY + endY) / 2} ${edge + dir * 2.5} ${endY - 5}`;
}

// Wispy tapered ends at the bottom of side hair
function sideHairWisps(edge, dir, endY, hairHex) {
    const dark = shadeColor(hairHex, -25);
    return `<g fill="none" stroke="${dark}" stroke-width="0.5" stroke-linecap="round" stroke-opacity="0.35">
        <path d="M ${edge + dir * 3} ${endY - 2} Q ${edge + dir * 4} ${endY + 2} ${edge + dir * 2.5} ${endY + 4}"/>
        <path d="M ${edge + dir * 1.5} ${endY - 1} Q ${edge + dir * 2} ${endY + 3} ${edge + dir * 0.5} ${endY + 3}"/>
    </g>`;
}

// Transition strokes from dome cap to cascade — bridges the gap above the ears
function domeToBackTransition(edge, dir, hairHex, domeBaseY) {
    const dark = shadeColor(hairHex, -25);
    return `<g fill="none" stroke="${dark}" stroke-width="0.6" stroke-linecap="round" stroke-opacity="0.3">
        <path d="M ${edge + dir * 1} ${domeBaseY} Q ${edge + dir * 3} ${domeBaseY + 8} ${edge + dir * 2} ${domeBaseY + 16}"/>
        <path d="M ${edge} ${domeBaseY + 2} Q ${edge + dir * 2} ${domeBaseY + 10} ${edge + dir * 1} ${domeBaseY + 18}"/>
    </g>`;
}

function buzzedCapPath(hw, top, domeBaseY) {
    const w = hw - 2;
    const peak = top - 3;
    const innerTop = top + 1;
    const innerSide = top + 6;
    return `M ${50 - w} ${domeBaseY - 3} Q 50 ${peak} ${50 + w} ${domeBaseY - 3} Q ${50 + w - 2} ${innerSide} 50 ${innerTop} Q ${50 - w + 2} ${innerSide} ${50 - w} ${domeBaseY - 3} Z`;
}

// Scattered stipple dots instead of evenly-spaced ticks — reads as
// cropped stubble instead of stitches on a cap.
function buzzedStipple(hw, top, domeBaseY) {
    const w = hw - 2;
    const peak = top - 3;
    const dots = [];
    // Deterministic scatter across the cap surface
    const positions = [
        [-0.65, 0.7], [-0.45, 0.4], [-0.3, 0.8], [-0.15, 0.3], [-0.5, 0.55],
        [0.0, 0.6], [0.15, 0.35], [0.3, 0.75], [0.45, 0.45], [0.65, 0.65],
        [-0.35, 0.2], [0.1, 0.85], [0.55, 0.3], [-0.55, 0.9], [0.4, 0.15],
        [-0.1, 0.55], [0.25, 0.55], [-0.7, 0.5], [0.7, 0.5], [-0.2, 0.65],
        [0.5, 0.8], [-0.6, 0.3], [0.6, 0.2], [0.0, 0.15]
    ];
    positions.forEach(([fx, fy]) => {
        const x = 50 + fx * w;
        const yTop = peak + 3 + Math.abs(fx) * 5;
        const yBot = domeBaseY - 4;
        const y = yTop + (yBot - yTop) * fy;
        const r = 0.5 + (fy * 0.3);
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`);
    });
    return dots.join('');
}

// Smooth cascade (straight hair) — slight natural curve, not perfectly flat.
function leftCascade(edge, endY) {
    return `M ${edge - 1} 24 C ${edge - 9} 44 ${edge - 8} 72 ${edge - 5} ${endY - 2} Q ${edge - 3} ${endY + 1} ${edge - 1} ${endY} L ${edge + 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge + 2} 26 Z`;
}
function rightCascade(edge, endY) {
    return `M ${edge + 1} 24 C ${edge + 9} 44 ${edge + 8} 72 ${edge + 5} ${endY - 2} Q ${edge + 3} ${endY + 1} ${edge + 1} ${endY} L ${edge - 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge - 2} 26 Z`;
}

// Rippled cascade (wavy) — gentler amplitude (~30% less than before) so
// waves read as natural undulation rather than aggressive zigzag.
function leftCascadeWavy(edge, endY) {
    const y1 = 24 + (endY - 24) * 0.33, y2 = 24 + (endY - 24) * 0.58, y3 = 24 + (endY - 24) * 0.82;
    return `M ${edge - 1} 24 C ${edge - 8} ${y1 - 3} ${edge + 1} ${y1 + 3} ${edge - 7} ${y2 - 4} C ${edge - 12} ${y2 + 3} ${edge + 1} ${y3 - 2} ${edge - 4} ${endY - 1} Q ${edge - 2} ${endY + 1} ${edge - 1} ${endY} L ${edge + 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge + 2} 26 Z`;
}
function rightCascadeWavy(edge, endY) {
    const y1 = 24 + (endY - 24) * 0.33, y2 = 24 + (endY - 24) * 0.58, y3 = 24 + (endY - 24) * 0.82;
    return `M ${edge + 1} 24 C ${edge + 8} ${y1 - 3} ${edge - 1} ${y1 + 3} ${edge + 7} ${y2 - 4} C ${edge + 12} ${y2 + 3} ${edge - 1} ${y3 - 2} ${edge + 4} ${endY - 1} Q ${edge + 2} ${endY + 1} ${edge + 1} ${endY} L ${edge - 2} ${endY - 3} C ${edge} 70 ${edge} 45 ${edge - 2} 26 Z`;
}

// Interior cascade strands — 4 per side (up from 2) with a highlight strand.
function cascadeStrandPaths(edge, endY, dir) {
    return [2, 4.5, 7, 9.5].map(inset => {
        const x1 = edge + dir * (1 - inset * 0.2);
        const cx = edge + dir * (8 - inset * 0.4);
        const x2 = edge + dir * (4 - inset * 0.35);
        return `M ${x1.toFixed(1)} 27 C ${cx.toFixed(1)} 46 ${cx.toFixed(1)} 73 ${x2.toFixed(1)} ${(endY - 5).toFixed(1)}`;
    });
}

function cascadeTexture(leftEdge, rightEdge, endY, hairHex) {
    const dark = shadeColor(hairHex, -30);
    const light = shadeColor(hairHex, 25);
    const paths = cascadeStrandPaths(leftEdge, endY, -1).concat(cascadeStrandPaths(rightEdge, endY, 1));
    const strands = strandGroup(paths, dark, 0.4, 0.7);
    // Highlight strand on each side for glossy volume
    const highlightPaths = [
        `M ${leftEdge - 3} 30 Q ${leftEdge - 4} ${(30 + endY) / 2} ${leftEdge - 2} ${endY - 8}`,
        `M ${rightEdge + 3} 30 Q ${rightEdge + 4} ${(30 + endY) / 2} ${rightEdge + 2} ${endY - 8}`
    ];
    const highlights = strandGroup(highlightPaths, light, 0.8, 0.4);
    // Tapered wispy ends
    const wisps = `<g fill="none" stroke="${dark}" stroke-width="0.4" stroke-linecap="round" stroke-opacity="0.3">
        <path d="M ${leftEdge - 4} ${endY - 1} Q ${leftEdge - 5} ${endY + 3} ${leftEdge - 3} ${endY + 4}"/>
        <path d="M ${leftEdge - 2} ${endY} Q ${leftEdge - 1} ${endY + 2} ${leftEdge - 3} ${endY + 3}"/>
        <path d="M ${rightEdge + 4} ${endY - 1} Q ${rightEdge + 5} ${endY + 3} ${rightEdge + 3} ${endY + 4}"/>
        <path d="M ${rightEdge + 2} ${endY} Q ${rightEdge + 1} ${endY + 2} ${rightEdge + 3} ${endY + 3}"/>
    </g>`;
    return strands + highlights + wisps;
}

function hairBack(style, hairPaint, faceShape) {
    if (!AvatarLogic.HAIR_STYLES_WITH_BACK_LAYER.includes(style)) return '';
    const { hw, domeBaseY } = getFaceProfile(faceShape);
    const leftEdge = 50 - hw;
    const rightEdge = 50 + hw;
    const { url: fill, hex } = hairPaint;
    const light = shadeColor(hex, 30);
    const dark = shadeColor(hex, -30);

    switch (style) {
        case 'ponytail': {
            const tailCx = rightEdge + 3;
            const tieY = 30;
            const rot = 10;
            // Gathered hair mass behind the ear leading to the tie
            const gathered = `<path d="M ${rightEdge - 2} 22 Q ${rightEdge + 8} 24 ${tailCx} ${tieY} Q ${rightEdge + 1} ${tieY + 2} ${rightEdge - 4} ${tieY + 4} Q ${rightEdge - 2} 28 ${rightEdge - 2} 22 Z" fill="${fill}" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.3"/>`;
            // Rounded hair tie band with fabric fold shadow
            const tie = `<ellipse cx="${tailCx}" cy="${tieY}" rx="4" ry="2.5" fill="${shadeColor(hex, -40)}" stroke="${OUTLINE}" stroke-width="1"/>
                <path d="M ${tailCx - 2} ${tieY - 1} Q ${tailCx} ${tieY + 1} ${tailCx + 2} ${tieY - 1}" fill="none" stroke="${shadeColor(hex, -55)}" stroke-width="0.6" stroke-opacity="0.4"/>`;
            // Tapered tail — wide at tie, narrowing to tip with natural gravity curve
            const tail = `<path d="M ${tailCx - 5} ${tieY + 2} Q ${tailCx - 6} ${tieY + 20} ${tailCx - 3} ${tieY + 40} Q ${tailCx} ${tieY + 48} ${tailCx + 1} ${tieY + 45} Q ${tailCx + 3} ${tieY + 38} ${tailCx + 4} ${tieY + 20} Q ${tailCx + 5} ${tieY + 4} ${tailCx + 5} ${tieY + 2} Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.2" transform="rotate(${rot} ${tailCx} ${tieY})"/>`;
            // Strand lines along the tail
            const strands = [-3, -1, 1, 3].map(offset => {
                const sx = tailCx + offset * 0.8;
                return `<path d="M ${sx} ${tieY + 3} Q ${sx + offset * 0.3} ${tieY + 22} ${sx - offset * 0.2} ${tieY + 38}" transform="rotate(${rot} ${tailCx} ${tieY})"/>`;
            }).join('');
            // Tip flare — hair tips splay outward
            const tipFlare = `<g fill="none" stroke="${dark}" stroke-width="0.5" stroke-linecap="round" stroke-opacity="0.35" transform="rotate(${rot} ${tailCx} ${tieY})">
                <path d="M ${tailCx - 2} ${tieY + 42} Q ${tailCx - 4} ${tieY + 47} ${tailCx - 5} ${tieY + 50}"/>
                <path d="M ${tailCx} ${tieY + 44} Q ${tailCx} ${tieY + 49} ${tailCx - 1} ${tieY + 51}"/>
                <path d="M ${tailCx + 1} ${tieY + 43} Q ${tailCx + 3} ${tieY + 48} ${tailCx + 2} ${tieY + 50}"/>
            </g>`;
            return `${gathered}${tail}
                <g fill="none" stroke="${dark}" stroke-width="0.6" stroke-linecap="round" stroke-opacity="0.4">${strands}</g>
                <path d="M ${tailCx - 3} ${tieY + 6} Q ${tailCx - 2} ${tieY + 18} ${tailCx - 2} ${tieY + 30}" fill="none" stroke="${light}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.45" transform="rotate(${rot} ${tailCx} ${tieY})"/>
                ${tie}${tipFlare}`;
        }
        case 'bun': {
            // Asymmetric oblong instead of perfect circle
            const bunCx = 50, bunCy = 14;
            const bunPath = `M ${bunCx - 8} ${bunCy + 1} Q ${bunCx - 9} ${bunCy - 5} ${bunCx - 3} ${bunCy - 7} Q ${bunCx + 2} ${bunCy - 9} ${bunCx + 7} ${bunCy - 5} Q ${bunCx + 10} ${bunCy} ${bunCx + 7} ${bunCy + 5} Q ${bunCx + 3} ${bunCy + 8} ${bunCx - 4} ${bunCy + 7} Q ${bunCx - 9} ${bunCy + 5} ${bunCx - 8} ${bunCy + 1} Z`;
            // Concentric spiral strokes for twisted texture
            const spirals = `<g fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.4">
                <path d="M ${bunCx - 4} ${bunCy - 3} Q ${bunCx} ${bunCy - 6} ${bunCx + 4} ${bunCy - 2} Q ${bunCx + 6} ${bunCy + 2} ${bunCx + 2} ${bunCy + 4}"/>
                <path d="M ${bunCx - 2} ${bunCy} Q ${bunCx + 1} ${bunCy - 3} ${bunCx + 3} ${bunCy} Q ${bunCx + 2} ${bunCy + 3} ${bunCx - 1} ${bunCy + 2}"/>
                <path d="M ${bunCx} ${bunCy - 1} Q ${bunCx + 1} ${bunCy} ${bunCx} ${bunCy + 1}"/>
            </g>`;
            // Small visible tie at base
            const tie = `<ellipse cx="${bunCx}" cy="${bunCy + 7}" rx="3" ry="1.5" fill="${shadeColor(hex, -40)}" stroke="${OUTLINE}" stroke-width="0.8"/>`;
            // Escaped wisps hanging from the bun
            const wisps = `<g fill="none" stroke="${dark}" stroke-width="0.5" stroke-linecap="round" stroke-opacity="0.3">
                <path d="M ${bunCx - 5} ${bunCy + 5} Q ${bunCx - 7} ${bunCy + 10} ${bunCx - 6} ${bunCy + 15}"/>
                <path d="M ${bunCx + 4} ${bunCy + 6} Q ${bunCx + 6} ${bunCy + 12} ${bunCx + 5} ${bunCy + 16}"/>
            </g>`;
            return `<path d="${bunPath}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${spirals}
                <path d="M ${bunCx - 5} ${bunCy - 4} Q ${bunCx - 3} ${bunCy - 7} ${bunCx} ${bunCy - 7}" fill="none" stroke="${light}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.5"/>
                ${tie}${wisps}`;
        }
        case 'braids': {
            // Two braided ropes hanging down each side
            const braidWidth = 4;
            function braid(startX, startY, endY, dir) {
                const segments = [];
                const segH = 7;
                const numSegs = Math.floor((endY - startY) / segH);
                // Alternating-side chevron pattern for weave texture
                for (let i = 0; i < numSegs; i++) {
                    const y = startY + i * segH;
                    const xOff = (i % 2 === 0 ? 1 : -1) * 1.5;
                    segments.push(`<path d="M ${startX - braidWidth * 0.5 + xOff} ${y} Q ${startX + xOff * 0.5} ${y + segH * 0.5} ${startX + braidWidth * 0.5 + xOff} ${y + segH}" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.4"/>`);
                    segments.push(`<path d="M ${startX + braidWidth * 0.5 + xOff} ${y} Q ${startX + xOff * 0.5} ${y + segH * 0.5} ${startX - braidWidth * 0.5 + xOff} ${y + segH}" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.4"/>`);
                }
                // Braid silhouette
                const silhouette = `<path d="M ${startX - braidWidth} ${startY} Q ${startX - braidWidth - 1} ${(startY + endY) / 2} ${startX - braidWidth + 1} ${endY} L ${startX + braidWidth - 1} ${endY} Q ${startX + braidWidth + 1} ${(startY + endY) / 2} ${startX + braidWidth} ${startY} Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.2"/>`;
                // Small tie at bottom
                const tie = `<ellipse cx="${startX}" cy="${endY}" rx="3" ry="1.5" fill="${shadeColor(hex, -40)}" stroke="${OUTLINE}" stroke-width="0.8"/>`;
                return silhouette + segments.join('') + tie;
            }
            return braid(leftEdge - 2, domeBaseY - 6, 85, -1) + braid(rightEdge + 2, domeBaseY - 6, 85, 1);
        }
        case 'longWavy':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascadeWavy(leftEdge, 95)}"/>
                <path d="${rightCascadeWavy(rightEdge, 95)}"/>
            </g>${cascadeTexture(leftEdge, rightEdge, 95, hex)}`;
        case 'longStraight':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascade(leftEdge, 95)}"/>
                <path d="${rightCascade(rightEdge, 95)}"/>
            </g>${cascadeTexture(leftEdge, rightEdge, 95, hex)}`;
        case 'shoulderWave':
        default:
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${leftCascadeWavy(leftEdge, 85)}"/>
                <path d="${rightCascadeWavy(rightEdge, 85)}"/>
            </g>${cascadeTexture(leftEdge, rightEdge, 85, hex)}`;
    }
}

function hairFront(style, hairPaint, faceShape) {
    const { top, hw, sideDrop, domeBaseY } = getFaceProfile(faceShape);
    const dy = top - 16; // shifts decorative top details to match a taller/shorter crown
    const { url: fill, hex } = hairPaint;
    const light = shadeColor(hex, 30);
    const dark = shadeColor(hex, -32);
    const lEdge = 50 - hw;
    const rEdge = 50 + hw;

    switch (style) {
        case 'bald':
            return '';

        case 'buzzed':
            return `<path d="${buzzedCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.1"/>
                <g fill="${dark}" opacity="0.55">${buzzedStipple(hw, top, domeBaseY)}</g>`;

        case 'shortCrop':
            return `<path d="${cropDomeCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${domeTexture(hw, top, hex, domeBaseY)}`;

        case 'shortSidePart': {
            const partX = 50 - hw * 0.4;
            const partY = domeOuterY(partX, hw, top, domeBaseY) + 1;
            // Swept wave from left part line over across the right side
            const sweepPath = `M ${partX} ${partY} C ${partX + 4} ${partY - 8} ${50 + hw * 0.2} ${partY - 10} ${50 + hw * 0.65} ${partY - 2} C ${50 + hw * 0.85} ${partY + 4} ${50 + hw * 0.6} ${partY + 8} ${50 + hw * 0.4} ${partY + 4} C ${50 + hw * 0.1} ${partY + 2} ${partX + 8} ${partY + 3} ${partX} ${partY} Z`;
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sweepPath}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <path d="M ${partX} ${partY} L ${partX - 0.5} ${partY - 5}" fill="none" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.6"/>
            <path d="M ${partX + 5} ${partY - 4} Q ${50} ${partY - 6} ${50 + hw * 0.45} ${partY}" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.5"/>
            <path d="M ${partX + 8} ${partY - 6} Q ${50 + hw * 0.1} ${partY - 8} ${50 + hw * 0.4} ${partY - 3}" fill="none" stroke="${light}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.55"/>`;
        }

        case 'pixieSpiky': {
            const tuftSpecs = [
                { f: -0.75, h: 7, lean: -3, w: 5 },
                { f: -0.5,  h: 9, lean: -2, w: 6 },
                { f: -0.22, h: 12, lean: -1, w: 6 },
                { f: 0.05,  h: 13, lean: 1, w: 6.5 },
                { f: 0.32,  h: 11, lean: 2.5, w: 6 },
                { f: 0.58,  h: 9, lean: 3, w: 5.5 },
                { f: 0.78,  h: 7, lean: 3.5, w: 4.5 }
            ];
            const tufts = tuftSpecs.map(t => {
                const baseX = 50 + t.f * hw;
                const baseY = domeOuterY(baseX, hw, top, domeBaseY);
                const tipX = baseX + t.lean;
                const tipY = baseY - t.h;
                return `<path d="M ${(baseX - t.w * 0.5).toFixed(1)} ${(baseY + 2).toFixed(1)} Q ${(baseX - t.w * 0.2 + t.lean * 0.3).toFixed(1)} ${((baseY + tipY) * 0.5).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${(baseX + t.w * 0.2 + t.lean * 0.7).toFixed(1)} ${((baseY + tipY) * 0.5).toFixed(1)} ${(baseX + t.w * 0.5).toFixed(1)} ${(baseY + 2).toFixed(1)} Z"/>`;
            }).join('');
            const tuftHighlights = tuftSpecs.map(t => {
                const baseX = 50 + t.f * hw;
                const baseY = domeOuterY(baseX, hw, top, domeBaseY);
                const tipX = baseX + t.lean;
                const tipY = baseY - t.h;
                return `<path d="M ${(baseX - 1).toFixed(1)} ${(baseY).toFixed(1)} Q ${(baseX + t.lean * 0.4).toFixed(1)} ${((baseY + tipY) * 0.5).toFixed(1)} ${(tipX - 0.3).toFixed(1)} ${(tipY + 1.5).toFixed(1)}"/>`;
            }).join('');
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                ${tufts}
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <g fill="none" stroke="${light}" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.55">${tuftHighlights}</g>`;
        }

        case 'curly': {
            // Curled lobes framing crown and temples
            const curlLobes = [
                { f: -0.9, y: 32, rx: 7, ry: 7.5 },
                { f: -0.65, y: 22, rx: 8, ry: 8 },
                { f: -0.32, y: 13, rx: 9, ry: 8.5 },
                { f: 0.05, y: 9, rx: 9.5, ry: 9 },
                { f: 0.42, y: 14, rx: 9, ry: 8.5 },
                { f: 0.72, y: 23, rx: 8, ry: 8 },
                { f: 0.92, y: 33, rx: 7, ry: 7.5 },
                { f: -0.5, y: 35, rx: 6, ry: 6.5 },
                { f: 0.55, y: 35, rx: 6, ry: 6.5 }
            ];
            const lobesSvg = curlLobes.map(c => {
                const cx = 50 + c.f * hw, cy = c.y + dy;
                return `<path d="M ${(cx - c.rx).toFixed(1)} ${cy.toFixed(1)} C ${(cx - c.rx).toFixed(1)} ${(cy - c.ry * 1.2).toFixed(1)} ${(cx + c.rx).toFixed(1)} ${(cy - c.ry * 1.2).toFixed(1)} ${(cx + c.rx).toFixed(1)} ${cy.toFixed(1)} C ${(cx + c.rx).toFixed(1)} ${(cy + c.ry * 1.1).toFixed(1)} ${(cx - c.rx).toFixed(1)} ${(cy + c.ry * 1.1).toFixed(1)} ${(cx - c.rx).toFixed(1)} ${cy.toFixed(1)} Z"/>`;
            }).join('');
            const coils = curlLobes.map(c => {
                const cx = 50 + c.f * hw, cy = c.y + dy;
                return `<path d="M ${(cx - c.rx * 0.5).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy - c.ry * 0.7).toFixed(1)} ${(cx + c.rx * 0.4).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy + c.ry * 0.6).toFixed(1)} ${(cx - c.rx * 0.2).toFixed(1)} ${(cy + 1).toFixed(1)}"/>`;
            }).join('');
            const curlHighlights = curlLobes.slice(1, 6).map(c => {
                const cx = 50 + c.f * hw, cy = c.y + dy;
                return `<path d="M ${(cx - c.rx * 0.4).toFixed(1)} ${(cy - c.ry * 0.4).toFixed(1)} Q ${cx.toFixed(1)} ${(cy - c.ry * 0.8).toFixed(1)} ${(cx + c.rx * 0.3).toFixed(1)} ${(cy - c.ry * 0.3).toFixed(1)}"/>`;
            }).join('');
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.4">${lobesSvg}</g>
                <g fill="none" stroke="${dark}" stroke-width="0.7" stroke-linecap="round" stroke-opacity="0.5">${coils}</g>
                <g fill="none" stroke="${light}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.5">${curlHighlights}</g>`;
        }

        case 'ponytail': {
            const tailAnchorX = 50 + hw + 3;
            return `<path d="${slickedDomeCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${slickedTexture(hw, top, hex, tailAnchorX, 30)}`;
        }

        case 'bun':
            return `<path d="${slickedDomeCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${slickedTexture(hw, top, hex, 50, 14)}`;

        case 'mediumStraight':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sideHairMedium(lEdge, sideDrop, -1, domeBaseY)}"/>
                <path d="${sideHairMedium(rEdge, sideDrop, 1, domeBaseY)}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.5">
                <path d="${sideHairStrand(lEdge, sideDrop, -1, sideDrop + 6, domeBaseY)}"/>
                <path d="${sideHairStrand(rEdge, sideDrop, 1, sideDrop + 6, domeBaseY)}"/>
            </g>
            ${sideHairWisps(lEdge, -1, sideDrop + 6, hex)}
            ${sideHairWisps(rEdge, 1, sideDrop + 6, hex)}`;

        case 'shoulderWave':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sideHairWavy(lEdge, sideDrop, -1, domeBaseY)}"/>
                <path d="${sideHairWavy(rEdge, sideDrop, 1, domeBaseY)}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <path d="M 46 ${top - 6} Q 47 ${top + 3} 46 ${top + 6}" fill="none" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.6"/>
            <g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.5">
                <path d="${sideHairStrand(lEdge, sideDrop, -1, sideDrop + 14, domeBaseY)}"/>
                <path d="${sideHairStrand(rEdge, sideDrop, 1, sideDrop + 14, domeBaseY)}"/>
            </g>
            ${sideHairWisps(lEdge, -1, sideDrop + 14, hex)}
            ${sideHairWisps(rEdge, 1, sideDrop + 14, hex)}
            ${domeToBackTransition(lEdge, -1, hex, domeBaseY)}
            ${domeToBackTransition(rEdge, 1, hex, domeBaseY)}`;

        case 'longStraight':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sideHairLong(lEdge, sideDrop, -1, domeBaseY)}"/>
                <path d="${sideHairLong(rEdge, sideDrop, 1, domeBaseY)}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <path d="M 50 ${top - 8} L 50 ${top + 5}" fill="none" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.65"/>
            <g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.5">
                <path d="${sideHairStrand(lEdge, sideDrop, -1, sideDrop + 18, domeBaseY)}"/>
                <path d="${sideHairStrand(rEdge, sideDrop, 1, sideDrop + 18, domeBaseY)}"/>
            </g>
            ${sideHairWisps(lEdge, -1, sideDrop + 18, hex)}
            ${sideHairWisps(rEdge, 1, sideDrop + 18, hex)}
            ${domeToBackTransition(lEdge, -1, hex, domeBaseY)}
            ${domeToBackTransition(rEdge, 1, hex, domeBaseY)}`;

        case 'longWavy':
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sideHairWavy(lEdge, sideDrop, -1, domeBaseY)}"/>
                <path d="${sideHairWavy(rEdge, sideDrop, 1, domeBaseY)}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}
            <path d="M 47 ${top - 6} Q 48 ${top + 3} 47 ${top + 6}" fill="none" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.6"/>
            <g fill="none" stroke="${dark}" stroke-width="0.5" stroke-opacity="0.5">
                <path d="${sideHairStrand(lEdge, sideDrop, -1, sideDrop + 14, domeBaseY)}"/>
                <path d="${sideHairStrand(rEdge, sideDrop, 1, sideDrop + 14, domeBaseY)}"/>
            </g>
            ${sideHairWisps(lEdge, -1, sideDrop + 14, hex)}
            ${sideHairWisps(rEdge, 1, sideDrop + 14, hex)}
            ${domeToBackTransition(lEdge, -1, hex, domeBaseY)}
            ${domeToBackTransition(rEdge, 1, hex, domeBaseY)}`;

        case 'afro': {
            const afroRadius = hw + 14;
            const afroPath = `M ${50 - afroRadius} 42 C ${50 - afroRadius} 15 ${50 - afroRadius * 0.7} 4 50 4 C ${50 + afroRadius * 0.7} 4 ${50 + afroRadius} 15 ${50 + afroRadius} 42 C ${50 + afroRadius} 52 ${50 + hw + 2} 55 ${50 + hw - 1} 44 C ${50 + hw - 2} 32 50 30 ${50 - hw + 1} 44 C ${50 - hw - 2} 55 ${50 - afroRadius} 52 ${50 - afroRadius} 42 Z`;
            const afroRings = [
                `M ${50 - hw * 0.8} 20 Q 50 14 ${50 + hw * 0.8} 20`,
                `M ${50 - hw * 0.6} 28 Q 50 24 ${50 + hw * 0.6} 28`,
                `M ${50 - afroRadius * 0.7} 32 Q ${50 - afroRadius * 0.8} 22 ${50 - hw * 0.5} 16`,
                `M ${50 + afroRadius * 0.7} 32 Q ${50 + afroRadius * 0.8} 22 ${50 + hw * 0.5} 16`
            ];
            const ringSvg = strandGroup(afroRings, dark, 0.7, 0.45);
            const afroHighlight = `<path d="M 40 10 Q 50 7 60 10" fill="none" stroke="${light}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.45"/>`;
            return `<path d="${afroPath}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${ringSvg}
                ${afroHighlight}`;
        }

        case 'mohawk': {
            const crestTop = top - 18;
            const crestPath = `M 43 32 Q 44 20 44 ${crestTop + 6} L 47 ${crestTop} L 50 ${crestTop + 3} L 53 ${crestTop - 2} L 56 ${crestTop + 5} Q 56 20 57 32 Q 50 30 43 32 Z`;
            const crestSpikes = `<g fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.5">
                <path d="M 46 28 L 47 ${crestTop + 3}"/>
                <path d="M 50 26 L 50 ${crestTop + 5}"/>
                <path d="M 54 28 L 53 ${crestTop + 1}"/>
            </g>`;
            const crestHighlight = `<path d="M 48 ${crestTop + 2} L 52 ${crestTop}" fill="none" stroke="${light}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/>`;
            return `<path d="${buzzedCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1"/>
                <g fill="${dark}" opacity="0.4">${buzzedStipple(hw, top, domeBaseY)}</g>
                <path d="${crestPath}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.4"/>
                ${crestSpikes}
                ${crestHighlight}`;
        }

        case 'braids': {
            const cornrows = [-0.65, -0.4, -0.15, 0.15, 0.4, 0.65].map(f => {
                const x = 50 + f * (hw - 4);
                const yStart = domeBaseY - 2;
                const yEnd = top + 2;
                return `<path d="M ${x.toFixed(1)} ${yStart} Q ${(x * 0.8 + 50 * 0.2).toFixed(1)} ${((yStart + yEnd) * 0.5).toFixed(1)} ${(50 + f * 6).toFixed(1)} ${yEnd}"/>`;
            });
            return `<path d="${slickedDomeCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.4"/>
                <g fill="none" stroke="${dark}" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.55">${cornrows.join('')}</g>
                <path d="M ${50 - hw * 0.4} ${top + 4} Q 50 ${top + 1} ${50 + hw * 0.4} ${top + 4}" fill="none" stroke="${light}" stroke-width="0.9" stroke-opacity="0.4"/>`;
        }

        case 'undercut': {
            const partX = 50 - hw * 0.35;
            const sweepTop = top - 11;
            const sweepPath = `M ${partX} 32 C ${partX} ${sweepTop + 2} 50 ${sweepTop} ${50 + hw * 0.7} ${sweepTop + 4} C ${50 + hw + 2} ${sweepTop + 14} ${50 + hw + 1} 48 ${50 + hw * 0.65} 52 C ${50 + hw * 0.3} 50 50 36 ${partX} 32 Z`;
            return `<path d="${buzzedCapPath(hw, top, domeBaseY)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1"/>
                <g fill="${dark}" opacity="0.4">${buzzedStipple(hw, top, domeBaseY)}</g>
                <path d="${sweepPath}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.4"/>
                <g fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.45">
                    <path d="M ${partX + 4} 26 Q 52 ${sweepTop + 3} ${50 + hw * 0.6} 44"/>
                    <path d="M ${partX + 8} 24 Q 55 ${sweepTop + 5} ${50 + hw * 0.7} 48"/>
                </g>
                <path d="M 48 ${sweepTop + 1} Q ${50 + hw * 0.3} ${sweepTop + 2} ${50 + hw * 0.55} ${sweepTop + 6}" fill="none" stroke="${light}" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.55"/>`;
        }

        default:
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top, domeBaseY)}"/>
                <path d="${sideHairMedium(lEdge, sideDrop, -1, domeBaseY)}"/>
                <path d="${sideHairMedium(rEdge, sideDrop, 1, domeBaseY)}"/>
            </g>
            ${domeTexture(hw, top, hex, domeBaseY)}`;
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

// --- LAYER 8.5: BABY & CHILD STAGE RENDERERS ----------------------------------

function babyHeadShape(skinHex) {
    return `
        <g fill="${skinHex}" stroke="${OUTLINE}" stroke-width="2">
            <ellipse cx="18" cy="54" rx="4.5" ry="6.5"/>
            <ellipse cx="82" cy="54" rx="4.5" ry="6.5"/>
            <ellipse cx="50" cy="54" rx="32" ry="34"/>
            <circle cx="30" cy="62" r="8" fill="${skinHex}" opacity="0.3"/>
            <circle cx="70" cy="62" r="8" fill="${skinHex}" opacity="0.3"/>
        </g>
    `;
}

function babyBlush() {
    return `<g fill="#FF99AA" opacity="0.45">
        <ellipse cx="30" cy="62" rx="7" ry="5"/>
        <ellipse cx="70" cy="62" rx="7" ry="5"/>
    </g>`;
}

function babyEyes(eyeHex) {
    return `
        <g>
            <circle cx="36" cy="50" r="7.5" fill="white" stroke="${OUTLINE}" stroke-width="1.3"/>
            <circle cx="36" cy="50" r="4.8" fill="${eyeHex}"/>
            <circle cx="36" cy="50" r="2.2" fill="#1b1b1b"/>
            <circle cx="34.2" cy="48.2" r="1.4" fill="white"/>
        </g>
        <g>
            <circle cx="64" cy="50" r="7.5" fill="white" stroke="${OUTLINE}" stroke-width="1.3"/>
            <circle cx="64" cy="50" r="4.8" fill="${eyeHex}"/>
            <circle cx="64" cy="50" r="2.2" fill="#1b1b1b"/>
            <circle cx="62.2" cy="48.2" r="1.4" fill="white"/>
        </g>
        <path d="M 29 41 Q 36 38 42 41" fill="none" stroke="${OUTLINE}" stroke-width="1.2" opacity="0.5"/>
        <path d="M 58 41 Q 64 38 71 41" fill="none" stroke="${OUTLINE}" stroke-width="1.2" opacity="0.5"/>
    `;
}

function babyMouth() {
    return `
        <ellipse cx="50" cy="58" rx="1.8" ry="1.2" fill="${OUTLINE}" opacity="0.5"/>
        <path d="M 43 67 Q 50 74 57 67" fill="#E8735A" stroke="${OUTLINE}" stroke-width="1.5"/>
    `;
}

function babyHair(hairPaint) {
    const { url: fill, hex } = hairPaint;
    const dark = shadeColor(hex, -25);
    return `
        <g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.4">
            <path d="M 45 22 Q 42 12 50 10 Q 58 12 55 22 Q 50 18 45 22 Z"/>
            <path d="M 48 21 Q 42 24 38 27 Q 45 26 50 22 Z"/>
        </g>
        <path d="M 47 13 Q 50 11 54 13" fill="none" stroke="${dark}" stroke-width="0.8" stroke-opacity="0.6"/>
    `;
}

function childHeadShape(faceShape, skinHex) {
    const ol = skinOutline(skinHex);
    let head;
    switch (faceShape) {
        case 'round':
            head = `<ellipse cx="50" cy="53" rx="31" ry="32"/>`;
            break;
        case 'square':
            head = `<rect x="21" y="21" width="58" height="62" rx="14"/>`;
            break;
        case 'heart':
            head = `<path d="M 50 18 C 66 18 78 31 76 46 C 74 61 63 69 50 85 C 37 69 26 61 24 46 C 22 31 34 18 50 18 Z"/>`;
            break;
        case 'long':
            head = `<ellipse cx="50" cy="54" rx="25" ry="37"/>`;
            break;
        case 'oval':
        default:
            head = `<ellipse cx="50" cy="53" rx="28" ry="33"/>`;
    }
    return `
        <g fill="${skinHex}" stroke="${ol}" stroke-width="2">
            <ellipse cx="18" cy="53" rx="4.8" ry="7.5"/>
            <ellipse cx="82" cy="53" rx="4.8" ry="7.5"/>
            ${head}
        </g>
        <ellipse cx="18" cy="54" rx="2.2" ry="3.5" fill="${shadeColor(skinHex, -25)}" opacity="0.15"/>
        <ellipse cx="82" cy="54" rx="2.2" ry="3.5" fill="${shadeColor(skinHex, -25)}" opacity="0.15"/>
        <ellipse cx="34" cy="48" rx="4" ry="2.5" fill="white" opacity="0.08"/>
        <ellipse cx="66" cy="48" rx="4" ry="2.5" fill="white" opacity="0.08"/>
    `;
}

// --- ASSEMBLY -------------------------------------------------------------------

function resolveHairFeatureColor(appearance, age) {
    return AvatarLogic.getAgedHairColor(appearance.hairColorBase, age, appearance.grayStartAge);
}

function resolveFacialHairColor(appearance, age) {
    const base = appearance.facialHairColor === 'matchHair' ? appearance.hairColorBase : appearance.facialHairColor;
    return AvatarLogic.getAgedHairColor(base, age, appearance.grayStartAge);
}

function buildSvg(appearance, age, idSeed) {
    const stage = AvatarLogic.getAgeStage(age);
    const skinHex = AvatarLogic.SKIN_TONE_HEX[appearance.skinTone] || AvatarLogic.SKIN_TONE_HEX.tone4;
    const eyeHex = AvatarLogic.EYE_COLOR_HEX[appearance.eyeColor] || AvatarLogic.EYE_COLOR_HEX.brown;
    const glassesHex = AvatarLogic.GLASSES_COLOR_HEX[appearance.glassesColor] || AvatarLogic.GLASSES_COLOR_HEX.black;
    const hairHex = resolveHairFeatureColor(appearance, age);
    const outlineHex = skinOutline(skinHex);
    const noseShape = appearance.noseShape || 'small';
    const eyelashStyle = appearance.eyelashStyle || 'none';
    const fs = appearance.faceShape || 'oval';

    // --- Gradient defs (namespaced per-character to avoid SVG ID collisions) ---
    const sid = sanitizeId(idSeed);
    const hairGradId = `hairGrad_${sid}`;
    const skinGradId = `skinGrad_${sid}`;
    const irisGradId = `irisGrad_${sid}`;

    const hairDefs = `<linearGradient id="${hairGradId}" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stop-color="${shadeColor(hairHex, 26)}"/>
        <stop offset="48%" stop-color="${hairHex}"/>
        <stop offset="100%" stop-color="${shadeColor(hairHex, -22)}"/>
    </linearGradient>`;

    // Radial skin gradient: lighter center (forehead/nose bridge highlight)
    // fading to slightly darker edges for 3D roundness.
    const skinDefs = `<radialGradient id="${skinGradId}" cx="45%" cy="38%" r="55%">
        <stop offset="0%" stop-color="${shadeColor(skinHex, 12)}"/>
        <stop offset="70%" stop-color="${skinHex}"/>
        <stop offset="100%" stop-color="${shadeColor(skinHex, -8)}"/>
    </radialGradient>`;

    // Iris radial gradient: darker rim → lighter center for depth
    const irisDefs = `<radialGradient id="${irisGradId}" cx="40%" cy="38%" r="55%">
        <stop offset="0%" stop-color="${shadeColor(eyeHex, 20)}"/>
        <stop offset="65%" stop-color="${eyeHex}"/>
        <stop offset="100%" stop-color="${shadeColor(eyeHex, -25)}"/>
    </radialGradient>`;

    const allDefs = `<defs>${hairDefs}${skinDefs}${irisDefs}</defs>`;
    const hairPaint = { url: `url(#${hairGradId})`, hex: hairHex };
    const skinGradUrl = `url(#${skinGradId})`;
    const irisGradUrl = `url(#${irisGradId})`;

    let layers;

    if (stage === 'baby') {
        layers = [
            allDefs,
            babyHeadShape(skinHex),
            babyBlush(),
            babyEyes(eyeHex),
            babyMouth(),
            babyHair(hairPaint)
        ].join('');
    } else if (stage === 'child') {
        layers = [
            allDefs,
            childHeadShape(fs, skinHex),
            eyebrows(appearance.eyebrowStyle, hairHex, fs),
            eyes(appearance.eyeShape, eyeHex, skinHex, fs, outlineHex, irisGradUrl, eyelashStyle),
            nose(noseShape, skinHex, fs),
            philtrum(skinHex, fs),
            mouth('none', fs, skinHex),
            hairBack(appearance.hairStyle, hairPaint, fs),
            glasses(appearance.glassesStyle, glassesHex),
            hairFront(appearance.hairStyle, hairPaint, fs)
        ].join('');
    } else {
        const facialHairHex = resolveFacialHairColor(appearance, age);
        const wrinkleOpacity = AvatarLogic.getWrinkleOpacity(age);
        layers = [
            allDefs,
            headShape(fs, skinHex, skinGradUrl, outlineHex),
            blush(appearance.blushColor, fs),
            eyebrows(appearance.eyebrowStyle, hairHex, fs),
            eyes(appearance.eyeShape, eyeHex, skinHex, fs, outlineHex, irisGradUrl, eyelashStyle),
            nose(noseShape, skinHex, fs),
            philtrum(skinHex, fs),
            mouth(appearance.lipstickColor, fs, skinHex),
            facialHair(appearance.facialHairStyle, facialHairHex, fs),
            wrinkles(wrinkleOpacity, fs),
            hairBack(appearance.hairStyle, hairPaint, fs),
            glasses(appearance.glassesStyle, glassesHex),
            hairFront(appearance.hairStyle, hairPaint, fs)
        ].join('');
    }

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
    const stage = AvatarLogic.getAgeStage(age);
    const cacheKey = `${character.id || character.name || 'unknown'}::${stage}::${age}::${character.avatarVersion || 0}`;

    const cached = _cache.get(cacheKey);
    if (cached) return cached;

    const svg = buildSvg(appearance, age, cacheKey);
    _cache.set(cacheKey, svg);
    return svg;
}
