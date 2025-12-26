import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Vercel health check endpoint
    try {
        const result = await sql`SELECT NOW() AS now`;
        const dbTime = result.rows[0].now;

        return response.status(200).json({
            message: 'Database connection successful',
            databaseTime: dbTime,
            apiEndpoint: '/api'
        });
    } catch (error) {
        console.error('Database connection error:', error);
        return response.status(500).json({
            message: 'Database connection error',
            error: error.message
        });
    }
}