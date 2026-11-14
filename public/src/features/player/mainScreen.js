import { GameLogic } from '../../core/gameLogic.js';
import { state, hasPurchasedPack, addLog } from '../../core/state.js';
export { addLog };
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { saveGame, resetGame } from '../../core/main.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { captureAnnualSnapshot } from '../../core/timeMachine.js';
import { saveToSlot } from '../../core/saveSlotManager.js';
import { EulogyGenerator } from '../../core/eulogyGenerator.js';
import { loadModule, preloadForContext } from '../../core/moduleLoader.js';
import { checkPeriodicAchievements } from '../../core/achievementManager.js';
import { EventManager } from '../../core/eventManager.js';
import { SoundManager } from '../../core/soundManager.js';
import {
    handleHealth,
    handleSmarts,
    handleLooks,
    handleFinances,
    refreshClassmates,
    handleEducation,
    handleMarket,
    handleLifeEvents,
    handleRelationships,
    handlePregnancy,
    handleAppearanceAging
} from './ageUpHandlers.js';
export { refreshClassmates };
const get = id => document.getElementById(id);

function checkSchoolActionTaken(user) {
    if (user && user.schoolActions > 0) {
        user.schoolActions = 0;
    }
}

function checkActionTaken(user) {
    if (user && user.careerActionTaken) {
        user.careerActionTaken = false;
    }
    if (user && user.skillActionsThisYear) {
        user.skillActionsThisYear = 0;
    }
    if (user && user.instrumentPracticesThisYear) {
        user.instrumentPracticesThisYear = 0;
    }
    if (user && user.instrumentLessonsThisYear) {
        user.instrumentLessonsThisYear = 0;
    }
}

export async function ageUp() {
    const currentState = state.gameState;
    const user = currentState.user;

    if (user.inPrison) {
        user.age++;
        SoundManager.play('ageUp');
        const prisonRes = GameLogic.processPrisonAgeUp(user);
        if (prisonRes.events && prisonRes.events.length > 0) {
            prisonRes.events.forEach(eMsg => addLog(eMsg, 'neutral'));
        }
        if (prisonRes.released) {
            addLog(prisonRes.message, 'good');
            UI.showModal("Released from Prison", prisonRes.message);
            renderLifeDashboard();
        } else {
            addLog(prisonRes.message, 'neutral');
            loadModule('prison').then(m => {
                if (prisonRes.newCellmate) {
                    m.renderNewCellmateModal(prisonRes.newCellmate);
                } else {
                    m.renderPrisonDashboard();
                }
            });
        }
        saveToSlot();
        if (typeof saveGame === "function") saveGame(true);
        return;
    }
    
    // 1. Mortality Check
    const currentHealth = user.health ?? user.stats?.health ?? 100; 
    const deathCheck = GameLogic.checkMortality(user.age, currentHealth, user.diseases);
    
    if (deathCheck.isDead) {
        handleDeath(user, deathCheck.cause);
        return; 
    }

    // 2. The Core Update
    user.age++;
    SoundManager.play('ageUp');

    // 3. Run The Sub-Systems
    handleHealth(user);
    handleSmarts(user);
    handleLooks(user);
    await handleFinances(user);
    handleEducation(user);
    handleMarket(user);
    handleLifeEvents(user);
    handleRelationships(user);
    handlePregnancy(user);
    handleAppearanceAging(user);
    EventManager.evaluateAgeUpEvents(user, currentState);

    const infidelityDiscovery = GameLogic.checkAgeUpInfidelityDiscovery(user);
    if (infidelityDiscovery) {
        loadModule('relationships').then(m => {
            if (m && typeof m.renderAgeUpCheatingDiscoveredModal === 'function') {
                m.renderAgeUpCheatingDiscoveredModal(infidelityDiscovery);
            }
        });
    }

    // 4. Empty Year Validation (The Fix)
    const currentAgeLog = currentState.lifeLog.find(l => l.age === user.age);
    if (!currentAgeLog || currentAgeLog.events.length === 0) {
        addLog("You didn't do much all year.", 'neutral');
    }

    // 5. Cleanup & Render
    checkSchoolActionTaken(user);
    checkActionTaken(user);          
    
    // 6. Check Periodic Achievements
    checkPeriodicAchievements(user);

    // Process tenant default popups first, then funerals, then render dashboard
    loadModule('assets').then(m => {
        if (m && typeof m.processNextTenantDefaultEvent === 'function') {
            m.processNextTenantDefaultEvent();
        }
    });
    
    captureAnnualSnapshot(currentState);
    saveToSlot();

    if (typeof saveGame === "function") {
        saveGame(true);
    }
}

