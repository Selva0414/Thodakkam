require('dotenv').config({ path: __dirname + '/backend/.env' });
const { Client } = require('pg');

async function getLatestOtp() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 1');
    console.log("Latest OTP generated in database:");
    console.log(res.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

getLatestOtp();
