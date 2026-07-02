const { query } = require('../config/database');

(async () => {
  try {
    console.log('Backfilling applications.student_id from students.email ...');

    const hasStudentId = await query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'student_id'
      LIMIT 1
    `);

    if (!hasStudentId[0]) {
      console.log('applications.student_id does not exist in this schema. Skipping backfill.');
      process.exit(0);
    }

    const before = await query(`
      SELECT COUNT(*)::int AS c
      FROM applications
      WHERE student_id IS NULL
    `);

    await query(`
      UPDATE applications a
      SET student_id = s.id
      FROM students s
      WHERE a.student_id IS NULL
        AND a.candidate_email IS NOT NULL
        AND LOWER(a.candidate_email) = LOWER(s.email)
    `);

    const after = await query(`
      SELECT COUNT(*)::int AS c
      FROM applications
      WHERE student_id IS NULL
    `);

    console.log(`null_student_id_before=${before[0]?.c || 0}`);
    console.log(`null_student_id_after=${after[0]?.c || 0}`);
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exit(1);
  }
})();
