// public/screens/mainScreen.js
//age up function
// mainScreen.js

function ageUp() {
    const user = window.gameState.user;
    
    // 1. The Core Update
    user.age++;

    // 2. Run The Sub-Systems
    handleFinances(user);
    handleEducation(user);
    handleMarket(user);
    handleLifeEvents(user);

    // 3. Cleanup & Render
    checkSchoolActionTaken(user); // Reset flags
    checkActionTaken();           // Reset flags
    
    window.renderLifeDashboard(window.gameState);
    
    // Auto Save
    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
}

// sub systems that ageup calls
function handleFinances(user) {
    // 1. Birthday Money (Kids only)
    if (user.age >= 5 && user.age <= 18) {
        const bdayMoney = window.GameLogic.calculateBirthdayMoney();
        user.money += bdayMoney;
        window.addLog(`You received ${window.Utils.formatMoney(bdayMoney)} for your birthday!`, 'good');
    }

    // 2. Job Salary
    if (user.jobTitle) {
        user.money += user.jobSalary;
        if (user.hasSeenJobSalary){
            addLog(`Earned ${window.Utils.formatMoney(user.jobSalary)} as a ${user.jobTitle}.`, 'good');
        }
    }

    // 3. Living Expenses
    const annualLivingExpense = window.GameLogic.addLivingExpenses(user.age, user.isStudent);
    if (annualLivingExpense > 0) {
        user.monthlyLivingExpense = annualLivingExpense;
        user.money -= annualLivingExpense; // Deduct immediately
        
        if (!user.hasSeenExpenseMsg) {
            addLog("Your basic living expenses are $2,000 per month.", 'neutral');
            user.hasSeenExpenseMsg = true;
        }
    }

    // 4. Student Loans
    const yearlyStudentLoanPayment = window.GameLogic.addStudentLoanPayment(user.age, user.studentLoans, user.isStudent); 
    user.monthlyOutflow += yearlyStudentLoanPayment;
    user.studentLoans -= yearlyStudentLoanPayment;
}

function handleEducation(user) {
    // 1. High School Logic
    if (user.age === 18 || (user.age === 19 && user.highSchoolRetained)) {
        if (user.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            user.highSchoolRetained = false;
            user.isStudent = false;
        } else {
            addLog("You failed. You must stay another year in High School.", 'bad');
            user.highSchoolRetained = true;
            user.isStudent = true;
        }
    } else if (user.age === 20 && user.highSchoolRetained) {
        addLog("Your high school took pity on you. You passed with a GED.", 'green');
        user.highSchoolRetained = false;
        user.isStudent = false;
    }

    // 2. University Logic
    if (user.universityEnrolled) {
        user.universitySchoolYear++;
        if (window.GameLogic.checkSchoolGraduated(user.universitySchoolYear, 4)) {
            user.universityEnrolled = false;
            user.isStudent = false;
            user.universityGraduated = true;
            addLog(`You finished University with a degree in ${user.major}.`, 'good');
        }
    }

    // 3. Grad School Logic
    if (user.gradSchoolEnrolled) {
        user.gradSchoolYear++;
        const school = window.GRAD_SCHOOLS.find(s => s.name === user.gradSchoolType);
        if (window.GameLogic.checkSchoolGraduated(user.gradSchoolYear, school.years)) {
            user.gradSchoolEnrolled = false;
            user.isStudent = false;
            user.gradSchoolDegree = user.gradSchoolType;
            addLog(`Graduated from ${user.gradSchoolType}!`, 'good');
        } else {
            addLog(`Completed year ${user.gradSchoolYear} of ${user.gradSchoolType}.`, 'neutral');
        }
    }

    // 4. Transitions
    if (user.age === 12) addLog("Started Middle School.", 'good');
    if (user.age === 14) addLog("Started High School.", 'good');
}

function handleMarket(user) {
    const marketForce = window.GameLogic.simulateVehicleMarket();
    window.GameLogic.updateOwnedVehicles(user, marketForce);
    
    if (marketForce > 0.06 && user.age > 15) {
        window.addLog("Inflation hits the auto market! Car prices are up.", "bad");
    } else if (marketForce < -0.06 && user.age > 15) {
        window.addLog("Auto market crash! Vehicle prices are down.", "good");
    }
}

