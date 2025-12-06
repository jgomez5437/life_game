require('dotenv').config();
const { Pool } = require('pg');
// Create a connection pool using the POSTGRES_URL environment variable
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});
//function to verify if user exists or needs new game state
module.exports = async (request, resolution) => {
    if (request.method !== 'POST') {
        return resolution.status(405).json({error: 'Method Not Allowed'});
    }
    const {auth0_id, username} = request.body;

    if(!auth0_id){
        return resolution.status(400).json({error: 'Missing auth0_id'});
    }

    try{
        const client = await pool.connect();
        const checkResult = await client.query(
            'SELECT * FROM users WHERE auth0_id = $1',
            [auth0_id]
        );
        let user;

        if (checkResult.rows.length > 0) {
            user = checkResult[0];
            console.log('Returning player found:', user.username);
        } else {
            const insertResult = await client.query(
                'INSERT INTO users (auth0_id, username) VALUES ($1, $2) RETURNING *',
                [auth0_id, username || 'Unknown']
            );
            user = insertResult.rows[0];
            console.log('New Player created:', user.username);
        }
        client.release();
        resolution.status(200).json(user);
    } catch (error) {
        console.error('Login error:', error);
        resolution.status(500).json({ error: 'Internal Server Error' });
    }
    
}