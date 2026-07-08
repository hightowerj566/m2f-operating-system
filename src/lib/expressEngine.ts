/**
 * Express Engine
 * Provides express workout data when the user selects the "Express" training schedule.
 * Maps a program day number to the correct express workout based on cycle position, phase, and rotation.
 */

import expressData from "@/data/express_workouts.json";
import { getWeekAdjustedReps, getWeekTechnique, cleanNotesForWeek } from "@/lib/weekAdjustments";

interface ExpressExercise {
  order: number;
  exercise: string;
  sets: string;
  reps: string;
  rir: string;
  rest: string;
  notes: string;
}

interface ExpressPhase {
  target_time_minutes: number;
  exercises: ExpressExercise[];
}

interface ExpressDay {
  name: string;
  theme: string;
  P1: ExpressPhase;
  P2: ExpressPhase;
}

const PROGRAM_KEY_MAP: Record<string, string> = {
  "M2F Perform 2.0": "PERFORM",
  "M2F Rebuild 2.0": "REBUILD",
};

// ─── Mesocycle Rotation Maps ───
// Rotation A = weeks 1-4, B = weeks 5-8, C = weeks 9-12, deload = 13
// Primary/secondary lifts rotate with barbell/DB/machine variations.
// Cables are reserved for accessories (face pulls, flies, curls, pushdowns).

type RotationMap = Record<string, { A: string; B: string; C: string; notesA?: string; notesB?: string; notesC?: string }>;

const PERFORM_ROTATIONS: RotationMap = {
  // Day 1 — Heavy Upper
  "Barbell Bench Press":        { A: "Barbell Bench Press",        B: "Incline Barbell Bench Press",  C: "Close-Grip Bench Press" },
  "Incline DB Press (neutral)": { A: "Incline DB Press (neutral)", B: "DB Flat Press (neutral grip)", C: "DB Arnold Press" },
  "Weighted Pull-up":           { A: "Weighted Pull-up",           B: "Weighted Chin-up",             C: "Weighted Pull-up (wide)" },
  "Tricep Rope Pushdown":       { A: "Tricep Rope Pushdown",       B: "Overhead Tricep Extension",    C: "Tricep Dip (bodyweight)" },

  // Day 2 — Heavy Lower
  "Back Squat":                 { A: "Back Squat",                 B: "Front Squat",                  C: "Safety Bar Squat" },
  "Romanian Deadlift":          { A: "Romanian Deadlift",          B: "Stiff-Leg Deadlift",           C: "DB Romanian Deadlift" },
  "Bulgarian Split Squat (DB)": { A: "Bulgarian Split Squat (DB)", B: "Walking Lunge (DB)",           C: "Reverse Lunge (DB)" },
  "Hip Thrust (barbell)":       { A: "Hip Thrust (barbell)",       B: "Barbell Glute Bridge",         C: "Hip Thrust (single leg)" },

  // Day 4 — Hypertrophy Upper + Biceps
  "Barbell Overhead Press":     { A: "Barbell Overhead Press",     B: "Push Press",                   C: "Seated DB Shoulder Press" },
  "DB Flat Press (neutral grip)":{ A: "DB Flat Press (neutral grip)", B: "Machine Chest Press",       C: "Incline DB Press" },
  "Weighted Chin-up":           { A: "Weighted Chin-up",           B: "SA DB Row",                    C: "Chest-Supported DB Row" },
  "Incline DB Curl":            { A: "Incline DB Curl",            B: "Hammer Curl (DB)",             C: "Preacher Curl (DB)" },

  // Day 5 — Hypertrophy Lower + Triceps
  "Conventional Deadlift":      { A: "Conventional Deadlift",      B: "Trap Bar Deadlift",            C: "Sumo Deadlift" },
  "Hack Squat / Heel-Elevated Goblet Squat": { A: "Hack Squat",   B: "Leg Press",                    C: "Heel-Elevated Goblet Squat" },
  "Leg Curl (seated)":          { A: "Leg Curl (seated)",          B: "Leg Curl (lying)",             C: "Nordic Hamstring Curl" },
  "Cable Pull-Through":         { A: "DB Hip Thrust",              B: "Barbell Glute Bridge",         C: "Single-Leg Hip Thrust" },

  // Day 6 — Athletic Conditioning
  "KB Snatch":                  { A: "KB Snatch",                  B: "KB Clean and Press",           C: "DB Hang Power Clean" },
  "Clean Pull + Shrug":         { A: "Clean Pull + Shrug",         B: "Hang High Pull",               C: "Med Ball Slam" },
};

