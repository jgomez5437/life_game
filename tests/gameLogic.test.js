import { jest } from '@jest/globals';

jest.unstable_mockModule('../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../public/src/core/gameLogic.js');

test("sanitizeName validates name and returns", () => {
    expect(GameLogic.sanitizeName("1234 1234")).toEqual({
        isValid: false, 
        error: "Name can only contain letters, spaces, and single hyphens. Cannot start or end with a hyphen."
    });
});

test("returns living expenses or 0 (no city → default $24k)", () => {
    expect(GameLogic.addLivingExpenses(20, false)).toBe(24000);
    expect(GameLogic.addLivingExpenses(17, false)).toBe(0);
    expect(GameLogic.addLivingExpenses(22, true)).toBe(0);
});

describe('addLivingExpenses — city tiers', () => {
    test('Tier 1 ($33k): San Francisco', () => {
        expect(GameLogic.addLivingExpenses(25, false, 'San Francisco')).toBe(33000);
    });
    test('Tier 2 ($30k): New York, London, Tokyo, Paris, Los Angeles', () => {
        ['New York', 'London', 'Tokyo', 'Paris', 'Los Angeles'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(30000);
        });
    });
    test('Tier 3 ($24k): Miami, Toronto, Osaka', () => {
        ['Miami', 'Toronto', 'Osaka'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(24000);
        });
    });
    test('Tier 4 ($21k): Berlin, Madrid, Beijing', () => {
        ['Berlin', 'Madrid', 'Beijing'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(21000);
        });
    });
    test('Tier 5 ($18k): Houston, Tucson', () => {
        ['Houston', 'Tucson'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(18000);
        });
    });
    test('Tier 6 ($15k): Bandar Seri Begawan, Mexico City, Cairo', () => {
        ['Bandar Seri Begawan', 'Mexico City', 'Cairo'].forEach(city => {
            expect(GameLogic.addLivingExpenses(25, false, city)).toBe(15000);
        });
    });
    test('Unknown city falls back to $24k default', () => {
        expect(GameLogic.addLivingExpenses(25, false, 'Atlantis')).toBe(24000);
    });
    test('Student pays nothing regardless of city', () => {
        expect(GameLogic.addLivingExpenses(25, true, 'San Francisco')).toBe(0);
    });
    test('Under 19 pays nothing regardless of city', () => {
        expect(GameLogic.addLivingExpenses(18, false, 'San Francisco')).toBe(0);
    });
});

test("returns number between 10 & 80, inclusive", () => {
    for (let i=0; i < 100; i++) { 
        const result = GameLogic.calculateBirthdayMoney();
            expect(result).toBeGreaterThanOrEqual(10);
            expect(result).toBeLessThanOrEqual(80);
    };
});

test("returns 2400 or 0 depending on age, student loans, and if enrolled", () => {
    expect(GameLogic.addStudentLoanPayment(24, 2400, false)).toBe(2400);
    expect(GameLogic.addStudentLoanPayment(24, 0, false)).toBe(0);
    expect(GameLogic.addStudentLoanPayment(24, 2400, true)).toBe(0);
    expect(GameLogic.addStudentLoanPayment(22, 2400, false)).toBe(2400);
    expect(GameLogic.addStudentLoanPayment(25, 500, false)).toBe(500);
});

test("returns true or a number depending on grad enrolled status", () => {
    expect(GameLogic.checkSchoolGraduated(1, 4)).toBe(false);
    expect(GameLogic.checkSchoolGraduated(3, 4)).toBe(false);
    expect(GameLogic.checkSchoolGraduated(4, 4)).toBe(true);
});

test("returns string life status of CEO & Founder", () => {
    const user = {age: 19, hasBusiness: true}
    expect(GameLogic.checkLifeStatus(user)).toBe("CEO & Founder")
});

