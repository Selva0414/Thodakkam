import { query } from "../config/database";

const createStudent = async (studentData: any) => {
  const {
    name,
    username,
    email,
    password,
    phone,
    location,
    profilePhoto,
    resumeFile,
    selectedSkills,
    educations,
    internships,
    websiteUrl,
    githubUrl,
    linkedinUrl,
    bio,
    referredBy,
  } = studentData;

  const sqlQuery = `
    INSERT INTO students (
      name, username, email, password, phone, location, profile_photo, resume_file, 
      skills, educations, internships, website_url, github_url, linkedin_url, bio, referred_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;

  const values = [
    name,
    username,
    email,
    password,
    phone,
    location,
    profilePhoto,
    resumeFile,
    JSON.stringify(selectedSkills || []),
    JSON.stringify(educations || []),
    JSON.stringify(internships || []),
    websiteUrl,
    githubUrl,
    linkedinUrl,
    bio || "",
    referredBy || null,
  ];

  const result = await query(sqlQuery, values);
  return result[0];
};

const findStudentByEmail = async (email: string) => {
  const sqlQuery = `
    SELECT 
      id, name, username, email, password, 
      profile_photo
    FROM students 
    WHERE LOWER(email) = LOWER($1);
  `;
  const result = await query(sqlQuery, [email]);
  return result[0];
};

const findStudentByResetToken = async (hashedToken: string) => {
  const sqlQuery = `
    SELECT id, email, name, reset_password_expires 
    FROM students 
    WHERE reset_password_token = $1 AND reset_password_expires > NOW();
  `;
  const result = await query(sqlQuery, [hashedToken]);
  return result[0];
};

const findStudentById = async (id: number | string) => {
  const sqlQuery = `
    SELECT 
      id, name, username, email, phone, location, bio,
      profile_photo, resume_file, skills, educations, internships,
      website_url, github_url, linkedin_url,
      profile_views, post_impressions, created_at, resume_insights,
      referral_points,
      (SELECT COUNT(*)::int FROM students s2 WHERE s2.referred_by::text = students.id::text) AS referral_count
    FROM students 
    WHERE id = $1;
  `;
  const result = await query(sqlQuery, [id]);
  return result[0];
};

const findStudentByUsername = async (username: string) => {
  const sqlQuery = `SELECT * FROM students WHERE username = $1;`;
  const result = await query(sqlQuery, [username]);
  return result[0];
};

const searchStudents = async (pattern: string) => {
  const sqlQuery = `
    SELECT id, name, email, profile_photo as "profilePic", 'Candidate' as status, profile_views, post_impressions
    FROM students
    WHERE name ILIKE $1 OR email ILIKE $1
    LIMIT 20;
  `;
  return await query(sqlQuery, [`%${pattern}%`]);
};

const updateStudent = async (id: number | string, studentData: any) => {
  const {
    name,
    username,
    email,
    phone,
    location,
    profilePhoto,
    resumeFile,
    skills,
    educations,
    internships,
    website_url,
    github_url,
    linkedin_url,
    bio,
  } = studentData;

  const sqlQuery = `
    UPDATE students
    SET 
      name = $1, 
      username = $2, 
      email = $3, 
      phone = $4, 
      location = $5, 
      profile_photo = $6, 
      resume_file = $7, 
      skills = $8, 
      educations = $9, 
      internships = $10, 
      website_url = $11, 
      github_url = $12, 
      linkedin_url = $13,
      bio = $14
    WHERE id = $15
    RETURNING *;
  `;

  const values = [
    name,
    username,
    email,
    phone,
    location,
    profilePhoto,
    resumeFile,
    typeof skills === "string" ? skills : JSON.stringify(skills || []),
    typeof educations === "string" ? educations : JSON.stringify(educations || []),
    typeof internships === "string" ? internships : JSON.stringify(internships || []),
    website_url,
    github_url,
    linkedin_url,
    bio || "",
    id,
  ];

  const result = await query(sqlQuery, values);
  return result[0];
};

const updateStudentSkills = async (id: number | string, skills: any) => {
  const sqlQuery = `
    UPDATE students
    SET skills = $1
    WHERE id = $2
    RETURNING *;
  `;
  const values = [typeof skills === "string" ? skills : JSON.stringify(skills || []), id];
  const result = await query(sqlQuery, values);
  return result[0];
};

const updateResumeInsights = async (id: number | string, insights: string) => {
  const sqlQuery = `
    UPDATE students
    SET resume_insights = $1
    WHERE id = $2
    RETURNING *;
  `;
  const result = await query(sqlQuery, [insights, id]);
  return result[0];
};

const updateStudentResetToken = async (email: string, hashedToken: string | null, expiry: Date | null) => {
  const sqlQuery = `
    UPDATE students
    SET reset_password_token = $1, reset_password_expires = $2
    WHERE email = $3
    RETURNING id;
  `;
  const result = await query(sqlQuery, [hashedToken, expiry, email]);
  return result[0];
};

const updateStudentPassword = async (id: number | string, hashedPassword: string) => {
  const sqlQuery = `
    UPDATE students
    SET password = $1, reset_password_token = NULL, reset_password_expires = NULL
    WHERE id = $2
    RETURNING id;
  `;
  const result = await query(sqlQuery, [hashedPassword, id]);
  return result[0];
};

const findStudentWithPasswordById = async (id: number | string) => {
  const sqlQuery = `SELECT id, email, password FROM students WHERE id = $1;`;
  const result = await query(sqlQuery, [id]);
  return result[0];
};

export {
  createStudent,
  findStudentByEmail,
  findStudentById,
  findStudentByUsername,
  searchStudents,
  updateStudent,
  updateStudentSkills,
  updateResumeInsights,
  updateStudentResetToken,
  findStudentByResetToken,
  updateStudentPassword,
  findStudentWithPasswordById,
};
