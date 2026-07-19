import { describe, it, expect } from "vitest";
import {
  weekStartFor, currentWeekStart, previousWeekStart, isDueToday, isOverdue,
  weekRange, consecutiveMissedWeeks, parseISODateLocal,
} from "@/lib/coaching/weekLogic";
import {
  calcWorkoutCompliance, calcNutritionCompliance, calcWeeklyWeightAvg,
  calcReadinessDelta, calcStandardsCompletion,
} from "@/lib/coaching/snapshotEngine";
import { evaluateCoachingFlags } from "@/lib/coaching/flagEngine";

describe("weekLogic", () => {
  it("returns the Sunday of the containing week", () => {
    expect(weekStartFor(new Date(2026, 6, 19))).toBe("2026-07-19"); // Sunday itself
    expect(weekStartFor(new Date(2026, 6, 22))).toBe("2026-07-19"); // Wednesday
    expect(weekStartFor(new Date(2026, 6, 25))).toBe("2026-07-19"); // Saturday
  });
  it("Saturday→Sunday transition rolls the week", () => {
    expect(weekStartFor(new Date(2026, 6, 25, 23, 59))).toBe("2026-07-19");
    expect(weekStartFor(new Date(2026, 6, 26, 0, 1))).toBe("2026-07-26");
  });
  it("parses ISO dates as local (no UTC shift)", () => {
    const d = parseISODateLocal("2026-07-19");
    expect(d.getDate()).toBe(19);
    expect(d.getDay()).toBe(0);
  });
  it("week range spans Sunday..Saturday", () => {
    expect(weekRange("2026-07-19")).toEqual({ start: "2026-07-19", end: "2026-07-25" });
  });
  it("previous week start", () => {
    expect(previousWeekStart("2026-07-19")).toBe("2026-07-12");
  });
  it("due today only on that Sunday", () => {
    expect(isDueToday("2026-07-19", new Date(2026, 6, 19, 8))).toBe(true);
    expect(isDueToday("2026-07-19", new Date(2026, 6, 20, 8))).toBe(false);
  });
  it("overdue starts Monday, cleared by submission", () => {
    expect(isOverdue("2026-07-19", null, new Date(2026, 6, 19, 23))).toBe(false);
    expect(isOverdue("2026-07-19", null, new Date(2026, 6, 20, 0, 1))).toBe(true);
    expect(isOverdue("2026-07-19", "2026-07-19T20:00:00Z", new Date(2026, 6, 21))).toBe(false);
  });
  it("counts consecutive missed weeks", () => {
    const now = new Date(2026, 6, 22); // Wednesday, week of 07-19
    expect(consecutiveMissedWeeks(["2026-07-12"], now)).toBe(1); // current overdue, prev submitted
    expect(consecutiveMissedWeeks([], now)).toBeGreaterThanOrEqual(2);
    expect(consecutiveMissedWeeks(["2026-07-19"], now)).toBe(0);
  });
});

describe("snapshotEngine calculators", () => {
  it("workout compliance caps at 100 and handles no schedule", () => {
    expect(calcWorkoutCompliance(3, 4)).toBe(75);
    expect(calcWorkoutCompliance(5, 4)).toBe(100);
    expect(calcWorkoutCompliance(3, null)).toBeNull();
    expect(calcWorkoutCompliance(0, 0)).toBeNull();
  });
  it("nutrition compliance from daily compliance strings", () => {
    expect(calcNutritionCompliance(["at", "at", "above", "at", "below", "at", "at"]))
      .toEqual({ daysLogged: 7, compliancePct: 71 });
    expect(calcNutritionCompliance([])).toEqual({ daysLogged: 0, compliancePct: null });
  });
  it("weekly weight averages and missing data", () => {
    expect(calcWeeklyWeightAvg([200, 201, 199])).toBe(200);
    expect(calcWeeklyWeightAvg([])).toBeNull();
  });
  it("readiness delta", () => {
    expect(calcReadinessDelta(70, 75)).toBe(-5);
    expect(calcReadinessDelta(70, null)).toBeNull();
  });
  it("standards completion", () => {
    const day = { wake_on_time: true, workout_completed: true, protein_hit: false, steps_hit: false, scripture_read: false, family_time: false, no_phone_at_dinner: false, hydration_hit: false };
    expect(calcStandardsCompletion([day])).toBe(25);
    expect(calcStandardsCompletion([])).toBeNull();
  });
});

describe("flagEngine", () => {
  it("fires critical high-stress flag", () => {
    const flags = evaluateCoachingFlags({ stress_rating: 5 }, null);
    expect(flags.some((f) => f.flag_type === "stress_max" && f.severity === "critical")).toBe(true);
  });
  it("fires low-compliance flag", () => {
    const flags = evaluateCoachingFlags({}, { workout_compliance_pct: 40 });
    expect(flags.some((f) => f.flag_type === "low_training" && f.severity === "medium")).toBe(true);
  });
  it("fires missed check-in flag at 2 consecutive", () => {
    const flags = evaluateCoachingFlags({}, null, { consecutiveMissedCheckIns: 2 });
    expect(flags.some((f) => f.flag_type === "missed_checkins")).toBe(true);
  });
  it("fires readiness decline flag", () => {
    const flags = evaluateCoachingFlags({}, { readiness_delta: -12 });
    expect(flags.some((f) => f.flag_type === "readiness_drop")).toBe(true);
  });
  it("does NOT false-flag when data is unavailable", () => {
    const flags = evaluateCoachingFlags({}, {
      workout_compliance_pct: null, nutrition_compliance_pct: null,
      standards_completion_pct: null, readiness_delta: null,
      build_tasks_completed: null, weight_change: null,
    });
    expect(flags).toHaveLength(0);
  });
  it("keyword flag explains itself and is not a diagnosis", () => {
    const flags = evaluateCoachingFlags({ biggest_struggle: "I might have injured my back" }, null);
    const f = flags.find((x) => x.flag_type === "concern_keyword");
    expect(f?.explanation).toContain("not a diagnosis");
  });
  it("weight-vs-goal uses goal direction", () => {
    const flags = evaluateCoachingFlags({}, { weight_change: 1.5, snapshot_json: { goal: "fat_loss" } });
    expect(flags.some((f) => f.flag_type === "weight_vs_goal")).toBe(true);
    const none = evaluateCoachingFlags({}, { weight_change: 1.5, snapshot_json: { goal: "muscle_gain" } });
    expect(none.some((f) => f.flag_type === "weight_vs_goal")).toBe(false);
  });
});
