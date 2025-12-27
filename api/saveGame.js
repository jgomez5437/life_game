import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // 1. Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Grab the data sent from the frontend
    const { auth0_id, email, game_data } = request.body;

    // 3. Validation: Never trust the frontend completely
    if (!auth0_id || !game_data) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    // 4. The "UPSERT" Query
    // This looks complex, but it just means: "Try to insert. If ID exists, update instead."
    await sql`
      INSERT INTO users (auth0_id, email, game_data, last_played_at)
      VALUES (${auth0_id}, ${email}, ${game_data}, NOW())
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