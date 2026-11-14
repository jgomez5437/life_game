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
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../../public/src/core/gameLogic.js');


describe('Relationship Logic', () => {
    test('calculateRelationshipDecay applies -5 decay if no interaction', () => {
        expect(GameLogic.calculateRelationshipDecay(50, false)).toBe(45);
        expect(GameLogic.calculateRelationshipDecay(2, false)).toBe(0);
    });

    test('calculateRelationshipDecay applies 0 decay if interaction occurred', () => {
        expect(GameLogic.calculateRelationshipDecay(50, true)).toBe(50);
    });

    test('calculateRelationshipDecay exempts family from passive decay while the player is a minor', () => {
        expect(GameLogic.calculateRelationshipDecay(50, false, 'family', 18)).toBe(50);
        expect(GameLogic.calculateRelationshipDecay(50, false, 'family', 10)).toBe(50);
        // Adults still decay normally, as do non-family categories at any age
        expect(GameLogic.calculateRelationshipDecay(50, false, 'family', 19)).toBe(45);
        expect(GameLogic.calculateRelationshipDecay(50, false, 'friend', 10)).toBe(45);
    });

    test('calculateRelationshipDecay exempts classmates from passive decay at any age', () => {
        expect(GameLogic.calculateRelationshipDecay(50, false, 'classmate', 10)).toBe(50);
        expect(GameLogic.calculateRelationshipDecay(50, false, 'classmate', 20)).toBe(50);
    });

    test('checkRelationshipCategoryShift shifts non-family appropriately', () => {
        expect(GameLogic.checkRelationshipCategoryShift('friend', 20)).toBe('enemy');
        expect(GameLogic.checkRelationshipCategoryShift('friend', 40)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('enemy', 40)).toBe('friend');
        expect(GameLogic.checkRelationshipCategoryShift('enemy', 20)).toBe(null);
    });

    test('checkRelationshipCategoryShift ignores family', () => {
        expect(GameLogic.checkRelationshipCategoryShift('family', 20)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('spouse', 10)).toBe(null);
        expect(GameLogic.checkRelationshipCategoryShift('child', 0)).toBe(null);
    });

    test('calculateInheritance returns 0 on bottom 15% roll', () => {
        expect(GameLogic.calculateInheritance(80, 0.10)).toBe(0);
    });

    test('calculateInheritance scales properly based on age and roll', () => {
        const amt25 = GameLogic.calculateInheritance(25, 0.5); // base 5000 * multiplier
        const amt40 = GameLogic.calculateInheritance(40, 0.5); // base 25000 * multiplier
        const amt60 = GameLogic.calculateInheritance(60, 0.5); // base 100000 * multiplier
        
        expect(amt40).toBeGreaterThan(amt25);
        expect(amt60).toBeGreaterThan(amt40);
        
        // Verify rounded to 100
        expect(amt60 % 100).toBe(0);
    });

    test('generateSchoolCohort returns classmates with correct ages and one teacher', () => {
        const cohort = GameLogic.generateSchoolCohort(10);
        expect(cohort.length).toBeGreaterThanOrEqual(13); // 12-16 classmates + 1 teacher
        
        const teacher = cohort.find(p => p.type === 'Teacher');
        expect(teacher).toBeDefined();
        expect(teacher.age).toBeGreaterThanOrEqual(24);
        expect(teacher.age).toBeLessThanOrEqual(60);

        const classmates = cohort.filter(p => p.type === 'Classmate');
        classmates.forEach(c => {
            expect(c.age).toBeGreaterThanOrEqual(9);
            expect(c.age).toBeLessThanOrEqual(11);
            expect(c.status).toBeGreaterThanOrEqual(20);
            expect(c.status).toBeLessThanOrEqual(50);
        });
    });

    describe('generateStranger', () => {
        test('always returns the opposite gender of the player', () => {
            expect(GameLogic.generateStranger(25, 'male', 0.5).gender).toBe('female');
            expect(GameLogic.generateStranger(25, 'female', 0.5).gender).toBe('male');
        });

        test('age is within [max(18, userAge-3), userAge+5] and category starts as friend', () => {
            const stranger = GameLogic.generateStranger(25, 'male', 0.0);
            expect(stranger.age).toBeGreaterThanOrEqual(22);
            expect(stranger.age).toBeLessThanOrEqual(30);
            expect(stranger.category).toBe('friend');
            expect(stranger.type).toBe('Friend');
        });

        test('enforces an 18+ floor even for very young players', () => {
            const stranger = GameLogic.generateStranger(16, 'female', 0.0);
            expect(stranger.age).toBeGreaterThanOrEqual(18);
        });

        test('determineNPCGender respects attractionPreference', () => {
            expect(GameLogic.determineNPCGender('male', 'women')).toBe('female');
            expect(GameLogic.determineNPCGender('male', 'men')).toBe('male');
            expect(GameLogic.determineNPCGender('female', 'women')).toBe('female');
            expect(GameLogic.determineNPCGender('female', 'men')).toBe('male');
        });

        test('generateDatingProfiles returns requested count of profiles with bios and hobbies', () => {
            const user = { age: 24, gender: 'male', attractionPreference: 'women' };
            const profiles = GameLogic.generateDatingProfiles(user, 3);
            expect(profiles.length).toBe(3);
            profiles.forEach(p => {
                expect(p.gender).toBe('female');
                expect(p.age).toBeGreaterThanOrEqual(18);
                expect(p.bio).toBeDefined();
                expect(p.hobbies.length).toBe(2);
            });
        });

        test('generateTargetedStranger handles romantic and platonic preferences', () => {
            const user = { age: 22, gender: 'female', attractionPreference: 'men' };
            const dateStr = GameLogic.generateTargetedStranger(user, 'romantic');
            expect(dateStr.gender).toBe('male');
            expect(dateStr.type).toBe('Crush');

            const friendStr = GameLogic.generateTargetedStranger(user, 'friend');
            expect(friendStr.type).toBe('Friend');
        });

        test('generateLuxuryMatch respects age presets, wealth tiers, and high status floor', () => {
            const user = { age: 30, gender: 'male', attractionPreference: 'women' };
            const match = GameLogic.generateLuxuryMatch(user, { agePreset: '26-35', wealthTier: 'ultra_wealthy' });
            expect(match.gender).toBe('female');
            expect(match.age).toBeGreaterThanOrEqual(26);
            expect(match.age).toBeLessThanOrEqual(35);
            expect(match.status).toBeGreaterThanOrEqual(65);
            expect(match.income).toBeGreaterThanOrEqual(500000);
            expect(match.type).toBe('Crush');
        });

        test('make_a_move is available for friends/classmates, blocked for Ex-Lover', () => {
            const user = { age: 25, gender: 'male', relationships: [] };
            const friend = { category: 'friend', type: 'Friend', status: 60 };
            const exLover = { category: 'friend', type: 'Ex-Lover', status: 60 };
            const secretAffair = { category: 'friend', type: 'Secret Affair', status: 70 };

            expect(GameLogic.getAvailableInteractions(friend, user).map(i => i.key)).toContain('make_a_move');
            expect(GameLogic.getAvailableInteractions(exLover, user).map(i => i.key)).not.toContain('make_a_move');
            expect(GameLogic.getAvailableInteractions(exLover, user).map(i => i.key)).not.toContain('make_love');
            expect(GameLogic.getAvailableInteractions(secretAffair, user).map(i => i.key)).toContain('end_affair');
            expect(GameLogic.getAvailableInteractions(secretAffair, user).map(i => i.key)).toContain('make_love');
        });

        test('checkAgeUpInfidelityDiscovery detects unfaithful hookups when partnered', () => {
            const partner = { id: 'p1', name: 'Jane', category: 'spouse', type: 'Wife' };
            const affair = { id: 'a1', name: 'Sarah', category: 'friend', type: 'Secret Affair' };
            const user = { relationships: [partner, affair], hadUnfaithfulHookupThisYear: true };

            let caughtCount = 0;
            for (let i = 0; i < 100; i++) {
                const res = GameLogic.checkAgeUpInfidelityDiscovery(user);
                if (res) caughtCount++;
            }
            expect(caughtCount).toBeGreaterThan(5);
        });

        test('romantic and intimate interactions are strictly hidden and blocked between minors and adults', () => {
            const minorUser = { age: 16, gender: 'male', relationships: [] };
            const adultTeacher = { age: 32, gender: 'female', category: 'friend', status: 80 };
            const minorFriend = { age: 16, gender: 'female', category: 'friend', status: 80 };

            // Minor user vs adult teacher -> Hidden from getAvailableInteractions
            const teacherActions = GameLogic.getAvailableInteractions(adultTeacher, minorUser).map(i => i.key);
            expect(teacherActions).not.toContain('make_a_move');
            expect(teacherActions).not.toContain('ask_out');
            expect(teacherActions).not.toContain('make_love');

            // Minor user vs adult teacher -> BLOCKED if checked directly
            expect(GameLogic.isInteractionBlocked('make_a_move', adultTeacher, minorUser)).toEqual({
                blocked: true,
                reason: 'Age Gap (Minor & Adult)'
            });
            expect(GameLogic.isInteractionBlocked('ask_out', adultTeacher, minorUser)).toEqual({
                blocked: true,
                reason: 'Age Gap (Minor & Adult)'
            });

            // Minor user vs minor friend -> Available in getAvailableInteractions
            const friendActions = GameLogic.getAvailableInteractions(minorFriend, minorUser).map(i => i.key);
            expect(friendActions).toContain('make_a_move');
            expect(friendActions).toContain('ask_out');

            // Adult user vs minor -> Hidden
            const adultUser = { age: 25, gender: 'male', relationships: [] };
            const adultVsMinorActions = GameLogic.getAvailableInteractions(minorFriend, adultUser).map(i => i.key);
            expect(adultVsMinorActions).not.toContain('make_a_move');
            expect(adultVsMinorActions).not.toContain('ask_out');
        });

        test('playLotteryTicket blocks players under 18 years old', () => {
            const childUser = { age: 12, money: 500 };
            const adultUser = { age: 25, money: 500 };

            expect(GameLogic.playLotteryTicket('scratch', childUser)).toEqual({
                success: false,
                message: 'You must be at least 18 years old to play the lottery.'
            });

            const adultRes = GameLogic.playLotteryTicket('scratch', adultUser);
            expect(adultRes.success).toBe(true);
        });
    });

    describe('Romance interactions (Chunk 1)', () => {
        test('ask_out only appears for opposite-gender friends with status >= 40, and disappears once already partnered', () => {
            const user = { gender: 'male', relationships: [] };
            const eligibleFriend = { category: 'friend', gender: 'female', status: 50 };
            const tooColdFriend = { category: 'friend', gender: 'female', status: 30 };
            const sameGenderFriend = { category: 'friend', gender: 'male', status: 50 };

            expect(GameLogic.getAvailableInteractions(eligibleFriend, user).map(i => i.key)).toContain('ask_out');
            expect(GameLogic.getAvailableInteractions(tooColdFriend, user).map(i => i.key)).toContain('ask_out'); // visible, but blocked by status gate
            expect(GameLogic.isInteractionBlocked('ask_out', tooColdFriend, { age: 25 }).blocked).toBe(true);
            expect(GameLogic.getAvailableInteractions(sameGenderFriend, user).map(i => i.key)).not.toContain('ask_out');

            // Monogamy gate: already has a partner
            const attachedUser = { gender: 'male', relationships: [{ category: 'partner' }] };
            expect(GameLogic.getAvailableInteractions(eligibleFriend, attachedUser).map(i => i.key)).not.toContain('ask_out');
        });

        test('flirt/go_on_date/make_love only apply to partner (and make_love also spouse) category', () => {
            const partner = { category: 'partner', status: 50 };
            const spouse = { category: 'spouse', status: 50 };
            const friend = { category: 'friend', status: 50 };

            const partnerKeys = GameLogic.getAvailableInteractions(partner, { relationships: [] }).map(i => i.key);
            expect(partnerKeys).toEqual(expect.arrayContaining(['flirt', 'go_on_date', 'make_love', 'break_up']));

            const spouseKeys = GameLogic.getAvailableInteractions(spouse, { relationships: [] }).map(i => i.key);
            expect(spouseKeys).toContain('make_love');
            expect(spouseKeys).not.toContain('flirt');
            expect(spouseKeys).not.toContain('break_up');

            const friendKeys = GameLogic.getAvailableInteractions(friend, { relationships: [] }).map(i => i.key);
            expect(friendKeys).not.toEqual(expect.arrayContaining(['flirt', 'go_on_date', 'make_love', 'break_up']));
        });

        test('make_love is blocked under 18 for either party, flirt/go_on_date blocked under 16', () => {
            const partner = { category: 'partner', status: 50, age: 17 };
            expect(GameLogic.isInteractionBlocked('make_love', partner, { age: 25 }).blocked).toBe(true);
            expect(GameLogic.isInteractionBlocked('make_love', { ...partner, age: 18 }, { age: 17 }).blocked).toBe(true);
            expect(GameLogic.isInteractionBlocked('make_love', { ...partner, age: 18 }, { age: 18 }).blocked).toBe(false);

            expect(GameLogic.isInteractionBlocked('flirt', { category: 'partner', status: 50, age: 15 }, { age: 25 }).blocked).toBe(true);
            expect(GameLogic.isInteractionBlocked('flirt', { category: 'partner', status: 50, age: 16 }, { age: 16 }).blocked).toBe(false);
        });

        test('partner and ex categories are exempt from decay-driven category shifting', () => {
            expect(GameLogic.checkRelationshipCategoryShift('partner', 5)).toBe(null);
            expect(GameLogic.checkRelationshipCategoryShift('ex', 5)).toBe(null);
        });
    });

    describe('Marriage & Divorce (Chunk 2)', () => {
        test('calculateProposalAcceptance scales with status like attemptBefriend', () => {
            expect(GameLogic.calculateProposalAcceptance(75, 0.7)).toBe(true);
            expect(GameLogic.calculateProposalAcceptance(75, 0.8)).toBe(false);
        });

        test('propose only shows for Boyfriend/Girlfriend with status >= 75', () => {
            const eligible = { category: 'partner', type: 'Boyfriend', status: 80 };
            const tooEarly = { category: 'partner', type: 'Boyfriend', status: 60 };
            const alreadyEngaged = { category: 'partner', type: 'Fiancé', status: 80 };

            expect(GameLogic.getAvailableInteractions(eligible, {}).map(i => i.key)).toContain('propose');
            expect(GameLogic.isInteractionBlocked('propose', tooEarly, { age: 25 }).blocked).toBe(true);
            expect(GameLogic.getAvailableInteractions(alreadyEngaged, {}).map(i => i.key)).not.toContain('propose');
        });

        test('get_married only shows for Fiancé/Fiancée and carries a directAction', () => {
            const fiance = { category: 'partner', type: 'Fiancé', status: 80 };
            const boyfriend = { category: 'partner', type: 'Boyfriend', status: 80 };

            const fianceInteractions = GameLogic.getAvailableInteractions(fiance, {});
            expect(fianceInteractions.map(i => i.key)).toContain('get_married');
            expect(fianceInteractions.find(i => i.key === 'get_married').directAction).toBe('openWeddingPlanner');
            expect(GameLogic.getAvailableInteractions(boyfriend, {}).map(i => i.key)).not.toContain('get_married');
        });

        test('file_divorce only shows for spouse category', () => {
            const spouse = { category: 'spouse', type: 'Wife', status: 50 };
            const partner = { category: 'partner', type: 'Fiancée', status: 50 };

            expect(GameLogic.getAvailableInteractions(spouse, {}).map(i => i.key)).toContain('file_divorce');
            expect(GameLogic.getAvailableInteractions(partner, {}).map(i => i.key)).not.toContain('file_divorce');
        });
    });

    describe('Pregnancy & Birth (Chunk 3)', () => {
        test('calculatePregnancyChance enforces female 45+ and male 65+ limits', () => {
            expect(GameLogic.calculatePregnancyChance(30, 30, 0.4)).toBe(true);   // female 30, male 30
            expect(GameLogic.calculatePregnancyChance(30, 30, 0.6)).toBe(false);
            expect(GameLogic.calculatePregnancyChance(37, 30, 0.25)).toBe(true);  // female 37, male 30 -> 0.3 chance
            expect(GameLogic.calculatePregnancyChance(42, 30, 0.05)).toBe(true);  // female 42, male 30 -> 0.1 chance
            expect(GameLogic.calculatePregnancyChance(45, 30, 0.001)).toBe(false); // female age 45+ limit
            expect(GameLogic.calculatePregnancyChance(30, 65, 0.001)).toBe(false); // male age 65+ limit
            expect(GameLogic.calculatePregnancyChance(25, 64, 0.4)).toBe(true);   // male 64 is under limit
        });

        test('try_for_baby is blocked for female age 45+ and male age 65+', () => {
            const wife25 = { category: 'spouse', type: 'Wife', status: 50, age: 25 };
            const wife45 = { category: 'spouse', type: 'Wife', status: 50, age: 45 };
            const husband65 = { category: 'spouse', type: 'Husband', status: 50, age: 65 };
            const partner = { category: 'partner', type: 'Fiancée', status: 50, age: 25 };

            expect(GameLogic.getAvailableInteractions(wife25, {}).map(i => i.key)).toContain('try_for_baby');
            expect(GameLogic.getAvailableInteractions(partner, {}).map(i => i.key)).not.toContain('try_for_baby');

            expect(GameLogic.isInteractionBlocked('try_for_baby', wife25, { age: 25, gender: 'male', isExpecting: true })).toEqual({ blocked: true, reason: 'Already Expecting' });
            expect(GameLogic.isInteractionBlocked('try_for_baby', wife25, { age: 25, gender: 'male', isExpecting: false })).toEqual({ blocked: false, reason: '' });

            // Female age 45+ block
            expect(GameLogic.isInteractionBlocked('try_for_baby', wife45, { age: 30, gender: 'male' })).toEqual({ blocked: true, reason: 'Female Too Old' });
            expect(GameLogic.isInteractionBlocked('try_for_baby', husband65, { age: 45, gender: 'female' })).toEqual({ blocked: true, reason: 'Female Too Old' });

            // Male age 65+ block
            expect(GameLogic.isInteractionBlocked('try_for_baby', husband65, { age: 30, gender: 'female' })).toEqual({ blocked: true, reason: 'Male Too Old' });
            expect(GameLogic.isInteractionBlocked('try_for_baby', wife25, { age: 65, gender: 'male' })).toEqual({ blocked: true, reason: 'Male Too Old' });
        });

        test('try_for_baby is blocked under 18 for either party', () => {
            const youngSpouse = { category: 'spouse', type: 'Husband', status: 50, age: 17 };
            expect(GameLogic.isInteractionBlocked('try_for_baby', youngSpouse, { age: 25 }).blocked).toBe(true);
            expect(GameLogic.isInteractionBlocked('try_for_baby', { ...youngSpouse, age: 18 }, { age: 17 }).blocked).toBe(true);
            expect(GameLogic.isInteractionBlocked('try_for_baby', { ...youngSpouse, age: 18 }, { age: 18 }).blocked).toBe(false);
        });
    });

    test('attemptBefriend handles status chance correctly', () => {
        // Roll = 0.4. Status 50 => chance 0.50 => 0.4 < 0.50 => true
        expect(GameLogic.attemptBefriend(50, false, 0.4)).toBe(true);
        // Roll = 0.6. Status 50 => chance 0.50 => 0.6 < 0.50 => false
        expect(GameLogic.attemptBefriend(50, false, 0.6)).toBe(false);

        // Teacher: status 50 => chance 0.25 => 0.2 < 0.25 => true
        expect(GameLogic.attemptBefriend(50, true, 0.2)).toBe(true);
        // Teacher: status 50 => chance 0.25 => 0.3 < 0.25 => false
        expect(GameLogic.attemptBefriend(50, true, 0.3)).toBe(false);
    });
});

