import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { computeCanScheduleInterview, getScheduleInterviewBlockReason } from "../utils/assessmentScheduleEligibility";
import { resolveStageFromStatus } from "../utils/applicationStage";
import { debugAgentLog } from "../utils/debugAgentLog";
import NotificationModel from "../models/notificationModel";

const VALID_STATUSES = ["new", "reviewing", "shortlisted", "interview_scheduled", "rejected", "hired"];
const VALID_STAGES = ["applied", "shortlisted", "mcq", "coding", "interview", "selected", "rejected"];

let applicationStageSchemaReady = false;

const ensureApplicationStageSchema = async () => {
  if (applicationStageSchemaReady) return;

  await sql`
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS stage VARCHAR(30)
  `;

  await sql`
    UPDATE applications
    SET stage = CASE
      WHEN LOWER(COALESCE(status, 'new')) IN ('hired', 'selected') THEN 'selected'
      WHEN LOWER(COALESCE(status, 'new')) IN ('rejected', 'declined') THEN 'rejected'
      WHEN LOWER(COALESCE(status, 'new')) IN ('interview_scheduled', 'interviewing') THEN 'interview'
      WHEN LOWER(COALESCE(status, 'new')) = 'shortlisted' THEN 'shortlisted'
      ELSE 'applied'
    END
    WHERE stage IS NULL OR TRIM(stage) = ''
  `;

  await sql`
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS match_score INTEGER
  `;

  await sql`
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  `;

  await sql`
    UPDATE applications
    SET match_score = CASE
      WHEN LOWER(COALESCE(status, 'new')) IN ('hired', 'selected') THEN 92
      WHEN LOWER(COALESCE(status, 'new')) IN ('interview_scheduled', 'interviewing') THEN 82
      WHEN LOWER(COALESCE(status, 'new')) = 'shortlisted' THEN 76
      WHEN LOWER(COALESCE(status, 'new')) IN ('reviewing', 'pending') THEN 62
      WHEN LOWER(COALESCE(status, 'new')) = 'rejected' THEN 35
      ELSE 55
    END
    WHERE match_score IS NULL
  `;

  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejected_at_stage VARCHAR(30)`;
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_letter TEXT`;

  // Backfill startup_name on jobs that were created before the column was populated
  await sql`
    UPDATE jobs j
    SET startup_name = s.company_name
    FROM startups s
    WHERE j.startup_id::text = s.id::text
      AND (j.startup_name IS NULL OR j.startup_name = '')
  `;

  applicationStageSchemaReady = true;
};

const resolveStatusFromStage = (stage: string): string => {
  switch (String(stage || "").toLowerCase()) {
    case "shortlisted":
      return "shortlisted";
    case "interview":
      return "interview_scheduled";
    case "selected":
      return "hired";
    case "rejected":
      return "rejected";
    default:
      return "reviewing";
  }
};

const normalizeScore = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return null;
  if (num >= 0 && num <= 1) return Math.round(num * 100);
  return Math.round(Math.min(100, Math.max(0, num)));
};

const resolveApplicationScore = (application: any): number | null => {
  const directCandidates = [
    application?.match_score,
    application?.matchScore,
    application?.score,
    application?.ats_score,
    application?.atsScore,
    application?.resume_score,
    application?.resumeScore,
    application?.similarity_score,
    application?.similarityScore,
  ];

  for (const candidateScore of directCandidates) {
    const parsed = normalizeScore(candidateScore);
    if (parsed !== null) return parsed;
  }

  const roundScores = [normalizeScore(application?.round1_score), normalizeScore(application?.round2_score)]
    .filter((score): score is number => score !== null);

  if (roundScores.length > 0) {
    return Math.round(roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length);
  }

  const status = String(application?.status || '').toLowerCase();
  if (status === 'hired' || status === 'selected') return 92;
  if (status === 'interview_scheduled' || status === 'interviewing') return 82;
  if (status === 'shortlisted') return 76;
  if (status === 'reviewing' || status === 'pending') return 62;
  if (status === 'rejected') return 35;
  if (status === 'new') return 55;

  return null;
};

