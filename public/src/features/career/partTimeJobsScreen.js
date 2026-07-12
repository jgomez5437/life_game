import { state } from '../../core/state.js';
import { renderActivities } from './occupationScreen.js';
import { Utils } from '../../ui/utils.js';
import { PART_TIME_JOBS } from '../../core/main.js';

const get = id => document.getElementById(id);

//PART TIME JOBS JOB MARKET PAGE

export function renderJobMarket() {
    const user = state.gameState.user;
    
    // Sort jobs by hourly pay
    const sortedJobs = [...PART_TIME_JOBS].sort((a, b) => b.hourly - a.hourly);
    const listHtml = sortedJobs.map(job => {
        const isCurrent = user.jobTitle === job.title;
        const meetsReq = !job.reqUniversity || user.universityEnrolled || user.universityGraduated;
        const locked = !isCurrent && !meetsReq;

        let btn;
        if (isCurrent) {
            btn = `<span class="text-xs font-bold py-2 px-4 rounded-lg bg-green-600/20 text-green-400 border border-green-600/50">Current</span>`;
        } else if (locked) {
            btn = `<span class="text-xs font-bold py-2 px-4 rounded-lg bg-slate-700 text-slate-500 cursor-not-allowed">Locked</span>`;
        } else {
            btn = `<button data-action="applyForJob" data-args="&apos;${job.title}&apos;, ${job.salary}" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition">Apply</button>`;
        }

        const reqHtml = locked
            ? `<div class="text-[10px] text-red-400 mt-0.5"><i class="fas fa-lock mr-1"></i>Requires university enrollment</div>`
            : '';

        return `
        <div class="bg-slate-800 p-4 rounded-xl border ${isCurrent ? 'border-green-500/30' : locked ? 'border-slate-700 opacity-60' : 'border-slate-700'} mb-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                        <i class="fas ${job.icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white">${job.title}</h3>
                        <div class="text-xs text-green-400">$${job.hourly}/hr <span class="text-slate-500">(${Utils.formatMoney(job.salary)}/yr)</span></div>
                        ${reqHtml}
                    </div>
                </div>
                ${btn}
            </div>
        </div>
    `}).join('');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
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
