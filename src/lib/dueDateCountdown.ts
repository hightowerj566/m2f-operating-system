export type DueDateCountdown =
  | { status: "upcoming"; days: number }
  | { status: "due-today"; days: 0 }
  | { status: "past"; days: 0 };

const DAY_MS = 24 * 60 * 60 * 1000;

function utcCalendarDay(year: number, month: number, day: number): number | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC treats years 0–99 as 1900–1999, so set the full year explicitly.
  date.setUTCFullYear(year);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return date.getTime();
}

/**
 * Calculate a countdown from a YYYY-MM-DD due date using whole calendar days.
 * Missing, malformed, and impossible dates never produce a countdown.
 */
export function getDueDateCountdown(
  dueDate: string | null | undefined,
  now: Date = new Date(),
): DueDateCountdown | null {
  if (!dueDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dueDay = utcCalendarDay(year, month, day);
  if (dueDay === null || Number.isNaN(now.getTime())) return null;

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((dueDay - today) / DAY_MS);
  if (days > 0) return { status: "upcoming", days };
  if (days === 0) return { status: "due-today", days: 0 };
  return { status: "past", days: 0 };
}
