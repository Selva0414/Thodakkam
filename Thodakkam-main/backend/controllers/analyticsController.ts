import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { resolveMediaUrl } from "../utils/mediaUrl";

const hasColumn = (columnSet: Set<string>, columnName: string) => columnSet.has(columnName);

type TrendRow = {
  label: string;
  users: number;
  startups: number;
};

/** Get Analytics Metrics and Trends */
export const getMetrics = async (req: Request, res: Response): Promise<any> => {
  try {
    const requestedPeriod = String(req.query.period || "monthly").toLowerCase();
    const period = ["weekly", "monthly", "yearly"].includes(requestedPeriod) ? requestedPeriod : "monthly";

    const startupColumns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'startups'`);
    const studentColumns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'students'`);
    const startupColumnSet = new Set(startupColumns.map((row: any) => row.column_name));
    const studentColumnSet = new Set(studentColumns.map((row: any) => row.column_name));

    let startupNameExpr = `'Startup #' || id::text`;
    if (hasColumn(startupColumnSet, "company_name")) startupNameExpr = "company_name";
    else if (hasColumn(startupColumnSet, "name")) startupNameExpr = "name";

    const startupCategoryExpr = hasColumn(startupColumnSet, "category") ? "category" : "'General'";
    const studentDepartmentExpr = hasColumn(studentColumnSet, "department")
      ? "department"
      : hasColumn(studentColumnSet, "dept")
      ? "dept"
      : "'N/A'";
    const hasEducationsCol = hasColumn(studentColumnSet, "educations");
    const studentDegreeExpr = hasEducationsCol
      ? `COALESCE(NULLIF(TRIM(${studentDepartmentExpr}), ''), educations->0->>'degree', 'N/A')`
      : `COALESCE(NULLIF(TRIM(${studentDepartmentExpr}), ''), 'N/A')`;
    const studentJoinDateExpr = hasColumn(studentColumnSet, "joined_at")
      ? "to_char(joined_at, 'MM-DD-YYYY')"
      : hasColumn(studentColumnSet, "join_date")
      ? "NULLIF(join_date, '')"
      : "NULL";

    const [{ totalstudents }] = await sql`SELECT count(*)::int as totalstudents FROM students`;
    const [{ activestartups }] = await sql`SELECT count(*)::int as activestartups FROM startups WHERE LOWER(COALESCE(status, '')) = 'active'`;
    const [{ totalstartups }] = await sql`SELECT count(*)::int as totalstartups FROM startups`;
    const [{ pendingstartups }] = await sql`SELECT count(*)::int as pendingstartups FROM startups WHERE LOWER(COALESCE(status, '')) = 'pending'`;

    const catRows = await query(`
      SELECT
        COALESCE(NULLIF(TRIM(COALESCE(${startupCategoryExpr}, '')), ''), 'Uncategorized') as name,
        count(*)::int as count,
        round(count(*) * 100.0 / NULLIF((SELECT count(*) FROM startups), 0))::int as percentage
      FROM startups
      GROUP BY ${startupCategoryExpr}
      ORDER BY count DESC
    `);

    const topCat = catRows.reduce((max: any, c: any) => (c.percentage > (max.percentage || 0) ? c : max), { percentage: 0 });

    let trendRows: TrendRow[] = [];
    if (period === "weekly") {
      trendRows = await query(`
        WITH bucket AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS bucket_date
        )
        SELECT
          TO_CHAR(bucket_date, 'Mon DD') AS label,
          COALESCE((SELECT count(*) FROM students s WHERE DATE(s.created_at) = bucket_date), 0)::int AS users,
          COALESCE((SELECT count(*) FROM startups st WHERE DATE(st.created_at) = bucket_date), 0)::int AS startups
        FROM bucket
        ORDER BY bucket_date
      `);
    } else if (period === "yearly") {
      trendRows = await query(`
        WITH bucket AS (
          SELECT generate_series(
            DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '5 years',
            DATE_TRUNC('year', CURRENT_DATE),
            '1 year'::interval
          )::date AS bucket_date
        )
        SELECT
          TO_CHAR(bucket_date, 'YYYY') AS label,
          COALESCE((SELECT count(*) FROM students s WHERE DATE_TRUNC('year', s.created_at)::date = bucket_date), 0)::int AS users,
          COALESCE((SELECT count(*) FROM startups st WHERE DATE_TRUNC('year', st.created_at)::date = bucket_date), 0)::int AS startups
        FROM bucket
        ORDER BY bucket_date
      `);
    } else {
      trendRows = await query(`
        WITH bucket AS (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date AS bucket_date
        )
        SELECT
          TO_CHAR(bucket_date, 'Mon') AS label,
          COALESCE((SELECT count(*) FROM students s WHERE DATE_TRUNC('month', s.created_at)::date = bucket_date), 0)::int AS users,
          COALESCE((SELECT count(*) FROM startups st WHERE DATE_TRUNC('month', st.created_at)::date = bucket_date), 0)::int AS startups
        FROM bucket
        ORDER BY bucket_date
      `);
    }

    const trends = {
      labels: trendRows.map((row) => row.label),
      users: trendRows.map((row) => Number(row.users || 0)),
      startups: trendRows.map((row) => Number(row.startups || 0)),
    };

    const monthlyActivity = trendRows.map((row, index) => {
      const current = Number(row.users || 0) + Number(row.startups || 0);
      const prevRow = trendRows[index - 1];
      const previous = prevRow ? Number(prevRow.users || 0) + Number(prevRow.startups || 0) : 0;
      return { label: row.label, current, previous };
    });

    const studentProfilePhotoExpr = hasColumn(studentColumnSet, "profile_photo") ? "profile_photo" : "NULL";
    const startupLogoExpr = hasColumn(startupColumnSet, "logo_url") ? "logo_url" : "NULL";

    const activityRows = await query(`
      (SELECT
        id::text as id,
        ${startupNameExpr} as name,
        'Registered' as action,
        status,
        'Platform' as location,
        created_at as sort_date,
        to_char(created_at, 'MM-DD-YYYY') as date,
        ${startupLogoExpr} as avatar,
        'startup' as entity_type
       FROM startups
       ORDER BY created_at DESC
       LIMIT 5)
      UNION ALL
      (SELECT
        id::text as id,
        name,
        'Joined' as action,
        status,
        ${studentDegreeExpr} as location,
        created_at as sort_date,
        COALESCE(${studentJoinDateExpr}, to_char(created_at, 'MM-DD-YYYY')) as date,
        ${studentProfilePhotoExpr} as avatar,
        'student' as entity_type
       FROM students
       ORDER BY created_at DESC
       LIMIT 5)
      ORDER BY sort_date DESC
      LIMIT 10
    `);

    // ── Placement Funnel ──────────────────────────────────────────────────────
    let placementFunnel = { applied: 0, shortlisted: 0, coding: 0, interview: 0, selected: 0 };
    try {
      const funnelRows = await query(`
        SELECT
          COUNT(*)::int AS applied,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('shortlisted','shortlist'))::int AS shortlisted,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('coding','coding_test','code_test','mcq','mcq_pending'))::int AS coding,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('interview','interview_scheduled','hr_interview','technical_interview'))::int AS interview,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('selected','hired','accepted','offer_sent','offer'))::int AS selected
        FROM applications
      `);
      if (funnelRows[0]) placementFunnel = funnelRows[0];
    } catch (e: any) {
      console.error("Placement funnel query failed:", e.message);
    }

    // ── Department Placement Stats ────────────────────────────────────────────
    let departmentStats: any[] = [];
    try {
      departmentStats = await query(`
        SELECT
          ${studentDegreeExpr} AS department,
          COUNT(DISTINCT s.id)::int AS total,
          COUNT(DISTINCT a.student_id) FILTER (WHERE LOWER(a.status) = 'selected')::int AS selected
        FROM students s
        LEFT JOIN applications a ON a.student_id::text = s.id::text
        GROUP BY ${studentDegreeExpr}
        ORDER BY total DESC
        LIMIT 8
      `);
    } catch (e: any) {
      console.error("Department stats query failed:", e.message);
    }

    // ── Top Startups by Hiring ────────────────────────────────────────────────
    let topStartups: any[] = [];
    try {
      const topRows = await query(`
        SELECT
          COALESCE(${startupNameExpr}, 'Unknown') AS name,
          COUNT(a.id) FILTER (WHERE LOWER(a.status) = 'selected')::int AS hired_count
        FROM startups st
        LEFT JOIN applications a ON a.startup_id::text = st.id::text
        GROUP BY st.id, ${startupNameExpr}
        ORDER BY hired_count DESC
        LIMIT 5
      `);
      topStartups = topRows.filter((s: any) => (s.hired_count || 0) > 0);
    } catch (e: any) {
      console.error("Top startups query failed:", e.message);
    }

    res.json({
      success: true,
      summary: {
        totalRegistrations: Number(totalstudents || 0) + Number(totalstartups || 0),
        activeStartups: activestartups,
        pendingRate: `${totalstartups > 0 ? ((Number(pendingstartups || 0) / Number(totalstartups || 0)) * 100).toFixed(1) : "0.0"}%`,
        topCategoryPercentage: topCat.percentage + "%",
        categories: catRows,
        monthlyActivity,
        trends,
        placementFunnel,
        departmentStats,
        topStartups,
      },
      activity: activityRows.map((row: any) => ({
        ...row,
        avatar: resolveMediaUrl(req, row.avatar),
      })),
    });
  } catch (error: any) {
    console.error("Analytics metrics error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

/** GET /api/admin/analytics/engagement — User engagement & conversion metrics */
export const getEngagementMetrics = async (req: Request, res: Response): Promise<any> => {
  try {
    // Application conversion funnel
    const [totalApps] = await query(`SELECT count(*)::int as count FROM applications`);
    const [shortlisted] = await query(`SELECT count(*)::int as count FROM applications WHERE LOWER(status) IN ('shortlisted','shortlist')`);
    const [interviewed] = await query(`SELECT count(*)::int as count FROM applications WHERE LOWER(status) IN ('interview','interview_scheduled','hr_interview','technical_interview')`);
    const [hired] = await query(`SELECT count(*)::int as count FROM applications WHERE LOWER(status) IN ('selected','hired','accepted','offer_sent')`);
    const [rejected] = await query(`SELECT count(*)::int as count FROM applications WHERE LOWER(status) IN ('rejected','not_selected')`);

    // Avg time to hire (applications that ended in selection)
    let avgTimeToHire = 0;
    try {
      const [result] = await query(`
        SELECT COALESCE(AVG(EXTRACT(DAY FROM (updated_at - applied_at))), 0)::int as avg_days
        FROM applications
        WHERE LOWER(status) IN ('selected','hired','accepted')
          AND updated_at IS NOT NULL AND applied_at IS NOT NULL
      `);
      avgTimeToHire = result?.avg_days || 0;
    } catch {}

    // Jobs stats
    const [totalJobs] = await query(`SELECT count(*)::int as count FROM jobs`);
    const [activeJobs] = await query(`SELECT count(*)::int as count FROM jobs WHERE LOWER(status) = 'active' OR LOWER(status) = 'open'`).catch(() => [{ count: 0 }]);

    // Applications per day (last 30 days)
    const applicationTrend = await query(`
      WITH days AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval)::date AS day
      )
      SELECT TO_CHAR(day, 'Mon DD') AS label,
             COALESCE((SELECT count(*) FROM applications WHERE DATE(applied_at) = day), 0)::int AS count
      FROM days ORDER BY day
    `);

    // Top job roles by applications
    const topRoles = await query(`
      SELECT COALESCE(j.title, a.role_applied, 'Unknown') AS role,
             count(a.id)::int AS applications
      FROM applications a
      LEFT JOIN jobs j ON j.id::text = a.job_id::text
      GROUP BY role
      ORDER BY applications DESC
      LIMIT 8
    `);

    // Student engagement: students with most applications
    const topApplicants = await query(`
      SELECT s.name, count(a.id)::int AS applications,
             count(a.id) FILTER (WHERE LOWER(a.status) IN ('selected','hired','accepted'))::int AS hired
      FROM students s
      JOIN applications a ON a.student_id::text = s.id::text
      GROUP BY s.id, s.name
      ORDER BY applications DESC
      LIMIT 5
    `);

    // Startup activity: most hiring startups
    const topHiringStartups = await query(`
      SELECT COALESCE(st.company_name, 'Unknown') AS name,
             count(j.id)::int AS jobs_posted,
             count(a.id)::int AS applications_received,
             count(a.id) FILTER (WHERE LOWER(a.status) IN ('selected','hired','accepted'))::int AS hired
      FROM startups st
      LEFT JOIN jobs j ON j.startup_id::text = st.id::text
      LEFT JOIN applications a ON a.startup_id::text = st.id::text
      GROUP BY st.id, st.company_name
      ORDER BY applications_received DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      engagement: {
        conversionFunnel: {
          totalApplications: totalApps?.count || 0,
          shortlisted: shortlisted?.count || 0,
          interviewed: interviewed?.count || 0,
          hired: hired?.count || 0,
          rejected: rejected?.count || 0,
          conversionRate: totalApps?.count > 0 ? ((hired?.count || 0) / totalApps.count * 100).toFixed(1) : "0.0",
        },
        avgTimeToHire,
        jobStats: { total: totalJobs?.count || 0, active: activeJobs?.count || 0 },
        applicationTrend,
        topRoles,
        topApplicants,
        topHiringStartups,
      },
    });
  } catch (error: any) {
    console.error("Engagement metrics error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch engagement metrics" });
  }
};

/** GET /api/admin/analytics/platform-health — Platform overview stats */
export const getPlatformHealth = async (_req: Request, res: Response): Promise<any> => {
  try {
    // User registration over time (last 12 months)
    const registrationTrend = await query(`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        )::date AS month
      )
      SELECT TO_CHAR(month, 'Mon YYYY') AS label,
             COALESCE((SELECT count(*) FROM students WHERE DATE_TRUNC('month', created_at)::date = month), 0)::int AS students,
             COALESCE((SELECT count(*) FROM startups WHERE DATE_TRUNC('month', created_at)::date = month), 0)::int AS startups
      FROM months ORDER BY month
    `);

    // Active users last 7 days (students who applied + startups that posted jobs)
    let activeStudents7d = 0;
    let activeStartups7d = 0;
    try {
      const [s] = await query(`SELECT count(DISTINCT student_id)::int as count FROM applications WHERE applied_at >= CURRENT_DATE - INTERVAL '7 days'`);
      activeStudents7d = s?.count || 0;
    } catch {}
    try {
      const [st] = await query(`SELECT count(DISTINCT startup_id)::int as count FROM jobs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`);
      activeStartups7d = st?.count || 0;
    } catch {}

    // Content stats
    const [totalMessages] = await query(`SELECT count(*)::int as count FROM messages`).catch(() => [{ count: 0 }]);
    const [totalCommunityPosts] = await query(`SELECT count(*)::int as count FROM posts`).catch(() => [{ count: 0 }]);
    const [totalInterviews] = await query(`SELECT count(*)::int as count FROM interviews`).catch(() => [{ count: 0 }]);

    // DB size (approximate row counts)
    const tableSizes = await query(`
      SELECT relname as table_name, reltuples::bigint as row_count
      FROM pg_class
      WHERE relkind = 'r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY reltuples DESC
      LIMIT 15
    `).catch(() => []);

    res.json({
      success: true,
      health: {
        registrationTrend,
        activeUsers7d: { students: activeStudents7d, startups: activeStartups7d },
        contentStats: {
          messages: totalMessages?.count || 0,
          communityPosts: totalCommunityPosts?.count || 0,
          interviews: totalInterviews?.count || 0,
        },
        tableSizes,
      },
    });
  } catch (error: any) {
    console.error("Platform health error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch platform health" });
  }
};
