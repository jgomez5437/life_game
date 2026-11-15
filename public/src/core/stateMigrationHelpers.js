/**
 * Helpers for stateMigration.js: slot store compaction/validation utilities
 * and event-engine payload sanitizers.
 */

export function sanitizeLifeEventFlags(rawFlags) {
    if (!rawFlags || typeof rawFlags !== 'object' || Array.isArray(rawFlags)) {
        return undefined;
    }
    const sanitized = {};
    for (const key of Object.keys(rawFlags)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
        const val = rawFlags[key];
        if (typeof val === 'boolean' || typeof val === 'string' || val === null) {
            sanitized[key] = val;
        } else if (typeof val === 'number' && Number.isFinite(val)) {
            sanitized[key] = val;
        }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : {};
}

export function sanitizeCompletedEventsHistory(rawHistory) {
    if (!Array.isArray(rawHistory)) return [];
    return rawHistory
        .filter(h => h && typeof h === 'object' && typeof h.eventId === 'string' && h.eventId.trim() !== '')
        .map(h => ({
            eventId: h.eventId.trim(),
            age: typeof h.age === 'number' && Number.isFinite(h.age) ? Math.max(0, Math.min(150, Math.floor(h.age))) : 0,
            npcId: typeof h.npcId === 'string' && h.npcId.trim() !== '' ? h.npcId.trim() : null
        }));
}

export function sanitizePendingEvents(rawPending) {
    if (!Array.isArray(rawPending)) return [];
    return rawPending
        .filter(p => p && typeof p === 'object' && typeof p.eventId === 'string' && p.eventId.trim() !== '')
        .map(p => ({
            eventId: p.eventId.trim(),
            npcId: typeof p.npcId === 'string' && p.npcId.trim() !== '' ? p.npcId.trim() : null
        }));
}

/**
 * Validates save slot identifier against allowed patterns.
 * Allowed: integer 0-9, string '0'-'9', 'slot_1' through 'slot_10', or timestamped 'slot_<10-15 digits>'.
 */
export function isValidSlotId(slotId) {
    if (slotId === null || slotId === undefined) return false;
    if (typeof slotId === 'number') {
        return Number.isInteger(slotId) && slotId >= 0 && slotId <= 9;
    }
    if (typeof slotId === 'string') {
        const s = slotId.trim();
        if (/^[0-9]$/.test(s)) return true;
        if (/^slot_([1-9]|10|[0-9]{10,15})$/.test(s)) return true;
    }
    return false;
}

/**
 * Checks if an exception represents a browser storage quota exceeded error.
 */
export function isQuotaExceededError(err) {
    if (!err) return false;
    return (
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014 ||
        err.number === -2147024882 ||
        (typeof DOMException !== 'undefined' && err instanceof DOMException && (
            err.code === 22 ||
            err.code === 1014 ||
            err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ))
    );
}

/**
 * Attempts automated compaction of stored save slots when quota is exceeded.
 */
export function attemptStoreCompaction(store) {
    try {
        // 1. Remove duplicate legacy keys
        localStorage.removeItem('life_game_save');
        localStorage.removeItem('startALife_saveData');
    } catch (e) {}
    if (!store || !store.slots) return false;
    let compacted = false;
    // 2. Prune snapshots in inactive slots down to 1
    Object.keys(store.slots).forEach(slotId => {
        if (slotId !== store.activeSlotId && Array.isArray(store.slots[slotId]?.data?.snapshots)) {
            if (store.slots[slotId].data.snapshots.length > 1) {
                store.slots[slotId].data.snapshots = store.slots[slotId].data.snapshots.slice(-1);
                compacted = true;
            }
        }
    });
    // 3. Prune snapshots in active slot down to 1
    if (store.slots[store.activeSlotId]?.data?.snapshots?.length > 1) {
        store.slots[store.activeSlotId].data.snapshots = store.slots[store.activeSlotId].data.snapshots.slice(-1);
        compacted = true;
    }
    // 4. Compact older lifeLog in inactive slots if still large (> 30 entries)
    Object.keys(store.slots).forEach(slotId => {
        if (slotId !== store.activeSlotId && Array.isArray(store.slots[slotId]?.data?.lifeLog)) {
            if (store.slots[slotId].data.lifeLog.length > 30) {
                store.slots[slotId].data.lifeLog = store.slots[slotId].data.lifeLog.slice(-30);
                compacted = true;
            }
        }
    });
    return compacted;
}
