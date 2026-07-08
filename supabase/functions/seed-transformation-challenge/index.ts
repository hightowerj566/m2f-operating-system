import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ─────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  detail: string;
  sets: number;
  reps: string | number | null;
  rest: number;
  role: string;      // explosive | primary | secondary | accessory | structural | core | conditioning
  pair: string | null; // grouping key for supersets
  intensity: string | null; // intensity technique
}

interface DayTemplate {
  label: string;
  exercises: Exercise[];
}

// ─── Content pools ─────────────────────────────────────────────────

const MINDSET = [
  "Strength isn't built in comfort — it's forged in the struggle. Show your kids what consistency looks like.",
  "Your family is watching. Every rep you do today shows them what discipline really means.",
  "Recovery isn't weakness — it's wisdom. Rest hard so you can train harder tomorrow.",
  "The hinges of your life — your back, your hips — deserve the same attention you give the mirror muscles.",
  "Lead from the front. When your kids see you push through hard things, they learn they can too.",
  "You don't have to be perfect — you just have to keep showing up. That's the lesson your kids need.",
  "Today's rest makes tomorrow's performance possible. Trust the process.",
  "The strongest thing a father can do is take care of himself so he can take care of everyone else.",
  "Progress isn't always visible. Some of your best growth happens when nobody's watching.",
  "Your kids won't remember your PRs — they'll remember that you never quit.",
];
const MISSIONS = [
  "Spend 10 minutes helping your child with something they're struggling with — guide, don't take over.",
  "Put your phone away during dinner tonight. Be fully present.",
  "Take a 15-minute walk with your family today. No agenda, just connection.",
  "Tell your kid about a time you failed and what you learned from it.",
  "Ask your child what made them laugh today — then really listen.",
  "Do something active with your kids today — play catch, wrestle, race them in the yard.",
  "Today is for recharging. Spend quality time with your family without screens.",
  "Write a short note to your kid telling them something you're proud of about them.",
  "Let your child teach you something today. Be the student.",
  "Plan something fun with your family for this weekend. Anticipation matters.",
];

function getMindset(w: number, d: number): string {
  return MINDSET[((w - 1) * 7 + (d - 1)) % MINDSET.length];
}
function getMission(w: number, d: number): string {
  return MISSIONS[((w - 1) * 7 + (d - 1)) % MISSIONS.length];
}

// ─── Helper: quick exercise builder ────────────────────────────────

function ex(
  name: string, detail: string, sets: number, reps: string | number | null,
  rest: number, role: string, pair: string | null = null, intensity: string | null = null
): Exercise {
  return { name, detail, sets, reps, rest, role, pair, intensity };
}

// ════════════════════════════════════════════════════════════════════
// PHASE 1 — Foundation Shred (Weeks 1–4)
// ════════════════════════════════════════════════════════════════════
// Goals: Maintain strength, establish aerobic base, build work capacity, begin fat loss
// Tempo: 3-1-1 (primary), 3-0-1 (secondary/accessory)
// Intensity techniques: 0-1 per workout
// Squat: Back Squat | Hinge: Romanian Deadlift | Press: Bench Press
// Row: Single-Arm DB Row | Vertical Pull: Weighted Pullups
// ════════════════════════════════════════════════════════════════════

