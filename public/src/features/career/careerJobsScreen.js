import { state, hasPurchasedPack } from '../../core/state.js';
import { renderActivities } from './occupationScreen.js';
import { addLog } from '../player/mainScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { saveGame } from '../../core/main.js';
import { CAREER_TRACKS, PART_TIME_JOBS, SPECIAL_CAREER_TRACKS, PRO_SPORTS_LEAGUES } from '../../core/constants.js';
import { GameLogic } from '../../core/gameLogic.js';
import { isTrackLocked, getTrackWarnings } from '../../core/recommendations.js';
import { SoundManager } from '../../core/soundManager.js';

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
// Career eligibility rules (HIGH_TRUST_TRACKS, hasFelonyRecord, isTrackLocked,
// getTrackWarnings) live in core/recommendations.js so the desktop "Next Steps"
// panel and this Career Market always agree.

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
            <button data-action="hideModal" class="w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold py-2.5 rounded-xl transition mt-2 border border-slate-700">
                <i class="fas fa-times mr-1"></i> Walk Away from Interview
            </button>
        </div>
    `, {
        showCloseBtn: true
    });
}

function _hireCareer(trackKey) {
    const user = state.gameState.user;
    const track = CAREER_TRACKS.find(t => t.key === trackKey);
    const bonuses = GameLogic.getCareerSkillBonuses
        ? GameLogic.getCareerSkillBonuses(user, trackKey)
        : { startingLevel: 0, salaryMultiplier: 1.0, fastTracked: false, matchedSkill: null };
    const startLevel = Math.min(bonuses.startingLevel || 0, track.levels.length - 1);
    const entry = track.levels[startLevel];
    const baseScaled = GameLogic.calculateScaledSalary(entry.salary, user.city);
    const scaledSalary = Math.floor(baseScaled * (bonuses.salaryMultiplier || 1.0));
    user.careerTrack          = trackKey;
    user.careerLevel          = startLevel;
    user.yearsInRole          = 0;
    user.yearsInCareer        = 0;
    user.consecutivePoorYears = 0;
    user.jobTitle             = entry.title;
    user.jobSalary            = scaledSalary;
    user.jobPerformance       = 50;
    user.careerActionTaken    = false;
    user.hasSeenJobSalary     = true;
    GameLogic.adjustStat(user, 'happiness', 15);
    const skillNote = bonuses.fastTracked
        ? ` Fast-tracked to Level 2 with +20% skill bonus!`
        : (bonuses.salaryMultiplier > 1.0 ? ` Includes +${Math.round((bonuses.salaryMultiplier - 1) * 100)}% skill salary bonus!` : '');
    addLog(`Hired as ${entry.title} in ${track.label}! Starting salary: ${Utils.formatMoney(scaledSalary)}/yr.${skillNote} (+15 Happiness)`, 'good');
    UI.updateHeader(user);
}

function _hirePartTime(title, salary) {
    const user = state.gameState.user;
    user.jobTitle          = title;
    user.jobSalary         = salary;
    user.jobPerformance    = 50;
    user.yearsInCareer     = 0;
    user.careerActionTaken = false;
    user.hasSeenJobSalary  = true;
    GameLogic.adjustStat(user, 'happiness', 10);
    addLog(`Hired as ${title}! Annual pay: ${Utils.formatMoney(salary)}. (+10 Happiness)`, 'good');
    UI.updateHeader(user);
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
            const bonuses = GameLogic.getCareerSkillBonuses
                ? GameLogic.getCareerSkillBonuses(user, track.key)
                : { startingLevel: 0, salaryMultiplier: 1.0, fastTracked: false, unlockedByCert: null };
            const startLevel = Math.min(bonuses.startingLevel || 0, track.levels.length - 1);
            const entry = track.levels[startLevel];
            const baseScaled = GameLogic.calculateScaledSalary(entry.salary, user.city);
            const scaledSalary = Math.floor(baseScaled * (bonuses.salaryMultiplier || 1.0));

            const unlockSkills = (locked && !track.reqGrad && GameLogic.getCareerUnlockingSkills)
                ? GameLogic.getCareerUnlockingSkills(track.key)
                : [];
            const certHint = unlockSkills.length
                ? ` <span class="text-indigo-400">(or ${unlockSkills[0].certificateTitle} in More &rarr; Skills)</span>`
                : '';

            const warningHtml = warnings.length
                ? `<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-lock mr-1"></i>${warnings.join(', ')}${certHint}</div>`
                : '';

            const certUnlockBadge = (!locked && bonuses.unlockedByCert && (!user.universityGraduated || (track.reqMajors && !track.reqMajors.includes(user.major))))
                ? `<div class="text-[10px] text-indigo-300 font-semibold mt-0.5"><i class="fas fa-certificate mr-1"></i>Unlocked via ${bonuses.unlockedByCert.certificateTitle}</div>`
                : '';

            const skillBonusBadge = (!locked && (bonuses.fastTracked || bonuses.salaryMultiplier > 1.0))
                ? `<div class="text-[10px] text-emerald-400 font-semibold mt-0.5"><i class="fas fa-bolt mr-1"></i>+${Math.round((bonuses.salaryMultiplier - 1) * 100)}% Skill Pay${bonuses.fastTracked ? ` · Starts at Level 2 (${entry.title})` : ''}</div>`
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
                                <div class="text-xs text-green-400">Starting: ${Utils.formatMoney(scaledSalary)}/yr</div>
                                <div class="text-[10px] text-slate-500">${track.levels.length} levels · ${entry.title}</div>
                                ${certUnlockBadge}
                                ${skillBonusBadge}
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

    UI.updateBottomNav('work');
    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <div class="mb-4">
                <button data-action="renderActivities" class="text-slate-400 hover:text-white text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50">
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

    const hasSkillCert = GameLogic.hasCareerSkillCertification ? GameLogic.hasCareerSkillCertification(user, trackKey) : null;
    if (!hasSkillCert) {
        if (track.reqDegree && !user.universityGraduated)
            return UI.showModal('Qualifications Missing', 'This career requires a University Degree (or a matching Master Certification from Skills & Courses).');
        if (track.reqMajors && !track.reqMajors.includes(user.major))
            return UI.showModal('Wrong Major', `${track.label} requires a degree in ${track.reqMajors.join(' or ')} (or a matching Master Certification from Skills & Courses).`);
    }

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
        SoundManager.play('milestone');
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
        const courseCost = Math.min(200, Math.max(0, user.money));
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

