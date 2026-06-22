import { Request, Response } from "express";
import InterviewModel from "../models/interviewModel";
import * as ApplicationModel from "../models/applicationModel";
import NotificationModel from "../models/notificationModel";
import { query } from "../config/database";
import { computeCanScheduleInterview, getScheduleInterviewBlockReason } from "../utils/assessmentScheduleEligibility";
import { isInterviewPast } from "../utils/interviewTimeUtils";
import { propagateInterviewCompletion } from "../utils/interviewCompletionSync";
import { sendInterviewScheduleEmail } from "../services/emailService";

let interviewSchemaReady = false;

async function ensureInterviewSchema() {
  if (interviewSchemaReady) return;
  try {
    const patches = [
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS round_type TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_type TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewer_ids TEXT[]`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewers TEXT[]`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'google_meet'`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meet_link TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS office_location TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_date DATE`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS time_slot TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_joined_at TIMESTAMPTZ`,
      `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30`,
    ];

    for (const sql of patches) {
      try {
        await query(sql);
      } catch {
        /* ignore legacy schema mismatches */
      }
    }
  } catch (err) {
    console.error("Schema warning (could be duplicate adding):", err);
  }
  interviewSchemaReady = true;
}

export async function scheduleInterview(req: Request, res: Response): Promise<any> {
  console.log("SCHEDULE INTERVIEW REQUEST BODY:", req.body);
  try {
    await ensureInterviewSchema();
    const {
      jobId,
      applicationId,
      interviewType,
      interviewers,
      platform,
      meetingLink,
      notes,
      date,
      time
    } = req.body;

    // Handle common issues: fallback for camelCase vs snake_case or different names currently sent by frontend
    const actualJobId = jobId || req.body.job_id;
    const actualAppId = applicationId || req.body.application_id;
    const actualType = interviewType || req.body.interview_type;
    const actualDate = date || req.body.scheduledDate || req.body.interview_date;
    const actualTime = time || req.body.timeSlot || req.body.interview_time;
    const actualPlatform = platform || "google_meet";
    const actualMeetLink = meetingLink || req.body.meeting_link;
    const actualNotes = notes || req.body.notes;
    const actualDuration = parseInt(req.body.duration) || 30;

    const startupId = String((req as any).user?.id || "").trim();
    if (!startupId) {
      console.warn("SCHEDULE INTERVIEW ERROR: Missing startup auth");
      return res.status(401).json({ error: "Startup authentication required" });
    }

    // Validate incoming request body
    if (!actualJobId || !actualAppId || !actualType || !actualPlatform) {
      console.warn("SCHEDULE INTERVIEW ERROR: Missing fields");
      return res.status(400).json({ error: "Missing required fields: jobId, applicationId, interviewType, platform" });
    }

    // Allow scheduling first, then sharing the meeting link later.
    // Some startup workflows create the interview before the call link is ready.

    try {
      const caRows = await query(
        `SELECT ca.status, ca.current_round, ca.mcq_completed_at, ca.coding_completed_at, ca.overall_result, a.rounds
         FROM candidate_assessments ca
         INNER JOIN assessments a ON a.id = ca.assessment_id
         WHERE ca.application_id::text = $1::text
         ORDER BY ca.id DESC
         LIMIT 1`,
        [String(actualAppId)]
      );
      if (caRows.length > 0) {
        const row = caRows[0] as any;
        const ca = {
          status: row.status,
          current_round: row.current_round,
          mcq_completed_at: row.mcq_completed_at,
          coding_completed_at: row.coding_completed_at,
          overall_result: row.overall_result,
        };
        if (!computeCanScheduleInterview(ca, row.rounds)) {
          const msg = getScheduleInterviewBlockReason(ca, row.rounds) || "Candidate is not ready for interview scheduling yet.";
          return res.status(400).json({ error: msg });
        }
      }
    } catch (gateErr: any) {
      console.error("[scheduleInterview] Assessment gate check:", gateErr.message);
    }

    // Handle array field properly (convert to JSON string before inserting)
    let interviewersArray = interviewers;
    if (!Array.isArray(interviewers)) {
      interviewersArray = [interviewers];
    }
    // Remove duplicates
    const uniqueInterviewers = [...new Set(interviewersArray)];
    const interviewersJson = JSON.stringify(uniqueInterviewers);

    const rows = await query(
      `INSERT INTO interviews (
        startup_id,
        job_id,
        application_id,
        interview_type,
        interviewers,
        platform,
        meet_link,
        notes,
        scheduled_date,
        time_slot,
        status,
        duration
      ) VALUES (
        $1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *`,
      [startupId, actualJobId, actualAppId, actualType, uniqueInterviewers, actualPlatform, actualMeetLink || null, actualNotes || null, actualDate, actualTime, 'scheduled', actualDuration]
    );

    const interview = rows[0];
    console.log("INTERVIEW CREATED:", interview?.id);

    // Optionally update application status as it was doing before, but keeping it brief
    try {
      await ApplicationModel.updateStatus(actualAppId, "interview_scheduled");

      // Fetch student and job details to send notification
      const appResult = await query(
        `SELECT a.student_id, a.candidate_name, a.candidate_email, j.title AS job_title, s.company_name
         FROM applications a
         LEFT JOIN jobs j ON j.id::text = a.job_id::text
         LEFT JOIN startups s ON s.id::text = COALESCE(a.startup_id::text, $2)
         WHERE a.id::text = $1`,
        [actualAppId, startupId]
      );

      const studentInfo = appResult[0];
      if (studentInfo && studentInfo.student_id) {
        let studentName = studentInfo.candidate_name;
        let studentEmail = studentInfo.candidate_email;

        // Fetch registered student details if not present on application
        if (!studentName || !studentEmail) {
          const studentRows = await query(`SELECT name, email FROM students WHERE id::text = $1::text`, [String(studentInfo.student_id)]);
          if (studentRows[0]) {
            studentName = studentName || studentRows[0].name;
            studentEmail = studentEmail || studentRows[0].email;
          }
        }

        // Format date for notification
        const interviewDate = actualDate ? new Date(actualDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const timeInfo = actualTime ? ` at ${actualTime}` : '';
        const dateTimeStr = interviewDate ? ` on ${interviewDate}${timeInfo}` : '';

        const notification = await NotificationModel.createNotification({
          student_id: studentInfo.student_id,
          title: `Interview Scheduled: ${studentInfo.job_title || 'Application'}`,
          message: `${studentInfo.company_name || 'A Startup'} has scheduled a ${actualType || 'interview'}${dateTimeStr}. Click here to view details and respond.`,
          type: "interview",
          link: "/student/job-requests"
        });

        const io = req.app.get("io");
        if (io && notification) {
          io.to(`${studentInfo.student_id}_student`).emit("new_notification", {
            notification,
            unreadCount: await NotificationModel.getUnreadCount(studentInfo.student_id),
          });
        }

        // Create startup notification
        const startupNotification = await NotificationModel.createStartupNotification({
          startup_id: startupId,
          title: `Interview Scheduled`,
          message: `You have scheduled a ${actualType || 'interview'} with ${studentName || 'a candidate'} for ${studentInfo.job_title || 'role'}${dateTimeStr}.`,
          type: "interview",
          link: "/startup/interviews"
        });

        if (io && startupNotification) {
          io.to(`${startupId}_startup`).emit("new_notification", {
            notification: startupNotification,
            unreadCount: await NotificationModel.getStartupUnreadCount(startupId)
          });
        }

        // Send email alert to student
        if (studentEmail) {
          sendInterviewScheduleEmail(
            studentEmail,
            studentName || "Student",
            studentInfo.company_name || "A Startup",
            studentInfo.job_title || "Role",
            actualDate,
            actualTime,
            actualMeetLink || undefined
          ).catch((err) => {
            console.error("Failed to send Interview email alert:", err.message);
          });
        }
      }
    } catch (e) {
      console.error("Error updating application status or sending notification:", e);
    }

    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview,
    });
  } catch (err: any) {
    // Add proper error logging
    console.error("INTERVIEW ERROR:", err);
    require('fs').appendFileSync('interview_error.txt', new Date().toISOString() + '\\n' + String(err) + '\\n' + err.stack + '\\n\\n');
    // Return meaningful error messages instead of generic 500
    return res.status(500).json({
      error: err.message
    });
  }
}

export async function getInterviewerOptions(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const startupId = String((req as any).user?.id || "").trim();
    if (!startupId) return res.status(401).json({ error: "Startup authentication required" });

    const options: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    const startupRows = await query(
      `SELECT founder_name, company_name
       FROM startups
       WHERE id::text = $1
       LIMIT 1`,
      [startupId]
    );

    const founderName = String(startupRows[0]?.founder_name || "").trim();
    if (founderName) {
      const founderId = `founder-${startupId}`;
      options.push({ id: founderId, name: founderName });
      seen.add(founderName.toLowerCase());
    }

    const recentNames = await query(
      `SELECT DISTINCT TRIM(name) AS name
       FROM interviews i
       CROSS JOIN LATERAL UNNEST(COALESCE(i.interviewers, ARRAY[]::TEXT[])) AS name
       WHERE i.startup_id::text = $1
         AND TRIM(name) <> ''
       ORDER BY name ASC`,
      [startupId]
    );

    for (const row of recentNames) {
      const name = String(row?.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;

      const optionId = `hist-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      options.push({ id: optionId, name });
      seen.add(key);
    }

    res.json({ interviewers: options });
  } catch (err: any) {
    console.error("Get interviewer options error:", err.message);
    res.status(500).json({ error: "Failed to fetch interviewer options" });
  }
}

export async function getInterviews(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const startupId = (req as any).user.id;
    const interviews = await InterviewModel.findByStartup(startupId);

    // Auto-sync statuses for past interviews
    for (const iv of interviews) {
      const status = (iv.status || 'scheduled').toLowerCase();
      if (['scheduled', 'in_progress', 'accepted'].includes(status) && isInterviewPast(iv.scheduled_date, iv.time_slot, iv.duration || 60)) {
        const newStatus = iv.candidate_joined_at ? 'completed' : 'rejected';
        await InterviewModel.updateStatus(iv.id, newStatus);
        iv.status = newStatus;

        if (newStatus === 'completed' && iv.application_id) {
          await propagateInterviewCompletion(iv.application_id);
        }
      }
    }

    console.log(`[getInterviews] startup=${startupId} found=${interviews.length}`);
    res.json({ interviews });
  } catch (err: any) {
    console.error('[getInterviews] error:', err.message);
    res.status(200).json({ interviews: [] });
  }
}

