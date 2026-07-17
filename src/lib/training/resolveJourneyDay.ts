import { getFlagshipJourneyDay, type JourneyResolveInputs } from "@/lib/training/getFlagshipJourneyDay";
import { loadTrainingContent } from "@/lib/training/loadTrainingContent";
import { resolveWorkoutById } from "@/lib/training/resolveWorkout";
import type { ResolvedWorkout, WorkoutVersionKey } from "@/lib/training/types";
import type { FlagshipDay, FlagshipPostBirthDay } from "@/lib/training/flagshipJourney";

export type ResolvedTrainingDay =
  | { status: "needs-due-date" | "pre-program" | "birth-window"; workout: null; day: null }
  | {
      status: "active" | "post-birth";
      programDay?: number;
      postpartumDay?: number;
      day: FlagshipDay | FlagshipPostBirthDay;
      workout: ResolvedWorkout | null;
    }
  | {
      status: "coach-override";
      coachProgramDay: number;
      flagshipProgramDay: number | null;
      workout: null;
      day: null;
    };

export function resolveJourneyDay(
  input: JourneyResolveInputs,
  version: WorkoutVersionKey = "full",
): ResolvedTrainingDay {
  const result = getFlagshipJourneyDay(input);
  if (result.status === "needs-due-date") return { status: result.status, day: null, workout: null };
  if (result.status === "pre-program") return { status: result.status, day: null, workout: null };
  if (result.status === "post-due-date") return { status: "birth-window", day: null, workout: null };
  if (result.status === "coach-override") {
    return {
      status: result.status,
      coachProgramDay: result.coachProgramDay,
      flagshipProgramDay: result.flagshipProgramDay,
      day: null,
      workout: null,
    };
  }

  const day = result.day;
  let workout: ResolvedWorkout | null = null;
  if (day?.dayType === "training") {
    if (!day.workoutId) {
      throw new Error(`Training day ${result.status === "active" ? result.programDay : result.postpartumDay} has no workoutId.`);
    }
    workout = resolveWorkoutById(day.workoutId, version, loadTrainingContent());
  }

  if (import.meta.env.DEV) {
    console.debug("[Training Journey]", {
      dueDate: input.dueDate ?? null,
      programDay: result.status === "active" ? result.programDay : undefined,
      postpartumDay: result.status === "post-birth" ? result.postpartumDay : undefined,
      dayType: day?.dayType,
      workoutId: day?.workoutId ?? null,
      selectedVersion: version,
      resolvedExerciseCount: workout?.exercises.length ?? 0,
    });
  }

  return result.status === "active"
    ? { status: result.status, programDay: result.programDay, day, workout }
    : { status: result.status, postpartumDay: result.postpartumDay, day, workout };
}
