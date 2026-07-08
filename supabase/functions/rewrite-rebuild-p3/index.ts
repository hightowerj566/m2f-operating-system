import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "3da785bc-a03d-4fe9-ae7f-dfed52fb8124";
const RIR_NOTE = "(RIR = Reps In Reserve: RIR 3 means 3 reps left before failure)";
const LOAD_P3 = "Top set at RIR 0–1. Then back-off set: same exercise, reduce load by 15%, perform at RIR 3.";
const LOAD_DELOAD = "Deload week — use 60% of your Phase 3 working loads. Focus on movement quality.";

// Phase 3 progression (0=W9, 1=W10, 2=W11, 3=W12 deload)
const P3_TOP_REPS = ["5", "4", "3", "5"];
const P3_TOP_RIR = ["1", "1", "0-1", "4"];
const P3_BACKOFF_REPS = ["5", "5", "6", null]; // null = no backoff on deload
const P3_SECONDARY_REPS = ["6-8", "6-8", "6-8", "6"];
const P3_ACCESSORY_REPS = ["10-12", "10-12", "10-12", "8"];
const P3_RIR = ["2", "2", "1", "4"];
const P3_SETS = [3, 3, 3, 2];
const EMOM_ROUNDS = [7, 8, 9, 10];
// Lateral bound progression
const LAT_BOUND_REPS = ["4", "5", "5", "6"];

type Ex = {
  name: string; detail: string; sets: number | null; reps: string | null;
  rest: number | null; rir: string | null; type: string; group: string;
  superset_label: string | null;
};

function e(name: string, detail: string, sets: number | null, reps: string | null, rest: number | null, rir: string | null, type: string, group: string, sl: string | null = null): Ex {
  return { name, detail, sets, reps, rest, rir, type, group, superset_label: sl };
}

function lowerWarmup(w: number, d: number): Ex[] {
  const g = `wuW${w}D${d}`;
  return [
    e("W1. Foam Roller Thoracic Extension", "Mid-back over roller, gently extend, hold 2s.", 1, "45s", 0, null, "warmup", g),
    e("W2. Cat-Cow", "Inhale arch, exhale round. Full range.", 1, "10", 0, null, "warmup", g),
    e("W3. Kneeling Hip Flexor Stretch", "Posterior pelvic tilt, lean forward. Hold.", 1, "60s each side", 0, null, "warmup", g),
    e("W4. Hip 90/90 Stretch", "Both legs 90°, rotate over front shin.", 1, "60s each side", 30, null, "warmup", g),
  ];
}

function squat1Activation(w: number): Ex[] {
  const g = `wuW${w}D1`;
  return [
    e("W5. Banded Ankle Dorsiflexion", "Knee-to-wall drill. Improves squat depth.", 2, "10 each side", 30, null, "warmup", g),
    e("W6. Glute Bridge (bodyweight)", "Squeeze glutes, hold 2s at top.", 2, "12", 45, null, "warmup", g),
    e("W7. Bodyweight Squat with Pause", "Full depth, 2s pause.", 2, "8", 45, null, "warmup", g),
    e("W8. Band Pull-Apart", "Shoulder health.", 2, "15", 30, null, "warmup", g),
  ];
}

function hingeActivation(w: number): Ex[] {
  const g = `wuW${w}D4`;
  return [
    e("W5. Banded Good Morning", "Hips back, hamstring stretch, glutes to stand.", 2, "10", 45, null, "warmup", g),
    e("W6. Single-Leg Glute Bridge", "Drive hips up, 2s hold.", 2, "8 each side", 45, null, "warmup", g),
    e("W7. Band Pull-Apart", "Shoulder health.", 2, "15", 30, null, "warmup", g),
  ];
}

function upperWarmup(w: number, d: number): Ex[] {
  const g = `wuW${w}D${d}`;
  return [
    e("W1. Shoulder CARs", "Full range, no compensation.", 2, "5 each arm", 0, null, "warmup", g),
    e("W2. Wall Slide", "Maintain wall contact.", 2, "10", 0, null, "warmup", g),
    e("W3. Band Pull-Apart", "Squeeze shoulder blades.", 3, "12", 30, null, "warmup", g),
    e("W4. Push-Up (slow eccentric)", "3s descent.", 2, "6", 45, null, "warmup", g),
  ];
}