const phase1: DayTemplate[] = [
  // ── Monday: Upper Strength ──
  {
    label: "Upper Strength",
    exercises: [
      ex("Med Ball Chest Pass", "Explosive chest pass against wall. Maximum velocity. Full reset between reps.", 4, 5, 0, "explosive", "A"),
      ex("Band Pull-Apart", "Scapular activation. Squeeze shoulder blades at end range. Controlled tempo.", 4, 12, 90, "structural", "A"),
      ex("Barbell Bench Press", "Primary press. Tempo 3-1-1. Drive feet into floor. Full range of motion. 70-75%.", 5, 4, 150, "primary"),
      ex("Weighted Pullups", "Primary pull. Add weight via belt or DB. Full dead hang each rep.", 5, 4, 150, "primary"),
      ex("Incline Dumbbell Press", "30-degree incline. Full stretch at bottom. Tempo 3-0-1.", 3, 10, 0, "secondary", "D"),
      ex("Single-Arm DB Row", "Knee on bench. Pull to hip. Squeeze lat at top. Each arm.", 3, 10, 60, "secondary", "D"),
      ex("Face Pull", "Rope to forehead. External rotate at end. Constant tension.", 3, 15, 0, "structural", "E"),
      ex("Lateral Raise", "Slight forward lean. Lead with pinky. No momentum. Tempo 3-0-1.", 3, 12, 60, "accessory", "E"),
    ],
  },
  // ── Tuesday: Lower Strength ──
  {
    label: "Lower Strength",
    exercises: [
      ex("Box Jump", "Explosive hip extension. Step down, don't bounce. Full reset each rep.", 4, 5, 0, "explosive", "A"),
      ex("Banded Monster Walk", "Mini band above knees. Quarter squat position. Steps each direction.", 4, 12, 90, "structural", "A"),
      ex("Back Squat", "Primary squat. Tempo 3-1-1. Break at hips and knees together. Full depth. 70-75%.", 5, 4, 150, "primary"),
      ex("Romanian Deadlift", "Hinge at hips. Deep hamstring stretch. Slight knee bend. Tempo 3-0-1.", 3, 8, 0, "secondary", "D"),
      ex("Walking Lunge", "Long stride. Upright torso. Control each step. Alternate legs.", 3, 10, 60, "secondary", "D"),
      ex("Leg Extension", "Slow eccentric. Full contraction. Tempo 3-0-1.", 3, 12, 0, "accessory", "E"),
      ex("Standing Calf Raise", "Full stretch at bottom. Pause at top. Tempo 2-1-1.", 3, 15, 0, "accessory", "E"),
      ex("Reverse Pec Deck", "Rear delt work on lower day. Full squeeze. Light weight.", 3, 15, 60, "structural", "E"),
    ],
  },
  // ── Wednesday: Conditioning + Core + Arms ──
  {
    label: "Conditioning + Core + Arms",
    exercises: [
      ex("Zone 2 Cardio", "Choose: incline walk, row, or bike. Maintain HR 120-140 bpm. Conversational pace.", 1, "25 min", 0, "conditioning"),
      ex("Hanging Leg Raise", "Control the swing. Raise to 90 degrees. Slow negative.", 3, 10, 0, "core", "B"),
      ex("Pallof Press", "Anti-rotation. Press and hold 2 seconds. Both sides.", 3, 12, 0, "core", "B"),
      ex("Dead Bug", "Opposite arm/leg. Press low back into floor. Controlled breathing.", 3, 10, 45, "core", "B"),
      ex("EZ Bar Curl", "Strict form. No swing. Full range. Squeeze at top.", 3, 12, 0, "accessory", "C"),
      ex("Rope Tricep Pushdown", "Elbows pinned. Spread rope at bottom. Full lockout.", 3, 12, 0, "accessory", "C"),
      ex("Hammer Curl", "Neutral grip. Alternate arms. No swing. Squeeze at top.", 3, 10, 0, "accessory", "C"),
      ex("Farmer Carry", "Heavy DBs or KBs. Tall posture. Brace core. Walk with purpose.", 3, "40m", 60, "core", "D"),
    ],
  },
  // ── Thursday: Upper Hypertrophy ──
  {
    label: "Upper Hypertrophy",
    exercises: [
      ex("DB Push Press", "Explosive press. Use legs to initiate. Control the negative.", 4, 6, 0, "explosive", "A"),
      ex("Band Face Pull", "High pull to eye level. External rotate and squeeze.", 4, 15, 90, "structural", "A"),
      ex("Standing Overhead Press", "Strict press. No leg drive. Tempo 3-1-1. Full lockout.", 4, 8, 90, "primary"),
      ex("Chest-Supported Row", "Incline bench. Pull to ribcage. No momentum. Squeeze lats.", 3, 10, 0, "secondary", "D"),
      ex("Incline DB Fly", "30-degree bench. Deep stretch at bottom. Squeeze at top. Chest isolation.", 3, 12, 60, "secondary", "D"),
      ex("Lat Pulldown", "Shoulder-width grip. Pull to upper chest. Squeeze lats. Controlled negative.", 3, 10, 0, "accessory", "E"),
      ex("Cable Lateral Raise", "Behind the body start. Slight lean away. Constant tension.", 3, 15, 0, "accessory", "E"),
      ex("Rear Delt Fly", "Bent over or pec deck reverse. Light weight. Full squeeze.", 3, 15, 60, "accessory", "E"),
    ],
  },
  // ── Friday: Lower Hypertrophy ──
  {
    label: "Lower Hypertrophy",
    exercises: [
      ex("Kettlebell Swing", "Hip hinge explosive. Snap hips. Arms are hooks, not lifters.", 4, 10, 0, "explosive", "A"),
      ex("Goblet Squat", "Activation. Elbows between knees. Upright torso.", 4, 8, 90, "structural", "A"),
      ex("Trap Bar Deadlift", "Neutral grip. Drive through midfoot. Hips and shoulders rise together.", 4, 8, 90, "primary"),
      ex("Bulgarian Split Squat", "Rear foot elevated. Vertical shin. Deep stretch. Each leg. Tempo 3-0-1.", 3, 10, 0, "secondary", "D"),
      ex("Lying Leg Curl", "Squeeze hamstrings at top. Slow eccentric. Full range. Tempo 3-0-1.", 3, 10, 60, "secondary", "D"),
      ex("Hip Thrust", "Barbell or banded. Drive through heels. Squeeze glutes at lockout.", 3, 12, 0, "accessory", "E"),
      ex("Standing Calf Raise", "Full stretch at bottom. Pause at top. Tempo 2-1-1.", 3, 15, 0, "accessory", "E"),
      ex("Seated Calf Raise", "Deep stretch at bottom. Slow eccentric. Full range. Tempo 2-1-2.", 3, 15, 60, "accessory", "E"),
      // Interval finisher
      ex("Bike Sprints", "8 rounds: 15 sec all-out sprint / 45 sec easy spin. Total: 8 min.", 8, null, 0, "conditioning"),
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
// PHASE 2 — Metabolic Build (Weeks 5–8)
// ════════════════════════════════════════════════════════════════════
// Goals: Increase metabolic stress, increase conditioning capacity, maintain strength
// Tempo: 2-0-1 (primary), 2-1-1 (secondary/accessory)
// Intensity techniques: 1-2 per workout
// Squat: Front Squat | Hinge: Trap Bar Deadlift | Press: Close-Grip Bench
// Row: Pendlay Row | Vertical Pull: Lat Pulldown
// ════════════════════════════════════════════════════════════════════

const phase2: DayTemplate[] = [
  // ── Monday: Upper Strength ──
  {
    label: "Upper Strength",
    exercises: [
      ex("Plyo Push-Up", "Explosive. Hands leave ground. Reset between reps.", 4, 5, 0, "explosive", "A"),
      ex("Scap Push-Up", "Protract and retract shoulder blades. Maintain plank.", 4, 10, 90, "structural", "A"),
      ex("Close-Grip Bench Press", "Hands inside shoulder width. Tempo 2-0-1. Tricep focus. 80-85%.", 6, 3, 180, "primary"),
      ex("Lat Pulldown", "Wide grip. Pull to upper chest. Squeeze lats. Controlled negative.", 5, 4, 150, "primary"),
      ex("DB Flat Press", "Full stretch at bottom. Controlled press. Tempo 2-1-1.", 3, 10, 0, "secondary", "D"),
      ex("Pendlay Row", "Dead stop each rep. Explosive pull to chest. Strict form.", 3, 8, 60, "secondary", "D"),
      ex("Cable Face Pull", "Rope to forehead. External rotate. Constant tension.", 3, 15, 0, "structural", "E"),
      ex("DB Lateral Raise", "Seated or standing. Lead with elbows. No momentum.", 3, 15, 0, "accessory", "E"),
      ex("Inverted Row", "Rings or bar. Pull chest to bar. Squeeze at top.", 3, 12, 60, "accessory", "E"),
    ],
  },
  // ── Tuesday: Lower Strength ──
  {
    label: "Lower Strength",
    exercises: [
      ex("Broad Jump", "Explosive hip extension. Swing arms. Stick the landing.", 4, 5, 0, "explosive", "A"),
      ex("Banded Glute Bridge", "Band above knees. Squeeze hard at top. 2-second hold.", 4, 10, 90, "structural", "A"),
      ex("Front Squat", "Cross or clean grip. Tempo 2-0-1. Elbows high. Full depth. 80-85%.", 6, 3, 180, "primary"),
      ex("DB Stiff-Leg Deadlift", "Dumbbells. Hinge at hips. Deep hamstring stretch. Tempo 2-1-1.", 4, 8, 0, "secondary", "D"),
      ex("Reverse Lunge", "Step back. Vertical shin on front leg. Each leg.", 4, 8, 60, "secondary", "D"),
      ex("Nordic Curl", "Eccentric focus. Lower as slowly as possible. Hands to push up.", 3, 6, 0, "accessory", "E"),
      ex("Calf Raise (Toes In)", "Medial head emphasis. Full ROM. Pause top and bottom.", 3, 15, 0, "accessory", "E"),
      ex("Reverse Pec Deck", "Rear delt frequency. Full contraction. Light weight.", 3, 15, 60, "structural", "E"),
    ],
  },
  // ── Wednesday: Conditioning + Core + Arms ──
  {
    label: "Conditioning + Core + Arms",
    exercises: [
      ex("Zone 2 Cardio", "Choose: row, bike, or incline walk. Maintain HR 120-140 bpm. Build to 30 min.", 1, "30 min", 0, "conditioning"),
      ex("Toes to Bar", "Strict or kipping. Full range. Slow negative. Scale to knee raise.", 3, 8, 0, "core", "B"),
      ex("Anti-Rotation Press Hold", "Pallof variation. Press and hold 3 seconds. Each side.", 3, 10, 0, "core", "B"),
      ex("Plank Shoulder Tap", "High plank. Tap opposite shoulder. Minimize hip rotation.", 3, 10, 45, "core", "B"),
      ex("Hammer Curl", "Neutral grip. Alternate arms. No swing. Squeeze brachialis.", 3, 12, 0, "accessory", "C"),
      ex("Overhead Tricep Extension", "Cable or DB. Deep stretch. Full lockout. Tempo 2-1-1.", 3, 12, 0, "accessory", "C"),
      ex("Incline DB Curl", "45-degree bench. Full stretch at bottom. Strict. Tempo 2-0-1.", 3, 10, 0, "accessory", "C"),
      ex("Suitcase Carry", "Heavy single DB/KB. Stay upright — don't lean. Each side.", 3, "30m", 60, "core", "D"),
    ],
  },
  // ── Thursday: Upper Hypertrophy ──
  {
    label: "Upper Hypertrophy",
    exercises: [
      ex("Landmine Press", "Explosive. Staggered stance. Drive through legs. Each arm.", 4, 6, 0, "explosive", "A"),
      ex("Band Dislocate", "Activation. Wide grip band pull-over. Controlled.", 4, 10, 90, "structural", "A"),
      ex("Z Press", "Seated on floor. No back support. Core engagement critical. Tempo 2-0-1.", 4, 8, 90, "primary"),
      ex("Meadows Row", "Landmine row. Staggered stance. Pull to hip. Each arm. Tempo 2-1-1.", 3, 10, 0, "secondary", "D"),
      ex("Cable Fly", "High-to-low. Squeeze chest at bottom. Constant tension. Tempo 2-1-1.", 3, 12, 60, "secondary", "D"),
      ex("Straight-Arm Pulldown", "Cable. Keep arms straight. Pull to hips. Squeeze lats.", 3, 12, 0, "accessory", "E"),
      ex("Upright Row", "Wide grip. Pull to chest. Lead with elbows. Cable or DB.", 3, 12, 0, "accessory", "E", "drop_set_last_set"),
      ex("Prone Y Raise", "Face down on incline. Thumbs up. Light weight. Scapular stability.", 3, 12, 60, "accessory", "E"),
    ],
  },
  // ── Friday: Lower Hypertrophy ──
  {
    label: "Lower Hypertrophy",
    exercises: [
      ex("DB Snatch", "Single-arm explosive pull. Floor to overhead. Hip driven. Each arm.", 4, 5, 0, "explosive", "A"),
      ex("Air Squat", "Activation. Full depth. Arms forward. Controlled.", 4, 10, 90, "structural", "A"),
      ex("Sumo Deadlift", "Wide stance. Push floor away. Glute lockout. Controlled eccentric. Hypertrophy focus.", 4, 8, 90, "primary"),
      ex("Step-Up", "High box. Drive through lead leg. No push from back foot. Each leg.", 3, 10, 0, "secondary", "D"),
      ex("Stability Ball Leg Curl", "Feet on ball. Bridge up, curl ball toward glutes. Slow eccentric.", 3, 10, 60, "secondary", "D"),
      ex("Single-Leg Hip Thrust", "One leg. Squeeze glute at top. Each leg. Tempo 2-1-1.", 3, 10, 0, "accessory", "E", "rest_pause_last_set"),
      ex("Standing Calf Raise", "Full stretch at bottom. Explosive at top. Full range. Tempo 2-1-1.", 3, 15, 0, "accessory", "E"),
      ex("Donkey Calf Raise", "Deep stretch at bottom. Slow eccentric. Pause at bottom.", 3, 15, 60, "accessory", "E"),
      // Interval finisher
      ex("Row Sprints", "8 × 250m hard effort. 90 sec rest between. Track split times.", 8, null, 0, "conditioning"),
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
// PHASE 3 — Peak Shred (Weeks 9–12)
// ════════════════════════════════════════════════════════════════════
// Goals: Maximize calorie burn, maintain muscle mass, peak conditioning
// Tempo: 2-0-X (explosive concentric), 2-0-1 (secondary/accessory)
// Intensity techniques: 2-3 per workout
// Squat: Tempo Back Squat | Hinge: Block Pull | Press: Floor Press
// Row: Chest-Supported Row | Vertical Pull: Neutral Grip Pullups
// ════════════════════════════════════════════════════════════════════

const phase3: DayTemplate[] = [
  // ── Monday: Upper Strength ──
  {
    label: "Upper Strength",
    exercises: [
      ex("Med Ball Slam", "Overhead slam. Maximum force into ground. Full hip extension.", 4, 6, 0, "explosive", "A"),
      ex("Scap Push-Up", "Protract and retract. Maintain plank.", 4, 10, 90, "structural", "A"),
      ex("Floor Press", "Barbell or DB. Tempo 2-0-X. Pause at bottom. Tricep and chest. 82-88%.", 5, 3, 180, "primary"),
      ex("Neutral Grip Pullups", "Palms facing. Full dead hang. Pull chin over bar.", 5, 4, 150, "primary"),
      ex("Incline Barbell Press", "30-degree. Full ROM. Tempo 2-0-1. Upper chest.", 3, 8, 0, "secondary", "D", "drop_set_last_set"),
      ex("Chest-Supported Row", "Incline bench. Pull to ribcage. No momentum. Squeeze.", 3, 8, 60, "secondary", "D"),
      ex("Band Pull-Apart", "High reps. Squeeze rear delts. Constant tension.", 3, 20, 0, "structural", "E"),
      ex("Lateral Raise", "Seated. Strict. Pause 1 second at top. No momentum.", 3, 15, 0, "accessory", "E", "mechanical_drop_set"),
      ex("TRX Row", "Feet forward for difficulty. Pull chest to handles. Squeeze.", 3, 12, 60, "accessory", "E"),
    ],
  },
  // ── Tuesday: Lower Strength ──
  {
    label: "Lower Strength",
    exercises: [
      ex("Depth Jump", "Step off box, immediately jump max height. Minimal ground contact.", 4, 4, 0, "explosive", "A"),
      ex("Banded Glute Bridge", "Band above knees. Squeeze at top. 2-second hold.", 4, 10, 90, "structural", "A"),
      ex("Tempo Back Squat", "Tempo 3-0-X. Three-second eccentric. Explosive concentric. 82-88%.", 5, 3, 180, "primary"),
      ex("Block Pull", "Deadlift from blocks at knee. Lockout power. Tempo 2-0-X. 82-88%.", 5, 3, 180, "primary"),
      ex("Cyclist Squat", "Heels elevated. Narrow stance. Quad emphasis. Deep ROM. Tempo 2-0-1.", 3, 10, 0, "secondary", "E"),
      ex("Seated Leg Curl", "Slow eccentric. Full contraction. Tempo 2-0-1.", 3, 12, 0, "accessory", "E", "myo_reps_last_set"),
      ex("Single-Leg Calf Raise", "Each leg. Full stretch, full contraction.", 3, 12, 0, "accessory", "F"),
      ex("Reverse Pec Deck", "Rear delt frequency. Full contraction. Light weight.", 3, 15, 60, "structural", "F"),
    ],
  },
  // ── Wednesday: Conditioning + Core + Arms ──
  {
    label: "Conditioning + Core + Arms",
    exercises: [
      ex("Zone 2 Cardio", "Choose: row, bike, or incline walk. Build to 35 min. HR 120-140.", 1, "35 min", 0, "conditioning"),
      ex("L-Sit Hold", "Parallel bars or floor. Hold 15 seconds. Scale to tuck.", 3, "15 sec", 0, "core", "B"),
      ex("Russian Twist", "Seated V. Rotate side to side. Med ball or DB. Each side.", 3, 12, 0, "core", "B"),
      ex("Hollow Body Hold", "Arms overhead. Legs extended. Press low back down. Hold 20 seconds.", 3, "20 sec", 45, "core", "B"),
      ex("Incline Curl", "Seated incline. Full stretch. No swing. Squeeze at top.", 3, 10, 0, "accessory", "C", "rest_pause_last_set"),
      ex("Cable Pushdown", "Elbows pinned. Full lockout. Constant tension.", 3, 12, 0, "accessory", "C"),
      ex("Cross-Body Hammer Curl", "Across body. Brachialis emphasis. Each arm. Tempo 2-0-1.", 3, 10, 0, "accessory", "C"),
      ex("Heavy Farmer Carry", "Walk with purpose. Tall posture. Brace everything.", 3, "50m", 60, "core", "D"),
    ],
  },
  // ── Thursday: Upper Hypertrophy ──
  {
    label: "Upper Hypertrophy",
    exercises: [
      ex("Push Jerk", "Explosive. Dip-drive-press. Use legs. Lock out overhead.", 4, 5, 0, "explosive", "A"),
      ex("Band Dislocate", "Slow, controlled shoulder mobility.", 4, 10, 90, "structural", "A"),
      ex("Seated DB Press", "No back support. Core engagement critical. Full lockout. Tempo 2-0-X.", 4, 8, 90, "primary"),
      ex("Cable Row", "Seated or standing. Pull to belly button. Squeeze lats. Tempo 2-0-1.", 3, 10, 0, "secondary", "D"),
      ex("Pec Deck Fly", "Full stretch. Squeeze at peak contraction. Chest isolation. Tempo 2-0-1.", 3, 12, 60, "secondary", "D", "drop_set_last_set"),
      ex("Lat Pulldown (Close Grip)", "V-bar handle. Pull to sternum. Squeeze lats hard.", 3, 10, 0, "accessory", "E"),
      ex("Lu Raise", "Front raise to lateral in one motion. Light weight. Delt isolation.", 3, 12, 0, "accessory", "E", "mechanical_drop_set"),
      ex("Reverse Pec Deck", "Rear delt focus. Full contraction. Slow negative.", 3, 15, 60, "structural", "E"),
    ],
  },
  // ── Friday: Lower Hypertrophy ──
  {
    label: "Lower Hypertrophy",
    exercises: [
      ex("Jump Squat", "Bodyweight or light load. Explosive. Soft landing. Full reset.", 4, 5, 0, "explosive", "A"),
      ex("Banded Monster Walk", "Mini band. Quarter squat. Forward, back, and lateral.", 4, 12, 90, "structural", "A"),
      ex("Pause Deadlift", "2-second pause at knee. Tempo 3-1-X. Build off-floor strength. Hypertrophy focus.", 4, 8, 90, "primary"),
      ex("Leg Press", "Full depth. Controlled negative. No lockout at top. Tempo 2-0-1.", 3, 10, 0, "secondary", "D", "rest_pause_last_set"),
      ex("Single-Leg Slider Curl", "One foot on slider. Bridge and curl. Each leg. Slow eccentric.", 3, 8, 60, "secondary", "D"),
      ex("Barbell Hip Thrust", "Heavy. Drive through heels. Squeeze glutes. Chin tucked.", 3, 10, 0, "accessory", "E", "myo_reps_last_set"),
      ex("Standing Calf Raise", "Full ROM. Pause at top. Explosive concentric. Tempo 2-0-X.", 3, 15, 0, "accessory", "E"),
      ex("Tibialis Raise", "Raise toes toward shins. Bulletproof the ankles. Tempo 2-0-1.", 3, 15, 60, "accessory", "E"),
      // Interval finisher
      ex("Tabata Bike", "20 sec all-out / 10 sec rest × 8 rounds. Then 3 min cooldown.", 8, null, 0, "conditioning"),
    ],
  },
];

// ─── Saturday EMOM Conditioning (3 mesocycles for 12 weeks) ────────

interface WeekSession {
  moves: [string, string, string, string];
  note: string;
}

interface MesocycleConditioning {
  weeks: [WeekSession, WeekSession, WeekSession, WeekSession];
}

// EMOM Structure: Minute 1 Engine | Minute 2 Strength/Power | Minute 3 Engine | Minute 4 Skill/Gymnastics
const EMOM_MESOCYCLES: MesocycleConditioning[] = [
  // Meso 1 (Weeks 1-4) — Foundation
  { weeks: [
    { moves: ["15/12 Cal Row", "12 DB Thrusters (moderate)", "14/11 Cal Bike", "12 Toes-to-Bar"],
      note: "Thrusters fluid — breathe at the top. TTB unbroken or 2 quick sets. Pace machines at 7/10 effort." },
    { moves: ["14/11 Cal Ski Erg", "8 Power Cleans (50% 1RM)", "15/12 Cal Row", "10 Burpee Box Jumps (20\")"],
      note: "Cleans touch-and-go — if doing singles by round 4, go lighter. Step down on box jumps." },
    { moves: ["12/9 Cal Bike", "8 DB Snatches (4 each arm)", "150m Shuttle Run", "10 Pull-Ups"],
      note: "DB snatches alternate arms each rep. Shuttle runs 25m out-and-back x3. Pull-ups scale to 8 if breaking." },
    { moves: ["15/12 Cal Row", "10 Wall Balls (20/14 lb)", "14/11 Cal Ski Erg", "50 Double Unders"],
      note: "Wall balls unbroken — use 14 lb if breaking before round 7. Scale DU to 60 singles." },
  ]},
  // Meso 2 (Weeks 5-8) — Metabolic Build
  { weeks: [
    { moves: ["12/9 Cal Bike", "12 KB Swings (heavy)", "15/12 Cal Row", "15 Push-Ups"],
      note: "KB swings Russian-style to eye level. Push-ups full ROM, chest to floor. Bike steady cadence 70+ RPM." },
    { moves: ["15/12 Cal Row", "8 Sandbag Cleans (moderate)", "14/11 Cal Ski Erg", "10 Box Jumps (20\", step down)"],
      note: "Sandbag cleans bear hug and stand. No sandbag? Sub 10 DB Hang Cleans. Step down every box jump." },
    { moves: ["14/11 Cal Ski Erg", "10 Goblet Squats (heavy KB)", "12/9 Cal Bike", "8 Burpees"],
      note: "Goblet squats below parallel. Burpees steady, not sprinted. Breathe on the way down." },
    { moves: ["12/9 Cal Bike", "10 DB Thrusters (moderate)", "15/12 Cal Row", "12 Toes-to-Bar"],
      note: "Duration is long — pace 6/10 for rounds 1–5, build to 8/10 in rounds 8–10." },
  ]},
  // Meso 3 (Weeks 9-12) — Peak Shred
  { weeks: [
    { moves: ["14/11 Cal Ski Erg", "6 Power Cleans (55% 1RM)", "12/9 Cal Bike", "10 Pull-Ups"],
      note: "Cleans heavier this meso — crisp singles or touch-and-go doubles. Pull-ups strict: scale to 8." },
    { moves: ["15/12 Cal Row", "8 DB Snatches (4 each arm)", "30m Farmer Carry (heavy)", "10 Burpee Box Jumps (20\")"],
      note: "Farmer carry heavy — grip is the limiter. DB snatches explosive hip drive. Step down box jumps." },
    { moves: ["12/9 Cal Bike", "10 Wall Balls (20/14 lb)", "15/12 Cal Row", "50 Double Unders"],
      note: "Wall balls unbroken. DU scale to 60 singles. Row at 1:45–1:50/500m pace." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (heavy)", "12/9 Cal Bike", "15 Push-Ups"],
      note: "Long EMOM — conserve early. KB swings explosive but controlled. Final 3 rounds push to 8/10." },
  ]},
];

const EMOM_DURATIONS: Record<number, { minutes: number; rounds: number }> = {
  1: { minutes: 28, rounds: 7 },
  2: { minutes: 32, rounds: 8 },
  3: { minutes: 36, rounds: 9 },
  4: { minutes: 40, rounds: 10 },
};

// ─── Weekly progression logic ──────────────────────────────────────

function adjustSetsForWeek(baseSets: number, role: string, weekInMeso: number): number {
  if (weekInMeso === 4) return Math.max(2, Math.ceil(baseSets * 0.6)); // mini deload
  if (weekInMeso === 3) return baseSets + 1; // peak week
  if (weekInMeso === 2 && (role === "secondary" || role === "accessory")) return baseSets + 1;
  return baseSets;
}

function getRIR(weekInMeso: number, role: string): string | null {
  if (role === "conditioning") return null;
  if (weekInMeso === 4) return "4";
  if (role === "explosive") return weekInMeso === 1 ? "3" : "2";
  if (role === "primary") return weekInMeso === 1 ? "3" : weekInMeso === 2 ? "2" : "1";
  if (role === "core" || role === "structural") return weekInMeso === 1 ? "3" : "2";
  return weekInMeso === 1 ? "3" : weekInMeso === 2 ? "2" : "1";
}

function getTempo(role: string, phaseIdx: number): string | null {
  if (role === "explosive" || role === "conditioning") return null;
  // Phase-specific tempos
  if (phaseIdx === 0) {
    // Phase 1: 3-1-1 primary, 3-0-1 secondary/accessory
    if (role === "primary") return "3-1-1";
    if (role === "core" || role === "structural") return "2-1-2";
    return "3-0-1";
  }
  if (phaseIdx === 1) {
    // Phase 2: 2-0-1 primary, 2-1-1 secondary/accessory
    if (role === "primary") return "2-0-1";
    if (role === "core" || role === "structural") return "2-1-2";
    return "2-1-1";
  }
  // Phase 3: 2-0-X primary, 2-0-1 secondary/accessory
  if (role === "primary") return "2-0-X";
  if (role === "core" || role === "structural") return "2-1-2";
  return "2-0-1";
}

// ─── Day converter ─────────────────────────────────────────────────

function convertDay(
  dayTemplate: DayTemplate, dayIdx: number, weekNum: number,
  weekInMeso: number, phaseIdx: number
): any[] {
  const exercises: any[] = [];
  const wk = `W${weekNum}D${dayIdx + 1}`;

  const pairGroups: Record<string, Exercise[]> = {};
  const processed = new Set<string>();

  dayTemplate.exercises.forEach((e) => {
    if (e.pair) {
      if (!pairGroups[e.pair]) pairGroups[e.pair] = [];
      pairGroups[e.pair].push(e);
    }
  });

  let letterIdx = 0;
  const LETTERS = "ABCDEFGHIJKLM";

  for (let i = 0; i < dayTemplate.exercises.length; i++) {
    const e = dayTemplate.exercises[i];

    if (e.pair) {
      if (processed.has(e.pair)) continue;
      processed.add(e.pair);

      const group = pairGroups[e.pair];
      const letter = LETTERS[letterIdx++];
      const groupId = `${letter}${wk}`;
      const label = group.length >= 3 ? "Tri-Set" : group.length === 2 ? "Superset" : null;

      group.forEach((gEx, gi) => {
        const sets = gEx.role === "conditioning" ? gEx.sets : adjustSetsForWeek(gEx.sets, gEx.role, weekInMeso);
        const rir = getRIR(weekInMeso, gEx.role);
        const isLast = gi === group.length - 1;
        const tempo = getTempo(gEx.role, phaseIdx);
        const detailParts: string[] = [gEx.detail];
        if (tempo && !gEx.detail.includes("Tempo")) detailParts.push(`Tempo ${tempo}`);
        if (gEx.intensity) detailParts.push(gEx.intensity.replace(/_/g, " "));

        exercises.push({
          name: `${letter}${gi + 1}. ${gEx.name}`,
          detail: detailParts.filter(Boolean).join(". "),
          sets, reps: gEx.reps, rir,
          rest: isLast ? (gEx.rest || 60) : null,
          type: gEx.role === "conditioning" ? "conditioning" : "exercise",
          group: groupId,
          superset_label: group.length > 1 ? label : null,
        });
      });
    } else {
      const letter = LETTERS[letterIdx++];
      const groupId = `${letter}${wk}`;
      const sets = e.role === "conditioning" ? e.sets : adjustSetsForWeek(e.sets, e.role, weekInMeso);
      const rir = getRIR(weekInMeso, e.role);
      const tempo = getTempo(e.role, phaseIdx);
      const detailParts: string[] = [e.detail];
      if (tempo && !e.detail.includes("Tempo")) detailParts.push(`Tempo ${tempo}`);
      if (e.intensity) detailParts.push(e.intensity.replace(/_/g, " "));

      exercises.push({
        name: `${letter}1. ${e.name}`,
        detail: detailParts.filter(Boolean).join(". "),
        sets, reps: e.reps, rir,
        rest: e.rest,
        type: e.role === "conditioning" ? "conditioning" : "exercise",
        group: groupId,
        superset_label: null,
      });
    }
  }

  exercises.push({
    name: "Mindset Moment",
    detail: getMindset(weekNum, dayIdx + 1),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mindset", group: null, superset_label: null,
  });
  exercises.push({
    name: "Dad Mission",
    detail: getMission(weekNum, dayIdx + 1),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mission", group: null, superset_label: null,
  });

  return exercises;
}

// ─── Saturday EMOM builder ─────────────────────────────────────────

function buildConditioningDay(mesoIdx: number, weekInMeso: number, weekNum: number): any[] {
  const meso = EMOM_MESOCYCLES[mesoIdx % EMOM_MESOCYCLES.length];
  const session = meso.weeks[weekInMeso - 1];
  const dur = EMOM_DURATIONS[weekInMeso];
  const detail = session.moves.map((m, i) => `Minute ${i + 1}: ${m}`).join("\n");

  return [
    {
      name: `EMOM ${dur.minutes} Minutes`,
      detail, sets: dur.rounds, reps: `${dur.minutes} min`,
      rir: null, rest: null,
      type: "conditioning", group: null, superset_label: null,
    },
    {
      name: "Coaching Note",
      detail: `${session.note} Repeat for ${dur.rounds} rounds.`,
      sets: 1, reps: null, rir: null, rest: null,
      type: "note", group: null, superset_label: null,
    },
    {
      name: "Mindset Moment",
      detail: getMindset(weekNum, 6),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: getMission(weekNum, 6),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ─── Rest day builder ──────────────────────────────────────────────

function buildRestDay(weekNum: number): any[] {
  return [
    {
      name: "Full Rest Day",
      detail: "Complete rest. Sleep in, eat well, hydrate. Your body grows during recovery, not during training.",
      sets: 1, reps: null, rir: null, rest: null,
      type: "rest", group: null, superset_label: null,
    },
    {
      name: "Mindset Moment",
      detail: getMindset(weekNum, 7),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: getMission(weekNum, 7),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Verify caller has coach role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "coach")
      .maybeSingle();
    if (!roleData) throw new Error("Not authorized — coach role required");

    const PROGRAM_NAME = "M2F Dad Bod Transformation Challenge";
    const TOTAL_DAYS = 84; // 12 weeks × 7 days

    // Check if program already exists
    const { data: existing } = await supabase
      .from("programs")
      .select("id")
      .eq("name", PROGRAM_NAME)
      .single();

    let programId: string;

    if (existing) {
      programId = existing.id;
      await supabase.from("program_days").delete().eq("program_id", programId);
      await supabase.from("programs").update({
        description: "12-Week Athletic Shred. 3-phase periodized training: Foundation Shred → Metabolic Build → Peak Shred. Structured strength progression, hybrid conditioning, EMOM Saturdays, and smart intensity techniques. Designed for intermediate father athletes.",
        total_days: TOTAL_DAYS,
      }).eq("id", programId);
    } else {
      const { data: newProg, error: progErr } = await supabase
        .from("programs")
        .insert({
          name: PROGRAM_NAME,
          description: "12-Week Athletic Shred. 3-phase periodized training: Foundation Shred → Metabolic Build → Peak Shred. Structured strength progression, hybrid conditioning, EMOM Saturdays, and smart intensity techniques. Designed for intermediate father athletes.",
          total_days: TOTAL_DAYS,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (progErr || !newProg) throw new Error("Failed to create program: " + progErr?.message);
      programId = newProg.id;
    }

    // Generate all 84 program days
    const phases = [phase1, phase2, phase3];
    const PHASE_NAMES = ["Foundation Shred", "Metabolic Build", "Peak Shred"];

    const allDays: { program_id: string; day_number: number; label: string; exercises: unknown[] }[] = [];

    for (let week = 1; week <= 12; week++) {
      const phaseIdx = Math.min(Math.floor((week - 1) / 4), 2);
      const weekInMeso = ((week - 1) % 4) + 1;
      const phase = phases[phaseIdx];
      const phaseName = PHASE_NAMES[phaseIdx];

      for (let dow = 1; dow <= 7; dow++) {
        const dayNumber = (week - 1) * 7 + dow;

        // Sunday = Rest
        if (dow === 7) {
          allDays.push({
            program_id: programId,
            day_number: dayNumber,
            label: `Week ${week} — Rest Day (${phaseName})`,
            exercises: buildRestDay(week),
          });
          continue;
        }

        // Saturday = EMOM Conditioning
        if (dow === 6) {
          allDays.push({
            program_id: programId,
            day_number: dayNumber,
            label: `Week ${week} — Saturday Conditioning (${phaseName}${weekInMeso === 4 ? " / Deload" : ""})`,
            exercises: buildConditioningDay(phaseIdx, weekInMeso, week),
          });
          continue;
        }

        // Mon-Fri training days (dow 1-5 → template index 0-4)
        const template = phase[dow - 1];
        const exercises = convertDay(template, dow - 1, week, weekInMeso, phaseIdx);
        const deloadTag = weekInMeso === 4 ? " / Deload" : "";

        allDays.push({
          program_id: programId,
          day_number: dayNumber,
          label: `Week ${week} — ${template.label} (${phaseName}${deloadTag})`,
          exercises,
        });
      }
    }

    // Insert in batches of 20
    for (let i = 0; i < allDays.length; i += 20) {
      const batch = allDays.slice(i, i + 20);
      const { error: insertErr } = await supabase.from("program_days").insert(batch);
      if (insertErr) throw new Error(`Insert batch ${i} failed: ${insertErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        program_id: programId,
        total_days: allDays.length,
        message: `${PROGRAM_NAME} rebuilt with ${allDays.length} days across 3 phases: ${PHASE_NAMES.join(" → ")}. EMOM Saturdays + interval finishers + phase-specific tempos and intensity techniques.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[SEED-TRANSFORMATION] ERROR:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
