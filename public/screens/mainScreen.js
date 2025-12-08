// public/screens/mainScreen.js

//age up function
function ageUp() {
    const currentAge = window.gameState.user.age + 1;
    window.gameState.user.age = currentAge;
    game.schoolActions = 0; // Reset school actions every year
    game.careerActionTaken = false; // Reset career actions
    
    // Check if currently student at start of year
    const currentlyStudent = isStudent();
    // Birthday Money Logic (5 to 18)
    if (currentAge >= 5 && currentAge <= 18) {
        const bdayMoney = Math.floor(Math.random() * 71) + 10; // 10 to 80
        game.bank += bdayMoney;
        addLog(`You received $${bdayMoney} for your birthday!`, 'good');
    }
    // --- LIVING EXPENSES LOGIC ---
    if (currentAge >= 19 && !currentlyStudent) {
        game.bank -= 24000; // $2k * 12
        
        if (!game.hasSeenExpenseMsg) {
            addLog("Your basic living expenses are $2,000 per month.", 'neutral');
            game.hasSeenExpenseMsg = true;
        }
    }
    // --- Student Loans Logic ---
    // Deduct every year if age >= 23 AND not in grad school
    // Placed before Grad School logic so you don't pay the same year you graduate
    if (currentAge >= 23 && game.studentLoans > 0 && !game.gradSchoolEnrolled) {
        const yearlyPayment = 2400; 
        game.bank -= yearlyPayment;
    }
    // Grad School Logic
    if (game.gradSchoolEnrolled) {
        game.gradSchoolYear++;
        const school = GRAD_SCHOOLS.find(s => s.name === game.gradSchoolType);
        
        if (game.gradSchoolYear >= school.years) {
            game.gradSchoolEnrolled = false;
            game.gradSchoolDegree = game.gradSchoolType;
            addLog(`Graduated from ${game.gradSchoolType}! You are now qualified for advanced careers.`, 'good');
        } else {
            addLog(`Completed year ${game.gradSchoolYear} of ${game.gradSchoolType}.`, 'neutral');
        }
    }
    // --- JOB SALARY LOGIC ---
    if (game.jobTitle) {
        game.bank += game.jobSalary;
        addLog(`Earned ${formatMoney(game.jobSalary)} as a ${game.jobTitle}.`, 'good');
    }
    // High School Graduation / Failure Logic
    if (currentAge === 18) {
        if (game.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            game.highSchoolRetained = false;
        } else {
            addLog("You failed senior year and stay another year in High School. Try working harder.", 'bad');
            game.highSchoolRetained = true;
        }
    }
    else if (currentAge === 19 && game.highSchoolRetained) {
        if (game.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            game.highSchoolRetained = false;
        } else {
            addLog("You failed again. One last chance.", 'bad');
            game.highSchoolRetained = true;
        }
    }
    else if (currentAge === 20 && game.highSchoolRetained) {
        addLog("Your high school felt bad and helped you get your GED during evenings. Enroll in University or find a job.", 'green');
        game.highSchoolRetained = false;
    }
    // University Graduation Logic (Age 22)
    if (currentAge === 22 && game.universityEnrolled) {
        addLog(`You finished University with a degree in ${game.major}. Time to find a career!`, 'good');
        
        if (game.studentLoans > 0) {
            addLog("Your student loan payment is $200 per month.", 'neutral');
        }
        game.universityEnrolled = false;
        game.universityGraduated = true;
    }
    // School Transitions (Normal)
    if (currentAge === 12) {
        game.schoolPerformance = 50;
        addLog("Started Middle School.", 'neutral');
    } else if (currentAge === 14) {
        game.schoolPerformance = 50;
        addLog("Started High School.", 'neutral');
    }
    // Age Specific Events
    if (currentAge === 1) addLog("You've discovered building blocks and started throwing them.", 'good');
    else if (currentAge === 2) addLog("You learned to walk, mostly into furniture.", 'good');
    else if (currentAge === 3) addLog("You drew a masterpiece on the living room wall with crayons.", 'good');
    else if (currentAge === 4) addLog("You refused to eat anything green for an entire year.", 'good');
    else if (currentAge === 5) addLog("You started Elementary School! Time to learn.", 'good');
    // Random Events for older ages
    else if (currentAge < 18) {
        const roll = Math.random();
        if (currentAge === 16) {
             addLog("Legal working age reached.", 'neutral');
        }
        else if (roll < 0.2) {
            const gift = Math.floor(Math.random() * 20) + 5;
            game.bank += gift;
            addLog(`Found $${gift} on the sidewalk!`, 'good');
        } else if (roll > 0.9) {
             addLog("Got the flu. Stayed home for a week.", 'bad');
        } else {
            addLog("Another year passes...");
        }
    } else {
        // Adult Events
        // If unemployed and not in school, maybe negative events?
        if (!game.jobTitle && !game.hasBusiness && !game.universityEnrolled && !game.gradSchoolEnrolled && currentAge >= 18) {
             addLog("Unemployed. Savings are dwindling.", 'bad');
        } else {
             addLog("Another year passes...");
        }
    }
    renderLifeDashboard();
    }

/**
 * add lifelog function
function addLog(msg, type='neutral') {
    const currentAge = window.gameState.user.age;
    let ageLog = window.gameState.lifeLog.find(l => l.age === currentAge);
    let color = 'text-slate-400';
    if (type === 'good') color = 'text-green-400';
    else if (type === 'bad') color = 'text-red-400';
    else if (type === 'major') color = 'text-yellow-400 font-bold';
    else if (type === 'green') color = 'text-green-400'; // Explicit green request
    
    if (game.lifeLog.length > 0 && game.lifeLog[0].age === currentAge) {
        game.lifeLog[0].events.push({ msg, color });
    } else {
        game.lifeLog.unshift({ age: game.age, events: [{ msg, color }] });
    }
}*/

//Define the rendering function globally so script.js can call it.
window.renderLifeDashboard = (maybeGameState) => {
    // --- Data Preparation ---
    const state = maybeGameState || window.gameState;
    if (!state || !state.user) {
        console.warn("renderLifeDashboard called before game state existed.");
        return;}
    //Update the Header Bar using the UI Manager
    //    We assume 'game' holds the key stats needed for the header.
    UI.updateHeader({
        name: state.user.username,
        age: state.user.age,
        bank: state.user.money
    });

    //Generate the Life Log HTML
    const logHtml = game.lifeLog.map(l => `
        <div class="mb-2 text-sm border-l-2 border-slate-700 pl-3 py-1">
            <span class="font-bold text-slate-500 text-xs">Age ${l.age}</span>
            <div class="mt-1 space-y-1">
                ${l.events.map(e => `<div class="${e.color}">${e.msg}</div>`).join('')}
            </div>
        </div>
    `).join('');

    //Define Action Variables
    const ageUpAction = ageUp();
    const ageUpText = "Age Up +";
    const ageUpColor = game.hasBusiness ? "btn-primary" : "btn-life";

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
                <button onclick="${ageUpAction}" class="${ageUpColor} text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <i class="fas fa-arrow-up mb-1 text-xl"></i>
                    <span class="text-[10px] uppercase tracking-wider">${ageUpText}</span>
                </button>
            </div>
        </div>
    `;
    
    //Use the UI Manager to inject the HTML into the game container
    UI.renderScreen(dashboardHTML);
}

function addLog(msg, type='neutral') {
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
