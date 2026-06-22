require("dotenv").config();
const ws = require("ws");
const { neonConfig, Pool } = require("@neondatabase/serverless");

neonConfig.webSocketConstructor = ws;

function getConnectionString(raw) {
  return (raw || "")
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/\?$/, "");
}

async function main() {
  const connectionString = getConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const rows = await pool.query(
    `
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name IN (
        'id',
        'startup_id',
        'startup_name',
        'title',
        'department',
        'emp_type',
        'location',
        'remote',
        'work_mode',
        'sal_min',
        'sal_max',
        'experience',
        'education',
        'openings',
        'application_deadline',
        'application_method',
        'external_url',
        'skills',
        'screening_questions',
        'requirements'
      )
    ORDER BY ordinal_position;
    `
  );

  console.log("jobs column types:", rows.rows || rows);

  const apps = await pool.query(
    `
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name IN ('job_id','student_id')
    ORDER BY ordinal_position;
    `
  );
  console.log("applications column types:", apps.rows || apps);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

