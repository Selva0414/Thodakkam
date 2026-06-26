const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    const res = await pool.query(`
      SELECT
        ca.id AS ca_id,
        a.id AS assessment_id,
        ca.current_round,
        a.rounds,
        (a.rounds -> (ca.current_round - 1) ->> 'startTime') AS start_time,
        (a.rounds -> (ca.current_round - 1) ->> 'startTime')::timestamp AS parsed_start_time
      FROM candidate_assessments ca
      JOIN assessments a ON a.id = ca.assessment_id
      WHERE ca.status = 'pending'
        AND a.rounds -> (ca.current_round - 1) ->> 'startTime' IS NOT NULL
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
test();
