import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderActivities, GRAD_SCHOOLS } from '../career/occupationScreen.js';
import { renderRelationships } from '../relationships/relationshipScreen.js';
import { processNextFuneral } from '../relationships/funeralScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAssets } from '../assets/assetsScreen.js';
import { saveGame, resetGame, CAREER_TRACKS } from '../../core/main.js';
import { checkSchoolActionTaken } from '../education/manageEducationScreen.js';
import { checkActionTaken } from '../career/jobCareerManagerScreen.js';
import { autoProcessBusinessQuarter } from '../business/businessDashboard.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { renderAvatar } from '../../ui/avatarRenderer.js';
const get = id => document.getElementById(id);

// public/screens/mainScreen.js
//age up function
// mainScreen.js

export function ageUp() {
    const currentState = state.gameState;
    const user = currentState.user;
    
    // 1. Mortality Check
    const currentHealth = user.stats?.health ?? user.health ?? 100; 
    const deathCheck = GameLogic.checkMortality(user.age, currentHealth);
    
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
    handlePregnancy(user);
    handleAppearanceAging(user);

    // 4. Empty Year Validation (The Fix)
    const currentAgeLog = currentState.lifeLog.find(l => l.age === user.age);
    if (!currentAgeLog || currentAgeLog.events.length === 0) {
        addLog("You didn't do much all year.", 'neutral');
    }

    // 5. Cleanup & Render
    checkSchoolActionTaken(user);
    checkActionTaken();          
    
    // Instead of rendering dashboard directly, process funerals first
    processNextFuneral();
    
    if (typeof saveGame === "function") {
        saveGame();
    }
}

