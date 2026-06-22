import { Request, Response } from "express";
import { sql } from "../config/database";
import { query } from "../config/database";
import { debugAgentLog } from "../utils/debugAgentLog";

const TRACKING_STAGES = ["applied", "shortlisted", "mcq", "coding", "task", "interview", "selected", "rejected"];
let trackingStageSchemaReady = false;

const ensureTrackingStageSchema = async () => {
  if (trackingStageSchemaReady) return;

  await sql`
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS stage VARCHAR(30)
  `;

  await sql`
    UPDATE applications
    SET stage = CASE
      WHEN LOWER(COALESCE(status, 'new')) IN ('hired', 'selected') THEN 'selected'
      WHEN LOWER(COALESCE(status, 'new')) = 'rejected' THEN 'rejected'
      WHEN LOWER(COALESCE(status, 'new')) IN ('interview_scheduled', 'interviewing') THEN 'interview'
      WHEN LOWER(COALESCE(status, 'new')) = 'shortlisted' THEN 'shortlisted'
      ELSE 'applied'
    END
    WHERE stage IS NULL OR TRIM(stage) = ''
  `;

  trackingStageSchemaReady = true;
};

const resolveStage = (stage: any, status: any): string => {
  const normalizedStage = String(stage || "").toLowerCase().trim();
  if (TRACKING_STAGES.includes(normalizedStage)) return normalizedStage;

  const normalizedStatus = String(status || "").toLowerCase();
  if (normalizedStatus === "shortlisted") return "shortlisted";
  if (normalizedStatus === "interview_scheduled" || normalizedStatus === "interviewing") return "interview";
  if (normalizedStatus === "hired" || normalizedStatus === "selected") return "selected";
  if (normalizedStatus === "rejected") return "rejected";
  return "applied";
};

const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    LIMIT 1
  `;
  return rows.length > 0;
};

const getStartupNameById = async (startupId: string): Promise<string | null> => {
  const [startup] = await sql`
    SELECT company_name, founder_name
    FROM startups
    WHERE id = ${startupId}
    LIMIT 1
  `;
  return startup?.company_name || startup?.founder_name || null;
};

const makeLegacyJobId = (): string => `job-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const toStringOrNull = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const toIntegerOrNull = (value: any): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : null;
};

const toStringArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item || "").trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const composeRequirements = (
  experience: string | null,
  education: string | null,
  openings: number | null,
  applicationDeadline: string | null,
  applicationMethod: string | null,
  externalUrl: string | null,
  workMode: string | null,
  skills: string[],
  screeningQuestions: string[]
): string | null => {
  const lines: string[] = [];
  if (experience) lines.push(`Experience: ${experience}`);
  if (education) lines.push(`Education: ${education}`);
  if (openings) lines.push(`Openings: ${openings}`);
  if (applicationDeadline) lines.push(`Application Deadline: ${applicationDeadline}`);
  if (applicationMethod) lines.push(`Application Method: ${applicationMethod}`);
  if (externalUrl) lines.push(`External URL: ${externalUrl}`);
  if (workMode) lines.push(`Work Mode: ${workMode}`);
  if (skills.length) lines.push(`Skills: ${skills.join(", ")}`);
  if (screeningQuestions.length) lines.push(`Screening Questions: ${screeningQuestions.join(" | ")}`);
  return lines.length ? lines.join("\n") : null;
};

const getJobsColumnSupport = async () => {
  const columns = [
    "title",
    "field",
    "department",
    "domain",
    "emp_type",
    "type",
    "location",
    "salary",
    "sal_min",
    "sal_max",
    "description",
    "status",
    "remote",
    "work_mode",
    "experience",
    "education",
    "openings",
    "application_deadline",
    "application_method",
    "external_url",
    "skills",
    "screening_questions",
    "requirements",
  ] as const;

  const checks = await Promise.all(columns.map((column) => hasColumn("jobs", column)));
  return columns.reduce<Record<string, boolean>>((acc, column, idx) => {
    acc[column] = checks[idx];
    return acc;
  }, {});
};

