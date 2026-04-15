// public/screens/mainScreen.js
//age up function
// mainScreen.js

function ageUp() {
    const state = window.gameState;
    const user = state.user;
    
    // 1. Mortality Check
    const currentHealth = user.stats?.health ?? user.health ?? 100; 
    const deathCheck = window.GameLogic.checkMortality(user.age, currentHealth);
    
    if (deathCheck.isDead) {
        handleDeath(user, deathCheck.cause);
        return; 
    }

    // 2. The Core Update
    user.age++;

    // 3. Run The Sub-Systems
    handleHealth(user);
    handleFinances(user);
    handleEducation(user);
    handleMarket(user);
    handleLifeEvents(user);
    handleRelationships(user); 

    // 4. Empty Year Validation (The Fix)
    const currentAgeLog = state.lifeLog.find(l => l.age === user.age);
    if (!currentAgeLog || currentAgeLog.events.length === 0) {
        window.addLog("You didn't do much all year.", 'neutral');
    }

    // 5. Cleanup & Render
    checkSchoolActionTaken(user);
    checkActionTaken();          
    
    window.renderLifeDashboard(state);
    
    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
}

function handleDeath(user, cause) {
    user.lifeStatus = "Deceased";
    window.addLog(`You died at age ${user.age} from ${cause}`, 'bad');
    
    // Auto-save the death state before transitioning
    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
    
    renderDeathScreen(user, cause);
}
//renders death screen
window.renderDeathScreen = async function(user, cause) {
    // 1. Calculate Inheritance
    const children = user.relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const hasChildren = children.length > 0;
    
    // Liquidate assets into net worth before splitting
    const assetValue = user.assets ? user.assets.reduce((sum, a) => sum + (a.value || 0), 0) : 0;
    const totalEstate = user.money + assetValue;
    
    // Prevent debt from being inherited
    const inheritancePerChild = (hasChildren && totalEstate > 0) ? Math.floor(totalEstate / children.length) : 0;

    // 2. Build Estate Messaging
    let estateMessage = '';
    const moneyColorClass = totalEstate >= 0 ? 'text-green-400' : 'text-red-500';

    if (totalEstate < 0) {
        if (hasChildren) {
            estateMessage = `<p class="text-slate-300 text-sm mb-4">You died in debt. Creditors seized the estate, leaving your ${children.length} children with nothing.</p>`;
        } else {
            estateMessage = `<p class="text-slate-400 text-sm mb-4 italic">You died in debt. Your creditors absorbed the loss.</p>`;
        }
    } else {
        if (hasChildren) {
            estateMessage = `<p class="text-slate-300 text-sm mb-4">Wealth split evenly among ${children.length} children<br><span class="text-green-400 font-bold">+$${inheritancePerChild.toLocaleString()} each</span></p>`;
        } else {
            estateMessage = `<p class="text-slate-400 text-sm mb-4 italic">Having no heirs, your estate was surrendered to the government.</p>`;
        }
    }

    // 3. Build Child Selection UI
    let childrenOptionsHtml = '';
    if (hasChildren) {
        childrenOptionsHtml = children.map((child, index) => `
            <button onclick="continueAsChild(${index}, ${inheritancePerChild})" class="w-full btn-nav text-white font-bold py-3 rounded-xl mb-2 shadow hover:bg-slate-700 transition">
                Play as ${child.name} (Age ${child.age})
            </button>
        `).join('');
    }

    // 4. Render Terminal Screen with Loading State for Eulogy
    const deathHTML = `
        <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-skull text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-4xl font-bold text-red-500 mb-2">You Died</h1>
            <p class="text-slate-300 text-lg mb-6">Age ${user.age} • Cause: ${cause}</p>
            
            <div id="eulogy-container" class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl min-h-[100px] flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-slate-400"></i>
            </div>
            
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl">
                <h3 class="text-xl font-bold text-slate-400 mb-2 uppercase tracking-wider text-sm">Final Estate Value</h3>
                <p class="${moneyColorClass} text-3xl font-bold mb-4">${window.Utils ? window.Utils.formatMoney(totalEstate) : '$' + totalEstate.toLocaleString()}</p>
                ${estateMessage}
            </div>
            <div class="w-full space-y-3">
                ${childrenOptionsHtml}
                <button onclick="window.resetGame()" class="w-full btn-primary text-white font-bold py-4 rounded-xl text-lg mt-4 shadow-lg">
                    Start New Life
                </button>
            </div>
        </div>
    `;
    
    window.UI.renderScreen(deathHTML);

    // 5. Fetch the Eulogy in the background
    try {
        const compressedLog = window.GameLogic.compressLifeLog(window.gameState.lifeLog);
        
        const response = await fetch('/api/generateEulogy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compressedLog, username: user.username })
        });

        if (response.ok) {
            const data = await response.json();
            const eulogyContainer = document.getElementById('eulogy-container');
            
            // Remove centering classes so paragraph flows naturally
            eulogyContainer.classList.remove('items-center', 'justify-center');
            
            eulogyContainer.innerHTML = `
                <h3 class="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider text-left">Life Summary</h3>
                <p class="text-slate-300 italic text-sm text-left leading-relaxed">"${data.eulogy}"</p>
            `;
        } else {
            document.getElementById('eulogy-container').style.display = 'none';
        }
    } catch (e) {
        console.error("Failed to fetch eulogy", e);
        document.getElementById('eulogy-container').style.display = 'none';
    }
}
//allows user to continue as their child, implements
window.continueAsChild = (childIndex, inheritedMoney) => {
    const parentState = window.gameState.user;
    const children = parentState.relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const selectedChild = children[childIndex];

    // 1. Deep wipe and reconstruct user state
    const newUserState = {
        username: selectedChild.name,
        gender: selectedChild.type === 'Son' ? 'male' : 'female',
        city: parentState.city, // Inherits physical location
        age: selectedChild.age,
        money: inheritedMoney,
        health: 100,
        
        // Reset dynamic flags
        isStudent: selectedChild.age >= 5 && selectedChild.age <= 18,
        universityEnrolled: false,
        universitySchoolYear: 0,
        universityGraduated: false,
        major: '',
        jobTitle: '',
        jobSalary: 0,
        jobPerformance: 50,
        hasBusiness: false,
        assets: [], 
        relationships: [] // Legacy relationships are purged to prevent cyclical graphing
    };

    // Calculate initial life status
    newUserState.lifeStatus = window.GameLogic.checkLifeStatus(newUserState);

    // 2. Overwrite Single Source of Truth
    window.gameState.user = newUserState;
    
    // 3. Purge and restart Life Log at child's chronological age
    window.gameState.lifeLog = [{
        age: newUserState.age,
        events: [
            { msg: `You took over the life of ${newUserState.username} following your parent's death.`, color: "text-blue-400 font-bold" },
            { msg: `Inherited $${inheritedMoney.toLocaleString()} from the estate.`, color: "text-green-400" }
        ]
    }];

    // 4. Force cloud sync of the new character state, then mount UI
    if (typeof window.saveGame === "function") window.saveGame();
    window.renderLifeDashboard(window.gameState);
};

