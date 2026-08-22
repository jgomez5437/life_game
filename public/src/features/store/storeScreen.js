import { state, hasPurchasedPack } from '../../core/state.js';
export { hasPurchasedPack };
import { saveGame } from '../../core/main.js';
import { getAuthToken, login } from '../../auth/auth.js';
import { UI } from '../../ui/ui.js';
import { onVipPurchased } from '../../core/adManager.js';

const get = id => document.getElementById(id);

export const STORE_PACKS = [
    {
        id: 'god_mode',
        title: 'God Mode & Stat Editor',
        category: 'perk',
        price: '$2.99',
        badge: 'Popular',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: 'fa-bolt text-amber-400',
        desc: 'Take complete control of your life. Edit stats, avatar appearances for yourself & social circle, and stats on demand.',
        features: [
            'Instant Stat Maxing & Tuning (Health, Happiness, Smarts, Looks)',
            'Full Avatar Appearance Editor for Yourself & Social Circle',
            'Edit Hair, Skin, Eyes, Face & Accessories for Family & Partners',
            'Unlocked Cheats & Custom Life Events Menu'
        ],
        status: 'available'
    },
    {
        id: 'instant_diplomas',
        title: 'Instant Diplomas',
        category: 'perk',
        price: '$1.99',
        badge: 'New',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: 'fa-graduation-cap text-blue-400',
        desc: 'Bypass years of study and instantly obtain High School, University, and Graduate degrees.',
        features: [
            'Instant University Major Enrollment & Graduation',
            'Graduate Law, Medical & Business School Degrees',
            'Skip Academic Requirements & Entrance Exams',
            'Zero Tuition Debt & Instant Fast-Track'
        ],
        status: 'available'
    },
    {
        id: 'time_machine',
        title: 'Time Machine & Multi-Save Slots',
        category: 'perk',
        price: '$1.99',
        badge: 'Best Value',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: 'fa-hourglass-half text-cyan-400',
        desc: 'Never lose a great life to an accidental mistake. Rewind years or branch save files anytime.',
        features: [
            'Rewind Life up to 5 Years',
            'Unlimited Multi-Save Branch Slots',
            'Undo Catastrophic Life Events & Deaths',
            'Infinite Legacy Reincarnation Vault'
        ],
        status: 'available'
    },
    {
        id: 'mafia_syndicate',
        title: 'Mafia Crime Syndicate Career',
        category: 'career',
        price: '$2.99',
        badge: 'New',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: 'fa-user-ninja text-red-400',
        desc: 'Join La Cosa Nostra and rise from street Muscle to the Don. A high-risk, high-reward life of crime.',
        features: [
            'Exclusive Premium Career Track',
            'Commit 5 unique crimes (Shakedowns, Smuggling, Assassinations)',
            'Earn millions as a Mafia Boss',
            'Retain your underworld status even if you go to prison'
        ],
        status: 'available'
    },
    {
        id: 'vip_supporter',
        title: 'VIP Supporter & Unique Theme',
        category: 'cosmetic',
        price: '$4.99',
        badge: 'VIP',
        badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
        icon: 'fa-gem text-amber-300',
        desc: 'Support ongoing game development and unlock exclusive UI themes and VIP perks.',
        features: [
            '100% Ad-Free Experience',
            'Golden VIP Supporter Profile Badge',
            'Exclusive Onyx & Gold Luxury UI Themes',
            'Priority Access to New Expansion Betas'
        ],
        status: 'available'
    },
    {
        id: 'artist_pack',
        title: 'Artist & Creative Industry',
        category: 'career',
        price: '$3.99',
        badge: 'Career Pack',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: 'fa-paint-brush text-purple-400',
        desc: 'Become a world-renowned painter, sculptor, or digital artist. Showcase masterpieces in galleries and host auctions.',
        features: [
            'Paint & Sculpt Famous Masterpieces',
            'Host Art Gallery Exhibitions & Auctions',
            'Sell Prints & Collect Lifelong Royalties',
            'Build Creative Fame & Art Critic Reputation'
        ],
        status: 'coming_soon'
    },
    {
        id: 'athlete_pack',
        title: 'Athlete & Pro Sports',
        category: 'career',
        price: '$3.99',
        badge: 'Career Pack',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: 'fa-football-ball text-emerald-400',
        desc: 'Draft into professional sports leagues. Win championship rings, sign multi-million dollar contracts, and enter the Hall of Fame.',
        features: [
            'Pro Football, Basketball, Soccer & Baseball Leagues',
            'Draft Combine & Mega Contract Negotiations',
            'Championship Rings & MVP Trophies',
            'Endorsement Deals & Sports Hall of Fame'
        ],
        status: 'coming_soon'
    },
    {
        id: 'politician_pack',
        title: 'Politician & Head of State',
        category: 'career',
        price: '$3.99',
        badge: 'Career Pack',
        badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        icon: 'fa-landmark text-yellow-400',
        desc: 'Campaign from School Board to Governor and President. Pass legislation, debate rivals, and lead your nation.',
        features: [
            'Campaign Rallies, Speeches & Live Debates',
            'Run for Mayor, Governor, Senator & President',
            'Pass Laws & Manage Public Approval Ratings',
            'Diplomatic Summits & State Dinners'
        ],
        status: 'coming_soon'
    }
];

