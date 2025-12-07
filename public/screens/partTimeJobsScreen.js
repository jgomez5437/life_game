//PART TIME JOBS JOB MARKET PAGE

function renderJobMarket() {
    updateHeader();
    
    // Sort jobs by hourly pay
    const sortedJobs = [...PART_TIME_JOBS].sort((a, b) => b.hourly - a.hourly);
    const listHtml = sortedJobs.map(job => {
        const isCurrent = game.jobTitle === job.title;
        const btnText = isCurrent ? "Current" : "Apply";
        const btnClass = isCurrent 
            ? "bg-green-600/20 text-green-400 border border-green-600/50 cursor-default" 
            : "bg-blue-600 hover:bg-blue-500 text-white";
        return `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 ${isCurrent ? 'border-green-500/30' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                        <i class="fas ${job.icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white">${job.title}</h3>
                        <div class="text-xs text-green-400">$${job.hourly}/hr <span class="text-slate-500">(${formatMoney(job.salary)}/yr)</span></div>
                    </div>
                </div>
                <button onclick="${!isCurrent ? `applyForJob('${job.title}', ${job.salary}, false, false)` : ''}" class="${btnClass} text-xs font-bold py-2 px-4 rounded-lg transition">
                    ${btnText}
                </button>
            </div>
        </div>
    `}).join('');
    el('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-6 px-1">Job Market</h2>
            
            <div class="flex-1 overflow-y-auto pb-4">
                ${listHtml}
            </div>
        </div>
    `;
}
