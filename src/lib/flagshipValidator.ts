// M2F OS · Flagship data validator.
// Verifies that every workout's exerciseId references resolve to a real entry
// in the exercise library. Powers the admin/coach warning shown on the
// M2F Guided Journey program page.

import training from "@/data/m2f_training_programs.json";
import library from "@/data/m2f_exercise_library.json";
import type { WorkoutVersion } from "@/content/postBirthTraining";

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
  /** null when the reference is entirely missing from the JSON. */
  exerciseId: string | null;
  reason: "missing-id" | "unknown-id";
}

export interface FlagshipValidationReport {
  totalWorkouts: number;
  totalExerciseRefs: number;
  missing: FlagshipMissingRef[];
  librarySize: number;
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

  return {
    totalWorkouts: workouts,
    totalExerciseRefs: refs,
    missing,
    librarySize: ids.size,
    ok: missing.length === 0,
  };
}
