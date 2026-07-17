import { describe, it, expect } from "vitest";
import { validateFlagship } from "@/lib/flagshipValidator";
import { FLAGSHIP_DAYS, PRE_BIRTH_JOURNEY_LENGTH_DAYS } from "@/lib/training/flagshipJourney";

describe("validateFlagship", () => {
  it("scans every flagship workout and exercise ref", () => {
    const r = validateFlagship();
    expect(r.totalWorkouts).toBeGreaterThan(0);
    expect(r.totalExerciseRefs).toBeGreaterThan(0);
    expect(r.librarySize).toBeGreaterThan(0);
    for (const m of r.missing) {
      expect(m.workoutSlug).toBeTruthy();
      expect(m.exerciseName).toBeTruthy();
      expect(["missing-id", "unknown-id"]).toContain(m.reason);
    }
  });

  it("has 252 unique contiguous program days with zero journey issues", () => {
    const r = validateFlagship();
    expect(r.totalJourneyDays).toBe(PRE_BIRTH_JOURNEY_LENGTH_DAYS);
    expect(FLAGSHIP_DAYS.map((d) => d.programDay)).toEqual(
      Array.from({ length: PRE_BIRTH_JOURNEY_LENGTH_DAYS }, (_, i) => i + 1),
    );
    expect(r.journeyIssues).toEqual([]);
  });
});
