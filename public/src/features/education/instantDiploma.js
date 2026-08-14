import { state, hasPurchasedPack } from '../../core/state.js';
import { addLog, refreshClassmates } from '../player/mainScreen.js';
import { saveGame } from '../../core/main.js';
import { UI } from '../../ui/ui.js';
import { MAJORS } from '../../core/constants.js';
import { GRAD_SCHOOLS } from '../career/occupationScreen.js';

/**
 * Checks if the user owns the Instant Diplomas store perk.
 */
export function hasInstantDiplomaPerk() {
    return hasPurchasedPack('instant_diplomas');
}

/**
 * Grants High School Diploma instantly.
 */
export function grantInstantHighSchool() {
    const user = state.gameState?.user;
    if (!user) return;

    if (!hasInstantDiplomaPerk()) {
        UI.showModal("Locked Perk", "You must purchase Instant Diplomas from The Spot store to use this fast-track feature.");
        return;
    }

    user.highSchoolRetained = false;
    user.highSchoolGraduated = true;
    user.universityEnrolled = false;
    user.gradSchoolEnrolled = false;
    user.isStudent = false;

    // Clear classmate ties
    if (Array.isArray(user.relationships)) {
        user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
        user.relationships = user.relationships.filter(r => r.category !== 'classmate');
    }

    addLog("Granted Instant High School Diploma! You are now fully eligible for University and full-time careers.", 'good');
    if (typeof saveGame === "function") saveGame();

    UI.showModal("High School Diploma Claimed", "Congratulations! You have been awarded your High School Diploma instantly with no academic requirements.");
}

/**
 * Grants a Bachelor's Degree in the selected major instantly.
 */
export function grantInstantUniversityDegree(major) {
    const user = state.gameState?.user;
    if (!user) return;

    if (!hasInstantDiplomaPerk()) {
        UI.showModal("Locked Perk", "You must purchase Instant Diplomas from The Spot store to use this fast-track feature.");
        return;
    }

    const chosenMajor = major || (user.major ? user.major : (MAJORS[0] || "Computer Science"));

    user.highSchoolRetained = false;
    user.highSchoolGraduated = true;
    user.universityEnrolled = false;
    user.universityGraduated = true;
    user.gradSchoolEnrolled = false;
    user.major = chosenMajor;
    user.universitySchoolYear = 4;
    user.schoolPerformance = 100;
    user.isStudent = false;

    // Clear classmate ties
    if (Array.isArray(user.relationships)) {
        user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
        user.relationships = user.relationships.filter(r => r.category !== 'classmate');
    }

    addLog(`Granted Instant Bachelor's Degree in ${chosenMajor}! Zero tuition debt incurred.`, 'good');
    if (typeof saveGame === "function") saveGame();

    UI.showModal(
        "University Degree Earned!",
        `You have been awarded an instant Bachelor's Degree in <strong>${chosenMajor}</strong>! All career prerequisites for this degree are now unlocked.`
    );
}

/**
 * Grants a Graduate Degree (Law, Med, Business, Psychiatry) instantly.
 */
export function grantInstantGradDegree(schoolType) {
    const user = state.gameState?.user;
    if (!user) return;

    if (!hasInstantDiplomaPerk()) {
        UI.showModal("Locked Perk", "You must purchase Instant Diplomas from The Spot store to use this fast-track feature.");
        return;
    }

    user.highSchoolRetained = false;
    user.highSchoolGraduated = true;
    user.universityEnrolled = false;
    user.universityGraduated = true;
    user.gradSchoolEnrolled = false;
    user.gradSchoolDegree = schoolType;
    user.gradSchoolType = schoolType;
    user.gradSchoolYear = 4;
    user.schoolPerformance = 100;
    user.isStudent = false;

    // Clear classmate ties
    if (Array.isArray(user.relationships)) {
        user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
        user.relationships = user.relationships.filter(r => r.category !== 'classmate');
    }

    addLog(`Granted Instant Graduate Degree from ${schoolType}! You are fully qualified for elite career tracks.`, 'good');
    if (typeof saveGame === "function") saveGame();

    UI.showModal(
        "Graduate Degree Earned!",
        `You have been awarded an instant diploma from <strong>${schoolType}</strong>! Zero tuition debt incurred.`
    );
}

