import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { 
    ACHIEVEMENTS_CATALOG, 
    getUnlockedAchievements, 
    getAchievementProgress, 
    isAchievementUnlocked, 
    unlockAchievement, 
    checkPeriodicAchievements, 
    resetAchievements,
    AchievementManager
} from '../../public/src/core/achievementManager.js';

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
        jest.clearAllMocks();
    });

    test('ACHIEVEMENTS_CATALOG contains exactly 15 achievements with valid properties', () => {
        expect(ACHIEVEMENTS_CATALOG).toBeDefined();
        expect(ACHIEVEMENTS_CATALOG.length).toBe(15);

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

    test('catalog contains the 15 required standard and wild achievements', () => {
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
            'near_death_experience'
        ];

        const catalogIds = ACHIEVEMENTS_CATALOG.map(a => a.id);
        expectedIds.forEach(id => {
            expect(catalogIds).toContain(id);
        });

        // Verify wild achievements are flagged
        const wildAchievements = ACHIEVEMENTS_CATALOG.filter(a => a.isWild);
        expect(wildAchievements.length).toBe(5);
        expect(wildAchievements.some(a => a.id === 'supermax_houdini')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'junk_food_immortal')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'gold_digger')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'near_death_experience')).toBe(true);
        expect(wildAchievements.some(a => a.id === 'living_on_the_edge')).toBe(true);
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
            total: 15,
            unlockedCount: 0,
            percentage: 0
        });

        unlockAchievement('centenarian', state.gameState.user);
        unlockAchievement('clean_getaway', state.gameState.user);
        unlockAchievement('mega_jackpot', state.gameState.user);

        const progress = getAchievementProgress();
        expect(progress.total).toBe(15);
        expect(progress.unlockedCount).toBe(3);
        expect(progress.percentage).toBe(20); // 3 / 15 = 20%
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

    test('checkPeriodicAchievements unlocks real_estate_baron with >= 5 rented properties in assets or properties', () => {
        const user = state.gameState.user;
        user.assets = [
            { id: 1, category: 'property', isRented: true, tenant: { name: 'Tenant 1' } },
            { id: 2, category: 'property', isRented: true, tenant: { name: 'Tenant 2' } },
            { id: 3, category: 'property', isRented: true, tenant: { name: 'Tenant 3' } },
            { id: 4, category: 'property', isRented: true, tenant: { name: 'Tenant 4' } },
            { id: 5, category: 'property', isRented: false } // Only 4 rented
        ];

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('real_estate_baron')).toBe(false);

        user.assets[4].isRented = true;
        user.assets[4].tenant = { name: 'Tenant 5' };

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('real_estate_baron')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks diamond_hands when stock and savings investments >= 10M', () => {
        const user = state.gameState.user;
        user.investments = {
            savings: 4000000,
            stocks: {
                AAPL: { shares: 50000 }
            },
            stockMarket: [
                { symbol: 'AAPL', price: 150 } // 50,000 * 150 = 7.5M -> total 11.5M
            ]
        };

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('diamond_hands')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks junk_food_immortal when age >= 60 on junk diet', () => {
        const user = state.gameState.user;
        user.age = 59;
        user.diet = 'junk';
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('junk_food_immortal')).toBe(false);

        user.age = 60;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('junk_food_immortal')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks polymath_scholar with university, grad school, and smarts >= 95', () => {
        const user = state.gameState.user;
        user.hasDegree = true;
        user.hasGradDegree = true;
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

    test('checkPeriodicAchievements unlocks globe_trotter when relocations >= 3', () => {
        const user = state.gameState.user;
        user.relocationsCount = 2;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('globe_trotter')).toBe(false);

        user.relocationsCount = 3;
        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('globe_trotter')).toBe(true);
    });

    test('checkPeriodicAchievements unlocks the_godfather when on mafia track with level >= 4 or title The Don', () => {
        const user = state.gameState.user;
        user.careerTrack = 'mafia_syndicate';
        user.careerLevel = 3; // Underboss
        user.jobTitle = 'Underboss';

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('the_godfather')).toBe(false);

        user.careerLevel = 4; // The Don
        user.jobTitle = 'The Don';

        checkPeriodicAchievements(user);
        expect(isAchievementUnlocked('the_godfather')).toBe(true);
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
        expect(typeof AchievementManager.isAchievementUnlocked).toBe('function');
        expect(typeof AchievementManager.unlockAchievement).toBe('function');
        expect(typeof AchievementManager.checkPeriodicAchievements).toBe('function');
        expect(typeof AchievementManager.resetAchievements).toBe('function');
    });
});
