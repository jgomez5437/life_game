import { AvatarLogic } from '../core/avatarLogic.js';

// Builds a layered SVG portrait from a character's stored appearance
// descriptor plus their current age (for hair-graying and wrinkle
// interpolation). Rendered SVG is never stored — only the trait descriptor
// persists (see avatarLogic.js).

const OUTLINE = '#2b2320';
const DARK_LENS = '#16181d';

// --- COLOR HELPERS -----------------------------------------------------------

// Lightens (positive percent) or darkens (negative) a hex color by shifting
// every channel toward white/black.
function shadeColor(hex, percent) {
    const clean = String(hex || '#888888').replace('#', '');
    const num = parseInt(clean, 16);
    const amt = Math.round(2.55 * percent);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amt);
    const g = clamp(((num >> 8) & 0x00FF) + amt);
    const b = clamp((num & 0x0000FF) + amt);
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// Warm skin-relative outline color.
function skinOutline(skinHex) {
    return shadeColor(skinHex, -48);
}

// Hair-relative outline color so hair reads as cohesive volume rather than a
// black-sticker cutout, while still staying crisp on very dark hair.
function hairOutline(hairHex) {
    return shadeColor(hairHex, -38);
}

// SVG gradient/clipPath ids must be unique document-wide because many avatars
// can be inlined into the DOM at once.
function sanitizeId(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function strandGroup(pathsD, strokeColor, opacity, width) {
    if (!pathsD.length) return '';
    return `<g fill="none" stroke="${strokeColor}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}">${pathsD.map(d => `<path d="${d}"/>`).join('')}</g>`;
}

// Module-scope cache: character id/name + avatarVersion -> SVG string.
const _cache = new Map();

// --- GEOMETRY & HEAD MODEL ---------------------------------------------------
// Unified head model per face shape (plus child scaling) so skull contour,
// ears, hairline, temples, eyes, brows, glasses, facial hair, and wrinkles all
// share exact coordinates.

const ADULT_HEAD_MODELS = {
    oval: {
        top: 18, bottom: 86, hw: 29, jawHw: 21, cy: 51,
        hairlineY: 28.5, templeY: 42, sideDrop: 58,
        eyeY: 50.5, eyeSpacing: 12, browY: 42.5, noseY: 61.5, mouthY: 72, blushY: 60
    },
    round: {
        top: 20, bottom: 84, hw: 32, jawHw: 26, cy: 52,
        hairlineY: 30, templeY: 43, sideDrop: 58,
        eyeY: 50.5, eyeSpacing: 11.5, browY: 42.5, noseY: 61, mouthY: 71, blushY: 59.5
    },
    square: {
        top: 19, bottom: 85, hw: 29.5, jawHw: 26.5, cy: 51,
        hairlineY: 29, templeY: 42, sideDrop: 58,
        eyeY: 50, eyeSpacing: 12.5, browY: 42, noseY: 61, mouthY: 72, blushY: 60
    },
    heart: {
        top: 18, bottom: 86, hw: 29.5, jawHw: 15.5, cy: 50,
        hairlineY: 28.5, templeY: 41, sideDrop: 56,
        eyeY: 49.5, eyeSpacing: 12, browY: 41.5, noseY: 61, mouthY: 72.5, blushY: 59.5
    },
    long: {
        top: 16, bottom: 88, hw: 26, jawHw: 19, cy: 52,
        hairlineY: 27, templeY: 41, sideDrop: 60,
        eyeY: 51, eyeSpacing: 11, browY: 43, noseY: 63, mouthY: 74, blushY: 61.5
    }
};

function getHeadModel(faceShape, isChild = false) {
    const base = ADULT_HEAD_MODELS[faceShape] || ADULT_HEAD_MODELS.oval;
    if (!isChild) return { ...base, shape: faceShape || 'oval', isChild: false };

    // Child proportions: slightly smaller cranium and shorter lower face so
    // features sit a bit lower and rounder, and child hair fits the child head.
    const hw = +(base.hw * 0.91).toFixed(1);
    const jawHw = +(base.jawHw * 0.92).toFixed(1);
    const top = base.top + 2;
    const bottom = base.bottom - 3;
    return {
        shape: faceShape || 'oval',
        isChild: true,
        top,
        bottom,
        hw,
        jawHw,
        cy: base.cy + 1,
        hairlineY: base.hairlineY + 2,
        templeY: base.templeY + 1,
        sideDrop: base.sideDrop - 1,
        eyeY: base.eyeY + 0.5,
        eyeSpacing: +(base.eyeSpacing * 0.94).toFixed(1),
        browY: base.browY + 1,
        noseY: base.noseY,
        mouthY: base.mouthY - 1.5,
        blushY: base.blushY
    };
}

// Builds the closed SVG path for the head silhouette so both the visible head
// and `<clipPath id="headClip_...">` use the exact same contour.
function headPathD(m) {
    const { shape, top, bottom, hw, jawHw, cy } = m;
    const L = 50 - hw;
    const R = 50 + hw;
    const crownK = +(hw * 0.64).toFixed(1);
    const templeTopY = +(top + (cy - top) * 0.36).toFixed(1);

    switch (shape) {
        case 'round':
            return `M 50 ${top} C ${50 + crownK} ${top} ${R} ${templeTopY} ${R} ${cy} C ${R} ${bottom - 11} ${50 + jawHw * 0.85} ${bottom} 50 ${bottom} C ${50 - jawHw * 0.85} ${bottom} ${L} ${bottom - 11} ${L} ${cy} C ${L} ${templeTopY} ${50 - crownK} ${top} 50 ${top} Z`;
        case 'square':
            // Natural rounded cranium on top, strong squared jaw corners below
            return `M 50 ${top} C ${50 + crownK} ${top} ${R} ${templeTopY} ${R} ${cy - 2} C ${R} ${cy + 13} ${R - 0.5} ${bottom - 11} ${50 + jawHw} ${bottom - 5} C ${50 + jawHw - 4} ${bottom} ${50 + 9} ${bottom} 50 ${bottom} C ${50 - 9} ${bottom} ${50 - jawHw + 4} ${bottom} ${50 - jawHw} ${bottom - 5} C ${L + 0.5} ${bottom - 11} ${L} ${cy + 13} ${L} ${cy - 2} C ${L} ${templeTopY} ${50 - crownK} ${top} 50 ${top} Z`;
        case 'heart':
            // Full temples/cheekbones tapering to a soft, narrow rounded chin
            return `M 50 ${top} C ${50 + crownK + 1} ${top} ${R + 0.5} ${templeTopY} ${R} ${cy - 3} C ${R - 0.5} ${cy + 11} ${50 + jawHw + 4} ${bottom - 9} ${50 + 5.5} ${bottom - 1.8} Q 50 ${bottom + 1.2} ${50 - 5.5} ${bottom - 1.8} C ${50 - jawHw - 4} ${bottom - 9} ${L + 0.5} ${cy + 11} ${L} ${cy - 3} C ${L - 0.5} ${templeTopY} ${50 - crownK - 1} ${top} 50 ${top} Z`;
        case 'long':
            return `M 50 ${top} C ${50 + crownK} ${top} ${R} ${templeTopY} ${R} ${cy} C ${R} ${bottom - 14} ${50 + jawHw * 0.9} ${bottom} 50 ${bottom} C ${50 - jawHw * 0.9} ${bottom} ${L} ${bottom - 14} ${L} ${cy} C ${L} ${templeTopY} ${50 - crownK} ${top} 50 ${top} Z`;
        case 'oval':
        default:
            return `M 50 ${top} C ${50 + crownK} ${top} ${R} ${templeTopY} ${R} ${cy - 1} C ${R} ${bottom - 14} ${50 + jawHw * 0.92} ${bottom} 50 ${bottom} C ${50 - jawHw * 0.92} ${bottom} ${L} ${bottom - 14} ${L} ${cy - 1} C ${L} ${templeTopY} ${50 - crownK} ${top} 50 ${top} Z`;
    }
}

// --- LAYER 1: HEAD + EARS ---------------------------------------------------

function headAndEars(m, skinHex, skinGradUrl, outlineHex, headClipId) {
    const ol = outlineHex || skinOutline(skinHex);
    const fill = skinGradUrl || skinHex;
    const earShadow = shadeColor(skinHex, -26);
    const chinShade = shadeColor(skinHex, -28);
    const earY = m.eyeY + 2.5;
    const earRx = m.isChild ? 4.4 : 4.8;
    const earRy = m.isChild ? 6.8 : 7.5;
    const lEarCx = +(50 - m.hw + 0.5).toFixed(1);
    const rEarCx = +(50 + m.hw - 0.5).toFixed(1);
    const hPath = headPathD(m);

    return `
        <!-- Ears tucked at the exact head boundary -->
        <g fill="${fill}" stroke="${ol}" stroke-width="1.8">
            <ellipse cx="${lEarCx}" cy="${earY}" rx="${earRx}" ry="${earRy}"/>
            <ellipse cx="${rEarCx}" cy="${earY}" rx="${earRx}" ry="${earRy}"/>
        </g>
        <g fill="none" stroke="${earShadow}" stroke-width="1.1" stroke-linecap="round" opacity="0.42">
            <path d="M ${(lEarCx + 0.5).toFixed(1)} ${(earY - 3.2).toFixed(1)} Q ${(lEarCx - 2.2).toFixed(1)} ${earY} ${(lEarCx + 0.5).toFixed(1)} ${(earY + 3.2).toFixed(1)}"/>
            <path d="M ${(rEarCx - 0.5).toFixed(1)} ${(earY - 3.2).toFixed(1)} Q ${(rEarCx + 2.2).toFixed(1)} ${earY} ${(rEarCx - 0.5).toFixed(1)} ${(earY + 3.2).toFixed(1)}"/>
        </g>
        <!-- Main head silhouette -->
        <path d="${hPath}" fill="${fill}" stroke="${ol}" stroke-width="2"/>
        <!-- Subtle facial contour shading clipped to head -->
        <g clip-path="url(#${headClipId})">
            <ellipse cx="50" cy="${m.bottom - 2}" rx="${(m.jawHw * 0.85).toFixed(1)}" ry="5.5" fill="${chinShade}" opacity="0.11"/>
            <ellipse cx="${(50 - m.hw * 0.56).toFixed(1)}" cy="${m.eyeY + 6}" rx="5.5" ry="3" fill="white" opacity="0.08"/>
            <ellipse cx="${(50 + m.hw * 0.56).toFixed(1)}" cy="${m.eyeY + 6}" rx="5.5" ry="3" fill="white" opacity="0.08"/>
        </g>
    `;
}

// --- LAYER 1B: BLUSH ---------------------------------------------------------

function blush(colorKey, m, headClipId) {
    if (!colorKey || colorKey === 'none') return '';
    const hex = AvatarLogic.BLUSH_COLOR_HEX[colorKey] || AvatarLogic.BLUSH_COLOR_HEX.pink;
    const blushX = +(m.hw * 0.64).toFixed(1);
    return `<g clip-path="url(#${headClipId})" fill="${hex}" opacity="0.32">
        <ellipse cx="${(50 - blushX).toFixed(1)}" cy="${m.blushY}" rx="6.8" ry="4"/>
        <ellipse cx="${(50 + blushX).toFixed(1)}" cy="${m.blushY}" rx="6.8" ry="4"/>
    </g>`;
}

// --- LAYER 2: EYEBROWS -------------------------------------------------------
// Brows span the full width of each eye (~14 units), with natural anatomical
// taper from inner head (near nose bridge) over the outer arch to the tail.

function eyebrows(style, colorHex, m) {
    const { browY, eyeSpacing } = m;
    const lcx = 50 - eyeSpacing;
    const rcx = 50 + eyeSpacing;
    // Inner end (near nose) and outer tail (near temple)
    const li = lcx + 6.2;
    const lo = lcx - 7.2;
    const ri = rcx - 6.2;
    const ro = rcx + 7.2;
    const archX_L = lcx - 2.2;
    const archX_R = rcx + 2.2;
    const dark = shadeColor(colorHex, -22);

    switch (style) {
        case 'thick': {
            const lPath = `M ${li} ${browY + 0.6} C ${lcx + 2} ${browY - 2.2} ${archX_L} ${browY - 3.0} ${lo} ${browY + 0.8} C ${archX_L} ${browY - 0.1} ${lcx + 2} ${browY + 1.4} ${li} ${browY + 0.6} Z`;
            const rPath = `M ${ri} ${browY + 0.6} C ${rcx - 2} ${browY - 2.2} ${archX_R} ${browY - 3.0} ${ro} ${browY + 0.8} C ${archX_R} ${browY - 0.1} ${rcx - 2} ${browY + 1.4} ${ri} ${browY + 0.6} Z`;
            return `<g fill="${colorHex}" stroke="${dark}" stroke-width="0.4" stroke-linejoin="round">
                <path d="${lPath}"/>
                <path d="${rPath}"/>
            </g>`;
        }
        case 'arched': {
            const lPath = `M ${li} ${browY + 1.1} C ${lcx + 1.5} ${browY - 0.8} ${archX_L + 0.5} ${browY - 3.8} ${lo} ${browY + 1.2} C ${archX_L + 0.5} ${browY - 1.5} ${lcx + 1.5} ${browY + 0.8} ${li} ${browY + 1.1} Z`;
            const rPath = `M ${ri} ${browY + 1.1} C ${rcx - 1.5} ${browY - 0.8} ${archX_R - 0.5} ${browY - 3.8} ${ro} ${browY + 1.2} C ${archX_R - 0.5} ${browY - 1.5} ${rcx - 1.5} ${browY + 0.8} ${ri} ${browY + 1.1} Z`;
            return `<g fill="${colorHex}" stroke="${dark}" stroke-width="0.35" stroke-linejoin="round">
                <path d="${lPath}"/>
                <path d="${rPath}"/>
            </g>`;
        }
        case 'straight': {
            const lPath = `M ${li} ${browY + 0.4} L ${lo} ${browY - 0.3} C ${lo + 2} ${browY + 1.6} ${li - 2} ${browY + 2.0} ${li} ${browY + 0.4} Z`;
            const rPath = `M ${ri} ${browY + 0.4} L ${ro} ${browY - 0.3} C ${ro - 2} ${browY + 1.6} ${ri + 2} ${browY + 2.0} ${ri} ${browY + 0.4} Z`;
            return `<g fill="${colorHex}" stroke="${dark}" stroke-width="0.35" stroke-linejoin="round">
                <path d="${lPath}"/>
                <path d="${rPath}"/>
            </g>`;
        }
        case 'thin':
            return `<g fill="none" stroke="${colorHex}" stroke-width="1.35" stroke-linecap="round">
                <path d="M ${li} ${browY + 0.8} C ${lcx + 1} ${browY - 1.4} ${archX_L} ${browY - 1.8} ${lo} ${browY + 0.8}"/>
                <path d="M ${ri} ${browY + 0.8} C ${rcx - 1} ${browY - 1.4} ${archX_R} ${browY - 1.8} ${ro} ${browY + 0.8}"/>
            </g>`;
        case 'medium':
        default: {
            const lPath = `M ${li} ${browY + 0.7} C ${lcx + 2} ${browY - 1.6} ${archX_L} ${browY - 2.3} ${lo} ${browY + 0.9} C ${archX_L} ${browY - 0.2} ${lcx + 2} ${browY + 1.1} ${li} ${browY + 0.7} Z`;
            const rPath = `M ${ri} ${browY + 0.7} C ${rcx - 2} ${browY - 1.6} ${archX_R} ${browY - 2.3} ${ro} ${browY + 0.9} C ${archX_R} ${browY - 0.2} ${rcx - 2} ${browY + 1.1} ${ri} ${browY + 0.7} Z`;
            return `<g fill="${colorHex}" stroke="${dark}" stroke-width="0.35" stroke-linejoin="round">
                <path d="${lPath}"/>
                <path d="${rPath}"/>
            </g>`;
        }
    }
}

// --- LAYER 3: EYES & PUPILS --------------------------------------------------
// Each eye is built from an exact cubic-Bezier aperture path that also serves
// as a `<clipPath>` for the sclera, iris, pupil, and upper-lid shadow. The
// upper lash line traces the true top edge of that aperture so it never cuts
// through the iris or pupil.

function getEyeGeometry(cx, cy, shape, isLeft) {
    const dir = isLeft ? -1 : 1; // points toward outer temple
    let rx, topLift, botDrop, innerDy, outerDy, irisR, pupilR, irisDy, creaseDy;

    switch (shape) {
        case 'round':
            rx = 6.3;
            topLift = 4.5;
            botDrop = 4.2;
            innerDy = 0.3;
            outerDy = 0.0;
            irisR = 3.45;
            pupilR = 1.55;
            irisDy = -0.15;
            creaseDy = -5.8;
            break;
        case 'hooded':
            rx = 6.7;
            topLift = 2.35;
            botDrop = 3.35;
            innerDy = 0.4;
            outerDy = 0.2;
            irisR = 3.15;
            pupilR = 1.4;
            irisDy = 0.05;
            creaseDy = -4.1;
            break;
        case 'monolid':
            rx = 6.7;
            topLift = 2.55;
            botDrop = 2.45;
            innerDy = 0.55;
            outerDy = -0.55;
            irisR = 2.9;
            pupilR = 1.3;
            irisDy = 0.0;
            creaseDy = null; // monolid has no upper lid crease
            break;
        case 'almond':
        default:
            rx = 6.7;
            topLift = 3.7;
            botDrop = 3.3;
            innerDy = 0.45;
            outerDy = -0.25;
            irisR = 3.25;
            pupilR = 1.45;
            irisDy = -0.15;
            creaseDy = -5.0;
            break;
    }

    const innerX = +(cx - dir * rx).toFixed(2);
    const innerY = +(cy + innerDy).toFixed(2);
    const outerX = +(cx + dir * rx).toFixed(2);
    const outerY = +(cy + outerDy).toFixed(2);

    const topCtrl1X = +(cx - dir * rx * 0.48).toFixed(2);
    const topCtrl2X = +(cx + dir * rx * 0.52).toFixed(2);
    const topCtrlY = +(cy - topLift * 1.28).toFixed(2);

    const botCtrl1X = +(cx + dir * rx * 0.48).toFixed(2);
    const botCtrl2X = +(cx - dir * rx * 0.48).toFixed(2);
    const botCtrlY = +(cy + botDrop * 1.26).toFixed(2);

    const upperCurveD = `M ${innerX} ${innerY} C ${topCtrl1X} ${topCtrlY} ${topCtrl2X} ${topCtrlY} ${outerX} ${outerY}`;
    const openingPathD = `${upperCurveD} C ${botCtrl1X} ${botCtrlY} ${botCtrl2X} ${botCtrlY} ${innerX} ${innerY} Z`;
    const lowerCurveD = `M ${innerX} ${innerY} C ${botCtrl2X} ${botCtrlY} ${botCtrl1X} ${botCtrlY} ${outerX} ${outerY}`;

    return {
        dir, rx, topLift, botDrop, innerX, innerY, outerX, outerY,
        topCtrl1X, topCtrl2X, topCtrlY,
        upperCurveD, lowerCurveD, openingPathD,
        irisCx: cx, irisCy: +(cy + irisDy).toFixed(2), irisR, pupilR, creaseDy
    };
}

// Eyelashes sweep outward and upward from the outer upper lash line, never
// crossing inward over the iris.
function eyelashes(geom, style) {
    if (!style || style === 'none') return '';
    const { dir, outerX, outerY, rx, topLift, irisCx } = geom;
    const cy = Math.round(outerY);
    const b1x = outerX;
    const b1y = outerY;
    const b2x = +(irisCx + dir * rx * 0.76).toFixed(1);
    const b2y = +(outerY - topLift * 0.52).toFixed(1);
    const b3x = +(irisCx + dir * rx * 0.48).toFixed(1);
    const b3y = +(outerY - topLift * 0.85).toFixed(1);

    switch (style) {
        case 'subtle':
            return `<g fill="none" stroke="#1d1816" stroke-width="1.0" stroke-linecap="round">
                <path d="M ${b1x} ${b1y} Q ${(b1x + dir * 1.6).toFixed(1)} ${(b1y - 0.6).toFixed(1)} ${(b1x + dir * 2.8).toFixed(1)} ${(b1y - 2.0).toFixed(1)}"/>
                <path d="M ${b2x} ${b2y} Q ${(b2x + dir * 1.2).toFixed(1)} ${(b2y - 1.0).toFixed(1)} ${(b2x + dir * 2.2).toFixed(1)} ${(b2y - 2.3).toFixed(1)}"/>
            </g>`;
        case 'full':
            return `<g fill="none" stroke="#1d1816" stroke-width="1.15" stroke-linecap="round">
                <path d="M ${b1x} ${b1y} Q ${(b1x + dir * 2.0).toFixed(1)} ${(b1y - 0.5).toFixed(1)} ${(b1x + dir * 3.4).toFixed(1)} ${(b1y - 2.2).toFixed(1)}"/>
                <path d="M ${b2x} ${b2y} Q ${(b2x + dir * 1.6).toFixed(1)} ${(b2y - 1.2).toFixed(1)} ${(b2x + dir * 2.8).toFixed(1)} ${(b2y - 2.8).toFixed(1)}"/>
                <path d="M ${b3x} ${b3y} Q ${(b3x + dir * 1.0).toFixed(1)} ${(b3y - 1.2).toFixed(1)} ${(b3x + dir * 2.0).toFixed(1)} ${(b3y - 2.6).toFixed(1)}"/>
            </g>`;
        case 'dramatic':
            return `<g fill="none" stroke="#181311" stroke-width="1.3" stroke-linecap="round">
                <path d="M ${b1x} ${b1y} Q ${(b1x + dir * 2.4).toFixed(1)} ${(b1y - 0.4).toFixed(1)} ${(b1x + dir * 4.2).toFixed(1)} ${(b1y - 2.5).toFixed(1)}"/>
                <path d="M ${b2x} ${b2y} Q ${(b2x + dir * 1.9).toFixed(1)} ${(b2y - 1.3).toFixed(1)} ${(b2x + dir * 3.5).toFixed(1)} ${(b2y - 3.3).toFixed(1)}"/>
                <path d="M ${b3x} ${b3y} Q ${(b3x + dir * 1.3).toFixed(1)} ${(b3y - 1.4).toFixed(1)} ${(b3x + dir * 2.5).toFixed(1)} ${(b3y - 3.1).toFixed(1)}"/>
            </g>`;
        default:
            return '';
    }
}

function oneEye(cx, cy, shape, colorHex, outlineHex, irisGradUrl, eyelashStyle, isLeft, clipId) {
    const ol = outlineHex || OUTLINE;
    const lashStroke = shadeColor(ol, -22);
    const irisFill = irisGradUrl || colorHex;
    const limbalStroke = shadeColor(colorHex, -35);
    const geom = getEyeGeometry(cx, cy, shape, isLeft);
    const {
        dir, rx, topLift, botDrop,
        upperCurveD, lowerCurveD, openingPathD,
        irisCx, irisCy, irisR, pupilR, creaseDy
    } = geom;

    // Eyelid crease above upper lash line (omitted for monolid)
    let creaseSvg = '';
    if (creaseDy !== null) {
        const cInX = +(cx - dir * rx * 0.78).toFixed(1);
        const cOutX = +(cx + dir * rx * 0.86).toFixed(1);
        const cEndY = +(cy + creaseDy * 0.48).toFixed(1);
        const cPeakY = +(cy + creaseDy * 1.15).toFixed(1);
        const creaseOp = shape === 'hooded' ? '0.42' : '0.26';
        const creaseW = shape === 'hooded' ? '0.95' : '0.7';
        creaseSvg = `<path d="M ${cInX} ${cEndY} Q ${cx} ${cPeakY} ${cOutX} ${(cEndY - 0.4).toFixed(1)}" fill="none" stroke="${ol}" stroke-width="${creaseW}" stroke-linecap="round" stroke-opacity="${creaseOp}"/>`;
    }

    // Subtle lower lid hint
    const lowerHintY = +(cy + botDrop + 1.1).toFixed(1);
    const lowerHint = `<path d="M ${(cx - rx * 0.55).toFixed(1)} ${(cy + botDrop * 0.75).toFixed(1)} Q ${cx} ${lowerHintY} ${(cx + rx * 0.55).toFixed(1)} ${(cy + botDrop * 0.75).toFixed(1)}" fill="none" stroke="${ol}" stroke-width="0.55" stroke-linecap="round" stroke-opacity="0.18"/>`;

    // Upper-lid cast shadow inside the clipped eyeball so the eye has 3D depth
    const shadowBandY = +(cy - topLift + 1.1).toFixed(1);

    return `<g>
        <clipPath id="${clipId}"><path d="${openingPathD}"/></clipPath>
        <g clip-path="url(#${clipId})">
            <path d="${openingPathD}" fill="#FAF8F6"/>
            <circle cx="${irisCx}" cy="${irisCy}" r="${irisR}" fill="${irisFill}" stroke="${limbalStroke}" stroke-width="0.45"/>
            <circle cx="${irisCx}" cy="${irisCy}" r="${pupilR}" fill="#151518"/>
            <ellipse cx="${cx}" cy="${shadowBandY}" rx="${rx + 1}" ry="1.8" fill="#1a1210" opacity="0.16"/>
            <circle cx="${(irisCx - 1.05).toFixed(2)}" cy="${(irisCy - 1.0).toFixed(2)}" r="0.82" fill="white" opacity="0.92"/>
            <circle cx="${(irisCx + 0.85).toFixed(2)}" cy="${(irisCy + 0.85).toFixed(2)}" r="0.38" fill="white" opacity="0.65"/>
        </g>
        <path d="${lowerCurveD}" fill="none" stroke="${ol}" stroke-width="0.95" stroke-linecap="round" stroke-opacity="0.65"/>
        <path d="${upperCurveD}" fill="none" stroke="${lashStroke}" stroke-width="1.75" stroke-linecap="round"/>
        ${creaseSvg}
        ${lowerHint}
        ${eyelashes(geom, eyelashStyle)}
    </g>`;
}

function eyes(shape, colorHex, m, outlineHex, irisGradUrl, eyelashStyle, sid) {
    const { eyeY, eyeSpacing } = m;
    const lcx = 50 - eyeSpacing;
    const rcx = 50 + eyeSpacing;
    return oneEye(lcx, eyeY, shape, colorHex, outlineHex, irisGradUrl, eyelashStyle, true, `eyeClipL_${sid}`) +
           oneEye(rcx, eyeY, shape, colorHex, outlineHex, irisGradUrl, eyelashStyle, false, `eyeClipR_${sid}`);
}

// --- LAYER 4: MOUTH ----------------------------------------------------------

function mouth(lipstickColorKey, m, skinHex) {
    const { mouthY } = m;
    if (!lipstickColorKey || lipstickColorKey === 'none') {
        const upperLip = skinHex ? shadeColor(skinHex, -18) : '#c9908a';
        const lowerLip = skinHex ? shadeColor(skinHex, -12) : '#d49c96';
        const lipLine = skinHex ? shadeColor(skinHex, -34) : '#9c6662';
        return `<g>
            <path d="M 42 ${mouthY} Q 46 ${mouthY - 2.2} 50 ${mouthY - 1.1} Q 54 ${mouthY - 2.2} 58 ${mouthY} Q 54 ${mouthY + 1.0} 50 ${mouthY + 0.8} Q 46 ${mouthY + 1.0} 42 ${mouthY} Z" fill="${upperLip}" opacity="0.72"/>
            <path d="M 42.5 ${mouthY} Q 50 ${mouthY + 4.4} 57.5 ${mouthY} Q 50 ${mouthY + 1.0} 42.5 ${mouthY} Z" fill="${lowerLip}" opacity="0.68"/>
            <path d="M 41.8 ${mouthY} Q 46 ${mouthY + 1.0} 50 ${mouthY + 0.7} Q 54 ${mouthY + 1.0} 58.2 ${mouthY}" fill="none" stroke="${lipLine}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.65"/>
            <path d="M 46.5 ${mouthY + 2.6} Q 50 ${mouthY + 3.6} 53.5 ${mouthY + 2.6}" fill="none" stroke="${lipLine}" stroke-width="0.55" stroke-linecap="round" stroke-opacity="0.28"/>
        </g>`;
    }
    const hex = AvatarLogic.LIPSTICK_COLOR_HEX[lipstickColorKey] || AvatarLogic.LIPSTICK_COLOR_HEX.red;
    const dark = shadeColor(hex, -26);
    const light = shadeColor(hex, 22);
    return `<g>
        <path d="M 41.8 ${mouthY} Q 46 ${mouthY - 2.8} 50 ${mouthY - 1.2} Q 54 ${mouthY - 2.8} 58.2 ${mouthY} Q 54.5 ${mouthY + 4.8} 50 ${mouthY + 5.0} Q 45.5 ${mouthY + 4.8} 41.8 ${mouthY} Z" fill="${hex}" stroke="${dark}" stroke-width="0.85" stroke-linejoin="round"/>
        <path d="M 42.3 ${mouthY + 0.1} Q 50 ${mouthY + 1.3} 57.7 ${mouthY + 0.1}" fill="none" stroke="${dark}" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.7"/>
        <ellipse cx="50" cy="${mouthY + 2.5}" rx="3.2" ry="0.9" fill="${light}" opacity="0.35"/>
    </g>`;
}

// --- LAYER 4B: NOSE & PHILTRUM -----------------------------------------------

function nose(noseShape, skinHex, m) {
    const { noseY } = m;
    const shadow = shadeColor(skinHex, -26);
    const softShade = shadeColor(skinHex, -16);
    const tipY = noseY + 2.2;
    const bridgeTop = noseY - 7.5;

    switch (noseShape) {
        case 'medium':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" stroke-linejoin="round" opacity="0.42">
                <path d="M 48.3 ${bridgeTop + 1} Q 47.5 ${noseY - 1} 45.5 ${tipY}" stroke-width="1.05"/>
                <path d="M 45.2 ${tipY} Q 47.5 ${tipY + 1.8} 50 ${tipY + 1.8} Q 52.5 ${tipY + 1.8} 54.8 ${tipY}" stroke-width="1.15"/>
            </g>`;
        case 'button':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="0.4">
                <ellipse cx="50" cy="${tipY - 0.3}" rx="3.4" ry="2.1" fill="${softShade}" fill-opacity="0.22" stroke="none"/>
                <path d="M 46.2 ${tipY + 0.2} Q 50 ${tipY + 2.0} 53.8 ${tipY + 0.2}" stroke-width="1.1"/>
            </g>`;
        case 'pointed':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" stroke-linejoin="round" opacity="0.45">
                <path d="M 48.8 ${bridgeTop} L 46.5 ${tipY}" stroke-width="1.1"/>
                <path d="M 46.2 ${tipY} L 50 ${tipY + 2.1} L 53.8 ${tipY}" stroke-width="1.15"/>
            </g>`;
        case 'wide':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" stroke-linejoin="round" opacity="0.44">
                <path d="M 48.2 ${bridgeTop + 1.5} Q 47 ${noseY} 43.8 ${tipY}" stroke-width="1.05"/>
                <path d="M 43.5 ${tipY - 0.2} Q 45 ${tipY + 1.8} 47 ${tipY + 1.2} Q 50 ${tipY + 2.4} 53 ${tipY + 1.2} Q 55 ${tipY + 1.8} 56.5 ${tipY - 0.2}" stroke-width="1.2"/>
            </g>`;
        case 'aquiline':
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" stroke-linejoin="round" opacity="0.46">
                <path d="M 48.5 ${bridgeTop - 0.5} Q 46.8 ${bridgeTop + 3.5} 47.6 ${noseY - 1} L 46.2 ${tipY}" stroke-width="1.15"/>
                <path d="M 45.8 ${tipY} Q 50 ${tipY + 2.3} 54.2 ${tipY}" stroke-width="1.15"/>
            </g>`;
        case 'small':
        default:
            return `<g fill="none" stroke="${shadow}" stroke-linecap="round" opacity="0.38">
                <path d="M 48.8 ${bridgeTop + 2.5} Q 48.2 ${noseY} 47 ${tipY}" stroke-width="0.95"/>
                <path d="M 46.8 ${tipY} Q 50 ${tipY + 1.6} 53.2 ${tipY}" stroke-width="1.05"/>
            </g>`;
    }
}

function philtrum(skinHex, m) {
    const { noseY, mouthY } = m;
    const shadow = shadeColor(skinHex, -22);
    const top = noseY + 4.2;
    const bot = mouthY - 2.2;
    if (bot <= top) return '';
    return `<g fill="none" stroke="${shadow}" stroke-width="0.65" stroke-linecap="round" opacity="0.16">
        <path d="M 49.1 ${top} Q 48.8 ${(top + bot) / 2} 49.4 ${bot}"/>
        <path d="M 50.9 ${top} Q 51.2 ${(top + bot) / 2} 50.6 ${bot}"/>
    </g>`;
}

// --- LAYER 5: FACIAL HAIR ----------------------------------------------------

function facialHair(style, colorHex, m, headClipId) {
    if (!style || style === 'none') return '';
    const { mouthY, bottom, hw, jawHw } = m;
    const ol = hairOutline(colorHex);
    const dark = shadeColor(colorHex, -25);

    const mustachePath = `M 50 ${mouthY - 2.8} C 46 ${mouthY - 4.2} 41.5 ${mouthY - 2.8} 39.5 ${mouthY - 0.3} C 42.5 ${mouthY + 0.2} 46.5 ${mouthY - 0.8} 50 ${mouthY - 1.4} C 53.5 ${mouthY - 0.8} 57.5 ${mouthY + 0.2} 60.5 ${mouthY - 0.3} C 58.5 ${mouthY - 2.8} 54 ${mouthY - 4.2} 50 ${mouthY - 2.8} Z`;

    switch (style) {
        case 'stubble': {
            // Soft 5-o'clock jaw shadow + fine micro-stipple clipped to head
            const jawZone = `M ${50 - hw} ${mouthY - 4} Q 50 ${mouthY - 1} ${50 + hw} ${mouthY - 4} L ${50 + hw} ${bottom + 4} L ${50 - hw} ${bottom + 4} Z`;
            const dots = [
                [35, mouthY + 2], [38, mouthY + 5], [42, mouthY + 8], [46, mouthY + 10], [50, mouthY + 10.5],
                [54, mouthY + 10], [58, mouthY + 8], [62, mouthY + 5], [65, mouthY + 2],
                [41, mouthY - 1.5], [45, mouthY - 2.2], [55, mouthY - 2.2], [59, mouthY - 1.5],
                [44, mouthY + 5.5], [50, mouthY + 7], [56, mouthY + 5.5]
            ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.45"/>`).join('');
            return `<g clip-path="url(#${headClipId})">
                <path d="${jawZone}" fill="${colorHex}" opacity="0.16"/>
                <g fill="${dark}" opacity="0.42">${dots}</g>
            </g>`;
        }
        case 'mustache':
            return `<path d="${mustachePath}" fill="${colorHex}" stroke="${ol}" stroke-width="0.7" stroke-linejoin="round"/>`;
        case 'shortBeard': {
            const sideX = jawHw + 2.5;
            const topY = mouthY - 4;
            const beardD = `M ${50 - sideX} ${topY} C ${50 - sideX - 0.5} ${mouthY + 6} ${50 - jawHw * 0.85} ${bottom + 0.8} 50 ${bottom + 0.8} C ${50 + jawHw * 0.85} ${bottom + 0.8} ${50 + sideX + 0.5} ${mouthY + 6} ${50 + sideX} ${topY} L ${50 + sideX - 2.2} ${topY + 2} C ${50 + sideX - 3.5} ${mouthY + 5.5} ${50 + 9} ${mouthY + 7.2} 50 ${mouthY + 7.2} C ${50 - 9} ${mouthY + 7.2} ${50 - sideX + 3.5} ${mouthY + 5.5} ${50 - sideX + 2.2} ${topY + 2} Z`;
            return `<g fill="${colorHex}" stroke="${ol}" stroke-width="0.85" stroke-linejoin="round">
                <path d="${beardD}"/>
                <path d="${mustachePath}"/>
            </g>`;
        }
        case 'fullBeard': {
            const sideX = hw - 0.5;
            const topY = mouthY - 14;
            const lowBot = bottom + 3.5;
            const beardD = `M ${50 - sideX} ${topY} C ${50 - sideX - 1.5} ${mouthY + 4} ${50 - jawHw - 2} ${lowBot} 50 ${lowBot} C ${50 + jawHw + 2} ${lowBot} ${50 + sideX + 1.5} ${mouthY + 4} ${50 + sideX} ${topY} L ${50 + sideX - 2.5} ${topY + 4} C ${50 + sideX - 4} ${mouthY + 1} ${50 + 11} ${mouthY + 5.5} 50 ${mouthY + 5.5} C ${50 - 11} ${mouthY + 5.5} ${50 - sideX + 4} ${mouthY + 1} ${50 - sideX + 2.5} ${topY + 4} Z`;
            return `<g fill="${colorHex}" stroke="${ol}" stroke-width="1.0" stroke-linejoin="round">
                <path d="${beardD}"/>
                <path d="${mustachePath}"/>
            </g>`;
        }
        case 'goatee': {
            const chinTop = mouthY + 5.2;
            const chinBot = bottom + 0.6;
            const chinPatch = `M 43.5 ${chinTop} Q 50 ${chinTop + 1.4} 56.5 ${chinTop} C 57.5 ${(chinTop + chinBot) / 2} 55 ${chinBot} 50 ${chinBot} C 45 ${chinBot} 42.5 ${(chinTop + chinBot) / 2} 43.5 ${chinTop} Z`;
            return `<g fill="${colorHex}" stroke="${ol}" stroke-width="0.75" stroke-linejoin="round">
                <path d="${mustachePath}"/>
                <path d="${chinPatch}"/>
            </g>`;
        }
        default:
            return '';
    }
}

