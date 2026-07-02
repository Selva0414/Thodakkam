const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password@123", salt);
  
  const res = await client.query(
    "UPDATE startups SET password_hash = $1, is_verified = true, status = 'ACTIVE' WHERE email = 'spoovarasan600@gmail.com' RETURNING id, email",
    [passwordHash]
  );
  console.log("Updated user:", res.rows);
  await client.end();
}

main().catch(console.error);
