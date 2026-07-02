import { pool } from '../config/database';

const TRIAL_DAYS = 7;
const LOCK_CHECK_INTERVAL_MS = 60 * 60 * 1000; // every 1 hour

async function runLockCheck() {
  let client: any = null;
  try {
    // Acquire client — this itself can throw ECONNRESET on flaky DB connections
    client = await pool.connect();

    // 1. Lock startups whose 7-day trial has expired (use created_at as fallback if trial_started_at not set)
    const trialResult = await client.query(
      `UPDATE startups
       SET is_locked = true, locked_at = NOW()
       WHERE is_locked = false
         AND plan_type = 'trial'
         AND COALESCE(trial_started_at, created_at) + INTERVAL '${TRIAL_DAYS} days' <= NOW()
       RETURNING id, company_name`
    );
    if (trialResult.rowCount && trialResult.rowCount > 0) {
      console.log(`[TrialLockChecker] Locked ${trialResult.rowCount} startup(s) — trial expired:`,
        trialResult.rows.map((r: any) => r.company_name).join(', '));
    }

    // 2. Lock startups whose paid plan has expired (Day 11+)
    const paidResult = await client.query(
      `UPDATE startups
       SET is_locked = true, locked_at = NOW(), plan_type = 'trial', plan_expires_at = NULL, status = 'LOCKED'
       WHERE is_locked = false
         AND plan_type = 'paid'
         AND plan_expires_at IS NOT NULL
         AND plan_expires_at <= NOW()
       RETURNING id, company_name`
    );
    if (paidResult.rowCount && paidResult.rowCount > 0) {
      console.log(`[TrialLockChecker] Locked ${paidResult.rowCount} startup(s) — paid plan expired:`,
        paidResult.rows.map((r: any) => r.company_name).join(', '));
    }
  } catch (err: any) {
    // Log but NEVER crash the server — ECONNRESET and similar DB flakiness is expected
    console.error('[TrialLockChecker] Error during lock check (will retry on next interval):', err.message);
  } finally {
    // Always release the client back to the pool if we got one
    if (client) {
      try { client.release(); } catch { /* ignore release errors */ }
    }
  }
}

export function startTrialLockChecker() {
  // Delay first run by 5 seconds to let the server fully start
  setTimeout(() => {
    runLockCheck().catch(() => { /* already handled inside */ });
  }, 5000);

  setInterval(() => {
    runLockCheck().catch(() => { /* already handled inside */ });
  }, LOCK_CHECK_INTERVAL_MS);

  console.log('   ⏰ Trial lock checker: running every hour');
}

