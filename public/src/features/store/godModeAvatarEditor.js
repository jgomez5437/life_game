import { state, hasPurchasedPack } from '../../core/state.js';
import { UI } from '../../ui/ui.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { saveGame } from '../../core/main.js';
import { renderLifeDashboard } from '../player/mainScreen.js';
import { renderRelationships, isDeadNPC } from '../relationships/relationshipScreen.js';

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
            if (isDeadNPC(person)) {
                UI.showModal("Cannot Edit", "Cannot edit the appearance of a deceased character.");
                return;
            }
            targetObj = person;
            editorTargetName = person.name;
        } else {
            UI.showModal("Cannot Edit", "This person could not be found or has passed away.");
            return;
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
            <!-- Sticky Live Preview -->
            <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex items-center gap-3 shadow-md">
                <div class="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center">
                    ${avatarSvg}
                </div>
                <div>
                    <div class="text-white font-bold text-sm">${editorTargetName}</div>
                    <div class="text-xs text-amber-400 font-semibold"><i class="fas fa-sparkles mr-1"></i>Live God Mode Preview</div>
                </div>
            </div>

            <!-- Appearance Editor Sections -->
            <div class="max-h-72 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                ${APPEARANCE_SECTIONS.map(section => `
                    <div class="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">${section.title}</h4>
                        <div class="space-y-2">
                            ${section.fields.map(field => `
                                <div>
                                    <label class="text-[11px] text-slate-300 font-semibold block mb-1 capitalize">${field.key.replace(/([A-Z])/g, ' $1')}</label>
                                    <select data-action="updateGodModeAvatarTrait" data-args="&apos;${field.key}&apos;" id="godmode_select_${field.key}" class="w-full bg-slate-900 border border-slate-700 rounded-lg text-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-amber-400">
                                        ${field.options.map(opt => `
                                            <option value="${opt}" ${editorDraftAppearance[field.key] === opt ? 'selected' : ''}>${opt}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-2 pt-2 border-t border-slate-700">
                <button data-action="randomizeGodModeAvatarTraits" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl py-2 font-bold text-xs transition flex items-center justify-center gap-1.5">
                    <i class="fas fa-dice text-amber-400"></i> Randomize
                </button>
                <button data-action="saveGodModeAvatar" class="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl py-2 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow">
                    <i class="fas fa-check"></i> Save Changes
                </button>
            </div>
        </div>
    `;

    UI.showModal("God Mode Avatar Editor", html);
}

export function updateGodModeAvatarTrait(key) {
    const el = get(`godmode_select_${key}`);
    if (!el || !editorDraftAppearance) return;

    editorDraftAppearance[key] = el.value;
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
        if (person && !isDeadNPC(person)) {
            person.appearance = { ...editorDraftAppearance };
            person.avatarVersion = (person.avatarVersion || 0) + 1;
        } else {
            UI.hideModal();
            UI.showModal("Cannot Edit", "This character has passed away.");
            return;
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
