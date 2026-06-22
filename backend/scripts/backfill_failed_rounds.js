/**
 * Retro-apply the MCQ/Coding pass/fail rules to existing candidate_assessments.
 *
 * Rules:
 *   - DEFAULT threshold from env DEFAULT_PASSING_SCORE (fallback 60).
 *   - If a round has `passingScore` in assessments.rounds JSON, that wins.
 *   - Candidates whose MCQ % or coding score is below the threshold are marked
 *     rejected + their application stage flipped to rejected with rejected_at_stage.
 *
 * Usage (from backend/):
 *   node scripts/backfill_failed_rounds.js            # dry-run
 *   node scripts/backfill_failed_rounds.js --apply    # actually update
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const DEFAULT_THRESHOLD = (() => {
  const v = Number(process.env.DEFAULT_PASSING_SCORE);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 60;
})();

const APPLY = process.argv.includes('--apply');

const raw = process.env.DATABASE_URL || '';
const connectionString = raw
  .replace(/[?&]channel_binding=[^&]*/g, '')
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/\?$/, '');

const pool = new Pool({
  connectionString,
  ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString) ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

function resolveThreshold(round) {
  const raw = Number(round?.passingScore ?? round?.passing_score);
  if (!Number.isFinite(raw)) return DEFAULT_THRESHOLD;
  return Math.min(100, Math.max(0, raw));
}

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.id, ca.application_id, ca.assessment_id, ca.status,
             ca.mcq_score, ca.mcq_total, ca.mcq_completed_at,
             ca.coding_score, ca.coding_completed_at,
             ca.overall_result, a.rounds
      FROM candidate_assessments ca
      JOIN assessments a ON a.id::text = ca.assessment_id::text
      WHERE ca.status <> 'rejected'
    `);

    console.log(`Scanning ${rows.length} candidate_assessments (threshold default=${DEFAULT_THRESHOLD}%)...`);
    let toFail = [];

    for (const r of rows) {
      const rounds = typeof r.rounds === 'string' ? JSON.parse(r.rounds) : (r.rounds || []);
      const mcqRound = rounds.find(x => String(x.type).toLowerCase() === 'mcq');
      const codingRound = rounds.find(x => String(x.type).toLowerCase() === 'coding');

      if (r.mcq_completed_at && r.mcq_total > 0) {
        const pct = (r.mcq_score / r.mcq_total) * 100;
        const t = resolveThreshold(mcqRound);
        if (pct < t) {
          toFail.push({ ca: r, stage: 'mcq', achieved: pct.toFixed(1), threshold: t });
          continue;
        }
      }
      if (r.coding_completed_at) {
        const pct = Number(r.coding_score) || 0;
        const t = resolveThreshold(codingRound);
        if (pct < t) {
          toFail.push({ ca: r, stage: 'coding', achieved: pct.toFixed(1), threshold: t });
        }
      }
    }

    console.log(`Found ${toFail.length} stuck failures:`);
    for (const f of toFail) {
      console.log(`  ca=${f.ca.id} app=${f.ca.application_id} stage=${f.stage} ${f.achieved}% < ${f.threshold}%`);
    }

    if (!APPLY) {
      console.log('\nDry-run. Re-run with --apply to persist changes.');
      return;
    }

    for (const f of toFail) {
      const overallResult = `${f.stage}_failed`;
      await pool.query(
        `UPDATE candidate_assessments SET status = 'rejected', overall_result = $1, completed_at = NOW() WHERE id = $2`,
        [overallResult, f.ca.id]
      );
      if (f.ca.application_id) {
        await pool.query(
          `UPDATE applications SET status = 'rejected', stage = 'rejected', rejected_at_stage = $1, updated_at = NOW() WHERE id::text = $2::text`,
          [f.stage, String(f.ca.application_id)]
        );
      }
    }
    console.log(`Applied. Updated ${toFail.length} records.`);
  } catch (err) {
    console.error('Backfill error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
