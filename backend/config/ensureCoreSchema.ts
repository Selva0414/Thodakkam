import { query } from "./database";
import bcrypt from "bcryptjs";

/**
 * Ensures core tables exist on a fresh PostgreSQL/Neon database.
 * Matches backend/create_schema.js — run that script for the full schema if you need every table.
 */
const CORE_TABLES_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS students (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name             TEXT,
      username         CHARACTER VARYING,
      email            CHARACTER VARYING UNIQUE,
      password         TEXT,
      phone            CHARACTER VARYING,
      location         CHARACTER VARYING,
      profile_photo    TEXT,
      resume_file      TEXT,
      bio              TEXT,
      skills           JSONB DEFAULT '[]',
      educations       JSONB DEFAULT '[]',
      internships      JSONB DEFAULT '[]',
      website_url      TEXT,
      github_url       TEXT,
      linkedin_url       TEXT,
      resume_insights  JSONB,
      experience       JSONB DEFAULT '[]',
      education        JSONB DEFAULT '[]',
      social           JSONB DEFAULT '{}',
      profile_views    INTEGER DEFAULT 0,
      post_impressions INTEGER DEFAULT 0,
      is_online        BOOLEAN DEFAULT FALSE,
      last_seen        TIMESTAMP WITH TIME ZONE,
      user_id          TEXT,
      roll             TEXT,
      dept             TEXT,
      startup          TEXT,
      role             TEXT,
      status           TEXT DEFAULT 'active',
      join_date        TEXT,
      referral_points  INTEGER DEFAULT 0,
      referred_by      TEXT,
      created_at       TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS startups (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      founder_name     CHARACTER VARYING,
      company_name     CHARACTER VARYING,
      company_reg_id   CHARACTER VARYING,
      email            CHARACTER VARYING UNIQUE,
      password_hash    CHARACTER VARYING,
      name             TEXT,
      category         TEXT,
      status           TEXT DEFAULT 'PENDING',
      reject_reason    TEXT,
      suspend_reason   TEXT,
      growth           TEXT,
      date_joined      TEXT,
      description      TEXT,
      logo_url         TEXT,
      initials         TEXT,
      founder          TEXT,
      avatar           TEXT,
      color            TEXT,
      company_website  TEXT,
      company_description TEXT,
      linkedin_url     TEXT,
      twitter_url      TEXT,
      is_verified      BOOLEAN DEFAULT FALSE,
      is_online        BOOLEAN DEFAULT FALSE,
      profile_views    INTEGER DEFAULT 0,
      post_impressions INTEGER DEFAULT 0,
      last_seen        TIMESTAMP WITHOUT TIME ZONE,
      created_at       TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at         TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      rules_accepted     BOOLEAN DEFAULT FALSE,
      trial_started_at   TIMESTAMP WITHOUT TIME ZONE,
      is_locked          BOOLEAN DEFAULT FALSE,
      locked_at          TIMESTAMP WITHOUT TIME ZONE,
      plan_type          TEXT DEFAULT 'trial',
      plan_expires_at    TIMESTAMP WITHOUT TIME ZONE
    )`,
  `CREATE TABLE IF NOT EXISTS subscription_payments (
      id                  SERIAL PRIMARY KEY,
      startup_id          TEXT REFERENCES startups(id) ON DELETE CASCADE,
      razorpay_order_id   TEXT,
      razorpay_payment_id TEXT,
      amount_paise        INTEGER,
      student_count       INTEGER DEFAULT 0,
      domain_info         TEXT,
      access_days         INTEGER DEFAULT 10,
      status              TEXT DEFAULT 'pending',
      created_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS jobs (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      startup_id  CHARACTER VARYING REFERENCES startups(id) ON DELETE CASCADE,
      startup_name TEXT,
      title       TEXT,
      type        TEXT,
      emp_type    TEXT,
      location    TEXT,
      salary      TEXT,
      sal_min     TEXT,
      sal_max     TEXT,
      description TEXT,
      requirements TEXT,
      experience  TEXT,
      domain      TEXT,
      status      TEXT DEFAULT 'active',
      created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS applications (
      id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      job_id         TEXT,
      student_id     TEXT REFERENCES students(id) ON DELETE CASCADE,
      startup_id     TEXT,
      role_applied   TEXT,
      candidate_name TEXT,
      student_name   TEXT,
      candidate_email TEXT,
      email          TEXT,
      candidate_phone TEXT,
      phone          TEXT,
      resume_url     TEXT,
      screening_answers JSONB,
      status         TEXT DEFAULT 'new',
      interview_date TEXT,
      interview_time TEXT,
      interview_link TEXT,
      round1_score   INTEGER,
      round2_score   INTEGER,
      applied_at     TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )`,

    /* Messaging + community (models run ALTER TABLE on these — tables must exist first) */
    `CREATE TABLE IF NOT EXISTS conversations (
      id                    SERIAL PRIMARY KEY,
      user1_id              INTEGER,
      user2_id              INTEGER,
      user1_type            CHARACTER VARYING,
      user2_type            CHARACTER VARYING,
      last_message          TEXT,
      last_message_preview  TEXT,
      last_message_id       INTEGER,
      last_message_time     TIMESTAMP WITH TIME ZONE,
      unread_count_user1    INTEGER DEFAULT 0,
      unread_count_user2    INTEGER DEFAULT 0,
      unread               INTEGER DEFAULT 0,
      online               BOOLEAN DEFAULT FALSE,
      name                 TEXT,
      startup_name         TEXT,
      avatar               TEXT,
      role                 TEXT,
      created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id                    SERIAL PRIMARY KEY,
      conversation_id       INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id             INTEGER,
      receiver_id           INTEGER,
      sender_type           CHARACTER VARYING,
      receiver_type         CHARACTER VARYING,
      sender               TEXT,
      message              TEXT,
      text                 TEXT,
      message_type         CHARACTER VARYING DEFAULT 'text',
      status               CHARACTER VARYING DEFAULT 'sent',
      file_url             TEXT,
      file_name            TEXT,
      file_size            BIGINT,
      attachment_data      BYTEA,
      attachment_mime_type TEXT,
      is_read              BOOLEAN DEFAULT FALSE,
      is_deleted           BOOLEAN DEFAULT FALSE,
      deleted_at           TIMESTAMP WITH TIME ZONE,
      deleted_for          TEXT[],
      deleted_by_sender    BOOLEAN DEFAULT FALSE,
      deleted_by_receiver  BOOLEAN DEFAULT FALSE,
      is_edited            BOOLEAN DEFAULT FALSE,
      edited_at            TIMESTAMP WITH TIME ZONE,
      original_message     TEXT,
      reply_to_message_id  INTEGER,
      delivered_at         TIMESTAMP WITH TIME ZONE,
      seen_at              TIMESTAMP WITH TIME ZONE,
      created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id           SERIAL PRIMARY KEY,
      author_id    TEXT,
      author_type  TEXT,
      author_name  TEXT,
      author_avatar TEXT,
      content      TEXT,
      image_url    TEXT,
      likes        INTEGER DEFAULT 0,
      liked_by     TEXT[] DEFAULT '{}',
      is_deleted   BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id          SERIAL PRIMARY KEY,
      post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      author_id   TEXT,
      author_type TEXT,
      author_name TEXT,
      author_avatar TEXT,
      content     TEXT,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS interviews (
      id              SERIAL PRIMARY KEY,
      application_id  TEXT NOT NULL,
      startup_id      TEXT NOT NULL,
      job_id          TEXT,
      round_type      VARCHAR(100),
      interview_type  VARCHAR(100) DEFAULT 'Technical Interview (Round 1)',
      interviewer_ids TEXT[],
      interviewers    TEXT[],
      platform        VARCHAR(50) DEFAULT 'google_meet',
      meet_link       TEXT,
      office_location TEXT,
      scheduled_date  DATE,
      time_slot       VARCHAR(50),
      notes           TEXT,
      status          VARCHAR(20) DEFAULT 'scheduled',
      scheduled_at    TIMESTAMPTZ,
      candidate_joined_at TIMESTAMPTZ,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS master_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT false,
      role VARCHAR(50) DEFAULT 'admin',
      avatar_url VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS startup_profiles (
      startup_id TEXT PRIMARY KEY,
      avatar_url TEXT,
      timezone VARCHAR(120) DEFAULT '(GMT+05:30) India Standard Time',
      bio VARCHAR(320) DEFAULT '',
      theme VARCHAR(12) DEFAULT 'dark',
      notify_new_registrations BOOLEAN DEFAULT true,
      notify_weekly_reports BOOLEAN DEFAULT false,
      notify_investor_activity BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
];

/** Align older/partial DBs with what admin controllers expect (CREATE TABLE IF NOT EXISTS does not add new columns). */
const SCHEMA_PATCHES: string[] = [
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS reject_reason TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS suspend_reason TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING'`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS category TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS founder_name CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS company_name CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS email CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS password_hash CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS linkedin_url TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS twitter_url TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS company_website TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS company_description TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS logo_url TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS name TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS email CHARACTER VARYING`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS roll TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS dept TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS startup TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS join_date TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS department TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_startup TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITHOUT TIME ZONE`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_id TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_name TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_name TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_email TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS screening_answers JSONB`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS reschedule_reason TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS reschedule_screenshot TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMP`,
  `ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS round1_score INTEGER`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS round2_score INTEGER`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_time TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_link TEXT`,
  `ALTER TABLE applications ALTER COLUMN resume_url TYPE TEXT`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_data BYTEA`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS startup_name TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS domain TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS screening_questions TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS round_type TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_type TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewer_ids TEXT[]`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewers TEXT[]`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'google_meet'`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meet_link TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS office_location TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_date DATE`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS time_slot TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_joined_at TIMESTAMPTZ`,
  `DO $$ BEGIN ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_status_check; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
  `ALTER TABLE interviews ADD CONSTRAINT interviews_status_check CHECK (status IN ('scheduled','completed','cancelled','rejected_by_student','in_progress','accepted','rejected'))`,
  `DELETE FROM candidate_assessments WHERE id NOT IN (SELECT DISTINCT ON (assessment_id, student_id) id FROM candidate_assessments ORDER BY assessment_id, student_id, created_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_assessment ON candidate_assessments (assessment_id, student_id) WHERE student_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_interviews_startup ON interviews(startup_id)`,
  `CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id)`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE interviews ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS rules_accepted BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITHOUT TIME ZONE`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITHOUT TIME ZONE`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial'`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITHOUT TIME ZONE`,
  /* Student profile columns that may be missing from older schemas */
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS website_url TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS github_url TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_insights JSONB`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS post_impressions INTEGER DEFAULT 0`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS username CHARACTER VARYING`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone CHARACTER VARYING`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS location CHARACTER VARYING`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_photo TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_file TEXT`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS educations JSONB DEFAULT '[]'`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS internships JSONB DEFAULT '[]'`,
  /* Startup identity fields that may be missing */
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS industry TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS company_size TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS founded_year TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS location TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS work_mode TEXT`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS post_impressions INTEGER DEFAULT 0`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS msme_id CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS iso_id CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS reg_type CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS certificate_id CHARACTER VARYING`,
  `ALTER TABLE startups ADD COLUMN IF NOT EXISTS certificate_url TEXT`,
  /* Posts / Community columns that may be missing from older schemas */
  `ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey`,
  `ALTER TABLE posts ALTER COLUMN author_id TYPE TEXT USING author_id::text`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_role TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'student'`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_name TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_of INTEGER`,
  `ALTER TABLE post_likes ALTER COLUMN user_id TYPE TEXT USING user_id::text`,
  `ALTER TABLE post_comments ALTER COLUMN author_id TYPE TEXT USING author_id::text`,
  `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_name TEXT`,
  `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT`,
  `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'student'`,
  /* Community dependent tables */
  `CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_name TEXT,
    author_avatar TEXT,
    author_type TEXT DEFAULT 'student',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS post_shares (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS community_follows (
    id SERIAL PRIMARY KEY,
    follower_id TEXT NOT NULL,
    follower_type VARCHAR(20) NOT NULL,
    followed_id TEXT NOT NULL,
    followed_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (follower_id, follower_type, followed_id, followed_type)
  )`,
  `CREATE TABLE IF NOT EXISTS post_saves (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, user_type)
  )`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS last_active_date VARCHAR(10)`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS referred_by TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS field VARCHAR(20) DEFAULT 'IT'`,
  `ALTER TABLE assessments ADD COLUMN IF NOT EXISTS field VARCHAR(20) DEFAULT 'IT'`,
  `ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS task_file TEXT`,
  `ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS task_completed_at TIMESTAMP`
];

export async function ensureCoreSchema(): Promise<void> {
  // Wrap each table creation in try/catch so one failure (e.g. FK type mismatch)
  // does not abort the entire initialization — patches and seeding still run.
  for (const sql of CORE_TABLES_SQL) {
    try {
      await query(sql);
    } catch (e: any) {
      console.warn(`⚠️  Core table setup issue (skipping): ${e.message}`);
    }
  }
  for (const sql of SCHEMA_PATCHES) {
    try {
      await query(sql);
    } catch {
      /* Column may already exist or table not present — safe to ignore */
    }
  }
}

export async function ensureMasterAdmin(): Promise<void> {
  const adminName = process.env.MASTER_ADMIN_NAME || 'Master Admin';
  const email = process.env.MASTER_ADMIN_EMAIL || 'admin@startup.local';
  const password = process.env.MASTER_ADMIN_PASSWORD || 'Admin@12345';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await query(
      `INSERT INTO master_admins (admin_name, email, password_hash, is_verified)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email)
       DO UPDATE SET
         admin_name = EXCLUDED.admin_name,
         password_hash = EXCLUDED.password_hash,
         is_verified = true`,
      [adminName, email, passwordHash]
    );

    console.log(`✅ Master admin seeded: ${email} / ${password}`);
  } catch (error: any) {
    console.error('⚠️  Failed to seed master admin:', error.message);
  }
}
