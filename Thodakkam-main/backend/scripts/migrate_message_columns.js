require('ts-node/register/transpile-only');
const { query } = require('../config/database.ts');

async function run() {
  try {
    console.log('Applying message table compatibility migration...');

    await query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS message_type VARCHAR(30) DEFAULT 'text',
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS file_size BIGINT,
      ADD COLUMN IF NOT EXISTS attachment_data BYTEA,
      ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT,
      ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER,
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deleted_for INTEGER[] DEFAULT ARRAY[]::INTEGER[],
      ADD COLUMN IF NOT EXISTS original_message TEXT;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_messages_reply_to'
        ) THEN
          ALTER TABLE messages
          ADD CONSTRAINT fk_messages_reply_to
          FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await query(`
      UPDATE messages
      SET message_type = 'text'
      WHERE message_type IS NULL OR message_type = '';
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);
    `);

    console.log('Message table migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

run();
