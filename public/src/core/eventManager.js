/**
 * Random Life Events Engine & Catalog Barrel
 *
 * Re-exports `LIFE_EVENTS` (merged from categorized catalogs under `./events/`)
 * and `EventManager`.
 */

import { ensureEventFlags } from './events/eventHelpers.js';
import { YOUTH_SCHOOL_EVENTS } from './events/youthSchoolEvents.js';
import { FAMILY_RELATIONSHIP_EVENTS } from './events/familyRelationshipEvents.js';
import { CAREER_BUSINESS_EVENTS } from './events/careerBusinessEvents.js';
import { LIFESTYLE_ASSET_EVENTS } from './events/lifestyleAssetEvents.js';

export const LIFE_EVENTS = {
    ...YOUTH_SCHOOL_EVENTS,
    ...FAMILY_RELATIONSHIP_EVENTS,
    ...CAREER_BUSINESS_EVENTS,
    ...LIFESTYLE_ASSET_EVENTS
};

export const EventManager = {
    ensureFlags: ensureEventFlags,

    setFlag: (user, key, value) => {
        const flags = ensureEventFlags(user);
        flags[key] = value;
    },

    getFlag: (user, key, fallback = null) => {
        if (!user?.lifeEventFlags) return fallback;
        return user.lifeEventFlags[key] !== undefined ? user.lifeEventFlags[key] : fallback;
    },

    updateHabitTrackers: (user) => {
        if (!user) return;
        const flags = ensureEventFlags(user);
        const currentDiet = user.diet || (user.hasBetterDiet ? 'balanced' : 'junk');

        if ((user.age || 0) >= 18 && currentDiet === 'junk' && !user.gymMembership) {
            flags.junkDietYears = (flags.junkDietYears || 0) + 1;
        } else {
            flags.junkDietYears = 0;
        }
    },

    canTriggerEvent: (evt, user, gameState, targetNPC = null) => {
        if (!evt || !user || !gameState) return false;
        const currentAge = user.age || 0;
        const history = Array.isArray(gameState.completedEventsHistory) ? gameState.completedEventsHistory : [];

        if (evt.oncePerLife) {
            if (history.some(h => h.eventId === evt.id)) return false;
        }

        if (evt.oncePerNpc && targetNPC?.id) {
            if (history.some(h => h.eventId === evt.id && h.npcId === targetNPC.id)) return false;
        }

        if (typeof evt.cooldownYears === 'number' && evt.cooldownYears > 0) {
            const pastMatches = history.filter(h => h.eventId === evt.id);
            if (pastMatches.length > 0) {
                const lastAge = Math.max(...pastMatches.map(h => Number(h.age) || 0));
                if ((currentAge - lastAge) < evt.cooldownYears) return false;
            }
        }

        return true;
    },

    evaluateAgeUpEvents: (user, gameState) => {
        if (!user || !gameState) return;
        if (!gameState.pendingEvents) gameState.pendingEvents = [];
        if (!gameState.completedEventsHistory) gameState.completedEventsHistory = [];

        EventManager.updateHabitTrackers(user);

        const currentAge = user.age || 0;

        // Collect eligible events with resolved targetNPC
        const eligibleEntries = [];
        for (const key in LIFE_EVENTS) {
            const evt = LIFE_EVENTS[key];

            if (evt.minAge !== undefined && currentAge < evt.minAge) continue;
            if (evt.maxAge !== undefined && currentAge > evt.maxAge) continue;
            if (evt.condition && !evt.condition(user, gameState)) continue;

            const targetNPC = evt.getTargetNPC ? evt.getTargetNPC(user, gameState) : null;
            if (!EventManager.canTriggerEvent(evt, user, gameState, targetNPC)) continue;

            eligibleEntries.push({
                evt,
                targetNPC,
                priority: typeof evt.priority === 'number' ? evt.priority : 25
            });
        }

        // Group by descending priority so milestones & consequence chains evaluate before general flavor events
        const priorityGroups = new Map();
        for (const entry of eligibleEntries) {
            if (!priorityGroups.has(entry.priority)) {
                priorityGroups.set(entry.priority, []);
            }
            priorityGroups.get(entry.priority).push(entry);
        }

        const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => b - a);

        for (const prio of sortedPriorities) {
            const shuffled = priorityGroups.get(prio).sort(() => 0.5 - Math.random());
            for (const { evt, targetNPC } of shuffled) {
                const roll = Math.random();
                if (roll <= (evt.probability ?? 0.25)) {
                    gameState.pendingEvents.push({
                        eventId: evt.id,
                        npcId: targetNPC ? targetNPC.id : null
                    });

                    gameState.completedEventsHistory.push({
                        eventId: evt.id,
                        age: currentAge,
                        npcId: targetNPC ? targetNPC.id : null
                    });

                    return; // Only 1 life event per age up for smooth pacing
                }
            }
        }
    }
};
