import { query } from "../config/database";

let tablesEnsured = false;

export const ensureAdminAlertTables = async (): Promise<void> => {
  if (tablesEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS admin_login_failures (
      id SERIAL PRIMARY KEY,
      email TEXT,
      ip_address TEXT,
      user_agent TEXT,
      occurred_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_metric_snapshots (
      snapshot_date DATE PRIMARY KEY,
      active_startups INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  tablesEnsured = true;
};

export const recordAdminLoginFailure = async (payload: {
  email?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  await ensureAdminAlertTables();

  await query(
    `INSERT INTO admin_login_failures (email, ip_address, user_agent) VALUES ($1, $2, $3)`,
    [
      String(payload.email || "").trim().toLowerCase() || null,
      payload.ipAddress || null,
      payload.userAgent || null,
    ]
  );
};

export const upsertActiveStartupSnapshot = async (activeStartups: number): Promise<void> => {
  await ensureAdminAlertTables();

  await query(
    `
      INSERT INTO admin_metric_snapshots (snapshot_date, active_startups, created_at, updated_at)
      VALUES (CURRENT_DATE, $1, NOW(), NOW())
      ON CONFLICT (snapshot_date)
      DO UPDATE SET active_startups = EXCLUDED.active_startups, updated_at = NOW()
    `,
    [Number(activeStartups || 0)]
  );
};
