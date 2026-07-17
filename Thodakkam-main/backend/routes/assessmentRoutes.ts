import express from 'express';
const router = express.Router();
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  generateDomainQuestions,
  bulkAddQuestions,
  assignToCandidate,
  getDomains,
  getAssessmentReport,
  getAssessmentByApplication,
  getAssessmentByJob,
  fetchLeetcodeQuestion,
  generateMcqWithGroq,
  evaluateCodeWithGroq
} from '../controllers/assessmentController';
import { protect, protectAny } from '../middleware/auth';

// Allow any user (including students) to view a single assessment by ID
router.get("/single/:id", protectAny, getAssessment);

router.use(protect);

// Assessment CRUD
router.post("/", createAssessment);
router.get("/", getAssessments);
router.get("/domains", getDomains);
router.get("/by-application/:applicationId", getAssessmentByApplication);
router.get("/by-job/:jobId", getAssessmentByJob);
router.get("/:id/report", getAssessmentReport);
router.get("/:id", getAssessment);
router.patch("/:id", updateAssessment);
router.delete("/:id", deleteAssessment);

// MCQ Questions
router.post("/:id/questions", addQuestion);
router.get("/:id/questions", getQuestions);
router.patch("/:id/questions/:questionId", updateQuestion);
router.delete("/:id/questions/:questionId", deleteQuestion);

// Domain-based question generation
router.post("/generate-questions", generateDomainQuestions);
router.post("/generate-mcq-ai", generateMcqWithGroq);
router.post("/evaluate-code", evaluateCodeWithGroq);
router.post("/fetch-leetcode", fetchLeetcodeQuestion);
router.post("/:id/questions/bulk", bulkAddQuestions);

// Candidate assignment
router.post("/assign", assignToCandidate);
router.post("/:id/assign", assignToCandidate);

export default router;