function handleDeath(user, cause) {
    SoundManager.play('death');
    user.lifeStatus = "Deceased";
    user.isDead = true;
    user.isAlive = false;
    user.deathCause = cause;
    user.deathAge = user.age;
    addLog(`You died at age ${user.age} from ${cause}`, 'bad');
    
    // Auto-save the death state before transitioning
    saveToSlot();
    if (typeof saveGame === "function") {
        saveGame(true);
    }
    
    renderDeathScreen(user, cause);
}
//renders death screen
export function renderDeathScreen(user, cause) {
    // 1. Calculate Estate Distribution using pure engine
    const distribution = GameLogic.calculateEstateDistribution(user);
    const { totalEstate, spouseShare, inheritancePerChild, children, spouse, isInsolvent } = distribution;
    const hasChildren = children.length > 0;

    // 2. Build Estate Messaging
    let estateMessage = '';
    const moneyColorClass = totalEstate >= 0 ? 'text-green-400' : 'text-red-500';

    if (isInsolvent || totalEstate < 0) {
        if (hasChildren) {
            estateMessage = `<p class="text-slate-300 text-sm mb-4">You died in debt. Creditors absorbed the loss and seized estate assets, leaving your ${children.length} children debt-free with $0.</p>`;
        } else {
            estateMessage = `<p class="text-slate-400 text-sm mb-4 italic">You died in debt. Your creditors absorbed the loss.</p>`;
        }
    } else {
        const shares = [];
        if (spouseShare > 0 && spouse) shares.push(`<span class="text-green-400 font-bold">+$${spouseShare.toLocaleString()}</span> to your spouse, ${Utils.escapeHtml(spouse.name)}`);
        if (inheritancePerChild > 0) shares.push(`<span class="text-green-400 font-bold">+$${inheritancePerChild.toLocaleString()} each</span> to your ${children.length} children`);

        if (shares.length > 0) {
            estateMessage = `<p class="text-slate-300 text-sm mb-4">Your estate went ${shares.join(' and ')}.</p>`;
        } else {
            estateMessage = `<p class="text-slate-400 text-sm mb-4 italic">Having no heirs, your estate was surrendered to the government.</p>`;
        }
    }

    // 3. Build Child Selection UI
    let childrenOptionsHtml = '';
    if (hasChildren) {
        childrenOptionsHtml = children.map((child, index) => `
            <button data-action="continueAsChild" data-args="${index}, ${inheritancePerChild}" class="w-full btn-nav text-white font-bold py-3 rounded-xl mb-2 shadow hover:bg-slate-700 transition">
                Play as ${Utils.escapeHtml(child.name)} (Age ${child.age})
            </button>
        `).join('');
    }

    // 4. Generate the Eulogy procedurally (instant & zero API cost)
    const eulogy = EulogyGenerator.generate(user, state.gameState?.lifeLog, cause);
    state.gameState.currentEulogy = eulogy;

    // 5. Render Terminal Screen with Instant Eulogy
    const deathHTML = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-skull text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-4xl font-bold text-red-500 mb-2">You Died</h1>
            <p class="text-slate-300 text-lg mb-6">Age ${user.age} • Cause: ${Utils.escapeHtml(cause)}</p>
            
            <div id="eulogy-container" class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl">
                <h3 class="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider text-left">Life Summary</h3>
                <div class="relative w-full">
                    <p id="eulogy-text" class="text-slate-300 italic text-sm text-left leading-relaxed">"${Utils.escapeHtml(eulogy)}"</p>
                </div>
            </div>
            
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl">
                <h3 class="text-xl font-bold text-slate-400 mb-2 uppercase tracking-wider text-sm">Final Estate Value</h3>
                <p class="${moneyColorClass} text-3xl font-bold mb-4">${Utils ? Utils.formatMoney(totalEstate) : '$' + totalEstate.toLocaleString()}</p>
                ${estateMessage}
            </div>
            <div class="w-full space-y-3">
                ${childrenOptionsHtml}
                <button data-action="openTimeMachineModal" class="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 border border-cyan-400/30">
                    <i class="fas fa-hourglass-half text-amber-300"></i> Time Machine: Undo Death
                </button>
                <button data-action="resetGame" class="w-full btn-primary text-white font-bold py-4 rounded-xl text-lg mt-4 shadow-lg">
                    Start New Life
                </button>
            </div>
        </div>
    `;
    
    UI.resetHeader();
    UI.hideBottomNav();
    UI.renderScreen(deathHTML);
}

export function showFullEulogy() {
    if (state.gameState.currentEulogy) {
        UI.showModal("Life Summary", `<p class="text-slate-300 italic text-sm leading-relaxed">"${Utils.escapeHtml(state.gameState.currentEulogy)}"</p>`);
    }
}
//allows user to continue as their child, implements
export const continueAsChild = (childIndex, inheritedMoney) => {
    const parentState = state.gameState.user;
    const children = parentState.relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const selectedChild = children[childIndex];

    const safeInheritedMoney = Math.max(0, Number(inheritedMoney) || 0);
    const inheritedRelationships = GameLogic.inheritFamilyRelationships(parentState.relationships, selectedChild.id);

    // Calculate parent estate value
    const parentAssetVal = parentState.assets ? parentState.assets.reduce((sum, a) => sum + (a.value || 0), 0) : 0;
    const parentCompanyCash = (parentState.hasBusiness && parentState.compCash > 0) ? parentState.compCash : 0;
    const parentTotalEstate = (parentState.money || 0) + parentAssetVal + parentCompanyCash;

    // Create ancestor entry for graveyard
    const parentGen = parentState.generation || 1;
    const ancestor = {
        id: `ancestor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: parentState.username || parentState.name || 'Ancestor',
        gender: parentState.gender || 'male',
        ageAtDeath: parentState.age || 0,
        causeOfDeath: parentState.deathCause || 'Natural Causes',
        occupation: parentState.jobTitle
            || (parentState.hasBusiness && parentState.companyName ? `Founder of ${parentState.companyName}` : null)
            || (parentState.retiredFromJobTitle ? `${parentState.retiredFromJobTitle} (Retired)` : null)
            || (parentState.isRetired && (parentState.peakJobTitle || parentState.lastJobTitle) ? `${parentState.peakJobTitle || parentState.lastJobTitle} (Retired)` : null)
            || parentState.peakJobTitle
            || parentState.lastJobTitle
            || (parentState.isRetired ? 'Retired' : 'Unemployed'),
        finalNetWorth: parentTotalEstate,
        inheritedMoney: safeInheritedMoney,
        appearance: parentState.appearance || null,
        eulogy: state.gameState.currentEulogy || null,
        generation: parentGen,
        city: parentState.city || null,
        country: parentState.country || null
    };

    const existingPastLives = state.gameState.pastLives || parentState.pastLives || [];
    const updatedPastLives = [ancestor, ...existingPastLives];
    const newGeneration = parentGen + 1;

    const childStats = GameLogic.generateRandomStats ? GameLogic.generateRandomStats() : {
        health: 100,
        happiness: 100,
        smarts: Math.floor(Math.random() * 56) + 40,
        looks: Math.floor(Math.random() * 56) + 40
    };
    if (parentState.smarts) childStats.smarts = Math.min(100, Math.max(10, Math.floor(parentState.smarts * 0.7 + Math.random() * 30)));
    if (parentState.looks) childStats.looks = Math.min(100, Math.max(10, Math.floor(parentState.looks * 0.7 + Math.random() * 30)));

    // 1. Deep wipe and reconstruct user state
    const newUserState = {
        username: selectedChild.name,
        gender: selectedChild.type === 'Son' ? 'male' : 'female',
        city: parentState.city, // Inherits physical location
        age: selectedChild.age,
        money: safeInheritedMoney,
        health: 100,
        happiness: 100,
        smarts: childStats.smarts,
        looks: childStats.looks,
        generation: newGeneration,
        pastLives: updatedPastLives,
        purchases: parentState.purchases || [],
        
        // Reset dynamic flags
        isStudent: selectedChild.age >= 5 && selectedChild.age <= 18,
        universityEnrolled: false,
        universitySchoolYear: 0,
        universityGraduated: false,
        major: '',
        jobTitle: '',
        jobSalary: 0,
        jobPerformance: 50,
        hasBusiness: false,
        corporateDebt: { principal: 0, interestRate: 0.08, monthlyPayment: 0 },
        assets: [],
        diseases: [],
        isSick: false,
        hasFlu: false,
        relationships: inheritedRelationships,
        appearance: AvatarLogic.ensureAppearance(selectedChild),
        avatarVersion: selectedChild.avatarVersion || 0,
        isDead: false,
        isAlive: true
    };

    // Calculate initial life status
    newUserState.lifeStatus = GameLogic.checkLifeStatus(newUserState);

    // 2. Overwrite Single Source of Truth
    state.gameState.user = newUserState;
    state.gameState.pastLives = updatedPastLives;
    state.gameState.snapshots = [];
    
    // 3. Purge and restart Life Log at child's chronological age
    const inheritanceLogMsg = safeInheritedMoney > 0
        ? `Inherited ${Utils.formatMoney(safeInheritedMoney)} from the estate.`
        : `Started your new life with a clean financial slate ($0 debt).`;
    const inheritanceLogColor = safeInheritedMoney > 0 ? "text-green-400" : "text-slate-300";

    state.gameState.lifeLog = [{
        age: newUserState.age,
        events: [
            { msg: `You took over the life of ${newUserState.username} following your parent's death.`, color: "text-blue-400 font-bold" },
            { msg: inheritanceLogMsg, color: inheritanceLogColor }
        ]
    }];

    // Capture child's initial annual snapshot
    captureAnnualSnapshot(state.gameState);
    saveToSlot();

    // 4. Force cloud sync of the new character state, then mount UI
    if (typeof saveGame === "function") saveGame(true);
    renderLifeDashboard(state.gameState);
};


