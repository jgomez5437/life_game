import { state } from '../../core/state.js';
import { addLog } from '../player/mainScreen.js';
import { GameLogic } from '../../core/gameLogic.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { renderRelationships } from './relationshipScreen.js';

function checkAndIncrementOutings(user) {
    const count = user.socialOutingsCountThisYear || 0;
    if (count >= 50) {
        UI.showModal('Outings Limit Reached', "You have reached the maximum 50 social outings for this year!");
        return false;
    }
    user.socialOutingsCountThisYear = count + 1;
    return true;
}

// --- MEET PEOPLE / SOCIAL HUB ---
export const openMeetPeopleModal = () => {
    const user = state.gameState.user;
    if (!user.relationships) user.relationships = [];

    if (user.age < 16) {
        UI.showModal('Action Blocked', "You are too young to go out and meet people (Age 16+ required).");
        return;
    }

    if ((user.socialOutingsCountThisYear || 0) >= 50) {
        UI.showModal('Outings Limit Reached', "You have reached the maximum 50 social outings for this year!");
        return;
    }

    const currentPref = user.attractionPreference || (user.gender === 'male' ? 'women' : 'men');
    const nightOutTitle = user.age >= 18 ? "Night Out at Bar & Club" : "Hangout at Local Spot";
    const nightOutIcon = user.age >= 18 ? "fa-glass-cheers text-pink-400" : "fa-mug-hot text-amber-400";

    const html = `
        <div class="fade-in max-w-lg mx-auto min-h-full py-6 px-4 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-4">
                <button data-action="renderRelationships" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Relationships
                </button>
            </div>

            <div class="text-center mb-6">
                <i class="fas fa-users-viewfinder text-5xl text-pink-400 mb-3"></i>
                <h1 class="text-2xl font-bold text-white">Social Hub</h1>
                <p class="text-xs text-slate-400 mt-1">Choose how you want to connect with new people</p>

                <!-- Attraction Preference Toggle -->
                <div class="mt-4 inline-flex bg-slate-800 p-1.5 rounded-xl border border-slate-700 text-xs items-center gap-1">
                    <span class="text-slate-400 font-medium px-2">Interested In:</span>
                    <button data-action="setAttractionPreference" data-args="&apos;women&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'women' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Women</button>
                    <button data-action="setAttractionPreference" data-args="&apos;men&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'men' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Men</button>
                    <button data-action="setAttractionPreference" data-args="&apos;everyone&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'everyone' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Everyone</button>
                </div>
            </div>

            <div class="space-y-3">
                <!-- Option 1: Blind Date -->
                <button data-action="handleBlindDate" class="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-pink-500 p-4 rounded-xl text-left transition flex items-center gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-xl text-pink-400 group-hover:scale-105 transition">
                        <i class="fas fa-heart-circle-bolt"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-white text-base">Go on a Blind Date</span>
                            <span class="text-xs font-bold text-pink-400">$50</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Set up by an acquaintance. High romantic chemistry potential!</p>
                    </div>
                </button>

                <!-- Option 2: Dating App -->
                ${user.age >= 18 ? `
                <button data-action="handleDatingApp" class="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 p-4 rounded-xl text-left transition flex items-center gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400 group-hover:scale-105 transition">
                        <i class="fas fa-mobile-screen-button"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-white text-base">Use Dating App ("LoveSync")</span>
                            <span class="text-xs font-bold text-emerald-400">FREE</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Browse profile matches and swipe on candidates you like!</p>
                    </div>
                </button>
                ` : `
                <div class="w-full bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl text-left opacity-60 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-xl text-slate-500">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-slate-400 text-base">Use Dating App</span>
                            <span class="text-[10px] font-bold text-red-400 uppercase tracking-wide">Age 18+ Required</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">Unlocked when you reach age 18.</p>
                    </div>
                </div>
                `}

                <!-- Option 3: Meet a Friend -->
                <button data-action="handleMeetFriend" class="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 p-4 rounded-xl text-left transition flex items-center gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400 group-hover:scale-105 transition">
                        <i class="fas fa-user-group"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-white text-base">Meet a New Friend</span>
                            <span class="text-xs font-bold text-emerald-400">$30</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Join a local club or hobby meetup focused on making friends.</p>
                    </div>
                </button>

                <!-- Option 4: Night Out -->
                <button data-action="handleNightOut" class="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500 p-4 rounded-xl text-left transition flex items-center gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl ${nightOutIcon} group-hover:scale-105 transition">
                        <i class="fas ${user.age >= 18 ? 'fa-glass-cheers' : 'fa-mug-hot'}"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-white text-base">${nightOutTitle}</span>
                            <span class="text-xs font-bold text-amber-400">$60</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Enjoy a fun outing on the town. Dynamic outcomes!</p>
                    </div>
                </button>

                <!-- Option 5: LuxeMatch Matchmaking -->
                ${user.age >= 18 ? `
                <button data-action="renderLuxeMatchModal" class="luxe-match-card w-full bg-gradient-to-r from-slate-800 to-amber-950/40 hover:to-amber-900/60 border border-amber-500/40 hover:border-amber-400 p-4 rounded-xl text-left transition flex items-center gap-4 group shadow-lg">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl text-amber-300 group-hover:scale-105 transition shadow-sm">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-amber-200 text-base flex items-center gap-1.5">
                                LuxeMatch Matchmaking
                                <span class="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">VIP</span>
                            </span>
                            <span class="text-xs font-bold text-amber-400">$100,000</span>
                        </div>
                        <p class="text-xs text-slate-300 mt-0.5">Elite concierge service. Choose exact age preset & wealth tier!</p>
                    </div>
                </button>
                ` : ''}
            </div>
        </div>
    `;

    UI.renderScreen(html);
};

