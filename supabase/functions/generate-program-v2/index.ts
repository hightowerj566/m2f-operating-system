import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// ─── PHASE / ROTATION HELPERS ───

function getPhase(week: number): number {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  if (week <= 12) return 3;
  return 0;
}

function getPhaseName(phase: number): string {
  return ({ 1: "HYPERTROPHY", 2: "STRENGTH", 3: "PEAK", 0: "DELOAD" } as Record<number, string>)[phase] || "DELOAD";
}

function getRotation(week: number): string {
  if (week <= 4) return "A";
  if (week <= 8) return "B";
  return "C";
}

function getWeekInPhase(week: number): number {
  if (week <= 4) return week;
  if (week <= 8) return week - 4;
  if (week <= 12) return week - 8;
  return 1;
}

// ─── PERFORM 2.1 PROMPT BUILDER ───

function buildPerformPrompt(week: number): string {
  const phase = getPhase(week);
  const phaseName = getPhaseName(phase);
  const rotation = getRotation(week);
  const weekInPhase = getWeekInPhase(week);
  const isDeload = week === 13;
  const mesocycle = week <= 4 ? 1 : week <= 8 ? 2 : week <= 12 ? 3 : 0;

  // ─── MESOCYCLE-LOCKED PRIMARY LIFTS ───
  const primaryLifts = {
    A: { d1: "Front Squat", d2: "Barbell Bench Press", d4: "Conventional Deadlift", d5: "Seated DB Shoulder Press" },
    B: { d1: "Back Squat", d2: "Incline Barbell Bench Press", d4: "Trap Bar Deadlift", d5: "Standing Barbell OHP" },
    C: { d1: "Safety Bar Squat", d2: "Close-Grip Bench Press", d4: "Sumo Deadlift", d5: "Push Press" },
  };
  const lifts = primaryLifts[rotation as keyof typeof primaryLifts];

  // ─── MESOCYCLE-LOCKED SECONDARY LIFTS ───
  // D4: NO redundant hinge — secondary is a different pattern (hip thrust / good morning)
  const secondaryLifts = {
    A: { d1: "Leg Press", d2: "Incline DB Press", d4: "Barbell Hip Thrust", d5: "Arnold Press" },
    B: { d1: "Hack Squat", d2: "Flat DB Press", d4: "Good Morning", d5: "Landmine Press" },
    C: { d1: "Belt Squat", d2: "Cable Fly (incline)", d4: "Barbell Hip Thrust", d5: "Z-Press" },
  };
  const secondary = secondaryLifts[rotation as keyof typeof secondaryLifts];

  // ─── MESOCYCLE-LOCKED ACCESSORIES ───
  // D1: Added Leg Extension for quad volume + calf on every lower day
  // D2: Added Cable Fly for chest volume + Face Pull for pull:press ratio
  // D4: Fixed redundancy — replaced duplicate hinge with calf raise, kept unilateral
  // D5: Added Band Pull-Apart for pull:press ratio
  const accessoryMap = {
    A: {
      d1: ["Walking Lunge (DB)", "Leg Extension (Machine)", "Leg Curl (Machine)", "Standing Calf Raise"],
      d2: ["Cable Fly (low-to-high)", "Lat Pulldown (wide grip)", "Cable Row (neutral grip)", "Face Pull (rope)", "DB Lateral Raise"],
      d4: ["Single-Leg RDL (KB)", "Leg Curl (Nordic or Machine)", "Standing Calf Raise"],
      d5: ["Chest-Supported DB Row", "Face Pull (cable)", "Band Pull-Apart", "EZ-Bar Curl", "Tricep Pushdown (rope)"],
    },
    B: {
      d1: ["Bulgarian Split Squat (DB)", "Leg Extension (Machine)", "Seated Leg Curl", "Seated Calf Raise"],
      d2: ["Pec Deck Fly", "Chin-Up or Assisted Chin-Up", "Meadows Row", "Reverse Fly (DB)", "Cable Lateral Raise"],
      d4: ["Single-Leg Hip Thrust", "Lying Leg Curl", "Seated Calf Raise"],
      d5: ["Seal Row or Chest-Supported Row", "Reverse Fly (DB)", "Band Pull-Apart", "Hammer Curl (DB)", "Overhead Tricep Extension (Cable)"],
    },
    C: {
      d1: ["Step-Up (DB)", "Leg Extension (Machine)", "Leg Curl (Banded Nordic)", "Donkey Calf Raise"],
      d2: ["Incline Cable Fly", "Pull-Up or Lat Pulldown (neutral)", "One-Arm DB Row", "Rear Delt Cable Fly", "Cable Lateral Raise"],
      d4: ["Walking Lunge (DB)", "Hamstring Curl (Swiss Ball)", "Donkey Calf Raise"],
      d5: ["Pendlay Row", "Band Pull-Apart (face level)", "DB Lateral Raise", "Incline DB Curl", "Skull Crusher"],
    },
  };
  const accessories = accessoryMap[rotation as keyof typeof accessoryMap];

  // ─── MESOCYCLE-LOCKED WARMUPS ───
  const warmups = {
    d1: ["Hip 90/90 Mobility (2 min)", "Goblet Squat tempo — 2×8, 3s eccentric", "Banded Clamshell — 2×15 each"],
    d2: ["Band Pull-Apart — 3×15", "Half-Kneeling Landmine Press — 2×10 each", "Scapular Wall Slide — 2×10"],
    d3: ["Soft tissue work (foam roll) — 5 min", "Dynamic hip mobility circuit — 5 min"],
    d4: ["Hip Hinge Wall Drill — 2×10", "Romanian Deadlift (empty bar) — 2×10", "Glute Bridge — 2×15"],
    d5: ["Band Pull-Apart — 3×15", "Shoulder CARs — 2×5 each", "Prone Y-T-W — 2×8 each"],
  };

  // ─── MESOCYCLE-LOCKED CORE (reduced to 2 sets each for 8-12 weekly target) ───
  const coreMap = {
    d1: ["Dead Bug — 2×10 each", "Pallof Press — 2×12 each"],
    d2: ["Plank — 2×30-45s hold"],
    d3: ["90/90 Hip Lift (breathing) — 2×5 breaths each", "Bird Dog — 2×10 each"],
    d4: ["Copenhagen Plank — 2×20-30s each", "Suitcase Carry — 2×30m each side"],
    d5: ["Ab Wheel Rollout — 2×10"],
  };

  // ─── MESOCYCLE-LOCKED EXPLOSIVE PRIMERS ───
  const primers = {
    d1: "Box Jump — 3×4",
    d2: "Medicine Ball Chest Pass (wall) — 3×5",
    d4: "Broad Jump — 3×4",
    d5: "Medicine Ball Overhead Slam — 3×5",
  };

  // ─── MESOCYCLE-LOCKED CONDITIONING ───
  const conditioningMap = {
    d1: `EMOM × 10 min — Odd: Kettlebell Swing ×15. Even: Assault Bike 12 cal.`,
    d2: `AMRAP × 8 min — Push-Up ×10, DB Row ×10 each, Burpee ×5`,
    d4: `3 Rounds (rest 90s) — Sled Push 20m, Kettlebell Deadlift ×10, Box Step-Up ×10 each`,
    d5: `EMOM × 8 min — Odd: KB Push Press ×10. Even: Rower Sprint 10 cal.`,
  };

  // ─── RIR BY PHASE ───
  let rirPrimary: string, rirSecondary: string, rirAccessory: string;
  if (isDeload) {
    rirPrimary = "5"; rirSecondary = "5"; rirAccessory = "5";
  } else if (phase === 1) {
    rirPrimary = "2"; rirSecondary = "3"; rirAccessory = "2";
  } else if (phase === 2) {
    const pMap: Record<number, string> = { 1: "3", 2: "2", 3: "1", 4: "0-1" };
    rirPrimary = pMap[weekInPhase];
    rirSecondary = String(Math.min(Number(pMap[weekInPhase].split("-")[0]) + 1, 3));
    rirAccessory = "2";
  } else {
    const pMap: Record<number, string> = { 1: "2", 2: "1", 3: "0", 4: "0" };
    rirPrimary = pMap[weekInPhase];
    rirSecondary = String(Math.min(Number(pMap[weekInPhase]) + 1, 2));
    rirAccessory = "1-2";
  }

  // ─── REP PROGRESSIONS BY PHASE ───
  const primaryReps = isDeload ? "6" : phase === 1
    ? String(5 + weekInPhase)
    : phase === 2
      ? String(Math.max(6 - weekInPhase, 3))
      : String(Math.max(4 - weekInPhase, 1));

  const secondaryReps = isDeload ? "8" : phase === 1
    ? String(7 + weekInPhase)
    : phase === 2
      ? String(Math.max(8 - weekInPhase, 5))
      : String(Math.max(6 - weekInPhase, 3));

  const accessoryReps = isDeload ? "10" : phase === 1
    ? String(11 + weekInPhase)
    : phase === 2
      ? String(Math.max(12 - weekInPhase, 8))
      : String(Math.max(12 - weekInPhase, 8));

  // ─── INTENSITY TECHNIQUE RULES ───
  let intensityRules: string;
  if (isDeload) {
    intensityRules = `DELOAD: NO intensity techniques. Straight sets only. RPE 5-6.`;
  } else if (phase === 1) {
    const allowed: string[] = [];
    if (weekInPhase >= 2) allowed.push("Drop sets on accessories ONLY (max 1 per session, final set only)");
    if (weekInPhase >= 3) allowed.push("Myo-reps on accessories ONLY (max 1 per session, final set only)");
    intensityRules = `HYPERTROPHY PHASE — Week ${weekInPhase}/4:
TEMPO: Required on ALL accessories — 3-1-1 for presses, 3-1-2 for curls/hams. Controlled eccentrics (3s) on primaries.
${allowed.length > 0 ? `ALLOWED this week:\n  - ${allowed.join("\n  - ")}` : "NO drop sets or myo-reps yet — straight sets + tempos only."}
PROHIBITED: Cluster sets, rest-pause, mechanical drop sets, 1.5 rep method.`;
  } else if (phase === 2) {
    intensityRules = `STRENGTH PHASE — Week ${weekInPhase}/4:
REQUIRED:
  - Cluster sets on primary lifts: 2 reps / 15s rest / 2 reps / 15s rest / 2 reps
  - Paused reps (2s) on squat and bench primaries
  - Tempo 2-1-1 on accessories
${weekInPhase >= 3 ? "ALLOWED:\n  - Rest-pause on final set of secondary compounds\n  - Mechanical drop sets on accessory supersets" : ""}
PROHIBITED: Drop sets, myo-reps, 1.5 rep method.`;
  } else {
    intensityRules = `PEAK PHASE — Week ${weekInPhase}/4:
ALL TECHNIQUES UNLOCKED:
  - Myo-reps on final accessory set (12-15 activation + 3-5 mini-sets of 3-5 reps, 12s rest)
  - Drop sets on final accessory superset (reduce 25%, rep to near failure)
  - Mechanical drop sets (e.g., close grip → medium → wide)
  - 1.5 rep method on secondary compounds (full + half = 1)
  - Cluster sets on primaries: singles/doubles with 15-20s intra-set rest
PROHIBITED: Tempo prescriptions (speed prioritized for power output).`;
  }

  // ─── DAY 6 SESSION IDENTITY ───
  const sessionIdentities = ["Kettlebell", "Dumbbell", "Barbell", "Sled + Carry", "Med Ball + Jumping"];
  const day6Identity = isDeload ? "Bodyweight Recovery" : sessionIdentities[(week - 1) % sessionIdentities.length];
  const day6Duration = isDeload ? "20 min" : phase === 1 ? "30 min" : phase === 2 ? "35 min" : "40 min";
  const day6Rounds = phase === 1 ? "7-8" : phase === 2 ? "8-9" : "9-10";

  // ─── OLYMPIC LIFT PERCENTAGES ───
  const olyPercentages = {
    1: { clean: "60-65%", snatch: "55-60%", pushPress: "65-70%" },
    2: { clean: "65-72%", snatch: "60-67%", pushPress: "70-75%" },
    3: { clean: "72-80%", snatch: "67-75%", pushPress: "75-82%" },
  }[phase] || { clean: "55-60%", snatch: "50-55%", pushPress: "60-65%" };

  const condTime = "8-12 min";
  const zone2Time = "25-30 min";

  return `You are an elite S&C coach building Week ${week} of a 13-week M2F PERFORM 2.1 program.

═══ CONTEXT ═══
Week ${week}/13 | Phase: ${phaseName} (week ${weekInPhase}/4) | Rotation: ${rotation} | Mesocycle: ${mesocycle}
${isDeload ? "⚠️ DELOAD WEEK — reduce volume 40%, no intensity techniques, RPE 5-6.\n" : ""}

═══ CRITICAL: MESOCYCLE CONSISTENCY ═══
ALL exercises are LOCKED for the entire 4-week mesocycle. The ONLY things that change week-to-week are:
  1. Reps (progressive overload)
  2. Intensity techniques (unlocked progressively)
Warmups, primers, secondaries, accessories, core, and conditioning stay IDENTICAL across all 4 weeks.

═══ REDUNDANCY RULES ═══
NEVER program two exercises from the same movement pattern in the same session. Examples of violations:
  - Conventional Deadlift + Romanian Deadlift (both bilateral hinges)
  - Seated DB Press + Arnold Press (both DB overhead presses) — Arnold is allowed as secondary since rotation adds anterior delt emphasis
  - Frog Pump + Single-Leg Glute Bridge (both glute bridge variations)
  - Barbell Row + DB Row (both horizontal pulls) — ALLOWED because different grip/unilateral stimulus
The PRIMARY + SECONDARY must be DIFFERENT movement patterns (e.g., Deadlift + Hip Thrust, NOT Deadlift + RDL).

═══ EXACT EXERCISES FOR THIS MESOCYCLE (DO NOT CHANGE) ═══

DAY 1 — LOWER BODY: SQUAT EMPHASIS
  Warmup: ${warmups.d1.join(" | ")}
  Explosive Primer: ${primers.d1} — no RIR
  Primary: ${lifts.d1} — 4×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d1} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d1.length} exercises, 3 sets × ${accessoryReps} reps, RIR ${rirAccessory}):
${accessories.d1.map(a => `    - ${a}`).join("\n")}
  Core: ${coreMap.d1.join(" | ")}
  Conditioning: ${conditioningMap.d1}

DAY 2 — UPPER BODY: HORIZONTAL PUSH (Horizontal Push / Vertical Pull)
  Warmup: ${warmups.d2.join(" | ")}
  Explosive Primer: ${primers.d2} — no RIR
  Primary: ${lifts.d2} — 4×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d2} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d2.length} exercises, 3 sets × ${accessoryReps} reps, RIR ${rirAccessory}):
${accessories.d2.map(a => `    - ${a}`).join("\n")}
  Core: ${coreMap.d2.join(" | ")}
  Conditioning: ${conditioningMap.d2}

DAY 3 — ZONE 2 / ACTIVE RECOVERY
  Warmup: ${warmups.d3.join(" | ")}
  NO explosive movement, NO strength, NO accessories
  Core: ${coreMap.d3.join(" | ")}
  Zone 2 Cardio: ${zone2Time} — Incline Treadmill Walk, Assault Bike, or Rower
    Target HR: 130-150 BPM. Nasal breathing. RPE 4-5.
    Format: "Incline Treadmill Walk — ${zone2Time} at 3.5 mph, 8% incline. Target HR 130-150 bpm."

DAY 4 — LOWER BODY: HINGE EMPHASIS (Hip Hinge / Posterior Chain)
  Warmup: ${warmups.d4.join(" | ")}
  Explosive Primer: ${primers.d4} — no RIR
  Primary: ${lifts.d4} — 4×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d4} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d4.length} exercises, 3 sets × ${accessoryReps} reps, RIR ${rirAccessory}):
${accessories.d4.map(a => `    - ${a}`).join("\n")}
  Core: ${coreMap.d4.join(" | ")}
  Conditioning: ${conditioningMap.d4}

DAY 5 — UPPER BODY: VERTICAL PUSH (Vertical Push / Horizontal Pull)
  Warmup: ${warmups.d5.join(" | ")}
  Explosive Primer: ${primers.d5} — no RIR
  Primary: ${lifts.d5} — 4×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d5} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d5.length} exercises, 3 sets × ${accessoryReps} reps, RIR ${rirAccessory}):
${accessories.d5.map(a => `    - ${a}`).join("\n")}
  Core: ${coreMap.d5.join(" | ")}
  Conditioning: ${conditioningMap.d5}

DAY 6 — ATHLETIC CONDITIONING (Session Identity: ${day6Identity})
  ALL movements use "${day6Identity}" implement or bodyweight.
  Duration: ${day6Duration}

  1. POWER PRIMER (5×3-5): Explosive movement using session implement.
     ${phase <= 3 ? `If barbell: Olympic lifts — Clean ${olyPercentages.clean}, Snatch ${olyPercentages.snatch}, Push Press ${olyPercentages.pushPress}` : ""}

  2. ATHLETIC EMOM (${day6Duration}) — 4-minute repeating cycle, ${day6Rounds} rounds:
     Minute 1 (POWER): Explosive movement with session implement
     Minute 2 (CARDIO): SAME modality every round (pick ONE: 200m Run, 30s Jump Rope, 4× Shuttle Sprint)
     Minute 3 (ATHLETIC): Agility/lateral movement
     Minute 4 (CORE): Stability exercise
     Rules: Cardio in Minute 2 IDENTICAL every round. Each minute ≤40-45s for transition.

  3. LOADED CARRY FINISHER: 3 × 40m

  Format EMOM as single entry: sets=1, reps=null.
  Detail: "EMOM ${day6Duration} — 4-min cycle, X rounds:\\nMinute 1: [movement] × [reps]\\nMinute 2: [cardio] × [distance/time]\\nMinute 3: [movement] × [reps]\\nMinute 4: [movement] × [reps/time]"

═══ INTENSITY TECHNIQUES ═══
${intensityRules}

Technique keywords for "detail" field:
  Tempo → "Tempo 3-1-1" | Drop Set → "Drop set: reduce 25%, rep to failure"
  Myo-Reps → "Myo-reps: 15 activation + 4×5 with 12s rest"
  Cluster → "Cluster: 2/15s/2/15s/2" | Pause → "2s pause at bottom"
  Rest-Pause → "Rest-pause: failure → 15s → failure"
  Mechanical Drop Set → "Mechanical drop set: incline → flat → decline"
  1.5 Reps → "1.5 rep method: full + half = 1 rep"

═══ VOLUME TARGETS (weekly effective sets) ═══
Back: 16-20 | Chest: 10-14 | Shoulders: 10-14 | Quads: 12-16
Hamstrings: 10-14 | Glutes: 12-18 | Biceps: 8-12 | Triceps: 8-12
Calves: 6-10 | Core: 8-12
Counting: Primary mover = 1.0 | Major secondary = 0.5 | Stabilizers/primers/conditioning = 0

CRITICAL RULES:
1. Pull:Press ratio ≥ 1.35:1 — Count all pulling exercises (rows, pulldowns, face pulls, band pull-aparts) vs pressing compounds (bench, incline, OHP, Arnold). Chest isolations (cable fly) do NOT count toward pressing for ratio.
2. Every lower day needs ≥1 unilateral movement
3. Accessories = 3 sets max. Only primaries get 4 sets.
4. Max 10 working exercises per session (excluding warmup, conditioning, mindset, mission)
5. NO redundant movement patterns in the same session (see redundancy rules above)

═══ JOINT LONGEVITY ═══
- Rear delt work 2x/week (face pulls, reverse flyes)
- Rotator cuff 2x/week (band pull-aparts, Y-raises, external rotations)
- Lateral delts 2-3x/week
- Neutral grip on accessory pressing where possible

═══ OLYMPIC LIFTS ═══
Phase ${phase}: Clean ${olyPercentages.clean} | Snatch ${olyPercentages.snatch} | Push Press ${olyPercentages.pushPress}
Olympic lifts on Day 4 explosive primer and Day 6 ONLY.
Include "percentage" (decimal) and "percentageBase" fields.

═══ OUTPUT FORMAT — RETURN ONLY VALID JSON ═══
No markdown. No code blocks. Return a JSON array of 6 day objects:
[
  {
    "day_of_week": 1,
    "label": "Day 1 — Lower Body: Squat Emphasis",
    "exercises": [
      {
        "name": "A1. Exercise Name",
        "detail": "Coaching cue with technique keywords.",
        "sets": 3,
        "reps": "8",
        "rest": 90,
        "rir": "2",
        "group": "groupId",
        "type": "exercise",
        "superset_label": "Block Label"
      }
    ]
  }
]

GROUP NAMING: "{block}{week}{day}" — wu=warmup, pp=primer, ps=primary, sc=secondary, ha=hypertrophy-A, hb=hypertrophy-B, core=core, cf=conditioning.
PREFIX: W1/W2/W3=warmup, A1/A2=primers, B1=primary, C1/C2=secondary, D1/D2/D3/D4/D5=accessories, E1/E2=core, F=conditioning.
Warmup exercises: type="warmup". Conditioning/Zone2: sets=1, reps=null.
Olympic primers: include "percentage" and "percentageBase" fields.

SPECIAL ITEMS (always last two):
- Mindset Moment: type="mindset", name="Mindset Moment". 3-5 sentences connecting session to fatherhood.
- Dad Mission: type="mission", name="Dad Mission". Specific action under 10 min.

═══ PRE-OUTPUT CHECKLIST ═══
 1. ALL exercises match the exact mesocycle-locked list above
 2. Reps: primary=${primaryReps}, secondary=${secondaryReps}, accessories=${accessoryReps}
 3. RIR: primary=${rirPrimary}, secondary=${rirSecondary}, accessories=${rirAccessory}
 4. Pull:Press ratio ≥ 1.35:1 (exclude chest isolations from press count)
 5. Every lower day has unilateral work
 6. Rear delts + rotator cuff hit 2x/week
 7. Day 2=HORIZONTAL push/pull, Day 5=VERTICAL push/pull
 8. Intensity techniques match phase/week rules
 9. Day 6 follows "${day6Identity}" Session Identity with EMOM
10. Warmups on every day
11. NO redundant movement patterns in any session
12. Calves appear on BOTH lower days (D1 and D4)
Fix any violations before returning.`;
}

