import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

// ─── Helper ───
function e(
  name: string, detail: string, sets: number, reps: string | null,
  rest: number | null, rir: string | null, type: string,
  group: string | null = null, superset_label: string | null = null
) {
  return { name, detail, sets, reps, rest, rir, type, group, superset_label };
}

// ─── Phase / Week / Mesocycle helpers ───
function getPhase(dayNum: number): 1 | 2 | 3 {
  if (dayNum <= 56) return 1;   // Weeks 1-8
  if (dayNum <= 112) return 2;  // Weeks 9-16
  return 3;                      // Weeks 17-24
}

function getWeekInPhase(dayNum: number): number {
  const phase = getPhase(dayNum);
  const phaseStart = phase === 1 ? 1 : phase === 2 ? 57 : 113;
  return Math.ceil((dayNum - phaseStart + 1) / 7);
}

function getWeekInMeso(dayNum: number): number {
  const wip = getWeekInPhase(dayNum);
  return ((wip - 1) % 4) + 1; // 1-4 within each mesocycle
}

function isDeload(dayNum: number): boolean {
  return getWeekInMeso(dayNum) === 4;
}

function getGlobalWeek(dayNum: number): number {
  return Math.ceil(dayNum / 7);
}

// ═══════════════════════════════════════════════════════════════
// DAY 3 — Conditioning + Core + Arms
// Strategy: Zone 2 base + progressive interval finisher
// ═══════════════════════════════════════════════════════════════
function buildDay3Conditioning(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const wm = getWeekInMeso(dayNum);
  const gw = getGlobalWeek(dayNum);
  const deload = isDeload(dayNum);
  const grpPrefix = `AW${gw}D3`;

  const conditioning: any[] = [];

  // ─── Zone 2 Block (all phases) ───
  // Phase 1: 20-30 min | Phase 2: 25-35 min | Phase 3: 30-40 min
  const z2Base = phase === 1 ? 20 : phase === 2 ? 25 : 30;
  const z2Duration = deload ? z2Base : z2Base + (wm - 1) * 3; // +3 min/week
  const z2Deload = deload ? Math.round(z2Base * 0.7) : z2Duration;
  const z2Min = deload ? z2Deload : z2Duration;

  const z2Modality = [
    "Bike, Incline Walk, or Elliptical",
    "Row, Bike, or Incline Walk",
    "Incline Walk, Elliptical, or Swim",
  ];
  const z2Pick = z2Modality[(gw - 1) % z2Modality.length];

  conditioning.push(
    e(
      "A1. Zone 2 Cardio",
      `${z2Pick} — HR 120-140 BPM, RPE 5-6. Nasal breathing preferred. ${deload ? "Deload: easy effort." : "Steady conversational pace."}`,
      1, `${z2Min} min`, null, null, "conditioning", grpPrefix, null
    )
  );

  // ─── Short Interval Block (Phase 2+, non-deload) ───
  if (phase >= 2 && !deload) {
    const intervalGrp = `A2W${gw}D3`;

    if (phase === 2) {
      // Phase 2: Aerobic intervals, 6-8 min, RPE 6-7
      const p2Intervals = [
        { name: "Bike Intervals", detail: "30s moderate / 30s easy × 6-8 rounds. RPE 6-7, HR 145-160 BPM. Controlled breathing throughout.", reps: "6-8 min" },
        { name: "Row Intervals", detail: "200m moderate / 45s easy × 5-6 rounds. RPE 6-7, HR 145-160 BPM. Focus on drive through legs, relaxed arms.", reps: "7-8 min" },
        { name: "Incline Walk Intervals", detail: "1 min 12% incline / 1 min 3% incline × 4 rounds. RPE 6-7, HR 140-155 BPM.", reps: "8 min" },
      ];
      const pick = p2Intervals[(gw - 9) % p2Intervals.length];
      conditioning.push(
        e(`A2. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", intervalGrp, null)
      );
    } else {
      // Phase 3: Controlled intervals, 8-12 min, RPE 7
      const p3Intervals = [
        { name: "Bike Sprint Intervals", detail: "20s hard / 40s easy × 8-10 rounds. RPE 7, HR 155-170 BPM. Power output > speed.", reps: "8-10 min" },
        { name: "Row Repeats", detail: "250m @ controlled effort / 60s rest × 5-6 rounds. RPE 7, HR 155-170 BPM. Consistent split times.", reps: "10-12 min" },
        { name: "Ski Erg Intervals", detail: "30s work / 30s rest × 8-10 rounds. RPE 7, HR 155-170 BPM. Full hip extension each pull.", reps: "8-10 min" },
        { name: "Mixed Modal Intervals", detail: "1 min Bike + 1 min Row, alternating × 4-5 rounds. RPE 7, HR 155-170 BPM. Smooth transitions.", reps: "8-10 min" },
      ];
      const pick = p3Intervals[(gw - 17) % p3Intervals.length];
      conditioning.push(
        e(`A2. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", intervalGrp, null)
      );
    }
  }

  return conditioning;
}

// ═══════════════════════════════════════════════════════════════
// DAY 6 — Saturday Hybrid Conditioning
// Strategy: Movement-based, not max effort
// Phase 1: Foundation circuits, RPE 6
// Phase 2: Build circuits with load, RPE 6-7
// Phase 3: Performance circuits, RPE 7
// ═══════════════════════════════════════════════════════════════
function buildDay6(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const wm = getWeekInMeso(dayNum);
  const gw = getGlobalWeek(dayNum);
  const deload = isDeload(dayNum);
  const mesoNum = Math.ceil(gw / 4); // 1-6

  // Duration progression: base + 4 min/week in meso
  const durationBase = phase === 1 ? 24 : phase === 2 ? 28 : 32;
  const duration = deload ? Math.round(durationBase * 0.7) : durationBase + (wm - 1) * 4;

  const exercises: any[] = [];

  // ─── Warm-up primer (all phases) ───
  const warmups = [
    { name: "Movement Prep", detail: "2 rounds: 10 Jumping Jacks + 5 Inchworms + 10 Bodyweight Squats + 5 Push-Ups. Easy pace, wake the system up." },
    { name: "Movement Prep", detail: "2 rounds: 10 Lateral Shuffles each + 5 World's Greatest Stretch each + 10 Glute Bridges. Controlled, deliberate." },
    { name: "Movement Prep", detail: "2 rounds: 200m Easy Jog + 10 Leg Swings each + 5 Broad Jumps (soft landing). Get the heart rate moving." },
  ];
  const warmPick = warmups[(gw - 1) % warmups.length];
  exercises.push(
    e(warmPick.name, warmPick.detail, 1, "5 min", null, null, "warmup", null, null)
  );

  if (deload) {
    // ─── Deload: easy movement flow ───
    exercises.push(
      e(
        "Easy Movement Flow",
        `${duration} min of mixed low-intensity movement: Walk + Light KB Swings + Easy Bike. RPE 4-5, HR 120-140 BPM. Move to feel good, not to perform.`,
        1, `${duration} min`, null, null, "conditioning", null, null
      )
    );
    exercises.push(
      e("Coaching Note", "Deload week — this is active recovery. No scoring, no competition. Move at a pace where you could hold a conversation the entire time.", 1, null, null, null, "note", null, null)
    );
    return exercises;
  }

  // ─── Phase-specific conditioning ───
  if (phase === 1) {
    // Foundation: Movement-based circuits, RPE 6, bodyweight + light load
    const p1Circuits = [
      {
        name: `Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 12/10 Cal Bike (easy pace)\nMin 2: 10 KB Swings (light-moderate)\nMin 3: 10/8 Cal Row\nMin 4: 8 Air Squats + 8 Push-Ups\nRPE 6, HR 140-155 BPM. Finish each station in 40-45s, rest remainder.`,
      },
      {
        name: `Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 200m Row (moderate)\nMin 2: 8 Goblet Squats + 8 Ring Rows\nMin 3: 12/10 Cal Bike\nMin 4: 10 Step-Ups (alternating) + 30s Plank\nRPE 6, HR 140-155 BPM. Sustainable pace — same effort round 1 and final round.`,
      },
      {
        name: `Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 10/8 Cal Ski Erg\nMin 2: 12 DB Deadlifts (moderate)\nMin 3: 12/10 Cal Bike\nMin 4: 10 Push-Ups + 20 Mountain Climbers\nRPE 6, HR 140-155 BPM. Focus on quality movement, not speed.`,
      },
      {
        name: `Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 15/12 Cal Bike\nMin 2: 10 KB Goblet Squats + 5 Burpees (no push-up)\nMin 3: 200m Row\nMin 4: 10 DB Floor Press + 30s Dead Bug\nRPE 6, HR 140-155 BPM. Rest 15-20s between movements within each minute.`,
      },
    ];
    const pick = p1Circuits[(mesoNum * 4 + wm - 1) % p1Circuits.length];
    exercises.push(
      e(pick.name, pick.detail, Math.floor(duration / 4), `${duration} min`, null, null, "conditioning", null, null)
    );
  } else if (phase === 2) {
    // Build: Loaded circuits with more complexity, RPE 6-7
    const p2Circuits = [
      {
        name: `Hybrid Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 15/12 Cal Row (moderate effort)\nMin 2: 8 DB Thrusters (moderate load)\nMin 3: 12/10 Cal Bike\nMin 4: 8 Pull-Ups + 10 Box Step-Overs\nRPE 6-7, HR 145-160 BPM. Pacing > intensity. Repeatable effort across all rounds.`,
      },
      {
        name: `Hybrid Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 200m Row\nMin 2: 6 Hang Power Cleans (light, 40-50%) + 6 Front Squats\nMin 3: 14/11 Cal Bike\nMin 4: 12 Toes-to-Bar (or Hanging Knee Raises)\nRPE 6-7, HR 145-160 BPM. Barbell work should feel athletic — not heavy.`,
      },
      {
        name: `Hybrid Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 12/10 Cal Ski Erg\nMin 2: 10 DB Snatches (alternating, moderate)\nMin 3: 15/12 Cal Bike\nMin 4: 8 Burpee Box Jumps (step down)\nRPE 6-7, HR 145-160 BPM. Step down from box every rep — protect the joints.`,
      },
      {
        name: `Hybrid Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 250m Row (controlled effort)\nMin 2: 10 KB Swings + 5 Push-Ups\nMin 3: 12/10 Cal Bike\nMin 4: 8 Wall Balls + 20m Farmer Carry\nRPE 6-7, HR 145-160 BPM. Wall Balls smooth — catch and redirect, don't muscle them.`,
      },
    ];
    const pick = p2Circuits[(mesoNum * 4 + wm - 1) % p2Circuits.length];
    exercises.push(
      e(pick.name, pick.detail, Math.floor(duration / 4), `${duration} min`, null, null, "conditioning", null, null)
    );
  } else {
    // Performance: Athletic circuits with power elements, RPE 7
    // Phase 3 adds a 4-min athletic primer before the circuit
    exercises.push(
      e(
        "Athletic Primer",
        "4 min: 2 × (10m lateral shuffle each direction + 10m high knees + 10m backpedal + 2 broad jumps). Smooth, athletic, controlled.",
        1, "4 min", null, null, "conditioning", null, null
      )
    );

    const p3Circuits = [
      {
        name: `Performance Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 15/12 Cal Row (strong effort)\nMin 2: 5 Power Cleans (50-55%) + 5 Box Jumps (step down)\nMin 3: 14/11 Cal Bike\nMin 4: 8 Pull-Ups + 10 V-Ups\nRPE 7, HR 155-170 BPM. Power movements should feel explosive — not grinding.`,
      },
      {
        name: `Performance Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 250m Row (strong pull)\nMin 2: 8 DB Thrusters (moderate-heavy) + 6 Burpees\nMin 3: 15/12 Cal Bike\nMin 4: 12 Toes-to-Bar + 20m Sled Push\nRPE 7, HR 155-170 BPM. Maintain movement quality — if form breaks, reduce load.`,
      },
      {
        name: `Performance Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 12/10 Cal Ski Erg (strong)\nMin 2: 8 Hang Power Cleans (50-55%) + 8 Front Rack Lunges\nMin 3: 14/11 Cal Bike\nMin 4: 10 Burpee Box Jumps (step down) + 10 Sit-Ups\nRPE 7, HR 155-170 BPM. Cleans and lunges back-to-back — manage the grip fatigue.`,
      },
      {
        name: `Performance Circuit: ${duration} min`,
        detail: `Every 4 min × ${Math.floor(duration / 4)} rounds:\nMin 1: 200m Row + 100m Run\nMin 2: 6 DB Snatches each arm + 8 Box Jumps (step down)\nMin 3: 15/12 Cal Bike\nMin 4: 40m Farmer Carry (heavy) + 10 Push-Ups\nRPE 7, HR 155-170 BPM. Farmer carry is the test — grip it, brace it, walk tall.`,
      },
    ];
    const pick = p3Circuits[(mesoNum * 4 + wm - 1) % p3Circuits.length];
    exercises.push(
      e(pick.name, pick.detail, Math.floor(duration / 4), `${duration} min`, null, null, "conditioning", null, null)
    );
  }

  // ─── Coaching note ───
  const coachNotes = [
    phase === 1
      ? "This is a SYSTEM session — not a competition. Same effort first round and last round. If you can't maintain pace, scale the loading or reps down."
      : phase === 2
        ? "Building capacity now. You should feel worked but not destroyed. If your heart rate doesn't recover between rounds, reduce output by 10%."
        : "Performance phase — you should feel athletic and powerful. Quality of movement trumps speed. If barbell work feels heavy, drop 5-10% and own the reps.",
  ];
  exercises.push(
    e("Coaching Note", coachNotes[0], 1, null, null, null, "note", null, null)
  );

  // ─── Weekly conditioning summary ───
  const summaries: Record<number, string> = {
    1: "Weekly Conditioning: Zone 2 ×1 (Day 3) + Foundation Circuit ×1 (Day 6). Total: 45-55 min. Focus on movement quality and aerobic base.",
    2: "Weekly Conditioning: Zone 2 ×1 + Aerobic Intervals ×1 (Day 3) + Build Circuit ×1 (Day 6). Total: 60-80 min. Introducing interval capacity.",
    3: "Weekly Conditioning: Zone 2 ×1 + Controlled Intervals ×1 (Day 3) + Performance Circuit ×1 (Day 6). Total: 70-90 min. Peak capacity with quality.",
  };
  exercises.push(
    e("Weekly Summary", summaries[phase], 1, null, null, null, "note", null, null)
  );

  return exercises;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: string[] = [];

    // ─── Get all Day 3 and Day 6 rows ───
    const { data: allDays, error: fetchErr } = await supabase
      .from("program_days")
      .select("id, day_number, label, exercises")
      .eq("program_id", PROGRAM_ID)
      .in("day_number", [
        // Day 3s (day % 7 === 3)
        3,10,17,24,31,38,45,52,59,66,73,80,87,94,101,108,115,122,129,136,143,150,157,164,
        // Day 6s (day % 7 === 6)
        6,13,20,27,34,41,48,55,62,69,76,83,90,97,104,111,118,125,132,139,146,153,160,167,
      ])
      .order("day_number");

    if (fetchErr) throw fetchErr;

    for (const day of allDays || []) {
      const dayInWeek = day.day_number % 7;

      if (dayInWeek === 3) {
        // ─── Day 3: Keep core + arms, replace conditioning ───
        const existingExercises = (day.exercises as any[]) || [];

        // Keep everything that's NOT conditioning and NOT "Mindset Moment" / "Dad Mission"
        const coreArmsBlock = existingExercises.filter(
          (ex: any) =>
            ex.type !== "conditioning" &&
            ex.type !== "mindset" &&
            ex.type !== "mission" &&
            ex.name !== "Coaching Note"
        );

        // Build new conditioning
        const newConditioning = buildDay3Conditioning(day.day_number);

        // Combine: conditioning first, then core + arms
        const updatedExercises = [...newConditioning, ...coreArmsBlock];

        const { error: updateErr } = await supabase
          .from("program_days")
          .update({ exercises: updatedExercises })
          .eq("id", day.id);

        if (updateErr) {
          results.push(`❌ Day ${day.day_number}: ${updateErr.message}`);
        } else {
          results.push(`✅ Day ${day.day_number} (D3) updated — ${newConditioning.length} conditioning blocks`);
        }
      } else if (dayInWeek === 6) {
        // ─── Day 6: Full replacement ───
        const newExercises = buildDay6(day.day_number);
        const phase = getPhase(day.day_number);
        const deload = isDeload(day.day_number);
        const gw = getGlobalWeek(day.day_number);
        const phaseNames = { 1: "Foundation", 2: "Build", 3: "Performance" };
        const newLabel = deload
          ? `Day 6 — Active Recovery Flow [DELOAD]`
          : `Day 6 — ${phaseNames[phase]} Conditioning`;

        const { error: updateErr } = await supabase
          .from("program_days")
          .update({ exercises: newExercises, label: newLabel })
          .eq("id", day.id);

        if (updateErr) {
          results.push(`❌ Day ${day.day_number}: ${updateErr.message}`);
        } else {
          results.push(`✅ Day ${day.day_number} (D6) updated — Week ${gw}, Phase ${phase}${deload ? " [DELOAD]" : ""}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
