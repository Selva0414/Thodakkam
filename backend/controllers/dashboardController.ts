import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { ensureAdminAlertTables, upsertActiveStartupSnapshot } from "../services/adminAlertService";

const normalizeStatus = (value: string) => String(value || "").trim().toLowerCase();

const tableHasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
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

/** Get Dashboard Statistics */
export const getStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const [{ count: totalStartups }] = await sql`SELECT count(*)::int FROM startups`;
    const [{ count: totalStudents }] = await sql`SELECT count(*)::int FROM students`;
    const [{ count: pendingApprovals }] = await sql`SELECT count(*)::int FROM startups WHERE status = 'PENDING'`;
    const [{ count: lockedStartups }] = await sql`
      SELECT count(*)::int FROM startups 
      WHERE is_locked = true 
         OR (plan_type = 'trial' AND COALESCE(trial_started_at, created_at) + INTERVAL '7 days' < NOW())
         OR (plan_type = 'paid' AND plan_expires_at IS NOT NULL AND plan_expires_at < NOW())
    `;

    // Growth: compare this month vs last month
    const [{ count: startupsThisMonth }] = await sql`SELECT count(*)::int FROM startups WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    const [{ count: startupsLastMonth }] = await sql`SELECT count(*)::int FROM startups WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', CURRENT_DATE)`;
    const [{ count: studentsThisMonth }] = await sql`SELECT count(*)::int FROM students WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    const [{ count: studentsLastMonth }] = await sql`SELECT count(*)::int FROM students WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', CURRENT_DATE)`;
    const startupGrowth = startupsLastMonth > 0 ? Math.round(((startupsThisMonth - startupsLastMonth) / startupsLastMonth) * 100) : (startupsThisMonth > 0 ? 100 : 0);
    const studentGrowth = studentsLastMonth > 0 ? Math.round(((studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100) : (studentsThisMonth > 0 ? 100 : 0);

    // Participation trend: real monthly registration counts for last 6 months
    const trendRows = await query(
      `WITH bucket AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        )::date AS bucket_date
      )
      SELECT
        TO_CHAR(bucket_date, 'MON') AS label,
        COALESCE((SELECT count(*) FROM students s WHERE DATE_TRUNC('month', s.created_at)::date = bucket_date), 0)::int +
        COALESCE((SELECT count(*) FROM startups st WHERE DATE_TRUNC('month', st.created_at)::date = bucket_date), 0)::int AS value
      FROM bucket
      ORDER BY bucket_date`
    );
    const maxTrendVal = Math.max(...trendRows.map((r: any) => Number(r.value)), 1);
    const participationTrend = trendRows.map((r: any) => ({
      label: r.label,
      value: Math.round((Number(r.value) / maxTrendVal) * 100),
      highlight: Number(r.value) === maxTrendVal,
    }));

    const categories = await sql`
      SELECT 
        category || ' (' || round(count(*) * 100.0 / NULLIF((SELECT count(*) FROM startups), 0)) || '%)' as label,
        CASE 
          WHEN LOWER(category) = 'tech' THEN '#0F172A'
          WHEN LOWER(category) = 'fintech' THEN '#6366F1'
          WHEN LOWER(category) = 'health' THEN '#10B981'
          WHEN LOWER(category) = 'edtech' THEN '#F59E0B'
          ELSE '#94A3B8'
        END as color,
        round(count(*) * 100.0 / NULLIF((SELECT count(*) FROM startups), 0))::int as percent
      FROM startups
      GROUP BY category
    `;

    res.json({
      success: true,
      stats: { totalStartups, totalStudents, pendingApprovals, lockedStartups, startupGrowth, studentGrowth },
      participationTrend,
      categories: categories.length > 0 ? categories : [{ label: "Tech (100%)", color: "#0F172A", percent: 100 }],
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

/** Get Recent Applications */
export const getRecentApplications = async (req: Request, res: Response): Promise<any> => {
  try {
    const columns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'startups'`);
    const columnSet = new Set(columns.map((row: any) => row.column_name));
    let nameExpr = `'Startup #' || id::text`;
    if (columnSet.has("company_name")) nameExpr = "company_name";
    else if (columnSet.has("name")) nameExpr = "name";

    const startups = await query(`
      SELECT
        id,
        ${nameExpr} as name,
        founder_name,
        status,
        ${columnSet.has("logo_url") ? "logo_url" : "NULL::text"} as logo_url,
        to_char(created_at, 'MM-DD-YYYY') as date,
        CASE
          WHEN category = 'Health' THEN 'Leaf'
          WHEN category = 'Tech' THEN 'Cpu'
          ELSE 'Building2'
        END as icon_type
      FROM startups
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({ success: true, applications: startups });
  } catch (error: any) {
    console.error("Recent applications error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch recent applications" });
  }
};

/** Get Action Center summary for Master Admin */
export const getActionCenter = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupColumns = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'startups'`);
    const studentColumns = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students'`);
    const startupColumnSet = new Set(startupColumns.map((row: any) => row.column_name));
    const studentColumnSet = new Set(studentColumns.map((row: any) => row.column_name));

    const startupStatusRows = await query(`SELECT status, count(*)::int as count FROM startups GROUP BY status`);
    const studentStatusRows = await query(`SELECT status, count(*)::int as count FROM students GROUP BY status`);

    const pendingApprovals = startupStatusRows
      .filter((r: any) => normalizeStatus(r.status) === "pending")
      .reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);

    const suspendedStartups = startupStatusRows
      .filter((r: any) => normalizeStatus(r.status) === "suspended")
      .reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);

    const suspendedStudents = studentStatusRows
      .filter((r: any) => ["suspended", "inactive"].includes(normalizeStatus(r.status)))
      .reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);

    const startupLinkFields = ["startup_id", "assigned_startup", "startup"].filter((field) => studentColumnSet.has(field));

    let unassignedStudents = 0;
    if (startupLinkFields.length > 0) {
      const unassignedClauses = startupLinkFields
        .map((field) => `(${field} IS NULL OR TRIM(COALESCE(${field}, '')) = '' OR LOWER(COALESCE(${field}, '')) = 'unassigned')`)
        .join(" AND ");
      const rows = await query(
        `SELECT count(*)::int as count
         FROM students
         WHERE ${unassignedClauses}`
      );
      unassignedStudents = Number(rows[0]?.count || 0);
    }

    const hasStartupVerified = startupColumnSet.has("is_verified");
    const startupVerificationPending = hasStartupVerified
      ? Number((await query(`SELECT count(*)::int as count FROM startups WHERE COALESCE(is_verified, false) = false`))[0]?.count || 0)
      : 0;

    const hasEmailColumn = await tableHasColumn("students", "email");
    const studentsWithoutEmail = hasEmailColumn
      ? Number((await query(`SELECT count(*)::int as count FROM students WHERE email IS NULL OR TRIM(COALESCE(email, '')) = ''`))[0]?.count || 0)
      : 0;

    const actions = [
      {
        id: "pending_startup_approvals",
        title: "Pending Startup Approvals",
        description: "Review new startup accounts waiting for approval.",
        severity: pendingApprovals > 5 ? "high" : "medium",
        count: pendingApprovals,
        ctaLabel: "Review Startups",
        ctaPath: "/master-admin/startups",
      },
      {
        id: "suspended_accounts",
        title: "Suspended Accounts",
        description: "Investigate suspended startups and students.",
        severity: suspendedStartups + suspendedStudents > 0 ? "high" : "low",
        count: suspendedStartups + suspendedStudents,
        ctaLabel: "Open Users",
        ctaPath: "/master-admin/students",
      },
      {
        id: "unassigned_students",
        title: "Unassigned Students",
        description: "Students not mapped to a startup yet.",
        severity: unassignedStudents > 0 ? "medium" : "low",
        count: unassignedStudents,
        ctaLabel: "Assign Now",
        ctaPath: "/master-admin/students",
      },
      {
        id: "verification_and_data_quality",
        title: "Verification & Data Quality",
        description: "Unverified startups and student profiles missing email.",
        severity: startupVerificationPending + studentsWithoutEmail > 0 ? "medium" : "low",
        count: startupVerificationPending + studentsWithoutEmail,
        ctaLabel: "Fix Issues",
        ctaPath: "/master-admin/settings",
      },
    ];

    const sortedActions = actions.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const weight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (weight[b.severity] || 0) - (weight[a.severity] || 0);
    });

    res.json({
      success: true,
      summary: {
        totalOpenItems: sortedActions.reduce((sum, a) => sum + a.count, 0),
        criticalItems: sortedActions.filter((a) => a.severity === "high").reduce((sum, a) => sum + a.count, 0),
        resolvedToday: 0,
      },
      actions: sortedActions,
    });
  } catch (error: any) {
    console.error("Action center error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch action center" });
  }
};