// --- LAYER 6: WRINKLES -------------------------------------------------------
// Warm skin-contour wrinkle lines placed below the hairline and clipped to the
// head so they never look like harsh black forehead bars.

function wrinkles(opacity, m, skinHex, headClipId) {
    if (opacity <= 0) return '';
    const { eyeY, eyeSpacing, browY, mouthY, hairlineY } = m;
    const stroke = shadeColor(skinHex, -38);
    const effOp = (opacity * 0.52).toFixed(2);
    const fh1 = +(hairlineY + (browY - hairlineY) * 0.36).toFixed(1);
    const fh2 = +(hairlineY + (browY - hairlineY) * 0.66).toFixed(1);
    const lOuter = 50 - eyeSpacing - 7.5;
    const rOuter = 50 + eyeSpacing + 7.5;

    return `<g clip-path="url(#${headClipId})" fill="none" stroke="${stroke}" stroke-width="0.85" stroke-linecap="round" stroke-opacity="${effOp}">
        <path d="M 38 ${fh1} Q 50 ${fh1 - 1.4} 62 ${fh1}"/>
        <path d="M 40 ${fh2} Q 50 ${fh2 - 1.2} 60 ${fh2}"/>
        <path d="M ${lOuter} ${eyeY - 1.5} L ${lOuter - 3.5} ${eyeY - 2.8}"/>
        <path d="M ${lOuter} ${eyeY + 1.2} L ${lOuter - 3.5} ${eyeY + 2.4}"/>
        <path d="M ${rOuter} ${eyeY - 1.5} L ${rOuter + 3.5} ${eyeY - 2.8}"/>
        <path d="M ${rOuter} ${eyeY + 1.2} L ${rOuter + 3.5} ${eyeY + 2.4}"/>
        <path d="M 41.5 ${mouthY - 4.5} Q 39.5 ${mouthY} 40.5 ${mouthY + 4.5}"/>
        <path d="M 58.5 ${mouthY - 4.5} Q 60.5 ${mouthY} 59.5 ${mouthY + 4.5}"/>
    </g>`;
}

