import { Request, Response } from "express";
import { sql } from "../config/database";

export const getDashboardStats = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const jobId = req.query.jobId ? String(req.query.jobId) : null;
  const assessmentId = req.query.assessmentId ? String(req.query.assessmentId) : null;

  try {
    // Run all independent queries in parallel
    const [
      [{ count: totalHires }],
      [{ count: openRoles }],
      [{ count: newApps }],
      [{ count: totalApps }],
      [{ count: interviewedApps }],
      [{ count: attendedAssessments }],
      [{ count: notAttendedAssessments }],
      [{ count: rescheduleRequests }],
      recentActivity,
      candidateGrowth,
      deptRaw,
      jobsList,
      assessmentsList,
    ] = await Promise.all([
      sql`SELECT count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND a.status = 'hired' AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR EXISTS (SELECT 1 FROM candidate_assessments ca WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text))`,
      sql`SELECT count(*)::int AS count FROM jobs WHERE startup_id::text = ${startupId}::text AND status = 'active' AND (${jobId}::text IS NULL OR id::text = ${jobId}::text)`,
      sql`SELECT count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND a.applied_at >= NOW() - INTERVAL '7 days' AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR EXISTS (SELECT 1 FROM candidate_assessments ca WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text))`,
      sql`SELECT count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR EXISTS (SELECT 1 FROM candidate_assessments ca WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text))`,
      sql`SELECT count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND a.status IN ('interview_scheduled', 'hired', 'Interviewing') AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR EXISTS (SELECT 1 FROM candidate_assessments ca WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text))`,
      sql`SELECT count(*)::int AS count FROM candidate_assessments ca JOIN assessments ass ON ass.id = ca.assessment_id LEFT JOIN applications a ON a.id::text = ca.application_id::text WHERE ass.startup_id::text = ${startupId}::text AND ca.started_at IS NOT NULL AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR ca.assessment_id::text = ${assessmentId}::text)`,
      sql`SELECT count(*)::int AS count FROM candidate_assessments ca JOIN assessments ass ON ass.id = ca.assessment_id LEFT JOIN applications a ON a.id::text = ca.application_id::text WHERE ass.startup_id::text = ${startupId}::text AND ca.started_at IS NULL AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR ca.assessment_id::text = ${assessmentId}::text)`,
      sql`SELECT count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND a.status = 'reschedule_requested' AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text) AND (${assessmentId}::text IS NULL OR EXISTS (SELECT 1 FROM candidate_assessments ca WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text))`,
      sql`
        SELECT
          COALESCE(NULLIF(a.student_name, ''), NULLIF(a.candidate_name, ''), NULLIF(a.candidate_email, ''), 'Candidate') AS candidate_name,
          COALESCE(NULLIF(j.title, ''), 'Untitled role') AS job_title,
          COALESCE(NULLIF(a.status, ''), 'applied') AS status,
          a.applied_at
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE j.startup_id::text = ${startupId}::text
          AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text)
          AND (${assessmentId}::text IS NULL OR EXISTS (
            SELECT 1 FROM candidate_assessments ca 
            WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text
          ))
        ORDER BY a.applied_at DESC
        LIMIT 5
      `,
      sql`
        SELECT
          TO_CHAR(d, 'Dy') AS day,
          COUNT(a.id)::int AS count
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
        LEFT JOIN (
          SELECT a.id, a.applied_at
          FROM applications a 
          JOIN jobs j ON j.id = a.job_id
          WHERE j.startup_id::text = ${startupId}::text
            AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text)
            AND (${assessmentId}::text IS NULL OR EXISTS (
              SELECT 1 FROM candidate_assessments ca 
              WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text
            ))
        ) a ON DATE(a.applied_at) = d
        GROUP BY d, TO_CHAR(d, 'Dy')
        ORDER BY d
      `,
      sql`
        SELECT
          COALESCE(NULLIF(j.domain, ''), NULLIF(j.department, ''), 'Other') AS dept,
          COUNT(a.id)::int AS count
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE j.startup_id::text = ${startupId}::text
          AND (${jobId}::text IS NULL OR a.job_id::text = ${jobId}::text)
          AND (${assessmentId}::text IS NULL OR EXISTS (
            SELECT 1 FROM candidate_assessments ca 
            WHERE ca.application_id::text = a.id::text AND ca.assessment_id::text = ${assessmentId}::text
          ))
        GROUP BY COALESCE(NULLIF(j.domain, ''), NULLIF(j.department, ''), 'Other')
        ORDER BY count DESC
        LIMIT 5
      `,
      sql`SELECT id::text AS id, title FROM jobs WHERE startup_id::text = ${startupId}::text ORDER BY title ASC`,
      sql`SELECT id::text AS id, title FROM assessments WHERE startup_id::text = ${startupId}::text ORDER BY title ASC`
    ]);

    const interviewRate = totalApps > 0 ? Math.round((interviewedApps / totalApps) * 100) : 0;

    const totalDept = deptRaw.reduce((s: number, d: any) => s + d.count, 0);
    const departmentDistribution = deptRaw.map((d: any) => ({
      dept: (d.dept || "Other").substring(0, 3).toUpperCase(),
      count: d.count,
      percent: totalDept > 0 ? Math.round((d.count / totalDept) * 100) : 0,
    }));

    res.json({ success: true, stats: { totalHires, openRoles, newApps, interviewRate, attendedAssessments, notAttendedAssessments, rescheduleRequests }, recentActivity, candidateGrowth, departmentDistribution, jobs: jobsList, assessments: assessmentsList });
  } catch (error: any) {
    console.error("Startup dashboard error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};