describe('Relationship Interaction Catalog', () => {
    test('isHostile uses a lower floor (15) for family/spouse/child, higher (30) for everyone else', () => {
        expect(GameLogic.isHostile({ category: 'family', status: 20 })).toBe(false);
        expect(GameLogic.isHostile({ category: 'family', status: 10 })).toBe(true);
        expect(GameLogic.isHostile({ category: 'spouse', status: 14 })).toBe(true);
        expect(GameLogic.isHostile({ category: 'child', status: 15 })).toBe(false);
        expect(GameLogic.isHostile({ category: 'friend', status: 20 })).toBe(true);
        expect(GameLogic.isHostile({ category: 'friend', status: 30 })).toBe(false);
    });

    test('getAvailableInteractions only includes ask_friend for classmates', () => {
        const classmate = { category: 'classmate', type: 'Classmate', status: 50 };
        const friend = { category: 'friend', type: 'Friend', status: 50 };

        const classmateKeys = GameLogic.getAvailableInteractions(classmate, { relationships: [] }).map(i => i.key);
        const friendKeys = GameLogic.getAvailableInteractions(friend, { relationships: [] }).map(i => i.key);

        expect(classmateKeys).toContain('ask_friend');
        expect(friendKeys).not.toContain('ask_friend');
        expect(friendKeys).toEqual(expect.arrayContaining(['spend_time', 'give_money', 'insult', 'compliment', 'call_chat']));
    });

    test('isInteractionBlocked flags age, funds, and hostility with matching reasons', () => {
        const user = { age: 25, money: 0 };
        const person = { category: 'friend', status: 50 };

        // Insufficient funds for give_money
        expect(GameLogic.isInteractionBlocked('give_money', person, user)).toEqual({ blocked: true, reason: 'Insufficient Funds' });

        // Too young for give_money (age gate takes priority over funds when both fail)
        expect(GameLogic.isInteractionBlocked('give_money', person, { age: 5, money: 0 })).toEqual({ blocked: true, reason: 'Too Young' });

        // Hostile friend refuses everything except give_money/insult
        const hostileFriend = { category: 'friend', status: 10 };
        expect(GameLogic.isInteractionBlocked('compliment', hostileFriend, { age: 25, money: 1000 })).toEqual({ blocked: true, reason: 'Refuses Contact' });
        expect(GameLogic.isInteractionBlocked('insult', hostileFriend, { age: 25, money: 1000 })).toEqual({ blocked: false, reason: '' });

        // Not blocked when all gates pass
        expect(GameLogic.isInteractionBlocked('compliment', person, { age: 25, money: 1000 })).toEqual({ blocked: false, reason: '' });
    });

    test('isInteractionBlocked returns Unknown Action for an unrecognized key', () => {
        expect(GameLogic.isInteractionBlocked('not_a_real_action', { category: 'friend', status: 50 }, { age: 25 })).toEqual({ blocked: true, reason: 'Unknown Action' });
    });
});