export const listApplications = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { status, jobId } = req.query;

  try {
    await ensureApplicationStageSchema();

    // Guard: reject non-numeric jobId (e.g., stale UUIDs from old sessions) to prevent SQL type cast errors
    const jobFilter = jobId && /^\d+$/.test(String(jobId)) ? String(jobId) : null;

    let applications;
    if (status && jobFilter) {
      applications = await sql`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE j.startup_id::text = ${startupId}::text AND a.status = ${status} AND a.job_id = ${jobFilter} ORDER BY a.applied_at DESC`;
    } else if (status) {
      applications = await sql`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE j.startup_id::text = ${startupId}::text AND a.status = ${status} ORDER BY a.applied_at DESC`;
    } else if (jobFilter) {
      applications = await sql`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE j.startup_id::text = ${startupId}::text AND a.job_id = ${jobFilter} ORDER BY a.applied_at DESC`;
    } else {
      applications = await sql`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE j.startup_id::text = ${startupId}::text ORDER BY a.applied_at DESC`;
    }

    const counts = jobFilter
      ? await sql`SELECT a.status, count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text AND a.job_id = ${jobFilter} GROUP BY a.status`
      : await sql`SELECT a.status, count(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = ${startupId}::text GROUP BY a.status`;


    const appIds = (applications as any[]).map((a) => String(a.id));
    let caByApp = new Map<
      string,
      {
        status: string;
        current_round: number;
        mcq_completed_at: unknown;
        coding_completed_at: unknown;
        overall_result: string | null;
        rounds: unknown;
      }
    >();
    if (appIds.length > 0) {
      try {
        const caRows = await query(
          `SELECT DISTINCT ON (ca.application_id)
             ca.application_id,
             ca.status,
             ca.current_round,
             ca.mcq_completed_at,
             ca.coding_completed_at,
             ca.overall_result,
             a.rounds
           FROM candidate_assessments ca
           INNER JOIN assessments a ON a.id = ca.assessment_id
           WHERE ca.application_id::text = ANY($1::text[])
           ORDER BY ca.application_id, ca.id DESC`,
          [appIds]
        );
        caByApp = new Map(
          caRows.map((row: any) => [
            String(row.application_id),
            {
              status: row.status,
              current_round: row.current_round,
              mcq_completed_at: row.mcq_completed_at,
              coding_completed_at: row.coding_completed_at,
              overall_result: row.overall_result,
              rounds: row.rounds,
            },
          ])
        );
      } catch (e: any) {
        console.error("[listApplications] candidate_assessments batch:", e.message);
      }
    }

    // Map column names to frontend expectations
    const mappedApplications = (applications as any[]).map((a: any) => {
      const ca = caByApp.get(String(a.id));
      const canScheduleInterview = computeCanScheduleInterview(ca, ca?.rounds);
      const scheduleInterviewBlockReason = canScheduleInterview ? null : getScheduleInterviewBlockReason(ca, ca?.rounds);

      // Derive stage from assessment progress
      let derivedStage = a.stage || resolveStageFromStatus(String(a.status || "new"));
      if (ca) {
        const rounds = Array.isArray(ca.rounds) ? ca.rounds : [];
        const currentRoundIdx = (ca.current_round ?? 1) - 1;
        const currentRoundType = rounds[currentRoundIdx]
          ? String((rounds[currentRoundIdx] as any).type || '').toLowerCase()
          : null;

        if (ca.overall_result === 'rejected' || ca.status === 'rejected') {
          derivedStage = 'rejected';
        } else if (ca.status === 'completed') {
          const STAGE_ORDER = ['applied', 'shortlisted', 'mcq', 'coding', 'interview', 'selected'];
          const lastRoundType = rounds.length > 0
            ? String((rounds[rounds.length - 1] as any).type || '').toLowerCase()
            : null;
          const afterAssessmentStage = lastRoundType === 'interview' ? 'selected' : 'interview';
          if (STAGE_ORDER.indexOf(derivedStage) < STAGE_ORDER.indexOf(afterAssessmentStage)) {
            derivedStage = afterAssessmentStage;
          }
        } else if (currentRoundType && ['mcq', 'coding', 'interview'].includes(currentRoundType)) {
          const STAGE_ORDER = ['applied', 'shortlisted', 'mcq', 'coding', 'interview', 'selected'];
          if (STAGE_ORDER.indexOf(derivedStage) < STAGE_ORDER.indexOf(currentRoundType)) {
            derivedStage = currentRoundType;
          }
        }
      }

      return {
        ...a,
        stage: derivedStage,
        candidate_name: a.candidate_name || a.student_name,
        candidate_email: a.candidate_email || a.email,
        match_score: resolveApplicationScore(a),
        avatar_url: resolveMediaUrl(req, a.avatar_url),
        github_url: a.github_url || null,
        linkedin_url: a.linkedin_url || null,
        website_url: a.website_url || null,
        student_location: a.student_location || null,
        student_bio: a.student_bio || null,
        student_phone: a.student_phone || null,
        skills: a.skills || null,
        educations: a.educations || null,
        internships: a.internships || null,
        resume_file: resolveMediaUrl(req, a.resume_file),
        rejected_at_stage: a.rejected_at_stage || null,
        offer_letter: a.offer_letter || null,
        can_schedule_interview: canScheduleInterview,
        schedule_interview_block_reason: scheduleInterviewBlockReason,
      };
    });

    return res.json({ success: true, applications: mappedApplications, counts });
  } catch (error: any) {
    console.error("List startup applications error:", error.message);
    // #region agent log
    debugAgentLog({
      location: "startupApplicationController.ts:listApplications:catch",
      message: "listApplications failed",
      data: {
        errMessage: String(error?.message || error),
        errCode: error?.code,
        errDetail: error?.detail,
      },
      hypothesisId: "H1,H5",
    });
    // #endregion
    return res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

export const getApplicationById = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    // No-op validation since application id is a UUID string
    await ensureApplicationStageSchema();

    const rows = await sql`SELECT a.*, j.title AS job_title, s.id AS resolved_student_id, s.profile_photo AS avatar_url, s.github_url, s.linkedin_url, s.website_url, s.skills, s.location AS student_location, s.bio AS student_bio, s.educations, s.internships, s.phone AS student_phone, s.resume_file FROM applications a JOIN jobs j ON j.id = a.job_id LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email) WHERE a.id = ${id} AND j.startup_id::text = ${startupId}::text LIMIT 1`;
    const application = rows[0];
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    // Enrich with assessment data from candidate_assessments
    let assessmentData: Record<string, any> = {};
    let caForSchedule: {
      status: string;
      current_round: number;
      mcq_completed_at: unknown;
      coding_completed_at: unknown;
      overall_result: string | null;
    } | null = null;
    let roundsForSchedule: unknown = undefined;
    try {
      const caRows = await query(
        `SELECT ca.status AS assessment_status, ca.current_round,
                ca.mcq_score, ca.mcq_total, ca.coding_score, ca.interview_score,
                ca.overall_result, ca.mcq_completed_at, ca.coding_completed_at,
                ca.interview_completed_at, a.total_rounds, a.rounds
         FROM candidate_assessments ca
         JOIN assessments a ON a.id = ca.assessment_id
         WHERE ca.application_id::text = $1::text
         ORDER BY CASE ca.status WHEN 'completed' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, ca.id DESC
         LIMIT 1`,
        [String(id)]
      );
      console.log(`[getApplicationById] assessment enrichment for app ${id}: ${caRows.length} rows, status=${caRows[0]?.assessment_status}, mcq=${caRows[0]?.mcq_score}/${caRows[0]?.mcq_total}`);
      if (caRows.length > 0) {
        const ca = caRows[0];
        assessmentData = {
          assessmentStatus: ca.assessment_status,
          currentRound: ca.current_round,
          totalRounds: ca.total_rounds,
          rounds: ca.rounds,
          mcqScore: ca.mcq_score,
          mcqTotal: ca.mcq_total,
          codingScore: ca.coding_score,
          interviewScore: ca.interview_score,
          overallResult: ca.overall_result,
          mcqCompletedAt: ca.mcq_completed_at,
          codingCompletedAt: ca.coding_completed_at,
          interviewCompletedAt: ca.interview_completed_at,
        };
        caForSchedule = {
          status: ca.assessment_status,
          current_round: ca.current_round,
          mcq_completed_at: ca.mcq_completed_at,
          coding_completed_at: ca.coding_completed_at,
          overall_result: ca.overall_result,
        };
        roundsForSchedule = ca.rounds;
      }
    } catch (err: any) {
      console.error("Assessment data enrichment error:", err.message);
    }
    const canScheduleInterview = computeCanScheduleInterview(caForSchedule, roundsForSchedule);
    const scheduleInterviewBlockReason = canScheduleInterview ? null : getScheduleInterviewBlockReason(caForSchedule, roundsForSchedule);

    // Fetch interview details for this application
    let interviewData: Record<string, any> = {};
    try {
      const intRows = await query(
        `SELECT i.id AS interview_id, i.scheduled_date, i.time_slot, i.platform, i.meet_link,
                i.interview_type, i.status AS interview_status, i.notes AS interview_notes,
                i.candidate_joined_at, i.created_at AS interview_created_at
         FROM interviews i
         WHERE i.application_id::text = $1::text
         ORDER BY i.scheduled_date DESC LIMIT 1`,
        [String(id)]
      );
      if (intRows.length > 0) {
        const iv = intRows[0];
        interviewData = {
          interviewId: iv.interview_id,
          interviewScheduledDate: iv.scheduled_date,
          interviewTimeSlot: iv.time_slot,
          interviewPlatform: iv.platform,
          interviewMeetLink: iv.meet_link,
          interviewType: iv.interview_type,
          interviewStatus: iv.interview_status,
          interviewNotes: iv.interview_notes,
          candidateJoinedAt: iv.candidate_joined_at,
          interviewCreatedAt: iv.interview_created_at,
        };
      }
    } catch (err: any) {
      console.error("Interview data enrichment error:", err.message);
    }

    // Derive the pipeline stage from assessment progress so the pipeline moves dynamically
    let derivedStage = application.stage || resolveStageFromStatus(String(application.status || "new"));
    // Never override explicit terminal stages (selected/rejected) with assessment-derived data
    const isTerminal = derivedStage === 'selected' || derivedStage === 'rejected';
    if (assessmentData.assessmentStatus && !isTerminal) {
      const rounds = Array.isArray(assessmentData.rounds) ? assessmentData.rounds : [];
      const currentRoundIdx = (assessmentData.currentRound ?? 1) - 1;
      const currentRoundType = rounds[currentRoundIdx]
        ? String(rounds[currentRoundIdx].type || '').toLowerCase()
        : null;

      if (assessmentData.overallResult === 'rejected' || assessmentData.assessmentStatus === 'rejected') {
        // If not already rejected in the DB, update it
        if (derivedStage !== 'rejected') {
          const rejAtStage = currentRoundType || derivedStage;
          derivedStage = 'rejected';
          try {
            await sql`UPDATE applications SET stage = 'rejected', status = 'rejected', rejected_at_stage = ${rejAtStage}, updated_at = NOW() WHERE id = ${id}`;
          } catch { /* best effort */ }
          application.rejected_at_stage = rejAtStage;
        }
      } else if (assessmentData.assessmentStatus === 'completed') {
        // All assessment rounds done — advance to interview if not already past it
        const STAGE_ORDER = ['applied', 'shortlisted', 'mcq', 'coding', 'interview', 'selected'];
        const lastRoundType = rounds.length > 0
          ? String(rounds[rounds.length - 1].type || '').toLowerCase()
          : null;
        const afterAssessmentStage = lastRoundType === 'interview' ? 'selected' : 'interview';
        if (STAGE_ORDER.indexOf(derivedStage) < STAGE_ORDER.indexOf(afterAssessmentStage)) {
          derivedStage = afterAssessmentStage;
          try {
            await sql`UPDATE applications SET stage = ${derivedStage}, updated_at = NOW() WHERE id = ${id}`;
          } catch { /* best effort */ }
        }
      } else if (currentRoundType && ['mcq', 'coding', 'interview'].includes(currentRoundType)) {
        // Assessment pending or in progress — use the actual assessment round as the stage
        const STAGE_ORDER = ['applied', 'shortlisted', 'mcq', 'coding', 'interview', 'selected'];
        const prevStage = application.stage || '';
        derivedStage = currentRoundType;
        // Only advance the DB stage forward, never regress it
        if (STAGE_ORDER.indexOf(prevStage) < STAGE_ORDER.indexOf(currentRoundType)) {
          try {
            await sql`UPDATE applications SET stage = ${derivedStage}, updated_at = NOW() WHERE id = ${id}`;
          } catch { /* best effort */ }
        }
      }
    }

    return res.json({
      success: true,
      application: {
        ...application,
        stage: derivedStage,
        candidate_name: application.candidate_name || application.student_name,
        candidate_email: application.candidate_email || application.email,
        match_score: resolveApplicationScore(application),
        avatar_url: resolveMediaUrl(req, application.avatar_url),
        github_url: application.github_url || null,
        linkedin_url: application.linkedin_url || null,
        website_url: application.website_url || null,
        student_location: application.student_location || null,
        student_bio: application.student_bio || null,
        student_phone: application.student_phone || null,
        skills: application.skills || null,
        educations: application.educations || null,
        internships: application.internships || null,
        resume_file: resolveMediaUrl(req, application.resume_file),
        rejected_at_stage: application.rejected_at_stage || null,
        offer_letter: application.offer_letter || null,
        can_schedule_interview: canScheduleInterview,
        schedule_interview_block_reason: scheduleInterviewBlockReason,
        ...assessmentData,
        ...interviewData,
      },
    });
    } catch (error: any) {
      console.error("List applications error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch applications", stack: error.stack });
    }
  };