function handleDeath(user, cause) {
    user.lifeStatus = "Deceased";
    addLog(`You died at age ${user.age} from ${cause}`, 'bad');
    
    // Auto-save the death state before transitioning
    if (typeof saveGame === "function") {
        saveGame();
    }
    
    renderDeathScreen(user, cause);
}
//renders death screen
export async function renderDeathScreen(user, cause) {
    // 1. Calculate Inheritance
    const children = user.relationships.filter(r => r.type === 'Son' || r.type === 'Daughter');
    const spouse = user.relationships.find(r => r.category === 'spouse');
    const hasChildren = children.length > 0;
    const hasSpouse = !!spouse;

    // Liquidate assets into net worth before splitting (include company cash if applicable)
    const assetValue  = user.assets ? user.assets.reduce((sum, a) => sum + (a.value || 0), 0) : 0;
    const companyCash = (user.hasBusiness && user.compCash > 0) ? user.compCash : 0;
    const totalEstate = user.money + assetValue + companyCash;

    // A surviving spouse takes half the estate (or all of it, with no children); children split the remainder
    let spouseShare = 0;
    let remainingEstate = totalEstate;
    if (hasSpouse && totalEstate > 0) {
        spouseShare = hasChildren ? Math.floor(totalEstate * 0.5) : totalEstate;
        remainingEstate = totalEstate - spouseShare;
    }

    // Prevent debt from being inherited
    const inheritancePerChild = (hasChildren && remainingEstate > 0) ? Math.floor(remainingEstate / children.length) : 0;

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
        const shares = [];
        if (spouseShare > 0) shares.push(`<span class="text-green-400 font-bold">+$${spouseShare.toLocaleString()}</span> to your spouse, ${spouse.name}`);
        if (inheritancePerChild > 0) shares.push(`<span class="text-green-400 font-bold">+$${inheritancePerChild.toLocaleString()} each</span> to your ${children.length} children`);

        if (shares.length > 0) {
            estateMessage = `<p class="text-slate-300 text-sm mb-4">Your estate went ${shares.join(' and ')}.</p>`;
        } else {
            estateMessage = `<p class="text-slate-400 text-sm mb-4 italic">Having no heirs, your estate was surrendered to the government.</p>`;
        }
    }

    // 3. Build Child Selection UI
    let childrenOptionsHtml = '';
    if (hasChildren) {
        childrenOptionsHtml = children.map((child, index) => `
            <button data-action="continueAsChild" data-args="${index}, ${inheritancePerChild}" class="w-full btn-nav text-white font-bold py-3 rounded-xl mb-2 shadow hover:bg-slate-700 transition">
                Play as ${child.name} (Age ${child.age})
            </button>
        `).join('');
    }

    // 4. Render Terminal Screen with Loading State for Eulogy
    const deathHTML = `
        <div class="fade-in max-w-md mx-auto min-h-full py-8 flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-skull text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-4xl font-bold text-red-500 mb-2">You Died</h1>
            <p class="text-slate-300 text-lg mb-6">Age ${user.age} • Cause: ${cause}</p>
            
            <div id="eulogy-container" class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl min-h-[100px] flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-slate-400"></i>
            </div>
            
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-6 shadow-2xl">
                <h3 class="text-xl font-bold text-slate-400 mb-2 uppercase tracking-wider text-sm">Final Estate Value</h3>
                <p class="${moneyColorClass} text-3xl font-bold mb-4">${Utils ? Utils.formatMoney(totalEstate) : '$' + totalEstate.toLocaleString()}</p>
                ${estateMessage}
            </div>
            <div class="w-full space-y-3">
                ${childrenOptionsHtml}
                <button data-action="resetGame" class="w-full btn-primary text-white font-bold py-4 rounded-xl text-lg mt-4 shadow-lg">
                    Start New Life
                </button>
            </div>
        </div>
    `;
    
    UI.renderScreen(deathHTML);

    // 5. Fetch the Eulogy in the background
    try {
        const compressedLog = GameLogic.compressLifeLog(state.gameState.lifeLog);
        
        const response = await fetch('/api/generateEulogy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compressedLog, username: user.username })
        });

        if (response.ok) {
            const data = await response.json();
            const eulogyContainer = document.getElementById('eulogy-container');
            
            // Remove centering classes so paragraph flows naturally
            eulogyContainer.classList.remove('flex', 'items-center', 'justify-center');
            
            eulogyContainer.innerHTML = `
                <h3 class="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider text-left">Life Summary</h3>
                <div class="relative w-full">
                    <p id="eulogy-text" class="text-slate-300 italic text-sm text-left leading-relaxed line-clamp-5 overflow-hidden">"${data.eulogy}"</p>
                    <button id="eulogy-view-more" data-action="showFullEulogy" class="hidden mt-3 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider text-left w-full">View More &rarr;</button>
                </div>
            `;
            
            state.gameState.currentEulogy = data.eulogy;
            
            setTimeout(() => {
                const p = document.getElementById('eulogy-text');
                const btn = document.getElementById('eulogy-view-more');
                if (p && btn && p.scrollHeight > p.clientHeight) {
                    btn.classList.remove('hidden');
                }
            }, 50);

        } else {
            document.getElementById('eulogy-container').style.display = 'none';
        }
    } catch (e) {
        console.error("Failed to fetch eulogy", e);
        document.getElementById('eulogy-container').style.display = 'none';
    }
}

export function showFullEulogy() {
    if (state.gameState.currentEulogy) {
        UI.showModal("Life Summary", `<p class="text-slate-300 italic text-sm leading-relaxed">"${state.gameState.currentEulogy}"</p>`);
    }
}
//allows user to continue as their child, implements
export const continueAsChild = (childIndex, inheritedMoney) => {
    const parentState = state.gameState.user;
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
        relationships: [], // Legacy relationships are purged to prevent cyclical graphing
        appearance: AvatarLogic.ensureAppearance(selectedChild),
        avatarVersion: selectedChild.avatarVersion || 0
    };

    // Calculate initial life status
    newUserState.lifeStatus = GameLogic.checkLifeStatus(newUserState);

    // 2. Overwrite Single Source of Truth
    state.gameState.user = newUserState;
    
    // 3. Purge and restart Life Log at child's chronological age
    state.gameState.lifeLog = [{
        age: newUserState.age,
        events: [
            { msg: `You took over the life of ${newUserState.username} following your parent's death.`, color: "text-blue-400 font-bold" },
            { msg: `Inherited $${inheritedMoney.toLocaleString()} from the estate.`, color: "text-green-400" }
        ]
    }];

    // 4. Force cloud sync of the new character state, then mount UI
    if (typeof saveGame === "function") saveGame();
    renderLifeDashboard(state.gameState);
};

