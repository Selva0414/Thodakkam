import express from 'express';
const router = express.Router();
import * as studentController from '../controllers/studentController';
import { protectStudent } from '../middleware/auth';
import upload from '../middleware/upload';

// Debug Ping
router.post('/ping', (req, res) => res.json({ message: 'router_works' }));

// Change password (protected)
router.post('/:studentId/change-password', protectStudent, studentController.changeStudentPassword);

// POST /api/students/register
router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 }
]), studentController.registerStudent);

// POST /api/students/login
router.post('/login', studentController.loginStudent);

// Forgot password (OTP flow)
router.post('/auth/forgot-password/request-otp', studentController.requestStudentPasswordReset);
router.post('/auth/forgot-password/reset', studentController.resetStudentPassword);

// POST /api/students/forgot-password (link-based flow - same handler)
router.post('/forgot-password', studentController.forgotPassword);

// POST /api/students/reset-password
router.post('/reset-password', studentController.resetPassword);

// Streak routes (protected)
router.get('/streak/status', protectStudent, studentController.getStreakStatus);
router.post('/streak/update', protectStudent, studentController.updateStreak);

// GET /api/students/search (static routes first)
router.get('/search', studentController.searchStudents);

// Student Assessment Routes (protected) - static routes before parameterized
router.get('/assessments', protectStudent, studentController.getStudentAssessments);
router.get('/assessments/:assessmentId/questions', protectStudent, studentController.getAssessmentQuestions);
router.post('/assessments/:assessmentId/submit', protectStudent, studentController.submitAssessment);

// Code execution routes (protected)
router.post('/code/run', protectStudent, studentController.runCode);
router.post('/assessments/:assessmentId/submit-code', protectStudent, studentController.submitCode);

// Notifications routes
router.patch('/notifications/:notificationId/read', protectStudent, studentController.markNotificationRead);
router.patch('/:studentId/notifications/read-all', protectStudent, studentController.markAllNotificationsRead);
router.get('/:studentId/notifications', studentController.getNotifications);
router.delete('/notifications/:notificationId', protectStudent, studentController.deleteNotification);

// Parameterized routes last
// GET /api/students/:studentId/dashboard
router.get('/:studentId/dashboard', studentController.getDashboard);

// GET /api/students/:studentId/profile
router.get('/:studentId/profile', studentController.getStudentProfile);

// GET /api/students/:studentId/referrals
router.get('/:studentId/referrals', protectStudent, studentController.getReferrals);

// GET /api/students/:studentId/avatar
router.get('/:studentId/avatar', studentController.getStudentAvatar);

// PUT /api/students/:studentId/profile
router.put('/:studentId/profile', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 }
]), studentController.updateStudentProfile);

// POST /api/students/:studentId/reanalyze-resume
// Triggers AI analysis on the student's existing stored resume (no file upload needed)
router.post('/:studentId/reanalyze-resume', studentController.reanalyzeResume);

export default router;