let currentActiveTab = 'all';



/**
 * Renders the primary Store Hub screen.
 */
export function renderStoreScreen(activeCategory = null) {
    if (activeCategory) {
        currentActiveTab = activeCategory;
    }

    const user = state.gameState?.user;
    if (user && !user.purchases) {
        user.purchases = [];
    }

    const filteredPacks = STORE_PACKS.filter(pack => {
        if (currentActiveTab === 'all') return true;
        if (currentActiveTab === 'coming_soon') return pack.status === 'coming_soon';
        return pack.category === currentActiveTab;
    });

    const storeHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <!-- Top Navigation Header -->
            <div class="mb-3 flex items-center justify-between">
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Life
                </button>
                <button data-action="restorePurchases" class="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition">
                    <i class="fas fa-sync-alt mr-1"></i> Restore Purchases
                </button>
            </div>

            <!-- Banner Header -->
            <div class="bg-gradient-to-r from-amber-900/40 via-purple-900/40 to-slate-800 border border-amber-500/30 rounded-2xl p-4 mb-4 shadow-xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 opacity-15 text-7xl text-amber-300 pointer-events-none">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="relative z-10">
                    <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                        <i class="fas fa-store"></i> Expansion Marketplace
                    </div>
                    <h2 class="text-2xl font-extrabold text-white">The Spot</h2>
                    <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                        Unlock new career paths, god mode cheats, cosmetic studios, and upcoming feature packs.
                    </p>
                </div>
            </div>

            <!-- Tab Filters -->
            <div class="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                ${renderTabButton('all', 'All Items', 'fa-border-all')}
                ${renderTabButton('perk', 'Perks', 'fa-bolt')}
                ${renderTabButton('career', 'Career Packs', 'fa-briefcase')}
                ${renderTabButton('cosmetic', 'Cosmetics', 'fa-palette')}
                ${renderTabButton('coming_soon', 'Coming Soon', 'fa-clock')}
            </div>

            <!-- Store Cards Grid -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-3 pb-6">
                ${filteredPacks.length > 0 ? filteredPacks.map(pack => renderPackCard(pack)).join('') : `
                    <div class="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <i class="fas fa-box-open text-3xl text-slate-600 mb-2"></i>
                        <p class="text-slate-400 text-sm">No items found in this category.</p>
                    </div>
                `}
            </div>
        </div>
    `;

    UI.renderScreen(storeHTML);
    UI.updateBottomNav('more');
}

function renderTabButton(tabId, label, icon) {
    const isActive = currentActiveTab === tabId;
    return `
        <button data-action="filterStoreCategory" data-args="'${tabId}'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/60'
            }">
            <i class="fas ${icon} text-xs"></i> ${label}
        </button>
    `;
}

function renderPackCard(pack) {
    const isOwned = hasPurchasedPack(pack.id);
    const isComingSoon = pack.status === 'coming_soon';

    return `
        <div class="bg-slate-800/90 border ${isOwned ? 'border-emerald-500/50' : 'border-slate-700'} rounded-2xl p-4 shadow-lg hover:border-slate-600 transition group relative overflow-hidden">
            ${isOwned ? `
                <div class="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <i class="fas fa-check-circle"></i> Owned
                </div>
            ` : `
                <div class="absolute top-3 right-3 border text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${pack.badgeColor}">
                    ${pack.badge}
                </div>
            `}

            <div class="flex items-start gap-3.5 mb-3">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    <i class="fas ${pack.icon}"></i>
                </div>
                <div class="pr-16">
                    <h3 class="font-bold text-white text-base leading-tight">${pack.title}</h3>
                    <p class="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">${pack.desc}</p>
                </div>
            </div>

            <!-- Bullet Feature Highlights -->
            <ul class="text-xs text-slate-300 space-y-1 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                ${pack.features.slice(0, 2).map(f => `
                    <li class="flex items-center gap-2">
                        <i class="fas fa-check text-[10px] text-amber-400"></i>
                        <span class="truncate">${f}</span>
                    </li>
                `).join('')}
                ${pack.features.length > 2 ? `
                    <li class="text-[10px] text-amber-400 font-semibold pl-4">
                        + ${pack.features.length - 2} more features included
                    </li>
                ` : ''}
            </ul>

            <!-- Footer Action Bar -->
            <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/60">
                <div class="text-slate-200">
                    <span class="text-xs text-slate-400 block -mb-1">Price</span>
                    <span class="text-lg font-black text-white">${pack.price}</span>
                </div>

                <div class="flex items-center gap-2">
                    <button data-action="previewPackDetails" data-args="'${pack.id}'" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 transition">
                        Details
                    </button>
                    ${isOwned ? (pack.id === 'instant_diplomas' ? `
                        <button data-action="renderInstantDiplomaHub" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1">
                            <i class="fas fa-graduation-cap"></i> Use Perk
                        </button>
                    ` : pack.id === 'god_mode' ? `
                        <button data-action="renderGodModeModal" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1">
                            <i class="fas fa-bolt"></i> Stat Editor
                        </button>
                    ` : pack.id === 'vip_supporter' ? `
                        <button data-action="renderVipLoungeModal" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1">
                            <i class="fas fa-gem"></i> VIP Lounge
                        </button>
                    ` : pack.id === 'time_machine' ? `
                        <button data-action="openTimeMachineModal" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1">
                            <i class="fas fa-hourglass-half"></i> Use Perk
                        </button>
                    ` : `
                        <button class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default">
                            Active
                        </button>
                    `) : isComingSoon ? (hasPurchasedPack('vip_supporter') ? `
                        <button data-action="previewPackDetails" data-args="'${pack.id}'" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5">
                            <i class="fas fa-flask"></i> Beta Preview
                        </button>
                    ` : `
                        <button data-action="buyPack" data-args="'${pack.id}'" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5">
                            <i class="fas fa-lock text-amber-400"></i> VIP Preview
                        </button>
                    `) : `
                        <button data-action="buyPack" data-args="'${pack.id}'" class="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5">
                            <i class="fas fa-shopping-cart"></i> Unlock
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

