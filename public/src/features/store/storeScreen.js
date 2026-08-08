import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';

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
        desc: 'Take complete control of your life. Edit stats, parent wealth, and relationship levels on demand.',
        features: [
            'Instant Stat Maxing (Health, Happiness, Smarts, Looks)',
            'Parent Wealth & Karma Modifiers',
            'Custom Relationship Controls',
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
            'Permanent Smarts Credential Boost'
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
        id: 'mafia_expansion',
        title: 'Mafia / Crime Syndicate',
        category: 'career',
        price: '$3.99',
        badge: 'Career Pack',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: 'fa-user-ninja text-red-400',
        desc: 'Climb the criminal ranks from street associate to Godfather. Manage syndicates, rackets, and evade law enforcement.',
        features: [
            '5 International Crime Families (Italian, Yakuza, Cartel, Triad, Bratva)',
            'Extortion, Heists & Bootlegging Operations',
            'Bribe Judges & Hire Defense Lawyers',
            'Custom Hideouts, Armories & Loyalty Meters'
        ],
        status: 'coming_soon'
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
 * Checks if the current user owns a specified pack ID.
 */
export function hasPurchasedPack(packId) {
    const user = state.gameState?.user;
    if (!user) return false;
    if (!user.purchases) user.purchases = [];
    return user.purchases.includes(packId);
}

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
                <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition">
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
                    ${isOwned ? `
                        <button class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default">
                            Active
                        </button>
                    ` : isComingSoon ? `
                        <button data-action="buyPack" data-args="'${pack.id}'" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition flex items-center gap-1.5">
                            <i class="fas fa-bell"></i> Wishlist
                        </button>
                    ` : `
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

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center gap-3.5 bg-slate-900 p-3.5 rounded-xl border border-slate-700">
                <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                    <i class="fas ${pack.icon}"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-base">${pack.title}</h3>
                    <div class="text-xs font-bold text-amber-400 mt-0.5">${pack.price} • ${pack.category.toUpperCase()}</div>
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
        confirmText: isOwned ? 'Already Unlocked' : isComingSoon ? 'Wishlist Pack' : `Unlock for ${pack.price}`,
        cancelText: 'Close',
        onConfirm: () => {
            if (!isOwned) {
                buyPack(packId);
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
        UI.showModal(
            "Wishlisted!",
            `You have wishlisted <strong>${pack.title}</strong>! You'll be notified as soon as this expansion releases in a future update.`
        );
        return;
    }

    // Attempt Stripe Checkout backend session initiation
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                packId: pack.id,
                userAuthId: state.userAuthId || 'guest_user'
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
                return;
            } else if (data.sandbox) {
                console.warn("Stripe key not detected on backend. Running sandbox fallback.");
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error("Stripe API Error:", errData);
            if (errData.error) {
                UI.showModal("Stripe Error", `Failed to start checkout: ${errData.error}`);
                return;
            }
        }
    } catch (err) {
        console.warn("Stripe Checkout API offline or network error. Falling back to Sandbox Mode execution:", err);
    }

    // Fallback Sandbox Mode for instant testing/demo execution before live keys are configured
    simulateSandboxPurchase(pack);
}

/**
 * Simulates sandbox approval for testing entitlement activation
 */
function simulateSandboxPurchase(pack) {
    const user = state.gameState.user;
    if (!user.purchases) user.purchases = [];
    
    if (!user.purchases.includes(pack.id)) {
        user.purchases.push(pack.id);
    }

    saveGame();

    const celebrationHTML = `
        <div class="text-center py-2 space-y-3">
            <div class="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto animate-bounce">
                <i class="fas ${pack.icon}"></i>
            </div>
            <h3 class="text-lg font-extrabold text-white">Pack Unlocked!</h3>
            <p class="text-xs text-slate-300">
                You have successfully unlocked <strong>${pack.title}</strong>! All included features are now active for your character.
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
        if (userAuthId) {
            const response = await fetch(`/api/getPurchases?userAuthId=${encodeURIComponent(userAuthId)}`);
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
