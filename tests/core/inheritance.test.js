import { GameLogic } from '../../public/src/core/gameLogic.js';
import { state } from '../../public/src/core/state.js';
import { continueAsChild } from '../../public/src/features/player/mainScreen.js';
import { handleFinances } from '../../public/src/features/player/ageUpHandlers.js';

describe('Inheritance & Estate Distribution Suite', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="header-user-info"></div>
            <div id="header-bank"></div>
        `;
    });

    describe('GameLogic.calculateEstateDistribution', () => {
        test('insolvent estate (negative money/assets) leaves $0 debt to heirs and sets isInsolvent: true', () => {
            const user = {
                money: -250000,
                assets: [{ category: 'vehicle', value: 10000 }],
                hasBusiness: false,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' },
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(-240000);
            expect(dist.distributableEstate).toBe(0);
            expect(dist.spouseShare).toBe(0);
            expect(dist.inheritancePerChild).toBe(0);
            expect(dist.isInsolvent).toBe(true);
        });

        test('positive estate with spouse and children splits 50% to spouse and remainder equally to children', () => {
            const user = {
                money: 400000,
                assets: [{ category: 'property', value: 600000 }],
                hasBusiness: false,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' },
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(1000000);
            expect(dist.distributableEstate).toBe(1000000);
            expect(dist.spouseShare).toBe(500000);
            expect(dist.inheritancePerChild).toBe(250000);
            expect(dist.isInsolvent).toBe(false);
        });

        test('positive estate with spouse and NO children transfers 100% to spouse', () => {
            const user = {
                money: 300000,
                assets: [],
                hasBusiness: true,
                compCash: 200000,
                relationships: [
                    { id: 'spouse_1', name: 'Jane', category: 'spouse', type: 'Wife' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(500000);
            expect(dist.spouseShare).toBe(500000);
            expect(dist.inheritancePerChild).toBe(0);
        });

        test('positive estate with children and NO spouse splits 100% across children', () => {
            const user = {
                money: 900000,
                assets: [],
                hasBusiness: false,
                relationships: [
                    { id: 'child_1', name: 'Bobby', category: 'child', type: 'Son' },
                    { id: 'child_2', name: 'Sally', category: 'child', type: 'Daughter' },
                    { id: 'child_3', name: 'Timmy', category: 'child', type: 'Son' }
                ]
            };

            const dist = GameLogic.calculateEstateDistribution(user);
            expect(dist.totalEstate).toBe(900000);
            expect(dist.spouseShare).toBe(0);
            expect(dist.inheritancePerChild).toBe(300000);
        });
    });

    describe('continueAsChild Next-Generation Debt Protection', () => {
        test('child starts with $0 money (never negative) when continuing from an insolvent parent', () => {
            state.gameState = {
                user: {
                    username: 'Insolvent Parent',
                    gender: 'male',
                    city: 'Chicago',
                    age: 65,
                    money: -300000,
                    deathCause: 'Heart Attack',
                    generation: 1,
                    pastLives: [],
                    corporateDebt: { principal: 500000, interestRate: 0.10, monthlyPayment: 5000 },
                    relationships: [
                        { id: 'child_1', name: 'Heir Kid', type: 'Son', category: 'child', age: 20 }
                    ],
                    assets: []
                },
                currentEulogy: 'A daring gambler.',
                lifeLog: []
            };

            window.saveGame = () => {};

            // Even if negative amount was passed by mistake, it is clamped to $0
            continueAsChild(0, -300000);

            const newUser = state.gameState.user;
            expect(newUser.username).toBe('Heir Kid');
            expect(newUser.money).toBe(0);
            expect(newUser.corporateDebt.principal).toBe(0);
            expect(newUser.generation).toBe(2);

            const lifeLog = state.gameState.lifeLog[0].events;
            expect(lifeLog.some(e => e.msg.includes('clean financial slate'))).toBe(true);
        });

        test('child receives positive inheritance accurately when estate is solvent', () => {
            state.gameState = {
                user: {
                    username: 'Wealthy Parent',
                    gender: 'female',
                    city: 'Miami',
                    age: 80,
                    money: 2000000,
                    deathCause: 'Old Age',
                    generation: 1,
                    pastLives: [],
                    relationships: [
                        { id: 'child_1', name: 'Lucky Heir', type: 'Daughter', category: 'child', age: 30 }
                    ],
                    assets: []
                },
                currentEulogy: 'A wealthy matriarch.',
                lifeLog: []
            };

            window.saveGame = () => {};

            continueAsChild(0, 2000000);

            const newUser = state.gameState.user;
            expect(newUser.username).toBe('Lucky Heir');
            expect(newUser.money).toBe(2000000);
            expect(newUser.pastLives[0].inheritedMoney).toBe(2000000);
        });
    });

    describe('calculateInheritance and calculateSpousalLifeInsurance non-negative guarantees', () => {
        test('calculateInheritance never returns negative values', () => {
            expect(GameLogic.calculateInheritance(20, 0.05)).toBe(0);
            expect(GameLogic.calculateInheritance(80, 0.99)).toBeGreaterThan(0);
            expect(GameLogic.calculateInheritance(10, 0.5)).toBeGreaterThanOrEqual(0);
        });

        test('calculateSpousalLifeInsurance never returns negative values', () => {
            expect(GameLogic.calculateSpousalLifeInsurance(0.5, 0.5)).toBe(0);
            expect(GameLogic.calculateSpousalLifeInsurance(0.1, 0.5)).toBeGreaterThan(0);
        });
    });

    describe('GameLogic.mapNpcOccupationAndEducationToUser', () => {
        test('maps employed university graduate NPC with exact income and career track', () => {
            const mapped = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Joshua Jr.',
                age: 26,
                educationLevel: 'University',
                schoolMajor: 'Marketing',
                occupation: 'Store Manager',
                occupationType: 'job',
                careerTrack: 'retail',
                careerLevel: 3,
                income: 65000
            });

            expect(mapped.highSchoolGraduated).toBe(true);
            expect(mapped.universityGraduated).toBe(true);
            expect(mapped.universityEnrolled).toBe(false);
            expect(mapped.isStudent).toBe(false);
            expect(mapped.major).toBe('Marketing');
            expect(mapped.jobTitle).toBe('Store Manager');
            expect(mapped.jobSalary).toBe(65000);
            expect(mapped.careerTrack).toBe('retail');
            expect(mapped.careerLevel).toBe(3);
            expect(mapped.jobPerformance).toBe(65);
            expect(mapped.hasSeenJobSalary).toBe(true);
            expect(mapped.lastJobTitle).toBe('Store Manager');
            expect(mapped.peakJobTitle).toBe('Store Manager');
            expect(mapped.peakJobSalary).toBe(65000);
            expect(mapped.isRetired).toBe(false);
        });

        test('maps enrolled university student NPC with 0-indexed universitySchoolYear', () => {
            const mapped = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Maya',
                age: 20,
                educationLevel: 'High School',
                schoolMajor: 'Computer Science',
                schoolYear: 3,
                occupation: 'University Student (Computer Science)',
                occupationType: 'school',
                income: 0
            });

            expect(mapped.isStudent).toBe(true);
            expect(mapped.highSchoolGraduated).toBe(true);
            expect(mapped.universityEnrolled).toBe(true);
            expect(mapped.universityGraduated).toBe(false);
            expect(mapped.universitySchoolYear).toBe(2);
            expect(mapped.major).toBe('Computer Science');
            expect(mapped.jobTitle).toBe('');
            expect(mapped.jobSalary).toBe(0);
        });

        test('maps unemployed university graduate and infers gradSchoolDegree for law/medicine tracks', () => {
            const unemployedGrad = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Eli',
                age: 25,
                educationLevel: 'University',
                schoolMajor: 'Finance',
                occupation: 'Unemployed',
                occupationType: 'unemployed',
                income: 0
            });
            expect(unemployedGrad.universityGraduated).toBe(true);
            expect(unemployedGrad.major).toBe('Finance');
            expect(unemployedGrad.jobTitle).toBe('');
            expect(unemployedGrad.jobSalary).toBe(0);

            const lawyerChild = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Clara',
                age: 34,
                educationLevel: 'University',
                schoolMajor: 'Political Science',
                occupation: 'Senior Associate',
                occupationType: 'job',
                careerTrack: 'law',
                careerLevel: 2,
                income: 185000
            });
            expect(lawyerChild.gradSchoolDegree).toBe('Law School');
            expect(lawyerChild.gradSchoolDegrees).toEqual(['Law School']);
            expect(lawyerChild.jobSalary).toBe(185000);
        });

        test('maps retired child and minor children (<18 and <5) accurately', () => {
            const retired = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Arthur',
                age: 68,
                educationLevel: 'University',
                schoolMajor: 'Business',
                occupation: 'Retired',
                occupationType: 'retired',
                careerTrack: 'banking',
                careerLevel: 3,
                income: 42000
            });
            expect(retired.isRetired).toBe(true);
            expect(retired.retirementPension).toBe(42000);
            expect(retired.jobTitle).toBe('');
            expect(retired.jobSalary).toBe(0);
            expect(retired.retiredFromJobTitle).toBe('VP of Banking');

            const teen = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Sam',
                age: 14,
                educationLevel: 'None',
                occupation: 'High School Student',
                occupationType: 'school',
                income: 0
            });
            expect(teen.isStudent).toBe(true);
            expect(teen.highSchoolGraduated).toBe(false);

            const toddler = GameLogic.mapNpcOccupationAndEducationToUser({
                name: 'Lily',
                age: 3,
                educationLevel: 'None',
                occupation: 'None',
                occupationType: 'none',
                income: 0
            });
            expect(toddler.isStudent).toBe(false);
            expect(toddler.highSchoolGraduated).toBe(false);
        });
    });

    describe('continueAsChild Career, Education & Exact Income Preservation', () => {
        test('Joshua Jr. keeps Store Manager job, Marketing degree, exact income, and positive cashflow on takeover', async () => {
            state.gameState = {
                user: {
                    username: 'Joshua Sr.',
                    gender: 'male',
                    country: 'United States',
                    city: 'New York',
                    age: 74,
                    money: 50000,
                    deathCause: 'Old Age',
                    generation: 1,
                    pastLives: [],
                    relationships: [
                        {
                            id: 'child_joshua_jr',
                            name: 'Joshua Jr.',
                            type: 'Son',
                            category: 'child',
                            gender: 'male',
                            age: 29,
                            lifeStatus: 'Alive',
                            educationLevel: 'University',
                            schoolMajor: 'Marketing',
                            occupation: 'Store Manager',
                            occupationType: 'job',
                            careerTrack: 'retail',
                            careerLevel: 3,
                            income: 65000
                        }
                    ],
                    assets: []
                },
                currentEulogy: 'A proud father.',
                lifeLog: []
            };

            window.saveGame = () => {};

            continueAsChild(0, 50000);

            const newUser = state.gameState.user;
            expect(newUser.username).toBe('Joshua Jr.');
            expect(newUser.universityGraduated).toBe(true);
            expect(newUser.highSchoolGraduated).toBe(true);
            expect(newUser.major).toBe('Marketing');
            expect(newUser.jobTitle).toBe('Store Manager');
            // Preserves exact npc.income ($65,000), not re-scaled to New York city CoL
            expect(newUser.jobSalary).toBe(65000);
            expect(newUser.careerTrack).toBe('retail');
            expect(newUser.careerLevel).toBe(3);
            expect(newUser.lifeStatus).toBe('Store Manager');
            expect(newUser.studentLoans).toBe(0);
            expect(newUser.monthlyIncome).toBe(Math.floor(65000 / 12));
            expect(newUser.monthlyOutflow).toBeGreaterThan(0);

            const breakdown = GameLogic.calculateFinancialBreakdown(newUser);
            expect(breakdown.cashflow.annualIncome).toBe(65000);
            expect(breakdown.cashflow.netAnnual).toBeGreaterThan(0);

            const logs = state.gameState.lifeLog[0].events;
            expect(logs.some(e => e.msg.includes('Store Manager') && e.msg.includes('$65,000/yr') && e.msg.includes('Marketing'))).toBe(true);

            // Subsequent annual financial processing should add money rather than trigger "Savings are dwindling."
            const prevMoney = newUser.money;
            newUser.age += 1;
            await handleFinances(newUser);
            expect(newUser.money).toBeGreaterThan(prevMoney);
            const allLogMsgs = state.gameState.lifeLog.flatMap(entry => entry.events.map(e => e.msg));
            expect(allLogMsgs.some(m => m.includes('Savings are dwindling'))).toBe(false);
        });
    });
});
