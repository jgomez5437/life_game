import { GameLogic } from '../../core/gameLogic.js';
import { state, hasPurchasedPack } from '../../core/state.js';
import { renderLifeDashboard, renderDeathScreen, addLog, refreshClassmates } from '../player/mainScreen.js';
import { processNextFuneral, processNextTeacherReplacement } from '../relationships/funeralScreen.js';
import { Utils } from '../../ui/utils.js';
import { MAJORS, CAREER_TRACKS, SPECIAL_CAREER_TRACKS, PRO_SPORTS_LEAGUES, PART_TIME_JOBS, GRAD_SCHOOLS } from '../../core/constants.js';
import { UI } from '../../ui/ui.js';
import { hasInstantDiplomaPerk, grantInstantUniversityDegree, grantInstantGradDegree, renderInstantDiplomaHub } from '../education/instantDiploma.js';

const get = id => document.getElementById(id);

//OCCUPATION/EDUCATION/ENTREPRENUER MANAGER SCREEN
export { GRAD_SCHOOLS };

//University Pop up
export function openUniversityModal() {
    // Reset flags
    const user = state.gameState.user;
    user.scholarshipTried = false;
    user.parentsTried = false;
    renderUniversityModalContent(null, false);
}
function renderUniversityModalContent(selectedMajor = null, isUpdate = false) {
    const user = state.gameState.user;

    const instantBtn = hasInstantDiplomaPerk() 
        ? `<button data-action="attemptEnrollment" data-args="&apos;instant&apos;" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-2.5 rounded-xl mb-2 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"><i class="fas fa-graduation-cap"></i> Instant Graduation (Diploma Perk)</button>`
        : '';

    const cashDisabled = user.money < 40000;
    const cashBtn = `<button data-action="attemptEnrollment" data-args="&apos;cash&apos;" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl mb-2 transition">Pay Cash (${Utils.formatMoney(40000)})</button>`;
    
    const loanBtn = `<button data-action="attemptEnrollment" data-args="&apos;loan&apos;" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Student Loans</button>`;
    
    // Scholarship Button
    const scholarChance = Math.max(0, Math.min(0.70, ((user.schoolPerformance || 50) - 30) / 100));
    const scholarOdds = Math.round(scholarChance * 100);
    const scholarBtn = user.scholarshipTried
        ? `<button disabled class="w-full bg-slate-800 border border-red-500/30 text-red-400 font-bold py-2.5 rounded-xl mb-2 cursor-not-allowed flex items-center justify-center gap-1.5"><i class="fas fa-times-circle"></i> Scholarship Denied</button>`
        : `<button data-action="attemptEnrollment" data-args="&apos;scholarship&apos;" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Apply for Scholarship (${scholarOdds}% chance)</button>`;

    // Parents Button
    const parentBtn = user.parentsTried
        ? `<button disabled class="w-full bg-slate-800 border border-red-500/30 text-red-400 font-bold py-2.5 rounded-xl mb-2 cursor-not-allowed flex items-center justify-center gap-1.5"><i class="fas fa-times-circle"></i> Parents Refused to Pay</button>`
        : `<button data-action="attemptEnrollment" data-args="&apos;parents&apos;" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Ask Parents to Pay</button>`;

    const contentHtml = `
        <div class="mb-4 text-left">
            <label class="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">Select Major</label>
            <div class="relative">
                <select id="major-select" class="custom-select w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 outline-none appearance-none">
                    ${MAJORS.map(m => `<option value="${m}" ${m === selectedMajor ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span class="text-xs uppercase font-bold text-slate-400">Total Tuition</span>
            <span class="text-white font-extrabold text-sm">${Utils.formatMoney(40000)}</span>
        </div>
        <div class="space-y-1">
            ${instantBtn}
            ${cashBtn}
            ${loanBtn}
            ${scholarBtn}
            ${parentBtn}
            <button data-action="closeModal" class="w-full mt-2 py-2 text-slate-400 hover:text-white text-xs font-bold transition">Cancel</button>
        </div>
    `;

    if (isUpdate) {
        UI.replaceModalContent("University Enrollment", contentHtml);
    } else {
        UI.showCustomModal({
            title: "University Enrollment",
            content: contentHtml,
            showCloseBtn: true
        });
    }
}
export function attemptEnrollment(method) {
    const user = state.gameState.user;
    const major = get('major-select').value;
    
    if (method === 'instant') {
        UI.hideModal();
        grantInstantUniversityDegree(major);
        renderActivities();
        return;
    }
    if (method === 'cash') {
        user.money -= 40000;
        enrollSuccess(major, "paid with cash");
    } 
    else if (method === 'loan') {
        user.studentLoans += 40000;
        enrollSuccess(major, "took out student loans");
    }
    else if (method === 'scholarship') {
        const perfScore = user.schoolPerformance || 50;
        const chance = Math.max(0, Math.min(0.70, (perfScore - 30) / 100));
        const roll = Math.random();
        if (roll < chance) {
            enrollSuccess(major, "received a full scholarship");
        } else {
            user.scholarshipTried = true;
            renderUniversityModalContent(major, true); // Preserve major choice
        }
    }
    else if (method === 'parents') {
        const roll = Math.random();
        if (roll < 0.3) {
            enrollSuccess(major, "parents paid your tuition");
        } else {
            user.parentsTried = true;
            renderUniversityModalContent(major, true); // Preserve major choice
        }
    }
}
function enrollSuccess(major, methodMsg) {
    const user = state.gameState.user;
    user.universityEnrolled = true;
    user.isStudent = true;
    user.major = major;
    user.schoolPerformance = 50;
    user.schoolActions = 0;
    
    // Close Modal
    UI.hideModal();
    GameLogic.adjustStat(user, 'happiness', 10);
    addLog(`Enrolled in University of ${user.city} for ${major}. You ${methodMsg}. (+10 Happiness)`, 'good');
    UI.updateHeader(user);
    refreshClassmates(user);
    renderActivities();
}

//Grad school pop up
export function renderGradSchoolMarket() {
    const listHtml = GRAD_SCHOOLS.map(school => `
        <div data-action="openGradEnrollmentModal" data-args="&apos;${school.name}&apos;" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                        <i class="fas ${school.icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white">${school.name}</h3>
                        <div class="text-xs text-slate-400">${school.years} Years • Cost: ${Utils.formatMoney(100000)}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600"></i>
            </div>
        </div>
    `).join('');

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-6 px-1">Graduate Schools</h2>
            
            <div class="flex-1 overflow-y-auto pb-4">
                ${listHtml}
            </div>
        </div>
    `;
}
export function openGradEnrollmentModal(schoolType) {
    const user = state.gameState.user;
    // Reset flags
    user.scholarshipTried = false;
    user.parentsTried = false;
    renderGradModalContent(schoolType, false);
}
function renderGradModalContent(schoolType, isUpdate = false) {
    const user = state.gameState.user;

    const instantBtn = hasInstantDiplomaPerk() 
        ? `<button data-action="attemptGradEnrollment" data-args="&apos;${schoolType}&apos;, &apos;instant&apos;" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-2.5 rounded-xl mb-2 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"><i class="fas fa-graduation-cap"></i> Instant Graduation (Diploma Perk)</button>`
        : '';

    const cashDisabled = user.money < 100000;
    const cashBtn = `<button data-action="attemptGradEnrollment" data-args="&apos;${schoolType}&apos;, &apos;cash&apos;" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl mb-2 transition">Pay Cash (${Utils.formatMoney(100000)})</button>`;
    
    const loanBtn = `<button data-action="attemptGradEnrollment" data-args="&apos;${schoolType}&apos;, &apos;loan&apos;" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Student Loans</button>`;
    
    // Scholarship Button
    const scholarBtn = user.scholarshipTried
        ? `<button disabled class="w-full bg-slate-800 border border-red-500/30 text-red-400 font-bold py-2.5 rounded-xl mb-2 cursor-not-allowed flex items-center justify-center gap-1.5"><i class="fas fa-times-circle"></i> Scholarship Denied</button>`
        : `<button data-action="attemptGradEnrollment" data-args="&apos;${schoolType}&apos;, &apos;scholarship&apos;" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Apply for Scholarship</button>`;

    // Parents Button
    const parentBtn = user.parentsTried
        ? `<button disabled class="w-full bg-slate-800 border border-red-500/30 text-red-400 font-bold py-2.5 rounded-xl mb-2 cursor-not-allowed flex items-center justify-center gap-1.5"><i class="fas fa-times-circle"></i> Parents Refused to Pay</button>`
        : `<button data-action="attemptGradEnrollment" data-args="&apos;${schoolType}&apos;, &apos;parents&apos;" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl mb-2 transition">Ask Parents to Pay</button>`;

    const contentHtml = `
        <div class="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3 mb-2 flex items-center justify-between">
            <span class="text-xs uppercase font-bold text-slate-400">Total Tuition</span>
            <span class="text-white font-extrabold text-sm">${Utils.formatMoney(100000)}</span>
        </div>
        <div class="text-xs text-slate-400 mb-4 text-left">Student loan payments will be deferred while enrolled.</div>
        <div class="space-y-1">
            ${instantBtn}
            ${cashBtn}
            ${loanBtn}
            ${scholarBtn}
            ${parentBtn}
            <button data-action="closeModal" class="w-full mt-2 py-2 text-slate-400 hover:text-white text-xs font-bold transition">Cancel</button>
        </div>
    `;

    if (isUpdate) {
        UI.replaceModalContent("Enroll in " + schoolType, contentHtml);
    } else {
        UI.showCustomModal({
            title: "Enroll in " + schoolType,
            content: contentHtml,
            showCloseBtn: true
        });
    }
}
export function attemptGradEnrollment(schoolType, method) {
    const user = state.gameState.user;
    if (method === 'instant') {
        UI.hideModal();
        grantInstantGradDegree(schoolType);
        renderActivities();
        return;
    }
    if (method === 'cash') {
        user.money -= 100000;
        gradEnrollSuccess(schoolType, "paid with cash");
    } 
    else if (method === 'loan') {
        user.studentLoans += 100000;
        gradEnrollSuccess(schoolType, "took out student loans");
    }
    else if (method === 'scholarship') {
        const roll = Math.random();
        if (roll < 0.3) {
            gradEnrollSuccess(schoolType, "received a full scholarship");
        } else {
            user.scholarshipTried = true;
            renderGradModalContent(schoolType, true); 
        }
    }
    else if (method === 'parents') {
        const roll = Math.random();
        if (roll < 0.3) {
            gradEnrollSuccess(schoolType, "parents paid your tuition");
        } else {
            user.parentsTried = true;
            renderGradModalContent(schoolType, true); 
        }
    }
}
function gradEnrollSuccess(schoolType, methodMsg) {
    const user = state.gameState.user;
    user.gradSchoolEnrolled = true;
    user.isStudent = true;
    user.gradSchoolType = schoolType;
    user.gradSchoolYear = 0;
    user.schoolPerformance = 50;
    
    // Close Modal
    UI.hideModal();
    GameLogic.adjustStat(user, 'happiness', 10);
    addLog(`Enrolled in ${schoolType}. You ${methodMsg}. (+10 Happiness)`, 'good');
    UI.updateHeader(user);
    refreshClassmates(user);
    renderActivities();
};

function updateLifeStatus() {
    const user = state.gameState.user;
    let status; // Default fallback
    status = GameLogic.checkLifeStatus(user)
    // SAVE the status to the user object
    user.lifeStatus = status;
    return status;
};
export function getSchoolName() {
    const user = state.gameState.user;
    if (user.gradSchoolEnrolled) {
        const school = GRAD_SCHOOLS.find(s => s.name === user.gradSchoolType);
        return `${user.gradSchoolType} (Year ${user.gradSchoolYear + 1}/${school.years})`;
    }
    if (user.universityEnrolled) return `University of ${user.city}`;
    if (user.age < 12) return `${user.city} Elementary School`;
    if (user.age < 14) return `${user.city} Middle School`;
    return `${user.city} High School`;
};

function isStudent() {
    const user = state.gameState.user;
    return user.universityEnrolled || user.gradSchoolEnrolled || user.highSchoolRetained || (user.age < 18 && !user.highSchoolGraduated);
};

function getStatus() {
    updateLifeStatus();
    const user = state.gameState.user;
    let status = get("status-text");
    status.innerText = user.lifeStatus;
};

export const renderActivities = () => {
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

    const isAdult = user.age >= 18;
    let content = '';
    const currentStatusText = updateLifeStatus();
    const currentJobIsPartTime = PART_TIME_JOBS.some(j => j.title === user.jobTitle);
    
    // If they have a job title but it's NOT part-time, it must be a Career
    const hasCareer = user.jobTitle && !currentJobIsPartTime;
    const hasPartTime = user.jobTitle && currentJobIsPartTime;
    // 1. STATUS CARD
    content += `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 flex justify-between items-center">
            <div>
                <h3 class="text-slate-400 text-xs uppercase font-bold mb-1">Current Status</h3>
                <div id="status-text"class="text-xl font-bold text-white">${currentStatusText}
                </div>
            </div>
             <div class="text-right">
                <h3 class="text-slate-400 text-xs uppercase font-bold mb-1">Residence</h3>
                <div class="text-sm font-bold text-white">${Utils.escapeHtml(user.city)}</div>
            </div>
        </div>
    `;
    // 2. CEO ACTIONS (Always top if active)
    if (user.hasBusiness) {
        content += `
            <div class="mb-6">
                 <h3 class="font-bold text-white mb-2">My Company</h3>
                <button data-action="enterBusinessMode" class="w-full btn-primary text-white font-bold py-4 rounded-xl mb-2 flex items-center justify-between px-6 shadow-lg">
                    <span class="flex items-center gap-3"><i class="fas fa-building"></i> Manage ${Utils.escapeHtml(user.companyName)}</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="text-xs text-slate-400 px-1">Go to office to manage production, pricing and staff.</div>
            </div>
        `;
    }
    // 3. EDUCATION
    if (user.gradSchoolDegree) {
         // Fully done logic
         content += `
            <div class="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700 mb-4 opacity-60 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-300">Education Complete</h3>
                        <div class="text-xs text-slate-500">You have a terminal degree.</div>
                    </div>
                </div>
                <i class="fas fa-check text-slate-500"></i>
            </div>
        `;
    } else if (user.gradSchoolEnrolled) {
         content += `
            <div data-action="renderEducation" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-400 shrink-0">
                            <i class="fas fa-university"></i>
                        </div>
                        <div>
                            <div class="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">Enrolled • Year ${user.gradSchoolYear + 1}</div>
                            <h3 class="font-bold text-white text-sm">${Utils.escapeHtml(user.gradSchoolType)}</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <div class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                            ${user.schoolPerformance}%
                        </div>
                        <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
                    </div>
                </div>
                <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-700/50">
                    <div class="h-full ${user.schoolPerformance > 75 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-300" style="width: ${user.schoolPerformance}%"></div>
                </div>
            </div>
        `;
    } else if (user.universityGraduated) {
         content += `
            <div data-action="renderGradSchoolMarket" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Graduate School</div>
                        <h3 class="font-bold text-white text-sm">Enroll in Program</h3>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    } else if (user.age < 5) {
        content += `
            <div class="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700 mb-4 opacity-60 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-school"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-300">School</h3>
                        <div class="text-xs text-slate-500">Available at Age 5</div>
                    </div>
                </div>
                <i class="fas fa-lock text-slate-500"></i>
            </div>
        `;
    } else if ((user.age < 18 && !user.highSchoolGraduated) || user.highSchoolRetained) {
         content += `
            <div data-action="renderEducation" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-green-900/50 flex items-center justify-center text-green-400 shrink-0">
                            <i class="fas fa-school"></i>
                        </div>
                        <div>
                            <div class="text-[10px] uppercase font-extrabold tracking-wider text-green-400">Education • Enrolled</div>
                            <h3 class="font-bold text-white text-sm">${Utils.escapeHtml(getSchoolName())}</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <div class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                            ${user.schoolPerformance}%
                        </div>
                        <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
                    </div>
                </div>
                <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-700/50">
                    <div class="h-full ${user.schoolPerformance > 75 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-300" style="width: ${user.schoolPerformance}%"></div>
                </div>
            </div>
        `;
    } else if ((user.age >= 18 || user.highSchoolGraduated) && !user.highSchoolRetained) {
        if (user.universityEnrolled) {
             content += `
                <div data-action="renderEducation" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 shrink-0">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-extrabold tracking-wider text-blue-400">University • Enrolled</div>
                                <h3 class="font-bold text-white text-sm">${Utils.escapeHtml(user.major)}</h3>
                            </div>
                        </div>
                        <div class="flex items-center gap-2.5">
                            <div class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                                ${user.schoolPerformance}%
                            </div>
                            <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
                        </div>
                    </div>
                    <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-700/50">
                        <div class="h-full ${user.schoolPerformance > 75 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-300" style="width: ${user.schoolPerformance}%"></div>
                    </div>
                </div>
            `;
        } else {
             content += `
                <div data-action="openUniversityModal" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div>
                            <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Education</div>
                            <h3 class="font-bold text-white text-sm">Enroll in University</h3>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
                </div>
            `;
        }
    }
if (user.age < 15) {
        // ... (Keep your existing "Locked" code here) ...
         content += `
             <div class="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700 mb-4 opacity-60 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-300">Part-Time Jobs</h3>
                        <div class="text-xs text-slate-500">Available at Age 15</div>
                    </div>
                </div>
                <i class="fas fa-lock text-slate-500"></i>
            </div>
        `;
    } else if (hasPartTime) {
        // SCENARIO: User HAS a part-time job -> Show Manage Card
        content += `
            <div data-action="renderCareerManager" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-orange-900/50 flex items-center justify-center text-orange-400 shrink-0">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-orange-400">Part-Time Job</div>
                        <h3 class="font-bold text-white text-sm">${Utils.escapeHtml(user.jobTitle)}</h3>
                        <div class="text-xs text-green-400 font-semibold">${Utils.formatMoney(user.jobSalary)}/yr</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    } else {
        // SCENARIO: User has NO part-time job -> Show "Find Job" Market
        content += `
            <div data-action="renderJobMarket" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Part-Time Jobs</div>
                        <h3 class="font-bold text-white text-sm">Find a part-time job</h3>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    }

    // 5. CAREERS SECTION
    if (user.isRetired && user.retirementPension > 0) {
        content += `
            <div class="bg-slate-800 p-4 rounded-xl border border-amber-500/40 mb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center text-amber-400 shrink-0">
                        <i class="fas fa-cocktail"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">Retirement Pension •Retired</div>
                        <h3 class="font-bold text-white text-sm">${Utils.formatMoney(user.retirementPension)}/yr pension</h3>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 block mb-1">
                        +${Utils.formatMoney(Math.floor(user.retirementPension / 12))}/mo
                    </span>
                    <span class="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1"><i class="fas fa-check-circle"></i> Active</span>
                </div>
            </div>
        `;
    }

    if (user.age < 18) {
         // ... (Keep your existing "Locked" code here) ...
         content += `
             <div class="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700 mb-4 opacity-60 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-300">Careers</h3>
                        <div class="text-xs text-slate-500">Available at Age 18</div>
                    </div>
                </div>
                <i class="fas fa-lock text-slate-500"></i>
            </div>
        `;
    } else if (hasCareer) {
        // SCENARIO: User HAS a career -> Show Manage Card
        content += `
            <div data-action="renderCareerManager" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 shrink-0">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-blue-400">Career</div>
                        <h3 class="font-bold text-white text-sm">${Utils.escapeHtml(user.jobTitle)}</h3>
                        <div class="text-xs text-green-400 font-semibold">${Utils.formatMoney(user.jobSalary)}/yr</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    }  else if (!user.hasBusiness) {
        // No Job, No Business -> Career Market
        content += `
            <div data-action="renderCareerMarket" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Careers</div>
                        <h3 class="font-bold text-white text-sm">Find a career</h3>
                        <div class="text-xs text-slate-500 italic">Browse full-time job tracks</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    } else {
        // SCENARIO: User has NO career -> Show Market
        content += `
            <div data-action="renderCareerMarket" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Careers</div>
                        <h3 class="font-bold text-white text-sm">Find a career</h3>
                        <div class="text-xs text-slate-500 italic">Browse full-time job tracks</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 text-xs"></i>
            </div>
        `;
    }
    // 6. ENTREPRENEURSHIP
    if (!user.hasBusiness) {
        if (!isAdult) {
             content += `
                <div class="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700 mb-6 flex items-center justify-between opacity-60">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-300">Entrepreneurship</h3>
                            <div class="text-xs text-slate-500">Available at Age 18</div>
                        </div>
                    </div>
                    <i class="fas fa-lock text-slate-500"></i>
                </div>
            `;
        } else {
             content += `
                <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <h3 class="font-bold text-white text-lg">Entrepreneurship</h3>
                            <p class="text-sm text-slate-400">Start your own company.</p>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                            <i class="fas fa-rocket"></i>
                        </div>
                    </div>
                    <button data-action="renderBusinessSetup" class="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition">
                        Incorporate Business
                    </button>
                </div>
            `;
        }
    }

    // 6. SPECIAL CAREERS SECTION
    content += `
        <div class="mt-8 mb-4 border-b border-slate-700/50 pb-2">
            <h2 class="text-lg font-bold text-slate-300"><i class="fas fa-star text-amber-500 mr-2"></i>Special Careers</h2>
            <p class="text-xs text-slate-500">Premium and high-risk lifestyle choices.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    SPECIAL_CAREER_TRACKS.forEach(t => {
        const isUnownedPremium = t.premiumPack && !hasPurchasedPack(t.premiumPack);
        const isCurrentTrack = user.careerTrack === t.key;
        const level0 = t.levels[0];
        const activeClass = isCurrentTrack 
            ? 'border-green-500 bg-slate-800' 
            : 'border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-blue-500/50 cursor-pointer';

        let onclickAttr = '';
        if (isUnownedPremium) {
            onclickAttr = `data-action="previewPackDetails" data-args="&apos;${t.premiumPack}&apos;"`;
        } else if (isCurrentTrack) {
            onclickAttr = `data-action="renderCareerManager"`;
        } else {
            onclickAttr = `data-action="joinSpecialCareer" data-args="&apos;${t.key}&apos;"`;
        }

        let trailingIcon = isUnownedPremium ? `<i class="fas fa-lock text-amber-400 text-lg"></i>` : `<i class="fas fa-chevron-right text-slate-600"></i>`;
        if (isCurrentTrack) trailingIcon = `<i class="fas fa-check-circle text-green-500 text-lg"></i>`;

        let cardIcon = t.icon;
        let cardSubtitle = '';
        if (isUnownedPremium) {
            cardSubtitle = 'Unlock in Store';
        } else if (isCurrentTrack) {
            if (t.key === 'pro_athlete' && user.athleteSport && PRO_SPORTS_LEAGUES[user.athleteSport]) {
                cardIcon = PRO_SPORTS_LEAGUES[user.athleteSport].icon;
            }
            cardSubtitle = `${user.jobTitle} - ${Utils.formatMoney(user.jobSalary)}/yr`;
        } else {
            if (t.key === 'pro_athlete') {
                cardSubtitle = 'Draft Combine & Tryouts ($650K–$58M/yr)';
            } else {
                cardSubtitle = `${level0.title} - ${Utils.formatMoney(GameLogic.calculateScaledSalary(level0.salary, user.city))}/yr`;
            }
        }

        content += `
            <div ${onclickAttr} class="p-4 rounded-xl border transition ${activeClass}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300">
                            <i class="fas ${cardIcon} text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-sm">${t.label}</h3>
                            <div class="text-xs ${isUnownedPremium ? 'text-amber-400' : isCurrentTrack ? 'text-green-400 font-semibold' : 'text-slate-400'}">
                                ${cardSubtitle}
                            </div>
                        </div>
                    </div>
                    ${trailingIcon}
                </div>
            </div>
        `;
    });
    
    content += `</div>`;

    UI.updateBottomNav('work');
    const backBtnHtml = !UI.isBottomNavEnabled() ? `
        <div class="mb-4">
            <button data-action="renderLifeDashboard" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
    ` : '';
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            ${backBtnHtml}
            
            <h2 class="text-2xl font-bold mb-6 px-1">Occupation Manager</h2>
            
            <div class="flex-1 overflow-y-auto pb-4">
                ${content}
            </div>
        </div>
    `;
}

