-- Add message action fields for unsend and delete functionality
-- This allows proper message management like LinkedIn

-- Add isDeleted field for unsend functionality
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add deletedFor field for individual user deletion
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS deleted_for INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- Index for better performance on deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for ON messages USING GIN(deleted_for);

-- Add original_message field to store original content before unsending
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS original_message TEXT;

-- Comment for clarity
COMMENT ON COLUMN messages.is_deleted IS 'True when message is unsent by sender for everyone';
COMMENT ON COLUMN messages.deleted_for IS 'Array of user IDs who have deleted this message for themselves';
COMMENT ON COLUMN messages.original_message IS 'Store original message content when unsent';