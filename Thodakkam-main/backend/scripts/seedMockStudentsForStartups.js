const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function getStudentColumns() {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'students'`
  );
  return new Set(rows.map(r => r.column_name));
}

async function getApplicationColumns() {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'applications'`
  );
  return new Set(rows.map(r => r.column_name));
}

async function getJobColumns() {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'jobs'`
  );
  return new Set(rows.map(r => r.column_name));
}

function buildMockStudents() {
  const firstNames = [
    'Arjun', 'Nila', 'Vikram', 'Sahana', 'Karthik', 'Meera', 'Rohit', 'Divya', 'Pranav',
    'Ananya', 'Yuvan', 'Keerthi', 'Aditya', 'Pavithra', 'Surya', 'Harini', 'Ashwin', 'Lavanya'
  ];
  const roles = [
    'Frontend Developer', 'Backend Developer', 'UI Designer', 'Data Analyst', 'QA Engineer',
    'DevOps Intern', 'Product Analyst', 'ML Intern', 'Mobile Developer'
  ];

  return firstNames.map((name, idx) => {
    const n = idx + 1;
    const role = roles[idx % roles.length];
    const email = `mock.student${n}@example.dev`;
    return {
      name: `${name} Mock`,
      username: `mock_student_${n}`,
      email,
      phone: `90000${String(1000 + n)}`,
      location: idx % 2 === 0 ? 'Chennai' : 'Bengaluru',
      role,
      skills: ['JavaScript', 'React', 'Node.js', 'SQL'].slice(0, 2 + (idx % 3)),
      profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(name + ' Mock')}&background=F1F5F9&color=334155`
    };
  });
}

async function insertStudents(students, studentCols) {
  const inserted = [];
  const hashed = await bcrypt.hash('Student@123', 10);

  for (const s of students) {
    const cols = [];
    const vals = [];
    const params = [];

    const push = (col, val) => {
      cols.push(col);
      vals.push(val);
      params.push(`$${vals.length}`);
    };

    if (studentCols.has('name')) push('name', s.name);
    if (studentCols.has('full_name')) push('full_name', s.name);
    if (studentCols.has('username')) push('username', s.username);
    if (studentCols.has('email')) push('email', s.email);
    if (studentCols.has('password')) push('password', hashed);
    if (studentCols.has('phone')) push('phone', s.phone);
    if (studentCols.has('location')) push('location', s.location);
    if (studentCols.has('profile_photo')) push('profile_photo', s.profilePhoto);
    if (studentCols.has('skills')) push('skills', JSON.stringify(s.skills));
    if (studentCols.has('role')) push('role', s.role);
    if (studentCols.has('status')) push('status', 'Active');

    if (!studentCols.has('email')) {
      throw new Error('students.email column is required for idempotent seed');
    }

    const sql = `
      INSERT INTO students (${cols.join(', ')})
      VALUES (${params.join(', ')})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email;
    `;

    const rows = await query(sql, vals);
    if (rows.length > 0) {
      inserted.push(rows[0]);
    } else {
      const fallback = await query('SELECT id, email FROM students WHERE email = $1 LIMIT 1', [s.email]);
      if (fallback[0]) inserted.push(fallback[0]);
    }
  }

  return inserted;
}

async function ensureJobForStartup(startupId, jobCols) {
  const existing = await query(
    `SELECT id FROM jobs WHERE startup_id = $1 ORDER BY created_at DESC NULLS LAST, id DESC LIMIT 1`,
    [startupId]
  );
  if (existing[0]) return existing[0].id;

  const cols = [];
  const vals = [];
  const params = [];
  const push = (col, val) => {
    cols.push(col);
    vals.push(val);
    params.push(`$${vals.length}`);
  };

  push('startup_id', startupId);
  if (jobCols.has('title')) push('title', 'Mock Internship Role');
  if (jobCols.has('department')) push('department', 'Engineering');
  if (jobCols.has('emp_type')) push('emp_type', 'Internship');
  if (jobCols.has('location')) push('location', 'Remote');
  if (jobCols.has('description')) push('description', 'Auto-generated mock job for startup candidate seeding.');
  if (jobCols.has('remote')) push('remote', true);
  if (jobCols.has('status')) push('status', 'active');

  const created = await query(
    `INSERT INTO jobs (${cols.join(', ')}) VALUES (${params.join(', ')}) RETURNING id`,
    vals
  );

  return created[0].id;
}

async function attachApplicationsForAllStartups(studentRows, appCols, jobCols, studentCols) {
  const startups = await query('SELECT id FROM startups ORDER BY id ASC');
  const studentIds = studentRows.map(r => Number(r.id)).filter(Number.isFinite);
  const selected = studentIds.slice(0, 15);

  if (selected.length < 15) {
    throw new Error('Not enough students to attach 15 per startup');
  }

  let insertedCount = 0;

  for (const s of startups) {
    const startupId = Number(s.id);
    const jobId = await ensureJobForStartup(startupId, jobCols);

    for (const studentId of selected) {
      const studentSelectCols = ['id', 'email'];
      if (studentCols.has('name')) studentSelectCols.push('name');
      if (studentCols.has('full_name')) studentSelectCols.push('full_name');
      if (studentCols.has('profile_photo')) studentSelectCols.push('profile_photo');

      const student = await query(
        `SELECT ${studentSelectCols.join(', ')} FROM students WHERE id = $1 LIMIT 1`,
        [studentId]
      );
      if (!student[0]) continue;

      const candidateName = student[0].name || student[0].full_name || `Student ${studentId}`;
      const candidateEmail = student[0].email || `student${studentId}@example.dev`;

      const existing = await query(
        'SELECT id FROM applications WHERE startup_id = $1 AND candidate_email = $2 LIMIT 1',
        [startupId, candidateEmail]
      );
      if (existing[0]) continue;

      const cols = [];
      const vals = [];
      const params = [];
      const push = (col, val) => {
        cols.push(col);
        vals.push(val);
        params.push(`$${vals.length}`);
      };

      push('job_id', jobId);
      push('startup_id', startupId);
      if (appCols.has('candidate_name')) push('candidate_name', candidateName);
      if (appCols.has('candidate_email')) push('candidate_email', candidateEmail);
      if (appCols.has('avatar_url')) push('avatar_url', student[0].profile_photo || null);
      if (appCols.has('role_applied')) push('role_applied', 'Software Intern');
      if (appCols.has('status')) push('status', 'new');
      if (appCols.has('match_score')) push('match_score', 70 + (studentId % 25));
      if (appCols.has('resume_url')) push('resume_url', `/uploads/mock/resume_${studentId}.pdf`);

      await query(
        `INSERT INTO applications (${cols.join(', ')}) VALUES (${params.join(', ')})`,
        vals
      );
      insertedCount += 1;
    }
  }

  return { startupCount: startups.length, insertedCount };
}

async function run() {
  try {
    console.log('Seeding 18 mock students and linking 15+ to startup candidate data...');

    const studentCols = await getStudentColumns();
    const appCols = await getApplicationColumns();
    const jobCols = await getJobColumns();

    const mockStudents = buildMockStudents();
    const rows = await insertStudents(mockStudents, studentCols);
    const linked = await attachApplicationsForAllStartups(rows, appCols, jobCols, studentCols);

    console.log(`Students upserted: ${rows.length}`);
    console.log(`Startups processed: ${linked.startupCount}`);
    console.log(`Applications inserted: ${linked.insertedCount}`);
    console.log('Done. You should now see 15+ candidate entries under startup login.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

run();