describe('calculateHealthDecay', () => {
    test('Age 0-18: 10% chance to lose 1 point', () => {
        expect(GameLogic.calculateHealthDecay(15, 0.05)).toBe(1); // Roll < 0.10
        expect(GameLogic.calculateHealthDecay(15, 0.15)).toBe(0); // Roll >= 0.10
    });

    test('Age 19-30: 30% chance to lose 1 point', () => {
        expect(GameLogic.calculateHealthDecay(25, 0.25)).toBe(1); // Roll < 0.30
        expect(GameLogic.calculateHealthDecay(25, 0.35)).toBe(0); // Roll >= 0.30
    });

    test('Age 31-50: 20% chance to lose 2 points, else 1', () => {
        expect(GameLogic.calculateHealthDecay(40, 0.15)).toBe(2); // Roll < 0.20
        expect(GameLogic.calculateHealthDecay(40, 0.50)).toBe(1); // Roll >= 0.20
    });

    test('Age 51-70: Scales linearly between 1 and 3', () => {
        expect(GameLogic.calculateHealthDecay(60, 0.10)).toBe(1); // (0.1 * 3) + 1 = 1.3 -> 1
        expect(GameLogic.calculateHealthDecay(60, 0.50)).toBe(2); // (0.5 * 3) + 1 = 2.5 -> 2
        expect(GameLogic.calculateHealthDecay(60, 0.90)).toBe(3); // (0.9 * 3) + 1 = 3.7 -> 3
    });

    test('Age 71+: Scales linearly between 2 and 4', () => {
        expect(GameLogic.calculateHealthDecay(80, 0.10)).toBe(2); // (0.1 * 3) + 2 = 2.3 -> 2
        expect(GameLogic.calculateHealthDecay(80, 0.50)).toBe(3); // (0.5 * 3) + 2 = 3.5 -> 3
        expect(GameLogic.calculateHealthDecay(80, 0.90)).toBe(4); // (0.9 * 3) + 2 = 4.7 -> 4
    });
});

describe('calculateHealthBenefits', () => {
    test('Returns 0 if no active habits', () => {
        expect(GameLogic.calculateHealthBenefits(false, false)).toBe(0);
    });
    test('Returns 1 if only gym', () => {
        expect(GameLogic.calculateHealthBenefits(true, false)).toBe(1);
    });
    test('Returns 1 if only diet', () => {
        expect(GameLogic.calculateHealthBenefits(false, true)).toBe(1);
    });
    test('Returns 2 if both gym and diet', () => {
        expect(GameLogic.calculateHealthBenefits(true, true)).toBe(2);
    });
});

describe('calculateActiveHealthCosts', () => {
    test('Returns 0 if no active habits', () => {
        expect(GameLogic.calculateActiveHealthCosts(false, false)).toBe(0);
    });
    test('Returns 600 if only gym', () => {
        expect(GameLogic.calculateActiveHealthCosts(true, false)).toBe(600);
    });
    test('Returns 2400 if only diet', () => {
        expect(GameLogic.calculateActiveHealthCosts(false, true)).toBe(2400);
    });
    test('Returns 3000 if both gym and diet', () => {
        expect(GameLogic.calculateActiveHealthCosts(true, true)).toBe(3000);
    });
});

describe('calculateMedicalVisit', () => {
    test('Returns fixed boost and cost', () => {
        expect(GameLogic.calculateMedicalVisit()).toEqual({ boost: 10, cost: 1000 });
    });
});

describe('calculateOneTimeGymVisit', () => {
    test('Returns fixed boost and cost', () => {
        expect(GameLogic.calculateOneTimeGymVisit()).toEqual({ boost: 1, cost: 20 });
    });
});

describe('Blackjack Logic', () => {
    test('calculateBlackjackHand handles aces correctly', () => {
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'K'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: '9'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: 'K'}])).toBe(12);
        expect(GameLogic.calculateBlackjackHand([{value: '10'}, {value: '5'}, {value: 'A'}])).toBe(16);
    });

    test('calculateBlackjackHand handles numbers and face cards', () => {
        expect(GameLogic.calculateBlackjackHand([{value: '2'}, {value: '3'}])).toBe(5);
        expect(GameLogic.calculateBlackjackHand([{value: 'J'}, {value: 'Q'}, {value: 'K'}])).toBe(30);
    });

    test('determineBlackjackOutcome works correctly', () => {
        // Player bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}, {value: '5'}], [{value: '10'}])).toBe('bust');
        // Dealer bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}, {value: '5'}])).toBe('win');
        // Push
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}])).toBe('push');
        // Player win
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '9'}])).toBe('win');
        // Player lose
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '9'}], [{value: '10'}, {value: '10'}])).toBe('lose');
    });
});

describe('calculateTripOutcome', () => {
    test('returns correct base values and modifies based on roll', () => {
        // Roll 0 -> first event (0 health, 0 money)
        const local = GameLogic.calculateTripOutcome(1, 0.0);
        expect(local.cost).toBe(500);
        expect(local.healthChange).toBe(5);
        expect(local.moneyChange).toBe(0);
        
        // Roll to hit the attack event (index 2 -> requires roll around 0.3)
        const attack = GameLogic.calculateTripOutcome(3, 0.3); // 0.3 * 8 = 2.4 => index 2
        expect(attack.cost).toBe(10000);
        expect(attack.healthChange).toBe(15 - 20); // base 15, event -20 => -5
        expect(attack.moneyChange).toBe(0);
    });
});

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