export function renderLifeDashboard(maybeGameState) {
    // --- Data Preparation ---
    const currentState = maybeGameState || state.gameState;
    if (!state || !currentState || !currentState.user) {
        console.warn("renderLifeDashboard called before game state existed.");
        return;
    }
    const user = currentState.user;

    // Guard 1: Deceased check -> Lock to death screen
    if (user && user.lifeStatus === "Deceased") {
        renderDeathScreen(user, user.deathCause || "natural causes");
        return;
    }

    // Guard 2: Pending funerals check -> Lock to funeral screen
    if (currentState.pendingFunerals && currentState.pendingFunerals.length > 0) {
        loadModule('funeral').then(m => {
            if (m && typeof m.processNextFuneral === 'function') {
                m.processNextFuneral();
            }
        });
        return;
    }

    // Guard 3: Pending teacher replacements check -> Lock to teacher replacement screen
    if (currentState.pendingTeacherReplacements && currentState.pendingTeacherReplacements.length > 0) {
        loadModule('funeral').then(m => {
            if (m && typeof m.processNextTeacherReplacement === 'function') {
                m.processNextTeacherReplacement();
            }
        });
        return;
    }

    // Guard 4: Pending random life events check -> Lock to life event modal
    if (currentState.pendingEvents && currentState.pendingEvents.length > 0) {
        loadModule('lifeEvents').then(m => {
            if (m && typeof m.processNextLifeEvent === 'function') {
                m.processNextLifeEvent();
            }
        });
        return;
    }

    if (user && user.inPrison) {
        loadModule('prison').then(m => {
            if (m && typeof m.renderPrisonDashboard === 'function') {
                m.renderPrisonDashboard();
            }
        });
        return;
    }
    //Update the Header Bar using the UI Manager
    if (typeof GameLogic.calculateUserMonthlyIncome === 'function') {
        user.monthlyIncome = GameLogic.calculateUserMonthlyIncome(user);
    }
    if (typeof GameLogic.calculateUserMonthlyOutflow === 'function') {
        user.monthlyOutflow = GameLogic.calculateUserMonthlyOutflow(user);
    }
    UI.updateHeader(user);
    const avatarElem = get('avatar-container');
    if ((user.name || user.username) && avatarElem) avatarElem.innerHTML = renderAvatar(user);
    const isCompact = localStorage.getItem('life_game_compact') === 'true';

    // Current Life Snapshot Strip Data
    const statusLabel = typeof GameLogic.checkLifeStatus === 'function' ? GameLogic.checkLifeStatus(user) : (user.lifeStatus || 'Citizen');
    const statusIcon = (user.isStudent || user.universityEnrolled || user.gradSchoolEnrolled)
        ? 'fa-graduation-cap text-blue-400'
        : ((user.jobTitle || user.hasBusiness) ? 'fa-briefcase text-emerald-400' : (user.age < 5 ? 'fa-baby text-pink-400' : 'fa-user-clock text-amber-400'));

    const netMonthly = (user.monthlyIncome || 0) - (user.monthlyOutflow || 0);
    const cashflowText = netMonthly === 0
        ? `${Utils.formatMoney(0, user.city)}/mo`
        : `${netMonthly > 0 ? '+' : ''}${Utils.formatCompactMoney(netMonthly, user.city)}/mo`;
    const cashflowColor = netMonthly > 0 ? 'text-emerald-400' : (netMonthly < 0 ? 'text-rose-400' : 'text-slate-400');

    const rels = Array.isArray(user.relationships) ? user.relationships : [];
    const spouse = rels.find(r => r.category === 'spouse' || r.type === 'Husband' || r.type === 'Wife');
    const partner = rels.find(r => r.category === 'partner');
    const socialLabel = spouse
        ? spouse.name.split(' ')[0]
        : (partner ? partner.name.split(' ')[0] : `${rels.length} ${rels.length === 1 ? 'Tie' : 'Ties'}`);
    const socialIcon = spouse ? 'fa-ring text-amber-400' : (partner ? 'fa-heart text-pink-400' : 'fa-users text-pink-400');

    const snapshotStripHtml = `
        <div id="dashboard-snapshot-strip" class="bg-slate-800/80 border border-slate-700/70 rounded-xl p-2 mb-2.5 grid grid-cols-3 gap-1.5 shrink-0 shadow-sm">
            <button type="button" data-action="renderActivities" class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-700/70 border border-slate-700/50 transition text-left min-w-0" title="View Occupation & Education">
                <i class="fas ${statusIcon} text-xs shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Role</div>
                    <div class="text-[11px] font-bold text-slate-200 truncate mt-0.5">${Utils.escapeHtml(statusLabel)}</div>
                </div>
            </button>
            <button type="button" data-action="renderAssets" class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-700/70 border border-slate-700/50 transition text-left min-w-0" title="View Assets & Cashflow">
                <i class="fas fa-chart-line ${cashflowColor} text-xs shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Cashflow</div>
                    <div class="text-[11px] font-bold ${cashflowColor} truncate mt-0.5 font-mono">${Utils.escapeHtml(cashflowText)}</div>
                </div>
            </button>
            <button type="button" data-action="renderRelationships" class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-700/70 border border-slate-700/50 transition text-left min-w-0" title="View Relationships">
                <i class="fas ${socialIcon} text-xs shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Circle</div>
                    <div class="text-[11px] font-bold text-slate-200 truncate mt-0.5">${Utils.escapeHtml(socialLabel)}</div>
                </div>
            </button>
        </div>
    `;

    // Generate the Life Log HTML 
    const logHtml = (currentState.lifeLog || []).map(l => {
        const safeAge = Number.isFinite(Number(l.age)) ? Math.floor(Number(l.age)) : 0;
        const isCurrentYear = safeAge === user.age;
        const badgeClasses = isCurrentYear
            ? `active-age-badge bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400/80 shadow-md shadow-indigo-500/25`
            : `bg-slate-800 text-blue-100 border-slate-600 shadow-sm`;
        return `
        <div class="${isCompact ? 'mb-2.5' : 'mb-4'} ${isCurrentYear ? 'current-age-log-card' : ''} group" data-log-age="${safeAge}">
            <div class="flex items-center ${isCompact ? 'mb-1' : 'mb-2'}">
                <div class="${badgeClasses} ${isCompact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1'} uppercase font-bold rounded-full border z-10 flex items-center">
                    <span>Age ${safeAge}</span>
                    ${isCurrentYear ? '<span class="ml-1.5 text-[8px] tracking-widest opacity-90">• Now</span>' : ''}
                </div>
                <div class="h-px bg-gradient-to-r from-slate-700 to-transparent flex-grow ml-2"></div>
            </div>

            <div class="${isCompact ? 'pl-2.5 border-l border-slate-700/50 ml-2.5 space-y-0.5 pb-0' : 'pl-3.5 border-l border-slate-700/50 ml-3.5 space-y-1.5 pb-0.5'}">
                ${(l.events || []).map(e => {
                    const rawColor = typeof e.color === 'string' ? e.color : '';
                    const colorStr = rawColor.replace(/[^a-zA-Z0-9_\-\s/]/g, '').trim();
                    const isGood = colorStr.includes('green') || colorStr.includes('emerald');
                    const isBad = colorStr.includes('red') || colorStr.includes('rose');
                    const isMajor = colorStr.includes('yellow') || colorStr.includes('amber');
                    const dotClass = isMajor
                        ? 'bg-amber-400 ring-2 ring-amber-400/30'
                        : isGood
                            ? 'bg-emerald-400'
                            : isBad
                                ? 'bg-rose-400'
                                : 'bg-slate-500';
                    return `
                    <div class="flex items-start gap-2 ${colorStr} ${isCompact ? 'text-xs py-0 leading-snug' : 'text-sm py-0.5'} transition-transform duration-200 hover:translate-x-1">
                        <span class="timeline-dot ${dotClass}"></span>
                        <span class="flex-1">${Utils.escapeHtml(e.msg)}</span>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');

    //Define Action Variables
    const isVip = hasPurchasedPack('vip_supporter');
    const vipBannerHtml = isVip ? `
        <div data-action="renderVipLoungeModal" class="bg-slate-800/80 hover:bg-slate-800 p-2.5 rounded-xl border border-amber-500/30 mb-2.5 flex items-center justify-between cursor-pointer transition shadow-sm shrink-0">
            <div class="flex items-center gap-2">
                <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full border border-amber-300 shadow-sm flex items-center gap-1">
                    <i class="fas fa-crown text-[9px]"></i> VIP
                </span>
                <span class="text-xs font-bold text-slate-200">VIP Supporter</span>
            </div>
            <span class="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                Lounge <i class="fas fa-chevron-right text-[9px]"></i>
            </span>
        </div>
    ` : '';

    //Define the Final HTML String
    const isBottomNav = UI.isBottomNavEnabled ? UI.isBottomNavEnabled() : localStorage.getItem('life_game_bottom_nav') !== 'false';
    const inlineNavHtml = !isBottomNav ? `
        <div class="mobile-inline-nav grid grid-cols-5 gap-1.5 sm:gap-2 pt-2 h-16 sm:h-18 shrink-0">
            <button data-action="renderAssets" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Assets">
                <i class="fas fa-coins mb-1 text-lg sm:text-xl text-yellow-400"></i>
                <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Assets</span>
            </button>
            <button data-action="renderActivities" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Work & Education">
                <i class="fas fa-user-graduate mb-1 text-lg sm:text-xl text-blue-400"></i>
                <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Work</span>
            </button>
            <button data-action="ageUp" class="btn-age-up btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center transition hover:brightness-110" title="Age Up (+1 Year)">
                <i class="fas fa-arrow-up mb-1 text-lg sm:text-xl"></i>
                <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Age Up +</span>
            </button>
            <button data-action="renderRelationships" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="Relationships & Social">
                <i class="fas fa-users mb-1 text-lg sm:text-xl text-pink-400"></i>
                <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Social</span>
            </button>
            <button data-action="renderMoreDashboard" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700 transition" title="More Options & Activities">
                <i class="fas fa-ellipsis-h mb-1 text-lg sm:text-xl text-slate-400"></i>
                <span class="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">More</span>
            </button>
        </div>
    ` : '';

    const activeDiseases = Array.isArray(user.diseases) ? user.diseases : [];
    const medicalBannerHtml = activeDiseases.length > 0 ? `
        <div id="dashboard-medical-banner" class="bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2 mb-2.5 flex items-center justify-between gap-2 shrink-0 shadow-sm">
            <div class="flex items-center gap-2 min-w-0">
                <i class="fas fa-notes-medical text-rose-400 text-xs shrink-0"></i>
                <div class="text-xs text-rose-200 truncate">
                    <span class="font-bold">Medical:</span> ${activeDiseases.map(d => Utils.escapeHtml(d.name)).join(', ')}
                </div>
            </div>
            <button type="button" data-action="visitDoctor" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shrink-0 transition">
                Doctor
            </button>
        </div>
    ` : '';

    const dashboardHTML = `
        <div class="flex flex-col h-full max-w-lg mx-auto">
            ${vipBannerHtml}
            ${snapshotStripHtml}
            ${medicalBannerHtml}
            <div id="life-history-card" class="flex-1 min-h-0 flex flex-col overflow-hidden ${!isBottomNav ? 'mb-2' : ''} bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h3 id="life-history-header" class="font-bold text-slate-300 px-4 py-2.5 sm:py-3 border-b border-slate-700/50 shrink-0">Life History</h3>
                <div id="life-history-scroll" class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-2">
                        ${logHtml.length > 0 ? logHtml : '<div class="text-slate-600 text-sm italic">Life has just begun...</div>'}
                    </div>
                </div>
            </div>
            ${inlineNavHtml}
        </div>
    `;
    
    //Use the UI Manager to inject the HTML into the game container and update navigation
    UI.renderScreen(dashboardHTML);
    UI.updateBottomNav('home');

    // Scroll directly to the player's current age entry (newest-first index 0 -> scrollTop = 0)
    const scrollEl = get('life-history-scroll');
    if (scrollEl) {
        const logs = currentState.lifeLog || [];
        const currentIdx = logs.findIndex(l => l.age === user.age);
        const activeCard = scrollEl.querySelector('.current-age-log-card');
        if (currentIdx <= 0) {
            scrollEl.scrollTop = 0;
        } else if (currentIdx === logs.length - 1) {
            scrollEl.scrollTop = scrollEl.scrollHeight;
        } else if (activeCard) {
            scrollEl.scrollTop = Math.max(0, activeCard.offsetTop - scrollEl.offsetTop - 36);
        } else {
            scrollEl.scrollTop = 0;
        }
    }
    const gameContainer = get('game-container');
    if (gameContainer) {
        gameContainer.scrollTop = 0;
    }

    // Show popup notification if the player contracted a new illness or condition this year
    if (user._pendingDiseaseNotification) {
        const contracted = user._pendingDiseaseNotification;
        delete user._pendingDiseaseNotification;
        const def = typeof GameLogic.getDiseaseDefinition === 'function'
            ? GameLogic.getDiseaseDefinition(contracted.id)
            : null;
        const isChronic = contracted.category === 'chronic';
        const badgeLabel = isChronic ? 'Chronic Condition' : (contracted.category === 'std' ? 'Medical Condition' : 'Illness / Sickness');
        const clinicVisitCost = typeof GameLogic.calculateMedicalVisit === 'function'
            ? GameLogic.calculateMedicalVisit().cost
            : 1000;
        const visitFeeText = (user.age || 0) < 18 ? 'Free (Under 18)' : Utils.formatMoney(def?.doctorCost || clinicVisitCost, user.city);
        const healthHit = def?.initialHealthHit ?? contracted.healthPenalty ?? 0;
        const hapHit = def?.initialHappinessHit ?? contracted.happinessPenalty ?? 0;
        const description = contracted.description || def?.note || 'You are experiencing symptoms and should consider seeing a doctor.';

        UI.showCustomModal({
            title: isChronic ? '🩺 Medical Diagnosis' : '🤒 Feeling Sick',
            content: `
                <div class="text-center py-2 space-y-3">
                    <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <i class="fas ${Utils.escapeHtml(contracted.icon || 'fa-virus')} text-2xl text-rose-400"></i>
                    </div>
                    <div>
                        <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 mb-1">${badgeLabel}</span>
                        <h4 class="text-lg font-extrabold text-white">${Utils.escapeHtml(contracted.name)}</h4>
                        <p class="text-xs text-slate-300 mt-1">${Utils.escapeHtml(description)}</p>
                    </div>
                    <div class="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 text-xs text-rose-300 font-semibold">
                        Impact: -${healthHit} Health${hapHit > 0 ? `, -${hapHit} Happiness` : ''}
                    </div>
                </div>
            `,
            confirmText: `Visit Doctor (${visitFeeText})`,
            cancelText: 'Dismiss',
            showCloseBtn: true,
            onConfirm: () => {
                loadModule('more').then(m => {
                    if (m && typeof m.visitDoctor === 'function') {
                        m.visitDoctor();
                    }
                });
            }
        });
    }

    // Conservative context-aware preloading during idle gameplay
    if (state.gameState) {
        preloadForContext(state.gameState);
    }
}

