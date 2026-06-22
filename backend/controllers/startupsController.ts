import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { sendApprovalEmail } from "../services/emailService";
import NotificationModel from "../models/notificationModel";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { logAdminAction } from "./auditLogController";

const getTableColumns = async (tableName: string): Promise<Set<string>> => {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(rows.map((row: any) => row.column_name));
};

const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const rows = await query(`SELECT to_regclass($1) AS reg`, [`public.${tableName}`]);
    return Boolean(rows?.[0]?.reg);
  } catch {
    return false;
  }
};

/**
 * Returns SQL fragments for safely joining the optional `startup_profiles` table.
 * In some deployments the table does not exist, so we skip the join and emit NULL
 * for `avatar_url`.
 */
const buildStartupProfilesJoin = async (alias = "sp", startupAlias = "s") => {
  const exists = await tableExists("startup_profiles");
  if (exists) {
    return {
      avatarSelect: `${alias}.avatar_url`,
      join: `LEFT JOIN startup_profiles ${alias} ON ${alias}.startup_id = ${startupAlias}.id::text`,
    };
  }
  return {
    avatarSelect: `NULL::text`,
    join: ``,
  };
};

/** List all startups with pagination and status summary */
export const listStartups = async (req: Request, res: Response): Promise<any> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const statusParam = req.query.status ? String(req.query.status).toUpperCase() : '';

  try {
    const statusCondition = statusParam ? `WHERE UPPER(COALESCE(s.status, '')) = '${statusParam.replace(/[^A-Z]/g, '')}'` : '';
    const [{ count }] = await query(`SELECT count(*)::int FROM startups s ${statusCondition}`);
    const statusRows = await sql`SELECT LOWER(status) as status, count(*)::int as count FROM startups GROUP BY status`;
    const summary: Record<string, number> = {};
    statusRows.forEach((row: any) => { summary[row.status] = row.count; });

    const columns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'startups'`);
    const columnSet = new Set(columns.map((row: any) => row.column_name));
    let nameExpr = `'Startup #' || id::text`;
    if (columnSet.has("company_name")) nameExpr = "company_name";
    else if (columnSet.has("name")) nameExpr = "name";

    const sNameExpr = `s.${nameExpr}`;
    const profileJoin = await buildStartupProfilesJoin("sp", "s");

    const startups = await query(`
      SELECT
        s.id,
        ${sNameExpr} as name,
        s.founder_name,
        s.status,
        s.category,
        to_char(s.created_at, 'MM-DD-YYYY') as date,
        UPPER(SUBSTRING(${sNameExpr}, 1, 2)) as icon_text,
        ${columnSet.has('logo_url') ? 's.logo_url' : "NULL as logo_url"},
        ${profileJoin.avatarSelect} as founder_avatar
      FROM startups s
      ${profileJoin.join}
      ${statusCondition}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const resolved = startups.map((s: any) => ({
      ...s,
      logo_url: resolveMediaUrl(req, s.logo_url || s.founder_avatar),
      founder_avatar: resolveMediaUrl(req, s.founder_avatar),
    }));

    res.json({ success: true, startups: resolved, pagination: { current_page: page, page_size: limit, total_count: count, total_pages: Math.ceil(count / limit) }, summary });
  } catch (error: any) {
    console.error("List startups error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch startups" });
  }
};

