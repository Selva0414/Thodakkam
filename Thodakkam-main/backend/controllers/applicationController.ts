import { Request, Response } from "express";
import * as Application from "../models/applicationModel";
import NotificationModel from "../models/notificationModel";
import { findStudentById } from "../models/studentModel";

import { query } from "../config/database";

export const applyToJob = async (req: Request, res: Response): Promise<any> => {
  try {
    const applicationData = { ...req.body };
    if ((req as any).user && (req as any).user.role === "student") {
      const studentId = (req as any).user.id;
      const student = await findStudentById(studentId);
      if (!student) return res.status(401).json({ error: "Student not found or session expired" });
      applicationData.student_id = studentId;
    }
    const application = await Application.createApplication(applicationData);

    if (application.startup_id) {
      const candidateName = application.candidate_name || application.student_name || "A candidate";
      const jobTitle = application.role_applied || "a role";
      NotificationModel.createStartupNotification({
        startup_id: application.startup_id,
        title: `${candidateName} applied for ${jobTitle}`,
        message: "New application received",
        type: "applied",
      }).then(async (notification: any) => {
        const io = req.app.get("io");
        if (io && notification) {
          const unreadCount = await NotificationModel.getStartupUnreadCount(application.startup_id);
          io.to(`${application.startup_id}_startup`).emit("new_notification", { notification, unreadCount });
        }
      }).catch(() => {});
    }

    res.status(201).json(application);
  } catch (error: any) {
    console.error("Error applying to job:", error);
    res.status(500).json({ error: error.message || "Failed to apply to job" });
  }
};

export const getMyApplications = async (req: Request, res: Response): Promise<any> => {
  try {
    const { studentId } = req.params;
    const applications = await Application.getApplicationsByStudent(String(studentId));
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getApplicationById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const application = await Application.getApplicationDetails(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const withdrawApplication = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const result = await Application.updateStatus(id, "withdrawn");
    res.json({ success: true, message: "Application withdrawn", application: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestReschedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { reason, screenshot } = req.body;

    const studentId = (req as any).user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, error: "Reason is required for reschedule request." });
    }

    // Verify application exists and belongs to this student
    const appRows = await query(
      `SELECT * FROM applications WHERE id::text = $1 AND student_id::text = $2`,
      [id, studentId]
    );
    if (!appRows.length) {
      return res.status(404).json({ success: false, error: "Application not found or unauthorized" });
    }

    const application = appRows[0];

    // Block if already pending reschedule
    if (application.status === 'reschedule_requested') {
      return res.status(400).json({ success: false, error: "A reschedule request is already pending for this application." });
    }

    // CRITICAL: Only allow reschedule if the assessment is time_expired (NOT score-failed/rejected)
    // Check the candidate_assessment record for this application
    const caRows = await query(
      `SELECT ca.status, ca.overall_result, ca.started_at
       FROM candidate_assessments ca
       WHERE ca.application_id::text = $1::text
       ORDER BY ca.created_at DESC
       LIMIT 1`,
      [id]
    );

    if (caRows.length > 0) {
      const ca = caRows[0];
      const isTimeExpired = ca.status === 'time_expired' || ca.overall_result === 'time_expired';
      const isScoreFailed = ca.status === 'rejected' || (ca.overall_result && ca.overall_result.endsWith('_failed'));

      if (isScoreFailed && !isTimeExpired) {
        return res.status(403).json({
          success: false,
          error: "Reschedule is not available for assessments where you have been evaluated and did not meet the passing criteria."
        });
      }

      // Application must be in a reschedule-eligible state
      const eligibleStatuses = ['reschedule_eligible', 'shortlisted', 'new', 'reviewing'];
      if (!eligibleStatuses.includes(application.status) && !isTimeExpired) {
        return res.status(403).json({
          success: false,
          error: "This assessment is not eligible for rescheduling."
        });
      }
    }

    // Update status to reschedule_requested
    await query(
      `UPDATE applications 
       SET status = 'reschedule_requested', 
           reschedule_reason = $1, 
           reschedule_screenshot = $2, 
           reschedule_requested_at = NOW() 
       WHERE id::text = $3`,
      [reason, screenshot || null, id]
    );

    // Create startup notification
    if (application.startup_id) {
      const candidateName = application.candidate_name || application.student_name || "A candidate";
      const jobTitle = application.role_applied || "a role";
      NotificationModel.createStartupNotification({
        startup_id: application.startup_id,
        title: `Reschedule requested by ${candidateName}`,
        message: `${candidateName} missed the assessment deadline for ${jobTitle} and is requesting a reschedule.`,
        type: "reschedule_requested",
        link: "/startup/reschedule",
      }).then(async (notification: any) => {
        const io = req.app.get("io");
        if (io && notification) {
          const unreadCount = await NotificationModel.getStartupUnreadCount(application.startup_id);
          io.to(`${application.startup_id}_startup`).emit("new_notification", { notification, unreadCount });
        }
      }).catch(() => {});
    }

    return res.json({ success: true, message: "Reschedule request submitted successfully." });
  } catch (error: any) {
    console.error("Reschedule request error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to submit reschedule request" });
  }
};

