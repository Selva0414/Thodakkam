import { query } from "../config/database";

/**
 * When an interview is marked as completed, propagate the status changes 
 * to candidate_assessments and applications if it was the final round.
 */
export async function propagateInterviewCompletion(applicationId: string, interviewScore: number = 0) {
  try {
    if (!applicationId) return;

    // 1. Update candidate_assessments: mark interview done, check if assessment is now complete
    const caRows = await query(
      `SELECT ca.id, ca.assessment_id, ca.current_round, a.rounds, a.total_rounds
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       WHERE ca.application_id::text = $1::text
       ORDER BY ca.id DESC LIMIT 1`,
      [String(applicationId)]
    );

    if (caRows.length > 0) {
      const ca = caRows[0] as any;
      const rounds = Array.isArray(ca.rounds) ? ca.rounds : [];
      const totalRounds = ca.total_rounds || rounds.length;
      const currentRound = ca.current_round || 1;

      // Check if this was the last round
      const isLastRound = currentRound >= totalRounds;
      const newStatus = isLastRound ? 'completed' : 'in_progress';
      const nextRound = isLastRound ? currentRound : currentRound + 1;

      await query(
        `UPDATE candidate_assessments
         SET interview_score = $1, interview_completed_at = NOW(),
             status = $2, current_round = $3, updated_at = NOW()
         WHERE id = $4`,
        [interviewScore, newStatus, nextRound, ca.id]
      );

      // Update application stage if it's the final decision
      if (isLastRound) {
        await query(
          `UPDATE applications SET stage = 'selected', status = 'hired', updated_at = NOW()
           WHERE id::text = $1::text`,
          [String(applicationId)]
        );
      }
    } else {
      // No candidate_assessments record (interview scheduled directly) — advance pipeline
      await query(
        `UPDATE applications SET stage = 'selected', status = 'hired', updated_at = NOW()
         WHERE id::text = $1::text`,
        [String(applicationId)]
      );
    }
  } catch (err: any) {
    console.error('[propagateInterviewCompletion] Error:', err.message);
  }
}
