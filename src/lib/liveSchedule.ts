// Pure helpers for live-schedule date math. Kept UI-free so they can be
// unit-tested and reused on the coach dashboard.

export function formatDateRange(startISO: string, endISO: string): string {
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  const sameMonth = s.getMonth() === e.getMonth();
  const monthS = s.toLocaleDateString(undefined, { month: "short" });
  const monthE = e.toLocaleDateString(undefined, { month: "short" });
  if (sameMonth) return `${monthS} ${s.getDate()}–${e.getDate()}`;
  return `${monthS} ${s.getDate()} – ${monthE} ${e.getDate()}`;
}

export function daysUntil(unlockISO: string, now: Date = new Date()): number {
  const diff = new Date(unlockISO).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400_000));
}

export function unlockLabel(unlockISO: string, tz: string, now: Date = new Date()): string {
  const d = new Date(unlockISO);
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "long", month: "short", day: "numeric", timeZone: tz,
  });
  return fmt.format(d);
}
