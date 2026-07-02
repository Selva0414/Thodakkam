import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { sendApprovalEmail, sendStudentStatusEmail } from "../services/emailService";
import NotificationModel from "../models/notificationModel";
import { logAdminAction } from "./auditLogController";

/** POST /api/admin/bulk/startups/status — Bulk update startup statuses */
export const bulkUpdateStartupStatus = async (req: Request, res: Response): Promise<any> => {
  const { ids, status, reason } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No startup IDs provided" });
  }
  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  const normalizeStatus = (value: string) => {
    const upper = String(value).trim().toUpperCase();
    if (upper === "APPROVED" || upper === "APPROVE") return "ACTIVE";
    if (upper === "REJECT") return "REJECTED";
    if (upper === "SUSPEND") return "SUSPENDED";
    return upper;
  };
  const nextStatus = normalizeStatus(status);
  const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];
  if (!validStatuses.includes(nextStatus)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  if ((nextStatus === "REJECTED" || nextStatus === "SUSPENDED") && (!reason || !reason.trim())) {
    return res.status(400).json({ success: false, message: "A reason is required when rejecting or suspending" });
  }

  try {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    await Promise.all(ids.map(async (id) => {
      try {
        const [startup] = await sql`SELECT id, founder_name, company_name, email, status as current_status FROM startups WHERE id = ${id}`;
        if (!startup) {
          results.failed++;
          results.errors.push(`Startup ${id} not found`);
          return;
        }

        if (nextStatus === "ACTIVE") {
          await sql`UPDATE startups SET status = ${nextStatus}, is_verified = true, reject_reason = NULL, suspend_reason = NULL, updated_at = NOW() WHERE id = ${id}`;
        } else if (nextStatus === "REJECTED") {
          await sql`UPDATE startups SET status = ${nextStatus}, reject_reason = ${reason.trim()}, updated_at = NOW() WHERE id = ${id}`;
        } else if (nextStatus === "SUSPENDED") {
          await sql`UPDATE startups SET status = ${nextStatus}, suspend_reason = ${reason.trim()}, updated_at = NOW() WHERE id = ${id}`;
        } else {
          await sql`UPDATE startups SET status = ${nextStatus}, updated_at = NOW() WHERE id = ${id}`;
        }

        // Send email notification
        const currentStatus = String(startup.current_status || "").toUpperCase();
        if (currentStatus !== nextStatus && ["ACTIVE", "REJECTED", "SUSPENDED"].includes(nextStatus)) {
          sendApprovalEmail(startup.email, startup.founder_name, startup.company_name, nextStatus, reason?.trim())
            .catch((e: any) => console.error(`Bulk email error for ${startup.email}:`, e.message));

          // In-app notification
          const notifMap: Record<string, { type: string; title: string; message: string }> = {
            ACTIVE: { type: "success", title: "Startup Approved!", message: `Your startup ${startup.company_name} has been approved.` },
            REJECTED: { type: "warning", title: "Application Update", message: `Your startup ${startup.company_name} was not approved. Reason: ${reason?.trim()}` },
            SUSPENDED: { type: "security", title: "Account Suspended", message: `Your startup ${startup.company_name} has been suspended. Reason: ${reason?.trim()}` },
          };
          const notifData = notifMap[nextStatus];
          if (notifData) {
            NotificationModel.createStartupNotification({
              startup_id: startup.id,
              title: notifData.title,
              message: notifData.message,
              type: notifData.type,
            }).catch(() => {});
          }
        }

        logAdminAction(req, `BULK_STARTUP_${nextStatus}`, "startup", String(id), startup.company_name, { bulkOperation: true });
        results.success++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`Startup ${id}: ${e.message}`);
      }
    }));

    logAdminAction(req, "BULK_UPDATE_STARTUPS", "startup", undefined, undefined, {
      ids,
      newStatus: nextStatus,
      successCount: results.success,
      failedCount: results.failed,
    });

    res.json({ success: true, message: `Bulk operation complete: ${results.success} updated, ${results.failed} failed`, results });
  } catch (error: any) {
    console.error("Bulk startup status error:", error.message);
    res.status(500).json({ success: false, message: "Bulk operation failed" });
  }
};

