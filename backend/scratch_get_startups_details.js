const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT * FROM startups WHERE email = 'mukesh1152006@gmail.com'");
  console.log(res.rows[0]);
  await client.end();
}

main().catch(console.error);
