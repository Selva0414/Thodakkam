const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.DATABASE_URL);

const candidateApplications = [
  {
    candidate_name: "Arjun Kumar",
    candidate_email: "arjun.kumar@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
    role_applied: "Senior AWS Cloud Engineer",
    status: "new",
    match_score: 85,
    resume_url: "https://example.com/resumes/arjun_kumar.pdf"
  },
  {
    candidate_name: "Priya Sharma",
    candidate_email: "priya.sharma@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    role_applied: "DevOps Specialist",
    status: "reviewing",
    match_score: 78,
    resume_url: "https://example.com/resumes/priya_sharma.pdf"
  },
  {
    candidate_name: "Rahul Singh",
    candidate_email: "rahul.singh@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    role_applied: "Full Stack Developer (MERN)",
    status: "shortlisted",
    match_score: 88,
    resume_url: "https://example.com/resumes/rahul_singh.pdf"
  },
  {
    candidate_name: "Anjali Nair",
    candidate_email: "anjali.nair@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=anjali",
    role_applied: "Cloud Solutions Architect",
    status: "interview_scheduled",
    match_score: 92,
    resume_url: "https://example.com/resumes/anjali_nair.pdf"
  },
  {
    candidate_name: "Vikram Reddy",
    candidate_email: "vikram.reddy@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram",
    role_applied: "Backend Developer (Python)",
    status: "new",
    match_score: 75,
    resume_url: "https://example.com/resumes/vikram_reddy.pdf"
  },
  {
    candidate_name: "Sneha Patel",
    candidate_email: "sneha.patel@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
    role_applied: "Technical Writer",
    status: "reviewing",
    match_score: 82,
    resume_url: "https://example.com/resumes/sneha_patel.pdf"
  },
  {
    candidate_name: "Karthik Iyer",
    candidate_email: "karthik.iyer@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=karthik",
    role_applied: "DevOps Specialist",
    status: "new",
    match_score: 73,
    resume_url: "https://example.com/resumes/karthik_iyer.pdf"
  },
  {
    candidate_name: "Maya Gupta",
    candidate_email: "maya.gupta@email.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
    role_applied: "Full Stack Developer (MERN)",
    status: "rejected",
    match_score: 65,
    resume_url: "https://example.com/resumes/maya_gupta.pdf"
  }
];

async function addCandidateApplications() {
  try {
    // Get current startup
    const currentStartup = await sql`
      SELECT id FROM startups ORDER BY created_at DESC LIMIT 1
    `;

    if (currentStartup.length === 0) {
      console.error("❌ No startup found");
      return;
    }

    const startupId = currentStartup[0].id;

    // Get jobs for this startup
    const jobs = await sql`
      SELECT id, title FROM jobs
      WHERE startup_id = ${startupId} AND status = 'active'
      ORDER BY id
    `;

    if (jobs.length === 0) {
      console.error("❌ No active jobs found for startup");
      return;
    }

    console.log(`🎯 Adding candidate applications for startup ${startupId}`);
    console.log(`📋 Available jobs: ${jobs.map(j => j.title).join(', ')}`);

    // Add applications
    const applicationPromises = candidateApplications.map(async (candidate) => {
      // Find matching job by title
      const job = jobs.find(j => j.title === candidate.role_applied);
      if (!job) {
        console.log(`   ⚠️ No job found for: ${candidate.role_applied}`);
        return null;
      }

      const result = await sql`
        INSERT INTO applications (
          job_id, startup_id, candidate_name, candidate_email,
          avatar_url, role_applied, status, match_score, resume_url
        ) VALUES (
          ${job.id}, ${startupId}, ${candidate.candidate_name}, ${candidate.candidate_email},
          ${candidate.avatar_url}, ${candidate.role_applied}, ${candidate.status},
          ${candidate.match_score}, ${candidate.resume_url}
        ) RETURNING id, candidate_name, status
      `;

      console.log(`   ✅ Added: ${result[0].candidate_name} (Status: ${result[0].status})`);
      return result[0];
    });

    const results = await Promise.all(applicationPromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`\n🎉 Successfully added ${successCount} candidate applications!`);

    // Show summary by status
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM applications
      WHERE startup_id = ${startupId}
      GROUP BY status
      ORDER BY status
    `;

    console.log("\n📈 Applications by status:");
    statusCounts.forEach(s => {
      console.log(`   ${s.status}: ${s.count}`);
    });

    const totalApps = await sql`SELECT COUNT(*) as count FROM applications WHERE startup_id = ${startupId}`;
    console.log(`\n📊 Total applications for your startup: ${totalApps[0].count}`);

  } catch (error) {
    console.error("❌ Error adding applications:", error.message);
  }

  process.exit(0);
}

addCandidateApplications();