import { query } from "../config/database";

const AdminAnnouncementModel = {
  async createTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS admin_announcements (
        id SERIAL PRIMARY KEY,
        admin_id TEXT NOT NULL,
        admin_name TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        target_audience TEXT NOT NULL DEFAULT 'all',
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'sent',
        recipient_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_announcements_created ON admin_announcements(created_at DESC)`);
  },

  async create({
    admin_id,
    admin_name,
    title,
    message,
    target_audience = "all",
    priority = "normal",
    recipient_count = 0,
  }: {
    admin_id: string;
    admin_name?: string;
    title: string;
    message: string;
    target_audience?: string;
    priority?: string;
    recipient_count?: number;
  }) {
    const result = await query(
      `INSERT INTO admin_announcements (admin_id, admin_name, title, message, target_audience, priority, recipient_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [admin_id, admin_name || null, title, message, target_audience, priority, recipient_count]
    );
    return result[0];
  },

  async list({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const offset = (page - 1) * limit;
    const [{ count }] = await query(`SELECT count(*)::int FROM admin_announcements`);
    const rows = await query(
      `SELECT id, admin_name, title, message, target_audience, priority, status, recipient_count,
              to_char(created_at, 'YYYY-MM-DD HH24:MI') as created_at
       FROM admin_announcements ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return {
      announcements: rows,
      pagination: {
        current_page: page,
        page_size: limit,
        total_count: count,
        total_pages: Math.ceil(count / limit),
      },
    };
  },

  async delete(id: number) {
    const result = await query(`DELETE FROM admin_announcements WHERE id = $1 RETURNING id`, [id]);
    return result[0];
  },
};

export default AdminAnnouncementModel;
