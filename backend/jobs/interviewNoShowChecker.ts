import { query, pool } from "../config/database";
import NotificationModel from "../models/notificationModel";

/**
 * Checks for interview no-shows: interviews where scheduled time + duration has passed
 * and the candidate never joined. Automatically rejects those applications.
 */
export async function checkNoShowInterviews(io?: any) {
  try {
    // Find interviews that are still 'scheduled', candidate never joined,
    // and the end time (scheduled_date + time_slot + duration) has passed.
    // Supports time_slot formats: "H:MM AM/PM", "HH:MM", "H:MMAM/PM" (no space).
    const noShows = await query(`
      SELECT
        i.id AS interview_id,
        i.application_id,
        i.scheduled_date,
        i.time_slot,
        i.duration,
        i.startup_id,
        a.student_id,
        a.role_applied,
        s.company_name
      FROM interviews i
      JOIN applications a ON a.id::text = i.application_id::text
      LEFT JOIN startups s ON s.id::text = i.startup_id::text
      WHERE i.status = 'scheduled'
        AND i.candidate_joined_at IS NULL
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
          ) + MAKE_INTERVAL(mins => COALESCE(i.duration, 30))
        ) < NOW()
    `);

    if (noShows.length === 0) return;

    console.log(`[NoShowChecker] Found ${noShows.length} no-show interview(s)`);

    for (const row of noShows) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `UPDATE interviews SET status = 'completed' WHERE id = $1`,
          [row.interview_id]
        );
        await client.query(
          `UPDATE applications SET status = 'rejected', rejected_at_stage = 'interview' WHERE id::text = $1::text`,
          [row.application_id]
        );
        await client.query(
          `UPDATE candidate_assessments
           SET status = 'completed', overall_result = 'rejected'
           WHERE application_id::text = $1::text AND status != 'completed'`,
          [row.application_id]
        );
        await client.query("COMMIT");
      } catch (err: any) {
        try { await client.query("ROLLBACK"); } catch { /* ignore */ }
        console.error(`[NoShowChecker] Error processing interview ${row.interview_id}:`, err.message);
        client.release();
        continue;
      }
      client.release();

      // Send notification to student
      try {
        if (row.student_id) {
          const notification = await NotificationModel.createNotification({
            student_id: row.student_id,
            title: `Interview No-Show: ${row.role_applied || 'Application'}`,
            message: `You missed your scheduled interview with ${row.company_name || 'a startup'}. Your application has been automatically rejected.`,
            type: "interview",
            link: "/student/job-requests",
          });

          if (io && notification) {
            io.to(`${row.student_id}_student`).emit("new_notification", {
              notification,
              unreadCount: await NotificationModel.getUnreadCount(row.student_id),
            });
          }
        }
        console.log(`[NoShowChecker] Rejected application ${row.application_id} (interview ${row.interview_id}) - no-show`);
      } catch (err: any) {
        console.error(`[NoShowChecker] Notification error for interview ${row.interview_id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[NoShowChecker] Error running no-show check:", err.message);
  }
}
