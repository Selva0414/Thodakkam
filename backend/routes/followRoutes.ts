import express from 'express';
import { protect } from '../middleware/auth';
import * as followController from '../controllers/followController';

const router = express.Router();

router.use(protect);

// POST /api/follow/:id
router.post('/follow/:id', followController.followUser);
// POST /api/unfollow/:id
router.post('/unfollow/:id', followController.unfollowUser);
// GET /api/followers/:id
router.get('/followers/:id', followController.getFollowers);
// GET /api/following/:id
router.get('/following/:id', followController.getFollowing);
// GET /api/mutual/:id
router.get('/mutual/:id', followController.isMutual);

export default router;
