const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function addTodayApplications() {
  try {
    // Target specific startup ID 20 (surya) which has the jobs
    const startupId = 20;
    console.log(`Adding today applications for startup ${startupId} (surya)...`);

    // Get active jobs for this startup
    const jobs = await sql`SELECT id, title FROM jobs WHERE startup_id = ${startupId} AND status = 'active' ORDER BY id LIMIT 3`;
    if (jobs.length === 0) {
      console.error('No active jobs found for startup 20');
      return;
    }

    console.log(`Available jobs: ${jobs.map(j => j.title).join(', ')}`);

    // Add applications with today's date
    const todayApplications = [
      { name: 'John Today', email: 'john.today@email.com', jobIndex: 0 },
      { name: 'Sarah Fresh', email: 'sarah.fresh@email.com', jobIndex: 1 % jobs.length },
      { name: 'Mike New', email: 'mike.new@email.com', jobIndex: 0 }
    ];

    for (const app of todayApplications) {
      const job = jobs[app.jobIndex];
      await sql`
        INSERT INTO applications (
          job_id, startup_id, candidate_name, candidate_email,
          role_applied, status, match_score, applied_at
        ) VALUES (
          ${job.id}, ${startupId}, ${app.name}, ${app.email},
          ${job.title}, 'new', 80, CURRENT_TIMESTAMP
        )
      `;
      console.log(`✅ Added: ${app.name} for ${job.title}`);
    }

    console.log('\n🎉 Added 3 today applications for testing!');

    // Show summary
    const todayCount = await sql`
      SELECT COUNT(*) as count
      FROM applications
      WHERE startup_id = ${startupId} AND applied_at >= CURRENT_DATE
    `;
    console.log(`📊 Total applications today: ${todayCount[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

addTodayApplications();