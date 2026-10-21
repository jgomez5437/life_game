// ─────────────────────────────────────────────────────────────────────────────
// desktopPanels.js
// Renders the persistent desktop (≥1024px) side columns:
//   • Left  (#desktop-left-panel):  Character Profile
//   • Right (#desktop-right-panel): Age Up, tab navigation & "Next Steps"
// The center column is the existing #game-container, so every screen keeps
// rendering exactly as before. Lazily loaded by UI.updateDesktopPanels().
// All interactivity uses declarative data-action / data-args attributes.
// ─────────────────────────────────────────────────────────────────────────────
import { GameLogic } from '../../core/gameLogic.js';
import { hasPurchasedPack } from '../../core/state.js';
import { Utils } from '../../ui/utils.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
import { buildRecommendations, needsWorkAttention, needsAssetsAttention } from '../../core/recommendations.js';

const esc = (v) => Utils.escapeHtml(v === undefined || v === null ? '' : String(v));
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

const TONE_STYLES = {
    good:    { icon: 'bg-emerald-500/15 text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/30' },
    bad:     { icon: 'bg-rose-500/15 text-rose-400',       bar: 'bg-rose-500',    border: 'border-rose-500/40' },
    warn:    { icon: 'bg-amber-500/15 text-amber-400',     bar: 'bg-amber-500',   border: 'border-amber-500/30' },
    info:    { icon: 'bg-blue-500/15 text-blue-400',       bar: 'bg-blue-500',    border: 'border-slate-700/60' },
    neutral: { icon: 'bg-slate-700/60 text-slate-300',     bar: 'bg-slate-500',   border: 'border-slate-700/60' }
};

/** Serializes args into the comma-separated format parsed by main.js parseActionArgs. */
export function serializeArgs(args) {
    if (!Array.isArray(args) || args.length === 0) return '';
    return args.map(a => (typeof a === 'number' || typeof a === 'boolean') ? String(a) : `'${String(a).replace(/[',]/g, '')}'`).join(', ');
}

function actionAttrs(action, args) {
    if (!action) return '';
    const argStr = serializeArgs(args);
    return `data-action="${esc(action)}"${argStr ? ` data-args="${esc(argStr)}"` : ''}`;
}

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────

export function getEducationLabel(user) {
    if (user.gradSchoolDegree) return user.gradSchoolDegree;
    if (user.gradSchoolEnrolled) return `${user.gradSchoolType || 'Grad School'} · Year ${(user.gradSchoolYear || 0) + 1}`;
    if (user.universityGraduated) return user.major ? `Degree in ${user.major}` : 'University Degree';
    if (user.universityEnrolled) return `University · Year ${(user.universitySchoolYear || 0) + 1}`;
    if (user.highSchoolGraduated) return 'High School Diploma';
    if (user.hasGED) return 'GED';
    const age = user.age || 0;
    if (age < 5) return 'Not in school yet';
    if (age < 12) return 'Elementary School';
    if (age < 14) return 'Middle School';
    if (age < 18 || user.highSchoolRetained) return 'High School';
    return 'No diploma';
}

export function getCircleSummary(user) {
    const rels = Array.isArray(user.relationships) ? user.relationships : [];
    const spouse = rels.find(r => r.category === 'spouse' || r.type === 'Husband' || r.type === 'Wife');
    const partner = rels.find(r => r.category === 'partner');
    const children = rels.filter(r => r.type === 'Son' || r.type === 'Daughter' || r.category === 'child');
    const friends = rels.filter(r => r.category === 'friend');
    let label;
    let icon;
    if (spouse) { label = `Married to ${spouse.name.split(' ')[0]}`; icon = 'fa-ring text-amber-400'; }
    else if (partner) { label = `Dating ${partner.name.split(' ')[0]}`; icon = 'fa-heart text-pink-400'; }
    else { label = 'Single'; icon = 'fa-user text-pink-400'; }
    return { label, icon, total: rels.length, children: children.length, friends: friends.length };
}

function safeBreakdown(user) {
    try {
        if (typeof GameLogic.calculateFinancialBreakdown === 'function') {
            return GameLogic.calculateFinancialBreakdown(user);
        }
    } catch (e) {
        console.warn('[desktopPanels] Financial breakdown failed:', e);
    }
    return null;
}

