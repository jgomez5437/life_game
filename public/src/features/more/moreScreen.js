import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, addLog } from '../player/mainScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';

const get = id => document.getElementById(id);

export function renderMoreDashboard() {
    const user = state.gameState.user;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-4 px-1">More Options</h2>
            <p class="text-slate-400 text-sm mb-6 px-1">Improve your life and health with these activities.</p>
            
            <div class="flex-1 overflow-y-auto pb-4 space-y-4">
                
                <!-- Gym Membership -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 border border-blue-500/50">
                                <i class="fas fa-dumbbell"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Gym</h3>
                                <div class="text-xs ${user.gymMembership ? 'text-green-400' : 'text-slate-500'}">
                                    ${user.gymMembership ? 'Monthly Member' : 'Not a member'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-4">
                        <button data-action="visitGymOneTime" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm text-white font-bold transition">
                            ${user.gymMembership ? 'Visit' : 'Visit Once ($20)'}
                        </button>
                        ${user.gymMembership ? `
                            <button data-action="cancelGymMembership" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 p-2 rounded text-sm text-white font-bold transition">
                                Cancel ($50/mo)
                            </button>
                        ` : `
                            <button data-action="buyGymMembership" class="bg-blue-600 hover:bg-blue-500 p-2 rounded text-sm text-white font-bold transition">
                                Join ($50/mo)
                            </button>
                        `}
                    </div>
                </div>

                <!-- Diet Plan -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 border border-green-500/50">
                                <i class="fas fa-apple-alt"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Better Diet</h3>
                                <div class="text-xs ${user.hasBetterDiet ? 'text-green-400' : 'text-slate-500'}">
                                    ${user.hasBetterDiet ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-4">Eating better slows down health decay. Costs $200/mo.</p>
                    <div class="flex justify-end">
                        ${user.hasBetterDiet ? `
                            <button data-action="cancelBetterDiet" class="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 px-4 py-2 rounded text-sm text-white font-bold transition w-full">
                                Go back to cheap food
                            </button>
                        ` : `
                            <button data-action="startBetterDiet" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm text-white font-bold transition w-full">
                                Start Diet ($200/mo)
                            </button>
                        `}
                    </div>
                </div>

                <!-- Medical Visit -->
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 border border-red-500/50">
                                <i class="fas fa-stethoscope"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">Medical Checkup</h3>
                                <div class="text-xs text-slate-500">Restore your health</div>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mb-4">A full physical can catch issues early and provide a quick health boost.</p>
                    <button data-action="visitDoctor" class="bg-red-600 hover:bg-red-500 w-full py-2 rounded text-sm text-white font-bold transition">
                        Visit Doctor ($1,000)
                    </button>
                </div>

            </div>
        </div>
    `;
}

export function visitGymOneTime() {
    const user = state.gameState.user;
    const { boost, cost } = GameLogic.calculateOneTimeGymVisit();
    const actualCost = user.gymMembership ? 0 : cost;
    
    if (user.money >= actualCost) {
        user.money -= actualCost;
        user.health = Math.min(100, user.health + boost);
        addLog("You worked out at the gym for a day.", 'good');
        UI.updateHeader(user);
        renderMoreDashboard();
    } else {
        UI.showModal("Not enough money", "You cannot afford the one-time gym fee.");
    }
}

export function buyGymMembership() {
    const user = state.gameState.user;
    user.gymMembership = true;
    addLog("You bought a gym membership.", 'good');
    renderMoreDashboard();
}

export function cancelGymMembership() {
    const user = state.gameState.user;
    user.gymMembership = false;
    addLog("You cancelled your gym membership.", 'neutral');
    renderMoreDashboard();
}

export function startBetterDiet() {
    const user = state.gameState.user;
    user.hasBetterDiet = true;
    addLog("You started eating a healthier diet.", 'good');
    renderMoreDashboard();
}

export function cancelBetterDiet() {
    const user = state.gameState.user;
    user.hasBetterDiet = false;
    addLog("You stopped your healthy diet to save money.", 'neutral');
    renderMoreDashboard();
}

export function visitDoctor() {
    const user = state.gameState.user;
    const { boost, cost } = GameLogic.calculateMedicalVisit();
    
    if (user.money >= cost) {
        user.money -= cost;
        user.health = Math.min(100, user.health + boost);
        addLog("You visited the doctor and feel much healthier.", 'good');
        UI.updateHeader(user);
        renderMoreDashboard();
    } else {
        UI.showModal("Not enough money", "You cannot afford to visit the doctor.");
    }
}