export async function updateInterviewStatus(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const { status, score } = req.body;
    const allowed = ['scheduled', 'completed', 'cancelled'];
    if (!status || !allowed.includes(String(status).toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const interview = await InterviewModel.updateStatus(String(req.params.id), status);
    if (!interview) return res.status(404).json({ error: "Interview not found" });

    // When interview is completed, propagate to candidate_assessments and applications
    if (String(status).toLowerCase() === 'completed' && interview.application_id) {
      await propagateInterviewCompletion(interview.application_id, score != null ? Number(score) : 0);
    }

    res.json({ interview });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update interview" });
  }
}

export async function getStudentInterviews(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const studentId = String(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: "Invalid student id" });

    const interviews = await query(
      `SELECT
        i.id, i.job_id, i.round_type, i.scheduled_date, i.time_slot, i.platform, i.interview_type, i.interviewer_ids, i.interviewers,
        i.notes, i.meet_link, i.office_location, i.status, COALESCE(j.title, a.role_applied, 'Interview') AS role_title,
        COALESCE(s.company_name, 'Company') AS company_name, a.id AS application_id, a.status AS application_status,
        COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) AS company_logo
       FROM interviews i
       JOIN applications a ON a.id::text = i.application_id::text
       LEFT JOIN jobs j ON j.id::text = a.job_id::text
       LEFT JOIN startups s ON s.id::text = COALESCE(a.startup_id::text, i.startup_id::text)
       LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
       WHERE a.student_id = $1
       ORDER BY i.scheduled_date ASC, i.id ASC`,
      [studentId]
    );

    res.json({ success: true, interviews });
  } catch (err: any) {
    console.error("Get student interviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch student interviews", detail: err.message });
  }
}

