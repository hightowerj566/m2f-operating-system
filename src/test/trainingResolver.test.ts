import { describe, expect, it } from "vitest";
import { addDays, format } from "date-fns";
import { loadTrainingContent } from "@/lib/training/loadTrainingContent";
import { resolveExercise } from "@/lib/training/resolveExercise";
import { resolveJourneyDay } from "@/lib/training/resolveJourneyDay";
import { getWorkoutVersion, resolveCoachWorkout, resolveWorkoutById } from "@/lib/training/resolveWorkout";
import type { ExercisePrescription } from "@/lib/training/types";

const NOW = new Date(2026, 6, 16, 12);
const dueIn = (days: number) => format(addDays(NOW, days), "yyyy-MM-dd");

describe("training content resolution", () => {
  const content = loadTrainingContent();
  const workout = content.workouts[0];

  it("resolves a valid workout ID", () => {
    expect(resolveWorkoutById(workout.slug, "full").id).toBe(workout.slug);
  });

  it("resolves a valid exercise ID against the library", () => {
    const prescription = workout.versions.full.exercises[0];
    expect(resolveExercise(prescription, workout.slug, content).exerciseId).toBe(
      prescription.exerciseId,
    );
  });

  it("throws a clear error for a missing workout", () => {
    expect(() => resolveWorkoutById("missing-workout", "full")).toThrow(
      'Workout "missing-workout" was referenced but was not found.',
    );
  });

  it("throws a clear error for a missing exercise", () => {
    const broken: ExercisePrescription = {
      ...workout.versions.full.exercises[0],
      exerciseId: "missing-exercise",
    };
    expect(() => resolveExercise(broken, workout.slug, content)).toThrow(
      `Exercise "missing-exercise" was referenced by workout "${workout.slug}" but was not found.`,
    );
  });

  it.each(["full", "express", "minimum"] as const)(
    "%s version resolves a non-empty exercise list",
    (version) => {
      expect(getWorkoutVersion(workout, version).exercises.length).toBeGreaterThan(0);
      expect(resolveWorkoutById(workout.slug, version).exercises.length).toBeGreaterThan(0);
    },
  );

  it("renders a normalized coach workout through the same resolver", () => {
    expect(resolveCoachWorkout(workout, "full").exercises.length).toBeGreaterThan(0);
  });
});

describe("journey workout display states", () => {
  it("training day resolves the complete workout", () => {
    const result = resolveJourneyDay({ dueDate: dueIn(252), now: NOW }, "full");
    expect(result.status).toBe("active");
    if (result.status === "active") {
      expect(result.day.dayType).toBe("training");
      expect(result.workout?.exercises.length).toBeGreaterThan(0);
    }
  });

  it("rest day resolves recovery content and no workout", () => {
    const result = resolveJourneyDay({ dueDate: dueIn(246), now: NOW }, "full");
    expect(result.status).toBe("active");
    if (result.status === "active") {
      expect(result.day.dayType).toBe("rest");
      expect(result.day.activities?.length).toBeGreaterThan(0);
      expect(result.workout).toBeNull();
    }
  });

  it("optional day remains optional instead of becoming a missing workout", () => {
    const result = resolveJourneyDay({ dueDate: dueIn(114), now: NOW }, "full");
    expect(result.status).toBe("active");
    if (result.status === "active") {
      expect(result.day.dayType).toBe("optional-training");
      expect(result.day.isRequired).toBe(false);
      expect(result.workout).toBeNull();
    }
  });

  it("past due without birth confirmation stays in the birth window", () => {
    expect(resolveJourneyDay({ dueDate: dueIn(-1), now: NOW }).status).toBe("birth-window");
  });

  it("confirmed birth selects the post-birth journey", () => {
    const result = resolveJourneyDay({ babyArrivedAt: dueIn(-14), now: NOW });
    expect(result.status).toBe("post-birth");
    if (result.status === "post-birth") expect(result.postpartumDay).toBe(15);
  });

  it("active coach program wins while preserving the flagship day", () => {
    const result = resolveJourneyDay({
      dueDate: dueIn(100),
      now: NOW,
      coachAssignment: {
        programId: "coach-program",
        programName: "Coach Program",
        currentDay: 8,
        totalDays: 28,
      },
    });
    expect(result.status).toBe("coach-override");
    if (result.status === "coach-override") {
      expect(result.coachProgramDay).toBe(8);
      expect(result.flagshipProgramDay).toBe(153);
    }
  });
});
