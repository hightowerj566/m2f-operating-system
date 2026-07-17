import { addDays, format } from "date-fns";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";
import { loadTrainingContent, type TrainingContent } from "@/lib/training/loadTrainingContent";
import type { WorkoutVersionKey } from "@/lib/training/types";

export interface TrainingValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  workoutCount: number;
  exerciseCount: number;
  prescriptionCount: number;
  journeyDayCount: number;
  postBirthDayCount: number;
}

const VERSIONS: WorkoutVersionKey[] = ["full", "express", "minimum"];

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate];
}

export function validateTrainingContent(
  content: TrainingContent = loadTrainingContent(),
): TrainingValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  let prescriptionCount = 0;

  duplicates(content.exercises.map((exercise) => exercise.id)).forEach((id) =>
    errors.push(`Duplicate exercise ID: "${id}".`),
  );
  duplicates(content.workouts.map((workout) => workout.slug)).forEach((id) =>
    errors.push(`Duplicate workout ID: "${id}".`),
  );

  const dayNumbers = content.days.map((day) => day.programDay);
  duplicates(dayNumbers.map(String)).forEach((day) => errors.push(`Duplicate program day: ${day}.`));
  for (let day = 1; day <= 252; day += 1) {
    if (!dayNumbers.includes(day)) errors.push(`Missing required program day ${day}.`);
  }

  for (const day of content.days) {
    if (day.dayType === "training") {
      if (!day.workoutId) {
        errors.push(`Program day ${day.programDay} is training but has no workout ID.`);
      } else if (!content.workoutsById.has(day.workoutId)) {
        errors.push(`Program day ${day.programDay} references missing workout "${day.workoutId}".`);
      }
    } else if (!day.activities?.length) {
      errors.push(`Program day ${day.programDay} (${day.dayType}) has no recovery content.`);
    }
  }

  const postBirthNumbers = content.postBirthDays.map((day) => day.postpartumDay);
  duplicates(postBirthNumbers.map(String)).forEach((day) =>
    errors.push(`Duplicate post-birth day: ${day}.`),
  );
  for (let day = 1; day <= content.postBirthDays.length; day += 1) {
    if (!postBirthNumbers.includes(day)) errors.push(`Missing required post-birth day ${day}.`);
  }
  for (const day of content.postBirthDays) {
    if (day.dayType === "training") {
      if (!day.workoutId) {
        errors.push(`Post-birth day ${day.postpartumDay} is training but has no workout ID.`);
      } else if (!content.workoutsById.has(day.workoutId)) {
        errors.push(
          `Post-birth day ${day.postpartumDay} references missing workout "${day.workoutId}".`,
        );
      }
    } else if (!day.activities?.length) {
      errors.push(
        `Post-birth day ${day.postpartumDay} (${day.dayType}) has no recovery content.`,
      );
    }
  }

  for (const workout of content.workouts) {
    const prescriptionIds: string[] = [];
    for (const version of VERSIONS) {
      const spec = workout.versions[version];
      if (!spec) {
        errors.push(`Workout "${workout.slug}" is missing the ${version} version.`);
        continue;
      }
      if (!spec.exercises.length) {
        errors.push(`Workout "${workout.slug}" has no ${version} exercises.`);
      }
      for (const prescription of spec.exercises) {
        prescriptionCount += 1;
        prescriptionIds.push(prescription.prescriptionId);
        if (!prescription.prescriptionId) {
          errors.push(`Workout "${workout.slug}" ${version} has a prescription without a stable ID.`);
        }
        if (!prescription.exerciseId) {
          errors.push(`Workout "${workout.slug}" ${version} has an exercise without an exercise ID.`);
        } else if (!content.exercisesById.has(prescription.exerciseId)) {
          errors.push(
            `Workout "${workout.slug}" references missing exercise ID "${prescription.exerciseId}".`,
          );
        }
        for (const substitutionId of prescription.substitutionIds ?? []) {
          if (!content.exercisesById.has(substitutionId)) {
            errors.push(
              `Workout "${workout.slug}" references missing substitution ID "${substitutionId}".`,
            );
          }
        }
      }
    }
    duplicates(prescriptionIds).forEach((id) =>
      errors.push(`Workout "${workout.slug}" has duplicate prescription ID "${id}".`),
    );
  }

  const stages = [...content.stages].sort((a, b) => a.programDayStart - b.programDayStart);
  stages.forEach((stage, index) => {
    const expectedStart = index === 0 ? 1 : stages[index - 1].programDayEnd + 1;
    if (stage.programDayStart < expectedStart) {
      errors.push(`Stage "${stage.id}" overlaps the preceding stage.`);
    } else if (stage.programDayStart > expectedStart) {
      errors.push(`Gap before stage "${stage.id}": expected day ${expectedStart}.`);
    }
  });
  if (stages.at(-1)?.programDayEnd !== 252) errors.push("Pre-birth stages do not end on day 252.");

  const now = new Date(2026, 6, 16, 12);
  const mappings: Array<[number, number]> = [
    [252, 1], [251, 2], [200, 53], [100, 153], [30, 223], [7, 246],
  ];
  for (const [daysAway, expectedDay] of mappings) {
    const dueDate = format(addDays(now, daysAway), "yyyy-MM-dd");
    const result = getFlagshipJourneyDay({ dueDate, now });
    if (result.status !== "active" || result.programDay !== expectedDay) {
      errors.push(
        `Due-date boundary failed: ${daysAway} days away expected Day ${expectedDay}, got ${result.status}${result.status === "active" ? ` Day ${result.programDay}` : ""}.`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    workoutCount: content.workouts.length,
    exerciseCount: content.exercises.length,
    prescriptionCount,
    journeyDayCount: content.days.length,
    postBirthDayCount: content.postBirthDays.length,
  };
}
