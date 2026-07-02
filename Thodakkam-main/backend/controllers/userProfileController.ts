import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { sql, query } from "../config/database";

const DEFAULT_TIMEZONE = "(GMT+05:30) India Standard Time";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value: any, maxLength = 500) => {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
};

const ensureProfileTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS startup_profiles (
      startup_id TEXT PRIMARY KEY,
      avatar_url TEXT,
      timezone VARCHAR(120) DEFAULT '(GMT+05:30) India Standard Time',
      bio VARCHAR(320) DEFAULT '',
      theme VARCHAR(12) DEFAULT 'dark',
      notify_new_registrations BOOLEAN DEFAULT true,
      notify_weekly_reports BOOLEAN DEFAULT false,
      notify_investor_activity BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const startupIdMeta = await query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'startup_profiles'
       AND column_name = 'startup_id'
     LIMIT 1`
  );

  const startupIdType = String(startupIdMeta[0]?.data_type || '').toLowerCase();
  if (startupIdType && startupIdType !== 'text') {
    await query(`
      ALTER TABLE startup_profiles
      ALTER COLUMN startup_id TYPE TEXT USING startup_id::text
    `);
  }

  // Add new company fields to startups table
  const newStartupCols: [string, string][] = [
    ['industry', 'VARCHAR(100)'],
    ['company_size', 'VARCHAR(50)'],
    ['founded_year', 'INTEGER'],
    ['location', 'VARCHAR(200)'],
    ['work_mode', 'VARCHAR(50)'],
  ];
  for (const [col, dtype] of newStartupCols) {
    try {
      await query(`ALTER TABLE startups ADD COLUMN IF NOT EXISTS ${col} ${dtype}`);
    } catch { /* column may already exist */ }
  }
};

const mapProfileResponse = (row: any) => ({
  id: row.id,
  fullName: row.founder_name || "",
  email: row.email || "",
  role: "Startup Admin",
  timezone: row.timezone || DEFAULT_TIMEZONE,
  bio: row.bio || "",
  avatarUrl: row.avatar_url || "",
  companyName: row.company_name || "",
  category: row.category || "",
  status: row.status || "",
  companyWebsite: row.company_website || "",
  companyDescription: row.company_description || "",
  logoUrl: row.logo_url || "",
  linkedinUrl: row.linkedin_url || "",
  twitterUrl: row.twitter_url || "",
  industry: row.industry || "",
  companySize: row.company_size || "",
  foundedYear: row.founded_year || null,
  location: row.location || "",
  workMode: row.work_mode || "",
  instagramUrl: row.instagram_url || "",
  githubUrl: row.github_url || "",
  physicalPhotos: row.physical_photos || "[]",
  preferences: {
    theme: row.theme === "light" ? "light" : "dark",
    newRegistrations: row.notify_new_registrations !== false,
    weeklyReports: row.notify_weekly_reports === true,
    investorActivity: row.notify_investor_activity === true,
  },
  activity: {
    lastLogin: row.last_seen || null,
    profileUpdatedAt: row.updated_at || null,
  },
});

export const getProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = String((req as any).user?.id || "");
    if (!startupId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await ensureProfileTable();
    const [row] = await sql`
      SELECT s.id, s.founder_name, s.company_name, s.email, s.category, s.status, s.last_seen,
             s.company_website, s.company_description, s.logo_url, s.linkedin_url, s.twitter_url,
             s.instagram_url, s.github_url, s.physical_photos,
             s.industry, s.company_size, s.founded_year, s.location, s.work_mode,
             sp.avatar_url, sp.timezone, sp.bio, sp.theme, sp.notify_new_registrations, sp.notify_weekly_reports, sp.notify_investor_activity, COALESCE(sp.updated_at, s.updated_at, s.created_at) AS updated_at
      FROM startups s LEFT JOIN startup_profiles sp ON sp.startup_id = s.id::text WHERE s.id::text = ${startupId} LIMIT 1
    `;
    if (!row) return res.status(404).json({ success: false, message: "User profile not found" });
    return res.json({ success: true, profile: mapProfileResponse(row) });
  } catch (error: any) {
    console.error("Get user profile error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  const startupId = String((req as any).user?.id || "");
  const fullName = sanitizeText(req.body.fullName, 80);
  const email = sanitizeText(req.body.email, 120).toLowerCase();
  const timezone = sanitizeText(req.body.timezone, 120) || DEFAULT_TIMEZONE;
  const bio = sanitizeText(req.body.bio, 320);
  const theme = req.body.theme === "light" ? "light" : "dark";
  const preferences = req.body.preferences || {};
  const newRegistrations = Boolean(preferences.newRegistrations);
  const weeklyReports = Boolean(preferences.weeklyReports);
  const investorActivity = Boolean(preferences.investorActivity);

  if (!startupId) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!fullName) return res.status(400).json({ success: false, message: "Full Name is required", field: "fullName" });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: "Valid email is required", field: "email" });
  if (!timezone) return res.status(400).json({ success: false, message: "Timezone is required", field: "timezone" });

  try {
    await ensureProfileTable();
    const [existingUser] = await sql`SELECT id FROM startups WHERE email = ${email} LIMIT 1`;
    if (existingUser && String(existingUser.id) !== startupId) return res.status(409).json({ success: false, message: "Email is already in use", field: "email" });

    await sql`UPDATE startups SET founder_name = ${fullName}, email = ${email}, updated_at = NOW() WHERE id::text = ${startupId}`;
    // Avatar is uploaded separately via /upload-avatar. Accept avatarUrl here ONLY if it's a regular URL
    // (http/https or short relative path) — never truncate data: URLs (they'd get corrupted).
    let avatarUrl: string | undefined;
    if (typeof req.body.avatarUrl === "string") {
      const raw = req.body.avatarUrl.trim();
      if (raw.startsWith("data:")) {
        // Frontend echoed back the full data URL — ignore to avoid truncation corruption.
        avatarUrl = undefined;
      } else if (raw.length === 0) {
        avatarUrl = "";
      } else if (raw.length <= 2048) {
        avatarUrl = raw;
      } else {
        avatarUrl = undefined;
      }
    }

    // Save company info fields to startups table
    const companyWebsite = typeof req.body.companyWebsite === "string" ? sanitizeText(req.body.companyWebsite, 255) : undefined;
    const companyDescription = typeof req.body.companyDescription === "string" ? sanitizeText(req.body.companyDescription, 500) : undefined;
    let logoUrl: string | undefined;
    if (typeof req.body.logoUrl === "string") {
      const raw = req.body.logoUrl.trim();
      if (raw.startsWith("data:")) {
        // Base64 data URL — do not sanitize or truncate to avoid corruption.
        logoUrl = raw;
      } else if (raw.length === 0) {
        logoUrl = "";
      } else {
        // Standard URL — sanitize and limit to 2048 chars.
        logoUrl = sanitizeText(raw, 2048);
      }
    }
    const linkedinUrl = typeof req.body.linkedinUrl === "string" ? sanitizeText(req.body.linkedinUrl, 255) : undefined;
    const twitterUrl = typeof req.body.twitterUrl === "string" ? sanitizeText(req.body.twitterUrl, 255) : undefined;
    const industry = typeof req.body.industry === "string" ? sanitizeText(req.body.industry, 100) : undefined;
    const companySize = typeof req.body.companySize === "string" ? sanitizeText(req.body.companySize, 50) : undefined;
    const foundedYear = req.body.foundedYear ? parseInt(req.body.foundedYear, 10) || null : undefined;
    const location = typeof req.body.location === "string" ? sanitizeText(req.body.location, 200) : undefined;
    const workMode = typeof req.body.workMode === "string" ? sanitizeText(req.body.workMode, 50) : undefined;
    const instagramUrl = typeof req.body.instagramUrl === "string" ? sanitizeText(req.body.instagramUrl, 255) : undefined;
    const githubUrl = typeof req.body.githubUrl === "string" ? sanitizeText(req.body.githubUrl, 255) : undefined;
    const physicalPhotos = req.body.physicalPhotos !== undefined ? req.body.physicalPhotos : undefined;

    if (companyWebsite !== undefined || companyDescription !== undefined || logoUrl !== undefined || linkedinUrl !== undefined || twitterUrl !== undefined
        || industry !== undefined || companySize !== undefined || foundedYear !== undefined || location !== undefined || workMode !== undefined || instagramUrl !== undefined || githubUrl !== undefined || physicalPhotos !== undefined) {
      await sql`
        UPDATE startups SET
          company_website = COALESCE(${companyWebsite ?? null}, company_website),
          company_description = COALESCE(${companyDescription ?? null}, company_description),
          logo_url = COALESCE(${logoUrl ?? null}, logo_url),
          linkedin_url = COALESCE(${linkedinUrl ?? null}, linkedin_url),
          twitter_url = COALESCE(${twitterUrl ?? null}, twitter_url),
          industry = COALESCE(${industry ?? null}, industry),
          company_size = COALESCE(${companySize ?? null}, company_size),
          founded_year = COALESCE(${foundedYear ?? null}, founded_year),
          location = COALESCE(${location ?? null}, location),
          work_mode = COALESCE(${workMode ?? null}, work_mode),
          instagram_url = COALESCE(${instagramUrl ?? null}, instagram_url),
          github_url = COALESCE(${githubUrl ?? null}, github_url),
          physical_photos = COALESCE(${physicalPhotos ?? null}, physical_photos),
          updated_at = NOW()
        WHERE id::text = ${startupId}
      `;
    }

    await sql`
      INSERT INTO startup_profiles (startup_id, avatar_url, timezone, bio, theme, notify_new_registrations, notify_weekly_reports, notify_investor_activity, updated_at)
      VALUES (${String(startupId)}, ${avatarUrl === undefined ? null : avatarUrl}, ${timezone}, ${bio}, ${theme}, ${newRegistrations}, ${weeklyReports}, ${investorActivity}, NOW())
      ON CONFLICT (startup_id)
      DO UPDATE SET avatar_url = COALESCE(${avatarUrl === undefined ? null : avatarUrl}, startup_profiles.avatar_url), timezone = ${timezone}, bio = ${bio}, theme = ${theme}, notify_new_registrations = ${newRegistrations}, notify_weekly_reports = ${weeklyReports}, notify_investor_activity = ${investorActivity}, updated_at = NOW()
    `;

    const [row] = await sql`
      SELECT s.id, s.founder_name, s.company_name, s.email, s.category, s.status, s.last_seen,
             s.company_website, s.company_description, s.logo_url, s.linkedin_url, s.twitter_url,
             s.instagram_url, s.github_url, s.physical_photos,
             s.industry, s.company_size, s.founded_year, s.location, s.work_mode,
             sp.avatar_url, sp.timezone, sp.bio, sp.theme, sp.notify_new_registrations, sp.notify_weekly_reports, sp.notify_investor_activity, COALESCE(sp.updated_at, s.updated_at, s.created_at) AS updated_at
      FROM startups s LEFT JOIN startup_profiles sp ON sp.startup_id = s.id::text WHERE s.id::text = ${startupId} LIMIT 1
    `;

    return res.json({ success: true, message: "Profile updated successfully", profile: mapProfileResponse(row) });
  } catch (error: any) {
    console.error("Update user profile error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const uploadAvatar = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = String((req as any).user?.id || "");
    if (!startupId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await ensureProfileTable();
    if (!req.file) return res.status(400).json({ success: false, message: "Avatar image is required" });

    const [existing] = await sql`SELECT avatar_url FROM startup_profiles WHERE startup_id = ${startupId} LIMIT 1`;
    const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    await sql`INSERT INTO startup_profiles (startup_id, avatar_url, updated_at) VALUES (${startupId}, ${avatarUrl}, NOW()) ON CONFLICT (startup_id) DO UPDATE SET avatar_url = ${avatarUrl}, updated_at = NOW()`;

    return res.json({ success: true, avatarUrl, imageUrl: avatarUrl, message: "Avatar uploaded successfully" });
  } catch (error: any) {
    console.error("Upload avatar error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to upload avatar" });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<any> => {
  const startupId = String((req as any).user?.id || "");
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!startupId) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Current and new password are required" });
  if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });

  try {
    const [row] = await sql`SELECT password_hash FROM startups WHERE id::text = ${startupId} LIMIT 1`;
    if (!row) return res.status(404).json({ success: false, message: "User not found" });

    const matched = await bcrypt.compare(currentPassword, row.password_hash || "");
    if (!matched) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await sql`UPDATE startups SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id::text = ${startupId}`;
    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to change password" });
  }
};
