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
let previewAge = 25; // 6 (Child) | 25 (Adult) | 68 (Senior)
let activeCategory = 'face'; // 'face' | 'hair' | 'eyes' | 'style'
let activeTab = 'identity'; // 'identity' | 'face' | 'hair' | 'eyes' | 'style' | 'god_mode'

export function updateOriginSummary() {
    const summaryEl = get('avatar-origin-summary');
    if (!summaryEl) return;

    const selectedCountry = get('inp-country') ? get('inp-country').value : 'United States';
    const selectedCity = get('inp-city') ? get('inp-city').value : 'New York';
    const genderLabel = selectedGender === 'female' ? 'Female' : 'Male';
    const genderIcon = selectedGender === 'female'
        ? '<i class="fas fa-venus text-pink-400 text-[11px]"></i>'
        : '<i class="fas fa-mars text-blue-400 text-[11px]"></i>';

    const currInfo = (typeof Utils !== 'undefined' && typeof Utils.getCurrencyInfo === 'function')
        ? Utils.getCurrencyInfo(selectedCity)
        : { currency: 'USD', symbol: '$', code: 'us' };

    const flagImg = currInfo.code
        ? `<img src="https://flagcdn.com/w20/${currInfo.code}.png" width="14" alt="${Utils.escapeHtml(selectedCity)}" class="inline-block rounded-sm shadow-sm ml-1" style="vertical-align: middle;">`
        : '';

    summaryEl.innerHTML = `
        <span class="inline-flex items-center gap-1 font-medium text-slate-300">${genderIcon}<span>${genderLabel}</span></span>
        <span class="text-slate-600">&bull;</span>
        <span class="truncate">${Utils.escapeHtml(selectedCity)}, ${Utils.escapeHtml(selectedCountry)}${flagImg}</span>
    `;
}

export function updateLocationEconBadge(cityName) {
    const selectedCity = (typeof cityName === 'string' && cityName ? cityName : null) || (get('inp-city') ? get('inp-city').value : 'New York');
    updateOriginSummary();
    const badgeEl = get('location-econ-badge');
    if (!badgeEl) return;

    const currInfo = (typeof Utils !== 'undefined' && typeof Utils.getCurrencyInfo === 'function')
        ? Utils.getCurrencyInfo(selectedCity)
        : { currency: 'USD', symbol: '$', code: 'us' };
    const mult = (typeof GameLogic !== 'undefined' && typeof GameLogic.getCityCostMultiplier === 'function')
        ? GameLogic.getCityCostMultiplier(selectedCity)
        : 1.0;

    const multFormatted = `${parseFloat(mult.toFixed(2))}x`;
    const tierLabel = mult >= 1.2
        ? 'High Salaries & Living Cost'
        : (mult <= 0.8 ? 'Low Living Cost & Salaries' : 'Moderate Cost & Salaries');
    const tierColor = mult >= 1.2
        ? 'text-amber-400'
        : (mult <= 0.8 ? 'text-emerald-400' : 'text-blue-400');

    const flagImg = currInfo.code
        ? `<img src="https://flagcdn.com/w20/${currInfo.code}.png" width="16" alt="${Utils.escapeHtml(selectedCity)}" class="inline-block rounded-sm shadow-sm mr-1.5" style="vertical-align: middle;">`
        : '';

    badgeEl.innerHTML = `
        <div class="flex items-center gap-1.5 text-slate-300 font-semibold">
            ${flagImg}
            <span>${Utils.escapeHtml(currInfo.currency)} (${Utils.escapeHtml(currInfo.symbol)})</span>
        </div>
        <div class="text-[11px] font-bold ${tierColor}">
            <i class="fas fa-chart-line mr-1 text-[10px]"></i>${multFormatted} • ${tierLabel}
        </div>
    `;
}

