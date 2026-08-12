import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { renderMoreDashboard } from './moreScreen.js';
import { renderPrisonDashboard } from './prisonScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

const get = id => document.getElementById(id);

export function renderCrimeDashboard() {
    const user = state.gameState.user;
    const age = user.age || 0;

    if (age < 12) {
        UI.showModal("Too Young", "You must be at least 12 years old to engage in mischief or crime.");
        renderMoreDashboard();
        return;
    }

    const isTeen = age >= 12 && age < 18;
    const crimesList = Object.values(GameLogic.CRIMES);

    const juvenileCrimes = crimesList.filter(c => c.category === 'juvenile');
    const pettyCrimes = crimesList.filter(c => c.category === 'petty');
    const violentCrimes = crimesList.filter(c => c.category === 'violent');
    const heistCrimes = crimesList.filter(c => c.category === 'heist');

    get('game-container').innerHTML = `
        <div class="flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4 flex items-center justify-between">
                <button data-action="renderMoreDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to More Options
                </button>
            </div>
            
            <div class="flex items-center gap-3 mb-2 px-1">
                <div class="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 text-xl shrink-0 shadow">
                    <i class="fas fa-mask"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-white">Underworld & Crime</h2>
                    <p class="text-slate-400 text-xs">High-risk activities, mischief, street crime, and heists.</p>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto pb-6 space-y-5 mt-2">

                <!-- MISCHIEF -->
                <div class="space-y-2">
                    <div class="text-xs font-bold uppercase tracking-wider text-amber-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-ghost"></i> Mischief
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        ${juvenileCrimes.map(c => renderCrimeCard(c)).join('')}
                    </div>
                </div>

                ${!isTeen ? `
                <!-- PETTY & STREET CRIMES -->
                <div class="space-y-2">
                    <div class="text-xs font-bold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-user-ninja"></i> Street & Petty Crimes
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        ${pettyCrimes.map(c => renderCrimeCard(c)).join('')}
                    </div>
                </div>

                <!-- VIOLENT CRIMES -->
                <div class="space-y-2">
                    <div class="text-xs font-bold uppercase tracking-wider text-red-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-skull"></i> Violent Crimes
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        ${violentCrimes.map(c => renderCrimeCard(c)).join('')}
                    </div>
                </div>

                <!-- HIGH-STAKES HEISTS -->
                <div class="space-y-2">
                    <div class="text-xs font-bold uppercase tracking-wider text-purple-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-sack-dollar"></i> High-Stakes Heists
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        ${heistCrimes.map(c => renderCrimeCard(c)).join('')}
                    </div>
                </div>
                ` : `
                <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
                    <div class="text-amber-400 font-bold text-xs"><i class="fas fa-lock mr-1"></i>Adult Underworld Locked</div>
                    <div class="text-slate-400 text-xs">Petty street crimes, violent acts, and bank heists unlock at age 18.</div>
                </div>
                `}

            </div>
        </div>
    `;
}

function renderCrimeCard(crime) {
    const riskBadgeColor = crime.risk === 'low' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
        : crime.risk === 'medium' ? 'bg-amber-950/60 text-amber-400 border-amber-800/50'
        : 'bg-red-950/60 text-red-400 border-red-800/50';

    return `
        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-slate-600 transition flex items-center justify-between">
            <div class="space-y-0.5 pr-2">
                <div class="font-bold text-white text-sm flex items-center gap-2">
                    ${crime.name}
                    <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${riskBadgeColor}">${crime.risk} Risk</span>
                </div>
                ${crime.payoutMax > 0 ? `<div class="text-[11px] font-semibold text-emerald-400">Payout: Up to ${Utils.formatMoney(crime.payoutMax)}</div>` : ''}
            </div>
            <button data-action="openCrimeModal" data-args="${crime.id}" class="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shrink-0">
                Commit
            </button>
        </div>
    `;
}

