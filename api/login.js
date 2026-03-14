import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // THE FIX: Destructure 'relationships' from the incoming body
    const { auth0_id, email, username, gender, city, relationships } = request.body;

    if (!auth0_id) {
        return response.status(400).json({ error: 'Missing auth0_id' });
    }

    try {
        // 1. Check if user exists
        const checkResult = await sql`
            SELECT * FROM users WHERE auth0_id = ${auth0_id}
        `;

        if (checkResult.rows.length > 0) {
            console.log('Returning player found:', auth0_id);
            return response.status(200).json(checkResult.rows[0]);
        } 
        
        // 2. If new, create them with the JSONB structure
        const initialGameData = {
            name: username,
            gender: gender,
            city: city,
            assets: [],
            // THE FIX: Inject the payload array, fallback to empty array if missing
            relationships: relationships || [], 
            history: [
                { 
                    age: 0, 
                    events: [{ msg: `Born in ${city}`, color: "text-blue-400" }] 
                }
            ]
        };

        const insertResult = await sql`
            INSERT INTO users (auth0_id, email, game_data, last_played_at)
            VALUES (${auth0_id}, ${email}, ${initialGameData}, NOW())
            RETURNING *;
        `;

        console.log('New Player created:', username);
        return response.status(200).json(insertResult.rows[0]);

    } catch (error) {
        console.error('Login error:', error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}