// --- LAYERS 0 & 9: HAIR (BACK SILHOUETTE & FRONT CROWN) ----------------------
// Every hair cap uses cubic-Bezier crown arcs that sit strictly outside the
// head's cranium contour from temple to apex to temple, and all interior
// strands/highlights/part lines are clipped to the hair silhouette so zero
// lines can ever cross onto the forehead.

// Standard full crown cap path with natural hairline and temple sideburns.
function buildCrownCapD(m, opts = {}) {
    const {
        padX = 2.2,
        padTop = 3.5,
        sideDropY = m.templeY + 4,
        templeInX = m.hw - 3.2,
        hairlineMidY = m.hairlineY,
        hairlineDip = 0 // positive dips down (widow's peak / fringe), negative arches up
    } = opts;

    const outHw = m.hw + padX;
    const L = +(50 - outHw).toFixed(1);
    const R = +(50 + outHw).toFixed(1);
    const topY = +(m.top - padTop).toFixed(1);
    const crownK = +(outHw * 0.66).toFixed(1);
    const shoulderY = +(topY + (sideDropY - topY) * 0.34).toFixed(1);

    const inL = +(50 - templeInX).toFixed(1);
    const inR = +(50 + templeInX).toFixed(1);
    const templeCornerY = +(m.hairlineY + 3.5).toFixed(1);
    const midY = +(hairlineMidY + hairlineDip).toFixed(1);

    return `M ${L} ${sideDropY} C ${L} ${shoulderY} ${50 - crownK} ${topY} 50 ${topY} C ${50 + crownK} ${topY} ${R} ${shoulderY} ${R} ${sideDropY} Q ${R - 1.5} ${sideDropY + 1.5} ${inR} ${sideDropY - 1} Q ${inR - 0.5} ${templeCornerY} ${50 + templeInX * 0.68} ${hairlineMidY} Q 50 ${midY} ${50 - templeInX * 0.68} ${hairlineMidY} Q ${inL + 0.5} ${templeCornerY} ${inL} ${sideDropY - 1} Q ${L + 1.5} ${sideDropY + 1.5} ${L} ${sideDropY} Z`;
}

