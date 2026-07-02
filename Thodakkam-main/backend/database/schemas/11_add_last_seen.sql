-- Add last_seen field to all user tables for tracking user activity
-- This enables "last seen" status display and online/offline detection

-- Add to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Add to startups table
ALTER TABLE startups
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Add to master_admins table
ALTER TABLE master_admins
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for efficient online status queries
CREATE INDEX IF NOT EXISTS idx_students_last_seen ON students(last_seen);
CREATE INDEX IF NOT EXISTS idx_startups_last_seen ON startups(last_seen);
CREATE INDEX IF NOT EXISTS idx_master_admins_last_seen ON master_admins(last_seen);

-- Update all existing records to have current timestamp
UPDATE students SET last_seen = NOW() WHERE last_seen IS NULL;
UPDATE startups SET last_seen = NOW() WHERE last_seen IS NULL;
UPDATE master_admins SET last_seen = NOW() WHERE last_seen IS NULL;
