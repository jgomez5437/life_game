import { state, hasPurchasedPack } from '../../core/state.js';
import { renderLifeDashboard, renderDeathScreen, addLog } from '../player/mainScreen.js';
import { processNextFuneral, processNextTeacherReplacement } from './funeralScreen.js';
import { GameLogic } from '../../core/gameLogic.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';

import { handleProposeAction } from './intimacyInfidelityModals.js';
export * from './meetPeopleModals.js';
export * from './intimacyInfidelityModals.js';
// --- DEAD NPC HELPER ---
/**
 * Checks if an NPC is deceased.
 * @param {object} person
 * @returns {boolean}
 */
export const isDeadNPC = (person) => {
    if (!person) return true;
    if (person.isDead === true || person.lifeStatus === 'Deceased' || person.isAlive === false) return true;
    if ((typeof person.deathCause === 'string' && person.deathCause.trim() !== '') || (typeof person.deathAge === 'number' && person.deathAge >= 0)) return true;
    if (typeof person.health === 'number' && !isNaN(person.health) && person.health <= 0 && typeof person.age === 'number') return true;
    const pendingFunerals = state.gameState?.pendingFunerals || [];
    if (pendingFunerals.some(d => d.id === person.id || (d.name === person.name && d.type === person.type))) {
        return true;
    }
    const deceasedFamily = state.gameState?.user?.deceasedFamily || [];
    if (deceasedFamily.some(d => d.id === person.id)) {
        return true;
    }
    return false;
};

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
export const renderRelationships = () => {
    const user = state.gameState?.user;
    if (!user) return;

    if (user.lifeStatus === 'Deceased') {
        renderDeathScreen(user, user.deathCause || 'natural causes');
        return;
    }

    if (state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0) {
        processNextFuneral();
        return;
    }

    if (state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0) {
        processNextTeacherReplacement();
        return;
    }

    if (!user.relationships) {
        user.relationships = [];
    }

    // Filter by category directly from state (excluding deceased NPCs)
    const isLiving = (r) => !isDeadNPC(r);
    const family = user.relationships.filter(r => (r.category === 'family' || r.category === 'spouse' || r.category === 'child') && isLiving(r));
    const romance = user.relationships.filter(r => r.category === 'partner' && isLiving(r));
    const friends = user.relationships.filter(r => r.category === 'friend' && isLiving(r));
    const enemies = user.relationships.filter(r => r.category === 'enemy' && isLiving(r));
    const exes = user.relationships.filter(r => r.category === 'ex' && isLiving(r));

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
        } else if (person.category === 'ex') {
            badgeStyle = "bg-slate-700 text-slate-300 border-slate-500 shadow-sm shadow-slate-900/20";
        }

        const seenBadge = person.interactedThisYear
            ? `<span class="seen-badge text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-0.5" title="Interacted this year"><i class="fas fa-check text-[8px]"></i> Seen</span>`
            : '';

        return `
            <div data-action="renderPersonInteraction" data-args="&apos;${Utils.escapeHtml(person.id)}&apos;, &apos;renderRelationships&apos;" class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-400 group-hover:bg-slate-600 transition border border-slate-600">
                        ${renderAvatar(person)}
                    </div>

                    <div>
                        <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 class="font-bold text-white text-sm tracking-wide">${Utils.escapeHtml(person.name)}</h4>
                            
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}">
                                ${Utils.escapeHtml(person.type)}
                            </span>
                            ${seenBadge}
                        </div>
                        <div class="text-xs text-slate-400 font-medium">Age: ${person.age}${person.occupation ? ' • ' + Utils.escapeHtml(person.occupation) : ''}</div>
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

    // E. Past Relationships / Exes Section
    if (exes.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-heart-crack text-slate-400"></i> Past Relationships</h3>`;
        content += exes.map(p => getPersonCard(p)).join('');
    }

    const btnClass = user.hasSpentTimeWithAll ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 transition';
    const btnAttr = user.hasSpentTimeWithAll ? 'disabled' : '';

    const outingsCount = user.socialOutingsCountThisYear || 0;
    const meetPeopleDisabled = user.age < 16 || outingsCount >= 50;
    const meetPeopleClass = meetPeopleDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600 transition';
    const meetPeopleAttr = meetPeopleDisabled ? 'disabled' : '';

    UI.updateBottomNav('social');
    const backBtnHtml = !UI.isBottomNavEnabled() ? `
        <div class="mb-4">
            <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
    ` : '';
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            ${backBtnHtml}

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


