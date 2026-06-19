-- Update Startup Table
ALTER TABLE "Startup" ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Startup" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- Update Post Table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "authorType" TEXT NOT NULL DEFAULT 'student';
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "likesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- Create McqQuestion Table
CREATE TABLE IF NOT EXISTS "McqQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOptionIndex" INTEGER NOT NULL,
    "category" TEXT,
    "difficulty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);

-- Create McqResult Table
CREATE TABLE IF NOT EXISTS "McqResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "category" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqResult_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for McqResult
-- Note: Check if the constraint already exists before running this line if running multiple times.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'McqResult_studentId_fkey') THEN
        ALTER TABLE "McqResult" ADD CONSTRAINT "McqResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
