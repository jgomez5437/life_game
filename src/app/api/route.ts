import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT NOW() AS now`;
    const dbTime = result.rows[0].now;

    return NextResponse.json({
      message: 'Database connection successful',
      databaseTime: dbTime,
      apiEndpoint: '/api'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      message: 'Database connection error',
      error: error.message
    }, { status: 500 });
  }
}
