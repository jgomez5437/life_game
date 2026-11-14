import { AvatarLogic } from '../core/avatarLogic.js';
import { shadeColor, eyebrows, facialHair, hairBack, hairFront, babyHair } from './avatarHairRenderer.js';

// Builds a layered SVG portrait from a character's stored appearance
// descriptor plus their current age (for hair-graying and wrinkle
// interpolation). Rendered SVG is never stored — only the trait descriptor
// persists (see avatarLogic.js).

const OUTLINE = '#2b2320';
const DARK_LENS = '#16181d';

// --- COLOR HELPERS -----------------------------------------------------------

// Warm skin-relative outline color.
function skinOutline(skinHex) {
    return shadeColor(skinHex, -48);
}

// SVG gradient/clipPath ids must be unique document-wide because many avatars
// can be inlined into the DOM at once.
function sanitizeId(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
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