// Clipped helper: renders a hair silhouette path + interior texture clipped to
// that exact silhouette.
function renderClippedHairGroup(silhouetteD, fill, stroke, strokeWidth, interiorSvg, clipId) {
    return `<g>
        <clipPath id="${clipId}"><path d="${silhouetteD}"/></clipPath>
        <path d="${silhouetteD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
        <g clip-path="url(#${clipId})">${interiorSvg}</g>
    </g>`;
}

// Smooth crown highlight band + flow arcs (used inside clipped hair caps)
function crownSheenAndFlow(m, hex, padTop = 3.5, partX = null) {
    const dark = shadeColor(hex, -28);
    const light = shadeColor(hex, 30);
    const topY = m.top - padTop;
    const hlY = topY + 4.5;
    const hw = m.hw;

    const sheen = `<path d="M ${50 - hw * 0.55} ${hlY + 3.5} Q ${50 - hw * 0.15} ${hlY - 1.5} ${50 + hw * 0.38} ${hlY + 1.5}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.32"/>`;

    const flows = [
        `M ${50 - hw * 0.15} ${topY + 1.5} Q ${50 - hw * 0.55} ${topY + 5} ${50 - hw * 0.88} ${m.hairlineY + 5}`,
        `M ${50 + hw * 0.05} ${topY + 1.5} Q ${50 + hw * 0.52} ${topY + 5} ${50 + hw * 0.88} ${m.hairlineY + 5}`,
        `M ${50 - hw * 0.05} ${topY + 2} Q ${50 - hw * 0.32} ${topY + 6} ${50 - hw * 0.55} ${m.hairlineY + 2}`,
        `M ${50 + hw * 0.12} ${topY + 2} Q ${50 + hw * 0.38} ${topY + 6} ${50 + hw * 0.6} ${m.hairlineY + 2}`
    ];
    const partLine = partX !== null
        ? `<path d="M ${partX} ${topY + 1} Q ${partX + 0.8} ${topY + 5} ${partX} ${m.hairlineY + 2}" fill="none" stroke="${dark}" stroke-width="1.0" stroke-linecap="round" stroke-opacity="0.55"/>`
        : '';

    return sheen + strandGroup(flows, dark, 0.38, 0.85) + partLine;
}