/** Get Smart Alerts for proactive monitoring */
export const getSmartAlerts = async (req: Request, res: Response): Promise<any> => {
  try {
    await ensureAdminAlertTables();

    const alerts: Array<{
      id: string;
      type: "security" | "warning" | "info";
      severity: "high" | "medium" | "low";
      title: string;
      description: string;
      date: string;
      metric?: string;
    }> = [];

    const [{ count: activeStartupsRaw }] = await sql`
      SELECT count(*)::int AS count
      FROM startups
      WHERE LOWER(COALESCE(status, '')) = 'active'
    `;
    const activeStartups = Number(activeStartupsRaw || 0);
    await upsertActiveStartupSnapshot(activeStartups);

    const previousSnapshotRows = await query(
      `SELECT snapshot_date, active_startups
       FROM admin_metric_snapshots
       WHERE snapshot_date < CURRENT_DATE
       ORDER BY snapshot_date DESC
       LIMIT 1`
    );
    const previousActiveStartups = Number(previousSnapshotRows[0]?.active_startups || 0);

    if (previousActiveStartups > 0) {
      const dropPercent = ((previousActiveStartups - activeStartups) / previousActiveStartups) * 100;
      if (dropPercent >= 20 && previousActiveStartups - activeStartups >= 1) {
        alerts.push({
          id: "active_startup_drop",
          type: "warning",
          severity: dropPercent >= 35 ? "high" : "medium",
          title: "Sudden Drop in Active Startups",
          description: `Active startups dropped from ${previousActiveStartups} to ${activeStartups} since last snapshot.`,
          date: new Date().toISOString(),
          metric: `${Math.round(dropPercent)}% drop`,
        });
      }
    }

    const hasApplicationsTable = Boolean((await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'applications'
      ) AS exists`
    ))[0]?.exists);

    if (hasApplicationsTable) {
      const [rejectionStats] = await query(
        `SELECT
          count(*)::int AS total,
          COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, '')) LIKE 'reject%' THEN 1 ELSE 0 END), 0)::int AS rejected
         FROM applications
         WHERE applied_at >= NOW() - INTERVAL '7 days'`
      );

      const total = Number(rejectionStats?.total || 0);
      const rejected = Number(rejectionStats?.rejected || 0);
      const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

      if ((rejected >= 3 && rejectionRate >= 40) || rejected >= 5) {
        alerts.push({
          id: "high_rejected_applications",
          type: "warning",
          severity: rejectionRate >= 60 ? "high" : "medium",
          title: "High Rejected Applications",
          description: `${rejected} out of ${total} applications were rejected in the last 7 days.`,
          date: new Date().toISOString(),
          metric: `${Math.round(rejectionRate)}% rejection rate`,
        });
      }
    }

    await query(`DELETE FROM admin_login_failures WHERE occurred_at < NOW() - INTERVAL '30 days'`);
    const loginFailureRows = await query(
      `SELECT
         COALESCE(NULLIF(TRIM(email), ''), 'unknown') AS email,
         COALESCE(NULLIF(TRIM(ip_address), ''), 'unknown') AS ip_address,
         count(*)::int AS attempts,
         max(occurred_at) AS last_attempt
       FROM admin_login_failures
       WHERE occurred_at >= NOW() - INTERVAL '30 minutes'
       GROUP BY COALESCE(NULLIF(TRIM(email), ''), 'unknown'), COALESCE(NULLIF(TRIM(ip_address), ''), 'unknown')
       HAVING count(*) >= 3
       ORDER BY attempts DESC, last_attempt DESC
       LIMIT 5`
    );

    if (loginFailureRows.length > 0) {
      const top = loginFailureRows[0];
      alerts.push({
        id: "repeated_login_failures",
        type: "security",
        severity: Number(top.attempts || 0) >= 6 ? "high" : "medium",
        title: "Repeated Login Failures Detected",
        description: `${top.attempts} failed admin logins from ${top.ip_address} (${top.email}) in the last 30 minutes.`,
        date: top.last_attempt || new Date().toISOString(),
        metric: `${top.attempts} failed attempts`,
      });
    }

    alerts.sort((a, b) => {
      const score: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const sevDelta = (score[b.severity] || 0) - (score[a.severity] || 0);
      if (sevDelta !== 0) return sevDelta;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json({
      success: true,
      unreadCount: alerts.length,
      summary: {
        generatedAt: new Date().toISOString(),
        totalAlerts: alerts.length,
        highSeverity: alerts.filter((a) => a.severity === "high").length,
      },
      alerts,
    });
  } catch (error: any) {
    console.error("Smart alerts error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch smart alerts" });
  }
};

/** Get Student Registration Trend (last 6 months) */
export const getRegistrationTrend = async (req: Request, res: Response): Promise<any> => {
  try {
    const rows = await query(`
      SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon') AS label,
        TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS sort_key,
        count(*)::int AS count
      FROM students
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY sort_key ASC
    `);

    // Fill in missing months with 0
    const months: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const match = rows.find((r: any) => r.sort_key === sortKey);
      months.push({ label: label.toUpperCase(), count: match ? match.count : 0 });
    }

    res.json({ success: true, trend: months });
  } catch (error: any) {
    console.error("Registration trend error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch registration trend" });
  }
};