export const updateApplicationStatus = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  const { status } = req.body;

  // No-op validation since application id is a UUID string

  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  if (status === 'hired' || status === 'selected') {
    const startupRows = await query(`
      SELECT plan_type, 
      (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = $1::text AND a.stage = 'selected') as hired_count
      FROM startups WHERE id::text = $1::text
    `, [startupId]);
    if (startupRows[0]) {
      const s = startupRows[0];
      if (s.plan_type === 'trial' && parseInt(s.hired_count) >= 3) {
        return res.status(403).json({
          success: false,
          message: "You have reached your 3-student free limit. Please pay to continue hiring.",
          status: "STUDENT_LIMIT_REACHED"
        });
      }
    }
  }

  try {
    await ensureApplicationStageSchema();

    const rows = await sql`
      UPDATE applications a
      SET status = ${status}, stage = ${resolveStageFromStatus(status)}, updated_at = NOW()
      FROM jobs j
      WHERE a.id = ${id} AND a.job_id = j.id AND j.startup_id::text = ${startupId}::text
      RETURNING a.*
    `;
    const application = rows[0];
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    // Cascade status to candidate_assessments so student side reflects the change
    if (status === 'rejected') {
      try {
        await query(
          `UPDATE candidate_assessments SET overall_result = 'rejected' WHERE application_id::text = $1::text`,
          [String(id)]
        );
      } catch (err: any) {
        console.error("Failed to cascade rejection to candidate_assessments:", err.message);
      }
    }

    return res.json({ success: true, application });
  } catch (error: any) {
    console.error("Update startup application status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update application status" });
  }
};

