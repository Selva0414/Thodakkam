-- Master Admin Backend Schema for Neon PostgreSQL
-- Run this migration to create all required tables

-- ═══════════════════════════════════════════════════
-- Master Admins
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS master_admins (
  id SERIAL PRIMARY KEY,
  admin_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Super Admin',
  bio TEXT DEFAULT '',
  timezone VARCHAR(50) DEFAULT 'UTC+5:30',
  avatar_url TEXT DEFAULT '',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  theme VARCHAR(10) DEFAULT 'light',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- OTP Verification Codes
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

-- ═══════════════════════════════════════════════════
-- Startups
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS startups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  founder_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'Tech',
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);

-- ═══════════════════════════════════════════════════
-- Students
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(50) NOT NULL,
  assigned_startup VARCHAR(200) DEFAULT 'Unassigned',
  role VARCHAR(50) DEFAULT '',
  status VARCHAR(20) DEFAULT 'Active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- ═══════════════════════════════════════════════════
-- Seed Data — Startups
-- ═══════════════════════════════════════════════════
INSERT INTO startups (name, founder_name, category, status, created_at) VALUES
  ('EcoStride', 'Sarah Chen', 'Health', 'PENDING', NOW() - INTERVAL '2 days'),
  ('NeuroChip AI', 'David Miller', 'Tech', 'ACTIVE', NOW() - INTERVAL '5 days'),
  ('FinFlow', 'John Smith', 'Fintech', 'PENDING', NOW() - INTERVAL '1 day'),
  ('SkyVault', 'Elena Rodriguez', 'Tech', 'ACTIVE', NOW() - INTERVAL '10 days'),
  ('EchoD', 'Marcus Lee', 'EdTech', 'NEW', NOW() - INTERVAL '3 days'),
  ('GreenWave', 'Priya Sharma', 'Health', 'ACTIVE', NOW() - INTERVAL '15 days'),
  ('CodeNest', 'Alex Turner', 'Tech', 'REJECTED', NOW() - INTERVAL '20 days'),
  ('MedSync', 'Lisa Wang', 'Health', 'ACTIVE', NOW() - INTERVAL '12 days'),
  ('PayBridge', 'Raj Patel', 'Fintech', 'PENDING', NOW() - INTERVAL '7 days'),
  ('LearnPulse', 'Tom Anderson', 'EdTech', 'ACTIVE', NOW() - INTERVAL '25 days')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════
-- Seed Data — Students
-- ═══════════════════════════════════════════════════
INSERT INTO students (name, roll_number, department, assigned_startup, role, status) VALUES
  ('Suryaa M', '23CS150', 'CSE', 'EchoD', 'Developer', 'Active'),
  ('Shabari E S', '23CS136', 'CSE', 'FinFlow', 'Designer', 'Pending'),
  ('Gowtham A', '23EC211', 'ECE', 'Unassigned', 'Marketing', 'Inactive'),
  ('Susindran P', '23CS455', 'CSE', 'SkyVault', 'Developer', 'Active'),
  ('Arun K', '23IT102', 'IT', 'NeuroChip AI', 'Developer', 'Active'),
  ('Divya R', '23CS301', 'CSE', 'GreenWave', 'Designer', 'Active'),
  ('Karthik S', '23EC105', 'ECE', 'Unassigned', '', 'Pending'),
  ('Meena P', '23IT204', 'IT', 'MedSync', 'Marketing', 'Active'),
  ('Ravi V', '23CS220', 'CSE', 'PayBridge', 'Developer', 'Active'),
  ('Sneha L', '23EC310', 'ECE', 'LearnPulse', 'Designer', 'Active')
ON CONFLICT DO NOTHING;
