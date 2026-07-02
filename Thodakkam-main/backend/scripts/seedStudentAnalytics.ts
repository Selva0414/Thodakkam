import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function sql(strings: TemplateStringsArray, ...values: any[]) {
  let text = "";
  strings.forEach((s, i) => { text += s; if (i < values.length) text += `$${i + 1}`; });
  const result = await pool.query(text, values);
  return result.rows;
}

async function seedAllStudents() {
  console.log("🌱 Universal Analytics Seeding - Populating for all students...");

  // 1. Get all students
  const students = await sql`SELECT id, name, email FROM students LIMIT 50`;
  
  if (students.length === 0) {
    console.log("⚠️ No students found.");
    process.exit(1);
  }
  
  console.log(`✅ Found ${students.length} students to seed.`);

  // 2. Ensure some startups and jobs exist
  console.log("🏢 Ensuring startups and jobs exist...");
  const startupRows = await sql`
    INSERT INTO startups (founder_name, company_name, company_reg_id, email, password_hash, category, is_verified, status)
    VALUES 
      ('Alice Tech', 'FinTech Solutions', 'REG-FS-001', 'hr@fintech.io', 'hash', 'fintech', true, 'ACTIVE'),
      ('Bob AI', 'Visionary AI', 'REG-VA-002', 'careers@visionary.ai', 'hash', 'tech', true, 'ACTIVE'),
      ('Charlie Dev', 'Code Crafters', 'REG-CC-003', 'jobs@codecrafters.io', 'hash', 'tech', true, 'ACTIVE'),
      ('Diana Marketeer', 'Brand Booster', 'REG-BB-004', 'hiring@brandbooster.com', 'hash', 'edtech', true, 'ACTIVE')
    ON CONFLICT (email) DO UPDATE SET is_verified = true, status = 'ACTIVE'
    RETURNING id
  `;

  const jobsData = [
    { title: 'Frontend Developer', domain: 'Development', startup_id: startupRows[0].id },
    { title: 'Backend Engineer', domain: 'Development', startup_id: startupRows[1].id },
    { title: 'Data Scientist', domain: 'AI/ML', startup_id: startupRows[1].id },
    { title: 'Financial Analyst', domain: 'Finance', startup_id: startupRows[0].id },
    { title: 'Digital Marketer', domain: 'Marketing', startup_id: startupRows[3].id },
    { title: 'ML Researcher', domain: 'AI/ML', startup_id: startupRows[2].id },
    { title: 'Full Stack Engineer', domain: 'Development', startup_id: startupRows[2].id },
    { title: 'Product Manager', domain: 'Management', startup_id: startupRows[3].id },
  ];

  const jobIds = [];
  for (const j of jobsData) {
    const [job] = await sql`
      INSERT INTO jobs (startup_id, title, department, emp_type, location, sal_min, sal_max, description, remote, status, domain)
      VALUES (${j.startup_id}, ${j.title}, 'Engineering', 'Full-time', 'Bangalore', 10, 20, 'Seed job', true, 'active', ${j.domain})
      RETURNING id
    `;
    jobIds.push({ id: job.id, ...j });
  }

  // 3. Loop through students and generate data
  for (const student of students) {
    const sid = student.id;
    console.log(`🚀 Seeding applications for: ${student.name} (ID: ${sid})...`);
    
    // Clear old data for a fresh demo
    await sql`DELETE FROM applications WHERE student_id::text = ${String(sid)}`;

    const statuses = ['applied', 'shortlisted', 'shortlisted', 'interview_scheduled', 'interview_scheduled', 'selected', 'hired', 'rejected', 'rejected'];
    const monthsAgoArr = [0, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
    
    // Each student gets between 5 and 15 applications
    const count = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
        const job = jobIds[i % jobIds.length];
        const status = statuses[i % statuses.length];
        const monthsAgo = monthsAgoArr[i % monthsAgoArr.length];
        
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        date.setDate(1 + (i % 28));

        await sql`
        INSERT INTO applications (job_id, startup_id, student_id, candidate_name, candidate_email, role_applied, status, match_score, applied_at)
        VALUES (${job.id}, ${job.startup_id}, ${sid}, ${student.name}, ${student.email || 'test@example.com'}, ${job.title}, ${status}, ${70 + (i % 25)}, ${date})
        `;
    }

    // Add 1-2 interviews for each student
    const apps = await sql`SELECT id, startup_id FROM applications WHERE student_id::text = ${String(sid)} AND status IN ('interview_scheduled', 'shortlisted') LIMIT 2`;
    for (const app of apps) {
        await sql`
        INSERT INTO interviews (application_id, startup_id, round_type, interview_type, scheduled_date, time_slot, status)
        VALUES (${String(app.id)}, ${String(app.startup_id)}, 'Technical Round 1', 'Video Call', CURRENT_DATE + 3, '10:00 AM', 'scheduled')
        `;
    }
  }

  console.log("\n✅ All students have been seeded with analytics data!");
}

seedAllStudents().catch(err => {
  console.error("❌ Universal Seeding failed:", err.message);
  process.exit(1);
});
