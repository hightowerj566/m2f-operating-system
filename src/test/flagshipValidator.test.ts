import { describe, it, expect } from "vitest";
import { validateFlagship } from "@/lib/flagshipValidator";

describe("validateFlagship", () => {
  it("scans every flagship workout and exercise ref", () => {
    const r = validateFlagship();
    expect(r.totalWorkouts).toBeGreaterThan(0);
    expect(r.totalExerciseRefs).toBeGreaterThan(0);
    expect(r.librarySize).toBeGreaterThan(0);
    // Missing entries carry enough context to fix them.
    for (const m of r.missing) {
      expect(m.workoutSlug).toBeTruthy();
      expect(m.exerciseName).toBeTruthy();
      expect(["missing-id", "unknown-id"]).toContain(m.reason);
    }
  });
});
