import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import { getDashboardStats } from '../controllers/startupDashboardController';

router.get("/", protect, getDashboardStats);

export default router;
