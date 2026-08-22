import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { state } from '../../../public/src/core/state.js';
import { openPlayerOverviewModal } from '../../../public/src/features/player/playerOverviewScreen.js';

describe('Education Milestones Engine & Overview Integration', () => {

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
                username: 'Jane Doe',
                gender: 'female',
                age: 28,
                money: 25000,
                health: 95,
                happiness: 90,
                smarts: 85,
                looks: 80,
                city: 'New York',
                purchases: [],
                assets: [],
                relationships: [],
                lifeLog: []
            },
            lifeLog: []
        };
    });

    test('getEducationMilestones returns empty array for newborns and toddlers', () => {
        const user = { age: 2 };
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones).toEqual([]);
        expect(GameLogic.formatEducationMilestones(user)).toBe('No Formal Education');
    });

    test('getCurrentEducationStatus returns correct level for different school ages', () => {
        expect(GameLogic.getCurrentEducationStatus({ age: 8 })).toMatchObject({
            isEnrolled: true,
            level: 'Elementary School',
            label: 'Elementary Student'
        });

        expect(GameLogic.getCurrentEducationStatus({ age: 13 })).toMatchObject({
            isEnrolled: true,
            level: 'Middle School',
            label: 'Middle School Student'
        });

        expect(GameLogic.getCurrentEducationStatus({ age: 16 })).toMatchObject({
            isEnrolled: true,
            level: 'High School',
            label: 'High School Student'
        });

        expect(GameLogic.getCurrentEducationStatus({ age: 19, highSchoolRetained: true })).toMatchObject({
            isEnrolled: true,
            level: 'High School',
            label: 'High School Student (Retaking)'
        });

        expect(GameLogic.getCurrentEducationStatus({
            age: 20,
            universityEnrolled: true,
            universitySchoolYear: 2,
            major: 'Psychology'
        })).toMatchObject({
            isEnrolled: true,
            level: 'University',
            label: 'University Student'
        });

        expect(GameLogic.getCurrentEducationStatus({
            age: 24,
            gradSchoolEnrolled: true,
            gradSchoolType: 'Business School',
            gradSchoolYear: 1
        })).toMatchObject({
            isEnrolled: true,
            level: 'Graduate School',
            label: 'Business School Student'
        });
    });

    test('High School graduation yields High School Diploma milestone', () => {
        const user = {
            age: 18,
            highSchoolGraduated: true
        };
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones.length).toBe(1);
        expect(milestones[0].title).toBe('High School Diploma');
        expect(milestones[0].category).toBe('high_school');
        expect(GameLogic.formatEducationMilestones(user)).toBe('High School Diploma');
    });

    test('GED recipient yields High School Equivalency (GED) milestone', () => {
        const user = {
            age: 20,
            hasGED: true
        };
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones.length).toBe(1);
        expect(milestones[0].title).toBe('High School Equivalency (GED)');
        expect(milestones[0].category).toBe('high_school');
        expect(GameLogic.formatEducationMilestones(user)).toBe('High School Equivalency (GED)');
    });

    test('University graduation yields Bachelor degree in specific major', () => {
        const user = {
            age: 22,
            highSchoolGraduated: true,
            universityGraduated: true,
            major: 'Psychology'
        };
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones.length).toBe(2);
        expect(milestones[0].title).toBe('High School Diploma');
        expect(milestones[1].title).toBe("Bachelor's Degree in Psychology");
        expect(milestones[1].category).toBe('undergrad');
        expect(GameLogic.formatEducationMilestones(user)).toBe("High School Diploma, Bachelor's Degree in Psychology");
    });

    test('Graduate school graduation yields prompt standard: High School Diploma, Bachelor\'s in Psychology, Master\'s in Business', () => {
        const user = {
            age: 26,
            highSchoolGraduated: true,
            universityGraduated: true,
            major: 'Psychology',
            gradSchoolDegree: 'Business School'
        };
        const milestones = GameLogic.getEducationMilestones(user);
        expect(milestones.length).toBe(3);
        expect(milestones[0].title).toBe('High School Diploma');
        expect(milestones[1].title).toBe("Bachelor's Degree in Psychology");
        expect(milestones[2].title).toBe("Master's Degree in Business");
        expect(milestones[2].category).toBe('grad');

        const formatted = GameLogic.formatEducationMilestones(user);
        expect(formatted).toBe("High School Diploma, Bachelor's Degree in Psychology, Master's Degree in Business");
    });

    test('Standardizes all graduate school degree titles', () => {
        const lawUser = { universityGraduated: true, major: 'Political Science', gradSchoolDegree: 'Law School' };
        expect(GameLogic.getEducationMilestones(lawUser)[1].title).toBe("Bachelor's Degree in Political Science");
        expect(GameLogic.getEducationMilestones(lawUser)[2].title).toBe("Juris Doctor in Law");

        const medUser = { universityGraduated: true, major: 'Biology', gradSchoolDegree: 'Medical School' };
        expect(GameLogic.getEducationMilestones(medUser)[2].title).toBe("Doctor of Medicine (M.D.)");

        const psychUser = { universityGraduated: true, major: 'Psychology', gradSchoolDegree: 'Psychiatry School' };
        expect(GameLogic.getEducationMilestones(psychUser)[2].title).toBe("Doctorate in Psychiatry");
    });

    test('Supports multiple graduate degrees if stored in array', () => {
        const multiGradUser = {
            universityGraduated: true,
            major: 'Computer Science',
            gradSchoolDegrees: ['Business School', 'Law School']
        };
        const milestones = GameLogic.getEducationMilestones(multiGradUser);
        const titles = milestones.map(m => m.title);
        expect(titles).toContain('High School Diploma');
        expect(titles).toContain("Bachelor's Degree in Computer Science");
        expect(titles).toContain("Master's Degree in Business");
        expect(titles).toContain("Juris Doctor in Law");
    });

    test('openPlayerOverviewModal renders education milestones card and detail row in DOM', () => {
        const user = state.gameState.user;
        user.highSchoolGraduated = true;
        user.universityGraduated = true;
        user.major = 'Psychology';
        user.gradSchoolDegree = 'Business School';

        openPlayerOverviewModal();

        const content = document.getElementById('modal-content');
        expect(content).toBeDefined();
        const html = content.innerHTML;

        // Check for Education Milestones section header
        expect(html).toContain('Education Milestones');
        expect(html).toContain('3 Credentials');

        // Check for individual badges
        expect(html).toContain('High School Diploma');
        expect(html).toContain("Bachelor's Degree in Psychology");
        expect(html).toContain("Master's Degree in Business");

        // Check for Life Context summary row
        expect(html).toContain("High School Diploma, Bachelor's Degree in Psychology, Master's Degree in Business");
    });

    test('openPlayerOverviewModal renders active enrollment banner if currently studying', () => {
        const user = state.gameState.user;
        user.highSchoolGraduated = true;
        user.universityEnrolled = true;
        user.universitySchoolYear = 3;
        user.major = 'Computer Science';

        openPlayerOverviewModal();

        const content = document.getElementById('modal-content');
        const html = content.innerHTML;

        expect(html).toContain('Enrolled: University Student');
        expect(html).toContain('Year 3 • Computer Science');
    });
});
