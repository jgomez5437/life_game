import { state } from '../../core/state.js';
import { renderActivities } from './occupationScreen.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { CAREER_TRACKS, SPECIAL_CAREER_TRACKS, PRO_SPORTS_LEAGUES } from '../../core/constants.js';
import { saveGame } from '../../core/main.js';
import { GameLogic } from '../../core/gameLogic.js';
import { loadModule } from '../../core/moduleLoader.js';
import { UI } from '../../ui/ui.js';

const get = id => document.getElementById(id);

//MANAGE CAREER/PART TIME JOB PAGE

export function renderCareerManager() {
    const user = state.gameState.user;
    if (user.careerTrack === 'mafia_syndicate') {
        return renderMafiaManager();
    }
    if (user.careerTrack === 'pro_athlete') {
        return renderAthleteManager();
    }

    const p = user.jobPerformance;
    const actionTaken = user.careerActionTaken;
    
    const minRetireYears = GameLogic.getMinRetireYears ? GameLogic.getMinRetireYears(user) : (user.careerTrack === 'military' ? 20 : (user.careerTrack === 'law_enforcement' ? 25 : 30));
    const currentYears = user.yearsInCareer || 0;
    const canRetire = currentYears >= minRetireYears;

    let barColor = 'bg-red-500';
    if (p > 75) barColor = 'bg-green-500';
    else if (p > 25) barColor = 'bg-yellow-500';

    // Career track level info
    let track = user.careerTrack ? CAREER_TRACKS.find(t => t.key === user.careerTrack) : null;
    if (!track && user.careerTrack) track = SPECIAL_CAREER_TRACKS.find(t => t.key === user.careerTrack);
    const lvlIdx = user.careerLevel || 0;
    const level  = track?.levels[lvlIdx];
    const totalLevels = track?.levels.length || 1;
    const yearsInRole = user.yearsInRole || 0;
    const minYears    = level?.minYears ?? null;
    const hasNextLevel = track && lvlIdx < track.levels.length - 1;

    let trackInfoHtml = '';
    if (track) {
        let promoStatus;
        if (!hasNextLevel) {
            promoStatus = `<span class="text-yellow-400 font-bold"><i class="fas fa-crown mr-1"></i>Top Level</span>`;
        } else if (minYears !== null && yearsInRole < minYears) {
            const remaining = minYears - yearsInRole;
            promoStatus = `<span class="text-slate-400">${remaining} more year${remaining !== 1 ? 's' : ''} before eligible</span>`;
        } else if (p >= 75) {
            promoStatus = `<span class="text-green-400 font-bold"><i class="fas fa-arrow-up mr-1"></i>Eligible for promotion!</span>`;
        } else {
            promoStatus = `<span class="text-yellow-400">Eligible but performance too low (need 75+)</span>`;
        }

        // Level progress dots
        const dots = track.levels.map((_, i) => {
            const filled = i <= lvlIdx;
            return `<div class="w-3 h-3 rounded-full ${filled ? 'bg-blue-400' : 'bg-slate-700'} border ${filled ? 'border-blue-300' : 'border-slate-600'}"></div>`;
        }).join('');

        trackInfoHtml = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">${track.label}</span>
                    <span class="text-xs text-slate-500">Level ${lvlIdx + 1} of ${totalLevels}</span>
                </div>
                <div class="flex gap-2 mb-3">${dots}</div>
                <div class="text-xs text-slate-400">${promoStatus}</div>
                ${minYears !== null && hasNextLevel ? `<div class="text-xs text-slate-600 mt-1">${yearsInRole}/${minYears} years in role</div>` : ''}
            </div>`;
    }

    const actionClass = actionTaken
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";
    const slackClass = actionTaken
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            <div class="text-center mb-4">
                <div class="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-3 text-2xl">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${Utils.escapeHtml(user.jobTitle)}</h2>
                <p class="text-green-400 text-sm font-bold">${Utils.formatMoney(user.jobSalary)} / year</p>
                <p class="text-slate-500 text-xs mt-1">${actionTaken ? "Action Taken This Year" : "Actions Available"}</p>
            </div>
            ${trackInfoHtml}
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Performance</span>
                    <span class="${p > 75 ? 'text-green-400' : p < 25 ? 'text-red-400' : 'text-yellow-400'} font-bold">${p}%</span>
                </div>
                <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} transition-all duration-500" style="width: ${p}%"></div>
                </div>
                <div class="text-[10px] text-slate-600 mt-2">Keep above 75% to unlock promotions. Below 20% risks demotion.</div>
            </div>
            <div class="grid grid-cols-1 gap-3">
                <button ${actionTaken ? 'disabled' : 'data-action="workHarderJob"'} class="${actionClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Work Harder</h3>
                            <div class="text-xs text-blue-100 font-medium">Boost Performance (+15%)</div>
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-white"></i>
                </button>
                <button ${actionTaken ? 'disabled' : 'data-action="slackOffJob"'} class="${slackClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 group-hover:text-red-300">
                            <i class="fas fa-couch"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Slack Off</h3>
                            <div class="text-xs text-slate-500">Reduce Stress (-15% Perf)</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </button>
                <button ${!canRetire ? 'disabled' : 'data-action="confirmRetire"'} class="${!canRetire ? 'bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed' : 'bg-amber-900/40 p-4 rounded-xl border border-amber-600/50 flex items-center justify-between hover:bg-amber-900/60 transition group'} mt-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400">
                            <i class="fas fa-cocktail"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold ${!canRetire ? 'text-slate-400' : 'text-amber-400 group-hover:text-amber-300'}">Retire</h3>
                            <div class="text-xs ${!canRetire ? 'text-slate-500' : 'text-amber-500/70'}">${!canRetire ? `Not Eligible - ${currentYears} / ${minRetireYears} Years` : 'Claim Pension & Stop Working'}</div>
                        </div>
                    </div>
                    ${canRetire ? '<i class="fas fa-chevron-right text-amber-500"></i>' : ''}
                </button>
                <button data-action="confirmQuitCareer" class="bg-red-900/50 p-4 rounded-xl border border-red-700 flex items-center justify-between hover:bg-red-900 transition group mt-4 mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                            <i class="fas fa-door-open"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Quit Career</h3>
                            <div class="text-xs text-red-300">Resign from position</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-red-500"></i>
                </button>
            </div>
        </div>
    `;
}

export function workHarderJob() {
    const user = state.gameState.user;
    if (user.careerActionTaken) return;
    
    const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;
    const baseBoost = userSmarts >= 75 ? 20 : userSmarts >= 50 ? 15 : 10;
    const skillBonuses = (user.careerTrack && GameLogic.getCareerSkillBonuses)
        ? GameLogic.getCareerSkillBonuses(user, user.careerTrack)
        : { workHarderBonus: 0 };
    const skillExtra = skillBonuses.workHarderBonus || 0;
    const boost = baseBoost + skillExtra;
    user.jobPerformance = Math.min(100, user.jobPerformance + boost);
    user.careerActionTaken = true;
    GameLogic.adjustStat(user, 'happiness', -2);
    const skillText = skillExtra > 0 ? ` [includes +${skillExtra}% from Skills]` : '';
    addLog(`Worked hard at your job (+${boost}% performance${skillText}, -2 Happiness). Boss is impressed.`, 'good');
    UI.updateHeader(user);
    renderCareerManager();
}
export function slackOffJob() {
    const user = state.gameState.user;
    if (user.careerActionTaken) return;
    user.jobPerformance = Math.max(0, user.jobPerformance - 15);
    user.careerActionTaken = true;
    GameLogic.adjustStat(user, 'happiness', 5);
    addLog("Slacked off at work (+5 Happiness). Performance suffered (-15%).", 'bad');
    UI.updateHeader(user);
    renderCareerManager();
}
export function confirmRetire() {
    const user = state.gameState.user;
    const pension = Math.floor(user.jobSalary * 0.66);
    UI.showCustomModal("Retire?", `
        <div class="text-center">
            <p class="text-white mb-4">Are you sure you want to retire from your position as <strong>${Utils.escapeHtml(user.jobTitle)}</strong>?</p>
            <p class="text-amber-400 font-bold mb-6">You will receive a pension of ${Utils.formatMoney(pension)}/yr.</p>
            <div class="grid grid-cols-2 gap-3">
                <button data-action="retire" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg">Yes, Retire</button>
                <button data-action="hideModal" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">Cancel</button>
            </div>
        </div>
    `);
}

export function retire() {
    const user = state.gameState.user;
    const oldJob = user.jobTitle;
    const pension = Math.floor(user.jobSalary * 0.66);
    
    user.isRetired = true;
    user.retirementPension = (user.retirementPension || 0) + pension;
    
    user.jobTitle = null;
    user.jobSalary = 0;
    user.jobPerformance = 50;
    user.careerActionTaken = false;
    user.careerTrack = null;
    user.careerLevel = 0;
    user.yearsInRole = 0;
    user.yearsInCareer = 0;
    user.consecutivePoorYears = 0;
    user.hasSeenJobSalary = false;
    
    UI.hideModal();
    addLog(`Retired from your position as ${oldJob}. You will now receive a pension of ${Utils.formatMoney(pension)}/yr.`, 'major');
    UI.updateHeader(user);
    renderActivities();
}

export function confirmQuitCareer() {
    const user = state.gameState.user;
    const m = get('modal-overlay');
    get('modal-title').innerText = "Quit Career?";
    get('modal-content').innerHTML = `Are you sure you want to resign from your position as <strong>${Utils.escapeHtml(user.jobTitle)}</strong>? You will lose your steady income.`;
    
    get('modal-actions').innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <button data-action="quitCareer" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">Yes, Quit</button>
            <button data-action="closeModal" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">Cancel</button>
        </div>
    `;
    m.classList.remove('hidden');
    m.classList.add('flex');
}

export function quitCareer() {
    const user = state.gameState.user;
    const oldJob = user.jobTitle;
    user.jobTitle = null;
    user.jobSalary = 0;
    user.jobPerformance = 50;
    user.careerActionTaken = false;
    user.careerTrack = null;
    user.careerLevel = 0;
    user.yearsInRole = 0;
    user.yearsInCareer = 0;
    user.consecutivePoorYears = 0;
    user.hasSeenJobSalary = false;
    // Close Modal
    const m = get('modal-overlay');
    m.classList.add('hidden');
    m.classList.remove('flex');
    
    GameLogic.adjustStat(user, 'happiness', -5);
    addLog(`Resigned from position as ${oldJob}. (-5 Happiness)`, 'major'); 
    UI.updateHeader(user);
    
    renderActivities();
}

export function checkActionTaken() {
    const user = state.gameState.user;
    if (user.careerActionTaken) {
        user.careerActionTaken = false
    };
}

// --- MAFIA CRIME SYNDICATE SPECIFIC UI ---

function renderMafiaManager() {
    const user = state.gameState.user;
    
    // Track info
    const track = SPECIAL_CAREER_TRACKS.find(t => t.key === 'mafia_syndicate');
    const lvlIdx = user.careerLevel || 0;
    const level  = track.levels[lvlIdx];
    const totalLevels = track.levels.length;
    
    // Quota
    const crimesCommitted = user.mafiaCrimesThisYear || 0;
    const quotaMet = crimesCommitted >= 3;
    const quotaClass = quotaMet ? 'text-green-400' : 'text-red-400';

    const dots = track.levels.map((_, i) => {
        const filled = i <= lvlIdx;
        return `<div class="w-3 h-3 rounded-full ${filled ? 'bg-red-500' : 'bg-slate-700'} border ${filled ? 'border-red-400' : 'border-slate-600'}"></div>`;
    }).join('');

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            <div class="text-center mb-4">
                <div class="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center text-red-500 mx-auto mb-3 text-2xl border border-red-500/30">
                    <i class="fas fa-user-ninja"></i>
                </div>
                <h2 class="text-2xl font-bold text-white uppercase tracking-widest">${Utils.escapeHtml(user.jobTitle)}</h2>
                <p class="text-red-400 text-sm font-bold">${Utils.formatMoney(user.jobSalary)} / year cut</p>
            </div>
            
            <div class="bg-slate-800 p-4 rounded-xl border border-red-900 mb-4 shadow-lg shadow-red-900/20">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">La Cosa Nostra</span>
                    <span class="text-xs text-slate-500">Rank ${lvlIdx + 1} of ${totalLevels}</span>
                </div>
                <div class="flex gap-2 mb-4">${dots}</div>
                
                <div class="bg-slate-900 rounded p-3 text-center border border-slate-700">
                    <div class="text-xs text-slate-400 uppercase tracking-widest mb-1">Yearly Quota</div>
                    <div class="text-2xl font-black ${quotaClass}">${crimesCommitted} / 3</div>
                    <div class="text-xs text-slate-500 mt-1">Complete 3 crimes or face a severe beating & no pay.</div>
                </div>
            </div>

            <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 px-1">Syndicate Actions</h3>
            <div class="grid grid-cols-1 gap-3 mb-8">
                ${createMafiaActionBtn('Shakedown', 'Extort a local business.', 'fa-hand-holding-usd', 'shakedown', quotaMet)}
                ${createMafiaActionBtn('Smuggle', 'Move contraband across the border.', 'fa-truck-loading', 'smuggle', quotaMet)}
                ${createMafiaActionBtn('Hijack', 'Steal a shipment of electronics.', 'fa-truck-moving', 'hijack', quotaMet)}
                ${createMafiaActionBtn('Bribe', 'Pay off a local official.', 'fa-handshake', 'bribe', quotaMet)}
                ${createMafiaActionBtn('Whack', 'Assassinate a rival gang member.', 'fa-crosshairs', 'whack', quotaMet)}
                
                <button data-action="confirmQuitCareer" class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition group mt-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                            <i class="fas fa-door-open"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Leave Syndicate</h3>
                            <div class="text-xs text-slate-500">Try to walk away</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </button>
            </div>
        </div>
    `;
}

function createMafiaActionBtn(title, desc, icon, actionType, quotaMet) {
    // If they met quota, maybe they can still do it, but let's make it look normal.
    // For now, they can do unlimited crimes, but only the first 3 count for the quota.
    return `
        <button data-action="attemptMafiaCrime" data-args="&apos;${actionType}&apos;" class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:border-red-500/50 hover:bg-red-900/10 transition group cursor-pointer">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-red-500">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="text-left">
                    <h3 class="font-bold text-white group-hover:text-red-400 transition">${title}</h3>
                    <div class="text-xs text-slate-400">${desc}</div>
                </div>
            </div>
            <i class="fas fa-chevron-right text-slate-600 group-hover:text-red-500 transition"></i>
        </button>
    `;
}

export function attemptMafiaCrime(type) {
    const user = state.gameState.user;
    const result = GameLogic.processMafiaCrime(type);
    
    if (typeof saveGame === 'function') saveGame();

    UI.updateHeader(user);

    if (result.success) {
        addLog(result.message, 'good');
        UI.showModal("Syndicate Success", `
            <div class="text-center space-y-3">
                <div class="text-4xl">💰</div>
                <h3 class="text-lg font-bold text-emerald-400">Action Successful</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
            </div>
        `);
        renderCareerManager();
    } else if (result.arrested) {
        addLog(result.message, 'bad');
        loadModule('crime').then(m => {
            if (m && typeof m.showArrestModal === 'function') {
                m.showArrestModal(user.pendingTrial.crime);
            }
        });
    }
}

export function renderAthleteManager() {
    const user = state.gameState.user;
    const league = PRO_SPORTS_LEAGUES[user.athleteSport] || PRO_SPORTS_LEAGUES.football;
    const lvlIdx = user.careerLevel || 0;
    const level = league.levels[lvlIdx] || league.levels[0];
    const totalLevels = league.levels.length;

    const contract = user.athleteContract || {
        contractType: 'Rookie Deal',
        totalYears: 2,
        yearsRemaining: 1,
        annualSalary: user.jobSalary || level.salary,
        totalValue: (user.jobSalary || level.salary) * 2
    };

    const quotaActions = user.athleteGamesThisYear || 0;
    const quotaMet = quotaActions >= 3;
    const quotaClass = quotaMet ? 'text-emerald-400' : 'text-amber-400';

    const dots = league.levels.map((lvl, i) => {
        const filled = i <= lvlIdx;
        return `<div class="w-3 h-3 rounded-full ${filled ? 'bg-emerald-500' : 'bg-slate-700'} border ${filled ? 'border-emerald-400' : 'border-slate-600'}" title="${lvl.title}"></div>`;
    }).join('');

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>

            <!-- Header Badge -->
            <div class="text-center mb-4">
                <div class="w-16 h-16 rounded-2xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 mx-auto mb-2.5 text-2xl border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
                    <i class="fas ${league.icon}"></i>
                </div>
                <div class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 mb-0.5">${league.leagueName}</div>
                <h2 class="text-2xl font-black text-white tracking-wide">${Utils.escapeHtml(user.jobTitle || level.title)}</h2>
                <p class="text-slate-300 text-xs font-semibold mt-0.5">${Utils.formatMoney(user.jobSalary)} / year salary</p>
            </div>

            <!-- Active Multi-Year Contract Card -->
            <div class="bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/30 mb-3 text-left">
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                        <i class="fas fa-file-contract text-emerald-400"></i> ${contract.team ? `${contract.team} · ` : ''}${contract.contractType || 'Active Contract'}
                    </span>
                    <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                        contract.yearsRemaining <= 1
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }">
                        ${contract.yearsRemaining <= 1 ? '🔥 Final Contract Year' : `${contract.yearsRemaining} of ${contract.totalYears} Yrs Left`}
                    </span>
                </div>
                <div class="flex items-center justify-between text-xs text-slate-300">
                    <span>Total Deal: <strong class="text-white">${contract.totalYears}-Yr / ${Utils.formatMoney(contract.totalValue)}</strong></span>
                    <span>Annual: <strong class="text-emerald-400">${Utils.formatMoney(user.jobSalary)}/yr</strong></span>
                </div>
            </div>

            <!-- Rank & Trophy Case Card -->
            <div class="bg-slate-800/90 p-4 rounded-xl border border-slate-700 mb-3 shadow">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">${league.name} Stature</span>
                    <span class="text-xs text-slate-400 font-semibold">Tier ${lvlIdx + 1} of ${totalLevels}</span>
                </div>
                <div class="flex gap-2 mb-3">${dots}</div>

                <!-- Trophies & Stats Grid -->
                <div class="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 text-center text-xs">
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase font-bold">Rings</div>
                        <div class="text-sm font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                            <i class="fas fa-ring text-[11px]"></i> ${user.athleteRings || 0}
                        </div>
                    </div>
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase font-bold">MVPs</div>
                        <div class="text-sm font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                            <i class="fas fa-trophy text-[11px]"></i> ${user.athleteMvps || 0}
                        </div>
                    </div>
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase font-bold">Career Cut</div>
                        <div class="text-sm font-black text-emerald-400 mt-0.5 truncate">
                            ${Utils.formatMoney(user.athleteCareerEarnings || user.jobSalary)}
                        </div>
                    </div>
                </div>

                <!-- Season Readiness Quota -->
                <div class="mt-3 bg-slate-900 rounded-lg p-2.5 text-center border border-slate-700/70">
                    <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Season Readiness Quota</div>
                    <div class="text-xl font-black ${quotaClass}">${quotaActions} / 3 Completed</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">Complete at least 3 season actions per year to remain in game shape and collect full pay.</div>
                </div>
            </div>

            <!-- Pro Actions Section -->
            <h3 class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">Pro Sports Operations</h3>
            <div class="space-y-2 mb-6">
                ${createAthleteActionBtn('Position Drills', 'Run playbook schemes and scrimmage (+5 Sport XP, +1 Health).', 'fa-clipboard-list', 'drills', 'text-emerald-400')}
                ${createAthleteActionBtn('Weight Room & Conditioning', 'Heavy strength and agility training (+5 Cond XP, +3 Health).', 'fa-dumbbell', 'conditioning', 'text-orange-400')}
                ${createAthleteActionBtn('Film Study & Playbook', 'Break down opposing schemes with coaches (+2 Smarts, 0% injury risk).', 'fa-video', 'film_study', 'text-indigo-400')}
                ${createAthleteActionBtn('Headline Rivalry Match', 'Lead your team on game day! High cash bonuses and playoff glory.', 'fa-star', 'play_match', 'text-amber-400')}
                ${createAthleteActionBtn('Brand Endorsement Deal', 'Sign sponsorship campaigns for gear and commercials (Rank 2+).', 'fa-handshake', 'endorsement', 'text-cyan-400', user.athleteEndorsementThisYear || lvlIdx < 1)}

                <button data-action="confirmQuitCareer" class="w-full bg-slate-800 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition group mt-3">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-bold text-white text-xs">Request Release / Retire</h4>
                            <div class="text-[10px] text-slate-500">Walk away from your pro contract</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600 text-xs"></i>
                </button>
            </div>
        </div>
    `;
}

function createAthleteActionBtn(title, desc, icon, actionType, iconColor = 'text-emerald-400', isDisabled = false) {
    const disabledAttr = isDisabled ? 'disabled' : '';
    const cursorClass = isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-800/60' : 'cursor-pointer hover:border-emerald-500/50 hover:bg-slate-750';

    return `
        <button data-action="attemptAthleteAction" data-args="&apos;${actionType}&apos;" ${disabledAttr} class="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between transition ${cursorClass}">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center ${iconColor} shrink-0 text-sm">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="text-left min-w-0 flex-1">
                    <div class="font-bold text-white text-xs truncate">${title}</div>
                    <div class="text-[10px] text-slate-400 truncate">${desc}</div>
                </div>
            </div>
            <i class="fas fa-chevron-right text-slate-600 text-xs shrink-0 ml-2"></i>
        </button>
    `;
}

export function attemptAthleteAction(type) {
    const user = state.gameState.user;
    const result = GameLogic.processAthleteAction(type);

    if (typeof saveGame === 'function') saveGame();
    UI.updateHeader(user);

    if (result.success) {
        addLog(result.message, 'good');
        UI.showModal("Team Facility Update", `
            <div class="text-center space-y-3">
                <div class="text-4xl">⚡</div>
                <h3 class="text-base font-bold text-emerald-400">Activity Logged</h3>
                <p class="text-xs text-slate-300 leading-relaxed">${result.message}</p>
            </div>
        `);
    } else {
        addLog(result.message, 'bad');
        UI.showModal("Action Unavailable", `
            <div class="text-center space-y-2">
                <div class="text-3xl">⚠️</div>
                <p class="text-xs text-slate-300">${result.message}</p>
            </div>
        `);
    }
    renderAthleteManager();
}