/** POST /api/admin/bulk/students/status — Bulk update student statuses */
export const bulkUpdateStudentStatus = async (req: Request, res: Response): Promise<any> => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No student IDs provided" });
  }
  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  try {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    await Promise.all(ids.map(async (id) => {
      try {
        const [student] = await sql`SELECT id, name, email, status as current_status FROM students WHERE id = ${id}`;
        if (!student) {
          results.failed++;
          results.errors.push(`Student ${id} not found`);
          return;
        }

        await sql`UPDATE students SET status = ${status} WHERE id = ${id}`;

        if (student.current_status !== status && student.email) {
          sendStudentStatusEmail(student.email, student.name, status)
            .catch((e: any) => console.error(`Bulk email error for ${student.email}:`, e.message));
        }

        logAdminAction(req, `BULK_STUDENT_${status.toUpperCase()}`, "student", String(id), student.name, { bulkOperation: true });
        results.success++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`Student ${id}: ${e.message}`);
      }
    }));

    logAdminAction(req, "BULK_UPDATE_STUDENTS", "student", undefined, undefined, {
      ids,
      newStatus: status,
      successCount: results.success,
      failedCount: results.failed,
    });

    res.json({ success: true, message: `Bulk operation complete: ${results.success} updated, ${results.failed} failed`, results });
  } catch (error: any) {
    console.error("Bulk student status error:", error.message);
    res.status(500).json({ success: false, message: "Bulk operation failed" });
  }
};

/** DELETE /api/admin/bulk/startups — Bulk delete startups */
export const bulkDeleteStartups = async (req: Request, res: Response): Promise<any> => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No startup IDs provided" });
  }

  try {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const id of ids) {
      try {
        await query(`DELETE FROM applications WHERE startup_id::text = $1`, [id]).catch(() => {});
        await query(`DELETE FROM startup_profiles WHERE startup_id::text = $1`, [id]).catch(() => {});
        try { await query(`UPDATE students SET assigned_startup = NULL WHERE assigned_startup::text = $1`, [id]); } catch {}
        const [deleted] = await sql`DELETE FROM startups WHERE id = ${id} RETURNING id, company_name`;
        if (!deleted) {
          results.failed++;
          results.errors.push(`Startup ${id} not found`);
          continue;
        }
        logAdminAction(req, "BULK_DELETE_STARTUP", "startup", String(id), deleted.company_name, { bulkOperation: true });
        results.success++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`Startup ${id}: ${e.message}`);
      }
    }

    logAdminAction(req, "BULK_DELETE_STARTUPS", "startup", undefined, undefined, {
      ids,
      successCount: results.success,
      failedCount: results.failed,
    });

    res.json({ success: true, message: `Deleted ${results.success} startups, ${results.failed} failed`, results });
  } catch (error: any) {
    console.error("Bulk delete startups error:", error.message);
    res.status(500).json({ success: false, message: "Bulk operation failed" });
  }
};

/** DELETE /api/admin/bulk/students — Bulk delete students */
export const bulkDeleteStudents = async (req: Request, res: Response): Promise<any> => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No student IDs provided" });
  }

  try {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const id of ids) {
      try {
        await query(`DELETE FROM applications WHERE student_id::text = $1`, [id]).catch(() => {});
        const [deleted] = await sql`DELETE FROM students WHERE id = ${id} RETURNING id, name`;
        if (!deleted) {
          results.failed++;
          results.errors.push(`Student ${id} not found`);
          continue;
        }
        logAdminAction(req, "BULK_DELETE_STUDENT", "student", String(id), deleted.name, { bulkOperation: true });
        results.success++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`Student ${id}: ${e.message}`);
      }
    }

    logAdminAction(req, "BULK_DELETE_STUDENTS", "student", undefined, undefined, {
      ids,
      successCount: results.success,
      failedCount: results.failed,
    });

    res.json({ success: true, message: `Deleted ${results.success} students, ${results.failed} failed`, results });
  } catch (error: any) {
    console.error("Bulk delete students error:", error.message);
    res.status(500).json({ success: false, message: "Bulk operation failed" });
  }
};
