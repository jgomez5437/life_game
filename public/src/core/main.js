import { login, configureAuth } from '../auth/auth.js';
import { startGuestMode, renderLoginScreen } from '../auth/loginScreen.js';
import { processQuarter, enterBusinessMode } from '../features/business/businessDashboard.js';
import { selectIndustry, renderBusinessSetup } from '../features/business/createBusinessScreen.js';
import { renderCareerMarket, applyForJob } from '../features/career/careerJobsScreen.js';
import { confirmQuitCareer, quitCareer, renderCareerManager, workHarderJob, slackOffJob } from '../features/career/jobCareerManagerScreen.js';
import { renderJobMarket } from '../features/career/partTimeJobsScreen.js';
import { renderEducation, workHarder, skipSchool } from '../features/education/manageEducationScreen.js';
import { attemptEnrollment, openGradEnrollmentModal, attemptGradEnrollment, renderGradSchoolMarket, openUniversityModal } from '../features/career/occupationScreen.js';
import { selectGender, submitCharacter, renderCharCreation } from '../features/player/charCreationScreen.js';
import { ageUp, continueAsChild, renderLifeDashboard, addLog, renderDeathScreen, showFullEulogy } from '../features/player/mainScreen.js';
import { state } from './state.js';
import { renderAssets, renderVehicleManager, repairVehicle, sellVehicle } from '../features/assets/assetsScreen.js';
import { renderShoppingHub, renderVehicleDealer, buyVehicle } from '../features/assets/goShoppingScreen.js';
import { renderActivities } from '../features/career/occupationScreen.js';
import { renderRelationships, renderPersonInteraction, openRelationshipConfirm, spendTimeWithAll } from '../features/relationships/relationshipScreen.js';
import { chooseFuneralType, cancelFuneralPlan, confirmFuneralPlan, donateBody, lookTheOtherWay, goToFuneral, skipFuneral } from '../features/relationships/funeralScreen.js';
import { renderMoreDashboard, buyGymMembership, cancelGymMembership, visitGymOneTime, startBetterDiet, cancelBetterDiet, visitDoctor, openBlackjackBetting, startBlackjackGame, blackjackHit, blackjackStand, openTravelModal, bookTrip } from '../features/more/moreScreen.js';
import { Utils } from '../ui/utils.js';
import { UI } from '../ui/ui.js';

