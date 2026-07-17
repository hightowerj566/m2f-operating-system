// M2F OS · Post-birth training programs.
// Structure: Program → Phase → Week → Workout → Exercises, with each workout
// carrying Full / Express / Minimum versions. Stored in TS (same approach as
// src/data/*.json program seeds) — the existing Supabase program player is
// untouched. Pre-birth training remains the existing PERFORM/REBUILD system.
//
// Sample content only: one seeded week per program, enough to prove the
// phase → program → version pipeline end-to-end.

export type WorkoutVersion = "full" | "express" | "minimum";

export interface PBExercise {
  name: string;
  sets?: number;
  reps?: string;          // "8–10", "10 / side", "30 sec"
  rest?: string;          // "60–90 sec"
  effort?: string;        // RPE / RIR target
  substitution?: string;
  cue?: string;
  videoUrl?: string;
}

export interface PBWorkoutVersionSpec {
  minutes: string;        // "30–45"
  format?: string;        // e.g. "3 rounds, minimal rest"
  exercises: PBExercise[];
}

export interface PBWorkout {
  slug: string;
  name: string;
  week: number;
  day: number;
  equipment: string;
  difficulty: "easy" | "moderate" | "hard";
  objective: string;
  coachingNote: string;
  versions: Record<WorkoutVersion, PBWorkoutVersionSpec>;
}

export interface PBProgram {
  slug: string;
  name: string;
  phaseWindow: string;
  focus: string;
  workouts: PBWorkout[];
}

export const VERSION_LABELS: Record<WorkoutVersion, { label: string; hint: string }> = {
  full:    { label: "Full",    hint: "30–45 min · the complete session" },
  express: { label: "Express", hint: "15–20 min · the essentials" },
  minimum: { label: "Minimum", hint: "5–10 min · rough night? still counts" },
};

const survivalStrengthA: PBWorkout = {
  slug: "survival-strength-a",
  name: "Survival Strength A",
  week: 1,
  day: 1,
  equipment: "Dumbbells",
  difficulty: "easy",
  objective: "Maintain strength without creating unnecessary fatigue.",
  coachingNote: "Stop each strength set with approximately 2–3 good reps remaining.",
  versions: {
    full: {
      minutes: "30",
      exercises: [
        { name: "Goblet squat", sets: 3, reps: "8–10", rest: "90 sec", effort: "2–3 reps in reserve", substitution: "Bodyweight box squat", cue: "Elbows inside the knees at the bottom." },
        { name: "Dumbbell bench press", sets: 3, reps: "8–12", rest: "90 sec", effort: "2–3 reps in reserve", substitution: "Push-up", cue: "Feet planted, control the lowering." },
        { name: "One-arm dumbbell row", sets: 3, reps: "10 / side", rest: "60 sec", effort: "2–3 reps in reserve", substitution: "Band row", cue: "Pull to the hip, not the armpit." },
        { name: "Farmer carry", sets: 3, reps: "30 sec", rest: "60 sec", effort: "Heavy but tall posture", substitution: "Suitcase carry (one side)", cue: "Ribs down, shoulders back — this is the car-seat carry." },
        { name: "Dead bug", sets: 2, reps: "8 / side", rest: "45 sec", effort: "Slow and controlled", substitution: "Plank, 30 sec", cue: "Lower back stays glued to the floor." },
      ],
    },
    express: {
      minutes: "20",
      exercises: [
        { name: "Goblet squat", sets: 2, reps: "10", rest: "60 sec", effort: "2–3 reps in reserve" },
        { name: "Dumbbell bench press", sets: 2, reps: "10", rest: "60 sec", effort: "2–3 reps in reserve" },
        { name: "One-arm dumbbell row", sets: 2, reps: "10 / side", rest: "60 sec", effort: "2–3 reps in reserve" },
        { name: "Dead bug", sets: 2, reps: "8 / side", rest: "45 sec", effort: "Slow and controlled" },
      ],
    },
    minimum: {
      minutes: "10",
      format: "3 rounds, rest as needed",
      exercises: [
        { name: "Goblet squat", reps: "10" },
        { name: "Dumbbell press", reps: "10" },
        { name: "One-arm row", reps: "10 / side" },
        { name: "Carry or plank", reps: "20 sec" },
      ],
    },
  },
};

