import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "3da785bc-a03d-4fe9-ae7f-dfed52fb8124";
const RIR_NOTE = "(RIR = Reps In Reserve: RIR 3 means 3 reps left before failure)";
const LOAD_LOWER = "Add 5 lb to lower body compounds each week when all sets are completed at RIR 3+.";
const LOAD_UPPER = "Add 2.5 lb to upper body compounds each week when all sets are completed at RIR 3+.";
const LOAD_DELOAD = "Deload week — use Week 1 loads. Focus on movement quality, not intensity.";

// Phase 1 progression tables (index 0=W1, 1=W2, 2=W3, 3=W4 deload)
const P1_PRIMARY_REPS = ["8", "9", "10", "8"];
const P1_SECONDARY_REPS = ["10", "11", "12", "8"];
const P1_ACCESSORY_REPS = ["10", "11", "12", "8"];
const P1_RIR = ["3", "3", "2", "4"];
const P1_SETS = [3, 3, 3, 2];
const EMOM_ROUNDS = [7, 8, 9, 10];

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
    e("W1. Foam Roller Thoracic Extension", "Lie face-up with foam roller across mid-back. Gently extend over roller, hold 2s. Mobilizes thoracic spine.", 1, "45s", 0, null, "warmup", g),
    e("W2. Cat-Cow", "On all fours, inhale to arch (cow), exhale to round (cat). Move slowly through full spinal range.", 1, "10", 0, null, "warmup", g),
    e("W3. Kneeling Hip Flexor Stretch", "Half-kneeling, rear knee on pad. Posterior pelvic tilt, lean forward gently. Hold. Releases psoas for better squat/hinge depth.", 1, "60s each side", 0, null, "warmup", g),
    e("W4. Hip 90/90 Stretch", "Sit with both legs at 90°. Rotate torso over front shin, maintaining tall posture.", 1, "60s each side", 30, null, "warmup", g),
  ];
}

function lowerActivation(w: number, d: number, isSquat: boolean): Ex[] {
  const g = `wuW${w}D${d}`;
  if (isSquat) {
    return [
      e("W5. Glute Bridge (bodyweight)", "Squeeze glutes at top, hold 2s. Focus on hip extension, not lumbar hyperextension.", 2, "12", 45, null, "warmup", g),
      e("W6. Bodyweight Squat with Pause", "Full depth, pause 2s at bottom, maintain tension, stand up.", 2, "8", 45, null, "warmup", g),
      e("W7. Band Pull-Apart", "Keep arms straight, squeeze shoulder blades together at end range.", 2, "15", 30, null, "warmup", g),
    ];
  }
  return [
    e("W5. Banded Good Morning", "Band around neck and under feet. Push hips back, feel hamstring stretch, squeeze glutes to stand.", 2, "10", 45, null, "warmup", g),
    e("W6. Single-Leg Glute Bridge", "One foot planted, opposite knee pulled to chest. Drive hips up, 2s hold at top.", 2, "8 each side", 45, null, "warmup", g),
    e("W7. Band Pull-Apart", "Keep arms straight, squeeze shoulder blades together. Shoulder health on non-upper days.", 2, "15", 30, null, "warmup", g),
  ];
}

function upperWarmup(w: number, d: number): Ex[] {
  const g = `wuW${w}D${d}`;
  return [
    e("W1. Shoulder CARs", "Controlled Articular Rotations — move each arm through full pain-free range slowly. No trunk compensation.", 2, "5 each arm", 0, null, "warmup", g),
    e("W2. Wall Slide", "Back, head, arms flat against wall. Slide arms up overhead maintaining wall contact.", 2, "10", 0, null, "warmup", g),
    e("W3. Band Pull-Apart", "Pull band apart by squeezing shoulder blades together. Control the return.", 3, "12", 30, null, "warmup", g),
    e("W4. Push-Up (slow eccentric)", "Descend for 3 full seconds, push up. Modify on knees if needed.", 2, "6", 45, null, "warmup", g),
  ];
}

