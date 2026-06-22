/**
 * Parse time string → { hours, minutes } in 24-h. Supports "09:00 AM", "14:30", "00:15", etc.
 */
export const parseTime = (t: string): { hours: number; minutes: number } | null => {
  if (!t) return null;
  const s = t.trim();
  // Try 12h format: "9:00 AM", "12:15 PM"
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const period = m12[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: min };
  }
  // Try 24h format: "00:15", "14:30"
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { hours: h, minutes: min };
  }
  return null;
};

/**
 * Check if the interview time has passed.
 * Returns true if the current time is beyond the interview window.
 */
export const isInterviewPast = (scheduledDate: string | Date, timeSlot: string | null, durationMin: number = 60): boolean => {
  if (!scheduledDate) return false;
  if (!timeSlot) return false;

  let startParsed: { hours: number; minutes: number } | null = null;
  let endParsed: { hours: number; minutes: number } | null = null;

  // Try range format "09:00 AM - 10:00 AM"
  const parts = timeSlot.split('-').map(s => s.trim());
  if (parts.length === 2) {
    startParsed = parseTime(parts[0]);
    endParsed = parseTime(parts[1]);
  }

  // If range didn't parse, try as a single time
  if (!startParsed) {
    startParsed = parseTime(timeSlot.trim());
  }

  if (!startParsed) return false;

  const dateBase = new Date(scheduledDate);
  if (isNaN(dateBase.getTime())) return false;

  const year = dateBase.getFullYear();
  const month = dateBase.getMonth();
  const day = dateBase.getDate();

  const startTime = new Date(year, month, day, startParsed.hours, startParsed.minutes);
  
  // If no parsed end, use duration
  const endTime = endParsed
    ? new Date(year, month, day, endParsed.hours, endParsed.minutes)
    : new Date(startTime.getTime() + durationMin * 60 * 1000);

  // Add a 15-minute grace period before marking as past
  const pastThreshold = new Date(endTime.getTime() + 15 * 60 * 1000);

  return new Date() > pastThreshold;
};
