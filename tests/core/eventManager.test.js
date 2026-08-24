import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { LIFE_EVENTS, EventManager } from '../../public/src/core/eventManager.js';
import { GameLogic } from '../../public/src/core/gameLogic.js';

describe('EventManager & Random Life Events Engine', () => {

    beforeEach(() => {
        state.gameState = {
            user: {
                name: 'Test Character',
                age: 16,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 15000,
                relationships: [],
                jobTitle: null
            },
            pendingEvents: [],
            completedEventsHistory: [],
            lifeLog: []
        };
    });

    describe('Event Catalog Structure & Validation', () => {
        test('all events have valid id, category, minAge, maxAge, condition, render, and resolve', () => {
            for (const key in LIFE_EVENTS) {
                const evt = LIFE_EVENTS[key];
                expect(evt.id).toBe(key);
                expect(typeof evt.category).toBe('string');
                expect(typeof evt.minAge).toBe('number');
                expect(typeof evt.maxAge).toBe('number');
                expect(evt.minAge).toBeLessThanOrEqual(evt.maxAge);
                expect(typeof evt.condition).toBe('function');
                expect(typeof evt.render).toBe('function');
                expect(typeof evt.resolve).toBe('function');
            }
        });

        test('render functions produce valid UI payloads with at least 2 options', () => {
            const user = state.gameState.user;
            for (const key in LIFE_EVENTS) {
                const evt = LIFE_EVENTS[key];
                const mockNPC = {
                    id: 'npc_1',
                    name: 'Test NPC',
                    type: 'Classmate',
                    status: 50,
                    age: 18,
                    proposedMajor: 'Art'
                };
                const renderResult = evt.render(user, mockNPC);
                expect(renderResult).toBeDefined();
                expect(typeof renderResult.title).toBe('string');
                expect(typeof renderResult.narrative).toBe('string');
                expect(Array.isArray(renderResult.options)).toBe(true);
                expect(renderResult.options.length).toBeGreaterThanOrEqual(2);

                renderResult.options.forEach(opt => {
                    expect(typeof opt.id).toBe('string');
                    expect(typeof opt.title).toBe('string');
                    expect(typeof opt.color).toBe('string');
                });
            }
        });
    });

    describe('Life Stage Trigger Conditions', () => {
        test('toddler events only trigger for toddlers (ages 1-4)', () => {
            const toddlerEvt = LIFE_EVENTS.toddler_daycare_blocks;
            expect(toddlerEvt.condition({ age: 2 })).toBe(true);
            expect(toddlerEvt.condition({ age: 10 })).toBe(false);
            expect(toddlerEvt.condition({ age: 25 })).toBe(false);
        });

        test('classmate fight triggers for school ages (6-17)', () => {
            const fightEvt = LIFE_EVENTS.classmate_fight;
            expect(fightEvt.condition({ age: 5 })).toBe(false);
            expect(fightEvt.condition({ age: 10 })).toBe(true);
            expect(fightEvt.condition({ age: 17 })).toBe(true);
            expect(fightEvt.condition({ age: 18 })).toBe(false);
        });

        test('parent vacation requires living parent in relationships', () => {
            const vacEvt = LIFE_EVENTS.parent_vacation;
            const userWithoutParents = { age: 10, relationships: [] };
            expect(vacEvt.condition(userWithoutParents)).toBe(false);

            const userWithParent = {
                age: 10,
                relationships: [{ type: 'Mother', name: 'Mom', lifeStatus: 'Alive' }]
            };
            expect(vacEvt.condition(userWithParent)).toBe(true);

            const userWithDeceasedParent = {
                age: 10,
                relationships: [{ type: 'Mother', name: 'Mom', lifeStatus: 'Deceased' }]
            };
            expect(vacEvt.condition(userWithDeceasedParent)).toBe(false);
        });

        test('child major approval only triggers when a child turns 18', () => {
            const majorEvt = LIFE_EVENTS.child_major_approval;
            const userWithYoungChild = {
                age: 40,
                relationships: [{ type: 'Son', name: 'Junior', age: 17, lifeStatus: 'Alive' }]
            };
            expect(majorEvt.condition(userWithYoungChild)).toBe(false);

            const userWith18YearOldChild = {
                age: 40,
                relationships: [{ type: 'Son', name: 'Junior', age: 18, lifeStatus: 'Alive' }]
            };
            expect(majorEvt.condition(userWith18YearOldChild)).toBe(true);
        });

        test('elderhood events trigger at age 65+', () => {
            const pickleballEvt = LIFE_EVENTS.elder_pickleball_championship;
            expect(pickleballEvt.condition({ age: 50 })).toBe(false);
            expect(pickleballEvt.condition({ age: 65 })).toBe(true);
            expect(pickleballEvt.condition({ age: 80 })).toBe(true);
        });
    });

    describe('Scenario Resolutions & Consequence Math', () => {
        test('child_major_approval resolves all choices safely with bounds clamping', () => {
            const majorEvt = LIFE_EVENTS.child_major_approval;
            const user = state.gameState.user;
            const child = { id: 'child_1', name: 'Emma', type: 'Daughter', age: 18, status: 60, proposedMajor: 'Art' };

            // 1. Approve
            const approveRes = majorEvt.resolve(user, child, 'approve_dream');
            expect(approveRes.logType).toBe('good');
            expect(child.status).toBe(75);

            // 2. Suggest STEM
            const stemRes = majorEvt.resolve(user, child, 'suggest_stem');
            expect(stemRes.logType).toBe('good');
            expect(child.proposedMajor).toBe('Computer Science');

            // 3. Fund Tuition ($10,000)
            user.money = 20000;
            const fundRes = majorEvt.resolve(user, child, 'fund_tuition');
            expect(user.money).toBe(10000);
            expect(child.status).toBe(100); // Clamped at 100
            expect(fundRes.logType).toBe('good');

            // 4. Dismiss Child
            const dismissRes = majorEvt.resolve(user, child, 'dismiss_child');
            expect(dismissRes.logType).toBe('bad');
            expect(child.status).toBe(85);
        });

        test('classmate_fight resolves fight, tell_teacher, defuse, and walk_away', () => {
            const fightEvt = LIFE_EVENTS.classmate_fight;
            const user = state.gameState.user;
            const bully = { id: 'bully_1', name: 'Bully Bob', type: 'Classmate', smarts: 30, health: 60, status: 30 };

            // Tell Teacher
            const tellRes = fightEvt.resolve(user, bully, 'tell_teacher');
            expect(tellRes.log).toContain('principal');
            expect(bully.status).toBe(5);

            // Defuse with Wit
            user.smarts = 90;
            const defuseRes = fightEvt.resolve(user, bully, 'defuse');
            expect(defuseRes.logType).toBe('good');
            expect(bully.status).toBe(20);

            // Walk away
            const walkRes = fightEvt.resolve(user, bully, 'walk_away');
            expect(walkRes.logType).toBe('neutral');
        });

        test('parent_vacation resolves enthusiastic, ask_money, and complain', () => {
            const vacEvt = LIFE_EVENTS.parent_vacation;
            const user = state.gameState.user;
            const parent = { id: 'mom_1', name: 'Jane', type: 'Mother', status: 70 };

            // Enthusiastic
            const enthRes = vacEvt.resolve(user, parent, 'go_enthusiastic');
            expect(enthRes.logType).toBe('good');
            expect(parent.status).toBe(85);

            // Ask Money
            const prevMoney = user.money;
            const moneyRes = vacEvt.resolve(user, parent, 'ask_money');
            expect(user.money).toBe(prevMoney + 50);
            expect(moneyRes.logType).toBe('good');

            // Complain
            const compRes = vacEvt.resolve(user, parent, 'complain');
            expect(compRes.logType).toBe('bad');
            expect(parent.status).toBe(70);
        });

        test('spouse_surprise_getaway resolves luxury, staycation, and decline', () => {
            const spouseEvt = LIFE_EVENTS.spouse_surprise_getaway;
            const user = state.gameState.user;
            user.money = 5000;
            const partner = { id: 'partner_1', name: 'Taylor', type: 'Spouse', status: 70 };

            // Luxury Resort
            const luxRes = spouseEvt.resolve(user, partner, 'book_getaway');
            expect(user.money).toBe(3500);
            expect(partner.status).toBe(95);
            expect(luxRes.logType).toBe('good');

            // Staycation
            const stayRes = spouseEvt.resolve(user, partner, 'budget_staycation');
            expect(user.money).toBe(3400);
            expect(partner.status).toBe(100);
            expect(stayRes.logType).toBe('good');

            // Decline
            const decRes = spouseEvt.resolve(user, partner, 'decline_getaway');
            expect(decRes.logType).toBe('bad');
            expect(partner.status).toBe(85);
        });
    });

    describe('EventManager Queueing & History', () => {
        test('evaluateAgeUpEvents populates state.gameState.pendingEvents when event triggers', () => {
            const user = state.gameState.user;
            user.age = 40;
            user.relationships = [
                { id: 'child_1', name: 'Alex', type: 'Son', age: 18, lifeStatus: 'Alive', status: 60 }
            ];

            // Trigger child major approval (probability 1.0)
            EventManager.evaluateAgeUpEvents(user, state.gameState);

            expect(state.gameState.pendingEvents.length).toBe(1);
            expect(state.gameState.pendingEvents[0].eventId).toBe('child_major_approval');
            expect(state.gameState.pendingEvents[0].npcId).toBe('child_1');
            expect(state.gameState.completedEventsHistory.length).toBe(1);
        });
    });
});
