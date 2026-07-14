import { Request, Response } from "express";
import AssessmentModel from "../models/assessmentModel";
import * as ApplicationModel from "../models/applicationModel";
import NotificationModel from "../models/notificationModel";
import { query } from "../config/database";
import { resolveStageFromStatus } from "../utils/applicationStage";
import axios from "axios";
import { sendMCQScheduleEmail, sendInterviewScheduleEmail } from "../services/emailService";

// ── Render AI service URLs (hardcoded) ──────────────────────────────────────
const MCQ_AGENT_URL  = "https://mcq-agent.onrender.com";
const MCQ_TIMEOUT_MS = 30000; // 30 s — generous for Render cold-starts


const DOMAIN_QUESTIONS: Record<string, any[]> = {
  frontend: [
    { question: "What is the virtual DOM in React?", options: ["A direct representation of the actual DOM", "A lightweight copy of the real DOM", "A database for storing DOM elements", "A CSS framework"], correct_answer: 1, difficulty: "easy", explanation: "The virtual DOM is a lightweight JavaScript representation of the real DOM that React uses to optimize updates." },
    { question: "Which CSS property is used for flexbox layouts?", options: ["display: block", "display: flex", "display: grid", "display: inline"], correct_answer: 1, difficulty: "easy", explanation: "display: flex enables flexbox layout on a container element." },
    { question: "What is the purpose of useEffect hook in React?", options: ["To manage state", "To handle side effects", "To create components", "To style components"], correct_answer: 1, difficulty: "medium", explanation: "useEffect is used to perform side effects like data fetching, subscriptions, or DOM manipulation." },
    { question: "What does CSS specificity determine?", options: ["The loading order of stylesheets", "Which CSS rule takes precedence", "The color of elements", "Browser compatibility"], correct_answer: 1, difficulty: "medium", explanation: "CSS specificity determines which styles are applied when multiple rules target the same element." },
    { question: "What is React's Context API used for?", options: ["Database connections", "State management across components without prop drilling", "API calls", "CSS styling"], correct_answer: 1, difficulty: "medium", explanation: "Context API provides a way to pass data through the component tree without manually passing props." }
  ],
  backend: [
    { question: "What is REST in API design?", options: ["A programming language", "An architectural style for web services", "A database type", "A testing framework"], correct_answer: 1, difficulty: "easy", explanation: "REST (Representational State Transfer) is an architectural style for designing networked applications." },
    { question: "What HTTP method is typically used to update a resource?", options: ["GET", "POST", "PUT/PATCH", "DELETE"], correct_answer: 2, difficulty: "easy", explanation: "PUT replaces the entire resource while PATCH partially updates it." },
    { question: "What is middleware in Express.js?", options: ["A database", "Functions that execute during the request-response cycle", "A frontend framework", "A testing tool"], correct_answer: 1, difficulty: "medium", explanation: "Middleware functions have access to request and response objects and can modify them or end the request-response cycle." },
    { question: "What is SQL injection?", options: ["A database optimization technique", "A security vulnerability in database queries", "A type of JOIN operation", "A backup method"], correct_answer: 1, difficulty: "medium", explanation: "SQL injection is a code injection technique that exploits security vulnerabilities in database queries." },
    { question: "What is the purpose of JWT (JSON Web Token)?", options: ["Database storage", "Secure information transmission between parties", "CSS styling", "File compression"], correct_answer: 1, difficulty: "medium", explanation: "JWT is used for securely transmitting information between parties as a JSON object." }
  ],
  fullstack: [
    { question: "What is the purpose of CORS?", options: ["CSS styling", "Database management", "Cross-origin resource sharing security", "JavaScript compilation"], correct_answer: 2, difficulty: "medium", explanation: "CORS is a security feature that controls how resources can be requested from different origins." },
    { question: "What is the difference between localStorage and sessionStorage?", options: ["No difference", "localStorage persists after browser close, sessionStorage doesn't", "sessionStorage is faster", "localStorage is more secure"], correct_answer: 1, difficulty: "easy", explanation: "localStorage data persists even after the browser is closed, while sessionStorage is cleared when the session ends." },
    { question: "What does MVC stand for?", options: ["Model-View-Controller", "Main-Variable-Class", "Module-Visual-Component", "Memory-Value-Cache"], correct_answer: 0, difficulty: "easy", explanation: "MVC is a software design pattern that separates application logic into Model, View, and Controller." },
    { question: "What is the purpose of environment variables?", options: ["Styling applications", "Storing configuration outside the codebase", "Database queries", "Unit testing"], correct_answer: 1, difficulty: "easy", explanation: "Environment variables store configuration that may vary between deployments, keeping sensitive data out of code." },
    { question: "What is WebSocket used for?", options: ["Static file serving", "Full-duplex real-time communication", "Database connections", "CSS preprocessing"], correct_answer: 1, difficulty: "medium", explanation: "WebSocket provides a persistent connection for real-time, bidirectional communication between client and server." }
  ],
  data_science: [
    { question: "What is the purpose of pandas in Python?", options: ["Web development", "Data manipulation and analysis", "Machine learning models", "GUI development"], correct_answer: 1, difficulty: "easy", explanation: "pandas is a Python library used for data manipulation and analysis, providing data structures like DataFrame." },
    { question: "What is overfitting in machine learning?", options: ["Model performs well on all data", "Model performs well on training but poorly on test data", "Model is too simple", "Model trains too fast"], correct_answer: 1, difficulty: "medium", explanation: "Overfitting occurs when a model learns training data too well, including noise, leading to poor generalization." },
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Question Language", "Standard Query Logic", "System Query Language"], correct_answer: 0, difficulty: "easy", explanation: "SQL stands for Structured Query Language, used for managing relational databases." },
    { question: "What is the purpose of data normalization?", options: ["Making data look normal", "Scaling data to a standard range", "Deleting outliers", "Increasing data size"], correct_answer: 1, difficulty: "medium", explanation: "Normalization scales numeric data to a standard range, often improving algorithm performance." },
    { question: "What is a confusion matrix used for?", options: ["Data visualization", "Evaluating classification model performance", "Data cleaning", "Feature selection"], correct_answer: 1, difficulty: "medium", explanation: "A confusion matrix shows the performance of a classification model by comparing predicted vs actual values." }
  ],
  mobile: [
    { question: "What is React Native primarily used for?", options: ["Web development", "Cross-platform mobile app development", "Desktop applications", "Database management"], correct_answer: 1, difficulty: "easy", explanation: "React Native is a framework for building native mobile apps using React and JavaScript." },
    { question: "What is the main advantage of Flutter?", options: ["Only works on iOS", "Single codebase for multiple platforms", "Requires native code only", "Web development only"], correct_answer: 1, difficulty: "easy", explanation: "Flutter allows building natively compiled applications for mobile, web, and desktop from a single codebase." },
    { question: "What is an APK file?", options: ["iOS application package", "Android application package", "A programming language", "A database file"], correct_answer: 1, difficulty: "easy", explanation: "APK (Android Package Kit) is the file format used to distribute and install Android applications." },
    { question: "What is the purpose of AsyncStorage in React Native?", options: ["Network requests", "Persistent local storage", "UI rendering", "Navigation"], correct_answer: 1, difficulty: "medium", explanation: "AsyncStorage is a simple, unencrypted, asynchronous key-value storage system in React Native." },
    { question: "What does 'hot reloading' mean in mobile development?", options: ["App crashes", "Instantly see code changes without full rebuild", "Deleting cache", "Installing updates"], correct_answer: 1, difficulty: "easy", explanation: "Hot reloading allows developers to see changes in real-time without recompiling the entire application." }
  ]
};

