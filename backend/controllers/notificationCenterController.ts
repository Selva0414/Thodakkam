import { Request, Response } from "express";
import { sql, query } from "../config/database";
import NotificationModel from "../models/notificationModel";
import AdminAnnouncementModel from "../models/adminAnnouncementModel";
import { logAdminAction } from "./auditLogController";

/** Initialize announcements table */
export const initAnnouncementsTable = async () => {
  try {
    await AdminAnnouncementModel.createTable();
    console.log("✅ admin_announcements table ready");
  } catch (err: any) {
    console.error("Failed to create announcements table:", err.message);
  }
};

/** POST /api/admin/notifications/announce — Send announcement to users */
export const sendAnnouncement = async (req: Request, res: Response): Promise<any> => {
  const { title, message, target_audience, priority } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  const validTargets = ["all", "students", "startups"];
  const target = validTargets.includes(target_audience) ? target_audience : "all";

  try {
    const admin = (req as any).admin || (req as any).user;
    const admin_id = admin?.id?.toString() || "unknown";
    const admin_name = admin?.name || admin?.email || "Admin";

    let recipientCount = 0;

    const notifType = priority === "urgent" ? "security" : "general";
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    // Send to students
    if (target === "all" || target === "students") {
      // Insert one row per student in a single statement using INSERT ... SELECT.
      try {
        await query(
          `INSERT INTO notifications (student_id, title, message, type)
           SELECT id::text, $1, $2, $3 FROM students`,
          [trimmedTitle, trimmedMessage, notifType]
        );
      } catch (e: any) {
        console.error("[announce] bulk student notification insert failed:", e?.message);
      }

      const students = await query(`SELECT id FROM students`);
      const io = req.app.get("io");
      if (io) {
        // Fire-and-forget socket fan-out in parallel; don't block the HTTP response.
        await Promise.all(students.map(async (student: any) => {
          try {
            const unreadCount = await NotificationModel.getUnreadCount(student.id).catch(() => 0);
            io.to(`${student.id}_student`).emit("new_notification", {
              notification: { title: trimmedTitle, message: trimmedMessage, type: notifType },
              unreadCount,
            });
          } catch {}
        }));
      }
      recipientCount += students.length;
    }

    // Send to startups
    if (target === "all" || target === "startups") {
      try {
        await query(
          `INSERT INTO notifications (student_id, startup_id, title, message, type)
           SELECT '0', id::text, $1, $2, $3 FROM startups`,
          [trimmedTitle, trimmedMessage, notifType]
        );
      } catch (e: any) {
        console.error("[announce] bulk startup notification insert failed:", e?.message);
      }

      const startups = await query(`SELECT id FROM startups`);
      const io = req.app.get("io");
      if (io) {
        await Promise.all(startups.map(async (startup: any) => {
          try {
            const unreadCount = await NotificationModel.getStartupUnreadCount(startup.id).catch(() => 0);
            io.to(`${startup.id}_startup`).emit("new_notification", {
              notification: { title: trimmedTitle, message: trimmedMessage, type: notifType },
              unreadCount,
            });
          } catch {}
        }));
      }
      recipientCount += startups.length;
    }

    // Save announcement record
    const announcement = await AdminAnnouncementModel.create({
      admin_id,
      admin_name,
      title: title.trim(),
      message: message.trim(),
      target_audience: target,
      priority: priority || "normal",
      recipient_count: recipientCount,
    });

    logAdminAction(req, "SEND_ANNOUNCEMENT", "announcement", String(announcement.id), title.trim(), {
      target_audience: target,
      priority,
      recipientCount,
    });

    res.json({
      success: true,
      message: `Announcement sent to ${recipientCount} recipients`,
      announcement,
    });
  } catch (error: any) {
    console.error("Send announcement error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send announcement" });
  }
};

/** GET /api/admin/notifications/announcements — List sent announcements */
export const listAnnouncements = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await AdminAnnouncementModel.list({ page, limit });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("List announcements error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
};

/** DELETE /api/admin/notifications/announcements/:id */
export const deleteAnnouncement = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    // Fetch announcement first so we can cascade-delete matching notifications
    const [announcement] = await query(
      `SELECT title, message FROM admin_announcements WHERE id = $1`,
      [parseInt(String(id))]
    );
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found" });

    // Delete from admin_announcements
    await AdminAnnouncementModel.delete(parseInt(String(id)));

    // Cascade: delete individual notifications with matching title+message
    await query(
      `DELETE FROM notifications WHERE title = $1 AND message = $2`,
      [announcement.title, announcement.message]
    );

    logAdminAction(req, "DELETE_ANNOUNCEMENT", "announcement", String(id));
    res.json({ success: true, message: "Announcement deleted" });
  } catch (error: any) {
    console.error("Delete announcement error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete announcement" });
  }
};

/** GET /api/admin/notifications/stats — Notification platform stats */
export const getNotificationStats = async (_req: Request, res: Response): Promise<any> => {
  try {
    const [totalNotifs] = await query(`SELECT count(*)::int as count FROM notifications`);
    const [unreadNotifs] = await query(`SELECT count(*)::int as count FROM notifications WHERE is_read = false`);
    const [todayNotifs] = await query(`SELECT count(*)::int as count FROM notifications WHERE created_at >= CURRENT_DATE`);
    const [totalAnnouncements] = await query(`SELECT count(*)::int as count FROM admin_announcements`);

    const recentAnnouncements = await query(
      `SELECT id, title, target_audience, priority, recipient_count,
              to_char(created_at, 'YYYY-MM-DD HH24:MI') as created_at
       FROM admin_announcements ORDER BY created_at DESC LIMIT 5`
    );

    const typeBreakdown = await query(
      `SELECT COALESCE(type, 'general') as type, count(*)::int as count
       FROM notifications
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY type ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        totalNotifications: totalNotifs?.count || 0,
        unreadNotifications: unreadNotifs?.count || 0,
        todayNotifications: todayNotifs?.count || 0,
        totalAnnouncements: totalAnnouncements?.count || 0,
        recentAnnouncements,
        typeBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Notification stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch notification stats" });
  }
};