describe('checkLifeStatus', () => {
    test('grad school enrollment takes highest priority', () => {
        const user = { age: 26, gradSchoolEnrolled: true, gradSchoolType: 'Law School', universityEnrolled: true, hasBusiness: true, jobTitle: 'Lawyer' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Law School Student');
    });

    test('university enrollment takes priority over job', () => {
        const user = { age: 20, universityEnrolled: true, jobTitle: 'Cashier' };
        expect(GameLogic.checkLifeStatus(user)).toBe('University Student');
    });

    test('CEO & Founder when hasBusiness and no school enrollment', () => {
        const user = { age: 30, hasBusiness: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('CEO & Founder');
    });

    test('returns jobTitle when employed and not in school', () => {
        const user = { age: 25, jobTitle: 'Software Developer' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Software Developer');
    });

    test('grad degree graduate label when not enrolled', () => {
        const user = { age: 28, gradSchoolDegree: 'Law' };
        expect(GameLogic.checkLifeStatus(user)).toBe('Law Graduate');
    });

    test('University Graduate when no grad degree and not enrolled', () => {
        const user = { age: 24, universityGraduated: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('University Graduate');
    });

    test('Student (Retaking) when over 17 and highSchoolRetained', () => {
        const user = { age: 18, highSchoolRetained: true };
        expect(GameLogic.checkLifeStatus(user)).toBe('Student (Retaking)');
    });

    test('Unemployed when adult with no job', () => {
        const user = { age: 22 };
        expect(GameLogic.checkLifeStatus(user)).toBe('Unemployed');
    });

    test('Baby at age 0', () => {
        const user = { age: 0 };
        expect(GameLogic.checkLifeStatus(user)).toBe('Baby');
    });

    test('Toddler at age 1–4', () => {
        expect(GameLogic.checkLifeStatus({ age: 1 })).toBe('Toddler');
        expect(GameLogic.checkLifeStatus({ age: 4 })).toBe('Toddler');
    });

    test('Student for ages 5–17', () => {
        expect(GameLogic.checkLifeStatus({ age: 10 })).toBe('Student');
        expect(GameLogic.checkLifeStatus({ age: 17 })).toBe('Student');
    });
});

describe('checkMortality', () => {
    test('returns isDead:false when roll is above the rate', () => {
        // Age 30 → bracket rate 0.002. A roll of 0.999 is far above that.
        const result = GameLogic.checkMortality(30, 100);
        // Can't deterministically test due to Math.random inside, but can confirm shape.
        expect(result).toHaveProperty('isDead');
    });

    test('extreme old age (age 120) always kills (rate 1.0)', () => {
        // With rate 1.0, any roll < 1.0 means death, so this should always be true.
        const results = Array.from({ length: 10 }, () => GameLogic.checkMortality(120, 100));
        expect(results.every(r => r.isDead)).toBe(true);
    });

    test('low health amplifies mortality chance', () => {
        // At age 30 (rate 0.002), health < 30 triggers penalty.
        // With health=1, penaltyMultiplier = 1 + (29/10) = 3.9, chance = 0.0078.
        // Still very unlikely to die in a single roll, but the amplification should produce
        // a meaningfully higher rate. Verify that health=1 results in more deaths than health=100
        // over many trials.
        let deathsHighHealth = 0, deathsLowHealth = 0;
        for (let i = 0; i < 10000; i++) {
            if (GameLogic.checkMortality(30, 100).isDead) deathsHighHealth++;
            if (GameLogic.checkMortality(30, 1).isDead) deathsLowHealth++;
        }
        expect(deathsLowHealth).toBeGreaterThan(deathsHighHealth);
    });
});

describe('calculatePromotionChance', () => {
    test('returns 0 when performance below 75 (ineligible)', () => {
        expect(GameLogic.calculatePromotionChance(74)).toBe(0);
        expect(GameLogic.calculatePromotionChance(50)).toBe(0);
        expect(GameLogic.calculatePromotionChance(0)).toBe(0);
    });

    test('returns 0.25 for performance 75–84', () => {
        expect(GameLogic.calculatePromotionChance(75)).toBe(0.25);
        expect(GameLogic.calculatePromotionChance(84)).toBe(0.25);
    });

    test('returns 0.50 for performance 85–94', () => {
        expect(GameLogic.calculatePromotionChance(85)).toBe(0.50);
        expect(GameLogic.calculatePromotionChance(94)).toBe(0.50);
    });

    test('returns 0.80 for performance 95+', () => {
        expect(GameLogic.calculatePromotionChance(95)).toBe(0.80);
        expect(GameLogic.calculatePromotionChance(100)).toBe(0.80);
    });
});

describe('Business Fiscal Year Limit Logic', () => {
    test('canProcessBusinessQuarter blocks when user has no active business', () => {
        expect(GameLogic.canProcessBusinessQuarter(null)).toEqual({ allowed: false, reason: 'No active business.' });
        expect(GameLogic.canProcessBusinessQuarter({ hasBusiness: false })).toEqual({ allowed: false, reason: 'No active business.' });
    });

    test('canProcessBusinessQuarter blocks as soon as a fiscal year is completed at the current age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 2 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        // Complete fiscal year at age 30
        GameLogic.recordBusinessQuarterProcessed(user, true);
        expect(user.lastCompletedFiscalYearAge).toBe(30);
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({
            allowed: false,
            reason: 'You need to age up before continuing a new fiscal year.'
        });

        // Aging up to 31 allows starting the new fiscal year
        user.age = 31;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
    });

    test('canProcessBusinessQuarter allows up to 4 quarters per player age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 0 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        user.quartersProcessedThisAge = 3;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });

        user.quartersProcessedThisAge = 4;
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({
            allowed: false,
            reason: 'You need to age up before continuing a new fiscal year.'
        });
    });

    test('canProcessBusinessQuarter resets available quarters when player age changes', () => {
        const user = { age: 31, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 4, lastCompletedFiscalYearAge: 30 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
    });

    test('recordBusinessQuarterProcessed initializes and increments quartersProcessedThisAge', () => {
        const user = { age: 25, hasBusiness: true };
        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.lastBusinessAge).toBe(25);
        expect(user.quartersProcessedThisAge).toBe(1);

        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.quartersProcessedThisAge).toBe(2);

        // Player ages up to 26
        user.age = 26;
        GameLogic.recordBusinessQuarterProcessed(user);
        expect(user.lastBusinessAge).toBe(26);
        expect(user.quartersProcessedThisAge).toBe(1);
    });

    test('getRemainingQuartersForAge returns correct remaining count', () => {
        expect(GameLogic.getRemainingQuartersForAge({ hasBusiness: false })).toBe(0);

        const user = { age: 40, hasBusiness: true, lastBusinessAge: 40, quartersProcessedThisAge: 1 };
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(3);

        user.quartersProcessedThisAge = 4;
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(0);

        // Age change resets remaining to 4
        user.age = 41;
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);
    });

    test('calculateAutoQuarterCount determines auto-processing turns during ageUp', () => {
        expect(GameLogic.calculateAutoQuarterCount({ hasBusiness: false, age: 30 })).toBe(0);

        // Player completed a fiscal year manually at age 29, then aged up to 30
        const userFull = { age: 30, hasBusiness: true, lastBusinessAge: 29, quartersProcessedThisAge: 4, lastCompletedFiscalYearAge: 29 };
        expect(GameLogic.calculateAutoQuarterCount(userFull)).toBe(0);

        // Player completed 2 quarters manually at age 29 without finishing fiscal year, then aged up to 30
        const userPartial = { age: 30, hasBusiness: true, lastBusinessAge: 29, quartersProcessedThisAge: 2 };
        expect(GameLogic.calculateAutoQuarterCount(userPartial)).toBe(2);

        // Player didn't touch business at age 29 (or lastBusinessAge is old/null), then aged up to 30
        const userUntouched = { age: 30, hasBusiness: true, lastBusinessAge: 20, quartersProcessedThisAge: 4 };
        expect(GameLogic.calculateAutoQuarterCount(userUntouched)).toBe(4);
    });

    test('resetBusinessQuarterTracking resets quarter counts so a new company gets a fresh fiscal year in the same age', () => {
        const user = { age: 30, hasBusiness: true, lastBusinessAge: 30, quartersProcessedThisAge: 2, lastCompletedFiscalYearAge: 30 };
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: false, reason: 'You need to age up before continuing a new fiscal year.' });

        // Selling and launching a new company at age 30 calls resetBusinessQuarterTracking
        GameLogic.resetBusinessQuarterTracking(user);
        expect(user.quartersProcessedThisAge).toBe(0);
        expect(user.lastBusinessAge).toBeNull();
        expect(user.lastCompletedFiscalYearAge).toBeNull();
        expect(GameLogic.canProcessBusinessQuarter(user)).toEqual({ allowed: true });
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);
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

describe('Real Estate Properties & Mortgage Pure Logic', () => {
    test('calculateMonthlyMortgage returns realistic monthly payment', () => {
        // $100,000 at 6.5% interest for 30 years is ~$632/month
        const payment = GameLogic.calculateMonthlyMortgage(100000, 0.065, 30);
        expect(payment).toBeGreaterThan(600);
        expect(payment).toBeLessThan(700);
        expect(payment).toBe(632);
    });

    test('calculateMonthlyMortgage returns 0 for zero or negative principal', () => {
        expect(GameLogic.calculateMonthlyMortgage(0)).toBe(0);
        expect(GameLogic.calculateMonthlyMortgage(-50000)).toBe(0);
    });

    test('calculateUserMonthlyIncome aggregates job and business CEO salaries', () => {
        const userWithJob = { jobTitle: 'Software Developer', jobSalary: 120000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithJob)).toBe(10000);

        const userWithBusiness = { hasBusiness: true, ceoSalary: 15000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithBusiness)).toBe(15000);

        const userWithBoth = { jobTitle: 'Engineer', jobSalary: 60000, hasBusiness: true, ceoSalary: 8000 };
        expect(GameLogic.calculateUserMonthlyIncome(userWithBoth)).toBe(13000);

        const unemployedUser = { money: 50000 };
        expect(GameLogic.calculateUserMonthlyIncome(unemployedUser)).toBe(0);
    });

    test('calculateTotalMonthlyMortgages sums active property mortgages', () => {
        const user = {
            assets: [
                { category: 'vehicle', value: 20000 },
                { category: 'property', name: 'Apartment', mortgage: { remainingBalance: 100000, monthlyPayment: 600 } },
                { category: 'property', name: 'House', mortgage: { remainingBalance: 300000, monthlyPayment: 1800 } },
                { category: 'property', name: 'Paid Off Condo', mortgage: null }
            ]
        };
        expect(GameLogic.calculateTotalMonthlyMortgages(user)).toBe(2400);
    });

    test('canAffordMortgage blocks mortgage if user has no monthly income', () => {
        const user = { money: 100000 };
        const result = GameLogic.canAffordMortgage(user, 500);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('need monthly income');
    });

    test('canAffordMortgage allows mortgage when total payment < 40% of monthly income', () => {
        // Income = $10,000/mo. 40% limit = $4,000. New mortgage = $1,500/mo (15%).
        const user = { jobTitle: 'Dev', jobSalary: 120000 };
        const result = GameLogic.canAffordMortgage(user, 1500);
        expect(result.allowed).toBe(true);
        expect(result.ratio).toBeCloseTo(0.15);
    });

    test('canAffordMortgage rejects mortgage when payment takes up 40% or more of monthly income', () => {
        // Income = $5,000/mo. 40% limit = $2,000. Proposed mortgage = $2,000/mo (40%).
        const user = { jobTitle: 'Teacher', jobSalary: 60000 };
        const result = GameLogic.canAffordMortgage(user, 2000);
        expect(result.allowed).toBe(false);
        expect(result.ratio).toBeCloseTo(0.40);
        expect(result.reason).toContain('Max: 40%');
    });

    test('canAffordMortgage factors in existing mortgages against 40% limit', () => {
        // Income = $10,000/mo ($120k salary). Limit = $4,000. Existing mortgage = $2,500/mo. New mortgage = $1,800/mo. Total = $4,300 (43%).
        const user = {
            jobTitle: 'Manager',
            jobSalary: 120000,
            assets: [
                { category: 'property', mortgage: { remainingBalance: 200000, monthlyPayment: 2500 } }
            ]
        };
        const result = GameLogic.canAffordMortgage(user, 1800);
        expect(result.allowed).toBe(false);
        expect(result.ratio).toBeCloseTo(0.43);
    });

    test('processMortgagePayments applies interest amortization correctly over 9 years', () => {
        const townhouseMortgage = GameLogic.calculateMonthlyMortgage(280000, 0.065, 30); // 1770/mo
        const user = {
            money: 500000,
            assets: [
                {
                    name: 'Suburban Townhouse',
                    category: 'property',
                    mortgage: { remainingBalance: 280000, monthlyPayment: townhouseMortgage, annualRate: 0.065 }
                }
            ]
        };

        // Age up 9 times (9 years of payments)
        for (let year = 0; year < 9; year++) {
            GameLogic.processMortgagePayments(user);
        }

        // After 9 years on a 30-year 6.5% loan for $280,000, balance should be ~ $242,000 - $243,000 (NOT $88,000!)
        const remaining = user.assets[0].mortgage.remainingBalance;
        expect(remaining).toBeGreaterThan(240000);
        expect(remaining).toBeLessThan(245000);
    });

    test('getPropertyIcon returns correct icon and default fallback', () => {
        expect(GameLogic.getPropertyIcon('apartment').icon).toBe('fa-building');
        expect(GameLogic.getPropertyIcon('house').icon).toBe('fa-house');
        expect(GameLogic.getPropertyIcon('penthouse').icon).toBe('fa-crown');
        expect(GameLogic.getPropertyIcon('unknown').icon).toBe('fa-home');
    });

    test('updateOwnedProperties degrades condition and maxCondition over time', () => {
        const user = {
            assets: [
                { category: 'property', name: 'House', value: 450000, condition: 100, maxCondition: 100 }
            ]
        };

        GameLogic.updateOwnedProperties(user);

        const prop = user.assets[0];
        expect(prop.maxCondition).toBe(99); // Drops 1% per year
        expect(prop.condition).toBeLessThan(100); // Drops 2-4% per year
        expect(prop.condition).toBeLessThanOrEqual(prop.maxCondition);
    });

    test('calculateMaintenanceCost calculates realistic cost proportional to home value', () => {
        const prop450k = { value: 450000 };
        expect(GameLogic.calculateMaintenanceCost(prop450k)).toBe(3375); // 0.75% of $450,000

        const cheapProp = { value: 20000 };
        expect(GameLogic.calculateMaintenanceCost(cheapProp)).toBe(250); // Minimum $250
    });

    test('performPropertyMaintenance restores condition up to current maxCondition ceiling', () => {
        const user = {
            money: 10000,
            assets: [
                { id: 1, category: 'property', name: 'House', value: 450000, condition: 70, maxCondition: 90 }
            ]
        };

        const result = GameLogic.performPropertyMaintenance(user, 1);
        expect(result.success).toBe(true);
        expect(result.restoredCondition).toBe(90); // Restored up to maxCondition cap, NOT 100!
        expect(user.assets[0].condition).toBe(90);
        expect(user.money).toBe(10000 - 3375);
    });

    test('calculateRenovationOptions produces 3 tiers scaled to property value', () => {
        const prop = { value: 500000 };
        const options = GameLogic.calculateRenovationOptions(prop);
        expect(options.length).toBe(3);

        expect(options[0].name).toBe('Minor Cosmetic Refresh');
        expect(options[0].cost).toBe(15000); // 3%

        expect(options[1].name).toBe('Major Interior Remodel');
        expect(options[1].cost).toBe(40000); // 8%

        expect(options[2].name).toBe('Full Gut Renovation');
        expect(options[2].cost).toBe(90000); // 18%
    });

    test('renovateProperty restores condition, raises maxCondition, and increases market value', () => {
        const user = {
            money: 100000,
            assets: [
                { id: 1, category: 'property', name: 'House', value: 500000, condition: 60, maxCondition: 80 }
            ]
        };

        // Full Gut Renovation (option 'full')
        const result = GameLogic.renovateProperty(user, 1, 'full');
        expect(result.success).toBe(true);
        expect(user.assets[0].condition).toBe(100);
        expect(user.assets[0].maxCondition).toBe(100);
        expect(user.assets[0].value).toBe(625000); // +25% market value boost
        expect(user.money).toBe(100000 - 90000);
    });

    test('generateTenantApplicants returns 3 realistic tenant applicants', () => {
        const prop = { value: 300000 };
        const applicants = GameLogic.generateTenantApplicants(prop);
        expect(applicants.length).toBe(3);
        expect(applicants[0].monthlyRent).toBeGreaterThan(0);
        expect(applicants[1].monthlyRent).toBeGreaterThan(applicants[0].monthlyRent);
        expect(applicants[2].monthlyRent).toBeGreaterThan(applicants[1].monthlyRent);
    });

    test('calculateTotalRentalIncome & calculateUserMonthlyIncome includes rental cashflow', () => {
        const user = {
            jobTitle: 'Software Developer',
            jobSalary: 120000, // $10,000/mo salary
            assets: [
                { category: 'property', isRented: true, tenant: { monthlyRent: 2000 } },
                { category: 'property', isRented: true, tenant: { monthlyRent: 1500 } },
                { category: 'property', isRented: false, tenant: null }
            ]
        };

        expect(GameLogic.calculateTotalRentalIncome(user.assets)).toBe(3500);
        expect(GameLogic.calculateUserMonthlyIncome(user)).toBe(13500);
    });

    test('acceptTenantLease sets isRented and tenant object', () => {
        const user = {
            assets: [
                { id: 10, category: 'property', name: 'Apartment', value: 200000, isRented: false }
            ]
        };

        const result = GameLogic.acceptTenantLease(user, 10, 'applicant_reliable');
        expect(result.success).toBe(true);
        expect(user.assets[0].isRented).toBe(true);
        expect(user.assets[0].tenant.quality).toBe('excellent');
    });

    test('processRentalIncome collects annual rent and logs transactions', () => {
        const user = {
            money: 10000,
            assets: [
                { id: 10, category: 'property', name: 'Apartment', isRented: true, tenant: { monthlyRent: 2000, quality: 'excellent' } }
            ]
        };

        const totalCollected = GameLogic.processRentalIncome(user);
        expect(totalCollected).toBe(24000); // 2000 * 12
        expect(user.money).toBe(34000);
    });

    test('evictTenant clears tenant and resets isRented to false', () => {
        const user = {
            assets: [
                { id: 10, category: 'property', name: 'Apartment', isRented: true, tenant: { name: 'John Doe', monthlyRent: 2000 } }
            ]
        };

        const result = GameLogic.evictTenant(user, 10);
        expect(result.success).toBe(true);
        expect(user.assets[0].isRented).toBe(false);
        expect(user.assets[0].tenant).toBeNull();
    });

    test('calculatePropertySaleTiers returns 5 pricing options ranging from below to above market value', () => {
        const prop = { value: 300000 };
        const tiers = GameLogic.calculatePropertySaleTiers(prop);
        expect(tiers.length).toBe(5);
        expect(tiers[0].id).toBe('below');
        expect(tiers[0].price).toBe(255000); // 300k * 0.85
        expect(tiers[2].id).toBe('at_market');
        expect(tiers[2].price).toBe(300000);
        expect(tiers[4].id).toBe('above');
        expect(tiers[4].price).toBe(354000); // 300k * 1.18
    });

    test('completePropertySale pays off remaining mortgage and adds net proceeds to user money', () => {
        const user = {
            money: 50000,
            assets: [
                { id: 1, category: 'property', name: 'Suburban House', value: 300000, mortgage: { remainingBalance: 120000 } }
            ]
        };

        const result = GameLogic.completePropertySale(user, 1, 300000);
        expect(result.success).toBe(true);
        expect(result.netProceeds).toBe(180000); // 300k - 120k
        expect(user.money).toBe(230000); // 50k + 180k
        expect(user.assets.length).toBe(0);
    });
});