function handleHealth(user) {
    if (typeof user.health !== 'number') user.health = 100;
    
    // Call the pure function
    const decay = window.GameLogic.calculateHealthDecay(user.age);

    // Mutate state with a hard floor of 0
    user.health = Math.max(0, user.health - decay);

    // Execute UI side-effects
    if (user.health < 30 && (user.health + decay) >= 30) {
        window.addLog("Your health has reached a critical low. Your risk of death is severely elevated.", "major");
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
        } else {
            addLog(`Completed year ${user.universitySchoolYear} of University.`, 'neutral');
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
        if (user.age === 15) addLog("Legal working age reached.", 'neutral');
        
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
    else if (!user.highSchoolRetained && !user.jobTitle && !user.hasBusiness && !user.universityEnrolled && user.age >= 18 && user.age < 65) {
         addLog("Unemployed. Savings are dwindling.", 'bad');
    }
}

function handleRelationships(user) {
    // Guard clause prevents crashes if the array is missing or malformed
    if (!user.relationships || !Array.isArray(user.relationships)) return;
    
    user.relationships.forEach(rel => {
        rel.age++;
        // Note: Future relationship logic (e.g., passive relationship decay, 
        // relatives passing away from old age) should be added inside this loop.
    });
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
// Generate the Life Log HTML 
    const logHtml = state.lifeLog.map(l => `
        <div class="mb-5 group">
            <div class="flex items-center mb-2">
                <div class="bg-slate-800 text-blue-100 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-slate-600 shadow-sm z-10">
                    Age ${l.age}
                </div>
                <div class="h-px bg-gradient-to-r from-slate-700 to-transparent flex-grow ml-2"></div>
            </div>

            <div class="pl-4 border-l border-slate-700/50 ml-4 space-y-2 pb-1">
                ${l.events.map(e => `
                    <div class="${e.color} text-sm py-0.5 transition-transform duration-200 hover:translate-x-1">
                        ${e.msg}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    //Define Action Variables
    const ageUpText = "Age Up +";

    //Define the Final HTML String
    //Define the Final HTML String
    const dashboardHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="flex-1 overflow-y-auto mb-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 class="font-bold text-slate-300 mb-4 sticky top-0 bg-transparent backdrop-blur-md py-1 border-b border-slate-700/50">Life History</h3>
                <div class="space-y-2">
                    ${logHtml.length > 0 ? logHtml : '<div class="text-slate-600 text-sm italic">Life has just begun...</div>'}
                </div>
            </div>
            
            <div class="grid grid-cols-5 gap-2 pt-2 h-20">
                
                <button onclick="renderAssets()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-home mb-1 text-xl text-yellow-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Assets</span>
                </button>
                
                <button onclick="renderActivities()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-user-graduate mb-1 text-xl text-blue-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Work</span>
                </button>
                
                <button onclick="ageUp()" class="btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <i class="fas fa-arrow-up mb-1 text-xl"></i>
                    <span class="text-[10px] uppercase tracking-wider">${ageUpText}</span>
                </button>

                <button onclick="renderRelationships()" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-users mb-1 text-xl text-pink-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Social</span>
                </button>

                <button onclick="window.UI.showModal('Coming Soon', 'This section is under construction.')" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-ellipsis-h mb-1 text-xl text-slate-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">More</span>
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
