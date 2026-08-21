import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';

import { sanitizeEntitlements, injectVerifiedPurchases } from './lib/validation.js';

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

    // Authoritative entitlement enforcement from user_purchases table
    let dbPurchases = [];
    try {
      const purchaseResult = await sql`
        SELECT DISTINCT pack_id 
        FROM user_purchases 
        WHERE auth0_id = ${authUserId};
      `;
      dbPurchases = purchaseResult.rows.map(row => row.pack_id);
    } catch (purchaseErr) {
      console.warn('Could not query user_purchases on load:', purchaseErr.message);
    }

    if (userData.game_data) {
      sanitizeEntitlements(userData.game_data);
      injectVerifiedPurchases(userData.game_data, dbPurchases);
    }

    return response.status(200).json(userData);

  } catch (error) {
    console.error('Load API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}