export const updateApplicationStage = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  const { stage, rejection_reason } = req.body;

  // No-op validation since application id is a UUID string

  if (!VALID_STAGES.includes(String(stage || "").toLowerCase())) {
    return res.status(400).json({ success: false, message: "Invalid stage" });
  }

  const normalizedStage = String(stage).toLowerCase();
  const mappedStatus = resolveStatusFromStage(normalizedStage);

  if (normalizedStage === 'selected') {
    const startupRows = await query(`
      SELECT plan_type, 
      (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.startup_id::text = $1::text AND a.stage = 'selected') as hired_count
      FROM startups WHERE id::text = $1::text
    `, [startupId]);
    if (startupRows[0]) {
      const s = startupRows[0];
      if (s.plan_type === 'trial' && parseInt(s.hired_count) >= 3) {
        return res.status(403).json({
          success: false,
          message: "You have reached your 3-student free limit. Please pay to continue hiring.",
          status: "STUDENT_LIMIT_REACHED"
        });
      }
    }
  }

  try {
    await ensureApplicationStageSchema();

    let rows;
    if (normalizedStage === 'rejected') {
      const currentRows = await sql`SELECT stage FROM applications WHERE id = ${id}`;
      const rejectedAtStage = String(currentRows[0]?.stage || 'applied');
      rows = await sql`
        UPDATE applications a
        SET stage = ${normalizedStage}, status = ${mappedStatus}, updated_at = NOW(), rejected_at_stage = ${rejectedAtStage}
        FROM jobs j
        WHERE a.id = ${id} AND a.job_id = j.id AND j.startup_id::text = ${startupId}::text
        RETURNING a.*, j.title AS job_title
      `;
    } else {
      rows = await sql`
        UPDATE applications a
        SET stage = ${normalizedStage}, status = ${mappedStatus}, updated_at = NOW()
        FROM jobs j
        WHERE a.id = ${id} AND a.job_id = j.id AND j.startup_id::text = ${startupId}::text
        RETURNING a.*, j.title AS job_title
      `;
    }

    const application = rows[0];
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    // Cascade to candidate_assessments when selecting a candidate
    if (normalizedStage === 'selected') {
      try {
        await query(
          `UPDATE candidate_assessments SET status = 'completed', overall_result = 'passed' WHERE application_id::text = $1::text`,
          [String(id)]
        );
        // Mark all non-terminal interviews as completed
        await query(
          `UPDATE interviews SET status = 'completed' WHERE application_id::text = $1::text AND status NOT IN ('completed', 'cancelled')`,
          [String(id)]
        );
      } catch (err: any) {
        console.error("Failed to cascade selection to related records:", err.message);
      }

      // Send selection notification to student
      const studentId = application.student_id;
      if (studentId) {
        const jobTitle = application.job_title || 'a position';
        try {
          const startupRows = await sql`SELECT company_name FROM startups WHERE id::text = ${startupId}::text`;
          const companyName = (startupRows[0] as any)?.company_name || 'A startup';
          const notification = await NotificationModel.createNotification({
            student_id: studentId,
            title: `Congratulations! You've been selected`,
            message: `${companyName} has selected you for ${jobTitle}. An offer letter will be shared with you soon.`,
            type: 'offer',
            link: '/student/my-jobs?tab=offered',
          });
          const io = req.app.get('io');
          if (io && notification) {
            io.to(`${studentId}_student`).emit('new_notification', {
              notification,
              unreadCount: await NotificationModel.getUnreadCount(studentId),
            });
          }
        } catch (notifErr: any) {
          console.error('Failed to send selection notification:', notifErr.message);
        }
      }
    }

    // Cascade status to candidate_assessments so student side reflects the change
    if (normalizedStage === 'rejected') {
      try {
        await query(
          `UPDATE candidate_assessments SET overall_result = 'rejected' WHERE application_id::text = $1::text`,
          [String(id)]
        );
        // Mark all non-terminal interviews as cancelled
        await query(
          `UPDATE interviews SET status = 'cancelled' WHERE application_id::text = $1::text AND status NOT IN ('completed', 'cancelled')`,
          [String(id)]
        );
      } catch (err: any) {
        console.error("Failed to cascade rejection to related records:", err.message);
      }

      // Send rejection notification to student
      const studentId = application.student_id;
      if (studentId) {
        const jobTitle = application.job_title || 'a position';
        const reasonText = rejection_reason ? `\n\nReason: ${rejection_reason}` : '';
        NotificationModel.createNotification({
          student_id: studentId,
          title: `Application Update: ${jobTitle}`,
          message: `Your application for ${jobTitle} has been reviewed. Unfortunately, the company has decided not to move forward at this time.${reasonText}`,
          type: 'rejection',
          link: null,
        }).then(async (notification: any) => {
          const io = req.app.get('io');
          if (io && notification) {
            io.to(`${studentId}_student`).emit('new_notification', { notification });
          }
        }).catch((err: any) => {
          console.error('Failed to send rejection notification:', err.message);
        });
      }
    }

    return res.json({ success: true, application });
  } catch (error: any) {
    console.error("Update application stage error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update application stage" });
  }
};

