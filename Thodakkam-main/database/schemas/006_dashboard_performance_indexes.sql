-- Indexes to speed up startup dashboard queries
-- These queries join applications with jobs and filter by startup_id/status

CREATE INDEX IF NOT EXISTS idx_jobs_startup_id ON jobs(startup_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
