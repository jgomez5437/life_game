import { AvatarLogic } from '../core/avatarLogic.js';

// Builds a flat, minimal, layered SVG portrait from a character's stored
// appearance descriptor plus their current age (for hair-graying and
// wrinkle interpolation). Rendered SVG is never stored — only the trait
// descriptor persists (see avatarLogic.js).

const OUTLINE = '#2b2320';
const DARK_LENS = '#141414';

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

// --- LAYER 1B: BLUSH ----------------------------------------------------------
// Drawn directly on the skin, before eyebrows/eyes so it never sits on top
// of those layers — just a soft flush low on each cheek.

function blush(colorKey) {
    if (!colorKey || colorKey === 'none') return '';
    const hex = AvatarLogic.BLUSH_COLOR_HEX[colorKey] || AvatarLogic.BLUSH_COLOR_HEX.pink;
    return `<g fill="${hex}" opacity="0.35">
        <ellipse cx="29" cy="62" rx="7" ry="4.5"/>
        <ellipse cx="71" cy="62" rx="7" ry="4.5"/>
    </g>`;
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

// --- LAYER 4: MOUTH (plain line, or a filled lipstick shape) ------------------

function mouth(lipstickColorKey) {
    if (!lipstickColorKey || lipstickColorKey === 'none') {
        return `<path d="M 42 72 Q 50 78 58 72" fill="none" stroke="${OUTLINE}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    const hex = AvatarLogic.LIPSTICK_COLOR_HEX[lipstickColorKey] || AvatarLogic.LIPSTICK_COLOR_HEX.red;
    const dark = shadeColor(hex, -25);
    // Closed lip shape (cupid's-bow top lip + fuller bottom lip) instead of
    // the plain line, filled with the chosen color, plus a thin seam where
    // the lips meet for definition.
    return `<path d="M 42 72 Q 46 69 50 71 Q 54 69 58 72 Q 54 76.5 50 77.5 Q 46 76.5 42 72 Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
        <path d="M 43 72 Q 50 73.6 57 72" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.6"/>`;
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
//
// Each fill is a diagonal gradient (built in buildSvg via hairPaint.url)
// rather than a flat hex so the cap/cascade reads as rounded volume, and
// every shape layers thin darker strand strokes + one light rim-highlight
// on top so it reads as combed strands rather than a solid blob.

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

// Fine strand lines following the dome's own curvature, fanning out from
// the crown — reads as combed hair instead of a flat cap.
function domeStrandPaths(hw, top) {
    return [-0.62, -0.32, -0.08, 0.16, 0.4, 0.62].map(f => {
        const x = 50 + f * hw;
        const yTop = domeOuterY(x, hw, top) + 2.5;
        const yBot = DOME_BASE_Y - 1.5;
        const bend = f * 3;
        return `M ${x.toFixed(1)} ${yTop.toFixed(1)} Q ${(x + bend).toFixed(1)} ${((yTop + yBot) / 2).toFixed(1)} ${x.toFixed(1)} ${yBot.toFixed(1)}`;
    });
}

// A single bright streak near the crown, offset toward the upper-left as if
// lit from that side — the cheapest way to make a flat cap read as glossy.
function domeHighlightPath(hw, top) {
    const peak = domePeak(top);
    const x1 = 50 - hw * 0.42, x2 = 50 - hw * 0.05;
    const yMid = peak + (DOME_BASE_Y - peak) * 0.3;
    return `M ${x1} ${yMid + 4} Q ${(x1 + x2) / 2} ${peak + 3} ${x2} ${yMid - 2}`;
}

function domeTexture(hw, top, hairHex) {
    const strands = strandGroup(domeStrandPaths(hw, top), shadeColor(hairHex, -32), 0.4, 0.7);
    const highlight = `<path d="${domeHighlightPath(hw, top)}" fill="none" stroke="${shadeColor(hairHex, 32)}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.5"/>`;
    return strands + highlight;
}

// Small tuft hanging from the temple past the ear — added on top of the
// short dome cap to build out medium/long styles without lowering the
// dome's own hairline (which stayed correct for the short styles).
function templeFlap(edge, sideDrop, dir) {
    return `M ${edge} ${DOME_BASE_Y} Q ${edge + dir * 7} 42 ${edge + dir * 3} ${sideDrop} Q ${edge - dir * 3} ${sideDrop - 6} ${edge} ${DOME_BASE_Y} Z`;
}

function templeFlapStrand(edge, sideDrop, dir) {
    return `M ${edge + dir * 2} ${DOME_BASE_Y + 4} Q ${edge + dir * 5} ${(DOME_BASE_Y + sideDrop) / 2} ${edge + dir * 1.5} ${sideDrop - 5}`;
}

function buzzedCapPath(hw, top) {
    const w = hw - 2;
    const peak = top - 4;
    const innerTop = top + 2;
    const innerSide = top + 8;
    return `M ${50 - w} 30 Q 50 ${peak} ${50 + w} 30 Q ${50 + w - 2} ${innerSide} 50 ${innerTop} Q ${50 - w + 2} ${innerSide} ${50 - w} 30 Z`;
}

// Short clipped ticks (not long strands) so a buzz cut reads as cropped
// stubble rather than the same combed texture as the longer styles.
function buzzedStrandPaths(hw, top) {
    const w = hw - 2;
    const peak = top - 4;
    return [-0.68, -0.4, -0.13, 0.13, 0.4, 0.68].map(f => {
        const x = 50 + f * w;
        const t = Math.abs(f) / 0.68;
        const yTop = peak + 3 + t * 5;
        return `M ${x.toFixed(1)} ${yTop.toFixed(1)} L ${x.toFixed(1)} ${(yTop + 3.5).toFixed(1)}`;
    });
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

// Interior strand lines for a cascade — parallel offsets of the same outer
// curve, inset toward center, so long hair shows a few individual locks
// instead of one flat silhouette. Shared by straight and wavy cascades:
// the outer path already carries the straight/wavy distinction, these are
// just depth cues layered on top.
function cascadeStrandPaths(edge, endY, dir) {
    return [3, 6.5].map(inset => {
        const x1 = edge + dir * (1 - inset * 0.3);
        const cx = edge + dir * (8 - inset * 0.6);
        const x2 = edge + dir * (4 - inset * 0.5);
        return `M ${x1.toFixed(1)} 27 C ${cx.toFixed(1)} 46 ${cx.toFixed(1)} 73 ${x2.toFixed(1)} ${(endY - 5).toFixed(1)}`;
    });
}

function cascadeTexture(leftEdge, rightEdge, endY, hairHex) {
    const dark = shadeColor(hairHex, -30);
    const paths = cascadeStrandPaths(leftEdge, endY, -1).concat(cascadeStrandPaths(rightEdge, endY, 1));
    return strandGroup(paths, dark, 0.4, 0.7);
}

function hairBack(style, hairPaint, faceShape) {
    if (!AvatarLogic.HAIR_STYLES_WITH_BACK_LAYER.includes(style)) return '';
    const { hw } = getFaceProfile(faceShape);
    const leftEdge = 50 - hw;
    const rightEdge = 50 + hw;
    const { url: fill, hex } = hairPaint;
    const light = shadeColor(hex, 30);
    const dark = shadeColor(hex, -30);

    switch (style) {
        case 'ponytail': {
            // Tail is anchored close to the hair edge (rightEdge + a small
            // constant) rather than far past it, so it hugs the skull and
            // overlaps the ear — covering it — for every face width instead
            // of floating off to the side on wider/rounder shapes.
            const tailCx = rightEdge + 3;
            const tailCy = 56;
            const rot = 8;
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <rect x="${tailCx - 5}" y="28" width="8" height="6" rx="2"/>
                <ellipse cx="${tailCx}" cy="${tailCy}" rx="7" ry="23" transform="rotate(${rot} ${tailCx} ${tailCy})"/>
            </g>
            <g fill="none" stroke="${dark}" stroke-width="0.7" stroke-linecap="round" stroke-opacity="0.4">
                <path d="M ${tailCx - 2} 35 Q ${tailCx} 55 ${tailCx - 1} 76" transform="rotate(${rot} ${tailCx} ${tailCy})"/>
                <path d="M ${tailCx + 3} 35 Q ${tailCx + 5} 55 ${tailCx + 4} 76" transform="rotate(${rot} ${tailCx} ${tailCy})"/>
            </g>
            <path d="M ${tailCx - 3} 37 Q ${tailCx - 1} 48 ${tailCx - 2} 58" fill="none" stroke="${light}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.5" transform="rotate(${rot} ${tailCx} ${tailCy})"/>`;
        }
        case 'bun':
            return `<circle cx="50" cy="15" r="9" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                <path d="M 45 9 Q 50 6 55 9 Q 52 15 50 21 Q 48 15 45 9 Z" fill="none" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.45"/>
                <path d="M 45 12 Q 47 9 50 8.5" fill="none" stroke="${light}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.55"/>`;
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
    const { top, hw, sideDrop } = getFaceProfile(faceShape);
    const dy = top - 16; // shifts decorative top details to match a taller/shorter crown
    const { url: fill, hex } = hairPaint;
    const light = shadeColor(hex, 30);
    const dark = shadeColor(hex, -32);

    switch (style) {
        case 'bald':
            return '';
        case 'buzzed':
            return `<path d="${buzzedCapPath(hw, top)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${strandGroup(buzzedStrandPaths(hw, top), dark, 0.5, 0.6)}`;
        case 'shortSidePart': {
            const flipX = 50 - hw * 0.35;
            const attachY = domeOuterY(flipX, hw, top);
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                <path d="M ${flipX} ${attachY + 2} L ${flipX + 10} ${attachY - 7} L ${flipX + 14} ${attachY + 3} Z"/>
            </g>
            ${domeTexture(hw, top, hex)}
            <path d="M ${flipX + 2} ${attachY} L ${flipX + 11} ${attachY - 6}" fill="none" stroke="${dark}" stroke-width="0.6" stroke-opacity="0.45"/>`;
        }
        case 'pixieSpiky': {
            const spikeXs = [-0.72, -0.4, 0.4, 0.72].map(f => 50 + f * hw);
            const spikes = spikeXs.map(x => {
                const attachY = domeOuterY(x, hw, top);
                return `<path d="M ${x - 3} ${attachY + 2} L ${x} ${attachY - 9} L ${x + 3} ${attachY + 3} Z"/>`;
            }).join('');
            const spikeHighlights = spikeXs.map(x => {
                const attachY = domeOuterY(x, hw, top);
                return `<path d="M ${x - 1} ${attachY} L ${x - 0.3} ${attachY - 7.5}"/>`;
            }).join('');
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                ${spikes}
            </g>
            ${domeTexture(hw, top, hex)}
            <g fill="none" stroke="${light}" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.55">${spikeHighlights}</g>`;
        }
        case 'curly': {
            const xs = [-0.8, -0.47, 0, 0.47, 0.8, -1.03, 1.03];
            const ys = [30, 17, 11, 17, 30, 42, 42];
            const rs = [7, 8, 9, 8, 7, 6, 6];
            const circles = xs.map((f, i) => `<circle cx="${(50 + f * hw).toFixed(1)}" cy="${(ys[i] + dy).toFixed(1)}" r="${rs[i]}"/>`).join('');
            // Small inner swirl per curl cluster reads as coiled strands
            // instead of plain circles.
            const swirls = xs.map((f, i) => {
                const cx = 50 + f * hw, cy = ys[i] + dy, r = rs[i] * 0.5;
                return `<path d="M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy - r * 1.6).toFixed(1)} ${(cx + r).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy + r * 1.6).toFixed(1)} ${(cx - r).toFixed(1)} ${cy.toFixed(1)}"/>`;
            }).join('');
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">${circles}</g>
                <g fill="none" stroke="${dark}" stroke-width="0.6" stroke-opacity="0.45">${swirls}</g>
                <path d="M ${(50 - hw * 0.3).toFixed(1)} ${(11 + dy - 3).toFixed(1)} Q 50 ${(11 + dy - 6).toFixed(1)} ${(50 + hw * 0.15).toFixed(1)} ${(11 + dy - 2).toFixed(1)}" fill="none" stroke="${light}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.5"/>`;
        }
        case 'ponytail':
        case 'bun':
        case 'shortCrop':
            return `<path d="${domeCapPath(hw, top)}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5"/>
                ${domeTexture(hw, top, hex)}`;
        case 'mediumStraight':
        case 'shoulderWave':
        case 'longStraight':
        case 'longWavy':
        default:
            // Same dome/hairline as the short styles (already correctly clears the
            // eyebrows) plus a temple flap on each side for the extra length.
            return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5">
                <path d="${domeCapPath(hw, top)}"/>
                <path d="${templeFlap(50 - hw, sideDrop, -1)}"/>
                <path d="${templeFlap(50 + hw, sideDrop, 1)}"/>
            </g>
            ${domeTexture(hw, top, hex)}
            ${strandGroup([templeFlapStrand(50 - hw, sideDrop, -1), templeFlapStrand(50 + hw, sideDrop, 1)], dark, 0.4, 0.6)}`;
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
        <g fill="${skinHex}" stroke="${OUTLINE}" stroke-width="2">
            <ellipse cx="18" cy="53" rx="4.8" ry="7.5"/>
            <ellipse cx="82" cy="53" rx="4.8" ry="7.5"/>
            ${head}
        </g>
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

    // Gradient id is namespaced per-character (idSeed) since several avatars
    // can be inlined into the DOM at once and SVG ids are document-global.
    const hairGradId = `hairGrad_${sanitizeId(idSeed)}`;
    const hairDefs = `<linearGradient id="${hairGradId}" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stop-color="${shadeColor(hairHex, 26)}"/>
        <stop offset="48%" stop-color="${hairHex}"/>
        <stop offset="100%" stop-color="${shadeColor(hairHex, -22)}"/>
    </linearGradient>`;
    const hairPaint = { url: `url(#${hairGradId})`, hex: hairHex };

    let layers;

    if (stage === 'baby') {
        layers = [
            `<defs>${hairDefs}</defs>`,
            babyHeadShape(skinHex),
            babyBlush(),
            babyEyes(eyeHex),
            babyMouth(),
            babyHair(hairPaint)
        ].join('');
    } else if (stage === 'child') {
        layers = [
            `<defs>${hairDefs}</defs>`,
            childHeadShape(appearance.faceShape, skinHex),
            eyebrows(appearance.eyebrowStyle, hairHex),
            eyes(appearance.eyeShape, eyeHex, skinHex),
            mouth('none'),
            hairBack(appearance.hairStyle, hairPaint, appearance.faceShape),
            glasses(appearance.glassesStyle, glassesHex),
            hairFront(appearance.hairStyle, hairPaint, appearance.faceShape)
        ].join('');
    } else {
        const facialHairHex = resolveFacialHairColor(appearance, age);
        const wrinkleOpacity = AvatarLogic.getWrinkleOpacity(age);
        layers = [
            `<defs>${hairDefs}</defs>`,
            headShape(appearance.faceShape, skinHex),
            blush(appearance.blushColor),
            eyebrows(appearance.eyebrowStyle, hairHex),
            eyes(appearance.eyeShape, eyeHex, skinHex),
            mouth(appearance.lipstickColor),
            facialHair(appearance.facialHairStyle, facialHairHex),
            wrinkles(wrinkleOpacity),
            hairBack(appearance.hairStyle, hairPaint, appearance.faceShape),
            glasses(appearance.glassesStyle, glassesHex),
            hairFront(appearance.hairStyle, hairPaint, appearance.faceShape)
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
