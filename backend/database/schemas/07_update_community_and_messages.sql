-- Migration: Update community and messages for multi-role support

-- 1. Update posts table
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type VARCHAR(20) DEFAULT 'student';

-- Update existing student posts if any
UPDATE posts SET author_type = 'student' WHERE author_type IS NULL;

-- 2. Update messages table
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) DEFAULT 'student';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_type VARCHAR(20) DEFAULT 'student';

-- Update existing student messages
UPDATE messages SET sender_type = 'student', receiver_type = 'student' WHERE sender_type IS NULL;
