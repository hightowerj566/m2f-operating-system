// Coaching week logic. A coaching week starts SUNDAY in the member's local time.
// week_start is always stored as YYYY-MM-DD (the Sunday date).

/** Format a Date as local YYYY-MM-DD (never UTC-shifted). */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The Sunday that starts the coaching week containing `d` (local time). */
export function weekStartFor(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - copy.getDay()); // getDay(): 0 = Sunday
  return toLocalISODate(copy);
}

/** Current coaching week start (local). */
export function currentWeekStart(now: Date = new Date()): string {
  return weekStartFor(now);
}

/** Previous coaching week start. */
export function previousWeekStart(weekStart: string): string {
  const d = parseISODateLocal(weekStart);
  d.setDate(d.getDate() - 7);
  return toLocalISODate(d);
}

export function nextWeekStart(weekStart: string): string {
  const d = parseISODateLocal(weekStart);
  d.setDate(d.getDate() + 7);
  return toLocalISODate(d);
}

/** Parse YYYY-MM-DD as a LOCAL date (avoids the UTC-midnight trap of new Date(str)). */
export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive date range [weekStart .. weekStart+6] as ISO strings. */
export function weekRange(weekStart: string): { start: string; end: string } {
  const end = parseISODateLocal(weekStart);
  end.setDate(end.getDate() + 6);
  return { start: weekStart, end: toLocalISODate(end) };
}

/** Is the check-in for `weekStart` due today (i.e. today is that Sunday)? */
export function isDueToday(weekStart: string, now: Date = new Date()): boolean {
  return toLocalISODate(now) === weekStart && now.getDay() === 0;
}

/**
 * Overdue: the check-in for the PREVIOUS week's Sunday was never submitted and
 * it's now Monday or later of the following week. We treat the check-in that is
 * "actionable" on any given day as the one for the most recent Sunday.
 */
export function isOverdue(weekStart: string, submittedAt: string | null, now: Date = new Date()): boolean {
  if (submittedAt) return false;
  const sunday = parseISODateLocal(weekStart);
  // overdue starting the next local day (Monday 00:00 local)
  const monday = new Date(sunday);
  monday.setDate(monday.getDate() + 1);
  return now.getTime() >= monday.getTime();
}

/** Human label like "Week of Jul 19". */
export function weekLabel(weekStart: string): string {
  const d = parseISODateLocal(weekStart);
  return `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** Count of consecutive missed weeks before `now`, given a set of submitted week_starts. */
export function consecutiveMissedWeeks(submittedWeekStarts: string[], now: Date = new Date()): number {
  const submitted = new Set(submittedWeekStarts);
  let missed = 0;
  let ws = currentWeekStart(now);
  // current week only counts as missed once it's past Sunday
  if (!submitted.has(ws) && isOverdue(ws, null, now)) missed++;
  else if (submitted.has(ws)) return 0;
  ws = previousWeekStart(ws);
  while (!submitted.has(ws) && missed < 12) {
    missed++;
    ws = previousWeekStart(ws);
  }
  return missed;
}