const REBUILD_ROTATIONS: RotationMap = {
  // Day 1 — Heavy Upper
  "DB Bench Press":             { A: "DB Bench Press",             B: "Incline DB Press",             C: "DB Floor Press" },
  "Lat Pulldown":               { A: "Lat Pulldown",               B: "SA DB Row",                    C: "Chest-Supported DB Row" },
  "Cable Fly (mid)":            { A: "DB Fly",                     B: "Machine Chest Fly",            C: "Incline DB Fly" },

  // Day 2 — Heavy Lower
  "Goblet Squat":               { A: "Goblet Squat",               B: "Heel-Elevated Goblet Squat",   C: "DB Front Squat" },
  "Goblet Squat (paused)":      { A: "Goblet Squat (paused)",      B: "Heel-Elevated Goblet Squat (paused)", C: "DB Front Squat (paused)" },
  "DB Romanian Deadlift":       { A: "DB Romanian Deadlift",       B: "DB Stiff-Leg Deadlift",        C: "Single-Leg DB RDL" },
  "Hip Thrust (DB)":            { A: "Hip Thrust (DB)",            B: "Barbell Glute Bridge",          C: "Single-Leg Hip Thrust" },

  // Day 4 — Hypertrophy Upper + Biceps
  "DB Shoulder Press":          { A: "DB Shoulder Press",          B: "DB Arnold Press",               C: "Seated DB Lateral-to-Press" },
  "Incline DB Press":           { A: "Incline DB Press",           B: "Machine Chest Press",           C: "DB Flat Press (neutral grip)" },
  "Cable Row":                  { A: "SA DB Row",                  B: "Chest-Supported DB Row",        C: "Machine Row" },
  "DB Curl":                    { A: "DB Curl",                    B: "Hammer Curl (DB)",              C: "Incline DB Curl" },
  "Incline DB Curl":            { A: "Incline DB Curl",            B: "Hammer Curl (DB)",              C: "Preacher Curl (DB)" },

  // Day 5 — Hypertrophy Lower + Triceps
  "Trap Bar Deadlift":          { A: "Trap Bar Deadlift",          B: "DB Romanian Deadlift (heavy)",  C: "Sumo DB Deadlift" },
  "Trap Bar Deadlift (paused)": { A: "Trap Bar Deadlift (paused)", B: "DB RDL (heavy, paused)",        C: "Sumo DB Deadlift (paused)" },
  "Overhead Tricep Extension":  { A: "Overhead Tricep Extension",  B: "Skull Crusher (DB)",            C: "Close-Grip DB Press" },

  // Day 6 — Athletic Conditioning
  "KB Clean and Press":         { A: "KB Clean and Press",         B: "KB Snatch",                     C: "DB Hang Clean" },
  "KB Goblet Squat":            { A: "KB Goblet Squat",            B: "KB Front Squat",                C: "KB Sumo Squat" },
  "KB Goblet Squat (paused)":   { A: "KB Goblet Squat (paused)",   B: "KB Front Squat (paused)",       C: "KB Sumo Squat (paused)" },
};

function getRotation(week: number): "A" | "B" | "C" {
  if (week <= 4) return "A";
  if (week <= 8) return "B";
  return "C";
}

function applyRotation(exercise: string, programKey: string, rotation: "A" | "B" | "C"): string {
  const map = programKey === "PERFORM" ? PERFORM_ROTATIONS : REBUILD_ROTATIONS;
  const entry = map[exercise];
  if (entry) return entry[rotation];
  return exercise;
}

/**
 * Get the express workout for a given program day number.
 * Returns null if not an eligible program or day position is 7 (rest).
 */
export function getExpressWorkout(
  programName: string,
  dayNum: number
): { label: string; exercises: { name: string; detail: string; type: "exercise"; sets: number | null; reps: number | null; percentage: null; seconds: null; video_url: null; video_type: null; rir: string | null; rest?: number }[] } | null {
  const key = PROGRAM_KEY_MAP[programName];
  if (!key) return null;

  // Position within the 7-day cycle (1-7)
  const pos = ((dayNum - 1) % 7) + 1;
  if (pos === 7) return null; // rest day

  // Which week are we in? (1-indexed)
  const week = Math.ceil(dayNum / 7);
  // P1 = weeks 1-5, P2 = weeks 6+
  const phase = week <= 5 ? "P1" : "P2";
  const rotation = getRotation(week);

  const programData = (expressData as any).program_express_workouts[key];
  if (!programData) return null;

  const dayData = programData[`day_${pos}`] as ExpressDay | undefined;
  if (!dayData) return null;

  const phaseData = dayData[phase];
  if (!phaseData) return null;

  const exercises = phaseData.exercises.map((ex: ExpressExercise) => {
    // Apply mesocycle rotation to exercise name
    const rotatedName = applyRotation(ex.exercise, key, rotation);

    // Parse rest seconds from string like "3 min", "90s", "75s"
    let restSeconds: number | undefined;
    const restMatch = ex.rest.match(/^(\d+)\s*min$/i);
    if (restMatch) {
      restSeconds = parseInt(restMatch[1]) * 60;
    } else {
      const secMatch = ex.rest.match(/^(\d+)\s*s$/i);
      if (secMatch) restSeconds = parseInt(secMatch[1]);
    }

    // Apply week-specific rep adjustments
    const adjustedReps = getWeekAdjustedReps(ex.reps, ex.notes, week);
    const technique = getWeekTechnique(ex.notes, week);
    const cleanedNotes = cleanNotesForWeek(ex.notes, week);

    // Build detail string: sets x reps + RIR + notes
    const detailParts: string[] = [];
    detailParts.push(`${ex.sets} × ${adjustedReps}`);
    if (ex.rir !== "N/A") detailParts.push(`RIR ${ex.rir}`);
    if (technique) detailParts.push(technique);
    if (cleanedNotes) detailParts.push(cleanedNotes);

    return {
      name: `${ex.order}. ${rotatedName}`,
      detail: detailParts.join(". "),
      type: "exercise" as const,
      sets: parseInt(ex.sets) || null,
      reps: null as number | null,
      percentage: null,
      seconds: null,
      video_url: null,
      video_type: null,
      rir: ex.rir !== "N/A" ? ex.rir : null,
      rest: restSeconds,
      repsRaw: adjustedReps,
    };
  });

  return {
    label: `${dayData.name} — Express (Wk ${week}, Rot ${rotation})`,
    exercises,
  };
}
