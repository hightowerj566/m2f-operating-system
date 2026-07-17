// M2F OS · Post-birth training programs.
// Program → Workout → Full / Express / Minimum. No page or type changes.

export type WorkoutVersion = "full" | "express" | "minimum";

export interface PBExercise {
  name: string;
  sets?: number;
  reps?: string;
  rest?: string;
  effort?: string;
  substitution?: string;
  cue?: string;
  videoUrl?: string;
}

export interface PBWorkoutVersionSpec {
  minutes: string;
  format?: string;
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
  full: { label: "Full", hint: "30–45 min · the complete session" },
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
  objective: "Maintain squat, push, pull, carry, and trunk capacity without creating recovery debt.",
  coachingNote: "Stop with 2–3 good reps remaining. Under five hours of sleep means Express or Minimum automatically.",
  versions: {
    full: { minutes: "30", exercises: [
      { name: "Goblet squat", sets: 3, reps: "8–10", rest: "90 sec", effort: "RPE 6–7", substitution: "Bodyweight box squat", cue: "Keep the whole foot planted and elbows inside the knees." },
      { name: "Dumbbell bench press", sets: 3, reps: "8–12", rest: "90 sec", effort: "RPE 6–7", substitution: "Push-up", cue: "Pack the shoulders and control the lowering." },
      { name: "One-arm dumbbell row", sets: 3, reps: "10 / side", rest: "60 sec", effort: "RPE 7", substitution: "Band row", cue: "Pull toward the hip without rotating." },
      { name: "Farmer carry", sets: 3, reps: "30 sec", rest: "60 sec", effort: "Tall, repeatable posture", substitution: "Suitcase carry", cue: "Ribs down, short steps, crush the handles." },
      { name: "Dead bug", sets: 2, reps: "8 / side", rest: "45 sec", effort: "Slow", substitution: "Plank", cue: "Exhale and keep the low back down." },
    ]},
    express: { minutes: "18", exercises: [
      { name: "Goblet squat", sets: 2, reps: "10", rest: "60 sec", effort: "RPE 6" },
      { name: "Dumbbell bench press", sets: 2, reps: "10", rest: "60 sec", effort: "RPE 6" },
      { name: "One-arm dumbbell row", sets: 2, reps: "10 / side", rest: "60 sec", effort: "RPE 6–7" },
      { name: "Farmer carry", sets: 2, reps: "30 sec", rest: "45 sec", effort: "Easy posture" },
    ]},
    minimum: { minutes: "6–10", format: "Two steady rounds", exercises: [
      { name: "Goblet squat", sets: 1, reps: "10", rest: "As needed", effort: "Easy", substitution: "Bodyweight squat", cue: "Move smoothly." },
      { name: "Push-up or dumbbell press", sets: 1, reps: "8–10", rest: "As needed", effort: "Easy", substitution: "Incline push-up", cue: "Leave reps in reserve." },
      { name: "One-arm row", sets: 1, reps: "10 / side", rest: "As needed", effort: "Easy", substitution: "Band row", cue: "Pause at the top." },
    ]},
  },
};

const survivalStrengthB: PBWorkout = {
  slug: "survival-strength-b",
  name: "Survival Strength B",
  week: 1,
  day: 3,
  equipment: "Dumbbells or bodyweight",
  difficulty: "easy",
  objective: "Maintain hinge, overhead push, single-leg control, carries, and lateral core strength.",
  coachingNote: "This session must leave you more capable for the next feeding shift, not less.",
  versions: {
    full: { minutes: "30", exercises: [
      { name: "Dumbbell Romanian deadlift", sets: 3, reps: "8–10", rest: "90 sec", effort: "RPE 6–7", substitution: "Backpack hip hinge", cue: "Push hips back and keep weights close." },
      { name: "Dumbbell overhead press", sets: 3, reps: "8–10", rest: "90 sec", effort: "RPE 6–7", substitution: "Pike push-up", cue: "Squeeze glutes and stack ribs." },
      { name: "Reverse lunge", sets: 3, reps: "8 / side", rest: "60 sec", effort: "RPE 6–7", substitution: "Split squat", cue: "Step back softly and drop straight down." },
      { name: "Suitcase carry", sets: 3, reps: "30 sec / side", rest: "60 sec", effort: "Upright posture", substitution: "Suitcase hold", cue: "Resist leaning toward the weight." },
      { name: "Side plank", sets: 2, reps: "20 sec / side", rest: "45 sec", effort: "Controlled", substitution: "Short-lever side plank", cue: "Make one line from ear to ankle." },
    ]},
    express: { minutes: "18", exercises: [
      { name: "Dumbbell Romanian deadlift", sets: 2, reps: "10", rest: "60 sec", effort: "RPE 6" },
      { name: "Dumbbell overhead press", sets: 2, reps: "10", rest: "60 sec", effort: "RPE 6" },
      { name: "Reverse lunge", sets: 2, reps: "6 / side", rest: "60 sec", effort: "Easy" },
      { name: "Side plank", sets: 2, reps: "20 sec / side", rest: "45 sec", effort: "Controlled" },
    ]},
    minimum: { minutes: "6–10", format: "Two steady rounds", exercises: [
      { name: "Hip hinge", sets: 1, reps: "10", rest: "As needed", effort: "Easy", substitution: "Glute bridge", cue: "Feel hamstrings, not low back." },
      { name: "Overhead press", sets: 1, reps: "8", rest: "As needed", effort: "Easy", substitution: "Pike push-up", cue: "Keep ribs down." },
      { name: "Reverse lunge", sets: 1, reps: "5 / side", rest: "As needed", effort: "Easy", substitution: "Supported split squat", cue: "Use support if balance is off." },
    ]},
  },
};