function statBar(label, icon, color, value) {
    const v = clamp(value);
    return `
        <div class="desktop-stat-row">
            <div class="flex items-center justify-between text-[11px] mb-1">
                <span class="flex items-center gap-1.5 text-slate-300 font-semibold"><i class="fas ${icon} ${color.text} w-3 text-center"></i>${label}</span>
                <span class="font-mono font-bold ${color.text}">${v}%</span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-700/50">
                <div class="h-full ${color.bar} rounded-full transition-all duration-500" style="width:${v}%"></div>
            </div>
        </div>`;
}

function detailRow(label, value, icon, action, title) {
    return `
        <button type="button" ${actionAttrs(action)} class="desktop-detail-row w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/50 transition text-left min-w-0" title="${esc(title || label)}">
            <i class="fas ${icon} text-xs w-4 text-center shrink-0"></i>
            <div class="min-w-0 flex-1">
                <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">${esc(label)}</div>
                <div class="text-xs font-bold text-slate-200 truncate mt-1">${esc(value)}</div>
            </div>
            <i class="fas fa-chevron-right text-[9px] text-slate-500 shrink-0"></i>
        </button>`;
}

// ─── LEFT COLUMN: CHARACTER PROFILE ──────────────────────────────────────────

export function renderProfilePanel(user) {
    if (!user) return '';
    const name = user.username || user.name || 'Player';
    const countryCode = Utils.getCountryCode ? Utils.getCountryCode(user.city) : null;
    const flag = countryCode
        ? `<img src="https://flagcdn.com/w20/${esc(countryCode)}.png" width="16" alt="" class="inline-block rounded-sm shadow-sm" style="vertical-align: -2px;">`
        : '<i class="fas fa-map-marker-alt text-slate-500"></i>';

    const breakdown = safeBreakdown(user);
    const income = breakdown ? breakdown.cashflow.monthlyIncome : (user.monthlyIncome || 0);
    const outflow = breakdown ? breakdown.cashflow.monthlyOutflow : (user.monthlyOutflow || 0);
    const netMonthly = breakdown ? breakdown.cashflow.netMonthly : (income - outflow);
    const netWorth = breakdown ? breakdown.netWorth.netWorth : (user.money || 0);
    const money = user.money || 0;
    const netColor = netMonthly > 0 ? 'text-emerald-400' : (netMonthly < 0 ? 'text-rose-400' : 'text-slate-400');
    const netText = `${netMonthly > 0 ? '+' : (netMonthly < 0 ? '-' : '')}${Utils.formatMoney(Math.abs(netMonthly))}/mo`;

    const statusLabel = typeof GameLogic.checkLifeStatus === 'function' ? (GameLogic.checkLifeStatus(user) || 'Citizen') : (user.lifeStatus || 'Citizen');
    const roleValue = user.jobTitle && user.jobSalary > 0 && !user.hasBusiness
        ? `${statusLabel} · ${Utils.formatCompactMoney ? Utils.formatCompactMoney(user.jobSalary) : Utils.formatMoney(user.jobSalary)}/yr`
        : statusLabel;
    const roleIcon = (user.isStudent || user.universityEnrolled || user.gradSchoolEnrolled)
        ? 'fa-graduation-cap text-blue-400'
        : ((user.jobTitle || user.hasBusiness) ? 'fa-briefcase text-emerald-400' : ((user.age || 0) < 5 ? 'fa-baby text-pink-400' : 'fa-user-clock text-amber-400'));

    const circle = getCircleSummary(user);
    const familyBits = [];
    if (circle.children > 0) familyBits.push(`${circle.children} ${circle.children === 1 ? 'kid' : 'kids'}`);
    if (circle.friends > 0) familyBits.push(`${circle.friends} ${circle.friends === 1 ? 'friend' : 'friends'}`);
    const circleValue = familyBits.length ? `${circle.label} · ${familyBits.join(', ')}` : circle.label;

    const isVip = hasPurchasedPack('vip_supporter');
    const vipHtml = isVip ? `
        <button type="button" data-action="renderVipLoungeModal" class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-amber-500/30 transition">
            <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1"><i class="fas fa-crown text-[9px]"></i> VIP</span>
            <span class="text-[11px] font-bold text-amber-400 flex items-center gap-1">Lounge <i class="fas fa-chevron-right text-[9px]"></i></span>
        </button>` : '';

    return `
        <div class="desktop-profile flex flex-col gap-3 p-4">
            <button type="button" data-action="openPlayerOverviewModal" class="flex flex-col items-center text-center group" title="Open Life Overview">
                <div class="w-24 h-24 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600 group-hover:border-blue-400 transition shadow-lg">
                    ${renderAvatar(user)}
                </div>
                <h2 id="desktop-profile-name" class="mt-3 text-lg font-extrabold text-white leading-tight group-hover:text-blue-300 transition break-words">${esc(name)}</h2>
                <div class="text-xs text-slate-400 mt-1">Age <span id="desktop-profile-age" class="text-white font-bold">${esc(user.age ?? 0)}</span> · Gen ${esc(user.generation || 1)}</div>
                <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">${flag}<span>${esc(user.city || 'Unknown')}</span></div>
            </button>

            <div class="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                <button type="button" data-action="openCashflowModal" class="w-full flex items-end justify-between group" title="Financial &amp; Net Worth Breakdown">
                    <div class="text-left">
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Bank Balance</div>
                        <div id="desktop-profile-bank" class="text-2xl font-extrabold font-mono ${money < 0 ? 'text-red-400' : 'text-green-400'} leading-tight">${esc(Utils.formatMoney(money))}</div>
                    </div>
                    <i class="fas fa-chart-pie text-slate-500 group-hover:text-blue-400 transition mb-1"></i>
                </button>
                <div class="grid grid-cols-2 gap-2 text-left">
                    <div class="bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Net Worth</div>
                        <div id="desktop-profile-networth" class="text-xs font-bold font-mono ${netWorth < 0 ? 'text-rose-400' : 'text-slate-100'} truncate">${esc(Utils.formatMoney(netWorth))}</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Cashflow</div>
                        <div id="desktop-profile-cashflow" class="text-xs font-bold font-mono ${netColor} truncate">${esc(netText)}</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Income</div>
                        <div class="text-xs font-bold font-mono text-emerald-400 truncate">${esc(Utils.formatMoney(income))}/mo</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Expenses</div>
                        <div class="text-xs font-bold font-mono text-rose-400 truncate">${esc(Utils.formatMoney(outflow))}/mo</div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                ${statBar('Health', 'fa-heart', { text: 'text-emerald-400', bar: 'bg-emerald-500' }, user.health ?? user.stats?.health ?? 100)}
                ${statBar('Happiness', 'fa-smile', { text: 'text-amber-400', bar: 'bg-amber-500' }, user.happiness ?? user.stats?.happiness ?? 100)}
                ${statBar('Smarts', 'fa-brain', { text: 'text-blue-400', bar: 'bg-blue-500' }, user.smarts ?? user.stats?.smarts ?? 50)}
                ${statBar('Looks', 'fa-star', { text: 'text-pink-400', bar: 'bg-pink-500' }, user.looks ?? user.stats?.looks ?? 50)}
            </div>

            <div class="space-y-1.5">
                ${detailRow('Role', roleValue, roleIcon, 'renderActivities', 'View Occupation & Education')}
                ${detailRow('Circle', circleValue, circle.icon, 'renderRelationships', 'View Relationships')}
                ${detailRow('Education', getEducationLabel(user), 'fa-book-open text-indigo-400', 'renderActivities', 'View Education')}
            </div>

            ${vipHtml}

            <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" data-action="openPlayerOverviewModal" class="btn-nav rounded-lg py-2 text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5"><i class="fas fa-id-card text-blue-400"></i> Overview</button>
                <button type="button" data-action="openSettingsModal" class="btn-nav rounded-lg py-2 text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5"><i class="fas fa-cog text-slate-400"></i> Settings</button>
            </div>
        </div>`;
}

