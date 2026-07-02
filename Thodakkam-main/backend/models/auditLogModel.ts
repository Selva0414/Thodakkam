import { query } from "../config/database";

const AuditLogModel = {
  async createTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id TEXT NOT NULL,
        admin_name TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        entity_name TEXT,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC)`);
  },

  async log({
    admin_id,
    admin_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    details = {},
    ip_address,
  }: {
    admin_id: string;
    admin_name?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    details?: Record<string, any>;
    ip_address?: string;
  }) {
    const result = await query(
      `INSERT INTO admin_audit_logs (admin_id, admin_name, action, entity_type, entity_id, entity_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [admin_id, admin_name || null, action, entity_type, entity_id || null, entity_name || null, JSON.stringify(details), ip_address || null]
    );
    return result[0];
  },

  async list({
    page = 1,
    limit = 25,
    action,
    entity_type,
    admin_id,
    search,
    from,
    to,
  }: {
    page?: number;
    limit?: number;
    action?: string;
    entity_type?: string;
    admin_id?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const conditions: string[] = [];
    const values: any[] = [];

    if (action) {
      values.push(action);
      conditions.push(`action = $${values.length}`);
    }
    if (entity_type) {
      values.push(entity_type);
      conditions.push(`entity_type = $${values.length}`);
    }
    if (admin_id) {
      values.push(admin_id);
      conditions.push(`admin_id = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(entity_name ILIKE $${values.length} OR admin_name ILIKE $${values.length} OR action ILIKE $${values.length})`);
    }
    if (from) {
      values.push(from);
      conditions.push(`created_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(to);
      conditions.push(`created_at < ($${values.length}::date + interval '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countValues = [...values];
    const [{ count }] = await query(`SELECT count(*)::int FROM admin_audit_logs ${where}`, countValues);

    values.push(limit, offset);
    const rows = await query(
      `SELECT id, admin_id, admin_name, action, entity_type, entity_id, entity_name, details, ip_address,
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
       FROM admin_audit_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return {
      logs: rows,
      pagination: {
        current_page: page,
        page_size: limit,
        total_count: count,
        total_pages: Math.ceil(count / limit),
      },
    };
  },

  async getStats() {
    const [todayActions] = await query(
      `SELECT count(*)::int as count FROM admin_audit_logs WHERE created_at >= CURRENT_DATE`
    );
    const [weekActions] = await query(
      `SELECT count(*)::int as count FROM admin_audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const actionBreakdown = await query(
      `SELECT action, count(*)::int as count FROM admin_audit_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY action ORDER BY count DESC LIMIT 10`
    );
    const entityBreakdown = await query(
      `SELECT entity_type, count(*)::int as count FROM admin_audit_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY entity_type ORDER BY count DESC`
    );
    const recentAdmins = await query(
      `SELECT admin_name, admin_id, count(*)::int as actions,
              MAX(to_char(created_at, 'YYYY-MM-DD HH24:MI')) as last_action
       FROM admin_audit_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY admin_name, admin_id ORDER BY actions DESC LIMIT 5`
    );
    const hourlyActivity = await query(
      `SELECT EXTRACT(HOUR FROM created_at)::int as hour, count(*)::int as count
       FROM admin_audit_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY hour ORDER BY hour`
    );

    return {
      today: todayActions?.count || 0,
      thisWeek: weekActions?.count || 0,
      actionBreakdown,
      entityBreakdown,
      recentAdmins,
      hourlyActivity,
    };
  },

  async exportLogs({ from, to, action, entity_type }: { from?: string; to?: string; action?: string; entity_type?: string }) {
    const conditions: string[] = [];
    const values: any[] = [];

    if (action) {
      values.push(action);
      conditions.push(`action = $${values.length}`);
    }
    if (entity_type) {
      values.push(entity_type);
      conditions.push(`entity_type = $${values.length}`);
    }
    if (from) {
      values.push(from);
      conditions.push(`created_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(to);
      conditions.push(`created_at < ($${values.length}::date + interval '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return await query(
      `SELECT admin_name, action, entity_type, entity_name, details, ip_address,
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
       FROM admin_audit_logs ${where}
       ORDER BY created_at DESC`,
      values
    );
  },
};

export default AuditLogModel;
