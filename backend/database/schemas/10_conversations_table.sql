-- Create conversations table for efficient conversation queries and metadata storage
-- This replaces the message-based conversation derivation for better performance

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,

  -- Participants (ordered to prevent duplicates)
  user1_id INTEGER NOT NULL,
  user1_type VARCHAR(20) NOT NULL CHECK (user1_type IN ('student', 'startup', 'admin')),
  user2_id INTEGER NOT NULL,
  user2_type VARCHAR(20) NOT NULL CHECK (user2_type IN ('student', 'startup', 'admin')),

  -- Last message metadata for quick preview
  last_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  last_message_preview TEXT,
  last_message_time TIMESTAMPTZ,

  -- Unread counts for each participant
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique conversations and ordered participants
  CONSTRAINT unique_conversation UNIQUE(user1_id, user1_type, user2_id, user2_type),
  CONSTRAINT ordered_participants CHECK (
    (user1_id < user2_id) OR
    (user1_id = user2_id AND user1_type < user2_type)
  )
);

-- Indexes for fast conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id, user1_type);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id, user2_type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON conversations;
CREATE TRIGGER trigger_update_conversation_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
