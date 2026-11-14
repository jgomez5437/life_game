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
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // Enforce rate limiting: 60 requests / min per user
  if (!checkRateLimit(request, response, 'getPurchases', null, authUserId)) {
    return;
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
    if (error?.code === '42P01') {
      return response.status(200).json({ purchases: [] });
    }
    console.error('Database Error in getPurchases:', error);
    return response.status(500).json({ error: 'Failed to load purchases' });
  }
}
