import { query } from "../config/database";

const NotificationModel = {
  async createTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        link TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Ensure startup_id column exists as TEXT (supports UUID startup IDs)
    // Drop and re-add if it exists as INTEGER (wrong type)
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'startup_id'
            AND data_type = 'integer'
        ) THEN
          ALTER TABLE notifications DROP COLUMN startup_id;
        END IF;
      END$$
    `);
    await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS startup_id TEXT`);
  },

  async createNotification({ student_id, title, message, type = "general", link = null }: any) {
    const result = await query(
      `INSERT INTO notifications (student_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, title, message, type, link]
    );
    return result[0];
  },

  async getStudentNotifications(student_id: number | string) {
    return await query(
      `SELECT * FROM notifications
       WHERE student_id::text = $1::text
       ORDER BY is_read ASC, created_at DESC
       LIMIT 30`,
      [student_id]
    );
  },

  async markAsRead(notification_id: number | string) {
    const result = await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [notification_id]
    );
    return result[0];
  },

  async markAllAsRead(student_id: number | string) {
    await query(`UPDATE notifications SET is_read = TRUE WHERE student_id::text = $1::text`, [student_id]);
  },

  async getUnreadCount(student_id: number | string) {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE student_id::text = $1::text AND is_read = FALSE`,
      [student_id]
    );
    return result[0]?.count || 0;
  },

  // ── Startup notification methods ──────────────────────────────────────────

  async createStartupNotification({ startup_id, title, message, type = "general", link = null }: any) {
    const result = await query(
      `INSERT INTO notifications (student_id, startup_id, title, message, type, link)
       VALUES ('0', $1, $2, $3, $4, $5) RETURNING *`,
      [startup_id, title, message, type, link]
    );
    return result[0];
  },

  async getStartupNotifications(startup_id: number | string) {
    return await query(
      `SELECT * FROM notifications
       WHERE startup_id::text = $1::text
       ORDER BY is_read ASC, created_at DESC
       LIMIT 30`,
      [String(startup_id)]
    );
  },

  async markStartupAsRead(notification_id: number | string) {
    const result = await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [notification_id]
    );
    return result[0];
  },

  async markAllStartupAsRead(startup_id: number | string) {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE startup_id::text = $1::text`,
      [String(startup_id)]
    );
  },

  async getStartupUnreadCount(startup_id: number | string) {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE startup_id::text = $1::text AND is_read = FALSE`,
      [String(startup_id)]
    );
    return result[0]?.count || 0;
  },

  async deleteNotification(id: number | string) {
    const result = await query(
      `DELETE FROM notifications WHERE id = $1 RETURNING id`,
      [id]
    );
    return result[0];
  },
};

export default NotificationModel;
