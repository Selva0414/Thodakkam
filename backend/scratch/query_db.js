const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  
  console.log("--- Assessments details ---");
  const res = await client.query("SELECT id, startup_id, title, rounds, field FROM assessments WHERE id IN (5, 17)");
  console.log(res.rows);

  await client.end();
}

main().catch(console.error);
