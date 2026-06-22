import { sql, query } from "../config/database";

const AssessmentModel = {
  async ensureMcqQuestionColumns() {
    const mcqColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'mcq_questions'
    `;
    const mcqColumnNames = new Set(mcqColumns.map((c: any) => String(c.column_name || '').toLowerCase()));

    if (!mcqColumnNames.has('assessment_id')) {
      if (mcqColumnNames.has('assessmentid')) {
        await sql`ALTER TABLE mcq_questions RENAME COLUMN assessmentid TO assessment_id`;
      } else {
        await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS assessment_id INTEGER`;
      }
    }

    if (mcqColumnNames.has('correct_option_index') && !mcqColumnNames.has('correct_answer')) {
      await sql`ALTER TABLE mcq_questions RENAME COLUMN correct_option_index TO correct_answer`;
    }

    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'multiple_choice'`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS domain VARCHAR(100) `;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS correct_answer INTEGER DEFAULT 0`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 60`;
    await sql`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS explanation TEXT`;
  },

  async ensureAssessmentColumns() {
    try {
      const resp = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'assessments'
      `;
      const cols = new Set(resp.map((c: any) => String(c.column_name || '').toLowerCase()));

      if (!cols.has('total_rounds')) {
        await sql`ALTER TABLE assessments ADD COLUMN total_rounds INTEGER DEFAULT 1`;
      }
      if (!cols.has('rounds')) {
        await sql`ALTER TABLE assessments ADD COLUMN rounds JSONB DEFAULT '[]'`;
      }
      if (!cols.has('is_active')) {
        await sql`ALTER TABLE assessments ADD COLUMN is_active BOOLEAN DEFAULT true`;
      }
      if (!cols.has('updated_at')) {
        await sql`ALTER TABLE assessments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()`;
      }
      if (!cols.has('field')) {
        await sql`ALTER TABLE assessments ADD COLUMN field VARCHAR(20) DEFAULT 'IT'`;
      }
      console.log("✅ Assessments table schema verified");
    } catch (err: any) {
      console.error("⚠️ Failed to verify assessments schema:", err.message);
    }
  },

  async createTable() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS assessments (
          id SERIAL PRIMARY KEY,
          startup_id TEXT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          total_rounds INTEGER DEFAULT 1,
          rounds JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await this.ensureAssessmentColumns();

      // Legacy environments used INTEGER startup_id. Convert to TEXT so IDs like
      // "startup-1774669795916-99b3f7" can be stored without insert failures.
      try {
        await sql`ALTER TABLE assessments DROP CONSTRAINT IF EXISTS fk_assessments_startup`;
        await sql`ALTER TABLE assessments ALTER COLUMN startup_id TYPE TEXT USING startup_id::text`;
      } catch (migrationError: any) {
        console.log("Assessment startup_id type migration note (safe to ignore):", migrationError.message);
      }

      try {
        await sql`
          ALTER TABLE assessments
          ADD CONSTRAINT IF NOT EXISTS fk_assessments_startup
          FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
        `;
      } catch (_fkError) {
        console.log("Foreign key constraint not added - startups table may not exist yet");
      }

      await sql`
        CREATE TABLE IF NOT EXISTS mcq_questions (
          id SERIAL PRIMARY KEY,
          assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          question_type VARCHAR(50) DEFAULT 'multiple_choice',
          domain VARCHAR(100),
          difficulty VARCHAR(20) DEFAULT 'medium',
          options JSONB NOT NULL DEFAULT '[]',
          correct_answer INTEGER NOT NULL,
          points INTEGER DEFAULT 1,
          time_limit INTEGER DEFAULT 60,
          explanation TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      try {
        await this.ensureMcqQuestionColumns();
      } catch (migrationError: any) {
        console.log("MCQ table migration note (safe to ignore):", migrationError.message);
      }

      await sql`
        CREATE TABLE IF NOT EXISTS candidate_assessments (
          id SERIAL PRIMARY KEY,
          assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
          application_id TEXT,
          student_id TEXT,
          current_round INTEGER DEFAULT 1,
          status VARCHAR(50) DEFAULT 'pending',
          mcq_score INTEGER DEFAULT 0,
          mcq_total INTEGER DEFAULT 0,
          mcq_completed_at TIMESTAMP,
          coding_score INTEGER DEFAULT 0,
          coding_completed_at TIMESTAMP,
          interview_score INTEGER DEFAULT 0,
          interview_completed_at TIMESTAMP,
          overall_result VARCHAR(50),
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS mcq_responses (
          id SERIAL PRIMARY KEY,
          candidate_assessment_id INTEGER NOT NULL REFERENCES candidate_assessments(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES mcq_questions(id) ON DELETE CASCADE,
          selected_option INTEGER,
          is_correct BOOLEAN DEFAULT false,
          time_taken INTEGER DEFAULT 0,
          answered_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await this.ensureCandidateAssessmentColumns();

      console.log("Assessment tables created/verified");
    } catch (error: any) {
      console.error("Error creating assessment tables:", error.message);
    }
  },

  async ensureCandidateAssessmentColumns() {
    const columns = [
      { name: "ai_coding_score", def: "INTEGER" },
      { name: "ai_coding_feedback", def: "TEXT" },
      { name: "submitted_code", def: "TEXT" },
      { name: "coding_language", def: "VARCHAR(50)" },
      { name: "started_at", def: "TIMESTAMP" },
      { name: "completed_at", def: "TIMESTAMP" },
      { name: "mcq_completed_at", def: "TIMESTAMP" },
      { name: "coding_completed_at", def: "TIMESTAMP" },
      { name: "interview_score", def: "INTEGER DEFAULT 0" },
      { name: "interview_completed_at", def: "TIMESTAMP" },
      { name: "overall_result", def: "VARCHAR(50)" },
      { name: "created_at", def: "TIMESTAMP DEFAULT NOW()" },
      { name: "task_file", def: "TEXT" },
      { name: "task_completed_at", def: "TIMESTAMP" },
    ];
    for (const col of columns) {
      try {
        await query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}`);
      } catch (_) {
        // column may already exist; safe to ignore
      }
    }
  },

  async create({ startup_id, title, description, total_rounds, rounds, field }: any) {
    try {
      const result = await sql`
        INSERT INTO assessments (startup_id, title, description, total_rounds, rounds, field)
        VALUES (${String(startup_id)}, ${title}, ${description}, ${total_rounds}, ${JSON.stringify(rounds)}, ${field || 'IT'})
        RETURNING *
      `;
      return result[0];
    } catch (error: any) {
      console.error("Error creating assessment:", error.message);
      throw error;
    }
  },

  async findByStartup(startup_id: number | string) {
    try {
      return await sql`
        SELECT a.*,
          COALESCE((SELECT count(*)::int FROM mcq_questions WHERE assessment_id = a.id), 0) as question_count,
          COALESCE((SELECT count(*)::int FROM candidate_assessments WHERE assessment_id = a.id), 0) as candidate_count
        FROM assessments a
        WHERE a.startup_id::text = ${String(startup_id)}
        ORDER BY a.created_at DESC
      `;
    } catch (error: any) {
      try {
        // Best-effort self-heal for environments missing assessment tables.
        await this.createTable();
        return await sql`
          SELECT a.*, 0 as question_count, 0 as candidate_count
          FROM assessments a
          WHERE a.startup_id::text = ${String(startup_id)}
          ORDER BY a.created_at DESC
        `;
      } catch (retryError: any) {
        console.error("findByStartup failed:", error?.message || error, "retry:", retryError?.message || retryError);
        // Keep API stable for UI by returning an empty list instead of bubbling an internal error.
        return [];
      }
    }
  },

  async findById(id: number | string) {
    try {
      const result = await sql`
        SELECT a.*,
          COALESCE((SELECT count(*)::int FROM mcq_questions WHERE assessment_id = a.id), 0) as question_count
        FROM assessments a
        WHERE a.id = ${id}
      `;
      return result[0] || null;
    } catch (_error) {
      const result = await sql`
        SELECT a.*, 0 as question_count
        FROM assessments a
        WHERE a.id = ${id}
      `;
      return result[0] || null;
    }
  },

  async update(id: number | string, { title, description, total_rounds, rounds, is_active, field }: any) {
    const result = await sql`
      UPDATE assessments
      SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        total_rounds = COALESCE(${total_rounds}, total_rounds),
        rounds = COALESCE(${rounds ? JSON.stringify(rounds) : null}, rounds),
        is_active = COALESCE(${is_active}, is_active),
        field = COALESCE(${field}, field),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async delete(id: number | string) {
    const result = await sql`DELETE FROM assessments WHERE id = ${id} RETURNING id`;
    return result[0];
  },

  async addQuestion({ assessment_id, question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation }: any) {
    try {
      const optionsStr = Array.isArray(options) ? JSON.stringify(options) : options || "[]";
      const result = await query(
        `INSERT INTO mcq_questions (assessment_id, question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
        RETURNING *`,
        [
          assessment_id,
          question || "",
          question_type || "multiple_choice",
          domain || null,
          difficulty || "medium",
          optionsStr,
          correct_answer ?? 0,
          points || 1,
          time_limit || 60,
          explanation || null,
        ]
      );
      return result[0];
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes('column "') && message.includes('does not exist')) {
        await this.ensureMcqQuestionColumns();

        const optionsStr = Array.isArray(options) ? JSON.stringify(options) : options || "[]";
        const retry = await query(
          `INSERT INTO mcq_questions (assessment_id, question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
          RETURNING *`,
          [
            assessment_id,
            question || "",
            question_type || "multiple_choice",
            domain || null,
            difficulty || "medium",
            optionsStr,
            correct_answer ?? 0,
            points || 1,
            time_limit || 60,
            explanation || null,
          ]
        );
        return retry[0];
      }
      console.error("Error adding question:", error.message);
      throw error;
    }
  },

  async getQuestions(assessment_id: number | string) {
    return await sql`
      SELECT * FROM mcq_questions
      WHERE assessment_id = ${assessment_id}
      ORDER BY id ASC
    `;
  },

  async updateQuestion(id: number | string, { question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation }: any) {
    const result = await sql`
      UPDATE mcq_questions
      SET
        question = COALESCE(${question}, question),
        question_type = COALESCE(${question_type}, question_type),
        domain = COALESCE(${domain}, domain),
        difficulty = COALESCE(${difficulty}, difficulty),
        options = COALESCE(${options ? JSON.stringify(options) : null}, options),
        correct_answer = COALESCE(${correct_answer}, correct_answer),
        points = COALESCE(${points}, points),
        time_limit = COALESCE(${time_limit}, time_limit),
        explanation = COALESCE(${explanation}, explanation)
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async deleteQuestion(id: number | string) {
    const result = await sql`DELETE FROM mcq_questions WHERE id = ${id} RETURNING id`;
    return result[0];
  },

  async bulkAddQuestions(assessment_id: number | string, questions: any[]) {
    const results = [];
    for (const q of questions) {
      try {
        const result = await this.addQuestion({
          assessment_id,
          question: q.question,
          question_type: q.question_type,
          domain: q.domain,
          difficulty: q.difficulty,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          time_limit: q.time_limit,
          explanation: q.explanation,
        });
        results.push(result);
      } catch (error: any) {
        console.error("Error adding individual question:", error.message);
        throw error;
      }
    }
    return results;
  },

  async assignToCandidate({ assessment_id, application_id, student_id }: any) {
    const result = await sql`
      INSERT INTO candidate_assessments (assessment_id, application_id, student_id)
      VALUES (${assessment_id}, ${application_id}, ${student_id})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    return result[0];
  },

  async getCandidateAssessment(application_id: number | string, assessment_id: number | string) {
    const result = await sql`
      SELECT * FROM candidate_assessments
      WHERE application_id = ${application_id} AND assessment_id = ${assessment_id}
    `;
    return result[0] || null;
  },

  async updateCandidateProgress(id: number | string, { current_round, status, mcq_score, mcq_total, mcq_completed_at, coding_score, coding_completed_at, interview_score, interview_completed_at, overall_result, completed_at }: any) {
    const result = await sql`
      UPDATE candidate_assessments
      SET
        current_round = COALESCE(${current_round}, current_round),
        status = COALESCE(${status}, status),
        mcq_score = COALESCE(${mcq_score}, mcq_score),
        mcq_total = COALESCE(${mcq_total}, mcq_total),
        mcq_completed_at = COALESCE(${mcq_completed_at}, mcq_completed_at),
        coding_score = COALESCE(${coding_score}, coding_score),
        coding_completed_at = COALESCE(${coding_completed_at}, coding_completed_at),
        interview_score = COALESCE(${interview_score}, interview_score),
        interview_completed_at = COALESCE(${interview_completed_at}, interview_completed_at),
        overall_result = COALESCE(${overall_result}, overall_result),
        completed_at = COALESCE(${completed_at}, completed_at)
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async saveResponse({ candidate_assessment_id, question_id, selected_option, is_correct, time_taken }: any) {
    const result = await sql`
      INSERT INTO mcq_responses (candidate_assessment_id, question_id, selected_option, is_correct, time_taken)
      VALUES (${candidate_assessment_id}, ${question_id}, ${selected_option}, ${is_correct}, ${time_taken})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    return result[0];
  },

  async getResponses(candidate_assessment_id: number | string) {
    return await sql`
      SELECT r.*, q.question, q.options, q.correct_answer, q.points
      FROM mcq_responses r
      JOIN mcq_questions q ON q.id = r.question_id
      WHERE r.candidate_assessment_id = ${candidate_assessment_id}
      ORDER BY r.answered_at ASC
    `;
  },
};

export default AssessmentModel;