// Back-of-head hair layer rendered BEFORE headAndEars so long hair, ponytails,
// buns, braids, and bobs sit naturally behind the head and ears.
function hairBack(style, hairPaint, m, sid) {
    const { url: fill, hex } = hairPaint;
    const ol = hairOutline(hex);
    const dark = shadeColor(hex, -28);
    const light = shadeColor(hex, 28);
    const { top, bottom, hw } = m;
    const clipId = `hairBackClip_${sid}`;

    switch (style) {
        case 'mediumStraight': {
            const outW = hw + 4.2;
            const topY = top - 3.2;
            const crownK = +(outW * 0.66).toFixed(1);
            const endY = bottom - 5;
            const silD = `M 50 ${topY} C ${50 + crownK} ${topY} ${50 + outW} ${top + 10} ${50 + outW} ${top + 28} C ${50 + outW} ${endY - 12} ${50 + outW - 1} ${endY - 3} ${50 + hw - 3} ${endY} L ${50 - hw + 3} ${endY} C ${50 - outW + 1} ${endY - 3} ${50 - outW} ${endY - 12} ${50 - outW} ${top + 28} C ${50 - outW} ${top + 10} ${50 - crownK} ${topY} 50 ${topY} Z`;
            const strands = strandGroup([
                `M ${50 - hw - 1.5} ${top + 22} Q ${50 - hw - 2.8} ${(top + endY) / 2} ${50 - hw + 0.5} ${endY - 2}`,
                `M ${50 + hw + 1.5} ${top + 22} Q ${50 + hw + 2.8} ${(top + endY) / 2} ${50 + hw - 0.5} ${endY - 2}`
            ], dark, 0.4, 0.85);
            return renderClippedHairGroup(silD, fill, ol, 1.5, strands, clipId);
        }

        case 'shoulderWave': {
            const outW = hw + 5.5;
            const topY = top - 3.2;
            const crownK = +(outW * 0.66).toFixed(1);
            const endY = Math.min(93, bottom + 5);
            const y1 = top + 26, y2 = top + 46;
            const silD = `M 50 ${topY} C ${50 + crownK} ${topY} ${50 + outW - 1} ${top + 10} ${50 + outW - 1} ${y1 - 4} C ${50 + outW + 2} ${y1 + 4} ${50 + outW - 2.5} ${y1 + 12} ${50 + outW + 0.5} ${y2} C ${50 + outW + 3} ${endY - 8} ${50 + hw + 2} ${endY} ${50 + hw - 5} ${endY} L ${50 - hw + 5} ${endY} C ${50 - hw - 2} ${endY} ${50 - outW - 3} ${endY - 8} ${50 - outW - 0.5} ${y2} C ${50 - outW + 2.5} ${y1 + 12} ${50 - outW - 2} ${y1 + 4} ${50 - outW + 1} ${y1 - 4} C ${50 - outW + 1} ${top + 10} ${50 - crownK} ${topY} 50 ${topY} Z`;
            const waves = strandGroup([
                `M ${50 - hw - 2} ${top + 22} C ${50 - outW} ${y1 + 2} ${50 - hw - 1} ${y2 - 4} ${50 - hw - 3} ${endY - 3}`,
                `M ${50 - hw} ${top + 26} C ${50 - hw - 3.5} ${y1 + 6} ${50 - hw + 1} ${y2} ${50 - hw} ${endY - 2}`,
                `M ${50 + hw + 2} ${top + 22} C ${50 + outW} ${y1 + 2} ${50 + hw + 1} ${y2 - 4} ${50 + hw + 3} ${endY - 3}`,
                `M ${50 + hw} ${top + 26} C ${50 + hw + 3.5} ${y1 + 6} ${50 + hw - 1} ${y2} ${50 + hw} ${endY - 2}`
            ], dark, 0.4, 0.85);
            return renderClippedHairGroup(silD, fill, ol, 1.5, waves, clipId);
        }

        case 'longStraight': {
            const outW = hw + 5.0;
            const topY = top - 3.2;
            const crownK = +(outW * 0.66).toFixed(1);
            const endY = 96;
            const silD = `M 50 ${topY} C ${50 + crownK} ${topY} ${50 + outW} ${top + 10} ${50 + outW} ${top + 28} C ${50 + outW} 68 ${50 + outW - 0.5} 82 ${50 + outW - 2} ${endY} Q ${50 + hw - 2} ${endY + 1} ${50 + hw - 8} ${endY - 1} L ${50 - hw + 8} ${endY - 1} Q ${50 - hw + 2} ${endY + 1} ${50 - outW + 2} ${endY} C ${50 - outW + 0.5} 82 ${50 - outW} 68 ${50 - outW} ${top + 28} C ${50 - outW} ${top + 10} ${50 - crownK} ${topY} 50 ${topY} Z`;
            const strands = strandGroup([
                `M ${50 - hw - 2.5} ${top + 24} C ${50 - hw - 3.8} 55 ${50 - hw - 3.2} 76 ${50 - hw - 2} ${endY - 2}`,
                `M ${50 - hw - 0.5} ${top + 26} C ${50 - hw - 1.5} 58 ${50 - hw - 1.5} 78 ${50 - hw} ${endY - 2}`,
                `M ${50 + hw + 2.5} ${top + 24} C ${50 + hw + 3.8} 55 ${50 + hw + 3.2} 76 ${50 + hw + 2} ${endY - 2}`,
                `M ${50 + hw + 0.5} ${top + 26} C ${50 + hw + 1.5} 58 ${50 + hw + 1.5} 78 ${50 + hw} ${endY - 2}`
            ], dark, 0.42, 0.85);
            const sheen = strandGroup([
                `M ${50 - hw - 3} 44 L ${50 - hw - 2.5} 78`,
                `M ${50 + hw + 3} 44 L ${50 + hw + 2.5} 78`
            ], light, 0.28, 1.3);
            return renderClippedHairGroup(silD, fill, ol, 1.5, strands + sheen, clipId);
        }

        case 'longWavy': {
            const outW = hw + 5.8;
            const topY = top - 3.2;
            const crownK = +(outW * 0.66).toFixed(1);
            const endY = 96;
            const y1 = 40, y2 = 60, y3 = 78;
            const silD = `M 50 ${topY} C ${50 + crownK} ${topY} ${50 + outW - 1} ${top + 10} ${50 + outW - 1} ${y1 - 8} C ${50 + outW + 2} ${y1 - 2} ${50 + outW - 2.5} ${y1 + 8} ${50 + outW + 0.5} ${y2} C ${50 + outW + 3} ${y2 + 10} ${50 + outW - 2} ${y3} ${50 + outW - 1} ${endY - 1} Q ${50 + hw} ${endY + 1} ${50 + hw - 7} ${endY - 1} L ${50 - hw + 7} ${endY - 1} Q ${50 - hw} ${endY + 1} ${50 - outW + 1} ${endY - 1} C ${50 - outW + 2} ${y3} ${50 - outW - 3} ${y2 + 10} ${50 - outW - 0.5} ${y2} C ${50 - outW + 2.5} ${y1 + 8} ${50 - outW - 2} ${y1 - 2} ${50 - outW + 1} ${y1 - 8} C ${50 - outW + 1} ${top + 10} ${50 - crownK} ${topY} 50 ${topY} Z`;
            const waves = strandGroup([
                `M ${50 - hw - 2} 34 C ${50 - outW} ${y1} ${50 - hw - 1} ${y2 - 4} ${50 - outW + 1} ${y3 - 4} Q ${50 - hw - 2} 88 ${50 - hw - 2} ${endY - 2}`,
                `M ${50 - hw} 38 C ${50 - hw - 3} ${y1 + 4} ${50 - hw + 1} ${y2} ${50 - hw - 2} ${y3} Q ${50 - hw} 88 ${50 - hw} ${endY - 2}`,
                `M ${50 + hw + 2} 34 C ${50 + outW} ${y1} ${50 + hw + 1} ${y2 - 4} ${50 + outW - 1} ${y3 - 4} Q ${50 + hw + 2} 88 ${50 + hw + 2} ${endY - 2}`,
                `M ${50 + hw} 38 C ${50 + hw + 3} ${y1 + 4} ${50 + hw - 1} ${y2} ${50 + hw + 2} ${y3} Q ${50 + hw} 88 ${50 + hw} ${endY - 2}`
            ], dark, 0.42, 0.85);
            return renderClippedHairGroup(silD, fill, ol, 1.5, waves, clipId);
        }

        case 'ponytail': {
            const tieX = +(50 + hw * 0.78).toFixed(1);
            const tieY = +(top + 8).toFixed(1);
            const tailD = `M ${tieX - 2} ${tieY - 2} C ${tieX + 10} ${tieY - 4} ${tieX + 16} ${tieY + 12} ${tieX + 13} ${tieY + 30} C ${tieX + 11} ${tieY + 42} ${tieX + 14} ${tieY + 50} ${tieX + 9} ${tieY + 56} C ${tieX + 4} ${tieY + 52} ${tieX + 3} ${tieY + 40} ${tieX + 3} ${tieY + 26} C ${tieX + 3} ${tieY + 14} ${tieX - 1} ${tieY + 6} ${tieX - 3} ${tieY + 2} Z`;
            const tailStrands = strandGroup([
                `M ${tieX + 2} ${tieY + 1} C ${tieX + 11} ${tieY + 10} ${tieX + 9} ${tieY + 30} ${tieX + 9} ${tieY + 50}`,
                `M ${tieX + 4} ${tieY + 3} C ${tieX + 13} ${tieY + 14} ${tieX + 11} ${tieY + 32} ${tieX + 10} ${tieY + 46}`
            ], dark, 0.42, 0.85);
            const tailSheen = `<path d="M ${tieX + 5} ${tieY + 4} C ${tieX + 12} ${tieY + 12} ${tieX + 11} ${tieY + 24} ${tieX + 9} ${tieY + 34}" fill="none" stroke="${light}" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.35"/>`;
            const band = `<ellipse cx="${tieX + 1}" cy="${tieY + 1}" rx="3.8" ry="2.2" transform="rotate(-28 ${tieX + 1} ${tieY + 1})" fill="${shadeColor(hex, -42)}" stroke="${ol}" stroke-width="0.9"/>`;
            return renderClippedHairGroup(tailD, fill, ol, 1.5, tailStrands + tailSheen, clipId) + band;
        }

        case 'bun': {
            const bunCy = +(top - 5.5).toFixed(1);
            const bunD = `M 39.5 ${bunCy + 1.5} C 39 ${bunCy - 5.5} 44 ${bunCy - 8.5} 50 ${bunCy - 8.5} C 56 ${bunCy - 8.5} 61 ${bunCy - 5.5} 60.5 ${bunCy + 1.5} C 60 ${bunCy + 6} 55.5 ${bunCy + 8} 50 ${bunCy + 8} C 44.5 ${bunCy + 8} 40 ${bunCy + 6} 39.5 ${bunCy + 1.5} Z`;
            const coils = `<g fill="none" stroke="${dark}" stroke-width="0.85" stroke-linecap="round" stroke-opacity="0.42">
                <path d="M 43.5 ${bunCy - 2} Q 50 ${bunCy - 6} 56.5 ${bunCy - 1.5} Q 57.5 ${bunCy + 3} 51 ${bunCy + 4.5}"/>
                <path d="M 46 ${bunCy + 0.5} Q 50 ${bunCy - 2.5} 54 ${bunCy + 0.5} Q 52.5 ${bunCy + 3.2} 48 ${bunCy + 2.5}"/>
            </g>
            <path d="M 44 ${bunCy - 4} Q 50 ${bunCy - 6.8} 55 ${bunCy - 4}" fill="none" stroke="${light}" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.38"/>`;
            const band = `<path d="M 42 ${bunCy + 5.5} Q 50 ${bunCy + 3.5} 58 ${bunCy + 5.5}" fill="none" stroke="${shadeColor(hex, -44)}" stroke-width="2.0" stroke-linecap="round"/>`;
            return renderClippedHairGroup(bunD, fill, ol, 1.5, coils, clipId) + band;
        }

        case 'braids': {
            // Sculpted twin plaits with scalloped segment lobes behind each ear
            function singleBraid(baseX, dir, subId) {
                const startY = top + 16;
                const segCount = 6;
                const segH = 8.5;
                let leftSide = `M ${baseX - 3.6} ${startY}`;
                let rightSide = '';
                const rightPts = [];
                const chevrons = [];

                for (let i = 0; i < segCount; i++) {
                    const y0 = startY + i * segH;
                    const yMid = y0 + segH * 0.5;
                    const y1 = y0 + segH;
                    const taper = 1 - i * 0.075;
                    const w = +(4.6 * taper).toFixed(1);
                    const pinch = +(2.5 * taper).toFixed(1);
                    leftSide += ` Q ${(baseX - w).toFixed(1)} ${yMid.toFixed(1)} ${(baseX - pinch).toFixed(1)} ${y1.toFixed(1)}`;
                    rightPts.unshift({ yMid, y0, w, pinch });
                    chevrons.push(`<path d="M ${(baseX - w * 0.7).toFixed(1)} ${(y0 + 1.5).toFixed(1)} Q ${baseX.toFixed(1)} ${(yMid + 1.2).toFixed(1)} ${(baseX + w * 0.7).toFixed(1)} ${(y0 + 1.5).toFixed(1)}"/>`);
                }

                const endY = startY + segCount * segH;
                const tassel = ` Q ${(baseX - 3.4).toFixed(1)} ${(endY + 5).toFixed(1)} ${baseX.toFixed(1)} ${(endY + 7.5).toFixed(1)} Q ${(baseX + 3.4).toFixed(1)} ${(endY + 5).toFixed(1)} ${(baseX + 1.6).toFixed(1)} ${endY.toFixed(1)}`;

                rightPts.forEach(({ yMid, y0, w, pinch }) => {
                    rightSide += ` Q ${(baseX + w).toFixed(1)} ${yMid.toFixed(1)} ${(baseX + pinch).toFixed(1)} ${y0.toFixed(1)}`;
                });

                const braidD = `${leftSide}${tassel}${rightSide} Z`;
                const inner = `<g fill="none" stroke="${dark}" stroke-width="0.85" stroke-linecap="round" stroke-opacity="0.45">${chevrons.join('')}</g>`;
                const tie = `<ellipse cx="${baseX.toFixed(1)}" cy="${endY.toFixed(1)}" rx="2.8" ry="1.4" fill="${shadeColor(hex, -42)}" stroke="${ol}" stroke-width="0.8"/>`;
                return renderClippedHairGroup(braidD, fill, ol, 1.4, inner, `${clipId}_${subId}`) + tie;
            }
            return singleBraid(50 - hw - 1.0, -1, 'L') + singleBraid(50 + hw + 1.0, 1, 'R');
        }

        case 'curly': {
            // Subtle back cushion of curls behind temples/ears so curls frame the head
            const r = hw + 5.5;
            const backCurls = `M ${50 - r} ${top + 20} C ${50 - r - 4} ${top + 28} ${50 - r - 3} ${top + 42} ${50 - hw + 2} ${top + 46} L ${50 + hw - 2} ${top + 46} C ${50 + r + 3} ${top + 42} ${50 + r + 4} ${top + 28} ${50 + r} ${top + 20} Z`;
            return `<path d="${backCurls}" fill="${fill}" stroke="${ol}" stroke-width="1.4"/>`;
        }

        case 'afro': {
            // Full rounded cloud halo behind the head and ears
            const rx = hw + 13;
            const cy = top + 20;
            const afroBackD = `M 50 ${top - 13} C ${50 + rx * 0.72} ${top - 13} ${50 + rx} ${cy - 14} ${50 + rx} ${cy + 3} C ${50 + rx} ${cy + 16} ${50 + hw + 5} ${cy + 23} ${50 + hw - 2} ${cy + 20} L ${50 - hw + 2} ${cy + 20} C ${50 - hw - 5} ${cy + 23} ${50 - rx} ${cy + 16} ${50 - rx} ${cy + 3} C ${50 - rx} ${cy - 14} ${50 - rx * 0.72} ${top - 13} 50 ${top - 13} Z`;
            return `<path d="${afroBackD}" fill="${fill}" stroke="${ol}" stroke-width="1.6"/>`;
        }

        default:
            return '';
    }
}

