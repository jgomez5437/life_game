import { state } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { hasPurchasedPack } from './storeScreen.js';
import { saveGame } from '../../core/main.js';
import { renderLifeDashboard } from '../player/mainScreen.js';
import { renderRelationships } from '../relationships/relationshipScreen.js';

const get = id => document.getElementById(id);

const APPEARANCE_SECTIONS = [
    { title: 'Face', fields: [
        { key: 'skinTone', options: AvatarLogic.SKIN_TONES },
        { key: 'faceShape', options: AvatarLogic.FACE_SHAPES }
    ]},
    { title: 'Hair', fields: [
        { key: 'hairStyle', options: AvatarLogic.HAIR_STYLES },
        { key: 'hairColorBase', options: AvatarLogic.HAIR_COLORS }
    ]},
    { title: 'Eyes', fields: [
        { key: 'eyeShape', options: AvatarLogic.EYE_SHAPES },
        { key: 'eyeColor', options: AvatarLogic.EYE_COLORS },
        { key: 'eyebrowStyle', options: AvatarLogic.EYEBROW_STYLES }
    ]},
    { title: 'Extras', fields: [
        { key: 'facialHairStyle', options: AvatarLogic.FACIAL_HAIR_STYLES },
        { key: 'facialHairColor', options: AvatarLogic.FACIAL_HAIR_COLORS },
        { key: 'glassesStyle', options: AvatarLogic.GLASSES_STYLES },
        { key: 'glassesColor', options: AvatarLogic.GLASSES_COLORS }
    ]},
    { title: 'Makeup', fields: [
        { key: 'lipstickColor', options: AvatarLogic.LIPSTICK_COLORS },
        { key: 'blushColor', options: AvatarLogic.BLUSH_COLORS }
    ]}
];

let editorTarget = 'self';
let editorPersonId = null;
let editorDraftAppearance = null;
let editorGender = 'male';
let editorAge = 25;
let editorTargetName = 'Your Character';
let previewVersion = 0;

