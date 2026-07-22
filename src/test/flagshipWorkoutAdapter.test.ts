import { describe, it, expect, vi } from "vitest";
import { addDays } from "date-fns";

const PROFILE = { due_date: "2026-12-16", baby_arrived_at: null }; // ~153 days from NOW below → mid-journey, well within active range

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: PROFILE }),
        }),
      }),
    }),
  },
}));

import { loadFlagshipDay } from "@/lib/flagshipWorkoutAdapter";

describe("loadFlagshipDay — selectedDate navigation (spec §3, §4)", () => {
  it("resolves a different program day for yesterday, today, and tomorrow", async () => {
    const today = new Date("2026-07-16T12:00:00Z");

    const yesterday = await loadFlagshipDay("user-1", "full", addDays(today, -1));
    const now = await loadFlagshipDay("user-1", "full", today);
    const tomorrow = await loadFlagshipDay("user-1", "full", addDays(today, 1));

    expect(yesterday).not.toBeNull();
    expect(now).not.toBeNull();
    expect(tomorrow).not.toBeNull();

    const days = [yesterday!.meta.programDay, now!.meta.programDay, tomorrow!.meta.programDay];
    // Each calendar day must map to a distinct, increasing program day.
    expect(days[1]).toBe(days[0]! + 1);
    expect(days[2]).toBe(days[1]! + 1);
  });

  it("defaults to the current date when no date is supplied", async () => {
    const result = await loadFlagshipDay("user-1");
    expect(result).not.toBeNull();
    expect(result!.meta.status).toBe("active");
  });
});

describe("loadFlagshipDay — result shape (spec §5)", () => {
  it("preserves full meta for a training day", async () => {
    const result = await loadFlagshipDay("user-1", "full", new Date("2026-07-16T12:00:00Z"));
    expect(result).not.toBeNull();
    expect(result!.meta.status).toBe("active");
    expect(result!.meta.programDay).toBeGreaterThan(0);
    expect(result!.meta.contentId).toMatch(/^flagship-day-\d+$/);
    expect(typeof result!.meta.dayType).toBe("string");
    expect(typeof result!.meta.isRequired).toBe("boolean");
  });
});

describe("loadFlagshipDay — rest/recovery days never claim to have no content (spec §6)", () => {
  it("a non-training day returns zero exercises but populated metadata", async () => {
    // Walk forward until we land on a non-training day within the journey.
    const base = new Date("2026-07-16T12:00:00Z");
    let found: Awaited<ReturnType<typeof loadFlagshipDay>> | null = null;
    for (let i = 0; i < 30 && !found; i++) {
      const r = await loadFlagshipDay("user-1", "full", addDays(base, i));
      if (r && r.exercises.length === 0 && r.meta.status === "active") found = r;
    }
    expect(found).not.toBeNull();
    expect(found!.meta.objective).toBeTruthy();
    // Either activities or a completion message should be present so the UI
    // never has to fall back to "No exercises programmed for this day."
    expect(Boolean(found!.meta.activities?.length) || Boolean(found!.meta.completionMessage)).toBe(true);
  });
});
