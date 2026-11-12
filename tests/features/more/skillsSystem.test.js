import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { state } from '../../../public/src/core/state.js';
import { CAREER_TRACKS, SKILL_TRACKS } from '../../../public/src/core/constants.js';
import { isTrackLocked, getTrackWarnings, getEligibleCareers } from '../../../public/src/core/recommendations.js';
import { migrateState } from '../../../public/src/core/saveSlotManager.js';
import { openSkillsModal, toggleSkillExpand, collapseSkills, closeSkillsModal, practiceSkill, enrollSkillCourse, askParentInstrumentPermission, takeInstrumentLesson } from '../../../public/src/features/more/moreScreen.js';

describe('Skills & Courses System and Game Integrations', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="custom-modal-overlay" class="hidden">
                <div id="custom-modal-title"></div>
                <div id="custom-modal-content"></div>
            </div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'Alex Mercer',
                gender: 'male',
                age: 20,
                money: 25000,
                health: 80,
                happiness: 75,
                smarts: 70,
                looks: 65,
                city: 'New York',
                universityGraduated: false,
                major: '',
                skills: {},
                skillActionsThisYear: 0,
                instrumentPracticesThisYear: 0,
                instrumentLessonsThisYear: 0,
                purchases: [],
                assets: [],
                relationships: [],
                lifeLog: []
            },
            lifeLog: []
        };
    });

    test('SKILL_TRACKS defines all 18 skills (6 general + 5 sports + 7 instruments) and 3 course tiers each', () => {
        expect(SKILL_TRACKS).toHaveLength(18);
        expect(SKILL_TRACKS.filter(s => s.category === 'general')).toHaveLength(6);
        expect(SKILL_TRACKS.filter(s => s.category === 'sports')).toHaveLength(5);
        expect(SKILL_TRACKS.filter(s => s.category === 'instruments')).toHaveLength(7);
        SKILL_TRACKS.forEach(skill => {
            expect(skill.courses).toHaveLength(3);
            expect(skill.courses[2].grantsCert).toBe(true);
            expect(typeof skill.certificateTitle).toBe('string');
            if (skill.category === 'instruments') {
                expect(skill.minAge).toBe(6);
                expect(skill.unlocksCareers).toContain('artist');
                expect(skill.boostsCareers).toContain('artist');
                expect(skill.lessonCost).toBe(200);
            }
        });
    });

    test('executePracticeSkill grants XP, boosts stats, and enforces 2 actions/year limit', () => {
        const user = state.gameState.user;
        const startSmarts = user.smarts;

        const res1 = GameLogic.executePracticeSkill(user, 'coding');
        expect(res1.success).toBe(true);
        expect(user.skills.coding.xp).toBe(10);
        expect(user.smarts).toBeGreaterThan(startSmarts);
        expect(user.skillActionsThisYear).toBe(1);

        const res2 = GameLogic.executePracticeSkill(user, 'coding');
        expect(res2.success).toBe(true);
        expect(user.skills.coding.xp).toBe(20);
        expect(user.skillActionsThisYear).toBe(2);

        // 3rd attempt in the same year should be blocked
        const res3 = GameLogic.executePracticeSkill(user, 'coding');
        expect(res3.success).toBe(false);
        expect(user.skills.coding.xp).toBe(20);
    });

    test('executeEnrollSkillCourse enforces XP prerequisites, deducts money, and grants Master Certificate at Tier 3', () => {
        const user = state.gameState.user;

        // Cannot jump straight to Tier 2 (requires 25 XP)
        const earlyT2 = GameLogic.executeEnrollSkillCourse(user, 'coding', 2);
        expect(earlyT2.success).toBe(false);

        // Enroll in Tier 1 ($400, +25 XP)
        const t1 = GameLogic.executeEnrollSkillCourse(user, 'coding', 1);
        expect(t1.success).toBe(true);
        expect(user.money).toBe(25000 - 400);
        expect(user.skills.coding.xp).toBe(25);
        expect(user.skills.coding.tiersCompleted).toContain(1);

        // Enroll in Tier 2 ($2,500, +35 XP -> 60 XP)
        const t2 = GameLogic.executeEnrollSkillCourse(user, 'coding', 2);
        expect(t2.success).toBe(true);
        expect(user.skills.coding.xp).toBe(60);

        // Enroll in Tier 3 ($6,000, +40 XP -> 100 XP, certified = true)
        const t3 = GameLogic.executeEnrollSkillCourse(user, 'coding', 3);
        expect(t3.success).toBe(true);
        expect(user.skills.coding.xp).toBe(100);
        expect(user.skills.coding.certified).toBe(true);

        // Certificate appears in getEducationMilestones
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones.some(m => m.id === 'cert_coding' && m.title === 'Certified Software Architect')).toBe(true);
    });

    test('Master Certification unlocks degree/major-gated career tracks without University', () => {
        const user = state.gameState.user;
        const softwareTrack = CAREER_TRACKS.find(t => t.key === 'software_eng');

        // Locked initially without CS degree
        expect(isTrackLocked(softwareTrack, user)).toBe(true);
        expect(getTrackWarnings(softwareTrack, user)).toContain('University Degree Required');

        // Earn Coding Master Certification
        GameLogic.executeEnrollSkillCourse(user, 'coding', 1);
        GameLogic.executeEnrollSkillCourse(user, 'coding', 2);
        GameLogic.executeEnrollSkillCourse(user, 'coding', 3);

        // Now unlocked without University degree!
        expect(isTrackLocked(softwareTrack, user)).toBe(false);
        expect(getTrackWarnings(softwareTrack, user)).toHaveLength(0);
    });

    test('No-Degree career tracks fast-track to Level 2 with +20% salary bonus when certified', () => {
        const user = state.gameState.user;

        // Earn Culinary Master Certification
        GameLogic.executeEnrollSkillCourse(user, 'culinary', 1);
        GameLogic.executeEnrollSkillCourse(user, 'culinary', 2);
        GameLogic.executeEnrollSkillCourse(user, 'culinary', 3);

        const bonuses = GameLogic.getCareerSkillBonuses(user, 'food_service');
        expect(bonuses.fastTracked).toBe(true);
        expect(bonuses.startingLevel).toBe(1); // Level 2 (Line Cook instead of Dishwasher)
        expect(bonuses.salaryMultiplier).toBe(1.20);
        expect(bonuses.workHarderBonus).toBe(8);
        expect(bonuses.promoBonus).toBe(0.15);

        const eligible = getEligibleCareers(user, { limit: 25 });
        const foodCareer = eligible.find(c => c.key === 'food_service');
        expect(foodCareer).toBeDefined();
        expect(foodCareer.title).toBe('Cook');
    });

    test('saveSlotManager.migrateState preserves user.skills and user.skillActionsThisYear', () => {
        const user = state.gameState.user;
        GameLogic.executePracticeSkill(user, 'martial_arts');
        GameLogic.executeEnrollSkillCourse(user, 'martial_arts', 1);

        const migrated = migrateState(state.gameState);
        expect(migrated.user.skillActionsThisYear).toBe(1);
        expect(migrated.user.skills.martial_arts.xp).toBe(35);
        expect(migrated.user.skills.martial_arts.tiersCompleted).toContain(1);
    });

    test('openSkillsModal renders surface-level options, handles expand/collapse, and closes to More Options', () => {
        openSkillsModal();
        const modalContent = document.getElementById('modal-content');
        const modalOverlay = document.getElementById('modal-overlay');

        expect(modalContent.textContent).toContain('Computer Programming & Software');
        expect(modalContent.textContent).toContain('Public Speaking & Leadership');
        expect(modalContent.textContent).toContain('Back to More Options');
        // By default, surface level rows are collapsed so courses and practice are hidden
        expect(modalContent.textContent).not.toContain('Tier 1 Workshop');
        expect(modalContent.textContent).not.toContain('Practice (+10 XP)');
        expect(modalContent.textContent).not.toContain('Back to Skill Options');

        // Expanding coding shows courses and practice button
        toggleSkillExpand('coding');
        expect(modalContent.textContent).toContain('Practice (+10 XP)');
        expect(modalContent.textContent).toContain('Tier 1 Workshop');
        expect(modalContent.textContent).toContain('Intro to Python & Web Dev');
        expect(modalContent.textContent).not.toContain('Back to Skill Options');

        // Toggling coding again collapses it
        toggleSkillExpand('coding');
        expect(modalContent.textContent).not.toContain('Tier 1 Workshop');
        expect(modalContent.textContent).not.toContain('Practice (+10 XP)');

        // Practicing a skill automatically expands that skill
        practiceSkill('leadership');
        expect(state.gameState.user.skills.leadership.xp).toBe(10);
        expect(modalContent.textContent).toContain('Public Speaking & Leadership');
        expect(modalContent.textContent).toContain('Practice (+10 XP)');
        expect(modalContent.textContent).not.toContain('Back to Skill Options');

        enrollSkillCourse('leadership', 1);
        expect(state.gameState.user.skills.leadership.xp).toBe(35);
        expect(state.gameState.user.skills.leadership.tiersCompleted).toContain(1);

        // Closing the modal returns directly to More Options and closes modal overlay
        closeSkillsModal();
        expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('Parental permission mechanics under age 18: permission required, refusal, approval, and free courses', () => {
        const user = state.gameState.user;
        user.age = 10;
        user.money = 500;
        user.relationships = [
            { id: 'rel_mom', type: 'Mother', name: 'Sarah Mercer', status: 15, gender: 'female' },
            { id: 'rel_dad', type: 'Father', name: 'David Mercer', status: 25, gender: 'male' }
        ];

        // 1. Without permission, practice, lessons, and recital courses are blocked
        const pBlocked = GameLogic.executePracticeSkill(user, 'guitar');
        expect(pBlocked.success).toBe(false);
        expect(pBlocked.needsPermission).toBe(true);

        const lBlocked = GameLogic.executeInstrumentLesson(user, 'guitar');
        expect(lBlocked.success).toBe(false);
        expect(lBlocked.needsPermission).toBe(true);

        const cBlocked = GameLogic.executeEnrollSkillCourse(user, 'guitar', 1);
        expect(cBlocked.success).toBe(false);
        expect(cBlocked.needsPermission).toBe(true);

        // 2. Ask parents with poor relationship status -> random refusal
        // Force Math.random() to 0.99 so refusal triggers
        const origRandom = Math.random;
        Math.random = () => 0.99;
        const askDenied = GameLogic.executeAskParentInstrumentPermission(user, 'guitar');
        expect(askDenied.success).toBe(false);
        expect(askDenied.deniedThisYear).toBe(true);
        expect(user.skills.guitar.deniedAge).toBe(10);
        expect(user.skills.guitar.parentApproved).toBe(false);

        // 3. Repeated attempt in same year is rejected
        const askRepeat = GameLogic.executeAskParentInstrumentPermission(user, 'guitar');
        expect(askRepeat.success).toBe(false);
        expect(askRepeat.deniedThisYear).toBe(true);
        expect(askRepeat.message).toContain('already said NO');

        // 4. Age up to 11 with improved parent relationship -> Approved!
        user.age = 11;
        user.relationships[0].status = 95;
        user.relationships[1].status = 90;
        Math.random = () => 0.10; // Low roll guarantees approval
        const askApproved = GameLogic.executeAskParentInstrumentPermission(user, 'guitar');
        expect(askApproved.success).toBe(true);
        expect(askApproved.approved).toBe(true);
        expect(user.skills.guitar.parentApproved).toBe(true);
        expect(user.skills.guitar.deniedAge).toBeNull();

        // 5. Practice and lessons now succeed, and lessons are FREE (Paid by Parents)
        const pSuccess = GameLogic.executePracticeSkill(user, 'guitar');
        expect(pSuccess.success).toBe(true);
        expect(user.skills.guitar.xp).toBe(6);

        const lSuccess = GameLogic.executeInstrumentLesson(user, 'guitar');
        expect(lSuccess.success).toBe(true);
        expect(lSuccess.message).toContain('Paid by Parents');
        expect(user.money).toBe(500); // No money deducted
        expect(user.skills.guitar.xp).toBe(14); // 6 + 8

        // 6. Recital course is also FREE (Paid by Parents)
        user.skills.guitar.xp = 30; // Meet Tier 1 requirement (minXp: 25)
        const cSuccess = GameLogic.executeEnrollSkillCourse(user, 'guitar', 1);
        expect(cSuccess.success).toBe(true);
        expect(cSuccess.message).toContain('Paid by Parents');
        expect(user.money).toBe(500); // No money deducted!

        Math.random = origRandom;
    });

    test('Adult instrument rules: 18+ requires no permission and deducts $200 for lessons', () => {
        const user = state.gameState.user;
        user.age = 22;
        user.money = 2000;
        user.relationships = [
            { id: 'rel_mom', type: 'Mother', name: 'Sarah Mercer', status: 50 }
        ];

        // Adults can practice immediately without asking
        const pRes = GameLogic.executePracticeSkill(user, 'piano');
        expect(pRes.success).toBe(true);
        expect(user.skills.piano.xp).toBe(6);

        // Adults pay $200 per lesson
        const lRes = GameLogic.executeInstrumentLesson(user, 'piano');
        expect(lRes.success).toBe(true);
        expect(user.money).toBe(1800);
        expect(user.skills.piano.xp).toBe(14);
        expect(lRes.message).toContain('$200');

        // Asking parents when 18+ returns adult notice
        const askRes = GameLogic.executeAskParentInstrumentPermission(user, 'piano');
        expect(askRes.success).toBe(false);
        expect(askRes.message).toContain('18 or older');
    });

    test('Annual limits: 3 practices/year and 3 lessons/year separate from general skill limit', () => {
        const user = state.gameState.user;
        user.age = 25;
        user.money = 5000;

        // 3 instrument practices allowed
        expect(GameLogic.executePracticeSkill(user, 'drums').success).toBe(true);
        expect(GameLogic.executePracticeSkill(user, 'drums').success).toBe(true);
        expect(GameLogic.executePracticeSkill(user, 'drums').success).toBe(true);
        expect(user.instrumentPracticesThisYear).toBe(3);
        const fourthPractice = GameLogic.executePracticeSkill(user, 'drums');
        expect(fourthPractice.success).toBe(false);
        expect(fourthPractice.message).toContain('used all 3 self-practice sessions');

        // 3 instrument lessons allowed
        expect(GameLogic.executeInstrumentLesson(user, 'drums').success).toBe(true);
        expect(GameLogic.executeInstrumentLesson(user, 'drums').success).toBe(true);
        expect(GameLogic.executeInstrumentLesson(user, 'drums').success).toBe(true);
        expect(user.instrumentLessonsThisYear).toBe(3);
        const fourthLesson = GameLogic.executeInstrumentLesson(user, 'drums');
        expect(fourthLesson.success).toBe(false);
        expect(fourthLesson.message).toContain('maximum of 3 instrument lessons');

        // General skillActionsThisYear remains untouched (0/2)
        expect(user.skillActionsThisYear).toBe(0);
        expect(GameLogic.executePracticeSkill(user, 'coding').success).toBe(true);
        expect(user.skillActionsThisYear).toBe(1);
    });

    test('Diminishing XP scaling: progression slows down significantly at 75%+', () => {
        // Beginner (<50 XP)
        expect(GameLogic.getInstrumentPracticeXpGain(0)).toBe(6);
        expect(GameLogic.getInstrumentLessonXpGain(0)).toBe(8);

        // Intermediate (50-74 XP)
        expect(GameLogic.getInstrumentPracticeXpGain(50)).toBe(4);
        expect(GameLogic.getInstrumentLessonXpGain(50)).toBe(5);

        // Advanced / Tapered (75-89 XP)
        expect(GameLogic.getInstrumentPracticeXpGain(75)).toBe(2);
        expect(GameLogic.getInstrumentLessonXpGain(75)).toBe(3);

        // Virtuoso stretch (90-99 XP)
        expect(GameLogic.getInstrumentPracticeXpGain(90)).toBe(1);
        expect(GameLogic.getInstrumentLessonXpGain(90)).toBe(2);
    });

    test('getArtistInstrumentReadiness accurately evaluates instrument mastery for future Artist career', () => {
        const user = state.gameState.user;

        // Initially no instruments practiced
        const initial = GameLogic.getArtistInstrumentReadiness(user);
        expect(initial.bestXp).toBe(0);
        expect(initial.eligible).toBe(false);
        expect(initial.hiringBonus).toBe(0);

        // Train violin to 85 XP
        GameLogic.ensureUserSkills(user);
        user.skills.violin.xp = 85;
        const advanced = GameLogic.getArtistInstrumentReadiness(user);
        expect(advanced.bestInstrument.key).toBe('violin');
        expect(advanced.bestXp).toBe(85);
        expect(advanced.eligible).toBe(true);
        expect(advanced.hiringBonus).toBe(0.20);

        // Certify violin
        user.skills.violin.certified = true;
        const certified = GameLogic.getArtistInstrumentReadiness(user);
        expect(certified.certifiedInstruments).toHaveLength(1);
        expect(certified.hiringBonus).toBe(0.30);
    });

    test('saveSlotManager.migrateState preserves instrument parent approval, deniedAge, and annual counters', () => {
        const user = state.gameState.user;
        user.skills.guitar = {
            xp: 45,
            tiersCompleted: [1],
            certified: false,
            parentApproved: true,
            deniedAge: null
        };
        user.instrumentPracticesThisYear = 2;
        user.instrumentLessonsThisYear = 1;

        const migrated = migrateState(state.gameState);
        expect(migrated.user.instrumentPracticesThisYear).toBe(2);
        expect(migrated.user.instrumentLessonsThisYear).toBe(1);
        expect(migrated.user.skills.guitar.parentApproved).toBe(true);
        expect(migrated.user.skills.guitar.deniedAge).toBeNull();
        expect(migrated.user.skills.guitar.xp).toBe(45);
    });

    test('openSkillsModal renders Music & Instruments category, allows parent permission requests and lessons', () => {
        const user = state.gameState.user;
        user.age = 14;
        user.relationships = [
            { id: 'rel_mom', type: 'Mother', name: 'Sarah Mercer', status: 80, gender: 'female' }
        ];

        openSkillsModal();
        const modalContent = document.getElementById('modal-content');
        expect(modalContent.textContent).toContain('Music & Instruments');
        expect(modalContent.textContent).toContain('Guitar (Acoustic & Electric)');
        expect(modalContent.textContent).toContain('Ask Parents');

        // Expand guitar
        toggleSkillExpand('guitar');
        expect(modalContent.textContent).toContain('Parental Permission Required');
        expect(modalContent.textContent).toContain('Ask Parents for Permission');

        // Grant permission
        const origRandom = Math.random;
        Math.random = () => 0.05;
        askParentInstrumentPermission('guitar');
        expect(state.gameState.user.skills.guitar.parentApproved).toBe(true);
        expect(modalContent.textContent).toContain('Permitted');
        expect(modalContent.textContent).toContain('Free (Parents)');

        // Take lesson
        takeInstrumentLesson('guitar');
        expect(state.gameState.user.skills.guitar.xp).toBe(8);
        expect(state.gameState.user.instrumentLessonsThisYear).toBe(1);

        Math.random = origRandom;
        closeSkillsModal();
    });
});
