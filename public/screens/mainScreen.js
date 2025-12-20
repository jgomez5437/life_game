// public/screens/mainScreen.js
//age up function
function ageUp() {
    const user = window.gameState.user;
    const currentAge = user.age + 1;
    user.age = currentAge;
    // Check if currently student at start of year
    const currentlyStudent = user.isStudent;
    // Birthday Money Logic (5 to 18)
    if (user.age >= 5 && user.age <= 18) {
        const bdayMoney = Math.floor(Math.random() * 71) + 10; // 10 to 80
        user.money += bdayMoney;
        window.addLog(`You received $${bdayMoney} for your birthday!`, 'good');
    }
    // --- LIVING EXPENSES LOGIC ---
    const annualLivingExpense = window.GameLogic.addLivingExpenses(user.age, user.currentlyStudent);
    //add annual living expense to monthlyOutflow
    user.monthlyOutflow += annualLivingExpense;
    if (annualLivingExpense >0 && !user.hasSeenExpenseMsg) {
        addLog("Your basic living expenses are $2,000 per month.", 'neutral');
        user.hasSeenExpenseMsg = true;
    };

    // --- Student Loans Logic ---
    // Deduct every year if age >= 23 AND not in grad school
    // Placed before Grad School logic so you don't pay the same year you graduate
    if (user.age >= 23 && user.studentLoans >= 2400 && !user.gradSchoolEnrolled) {
        const yearlyPayment = 2400; 
        user.money -= yearlyPayment;
    }
    // Grad School Logic
    if (user.gradSchoolEnrolled) {
        user.gradSchoolYear++;
        const school = window.GRAD_SCHOOLS.find(s => s.name === user.gradSchoolType);
        
        if (user.gradSchoolYear >= school.years) {
            user.gradSchoolEnrolled = false;
            user.gradSchoolDegree = user.gradSchoolType;
            addLog(`Graduated from ${user.gradSchoolType}! You are now qualified for advanced careers.`, 'good');
        } else {
            addLog(`Completed year ${user.gradSchoolYear} of ${user.gradSchoolType}.`, 'neutral');
        }
    }
    // --- JOB SALARY LOGIC ---       //TODO
    if (user.jobTitle) {
        user.bank += user.jobSalary;

        addLog(`Earned ${window.Utils.formatMoney(user.jobSalary)} as a ${user.jobTitle}.`, 'good');
    }
    // High School Graduation / Failure Logic
    if (user.age === 18) {
        if (user.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            user.highSchoolRetained = false;
        } else {
            addLog("You failed senior year and stay another year in High School. Try working harder.", 'bad');
            user.highSchoolRetained = true;
        }
    }
    else if (user.age === 19 && user.highSchoolRetained) {
        if (user.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            user.highSchoolRetained = false;
        } else {
            addLog("You failed again. One last chance.", 'bad');
            user.highSchoolRetained = true;
        }
    }
    else if (user.age === 20 && user.highSchoolRetained) {
        addLog("Your high school felt bad and helped you get your GED during evenings. Enroll in University or find a job.", 'green');
        user.highSchoolRetained = false;
    }
    // University Graduation Logic (Age 22)
    if (user.age === 22 && user.universityEnrolled) {
        addLog(`You finished University with a degree in ${user.major}. Time to find a career!`, 'good');
        
        if (user.studentLoans > 0) {
            addLog("Your student loan payment is $200 per month.", 'neutral');
        }
        user.universityEnrolled = false;
        user.universityGraduated = true;
    }
    // School Transitions (Normal)
    if (user.age === 12) {
        user.schoolPerformance = 50;
        addLog("Started Middle School.", 'neutral');
    } else if (user.age === 14) {
        user.schoolPerformance = 50;
        addLog("Started High School.", 'neutral');
    }
    // Age Specific Events
    if (user.age === 1) addLog("You've discovered building blocks and started throwing them.", 'good');
    else if (user.age === 2) addLog("You learned to walk, mostly into furniture.", 'good');
    else if (user.age === 3) addLog("You drew a masterpiece on the living room wall with crayons.", 'good');
    else if (user.age === 4) addLog("You refused to eat anything green for an entire year.", 'good');
    else if (user.age === 5) addLog("You started Elementary School! Time to learn.", 'good');
    // Random Events for older ages
    else if (user.age < 18) {
        const roll = Math.random();
        if (user.age === 16) {
             addLog("Legal working age reached.", 'neutral');
        }
        else if (roll < 0.2) {
            const gift = Math.floor(Math.random() * 20) + 5;
            user.money += gift;
            addLog(`Found $${gift} on the sidewalk!`, 'good');
        } else if (roll > 0.9) {
             addLog("Got the flu. Stayed home for a week.", 'bad');
        } else {
            addLog("Another year passes...");
        }
    } else {
        // Adult Events
        // If unemployed and not in school, maybe negative events?
        if (!user.jobTitle && !user.hasBusiness && !user.universityEnrolled && !user.gradSchoolEnrolled && user.age >= 18) {
             addLog("Unemployed. Savings are dwindling.", 'bad');
        } else {
             addLog("Another year passes...");
        }
    }
    //remove monthlyOutflow from user bank account
    user.money -= user.monthlyOutflow
    window.renderLifeDashboard(window.gameState);
    };


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
    UI.updateHeader({
        name: user.username,
        age: user.age,
        money: user.money
    });
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
