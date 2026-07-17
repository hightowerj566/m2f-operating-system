// M2F OS · Flagship (M2F Guided Journey) → workout-tab adapter.
// The flagship program is code-driven (src/data/m2f_training_programs.json)
// and picks the right session from a member's due date / baby age. When the
// classic Workout tab is asked to render a day for this program, we bypass
// program_days and hand it a PBWorkout mapped into the ProgramExercise shape.

import { supabase } from "@/integrations/supabase/client";
import { resolveJourney } from "@/lib/programJourney";
import type { PBExercise, PBWorkout, WorkoutVersion } from "@/content/postBirthTraining";

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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function parseRestSeconds(rest?: string): number | undefined {
  if (!rest) return undefined;
  // Prefer the first number ("2–3 min" → 2). Convert minutes to seconds.
  const m = rest.match(/(\d+)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return /min/i.test(rest) ? n * 60 : n;
}

function parseReps(reps?: string): number | null {
  if (!reps) return null;
  // Accept "3 × 8" (take rightmost), "10", "10-12" (take first), "AMRAP" → null.
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

function toProgramExercise(ex: PBExercise, index: number): ProgramExercise {
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

/** Returns `null` when the flagship has no session for today (rest day). */
export async function loadFlagshipDay(
  userId: string,
  version: WorkoutVersion = "full",
): Promise<FlagshipDayResult | null> {
  const { data: profile } = await db
    .from("profiles")
    .select("due_date, baby_arrived_at")
    .eq("user_id", userId)
    .maybeSingle();

  const journey = resolveJourney({
    dueDate: profile?.due_date ?? null,
    babyArrivedAt: profile?.baby_arrived_at ?? null,
    coachAssignment: null,
  });

  const workout: PBWorkout | null = journey.todayWorkout;
  if (!workout) return null;

  const spec = workout.versions[pickVersion(version)] ?? workout.versions.full;
  const exercises = spec.exercises.map(toProgramExercise);
  return {
    label: workout.name,
    exercises,
  };
}
