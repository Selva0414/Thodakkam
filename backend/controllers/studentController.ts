import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as studentModel from "../models/studentModel";
import { query, sql } from "../config/database";
import NotificationModel from "../models/notificationModel";
import { executeCode, runTestCases } from "../services/codeExecutionService";
import { evaluateCode } from "../services/aiCodingEvaluatorService";
import { generateOtp, sendOtpEmail } from "../services/emailService";
import crypto from "crypto";
import { sendEmail } from "../utils/email";
import AssessmentModel from "../models/assessmentModel";

const EMPTY_DASHBOARD = {
  overview: { applied: 0, saved: 0, interviewing: 0, offered: 0 },
  upcomingInterviews: [],
  activity: [],
};

// Default pass threshold (%) applied when a round doesn't specify one.
// Override via DEFAULT_PASSING_SCORE env var.
const DEFAULT_PASSING_SCORE = (() => {
  const v = Number(process.env.DEFAULT_PASSING_SCORE);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 60;
})();

const resolveRoundThreshold = (round: any): number => {
  const raw = Number(round?.passingScore ?? round?.passing_score);
  if (!Number.isFinite(raw)) return DEFAULT_PASSING_SCORE;
  return Math.min(100, Math.max(0, raw));
};

/**
 * Mark a candidate assessment + application as rejected for a failed round,
 * and notify the startup.
 */
const failCandidateRound = async (
  candidateAssessment: any,
  roundType: string,
  opts: { achievedPct: number; threshold: number; studentId?: any; assessmentTitle?: string; fullscreenExited?: boolean },
  req?: Request
): Promise<void> => {
  const caId = candidateAssessment.id;
  const overallResult = opts.fullscreenExited ? 'failed' : `${roundType}_failed`;

  await query(
    `UPDATE candidate_assessments SET status = 'rejected', overall_result = $1, completed_at = NOW() WHERE id = $2`,
    [overallResult, caId]
  );

  let startupId: string | null = null;
  let studentName = "A candidate";
  let studentEmail = "";
  if (candidateAssessment.application_id) {
    try {
      await query(
        `UPDATE applications SET status = 'rejected', stage = 'rejected', rejected_at_stage = $1, updated_at = NOW() WHERE id::text = $2::text`,
        [roundType, String(candidateAssessment.application_id)]
      );
    } catch (e: any) {
      console.error(`[Assessment] ${roundType} fail application update:`, e.message);
    }
    // Look up startup_id + student name for notification
    try {
      const rows = await query(
        `SELECT a.startup_id, s.name AS full_name, s.email
         FROM applications app
         LEFT JOIN jobs j ON j.id::text = app.job_id::text
         LEFT JOIN assessments a ON a.id::text = $2::text
         LEFT JOIN students s ON s.id::text = app.student_id::text
         WHERE app.id::text = $1::text
         LIMIT 1`,
        [String(candidateAssessment.application_id), String(candidateAssessment.assessment_id)]
      );
      if (rows[0]) {
        startupId = rows[0].startup_id ? String(rows[0].startup_id) : null;
        if (rows[0].full_name) studentName = rows[0].full_name;
        if (rows[0].email) studentEmail = rows[0].email;
      }
    } catch (e: any) {
      console.error(`[Assessment] ${roundType} notification lookup:`, e.message);
    }
  }

  // Fallback student details lookup if application query didn't get email
  if (opts.studentId && !studentEmail) {
    try {
      const rows = await query(`SELECT name, email FROM students WHERE id::text = $1::text LIMIT 1`, [String(opts.studentId)]);
      if (rows[0]) {
        studentName = rows[0].name || studentName;
        studentEmail = rows[0].email || "";
      }
    } catch {}
  }

  if (!startupId) {
    try {
      const rows = await query(
        `SELECT startup_id FROM assessments WHERE id::text = $1::text LIMIT 1`,
        [String(candidateAssessment.assessment_id)]
      );
      if (rows[0]?.startup_id) startupId = String(rows[0].startup_id);
    } catch {
      /* ignore */
    }
  }

  if (startupId) {
    try {
      const isCheat = opts.fullscreenExited;
      const title = isCheat ? "Disqualified: Fullscreen Exited" : `${roundType === "mcq" ? "MCQ" : roundType === "coding" ? "Coding" : "Assessment"} round failed`;
      const message = isCheat
        ? `${studentName} (Email: ${studentEmail || 'N/A'}, ID: ${opts.studentId || 'N/A'}) has exited the exam window / fullscreen mode during the ${roundType} round and was auto-submitted/disqualified from the assessment "${opts.assessmentTitle || 'Assessment'}".`
        : `${studentName} scored ${opts.achievedPct.toFixed(1)}% on the ${roundType} round (pass mark ${opts.threshold}%)${opts.assessmentTitle ? ` for "${opts.assessmentTitle}"` : ""}.`;

      const notification = await NotificationModel.createStartupNotification({
        startup_id: startupId,
        title,
        message,
        type: isCheat ? "security" : "warning",
        link: candidateAssessment.application_id ? `/startup/candidates/${candidateAssessment.application_id}` : null,
      });

      // Emit socket notification
      if (req && notification) {
        const io = req.app.get("io");
        if (io) {
          const unreadCount = await NotificationModel.getStartupUnreadCount(startupId);
          io.to(`${startupId}_startup`).emit("new_notification", { notification, unreadCount });
        }
      }
    } catch (e: any) {
      console.error(`[Assessment] ${roundType} startup notification:`, e.message);
    }
  }
};

const tableExists = async (tableName: string): Promise<boolean> => {
  const rows = await query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists`,
    [tableName]
  );
  return Boolean(rows[0]?.exists);
};

const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  const rows = await query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2) AS exists`,
    [tableName, columnName]
  );
  return Boolean(rows[0]?.exists);
};

/**
 * Runs AI resume analysis and saves results to DB.
 * Returns the parsed insights object { strongPoints, improvementAreas } on success, or null on failure.
 */
