import { Request, Response } from "express";
import { query } from "../config/database";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/email";


type AdminColumn = {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
};

const getAdminColumns = async (): Promise<Map<string, AdminColumn>> => {
  const rows = await query(
    `SELECT column_name, data_type, character_maximum_length
     FROM information_schema.columns
     WHERE table_name = 'master_admins'`
  );
  return new Map(rows.map((row: AdminColumn) => [row.column_name, row]));
};

const hasColumn = (columns: Map<string, AdminColumn>, columnName: string) => columns.has(columnName);

let avatarColumnMigrated = false;
const ensureAvatarTextColumn = async (columns: Map<string, AdminColumn>) => {
  if (avatarColumnMigrated) return;
  const col = columns.get("avatar_url");
  if (col && col.data_type === "character varying") {
    await query(`ALTER TABLE master_admins ALTER COLUMN avatar_url TYPE TEXT`);
  }
  avatarColumnMigrated = true;
};

/** Get Admin Profile */
export const getProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const adminId = (req as any).adminId;
    if (!adminId) return res.status(401).json({ success: false, message: "Not authorized" });

    const columns = await getAdminColumns();
    const selectColumns = [
      "admin_name as name",
      "email",
      "role",
      hasColumn(columns, "bio") ? "bio" : "NULL::text as bio",
      hasColumn(columns, "timezone") ? "timezone" : "NULL::text as timezone",
      hasColumn(columns, "avatar_url") ? "avatar_url as avatar" : "NULL::text as avatar",
      hasColumn(columns, "theme") ? "theme" : "'light'::text as theme",
      hasColumn(columns, "email_notifications") ? 'email_notifications as "emailNotifications"' : 'true as "emailNotifications"',
      hasColumn(columns, "push_notifications") ? 'push_notifications as "pushNotifications"' : 'true as "pushNotifications"',
      hasColumn(columns, "marketing_emails") ? 'marketing_emails as "marketingEmails"' : 'false as "marketingEmails"'
    ];

    const rows = await query(
      `SELECT ${selectColumns.join(", ")} FROM master_admins WHERE id = $1 LIMIT 1`,
      [adminId]
    );
    const [admin] = rows;
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    res.json({ success: true, admin });
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/** Update Admin Profile */
export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  const { name, email, bio, timezone, removeAvatar } = req.body;
  try {
    const adminId = (req as any).adminId;
    if (!adminId) return res.status(401).json({ success: false, message: "Not authorized" });

    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();
    if (!trimmedName) return res.status(400).json({ success: false, message: "Full name is required" });
    if (!trimmedEmail) return res.status(400).json({ success: false, message: "Email is required" });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    const columns = await getAdminColumns();
    await ensureAvatarTextColumn(columns);
    const uploadedFile = (req as any).file as Express.Multer.File | undefined;
    let nextAvatar: string | null | undefined;
    if (uploadedFile && uploadedFile.buffer) {
      const base64 = uploadedFile.buffer.toString("base64");
      nextAvatar = `data:${uploadedFile.mimetype};base64,${base64}`;
    } else if (String(removeAvatar || "").toLowerCase() === "true") {
      nextAvatar = null;
    } else {
      nextAvatar = undefined;
    }

    const updates: string[] = ["admin_name = $1", "email = $2"];
    const params: any[] = [trimmedName, trimmedEmail];

    if (hasColumn(columns, "bio")) {
      params.push(typeof bio === "string" ? bio : "");
      updates.push(`bio = $${params.length}`);
    }
    if (hasColumn(columns, "timezone")) {
      params.push(typeof timezone === "string" && timezone.trim() ? timezone : null);
      updates.push(`timezone = $${params.length}`);
    }
    if (hasColumn(columns, "avatar_url") && nextAvatar !== undefined) {
      params.push(nextAvatar);
      updates.push(`avatar_url = $${params.length}`);
    }
    if (hasColumn(columns, "updated_at")) {
      updates.push("updated_at = NOW()");
    }

    params.push(adminId);
    await query(
      `UPDATE master_admins SET ${updates.join(", ")} WHERE id = $${params.length}`,
      params
    );

    // Re-fetch with proper aliases (not raw column names)
    const selectCols = [
      "admin_name as name",
      "email",
      "role",
      hasColumn(columns, "bio") ? "bio" : "NULL::text as bio",
      hasColumn(columns, "timezone") ? "timezone" : "NULL::text as timezone",
      hasColumn(columns, "avatar_url") ? "avatar_url as avatar" : "NULL::text as avatar",
    ];
    const refetchRows = await query(
      `SELECT ${selectCols.join(", ")} FROM master_admins WHERE id = $1 LIMIT 1`,
      [adminId]
    );
    const updated = refetchRows[0];
    if (!updated) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({ success: true, message: "Profile updated successfully", admin: updated });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ success: false, message: "Email is already in use" });
    }
    if (error?.code === "22001") {
      return res.status(400).json({ success: false, message: "One of the profile fields is too long for current database schema" });
    }
    console.error("Update profile error:", error.message, "adminId:", (req as any).adminId);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/** Update Admin Preferences */
