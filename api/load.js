import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // 1. Check Method (GET only)
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the ID from the URL (?auth0_id=...)
  const { auth0_id } = request.query;

  if (!auth0_id) {
    return response.status(400).json({ error: 'Missing auth0_id' });
  }

  try {
    // 3. Find the user in Postgres
    // We select * (everything) so the frontend can rebuild the state
    const result = await sql`
      SELECT * FROM users 
      WHERE auth0_id = ${auth0_id}
      LIMIT 1;
    `;

    // 4. Handle "User Not Found"
    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'User not found' });
    }

    // 5. Return the User Data
    return response.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Load API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}