describe('Vehicle System Revamp', () => {
    test('calculateAutoLoan returns down payment, principal, and monthly payment', () => {
        const loan = GameLogic.calculateAutoLoan(30000, 0.15, 4);
        expect(loan.price).toBe(30000);
        expect(loan.downPayment).toBe(4500); // 15% of 30k
        expect(loan.principal).toBe(25500);
        expect(loan.monthlyPayment).toBeGreaterThan(500);
    });

    test('updateOwnedVehicles enforces value floor on standard cars', () => {
        const user = {
            age: 28,
            assets: [
                {
                    id: 1,
                    category: 'vehicle',
                    name: 'Commuter Car',
                    purchasePrice: 20000,
                    value: 4000,
                    acquiredAge: 20,
                    condition: 80,
                    reliability: 5,
                    valuationType: 'standard'
                }
            ]
        };

        GameLogic.updateOwnedVehicles(user, 0);
        expect(user.assets[0].value).toBeGreaterThanOrEqual(3000);
    });

    test('updateOwnedVehicles causes exotic hypercars to appreciate after 7 years', () => {
        const user = {
            age: 30,
            assets: [
                {
                    id: 2,
                    category: 'vehicle',
                    name: 'Ferrari Roma',
                    purchasePrice: 260000,
                    value: 260000,
                    acquiredAge: 20,
                    condition: 100,
                    reliability: 5,
                    valuationType: 'exotic'
                }
            ]
        };

        GameLogic.updateOwnedVehicles(user, 0);
        expect(user.assets[0].value).toBeGreaterThan(260000);
    });
});