const buildColumnValueMap = (payload: any, support: Record<string, boolean>) => {
  const title = toStringOrNull(payload.title);
  const field = toStringOrNull(payload.field) || "IT";
  const department = toStringOrNull(payload.department);
  const empType = toStringOrNull(payload.empType) || "Full-time";
  const location = toStringOrNull(payload.location);
  const description = toStringOrNull(payload.description);
  const status = toStringOrNull(payload.status) || "active";
  const experience = toStringOrNull(payload.experience);
  const education = toStringOrNull(payload.education);
  const openings = toIntegerOrNull(payload.openings);
  const applicationDeadline = toStringOrNull(payload.applicationDeadline);
  const applicationMethod = toStringOrNull(payload.applicationMethod);
  const externalUrl = toStringOrNull(payload.externalUrl);
  const workMode = toStringOrNull(payload.workMode);
  const skills = toStringArray(payload.skills);
  const screeningQuestions = toStringArray(payload.screeningQuestions);

  const salMin = toIntegerOrNull(payload.salMin);
  const salMax = toIntegerOrNull(payload.salMax);
  const salary = salMin || salMax ? `${salMin || ""}${salMin && salMax ? " - " : ""}${salMax || ""}`.trim() : null;

  const remote = typeof payload.remote === "boolean"
    ? payload.remote
    : (workMode ? workMode.toLowerCase() !== "onsite" : null);

  const values: Record<string, any> = {};

  if (support.title) values.title = title;
  if (support.field) values.field = field;
  if (support.department) values.department = department;
  if (support.domain) values.domain = department;
  if (support.emp_type) values.emp_type = empType;
  if (support.type) values.type = empType;
  if (support.location) values.location = location;
  if (support.description) values.description = description;
  if (support.status) values.status = status;
  if (support.remote) values.remote = remote;
  if (support.work_mode) values.work_mode = workMode;
  if (support.experience) values.experience = experience;
  if (support.education) values.education = education;
  if (support.openings) values.openings = openings;
  if (support.application_deadline) values.application_deadline = applicationDeadline;
  if (support.application_method) values.application_method = applicationMethod;
  if (support.external_url) values.external_url = externalUrl;
  if (support.sal_min) values.sal_min = salMin;
  if (support.sal_max) values.sal_max = salMax;
  if (support.salary) values.salary = salary;
  if (support.skills) values.skills = skills.length ? JSON.stringify(skills) : null;
  if (support.screening_questions) values.screening_questions = screeningQuestions.length ? JSON.stringify(screeningQuestions) : null;
  if (support.requirements) {
    const reqObj: Record<string, any> = {};
    if (experience) reqObj.experience = experience;
    if (education) reqObj.education = education;
    if (openings) reqObj.openings = openings;
    if (applicationDeadline) reqObj.applicationDeadline = applicationDeadline;
    if (applicationMethod) reqObj.applicationMethod = applicationMethod;
    if (externalUrl) reqObj.externalUrl = externalUrl;
    if (workMode) reqObj.workMode = workMode;
    if (skills.length) reqObj.skills = skills;
    if (screeningQuestions.length) reqObj.screeningQuestions = screeningQuestions;
    values.requirements = Object.keys(reqObj).length ? JSON.stringify(reqObj) : null;
  }

  return values;
};

export const listJobs = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { status } = req.query;
  try {
    const jobs = status && status !== "all"
      ? await sql`
          SELECT j.*,
            COALESCE(a.applicant_count, 0)::int AS applicant_count,
            COALESCE(a.today_count, 0)::int AS today_count,
            COALESCE(i.interview_count, 0)::int AS interview_count,
            COALESCE(r.rejected_count, 0)::int AS rejected_count
          FROM jobs j
          LEFT JOIN (
            SELECT job_id, count(*)::int AS applicant_count, count(CASE WHEN applied_at >= CURRENT_DATE THEN 1 END)::int AS today_count
            FROM applications GROUP BY job_id
          ) a ON a.job_id = j.id
          LEFT JOIN (
            SELECT job_id, count(*)::int AS interview_count
            FROM applications
            WHERE LOWER(status) = 'interview_scheduled'
            GROUP BY job_id
          ) i ON i.job_id = j.id
          LEFT JOIN (
            SELECT job_id, count(*)::int AS rejected_count
            FROM applications
            WHERE LOWER(status) = 'rejected'
            GROUP BY job_id
          ) r ON r.job_id = j.id
          WHERE j.startup_id::text = ${startupId}::text AND j.status = ${status}
          ORDER BY j.created_at DESC`
      : await sql`
          SELECT j.*,
            COALESCE(a.applicant_count, 0)::int AS applicant_count,
            COALESCE(a.today_count, 0)::int AS today_count,
            COALESCE(i.interview_count, 0)::int AS interview_count,
            COALESCE(r.rejected_count, 0)::int AS rejected_count
          FROM jobs j
          LEFT JOIN (
            SELECT job_id, count(*)::int AS applicant_count, count(CASE WHEN applied_at >= CURRENT_DATE THEN 1 END)::int AS today_count
            FROM applications GROUP BY job_id
          ) a ON a.job_id = j.id
          LEFT JOIN (
            SELECT job_id, count(*)::int AS interview_count
            FROM applications
            WHERE LOWER(status) = 'interview_scheduled'
            GROUP BY job_id
          ) i ON i.job_id = j.id
          LEFT JOIN (
            SELECT job_id, count(*)::int AS rejected_count
            FROM applications
            WHERE LOWER(status) = 'rejected'
            GROUP BY job_id
          ) r ON r.job_id = j.id
          WHERE j.startup_id::text = ${startupId}::text
          ORDER BY j.created_at DESC`;

    const countRows = await sql`SELECT status, count(*)::int AS count FROM jobs WHERE startup_id::text = ${startupId}::text GROUP BY status`;

    res.json({ success: true, jobs, counts: countRows });
  } catch (err: any) {
    console.error("List jobs error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    const [job] = await sql`SELECT j.* FROM jobs j WHERE j.id = ${id} AND j.startup_id::text = ${startupId}::text LIMIT 1`;

    if (job) {
      const countRows = await sql`SELECT count(*)::int AS count FROM applications WHERE job_id = ${id}`;
      job.applicant_count = countRows[0]?.count || 0;
      const rejectedRows = await sql`SELECT count(*)::int AS count FROM applications WHERE job_id = ${id} AND LOWER(status) = 'rejected'`;
      job.rejected_count = rejectedRows[0]?.count || 0;
    }
    
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err: any) {
    console.error("Get job by id error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch job details" });
  }
};