let selectedLuxeAgePreset = '26-35';
let selectedLuxeWealthTier = 'wealthy';

export const selectLuxeAgePreset = (preset) => {
    selectedLuxeAgePreset = preset;
    renderLuxeMatchModal();
};

export const selectLuxeWealthTier = (tier) => {
    selectedLuxeWealthTier = tier;
    renderLuxeMatchModal();
};

export const renderLuxeMatchModal = () => {
    const user = state.gameState.user;
    if (user.age < 18) {
        UI.showModal('Age Limit', "You must be at least 18 to access LuxeMatch Matchmaking.");
        return;
    }

    const currentPref = user.attractionPreference || (user.gender === 'male' ? 'women' : 'men');

    const agePresets = ['18-25', '26-35', '36-45', '46-60', '60+'];
    const ageButtonsHtml = agePresets.map(preset => {
        const active = selectedLuxeAgePreset === preset;
        const btnBg = active ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md scale-105' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white';
        return `<button data-action="selectLuxeAgePreset" data-args="&apos;${preset}&apos;" class="px-3 py-2 rounded-xl text-xs font-bold border transition ${btnBg}">${preset}</button>`;
    }).join('');

    const wealthTiers = [
        { key: 'high_earner', title: 'High Earner', desc: '$100,000 – $250,000 / yr', icon: 'fa-gem text-blue-400' },
        { key: 'wealthy', title: 'Wealthy Executive', desc: '$250,000 – $500,000 / yr', icon: 'fa-crown text-amber-400' },
        { key: 'ultra_wealthy', title: 'Ultra-Elite', desc: '$500,000 – $2,500,000+ / yr', icon: 'fa-sack-dollar text-emerald-400' }
    ];

    const wealthHtml = wealthTiers.map(t => {
        const active = selectedLuxeWealthTier === t.key;
        const borderClass = active ? 'luxe-wealth-active border-amber-400 bg-amber-500/10 shadow-md' : 'border-slate-700 bg-slate-800/80 hover:border-slate-600';
        return `
            <div data-action="selectLuxeWealthTier" data-args="&apos;${t.key}&apos;" class="p-3.5 rounded-xl border ${borderClass} cursor-pointer transition flex items-center justify-between group">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-base border border-slate-700">
                        <i class="fas ${t.icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-sm">${t.title}</div>
                        <div class="text-xs text-slate-400 font-medium">${t.desc}</div>
                    </div>
                </div>
                <div class="w-5 h-5 rounded-full border border-amber-400/60 flex items-center justify-center">
                    ${active ? '<div class="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>' : ''}
                </div>
            </div>
        `;
    }).join('');

    const canAfford = (user.money || 0) >= 100000;
    const btnDisabled = !canAfford ? 'disabled opacity-50 cursor-not-allowed' : 'hover:bg-amber-400 hover:scale-[1.02] shadow-amber-900/30';

    const html = `
        <div class="fade-in max-w-md mx-auto min-h-full py-6 px-4 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-4">
                <button data-action="openMeetPeopleModal" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Social Hub
                </button>
                <span class="text-xs text-amber-400 font-bold tracking-wider uppercase flex items-center gap-1">
                    <i class="fas fa-crown text-xs"></i> LuxeMatch
                </span>
            </div>

            <div class="text-center mb-5">
                <h1 class="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <i class="fas fa-gem text-amber-400"></i> Elite Matchmaking
                </h1>
                <p class="text-xs text-slate-400 mt-1">Specify your preferences for a guaranteed high-status match</p>

                <!-- Preference selector -->
                <div class="mt-3 inline-flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs items-center gap-1">
                    <span class="text-slate-400 font-medium px-2">Interested In:</span>
                    <button data-action="setAttractionPreference" data-args="&apos;women&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'women' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Women</button>
                    <button data-action="setAttractionPreference" data-args="&apos;men&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'men' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Men</button>
                    <button data-action="setAttractionPreference" data-args="&apos;everyone&apos;" class="px-2.5 py-1 rounded-lg font-bold transition ${currentPref === 'everyone' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Everyone</button>
                </div>
            </div>

            <div class="space-y-4">
                <!-- Age Preset Chips -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Target Age Preset</label>
                    <div class="flex flex-wrap gap-2 justify-center">
                        ${ageButtonsHtml}
                    </div>
                </div>

                <!-- Wealth Tiers -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Wealth & Status Tier</label>
                    <div class="space-y-2">
                        ${wealthHtml}
                    </div>
                </div>

                <!-- Pricing & Action -->
                <div class="luxe-fee-card bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 text-center mt-2">
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Concierge Match Fee</div>
                    <div class="text-2xl font-bold text-amber-400">${Utils.formatMoney(100000)}</div>
                    ${!canAfford ? '<div class="text-xs text-red-400 font-bold mt-1">Insufficient Funds (You need $100,000)</div>' : ''}
                </div>

                <button data-action="confirmLuxeMatch" ${!canAfford ? 'disabled' : ''} class="luxe-action-btn w-full btn-primary bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition ${btnDisabled}">
                    <i class="fas fa-crown text-base"></i> Find Luxury Match (-${Utils.formatMoney(100000)})
                </button>
            </div>
        </div>
    `;

    UI.renderScreen(html);
};

