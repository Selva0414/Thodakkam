import express from 'express';
const router = express.Router();
import { 
  listStudents, 
  getStudentStats, 
  editStudent, 
  updateStudentStatus, 
  deleteStudent,
  createStudent
} from '../controllers/studentsController';
import { protect } from '../middleware/auth';

router.use(protect);

// @route GET /api/admin/students
router.get("/", listStudents);

// @route GET /api/admin/students/stats
router.get("/stats", getStudentStats);

// @route PATCH /api/admin/students/:id
router.patch("/:id", editStudent);

// @route PATCH /api/admin/students/:id/status
router.patch("/:id/status", updateStudentStatus);

// @route DELETE /api/admin/students/:id
router.delete("/:id", deleteStudent);

// @route POST /api/admin/students
router.post("/", createStudent);

export default router;