// ─── REBUILD 2.1 PROMPT BUILDER ───

function buildRebuildPrompt(week: number): string {
  const phase = getPhase(week);
  const phaseName = phase === 1 ? "BASE CONDITIONING" : phase === 2 ? "STRENGTH FOUNDATION" : phase === 3 ? "PEAK" : "DELOAD";
  const rotation = getRotation(week);
  const weekInPhase = getWeekInPhase(week);
  const isDeload = week === 13;
  const mesocycle = week <= 4 ? 1 : week <= 8 ? 2 : week <= 12 ? 3 : 0;

  // ─── MESOCYCLE-LOCKED PRIMARY LIFTS ───
  const primaryLifts = {
    A: { d1: "Goblet Squat", d2: "Dumbbell Bench Press", d4: "Trap Bar Deadlift", d5: "Dumbbell Overhead Press (seated)" },
    B: { d1: "Front Squat (barbell)", d2: "Barbell Bench Press", d4: "Trap Bar Deadlift", d5: "Dumbbell Overhead Press (standing)" },
    C: { d1: "Heel-Elevated Squat", d2: "Cable Chest Press", d4: "DB Hip Thrust", d5: "Landmine Press" },
  };
  const lifts = primaryLifts[rotation as keyof typeof primaryLifts];

  // ─── MESOCYCLE-LOCKED SECONDARY LIFTS ───
  // Fixed: D4 secondary is NO LONGER another deadlift/RDL — uses different pattern
  // D2 secondary is a PULL (not another press) for pull:press ratio
  const secondaryLifts = {
    A: { d1: "Leg Press (Machine)", d2: "Seated Cable Row", d4: "Glute Bridge (barbell or bodyweight)", d5: "Lat Pulldown (neutral grip)" },
    B: { d1: "Leg Press (Machine)", d2: "Chest-Supported DB Row", d4: "Barbell Hip Thrust", d5: "Lat Pulldown (neutral grip)" },
    C: { d1: "Single-Leg Leg Press", d2: "Chest-Supported Row", d4: "Barbell RDL", d5: "Cable Pulldown (wide)" },
  };
  const secondary = secondaryLifts[rotation as keyof typeof secondaryLifts];

  // ─── MESOCYCLE-LOCKED ACCESSORIES ───
  // Added: Chest isolation, extra pull, calf on both lower days, arm work
  const accessoryMap = {
    A: {
      d1: ["Step-Up (bodyweight or light dumbbell)", "Lying Leg Curl (machine)", "Standing Calf Raise"],
      d2: ["Incline Dumbbell Press", "Face Pull (cable)", "DB Lateral Raise"],
      d4: ["Single-Leg RDL (dumbbell)", "Lying Leg Curl (machine)", "Standing Calf Raise"],
      d5: ["Dumbbell Lateral Raise", "Cable Rear Delt Fly", "EZ-Bar Curl", "Tricep Pushdown (rope)"],
    },
    B: {
      d1: ["Bulgarian Split Squat (bodyweight or light dumbbell)", "Leg Curl (machine)", "Seated Calf Raise"],
      d2: ["Incline Dumbbell Press", "Face Pull", "Cable Lateral Raise", "EZ-Bar Curl"],
      d4: ["Walking Lunge (DB)", "Lying Leg Curl", "Seated Calf Raise"],
      d5: ["Cable Lateral Raise", "Cable Rear Delt Fly", "Hammer Curl (DB)", "Overhead Tricep Extension (Cable)"],
    },
    C: {
      d1: ["Reverse Lunge (DB)", "Seated Leg Curl", "Standing Calf Raise"],
      d2: ["Machine Chest Press", "Face Pull (rope)", "DB Lateral Raise", "Hammer Curl (DB)"],
      d4: ["Step-Up (DB)", "Seated Leg Curl", "Donkey Calf Raise"],
      d5: ["DB Lateral Raise", "Band Pull-Apart", "Incline DB Curl", "Tricep Pushdown (rope)"],
    },
  };
  const accessories = accessoryMap[rotation as keyof typeof accessoryMap];

  // ─── MESOCYCLE-LOCKED WARMUPS ───
  const warmups = {
    A: {
      d1: ["Hip 90/90 Stretch — 1×60s each side", "Glute Bridge (bodyweight) — 2×12", "Bodyweight Squat with Pause — 2×8"],
      d2: ["Band Pull-Apart — 3×12", "Arm Circle (fwd+back) — 2×10 each", "Push-Up (slow eccentric) — 2×6"],
      d3: ["Full Body Mobility Sequence (hip, ankle, t-spine, shoulder) — 8-10 min"],
      d4: ["Hip Hinge Bodyweight Practice — 2×10", "Banded Clamshell — 2×12 each", "Glute Bridge March — 2×10 each"],
      d5: ["Band Pull-Apart — 3×12", "Wall Slide — 2×10", "Prone Y-T-W — 2×6 each"],
    },
    B: {
      d1: ["Hip 90/90 Stretch — 1×60s each side", "Pause Goblet Squat (light) — 2×8", "Banded Lateral Walk — 2×10 each side"],
      d2: ["Band Pull-Apart — 3×15", "Scapular Push-Up — 2×10", "Half-Kneeling Landmine Press — 2×8 each"],
      d3: ["Mobility Routine (hip, t-spine, shoulder) — 8-10 min"],
      d4: ["Hip Hinge Patterning with Dowel — 2×10", "Banded Hip Thrust — 2×12", "KB Swing (light) — 2×8"],
      d5: ["Band Pull-Apart — 3×15", "Wall Slide — 2×10", "Prone Y-T-W — 2×8 each"],
    },
    C: {
      d1: ["Hip 90/90 Stretch — 1×60s each side", "Goblet Squat tempo — 2×8, 3s ecc", "Banded Monster Walk — 2×10 each"],
      d2: ["Band Pull-Apart — 3×15", "Scapular Push-Up — 2×10", "Cable Face Pull (light) — 2×12"],
      d3: ["Full Body Mobility Sequence — 8-10 min"],
      d4: ["Hip Hinge Wall Drill — 2×10", "Banded Glute Bridge — 2×12", "Bodyweight RDL — 2×8 each"],
      d5: ["Band Pull-Apart — 3×15", "Shoulder CARs — 2×5 each", "Prone Y-T-W — 2×8 each"],
    },
  };
  const wu = warmups[rotation as keyof typeof warmups];

  // ─── MESOCYCLE-LOCKED EXPLOSIVE PRIMERS ───
  const primers = {
    A: { d1: "Squat Jump (bodyweight) — 3×4", d4: "Kettlebell Swing (light) — 3×8", d5: "Medicine Ball Overhead Slam (light) — 3×5" },
    B: { d1: "Box Jump (low box) — 3×4", d4: "Broad Jump — 3×3", d5: "Medicine Ball Overhead Slam — 3×5" },
    C: { d1: "Lateral Bound — 3×4 each", d4: "KB Swing — 3×10", d5: "Med Ball Chest Pass — 3×6" },
  };
  const primer = primers[rotation as keyof typeof primers];
  const primerD2 = {
    A: "Medicine Ball Wall Throw (light) — 3×5",
    B: "Medicine Ball Chest Pass (wall) — 3×6",
    C: "Plyo Push-Up (from knees) — 3×5",
  }[rotation] || "";

  // ─── MESOCYCLE-LOCKED CORE (reduced to 2 sets for 8-12 weekly target) ───
  const coreMap = {
    A: {
      d1: ["Dead Bug — 2×8 each side", "Glute Bridge Hold — 2×30s"],
      d2: ["Plank (forearm) — 2×30s", "Pallof Press — 2×10 each side"],
      d3: ["Dead Bug — 2×8 each", "Bird Dog — 2×10 each", "Side Plank — 2×20s each"],
      d4: ["Bird Dog — 2×10 each side", "Hollow Body Hold — 2×15s"],
      d5: ["Dead Bug — 2×8 each", "Pallof Press — 2×10 each side"],
    },
    B: {
      d1: ["Dead Bug — 2×10 each", "Pallof Press — 2×10 each side"],
      d2: ["Ab Wheel Rollout (kneeling) — 2×8", "Side Plank — 2×30s each"],
      d3: ["Dead Bug — 2×10 each", "Bird Dog — 2×10 each", "Copenhagen Plank — 2×20s each"],
      d4: ["Suitcase Carry (light) — 2×25m each", "Hollow Body Hold — 2×20s"],
      d5: ["Pallof Press — 2×10 each side", "Plank with Shoulder Tap — 2×10 each"],
    },
    C: {
      d1: ["Dead Bug — 2×10 each", "Pallof Press — 2×12 each side"],
      d2: ["Ab Wheel Rollout — 2×10", "Side Plank — 2×30s each"],
      d3: ["Dead Bug — 2×10 each", "Bird Dog — 2×12 each", "Copenhagen Plank — 2×25s each"],
      d4: ["Farmer Carry — 2×30m", "Hollow Body Hold — 2×25s"],
      d5: ["Pallof Press — 2×12 each side", "Plank Shoulder Tap — 2×12 each"],
    },
  };
  const core = coreMap[rotation as keyof typeof coreMap];

  // ─── MESOCYCLE-LOCKED CONDITIONING ───
  const conditioningMap = {
    A: {
      d1: "Incline Treadmill Walk at comfortable pace. Heart rate 120-140 BPM. 10-12 min.",
      d2: "Assault Bike or Rower at easy pace. Heart rate below 140 BPM. 10 min.",
      d3: "Zone 2 — Incline Treadmill Walk or Light Jog. Conversational pace. Heart rate 125-140 BPM. 20-25 min. Nasal breathing preferred. RPE 4-5.",
      d4: "Light Sled Drag or Rower. 3 rounds of 3 min work, 1 min rest. Low effort. 10-12 min.",
      d5: "EMOM × 10 min: Min 1 — 8 KB Swings (light). Min 2 — 10 Air Squats. Easy pace.",
    },
    B: {
      d1: "EMOM × 8 min: Min 1 — 10 KB Swings. Min 2 — 8 Goblet Squats (light). Moderate effort.",
      d2: "4 Rounds: 8 Push-Ups + 10 Renegade Row (light) + 15s rest. 8-10 min.",
      d3: "Zone 2 — Assault Bike or Rower at conversational pace. Heart rate 130-145 BPM. Nasal breathing. 25 min.",
      d4: "3 Rounds: 10 KB Swings + 8 Step-Ups + 200m Row. 90s rest. 8-10 min.",
      d5: "Tabata Light: 20s work / 20s rest × 6 rounds: Assault Bike at moderate pace. HR 140-155 BPM. 8-10 min.",
    },
    C: {
      d1: "3 Rounds: 10 Goblet Squats + 8 KB Swings + 200m Row. 60s rest. 8-10 min.",
      d2: "AMRAP × 8 min: 8 Push-Ups + 8 Cable Rows + 10 Air Squats.",
      d3: "Zone 2 — Incline Walk or Light Jog. 25-30 min. HR 130-145 BPM.",
      d4: "Sled Push/Pull intervals: 4 × 20m push, 20m pull. 90s rest. 10 min.",
      d5: "EMOM × 10 min: Min 1 — 10 KB Swings. Min 2 — 12 Air Squats + 4 Burpees.",
    },
  };
  const cond = conditioningMap[rotation as keyof typeof conditioningMap];

  // ─── RIR BY PHASE ───
  let rirPrimary: string, rirSecondary: string, rirAccessory: string;
  if (isDeload) {
    rirPrimary = "5"; rirSecondary = "5"; rirAccessory = "5";
  } else if (phase === 1) {
    rirPrimary = weekInPhase === 3 ? "2" : "3";
    rirSecondary = weekInPhase === 3 ? "2" : "3";
    rirAccessory = weekInPhase === 3 ? "2" : "3";
  } else if (phase === 2) {
    rirPrimary = "2"; rirSecondary = "2"; rirAccessory = "2";
  } else {
    const pMap: Record<number, string> = { 1: "2", 2: "2", 3: "1", 4: "1" };
    rirPrimary = pMap[weekInPhase];
    rirSecondary = pMap[weekInPhase];
    rirAccessory = "1-2";
  }

  // ─── REP PROGRESSIONS ───
  const isLoadReset = weekInPhase === 4 && phase <= 2;
  const primaryReps = isDeload ? "6" : isLoadReset ? "8" : String(7 + weekInPhase);
  const secondaryReps = isDeload ? "8" : isLoadReset ? "10" : String(9 + weekInPhase);
  const accessoryReps = isDeload ? "10" : isLoadReset ? "10" : phase === 1
    ? String(9 + weekInPhase)
    : String(9 + weekInPhase);

  // ─── PRIMARY SETS (Rebuild uses 3 sets, not 4) ───
  const primarySets = isLoadReset || isDeload ? 3 : 3;

  // ─── ACCESSORY SETS ───
  const accessorySets = isLoadReset || isDeload ? 2 : 3;
  const coreSets = isLoadReset || isDeload ? 2 : 2;

  // ─── INTENSITY TECHNIQUE RULES ───
  let intensityRules: string;
  if (isDeload) {
    intensityRules = `DELOAD: NO intensity techniques. Straight sets only. RPE 5-6.`;
  } else if (phase === 1) {
    intensityRules = `BASE CONDITIONING — Week ${weekInPhase}/4:
NO intensity techniques allowed. Supersets are the ONLY permitted pairing method.
All primary lifts use controlled 3-sec eccentrics.
Focus: movement quality, pattern reinforcement, joint safety.
${isLoadReset ? "LOAD RESET: Increase load 5% on primaries. Reset reps to Week 1 targets. Drop 1 accessory set per session. Conditioning volume reduced 20%." : ""}`;
  } else if (phase === 2) {
    const allowed: string[] = ["Supersets on accessories (strategic pairing)"];
    if (weekInPhase >= 2) allowed.push("Occasional drop sets on accessories ONLY (1 per session max, final set)");
    if (weekInPhase >= 3) allowed.push("Heavy rest-pause on final primary set");
    intensityRules = `STRENGTH FOUNDATION — Week ${weekInPhase}/4:
ALLOWED:
  - ${allowed.join("\n  - ")}
  - Paused reps on primary compounds
  - Tempo 2-1-1 on accessories
${isLoadReset ? "LOAD RESET: +5% on primaries, reset reps, drop 1 accessory set." : ""}
PROHIBITED: Myo-reps, mechanical drop sets, cluster sets, 1.5 rep method.`;
  } else {
    intensityRules = `PEAK — Week ${weekInPhase}/4:
ALLOWED:
  - Rest-pause on final primary set
  - Mechanical advantage drop sets on machines
  - Myo-reps on accessories (final set only)
  - Drop sets on accessories (final set only)
  - Supersets
PROHIBITED: Cluster sets, Olympic lifts.`;
  }

  // ─── DAY 6 SESSION IDENTITY ───
  const sessionIdentities = ["Kettlebell", "Dumbbell", "Bodyweight + Bands", "Sled + Carry", "Med Ball + Jumping"];
  const day6Identity = isDeload ? "Bodyweight Recovery" : sessionIdentities[(week - 1) % sessionIdentities.length];
  const day6Duration = "25-30 min";
  const day6Rounds = "6-8";

  return `You are an elite S&C coach building Week ${week} of a 13-week M2F REBUILD 2.1 program.
REBUILD is designed for fathers returning to training or with limited training history. It prioritizes movement quality, joint safety, and gradual progression.

═══ CONTEXT ═══
Week ${week}/13 | Phase: ${phaseName} (week ${weekInPhase}/4) | Rotation: ${rotation} | Mesocycle: ${mesocycle}
${isDeload ? "⚠️ DELOAD WEEK — reduce volume 40%, RPE 5-6.\n" : ""}
${isLoadReset ? "⚠️ LOAD RESET WEEK — +5% load on primaries, reset reps to Week 1 targets, drop 1 accessory set, reduce conditioning 20%.\n" : ""}

═══ CRITICAL: MESOCYCLE CONSISTENCY ═══
ALL exercises are LOCKED for the entire 4-week mesocycle. The ONLY things that change week-to-week are:
  1. Reps (progressive overload: +1 rep/week for 3 weeks, then reset)
  2. RIR (Phase 1: 3→3→2→3. Phase 2: 2 throughout)
  3. Load (increases when RIR drops or on reset weeks)
Warmups, primers, secondaries, accessories, core, and conditioning stay IDENTICAL across all 4 weeks.

═══ REDUNDANCY RULES ═══
NEVER program two exercises from the same movement pattern in the same session:
  - Trap Bar Deadlift + Dumbbell RDL = VIOLATION (both bilateral hinges)
  - DB Hip Thrust + Single-Leg Hip Thrust = VIOLATION (both hip thrust variations)
  - Goblet Squat + Leg Press = ALLOWED (squat + machine press, different stimulus)
The PRIMARY + SECONDARY must be DIFFERENT movement patterns.

═══ REBUILD-SPECIFIC RULES ═══
- Phase 1 uses dumbbell/goblet/trap bar ONLY for joint safety and motor control
- Phase 2 introduces barbell compounds (Front Squat, Bench Press)
- NO Olympic lifts ever. No percentage fields.
- Primary lifts: ${primarySets} sets (not 4 like Perform)
- 3-sec controlled eccentric on ALL lower body primary lifts in Phase 1
- Conditioning is aerobic-focused in Phase 1, moderate in Phase 2+
- Primers are low-impact: squat jumps (bodyweight), light KB swings, med ball throws

═══ EXACT EXERCISES FOR THIS MESOCYCLE (DO NOT CHANGE) ═══

DAY 1 — LOWER BODY: SQUAT EMPHASIS
  Warmup: ${wu.d1.join(" | ")}
  Explosive Primer: ${primer.d1} — no RIR
  Primary: ${lifts.d1} — ${primarySets}×${primaryReps}, RIR ${rirPrimary}${phase === 1 ? " (3-sec eccentric)" : ""}
  Secondary: ${secondary.d1} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d1.length} exercises, ${accessorySets} sets each, RIR ${rirAccessory}):
${accessories.d1.map(a => `    - ${a}`).join("\n")}
  Core (${coreSets} sets each): ${core.d1.join(" | ")}
  Conditioning: ${cond.d1}

DAY 2 — UPPER BODY: HORIZONTAL PUSH EMPHASIS (Horizontal Push + Pulling)
  Warmup: ${wu.d2.join(" | ")}
  Explosive Primer: ${primerD2} — no RIR
  Primary: ${lifts.d2} — ${primarySets}×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d2} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d2.length} exercises, ${accessorySets} sets each, RIR ${rirAccessory}):
${accessories.d2.map(a => `    - ${a}`).join("\n")}
  Core (${coreSets} sets each): ${core.d2.join(" | ")}
  Conditioning: ${cond.d2}

DAY 3 — ZONE 2 / ACTIVE RECOVERY
  Warmup: ${wu.d3.join(" | ")}
  NO explosive movement, NO strength, NO accessories
  Core (${coreSets} sets each): ${core.d3.join(" | ")}
  Zone 2 Conditioning: ${cond.d3}

DAY 4 — LOWER BODY: HINGE EMPHASIS (Hip Hinge / Posterior Chain)
  Warmup: ${wu.d4.join(" | ")}
  Explosive Primer: ${primer.d4} — no RIR
  Primary: ${lifts.d4} — ${primarySets}×${primaryReps}, RIR ${rirPrimary}${phase === 1 ? " (3-sec eccentric)" : ""}
  Secondary: ${secondary.d4} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d4.length} exercises, ${accessorySets} sets each, RIR ${rirAccessory}):
${accessories.d4.map(a => `    - ${a}`).join("\n")}
  Core (${coreSets} sets each): ${core.d4.join(" | ")}
  Conditioning: ${cond.d4}

DAY 5 — UPPER BODY: VERTICAL PUSH EMPHASIS (Vertical Push + Pulling)
  Warmup: ${wu.d5.join(" | ")}
  Explosive Primer: ${primer.d5} — no RIR
  Primary: ${lifts.d5} — ${primarySets}×${primaryReps}, RIR ${rirPrimary}
  Secondary: ${secondary.d5} — 3×${secondaryReps}, RIR ${rirSecondary}
  Accessories (${accessories.d5.length} exercises, ${accessorySets} sets each, RIR ${rirAccessory}):
${accessories.d5.map(a => `    - ${a}`).join("\n")}
  Core (${coreSets} sets each): ${core.d5.join(" | ")}
  Conditioning: ${cond.d5}

DAY 6 — ATHLETIC CONDITIONING (Session Identity: ${day6Identity})
  ALL movements use "${day6Identity}" implement or bodyweight.
  Duration: ${day6Duration}

  1. POWER PRIMER (3-5×3-5): Low-impact explosive movement using session implement.
     NO Olympic lifts. Use KB swings, squat jumps, med ball throws, sled pushes.

  2. ATHLETIC EMOM (${day6Duration}) — 4-minute repeating cycle, ${day6Rounds} rounds:
     Minute 1 (POWER): Explosive movement with session implement
     Minute 2 (CARDIO): SAME modality every round (pick ONE: 200m Walk/Jog, 30s Jump Rope, Easy Bike)
     Minute 3 (ATHLETIC): Simple movement pattern (no complex agility)
     Minute 4 (CORE): Stability exercise
     Rules: Cardio in Minute 2 IDENTICAL every round. Each minute ≤40-45s for transition.

  3. LOADED CARRY FINISHER: 3 × 30m (lighter than Perform)

  Format EMOM as single entry: sets=1, reps=null.
  Detail: "EMOM ${day6Duration} — 4-min cycle, X rounds:\\nMinute 1: [movement] × [reps]\\nMinute 2: [cardio] × [distance/time]\\nMinute 3: [movement] × [reps]\\nMinute 4: [movement] × [reps/time]"

═══ INTENSITY TECHNIQUES ═══
${intensityRules}

═══ VOLUME TARGETS (weekly effective sets — lower than Perform) ═══
Back: 12-16 | Chest: 8-12 | Shoulders: 8-12 | Quads: 9-13
Hamstrings: 8-12 | Glutes: 10-14 | Biceps: 6-10 | Triceps: 6-10
Calves: 6-10 | Core: 8-12
Counting: Primary mover = 1.0 | Major secondary = 0.5 | Stabilizers/primers/conditioning = 0

CRITICAL RULES:
1. Pull:Press ratio ≥ 1.35:1 — D2 secondary IS a pulling exercise (row). Count all pulls vs presses.
2. Every lower day needs ≥1 unilateral movement
3. Primaries = ${primarySets} sets. Accessories = ${accessorySets} sets.
4. Max 7-9 working exercises per session (excluding warmup, conditioning, mindset, mission)
5. NO Olympic lifts. No percentage or percentageBase fields.
6. Phase 1: DB/goblet/trap bar only. No barbell squat or barbell bench.
7. Phase 2: Barbell introduced on Front Squat and Bench Press only.
8. NO redundant movement patterns in the same session (see redundancy rules above)
9. Calves appear on BOTH lower days (D1 and D4)

═══ JOINT LONGEVITY ═══
- Face pulls or rear delt work 2x/week
- Band pull-aparts in every upper body warmup
- Calf work on both lower days
- Core anti-rotation (Pallof Press) and anti-extension (Dead Bug) balanced

═══ OUTPUT FORMAT — RETURN ONLY VALID JSON ═══
No markdown. No code blocks. Return a JSON array of 6 day objects:
[
  {
    "day_of_week": 1,
    "label": "Day 1 — Lower Body: Squat Emphasis",
    "exercises": [
      {
        "name": "A1. Exercise Name",
        "detail": "Coaching cue.",
        "sets": 3,
        "reps": "8",
        "rest": 90,
        "rir": "3",
        "group": "groupId",
        "type": "exercise",
        "superset_label": "Block Label"
      }
    ]
  }
]

GROUP NAMING: "{block}{week}{day}" — wu=warmup, pp=primer, ps=primary, sc=secondary, ha=hypertrophy-A, hb=hypertrophy-B, core=core, cf=conditioning.
PREFIX: W1/W2/W3=warmup, A1/A2=primers, B1=primary, C1/C2=secondary, D1/D2/D3/D4=accessories, E1/E2=core, F=conditioning.
Warmup exercises: type="warmup". Conditioning/Zone2: sets=1, reps=null.

SPECIAL ITEMS (always last two):
- Mindset Moment: type="mindset", name="Mindset Moment". 3-5 sentences connecting session to fatherhood.
- Dad Mission: type="mission", name="Dad Mission". Specific action under 10 min.

═══ PRE-OUTPUT CHECKLIST ═══
 1. ALL exercises match the exact mesocycle-locked list above
 2. Reps: primary=${primaryReps}, secondary=${secondaryReps}, accessories=phase-appropriate
 3. RIR: primary=${rirPrimary}, secondary=${rirSecondary}, accessories=${rirAccessory}
 4. Pull:Press ratio ≥ 1.35:1
 5. Every lower day has unilateral work
 6. Rear delts + band pull-aparts hit 2x/week
 7. Day 2=HORIZONTAL push+pull, Day 5=VERTICAL push+pull
 8. Intensity techniques match phase/week rules
 9. NO Olympic lifts anywhere
10. Warmups on every day, coaching cues on primaries
11. NO redundant movement patterns in any session
12. Calves appear on BOTH lower days (D1 and D4)
${isLoadReset ? "13. Load Reset: +5% load noted on primaries, reps at Week 1 values, sets reduced on accessories/core" : ""}
Fix any violations before returning.`;
}

