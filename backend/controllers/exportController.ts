import { Request, Response } from "express";
import { query } from "../config/database";

const resolveStudentCols = async () => {
  const rows = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'students'`
  );
  const cols = new Set(rows.map((r: any) => r.column_name as string));
  return {
    roll:    cols.has("roll_number")      ? "roll_number"      : (cols.has("roll")      ? "roll"      : "NULL"),
    dept:    cols.has("department")       ? "department"       : (cols.has("dept")       ? "dept"       : "NULL"),
    startup: cols.has("assigned_startup") ? "assigned_startup" : (cols.has("startup")    ? "startup"    : "NULL"),
    joined:  cols.has("joined_at")        ? "joined_at"        : (cols.has("join_date")  ? "join_date"  : null),
    email:   cols.has("email")            ? "email"            : "NULL",
    educations: cols.has("educations"),
  };
};

/** Export all startups (optional status filter) */
export const exportStartups = async (req: Request, res: Response): Promise<any> => {
  try {
    const { status, from, to } = req.query;
    const values: any[] = [];
    const conditions: string[] = [];
    if (status && status !== "ALL") {
      values.push(String(status).toUpperCase());
      conditions.push(`UPPER(COALESCE(status, 'PENDING')) = $${values.length}`);
    }
    if (from) {
      values.push(String(from));
      conditions.push(`created_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(String(to));
      conditions.push(`created_at < ($${values.length}::date + interval '1 day')`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT
         COALESCE(company_name, '')       AS company_name,
         COALESCE(founder_name, '')       AS founder_name,
         COALESCE(email, '')              AS email,
         COALESCE(category, 'General')    AS category,
         COALESCE(status, 'PENDING')      AS status,
         COALESCE(location, '')           AS location,
         COALESCE(industry, '')           AS industry,
         COALESCE(company_size, '')       AS company_size,
         COALESCE(founded_year::text, '') AS founded_year,
         COALESCE(work_mode, '')          AS work_mode,
         COALESCE(company_website, '')    AS company_website,
         to_char(created_at, 'YYYY-MM-DD') AS registered_date
       FROM startups ${where} ORDER BY created_at DESC`,
      values
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e: any) {
    console.error("Export startups error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

/** Export all students (optional department + status filters) */
export const exportStudents = async (req: Request, res: Response): Promise<any> => {
  try {
    const { department, status, from, to } = req.query;
    const cols = await resolveStudentCols();
    const conditions: string[] = [];
    const values: any[] = [];

    if (department && department !== "all" && department !== "All Departments") {
      values.push(department);
      conditions.push(`s.${cols.dept} = $${values.length}`);
    }
    if (status && status !== "all") {
      values.push(String(status).toLowerCase());
      conditions.push(`LOWER(COALESCE(s.status, '')) = $${values.length}`);
    }
    if (from) {
      values.push(String(from));
      conditions.push(`s.created_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(String(to));
      conditions.push(`s.created_at < ($${values.length}::date + interval '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const joinExpr = cols.joined
      ? `COALESCE(s.${cols.joined}::text, to_char(s.created_at, 'YYYY-MM-DD'))`
      : `to_char(s.created_at, 'YYYY-MM-DD')`;

    // Degree: fallback to first education entry's degree if department column is empty.
    const degreeExpr = cols.educations
      ? `COALESCE(NULLIF(s.${cols.dept}::text, ''),
                  NULLIF((s.educations::jsonb->0->>'degree'), ''),
                  '')`
      : `COALESCE(s.${cols.dept}::text, '')`;

    // Roll number: if missing, derive a readable identifier from the email local-part
    // (e.g. "jaisuryajaisurya623@gmail.com" -> "JAISURYAJAISURYA623").
    const rollExpr = `COALESCE(NULLIF(s.${cols.roll}::text, ''),
                              UPPER(split_part(COALESCE(s.${cols.email}, ''), '@', 1)),
                              '')`;

    // Assigned startup: prefer stored column, else show company name of most recent ACCEPTED application.
    const startupExpr = `COALESCE(
        NULLIF(s.${cols.startup}::text, ''),
        (SELECT st.company_name
         FROM applications ap
         JOIN startups st ON st.id::text = ap.startup_id::text
         WHERE ap.student_id::text = s.id::text
         ORDER BY (CASE WHEN UPPER(ap.status) = 'ACCEPTED' THEN 0 ELSE 1 END), ap.created_at DESC
         LIMIT 1),
        ''
      )`;

    let rows: any[];
    try {
      rows = await query(
        `SELECT
           COALESCE(s.name, '')                   AS name,
           ${rollExpr}                            AS roll_number,
           ${degreeExpr}                          AS department,
           COALESCE(s.${cols.email}::text, '')    AS email,
           COALESCE(s.phone, '')                  AS phone,
           COALESCE(s.location, '')               AS location,
           COALESCE(s.status, '')                 AS status,
           ${startupExpr}                         AS assigned_startup,
           COALESCE(s.linkedin_url, '')           AS linkedin_url,
           COALESCE(s.github_url, '')             AS github_url,
           ${joinExpr}                            AS join_date
         FROM students s ${where} ORDER BY s.created_at DESC`,
        values
      );
    } catch (innerErr: any) {
      // Fallback if `applications` table doesn't exist
      const simpleStartupExpr = `COALESCE(s.${cols.startup}::text, '')`;
      rows = await query(
        `SELECT
           COALESCE(s.name, '')                   AS name,
           ${rollExpr}                            AS roll_number,
           ${degreeExpr}                          AS department,
           COALESCE(s.${cols.email}::text, '')    AS email,
           COALESCE(s.phone, '')                  AS phone,
           COALESCE(s.location, '')               AS location,
           COALESCE(s.status, '')                 AS status,
           ${simpleStartupExpr}                   AS assigned_startup,
           COALESCE(s.linkedin_url, '')           AS linkedin_url,
           COALESCE(s.github_url, '')             AS github_url,
           ${joinExpr}                            AS join_date
         FROM students s ${where} ORDER BY s.created_at DESC`,
        values
      );
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e: any) {
    console.error("Export students error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

/** Export all applications (optional status filter) */
export const exportApplications = async (req: Request, res: Response): Promise<any> => {
  try {
    const { status, from, to } = req.query;
    const values: any[] = [];
    const conditions: string[] = [];
    if (status && status !== "all") {
      values.push(String(status).toLowerCase());
      conditions.push(`LOWER(COALESCE(a.status, '')) = $${values.length}`);
    }
    if (from) {
      values.push(String(from));
      conditions.push(`a.applied_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(String(to));
      conditions.push(`a.applied_at < ($${values.length}::date + interval '1 day')`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT
         COALESCE(a.student_name, a.candidate_name, '') AS student_name,
         COALESCE(a.candidate_email, '')                AS email,
         COALESCE(s.company_name, '')                   AS startup_name,
         COALESCE(s.email, '')                          AS startup_email,
         COALESCE(s.location, '')                       AS startup_location,
         COALESCE(s.category, '')                       AS startup_category,
         COALESCE(s.industry, '')                       AS startup_industry,
         COALESCE(s.company_website, '')                AS startup_website,
         COALESCE(j.title, a.role_applied, '')          AS job_title,
         COALESCE(a.status, '')                         AS status,
         to_char(a.applied_at, 'YYYY-MM-DD')           AS applied_date
       FROM applications a
       LEFT JOIN startups s ON a.startup_id::text = s.id::text
       LEFT JOIN jobs     j ON a.job_id::text    = j.id::text
       ${where} ORDER BY a.applied_at DESC`,
      values
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e: any) {
    console.error("Export applications error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

/** Export pending approvals: pending startups + unverified/inactive students */
export const exportPending = async (req: Request, res: Response): Promise<any> => {
  try {
    const pendingStartups = await query(
      `SELECT
         COALESCE(company_name, '')    AS company_name,
         COALESCE(founder_name, '')    AS founder_name,
         COALESCE(category, 'General') AS category,
         COALESCE(email, '')           AS email,
         to_char(created_at, 'YYYY-MM-DD') AS applied_date
       FROM startups
       WHERE UPPER(COALESCE(status, 'PENDING')) = 'PENDING'
       ORDER BY created_at DESC`
    );

    let unverifiedStudents: any[] = [];
    try {
      // Try with is_verified column first
      unverifiedStudents = await query(
        `SELECT
           COALESCE(name, '')   AS name,
           COALESCE(email, '')  AS email,
           COALESCE(status, '') AS status,
           to_char(created_at, 'YYYY-MM-DD') AS join_date
         FROM students
         WHERE LOWER(COALESCE(status, '')) IN ('inactive', 'pending') OR is_verified = false
         ORDER BY created_at DESC`
      );
    } catch {
      // Fallback without is_verified
      unverifiedStudents = await query(
        `SELECT
           COALESCE(name, '')   AS name,
           COALESCE(email, '')  AS email,
           COALESCE(status, '') AS status,
           to_char(created_at, 'YYYY-MM-DD') AS join_date
         FROM students
         WHERE LOWER(COALESCE(status, '')) IN ('inactive', 'pending')
         ORDER BY created_at DESC`
      );
    }

    res.json({ success: true, pendingStartups, unverifiedStudents });
  } catch (e: any) {
    console.error("Export pending error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
