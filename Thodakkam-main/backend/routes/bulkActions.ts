import express from "express";
import {
  bulkUpdateStartupStatus,
  bulkUpdateStudentStatus,
  bulkDeleteStartups,
  bulkDeleteStudents,
} from "../controllers/bulkActionsController";
import { protect } from "../middleware/auth";

const router = express.Router();
router.use(protect);

// @route POST /api/admin/bulk/startups/status
router.post("/startups/status", bulkUpdateStartupStatus);

// @route POST /api/admin/bulk/students/status
router.post("/students/status", bulkUpdateStudentStatus);

// @route DELETE /api/admin/bulk/startups
router.delete("/startups", bulkDeleteStartups);

// @route DELETE /api/admin/bulk/students
router.delete("/students", bulkDeleteStudents);

export default router;