export const updateOfferLetter = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  const { offer_letter } = req.body;

  // No-op validation since application id is a UUID string

  if (!offer_letter || typeof offer_letter !== 'string' || !offer_letter.startsWith('data:')) {
    return res.status(400).json({ success: false, message: "Valid base64 data URL is required" });
  }

  try {
    await ensureApplicationStageSchema();

    const rows = await sql`
      UPDATE applications a
      SET offer_letter = ${offer_letter}, status = 'hired', stage = 'selected', updated_at = NOW()
      FROM jobs j
      WHERE a.id = ${id} AND a.job_id = j.id AND j.startup_id::text = ${startupId}::text
      RETURNING a.id, a.student_id, j.title AS job_title
    `;
    if (!rows[0]) return res.status(404).json({ success: false, message: "Application not found" });
    
    // Cascade to related records
    try {
      await query(
        `UPDATE candidate_assessments SET status = 'completed', overall_result = 'passed' WHERE application_id::text = $1::text`,
        [String(id)]
      );
      await query(
        `UPDATE interviews SET status = 'completed' WHERE application_id::text = $1::text AND status NOT IN ('completed', 'cancelled')`,
        [String(id)]
      );
    } catch (err: any) {
      console.error("Failed to cascade offer letter selection:", err.message);
    }

    // Send notification to student about the offer letter
    const app = rows[0] as any;
    if (app.student_id) {
      try {
        const startupRows = await sql`SELECT company_name FROM startups WHERE id::text = ${startupId}::text`;
        const companyName = (startupRows[0] as any)?.company_name || 'A startup';
        const jobTitle = app.job_title || 'a position';

        const notification = await NotificationModel.createNotification({
          student_id: app.student_id,
          title: `Offer Letter Received: ${jobTitle}`,
          message: `Congratulations! ${companyName} has sent you an offer letter for ${jobTitle}. View it in your job applications.`,
          type: 'offer',
          link: '/student/my-jobs?tab=offered',
        });

        const io = req.app.get('io');
        if (io && notification) {
          io.to(`${app.student_id}_student`).emit('new_notification', {
            notification,
            unreadCount: await NotificationModel.getUnreadCount(app.student_id),
          });
        }
      } catch (notifErr: any) {
        console.error('Failed to send offer letter notification:', notifErr.message);
      }
    }

    return res.json({ success: true, message: "Offer letter uploaded successfully" });
  } catch (error: any) {
    console.error("Update offer letter error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to upload offer letter" });
  }
};

