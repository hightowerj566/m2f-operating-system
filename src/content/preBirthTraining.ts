// M2F OS · Pre-birth training programs.
// Sourced from src/data/m2f_training_programs.json — the time-based journey
// program that auto-updates by pregnancy week (PBWorkout.week).

import trainingData from "@/data/m2f_training_programs.json";
import type { PBProgram, PBWorkout } from "./postBirthTraining";

export const PRE_BIRTH_PROGRAMS: PBProgram[] =
  (trainingData as { programs: { preBirth: PBProgram[] } }).programs.preBirth;

export function preBirthProgramForPregnancyWeek(pregnancyWeek: number): PBProgram | null {
  return (
    PRE_BIRTH_PROGRAMS.find((program) =>
      program.workouts.some((workout) => workout.week === pregnancyWeek),
    ) ?? null
  );
}

export function preBirthWorkoutsForPregnancyWeek(pregnancyWeek: number): PBWorkout[] {
  return PRE_BIRTH_PROGRAMS.flatMap((program) => program.workouts).filter(
    (workout) => workout.week === pregnancyWeek,
  );
}
