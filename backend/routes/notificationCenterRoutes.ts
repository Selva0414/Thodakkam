import express from "express";
import {
  sendAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
  getNotificationStats,
} from "../controllers/notificationCenterController";
import { protect } from "../middleware/auth";

const router = express.Router();
router.use(protect);

// @route POST /api/admin/notifications/announce
router.post("/announce", sendAnnouncement);

// @route GET /api/admin/notifications/announcements
router.get("/announcements", listAnnouncements);

// @route DELETE /api/admin/notifications/announcements/:id
router.delete("/announcements/:id", deleteAnnouncement);

// @route GET /api/admin/notifications/stats
router.get("/stats", getNotificationStats);

export default router;
