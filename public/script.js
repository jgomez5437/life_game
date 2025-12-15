const get = id => document.getElementById(id);
// --- CONSTANTS ---
window.GAME_CONSTANTS = {
    GRAD_SCHOOLS: [
        { name: "Law School", years: 3, icon: "fa-balance-scale" },
        { name: "Medical School", years: 4, icon: "fa-user-md" },
        { name: "Business School", years: 2, icon: "fa-chart-line" },
        { name: "Psychiatry School", years: 4, icon: "fa-brain" }
    ]
} 
        const MAJORS = [
            "Psychology", "Computer Science", "English", "Education", "Marketing", 
            "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
            "Political Science", "Criminal Justice"
        ];

        const CAREERS = [
            { title: "Jr. Associate", salary: 75000, icon: "fa-briefcase", reqDegree: true, reqGrad: "Law School" },
            { title: "Firefighter", salary: 57000, icon: "fa-fire-extinguisher", reqDegree: false, reqLaw: false },
            { title: "Graphic Designer", salary: 55000, icon: "fa-pen-nib", reqDegree: true, reqLaw: false }, 
            { title: "Police Officer", salary: 55000, icon: "fa-user-shield", reqDegree: false, reqLaw: false },
            { title: "Jr. Software Developer", salary: 50000, icon: "fa-code", reqDegree: true, reqLaw: false }, 
            { title: "Banker", salary: 40000, icon: "fa-money-check-dollar", reqDegree: true, reqLaw: false }, 
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

const API_URL = '/api'

// public/script.js

// 1. Define Global State Container
window.gameState = null;



// 2. THE ENGINE STARTER
// This function is reusable! It can be called by:
// - The Character Creation Screen (after new sign up)
// - The Login Screen (after signing in)
// - The Auto-Loader (if user refreshes page and is remembered)
window.loadAndRenderGame = (userData) => {
    console.log("Loading game for:", userData.username);

    // Initialize the Single Source of Truth
    window.gameState = {
        user: {
            ...userData,
            money: userData.money || 0,
            age: userData.age || 0,
            gender: userData.gender || 'male',
            isStudent: userData.is_student || false,
            universityEnrolled: userData.university_enrolled || false,
            major: userData.major || '',
            schoolActions: userData.school_actions || 0,
            careerActionTaken: userData.career_action_taken || 0,
            monthlyOutflow: userData.monthly_outflow || 0,
            studentLoans: userData.student_loans || 0,
            gradSchoolEnrolled: userData.grad_school_enrolled || false,
            gradSchoolYear: userData.grad_school_year || 0,
            gradSchoolDegree: userData.grad_school_degree || null,
            hasSeenExpenseMsg: userData.has_seen_expense_message || false,
            jobTitle: userData.job_title || '',
            jobSalary: userData.job_salary || 0,
            schoolPerformance: userData.school_performance || 50,
            highSchoolRetained: userData.high_school_retained || false,
            hasBusiness: userData.has_business || false
        },
        lifeLog: [{ age: 0, events: [{ msg: "Game Loaded.", color: "text-white" }] }],
        assets: [],
    };
    //.addLog function contains the renderLifeDashboard call
    window.addLog(`Born in ${userData.city}. Welcome to the world!`, 'good');
};

//initialize game
async function initGame() {
    console.log("Initializing App...");

    // TODO: Later, we will check Auth0 here to see if user is already logged in.
    const isReturningUser = false; // Hardcoded for now

    if (isReturningUser) {
        // Fetch data and call loadAndRenderGame(data)
    } else {
        // No user found? Send them to Character Creation
        window.renderCharCreation();
    }
}

//Start the app
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

/** 
        // --- UTILS ---
        const el = id => document.getElementById(id);
            
            const avatarHtml = game.gender === 'male' 
                ? '<i class="fas fa-user-tie text-blue-400 text-xl"></i>' 
                : '<i class="fas fa-user-nurse text-pink-400 text-xl"></i>';
            
            if(game.name) el('avatar-container').innerHTML = avatarHtml;
        }

        function getStatusText() {
            if (game.gradSchoolEnrolled) return `${game.gradSchoolType} Student`;
            if (game.universityEnrolled) return "University Student";
            if (game.hasBusiness) return "CEO & Founder";
            if (game.jobTitle) return game.jobTitle; 
            if (game.gradSchoolDegree) return `${game.gradSchoolDegree} Graduate`;
            if (game.universityGraduated) return "University Graduate";
            if (game.age === 0) return "Baby";
            if (game.age < 5) return "Toddler";
            if (game.age < 18) return "Student";
            if (game.highSchoolRetained) return "Student (Retaking)";
            return "Unemployed";
        }

        function getSchoolName() {
            if (game.gradSchoolEnrolled) {
                const school = GRAD_SCHOOLS.find(s => s.name === game.gradSchoolType);
                return `${game.gradSchoolType} (Year ${game.gradSchoolYear + 1}/${school.years})`;
            }
            if (game.universityEnrolled) return `University of ${game.city}`;
            if (game.age < 12) return `${game.city} Elementary School`;
            if (game.age < 14) return `${game.city} Middle School`;
            return `${game.city} High School`;
        }

        function isStudent() {
            return game.universityEnrolled || game.gradSchoolEnrolled || game.highSchoolRetained || (game.age < 18);
        } */