/**
 * Switch store category tab
 */
export function filterStoreCategory(category) {
    renderStoreScreen(category);
}

/**
 * Opens detailed modal for a specific pack
 */
export function previewPackDetails(packId) {
    const pack = STORE_PACKS.find(p => p.id === packId);
    if (!pack) return;

    const isOwned = hasPurchasedPack(packId);
    const isComingSoon = pack.status === 'coming_soon';
    const isVip = hasPurchasedPack('vip_supporter');

    if (isComingSoon && !isVip) {
        buyPack(packId);
        return;
    }

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center gap-3.5 bg-slate-900 p-3.5 rounded-xl border border-slate-700">
                <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                    <i class="fas ${pack.icon}"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-base">${pack.title}</h3>
                    <div class="text-xs font-bold text-amber-400 mt-0.5">${pack.price} • ${pack.category.toUpperCase()} ${isComingSoon ? '• VIP BETA PREVIEW' : ''}</div>
                </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">${pack.desc}</p>

            <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">What's Included:</h4>
                <ul class="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    ${pack.features.map(f => `
                        <li class="text-xs text-slate-200 flex items-start gap-2">
                            <i class="fas fa-check-circle text-amber-400 mt-0.5 shrink-0"></i>
                            <span>${f}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: pack.title,
        content: modalContent,
        confirmText: isOwned ? (pack.id === 'instant_diplomas' ? 'Open Instant Diploma Hub' : pack.id === 'vip_supporter' ? 'Open VIP Lounge' : 'Already Unlocked') : isComingSoon ? 'Close Preview' : `Unlock for ${pack.price}`,
        cancelText: 'Close',
        onConfirm: () => {
            if (!isOwned && !isComingSoon) {
                buyPack(packId);
            } else if (pack.id === 'instant_diplomas') {
                import('../education/instantDiploma.js').then(m => m.renderInstantDiplomaHub());
            } else if (pack.id === 'vip_supporter') {
                import('./vipLounge.js').then(m => m.renderVipLoungeModal());
            }
        }
    });
}

