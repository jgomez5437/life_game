import { GameLogic } from '../gameLogic.js';

export function getSkillXpSafe(user, skillKey) {
    if (!user || !skillKey) return 0;
    if (typeof GameLogic.getSkillXp === 'function') {
        return GameLogic.getSkillXp(user, skillKey);
    }
    return Math.max(0, Math.min(100, Number(user.skills?.[skillKey]?.xp) || 0));
}

export function getUserStat(user, statName, fallback = 50) {
    return user?.[statName] ?? user?.stats?.[statName] ?? fallback;
}

export function isLivingNPC(r) {
    if (!r) return false;
    return r.lifeStatus !== 'Deceased' && !r.isDead && r.isAlive !== false && !r.deathCause;
}

export function ensureEventFlags(user) {
    if (!user) return {};
    if (!user.lifeEventFlags || typeof user.lifeEventFlags !== 'object' || Array.isArray(user.lifeEventFlags)) {
        user.lifeEventFlags = {};
    }
    return user.lifeEventFlags;
}