function day5Warmup(w: number): Ex[] {
  const g = `wuW${w}D5`;
  return [
    e("W1. Shoulder CARs", "Controlled Articular Rotations — full pain-free range, no trunk compensation.", 2, "5 each arm", 0, null, "warmup", g),
    e("W2. Wall Slide", "Back, head, arms flat against wall. Slide overhead maintaining contact.", 2, "10", 0, null, "warmup", g),
    e("W3. Band Pull-Apart", "Squeeze shoulder blades at end range.", 2, "15", 30, null, "warmup", g),
    e("W4. Band Shoulder Dislocate", "Wide grip on band, pass overhead and behind back smoothly. Pain-free range only.", 2, "8", 30, null, "warmup", g),
  ];
}

// ── Build Day Functions ──

function buildDay1(w: number, mw: number): Ex[] {
  const isDeload = mw === 3; // 0-indexed: mw=3 is week 4
  const g = (s: string) => `${s}W${w}D1`;
  const rir = P1_RIR[mw];
  const sets = P1_SETS[mw];
  const loadNote = isDeload ? LOAD_DELOAD : LOAD_LOWER;

  return [
    ...lowerWarmup(w, 1),
    ...lowerActivation(w, 1, true),
    // Power
    e("A1. Squat Jump (bodyweight)", "Light, controlled jump. Land softly, absorb through hips/knees. Reset fully between reps.", isDeload ? 2 : 3, "4", 60, null, "exercise", g("pp")),
    // Primary
    e("B1. Goblet Squat", `Tempo 3-1-1-0. Hold DB vertically against chest, chest proud, brace core, push knees out. 3s eccentric, 1s pause at bottom. ${loadNote} ${RIR_NOTE}`, sets, P1_PRIMARY_REPS[mw], 90, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "The goblet squat teaches proper mechanics before barbell loading. Keep elbows inside knees at bottom — if they flare, the weight is too heavy. Think 'sit between your hips.'", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Romanian Deadlift (dumbbell)", `Tempo 3-0-1-1. Slight knee bend, push hips back, DBs close to legs, deep hamstring stretch, neutral spine. ${loadNote}`, sets, P1_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Step-Up (bodyweight or light DB)", "Tempo 2-0-1-1. Drive through heel of lead leg. Control descent. Focus on stability.", sets, `${P1_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl (machine)", "Tempo 2-0-1-1. Squeeze hamstrings at peak. 2s eccentric lowering. No momentum.", sets, P1_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM — rise fully, pause 2s at top, lower into full stretch.", sets, "15", 45, rir, "exercise", g("calf")),
    // Reverse Lunge (Phase 1 only, not on deload)
    ...(isDeload ? [] : [
      e("D4. Reverse Lunge (bodyweight or light DB)", "Tempo 2-0-1-1. Step back, rear knee nearly touches floor, drive through front heel. Builds unilateral capacity for Bulgarian split squats in Phase 2.", 2, "10 each side", 60, rir, "exercise", g("lu")),
    ]),
    // Core
    e("E1. Dead Bug", "Lower back pressed into floor. Extend opposite arm and leg slowly. Exhale on extension.", 3, "8 each side", 0, null, "exercise", g("core"), "Core Circuit"),
    e("E2. Glute Bridge Hold", "Hips up, straight line knees to shoulders, squeeze glutes maximally.", 3, "30s", 60, null, "exercise", g("core"), "Core Circuit"),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min, 3.0–3.5 mph, 8–12% incline. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay2(w: number, mw: number): Ex[] {
  const isDeload = mw === 3;
  const g = (s: string) => `${s}W${w}D2`;
  const rir = P1_RIR[mw];
  const sets = P1_SETS[mw];
  const loadNote = isDeload ? LOAD_DELOAD : LOAD_UPPER;

  return [
    ...upperWarmup(w, 2),
    // Power
    e("A1. Medicine Ball Rotational Throw", "Stand sideways to wall. Load trail hip, rotate through core, throw with hip and trunk rotation. Catch rebound. Reset fully. Transverse plane power.", isDeload ? 2 : 3, "5 each side", 60, null, "exercise", g("pp")),
    // Primary
    e("B1. Dumbbell Bench Press", `Tempo 3-1-1-0. Retract and depress shoulder blades, slight arch, 3s eccentric, 1s pause at chest. ${loadNote} ${RIR_NOTE}`, sets, P1_PRIMARY_REPS[mw], 90, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "Think 'bend the bar' with the DBs — externally rotate at the shoulder. Shoulder blades pinched the entire set. If you lose retraction, the set is over.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Seated Cable Row", `Tempo 3-0-1-1. Sit tall, pull to lower abdomen, squeeze shoulder blades at peak. 3s eccentric on return. ${loadNote}`, sets, P1_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Incline Dumbbell Press", "Tempo 2-0-1-1. 30° incline. Upper chest focus. Don't flare elbows past 45°.", sets, P1_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Face Pull (cable)", "Tempo 2-0-1-1. Pull rope to face, externally rotate at top. Squeeze upper back and rear delts.", sets, "12", 60, rir, "exercise", g("hb")),
    e("D3. DB Lateral Raise", "Tempo 2-0-1-1. Slight forward lean, raise to shoulder height leading with elbows. No swinging.", 3, "12-15", 45, rir, "exercise", g("lat")),
    e("D4. Dumbbell Curl", "Tempo 2-0-1-1. Full ROM — full extension at bottom, supinate at top. No body English.", 2, "10", 45, rir, "exercise", g("bi")),
    // Core
    e("E1. Forearm Plank", "Straight line head to heels. Brace core. If hips sag, set is done.", 3, "30s", 0, null, "exercise", g("core"), "Core Circuit"),
    e("E2. Pallof Press", "Stand perpendicular to cable, press handle out, resist rotation. Stable hips and shoulders.", 3, "10 each side", 60, null, "exercise", g("core"), "Core Circuit"),
    // Injury Resilience
    e("F1. Band Pull-Apart (rear delt finisher)", "Zero ego, feel rear delt and external rotators. Shoulder insurance — never skip.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST
    e("F2. Assault Bike or Rower (easy)", "8–10 min. HR 125–145 BPM (Zone 2), RPE 4–5. Flush metabolites.", 1, "8-10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay3(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D3`;
  return [
    e("W1. Full Body Mobility Sequence", "Gentle, controlled movements targeting hips, ankles, T-spine, shoulders. 8–10 min.", 1, "8-10 min", null, null, "warmup", g("wu")),
    e("E1. Dead Bug", "Lower back pressed into floor. Opposite arm/leg extension. Quality reps — this is the ONLY day Dead Bug appears.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("E2. Bird Dog", "All fours, extend opposite arm/leg. Keep core stable, hips level. Avoid rotation.", 2, "10 each side", 60, null, "exercise", g("core")),
    e("E3. Side Plank", "Forearm and side of foot, straight line head to heels. Brace core.", 2, "20s each side", 60, null, "exercise", g("core")),
    e("F. Zone 2 — Incline Walk or Light Jog", "25–35 min. HR 125–145 BPM (Zone 2), RPE 4–5. Conversational pace. Nasal breathing. Aerobic base — do NOT push intensity.", 1, "25-35 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay4(w: number, mw: number): Ex[] {
  const isDeload = mw === 3;
  const g = (s: string) => `${s}W${w}D4`;
  const rir = P1_RIR[mw];
  const sets = P1_SETS[mw];
  const loadNote = isDeload ? LOAD_DELOAD : LOAD_LOWER;

  return [
    ...lowerWarmup(w, 4),
    ...lowerActivation(w, 4, false),
    // Power
    e("A1. Kettlebell Swing", "Hinge explosively, project bell with hip drive — not arm pull. Snap hips, squeeze glutes at top. Full recovery between sets.", isDeload ? 2 : 3, "8", 60, null, "exercise", g("pp")),
    // Primary
    e("B1. Dumbbell Romanian Deadlift", `Tempo 3-1-1-0. Push hips back, DBs close to legs, deep hamstring stretch. 1s pause below knee, drive hips forward. Neutral spine. ${loadNote} ${RIR_NOTE}`, sets, P1_PRIMARY_REPS[mw], 90, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "The RDL is a HIP exercise, not a back exercise. Initiate by pushing hips back as if closing a car door with your butt. DBs travel straight down — they don't drift forward.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Goblet Squat", `Tempo 3-0-1-1. Cross-pattern squat on hinge day. Chest proud, knees out, full depth. ${loadNote}`, sets, P1_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Walking Lunge (dumbbell)", "Tempo 2-0-1-1. Controlled steps, rear knee nearly touches floor, drive through front heel.", sets, `${P1_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl (machine)", "Tempo 2-0-1-1. Squeeze hamstrings at peak. Control eccentric. No hip lift.", sets, P1_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM, 2s pause at top, lower into full stretch.", sets, "15", 45, rir, "exercise", g("calf")),
    // Core
    e("E1. Dead Bug", "Lower back pressed into floor. Opposite arm/leg. Exhale on extension.", 3, "8 each side", 0, null, "exercise", g("core"), "Core Circuit"),
    e("E2. Glute Bridge Hold", "Hips up, squeeze glutes, hold steady.", 3, "30s", 60, null, "exercise", g("core"), "Core Circuit"),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min, 3.0–3.5 mph, 8–12% incline. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay5(w: number, mw: number): Ex[] {
  const isDeload = mw === 3;
  const g = (s: string) => `${s}W${w}D5`;
  const rir = P1_RIR[mw];
  const sets = P1_SETS[mw];
  const loadNote = isDeload ? LOAD_DELOAD : LOAD_UPPER;

  return [
    ...day5Warmup(w),
    // Power
    e("A1. Medicine Ball Slam", "Reach overhead, brace core, slam with full-body force. Reset fully between reps.", isDeload ? 2 : 3, "5", 60, null, "exercise", g("pp")),
    // Primary
    e("B1. Standing Dumbbell Overhead Press", `Tempo 3-1-1-0. Feet hip-width, brace core as if about to be punched, press directly overhead without lumbar hyperextension. 3s eccentric, 1s pause at shoulders. ${loadNote} ${RIR_NOTE}`, sets, P1_PRIMARY_REPS[mw], 90, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "Standing press is a full-body lift. If ribs flare or lower back arches, the weight is too heavy. Think 'push yourself away from the dumbbells' — feet driving into floor.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Lat Pulldown (wide grip)", `Tempo 3-0-1-1. Pull to upper chest, squeeze lats, control stretch on return. Slight lean back, don't yank. ${loadNote}`, sets, P1_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Dumbbell Arnold Press", "Tempo 2-0-1-1. Start palms facing you, rotate as you press up. Hits all three delt heads.", sets, P1_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Single-Arm Dumbbell Row", "Tempo 2-0-1-1. Hand and knee on bench, pull DB to hip, squeeze lat at top. Full stretch at bottom.", sets, `${P1_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("hb")),
    e("D3. Cable Lateral Raise", "Tempo 2-0-1-1. Cross-body cable, raise to shoulder height leading with elbow. Constant tension.", 3, "12-15", 45, rir, "exercise", g("lat")),
    // Core
    e("E1. Dead Bug", "Lower back pressed into floor. Opposite arm/leg extension.", 3, "8 each side", 0, null, "exercise", g("core"), "Core Circuit"),
    e("E2. Glute Bridge Hold", "Hips up, squeeze glutes, hold. If hips drop, set is over.", 3, "30s", 60, null, "exercise", g("core"), "Core Circuit"),
    // Injury Resilience
    e("F1. Face Pull (rear delt finisher)", "Zero ego, feel rear delt and external rotators. Shoulder insurance — never skip.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST
    e("F2. Assault Bike or Rower (easy)", "8–10 min. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting and accessories.", 1, "8-10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay6(w: number, mw: number): Ex[] {
  const g = (s: string) => `${s}W${w}D6`;
  const rounds = EMOM_ROUNDS[mw];
  const duration = rounds * 4;

  return [
    e("W1. Jump Rope or Light Jog", "2–3 min easy effort. RPE 3–4.", 1, "2-3 min", 0, null, "warmup", g("wu")),
    e("W2. Bodyweight Squat", "Full depth, controlled pace.", 1, "10", 0, null, "warmup", g("wu")),
    e("W3. Band Pull-Apart", "Shoulder activation.", 1, "15", 0, null, "warmup", g("wu")),
    e("W4. Inchworm", "Walk hands out to plank, walk feet to hands.", 1, "5", 30, null, "warmup", g("wu")),
    e(`A. EMOM ${duration} (${rounds} rounds × 4 minutes)`, `HR target: 145–165 BPM (RPE 6–7). Perform prescribed work at top of each minute, rest remainder. If you can't complete work within the minute, reduce reps by 1–2.\n\nMinute 1 (Engine): Assault Bike 12 cal\nMinute 2 (Strength): Kettlebell Swing × 10\nMinute 3 (Engine): Row 12 cal\nMinute 4 (Gymnastics): Box Step-Up × 8 total (alternating)`, rounds, "4-min rounds", null, null, "conditioning", g("emom")),
    e("B. Cooldown Walk", "5 min easy pace. HR below 130 BPM. Nasal breathing.", 1, "5 min", null, null, "conditioning", g("cd")),
  ];
}

function buildDay7(w: number): Ex[] {
  return [
    e("Rest Day", "Complete rest. No training. Prioritize sleep (7–9 hrs), hydration (½ bodyweight in oz), and family time.", null, null, null, null, "rest", `restW${w}D7`),
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results: string[] = [];

    // Weeks 2, 3, 4 (meso weeks 1, 2, 3 — 0-indexed)
    for (let week = 2; week <= 4; week++) {
      const mw = week - 1; // 0-indexed meso week (1, 2, 3)
      const days = [
        { dn: (week - 1) * 7 + 1, exercises: buildDay1(week, mw), label: "Day 1 — Lower Body: Squat Emphasis" },
        { dn: (week - 1) * 7 + 2, exercises: buildDay2(week, mw), label: "Day 2 — Upper Body: Horizontal Push Emphasis" },
        { dn: (week - 1) * 7 + 3, exercises: buildDay3(week), label: "Day 3 — Zone 2 / Active Recovery" },
        { dn: (week - 1) * 7 + 4, exercises: buildDay4(week, mw), label: "Day 4 — Lower Body: Hinge Emphasis" },
        { dn: (week - 1) * 7 + 5, exercises: buildDay5(week, mw), label: "Day 5 — Upper Body: Vertical Push Emphasis" },
        { dn: (week - 1) * 7 + 6, exercises: buildDay6(week, mw), label: "Day 6 — Saturday Athletic Conditioning" },
        { dn: (week - 1) * 7 + 7, exercises: buildDay7(week), label: "Day 7 — Rest" },
      ];

      for (const d of days) {
        const { error } = await supabase
          .from("program_days")
          .update({ exercises: d.exercises, label: d.label })
          .eq("program_id", PROGRAM_ID)
          .eq("day_number", d.dn);

        results.push(error ? `W${week}D${d.dn}: FAILED — ${error.message}` : `W${week} Day ${d.dn}: ✓ (${d.exercises.length} items)`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, phase: 1, weeks: "2-4", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[REWRITE-P1]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
