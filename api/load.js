import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  let authUserId;
  try {
    authUserId = await verifyAuth(request);
  } catch (error) {
    return response.status(401).json({ error: error.message });
  }

  // Enforce rate limiting: 30 loads / min per authenticated user
  if (!checkRateLimit(request, response, 'load', null, authUserId)) {
    return;
  }

  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE auth0_id = ${authUserId}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'User not found' });
    }

    const userData = result.rows[0];

    // Merge purchases from user_purchases table into game_data
    try {
      const purchaseResult = await sql`
        SELECT DISTINCT pack_id 
        FROM user_purchases 
        WHERE auth0_id = ${authUserId};
      `;
      const dbPurchases = purchaseResult.rows.map(row => row.pack_id);

      if (dbPurchases.length > 0 && userData.game_data) {
        const gameData = userData.game_data;
        const savedUser = gameData.user || gameData;
        const existingPurchases = Array.isArray(savedUser.purchases) ? savedUser.purchases : [];
        const mergedPurchases = Array.from(new Set([...existingPurchases, ...dbPurchases]));

        if (gameData.user) {
          gameData.user.purchases = mergedPurchases;
        } else {
          gameData.purchases = mergedPurchases;
        }

        // Also merge dbPurchases into every slot within gameData.slots
        if (gameData.slots && typeof gameData.slots === 'object' && !Array.isArray(gameData.slots)) {
          for (const slotKey of Object.keys(gameData.slots)) {
            const slot = gameData.slots[slotKey];
            if (slot && slot.data && typeof slot.data === 'object') {
              const slotUser = slot.data.user || slot.data;
              const slotPurchases = Array.isArray(slotUser.purchases) ? slotUser.purchases : [];
              const slotMerged = Array.from(new Set([...slotPurchases, ...dbPurchases]));
              if (slot.data.user) {
                slot.data.user.purchases = slotMerged;
              } else {
                slot.data.purchases = slotMerged;
              }
            }
          }
        }

        userData.game_data = gameData;
      }
    } catch (purchaseErr) {
      // Silently continue if user_purchases table doesn't exist yet
      console.warn('Could not merge purchases:', purchaseErr.message);
    }

    return response.status(200).json(userData);

  } catch (error) {
    console.error('Load API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}