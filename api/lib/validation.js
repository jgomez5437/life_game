// api/lib/validation.js
// Validation helpers for API inputs, save slots, and prototype pollution guards

/**
 * Validates save slot identifier against allowed patterns.
 * Allowed: integer 0-9, string '0'-'9', or 'slot_1' through 'slot_10', or timestamped 'slot_<10-15 digits>'.
 */
export function isValidSlotId(slotId) {
  if (slotId === null || slotId === undefined) return true;
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
 * Recursively inspects an object for prototype pollution keys.
 */
export function hasDangerousKeys(obj, visited = new Set()) {
  if (!obj || typeof obj !== 'object') return false;
  if (visited.has(obj)) return false;
  visited.add(obj);

  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  // Check prototype override if not standard Object/Array/null prototype
  const proto = Object.getPrototypeOf(obj);
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    return true;
  }
  if (proto !== null && Object.getPrototypeOf(proto) !== null && !Array.isArray(obj)) {
    return true;
  }

  // Check own property names & hasOwnProperty
  for (const key of dangerousProps) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return true;
    }
  }
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (dangerousProps.includes(key)) {
      return true;
    }
    const val = obj[key];
    if (val && typeof val === 'object') {
      if (hasDangerousKeys(val, visited)) {
        return true;
      }
    }
  }

  // Check own enumerable keys
  for (const key of Object.keys(obj)) {
    if (dangerousProps.includes(key)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that snapshots array is well-formed and bounded in size.
 */
export function isValidSnapshotsArray(snapshots, maxAllowed = 10) {
  if (snapshots === null || snapshots === undefined) return true;
  if (!Array.isArray(snapshots)) return false;
  if (snapshots.length > maxAllowed) return false;
  for (const s of snapshots) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
    if (typeof s.age !== 'number' || s.age < 0 || s.age > 200) return false;
  }
  return true;
}

/**
 * Validates save slots dictionary:
 * - Must be a non-null object, not an array
 * - Slot count must not exceed maxSlots (default 10)
 * - Every key must pass isValidSlotId(key)
 * - Each slot must be a valid object, slot.id must match or be a valid slotId,
 *   and if slot.data has snapshots, they must satisfy isValidSnapshotsArray.
 */
export function isValidSlotsObject(slots, maxSlots = 10) {
  if (slots === null || slots === undefined) return true;
  if (typeof slots !== 'object' || Array.isArray(slots)) return false;
  if (hasDangerousKeys(slots)) return false;

  const keys = Object.keys(slots);
  if (keys.length > maxSlots) return false;

  for (const key of keys) {
    if (!isValidSlotId(key)) return false;
    const slot = slots[key];
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return false;
    if (slot.id !== undefined && slot.id !== null && !isValidSlotId(slot.id)) return false;
    if (slot.data !== undefined && slot.data !== null) {
      if (typeof slot.data !== 'object' || Array.isArray(slot.data)) return false;
      if (slot.data.snapshots !== undefined && !isValidSnapshotsArray(slot.data.snapshots, 10)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates top-level game state schema:
 * - Checks for forbidden keys (prototype pollution)
 * - Validates slotId, slots dictionary, and snapshots if present
 */
export function validateGameStateSchema(gameData) {
  if (!gameData || typeof gameData !== 'object' || Array.isArray(gameData)) return false;
  if (hasDangerousKeys(gameData)) return false;

  const slotId = gameData._slotId ?? gameData.slotId ?? gameData.activeSlotId;
  if (slotId !== undefined && slotId !== null && !isValidSlotId(slotId)) return false;

  if (gameData.snapshots !== undefined && !isValidSnapshotsArray(gameData.snapshots, 10)) return false;

  if (gameData.slots !== undefined && !isValidSlotsObject(gameData.slots, 10)) return false;

  return true;
}

/**
 * Maximum allowed save payload size in bytes (512 KB).
 * Legitimate multi-slot saves with 10 slots, lifelogs, and snapshots
 * typically stay well under 200 KB. 512 KB provides generous headroom
 * while preventing abuse.
 */
export const MAX_SAVE_PAYLOAD_BYTES = 512 * 1024;

/**
 * Estimates the serialized byte size of the request body and rejects
 * payloads exceeding MAX_SAVE_PAYLOAD_BYTES.
 *
 * Checks Content-Length header first (fast path), then falls back to
 * JSON.stringify estimation if the header is missing or untrustworthy.
 *
 * @param {object} request - The incoming HTTP request object.
 * @returns {{ ok: boolean, size: number }} ok=false if payload exceeds limit.
 */
export function checkPayloadSize(request) {
  const maxBytes = MAX_SAVE_PAYLOAD_BYTES;

  // Fast path: trust Content-Length header if present
  const contentLength = parseInt(request.headers?.['content-length'], 10);
  if (!isNaN(contentLength) && contentLength > 0) {
    return { ok: contentLength <= maxBytes, size: contentLength };
  }

  // Fallback: estimate from serialized body
  if (request.body) {
    try {
      const estimated = Buffer.byteLength(JSON.stringify(request.body), 'utf8');
      return { ok: estimated <= maxBytes, size: estimated };
    } catch (_) {
      // If we can't serialize, allow it through — downstream validation will catch issues
      return { ok: true, size: 0 };
    }
  }

  return { ok: true, size: 0 };
}

/**
 * Server-authoritative pack catalog with fixed pricing, names, and availability.
 * This is the single source of truth for checkout sessions and webhook verification.
 */
export const PACK_CATALOG = {
  god_mode: {
    id: 'god_mode',
    name: 'God Mode & Stat Editor',
    amount: 299,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_GOD_MODE || 'price_god_mode'
  },
  instant_diplomas: {
    id: 'instant_diplomas',
    name: 'Instant Diplomas',
    amount: 199,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_INSTANT_DIPLOMAS || 'price_instant_diplomas'
  },
  time_machine: {
    id: 'time_machine',
    name: 'Time Machine & Multi-Save Slots',
    amount: 199,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_TIME_MACHINE || 'price_time_machine'
  },
  vip_supporter: {
    id: 'vip_supporter',
    name: 'VIP Supporter & Unique Theme',
    amount: 499,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_VIP_SUPPORTER || 'price_vip_supporter'
  },
  mafia_syndicate: {
    id: 'mafia_syndicate',
    name: 'Start a Life Expansion: Mafia Pack',
    amount: 299,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_MAFIA_SYNDICATE || 'price_mafia_syndicate'
  },
  mafia_expansion: {
    id: 'mafia_expansion',
    name: 'Start a Life Expansion: Mafia Pack',
    amount: 299,
    currency: 'usd',
    available: true,
    priceId: process.env.STRIPE_PRICE_MAFIA_EXPANSION || 'price_mafia_expansion'
  },
  artist_pack: {
    id: 'artist_pack',
    name: 'Artist & Creative Industry',
    amount: 399,
    currency: 'usd',
    available: false,
    priceId: process.env.STRIPE_PRICE_ARTIST_PACK || 'price_artist_pack'
  },
  athlete_pack: {
    id: 'athlete_pack',
    name: 'Athlete & Pro Sports',
    amount: 399,
    currency: 'usd',
    available: false,
    priceId: process.env.STRIPE_PRICE_ATHLETE_PACK || 'price_athlete_pack'
  },
  politician_pack: {
    id: 'politician_pack',
    name: 'Politician & Head of State',
    amount: 399,
    currency: 'usd',
    available: false,
    priceId: process.env.STRIPE_PRICE_POLITICIAN_PACK || 'price_politician_pack'
  }
};

/**
 * Server-side mapping of Stripe price IDs to internal pack IDs.
 */
export const PRICE_TO_PACK = Object.entries(PACK_CATALOG).reduce((acc, [packId, config]) => {
  if (config.priceId) {
    acc[config.priceId] = packId;
  }
  return acc;
}, {});

/**
 * Looks up a pack by its packId in the authoritative catalog.
 */
export function getPackById(packId) {
  if (!packId || typeof packId !== 'string') return null;
  return PACK_CATALOG[packId] || null;
}

/**
 * Looks up a pack by its Stripe priceId in the authoritative catalog.
 */
export function getPackByPriceId(priceId) {
  if (!priceId || typeof priceId !== 'string') return null;
  const mappedPackId = PRICE_TO_PACK[priceId];
  if (mappedPackId && PACK_CATALOG[mappedPackId]) {
    return PACK_CATALOG[mappedPackId];
  }
  for (const pack of Object.values(PACK_CATALOG)) {
    if (pack.priceId === priceId) return pack;
  }
  return null;
}

/**
 * Authoritatively resolves and validates pack selection from client input.
 * Rejects mismatched priceId/packId pairs, unknown packs, and unreleased packs.
 *
 * @param {string|null} packId - Pack ID sent by client
 * @param {string|null} priceId - Stripe Price ID sent by client
 * @returns {{ pack?: object, error?: string, status?: number }}
 */
export function resolvePack(packId, priceId) {
  let resolvedByPrice = null;
  let resolvedById = null;

  if (priceId !== undefined && priceId !== null) {
    if (typeof priceId !== 'string' || !priceId.trim()) {
      return { error: 'Invalid priceId', status: 400 };
    }
    resolvedByPrice = getPackByPriceId(priceId.trim());
    if (!resolvedByPrice) {
      return { error: 'Invalid priceId: price not found in catalog', status: 400 };
    }
  }

  if (packId !== undefined && packId !== null) {
    if (typeof packId !== 'string' || !packId.trim()) {
      return { error: 'Invalid packId', status: 400 };
    }
    resolvedById = getPackById(packId.trim());
    if (!resolvedById) {
      return { error: 'Invalid packId: pack not found in catalog', status: 400 };
    }
  }

  if (!resolvedById && !resolvedByPrice) {
    return { error: 'Missing packId or priceId', status: 400 };
  }

  if (resolvedById && resolvedByPrice && resolvedById.id !== resolvedByPrice.id) {
    return { error: 'Price ID does not match pack ID', status: 400 };
  }

  const finalPack = resolvedById || resolvedByPrice;

  if (!finalPack.available) {
    return { error: `Pack '${finalPack.name}' is not currently available for purchase`, status: 400 };
  }

  return { pack: finalPack };
}

/**
 * Canonical set of valid purchasable pack IDs.
 * Derived directly from PACK_CATALOG to prevent drift.
 */
export const VALID_PACK_IDS = new Set(Object.keys(PACK_CATALOG));

/**
 * Strips all entitlement fields from game_data at every location where
 * the client could inject unauthorized perks:
 *   - game_data.purchases, game_data.purchasedPacks, game_data.godMode, game_data.isVIP, game_data.vipLevel
 *   - game_data.user.*
 *   - game_data.slots[*].data.* and game_data.slots[*].data.user.*
 *   - game_data.snapshots[*].data.*
 *
 * After stripping, the caller should inject the DB-authoritative purchases.
 * Mutates game_data in place and returns it.
 */
export function sanitizeEntitlements(gameData) {
  if (!gameData || typeof gameData !== 'object') return gameData;

  const entitlementKeys = ['purchases', 'purchasedPacks', 'godMode', 'isVIP', 'vipLevel'];

  const stripKeys = (target) => {
    if (!target || typeof target !== 'object') return;
    for (const key of entitlementKeys) {
      delete target[key];
    }
  };

  // Strip top-level fields
  stripKeys(gameData);

  // Strip user fields
  if (gameData.user && typeof gameData.user === 'object') {
    stripKeys(gameData.user);
  }

  // Strip snapshots if present
  if (Array.isArray(gameData.snapshots)) {
    for (const snapshot of gameData.snapshots) {
      if (snapshot && typeof snapshot === 'object') {
        stripKeys(snapshot);
        if (snapshot.data && typeof snapshot.data === 'object') {
          stripKeys(snapshot.data);
          if (snapshot.data.user && typeof snapshot.data.user === 'object') {
            stripKeys(snapshot.data.user);
          }
        }
      }
    }
  }

  // Strip fields inside every save slot
  if (gameData.slots && typeof gameData.slots === 'object' && !Array.isArray(gameData.slots)) {
    for (const slotKey of Object.keys(gameData.slots)) {
      const slot = gameData.slots[slotKey];
      if (slot && typeof slot === 'object') {
        stripKeys(slot);
        if (slot.data && typeof slot.data === 'object') {
          stripKeys(slot.data);
          if (slot.data.user && typeof slot.data.user === 'object') {
            stripKeys(slot.data.user);
          }
          if (Array.isArray(slot.data.snapshots)) {
            for (const s of slot.data.snapshots) {
              if (s && typeof s === 'object') {
                stripKeys(s);
                if (s.data && typeof s.data === 'object') {
                  stripKeys(s.data);
                  if (s.data.user && typeof s.data.user === 'object') {
                    stripKeys(s.data.user);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return gameData;
}

/**
 * Injects a verified purchases array into all locations within game_data
 * where entitlements are expected:
 *   - game_data.user.purchases (if game_data.user exists)
 *   - game_data.purchases (top-level fallback)
 *   - game_data.slots[*].data.user.purchases / game_data.slots[*].data.purchases
 *
 * Mutates game_data in place and returns it.
 */
export function injectVerifiedPurchases(gameData, verifiedPurchases) {
  if (!gameData || typeof gameData !== 'object') return gameData;

  const purchases = Array.isArray(verifiedPurchases) ? verifiedPurchases : [];

  // Inject into user object or top-level
  if (gameData.user && typeof gameData.user === 'object') {
    gameData.user.purchases = purchases;
  } else {
    gameData.purchases = purchases;
  }

  // Inject into every save slot
  if (gameData.slots && typeof gameData.slots === 'object' && !Array.isArray(gameData.slots)) {
    for (const slotKey of Object.keys(gameData.slots)) {
      const slot = gameData.slots[slotKey];
      if (slot && slot.data && typeof slot.data === 'object') {
        if (slot.data.user && typeof slot.data.user === 'object') {
          slot.data.user.purchases = purchases;
        } else {
          slot.data.purchases = purchases;
        }
      }
    }
  }

  return gameData;
}

