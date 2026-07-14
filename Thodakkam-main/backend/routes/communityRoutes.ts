import express from 'express';
const router = express.Router();
import * as communityController from '../controllers/communityController';
import { protectAny } from '../middleware/auth';

router.get('/posts', protectAny, communityController.getFeed);
router.get('/posts/:postId/media', protectAny, communityController.getPostMedia);
router.get('/meta', protectAny, communityController.getMeta);
router.post('/posts', protectAny, communityController.createNewPost);
router.post('/posts/:postId/like', protectAny, communityController.handleLike);
router.get('/posts/:postId/comments', protectAny, communityController.getComments);
router.post('/posts/:postId/comments', protectAny, communityController.addComment);
router.post('/posts/:postId/share', protectAny, communityController.sharePost);
router.post('/follow', protectAny, communityController.toggleFollow);
router.get('/follow-counts', protectAny, communityController.getFollowCounts);
router.get('/followers/:userId', protectAny, communityController.getFollowers);
router.get('/following/:userId', protectAny, communityController.getFollowing);
router.delete('/posts/:postId', protectAny, communityController.deletePost);
router.patch('/posts/:postId', protectAny, communityController.editPost);
router.post('/posts/:postId/save', protectAny, communityController.handleSavePost);
router.get('/saved', protectAny, communityController.getSavedPostsFeed);

export default router;
