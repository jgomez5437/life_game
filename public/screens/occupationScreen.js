//OCCUPATION/EDUCATION/ENTREPRENUER MANAGER SCREEN

//University Pop up
function openUniversityModal() {
    // Reset flags
    const user = window.gameState.user;
    user.scholarshipTried = false;
    user.parentsTried = false;
    renderUniversityModalContent();
}
function renderUniversityModalContent(selectedMajor = null) {
    const user = window.gameState.user;
    const m = get('modal-overlay');
    get('modal-title').innerText = "University Enrollment";
    get('modal-content').innerHTML = `
        <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-1">Select Major</label>
            <div class="relative">
                <select id="major-select" class="custom-select w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none appearance-none">
                    ${MAJORS.map(m => `<option value="${m}" ${m === selectedMajor ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="text-sm text-slate-300 mb-2">Tuition: <span class="text-white font-bold">$40,000</span></div>
    `;
    
    // Render Actions
    const cashDisabled = user.money < 40000;
    const cashBtn = `<button onclick="attemptEnrollment('cash')" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded mb-2">Pay Cash ($40k)</button>`;
    
    const loanBtn = `<button onclick="attemptEnrollment('loan')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mb-2">Student Loans</button>`;
    
    // Scholarship Button
    let scholarBtn = "";
    if (user.scholarshipTried) {
        scholarBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">Ineligible</button>`;
    } else {
        scholarBtn = `<button onclick="attemptEnrollment('scholarship')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mb-2">Apply for Scholarship</button>`;
    }
    // Parents Button
    let parentBtn = "";
    if (user.parentsTried) {
         parentBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">They Refused</button>`;
    } else {
        parentBtn = `<button onclick="attemptEnrollment('parents')" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded mb-2">Ask Parents to Pay</button>`;
    }
    get('modal-actions').innerHTML = `
        <div class="space-y-1">
            ${cashBtn}
            ${loanBtn}
            ${scholarBtn}
            ${parentBtn}
            <button onclick="document.getElementById('modal-overlay').classList.add('hidden'); document.getElementById('modal-overlay').classList.remove('flex');" class="w-full mt-4 text-slate-400 hover:text-white text-sm">Cancel</button>
        </div>
    `;
    m.classList.remove('hidden');
    m.classList.add('flex');
}
function attemptEnrollment(method) {
    const user = window.gameState.user;
    const major = get('major-select').value;
    
    if (method === 'cash') {
        user.money -= 40000;
        enrollSuccess(major, "paid with cash");
    } 
    else if (method === 'loan') {
        user.studentLoans += 40000;
        enrollSuccess(major, "took out student loans");
    }
    else if (method === 'scholarship') {
        const roll = Math.random();
        if (roll < 0.3) {
            enrollSuccess(major, "received a full scholarship");
        } else {
            user.scholarshipTried = true;
            renderUniversityModalContent(major); // Preserve major choice
        }
    }
    else if (method === 'parents') {
        const roll = Math.random();
        if (roll < 0.3) {
            enrollSuccess(major, "parents paid your tuition");
        } else {
            user.parentsTried = true;
            renderUniversityModalContent(major); // Preserve major choice
        }
    }
}
function enrollSuccess(major, methodMsg) {
    const user = window.gameState.user;
    user.universityEnrolled = true;
    user.isStudent = true;
    user.major = major;
    user.schoolPerformance = 50;
    
    // Close Modal
    const m = get('modal-overlay');
    m.classList.add('hidden');
    m.classList.remove('flex');
    addLog(`Enrolled in University of ${user.city} for ${major}. You ${methodMsg}.`, 'good');
    renderActivities();
}

//Grad school pop up
function renderGradSchoolMarket() {
    window.updateGameInfo(userData);
    const listHtml = GRAD_SCHOOLS.map(school => `
        <div onclick="openGradEnrollmentModal('${school.name}')" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                        <i class="fas ${school.icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white">${school.name}</h3>
                        <div class="text-xs text-slate-400">${school.years} Years • Cost: $100,000</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-slate-600"></i>
            </div>
        </div>
    `).join('');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
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
function openGradEnrollmentModal(schoolType) {
    const user = window.gameState.user;
    // Reset flags
    user.scholarshipTried = false;
    user.parentsTried = false;
    renderGradModalContent(schoolType);
}
function renderGradModalContent(schoolType) {
    const user = window.gameState.user;
    const m = get('modal-overlay');
    get('modal-title').innerText = "Enroll in " + schoolType;
    get('modal-content').innerHTML = `
        <div class="text-sm text-slate-300 mb-4">Total Tuition: <span class="text-white font-bold">$100,000</span></div>
        <div class="text-xs text-slate-400 mb-2">Student loan payments will be deferred while enrolled.</div>
    `;
    
    // Render Actions
    const cashDisabled = user.bank < 100000;
    const cashBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'cash')" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded mb-2">Pay Cash ($100k)</button>`;
    
    const loanBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'loan')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mb-2">Student Loans</button>`;
    
    // Scholarship Button
    let scholarBtn = "";
    if (user.scholarshipTried) {
        scholarBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">Ineligible</button>`;
    } else {
        scholarBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'scholarship')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mb-2">Apply for Scholarship</button>`;
    }
    // Parents Button
    let parentBtn = "";
    if (user.parentsTried) {
         parentBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">They Refused</button>`;
    } else {
        parentBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'parents')" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded mb-2">Ask Parents to Pay</button>`;
    }
    get('modal-actions').innerHTML = `
        <div class="space-y-1">
            ${cashBtn}
            ${loanBtn}
            ${scholarBtn}
            ${parentBtn}
            <button onclick="document.getElementById('modal-overlay').classList.add('hidden'); document.getElementById('modal-overlay').classList.remove('flex');" class="w-full mt-4 text-slate-400 hover:text-white text-sm">Cancel</button>
        </div>
    `;
    m.classList.remove('hidden');
    m.classList.add('flex');
}
function attemptGradEnrollment(schoolType, method) {
    const user = window.gameState.user;
    if (method === 'cash') {
        user.bank -= 100000;
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
            renderGradModalContent(schoolType); 
        }
    }
    else if (method === 'parents') {
        const roll = Math.random();
        if (roll < 0.3) {
            gradEnrollSuccess(schoolType, "parents paid your tuition");
        } else {
            user.parentsTried = true;
            renderGradModalContent(schoolType); 
        }
    }
}
function gradEnrollSuccess(schoolType, methodMsg) {
    const user = window.gameState.user;
    user.gradSchoolEnrolled = true;
    user.gradSchoolType = schoolType;
    user.gradSchoolYear = 0;
    user.schoolPerformance = 50;
    
    // Close Modal
    const m = get('modal-overlay');
    m.classList.add('hidden');
    m.classList.remove('flex');
    addLog(`Enrolled in ${schoolType}. You ${methodMsg}.`, 'good');
    window.updateGameInfo(userData);
    renderActivities();
};

function updateLifeStatus() {
    const user = window.gameState.user;
    let status; // Default fallback
    status = window.GameLogic.checkLifeStatus(user)
    // SAVE the status to the user object
    user.lifeStatus = status;
    return status;
};
function getSchoolName() {
    const user = window.gameState.user;
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
    const user = window.gameState.user;
    return user.universityEnrolled || user.gradSchoolEnrolled || user.highSchoolRetained || (user.age < 18);
};

function getStatus() {
    updateLifeStatus();
    const user = window.gameState.user;
    let status = get("status-text");
    status.innerText = user.lifeStatus;
};

window.renderActivities = () => {
    const user = window.gameState.user;
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
                <div class="text-sm font-bold text-white">${user.city}</div>
            </div>
        </div>
    `;
    // 2. CEO ACTIONS (Always top if active)
    if (user.hasBusiness) {
        content += `
            <div class="mb-6">
                 <h3 class="font-bold text-white mb-2">My Company</h3>
                <button onclick="enterBusinessMode()" class="w-full btn-primary text-white font-bold py-4 rounded-xl mb-2 flex items-center justify-between px-6 shadow-lg">
                    <span class="flex items-center gap-3"><i class="fas fa-building"></i> Manage ${user.companyName}</span>
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
            <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400">
                            <i class="fas fa-university"></i>
                        </div>
                        <h3 class="font-bold text-white">${user.gradSchoolType}</h3>
                    </div>
                    <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                        ${user.schoolPerformance}%
                    </div>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                    <div>
                        <div class="text-sm text-white font-bold">Year ${user.gradSchoolYear + 1}</div>
                        <div class="text-xs text-purple-400">Enrolled</div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    } else if (user.universityGraduated) {
         content += `
            <div onclick="renderGradSchoolMarket()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3 class="font-bold text-white">Graduate School</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div class="text-sm text-white font-bold">Enroll in Program</div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
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
    } else if (user.age < 18 || user.highSchoolRetained) {
         content += `
            <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400">
                            <i class="fas fa-school"></i>
                        </div>
                        <h3 class="font-bold text-white">Education</h3>
                    </div>
                    <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                        ${user.schoolPerformance}%
                    </div>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                    <div>
                        <div class="text-sm text-white font-bold">${getSchoolName()}</div>
                        <div class="text-xs text-green-400">Enrolled</div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    } else if (user.age >= 18 && !user.highSchoolRetained) {
        if (user.universityEnrolled) {
             content += `
                <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3 class="font-bold text-white">University</h3>
                        </div>
                        <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${user.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                            ${user.schoolPerformance}%
                        </div>
                    </div>
                    <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                        <div>
                            <div class="text-sm text-white font-bold">${user.major}</div>
                            <div class="text-xs text-blue-400">Enrolled</div>
                        </div>
                        <i class="fas fa-chevron-right text-slate-600"></i>
                    </div>
                </div>
            `;
        } else {
             content += `
                <div onclick="openUniversityModal()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h3 class="font-bold text-white">Education</h3>
                    </div>
                    <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                         <div class="text-sm text-white font-bold">Enroll in University</div>
                         <i class="fas fa-chevron-right text-slate-600"></i>
                    </div>
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
            <div onclick="renderCareerManager()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                     <div class="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center text-orange-400">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3 class="font-bold text-white">Part-Time Job</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                        <div class="text-sm text-white font-bold">${user.jobTitle}</div>
                        <div class="text-xs text-green-400">${window.Utils.formatMoney(user.jobSalary)}/yr</div>
                     </div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    } else {
        // SCENARIO: User has NO part-time job -> Show "Find Job" Market
        content += `
            <div onclick="renderJobMarket()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                     <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3 class="font-bold text-white">Part-Time Jobs</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div class="text-sm text-white font-bold">Find a part-time job</div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    }

    // 5. CAREERS SECTION
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
            <div onclick="renderCareerManager()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                     <div class="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h3 class="font-bold text-white">Career</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                        <div class="text-sm text-white font-bold">${user.jobTitle}</div>
                        <div class="text-xs text-green-400">${window.Utils.formatMoney(user.jobSalary)}/yr</div>
                     </div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    }  else if (!user.hasBusiness) {
        // No Job, No Business -> Career Market
        content += `
            <div onclick="renderCareerMarket()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                     <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h3 class="font-bold text-white">Careers</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                        <div class="text-sm text-white font-bold">Find a career</div>
                        <div class="text-xs text-slate-500 italic">No active job offers found.</div>
                     </div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
            </div>
        `;
    } else {
        // SCENARIO: User has NO career -> Show Market
        content += `
            <div onclick="renderCareerMarket()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                <div class="flex items-center gap-3 mb-2">
                     <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h3 class="font-bold text-white">Careers</h3>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                        <div class="text-sm text-white font-bold">Find a career</div>
                        <div class="text-xs text-slate-500 italic">No active job offers found.</div>
                     </div>
                     <i class="fas fa-chevron-right text-slate-600"></i>
                </div>
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
                    <button onclick="renderBusinessSetup()" class="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition">
                        Incorporate Business
                    </button>
                </div>
            `;
        }
    }
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button onclick="renderLifeDashboard(window.gameState)" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <h2 class="text-2xl font-bold mb-6 px-1">Occupation Manager</h2>
            
            <div class="flex-1 overflow-y-auto pb-4">
                ${content}
            </div>
        </div>
    `;
}