function p3Core(w: number, d: number): Ex[] {
  const g = `coreW${w}D${d}`;
  return [
    e("E1. Hollow Body Hold", "Arms overhead, legs extended, lower back pressed into floor. If form breaks, bend knees slightly.", 3, "20-25s", 0, null, "exercise", g, "Core Circuit"),
    e("E2. Copenhagen Plank", "Top leg on bench, bottom hanging. Hold. Builds adductor strength, groin resilience, and lateral core stability.", 3, "20-25s each side", 0, null, "exercise", g, "Core Circuit"),
    e("E3. Suitcase Carry", "Heavy KB/DB in one hand, walk 30m without leaning. Switch hands. Anti-lateral flexion under load.", 3, "30m each side", 60, null, "exercise", g, "Core Circuit"),
  ];
}

function primaryTopBackoff(name: string, detail: string, topReps: string, topRIR: string, backoffReps: string | null, isDeload: boolean, group: string): Ex[] {
  if (isDeload) {
    return [e(name, `${detail} ${LOAD_DELOAD} ${RIR_NOTE}`, 2, "5", 120, "4", "exercise", group)];
  }
  const exercises: Ex[] = [
    e(`${name} — Top Set`, `${detail} ${LOAD_P3} ${RIR_NOTE}`, 1, topReps, 180, topRIR, "exercise", group),
  ];
  if (backoffReps) {
    exercises.push(
      e(`${name} — Back-Off Set`, `Same movement, reduce load by 15%. Focus on speed and control at RIR 3.`, 1, backoffReps, 120, "3", "exercise", group)
    );
  }
  return exercises;
}

// ── Day Builders ──

