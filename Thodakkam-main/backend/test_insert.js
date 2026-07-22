const { query } = require('./dist/config/database');

async function testInsert() {
  console.log("Testing insert...");
  try {
    const sqlQuery = `
      INSERT INTO students (
        name, username, email, password, phone, location, profile_photo, resume_file, 
        skills, educations, internships, website_url, github_url, linkedin_url, bio, referred_by, registration_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    const randomEmail = `test${Date.now()}@test.com`;
    const values = [
      "Test User", "testuser_" + Date.now(), randomEmail, "password123", "1234567890", "Test City", null, null,
      "[]", "[]", "[]", "http://test.com", "http://github.com", "http://linkedin.com", "Test bio", null, "web"
    ];

    const result = await query(sqlQuery, values);
    console.log("Insert successful:", result);
  } catch (err) {
    console.error("Insert failed:", err);
  }
  process.exit();
}

testInsert();
