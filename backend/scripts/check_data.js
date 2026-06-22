const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function checkCurrentData() {
  console.log('📊 Database Summary:');
  console.log('==================');

  // Show all startups
  const startups = await sql`SELECT id, founder_name, company_name, email, status FROM startups ORDER BY id`;
  console.log(`\n👥 Startups in DB: ${startups.length}`);
  startups.forEach(s => {
    console.log(`   ID ${s.id}: ${s.company_name || 'null'} - ${s.founder_name} (${s.email}) [${s.status}]`);
  });

  // Show job distribution by startup
  const jobsByStartup = await sql`
    SELECT startup_id, COUNT(*) as job_count
    FROM jobs
    GROUP BY startup_id
    ORDER BY startup_id
  `;
  console.log(`\n💼 Jobs by Startup:`);
  jobsByStartup.forEach(j => {
    const startup = startups.find(s => s.id === j.startup_id);
    console.log(`   Startup ${j.startup_id} (${startup?.founder_name || 'Unknown'}): ${j.job_count} jobs`);
  });

  // Show most recent startup (likely the test user)
  const recentStartup = await sql`SELECT id, founder_name, company_name, email FROM startups ORDER BY created_at DESC LIMIT 1`;
  if (recentStartup.length > 0) {
    const recent = recentStartup[0];
    console.log(`\n🆕 Most Recent Startup: ID ${recent.id} - ${recent.company_name || 'null'} (${recent.founder_name})`);

    const jobsForRecent = await sql`SELECT COUNT(*) as count FROM jobs WHERE startup_id = ${recent.id}`;
    console.log(`    Jobs for this startup: ${jobsForRecent[0].count}`);
  }

  const totalJobs = await sql`SELECT COUNT(*) as count FROM jobs`;
  console.log(`\n📊 Total jobs in database: ${totalJobs[0].count}`);
}

checkCurrentData().catch(console.error).finally(() => process.exit(0));