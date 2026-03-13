window.renderRelationships = () => {
    const user = window.gameState.user;

    // --- 1. DATA PREP (Mock Data if none exists) ---
    // If user.relationships doesn't exist, let's create some dummy data for testing
    if (!user.relationships) {
        user.relationships = [
            { id: 1, name: "Maria", age: 34, type: "Mother", status: 90, category: "family" },
            { id: 2, name: "John", age: 36, type: "Father", status: 85, category: "family" },
            { id: 3, name: "Sarah", age: 8, type: "Sister", status: 60, category: "family" },
            { id: 4, name: "Mike", age: 12, type: "Friend", status: 75, category: "friend" },
            { id: 5, name: "Bully Bob", age: 13, type: "Enemy", status: 10, category: "enemy" }
        ];
    }

    // Filter by category
    const family = user.relationships.filter(r => r.category === 'family' || r.category === 'spouse' || r.category === 'child');
    const friends = user.relationships.filter(r => r.category === 'friend');
    const enemies = user.relationships.filter(r => r.category === 'enemy');

    // --- 2. HELPER: Generate Card HTML ---
    const getPersonCard = (person) => {
        // A. Determine Wellness Bar Color
        let barColor = 'bg-green-500';
        if (person.status < 30) barColor = 'bg-red-500';
        else if (person.status < 60) barColor = 'bg-yellow-500';

        // B. Determine Icon based on role
        let icon = 'fa-user';
        if (person.category === 'spouse') icon = 'fa-heart text-pink-400';
        else if (person.category === 'enemy') icon = 'fa-angry text-red-400';
        else if (person.category === 'child') icon = 'fa-baby text-blue-300';

        // C. Determine Badge Style (The Fix for Readability)
        let badgeStyle = "bg-slate-600 text-slate-100 border-slate-500"; // Default
        
        if (['family', 'spouse', 'child'].includes(person.category)) {
            badgeStyle = "bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-900/20"; 
        } else if (person.category === 'friend') {
            badgeStyle = "bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-900/20";
        } else if (person.category === 'enemy') {
            badgeStyle = "bg-red-600 text-white border-red-400 shadow-sm shadow-red-900/20";
        }

        return `
            <div onclick="openPersonOptions(${person.id})" class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 transition border border-slate-600">
                        <i class="fas ${icon}"></i>
                    </div>
                    
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <h4 class="font-bold text-white text-sm tracking-wide">${person.name}</h4>
                            
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}">
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
    };

    // --- 3. BUILD SECTIONS ---
    let content = '';

    // A. Family Section
    if (family.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-2 pl-1 flex items-center gap-2"><i class="fas fa-home text-blue-400"></i> Family</h3>`;
        content += family.map(p => getPersonCard(p)).join('');
    } else {
        content += `<div class="text-slate-600 italic text-sm text-center py-4 border border-dashed border-slate-800 rounded-xl mb-4">You have no family contacts.</div>`;
    }

    // B. Friends Section
    if (friends.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-user-friends text-green-400"></i> Friends</h3>`;
        content += friends.map(p => getPersonCard(p)).join('');
    }

    // C. Enemies Section
    if (enemies.length > 0) {
        content += `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-6 pl-1 flex items-center gap-2"><i class="fas fa-skull-crossbones text-red-400"></i> Enemies</h3>`;
        content += enemies.map(p => getPersonCard(p)).join('');
    }

    // --- 4. RENDER TO DOM ---
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderLifeDashboard(window.gameState)" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <div class="flex items-center justify-between mb-6 px-1">
                <h2 class="text-2xl font-bold text-white">Relationships</h2>
                <button class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
                    <i class="fas fa-plus"></i>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${content}
            </div>
        </div>
    `;
};

// --- INTERACTION SCREEN ---
window.renderPersonInteraction = (id) => {
    const user = window.gameState.user;
    const person = user.relationships.find(r => r.id === id);
    if (!person) return;

    // Interaction definitions (order matters for actionIndex)
    const interactions = [
        { name: 'Spend Time', key: 'spend_time', statusChange: 15, cost: 0, icon: 'fa-clock', desc: 'Spend quality time together' },
        { name: 'Give Money', key: 'give_money', statusChange: 10, cost: 500, icon: 'fa-money-bill', desc: 'Give a monetary gift' },
        { name: 'Insult', key: 'insult', statusChange: -20, cost: 0, icon: 'fa-angry', desc: 'Say something mean' },
        { name: 'Compliment', key: 'compliment', statusChange: 15, cost: 0, icon: 'fa-heart', desc: 'Say something nice' },
        { name: 'Call to Chat', key: 'call_chat', statusChange: 10, cost: 0, icon: 'fa-phone', desc: 'Have a quick chat over the phone' }
    ];

    const buttonsHtml = interactions.map((it, i) => {
        const canAfford = (user.money || 0) >= it.cost;
        const disabledAttr = canAfford ? '' : 'disabled';
        const btnClass = canAfford ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-700 text-slate-500 cursor-not-allowed';
        return `
            <button ${disabledAttr} onclick="openRelationshipConfirm(${person.id}, ${i})" class="w-full p-3 rounded-xl border border-slate-700 mb-3 ${btnClass} flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-lg">
                    <i class="fas ${it.icon} text-slate-400"></i>
                </div>
                <div class="text-left flex-1">
                    <div class="font-bold text-white">${it.name}</div>
                    <div class="text-xs text-slate-400">${it.desc}${it.cost ? ' — ' + window.Utils.formatMoney(it.cost) : ''}</div>
                </div>
                <div class="text-sm font-semibold text-white">${it.statusChange > 0 ? '+'+it.statusChange : it.statusChange}</div>
            </button>
        `;
    }).join('');

    // badge style
    let badgeStyle = "bg-slate-600 text-slate-100 border-slate-500";
    if (['family', 'spouse', 'child'].includes(person.category)) badgeStyle = "bg-blue-600 text-white border-blue-400";
    else if (person.category === 'friend') badgeStyle = "bg-emerald-600 text-white border-emerald-400";
    else if (person.category === 'enemy') badgeStyle = "bg-red-600 text-white border-red-400";

    // status bar color
    let barColor = 'bg-green-500';
    if (person.status < 30) barColor = 'bg-red-500';
    else if (person.status < 60) barColor = 'bg-yellow-500';

    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderRelationships()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Relationships
                </button>
            </div>

            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-white mx-auto mb-3 text-2xl border border-slate-600">
                    <i class="fas fa-user"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">${person.name}</h2>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle} inline-block mt-2">${person.type}</span>
                <p class="text-slate-400 text-sm mt-2">Age: ${person.age}</p>
            </div>

            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                <div class="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Relationship Status</div>
                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50 mb-2">
                    <div class="h-full ${barColor} transition-all duration-500" style="width: ${person.status}%"></div>
                </div>
                <div class="text-sm font-bold text-white">${person.status}%</div>
            </div>

            <div class="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest">Choose an Action</div>
            <div class="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                ${buttonsHtml}
            </div>
        </div>
    `;
};

