import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { GameLogic } from '../../public/src/core/gameLogic.js';
import { LIFE_EVENTS } from '../../public/src/core/eventManager.js';
import { EulogyGenerator, harvestLifeProfile } from '../../public/src/core/eulogyGenerator.js';
import { migrateState } from '../../public/src/core/stateMigration.js';
import { handleRelationships } from '../../public/src/features/player/ageUpHandlers.js';
import { continueAsChild } from '../../public/src/features/player/mainScreen.js';
import { goToFuneral } from '../../public/src/features/relationships/funeralScreen.js';
import { renderRelationships } from '../../public/src/features/relationships/relationshipScreen.js';
import { getCircleSummary, renderProfilePanel } from '../../public/src/features/player/desktopPanels.js';
import { openPlayerOverviewModal } from '../../public/src/features/player/playerOverviewScreen.js';
import { UI } from '../../public/src/ui/ui.js';

function makeSequenceRng(values, fallback = 0.99) {
    let idx = 0;
    return () => {
        if (idx < values.length) return values[idx++];
        return fallback;
    };
}

describe('Adult Children Marriage & Grandchildren System', () => {
    beforeEach(() => {
        state.gameState = {
            user: {
                name: 'Arthur Pendelton',
                username: 'Arthur Pendelton',
                age: 50,
                gender: 'male',
                city: 'New York',
                country: 'United States',
                money: 50000,
                health: 85,
                happiness: 80,
                smarts: 75,
                looks: 70,
                relationships: [],
                deceasedFamily: []
            },
            pendingFunerals: [],
            pendingEvents: [],
            completedEventsHistory: [],
            lifeLog: []
        };
    });

    describe('Marriage Probability & Lifelong Single Trait', () => {
        test('calculateChildMarriageChance returns 0 under 20, over 55, dead, neverMarries, or already married', () => {
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 19, category: 'child', type: 'Son' })).toBe(0);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 56, category: 'child', type: 'Son' })).toBe(0);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 28, isDead: true })).toBe(0);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 28, neverMarries: true })).toBe(0);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 28, spouseId: 'sp1' })).toBe(0);
            expect(
                GameLogic.calculateChildMarriageChance(
                    { id: 'c1', age: 28 },
                    [{ id: 'sp1', type: 'Daughter-in-Law', category: 'family', spouseOfChildId: 'c1' }]
                )
            ).toBe(0);
        });

        test('calculateChildMarriageChance returns expected bracket probabilities for eligible adults', () => {
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 20 })).toBe(0.06);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 27 })).toBe(0.12);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 38 })).toBe(0.06);
            expect(GameLogic.calculateChildMarriageChance({ id: 'c1', age: 50 })).toBe(0.02);
        });

        test('createChildSpouseNPC builds Son-in-Law / Daughter-in-Law and links both directions', () => {
            const son = { id: 'child_1', name: 'Marcus Mercer', type: 'Son', category: 'child', gender: 'male', age: 26, status: 85 };
            const user = { age: 52, city: 'New York' };

            const spouse = GameLogic.createChildSpouseNPC(son, user, {
                genderRoll: 0.1,
                ageDeltaRoll: 0.5,
                firstNameRoll: 0.2,
                lastNameRoll: 0.3,
                surnameTakeRoll: 0.1,
                statusRoll: 0.5
            });

            expect(spouse.type).toBe('Daughter-in-Law');
            expect(spouse.category).toBe('family');
            expect(spouse.gender).toBe('female');
            expect(spouse.age).toBeGreaterThanOrEqual(19);
            expect(spouse.spouseOfChildId).toBe('child_1');
            expect(spouse.marriedAtAge).toBe(spouse.age);
            expect(son.spouseId).toBe(spouse.id);
            expect(son.marriedAtAge).toBe(26);
            expect(son.justMarriedAtUserAge).toBe(52);
        });
    });

    describe('Parenthood Probability & Out-of-Wedlock Grandchildren', () => {
        test('calculateChildParenthoodChance supports married children with caps and cooldowns', () => {
            const daughter = { id: 'd1', age: 28, gender: 'female', type: 'Daughter' };
            const spouse = { id: 's1', age: 30, gender: 'male', type: 'Son-in-Law' };

            expect(GameLogic.calculateChildParenthoodChance(daughter, spouse, [])).toBe(0.22);
            expect(GameLogic.calculateChildParenthoodChance(daughter, spouse, [{ age: 3 }])).toBe(0.14);
            expect(GameLogic.calculateChildParenthoodChance(daughter, spouse, [{ age: 5 }, { age: 2 }])).toBe(0.07);
            // Max 3 cap
            expect(GameLogic.calculateChildParenthoodChance(daughter, spouse, [{ age: 8 }, { age: 5 }, { age: 2 }])).toBe(0);
            // Newborn cooldown (age === 0 prevents back-to-back birth)
            expect(GameLogic.calculateChildParenthoodChance(daughter, spouse, [{ age: 0 }])).toBe(0);
            // Female age 43+ limit
            expect(GameLogic.calculateChildParenthoodChance({ ...daughter, age: 43 }, spouse, [])).toBe(0);
            // Halved outside peak 22-35
            expect(GameLogic.calculateChildParenthoodChance({ ...daughter, age: 38 }, spouse, [])).toBe(0.11);
        });

        test('calculateChildParenthoodChance allows unmarried adult children to have kids with lower cap & rate', () => {
            const unmarriedSon = { id: 's1', age: 25, gender: 'male', type: 'Son', neverMarries: true };
            expect(GameLogic.calculateChildParenthoodChance({ ...unmarriedSon, age: 18 }, null, [])).toBe(0);
            expect(GameLogic.calculateChildParenthoodChance({ ...unmarriedSon, age: 19 }, null, [])).toBe(0.03);
            expect(GameLogic.calculateChildParenthoodChance(unmarriedSon, null, [])).toBe(0.055);
            expect(GameLogic.calculateChildParenthoodChance(unmarriedSon, null, [{ age: 3 }])).toBe(0.025);
            // Unmarried cap of 2
            expect(GameLogic.calculateChildParenthoodChance(unmarriedSon, null, [{ age: 5 }, { age: 2 }])).toBe(0);
            // Cooldown
            expect(GameLogic.calculateChildParenthoodChance(unmarriedSon, null, [{ age: 0 }])).toBe(0);
        });

        test('createGrandchildNPC marks bornOutOfWedlock accurately and creates Grandson / Granddaughter at age 0', () => {
            const daughter = { id: 'd1', name: 'Clara Smith', type: 'Daughter', category: 'child', gender: 'female', age: 24 };
            const sonInLaw = { id: 'sil1', name: 'Liam Carter', type: 'Son-in-Law', category: 'family', gender: 'male', age: 25 };

            const wedlockBaby = GameLogic.createGrandchildNPC(daughter, sonInLaw, { city: 'Chicago' }, {
                genderRoll: 0.2,
                firstNameRoll: 0.4,
                surnameChoiceRoll: 0.2
            });
            expect(wedlockBaby.type).toBe('Grandson');
            expect(wedlockBaby.category).toBe('family');
            expect(wedlockBaby.age).toBe(0);
            expect(wedlockBaby.parentChildId).toBe('d1');
            expect(wedlockBaby.otherParentId).toBe('sil1');
            expect(wedlockBaby.bornOutOfWedlock).toBe(false);
            expect(wedlockBaby.name.endsWith('Carter')).toBe(true);

            const unmarriedBaby = GameLogic.createGrandchildNPC(daughter, null, { city: 'Chicago' }, {
                genderRoll: 0.8,
                firstNameRoll: 0.5
            });
            expect(unmarriedBaby.type).toBe('Granddaughter');
            expect(unmarriedBaby.category).toBe('family');
            expect(unmarriedBaby.age).toBe(0);
            expect(unmarriedBaby.parentChildId).toBe('d1');
            expect(unmarriedBaby.otherParentId).toBeNull();
            expect(unmarriedBaby.bornOutOfWedlock).toBe(true);
            expect(unmarriedBaby.name.endsWith('Smith')).toBe(true);
        });

        test('grandchildren and in-laws do not incur $500/mo child support outflow', () => {
            const rels = [
                { id: 'c1', category: 'child', type: 'Son', age: 26 },
                { id: 'il1', category: 'family', type: 'Daughter-in-Law', age: 25 },
                { id: 'g1', category: 'family', type: 'Grandson', age: 2 },
                { id: 'g2', category: 'family', type: 'Granddaughter', age: 0 }
            ];
            expect(GameLogic.calculateChildMonthlyOutflow(rels)).toBe(0);
        });
    });

    describe('processAdultChildrenMilestones Orchestration', () => {
        test('rolls neverMarries lifelong trait, skips marriage, yet still permits unmarried parenthood', () => {
            const child = { id: 'c1', name: 'Maya Mercer', type: 'Daughter', category: 'child', gender: 'female', age: 22, status: 85 };
            const user = { age: 50, city: 'Boston', relationships: [child] };

            // First roll < 0.25 -> sets neverMarries = true
            // Since neverMarries is true, marriage is skipped without consuming rolls
            // Next roll: parenthood chance (0.055) -> 0.01 < 0.055 triggers birth!
            const rng = makeSequenceRng([0.10, 0.01, 0.75, 0.3, 0.4]);
            const res = GameLogic.processAdultChildrenMilestones(user, rng);

            expect(child.neverMarries).toBe(true);
            expect(child.spouseId).toBeUndefined();
            expect(res.newNPCs.length).toBe(1);
            expect(res.newNPCs[0].type).toBe('Granddaughter');
            expect(res.newNPCs[0].bornOutOfWedlock).toBe(true);
            expect(res.events[0].kind).toBe('grandchild_birth_unmarried');
            expect(res.events[0].msg).toContain("You're a grandparent!");
        });

        test('processes married child wedding and grandchild birth in sequence', () => {
            const child = { id: 'c1', name: 'Lucas Vance', type: 'Son', category: 'child', gender: 'male', age: 26, status: 90 };
            const user = { age: 54, city: 'Seattle', relationships: [child] };

            // Rolls:
            // 1. neverMarries (0.80 >= 0.25 -> false)
            // 2. marriageChance 0.12 (0.05 < 0.12 -> marries!)
            // 3-8. createChildSpouseNPC 6 rolls
            // 9. birthChance 0.22 (0.04 < 0.22 -> has baby!)
            // 10-12. createGrandchildNPC 3 rolls
            const rng = makeSequenceRng([0.80, 0.05, 0.1, 0.5, 0.2, 0.3, 0.4, 0.5, 0.04, 0.2, 0.5, 0.3]);
            const res = GameLogic.processAdultChildrenMilestones(user, rng);

            expect(child.neverMarries).toBe(false);
            expect(child.spouseId).toBeTruthy();
            expect(res.newNPCs.length).toBe(2);
            expect(res.newNPCs[0].type).toBe('Daughter-in-Law');
            expect(res.newNPCs[1].type).toBe('Grandson');
            expect(res.newNPCs[1].bornOutOfWedlock).toBe(false);
            expect(res.events.map(e => e.kind)).toEqual(['child_marriage', 'grandchild_birth_married']);
        });
    });

    describe('Generational Continuity (inheritFamilyRelationships)', () => {
        test('promotes selected child spouse to Husband/Wife, grandchildren to Son/Daughter, sibling kids to Nephew/Niece, and sibling spouses to In-Laws', () => {
            const parentRels = [
                { id: 'c1', name: 'Elena Reed', category: 'child', type: 'Daughter', gender: 'female', age: 30, spouseId: 'sil_1', marriedAtAge: 26 },
                { id: 'c2', name: 'Noah Reed', category: 'child', type: 'Son', gender: 'male', age: 28, spouseId: 'dil_1', marriedAtAge: 25 },
                { id: 'sil_1', name: 'Ryan Fox', category: 'family', type: 'Son-in-Law', gender: 'male', age: 31, spouseOfChildId: 'c1', marriedAtAge: 27, occupation: 'Engineer', occupationType: 'job', income: 95000 },
                { id: 'dil_1', name: 'Zoe Park', category: 'family', type: 'Daughter-in-Law', gender: 'female', age: 27, spouseOfChildId: 'c2', marriedAtAge: 24 },
                { id: 'gk_1', name: 'Leo Fox', category: 'family', type: 'Grandson', gender: 'male', age: 3, parentChildId: 'c1', otherParentId: 'sil_1' },
                { id: 'gk_2', name: 'Mia Reed', category: 'family', type: 'Granddaughter', gender: 'female', age: 2, parentChildId: 'c2', otherParentId: 'dil_1' },
                { id: 'parent_spouse', name: 'Martha Reed', category: 'spouse', type: 'Wife', gender: 'female', age: 62 }
            ];

            const inherited = GameLogic.inheritFamilyRelationships(parentRels, 'c1');

            const spouse = inherited.find(r => r.id === 'sil_1');
            expect(spouse.type).toBe('Husband');
            expect(spouse.category).toBe('spouse');
            expect(spouse.marriedAtAge).toBe(26);
            expect(spouse.occupation).toBe('Engineer');

            const ownChild = inherited.find(r => r.id === 'gk_1');
            expect(ownChild.type).toBe('Son');
            expect(ownChild.category).toBe('child');

            const niece = inherited.find(r => r.id === 'gk_2');
            expect(niece.type).toBe('Niece');
            expect(niece.category).toBe('family');

            const sisterInLaw = inherited.find(r => r.id === 'dil_1');
            expect(sisterInLaw.type).toBe('Sister-in-Law');
            expect(sisterInLaw.category).toBe('family');

            const sibling = inherited.find(r => r.id === 'c2');
            expect(sibling.type).toBe('Brother');
            expect(sibling.category).toBe('family');

            const mother = inherited.find(r => r.id === 'parent_spouse');
            expect(mother.type).toBe('Mother');
            expect(mother.category).toBe('family');
        });

        test('continueAsChild resets per-life event history and feeds accurate yearsMarried to eulogy', () => {
            document.body.innerHTML = '<div id="game-container"></div><div id="header-user-info"></div><div id="header-bank"></div>';
            window.saveGame = () => {};
            state.gameState = {
                user: {
                    username: 'Elder Reed',
                    gender: 'female',
                    city: 'Boston',
                    age: 70,
                    money: 100000,
                    deathCause: 'Old Age',
                    generation: 1,
                    pastLives: [],
                    relationships: [
                        { id: 'c1', name: 'Elena Reed', category: 'child', type: 'Daughter', gender: 'female', age: 30, spouseId: 'sil_1', marriedAtAge: 26 },
                        { id: 'sil_1', name: 'Ryan Fox', category: 'family', type: 'Son-in-Law', gender: 'male', age: 34, spouseOfChildId: 'c1', marriedAtAge: 30 }
                    ],
                    assets: []
                },
                completedEventsHistory: [{ eventId: 'first_grandchild_celebration', age: 65, npcId: 'gk_old' }],
                pendingEvents: [{ eventId: 'stale_event', npcId: null }],
                pendingFunerals: [{ id: 'stale_funeral', name: 'Old Friend', type: 'Friend' }],
                lifeLog: []
            };

            continueAsChild(0, 100000);

            expect(state.gameState.completedEventsHistory).toEqual([]);
            expect(state.gameState.pendingEvents).toEqual([]);
            expect(state.gameState.pendingFunerals).toEqual([]);
            expect(state.gameState.user.marriedAtAge).toBe(26);
            const profile = harvestLifeProfile(state.gameState.user, [], 'Natural Causes');
            expect(profile.yearsMarried).toBe(4);
        });
    });

    describe('Age-Up Integration, State Migration, Eulogy, Events & UI', () => {
        test('handleRelationships keeps newborn grandchild at age 0 and clears child spouseId if in-law dies', () => {
            const child = { id: 'c1', name: 'Alex Poe', category: 'child', type: 'Son', gender: 'male', age: 30, health: 90, status: 80, spouseId: 'dil_1' };
            const dyingInLaw = { id: 'dil_1', name: 'Dana Poe', category: 'family', type: 'Daughter-in-Law', gender: 'female', age: 120, health: 0, status: 80, spouseOfChildId: 'c1' };
            state.gameState.user.relationships = [child, dyingInLaw];

            const mortalitySpy = jest.spyOn(GameLogic, 'checkMortality').mockImplementation((age) => {
                if (age >= 120) return { isDead: true, cause: 'old age.' };
                return { isDead: false, cause: null };
            });
            const milestoneSpy = jest.spyOn(GameLogic, 'processAdultChildrenMilestones').mockImplementation((u) => {
                const gk = { id: 'gk_new', name: 'Sam Poe', type: 'Grandson', category: 'family', gender: 'male', age: 0, status: 90, parentChildId: 'c1' };
                u.relationships.push(gk);
                return { events: [{ msg: 'New grandchild!', type: 'good', kind: 'grandchild_birth_unmarried', childId: 'c1', npcId: gk.id }], newNPCs: [gk] };
            });

            handleRelationships(state.gameState.user);

            expect(child.spouseId).toBeNull();
            expect(child.isWidowed).toBe(true);
            expect(state.gameState.pendingFunerals.some(d => d.id === 'dil_1')).toBe(true);
            const newborn = state.gameState.user.relationships.find(r => r.id === 'gk_new');
            expect(newborn).toBeDefined();
            expect(newborn.age).toBe(0);

            mortalitySpy.mockRestore();
            milestoneSpy.mockRestore();
        });

        test('widowed child clears isWidowed on remarriage, and dying child marks surviving in-law widowed and preserves grandchild lineage', () => {
            document.body.innerHTML = `<div id="game-container"></div>`;
            const widowedSon = { id: 'c1', name: 'Alex Poe', category: 'child', type: 'Son', gender: 'male', age: 34, status: 85, isWidowed: true, spouseId: null };
            const newSpouse = GameLogic.createChildSpouseNPC(widowedSon, { age: 60, city: 'Chicago' }, {
                genderRoll: 0.1, ageDeltaRoll: 0.5, firstNameRoll: 0.2, lastNameRoll: 0.3, surnameTakeRoll: 0.1, statusRoll: 0.5
            });
            expect(widowedSon.isWidowed).toBe(false);
            expect(newSpouse.spouseOfChildName).toBe('Alex Poe');

            const dyingDaughter = { id: 'c2', name: 'Clara Poe', category: 'child', type: 'Daughter', gender: 'female', age: 120, health: 0, status: 85, spouseId: 'sil_2' };
            const survivingInLaw = { id: 'sil_2', name: 'Evan Ross', category: 'family', type: 'Son-in-Law', gender: 'male', age: 35, health: 90, status: 75, spouseOfChildId: 'c2' };
            const grandchild = { id: 'gk_2', name: 'Lily Ross', category: 'family', type: 'Granddaughter', gender: 'female', age: 6, health: 95, status: 90, parentChildId: 'c2' };
            state.gameState.user.relationships = [dyingDaughter, survivingInLaw, grandchild];

            const mortalitySpy = jest.spyOn(GameLogic, 'checkMortality').mockImplementation((age) => {
                if (age >= 120) return { isDead: true, cause: 'heart failure.' };
                return { isDead: false, cause: null };
            });
            const milestoneSpy = jest.spyOn(GameLogic, 'processAdultChildrenMilestones').mockReturnValue({ events: [], newNPCs: [] });

            handleRelationships(state.gameState.user);

            expect(survivingInLaw.isWidowed).toBe(true);
            expect(survivingInLaw.spouseOfChildName).toBe('Clara Poe');
            expect(grandchild.parentChildName).toBe('Clara Poe');

            state.gameState.pendingFunerals = [];
            renderRelationships();
            const relHtml = document.getElementById('game-container').innerHTML;
            expect(relHtml).toContain('Widowed (Late Clara Poe)');
            expect(relHtml).toContain('Child of late Clara Poe');

            mortalitySpy.mockRestore();
            milestoneSpy.mockRestore();
        });

        test('funeralScreen does not record yearsMarried for non-spouse relatives like Son-in-Law or Grandson', () => {
            document.body.innerHTML = '<div id="game-container"></div><div id="header-user-info"></div><div id="header-bank"></div>';
            const spyRender = jest.spyOn(UI, 'renderScreen').mockImplementation(() => {});
            const spyDashboard = jest.spyOn(UI, 'updateHeader').mockImplementation(() => {});
            state.gameState = {
                user: { username: 'Arthur', age: 62, money: 5000, marriedAtAge: 25, relationships: [], deceasedFamily: [] },
                pendingFunerals: [
                    { id: 'sil_1', name: 'Ryan Fox', type: 'Son-in-Law', category: 'family', age: 35, marriedAtAge: 27, deathCause: 'accident', yearDied: 62 },
                    { id: 'gk_1', name: 'Leo Fox', type: 'Grandson', category: 'family', age: 8, deathCause: 'illness', yearDied: 62 }
                ],
                lifeLog: []
            };

            goToFuneral();
            goToFuneral();

            expect(state.gameState.user.deceasedFamily).toHaveLength(2);
            expect(state.gameState.user.deceasedFamily[0].yearsMarried).toBeUndefined();
            expect(state.gameState.user.deceasedFamily[1].yearsMarried).toBeUndefined();

            spyRender.mockRestore();
            spyDashboard.mockRestore();
        });

        test('stateMigration preserves child marriage and grandchild lineage fields', () => {
            const rawSave = {
                user: {
                    name: 'Player One',
                    age: 55,
                    relationships: [
                        { id: 'c1', name: 'Sam Doe', type: 'Son', category: 'child', age: 28, status: 85, spouseId: 'sil_1', neverMarries: false, marriedAtAge: 26, justMarriedAtUserAge: 53 },
                        { id: 'sil_1', name: 'Mia Doe', type: 'Daughter-in-Law', category: 'family', age: 27, status: 75, spouseOfChildId: 'c1', spouseOfChildName: 'Sam Doe', marriedAtAge: 25 },
                        { id: 'gk_1', name: 'Leo Doe', type: 'Grandson', category: 'family', age: 0, status: 90, parentChildId: 'c1', parentChildName: 'Sam Doe', otherParentId: null, bornOutOfWedlock: true }
                    ]
                }
            };
            const migrated = migrateState(rawSave);
            const [c1, sil, gk] = migrated.user.relationships;
            expect(c1.spouseId).toBe('sil_1');
            expect(c1.neverMarries).toBe(false);
            expect(c1.marriedAtAge).toBe(26);
            expect(c1.justMarriedAtUserAge).toBe(53);
            expect(sil.spouseOfChildId).toBe('c1');
            expect(sil.spouseOfChildName).toBe('Sam Doe');
            expect(gk.parentChildId).toBe('c1');
            expect(gk.parentChildName).toBe('Sam Doe');
            expect(gk.otherParentId).toBeNull();
            expect(gk.bornOutOfWedlock).toBe(true);
        });

        test('eulogyGenerator weaves grandchildren count while staying within 4-6 sentences', () => {
            const elder = {
                username: 'Evelyn Grant',
                gender: 'female',
                age: 82,
                city: 'Boston',
                country: 'United States',
                money: 250000,
                jobTitle: 'Professor',
                relationships: [
                    { id: 'sp1', name: 'Henry Grant', type: 'Husband', category: 'spouse' },
                    { id: 'c1', name: 'Clara Grant', type: 'Daughter', category: 'child' },
                    { id: 'g1', name: 'Lily Grant', type: 'Granddaughter', category: 'family' },
                    { id: 'g2', name: 'Owen Grant', type: 'Grandson', category: 'family' }
                ]
            };

            const profile = harvestLifeProfile(elder, [], 'Natural Causes');
            expect(profile.grandchildrenCount).toBe(2);

            const eulogy = EulogyGenerator.generate(elder, [], 'Natural Causes');
            expect(eulogy).toContain('2 grandchildren');
            const sentences = eulogy.match(/[^.!?]+[.!?]+/g) || [];
            expect(sentences.length).toBeGreaterThanOrEqual(4);
            expect(sentences.length).toBeLessThanOrEqual(6);
        });

        test('adult children interactive events trigger and resolve cleanly, and neglected intervention skips infants/toddlers', () => {
            const child = { id: 'c1', name: 'Maya Lin', type: 'Daughter', category: 'child', gender: 'female', age: 25, status: 70, spouseId: 'sil_1', justMarriedAtUserAge: 50, lifeStatus: 'Alive' };
            const spouse = { id: 'sil_1', name: 'Leo Park', type: 'Son-in-Law', category: 'family', gender: 'male', age: 26, status: 65, spouseOfChildId: 'c1', lifeStatus: 'Alive' };
            const grandchild = { id: 'gk_1', name: 'Mina Park', type: 'Granddaughter', category: 'family', gender: 'female', age: 0, status: 20, parentChildId: 'c1', bornOutOfWedlock: false, lifeStatus: 'Alive' };
            const user = state.gameState.user;
            user.relationships = [child, spouse, grandchild];

            expect(LIFE_EVENTS.neglected_family_intervention.condition(user)).toBe(false);
            expect(LIFE_EVENTS.neglected_family_intervention.getTargetNPC(user)).toBeNull();
            grandchild.status = 90;

            expect(LIFE_EVENTS.child_wedding_celebration.condition(user, state.gameState)).toBe(true);
            const weddingRes = LIFE_EVENTS.child_wedding_celebration.resolve(user, child, 'gift_modest');
            expect(weddingRes.logType).toBe('good');
            expect(child.status).toBe(85);
            expect(spouse.status).toBe(77);

            expect(LIFE_EVENTS.first_grandchild_celebration.condition(user, state.gameState)).toBe(true);
            const gkRes = LIFE_EVENTS.first_grandchild_celebration.resolve(user, grandchild, 'college_fund');
            expect(gkRes.logType).toBe('good');
            expect(grandchild.status).toBe(100);
            expect(child.status).toBe(100);
        });

        test('UI displays hierarchical family sorting, link labels, and grandchildren counts', () => {
            document.body.innerHTML = `<div id="game-container"></div>`;
            const origShowCustomModal = UI.showCustomModal;
            let capturedOverviewHtml = '';
            UI.showCustomModal = jest.fn((opts) => { capturedOverviewHtml = opts.content; });

            const user = state.gameState.user;
            user.relationships = [
                { id: 'gk_1', name: 'Baby Leo', type: 'Grandson', category: 'family', gender: 'male', age: 0, status: 90, parentChildId: 'c1' },
                { id: 'c1', name: 'Marcus Poe', type: 'Son', category: 'child', gender: 'male', age: 28, status: 85, spouseId: 'dil_1' },
                { id: 'dil_1', name: 'Nora Poe', type: 'Daughter-in-Law', category: 'family', gender: 'female', age: 27, status: 75, spouseOfChildId: 'c1' },
                { id: 'sp_1', name: 'Elena Poe', type: 'Wife', category: 'spouse', gender: 'female', age: 50, status: 95 }
            ];

            renderRelationships();
            const relHtml = document.getElementById('game-container').innerHTML;
            // Sorted order: Spouse -> Child -> In-Law -> Grandchild
            expect(relHtml.indexOf('Elena Poe')).toBeLessThan(relHtml.indexOf('Marcus Poe'));
            expect(relHtml.indexOf('Marcus Poe')).toBeLessThan(relHtml.indexOf('Nora Poe'));
            expect(relHtml.indexOf('Nora Poe')).toBeLessThan(relHtml.indexOf('Baby Leo'));
            expect(relHtml).toContain('Married to Nora Poe');
            expect(relHtml).toContain('Child of Marcus Poe');

            const circle = getCircleSummary(user);
            expect(circle.children).toBe(1);
            expect(circle.grandchildren).toBe(1);
            const profileHtml = renderProfilePanel(user);
            expect(profileHtml).toContain('1 kid, 1 grandkid');

            openPlayerOverviewModal();
            expect(capturedOverviewHtml).toContain('Grandchildren');
            expect(capturedOverviewHtml).toContain('1 Grandchild');

            UI.showCustomModal = origShowCustomModal;
        });
    });
});
