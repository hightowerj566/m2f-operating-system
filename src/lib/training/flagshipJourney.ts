// M2F OS · Flagship journey data types + typed access.
// Reads the day-based flagship engine at src/data/m2f_flagship_journey.json,
// which contains every one of the 252 pre-birth days plus a rolling post-birth
// calendar. See scripts/build_flagship_journey.py.

import journey from "@/data/m2f_flagship_journey.json";

export const PRE_BIRTH_JOURNEY_LENGTH_DAYS = 252;

export type FlagshipDayType =
  | "training"
  | "rest"
  | "active-recovery"
  | "mobility"
  | "conditioning"
  | "optional-training"
  | "assessment"
  | "transition"
  | "birth-window"
  | "post-birth-recovery";

export interface FlagshipActivity {
  type: string;
  target: string;
  intensity: string;
}

export interface FlagshipDay {
  programDay: number;
  relativeDaysToDueDate: number;
  stageId: string;
  stageName: string;
  stageDay: number;
  weekNumber: number;
  dayOfWeekInCycle: number;
  pregnancyWeek: number;
  dayType: FlagshipDayType;
  isRequired: boolean;
  title: string;
  objective: string;
  workoutId?: string;
  activities?: FlagshipActivity[];
  completionCriteria?: string[];
  completionMessage?: string;
  estimatedDurationMinutes?: number;
}

export interface FlagshipPostBirthDay {
  postpartumDay: number;
  stageId: string;
  stageName: string;
  dayOfWeekInCycle: number;
  isRequired: boolean;
  dayType: FlagshipDayType;
  title: string;
  objective: string;
  workoutId?: string;
  activities?: FlagshipActivity[];
  completionCriteria?: string[];
  completionMessage?: string;
  estimatedDurationMinutes?: number;
}

export interface FlagshipStage {
  id: string;
  name: string;
  programDayStart: number;
  programDayEnd: number;
  pregnancyWeekStart: number;
  pregnancyWeekEnd: number;
}

export interface FlagshipPostBirthStage {
  id: string;
  name: string;
  postpartumDayStart: number;
  postpartumDayEnd: number | null;
}

interface RawWorkoutExercise {
  name: string;
  sets?: number;
  reps?: string;
  rest?: string;
  effort?: string;
  cue?: string;
  substitution?: string;
  exerciseId?: string | null;
  tempo?: string | null;
}

interface RawWorkoutVersionSpec {
  minutes: string;
  format?: string;
  exercises: RawWorkoutExercise[];
}

export interface FlagshipWorkout {
  slug: string;
  name: string;
  week: number;
  day: number;
  equipment?: string;
  difficulty?: string;
  objective?: string;
  coachingNote?: string;
  versions: Record<"full" | "express" | "minimum", RawWorkoutVersionSpec>;
}

interface FlagshipJourneyFile {
  schemaVersion: string;
  programId: string;
  name: string;
  preBirthJourneyLengthDays: number;
  stages: FlagshipStage[];
  postBirthStages: FlagshipPostBirthStage[];
  days: FlagshipDay[];
  postBirthDays: FlagshipPostBirthDay[];
  workouts: FlagshipWorkout[];
}

const FILE = journey as unknown as FlagshipJourneyFile;

export const FLAGSHIP_STAGES: FlagshipStage[] = FILE.stages;
export const FLAGSHIP_POST_BIRTH_STAGES: FlagshipPostBirthStage[] = FILE.postBirthStages;
export const FLAGSHIP_DAYS: FlagshipDay[] = FILE.days;
export const FLAGSHIP_POST_BIRTH_DAYS: FlagshipPostBirthDay[] = FILE.postBirthDays;
export const FLAGSHIP_WORKOUTS: FlagshipWorkout[] = FILE.workouts;

const workoutBySlug = new Map(FLAGSHIP_WORKOUTS.map((w) => [w.slug, w] as const));

export function getFlagshipDay(programDay: number): FlagshipDay | null {
  if (programDay < 1 || programDay > PRE_BIRTH_JOURNEY_LENGTH_DAYS) return null;
  return FLAGSHIP_DAYS[programDay - 1] ?? null;
}

export function getFlagshipPostBirthDay(postpartumDay: number): FlagshipPostBirthDay | null {
  if (postpartumDay < 1) return null;
  return FLAGSHIP_POST_BIRTH_DAYS[postpartumDay - 1] ?? null;
}

export function getFlagshipWorkout(workoutId: string): FlagshipWorkout | null {
  return workoutBySlug.get(workoutId) ?? null;
}

export function stageForProgramDay(programDay: number): FlagshipStage | null {
  return (
    FLAGSHIP_STAGES.find(
      (s) => programDay >= s.programDayStart && programDay <= s.programDayEnd,
    ) ?? null
  );
}