// Front hair layer rendered on top of the head/forehead. Every texture stroke
// is inside a `<clipPath>` matching that hairstyle's front silhouette so no
// line can ever stray onto bare forehead skin.
function hairFront(style, hairPaint, m, sid, headClipId) {
    const { url: fill, hex } = hairPaint;
    const ol = hairOutline(hex);
    const dark = shadeColor(hex, -28);
    const light = shadeColor(hex, 30);
    const { top, hw, hairlineY, templeY, sideDrop } = m;
    const clipId = `hairFrontClip_${sid}`;

    switch (style) {
        case 'bald':
            return '';

        case 'buzzed': {
            // Close-cropped scalp silhouette with crisp hairline
            const capD = buildCrownCapD(m, {
                padX: 1.3,
                padTop: 1.8,
                sideDropY: templeY + 2.5,
                templeInX: hw - 2.4,
                hairlineMidY: hairlineY - 0.5,
                hairlineDip: 0.8
            });
            const sheen = `<path d="M ${50 - hw * 0.45} ${top + 3.0} Q 50 ${top} ${50 + hw * 0.45} ${top + 3.0}" fill="none" stroke="${light}" stroke-width="2.0" stroke-linecap="round" stroke-opacity="0.25"/>`;
            return renderClippedHairGroup(capD, fill, ol, 1.3, sheen, clipId);
        }

        case 'shortCrop': {
            // Full textured crop with a softly notched fringe along the forehead
            const outHw = hw + 2.0;
            const L = 50 - outHw, R = 50 + outHw;
            const topY = top - 3.5;
            const crownK = +(outHw * 0.66).toFixed(1);
            const dropY = templeY + 4;
            const inL = 50 - (hw - 3.0), inR = 50 + (hw - 3.0);
            const fy = hairlineY + 1.2;

            const cropD = `M ${L} ${dropY} C ${L} ${topY + 9} ${50 - crownK} ${topY} 50 ${topY} C ${50 + crownK} ${topY} ${R} ${topY + 9} ${R} ${dropY} Q ${R - 1.5} ${dropY + 1} ${inR} ${dropY - 1.5} Q ${inR - 0.5} ${fy + 2} ${50 + hw * 0.48} ${fy + 0.5} L ${50 + hw * 0.38} ${fy - 1.2} Q ${50 + hw * 0.12} ${fy + 1.2} ${50 - hw * 0.08} ${fy + 0.8} L ${50 - hw * 0.16} ${fy - 1.0} Q ${50 - hw * 0.42} ${fy + 1.0} ${inL} ${dropY - 1.5} Q ${L + 1.5} ${dropY + 1} ${L} ${dropY} Z`;
            const interior = crownSheenAndFlow(m, hex, 3.5);
            return renderClippedHairGroup(cropD, fill, ol, 1.5, interior, clipId);
        }

        case 'shortSidePart': {
            // Single cohesive side-parted silhouette with full upper-right shoulder coverage
            const outHw = hw + 2.6;
            const L = 50 - outHw, R = 50 + outHw;
            const topY = top - 4.0;
            const crownK = +(outHw * 0.74).toFixed(1);
            const partX = +(50 - hw * 0.42).toFixed(1);
            const dropY = templeY + 4.5;
            const inL = 50 - (hw - 3.0), inR = 50 + (hw - 3.0);
            const fy = hairlineY + 1.5;

            const sidePartD = `M ${L} ${dropY} C ${L} ${topY + 8} ${partX - 8} ${topY + 1.5} ${partX} ${topY + 2.2} C ${partX + 5} ${topY - 1.4} ${50 - 3} ${topY - 1.0} 50 ${topY - 1.0} C ${50 + crownK} ${topY - 1.0} ${R} ${topY + 7.5} ${R} ${dropY} Q ${R - 1.5} ${dropY + 1} ${inR} ${dropY - 1} C ${inR - 1.5} ${fy + 3.5} ${50 + hw * 0.25} ${fy + 3.2} ${partX + 1.5} ${fy - 2.2} L ${partX} ${fy - 3.8} Q ${partX - 4} ${fy - 0.5} ${inL} ${dropY - 1} Q ${L + 1.5} ${dropY + 1} ${L} ${dropY} Z`;

            const sweeps = strandGroup([
                `M ${partX + 1} ${topY + 3} C ${50} ${topY + 1} ${50 + hw * 0.45} ${topY + 4} ${inR - 1} ${fy + 3}`,
                `M ${partX + 1.5} ${fy - 2} C ${50 - 2} ${fy - 1} ${50 + hw * 0.3} ${fy + 1.5} ${inR - 3} ${fy + 2.5}`,
                `M ${partX - 1} ${topY + 4} Q ${50 - hw * 0.68} ${topY + 8} ${L + 1.5} ${dropY - 2}`
            ], dark, 0.42, 0.85);
            const sheen = `<path d="M ${partX + 5} ${topY + 3.5} Q ${50 + hw * 0.15} ${topY + 1.5} ${50 + hw * 0.52} ${topY + 5.5}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.34"/>`;
            const partStroke = `<path d="M ${partX} ${topY + 2.2} L ${partX + 1.2} ${fy - 2.2}" fill="none" stroke="${dark}" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.6"/>`;

            return renderClippedHairGroup(sidePartD, fill, ol, 1.5, sweeps + sheen + partStroke, clipId);
        }

        case 'pixieSpiky': {
            // Unified tousled/textured spiky crown with soft sculpted locks
            const outHw = hw + 2.2;
            const L = 50 - outHw, R = 50 + outHw;
            const topY = top - 3.0;
            const dropY = templeY + 3.5;
            const inL = 50 - (hw - 3.0), inR = 50 + (hw - 3.0);
            const fy = hairlineY + 0.5;

            const spikyD = `M ${L} ${dropY} C ${L - 1} ${topY + 13} ${50 - hw * 0.88} ${topY + 6} ${50 - hw * 0.72} ${topY + 1} L ${50 - hw * 0.58} ${topY + 4} C ${50 - hw * 0.48} ${topY - 1} ${50 - hw * 0.35} ${topY - 3.5} ${50 - hw * 0.22} ${topY - 5} L ${50 - hw * 0.1} ${topY - 0.5} C ${50 - hw * 0.02} ${topY - 4.5} ${50 + hw * 0.12} ${topY - 6} ${50 + hw * 0.24} ${topY - 6.5} L ${50 + hw * 0.32} ${topY - 1} C ${50 + hw * 0.45} ${topY - 3.5} ${50 + hw * 0.58} ${topY - 4} ${50 + hw * 0.7} ${topY - 3} L ${50 + hw * 0.72} ${topY + 2.5} C ${50 + hw * 0.88} ${topY + 1.5} ${R + 1} ${topY + 8} ${R} ${dropY} Q ${R - 1.5} ${dropY + 1} ${inR} ${dropY - 1.5} Q ${50 + hw * 0.55} ${fy + 1.5} ${50 + hw * 0.25} ${fy + 1.8} L ${50 + hw * 0.15} ${fy - 0.8} Q ${50 - hw * 0.1} ${fy + 1.8} ${50 - hw * 0.32} ${fy + 1.2} L ${50 - hw * 0.4} ${fy - 0.8} Q ${50 - hw * 0.65} ${fy + 1.5} ${inL} ${dropY - 1.5} Q ${L + 1.5} ${dropY + 1} ${L} ${dropY} Z`;

            const tuftLines = strandGroup([
                `M ${50 - hw * 0.42} ${fy - 1} Q ${50 - hw * 0.32} ${topY + 2} ${50 - hw * 0.22} ${topY - 4}`,
                `M ${50 - hw * 0.05} ${fy} Q ${50 + hw * 0.08} ${topY + 1} ${50 + hw * 0.22} ${topY - 5.5}`,
                `M ${50 + hw * 0.3} ${fy} Q ${50 + hw * 0.48} ${topY + 2} ${50 + hw * 0.66} ${topY - 2.5}`
            ], dark, 0.42, 0.85);
            const sheen = `<path d="M ${50 - hw * 0.35} ${topY + 4} Q 50 ${topY + 1} ${50 + hw * 0.4} ${topY + 4}" fill="none" stroke="${light}" stroke-width="2.0" stroke-linecap="round" stroke-opacity="0.3"/>`;

            return renderClippedHairGroup(spikyD, fill, ol, 1.5, tuftLines + sheen, clipId);
        }

        case 'curly': {
            // Solid curly crown base + scalloped curl clouds so zero bald scalp peeks through
            const outHw = hw + 5.0;
            const topY = top - 6.5;
            const fy = hairlineY + 1.0;
            const dropY = templeY + 6;
            const inL = 50 - (hw - 3.5), inR = 50 + (hw - 3.5);

            const curlyD = `M ${50 - outHw} ${dropY} C ${50 - outHw - 3} ${dropY - 6} ${50 - outHw - 2} ${topY + 14} ${50 - outHw + 3} ${topY + 10} C ${50 - outHw + 1} ${topY + 3} ${50 - hw * 0.55} ${topY - 1} ${50 - hw * 0.28} ${topY + 1} C ${50 - hw * 0.12} ${topY - 3} ${50 + hw * 0.12} ${topY - 3} ${50 + hw * 0.28} ${topY + 1} C ${50 + hw * 0.55} ${topY - 1} ${50 + outHw - 1} ${topY + 3} ${50 + outHw - 3} ${topY + 10} C ${50 + outHw + 2} ${topY + 14} ${50 + outHw + 3} ${dropY - 6} ${50 + outHw} ${dropY} C ${50 + outHw - 2} ${dropY + 3} ${inR + 1} ${dropY + 2} ${inR} ${dropY - 2} C ${inR + 1} ${fy + 5} ${50 + hw * 0.55} ${fy + 4} ${50 + hw * 0.32} ${fy + 1} C ${50 + hw * 0.15} ${fy + 3.5} ${50 - hw * 0.15} ${fy + 3.5} ${50 - hw * 0.32} ${fy + 1} C ${50 - hw * 0.55} ${fy + 4} ${inL - 1} ${fy + 5} ${inL} ${dropY - 2} C ${inL - 1} ${dropY + 2} ${50 - outHw + 2} ${dropY + 3} ${50 - outHw} ${dropY} Z`;

            const curlCenters = [
                [-0.68, topY + 14, 4.2], [-0.42, topY + 7, 4.6], [-0.14, topY + 5, 4.8],
                [0.16, topY + 5, 4.8], [0.44, topY + 7, 4.6], [0.68, topY + 14, 4.2],
                [-0.3, fy - 1, 3.6], [0.02, fy - 1.5, 3.8], [0.32, fy - 1, 3.6]
            ];
            const coils = curlCenters.map(([f, cy, r]) => {
                const cx = +(50 + f * hw).toFixed(1);
                return `<path d="M ${(cx - r * 0.65).toFixed(1)} ${cy.toFixed(1)} C ${(cx - r * 0.65).toFixed(1)} ${(cy - r * 0.85).toFixed(1)} ${(cx + r * 0.65).toFixed(1)} ${(cy - r * 0.85).toFixed(1)} ${(cx + r * 0.65).toFixed(1)} ${cy.toFixed(1)} C ${(cx + r * 0.65).toFixed(1)} ${(cy + r * 0.7).toFixed(1)} ${(cx - r * 0.35).toFixed(1)} ${(cy + r * 0.7).toFixed(1)} ${(cx - r * 0.2).toFixed(1)} ${(cy + 0.5).toFixed(1)}"/>`;
            }).join('');
            const highlights = `<path d="M ${50 - hw * 0.45} ${topY + 5} Q 50 ${topY + 2} ${50 + hw * 0.45} ${topY + 5}" fill="none" stroke="${light}" stroke-width="2.0" stroke-linecap="round" stroke-opacity="0.32"/>`;
            const interior = `<g fill="none" stroke="${dark}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.45">${coils}</g>${highlights}`;

            return renderClippedHairGroup(curlyD, fill, ol, 1.5, interior, clipId);
        }

        case 'ponytail':
        case 'bun': {
            // Sleek pulled-back crown cap with clipped tension/sweep lines
            const capD = buildCrownCapD(m, {
                padX: 1.8,
                padTop: 2.8,
                sideDropY: templeY + 3,
                templeInX: hw - 2.6,
                hairlineMidY: hairlineY,
                hairlineDip: 0.6
            });
            const pullX = style === 'ponytail' ? 50 + hw * 0.65 : 50;
            const pullY = style === 'ponytail' ? top + 4 : top - 4;
            const sweepPaths = [-0.72, -0.45, -0.18, 0.12, 0.42, 0.7].map(f => {
                const sx = +(50 + f * (hw - 2)).toFixed(1);
                const sy = +(hairlineY + Math.abs(f) * 5).toFixed(1);
                const mx = +((sx + pullX) * 0.5).toFixed(1);
                const my = +((sy + pullY) * 0.5 - 3).toFixed(1);
                return `M ${sx} ${sy} Q ${mx} ${my} ${pullX.toFixed(1)} ${pullY.toFixed(1)}`;
            });
            const sheen = `<path d="M ${50 - hw * 0.48} ${top + 3.5} Q 50 ${top} ${50 + hw * 0.42} ${top + 3.5}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.32"/>`;
            return renderClippedHairGroup(capD, fill, ol, 1.5, sheen + strandGroup(sweepPaths, dark, 0.38, 0.8), clipId);
        }

        case 'mediumStraight':
        case 'shoulderWave':
        case 'longStraight':
        case 'longWavy': {
            // Two-segment outer dome + temple curtains so the crown is rounded and
            // completely covers the upper cranium and merges with hairBack.
            const isCenterPart = style === 'longStraight';
            const outHw = hw + 3.2;
            const L = 50 - outHw, R = 50 + outHw;
            const topY = top - 3.8;
            const crownK = +(outHw * 0.66).toFixed(1);
            const partX = isCenterPart ? 50 : +(50 - hw * 0.22).toFixed(1);
            const partDipY = hairlineY - 1.5;
            const curtainEndY = style === 'mediumStraight' ? sideDrop + 9 : sideDrop + 6;
            const inL = 50 - (hw - 2.4), inR = 50 + (hw - 2.4);

            const frontD = `M ${L + 1.5} ${curtainEndY} C ${L - 0.5} ${sideDrop} ${L} ${templeY + 4} ${L} ${templeY} C ${L} ${topY + 9} ${50 - crownK} ${topY} 50 ${topY} C ${50 + crownK} ${topY} ${R} ${topY + 9} ${R} ${templeY} C ${R} ${templeY + 4} ${R + 0.5} ${sideDrop} ${R - 1.5} ${curtainEndY} Q ${inR + 0.5} ${curtainEndY - 3} ${inR} ${sideDrop - 6} C ${inR - 0.5} ${hairlineY + 4} ${partX + 7} ${hairlineY + 1.5} ${partX} ${partDipY} C ${partX - 7} ${hairlineY + 1.5} ${inL + 0.5} ${hairlineY + 4} ${inL} ${sideDrop - 6} Q ${inL - 0.5} ${curtainEndY - 3} ${L + 1.5} ${curtainEndY} Z`;

            const flows = [
                `M ${partX} ${topY + 2} C ${partX - 10} ${topY + 6} ${L + 2} ${templeY - 4} ${L + 2} ${curtainEndY - 3}`,
                `M ${partX} ${topY + 2} C ${partX + 12} ${topY + 6} ${R - 2} ${templeY - 4} ${R - 2} ${curtainEndY - 3}`,
                `M ${partX - 2} ${partDipY - 2} Q ${50 - hw * 0.65} ${hairlineY + 2} ${inL - 0.5} ${sideDrop - 8}`,
                `M ${partX + 2} ${partDipY - 2} Q ${50 + hw * 0.65} ${hairlineY + 2} ${inR + 0.5} ${sideDrop - 8}`
            ];
            const partLine = `<path d="M ${partX} ${topY + 0.5} L ${partX} ${partDipY}" fill="none" stroke="${dark}" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.6"/>`;
            const sheen = `<path d="M ${50 - hw * 0.52} ${topY + 6.5} Q ${partX} ${topY + 2.5} ${50 + hw * 0.52} ${topY + 6.5}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.32"/>`;

            return renderClippedHairGroup(frontD, fill, ol, 1.5, sheen + strandGroup(flows, dark, 0.38, 0.85) + partLine, clipId);
        }

        case 'afro': {
            // Rounded, organic front hairline + coil texture clipped inside
            const rx = hw + 13;
            const topY = top - 13;
            const cy = top + 20;
            const inL = 50 - (hw - 2.0), inR = 50 + (hw - 2.0);
            const dropY = templeY + 6;
            const fy = hairlineY - 0.5;

            const afroFrontD = `M ${50 - rx} ${cy + 2} C ${50 - rx} ${cy - 14} ${50 - rx * 0.72} ${topY} 50 ${topY} C ${50 + rx * 0.72} ${topY} ${50 + rx} ${cy - 14} ${50 + rx} ${cy + 2} C ${50 + rx - 1} ${dropY + 6} ${inR + 4} ${dropY + 5} ${inR} ${dropY - 1} C ${inR} ${fy + 4} ${50 + hw * 0.55} ${fy} 50 ${fy} C ${50 - hw * 0.55} ${fy} ${inL} ${fy + 4} ${inL} ${dropY - 1} C ${inL - 4} ${dropY + 5} ${50 - rx + 1} ${dropY + 6} ${50 - rx} ${cy + 2} Z`;

            const coils = [
                `M ${50 - rx * 0.65} ${topY + 12} Q ${50 - rx * 0.35} ${topY + 7} ${50 - rx * 0.15} ${topY + 11}`,
                `M ${50 + rx * 0.15} ${topY + 11} Q ${50 + rx * 0.35} ${topY + 7} ${50 + rx * 0.65} ${topY + 12}`,
                `M ${50 - rx * 0.78} ${topY + 22} Q ${50 - rx * 0.5} ${topY + 17} ${50 - rx * 0.25} ${topY + 21}`,
                `M ${50 + rx * 0.25} ${topY + 21} Q ${50 + rx * 0.5} ${topY + 17} ${50 + rx * 0.78} ${topY + 22}`,
                `M ${50 - hw * 0.35} ${topY + 16} Q 50 ${topY + 12} ${50 + hw * 0.35} ${topY + 16}`
            ];
            const sheen = `<path d="M ${50 - rx * 0.45} ${topY + 5.5} Q 50 ${topY + 2} ${50 + rx * 0.45} ${topY + 5.5}" fill="none" stroke="${light}" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.34"/>`;

            return renderClippedHairGroup(afroFrontD, fill, ol, 1.6, sheen + strandGroup(coils, dark, 0.42, 0.9), clipId);
        }

        case 'mohawk': {
            // Closely faded sides covering the cranium + bold sculpted center crest
            const shavedCapD = buildCrownCapD(m, {
                padX: 1.1,
                padTop: 1.4,
                sideDropY: templeY + 1.5,
                templeInX: hw - 2.2,
                hairlineMidY: hairlineY,
                hairlineDip: 0
            });
            const cw = +(hw * 0.25).toFixed(1);
            const crestTop = top - 12;
            const crestBot = hairlineY - 1.0;
            const crestD = `M ${(50 - cw).toFixed(1)} ${crestBot} C ${(50 - cw - 1.5).toFixed(1)} ${top + 2} ${(50 - cw - 1).toFixed(1)} ${crestTop + 6} ${(50 - cw * 0.6).toFixed(1)} ${crestTop + 1.5} L ${(50 - cw * 0.2).toFixed(1)} ${crestTop + 3.5} L 50 ${crestTop - 1} L ${(50 + cw * 0.25).toFixed(1)} ${crestTop + 3} L ${(50 + cw * 0.65).toFixed(1)} ${crestTop + 1} C ${(50 + cw + 1).toFixed(1)} ${crestTop + 6} ${(50 + cw + 1.5).toFixed(1)} ${top + 2} ${(50 + cw).toFixed(1)} ${crestBot} Q 50 ${crestBot + 2.2} ${(50 - cw).toFixed(1)} ${crestBot} Z`;

            const crestStrands = strandGroup([
                `M ${(50 - cw * 0.45).toFixed(1)} ${crestBot - 1} Q ${(50 - cw * 0.5).toFixed(1)} ${(crestTop + crestBot) / 2} ${(50 - cw * 0.4).toFixed(1)} ${crestTop + 3}`,
                `M 50 ${crestBot} L 50 ${crestTop + 1}`,
                `M ${(50 + cw * 0.45).toFixed(1)} ${crestBot - 1} Q ${(50 + cw * 0.5).toFixed(1)} ${(crestTop + crestBot) / 2} ${(50 + cw * 0.4).toFixed(1)} ${crestTop + 3}`
            ], dark, 0.45, 0.85);
            const crestSheen = `<path d="M ${(50 - cw * 0.5).toFixed(1)} ${crestTop + 6} Q 50 ${crestTop + 3.5} ${(50 + cw * 0.5).toFixed(1)} ${crestTop + 6}" fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.38"/>`;

            return `<path d="${shavedCapD}" fill="${fill}" fill-opacity="0.45" stroke="${ol}" stroke-width="1.1"/>` +
                   renderClippedHairGroup(crestD, fill, ol, 1.5, crestStrands + crestSheen, clipId);
        }

        case 'braids': {
            // Cornrow scalp cap with rows strictly clipped inside the cap
            const capD = buildCrownCapD(m, {
                padX: 1.8,
                padTop: 2.6,
                sideDropY: templeY + 3,
                templeInX: hw - 2.6,
                hairlineMidY: hairlineY,
                hairlineDip: 0.4
            });
            const rowFracs = [-0.65, -0.38, -0.13, 0.13, 0.38, 0.65];
            const rows = rowFracs.map(f => {
                const xBot = +(50 + f * (hw - 3)).toFixed(1);
                const xTop = +(50 + f * (hw * 0.42)).toFixed(1);
                return `M ${xBot} ${hairlineY + 6} Q ${((xBot + xTop) * 0.5).toFixed(1)} ${top + 4} ${xTop} ${top - 2}`;
            });
            const sheen = `<path d="M ${50 - hw * 0.45} ${top + 3.5} Q 50 ${top + 0.5} ${50 + hw * 0.45} ${top + 3.5}" fill="none" stroke="${light}" stroke-width="2.0" stroke-linecap="round" stroke-opacity="0.28"/>`;
            return renderClippedHairGroup(capD, fill, ol, 1.5, sheen + strandGroup(rows, dark, 0.52, 1.0), clipId);
        }

        case 'undercut': {
            // Closely faded side cap + swept pompadour top volume
            const shavedCapD = buildCrownCapD(m, {
                padX: 1.1,
                padTop: 1.4,
                sideDropY: templeY + 2,
                templeInX: hw - 2.2,
                hairlineMidY: hairlineY,
                hairlineDip: 0
            });
            const partX = +(50 - hw * 0.48).toFixed(1);
            const sweepR = +(50 + hw * 0.74).toFixed(1);
            const topY = top - 7.5;
            const botY = hairlineY + 1.5;

            const topSweepD = `M ${partX} ${botY - 1} C ${partX - 3} ${topY + 4} ${50 - 6} ${topY} ${50 + 5} ${topY} C ${50 + hw * 0.68} ${topY} ${sweepR + 4} ${topY + 8} ${sweepR} ${botY + 1.5} C ${sweepR - 3} ${botY + 4.5} ${50 + 4} ${botY + 1.5} ${partX} ${botY - 1} Z`;

            const sweepLines = strandGroup([
                `M ${partX + 2} ${botY - 2} C ${50 - 2} ${topY + 4} ${50 + 10} ${topY + 4} ${sweepR - 2} ${botY}`,
                `M ${partX + 5} ${botY - 0.5} C ${50 + 2} ${topY + 8} ${50 + 12} ${topY + 8} ${sweepR - 4} ${botY + 2}`
            ], dark, 0.45, 0.9);
            const sheen = `<path d="M ${partX + 5} ${topY + 4.5} Q ${50 + 5} ${topY + 2} ${sweepR - 4} ${topY + 7}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.36"/>`;

            return `<path d="${shavedCapD}" fill="${fill}" fill-opacity="0.48" stroke="${ol}" stroke-width="1.1"/>` +
                   renderClippedHairGroup(topSweepD, fill, ol, 1.5, sweepLines + sheen, clipId);
        }

        default: {
            // Fallback (e.g. legacy 'shortStraight')
            const capD = buildCrownCapD(m, { padX: 2.2, padTop: 3.5 });
            return renderClippedHairGroup(capD, fill, ol, 1.5, crownSheenAndFlow(m, hex, 3.5), clipId);
        }
    }
}

