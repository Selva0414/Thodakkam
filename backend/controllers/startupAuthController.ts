import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../config/database";
import StartupModel from "../models/startupModel";
import { generateOtp, sendOtpEmail } from "../services/emailService";
import dotenv from "dotenv";

dotenv.config();

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");

const normalizeStartupStatus = (value: any) => {
  const upper = String(value || "PENDING").trim().toUpperCase();
  if (upper === "APPROVED") return "ACTIVE";
  if (upper === "REJECT") return "REJECTED";
  if (upper === "SUSPEND") return "SUSPENDED";
  return upper;
};

const isDataQuotaExceededError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("exceeded the data transfer quota") || (message.includes("quota") && message.includes("data transfer"));
};

const sendServiceQuotaError = (res: Response) =>
  res.status(503).json({
    success: false,
    code: "DB_QUOTA_EXCEEDED",
    message: "Database service quota exceeded. Please try again later or contact support.",
  });

export const register = async (req: Request, res: Response): Promise<any> => {
  const { founderName, companyName, companyRegId, email, password, category, linkedinUrl, websiteUrl, instagramUrl, githubUrl, regType, certificateId, source } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  try {
    if (!founderName || !companyName || !email || !password || !linkedinUrl || !websiteUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields. LinkedIn and Website URL are mandatory." });
    }

    if (!regType || (regType !== 'MSME' && regType !== 'CIN')) {
      return res.status(400).json({ success: false, message: "Please select a valid Registration Type (MSME or CIN)." });
    }

    if (!certificateId) {
      return res.status(400).json({ success: false, message: "Certificate ID is mandatory." });
    }

    const logoFile = files?.companyLogo?.[0];
    const photoFiles = files?.physicalPhotos || [];
    const certificateFile = files?.certificateFile?.[0];

    if (!logoFile) {
      return res.status(400).json({ success: false, message: "Company logo is mandatory." });
    }
    if (!certificateFile) {
      return res.status(400).json({ success: false, message: "Certificate file upload is mandatory." });
    }
    if (photoFiles.length < 2) {
      return res.status(400).json({ success: false, message: "Please upload at least 2 physical photos of the company." });
    }

    const emailStr = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await StartupModel.findByEmail(emailStr);
    if (existing) {
      if (existing.is_verified) return res.status(400).json({ success: false, message: "Account already exists. Please login." });
      await sql`DELETE FROM otp_codes WHERE email = ${emailStr}`;
      await sql`DELETE FROM startups WHERE id = ${existing.id}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const logoUrlBase64 = `data:${logoFile.mimetype};base64,${logoFile.buffer.toString("base64")}`;
    const certificateUrlBase64 = `data:${certificateFile.mimetype};base64,${certificateFile.buffer.toString("base64")}`;
    const physicalPhotosBase64 = JSON.stringify(photoFiles.map((file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`));

    await StartupModel.create({
      founder_name: founderName,
      company_name: companyName,
      company_reg_id: companyRegId || certificateId || '',
      email: emailStr,
      password_hash: passwordHash,
      category,
      logo_url: logoUrlBase64,
      linkedin_url: linkedinUrl,
      website_url: websiteUrl,
      instagram_url: instagramUrl,
      github_url: githubUrl,
      physical_photos: physicalPhotosBase64,
      msme_id: regType === 'MSME' ? certificateId : null,
      iso_id: null,
      reg_type: regType,
      certificate_id: certificateId,
      certificate_url: certificateUrlBase64,
      source: source || 'web'
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${emailStr}, ${otp}, ${expiresAt})`;
    try {
      await sendOtpEmail(emailStr, otp, founderName);
    } catch (mailError: any) {
      console.warn(`[DEV_MODE] OTP mail send failed for ${emailStr}: ${mailError.message}`);
    }

    res.status(201).json({ success: true, message: "Registered. Please verify your email.", email: emailStr });
  } catch (error: any) {
    console.error("Startup register error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body;
  try {
    const [otpRecord] = await sql`SELECT * FROM otp_codes WHERE email = ${email} AND otp_code = ${otp} AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;
    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    await sql`UPDATE otp_codes SET is_used = true WHERE id = ${otpRecord.id}`;
    const startup = await StartupModel.markVerified(email);

    // Notify admin dashboard in real-time
    const io = req.app.get("io");
    if (io) {
      console.log(`[Socket] Emitting new_user_registered for startup ${startup.id}`);
      io.to("admin_broadcast").emit("new_user_registered", {
        type: "startup",
        name: startup.company_name,
        founderName: startup.founder_name,
        email: startup.email,
        id: startup.id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: "Email verified successfully. Your account is now pending admin approval.",
      requiresApproval: true,
      user: { id: startup.id, founderName: startup.founder_name, companyName: startup.company_name, email: startup.email, category: startup.category, status: normalizeStartupStatus(startup.status), logoUrl: startup.logo_url || null, rulesAccepted: !!startup.rules_accepted },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ success: false, message: "Invalid credentials" });
    const startup = await StartupModel.findByEmail(email);
    if (!startup) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!startup.password_hash) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, startup.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!startup.is_verified) return res.status(401).json({ success: false, message: "Email not verified", requiresVerification: true });

    const status = normalizeStartupStatus(startup.status);
    if (status !== "ACTIVE" && status !== "LOCKED") {
      const statusMessages: Record<string, string> = { PENDING: "Your account is pending admin approval. Please wait for approval.", REJECTED: "Your account has been rejected. Please contact support.", SUSPENDED: "Your account has been suspended. Please contact support." };
      const reason = status === "REJECTED" ? startup.reject_reason : status === "SUSPENDED" ? startup.suspend_reason : undefined;
      return res.status(403).json({ success: false, message: statusMessages[status] || "Your account is not active. Please contact support.", status, reason: reason || undefined, requiresApproval: status === "PENDING" });
    }

    const token = jwt.sign({ id: startup.id, role: "startup" }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
    let avatarUrl: string | null = null;
    try {
      const profileRows = await sql`SELECT avatar_url FROM startup_profiles WHERE startup_id = ${startup.id} LIMIT 1`;
      avatarUrl = profileRows[0]?.avatar_url || null;
    } catch (_) {
      // startup_profiles table may not exist yet — safe to ignore
    }
    res.json({ success: true, token, user: { id: startup.id, founderName: startup.founder_name, companyName: startup.company_name, email: startup.email, category: startup.category, status, profile_views: startup.profile_views ?? 0, post_impressions: startup.post_impressions ?? 0, avatarUrl, logoUrl: startup.logo_url || null, rulesAccepted: !!startup.rules_accepted, plan_type: startup.plan_type || 'trial', is_locked: !!startup.is_locked } });
  } catch (error: any) {
    console.error("Startup login error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  try {
    const startup = await StartupModel.findByEmail(email);
    if (!startup) return res.status(404).json({ success: false, message: "No account found with this email" });
    if (startup.is_verified) return res.status(400).json({ success: false, message: "Email already verified" });

    await sql`UPDATE otp_codes SET is_used = true WHERE email = ${email} AND is_used = false`;
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${email}, ${otp}, ${expiresAt})`;
    await sendOtpEmail(email, otp, startup.founder_name);

    res.json({ success: true, message: "OTP resent successfully" });
  } catch (error: any) {
    console.error("Resend OTP error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const startup = await StartupModel.findByEmail(email);
    if (!startup) return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });

    await sql`UPDATE otp_codes SET is_used = true WHERE email = ${email} AND is_used = false`;
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${email}, ${otp}, ${expiresAt})`;
    await sendOtpEmail(email, otp, startup.founder_name);

    return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });
  } catch (error: any) {
    console.error("Request password reset error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    return res.status(500).json({ success: false, message: "Failed to process password reset request" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  if (String(newPassword).length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

  try {
    const [otpRecord] = await sql`SELECT * FROM otp_codes WHERE email = ${email} AND otp_code = ${otp} AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;
    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    const startup = await StartupModel.findByEmail(email);
    if (!startup) return res.status(404).json({ success: false, message: "Account not found" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await sql`UPDATE startups SET password_hash = ${passwordHash}, is_verified = true, updated_at = NOW() WHERE email = ${email}`;
    await sql`UPDATE otp_codes SET is_used = true WHERE id = ${otpRecord.id}`;

    return res.json({ success: true, message: "Password reset successful. Please login." });
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    if (isDataQuotaExceededError(error)) return sendServiceQuotaError(res);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const startup = await StartupModel.findById((req as any).user.id);
    if (!startup) return res.status(404).json({ success: false, message: "Startup not found" });
    res.json({ success: true, user: { id: startup.id, founderName: startup.founder_name, companyName: startup.company_name, email: startup.email, category: startup.category, status: normalizeStartupStatus(startup.status), profile_views: startup.profile_views || 0, post_impressions: startup.post_impressions || 0, company_website: startup.company_website || '', company_description: startup.company_description || '', logo_url: startup.logo_url || '', linkedin_url: startup.linkedin_url || '', twitter_url: startup.twitter_url || '' } });
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to get profile" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  const { founderName, email, companyWebsite, companyDescription, logoUrl, linkedinUrl, twitterUrl } = req.body;
  if (!founderName || !email) return res.status(400).json({ success: false, message: "Founder name and email are required" });

  try {
    const existing = await StartupModel.findByEmail(email);
    if (existing && existing.id !== (req as any).user.id) return res.status(400).json({ success: false, message: "Email is already in use" });

    const updatedStartup = await StartupModel.updateProfile((req as any).user.id, {
      founder_name: founderName,
      email,
      company_website: companyWebsite,
      company_description: companyDescription,
      logo_url: logoUrl,
      linkedin_url: linkedinUrl,
      twitter_url: twitterUrl,
    });
    if (!updatedStartup) return res.status(404).json({ success: false, message: "Startup not found" });

    res.json({ success: true, message: "Profile updated successfully", user: { id: updatedStartup.id, founderName: updatedStartup.founder_name, companyName: updatedStartup.company_name, email: updatedStartup.email, category: updatedStartup.category, status: normalizeStartupStatus(updatedStartup.status), profile_views: updatedStartup.profile_views || 0, post_impressions: updatedStartup.post_impressions || 0, company_website: updatedStartup.company_website || '', company_description: updatedStartup.company_description || '', logo_url: updatedStartup.logo_url || '', linkedin_url: updatedStartup.linkedin_url || '', twitter_url: updatedStartup.twitter_url || '' } });
  } catch (error: any) {
    console.error("Update startup profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const acceptPlatformRules = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user.id;
    const result = await StartupModel.acceptRules(startupId);
    if (!result) return res.status(404).json({ success: false, message: "Startup not found" });
    res.json({ success: true, message: "Platform rules accepted", rulesAccepted: true });
  } catch (error: any) {
    console.error("Accept platform rules error:", error.message);
    res.status(500).json({ success: false, message: "Failed to accept platform rules" });
  }
};