const runAIResumeAnalysis = async (
  studentId: string | number,
  fileBuffer: Buffer,
  fileName: string,
  fileMimeType: string,
  currentSkills: string[]
): Promise<{ strongPoints: string[]; improvementAreas: string[] } | null> => {
  try {
    const FormData = require("form-data");
    const formData = new FormData();
    const defaultKeywords = "Software Engineering, web development, frontend, backend, APIs, databases, cloud computing, architecture, problem solving, agile, communication, teamwork";
    const targetJD = currentSkills && currentSkills.length > 0 ? currentSkills.join(", ") : defaultKeywords;

    formData.append(
      "message",
      `Evaluate this resume against these target skills and keywords: ${targetJD}`
    );
    formData.append("file", fileBuffer, {
      filename: fileName || "resume.pdf",
      contentType: fileMimeType,
    });

    console.log(`[AI Analysis] Starting for Student ID: ${studentId}...`);

    const data: any = await new Promise((resolve, reject) => {
      formData.submit("https://ai-agent-v01.onrender.com/chat", (err: Error | null, aiRes: any) => {
        if (err) return reject(err);
        let body = "";
        aiRes.on("data", (chunk: any) => (body += chunk.toString()));
        aiRes.on("end", () => {
          if (aiRes.statusCode < 200 || aiRes.statusCode >= 300) {
            return reject(new Error(`AI HTTP ${aiRes.statusCode}: ${body}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error("Invalid JSON from AI"));
          }
        });
      });
    });

    let parsed: any = null;

    if (data && data.type === "ats" && data.data) {
      // Direct ATS JSON response from the Python API
      parsed = {
        skills: data.data.matched_skills || [],
        strongPoints: [],
        improvementAreas: (data.data.improvements || data.data.missing_skills || []).slice(0, 5)
      };
      
      // Always show the authentic ATS score if it exists
      if (data.data.score !== undefined) {
        parsed.strongPoints.push(`Resume ATS Score is ${data.data.score}/100`);
      }
      
      const spLimit = data.data.score !== undefined ? 4 : 5;
      const matched = (data.data.matched_skills || []).slice(0, spLimit).map((s: string) => `Strong match: ${s}`);
      parsed.strongPoints.push(...matched);

      // Fallback if no strong points derived from ATS but we know their skills
      if (matched.length === 0 && currentSkills && currentSkills.length > 0) {
        parsed.strongPoints.push(...currentSkills.slice(0, 3).map(s => `Demonstrated experience with ${s}`));
      }
    } else if (data && data.message) {
      // Chat message fallback (if AI agent decides to reply with prompt text instead of ATS structure)
      let aiResultStr = String(data.message);
      // Strip markdown code fences if present
      aiResultStr = aiResultStr.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

      // Extract first JSON object block
      const jsonMatch = aiResultStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResultStr = jsonMatch[0];
      }
      try {
        parsed = JSON.parse(aiResultStr);
      } catch (e) {
        console.warn(`[AI Analysis] Failed to parse JSON from AI message:`, aiResultStr);
      }
    }

    if (parsed) {
      const aiSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
      const mergedSkills = [...new Set([...currentSkills, ...aiSkills])].slice(0, 15);

      await studentModel.updateStudentSkills(studentId, mergedSkills);

      const insightsObj = {
        strongPoints: Array.isArray(parsed.strongPoints) ? parsed.strongPoints : [],
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
      };

      if (insightsObj.strongPoints.length || insightsObj.improvementAreas.length) {
        console.log(`[AI Analysis] Saving insights for student ${studentId}:`, JSON.stringify(insightsObj).substring(0, 120));
        await studentModel.updateResumeInsights(studentId, JSON.stringify(insightsObj));
        console.log(`[AI Analysis] Complete for Student ID: ${studentId}.`);
        return insightsObj;
      } else {
        console.warn(`[AI Analysis] AI returned empty insights for student ${studentId}`);
        return null;
      }
    }

    return null;
  } catch (aiErr: any) {
    console.warn(`[AI Analysis] Failed for Student ID: ${studentId}:`, aiErr.message);
    return null;
  }
};

/** Fire-and-forget wrapper used during registration (keeps fast response) */
const handleBackgroundAIAnalysis = (
  studentId: string | number,
  fileBuffer: Buffer,
  fileName: string,
  fileMimeType: string,
  currentSkills: string[]
): void => {
  runAIResumeAnalysis(studentId, fileBuffer, fileName, fileMimeType, currentSkills)
    .catch((err) => console.error(`[Registration] Background AI trigger error for ${studentId}:`, err));
};

export const registerStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    let { fullName, username, email, password, phone, location, profilePhoto, resumeFile, selectedSkills, educations, internships, websiteUrl, githubUrl, linkedinUrl, bio, referredBy, source } = req.body;
    let resumeData = null;

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.profilePhoto) {
        const file = files.profilePhoto[0];
        // memoryStorage: use buffer directly, no disk I/O
        const base64 = file.buffer.toString("base64");
        profilePhoto = `data:${file.mimetype};base64,${base64}`;
      }
      if (files.resumeFile) {
        const file = files.resumeFile[0];
        const fileBuffer = file.buffer; // memoryStorage buffer
        const base64 = fileBuffer.toString("base64");
        resumeFile = `data:${file.mimetype};base64,${base64}`;
        resumeData = { buffer: fileBuffer, name: file.originalname, mimetype: file.mimetype };
      }
    }

    if (typeof selectedSkills === "string") selectedSkills = JSON.parse(selectedSkills);
    if (!Array.isArray(selectedSkills)) selectedSkills = [];
    if (typeof educations === "string") educations = JSON.parse(educations);
    if (typeof internships === "string") internships = JSON.parse(internships);

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ message: "Full Name, Email, Username and Password are required fields." });
    }

    const emailStr = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    email = emailStr;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = await studentModel.createStudent({
      name: fullName, username, email, password: hashedPassword, phone, location, profilePhoto, resumeFile, selectedSkills, educations, internships, websiteUrl, githubUrl, linkedinUrl, bio: bio || "", referredBy, source: source || 'web'
    });

    if (resumeData) {
      handleBackgroundAIAnalysis(newStudent.id, resumeData.buffer, resumeData.name, resumeData.mimetype, selectedSkills);
    }

    // Award referral points (10 pts) and notify the referrer student if applicable
    if (referredBy && referredBy !== "student" && referredBy !== newStudent.id) {
      try {
        await query(
          `UPDATE students SET referral_points = COALESCE(referral_points, 0) + 10 WHERE id = $1`,
          [referredBy]
        );

        // Fetch referrer to see if they exist and to send them a notification
        const referrer = await studentModel.findStudentById(referredBy);
        if (referrer) {
          const notification = await NotificationModel.createNotification({
            student_id: referredBy,
            title: "Referral Reward! 🎉",
            message: `${newStudent.name} registered using your link. You earned 10 points!`,
            type: "general",
            link: "/student/general", // Deep link to Activity Zone
          });

          const io = req.app.get("io");
          if (io && notification) {
            const unreadCount = await NotificationModel.getUnreadCount(referredBy);
            io.to(`${referredBy}_student`).emit("new_notification", { notification, unreadCount });
          }
        }
      } catch (refErr: any) {
        console.error(`[Referral] Failed to award points/notify for referrer ${referredBy}:`, refErr.message);
      }
    }

    // Notify admin dashboard in real-time
    const io = req.app.get("io");
    if (io) {
      console.log(`[Socket] Emitting new_user_registered for student ${newStudent.id}`);
      io.to("admin_broadcast").emit("new_user_registered", {
        type: "student",
        name: newStudent.name,
        email: newStudent.email,
        id: newStudent.id,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message: "Student registered successfully",
      student: { id: newStudent.id, fullName: newStudent.name, email: newStudent.email, profilePhoto: newStudent.profile_photo, username: newStudent.username },
    });
  } catch (error: any) {
    if (error.code === "23505") {
      if (error.detail && error.detail.includes("username")) return res.status(409).json({ message: "A student with this username already exists." });
      return res.status(409).json({ message: "A student with this email already exists." });
    }
    res.status(500).json({ message: "An error occurred during registration.", error: error.message });
  }
};

export const loginStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    let student;
    try {
      student = await studentModel.findStudentByEmail(email);
    } catch (dbError: any) {
      console.error("[Login] Database error fetching student:", dbError.message);
      return res.status(500).json({ message: "Database error during login. Please try again." });
    }

    if (!student) return res.status(401).json({ message: "Invalid credentials." });

    let isMatch = false;
    if (student.password && (student.password.startsWith("$2a$") || student.password.startsWith("$2b$") || student.password.startsWith("$2y$"))) {
      try {
        isMatch = await bcrypt.compare(password, student.password);
      } catch (bcryptError: any) {
        console.error("[Login] Bcrypt error:", bcryptError.message);
        return res.status(500).json({ message: "Authentication error. Please try again." });
      }
    }

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    try {
      const token = jwt.sign({ id: student.id, email: student.email, name: student.name, role: "student" }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

      res.status(200).json({
        message: "Login successful",
        token,
        student: { id: student.id, fullName: student.name, email: student.email, profilePhoto: student.profile_photo, username: student.username },
      });
    } catch (jwtError: any) {
      console.error("[Login] JWT sign error:", jwtError.message);
      return res.status(500).json({ message: "Token generation error. Please try again." });
    }
  } catch (error: any) {
    console.error("[Login] Unexpected error:", error.message, error.stack);
    res.status(500).json({ message: "Internal server error during login.", error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const student = await studentModel.findStudentByEmail(email);
    if (!student) {
      // For security reasons, don't reveal if a student exists or not
      return res.status(200).json({ message: "If a student account with that email exists, we have sent a reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await studentModel.updateStudentResetToken(email, hashedToken, expiry);

    const frontendBase = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    
    if (!process.env.FRONTEND_URL && !req.headers.origin) {
      console.warn("⚠️ [Forgot Password] Neither FRONTEND_URL nor req.headers.origin is set. Defaulting to localhost.");
    }
    
    const resetUrl = `${frontendBase}/student/reset-password?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your student account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

    await sendEmail({
      email: student.email,
      subject: "Password Reset Request",
      message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6;">You are receiving this email because you (or someone else) have requested the reset of the password for your student account.</p>
          <p style="color: #475569; line-height: 1.6;">Please click the button below to complete the process:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">Alternatively, you can copy and paste this link into your browser:</p>
          <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "If a student account with that email exists, we have sent a reset link." });
  } catch (error: any) {
    console.error("Forgot password detailed error:", error);
    res.status(500).json({ message: "Internal server error during forgot password process.", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required." });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const student = await studentModel.findStudentByResetToken(hashedToken);

    if (!student) {
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await studentModel.updateStudentPassword(student.id, hashedPassword);

    res.status(200).json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Internal server error during password reset process.", error: error.message });
  }
};

export const changeStudentPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required." });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }

    let student;
    try {
      student = await studentModel.findStudentWithPasswordById(studentId);
    } catch (findErr: any) {
      console.error("[Change Password] Find student error:", findErr.message);
      return res.status(500).json({ success: false, message: "Failed to lookup account." });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Verify old password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(oldPassword, student.password);
    } catch (compareErr: any) {
      console.error("[Change Password] Bcrypt compare error:", compareErr.message);
      return res.status(500).json({ success: false, message: "Authentication error." });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect current password." });
    }

    // Hash new password
    let salt, hashedPassword;
    try {
      salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    } catch (hashErr: any) {
      console.error("[Change Password] Hash error:", hashErr.message);
      return res.status(500).json({ success: false, message: "Failed to hash password." });
    }

    // Update password
    try {
      await studentModel.updateStudentPassword(studentId, hashedPassword);
    } catch (updateErr: any) {
      console.error("[Change Password] Update error:", updateErr.message);
      return res.status(500).json({ success: false, message: "Failed to update password." });
    }

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    console.error("Change password error:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Failed to update password." });
  }
};

export const getDashboard = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    const hasApplicationsTable = await tableExists("applications");
    if (!hasApplicationsTable) return res.json({ success: true, data: EMPTY_DASHBOARD });

    const hasStudentIdColumn = await columnExists("applications", "student_id");

    let whereClause = "";
    let whereParams: any[] = [];

    if (hasStudentIdColumn) {
      whereClause = "a.student_id = $1";
      whereParams = [studentId];
    } else {
      const hasStudentsTable = await tableExists("students");
      const hasEmailColumn = hasStudentsTable ? await columnExists("students", "email") : false;
      const hasCandidateEmail = await columnExists("applications", "candidate_email");

      if (!hasStudentsTable || !hasEmailColumn || !hasCandidateEmail) return res.json({ success: true, data: EMPTY_DASHBOARD });

      const studentRows = await query("SELECT email FROM students WHERE id = $1", [studentId]);
      const studentEmail = studentRows[0]?.email;
      if (!studentEmail) return res.json({ success: true, data: EMPTY_DASHBOARD });

      whereClause = "LOWER(a.candidate_email) = LOWER($1)";
      whereParams = [studentEmail];
    }

    const overviewRows = await query(
      `SELECT
        COUNT(*)::int AS applied,
        COALESCE(SUM(CASE WHEN LOWER(a.status) IN ('shortlisted', 'interview_scheduled') THEN 1 ELSE 0 END), 0)::int AS interviewing,
        COALESCE(SUM(CASE WHEN LOWER(a.status) IN ('hired', 'offered', 'selected') THEN 1 ELSE 0 END), 0)::int AS offered
      FROM applications a
      WHERE ${whereClause}`,
      whereParams
    );

    let meetings = 0;
    const hasInterviewsTableForMeetings = await tableExists("interviews");
    if (hasInterviewsTableForMeetings) {
      const meetingsRows = await query(
        `SELECT COUNT(*)::int AS upcoming_meetings
         FROM interviews i
         JOIN applications a ON a.id::text = i.application_id::text
         WHERE ${whereClause} AND i.scheduled_date >= CURRENT_DATE AND LOWER(COALESCE(i.status, 'scheduled')) NOT IN ('completed', 'cancelled')`,
        whereParams
      );
      meetings = meetingsRows[0]?.upcoming_meetings || 0;
    }

    const overview = { 
      applied: overviewRows[0]?.applied || 0, 
      saved: 0, 
      interviewing: overviewRows[0]?.interviewing || 0, 
      offered: overviewRows[0]?.offered || 0,
      meetings
    };

    let upcomingInterviews = [];
    const hasInterviewsTable = await tableExists("interviews");
    const hasJobsTable = await tableExists("jobs");
    const hasStartupsTable = await tableExists("startups");
    const startupNameExpr = hasStartupsTable ? "COALESCE(s.company_name, 'Startup')" : "'Startup'";
    const jobTitleExpr = hasJobsTable ? "COALESCE(j.title, a.role_applied, 'Interview')" : "COALESCE(a.role_applied, 'Interview')";

    if (hasInterviewsTable) {
      upcomingInterviews = await query(
        `SELECT i.id, i.scheduled_date, i.time_slot, i.platform, ${jobTitleExpr} AS role_title, ${startupNameExpr} AS company_name
        FROM interviews i JOIN applications a ON a.id::text = i.application_id::text
        ${hasJobsTable ? "LEFT JOIN jobs j ON j.id::text = a.job_id::text" : ""}
        ${hasStartupsTable ? "LEFT JOIN startups s ON s.id::text = COALESCE(a.startup_id::text, i.startup_id::text)" : ""}
        WHERE ${whereClause} AND LOWER(COALESCE(i.status, 'scheduled')) = 'scheduled' AND i.scheduled_date >= CURRENT_DATE
        ORDER BY i.scheduled_date ASC, i.id ASC LIMIT 5`,
        whereParams
      );
    }

    const activity = await query(
      `SELECT a.id, ${jobTitleExpr} AS role_title, ${startupNameExpr} AS company_name, a.status, a.applied_at
      FROM applications a
      ${hasJobsTable ? "LEFT JOIN jobs j ON j.id::text = a.job_id::text" : ""}
      ${hasStartupsTable ? "LEFT JOIN startups s ON s.id::text = a.startup_id::text" : ""}
      WHERE ${whereClause} ORDER BY a.applied_at DESC NULLS LAST, a.id DESC LIMIT 5`,
      whereParams
    );

    return res.json({ success: true, data: { overview, upcomingInterviews, activity } });
  } catch (error: any) {
    console.error("Student dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch student dashboard data" });
  }
};

export const getStudentProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    const student = await studentModel.findStudentById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const { password, ...profile } = student;
    res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch student profile." });
  }
};

/**
 * POST /api/students/:studentId/reanalyze-resume
 * Reads the stored base64 resume from DB and re-runs AI analysis.
 * Used by the dashboard to trigger analysis for students who already have a resume but no insights.
 */
export const reanalyzeResume = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    const student = await studentModel.findStudentById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    if (!student.resume_file) {
      return res.status(400).json({ success: false, message: "No resume file found. Please upload a resume first." });
    }

    // If insights already exist and are valid, return them directly without re-running AI
    if (student.resume_insights) {
      try {
        const existing = typeof student.resume_insights === "string"
          ? JSON.parse(student.resume_insights)
          : student.resume_insights;
        if (existing?.strongPoints?.length || existing?.improvementAreas?.length) {
          return res.json({ success: true, insights: existing, cached: true });
        }
      } catch {
        // corrupt insights — re-run analysis below
      }
    }

    // Parse base64 resume_file back to Buffer
    const resumeBase64: string = student.resume_file;
    // Modified regex to allow dots, digits, and other valid mime-type characters
    const matches = resumeBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: "Stored resume format is invalid. Please re-upload your resume." });
    }

    const mimeType = matches[1];
    const fileBuffer = Buffer.from(matches[2], "base64");

    let currentSkills: string[] = [];
    if (student.skills) {
      try {
        currentSkills = typeof student.skills === "string" ? JSON.parse(student.skills) : student.skills;
      } catch { currentSkills = []; }
    }

    console.log(`[Re-analyze] Running AI analysis on stored resume for student ${studentId}...`);
    const insights = await runAIResumeAnalysis(studentId, fileBuffer, "resume.pdf", mimeType, currentSkills);

    if (!insights) {
      return res.status(422).json({
        success: false,
        message: "AI could not analyze this resume. The file may not contain readable text. Please try re-uploading a text-based PDF.",
      });
    }

    return res.json({ success: true, insights, cached: false });
  } catch (error: any) {
    console.error(`[Re-analyze] Error for student ${req.params.studentId}:`, error.message);
    return res.status(500).json({ success: false, message: "Failed to analyze resume: " + error.message });
  }
};

