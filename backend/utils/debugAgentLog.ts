/** Session debug ingest — remove after verified fix */
// #region agent log
export function debugAgentLog(entry: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
}) {
  fetch("http://127.0.0.1:7778/ingest/cdd5120d-1135-4f41-bddb-afef7b8e9646", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d650a9",
    },
    body: JSON.stringify({
      sessionId: "d650a9",
      location: entry.location,
      message: entry.message,
      data: entry.data,
      hypothesisId: entry.hypothesisId,
      runId: entry.runId ?? "pre-fix",
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion
