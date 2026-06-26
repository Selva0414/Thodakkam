import { query, pool } from "../config/database";
import NotificationModel from "../models/notificationModel";
import { sendInterviewReminderEmail } from "../services/emailService";

export async function checkAndSendInterviewReminders(io?: any) {
  try {
    const upcomingInterviews = await query(`
      SELECT
        i.id AS interview_id,
        i.application_id,
        i.scheduled_date,
        i.time_slot,
        i.startup_id,
        i.meet_link,
        a.student_id,
        a.role_applied,
        s.company_name,
        s.email AS startup_email,
        st.name AS student_name,
        st.email AS student_email
      FROM interviews i
      JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN startups s ON s.id::text = i.startup_id::text
      LEFT JOIN students st ON st.id::text = a.student_id::text
      WHERE i.status = 'scheduled'
        AND i.reminder_sent = false
        AND i.scheduled_date IS NOT NULL
        AND i.time_slot IS NOT NULL
        AND (
          i.scheduled_date::date +
          (
            CASE
              WHEN i.time_slot ~* '^\\s*\\d{1,2}:\\d{2}\\s*(AM|PM)\\s*$'
              THEN (
                CASE
                  WHEN UPPER(SUBSTRING(i.time_slot FROM '(AM|PM)')) = 'PM'
                       AND CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) < 12
                    THEN MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) + 12,
                                        mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                  WHEN UPPER(SUBSTRING(i.time_slot FROM '(AM|PM)')) = 'AM'
                       AND CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) = 12
                    THEN MAKE_INTERVAL(hours => 0,
                                        mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                  ELSE MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT),
                                      mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                END
              )
              WHEN i.time_slot ~ '^\\s*\\d{1,2}:\\d{2}\\s*$'
              THEN MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT),
                                  mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
              ELSE NULL
            END
          )
        ) > NOW()
        AND (
          i.scheduled_date::date +
          (
            CASE
              WHEN i.time_slot ~* '^\\s*\\d{1,2}:\\d{2}\\s*(AM|PM)\\s*$'
              THEN (
                CASE
                  WHEN UPPER(SUBSTRING(i.time_slot FROM '(AM|PM)')) = 'PM'
                       AND CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) < 12
                    THEN MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) + 12,
                                        mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                  WHEN UPPER(SUBSTRING(i.time_slot FROM '(AM|PM)')) = 'AM'
                       AND CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT) = 12
                    THEN MAKE_INTERVAL(hours => 0,
                                        mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                  ELSE MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT),
                                      mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
                END
              )
              WHEN i.time_slot ~ '^\\s*\\d{1,2}:\\d{2}\\s*$'
              THEN MAKE_INTERVAL(hours => CAST(SUBSTRING(i.time_slot FROM '^\\s*(\\d{1,2})') AS INT),
                                  mins  => CAST(SUBSTRING(i.time_slot FROM ':(\\d{2})') AS INT))
              ELSE NULL
            END
          )
        ) <= NOW() + INTERVAL '11 minutes'
    `);

    if (upcomingInterviews.length === 0) return;

    console.log(`[ReminderCron] Found ${upcomingInterviews.length} upcoming interviews`);

    for (const row of upcomingInterviews) {
      try {
        await query('UPDATE interviews SET reminder_sent = true WHERE id = $1', [row.interview_id]);
        
        const role = row.role_applied || 'Interview';

        // Notify student
        if (row.student_id && row.student_email) {
          const studentNotification = await NotificationModel.createNotification({
            student_id: row.student_id,
            title: `⏰ Reminder: ${role} starting in 10 minutes`,
            message: `Your scheduled interview/assessment with ${row.company_name || 'a startup'} is starting in 10 minutes.`,
            type: "interview",
            link: "/student/interviews",
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
            title: `⏰ Reminder: ${role} starting in 10 minutes`,
            message: `Your scheduled interview/assessment with ${row.student_name || 'candidate'} is starting in 10 minutes.`,
            type: "interview",
            link: "/startup/interviews",
          });

          if (io && startupNotification) {
            io.to(`${row.startup_id}_startup`).emit("new_notification", {
              notification: startupNotification,
              unreadCount: await NotificationModel.getStartupUnreadCount(row.startup_id),
            });
          }

          await sendInterviewReminderEmail(row.startup_email, row.company_name || 'Startup', role, true, row.meet_link);
        }

        console.log(`[ReminderCron] Reminders sent for interview ${row.interview_id}`);
      } catch (err: any) {
        console.error(`[ReminderCron] Error processing reminder for interview ${row.interview_id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[ReminderCron] Error running reminder check:", err.message);
  }
}