// --- LAYER 8: GLASSES --------------------------------------------------------
// Positioned dynamically from the head model's eye coordinates and head width.

function glasses(style, colorHex, m) {
    if (!style || style === 'none') return '';
    const { eyeY, eyeSpacing, hw } = m;
    const lcx = 50 - eyeSpacing;
    const rcx = 50 + eyeSpacing;
    const cy = eyeY + 0.3;
    const lensR = 8.4;
    const lEdge = 50 - hw;
    const rEdge = 50 + hw;

    const bridgeAndArms = (innerL, innerR, outerL, outerR, armY) => `<g stroke="${colorHex}" stroke-width="2.0" stroke-linecap="round" fill="none">
        <path d="M ${innerL.toFixed(1)} ${(cy - 0.8).toFixed(1)} Q 50 ${(cy - 2.2).toFixed(1)} ${innerR.toFixed(1)} ${(cy - 0.8).toFixed(1)}"/>
        <path d="M ${outerL.toFixed(1)} ${armY.toFixed(1)} L ${(lEdge + 0.5).toFixed(1)} ${(cy - 1).toFixed(1)}"/>
        <path d="M ${outerR.toFixed(1)} ${armY.toFixed(1)} L ${(rEdge - 0.5).toFixed(1)} ${(cy - 1).toFixed(1)}"/>
    </g>`;

    switch (style) {
        case 'round':
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.2">
                <circle cx="${lcx}" cy="${cy}" r="${lensR}"/>
                <circle cx="${rcx}" cy="${cy}" r="${lensR}"/>
            </g>${bridgeAndArms(lcx + lensR, rcx - lensR, lcx - lensR, rcx + lensR, cy - 0.5)}`;

        case 'square': {
            const w = 17.2, h = 13.4;
            const lx = +(lcx - w / 2).toFixed(1);
            const rx = +(rcx - w / 2).toFixed(1);
            const ty = +(cy - h / 2).toFixed(1);
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.2">
                <rect x="${lx}" y="${ty}" width="${w}" height="${h}" rx="2.8"/>
                <rect x="${rx}" y="${ty}" width="${w}" height="${h}" rx="2.8"/>
            </g>${bridgeAndArms(lcx + w / 2, rcx - w / 2, lx, rx + w, cy - 1.5)}`;
        }

        case 'catEye': {
            // Classic upswept outer corners (wings at temples, clean bridge in center)
            const inL = lcx + 8.0, outL = lcx - 9.5;
            const inR = rcx - 8.0, outR = rcx + 9.5;
            const topY = cy - 5.8, wingY = cy - 8.2, botY = cy + 6.4;
            const lFrame = `M ${inL} ${cy - 1} C ${inL} ${topY} ${lcx - 2} ${topY} ${outL} ${wingY} C ${outL + 0.5} ${cy + 2} ${lcx - 5} ${botY} ${lcx} ${botY} C ${lcx + 5} ${botY} ${inL} ${cy + 3} ${inL} ${cy - 1} Z`;
            const rFrame = `M ${inR} ${cy - 1} C ${inR} ${topY} ${rcx + 2} ${topY} ${outR} ${wingY} C ${outR - 0.5} ${cy + 2} ${rcx + 5} ${botY} ${rcx} ${botY} C ${rcx - 5} ${botY} ${inR} ${cy + 3} ${inR} ${cy - 1} Z`;
            return `<g fill="none" stroke="${colorHex}" stroke-width="2.3" stroke-linejoin="round">
                <path d="${lFrame}"/>
                <path d="${rFrame}"/>
            </g>${bridgeAndArms(inL, inR, outL + 0.8, outR - 0.8, cy - 4.5)}`;
        }

        case 'sunglasses':
            return `<g stroke="${colorHex}" stroke-width="2.3">
                <circle cx="${lcx}" cy="${cy}" r="${lensR}" fill="${DARK_LENS}"/>
                <circle cx="${rcx}" cy="${cy}" r="${lensR}" fill="${DARK_LENS}"/>
            </g>
            <g fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.28">
                <path d="M ${(lcx - 4.5).toFixed(1)} ${(cy - 3.5).toFixed(1)} L ${(lcx - 1).toFixed(1)} ${(cy - 5.5).toFixed(1)}"/>
                <path d="M ${(rcx - 4.5).toFixed(1)} ${(cy - 3.5).toFixed(1)} L ${(rcx - 1).toFixed(1)} ${(cy - 5.5).toFixed(1)}"/>
            </g>
            ${bridgeAndArms(lcx + lensR, rcx - lensR, lcx - lensR, rcx + lensR, cy - 0.5)}`;

        default:
            return '';
    }
}