export const getJobApplicationsTracking = async (req: Request, res: Response): Promise<any> => {
  const userRole = String((req as any).user?.role || 'student').toLowerCase();
  const startupId = String((req as any).user.id || "");
  const jobId = String(req.params.id || "");
  const stageFilter = req.query.stage ? String(req.query.stage).toLowerCase() : "";
  const statusFilter = req.query.status ? String(req.query.status).toLowerCase() : "";
  const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : "";
  const dateTo = req.query.dateTo ? String(req.query.dateTo) : "";

  try {
    await ensureTrackingStageSchema();

    // When called from /api/jobs/:id/applications (student/non-startup token), skip startup_id check
    const isStartup = userRole === 'startup';
    const jobRows = await query(
      isStartup
        ? `SELECT id, title FROM jobs WHERE id::text = $1 AND startup_id::text = $2::text LIMIT 1`
        : `SELECT id, title FROM jobs WHERE id::text = $1 LIMIT 1`,
      isStartup ? [jobId, startupId] : [jobId]
    );
    const job = jobRows[0];
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const applications = await query(
      `SELECT a.*, s.profile_photo AS avatar_url
       FROM applications a
       LEFT JOIN students s ON LOWER(s.email) = LOWER(a.candidate_email)
       WHERE a.job_id::text = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    const mapped = applications.map((app: any) => {
      const currentStage = resolveStage(app.stage, app.status);
      return {
        id: app.id,
        candidateId: app.student_id || app.id,
        applicationId: app.id,
        jobId: app.job_id,
        name: app.candidate_name || app.student_name || "Unknown Candidate",
        email: app.candidate_email || app.email || "",
        avatarUrl: app.avatar_url || app.student_avatar || null,
        currentStage,
        status: app.status || "new",
        appliedAt: app.applied_at,
      };
    });

    // Enrich with assessment round data from candidate_assessments
    const appIds = mapped.map((m: any) => String(m.applicationId));
    let assessmentMap: Record<string, any> = {};
    if (appIds.length > 0) {
      try {
        const caRows = await query(
          `SELECT ca.application_id, ca.status as assessment_status, ca.current_round, 
                  ca.mcq_score, ca.mcq_total, ca.coding_score, ca.interview_score,
                  ca.overall_result, a.total_rounds, a.rounds
           FROM candidate_assessments ca
           JOIN assessments a ON a.id = ca.assessment_id
           WHERE ca.application_id::text = ANY($1)`,
          [appIds]
        );
        caRows.forEach((row: any) => {
          assessmentMap[String(row.application_id)] = row;
        });
      } catch (err: any) {
        console.error("Assessment data enrichment error:", err.message);
      }
    }

    const enriched = mapped.map((candidate: any) => {
      const ca = assessmentMap[String(candidate.applicationId)];
      if (ca) {
        return {
          ...candidate,
          assessmentStatus: ca.assessment_status,
          currentRound: ca.current_round,
          totalRounds: ca.total_rounds,
          rounds: ca.rounds,
          mcqScore: ca.mcq_score,
          mcqTotal: ca.mcq_total,
          codingScore: ca.coding_score,
          interviewScore: ca.interview_score,
          overallResult: ca.overall_result,
        };
      }
      return candidate;
    });

    const filtered = enriched.filter((app: any) => {
      if (stageFilter && app.currentStage !== stageFilter) return false;
      if (statusFilter && String(app.status || "").toLowerCase() !== statusFilter) return false;

      if (dateFrom || dateTo) {
        const appliedTime = new Date(app.appliedAt).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (!Number.isNaN(fromTime) && appliedTime < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).getTime();
          if (!Number.isNaN(toTime) && appliedTime > toTime + 86399999) return false;
        }
      }

      return true;
    });

    // Derive dynamic pipeline stages from the assessment's rounds config (if available)
    let dynamicMiddleStages: string[] = [];
    const firstAssessment = Object.values(assessmentMap)[0] as any;
    if (firstAssessment?.rounds && Array.isArray(firstAssessment.rounds)) {
      dynamicMiddleStages = firstAssessment.rounds
        .map((r: any) => String(r.type || '').toLowerCase())
        .filter((t: string) => t && !['applied', 'shortlisted', 'selected', 'rejected'].includes(t));
    }
    const pipelineStages = dynamicMiddleStages.length > 0
      ? ['applied', 'shortlisted', ...dynamicMiddleStages, 'selected', 'rejected']
      : TRACKING_STAGES;

    const stageBuckets: Record<string, any[]> = pipelineStages.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {} as Record<string, any[]>);

    filtered.forEach((app: any) => {
      const stage = app.currentStage;
      if (stageBuckets[stage]) {
        stageBuckets[stage].push(app);
      } else {
        // Unknown stage — place in 'applied' bucket as fallback
        stageBuckets['applied'].push(app);
      }
    });

    const summary = {
      totalApplicants: filtered.length,
      shortlisted: stageBuckets.shortlisted?.length || 0,
      interviewsScheduled: stageBuckets.interview?.length || 0,
      selected: stageBuckets.selected?.length || 0,
    };

    res.json({
      success: true,
      job: { id: job.id, title: job.title },
      summary,
      pipeline: pipelineStages.map((stage) => ({
        stage,
        count: stageBuckets[stage]?.length || 0,
        candidates: stageBuckets[stage] || [],
      })),
      applications: filtered,
    });
  } catch (error: any) {
    console.error("Get job applications tracking error:", error.message);
    // #region agent log
    debugAgentLog({
      location: "startupJobController.ts:getJobApplicationsTracking:catch",
      message: "getJobApplicationsTracking failed",
      data: {
        errMessage: String(error?.message || error),
        errCode: error?.code,
        errDetail: error?.detail,
        jobId,
      },
      hypothesisId: "H1,H2",
    });
    // #endregion
    res.status(500).json({ success: false, message: "Failed to fetch tracking data" });
  }
};

export const createJob = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  try {
    const startupName = await getStartupNameById(startupId);
    if (!startupName) return res.status(400).json({ success: false, message: "Startup not found" });

    const support = await getJobsColumnSupport();
    const valueMap = buildColumnValueMap(req.body || {}, support);

    const baseColumns = ["startup_name", "startup_id"];
    const baseValues: any[] = [startupName, startupId];
    const dynamicEntries = Object.entries(valueMap).filter(([, value]) => value !== undefined);

    const columns = [...baseColumns, ...dynamicEntries.map(([column]) => column)];
    const values = [...baseValues, ...dynamicEntries.map(([, value]) => value)];
    const placeholders = values.map((_, idx) => `$${idx + 1}`);

    const insertSql = `INSERT INTO jobs (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const rows = await query(insertSql, values);
    const job = rows[0];

    res.status(201).json({ success: true, job });
  } catch (err: any) {
    console.error("Create job error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    const support = await getJobsColumnSupport();
    const valueMap = buildColumnValueMap(req.body || {}, support);
    const entries = Object.entries(valueMap).filter(([, value]) => value !== undefined);

    if (!entries.length) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }

    const assignments = entries.map(([column], idx) => `${column} = $${idx + 1}`);
    const values = entries.map(([, value]) => value);
    values.push(id, startupId);

    const updateSql = `
      UPDATE jobs
      SET ${assignments.join(", ")}
      WHERE id = $${entries.length + 1} AND startup_id::text = $${entries.length + 2}::text
      RETURNING *
    `;

    const rows = await query(updateSql, values);
    const job = rows[0];

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err: any) {
    console.error("Update job error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

export const updateJobStatus = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  const { status } = req.body;
  const valid = ["active", "paused", "closed", "draft"];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
  try {
    const [job] = await sql`UPDATE jobs SET status = ${status} WHERE id = ${id} AND startup_id::text = ${startupId}::text RETURNING *`;

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err: any) {
    console.error("Update job status error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<any> => {
  const startupId = (req as any).user.id;
  const { id } = req.params;
  try {
    const [deleted] = await sql`DELETE FROM jobs WHERE id = ${id} AND startup_id::text = ${startupId}::text RETURNING id`;

    if (!deleted) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err: any) {
    console.error("Delete job error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};