export function updateCityDropdown(countryName) {
    const selectedCountry = (typeof countryName === 'string' ? countryName : null) || (get('inp-country') ? get('inp-country').value : 'United States');
    const countryObj = COUNTRIES_DATA.find(c => c.name === selectedCountry) || COUNTRIES_DATA[0];
    const citySelect = get('inp-city');
    if (citySelect) {
        citySelect.innerHTML = countryObj.cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    updateLocationEconBadge(countryObj.cities[0]);
}

// --- COMPLETION TABS & APPEARANCE CATALOGS ---
export function getCompletionTabs() {
    const tabs = [
        { id: 'identity', label: 'Identity', icon: 'fa-id-card' },
        { id: 'face', label: 'Face', icon: 'fa-user' },
        { id: 'hair', label: 'Hair', icon: 'fa-scissors' },
        { id: 'eyes', label: 'Eyes', icon: 'fa-eye' },
        { id: 'style', label: 'Style', icon: 'fa-glasses' }
    ];
    if (hasPurchasedPack('god_mode')) {
        tabs.push({ id: 'god_mode', label: 'God Mode', icon: 'fa-bolt' });
    }
    return tabs;
}

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
    activeTab = tabId;
    const tabs = getCompletionTabs();
    tabs.forEach(t => {
        const btn = get(`tab-btn-${t.id}`);
        if (btn) {
            if (t.id === activeTab) {
                btn.className = "flex-1 min-w-[68px] py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm";
            } else {
                btn.className = "flex-1 min-w-[68px] py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70";
            }
        }
        const panel = get(`panel-${t.id}`);
        if (panel) {
            if (t.id === activeTab) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        }
    });
}

function updateAvatarPreview() {
    previewVersion++;
    const preview = get('avatar-preview');
    if (preview) {
        preview.innerHTML = renderAvatar({
            id: 'char-creation-preview',
            age: previewAge,
            appearance: draftAppearance,
            avatarVersion: previewVersion
        });
    }
    const ageBtn = get('avatar-age-preview-btn');
    if (ageBtn) {
        const stageLabel = previewAge < 13 ? 'Child' : (previewAge >= 60 ? 'Senior' : 'Adult');
        ageBtn.innerHTML = `<i class="fas fa-clock text-blue-400 text-[10px]"></i><span>Age ${previewAge} (${stageLabel})</span>`;
    }
}

export function cyclePreviewAge() {
    if (previewAge === 25) {
        previewAge = 68;
    } else if (previewAge === 68) {
        previewAge = 6;
    } else {
        previewAge = 25;
    }
    updateAvatarPreview();
}

export function pickTraitOption(key, value) {
    if (!draftAppearance) return;
    draftAppearance[key] = value;
    updateAvatarPreview();
    renderAppearancePanels();
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
    updateAvatarPreview();
    renderAppearancePanels();
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
    updateAvatarPreview();
    renderAppearancePanels();
}