// --- BABY STAGE RENDERERS ----------------------------------------------------

function babyHeadShape(skinHex, skinGradUrl, outlineHex) {
    const ol = outlineHex || skinOutline(skinHex);
    const fill = skinGradUrl || skinHex;
    return `
        <g fill="${fill}" stroke="${ol}" stroke-width="2">
            <ellipse cx="17.5" cy="55" rx="4.5" ry="6.2"/>
            <ellipse cx="82.5" cy="55" rx="4.5" ry="6.2"/>
            <ellipse cx="50" cy="54" rx="32" ry="33"/>
        </g>
        <ellipse cx="34" cy="49" rx="4.5" ry="2.5" fill="white" opacity="0.09"/>
        <ellipse cx="66" cy="49" rx="4.5" ry="2.5" fill="white" opacity="0.09"/>
    `;
}

function babyBlush() {
    return `<g fill="#FF94A8" opacity="0.38">
        <ellipse cx="30" cy="61" rx="6.8" ry="4.5"/>
        <ellipse cx="70" cy="61" rx="6.8" ry="4.5"/>
    </g>`;
}

function babyEyes(eyeHex, irisGradUrl, outlineHex) {
    const ol = outlineHex || OUTLINE;
    const irisFill = irisGradUrl || eyeHex;
    const limbal = shadeColor(eyeHex, -32);
    return `
        <g>
            <circle cx="36.5" cy="50.5" r="6.8" fill="#FAF8F6" stroke="${ol}" stroke-width="1.35"/>
            <circle cx="36.5" cy="50.5" r="4.4" fill="${irisFill}" stroke="${limbal}" stroke-width="0.4"/>
            <circle cx="36.5" cy="50.5" r="2.0" fill="#151518"/>
            <circle cx="35.0" cy="49.0" r="1.25" fill="white" opacity="0.92"/>
            <circle cx="37.8" cy="51.8" r="0.5" fill="white" opacity="0.65"/>
        </g>
        <g>
            <circle cx="63.5" cy="50.5" r="6.8" fill="#FAF8F6" stroke="${ol}" stroke-width="1.35"/>
            <circle cx="63.5" cy="50.5" r="4.4" fill="${irisFill}" stroke="${limbal}" stroke-width="0.4"/>
            <circle cx="63.5" cy="50.5" r="2.0" fill="#151518"/>
            <circle cx="62.0" cy="49.0" r="1.25" fill="white" opacity="0.92"/>
            <circle cx="64.8" cy="51.8" r="0.5" fill="white" opacity="0.65"/>
        </g>
        <path d="M 30.5 40.5 Q 36.5 38 42.5 40.5" fill="none" stroke="${ol}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
        <path d="M 57.5 40.5 Q 63.5 38 69.5 40.5" fill="none" stroke="${ol}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    `;
}

function babyMouth(skinHex) {
    const ol = skinOutline(skinHex);
    return `
        <path d="M 48.2 58.5 Q 50 60 51.8 58.5" fill="none" stroke="${ol}" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
        <path d="M 43.5 66.5 Q 50 73 56.5 66.5 Z" fill="#E8735A" stroke="${ol}" stroke-width="1.3" stroke-linejoin="round"/>
    `;
}

function babyHair(hairPaint) {
    const { url: fill, hex } = hairPaint;
    const ol = hairOutline(hex);
    const light = shadeColor(hex, 28);
    return `
        <path d="M 43 22 C 41 14 48 9 53 12 C 56 14 55 19 52 21 C 55 21 58 23 56 25 C 52 25 47 23 43 22 Z" fill="${fill}" stroke="${ol}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M 46 15 Q 50 12 52.5 14.5" fill="none" stroke="${light}" stroke-width="1.0" stroke-linecap="round" stroke-opacity="0.45"/>
    `;
}

// --- ASSEMBLY ----------------------------------------------------------------

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

    // --- Gradient & ClipPath defs (namespaced per-character) ---
    const sid = sanitizeId(idSeed);
    const hairGradId = `hairGrad_${sid}`;
    const skinGradId = `skinGrad_${sid}`;
    const irisGradId = `irisGrad_${sid}`;
    const headClipId = `headClip_${sid}`;

    const isChild = stage === 'child';
    const m = getHeadModel(fs, isChild);

    const hairDefs = `<linearGradient id="${hairGradId}" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stop-color="${shadeColor(hairHex, 24)}"/>
        <stop offset="50%" stop-color="${hairHex}"/>
        <stop offset="100%" stop-color="${shadeColor(hairHex, -22)}"/>
    </linearGradient>`;

    const skinDefs = `<radialGradient id="${skinGradId}" cx="46%" cy="38%" r="56%">
        <stop offset="0%" stop-color="${shadeColor(skinHex, 10)}"/>
        <stop offset="70%" stop-color="${skinHex}"/>
        <stop offset="100%" stop-color="${shadeColor(skinHex, -9)}"/>
    </radialGradient>`;

    const irisDefs = `<radialGradient id="${irisGradId}" cx="42%" cy="38%" r="55%">
        <stop offset="0%" stop-color="${shadeColor(eyeHex, 22)}"/>
        <stop offset="65%" stop-color="${eyeHex}"/>
        <stop offset="100%" stop-color="${shadeColor(eyeHex, -26)}"/>
    </radialGradient>`;

    const headClipDef = `<clipPath id="${headClipId}"><path d="${headPathD(m)}"/></clipPath>`;

    const allDefs = `<defs>${hairDefs}${skinDefs}${irisDefs}${headClipDef}</defs>`;
    const hairPaint = { url: `url(#${hairGradId})`, hex: hairHex };
    const skinGradUrl = `url(#${skinGradId})`;
    const irisGradUrl = `url(#${irisGradId})`;

    let layers;

    if (stage === 'baby') {
        layers = [
            allDefs,
            babyHeadShape(skinHex, skinGradUrl, outlineHex),
            babyBlush(),
            babyEyes(eyeHex, irisGradUrl, outlineHex),
            babyMouth(skinHex),
            babyHair(hairPaint)
        ].join('');
    } else if (stage === 'child') {
        layers = [
            allDefs,
            hairBack(appearance.hairStyle, hairPaint, m, sid),
            headAndEars(m, skinHex, skinGradUrl, outlineHex, headClipId),
            eyebrows(appearance.eyebrowStyle, hairHex, m),
            eyes(appearance.eyeShape, eyeHex, m, outlineHex, irisGradUrl, eyelashStyle, sid),
            nose(noseShape, skinHex, m),
            philtrum(skinHex, m),
            mouth('none', m, skinHex),
            hairFront(appearance.hairStyle, hairPaint, m, sid, headClipId),
            glasses(appearance.glassesStyle, glassesHex, m)
        ].join('');
    } else {
        const facialHairHex = resolveFacialHairColor(appearance, age);
        const wrinkleOpacity = AvatarLogic.getWrinkleOpacity(age);
        layers = [
            allDefs,
            hairBack(appearance.hairStyle, hairPaint, m, sid),
            headAndEars(m, skinHex, skinGradUrl, outlineHex, headClipId),
            blush(appearance.blushColor, m, headClipId),
            eyebrows(appearance.eyebrowStyle, hairHex, m),
            eyes(appearance.eyeShape, eyeHex, m, outlineHex, irisGradUrl, eyelashStyle, sid),
            nose(noseShape, skinHex, m),
            philtrum(skinHex, m),
            mouth(appearance.lipstickColor, m, skinHex),
            facialHair(appearance.facialHairStyle, facialHairHex, m, headClipId),
            wrinkles(wrinkleOpacity, m, skinHex, headClipId),
            hairFront(appearance.hairStyle, hairPaint, m, sid, headClipId),
            glasses(appearance.glassesStyle, glassesHex, m)
        ].join('');
    }

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">${layers}</svg>`;
}

/**
 * Returns SVG markup for a character's current portrait, either freshly
 * built or pulled from cache. Backfills a random appearance in place if the
 * character somehow has none yet so old saves render something stable.
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