const get = id => document.getElementById(id);
// --- CONSTANTS ---

        export const MAJORS = [
            "Psychology", "Computer Science", "English", "Education", "Marketing", 
            "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
            "Political Science", "Criminal Justice"
        ];

        export const CAREERS = [
            { title: "Jr. Associate", salary: 70000, icon: "fa-briefcase", reqDegree: true, reqGrad: "Law School" },
            { title: "Firefighter", salary: 57000, icon: "fa-fire-extinguisher", reqDegree: false, reqLaw: false },
            { title: "Graphic Designer", salary: 55000, icon: "fa-pen-nib", reqDegree: true, reqLaw: false }, 
            { title: "Resident Doctor", salary: 65000, icon: "fa-user-md", reqDegree: true, reqGrad: "Medical School" },
            { title: "Psychiatry Resident", salary: 65000, icon: "fa-brain", reqDegree: true, reqGrad: "Psychiatry School" },
            { title: "Police Officer", salary: 55000, icon: "fa-user-shield", reqDegree: false, reqLaw: false },
            { title: "Jr. Software Developer", salary: 50000, icon: "fa-code", reqDegree: true, reqLaw: false }, 
            { title: "Banker", salary: 40000, icon: "fa-money-check-dollar", reqDegree: true, reqLaw: false }, 
            { title: "Jr. Business Analyst", salary: 65000, icon: "fa-chart-line", reqDegree: true, reqGrad: "Business School" },
            { title: "Apprentice Plumber", salary: 40000, icon: "fa-wrench", reqDegree: false, reqLaw: false },
            { title: "Baker", salary: 35000, icon: "fa-bread-slice", reqDegree: false, reqLaw: false }
        ];

        export const PART_TIME_JOBS = [
            { title: "Babysitter", hourly: 15, salary: 15600, icon: "fa-baby-carriage" },
            { title: "Amusement Park Crew", hourly: 12, salary: 12480, icon: "fa-ticket-alt" },
            { title: "Movie Theater Crew", hourly: 11, salary: 11440, icon: "fa-film" },
            { title: "Dog Walker", hourly: 10, salary: 10400, icon: "fa-dog" },
            { title: "Fast Food Crew", hourly: 10, salary: 10400, icon: "fa-hamburger" }
        ];

        export const INDUSTRIES = {
            tech: { 
                name: "Software Startup", 
                icon: "fa-laptop-code", 
                description: "High tech, high risk, potential for massive scale.",
                baseDemand: 2500, 
                unitPrice: 50, 
                unitCost: 5, 
                baseSalary: 6000, 
                volatility: 0.4,
                startupCost: 150000 
            },
            retail: { 
                name: "Fashion Brand", 
                icon: "fa-tshirt", 
                description: "Steady demand, brand loyalty is key.",
                baseDemand: 5000, 
                unitPrice: 40, 
                unitCost: 15, 
                baseSalary: 2500, 
                volatility: 0.2,
                startupCost: 75000
            },
            auto: { 
                name: "Auto Manufacturer", 
                icon: "fa-car", 
                description: "Capital intensive, low margin, high volume.",
                baseDemand: 800, 
                unitPrice: 25000, 
                unitCost: 18000, 
                baseSalary: 3500, 
                volatility: 0.1,
                startupCost: 1000000
            }
        };

        export const SUPPLIERS = [
            { id: 'cheap', name: 'Budget', costMod: 0.8, quality: 30, risk: 0.2 },
            { id: 'standard', name: 'Standard', costMod: 1.0, quality: 60, risk: 0.05 },
            { id: 'premium', name: 'Premium', costMod: 1.4, quality: 95, risk: 0.01 }
        ];