// ─── JOIN SPECIAL CAREER ─────────────────────────────────────────────────────

export function joinSpecialCareer(trackKey) {
    const user = state.gameState.user;
    if (user.careerTrack === trackKey) return; // Already in it

    const track = SPECIAL_CAREER_TRACKS.find(t => t.key === trackKey);
    if (!track) return;

    if (track.premiumPack && !hasPurchasedPack(track.premiumPack)) {
        if (trackKey === 'pro_athlete') {
            UI.showModal("Athlete Pack Required", "You must unlock the Athlete & Pro Sports Expansion Pack in The Spot store to draft into professional sports leagues.");
        } else {
            UI.showModal("Syndicate Expansion Required", "You must unlock the Mafia Syndicate Expansion Pack in The Spot store to join organized crime.");
        }
        return;
    }

    if (trackKey === 'pro_athlete') {
        if ((user.age || 0) < 18) {
            UI.showModal("Too Young for Pro Sports", "Professional sports leagues require you to be at least 18 years old. Focus on school and hone your skills in Workshops & Courses!");
            return;
        }
        openProSportsEntryModal('football');
        return;
    }

    // Prerequisite check for Mafia: at least 3 lifetime crimes from the Crime section
    if (trackKey === 'mafia_syndicate') {
        const crimes = user.lifetimeCrimesCommitted || 0;
        if (crimes < 3) {
            UI.showModal(
                "Not Reputable Enough",
                `<div class="text-center space-y-3">
                    <div class="text-4xl">🧼</div>
                    <h4 class="text-base font-bold text-amber-400">You're too squeaky clean to join!</h4>
                    <p class="text-xs text-slate-300">Get your hands dirty first. You must commit at least <strong>3 crimes</strong> from the Crime section in <strong>More Options</strong> before La Cosa Nostra will even talk to you.</p>
                    <div class="text-xs font-bold text-slate-400">Crimes Committed: <span class="text-red-400">${crimes} / 3</span></div>
                </div>`
            );
            return;
        }
    }

    const level = track.levels[0];
    const modalHtml = `
        <div class="text-left space-y-4">
            <div class="bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-red-900/80 border border-red-500 flex items-center justify-center text-red-400 text-2xl shrink-0">
                    <i class="fas ${track.icon}"></i>
                </div>
                <div>
                    <h4 class="font-bold text-white text-sm">${track.label}</h4>
                    <div class="text-xs text-red-300 font-semibold">Starting Rank: ${level.title} (${Utils.formatMoney(level.salary)}/yr)</div>
                </div>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to take this job and join <strong>${track.label}</strong>? Once initiated, you will be expected to complete <strong>3 syndicate crimes every year</strong> or face severe beatings and loss of pay.
            </p>
            <div class="flex gap-2 pt-2 border-t border-slate-700">
                <button data-action="confirmJoinSpecialCareer" data-args="&apos;${trackKey}&apos;" class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                    Accept Position & Swear Oath
                </button>
                <button data-action="hideModal" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg text-xs transition">
                    Decline
                </button>
            </div>
        </div>
    `;

    UI.showCustomModal(`Confirm Job: ${track.label}`, modalHtml);
}