/** Update startup status (APPROVE, SUSPEND, REJECT) and send email notification */
export const updateStatus = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const normalizeStatus = (value: any) => {
    const upper = String(value || "").trim().toUpperCase();
    if (upper === "APPROVED") return "ACTIVE";
    if (upper === "REJECT") return "REJECTED";
    if (upper === "SUSPEND") return "SUSPENDED";
    return upper;
  };
  const nextStatus = normalizeStatus(status);
  const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];
  if (!validStatuses.includes(nextStatus)) return res.status(400).json({ success: false, message: "Invalid status" });

  // Require a reason for REJECTED and SUSPENDED
  if ((nextStatus === "REJECTED" || nextStatus === "SUSPENDED") && (!reason || !reason.trim())) {
    return res.status(400).json({ success: false, message: "A reason is required when rejecting or suspending a startup." });
  }

  try {
    const [startup] = await sql`SELECT id, founder_name, company_name, email, status as current_status FROM startups WHERE id = ${id}`;
    if (!startup) return res.status(404).json({ success: false, message: "Startup not found" });

    // When approving, also mark as verified and clear any previous reasons
    let updated;
    if (nextStatus === 'ACTIVE') {
      [updated] = await sql`UPDATE startups SET status = ${nextStatus}, is_verified = true, reject_reason = NULL, suspend_reason = NULL, updated_at = NOW(), trial_started_at = COALESCE(trial_started_at, NOW()) WHERE id = ${id} RETURNING *`;
    } else if (nextStatus === 'REJECTED') {
      [updated] = await sql`UPDATE startups SET status = ${nextStatus}, reject_reason = ${reason.trim()}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
    } else if (nextStatus === 'SUSPENDED') {
      [updated] = await sql`UPDATE startups SET status = ${nextStatus}, suspend_reason = ${reason.trim()}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
    } else {
      [updated] = await sql`UPDATE startups SET status = ${nextStatus}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
    }

    const currentStatus = normalizeStatus(startup.current_status);
    if (currentStatus !== nextStatus && ["ACTIVE", "REJECTED", "SUSPENDED"].includes(nextStatus)) {
      const trimmedReason = reason?.trim();
      sendApprovalEmail(startup.email, startup.founder_name, startup.company_name, nextStatus, trimmedReason)
        .then(() => console.log(`Approval email sent to ${startup.email} - Status: ${nextStatus}`))
        .catch((emailError: any) => console.error("Failed to send approval email asynchronously:", emailError.message));

      // Create in-app notification
      const notifMap: Record<string, { type: string; title: string; message: string }> = {
        ACTIVE: {
          type: "success",
          title: "🎉 Startup Approved!",
          message: `Your startup ${startup.company_name} has been approved. Welcome aboard!`,
        },
        REJECTED: {
          type: "warning",
          title: "Application Update",
          message: `Your startup application for ${startup.company_name} has been reviewed and was not approved. Reason: ${trimmedReason}`,
        },
        SUSPENDED: {
          type: "security",
          title: "Account Suspended",
          message: `Your startup ${startup.company_name} has been suspended. Reason: ${trimmedReason}`,
        },
      };

      const notifData = notifMap[nextStatus];
      if (notifData) {
        NotificationModel.createStartupNotification({
          startup_id: startup.id,
          title: notifData.title,
          message: notifData.message,
          type: notifData.type,
        })
          .then(async (notification: any) => {
            const unreadCount = await NotificationModel.getStartupUnreadCount(startup.id);
            const io = req.app.get("io");
            if (io) {
              io.to(`${startup.id}_startup`).emit("new_notification", { notification, unreadCount });
              io.to(`${startup.id}_startup`).emit("startup_status_changed", {
                status: nextStatus,
                company_name: startup.company_name,
                reason: trimmedReason,
              });
            }
          })
          .catch((notifError: any) =>
            console.error("Failed to create startup notification:", notifError.message)
          );
      }
    }

    // Audit log
    logAdminAction(req, `STARTUP_${nextStatus}`, 'startup', String(id), startup.company_name, { previousStatus: currentStatus, newStatus: nextStatus, reason: reason?.trim() });

    res.json({ success: true, message: `Startup ${nextStatus.toLowerCase()} successfully`, data: updated });
  } catch (error: any) {
    console.error("Update startup status error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/** Delete a startup */
export const deleteStartup = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    // Clean up related records first
    await query(`DELETE FROM applications WHERE startup_id::text = $1`, [id]);
    if (await tableExists("startup_profiles")) {
      await query(`DELETE FROM startup_profiles WHERE startup_id::text = $1`, [id]);
    }
    // Unassign students linked to this startup
    try { await query(`UPDATE students SET assigned_startup = NULL WHERE assigned_startup::text = $1`, [id]); } catch {}
    const [deleted] = await sql`DELETE FROM startups WHERE id = ${id} RETURNING id, company_name`;
    if (!deleted) return res.status(404).json({ success: false, message: "Startup not found" });
    logAdminAction(req, 'DELETE_STARTUP', 'startup', String(id), deleted.company_name);
    res.json({ success: true, message: "Startup deleted successfully" });
  } catch (error: any) {
    console.error("Delete startup error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete startup" });
  }
};

/** Get a single startup's full details (admin view-only) */
export const getStartupById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const profileJoin = await buildStartupProfilesJoin("sp", "s");
    const [startup] = await query(
      `SELECT s.id, s.founder_name, s.company_name, s.company_reg_id, s.email, s.category, s.status, s.is_verified,
             to_char(s.created_at, 'MM-DD-YYYY') as date,
             s.company_website, s.company_description, s.logo_url, s.linkedin_url, s.twitter_url,
             s.profile_views, s.post_impressions,
             s.reject_reason, s.suspend_reason,
             s.instagram_url, s.github_url, s.physical_photos,
             ${profileJoin.avatarSelect} as founder_avatar
      FROM startups s
      ${profileJoin.join}
      WHERE s.id = $1`,
      [id]
    );
    if (!startup) return res.status(404).json({ success: false, message: "Startup not found" });
    startup.logo_url = resolveMediaUrl(req, startup.logo_url || startup.founder_avatar);
    startup.founder_avatar = resolveMediaUrl(req, startup.founder_avatar);
    res.json({ success: true, startup });
  } catch (error: any) {
    console.error("Get startup by id error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch startup details" });
  }
};

/** Edit a startup */
export const editStartup = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const {
    company_name, founder_name, category,
    company_website, company_description, logo_url, linkedin_url, twitter_url
  } = req.body;

  // Handle file upload — convert to base64 data URL
  let finalLogoUrl = logo_url ?? null;
  if ((req as any).file) {
    const file = (req as any).file;
    const base64 = file.buffer.toString('base64');
    finalLogoUrl = `data:${file.mimetype};base64,${base64}`;
  }

  try {
    const [updated] = await sql`
      UPDATE startups
      SET 
        company_name = ${company_name ?? null},
        founder_name = ${founder_name ?? null},
        category = ${category ?? null},
        company_website = ${company_website !== undefined ? company_website : null},
        company_description = ${company_description !== undefined ? company_description : null},
        logo_url = COALESCE(${finalLogoUrl}, logo_url),
        linkedin_url = ${linkedin_url !== undefined ? linkedin_url : null},
        twitter_url = ${twitter_url !== undefined ? twitter_url : null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return res.status(404).json({ success: false, message: "Startup not found" });
    res.json({ success: true, message: "Startup updated successfully", data: updated });
  } catch (error: any) {
    console.error("Edit startup error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update startup" });
  }
};

