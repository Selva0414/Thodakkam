const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    const res = await pool.query(`
      SELECT
        NOW() as n,
        (DATE '2023-10-10' + MAKE_INTERVAL(hours => 14, mins => 30)) as parsed,
        (CASE
              WHEN '02:30 PM' ~* '^\\s*\\d{1,2}:\\d{2}\\s*(AM|PM)\\s*$'
              THEN (
                CASE
                  WHEN UPPER(SUBSTRING('02:30 PM' FROM '(AM|PM)')) = 'PM'
                       AND CAST(SUBSTRING('02:30 PM' FROM '^\\s*(\\d{1,2})') AS INT) < 12
                    THEN MAKE_INTERVAL(hours => CAST(SUBSTRING('02:30 PM' FROM '^\\s*(\\d{1,2})') AS INT) + 12,
                                        mins  => CAST(SUBSTRING('02:30 PM' FROM ':(\\d{2})') AS INT))
                  WHEN UPPER(SUBSTRING('02:30 PM' FROM '(AM|PM)')) = 'AM'
                       AND CAST(SUBSTRING('02:30 PM' FROM '^\\s*(\\d{1,2})') AS INT) = 12
                    THEN MAKE_INTERVAL(hours => 0,
                                        mins  => CAST(SUBSTRING('02:30 PM' FROM ':(\\d{2})') AS INT))
                  ELSE MAKE_INTERVAL(hours => CAST(SUBSTRING('02:30 PM' FROM '^\\s*(\\d{1,2})') AS INT),
                                      mins  => CAST(SUBSTRING('02:30 PM' FROM ':(\\d{2})') AS INT))
                END
              )
              WHEN '02:30 PM' ~ '^\\s*\\d{1,2}:\\d{2}\\s*$'
              THEN MAKE_INTERVAL(hours => CAST(SUBSTRING('02:30 PM' FROM '^\\s*(\\d{1,2})') AS INT),
                                  mins  => CAST(SUBSTRING('02:30 PM' FROM ':(\\d{2})') AS INT))
              ELSE NULL
            END) as calculated_interval
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
test();
