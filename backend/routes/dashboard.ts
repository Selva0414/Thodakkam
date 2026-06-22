import express from 'express';
const router = express.Router();
import { getStats, getRecentApplications, getActionCenter, getSmartAlerts, getRegistrationTrend } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

// All dashboard routes are protected
router.use(protect);

// @route GET /api/admin/dashboard/stats
router.get("/stats", getStats);

// @route GET /api/admin/dashboard/recent-applications
router.get("/recent-applications", getRecentApplications);

// @route GET /api/admin/dashboard/action-center
router.get("/action-center", getActionCenter);

// @route GET /api/admin/dashboard/smart-alerts
router.get("/smart-alerts", getSmartAlerts);

// @route GET /api/admin/dashboard/registration-trend
router.get("/registration-trend", getRegistrationTrend);

export default router;