function handleLifeEvents(user) {
    // Baby Events
    if (user.age === 1) addLog("You've discovered building blocks.", 'good');
    else if (user.age === 2) addLog("You learned to walk.", 'good');
    else if (user.age === 3) addLog("You drew on the walls.", 'good');
    else if (user.age === 5) addLog("Started Elementary School!", 'good');
    
    // Random Events
    else if (user.age < 18 && user.age > 5) {
        if (user.age === 16) addLog("Legal working age reached.", 'neutral');
        
        const roll = Math.random();
        if (roll < 0.2) {
            const gift = Math.floor(Math.random() * 20) + 5;
            user.money += gift;
            addLog(`Found $${gift} on the sidewalk!`, 'good');
        } else if (roll > 0.9) {
            addLog("Got the flu. Stayed home for a week.", 'bad');
        }
    } 
    // Adult Empty State
    else if (!user.highSchoolRetained && !user.jobTitle && !user.hasBusiness && !user.universityEnrolled && user.age >= 18) {
         addLog("Unemployed. Savings are dwindling.", 'bad');
    }
}
//Define the rendering function globally so script.js can call it.
window.renderLifeDashboard = (maybeGameState) => {
    // --- Data Preparation ---
    const state = maybeGameState || window.gameState;
    if (!state || !state.user) {
        console.warn("renderLifeDashboard called before game state existed.");
        return;}
    const user = state.user;
    //Update the Header Bar using the UI Manager
    //    We assume 'game' holds the key stats needed for the header.
    UI.updateHeader(user);
    //change avatar based on gender
    let iconClass = '';
    if (user.age < 5) {
    iconClass = 'fas fa-baby text-green-400'; // Babies are green/neutral
    } else if (user.age < 13) {
    iconClass = 'fas fa-child text-yellow-400'; // Kids are yellow
    } else {
    // Adults get gender colors
    iconClass = user.gender === 'male' 
        ? 'fas fa-male text-blue-400' 
        : 'fas fa-female text-pink-400';
    };
    const avatarHtml = `<i class="${iconClass} text-2xl"></i>`;
    if(user.username) get('avatar-container').innerHTML = avatarHtml;
    //Generate the Life Log HTML
    const logHtml = state.lifeLog.map(l => `
        <div class="mb-2 text-sm border-l-2 border-slate-700 pl-3 py-1">
            <span class="font-bold text-slate-500 text-xs">Age ${l.age}</span>
            <div class="mt-1 space-y-1">
                ${l.events.map(e => `<div class="${e.color}">${e.msg}</div>`).join('')}
            </div>
        </div>
    `).join('');

    //Define Action Variables
    const ageUpText = "Age Up +";

    //Define the Final HTML String
    const dashboardHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="flex-1 overflow-y-auto mb-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 class="font-bold text-slate-300 mb-4 sticky top-0 bg-transparent backdrop-blur-md py-1 border-b border-slate-700/50">Life History</h3>
                <div class="space-y-2">
                    ${logHtml.length > 0 ? logHtml : '<div class="text-slate-600 text-sm italic">Life has just begun...</div>'}
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-2 h-20">
                <button onclick="renderAssets()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-home mb-1 text-xl text-yellow-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Assets</span>
                </button>
                <button onclick="renderActivities()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-user-graduate mb-1 text-xl text-blue-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Occupation</span>
                </button>
                <button onclick="ageUp()" class="btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <i class="fas fa-arrow-up mb-1 text-xl"></i>
                    <span class="text-[10px] uppercase tracking-wider">${ageUpText}</span>
                </button>
            </div>
        </div>
    `;
    
    //Use the UI Manager to inject the HTML into the game container
    UI.renderScreen(dashboardHTML);
}

window.addLog = (msg, type = 'neutral') => {
    // 1. Get current age from the centralized state
    const currentAge = window.gameState.user.age;
    //color for the log
    let color = 'text-slate-400';
    if (type === 'good') color = 'text-green-400';
    else if (type === 'bad') color = 'text-red-400';
    else if (type === 'major') color = 'text-yellow-400 font-bold';
    else if (type === 'green') color = 'text-green-400';
    //is there a log for this age?
    let ageLog = window.gameState.lifeLog.find(l => l.age === currentAge);
    if (ageLog) {
        ageLog.events.push({ msg, color });
    } else {
        window.gameState.lifeLog.unshift({ 
            age: currentAge, 
            events: [{ msg, color }] 
        });
    }
};