/** Get students assigned to a specific startup */
export const getStartupStudents = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const [startupColumns, studentColumns, applicationColumns, jobColumns] = await Promise.all([
      getTableColumns("startups"),
      getTableColumns("students"),
      getTableColumns("applications"),
      getTableColumns("jobs"),
    ]);

    const startupNameExpr = startupColumns.has("company_name")
      ? "COALESCE(NULLIF(TRIM(company_name), ''), id::text)"
      : startupColumns.has("name")
      ? "COALESCE(NULLIF(TRIM(name), ''), id::text)"
      : "id::text";

    const startupRows = await query(
      `SELECT id::text as id, ${startupNameExpr} as startup_name
       FROM startups
       WHERE id::text = $1::text
       LIMIT 1`,
      [id]
    );
    const startup = startupRows[0];

    if (!startup) {
      return res.status(404).json({ success: false, message: "Startup not found" });
    }

    const startupLabels = [startup.id, startup.startup_name]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    const startupLabelKeys = Array.from(
      new Set(startupLabels.map((value) => value.toLowerCase()))
    );

    const studentDepartmentExpr = studentColumns.has("department")
      ? "department::text"
      : studentColumns.has("dept")
      ? "dept::text"
      : "NULL::text";
    const studentYearExpr = studentColumns.has("year")
      ? "year::text"
      : studentColumns.has("roll")
      ? "roll::text"
      : "NULL::text";
    const studentNameExpr = studentColumns.has("name")
      ? "name::text"
      : studentColumns.has("student_name")
      ? "student_name::text"
      : "NULL::text";
    const studentEmailExpr = studentColumns.has("email") ? "email::text" : "NULL::text";
    const studentCreatedAtExpr = studentColumns.has("created_at") ? "created_at" : "NOW()";
    const studentProfilePhotoExpr = studentColumns.has("profile_photo") ? "profile_photo::text" : "NULL::text";
    const studentProfilePhotoExprAliased = studentColumns.has("profile_photo") ? "s.profile_photo::text" : "NULL::text";
    const studentEducationsExpr = studentColumns.has("educations") ? "educations" : "NULL";
    const studentEducationsExprAliased = studentColumns.has("educations") ? "s.educations" : "NULL";
    const studentProjectionNoAlias = `id::text as id, ${studentNameExpr} as name, ${studentEmailExpr} as email, ${studentDepartmentExpr} as department, ${studentEducationsExpr} as educations, ${studentCreatedAtExpr} as created_at, ${studentProfilePhotoExpr} as profile_photo`;
    const studentProjectionWithAlias = `s.id::text as id, ${studentColumns.has("name") ? "s.name::text" : studentColumns.has("student_name") ? "s.student_name::text" : "NULL::text"} as name, ${studentColumns.has("email") ? "s.email::text" : "NULL::text"} as email, ${studentColumns.has("department") ? "s.department::text" : studentColumns.has("dept") ? "s.dept::text" : "NULL::text"} as department, ${studentEducationsExprAliased} as educations, ${studentColumns.has("created_at") ? "s.created_at" : "NOW()"} as created_at, ${studentProfilePhotoExprAliased} as profile_photo`;

    const studentQueries: Promise<any[]>[] = [];
    const studentStartupColumns = ["startup_id", "assigned_startup", "startup"].filter((columnName) =>
      studentColumns.has(columnName)
    );
    studentStartupColumns.forEach((columnName) => {
      studentQueries.push(
        query(
          `SELECT ${studentProjectionNoAlias}
           FROM students
           WHERE LOWER(TRIM(COALESCE(${columnName}::text, ''))) = ANY($1::text[])
           ORDER BY ${studentCreatedAtExpr} DESC`,
          [startupLabelKeys]
        )
      );
    });

    const studentResultSets = await Promise.all(studentQueries);
    const studentsById = new Map<string, any>();
    studentResultSets.flat().forEach((student: any) => {
      if (student?.id) {
        studentsById.set(String(student.id), student);
      }
    });

    const students = Array.from(studentsById.values());
    const existingIds = Array.from(studentsById.keys());

    const appStartupColumn = ["startup_id", "startup", "startup_name"].find((columnName) =>
      applicationColumns.has(columnName)
    );
    const appStudentNameColumn = applicationColumns.has("student_name")
      ? "student_name"
      : applicationColumns.has("candidate_name")
      ? "candidate_name"
      : null;
    const appEmailColumn = applicationColumns.has("candidate_email")
      ? "candidate_email"
      : applicationColumns.has("email")
      ? "email"
      : null;
    const appliedOrderExpr = studentColumns.has("created_at")
      ? "s.created_at"
      : applicationColumns.has("applied_at")
      ? "a.applied_at"
      : applicationColumns.has("created_at")
      ? "a.created_at"
      : "a.id";

    const appWhereClauses: string[] = [];
    const appWhereParams: any[] = [];
    if (appStartupColumn) {
      appWhereParams.push(startupLabelKeys);
      appWhereClauses.push(
        `LOWER(TRIM(COALESCE(a.${appStartupColumn}::text, ''))) = ANY($${appWhereParams.length}::text[])`
      );
    }
    if (applicationColumns.has("job_id") && jobColumns.has("id") && jobColumns.has("startup_id")) {
      appWhereParams.push(String(startup.id));
      appWhereClauses.push(
        `EXISTS (SELECT 1 FROM jobs j WHERE j.id::text = a.job_id::text AND j.startup_id::text = $${appWhereParams.length}::text)`
      );
    }
    const appScopeWhere = appWhereClauses.length > 0 ? `(${appWhereClauses.join(" OR ")})` : "";

    let applied: any[] = [];
    const appQueries: Promise<any[]>[] = [];

    if (appScopeWhere && applicationColumns.has("student_id") && studentColumns.has("id")) {
      appQueries.push(
        query(
          `SELECT ${studentProjectionWithAlias}
           FROM applications a
           JOIN students s ON s.id::text = a.student_id::text
           WHERE ${appScopeWhere}
           ORDER BY ${appliedOrderExpr} DESC`,
          appWhereParams
        ).catch(() => [] as any[])
      );
    }

    if (appScopeWhere && appEmailColumn && studentColumns.has("email")) {
      appQueries.push(
        query(
          `SELECT ${studentProjectionWithAlias}
           FROM applications a
           JOIN students s ON LOWER(TRIM(COALESCE(s.email::text, ''))) = LOWER(TRIM(COALESCE(a.${appEmailColumn}::text, '')))
           WHERE ${appScopeWhere}
           ORDER BY ${appliedOrderExpr} DESC`,
          appWhereParams
        ).catch(() => [] as any[])
      );
    }

    if (appScopeWhere && appStudentNameColumn && studentColumns.has("name")) {
      appQueries.push(
        query(
          `SELECT ${studentProjectionWithAlias}
           FROM applications a
           JOIN students s ON LOWER(TRIM(COALESCE(s.name::text, ''))) = LOWER(TRIM(COALESCE(a.${appStudentNameColumn}::text, '')))
           WHERE ${appScopeWhere}
           ORDER BY ${appliedOrderExpr} DESC`,
          appWhereParams
        ).catch(() => [] as any[])
      );
    }

    const appResults = await Promise.all(appQueries);
    applied = appResults.flat();

    const appliedById = new Map<string, any>();
    applied.forEach((student: any) => {
      if (student?.id && !studentsById.has(String(student.id))) {
        appliedById.set(String(student.id), student);
      }
    });

    const combinedStudents = [...students, ...appliedById.values()];

    const resolvedStudents = combinedStudents.map((s: any) => {
      let degree = s.department;
      if (!degree && s.educations) {
        try {
          const edus = typeof s.educations === 'string' ? JSON.parse(s.educations) : s.educations;
          if (Array.isArray(edus) && edus.length > 0) {
            degree = edus[0].degree || null;
          }
        } catch {}
      }
      return {
        ...s,
        department: degree || s.department,
        profile_photo: resolveMediaUrl(req, s.profile_photo),
      };
    });

    res.json({ success: true, students: resolvedStudents, count: resolvedStudents.length });
  } catch (error: any) {
    console.error("Get startup students error:", error.message, error.code || "");
    const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    res.status(500).json({
      success: false,
      message: "Failed to fetch startup students",
      ...(isProd ? {} : { debug: { code: error.code || null, detail: error.message || "unknown error" } }),
    });
  }
};

