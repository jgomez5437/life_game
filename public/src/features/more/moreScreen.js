import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderLifeDashboard, renderDeathScreen } from '../player/mainScreen.js';
import { processNextFuneral, processNextTeacherReplacement } from '../relationships/funeralScreen.js';
import { UI } from '../../ui/ui.js';
import { Utils } from '../../ui/utils.js';
import { SKILL_TRACKS } from '../../core/constants.js';
import {
    renderSkillsHub,
    openSkillsModal,
    setSkillsCategory,
    openSkillDetail,
    backToSkillsHub,
    toggleSkillExpand,
    collapseSkills,
    practiceSkill,
    enrollSkillCourse,
    askParentInstrumentPermission,
    takeInstrumentLesson,
    resetSkillsViewState
} from './skillsScreen.js';

export {
    renderSkillsHub,
    openSkillsModal,
    setSkillsCategory,
    openSkillDetail,
    backToSkillsHub,
    toggleSkillExpand,
    collapseSkills,
    practiceSkill,
    enrollSkillCourse,
    askParentInstrumentPermission,
    takeInstrumentLesson
};

export * from './moreActivitiesModals.js';

const get = id => document.getElementById(id);

function renderSlimOptionRow({ icon, iconBg, iconColor, title, subtitle, badgeText, badgeColor, action, buttonText, buttonStyle, isLocked, lockText }) {
    return `
        <div class="bg-slate-800/90 hover:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 transition flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-lg ${iconBg} ${iconColor} border ${badgeColor || 'border-slate-700'} flex items-center justify-center text-sm shrink-0">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="min-w-0 flex-1 text-left">
                    <div class="font-bold text-white text-xs truncate flex items-center gap-1.5">
                        ${title}
                        ${badgeText ? `<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${badgeColor}">${badgeText}</span>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-400 truncate">${subtitle}</div>
                </div>
            </div>
            ${isLocked ? `
                <span class="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                    <i class="fas fa-lock text-[9px]"></i> ${lockText || 'Locked'}
                </span>
            ` : `
                <button data-action="${action}" class="more-option-btn text-white ${buttonStyle || 'bg-slate-700 hover:bg-slate-600'} font-bold text-xs px-2.5 py-1 rounded-lg transition shrink-0">
                    ${buttonText}
                </button>
            `}
        </div>
    `;
}

export function closeSkillsModal() {
    resetSkillsViewState();
    UI.closeAllModals();
    renderMoreDashboard();
}

export function renderMoreDashboard() {
    resetSkillsViewState();
    const user = state.gameState?.user;
    if (!user) return;

    if (user.lifeStatus === 'Deceased') {
        renderDeathScreen(user, user.deathCause || 'natural causes');
        return;
    }

    if (state.gameState?.pendingFunerals && state.gameState.pendingFunerals.length > 0) {
        processNextFuneral();
        return;
    }

    if (state.gameState?.pendingTeacherReplacements && state.gameState.pendingTeacherReplacements.length > 0) {
        processNextTeacherReplacement();
        return;
    }
    const gymLocked = (user.age || 0) < 12;
    const dietLocked = (user.age || 0) <= 12;
    const skillsLocked = (user.age || 0) < 6;
    const lotteryLocked = (user.age || 0) < 18;
    const casinoLocked = (user.age || 0) < 18;
    const travelLocked = (user.age || 0) < 16;
    const currentDiet = GameLogic.getDietPlan(user.diet || (user.hasBetterDiet ? 'balanced' : 'junk'));
    const ticketsBought = user.lotteryTicketsBoughtThisYear || 0;
    const ticketsLeft = 10 - ticketsBought;
    const certCount = SKILL_TRACKS.filter(s => user.skills?.[s.key]?.certified).length;

    UI.updateBottomNav('more');
    const backBtnHtml = !UI.isBottomNavEnabled() ? `
        <div class="mb-3 flex items-center justify-between">
            <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
    ` : '';
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            ${backBtnHtml}
            
            <div class="mb-3 px-1 text-left">
                <h2 class="text-xl font-extrabold text-white">More Options</h2>
                <p class="text-slate-400 text-xs">Activities, health, entertainment & criminal endeavors.</p>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-6 space-y-4">

                <!-- CATEGORY 0: STORE & SPECIAL FEATURES -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-gem"></i> Store & Special Features
                    </div>
                    ${renderSlimOptionRow({
                        icon: 'fa-store',
                        iconBg: 'bg-amber-500/15',
                        iconColor: 'text-amber-400',
                        badgeColor: 'border-amber-500/40 text-amber-300',
                        title: 'Packs & Features Store',
                        subtitle: 'God Mode, Expansion Packs & Perks',
                        action: 'renderStoreScreen',
                        buttonText: 'Open Store',
                        buttonStyle: 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                    })}
                </div>

                <!-- CATEGORY 1: HEALTH & WELLNESS -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-heartbeat"></i> Health & Wellness
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-apple-alt',
                            iconBg: 'bg-emerald-950/60',
                            iconColor: 'text-emerald-400',
                            badgeColor: 'border-emerald-800/60 text-emerald-300 bg-emerald-950/40',
                            title: 'Diet Plan',
                            subtitle: `${currentDiet.name} (${currentDiet.monthlyCost > 0 ? `${Utils.formatMoney(currentDiet.monthlyCost)}/mo` : 'Free'})`,
                            action: 'openDietSelectionModal',
                            buttonText: 'Change',
                            buttonStyle: 'bg-emerald-700 hover:bg-emerald-600 text-white',
                            isLocked: dietLocked,
                            lockText: 'Age 13+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-dumbbell',
                            iconBg: 'bg-blue-950/60',
                            iconColor: 'text-blue-400',
                            badgeColor: 'border-blue-800/60 text-blue-300 bg-blue-950/40',
                            title: 'Gym Membership',
                            subtitle: user.gymMembership ? `Active Member ($50/mo)` : `Not a member`,
                            action: user.gymMembership ? 'visitGymOneTime' : 'buyGymMembership',
                            buttonText: user.gymMembership ? 'Workout Day' : `Join ($50/mo)`,
                            buttonStyle: user.gymMembership ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white',
                            isLocked: gymLocked,
                            lockText: 'Age 12+'
                        })}

                        ${(() => {
                            const activeDiseases = Array.isArray(user.diseases) ? user.diseases : [];
                            const isMinor = (user.age || 0) < 18;
                            const costLabel = isMinor ? 'Free' : '$1,000';
                            const subtitle = activeDiseases.length > 0
                                ? `Active: ${activeDiseases.map(d => Utils.escapeHtml(d.name)).join(', ')}`
                                : `Visit Doctor (+10 Health)`;
                            return renderSlimOptionRow({
                                icon: 'fa-stethoscope',
                                iconBg: 'bg-red-950/60',
                                iconColor: 'text-red-400',
                                badgeText: activeDiseases.length > 0 ? `${activeDiseases.length} Active` : '',
                                badgeColor: activeDiseases.length > 0 ? 'border-rose-600/60 text-rose-300 bg-rose-950/50' : 'border-red-800/60 text-red-300',
                                title: activeDiseases.length > 0 ? 'Medical Clinic & Doctor' : 'Medical Checkup',
                                subtitle,
                                action: 'visitDoctor',
                                buttonText: activeDiseases.length > 0 ? 'Clinic' : `Visit (${costLabel})`,
                                buttonStyle: 'bg-red-700 hover:bg-red-600 text-white'
                            });
                        })()}
                    </div>
                </div>

                <!-- CATEGORY 2: EDUCATION & SKILLS -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-graduation-cap"></i> Education & Skills
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-book-open',
                            iconBg: 'bg-indigo-950/60',
                            iconColor: 'text-indigo-400',
                            badgeText: certCount > 0 ? `${certCount} Certified` : '',
                            badgeColor: 'border-indigo-800/60 text-indigo-300 bg-indigo-950/40',
                            title: 'Skill Workshops & Courses',
                            subtitle: 'Music, Coding, Leadership, Defense, Culinary, Design & Sports',
                            action: 'renderSkillsHub',
                            buttonText: 'Explore',
                            buttonStyle: 'bg-indigo-700 hover:bg-indigo-600 text-white',
                            isLocked: skillsLocked,
                            lockText: 'Age 6+'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 3: TRAVEL & LIFESTYLE -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-plane"></i> Travel & Lifestyle
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-plane-departure',
                            iconBg: 'bg-cyan-950/60',
                            iconColor: 'text-cyan-400',
                            badgeColor: 'border-cyan-800/60 text-cyan-300 bg-cyan-950/40',
                            title: 'Travel & Vacations',
                            subtitle: 'Local Getaways & Luxury Tours',
                            action: 'openTravelModal',
                            buttonText: 'Book Trip',
                            buttonStyle: 'bg-cyan-700 hover:bg-cyan-600 text-white',
                            isLocked: travelLocked,
                            lockText: 'Age 16+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-globe-americas',
                            iconBg: 'bg-emerald-950/60',
                            iconColor: 'text-emerald-400',
                            badgeColor: 'border-emerald-800/60 text-emerald-300 bg-emerald-950/40',
                            title: 'Relocate Country',
                            subtitle: `Current: ${user.country || 'United States'} (${Utils.formatMoney(2000)})`,
                            action: 'openMoveCountryModal',
                            buttonText: 'Move',
                            buttonStyle: 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 4: ENTERTAINMENT & GAMBLING -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-dice"></i> Entertainment & Gambling
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-ticket-alt',
                            iconBg: 'bg-amber-950/60',
                            iconColor: 'text-amber-400',
                            badgeColor: 'border-amber-800/60 text-amber-300 bg-amber-950/40',
                            title: 'Lottery Station',
                            subtitle: `${ticketsLeft} / 10 tickets left this year`,
                            action: 'openLotteryModal',
                            buttonText: 'Play Lottery',
                            buttonStyle: 'bg-amber-600 hover:bg-amber-500 text-white',
                            isLocked: lotteryLocked,
                            lockText: 'Age 18+'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-dice-five',
                            iconBg: 'bg-purple-950/60',
                            iconColor: 'text-purple-300',
                            badgeColor: 'border-purple-800/60 text-purple-300 bg-purple-950/40',
                            title: 'Royal Palm Casino',
                            subtitle: 'Blackjack 21, Roulette & Slots',
                            action: 'renderCasinoHub',
                            buttonText: 'Casino Floor',
                            buttonStyle: 'bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white shadow',
                            isLocked: casinoLocked,
                            lockText: 'Age 18+'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 5: UNDERWORLD & CRIME -->
                <div class="space-y-1.5 text-left">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-red-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-user-ninja"></i> Underworld & Crime
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-mask',
                            iconBg: 'bg-red-950/60',
                            iconColor: 'text-red-400',
                            badgeColor: 'border-red-800/60 text-red-300 bg-red-950/40',
                            title: 'Underworld & Crime Hub',
                            subtitle: 'Mischief, Theft & Bank Heists',
                            action: 'renderCrimeDashboard',
                            buttonText: 'Crime Hub',
                            buttonStyle: 'bg-red-700 hover:bg-red-600 text-white shadow'
                        })}
                    </div>
                </div>

                <!-- CATEGORY 6: GOD PERKS & TEMPORAL POWER -->
                <div class="space-y-1.5 text-left pt-2 border-t border-slate-700/60">
                    <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 px-1 flex items-center gap-1.5">
                        <i class="fas fa-crown text-amber-400"></i> God Perks & Temporal Power
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        ${renderSlimOptionRow({
                            icon: 'fa-bolt',
                            iconBg: 'bg-amber-950/60',
                            iconColor: 'text-amber-400',
                            badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
                            title: 'God Mode Studio',
                            subtitle: 'Edit Character Stats, Appearance & Social Circle',
                            action: 'openGodModeHubModal',
                            buttonText: 'God Mode',
                            buttonStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-extrabold shadow'
                        })}

                        ${renderSlimOptionRow({
                            icon: 'fa-hourglass-half',
                            iconBg: 'bg-cyan-950/60',
                            iconColor: 'text-cyan-400',
                            badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
                            title: 'Time Machine Engine',
                            subtitle: 'Rewind up to 5 Years & Undo Death',
                            action: 'openTimeMachineModal',
                            buttonText: 'Time Machine',
                            buttonStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold shadow'
                        })}
                    </div>
                </div>

            </div>
        </div>
    `;
}