// public/script.js
state.gameState = null;
const API_URL = '/api'
//updates game info
export function updateGameInfo(dbUser) {
    console.log("Updating game state from DB...");
    const data = dbUser.game_data;
    const savedUser = data.user || data; 
    //Set Global Auth Variables
    state.userAuthId = dbUser.auth0_id;
    state.userEmail = dbUser.email;

    const rawHistory = data.history || [];
    
    const cleanHistory = rawHistory.map(entry => {
        if (typeof entry === 'object' && entry.events) {
            return entry;
        }
        return {
            age: savedUser.age || 0,
            events: [{ msg: entry, color: "text-gray-400" }]
        };
    });
    //CONSTRUCT state.gameState
    state.gameState = {
        user: {
            // --- IDENTITY ---
            username: savedUser.username || savedUser.name || "Player",
            gender: savedUser.gender || "male",
            city: savedUser.city || "New York",
            
            // --- CORE STATS ---
            age: data.stats?.age || savedUser.age || 0,
            health: data.stats?.health || savedUser.health || 100,
            money: data.money || savedUser.money || 0,
            lifeStatus: savedUser.lifeStatus || "Baby",
            isDead: savedUser.isDead || false,

            // --- EDUCATION (Undergrad) ---
            isStudent: savedUser.isStudent || false,
            universityEnrolled: savedUser.universityEnrolled || false,
            universitySchoolYear: savedUser.universitySchoolYear || 0,
            universityGraduated: savedUser.universityGraduated || false,
            major: savedUser.major || '',
            schoolActions: savedUser.schoolActions || 0,
            schoolPerformance: savedUser.schoolPerformance || 50,
            highSchoolRetained: savedUser.highSchoolRetained || false,
            
            // --- EDUCATION (Grad School) ---
            gradSchoolEnrolled: savedUser.gradSchoolEnrolled || false,
            gradSchoolType: savedUser.gradSchoolType || null,
            gradSchoolYear: savedUser.gradSchoolYear || 0,
            gradSchoolDegree: savedUser.gradSchoolDegree || null,
            parentsTried: savedUser.parents_tried || false,
            schoolActions: savedUser.schoolActions || 0,

            // --- CAREER & FINANCE ---
            jobTitle: savedUser.jobTitle || (data.job ? data.job.title : ""),
            jobSalary: savedUser.jobSalary || (data.job ? data.job.salary : 0),
            jobPerformance: savedUser.jobPerformance || 50,
            careerActionTaken: savedUser.careerActionTaken || 0,
            monthlyOutflow: savedUser.monthlyOutflow || 0,
            studentLoans: savedUser.studentLoans || 0,
            monthlyLivingExpense: savedUser.monthlyLivingExpense || 0,
            
            // --- BUSINESS ---
            hasBusiness: savedUser.hasBusiness || false,
            companyName: savedUser.companyName || null,
            ceoSalary: savedUser.ceoSalary || 0,

            // --- FLAGS ---
            hasSeenExpenseMsg: savedUser.hasSeenExpenseMsg || false,
            hasSeenJobSalary: savedUser.hasSeenJobSalary || false,
            gymMembership: savedUser.gymMembership || false,
            hasBetterDiet: savedUser.hasBetterDiet || false,

            // --- ASSETS ---
            assets: savedUser.assets || [],

            // --- RELATIONSHIPS ---
            relationships: savedUser.relationships || []
        },
        
        // --- ASSETS & HISTORY ---
        lifeLog: cleanHistory
    };
    // 5. Render
   if (state.gameState.user.lifeStatus === "Deceased") {
        console.log("Dead character detected. Locking to death screen.");
        const cause = state.gameState.user.deathCause || "natural causes";
        if (typeof renderDeathScreen === "function") {
            renderDeathScreen(state.gameState.user, cause);
        }
    } else if (typeof renderLifeDashboard === "function") {
        renderLifeDashboard(); 
    } else {
        console.error("❌ renderLifeDashboard function not found!");
    }

    console.log("✅ Game Loaded & Ready");
};
//Loads and renders the game
export const loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username);

    // Initialize the Single Source of Truth
    state.gameState = {
        user: {
            ...userData,
            money: userData.money || 0,
            age: userData.age || 0,
            health: userData.health || 100,
            gender: userData.gender || 'male',
            city: userData.city || "New York",
            isDead: userData.is_dead || false,
            //education
            isStudent: userData.is_student || false,
            universityEnrolled: userData.university_enrolled || false,
            universitySchoolYear: userData.university_school_year || 0,
            universityGraduated: userData.universityGraduated || false,
            major: userData.major || '',
            parentsTried: userData.parents_tried || false,
            schoolActions: userData.school_actions || 0,
            careerActionTaken: userData.career_action_taken || 0,
            monthlyOutflow: userData.monthly_outflow || 0,
            monthlyLivingExpense: userData.monthlyLivingExpense || 0,
            studentLoans: userData.student_loans || 0,
            gradSchoolEnrolled: userData.grad_school_enrolled || false,
            gradSchoolType: userData.grad_school_type || null,
            gradSchoolYear: userData.grad_school_year || 0,
            gradSchoolDegree: userData.grad_school_degree || null,
            hasSeenExpenseMsg: userData.has_seen_expense_message || false,
            //job
            jobTitle: userData.job_title || '',
            jobSalary: userData.job_salary || 0,
            jobPerformance: userData.jobPerformance || 50,
            hasSeenJobSalary: userData.has_seen_job_salary || false,
            gymMembership: userData.gymMembership || false,
            hasBetterDiet: userData.hasBetterDiet || false,
            schoolPerformance: userData.school_performance || 50,
            schoolActions: userData.schoolActions || 0,
            highSchoolRetained: userData.high_school_retained || false,
            //ceo
            hasBusiness: userData.has_business || false,
            companyName: userData.companyName || null,
            ceoSalary: userData.ceoSalary || 0,
            lifeStatus: userData.life_status || "Baby",
            assets: userData.assets || [],

            // --- RELATIONSHIPS ---
            relationships: userData.relationships || []
        },
        lifeLog: [{ age: 0, events: [{ msg: "Game Loaded.", color: "text-white" }] }]    
    };
    //.addLog function contains the renderLifeDashboard call
    addLog(`Born in ${userData.city}. Welcome to the world!`, 'good');
};
//save game function
// Attach to window so it is globally accessible
export async function saveGame() {
    
    // 1. Safety Checks
    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!state.userAuthId) {
        Utils.guestStorage.saveGame()
        console.log("⚠️ Guest mode. Saved locally.");
        return;
    }
    if (!state.gameState || !state.gameState.user) {
        console.error("⚠️ Game state not ready. Save skipped.");
        return;
    }

    console.log("Saving to Cloud...");

    // 2. The Payload
    // This captures EVERYTHING: isStudent, loans, history, assets, etc.
    const payload = {
        auth0_id: state.userAuthId,
        email: state.userEmail, // optional helper
        
        game_data: {
            // The "Suitcase" - Contains all flags (isStudent, hasBusiness, etc.)
            user: state.gameState.user, 
            
            // The Lists
            history: state.gameState.lifeLog,
            assets: state.gameState.assets,
            
            // Redundant top-level helpers for easier DB queries later
            bank: state.gameState.user.money,
            job: { 
                title: state.gameState.user.jobTitle, 
                salary: state.gameState.user.jobSalary 
            },
            stats: {
                age: state.gameState.user.age,
                health: state.gameState.user.health
            }
        }
    };

    // 3. Send to API
    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Save Complete!");
            
            // Optional: Visual Feedback (Toast)
            // showToast("Game Saved"); 
        } else {
            console.error("❌ Save Failed:", await response.text());
        }
    } catch (e) {
        console.error("Network Error:", e);
    }
};
// --- Unified Entry Point ---
export const onload = async () => {
    try {
        // Wrap this in a robust try/catch to silence SDK errors
        await configureAuth().catch(err => {
            console.warn("Auth0 check skipped or blocked (Guest Mode active).", err);
        }); 
        console.log("Auth0 Configured.");
    } catch (e) {
        console.warn("Auth Initialization warning:", e);
    }

    // Continue to game initialization regardless of Auth0 errors
    await initGame();
};