/**
 * Initiates pack purchase flow
 */
export async function buyPack(packId) {
    const pack = STORE_PACKS.find(p => p.id === packId);
    if (!pack) return;

    if (hasPurchasedPack(packId)) {
        UI.showModal("Already Unlocked", `You already own ${pack.title}!`);
        return;
    }

    if (pack.status === 'coming_soon') {
        const isVip = hasPurchasedPack('vip_supporter');
        if (!isVip) {
            UI.showCustomModal({
                title: "VIP Beta Preview Required",
                content: `
                    <div class="space-y-3 text-left">
                        <div class="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div>
                                <div class="text-sm font-bold text-white">${pack.title} Early Beta</div>
                                <div class="text-xs text-amber-400 font-semibold">VIP Supporter Feature</div>
                            </div>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">
                            Early beta previews and feature roadmaps for <strong>${pack.title}</strong> are exclusively available to <strong>VIP Supporters</strong> in the VIP Lounge.
                        </p>
                    </div>
                `,
                confirmText: "Unlock VIP Supporter ($4.99)",
                cancelText: "Cancel",
                onConfirm: () => buyPack('vip_supporter')
            });
            return;
        } else {
            previewPackDetails(packId);
            return;
        }
    }

    // Enforce login requirement before purchasing
    const authToken = await getAuthToken();
    if (!state.userAuthId || !authToken) {
        UI.showCustomModal({
            title: "Sign In Required to Purchase",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">${pack.title}</div>
                            <div class="text-xs text-amber-400 font-semibold">${pack.price} Expansion Pack</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Please sign in or create an account to unlock packs so your purchases are permanently saved to your account and accessible across all devices.
                    </p>
                </div>
            `,
            confirmText: "Sign In / Create Account",
            cancelText: "Continue Playing as Guest",
            onConfirm: () => {
                if (typeof login === 'function') {
                    login();
                }
            }
        });
        return;
    }

    // Attempt Stripe Checkout backend session initiation
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify({
                packId: pack.id
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.url) {
                if (typeof saveGame === 'function') {
                    try { await saveGame(); } catch (e) { console.warn("Pre-checkout save warning:", e); }
                }
                window.location.href = data.url;
                return;
            } else if (data.sandbox && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                console.warn("Stripe key not detected on backend. Running sandbox fallback for local development.");
                simulateSandboxPurchase(pack);
                return;
            } else {
                UI.showModal("Checkout Unavailable", "Payment service is currently unavailable. Please try again later.");
                return;
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error("Stripe API Error:", errData);
            UI.showModal("Checkout Error", errData.error || "Failed to initiate payment session.");
            return;
        }
    } catch (err) {
        console.error("Stripe Checkout Network Error:", err);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn("Running sandbox fallback for local dev offline test.");
            simulateSandboxPurchase(pack);
            return;
        }
        UI.showModal("Connection Error", "Could not connect to payment gateway. Please check your internet connection and try again.");
    }
}

/**
 * Simulates sandbox approval for testing entitlement activation
 */
function simulateSandboxPurchase(pack) {
    let localP = [];
    try {
        const stored = localStorage.getItem('life_game_purchases');
        if (stored) localP = JSON.parse(stored);
    } catch (e) {}

    if (!localP.includes(pack.id)) {
        localP.push(pack.id);
    }

    try {
        localStorage.setItem('life_game_purchases', JSON.stringify(localP));
    } catch (e) {}

    const user = state.gameState?.user;
    if (user) {
        if (!Array.isArray(user.purchases)) user.purchases = [];
        if (!user.purchases.includes(pack.id)) user.purchases.push(pack.id);
        saveGame();
    }

    // Sync pack entitlement across all saved slots in storage
    import('../../core/saveSlotManager.js').then(m => {
        if (m && typeof m.getSlotsStore === 'function') {
            const store = m.getSlotsStore();
            let modified = false;
            Object.keys(store.slots || {}).forEach(k => {
                const s = store.slots[k];
                if (s.data && s.data.user) {
                    if (!Array.isArray(s.data.user.purchases)) s.data.user.purchases = [];
                    if (!s.data.user.purchases.includes(pack.id)) {
                        s.data.user.purchases.push(pack.id);
                        modified = true;
                    }
                }
            });
            if (modified && typeof m.persistSlotsStore === 'function') {
                m.persistSlotsStore(store);
            }
        }
    }).catch(() => {});

    if (pack.id === 'vip_supporter') {
        onVipPurchased();
    }

    const celebrationHTML = `
        <div class="text-center py-2 space-y-3">
            <div class="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto animate-bounce">
                <i class="fas ${pack.icon}"></i>
            </div>
            <h3 class="text-lg font-extrabold text-white">Pack Unlocked!</h3>
            <p class="text-xs text-slate-300">
                ${pack.id === 'vip_supporter' ? '⭐ <strong>VIP Supporter — Ad-Free Active</strong>. Your 100% ad-free experience is now active.' : `You have successfully unlocked <strong>${pack.title}</strong>! All included features are now active for your character.`}
            </p>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-amber-300 font-semibold text-left">
                <i class="fas fa-gift mr-1"></i> Added to your account entitlements.
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Purchase Successful",
        content: celebrationHTML,
        confirmText: "Awesome!",
        onConfirm: () => {
            renderStoreScreen();
            import('../../core/saveSlotManager.js').then(m => {
                if (m && typeof m.renderSaveSlotManagerModal === 'function') {
                    m.renderSaveSlotManagerModal();
                }
            }).catch(() => {});
        }
    });
}

/**
 * Restores user purchases from database session
 */
export async function restorePurchases() {
    const user = state.gameState?.user;
    if (!user) return;

    try {
        const userAuthId = state.userAuthId;
        if (userAuthId && state.auth0Client) {
            const authToken = await getAuthToken();
            const response = await fetch('/api/getPurchases', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.purchases)) {
                    user.purchases = Array.from(new Set([...(user.purchases || []), ...data.purchases]));
                    saveGame();
                    UI.showModal("Purchases Restored", `Successfully restored ${data.purchases.length} purchased pack(s).`);
                    renderStoreScreen();
                    return;
                }
            }
        }
    } catch (err) {
        console.warn("API purchase restoration offline:", err);
    }

    const count = (user.purchases || []).length;
    UI.showModal("Purchases Restored", count > 0 
        ? `Your active entitlements (${count} pack(s)) have been synced to your current save.`
        : "No active purchases found for this save session."
    );
}

