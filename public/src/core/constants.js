// Shared non-UI Game Constants and Configurations

export const MAJORS = [
    "Psychology", "Computer Science", "English", "Education", "Marketing",
    "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
    "Political Science", "Criminal Justice", "Communications", "Pharmacy"
];

export const CAREER_TRACKS = [
    // ── NO DEGREE REQUIRED ────────────────────────────────────────────
    {
        key: 'retail', label: 'Retail', icon: 'fa-shopping-bag',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Cashier',          salary:  28000, minYears: 2 },
            { title: 'Sales Associate',  salary:  34000, minYears: 3 },
            { title: 'Team Lead',        salary:  45000, minYears: 3 },
            { title: 'Store Manager',    salary:  65000, minYears: 4 },
            { title: 'District Manager', salary: 100000, minYears: null }
        ]
    },
    {
        key: 'food_service', label: 'Food Service', icon: 'fa-utensils',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Line Cook',      salary:  30000, minYears: 2 },
            { title: 'Cook',           salary:  38000, minYears: 2 },
            { title: 'Sous Chef',      salary:  52000, minYears: 3 },
            { title: 'Head Chef',      salary:  75000, minYears: 4 },
            { title: 'Executive Chef', salary:  95000, minYears: null }
        ]
    },
    {
        key: 'trades', label: 'Skilled Trades', icon: 'fa-wrench',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Trade Helper',        salary:  32000, minYears: 1 },
            { title: 'Apprentice',          salary:  42000, minYears: 2 },
            { title: 'Journeyman',          salary:  60000, minYears: 3 },
            { title: 'Foreman',             salary:  78000, minYears: 4 },
            { title: 'Master Tradesperson', salary: 100000, minYears: null }
        ]
    },
    {
        key: 'law_enforcement', label: 'Law Enforcement', icon: 'fa-user-shield',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Patrol Officer', salary:  55000, minYears: 3 },
            { title: 'Detective',      salary:  70000, minYears: 4 },
            { title: 'Sergeant',       salary:  85000, minYears: 4 },
            { title: 'Lieutenant',     salary: 100000, minYears: 5 },
            { title: 'Police Captain', salary: 120000, minYears: null }
        ]
    },
    {
        key: 'fire_service', label: 'Fire Service', icon: 'fa-fire-extinguisher',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Firefighter',     salary:  48000, minYears: 2 },
            { title: 'Driver/Engineer', salary:  62000, minYears: 2 },
            { title: 'Fire Lieutenant', salary:  76000, minYears: 3 },
            { title: 'Fire Captain',    salary:  90000, minYears: 4 },
            { title: 'Fire Chief',      salary: 105000, minYears: null }
        ]
    },
    {
        key: 'logistics', label: 'Logistics & Delivery', icon: 'fa-truck',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Delivery Driver',      salary:  35000, minYears: 2 },
            { title: 'Senior Driver',        salary:  45000, minYears: 2 },
            { title: 'Dispatch Coordinator', salary:  60000, minYears: 3 },
            { title: 'Logistics Manager',    salary:  82000, minYears: 4 },
            { title: 'VP of Logistics',      salary: 110000, minYears: null }
        ]
    },
    // ── UNDERGRAD DEGREE + MAJOR REQUIRED ────────────────────────────
    {
        key: 'software_eng', label: 'Software Engineering', icon: 'fa-code',
        reqDegree: true, reqGrad: null, reqMajors: ['Computer Science'],
        levels: [
            { title: 'Jr. Software Developer', salary:  50000, minYears: 2 },
            { title: 'Software Developer',     salary:  72000, minYears: 3 },
            { title: 'Senior Developer',       salary: 100000, minYears: 4 },
            { title: 'Lead Engineer',          salary: 135000, minYears: 5 },
            { title: 'Engineering Director',   salary: 175000, minYears: null }
        ]
    },
    {
        key: 'graphic_design', label: 'Graphic Design', icon: 'fa-pen-nib',
        reqDegree: true, reqGrad: null, reqMajors: ['Graphic Design'],
        levels: [
            { title: 'Junior Designer',   salary:  45000, minYears: 2 },
            { title: 'Graphic Designer',  salary:  58000, minYears: 2 },
            { title: 'Senior Designer',   salary:  75000, minYears: 3 },
            { title: 'Art Director',      salary: 100000, minYears: 4 },
            { title: 'Creative Director', salary: 130000, minYears: null }
        ]
    },
    {
        key: 'education_track', label: 'Education', icon: 'fa-chalkboard-teacher',
        reqDegree: true, reqGrad: null, reqMajors: ['Education'],
        levels: [
            { title: 'Teacher',          salary:  40000, minYears: 3 },
            { title: 'Senior Teacher',   salary:  52000, minYears: 3 },
            { title: 'Department Chair', salary:  70000, minYears: 4 },
            { title: 'Vice Principal',   salary:  90000, minYears: 4 },
            { title: 'Principal',        salary: 110000, minYears: null }
        ]
    },
    {
        key: 'nursing', label: 'Nursing', icon: 'fa-heartbeat',
        reqDegree: true, reqGrad: null, reqMajors: ['Nursing'],
        levels: [
            { title: 'Registered Nurse',      salary:  50000, minYears: 2 },
            { title: 'Charge Nurse',          salary:  65000, minYears: 3 },
            { title: 'Nurse Manager',         salary:  85000, minYears: 3 },
            { title: 'Director of Nursing',   salary: 110000, minYears: 4 },
            { title: 'Chief Nursing Officer', salary: 150000, minYears: null }
        ]
    },
    {
        key: 'banking', label: 'Banking & Finance', icon: 'fa-money-check-dollar',
        reqDegree: true, reqGrad: null, reqMajors: ['Business', 'Marketing'],
        levels: [
            { title: 'Bank Teller',           salary:  42000, minYears: 2 },
            { title: 'Loan Officer',          salary:  55000, minYears: 3 },
            { title: 'Branch Manager',        salary:  80000, minYears: 3 },
            { title: 'VP of Banking',         salary: 120000, minYears: 4 },
            { title: 'Chief Banking Officer', salary: 190000, minYears: null }
        ]
    },
    // ── GRADUATE SCHOOL REQUIRED ──────────────────────────────────────
    {
        key: 'law', label: 'Law', icon: 'fa-balance-scale',
        reqDegree: false, reqGrad: 'Law School', reqMajors: null,
        levels: [
            { title: 'Law Clerk',          salary:  70000, minYears: 2 },
            { title: 'Associate Attorney', salary: 100000, minYears: 3 },
            { title: 'Junior Partner',     salary: 145000, minYears: 4 },
            { title: 'Senior Partner',     salary: 200000, minYears: 5 },
            { title: 'Managing Partner',   salary: 250000, minYears: null }
        ]
    },
    {
        key: 'medicine', label: 'Medicine', icon: 'fa-user-md',
        reqDegree: false, reqGrad: 'Medical School', reqMajors: null,
        levels: [
            { title: 'Resident',            salary:  65000, minYears: 3 },
            { title: 'Staff Physician',     salary: 120000, minYears: 3 },
            { title: 'Attending Physician', salary: 200000, minYears: 4 },
            { title: 'Department Head',     salary: 280000, minYears: 5 },
            { title: 'Chief of Medicine',   salary: 350000, minYears: null }
        ]
    },
    {
        key: 'psychiatry', label: 'Psychiatry', icon: 'fa-brain',
        reqDegree: false, reqGrad: 'Psychiatry School', reqMajors: null,
        levels: [
            { title: 'Psychiatry Resident',    salary:  65000, minYears: 3 },
            { title: 'Psychiatrist',           salary: 130000, minYears: 3 },
            { title: 'Senior Psychiatrist',    salary: 190000, minYears: 4 },
            { title: 'Psychiatry Dept. Head',  salary: 240000, minYears: 5 },
            { title: 'Chief of Psychiatry',    salary: 280000, minYears: null }
        ]
    },
    {
        key: 'corp_finance', label: 'Corporate Finance', icon: 'fa-chart-line',
        reqDegree: false, reqGrad: 'Business School', reqMajors: null,
        levels: [
            { title: 'Financial Analyst', salary:  65000, minYears: 2 },
            { title: 'Senior Analyst',    salary:  90000, minYears: 2 },
            { title: 'Finance Manager',   salary: 130000, minYears: 3 },
            { title: 'VP of Finance',     salary: 200000, minYears: 4 },
            { title: 'CFO',               salary: 300000, minYears: null }
        ]
    },
    // ── NO DEGREE REQUIRED (continued) ───────────────────────────────
    {
        key: 'real_estate', label: 'Real Estate', icon: 'fa-house',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Real Estate Agent',   salary:  32000, minYears: 2 },
            { title: 'Senior Agent',        salary:  52000, minYears: 2 },
            { title: 'Real Estate Broker',  salary:  78000, minYears: 3 },
            { title: 'Branch Broker',       salary: 105000, minYears: 4 },
            { title: 'Regional Director',   salary: 140000, minYears: null }
        ]
    },
    {
        key: 'military', label: 'Military', icon: 'fa-medal',
        reqDegree: false, reqGrad: null, reqMajors: null,
        levels: [
            { title: 'Enlistee',      salary:  30000, minYears: 2 },
            { title: 'Private',       salary:  38000, minYears: 2 },
            { title: 'Corporal',      salary:  50000, minYears: 3 },
            { title: 'Sergeant',      salary:  63000, minYears: 4 },
            { title: 'Staff Sergeant',salary:  78000, minYears: null }
        ]
    },
    // ── UNDERGRAD DEGREE + MAJOR REQUIRED (continued) ────────────────
    {
        key: 'journalism', label: 'Journalism & Media', icon: 'fa-newspaper',
        reqDegree: true, reqGrad: null, reqMajors: ['Communications'],
        levels: [
            { title: 'Reporter',         salary:  38000, minYears: 2 },
            { title: 'Staff Writer',     salary:  52000, minYears: 2 },
            { title: 'Senior Reporter',  salary:  70000, minYears: 3 },
            { title: 'Editor',           salary:  92000, minYears: 4 },
            { title: 'Editor-in-Chief',  salary: 130000, minYears: null }
        ]
    },
    {
        key: 'marketing_track', label: 'Marketing', icon: 'fa-bullhorn',
        reqDegree: true, reqGrad: null, reqMajors: ['Business', 'Marketing'],
        levels: [
            { title: 'Junior Copywriter',    salary:  42000, minYears: 2 },
            { title: 'Copywriter',           salary:  58000, minYears: 2 },
            { title: 'Marketing Manager',    salary:  85000, minYears: 3 },
            { title: 'VP of Marketing',      salary: 130000, minYears: 4 },
            { title: 'CMO',                  salary: 200000, minYears: null }
        ]
    },
    {
        key: 'social_work', label: 'Social Work', icon: 'fa-hands-helping',
        reqDegree: true, reqGrad: null, reqMajors: ['Psychology'],
        levels: [
            { title: 'Case Worker',        salary:  36000, minYears: 2 },
            { title: 'Social Worker',      salary:  48000, minYears: 2 },
            { title: 'Senior Counselor',   salary:  64000, minYears: 3 },
            { title: 'Program Director',   salary:  82000, minYears: 4 },
            { title: 'Dept. Head',         salary: 105000, minYears: null }
        ]
    },
    {
        key: 'pharmacy', label: 'Pharmacy', icon: 'fa-pills',
        reqDegree: true, reqGrad: null, reqMajors: ['Pharmacy'],
        levels: [
            { title: 'Pharmacy Technician',   salary:  35000, minYears: 2 },
            { title: 'Pharmacist',            salary:  65000, minYears: 2 },
            { title: 'Senior Pharmacist',     salary:  95000, minYears: 3 },
            { title: 'Pharmacy Manager',      salary: 120000, minYears: 4 },
            { title: 'Director of Pharmacy',  salary: 155000, minYears: null }
        ]
    }
];