// --- Updated Game Initializer ---
async function initGame() {
    console.log("Initializing Game Logic...");

    // 1. Check Auth0 Status
    const isAuthenticated = state.auth0Client ? await state.auth0Client.isAuthenticated() : false;

    if (isAuthenticated) {
        // User is logged in! 
        const user = await state.auth0Client.getUser();
        console.log(`Welcome back, ${user.nickname} (${user.sub})`);
        
        // Save ID immediately so we can use it
        state.userAuthId = user.sub;
        state.userEmail = user.email;

        try {
            const response = await fetch(`/api/load?auth0_id=${user.sub}`);

            if (response.ok) {
                const dbUser = await response.json();
                if (!dbUser.game_data || Object.keys(dbUser.game_data).length === 0) {
                    console.log("Save file empty (player wiped). Starting Character Creation.");
                    renderCharCreation();
                } else {
                    updateGameInfo(dbUser);
                }
            } else {
                console.log("No save file found. Starting Character Creation.");
                renderCharCreation();
            }
        } catch (e) {
            console.error("Error loading save:", e);
            renderCharCreation();
        }

    } else {
        // Guest Mode - Check for local storage save
        console.log("Guest mode detected.");
        const guestSave = Utils.guestStorage.loadGame();
        
    if (guestSave) {
            // THE FIX: Intercept and destroy dead guest saves
            if (guestSave.user && guestSave.user.lifeStatus === "Deceased") {
                console.log("Guest character is dead. Wiping local save.");
                
                // Clear state and overwrite local storage with empty data
                state.gameState = null;
                if (Utils.guestStorage.saveGame) {
                    Utils.guestStorage.saveGame(); 
                }
                
                renderLoginScreen();
            } else {
                console.log("Loading guest save from local storage...");
                state.gameState = guestSave;
                if (typeof renderLifeDashboard === "function") {
                    renderLifeDashboard();
                } else {
                    console.error("renderLifeDashboard function not found!");
                }
            }
        } else {
            // No guest save - show login screen
            renderLoginScreen();
        }
    }
};
// script.js

