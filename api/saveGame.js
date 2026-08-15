import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';

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

  try {
    // 2. Grab the data sent from the frontend
    const { email, game_data } = request.body;

    // 3. Validation: Never trust the frontend completely
    if (!game_data) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    // Server-side purchase synchronization for authenticated users
    if (game_data.user) {
      try {
        const verifiedPurchasesResult = await sql`
          SELECT DISTINCT pack_id FROM user_purchases WHERE auth0_id = ${authUserId}
        `;
        const verifiedPacks = verifiedPurchasesResult.rows.map(r => r.pack_id);
        
        if (!Array.isArray(game_data.user.purchases)) {
          game_data.user.purchases = [];
        }
        
        // Ensure all DB-verified packs are included
        const mergedPurchases = new Set([...game_data.user.purchases, ...verifiedPacks]);
        game_data.user.purchases = Array.from(mergedPurchases);
      } catch (dbErr) {
        // Table might not exist yet or empty; ignore
      }
    }

    // 4. The "UPSERT" Query
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