export const searchStudents = async (req: Request, res: Response): Promise<any> => {
  try {
    const { query: searchQuery } = req.query;
    if (!searchQuery) return res.status(400).json({ success: false, message: "Search query is required." });

    const students = await studentModel.searchStudents(String(searchQuery));
    res.json({ success: true, data: students });
  } catch (error: any) {
    console.error("Search students error:", error.message);
    res.status(500).json({ success: false, message: "Failed to search students." });
  }
};

export const updateStudentProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    // Fetch existing student to preserve photo/resume when not re-uploaded
    const existing = await studentModel.findStudentById(studentId);
    if (!existing) return res.status(404).json({ success: false, message: "Student not found." });

    let { fullName, username, email, phone, location, bio, selectedSkills, educations, internships, websiteUrl, githubUrl, linkedinUrl, anonymizedResumeUrl } = req.body;
    let profilePhoto = existing.profile_photo;
    let resumeFile = existing.resume_file;
    let resumeData = null;

    // If the frontend sent back an anonymized resume URL, download it and store as the resume
    if (anonymizedResumeUrl && typeof anonymizedResumeUrl === 'string' && anonymizedResumeUrl.startsWith('http')) {
      try {
        console.log(`[Profile Update] Downloading anonymized resume from: ${anonymizedResumeUrl}`);
        const axios = (await import('axios')).default;
        const dlResp = await axios.get(anonymizedResumeUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const dlBuffer = Buffer.from(dlResp.data);
        const base64 = dlBuffer.toString('base64');
        resumeFile = `data:application/pdf;base64,${base64}`;
        resumeData = { buffer: dlBuffer, name: 'anonymized_resume.pdf', mimetype: 'application/pdf' };
        console.log(`[Profile Update] ✅ Anonymized resume downloaded (${dlBuffer.length} bytes) and stored`);
      } catch (dlErr: any) {
        console.error(`[Profile Update] ❌ Failed to download anonymized resume:`, dlErr.message);
        // Fall through — the original uploaded file (if any) will be used
      }
    }

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.profilePhoto) {
        const file = files.profilePhoto[0];
        // With memoryStorage, file.buffer holds the bytes directly — no disk I/O
        const base64 = file.buffer.toString("base64");
        profilePhoto = `data:${file.mimetype};base64,${base64}`;
      }
      // Only use the raw uploaded file if we didn't already get an anonymized version
      if (files.resumeFile && !anonymizedResumeUrl) {
        const file = files.resumeFile[0];
        const fileBuffer = file.buffer; // Buffer from memory, no disk read needed
        const base64 = fileBuffer.toString("base64");
        resumeFile = `data:${file.mimetype};base64,${base64}`;
        resumeData = { buffer: fileBuffer, name: file.originalname, mimetype: file.mimetype };
      }
    }

    const safeJsonParse = (val: any) => {
      if (!val) return [];
      if (typeof val !== 'string') return val;
      try {
        return JSON.parse(val);
      } catch (e) {
        console.warn("[Profile Update] JSON parse failed for:", val);
        return [];
      }
    };

    selectedSkills = safeJsonParse(selectedSkills);
    educations = safeJsonParse(educations);
    internships = safeJsonParse(internships);

    const updatedStudent = await studentModel.updateStudent(studentId, {
      name: fullName, username, email, phone, location, bio, profilePhoto, resumeFile, skills: selectedSkills, educations, internships, website_url: websiteUrl, github_url: githubUrl, linkedin_url: linkedinUrl,
    });

    if (!updatedStudent) return res.status(404).json({ success: false, message: "Student not found." });

    // If a new resume was uploaded, run AI analysis SYNCHRONOUSLY so we can include results in the response
    let insights: { strongPoints: string[]; improvementAreas: string[] } | null = null;
    let aiError: string | null = null;
    if (resumeData) {
      console.log(`[Profile Update] Running synchronous AI analysis for student ${studentId}`);
      try {
        const skillsArray = Array.isArray(selectedSkills) ? selectedSkills : [];
        insights = await runAIResumeAnalysis(studentId, resumeData.buffer, resumeData.name, resumeData.mimetype, skillsArray);
        if (!insights) {
          aiError = "AI could not extract insights from the resume";
        }
      } catch (err: any) {
        aiError = err.message || "AI analysis failed";
        console.error(`[Profile Update] AI analysis error for student ${studentId}:`, aiError);
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: { id: updatedStudent.id, fullName: updatedStudent.name, email: updatedStudent.email, profilePhoto: updatedStudent.profile_photo, username: updatedStudent.username },
      ...(resumeData ? { insights, aiError } : {}),
    });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred during profile update.",
      error: error.message,
      stack: error.stack
    });
  }
};

