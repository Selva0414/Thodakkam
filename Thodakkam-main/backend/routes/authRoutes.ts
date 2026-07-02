import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth';
import {
        register,
        verifyOtp,
        resendOtp,
        login,
        requestPasswordReset,
        resetPassword,
        getProfile,
        updateProfile,
        acceptPlatformRules,
} from '../controllers/startupAuthController';

import upload from '../middleware/upload';

router.post("/register", upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'physicalPhotos', maxCount: 10 },
  { name: 'certificateFile', maxCount: 1 }
]), register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password/request-otp", requestPasswordReset);
router.post("/forgot-password/reset", resetPassword);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.post("/accept-rules", protect, acceptPlatformRules);

export default router;
