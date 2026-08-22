import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';

import { sanitizeEntitlements, injectVerifiedPurchases } from './lib/validation.js';

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

        // Query authoritative entitlements from user_purchases
        let dbPurchases = [];
        try {
            const purchaseResult = await sql`
                SELECT DISTINCT pack_id 
                FROM user_purchases 
                WHERE auth0_id = ${auth0_id};
            `;
            dbPurchases = purchaseResult.rows.map(row => row.pack_id);
        } catch (purchaseErr) {
            console.warn('Could not query user_purchases on login:', purchaseErr.message);
        }

        // 1. Check if user exists
        const checkResult = await sql`
            SELECT * FROM users WHERE auth0_id = ${auth0_id}
        `;

        if (checkResult.rows.length > 0) {
            const existingUser = checkResult.rows[0];
            
            // If game_data is empty, wiped, or only contains entitlement records without a character, initialize it
            const rawGameData = existingUser.game_data;
            const hasCharacter = rawGameData && typeof rawGameData === 'object' && (
                rawGameData.user ||
                rawGameData.stats ||
                rawGameData.name ||
                (rawGameData.slots && typeof rawGameData.slots === 'object' && Object.values(rawGameData.slots).some(s => s && s.data && (s.data.user || s.data.name || s.data.stats)))
            );

            if (!hasCharacter) {
                console.log('Re-initializing player data for:', auth0_id);
                sanitizeEntitlements(initialGameData);
                injectVerifiedPurchases(initialGameData, dbPurchases);
                const updateResult = await sql`
                    UPDATE users 
                    SET game_data = ${initialGameData}, last_played_at = NOW()
                    WHERE auth0_id = ${auth0_id}
                    RETURNING *;
                `;
                const updated = updateResult.rows[0];
                if (updated && updated.game_data) {
                    sanitizeEntitlements(updated.game_data);
                    injectVerifiedPurchases(updated.game_data, dbPurchases);
                }
                return response.status(200).json(updated);
            }

            console.log('Returning player found:', auth0_id);
            if (existingUser.game_data) {
                sanitizeEntitlements(existingUser.game_data);
                injectVerifiedPurchases(existingUser.game_data, dbPurchases);
            }
            return response.status(200).json(existingUser);
        } 
        
        // 2. If new, create them with the JSONB structure
        sanitizeEntitlements(initialGameData);
        injectVerifiedPurchases(initialGameData, dbPurchases);
        const insertResult = await sql`
            INSERT INTO users (auth0_id, email, game_data, last_played_at)
            VALUES (${auth0_id}, ${email}, ${initialGameData}, NOW())
            RETURNING *;
        `;

        console.log('New Player created:', username);
        const createdUser = insertResult.rows[0];
        if (createdUser && createdUser.game_data) {
            sanitizeEntitlements(createdUser.game_data);
            injectVerifiedPurchases(createdUser.game_data, dbPurchases);
        }
        return response.status(200).json(createdUser);

    } catch (error) {
        console.error('Login error:', error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}