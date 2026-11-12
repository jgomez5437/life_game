import { EulogyGenerator, harvestLifeProfile, classifyArchetype } from '../../public/src/core/eulogyGenerator.js';

describe('Procedural Eulogy Generator Suite', () => {
    test('Harvests life profile with correct pronouns, estate, and categories', () => {
        const user = {
            username: 'Jane Doe',
            gender: 'female',
            age: 68,
            city: 'London',
            country: 'United Kingdom',
            money: 50000,
            jobTitle: 'Senior Architect',
            relationships: [
                { type: 'Husband', category: 'spouse', name: 'John Doe' },
                { type: 'Son', category: 'child', name: 'Billy' },
                { type: 'Daughter', category: 'child', name: 'Sarah' }
            ],
            assets: [
                { category: 'property', value: 450000 }
            ]
        };

        const profile = harvestLifeProfile(user, [], 'Heart Attack');
        expect(profile.name).toBe('Jane Doe');
        expect(profile.pronouns.sub).toBe('she');
        expect(profile.pronouns.pos).toBe('her');
        expect(profile.totalEstate).toBe(500000);
        expect(profile.wealthTier).toBe('wealthy');
        expect(profile.childrenCount).toBe(2);
        expect(profile.hasSpouse).toBe(true);
        expect(profile.deathCause).toBe('Heart Attack');
    });

    test('Classifies archetypes correctly', () => {
        // 1. Innocent Youth (< 18)
        expect(classifyArchetype({ age: 14, wealthTier: 'modest', crimesCommitted: 0 })).toBe('INNOCENT_YOUTH');

        // 2. Career Criminal
        expect(classifyArchetype({ age: 45, inPrison: true, prisonYears: 10, crimesCommitted: 4 })).toBe('CAREER_CRIMINAL');

        // 3. Corporate Tycoon
        expect(classifyArchetype({ age: 60, wealthTier: 'tycoon', hasBusiness: true })).toBe('CORPORATE_TYCOON');

        // 4. Serial Romantic
        expect(classifyArchetype({ age: 52, divorcesCount: 3, marriagesCount: 4, wealthTier: 'modest' })).toBe('SERIAL_ROMANTIC');

        // 5. Devoted Family
        expect(classifyArchetype({ age: 75, childrenCount: 4, marriagesCount: 1, divorcesCount: 0, wealthTier: 'modest' })).toBe('DEVOTED_FAMILY');

        // 6. Broke Dreamer / Debt
        expect(classifyArchetype({ age: 55, wealthTier: 'debt', lotteryWins: 2, crimesCommitted: 0 })).toBe('BROKE_DREAMER');

        // 7. Lovable Slacker
        expect(classifyArchetype({ age: 38, jobTitle: null, crimesCommitted: 0, totalEstate: 2000, wealthTier: 'broke' })).toBe('LOVABLE_SLACKER');

        // 8. Scholar Professional
        expect(classifyArchetype({ age: 65, gradDegree: true, jobTitle: 'Brain Surgeon', wealthTier: 'wealthy' })).toBe('SCHOLAR_PROFESSIONAL');
    });

    test('Generates an intricate narrative (4-6 sentences) for various life scenarios', () => {
        const testScenarios = [
            {
                // Tycoon
                user: { username: 'Bruce Wayne', gender: 'male', age: 72, money: 50000000, jobTitle: 'Chief Executive Officer', city: 'Gotham', country: 'United States' },
                cause: 'Old Age'
            },
            {
                // Outlaw
                user: { username: 'Bonnie Parker', gender: 'female', age: 34, inPrison: true, prisonTotalSentence: 15, city: 'Dallas', country: 'United States' },
                cause: 'Prison Brawl'
            },
            {
                // Slacker in debt
                user: { username: 'Lazy Joe', gender: 'male', age: 58, money: -25000, jobTitle: null, city: 'Austin', country: 'United States' },
                cause: 'Junk Food Complications'
            },
            {
                // Minor
                user: { username: 'Timmy', gender: 'male', age: 11, city: 'Seattle', country: 'United States' },
                cause: 'Bicycle Mishap'
            },
            {
                // Devoted mother
                user: {
                    username: 'Maria Santos',
                    gender: 'female',
                    age: 89,
                    money: 80000,
                    jobTitle: 'School Teacher',
                    relationships: [
                        { type: 'Husband', category: 'spouse', name: 'Carlos Santos' },
                        { type: 'Son', category: 'child', name: 'Mateo' },
                        { type: 'Daughter', category: 'child', name: 'Sofia' },
                        { type: 'Son', category: 'child', name: 'Lucas' }
                    ],
                    city: 'Madrid',
                    country: 'Spain'
                },
                cause: 'Natural Causes'
            }
        ];

        testScenarios.forEach(({ user, cause }) => {
            const eulogy = EulogyGenerator.generate(user, [], cause);
            expect(typeof eulogy).toBe('string');
            expect(eulogy.length).toBeGreaterThan(100);

            // Count sentences by splitting on terminal punctuation followed by space or end of string
            const sentences = eulogy.match(/[^.!?]+[.!?]+/g) || [];
            expect(sentences.length).toBeGreaterThanOrEqual(4);
            expect(sentences.length).toBeLessThanOrEqual(6);
        });
    });

    test('Eulogy generation is deterministic based on character identity', () => {
        const user = {
            username: 'Alexander Hamilton',
            gender: 'male',
            age: 47,
            money: 120000,
            jobTitle: 'Treasury Secretary',
            city: 'New York',
            country: 'United States'
        };
        const cause = 'Duel Mishap';

        const eulogy1 = EulogyGenerator.generate(user, [], cause);
        const eulogy2 = EulogyGenerator.generate(user, [], cause);
        expect(eulogy1).toBe(eulogy2);
    });

    test('Tone guardrails for minors (< 18) remain gentle and poignant', () => {
        const childUser = {
            username: 'Little Emma',
            gender: 'female',
            age: 9,
            city: 'Denver',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(childUser, [], 'Freak Accident');
        expect(eulogy).not.toContain('divorce');
        expect(eulogy).not.toContain('parole');
        expect(eulogy).not.toContain('penal code');
        expect(eulogy).not.toContain('tax');
        expect(eulogy).not.toContain('cubicle');
        expect(eulogy).toContain('Little Emma');

        const sentences = eulogy.match(/[^.!?]+[.!?]+/g) || [];
        expect(sentences.length).toBe(4);
    });

    test('Unemployed character never receives fake job titles or honest labor phrasing', () => {
        const user = {
            username: 'd d',
            gender: 'male',
            age: 85,
            city: 'New York',
            country: 'United States',
            money: -2000000,
            jobTitle: null
        };
        const eulogy = EulogyGenerator.generate(user, [], 'Old Age');
        expect(eulogy).not.toContain('freelancer');
        expect(eulogy).not.toContain('honest labor');
        expect(eulogy).not.toContain('day job');
        expect(eulogy).toContain('d d');
    });

    test('Handles missing fields and edge cases gracefully without throwing', () => {
        expect(() => EulogyGenerator.generate(null)).not.toThrow();
        expect(() => EulogyGenerator.generate({})).not.toThrow();
        expect(() => EulogyGenerator.generate({ username: '', age: null, money: undefined })).not.toThrow();

        const emptyEulogy = EulogyGenerator.generate({});
        expect(typeof emptyEulogy).toBe('string');
        const sentences = emptyEulogy.match(/[^.!?]+[.!?]+/g) || [];
        expect(sentences.length).toBeGreaterThanOrEqual(4);
        expect(sentences.length).toBeLessThanOrEqual(6);
    });

    test('Graveyard ancestor schema (ageAtDeath, causeOfDeath, finalNetWorth) produces correct eulogy', () => {
        const ancestor = {
            name: 'Grandpa Joe',
            gender: 'male',
            ageAtDeath: 78,
            causeOfDeath: 'Old Age',
            occupation: 'Chief Executive Officer',
            finalNetWorth: 2500000,
            city: 'Chicago',
            country: 'United States'
        };
        const profile = harvestLifeProfile(ancestor);
        expect(profile.age).toBe(78);
        expect(profile.totalEstate).toBe(2500000);
        expect(profile.jobTitle).toBe('Chief Executive Officer');

        const archetype = classifyArchetype(profile);
        expect(archetype).not.toBe('INNOCENT_YOUTH');

        const eulogy = EulogyGenerator.generate(ancestor, [], ancestor.causeOfDeath);
        expect(eulogy).not.toContain('age 0');
        expect(eulogy).not.toContain('playground');
        expect(eulogy).not.toContain('homework');
        expect(eulogy).toContain('Grandpa Joe');
    });

    test('Death causes with trailing periods do not produce double punctuation', () => {
        const user = {
            username: 'Period Test',
            gender: 'female',
            age: 70,
            money: 80000,
            jobTitle: 'Nurse',
            city: 'Boston',
            country: 'United States'
        };
        // All MORTALITY_RATES causes end with a period
        const causesWithPeriods = ['cancer.', 'old age.', 'a fatal car crash.', 'natural causes.'];
        causesWithPeriods.forEach(cause => {
            const eulogy = EulogyGenerator.generate(user, [], cause);
            expect(eulogy).not.toMatch(/\.,/);    // no "cancer.,"
            expect(eulogy).not.toMatch(/\.\./);   // no "old age.."
            expect(eulogy).not.toMatch(/\."/);    // no 'cancer."' mid-sentence
        });
    });

    // =========================================================================
    // SPECIFIC GAME SYSTEMS VALIDATION
    // =========================================================================

    test('Weaves in Pro Athlete career, championship rings, and MVP awards', () => {
        const athlete = {
            username: 'Kobe Miller',
            gender: 'male',
            age: 39,
            money: 85000000,
            careerTrack: 'pro_athlete',
            athleteSport: 'basketball',
            athleteRings: 3,
            athleteMvps: 2,
            athleteCareerEarnings: 120000000,
            city: 'Los Angeles',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(athlete, [], 'Helicopter Incident');
        expect(eulogy).toContain('Premier Basketball Association');
        expect(eulogy).toContain('championship rings');
        expect(eulogy).toContain('MVP awards');
    });

    test('Weaves in Mafia Syndicate Don rank and La Cosa Nostra', () => {
        const mobster = {
            username: 'Vito Corleone',
            gender: 'male',
            age: 62,
            money: 15000000,
            careerTrack: 'mafia_syndicate',
            jobTitle: 'The Don',
            careerLevel: 4,
            city: 'New York',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(mobster, [], 'Heart Attack');
        expect(eulogy).toContain('The Don');
        expect(eulogy).toContain('La Cosa Nostra');
    });

    test('Weaves in Entrepreneur company name, industry, and public IPO', () => {
        const founder = {
            username: 'Elon Vance',
            gender: 'male',
            age: 54,
            money: 25000000,
            hasBusiness: true,
            companyName: 'HyperCloud Technologies',
            industry: 'tech_saas',
            isPublic: true,
            employees: 150,
            city: 'San Francisco',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(founder, [], 'Workplace Overexertion');
        expect(eulogy).toContain('HyperCloud Technologies');
        expect(eulogy).toContain('IPO');
    });

    test('Weaves in University major and Graduate School degree', () => {
        const doctor = {
            username: 'Dr. Gregory House',
            gender: 'male',
            age: 58,
            money: 450000,
            major: 'Biology',
            gradSchoolDegree: 'Medical School',
            jobTitle: 'Chief of Medicine',
            city: 'Princeton',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(doctor, [], 'Complications');
        expect(eulogy).toContain('Doctor of Medicine (M.D.)');
    });

    test('Weaves in named relationships (spouse, children, best friend, rival)', () => {
        const player = {
            username: 'Arthur Pendelton',
            gender: 'male',
            age: 65,
            money: 150000,
            jobTitle: 'Banker',
            relationships: [
                { type: 'Wife', category: 'spouse', name: 'Guinevere' },
                { type: 'Son', category: 'child', name: 'Lancelot' },
                { type: 'Daughter', category: 'child', name: 'Elaine' },
                { type: 'Friend', category: 'friend', name: 'Merlin', status: 95 },
                { type: 'Enemy', category: 'enemy', name: 'Mordred', status: 5 }
            ],
            city: 'London',
            country: 'United Kingdom'
        };

        const eulogy = EulogyGenerator.generate(player, [], 'Natural Causes');
        expect(eulogy).toContain('Guinevere');
        expect(eulogy).toContain('Lancelot');
        expect(eulogy).toContain('Elaine');
        expect(eulogy).toContain('Merlin');
        expect(eulogy).toContain('Mordred');
    });

    test('Weaves in musical instrument mastery and real estate portfolio', () => {
        const musician = {
            username: 'Ludwig Beethoven',
            gender: 'male',
            age: 56,
            money: 300000,
            jobTitle: 'Composer',
            skills: {
                piano: { xp: 95, certified: true }
            },
            assets: [
                { category: 'property', name: 'Vienna Manor Estate', value: 800000, isRented: true },
                { category: 'property', name: 'Rhine Villa', value: 450000, isRented: true },
                { category: 'property', name: 'Mountain Retreat', value: 350000 }
            ],
            city: 'Vienna',
            country: 'Austria'
        };

        const eulogy = EulogyGenerator.generate(musician, [], 'Liver Failure');
        expect(eulogy.toLowerCase()).toContain('piano');
        expect(eulogy).toContain('Vienna Manor Estate');
        expect(eulogy).toContain('3');
    });

    test('Weaves in prison incarceration, facility name, and cellmate', () => {
        const convict = {
            username: 'Red Redding',
            gender: 'male',
            age: 60,
            inPrison: true,
            prisonTotalSentence: 25,
            facilityName: 'Shawshank State Prison',
            cellmate: { name: 'Andy Dufresne' },
            city: 'Portland',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(convict, [], 'Old Age');
        expect(eulogy).toContain('Shawshank State Prison');
        expect(eulogy).toContain('Andy Dufresne');
    });

    test('Weaves in multi-generational lineage and ancestor tribute', () => {
        const heir = {
            username: 'John Rockefeller III',
            gender: 'male',
            age: 70,
            money: 5000000,
            generation: 3,
            pastLives: [
                { name: 'John Rockefeller Jr.', ageAtDeath: 86 }
            ],
            city: 'New York',
            country: 'United States'
        };

        const eulogy = EulogyGenerator.generate(heir, [], 'Natural Causes');
        expect(eulogy).toContain('John Rockefeller Jr.');
        expect(eulogy).toContain('3rd-generation');
    });
});
