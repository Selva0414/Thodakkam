const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const users = await pool.query('SELECT id, full_name, profile_photo FROM users WHERE full_name ILIKE $1', ['%Poov%']);
    console.log('User:', users.rows);

    const posts = await pool.query('SELECT id, author_id, author_name, author_avatar FROM posts WHERE author_name ILIKE $1', ['%Poov%']);
    console.log('Posts:', posts.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

test();
