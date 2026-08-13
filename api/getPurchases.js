import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';

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

  try {
    const result = await sql`
      SELECT DISTINCT pack_id 
      FROM user_purchases 
      WHERE auth0_id = ${authUserId};
    `;

    const purchases = result.rows.map(row => row.pack_id);
    return response.status(200).json({ purchases });
  } catch (error) {
    console.error('Database Error in getPurchases:', error);
    // Return empty array gracefully if table doesn't exist yet
    return response.status(200).json({ purchases: [] });
  }
}