export const getStudentAssessments = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id || String(req.params.studentId);
    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    // Proactively heal schema if missing total_rounds/rounds columns
    await AssessmentModel.createTable();

    const hasCandidateAssessments = await tableExists("candidate_assessments");
    if (!hasCandidateAssessments) return res.json({ success: true, assessments: [] });

    const hasAssessmentsTable = await tableExists("assessments");
    if (!hasAssessmentsTable) return res.json({ success: true, assessments: [] });

    console.log(`[Assessments] Fetching for Student ID: ${studentId}`);

    // Primary query: match student_id directly, deduplicate by assessment_id (keep latest)
    let assessments = await query(
      `SELECT DISTINCT ON (ca.assessment_id)
              a.id, a.title, a.description, a.total_rounds, a.rounds, a.created_at,
              ca.id as candidate_assessment_id,
              COALESCE(
                ca.application_id,
                (SELECT id FROM applications
                 WHERE student_id::text = $1::text
                   AND startup_id::text = a.startup_id::text
                 ORDER BY applied_at DESC LIMIT 1)
              ) as application_id,
              app.status as application_status,
              CASE
                WHEN app.stage IN ('selected','rejected') THEN 'completed'
                ELSE ca.status
              END as status,
              ca.current_round, ca.mcq_score, ca.mcq_total,
              COALESCE(ca.ai_coding_score, ca.coding_score) as coding_score,
              ca.interview_score,
              CASE
                WHEN app.stage = 'selected' AND (ca.overall_result IS NULL OR ca.overall_result NOT IN ('passed','rejected','failed')) THEN 'passed'
                WHEN app.stage = 'rejected' AND (ca.overall_result IS NULL OR ca.overall_result NOT IN ('passed','rejected','failed')) THEN 'rejected'
                ELSE ca.overall_result
              END as overall_result,
              ca.started_at, ca.completed_at,
              s.company_name as startup_name,
              app.offer_letter,
              app.stage as application_stage
      FROM candidate_assessments ca 
      JOIN assessments a ON a.id = ca.assessment_id 
      LEFT JOIN applications app ON app.id::text = ca.application_id::text
      ${await tableExists("startups") ? "LEFT JOIN startups s ON s.id::text = a.startup_id::text" : ""}
      WHERE ca.student_id::text = $1::text 
      ORDER BY ca.assessment_id, ca.created_at DESC`,
      [String(studentId)]
    );

    // Fallback: match via applications table if direct match found nothing
    if (assessments.length === 0) {
      console.log(`[Assessments] Direct match found 0, trying fallback via applications table`);
      assessments = await query(
        `SELECT DISTINCT ON (ca.assessment_id)
                a.id, a.title, a.description, a.total_rounds, a.rounds, a.created_at,
                ca.id as candidate_assessment_id,
                COALESCE(
                  ca.application_id,
                  (SELECT id FROM applications
                   WHERE student_id::text = $1::text
                     AND startup_id::text = a.startup_id::text
                   ORDER BY applied_at DESC LIMIT 1)
                ) as application_id,
                app.status as application_status,
                CASE
                  WHEN app.stage IN ('selected','rejected') THEN 'completed'
                  ELSE ca.status
                END as status,
                ca.current_round, ca.mcq_score, ca.mcq_total,
                ca.coding_score, ca.interview_score,
                CASE
                  WHEN app.stage = 'selected' AND (ca.overall_result IS NULL OR ca.overall_result NOT IN ('passed','rejected','failed')) THEN 'passed'
                  WHEN app.stage = 'rejected' AND (ca.overall_result IS NULL OR ca.overall_result NOT IN ('passed','rejected','failed')) THEN 'rejected'
                  ELSE ca.overall_result
                END as overall_result,
                ca.started_at, ca.completed_at,
                s.company_name as startup_name,
                app.offer_letter,
                app.stage as application_stage
        FROM candidate_assessments ca 
        JOIN assessments a ON a.id = ca.assessment_id 
        LEFT JOIN applications app ON app.id::text = ca.application_id::text
        ${await tableExists("startups") ? "LEFT JOIN startups s ON s.id::text = a.startup_id::text" : ""}
        WHERE ca.application_id::text IN (
          SELECT id::text FROM applications 
          WHERE student_id::text = $1::text 
          ${await columnExists("applications", "resolved_student_id") ? "OR resolved_student_id::text = $1::text" : ""}
        )
        ORDER BY ca.assessment_id, ca.created_at DESC`,
        [String(studentId)]
      );
    }

    console.log(`[Assessments] Found ${assessments.length} for student ${studentId}`);
    
    // Auto-process expired rounds
    // IMPORTANT: Distinguish between time_expired (student didn't attend) and rejected (failed score).
    // Only time_expired students can request a reschedule.
    const now = new Date();
    for (const ass of assessments) {
      // Skip already-finalized assessments (score-based failures/completions)
      if (
        ass.status === 'completed' ||
        ass.status === 'rejected' ||
        ass.status === 'time_expired' ||
        ass.overall_result === 'time_expired' ||
        ass.overall_result?.endsWith('_failed')
      ) continue;

      const rounds = typeof ass.rounds === 'string' ? JSON.parse(ass.rounds) : (ass.rounds || []);
      const currentRoundIdx = (ass.current_round || 1) - 1;
      const currentRound = rounds[currentRoundIdx];

      if (currentRound && currentRound.endTime) {
        const endTime = new Date(currentRound.endTime);
        if (now > endTime) {
          console.log(`[Assessments] Time expired for assessment ${ass.id} (round ${currentRoundIdx+1}) for student ${studentId}. started_at=${ass.started_at}`);

          // Mark candidate_assessment as time_expired (NOT rejected – that's for score failures)
          await query(
            `UPDATE candidate_assessments 
             SET status = 'time_expired', overall_result = 'time_expired', completed_at = NOW() 
             WHERE id = $1`,
            [ass.candidate_assessment_id]
          );

          // Keep application in a reschedule-eligible state: status = 'reschedule_eligible'
          // This lets company see it's pending a possible reschedule, not a flat rejection
          if (ass.application_id) {
            await query(
              `UPDATE applications 
               SET status = 'reschedule_eligible', 
                   stage = 'shortlisted',
                   updated_at = NOW() 
               WHERE id::text = $1::text
                 AND status NOT IN ('reschedule_requested', 'hired', 'rejected')`,
              [String(ass.application_id)]
            );
          }

          ass.status = 'time_expired';
          ass.overall_result = 'time_expired';
          // Update application_status in-memory too
          if (ass.application_status !== 'reschedule_requested') {
            ass.application_status = 'reschedule_eligible';
          }
        }
      }
    }

    res.json({ success: true, assessments });
  } catch (error: any) {
    console.error("[Assessments] Fetch error:", error.code, error.message, error.stack);
    // Always return an empty list instead of 500 for any DB/runtime error on this read endpoint
    return res.json({ success: true, assessments: [] });
  }
};

