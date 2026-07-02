-- Add status column to startups table if it doesn't exist
ALTER TABLE startups ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'
  CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'));

-- Add index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);