export function randomizeAllTraits() {
    draftAppearance = AvatarLogic.generateRandomAppearance('draft-' + Math.random(), selectedGender);
    updateAvatarPreview();
    renderAppearancePanels();
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
            <div class="py-3 first:pt-0 last:pb-0">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-300">${label}</span>
                    <span class="text-xs font-medium text-slate-400">${labelize(currentValue)}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    ${options.map(opt => {
                        const isSelected = currentValue === opt;
                        if (opt === 'none') {
                            return `
                                <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all text-[10px] font-bold ${isSelected ? 'border-blue-400 bg-slate-800 text-blue-400 ring-2 ring-blue-400/40' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:text-slate-300'}"
                                    title="None">
                                    <i class="fas fa-ban"></i>
                                </button>
                            `;
                        }
                        if (opt === 'matchHair') {
                            return `
                                <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                    class="px-2.5 h-7 sm:h-8 rounded-lg border flex items-center justify-center transition-all text-xs font-semibold ${isSelected ? 'border-blue-500 bg-blue-600 text-white shadow-sm' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'}"
                                    title="Match Hair Color">
                                    <i class="fas fa-magic mr-1 text-[10px]"></i> Match Hair
                                </button>
                            `;
                        }
                        const hex = (f.hexMap && f.hexMap[opt]) ? f.hexMap[opt] : (AvatarLogic.HAIR_COLOR_HEX[opt] || '#888888');
                        return `
                            <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all relative ${isSelected ? 'border-white ring-2 ring-blue-400 scale-105 shadow-sm' : 'border-slate-800 hover:border-slate-500'}"
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

    // Style / Shape field with Selectable Option Pills/Chips
    return `
        <div class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-300">${label}</span>
                <span class="text-xs font-medium text-slate-400">${labelize(currentValue)}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${options.map(opt => {
                    const isSelected = currentValue === opt;
                    return `
                        <button type="button" data-action="pickTraitOption" data-args="'${f.key}', '${opt}'"
                            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${isSelected ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : 'bg-slate-900 hover:bg-slate-700/70 text-slate-300 border-slate-700 hover:border-slate-600'}">
                            ${labelize(opt)}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderAppearancePanels() {
    const wrapper = get('appearance-panels-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = ['face', 'hair', 'eyes', 'style'].map(catId => {
        const section = APPEARANCE_SECTIONS.find(s => s.category === catId);
        if (!section) return '';
        const isHidden = activeTab !== catId;
        return `
            <div id="panel-${catId}" class="${isHidden ? 'hidden' : ''}">
                <div class="divide-y divide-slate-700/60">
                    ${section.fields.filter(f => {
                        if (f.genderLimit && f.genderLimit !== selectedGender) return false;
                        if (f.dependsOn && draftAppearance[f.dependsOn] === 'none') return false;
                        return true;
                    }).map(f => renderFieldControl(f)).join('')}
                </div>

                <div class="pt-3 mt-3 border-t border-slate-700/60 flex justify-end">
                    <button type="button" data-action="randomizeSection" data-args="'${section.category}'" class="text-xs font-semibold text-slate-400 hover:text-blue-300 transition flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-slate-700">
                        <i class="fas fa-dice text-blue-400"></i>
                        <span>Randomize ${section.title}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export const renderCharCreation = () => {
    if (typeof window !== 'undefined') {
        window.renderCharCreation = renderCharCreation;
    }
    UI.resetHeader();
    draftAppearance = AvatarLogic.generateRandomAppearance('draft-' + Math.random(), selectedGender);
    previewAge = 25;
    activeTab = 'identity';

    const tabs = getCompletionTabs();

    const creationHTML = `
        <div class="fade-in max-w-xl mx-auto px-3 sm:px-4 py-2">
            <!-- Compact Horizontal Character Profile Card -->
            <div id="avatar-stage-card" class="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center gap-3.5 sm:gap-4 mb-3.5">
                <!-- Framed Avatar Portrait (No Zoom) -->
                <div id="avatar-preview-container" class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                    <div id="avatar-preview" class="w-full h-full flex items-center justify-center"></div>
                </div>

                <!-- Right Column: Live Name, Origin Summary & Quick Controls -->
                <div class="flex-1 min-w-0">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">New Character</div>
                    <h2 id="desktop-avatar-name" class="text-base sm:text-lg font-extrabold text-white truncate leading-tight">New Life</h2>
                    <div id="avatar-origin-summary" class="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5"></div>

                    <div class="mt-2.5 flex flex-wrap items-center gap-2">
                        <button type="button" id="avatar-age-preview-btn" data-action="cyclePreviewAge" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition flex items-center gap-1.5" title="Cycle preview age (Child, Adult, Senior)">
                            <i class="fas fa-clock text-blue-400 text-[10px]"></i><span>Age 25 (Adult)</span>
                        </button>
                        <button type="button" data-action="randomizeAllTraits" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-semibold transition flex items-center gap-1.5" title="Randomize Appearance">
                            <i class="fas fa-dice text-blue-400 text-xs"></i>
                            <span>Randomize</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Section Tabs Bar -->
            <div class="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3.5 overflow-x-auto select-none no-scrollbar">
                ${tabs.map(tab => `
                    <button type="button" id="tab-btn-${tab.id}" data-action="setCharTab" data-args="'${tab.id}'"
                        class="flex-1 min-w-[68px] py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'}">
                        <i class="fas ${tab.icon} text-xs"></i>
                        <span>${tab.label}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Tab Panels Container -->
            <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg">
                
                <!-- Panel 1: Identity & Origin -->
                <div id="panel-identity" class="${activeTab === 'identity' ? '' : 'hidden'} space-y-4">
                    <!-- Full Name with Random Dice Button -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                        <div class="relative flex items-center">
                            <input type="text" id="inp-name" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-11 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition text-sm" placeholder="First and Last Name">
                            <button type="button" data-action="randomizePlayerName" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 hover:text-blue-300 border border-slate-700 flex items-center justify-center transition" title="Generate Random Name">
                                <i class="fas fa-dice text-sm"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Gender Selector -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Gender</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" data-action="selectGender" data-args="&apos;male&apos;" id="btn-male" class="py-2.5 px-3 rounded-xl border border-blue-500 bg-blue-900/30 text-blue-200 font-semibold text-sm flex items-center justify-center gap-2 transition">
                                <i class="fas fa-mars text-blue-400"></i> Male
                            </button>
                            <button type="button" data-action="selectGender" data-args="&apos;female&apos;" id="btn-female" class="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 transition hover:border-slate-600">
                                <i class="fas fa-venus text-pink-400"></i> Female
                            </button>
                        </div>
                    </div>

                    <!-- Birth Location -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Birth Country</label>
                            <select id="inp-country" data-action="updateCityDropdown" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 transition text-sm">
                                ${COUNTRIES_DATA.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Birth City</label>
                            <select id="inp-city" data-action="updateLocationEconBadge" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 transition text-sm">
                            </select>
                        </div>
                    </div>

                    <!-- Live Economic Context Badge -->
                    <div id="location-econ-badge" class="bg-slate-900 border border-slate-700/70 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"></div>
                </div>

                <!-- Dynamic Appearance Panels (Face, Hair, Eyes, Style) -->
                <div id="appearance-panels-wrapper"></div>

                <!-- Panel: God Mode Stat Tuning (If Entitled) -->
                ${hasPurchasedPack('god_mode') ? `
                    <div id="panel-god_mode" class="${activeTab === 'god_mode' ? '' : 'hidden'} space-y-4">
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
            </div>

            <!-- Start Life CTA Button at Bottom -->
            <div class="pt-4 pb-6">
                <button type="button" id="btn-start-life" data-action="submitCharacter" class="w-full btn-life text-white font-bold py-3.5 rounded-xl text-base sm:text-lg shadow-lg active:scale-98 transition flex items-center justify-center gap-2">
                    <span>Start Life</span>
                    <i class="fas fa-arrow-right text-sm"></i>
                </button>
            </div>
        </div>
    `;

    UI.renderScreen(creationHTML);
    updateAvatarPreview();
    renderAppearancePanels();
    setCharTab('identity');
    updateCityDropdown('United States');
    randomizePlayerName();

    // Real-time name listener for live header update
    const nameInput = get('inp-name');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim() || 'New Life';
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
            btnMale.className = "py-2.5 px-3 rounded-xl border border-blue-500 bg-blue-900/30 text-blue-200 font-semibold text-sm flex items-center justify-center gap-2 transition";
            btnFemale.className = "py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 transition hover:border-slate-600";
        } else {
            btnMale.className = "py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 transition hover:border-slate-600";
            btnFemale.className = "py-2.5 px-3 rounded-xl border border-pink-500 bg-pink-900/30 text-pink-200 font-semibold text-sm flex items-center justify-center gap-2 transition";
        }
    }
    updateOriginSummary();
    updateAvatarPreview();
    renderAppearancePanels();
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