export const updatePreferences = async (req: Request, res: Response): Promise<any> => {
  const { theme, emailNotifications, pushNotifications, marketingEmails } = req.body;
  try {
    const adminId = (req as any).adminId;
    if (!adminId) return res.status(401).json({ success: false, message: "Not authorized" });

    const columns = await getAdminColumns();
    const updates: string[] = [];
    const params: any[] = [];

    if (hasColumn(columns, "theme") && theme !== undefined) {
      params.push(theme);
      updates.push(`theme = $${params.length}`);
    }
    if (hasColumn(columns, "email_notifications") && emailNotifications !== undefined) {
      params.push(Boolean(emailNotifications));
      updates.push(`email_notifications = $${params.length}`);
    }
    if (hasColumn(columns, "push_notifications") && pushNotifications !== undefined) {
      params.push(Boolean(pushNotifications));
      updates.push(`push_notifications = $${params.length}`);
    }
    if (hasColumn(columns, "marketing_emails") && marketingEmails !== undefined) {
      params.push(Boolean(marketingEmails));
      updates.push(`marketing_emails = $${params.length}`);
    }
    if (hasColumn(columns, "updated_at")) {
      updates.push("updated_at = NOW()");
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No updatable preference fields found" });
    }

    params.push(adminId);
    const rows = await query(
      `UPDATE master_admins SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    const [updated] = rows;
    if (!updated) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.json({ success: true, message: "Preferences updated successfully", admin: updated });
  } catch (error: any) {
    console.error("Update preferences error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/** Request OTP to change admin email and password */
export const requestCredentialChangeOtp = async (req: Request, res: Response): Promise<any> => {
  const { newEmail, newPassword } = req.body;
  const adminId = (req as any).adminId;

  if (!adminId) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const normalizedEmail = String(newEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, message: "New email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  if (newPassword && String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  try {
    const existing = await query(
      `SELECT id FROM master_admins WHERE LOWER(email) = LOWER($1) AND id != $2`,
      [normalizedEmail, adminId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already in use by another admin" });
    }

    await query(
      `UPDATE otp_codes SET is_used = true WHERE LOWER(email) = LOWER($1) AND is_used = false`,
      [normalizedEmail]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `INSERT INTO otp_codes (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [normalizedEmail, otp, expiresAt]
    );

    console.log(`🔑 [SECURITY] Generated Master Admin OTP for ${normalizedEmail}: ${otp}`);

    try {
      await sendEmail({
        email: normalizedEmail,
        subject: "Confirm Admin Credential Change OTP",
        message: `Your verification code is: ${otp}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #7C3AED; text-align: center; margin-bottom: 24px;">Admin Security Portal</h2>
            <p>Hi,</p>
            <p>You have requested to change your admin login credentials (email / password) to this email address.</p>
            <div style="background: #F3E8FF; border-radius: 8px; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; color: #7C3AED; letter-spacing: 4px; margin: 24px 0;">
              ${otp}
            </div>
            <p style="color: #64748B; font-size: 13px;">This verification code is valid for 10 minutes. If you did not initiate this request, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError: any) {
      console.warn(`⚠️ [SMTP ERROR] Failed to send OTP email to ${normalizedEmail}: ${mailError.message}`);
      console.log(`👉 [DEVELOPER FALLBACK] Use OTP: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent to your new email." });
  } catch (error: any) {
    console.error("Request admin credential change OTP error:", error.message);
    res.status(500).json({ success: false, message: "Failed to process OTP request", error: error.message });
  }
};

/** Verify OTP and update admin credentials */
export const verifyCredentialChange = async (req: Request, res: Response): Promise<any> => {
  const { newEmail, newPassword, otp } = req.body;
  const adminId = (req as any).adminId;

  if (!adminId) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const normalizedEmail = String(newEmail || "").trim().toLowerCase();
  if (!normalizedEmail || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const otpRecords = await query(
      `SELECT * FROM otp_codes 
       WHERE LOWER(email) = LOWER($1) AND otp_code = $2 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, otp]
    );

    const otpRecord = otpRecords[0];
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const existing = await query(
      `SELECT id FROM master_admins WHERE LOWER(email) = LOWER($1) AND id != $2`,
      [normalizedEmail, adminId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already in use by another admin" });
    }

    await query(`UPDATE otp_codes SET is_used = true WHERE id = $1`, [otpRecord.id]);

    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await query(
        `UPDATE master_admins SET email = $1, password_hash = $2 WHERE id = $3`,
        [normalizedEmail, passwordHash, adminId]
      );
    } else {
      await query(
        `UPDATE master_admins SET email = $1 WHERE id = $2`,
        [normalizedEmail, adminId]
      );
    }

    res.json({ success: true, message: "Credentials updated successfully." });
  } catch (error: any) {
    console.error("Verify admin credential change error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update credentials", error: error.message });
  }
};

