import { state } from '../../core/state.js';
import { renderActivities } from './occupationScreen.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { CAREER_TRACKS, PART_TIME_JOBS } from '../../core/main.js';

const get = id => document.getElementById(id);

// ─── INTERVIEW QUESTIONS ──────────────────────────────────────────────────────

const INTERVIEW_QUESTIONS = [
    // General — for no-degree tracks and part-time jobs
    {
        category: 'general',
        question: 'A customer complains loudly that their order is wrong. What do you do first?',
        options: ['Argue that it was correct', 'Apologize and offer to fix it', 'Call your manager immediately', 'Ignore them until they calm down'],
        correct: 1
    },
    {
        category: 'general',
        question: 'You realize you made a mistake at work. What is the best response?',
        options: ['Hope no one notices', 'Blame a coworker', 'Tell your supervisor and work to fix it', 'Quit to avoid the situation'],
        correct: 2
    },
    {
        category: 'general',
        question: 'A coworker asks you to cover their shift on short notice. You have no plans. What do you do?',
        options: ['Refuse without explanation', 'Agree to help out', 'Demand they pay you', 'Tell HR about the request'],
        correct: 1
    },
    {
        category: 'general',
        question: 'Your manager gives you feedback you disagree with. How do you respond?',
        options: ['Argue loudly in front of coworkers', 'Listen, ask questions, then share your view calmly', 'Ignore the feedback entirely', 'Complain to other coworkers'],
        correct: 1
    },
    {
        category: 'general',
        question: 'It is a slow day and you have finished your tasks. What do you do?',
        options: ['Take a nap in the back room', 'Browse your phone all day', 'Find something productive or ask if you can help elsewhere', 'Leave early without telling anyone'],
        correct: 2
    },
    {
        category: 'general',
        question: 'You notice a safety hazard on the floor. What do you do?',
        options: ['Step around it and carry on', 'Wait for someone else to deal with it', 'Report it and block the area if possible', 'Ignore it — it probably will not cause a problem'],
        correct: 2
    },
    {
        category: 'general',
        question: 'A teammate is clearly struggling with their workload. You are ahead on your own tasks. What do you do?',
        options: ['Do nothing — it is their problem', 'Offer to help with some of their work', 'Report them to management for being slow', 'Tell them to work faster'],
        correct: 1
    },
    {
        category: 'general',
        question: 'You are running 10 minutes late to your shift. What is the right move?',
        options: ['Hope no one notices', 'Call or text your supervisor to let them know', 'Just show up and apologize when you arrive', 'Call in sick instead'],
        correct: 1
    },
    {
        category: 'general',
        question: 'You do not fully understand a task your supervisor assigned you. What do you do?',
        options: ['Guess and hope for the best', 'Ask your supervisor to clarify before starting', 'Ask a coworker to do it for you', 'Skip the task and say you forgot'],
        correct: 1
    },
    {
        category: 'general',
        question: 'You finish all your assigned work with an hour left in your shift. What do you do?',
        options: ['Pack up and head home', 'Sit and wait for the clock to run out', 'Let your manager know and ask what else needs doing', 'Start working on your personal projects'],
        correct: 2
    },
    // Professional — for degree-required and grad tracks
    {
        category: 'professional',
        question: 'You are given two urgent projects with the same deadline. What is the best approach?',
        options: ['Pick one and ignore the other', 'Inform your manager and ask for guidance on priorities', 'Do both halfway and submit them', 'Ask a colleague to handle one without telling anyone'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'A client is unhappy with your work and has sent a strongly worded email. How do you handle it?',
        options: ['Reply telling them they are wrong', 'Listen, understand their concerns, and propose a solution', 'Escalate to your manager without responding', 'Offer a full refund without any discussion'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'What does maintaining confidentiality in the workplace mean?',
        options: ['Only share information with friends you trust', 'Keep sensitive information private and only share with authorized people', 'Write everything down for your personal records', 'Post general updates on social media'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'You notice a colleague is not following the correct procedure for an important task. What do you do?',
        options: ['Ignore it — not your responsibility', 'Mention it to them privately, then escalate if it continues', 'Report them to management immediately', 'Start doing the same to fit in with the team'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'You do not know the answer to a question asked in a client meeting. What do you do?',
        options: ['Make something up confidently', 'Say you will find out and follow up promptly', 'Change the subject', 'Answer a different question instead'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'There is a conflict between you and a coworker affecting your work. How do you resolve it?',
        options: ['Avoid them permanently', 'Address it professionally and directly, or involve HR if necessary', 'Gossip with other coworkers about it', 'Quit and find a new job'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'You receive an email from an unknown sender with an unexpected attachment. What should you do?',
        options: ['Open the attachment right away', 'Forward it to IT or delete it without opening', 'Reply to ask who they are first', 'Open it on your personal phone instead'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'Which best describes professional conduct in the workplace?',
        options: ['Wearing a suit every day regardless of dress code', 'Acting responsibly, respectfully, and ethically at all times', 'Always agreeing with your boss to avoid conflict', 'Being available and responding to messages 24/7'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'You disagree with a decision made by your team. What is the appropriate response?',
        options: ['Refuse to participate in the project', 'Voice your concern respectfully, then support the team\'s decision', 'Complain to upper management about your teammates', 'Quietly undermine the decision as the project proceeds'],
        correct: 1
    },
    {
        category: 'professional',
        question: 'Your project is running behind schedule. What should you do?',
        options: ['Stay silent and hope to catch up in time', 'Flag it to your manager early with a revised timeline', 'Submit whatever is done by the deadline and apologize', 'Blame unexpected obstacles in a team meeting'],
        correct: 1
    }
];

// ─── INTERVIEW STATE ──────────────────────────────────────────────────────────

let _pendingInterview = null;
// Shape: { type: 'career'|'parttime', trackKey, title, salary, seenQuestions: [], correctAnswer }

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getTrackWarnings(track, user) {
    const warnings = [];
    if (track.reqGrad && user.gradSchoolDegree !== track.reqGrad)
        warnings.push(`Requires ${track.reqGrad}`);
    if (track.reqDegree && !user.universityGraduated)
        warnings.push('University Degree Required');
    if (track.reqMajors && user.universityGraduated && !track.reqMajors.includes(user.major))
        warnings.push(`Major: ${track.reqMajors.join(' or ')}`);
    return warnings;
}

function isTrackLocked(track, user) {
    if (track.reqGrad && user.gradSchoolDegree !== track.reqGrad) return true;
    if (track.reqDegree && !user.universityGraduated) return true;
    if (track.reqMajors && user.universityGraduated && !track.reqMajors.includes(user.major)) return true;
    if (track.reqMajors && !user.universityGraduated) return true;
    return false;
}

function _pickQuestion(category) {
    const pool = INTERVIEW_QUESTIONS
        .map((q, i) => ({ ...q, idx: i }))
        .filter(q => q.category === category && !_pendingInterview.seenQuestions.includes(q.idx));
    if (!pool.length) {
        // All questions seen — reset and pick from full pool
        _pendingInterview.seenQuestions = [];
        return _pickQuestion(category);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function _showInterviewModal(question, jobLabel) {
    const letterLabels = ['A', 'B', 'C', 'D'];
    const answersHtml = question.options.map((opt, i) => `
        <button data-action="answerInterview" data-args="${i}"
            class="w-full text-left bg-slate-700 hover:bg-blue-700 text-white text-sm font-medium py-3 px-4 rounded-xl transition mb-2 flex items-start gap-3">
            <span class="text-blue-400 font-bold min-w-[1.25rem]">${letterLabels[i]}</span>
            <span>${opt}</span>
        </button>
    `).join('');

    UI.showCustomModal('Job Interview', `
        <div>
            <p class="text-xs text-slate-400 uppercase font-bold mb-1 tracking-wider">Interviewing for</p>
            <p class="text-blue-300 font-semibold mb-4">${jobLabel}</p>
            <div class="bg-slate-900 rounded-xl p-4 mb-5">
                <p class="text-white font-medium leading-snug">${question.question}</p>
            </div>
            ${answersHtml}
        </div>
    `);
}

function _hireCareer(trackKey) {
    const user = state.gameState.user;
    const track = CAREER_TRACKS.find(t => t.key === trackKey);
    const entry = track.levels[0];
    user.careerTrack          = trackKey;
    user.careerLevel          = 0;
    user.yearsInRole          = 0;
    user.consecutivePoorYears = 0;
    user.jobTitle             = entry.title;
    user.jobSalary            = entry.salary;
    user.jobPerformance       = 50;
    user.careerActionTaken    = false;
    user.hasSeenJobSalary     = true;
    addLog(`Hired as ${entry.title} in ${track.label}! Starting salary: ${Utils.formatMoney(entry.salary)}/yr.`, 'good');
}

function _hirePartTime(title, salary) {
    const user = state.gameState.user;
    user.jobTitle          = title;
    user.jobSalary         = salary;
    user.jobPerformance    = 50;
    user.careerActionTaken = false;
    user.hasSeenJobSalary  = true;
    addLog(`Hired as ${title}! Annual pay: ${Utils.formatMoney(salary)}.`, 'good');
}

function startCareerInterview(trackKey) {
    const track = CAREER_TRACKS.find(t => t.key === trackKey);
    const category = (!track.reqDegree && !track.reqGrad) ? 'general' : 'professional';
    const question = _pickQuestion(category);
    _pendingInterview.seenQuestions.push(question.idx);
    _pendingInterview.correctAnswer = question.correct;
    _showInterviewModal(question, track.label);
}

function startPartTimeInterview(title, salary) {
    const question = _pickQuestion('general');
    _pendingInterview.seenQuestions.push(question.idx);
    _pendingInterview.correctAnswer = question.correct;
    _showInterviewModal(question, title);
}

// ─── CAREER MARKET ───────────────────────────────────────────────────────────

export function renderCareerMarket() {
    const user = state.gameState.user;

    const buildSection = (label, tracks) => {
        if (!tracks.length) return '';
        const cards = tracks.map(track => {
            const isCurrent = user.careerTrack === track.key;
            const locked = !isCurrent && isTrackLocked(track, user);
            const warnings = getTrackWarnings(track, user);
            const entry = track.levels[0];

            const warningHtml = warnings.length
                ? `<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-lock mr-1"></i>${warnings.join(', ')}</div>`
                : '';

            let btn;
            if (isCurrent) {
                btn = `<span class="text-xs font-bold py-2 px-4 rounded-lg bg-green-600/20 text-green-400 border border-green-600/50">Current</span>`;
            } else if (locked) {
                btn = `<span class="text-xs font-bold py-2 px-4 rounded-lg bg-slate-700 text-slate-500 cursor-not-allowed">Locked</span>`;
            } else {
                btn = `<button data-action="applyForCareerTrack" data-args="&apos;${track.key}&apos;" class="text-xs font-bold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition">Apply</button>`;
            }

            return `
                <div class="bg-slate-800 p-4 rounded-xl border ${isCurrent ? 'border-green-500/30' : locked ? 'border-slate-700 opacity-60' : 'border-slate-700'} mb-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                                <i class="fas ${track.icon}"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white">${track.label}</h3>
                                <div class="text-xs text-green-400">Starting: ${Utils.formatMoney(entry.salary)}/yr</div>
                                <div class="text-[10px] text-slate-500">${track.levels.length} levels · ${entry.title}</div>
                                ${warningHtml}
                            </div>
                        </div>
                        ${btn}
                    </div>
                </div>`;
        }).join('');
        return `<h3 class="text-slate-400 font-bold text-xs uppercase mb-3 mt-5 pl-1 flex items-center gap-2"><i class="fas fa-layer-group"></i> ${label}</h3>${cards}`;
    };

    const noDegree  = CAREER_TRACKS.filter(t => !t.reqDegree && !t.reqGrad);
    const withMajor = CAREER_TRACKS.filter(t => t.reqDegree && !t.reqGrad);
    const gradReq   = CAREER_TRACKS.filter(t => !!t.reqGrad);

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Occupation
                </button>
            </div>
            <h2 class="text-2xl font-bold mb-2 px-1">Find a Career</h2>
            <p class="text-xs text-slate-500 px-1 mb-4">Each track has 5 levels. Perform well to get promoted.</p>
            <div class="flex-1 overflow-y-auto pb-4">
                ${buildSection('No Degree Required', noDegree)}
                ${buildSection('University Degree + Major', withMajor)}
                ${buildSection('Graduate School Required', gradReq)}
            </div>
        </div>
    `;
}

// ─── APPLY FOR CAREER TRACK ──────────────────────────────────────────────────

export function applyForCareerTrack(trackKey) {
    const user = state.gameState.user;
    const track = CAREER_TRACKS.find(t => t.key === trackKey);
    if (!track) return;

    if (track.reqGrad && user.gradSchoolDegree !== track.reqGrad)
        return UI.showModal('Qualifications Missing', `This career requires ${track.reqGrad}.`);
    if (track.reqDegree && !user.universityGraduated)
        return UI.showModal('Qualifications Missing', 'This career requires a University Degree.');
    if (track.reqMajors && !track.reqMajors.includes(user.major))
        return UI.showModal('Wrong Major', `${track.label} requires a degree in ${track.reqMajors.join(' or ')}.`);

    _pendingInterview = { type: 'career', trackKey, title: null, salary: null, seenQuestions: [], correctAnswer: null };
    startCareerInterview(trackKey);
}

// ─── APPLY FOR PART-TIME JOB ─────────────────────────────────────────────────

export function applyForJob(title, salary) {
    const user = state.gameState.user;
    const jobDef = PART_TIME_JOBS.find(j => j.title === title);
    if (jobDef?.reqUniversity && !user.universityEnrolled && !user.universityGraduated) {
        return UI.showModal('Not Eligible', 'This job requires university enrollment or a degree.');
    }
    if (jobDef?.minAge && user.age < jobDef.minAge) {
        return UI.showModal('Not Eligible', `This job requires you to be at least ${jobDef.minAge} years old.`);
    }
    _pendingInterview = { type: 'parttime', trackKey: null, title, salary, seenQuestions: [], correctAnswer: null };
    startPartTimeInterview(title, salary);
}

// ─── INTERVIEW ANSWER HANDLER ─────────────────────────────────────────────────

export function answerInterview(answerIdx) {
    if (!_pendingInterview) return;
    const user = state.gameState.user;

    if (answerIdx === _pendingInterview.correctAnswer) {
        // ── Correct ──────────────────────────────────────────────────────────
        if (_pendingInterview.type === 'career') {
            _hireCareer(_pendingInterview.trackKey);
        } else {
            _hirePartTime(_pendingInterview.title, _pendingInterview.salary);
        }
        _pendingInterview = null;
        UI.hideModal();
        renderActivities();
    } else {
        // ── Wrong — deduct course cost and offer retry ────────────────────────
        const courseCost = Math.min(200, user.money);
        user.money -= courseCost;

        const costNote = courseCost > 0
            ? `You spent ${Utils.formatMoney(courseCost)} on an online course to sharpen your interview skills.`
            : 'You found a free online course to help prepare for your next attempt.';

        UI.showCustomModal('Not Hired', `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-times text-red-400 text-2xl"></i>
                </div>
                <p class="text-white font-semibold mb-2">You didn't get the job.</p>
                <p class="text-slate-400 text-sm mb-5">${costNote}</p>
                <div class="grid grid-cols-2 gap-3">
                    <button data-action="retryInterview"
                        class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition">
                        Try Again
                    </button>
                    <button data-action="hideModal"
                        class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
                        Close
                    </button>
                </div>
            </div>
        `);
    }
}

export function retryInterview() {
    if (!_pendingInterview) return;
    if (_pendingInterview.type === 'career') {
        startCareerInterview(_pendingInterview.trackKey);
    } else {
        startPartTimeInterview(_pendingInterview.title, _pendingInterview.salary);
    }
}
