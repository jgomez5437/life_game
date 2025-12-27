import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { auth0_id } = request.query;

  if (!auth0_id) {
    return response.status(400).json({ error: 'Missing auth0_id' });
  }

  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE auth0_id = ${auth0_id}
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