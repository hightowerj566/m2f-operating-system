import { supabase } from "@/integrations/supabase/client";

export type DifficultyRating = "easy" | "moderate" | "hard" | "very_hard";

/**
 * Get the phase number (1-4) for a given day within a 112-day program.
 */
export function getPhaseForDay(dayNum: number): number {
  if (dayNum <= 28) return 1;
  if (dayNum <= 56) return 2;
  if (dayNum <= 84) return 3;
  return 4;
}

/**
 * Get the position within a 7-day cycle (1-7).
 */
function getWeekPosition(dayNum: number): number {
  return ((dayNum - 1) % 7) + 1;
}

/**
 * Find the "same type" day from the previous week.
 * E.g., if today is Day 8 (Upper Strength, pos 1), the previous similar day was Day 1.
 */
export function getPreviousSimilarDay(dayNum: number): number | null {
  const pos = getWeekPosition(dayNum);
  const prevDay = dayNum - 7;
  if (prevDay < 1) return null;
  return prevDay;
}

/**
 * Save workout feedback to the database.
 */
export async function saveWorkoutFeedback(
  userId: string,
  programId: string,
  dayNumber: number,
  difficulty: DifficultyRating
): Promise<void> {
  const phase = getPhaseForDay(dayNumber);
  await supabase.from("workout_feedback" as any).insert({
    user_id: userId,
    program_id: programId,
    day_number: dayNumber,
    phase,
    difficulty,
    workout_date: new Date().toISOString().split("T")[0],
  } as any);
}

/**
 * Get the most recent feedback for a similar day type.
 */
export async function getLastFeedbackForSimilarDay(
  userId: string,
  programId: string,
  currentDay: number
): Promise<DifficultyRating | null> {
  const prevDay = getPreviousSimilarDay(currentDay);
  if (!prevDay) return null;

  const { data } = await supabase
    .from("workout_feedback" as any)
    .select("difficulty")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .eq("day_number", prevDay)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return (data[0] as any).difficulty as DifficultyRating;
  }
  return null;
}

export interface LoadRecommendation {
  exerciseName: string;
  lastWeight: number | null;
  recommendedWeight: number | null;
  adjustmentNote: string;
  setsAdjustment: number; // 0 = no change, -1 = reduce 1 set
  repsAdjustment: number; // 0 = no change, -1 or -2 for reduction
}

/**
 * Determine if an exercise is an upper body compound lift.
 */
function isUpperCompound(name: string): boolean {
  const upper = [
    "bench press", "incline bench", "close-grip bench", "db bench", "dumbbell bench",
    "overhead press", "strict press", "push press", "arnold press",
    "pull-up", "chin-up", "pullup", "lat pulldown",
  ];
  const lower = name.toLowerCase();
  return upper.some((u) => lower.includes(u));
}

/**
 * Determine if an exercise is a lower body compound lift.
 */
function isLowerCompound(name: string): boolean {
  const lower_lifts = [
    "squat", "deadlift", "rdl", "romanian", "trap bar", "front squat",
    "back squat", "hip thrust",
  ];
  const lower = name.toLowerCase();
  return lower_lifts.some((u) => lower.includes(u));
}

/**
 * Determine if an exercise is a primary compound (main lift).
 */
export function isCompoundLift(name: string): boolean {
  return isUpperCompound(name) || isLowerCompound(name);
}

/**
 * Calculate load adjustment based on feedback.
 * Returns a multiplier and notes.
 */
export function getLoadAdjustment(
  exerciseName: string,
  lastDifficulty: DifficultyRating
): { multiplier: number; note: string; setsAdj: number; repsAdj: number } {
  const isUpper = isUpperCompound(exerciseName);
  const isLower = isLowerCompound(exerciseName);
  const isCompound = isUpper || isLower;

  switch (lastDifficulty) {
    case "easy":
      if (isLower) {
        return { multiplier: 1.05, note: "↑ +5% — Last session felt easy", setsAdj: 0, repsAdj: 0 };
      }
      if (isUpper) {
        return { multiplier: 1.025, note: "↑ +2.5% — Last session felt easy", setsAdj: 0, repsAdj: 0 };
      }
      return { multiplier: 1.0, note: "Progress normally", setsAdj: 0, repsAdj: 0 };

    case "moderate":
      return { multiplier: 1.0, note: "On track — maintain progression", setsAdj: 0, repsAdj: 0 };

    case "hard":
      if (isCompound) {
        return { multiplier: 1.0, note: "→ Same weight — last session was hard", setsAdj: 0, repsAdj: 0 };
      }
      return { multiplier: 1.0, note: "Maintain current load", setsAdj: 0, repsAdj: 0 };

    case "very_hard":
      if (isCompound) {
        return { multiplier: 1.0, note: "⚠ Fatigue — maintain load, reduced volume", setsAdj: 0, repsAdj: -1 };
      }
      return { multiplier: 1.0, note: "⚠ Recovery — 1 fewer set on accessories", setsAdj: -1, repsAdj: 0 };

    default:
      return { multiplier: 1.0, note: "", setsAdj: 0, repsAdj: 0 };
  }
}

/**
 * Build load recommendations for a workout based on last feedback and logged weights.
 */
export async function getWorkoutRecommendations(
  userId: string,
  programId: string,
  currentDay: number,
  exercises: { name: string; sets: number | null; reps: number | null }[]
): Promise<LoadRecommendation[]> {
  const lastDifficulty = await getLastFeedbackForSimilarDay(userId, programId, currentDay);
  if (!lastDifficulty) return [];

  // Get last logged weights for compound exercises
  const compoundNames = exercises
    .filter((e) => isCompoundLift(e.name))
    .map((e) => e.name);

  if (compoundNames.length === 0) return [];

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("exercise_name, sets")
    .eq("user_id", userId)
    .in("exercise_name", compoundNames)
    .order("workout_date", { ascending: false })
    .limit(compoundNames.length * 2);

  // Build a map of last used weight per exercise
  const lastWeights: Record<string, number> = {};
  if (logs) {
    for (const log of logs as any[]) {
      if (lastWeights[log.exercise_name]) continue;
      const sets = log.sets as any[];
      if (sets && sets.length > 0) {
        // Get the heaviest weight used
        const maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
        if (maxWeight > 0) lastWeights[log.exercise_name] = maxWeight;
      }
    }
  }

  const recommendations: LoadRecommendation[] = [];
  for (const ex of exercises) {
    if (!isCompoundLift(ex.name)) continue;
    const lastWeight = lastWeights[ex.name] || null;
    const adj = getLoadAdjustment(ex.name, lastDifficulty);

    let recommendedWeight: number | null = null;
    if (lastWeight) {
      recommendedWeight = Math.round(lastWeight * adj.multiplier / 5) * 5; // Round to nearest 5
    }

    recommendations.push({
      exerciseName: ex.name,
      lastWeight,
      recommendedWeight,
      adjustmentNote: adj.note,
      setsAdjustment: adj.setsAdj,
      repsAdjustment: adj.repsAdj,
    });
  }

  return recommendations;
}