// --- CONFIRM DIALOG LAUNCHER ---
window.openRelationshipConfirm = (personId, actionIndex) => {
    const user = window.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const actions = [
        { name: 'Spend Time', statusChange: 15, cost: 0 },
        { name: 'Give Money', statusChange: 10, cost: 500 },
        { name: 'Insult', statusChange: -20, cost: 0 },
        { name: 'Compliment', statusChange: 15, cost: 0 },
        { name: 'Call to Chat', statusChange: 10, cost: 0 }
    ];

    const action = actions[actionIndex];
    if (!action) return;

    const message = `<div class="text-sm text-slate-300 mb-4">Are you sure you want to <strong>${action.name}</strong> ${person.name}?` +
        (action.cost ? `<div class="mt-2 text-xs text-slate-400">This will cost ${window.Utils.formatMoney(action.cost)}</div>` : '') + `</div>`;

    // Use UI.showConfirm (added to ui.js) to present confirm/cancel
    window.UI.showConfirm(action.name, message, action.name, () => {
        // on confirm
        performRelationshipAction(personId, actionIndex);
    });
};

// --- CLICK HANDLER ---
window.openPersonOptions = (id) => {
    window.renderPersonInteraction(id);
};

// --- PERFORM ACTION ---
window.performRelationshipAction = (personId, actionIndex) => {
    const user = window.gameState.user;
    const person = user.relationships.find(r => r.id === personId);
    if (!person) return;

    const actions = [
        { name: 'Spend Time', statusChange: 15, cost: 0 },
        { name: 'Give Money', statusChange: 10, cost: 500 },
        { name: 'Insult', statusChange: -20, cost: 0 },
        { name: 'Compliment', statusChange: 15, cost: 0 },
        { name: 'Call to Chat', statusChange: 10, cost: 0 }
    ];

    const action = actions[actionIndex];
    if (!action) return;

    // Check funds
    if ((user.money || 0) < action.cost) {
        window.UI.showModal('Insufficient Funds', `You need ${window.Utils.formatMoney(action.cost)} to ${action.name.toLowerCase()}.`);
        return;
    }

    // Deduct cost
    if (action.cost > 0) user.money -= action.cost;

    // Update status
    const prev = person.status || 0;
    person.status = Math.max(0, Math.min(100, prev + action.statusChange));
    const delta = person.status - prev;

    // Log
    const color = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral';
    const sign = delta > 0 ? `+${delta}` : delta;
    window.addLog(`${action.name}: ${person.name} (${sign} relationship)`, color);

    // Update header (money might have changed)
    window.UI.updateHeader(user);

    // Feedback modal
    const title = delta > 0 ? 'Success' : delta < 0 ? 'Oops' : 'Done';
    window.UI.showModal(title, `${person.name}'s relationship status is now ${person.status}%.`);

    // Refresh interaction screen
    setTimeout(() => window.renderPersonInteraction(personId), 300);
};