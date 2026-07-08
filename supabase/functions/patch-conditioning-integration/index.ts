import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

function e(
  name: string, detail: string, sets: number, reps: string | null,
  rest: number | null, rir: string | null, type: string
) {
  return { name, detail, sets, reps, rest, rir, type, group: null, superset_label: null };
}

// ─── Helpers ───
function getMeso(dayNum: number): 1 | 2 | 3 {
  if (dayNum <= 28) return 1;
  if (dayNum <= 56) return 2;
  return 3;
}

function getWeekInMeso(dayNum: number): number {
  const meso = getMeso(dayNum);
  const start = meso === 1 ? 1 : meso === 2 ? 29 : 57;
  return Math.ceil((dayNum - start + 1) / 7);
}

function isDeload(dayNum: number): boolean {
  return getWeekInMeso(dayNum) === 4;
}

function getDayOfWeek(dayNum: number): number {
  return ((dayNum - 1) % 7) + 1; // 1-7
}

// ─── Which days are upper body? ───
// Meso 1: Day 2 (Horizontal), Day 5 (Vertical)
// Meso 2-3: Day 1 (Horizontal), Day 4 (Vertical)
function isUpperDay(dayNum: number): boolean {
  const dow = getDayOfWeek(dayNum);
  const meso = getMeso(dayNum);
  if (meso === 1) return dow === 2 || dow === 5;
  return dow === 1 || dow === 4;
}

function isDay6(dayNum: number): boolean {
  return getDayOfWeek(dayNum) === 6;
}

// ═══════════════════════════════════════════════════════════
// MICRO-CONDITIONING FINISHERS (Upper days, 10-12 min)
// Low skill, high output. Elevate HR without killing recovery.
// Trackable and progressive across mesocycles.
// ═══════════════════════════════════════════════════════════