/**
 * Renders the God Mode Stat Editor Modal
 */
export function renderGodModeModal() {
    if (!hasPurchasedPack('god_mode')) {
        openGodModeHubModal();
        return;
    }

    const user = state.gameState?.user;
    if (!user) return;

    const h = user.health ?? 100;
    const hap = user.happiness ?? 100;
    const sm = user.smarts ?? 50;
    const lk = user.looks ?? 50;

    const html = `
        <div class="space-y-4">
            <p class="text-xs text-slate-300">God Mode allows you to edit your core stats on demand.</p>
            
            <div class="space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                <div>
                    <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span><i class="fas fa-heart text-emerald-400 mr-1"></i> Health</span>
                        <span id="god-health-val" class="text-emerald-400">${h}%</span>
                    </div>
                    <input type="range" id="god-health" min="0" max="100" value="${h}" oninput="document.getElementById('god-health-val').innerText = this.value + '%'" class="w-full accent-emerald-500">
                </div>

                <div>
                    <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span><i class="fas fa-smile text-amber-400 mr-1"></i> Happiness</span>
                        <span id="god-happiness-val" class="text-amber-400">${hap}%</span>
                    </div>
                    <input type="range" id="god-happiness" min="0" max="100" value="${hap}" oninput="document.getElementById('god-happiness-val').innerText = this.value + '%'" class="w-full accent-amber-400">
                </div>

                <div>
                    <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span><i class="fas fa-brain text-blue-400 mr-1"></i> Smarts</span>
                        <span id="god-smarts-val" class="text-blue-400">${sm}%</span>
                    </div>
                    <input type="range" id="god-smarts" min="0" max="100" value="${sm}" oninput="document.getElementById('god-smarts-val').innerText = this.value + '%'" class="w-full accent-blue-500">
                </div>

                <div>
                    <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span><i class="fas fa-sparkles text-pink-400 mr-1"></i> Looks</span>
                        <span id="god-looks-val" class="text-pink-400">${lk}%</span>
                    </div>
                    <input type="range" id="god-looks" min="0" max="100" value="${lk}" oninput="document.getElementById('god-looks-val').innerText = this.value + '%'" class="w-full accent-pink-500">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <button data-action="maxGodModeStats" class="py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1">
                    <i class="fas fa-bolt"></i> Max All (100%)
                </button>
                <button data-action="applyGodModeStats" class="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "God Mode Stat Editor",
        content: html,
        confirmText: null,
        cancelText: null
    });
}

export function maxGodModeStats() {
    if (!hasPurchasedPack('god_mode')) {
        UI.showModal("God Mode Locked", "You must unlock God Mode from The Spot store to use this cheat.");
        return;
    }
    const user = state.gameState?.user;
    if (!user) return;
    user.health = 100;
    user.happiness = 100;
    user.smarts = 100;
    user.looks = 100;
    saveGame();
    UI.updateHeader(user);
    UI.showModal("God Mode", "All stats maxed out to 100%!");
}

export function applyGodModeStats() {
    if (!hasPurchasedPack('god_mode')) {
        UI.showModal("God Mode Locked", "You must unlock God Mode from The Spot store to edit character stats.");
        return;
    }
    const user = state.gameState?.user;
    if (!user) return;
    const h = document.getElementById('god-health');
    const hap = document.getElementById('god-happiness');
    const sm = document.getElementById('god-smarts');
    const lk = document.getElementById('god-looks');

    if (h) user.health = Math.max(0, Math.min(100, parseInt(h.value, 10) || 0));
    if (hap) user.happiness = Math.max(0, Math.min(100, parseInt(hap.value, 10) || 0));
    if (sm) user.smarts = Math.max(0, Math.min(100, parseInt(sm.value, 10) || 0));
    if (lk) user.looks = Math.max(0, Math.min(100, parseInt(lk.value, 10) || 0));

    saveGame();
    UI.updateHeader(user);
    UI.showModal("Stats Updated", "Character stats have been updated via God Mode.");
}

/**
 * Renders the God Mode Hub Screen/Modal with options to edit stats and avatar appearance.
 */
export function openGodModeHubModal() {
    const isOwned = hasPurchasedPack('god_mode');

    if (!isOwned) {
        UI.showCustomModal({
            title: "God Mode Locked",
            content: `
                <div class="space-y-3 text-left">
                    <div class="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-white">God Mode & Stat Editor</div>
                            <div class="text-xs text-amber-400 font-semibold">$2.99 One-Time Purchase</div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        Unlock <strong>God Mode</strong> to freely edit your character's stats on demand, tune your looks, smarts, and health, and customize full vector SVG avatar appearances for yourself and your social circle.
                    </p>
                </div>
            `,
            confirmText: "Unlock God Mode ($2.99)",
            cancelText: "Cancel",
            onConfirm: () => buyPack('god_mode')
        });
        return;
    }

    const htmlContent = `
        <div class="space-y-3 text-left">
            <div class="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-extrabold text-white">God Mode Control Studio</h3>
                        <p class="text-xs text-amber-300">Edit character stats & avatar appearance</p>
                    </div>
                </div>
                <span class="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i class="fas fa-check"></i> Active
                </span>
            </div>

            <div class="grid grid-cols-1 gap-2.5 pt-1">
                <!-- Option 1: Stat Editor -->
                <div class="bg-slate-900 border border-slate-700 hover:border-amber-500/40 p-3.5 rounded-xl transition flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-sliders-h"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white">Core Stat Editor</h4>
                            <p class="text-[11px] text-slate-400 mt-0.5">Tune Health, Happiness, Smarts & Looks on demand</p>
                        </div>
                    </div>
                    <button data-action="renderGodModeModal" class="px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shrink-0">
                        Edit Stats
                    </button>
                </div>

                <!-- Option 2: Avatar Appearance Studio -->
                <div class="bg-slate-900 border border-slate-700 hover:border-amber-500/40 p-3.5 rounded-xl transition flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center text-lg shrink-0">
                            <i class="fas fa-user-edit"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white">Avatar Appearance Studio</h4>
                            <p class="text-[11px] text-slate-400 mt-0.5">Customize hair, face, eyes, skin tone & accessories</p>
                        </div>
                    </div>
                    <button data-action="renderGodModeAvatarModal" data-args="'self'" class="px-3 py-2 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white transition shrink-0">
                        Edit Avatar
                    </button>
                </div>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "God Mode Control Center",
        content: htmlContent,
        confirmText: null,
        cancelText: null
    });
}


