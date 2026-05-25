const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

(async () => {
  try {
    const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log('Tables in public schema:');
    res.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));
  } catch (err) {
    console.error('Query error:', err.message || err);
  } finally {
    await pool.end();
  }
})();
