const get = id => document.getElementById(id);
// --- CONSTANTS ---

        const MAJORS = [
            "Psychology", "Computer Science", "English", "Education", "Marketing", 
            "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
            "Political Science", "Criminal Justice"
        ];

        const CAREERS = [
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

        const PART_TIME_JOBS = [
            { title: "Babysitter", hourly: 15, salary: 15600, icon: "fa-baby-carriage" },
            { title: "Amusement Park Crew", hourly: 12, salary: 12480, icon: "fa-ticket-alt" },
            { title: "Movie Theater Crew", hourly: 11, salary: 11440, icon: "fa-film" },
            { title: "Dog Walker", hourly: 10, salary: 10400, icon: "fa-dog" },
            { title: "Fast Food Crew", hourly: 10, salary: 10400, icon: "fa-hamburger" }
        ];

        const INDUSTRIES = {
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

        const SUPPLIERS = [
            { id: 'cheap', name: 'Budget', costMod: 0.8, quality: 30, risk: 0.2 },
            { id: 'standard', name: 'Standard', costMod: 1.0, quality: 60, risk: 0.05 },
            { id: 'premium', name: 'Premium', costMod: 1.4, quality: 95, risk: 0.01 }
        ];

// public/script.js
window.gameState = null;
const API_URL = '/api'
//updates game info
function updateGameInfo(dbUser) {
    console.log("Updating game state from DB...");
    const data = dbUser.game_data;
    const savedUser = data.user || data; 
    //Set Global Auth Variables
    window.userAuthId = dbUser.auth0_id;
    window.userEmail = dbUser.email;

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
    //CONSTRUCT window.gameState
    window.gameState = {
        user: {
            // --- IDENTITY ---
            username: savedUser.username || savedUser.name || "Player",
            gender: savedUser.gender || "male",
            city: savedUser.city || "New York",
            
            // --- CORE STATS ---
            age: data.stats?.age || savedUser.age || 0,
            money: data.money || savedUser.money || 0,
            lifeStatus: savedUser.lifeStatus || "Baby",

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

            // --- ASSETS ---
            assets: savedUser.assets || []
        },
        
        // --- ASSETS & HISTORY ---
        lifeLog: cleanHistory
    };
    // 5. Render
    if (typeof window.renderLifeDashboard === "function") {
        window.renderLifeDashboard(); 
    } else {
        console.error("❌ renderLifeDashboard function not found!");
    }

    console.log("✅ Game Loaded & Ready");
};
//Loads and renders the game
window.loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username);

    // Initialize the Single Source of Truth
    window.gameState = {
        user: {
            ...userData,
            money: userData.money || 0,
            age: userData.age || 0,
            gender: userData.gender || 'male',
            city: userData.city || "New York",
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
            schoolPerformance: userData.school_performance || 50,
            schoolActions: userData.schoolActions || 0,
            highSchoolRetained: userData.high_school_retained || false,
            //ceo
            hasBusiness: userData.has_business || false,
            companyName: userData.companyName || null,
            ceoSalary: userData.ceoSalary || 0,
            lifeStatus: userData.life_status || "Baby",
            assets: userData.assets || []
        },
        lifeLog: [{ age: 0, events: [{ msg: "Game Loaded.", color: "text-white" }] }]    
    };
    //.addLog function contains the renderLifeDashboard call
    window.addLog(`Born in ${userData.city}. Welcome to the world!`, 'good');
};
//save game function
// Attach to window so it is globally accessible
window.saveGame = async function() {
    
    // 1. Safety Checks
    // Don't save if we are a guest (no ID) or if the game hasn't loaded yet (no state)
    if (!window.userAuthId) {
        console.log("⚠️ Guest mode. Save skipped.");
        return;
    }
    if (!window.gameState || !window.gameState.user) {
        console.error("⚠️ Game state not ready. Save skipped.");
        return;
    }

    console.log("Saving to Cloud...");

    // 2. The Payload
    // This captures EVERYTHING: isStudent, loans, history, assets, etc.
    const payload = {
        auth0_id: window.userAuthId,
        email: window.userEmail, // optional helper
        
        game_data: {
            // The "Suitcase" - Contains all flags (isStudent, hasBusiness, etc.)
            user: window.gameState.user, 
            
            // The Lists
            history: window.gameState.lifeLog,
            assets: window.gameState.assets,
            
            // Redundant top-level helpers for easier DB queries later
            bank: window.gameState.user.money,
            job: { 
                title: window.gameState.user.jobTitle, 
                salary: window.gameState.user.jobSalary 
            },
            stats: {
                age: window.gameState.user.age
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
window.onload = async () => {
    try {
        //wait for auth0
        await window.configureAuth(); 
        console.log("Auth0 Configured.");
    } catch (e) {
        console.error("Auth Initialization Failed:", e);
    }
    await initGame();
};

// --- Updated Game Initializer ---
async function initGame() {
    console.log("Initializing Game Logic...");

    // 1. Check Auth0 Status
    const isAuthenticated = await window.auth0Client.isAuthenticated();

    if (isAuthenticated) {
        // User is logged in! 
        const user = await window.auth0Client.getUser();
        console.log(`Welcome back, ${user.nickname} (${user.sub})`);
        
        // Save ID immediately so we can use it
        window.userAuthId = user.sub;
        window.userEmail = user.email;

        try {
            const response = await fetch(`/api/load?auth0_id=${user.sub}`);

            if (response.ok) {
                const dbUser = await response.json();
                updateGameInfo(dbUser);
            } else {
                console.log("No save file found. Starting Character Creation.");
                window.renderCharCreation();
            }
        } catch (e) {
            console.error("Error loading save:", e);
            window.renderCharCreation();
        }

    } else {
        // Guest Mode
        window.renderLoginScreen();
    }
};