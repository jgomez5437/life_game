import { jest } from '@jest/globals';

jest.unstable_mockModule('../../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn(),
        hideModal: jest.fn(),
        updateBottomNav: jest.fn(),
        isBottomNavEnabled: jest.fn(() => false)
    }
}));

const { GameLogic } = await import('../../public/src/core/gameLogic.js');
const { NPC_CAREER_TRACKS } = await import('../../public/src/core/logic/npcOccupationLogic.js');
const { state } = await import('../../public/src/core/state.js');
const { migrateState } = await import('../../public/src/core/stateMigration.js');
const { UI } = await import('../../public/src/ui/ui.js');
const { selectDatingAppMatch } = await import('../../public/src/features/relationships/meetPeopleModals.js');

function seqRng(values, fallback = 0.5) {
    let idx = 0;
    return () => (idx < values.length ? values[idx++] : fallback);
}

describe('NPC Occupation Progression & Dating Metadata', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `<div id="game-container"></div>`;
        state.gameState = {
            user: {
                name: 'Alex Tester',
                username: 'Alex Tester',
                age: 25,
                gender: 'male',
                city: 'New York',
                money: 50000,
                relationships: []
            },
            lifeLog: []
        };
    });

    describe('Dating profiles & LoveSync selection', () => {
        test('generateDatingProfiles includes full occupation metadata', () => {
            const profiles = GameLogic.generateDatingProfiles(
                { age: 25, gender: 'male', attractionPreference: 'women', city: 'New York' },
                6
            );
            expect(profiles.length).toBe(6);
            profiles.forEach(profile => {
                expect(profile.occupation).toBeTruthy();
                expect(['school', 'job', 'unemployed', 'retired']).toContain(profile.occupationType);
                expect(typeof profile.income).toBe('number');
                if (profile.occupationType === 'school') {
                    expect(profile.schoolMajor).toBeTruthy();
                    expect(profile.schoolYear).toBeGreaterThanOrEqual(1);
                }
                if (profile.occupationType === 'job') {
                    expect(profile.careerTrack).toBeTruthy();
                    expect(typeof profile.careerLevel).toBe('number');
                    expect(profile.income).toBeGreaterThan(0);
                }
            });
        });

        test('selectDatingAppMatch preserves school/career metadata on added relationship', () => {
            const spyRand = jest.spyOn(Math, 'random').mockReturnValue(0.1);
            const cachedProfile = {
                id: 'date_nursing_1',
                name: 'Emma Hayes',
                age: 20,
                gender: 'female',
                occupation: 'University Student (Nursing)',
                occupationType: 'school',
                educationLevel: 'High School',
                schoolMajor: 'Nursing',
                schoolYear: 3,
                income: 0,
                appearance: {},
                bio: 'Nursing student',
                hobbies: ['Coffee', 'Reading'],
                matchChance: 0.9
            };
            state.currentDatingProfiles = [cachedProfile];

            selectDatingAppMatch('date_nursing_1');

            const added = state.gameState.user.relationships.find(r => r.id === 'date_nursing_1');
            expect(added).toBeDefined();
            expect(added.occupation).toBe('University Student (Nursing)');
            expect(added.occupationType).toBe('school');
            expect(added.schoolMajor).toBe('Nursing');
            expect(added.schoolYear).toBe(3);
            expect(added.income).toBe(0);
            expect(UI.showModal).toHaveBeenCalled();

            spyRand.mockRestore();
        });
    });

    describe('repairNPCOccupationMetadata & stateMigration', () => {
        test('repairs stuck LoveSync University Student (Nursing) missing occupationType', () => {
            const stuckGirl = {
                id: 'stuck_1',
                name: 'Mia Vance',
                age: 39,
                type: 'Girlfriend',
                category: 'partner',
                occupation: 'University Student (Nursing)'
            };

            GameLogic.repairNPCOccupationMetadata(stuckGirl, 'New York');
            expect(stuckGirl.occupationType).toBe('school');
            expect(stuckGirl.schoolMajor).toBe('Nursing');
            expect(stuckGirl.schoolYear).toBeGreaterThanOrEqual(4);
            expect(stuckGirl.income).toBe(0);
        });

        test('repairs job titles, LuxeMatch titles, K-12 students, Unemployed, and Retired', () => {
            const nurse = { name: 'A', age: 28, occupation: 'Registered Nurse' };
            GameLogic.repairNPCOccupationMetadata(nurse, 'New York');
            expect(nurse.occupationType).toBe('job');
            expect(nurse.careerTrack).toBe('nursing');
            expect(nurse.careerLevel).toBe(0);
            expect(nurse.educationLevel).toBe('University');
            expect(nurse.income).toBeGreaterThan(0);

            const luxe = { name: 'B', age: 34, occupation: 'Chief of Medicine', income: 400000 };
            GameLogic.repairNPCOccupationMetadata(luxe, 'New York');
            expect(luxe.occupationType).toBe('job');
            expect(luxe.careerTrack).toBe('medicine');
            expect(luxe.careerLevel).toBe(4);
            expect(luxe.income).toBe(400000);

            const hs = { name: 'C', age: 19, occupation: 'High School Student' };
            GameLogic.repairNPCOccupationMetadata(hs);
            expect(hs.occupationType).toBe('school');

            const unemp = { name: 'D', age: 30, occupation: 'Unemployed' };
            GameLogic.repairNPCOccupationMetadata(unemp);
            expect(unemp.occupationType).toBe('unemployed');
            expect(unemp.income).toBe(0);

            const ret = { name: 'E', age: 68, occupation: 'Retired' };
            GameLogic.repairNPCOccupationMetadata(ret, 'New York');
            expect(ret.occupationType).toBe('retired');
            expect(ret.income).toBeGreaterThan(0);
        });

        test('migrateState repairs legacy relationship records with occupation string but missing metadata', () => {
            const migrated = migrateState({
                user: {
                    username: 'Player',
                    age: 40,
                    city: 'New York',
                    relationships: [
                        {
                            id: 'rel_stuck',
                            name: 'Elena Brooks',
                            type: 'Wife',
                            category: 'spouse',
                            age: 40,
                            status: 90,
                            occupation: 'University Student (Nursing)'
                        },
                        {
                            id: 'rel_no_occ',
                            name: 'Plain Child',
                            type: 'Son',
                            category: 'child',
                            age: 5,
                            status: 80
                        }
                    ]
                }
            });

            const stuck = migrated.user.relationships.find(r => r.id === 'rel_stuck');
            expect(stuck.occupationType).toBe('school');
            expect(stuck.schoolMajor).toBe('Nursing');
            expect(stuck.schoolYear).toBeGreaterThanOrEqual(4);

            const plain = migrated.user.relationships.find(r => r.id === 'rel_no_occ');
            expect(plain.occupation).toBeUndefined();
        });
    });

    describe('progressNPCOccupation lifecycle & edge cases', () => {
        test('graduates a 20+ year stuck University Student (Nursing) into Registered Nurse on next age-up', () => {
            const gf = {
                id: 'gf_nursing',
                name: 'Chloe Bennett',
                age: 39,
                type: 'Girlfriend',
                category: 'partner',
                occupation: 'University Student (Nursing)'
            };

            const msg = GameLogic.progressNPCOccupation(gf, 40, 'New York', seqRng([0.0]));
            expect(gf.occupation).toBe('Registered Nurse');
            expect(gf.occupationType).toBe('job');
            expect(gf.careerTrack).toBe('nursing');
            expect(gf.careerLevel).toBe(0);
            expect(gf.educationLevel).toBe('University');
            expect(gf.income).toBeGreaterThan(0);
            expect(msg).toContain('graduated University');
            expect(msg).toContain('Registered Nurse');
        });

        test('graduates Pharmacy, Psychology, and Communications majors into matching tracks', () => {
            const pharm = {
                name: 'P', age: 22, type: 'Girlfriend', category: 'partner',
                occupation: 'University Student (Pharmacy)', occupationType: 'school', schoolMajor: 'Pharmacy', schoolYear: 4
            };
            GameLogic.progressNPCOccupation(pharm, 22, null, seqRng([0.0]));
            expect(pharm.careerTrack).toBe('pharmacy');

            const psych = {
                name: 'Ps', age: 22, type: 'Girlfriend', category: 'partner',
                occupation: 'University Student (Psychology)', occupationType: 'school', schoolMajor: 'Psychology', schoolYear: 4
            };
            GameLogic.progressNPCOccupation(psych, 22, null, seqRng([0.0]));
            expect(['social_work', 'psychiatry']).toContain(psych.careerTrack);

            const comm = {
                name: 'Co', age: 22, type: 'Girlfriend', category: 'partner',
                occupation: 'University Student (Communications)', occupationType: 'school', schoolMajor: 'Communications', schoolYear: 4
            };
            GameLogic.progressNPCOccupation(comm, 22, null, seqRng([0.0]));
            expect(['journalism', 'marketing_track']).toContain(comm.careerTrack);
        });

        test('graduates K-12 High School Student who was stuck past age 18', () => {
            const stuckHs = {
                name: 'Sam', age: 19, type: 'Friend', category: 'friend',
                occupation: 'High School Student', occupationType: 'school'
            };
            GameLogic.progressNPCOccupation(stuckHs, 20, null, seqRng([0.7, 0.0]));
            expect(stuckHs.occupationType).toBe('job');
            expect(stuckHs.occupation).not.toBe('High School Student');
        });

        test('promotes, switches careers, lays off (including LuxeMatch), and gives modest raises', () => {
            // Promotion
            const worker = {
                name: 'Worker', age: 28, type: 'Wife', category: 'spouse',
                occupation: 'Registered Nurse', occupationType: 'job',
                careerTrack: 'nursing', careerLevel: 0, income: 60000, educationLevel: 'University'
            };
            const promoMsg = GameLogic.progressNPCOccupation(worker, 29, null, seqRng([0.05]));
            expect(worker.careerLevel).toBe(1);
            expect(worker.occupation).toBe('Charge Nurse');
            expect(worker.income).toBeGreaterThanOrEqual(65000);
            expect(promoMsg).toContain('promoted to Charge Nurse');

            // Career change
            const switcher = {
                name: 'Switcher', age: 30, type: 'Husband', category: 'spouse',
                occupation: 'Junior Developer', occupationType: 'job',
                careerTrack: 'software_eng', careerLevel: 0, income: 75000, educationLevel: 'University', schoolMajor: 'Computer Science'
            };
            const switchMsg = GameLogic.progressNPCOccupation(switcher, 31, null, seqRng([0.17, 0.9, 0.0]));
            expect(switcher.careerTrack).not.toBe('software_eng');
            expect(switcher.occupationType).toBe('job');
            expect(switchMsg).toContain('changed careers');

            // Layoff of LuxeMatch high earner
            const luxeSpouse = {
                name: 'Luxe', age: 35, type: 'Wife', category: 'spouse',
                occupation: 'Managing Partner (Law)', occupationType: 'job',
                careerTrack: 'law', careerLevel: 4, income: 350000, wealthTier: 'wealthy'
            };
            const layoffMsg = GameLogic.progressNPCOccupation(luxeSpouse, 35, null, seqRng([0.98]));
            expect(luxeSpouse.occupation).toBe('Unemployed');
            expect(luxeSpouse.occupationType).toBe('unemployed');
            expect(luxeSpouse.income).toBe(0);
            expect(luxeSpouse.wealthTier).toBeUndefined();
            expect(layoffMsg).toContain('unemployed');

            // Annual raise
            const steady = {
                name: 'Steady', age: 32, type: 'Friend', category: 'friend',
                occupation: 'Barista', occupationType: 'job',
                careerTrack: 'food_service', careerLevel: 0, income: 25000
            };
            GameLogic.progressNPCOccupation(steady, 32, null, seqRng([0.5, 0.5]));
            expect(steady.income).toBeGreaterThan(25000);
            expect(steady.income).toBeLessThanOrEqual(26000);
        });

        test('unemployed university grad can either match major or take lower-paying non-degree job', () => {
            const gradToLowerJob = {
                name: 'Grad', age: 30, type: 'Husband', category: 'spouse',
                occupation: 'Unemployed', occupationType: 'unemployed',
                educationLevel: 'University', schoolMajor: 'Nursing', income: 0
            };
            // First rng < 0.25 hires; second rng >= 0.75 picks non-degree pool
            const msg = GameLogic.progressNPCOccupation(gradToLowerJob, 30, null, seqRng([0.1, 0.9, 0.0]));
            expect(gradToLowerJob.occupationType).toBe('job');
            const nonDegreeTracks = NPC_CAREER_TRACKS.filter(t => !t.reqDegree && !t.reqGrad).map(t => t.key);
            expect(nonDegreeTracks).toContain(gradToLowerJob.careerTrack);
            expect(msg).toContain('found a job');
        });

        test('retires at 65+ with pension income', () => {
            const elder = {
                name: 'Elder', age: 65, type: 'Father', category: 'family',
                occupation: 'Charge Nurse', occupationType: 'job',
                careerTrack: 'nursing', careerLevel: 1, income: 80000
            };
            const msg = GameLogic.progressNPCOccupation(elder, 35, null, seqRng([0.5]));
            expect(elder.occupation).toBe('Retired');
            expect(elder.occupationType).toBe('retired');
            expect(elder.income).toBe(32000);
            expect(msg).toContain('retired');
        });
    });

    describe('calculateSpousalIncomeContribution', () => {
        test('repairs legacy spouse missing income and contributes 50%', () => {
            const user = {
                city: 'New York',
                relationships: [
                    {
                        id: 'sp_1',
                        name: 'Jordan Lee',
                        type: 'Wife',
                        category: 'spouse',
                        age: 29,
                        occupation: 'Registered Nurse'
                    }
                ]
            };
            const contrib = GameLogic.calculateSpousalIncomeContribution(user);
            expect(contrib.spouseName).toBe('Jordan Lee');
            expect(contrib.amount).toBeGreaterThan(0);
            expect(user.relationships[0].income).toBeGreaterThan(0);
            expect(contrib.amount).toBe(Math.floor(user.relationships[0].income * 0.5));
        });
    });

    describe('Cross-system consistency (re-hire & inheritance)', () => {
        test('laid-off professional can recover into lastCareerTrack and non-grad majors avoid grad-only tracks', () => {
            const laidOffDoc = {
                name: 'Dr. Former', age: 38, type: 'Husband', category: 'spouse',
                occupation: 'Unemployed', occupationType: 'unemployed',
                educationLevel: 'University', schoolMajor: 'Biology', lastCareerTrack: 'medicine', income: 0
            };
            // rng < 0.25 hires; pathRoll < 0.55 picks primaryMatches (medicine or nursing for Biology)
            GameLogic.progressNPCOccupation(laidOffDoc, 38, null, seqRng([0.1, 0.2, 0.0]));
            expect(laidOffDoc.occupationType).toBe('job');
            expect(['medicine', 'nursing']).toContain(laidOffDoc.careerTrack);

            const designer = {
                name: 'Designer', age: 31, type: 'Friend', category: 'friend',
                occupation: 'Junior Designer', occupationType: 'job',
                careerTrack: 'graphic_design', careerLevel: 0,
                educationLevel: 'University', schoolMajor: 'Graphic Design', income: 48000
            };
            // Switch career via bachelorDegreePool (0.55 <= pathRoll < 0.75) -> should never land in medicine/law/pharmacy/psychiatry
            GameLogic.progressNPCOccupation(designer, 31, null, seqRng([0.17, 0.65, 0.0]));
            expect(designer.occupationType).toBe('job');
            const gradOnlyKeys = NPC_CAREER_TRACKS.filter(t => t.reqGrad).map(t => t.key);
            expect(gradOnlyKeys).not.toContain(designer.careerTrack);
        });

        test('inheritFamilyRelationships preserves extended career and school metadata', () => {
            const parentRels = [
                { id: 'child_1', name: 'Ava Doe', type: 'Daughter', category: 'child', age: 30, gender: 'female', spouseId: 'sil_1' },
                {
                    id: 'sil_1', name: 'Noah Doe', type: 'Son-in-Law', category: 'family', age: 31, gender: 'male',
                    spouseOfChildId: 'child_1', occupation: 'Registered Nurse', occupationType: 'job',
                    careerTrack: 'nursing', careerLevel: 0, lastCareerTrack: 'nursing', yearsInRole: 2,
                    educationLevel: 'University', schoolMajor: 'Nursing', income: 55000, wealthTier: 'high_earner', netWorth: 700000
                }
            ];
            const inherited = GameLogic.inheritFamilyRelationships(parentRels, 'child_1');
            const spouse = inherited.find(r => r.id === 'sil_1');
            expect(spouse).toBeDefined();
            expect(spouse.category).toBe('spouse');
            expect(spouse.careerTrack).toBe('nursing');
            expect(spouse.lastCareerTrack).toBe('nursing');
            expect(spouse.yearsInRole).toBe(2);
            expect(spouse.wealthTier).toBe('high_earner');
            expect(spouse.netWorth).toBe(700000);
            expect(spouse.schoolMajor).toBe('Nursing');
        });
    });
});
