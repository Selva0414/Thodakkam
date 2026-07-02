-- Add missing columns for startup portal auth (safe to re-run)
ALTER TABLE startups ADD COLUMN IF NOT EXISTS company_reg_id VARCHAR(100);
ALTER TABLE startups ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE startups ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
