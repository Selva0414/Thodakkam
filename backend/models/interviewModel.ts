import { sql } from "../config/database";

const InterviewModel = {
  async create({
    application_id,
    startup_id,
    job_id,
    round_type,
    interview_type,
    interviewer_ids,
    interviewers,
    platform,
    meet_link,
    office_location,
    scheduled_date,
    time_slot,
    notes,
    status,
    scheduled_at,
    duration,
  }: any) {
    const result = await sql`
      INSERT INTO interviews (
        application_id,
        startup_id,
        job_id,
        round_type,
        interview_type,
        interviewer_ids,
        interviewers,
        platform,
        meet_link,
        office_location,
        scheduled_date,
        time_slot,
        notes,
        status,
        scheduled_at,
        duration
      )
      VALUES (
        ${application_id},
        ${startup_id},
        ${job_id || null},
        ${round_type || null},
        ${interview_type},
        ${interviewer_ids || null},
        ${interviewers || []},
        ${platform || 'google_meet'},
        ${meet_link || null},
        ${office_location || null},
        ${scheduled_date},
        ${time_slot},
        ${notes || null},
        ${status || "scheduled"},
        ${scheduled_at || null},
        ${duration || 30}
      )
      RETURNING *
    `;
    return result[0];
  },

  async findByStartup(startup_id: number | string) {
    return await sql`
      SELECT
        i.*,
        COALESCE(a.candidate_name, '') AS candidate_name,
        COALESCE(a.candidate_email, '') AS candidate_email,
        COALESCE(s.profile_photo, '') AS avatar_url,
        COALESCE(a.role_applied, '') AS role_applied,
        a.status AS application_status,
        s.phone AS student_phone,
        s.location AS student_location,
        s.bio AS student_bio,
        s.skills AS student_skills,
        s.resume_file AS student_resume
      FROM interviews i
      LEFT JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN students s ON s.id::text = a.student_id::text
      WHERE i.startup_id::text = ${String(startup_id)}
      ORDER BY i.scheduled_date ASC, i.time_slot ASC
    `;
  },

  async findById(id: number | string) {
    const result = await sql`
      SELECT i.*, a.candidate_name, a.candidate_email, s.profile_photo as avatar_url,
             a.status AS application_status,
             s.phone as student_phone, s.location as student_location, s.bio as student_bio,
             s.skills as student_skills, s.resume_file as student_resume
      FROM interviews i
      JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN students s ON s.id::text = a.student_id::text
      WHERE i.id = ${id}
    `;
    return result[0] || null;
  },

  async updateStatus(id: number | string, status: string) {
    const normalizedStatus = status.toLowerCase();
    const result = await sql`
      UPDATE interviews SET status = ${normalizedStatus} WHERE id = ${id} RETURNING *
    `;
    return result[0];
  },
};

export default InterviewModel;
