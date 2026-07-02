import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import { listJobs, getJobById, getJobApplicationsTracking, createJob, updateJob, updateJobStatus, deleteJob } from '../controllers/startupJobController';

router.get('/', protect, listJobs);
router.get('/:id/applications', protect, getJobApplicationsTracking);
router.get('/:id', protect, getJobById);
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.patch('/:id/status', protect, updateJobStatus);
router.delete('/:id', protect, deleteJob);

export default router;
