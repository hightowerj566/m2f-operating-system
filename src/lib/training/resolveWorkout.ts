import { loadTrainingContent, type TrainingContent } from "@/lib/training/loadTrainingContent";
import { resolveExercise } from "@/lib/training/resolveExercise";
import type {
  ResolvedWorkout,
  TrainingWorkout,
  WorkoutVersionKey,
} from "@/lib/training/types";

export function getWorkoutVersion(workout: TrainingWorkout, version: WorkoutVersionKey) {
  const selected = workout.versions[version];
  if (!selected) {
    throw new Error(`Workout "${workout.slug}" does not define the "${version}" version.`);
  }
  if (!Array.isArray(selected.exercises) || selected.exercises.length === 0) {
    throw new Error(`Workout "${workout.slug}" has no exercises in the "${version}" version.`);
  }
  return selected;
}

export function resolveWorkout(
  workout: TrainingWorkout,
  version: WorkoutVersionKey,
  content: TrainingContent = loadTrainingContent(),
): ResolvedWorkout {
  const selected = getWorkoutVersion(workout, version);
  const exercises = selected.exercises.map((prescription) =>
    resolveExercise(prescription, workout.slug, content),
  );

  if (import.meta.env.DEV) {
    console.debug("[Training Resolver]", {
      workoutId: workout.slug,
      selectedVersion: version,
      prescriptionCount: selected.exercises.length,
      resolvedExerciseCount: exercises.length,
    });
  }

  return {
    id: workout.slug,
    name: workout.name,
    version,
    minutes: selected.minutes,
    format: selected.format,
    equipment: workout.equipment,
    difficulty: workout.difficulty,
    objective: workout.objective,
    coachingNote: workout.coachingNote,
    exercises,
  };
}

export function resolveWorkoutById(
  workoutId: string,
  version: WorkoutVersionKey,
  content: TrainingContent = loadTrainingContent(),
): ResolvedWorkout {
  const workout = content.workoutsById.get(workoutId);
  if (!workout) {
    throw new Error(`Workout "${workoutId}" was referenced but was not found.`);
  }
  return resolveWorkout(workout, version, content);
}

/** Coach programs use this same path after their stored workout is normalized. */
export function resolveCoachWorkout(
  workout: TrainingWorkout,
  version: WorkoutVersionKey,
  content: TrainingContent = loadTrainingContent(),
): ResolvedWorkout {
  return resolveWorkout(workout, version, content);
}
