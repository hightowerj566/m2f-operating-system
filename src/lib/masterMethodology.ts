/**
 * M2F Master Workout Programming Methodology
 * ============================================
 * Reference document for program generation and auditing.
 * This file defines the rules, volume targets, and structure
 * that all M2F programs must follow.
 */

// ─── Equipment Assumptions ───
// Full commercial gym: barbells, dumbbells, cables, plate-loaded machines,
// leg press, leg curl/extension, lat pulldown, kettlebells, medicine balls,
// sleds, rowers, assault bikes.
// Machine exercises are encouraged for hypertrophy (hack squat, leg press,
// chest supported row, machine chest press, leg curl/extension, rear delt machine).

// ─── Annual Training Structure (4 × ~12 weeks) ───
export const PHASES = {
  1: {
    name: "Physique Build",
    goal: "Increase muscle mass and structural balance",
    emphasis: "higher hypertrophy volume, moderate intensity, joint health",
    conditioning: "1 Zone 2 session + 1 metabolic finisher weekly",
  },
  2: {
    name: "Strength & Performance",
    goal: "Increase maximal strength and neural efficiency",
    emphasis: "heavier compounds, explosive training, slightly reduced hypertrophy volume",
    conditioning: "1 Zone 2 session + 1 interval conditioning session",
  },
  3: {
    name: "Physique Refinement",
    goal: "Improve body composition while maintaining muscle",
    emphasis: "moderate hypertrophy, metabolic stress, slightly increased conditioning",
    conditioning: "1 Zone 2 session + 2 metabolic finishers",
  },
  4: {
    name: "Athletic Capacity",
    goal: "Improve work capacity, athletic movement, and durability",
    emphasis: "explosive movements, carries, athletic drills, balanced hypertrophy",
    conditioning: "1 Zone 2 session + 1 interval session + 1 metabolic finisher",
  },
} as const;

// ─── Weekly Splits ───
export const FIVE_DAY_SPLIT = {
  1: "Lower Body — Squat Emphasis (Knee Dominant)",
  2: "Upper Body — Horizontal Push Emphasis",
  3: "Zone 2 Aerobic / Active Recovery",
  4: "Lower Body — Hinge Emphasis (Posterior Chain)",
  5: "Upper Body — Vertical Push Emphasis",
} as const;

export const SIX_DAY_SPLIT = {
  1: "Lower Body — Squat Emphasis (Knee Dominant)",
  2: "Upper Body — Horizontal Push Emphasis",
  3: "Zone 2 Aerobic / Active Recovery",
  4: "Lower Body — Hinge Emphasis (Posterior Chain)",
  5: "Upper Body — Vertical Push Emphasis",
  6: "Athletic Conditioning (Session Identity EMOM)",
} as const;

// ─── Session Template (7 layers) ───
export const SESSION_TEMPLATE = [
  "A — Explosive Primer (3-5 sets × 2-5 reps, low fatigue)",
  "B — Primary Strength Lift (4-5 sets × 3-6 reps, 2-3 min rest, RIR 1-2)",
  "C — Secondary Compound Lift (3-4 sets × 6-10 reps, 90s rest)",
  "D1 — Primary Hypertrophy Block (3-4 supersets × 10-15 reps, 60-90s rest)",
  "D2 — Secondary Hypertrophy Block (3-4 supersets × 10-15 reps, 60-90s rest)",
  "E — Structural / Prehab Work",
  "F — Conditioning Finisher (optional, 6-10 min)",
] as const;

// ─── Required Weekly Volume Targets (effective sets) ───
export const VOLUME_TARGETS = {
  back:       { min: 16, max: 20 },
  chest:      { min: 12, max: 16 },
  shoulders:  { min: 12, max: 16 },
  biceps:     { min: 10, max: 14 },
  triceps:    { min: 10, max: 14 },
  quads:      { min: 12, max: 16 },
  hamstrings: { min: 10, max: 14 },
  glutes:     { min: 12, max: 18 },
  calves:     { min: 8,  max: 12 },
  core:       { min: 8,  max: 12 },
} as const;

// Pulling volume must exceed pressing volume by 30-50%.

