import type {
  ExercisePrescription,
  ResolvedWorkoutExercise,
} from "@/lib/training/types";
import type { TrainingContent } from "@/lib/training/loadTrainingContent";

export function resolveExercise(
  prescription: ExercisePrescription,
  workoutId: string,
  content: TrainingContent,
): ResolvedWorkoutExercise {
  if (!prescription.exerciseId) {
    throw new Error(
      `Exercise prescription "${prescription.prescriptionId || prescription.name}" in workout "${workoutId}" has no exerciseId.`,
    );
  }
  const exercise = content.exercisesById.get(prescription.exerciseId);
  if (!exercise) {
    throw new Error(
      `Exercise "${prescription.exerciseId}" was referenced by workout "${workoutId}" but was not found.`,
    );
  }

  const substitutions = (prescription.substitutionIds ?? []).map((id) => {
    const substitution = content.exercisesById.get(id);
    if (!substitution) {
      throw new Error(
        `Substitution "${id}" was referenced by workout "${workoutId}" but was not found.`,
      );
    }
    return { id: substitution.id, name: substitution.displayName || substitution.name };
  });

  return {
    prescriptionId: prescription.prescriptionId,
    exerciseId: exercise.id,
    name: exercise.name,
    displayName: exercise.displayName || exercise.name,
    order: prescription.order,
    sets: prescription.sets ?? 1,
    reps: prescription.reps ?? "As prescribed",
    tempo: prescription.tempo ?? exercise.defaultPrescription.tempo,
    restSeconds: prescription.restSeconds ?? exercise.defaultPrescription.restSeconds,
    rpe: prescription.targetRPE ?? undefined,
    rir: prescription.targetRIR ?? undefined,
    coachingCues: [prescription.cue, ...exercise.coachingCues].filter(
      (cue, index, cues): cue is string => Boolean(cue) && cues.indexOf(cue) === index,
    ),
    tactileCue: prescription.tactileCue ?? prescription.cue,
    instructions: exercise.instructions,
    substitutions,
    videoUrl: exercise.media.videoUrl || undefined,
    thumbnailUrl: exercise.media.thumbnailUrl || undefined,
    tracking: prescription.tracking ?? {
      trackLoad: true,
      trackReps: true,
      trackRpe: true,
    },
  };
}
