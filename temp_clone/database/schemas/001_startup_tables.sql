-- =============================================
-- TABLE: startups
-- =============================================
CREATE TABLE IF NOT EXISTS startups (
  id            SERIAL PRIMARY KEY,
  founder_name  VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255) NOT NULL,
  company_reg_id VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  category      VARCHAR(50) NOT NULL
                CHECK (category IN ('tech','fintech','health','edtech','energy','security')),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: otp_codes
-- =============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  otp_code    VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_used     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

-- =============================================
-- TABLE: jobs
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  startup_id  INTEGER NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  department  VARCHAR(100),
  emp_type    VARCHAR(50) DEFAULT 'Full-time',
  location    VARCHAR(255),
  sal_min     INTEGER,
  sal_max     INTEGER,
  description TEXT,
  remote      BOOLEAN DEFAULT FALSE,
  status      VARCHAR(20) DEFAULT 'active'
              CHECK (status IN ('active','paused','closed','draft')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_startup ON jobs(startup_id);

-- =============================================
-- TABLE: applications
-- =============================================
CREATE TABLE IF NOT EXISTS applications (
  id              SERIAL PRIMARY KEY,
  job_id          INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  startup_id      INTEGER NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  candidate_name  VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255),
  avatar_url      VARCHAR(500),
  role_applied    VARCHAR(255),
  stage           VARCHAR(30) DEFAULT 'applied'
                  CHECK (stage IN ('applied','shortlisted','mcq','coding','interview','selected','rejected')),
  status          VARCHAR(30) DEFAULT 'new'
                  CHECK (status IN ('new','reviewing','shortlisted','interview_scheduled','rejected','hired')),
  match_score     INTEGER DEFAULT 0,
  resume_url      VARCHAR(500),
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_startup ON applications(startup_id);

-- =============================================
-- TABLE: interviews
-- =============================================
CREATE TABLE IF NOT EXISTS interviews (
  id              SERIAL PRIMARY KEY,
  application_id  TEXT NOT NULL,
  startup_id      TEXT NOT NULL,
  job_id          TEXT,
  round_type      VARCHAR(100),
  interview_type  VARCHAR(100) DEFAULT 'Technical Interview (Round 1)',
  interviewer_ids TEXT[],
  interviewers    TEXT[],
  platform        VARCHAR(50) DEFAULT 'google_meet'
                  CHECK (platform IN ('google_meet','offline','office','office_room','zoom','teams')),
  meet_link       TEXT,
  office_location TEXT,
  scheduled_date  DATE NOT NULL,
  time_slot       VARCHAR(50) NOT NULL,
  notes           TEXT,
  status          VARCHAR(20) DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','completed','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_startup ON interviews(startup_id);
