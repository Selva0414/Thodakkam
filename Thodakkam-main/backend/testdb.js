const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const res = await pool.query(`SELECT p.*, COALESCE((SELECT array_agg(l.user_id) FROM post_likes l WHERE l.post_id = p.id), ARRAY[]::TEXT[]) AS likes FROM posts p ORDER BY p.created_at DESC LIMIT 10 OFFSET 0`);
    
    console.log(`Total posts found: ${res.rows.length}`);
    if (res.rows.length > 0) {
      console.log('Sample post:', JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('The database is completely empty (no posts).');
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

main();