export const getAssessmentQuestions = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id;
    const assessmentId = String(req.params.assessmentId);

    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const caRows = await query(
      `SELECT ca.id, ca.assessment_id, ca.application_id, ca.student_id, ca.current_round, ca.status, ca.mcq_score, ca.mcq_total, ca.mcq_completed_at, ca.coding_score, ca.coding_completed_at, ca.started_at, ca.completed_at, ca.created_at, ca.overall_result, a.title, a.rounds, a.total_rounds, a.field,
              app.role_applied, j.title as job_title
      FROM candidate_assessments ca 
      JOIN assessments a ON a.id::text = ca.assessment_id::text
      LEFT JOIN applications app ON app.id::text = ca.application_id::text
      LEFT JOIN jobs j ON j.id::text = app.job_id::text
      WHERE (
        ca.student_id::text = $1::text OR 
        ca.application_id::text IN (
          SELECT id::text FROM applications WHERE student_id::text = $1::text
        )
      ) 
      AND ca.assessment_id::text = $2::text`,
      [String(studentId), String(assessmentId)]
    );

    if (!caRows.length) {
      console.log(`[AssessmentQuestions] Not found for student=${studentId}, assessment=${assessmentId}`);
      return res.status(404).json({ error: "Assessment not found or not assigned to you" });
    }

    const candidateAssessment = caRows[0];
    if (candidateAssessment.status === "completed") {
      return res.json({ success: true, isCompleted: true, message: "Assessment already completed", scores: { mcq: candidateAssessment.mcq_score, coding: candidateAssessment.coding_score } });
    }

    const overallResult = String(candidateAssessment.overall_result || "");
    const isFailedAssessment =
      candidateAssessment.status === "rejected" ||
      overallResult === "rejected" ||
      overallResult.endsWith("_failed");

    if (isFailedAssessment) {
      return res.json({
        success: true,
        isFailed: true,
        failReason: overallResult || "rejected",
        message: "You did not meet the pass mark for this round. The company has been notified.",
        scores: { mcq: candidateAssessment.mcq_score, mcqTotal: candidateAssessment.mcq_total, coding: candidateAssessment.coding_score },
      });
    }

    if (!candidateAssessment.started_at) {
      await query(`UPDATE candidate_assessments SET started_at = NOW(), status = 'in_progress' WHERE id = $1`, [candidateAssessment.id]);
    }

    const rounds = typeof candidateAssessment.rounds === "string" ? JSON.parse(candidateAssessment.rounds) : (candidateAssessment.rounds || []);
    const currentRoundNum = candidateAssessment.current_round || 1;
    const currentRound = rounds[currentRoundNum - 1];

    if (!currentRound) return res.status(400).json({ error: "No rounds configured for this assessment", details: { currentRound: currentRoundNum, totalRounds: rounds.length } });

    // TIME WINDOW VALIDATION
    const now = new Date();
    if (currentRound.startTime) {
      const startTime = new Date(currentRound.startTime);
      if (now < startTime) {
        return res.status(403).json({
          success: false,
          notStarted: true,
          startTime: currentRound.startTime,
          serverTime: now.toISOString(),
          message: `This round is scheduled to start on ${startTime.toLocaleString()}.`
        });
      }
    }
    if (currentRound.endTime) {
      const endTime = new Date(currentRound.endTime);
      if (now > endTime) {
        return res.status(403).json({
          success: false,
          expired: true,
          endTime: currentRound.endTime,
          message: "This assessment round has expired and is no longer available."
        });
      }
    }

    const jobTitleVal = candidateAssessment.job_title || candidateAssessment.role_applied || "";
    const fieldVal = candidateAssessment.field || "IT";

    if (currentRound.type === "mcq") {
      const questions = await query(`SELECT id, question, options, difficulty FROM mcq_questions WHERE assessment_id::text = $1::text ORDER BY id ASC`, [assessmentId]);
      return res.json({ success: true, roundType: "mcq", assessment: { id: candidateAssessment.assessment_id, title: candidateAssessment.title, duration: currentRound.duration || 30, field: fieldVal, jobTitle: jobTitleVal }, rounds, questions, currentRound: candidateAssessment.current_round || 1, totalRounds: rounds.length });
    } else if (currentRound.type === "task") {
      const taskInfo = {
        name: currentRound.name || "Task Round",
        description: currentRound.description || "Complete the task details below",
        duration: currentRound.duration || 60,
        taskFile: currentRound.taskFile || null,
        taskFileName: currentRound.taskFileName || null,
        taskDriveLink: currentRound.taskDriveLink || null,
      };
      return res.json({
        success: true,
        roundType: "task",
        assessment: { id: candidateAssessment.assessment_id, title: candidateAssessment.title, duration: currentRound.duration || 60, field: fieldVal, jobTitle: jobTitleVal },
        rounds,
        taskInfo,
        currentRound: candidateAssessment.current_round || 1,
        totalRounds: rounds.length,
      });
    } else if (currentRound.type === "coding") {
      let codingQuestions = [];
      if (currentRound.questions && currentRound.questions.length > 0) {
        codingQuestions = currentRound.questions;
      } else {
        codingQuestions = [{
          id: 'q1',
          name: currentRound.name || "Coding Challenge",
          description: currentRound.description || "Complete the coding challenge below",
          language: currentRound.language || "javascript",
          starterCode: currentRound.starterCode || "// Write your code here\n",
          testCases: currentRound.testCases || []
        }];
      }
      return res.json({
        success: true, roundType: "coding", assessment: { id: candidateAssessment.assessment_id, title: candidateAssessment.title, duration: currentRound.duration || 60, field: fieldVal, jobTitle: jobTitleVal },
        rounds,
        codingQuestions,
        currentRound: candidateAssessment.current_round || 1, totalRounds: rounds.length,
      });
    } else if (currentRound.type === "interview") {
      let scheduledInterview = null;
      if (candidateAssessment.application_id) {
        try {
          const interviewRows = await query(`SELECT id, scheduled_date, time_slot, platform, interview_type, status, meet_link FROM interviews WHERE application_id::text = $1::text ORDER BY created_at DESC LIMIT 1`, [candidateAssessment.application_id]);
          scheduledInterview = interviewRows[0] || null;
        } catch (intErr: any) {
          console.warn("[getAssessmentQuestions] interviews query failed (table may not exist):", intErr.message);
        }
      }
      // Merge interview round JSON from assessment builder (date/time/link/notes) when DB row is missing or incomplete
      const r = currentRound as any;
      const fromRound = {
        scheduledDate: r.scheduledDate || r.scheduled_date || "",
        scheduledTime: r.scheduledTime || r.scheduled_time || "",
        meetingLink: r.meetingLink || r.meeting_link || "",
        interviewNotes: r.interviewNotes || r.interview_notes || "",
      };
      const hasBuilderSchedule = Boolean(fromRound.scheduledDate || fromRound.scheduledTime || fromRound.meetingLink || fromRound.interviewNotes);
      const dbDate = scheduledInterview?.scheduled_date ? String(scheduledInterview.scheduled_date).slice(0, 10) : "";
      const dbLink = scheduledInterview?.meet_link || "";
      const effectiveDate = dbDate || fromRound.scheduledDate || "";
      const effectiveLink = dbLink || fromRound.meetingLink || "";
      const scheduled = Boolean(scheduledInterview) || hasBuilderSchedule;
      const interviewInfo = {
        name: currentRound.name || "Interview Round",
        description:
          fromRound.interviewNotes ||
          currentRound.description ||
          "The company will contact you to schedule an interview. Please check your email regularly.",
        status: scheduledInterview?.status || (hasBuilderSchedule ? "scheduled" : "pending_schedule"),
        message: scheduled
          ? "Your interview details are below. Open Interview Schedule for updates."
          : "Your interview will be scheduled by the company soon. Please check Interview Schedule regularly.",
        applicationId: candidateAssessment.application_id || null,
        scheduledInterview,
        builderSchedule: hasBuilderSchedule ? fromRound : null,
        scheduledDate: effectiveDate,
        scheduledTime: fromRound.scheduledTime || scheduledInterview?.time_slot || "",
        meetLink: effectiveLink,
        interviewsPageUrl: candidateAssessment.application_id ? `/student/scheduled?applicationId=${candidateAssessment.application_id}` : "/student/scheduled",
      };
      return res.json({
        success: true,
        roundType: "interview",
        assessment: {
          id: candidateAssessment.assessment_id,
          title: candidateAssessment.title,
          duration: currentRound.duration || 45,
        },
        rounds,
        interviewInfo,
        currentRound: candidateAssessment.current_round || 1,
        totalRounds: rounds.length,
        isLastRound: true,
      });
    } else {
      return res.status(400).json({ error: `Unknown round type: ${currentRound.type}` });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch questions", details: error.message });
  }
};

