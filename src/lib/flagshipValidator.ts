// M2F OS · Flagship data validator.
// Validates two layers:
//   1. Legacy training data (m2f_training_programs.json) — every exerciseId
//      reference resolves to a real library entry.
//   2. Day-based flagship engine (m2f_flagship_journey.json) — 252 unique
//      contiguous program days, valid stage ranges, every training day
//      references a real workout, every rest/recovery day has content.

import {
  FLAGSHIP_DAYS,
} from "@/lib/training/flagshipJourney";
import { validateTrainingContent } from "@/lib/training/validateTrainingContent";
import type { WorkoutVersionKey } from "@/lib/training/types";

export interface FlagshipMissingRef {
  era: "pre-birth" | "post-birth";
  programSlug: string;
  programName: string;
  workoutSlug: string;
  workoutName: string;
  version: WorkoutVersionKey;
  exerciseName: string;
  exerciseId: string | null;
  reason: "missing-id" | "unknown-id";
}

export interface FlagshipJourneyIssue {
  kind:
    | "duplicate-program-day"
    | "missing-program-day"
    | "stage-gap"
    | "stage-overlap"
    | "training-day-missing-workout"
    | "training-day-unknown-workout"
    | "day-missing-content";
  programDay?: number;
  detail: string;
}

export interface FlagshipValidationReport {
  totalWorkouts: number;
  totalExerciseRefs: number;
  missing: FlagshipMissingRef[];
  librarySize: number;
  journeyIssues: FlagshipJourneyIssue[];
  totalJourneyDays: number;
  ok: boolean;
}

export function validateFlagship(): FlagshipValidationReport {
  const report = validateTrainingContent();
  const missing: FlagshipMissingRef[] = [];
  const journeyIssues: FlagshipJourneyIssue[] = report.errors.map((detail) => ({
    kind: "day-missing-content",
    detail,
  }));

  return {
    totalWorkouts: report.workoutCount,
    totalExerciseRefs: report.prescriptionCount,
    missing,
    librarySize: report.exerciseCount,
    journeyIssues,
    totalJourneyDays: FLAGSHIP_DAYS.length,
    ok: report.ok,
  };
}