export function openCrimeModal(crimeId) {
    const user = state.gameState.user;
    const crime = GameLogic.CRIMES[crimeId];

    if (!crime) return;

    const relationships = Array.isArray(user.relationships) ? user.relationships : [];
    const hasTargets = relationships.length > 0 && ['assault', 'attempted_murder', 'murder', 'burglary'].includes(crime.id);

    const targetDropdownHtml = hasTargets ? `
        <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-400">Select Specific Victim / Target</label>
            <select id="crime-target-select" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                <option value="">-- Random Stranger / Target --</option>
                ${relationships.map(r => `<option value="${r.id}">${r.name} (${r.type || r.category})</option>`).join('')}
            </select>
        </div>
    ` : '';

    const modalHtml = `
        <div class="space-y-4 text-left">
            <div class="bg-red-950/30 border border-red-800/50 p-3 rounded-xl space-y-1">
                <div class="font-bold text-white text-base flex items-center justify-between">
                    <span>${crime.name}</span>
                    <span class="text-xs uppercase font-extrabold text-red-400">${crime.risk} RISK</span>
                </div>
                <p class="text-xs text-slate-300">${crime.desc}</p>
                ${crime.payoutMax > 0 ? `<div class="text-xs font-bold text-emerald-400 mt-1">Est. Payout: ${Utils.formatMoney(crime.payoutMin)} - ${Utils.formatMoney(crime.payoutMax)}</div>` : ''}
            </div>

            ${targetDropdownHtml}

            <p class="text-xs text-slate-400">
                <i class="fas fa-exclamation-triangle text-amber-400 mr-1"></i>
                Failing to pull off this crime risks law enforcement apprehension, arrest, court trial, heavy fines, and loss of employment.
            </p>

            <div class="flex gap-2 pt-2 border-t border-slate-700">
                <button data-action="commitCrimeAction" data-args="${crime.id}" class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                    Execute ${crime.name}
                </button>
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg text-xs transition">
                    Cancel
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal(`Attempt ${crime.name}`, modalHtml);
}

export function commitCrimeAction(crimeId) {
    const user = state.gameState.user;
    const targetSelect = get('crime-target-select');
    const targetPersonId = targetSelect ? targetSelect.value : null;

    UI.hideModal();

    const result = GameLogic.attemptCrime(crimeId, user, targetPersonId);

    UI.updateHeader(user);

    if (result.success) {
        if (result.isMurder) {
            showMurderCoverUpModal(result.victimName);
            addLog(`Committed murder against ${result.victimName}. Case remains unsolved.`, 'bad');
        } else {
            addLog(result.message, 'good');
            UI.showModal("Crime Successful", `
                <div class="text-center space-y-3">
                    <div class="text-4xl">🥷</div>
                    <h3 class="text-lg font-bold text-emerald-400">${result.crime.name} Success</h3>
                    <p class="text-xs text-slate-300">${result.message}</p>
                </div>
            `);
        }
        renderCrimeDashboard();
    } else if (result.juvenileMischiefFailed) {
        addLog(result.message, 'bad');
        UI.showModal("Caught!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🙈</div>
                <h3 class="text-lg font-bold text-amber-400">Caught in the Act!</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
            </div>
        `);
        renderCrimeDashboard();
    } else if (result.arrested) {
        addLog(result.message, 'bad');
        showArrestModal(result.crime);
    }
}

export function showMurderCoverUpModal(victimName) {
    const html = `
        <div class="text-center space-y-4 py-2">
            <div class="w-16 h-16 rounded-full bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-500 text-3xl mx-auto shadow-xl">
                <i class="fas fa-user-secret"></i>
            </div>
            <div>
                <div class="text-xs font-bold uppercase tracking-widest text-red-400">Underworld File</div>
                <h3 class="text-2xl font-black text-white">Cold Case Established</h3>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed px-2">
                You successfully eliminated <strong class="text-white">${victimName}</strong>. Homicide detectives have established a crime scene, but found no forensic leads. Their contact profile has been erased.
            </p>
            <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1">
                <div class="text-slate-400"><i class="fas fa-search text-amber-400 mr-1.5"></i>Investigation Status: <span class="text-amber-300 font-semibold">Inactive / Cold Case</span></div>
                <div class="text-slate-400"><i class="fas fa-user-shield text-emerald-400 mr-1.5"></i>Suspect Status: <span class="text-emerald-400 font-semibold">No Suspects Identified</span></div>
            </div>
            <button data-action="hideModal" class="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-xs transition">
                Leave Crime Scene
            </button>
        </div>
    `;
    UI.showCustomModal("Homicide Outcome", html);
}

