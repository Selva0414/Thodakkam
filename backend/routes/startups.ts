import express from 'express';
import multer from 'multer';
const router = express.Router();
import { listStartups, updateStatus, deleteStartup, editStartup, getStartupById, getStartupStudents, getStartupTrackingById, getPublicStartupProfile, getSubscriptions, unlockStartup } from '../controllers/startupsController';

import { protect } from '../middleware/auth';

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 800 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and GIF images are allowed'));
    }
  }
});

// @route GET /api/startups/public/:startupId (no auth required)
router.get("/public/:startupId", getPublicStartupProfile);

router.use(protect);

// @route GET /api/admin/startups
router.get("/", listStartups);

// Subscription tracking
router.get("/subscriptions", getSubscriptions);

// @route GET /api/admin/startups/:id/tracking
router.get("/:id/tracking", getStartupTrackingById);

// @route GET /api/admin/startups/:id
router.get("/:id", getStartupById);

// @route GET /api/admin/startups/:id/students
router.get("/:id/students", getStartupStudents);

// @route PATCH /api/admin/startups/:id/status
router.patch("/:id/status", updateStatus);

// @route PATCH /api/admin/startups/:id
router.patch("/:id", logoUpload.single('logo'), editStartup);

// @route DELETE /api/admin/startups/:id
router.delete("/:id", deleteStartup);

router.post("/:id/unlock", unlockStartup);

export default router;
