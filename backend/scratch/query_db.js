const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' AND table_name LIKE '%course%'
  `);
  console.log("Matched Tables:", tablesRes.rows);

  const columnsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='course_enrollments'
  `);
  console.log("Columns of course_enrollments:", columnsRes.rows);

  await client.end();
}

main().catch(console.error);
