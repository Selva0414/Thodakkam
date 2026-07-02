-- Fix messages table: drop UUID-based table and recreate with integer IDs
-- This matches the students.id (integer) and startups.id (integer) schema

DROP TABLE IF EXISTS messages;

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  sender_type VARCHAR(20) NOT NULL DEFAULT 'student',
  receiver_id INTEGER NOT NULL,
  receiver_type VARCHAR(20) NOT NULL DEFAULT 'student',
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  attachment_data BYTEA,
  attachment_mime_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_for TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  original_message TEXT,
  reply_to_message_id INTEGER,
  delivered_at TIMESTAMP WITH TIME ZONE,
  seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, receiver_type);
