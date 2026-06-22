/**
 * Used by startup application list and interview scheduling to enforce:
 * MCQ + coding (when present) must be done before scheduling the interview round.
 */

export function computeCanScheduleInterview(
  ca: {
    status?: string;
    current_round?: number;
    mcq_completed_at?: unknown;
    coding_completed_at?: unknown;
    overall_result?: string | null;
  } | null | undefined,
  roundsRaw: unknown
): boolean {
  if (!ca) return true;
  if (String(ca.status || "").toLowerCase() === "rejected" || ca.overall_result === "mcq_failed") return false;
  let rounds: any[] = [];
  if (Array.isArray(roundsRaw)) rounds = roundsRaw;
  else if (typeof roundsRaw === "string") {
    try {
      const p = JSON.parse(roundsRaw);
      if (Array.isArray(p)) rounds = p;
    } catch {
      /* ignore */
    }
  }
  const interviewIdx = rounds.findIndex((r) => r && String(r.type).toLowerCase() === "interview");
  if (interviewIdx === -1) return true;
  const interviewRoundNum = interviewIdx + 1;
  const hasMcq = rounds.some((r) => r && String(r.type).toLowerCase() === "mcq");
  const hasCoding = rounds.some((r) => r && String(r.type).toLowerCase() === "coding");
  if (hasMcq && !ca.mcq_completed_at) return false;
  if (hasCoding && !ca.coding_completed_at) return false;
  const cr = Number(ca.current_round) || 1;
  return cr >= interviewRoundNum;
}

export function getScheduleInterviewBlockReason(
  ca: {
    status?: string;
    current_round?: number;
    mcq_completed_at?: unknown;
    coding_completed_at?: unknown;
    overall_result?: string | null;
  } | null | undefined,
  roundsRaw: unknown
): string | null {
  if (!ca) return null;
  if (String(ca.status || "").toLowerCase() === "rejected" || ca.overall_result === "mcq_failed") {
    return "Candidate did not pass an assessment round.";
  }
  let rounds: any[] = [];
  if (Array.isArray(roundsRaw)) rounds = roundsRaw;
  else if (typeof roundsRaw === "string") {
    try {
      const p = JSON.parse(roundsRaw);
      if (Array.isArray(p)) rounds = p;
    } catch {
      return null;
    }
  }
  const interviewIdx = rounds.findIndex((r) => r && String(r.type).toLowerCase() === "interview");
  if (interviewIdx === -1) return null;
  const interviewRoundNum = interviewIdx + 1;
  const hasMcq = rounds.some((r) => r && String(r.type).toLowerCase() === "mcq");
  const hasCoding = rounds.some((r) => r && String(r.type).toLowerCase() === "coding");
  if (hasMcq && !ca.mcq_completed_at) return "Waiting for the candidate to complete the MCQ assessment.";
  if (hasCoding && !ca.coding_completed_at) return "Waiting for the candidate to complete the coding assessment.";
  const cr = Number(ca.current_round) || 1;
  if (cr < interviewRoundNum) return "Candidate must finish earlier assessment rounds before you can schedule the interview.";
  return null;
}