export function showArrestModal(crime, extraCharges = []) {
    const user = state.gameState.user;
    const pending = user.pendingTrial || { crime, extraCharges: [] };
    const hasAttemptedEscape = pending.extraCharges && pending.extraCharges.length > 0;

    const html = `
        <div class="text-left space-y-4">
            <div class="bg-red-950/60 border border-red-700/60 p-3.5 rounded-xl flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-red-900/80 border border-red-500 flex items-center justify-center text-red-400 text-2xl shrink-0">
                    <i class="fas fa-handcuffs"></i>
                </div>
                <div>
                    <div class="text-xs font-extrabold uppercase tracking-wider text-red-400">POLICE APPREHENSION</div>
                    <h3 class="text-lg font-bold text-white">You Are Under Arrest!</h3>
                    <div class="text-xs text-slate-300">Charged with: <strong>${pending.crime.name}</strong></div>
                </div>
            </div>

            ${hasAttemptedEscape ? `
                <div class="bg-red-950/80 border border-red-700 p-3 rounded-xl space-y-1">
                    <div class="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <i class="fas fa-lock text-red-400"></i> Apprehended & Handcuffed
                    </div>
                    <div class="text-xs text-amber-300 font-semibold">Charges Added: ${pending.extraCharges.join(', ')}</div>
                    <p class="text-[11px] text-red-300 italic pt-0.5">Officers have physically restrained you. You cannot attempt to flee or bribe officers again.</p>
                </div>
            ` : '<p class="text-xs text-slate-300">Choose your response to the arresting officers:</p>'}

            <div class="space-y-2">
                <button data-action="handleArrestChoice" data-args="&apos;comply&apos;" class="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition">
                    <span><i class="fas fa-hand-holding mr-2 text-white"></i>Comply & Cooperate</span>
                    <span class="text-[10px] text-blue-200">Proceed to Court</span>
                </button>

                ${!hasAttemptedEscape ? `
                <button data-action="openBribeModal" class="w-full bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 text-amber-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition">
                    <span><i class="fas fa-coins mr-2 text-amber-400"></i>Attempt to Bribe Officer</span>
                    <span class="text-[10px] text-amber-400">Uses Looks & Cash</span>
                </button>

                <button data-action="handleArrestChoice" data-args="&apos;flee&apos;" class="w-full bg-red-900/40 hover:bg-red-800/50 border border-red-700/50 text-red-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition">
                    <span><i class="fas fa-running mr-2 text-red-400"></i>Flee on Foot</span>
                    <span class="text-[10px] text-red-400">Uses Health & Agility</span>
                </button>
                ` : `
                <div class="text-center py-1">
                    <span class="text-[11px] text-slate-500 font-semibold"><i class="fas fa-ban mr-1"></i> Flee & Bribe options disabled after failed escape</span>
                </div>
                `}
            </div>
        </div>
    `;

    UI.showCustomModal("Police Arrest", html);
}

export function openBribeModal() {
    const user = state.gameState.user;

    const html = `
        <div class="space-y-3 text-left">
            <p class="text-xs text-slate-300">Offer the arresting officer cash under the table. Higher cash amounts and higher <strong>Looks</strong> increase bribe acceptance.</p>
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">Bribe Cash Offer</label>
                <input id="bribe-amount-input" type="number" value="${Math.min(5000, user.money || 0)}" min="500" max="${user.money || 0}" step="500" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <div class="text-[11px] text-slate-400 mt-1">Available Cash: ${Utils.formatMoney(user.money || 0)}</div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-700">
                <button data-action="submitBribeAction" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition">
                    Offer Cash Bribe
                </button>
                <button data-action="showArrestModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-xs transition">
                    Back
                </button>
            </div>
        </div>
    `;
    UI.showCustomModal("Bribe Officer", html);
}

export function submitBribeAction() {
    const user = state.gameState.user;
    const input = get('bribe-amount-input');
    const amount = input ? parseInt(input.value) : 0;

    const result = GameLogic.handleArrestAction(user, 'bribe', amount);

    UI.updateHeader(user);

    if (!result.success) {
        UI.showModal("Bribe Error", result.message);
        return;
    }

    if (result.outcome === 'escaped') {
        addLog(result.message, 'good');
        UI.showModal("Escaped Custody!", result.message);
        renderCrimeDashboard();
    } else {
        addLog(result.message, 'bad');
        showArrestModal(user.pendingTrial?.crime);
    }
}

