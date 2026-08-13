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
      SELECT * FROM users 
      WHERE auth0_id = ${authUserId}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'User not found' });
    }

    return response.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Load API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}