export function confirmJoinSpecialCareer(trackKey) {
    const user = state.gameState.user;
    UI.hideModal();

    const track = SPECIAL_CAREER_TRACKS.find(t => t.key === trackKey);
    if (!track) return;

    if (track.premiumPack && !hasPurchasedPack(track.premiumPack)) {
        UI.showModal("Syndicate Expansion Required", "You must unlock the Mafia Syndicate Expansion Pack in The Spot store to join organized crime.");
        return;
    }

    user.careerTrack = trackKey;
    user.careerLevel = 0;
    user.yearsInRole = 0;
    user.yearsInCareer = 0;
    user.jobPerformance = 100;
    const level = track.levels[0];
    user.jobTitle = level.title;
    user.jobSalary = GameLogic.calculateScaledSalary(level.salary, user.city);
    user.hasSeenJobSalary = false;
    user.mafiaCrimesThisYear = 0;

    if (typeof saveGame === 'function') saveGame();

    addLog(`You swore the oath and were initiated into ${track.label} as a ${level.title}.`, 'major');
    renderActivities();
}

let _currentProSportTab = 'football';

export function openProSportsEntryModal(selectedSportKey = 'football') {
    const user = state.gameState.user;
    if (!user) return;
    _currentProSportTab = selectedSportKey;

    const prospect = GameLogic.evaluateAthleteProspect(user, selectedSportKey);
    const league = prospect.league;

    const sportsTabs = [
        { key: 'football', label: 'Football', icon: 'fa-football-ball' },
        { key: 'basketball', label: 'Basketball', icon: 'fa-basketball-ball' },
        { key: 'baseball', label: 'Baseball', icon: 'fa-baseball-ball' },
        { key: 'soccer', label: 'Soccer', icon: 'fa-futbol' }
    ];

    const tabsHtml = `
        <div class="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-700/80 mb-3">
            ${sportsTabs.map(tab => {
                const isActive = tab.key === selectedSportKey;
                return `
                    <button data-action="selectProSportTab" data-args="&apos;${tab.key}&apos;" class="py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                        isActive
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }">
                        <i class="fas ${tab.icon} text-sm"></i>
                        <span class="text-[10px] truncate">${tab.label}</span>
                    </button>
                `;
            }).join('')}
        </div>
    `;

    const sportSkill = GameLogic.getSkillState(user, league.skillKey);
    const condSkill = GameLogic.getSkillState(user, 'conditioning');

    const draftEntered = Boolean(user.athleteDraftsEntered?.[selectedSportKey]);
    const triedThisYear = user.athleteTryoutYear?.[selectedSportKey] === user.age;
    const isDraftEligible = user.age >= 18 && user.age <= 23 && !draftEntered && prospect.passedPhysical;
    const isTryoutEligible = user.age >= 18 && user.age <= 35 && !triedThisYear && prospect.passedPhysical;

    const modalContent = `
        <div class="space-y-3.5 text-left max-h-[75vh] overflow-y-auto pr-1">
            ${tabsHtml}

            <!-- League Header Card -->
            <div class="bg-gradient-to-r from-slate-900 to-slate-850 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 text-2xl shrink-0">
                        <i class="fas ${league.icon}"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white text-sm">${league.name}</h4>
                        <div class="text-[11px] text-emerald-400 font-semibold">${league.leagueName}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">Prize: <i class="fas fa-ring text-amber-400 mr-0.5"></i>${league.championshipName}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Range</div>
                    <div class="text-xs font-black text-white">${Utils.formatMoney(league.levels[0].salary)} - ${Utils.formatMoney(league.levels[4].salary)}</div>
                </div>
            </div>

            <!-- Scouting Report Card -->
            <div class="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-bold text-white flex items-center gap-1.5">
                        <i class="fas fa-clipboard-check text-emerald-400"></i> Scouting Combine Evaluation
                    </div>
                    <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                        prospect.prospectScore >= 75
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : prospect.prospectScore >= 50
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                    }">${prospect.grade}</span>
                </div>

                <!-- Stat Bars -->
                <div class="space-y-1.5 text-[11px]">
                    <div>
                        <div class="flex justify-between text-slate-300 mb-0.5">
                            <span>Health & Physical (${user.health || 0}/100)</span>
                            <span class="font-bold text-emerald-400">${prospect.healthPoints} / 35 pts</span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 rounded-full" style="width: ${Math.min(100, ((user.health || 0) / 100) * 100)}%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-slate-300 mb-0.5">
                            <span>${league.name} Skill (${sportSkill.xp || 0} XP${sportSkill.certified ? ' • Certified' : ''})</span>
                            <span class="font-bold text-emerald-400">${prospect.sportPoints} / 45 pts</span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-500 rounded-full" style="width: ${sportSkill.xp || 0}%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-slate-300 mb-0.5">
                            <span>Strength & Conditioning (${condSkill.xp || 0} XP)</span>
                            <span class="font-bold text-emerald-400">${prospect.conditioningPoints} / 20 pts</span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-orange-500 rounded-full" style="width: ${condSkill.xp || 0}%"></div>
                        </div>
                    </div>
                </div>

                ${!prospect.passedPhysical ? `
                    <div class="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-[11px] flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle shrink-0"></i>
                        <span>Health is below 50. Team doctors will not clear you for pro combine workouts or contact drills until you heal!</span>
                    </div>
                ` : ''}
            </div>

            <!-- Two Entry Options -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <!-- Option 1: Pro Draft Combine -->
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white flex items-center gap-1.5">
                                <i class="fas fa-trophy text-amber-400"></i> Pro Draft Combine
                            </span>
                            <span class="text-[10px] font-bold text-slate-400">Ages 18–23</span>
                        </div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-2">
                            Enter the official league rookie draft. High scouting scores award 1st-round multi-year rookie contracts and multi-million dollar signing bonuses!
                        </p>
                        <div class="text-[10px] font-bold text-emerald-400 mb-3">
                            Draft Probability: ${Math.round(prospect.draftOdds * 100)}%
                        </div>
                    </div>
                    <button data-action="enterProSportsDraft" data-args="&apos;${selectedSportKey}&apos;" ${!isDraftEligible ? 'disabled' : ''} class="w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isDraftEligible
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }">
                        <i class="fas fa-file-contract"></i> ${draftEntered ? 'Draft Already Entered' : user.age > 23 ? 'Draft Age Exceeded (23)' : !prospect.passedPhysical ? 'Failed Physical' : 'Declare for Draft'}
                    </button>
                </div>

                <!-- Option 2: Free Agent Tryout -->
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white flex items-center gap-1.5">
                                <i class="fas fa-running text-cyan-400"></i> Walk-On Tryouts
                            </span>
                            <span class="text-[10px] font-bold text-slate-400">Ages 18–35</span>
                        </div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-2">
                            Attend open team tryouts. Proving yourself lands a 1-year or 2-year trial contract at league rookie minimum (${Utils.formatMoney(league.levels[0].salary)}/yr).
                        </p>
                        <div class="text-[10px] font-bold text-cyan-400 mb-3">
                            Tryout Probability: ${Math.round(prospect.tryoutOdds * 100)}%
                        </div>
                    </div>
                    <button data-action="enterProSportsTryout" data-args="&apos;${selectedSportKey}&apos;" ${!isTryoutEligible ? 'disabled' : ''} class="w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isTryoutEligible
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }">
                        <i class="fas fa-shoe-prints"></i> ${triedThisYear ? 'Tried Out This Year' : user.age > 35 ? 'Age Limit Exceeded (35)' : !prospect.passedPhysical ? 'Failed Physical' : 'Attend Open Tryout'}
                    </button>
                </div>
            </div>

            <div class="pt-1">
                <button data-action="hideModal" class="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 rounded-xl text-xs transition border border-slate-700">
                    Close
                </button>
            </div>
        </div>
    `;

    const modalOverlay = document.getElementById('modal-overlay');
    const isAlreadyOpen = modalOverlay && !modalOverlay.classList.contains('hidden');
    if (isAlreadyOpen) {
        UI.replaceModalContent("Pro Sports Combine & Leagues", modalContent);
    } else {
        UI.showCustomModal({
            title: "Pro Sports Combine & Leagues",
            content: modalContent,
            showCloseBtn: true
        });
    }
}

