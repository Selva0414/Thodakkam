import express from "express";
import {
  listAllApplications,
  getStudentApplications,
  getStudentTimeline,
  getStudentAnalytics,
} from "../controllers/adminApplicationController";
import { protect } from "../middleware/auth";

const router = express.Router();
router.use(protect);

// @route GET /api/admin/applications
router.get("/", listAllApplications);

// @route GET /api/admin/students/:id/applications
router.get("/students/:id/applications", getStudentApplications);

// @route GET /api/admin/students/:id/timeline
router.get("/students/:id/timeline", getStudentTimeline);

// @route GET /api/admin/students/:id/analytics
router.get("/students/:id/analytics", getStudentAnalytics);

export default router;
