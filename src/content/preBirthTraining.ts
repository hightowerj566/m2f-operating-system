import type { PBExercise, PBProgram, PBWorkout, WorkoutVersion } from "./postBirthTraining";

// M2F OS · Pre-birth transformation program.
// Pregnancy week is stored in PBWorkout.week so the existing phase engine can
// select sessions without introducing a second program model.

type StageKey = "foundation" | "framing" | "durability" | "staging-mission-mode";
type SessionKey = "upper-a" | "lower-a" | "upper-b" | "lower-b" | "pump" | "full-a" | "full-b" | "full-c" | "full-d";

interface WeekPlan {
  pregnancyWeek: number;
  stage: StageKey;
  days: 3 | 4 | 5;
  rpe: string;
  mainPrescription: string;
  accessoryPrescription: string;
  volumeScale: number;
  conditioning: string;
  note: string;
}

const WEEK_PLANS: WeekPlan[] = [
  { pregnancyWeek: 4, stage: "foundation", days: 5, rpe: "RPE 7", mainPrescription: "3 × 8", accessoryPrescription: "3 × 10–12", volumeScale: 0.85, conditioning: "8 min easy", note: "Establish technique and leave three clean reps." },
  { pregnancyWeek: 5, stage: "foundation", days: 5, rpe: "RPE 7–7.5", mainPrescription: "3 × 9", accessoryPrescription: "3 × 10–12", volumeScale: 0.9, conditioning: "9 min easy", note: "Add one rep before adding load." },
  { pregnancyWeek: 6, stage: "foundation", days: 5, rpe: "RPE 8", mainPrescription: "4 × 8", accessoryPrescription: "3–4 × 10–12", volumeScale: 1, conditioning: "10 min moderate", note: "First volume peak; no grinders." },
  { pregnancyWeek: 7, stage: "foundation", days: 5, rpe: "RPE 6", mainPrescription: "2 × 8", accessoryPrescription: "2 × 10", volumeScale: 0.6, conditioning: "Walk only", note: "Deload: cut sets about 40 percent and keep moving." },
  { pregnancyWeek: 8, stage: "foundation", days: 5, rpe: "RPE 7.5", mainPrescription: "4 × 6–8", accessoryPrescription: "3 × 10–12", volumeScale: 0.9, conditioning: "8 min easy", note: "Begin mesocycle two slightly heavier." },
  { pregnancyWeek: 9, stage: "foundation", days: 5, rpe: "RPE 8", mainPrescription: "4 × 7–9", accessoryPrescription: "3–4 × 10–12", volumeScale: 1, conditioning: "10 min moderate", note: "Beat last week by a rep or small load." },
  { pregnancyWeek: 10, stage: "foundation", days: 5, rpe: "RPE 8.5", mainPrescription: "4 × 8–10", accessoryPrescription: "4 × 10–12", volumeScale: 1.05, conditioning: "10 min moderate", note: "Highest productive week; stop before form breaks." },
  { pregnancyWeek: 11, stage: "foundation", days: 5, rpe: "RPE 6", mainPrescription: "2 × 8", accessoryPrescription: "2 × 10", volumeScale: 0.6, conditioning: "Walk only", note: "Deload fully; fatigue is not fitness." },
  { pregnancyWeek: 12, stage: "foundation", days: 5, rpe: "RPE 7.5", mainPrescription: "4 × 6–8", accessoryPrescription: "3 × 8–12", volumeScale: 0.9, conditioning: "8 min easy", note: "Final Foundation build begins." },
  { pregnancyWeek: 13, stage: "foundation", days: 5, rpe: "RPE 8", mainPrescription: "4 × 8", accessoryPrescription: "3–4 × 8–12", volumeScale: 1, conditioning: "10 min moderate", note: "Use double progression; load only after the rep ceiling." },
  { pregnancyWeek: 14, stage: "foundation", days: 5, rpe: "RPE 8.5", mainPrescription: "4 × 8–10", accessoryPrescription: "4 × 8–12", volumeScale: 1.05, conditioning: "10 min moderate", note: "Finish the runway block strong, not wrecked." },

  { pregnancyWeek: 15, stage: "framing", days: 5, rpe: "RPE 8", mainPrescription: "4 × 6", accessoryPrescription: "3 × 8–12", volumeScale: 0.95, conditioning: "Carries 4 × 30 m", note: "Intensity rises while junk volume leaves." },
  { pregnancyWeek: 16, stage: "framing", days: 5, rpe: "RPE 8.5", mainPrescription: "5 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 1, conditioning: "Carries 5 × 30 m", note: "Brace hard and own every rep." },
  { pregnancyWeek: 17, stage: "framing", days: 5, rpe: "RPE 9 max", mainPrescription: "5 × 4", accessoryPrescription: "3 × 8–10", volumeScale: 1, conditioning: "Carries + grip", note: "Peak intensity; zero missed reps." },
  { pregnancyWeek: 18, stage: "framing", days: 5, rpe: "RPE 6", mainPrescription: "2 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.6, conditioning: "Easy carry technique", note: "Deload before the second strength wave." },
  { pregnancyWeek: 19, stage: "framing", days: 5, rpe: "RPE 8", mainPrescription: "4 × 6", accessoryPrescription: "3 × 8–12", volumeScale: 0.9, conditioning: "Carries 4 × 40 m", note: "Restart below the prior peak." },
  { pregnancyWeek: 20, stage: "framing", days: 5, rpe: "RPE 8.5", mainPrescription: "5 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 0.95, conditioning: "Carries + hangs", note: "Grip is trained, not tested." },
  { pregnancyWeek: 21, stage: "framing", days: 5, rpe: "RPE 9 max", mainPrescription: "5 × 4", accessoryPrescription: "3 × 8–10", volumeScale: 1, conditioning: "Heavy farmer carries", note: "Last true intensity peak of the pregnancy." },
  { pregnancyWeek: 22, stage: "framing", days: 5, rpe: "RPE 6", mainPrescription: "2 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.6, conditioning: "Walk and mobility", note: "Deload and let strength consolidate." },
  { pregnancyWeek: 23, stage: "framing", days: 5, rpe: "RPE 7.5", mainPrescription: "3 × 5", accessoryPrescription: "2–3 × 8–10", volumeScale: 0.75, conditioning: "Carries 3 × 30 m", note: "Transition week: leave the gym wanting more." },

  { pregnancyWeek: 24, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "5 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 0.85, conditioning: "2 × 8 min weekly", note: "Strength maintenance starts; durability earns priority." },
  { pregnancyWeek: 25, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "5 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 0.9, conditioning: "2 × 9 min weekly", note: "Add density, not strain." },
  { pregnancyWeek: 26, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "5 × 5", accessoryPrescription: "3 × 10", volumeScale: 0.95, conditioning: "2 × 10 min weekly", note: "Single-leg and trunk quality lead the week." },
  { pregnancyWeek: 27, stage: "durability", days: 4, rpe: "RPE 6", mainPrescription: "3 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.65, conditioning: "2 easy blocks", note: "Deload without dropping the habit." },
  { pregnancyWeek: 28, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "5 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 0.85, conditioning: "2 × 8 min weekly", note: "Second durability wave; repeatable work only." },
  { pregnancyWeek: 29, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "5 × 5", accessoryPrescription: "3 × 10", volumeScale: 0.9, conditioning: "2 × 10 min weekly", note: "Carry posture and breathing matter more than load." },
  { pregnancyWeek: 30, stage: "durability", days: 4, rpe: "RPE 7", mainPrescription: "4 × 5", accessoryPrescription: "3 × 8–10", volumeScale: 0.85, conditioning: "2 × 8 min weekly", note: "Begin trimming fatigue before the final phase." },
  { pregnancyWeek: 31, stage: "durability", days: 4, rpe: "RPE 6–7", mainPrescription: "3 × 5", accessoryPrescription: "2–3 × 8", volumeScale: 0.75, conditioning: "Easy aerobic only", note: "Exit durable, not depleted." },

  { pregnancyWeek: 32, stage: "staging-mission-mode", days: 4, rpe: "RPE ≤7", mainPrescription: "3 × 5–6", accessoryPrescription: "2–3 × 8–10", volumeScale: 0.75, conditioning: "6–8 min easy", note: "Every session is cancelable; preparedness outranks fatigue." },
  { pregnancyWeek: 33, stage: "staging-mission-mode", days: 4, rpe: "RPE ≤7", mainPrescription: "3 × 5–6", accessoryPrescription: "2–3 × 8–10", volumeScale: 0.7, conditioning: "6–8 min easy", note: "Hold strength and keep joints moving." },
  { pregnancyWeek: 34, stage: "staging-mission-mode", days: 4, rpe: "RPE ≤7", mainPrescription: "3 × 5", accessoryPrescription: "2 × 8–10", volumeScale: 0.65, conditioning: "Walk or bike", note: "No PRs and no soreness contests." },
  { pregnancyWeek: 35, stage: "staging-mission-mode", days: 4, rpe: "RPE 6–7", mainPrescription: "2–3 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.6, conditioning: "Optional easy", note: "Sessions stay under 35 minutes." },
  { pregnancyWeek: 36, stage: "staging-mission-mode", days: 3, rpe: "RPE 6–7", mainPrescription: "2–3 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.55, conditioning: "Walking", note: "Final 30 days: three full-body sessions maximum." },
  { pregnancyWeek: 37, stage: "staging-mission-mode", days: 3, rpe: "RPE 6", mainPrescription: "2 × 5", accessoryPrescription: "2 × 8", volumeScale: 0.5, conditioning: "Walking", note: "Finish fresher than you started." },
  { pregnancyWeek: 38, stage: "staging-mission-mode", days: 3, rpe: "RPE 6", mainPrescription: "2 × 5", accessoryPrescription: "1–2 × 8", volumeScale: 0.45, conditioning: "Mobility or walk", note: "A missed session is the program working, not failing." },
  { pregnancyWeek: 39, stage: "staging-mission-mode", days: 3, rpe: "RPE 5–6", mainPrescription: "2 × 5 easy", accessoryPrescription: "1–2 × 8", volumeScale: 0.4, conditioning: "Walk only", note: "Train only when it adds energy to the day." },
  { pregnancyWeek: 40, stage: "staging-mission-mode", days: 3, rpe: "RPE 5–6", mainPrescription: "1–2 × 5 easy", accessoryPrescription: "1 × 8", volumeScale: 0.3, conditioning: "Walk only", note: "Delivery readiness is the workout; lifting is optional." },
];

const SESSION_META: Record<SessionKey, { name: string; day: number; objective: string; equipment: string }> = {
  "upper-a": { name: "Upper A · Press + Pull", day: 1, objective: "Build chest, back, shoulders, and arms with balanced horizontal pressing and pulling.", equipment: "Barbell + dumbbells or commercial gym" },
  "lower-a": { name: "Lower A · Squat", day: 2, objective: "Build squat strength, quads, hamstrings, calves, and trunk stiffness.", equipment: "Barbell + dumbbells" },
  "upper-b": { name: "Upper B · Back + Shoulders", day: 3, objective: "Build vertical pulling, shoulders, upper back, and arm volume without neglecting pressing.", equipment: "Dumbbells, pull-up bar, cable or bands" },
  "lower-b": { name: "Lower B · Hinge", day: 4, objective: "Build posterior-chain strength, unilateral control, grip, and carry capacity.", equipment: "Barbell + dumbbells" },
  pump: { name: "Pump + Conditioning", day: 5, objective: "Accumulate low-skill hypertrophy, arms, delts, carries, and repeatable conditioning.", equipment: "Dumbbells, bands, bike/rower or open space" },
  "full-a": { name: "Full Body A · Squat + Push", day: 1, objective: "Maintain squat and horizontal pressing strength while training the whole body.", equipment: "Barbell + dumbbells" },
  "full-b": { name: "Full Body B · Hinge + Pull", day: 2, objective: "Maintain hinge and pulling strength with carries and trunk work.", equipment: "Barbell + dumbbells or pull-up bar" },
  "full-c": { name: "Full Body C · Single-Leg + Press", day: 3, objective: "Build single-leg durability, overhead strength, upper back, and aerobic capacity.", equipment: "Dumbbells + bands" },
  "full-d": { name: "Full Body D · Carry + Conditioning", day: 4, objective: "Train resilient movement, loaded carries, grip, core, and repeatable conditioning.", equipment: "Dumbbells + open space" },
};

function ex(name: string, sets: number | undefined, reps: string, rest: string, effort: string, substitution: string, cue: string): PBExercise {
  return { name, sets, reps, rest, effort, substitution, cue };
}

function baseExercises(session: SessionKey, plan: WeekPlan): PBExercise[] {
  const main = plan.mainPrescription;
  const acc = plan.accessoryPrescription;
  const rpe = plan.rpe;
  const map: Record<SessionKey, PBExercise[]> = {
    "upper-a": [
      ex("Barbell bench press", undefined, main, "2–3 min", rpe, "Dumbbell bench press or weighted push-up", "Pin shoulder blades, touch low chest, drive feet through the floor."),
      ex("Chest-supported dumbbell row", undefined, acc, "75–90 sec", rpe, "One-arm dumbbell row", "Pull elbows toward back pockets and pause without shrugging."),
      ex("Incline dumbbell press", undefined, acc, "75–90 sec", rpe, "Feet-elevated push-up", "Keep ribs stacked and lower under control."),
      ex("Lat pulldown or pull-up", undefined, acc, "75–90 sec", rpe, "Band pulldown", "Start by pulling shoulder blades down, then drive elbows to ribs."),
      ex("Dumbbell lateral raise", undefined, "12–20", "45–60 sec", "RPE 8", "Band lateral raise", "Lead with elbows and stop before the traps take over."),
      ex("Dumbbell curl + overhead triceps extension", undefined, "10–15 each", "45 sec", "RPE 8", "Band curl + close-grip push-up", "Keep upper arms still; chase tension, not momentum."),
    ],
    "lower-a": [
      ex("Back squat or front squat", undefined, main, "2–3 min", rpe, "Heavy goblet squat", "Brace before descending and keep the whole foot rooted."),
      ex("Romanian deadlift", undefined, acc, "90 sec", rpe, "Dumbbell Romanian deadlift", "Push hips back until hamstrings load; keep the bar close."),
      ex("Rear-foot elevated split squat", undefined, "8–12 / side", "75 sec", rpe, "Reverse lunge", "Drop straight down and drive through the front mid-foot."),
      ex("Leg curl", undefined, "10–15", "60 sec", "RPE 8", "Slider or stability-ball leg curl", "Keep hips extended while heels pull in."),
      ex("Standing calf raise", undefined, "10–15", "45 sec", "RPE 8", "Single-leg calf raise", "Pause in the stretch and finish tall on the big toe."),
      ex("Ab wheel or dead bug", undefined, "8–12", "45–60 sec", "Controlled", "Long-lever plank", "Exhale, lock ribs down, and move without spinal extension."),
    ],
    "upper-b": [
      ex("Weighted pull-up or lat pulldown", undefined, main, "2–3 min", rpe, "One-arm dumbbell row", "Drive elbows down and keep the neck long."),
      ex("Standing overhead press", undefined, main, "2–3 min", rpe, "Dumbbell overhead press", "Squeeze glutes, stack ribs, and finish with biceps by ears."),
      ex("One-arm cable or dumbbell row", undefined, acc, "75 sec", rpe, "Band row", "Reach long, then pull toward the hip without rotating."),
      ex("Dumbbell floor press", undefined, acc, "75 sec", rpe, "Push-up", "Pause triceps on the floor and press without losing shoulder position."),
      ex("Rear-delt fly or face pull", undefined, "12–20", "45–60 sec", "RPE 8", "Band pull-apart", "Move the shoulder blades; do not crank the neck."),
      ex("Hammer curl + lying triceps extension", undefined, "10–15 each", "45 sec", "RPE 8", "Band alternatives", "Control the eccentric and keep wrists stacked."),
    ],
    "lower-b": [
      ex("Trap-bar deadlift or conventional deadlift", undefined, main, "2–3 min", rpe, "Dumbbell Romanian deadlift", "Push the floor away and finish tall without leaning back."),
      ex("Front-foot elevated reverse lunge", undefined, "8–10 / side", "75 sec", rpe, "Split squat", "Keep pressure through the front heel and big toe."),
      ex("Hip thrust or glute bridge", undefined, acc, "75–90 sec", rpe, "Dumbbell glute bridge", "Tuck pelvis slightly and finish with glutes, not low back."),
      ex("Single-leg Romanian deadlift", undefined, "8–10 / side", "60–75 sec", "RPE 7–8", "Kickstand Romanian deadlift", "Keep hips square and reach the free heel backward."),
      ex("Farmer carry", undefined, plan.conditioning.includes("Carr") ? plan.conditioning.replace("Carries ", "") : "3 × 30–40 m", "60 sec", "Heavy, crisp posture", "Suitcase carry", "Walk quietly with ribs down and hands crushing the handles."),
      ex("Side plank", undefined, "25–40 sec / side", "45 sec", "Controlled", "Suitcase hold", "Make a straight line from ear through ankle."),
    ],
    pump: [
      ex("Dumbbell incline press", undefined, "10–15", "60 sec", "RPE 7–8", "Push-up", "Smooth reps; keep one or two in reserve."),
      ex("Chest-supported rear-delt row", undefined, "12–15", "60 sec", "RPE 8", "Band row", "Pull wide and pause across the upper back."),
      ex("Mechanical lateral-raise drop set", undefined, "10 strict + 10 partial", "60 sec", "RPE 8", "Band lateral raise", "Keep tension on delts and avoid swinging."),
      ex("Alternating curl + close-grip push-up", undefined, "12 each", "45 sec", "RPE 8", "Band curl + extension", "Keep reps clean and continuous."),
      ex("Farmer or suitcase carry", undefined, "4 × 30–45 sec", "45–60 sec", "RPE 7–8", "Heavy dumbbell hold", "Own posture before adding load."),
      ex("Bike, rower, sled, or hill intervals", 1, plan.conditioning, "As programmed", "Hard but repeatable", "Fast step-ups or brisk incline walk", "Finish with the same mechanics you started with."),
    ],
    "full-a": [
      ex("Front squat or goblet squat", undefined, main, "2 min", rpe, "Box squat", "Brace and sit between the hips with a full foot."),
      ex("Dumbbell bench press", undefined, acc, "90 sec", rpe, "Push-up", "Control the bottom and keep shoulders packed."),
      ex("One-arm dumbbell row", undefined, acc, "75 sec", rpe, "Band row", "Pull toward the hip and pause."),
      ex("Reverse lunge", undefined, "8 / side", "60 sec", "RPE 7", "Split squat", "Step back softly and stay tall."),
      ex("Dead bug", undefined, "8 / side", "45 sec", "Slow", "Plank", "Exhale fully and keep the low back down."),
    ],
    "full-b": [
      ex("Romanian deadlift", undefined, main, "2 min", rpe, "Dumbbell Romanian deadlift", "Hips back, lats tight, shins nearly vertical."),
      ex("Pull-up or pulldown", undefined, acc, "90 sec", rpe, "Band pulldown", "Drive elbows toward ribs."),
      ex("Dumbbell overhead press", undefined, acc, "90 sec", rpe, "Half-kneeling one-arm press", "Stack ribs over pelvis and finish tall."),
      ex("Farmer carry", undefined, "3–4 × 30–45 sec", "60 sec", "RPE 7", "Suitcase carry", "Short steps, quiet feet, hard grip."),
      ex("Pallof press", undefined, "10 / side", "45 sec", "Controlled", "Suitcase hold", "Do not let the cable rotate the torso."),
    ],
    "full-c": [
      ex("Rear-foot elevated split squat", undefined, "8 / side", "90 sec", rpe, "Reverse lunge", "Stay balanced over the front foot."),
      ex("Incline dumbbell press", undefined, acc, "75 sec", rpe, "Push-up", "Keep ribs down and elbows slightly tucked."),
      ex("Chest-supported row", undefined, acc, "75 sec", rpe, "One-arm row", "Pause at the top without shrugging."),
      ex("Single-leg Romanian deadlift", undefined, "8 / side", "60 sec", "RPE 7", "Kickstand Romanian deadlift", "Square hips and reach long through the back heel."),
      ex("Zone 2 bike, row, or incline walk", 1, plan.conditioning, "Continuous", "Conversational pace", "Brisk outdoor walk", "Breathe rhythmically and finish more energized."),
    ],
    "full-d": [
      ex("Goblet squat", undefined, "8–10", "60 sec", "RPE 6–7", "Bodyweight box squat", "Move smoothly and keep the torso stacked."),
      ex("Dumbbell floor press", undefined, "8–12", "60 sec", "RPE 6–7", "Push-up", "Pause softly and press with control."),
      ex("One-arm row", undefined, "10 / side", "60 sec", "RPE 7", "Band row", "Keep hips and ribs square."),
      ex("Carry medley", undefined, "farmer + suitcase + front rack, 30 sec each", "60 sec", "RPE 7", "Static holds", "Posture never changes across positions."),
      ex("Conditioning circuit", 1, plan.conditioning, "As needed", "Repeatable", "Walk", "Stop before movement quality drops."),
    ],
  };
  return map[session];
}

function scaledSets(index: number, plan: WeekPlan): number {
  const base = index < 2 ? 4 : index < 4 ? 3 : 2;
  return Math.max(1, Math.round(base * plan.volumeScale));
}

function complete(exercise: PBExercise, index: number, plan: WeekPlan): PBExercise {
  return { ...exercise, sets: exercise.sets ?? scaledSets(index, plan) };
}

function versions(session: SessionKey, plan: WeekPlan): Record<WorkoutVersion, { minutes: string; format?: string; exercises: PBExercise[] }> {
  const full = baseExercises(session, plan).map((exercise, index) => complete(exercise, index, plan));
  const express = full.slice(0, 4).map((exercise) => ({ ...exercise, sets: Math.min(exercise.sets ?? 2, 3), rest: "45–75 sec" }));
  const minimum = full.slice(0, 3).map((exercise) => ({ ...exercise, sets: 1, reps: exercise.reps?.includes("×") ? "8 controlled reps" : exercise.reps, rest: "As needed", effort: "RPE 6–7" }));
  return {
    full: { minutes: session === "pump" ? "30–40" : "35–45", exercises: full },
    express: { minutes: "15–20", format: "Complete the first four movements as alternating pairs.", exercises: express },
    minimum: { minutes: "5–10", format: "One quality round. Stop while you still feel better than when you started.", exercises: minimum },
  };
}

function sessionKeys(plan: WeekPlan): SessionKey[] {
  if (plan.stage === "foundation" || plan.stage === "framing") return ["upper-a", "lower-a", "upper-b", "lower-b", "pump"];
  if (plan.stage === "durability") return ["full-a", "full-b", "full-c", "full-d"];
  return plan.days === 4 ? ["full-a", "full-b", "full-c", "full-d"] : ["full-a", "full-b", "full-c"];
}

function workout(plan: WeekPlan, session: SessionKey): PBWorkout {
  const meta = SESSION_META[session];
  return {
    slug: `prebirth-${plan.stage}-w${plan.pregnancyWeek}-${session}`,
    name: `${meta.name} · Pregnancy Week ${plan.pregnancyWeek}`,
    week: plan.pregnancyWeek,
    day: meta.day,
    equipment: meta.equipment,
    difficulty: plan.stage === "staging-mission-mode" ? "easy" : plan.stage === "durability" ? "moderate" : "hard",
    objective: meta.objective,
    coachingNote: `${plan.note} Weekly target: ${plan.mainPrescription} main work, ${plan.accessoryPrescription} accessories, ${plan.rpe}. Full is never mandatory; Express and Minimum preserve the plan.`,
    versions: versions(session, plan),
  };
}

function stageWorkouts(stage: StageKey): PBWorkout[] {
  return WEEK_PLANS.filter((week) => week.stage === stage).flatMap((week) => sessionKeys(week).map((session) => workout(week, session)));
}

export const PRE_BIRTH_PROGRAMS: PBProgram[] = [
  {
    slug: "prebirth-foundation",
    name: "FOUNDATION",
    phaseWindow: "Pregnancy weeks 4–14",
    focus: "5 days · highest-volume hypertrophy runway · 12–16 hard sets per muscle weekly · double progression · RPE 7→8.5 · 3+1 mesos · nutrition: slight surplus or recomp",
    workouts: stageWorkouts("foundation"),
  },
  {
    slug: "prebirth-framing",
    name: "FRAMING",
    phaseWindow: "Pregnancy weeks 15–23",
    focus: "5 days · 4–6 rep strength emphasis · 10–14 sets per muscle weekly · loaded carries and grip · two 3+1 waves plus transition · nutrition: hold bodyweight or slow recomp",
    workouts: stageWorkouts("framing"),
  },
  {
    slug: "prebirth-durability",
    name: "DURABILITY",
    phaseWindow: "Pregnancy weeks 24–31",
    focus: "4 days · 5×5 maintenance at RPE 7 · 8–12 sets per muscle weekly · single-leg, core, carries, and two conditioning blocks · nutrition: maintenance",
    workouts: stageWorkouts("durability"),
  },
  {
    slug: "prebirth-staging-mission-mode",
    name: "STAGING + MISSION MODE",
    phaseWindow: "Pregnancy weeks 32–40",
    focus: "4 days tapering to 3 · full-body maintenance · RPE ≤7 · no PRs · sessions ≤35 min · every session cancelable · nutrition: maintenance, never an aggressive cut",
    workouts: stageWorkouts("staging-mission-mode"),
  },
];

export function preBirthProgramForPregnancyWeek(pregnancyWeek: number): PBProgram | null {
  return PRE_BIRTH_PROGRAMS.find((program) => program.workouts.some((workout) => workout.week === pregnancyWeek)) ?? null;
}

export function preBirthWorkoutsForPregnancyWeek(pregnancyWeek: number): PBWorkout[] {
  return PRE_BIRTH_PROGRAMS.flatMap((program) => program.workouts).filter((workout) => workout.week === pregnancyWeek);
}
