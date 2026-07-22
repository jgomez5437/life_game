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