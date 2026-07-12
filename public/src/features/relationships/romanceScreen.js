import { state } from '../../core/state.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderPersonInteraction } from './relationshipScreen.js';

const WEDDING_TIERS = [
    { name: "Courthouse", cost: 200, desc: "A simple, no-frills ceremony" },
    { name: "Small Ceremony", cost: 5000, desc: "A cozy gathering with close friends and family" },
    { name: "Big Wedding", cost: 20000, desc: "A grand celebration with all your loved ones" },
    { name: "Destination Wedding", cost: 50000, desc: "An unforgettable wedding abroad" }
];

export const openWeddingPlanner = (personId) => {
    const user = state.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const html = WEDDING_TIERS.map((tier, i) => {
        const canAfford = user.money >= tier.cost;
        if (canAfford) {
            return `
                <button data-action="confirmWeddingPlan" data-args="&apos;${personId}&apos;, ${i}" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 text-white font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between transition group">
                    <div class="text-left">
                        <div class="text-white font-bold">${tier.name}</div>
                        <div class="text-xs text-slate-400">${tier.desc}</div>
                    </div>
                    <div class="font-bold text-red-400">-${Utils.formatMoney(tier.cost)}</div>
                </button>
            `;
        } else {
            return `
                <button disabled class="w-full bg-slate-900 border border-slate-800 text-slate-500 font-bold py-3 px-4 rounded-xl mb-3 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div class="text-left">
                        <div class="font-bold">${tier.name}</div>
                        <div class="text-xs">${tier.desc}</div>
                    </div>
                    <div class="font-bold">INSUFFICIENT FUNDS</div>
                </button>
            `;
        }
    }).join('');

    const screenHtml = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-ring text-6xl text-pink-400 mb-6"></i>
            <h1 class="text-3xl font-bold text-white mb-2">Plan Your Wedding</h1>
            <p class="text-slate-300 text-sm mb-6">Choose how to marry ${person.name}.</p>
            <div class="w-full mb-6 text-right">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Bank Balance</span><br>
                <span class="text-green-400 font-bold text-xl">${Utils.formatMoney(user.money)}</span>
            </div>
            <div class="w-full">
                ${html}
                <button data-action="renderPersonInteraction" data-args="&apos;${personId}&apos;" class="w-full mt-4 text-slate-400 hover:text-white text-sm">Go Back</button>
            </div>
        </div>
    `;

    UI.renderScreen(screenHtml);
};

export const confirmWeddingPlan = (personId, index) => {
    const user = state.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const tier = WEDDING_TIERS[index];
    if (!tier || user.money < tier.cost) return;

    user.money -= tier.cost;
    person.category = 'spouse';
    person.type = person.gender === 'male' ? 'Husband' : 'Wife';
    person.status = Math.min(100, (person.status || 0) + 20);
    person.interactedThisYear = true;

    addLog(`You married ${person.name} in a ${tier.name.toLowerCase()} wedding!`, 'good');
    UI.updateHeader(user);
    UI.showModal('Congratulations!', `You are now married to ${person.name}!`);
    renderPersonInteraction(personId);
};
