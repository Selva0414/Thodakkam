/**
 * Chat Migration Script
 * Alters `messages` table and creates `interview_rounds` + `interview_round_progress` tables.
 * Run: node scripts/chat_migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Bypass SSL for Neon
if (process.env.NODE_ENV === 'development' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Alter messages table ──────────────────────────────────────────────
    console.log('📝 Altering messages table...');
    await client.query(`
      DO $$
      BEGIN
        -- Add message_type column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='message_type') THEN
          ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
        END IF;

        -- Add file_url column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='file_url') THEN
          ALTER TABLE messages ADD COLUMN file_url TEXT;
        END IF;

        -- Add file_name column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='file_name') THEN
          ALTER TABLE messages ADD COLUMN file_name VARCHAR(255);
        END IF;

        -- Add file_size column (in bytes)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='file_size') THEN
          ALTER TABLE messages ADD COLUMN file_size BIGINT;
        END IF;

        -- Add attachment blob columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='attachment_data') THEN
          ALTER TABLE messages ADD COLUMN attachment_data BYTEA;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='attachment_mime_type') THEN
          ALTER TABLE messages ADD COLUMN attachment_mime_type TEXT;
        END IF;
      END $$;
    `);
    console.log('   ✅ messages table updated');

    // ── 2. Create interview_rounds table ─────────────────────────────────────
    console.log('📝 Creating interview_rounds table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS interview_rounds (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
        round_type VARCHAR(20) NOT NULL CHECK (round_type IN ('mcq', 'live_coding', 'interview')),
        round_order INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed')),
        meet_link TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(interview_id, round_order)
      );
    `);
    console.log('   ✅ interview_rounds table created');

    // ── 3. Create interview_round_progress table ─────────────────────────────
    console.log('📝 Creating interview_round_progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS interview_round_progress (
        id SERIAL PRIMARY KEY,
        interview_round_id INTEGER NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL,
        candidate_type VARCHAR(20) NOT NULL DEFAULT 'student',
        score NUMERIC(5,2),
        feedback TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ interview_round_progress table created');

    // ── 4. Create index for faster message queries ───────────────────────────
    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
      CREATE INDEX IF NOT EXISTS idx_interview_rounds_interview ON interview_rounds(interview_id);
      CREATE INDEX IF NOT EXISTS idx_round_progress_round ON interview_round_progress(interview_round_id);
    `);
    console.log('   ✅ Indexes created');

    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