const survivalStrengthB: PBWorkout = {
  slug: "survival-strength-b",
  name: "Survival Strength B",
  week: 1,
  day: 3,
  equipment: "Dumbbells or bodyweight",
  difficulty: "easy",
  objective: "Hinge, push, and carry — the movement patterns fatherhood actually uses.",
  coachingNote: "If sleep was under five hours, drop to Minimum without a second thought.",
  versions: {
    full: {
      minutes: "30",
      exercises: [
        { name: "Dumbbell Romanian deadlift", sets: 3, reps: "8–10", rest: "90 sec", effort: "2–3 reps in reserve", substitution: "Hip hinge with backpack", cue: "Push the hips back; soft knees." },
        { name: "Overhead press", sets: 3, reps: "8–10", rest: "90 sec", effort: "2–3 reps in reserve", substitution: "Pike push-up", cue: "Squeeze glutes so the lower back doesn't arch." },
        { name: "Reverse lunge", sets: 3, reps: "8 / side", rest: "60 sec", effort: "2–3 reps in reserve", substitution: "Split squat", cue: "Step back, drop straight down." },
        { name: "Suitcase carry", sets: 3, reps: "30 sec / side", rest: "60 sec", effort: "Stay perfectly upright", cue: "One heavy dumbbell — resist the lean." },
        { name: "Side plank", sets: 2, reps: "20 sec / side", rest: "45 sec", effort: "Controlled" },
      ],
    },
    express: {
      minutes: "18",
      exercises: [
        { name: "Dumbbell Romanian deadlift", sets: 2, reps: "10", rest: "60 sec", effort: "2–3 reps in reserve" },
        { name: "Overhead press", sets: 2, reps: "10", rest: "60 sec", effort: "2–3 reps in reserve" },
        { name: "Reverse lunge", sets: 2, reps: "8 / side", rest: "60 sec" },
        { name: "Side plank", sets: 2, reps: "20 sec / side", rest: "45 sec" },
      ],
    },
    minimum: {
      minutes: "8",
      format: "3 rounds, rest as needed",
      exercises: [
        { name: "Hip hinge (RDL or bodyweight)", reps: "10" },
        { name: "Overhead press or pike push-up", reps: "10" },
        { name: "Reverse lunge", reps: "6 / side" },
        { name: "Side plank", reps: "15 sec / side" },
      ],
    },
  },
};

const foundationFullBodyA: PBWorkout = {
  slug: "foundation-full-body-a",
  name: "Foundation Full Body A",
  week: 1,
  day: 1,
  equipment: "Dumbbells",
  difficulty: "moderate",
  objective: "Rebuild structured training — full-body strength with progressive workload.",
  coachingNote: "Add a small amount of weight or a rep each week. Progress is the program.",
  versions: {
    full: {
      minutes: "40",
      exercises: [
        { name: "Goblet squat", sets: 4, reps: "8–10", rest: "2 min", effort: "2 reps in reserve", cue: "Heavier than Survival — earn the progression." },
        { name: "Dumbbell bench press", sets: 4, reps: "8–10", rest: "2 min", effort: "2 reps in reserve" },
        { name: "One-arm dumbbell row", sets: 3, reps: "10 / side", rest: "90 sec", effort: "2 reps in reserve" },
        { name: "Romanian deadlift", sets: 3, reps: "10", rest: "90 sec", effort: "2 reps in reserve" },
        { name: "Farmer carry", sets: 3, reps: "40 sec", rest: "60 sec" },
        { name: "Hanging knee raise or dead bug", sets: 3, reps: "10", rest: "60 sec" },
      ],
    },
    express: {
      minutes: "20",
      exercises: [
        { name: "Goblet squat", sets: 3, reps: "10", rest: "75 sec", effort: "2 reps in reserve" },
        { name: "Dumbbell bench press", sets: 3, reps: "10", rest: "75 sec", effort: "2 reps in reserve" },
        { name: "One-arm dumbbell row", sets: 2, reps: "10 / side", rest: "60 sec" },
        { name: "Farmer carry", sets: 2, reps: "40 sec", rest: "60 sec" },
      ],
    },
    minimum: {
      minutes: "10",
      format: "4 rounds, minimal rest",
      exercises: [
        { name: "Goblet squat", reps: "10" },
        { name: "Push-up or press", reps: "10" },
        { name: "Row", reps: "10 / side" },
        { name: "Carry", reps: "30 sec" },
      ],
    },
  },
};

