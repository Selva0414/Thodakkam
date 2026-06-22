import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import {
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplicationStage,
  updateOfferLetter,
  listRescheduleRequests,
  acceptRescheduleRequest,
  rejectRescheduleRequest,
} from '../controllers/startupApplicationController';

router.use(protect);
router.get('/reschedule-requests', listRescheduleRequests);
router.get('/reschedule_requests', listRescheduleRequests);
router.post('/:id/reschedule/accept', acceptRescheduleRequest);
router.post('/:id/reschedule/reject', rejectRescheduleRequest);
router.get('/', listApplications);
router.get('/:id', getApplicationById);
router.patch('/:id/status', updateApplicationStatus);
router.patch('/:id/stage', updateApplicationStage);
router.patch('/:id/offer-letter', updateOfferLetter);

export default router;