export const SPECIAL_CAREER_TRACKS = [
    {
        key: 'mafia_syndicate', label: 'La Cosa Nostra', icon: 'fa-user-ninja',
        reqDegree: false, reqGrad: null, reqMajors: null, premiumPack: 'mafia_syndicate',
        levels: [
            { title: 'Muscle',      salary:   80000, minYears: 2 },
            { title: 'Made Man',    salary:  150000, minYears: 3 },
            { title: 'Street Boss', salary:  500000, minYears: 4 },
            { title: 'Underboss',   salary: 1500000, minYears: 5 },
            { title: 'The Don',     salary: 4000000, minYears: null }
        ]
    }
];

export const PART_TIME_JOBS = [
    { title: "Babysitter",          hourly: 15, salary: 15600, icon: "fa-baby-carriage" },
    { title: "Amusement Park Crew", hourly: 12, salary: 12480, icon: "fa-ticket-alt" },
    { title: "Movie Theater Crew",  hourly: 11, salary: 11440, icon: "fa-film" },
    { title: "Dog Walker",          hourly: 10, salary: 10400, icon: "fa-dog" },
    { title: "Fast Food Crew",      hourly: 10, salary: 10400, icon: "fa-hamburger" },
    { title: "Security Guard",      hourly: 14, salary: 14560, icon: "fa-shield-alt" },
    { title: "Grocery Clerk",       hourly: 11, salary: 11440, icon: "fa-shopping-cart" },
    { title: "Landscaper",          hourly: 13, salary: 13520, icon: "fa-leaf" },
    { title: "Tutor",               hourly: 18, salary: 18720, icon: "fa-chalkboard-teacher", reqUniversity: true },
    { title: "Waiter/Waitress",     hourly: 14, salary: 14560, icon: "fa-utensils" },
    { title: "Ride-Share Driver",   hourly: 16, salary: 16640, icon: "fa-car", minAge: 21 },
    { title: "Barista",             hourly: 12, salary: 12480, icon: "fa-coffee" },
    { title: "Library Assistant",   hourly: 12, salary: 12480, icon: "fa-book" },
    { title: "Pharmacy Tech",       hourly: 15, salary: 15600, icon: "fa-pills" },
    { title: "Freelancer",          hourly: 20, salary: 20800, icon: "fa-pen-fancy" },
    { title: "Personal Trainer",    hourly: 20, salary: 20800, icon: "fa-dumbbell", minAge: 18 }
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
        startupCost: 150000,
        capacityPerEmployee: 600
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
        startupCost: 75000,
        capacityPerEmployee: 1200
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
        startupCost: 1000000,
        capacityPerEmployee: 200
    }
};

export const SUPPLIERS = [
    { id: 'cheap', name: 'Budget', costMod: 0.8, quality: 30, risk: 0.2 },
    { id: 'standard', name: 'Standard', costMod: 1.0, quality: 60, risk: 0.05 },
    { id: 'premium', name: 'Premium', costMod: 1.4, quality: 95, risk: 0.01 }
];