export async function getMyInterviews(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const studentId = (req as any).user?.id;
    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });

    const interviews = await query(
      `SELECT
        i.id, i.job_id, i.round_type, i.scheduled_date, i.time_slot, i.platform, i.interview_type, i.interviewer_ids, i.interviewers,
        i.notes, i.meet_link, i.office_location, i.status, i.candidate_joined_at, i.duration, COALESCE(j.title, a.role_applied, 'Interview') AS role_title,
        COALESCE(s.company_name, 'Company') AS company_name, a.id AS application_id, a.status AS application_status,
        COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) AS company_logo,
        s.company_website, s.company_description
      FROM interviews i
      JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN jobs j ON j.id::text = a.job_id::text
      LEFT JOIN startups s ON s.id::text = COALESCE(a.startup_id::text, i.startup_id::text)
      LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
      WHERE (a.student_id::text = $1::text OR LOWER(a.candidate_email) = (SELECT LOWER(email) FROM students WHERE id::text = $1::text))
      ORDER BY i.scheduled_date ASC, i.id ASC`,
      [studentId]
    );

    // Auto-sync statuses for past interviews
    for (const iv of interviews) {
      const status = (iv.status || 'scheduled').toLowerCase();
      if (['scheduled', 'in_progress', 'accepted'].includes(status) && isInterviewPast(iv.scheduled_date, iv.time_slot, iv.duration || 60)) {
        const newStatus = iv.candidate_joined_at ? 'completed' : 'rejected';
        await InterviewModel.updateStatus(iv.id, newStatus);
        iv.status = newStatus;

        if (newStatus === 'completed' && iv.application_id) {
          await propagateInterviewCompletion(iv.application_id);
        }
      }
    }

    res.json({ success: true, interviews });
  } catch (err: any) {
    console.error("Get my interviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch your interviews", detail: err.message });
  }
}

