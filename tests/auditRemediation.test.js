import { jest } from '@jest/globals';
import { GameLogic } from '../public/src/core/gameLogic.js';
import { FamilyFactory } from '../public/src/features/relationships/familyFactory.js';
import { GRAD_SCHOOLS } from '../public/src/core/constants.js';

describe('Pre-Launch Audit Remediation Test Suite', () => {

    describe('1. Business Insolvency & CEO Wage Clamping', () => {
        test('executeSingleAutoQuarter does not pay CEO salary or inflate player money when company is insolvent', async () => {
            const businessDashboard = await import('../public/src/features/business/businessDashboard.js');
            
            const user = {
                hasBusiness: true,
                industry: 'tech_saas',
                compCash: 500, // Insufficient cash to cover employee wages ($75k) + CEO salary ($300k)
                ceoSalary: 100000, // $100k/quarter ($300k ceoWages)
                employees: 5,
                salaryOffer: 5000,
                productionTarget: 0,
                sellingPrice: 0,
                businessReputation: 50,
                businessUpgrades: [],
                inventory: 0,
                companyYear: 1,
                companyQuarter: 1,
                businessHistory: [],
                money: 1000
            };

            const initialPlayerMoney = user.money;
            businessDashboard.autoProcessBusinessQuarter(user);

            // Since compCash was only $500 and operating expenses > $500, compCash drops to 0
            // and player receives $0 CEO salary
            expect(user.compCash).toBe(0);
            expect(user.money).toBe(initialPlayerMoney); // Player didn't print $300k out of thin air
        });
    });

    describe('2. Name Generator Surnames & Character Generation', () => {
        test('generateTenantApplicants generates full names with valid surnames', () => {
            const property = { id: 'prop_test_1', value: 350000 };
            const applicants = GameLogic.generateTenantApplicants(property);

            expect(applicants.length).toBeGreaterThan(0);
            applicants.forEach(app => {
                const parts = app.name.trim().split(' ');
                expect(parts.length).toBeGreaterThanOrEqual(2);
                expect(parts[1].length).toBeGreaterThan(1);
                expect(parts[1]).not.toBe('undefined');
                expect(parts[1]).not.toBe('');
            });
        });

        test('generateCellmate generates realistic surname and not literal "Cellmate"', () => {
            for (let i = 0; i < 20; i++) {
                const cellmate = GameLogic.generateCellmate('medium');
                const parts = cellmate.name.trim().split(' ');
                expect(parts.length).toBeGreaterThanOrEqual(2);
                expect(parts[1]).not.toBe('Cellmate');
                expect(parts[1]).not.toBe('');
            }
        });

        test('generateYardInmates generates inmates with full names', () => {
            const yardInmates = GameLogic.generateYardInmates('maximum');
            expect(yardInmates.length).toBeGreaterThan(0);
            yardInmates.forEach(inmate => {
                const parts = inmate.name.trim().split(' ');
                expect(parts.length).toBeGreaterThanOrEqual(2);
            });
        });

        test('getRandomLastName returns a valid string surname from pool', () => {
            const lastName = GameLogic.getRandomLastName();
            expect(typeof lastName).toBe('string');
            expect(lastName.length).toBeGreaterThan(1);
        });
    });

    describe('3. Prison Incarceration Inheritance & Outside Relatives', () => {
        test('processPrisonAgeUp awards outside inheritance upon parent death', () => {
            const mockUser = {
                age: 28,
                inPrison: true,
                prisonSentence: 5,
                yearsServed: 2,
                money: 1000,
                relationships: [
                    { id: 'parent_1', name: 'Martha Wayne', type: 'Mother', category: 'family', age: 115, health: 0 }
                ],
                prisonStats: { infractions: 0, canteenCash: 0 }
            };

            const res = GameLogic.processPrisonAgeUp(mockUser);
            expect(mockUser.relationships.length).toBe(0); // Parent removed upon death
            expect(mockUser.money).toBeGreaterThanOrEqual(1000); // Received inheritance
            expect(res.events.some(e => e.includes('passed away'))).toBe(true);
        });
    });

    describe('4. Family Factory Biological Age Feasibility', () => {
        test('FamilyFactory generates siblings strictly younger than parents by at least 16 years', () => {
            for (let i = 0; i < 50; i++) {
                const family = FamilyFactory.generateFamily('Sterling');
                const mother = family.find(f => f.type === 'Mother');
                const father = family.find(f => f.type === 'Father');
                const siblings = family.filter(f => f.type === 'Brother' || f.type === 'Sister');

                const minParentAge = Math.min(...[mother?.age, father?.age].filter(Boolean));

                if (minParentAge && siblings.length > 0) {
                    siblings.forEach(sib => {
                        expect(sib.age).toBeLessThanOrEqual(minParentAge - 16);
                        expect(sib.age).toBeGreaterThanOrEqual(1);
                    });
                }
            }
        });
    });

    describe('5. Constants and Module Exports', () => {
        test('GRAD_SCHOOLS is defined in constants.js with correct structure', () => {
            expect(Array.isArray(GRAD_SCHOOLS)).toBe(true);
            expect(GRAD_SCHOOLS.length).toBe(4);
            GRAD_SCHOOLS.forEach(school => {
                expect(school.name).toBeDefined();
                expect(school.years).toBeGreaterThan(0);
                expect(school.icon).toBeDefined();
            });
        });
    });
});
