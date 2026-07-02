import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../controllers/userProfileController';

const router = express.Router();

// Use memory storage — the buffer is converted to a base64 data URL and
// stored directly in the database. No files are written to disk.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 800 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and GIF files are allowed'));
    }
    return cb(null, true);
  },
});

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/upload', (req, res, next) => {
  avatarUpload.single('profileImage')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image must be smaller than 800KB' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Invalid avatar upload' });
  });
}, uploadAvatar);
router.post('/upload-avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image must be smaller than 800KB' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Invalid avatar upload' });
  });
}, uploadAvatar);
router.post('/change-password', changePassword);

export default router;
