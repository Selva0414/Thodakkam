import { query } from './config/database';

async function test() {
  try {
    const savedJobs = await query(
      `SELECT j.*, s.company_name, s.logo_url 
       FROM saved_jobs sj
       JOIN jobs j ON sj.job_id = j.id
       LEFT JOIN startups s ON j.startup_id = s.id
       WHERE sj.student_id = $1
       ORDER BY sj.created_at DESC`,
      ['7']
    );
    console.log("Success! Found jobs:", savedJobs.length);
    process.exit(0);
  } catch (e) {
    console.error("Query Failed:", e);
    process.exit(1);
  }
}
test();
