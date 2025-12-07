function renderEducation() {
    updateHeader();
    const p = game.schoolPerformance;
    const remainingActions = 2 - game.schoolActions;
    
    let barColor = 'bg-red-500';
    if(p > 75) barColor = 'bg-green-500';
    else if(p > 25) barColor = 'bg-yellow-500';
    const schoolName = getSchoolName();
    // Action Button Styles
    const actionDisabled = remainingActions <= 0;
    const actionClass = actionDisabled 
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition cursor-pointer";
    
    const skipClass = actionDisabled
         ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
         : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";
    const workClass = actionDisabled
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";
    // University Major Display
    let majorDisplay = "";
    if (game.universityEnrolled) {
        majorDisplay = `<div class="text-sm text-blue-300 mt-1">Major: ${game.major}</div>`;
    }
    el('game-container').innerHTML = `
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
            <!-- Performance -->
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-300 font-bold">Performance</span>
                    <span class="${p > 75 ? 'text-green-400' : p < 25 ? 'text-red-400' : 'text-yellow-400'} font-bold">${p}%</span>
                </div>
                <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} transition-all duration-500" style="width: ${p}%"></div>
                </div>
            </div>
            <!-- Actions Grid -->
            <div class="grid grid-cols-1 gap-3">
                <button onclick="${actionDisabled ? '' : 'skipSchool()'}" class="${skipClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 group-hover:text-red-300">
                            <i class="fas fa-running"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white group-hover:text-red-300">Skip School</h3>
                            <div class="text-xs text-slate-500">Take a break</div>
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
function workHarder() {
    if(game.schoolActions >= 2) return;
    game.schoolActions++;
    game.schoolPerformance = Math.min(100, game.schoolPerformance + 20);
    addLog("Studied hard and improved your grades.", 'good');
    renderLifeDashboard();
}
function skipSchool() {
    if(game.schoolActions >= 2) return;
    game.schoolActions++;
    game.schoolPerformance = Math.max(0, game.schoolPerformance - 10);
    addLog("Skipped school to hang out. Grades suffered.", 'bad');
    renderLifeDashboard(); 
}