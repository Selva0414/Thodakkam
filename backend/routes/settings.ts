import express from 'express';
const router = express.Router();
import multer from 'multer';
import { 
  getProfile, 
  updateProfile, 
  updatePreferences,
  requestCredentialChangeOtp,
  verifyCredentialChange
} from '../controllers/settingsController';
import { protect } from '../middleware/auth';

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });

router.use(protect);

// @route GET /api/admin/settings/profile
router.get("/profile", getProfile);

// @route PUT /api/admin/settings/profile
router.put("/profile", memUpload.single('avatarFile'), updateProfile);

// @route PUT /api/admin/settings/preferences
router.put("/preferences", updatePreferences);

// @route POST /api/admin/settings/request-credential-change-otp
router.post("/request-credential-change-otp", requestCredentialChangeOtp);

// @route POST /api/admin/settings/verify-credential-change
router.post("/verify-credential-change", verifyCredentialChange);

export default router;

// Trigger restart 2
