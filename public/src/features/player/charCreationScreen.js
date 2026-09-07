import { GameLogic } from '../../core/gameLogic.js';
import { loadAndRenderGame, updateGameInfo, saveGame } from '../../core/main.js';
import { state, hasPurchasedPack } from '../../core/state.js';
import { renderLifeDashboard, addLog } from './mainScreen.js';
import { FamilyFactory } from '../relationships/familyFactory.js';
import { UI } from '../../ui/ui.js';
import { Utils, COUNTRIES_DATA } from '../../ui/utils.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { captureAnnualSnapshot } from '../../core/timeMachine.js';
import { getAuthToken } from '../../auth/auth.js';
import { saveToSlot, getSlotsStore } from '../../core/saveSlotManager.js';

//Character creation screen
const get = id => document.getElementById(id);
let selectedGender = 'male';
let draftAppearance = null;
let previewVersion = 0;
let activeCategory = 'face'; // 'face' | 'hair' | 'eyes' | 'style'
let zoomLevel = 1; // 1 = Portrait (1x), 1.75 = Face Close-up (1.75x)

export function updateCityDropdown(countryName) {
    const selectedCountry = (typeof countryName === 'string' ? countryName : null) || (get('inp-country') ? get('inp-country').value : 'United States');
    const countryObj = COUNTRIES_DATA.find(c => c.name === selectedCountry) || COUNTRIES_DATA[0];
    const citySelect = get('inp-city');
    if (citySelect) {
        citySelect.innerHTML = countryObj.cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// --- APPEARANCE DRAFT & CATEGORIES ---
export const APPEARANCE_CATEGORIES = [
    { id: 'face', label: 'Face', icon: 'fa-user' },
    { id: 'hair', label: 'Hair', icon: 'fa-scissors' },
    { id: 'eyes', label: 'Eyes', icon: 'fa-eye' },
    { id: 'style', label: 'Style', icon: 'fa-glasses' }
];

export const APPEARANCE_SECTIONS = [
    {
        category: 'face',
        title: 'Face',
        fields: [
            { key: 'skinTone', label: 'Skin Tone', type: 'color', options: AvatarLogic.SKIN_TONES, hexMap: AvatarLogic.SKIN_TONE_HEX },
            { key: 'faceShape', label: 'Face Shape', type: 'style', options: AvatarLogic.FACE_SHAPES },
            { key: 'noseShape', label: 'Nose Shape', type: 'style', options: AvatarLogic.NOSE_SHAPES }
        ]
    },
    {
        category: 'hair',
        title: 'Hair',
        fields: [
            { key: 'hairStyle', label: 'Hairstyle', type: 'style', options: AvatarLogic.HAIR_STYLES },
            { key: 'hairColorBase', label: 'Hair Color', type: 'color', options: AvatarLogic.HAIR_COLORS, hexMap: AvatarLogic.HAIR_COLOR_HEX }
        ]
    },
    {
        category: 'eyes',
        title: 'Eyes',
        fields: [
            { key: 'eyeShape', label: 'Eye Shape', type: 'style', options: AvatarLogic.EYE_SHAPES },
            { key: 'eyeColor', label: 'Eye Color', type: 'color', options: AvatarLogic.EYE_COLORS, hexMap: AvatarLogic.EYE_COLOR_HEX },
            { key: 'eyebrowStyle', label: 'Eyebrows', type: 'style', options: AvatarLogic.EYEBROW_STYLES },
            { key: 'eyelashStyle', label: 'Eyelashes', type: 'style', options: AvatarLogic.EYELASH_STYLES, genderLimit: 'female' }
        ]
    },
    {
        category: 'style',
        title: 'Style & Details',
        fields: [
            { key: 'facialHairStyle', label: 'Facial Hair', type: 'style', options: AvatarLogic.FACIAL_HAIR_STYLES, genderLimit: 'male' },
            { key: 'facialHairColor', label: 'Beard Color', type: 'color', options: AvatarLogic.FACIAL_HAIR_COLORS, hexMap: AvatarLogic.HAIR_COLOR_HEX, genderLimit: 'male', dependsOn: 'facialHairStyle' },
            { key: 'glassesStyle', label: 'Glasses', type: 'style', options: AvatarLogic.GLASSES_STYLES },
            { key: 'glassesColor', label: 'Glasses Color', type: 'color', options: AvatarLogic.GLASSES_COLORS, hexMap: AvatarLogic.GLASSES_COLOR_HEX, dependsOn: 'glassesStyle' },
            { key: 'lipstickColor', label: 'Lipstick', type: 'color', options: AvatarLogic.LIPSTICK_COLORS, hexMap: AvatarLogic.LIPSTICK_COLOR_HEX, genderLimit: 'female' },
            { key: 'blushColor', label: 'Blush', type: 'color', options: AvatarLogic.BLUSH_COLORS, hexMap: AvatarLogic.BLUSH_COLOR_HEX, genderLimit: 'female' }
        ]
    }
];

function labelize(value) {
    if (!value) return '';
    if (value === 'matchHair') return 'Match Hair';
    if (typeof value === 'string' && value.startsWith('tone')) {
        return `Tone ${value.replace('tone', '')}`;
    }
    return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

function findField(key) {
    for (const section of APPEARANCE_SECTIONS) {
        const field = section.fields.find(f => f.key === key);
        if (field) return field;
    }
    return null;
}

export function setCharTab(tabId) {
    activeCategory = tabId;
    renderAppearancePanel();
}

export function toggleAvatarZoom() {
    zoomLevel = zoomLevel === 1 ? 1.75 : 1;
    applyAvatarZoom();
}

export function setAvatarZoom(level) {
    zoomLevel = Number(level) || 1;
    applyAvatarZoom();
}

function applyAvatarZoom() {
    const transformVal = zoomLevel > 1 ? `scale(${zoomLevel}) translateY(6%)` : 'scale(1) translateY(0)';
    
    const wrapper = get('avatar-zoom-wrapper');
    if (wrapper) {
        wrapper.style.transform = transformVal;
    }
    
    const miniWrapper = get('avatar-mini-zoom-wrapper');
    if (miniWrapper) {
        miniWrapper.style.transform = transformVal;
    }

    const btnZoom1 = get('btn-zoom-1');
    const btnZoom2 = get('btn-zoom-2');
    if (btnZoom1 && btnZoom2) {
        if (zoomLevel === 1) {
            btnZoom1.className = "px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-md transition flex items-center gap-1.5";
            btnZoom2.className = "px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5";
        } else {
            btnZoom1.className = "px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5";
            btnZoom2.className = "px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-md transition flex items-center gap-1.5";
        }
    }

    const zoomBadge = get('avatar-zoom-badge');
    if (zoomBadge) {
        zoomBadge.innerHTML = `<i class="fas ${zoomLevel > 1 ? 'fa-search-minus' : 'fa-search-plus'} text-blue-400 mr-1"></i><span>${zoomLevel > 1 ? '1.75x Close-Up' : '1x Portrait'}</span>`;
    }

    const mobileDockZoomLabel = get('mobile-dock-zoom-label');
    if (mobileDockZoomLabel) {
        mobileDockZoomLabel.innerText = zoomLevel > 1 ? '1.75x' : '1x';
    }
}

export function pickTraitOption(key, value) {
    if (!draftAppearance) return;
    draftAppearance[key] = value;
    renderAppearancePanel();
}

export function cycleTrait(key, direction) {
    const field = findField(key);
    if (!field || !draftAppearance) return;
    let options = field.options;
    if (key === 'hairStyle' && selectedGender === 'female') {
        options = AvatarLogic.FEMALE_HAIR_STYLES;
    } else if (key === 'hairStyle' && selectedGender === 'male') {
        options = AvatarLogic.MALE_HAIR_STYLES;
    } else if (key === 'facialHairStyle' && selectedGender === 'female') {
        options = ['none'];
    } else if ((key === 'lipstickColor' || key === 'blushColor') && selectedGender === 'male') {
        options = ['none'];
    }
    const idx = options.indexOf(draftAppearance[key]);
    const next = (idx + direction + options.length) % options.length;
    draftAppearance[key] = options[next];
    renderAppearancePanel();
}

export function randomizeSection(identifier) {
    const section = APPEARANCE_SECTIONS.find(s => s.category === identifier || s.title === identifier);
    if (!section || !draftAppearance) return;
    section.fields.forEach(f => {
        if (f.genderLimit && f.genderLimit !== selectedGender) return;
        let options = f.options;
        if (f.key === 'hairStyle' && selectedGender === 'female') {
            options = AvatarLogic.FEMALE_HAIR_STYLES;
        } else if (f.key === 'hairStyle' && selectedGender === 'male') {
            options = AvatarLogic.MALE_HAIR_STYLES;
        } else if (f.key === 'facialHairStyle' && selectedGender === 'female') {
            options = ['none'];
        } else if ((f.key === 'lipstickColor' || f.key === 'blushColor') && selectedGender === 'male') {
            options = ['none'];
        }
        draftAppearance[f.key] = options[Math.floor(Math.random() * options.length)];
    });
    renderAppearancePanel();
}

export function randomizeAllTraits() {
    draftAppearance = AvatarLogic.generateRandomAppearance('draft-' + Math.random(), selectedGender);
    renderAppearancePanel();
}

export function randomizePlayerName() {
    const isMale = selectedGender === 'male';
    const first = (typeof GameLogic !== 'undefined' && typeof GameLogic.getRandomFirstName === 'function')
        ? GameLogic.getRandomFirstName(isMale ? 'male' : 'female')
        : (isMale ? 'James' : 'Emma');
    const last = (typeof GameLogic !== 'undefined' && typeof GameLogic.getRandomLastName === 'function')
        ? GameLogic.getRandomLastName()
        : 'Smith';
    const input = get('inp-name');
    if (input) {
        input.value = `${first} ${last}`;
    }
    const mobileDockName = get('mobile-dock-name');
    if (mobileDockName) {
        mobileDockName.innerText = `${first} ${last}`;
    }
    const desktopNameBadge = get('desktop-avatar-name');
    if (desktopNameBadge) {
        desktopNameBadge.innerText = `${first} ${last}`;
    }
}

function renderFieldControl(f) {
    let options = f.options;
    if (f.key === 'hairStyle' && selectedGender === 'female') {
        options = AvatarLogic.FEMALE_HAIR_STYLES;
    } else if (f.key === 'hairStyle' && selectedGender === 'male') {
        options = AvatarLogic.MALE_HAIR_STYLES;
    }

    const currentValue = draftAppearance[f.key];
    const label = f.label || labelize(f.key);

    if (f.type === 'color') {
        return `
            <div class="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${label}</span>
                    <span class="text-xs font-bold text-blue-300">${labelize(currentValue)}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-0.5">
                    ${options.map(opt => {
                        const isSelected = currentValue === opt;
                        if (opt === 'none') {
                            return `
                                <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 text-[10px] font-bold ${isSelected ? 'border-blue-400 bg-slate-800 text-blue-400 ring-2 ring-blue-400/50 scale-110 shadow-md' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:text-slate-300'}"
                                    title="None">
                                    <i class="fas fa-ban"></i>
                                </button>
                            `;
                        }
                        if (opt === 'matchHair') {
                            return `
                                <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                    class="px-2.5 h-7 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 text-[10px] font-bold ${isSelected ? 'border-blue-400 bg-blue-600/30 text-blue-300 ring-2 ring-blue-400/50 scale-105 shadow-md' : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'}"
                                    title="Match Hair Color">
                                    <i class="fas fa-magic mr-1 text-[9px]"></i> Match Hair
                                </button>
                            `;
                        }
                        const hex = (f.hexMap && f.hexMap[opt]) ? f.hexMap[opt] : (AvatarLogic.HAIR_COLOR_HEX[opt] || '#888888');
                        return `
                            <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all transform hover:scale-110 active:scale-95 relative ${isSelected ? 'border-white ring-2 ring-blue-400 scale-110 shadow-md shadow-blue-500/30' : 'border-slate-800 hover:border-slate-500'}"
                                style="background-color: ${hex};"
                                title="${labelize(opt)}">
                                ${isSelected ? '<span class="absolute inset-0 flex items-center justify-center text-white drop-shadow text-[10px]"><i class="fas fa-check"></i></span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Style / Shape field with Carousel Pill
    const currentIndex = options.indexOf(currentValue);
    const countText = options.length > 1 && currentIndex >= 0 ? `<span class="text-[10px] text-slate-500 ml-1">(${currentIndex + 1}/${options.length})</span>` : '';

    return `
        <div class="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-2.5 shadow-sm">
            <div class="flex items-center justify-between">
                <button type="button" data-action="cycleTrait" data-args="'${f.key}', -1" 
                    class="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
                    title="Previous ${label}">
                    <i class="fas fa-chevron-left text-xs"></i>
                </button>
                <div class="flex-1 text-center px-3 min-w-0">
                    <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400">${label} ${countText}</div>
                    <div class="text-xs sm:text-sm font-bold text-blue-300 truncate">${labelize(currentValue)}</div>
                </div>
                <button type="button" data-action="cycleTrait" data-args="'${f.key}', 1" 
                    class="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
                    title="Next ${label}">
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    `;
}

function renderAppearancePanel() {
    previewVersion++;
    const avatarSvg = renderAvatar({
        id: 'char-creation-preview',
        age: 25,
        appearance: draftAppearance,
        avatarVersion: previewVersion
    });

    const preview = get('avatar-preview');
    if (preview) {
        preview.innerHTML = avatarSvg;
    }

    const miniPreview = get('avatar-mini-preview');
    if (miniPreview) {
        miniPreview.innerHTML = avatarSvg;
    }

    applyAvatarZoom();

    const panel = get('appearance-panel');
    if (!panel) return;

    const currentSection = APPEARANCE_SECTIONS.find(s => s.category === activeCategory) || APPEARANCE_SECTIONS[0];

    panel.innerHTML = `
        <!-- Category Tab Buttons -->
        <div class="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-4 select-none">
            ${APPEARANCE_CATEGORIES.map(cat => `
                <button type="button" data-action="setCharTab" data-args="'${cat.id}'" 
                    class="${activeCategory === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'} py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
                    <i class="fas ${cat.icon} text-xs"></i>
                    <span>${cat.label}</span>
                </button>
            `).join('')}
        </div>

        <!-- Active Category Fields -->
        <div class="space-y-3">
            ${currentSection.fields.filter(f => {
                if (f.genderLimit && f.genderLimit !== selectedGender) return false;
                if (f.dependsOn && draftAppearance[f.dependsOn] === 'none') return false;
                return true;
            }).map(f => renderFieldControl(f)).join('')}

            <!-- Randomize This Category -->
            <div class="pt-2 flex justify-end">
                <button type="button" data-action="randomizeSection" data-args="'${currentSection.category}'" class="text-xs font-semibold text-slate-400 hover:text-blue-300 transition flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-800/60">
                    <i class="fas fa-dice text-blue-400"></i>
                    <span>Randomize ${currentSection.title}</span>
                </button>
            </div>
        </div>
    `;
}

export const renderCharCreation = () => {
    if (typeof window !== 'undefined') {
        window.renderCharCreation = renderCharCreation;
    }
    UI.resetHeader();
    draftAppearance = AvatarLogic.generateRandomAppearance('draft-' + Math.random(), selectedGender);

    const creationHTML = `
        <div class="fade-in max-w-4xl mx-auto px-2 sm:px-4 py-2">
            <!-- Header Banner -->
            <div class="text-center pt-1 pb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-400 mb-2 shadow-inner">
                    <i class="fas fa-baby text-2xl"></i>
                </div>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">New Life</h2>
                <p class="text-xs sm:text-sm text-slate-400">Design your destiny and shape your identity.</p>
            </div>

            <!-- Mobile Sticky Dock (Always visible on mobile as user scrolls) -->
            <div id="mobile-sticky-dock" class="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 shadow-xl mb-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0 cursor-pointer" data-action="toggleAvatarZoom" title="Click to Toggle Zoom">
                    <div class="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-600/80 overflow-hidden flex-shrink-0 relative shadow-inner">
                        <div id="avatar-mini-zoom-wrapper" class="w-full h-full transition-transform duration-300 ease-out origin-center">
                            <div id="avatar-mini-preview" class="w-full h-full flex items-center justify-center"></div>
                        </div>
                    </div>
                    <div class="min-w-0">
                        <div id="mobile-dock-name" class="text-xs font-bold text-white truncate">New Life</div>
                        <div class="text-[10px] text-blue-400 flex items-center gap-1 font-semibold">
                            <i class="fas fa-search text-[9px]"></i> <span id="mobile-dock-zoom-label">1x</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" data-action="toggleAvatarZoom" class="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition flex items-center gap-1 shadow-sm" title="Toggle Zoom">
                        <i class="fas fa-magnifying-glass text-blue-400 text-xs"></i> Zoom
                    </button>
                    <button type="button" data-action="randomizeAllTraits" class="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 text-xs font-bold transition shadow-sm" title="Randomize Appearance">
                        <i class="fas fa-dice text-blue-400 text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- Responsive Grid: Split layout on desktop, stacked on mobile -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 pb-8">
                
                <!-- Left Column: Sticky Avatar Studio Stage (md:col-span-5) -->
                <div class="md:col-span-5">
                    <div class="md:sticky md:top-4 space-y-4">
                        <div id="avatar-stage-card" class="relative group bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center">
                            <!-- Ambient Studio Glow Backdrop -->
                            <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-slate-950/40 pointer-events-none"></div>
                            <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/15 blur-3xl rounded-full pointer-events-none"></div>

                            <!-- Stage Header Badge -->
                            <div class="relative z-10 w-full flex items-center justify-between mb-3 text-xs">
                                <span id="desktop-avatar-name" class="font-bold text-white truncate max-w-[140px]">New Life</span>
                                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700">Preview (Age 25)</span>
                            </div>

                            <!-- The Avatar Viewport (Rounded-3xl Modern Frame) -->
                            <div id="avatar-preview-container" data-action="toggleAvatarZoom" class="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl overflow-hidden cursor-pointer group-hover:border-blue-500/50 transition-all duration-300 flex items-center justify-center select-none" title="Click to Toggle Close-Up / Portrait View">
                                <div id="avatar-zoom-wrapper" class="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out origin-center">
                                    <div id="avatar-preview" class="w-full h-full flex items-center justify-center"></div>
                                </div>

                                <!-- Zoom Indicator Badge on the stage -->
                                <div id="avatar-zoom-badge" class="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-sm border border-slate-700/80 text-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow pointer-events-none">
                                    <i class="fas fa-search-plus text-blue-400"></i>
                                    <span>1x Portrait</span>
                                </div>
                            </div>

                            <!-- Interactive Zoom Controls -->
                            <div class="mt-4 flex items-center justify-center gap-1.5 bg-slate-950/70 border border-slate-800 p-1 rounded-2xl shadow-inner">
                                <button type="button" id="btn-zoom-1" data-action="setAvatarZoom" data-args="1" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-md transition flex items-center gap-1.5">
                                    <i class="fas fa-portrait"></i> Portrait
                                </button>
                                <button type="button" id="btn-zoom-2" data-action="setAvatarZoom" data-args="1.75" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5">
                                    <i class="fas fa-search-plus"></i> Close-Up
                                </button>
                            </div>

                            <!-- Quick Randomize Button -->
                            <div class="w-full mt-4 pt-3 border-t border-slate-700/60">
                                <button type="button" data-action="randomizeAllTraits" class="w-full bg-slate-900/90 hover:bg-slate-900 active:scale-98 text-slate-200 hover:text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition shadow-sm">
                                    <i class="fas fa-dice text-blue-400 text-sm"></i>
                                    <span>Randomize Appearance</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Identity & Customization Cards (md:col-span-7) -->
                <div class="md:col-span-7 space-y-4">
                    <!-- Identity Card -->
                    <div class="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div class="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                            <i class="fas fa-id-card text-blue-400 text-sm"></i>
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300">Identity & Origin</h3>
                        </div>

                        <!-- Full Name with Random Dice Button -->
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                            <div class="relative flex items-center">
                                <input type="text" id="inp-name" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 pr-12 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition text-sm" placeholder="First and Last Name">
                                <button type="button" data-action="randomizePlayerName" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 hover:text-blue-300 border border-slate-700 flex items-center justify-center transition shadow-sm" title="Generate Random Name">
                                    <i class="fas fa-dice text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Gender Selector -->
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Gender</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button type="button" data-action="selectGender" data-args="&apos;male&apos;" id="btn-male" class="p-3 rounded-xl border border-blue-500 bg-blue-900/30 text-blue-200 font-bold flex items-center justify-center gap-2 transition shadow-sm">
                                    <i class="fas fa-mars text-blue-400"></i> Male
                                </button>
                                <button type="button" data-action="selectGender" data-args="&apos;female&apos;" id="btn-female" class="p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-bold flex items-center justify-center gap-2 transition hover:border-slate-600">
                                    <i class="fas fa-venus text-pink-400"></i> Female
                                </button>
                            </div>
                        </div>

                        <!-- Birth Location -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Birth Country</label>
                                <select id="inp-country" data-action="updateCityDropdown" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition text-sm">
                                    ${COUNTRIES_DATA.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Birth City</label>
                                <select id="inp-city" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition text-sm">
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Appearance Customization Card with Tabs -->
                    <div class="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-palette text-blue-400 text-sm"></i>
                                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300">Appearance Studio</h3>
                            </div>
                            <span class="text-[10px] text-slate-400 font-semibold">Live Interactive Preview</span>
                        </div>

                        <!-- Tabbed Appearance Panel -->
                        <div id="appearance-panel"></div>
                    </div>

                    <!-- God Mode Tuning (If Entitled) -->
                    ${hasPurchasedPack('god_mode') ? `
                        <div class="bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-900/90 border border-amber-500/40 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl">
                            <div class="flex items-center justify-between border-b border-amber-500/30 pb-3">
                                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                                    <i class="fas fa-bolt text-amber-400"></i> God Mode Stat Tuning
                                </span>
                                <button type="button" data-action="maxCreationGodStats" class="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold transition shadow-sm">
                                    <i class="fas fa-sparkles mr-1"></i> Max All (100%)
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Health</span>
                                        <span id="god-create-health-val" class="text-emerald-400 font-mono">100%</span>
                                    </div>
                                    <input type="range" id="god-create-health" min="0" max="100" value="100" oninput="document.getElementById('god-create-health-val').innerText = this.value + '%'" class="w-full accent-emerald-500">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Happiness</span>
                                        <span id="god-create-happiness-val" class="text-amber-400 font-mono">100%</span>
                                    </div>
                                    <input type="range" id="god-create-happiness" min="0" max="100" value="100" oninput="document.getElementById('god-create-happiness-val').innerText = this.value + '%'" class="w-full accent-amber-400">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Smarts</span>
                                        <span id="god-create-smarts-val" class="text-blue-400 font-mono">100%</span>
                                    </div>
                                    <input type="range" id="god-create-smarts" min="0" max="100" value="100" oninput="document.getElementById('god-create-smarts-val').innerText = this.value + '%'" class="w-full accent-blue-500">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Looks</span>
                                        <span id="god-create-looks-val" class="text-pink-400 font-mono">100%</span>
                                    </div>
                                    <input type="range" id="god-create-looks" min="0" max="100" value="100" oninput="document.getElementById('god-create-looks-val').innerText = this.value + '%'" class="w-full accent-pink-500">
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Start Life CTA Button -->
                    <button type="button" data-action="submitCharacter" class="w-full btn-life text-white font-extrabold py-4 rounded-2xl text-lg sm:text-xl shadow-xl hover:shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2">
                        <span>Start Life</span>
                        <i class="fas fa-arrow-right text-base"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    UI.renderScreen(creationHTML);
    renderAppearancePanel();
    updateCityDropdown('United States');

    // Attach real-time name listener for live header update
    const nameInput = get('inp-name');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim() || 'New Life';
            const mobileDockName = get('mobile-dock-name');
            if (mobileDockName) mobileDockName.innerText = val;
            const desktopNameBadge = get('desktop-avatar-name');
            if (desktopNameBadge) desktopNameBadge.innerText = val;
        });
    }
};

export function selectGender(g) {
    selectedGender = g;
    if (draftAppearance) {
        if (g === 'female') {
            draftAppearance.facialHairStyle = 'none';
            if (draftAppearance.hairStyle === 'bald') {
                draftAppearance.hairStyle = 'shortCrop';
            }
        } else if (g === 'male') {
            draftAppearance.lipstickColor = 'none';
            draftAppearance.blushColor = 'none';
        }
    }
    const btnMale = get('btn-male');
    const btnFemale = get('btn-female');
    if (btnMale && btnFemale) {
        if (g === 'male') {
            btnMale.className = "p-3 rounded-xl border border-blue-500 bg-blue-900/30 text-blue-200 font-bold flex items-center justify-center gap-2 transition shadow-sm";
            btnFemale.className = "p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-bold flex items-center justify-center gap-2 transition hover:border-slate-600";
        } else {
            btnMale.className = "p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-bold flex items-center justify-center gap-2 transition hover:border-slate-600";
            btnFemale.className = "p-3 rounded-xl border border-pink-500 bg-pink-900/30 text-pink-200 font-bold flex items-center justify-center gap-2 transition shadow-sm";
        }
    }
    renderAppearancePanel();
}

export async function submitCharacter() {
    // 1. Safely check for user
    let user = null;
    if (state.auth0Client) {
        try { user = await state.auth0Client.getUser(); } catch (e) {}
    }
    if (user) {
        state.userAuthId = user.sub;
        state.userEmail = user.email;
    }

    const inputName = get('inp-name')?.value || '';
    const validation = GameLogic.sanitizeName(inputName);

    if (!validation.isValid) {
        UI.showModal("Wait", validation.error);
        return;
    }
    
    const finalName = validation.cleanedName;
    if (!finalName) return;

    // Extract Last Name for Family Generation
    const nameParts = finalName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : finalName;
    
    const gender = selectedGender;
    const country = get('inp-country') ? get('inp-country').value : 'United States';
    const city = get('inp-city') ? get('inp-city').value : 'New York';

    // === 1. GENERATE STARTING FAMILY ===
    let startingFamily = [];
    if (FamilyFactory) {
        startingFamily = FamilyFactory.generateFamily(lastName);
    } else {
        console.error("FamilyFactory is not loaded. Relationships array will be empty.");
    }

    try {
        // === 2. DETERMINE INITIAL STATS (SUPPORTING GOD MODE IF UNLOCKED) ===
        let initialStats;
        if (hasPurchasedPack('god_mode') && get('god-create-health')) {
            initialStats = {
                health: Math.max(0, Math.min(100, parseInt(get('god-create-health').value, 10) || 100)),
                happiness: Math.max(0, Math.min(100, parseInt(get('god-create-happiness').value, 10) || 100)),
                smarts: Math.max(0, Math.min(100, parseInt(get('god-create-smarts').value, 10) || 50)),
                looks: Math.max(0, Math.min(100, parseInt(get('god-create-looks').value, 10) || 50))
            };
        } else {
            initialStats = GameLogic.generateRandomStats ? GameLogic.generateRandomStats() : {
                health: 100,
                happiness: 100,
                smarts: Math.floor(Math.random() * 56) + 40,
                looks: Math.floor(Math.random() * 56) + 40
            };
        }

        const savedPurchases = Array.isArray(state.verifiedPurchases)
            ? [...state.verifiedPurchases]
            : [];

        // === 3. DETERMINE ACTIVE SAVE SLOT ===
        let activeSlotId = state.gameState?._slotId || 'slot_1';
        try {
            const store = getSlotsStore();
            if (store && store.activeSlotId) {
                activeSlotId = store.activeSlotId;
            }
        } catch (e) {
            try {
                const rawStore = localStorage.getItem('life_game_slots');
                if (rawStore) {
                    const storeObj = JSON.parse(rawStore);
                    if (storeObj.activeSlotId) activeSlotId = storeObj.activeSlotId;
                }
            } catch (err) {}
        }

        // === 4. BUILD NEW CHARACTER GAME STATE ===
        const userData = {
            username: finalName,
            gender: gender,
            country: country,
            city: city,
            age: 0,
            money: 0,
            debt: 0,
            purchases: savedPurchases,
            health: initialStats.health,
            happiness: initialStats.happiness,
            smarts: initialStats.smarts,
            looks: initialStats.looks,
            karma: 50,
            appearance: draftAppearance,
            relationships: startingFamily,
            assets: [],
            lifeLog: []
        };

        loadAndRenderGame(userData);
        if (state.gameState) {
            state.gameState._slotId = activeSlotId;
        }

        // --- 5. PARENTAGE LOGIC (Newborns only) ---
        const userAge = state.gameState?.user?.age || 0;
        if (userAge === 0 && state.gameState?.user?.relationships) {
            const rels = state.gameState.user.relationships;
            const mother = rels.find(r => r.type === 'Mother');
            const father = rels.find(r => r.type === 'Father');
            const siblings = rels.filter(r => r.type === 'Brother' || r.type === 'Sister').length;

            if (mother && father) {
                addLog(`You were born to ${mother.name} (Age ${mother.age}) and ${father.name} (Age ${father.age}).`, 'neutral');
            } else if (mother) {
                addLog(`You were born to a single mother, ${mother.name} (Age ${mother.age}).`, 'neutral');
            } else if (father) {
                addLog(`You were born to a single father, ${father.name} (Age ${father.age}).`, 'neutral');
            } else {
                addLog(`You were born an orphan with no known parents.`, 'bad');
            }

            if (siblings > 0) {
                addLog(`You have ${siblings} older sibling${siblings > 1 ? 's' : ''}.`, 'neutral');
            }
        }

        // --- 6. SNAPSHOT & SLOT SAVE ---
        if (state.gameState) {
            captureAnnualSnapshot(state.gameState);
            saveToSlot(activeSlotId, finalName);
        }

        // --- 7. CLOUD SYNC FOR AUTHENTICATED USERS ---
        if (state.userAuthId || user) {
            try {
                if (typeof saveGame === 'function') {
                    await saveGame(true);
                } else if (typeof window !== 'undefined' && typeof window.saveGame === 'function') {
                    await window.saveGame(true);
                }
            } catch (cloudErr) {
                console.warn("Cloud save warning during character creation:", cloudErr);
            }
        }

        // --- 8. MOUNT LIFE DASHBOARD ---
        renderLifeDashboard(state.gameState);

    } catch (error) {
        console.error("Creation failed", error);
        UI.showModal("Error", "Failed to create character.");
    }
}

export function maxCreationGodStats() {
    if (!hasPurchasedPack('god_mode')) return;
    ['health', 'happiness', 'smarts', 'looks'].forEach(stat => {
        const input = get(`god-create-${stat}`);
        const val = get(`god-create-${stat}-val`);
        if (input) input.value = 100;
        if (val) val.innerText = '100%';
    });
}