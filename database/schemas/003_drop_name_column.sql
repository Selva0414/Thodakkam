-- Drop the old 'name' column (now replaced by 'company_name')
ALTER TABLE startups DROP COLUMN IF EXISTS name;

-- Add missing column to otp_codes
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;