describe('getRandomFirstName / getLastName', () => {
    test('getRandomFirstName draws from the gendered pool only', () => {
        for (let i = 0; i < 20; i++) {
            const roll = i / 20;
            expect(typeof GameLogic.getRandomFirstName('male', roll)).toBe('string');
            expect(typeof GameLogic.getRandomFirstName('female', roll)).toBe('string');
        }
        // Deterministic rolls should differ between pools at the same index for at least one sample
        const maleNames = new Set(Array.from({ length: 20 }, (_, i) => GameLogic.getRandomFirstName('male', i / 20)));
        const femaleNames = new Set(Array.from({ length: 20 }, (_, i) => GameLogic.getRandomFirstName('female', i / 20)));
        expect([...maleNames].some(n => !femaleNames.has(n))).toBe(true);
    });

    test('getLastName extracts the final word of a full name', () => {
        expect(GameLogic.getLastName('John Smith')).toBe('Smith');
        expect(GameLogic.getLastName('Mary Anne Johnson')).toBe('Johnson');
        expect(GameLogic.getLastName('Cher')).toBe('Cher');
    });

    test('getFirstName extracts everything but the final word of a full name', () => {
        expect(GameLogic.getFirstName('John Smith')).toBe('John');
        expect(GameLogic.getFirstName('Mary Anne Johnson')).toBe('Mary Anne');
        expect(GameLogic.getFirstName('Cher')).toBe('Cher');
    });
});