function handleHealth(user) {
    if (typeof user.health !== 'number') user.health = 100;
    
    // Call the pure function
    const decay = GameLogic.calculateHealthDecay(user.age);
    const benefits = GameLogic.calculateHealthBenefits(user.gymMembership, user.hasBetterDiet);

    // Mutate state with a hard floor of 0 and cap of 100
    user.health = Math.min(100, Math.max(0, user.health - decay + benefits));

    // Execute UI side-effects
    if (user.health < 30 && (user.health + decay - benefits) >= 30) {
        addLog("Your health has reached a critical low. Your risk of death is severely elevated.", "major");
    }
}

// sub systems that ageup calls
function handleFinances(user) {
    // 1. Birthday Money (Kids only)
    if (user.age >= 5 && user.age <= 18) {
        const bdayMoney = GameLogic.calculateBirthdayMoney();
        user.money += bdayMoney;
        addLog(`You received ${Utils.formatMoney(bdayMoney)} for your birthday!`, 'good');
    }

    // 2. Job Salary + annual adjustments
    if (user.jobTitle) {
        user.money += user.jobSalary;
        if (user.hasSeenJobSalary) {
            addLog(`Earned ${Utils.formatMoney(user.jobSalary)} as a ${user.jobTitle}.`, 'good');
        }

        // Annual cost-of-living raise (~2%, silent)
        user.jobSalary += Math.max(500, Math.floor(user.jobSalary * 0.02));

        if (user.careerTrack) {
            // ── Career-track: promotion / demotion system ──────────────────
            user.yearsInRole = (user.yearsInRole || 0) + 1;
            const track = CAREER_TRACKS.find(t => t.key === user.careerTrack);
            const lvlIdx   = user.careerLevel || 0;
            const level    = track?.levels[lvlIdx];
            const nextLevel = track?.levels[lvlIdx + 1];

            if (track && level) {
                if (user.jobPerformance <= 20) {
                    // Poor performance
                    user.consecutivePoorYears = (user.consecutivePoorYears || 0) + 1;
                    if (user.consecutivePoorYears >= 2) {
                        if (lvlIdx > 0) {
                            user.careerLevel--;
                            const demoted = track.levels[user.careerLevel];
                            user.jobTitle  = demoted.title;
                            user.jobSalary = demoted.salary;
                            user.consecutivePoorYears = 0;
                            user.yearsInRole = 0;
                            addLog(`Demoted to ${demoted.title} due to sustained poor performance. New salary: ${Utils.formatMoney(user.jobSalary)}/yr.`, 'bad');
                        } else {
                            addLog(`Terminated from ${user.jobTitle} due to sustained poor performance.`, 'bad');
                            user.jobTitle = null; user.jobSalary = 0; user.jobPerformance = 50;
                            user.careerTrack = null; user.careerLevel = 0; user.yearsInRole = 0;
                            user.consecutivePoorYears = 0; user.careerActionTaken = false; user.hasSeenJobSalary = false;
                        }
                    } else {
                        addLog('Your employer issued a formal warning about your performance.', 'bad');
                    }
                } else {
                    user.consecutivePoorYears = 0;
                    let promoted = false;

                    // Promotion check
                    if (nextLevel && level.minYears !== null && user.yearsInRole >= level.minYears && user.jobPerformance >= 75) {
                        const promoChance = user.jobPerformance >= 95 ? 0.80 : user.jobPerformance >= 85 ? 0.50 : 0.25;
                        if (Math.random() < promoChance) {
                            user.careerLevel++;
                            user.jobTitle  = nextLevel.title;
                            user.jobSalary = Math.max(user.jobSalary, nextLevel.salary);
                            user.yearsInRole = 0;
                            user.jobPerformance = 60;
                            addLog(`Promoted to ${nextLevel.title}! New salary: ${Utils.formatMoney(user.jobSalary)}/yr.`, 'major');
                            promoted = true;
                        }
                    }

                    // Performance raise if not promoted
                    if (!promoted && user.jobPerformance >= 80) {
                        const perfBonus = Math.floor(user.jobSalary * 0.05);
                        user.jobSalary += perfBonus;
                        addLog(`Outstanding performance! Your salary increased to ${Utils.formatMoney(user.jobSalary)}/yr.`, 'good');
                    }
                }
            }
        } else {
            // ── Part-time / legacy flat job ────────────────────────────────
            if (user.jobPerformance >= 80) {
                const perfBonus = Math.floor(user.jobSalary * 0.05);
                user.jobSalary += perfBonus;
                addLog(`Outstanding performance! Your salary increased to ${Utils.formatMoney(user.jobSalary)}/yr.`, 'good');
            } else if (user.jobPerformance <= 20 && Math.random() < 0.4) {
                addLog(`Your employer let you go from ${user.jobTitle} due to poor performance.`, 'bad');
                user.jobTitle = null; user.jobSalary = 0; user.jobPerformance = 50;
                user.careerActionTaken = false; user.hasSeenJobSalary = false;
            }
        }
    }

    // 3. Living Expenses
    const annualLivingExpense = GameLogic.addLivingExpenses(user.age, user.isStudent, user.city);
    if (annualLivingExpense > 0) {
        user.monthlyLivingExpense = annualLivingExpense;
        user.money -= annualLivingExpense;

        if (!user.hasSeenExpenseMsg) {
            addLog(`Your basic living expenses in ${user.city} are ${Utils.formatMoney(Math.round(annualLivingExpense / 12))}/month.`, 'neutral');
            user.hasSeenExpenseMsg = true;
        }
    }

    // 4. Student Loans
    const yearlyStudentLoanPayment = GameLogic.addStudentLoanPayment(user.age, user.studentLoans, user.isStudent); 
    user.monthlyOutflow += yearlyStudentLoanPayment;
    user.studentLoans -= yearlyStudentLoanPayment;

    // 5. Active Health Costs
    const healthCosts = GameLogic.calculateActiveHealthCosts(user.gymMembership, user.hasBetterDiet);
    if (healthCosts > 0) {
        user.money -= healthCosts;
    }

    // 6. Business auto-quarter (runs silently each age-up)
    if (user.hasBusiness) {
        autoProcessBusinessQuarter(user);
    }
}

