require('dotenv').config();

//Import PostgreSQL client library
import { Pool } from 'pg';

// Create a connection pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async (request, resolution) => {
    if (request.method !== "GET") {
        resolution.status(405).send('Method Not Allowed');
        return;
    }
    try{
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() AS now');
        client.release();
        const dbTime = result.rows[0].now;

        resolution.status(200).json({
            message: 'Database connection successful',
            databaseTime: dbTime,
            apiEndpoint: '/api'
        })
    }
    catch{
        console.error('Database connection error:', error.message);

        resolution.status(500).json({
            message: 'Database connection error',
            databaseTime: dbTime,
            apiEndpoint: '/api'
        })
    }

}
