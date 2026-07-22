const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE j.startup_id::text = '1' ORDER BY a.applied_at DESC LIMIT 1`);
    console.log("Success");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
test();
