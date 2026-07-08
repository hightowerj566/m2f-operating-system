import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "3da785bc-a03d-4fe9-ae7f-dfed52fb8124";
const RIR_NOTE = "(RIR = Reps In Reserve: RIR 3 means 3 reps left before failure)";
const LOAD_DP = "Double progression: when you complete the top of the rep range at RIR 2+, add load next session and return to the bottom of the rep range.";
const LOAD_DELOAD = "Deload week — use Week 5 loads. Focus on movement quality, not intensity.";

// Phase 2 progression (0=W5, 1=W6, 2=W7, 3=W8 deload)
const P2_PRIMARY_REPS = ["6-8", "6-8", "6-8", "6"];
const P2_SECONDARY_REPS = ["8-10", "8-10", "8-10", "8"];
const P2_ACCESSORY_REPS = ["10-12", "10-12", "10-12", "8"];
const P2_RIR = ["3", "3", "2", "4"];
const P2_SETS = [3, 3, 3, 2];
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
    e("W1. Foam Roller Thoracic Extension", "Lie face-up, foam roller across mid-back. Gently extend, hold 2s.", 1, "45s", 0, null, "warmup", g),
    e("W2. Cat-Cow", "Inhale arch, exhale round. Full spinal range.", 1, "10", 0, null, "warmup", g),
    e("W3. Kneeling Hip Flexor Stretch", "Half-kneeling, posterior pelvic tilt, lean forward. Hold.", 1, "60s each side", 0, null, "warmup", g),
    e("W4. Hip 90/90 Stretch", "Both legs 90°, rotate torso over front shin.", 1, "60s each side", 30, null, "warmup", g),
  ];
}

function squat1Activation(w: number): Ex[] {
  const g = `wuW${w}D1`;
  return [
    e("W5. Banded Ankle Dorsiflexion", "Knee-to-wall drill with band pulling tibia forward. Improves squat depth.", 2, "10 each side", 30, null, "warmup", g),
    e("W6. Glute Bridge (bodyweight)", "Squeeze glutes at top, hold 2s. Hip extension focus.", 2, "12", 45, null, "warmup", g),
    e("W7. Bodyweight Squat with Pause", "Full depth, 2s pause, maintain tension.", 2, "8", 45, null, "warmup", g),
    e("W8. Band Pull-Apart", "Shoulder health on non-upper days.", 2, "15", 30, null, "warmup", g),
  ];
}

function hingeActivation(w: number): Ex[] {
  const g = `wuW${w}D4`;
  return [
    e("W5. Banded Good Morning", "Push hips back, feel hamstring stretch, squeeze glutes to stand.", 2, "10", 45, null, "warmup", g),
    e("W6. Single-Leg Glute Bridge", "One foot planted, drive hips up, 2s hold.", 2, "8 each side", 45, null, "warmup", g),
    e("W7. Band Pull-Apart", "Shoulder health.", 2, "15", 30, null, "warmup", g),
  ];
}

function upperWarmup(w: number, d: number): Ex[] {
  const g = `wuW${w}D${d}`;
  return [
    e("W1. Shoulder CARs", "Full pain-free range, no trunk compensation.", 2, "5 each arm", 0, null, "warmup", g),
    e("W2. Wall Slide", "Back, head, arms against wall. Slide overhead.", 2, "10", 0, null, "warmup", g),
    e("W3. Band Pull-Apart", "Squeeze shoulder blades together.", 3, "12", 30, null, "warmup", g),
    e("W4. Push-Up (slow eccentric)", "3s descent, explosive push-up.", 2, "6", 45, null, "warmup", g),
  ];
}

function p2Core(w: number, d: number): Ex[] {
  const g = `coreW${w}D${d}`;
  return [
    e("E1. Ab Wheel Rollout (kneeling)", "Brace core, roll out as far as you can control without low back sagging. Pull back using abs, not hip flexors.", 3, "8", 0, null, "exercise", g, "Core Circuit"),
    e("E2. Side Plank", "Forearm and foot, straight line head to heels. Full brace.", 3, "30s each side", 0, null, "exercise", g, "Core Circuit"),
    e("E3. Pallof Press", "Cable perpendicular, press out, resist rotation. Anti-rotation strength.", 3, "10 each side", 60, null, "exercise", g, "Core Circuit"),
  ];
}

// ── Day Builders ──

