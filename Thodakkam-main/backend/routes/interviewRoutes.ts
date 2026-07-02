import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import {
	scheduleInterview,
	getInterviews,
	getInterviewerOptions,
	updateInterviewStatus,
} from '../controllers/interviewController';

// ── Startup-side (requires startup JWT) ─────────────────────────────────────
router.use(protect);
router.get("/interviewers", getInterviewerOptions);
router.post(["/", "/schedule"], scheduleInterview);
router.get("/", getInterviews);
router.patch("/:id/status", updateInterviewStatus);

// ── Interview Round endpoints ───────────────────────────────────────────────
const { assignRounds, getRounds, updateRoundStatus: updateRound, addMeetLink } = require("../controllers/interviewRoundController");

router.post("/:id/rounds", assignRounds);
router.get("/:id/rounds", getRounds);
router.patch("/rounds/:roundId/status", updateRound);
router.patch("/rounds/:roundId/meet-link", addMeetLink);

export default router;
