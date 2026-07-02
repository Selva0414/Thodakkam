import { Router, Request, Response } from "express";
import NotificationModel from "../models/notificationModel";

const router = Router();

/** GET /api/notifications/startups/:startupId/notifications */
router.get("/startups/:startupId/notifications", async (req: Request, res: Response): Promise<any> => {
  const startupId = String(req.params.startupId);
  try {
    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.getStartupNotifications(startupId),
      NotificationModel.getStartupUnreadCount(startupId),
    ]);
    res.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    console.error("Get startup notifications error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

/** PATCH /api/notifications/startups/notifications/:id/read */
router.patch("/startups/notifications/:id/read", async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id);
  try {
    const notification = await NotificationModel.markStartupAsRead(id);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, notification });
  } catch (error: any) {
    console.error("Mark startup notification read error:", error.message);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
});

/** PATCH /api/notifications/startups/:startupId/notifications/read-all */
router.patch("/startups/:startupId/notifications/read-all", async (req: Request, res: Response): Promise<any> => {
  const startupId = String(req.params.startupId);
  try {
    await NotificationModel.markAllStartupAsRead(startupId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Mark all startup notifications read error:", error.message);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

/** DELETE /api/notifications/startups/notifications/:id */
router.delete("/startups/notifications/:id", async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id);
  try {
    const deleted = await NotificationModel.deleteNotification(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete startup notification error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
});

export default router;
