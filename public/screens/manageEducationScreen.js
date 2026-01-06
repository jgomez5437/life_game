function renderEducation() {
    const user = window.gameState.user;
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

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
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
                
                <button onclick="${actionDisabled ? '' : 'skipSchool()'}" class="${skipClass}">
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

                <button onclick="${actionDisabled ? '' : 'workHarder()'}" class="${workClass}">
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
function checkSchoolActionTaken(user) {
    if(user.schoolActions === 2) {
        user.schoolActions = 0
    }
}

function workHarder() {
    const user = window.gameState.user;
    if(user.schoolActions >= 2) return;
    user.schoolActions++;
    user.schoolPerformance = Math.min(100, user.schoolPerformance + 20);
    addLog("Studied hard and improved your grades.", 'good');
    renderLifeDashboard(window.gameState);
}
function skipSchool() {
    const user = window.gameState.user;
    if(user.schoolActions >= 2) return;
    user.schoolActions++;
    user.schoolPerformance = Math.max(0, user.schoolPerformance - 10);
    addLog("Skipped school to hang out. Grades suffered.", 'bad');
    renderLifeDashboard(window.gameState); 
}