-- Add professional chat delivery status and online presence fields

-- Message delivery lifecycle: sent -> delivered -> seen
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- Backfill status for existing rows
UPDATE messages
SET status = CASE WHEN is_read = TRUE THEN 'seen' ELSE 'sent' END
WHERE status IS NULL;

-- Presence fields used by Socket.IO connect/disconnect updates
ALTER TABLE students
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

ALTER TABLE startups
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Ensure performant conversation retrieval and status updates
CREATE INDEX IF NOT EXISTS idx_messages_conversation_status_created
ON messages(conversation_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_status
ON messages(receiver_id, receiver_type, status);

CREATE INDEX IF NOT EXISTS idx_students_online_last_seen
ON students(is_online, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_startups_online_last_seen
ON startups(is_online, last_seen DESC);