export const confirmLuxeMatch = () => {
    const user = state.gameState.user;
    if ((user.money || 0) < 100000) {
        UI.showModal('Insufficient Funds', "You need $100,000 for LuxeMatch concierge service.");
        return;
    }

    if (!checkAndIncrementOutings(user)) return;

    user.money -= 100000;

    const match = GameLogic.generateLuxuryMatch(user, {
        agePreset: selectedLuxeAgePreset,
        wealthTier: selectedLuxeWealthTier,
        genderPreference: user.attractionPreference
    });

    if (!user.relationships) user.relationships = [];
    user.relationships.push(match);

    addLog(`You paid ${Utils.formatMoney(100000)} to LuxeMatch and was introduced to ${match.name} (${match.occupation}, ${Utils.formatMoney(match.income)}/yr).`, 'major');
    UI.updateHeader(user);

    const matchModalHtml = `
        <div class="text-center py-2">
            <div class="w-20 h-20 mx-auto rounded-full bg-slate-700 border-2 border-amber-400 overflow-hidden mb-3 shadow-lg flex items-center justify-center">
                ${renderAvatar(match)}
            </div>
            <h3 class="text-xl font-bold text-white mb-0.5">${Utils.escapeHtml(match.name)}, <span class="text-amber-400">${match.age}</span></h3>
            <div class="text-xs font-bold text-slate-300 mb-2">${Utils.escapeHtml(match.occupation)}</div>
            <div class="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                Annual Income: ${Utils.formatMoney(match.income)}/yr
            </div>
            <p class="text-xs text-slate-400 mb-2">You exchanged contacts and hit it off immediately with incredible chemistry!</p>
        </div>
    `;

    UI.showModal('💎 LuxeMatch Match Found!', matchModalHtml);
    renderRelationships();
};

export const setAttractionPreference = (pref) => {
    const user = state.gameState.user;
    user.attractionPreference = pref;
    openMeetPeopleModal();
};