export function handleArrestChoice(choice) {
    const user = state.gameState.user;
    const result = GameLogic.handleArrestAction(user, choice);

    UI.updateHeader(user);

    if (result.outcome === 'escaped') {
        addLog(result.message, 'good');
        UI.showModal("Escaped Custody!", result.message);
        renderCrimeDashboard();
    } else if (result.outcome === 'flee_failed') {
        addLog(result.message, 'bad');
        showArrestModal(user.pendingTrial?.crime);
    } else if (result.outcome === 'court') {
        showCourtArraignmentModal();
    }
}

export function showCourtArraignmentModal() {
    const user = state.gameState.user;
    const pending = user.pendingTrial;

    if (!pending) {
        renderCrimeDashboard();
        return;
    }

    const html = `
        <div class="text-left space-y-4">
            <div class="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-1">
                <div class="text-xs font-bold uppercase tracking-wider text-indigo-400">State District Court Arraignment</div>
                <h3 class="text-lg font-bold text-white">Pending Charge: ${pending.crime.name}</h3>
                <div class="text-xs text-slate-400">Prosecution Evidence Rating: <strong class="text-red-400">${pending.evidenceRating}%</strong></div>
                ${pending.extraCharges && pending.extraCharges.length > 0 ? `<div class="text-xs text-amber-300">Added Charges: ${pending.extraCharges.join(', ')}</div>` : ''}
            </div>

            <p class="text-xs text-slate-300">Select your legal representation for trial:</p>

            <div class="space-y-2">
                <button data-action="selectLegalCounsel" data-args="&apos;public_defender&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl text-left transition flex items-center justify-between">
                    <div>
                        <div class="font-bold text-white text-sm">Public Defender</div>
                        <div class="text-xs text-slate-400">Court-appointed public defender</div>
                    </div>
                    <span class="text-xs font-bold text-emerald-400">FREE</span>
                </button>

                <button data-action="selectLegalCounsel" data-args="&apos;private_attorney&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl text-left transition flex items-center justify-between">
                    <div>
                        <div class="font-bold text-white text-sm">Criminal Defense Attorney</div>
                        <div class="text-xs text-slate-400">Experienced private defense counsel</div>
                    </div>
                    <span class="text-xs font-bold text-white">${Utils.formatMoney(2500)}</span>
                </button>

                <button data-action="selectLegalCounsel" data-args="&apos;top_lawyer&apos;" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl text-left transition flex items-center justify-between">
                    <div>
                        <div class="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                            <i class="fas fa-crown text-amber-400"></i> High-Powered Law Firm
                        </div>
                        <div class="text-xs text-slate-400">Elite trial defense team</div>
                    </div>
                    <span class="text-xs font-bold text-amber-400">${Utils.formatMoney(25000)}</span>
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal("Court Trial Arraignment", html);
}

export function selectLegalCounsel(lawyerTier) {
    const user = state.gameState.user;
    const result = GameLogic.calculateTrialVerdict(user, lawyerTier);

    if (result && result.error) {
        UI.showModal("Insufficient Funds", result.error);
        return;
    }

    UI.updateHeader(user);

    if (result.verdict === 'not_guilty') {
        addLog(result.message, 'good');
        UI.showModal("Acquitted!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">⚖️</div>
                <h3 class="text-xl font-bold text-emerald-400">NOT GUILTY</h3>
                <p class="text-xs text-slate-300">The jury returned a verdict of not guilty! You walked out of the courtroom a free individual.</p>
            </div>
        `);
        renderCrimeDashboard();
    } else {
        addLog(result.message, 'bad');
        UI.showModal("Convicted & Sentenced", `
            <div class="text-center space-y-3">
                <div class="text-4xl">👨‍⚖️</div>
                <h3 class="text-xl font-bold text-red-400">GUILTY VERDICT</h3>
                <p class="text-xs text-slate-300">The judge read your formal sentence: <strong>${result.sentenceYears > 0 ? `${result.sentenceYears} years` : 'probation'}</strong> and <strong>${Utils.formatMoney(result.fine)}</strong> in court restitution.</p>
                <div class="bg-slate-900 p-2.5 rounded-lg text-xs text-slate-400 text-left">
                    • Court Fine Deducted: ${Utils.formatMoney(result.fine)}<br>
                    • Active Job Terminated: ${result.crime.category !== 'juvenile' ? 'Yes' : 'N/A'}<br>
                    • Criminal Record Updated: Permanent Felony Tag
                </div>
            </div>
        `);
        if (user.inPrison) {
            renderPrisonDashboard();
        } else {
            renderCrimeDashboard();
        }
    }
}

