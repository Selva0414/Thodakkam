import express from 'express';
const router = express.Router();
import { protectStudent } from '../middleware/auth';
import {
  getMyInterviews,
  getStudentInterviews,
  attendInterview,
  respondInterview
} from '../controllers/interviewController';

router.get("/me", protectStudent, getMyInterviews);
router.get("/:studentId", getStudentInterviews);
router.post("/:id/attend", protectStudent, attendInterview);
router.post("/:id/respond", protectStudent, respondInterview);

export default router;
