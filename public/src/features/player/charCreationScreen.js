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

export function updateCityDropdown(countryName) {
    const selectedCountry = (typeof countryName === 'string' ? countryName : null) || (get('inp-country') ? get('inp-country').value : 'United States');
    const countryObj = COUNTRIES_DATA.find(c => c.name === selectedCountry) || COUNTRIES_DATA[0];
    const citySelect = get('inp-city');
    if (citySelect) {
        citySelect.innerHTML = countryObj.cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// --- APPEARANCE DRAFT (character creation only; final pick is stored on submit) ---
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

let draftAppearance = null;
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

function renderAppearancePanel() {
    const preview = get('avatar-preview');
    if (preview) {
        previewVersion++;
        preview.innerHTML = renderAvatar({ id: 'char-creation-preview', age: 25, appearance: draftAppearance, avatarVersion: previewVersion });
    }

    const panel = get('appearance-panel');
    if (!panel) return;
    panel.innerHTML = APPEARANCE_SECTIONS.map(section => `
        <div class="mb-3">
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">${section.title}</div>
            ${section.fields.map(f => `
                <div class="flex items-center justify-between bg-slate-900 rounded-lg px-1 py-1.5 mb-1">
                    <button data-action="cycleTrait" data-args="'${f.key}', -1" class="text-slate-400 hover:text-white w-8 h-8"><i class="fas fa-chevron-left"></i></button>
                    <div class="flex-1 text-center text-xs text-slate-300">${labelize(f.key)}: <span class="text-blue-300 font-bold">${labelize(draftAppearance[f.key])}</span></div>
                    <button data-action="cycleTrait" data-args="'${f.key}', 1" class="text-slate-400 hover:text-white w-8 h-8"><i class="fas fa-chevron-right"></i></button>
                </div>
            `).join('')}
            <button data-action="randomizeSection" data-args="'${section.title}'" class="text-[11px] text-slate-500 hover:text-white transition">
                <i class="fas fa-dice mr-1"></i>Randomize ${section.title}
            </button>
        </div>
    `).join('');
}

export function cycleTrait(key, direction) {
    const field = findField(key);
    if (!field || !draftAppearance) return;
    let options = field.options;
    if (key === 'hairStyle' && selectedGender === 'female') {
        options = AvatarLogic.FEMALE_HAIR_STYLES;
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

export function randomizeSection(title) {
    const section = APPEARANCE_SECTIONS.find(s => s.title === title);
    if (!section || !draftAppearance) return;
    section.fields.forEach(f => {
        let options = f.options;
        if (f.key === 'hairStyle' && selectedGender === 'female') {
            options = AvatarLogic.FEMALE_HAIR_STYLES;
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

export const renderCharCreation = () => {
    if (typeof window !== 'undefined') {
        window.renderCharCreation = renderCharCreation;
    }
    UI.resetHeader();
    draftAppearance = AvatarLogic.generateRandomAppearance('draft-' + Math.random(), selectedGender);

    const creationHTML = `
            <div class="fade-in max-w-md mx-auto">
                <div class="text-center pt-2 mb-6">
                    <i class="fas fa-baby text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-3xl font-bold">New Life</h2>
                    <p class="text-slate-400">Design your destiny.</p>
                </div>

                <!-- Sticky so the live preview stays visible while cycling traits below on small screens -->
                <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-lg rounded-lg px-3 py-3 mb-4 flex items-center gap-3">
                    <div id="avatar-preview" class="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 overflow-hidden flex-shrink-0"></div>
                    <button data-action="randomizeAllTraits" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition">
                        <i class="fas fa-dice mr-1"></i> Randomize All
                    </button>
                </div>

                <div class="pb-6">
                    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Full Name</label>
                            <input type="text" id="inp-name" class="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none" placeholder="First and Last Name">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Gender</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button data-action="selectGender" data-args="&apos;male&apos;" id="btn-male" class="p-3 rounded border border-blue-500 bg-blue-900/30 text-blue-200">Male</button>
                                <button data-action="selectGender" data-args="&apos;female&apos;" id="btn-female" class="p-3 rounded border border-slate-600 bg-slate-900 text-slate-400">Female</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Birth Country</label>
                            <select id="inp-country" data-action="updateCityDropdown" class="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none">
                                ${COUNTRIES_DATA.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Birth City</label>
                            <select id="inp-city" class="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none">
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-2">Appearance</label>
                            <div id="appearance-panel"></div>
                        </div>

                        ${hasPurchasedPack('god_mode') ? `
                            <!-- God Mode Stat Tuning (Paid Entitlement Only) -->
                            <div class="bg-slate-900/90 border border-amber-500/40 p-4 rounded-xl space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                                        <i class="fas fa-bolt"></i> God Mode Stat Tuning
                                    </span>
                                    <button type="button" data-action="maxCreationGodStats" class="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold transition">
                                        Max All (100%)
                                    </button>
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Health</span>
                                        <span id="god-create-health-val" class="text-emerald-400">100%</span>
                                    </div>
                                    <input type="range" id="god-create-health" min="0" max="100" value="100" oninput="document.getElementById('god-create-health-val').innerText = this.value + '%'" class="w-full accent-emerald-500">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Happiness</span>
                                        <span id="god-create-happiness-val" class="text-amber-400">100%</span>
                                    </div>
                                    <input type="range" id="god-create-happiness" min="0" max="100" value="100" oninput="document.getElementById('god-create-happiness-val').innerText = this.value + '%'" class="w-full accent-amber-400">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Smarts</span>
                                        <span id="god-create-smarts-val" class="text-blue-400">100%</span>
                                    </div>
                                    <input type="range" id="god-create-smarts" min="0" max="100" value="100" oninput="document.getElementById('god-create-smarts-val').innerText = this.value + '%'" class="w-full accent-blue-500">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-bold mb-1">
                                        <span>Looks</span>
                                        <span id="god-create-looks-val" class="text-pink-400">100%</span>
                                    </div>
                                    <input type="range" id="god-create-looks" min="0" max="100" value="100" oninput="document.getElementById('god-create-looks-val').innerText = this.value + '%'" class="w-full accent-pink-500">
                                </div>
                            </div>
                        ` : ''}

                        <button data-action="submitCharacter" class="w-full btn-life text-white font-bold py-4 rounded-xl text-lg mt-4">
                            Start Life
                        </button>
                    </div>
                </div>
            </div>
        `;
        UI.renderScreen(creationHTML);
        renderAppearancePanel();
        updateCityDropdown('United States');
    }

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
    if(g === 'male') {
        get('btn-male').className = "p-3 rounded border border-blue-500 bg-blue-900/30 text-blue-200";
        get('btn-female').className = "p-3 rounded border border-slate-600 bg-slate-900 text-slate-400";
    } else {
        get('btn-male').className = "p-3 rounded border border-slate-600 bg-slate-900 text-slate-400";
        get('btn-female').className = "p-3 rounded border border-pink-500 bg-pink-900/30 text-pink-200";
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
                    await saveGame();
                } else if (typeof window !== 'undefined' && typeof window.saveGame === 'function') {
                    await window.saveGame();
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