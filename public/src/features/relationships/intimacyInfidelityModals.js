import { state } from '../../core/state.js';
import { addLog } from '../player/mainScreen.js';
import { GameLogic } from '../../core/gameLogic.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { isDeadNPC, renderRelationships, renderPersonInteraction } from './relationshipScreen.js';

// --- PROPOSAL RING MECHANICS ---
export const handleProposeAction = (personId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    const rings = (user.assets || []).filter(a => a.category === 'jewelry' && a.type === 'ring');

    if (rings.length === 0) {
        const modalContent = `
            <div class="text-center py-2">
                <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 text-3xl shadow-lg">
                    <i class="fas fa-ring"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">You Need a Ring!</h3>
                <p class="text-sm text-slate-300 mb-6">You must buy a ring before proposing to ${Utils.escapeHtml(person.name)}.</p>
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
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

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
                        <div class="text-sm font-bold text-white">${Utils.escapeHtml(ring.name)}</div>
                        <div class="text-xs text-amber-400 font-semibold">${Utils.formatMoney(ring.value)} Value</div>
                    </div>
                </div>
                <button data-action="proposeWithRing" data-args="&apos;${Utils.escapeHtml(personId)}&apos;, &apos;${Utils.escapeHtml(ring.id)}&apos;" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition">
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
            <p class="text-xs text-slate-400">Select which ring you want to propose to ${Utils.escapeHtml(person.name)} with:</p>
        </div>
        <div class="max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
            ${ringsListHtml}
        </div>
        <div class="flex flex-col gap-2 border-t border-slate-700/60 pt-3">
            <button data-action="renderJewelryDealer" data-args="&apos;ring&apos;" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg transition border border-slate-700">
                <i class="fas fa-shopping-cart mr-1"></i> Go Ring Shopping
            </button>
            <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg transition border border-slate-600 flex items-center justify-center gap-1.5">
                <i class="fas fa-times"></i> Cancel Proposal
            </button>
        </div>
    `;

    UI.showCustomModal({
        title: "Select Proposal Ring",
        content: modalContent,
        showCloseBtn: true
    });
};

export const proposeWithRing = (personId, ringAssetId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    const ringIndex = (user.assets || []).findIndex(a => a.id === ringAssetId);

    if (!person || ringIndex === -1 || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    const ring = user.assets[ringIndex];
    user.assets.splice(ringIndex, 1); // Consume the ring

    const accepted = GameLogic.calculateProposalAcceptance(person.status, ring.value);
    const pronoun = person.gender === 'female' ? 'She' : (person.gender === 'male' ? 'He' : 'They');

    if (accepted) {
        person.type = 'Fiancé';
        person.status = 100;
        addLog(`Proposed to ${person.name} with a ${ring.name}. ${pronoun} said YES!`, 'good');
        UI.updateHeader(user);
        UI.showModal(`${pronoun} Said Yes!`, `You proposed to ${Utils.escapeHtml(person.name)} with a ${Utils.escapeHtml(ring.name)} and they accepted! You are now engaged!`);
    } else {
        person.status = Math.max(0, (person.status || 0) - 15);
        addLog(`Proposed to ${person.name} with a ${ring.name}. ${pronoun} rejected your proposal. (-15 Relationship Status)`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Rejected', `${Utils.escapeHtml(person.name)} wasn't ready to accept your proposal. (-15 Relationship Status)`);
    }

    if (typeof window.saveGame === 'function') window.saveGame();
    renderPersonInteraction(personId);
};

// --- MAKE A MOVE & HOOKUP / AFFAIR DYNAMICS ---
let currentHookupPersonId = null;
let currentCheatingPartnerId = null;

export const handleMakeAMove = (personId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    const { blocked, reason } = GameLogic.isInteractionBlocked('make_a_move', person, user);
    if (blocked) {
        UI.showModal('Action Blocked', `You cannot make a move on ${Utils.escapeHtml(person.name)} (${reason}).`);
        return;
    }

    person.interactedThisYear = true;

    const success = GameLogic.calculateMakeAMoveSuccess(person, user);
    if (!success) {
        person.status = Math.max(0, (person.status || 0) - 15);
        addLog(`You made a move on ${person.name}, but they turned you down.`, 'bad');
        UI.updateHeader(user);
        UI.showModal('Not Tonight 😬', `<p class="text-slate-300 text-sm">${Utils.escapeHtml(person.name)} turned down your move. Things are a bit awkward between you now. (-15 Relationship Status)</p>`);
        if (typeof window.saveGame === 'function') window.saveGame();
        renderPersonInteraction(personId);
        return;
    }

    currentHookupPersonId = personId;
    const scenarioText = GameLogic.getRandomHookupScenario ? GameLogic.getRandomHookupScenario(person.name) : "Things are heating up!";
    renderSteamyHookupModal(person, scenarioText);
};

export const renderSteamyHookupModal = (person, scenarioText = '') => {
    if (!person || isDeadNPC(person)) return;
    const user = state.gameState?.user;
    if (!user) return;
    const partner = (user.relationships || []).find(r => r.category === 'spouse' || r.category === 'partner');
    const isUnfaithful = !!partner && partner.id !== person.id;

    currentHookupPersonId = person.id;

    const html = `
        <div class="text-center py-2 fade-in max-w-sm mx-auto">
            <div class="w-20 h-20 mx-auto rounded-full bg-pink-500/20 border-2 border-pink-400 overflow-hidden mb-3 shadow-lg flex items-center justify-center">
                ${renderAvatar(person)}
            </div>
            <h3 class="text-xl font-bold text-pink-400 mb-1 flex items-center justify-center gap-2">
                <i class="fas fa-fire"></i> Steamy Opportunity
            </h3>
            <p class="text-xs text-slate-300 mb-3">
                ${scenarioText ? Utils.escapeHtml(scenarioText) : `Things are heating up with <strong class="text-white">${Utils.escapeHtml(person.name)}</strong>!`}
            </p>
            ${isUnfaithful ? `
                <div class="bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-semibold p-2.5 rounded-xl mb-4 text-left">
                    <i class="fas fa-triangle-exclamation mr-1 text-amber-400"></i>
                    <strong>Cheating Risk:</strong> You are currently in a relationship with <strong>${Utils.escapeHtml(partner.name)}</strong>. If discovered, this affair will cause serious damage!
                </div>
            ` : ''}

            <div class="space-y-2 text-left">
                <button data-action="confirmHookupChoice" data-args="&apos;protection&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 p-3 rounded-xl transition flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-base group-hover:scale-105 transition">
                        <i class="fas fa-shield-heart"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-xs">Hook Up (With Protection)</div>
                        <div class="text-[11px] text-slate-400">Boost relationship status (+15), minimal pregnancy risk</div>
                    </div>
                </button>

                <button data-action="confirmHookupChoice" data-args="&apos;no_protection&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-rose-500 p-3 rounded-xl transition flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-base group-hover:scale-105 transition">
                        <i class="fas fa-fire-flame-curved"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-xs">Hook Up (No Protection)</div>
                        <div class="text-[11px] text-rose-300 font-medium">Major relationship boost (+25), high pregnancy risk!</div>
                    </div>
                </button>

                <button data-action="confirmHookupChoice" data-args="&apos;end&apos;" class="w-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700 p-3 rounded-xl transition flex items-center gap-3 text-slate-400 hover:text-white">
                    <div class="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-base">
                        <i class="fas fa-hand"></i>
                    </div>
                    <div>
                        <div class="font-bold text-xs">End the Night</div>
                        <div class="text-[11px] text-slate-400">Excuse yourself and leave safely</div>
                    </div>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: 'Steamy Opportunity',
        content: html,
        showCloseBtn: false
    });
};

export const openHookupModal = handleMakeAMove;

export const confirmHookupChoice = (choice) => {
    const user = state.gameState?.user;
    if (!user || !currentHookupPersonId) return;

    const person = (user.relationships || []).find(r => r.id === currentHookupPersonId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    if (choice === 'end') {
        UI.closeAllModals();
        UI.showModal('Night Ended', `<p class="text-slate-300 text-sm">You decided not to take things further and excused yourself for the night.</p>`);
        renderPersonInteraction(person.id);
        return;
    }

    const partner = (user.relationships || []).find(r => r.category === 'spouse' || r.category === 'partner');
    const isUnfaithful = !!partner && partner.id !== person.id;

    if (isUnfaithful) {
        user.hadUnfaithfulHookupThisYear = true;
        person.type = 'Secret Affair';
        person.category = 'friend';
    }

    const isProtection = choice === 'protection';
    const statusDelta = isProtection ? 15 : 25;
    person.status = Math.min(100, (person.status || 0) + statusDelta);

    let pregnancyText = '';
    if (!user.isExpecting) {
        const femaleAge = user.gender === 'female' ? user.age : person.age;
        const maleAge = user.gender === 'male' ? user.age : person.age;
        const pregnancyChance = isProtection ? 0.025 : 0.45;

        if (femaleAge <= 45 && maleAge <= 65 && Math.random() < pregnancyChance) {
            user.isExpecting = true;
            user.expectingWithId = person.id;
            pregnancyText = `You conceived a baby with ${Utils.escapeHtml(person.name)}!`;
            addLog(`You and ${person.name} are expecting a baby from your hookup!`, 'good');
        }
    }

    let stdText = '';
    if (typeof GameLogic.rollHookupSTD === 'function') {
        const stdRes = GameLogic.rollHookupSTD(user, isProtection);
        if (stdRes && stdRes.contracted && stdRes.disease) {
            stdText = `You contracted <strong>${Utils.escapeHtml(stdRes.disease.name)}</strong>. Visit a doctor to get treated.`;
            addLog(`You contracted ${stdRes.disease.name} from your hookup. Visit a doctor for treatment.`, 'bad');
        }
    }

    addLog(`You hooked up with ${person.name}! ${isUnfaithful ? '(Initiated a Secret Affair)' : ''}`, 'good');
    UI.updateHeader(user);
    if (typeof window.saveGame === 'function') window.saveGame();

    const title = pregnancyText ? '🔥 Steamy Night (Expecting!)' : '🔥 Steamy Encounter!';
    const modalContent = `
        <div class="text-center py-2">
            <div class="w-16 h-16 mx-auto rounded-full bg-pink-500/20 border-2 border-pink-400 overflow-hidden mb-3 shadow-lg flex items-center justify-center">
                ${renderAvatar(person)}
            </div>
            <h4 class="text-lg font-bold text-white mb-1">Passion in the Air</h4>
            <p class="text-xs text-slate-300 mb-3">You spent a passionate night with <strong class="text-pink-300">${Utils.escapeHtml(person.name)}</strong>.</p>
            ${isUnfaithful ? `<div class="text-xs text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30 mb-3 font-semibold">🤫 ${Utils.escapeHtml(person.name)} is now designated as your Secret Affair.</div>` : ''}
            ${pregnancyText ? `<div class="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30 mb-3 font-semibold">${pregnancyText}</div>` : ''}
            ${stdText ? `<div class="text-xs text-rose-300 bg-rose-950/50 p-2 rounded-lg border border-rose-500/40 font-semibold">${stdText}</div>` : ''}
        </div>
    `;

    UI.closeAllModals();
    UI.showModal(title, modalContent);
    renderPersonInteraction(person.id);
};

export const handleEndAffair = (personId) => {
    const user = state.gameState?.user;
    if (!user) return;
    const person = (user.relationships || []).find(r => r.id === personId);
    if (!person || isDeadNPC(person)) {
        UI.showModal("Cannot Interact", "This person has passed away.");
        return;
    }

    person.type = 'Ex-Lover';
    person.status = Math.max(0, (person.status || 0) - 10);
    person.interactedThisYear = true;

    addLog(`You ended your secret affair with ${person.name}.`, 'neutral');
    UI.showModal('Affair Ended', `<p class="text-slate-300 text-sm">You broke off your secret affair with <strong>${Utils.escapeHtml(person.name)}</strong>. They are now an Ex-Lover and intimate options have been disabled.</p>`);
    UI.updateHeader(user);
    if (typeof window.saveGame === 'function') window.saveGame();
    renderPersonInteraction(personId);
};

export const renderAgeUpCheatingDiscoveredModal = (discoveryInfo) => {
    const user = state.gameState?.user;
    if (!user || !discoveryInfo) return;
    const partner = (user.relationships || []).find(r => r.id === discoveryInfo.partnerId);
    if (!partner || isDeadNPC(partner)) return;

    currentCheatingPartnerId = partner.id;
    partner.status = Math.max(0, (partner.status || 0) - 60);
    GameLogic.adjustStat(user, 'happiness', -20);
    UI.updateHeader(user);

    const canAffordGift = (user.money || 0) >= 5000;

    const html = `
        <div class="text-center py-2 fade-in max-w-sm mx-auto">
            <div class="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 overflow-hidden mb-3 shadow-lg flex items-center justify-center">
                ${renderAvatar(partner)}
            </div>
            <h3 class="text-xl font-bold text-red-400 mb-1 flex items-center justify-center gap-2">
                <i class="fas fa-heart-crack"></i> Cheating Discovered!
            </h3>
            <p class="text-xs text-slate-300 mb-3">
                Your ${Utils.escapeHtml(partner.type)} <strong class="text-white">${Utils.escapeHtml(partner.name)}</strong> found out about your secret affair with <strong class="text-pink-300">${Utils.escapeHtml(discoveryInfo.affairName)}</strong>!
            </p>
            <div class="bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold p-2.5 rounded-xl mb-4">
                Relationship Status Dropped by -60 (Current Status: ${partner.status})
            </div>

            <div class="space-y-2 text-left">
                <!-- Option 1: Beg Forgiveness -->
                <button data-action="handleCheatingConfrontationChoice" data-args="&apos;beg&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 p-3 rounded-xl transition flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-base group-hover:scale-105 transition">
                        <i class="fas fa-hands-praying"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-xs">Beg for Forgiveness & Offer Counseling</div>
                        <div class="text-[11px] text-slate-400">50% chance they agree to stay and work through it</div>
                    </div>
                </button>

                <!-- Option 2: Buy Expensive Gift -->
                <button data-action="handleCheatingConfrontationChoice" data-args="&apos;gift&apos;" ${!canAffordGift ? 'disabled' : ''} class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 p-3 rounded-xl transition flex items-center gap-3 group ${!canAffordGift ? 'opacity-50 cursor-not-allowed' : ''}">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-base group-hover:scale-105 transition">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-xs">Buy Expensive Peace Offering Gift (-$5,000)</div>
                        <div class="text-[11px] text-amber-400">65% chance they accept gift and stay</div>
                    </div>
                </button>

                <!-- Option 3: Blame Spouse (Make it worse!) -->
                <button data-action="handleCheatingConfrontationChoice" data-args="&apos;blame&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500 p-3 rounded-xl transition flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-base group-hover:scale-105 transition">
                        <i class="fas fa-bolt-lightning"></i>
                    </div>
                    <div>
                        <div class="font-bold text-red-300 text-xs">Blame Them / Deflect (Make it worse!)</div>
                        <div class="text-[11px] text-red-400">"You weren't giving me attention anyway!" (Status to 0)</div>
                    </div>
                </button>

                <!-- Option 4: Walk Away -->
                <button data-action="handleCheatingConfrontationChoice" data-args="&apos;walk_away&apos;" class="w-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700 p-3 rounded-xl transition flex items-center gap-3 text-slate-400 hover:text-white">
                    <div class="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-base">
                        <i class="fas fa-door-open"></i>
                    </div>
                    <div>
                        <div class="font-bold text-xs">Walk Away & End Relationship</div>
                        <div class="text-[11px] text-slate-400">Accept consequences and break up / divorce</div>
                    </div>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: 'Cheating Discovered!',
        content: html,
        showCloseBtn: false
    });
};

export const handleCheatingConfrontationChoice = (choice) => {
    const user = state.gameState?.user;
    if (!user || !currentCheatingPartnerId) return;

    const partnerIndex = (user.relationships || []).findIndex(r => r.id === currentCheatingPartnerId);
    if (partnerIndex === -1) return;
    const partner = user.relationships[partnerIndex];
    if (!partner || isDeadNPC(partner)) return;

    if (choice === 'beg') {
        const forgives = Math.random() < 0.50;
        UI.closeAllModals();
        if (forgives) {
            partner.status = Math.min(100, partner.status + 20);
            GameLogic.adjustStat(user, 'happiness', -15);
            addLog(`You begged ${partner.name} for forgiveness. They reluctantly agreed to stay and attend counseling. (-15 Happiness)`, 'neutral');
            UI.showModal('Forgiven (For Now)', `<p class="text-slate-300 text-sm">${Utils.escapeHtml(partner.name)} agreed to try couples counseling, but trust will take a long time to rebuild. (+20 Relationship Status, -15 Happiness)</p>`);
        } else {
            GameLogic.adjustStat(user, 'happiness', -25);
            addLog(`${partner.name} refused your apology and broke off the relationship! (-25 Happiness)`, 'bad');
            UI.showModal('Relationship Over 💔', `<p class="text-slate-300 text-sm">${Utils.escapeHtml(partner.name)} could not forgive your betrayal and ended the relationship immediately! (-25 Happiness)</p>`);
            GameLogic.breakUpWithPartner(user, partner);
        }
    } else if (choice === 'gift') {
        if ((user.money || 0) < 5000) {
            UI.showModal('Insufficient Funds', 'You need $5,000 to purchase a luxury peace offering gift.');
            return;
        }
        user.money -= 5000;
        const acceptsGift = Math.random() < 0.65;
        UI.closeAllModals();
        if (acceptsGift) {
            partner.status = Math.min(100, partner.status + 15);
            GameLogic.adjustStat(user, 'happiness', -10);
            addLog(`You bought ${partner.name} a $5,000 peace offering gift. They accepted it and agreed to stay.`, 'good');
            UI.showModal('Gift Accepted 🎁', `<p class="text-slate-300 text-sm">${Utils.escapeHtml(partner.name)} accepted the expensive gift and agreed to stay together for now.</p>`);
        } else {
            GameLogic.adjustStat(user, 'happiness', -25);
            addLog(`${partner.name} threw your $5,000 gift back at you and ended the relationship! (-25 Happiness)`, 'bad');
            UI.showModal('Gift Rejected 💔', `<p class="text-slate-300 text-sm">${Utils.escapeHtml(partner.name)} threw your gift back at you in anger and ended the relationship! (-25 Happiness)</p>`);
            GameLogic.breakUpWithPartner(user, partner);
        }
    } else if (choice === 'blame') {
        partner.status = 0;
        const breaksUp = Math.random() < 0.90;
        UI.closeAllModals();
        if (breaksUp) {
            GameLogic.adjustStat(user, 'happiness', -30);
            addLog(`You blamed ${partner.name} for your affair. Furious, they immediately divorced/broke up with you! (-30 Happiness)`, 'bad');
            UI.showModal('Bitter Breakup 💥', `<p class="text-slate-300 text-sm">You blamed ${Utils.escapeHtml(partner.name)}. Outraged by your reaction, they immediately packed their bags and left! (-30 Happiness)</p>`);
            GameLogic.breakUpWithPartner(user, partner);
        } else {
            GameLogic.adjustStat(user, 'happiness', -20);
            addLog(`You argued with ${partner.name}. The fight was explosive, but you remain together with 0 status. (-20 Happiness)`, 'bad');
            UI.showModal('Explosive Argument 💥', `<p class="text-slate-300 text-sm">You blamed ${Utils.escapeHtml(partner.name)}. You had a massive fight, and your relationship is at rock bottom (Status: 0, -20 Happiness).</p>`);
        }
    } else if (choice === 'walk_away') {
        GameLogic.adjustStat(user, 'happiness', -25);
        addLog(`You walked away from your relationship with ${partner.name}. (-25 Happiness)`, 'bad');
        UI.closeAllModals();
        UI.showModal('Separated 🚪', `<p class="text-slate-300 text-sm">You walked away and ended your relationship with ${Utils.escapeHtml(partner.name)}. (-25 Happiness)</p>`);
        GameLogic.breakUpWithPartner(user, partner);
    }

    UI.updateHeader(user);
    if (typeof window.saveGame === 'function') window.saveGame();
    renderRelationships();
};