function getOccupationIcon(type) {
    if (type === 'school') return 'fa-graduation-cap text-blue-400';
    if (type === 'job') return 'fa-briefcase text-emerald-400';
    if (type === 'unemployed') return 'fa-bed text-amber-400';
    if (type === 'retired') return 'fa-couch text-purple-400';
    return 'fa-user-tag text-slate-400';
}

// Track active interaction back action per person session
let _activePersonBackAction = null;
let _currentInteractionPersonId = null;

// --- INTERACTION SCREEN ---
export const renderPersonInteraction = (id, backAction = null) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === id);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        renderRelationships();
        return;
    }

    if (!person.occupation) {
        Object.assign(person, GameLogic.generateNPCOccupation(person.age));
    }

    let targetBackAction = backAction;
    if (!targetBackAction) {
        if (_currentInteractionPersonId === id && _activePersonBackAction) {
            targetBackAction = _activePersonBackAction;
        } else if (person.category === 'classmate') {
            targetBackAction = 'renderClassmates';
        } else {
            targetBackAction = 'renderRelationships';
        }
    }

    _activePersonBackAction = targetBackAction;
    _currentInteractionPersonId = id;

    let backLabel = 'Back to Relationships';
    if (targetBackAction === 'renderClassmates') {
        backLabel = 'Back to Classmates';
    } else if (targetBackAction === 'renderEducation') {
        backLabel = 'Back to Education';
    } else if (targetBackAction === 'renderLifeDashboard') {
        backLabel = 'Back to Dashboard';
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

    UI.updateBottomNav('social');
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col max-w-lg mx-auto pb-4">
            <div class="mb-4">
                <button data-action="${targetBackAction}" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> ${backLabel}
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white mx-auto mb-3 text-2xl border border-slate-600 shadow-lg">
                    ${renderAvatar(person)}
                </div>
                <h2 class="text-2xl font-bold text-white">${Utils.escapeHtml(person.name)}</h2>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle} shadow-sm">${Utils.escapeHtml(person.type)}</span>
                    <span class="text-xs text-slate-400 font-medium">Age ${person.age}</span>
                </div>

                <div class="inline-flex items-center gap-2 mt-3 bg-slate-800/90 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm">
                    <i class="fas ${getOccupationIcon(person.occupationType)} text-xs"></i>
                    <span class="text-xs font-semibold text-slate-200">${Utils.escapeHtml(person.occupation || 'Unemployed')}</span>
                </div>
            </div>

            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-md">
                <div class="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Relationship Status</div>
                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50 mb-2">
                    <div class="h-full ${barColor} transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style="width: ${person.status}%"></div>
                </div>
                <div class="text-sm font-bold text-white">${person.status}%</div>
            </div>

            ${hasPurchasedPack('god_mode') ? `
                <button data-action="renderGodModeAvatarModal" data-args="&apos;person&apos;, &apos;${Utils.escapeHtml(person.id)}&apos;" class="w-full py-2.5 mb-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow">
                    <i class="fas fa-user-edit text-amber-400"></i> Edit Appearance (God Mode)
                </button>
            ` : ''}

            <div class="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest px-1">Choose an Action</div>
            <div class="pb-4">
                ${buttonsHtml}
            </div>
        </div>
    `;
};

// --- CONFIRM DIALOG LAUNCHER ---
export const openRelationshipConfirm = (personId, actionKey) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    const action = GameLogic.getAvailableInteractions(person, user).find(it => it.key === actionKey);
    if (!action) return;

    const { blocked, reason } = GameLogic.isInteractionBlocked(action.key, person, user);
    if (blocked) {
        if (reason === 'Refuses Contact') {
            UI.showModal('Refused', `${Utils.escapeHtml(person.name)} is too hostile towards you and refuses to do this.`);
        } else if (reason === 'Insufficient Funds') {
            UI.showModal('Insufficient Funds', `You need ${Utils.formatMoney(action.cost)} to ${action.name.toLowerCase()}.`);
        } else if (reason === 'Female Too Old') {
            const isPlayerFemale = user.gender === 'female';
            const msg = isPlayerFemale ? "You cannot get pregnant at age 45 or above." : `${Utils.escapeHtml(person.name)} cannot get pregnant at age 45 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Male Too Old') {
            const isPlayerMale = user.gender === 'male';
            const msg = isPlayerMale ? "You cannot father a baby at age 65 or above." : `${Utils.escapeHtml(person.name)} cannot father a baby at age 65 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Too Old') {
            UI.showModal('Action Blocked', "Age limit reached for having a baby.");
        } else {
            UI.showModal('Action Blocked', "You are too young to do this.");
        }
        return;
    }

    const message = `<div class="text-sm text-slate-300 mb-4">Are you sure you want to <strong>${action.name}</strong> ${Utils.escapeHtml(person.name)}?` +
        (action.cost ? `<div class="mt-2 text-xs text-slate-400">This will cost ${Utils.formatMoney(action.cost)}</div>` : '') + `</div>`;

    UI.showConfirm(action.name, message, action.name, () => {
        performRelationshipAction(personId, action.key);
    });
};

// --- PERFORM ACTION & SHIFT CATEGORY ---
export const performRelationshipAction = (personId, actionKey) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    const action = GameLogic.getAvailableInteractions(person, user).find(it => it.key === actionKey);
    if (!action) return;

    const { blocked, reason } = GameLogic.isInteractionBlocked(action.key, person, user);
    if (blocked) {
        if (reason === 'Refuses Contact') {
            UI.showModal('Refused', `${Utils.escapeHtml(person.name)} is too hostile towards you and refuses to do this.`);
        } else if (reason === 'Insufficient Funds') {
            UI.showModal('Insufficient Funds', `You need ${Utils.formatMoney(action.cost)} to ${action.name.toLowerCase()}.`);
        } else if (reason === 'Female Too Old') {
            const isPlayerFemale = user.gender === 'female';
            const msg = isPlayerFemale ? "You cannot get pregnant at age 45 or above." : `${Utils.escapeHtml(person.name)} cannot get pregnant at age 45 or above.`;
            UI.showModal('Action Blocked', msg);
        } else if (reason === 'Male Too Old') {
            const isPlayerMale = user.gender === 'male';
            const msg = isPlayerMale ? "You cannot father a baby at age 65 or above." : `${Utils.escapeHtml(person.name)} cannot father a baby at age 65 or above.`;
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
            GameLogic.adjustStat(user, 'happiness', 5);
            addLog(`${person.name} accepted your friend request!`, 'good');
            UI.updateHeader(user);
            UI.showModal('Success', `${Utils.escapeHtml(person.name)} is now your friend!`);
            // Refresh screen to show the new category
            setTimeout(() => renderPersonInteraction(personId), 300);
        } else {
            // Rejection penalty of 10 points
            person.status = Math.max(0, person.status - 10);
            GameLogic.adjustStat(user, 'happiness', -5);
            addLog(`${person.name} rejected your friend request.`, 'bad');
            UI.updateHeader(user);
            UI.showModal('Rejected', `${Utils.escapeHtml(person.name)} didn't want to be friends. (-10 Status, -5 Happiness)`);
            setTimeout(() => renderPersonInteraction(personId), 300);
        }
        return; // Skip normal status update and logging
    }

    if (action.key === 'ask_out') {
        person.category = 'partner';
        person.type = person.gender === 'male' ? 'Boyfriend' : 'Girlfriend';
        person.interactedThisYear = true;
        GameLogic.adjustStat(user, 'happiness', 10);
        addLog(`You asked ${person.name} to be your ${person.type}, and they said yes! (+10 Happiness)`, 'good');
        UI.updateHeader(user);
        UI.showModal('Success', `${Utils.escapeHtml(person.name)} is now your ${Utils.escapeHtml(person.type)}!`);
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    if (action.key === 'break_up') {
        GameLogic.breakUpWithPartner(user, person);
        person.interactedThisYear = true;
        GameLogic.adjustStat(user, 'happiness', -15);
        addLog(`You broke up with ${person.name}. (-15 Happiness)`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Break Up', `You and ${Utils.escapeHtml(person.name)} have gone your separate ways.`);
        setTimeout(() => renderPersonInteraction(personId), 300);
        return;
    }

    if (action.key === 'propose') {
        handleProposeAction(personId);
        return;
    }

    if (action.key === 'file_divorce') {
        const alimony = (user.money || 0) > 0 ? Math.floor(user.money * 0.5) : 0;
        user.money -= alimony;
        person.category = 'ex';
        person.type = person.gender === 'male' ? 'Ex-Husband' : 'Ex-Wife';
        person.interactedThisYear = true;
        GameLogic.adjustStat(user, 'happiness', -25);
        addLog(`You divorced ${person.name}, paying ${Utils.formatMoney(alimony)} in the settlement. (-25 Happiness)`, 'bad');
        UI.showModal('Divorced', `You and ${Utils.escapeHtml(person.name)} are no longer married.`);
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
            GameLogic.adjustStat(user, 'happiness', 15);
            addLog(`You and ${person.name} are expecting a baby! (+15 Happiness)`, 'good');
            UI.updateHeader(user);
            UI.showModal('Great News!', `You're expecting a baby with ${Utils.escapeHtml(person.name)}!`);
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

    // Adjust happiness for positive interactions or make love
    if (action.key === 'make_love') {
        GameLogic.adjustStat(user, 'happiness', 8);
    } else if (delta > 0) {
        GameLogic.adjustStat(user, 'happiness', Math.min(5, Math.max(1, Math.round(delta / 5))));
    } else if (delta < 0) {
        GameLogic.adjustStat(user, 'happiness', Math.max(-5, Math.min(-1, Math.round(delta / 5))));
    }

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
            GameLogic.adjustStat(user, 'happiness', 15);
            pregnancyAnnouncement = ` You're expecting a baby with ${Utils.escapeHtml(person.name)}!`;
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

    // Update header (money and stats might have changed)
    UI.updateHeader(user);

    // Feedback modal
    const title = pregnancyAnnouncement ? 'Great News!' : (delta > 0 ? 'Success' : delta < 0 ? 'Oops' : 'Done');
    UI.showModal(title, `${Utils.escapeHtml(person.name)}'s relationship status is now ${person.status}%.${pregnancyAnnouncement}`);

    // Refresh interaction screen
    setTimeout(() => renderPersonInteraction(personId), 300);
};

// --- SPEND TIME WITH ALL ---
export const spendTimeWithAll = () => {
    const user = state.gameState?.user;
    if (!user || !user.relationships || user.relationships.length === 0) return;
    
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
        if (!person || isDeadNPC(person)) return;
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
        GameLogic.adjustStat(user, 'happiness', Math.min(20, Math.max(5, interactionsCount * 2)));
        UI.updateHeader(user);
        UI.showModal('Success', `You spent time with ${interactionsCount} people.`);
        renderRelationships();
    } else {
        UI.showModal('Notice', "Nobody was available to spend time with.");
    }
};
