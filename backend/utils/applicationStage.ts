/** Map application.status to pipeline stage (used when resetting after assessment removal, etc.). */
export function resolveStageFromStatus(status: string): string {
  switch (String(status || "").toLowerCase()) {
    case "shortlisted":
      return "shortlisted";
    case "interview_scheduled":
    case "interviewing":
      return "interview";
    case "hired":
    case "selected":
      return "selected";
    case "rejected":
    case "declined":
      return "rejected";
    default:
      return "applied";
  }
}