export const submitAssessment = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id;
    const assessmentId = String(req.params.assessmentId);
    const { responses, code, roundType, fullscreenExited } = req.body;

    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const caRows = await query(
      `SELECT ca.*, a.rounds, a.total_rounds 
       FROM candidate_assessments ca 
       JOIN assessments a ON a.id::text = ca.assessment_id::text 
       WHERE (
         ca.student_id::text = $1::text OR 
         ca.application_id::text IN (
           SELECT id::text FROM applications WHERE student_id::text = $1::text
         )
       ) 
       AND ca.assessment_id::text = $2::text`, 
      [String(studentId), String(assessmentId)]
    );
    if (!caRows.length) return res.status(404).json({ error: "Assessment not found" });

    const candidateAssessment = caRows[0];
    const rounds = typeof candidateAssessment.rounds === "string" ? JSON.parse(candidateAssessment.rounds) : (candidateAssessment.rounds || []);
    const currentRoundNum = candidateAssessment.current_round || 1;
    const currentRound = rounds[currentRoundNum - 1];

    if (!currentRound) return res.status(400).json({ error: "Invalid assessment round configuration" });

    if (fullscreenExited) {
      await failCandidateRound(candidateAssessment, roundType || (currentRound as any).type || "mcq", {
        achievedPct: 0,
        threshold: resolveRoundThreshold(currentRound as any),
        studentId,
        assessmentTitle: candidateAssessment.title,
        fullscreenExited: true,
      }, req);

      return res.json({
        success: true,
        mcqPassed: false,
        message: "Assessment submitted automatically because you exited fullscreen mode.",
        score: 0,
        total: 100,
        isCompleted: true,
      });
    }

    const expectedRoundType = String((currentRound as any).type || "").toLowerCase();
    const submittedRoundType = String(roundType || "").toLowerCase();
    if (!submittedRoundType || submittedRoundType !== expectedRoundType) {
      return res.status(400).json({ error: `Round type mismatch. Expected ${expectedRoundType || "unknown"}, received ${submittedRoundType || "none"}` });
    }

    // TIME WINDOW VALIDATION ON SUBMISSION
    const now = new Date();
    if (currentRound.endTime) {
      const endTime = new Date(currentRound.endTime);
      // Allow a small grace period (e.g., 30 seconds) for network latency
      if (now.getTime() > endTime.getTime() + 30000) {
        return res.status(403).json({ error: "Submission failed: Assessment period has ended." });
      }
    }

    let score = 0, total = 0;

    if (submittedRoundType === "mcq") {
      const hasPointsColumn = await columnExists("mcq_questions", "points");
      const hasCorrectAnswerColumn = await columnExists("mcq_questions", "correct_answer");
      const hasCorrectOptionIndexColumn = hasCorrectAnswerColumn ? false : await columnExists("mcq_questions", "correct_option_index");

      if (!hasCorrectAnswerColumn && !hasCorrectOptionIndexColumn) return res.status(500).json({ error: "Assessment question schema is missing answer key column", details: "Expected mcq_questions.correct_answer or mcq_questions.correct_option_index" });

      const correctAnswerColumn = hasCorrectAnswerColumn ? "correct_answer" : "correct_option_index";
      const pointsSelect = hasPointsColumn ? "COALESCE(points, 1) AS points" : "1 AS points";

      const questions = await query(`SELECT id, ${correctAnswerColumn} AS correct_answer, ${pointsSelect} FROM mcq_questions WHERE assessment_id = $1`, [assessmentId]);
      if (!questions.length) return res.status(400).json({ error: "No MCQ questions configured for this assessment" });

      const responseList = Array.isArray(responses) ? responses : [];

      const answerMap: Record<number, any> = {};
      questions.forEach((q: any) => {
        const questionId = Number(q.id);
        if (Number.isInteger(questionId)) answerMap[questionId] = q;
      });

      const responseMap: Record<number, any> = {};
      for (const response of responseList) {
        const questionId = Number(response?.question_id);
        if (Number.isInteger(questionId) && answerMap[questionId]) {
          responseMap[questionId] = response;
        }
      }

      const noValidResponses = Object.keys(responseMap).length === 0;

      for (const q of questions) {
        const questionId = Number(q.id);
        const question = Number.isInteger(questionId) ? answerMap[questionId] : null;
        if (!question) continue;

        const questionPoints = Number(question.points) || 1;
        const selectedOption = responseMap[questionId]?.selected_option;

        total += questionPoints;
        const isCorrect = selectedOption !== null && selectedOption !== undefined && selectedOption === question.correct_answer;
        if (isCorrect) score += questionPoints;

        if (selectedOption !== null && selectedOption !== undefined) {
          await query(`INSERT INTO mcq_responses (candidate_assessment_id, question_id, selected_option, is_correct) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [candidateAssessment.id, questionId, selectedOption, isCorrect]);
        }
      }

      await query(`UPDATE candidate_assessments SET mcq_score = $1, mcq_total = $2, mcq_completed_at = NOW() WHERE id = $3`, [score, total, candidateAssessment.id]);

      const cr = currentRound as any;
      const threshold = resolveRoundThreshold(cr);
      const achievedPct = total > 0 ? (score / total) * 100 : 0;

      if (noValidResponses) {
        await failCandidateRound(candidateAssessment, "mcq", {
          achievedPct: 0,
          threshold,
          studentId,
          assessmentTitle: candidateAssessment.title,
        }, req);
        return res.json({
          success: true,
          mcqPassed: false,
          message: `No valid responses were submitted. You must score at least ${threshold}% to continue.`,
          score,
          total,
          passRequiredPercent: threshold,
          currentRound: currentRoundNum,
          nextRound: null,
          isCompleted: false,
        });
      }

      if (achievedPct < threshold) {
        await failCandidateRound(candidateAssessment, "mcq", {
          achievedPct,
          threshold,
          studentId,
          assessmentTitle: candidateAssessment.title,
        }, req);
        return res.json({
          success: true,
          mcqPassed: false,
          message: `Your score (${achievedPct.toFixed(1)}%) is below the pass mark (${threshold}%).`,
          score,
          total,
          passRequiredPercent: threshold,
          currentRound: currentRoundNum,
          nextRound: null,
          isCompleted: false,
        });
      }
    }

    if (submittedRoundType === "coding" && code) {
      await query(`UPDATE candidate_assessments SET coding_score = 100, coding_completed_at = NOW() WHERE id = $1`, [candidateAssessment.id]);
      score = 100; total = 100;
    }

    if (submittedRoundType === "task") {
      const { taskFile } = req.body;
      if (!taskFile) {
        return res.status(400).json({ error: "Task file is required for submission." });
      }
      await query(
        `UPDATE candidate_assessments 
         SET task_file = $1, task_completed_at = NOW() 
         WHERE id = $2`,
        [taskFile, candidateAssessment.id]
      );
      score = 100;
      total = 100;
    }

    const nextRound = currentRoundNum + 1;
    const isLastRound = nextRound > rounds.length;
    const newStatus = isLastRound ? "completed" : "in_progress";

    if (isLastRound) {
      await query(`UPDATE candidate_assessments SET current_round = $1, status = $2, completed_at = NOW() WHERE id = $3`, [currentRoundNum, newStatus, candidateAssessment.id]);
    } else {
      await query(`UPDATE candidate_assessments SET current_round = $1, status = $2 WHERE id = $3`, [nextRound, newStatus, candidateAssessment.id]);
    }

    // Sync assessment progress to applications.stage (next round the candidate is entering, or last completed type if finished)
    if (candidateAssessment.application_id) {
      const stageMap: Record<string, string> = { mcq: "mcq", coding: "coding", task: "task", interview: "interview" };
      let newStage = stageMap[submittedRoundType] || String(currentRound?.type || "applied");
      if (!isLastRound && rounds[nextRound - 1]) {
        const nt = String((rounds[nextRound - 1] as any).type || "").toLowerCase();
        if (nt === "interview") newStage = "interview";
        else if (nt === "coding") newStage = "coding";
        else if (nt === "task") newStage = "task";
        else if (nt === "mcq") newStage = "mcq";
      }
      try {
        await query(
          `UPDATE applications SET stage = $1, updated_at = NOW() WHERE id::text = $2::text`,
          [newStage, String(candidateAssessment.application_id)]
        );
      } catch (stageErr: any) {
        console.error("[Assessment] Stage sync error:", stageErr.message);
      }
    }

    res.json({
      success: true,
      message: "Round submitted successfully",
      score,
      total,
      mcqPassed: submittedRoundType === "mcq" ? true : undefined,
      currentRound: currentRoundNum,
      nextRound: isLastRound ? null : nextRound,
      isCompleted: isLastRound,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit assessment", details: error.message });
  }
};

export const runCode = async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, language, testCases } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    if (testCases && testCases.length > 0) {
      const results = await runTestCases(language || "javascript", code, testCases);
      const isNotConfigured = results.results.every((r: any) => r.error && r.error.includes("not configured"));
      if (isNotConfigured) {
        return res.json({
          success: false,
          notConfigured: true,
          message: "Code execution is not available. Click Submit Solution to get AI-based scoring.",
          results: results.results,
          summary: results.summary
        });
      }
      return res.json({ success: true, ...results });
    }

    const result = await executeCode(language || "javascript", code, "");
    if (result.error?.includes("not configured")) {
      return res.json({
        success: false,
        notConfigured: true,
        message: "Code execution is not available. Click Submit Solution to get AI-based scoring."
      });
    }
    res.json({ success: result.success, output: result.output, error: result.error, compileError: result.compileError });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to execute code" });
  }
};

export const submitCode = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id;
    const assessmentId = String(req.params.assessmentId);
    const { code, language, fullscreenExited } = req.body;

    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const caRows = await query(
      `SELECT ca.*, a.rounds, a.total_rounds 
       FROM candidate_assessments ca 
       JOIN assessments a ON a.id::text = ca.assessment_id::text 
       WHERE (
         ca.student_id::text = $1::text OR 
         ca.application_id::text IN (
           SELECT id::text FROM applications WHERE student_id::text = $1::text
         )
       ) 
       AND ca.assessment_id::text = $2::text`, 
      [String(studentId), String(assessmentId)]
    );
    if (!caRows.length) return res.status(404).json({ error: "Assessment not found" });

    const candidateAssessment = caRows[0];
    const rounds = typeof candidateAssessment.rounds === "string" ? JSON.parse(candidateAssessment.rounds) : (candidateAssessment.rounds || []);
    const currentRoundNum = candidateAssessment.current_round || 1;
    const currentRound = rounds[currentRoundNum - 1];

    if (!currentRound || currentRound.type !== "coding") return res.status(400).json({ error: "Current round is not a coding round" });

    if (fullscreenExited) {
      await failCandidateRound(candidateAssessment, "coding", {
        achievedPct: 0,
        threshold: resolveRoundThreshold(currentRound as any),
        studentId,
        assessmentTitle: candidateAssessment.title,
        fullscreenExited: true,
      }, req);

      return res.json({
        success: true,
        codingPassed: false,
        message: "Assessment submitted automatically because you exited fullscreen mode.",
        score: 0,
        total: 100,
        isCompleted: true,
      });
    }

    // TIME WINDOW VALIDATION ON SUBMISSION
    const now = new Date();
    if (currentRound.endTime) {
      const endTime = new Date(currentRound.endTime);
      // Allow a small grace period (e.g., 30 seconds) for network latency
      if (now.getTime() > endTime.getTime() + 30000) {
        return res.status(403).json({ error: "Submission failed: Assessment period has ended." });
      }
    }

    const testCases = currentRound.testCases || [];
    let score = 0, total = 100, testResults = null;
    let aiResult = null;
    const problemDesc = currentRound.description || currentRound.title || "";

    const isExecutionNotConfigured = (results: any[]) =>
      results.every((r: any) => r.error && r.error.includes("not configured"));

    if (testCases.length > 0) {
      try {
        testResults = await runTestCases(language || currentRound.language || "javascript", code, testCases);
        score = testResults?.summary?.score ?? 0;
      } catch (execErr: any) {
        console.error("[submitCode] runTestCases error:", execErr.message);
        testResults = null;
        score = 0;
      }

      // If execution is not configured OR failed entirely, fall back to AI scoring
      const shouldFallback = !testResults || (score === 0 && isExecutionNotConfigured(testResults.results));
      if (shouldFallback) {
        try {
          aiResult = await evaluateCode(code || "", language || "javascript", problemDesc);
          score = Number(aiResult?.score) || 0;
          testResults = {
            results: testCases.map((tc: any, i: number) => ({
              testNumber: i + 1,
              input: tc.input,
              expectedOutput: tc.output,
              actualOutput: "(AI evaluated — no executor)",
              passed: score >= 60,
              error: null
            })),
            summary: {
              passed: score >= 60 ? testCases.length : 0,
              total: testCases.length,
              allPassed: score >= 60,
              score
            }
          };
        } catch (aiErr: any) {
          console.error("AI fallback scoring failed:", aiErr.message);
        }
      }
    } else {
      try {
        const execResult = await executeCode(language || "javascript", code, "");
        if (execResult.success) {
          score = 100;
        } else if (execResult.error?.includes("not configured")) {
          try {
            aiResult = await evaluateCode(code || "", language || "javascript", problemDesc);
            score = Number(aiResult?.score) || 0;
          } catch (aiErr: any) {
            console.error("AI fallback scoring failed:", aiErr.message);
          }
        }
      } catch (execErr: any) {
        console.error("[submitCode] executeCode error:", execErr.message);
      }
    }

    await query(
      `UPDATE candidate_assessments SET coding_score = $1, coding_completed_at = NOW(), submitted_code = $2, coding_language = $3 WHERE id = $4`,
      [score, code || "", language || "javascript", candidateAssessment.id]
    );

    // Coding pass/fail gate
    const codingThreshold = resolveRoundThreshold(currentRound as any);
    const codingAchievedPct = Math.max(0, Math.min(100, Number(score) || 0));
    if (codingAchievedPct < codingThreshold) {
      await failCandidateRound(candidateAssessment, "coding", {
        achievedPct: codingAchievedPct,
        threshold: codingThreshold,
        studentId,
        assessmentTitle: (candidateAssessment as any).title,
      }, req);
      // Save AI result if available (non-blocking if not)
      if (aiResult) {
        try {
          await query(
            `UPDATE candidate_assessments SET ai_coding_score = $1, ai_coding_feedback = $2 WHERE id = $3`,
            [aiResult.score, JSON.stringify(aiResult), candidateAssessment.id]
          );
        } catch (e: any) {
          console.error("[submitCode] AI result save (fail path):", e.message);
        }
      }
      return res.json({
        success: true,
        codingPassed: false,
        message: `Your score (${codingAchievedPct.toFixed(1)}%) is below the pass mark (${codingThreshold}%).`,
        score,
        total,
        passRequiredPercent: codingThreshold,
        testResults: testResults?.results || null,
        summary: testResults?.summary || { passed: 0, total: 1 },
        currentRound: currentRoundNum,
        nextRound: null,
        isCompleted: false,
      });
    }

    // Save AI result if we already have it; otherwise run async
    const caId = candidateAssessment.id;
    if (aiResult) {
      await query(
        `UPDATE candidate_assessments SET ai_coding_score = $1, ai_coding_feedback = $2 WHERE id = $3`,
        [aiResult.score, JSON.stringify(aiResult), caId]
      );
    } else {
      // Non-blocking AI evaluation — runs after response is sent
      setImmediate(async () => {
        try {
          const asyncAiResult = await evaluateCode(code || "", language || "javascript", problemDesc);
          await query(
            `UPDATE candidate_assessments SET ai_coding_score = $1, ai_coding_feedback = $2 WHERE id = $3`,
            [asyncAiResult.score, JSON.stringify(asyncAiResult), caId]
          );
        } catch (aiError: any) {
          console.error("AI code evaluation failed (non-critical):", aiError.message);
        }
      });
    }

    const nextRound = currentRoundNum + 1;
    const isLastRound = nextRound > rounds.length;
    let newStatus = isLastRound ? "completed" : "in_progress";

    if (isLastRound) {
      await query(`UPDATE candidate_assessments SET current_round = $1, status = $2, completed_at = NOW() WHERE id = $3`, [currentRoundNum, newStatus, candidateAssessment.id]);
    } else {
      await query(`UPDATE candidate_assessments SET current_round = $1, status = $2 WHERE id = $3`, [nextRound, newStatus, candidateAssessment.id]);
    }

    if (candidateAssessment.application_id) {
      try {
        let newStage = "coding";
        if (!isLastRound && rounds[nextRound - 1]) {
          const nt = String((rounds[nextRound - 1] as any).type || "").toLowerCase();
          if (nt === "interview") newStage = "interview";
          else if (nt === "coding") newStage = "coding";
          else if (nt === "mcq") newStage = "mcq";
        }
        await query(`UPDATE applications SET stage = $1, updated_at = NOW() WHERE id::text = $2::text`, [
          newStage,
          String(candidateAssessment.application_id),
        ]);
      } catch (stageErr: any) {
        console.error("[submitCode] Stage sync error:", stageErr.message);
      }
    }

    res.json({ success: true, message: "Code submitted successfully", score, total, testResults: testResults?.results || null, summary: testResults?.summary || { passed: score === 100 ? 1 : 0, total: 1 }, currentRound: currentRoundNum, nextRound: isLastRound ? null : nextRound, isCompleted: isLastRound });
  } catch (error: any) {
    console.error("submitCode error:", error.message, error.stack);
    res.status(500).json({ error: "Failed to submit code", details: error.message });
  }
};

export const getStudentAvatar = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId) || String(req.params.id);
    const result = await query(`SELECT profile_photo FROM students WHERE id = $1;`, [studentId]);

    if (!result[0] || !result[0].profile_photo) return res.redirect(`https://ui-avatars.com/api/?name=Student&background=random`);

    const base64Data = result[0].profile_photo;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      res.setHeader("Content-Type", mimeType);
      // If versioned (?v=) we can cache long; otherwise short cache so updates show after save
      const hasVersion = Boolean(req.query.v);
      res.setHeader("Cache-Control", hasVersion ? "public, max-age=86400, immutable" : "public, max-age=60, must-revalidate");
      return res.send(buffer);
    }
    return res.redirect(`https://ui-avatars.com/api/?name=Student&background=random`);
  } catch (error: any) {
    res.redirect(`https://ui-avatars.com/api/?name=Student&background=random`);
  }
};

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    await NotificationModel.createTable();
    const notifications = await NotificationModel.getStudentNotifications(studentId);
    const unreadCount = await NotificationModel.getUnreadCount(studentId);
    res.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications." });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const notificationId = String(req.params.notificationId);
    await NotificationModel.markAsRead(notificationId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to mark as read." });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    await NotificationModel.markAllAsRead(studentId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to mark all as read." });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.notificationId);
    const deleted = await NotificationModel.deleteNotification(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete notification." });
  }
};