function buildDay1(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D1`;
  const rir = P2_RIR[mw]; const sets = P2_SETS[mw];
  const loadNote = dl ? LOAD_DELOAD : LOAD_DP;

  return [
    ...lowerWarmup(w, 1),
    ...squat1Activation(w),
    // Power
    e("A1. Box Jump", "Step onto box at hip height, land with soft knees. Step down — don't jump down. Reset fully. Builds lower body power.", dl ? 2 : 3, "3", 90, null, "exercise", g("pp")),
    // Primary — Barbell Back Squat
    e("B1. Barbell Back Squat", `Tempo 2-1-1-0. Bar on upper traps, brace hard, break at hips and knees simultaneously, descend 2s, 1s pause in hole, drive up. ${loadNote} ${RIR_NOTE}`, sets, P2_PRIMARY_REPS[mw], 120, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "Own the bottom position. If you can't pause for 1s at the bottom, the weight is too heavy. Elbows should drive forward out of the hole — think 'chest up, hips through.'", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Barbell Romanian Deadlift", `Tempo 3-0-1-1. Hips back, bar close to legs, hamstring stretch. Neutral spine. ${loadNote}`, sets, P2_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Bulgarian Split Squat (DB)", "Tempo 2-0-1-1. Rear foot elevated on bench. Front shin vertical. Drive through front heel.", sets, `${P2_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl", "Tempo 2-0-1-1. Squeeze hamstrings, control eccentric.", sets, P2_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM, 2s pause at top.", sets, "15", 45, rir, "exercise", g("calf")),
    // Core
    ...p2Core(w, 1),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay2(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D2`;
  const rir = P2_RIR[mw]; const sets = P2_SETS[mw];
  const loadNote = dl ? LOAD_DELOAD : LOAD_DP;

  return [
    ...upperWarmup(w, 2),
    // Power
    e("A1. Medicine Ball Rotational Throw", "Sideways to wall. Load trail hip, rotate through core, throw. Transverse plane power.", dl ? 2 : 3, "5 each side", 60, null, "exercise", g("pp")),
    // Primary — Barbell Bench
    e("B1. Barbell Bench Press", `Tempo 2-1-1-0. Retract scapulae, arch, feet planted. 2s eccentric, 1s pause at chest. ${loadNote} ${RIR_NOTE}`, sets, P2_PRIMARY_REPS[mw], 120, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "The pause at chest eliminates the stretch reflex — you must generate force from a dead stop. This builds honest strength. Keep glutes on bench, feet flat.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Seated Cable Row", `Tempo 3-0-1-1. Pull to lower abdomen, squeeze shoulder blades. 3s eccentric. ${loadNote}`, sets, P2_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Incline Dumbbell Press", "Tempo 2-0-1-1. 30° incline. Upper chest focus.", sets, P2_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Face Pull (cable)", "Tempo 2-0-1-1. Pull to face, externally rotate. Rear delt and rotator cuff.", sets, "12-15", 60, rir, "exercise", g("hb")),
    e("D3. Cable Woodchop (high-to-low)", "Tempo 2-0-1-1. Stand perpendicular to cable, rotate from high to low. 3×10 each side. Transverse plane anti-rotation training.", 3, "10 each side", 45, null, "exercise", g("wc")),
    e("D4. DB Lateral Raise", "Tempo 2-0-1-1. Slight lean, raise to shoulder height. Control descent.", 3, "12-15", 45, rir, "exercise", g("lat")),
    e("D5. Incline Dumbbell Curl", "Tempo 2-0-1-1. Incline bench at 45°. Full stretch at bottom, supinate at top. Builds long-head bicep.", 3, "10-12", 45, rir, "exercise", g("bi")),
    e("D6. Cable Pushdown (rope)", "Tempo 2-0-1-1. Elbows pinned to sides, extend fully, squeeze triceps. Control return.", 3, "12-15", 45, rir, "exercise", g("tri")),
    // Core
    ...p2Core(w, 2),
    // Injury Resilience
    e("F1. Band Pull-Apart (rear delt finisher)", "2×15. Zero ego. Shoulder insurance.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST
    e("F2. Assault Bike or Rower (easy)", "8–10 min. HR 125–145 BPM (Zone 2), RPE 4–5.", 1, "8-10 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay3(w: number): Ex[] {
  const g = (s: string) => `${s}W${w}D3`;
  return [
    e("W1. Full Body Mobility Sequence", "Hips, ankles, T-spine, shoulders. 8–10 min.", 1, "8-10 min", null, null, "warmup", g("wu")),
    e("E1. Dead Bug", "Lower back into floor. Slow, controlled. Only day this appears.", 2, "8 each side", 60, null, "exercise", g("core")),
    e("E2. Bird Dog", "Opposite arm/leg extension. Core stable, hips level.", 2, "10 each side", 60, null, "exercise", g("core")),
    e("E3. Copenhagen Plank", "Top leg on bench, bottom leg hanging. Hold position — builds adductor strength and groin resilience. Scale by bending top knee if needed.", 2, "20s each side", 60, null, "exercise", g("core")),
    e("F. Zone 2 — Incline Walk or Light Jog", "25–35 min. HR 125–145 BPM (Zone 2), RPE 4–5. Nasal breathing. Aerobic base.", 1, "25-35 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay4(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D4`;
  const rir = P2_RIR[mw]; const sets = P2_SETS[mw];
  const loadNote = dl ? LOAD_DELOAD : LOAD_DP;

  return [
    ...lowerWarmup(w, 4),
    ...hingeActivation(w),
    // Power
    e("A1. Kettlebell Swing", "Explosive hip drive. Bell floats from hip snap. Full reset between reps.", dl ? 2 : 3, "10", 60, null, "exercise", g("pp")),
    // Primary — Barbell RDL
    e("B1. Barbell Romanian Deadlift", `Tempo 2-1-1-0. Bar close to legs, hips back, deep hamstring stretch. 1s pause below knee. Neutral spine. ${loadNote} ${RIR_NOTE}`, sets, P2_PRIMARY_REPS[mw], 120, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "Barbell RDL demands more spinal stability than DB version. Engage lats by 'bending the bar around your legs.' If your back rounds, reduce load.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Front Squat", `Tempo 3-0-1-1. Clean grip or cross-arm. Elbows high, torso vertical. Builds quad strength and core anti-flexion. ${loadNote}`, sets, P2_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Bulgarian Split Squat (DB)", "Tempo 2-0-1-1. Rear foot on bench. Front shin vertical. Drive through front heel.", sets, `${P2_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("ha")),
    e("D2. Lying Leg Curl", "Tempo 2-0-1-1. Squeeze hamstrings, control eccentric.", sets, P2_ACCESSORY_REPS[mw], 60, rir, "exercise", g("hb")),
    e("D3. Standing Calf Raise", "Tempo 2-0-1-2. Full ROM, 2s pause at top.", sets, "15", 45, rir, "exercise", g("calf")),
    e("D4. Seated Calf Raise", "Tempo 2-0-2-1. Knees bent at 90°, targets soleus. 2s pause at stretch. Full ROM critical for lower leg resilience.", 3, "15-20", 45, rir, "exercise", g("scalf")),
    e("D5. Prone Hip Extension", "Lying face down on bench, hips at edge. Extend one leg at a time, squeeze glute-ham tie-in at top. 2s hold. Targets posterior chain and lumbar extensors.", 2, "15 each side", 45, null, "exercise", g("phe")),
    e("D6. Lateral Sled Drag", "Face sideways, push through outside leg. 15m each direction. If no sled, use lateral band walk × 15 steps each direction. Builds frontal plane stability.", 3, "15m each direction", 60, null, "exercise", g("lsd")),
    // Core
    ...p2Core(w, 4),
    // Conditioning LAST
    e("F. Incline Treadmill Walk", "10–15 min. HR 125–145 BPM (Zone 2), RPE 4–5. AFTER all lifting.", 1, "10-15 min", null, null, "conditioning", g("cf")),
  ];
}

function buildDay5(w: number, mw: number): Ex[] {
  const dl = mw === 3;
  const g = (s: string) => `${s}W${w}D5`;
  const rir = P2_RIR[mw]; const sets = P2_SETS[mw];
  const loadNote = dl ? LOAD_DELOAD : LOAD_DP;

  const warmup: Ex[] = [
    e("W1. Shoulder CARs", "Full range, no compensation.", 2, "5 each arm", 0, null, "warmup", `wuW${w}D5`),
    e("W2. Wall Slide", "Maintain wall contact throughout.", 2, "10", 0, null, "warmup", `wuW${w}D5`),
    e("W3. Band Pull-Apart", "Squeeze shoulder blades.", 2, "15", 30, null, "warmup", `wuW${w}D5`),
    e("W4. Band Shoulder Dislocate", "Wide grip, smooth arc. Pain-free range only.", 2, "8", 30, null, "warmup", `wuW${w}D5`),
  ];

  return [
    ...warmup,
    // Power
    e("A1. Medicine Ball Slam", "Full-body force. Reset between reps.", dl ? 2 : 3, "5", 60, null, "exercise", g("pp")),
    // Primary — Barbell OHP
    e("B1. Barbell Overhead Press", `Tempo 2-1-1-0. Feet hip-width, brace hard, press from front rack to full lockout. No leg drive — strict press. 2s eccentric, 1s pause at shoulders. ${loadNote} ${RIR_NOTE}`, sets, P2_PRIMARY_REPS[mw], 120, rir, "exercise", g("ps")),
    e("B1 — Coaching Note", "The barbell OHP is the ultimate test of overhead pressing strength. Head moves back slightly to let bar pass, then pushes through once bar clears. If you lean back, the weight is too heavy.", null, null, null, null, "note", g("ps")),
    // Secondary
    e("C1. Lat Pulldown (wide grip)", `Tempo 3-0-1-1. Pull to upper chest, squeeze lats, control return. ${loadNote}`, sets, P2_SECONDARY_REPS[mw], 90, rir, "exercise", g("sc")),
    // Accessories
    e("D1. Dumbbell Overhead Press", "Tempo 2-0-1-1. Standing. Complements barbell pressing with independent arm work.", sets, P2_ACCESSORY_REPS[mw], 60, rir, "exercise", g("ha")),
    e("D2. Single-Arm Dumbbell Row", "Tempo 2-0-1-1. Pull to hip, squeeze lat, full stretch.", sets, `${P2_ACCESSORY_REPS[mw]} each side`, 60, rir, "exercise", g("hb")),
    e("D3. Cable Lateral Raise", "Tempo 2-0-1-1. Cross-body cable. Constant tension.", 3, "12-15", 45, rir, "exercise", g("lat")),
    e("D4. Cable Pushdown (rope)", "Tempo 2-0-1-1. Elbows pinned, full extension, squeeze triceps.", 3, "12-15", 45, rir, "exercise", g("tri")),
    // Core
    ...p2Core(w, 5),
    // Injury Resilience
    e("F1. Face Pull (rear delt finisher)", "2×15. Shoulder insurance.", 2, "15", 30, null, "exercise", g("fin")),
    // Conditioning LAST — structured aerobic intervals
    e("F2. Structured Aerobic Intervals", "6 rounds: 30s hard effort on assault bike (RPE 8–9, HR 160–175 BPM) / 90s easy (RPE 3, HR below 130 BPM). Do not begin until all lifting and accessories are complete.", 6, "30s hard / 90s easy", null, null, "conditioning", g("cf")),
  ];
}

function buildDay6(w: number, mw: number): Ex[] {
  const g = (s: string) => `${s}W${w}D6`;
  const rounds = EMOM_ROUNDS[mw];
  const duration = rounds * 4;

  return [
    e("W1. Jump Rope or Light Jog", "2–3 min easy. RPE 3–4.", 1, "2-3 min", 0, null, "warmup", g("wu")),
    e("W2. Bodyweight Squat", "Full depth, controlled.", 1, "10", 0, null, "warmup", g("wu")),
    e("W3. Band Pull-Apart", "Shoulder activation.", 1, "15", 0, null, "warmup", g("wu")),
    e("W4. Inchworm", "Hands to plank, feet to hands.", 1, "5", 30, null, "warmup", g("wu")),
    e(`A. EMOM ${duration} (${rounds} rounds × 4 minutes)`, `HR target: 145–165 BPM (RPE 6–7). Perform work at top of each minute, rest remainder.\n\nMinute 1 (Engine): Assault Bike 15 cal\nMinute 2 (Strength): DB Thruster × 8\nMinute 3 (Engine): Row 15 cal\nMinute 4 (Gymnastics): Ring Row × 8 (or Band-Assisted Pull-Up × 5)`, rounds, "4-min rounds", null, null, "conditioning", g("emom")),
    e("B. Cooldown Walk", "5 min easy. HR below 130 BPM.", 1, "5 min", null, null, "conditioning", g("cd")),
  ];
}

function buildDay7(w: number): Ex[] {
  return [e("Rest Day", "Complete rest. Sleep, hydration, family time.", null, null, null, null, "rest", `restW${w}D7`)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results: string[] = [];

    for (let week = 5; week <= 8; week++) {
      const mw = (week - 5); // 0=W5, 1=W6, 2=W7, 3=W8
      const days = [
        { dn: (week-1)*7+1, ex: buildDay1(week, mw), label: "Day 1 — Lower Body: Squat Emphasis" },
        { dn: (week-1)*7+2, ex: buildDay2(week, mw), label: "Day 2 — Upper Body: Horizontal Push Emphasis" },
        { dn: (week-1)*7+3, ex: buildDay3(week), label: "Day 3 — Zone 2 / Active Recovery" },
        { dn: (week-1)*7+4, ex: buildDay4(week, mw), label: "Day 4 — Lower Body: Hinge Emphasis" },
        { dn: (week-1)*7+5, ex: buildDay5(week, mw), label: "Day 5 — Upper Body: Vertical Push Emphasis" },
        { dn: (week-1)*7+6, ex: buildDay6(week, mw), label: "Day 6 — Saturday Athletic Conditioning" },
        { dn: (week-1)*7+7, ex: buildDay7(week), label: "Day 7 — Rest" },
      ];
      for (const d of days) {
        const { error } = await supabase
          .from("program_days")
          .update({ exercises: d.ex, label: d.label })
          .eq("program_id", PROGRAM_ID)
          .eq("day_number", d.dn);
        results.push(error ? `W${week}D${d.dn}: FAIL — ${error.message}` : `W${week} Day ${d.dn}: ✓ (${d.ex.length})`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, phase: 2, weeks: "5-8", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[REWRITE-P2]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
