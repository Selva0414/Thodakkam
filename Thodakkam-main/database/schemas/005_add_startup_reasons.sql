-- Add reject_reason and suspend_reason columns to startups table
ALTER TABLE startups ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS suspend_reason TEXT;
