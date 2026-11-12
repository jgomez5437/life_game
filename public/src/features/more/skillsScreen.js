import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { addLog } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { SKILL_TRACKS, CAREER_TRACKS, SPECIAL_CAREER_TRACKS } from '../../core/constants.js';
import { saveToSlot } from '../../core/saveSlotManager.js';

let _activeCategory = 'all'; // 'all' | 'in_progress' | 'general' | 'instruments' | 'sports'
let _selectedSkillKey = null;

const COLOR_STYLES = {
    indigo:  { bg: 'bg-indigo-950/60',  text: 'text-indigo-400',  border: 'border-indigo-800/60',  bar: 'bg-indigo-500',  badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60' },
    amber:   { bg: 'bg-amber-950/60',   text: 'text-amber-400',   border: 'border-amber-800/60',   bar: 'bg-amber-500',   badge: 'bg-amber-950/60 text-amber-300 border-amber-700/60' },
    red:     { bg: 'bg-red-950/60',     text: 'text-red-400',     border: 'border-red-800/60',     bar: 'bg-red-500',     badge: 'bg-red-950/60 text-red-300 border-red-700/60' },
    emerald: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60', bar: 'bg-emerald-500', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' },
    purple:  { bg: 'bg-purple-950/60',  text: 'text-purple-400',  border: 'border-purple-800/60',  bar: 'bg-purple-500',  badge: 'bg-purple-950/60 text-purple-300 border-purple-700/60' },
    cyan:    { bg: 'bg-cyan-950/60',    text: 'text-cyan-400',    border: 'border-cyan-800/60',    bar: 'bg-cyan-500',    badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60' },
    orange:  { bg: 'bg-orange-950/60',  text: 'text-orange-400',  border: 'border-orange-800/60',  bar: 'bg-orange-500',  badge: 'bg-orange-950/60 text-orange-300 border-orange-700/60' },
    blue:    { bg: 'bg-blue-950/60',    text: 'text-blue-400',    border: 'border-blue-800/60',    bar: 'bg-blue-500',    badge: 'bg-blue-950/60 text-blue-300 border-blue-700/60' },
    teal:    { bg: 'bg-teal-950/60',    text: 'text-teal-400',    border: 'border-teal-800/60',    bar: 'bg-teal-500',    badge: 'bg-teal-950/60 text-teal-300 border-teal-700/60' },
    pink:    { bg: 'bg-pink-950/60',    text: 'text-pink-400',    border: 'border-pink-800/60',    bar: 'bg-pink-500',    badge: 'bg-pink-950/60 text-pink-300 border-pink-700/60' }
};

const CATEGORY_META = {
    general:     { label: 'General & Career',    short: 'Career', icon: 'fa-briefcase', text: 'text-indigo-400' },
    instruments: { label: 'Music & Instruments', short: 'Music',  icon: 'fa-guitar',    text: 'text-amber-400' },
    sports:      { label: 'Sports & Athletics',  short: 'Sports', icon: 'fa-running',   text: 'text-emerald-400' }
};

function formatCareerLabel(trackKey) {
    if (trackKey === 'all') return 'All Careers';
    if (trackKey === 'artist') return 'Artist & Music';
    const std = CAREER_TRACKS.find(t => t.key === trackKey);
    if (std) return std.label;
    const spec = SPECIAL_CAREER_TRACKS.find(t => t.key === trackKey);
    if (spec) return spec.label;
    return trackKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getSkillTagline(skill) {
    if (skill.category === 'instruments') return 'Artist Career & Auditions';
    if (skill.category === 'sports') {
        return skill.sportKey ? 'Pro Draft & Contract Odds' : 'Conditioning & Draft Odds';
    }
    if (Array.isArray(skill.unlocksCareers) && skill.unlocksCareers.length > 0) {
        return `Unlocks ${skill.unlocksCareers.slice(0, 2).map(formatCareerLabel).join(', ')}`;
    }
    if (Array.isArray(skill.fastTrackCareers) && skill.fastTrackCareers.length > 0) {
        return `Fast-Tracks ${skill.fastTrackCareers.slice(0, 2).map(formatCareerLabel).join(', ')}`;
    }
    return 'Career & Life Mastery';
}

function getMasteryRank(xp, isCertified) {
    if (isCertified) return { label: 'Certified', cls: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' };
    if (xp >= 90) return { label: 'Virtuoso', cls: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' };
    if (xp >= 60) return { label: 'Advanced', cls: 'bg-blue-950/60 text-blue-300 border-blue-700/60' };
    if (xp >= 25) return { label: 'Apprentice', cls: 'bg-amber-950/60 text-amber-300 border-amber-700/60' };
    if (xp > 0) return { label: 'Beginner', cls: 'bg-slate-700/60 text-slate-300 border-slate-600/60' };
    return { label: 'Not Started', cls: 'bg-slate-900/80 text-slate-400 border-slate-700/70' };
}

function formatStatDeltas(statsObj) {
    return Object.entries(statsObj || {})
        .map(([k, v]) => `+${v} ${k.charAt(0).toUpperCase() + k.slice(1)}`)
        .join(' · ');
}

export function resetSkillsViewState() {
    _selectedSkillKey = null;
}

export function setSkillsCategory(category) {
    _activeCategory = category || 'all';
    _selectedSkillKey = null;
    renderSkillsHub();
}

export function openSkillDetail(skillKey) {
    const skill = SKILL_TRACKS.find(s => s.key === skillKey);
    if (!skill) return;
    _selectedSkillKey = skillKey;
    renderSkillsHub();
}

export function backToSkillsHub() {
    _selectedSkillKey = null;
    renderSkillsHub();
}

function renderFeedbackBanner(feedbackMsg, feedbackType) {
    if (typeof feedbackMsg !== 'string' || !feedbackMsg.trim()) return '';
    const isBad = feedbackType === 'bad';
    return `
        <div class="mb-4 px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 fade-in ${
            isBad
                ? 'bg-red-950/50 border-red-700/60 text-red-300'
                : 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
        }">
            <i class="fas ${isBad ? 'fa-exclamation-circle' : 'fa-check-circle'} text-sm shrink-0"></i>
            <span class="leading-snug">${Utils.escapeHtml(feedbackMsg)}</span>
        </div>
    `;
}

function renderSkillSummaryCard(user, skill, livingParents) {
    const st = GameLogic.getSkillState(user, skill.key);
    const xp = st.xp || 0;
    const isCertified = Boolean(st.certified);
    const isInstrument = skill.category === 'instruments';
    const isUnder18 = (user.age || 0) < 18;
    const minAge = skill.minAge || (isInstrument ? 6 : 12);
    const ageLocked = (user.age || 0) < minAge;
    const needsParentPermission = isInstrument && isUnder18 && livingParents.length > 0 && !st.parentApproved;
    const palette = COLOR_STYLES[skill.color] || COLOR_STYLES.indigo;
    const rank = getMasteryRank(xp, isCertified);

    let statusPillHtml = '';
    if (ageLocked) {
        statusPillHtml = `<span class="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded-full shrink-0">Age ${minAge}+</span>`;
    } else if (isCertified) {
        statusPillHtml = `<span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-400/50 shrink-0"><i class="fas fa-certificate mr-1"></i>Certified</span>`;
    } else if (needsParentPermission) {
        statusPillHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/60 shrink-0"><i class="fas fa-user-friends mr-1"></i>Ask Parents</span>`;
    } else if (isInstrument && st.parentApproved && isUnder18) {
        statusPillHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 shrink-0"><i class="fas fa-check mr-1"></i>Permitted</span>`;
    } else {
        statusPillHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${rank.cls}">${rank.label}</span>`;
    }

    const tierDotsHtml = skill.courses.map(course => {
        const completed = st.tiersCompleted.includes(course.tier);
        return `<span class="inline-block w-2 h-2 rounded-full ${completed ? 'bg-emerald-400' : 'bg-slate-700 border border-slate-600'}" title="Tier ${course.tier}${completed ? ' Completed' : ''}"></span>`;
    }).join('');

    return `
        <button type="button" data-action="openSkillDetail" data-args="&apos;${skill.key}&apos;"
            class="skill-summary-card w-full text-left bg-slate-800/90 hover:bg-slate-800 border ${isCertified ? 'border-indigo-500/60' : 'border-slate-700/80 hover:border-slate-600'} rounded-2xl p-4 transition-all group flex flex-col justify-between gap-3 shadow-sm">
            <div class="flex items-start justify-between gap-2.5">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-11 h-11 rounded-xl ${palette.bg} ${palette.text} border ${palette.border} flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                        <i class="fas ${skill.icon}"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition">${Utils.escapeHtml(skill.name)}</div>
                        <div class="text-[11px] text-slate-400 truncate mt-0.5">${Utils.escapeHtml(getSkillTagline(skill))}</div>
                    </div>
                </div>
                ${statusPillHtml}
            </div>

            <div class="space-y-2">
                <div class="flex items-center gap-2.5">
                    <div class="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                        <div class="h-full ${palette.bar} rounded-full transition-all duration-300" style="width: ${xp}%"></div>
                    </div>
                    <span class="text-[11px] font-bold font-mono ${xp >= 80 ? 'text-emerald-400' : 'text-slate-300'} shrink-0">${xp}/100 XP</span>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <div class="flex items-center gap-1.5">
                        <div class="flex items-center gap-1">${tierDotsHtml}</div>
                        <span class="text-[10px] font-semibold">${st.tiersCompleted.length}/3 ${isInstrument ? 'Recitals' : 'Workshops'}</span>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-400 group-hover:text-white flex items-center gap-1 transition">
                        Open <i class="fas fa-chevron-right text-[9px]"></i>
                    </span>
                </div>
            </div>
        </button>
    `;
}

function renderSkillsHubView(user, feedbackMsg, feedbackType) {
    const practiceLeft = Math.max(0, 2 - (user.skillActionsThisYear || 0));
    const instrumentPracticesLeft = Math.max(0, 3 - (user.instrumentPracticesThisYear || 0));
    const instrumentLessonsLeft = Math.max(0, 3 - (user.instrumentLessonsThisYear || 0));
    const livingParents = GameLogic.getLivingParents ? GameLogic.getLivingParents(user) : [];

    const certCount = SKILL_TRACKS.filter(s => user.skills?.[s.key]?.certified).length;
    const isSkillActive = (skill) => {
        const st = GameLogic.getSkillState(user, skill.key);
        return (st.xp || 0) > 0 || Boolean(st.certified) || Boolean(st.parentApproved) || (st.tiersCompleted?.length || 0) > 0;
    };

    const inProgressSkills = SKILL_TRACKS.filter(isSkillActive);
    const generalSkills = SKILL_TRACKS.filter(s => s.category === 'general');
    const instrumentSkills = SKILL_TRACKS.filter(s => s.category === 'instruments');
    const sportsSkills = SKILL_TRACKS.filter(s => s.category === 'sports');

    let filteredSkills = SKILL_TRACKS;
    if (_activeCategory === 'in_progress') filteredSkills = inProgressSkills;
    else if (_activeCategory === 'general') filteredSkills = generalSkills;
    else if (_activeCategory === 'instruments') filteredSkills = instrumentSkills;
    else if (_activeCategory === 'sports') filteredSkills = sportsSkills;

    const tabs = [
        { id: 'all',         label: `All (${SKILL_TRACKS.length})`,        icon: 'fa-border-all' },
        { id: 'in_progress', label: `In Progress (${inProgressSkills.length})`, icon: 'fa-chart-line' },
        { id: 'general',     label: `Career (${generalSkills.length})`,    icon: 'fa-briefcase' },
        { id: 'instruments', label: `Music (${instrumentSkills.length})`,  icon: 'fa-guitar' },
        { id: 'sports',      label: `Sports (${sportsSkills.length})`,     icon: 'fa-running' }
    ];

    const generalPracticeDots = [0, 1].map(i =>
        `<span class="inline-block w-2 h-2 rounded-full ${i < practiceLeft ? 'bg-indigo-400' : 'bg-slate-700'}"></span>`
    ).join('');

    const cardsHtml = filteredSkills.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">${filteredSkills.map(s => renderSkillSummaryCard(user, s, livingParents)).join('')}</div>`
        : `
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 text-center my-2">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 text-xl mx-auto mb-3">
                    <i class="fas fa-seedling"></i>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">No Active Skills Yet</h3>
                <p class="text-xs text-slate-400 max-w-xs mx-auto mb-4 leading-relaxed">
                    Start practicing a skill, take an instrument lesson, or enroll in a workshop to track your progress here.
                </p>
                <button type="button" data-action="setSkillsCategory" data-args="'all'"
                    class="more-option-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow">
                    Browse All Skills
                </button>
            </div>
        `;

    return `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto text-left">
            <!-- Top Navigation -->
            <div class="mb-3 flex items-center justify-between gap-2">
                <button type="button" data-action="renderMoreDashboard"
                    class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to More Options
                </button>
                <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
                    <i class="fas fa-certificate mr-1"></i>${certCount} / ${SKILL_TRACKS.length} Certified
                </span>
            </div>

            <!-- Hero & Annual Quotas Card -->
            <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Skills &amp; Workshops</h2>
                        <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                            Build mastery through annual practice, private lessons, and certified workshops.
                        </p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 flex items-center justify-center text-lg shrink-0">
                        <i class="fas fa-book-open"></i>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-700/60">
                    <div class="skills-quota-pill bg-slate-900/70 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                        <div class="min-w-0">
                            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Career &amp; Sports</div>
                            <div class="text-xs font-bold text-white mt-0.5">${practiceLeft} / 2 Practices Left</div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">${generalPracticeDots}</div>
                    </div>
                    <div class="skills-quota-pill bg-slate-900/70 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                        <div class="min-w-0">
                            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Music Studio</div>
                            <div class="text-xs font-bold text-white mt-0.5">
                                ${(user.age || 0) < 6 ? 'Unlocks at Age 6' : `${instrumentPracticesLeft}/3 Practice · ${instrumentLessonsLeft}/3 Lessons`}
                            </div>
                        </div>
                        <i class="fas fa-music text-amber-400 text-xs shrink-0"></i>
                    </div>
                </div>
            </div>

            ${renderFeedbackBanner(feedbackMsg, feedbackType)}

            <!-- Category Tabs -->
            <div id="skills-tab-nav" class="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none touch-pan-x overscroll-contain select-none shrink-0">
                ${tabs.map(t => {
                    const isActive = _activeCategory === t.id;
                    return `
                        <button type="button" data-action="setSkillsCategory" data-args="&apos;${t.id}&apos;"
                            class="skills-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/70'
                            }">
                            <i class="fas ${t.icon} text-[11px]"></i> ${t.label}
                        </button>
                    `;
                }).join('')}
            </div>

            <!-- Skills Grid -->
            <div class="flex-1 overflow-y-auto pr-0.5">
                ${cardsHtml}
            </div>
        </div>
    `;
}

function renderSkillDetailView(user, skill, feedbackMsg, feedbackType) {
    const st = GameLogic.getSkillState(user, skill.key);
    const xp = st.xp || 0;
    const isCertified = Boolean(st.certified);
    const isInstrument = skill.category === 'instruments';
    const isUnder18 = (user.age || 0) < 18;
    const minAge = skill.minAge || (isInstrument ? 6 : 12);
    const ageLocked = (user.age || 0) < minAge;
    const palette = COLOR_STYLES[skill.color] || COLOR_STYLES.indigo;
    const catMeta = CATEGORY_META[skill.category] || CATEGORY_META.general;
    const rank = getMasteryRank(xp, isCertified);

    const practiceLeft = Math.max(0, 2 - (user.skillActionsThisYear || 0));
    const instrumentPracticesLeft = Math.max(0, 3 - (user.instrumentPracticesThisYear || 0));
    const instrumentLessonsLeft = Math.max(0, 3 - (user.instrumentLessonsThisYear || 0));
    const livingParents = GameLogic.getLivingParents ? GameLogic.getLivingParents(user) : [];
    const avgParentStatus = livingParents.length > 0
        ? Math.round(livingParents.reduce((sum, p) => sum + (typeof p.status === 'number' ? p.status : 50), 0) / livingParents.length)
        : 100;

    const needsParentPermission = isInstrument && isUnder18 && livingParents.length > 0 && !st.parentApproved;
    const isDeniedThisYear = isInstrument && isUnder18 && st.deniedAge === user.age;

    const canPractice = isInstrument
        ? (!ageLocked && !needsParentPermission && instrumentPracticesLeft > 0 && xp < 100)
        : (!ageLocked && practiceLeft > 0 && xp < 100);
    const canLesson = isInstrument && !ageLocked && !needsParentPermission && instrumentLessonsLeft > 0 && xp < 100;

    const practiceXpGain = isInstrument ? GameLogic.getInstrumentPracticeXpGain(xp) : 10;
    const lessonXpGain = isInstrument ? GameLogic.getInstrumentLessonXpGain(xp) : 0;
    const practiceStatLabels = formatStatDeltas(skill.practiceStats);

    const impactChips = [];
    if (Array.isArray(skill.unlocksCareers) && skill.unlocksCareers.length > 0) {
        impactChips.push({
            label: `Unlocks: ${skill.unlocksCareers.map(formatCareerLabel).join(', ')}`,
            cls: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
        });
    }
    if (Array.isArray(skill.fastTrackCareers) && skill.fastTrackCareers.length > 0) {
        impactChips.push({
            label: `Fast-Tracks: ${skill.fastTrackCareers.map(formatCareerLabel).join(', ')}`,
            cls: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
        });
    }
    if (Array.isArray(skill.boostsCareers) && skill.boostsCareers.length > 0) {
        impactChips.push({
            label: `Boosts: ${skill.boostsCareers.map(formatCareerLabel).join(', ')}`,
            cls: 'bg-slate-900/80 text-slate-300 border-slate-700/70'
        });
    }

    let trainingSectionHtml = '';
    if (ageLocked) {
        trainingSectionHtml = `
            <div class="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center">
                <i class="fas fa-lock text-red-400 text-lg mb-1.5"></i>
                <div class="text-xs font-bold text-white">Locked Until Age ${minAge}</div>
                <p class="text-[11px] text-slate-400 mt-1">Age up to unlock practice and workshops for ${Utils.escapeHtml(skill.shortName)}.</p>
            </div>
        `;
    } else if (needsParentPermission) {
        trainingSectionHtml = `
            <div class="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <i class="fas fa-user-friends"></i> Parental Permission Required (Under 18)
                    </div>
                    <span class="text-[11px] font-semibold text-slate-300">Parent Relations: ${avgParentStatus}%</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">
                    Ask your parents for permission to study ${Utils.escapeHtml(skill.shortName)}. If they agree, they will also cover 100% of lesson and recital costs until you turn 18.
                </p>
                ${isDeniedThisYear ? `
                    <button type="button" disabled
                        class="w-full bg-slate-800 border border-red-700/50 text-red-400 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed flex items-center justify-center gap-1.5">
                        <i class="fas fa-times-circle"></i> Parents Said No (Ask Again Next Year)
                    </button>
                ` : `
                    <button type="button" data-action="askParentInstrumentPermission" data-args="&apos;${skill.key}&apos;"
                        class="more-option-btn w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5">
                        <i class="fas fa-hand-holding-heart"></i> Ask Parents for Permission
                    </button>
                `}
            </div>
        `;
    } else if (isInstrument) {
        const lessonCostText = isUnder18 ? 'Free (Parents)' : Utils.formatMoney(skill.lessonCost || 200);
        trainingSectionHtml = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-slate-900/70 border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                    <div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-white">Self-Practice</span>
                            <span class="text-[10px] font-bold text-slate-400">${instrumentPracticesLeft}/3 left</span>
                        </div>
                        <div class="text-[11px] text-slate-400 mt-1">+${practiceXpGain} XP · ${practiceStatLabels}</div>
                    </div>
                    <button type="button" data-action="practiceSkill" data-args="&apos;${skill.key}&apos;" ${!canPractice ? 'disabled' : ''}
                        class="more-option-btn w-full text-xs font-bold py-2 px-3 rounded-xl transition ${
                            canPractice
                                ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }">
                        <i class="fas fa-bolt mr-1"></i>${xp >= 100 ? 'Max Mastery' : `Practice (+${practiceXpGain} XP)`}
                    </button>
                </div>

                <div class="bg-slate-900/70 border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                    <div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-white">Private Lesson</span>
                            <span class="text-[10px] font-bold text-slate-400">${instrumentLessonsLeft}/3 left</span>
                        </div>
                        <div class="text-[11px] text-slate-400 mt-1">+${lessonXpGain} XP · +2 Smarts · +3 Happiness</div>
                    </div>
                    <button type="button" data-action="takeInstrumentLesson" data-args="&apos;${skill.key}&apos;" ${!canLesson ? 'disabled' : ''}
                        class="more-option-btn w-full text-xs font-bold py-2 px-3 rounded-xl transition ${
                            canLesson
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }">
                        <i class="fas fa-chalkboard-teacher mr-1"></i>${xp >= 100 ? 'Mastered' : `Lesson · ${lessonCostText}`}
                    </button>
                </div>
            </div>
            ${xp >= 75 && xp < 100 ? `
                <div class="text-[11px] text-amber-400/90 flex items-center gap-1.5 mt-2.5">
                    <i class="fas fa-info-circle shrink-0"></i>
                    <span>Mastery tapering active at 75%+ XP — private lessons &amp; recitals give the fastest progress.</span>
                </div>
            ` : ''}
        `;
    } else {
        trainingSectionHtml = `
            <div class="bg-slate-900/70 border border-slate-700/70 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div class="text-xs font-bold text-white flex items-center gap-2">
                        <span>Self-Practice Session</span>
                        <span class="text-[10px] font-semibold text-slate-400">(${practiceLeft}/2 left this year)</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-1">+10 Mastery XP · ${practiceStatLabels}</div>
                </div>
                <button type="button" data-action="practiceSkill" data-args="&apos;${skill.key}&apos;" ${!canPractice ? 'disabled' : ''}
                    class="more-option-btn text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0 ${
                        canPractice
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }">
                    <i class="fas fa-bolt mr-1"></i>${xp >= 100 ? 'Max XP' : 'Practice (+10 XP)'}
                </button>
            </div>
        `;
    }

    const coursesHtml = skill.courses.map((course, idx) => {
        const done = st.tiersCompleted.includes(course.tier);
        const courseAgeLocked = (user.age || 0) < (course.minAge || minAge);
        const xpLocked = xp < (course.minXp || 0);
        const isCoveredByParents = isInstrument && isUnder18 && st.parentApproved;
        const actualCost = isCoveredByParents ? 0 : course.cost;
        const cantAfford = !isCoveredByParents && (user.money || 0) < actualCost;
        const statBonusStr = formatStatDeltas(course.stats);

        const tierLabel = isInstrument
            ? (course.tier === 1 ? 'Grade 1 Recital' : course.tier === 2 ? 'Intermediate Jury' : 'Master Virtuoso Cert')
            : (course.tier === 1 ? 'Tier 1 Workshop' : course.tier === 2 ? 'Tier 2 Bootcamp' : 'Tier 3 Master Cert');

        let stepIndicator = '';
        if (done) {
            stepIndicator = `<div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-xs shrink-0"><i class="fas fa-check"></i></div>`;
        } else if (needsParentPermission || courseAgeLocked || xpLocked) {
            stepIndicator = `<div class="w-8 h-8 rounded-full bg-slate-900 text-slate-500 border border-slate-700 flex items-center justify-center text-xs shrink-0"><i class="fas fa-lock"></i></div>`;
        } else {
            stepIndicator = `<div class="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 flex items-center justify-center text-xs font-extrabold shrink-0">${idx + 1}</div>`;
        }

        let actionHtml = '';
        if (done) {
            actionHtml = `<span class="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-700/50 px-2.5 py-1 rounded-lg shrink-0"><i class="fas fa-check mr-1"></i>Completed</span>`;
        } else if (needsParentPermission) {
            actionHtml = `<span class="text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg shrink-0">Needs Permission</span>`;
        } else if (courseAgeLocked) {
            actionHtml = `<span class="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg shrink-0">Age ${course.minAge}+</span>`;
        } else if (xpLocked) {
            const needed = Math.max(0, (course.minXp || 0) - xp);
            actionHtml = `<span class="text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg shrink-0">Req ${course.minXp} XP (${needed} left)</span>`;
        } else {
            const costLabel = isCoveredByParents ? 'Free (Parents)' : Utils.formatMoney(course.cost);
            actionHtml = `
                <button type="button" data-action="enrollSkillCourse" data-args="&apos;${skill.key}&apos;, ${course.tier}"
                    class="more-option-btn text-xs font-bold px-3.5 py-2 rounded-xl transition shrink-0 ${
                        cantAfford
                            ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }">
                    Enroll · ${costLabel}
                </button>
            `;
        }

        return `
            <div class="skill-step-row bg-slate-900/60 border ${done ? 'border-emerald-700/50' : 'border-slate-700/70'} rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                    ${stepIndicator}
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">${tierLabel}</span>
                            ${course.grantsCert ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/50"><i class="fas fa-certificate mr-1"></i>Master Cert</span>` : ''}
                        </div>
                        <div class="text-sm font-bold text-white mt-0.5">${Utils.escapeHtml(course.title)}</div>
                        <div class="text-[11px] text-slate-400 mt-0.5">+${course.xpGain} XP · ${statBonusStr}${isCoveredByParents ? ' · Covered by Parents' : ''}</div>
                        ${course.grantsCert ? `<div class="text-[11px] text-indigo-300 mt-1 font-semibold"><i class="fas fa-award mr-1"></i>Grants: ${Utils.escapeHtml(skill.certificateTitle)}</div>` : ''}
                    </div>
                </div>
                <div class="flex justify-end shrink-0">
                    ${actionHtml}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto text-left">
            <!-- Top Navigation -->
            <div class="mb-3 flex items-center justify-between gap-2">
                <button type="button" data-action="backToSkillsHub"
                    class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> All Skills
                </button>
                <span class="text-[11px] font-bold uppercase tracking-wider ${catMeta.text} flex items-center gap-1.5">
                    <i class="fas ${catMeta.icon}"></i> ${catMeta.label}
                </span>
            </div>

            <div class="flex-1 overflow-y-auto pr-0.5 space-y-4 pb-6">
                ${renderFeedbackBanner(feedbackMsg, feedbackType)}

                <!-- Skill Overview Hero Card -->
                <div class="bg-slate-800/90 border ${isCertified ? 'border-indigo-500/60' : 'border-slate-700/80'} rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3.5 min-w-0">
                            <div class="w-12 h-12 rounded-2xl ${palette.bg} ${palette.text} border ${palette.border} flex items-center justify-center text-xl shrink-0">
                                <i class="fas ${skill.icon}"></i>
                            </div>
                            <div class="min-w-0">
                                <h2 class="text-lg sm:text-xl font-extrabold text-white leading-tight">${Utils.escapeHtml(skill.name)}</h2>
                                <div class="flex items-center gap-2 flex-wrap mt-1">
                                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${rank.cls}">${rank.label}</span>
                                    ${isInstrument && st.parentApproved && isUnder18 ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/60"><i class="fas fa-check mr-1"></i>Parent Approved</span>` : ''}
                                    ${isCertified ? `<span class="text-[11px] font-semibold text-indigo-300">${Utils.escapeHtml(skill.certificateTitle)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between text-xs mb-1.5">
                            <span class="font-semibold text-slate-400">Mastery Progress</span>
                            <span class="font-bold font-mono ${xp >= 80 ? 'text-emerald-400' : 'text-white'}">${xp} / 100 XP</span>
                        </div>
                        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                            <div class="h-full ${palette.bar} rounded-full transition-all duration-300" style="width: ${xp}%"></div>
                        </div>
                    </div>

                    <p class="text-xs text-slate-300 leading-relaxed">${Utils.escapeHtml(skill.impactSummary)}</p>

                    ${impactChips.length > 0 ? `
                        <div class="flex flex-wrap gap-1.5 pt-0.5">
                            ${impactChips.map(c => `<span class="text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${c.cls}">${Utils.escapeHtml(c.label)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Training & Practice Card -->
                <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <i class="fas fa-dumbbell text-emerald-400"></i> Training &amp; Practice
                        </h3>
                        <span class="text-[11px] font-semibold text-slate-400">${st.tiersCompleted.length}/3 Tiers Done</span>
                    </div>
                    ${trainingSectionHtml}
                </div>

                <!-- Workshop / Conservatory Ladder Card -->
                <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <i class="fas fa-graduation-cap text-indigo-400"></i> ${isInstrument ? 'Conservatory Recitals &amp; Jury' : 'Workshops &amp; Certification'}
                        </h3>
                        <span class="text-[11px] font-semibold text-slate-400">${st.tiersCompleted.length} / 3 Completed</span>
                    </div>
                    <div class="space-y-2.5">
                        ${coursesHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderSkillsHub(feedbackMsg = null, feedbackType = 'good') {
    const user = state.gameState?.user;
    if (!user) return;

    if (typeof UI.isModalOpen === 'function' && UI.isModalOpen()) {
        UI.closeAllModals();
    }

    GameLogic.ensureUserSkills(user);
    UI.updateBottomNav('more');

    if (_selectedSkillKey) {
        const skill = SKILL_TRACKS.find(s => s.key === _selectedSkillKey);
        if (skill) {
            UI.renderScreen(renderSkillDetailView(user, skill, feedbackMsg, feedbackType));
            return;
        }
        _selectedSkillKey = null;
    }

    const prevScrollLeft = document.getElementById('skills-tab-nav')?.scrollLeft;
    UI.renderScreen(renderSkillsHubView(user, feedbackMsg, feedbackType));
    if (typeof UI.preserveTabScroll === 'function') {
        UI.preserveTabScroll(
            'skills-tab-nav',
            `[data-action="setSkillsCategory"][data-args*="${_activeCategory}"]`,
            prevScrollLeft
        );
    }
}

// Legacy alias for any callers invoking openSkillsModal()
export function openSkillsModal(feedbackMsg = null, feedbackType = 'good') {
    if (!feedbackMsg) {
        _selectedSkillKey = null;
    }
    renderSkillsHub(feedbackMsg, feedbackType);
}

export function toggleSkillExpand(skillKey) {
    if (_selectedSkillKey === skillKey) {
        _selectedSkillKey = null;
    } else {
        _selectedSkillKey = skillKey;
    }
    renderSkillsHub();
}

export function collapseSkills() {
    _selectedSkillKey = null;
    renderSkillsHub();
}

export function askParentInstrumentPermission(skillKey) {
    const user = state.gameState?.user;
    if (!user) return;

    _selectedSkillKey = skillKey;
    const res = GameLogic.executeAskParentInstrumentPermission(user, skillKey);
    if (res.approved) {
        addLog(res.message, 'good');
    } else if (res.deniedThisYear) {
        addLog(res.message, 'bad');
    }
    UI.updateHeader(user);
    saveToSlot();
    if (typeof saveGame === 'function') saveGame();
    renderSkillsHub(res.message, res.approved ? 'good' : 'bad');
}

export function takeInstrumentLesson(skillKey) {
    const user = state.gameState?.user;
    if (!user) return;

    _selectedSkillKey = skillKey;
    const res = GameLogic.executeInstrumentLesson(user, skillKey);
    if (!res.success) {
        renderSkillsHub(res.message, 'bad');
        return;
    }

    addLog(res.message, 'good');
    UI.updateHeader(user);
    saveToSlot();
    if (typeof saveGame === 'function') saveGame();
    renderSkillsHub(res.message, 'good');
}

export function practiceSkill(skillKey) {
    const user = state.gameState?.user;
    if (!user) return;

    _selectedSkillKey = skillKey;
    const res = GameLogic.executePracticeSkill(user, skillKey);
    if (!res.success) {
        renderSkillsHub(res.message, 'bad');
        return;
    }

    addLog(res.message, 'good');
    UI.updateHeader(user);
    saveToSlot();
    if (typeof saveGame === 'function') saveGame();
    renderSkillsHub(res.message, 'good');
}

export function enrollSkillCourse(skillKey, tierNum) {
    const user = state.gameState?.user;
    if (!user) return;

    _selectedSkillKey = skillKey;
    const res = GameLogic.executeEnrollSkillCourse(user, skillKey, tierNum);
    if (!res.success) {
        renderSkillsHub(res.message, 'bad');
        return;
    }

    addLog(res.message, res.certified ? 'major' : 'good');
    UI.updateHeader(user);
    saveToSlot();
    if (typeof saveGame === 'function') saveGame();
    renderSkillsHub(res.message, 'good');
}
