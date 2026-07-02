import { query } from "../config/database";

const createApplication = async (applicationData: any) => {
  const { job_id, student_id, role_applied, candidate_name, candidate_email, candidate_phone, resume_url, screening_answers } =
    applicationData;

  // Fetch startup_id from the jobs table to ensure it's correct
  const jobResult = await query("SELECT startup_id FROM jobs WHERE id = $1", [job_id]);
  if (!jobResult || jobResult.length === 0) {
    throw new Error("Job not found or invalid job_id");
  }

  // Explicitly use the startup_id from the job listing
  const target_startup_id = jobResult[0].startup_id;

  const result = await query(
    `INSERT INTO applications (job_id, student_id, startup_id, role_applied, candidate_name, student_name, candidate_email, candidate_phone, resume_url, screening_answers, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [job_id, student_id, target_startup_id, role_applied, candidate_name, candidate_name, candidate_email, candidate_phone, resume_url, screening_answers ? JSON.stringify(screening_answers) : null, "new"]
  );
  return result[0];
};

const getApplicationsByStudent = async (studentId: number | string) => {
  return await query(
    `SELECT a.*, COALESCE(NULLIF(j.title, ''), a.role_applied, 'Untitled Role') AS role_applied,
            s.company_name,
            COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo
     FROM applications a
     LEFT JOIN jobs j ON j.id::text = a.job_id::text
     LEFT JOIN startups s ON s.id::text = a.startup_id::text
     LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
     WHERE a.student_id = $1
     ORDER BY a.applied_at DESC`,
    [studentId]
  );
};

const updateStatus = async (id: number | string, status: string) => {
  const result = await query(
    "UPDATE applications SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result[0] || null;
};

const getApplicationDetails = async (id: number | string) => {
  const result = await query(`
    SELECT 
      a.*,
      j.title as job_title,
      j.description as job_description,
      j.location as job_location,
      j.emp_type as job_type,
      s.company_name,
      COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo,
      (
        SELECT a2.rounds
        FROM candidate_assessments ca
        JOIN assessments a2 ON a2.id = ca.assessment_id
        WHERE ca.application_id::text = a.id::text
        ORDER BY ca.id DESC
        LIMIT 1
      ) AS assessment_rounds
    FROM applications a
    LEFT JOIN jobs j ON a.job_id::text = j.id::text
    LEFT JOIN startups s ON a.startup_id::text = s.id::text
    LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
    WHERE a.id::text = $1
  `, [String(id)]);
  return result[0] || null;
};

export { createApplication, getApplicationsByStudent, updateStatus, getApplicationDetails };
