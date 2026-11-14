import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import {
    ACHIEVEMENTS_CATALOG,
    getUnlockedAchievements,
    getAchievementProgress,
    getSingleAchievementProgress,
    isAchievementUnlocked,
    unlockAchievement,
    checkPeriodicAchievements,
    resetAchievements,
    AchievementManager
} from '../../public/src/core/achievementManager.js';
import { migrateState } from '../../public/src/core/stateMigration.js';
import { attemptPrisonEscape } from '../../public/src/core/logic/crimePrisonLogic.js';
import { generateLuxuryMatch } from '../../public/src/core/logic/npcGeneratorLogic.js';

describe('AchievementManager Core Engine', () => {

    beforeEach(() => {
        localStorage.clear();
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
                username: 'Jane Explorer',
                age: 25,
                generation: 1,
                money: 50000,
                health: 100,
                happiness: 100,
                smarts: 100,
                assets: [],
                investments: { savings: 0, stocks: {}, stockMarket: [] }
            },
            lifeLog: [],
            achievements: {}
        };
    });

    afterEach(() => {
        resetAchievements();
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('ACHIEVEMENTS_CATALOG contains 20 achievements with valid properties', () => {
        expect(ACHIEVEMENTS_CATALOG).toBeDefined();
        expect(ACHIEVEMENTS_CATALOG.length).toBe(20);

        const uniqueIds = new Set();
        ACHIEVEMENTS_CATALOG.forEach(ach => {
            expect(typeof ach.id).toBe('string');
            expect(ach.id.length).toBeGreaterThan(0);
            expect(uniqueIds.has(ach.id)).toBe(false);
            uniqueIds.add(ach.id);

            expect(typeof ach.title).toBe('string');
            expect(typeof ach.description).toBe('string');
            expect(typeof ach.icon).toBe('string');
            expect(typeof ach.category).toBe('string');
            expect(typeof ach.categoryName).toBe('string');
            expect(typeof ach.iconBg).toBe('string');
            expect(typeof ach.iconColor).toBe('string');
            expect(typeof ach.badgeColor).toBe('string');
            expect(typeof ach.isWild).toBe('boolean');
        });
    });

    test('catalog contains all 20 standard and wild achievements', () => {
        const expectedIds = [
            'centenarian',
            'unicorn_tycoon',
            'the_godfather',
            'supermax_houdini',
            'mega_jackpot',
            'living_on_the_edge',
            'real_estate_baron',
            'polymath_scholar',
            'gold_digger',
            'diamond_hands',
            'junk_food_immortal',
            'clean_getaway',
            'dynasty_founder',
            'globe_trotter',
            'near_death_experience',
            'hall_of_fame_goat',
            'top_of_the_ladder',
            'renaissance_master',
            'full_house',
            'yard_kingpin'
        ];

        const catalogIds = ACHIEVEMENTS_CATALOG.map(a => a.id);
        expectedIds.forEach(id => {
            expect(catalogIds).toContain(id);
        });

        // Verify wild achievements are flagged (6 total including Yard Kingpin)
        const wildAchievements = ACHIEVEMENTS_CATALOG.filter(a => a.isWild);
        expect(wildAchievements.length).toBe(6);
        expect(wildAchievements.some(a => a.id === 'supermax_houdini')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'junk_food_immortal')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'gold_digger')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'near_death_experience')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'living_on_the_edge')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'yard_kingpin')).toBe(true);
    });

    test('getUnlockedAchievements and isAchievementUnlocked start empty and track unlocks', () => {
        expect(getUnlockedAchievements()).toEqual({});
        expect(isAchievementUnlocked('centenarian')).toBe(false);

        const res = unlockAchievement('centenarian', state.gameState.user);
        expect(res).toBe(true);

        expect(isAchievementUnlocked('centenarian')).toBe(true);
        const unlocked = getUnlockedAchievements();
        expect(unlocked.centenarian).toBeDefined();
        expect(unlocked.centenarian.unlocked).toBe(true);
        expect(unlocked.centenarian.characterName).toBe('Jane Explorer');
        expect(unlocked.centenarian.generation).toBe(1);
        expect(unlocked.centenarian.unlockedAt).toBeDefined();
    });

    test('getUnlockedAchievements performs additive union merge from gameState into localStorage', () => {
        state.gameState.achievements = {
            dynasty_founder: {
                id: 'dynasty_founder',
                unlocked: true,
                unlockedAt: '2026-01-01T00:00:00.000Z',
                characterName: 'Cloud Ancestor',
                generation: 4
            }
        };

        const merged = getUnlockedAchievements();
        expect(merged.dynasty_founder?.unlocked).toBe(true);
        const persisted = JSON.parse(localStorage.getItem('life_game_achievements'));
        expect(persisted.dynasty_founder?.unlocked).toBe(true);
    });

    test('unlockAchievement is idempotent and avoids duplicate unlocks or logs', () => {
        const user = state.gameState.user;
        const initialLogCount = state.gameState.lifeLog.length;

        const firstUnlock = unlockAchievement('unicorn_tycoon', user);
        expect(firstUnlock).toBe(true);
        expect(state.gameState.lifeLog.length).toBe(initialLogCount + 1);

        const firstTimestamp = getUnlockedAchievements().unicorn_tycoon.unlockedAt;

        // Second unlock attempt should return false and not re-log
        const secondUnlock = unlockAchievement('unicorn_tycoon', user);
        expect(secondUnlock).toBe(false);
        expect(state.gameState.lifeLog.length).toBe(initialLogCount + 1);
        expect(getUnlockedAchievements().unicorn_tycoon.unlockedAt).toBe(firstTimestamp);
    });

    test('getAchievementProgress calculates correct unlockedCount and percentage', () => {
        expect(getAchievementProgress()).toEqual({
            total: 20,
            unlockedCount: 0,
            percentage: 0
        });

        unlockAchievement('centenarian', state.gameState.user);
        unlockAchievement('clean_getaway', state.gameState.user);
        unlockAchievement('mega_jackpot', state.gameState.user);

        const progress = getAchievementProgress();
        expect(progress.total).toBe(20);
        expect(progress.unlockedCount).toBe(3);
        expect(progress.percentage).toBe(15); // 3 / 20 = 15%
    });

    test('checkPeriodicAchievements unlocks centenarian when age >= 100', () => {
        const user = state.gameState.user;
        user.age = 99;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('centenarian')).toBe(false);

        user.age = 100;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('centenarian')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks living_on_the_edge and near_death_experience when health <= 5', () => {
        const user = state.gameState.user;
        user.health = 4;
        user.happiness = 3;
        user.lifeStatus = 'Alive';

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('living_on_the_edge')).toBe(true);
        expect(isAchievementUnlocked('near_death_experience')).toBe(true);
    });

    test('checkPeriodicAchievements does not unlock living_on_the_edge if user died', () => {
        const user = state.gameState.user;
        user.health = 0;
        user.happiness = 0;
        user.lifeStatus = 'Deceased';

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('living_on_the_edge')).toBe(false);
        expect(isAchievementUnlocked('near_death_experience')).toBe(false);
    });

    test('checkPeriodicAchievements unlocks real_estate_baron with >= 5 rented properties', () => {
        const user = state.gameState.user;
        user.assets = [
            { id: 1, category: 'property', isRented: true, tenant: { name: 'Tenant 1' } },
            { id: 2, category: 'property', isRented: true, tenant: { name: 'Tenant 2' } },
            { id: 3, category: 'property', isRented: true, tenant: { name: 'Tenant 3' } },
            { id: 4, category: 'property', isRented: true, tenant: { name: 'Tenant 4' } },
            { id: 5, category: 'property', isRented: false }
        ];

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('real_estate_baron')).toBe(false);

        user.assets[4].isRented = true;
        user.assets[4].tenant = { name: 'Tenant 5' };

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('real_estate_baron')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks diamond_hands across user.savingsBalance and investments', () => {
        const user = state.gameState.user;
        user.savingsBalance = 3000000;
        user.investments = {
            savings: 1000000,
            stocks: {
                AAPL: { shares: 40000 }
            },
            stockMarket: [
                { symbol: 'AAPL', price: 150 } // 6M stocks + 4M savings = 10M
            ]
        };

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('diamond_hands')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks unicorn_tycoon via real company valuation >= $1B or isPublic', () => {
        const user = state.gameState.user;
        user.hasBusiness = true;
        user.compCash = 600000000;
        user.businessHistory = [
            { revenue: 50000000, profit: 15000000 },
            { revenue: 50000000, profit: 15000000 },
            { revenue: 50000000, profit: 15000000 },
            { revenue: 50000000, profit: 15000000 }
        ]; // 200M annual revenue * 3.0 + 60M profit * 2.0 + 600M cash = $1.32B

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('unicorn_tycoon')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks junk_food_immortal only if diet stayed on junk', () => {
        const user = state.gameState.user;
        user.age = 60;
        user.diet = 'mediterranean';
        user.everChangedFromJunkDiet = true;
        user.junkFoodStreak = 0;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('junk_food_immortal')).toBe(false);

        resetAchievements();
        user.diet = 'junk';
        user.hasBetterDiet = false;
        user.everChangedFromJunkDiet = false;
        user.junkFoodStreak = 42;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('junk_food_immortal')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks polymath_scholar with real universityGraduated & gradSchoolDegree schema', () => {
        const user = state.gameState.user;
        user.universityGraduated = true;
        user.gradSchoolDegree = 'Medical School (M.D.)';
        user.smarts = 94;

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('polymath_scholar')).toBe(false);

        user.smarts = 95;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('polymath_scholar')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks dynasty_founder when generation >= 3', () => {
        const user = state.gameState.user;
        user.generation = 2;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('dynasty_founder')).toBe(false);

        user.generation = 3;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('dynasty_founder')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks globe_trotter via relocationsCount or visitedCountries', () => {
        const user = state.gameState.user;
        user.relocationsCount = 2;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('globe_trotter')).toBe(false);

        user.visitedCountries = ['United States', 'Japan', 'France', 'Spain']; // 3 relocations
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('globe_trotter')).toBe(true);
    });

    test('migrateState preserves relocationsCount, visitedCountries, junkFoodStreak, and everChangedFromJunkDiet', () => {
        const migrated = migrateState({
            user: {
                username: 'Traveler',
                age: 40,
                country: 'Japan',
                relocationsCount: 2,
                visitedCountries: ['United States', 'Canada', 'Japan'],
                junkFoodStreak: 22,
                everChangedFromJunkDiet: false
            }
        });

        expect(migrated.user.relocationsCount).toBe(2);
        expect(migrated.user.visitedCountries).toEqual(['United States', 'Canada', 'Japan']);
        expect(migrated.user.junkFoodStreak).toBe(22);
        expect(migrated.user.everChangedFromJunkDiet).toBe(false);
    });

    test('attemptPrisonEscape only unlocks supermax_houdini from Maximum/Supermax security', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.01); // force escape success

        const minSecUser = {
            ...state.gameState.user,
            inPrison: true,
            prisonSecurity: 'Minimum',
            prisonStats: { guardRelation: 80, respect: 50 }
        };
        const minRes = attemptPrisonEscape(minSecUser, 'tunnel');
        expect(minRes.escaped).toBe(true);
        expect(isAchievementUnlocked('supermax_houdini')).toBe(false);

        const maxSecUser = {
            ...state.gameState.user,
            inPrison: true,
            prisonSecurity: 'Maximum',
            prisonStats: { guardRelation: 80, respect: 50 }
        };
        const maxRes = attemptPrisonEscape(maxSecUser, 'tunnel');
        expect(maxRes.escaped).toBe(true);
        expect(isAchievementUnlocked('supermax_houdini')).toBe(true);
    });

    test('generateLuxuryMatch populates wealthTier and netWorth so wealthy spouses unlock gold_digger', () => {
        const match = generateLuxuryMatch(state.gameState.user, { agePreset: '26-35', wealthTier: 'ultra_wealthy' });
        expect(match.wealthTier).toBe('ultra_wealthy');
        expect(match.netWorth).toBeGreaterThanOrEqual(5500000);

        state.gameState.user.relationships = [{
            ...match,
            category: 'spouse',
            type: 'Husband'
        }];
        checkPeriodicAchievements(state.gameState.user);
        expect(isAchievementUnlocked('gold_digger')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks the_godfather and top_of_the_ladder appropriately', () => {
        const user = state.gameState.user;
        user.careerTrack = 'mafia_syndicate';
        user.careerLevel = 4;
        user.jobTitle = 'The Don';

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('the_godfather')).toBe(true);
        expect(isAchievementUnlocked('top_of_the_ladder')).toBe(false);

        user.careerTrack = 'corporate_executive';
        user.careerLevel = 4;
        user.jobTitle = 'Chief Executive Officer';
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('top_of_the_ladder')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks hall_of_fame_goat, renaissance_master, full_house, and yard_kingpin', () => {
        const user = state.gameState.user;
        user.athleteRings = 3;
        user.skills = {
            coding: { xp: 100, certified: true },
            cooking: { xp: 100, certified: false },
            piano: { xp: 40, tiersCompleted: [1, 2, 3] }
        };
        user.relationships = [
            { category: 'child', type: 'Son' },
            { category: 'child', type: 'Daughter' },
            { category: 'child', type: 'Son' },
            { category: 'child', type: 'Daughter' },
            { category: 'child', type: 'Son' }
        ];
        user.inPrison = true;
        user.prisonStats = { respect: 92 };

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('hall_of_fame_goat')).toBe(true);
        expect(isAchievementUnlocked('renaissance_master')).toBe(true);
        expect(isAchievementUnlocked('full_house')).toBe(true);
        expect(isAchievementUnlocked('yard_kingpin')).toBe(true);
    });

    test('getSingleAchievementProgress returns accurate numeric progress for cumulative achievements', () => {
        const user = state.gameState.user;
        user.age = 50;
        user.relationships = [{ category: 'child', type: 'Son' }, { category: 'child', type: 'Daughter' }];

        const centProgress = getSingleAchievementProgress('centenarian', user);
        expect(centProgress).toEqual({
            current: 50,
            target: 100,
            percent: 50,
            label: 'Age 50 / 100'
        });

        const familyProgress = getSingleAchievementProgress('full_house', user);
        expect(familyProgress).toEqual({
            current: 2,
            target: 5,
            percent: 40,
            label: '2 / 5 Children'
        });

        expect(getSingleAchievementProgress('clean_getaway', user)).toBeNull();
    });

    test('resetAchievements clears localStorage and active gameState achievements', () => {
        unlockAchievement('centenarian', state.gameState.user);
        expect(isAchievementUnlocked('centenarian')).toBe(true);

        resetAchievements();
        expect(isAchievementUnlocked('centenarian')).toBe(false);
        expect(getUnlockedAchievements()).toEqual({});
        expect(state.gameState.achievements).toEqual({});
    });

    test('AchievementManager exports all expected functions', () => {
        expect(AchievementManager.ACHIEVEMENTS_CATALOG).toBe(ACHIEVEMENTS_CATALOG);
        expect(typeof AchievementManager.getUnlockedAchievements).toBe('function');
        expect(typeof AchievementManager.getAchievementProgress).toBe('function');
        expect(typeof AchievementManager.getSingleAchievementProgress).toBe('function');
        expect(typeof AchievementManager.isAchievementUnlocked).toBe('function');
        expect(typeof AchievementManager.unlockAchievement).toBe('function');
        expect(typeof AchievementManager.checkPeriodicAchievements).toBe('function');
        expect(typeof AchievementManager.resetAchievements).toBe('function');
    });
});