function buildDay1(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D1`;
  const rir = P3_RIR[mw]; const sets = P3_SETS[mw];

  return [
    ...lowerWarmup(w, 1),
    ...squat1Activation(w),
    // Power
    e("A1. Depth Jump to Broad Jump", "Step off 12–18\" box, land, immediately explode forward. Maximal intent. Full recovery.", dl ? 2 : 3, "3", 90, null, "exercise", g("pp")),
    // Primary — Top Set + Back-Off
    ...primaryTopBackoff("B1. Barbell Back Squat", "Tempo 2-0-X-0. 2s eccentric, explode up. Full depth, chest proud, brace maximally.", P3_TOP_REPS[mw], P3_TOP_RIR[mw], P3_BACKOFF_REPS[mw], dl, g("ps")),
    e("B1 — Coaching Note", "Phase 3 demands maximal intent on the concentric. 'X' tempo means explosive — move the bar as fast as possible while maintaining control. Mental cue: 'drive the floor away from you.'", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Barbell Romanian Deadlift", `Tempo 2-0-1-1. Bar close, hips back, hamstring stretch. ${dl ? LOAD_DELOAD : "Double progression: top of range at RIR 2+ → add load."}`, sets, P3_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Walking Lunge (heavy DB)", "Tempo 2-0-1-1. Controlled, rear knee near floor. Heavier loading than Phase 2.", sets, `${P3_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl", "Tempo 2-0-1-1. Squeeze, control eccentric.", sets, P3_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM, 2s pause.", sets, "15", 45, rir, "exercise", g("calf")),
    // Lateral Bounds
    e("D4. Lateral Bounds", `Explosive lateral jump, stick the landing on single leg for 1s. Build up across Phase 3. Frontal plane power.`, dl ? 2 : 3, `${LAT_BOUND_REPS[mw]} each side`, 60, null, "exercise", g("lb")),
    // Core
    ...p3Core(w, 1),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay2(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D2`;
  const rir = P3_RIR[mw]; const sets = P3_SETS[mw];

  return [
    ...upperWarmup(w, 2),
    // Power
    e("A1. Plyo Push-Up", "Hands leave the floor at top of push-up. Land with soft elbows. Maximal intent. If too advanced, use medicine ball chest pass from knees.", dl ? 2 : 3, "5", 60, null, "exercise", g("pp")),
    // Primary — Top Set + Back-Off
    ...primaryTopBackoff("B1. Barbell Bench Press", "Tempo 2-0-X-0. 2s eccentric, explode off chest. Full arch, shoulder blades retracted, feet planted.", P3_TOP_REPS[mw], P3_TOP_RIR[mw], P3_BACKOFF_REPS[mw], dl, g("ps")),
    e("B1 — Coaching Note", "Phase 3 bench is about maximal force production. Drive feet into floor, squeeze glutes, create a stable platform. The explosive concentric is the priority — if the bar slows, the set is done.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Seated Cable Row", `Tempo 3-0-1-1. Pull to abdomen, squeeze. ${dl ? LOAD_DELOAD : "Double progression at RIR 2+."}`, sets, P3_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Incline Dumbbell Press", "Tempo 2-0-1-1. 30° incline. Upper chest.", sets, P3_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Face Pull (cable)", "Tempo 2-0-1-1. Pull to face, externally rotate.", sets, "12-15", 60, rir, "exercise", g("hb")),
    e("D3. Cable Woodchop (high-to-low)", "Tempo 2-0-1-1. Rotate from high to low. Anti-rotation + transverse plane.", 3, "10 each side", 45, null, "exercise", g("wc")),
    e("D4. DB Lateral Raise", "Tempo 2-0-1-1. Shoulder height, control descent.", 3, "12-15", 45, rir, "exercise", g("lat")),
    e("D5. Hammer Curl", `Tempo 2-0-1-1. Neutral grip. ${dl ? "2×8" : "3×10-12. On final set: drop weight by 30%, immediately perform reps to failure (drop set)."}`, dl ? 2 : 3, dl ? "8" : "10-12", 45, rir, "exercise", g("bi")),
    e("D6. Overhead Tricep Extension (cable)", "Tempo 2-0-1-1. Face away from cable, extend overhead. Full stretch at bottom, lockout at top.", 3, "12-15", 45, rir, "exercise", g("tri")),
    // Core
    ...p3Core(w, 2),
    // Injury Resilience
    e("F1. Band Pull-Apart (rear delt finisher)", "2×15. Shoulder insurance.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST
    e("F2. Assault Bike or Rower (easy)", "8–10 min. HR 125–145 BPM, RPE 4–5.", 1, "8-10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay3(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D3`;
  return [
    e("W1. Full Body Mobility Sequence", "Hips, ankles, T-spine, shoulders. 8–10 min.", 1, "8-10 min", null, null, "warmup", g("wu")),
    e("E1. Dead Bug", "Lower back into floor. Quality reps. Only day this appears.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("E2. Bird Dog", "Opposite arm/leg. Core stable, hips level.", 2, "10 each side", 60, null, "exercise", g("core")),
    e("E3. Copenhagen Plank", "Top leg on bench, bottom hanging. Adductor strength and groin resilience.", 2, "20s each side", 60, null, "exercise", g("core")),
    e("F. Zone 2 — Incline Walk or Light Jog", "25–35 min. HR 125–145 BPM, RPE 4–5. Nasal breathing. Aerobic base.", 1, "25-35 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay4(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D4`;
  const rir = P3_RIR[mw]; const sets = P3_SETS[mw];

  return [
    ...lowerWarmup(w, 4),
    ...hingeActivation(w),
    // Power
    e("A1. Kettlebell Swing (heavy)", "Explosive hip drive. Heavier bell than Phase 2. Full reset.", dl ? 2 : 3, "8", 60, null, "exercise", g("pp")),
    // Primary — Top Set + Back-Off
    ...primaryTopBackoff("B1. Trap Bar Deadlift", "Tempo 2-0-X-0. Neutral grip, hips hinge, drive through floor explosively. Safer spinal position than conventional for high-intensity work.", P3_TOP_REPS[mw], P3_TOP_RIR[mw], P3_BACKOFF_REPS[mw], dl, g("ps")),
    e("B1 — Coaching Note", "The trap bar deadlift combines squat and hinge patterns — perfect for maximal loading with reduced injury risk. Set up with hips slightly higher than a squat, grab handles, and DRIVE the floor away.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Front Squat", `Tempo 2-0-1-1. Elbows high, torso vertical. ${dl ? LOAD_DELOAD : "Double progression at RIR 2+."}`, sets, P3_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Walking Lunge (heavy DB)", "Tempo 2-0-1-1. Heavy, controlled. Rear knee near floor.", sets, `${P3_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl", "Tempo 2-0-1-1. Squeeze, control eccentric.", sets, P3_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM, 2s pause.", sets, "15", 45, rir, "exercise", g("calf")),
    e("D4. Seated Calf Raise", "Tempo 2-0-2-1. Knees at 90°, targets soleus. 2s pause at stretch.", 3, "15-20", 45, rir, "exercise", g("scalf")),
    e("D5. Prone Hip Extension", "Face down, hips at bench edge. Extend one leg, squeeze glute-ham at top, 2s hold.", 2, "15 each side", 45, null, "exercise", g("phe")),
    e("D6. Lateral Sled Drag", "Push through outside leg, 15m each direction. Or lateral band walk × 15 steps. Frontal plane.", 3, "15m each direction", 60, null, "exercise", g("lsd")),
    e("D7. Landmine Rotation", "Barbell in landmine, hold end at chest height. Rotate explosively side to side. Transverse plane power.", 3, "6 each side", 60, null, "exercise", g("lr")),
    // Core
    ...p3Core(w, 4),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min. HR 125–145 BPM, RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay5(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D5`;
  const rir = P3_RIR[mw]; const sets = P3_SETS[mw];

  const warmup: Ex[] = [
    e("W1. Shoulder CARs", "Full range, no compensation.", 2, "5 each arm", 0, null, "warmup", `wuW${w}D5`),
    e("W2. Wall Slide", "Maintain wall contact.", 2, "10", 0, null, "warmup", `wuW${w}D5`),
    e("W3. Band Pull-Apart", "Squeeze shoulder blades.", 2, "15", 30, null, "warmup", `wuW${w}D5`),
    e("W4. Band Shoulder Dislocate", "Smooth arc, pain-free range.", 2, "8", 30, null, "warmup", `wuW${w}D5`),
  ];

  return [
    ...warmup,
    // Power
    e("A1. Medicine Ball Slam", "Full-body force. Reset between reps.", dl ? 2 : 3, "5", 60, null, "exercise", g("pp")),
    // Primary — Top Set + Back-Off
    ...primaryTopBackoff("B1. Barbell Overhead Press", "Tempo 2-0-X-0. Strict press from front rack to lockout. 2s eccentric, explosive concentric. Brace hard.", P3_TOP_REPS[mw], P3_TOP_RIR[mw], P3_BACKOFF_REPS[mw], dl, g("ps")),
    e("B1 — Coaching Note", "Phase 3 OHP: maximal intent. If the bar stalls at forehead height, you're not driving your head through fast enough. Once bar passes your face, push head forward and press UP.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Weighted Chin-Up (or Lat Pulldown)", `Tempo 2-0-1-1. Add weight via belt or DB between feet. Full dead hang at bottom, chin over bar at top. If can't do weighted, use lat pulldown. ${dl ? LOAD_DELOAD : "Double progression."}`, sets, P3_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Dumbbell Overhead Press", "Tempo 2-0-1-1. Standing. Independent arm pressing.", sets, P3_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Single-Arm Dumbbell Row", "Tempo 2-0-1-1. Pull to hip, squeeze lat.", sets, `${P3_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("hb")),
    e("D3. Cable Lateral Raise", "Tempo 2-0-1-1. Cross-body. Constant tension.", 3, "12-15", 45, rir, "exercise", g("lat")),
    e("D4. Overhead Tricep Extension (cable)", "Tempo 2-0-1-1. Full stretch, lockout.", 3, "12-15", 45, rir, "exercise", g("tri")),
    // Core
    ...p3Core(w, 5),
    // Injury Resilience
    e("F1. Face Pull (rear delt finisher)", "2×15. Shoulder insurance.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST
    e("F2. Structured Aerobic Intervals", "6 rounds: 30s hard on assault bike (RPE 8–9, HR 160–175 BPM) / 90s easy (RPE 3, HR below 130 BPM). AFTER all lifting.", 6, "30s hard / 90s easy", null, null, "conditioning", g("cf")),
  ];
}

function buildDay6(w: number, mw: number, isWeek11: boolean): Ex[] {
  const g = (s: string) => `${s}W${w}D6`;
  const rounds = EMOM_ROUNDS[mw];
  const duration = rounds * 4;

  const warmup = [
    e("W1. Jump Rope or Light Jog", "2–3 min easy. RPE 3–4.", 1, "2-3 min", 0, null, "warmup", g("wu")),
    e("W2. Bodyweight Squat", "Full depth, controlled.", 1, "10", 0, null, "warmup", g("wu")),
    e("W3. Band Pull-Apart", "Shoulder activation.", 1, "15", 0, null, "warmup", g("wu")),
    e("W4. Inchworm", "Hands to plank, feet to hands.", 1, "5", 30, null, "warmup", g("wu")),
  ];

  // Athletic primer for Phase 3
  const primer = [
    e("Primer. Athletic Movement Warm-Up", "2 rounds: 5-yard lateral shuffle left + 5-yard lateral shuffle right + 10-yard backpedal + 10-yard acceleration sprint. Walk back to start = rest. Full recovery between rounds.", 2, "1 round", 60, null, "warmup", g("primer")),
  ];

  // Week 11: Replace EMOM with 5×200m row
  if (isWeek11) {
    return [
      ...warmup,
      ...primer,
      e("A. 5×200m Row — Max Effort", "All-out maximal effort on each 200m. Rest 3 FULL minutes between efforts. Record each split. Goal: maintain consistent splits across all 5 rounds. HR target: 165–180+ BPM (RPE 9–10) during effort, full recovery between.\n\nThis is a TRUE test of anaerobic power and repeatability. Give everything on each effort.", 5, "200m row", 180, null, "conditioning", g("row")),
      e("B. Cooldown Walk", "5–8 min easy. HR below 130 BPM. Longer cooldown after max effort.", 1, "5-8 min", null, null, "conditioning", g("cd")),
    ];
  }

  return [
    ...warmup,
    ...primer,
    e(`A. EMOM ${duration} (${rounds} rounds × 4 minutes)`, `HR target: 145–165 BPM (RPE 6–7).\n\nMinute 1 (Engine): Ski Erg 12 cal\nMinute 2 (Strength): KB Clean & Press × 6 (3 each arm)\nMinute 3 (Engine): Assault Bike 12 cal\nMinute 4 (Plyometric): Goblet Squat Jump × 6`, rounds, "4-min rounds", null, null, "conditioning", g("emom")),
    e("B. Cooldown Walk", "5 min easy. HR below 130 BPM.", 1, "5 min", null, null, "conditioning", g("cd")),
  ];
}

function buildDay7(w: number): Ex[] {
  return [e("Rest Day", "Complete rest. Sleep, hydration, family time.", null, null, null, null, "rest", `restW${w}D7`)];
}

// ── Week 13: Full Deload ──

function buildDeloadDay1(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D1`;
  return [
    ...lowerWarmup(w, 1),
    ...squat1Activation(w),
    e("B1. Goblet Squat", `Tempo 3-1-1-0. Light load — 50-60% of Phase 1 working weight. Focus purely on movement quality. ${RIR_NOTE}`, 2, "8", 90, "5", "exercise", g("ps")),
    e("C1. DB Romanian Deadlift", "Tempo 3-0-1-1. Light. Feel the stretch, groove the pattern.", 2, "8", 90, "5", "exercise", g("sc")),
    e("D1. Step-Up (light)", "Tempo 2-0-1-1. Controlled, balance focus.", 2, "8 each side", 60, "5", "exercise", g("ha")),
    e("D2. Standing Calf Raise", "Tempo 2-0-1-2. Light, full ROM.", 2, "12", 45, "5", "exercise", g("calf")),
    e("E1. Dead Bug", "Quality reps only.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("F. Easy Walk", "15 min. HR 120–135 BPM. RPE 3.", 1, "15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDeloadDay2(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D2`;
  return [
    ...upperWarmup(w, 2),
    e("B1. DB Bench Press", `Tempo 3-1-1-0. 50-60% working weight. Movement quality only. ${RIR_NOTE}`, 2, "8", 90, "5", "exercise", g("ps")),
    e("C1. Seated Cable Row", "Tempo 3-0-1-1. Light. Feel the squeeze.", 2, "8", 90, "5", "exercise", g("sc")),
    e("D1. Face Pull", "Tempo 2-0-1-1. Light.", 2, "12", 45, "5", "exercise", g("hb")),
    e("D2. DB Lateral Raise", "Tempo 2-0-1-1. Light.", 2, "12", 45, "5", "exercise", g("lat")),
    e("E1. Pallof Press", "Light anti-rotation.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("F1. Band Pull-Apart", "Shoulder care.", 2, "15", 30, null, "exercise", g("fin")),
    e("F2. Easy Bike/Rower", "10 min. HR 120–135 BPM. RPE 3.", 1, "10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDeloadDay3(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D3`;
  return [
    e("W1. Full Body Mobility", "Extended session — 15–20 min. Take your time.", 1, "15-20 min", null, null, "warmup", g("wu")),
    e("E1. Dead Bug", "Quality.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("E2. Bird Dog", "Quality.", 2, "10 each side", 60, null, "exercise", g("core")),
    e("F. Zone 2 Walk", "20–30 min. HR 120–140 BPM. RPE 3–4. Enjoy it.", 1, "20-30 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDeloadDay4(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D4`;
  return [
    ...lowerWarmup(w, 4),
    ...hingeActivation(w),
    e("B1. DB Romanian Deadlift", `Tempo 3-1-1-0. Light — 50-60%. Movement quality. ${RIR_NOTE}`, 2, "8", 90, "5", "exercise", g("ps")),
    e("C1. Goblet Squat", "Tempo 3-0-1-1. Light, full depth.", 2, "8", 90, "5", "exercise", g("sc")),
    e("D1. Walking Lunge (light)", "Tempo 2-0-1-1. BW or very light DB.", 2, "8 each side", 60, "5", "exercise", g("ha")),
    e("D2. Standing Calf Raise", "Tempo 2-0-1-2. Light, full ROM.", 2, "12", 45, "5", "exercise", g("calf")),
    e("E1. Glute Bridge Hold", "Squeeze and hold.", 2, "30s", 60, null, "exercise", g("core")),
    e("F. Easy Walk", "15 min. HR 120–135 BPM. RPE 3.", 1, "15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDeloadDay5(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D5`;
  return [
    e("W1. Shoulder CARs", "Full range, slow.", 2, "5 each arm", 0, null, "warmup", `wuW${w}D5`),
    e("W2. Wall Slide", "Wall contact throughout.", 2, "10", 0, null, "warmup", `wuW${w}D5`),
    e("W3. Band Pull-Apart", "Shoulder health.", 2, "15", 30, null, "warmup", `wuW${w}D5`),
    e("B1. Standing DB Overhead Press", `Tempo 3-1-1-0. 50-60% working weight. ${RIR_NOTE}`, 2, "8", 90, "5", "exercise", g("ps")),
    e("C1. Lat Pulldown", "Tempo 3-0-1-1. Light, feel the stretch.", 2, "8", 90, "5", "exercise", g("sc")),
    e("D1. Face Pull", "Light. Shoulder care.", 2, "12", 45, "5", "exercise", g("hb")),
    e("D2. Cable Lateral Raise", "Light. Movement quality.", 2, "12", 45, "5", "exercise", g("lat")),
    e("E1. Hollow Body Hold", "Modified if needed.", 2, "15s", 60, null, "exercise", g("core")),
    e("F1. Face Pull finisher", "Shoulder insurance.", 2, "15", 30, null, "exercise", g("fin")),
    e("F2. Easy Bike", "10 min. HR 120–135 BPM.", 1, "10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDeloadDay6(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D6`;
  return [
    e("W1. Light Jog", "5 min easy. RPE 3.", 1, "5 min", 0, null, "warmup", g("wu")),
    e("A. Easy Mixed Modality", "20 min alternating: 3 min assault bike, 3 min row, 3 min walk. All at HR 125–140 BPM, RPE 4–5. No intensity. This is active recovery and aerobic maintenance.", 1, "20 min", null, null, "conditioning", g("cf")),
    e("B. Stretch & Cooldown", "10 min full-body stretch. Hit every major muscle group. You earned this.", 1, "10 min", null, null, "conditioning", g("cd")),
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results: string[] = [];

    // Phase 3: Weeks 9-12
    for (let week = 9; week <= 12; week++) {
      const mw = week - 9; // 0-indexed
      const isWeek11 = week === 11;
      const days = [
        { dn: (week-1)*7+1, ex: buildDay1(week, mw), label: "Day 1 — Lower Body: Squat Emphasis" },
        { dn: (week-1)*7+2, ex: buildDay2(week, mw), label: "Day 2 — Upper Body: Horizontal Push Emphasis" },
        { dn: (week-1)*7+3, ex: buildDay3(week), label: "Day 3 — Zone 2 / Active Recovery" },
        { dn: (week-1)*7+4, ex: buildDay4(week, mw), label: "Day 4 — Lower Body: Hinge Emphasis" },
        { dn: (week-1)*7+5, ex: buildDay5(week, mw), label: "Day 5 — Upper Body: Vertical Push Emphasis" },
        { dn: (week-1)*7+6, ex: buildDay6(week, mw, isWeek11), label: isWeek11 ? "Day 6 — Saturday Max Effort Row" : "Day 6 — Saturday Athletic Conditioning" },
        { dn: (week-1)*7+7, ex: buildDay7(week), label: "Day 7 — Rest" },
      ];
      for (const d of days) {
        const { error } = await supabase
          .from("program_days")
          .update({ exercises: d.ex, label: d.label })
          .eq("program_id", PROGRAM_ID)
          .eq("day_number", d.dn);
        results.push(error ? `W${week}D${d.dn}: FAIL` : `W${week} Day ${d.dn}: ✓ (${d.ex.length})`);
      }
    }

    // Week 13: Full Deload
    const w13Days = [
      { dn: 85, ex: buildDeloadDay1(13), label: "Day 1 — Lower Body: Deload" },
      { dn: 86, ex: buildDeloadDay2(13), label: "Day 2 — Upper Body: Deload" },
      { dn: 87, ex: buildDeloadDay3(13), label: "Day 3 — Mobility & Recovery" },
      { dn: 88, ex: buildDeloadDay4(13), label: "Day 4 — Lower Body: Deload" },
      { dn: 89, ex: buildDeloadDay5(13), label: "Day 5 — Upper Body: Deload" },
      { dn: 90, ex: buildDeloadDay6(13), label: "Day 6 — Active Recovery" },
      { dn: 91, ex: buildDay7(13), label: "Day 7 — Rest" },
    ];
    for (const d of w13Days) {
      const { error } = await supabase
        .from("program_days")
        .update({ exercises: d.ex, label: d.label })
        .eq("program_id", PROGRAM_ID)
        .eq("day_number", d.dn);
      results.push(error ? `W13 D${d.dn}: FAIL` : `W13 Day ${d.dn}: ✓ (${d.ex.length})`);
    }

    return new Response(
      JSON.stringify({ success: true, phase: "3+deload", weeks: "9-13", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[REWRITE-P3]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
