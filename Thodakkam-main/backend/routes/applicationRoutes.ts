import express from 'express';
const router = express.Router();
import * as applicationController from '../controllers/applicationController';
import { protectStudent } from '../middleware/auth';

router.post('/apply', protectStudent, applicationController.applyToJob);
router.get('/student/:studentId', applicationController.getMyApplications);
router.get('/:id', applicationController.getApplicationById);
router.post('/:id/withdraw', applicationController.withdrawApplication);
router.post('/:id/reschedule', protectStudent, applicationController.requestReschedule);

export default router;
