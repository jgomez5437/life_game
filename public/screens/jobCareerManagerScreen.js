//MANAGE CAREER/PART TIME JOB PAGE

function renderCareerManager() {
    const user = window.gameState.user;
    const p = user.jobPerformance;
    const actionTaken = user.careerActionTaken;
    
    let barColor = 'bg-red-500';
    if(p > 75) barColor = 'bg-green-500';
    else if(p > 25) barColor = 'bg-yellow-500';
    // Action Button Styles
    const actionClass = actionTaken 
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";
    
     const slackClass = actionTaken 
        ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
        : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-3 text-2xl">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${user.jobTitle}</h2>
                <p class="text-green-400 text-sm font-bold">${window.Utils.formatMoney(user.jobSalary)} / year</p>
                <p class="text-slate-500 text-xs mt-1">${actionTaken ? "Action Taken This Year" : "Actions Available"}</p>
            </div>
            <!-- Performance -->
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
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
                <button onclick="${actionTaken ? '' : 'workHarderJob()'}" class="${actionClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-bold text-white">Work Harder</h3>
                            <div class="text-xs text-blue-200">Boost Performance (+15%)</div>
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-white"></i>
                </button>
                <button onclick="${actionTaken ? '' : 'slackOffJob()'}" class="${slackClass}">
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
                <button onclick="confirmQuitCareer()" class="bg-red-900/50 p-4 rounded-xl border border-red-700 flex items-center justify-between hover:bg-red-900 transition group mt-4 mb-8">
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

function workHarderJob() {
    const user = window.gameState.user;
    if (user.careerActionTaken) return;
    
    user.jobPerformance = Math.min(100, user.jobPerformance + 15);
    user.careerActionTaken = true;
    addLog("Worked hard at your job. Boss is impressed.", 'good');
    renderCareerManager();
}
function slackOffJob() {
    const user = window.gameState.user;
    if (user.careerActionTaken) return;
    user.jobPerformance = Math.max(0, user.jobPerformance - 15);
    user.careerActionTaken = true;
    addLog("Slacked off at work. Performance suffered.", 'bad');
    renderCareerManager();
}
function confirmQuitCareer() {
    const user = window.gameState.user;
    const m = get('modal-overlay');
    get('modal-title').innerText = "Quit Career?";
    get('modal-content').innerHTML = `Are you sure you want to resign from your position as <strong>${user.jobTitle}</strong>? You will lose your steady income.`;
    
    get('modal-actions').innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <button onclick="quitCareer()" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">Yes, Quit</button>
            <button onclick="document.getElementById('modal-overlay').classList.add('hidden'); document.getElementById('modal-overlay').classList.remove('flex');" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">Cancel</button>
        </div>
    `;
    m.classList.remove('hidden');
    m.classList.add('flex');
}

function quitCareer() {
    const user = window.gameState.user;
    const oldJob = user.jobTitle;
    user.jobTitle = null;
    user.jobSalary = 0;
    user.jobPerformance = 50;
    user.careerActionTaken = false;
    // Close Modal
    const m = get('modal-overlay');
    m.classList.add('hidden');
    m.classList.remove('flex');
    
    addLog(`Resigned from position as ${oldJob}.`, 'major'); 
    
    renderActivities();
}

function checkActionTaken() {
    const user = window.gameState.user;
    if (user.careerActionTaken) {
        user.careerActionTaken = false
    };
}
