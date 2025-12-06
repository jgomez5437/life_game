
function renderLifeDashboard() {
    updateHeader();
    const logHtml = game.lifeLog.map(l => `
        <div class="mb-2 text-sm border-l-2 border-slate-700 pl-3 py-1">
            <span class="font-bold text-slate-500 text-xs">Age ${l.age}</span>
            <div class="mt-1 space-y-1">
                ${l.events.map(e => `<div class="${e.color}">${e.msg}</div>`).join('')}
            </div>
        </div>
    `).join('');

    const ageUpAction = game.hasBusiness ? "handleCeoAgeUp()" : "ageUp()";
    const ageUpText = game.hasBusiness ? "Manage Biz" : "Age Up +";
    const ageUpColor = game.hasBusiness ? "btn-primary" : "btn-life";
    el('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <!-- Life Log (Scrollable) -->
            <div class="flex-1 overflow-y-auto mb-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 class="font-bold text-slate-300 mb-4 sticky top-0 bg-transparent backdrop-blur-md py-1 border-b border-slate-700/50">Life History</h3>
                <div class="space-y-2">
                    ${logHtml.length > 0 ? logHtml : '<div class="text-slate-600 text-sm italic">Life has just begun...</div>'}
                </div>
            </div>
            <!-- Bottom Nav -->
            <div class="grid grid-cols-3 gap-2 pt-2 h-20">
                 <button onclick="renderAssets()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-home mb-1 text-xl text-yellow-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Assets</span>
                </button>
                <button onclick="renderActivities()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-user-graduate mb-1 text-xl text-blue-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Occupation</span>
                </button>
                <button onclick="${ageUpAction}" class="${ageUpColor} text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <i class="fas fa-arrow-up mb-1 text-xl"></i>
                    <span class="text-[10px] uppercase tracking-wider">${ageUpText}</span>
                </button>
            </div>
        </div>
    `;
        }