const survivalOptionalRecovery: PBWorkout = {
  slug: "survival-optional-walk-mobility",
  name: "Optional Third · Walk + Mobility",
  week: 1,
  day: 5,
  equipment: "None",
  difficulty: "easy",
  objective: "Give high-frequency trainees a sanctioned outlet that improves recovery instead of stealing from it.",
  coachingNote: "Optional means optional. This never becomes a missed workout and never unlocks extra lifting.",
  versions: {
    full: { minutes: "25–35", exercises: [
      { name: "Easy walk", sets: 1, reps: "20–30 min", rest: "Continuous", effort: "Conversational pace", substitution: "Easy bike", cue: "Finish with more energy than you started." },
      { name: "90/90 hip switches", sets: 2, reps: "6 / side", rest: "30 sec", effort: "Gentle", substitution: "Seated hip rotations", cue: "Move through the hips without forcing range." },
      { name: "Open book rotation", sets: 2, reps: "6 / side", rest: "30 sec", effort: "Gentle", substitution: "Quadruped rotation", cue: "Follow the hand with the eyes." },
    ]},
    express: { minutes: "15–20", exercises: [
      { name: "Easy walk", sets: 1, reps: "15 min", rest: "Continuous", effort: "Conversational", substitution: "Easy bike", cue: "Nasal breathing when comfortable." },
      { name: "Hip + upper-back mobility", sets: 1, reps: "5 min", rest: "As needed", effort: "Gentle", substitution: "Any pain-free mobility", cue: "Do not chase intensity." },
    ]},
    minimum: { minutes: "5–10", exercises: [
      { name: "Outdoor walk", sets: 1, reps: "5–10 min", rest: "Continuous", effort: "Easy", substitution: "Walk inside", cue: "Sunlight and movement count." },
    ]},
  },
};

function foundationWorkout(slug: string, name: string, day: number, emphasis: "squat" | "hinge" | "mixed"): PBWorkout {
  const main = emphasis === "squat" ? "Goblet or front squat" : emphasis === "hinge" ? "Dumbbell Romanian deadlift" : "Reverse lunge";
  return {
    slug, name, week: 1, day, equipment: "Dumbbells or gym", difficulty: "moderate",
    objective: "Rebuild full-body strength and work capacity with progressive but sleep-aware loading.",
    coachingNote: "Add a rep or small load only when all work sets finish with two reps in reserve.",
    versions: {
      full: { minutes: "35–45", exercises: [
        { name: main, sets: 4, reps: "6–10", rest: "2 min", effort: "RPE 7–8", substitution: "Garage-gym equivalent", cue: "Brace first and keep every rep repeatable." },
        { name: "Dumbbell bench press", sets: 4, reps: "8–10", rest: "90 sec", effort: "2 reps in reserve", substitution: "Push-up", cue: "Pack shoulders and control the bottom." },
        { name: "One-arm dumbbell row", sets: 4, reps: "8–12 / side", rest: "75 sec", effort: "2 reps in reserve", substitution: "Band row", cue: "Pull toward the hip." },
        { name: emphasis === "hinge" ? "Split squat" : "Romanian deadlift", sets: 3, reps: "8–10", rest: "75 sec", effort: "RPE 7", substitution: "Reverse lunge or hip hinge", cue: "Own the range before adding load." },
        { name: "Farmer carry", sets: 3, reps: "40 sec", rest: "60 sec", effort: "RPE 7", substitution: "Suitcase carry", cue: "Quiet feet and hard grip." },
        { name: "Dead bug or hanging knee raise", sets: 3, reps: "8–12", rest: "45 sec", effort: "Controlled", substitution: "Plank", cue: "Keep ribs stacked." },
      ]},
      express: { minutes: "18–20", exercises: [
        { name: main, sets: 3, reps: "8", rest: "75 sec", effort: "RPE 7" },
        { name: "Dumbbell bench press", sets: 3, reps: "10", rest: "75 sec", effort: "RPE 7" },
        { name: "One-arm dumbbell row", sets: 3, reps: "10 / side", rest: "60 sec", effort: "RPE 7" },
        { name: "Farmer carry", sets: 2, reps: "40 sec", rest: "45 sec", effort: "Moderate" },
      ]},
      minimum: { minutes: "8–10", format: "Three smooth rounds", exercises: [
        { name: main, sets: 1, reps: "8", rest: "As needed", effort: "RPE 6", substitution: "Bodyweight version", cue: "Clean reps only." },
        { name: "Push-up or press", sets: 1, reps: "8", rest: "As needed", effort: "RPE 6", substitution: "Incline push-up", cue: "Stop well before failure." },
        { name: "Row", sets: 1, reps: "8 / side", rest: "As needed", effort: "RPE 6", substitution: "Band row", cue: "Pause each rep." },
      ]},
    },
  };
}