export const listRescheduleRequests = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user?.id;
  if (!startupId) return res.status(401).json({ success: false, message: "Not authorized" });
  try {
    const requests = await query(
      `SELECT
         a.id,
         a.student_id,
         COALESCE(s.name, a.student_name, a.candidate_name) AS student_name,
         COALESCE(s.email, a.candidate_email)                 AS student_email,
         s.profile_photo                                      AS avatar_url,
         a.role_applied,
         a.reschedule_reason,
         a.reschedule_screenshot,
         a.reschedule_requested_at,
         j.title                                             AS job_title,
         COALESCE(
           (SELECT ass.title 
            FROM candidate_assessments ca 
            JOIN assessments ass ON ass.id = ca.assessment_id 
            WHERE ca.application_id::text = a.id::text 
            ORDER BY ca.created_at DESC LIMIT 1),
           'Assessment'
         )                                                   AS assessment_title
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       LEFT JOIN students s ON s.id::text = a.student_id::text
       WHERE j.startup_id::text = $1::text
         AND a.status = 'reschedule_requested'
       ORDER BY a.reschedule_requested_at DESC NULLS LAST`,
      [startupId]
    );

    const mapped = requests.map((r: any) => ({
      ...r,
      avatar_url: resolveMediaUrl(req, r.avatar_url),
    }));

    return res.json({ success: true, requests: mapped });
  } catch (err: any) {
    console.error("List reschedule requests error:", err.message, err.stack);
    return res.status(500).json({ success: false, message: err.message || "Failed to list reschedule requests" });
  }
};