// ─── Effective Set Counting ───
// Primary muscle = 1 full set
// Major secondary muscle = ~0.5 set
// Minor stabilizers = 0 sets
export const COMPOUND_CONTRIBUTIONS: Record<string, Record<string, number>> = {
  // Upper pressing
  "Bench Press":       { chest: 1, triceps: 0.5 },        // front delts = stabilizer (0)
  "Incline Press":     { chest: 1, triceps: 0.5 },        // front delts = stabilizer (0)
  "Close-Grip Bench":  { triceps: 1, chest: 0.5 },
  "Overhead Press":    { shoulders: 1, triceps: 0.5 },
  "Dip":               { chest: 1, triceps: 0.5 },

  // Upper pulling
  "Row":               { back: 1, biceps: 0.5 },          // rear delts = stabilizer (0)
  "Pullup/Pulldown":   { back: 1, biceps: 0.5 },
  "Face Pull":         { back: 1 },                        // rear delt prime mover counted as back
  "Straight Arm Pulldown": { back: 1 },

  // Lower
  "Squat":             { quads: 1, glutes: 0.5 },         // erectors = stabilizer (0)
  "Leg Press":         { quads: 1, glutes: 0.5 },
  "Lunge/Split Squat": { quads: 1, glutes: 0.5 },
  "Deadlift/Hinge":    { glutes: 1, hamstrings: 1 },      // erectors = stabilizer (0)
  "Hip Thrust":        { glutes: 1 },                      // hamstrings = stabilizer (0)
  "GHR/Nordic":        { hamstrings: 1 },

  // Isolation = 1 full set to target muscle, 0 elsewhere
};

// ─── Volume Progression Model (per mesocycle) ───
// Week 1: Base volume
// Week 2: +1 set on major groups
// Week 3: Peak volume
// Week 4: Deload (reduced volume)

// ─── Intensity Techniques ───
// Rebuild: 0-2 per week (myo-reps, drop sets on accessories only)
// Perform: 2-4 per week
// Never on heavy compound lifts.

// ─── Conditioning ───
// Zone 2: 1×20-30 min, HR 120-140 bpm
// Intervals: 20s work / 100s recovery, 6-10 rounds
// Finishers: 6-10 min (EMOM, AMRAP, sled, carry circuits)
// No finishers after heavy lower body sessions.
//
// ─── Day 6 EMOM Duration (Phase-Scaled) ───
// Perform: BUILD = 30 min, STRENGTH = 35 min, PEAK = 40 min
// Rebuild: 25-30 min (all phases)

// ─── Primary Lift Progression ───
// Primary compound lifts MUST remain the same for the entire 4-week mesocycle.
// Progression within the mesocycle occurs through:
//   • increased load
//   • increased reps within the rep range
//   • reduced RIR according to phase progression
// Primary lifts must NOT change week-to-week.
// Only at the start of a new mesocycle may the primary lift rotate
// to a new variation within the same movement category.
// Example:
//   Mesocycle A (Wk 1-4): Back Squat
//   Mesocycle B (Wk 5-8): Front Squat
//   Mesocycle C (Wk 9-12): Safety Bar Squat

// ─── Exercise Rotation (every ~4 weeks / mesocycle) ───
export const ROTATION_EXAMPLES = {
  squat:  ["Back Squat", "Front Squat", "Safety Bar Squat", "Tempo Squat"],
  hinge:  ["Romanian Deadlift", "Trap Bar Deadlift", "Block Pull", "Good Morning"],
  press:  ["Barbell Bench Press", "Incline DB Press", "Close Grip Bench", "Machine Press"],
  row:    ["Chest Supported Row", "DB Row", "Seal Row", "Cable Row"],
} as const;

// ─── Movement Pattern Organization ───
// Upper Days:
//   Heavy Upper (Day 1): Primary = Horizontal Push or Row, Secondary = opposite pattern
//   Hypertrophy Upper (Day 4): Primary = Vertical Push or Row, Secondary = opposite pattern
//
// Lower Days (rotate across mesocycles):
//   Rotation A: Squat dominant
//   Rotation B: Hinge dominant
//   Rotation C: Unilateral / athletic emphasis
// Movement pattern emphasis stays consistent within the mesocycle while exercises progress.

// ─── Upper Body Priority Rotation ───
// Day A: Heavy Chest + Heavy Back, Volume Shoulders
// Day B: Heavy Shoulders, Volume Chest + Back
// Day C: Heavy Back, Volume Chest + Shoulders

// ─── Lower Body Priority Rotation ───
// Day A: Heavy Squat, Posterior Chain Volume
// Day B: Heavy Hinge, Quad Volume
// Day C: Unilateral / Athletic, Glute + Hamstring Volume

// ─── Muscle Stimulus Distribution ───
// Each major muscle needs 3 stimulus types weekly:
//   1. Heavy compound
//   2. Moderate compound
//   3. Pump / isolation movement

// ─── Auto-Correction ───
// If volume falls short, add low-fatigue exercises:
//   cable rows, lateral raises, leg extensions, hamstring curls,
//   machine presses, rear delt raises

// ─── Output Quality Check ───
// 1. All muscles meet minimum stimulus targets
// 2. Pulling volume exceeds pressing volume by 30-50%
// 3. No muscle group exceeds recoverable limits
// 4. Conditioning does not interfere with recovery