const fatherAthleteA: PBWorkout = {
  slug: "father-athlete-a",
  name: "Father Athlete A",
  week: 1,
  day: 1,
  equipment: "Dumbbells or gym",
  difficulty: "hard",
  objective: "Long-term strength, hypertrophy, and conditioning — training as a permanent pillar.",
  coachingNote: "This is the long game. Rough-sleep days switch to Express or Minimum — the streak is consistency, not heroics.",
  versions: {
    full: {
      minutes: "45",
      exercises: [
        { name: "Front squat or goblet squat", sets: 4, reps: "6–8", rest: "2–3 min", effort: "1–2 reps in reserve" },
        { name: "Incline dumbbell press", sets: 4, reps: "8–10", rest: "2 min", effort: "2 reps in reserve" },
        { name: "Chest-supported row", sets: 4, reps: "10", rest: "90 sec", effort: "2 reps in reserve" },
        { name: "Romanian deadlift", sets: 3, reps: "8–10", rest: "2 min", effort: "2 reps in reserve" },
        { name: "Loaded carry medley", sets: 3, reps: "45 sec", rest: "75 sec", cue: "Farmer → suitcase → overhead. Airport-carry training." },
        { name: "Conditioning finisher", sets: 1, reps: "6 min", effort: "Hard but repeatable", substitution: "Bike, row, or hill walk" },
      ],
    },
    express: {
      minutes: "20",
      exercises: [
        { name: "Goblet squat", sets: 3, reps: "8", rest: "90 sec", effort: "1–2 reps in reserve" },
        { name: "Incline press", sets: 3, reps: "10", rest: "90 sec" },
        { name: "Row", sets: 3, reps: "10", rest: "75 sec" },
        { name: "Carry", sets: 2, reps: "45 sec", rest: "60 sec" },
      ],
    },
    minimum: {
      minutes: "10",
      format: "AMRAP 8 minutes, steady pace",
      exercises: [
        { name: "Squat", reps: "8" },
        { name: "Press", reps: "8" },
        { name: "Row", reps: "8 / side" },
        { name: "Carry or plank", reps: "30 sec" },
      ],
    },
  },
};

export const POST_BIRTH_PROGRAMS: PBProgram[] = [
  {
    slug: "new-dad-survival",
    name: "New Dad Survival",
    phaseWindow: "Birth – 6 weeks",
    focus: "Short sessions · low complexity · maintain strength · mobility · walking · recovery",
    workouts: [survivalStrengthA, survivalStrengthB],
  },
  {
    slug: "new-dad-foundation",
    name: "New Dad Foundation",
    phaseWindow: "6 – 12 weeks",
    focus: "Return to structured training · full-body strength · basic conditioning · progressive workload",
    workouts: [foundationFullBodyA],
  },
  {
    slug: "father-athlete",
    name: "Father Athlete",
    phaseWindow: "3 months onward",
    focus: "Strength · hypertrophy · conditioning · mobility · long-term health",
    workouts: [fatherAthleteA],
  },
];

export function programForSlug(slug: string): PBProgram | null {
  return POST_BIRTH_PROGRAMS.find((p) => p.slug === slug) ?? null;
}
