import { describe, it, expect } from "vitest";
import { currentWeekNumber, accessibleRange, type ScheduledWeek } from "@/hooks/useLiveSchedule";
import { formatDateRange, daysUntil } from "@/lib/liveSchedule";

function mkWeek(n: number, unlockOffsetMs: number): ScheduledWeek {
  return {
    id: `w${n}`, assignment_id: "a", display_week_number: n,
    start_date: "2026-01-01", end_date: "2026-01-07",
    unlock_at: new Date(Date.now() + unlockOffsetMs).toISOString(),
    publish_status: "published", access_status: "unlocked",
    coach_notes: null, member_notes: null, source_day_start: 1, source_day_end: 7,
  };
}

describe("live schedule", () => {
  it("current week is the highest already-unlocked week", () => {
    const weeks = [mkWeek(1, -3e9), mkWeek(2, -1e9), mkWeek(3, +1e9)];
    expect(currentWeekNumber(weeks)).toBe(2);
  });

  it("accessible range covers current back to current-4 only", () => {
    const weeks = Array.from({ length: 10 }, (_, i) => mkWeek(i + 1, i < 6 ? -1e6 : 1e9));
    const { min, max } = accessibleRange(weeks);
    expect(max).toBe(6);
    expect(min).toBe(2);
  });

  it("returns null when nothing has unlocked yet", () => {
    expect(currentWeekNumber([mkWeek(1, 1e9)])).toBe(null);
  });

  it("formatDateRange handles same month", () => {
    expect(formatDateRange("2026-07-06", "2026-07-12")).toMatch(/Jul 6.+12/);
  });

  it("daysUntil is never negative", () => {
    expect(daysUntil(new Date(Date.now() - 1e9).toISOString())).toBe(0);
  });
});
