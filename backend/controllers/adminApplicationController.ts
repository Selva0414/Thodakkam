import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { resolveMediaUrl } from "../utils/mediaUrl";

const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
  const rows = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [tableName, columnName]
  );
  return Boolean(rows[0]?.exists);
};

/** List all applications across all students — paginated, filterable */
export const listAllApplications = async (req: Request, res: Response): Promise<any> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const { student_id, startup_id, status, search } = req.query;

  try {
    const conditions: string[] = [];
    const values: any[] = [];

    if (student_id) {
      values.push(String(student_id));
      conditions.push(`a.student_id::text = $${values.length}`);
    }
    if (startup_id) {
      values.push(String(startup_id));
      conditions.push(`a.startup_id::text = $${values.length}`);
    }
    if (status) {
      values.push(String(status).toLowerCase());
      conditions.push(`LOWER(a.status) = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(
        a.student_name ILIKE $${values.length}
        OR a.candidate_name ILIKE $${values.length}
        OR s.company_name ILIKE $${values.length}
        OR j.title ILIKE $${values.length}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await query(
      `SELECT count(*)::int AS count
       FROM applications a
       LEFT JOIN startups s ON a.startup_id::text = s.id::text
       LEFT JOIN jobs j ON a.job_id::text = j.id::text
       ${whereClause}`,
      values
    );
    const count = countRows[0]?.count || 0;

    const applications = await query(
      `SELECT
        a.id,
        a.student_id,
        a.student_name,
        a.candidate_email,
        a.role_applied,
        a.status,
        a.applied_at,
        j.title AS job_title,
        j.location AS job_location,
        j.emp_type AS job_type,
        s.company_name
      FROM applications a
      LEFT JOIN jobs j ON a.job_id::text = j.id::text
      LEFT JOIN startups s ON a.startup_id::text = s.id::text
      ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      applications,
      pagination: {
        current_page: page,
        page_size: limit,
        total_count: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error: any) {
    console.error("List all applications error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

/** Get all applications for a specific student + summary stats */
export const getStudentApplications = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const hasStageColumn = await hasColumn("applications", "stage");
    const trackingStatusExpr = hasStageColumn
      ? "LOWER(COALESCE(NULLIF(a.stage, ''), a.status, 'applied'))"
      : "LOWER(COALESCE(a.status, 'applied'))";

    // Student info
    const studentRows = await query(
      `SELECT id, name, email, phone, location, profile_photo, skills, status
       FROM students WHERE id::text = $1`,
      [String(id)]
    );
    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const student = studentRows[0];

    // Applications with job + startup details
    const applications = await query(
      `SELECT
        a.id,
        a.role_applied,
        ${trackingStatusExpr} AS status,
        LOWER(COALESCE(a.status, 'applied')) AS raw_status,
        ${hasStageColumn ? "LOWER(COALESCE(a.stage, ''))" : "NULL::text"} AS stage,
        a.applied_at,
        a.candidate_email,
        a.offer_letter,
        a.match_score,
        j.title AS job_title,
        j.description AS job_description,
        j.location AS job_location,
        j.emp_type AS job_type,
        j.domain AS job_domain,
        s.company_name,
        s.id AS startup_id
      FROM applications a
      LEFT JOIN jobs j ON a.job_id::text = j.id::text
      LEFT JOIN startups s ON a.startup_id::text = s.id::text
      WHERE a.student_id::text = $1
      ORDER BY a.applied_at DESC`,
      [String(id)]
    );

    // Batch-fetch latest assessment per application in a single query (avoid N+1).
    if (applications.length > 0) {
      try {
        const appIds = applications.map((a: any) => String(a.id));
        const caRows = await query(
          `SELECT DISTINCT ON (application_id::text)
             application_id::text AS application_id,
             mcq_score, mcq_total, coding_score, interview_score, ai_coding_score,
             overall_result, status as assessment_status
           FROM candidate_assessments
           WHERE application_id::text = ANY($1::text[])
           ORDER BY application_id::text, created_at DESC`,
          [appIds]
        );
        const caByApp = new Map<string, any>(caRows.map((r: any) => [String(r.application_id), r]));
        for (const app of applications) {
          const ca = caByApp.get(String(app.id));
          if (ca) {
            app.mcq_score = ca.mcq_score;
            app.mcq_total = ca.mcq_total;
            app.coding_score = ca.coding_score;
            app.interview_score = ca.interview_score;
            app.ai_coding_score = ca.ai_coding_score;
            app.overall_result = ca.overall_result;
            app.assessment_status = ca.assessment_status;
          }
        }
      } catch {
        // assessment table may be missing in some envs; ignore enrichment failure
      }
    }

    // Summary stats
    const total = applications.length;
    const statusCount = (s: string) =>
      applications.filter((a: any) => (a.status || "").toLowerCase() === s).length;

    const summary = {
      total_applied: total,
      shortlisted: statusCount("shortlisted"),
      interview: statusCount("interview_scheduled") + statusCount("interview"),
      selected: statusCount("selected") + statusCount("hired") + statusCount("offered"),
      rejected: statusCount("rejected"),
    };

    student.profile_photo = resolveMediaUrl(req, student.profile_photo);

    res.json({ success: true, student, applications, summary });
  } catch (error: any) {
    console.error("Get student applications error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch student applications" });
  }
};

/** Get activity timeline + interview schedule for a specific student */
export const getStudentTimeline = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const hasStageColumn = await hasColumn("applications", "stage");
    const timelineStatusExpr = hasStageColumn
      ? "LOWER(COALESCE(NULLIF(a.stage, ''), a.status, 'applied'))"
      : "LOWER(COALESCE(a.status, 'applied'))";

    // Application events
    const applications = await query(
      `SELECT
        a.id AS application_id,
        ${timelineStatusExpr} AS status,
        a.role_applied,
        a.applied_at,
        s.company_name
      FROM applications a
      LEFT JOIN startups s ON a.startup_id::text = s.id::text
      WHERE a.student_id::text = $1
      ORDER BY a.applied_at DESC`,
      [String(id)]
    );

    // Interview schedules for this student's applications
    const interviews = await query(
      `SELECT
        i.id,
        i.application_id,
        i.round_type,
        i.interview_type,
        i.platform,
        i.meet_link,
        i.office_location,
        i.scheduled_date,
        i.time_slot,
        i.status AS interview_status,
        i.notes,
        a.role_applied,
        s.company_name
      FROM interviews i
      JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN startups s ON a.startup_id::text = s.id::text
      WHERE a.student_id::text = $1
      ORDER BY i.scheduled_date DESC`,
      [String(id)]
    );

    // Build timeline entries
    const timeline: any[] = [];

    for (const app of applications) {
      timeline.push({
        type: "application",
        date: app.applied_at,
        title: `Applied for ${app.role_applied || "a role"}`,
        subtitle: app.company_name || "Unknown Company",
        status: app.status,
        application_id: app.application_id,
      });
    }

    for (const iv of interviews) {
      timeline.push({
        type: "interview",
        date: iv.scheduled_date,
        title: `${iv.round_type || "Interview"} — ${iv.interview_type || "Online"}`,
        subtitle: iv.company_name || "Unknown Company",
        status: iv.interview_status,
        platform: iv.platform,
        meet_link: iv.meet_link,
        time_slot: iv.time_slot,
        application_id: iv.application_id,
      });
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, timeline, interviews });
  } catch (error: any) {
    console.error("Get student timeline error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch student timeline" });
  }
};