/** POST /api/student/auth/forgot-password/request-otp */
export const requestStudentPasswordReset = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });
  const normalizedEmail = email.trim().toLowerCase();
  try {
    // Auto-create otp_codes table if it doesn't exist yet on this environment
    await query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const [student] = await sql`SELECT name FROM students WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1`;
    if (!student) return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });
    
    try {
      await sql`UPDATE otp_codes SET is_used = true WHERE LOWER(email) = LOWER(${normalizedEmail}) AND is_used = false`;
    } catch (updateErr: any) {
      console.warn("[OTP] Warning marking old OTPs as used:", updateErr.message);
      // Continue - not critical
    }
    
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    try {
      await sql`INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (${normalizedEmail}, ${otp}, ${expiresAt})`;
    } catch (insertErr: any) {
      console.error("[OTP] Error inserting OTP:", insertErr.message);
      return res.status(500).json({ success: false, message: "Failed to generate OTP code." });
    }
    
    try {
      await sendOtpEmail(normalizedEmail, otp, student.name || 'Student');
      console.log(`[OTP] Email sent to ${normalizedEmail}`);
    } catch (emailErr: any) {
      console.warn(`[OTP] Email send failed (may be dev mode): ${emailErr.message}`);
      console.log(`[OTP] Test OTP for ${normalizedEmail}: ${otp}`);
      // Continue anyway - don't fail the request
    }
    
    return res.json({ success: true, message: "If this email exists, a password reset OTP has been sent." });
  } catch (error: any) {
    console.error("Student request password reset error:", error.message, error.stack);
    return res.status(500).json({ success: false, message: "Failed to process password reset request" });
  }
};

