import { jest } from '@jest/globals';
import { state } from '../../public/src/core/state.js';
import { LIFE_EVENTS, EventManager } from '../../public/src/core/eventManager.js';
import { GameLogic } from '../../public/src/core/gameLogic.js';
import { UI } from '../../public/src/ui/ui.js';
import { processNextLifeEvent, selectLifeEventChoice } from '../../public/src/features/life/lifeEventModal.js';

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
                jobTitle: null,
                assets: [],
                skills: {}
            },
            pendingEvents: [],
            completedEventsHistory: [],
            lifeLog: []
        };
    });

    describe('Event Catalog Structure & Validation', () => {
        test('all events have valid id, category, minAge, maxAge, condition, render, and resolve', () => {
            expect(Object.keys(LIFE_EVENTS).length).toBeGreaterThanOrEqual(30);
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

        test('all event option titles are clean of leading emojis to prevent duplicate icons', () => {
            const user = state.gameState.user;
            const emojiPattern = /^[\p{Extended_Pictographic}\u200d\uFE0F]/u;
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
                renderResult.options.forEach(opt => {
                    expect(emojiPattern.test(opt.title)).toBe(false);
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
                relationships: [{ id: 'c1', type: 'Son', name: 'Junior', age: 18, lifeStatus: 'Alive' }]
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

            const approveRes = majorEvt.resolve(user, child, 'approve_dream');
            expect(approveRes.logType).toBe('good');
            expect(child.status).toBe(75);

            const stemRes = majorEvt.resolve(user, child, 'suggest_stem');
            expect(stemRes.logType).toBe('good');
            expect(child.proposedMajor).toBe('Computer Science');

            user.money = 20000;
            const fundRes = majorEvt.resolve(user, child, 'fund_tuition');
            expect(user.money).toBe(10000);
            expect(child.status).toBe(100);
            expect(fundRes.logType).toBe('good');

            const dismissRes = majorEvt.resolve(user, child, 'dismiss_child');
            expect(dismissRes.logType).toBe('bad');
            expect(child.status).toBe(85);
        });

        test('classmate_fight resolves fight, tell_teacher, defuse, and walk_away', () => {
            const fightEvt = LIFE_EVENTS.classmate_fight;
            const user = state.gameState.user;
            const bully = { id: 'bully_1', name: 'Bully Bob', type: 'Classmate', smarts: 30, health: 60, status: 30 };

            const tellRes = fightEvt.resolve(user, bully, 'tell_teacher');
            expect(tellRes.log).toContain('principal');
            expect(bully.status).toBe(5);

            user.smarts = 90;
            const defuseRes = fightEvt.resolve(user, bully, 'defuse');
            expect(defuseRes.logType).toBe('good');
            expect(bully.status).toBe(20);
            expect(user.lifeEventFlags.classmate_fight_choice).toBe('defuse');
            expect(user.lifeEventFlags.classmate_fight_defused).toBe(true);

            const walkRes = fightEvt.resolve(user, bully, 'walk_away');
            expect(walkRes.logType).toBe('neutral');
        });

        test('parent_vacation resolves enthusiastic, ask_money, and complain', () => {
            const vacEvt = LIFE_EVENTS.parent_vacation;
            const user = state.gameState.user;
            const parent = { id: 'mom_1', name: 'Jane', type: 'Mother', status: 70 };

            const enthRes = vacEvt.resolve(user, parent, 'go_enthusiastic');
            expect(enthRes.logType).toBe('good');
            expect(parent.status).toBe(85);

            const prevMoney = user.money;
            const moneyRes = vacEvt.resolve(user, parent, 'ask_money');
            expect(user.money).toBe(prevMoney + 50);
            expect(moneyRes.logType).toBe('good');

            const compRes = vacEvt.resolve(user, parent, 'complain');
            expect(compRes.logType).toBe('bad');
            expect(parent.status).toBe(70);
        });

        test('spouse_surprise_getaway resolves luxury, staycation, and decline', () => {
            const spouseEvt = LIFE_EVENTS.spouse_surprise_getaway;
            const user = state.gameState.user;
            user.money = 5000;
            const partner = { id: 'partner_1', name: 'Taylor', type: 'Spouse', status: 70 };

            const luxRes = spouseEvt.resolve(user, partner, 'book_getaway');
            expect(user.money).toBe(3500);
            expect(partner.status).toBe(95);
            expect(luxRes.logType).toBe('good');

            const stayRes = spouseEvt.resolve(user, partner, 'budget_staycation');
            expect(user.money).toBe(3400);
            expect(partner.status).toBe(100);
            expect(stayRes.logType).toBe('good');

            const decRes = spouseEvt.resolve(user, partner, 'decline_getaway');
            expect(decRes.logType).toBe('bad');
            expect(partner.status).toBe(85);
        });
    });

    describe('Subtle Lifestyle & State-Driven Events', () => {
        test('junk_diet_wake_up_call tracks junkDietYears and switches diet when overhauled', () => {
            const user = state.gameState.user;
            user.age = 30;
            user.diet = 'junk';
            user.gymMembership = false;
            user.health = 72;

            EventManager.updateHabitTrackers(user);
            EventManager.updateHabitTrackers(user);
            expect(LIFE_EVENTS.junk_diet_wake_up_call.condition(user)).toBe(false);

            EventManager.updateHabitTrackers(user);
            expect(user.lifeEventFlags.junkDietYears).toBe(3);
            expect(LIFE_EVENTS.junk_diet_wake_up_call.condition(user)).toBe(true);

            const res = LIFE_EVENTS.junk_diet_wake_up_call.resolve(user, null, 'overhaul_diet');
            expect(res.logType).toBe('good');
            expect(user.diet).toBe('balanced');
            expect(user.hasBetterDiet).toBe(true);
            expect(user.lifeEventFlags.junkDietYears).toBe(0);
        });

        test('uninsured_jewelry_mugger checks uninsured equipped jewelry and gates Martial Arts option', () => {
            const user = state.gameState.user;
            user.age = 28;
            user.assets = [
                { id: 'jewel_1', category: 'jewelry', name: 'Diamond Watch', value: 12000, wearing: true, insured: false }
            ];
            user.skills = { martial_arts: { xp: 10 } };

            expect(LIFE_EVENTS.uninsured_jewelry_mugger.condition(user)).toBe(true);
            let rendered = LIFE_EVENTS.uninsured_jewelry_mugger.render(user);
            expect(rendered.options.find(o => o.id === 'martial_arts_disarm').disabled).toBe(true);

            user.skills.martial_arts.xp = 45;
            rendered = LIFE_EVENTS.uninsured_jewelry_mugger.render(user);
            expect(rendered.options.find(o => o.id === 'martial_arts_disarm').disabled).toBe(false);

            // Disarm preserves asset
            const disarmRes = LIFE_EVENTS.uninsured_jewelry_mugger.resolve(user, null, 'martial_arts_disarm');
            expect(disarmRes.logType).toBe('good');
            expect(user.assets.length).toBe(1);

            // Hand over removes uninsured item
            const handoverRes = LIFE_EVENTS.uninsured_jewelry_mugger.resolve(user, null, 'hand_over_jewelry');
            expect(handoverRes.logType).toBe('bad');
            expect(user.assets.length).toBe(0);
        });

        test('beater_car_highway_breakdown repairs condition with Trades skill or mechanic', () => {
            const user = state.gameState.user;
            user.age = 25;
            user.assets = [{ id: 'car_1', category: 'vehicle', name: 'Rusty Sedan', condition: 25, value: 3000 }];
            user.skills = { trades_tech: { xp: 40 } };

            expect(LIFE_EVENTS.beater_car_highway_breakdown.condition(user)).toBe(true);
            const rendered = LIFE_EVENTS.beater_car_highway_breakdown.render(user);
            expect(rendered.options.find(o => o.id === 'diy_mechanic').disabled).toBe(false);

            const res = LIFE_EVENTS.beater_car_highway_breakdown.resolve(user, null, 'diy_mechanic');
            expect(res.logType).toBe('good');
            expect(user.assets[0].condition).toBe(50);
        });

        test('neglected_family_intervention targets neglected relative and improves status on apology', () => {
            const user = state.gameState.user;
            user.age = 35;
            const spouse = { id: 'sp_1', name: 'Jordan', type: 'Wife', category: 'spouse', status: 20, lifeStatus: 'Alive' };
            user.relationships = [spouse];

            expect(LIFE_EVENTS.neglected_family_intervention.condition(user)).toBe(true);
            expect(LIFE_EVENTS.neglected_family_intervention.getTargetNPC(user)).toBe(spouse);

            const res = LIFE_EVENTS.neglected_family_intervention.resolve(user, spouse, 'heartfelt_apology');
            expect(res.logType).toBe('good');
            expect(spouse.status).toBe(45);
        });

        test('debt_collector_knock rewards Law degree / high smarts on dispute', () => {
            const user = state.gameState.user;
            user.age = 27;
            user.money = 1200;
            user.studentLoans = 75000;
            user.gradSchoolDegree = 'Law School';

            expect(LIFE_EVENTS.debt_collector_knock.condition(user)).toBe(true);
            const rendered = LIFE_EVENTS.debt_collector_knock.render(user);
            expect(rendered.options.find(o => o.id === 'legal_dispute').disabled).toBe(false);

            const res = LIFE_EVENTS.debt_collector_knock.resolve(user, null, 'legal_dispute');
            expect(res.logType).toBe('good');
            expect(user.studentLoans).toBe(71500);
        });
    });

    describe('Domain-Specific Events & Consequence Chains', () => {
        test('business_whistleblower_leak triggers on cheap supplier and upgrades supplier on compensation', () => {
            const user = state.gameState.user;
            user.age = 32;
            user.hasBusiness = true;
            user.supplierId = 'cheap';
            user.compCash = 30000;
            user.employeeMorale = 40;
            user.businessReputation = 50;

            expect(LIFE_EVENTS.business_whistleblower_leak.condition(user)).toBe(true);
            const res = LIFE_EVENTS.business_whistleblower_leak.resolve(user, null, 'upgrade_and_compensate');
            expect(res.logType).toBe('good');
            expect(user.supplierId).toBe('standard');
            expect(user.compCash).toBe(15000);
            expect(user.employeeMorale).toBe(65);
        });

        test('real_estate_zoning_windfall increases property value by 12%', () => {
            const user = state.gameState.user;
            user.age = 40;
            user.money = 5000;
            user.assets = [{ id: 'prop_1', category: 'property', name: 'Townhouse', value: 200000 }];

            expect(LIFE_EVENTS.real_estate_zoning_windfall.condition(user)).toBe(true);
            const res = LIFE_EVENTS.real_estate_zoning_windfall.resolve(user, null, 'lobby_transit_hub');
            expect(res.logType).toBe('good');
            expect(user.assets[0].value).toBe(224000);
            expect(user.money).toBe(4000);
        });

        test('science_fair_project complex_robotics unlocks patent_licensing_offer chain later', () => {
            const user = state.gameState.user;
            user.age = 12;
            user.smarts = 80;

            LIFE_EVENTS.science_fair_project.resolve(user, null, 'complex_robotics');
            expect(user.lifeEventFlags.built_solar_rover).toBe(true);

            user.age = 22;
            expect(LIFE_EVENTS.patent_licensing_offer.condition(user)).toBe(true);
            const prevMoney = user.money;
            const res = LIFE_EVENTS.patent_licensing_offer.resolve(user, null, 'sell_patent_outright');
            expect(res.logType).toBe('good');
            expect(user.money).toBe(prevMoney + 6000);
        });

        test('stock_market_insider_tip sets flag that triggers regulatory_inquiry_knock 1+ years later', () => {
            const user = state.gameState.user;
            user.age = 28;
            user.investments = { savings: 10000, stocks: {} };
            user.smarts = 85;

            expect(LIFE_EVENTS.stock_market_insider_tip.condition(user)).toBe(true);
            LIFE_EVENTS.stock_market_insider_tip.resolve(user, null, 'trade_on_tip');
            expect(user.lifeEventFlags.insider_trade_used).toBe(28);

            // Same year should not trigger inquiry yet
            expect(LIFE_EVENTS.regulatory_inquiry_knock.condition(user)).toBe(false);

            // Next year triggers inquiry
            user.age = 29;
            expect(LIFE_EVENTS.regulatory_inquiry_knock.condition(user)).toBe(true);
            const res = LIFE_EVENTS.regulatory_inquiry_knock.resolve(user, null, 'lawyer_up_dismiss');
            expect(res.logType).toBe('good');
        });
    });

    describe('EventManager Queueing, Repetition Prevention & Priority', () => {
        test('evaluateAgeUpEvents populates state.gameState.pendingEvents when event triggers', () => {
            const user = state.gameState.user;
            user.age = 40;
            user.relationships = [
                { id: 'child_1', name: 'Alex', type: 'Son', age: 18, lifeStatus: 'Alive', status: 60 }
            ];

            EventManager.evaluateAgeUpEvents(user, state.gameState);

            expect(state.gameState.pendingEvents.length).toBe(1);
            expect(state.gameState.pendingEvents[0].eventId).toBe('child_major_approval');
            expect(state.gameState.pendingEvents[0].npcId).toBe('child_1');
            expect(state.gameState.completedEventsHistory.length).toBe(1);
        });

        test('oncePerLife and cooldownYears prevent repeated firing in subsequent age-ups', () => {
            const user = state.gameState.user;
            user.age = 12;

            // Science fair already completed at age 11
            state.gameState.completedEventsHistory = [
                { eventId: 'science_fair_project', age: 11, npcId: null },
                { eventId: 'classmate_fight', age: 11, npcId: null },
                { eventId: 'flu_season', age: 10, npcId: null }
            ];

            expect(EventManager.canTriggerEvent(LIFE_EVENTS.science_fair_project, user, state.gameState)).toBe(false);
            expect(EventManager.canTriggerEvent(LIFE_EVENTS.flu_season, user, state.gameState)).toBe(false);

            user.age = 15; // 5 years after age 10 -> flu_season cooldown (5 years) expired
            expect(EventManager.canTriggerEvent(LIFE_EVENTS.flu_season, user, state.gameState)).toBe(true);
        });

        test('high-priority milestone events are never blocked by lower-priority random events', () => {
            const user = state.gameState.user;
            user.age = 40;
            user.jobTitle = 'Manager';
            user.careerTrack = 'retail';
            user.jobPerformance = 90;
            user.yearsInRole = 2;
            user.health = 60;
            user.relationships = [
                { id: 'child_1', name: 'Alex', type: 'Son', age: 18, lifeStatus: 'Alive', status: 60 }
            ];

            // Even across multiple trials, priority 100 child_major_approval always wins
            for (let i = 0; i < 5; i++) {
                state.gameState.pendingEvents = [];
                state.gameState.completedEventsHistory = [];
                EventManager.evaluateAgeUpEvents(user, state.gameState);
                expect(state.gameState.pendingEvents[0].eventId).toBe('child_major_approval');
            }
        });
    });

    describe('Life Event Modal Delta Badges UX', () => {
        test('selectLifeEventChoice renders stat, money, and relationship delta pills on Outcome screen', () => {
            const user = state.gameState.user;
            user.age = 30;
            user.money = 5000;
            const partner = { id: 'p_1', name: 'Taylor', type: 'Wife', status: 60 };
            user.relationships = [partner];
            state.gameState.pendingEvents = [{ eventId: 'spouse_surprise_getaway', npcId: 'p_1' }];

            const replaceSpy = jest.spyOn(UI, 'replaceModalContent').mockImplementation(() => {});
            const headerSpy = jest.spyOn(UI, 'updateHeader').mockImplementation(() => {});
            const showSpy = jest.spyOn(UI, 'showCustomModal').mockImplementation(() => {});

            processNextLifeEvent();
            expect(showSpy).toHaveBeenCalled();

            selectLifeEventChoice('spouse_surprise_getaway', 'book_getaway', 'p_1');
            expect(replaceSpy).toHaveBeenCalled();
            const [, outcomeHtml] = replaceSpy.mock.calls[0];
            expect(outcomeHtml).toContain('outcome-delta-badges');
            expect(outcomeHtml).toContain('-$1,500');
            expect(outcomeHtml).toContain('+25 Taylor');

            replaceSpy.mockRestore();
            headerSpy.mockRestore();
            showSpy.mockRestore();
        });
    });
});
