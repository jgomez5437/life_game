import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auth0_id, email, username, gender, city, relationships } = body;

    if (!auth0_id) {
      return NextResponse.json({ error: 'Missing auth0_id' }, { status: 400 });
    }

    // 1. Check if user exists
    const checkResult = await sql`
        SELECT * FROM users WHERE auth0_id = ${auth0_id}
    `;

    if (checkResult.rows.length > 0) {
        console.log('Returning player found:', auth0_id);
        return NextResponse.json(checkResult.rows[0], { status: 200 });
    } 
    
    // 2. If new, create them with the JSONB structure
    const initialGameData = {
        name: username,
        gender: gender,
        city: city,
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

    const insertResult = await sql`
        INSERT INTO users (auth0_id, email, game_data, last_played_at)
        VALUES (${auth0_id}, ${email}, ${JSON.stringify(initialGameData)}, NOW())
        RETURNING *;
    `;

    console.log('New Player created:', username);
    return NextResponse.json(insertResult.rows[0], { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