const foundationA = foundationWorkout("foundation-full-body-a", "Foundation A · Squat", 1, "squat");
const foundationB = foundationWorkout("foundation-full-body-b", "Foundation B · Hinge", 3, "hinge");
const foundationC = foundationWorkout("foundation-full-body-c", "Foundation C · Mixed", 5, "mixed");

const foundationOptionalD: PBWorkout = {
  slug: "foundation-optional-day-d",
  name: "Optional Day D · Arms, Shoulders + Carries",
  week: 1,
  day: 6,
  equipment: "Dumbbells + bands",
  difficulty: "moderate",
  objective: "Reward three-session consistency with a low-skill pump and carry session.",
  coachingNote: "Unlock only after A, B, and C are complete in the same week. Keep RPE at 7; this is earned frequency, not make-up work.",
  versions: {
    full: { minutes: "25", exercises: [
      { name: "Dumbbell lateral raise", sets: 4, reps: "12–20", rest: "45 sec", effort: "RPE 7", substitution: "Band lateral raise", cue: "Lead with elbows and keep traps quiet." },
      { name: "Rear-delt fly", sets: 3, reps: "12–20", rest: "45 sec", effort: "RPE 7", substitution: "Band pull-apart", cue: "Reach wide and pause." },
      { name: "Alternating dumbbell curl", sets: 3, reps: "10–15 / side", rest: "45 sec", effort: "RPE 7", substitution: "Band curl", cue: "Keep elbows still." },
      { name: "Overhead triceps extension", sets: 3, reps: "10–15", rest: "45 sec", effort: "RPE 7", substitution: "Close-grip push-up", cue: "Keep ribs down and upper arms vertical." },
      { name: "Carry medley", sets: 4, reps: "30 sec", rest: "45 sec", effort: "RPE 7", substitution: "Heavy holds", cue: "Farmer, suitcase, front-rack, then repeat." },
    ]},
    express: { minutes: "15–18", format: "Two supersets plus carries", exercises: [
      { name: "Lateral raise + rear-delt fly", sets: 3, reps: "12 each", rest: "45 sec", effort: "RPE 7" },
      { name: "Curl + triceps extension", sets: 3, reps: "12 each", rest: "45 sec", effort: "RPE 7" },
      { name: "Farmer carry", sets: 3, reps: "30 sec", rest: "45 sec", effort: "Moderate" },
    ]},
    minimum: { minutes: "5–10", format: "Two pump rounds", exercises: [
      { name: "Lateral raise", sets: 1, reps: "15", rest: "As needed", effort: "Easy" },
      { name: "Curl", sets: 1, reps: "12", rest: "As needed", effort: "Easy" },
      { name: "Close-grip push-up", sets: 1, reps: "8", rest: "As needed", effort: "Easy", substitution: "Band pressdown", cue: "Leave reps in reserve." },
      { name: "Carry", sets: 1, reps: "30 sec", rest: "As needed", effort: "Easy" },
    ]},
  },
};