// --- RESET GAME PIPELINE ---
export async function resetGame() {
    console.log("Resetting game state...");

    UI.renderScreen(`
        <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center items-center text-center px-4">
            <i class="fas fa-circle-notch fa-spin text-6xl text-slate-500 mb-6"></i>
            <h1 class="text-2xl font-bold text-white mb-2">Obliterating the Past...</h1>
            <p class="text-slate-400">Preparing your next life.</p>
        </div>
    `);

    // 1. Destroy local state
    state.gameState = null;

    // 2. Handle Guest Reset
    if (!state.userAuthId) {
        if (Utils && Utils.guestStorage && typeof Utils.guestStorage.saveGame === 'function') {
            // Saving while gameState is null effectively clears the local storage
            Utils.guestStorage.saveGame(); 
        }
        console.log("Guest save wiped.");
        
        // Route guests back to login so they can choose to authenticate or play as guest again
        if (typeof renderLoginScreen === "function") {
            renderLoginScreen();
            return;
        }
    } 
    // 3. Handle Authenticated User Reset
    else {
        console.log("Wiping Cloud Save...");
        try {
            await fetch('/api/saveGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth0_id: state.userAuthId,
                    email: state.userEmail,
                    game_data: {} // Overwrites the DB with empty data, clearing the "Deceased" lock
                })
            });
        } catch (e) {
            console.error("Failed to reset cloud save:", e);
        }
    }

    // 4. Route authenticated users to Character Creation
    if (typeof renderCharCreation === "function") {
        renderCharCreation();
    }
};

const closeModal = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-overlay').classList.remove('flex');
};

const showComingSoon = () => {
    UI.showModal('Coming Soon', 'This section is under construction.');
};

const routeHandlers = {
  resetGame,
  applyForJob,
  showFullEulogy,
  closeModal,
  showComingSoon,
  workHarder,
  skipSchool,
  workHarderJob,
  slackOffJob,
  login,
  startGuestMode,
  renderVehicleManager,
  renderLifeDashboard,
  renderShoppingHub,
  renderAssets,
  repairVehicle,
  sellVehicle,
  renderVehicleDealer,
  buyVehicle,
  renderActivities,
  processQuarter,
  selectIndustry,
  confirmQuitCareer,
  quitCareer,
  attemptEnrollment,
  openGradEnrollmentModal,
  attemptGradEnrollment,
  enterBusinessMode,
  renderEducation,
  renderGradSchoolMarket,
  openUniversityModal,
  renderCareerManager,
  renderJobMarket,
  renderCareerMarket,
  renderBusinessSetup,
  selectGender,
  submitCharacter,
  continueAsChild,
  ageUp,
  renderRelationships,
  renderPersonInteraction,
  openRelationshipConfirm,
  spendTimeWithAll,
  chooseFuneralType,
  cancelFuneralPlan,
  confirmFuneralPlan,
  donateBody,
  lookTheOtherWay,
  goToFuneral,
  skipFuneral,
  renderMoreDashboard,
  buyGymMembership,
  cancelGymMembership,
  visitGymOneTime,
  startBetterDiet,
  cancelBetterDiet,
  visitDoctor,
  openBlackjackBetting,
  startBlackjackGame,
  blackjackHit,
  blackjackStand,
  hideModal: UI.hideModal,
  openTravelModal,
  bookTrip
};

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        const action = actionElement.dataset.action;
        const argsStr = actionElement.dataset.args;
        let args = [];
        if (argsStr !== undefined && argsStr !== null && argsStr.trim() !== '') {
            args = argsStr.split(',').map(s => {
                let t = s.trim();
                // strip quotes
                if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1);
                else if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
                
                if (t === 'true') return true;
                if (t === 'false') return false;
                if (t === 'null') return null;
                if (t === 'undefined') return undefined;
                
                return isNaN(t) || t === '' ? t : Number(t);
            });
        }
        if (routeHandlers[action]) {
            routeHandlers[action](...args);
        } else {
            console.warn('Unhandled action:', action);
        }
    }
});

onload();
