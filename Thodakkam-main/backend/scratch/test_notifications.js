const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  console.log("Connected to DB.");

  try {
    console.log("Checking if notifications table exists...");
    const tableCheck = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'notifications'");
    console.log("Table exists:", tableCheck.rows.length > 0);

    console.log("Getting notifications for student_id = 7...");
    const res = await client.query("SELECT * FROM notifications WHERE student_id::text = '7' ORDER BY is_read ASC, created_at DESC LIMIT 30");
    console.log("Notifications rows count:", res.rows.length);

    console.log("Getting unread count...");
    const countRes = await client.query("SELECT COUNT(*)::int AS count FROM notifications WHERE student_id::text = '7' AND is_read = FALSE");
    console.log("Unread count:", countRes.rows[0]);

  } catch (err) {
    console.error("Database query failed:");
    console.error(err);
  }

  await client.end();
}

main().catch(console.error);
