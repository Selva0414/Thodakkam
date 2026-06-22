const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  const startups = await client.query("SELECT id, name, email, company_name FROM startups LIMIT 5");
  console.log("=== Startups ===");
  console.log(startups.rows);

  const students = await client.query("SELECT id, name, email FROM students LIMIT 5");
  console.log("=== Students ===");
  console.log(students.rows);

  await client.end();
}

main().catch(console.error);