// ─── MAIN PROMPT ROUTER ───

function buildPrompt(programType: string, week: number): string {
  return programType === "perform" ? buildPerformPrompt(week) : buildRebuildPrompt(week);
}

// ─── SERVER ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { program_type, program_id, start_week, end_week } = await req.json();

    if (!program_type || !program_id || !start_week || !end_week) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: any[] = [];

    for (let week = start_week; week <= end_week; week++) {
      console.log(`Generating week ${week} for ${program_type}...`);

      const prompt = buildPrompt(program_type, week);

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{
                  text: "You are an elite S&C coach who has trained athletes and raised children. Return ONLY valid JSON arrays. No markdown, no code blocks, no text outside the JSON.\n\n" + prompt,
                }],
              },
            ],
            generationConfig: { temperature: 0.6 },
          }),
        }
      );

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`AI error week ${week}: ${errText}`);
        results.push({ week, error: `AI error: ${aiResponse.status}` });
        continue;
      }

      const aiData = await aiResponse.json();
      let content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let weekDays: any[];
      try {
        weekDays = JSON.parse(content);
      } catch (_parseErr) {
        console.error(`Parse error week ${week}:`, content.substring(0, 500));
        results.push({ week, error: "JSON parse error" });
        continue;
      }

      if (!Array.isArray(weekDays) || weekDays.length === 0) {
        results.push({ week, error: "Invalid data" });
        continue;
      }

      const insertRows = weekDays.map((day: any) => ({
        program_id,
        day_number: (week - 1) * 7 + day.day_of_week,
        label: day.label + (week === 13 ? " [Deload]" : ""),
        exercises: day.exercises,
      }));

      const { error: insertError } = await supabase
        .from("program_days")
        .upsert(insertRows, { onConflict: "program_id,day_number" });

      if (insertError) {
        console.error(`Insert error week ${week}:`, insertError);
        results.push({ week, error: insertError.message });
      } else {
        results.push({ week, success: true, days: insertRows.length });
        console.log(`Week ${week}: ${insertRows.length} days inserted`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