export function selectProSportTab(sportKey) {
    openProSportsEntryModal(sportKey);
}

export function enterProSportsDraft(sportKey) {
    const user = state.gameState.user;
    const result = GameLogic.attemptAthleteDraft(user, sportKey);
    if (typeof saveGame === 'function') saveGame();
    UI.updateHeader(user);

    if (result.success && result.drafted) {
        addLog(result.message, 'major');
        SoundManager.play('milestone');
        UI.showModal("Drafted into Pro League!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🏆</div>
                <h3 class="text-lg font-black text-emerald-400">Welcome to the Pros!</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
                <div class="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-left space-y-1 text-xs">
                    <div class="flex justify-between text-slate-300">
                        <span>Contract Deal:</span>
                        <span class="font-bold text-white">${result.contract.totalYears}-Yr / ${Utils.formatMoney(result.contract.totalValue)}</span>
                    </div>
                    <div class="flex justify-between text-slate-300">
                        <span>Annual Salary:</span>
                        <span class="font-bold text-emerald-400">${Utils.formatMoney(result.annualSalary)} / yr</span>
                    </div>
                    <div class="flex justify-between text-slate-300">
                        <span>Upfront Signing Bonus:</span>
                        <span class="font-bold text-amber-400">${Utils.formatMoney(result.signingBonus)}</span>
                    </div>
                </div>
            </div>
        `);
        renderActivities();
    } else {
        addLog(result.message, 'bad');
        UI.showModal("Draft Results", `
            <div class="text-center space-y-3">
                <div class="text-4xl">📋</div>
                <h3 class="text-lg font-bold text-amber-400">Undrafted</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
            </div>
        `);
        openProSportsEntryModal(sportKey);
    }
}

export function enterProSportsTryout(sportKey) {
    const user = state.gameState.user;
    const result = GameLogic.attemptAthleteTryout(user, sportKey);
    if (typeof saveGame === 'function') saveGame();
    UI.updateHeader(user);

    if (result.success && result.signed) {
        addLog(result.message, 'major');
        SoundManager.play('milestone');
        UI.showModal("Pro Tryout Successful!", `
            <div class="text-center space-y-3">
                <div class="text-4xl">⭐</div>
                <h3 class="text-lg font-black text-emerald-400">Contract Signed!</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
                <div class="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-left space-y-1 text-xs">
                    <div class="flex justify-between text-slate-300">
                        <span>Contract Deal:</span>
                        <span class="font-bold text-white">${result.contract.totalYears}-Yr / ${Utils.formatMoney(result.contract.totalValue)}</span>
                    </div>
                    <div class="flex justify-between text-slate-300">
                        <span>Annual Salary:</span>
                        <span class="font-bold text-emerald-400">${Utils.formatMoney(result.annualSalary)} / yr</span>
                    </div>
                </div>
            </div>
        `);
        renderActivities();
    } else {
        addLog(result.message, 'bad');
        UI.showModal("Tryout Feedback", `
            <div class="text-center space-y-3">
                <div class="text-4xl">🏃</div>
                <h3 class="text-lg font-bold text-slate-300">Tryout Completed</h3>
                <p class="text-xs text-slate-300">${result.message}</p>
            </div>
        `);
        openProSportsEntryModal(sportKey);
    }
}
