-- Migration: Add startup_id to notifications and support startup notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS startup_id INTEGER;

-- Allow either student_id or startup_id (or both null for system/global notifications)
-- (Optional: add a CHECK constraint if you want at least one to be non-null)

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_notifications_startup_id ON notifications(startup_id);

-- Example: update existing rows to set startup_id to NULL if not present
UPDATE notifications SET startup_id = NULL WHERE startup_id IS NULL;
