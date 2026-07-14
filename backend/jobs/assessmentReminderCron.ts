import { query } from "../config/database";
import NotificationModel from "../models/notificationModel";
import { sendInterviewReminderEmail } from "../services/emailService";

export async function checkAndSendAssessmentReminders(io?: any) {
  try {
    // Check candidate_assessments for rounds that have a startTime
    const upcomingAssessments = await query(`
      SELECT
        ca.id AS ca_id,
        ca.current_round,
        a.id AS assessment_id,
        a.title AS assessment_title,
        a.startup_id,
        a.rounds -> (ca.current_round - 1) ->> 'type' AS round_type,
        a.rounds -> (ca.current_round - 1) ->> 'name' AS round_name,
        a.rounds -> (ca.current_round - 1) ->> 'startTime' AS start_time,
        a.rounds -> (ca.current_round - 1) ->> 'meetingLink' AS meet_link,
        app.id AS application_id,
        app.student_id,
        app.role_applied,
        s.company_name,
        s.email AS startup_email,
        st.name AS student_name,
        st.email AS student_email,
        j.title AS job_title
      FROM candidate_assessments ca
      JOIN assessments a ON a.id = ca.assessment_id
      JOIN applications app ON app.id = ca.application_id
      LEFT JOIN startups s ON s.id = a.startup_id
      LEFT JOIN students st ON st.id = app.student_id
      LEFT JOIN jobs j ON j.id = app.job_id
      WHERE ca.status IN ('pending', 'in_progress')
        AND ca.reminder_sent_round < ca.current_round
        AND a.rounds -> (ca.current_round - 1) ->> 'startTime' IS NOT NULL
        AND (a.rounds -> (ca.current_round - 1) ->> 'startTime')::timestamp > NOW()
        AND (a.rounds -> (ca.current_round - 1) ->> 'startTime')::timestamp <= NOW() + INTERVAL '11 minutes'
    `);

    if (upcomingAssessments.length === 0) return;

    console.log(`[AssessmentReminderCron] Found ${upcomingAssessments.length} upcoming assessments`);

    for (const row of upcomingAssessments) {
      try {
        await query('UPDATE candidate_assessments SET reminder_sent_round = $1 WHERE id = $2', [row.current_round, row.ca_id]);
        
        const role = row.job_title || row.role_applied || row.assessment_title || 'Assessment';
        const roundName = row.round_name || 'Assessment';

        // Notify student
        if (row.student_id && row.student_email) {
          const studentNotification = await NotificationModel.createNotification({
            student_id: row.student_id,
            title: `⏰ Reminder: ${roundName} starting in 10 minutes`,
            message: `Your scheduled ${roundName} with ${row.company_name || 'a startup'} is starting in 10 minutes.`,
            type: "assessment",
            link: "/student/assessments",
          });

          if (io && studentNotification) {
            io.to(`${row.student_id}_student`).emit("new_notification", {
              notification: studentNotification,
              unreadCount: await NotificationModel.getUnreadCount(row.student_id),
            });
          }

          await sendInterviewReminderEmail(row.student_email, row.student_name || 'Student', role, false, row.meet_link);
        }

        // Notify startup
        if (row.startup_id && row.startup_email) {
          const startupNotification = await NotificationModel.createStartupNotification({
            startup_id: row.startup_id,
            title: `⏰ Reminder: ${roundName} starting in 10 minutes`,
            message: `Your scheduled ${roundName} with ${row.student_name || 'candidate'} is starting in 10 minutes.`,
            type: "assessment",
            link: "/startup/assessments",
          });

          if (io && startupNotification) {
            io.to(`${row.startup_id}_startup`).emit("new_notification", {
              notification: startupNotification,
              unreadCount: await NotificationModel.getStartupUnreadCount(row.startup_id),
            });
          }

          await sendInterviewReminderEmail(row.startup_email, row.company_name || 'Startup', role, true, row.meet_link);
        }

        console.log(`[AssessmentReminderCron] Reminders sent for assessment ${row.ca_id}`);
      } catch (err: any) {
        console.error(`[AssessmentReminderCron] Error processing reminder for assessment ${row.ca_id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[AssessmentReminderCron] Error running reminder check:", err.message);
  }
}
