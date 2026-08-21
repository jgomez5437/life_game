import { state, hasPurchasedPack } from '../../../public/src/core/state.js';
import { 
    hasInstantDiplomaPerk, 
    grantInstantHighSchool, 
    grantInstantUniversityDegree, 
    grantInstantGradDegree 
} from '../../../public/src/features/education/instantDiploma.js';
import { STORE_PACKS } from '../../../public/src/features/store/storeScreen.js';
import { applyForCareerTrack } from '../../../public/src/features/career/careerJobsScreen.js';

describe('Instant Diplomas Perk & Entitlements', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'TestStudent',
                age: 18,
                money: 1000,
                smarts: 50,
                studentLoans: 0,
                purchases: ['instant_diplomas'],
                lifeLog: [],
                relationships: [
                    { id: '1', name: 'Classmate Joe', type: 'Classmate', category: 'classmate', isCurrentClassmate: true }
                ]
            },
            lifeLog: []
        };
    });

    test('Store Catalog feature text does not contain Smarts Credential Boost', () => {
        const instantPack = STORE_PACKS.find(p => p.id === 'instant_diplomas');
        expect(instantPack).toBeDefined();
        expect(instantPack.features.some(f => f.toLowerCase().includes('smarts'))).toBe(false);
        expect(instantPack.features).toContain('Zero Tuition Debt & Instant Fast-Track');
    });

    test('hasInstantDiplomaPerk verifies instant_diplomas entitlement', () => {
        expect(hasInstantDiplomaPerk()).toBe(true);
        state.gameState.user.purchases = [];
        expect(hasInstantDiplomaPerk()).toBe(false);
    });

    test('grantInstantHighSchool grants diploma and clears classmates', () => {
        state.gameState.user.highSchoolRetained = true;
        grantInstantHighSchool();

        const user = state.gameState.user;
        expect(user.highSchoolRetained).toBe(false);
        expect(user.highSchoolGraduated).toBe(true);
        expect(user.isStudent).toBe(false);
        expect(user.relationships.length).toBe(0);
    });

    test('grantInstantUniversityDegree grants Bachelor degree instantly with zero student debt', () => {
        grantInstantUniversityDegree('Computer Science');

        const user = state.gameState.user;
        expect(user.universityGraduated).toBe(true);
        expect(user.major).toBe('Computer Science');
        expect(user.studentLoans).toBe(0);
        expect(user.universityEnrolled).toBe(false);
        expect(user.isStudent).toBe(false);
    });

    test('grantInstantGradDegree grants Law School degree instantly', () => {
        grantInstantGradDegree('Law School');

        const user = state.gameState.user;
        expect(user.gradSchoolDegree).toBe('Law School');
        expect(user.gradSchoolEnrolled).toBe(false);
        expect(user.studentLoans).toBe(0);
    });

    test('grantInstantGradDegree grants Medical School degree instantly', () => {
        grantInstantGradDegree('Medical School');

        const user = state.gameState.user;
        expect(user.gradSchoolDegree).toBe('Medical School');
        expect(user.gradSchoolEnrolled).toBe(false);
    });

    test('Earning instant degrees unlocks degree-restricted career tracks', () => {
        // First verify locked without degree
        state.gameState.user.universityGraduated = false;
        state.gameState.user.gradSchoolDegree = null;

        // Apply for software_eng (requires Computer Science degree)
        applyForCareerTrack('software_eng');
        expect(document.getElementById('modal-title').innerText).toBe('Qualifications Missing');

        // Grant instant degree and verify application proceeds to interview
        grantInstantUniversityDegree('Computer Science');
        applyForCareerTrack('software_eng');
        expect(document.getElementById('modal-title').innerText).toBe('Job Interview');
    });

    test('Locked perk warning shown if player tries instant degree without purchase', () => {
        state.gameState.user.purchases = [];
        grantInstantUniversityDegree('Business');

        expect(document.getElementById('modal-title').innerText).toBe('Locked Perk');
        expect(state.gameState.user.universityGraduated).not.toBe(true);
    });

    test('Using instant diploma completely un-enrolls player from active high school, university, and grad school', () => {
        const user = state.gameState.user;
        user.age = 16;
        user.highSchoolRetained = true;
        user.universityEnrolled = true;
        user.gradSchoolEnrolled = true;
        user.isStudent = true;

        grantInstantUniversityDegree('Biology');

        expect(user.universityEnrolled).toBe(false);
        expect(user.gradSchoolEnrolled).toBe(false);
        expect(user.highSchoolRetained).toBe(false);
        expect(user.highSchoolGraduated).toBe(true);
        expect(user.isStudent).toBe(false);
    });
});