AssessmentModel.createTable().then(() => {
  console.log("Assessment tables initialized");
}).catch((err: any) => {
  console.error("Failed to initialize assessment tables:", err.message);
});

export async function createAssessment(req: Request, res: Response): Promise<any> {
  try {
    const { title, description, total_rounds, rounds, field } = req.body;
    if (!title || !rounds || !Array.isArray(rounds)) return res.status(400).json({ error: "Title and rounds are required" });
    if (!(req as any).user || !(req as any).user.id) return res.status(401).json({ error: "User not authenticated" });

    const assessment = await AssessmentModel.create({
      startup_id: (req as any).user.id,
      title,
      description,
      total_rounds: total_rounds || rounds.length,
      rounds,
      field
    });
    res.status(201).json({ success: true, assessment });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create assessment: " + err.message });
  }
}

export async function getAssessments(req: Request, res: Response): Promise<any> {
  try {
    const assessments = await AssessmentModel.findByStartup((req as any).user.id);
    res.json({ success: true, assessments });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
}

export async function getAssessment(req: Request, res: Response): Promise<any> {
  try {
    const assessment = await AssessmentModel.findById(String(req.params.id));
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const questions = await AssessmentModel.getQuestions(String(req.params.id));
    res.json({ success: true, assessment, questions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
}

export async function updateAssessment(req: Request, res: Response): Promise<any> {
  try {
    const { title, description, total_rounds, rounds, is_active, field } = req.body;
    const assessmentId = String(req.params.id);
    const startupId = String((req as any).user?.id || "").trim();
    const assessment = await AssessmentModel.update(assessmentId, { title, description, total_rounds, rounds, is_active, field });
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    // When assessment has an interview round, sync status & interview rows for all assigned candidates
    try {
      const roundsList = Array.isArray(rounds) ? rounds : [];
      const interviewRound = roundsList.find((r: any) => r.type === 'interview');
      const assignedCandidates = await query(
        `SELECT ca.application_id FROM candidate_assessments ca WHERE ca.assessment_id::text = $1::text AND ca.application_id IS NOT NULL`,
        [assessmentId]
      );

      if (interviewRound) {
        let schedDate = interviewRound.scheduledDate || interviewRound.scheduled_date || null;
        let schedTime = interviewRound.scheduledTime || interviewRound.scheduled_time || null;
        const meetLink = interviewRound.meetingLink || interviewRound.meeting_link || null;
        const notes = interviewRound.interviewNotes || interviewRound.interview_notes || null;

        if (!schedDate && interviewRound.startTime) {
          try {
            const dt = new Date(interviewRound.startTime);
            if (!isNaN(dt.getTime())) {
              const y = dt.getUTCFullYear();
              const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
              const d = String(dt.getUTCDate()).padStart(2, '0');
              schedDate = `${y}-${m}-${d}`;

              let h = dt.getUTCHours();
              const min = String(dt.getUTCMinutes()).padStart(2, '0');
              const ampm = h >= 12 ? 'PM' : 'AM';
              h = h % 12;
              h = h ? h : 12;
              schedTime = `${String(h).padStart(2, '0')}:${min} ${ampm}`;
            }
          } catch (err: any) {
            console.error("Error parsing startTime in updateAssessment:", err.message);
          }
        }

        for (const row of assignedCandidates) {
          const appId = String(row.application_id);
          // Update application status to interview_scheduled
          await ApplicationModel.updateStatus(appId, 'interview_scheduled');

          if (startupId) {
            const appRows = await query(`SELECT job_id FROM applications WHERE id::text = $1::text`, [appId]);
            const jobId = appRows[0]?.job_id || null;

            // Upsert: update existing or create new interview row
            const existing = await query(
              `SELECT id FROM interviews WHERE application_id::text = $1::text AND startup_id = $2 LIMIT 1`,
              [appId, startupId]
            );
            if (existing.length > 0) {
              await query(
                `UPDATE interviews SET scheduled_date = $1, time_slot = $2, meet_link = $3, notes = $4, interview_type = $5, status = 'scheduled'
                 WHERE id = $6`,
                [schedDate, schedTime, meetLink, notes, interviewRound.name || 'Interview', existing[0].id]
              );
            } else {
              await query(
                `INSERT INTO interviews (application_id, startup_id, job_id, interview_type, platform, meet_link, scheduled_date, time_slot, notes, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')`,
                [appId, startupId, jobId, interviewRound.name || 'Interview', 'google_meet', meetLink, schedDate, schedTime, notes]
              );
            }

            // Fetch student name, registered email, company name, and job title to trigger instant email
            try {
              const appInfoRows = await query(
                `SELECT a.student_id, a.candidate_name, a.candidate_email, j.title AS job_title, s.company_name
                 FROM applications a
                 LEFT JOIN jobs j ON j.id::text = a.job_id::text
                 LEFT JOIN startups s ON s.id::text = COALESCE(a.startup_id::text, $2)
                 WHERE a.id::text = $1 LIMIT 1`,
                [appId, startupId]
              );

              const studentInfo = appInfoRows[0];
              if (studentInfo) {
                let studentName = studentInfo.candidate_name || "Student";
                let studentEmail = studentInfo.candidate_email;

                // Always prefer registered email from students table
                if (studentInfo.student_id) {
                  const studentRows = await query(`SELECT name, email FROM students WHERE id::text = $1::text`, [String(studentInfo.student_id)]);
                  if (studentRows[0]) {
                    studentName = studentRows[0].name || studentName;
                    studentEmail = studentRows[0].email || studentEmail;
                  }
                }

                // If scheduled details exist, send the interview email immediately
                if (studentEmail && schedDate && schedTime) {
                  sendInterviewScheduleEmail(
                    studentEmail,
                    studentName,
                    studentInfo.company_name || "A Startup",
                    studentInfo.job_title || "Role",
                    schedDate,
                    schedTime,
                    meetLink || undefined
                  ).catch((err: any) => {
                    console.error("Failed to send Interview email from updateAssessment:", err.message);
                  });
                }
              }
            } catch (emailErr: any) {
              console.error("Failed to fetch information or send email in updateAssessment:", emailErr.message);
            }
          }
        }
      } else {
        // They removed the interview round. Cleanup any scheduled interviews.
        for (const row of assignedCandidates) {
          const appId = String(row.application_id);
          await query(`DELETE FROM interviews WHERE application_id::text = $1::text AND startup_id = $2`, [appId, startupId]);
          const appRows = await query(`SELECT status FROM applications WHERE id::text = $1::text`, [appId]);
          if (appRows.length > 0 && appRows[0].status === 'interview_scheduled') {
            await ApplicationModel.updateStatus(appId, 'shortlisted');
          }
        }
      }
    } catch (syncErr: any) {
      console.error("[updateAssessment] Interview sync error:", syncErr.message);
    }

    res.json({ success: true, assessment });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update assessment" });
  }
}

export async function deleteAssessment(req: Request, res: Response): Promise<any> {
  try {
    const startupId = String((req as any).user?.id || "").trim();
    if (!startupId) return res.status(401).json({ error: "User not authenticated" });

    const assessmentId = String(req.params.id);
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    if (String((assessment as any).startup_id || "") !== startupId) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const appRows = await query(
      `SELECT DISTINCT application_id FROM candidate_assessments WHERE assessment_id = $1 AND application_id IS NOT NULL AND TRIM(application_id::text) <> ''`,
      [Number(assessmentId)]
    );
    const appIds = appRows.map((r: any) => String(r.application_id)).filter(Boolean);

    const delResult = await query(
      `DELETE FROM assessments WHERE id = $1 AND startup_id::text = $2::text RETURNING id`,
      [Number(assessmentId), startupId]
    );
    if (!delResult.length) return res.status(404).json({ error: "Assessment not found" });

    if (appIds.length > 0) {
      const apps = await query(`SELECT id, status FROM applications WHERE id::text = ANY($1::text[])`, [appIds]);
      for (const row of apps) {
        const stage = resolveStageFromStatus(String((row as any).status || "new"));
        await query(`UPDATE applications SET stage = $1, updated_at = NOW() WHERE id::text = $2::text`, [
          stage,
          String((row as any).id),
        ]);
      }
    }

    res.json({ success: true, message: "Assessment deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete assessment" });
  }
}

export async function addQuestion(req: Request, res: Response): Promise<any> {
  try {
    const { question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation } = req.body;
    if (!question || !options || correct_answer === undefined) return res.status(400).json({ error: "Question, options, and correct_answer are required" });

    const mcqQuestion = await AssessmentModel.addQuestion({
      assessment_id: parseInt(String(req.params.id), 10),
      question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation
    });
    res.status(201).json({ success: true, question: mcqQuestion });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add question" });
  }
}

export async function getQuestions(req: Request, res: Response): Promise<any> {
  try {
    const questions = await AssessmentModel.getQuestions(String(req.params.id));
    res.json({ success: true, questions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
}

export async function updateQuestion(req: Request, res: Response): Promise<any> {
  try {
    const { question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation } = req.body;
    const updated = await AssessmentModel.updateQuestion(String(req.params.questionId), {
      question, question_type, domain, difficulty, options, correct_answer, points, time_limit, explanation
    });
    if (!updated) return res.status(404).json({ error: "Question not found" });
    res.json({ success: true, question: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update question" });
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<any> {
  try {
    const result = await AssessmentModel.deleteQuestion(String(req.params.questionId));
    if (!result) return res.status(404).json({ error: "Question not found" });
    res.json({ success: true, message: "Question deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete question" });
  }
}

export async function generateDomainQuestions(req: Request, res: Response): Promise<any> {
  const { domain, count, difficulty, job_description } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain is required" });

  const numQuestions = Math.min(Number(count) || 5, 20);
  const difficultyLevel = difficulty || "medium";

  // Build a domain-based job description if caller didn't supply one
  const domainDescriptions: Record<string, string> = {
    frontend:     "We are hiring a Frontend Developer skilled in React, TypeScript, CSS, and browser APIs.",
    backend:      "We are hiring a Backend Developer skilled in Node.js, REST APIs, SQL databases, and security.",
    fullstack:    "We are hiring a Full Stack Developer skilled in React, Node.js, PostgreSQL, and REST APIs.",
    data_science: "We are hiring a Data Scientist skilled in Python, pandas, machine learning, and SQL.",
    mobile:       "We are hiring a Mobile Developer skilled in React Native, Flutter, and cross-platform development.",
  };
  const domainKey = domain.toLowerCase().replace(/\s+/g, "_");
  const jd = job_description ||
    domainDescriptions[domainKey] ||
    `We are hiring a ${domain} developer with strong programming and problem-solving skills.`;

  // ── Try MCQ Agent Render API ──────────────────────────────────────────────
  try {
    console.log(`[MCQ-Agent] Calling ${MCQ_AGENT_URL}/generate-mcq for domain="${domain}" count=${numQuestions}`);
    const resp = await axios.post(
      `${MCQ_AGENT_URL}/generate-mcq`,
      { job_description: jd, num_questions: numQuestions, difficulty: difficultyLevel },
      { timeout: MCQ_TIMEOUT_MS, headers: { "Content-Type": "application/json" } }
    );

    const mcqs: any[] = resp.data?.mcqs || [];
    if (mcqs.length > 0) {
      // Normalize API response → existing question format
      const questions = mcqs.map((mcq: any) => {
        const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];
        // API returns answer as the correct option TEXT — find its index
        const correctText = String(mcq.answer || "").trim().toLowerCase();
        let correct_answer = options.findIndex(
          (o: string) => String(o).trim().toLowerCase() === correctText
        );
        if (correct_answer === -1) correct_answer = 0; // safe fallback

        return {
          question:       mcq.question,
          options,
          correct_answer,
          difficulty:     difficultyLevel,
          explanation:    mcq.explanation || "",
          source:         "ai",
        };
      });

      console.log(`[MCQ-Agent] ✅ Generated ${questions.length} questions via AI`);
      return res.json({ success: true, questions, domain, source: "ai" });
    }
  } catch (aiErr: any) {
    console.warn(`[MCQ-Agent] API failed (${aiErr.message}), falling back to static questions`);
  }

  // ── Fallback: static question bank ───────────────────────────────────────
  const availableQuestions = DOMAIN_QUESTIONS[domainKey] || DOMAIN_QUESTIONS.fullstack;
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, Math.min(numQuestions, availableQuestions.length));

  res.json({ success: true, questions: selectedQuestions, domain, source: "static" });
}

export async function bulkAddQuestions(req: Request, res: Response): Promise<any> {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: "Questions array is required" });

    const results = await AssessmentModel.bulkAddQuestions(String(req.params.id), questions);
    res.status(201).json({ success: true, questions: results });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add questions: " + err.message });
  }
}

export async function assignToCandidate(req: Request, res: Response): Promise<any> {
  try {
    const assessment_id = parseInt(String(req.body?.assessmentId || req.body?.assessment_id || req.params.id), 10);
    const { application_id, student_id, studentId, applicationId, jobId } = req.body;
    const final_student_id = student_id || studentId;
    const final_application_id = application_id || applicationId || jobId;

    console.log(`[AssignAssessment] Storing student_id=${final_student_id}, assessment_id=${assessment_id}, application_id=${final_application_id}`);

    if (!assessment_id || !final_student_id) {
      return res.status(400).json({ error: "Assessment ID and Student ID are required" });
    }

    const candidateAssessment = await AssessmentModel.assignToCandidate({
      assessment_id,
      application_id: final_application_id,
      student_id: final_student_id
    });

    // If assessment has an interview round, update application status to interview_scheduled
    // and create an interviews row if scheduled details exist
    try {
      const assessment = await AssessmentModel.findById(String(assessment_id));
      const rounds = Array.isArray(assessment?.rounds) ? assessment.rounds : [];
      const interviewRound = rounds.find((r: any) => r.type === 'interview');
      if (interviewRound && final_application_id) {
        // Update application status so it shows in the Interviewing tab
        await ApplicationModel.updateStatus(final_application_id, 'interview_scheduled');

        // If the round has schedule details, create/update an interviews row
        let schedDate = interviewRound.scheduledDate || interviewRound.scheduled_date || null;
        let schedTime = interviewRound.scheduledTime || interviewRound.scheduled_time || null;
        const meetLink = interviewRound.meetingLink || interviewRound.meeting_link || null;
        const startupId = String((req as any).user?.id || '');

        if (!schedDate && interviewRound.startTime) {
          try {
            const dt = new Date(interviewRound.startTime);
            if (!isNaN(dt.getTime())) {
              const y = dt.getUTCFullYear();
              const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
              const d = String(dt.getUTCDate()).padStart(2, '0');
              schedDate = `${y}-${m}-${d}`;

              let h = dt.getUTCHours();
              const min = String(dt.getUTCMinutes()).padStart(2, '0');
              const ampm = h >= 12 ? 'PM' : 'AM';
              h = h % 12;
              h = h ? h : 12;
              schedTime = `${String(h).padStart(2, '0')}:${min} ${ampm}`;
            }
          } catch (err: any) {
            console.error("Error parsing startTime in assignToCandidate:", err.message);
          }
        }

        if (startupId) {
          // Look up the job_id from the application
          const appRows = await query(`SELECT job_id FROM applications WHERE id::text = $1::text`, [String(final_application_id)]);
          const jobId = appRows[0]?.job_id || null;

          // Avoid duplicate interview rows
          const existing = await query(
            `SELECT id FROM interviews WHERE application_id::text = $1::text AND startup_id = $2 LIMIT 1`,
            [String(final_application_id), startupId]
          );
          if (existing.length === 0) {
            await query(
              `INSERT INTO interviews (application_id, startup_id, job_id, interview_type, platform, meet_link, scheduled_date, time_slot, notes, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')`,
              [
                String(final_application_id),
                startupId,
                jobId,
                interviewRound.name || 'Interview',
                'google_meet',
                meetLink,
                schedDate,
                schedTime,
                interviewRound.interviewNotes || interviewRound.interview_notes || null,
              ]
            );
          } else {
            await query(
              `UPDATE interviews SET scheduled_date = $1, time_slot = $2, meet_link = $3, notes = $4, interview_type = $5, status = 'scheduled'
               WHERE id = $6`,
              [
                schedDate,
                schedTime,
                meetLink,
                interviewRound.interviewNotes || interviewRound.interview_notes || null,
                interviewRound.name || 'Interview',
                existing[0].id
              ]
            );
          }
        }
      }
    } catch (statusErr: any) {
      console.error("[AssignAssessment] Status/interview sync error:", statusErr.message);
    }

    try {
      const assessment = await AssessmentModel.findById(String(assessment_id));
      const startupRows = await query(`SELECT company_name FROM startups WHERE id = $1`, [(req as any).user.id]);
      const companyName = startupRows[0]?.company_name || "A company";

      const studentRows = await query(`SELECT name, email FROM students WHERE id::text = $1::text`, [String(final_student_id)]);
      const studentInfo = studentRows[0];
      const studentName = studentInfo?.name || "Student";
      const studentEmail = studentInfo?.email;

      let jobName = "";
      if (final_application_id) {
        try {
          const appResult = await query(
            `SELECT a.role_applied, j.title AS job_title 
             FROM applications a 
             LEFT JOIN jobs j ON j.id::text = a.job_id::text 
             WHERE a.id::text = $1 LIMIT 1`,
            [String(final_application_id)]
          );
          if (appResult[0]) {
            jobName = appResult[0].job_title || appResult[0].role_applied || "";
          }
        } catch (jobErr: any) {
          console.error("Failed to query job name for assessment email:", jobErr.message);
        }
      }

      await (NotificationModel as any).createTable();
      const studentNotification = await (NotificationModel as any).createNotification({
        student_id: final_student_id,
        title: "Assessment Assigned! 📝",
        message: `${companyName} has assigned you an assessment: "${assessment?.title || 'Assessment'}". Complete it to proceed with your application.`,
        type: "assessment_assigned",
        link: `/student/assessments`,
      });

      const io = req.app.get("io");
      if (io && studentNotification) {
        io.to(`${final_student_id}_student`).emit("new_notification", {
          notification: studentNotification,
          unreadCount: await (NotificationModel as any).getUnreadCount(final_student_id),
        });
      }

      // Create startup notification
      const startupId = (req as any).user.id;
      const startupNotification = await NotificationModel.createStartupNotification({
        startup_id: startupId,
        title: "Assessment Assigned",
        message: `You have assigned the assessment "${assessment?.title || 'Assessment'}" to ${studentName}.`,
        type: "assessment_assigned",
        link: `/startup/candidates`
      });

      if (io && startupNotification) {
        io.to(`${startupId}_startup`).emit("new_notification", {
          notification: startupNotification,
          unreadCount: await NotificationModel.getStartupUnreadCount(startupId),
        });
      }

      // Send email alert to student
      if (studentEmail) {
        sendMCQScheduleEmail(studentEmail, studentName, companyName, assessment?.title || "Assessment", jobName).catch((err) => {
          console.error("Failed to send MCQ email alert:", err.message);
        });

        // If assessment has an interview round and it has scheduled details, send interview email immediately
        const rounds = Array.isArray(assessment?.rounds) ? assessment.rounds : [];
        const interviewRound = rounds.find((r: any) => r.type === 'interview');
        if (interviewRound) {
          let schedDate = interviewRound.scheduledDate || interviewRound.scheduled_date || null;
          let schedTime = interviewRound.scheduledTime || interviewRound.scheduled_time || null;
          const meetLink = interviewRound.meetingLink || interviewRound.meeting_link || null;

          if (!schedDate && interviewRound.startTime) {
            try {
              const dt = new Date(interviewRound.startTime);
              if (!isNaN(dt.getTime())) {
                const y = dt.getUTCFullYear();
                const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
                const d = String(dt.getUTCDate()).padStart(2, '0');
                schedDate = `${y}-${m}-${d}`;

                let h = dt.getUTCHours();
                const min = String(dt.getUTCMinutes()).padStart(2, '0');
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                h = h ? h : 12;
                schedTime = `${String(h).padStart(2, '0')}:${min} ${ampm}`;
              }
            } catch {}
          }

          if (schedDate && schedTime) {
            sendInterviewScheduleEmail(
              studentEmail,
              studentName,
              companyName,
              jobName || "Role",
              schedDate,
              schedTime,
              meetLink || undefined
            ).catch((err) => {
              console.error("Failed to send Interview email from assignToCandidate:", err.message);
            });
          }
        }
      }
    } catch (notifErr: any) {
      console.error("Notification/Email error:", notifErr.message);
    }

    res.status(201).json({ success: true, candidateAssessment });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to assign assessment" });
  }
}

export async function getDomains(req: Request, res: Response): Promise<any> {
  try {
    const domains = Object.keys(DOMAIN_QUESTIONS).map((key) => ({
      key,
      name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      questionCount: DOMAIN_QUESTIONS[key].length
    }));
    res.json({ success: true, domains });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
}

export async function getAssessmentReport(req: Request, res: Response): Promise<any> {
  try {
    const startupId = String((req as any).user?.id);
    const assessmentId = parseInt(String(req.params.id), 10);
    if (!startupId) return res.status(401).json({ error: "Not authenticated" });

    // Verify assessment belongs to this startup
    const assessmentRows = await query(
      `SELECT * FROM assessments WHERE id = $1 AND startup_id::text = $2`,
      [assessmentId, startupId]
    );
    if (!assessmentRows.length) return res.status(404).json({ error: "Assessment not found" });

    const candidates = await query(
      `SELECT DISTINCT ON (ca.student_id) ca.id, ca.student_id, ca.status, ca.current_round,
              ca.mcq_score, ca.mcq_total, ca.coding_score, ca.interview_score,
              ca.ai_coding_score, ca.ai_coding_feedback, ca.submitted_code, ca.coding_language,
              ca.mcq_completed_at, ca.coding_completed_at, ca.completed_at, ca.created_at,
              ca.task_file, ca.task_completed_at,
              s.name AS student_name, s.email AS student_email
       FROM candidate_assessments ca
       LEFT JOIN students s ON s.id::text = ca.student_id::text
       WHERE ca.assessment_id = $1
       ORDER BY ca.student_id, ca.created_at DESC`,
      [assessmentId]
    );

    res.json({ success: true, assessment: assessmentRows[0], candidates });
  } catch (err: any) {
    console.error("getAssessmentReport error:", err.message);
    res.status(500).json({ error: "Failed to fetch assessment report" });
  }
}

/** GET /assessments/by-application/:applicationId
 *  Returns the assessment linked to a candidate's application (via candidate_assessments).
 *  First checks if THIS specific application has an assessment, then falls back to
 *  any assessment for the same job (so all candidates for the same job share the same assessment).
 */
export async function getAssessmentByApplication(req: Request, res: Response): Promise<any> {
  try {
    const startupId = String((req as any).user?.id || "").trim();
    const { applicationId } = req.params;
    if (!startupId) return res.status(401).json({ error: "Not authenticated" });
    if (!applicationId) return res.status(400).json({ error: "applicationId is required" });

    // 1. Check if this specific application already has an assessment assigned
    const directRows = await query(
      `SELECT a.id, a.title, a.description, a.rounds, a.total_rounds, a.is_active,
              a.created_at, a.updated_at,
              ca.status AS candidate_status, ca.current_round
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       WHERE ca.application_id::text = $1::text
         AND a.startup_id::text = $2::text
       ORDER BY ca.id DESC
       LIMIT 1`,
      [String(applicationId), startupId]
    );

    if (directRows.length > 0) {
      return res.json({ success: true, assessment: directRows[0] });
    }

    // 2. Fall back: find the assessment used for this job (via any other candidate)
    const jobRows = await query(
      `SELECT a.id, a.title, a.description, a.rounds, a.total_rounds, a.is_active,
              a.created_at, a.updated_at
       FROM assessments a
       JOIN candidate_assessments ca ON ca.assessment_id = a.id
       JOIN applications app ON app.id::text = ca.application_id::text
       WHERE app.job_id = (SELECT job_id FROM applications WHERE id::text = $1::text LIMIT 1)
         AND a.startup_id::text = $2::text
       ORDER BY ca.id DESC
       LIMIT 1`,
      [String(applicationId), startupId]
    );

    if (jobRows.length > 0) {
      return res.json({ success: true, assessment: jobRows[0] });
    }

    return res.status(404).json({ error: "No assessment found for this application or its job" });
  } catch (err: any) {
    console.error("[getAssessmentByApplication] error:", err.message);
    return res.status(500).json({ error: "Failed to fetch assessment for application" });
  }
}

/** GET /assessments/by-job/:jobId
 *  Returns the assessment created for a specific job (linked via candidate_assessments → applications).
 *  If no assessment has been assigned to any candidate of this job yet, returns 404
 *  so the frontend can redirect to /startup/assessments/create.
 */
export async function getAssessmentByJob(req: Request, res: Response): Promise<any> {
  try {
    const startupId = String((req as any).user?.id || "").trim();
    const { jobId } = req.params;
    if (!startupId) return res.status(401).json({ error: "Not authenticated" });
    if (!jobId) return res.status(400).json({ error: "jobId is required" });

    // Find the assessment that has been assigned to any candidate who applied to this job
    const rows = await query(
      `SELECT DISTINCT ON (a.id)
              a.id, a.title, a.description, a.rounds, a.total_rounds, a.is_active,
              a.created_at, a.updated_at
       FROM assessments a
       JOIN candidate_assessments ca ON ca.assessment_id = a.id
       JOIN applications app ON app.id::text = ca.application_id::text
       WHERE app.job_id::text = $1::text
         AND a.startup_id::text = $2::text
       ORDER BY a.id, a.created_at DESC
       LIMIT 1`,
      [String(jobId), startupId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No assessment found for this job" });
    }

    return res.json({ success: true, assessment: rows[0] });
  } catch (err: any) {
    console.error("[getAssessmentByJob] error:", err.message);
    return res.status(500).json({ error: "Failed to fetch assessment for job" });
  }
}

export async function fetchLeetcodeQuestion(req: Request, res: Response): Promise<any> {
  try {
    const { topic, difficulty, lang } = req.body;
    if (!topic || !difficulty) {
      return res.status(400).json({ error: "Topic and difficulty are required" });
    }

    const response = await axios.get("https://leetcode-scrapper-p6az.onrender.com/question", {
      params: { topic, difficulty, lang: lang || "python3" },
      timeout: 60000
    });

    return res.json({ success: true, question: response.data });
  } catch (err: any) {
    console.error("[LeetCode Proxy] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch question from LeetCode scraper: " + (err.response?.data?.detail || err.message) });
  }
}

