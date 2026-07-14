require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    // Check subscription_payments table
    const res1 = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='subscription_payments'"
    );
    console.log('subscription_payments table exists:', res1.rows.length > 0 ? 'YES' : 'NO');

    if (res1.rows.length > 0) {
      const res2 = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='subscription_payments'"
      );
      console.log('Columns:', res2.rows.map(r => r.column_name).join(', '));
    }

    // Check startups table for is_locked column
    const res3 = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='startups' AND column_name='is_locked'"
    );
    console.log('startups.is_locked column exists:', res3.rows.length > 0 ? 'YES' : 'NO');

  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