export const acceptRescheduleRequest = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    // Verify application belongs to this startup
    const appRows = await query(
      `SELECT a.*, j.startup_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id::text = $1`,
      [id]
    );
    if (!appRows.length || String(appRows[0].startup_id) !== String(startupId)) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const application = appRows[0];

    // Reset tracking state
    await query(
      `UPDATE applications 
       SET status = 'new', 
           stage = 'applied', 
           round1_score = NULL, 
           round2_score = NULL, 
           interview_date = NULL, 
           interview_time = NULL, 
           interview_link = NULL,
           reschedule_reason = NULL,
           reschedule_screenshot = NULL,
           reschedule_requested_at = NULL,
           updated_at = NOW()
       WHERE id::text = $1`,
      [id]
    );

    // Delete candidate assessment progress (cascades deletes mcq_responses)
    await query(`DELETE FROM candidate_assessments WHERE application_id::text = $1`, [id]);

    // Cancel related active interviews
    await query(
      `UPDATE interviews 
       SET status = 'cancelled' 
       WHERE application_id::text = $1 AND status NOT IN ('completed', 'cancelled')`,
      [id]
    );

    // Send notification to student
    if (application.student_id) {
      NotificationModel.createNotification({
        student_id: application.student_id,
        title: `Reschedule Request Approved`,
        message: `Your reschedule request for ${application.role_applied} was approved. Your hiring track has been restarted from the beginning.`,
        type: 'notification',
        link: '/student/dashboard'
      }).then(async (notification: any) => {
        const io = req.app.get('io');
        if (io && notification) {
          io.to(`${application.student_id}_student`).emit('new_notification', {
            notification,
            unreadCount: await NotificationModel.getUnreadCount(application.student_id),
          });
        }
      }).catch(() => {});
    }

    return res.json({ success: true, message: "Reschedule request approved. Hiring track restarted." });
  } catch (err: any) {
    console.error("Accept reschedule error:", err);
    return res.status(500).json({ success: false, message: "Failed to accept reschedule request" });
  }
};

