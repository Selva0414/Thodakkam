import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../config/database";
import sendEmail from "../utils/email";
import { recordAdminLoginFailure } from "../services/adminAlertService";
import dotenv from "dotenv";
dotenv.config();

import { Request, Response } from "express";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getClientIp = (req: Request): string => {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  if (forwarded) return forwarded.split(",")[0].trim();
  return String(req.socket?.remoteAddress || "unknown");
};

/** Register a new Master Admin */
export const register = async (req: Request, res: Response): Promise<any> => {
  const { adminName, email, password, accessKey } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  try {
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }
    if (!adminName || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (!process.env.MASTER_ACCESS_KEY || accessKey !== process.env.MASTER_ACCESS_KEY) {
      return res.status(403).json({ success: false, message: "Invalid Master Access Key" });
    }
    const existingAdmin = await sql`SELECT id, is_verified FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    if (existingAdmin.length > 0) {
      if (existingAdmin[0].is_verified) {
        return res.status(400).json({ success: false, message: "Admin already exists. Please login." });
      }
      await sql`DELETE FROM otp_codes WHERE LOWER(email) = LOWER(${normalizedEmail})`;
      await sql`DELETE FROM master_admins WHERE id = ${existingAdmin[0].id}`;
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const [admin] = await sql`
      INSERT INTO master_admins (admin_name, email, password_hash)
      VALUES (${adminName}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, admin_name, email
    `;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${normalizedEmail}, ${otp}, ${expiresAt})`;
    await sendEmail({
      email: normalizedEmail,
      subject: "Verify Your Master Admin Account",
      message: `Your verification code is: ${otp}`,
      html: `<h1>Email Verification</h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
    res.status(201).json({ success: true, message: "Admin registered successfully. Please verify your email.", email: normalizedEmail });
  } catch (error: any) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

/** Verify OTP */
export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  try {
    const [otpRecord] = await sql`
      SELECT * FROM otp_codes 
      WHERE LOWER(email) = LOWER(${normalizedEmail}) AND otp_code = ${otp} AND is_used = false AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    await sql`UPDATE otp_codes SET is_used = true WHERE id = ${otpRecord.id}`;
    await sql`UPDATE master_admins SET is_verified = true WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    const [admin] = await sql`SELECT id, admin_name, email, role FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    const token = jwt.sign({ id: admin.id, role: "admin" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
    res.json({ success: true, message: "Email verified successfully", token, admin: { id: admin.id, name: admin.admin_name, email: admin.email, role: admin.role } });
  } catch (error: any) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

/** Login Master Admin */
export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const ipAddress = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "unknown");
  try {
    if (!normalizedEmail) return res.status(400).json({ success: false, message: "Email is required" });
    const [admin] = await sql`SELECT * FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    if (!admin) {
      recordAdminLoginFailure({ email: normalizedEmail, ipAddress, userAgent }).catch(() => undefined);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = admin.password_hash ? await bcrypt.compare(password, admin.password_hash) : false;
    if (!isMatch) {
      recordAdminLoginFailure({ email: normalizedEmail, ipAddress, userAgent }).catch(() => undefined);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (!admin.is_verified) return res.status(401).json({ success: false, message: "Email not verified", requiresVerification: true });
    const token = jwt.sign({ id: admin.id, role: "admin" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
    res.json({ success: true, token, admin: { id: admin.id, name: admin.admin_name, email: admin.email, role: admin.role, avatar: admin.avatar_url } });
  } catch (error: any) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

/** Resend OTP to email */
export const resendOtp = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  try {
    const [admin] = await sql`SELECT id, is_verified FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    if (!admin) return res.status(404).json({ success: false, message: "No account found with this email" });
    if (admin.is_verified) return res.status(400).json({ success: false, message: "Email is already verified" });
    await sql`UPDATE otp_codes SET is_used = true WHERE LOWER(email) = LOWER(${normalizedEmail}) AND is_used = false`;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${normalizedEmail}, ${otp}, ${expiresAt})`;
    await sendEmail({ email: normalizedEmail, subject: "Your New Verification Code", message: `Your verification code is: ${otp}`, html: `<h1>Email Verification</h1><p>Your new verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>` });
    res.json({ success: true, message: "OTP resent successfully" });
  } catch (error: any) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

/** Request password reset OTP for Master Admin */
export const requestAdminPasswordReset = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const [admin] = await sql`SELECT id, admin_name FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    // Always return success to avoid email enumeration
    if (!admin) return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });

    await sql`UPDATE otp_codes SET is_used = true WHERE LOWER(email) = LOWER(${normalizedEmail}) AND is_used = false`;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${normalizedEmail}, ${otp}, ${expiresAt})`;
    await sendEmail({
      email: normalizedEmail,
      subject: "Password Reset - Master Admin",
      message: `Your password reset code is: ${otp}`,
      html: `<h1>Password Reset</h1><p>Hi ${admin.admin_name},</p><p>Your password reset code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p><p>If you didn't request this, please ignore this email.</p>`
    });

    return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });
  } catch (error: any) {
    console.error("Request admin password reset error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to process password reset request" });
  }
};

/** Reset Master Admin password with OTP */
export const resetAdminPassword = async (req: Request, res: Response): Promise<any> => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  if (String(newPassword).length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

  try {
    const [otpRecord] = await sql`SELECT * FROM otp_codes WHERE LOWER(email) = LOWER(${normalizedEmail}) AND otp_code = ${otp} AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;
    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    const [admin] = await sql`SELECT id FROM master_admins WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    if (!admin) return res.status(404).json({ success: false, message: "Account not found" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await sql`UPDATE master_admins SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${admin.id}`;
    await sql`UPDATE otp_codes SET is_used = true WHERE id = ${otpRecord.id}`;

    return res.json({ success: true, message: "Password reset successful. Please login with your new password." });
  } catch (error: any) {
    console.error("Reset admin password error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};
