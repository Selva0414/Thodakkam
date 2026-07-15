import express from 'express';
const router = express.Router();
import * as jobController from '../controllers/jobController';
import { protect } from '../middleware/auth';
import { getJobApplicationsTracking } from '../controllers/startupJobController';

router.get('/', jobController.listJobs);
router.get('/recommended', jobController.getRecommended);
router.get('/:id/applications', protect, getJobApplicationsTracking);
router.get('/startup/:companyName', jobController.getJobsByStartupName);
router.get('/:id', jobController.getJobById);

export default router;