export const rejectRescheduleRequest = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    // Verify application belongs to this startup
    const appRows = await query(
      `SELECT a.*, j.startup_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id::text = $1`,
      [id]
    );
    if (!appRows.length || String(appRows[0].startup_id) !== String(startupId)) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const application = appRows[0];

    // Revert status to shortlisted
    await query(
      `UPDATE applications 
       SET status = 'shortlisted', 
           reschedule_reason = NULL, 
           reschedule_screenshot = NULL, 
           reschedule_requested_at = NULL,
           updated_at = NOW()
       WHERE id::text = $1`,
      [id]
    );

    // Send notification to student
    if (application.student_id) {
      NotificationModel.createNotification({
        student_id: application.student_id,
        title: `Reschedule Request Declined`,
        message: `Your reschedule request for ${application.role_applied} has been declined.`,
        type: 'notification',
        link: '/student/dashboard'
      }).then(async (notification: any) => {
        const io = req.app.get('io');
        if (io && notification) {
          io.to(`${application.student_id}_student`).emit('new_notification', {
            notification,
            unreadCount: await NotificationModel.getUnreadCount(application.student_id),
          });
        }
      }).catch(() => {});
    }

    return res.json({ success: true, message: "Reschedule request declined." });
  } catch (err: any) {
    console.error("Reject reschedule error:", err);
    return res.status(500).json({ success: false, message: "Failed to reject reschedule request" });
  }
};
