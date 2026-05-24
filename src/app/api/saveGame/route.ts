import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auth0_id, email, game_data } = body;

    if (!auth0_id || !game_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sql`
      INSERT INTO users (auth0_id, email, game_data, last_played_at)
      VALUES (${auth0_id}, ${email}, ${JSON.stringify(game_data)}, NOW())
      ON CONFLICT (auth0_id) 
      DO UPDATE SET 
        game_data = ${JSON.stringify(game_data)},
        last_played_at = NOW();
    `;

    return NextResponse.json({ message: 'Game Saved Successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