describe('calculateNameChangeAcceptance', () => {
    test('scales with status like calculateProposalAcceptance', () => {
        expect(GameLogic.calculateNameChangeAcceptance(75, 0.7)).toBe(true);
        expect(GameLogic.calculateNameChangeAcceptance(75, 0.8)).toBe(false);
    });
});

describe('inheritFamilyRelationships', () => {
    test('returns empty array when parent relationships is invalid or empty', () => {
        expect(GameLogic.inheritFamilyRelationships(null, 'child_1')).toEqual([]);
        expect(GameLogic.inheritFamilyRelationships([], 'child_1')).toEqual([]);
    });

    test('inherits surviving spouse, siblings, aunts/uncles, and grandparents with updated relationship types', () => {
        const parentRelationships = [
            { id: 'child_1', name: 'Alice Smith', category: 'child', type: 'Daughter', gender: 'female', age: 10 },
            { id: 'child_2', name: 'Bob Smith', category: 'child', type: 'Son', gender: 'male', age: 14 },
            { id: 'child_3', name: 'Clara Smith', category: 'child', type: 'Daughter', gender: 'female', age: 8 },
            { id: 'spouse_1', name: 'Jane Smith', category: 'spouse', type: 'Wife', gender: 'female', age: 40 },
            { id: 'brother_1', name: 'Uncle Mark', category: 'family', type: 'Brother', gender: 'male', age: 42 },
            { id: 'mother_1', name: 'Grandma Betty', category: 'family', type: 'Mother', gender: 'female', age: 68 },
            { id: 'friend_1', name: 'Friend Dave', category: 'friend', type: 'Friend', gender: 'male', age: 41 }
        ];

        // Alice (child_1) takes over life after father's death
        const result = GameLogic.inheritFamilyRelationships(parentRelationships, 'child_1');

        // Excludes child_1 (self) and friend_1 (non-family), inherits 5 relatives
        expect(result.length).toBe(5);

        // Bob (other son of parent) -> Brother
        const bob = result.find(r => r.id === 'child_2');
        expect(bob.type).toBe('Brother');
        expect(bob.category).toBe('family');

        // Clara (other daughter of parent) -> Sister
        const clara = result.find(r => r.id === 'child_3');
        expect(clara.type).toBe('Sister');
        expect(clara.category).toBe('family');

        // Jane (spouse of parent) -> Mother
        const jane = result.find(r => r.id === 'spouse_1');
        expect(jane.type).toBe('Mother');
        expect(jane.category).toBe('family');

        // Mark (brother of deceased parent) -> Uncle
        const mark = result.find(r => r.id === 'brother_1');
        expect(mark.type).toBe('Uncle');
        expect(mark.category).toBe('family');

        // Betty (mother of deceased parent) -> Grandmother
        const betty = result.find(r => r.id === 'mother_1');
        expect(betty.type).toBe('Grandmother');
        expect(betty.category).toBe('family');

        // Non-relatives are excluded
        expect(result.find(r => r.id === 'friend_1')).toBeUndefined();
    });
});

