/**
 * Seed script — inserts mock data for startup portal demo.
 * Run: node utils/seedData.js
 *
 * Demo login: alice@technova.io / Password123!
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

async function seedMasterAdmin() {
  const adminName = process.env.MASTER_ADMIN_NAME || "Master Admin";
  const email = process.env.MASTER_ADMIN_EMAIL || "admin@startup.local";
  const password = process.env.MASTER_ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 10);

  const safeAdminName = escapeLiteral(adminName);
  const safeEmail = escapeLiteral(email);
  const safePasswordHash = escapeLiteral(passwordHash);

  const rows = await sql.query(`
    INSERT INTO master_admins (admin_name, email, password_hash, is_verified)
    VALUES ('${safeAdminName}', '${safeEmail}', '${safePasswordHash}', true)
    ON CONFLICT (email)
    DO UPDATE SET
      admin_name = EXCLUDED.admin_name,
      password_hash = EXCLUDED.password_hash,
      is_verified = true
    RETURNING id, email
  `);

  const admin = rows[0];
  console.log(`✅  Master admin seeded (id=${admin.id}, email=${admin.email})`);
  console.log(`   Login → ${email} / ${password}`);
}

async function seed() {
  console.log("🌱  Seeding mock data...\n");

  // ── 0. Master Admin ────────────────────────────────────────────────────────
  await seedMasterAdmin();

  // ── 1. Startup ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const startupRows = await sql.query(`
    INSERT INTO startups (founder_name, company_name, company_reg_id, email, password_hash, category, is_verified)
    VALUES ('Alice Johnson', 'TechNova', 'REG-TN-2024', 'alice@technova.io', '${passwordHash}', 'tech', true)
    ON CONFLICT (email) DO UPDATE SET
      founder_name = EXCLUDED.founder_name,
      company_name = EXCLUDED.company_name,
      company_reg_id = EXCLUDED.company_reg_id,
      password_hash = EXCLUDED.password_hash,
      category = EXCLUDED.category,
      is_verified = true,
      updated_at = NOW()
    RETURNING id
  `);
  const startupId = startupRows[0].id;
  console.log(`✅  Startup inserted  (id=${startupId})`);

  // ── 2. Jobs ──────────────────────────────────────────────────────────────────
  const jobsResult = await sql.query(`
    INSERT INTO jobs (startup_id, title, department, emp_type, location, sal_min, sal_max, description, remote, status)
    VALUES
      (${startupId}, 'Frontend Developer Intern', 'Engineering', 'Internship', 'Bangalore', 15000, 25000,
       'Build beautiful, responsive UIs using React and TailwindCSS. Work closely with the design team.', true, 'active'),
      (${startupId}, 'Backend Engineer', 'Engineering', 'Full-time', 'Bangalore', 60000, 90000,
       'Design and maintain RESTful APIs using Node.js and PostgreSQL. Own backend microservices end-to-end.', false, 'active'),
      (${startupId}, 'ML Research Intern', 'AI/ML', 'Internship', 'Remote', 20000, 30000,
       'Assist in training and evaluating NLP models. PyTorch experience preferred.', true, 'paused')
    RETURNING id, title
  `);
  const [jobFE, jobBE, jobML] = jobsResult;
  console.log(`✅  Jobs inserted     (${jobsResult.map(j => j.title).join(", ")})`);

  // ── 3. Applications ──────────────────────────────────────────────────────────
  const appsResult = await sql.query(`
    INSERT INTO applications (job_id, startup_id, candidate_name, candidate_email, role_applied, status, match_score, avatar_url)
    VALUES
      -- Frontend job
      (${jobFE.id}, ${startupId}, 'Riya Sharma',    'riya@example.com',    'Frontend Developer Intern', 'shortlisted',          88, 'https://api.dicebear.com/7.x/initials/svg?seed=RS'),
      (${jobFE.id}, ${startupId}, 'Karan Mehta',    'karan@example.com',   'Frontend Developer Intern', 'interview_scheduled',  92, 'https://api.dicebear.com/7.x/initials/svg?seed=KM'),
      (${jobFE.id}, ${startupId}, 'Priya Nair',     'priya@example.com',   'Frontend Developer Intern', 'new',                  74, 'https://api.dicebear.com/7.x/initials/svg?seed=PN'),
      (${jobFE.id}, ${startupId}, 'Arjun Das',      'arjun@example.com',   'Frontend Developer Intern', 'rejected',             55, 'https://api.dicebear.com/7.x/initials/svg?seed=AD'),
      -- Backend job
      (${jobBE.id}, ${startupId}, 'Sneha Kapoor',   'sneha@example.com',   'Backend Engineer',          'reviewing',            81, 'https://api.dicebear.com/7.x/initials/svg?seed=SK'),
      (${jobBE.id}, ${startupId}, 'Vikram Singh',   'vikram@example.com',  'Backend Engineer',          'shortlisted',          90, 'https://api.dicebear.com/7.x/initials/svg?seed=VS'),
      (${jobBE.id}, ${startupId}, 'Ananya Iyer',    'ananya@example.com',  'Backend Engineer',          'hired',                97, 'https://api.dicebear.com/7.x/initials/svg?seed=AI'),
      -- ML job
      (${jobML.id}, ${startupId}, 'Rohan Verma',    'rohan@example.com',   'ML Research Intern',        'new',                  68, 'https://api.dicebear.com/7.x/initials/svg?seed=RV'),
      (${jobML.id}, ${startupId}, 'Meera Pillai',   'meera@example.com',   'ML Research Intern',        'shortlisted',          85, 'https://api.dicebear.com/7.x/initials/svg?seed=MP')
    RETURNING id, candidate_name, status
  `);
  console.log(`✅  Applications inserted (${appsResult.length} candidates)`);

  // Find application IDs for interview_scheduled / shortlisted candidates
  const karanApp  = appsResult.find(a => a.candidate_name === "Karan Mehta");
  const vikramApp = appsResult.find(a => a.candidate_name === "Vikram Singh");
  const riyaApp   = appsResult.find(a => a.candidate_name === "Riya Sharma");
  const meeraApp  = appsResult.find(a => a.candidate_name === "Meera Pillai");

  // ── 4. Interviews ────────────────────────────────────────────────────────────
  await sql.query(`
    INSERT INTO interviews (application_id, startup_id, interview_type, interviewers, platform, scheduled_date, time_slot, notes, status)
    VALUES
      (${karanApp.id},  ${startupId}, 'Technical Interview (Round 1)', ARRAY['Alice Johnson','Bob Lee'],   'google_meet', CURRENT_DATE + 2, '10:00 AM - 11:00 AM', 'Focus on React hooks and state management.', 'scheduled'),
      (${vikramApp.id}, ${startupId}, 'System Design Interview',       ARRAY['Alice Johnson'],             'zoom',        CURRENT_DATE + 3, '02:00 PM - 03:00 PM', 'Cover REST API design and DB indexing.', 'scheduled'),
      (${riyaApp.id},   ${startupId}, 'HR Round',                      ARRAY['Carol White'],               'google_meet', CURRENT_DATE + 5, '11:00 AM - 11:30 AM', 'Culture fit and compensation discussion.', 'scheduled'),
      (${meeraApp.id},  ${startupId}, 'Technical Interview (Round 1)', ARRAY['Alice Johnson','Dan Brown'],  'office',      CURRENT_DATE + 1, '09:00 AM - 10:00 AM', 'Discuss ML project experience and PyTorch.', 'scheduled')
  `);
  console.log(`✅  Interviews inserted  (4 upcoming)`);

  console.log("\n🎉  Seed complete!");
  console.log("   Demo login → alice@technova.io / Password123!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
