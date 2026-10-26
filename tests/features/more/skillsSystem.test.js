import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { state } from '../../../public/src/core/state.js';
import { CAREER_TRACKS, SKILL_TRACKS } from '../../../public/src/core/constants.js';
import { isTrackLocked, getTrackWarnings, getEligibleCareers } from '../../../public/src/core/recommendations.js';
import { migrateState } from '../../../public/src/core/saveSlotManager.js';
import { openSkillsModal, toggleSkillExpand, collapseSkills, closeSkillsModal, practiceSkill, enrollSkillCourse } from '../../../public/src/features/more/moreScreen.js';

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
                purchases: [],
                assets: [],
                relationships: [],
                lifeLog: []
            },
            lifeLog: []
        };
    });

    test('SKILL_TRACKS defines all 6 core skills and 3 course tiers each', () => {
        expect(SKILL_TRACKS).toHaveLength(6);
        SKILL_TRACKS.forEach(skill => {
            expect(skill.courses).toHaveLength(3);
            expect(skill.courses[2].grantsCert).toBe(true);
            expect(typeof skill.certificateTitle).toBe('string');
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
});
