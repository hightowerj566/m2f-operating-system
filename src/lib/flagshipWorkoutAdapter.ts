// M2F OS · Flagship (M2F Guided Journey) → workout-tab adapter.
// The flagship program is code-driven (src/data/m2f_flagship_journey.json)
// and picks the right session from a member's due date / baby age via the
// day-based resolver. When the classic Workout tab is asked to render a day
// for this program, we bypass program_days and hand it either the mapped
// PBWorkout exercises OR a synthesized recovery / rest / birth-window card.

import { supabase } from "@/integrations/supabase/client";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";
import {
  getFlagshipWorkout,
  type FlagshipDay,
  type FlagshipPostBirthDay,
  type FlagshipWorkout,
} from "@/lib/training/flagshipJourney";
import type { WorkoutVersion } from "@/content/postBirthTraining";

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
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function parseRestSeconds(rest?: string): number | undefined {
  if (!rest) return undefined;
  const m = rest.match(/(\d+)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return /min/i.test(rest) ? n * 60 : n;
}

function parseReps(reps?: string): number | null {
  if (!reps) return null;
  const rightOfCross = reps.split(/[×x]/).pop() ?? reps;
  const m = rightOfCross.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseSets(reps?: string, sets?: number): number | null {
  if (typeof sets === "number") return sets;
  if (!reps) return null;
  const m = reps.match(/(\d+)\s*[×x]/);
  return m ? Number(m[1]) : null;
}

type SrcExercise = FlagshipWorkout["versions"]["full"]["exercises"][number];

function toProgramExercise(ex: SrcExercise, index: number): ProgramExercise {
  const detailParts = [ex.effort, ex.cue, ex.substitution && `Sub: ${ex.substitution}`]
    .filter(Boolean)
    .join(". ");
  return {
    name: `${index + 1}. ${ex.name}`,
    detail: detailParts,
    type: "exercise",
    sets: parseSets(ex.reps, ex.sets),
    reps: parseReps(ex.reps),
    percentage: null,
    seconds: null,
    video_url: null,
    video_type: null,
    rest: parseRestSeconds(ex.rest),
    rir: null,
  };
}

function pickVersion(preferred?: WorkoutVersion): WorkoutVersion {
  return preferred ?? "full";
}

function trainingResult(
  day: FlagshipDay | FlagshipPostBirthDay,
  workout: FlagshipWorkout,
  version: WorkoutVersion,
  base: FlagshipDayResult["meta"],
): FlagshipDayResult {
  const spec = workout.versions[pickVersion(version)] ?? workout.versions.full;
  const exercises = spec.exercises.map(toProgramExercise);
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
    };
    if (day.dayType === "training" && day.workoutId) {
      const wk = getFlagshipWorkout(day.workoutId);
      if (wk) return trainingResult(day, wk, version, base);
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
  };
  if (day.dayType === "training" && day.workoutId) {
    const wk = getFlagshipWorkout(day.workoutId);
    if (wk) return trainingResult(day, wk, version, base);
  }
  return nonTrainingResult(day, base);
}