/**
 * Opens the Instant Diploma Perk Hub modal allowing degree management.
 */
export function renderInstantDiplomaHub() {
    const user = state.gameState?.user;
    if (!user) return;

    if (!hasInstantDiplomaPerk()) {
        UI.showModal("Store Perk Required", "Unlock Instant Diplomas in The Spot store to access instant academic fast-tracking.");
        return;
    }

    const hasHighSchool = user.age >= 18 || user.highSchoolGraduated || (user.universityGraduated && !user.highSchoolRetained);
    const universityStatus = user.universityGraduated ? `Bachelor's in ${user.major}` : 'Not Earned';
    const gradStatus = user.gradSchoolDegree ? `${user.gradSchoolDegree} Graduate` : 'Not Earned';

    const hubHTML = `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 p-3.5 rounded-xl border border-blue-500/30 text-left">
                <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-400 mb-1">
                    <i class="fas fa-graduation-cap"></i> Instant Diplomas Active
                </div>
                <p class="text-xs text-slate-300">
                    Bypass academic requirements and earn High School, University, or Graduate degrees on demand with zero tuition debt.
                </p>
            </div>

            <!-- 1. High School Section -->
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-school text-green-400 text-sm"></i>
                        <span class="font-bold text-white text-sm">High School Diploma</span>
                    </div>
                    <span class="text-xs font-bold ${hasHighSchool ? 'text-emerald-400' : 'text-slate-400'}">
                        ${hasHighSchool ? 'Completed' : 'Pending'}
                    </span>
                </div>
                ${!hasHighSchool ? `
                    <button data-action="grantInstantHighSchool" class="w-full mt-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-xs transition">
                        Claim High School Diploma
                    </button>
                ` : `
                    <div class="text-[11px] text-slate-400 italic">High School requirements fulfilled.</div>
                `}
            </div>

            <!-- 2. University Bachelor's Section -->
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-university text-blue-400 text-sm"></i>
                        <span class="font-bold text-white text-sm">University Major Degree</span>
                    </div>
                    <span class="text-xs font-bold ${user.universityGraduated ? 'text-blue-400' : 'text-slate-400'}">
                        ${universityStatus}
                    </span>
                </div>
                <div class="mb-2">
                    <label class="block text-[11px] text-slate-400 mb-1">Select Degree Major</label>
                    <select id="instant-major-select" class="custom-select w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white outline-none">
                        ${MAJORS.map(m => `<option value="${m}" ${m === user.major ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
                <button data-action="claimInstantUniversityMajor" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition">
                    ${user.universityGraduated ? 'Change / Re-issue Bachelor\'s Degree' : 'Grant Instant Bachelor\'s Degree'}
                </button>
            </div>

            <!-- 3. Graduate School Section -->
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-user-graduate text-purple-400 text-sm"></i>
                        <span class="font-bold text-white text-sm">Graduate School Degree</span>
                    </div>
                    <span class="text-xs font-bold ${user.gradSchoolDegree ? 'text-purple-400' : 'text-slate-400'}">
                        ${gradStatus}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                    ${GRAD_SCHOOLS.map(school => `
                        <button data-action="grantInstantGradDegree" data-args="'${school.name}'" class="bg-slate-800 hover:bg-purple-900/50 border border-slate-700 hover:border-purple-500 text-white text-xs font-semibold py-2 px-2 rounded-lg transition flex items-center gap-1.5 justify-center">
                            <i class="fas ${school.icon} text-purple-400 text-xs"></i>
                            <span class="truncate">${school.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    UI.showCustomModal({
        title: "Instant Diploma Hub",
        content: hubHTML,
        confirmText: "Close Hub",
        cancelText: null
    });
}

/**
 * Handler for claiming university major from the hub dropdown
 */
export function claimInstantUniversityMajor() {
    const select = document.getElementById('instant-major-select');
    const major = select ? select.value : "Computer Science";
    grantInstantUniversityDegree(major);
}