describe('More Options Revamp: Diets, Lottery & Suggestions', () => {
    test('calculateActiveHealthCosts calculates custom diet monthly cost correctly', () => {
        const user = { gymMembership: true, diet: 'gourmet' };
        const costs = GameLogic.calculateActiveHealthCosts(user);
        // Gym ($600/yr) + Gourmet ($2500/mo * 12 = $30,000/yr) = $30,600
        expect(costs).toBe(30600);
    });

    test('playLotteryTicket enforces max 10 tickets per year limit', () => {
        const user = { money: 1000, lotteryTicketsBoughtThisYear: 10 };
        const result = GameLogic.playLotteryTicket('scratch', user);
        expect(result.success).toBe(false);
        expect(result.message).toContain('annual limit');
    });

    test('playLotteryTicket deducts ticket price and updates bought count when valid', () => {
        const user = { money: 500, lotteryTicketsBoughtThisYear: 2 };
        const result = GameLogic.playLotteryTicket('scratch', user);
        expect(result.success).toBe(true);
        expect(user.lotteryTicketsBoughtThisYear).toBe(3);
    });

    test('generateLifeSuggestions produces non-empty list of smart advice', () => {
        const user = { age: 25, health: 30, money: 100, jobTitle: null, relationships: [] };
        const suggestions = GameLogic.generateLifeSuggestions(user);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.some(s => s.category.includes('Health'))).toBe(true);
    });

    test('rollOverMegaJackpot increases jackpot amount annually until won', () => {
        const user = { megaJackpotAmount: 20000000 };
        const newJackpot = GameLogic.rollOverMegaJackpot(user);
        expect(newJackpot).toBeGreaterThanOrEqual(25000000);
        expect(user.megaJackpotAmount).toBe(newJackpot);
    });
});

