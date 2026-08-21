import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Verify the caller's JWT token — auth0_id comes from the verified token, not the request body
    let auth0_id;
    try {
        auth0_id = await verifyAuth(request);
    } catch (error) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    // Enforce rate limiting: 10 logins / min per user
    if (!checkRateLimit(request, response, 'login', null, auth0_id)) {
        return;
    }

    const { email, username, gender, city, relationships, appearance } = request.body;

    try {
        const slotData = {
            name: username,
            gender: gender,
            city: city,
            appearance: appearance || null,
            assets: [],
            relationships: relationships || [],
            stats: {
                health: 100
            },
            history: [
                { 
                    age: 0, 
                    events: [{ msg: `Born in ${city}`, color: "text-blue-400" }] 
                }
            ],
            _slotId: 'slot_1'
        };

        const initialGameData = {
            activeSlotId: 'slot_1',
            slots: {
                slot_1: {
                    id: 'slot_1',
                    name: username || 'Main Life',
                    lastSaved: Date.now(),
                    data: slotData
                }
            },
            name: username,
            gender: gender,
            city: city,
            appearance: appearance || null,
            assets: [],
            relationships: relationships || [],
            stats: {
                health: 100
            },
            history: [
                { 
                    age: 0, 
                    events: [{ msg: `Born in ${city}`, color: "text-blue-400" }] 
                }
            ]
        };

        // 1. Check if user exists
        const checkResult = await sql`
            SELECT * FROM users WHERE auth0_id = ${auth0_id}
        `;

        if (checkResult.rows.length > 0) {
            const existingUser = checkResult.rows[0];
            
            // If game_data is empty (e.g. wiped after death), initialize it
            if (!existingUser.game_data || Object.keys(existingUser.game_data).length === 0) {
                console.log('Re-initializing player data for:', auth0_id);
                const updateResult = await sql`
                    UPDATE users 
                    SET game_data = ${initialGameData}, last_played_at = NOW()
                    WHERE auth0_id = ${auth0_id}
                    RETURNING *;
                `;
                return response.status(200).json(updateResult.rows[0]);
            }

            console.log('Returning player found:', auth0_id);
            return response.status(200).json(existingUser);
        } 
        
        // 2. If new, create them with the JSONB structure
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