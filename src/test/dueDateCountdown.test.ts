import { describe, expect, it } from "vitest";
import { getDueDateCountdown } from "@/lib/dueDateCountdown";

const NOW = new Date(2026, 2, 10, 23, 30);

describe("Start due-date countdown", () => {
  it("never creates a countdown for missing, malformed, or impossible dates", () => {
    expect(getDueDateCountdown(null, NOW)).toBeNull();
    expect(getDueDateCountdown("", NOW)).toBeNull();
    expect(getDueDateCountdown("not-a-date", NOW)).toBeNull();
    expect(getDueDateCountdown("2026-02-30", NOW)).toBeNull();
    expect(getDueDateCountdown("2026-3-1", NOW)).toBeNull();
  });

  it("uses whole calendar dates instead of elapsed 24-hour periods", () => {
    expect(getDueDateCountdown("2026-03-13", NOW)).toEqual({ status: "upcoming", days: 3 });
    expect(getDueDateCountdown("2026-03-11", new Date(2026, 2, 10, 0, 1))).toEqual({ status: "upcoming", days: 1 });
  });

  it("distinguishes a due-today date from a passed due date", () => {
    expect(getDueDateCountdown("2026-03-10", NOW)).toEqual({ status: "due-today", days: 0 });
    expect(getDueDateCountdown("2026-03-09", NOW)).toEqual({ status: "past", days: 0 });
  });
});
