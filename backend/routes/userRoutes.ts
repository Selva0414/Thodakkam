import express from 'express';
const router = express.Router();
import * as userController from '../controllers/userController';
import { protect } from '../middleware/auth';

// GET /api/users/search
// Requires authentication to search users
router.get('/search', protect, userController.searchCandidates);

export default router;
