const { query } = require('../config/database');

(async () => {
  try {
    const students = await query("SELECT COUNT(*)::int AS c FROM students WHERE email LIKE 'mock.student%@example.dev'");
    const applications = await query("SELECT COUNT(*)::int AS c FROM applications WHERE candidate_email LIKE 'mock.student%@example.dev'");
    console.log(`mock_students=${students[0]?.c || 0}`);
    console.log(`mock_applications=${applications[0]?.c || 0}`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