export async function attendInterview(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const studentId = (req as any).user?.id;
    const interviewId = String(req.params.id);
    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });
    if (!interviewId) return res.status(400).json({ error: "Invalid interview id" });

    const interviewRows = await query(
      `SELECT i.* FROM interviews i JOIN applications a ON a.id::text = i.application_id::text WHERE i.id::text = $1 AND a.student_id::text = $2::text`,
      [interviewId, studentId]
    );

    const interview = interviewRows[0];
    if (!interview) return res.status(404).json({ error: "Interview not found for this student" });

    const currentStatus = (interview.status || "scheduled").toLowerCase();
    const canAttendStatus = ["scheduled", "in_progress"];
    if (!canAttendStatus.includes(currentStatus)) {
      return res.status(400).json({ error: "Interview is not open for attendance yet. Please wait for startup updates." });
    }

    const platform = (interview.platform || "").toLowerCase();
    const needsJoinLink = !platform.includes("office") && !platform.includes("room");
    if (needsJoinLink && !interview.meet_link) {
      return res.status(400).json({ error: "Startup has not shared the meeting link yet." });
    }

    const rows = await query(
      `UPDATE interviews SET candidate_joined_at = COALESCE(candidate_joined_at, NOW()), status = CASE WHEN COALESCE(status, 'scheduled') = 'scheduled' THEN 'in_progress' ELSE status END WHERE id = $1 RETURNING *`,
      [interviewId]
    );

    res.json({ success: true, interview: rows[0] });
  } catch (err: any) {
    console.error("Attend interview error:", err.message);
    res.status(500).json({ error: "Failed to mark interview attendance", detail: err.message });
  }
}

export async function respondInterview(req: Request, res: Response): Promise<any> {
  try {
    await ensureInterviewSchema();
    const studentId = (req as any).user?.id;
    const interviewId = String(req.params.id);
    const { action } = req.body; // 'accept' or 'reject'

    if (!studentId) return res.status(401).json({ error: "Student not authenticated" });
    if (!interviewId) return res.status(400).json({ error: "Invalid interview id" });
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: "Invalid action" });

    // Ensure interview belongs to student
    const interviewRows = await query(
      `SELECT i.* FROM interviews i JOIN applications a ON a.id::text = i.application_id::text WHERE i.id::text = $1 AND a.student_id::text = $2::text`,
      [interviewId, studentId]
    );

    const interview = interviewRows[0];
    if (!interview) return res.status(404).json({ error: "Interview not found for this student" });

    const currentStatus = (interview.status || "scheduled").toLowerCase();
    if (!['scheduled', 'pending'].includes(currentStatus)) {
      return res.status(400).json({ error: "Interview has already been responded to or is no longer pending." });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected_by_student';

    const rows = await query(
      `UPDATE interviews SET status = $1 WHERE id = $2 RETURNING *`,
      [newStatus, interviewId]
    );

    res.json({ success: true, interview: rows[0], applicationId: interview.application_id });
  } catch (err: any) {
    console.error("Respond interview error:", err.message);
    res.status(500).json({ error: "Failed to respond to interview", detail: err.message });
  }
}


