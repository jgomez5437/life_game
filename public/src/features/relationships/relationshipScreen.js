import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { GameLogic } from '../../core/gameLogic.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

// --- ADD NEW RELATIONSHIP GLOBAL METHOD ---
// Call this function when befriending someone at school, work, etc.
export const addNewRelationship = (name, age, type, status, category = 'friend') => {
    const user = state.gameState.user;
    if (!user.relationships) user.relationships = [];

    // Auto-categorize non-relatives immediately upon creation
    let finalCategory = category;
    let finalType = type;
    
    if (!['family', 'spouse', 'child'].includes(finalCategory)) {
        if (status < 30) {
            finalCategory = 'enemy';
            finalType = 'Enemy';
        } else {
            finalCategory = 'friend';
            if (finalType === 'Enemy') finalType = 'Friend';
        }
    }

    // Use crypto for unique IDs to prevent rendering collisions
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.floor(Math.random() * 1000);
    const occ = GameLogic.generateNPCOccupation(age);
    const newPerson = {
        id,
        name: name,
        age: age,
        type: finalType,
        status: status,
        category: finalCategory,
        appearance: AvatarLogic.generateRandomAppearance(id),
        ...occ
    };

    user.relationships.push(newPerson);
    return newPerson;
};

// --- RENDER SCREEN ---
// --- RENDER SCREEN ---
export const renderRelationships = () => {
    const user = state.gameState.user;

    if (!user.relationships) {
        user.relationships = [];
    }

    // Filter by category directly from state
    const family = user.relationships.filter(r => r.category === 'family' || r.category === 'spouse' || r.category === 'child');
    const romance = user.relationships.filter(r => r.category === 'partner');
    const friends = user.relationships.filter(r => r.category === 'friend');
    const enemies = user.relationships.filter(r => r.category === 'enemy');

    // --- HELPER: Generate Card HTML ---
    const getPersonCard = (person) => {
        if (!person.occupation) {
            Object.assign(person, GameLogic.generateNPCOccupation(person.age));
        }

        // A. Determine Wellness Bar Color
        let barColor = 'bg-green-500';
        if (person.status < 30) barColor = 'bg-red-500';
        else if (person.status < 60) barColor = 'bg-yellow-500';

        // B. Determine Badge Style
        let badgeStyle = "bg-slate-600 text-slate-100 border-slate-500";

        if (['family', 'spouse', 'child'].includes(person.category)) {
            badgeStyle = "bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-900/20";
        } else if (person.category === 'partner') {
            badgeStyle = "bg-pink-600 text-white border-pink-400 shadow-sm shadow-pink-900/20";
        } else if (person.category === 'friend') {
            badgeStyle = "bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-900/20";
        } else if (person.category === 'enemy') {
            badgeStyle = "bg-red-600 text-white border-red-400 shadow-sm shadow-red-900/20";
        }

        return `
            <div data-action="renderPersonInteraction" data-args="&apos;${person.id}&apos;" class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-400 group-hover:bg-slate-600 transition border border-slate-600">
                        ${renderAvatar(person)}
                    </div>

                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <h4 class="font-bold text-white text-sm tracking-wide">${person.name}</h4>
                            
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}">
                                ${person.type}
                            </span>
                        </div>
                        <div class="text-xs text-slate-400 font-medium">Age: ${person.age}${person.occupation ? ' • ' + person.occupation : ''}</div>
                    </div>
                </div>

                <div class="text-right w-24">
                    <div class="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Status</div>
                    <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                        <div class="h-full ${barColor} shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-500" style="width: ${person.status}%"></div>
                    </div>
                </div>
            </div>
        `;
    };

    // --- BUILD SECTIONS ---
    let content = '';

    // A. Family Section
    if (family.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-2 pl-1 flex items-center gap-2"><i class="fas fa-home text-blue-400"></i> Family</h3>`;
        content += family.map(p => getPersonCard(p)).join('');
    } else {
        content += `<div class="text-slate-600 italic text-sm text-center py-4 border border-dashed border-slate-800 rounded-xl mb-4">You have no family contacts.</div>`;
    }

    // B. Romance Section
    if (romance.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-heart text-pink-400"></i> Romance</h3>`;
        content += romance.map(p => getPersonCard(p)).join('');
    }

    // C. Friends Section
    if (friends.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-user-friends text-green-400"></i> Friends</h3>`;
        content += friends.map(p => getPersonCard(p)).join('');
    }

    // D. Enemies Section
    if (enemies.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-skull-crossbones text-red-400"></i> Enemies</h3>`;
        content += enemies.map(p => getPersonCard(p)).join('');
    }

    const btnClass = user.hasSpentTimeWithAll ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 transition';
    const btnAttr = user.hasSpentTimeWithAll ? 'disabled' : '';

    const outingsCount = user.socialOutingsCountThisYear || 0;
    const meetPeopleDisabled = user.age < 16 || outingsCount >= 50;
    const meetPeopleClass = meetPeopleDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600 transition';
    const meetPeopleAttr = meetPeopleDisabled ? 'disabled' : '';

    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>

            <div class="mb-6 px-1 flex justify-between items-center flex-wrap gap-2">
                <h2 class="text-2xl font-bold text-white">Relationships</h2>
                <div class="flex gap-2">
                    <button data-action="openMeetPeopleModal" ${meetPeopleAttr} class="btn-primary text-xs px-3 py-2 rounded-lg shadow ${meetPeopleClass}">
                        <i class="fas fa-user-plus mr-1"></i> Meet People
                    </button>
                    <button data-action="spendTimeWithAll" ${btnAttr} class="btn-primary text-xs px-3 py-2 rounded-lg shadow ${btnClass}">
                        <i class="fas fa-users mr-1"></i> Spend Time With All
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${content}
            </div>
        </div>
    `;
};

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
                <button data-action="renderRelationships" class="text-slate-400 hover:text-white text-sm flex items-center gap-2">
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
            </div>
        </div>
    `;

    UI.renderScreen(html);
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
        UI.showModal('Great Date! 💕', `You went on a blind date with ${datePerson.name} (Age ${datePerson.age}). The conversation flowed effortlessly and you exchanged numbers!`);
    } else if (roll < 0.90) {
        const datePerson = GameLogic.generateTargetedStranger(user, 'romantic');
        datePerson.status = 25;
        user.relationships.push(datePerson);
        addLog(`You went on a blind date with ${datePerson.name}. It was a bit awkward, but you exchanged contacts.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal('Awkward Date 😅', `Your date with ${datePerson.name} had some quiet silences, but you agreed to stay in touch.`);
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
                            <h3 class="font-bold text-white text-lg leading-tight">${p.name}, <span class="text-pink-400 font-normal">${p.age}</span></h3>
                            <div class="text-xs text-slate-400 font-medium">${p.occupation}</div>
                        </div>
                    </div>

                    <div class="bg-slate-900/60 p-3 rounded-xl mb-3 border border-slate-750">
                        <p class="text-xs italic text-slate-300">"${p.bio}"</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${p.hobbies.map(h => `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20"># ${h}</span>`).join('')}
                    </div>
                </div>

                <button data-action="selectDatingAppMatch" data-args="&apos;${p.id}&apos;" class="w-full btn-primary bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-900/20 transition">
                    <i class="fas fa-heart"></i> Swipe Right / Message
                </button>
            </div>
        `;
    }).join('');

    const html = `
        <div class="fade-in max-w-md mx-auto min-h-full py-6 px-4 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-4">
                <button data-action="openMeetPeopleModal" class="text-slate-400 hover:text-white text-sm flex items-center gap-2">
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
        UI.showModal("It's a Match! 💕", `You and ${matchedProfile.name} matched on LoveSync! They were added to your relationships.`);
    } else {
        addLog(`You messaged ${matchedProfile.name} on LoveSync, but they didn't match back.`, 'neutral');
        UI.updateHeader(user);
        UI.showModal('Left on Read 💔', `You sent a message to ${matchedProfile.name}, but they didn't match back. Don't worry, there are plenty more fish in the sea!`);
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
    UI.showModal('New Friend! 🤝', `You met ${friend.name} (Age ${friend.age}) at a local hobby group! You exchanged contact info.`);
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
        UI.showModal('Met Someone Special! 🍸', `During your night out, you hit it off with ${datePerson.name} (Age ${datePerson.age})!`);
    } else if (roll < 0.70) {
        const friend = GameLogic.generateTargetedStranger(user, 'friend');
        if (!user.relationships) user.relationships = [];
        user.relationships.push(friend);
        addLog(`You went out and made a new friend, ${friend.name}!`, 'good');
        UI.updateHeader(user);
        UI.showModal('New Friend! 🍻', `You had a fun night out and bonded with ${friend.name} (Age ${friend.age})!`);
    } else if (roll < 0.90) {
        user.happiness = Math.min(100, (user.happiness || 50) + 10);
        addLog(`You had an awesome night out enjoying food, music, and atmosphere (+10 Happiness).`, 'good');
        UI.updateHeader(user);
        UI.showModal('Great Night Out! 🎉', `You had a fantastic night out unwinding and having fun! (+10 Happiness)`);
    } else {
        user.health = Math.max(0, (user.health || 50) - 5);
        user.happiness = Math.min(100, (user.happiness || 50) + 5);
        addLog(`Your night out got a little chaotic after a heated argument, but you made it home safely (-5 Health).`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Chaotic Night 😅', `Things got a little rowdy during your night out! You got bumped around (-5 Health), but still had a story to tell.`);
    }

    renderRelationships();
};

export const goOutMeetSomeone = () => {
    openMeetPeopleModal();
};

function getOccupationIcon(type) {
    if (type === 'school') return 'fa-graduation-cap text-blue-400';
    if (type === 'job') return 'fa-briefcase text-emerald-400';
    if (type === 'unemployed') return 'fa-bed text-amber-400';
    if (type === 'retired') return 'fa-couch text-purple-400';
    return 'fa-user-tag text-slate-400';
}

// --- INTERACTION SCREEN ---
export const renderPersonInteraction = (id, backAction = null) => {
    const user = state.gameState.user;
    const person = user.relationships.find(r => r.id === id);
    if (!person) return;

    if (!person.occupation) {
        Object.assign(person, GameLogic.generateNPCOccupation(person.age));
    }

    let targetBackAction = backAction;
    if (!targetBackAction) {
        if (person.isCurrentClassmate || person.category === 'classmate') {
            targetBackAction = 'renderClassmates';
        } else {
            targetBackAction = 'renderRelationships';
        }
    }

    let backLabel = 'Back to Relationships';
    if (targetBackAction === 'renderClassmates') {
        backLabel = 'Back to Classmates';
    } else if (targetBackAction === 'renderEducation') {
        backLabel = 'Back to Education';
    }

    const interactions = GameLogic.getAvailableInteractions(person, user);

    const buttonsHtml = interactions.map((it) => {
        const { blocked, reason } = GameLogic.isInteractionBlocked(it.key, person, user);

        if (blocked) {
            return `
                <button disabled class="w-full p-3 rounded-xl border border-slate-700 mb-3 bg-slate-700 opacity-50 cursor-not-allowed flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                        <i class="fas ${it.icon} text-slate-500"></i>
                    </div>
                    <div class="text-left flex-1">
                        <div class="font-bold text-slate-400">${it.name}</div>
                        <div class="text-xs text-slate-500">${it.desc}${it.cost ? ' — ' + Utils.formatMoney(it.cost) : ''}</div>
                    </div>
                    <div class="text-xs font-bold text-red-400 uppercase tracking-wide">${reason}</div>
                </button>
            `;
        } else {
            let statusChangeDisplay = `<div class="text-sm font-semibold text-white">${it.statusChange > 0 ? '+'+it.statusChange : it.statusChange}</div>`;
            if (it.key === 'ask_friend') {
                statusChangeDisplay = `<div class="text-sm font-semibold text-indigo-400"><i class="fas fa-question-circle"></i></div>`;
            } else if (it.key === 'ask_out' || it.key === 'propose') {
                statusChangeDisplay = `<div class="text-sm font-semibold text-pink-400"><i class="fas fa-heart"></i></div>`;
            } else if (it.key === 'break_up' || it.key === 'file_divorce') {
                statusChangeDisplay = `<div class="text-sm font-semibold text-red-400"><i class="fas fa-heart-crack"></i></div>`;
            } else if (it.key === 'get_married') {
                statusChangeDisplay = `<div class="text-sm font-semibold text-pink-400"><i class="fas fa-ring"></i></div>`;
            } else if (it.key === 'try_for_baby') {
                statusChangeDisplay = `<div class="text-sm font-semibold text-blue-300"><i class="fas fa-baby"></i></div>`;
            }

            // Interactions with a directAction (e.g. get_married) skip the generic
            // confirm flow and route straight to their own screen.
            const dataAction = it.directAction || 'openRelationshipConfirm';
            const dataArgs = it.directAction ? `&apos;${person.id}&apos;` : `&apos;${person.id}&apos;, &apos;${it.key}&apos;`;

            return `
                <button data-action="${dataAction}" data-args="${dataArgs}" class="w-full p-3 rounded-xl border border-slate-700 mb-3 bg-slate-800 hover:bg-slate-750 hover:border-slate-500 transition flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-lg shadow-inner">
                        <i class="fas ${it.icon} text-slate-400"></i>
                    </div>
                    <div class="text-left flex-1">
                        <div class="font-bold text-white">${it.name}</div>
                        <div class="text-xs text-slate-400">${it.desc}${it.cost ? ' — ' + Utils.formatMoney(it.cost) : ''}</div>
                    </div>
                    ${statusChangeDisplay}
                </button>
            `;
        }
    }).join('');

    let badgeStyle = "bg-slate-600 text-slate-100 border-slate-500";
    if (['family', 'spouse', 'child'].includes(person.category)) badgeStyle = "bg-blue-600 text-white border-blue-400";
    else if (person.category === 'friend') badgeStyle = "bg-emerald-600 text-white border-emerald-400";
    else if (person.category === 'enemy') badgeStyle = "bg-red-600 text-white border-red-400";
    else if (person.category === 'partner') badgeStyle = "bg-pink-600 text-white border-pink-400";
    else if (person.category === 'ex') badgeStyle = "bg-slate-700 text-slate-300 border-slate-500";

    let barColor = 'bg-green-500';
    if (person.status < 30) barColor = 'bg-red-500';
    else if (person.status < 60) barColor = 'bg-yellow-500';

    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="${targetBackAction}" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> ${backLabel}
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white mx-auto mb-3 text-2xl border border-slate-600 shadow-lg">
                    ${renderAvatar(person)}
                </div>
                <h2 class="text-2xl font-bold text-white">${person.name}</h2>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle} shadow-sm">${person.type}</span>
                    <span class="text-xs text-slate-400 font-medium">Age ${person.age}</span>
                </div>

                <div class="inline-flex items-center gap-2 mt-3 bg-slate-800/90 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm">
                    <i class="fas ${getOccupationIcon(person.occupationType)} text-xs"></i>
                    <span class="text-xs font-semibold text-slate-200">${person.occupation || 'Unemployed'}</span>
                </div>
            </div>

            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-md">
                <div class="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Relationship Status</div>
                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50 mb-2">
                    <div class="h-full ${barColor} transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style="width: ${person.status}%"></div>
                </div>
                <div class="text-sm font-bold text-white">${person.status}%</div>
            </div>

            <div class="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest px-1">Choose an Action</div>
            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${buttonsHtml}
            </div>
        </div>
    `;
};

// --- CONFIRM DIALOG LAUNCHER ---
export const openRelationshipConfirm = (personId, actionKey) => {
    const user = state.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const action = GameLogic.getAvailableInteractions(person, user).find(it => it.key === actionKey);
    if (!action) return;

    const { blocked, reason } = GameLogic.isInteractionBlocked(action.key, person, user);
    if (blocked) {
        if (reason === 'Refuses Contact') {
            UI.showModal('Refused', `${person.name} is too hostile towards you and refuses to do this.`);
        } else if (reason === 'Insufficient Funds') {
            UI.showModal('Insufficient Funds', `You need ${Utils.formatMoney(action.cost)} to ${action.name.toLowerCase()}.`);
        } else if (reason === 'Female Too Old') {
            const isPlayerFemale = user.gender === 'female';
            const msg = isPlayerFemale ? "You cannot get pregnant at age 45 or above." : `${person.name} cannot get pregnant at age 45 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Male Too Old') {
            const isPlayerMale = user.gender === 'male';
            const msg = isPlayerMale ? "You cannot father a baby at age 65 or above." : `${person.name} cannot father a baby at age 65 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Too Old') {
            UI.showModal('Action Blocked', "Age limit reached for having a baby.");
        } else {
            UI.showModal('Action Blocked', "You are too young to do this.");
        }
        return;
    }

    const message = `<div class="text-sm text-slate-300 mb-4">Are you sure you want to <strong>${action.name}</strong> ${person.name}?` +
        (action.cost ? `<div class="mt-2 text-xs text-slate-400">This will cost ${Utils.formatMoney(action.cost)}</div>` : '') + `</div>`;

    UI.showConfirm(action.name, message, action.name, () => {
        performRelationshipAction(personId, action.key);
    });
};

// --- PERFORM ACTION & SHIFT CATEGORY ---
export const performRelationshipAction = (personId, actionKey) => {
    const user = state.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const action = GameLogic.getAvailableInteractions(person, user).find(it => it.key === actionKey);
    if (!action) return;

    const { blocked, reason } = GameLogic.isInteractionBlocked(action.key, person, user);
    if (blocked) {
        if (reason === 'Refuses Contact') {
            UI.showModal('Refused', `${person.name} is too hostile towards you and refuses to do this.`);
        } else if (reason === 'Insufficient Funds') {
            UI.showModal('Insufficient Funds', `You need ${Utils.formatMoney(action.cost)} to ${action.name.toLowerCase()}.`);
        } else if (reason === 'Female Too Old') {
            const isPlayerFemale = user.gender === 'female';
            const msg = isPlayerFemale ? "You cannot get pregnant at age 45 or above." : `${person.name} cannot get pregnant at age 45 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Male Too Old') {
            const isPlayerMale = user.gender === 'male';
            const msg = isPlayerMale ? "You cannot father a baby at age 65 or above." : `${person.name} cannot father a baby at age 65 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Too Old') {
            UI.showModal('Action Blocked', "Age limit reached for having a baby.");
        } else {
            UI.showModal('Action Blocked', "You are too young to do this.");
        }
        return;
    }

    // Deduct cost
    if (action.cost > 0) user.money -= action.cost;

    if (action.key === 'ask_friend') {
        const isTeacher = person.type === 'Teacher';
        const success = GameLogic.attemptBefriend(person.status, isTeacher);
        person.interactedThisYear = true;

        if (success) {
            person.category = 'friend';
            person.type = isTeacher ? 'Friend (Teacher)' : 'Friend';
            addLog(`${person.name} accepted your friend request!`, 'good');
            UI.showModal('Success', `${person.name} is now your friend!`);
            // Refresh screen to show the new category
            setTimeout(() => renderPersonInteraction(personId), 300);
        } else {
            // Rejection penalty of 10 points
            person.status = Math.max(0, person.status - 10);
            addLog(`${person.name} rejected your friend request.`, 'bad');
            UI.showModal('Rejected', `${person.name} didn't want to be friends. (-10 Status)`);
            setTimeout(() => renderPersonInteraction(personId), 300);
        }
        return; // Skip normal status update and logging
    }

    if (action.key === 'ask_out') {
        person.category = 'partner';
        person.type = person.gender === 'male' ? 'Boyfriend' : 'Girlfriend';
        person.interactedThisYear = true;
        addLog(`You asked ${person.name} to be your ${person.type}, and they said yes!`, 'good');
        UI.showModal('Success', `${person.name} is now your ${person.type}!`);
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    if (action.key === 'break_up') {
        person.category = 'ex';
        person.type = person.gender === 'male' ? 'Ex-Boyfriend' : 'Ex-Girlfriend';
        person.interactedThisYear = true;
        addLog(`You broke up with ${person.name}.`, 'bad');
        UI.showModal('Break Up', `You and ${person.name} have gone your separate ways.`);
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    if (action.key === 'propose') {
        handleProposeAction(personId);
        return;
    }

    if (action.key === 'file_divorce') {
        const alimony = Math.floor((user.money || 0) * 0.5);
        user.money -= alimony;
        person.category = 'ex';
        person.type = person.gender === 'male' ? 'Ex-Husband' : 'Ex-Wife';
        person.interactedThisYear = true;
        addLog(`You divorced ${person.name}, paying ${Utils.formatMoney(alimony)} in the settlement.`, 'bad');
        UI.showModal('Divorced', `You and ${person.name} are no longer married.`);
        UI.updateHeader(user);
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    if (action.key === 'try_for_baby') {
        person.interactedThisYear = true;
        const femaleAge = user.gender === 'female' ? user.age : person.age;
        const maleAge = user.gender === 'male' ? user.age : person.age;
        const success = GameLogic.calculatePregnancyChance(femaleAge, maleAge);

        if (success) {
            user.isExpecting = true;
            user.expectingWithId = person.id;
            addLog(`You and ${person.name} are expecting a baby!`, 'good');
            UI.showModal('Great News!', `You're expecting a baby with ${person.name}!`);
        } else {
            addLog(`You and ${person.name} tried for a baby, but no luck this year.`, 'neutral');
            UI.showModal('Not This Time', "No luck this year. Keep trying!");
        }
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    // Update status
    const prev = person.status || 0;
    person.status = Math.max(0, Math.min(100, prev + action.statusChange));
    const delta = person.status - prev;

    // Mark interaction for this year
    person.interactedThisYear = true;

    // --- PREGNANCY ROLL (Make Love for all romantic partners: married, engaged, or dating) ---
    // "Try for a Baby" is the deliberate action, but any romantic couple making love
    // carries a biological chance of conceiving.
    let pregnancyAnnouncement = '';
    const isRomanticPartner = person.category === 'spouse' || person.category === 'partner' || ['Girlfriend', 'Boyfriend', 'Partner', 'Fiancé', 'Fiancée', 'Fiance', 'Wife', 'Husband', 'Spouse'].includes(person.type);
    if (action.key === 'make_love' && isRomanticPartner && !user.isExpecting) {
        const femaleAge = user.gender === 'female' ? user.age : person.age;
        const maleAge = user.gender === 'male' ? user.age : person.age;
        if (GameLogic.calculatePregnancyChance(femaleAge, maleAge)) {
            user.isExpecting = true;
            user.expectingWithId = person.id;
            pregnancyAnnouncement = ` You're expecting a baby with ${person.name}!`;
            addLog(`You and ${person.name} are expecting a baby!`, 'good');
        }
    }

    // --- NON-RELATIVE CATEGORY SHIFT LOGIC ---
    const shiftedCategory = GameLogic.checkRelationshipCategoryShift(person.category, person.status);
    if (shiftedCategory === 'enemy') {
        person.category = 'enemy';
        person.type = 'Enemy';
        addLog(`${person.name} is now your Enemy!`, 'bad');
    } else if (shiftedCategory === 'friend') {
        person.category = 'friend';
        person.type = 'Friend';
        addLog(`You made amends with ${person.name}. They are now a Friend.`, 'good');
    }

    // Log
    const color = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral';
    const sign = delta > 0 ? `+${delta}` : delta;
    addLog(`${action.name}: ${person.name} (${sign} relationship)`, color);

    // Update header (money might have changed)
    UI.updateHeader(user);

    // Feedback modal
    const title = pregnancyAnnouncement ? 'Great News!' : (delta > 0 ? 'Success' : delta < 0 ? 'Oops' : 'Done');
    UI.showModal(title, `${person.name}'s relationship status is now ${person.status}%.${pregnancyAnnouncement}`);

    // Refresh interaction screen
    setTimeout(() => renderPersonInteraction(personId), 300);
};

// --- SPEND TIME WITH ALL ---
export const spendTimeWithAll = () => {
    const user = state.gameState.user;
    if (!user.relationships || user.relationships.length === 0) return;
    
    // Safety Gate
    if (user.age <= 1) {
        UI.showModal('Action Blocked', "You are too young to do this.");
        return;
    }

    if (user.hasSpentTimeWithAll) {
        UI.showModal('Action Blocked', "You have already spent time with everyone this year.");
        return;
    }

    let interactionsCount = 0;
    user.relationships.forEach(person => {
        // Exclude classmates from the global Spend Time With All
        if (person.category === 'classmate') return;

        if (!GameLogic.isHostile(person)) {
            const prev = person.status || 0;
            // Spend Time gives +15 status change
            person.status = Math.max(0, Math.min(100, prev + 15));
            person.interactedThisYear = true;
            interactionsCount++;

            // Check for category shift to Friend if they were enemy but not hostile anymore
            const shiftedCategory = GameLogic.checkRelationshipCategoryShift(person.category, person.status);
            if (shiftedCategory === 'friend') {
                person.category = 'friend';
                person.type = 'Friend';
                addLog(`You made amends with ${person.name}. They are now a Friend.`, 'good');
            }
        }
    });

    if (interactionsCount > 0) {
        user.hasSpentTimeWithAll = true;
        UI.showModal('Success', `You spent time with ${interactionsCount} people.`);
        renderRelationships();
    } else {
        UI.showModal('Notice', "Nobody was available to spend time with.");
    }
};

// --- PROPOSAL RING MECHANICS ---
export const handleProposeAction = (personId) => {
    const user = state.gameState.user;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person) return;

    const rings = (user.assets || []).filter(a => a.category === 'jewelry' && a.type === 'ring');

    if (rings.length === 0) {
        const modalContent = `
            <div class="text-center py-2">
                <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 text-3xl shadow-lg">
                    <i class="fas fa-ring"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">You Need a Ring!</h3>
                <p class="text-sm text-slate-300 mb-6">You must buy a ring before proposing to ${person.name}.</p>
                <div class="flex flex-col gap-2">
                    <button data-action="renderJewelryDealer" data-args="&apos;ring&apos;" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2">
                        <i class="fas fa-shopping-cart"></i> Go Ring Shopping
                    </button>
                    <button data-action="hideModal" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition text-sm">
                        Not Ready Yet
                    </button>
                </div>
            </div>
        `;
        UI.showModal("Proposal Ring Required", modalContent);
        return;
    }

    openRingSelectionModal(personId);
};

export const openRingSelectionModal = (personId) => {
    const user = state.gameState.user;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person) return;

    const rings = (user.assets || []).filter(a => a.category === 'jewelry' && a.type === 'ring');

    const ringsListHtml = rings.map(ring => {
        const style = GameLogic.getJewelryIcon(ring.type);
        return `
            <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-2.5 flex items-center justify-between group hover:border-amber-500/50 transition">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600">
                        <i class="fas ${style.icon} ${style.color} text-lg"></i>
                    </div>
                    <div class="text-left">
                        <div class="text-sm font-bold text-white">${ring.name}</div>
                        <div class="text-xs text-amber-400 font-semibold">${Utils.formatMoney(ring.value)} Value</div>
                    </div>
                </div>
                <button data-action="proposeWithRing" data-args="&apos;${personId}&apos;, &apos;${ring.id}&apos;" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition">
                    Propose
                </button>
            </div>
        `;
    }).join('');

    const modalContent = `
        <div class="text-center mb-4">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400 text-xl shadow-lg">
                <i class="fas fa-ring"></i>
            </div>
            <h3 class="text-lg font-bold text-white">Choose a Ring to Propose</h3>
            <p class="text-xs text-slate-400">Select which ring you want to propose to ${person.name} with:</p>
        </div>
        <div class="max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
            ${ringsListHtml}
        </div>
        <div class="flex flex-col gap-2 border-t border-slate-700/60 pt-3">
            <button data-action="renderJewelryDealer" data-args="&apos;ring&apos;" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg transition border border-slate-700">
                <i class="fas fa-shopping-cart mr-1"></i> Go Ring Shopping
            </button>
            <button data-action="hideModal" class="w-full text-slate-400 hover:text-white text-xs font-semibold py-1">
                Not Ready Yet
            </button>
        </div>
    `;

    UI.showModal("Select Proposal Ring", modalContent);
};

export const proposeWithRing = (personId, ringAssetId) => {
    const user = state.gameState.user;
    const person = (user.relationships || []).find(r => r.id === personId);
    const ringIndex = (user.assets || []).findIndex(a => a.id === ringAssetId);

    if (!person || ringIndex === -1) return;

    const ring = user.assets[ringIndex];
    person.interactedThisYear = true;

    const accepted = GameLogic.calculateProposalAcceptance(person.status, ring.value);

    if (accepted) {
        user.assets.splice(ringIndex, 1);
        person.type = person.gender === 'male' ? 'Fiancé' : 'Fiancée';
        person.status = Math.min(100, (person.status || 0) + 25);

        addLog(`You proposed to ${person.name} with a ${ring.name} (${Utils.formatMoney(ring.value)}), and they said YES!`, 'good');
        const pronoun = person.gender === 'male' ? 'He' : 'She';
        UI.showModal(`${pronoun} Said Yes!`, `You proposed to ${person.name} with a ${ring.name} and they accepted! You are now engaged!`);
    } else {
        person.status = Math.max(0, (person.status || 0) - 15);
        addLog(`You proposed to ${person.name} with a ${ring.name}, but they weren't ready.`, 'bad');
        UI.showModal('Rejected', `${person.name} wasn't ready to accept your proposal. (-15 Relationship Status)`);
    }

    UI.updateHeader(user);
    setTimeout(() => renderPersonInteraction(personId), 300);
};