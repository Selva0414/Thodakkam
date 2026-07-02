-- Widen resume_url column to TEXT so base64-encoded PDF files can be stored
ALTER TABLE applications ALTER COLUMN resume_url TYPE TEXT;