describe('Relocation to New Country Pure Functions', () => {
    test('RELOCATION_COST constant is $2,000', () => {
        expect(GameLogic.RELOCATION_COST).toBe(2000);
    });

    test('canMoveCountry rejects null or missing user object', () => {
        const result = GameLogic.canMoveCountry(null, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('No character data');
    });

    test('canMoveCountry rejects players under 18 years old', () => {
        const user = { age: 17, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('18 years old');
    });

    test('canMoveCountry rejects target country if it is the user current country', () => {
        const user = { age: 25, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United States');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('already living');
    });

    test('canMoveCountry rejects player with insufficient funds (< $2,000)', () => {
        const user = { age: 25, money: 1500, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('$2,000');
    });

    test('canMoveCountry approves relocation when eligible (age >= 18, money >= $2,000, new country)', () => {
        const user = { age: 25, money: 3000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(true);
    });

    test('moveCountry fails and preserves money if user is ineligible', () => {
        const user = { age: 16, money: 3000, country: 'United States', city: 'New York' };
        const result = GameLogic.moveCountry(user, 'Japan', 'Tokyo');
        expect(result.success).toBe(false);
        expect(user.money).toBe(3000);
        expect(user.country).toBe('United States');
        expect(user.city).toBe('New York');
    });

    test('moveCountry deducts $2,000 and updates country & city when successful', () => {
        const user = { age: 30, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.moveCountry(user, 'Japan', 'Tokyo');

        expect(result.success).toBe(true);
        expect(result.cost).toBe(2000);
        expect(user.money).toBe(3000);
        expect(user.country).toBe('Japan');
        expect(user.city).toBe('Tokyo');
        expect(result.message).toContain('Relocated to Tokyo, Japan for $2,000.');
    });

    test('moveCountry clears job title, salary, and career progress when player has a job', () => {
        const user = {
            age: 28,
            money: 5000,
            country: 'United States',
            city: 'New York',
            jobTitle: 'Software Developer',
            jobSalary: 72000,
            jobPerformance: 80,
            careerTrack: 'software_eng',
            careerLevel: 1,
            yearsInRole: 2
        };

        const result = GameLogic.moveCountry(user, 'United Kingdom', 'London');

        expect(result.success).toBe(true);
        expect(result.hadJob).toBe(true);
        expect(result.oldJobTitle).toBe('Software Developer');
        expect(user.jobTitle).toBeNull();
        expect(user.jobSalary).toBe(0);
        expect(user.careerTrack).toBeNull();
        expect(user.careerLevel).toBe(0);
        expect(user.yearsInRole).toBe(0);
        expect(result.message).toContain('You lost your job as Software Developer');
    });

    test('getPartner correctly identifies romance partners and spouses', () => {
        const partner = { id: 'p1', name: 'Emma', type: 'Girlfriend', category: 'partner' };
        const user = { relationships: [partner] };
        expect(GameLogic.getPartner(user)).toBe(partner);
    });

    test('getPartner returns null if user has no partner', () => {
        const friend = { id: 'f1', name: 'John', type: 'Friend', category: 'friend' };
        const user = { relationships: [friend] };
        expect(GameLogic.getPartner(user)).toBeNull();
    });

    test('calculatePartnerRelocateAcceptance returns true for high relationship status when roll is favorable', () => {
        const partner = { name: 'Emma', status: 90 };
        expect(GameLogic.calculatePartnerRelocateAcceptance(partner, 0.1)).toBe(true);
        expect(GameLogic.calculatePartnerRelocateAcceptance(partner, 0.9)).toBe(false);
    });

    test('breakUpWithPartner sets category to ex and updates relationship type accordingly', () => {
        const partner = { id: 'p1', name: 'Sarah', type: 'Girlfriend', category: 'partner', gender: 'female' };
        const user = { relationships: [partner] };

        GameLogic.breakUpWithPartner(user, partner);

        expect(partner.category).toBe('ex');
        expect(partner.type).toBe('Ex-Girlfriend');
    });

    test('canMoveCountry rejects moving to current city', () => {
        const user = { age: 25, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United States', 'New York');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('already living in');
    });

    test('calculateUserMonthlyOutflow calculates correct monthly living expense for New York ($2,500/mo)', () => {
        const user = { age: 25, city: 'New York', isStudent: false, assets: [], relationships: [] };
        const outflow = GameLogic.calculateUserMonthlyOutflow(user);
        expect(outflow).toBe(2500); // $30,000 / 12 = $2,500
    });
});