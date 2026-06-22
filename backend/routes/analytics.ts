import express from 'express';
const router = express.Router();
import { getMetrics, getEngagementMetrics, getPlatformHealth } from '../controllers/analyticsController';
import { protect } from '../middleware/auth';

router.use(protect);

// @route GET /api/admin/analytics
router.get("/", getMetrics);

// @route GET /api/admin/analytics/engagement
router.get("/engagement", getEngagementMetrics);

// @route GET /api/admin/analytics/platform-health
router.get("/platform-health", getPlatformHealth);

export default router;
