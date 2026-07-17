export type WorkoutVersionKey = "full" | "express" | "minimum";

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  displayName: string;
  aliases: string[];
  category: string;
  exerciseType: string;
  movementPattern: string;
  primaryMuscles: string[];
  equipment: string[];
  defaultTempo: string;
  defaultRestSeconds: number;
  defaultRPE: number;
  defaultPrescription: {
    tempo: string;
    restSeconds: number;
    targetRPE: number;
    targetRIR: number;
  };
  instructions: string[];
  coachingCues: string[];
  substitutions: string[];
  media: {
    videoUrl: string;
    thumbnailUrl: string;
  };
}

export interface ExercisePrescription {
  prescriptionId: string;
  exerciseId: string;
  name: string;
  order: number;
  sets?: number;
  reps?: string;
  tempo?: string;
  rest?: string;
  restSeconds?: number;
  effort?: string;
  cue?: string;
  tactileCue?: string;
  prescriptionNotes?: string;
  targetRPE?: number | null;
  targetRIR?: number | null;
  substitution?: string;
  substitutionIds?: string[];
  tracking?: {
    trackLoad: boolean;
    trackReps: boolean;
    trackRpe: boolean;
  };
}

export interface WorkoutVersionSpec {
  minutes: string;
  format?: string;
  exercises: ExercisePrescription[];
}

export interface TrainingWorkout {
  slug: string;
  name: string;
  week: number;
  day: number;
  equipment?: string;
  difficulty?: string;
  objective?: string;
  coachingNote?: string;
  versions: Record<WorkoutVersionKey, WorkoutVersionSpec>;
}

export interface ResolvedWorkoutExercise {
  prescriptionId: string;
  exerciseId: string;
  name: string;
  displayName: string;
  order: number;
  sets: number | string;
  reps: string;
  tempo: string;
  restSeconds: number;
  rpe?: number;
  rir?: number;
  coachingCues: string[];
  tactileCue?: string;
  instructions: string[];
  substitutions: Array<{ id: string; name: string }>;
  videoUrl?: string;
  thumbnailUrl?: string;
  tracking: {
    trackLoad: boolean;
    trackReps: boolean;
    trackRpe: boolean;
  };
}

export interface ResolvedWorkout {
  id: string;
  name: string;
  version: WorkoutVersionKey;
  minutes: string;
  format?: string;
  equipment?: string;
  difficulty?: string;
  objective?: string;
  coachingNote?: string;
  exercises: ResolvedWorkoutExercise[];
}
