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
 * Canonical set of valid purchasable pack IDs.
 * This must stay in sync with the priceMap in create-checkout-session.js
 * and STORE_PACKS in storeScreen.js.
 */
export const VALID_PACK_IDS = new Set([
  'god_mode',
  'instant_diplomas',
  'time_machine',
  'vip_supporter',
  'mafia_syndicate',
  'mafia_expansion',
  'artist_pack',
  'athlete_pack',
  'politician_pack'
]);

/**
 * Strips all `purchases` arrays from game_data at every location where
 * the client could inject entitlements:
 *   - game_data.purchases
 *   - game_data.user.purchases
 *   - game_data.slots[*].data.purchases
 *   - game_data.slots[*].data.user.purchases
 *
 * After stripping, the caller should inject the DB-authoritative purchases.
 * Mutates game_data in place and returns it.
 */
export function sanitizeEntitlements(gameData) {
  if (!gameData || typeof gameData !== 'object') return gameData;

  // Strip top-level purchases
  delete gameData.purchases;

  // Strip user.purchases
  if (gameData.user && typeof gameData.user === 'object') {
    delete gameData.user.purchases;
  }

  // Strip purchases inside every save slot
  if (gameData.slots && typeof gameData.slots === 'object' && !Array.isArray(gameData.slots)) {
    for (const slotKey of Object.keys(gameData.slots)) {
      const slot = gameData.slots[slotKey];
      if (slot && slot.data && typeof slot.data === 'object') {
        delete slot.data.purchases;
        if (slot.data.user && typeof slot.data.user === 'object') {
          delete slot.data.user.purchases;
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
 * Mirrors the merge logic in load.js so saved state stays consistent with loads.
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

  // Inject into every save slot (mirrors load.js merge logic)
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
