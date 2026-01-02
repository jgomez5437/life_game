function renderCareerMarket() {
    const user = window.gameState.user;
    // Sort careers by salary descending
    const sortedCareers = [...CAREERS].sort((a, b) => b.salary - a.salary);
    const listHtml = sortedCareers.map(job => {
        const isCurrent = user.jobTitle === job.title;
        const btnText = isCurrent ? "Current" : "Apply";
        const btnClass = isCurrent 
            ? "bg-green-600/20 text-green-400 border border-green-600/50 cursor-default" 
            : "bg-blue-600 hover:bg-blue-500 text-white";
        
        let warnings = [];
        if (job.reqDegree && !user.universityGraduated) warnings.push("University Degree Required");
        if (job.reqGrad && user.gradSchoolDegree !== job.reqGrad) warnings.push(`${job.reqGrad} Degree Required`);
        
        const warningHtml = warnings.length > 0 
            ? `<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-exclamation-circle"></i> ${warnings.join(", ")}</div>` 
            : "";
        return `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 ${isCurrent ? 'border-green-500/30' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                        <i class="fas ${job.icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white">${job.title}</h3>
                        <div class="text-xs text-green-400">${window.Utils.formatMoney(job.salary)}/yr</div>
                        ${warningHtml}
                    </div>
                </div>
                <button onclick="${!isCurrent ? `applyForJob('${job.title}', ${job.salary}, ${job.reqDegree}, '${job.reqGrad}')` : ''}" class="${btnClass} text-xs font-bold py-2 px-4 rounded-lg transition">
                    ${btnText}
                </button>
            </div>
        </div>
    `}).join('');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-6 px-1">Find a Career</h2>
            
            <div class="flex-1 overflow-y-auto pb-4">
                ${listHtml}
            </div>
        </div>
    `;
};
function applyForJob(title, salary, reqDegree, reqGrad) {
    const user = window.gameState.user;
    if (reqDegree && !user.universityGraduated) {
        return showModal("Qualifications Missing", "This job requires a University Degree.");
    }
    if (reqGrad && reqGrad !== 'undefined' && reqGrad !== 'null' && user.gradSchoolDegree !== reqGrad) {
        return showModal("Qualifications Missing", `This job requires a degree from ${reqGrad}.`);
    }
    
    user.jobTitle = title;
    user.jobSalary = salary;
    
    // Reset job-specific stats
    user.jobPerformance = 50;
    user.careerActionTaken = false;
    addLog(`Hired as a ${title}! Annual Salary: ${window.Utils.formatMoney(salary)}`, 'good');
    
    // Return to appropriate page
    if (reqDegree === false && !reqGrad) renderJobMarket(); // Simplistic check for part time
    else renderCareerMarket();
};