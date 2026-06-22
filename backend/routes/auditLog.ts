import express from "express";
import { getAuditLogs, getAuditStats, exportAuditLogs } from "../controllers/auditLogController";
import { protect } from "../middleware/auth";

const router = express.Router();
router.use(protect);

// @route GET /api/admin/audit-logs
router.get("/", getAuditLogs);

// @route GET /api/admin/audit-logs/stats
router.get("/stats", getAuditStats);

// @route GET /api/admin/audit-logs/export
router.get("/export", exportAuditLogs);

export default router;
