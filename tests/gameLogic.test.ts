import {
    sanitizeName,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    calculateHealthDecay
} from '../src/lib/gameLogic';

describe('GameLogic Unit Tests', () => {

    describe('sanitizeName', () => {
        it('returns error if name is empty', () => {
            const result = sanitizeName('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Name cannot be empty.');
        });

        it('returns error if single name', () => {
            const result = sanitizeName('John');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('You must enter both a first and last name.');
        });

        it('cleans up extra spaces', () => {
            const result = sanitizeName('  John   Doe  ');
            expect(result.isValid).toBe(true);
            expect(result.cleanedName).toBe('John Doe');
        });

        it('rejects numbers and special chars', () => {
            const result = sanitizeName('John123 Doe!');
            expect(result.isValid).toBe(false);
        });

        it('allows hyphens', () => {
            const result = sanitizeName('John-Paul Jones');
            expect(result.isValid).toBe(true);
            expect(result.cleanedName).toBe('John-Paul Jones');
        });
    });

    describe('addLivingExpenses', () => {
        it('returns 0 for age under 19', () => {
            expect(addLivingExpenses(18, false)).toBe(0);
        });

        it('returns 0 if student', () => {
            expect(addLivingExpenses(20, true)).toBe(0);
        });

        it('returns 24000 if 19+ and not student', () => {
            expect(addLivingExpenses(19, false)).toBe(24000);
            expect(addLivingExpenses(25, false)).toBe(24000);
        });
    });

    describe('calculateBirthdayMoney', () => {
        it('returns a number between 10 and 80', () => {
            for (let i = 0; i < 100; i++) {
                const amount = calculateBirthdayMoney();
                expect(amount).toBeGreaterThanOrEqual(10);
                expect(amount).toBeLessThanOrEqual(80);
            }
        });
    });

    describe('addStudentLoanPayment', () => {
        it('returns 0 if under 18', () => {
            expect(addStudentLoanPayment(17, 10000, false)).toBe(0);
        });

        it('returns 0 if student', () => {
            expect(addStudentLoanPayment(20, 10000, true)).toBe(0);
        });

        it('returns min of 2400 or remaining balance', () => {
            expect(addStudentLoanPayment(25, 10000, false)).toBe(2400);
            expect(addStudentLoanPayment(25, 1000, false)).toBe(1000);
        });
    });

    describe('checkSchoolGraduated', () => {
        it('returns true if current >= enrolled', () => {
            expect(checkSchoolGraduated(4, 4)).toBe(true);
            expect(checkSchoolGraduated(5, 4)).toBe(true);
        });

        it('returns false if current < enrolled', () => {
            expect(checkSchoolGraduated(3, 4)).toBe(false);
        });
    });

    describe('calculateHealthDecay', () => {
        it('calculates decay for under 18', () => {
            expect(calculateHealthDecay(15, 0.05)).toBe(1);
            expect(calculateHealthDecay(15, 0.15)).toBe(0);
        });

        it('calculates decay for 19-30', () => {
            expect(calculateHealthDecay(25, 0.25)).toBe(1);
            expect(calculateHealthDecay(25, 0.35)).toBe(0);
        });

        it('calculates decay for 31-50', () => {
            expect(calculateHealthDecay(40, 0.15)).toBe(2);
            expect(calculateHealthDecay(40, 0.25)).toBe(1);
        });
        
        it('calculates decay for 51-70', () => {
            expect(calculateHealthDecay(60, 0.0)).toBe(1);
            expect(calculateHealthDecay(60, 0.9)).toBe(3);
        });

        it('calculates decay for 70+', () => {
            expect(calculateHealthDecay(80, 0.0)).toBe(2);
            expect(calculateHealthDecay(80, 0.9)).toBe(4);
        });
    });

});