function fatherAthleteWorkout(slug: string, name: string, day: number, lead: string): PBWorkout {
  return {
    slug, name, week: 1, day, equipment: "Dumbbells, barbell, or commercial gym", difficulty: "hard",
    objective: "Build long-term strength, hypertrophy, work capacity, and father-specific carrying strength.",
    coachingNote: "Default to four days. Choose the fifth only when sleep and attendance are stable. Accumulate for three weeks, then cut sets 35–40 percent in week four.",
    versions: {
      full: { minutes: "40–45", exercises: [
        { name: lead, sets: 4, reps: "6–8", rest: "2–3 min", effort: "RPE 8", substitution: "Dumbbell or bodyweight equivalent", cue: "Use repeatable technique and stop before grinding." },
        { name: "Secondary press", sets: 4, reps: "8–10", rest: "90 sec", effort: "RPE 8", substitution: "Push-up or dumbbell press", cue: "Control the eccentric." },
        { name: "Secondary pull", sets: 4, reps: "8–12", rest: "90 sec", effort: "RPE 8", substitution: "Row or pulldown", cue: "Finish with the back, not momentum." },
        { name: "Single-leg or hinge accessory", sets: 3, reps: "8–12", rest: "75 sec", effort: "RPE 7–8", substitution: "Split squat or Romanian deadlift", cue: "Own balance and range." },
        { name: "Core or carry", sets: 3, reps: "30–45 sec", rest: "60 sec", effort: "RPE 7–8", substitution: "Plank", cue: "Posture stays unchanged." },
      ]},
      express: { minutes: "18–20", exercises: [
        { name: lead, sets: 3, reps: "6–8", rest: "90 sec", effort: "RPE 7–8" },
        { name: "Secondary press", sets: 3, reps: "8–10", rest: "75 sec", effort: "RPE 7–8" },
        { name: "Secondary pull", sets: 3, reps: "8–10", rest: "75 sec", effort: "RPE 7–8" },
        { name: "Carry", sets: 2, reps: "40 sec", rest: "45 sec", effort: "Moderate" },
      ]},
      minimum: { minutes: "8–10", format: "Three steady rounds", exercises: [
        { name: lead, sets: 1, reps: "6", rest: "As needed", effort: "RPE 6–7", substitution: "Simpler variation", cue: "Leave clean reps." },
        { name: "Push", sets: 1, reps: "8", rest: "As needed", effort: "RPE 6–7" },
        { name: "Pull", sets: 1, reps: "8", rest: "As needed", effort: "RPE 6–7" },
      ]},
    },
  };
}

const fatherAthleteA = fatherAthleteWorkout("father-athlete-a", "Father Athlete A · Lower Strength", 1, "Front squat or back squat");
const fatherAthleteB = fatherAthleteWorkout("father-athlete-b", "Father Athlete B · Upper Strength", 2, "Bench press or weighted push-up");
const fatherAthleteC = fatherAthleteWorkout("father-athlete-c", "Father Athlete C · Hinge + Back", 4, "Trap-bar deadlift or Romanian deadlift");
const fatherAthleteD = fatherAthleteWorkout("father-athlete-d", "Father Athlete D · Upper Hypertrophy", 5, "Weighted pull-up or pulldown");
const fatherAthleteE = fatherAthleteWorkout("father-athlete-e", "Optional Fifth · Pump + Conditioning", 6, "Dumbbell incline press");

export const POST_BIRTH_PROGRAMS: PBProgram[] = [
  {
    slug: "new-dad-survival",
    name: "New Dad Survival",
    phaseWindow: "Birth – 6 weeks",
    focus: "2 strength days · optional third walk/mobility outlet · 4–6 sets per muscle weekly · recovery governs progression",
    workouts: [survivalStrengthA, survivalStrengthB, survivalOptionalRecovery],
  },
  {
    slug: "new-dad-foundation",
    name: "New Dad Foundation",
    phaseWindow: "6 – 12 weeks",
    focus: "3 default full-body days · 8–10 sets per muscle weekly · optional Day D unlock after A/B/C completion",
    workouts: [foundationA, foundationB, foundationC, foundationOptionalD],
  },
  {
    slug: "father-athlete",
    name: "Father Athlete",
    phaseWindow: "3 months onward",
    focus: "4-day default or 5-day selection · 12 sets default, 14–16 in five-day accumulation weeks · 3+1 mesocycles · sleep-aware attendance",
    workouts: [fatherAthleteA, fatherAthleteB, fatherAthleteC, fatherAthleteD, fatherAthleteE],
  },
];

export function programForSlug(slug: string): PBProgram | null {
  return POST_BIRTH_PROGRAMS.find((program) => program.slug === slug) ?? null;
}
