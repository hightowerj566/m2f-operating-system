// Builds the immutable weekly performance snapshot at check-in submission.
// Reads existing M2F tables — never duplicates their data, only persists a
// point-in-time summary so historical coach reviews remain accurate.

import { supabase } from "@/integrations/supabase/client";
import { weekRange, previousWeekStart, parseISODateLocal } from "./weekLogic";
import type { WeeklySnapshotInput } from "./coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (nums: number[]) => (nums.length ? round1(nums.reduce((a, b) => a + b, 0) / nums.length) : null);
const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : null);

// Pure calculators (unit-testable) --------------------------------------------

export function calcWorkoutCompliance(completed: number, scheduled: number | null): number | null {
  if (scheduled == null || scheduled <= 0) return null;
  return Math.min(100, pct(completed, scheduled) ?? 0);
}

export function calcNutritionCompliance(compliances: string[], daysInWeek = 7): {
  daysLogged: number; compliancePct: number | null;
} {
  const daysLogged = compliances.length;
  if (daysLogged === 0) return { daysLogged: 0, compliancePct: null };
  const onTarget = compliances.filter((c) => c === "at").length;
  return { daysLogged, compliancePct: pct(onTarget, daysInWeek) };
}

export function calcWeeklyWeightAvg(weights: number[]): number | null {
  return avg(weights);
}

export function calcReadinessDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return round1(current - previous);
}

export function calcStandardsCompletion(rows: Record<string, boolean>[]): number | null {
  if (!rows.length) return null;
  const keys = ["wake_on_time","workout_completed","protein_hit","steps_hit","scripture_read","family_time","no_phone_at_dinner","hydration_hit"];
  let done = 0, total = 0;
  for (const r of rows) for (const k of keys) { total++; if (r[k]) done++; }
  return pct(done, total);
}

// Snapshot builder ------------------------------------------------------------

export async function buildWeeklySnapshot(userId: string, checkInId: string, weekStart: string): Promise<WeeklySnapshotInput> {
  const { start, end } = weekRange(weekStart);
  const prevStart = previousWeekStart(weekStart);
  const { end: prevEnd } = weekRange(prevStart);

  const [
    profileRes, weightsRes, prevWeightsRes, workoutsRes, nutritionRes,
    assessmentsRes, standardsRes, milestonesRes, lessonsRes, missionRes, programRes, macrosRes,
  ] = await Promise.all([
    db.from("profiles").select("due_date, goal").eq("user_id", userId).maybeSingle(),
    db.from("daily_weights").select("weight_lbs").eq("user_id", userId).gte("weigh_date", start).lte("weigh_date", end),
    db.from("daily_weights").select("weight_lbs").eq("user_id", userId).gte("weigh_date", prevStart).lte("weigh_date", prevEnd),
    db.from("workout_logs").select("workout_date").eq("user_id", userId).gte("workout_date", start).lte("workout_date", end),
    db.from("daily_check_ins").select("compliance, actual_calories, actual_protein_g").eq("user_id", userId).gte("check_date", start).lte("check_date", end),
    db.from("assessments").select("total_score, taken_at").eq("user_id", userId).order("taken_at", { ascending: false }).limit(2),
    db.from("daily_standards").select("*").eq("user_id", userId).gte("standard_date", start).lte("standard_date", end),
    db.from("user_milestones").select("milestone_id, completed_at").eq("user_id", userId).gte("completed_at", `${start}T00:00:00`).lte("completed_at", `${end}T23:59:59`),
    db.from("learn_progress").select("lesson_slug").eq("user_id", userId).not("completed_at", "is", null).gte("completed_at", `${start}T00:00:00`).lte("completed_at", `${end}T23:59:59`),
    db.from("user_missions").select("status").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
    db.from("program_assignments").select("program_id, current_day").eq("user_id", userId).order("assigned_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("macro_targets").select("calories, protein_g, carbs_g, fat_g").eq("user_id", userId).maybeSingle(),
  ]);

  // Weight
  const weights: number[] = (weightsRes.data ?? []).map((w: { weight_lbs: number }) => Number(w.weight_lbs));
  const prevWeights: number[] = (prevWeightsRes.data ?? []).map((w: { weight_lbs: number }) => Number(w.weight_lbs));
  const weeklyAvg = calcWeeklyWeightAvg(weights);
  const prevAvg = calcWeeklyWeightAvg(prevWeights);
  const weightChange = weeklyAvg != null && prevAvg != null ? round1(weeklyAvg - prevAvg) : null;

  // Workouts: unique workout days this week. Scheduled defaults conservatively to
  // the assigned program's cadence if known, else null ("Not enough data").
  const workoutDays = new Set((workoutsRes.data ?? []).map((w: { workout_date: string }) => w.workout_date));
  const workoutsCompleted = workoutDays.size;
  const workoutsScheduled: number | null = programRes.data ? 3 : null; // default cadence; refine when scheduler exposes per-week counts
  const workoutCompliance = calcWorkoutCompliance(workoutsCompleted, workoutsScheduled);

  // Nutrition
  const nRows: { compliance: string; actual_calories: number | null; actual_protein_g: number | null }[] = nutritionRes.data ?? [];
  const { daysLogged, compliancePct } = calcNutritionCompliance(nRows.map((r) => r.compliance));
  const avgCalories = avg(nRows.map((r) => r.actual_calories).filter((v): v is number => v != null));
  const avgProtein = avg(nRows.map((r) => r.actual_protein_g).filter((v): v is number => v != null));

  // Readiness
  const assessments: { total_score: number }[] = assessmentsRes.data ?? [];
  const readiness = assessments[0]?.total_score ?? null;
  const prevReadiness = assessments[1]?.total_score ?? null;

  // Phase / due date
  const dueDate: string | null = profileRes.data?.due_date ?? null;
  let daysUntilDue: number | null = null;
  let babyAgeDays: number | null = null;
  if (dueDate) {
    const diff = Math.round((parseISODateLocal(dueDate).getTime() - Date.now()) / 86400000);
    if (diff >= 0) daysUntilDue = diff;
    else babyAgeDays = -diff;
  }

  return {
    check_in_id: checkInId,
    workouts_scheduled: workoutsScheduled,
    workouts_completed: workoutsCompleted,
    workout_compliance_pct: workoutCompliance,
    nutrition_days_logged: daysLogged,
    nutrition_compliance_pct: compliancePct,
    avg_calories: avgCalories,
    avg_protein_g: avgProtein,
    weekly_avg_weight: weeklyAvg,
    previous_week_avg_weight: prevAvg,
    weight_change: weightChange,
    readiness_score: readiness,
    previous_readiness_score: prevReadiness,
    readiness_delta: calcReadinessDelta(readiness, prevReadiness),
    standards_completion_pct: calcStandardsCompletion(standardsRes.data ?? []),
    build_tasks_completed: (milestonesRes.data ?? []).length,
    lessons_completed: (lessonsRes.data ?? []).length,
    mission_completed: missionRes.data ? missionRes.data.status === "completed" : null,
    days_until_due: daysUntilDue,
    baby_age_days: babyAgeDays,
    phase_slug: null, // resolved in UI via lib/phases from days_until_due / baby_age_days
    program_id: programRes.data?.program_id ?? null,
    snapshot_json: {
      goal: profileRes.data?.goal ?? null,
      macro_targets: macrosRes.data ?? null,
      workout_dates: Array.from(workoutDays),
      weights_logged: weights.length,
    },
  };
}
