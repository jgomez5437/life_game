// --- CONSTANTS ---
        const CITIES = ["New York", "London", "Tokyo", "Berlin", "San Francisco"];
        const MAJORS = [
            "Psychology", "Computer Science", "English", "Education", "Marketing", 
            "Business", "Nursing", "Religious Studies", "Biology", "Graphic Design", "Chemistry",
            "Political Science", "Criminal Justice"
        ];
        
        const GRAD_SCHOOLS = [
            { name: "Law School", years: 3, icon: "fa-balance-scale" },
            { name: "Medical School", years: 4, icon: "fa-user-md" },
            { name: "Business School", years: 2, icon: "fa-chart-line" },
            { name: "Psychiatry School", years: 4, icon: "fa-brain" }
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

        const moneyEl = document.getElementById('header-bank');
        const 

        // --- GLOBAL STATE ---
        let game = {
            // Life State
            name: "",
            gender: "male",
            city: "New York",
            age: 0,
            bank: 0,
            lifeLog: [],
            assets: [], 
            
            // Career / Job
            jobTitle: null,
            jobSalary: 0,
            jobPerformance: 50,
            careerActionTaken: false,

            // School / Education
            schoolPerformance: 50,
            schoolActions: 0,
            universityEnrolled: false,
            universityGraduated: false, 
            major: null,
            
            // Grad School State
            gradSchoolEnrolled: false,
            gradSchoolType: null, 
            gradSchoolYear: 0,
            gradSchoolDegree: null, 

            studentLoans: 0,
            highSchoolRetained: false, 
            
            // Flags for Modal Persistence
            scholarshipTried: false,
            parentsTried: false,
            hasSeenExpenseMsg: false,

            // Business State
            hasBusiness: false,
            companyName: "",
            industry: "tech",
            compCash: 0,
            year: 1, // Fiscal Year
            quarter: 1,
            reputation: 50,
            morale: 75,
            employees: 5,
            inventory: 0,
            
            // Decisions
            productionTarget: 0,
            sellingPrice: 0,
            supplierId: 'standard',
            salaryOffer: 0,
            ceoSalary: 5000,
            
            // History
            history: [],
            lastQuarterResults: null
        };

        // --- UTILS ---
        const formatMoney = num => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
        const el = id => document.getElementById(id);

        function updateHeader() {
            el('header-name').innerText = game.name || "Character Creation";
            el('header-age').innerText = game.age;
            
            const bankEl = el('header-bank');
            bankEl.innerText = formatMoney(game.bank);
            
            if (game.bank < 0) {
                bankEl.classList.remove('text-green-400');
                bankEl.classList.add('text-red-500');
            } else {
                bankEl.classList.remove('text-red-500');
                bankEl.classList.add('text-green-400');
            }
            
            const avatarHtml = game.gender === 'male' 
                ? '<i class="fas fa-user-tie text-blue-400 text-xl"></i>' 
                : '<i class="fas fa-user-nurse text-pink-400 text-xl"></i>';
            
            if(game.name) el('avatar-container').innerHTML = avatarHtml;
        }

        function showModal(title, content, btnText = "Continue", callback = null) {
            el('modal-title').innerText = title;
            el('modal-content').innerHTML = content;
            
            el('modal-actions').innerHTML = `<button id="modal-btn" class="w-full btn-primary text-white font-bold py-3 rounded-lg">${btnText}</button>`;
            
            const btn = el('modal-btn');
            const m = el('modal-overlay');
            m.classList.remove('hidden');
            m.classList.add('flex');
            
            btn.onclick = () => {
                m.classList.add('hidden');
                m.classList.remove('flex');
                if (callback) callback();
            };
        }

        function addLog(msg, type='neutral') {
            let color = 'text-slate-400';
            if (type === 'good') color = 'text-green-400';
            else if (type === 'bad') color = 'text-red-400';
            else if (type === 'major') color = 'text-yellow-400 font-bold';
            else if (type === 'green') color = 'text-green-400'; // Explicit green request
            
            if (game.lifeLog.length > 0 && game.lifeLog[0].age === game.age) {
                game.lifeLog[0].events.push({ msg, color });
            } else {
                game.lifeLog.unshift({ age: game.age, events: [{ msg, color }] });
            }
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
        }

        // --- NEW PAGE: ASSETS ---
        function renderAssets() {
            updateHeader();
            
            // Calculate Monthly Finance Stats
            let monthlyIncome = 0;
            if (game.hasBusiness) monthlyIncome += game.ceoSalary;
            if (game.jobTitle) monthlyIncome += Math.floor(game.jobSalary / 12);

            let monthlyOutflow = 0;
            if (game.studentLoans > 0 && game.age >= 23 && !game.gradSchoolEnrolled) {
                monthlyOutflow += 200;
            }
            // Living Expenses: Age 19+ AND Not enrolled in ANY school
            if (game.age >= 19 && !isStudent()) {
                monthlyOutflow += 2000;
            }
            
            const assetList = game.assets.length > 0 
                ? game.assets.map(a => `<div class="p-3 bg-slate-900 border border-slate-700 rounded mb-2">${a.name}</div>`).join('')
                : `<div class="text-slate-500 italic text-center py-4 text-xs">You don't own any items yet.</div>`;

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderLifeDashboard()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                    </div>
                    
                    <h2 class="text-2xl font-bold mb-4 px-1">My Assets</h2>
                    
                    <!-- Finance Stats Grid -->
                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div class="text-[10px] text-slate-400 uppercase font-bold">Income</div>
                            <div class="text-green-400 font-bold text-sm">${formatMoney(monthlyIncome)}/mo</div>
                        </div>
                        <div class="border-x border-slate-700 px-2">
                            <div class="text-[10px] text-slate-400 uppercase font-bold">Student Loans</div>
                            <div class="text-red-400 font-bold text-sm">${formatMoney(game.studentLoans)}</div>
                        </div>
                        <div>
                            <div class="text-[10px] text-slate-400 uppercase font-bold">Monthly Outflow</div>
                            <div class="text-red-400 font-bold text-sm">${formatMoney(monthlyOutflow)}/mo</div>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto pb-4">
                        
                        <!-- Go Shopping -->
                        <div onclick="showModal('Coming Soon', 'Shopping functionality will be added in a future update.')" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                            <div class="flex items-center gap-3 mb-2">
                                 <div class="w-8 h-8 rounded-full bg-yellow-600/30 flex items-center justify-center text-yellow-500">
                                    <i class="fas fa-shopping-cart"></i>
                                </div>
                                <h3 class="font-bold text-white">Go Shopping</h3>
                            </div>
                            <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                                 <div class="text-sm text-white font-bold">Buy Items</div>
                                 <i class="fas fa-chevron-right text-slate-600"></i>
                            </div>
                        </div>

                        <!-- Placeholders -->
                        <div class="mb-4">
                            <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Investments</h3>
                            <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                        </div>
                        <div class="mb-4">
                            <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Properties</h3>
                            <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                        </div>
                        <div class="mb-4">
                            <h3 class="text-slate-400 font-bold mb-2 text-sm uppercase">Vehicles</h3>
                            <div class="bg-slate-800 p-3 rounded border border-slate-700 text-slate-500 italic text-sm">Coming Soon</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- NEW PAGE: JOB MARKET ---
        function renderJobMarket() {
            updateHeader();
            
            // Sort jobs by hourly pay
            const sortedJobs = [...PART_TIME_JOBS].sort((a, b) => b.hourly - a.hourly);

            const listHtml = sortedJobs.map(job => {
                const isCurrent = game.jobTitle === job.title;
                const btnText = isCurrent ? "Current" : "Apply";
                const btnClass = isCurrent 
                    ? "bg-green-600/20 text-green-400 border border-green-600/50 cursor-default" 
                    : "bg-blue-600 hover:bg-blue-500 text-white";

                return `
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 ${isCurrent ? 'border-green-500/30' : ''}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                                <i class="fas ${job.icon}"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">${job.title}</h3>
                                <div class="text-xs text-green-400">$${job.hourly}/hr <span class="text-slate-500">(${formatMoney(job.salary)}/yr)</span></div>
                            </div>
                        </div>
                        <button onclick="${!isCurrent ? `applyForJob('${job.title}', ${job.salary}, false, false)` : ''}" class="${btnClass} text-xs font-bold py-2 px-4 rounded-lg transition">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `}).join('');

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                            <i class="fas fa-arrow-left"></i> Back to Occupation
                        </button>
                    </div>
                    
                    <h2 class="text-2xl font-bold mb-6 px-1">Job Market</h2>
                    
                    <div class="flex-1 overflow-y-auto pb-4">
                        ${listHtml}
                    </div>
                </div>
            `;
        }

        // --- NEW PAGE: CAREER MARKET ---
        function renderCareerMarket() {
            updateHeader();
            
            // Sort careers by salary descending
            const sortedCareers = [...CAREERS].sort((a, b) => b.salary - a.salary);

            const listHtml = sortedCareers.map(job => {
                const isCurrent = game.jobTitle === job.title;
                const btnText = isCurrent ? "Current" : "Apply";
                const btnClass = isCurrent 
                    ? "bg-green-600/20 text-green-400 border border-green-600/50 cursor-default" 
                    : "bg-blue-600 hover:bg-blue-500 text-white";
                
                let warnings = [];
                if (job.reqDegree && !game.universityGraduated) warnings.push("University Degree Required");
                if (job.reqGrad && game.gradSchoolDegree !== job.reqGrad) warnings.push(`${job.reqGrad} Degree Required`);
                
                const warningHtml = warnings.length > 0 
                    ? `<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-exclamation-circle"></i> ${warnings.join(", ")}</div>` 
                    : "";

                return `
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3 ${isCurrent ? 'border-green-500/30' : ''}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                                <i class="fas ${job.icon}"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">${job.title}</h3>
                                <div class="text-xs text-green-400">${formatMoney(job.salary)}/yr</div>
                                ${warningHtml}
                            </div>
                        </div>
                        <button onclick="${!isCurrent ? `applyForJob('${job.title}', ${job.salary}, ${job.reqDegree}, '${job.reqGrad}')` : ''}" class="${btnClass} text-xs font-bold py-2 px-4 rounded-lg transition">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `}).join('');

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                            <i class="fas fa-arrow-left"></i> Back to Occupation
                        </button>
                    </div>
                    
                    <h2 class="text-2xl font-bold mb-6 px-1">Find a Career</h2>
                    
                    <div class="flex-1 overflow-y-auto pb-4">
                        ${listHtml}
                    </div>
                </div>
            `;
        }

        function applyForJob(title, salary, reqDegree, reqGrad) {
            if (reqDegree && !game.universityGraduated) {
                return showModal("Qualifications Missing", "This job requires a University Degree.");
            }
            if (reqGrad && reqGrad !== 'undefined' && reqGrad !== 'null' && game.gradSchoolDegree !== reqGrad) {
                return showModal("Qualifications Missing", `This job requires a degree from ${reqGrad}.`);
            }
            
            game.jobTitle = title;
            game.jobSalary = salary;
            
            // Reset job-specific stats
            game.jobPerformance = 50;
            game.careerActionTaken = false;

            addLog(`Hired as a ${title}! Annual Salary: ${formatMoney(salary)}`, 'good');
            
            // Return to appropriate page
            if (reqDegree === false && !reqGrad) renderJobMarket(); // Simplistic check for part time
            else renderCareerMarket();
        }

        // --- NEW PAGE: CAREER MANAGER ---
        function renderCareerManager() {
            updateHeader();
            
            const p = game.jobPerformance;
            const actionTaken = game.careerActionTaken;
            
            let barColor = 'bg-red-500';
            if(p > 75) barColor = 'bg-green-500';
            else if(p > 25) barColor = 'bg-yellow-500';

            // Action Button Styles
            const actionClass = actionTaken 
                ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
                : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";
            
             const slackClass = actionTaken 
                ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
                : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                            <i class="fas fa-arrow-left"></i> Back to Occupation
                        </button>
                    </div>

                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 mx-auto mb-3 text-2xl">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white">${game.jobTitle}</h2>
                        <p class="text-green-400 text-sm font-bold">${formatMoney(game.jobSalary)} / year</p>
                        <p class="text-slate-500 text-xs mt-1">${actionTaken ? "Action Taken This Year" : "Actions Available"}</p>
                    </div>

                    <!-- Performance -->
                    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-slate-300 font-bold">Performance</span>
                            <span class="${p > 75 ? 'text-green-400' : p < 25 ? 'text-red-400' : 'text-yellow-400'} font-bold">${p}%</span>
                        </div>
                        <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} transition-all duration-500" style="width: ${p}%"></div>
                        </div>
                    </div>

                    <!-- Actions Grid -->
                    <div class="grid grid-cols-1 gap-3">
                        <button onclick="${actionTaken ? '' : 'workHarderJob()'}" class="${actionClass}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <i class="fas fa-briefcase"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-bold text-white">Work Harder</h3>
                                    <div class="text-xs text-blue-200">Boost Performance (+15%)</div>
                                </div>
                            </div>
                            <i class="fas fa-arrow-right text-white"></i>
                        </button>

                        <button onclick="${actionTaken ? '' : 'slackOffJob()'}" class="${slackClass}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 group-hover:text-red-300">
                                    <i class="fas fa-couch"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-bold text-white group-hover:text-red-300">Slack Off</h3>
                                    <div class="text-xs text-slate-500">Reduce Stress (-15% Perf)</div>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right text-slate-600"></i>
                        </button>

                        <button onclick="confirmQuitCareer()" class="bg-red-900/50 p-4 rounded-xl border border-red-700 flex items-center justify-between hover:bg-red-900 transition group mt-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                                    <i class="fas fa-door-open"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-bold text-white group-hover:text-red-300">Quit Career</h3>
                                    <div class="text-xs text-red-300">Resign from position</div>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right text-red-500"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        function workHarderJob() {
            if (game.careerActionTaken) return;
            
            game.jobPerformance = Math.min(100, game.jobPerformance + 15);
            game.careerActionTaken = true;
            addLog("Worked hard at your job. Boss is impressed.", 'good');
            renderCareerManager();
        }

        function slackOffJob() {
            if (game.careerActionTaken) return;

            game.jobPerformance = Math.max(0, game.jobPerformance - 15);
            game.careerActionTaken = true;
            addLog("Slacked off at work. Performance suffered.", 'bad');
            renderCareerManager();
        }

        function confirmQuitCareer() {
            const m = el('modal-overlay');
            el('modal-title').innerText = "Quit Career?";
            el('modal-content').innerHTML = `Are you sure you want to resign from your position as <strong>${game.jobTitle}</strong>? You will lose your steady income.`;
            
            el('modal-actions').innerHTML = `
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="quitCareer()" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">Yes, Quit</button>
                    <button onclick="document.getElementById('modal-overlay').classList.add('hidden'); document.getElementById('modal-overlay').classList.remove('flex');" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">Cancel</button>
                </div>
            `;

            m.classList.remove('hidden');
            m.classList.add('flex');
        }

        function quitCareer() {
            const oldJob = game.jobTitle;
            game.jobTitle = null;
            game.jobSalary = 0;
            game.jobPerformance = 50;
            game.careerActionTaken = false;

            // Close Modal
            const m = el('modal-overlay');
            m.classList.add('hidden');
            m.classList.remove('flex');
            
            addLog(`Resigned from position as ${oldJob}.`, 'major'); 
            
            renderActivities();
        }

        // --- NEW PAGE: GRAD SCHOOL MARKET ---
        function renderGradSchoolMarket() {
            updateHeader();
            
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

            el('game-container').innerHTML = `
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
            // Reset flags
            game.scholarshipTried = false;
            game.parentsTried = false;
            renderGradModalContent(schoolType);
        }

        function renderGradModalContent(schoolType) {
            const m = el('modal-overlay');
            el('modal-title').innerText = "Enroll in " + schoolType;
            el('modal-content').innerHTML = `
                <div class="text-sm text-slate-300 mb-4">Total Tuition: <span class="text-white font-bold">$100,000</span></div>
                <div class="text-xs text-slate-400 mb-2">Student loan payments will be deferred while enrolled.</div>
            `;
            
            // Render Actions
            const cashDisabled = game.bank < 100000;
            const cashBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'cash')" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded mb-2">Pay Cash ($100k)</button>`;
            
            const loanBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'loan')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mb-2">Student Loans</button>`;
            
            // Scholarship Button
            let scholarBtn = "";
            if (game.scholarshipTried) {
                scholarBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">Ineligible</button>`;
            } else {
                scholarBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'scholarship')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mb-2">Apply for Scholarship</button>`;
            }

            // Parents Button
            let parentBtn = "";
            if (game.parentsTried) {
                 parentBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">They Refused</button>`;
            } else {
                parentBtn = `<button onclick="attemptGradEnrollment('${schoolType}', 'parents')" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded mb-2">Ask Parents to Pay</button>`;
            }

            el('modal-actions').innerHTML = `
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
            if (method === 'cash') {
                game.bank -= 100000;
                gradEnrollSuccess(schoolType, "paid with cash");
            } 
            else if (method === 'loan') {
                game.studentLoans += 100000;
                gradEnrollSuccess(schoolType, "took out student loans");
            }
            else if (method === 'scholarship') {
                const roll = Math.random();
                if (roll < 0.3) {
                    gradEnrollSuccess(schoolType, "received a full scholarship");
                } else {
                    game.scholarshipTried = true;
                    renderGradModalContent(schoolType); 
                }
            }
            else if (method === 'parents') {
                const roll = Math.random();
                if (roll < 0.3) {
                    gradEnrollSuccess(schoolType, "parents paid your tuition");
                } else {
                    game.parentsTried = true;
                    renderGradModalContent(schoolType); 
                }
            }
        }

        function gradEnrollSuccess(schoolType, methodMsg) {
            game.gradSchoolEnrolled = true;
            game.gradSchoolType = schoolType;
            game.gradSchoolYear = 0;
            game.schoolPerformance = 50;
            
            // Close Modal
            const m = el('modal-overlay');
            m.classList.add('hidden');
            m.classList.remove('flex');

            addLog(`Enrolled in ${schoolType}. You ${methodMsg}.`, 'good');
            updateHeader();
            renderActivities();
        }

        // --- PAGE: EDUCATION ---
        function renderEducation() {
            updateHeader();

            const p = game.schoolPerformance;
            const remainingActions = 2 - game.schoolActions;
            
            let barColor = 'bg-red-500';
            if(p > 75) barColor = 'bg-green-500';
            else if(p > 25) barColor = 'bg-yellow-500';

            const schoolName = getSchoolName();

            // Action Button Styles
            const actionDisabled = remainingActions <= 0;
            const actionClass = actionDisabled 
                ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
                : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition cursor-pointer";
            
            const skipClass = actionDisabled
                 ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
                 : "bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/50 transition group cursor-pointer";

            const workClass = actionDisabled
                ? "bg-slate-700 p-4 rounded-xl border border-slate-600 flex items-center justify-between opacity-50 cursor-not-allowed"
                : "bg-blue-600 p-4 rounded-xl border border-blue-500 flex items-center justify-between hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 cursor-pointer";

            // University Major Display
            let majorDisplay = "";
            if (game.universityEnrolled) {
                majorDisplay = `<div class="text-sm text-blue-300 mt-1">Major: ${game.major}</div>`;
            }

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                            <i class="fas fa-arrow-left"></i> Back to Occupation
                        </button>
                    </div>

                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 mx-auto mb-3 text-2xl">
                            <i class="fas fa-school"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white">${schoolName}</h2>
                        ${majorDisplay}
                        <p class="text-slate-400 text-sm">Attendance: Full-Time</p>
                        <p class="text-slate-500 text-xs mt-1">Actions Remaining: ${remainingActions}/2</p>
                    </div>

                    <!-- Performance -->
                    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-slate-300 font-bold">Performance</span>
                            <span class="${p > 75 ? 'text-green-400' : p < 25 ? 'text-red-400' : 'text-yellow-400'} font-bold">${p}%</span>
                        </div>
                        <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} transition-all duration-500" style="width: ${p}%"></div>
                        </div>
                    </div>

                    <!-- Actions Grid -->
                    <div class="grid grid-cols-1 gap-3">
                        <button onclick="${actionDisabled ? '' : 'skipSchool()'}" class="${skipClass}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 group-hover:text-red-300">
                                    <i class="fas fa-running"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-bold text-white group-hover:text-red-300">Skip School</h3>
                                    <div class="text-xs text-slate-500">Take a break</div>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right text-slate-600"></i>
                        </button>

                        <button onclick="${actionDisabled ? '' : 'workHarder()'}" class="${workClass}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <i class="fas fa-book-open"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-bold text-white">Work Harder</h3>
                                    <div class="text-xs text-blue-200">Improve grades (+20%)</div>
                                </div>
                            </div>
                            <i class="fas fa-arrow-right text-white"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        function workHarder() {
            if(game.schoolActions >= 2) return;
            game.schoolActions++;
            game.schoolPerformance = Math.min(100, game.schoolPerformance + 20);
            addLog("Studied hard and improved your grades.", 'good');
            renderLifeDashboard();
        }

        function skipSchool() {
            if(game.schoolActions >= 2) return;
            game.schoolActions++;
            game.schoolPerformance = Math.max(0, game.schoolPerformance - 10);
            addLog("Skipped school to hang out. Grades suffered.", 'bad');
            renderLifeDashboard(); 
        }

        // --- UNIVERSITY MODAL LOGIC ---

        function openUniversityModal() {
            // Reset flags
            game.scholarshipTried = false;
            game.parentsTried = false;
            renderUniversityModalContent();
        }

        function renderUniversityModalContent(selectedMajor = null) {
            const m = el('modal-overlay');
            el('modal-title').innerText = "University Enrollment";
            el('modal-content').innerHTML = `
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
            const cashDisabled = game.bank < 40000;
            const cashBtn = `<button onclick="attemptEnrollment('cash')" ${cashDisabled ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded mb-2">Pay Cash ($40k)</button>`;
            
            const loanBtn = `<button onclick="attemptEnrollment('loan')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mb-2">Student Loans</button>`;
            
            // Scholarship Button
            let scholarBtn = "";
            if (game.scholarshipTried) {
                scholarBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">Ineligible</button>`;
            } else {
                scholarBtn = `<button onclick="attemptEnrollment('scholarship')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mb-2">Apply for Scholarship</button>`;
            }

            // Parents Button
            let parentBtn = "";
            if (game.parentsTried) {
                 parentBtn = `<button disabled class="w-full bg-slate-700 opacity-50 text-slate-400 font-bold py-2 rounded mb-2 cursor-not-allowed">They Refused</button>`;
            } else {
                parentBtn = `<button onclick="attemptEnrollment('parents')" class="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded mb-2">Ask Parents to Pay</button>`;
            }

            el('modal-actions').innerHTML = `
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
            const major = el('major-select').value;
            
            if (method === 'cash') {
                game.bank -= 40000;
                enrollSuccess(major, "paid with cash");
            } 
            else if (method === 'loan') {
                game.studentLoans += 40000;
                enrollSuccess(major, "took out student loans");
            }
            else if (method === 'scholarship') {
                const roll = Math.random();
                if (roll < 0.3) {
                    enrollSuccess(major, "received a full scholarship");
                } else {
                    game.scholarshipTried = true;
                    renderUniversityModalContent(major); // Preserve major choice
                }
            }
            else if (method === 'parents') {
                const roll = Math.random();
                if (roll < 0.3) {
                    enrollSuccess(major, "parents paid your tuition");
                } else {
                    game.parentsTried = true;
                    renderUniversityModalContent(major); // Preserve major choice
                }
            }
        }

        function enrollSuccess(major, methodMsg) {
            game.universityEnrolled = true;
            game.major = major;
            game.schoolPerformance = 50;
            
            // Close Modal
            const m = el('modal-overlay');
            m.classList.add('hidden');
            m.classList.remove('flex');

            addLog(`Enrolled in University of ${game.city} for ${major}. You ${methodMsg}.`, 'good');
            updateHeader();
            renderActivities();
        }

        // --- PAGE: OCCUPATION & ACTIVITIES ---

        function renderActivities() {
            updateHeader();
            const isAdult = game.age >= 18;

            let content = '';
            
            // 1. STATUS CARD
            content += `
                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 flex justify-between items-center">
                    <div>
                        <h3 class="text-slate-400 text-xs uppercase font-bold mb-1">Current Status</h3>
                        <div class="text-xl font-bold text-white">
                            ${getStatusText()}
                        </div>
                    </div>
                     <div class="text-right">
                        <h3 class="text-slate-400 text-xs uppercase font-bold mb-1">Residence</h3>
                        <div class="text-sm font-bold text-white">${game.city}</div>
                    </div>
                </div>
            `;

            // 2. CEO ACTIONS (Always top if active)
            if (game.hasBusiness) {
                content += `
                    <div class="mb-6">
                         <h3 class="font-bold text-white mb-2">My Company</h3>
                        <button onclick="enterBusinessMode()" class="w-full btn-primary text-white font-bold py-4 rounded-xl mb-2 flex items-center justify-between px-6 shadow-lg">
                            <span class="flex items-center gap-3"><i class="fas fa-building"></i> Manage ${game.companyName}</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="text-xs text-slate-400 px-1">Go to office to manage production, pricing and staff.</div>
                    </div>
                `;
            }

            // 3. EDUCATION
            if (game.gradSchoolDegree) {
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
            } else if (game.gradSchoolEnrolled) {
                 content += `
                    <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400">
                                    <i class="fas fa-university"></i>
                                </div>
                                <h3 class="font-bold text-white">${game.gradSchoolType}</h3>
                            </div>
                            <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${game.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                                ${game.schoolPerformance}%
                            </div>
                        </div>
                        <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                            <div>
                                <div class="text-sm text-white font-bold">Year ${game.gradSchoolYear + 1}</div>
                                <div class="text-xs text-purple-400">Enrolled</div>
                            </div>
                            <i class="fas fa-chevron-right text-slate-600"></i>
                        </div>
                    </div>
                `;
            } else if (game.universityGraduated) {
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
            } else if (game.age < 5) {
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
            } else if (game.age < 18 || game.highSchoolRetained) {
                 content += `
                    <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400">
                                    <i class="fas fa-school"></i>
                                </div>
                                <h3 class="font-bold text-white">Education</h3>
                            </div>
                            <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${game.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                                ${game.schoolPerformance}%
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
            } else if (game.age >= 18 && !game.highSchoolRetained) {
                if (game.universityEnrolled) {
                     content += `
                        <div onclick="renderEducation()" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 cursor-pointer hover:bg-slate-750 hover:border-blue-500/50 transition">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                    <h3 class="font-bold text-white">University</h3>
                                </div>
                                <div class="px-2 py-1 rounded bg-slate-900 text-xs font-bold ${game.schoolPerformance > 75 ? 'text-green-400' : 'text-yellow-400'}">
                                    ${game.schoolPerformance}%
                                </div>
                            </div>
                            <div class="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                                <div>
                                    <div class="text-sm text-white font-bold">${game.major}</div>
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

            // 4. PART-TIME JOBS
            if (game.age < 15) {
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
            } else {
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

            // 5. CAREERS
            if (game.age < 18) {
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
            } else if (game.jobTitle) {
                // Has Job -> Career Manager
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
                                <div class="text-sm text-white font-bold">${game.jobTitle}</div>
                                <div class="text-xs text-green-400">${formatMoney(game.jobSalary)}/yr</div>
                             </div>
                             <i class="fas fa-chevron-right text-slate-600"></i>
                        </div>
                    </div>
                `;
            } else if (!game.hasBusiness) {
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
            }

            // 6. ENTREPRENEURSHIP
            if (!game.hasBusiness) {
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

            el('game-container').innerHTML = `
                <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
                    <div class="mb-4">
                        <button onclick="renderLifeDashboard()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
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

        // --- ACTIONS ---

        function handleCeoAgeUp() {
            renderBusinessDashboard();
        }

        function ageUp() {
            game.age++;
            game.schoolActions = 0; // Reset school actions every year
            game.careerActionTaken = false; // Reset career actions
            
            // Check if currently student at start of year
            const currentlyStudent = isStudent();

            // Birthday Money Logic (5 to 18)
            if (game.age >= 5 && game.age <= 18) {
                const bdayMoney = Math.floor(Math.random() * 71) + 10; // 10 to 80
                game.bank += bdayMoney;
                addLog(`You received $${bdayMoney} for your birthday!`, 'good');
            }

            // --- LIVING EXPENSES LOGIC ---
            if (game.age >= 19 && !currentlyStudent) {
                game.bank -= 24000; // $2k * 12
                
                if (!game.hasSeenExpenseMsg) {
                    addLog("Your basic living expenses are $2,000 per month.", 'neutral');
                    game.hasSeenExpenseMsg = true;
                }
            }

            // --- Student Loans Logic ---
            // Deduct every year if age >= 23 AND not in grad school
            // Placed before Grad School logic so you don't pay the same year you graduate
            if (game.age >= 23 && game.studentLoans > 0 && !game.gradSchoolEnrolled) {
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
            if (game.age === 18) {
                if (game.schoolPerformance > 25) {
                    addLog("You graduated High School! Enroll in University or find a job.", 'good');
                    game.highSchoolRetained = false;
                } else {
                    addLog("You failed senior year and stay another year in High School. Try working harder.", 'bad');
                    game.highSchoolRetained = true;
                }
            }
            else if (game.age === 19 && game.highSchoolRetained) {
                if (game.schoolPerformance > 25) {
                    addLog("You graduated High School! Enroll in University or find a job.", 'good');
                    game.highSchoolRetained = false;
                } else {
                    addLog("You failed again. One last chance.", 'bad');
                    game.highSchoolRetained = true;
                }
            }
            else if (game.age === 20 && game.highSchoolRetained) {
                addLog("Your high school felt bad and helped you get your GED during evenings. Enroll in University or find a job.", 'green');
                game.highSchoolRetained = false;
            }

            // University Graduation Logic (Age 22)
            if (game.age === 22 && game.universityEnrolled) {
                addLog(`You finished University with a degree in ${game.major}. Time to find a career!`, 'good');
                
                if (game.studentLoans > 0) {
                    addLog("Your student loan payment is $200 per month.", 'neutral');
                }

                game.universityEnrolled = false;
                game.universityGraduated = true;
            }

            // School Transitions (Normal)
            if (game.age === 12) {
                game.schoolPerformance = 50;
                addLog("Started Middle School.", 'neutral');
            } else if (game.age === 14) {
                game.schoolPerformance = 50;
                addLog("Started High School.", 'neutral');
            }

            // Age Specific Events
            if (game.age === 1) addLog("You've discovered building blocks and started throwing them.", 'good');
            else if (game.age === 2) addLog("You learned to walk, mostly into furniture.", 'good');
            else if (game.age === 3) addLog("You drew a masterpiece on the living room wall with crayons.", 'good');
            else if (game.age === 4) addLog("You refused to eat anything green for an entire year.", 'good');
            else if (game.age === 5) addLog("You started Elementary School! Time to learn.", 'good');

            // Random Events for older ages
            else if (game.age < 18) {
                const roll = Math.random();
                if (game.age === 16) {
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
                if (!game.jobTitle && !game.hasBusiness && !game.universityEnrolled && !game.gradSchoolEnrolled && game.age >= 18) {
                     addLog("Unemployed. Savings are dwindling.", 'bad');
                } else {
                     addLog("Another year passes...");
                }
            }
            
            updateHeader();
            renderLifeDashboard();
        }

        // --- PHASE 3: BUSINESS SETUP ---

        function renderBusinessSetup() {
            el('game-container').innerHTML = `
                <div class="fade-in max-w-lg mx-auto">
                    <button onclick="renderActivities()" class="mb-4 text-slate-400 hover:text-white text-sm flex items-center gap-2"><i class="fas fa-arrow-left"></i> Cancel</button>
                    
                    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                        <h2 class="text-2xl font-bold mb-4 text-white">Incorporate Company</h2>
                        
                        <label class="block text-sm font-bold mb-2 text-slate-300">Company Name</label>
                        <input type="text" id="inp-comp-name" class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 mb-6" placeholder="Enter name...">

                        <label class="block text-sm font-bold mb-2 text-slate-300">Select Industry</label>
                        <div class="space-y-3 mb-6">
                            ${Object.keys(INDUSTRIES).map(key => `
                                <div class="industry-card cursor-pointer border border-slate-600 p-4 rounded-lg flex items-center hover:bg-slate-700 transition" onclick="selectIndustry('${key}')" id="ind-${key}">
                                    <div class="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-blue-400 mr-4">
                                        <i class="fas ${INDUSTRIES[key].icon}"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-white">${INDUSTRIES[key].name}</div>
                                        <div class="text-xs text-slate-400">${INDUSTRIES[key].description}</div>
                                        <div class="text-xs text-green-400 font-bold mt-1">Startup Cost: ${formatMoney(INDUSTRIES[key].startupCost)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded mb-6 text-sm text-blue-200">
                            <i class="fas fa-info-circle"></i> Requires <strong>personal capital</strong> to start.
                        </div>

                        <button onclick="initBusiness()" class="w-full btn-primary text-white font-bold py-4 rounded-lg text-lg shadow-lg">Launch Company</button>
                    </div>
                </div>
            `;
            selectIndustry('tech');
        }

        function selectIndustry(key) {
            game.industry = key;
            document.querySelectorAll('.industry-card').forEach(el => {
                el.classList.remove('border-blue-500', 'bg-slate-700');
                el.classList.add('border-slate-600');
            });
            const selected = el(`ind-${key}`);
            selected.classList.remove('border-slate-600');
            selected.classList.add('border-blue-500', 'bg-slate-700');
        }

        function initBusiness() {
            const name = el('inp-comp-name').value;
            if (!name) return showModal("Error", "Enter a company name.");
            
            const ind = INDUSTRIES[game.industry];
            
            if (game.bank < ind.startupCost) {
                return showModal("Insufficient Funds", `You need ${formatMoney(ind.startupCost)} to start this business. You currently have ${formatMoney(game.bank)}.`);
            }
            
            // Deduct cost from personal bank
            game.bank -= ind.startupCost;
            
            game.companyName = name;
            game.hasBusiness = true;
            game.compCash = ind.startupCost; // Capital Injection
            game.quarter = 1;
            
            // Set Defaults
            game.salaryOffer = ind.baseSalary;
            game.sellingPrice = ind.unitPrice;
            game.productionTarget = Math.floor(ind.baseDemand * 0.8);

            addLog(`Founded ${name} (${ind.name})! Invested ${formatMoney(ind.startupCost)}.`, 'good');
            renderBusinessDashboard();
        }

        // --- PHASE 4: BUSINESS DASHBOARD (The Core Loop) ---

        function enterBusinessMode() {
            renderBusinessDashboard();
        }

        function renderBusinessDashboard() {
            const ind = INDUSTRIES[game.industry];
            
            // Input Ranges
            const minPrice = Math.floor(ind.unitPrice * 0.5);
            const maxPrice = Math.floor(ind.unitPrice * 3.0);
            const maxProd = Math.floor(game.compCash / ind.unitCost);

            el('game-container').innerHTML = `
                <div class="fade-in pb-20 max-w-2xl mx-auto">
                    
                    <!-- Top Bar for Business Mode -->
                    <div class="flex justify-between items-center mb-4">
                        <button onclick="renderActivities()" class="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                            <i class="fas fa-arrow-left"></i> Occupation
                        </button>
                        <div class="text-right">
                             <div class="text-xs text-slate-400">Company Cash</div>
                             <div class="text-xl font-bold text-green-400">${formatMoney(game.compCash)}</div>
                        </div>
                    </div>

                    <div class="mb-6 flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div>
                            <h2 class="text-xl font-bold text-white">${game.companyName}</h2>
                            <div class="text-xs text-slate-400">Fiscal Year ${game.year} - Q${game.quarter}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-bold text-white">${game.employees} Employees</div>
                            <div class="text-xs text-slate-400">Rep: ${game.reputation}%</div>
                        </div>
                    </div>

                    <!-- LIVE PREVIEW BOX -->
                    <div class="bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-xl mb-6 shadow-inner">
                        <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 border-b border-indigo-500/30 pb-2">
                            <i class="fas fa-calculator mr-1"></i> Quarterly Projection
                        </h3>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between text-slate-400">
                                <span>Est. Revenue</span> <span id="proj-rev" class="text-green-400 font-mono">$0</span>
                            </div>
                            <div class="flex justify-between text-slate-400">
                                <span>Prod. Costs</span> <span id="proj-cost" class="text-red-300 font-mono">$0</span>
                            </div>
                            <div class="flex justify-between text-slate-400">
                                <span>Employee Wages</span> <span id="proj-wages" class="text-red-300 font-mono">$0</span>
                            </div>
                             <div class="flex justify-between text-slate-400">
                                <span>CEO Salary (You)</span> <span id="proj-ceo" class="text-red-300 font-mono">$0</span>
                            </div>
                            <div class="border-t border-indigo-500/30 my-2 pt-2 flex justify-between font-bold">
                                <span class="text-white">Est. Net Profit</span>
                                <span id="proj-profit" class="text-white">$0</span>
                            </div>
                        </div>
                    </div>

                    <!-- CONTROLS -->
                    <div class="space-y-6">
                        
                        <!-- Production -->
                        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="font-bold"><i class="fas fa-industry text-slate-400 mr-2"></i> Production Units</h3>
                                <input type="number" id="num-prod" class="num-input" value="${game.productionTarget}" min="0" oninput="syncFromInput('prod')">
                            </div>
                            <input type="range" id="rng-prod" min="0" max="${Math.max(20000, maxProd)}" value="${game.productionTarget}" oninput="syncFromSlider('prod')">
                            <div class="text-xs text-slate-500 text-right mt-1">Inventory: ${game.inventory}</div>
                        </div>

                        <!-- Price -->
                        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="font-bold"><i class="fas fa-tag text-slate-400 mr-2"></i> Price ($)</h3>
                                <input type="number" id="num-price" class="num-input" value="${game.sellingPrice}" min="1" oninput="syncFromInput('price')">
                            </div>
                            <input type="range" id="rng-price" min="${minPrice}" max="${maxPrice}" value="${game.sellingPrice}" oninput="syncFromSlider('price')">
                             <div class="text-center mt-2 text-xs" id="price-impact"></div>
                        </div>

                        <!-- Employee Wages -->
                        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="font-bold"><i class="fas fa-users text-slate-400 mr-2"></i> Emp. Salary/Mo</h3>
                                <input type="number" id="num-salary" class="num-input" value="${game.salaryOffer}" min="1000" step="100" oninput="syncFromInput('salary')">
                            </div>
                            <input type="range" id="rng-salary" min="${Math.floor(ind.baseSalary * 0.5)}" max="${ind.baseSalary * 2}" step="100" value="${game.salaryOffer}" oninput="syncFromSlider('salary')">
                        </div>

                        <!-- CEO Salary (New) -->
                        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="font-bold"><i class="fas fa-user-tie text-slate-400 mr-2"></i> Your Salary/Mo</h3>
                                <input type="number" id="num-ceo" class="num-input" value="${game.ceoSalary}" min="0" step="500" oninput="syncFromInput('ceo')">
                            </div>
                            <input type="range" id="rng-ceo" min="0" max="50000" step="500" value="${game.ceoSalary}" oninput="syncFromSlider('ceo')">
                            <div class="text-xs text-slate-500 mt-2">Goes to your personal bank account.</div>
                        </div>

                    </div>

                    <button onclick="processQuarter()" class="w-full btn-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg mt-6 mb-4">
                        End Quarter <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            `;
            updateCalculations();
        }

        // --- SYNC INPUTS AND SLIDERS ---
        function syncFromSlider(type) {
            const val = el(`rng-${type}`).value;
            el(`num-${type}`).value = val;
            updateCalculations();
        }
        function syncFromInput(type) {
            const val = el(`num-${type}`).value;
            el(`rng-${type}`).value = val;
            updateCalculations();
        }

        function updateCalculations() {
            // Update State from Inputs
            game.productionTarget = parseInt(el('num-prod').value) || 0;
            game.sellingPrice = parseInt(el('num-price').value) || 0;
            game.salaryOffer = parseInt(el('num-salary').value) || 0;
            game.ceoSalary = parseInt(el('num-ceo').value) || 0;

            const ind = INDUSTRIES[game.industry];
            const supplier = SUPPLIERS.find(s => s.id === game.supplierId);

            // Costs
            const prodCost = game.productionTarget * (ind.unitCost * supplier.costMod);
            const empWages = game.employees * game.salaryOffer * 3; // 3 months
            const ceoWages = game.ceoSalary * 3;
            const fixedCosts = 10000;
            const totalExp = prodCost + empWages + ceoWages + fixedCosts;

            // Demand Estimate
            const priceFactor = Math.pow((ind.unitPrice / game.sellingPrice), 1.5);
            const repFactor = 0.5 + (game.reputation / 100);
            const estDemand = Math.floor(ind.baseDemand * repFactor * priceFactor);
            
            // Revenue Estimate
            const estSold = Math.min(game.inventory + game.productionTarget, estDemand);
            const estRev = estSold * game.sellingPrice;
            const estProfit = estRev - totalExp;

            // Update UI
            el('proj-rev').innerText = formatMoney(estRev);
            el('proj-cost').innerText = "-" + formatMoney(prodCost);
            el('proj-wages').innerText = "-" + formatMoney(empWages);
            el('proj-ceo').innerText = "-" + formatMoney(ceoWages);
            el('proj-profit').innerText = (estProfit >= 0 ? "+" : "") + formatMoney(estProfit);
            el('proj-profit').className = estProfit >= 0 ? "text-green-400 font-bold font-mono" : "text-red-400 font-bold font-mono";

            const priceRatio = ind.unitPrice / game.sellingPrice;
            const impactEl = el('price-impact');
            if(priceRatio > 1.1) impactEl.innerHTML = `<span class="text-green-400">Cheap (High Demand)</span>`;
            else if (priceRatio < 0.9) impactEl.innerHTML = `<span class="text-red-400">Expensive (Low Demand)</span>`;
            else impactEl.innerHTML = `<span class="text-slate-400">Fair Price</span>`;
        }

        // --- BUSINESS TURN LOGIC ---

        function processQuarter() {
            const ind = INDUSTRIES[game.industry];
            const supplier = SUPPLIERS.find(s => s.id === game.supplierId);

            // 1. Pay Expenses
            const prodCost = game.productionTarget * (ind.unitCost * supplier.costMod);
            const empWages = game.employees * game.salaryOffer * 3;
            const ceoWages = game.ceoSalary * 3;
            const fixedCosts = 10000;
            const totalExp = prodCost + empWages + ceoWages + fixedCosts;

            if (totalExp > game.compCash) {
                return showModal("Bankruptcy Risk", "Company has insufficient funds! Reduce production or salaries.");
            }

            game.compCash -= totalExp;
            
            // PAY THE PLAYER
            game.bank += ceoWages;

            // 2. Determine Sales
            const priceFactor = Math.pow((ind.unitPrice / game.sellingPrice), 1.5);
            const repFactor = 0.5 + (game.reputation / 100);
            const volatility = 1 + ((Math.random() - 0.5) * ind.volatility * 2);
            const actualDemand = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility);

            const available = game.inventory + game.productionTarget;
            const sold = Math.min(available, actualDemand);
            game.inventory = available - sold;
            
            const revenue = sold * game.sellingPrice;
            game.compCash += revenue;
            const profit = revenue - totalExp;

            // 3. Reputation & Morale
            if (available < actualDemand) game.reputation -= 2;
            else game.reputation += 1;
            game.reputation = Math.max(0, Math.min(100, game.reputation));

            // 4. Log
            game.history.push({ year: game.year, quarter: game.quarter, profit, revenue });

            // 5. Advance Time
            game.quarter++;
            if (game.quarter > 4) {
                game.quarter = 1;
                game.year++; // Fiscal year ends
                game.age++; // Character Ages Up automatically when business year ends
                
                // Check if currently student at start of year
                const currentlyStudent = isStudent();

                // --- LIVING EXPENSES LOGIC ---
                if (game.age >= 19 && !currentlyStudent) {
                    game.bank -= 24000; // $2k * 12
                    
                    if (!game.hasSeenExpenseMsg) {
                        addLog("Your basic living expenses are $2,000 per month.", 'neutral');
                        game.hasSeenExpenseMsg = true;
                    }
                }

                // Student Loan Deduction Logic for CEO
                if (game.age >= 23 && game.studentLoans > 0 && !game.gradSchoolEnrolled) {
                    const yearlyPayment = 2400; 
                    game.bank -= yearlyPayment;
                }

                addLog(`Fiscal Year ${game.year-1} complete. Salary earned: ${formatMoney(ceoWages*4)}`, 'good');
                
                // Show Annual Report then go back to Life
                showModal(
                    "Annual Report", 
                    `Year ${game.year-1} Complete.<br>
                    <strong>Company Cash:</strong> ${formatMoney(game.compCash)}<br>
                    <strong>Your Bank:</strong> ${formatMoney(game.bank)}<br><br>
                    You are now Age ${game.age}.`,
                    "Return to Life View",
                    () => renderLifeDashboard()
                );
            } else {
                renderBusinessDashboard(); // Next quarter
            }
        }

        // Init
        window.onload = renderCharCreation;