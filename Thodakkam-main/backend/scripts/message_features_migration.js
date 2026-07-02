/**
 * Message Features Migration Script
 * Adds `is_deleted`, `deleted_for`, `original_message`, `is_edited`, `edited_at` to `messages` table.
 * Run: node scripts/message_features_migration.js
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

    console.log('📝 Altering messages table for enhanced features...');
    await client.query(`
      DO $$
      BEGIN
        -- Add is_deleted column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_deleted') THEN
          ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        END IF;

        -- Add deleted_for column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='deleted_for') THEN
          ALTER TABLE messages ADD COLUMN deleted_for INTEGER[] DEFAULT ARRAY[]::INTEGER[];
        END IF;

        -- Add original_message column (to keep track before unsending/editing)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='original_message') THEN
          ALTER TABLE messages ADD COLUMN original_message TEXT;
        END IF;

        -- Add is_edited column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_edited') THEN
          ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
        END IF;

        -- Add edited_at column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='edited_at') THEN
          ALTER TABLE messages ADD COLUMN edited_at TIMESTAMPTZ;
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
    console.log('   ✅ messages table updated with enhanced columns');

    await client.query('COMMIT');
    console.log('\n🎉 Message features migration completed successfully!\n');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
