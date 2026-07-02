import express from 'express';
import { getStatus, createOrder, verifyPayment, getJobsDomain } from '../controllers/subscriptionController';

const router = express.Router();

router.get('/status', getStatus);
router.get('/jobs-domain', getJobsDomain);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
