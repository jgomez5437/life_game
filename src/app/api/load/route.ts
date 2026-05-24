import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth0_id = searchParams.get('auth0_id');

  if (!auth0_id) {
    return NextResponse.json({ error: 'Missing auth0_id' }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE auth0_id = ${auth0_id}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error: any) {
    console.error('Load API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