export function refreshClassmates(user) {
    if (!user.relationships) user.relationships = [];
    
    user.relationships.forEach(r => {
        if (r.isCurrentClassmate) r.isCurrentClassmate = false;
    });

    // Clear old classmates/teachers (non-friends)
    user.relationships = user.relationships.filter(r => r.category !== 'classmate');
    // Generate new cohort
    const cohort = GameLogic.generateSchoolCohort(user.age);
    user.relationships.push(...cohort);
}

function handleEducation(user) {
    // 1. High School Logic
    if (user.age === 18 || (user.age === 19 && user.highSchoolRetained)) {
        if (user.schoolPerformance > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            user.highSchoolRetained = false;
            user.isStudent = false;
            // Clear classmates on graduation
            user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
            user.relationships = user.relationships.filter(r => r.category !== 'classmate');
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
        if (user.schoolPerformance < 25) {
            addLog(`You failed your University classes this year. You must retake the year.`, 'bad');
        } else {
            user.universitySchoolYear++;
            if (GameLogic.checkSchoolGraduated(user.universitySchoolYear, 4)) {
                user.universityEnrolled = false;
                user.isStudent = false;
                user.universityGraduated = true;
                // Clear classmates on graduation
                user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
                user.relationships = user.relationships.filter(r => r.category !== 'classmate');
                addLog(`You finished University with a degree in ${user.major}.`, 'good');
            } else {
                addLog(`Completed year ${user.universitySchoolYear} of University.`, 'neutral');
            }
        }
    }

    // 3. Grad School Logic
    if (user.gradSchoolEnrolled) {
        if (user.schoolPerformance < 25) {
            addLog(`You failed your Grad School classes this year. You must retake the year.`, 'bad');
        } else {
            user.gradSchoolYear++;
            const school = GRAD_SCHOOLS.find(s => s.name === user.gradSchoolType);
            if (GameLogic.checkSchoolGraduated(user.gradSchoolYear, school.years)) {
                user.gradSchoolEnrolled = false;
                user.isStudent = false;
                user.gradSchoolDegree = user.gradSchoolType;
                // Clear classmates on graduation
                user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
                user.relationships = user.relationships.filter(r => r.category !== 'classmate');
                addLog(`Graduated from ${user.gradSchoolType}!`, 'good');
            } else {
                addLog(`Completed year ${user.gradSchoolYear} of ${user.gradSchoolType}.`, 'neutral');
            }
        }
    }

    // 4. Transitions
    if (user.age === 12) {
        addLog("Started Middle School.", 'good');
        refreshClassmates(user);
    }
    if (user.age === 14) {
        addLog("Started High School.", 'good');
        refreshClassmates(user);
    }
}

function handleMarket(user) {
    const marketForce = GameLogic.simulateVehicleMarket();
    GameLogic.updateOwnedVehicles(user, marketForce);
    
    if (marketForce > 0.06 && user.age > 15) {
        addLog("Inflation hits the auto market! Car prices are up.", "bad");
    } else if (marketForce < -0.06 && user.age > 15) {
        addLog("Auto market crash! Vehicle prices are down.", "good");
    }
}

function handleLifeEvents(user) {
    // Baby Events
    if (user.age === 1) addLog("You've discovered building blocks.", 'good');
    else if (user.age === 2) addLog("You learned to walk.", 'good');
    else if (user.age === 3) addLog("You drew on the walls.", 'good');
    else if (user.age === 5) {
        addLog("Started Elementary School!", 'good');
        refreshClassmates(user);
    }
    
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
    
    if (!state.gameState.pendingFunerals) {
        state.gameState.pendingFunerals = [];
    }
    
    // Iterate backwards so we can splice safely
    for (let i = user.relationships.length - 1; i >= 0; i--) {
        const rel = user.relationships[i];
        rel.age++;
        
        // Check Mortality
        const deathCheck = GameLogic.checkMortality(rel.age, rel.health ?? 100);
        if (deathCheck.isDead) {
            rel.deathCause = deathCheck.cause;
            state.gameState.pendingFunerals.push(rel);
            
            // Remove them from active relationships immediately
            user.relationships.splice(i, 1);
            continue; // Skip the rest of the updates for this person
        }
        
        // Passive relationship decay
        const previousStatus = rel.status || 0;
        rel.status = GameLogic.calculateRelationshipDecay(previousStatus, rel.interactedThisYear, rel.category, user.age);
        
        // Category shift logic
        const newCategory = GameLogic.checkRelationshipCategoryShift(rel.category, rel.status);
        if (newCategory) {
            if (newCategory === 'enemy') {
                addLog(`${rel.name} is now your Enemy due to neglect!`, 'bad');
                rel.type = 'Enemy';
            } else if (newCategory === 'friend') {
                addLog(`You made amends with ${rel.name}. They are now a Friend.`, 'good');
                rel.type = 'Friend';
            }
            rel.category = newCategory;
        }
        
        // Reset interaction flag for next year
        rel.interactedThisYear = false;
    }
    
    // Reset global interaction flags
    user.hasSpentTimeWithAll = false;
    user.hasMetSomeoneThisYear = false;
}

function handlePregnancy(user) {
    if (!user.isExpecting) return;

    const isMale = Math.random() < 0.5;
    const lastName = GameLogic.getLastName(user.username);
    const firstName = GameLogic.getRandomFirstName(isMale ? 'male' : 'female');

    const childId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const child = {
        id: childId,
        name: `${firstName} ${lastName}`,
        age: 0,
        type: isMale ? 'Son' : 'Daughter',
        gender: isMale ? 'male' : 'female',
        status: 100,
        category: 'child',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(childId)
    };

    if (!user.relationships) user.relationships = [];
    user.relationships.push(child);
    addLog(`You had a baby ${isMale ? 'boy' : 'girl'}! Welcome, ${child.name}.`, 'good');

    user.isExpecting = false;
    user.expectingWithId = null;
}

// Bumps the avatar cache version for the player and every relationship once
// per in-game year so avatarRenderer.js recomputes aged hair color/wrinkle
// opacity, rather than re-deriving them on every single UI render.
function handleAppearanceAging(user) {
    user.avatarVersion = (user.avatarVersion || 0) + 1;
    (user.relationships || []).forEach(rel => {
        rel.avatarVersion = (rel.avatarVersion || 0) + 1;
    });
}

//Define the rendering function globally so script.js can call it.
export function renderLifeDashboard(maybeGameState) {
    // --- Data Preparation ---
    const currentState = maybeGameState || state.gameState;
    if (!state || !currentState.user) {
        console.warn("renderLifeDashboard called before game state existed.");
        return;}
    const user = currentState.user;
    //Update the Header Bar using the UI Manager
    //    We assume 'game' holds the key stats needed for the header.
    UI.updateHeader(user);
    if (user.username) get('avatar-container').innerHTML = renderAvatar(user);
// Generate the Life Log HTML 
    const logHtml = currentState.lifeLog.map(l => `
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
                
                <button data-action="renderAssets" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-home mb-1 text-xl text-yellow-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Assets</span>
                </button>
                
                <button data-action="renderActivities" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-user-graduate mb-1 text-xl text-blue-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Work</span>
                </button>
                
                <button data-action="ageUp" class="btn-primary text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <i class="fas fa-arrow-up mb-1 text-xl"></i>
                    <span class="text-[10px] uppercase tracking-wider">${ageUpText}</span>
                </button>

                <button data-action="renderRelationships" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-users mb-1 text-xl text-pink-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">Social</span>
                </button>

                <button data-action="renderMoreDashboard" class="btn-nav text-slate-200 font-bold rounded-xl shadow-lg flex flex-col items-center justify-center hover:bg-slate-700">
                    <i class="fas fa-ellipsis-h mb-1 text-xl text-slate-400"></i>
                    <span class="text-[10px] uppercase tracking-wider">More</span>
                </button>

            </div>
        </div>
    `;
    
    //Use the UI Manager to inject the HTML into the game container
    UI.renderScreen(dashboardHTML);
}

export function addLog(msg, type = 'neutral') {
    // 1. Get current age from the centralized state
    const currentAge = state.gameState.user.age;
    //color for the log
    let color = 'text-slate-400';
    if (type === 'good') color = 'text-green-400';
    else if (type === 'bad') color = 'text-red-400';
    else if (type === 'major') color = 'text-yellow-400 font-bold';
    else if (type === 'green') color = 'text-green-400';
    //is there a log for this age?
    let ageLog = state.gameState.lifeLog.find(l => l.age === currentAge);
    if (ageLog) {
        ageLog.events.push({ msg, color });
    } else {
        state.gameState.lifeLog.unshift({ 
            age: currentAge, 
            events: [{ msg, color }] 
        });
    }
};
