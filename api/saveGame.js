import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { isValidSlotId, hasDangerousKeys, isValidSnapshotsArray, isValidSlotsObject, sanitizeEntitlements, injectVerifiedPurchases, checkPayloadSize, MAX_SAVE_PAYLOAD_BYTES } from './lib/validation.js';

export { isValidSlotId, hasDangerousKeys, isValidSnapshotsArray, isValidSlotsObject, sanitizeEntitlements, injectVerifiedPurchases, checkPayloadSize, MAX_SAVE_PAYLOAD_BYTES };

export default async function handler(request, response) {
  // 1. Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  let authUserId;
  try {
    authUserId = await verifyAuth(request);
  } catch (error) {
    return response.status(401).json({ error: error.message });
  }

  // Enforce rate limiting: 20 saves / min per authenticated user
  if (!checkRateLimit(request, response, 'saveGame', null, authUserId)) {
    return;
  }

  try {
    // 2. Payload size guard: reject oversized requests (max 512 KB)
    const sizeCheck = checkPayloadSize(request);
    if (!sizeCheck.ok) {
      return response.status(413).json({
        error: `Payload too large: ${(sizeCheck.size / 1024).toFixed(0)} KB exceeds ${MAX_SAVE_PAYLOAD_BYTES / 1024} KB limit`
      });
    }

    // 3. Grab the data sent from the frontend
    const { email, game_data, slotId: bodySlotId } = request.body || {};

    // 3. Validation: Structure & prototype pollution checks
    if (!game_data || typeof game_data !== 'object' || Array.isArray(game_data)) {
      return response.status(400).json({ error: 'Missing or invalid game_data: must be an object' });
    }

    if (hasDangerousKeys(game_data)) {
      return response.status(400).json({ error: 'Security validation failed: forbidden keys detected in payload' });
    }

    const slotId = bodySlotId ?? game_data._slotId ?? game_data.slotId ?? game_data.activeSlotId;
    if (slotId !== undefined && slotId !== null && !isValidSlotId(slotId)) {
      return response.status(400).json({ error: 'Invalid slotId' });
    }

    if (game_data.activeSlotId !== undefined && game_data.activeSlotId !== null && !isValidSlotId(game_data.activeSlotId)) {
      return response.status(400).json({ error: 'Invalid activeSlotId' });
    }

    if (game_data.slots !== undefined && !isValidSlotsObject(game_data.slots, 10)) {
      return response.status(400).json({ error: 'Invalid or oversized slots object' });
    }

    if (game_data.snapshots !== undefined && !isValidSnapshotsArray(game_data.snapshots, 10)) {
      return response.status(400).json({ error: 'Invalid or oversized snapshots array' });
    }

    // 4. Entitlement enforcement: strip client-sent purchases and replace
    //    with DB-authoritative entitlements from user_purchases table.
    //    This prevents players from self-granting paid features via DevTools.
    sanitizeEntitlements(game_data);

    let verifiedPurchases = [];
    try {
      const purchaseResult = await sql`
        SELECT DISTINCT pack_id
        FROM user_purchases
        WHERE auth0_id = ${authUserId};
      `;
      verifiedPurchases = purchaseResult.rows.map(row => row.pack_id);
    } catch (purchaseErr) {
      // Gracefully handle missing user_purchases table (new deployments, dev envs).
      // Treat user as having zero purchases — entitlements stay stripped.
      console.warn('Could not query user_purchases for entitlement validation:', purchaseErr.message);
    }

    injectVerifiedPurchases(game_data, verifiedPurchases);

    // 5. The "UPSERT" Query
    await sql`
      INSERT INTO users (auth0_id, email, game_data, last_played_at)
      VALUES (${authUserId}, ${email}, ${game_data}, NOW())
      ON CONFLICT (auth0_id) 
      DO UPDATE SET 
        game_data = ${game_data},
        last_played_at = NOW();
    `;

    return response.status(200).json({ message: 'Game Saved Successfully' });

  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
