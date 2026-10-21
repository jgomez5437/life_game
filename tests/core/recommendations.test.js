import {
    hasFelonyRecord,
    getTrackWarnings,
    isTrackLocked,
    isPartTimeJobLocked,
    isPartTimeTitle,
    getEligibleCareers,
    getEligiblePartTimeJobs,
    countDegreeCareers,
    needsWorkAttention,
    needsAssetsAttention,
    getPromotionStatus,
    buildRecommendations
} from '../../public/src/core/recommendations.js';

import { CAREER_TRACKS, PART_TIME_JOBS } from '../../public/src/core/constants.js';

describe('Recommendations & Shared Career Eligibility Engine', () => {

    describe('Felony & Criminal Record Guards', () => {
        test('hasFelonyRecord detects guilty felony convictions', () => {
            expect(hasFelonyRecord(null)).toBe(false);
            expect(hasFelonyRecord({})).toBe(false);
            expect(hasFelonyRecord({ criminalRecord: [] })).toBe(false);
            expect(hasFelonyRecord({ criminalRecord: [{ severity: 'misdemeanor', verdict: 'guilty' }] })).toBe(false);
            expect(hasFelonyRecord({ criminalRecord: [{ severity: 'felony', verdict: 'not_guilty' }] })).toBe(false);
            expect(hasFelonyRecord({ criminalRecord: [{ severity: 'felony', verdict: 'guilty' }] })).toBe(true);
        });

        test('isTrackLocked locks high-trust careers for felons', () => {
            const felon = { criminalRecord: [{ severity: 'felony', verdict: 'guilty' }], age: 30 };
            const bankingTrack = CAREER_TRACKS.find(t => t.key === 'banking');
            const retailTrack = CAREER_TRACKS.find(t => t.key === 'retail');

            expect(isTrackLocked(bankingTrack, felon)).toBe(true);
            expect(getTrackWarnings(bankingTrack, felon)).toContain('Background Check Failed (Felony Record)');

            // Retail has no high-trust requirement and no degree requirement
            expect(isTrackLocked(retailTrack, felon)).toBe(false);
        });
    });

    describe('Education & Degree Lock Rules', () => {
        test('locks tracks requiring university degree when not graduated', () => {
            const user = { age: 24, universityGraduated: false };
            const techTrack = CAREER_TRACKS.find(t => t.key === 'software_eng');

            expect(isTrackLocked(techTrack, user)).toBe(true);
            expect(getTrackWarnings(techTrack, user)).toContain('University Degree Required');
        });

        test('locks tracks when university major does not match required majors', () => {
            const user = { age: 24, universityGraduated: true, major: 'English' };
            const techTrack = CAREER_TRACKS.find(t => t.key === 'software_eng'); // Requires Computer Science

            expect(isTrackLocked(techTrack, user)).toBe(true);
            const warnings = getTrackWarnings(techTrack, user);
            expect(warnings.some(w => w.includes('Major:'))).toBe(true);
        });

        test('unlocks track when major matches requirement', () => {
            const user = { age: 24, universityGraduated: true, major: 'Computer Science' };
            const techTrack = CAREER_TRACKS.find(t => t.key === 'software_eng');

            expect(isTrackLocked(techTrack, user)).toBe(false);
            expect(getTrackWarnings(techTrack, user)).toHaveLength(0);
        });

        test('locks tracks requiring graduate degrees unless degree matches', () => {
            const docTrack = CAREER_TRACKS.find(t => t.key === 'medicine');
            const userNoMed = { age: 28, universityGraduated: true, gradSchoolDegree: null };
            expect(isTrackLocked(docTrack, userNoMed)).toBe(true);
            expect(getTrackWarnings(docTrack, userNoMed)).toContain(`Requires ${docTrack.reqGrad}`);

            const userMed = { age: 28, universityGraduated: true, gradSchoolDegree: 'Medical School' };
            expect(isTrackLocked(docTrack, userMed)).toBe(false);
        });
    });

    describe('Part-Time Job Eligibility', () => {
        test('enforces minimum age requirements', () => {
            const rideShare = PART_TIME_JOBS.find(j => j.title === 'Ride-Share Driver'); // minAge 21
            expect(isPartTimeJobLocked(rideShare, { age: 16 })).toBe(true);
            expect(isPartTimeJobLocked(rideShare, { age: 21 })).toBe(false);
        });

        test('enforces university enrollment for specific jobs', () => {
            const tutor = PART_TIME_JOBS.find(j => j.title === 'Tutor'); // reqUniversity: true
            expect(isPartTimeJobLocked(tutor, { age: 19, universityEnrolled: false, universityGraduated: false })).toBe(true);
            expect(isPartTimeJobLocked(tutor, { age: 19, universityEnrolled: true })).toBe(false);
            expect(isPartTimeJobLocked(tutor, { age: 23, universityGraduated: true })).toBe(false);
        });

        test('isPartTimeTitle identifies titles in catalog', () => {
            expect(isPartTimeTitle('Barista')).toBe(true);
            expect(isPartTimeTitle('Software Engineer')).toBe(false);
            expect(isPartTimeTitle(null)).toBe(false);
        });
    });

    describe('Opportunity Lists Generation', () => {
        test('getEligibleCareers returns empty for users under 18', () => {
            expect(getEligibleCareers({ age: 17 })).toHaveLength(0);
        });

        test('getEligibleCareers returns city-scaled salaries sorted descending', () => {
            const user = { age: 22, city: 'New York', careerTrack: null };
            const careers = getEligibleCareers(user, { limit: 3 });

            expect(careers.length).toBeGreaterThan(0);
            expect(careers.length).toBeLessThanOrEqual(3);
            for (let i = 1; i < careers.length; i++) {
                expect(careers[i - 1].salary).toBeGreaterThanOrEqual(careers[i].salary);
            }
        });

        test('getEligiblePartTimeJobs returns empty for users under 15', () => {
            expect(getEligiblePartTimeJobs({ age: 14 })).toHaveLength(0);
            expect(getEligiblePartTimeJobs({ age: 15 }).length).toBeGreaterThan(0);
        });

        test('countDegreeCareers returns positive count of degree-locked careers', () => {
            expect(countDegreeCareers()).toBeGreaterThan(0);
        });
    });

    describe('Attention Badges & Promotion Engine', () => {
        test('needsWorkAttention flags unemployed adults not enrolled in school', () => {
            expect(needsWorkAttention({ age: 22, jobTitle: null, hasBusiness: false, isStudent: false })).toBe(true);
            expect(needsWorkAttention({ age: 22, jobTitle: 'Cashier' })).toBe(false);
            expect(needsWorkAttention({ age: 17, jobTitle: null })).toBe(false);
            expect(needsWorkAttention({ age: 70, isRetired: true, jobTitle: null })).toBe(false);
        });

        test('needsWorkAttention flags mafia members with unmet quota', () => {
            expect(needsWorkAttention({ age: 30, jobTitle: 'Muscle', careerTrack: 'mafia_syndicate', mafiaCrimesThisYear: 1 })).toBe(true);
            expect(needsWorkAttention({ age: 30, jobTitle: 'Muscle', careerTrack: 'mafia_syndicate', mafiaCrimesThisYear: 3 })).toBe(false);
        });

        test('needsAssetsAttention flags pending offers and low condition', () => {
            expect(needsAssetsAttention({ assets: [] })).toBe(false);
            expect(needsAssetsAttention({ assets: [{ category: 'property', pendingOffer: true }] })).toBe(true);
            expect(needsAssetsAttention({ assets: [{ category: 'property', condition: 15 }] })).toBe(true);
            expect(needsAssetsAttention({ assets: [{ category: 'property', condition: 85 }] })).toBe(false);
        });

        test('getPromotionStatus handles progression states', () => {
            const user = {
                careerTrack: 'retail',
                careerLevel: 0,
                yearsInRole: 0,
                jobPerformance: 60,
                city: 'Austin'
            };
            const statusWaiting = getPromotionStatus(user);
            expect(statusWaiting.state).toBe('waiting');
            expect(statusWaiting.yearsRemaining).toBe(2);

            user.yearsInRole = 2;
            user.jobPerformance = 50;
            const statusLowPerf = getPromotionStatus(user);
            expect(statusLowPerf.state).toBe('lowPerf');

            user.jobPerformance = 85;
            const statusEligible = getPromotionStatus(user);
            expect(statusEligible.state).toBe('eligible');

            user.careerLevel = 4; // Top level
            const statusTop = getPromotionStatus(user);
            expect(statusTop.state).toBe('top');
        });
    });

    describe('buildRecommendations Life Stage Workflows', () => {
        test('returns empty array for null, deceased, or prison states', () => {
            expect(buildRecommendations(null)).toHaveLength(0);
            expect(buildRecommendations({ lifeStatus: 'Deceased' })).toHaveLength(0);
            expect(buildRecommendations({ inPrison: true })).toHaveLength(0);
        });

        test('injects debt alert if bank balance is negative', () => {
            const user = { age: 25, money: -500, city: 'Denver' };
            const recs = buildRecommendations(user);
            expect(recs.some(r => r.id === 'alert-debt')).toBe(true);
        });

        test('handles baby/toddler stage (< 5)', () => {
            const recs = buildRecommendations({ age: 2 });
            expect(recs.some(r => r.id === 'too-young')).toBe(true);
        });

        test('handles business owner stage', () => {
            const recs = buildRecommendations({ age: 32, hasBusiness: true, companyName: 'Apex Inc', compCash: 50000 });
            expect(recs.some(r => r.id === 'manage-business')).toBe(true);
        });

        test('handles mafia syndicate member stage', () => {
            const recs = buildRecommendations({ age: 30, careerTrack: 'mafia_syndicate', mafiaCrimesThisYear: 2, jobTitle: 'Muscle' });
            expect(recs.some(r => r.id === 'mafia-quota')).toBe(true);
        });

        test('handles retired stage', () => {
            const recs = buildRecommendations({ age: 65, isRetired: true, jobTitle: null, retirementPension: 45000 });
            expect(recs.some(r => r.id === 'retired')).toBe(true);
        });

        test('handles student under 18 stage', () => {
            const teen = { age: 16, schoolPerformance: 80, highSchoolGraduated: false };
            const recs = buildRecommendations(teen);
            expect(recs.some(r => r.id === 'school-performance')).toBe(true);
            expect(recs.some(r => r.kind === 'job')).toBe(true); // Part-time job recommendations at 16
        });

        test('handles full career employed adult stage', () => {
            const user = {
                age: 26,
                careerTrack: 'retail',
                careerLevel: 1,
                jobTitle: 'Sales Associate',
                jobSalary: 34000,
                jobPerformance: 80,
                yearsInRole: 3,
                careerActionTaken: false,
                city: 'Dallas'
            };
            const recs = buildRecommendations(user);
            expect(recs.some(r => r.id === 'job-performance')).toBe(true);
            expect(recs.some(r => r.id === 'promo')).toBe(true);
            expect(recs.some(r => r.id === 'work-harder')).toBe(true);
        });

        test('handles unemployed adult stage with career recommendations and university CTA', () => {
            const user = {
                age: 20,
                money: 1000,
                highSchoolGraduated: true,
                universityGraduated: false,
                universityEnrolled: false,
                jobTitle: null,
                hasBusiness: false,
                city: 'Phoenix'
            };
            const recs = buildRecommendations(user);
            expect(recs.some(r => r.id === 'alert-unemployed')).toBe(true);
            expect(recs.some(r => r.kind === 'career')).toBe(true);
            expect(recs.some(r => r.id === 'enroll-university')).toBe(true);
        });
    });
});