function labelize(value) {
    return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

function findField(key) {
    for (const section of APPEARANCE_SECTIONS) {
        const field = section.fields.find(f => f.key === key);
        if (field) return field;
    }
    return null;
}

export function renderGodModeAvatarModal(target = 'self', personId = null) {
    if (!hasPurchasedPack('god_mode')) {
        UI.showModal("God Mode Locked", "You need the God Mode pack to use the Avatar Appearance Editor.");
        return;
    }

    const user = state.gameState?.user;
    if (!user) return;

    editorTarget = target;
    editorPersonId = personId;

    let targetObj = user;
    if (target === 'person' && personId) {
        const person = (user.relationships || []).find(r => String(r.id) === String(personId));
        if (person) {
            targetObj = person;
            editorTargetName = person.name;
        } else {
            editorTargetName = 'Person';
        }
    } else {
        editorTargetName = user.username || user.name || 'Your Character';
    }

    editorGender = targetObj.gender || (targetObj.type === 'Son' || targetObj.type === 'Father' || targetObj.type === 'Brother' || targetObj.type === 'Husband' ? 'male' : 'female');
    editorAge = targetObj.age || 25;

    const baseAppearance = targetObj.appearance || AvatarLogic.generateRandomAppearance(targetObj.id || 'godmode_' + Date.now(), editorGender);
    editorDraftAppearance = { ...baseAppearance };

    renderGodModeAvatarModalContent();
}

function renderGodModeAvatarModalContent() {
    previewVersion++;
    const tempObj = { age: editorAge, appearance: editorDraftAppearance, avatarVersion: previewVersion };
    const avatarSvg = renderAvatar(tempObj);

    const html = `
        <div class="space-y-4">
            <p class="text-xs text-slate-300">
                <i class="fas fa-bolt text-amber-400 mr-1"></i> Customizing appearance for <strong class="text-white">${editorTargetName}</strong>.
            </p>

            <!-- Sticky Live Preview -->
            <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex items-center gap-3 shadow-md">
                <div class="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center">
                    ${avatarSvg}
                </div>
                <div class="flex-1 space-y-1">
                    <div class="text-xs font-bold text-amber-300">Live Preview</div>
                    <div class="text-[10px] text-slate-400">Gender: <span class="text-white capitalize">${editorGender}</span> • Age: ${editorAge}</div>
                    <button data-action="randomizeGodModeAvatarTraits" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1">
                        <i class="fas fa-dice"></i> Randomize Appearance
                    </button>
                </div>
            </div>

            <!-- Traits Editor Accordion Grid -->
            <div class="max-h-64 overflow-y-auto pr-1 space-y-3">
                ${APPEARANCE_SECTIONS.map(section => `
                    <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex justify-between items-center">
                            <span>${section.title}</span>
                        </div>
                        <div class="space-y-1.5">
                            ${section.fields.map(f => `
                                <div class="flex items-center justify-between bg-slate-800 rounded-lg px-2 py-1 border border-slate-700/60">
                                    <button data-action="cycleGodModeTrait" data-args="'${f.key}', -1" class="text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-slate-700">
                                        <i class="fas fa-chevron-left text-xs"></i>
                                    </button>
                                    <div class="flex-1 text-center text-xs text-slate-300">
                                        ${labelize(f.key)}: <span class="text-blue-300 font-bold">${labelize(editorDraftAppearance[f.key] || 'None')}</span>
                                    </div>
                                    <button data-action="cycleGodModeTrait" data-args="'${f.key}', 1" class="text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-slate-700">
                                        <i class="fas fa-chevron-right text-xs"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button data-action="hideModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition">
                    Cancel
                </button>
                <button data-action="saveGodModeAvatar" class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20">
                    <i class="fas fa-check"></i> Save Appearance
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: `God Mode Avatar Editor: ${editorTargetName}`,
        content: html
    });
}

export function cycleGodModeTrait(key, direction) {
    const field = findField(key);
    if (!field || !editorDraftAppearance) return;

    let options = field.options;
    if (key === 'hairStyle' && editorGender === 'female') {
        options = AvatarLogic.FEMALE_HAIR_STYLES;
    } else if (key === 'facialHairStyle' && editorGender === 'female') {
        options = ['none'];
    } else if ((key === 'lipstickColor' || key === 'blushColor') && editorGender === 'male') {
        options = ['none'];
    }

    const currentVal = editorDraftAppearance[key] || options[0];
    const idx = options.indexOf(currentVal);
    const nextIdx = (idx + direction + options.length) % options.length;
    editorDraftAppearance[key] = options[nextIdx];

    renderGodModeAvatarModalContent();
}

export function randomizeGodModeAvatarTraits() {
    editorDraftAppearance = AvatarLogic.generateRandomAppearance('godmode_draft_' + Math.random(), editorGender);
    renderGodModeAvatarModalContent();
}

export function saveGodModeAvatar() {
    const user = state.gameState?.user;
    if (!user || !editorDraftAppearance) return;

    if (editorTarget === 'person' && editorPersonId) {
        const person = (user.relationships || []).find(r => String(r.id) === String(editorPersonId));
        if (person) {
            person.appearance = { ...editorDraftAppearance };
            person.avatarVersion = (person.avatarVersion || 0) + 1;
        }
    } else {
        user.appearance = { ...editorDraftAppearance };
        user.avatarVersion = (user.avatarVersion || 0) + 1;
    }

    saveGame();
    UI.updateHeader(user);
    UI.hideModal();

    if (editorTarget === 'person') {
        renderRelationships();
        UI.showModal("Appearance Saved", `Updated appearance for ${editorTargetName}!`);
    } else {
        renderLifeDashboard(state.gameState);
        UI.showModal("Appearance Saved", "Updated your character appearance!");
    }
}
