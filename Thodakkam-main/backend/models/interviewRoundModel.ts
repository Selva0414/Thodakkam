import { query } from "../config/database";

/**
 * Create interview rounds for an interview
 */
const createRounds = async (interviewId: number | string, rounds: any[]) => {
  const results = [];
  for (const round of rounds) {
    const sqlQuery = `
      INSERT INTO interview_rounds (interview_id, round_type, round_order, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (interview_id, round_order) DO UPDATE
        SET round_type = EXCLUDED.round_type, notes = EXCLUDED.notes, updated_at = NOW()
      RETURNING *;
    `;
    const rows = await query(sqlQuery, [interviewId, round.round_type, round.round_order, round.notes || null]);
    results.push(rows[0]);
  }
  return results;
};

/** Get all rounds for an interview, ordered by round_order */
const getRoundsByInterview = async (interviewId: number | string) => {
  const sqlQuery = `
    SELECT * FROM interview_rounds
    WHERE interview_id = $1
    ORDER BY round_order ASC;
  `;
  return await query(sqlQuery, [interviewId]);
};

/** Get a single round by its ID */
const getRoundById = async (roundId: number | string) => {
  const sqlQuery = `SELECT * FROM interview_rounds WHERE id = $1;`;
  const rows = await query(sqlQuery, [roundId]);
  return rows[0] || null;
};

/** Update the status of a round */
const updateRoundStatus = async (roundId: number | string, status: string) => {
  const sqlQuery = `
    UPDATE interview_rounds
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const rows = await query(sqlQuery, [roundId, status]);
  return rows[0] || null;
};

/** Set meet link on a round */
const setMeetLink = async (roundId: number | string, meetLink: string) => {
  const sqlQuery = `
    UPDATE interview_rounds
    SET meet_link = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const rows = await query(sqlQuery, [roundId, meetLink]);
  return rows[0] || null;
};

/**
 * Check if the candidate can proceed to a given round_order (sequential enforcement).
 * All previous rounds must have status = 'passed'.
 */
const canProceedToRound = async (interviewId: number | string, targetRoundOrder: number) => {
  if (targetRoundOrder <= 1) return true; // First round, always OK

  const sqlQuery = `
    SELECT COUNT(*) AS pending_count
    FROM interview_rounds
    WHERE interview_id = $1
      AND round_order < $2
      AND status != 'passed';
  `;
  const rows = await query(sqlQuery, [interviewId, targetRoundOrder]);
  return parseInt(rows[0].pending_count, 10) === 0;
};

/** Record progress for a candidate on a round */
const recordProgress = async (
  roundId: number | string,
  candidateId: number | string,
  candidateType: string,
  score: number,
  feedback: string
) => {
  const sqlQuery = `
    INSERT INTO interview_round_progress (interview_round_id, candidate_id, candidate_type, score, feedback, completed_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *;
  `;
  const rows = await query(sqlQuery, [roundId, candidateId, candidateType, score, feedback]);
  return rows[0];
};

export {
  createRounds,
  getRoundsByInterview,
  getRoundById,
  updateRoundStatus,
  setMeetLink,
  canProceedToRound,
  recordProgress,
};
