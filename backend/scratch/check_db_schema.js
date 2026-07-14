const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const tables = ['students', 'startups', 'messages', 'conversations'];
    for (const t of tables) {
      console.log(`\n--- Schema of table: ${t} ---`);
      const res = await client.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [t]);
      res.rows.forEach(r => {
        console.log(`${r.column_name}: ${r.data_type} (${r.udt_name})`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