/** Get analytics for a specific student (Trends, Domains, Funnel) */
export const getStudentAnalytics = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const hasStageColumn = await hasColumn("applications", "stage");
    const analyticsStatusExpr = hasStageColumn
      ? "LOWER(COALESCE(NULLIF(stage, ''), status, 'applied'))"
      : "LOWER(COALESCE(status, 'applied'))";

    // 1. Monthly Application Trend (Last 6 months)
    const monthlyTrend = await sql`
      SELECT 
        TO_CHAR(d, 'Mon') AS label,
        COUNT(a.id)::int AS value
      FROM generate_series(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months', DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) d
      LEFT JOIN applications a ON DATE_TRUNC('month', a.applied_at) = d AND a.student_id::text = ${id}
      GROUP BY d
      ORDER BY d
    `;

    // 2. Domain Distribution (Top 5 domains they applied to)
    const domainDistribution = await sql`
      SELECT 
        COALESCE(j.domain, 'Other') AS label,
        COUNT(a.id)::int AS value
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.student_id::text = ${id}
      GROUP BY j.domain
      ORDER BY value DESC
      LIMIT 5
    `;

    // 3. Funnel Data
    const [funnel] = await query(
      `SELECT
         COUNT(*)::int AS applied,
         COUNT(*) FILTER (WHERE ${analyticsStatusExpr} IN ('shortlisted', 'mcq', 'coding', 'interview', 'interview_scheduled', 'selected', 'hired', 'offered'))::int AS shortlisted,
         COUNT(*) FILTER (WHERE ${analyticsStatusExpr} IN ('interview', 'interview_scheduled', 'selected', 'hired', 'offered'))::int AS interviewed,
         COUNT(*) FILTER (WHERE ${analyticsStatusExpr} IN ('selected', 'hired', 'offered'))::int AS hired
       FROM applications
       WHERE student_id::text = $1`,
      [String(id)]
    );

    const applied = Number(funnel?.applied || 0);
    const shortlisted = Number(funnel?.shortlisted || 0);
    const interviewed = Number(funnel?.interviewed || 0);
    const hired = Number(funnel?.hired || 0);

    res.json({
      success: true,
      analytics: {
        monthlyTrend,
        domainDistribution,
        funnel: {
          applied,
          shortlisted,
          interviewed,
          hired
        }
      }
    });
  } catch (error: any) {
    console.error("Get student analytics error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch student analytics" });
  }
};
