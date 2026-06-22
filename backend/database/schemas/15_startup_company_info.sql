-- Add social media link columns to startups table
-- company_website, company_description, logo_url already exist in schema

ALTER TABLE startups ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS twitter_url TEXT;
