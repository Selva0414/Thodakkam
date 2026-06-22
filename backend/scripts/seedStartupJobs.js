const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.DATABASE_URL);

const TARGET_JOBS = 20;
const TARGET_APPLICATIONS = 20;

const ROLES = [
  "Frontend Developer",
  "Backend Engineer",
  "Product Designer",
  "Data Analyst",
  "QA Engineer",
  "DevOps Engineer",
  "Mobile Developer",
  "AI Engineer",
  "UI Designer",
  "Technical Recruiter",
  "Business Analyst",
  "Growth Marketer",
  "Content Strategist",
  "Project Coordinator",
  "Security Analyst",
  "Cloud Engineer",
  "Support Engineer",
  "Product Manager",
  "Research Intern",
  "Operations Associate",
];

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Analytics",
  "Operations",
  "Marketing",
  "Security",
];

const EMP_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const LOCATIONS = ["Chennai", "Bangalore", "Hyderabad", "Remote", "Pune", "Coimbatore"];

const CANDIDATE_NAMES = [
  "Arun Kumar",
  "Bhavya R",
  "Charan M",
  "Deepa N",
  "Eswar P",
  "Farah S",
  "Gokul V",
  "Harini K",
  "Irfan A",
  "Jeeva R",
  "Karthik B",
  "Lavanya S",
  "Manoj T",
  "Nisha P",
  "Omkar J",
  "Pavithra M",
  "Qadir H",
  "Ritika D",
  "Sanjay K",
  "Tejaswini R",
  "Uday V",
  "Varsha N",
  "Wasim A",
  "Xavier D",
  "Yamini K",
  "Zubair M",
];

const APP_STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "interview_scheduled",
  "rejected",
  "hired",
];

const INTERVIEWERS = [
  ["Anand R", "Maya S"],
  ["Priya K", "Vignesh M"],
  ["Sathish P", "Nandhini R"],
  ["Rahul T", "Sneha V"],
];

function makeJob(index) {
  const role = ROLES[index % ROLES.length];
  const department = DEPARTMENTS[index % DEPARTMENTS.length];
  const empType = EMP_TYPES[index % EMP_TYPES.length];
  const location = LOCATIONS[index % LOCATIONS.length];

  let status = "active";
  if (index % 7 === 0) status = "closed";
  else if (index % 5 === 0) status = "draft";

  const salMin = 300000 + index * 15000;
  const salMax = salMin + 250000;

  return {
    title: `${role} ${index + 1}`,
    department,
    emp_type: empType,
    location,
    sal_min: salMin,
    sal_max: salMax,
    description: `We are hiring ${role.toLowerCase()}s to build high-impact products and collaborate across teams.`,
    remote: index % 2 === 0,
    status,
  };
}