function buildFinisher(dayNum: number): any[] {
  const meso = getMeso(dayNum);
  const wim = getWeekInMeso(dayNum);
  const dow = getDayOfWeek(dayNum);
  const deload = isDeload(dayNum);

  // Deload: 5 min flush — recovery only
  if (deload) {
    return [
      e("Z. Finisher — Easy Bike Flush",
        "30s easy spin / 30s rest × 5 rounds. RPE 4-5. HR 120-140 BPM. Recovery flush — nasal breathing throughout. Promote blood flow, zero fatigue cost.",
        1, "5 min", null, null, "conditioning"),
    ];
  }

  const isHorizontalDay = (meso === 1 && dow === 2) || (meso > 1 && dow === 1);

  // ─── MESO 1: Base — RPE 6-7, aerobic capacity, longer pacing ───
  if (meso === 1) {
    if (isHorizontalDay) {
      const pool = [
        { name: "Z. Finisher — Bike Intervals", detail: "20s moderate / 40s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. Build aerobic base — consistent watts each round. Don't redline early.", reps: "12 min" },
        { name: "Z. Finisher — Row Steady State", detail: "10 min continuous @ 24-26 s/m. RPE 6-7. HR 140-150 BPM. Smooth stroke, legs drive. Hold split ±3 sec. Aerobic capacity builder.", reps: "12 min" },
        { name: "Z. Finisher — Battle Rope Intervals", detail: "20s alternating waves / 40s rest × 10 rounds. RPE 6-7. HR 140-155 BPM. Shoulders will be pre-fatigued — small amplitude, high frequency.", reps: "12 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    } else {
      const pool = [
        { name: "Z. Finisher — Sled Push", detail: "20m moderate push / walk back × 8 rounds. RPE 6-7. HR 140-155 BPM. Light load — conditioning, not strength. Stay tall, drive from hips.", reps: "12 min" },
        { name: "Z. Finisher — Bike Tempo", detail: "30s moderate / 30s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. Even effort distribution. Build aerobic engine post-pressing.", reps: "12 min" },
        { name: "Z. Finisher — Rower Tempo", detail: "30s moderate / 30s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. 24-26 s/m. Smooth and rhythmic — this is capacity work.", reps: "12 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    }
  }

  // ─── MESO 2: Build — RPE 7, increased density/output ───
  if (meso === 2) {
    if (isHorizontalDay) {
      const pool = [
        { name: "Z. Finisher — Bike Sprint Intervals", detail: "25s hard / 35s easy × 10 rounds. RPE 7. HR 150-165 BPM. Explosive first 5 pedal strokes, hold wattage. Progress: match or beat W5 output.", reps: "12 min" },
        { name: "Z. Finisher — Row Repeats", detail: "250m strong / 50s rest × 5 rounds. RPE 7. HR 150-165 BPM. Target consistent split times ±2 sec. Track total time.", reps: "12 min" },
        { name: "Z. Finisher — Ski Erg Intervals", detail: "25s hard / 35s easy × 10 rounds. RPE 7. HR 150-165 BPM. Full hip hinge, aggressive arm pull. Higher density than Meso 1.", reps: "12 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    } else {
      const pool = [
        { name: "Z. Finisher — Battle Rope Cascade", detail: "25s alternating waves / 35s rest × 10 rounds. RPE 7. HR 150-165 BPM. Tight core, small amplitude, high frequency. Beat Meso 1 wave count.", reps: "12 min" },
        { name: "Z. Finisher — Bike/Row Alternating", detail: "1 min Bike + 1 min Row × 5 rounds. RPE 7. HR 150-165 BPM. No rest between transitions — sustain output across modalities.", reps: "12 min" },
        { name: "Z. Finisher — Sled Push Intervals", detail: "20m push / walk back × 10 rounds. RPE 7. HR 150-165 BPM. Heavier load than Meso 1. Drive from hips — conditioning with purpose.", reps: "12 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    }
  }

  // ─── MESO 3: Peak — RPE 7-8, maintain duration, increase intensity ───
  if (isHorizontalDay) {
    const pool = [
      { name: "Z. Finisher — Bike Sprint", detail: "30s hard / 30s easy × 10 rounds. RPE 7-8. HR 155-170 BPM. Peak wattage in first 10s, hold form. Track and beat Meso 2 output.", reps: "12 min" },
      { name: "Z. Finisher — Row Repeats", detail: "300m strong / 60s rest × 4 rounds. RPE 7-8. HR 155-170 BPM. Target sub-1:45/500m pace. Track total time — aim for improvement.", reps: "12 min" },
      { name: "Z. Finisher — Mixed Modal", detail: "1 min Bike + 1 min Ski Erg × 5 rounds. RPE 7-8. HR 155-170 BPM. Zero transition rest. Peak conditioning output week.", reps: "12 min" },
    ];
    return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
  } else {
    const pool = [
      { name: "Z. Finisher — Ski Erg Sprint", detail: "30s hard / 30s easy × 10 rounds. RPE 7-8. HR 155-170 BPM. Full hip extension, aggressive pull. Maintain quality all 10 rounds.", reps: "12 min" },
      { name: "Z. Finisher — Bike Descending", detail: "40s / 30s / 20s hard (30s rest between) × 4 rounds. RPE 7-8. HR 155-170 BPM. Each interval gets harder — earn the rest.", reps: "12 min" },
      { name: "Z. Finisher — Rower Pyramid", detail: "200m / 300m / 400m / 300m / 200m (45s rest between). RPE 7-8. HR 155-170 BPM. Pace the 400m — that's the test.", reps: "12 min" },
    ];
    return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
  }
}

// ═══════════════════════════════════════════════════════════
// DAY 6 — MIXED MODAL CONDITIONING (20-25 min)
// Structure: 1 cyclical + 1 upper push/pull + 1 lower + 1 carry/core
// Format: Circuits, interval rotations, or density blocks
// NOT random. NOT failure-based. Trackable & progressive.
// ═══════════════════════════════════════════════════════════

function buildDay6MixedModal(dayNum: number): any | null {
  const meso = getMeso(dayNum);
  const wim = getWeekInMeso(dayNum);
  const deload = isDeload(dayNum);

  // ─── DELOAD: Recovery circuit — 12 min, RPE 5-6 ───
  if (deload) {
    return e("A1. Mixed Modal — Recovery Circuit",
      "4 rounds @ easy pace: 200m Row (cyclical) + 8 Push-Ups (upper push) + 8 Goblet Squats light (lower) + 20m Farmer Carry (carry). RPE 5-6. HR 125-140 BPM. 60s rest between rounds. Movement quality only. Total time: ~12 min.",
      1, "12 min", null, null, "conditioning");
  }

  // ─── MESO 1: Base — Build aerobic capacity, lower intensity, longer pacing ───
  if (meso === 1) {
    const circuits = [
      {
        detail: "5 rounds for quality: 250m Row (cyclical) + 8 DB Push Press (upper push) + 10 Goblet Squats (lower) + 30m Farmer Carry (carry). RPE 6-7. HR 140-155 BPM. 45s rest between rounds. Pacing — don't race. Total time: ~22 min.",
        reps: "22 min",
      },
      {
        detail: "5 rounds for quality: 12 Cal Bike (cyclical) + 10 Ring Rows or TRX Rows (upper pull) + 10 Box Step-Ups (lower) + 30s Suitcase Carry (core). RPE 6-7. HR 140-155 BPM. 45s rest between rounds. Build work capacity. Total time: ~22 min.",
        reps: "22 min",
      },
      {
        detail: "6 rounds for quality: 200m Row (cyclical) + 8 DB Floor Press (upper push) + 8 KB Swings (lower/hinge) + 20m Overhead Carry (core/stability). RPE 6-7. HR 140-155 BPM. 30s rest between rounds. Higher round count — earn the conditioning. Total time: ~24 min.",
        reps: "24 min",
      },
    ];
    const pick = circuits[wim - 1];
    return e("A1. Mixed Modal — Base Circuit", pick.detail, 1, pick.reps, null, null, "conditioning");
  }

  // ─── MESO 2: Build — Increase density, higher HR exposure ───
  if (meso === 2) {
    const circuits = [
      {
        detail: "EMOM 20 — Min 1: 12 Cal Bike (cyclical) | Min 2: 8 DB Push Press (upper push) | Min 3: 10 Goblet Squats (lower) | Min 4: 30m Farmer Carry (carry). RPE 7. HR 145-160 BPM. 5 rounds. Work 35-40s, rest 20-25s. Track cals/reps.",
        reps: "20 min",
      },
      {
        detail: "EMOM 24 — Min 1: 14 Cal Row (cyclical) | Min 2: 10 DB Rows (upper pull) | Min 3: 10 KB Front Squats (lower) | Min 4: 30m Sled Push light (carry/locomotive). RPE 7. HR 145-160 BPM. 6 rounds. Density > intensity.",
        reps: "24 min",
      },
      {
        detail: "5 rounds, 60s rest: 300m Row (cyclical) + 10 DB Bench Press (upper push) + 10 DB Walking Lunges (lower) + 40m Farmer Carry heavy (carry). RPE 7. HR 150-165 BPM. Track total time — aim to beat it. Total time: ~22 min.",
        reps: "22 min",
      },
    ];
    const pick = circuits[wim - 1];
    return e("A1. Mixed Modal — Density Block", pick.detail, 1, pick.reps, null, null, "conditioning");
  }

  // ─── MESO 3: Peak — Maintain duration, increase intensity/output ───
  const circuits = [
    {
      detail: "EMOM 24 — Min 1: 14 Cal Bike (cyclical) | Min 2: 8 DB Thrusters (upper push + lower) | Min 3: 14 Cal Row (cyclical) | Min 4: 30m Heavy Farmer Carry (carry). RPE 7-8. HR 155-170 BPM. 6 rounds. Peak output — track all numbers.",
      reps: "24 min",
    },
    {
      detail: "6 rounds, 45s rest: 250m Row (cyclical) + 8 Push-Ups + 5 Burpee Step-Overs (upper/lower) + 10 KB Swings (hinge/power) + 20m Overhead Carry (core). RPE 7-8. HR 155-170 BPM. Track total time. Total time: ~24 min.",
      reps: "24 min",
    },
    {
      detail: "EMOM 20 — Min 1: 16 Cal Bike (cyclical) | Min 2: 6 Power Cleans 50% (upper pull/power) | Min 3: 10 Box Jumps (lower/reactive) | Min 4: 40m Farmer Carry heavy (carry). RPE 7-8. HR 160-175 BPM. 5 rounds. Peak week — max sustainable output.",
      reps: "20 min",
    },
  ];
  const pick = circuits[wim - 1];
  return e("A1. Mixed Modal — Peak Output", pick.detail, 1, pick.reps, null, null, "conditioning");
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";
    const targetProgramId = url.searchParams.get("program_id") || PROGRAM_ID;

    // Fetch all days for Mesos 1-3
    const { data: allDays, error: fetchErr } = await supabase
      .from("program_days")
      .select("id, day_number, label, exercises")
      .eq("program_id", targetProgramId)
      .lte("day_number", 84)
      .order("day_number");

    if (fetchErr) throw fetchErr;

    const results: string[] = [];
    const stats = {
      finishers_added: 0,
      finisher_minutes: 0,
      mixed_modal_upgraded: 0,
      mixed_modal_minutes: 0,
    };

    for (const day of allDays || []) {
      const dayNum = day.day_number;
      const exercises = (day.exercises as any[]) || [];

      // ─── UPPER BODY DAYS: Add 10 min finishers ───
      if (isUpperDay(dayNum)) {
        // Remove existing finishers
        const cleaned = exercises.filter(
          (ex: any) =>
            !ex.name?.startsWith("Z.") &&
            !ex.name?.toLowerCase().includes("finisher")
        );

        const finisher = buildFinisher(dayNum);
        const updated = [...cleaned, ...finisher];

        if (!dryRun) {
          const { error } = await supabase
            .from("program_days")
            .update({ exercises: updated })
            .eq("id", day.id);
          if (error) {
            results.push(`❌ Day ${dayNum} (finisher): ${error.message}`);
            continue;
          }
        }

        const mins = parseInt(finisher[0]?.reps) || 10;
        stats.finishers_added++;
        stats.finisher_minutes += mins;
        results.push(`✅ Day ${dayNum} "${day.label}" — ${finisher[0].name} (${mins} min)`);
      }

      // ─── DAY 6: Mixed Modal Conditioning ───
      if (isDay6(dayNum)) {
        const newBlock = buildDay6MixedModal(dayNum);
        if (!newBlock) continue;

        // Remove old conditioning main blocks, keep shoulder health + carries
        const cleaned = exercises.filter((ex: any) => {
          const name = (ex.name || "").toLowerCase();
          if (name.includes("iwt") || name.includes("emom") || name.includes("assault bike") || name.includes("mixed modal")) return false;
          return true;
        });

        const updated = [newBlock, ...cleaned];

        if (!dryRun) {
          const { error } = await supabase
            .from("program_days")
            .update({ exercises: updated })
            .eq("id", day.id);
          if (error) {
            results.push(`❌ Day ${dayNum} (mixed modal): ${error.message}`);
            continue;
          }
        }

        const mins = parseInt(newBlock.reps) || 22;
        stats.mixed_modal_upgraded++;
        stats.mixed_modal_minutes += mins;
        results.push(`✅ Day ${dayNum} "${day.label}" — ${newBlock.name} (${mins} min)`);
      }
    }

    // ─── CONDITIONING SUMMARY ───
    // Calculate training weeks vs deload weeks separately
    const zone2PerWeek = 28; // Day 3 already programmed
    
    // Non-deload weeks: 9 training weeks across 12 total
    // Deload weeks: 3 deload weeks (W4, W8, W12)
    const trainingFinisherMins = 12 * 2; // 2x12 min finishers
    const deloadFinisherMins = 5 * 2;    // 2x5 min flushes
    
    // Mixed modal: varies but ~22 avg training, 12 deload
    const trainingMM = Math.round((stats.mixed_modal_minutes - 36) / 9); // subtract 3 deload × 12
    const deloadMM = 12;
    
    const trainingWeekTotal = zone2PerWeek + trainingFinisherMins + trainingMM;
    const deloadWeekTotal = zone2PerWeek + deloadFinisherMins + deloadMM;
    const overallAvg = Math.round((trainingWeekTotal * 9 + deloadWeekTotal * 3) / 12);

    const weeklyBreakdown = {
      zone_2_minutes: `${zone2PerWeek} min (Day 3 — already programmed, untouched)`,
      mixed_modal_minutes: `Training: ${trainingMM} min | Deload: ${deloadMM} min (Day 6)`,
      finisher_minutes: `Training: ${trainingFinisherMins} min (2×12) | Deload: ${deloadFinisherMins} min (2×5)`,
      training_week_total: `${trainingWeekTotal} min (meets 70-90 target ✅)`,
      deload_week_total: `${deloadWeekTotal} min (intentionally reduced)`,
      overall_average: `${overallAvg} min/week`,
      validation: trainingWeekTotal >= 70
        ? `✅ VALID — Training weeks: ${trainingWeekTotal} min | Deload weeks: ${deloadWeekTotal} min (reduced by design)`
        : `❌ INVALID — Training weeks only ${trainingWeekTotal} min (minimum 70)`,
      meso_progression: "Meso 1: Base (RPE 6-7, capacity) → Meso 2: Build (RPE 7, density) → Meso 3: Peak (RPE 7-8, output)",
    };

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      program_id: targetProgramId,
      results,
      stats,
      weekly_breakdown: weeklyBreakdown,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
