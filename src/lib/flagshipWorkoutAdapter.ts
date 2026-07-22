// M2F OS · Flagship (M2F Guided Journey) → workout-tab adapter.
// The flagship program is code-driven (src/data/m2f_flagship_journey.json)
// and picks the right session from a member's due date / baby age via the
// day-based resolver. When the classic Workout tab is asked to render a day
// for this program, we bypass program_days and hand it either the mapped
// PBWorkout exercises OR a synthesized recovery / rest / birth-window card.

import { supabase } from "@/integrations/supabase/client";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";
import {
  type FlagshipDay,
  type FlagshipPostBirthDay,
} from "@/lib/training/flagshipJourney";
import type { WorkoutVersion } from "@/content/postBirthTraining";
import { resolveWorkoutById } from "@/lib/training/resolveWorkout";
import type { ResolvedWorkoutExercise } from "@/lib/training/types";

interface ProgramExercise {
  name: string;
  detail: string;
  type: "exercise" | "rest" | "mindset" | "mission";
  sets: number | null;
  reps: number | null;
  percentage: number | null;
  percentageBase?: string | null;
  seconds: number | null;
  video_url: string | null;
  video_type: "youtube" | "upload" | null;
  group?: string;
  rest?: number;
  superset_label?: string;
  rir?: string | null;
}

export interface FlagshipDayResult {
  label: string;
  exercises: ProgramExercise[];
  /** When the day is not a training day, a caller can render a card instead. */
  meta: {
    programDay?: number;
    postpartumDay?: number;
    dayType: string;
    isRequired: boolean;
    stageId: string;
    stageName?: string;
    objective?: string;
    activities?: FlagshipDay["activities"];
    completionCriteria?: string[];
    completionMessage?: string;
    daysUntilDueDate?: number;
    pregnancyWeek?: number;
    status: string;
    /** Stable identity for the resolved content, e.g. "flagship-day-198" or "post-birth-day-12". Used to key completion records — never key completion by "today", since users can browse other dates. */
    contentId: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function parseReps(reps?: string): number | null {
  if (!reps) return null;
  const rightOfCross = reps.split(/[×x]/).pop() ?? reps;
  const m = rightOfCross.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function toProgramExercise(ex: ResolvedWorkoutExercise, index: number): ProgramExercise {
  const detailParts = [
    ex.rpe != null && `RPE ${ex.rpe}`,
    ex.rir != null && `RIR ${ex.rir}`,
    ex.tempo && `Tempo ${ex.tempo}`,
    ex.tactileCue,
    ex.substitutions.length > 0 && `Sub: ${ex.substitutions.map((sub) => sub.name).join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");
  return {
    name: `${index + 1}. ${ex.displayName}`,
    detail: detailParts,
    type: "exercise",
    sets: typeof ex.sets === "number" ? ex.sets : Number.parseInt(ex.sets, 10) || null,
    reps: parseReps(ex.reps),
    percentage: null,
    seconds: null,
    video_url: ex.videoUrl ?? null,
    video_type: ex.videoUrl ? "upload" : null,
    rest: ex.restSeconds,
    rir: ex.rir != null ? String(ex.rir) : null,
  };
}

function trainingResult(
  day: FlagshipDay | FlagshipPostBirthDay,
  workoutId: string,
  version: WorkoutVersion,
  base: FlagshipDayResult["meta"],
): FlagshipDayResult {
  const workout = resolveWorkoutById(workoutId, version);
  const exercises = workout.exercises.map(toProgramExercise);
  return {
    label: day.title ?? workout.name,
    exercises,
    meta: { ...base, objective: day.objective ?? workout.objective },
  };
}

function nonTrainingResult(
  day: FlagshipDay | FlagshipPostBirthDay,
  base: FlagshipDayResult["meta"],
): FlagshipDayResult {
  return {
    label: day.title,
    exercises: [],
    meta: {
      ...base,
      objective: day.objective,
      activities: day.activities,
      completionCriteria: day.completionCriteria,
      completionMessage: day.completionMessage,
    },
  };
}

/** Returns `null` when there's no flagship state (e.g. missing due date). */
export async function loadFlagshipDay(
  userId: string,
  version: WorkoutVersion = "full",
  selectedDate?: Date,
): Promise<FlagshipDayResult | null> {
  const { data: profile } = await db
    .from("profiles")
    .select("due_date, baby_arrived_at")
    .eq("user_id", userId)
    .maybeSingle();

  const resolved = getFlagshipJourneyDay({
    dueDate: profile?.due_date ?? null,
    babyArrivedAt: profile?.baby_arrived_at ?? null,
    coachAssignment: null,
    now: selectedDate ?? new Date(),
  });

  if (resolved.status === "needs-due-date") {
    return {
      label: "Set your due date",
      exercises: [],
      meta: {
        dayType: "transition",
        isRequired: false,
        stageId: "unset",
        status: resolved.status,
        objective: "Add your due date to unlock the M2F Guided Journey.",
        contentId: "flagship-needs-due-date",
      },
    };
  }

  if (resolved.status === "pre-program") {
    return {
      label: `Journey starts in ${resolved.daysUntilProgramStart} days`,
      exercises: [],
      meta: {
        dayType: "transition",
        isRequired: false,
        stageId: "pre-program",
        status: resolved.status,
        objective:
          "You're early. Use this time for onboarding, baseline assessment, and setup.",
        contentId: `flagship-pre-program-${resolved.scheduledStartDate}`,
      },
    };
  }

  if (resolved.status === "post-due-date") {
    return {
      label: "Birth Window",
      exercises: [],
      meta: {
        dayType: "birth-window",
        isRequired: false,
        stageId: "birth-window",
        status: resolved.status,
        objective: "Training is optional. Stay available for your family.",
        activities: [
          { type: "walking", target: "as desired", intensity: "easy" },
          { type: "mobility", target: "if helpful", intensity: "easy" },
          { type: "rest", target: "prioritize", intensity: "none" },
        ],
        contentId: `flagship-birth-window-${resolved.daysPastDueDate}`,
      },
    };
  }

  if (resolved.status === "post-birth") {
    const day = resolved.day;
    if (!day) return null;
    const base: FlagshipDayResult["meta"] = {
      postpartumDay: resolved.postpartumDay,
      dayType: day.dayType,
      isRequired: day.isRequired,
      stageId: resolved.stageId,
      stageName: day.stageName,
      status: resolved.status,
      contentId: resolved.dayContentId,
    };
    if (day.dayType === "training" && day.workoutId) {
      return trainingResult(day, day.workoutId, version, base);
    }
    return nonTrainingResult(day, base);
  }

  if (resolved.status !== "active") return null;

  // status === "active"
  const day = resolved.day;
  const base: FlagshipDayResult["meta"] = {
    programDay: resolved.programDay,
    dayType: day.dayType,
    isRequired: day.isRequired,
    stageId: day.stageId,
    stageName: day.stageName,
    daysUntilDueDate: resolved.daysUntilDueDate,
    pregnancyWeek: resolved.pregnancyWeek,
    status: resolved.status,
    contentId: resolved.dayContentId,
  };
  if (day.dayType === "training" && day.workoutId) {
    return trainingResult(day, day.workoutId, version, base);
  }
  return nonTrainingResult(day, base);
}