describe('calculateChildMonthlyOutflow', () => {
    test('returns 0 for null, undefined, or empty relationships', () => {
        expect(GameLogic.calculateChildMonthlyOutflow(null)).toBe(0);
        expect(GameLogic.calculateChildMonthlyOutflow(undefined)).toBe(0);
        expect(GameLogic.calculateChildMonthlyOutflow([])).toBe(0);
    });

    test('adds $500 per month for each child under 21', () => {
        const relationships = [
            { id: '1', category: 'child', type: 'Son', age: 0 },
            { id: '2', category: 'child', type: 'Daughter', age: 10 },
            { id: '3', category: 'child', type: 'Son', age: 20 }
        ];
        expect(GameLogic.calculateChildMonthlyOutflow(relationships)).toBe(1500);
    });

    test('removes the $500 monthly outflow when a child reaches age 21 or older', () => {
        const relationships = [
            { id: '1', category: 'child', type: 'Son', age: 20 },
            { id: '2', category: 'child', type: 'Daughter', age: 21 },
            { id: '3', category: 'child', type: 'Son', age: 25 }
        ];
        // Only the child at age 20 adds $500/mo. Age 21 and 25 add $0.
        expect(GameLogic.calculateChildMonthlyOutflow(relationships)).toBe(500);
    });

    test('ignores non-child relationships regardless of age', () => {
        const relationships = [
            { id: '1', category: 'family', type: 'Brother', age: 15 },
            { id: '2', category: 'family', type: 'Sister', age: 12 },
            { id: '3', category: 'friend', type: 'Friend', age: 18 },
            { id: '4', category: 'spouse', type: 'Wife', age: 20 }
        ];
        expect(GameLogic.calculateChildMonthlyOutflow(relationships)).toBe(0);
    });
});