/** Get tracking analytics for a specific startup (Applications trend + recent apps) */
export const getStartupTrackingById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const startupRows = await sql`SELECT id FROM startups WHERE id::text = ${id}::text LIMIT 1`;
    if (!startupRows[0]) return res.status(404).json({ success: false, message: "Startup not found" });

    const [applicationColumns, jobColumns] = await Promise.all([
      getTableColumns("applications"),
      getTableColumns("jobs"),
    ]);

    const appAppliedAtColumn = applicationColumns.has("applied_at") ? "applied_at" : null;
    const appJobIdColumn = applicationColumns.has("job_id") ? "job_id" : null;
    const jobIdColumn = jobColumns.has("id") ? "id" : null;
    const jobStartupIdColumn = jobColumns.has("startup_id") ? "startup_id" : null;

    if (!appAppliedAtColumn || !appJobIdColumn || !jobIdColumn || !jobStartupIdColumn) {
      console.warn("Startup tracking fallback: required columns missing", {
        appAppliedAtColumn,
        appJobIdColumn,
        jobIdColumn,
        jobStartupIdColumn,
      });
      return res.json({
        success: true,
        tracking: {
          weeklyTrend: [],
          monthlyTrend: [],
          recentApplications: [],
        },
      });
    }

    const appStudentNameExpr = applicationColumns.has("student_name")
      ? "a.student_name::text"
      : applicationColumns.has("candidate_name")
      ? "a.candidate_name::text"
      : "'Unknown'::text";
    const appStatusExpr = applicationColumns.has("status") ? "a.status::text" : "'N/A'::text";
    const jobTitleExpr = jobColumns.has("title") ? "j.title::text" : "'N/A'::text";
    const appCountExpr = applicationColumns.has("id") ? "a.id" : `a.${appJobIdColumn}`;

    // 1. Weekly Application Trend (Last 7 days)
    const weeklyTrend = await query(
      `SELECT
         TO_CHAR(d, 'Mon DD') AS label,
        COUNT(${appCountExpr}) FILTER (WHERE j.${jobStartupIdColumn}::text = $1::text)::int AS value
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
       LEFT JOIN applications a ON DATE(a.${appAppliedAtColumn}) = d
       LEFT JOIN jobs j ON j.${jobIdColumn}::text = a.${appJobIdColumn}::text
       GROUP BY d
       ORDER BY d`,
      [id]
    );

    // 2. Monthly Application Trend (Last 6 months)
    const monthlyTrend = await query(
      `SELECT
         TO_CHAR(d, 'Mon') AS label,
        COUNT(${appCountExpr}) FILTER (WHERE j.${jobStartupIdColumn}::text = $1::text)::int AS value
       FROM generate_series(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months', DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) d
       LEFT JOIN applications a ON DATE_TRUNC('month', a.${appAppliedAtColumn}) = d
       LEFT JOIN jobs j ON j.${jobIdColumn}::text = a.${appJobIdColumn}::text
       GROUP BY d
       ORDER BY d`,
      [id]
    );

    // 3. Recent Applications
    const appStudentIdExpr = applicationColumns.has("student_id") ? "a.student_id::text" : "NULL::text";
    const recentApplications = await query(
      `SELECT
         a.id::text as id,
         ${appStudentIdExpr} as student_id,
         ${appStudentNameExpr} as student_name,
         ${appStatusExpr} as status,
         a.${appAppliedAtColumn} as applied_at,
         ${jobTitleExpr} as job_title
       FROM applications a
       JOIN jobs j ON j.${jobIdColumn}::text = a.${appJobIdColumn}::text
       WHERE j.${jobStartupIdColumn}::text = $1::text
       ORDER BY a.${appAppliedAtColumn} DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      tracking: {
        weeklyTrend,
        monthlyTrend,
        recentApplications
      }
    });
  } catch (error: any) {
    console.error("Get startup tracking error:", error.message, error.code || "");
    const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    res.status(500).json({
      success: false,
      message: "Failed to fetch startup tracking analytics",
      ...(isProd ? {} : { debug: { code: error.code || null, detail: error.message || "unknown error" } }),
    });
  }
};

/** Get public startup profile (accessible to students) */
export const getPublicStartupProfile = async (req: Request, res: Response): Promise<any> => {
  const { startupId } = req.params;

  try {
    const profileJoin = await buildStartupProfilesJoin("sp", "s");
    const [startup] = await query(
      `SELECT 
        s.id, 
        s.company_name, 
        s.founder_name, 
        s.company_description, 
        s.company_website, 
        s.linkedin_url, 
        s.twitter_url, 
        s.instagram_url,
        s.github_url,
        s.physical_photos,
        s.logo_url,
        s.category,
        s.status,
        ${profileJoin.avatarSelect} as avatar_url
      FROM startups s
      ${profileJoin.join}
      WHERE s.id::text = $1::text AND s.status = 'ACTIVE'`,
      [startupId]
    );

    if (!startup) {
      return res.status(404).json({ success: false, message: "Startup profile not found" });
    }

    const profile = {
      ...startup,
      logo_url: resolveMediaUrl(req, startup.logo_url || startup.avatar_url),
    };
    delete profile.avatar_url;

    res.json({ success: true, profile });
  } catch (error: any) {
    console.error("Get public startup profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch startup profile" });
  }
};
/** Get all startups with subscription/trial status for admin */
export const getSubscriptions = async (req: Request, res: Response): Promise<any> => {
  console.log('[Admin] Fetching subscriptions...');
  try {
    // First, auto-lock any trial companies whose trial period has expired
    await query(
      `UPDATE startups
       SET is_locked = true, locked_at = NOW()
       WHERE is_locked = false
         AND plan_type = 'trial'
         AND COALESCE(trial_started_at, created_at) + INTERVAL '7 days' < NOW()`
    );

    // Also lock paid plan companies whose plan has expired
    await query(
      `UPDATE startups
       SET is_locked = true, locked_at = NOW()
       WHERE is_locked = false
         AND plan_type = 'paid'
         AND plan_expires_at IS NOT NULL
         AND plan_expires_at < NOW()`
    );
    const appColumns = await getTableColumns("applications");
    const hiredCondition = appColumns.has("stage")
      ? "a.stage = 'selected'"
      : appColumns.has("status")
        ? "a.status = 'selected'"
        : "FALSE";
    const rows = await query(
      `SELECT
         s.id, s.company_name, s.email, s.status, s.is_locked,
         s.plan_type, s.trial_started_at, s.plan_expires_at, s.locked_at,
         COALESCE((SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id::text = a.job_id::text WHERE j.startup_id::text = s.id::text AND ${hiredCondition}), 0)::int as hired_students,
         COALESCE((SELECT SUM(sp2.amount_paise) / 100 FROM subscription_payments sp2 WHERE sp2.startup_id::text = s.id::text AND sp2.status = 'paid'), 0)::int as total_paid,
         (SELECT sp3.created_at FROM subscription_payments sp3 WHERE sp3.startup_id::text = s.id::text AND sp3.status = 'paid' ORDER BY sp3.created_at DESC LIMIT 1) as last_payment_date,
         CASE
           WHEN s.is_locked THEN 0
           WHEN s.plan_type = 'trial'
             THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (COALESCE(s.trial_started_at, s.created_at) + INTERVAL '7 days' - NOW())) / 86400))::int
           WHEN s.plan_type = 'paid' AND s.plan_expires_at IS NOT NULL
             THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (s.plan_expires_at - NOW())) / 86400))::int
           ELSE 0
         END as days_remaining
       FROM startups s
       ORDER BY s.is_locked DESC, s.created_at DESC`
    );
    return res.json({ success: true, startups: rows });
  } catch (err: any) {
    console.error('[Admin] getSubscriptions error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** Manually unlock a startup account */
export const unlockStartup = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    await query(
      `UPDATE startups SET is_locked = false, locked_at = NULL, plan_type = 'paid', plan_expires_at = $1, status = 'ACTIVE' WHERE id = $2`,
      [expiresAt.toISOString(), id]
    );
    logAdminAction(req, 'MANUAL_UNLOCK_STARTUP', 'startup', String(id), '', { note: 'Admin manually unlocked' });
    return res.json({ success: true, message: 'Startup unlocked for 10 days.' });
  } catch (err: any) {
    console.error('[Admin] unlockStartup error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
