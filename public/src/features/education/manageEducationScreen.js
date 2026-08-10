import { state } from '../../core/state.js';
import { renderActivities, getSchoolName } from '../career/occupationScreen.js';
import { renderLifeDashboard, addLog, refreshClassmates } from '../player/mainScreen.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { hasInstantDiplomaPerk, renderInstantDiplomaHub } from './instantDiploma.js';

const get = id => document.getElementById(id);

export function renderEducation() {
    const user = state.gameState.user;
    const p = user.schoolPerformance;
    
    // 1. DEFINE THE LIMIT
    // Job Manager uses 'user.careerActionTaken' (1 per year)
    // School uses 'user.schoolActions' (2 per year)
    const actionDisabled = user.schoolActions >= 2;
    const remainingActions = 2 - user.schoolActions;
    
    // 2. DEFINE THE COLORS (Bar)
    let barColor = 'bg-red-500';
    if(p > 75) barColor = 'bg-green-500';
    else if(p > 25) barColor = 'bg-yellow-500';

    // 3. DEFINE BUTTON STYLES (The "Gray out" Logic)
    // We toggle between a "Disabled Gray" string and an "Active Color" string
    
    // Style for "Work Harder" (Blue)
    const workClass = actionDisabled 
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";

    // Style for "Skip School" (Red/Dark)
    const skipClass = actionDisabled 
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";

    // 4. RENDER
    const schoolName = getSchoolName();
    let majorDisplay = "";
    if (user.universityEnrolled) {
        majorDisplay = `<div class="text-sm text-blue-300 mt-1">Major: ${user.major}</div>`;
    }

    const perkActive = hasInstantDiplomaPerk();

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4 flex items-center justify-between">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
                ${perkActive ? `
                    <button data-action="renderInstantDiplomaHub" class="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow">
                        <i class="fas fa-graduation-cap"></i> Instant Diploma Hub
                    </button>
                ` : ''}
            </div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 mx-auto mb-3 text-2xl">
                    <i class="fas fa-school"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${schoolName}</h2>
                ${majorDisplay}
                <p class="text-slate-400 text-sm">Attendance: Full-Time</p>
                <p class="text-slate-500 text-xs mt-1">Actions Remaining: ${remainingActions}/2</p>
            </div>

            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Performance</span>
                    <span class="${p > 75 ? 'text-green-400' : p < 25 ? 'text-red-400' : 'text-yellow-400'} font-bold">${p}%</span>
                </div>
                <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} transition-all duration-500" style="width: ${p}%"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-3">
                
                <button data-action="renderClassmates" class="bg-indigo-600 p-4 rounded-xl border border-indigo-500 flex items-center justify-between hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/50 cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Classmates</h3>
                            <div class="text-xs text-indigo-200">Socialize at school</div>
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-white"></i>
                </button>
                
                <button ${actionDisabled ? 'disabled' : `data-action="skipSchool"`} class="${skipClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 group-hover:text-red-300">
                            <i class="fas fa-running"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Skip School</h3>
                            <div class="text-xs text-slate-500">Take a break (-10% Grades)</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </button>

                <button ${actionDisabled ? 'disabled' : `data-action="workHarder"`} class="${workClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Work Harder</h3>
                            <div class="text-xs text-blue-200">Improve grades (+20%)</div>
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-white"></i>
                </button>
            </div>
        </div>
    `;
}
export function checkSchoolActionTaken(user) {
    if(user.schoolActions > 0) {
        user.schoolActions = 0
    }
}

export function workHarder() {
    const user = state.gameState.user;
    if(user.schoolActions >= 2) return;
    user.schoolActions++;
    user.schoolPerformance = Math.min(100, user.schoolPerformance + 20);
    const smartsGain = Math.floor(Math.random() * 3) + 2;
    user.smarts = Math.min(100, (user.smarts || 50) + smartsGain);
    addLog(`Studied hard! Improved grades (+20%) and gained +${smartsGain} Smarts.`, 'good');
    renderLifeDashboard(state.gameState);
}
export function skipSchool() {
    const user = state.gameState.user;
    if(user.schoolActions >= 2) return;
    user.schoolActions++;
    user.schoolPerformance = Math.max(0, user.schoolPerformance - 10);
    addLog("Skipped school to hang out. Grades suffered.", 'bad');
    renderLifeDashboard(state.gameState); 
}

export function renderClassmates() {
    const user = state.gameState.user;
    if (!user.relationships) user.relationships = [];
    
    let classmates = user.relationships.filter(r => r.isCurrentClassmate);
    
    // Lazy-load if they just opened the game
    if (classmates.length === 0) {
        refreshClassmates(user);
        classmates = user.relationships.filter(r => r.isCurrentClassmate);
    }
    
    let content = '';
    if (classmates.length > 0) {
        content = classmates.map(person => {
            let barColor = 'bg-green-500';
            if (person.status < 30) barColor = 'bg-red-500';
            else if (person.status < 60) barColor = 'bg-yellow-500';

            return `
                <div data-action="renderPersonInteraction" data-args="&apos;${person.id}&apos;, &apos;renderClassmates&apos;" class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-400 group-hover:bg-slate-600 transition border border-slate-600">
                            ${renderAvatar(person)}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-0.5">
                                <h4 class="font-bold text-white text-sm tracking-wide">${person.name}</h4>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-slate-600 text-slate-100 border-slate-500">
                                    ${person.type}
                                </span>
                            </div>
                            <div class="text-xs text-slate-400 font-medium">Age: ${person.age}</div>
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
        }).join('');
    } else {
        content = `<div class="text-slate-600 italic text-sm text-center py-4 border border-dashed border-slate-800 rounded-xl mb-4">No classmates found. Are you enrolled in school?</div>`;
    }

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderEducation" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Education
                </button>
            </div>
            <div class="mb-6 px-1 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">Classmates</h2>
            </div>
            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${content}
            </div>
        </div>
    `;
}