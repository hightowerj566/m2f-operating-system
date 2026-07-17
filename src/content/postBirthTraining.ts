// M2F OS · Post-birth training programs.
// Program content is sourced from src/data/m2f_training_programs.json — the
// canonical, time-based journey that auto-progresses with the baby's age.

import trainingData from "@/data/m2f_training_programs.json";

export type WorkoutVersion = "full" | "express" | "minimum";

export interface PBExercise {
  name: string;
  sets?: number;
  reps?: string;
  rest?: string;
  effort?: string;
  substitution?: string;
  cue?: string;
  videoUrl?: string;
}

export interface PBWorkoutVersionSpec {
  minutes: string;
  format?: string;
  exercises: PBExercise[];
}

export interface PBWorkout {
  slug: string;
  name: string;
  week: number;
  day: number;
  equipment: string;
  difficulty: "easy" | "moderate" | "hard";
  objective: string;
  coachingNote: string;
  versions: Record<WorkoutVersion, PBWorkoutVersionSpec>;
}

export interface PBProgram {
  slug: string;
  name: string;
  phaseWindow: string;
  focus: string;
  workouts: PBWorkout[];
}

const labels = (trainingData as { versionLabels: Record<WorkoutVersion, { label: string; hint: string }> }).versionLabels;

export const VERSION_LABELS: Record<WorkoutVersion, { label: string; hint: string }> = {
  full: labels?.full ?? { label: "Full", hint: "30–45 min · the complete session" },
  express: labels?.express ?? { label: "Express", hint: "15–20 min · the essentials" },
  minimum: labels?.minimum ?? { label: "Minimum", hint: "5–10 min · rough night? still counts" },
};

export const POST_BIRTH_PROGRAMS: PBProgram[] =
  (trainingData as { programs: { postBirth: PBProgram[] } }).programs.postBirth;

export function programForSlug(slug: string): PBProgram | null {
  return POST_BIRTH_PROGRAMS.find((program) => program.slug === slug) ?? null;
}