export const handleBlindDate = () => {
    const user = state.gameState.user;
    if ((user.money || 0) < 50) {
        UI.showModal('Insufficient Funds', "You need $50 for a blind date.");
        return;
    }

    if (!checkAndIncrementOutings(user)) return;
    user.money -= 50;

    const roll = Math.random();
    if (roll < 0.70) {
        const datePerson = GameLogic.generateTargetedStranger(user, 'romantic');
        user.relationships.push(datePerson);
        addLog(`You went on a blind date with ${datePerson.name}. You had fantastic chemistry!`, 'good');
        UI.updateHeader(user);
        UI.showModal('Great Date! 💕', `You went on a blind date with ${Utils.escapeHtml(datePerson.name)} (Age ${datePerson.age}). The conversation flowed effortlessly and you exchanged numbers!`);
    } else if (roll < 0.90) {
        const datePerson = GameLogic.generateTargetedStranger(user, 'romantic');
        datePerson.status = 25;
        user.relationships.push(datePerson);
        addLog(`You went on a blind date with ${datePerson.name}. It was a bit awkward, but you exchanged contacts.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal('Awkward Date 😅', `Your date with ${Utils.escapeHtml(datePerson.name)} had some quiet silences, but you agreed to stay in touch.`);
    } else {
        addLog(`You went to the restaurant for your blind date, but you were stood up!`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Stood Up 💔', `Your blind date never showed up. At least you enjoyed a nice meal by yourself.`);
    }

    renderRelationships();
};

export const handleDatingApp = () => {
    const user = state.gameState.user;
    if (user.age < 18) {
        UI.showModal('Age Limit', "You must be at least 18 to use Dating Apps.");
        return;
    }
    if ((user.socialOutingsCountThisYear || 0) >= 50) {
        UI.showModal('Outings Limit Reached', "You have reached the maximum 50 social outings for this year!");
        return;
    }

    const profiles = GameLogic.generateDatingProfiles(user, 3);
    state.currentDatingProfiles = profiles;

    renderDatingAppModal(profiles);
};

export const renderDatingAppModal = (profiles) => {
    const user = state.gameState.user;
    const cardsHtml = profiles.map((p) => {
        return `
            <div class="bg-slate-800 border border-slate-700 hover:border-pink-500/50 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition group">
                <div>
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-14 h-14 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600">
                            ${renderAvatar(p)}
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-lg leading-tight">${Utils.escapeHtml(p.name)}, <span class="text-pink-400 font-normal">${p.age}</span></h3>
                            <div class="text-xs text-slate-400 font-medium">${Utils.escapeHtml(p.occupation)}</div>
                        </div>
                    </div>

                    <div class="bg-slate-900/60 p-3 rounded-xl mb-3 border border-slate-750">
                        <p class="text-xs italic text-slate-300">"${Utils.escapeHtml(p.bio)}"</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${p.hobbies.map(h => `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20"># ${Utils.escapeHtml(h)}</span>`).join('')}
                    </div>
                </div>

                <button data-action="selectDatingAppMatch" data-args="&apos;${Utils.escapeHtml(p.id)}&apos;" class="w-full btn-primary bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-900/20 transition">
                    <i class="fas fa-heart"></i> Swipe Right / Message
                </button>
            </div>
        `;
    }).join('');

    const html = `
        <div class="fade-in max-w-md mx-auto min-h-full py-6 px-4 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-4">
                <button data-action="openMeetPeopleModal" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Social Hub
                </button>
                <span class="text-xs text-pink-400 font-bold tracking-wider uppercase"><i class="fas fa-fire mr-1"></i> LoveSync App</span>
            </div>

            <div class="text-center mb-5">
                <h1 class="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <i class="fas fa-mobile-screen text-pink-400"></i> LoveSync Matches
                </h1>
                <p class="text-xs text-slate-400 mt-1">Select a profile to send a match request!</p>
            </div>

            <div class="space-y-4">
                ${cardsHtml}
            </div>

            <button data-action="handleDatingApp" class="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition">
                <i class="fas fa-arrows-rotate mr-1"></i> Refresh Matches
            </button>
        </div>
    `;

    UI.renderScreen(html);
};

export const selectDatingAppMatch = (profileId) => {
    const user = state.gameState.user;
    const profiles = state.currentDatingProfiles || [];
    const matchedProfile = profiles.find(p => p.id === profileId);

    if (!matchedProfile) {
        openMeetPeopleModal();
        return;
    }

    if (!checkAndIncrementOutings(user)) return;

    const isMatch = Math.random() < (matchedProfile.matchChance || 0.75);

    if (isMatch) {
        const newRel = {
            id: matchedProfile.id,
            name: matchedProfile.name,
            age: matchedProfile.age,
            gender: matchedProfile.gender,
            type: 'Crush',
            status: Math.floor(Math.random() * 16) + 45,
            category: 'friend',
            occupation: matchedProfile.occupation,
            appearance: matchedProfile.appearance,
            interactedThisYear: false
        };
        if (!user.relationships) user.relationships = [];
        user.relationships.push(newRel);
        addLog(`It's a Match! You matched with ${matchedProfile.name} on LoveSync.`, 'good');
        UI.updateHeader(user);
        UI.showModal("It's a Match! 💕", `You and ${Utils.escapeHtml(matchedProfile.name)} matched on LoveSync! They were added to your relationships.`);
    } else {
        addLog(`You messaged ${matchedProfile.name} on LoveSync, but they didn't match back.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal('Left on Read 💔', `You sent a message to ${Utils.escapeHtml(matchedProfile.name)}, but they didn't match back. Don't worry, there are plenty more fish in the sea!`);
    }

    renderRelationships();
};

export const handleMeetFriend = () => {
    const user = state.gameState.user;
    if ((user.money || 0) < 30) {
        UI.showModal('Insufficient Funds', "You need $30 to attend a local meetup.");
        return;
    }

    if (!checkAndIncrementOutings(user)) return;
    user.money -= 30;

    const friend = GameLogic.generateTargetedStranger(user, 'friend');
    if (!user.relationships) user.relationships = [];
    user.relationships.push(friend);

    addLog(`You attended a local meetup and became friends with ${friend.name}.`, 'good');
    UI.updateHeader(user);
    UI.showModal('New Friend! 🤝', `You met ${Utils.escapeHtml(friend.name)} (Age ${friend.age}) at a local hobby group! You exchanged contact info.`);
    renderRelationships();
};

export const handleNightOut = () => {
    const user = state.gameState.user;
    if ((user.money || 0) < 60) {
        UI.showModal('Insufficient Funds', "You need $60 for a night out.");
        return;
    }

    if (!checkAndIncrementOutings(user)) return;
    user.money -= 60;

    const roll = Math.random();
    if (roll < 0.40) {
        const datePerson = GameLogic.generateTargetedStranger(user, 'romantic');
        if (!user.relationships) user.relationships = [];
        user.relationships.push(datePerson);
        addLog(`You had a great night out and met ${datePerson.name}, who seems very interested in you!`, 'good');
        UI.updateHeader(user);
        UI.showModal('Met Someone Special! 🍸', `During your night out, you hit it off with ${Utils.escapeHtml(datePerson.name)} (Age ${datePerson.age})!`);
    } else if (roll < 0.70) {
        const friend = GameLogic.generateTargetedStranger(user, 'friend');
        if (!user.relationships) user.relationships = [];
        user.relationships.push(friend);
        addLog(`You went out and made a new friend, ${friend.name}!`, 'good');
        UI.updateHeader(user);
        UI.showModal('New Friend! 🍻', `You had a fun night out and bonded with ${Utils.escapeHtml(friend.name)} (Age ${friend.age})!`);
    } else if (roll < 0.90) {
        GameLogic.adjustStat(user, 'happiness', 10);
        addLog(`You had an awesome night out enjoying food, music, and atmosphere (+10 Happiness).`, 'good');
        UI.updateHeader(user);
        UI.showModal('Great Night Out! 🎉', `You had a fantastic night out unwinding and having fun! (+10 Happiness)`);
    } else {
        GameLogic.adjustStat(user, 'health', -5);
        GameLogic.adjustStat(user, 'happiness', 5);
        addLog(`Your night out got a little chaotic after a heated argument, but you made it home safely (-5 Health).`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Chaotic Night 😅', `Things got a little rowdy during your night out! You got bumped around (-5 Health), but still had a story to tell.`);
    }

    renderRelationships();
};

export const goOutMeetSomeone = () => {
    openMeetPeopleModal();
};
