/**
 * M2F Transformation Challenge — Programming Methodology
 * ========================================================
 * Reference document for the 12-week Athletic Shred program.
 * Used by program generation, auditing, and future Forte integration.
 */

// ─── Program Overview ───
// 12 weeks total, 3 phases of 4 weeks each.
// Each phase = 1 mesocycle with exercise rotation, volume progression,
// conditioning progression, and intensity changes.
// Week 4 of each mesocycle = mini deload (reduced volume).

// ─── Training Split (Weekly) ───
export const WEEKLY_SPLIT = {
  1: "Monday — Upper Strength",
  2: "Tuesday — Lower Strength",
  3: "Wednesday — Aerobic Base + Core",
  4: "Thursday — Upper Hypertrophy",
  5: "Friday — Lower Hypertrophy",
  6: "Saturday — Hybrid Conditioning (EMOM)",
  7: "Sunday — Rest",
} as const;

// ─── Phase Structure ───
export const PHASES = {
  1: {
    name: "Foundation Shred",
    weeks: "1–4",
    goals: [
      "Maintain strength",
      "Establish aerobic base",
      "Build work capacity",
      "Begin fat loss",
    ],
    characteristics: "Moderate intensity, moderate volume, basic conditioning formats",
    tempo_primary: "3-1-1",
    tempo_secondary: "3-0-1",
    intensity_budget: "0–1 technique per workout",
  },
  2: {
    name: "Metabolic Build",
    weeks: "5–8",
    goals: [
      "Increase metabolic stress",
      "Increase conditioning capacity",
      "Maintain strength",
    ],
    characteristics: "Higher density training, more supersets, harder conditioning",
    tempo_primary: "2-0-1",
    tempo_secondary: "2-1-1",
    intensity_budget: "1–2 techniques per workout",
  },
  3: {
    name: "Peak Shred",
    weeks: "9–12",
    goals: [
      "Maximize calorie burn",
      "Maintain muscle mass",
      "Peak conditioning",
    ],
    characteristics: "Lower strength volume, more conditioning intensity, athletic circuits",
    tempo_primary: "2-0-X",
    tempo_secondary: "2-0-1",
    intensity_budget: "2–3 techniques per workout",
  },
} as const;

// ─── Strength Progression Model ───
// Week 1: Base load (RIR 3)
// Week 2: Slight load increase (RIR 2)
// Week 3: Peak loading (RIR 1)
// Week 4: Reduced volume / mini deload (RIR 4)
//
// Primary lifts: 3–6 reps
// Secondary lifts: 6–10 reps
// Accessory hypertrophy: 10–15 reps

// ─── Exercise Rotation Between Mesocycles ───
export const ROTATION_MAP = {
  squat: {
    phase1: "Back Squat",
    phase2: "Front Squat",
    phase3: "Tempo Back Squat",
  },
  hinge: {
    phase1: "Romanian Deadlift / Trap Bar Deadlift",
    phase2: "DB Stiff-Leg Deadlift / Sumo Deadlift",
    phase3: "Block Pull / Pause Deadlift",
  },
  horizontal_press: {
    phase1: "Barbell Bench Press",
    phase2: "Close-Grip Bench Press",
    phase3: "Floor Press",
  },
  vertical_press: {
    phase1: "Standing Overhead Press",
    phase2: "Z Press",
    phase3: "Seated DB Press",
  },
  row: {
    phase1: "Single-Arm DB Row",
    phase2: "Pendlay Row / Meadows Row",
    phase3: "Chest-Supported Row / Cable Row",
  },
  vertical_pull: {
    phase1: "Weighted Pullups",
    phase2: "Lat Pulldown",
    phase3: "Neutral Grip Pullups",
  },
} as const;

// ─── Shoulder Health Requirements ───
// Every upper session MUST include:
// • Rear delt work (face pulls, rear delt fly, reverse pec deck)
// • Scapular stability work (band pull-aparts, scap push-ups)
// • Rotator cuff work (band external rotations, prone Y raises)

// ─── Volume Targets (Weekly Effective Sets) ───
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

// Pulling volume must exceed pushing volume.