// ─── RIGHT COLUMN: ACTIONS & NEXT STEPS ──────────────────────────────────────

const NAV_TABS = [
    { key: 'assets', action: 'renderAssets',        icon: 'fa-coins text-yellow-400',        label: 'Assets', title: 'Assets' },
    { key: 'work',   action: 'renderActivities',    icon: 'fa-user-graduate text-blue-400',  label: 'Work',   title: 'Work & Education' },
    { key: 'social', action: 'renderRelationships', icon: 'fa-users text-pink-400',          label: 'Social', title: 'Relationships & Social' },
    { key: 'more',   action: 'renderMoreDashboard', icon: 'fa-ellipsis-h text-slate-400',    label: 'More',   title: 'More Options & Activities' }
];

function recommendationCard(rec) {
    const tone = TONE_STYLES[rec.tone] || TONE_STYLES.neutral;
    const progress = typeof rec.progress === 'number' ? `
        <div class="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-700/50 mt-2">
            <div class="h-full ${tone.bar} rounded-full" style="width:${clamp(rec.progress)}%"></div>
        </div>` : '';
    const btn = rec.action ? `
        <button type="button" ${actionAttrs(rec.action, rec.args)} class="desktop-rec-btn shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition">${esc(rec.actionLabel || 'Go')}</button>` : '';
    return `
        <div class="desktop-rec-card bg-slate-800/80 border ${tone.border} rounded-xl p-2.5" data-rec-id="${esc(rec.id)}" data-rec-kind="${esc(rec.kind)}">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg ${tone.icon} flex items-center justify-center shrink-0"><i class="fas ${esc(rec.icon)} text-xs"></i></div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-white leading-snug">${esc(rec.title)}</div>
                    ${rec.subtitle ? `<div class="text-[11px] text-slate-400 leading-snug mt-0.5">${esc(rec.subtitle)}</div>` : ''}
                </div>
                ${btn}
            </div>
            ${progress}
        </div>`;
}

