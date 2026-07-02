import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding mock data...\n");

  // --------------------------------------------------
  // 1. Startup
  // --------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  await sql.query(`
    INSERT INTO startups (founder_name, company_name, company_reg_id, email, password_hash, category, is_verified)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (email) DO NOTHING
  `, ["Arjun Mehta", "NexaAI Technologies", "REG-2024-001", "demo@nexaai.com", passwordHash, "tech", true]);

  const startupRows = await sql.query(
    `SELECT id FROM startups WHERE email = $1`, ["demo@nexaai.com"]
  );
  const startupId = startupRows[0].id;
  console.log(`✅ Startup: NexaAI Technologies (id=${startupId})`);

  // --------------------------------------------------
  // 2. Jobs
  // --------------------------------------------------
  const jobs = [
    ["Frontend Developer", "Engineering", "Full-time", "Bangalore", 400000, 800000, "Build responsive UIs with React and TypeScript.", false, "active"],
    ["Backend Engineer",   "Engineering", "Full-time", "Remote",    500000, 900000, "Design REST APIs using Node.js and PostgreSQL.",  true,  "active"],
    ["Product Manager",    "Product",     "Full-time", "Mumbai",    700000,1200000, "Own the product roadmap and work with cross-functional teams.", false, "active"],
    ["ML Engineer",        "AI/ML",       "Full-time", "Remote",    600000,1100000, "Develop and deploy machine learning models at scale.", true, "paused"],
  ];

  const jobIds = [];
  for (const [title, dept, empType, loc, salMin, salMax, desc, remote, status] of jobs) {
    await sql.query(`
      INSERT INTO jobs (startup_id, title, department, emp_type, location, sal_min, sal_max, description, remote, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [startupId, title, dept, empType, loc, salMin, salMax, desc, remote, status]);
  }

  const jobRows = await sql.query(
    `SELECT id, title FROM jobs WHERE startup_id = $1 ORDER BY id`, [startupId]
  );
  jobRows.forEach(j => jobIds.push(j.id));
  console.log(`✅ Jobs: ${jobRows.map(j => j.title).join(", ")}`);

  // --------------------------------------------------
  // 3. Applications
  // --------------------------------------------------
  const candidates = [
    // [job_index, name, email, role_applied, status, match_score]
    [0, "Priya Sharma",    "priya.sharma@gmail.com",   "Frontend Developer",  "shortlisted",          92],
    [0, "Rahul Verma",     "rahul.verma@gmail.com",    "Frontend Developer",  "reviewing",            78],
    [0, "Sneha Patel",     "sneha.patel@gmail.com",    "Frontend Developer",  "new",                  65],
    [1, "Ankit Gupta",     "ankit.gupta@gmail.com",    "Backend Engineer",    "interview_scheduled",  88],
    [1, "Divya Nair",      "divya.nair@gmail.com",     "Backend Engineer",    "shortlisted",          81],
    [1, "Karan Singh",     "karan.singh@gmail.com",    "Backend Engineer",    "rejected",             45],
    [2, "Meera Iyer",      "meera.iyer@gmail.com",     "Product Manager",     "reviewing",            74],
    [2, "Vikram Joshi",    "vikram.joshi@gmail.com",   "Product Manager",     "new",                  69],
    [3, "Aisha Khan",      "aisha.khan@gmail.com",     "ML Engineer",         "shortlisted",          95],
    [3, "Rohan Desai",     "rohan.desai@gmail.com",    "ML Engineer",         "interview_scheduled",  87],
  ];

  const appIds = [];
  for (const [ji, name, email, role, status, score] of candidates) {
    await sql.query(`
      INSERT INTO applications (job_id, startup_id, candidate_name, candidate_email, role_applied, status, match_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [jobIds[ji], startupId, name, email, role, status, score]);
  }

  const appRows = await sql.query(
    `SELECT id, candidate_name FROM applications WHERE startup_id = $1 ORDER BY id`, [startupId]
  );
  appRows.forEach(a => appIds.push(a.id));
  console.log(`✅ Applications: ${appRows.length} candidates`);

  // --------------------------------------------------
  // 4. Interviews
  // --------------------------------------------------
  // Only for applications with status interview_scheduled (indices 3 and 9 → appIds[3], appIds[9])
  const interviewData = [
    [appIds[3],  "Technical Interview (Round 1)", ["Karthik Rao", "Priyanka M"], "google_meet", "2026-03-25", "10:00 AM - 11:00 AM", "Focus on Node.js, SQL, system design."],
    [appIds[9],  "Technical Interview (Round 1)", ["Neha Bhatia", "Suresh P"],   "zoom",        "2026-03-26", "02:00 PM - 03:00 PM", "Deep dive into ML fundamentals and past projects."],
  ];

  for (const [appId, itype, interviewers, platform, date, slot, notes] of interviewData) {
    await sql.query(`
      INSERT INTO interviews (application_id, startup_id, interview_type, interviewers, platform, scheduled_date, time_slot, notes, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'scheduled')
    `, [appId, startupId, itype, interviewers, platform, date, slot, notes]);
  }

  const ivRows = await sql.query(
    `SELECT id FROM interviews WHERE startup_id = $1`, [startupId]
  );
  console.log(`✅ Interviews: ${ivRows.length} scheduled`);

  console.log("\n🎉 Seed complete!");
  console.log("   Login: demo@nexaai.com / password123");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