function makeCandidate(index) {
  const name = CANDIDATE_NAMES[index % CANDIDATE_NAMES.length];
  const suffix = String(index + 1).padStart(2, "0");

  return {
    candidate_name: `${name} ${suffix}`,
    candidate_email: `candidate${suffix}@startupdemo.dev`,
    status: APP_STATUSES[index % APP_STATUSES.length],
    match_score: 58 + ((index * 7) % 41),
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(`${name}${suffix}`)}`,
    applied_days_ago: index % 18,
  };
}

function parseEmailArg() {
  const arg = process.argv.find((a) => a.startsWith("--email="));
  if (!arg) return process.env.STARTUP_EMAIL || null;
  return arg.split("=")[1];
}

async function getTargetStartup(email) {
  if (email) {
    const rows = await sql.query(
      "SELECT id, company_name, email FROM startups WHERE email = $1 LIMIT 1",
      [email]
    );
    return rows[0] || null;
  }

  const rows = await sql.query(
    "SELECT id, company_name, email FROM startups WHERE email IS NOT NULL ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function seedStartupJobs() {
  const targetEmail = parseEmailArg();

  try {
    const startup = await getTargetStartup(targetEmail);
    if (!startup) {
      console.error("No matching startup found. Pass --email=<startup-email>.");
      process.exit(1);
    }

    console.log(`Seeding jobs for startup ${startup.company_name || "(unknown)"} <${startup.email}> (id=${startup.id})`);

    const existingJobs = await sql.query(
      "SELECT id, title, status FROM jobs WHERE startup_id = $1 ORDER BY id ASC",
      [startup.id]
    );

    const existingJobTitles = new Set(existingJobs.map((j) => j.title));
    const jobsToInsert = [];
    for (let i = 0; i < TARGET_JOBS; i += 1) {
      const job = makeJob(i);
      if (!existingJobTitles.has(job.title)) {
        jobsToInsert.push(job);
      }
    }

    for (const job of jobsToInsert) {
      await sql.query(
        `
          INSERT INTO jobs (startup_id, title, department, emp_type, location, sal_min, sal_max, description, remote, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          startup.id,
          job.title,
          job.department,
          job.emp_type,
          job.location,
          job.sal_min,
          job.sal_max,
          job.description,
          job.remote,
          job.status,
        ]
      );
    }

    const jobs = await sql.query(
      "SELECT id, title, status FROM jobs WHERE startup_id = $1 ORDER BY id ASC",
      [startup.id]
    );

    const existingApps = await sql.query(
      "SELECT id, candidate_email FROM applications WHERE startup_id = $1 ORDER BY id ASC",
      [startup.id]
    );
    const existingEmails = new Set(existingApps.map((a) => a.candidate_email));

    const applicationsToInsert = [];
    for (let i = 0; i < TARGET_APPLICATIONS; i += 1) {
      const candidate = makeCandidate(i);
      if (!existingEmails.has(candidate.candidate_email)) {
        applicationsToInsert.push(candidate);
      }
    }

    for (let i = 0; i < applicationsToInsert.length; i += 1) {
      const app = applicationsToInsert[i];
      const job = jobs[i % jobs.length];
      await sql.query(
        `
          INSERT INTO applications (
            job_id, startup_id, candidate_name, candidate_email, role_applied,
            status, match_score, avatar_url, applied_at
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, NOW() - ($9 || ' days')::interval
          )
        `,
        [
          job.id,
          startup.id,
          app.candidate_name,
          app.candidate_email,
          job.title,
          app.status,
          app.match_score,
          app.avatar_url,
          app.applied_days_ago,
        ]
      );
    }

    const interviewCandidates = await sql.query(
      `
        SELECT a.id
        FROM applications a
        LEFT JOIN interviews i ON i.application_id = a.id
        WHERE a.startup_id = $1 AND a.status = 'interview_scheduled' AND i.id IS NULL
        ORDER BY a.id ASC
      `,
      [startup.id]
    );

    for (let i = 0; i < interviewCandidates.length; i += 1) {
      const app = interviewCandidates[i];
      const interviewers = INTERVIEWERS[i % INTERVIEWERS.length];
      const platform = i % 2 === 0 ? "google_meet" : "zoom";
      const timeSlot = i % 2 === 0 ? "10:00 AM - 11:00 AM" : "02:00 PM - 03:00 PM";
      await sql.query(
        `
          INSERT INTO interviews (
            application_id, startup_id, interview_type, interviewers,
            platform, scheduled_date, time_slot, notes, status
          )
          VALUES (
            $1, $2, 'Technical Interview (Round 1)', $3,
            $4, CURRENT_DATE + ($5 || ' days')::interval, $6, $7, 'scheduled'
          )
        `,
        [
          app.id,
          startup.id,
          interviewers,
          platform,
          (i % 10) + 1,
          timeSlot,
          'Auto-seeded interview for demo workflow.',
        ]
      );
    }

    const jobCounts = await sql.query(
      "SELECT status, count(*)::int AS count FROM jobs WHERE startup_id = $1 GROUP BY status ORDER BY status",
      [startup.id]
    );

    const appCounts = await sql.query(
      "SELECT status, count(*)::int AS count FROM applications WHERE startup_id = $1 GROUP BY status ORDER BY status",
      [startup.id]
    );

    const totalInterviews = await sql.query(
      "SELECT count(*)::int AS count FROM interviews WHERE startup_id = $1",
      [startup.id]
    );

    console.log(`Jobs total: ${jobs.length} (inserted ${jobsToInsert.length})`);
    console.log("Job status counts:", jobCounts);
    console.log(`Applications total: ${existingApps.length + applicationsToInsert.length} (inserted ${applicationsToInsert.length})`);
    console.log("Application status counts:", appCounts);
    console.log(`Interviews total: ${totalInterviews[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed startup jobs:", error.message);
    process.exit(1);
  }
}

seedStartupJobs();