export function renderActionPanel(user, activeTab = 'home') {
    if (!user) return '';
    const badges = {
        work: activeTab !== 'work' && needsWorkAttention(user),
        assets: activeTab !== 'assets' && needsAssetsAttention(user)
    };
    const navButtons = NAV_TABS.map(t => {
        const isActive = t.key === activeTab;
        return `
            <button type="button" id="desktop-nav-${t.key}" data-action="${t.action}" class="btn-nav relative rounded-xl py-3 flex flex-col items-center justify-center gap-1 text-slate-200 font-bold transition ${isActive ? `nav-tab-active nav-tab-${t.key}` : ''}" title="${esc(t.title)}"${isActive ? ' aria-current="page"' : ''}>
                <i class="fas ${t.icon} text-lg"></i>
                <span class="text-[10px] uppercase tracking-wider">${t.label}</span>
                ${badges[t.key] ? '<span class="nav-badge-dot"></span>' : ''}
            </button>`;
    }).join('');

    const isHome = activeTab === 'home';
    const recs = buildRecommendations(user).slice(0, 8);
    const recsHtml = recs.length
        ? recs.map(recommendationCard).join('')
        : '<div class="text-xs text-slate-500 italic px-1">Nothing urgent right now. Live your life!</div>';

    return `
        <div class="desktop-actions flex flex-col gap-3 p-4">
            <button type="button" id="desktop-btn-ageup" data-action="ageUp" class="btn-age-up btn-primary w-full rounded-2xl py-5 flex items-center justify-center gap-3 font-extrabold text-white shadow-lg transition hover:brightness-110" title="Age Up (+1 Year)">
                <i class="fas fa-arrow-up text-2xl"></i>
                <span class="flex flex-col items-start leading-tight">
                    <span class="text-lg uppercase tracking-wider">Age Up</span>
                    <span class="text-[11px] font-semibold opacity-90">Turn ${esc((user.age || 0) + 1)}</span>
                </span>
            </button>

            <div class="grid grid-cols-2 gap-2">${navButtons}</div>

            <button type="button" id="desktop-nav-home" data-action="renderLifeDashboard" class="btn-nav rounded-xl py-2.5 flex items-center justify-center gap-2 text-slate-200 text-xs font-bold transition ${isHome ? 'nav-tab-active nav-tab-home' : ''}" title="Return to Life History"${isHome ? ' aria-current="page"' : ''}>
                <i class="fas fa-stream text-emerald-400"></i> Life History
            </button>

            <div class="pt-1">
                <h3 class="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-2 px-1 flex items-center gap-1.5"><i class="fas fa-lightbulb text-amber-400"></i> Next Steps</h3>
                <div id="desktop-recommendations" class="space-y-2">${recsHtml}</div>
            </div>
        </div>`;
}

// ─── DOM MOUNTING ────────────────────────────────────────────────────────────

/**
 * Renders both desktop side columns into their <aside> containers.
 * @param {Object} user
 * @param {string} activeTab - 'home' | 'assets' | 'work' | 'social' | 'more'
 */
export function renderDesktopPanels(user, activeTab = 'home') {
    const left = document.getElementById('desktop-left-panel');
    const right = document.getElementById('desktop-right-panel');
    if (!user) {
        clearDesktopPanels();
        return;
    }
    if (left) left.innerHTML = renderProfilePanel(user);
    if (right) right.innerHTML = renderActionPanel(user, activeTab);
}

export function clearDesktopPanels() {
    const left = document.getElementById('desktop-left-panel');
    const right = document.getElementById('desktop-right-panel');
    if (left) left.innerHTML = '';
    if (right) right.innerHTML = '';
}
