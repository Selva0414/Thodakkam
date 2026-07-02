import express from 'express';
const router = express.Router();
import { register, verifyOtp, login, resendOtp, requestAdminPasswordReset, resetAdminPassword } from '../controllers/authController';

// @route POST /api/admin/register
router.post("/register", register);

// @route POST /api/admin/verify-otp
router.post("/verify-otp", verifyOtp);

// @route POST /api/admin/resend-otp
router.post("/resend-otp", resendOtp);

// @route POST /api/admin/login
router.post("/login", login);

// @route POST /api/admin/forgot-password/request-otp
router.post("/forgot-password/request-otp", requestAdminPasswordReset);

// @route POST /api/admin/forgot-password/reset
router.post("/forgot-password/reset", resetAdminPassword);

export default router;
