import journeyJson from "@/data/m2f_flagship_journey.json";
import libraryJson from "@/data/m2f_exercise_library.json";
import type { ExerciseLibraryItem, TrainingWorkout } from "@/lib/training/types";
import type {
  FlagshipDay,
  FlagshipPostBirthDay,
  FlagshipPostBirthStage,
  FlagshipStage,
} from "@/lib/training/flagshipJourney";

interface JourneyContentFile {
  schemaVersion: string;
  programId: string;
  name: string;
  preBirthJourneyLengthDays: number;
  stages: FlagshipStage[];
  postBirthStages: FlagshipPostBirthStage[];
  days: FlagshipDay[];
  postBirthDays: FlagshipPostBirthDay[];
  workouts: TrainingWorkout[];
}

interface ExerciseLibraryFile {
  exercises: ExerciseLibraryItem[];
}

export interface TrainingContent {
  programId: string;
  programName: string;
  schemaVersion: string;
  days: FlagshipDay[];
  postBirthDays: FlagshipPostBirthDay[];
  stages: FlagshipStage[];
  postBirthStages: FlagshipPostBirthStage[];
  workouts: TrainingWorkout[];
  exercises: ExerciseLibraryItem[];
  workoutsById: ReadonlyMap<string, TrainingWorkout>;
  exercisesById: ReadonlyMap<string, ExerciseLibraryItem>;
}

function uniqueMap<T>(items: T[], idFor: (item: T) => string, label: string): Map<string, T> {
  const result = new Map<string, T>();
  for (const item of items) {
    const id = idFor(item);
    if (!id) throw new Error(`${label} has an empty ID.`);
    if (result.has(id)) throw new Error(`Duplicate ${label} ID "${id}".`);
    result.set(id, item);
  }
  return result;
}

let cached: TrainingContent | null = null;

export function loadTrainingContent(): TrainingContent {
  if (cached) return cached;

  const journey = journeyJson as unknown as JourneyContentFile;
  const library = libraryJson as unknown as ExerciseLibraryFile;
  if (!Array.isArray(journey.workouts) || !Array.isArray(journey.days)) {
    throw new Error("Flagship training content is not in the expected normalized schema.");
  }
  if (!Array.isArray(library.exercises)) {
    throw new Error("Exercise library is not in the expected normalized schema.");
  }

  cached = {
    programId: journey.programId,
    programName: journey.name,
    schemaVersion: journey.schemaVersion,
    days: journey.days,
    postBirthDays: journey.postBirthDays,
    stages: journey.stages,
    postBirthStages: journey.postBirthStages,
    workouts: journey.workouts,
    exercises: library.exercises,
    workoutsById: uniqueMap(journey.workouts, (workout) => workout.slug, "workout"),
    exercisesById: uniqueMap(library.exercises, (exercise) => exercise.id, "exercise"),
  };
  return cached;
}