/** POST /api/student/auth/forgot-password/reset */
export const resetStudentPassword = async (req: Request, res: Response): Promise<any> => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  if (String(newPassword).length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    let otpRecord;
    try {
      const results = await sql`SELECT * FROM otp_codes WHERE LOWER(email) = LOWER(${normalizedEmail}) AND otp_code = ${otp} AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;
      [otpRecord] = results;
    } catch (otpErr: any) {
      console.error("[Password Reset] OTP lookup error:", otpErr.message);
      return res.status(500).json({ success: false, message: "Failed to verify OTP." });
    }
    
    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    
    let student;
    try {
      student = await studentModel.findStudentByEmail(normalizedEmail);
    } catch (findErr: any) {
      console.error("[Password Reset] Find student error:", findErr.message);
      return res.status(500).json({ success: false, message: "Failed to lookup account." });
    }
    
    if (!student) return res.status(404).json({ success: false, message: "Account not found" });
    
    let salt, passwordHash;
    try {
      salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(newPassword, salt);
    } catch (hashErr: any) {
      console.error("[Password Reset] Hash error:", hashErr.message);
      return res.status(500).json({ success: false, message: "Failed to hash password." });
    }
    
    try {
      await sql`UPDATE students SET password = ${passwordHash} WHERE LOWER(email) = LOWER(${normalizedEmail})`;
    } catch (updateErr: any) {
      console.error("[Password Reset] Update password error:", updateErr.message);
      return res.status(500).json({ success: false, message: "Failed to update password." });
    }
    
    try {
      await sql`UPDATE otp_codes SET is_used = true WHERE id = ${otpRecord.id}`;
    } catch (markErr: any) {
      console.warn("[Password Reset] Warning marking OTP as used:", markErr.message);
      // Continue - OTP was already marked somehow
    }
    
    return res.json({ success: true, message: "Password reset successful. Please login." });
  } catch (error: any) {
    console.error("Student reset password error:", error.message, error.stack);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

export const getStreakStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id;
    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const rows = await sql`SELECT daily_streak, last_active_date FROM students WHERE id = ${studentId} LIMIT 1`;
    const student = rows[0];
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    let currentStreak = Number(student.daily_streak || 0);
    const lastActive = student.last_active_date || "";

    let completedToday = false;

    if (lastActive === today) {
      completedToday = true;
    } else if (lastActive === yesterday) {
      completedToday = false;
    } else {
      // Streak broken
      if (currentStreak > 0) {
        currentStreak = 0;
        await sql`UPDATE students SET daily_streak = 0 WHERE id = ${studentId}`;
      }
      completedToday = false;
    }

    return res.json({
      success: true,
      dailyStreak: currentStreak,
      completedToday,
      lastActiveDate: lastActive
    });
  } catch (error: any) {
    console.error("Get streak status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to get streak status" });
  }
};

export const updateStreak = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = (req as any).user?.id;
    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const rows = await sql`SELECT daily_streak, last_active_date FROM students WHERE id = ${studentId} LIMIT 1`;
    const student = rows[0];
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    const currentStreak = Number(student.daily_streak || 0);
    const lastActive = student.last_active_date || "";

    let newStreak = currentStreak;

    if (lastActive === today) {
      // Already active today
      return res.json({
        success: true,
        dailyStreak: currentStreak,
        completedToday: true,
        message: "Streak already updated for today."
      });
    } else if (lastActive === yesterday) {
      // Consecutive day play
      newStreak = currentStreak + 1;
    } else {
      // First time or broken streak
      newStreak = 1;
    }

    await sql`UPDATE students SET daily_streak = ${newStreak}, last_active_date = ${today} WHERE id = ${studentId}`;

    return res.json({
      success: true,
      dailyStreak: newStreak,
      completedToday: true,
      message: newStreak > currentStreak ? "Streak incremented!" : "Streak started!"
    });
  } catch (error: any) {
    console.error("Update streak error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update streak" });
  }
};

export const getReferrals = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    const referrals = await query(
      `SELECT id, name, email, username, status, created_at 
       FROM students 
       WHERE referred_by = $1 
       ORDER BY created_at DESC`,
      [studentId]
    );

    // Map to include points earned per referral (each is 10 points)
    const data = referrals.map((ref: any) => ({
      id: ref.id,
      name: ref.name || ref.username || "Referred Friend",
      email: ref.email,
      status: ref.status || "active",
      joinedAt: ref.created_at,
      pointsEarned: 10
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get referrals error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch referrals list." });
  }
};

export const getSavedJobs = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ success: false, message: "Invalid student id." });

    const savedJobs = await query(
      `SELECT j.*, s.company_name, s.logo_url 
       FROM saved_jobs sj
       JOIN jobs j ON sj.job_id = j.id
       LEFT JOIN startups s ON j.startup_id = s.id
       WHERE sj.student_id = $1
       ORDER BY sj.created_at DESC`,
      [studentId]
    );

    res.json({ success: true, savedJobs });
  } catch (error: any) {
    console.error("Get saved jobs error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch saved jobs." });
  }
};

export const toggleSavedJob = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String(req.params.studentId);
    const { jobId } = req.body;
    if (!studentId || !jobId) return res.status(400).json({ success: false, message: "Invalid input." });

    // Check if it's already saved
    const existing = await query(
      `SELECT id FROM saved_jobs WHERE student_id = $1 AND job_id = $2`,
      [studentId, jobId]
    );

    let saved = false;
    if (existing.length > 0) {
      // Unsave it
      await query(`DELETE FROM saved_jobs WHERE student_id = $1 AND job_id = $2`, [studentId, jobId]);
    } else {
      // Save it
      await query(`INSERT INTO saved_jobs (student_id, job_id) VALUES ($1, $2)`, [studentId, jobId]);
      saved = true;
    }

    res.json({ success: true, saved, message: saved ? "Job saved successfully" : "Job removed from saved list" });
  } catch (error: any) {
    console.error("Toggle saved job error:", error.message);
    res.status(500).json({ success: false, message: "Failed to toggle saved job." });
  }
};
