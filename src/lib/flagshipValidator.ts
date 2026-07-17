// M2F OS · Flagship data validator.
// Validates two layers:
//   1. Legacy training data (m2f_training_programs.json) — every exerciseId
//      reference resolves to a real library entry.
//   2. Day-based flagship engine (m2f_flagship_journey.json) — 252 unique
//      contiguous program days, valid stage ranges, every training day
//      references a real workout, every rest/recovery day has content.

import training from "@/data/m2f_training_programs.json";
import library from "@/data/m2f_exercise_library.json";
import type { WorkoutVersion } from "@/content/postBirthTraining";
import {
  FLAGSHIP_DAYS,
  FLAGSHIP_STAGES,
  FLAGSHIP_WORKOUTS,
  PRE_BIRTH_JOURNEY_LENGTH_DAYS,
} from "@/lib/training/flagshipJourney";

interface LibraryExercise { id: string; name?: string }
interface LibraryFile { exercises: LibraryExercise[] }

interface RawExercise {
  name: string;
  exerciseId?: string | null;
}

interface RawWorkout {
  slug: string;
  name: string;
  week: number;
  day: number;
  versions: Record<WorkoutVersion, { exercises: RawExercise[] }>;
}

interface RawProgram { slug: string; name: string; workouts: RawWorkout[] }

interface RawFile {
  programs: { preBirth: RawProgram[]; postBirth: RawProgram[] };
}

export interface FlagshipMissingRef {
  era: "pre-birth" | "post-birth";
  programSlug: string;
  programName: string;
  workoutSlug: string;
  workoutName: string;
  version: WorkoutVersion;
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

function libraryIdSet(): Set<string> {
  const lib = library as unknown as LibraryFile;
  return new Set((lib.exercises ?? []).map((e) => e.id));
}

function scanProgram(
  program: RawProgram,
  era: "pre-birth" | "post-birth",
  ids: Set<string>,
  acc: FlagshipMissingRef[],
): { workouts: number; refs: number } {
  let workouts = 0;
  let refs = 0;
  for (const workout of program.workouts) {
    workouts++;
    for (const version of Object.keys(workout.versions) as WorkoutVersion[]) {
      const spec = workout.versions[version];
      if (!spec?.exercises) continue;
      for (const ex of spec.exercises) {
        refs++;
        if (!ex.exerciseId) {
          acc.push({
            era, programSlug: program.slug, programName: program.name,
            workoutSlug: workout.slug, workoutName: workout.name,
            version, exerciseName: ex.name, exerciseId: null,
            reason: "missing-id",
          });
        } else if (!ids.has(ex.exerciseId)) {
          acc.push({
            era, programSlug: program.slug, programName: program.name,
            workoutSlug: workout.slug, workoutName: workout.name,
            version, exerciseName: ex.name, exerciseId: ex.exerciseId,
            reason: "unknown-id",
          });
        }
      }
    }
  }
  return { workouts, refs };
}

function validateJourney(): FlagshipJourneyIssue[] {
  const issues: FlagshipJourneyIssue[] = [];
  const seen = new Set<number>();
  for (const d of FLAGSHIP_DAYS) {
    if (seen.has(d.programDay)) {
      issues.push({
        kind: "duplicate-program-day",
        programDay: d.programDay,
        detail: `Program day ${d.programDay} appears more than once.`,
      });
    }
    seen.add(d.programDay);
  }
  for (let i = 1; i <= PRE_BIRTH_JOURNEY_LENGTH_DAYS; i++) {
    if (!seen.has(i)) {
      issues.push({
        kind: "missing-program-day",
        programDay: i,
        detail: `Program day ${i} is missing from the flagship journey.`,
      });
    }
  }
  // stages contiguous
  const sorted = [...FLAGSHIP_STAGES].sort((a, b) => a.programDayStart - b.programDayStart);
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (i === 0 && s.programDayStart !== 1) {
      issues.push({ kind: "stage-gap", detail: `Stages do not start at day 1 (found ${s.programDayStart}).` });
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (s.programDayStart !== prev.programDayEnd + 1) {
        issues.push({
          kind: prev.programDayEnd + 1 > s.programDayStart ? "stage-overlap" : "stage-gap",
          detail: `Stage ${prev.id} ends at ${prev.programDayEnd} but ${s.id} starts at ${s.programDayStart}.`,
        });
      }
    }
    if (i === sorted.length - 1 && s.programDayEnd !== PRE_BIRTH_JOURNEY_LENGTH_DAYS) {
      issues.push({
        kind: "stage-gap",
        detail: `Last stage ${s.id} ends at ${s.programDayEnd}, expected ${PRE_BIRTH_JOURNEY_LENGTH_DAYS}.`,
      });
    }
  }
  const workoutIds = new Set(FLAGSHIP_WORKOUTS.map((w) => w.slug));
  for (const d of FLAGSHIP_DAYS) {
    if (d.dayType === "training") {
      if (!d.workoutId) {
        issues.push({
          kind: "training-day-missing-workout",
          programDay: d.programDay,
          detail: `Training day ${d.programDay} has no workoutId.`,
        });
      } else if (!workoutIds.has(d.workoutId)) {
        issues.push({
          kind: "training-day-unknown-workout",
          programDay: d.programDay,
          detail: `Training day ${d.programDay} references unknown workout ${d.workoutId}.`,
        });
      }
    } else if (!d.activities || d.activities.length === 0) {
      issues.push({
        kind: "day-missing-content",
        programDay: d.programDay,
        detail: `Non-training day ${d.programDay} (${d.dayType}) has no activities.`,
      });
    }
  }
  return issues;
}

export function validateFlagship(): FlagshipValidationReport {
  const ids = libraryIdSet();
  const data = training as unknown as RawFile;
  const missing: FlagshipMissingRef[] = [];
  let workouts = 0;
  let refs = 0;

  for (const p of data.programs.preBirth) {
    const s = scanProgram(p, "pre-birth", ids, missing);
    workouts += s.workouts; refs += s.refs;
  }
  for (const p of data.programs.postBirth) {
    const s = scanProgram(p, "post-birth", ids, missing);
    workouts += s.workouts; refs += s.refs;
  }

  const journeyIssues = validateJourney();

  return {
    totalWorkouts: workouts,
    totalExerciseRefs: refs,
    missing,
    librarySize: ids.size,
    journeyIssues,
    totalJourneyDays: FLAGSHIP_DAYS.length,
    ok: missing.length === 0 && journeyIssues.length === 0,
  };
}
