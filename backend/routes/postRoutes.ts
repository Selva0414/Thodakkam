import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  toggleLike,
} from '../controllers/postController';

const router = express.Router();

const validatePostBody = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
  body('media')
    .optional({ nullable: true })
    .isString()
    .withMessage('Media must be a string URL')
    .isLength({ max: 2048 })
    .withMessage('Media URL is too long')
    .custom((value) => {
      const media = String(value || '').trim();
      if (!media) return true;

      const isHttpUrl = /^https?:\/\//i.test(media);
      const isDataUrl = /^data:(image|video)\//i.test(media);

      if (!isHttpUrl && !isDataUrl) {
        throw new Error('Media must be a valid http(s) URL or data URL');
      }

      if (isDataUrl) {
        const maxBytes = 2 * 1024 * 1024;
        const bytes = Buffer.byteLength(media, 'utf8');
        if (bytes > maxBytes) {
          throw new Error('Media payload too large (max 2MB)');
        }
      }

      return true;
    }),
  body('tags')
    .optional({ nullable: true })
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with max 10 items'),
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string')
    .isLength({ min: 1, max: 40 })
    .withMessage('Each tag must be 1 to 40 characters long'),
];

router.post('/', protect, validatePostBody, createPost);
router.get('/', getPosts);
router.put('/:id', protect, validatePostBody, updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, toggleLike);

export default router;