// ─── Conditioning System ───
export const CONDITIONING = {
  aerobic_base: {
    day: "Wednesday",
    format: "Zone 2 steady-state",
    duration_progression: { phase1: "25 min", phase2: "30 min", phase3: "35 min" },
    hr_target: "120–140 bpm",
  },
  interval_finishers: {
    days: "After Friday Lower Hypertrophy",
    format: "Short sprints or intervals",
    examples: ["Bike Sprints (15s on / 45s off × 8)", "Row 250m repeats × 8", "Tabata (20s/10s × 8)"],
    duration: "8–12 min",
  },
  saturday_emom: {
    structure: "Minute 1: Engine → Minute 2: Strength/Power → Minute 3: Engine → Minute 4: Skill/Gymnastics",
    duration_progression: {
      week1: "EMOM 28 (7 rounds)",
      week2: "EMOM 32 (8 rounds)",
      week3: "EMOM 36 (9 rounds)",
      week4: "EMOM 40 (10 rounds)",
    },
    time_cap: "30–45 sec work per minute, 15–30 sec rest",
  },
  weekly_cardio_volume: {
    phase1: "60–90 min",
    phase2: "90–120 min",
    phase3: "120–150 min",
  },
} as const;

// ─── Tempo Guidelines ───
// Format: eccentric – pause – concentric
// "X" = explosive concentric
//
// Use tempo on: hypertrophy, accessory, unilateral, machine, structural exercises
// Do NOT use on: Olympic lifts, explosive movements, sprints, heavy maximal lifts
//
// Tempo progresses from control-focused (Phase 1) to explosive (Phase 3)

// ─── Intensity Techniques ───
export const INTENSITY_TECHNIQUES = {
  approved: [
    "Myo-reps",
    "Drop sets",
    "Rest-pause sets",
    "Supersets",
    "Giant sets",
    "Mechanical drop sets",
  ],
  rules: [
    "Only apply to hypertrophy and accessory exercises",
    "Never apply to primary strength lifts",
    "Primarily use on: isolation, machine, arm, and shoulder exercises",
    "Apply only to last 1–2 sets",
    "Do not stack multiple techniques on the same movement",
  ],
  frequency: {
    phase1: "0–1 per workout",
    phase2: "1–2 per workout",
    phase3: "2–3 per workout",
  },
} as const;

// ─── Athlete Profile ───
// Busy fathers, intermediate lifters, full gym access
// 45–60 min sessions, moderate recovery capacity
// Goal: athletic physique that performs — not a bodybuilder or endurance specialist

// ─── EMOM Movement Libraries ───
export const EMOM_MOVEMENT_POOLS = {
  engine: [
    "Row calories (12–16 cal)",
    "Bike calories (12–16 cal)",
    "Ski erg calories (12–16 cal)",
    "Shuttle runs (150–200m)",
    "Jump rope (40–60 reps)",
    "Sled pushes",
    "Farmer carries (20–40m)",
  ],
  strength_power: [
    "Power Cleans (4–8 reps, 40–60% 1RM)",
    "DB Thrusters (8–15 reps)",
    "DB Snatches (8–15 reps)",
    "KB Swings (8–15 reps)",
    "Sandbag Cleans (8–15 reps)",
    "Goblet Squats (8–15 reps)",
    "Wall Balls (8–15 reps)",
  ],
  gymnastics_skill: [
    "Toes-to-Bar (10–15 reps)",
    "Pull-Ups (8–12 reps)",
    "Push-Ups (15–20 reps)",
    "Burpee Box Jumps (8–12 reps)",
    "Burpees (8–12 reps)",
    "Box Jumps (8–12 reps)",
    "Double Unders (40–60 reps)",
    "Air Squats (15–20 reps)",
  ],
} as const;

// ─── Fatigue Rotation Rule ───
// Avoid stacking fatigue on same muscle groups.
// Rotate stress between: cardiovascular, lower body, upper body, core/skill
// Good: Row → Cleans → Bike → TTB
// Bad: Thrusters → Wall Balls → Box Jumps (all lower-body dominant)

// ─── Output Quality Checks ───
// 1. All muscles meet minimum volume targets
// 2. Pulling volume exceeds pressing volume
// 3. Every upper session includes rear delt + scapular + cuff work
// 4. Exercise rotation occurs between phases
// 5. Intensity techniques scale per phase budget
// 6. Conditioning progresses weekly and across phases
// 7. Saturday EMOMs follow Engine-Strength-Engine-Skill structure
// 8. No muscle group exceeds recoverable limits
