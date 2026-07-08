import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "3f4527b4-57de-4902-91fa-b0cc429c7354";

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

// Position within 7-day week (1-7)
function getPos(dayNum: number): number {
  return ((dayNum - 1) % 7) + 1;
}

// ─── Day type identification ───
// 4-day pattern: [T, T, R, T, T, R, R] → positions 1,2,4,5 are training
// 
// Meso 1: Pos1=Squat(Lower), Pos2=Horizontal(Upper), Pos4=Hinge(Lower), Pos5=Vertical(Upper)
// Meso 2-3: Pos1=Horizontal(Upper), Pos2=Squat(Lower), Pos4=Vertical(Upper), Pos5=Hinge(Lower)

function isUpperDay(dayNum: number): boolean {
  const pos = getPos(dayNum);
  const meso = getMeso(dayNum);
  if (meso === 1) return pos === 2 || pos === 5;
  return pos === 1 || pos === 4;
}

function isLowerHypertrophyDay(dayNum: number): boolean {
  const pos = getPos(dayNum);
  const meso = getMeso(dayNum);
  // Second lower day = hypertrophy = gets mixed modal
  if (meso === 1) return pos === 4; // Hinge day
  return pos === 5; // Hinge day in M2-3
}

// ═══════════════════════════════════════════════════════════
// MICRO-CONDITIONING FINISHERS (Upper days, 8-10 min)
// ═══════════════════════════════════════════════════════════

function buildFinisher(dayNum: number): any[] {
  const meso = getMeso(dayNum);
  const wim = getWeekInMeso(dayNum);
  const pos = getPos(dayNum);

  if (isDeload(dayNum)) {
    return [
      e("Z. Finisher — Easy Bike Flush",
        "30s easy spin / 30s rest × 5 rounds. RPE 4-5. HR 120-140 BPM. Recovery flush — nasal breathing. Zero fatigue cost.",
        1, "5 min", null, null, "conditioning"),
    ];
  }

  // Determine if this is the first or second upper day of the week
  const isFirstUpper = (meso === 1 && pos === 2) || (meso > 1 && pos === 1);

  // ─── MESO 1: Base — RPE 6-7, build aerobic capacity ───
  if (meso === 1) {
    if (isFirstUpper) {
      const pool = [
        { name: "Z. Finisher — Bike Intervals", detail: "20s moderate / 40s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. Consistent watts — don't redline.", reps: "10 min" },
        { name: "Z. Finisher — Row Steady State", detail: "10 min continuous @ 24-26 s/m. RPE 6-7. HR 140-150 BPM. Hold split ±3 sec. Aerobic capacity builder.", reps: "10 min" },
        { name: "Z. Finisher — Battle Rope Intervals", detail: "20s alternating waves / 40s rest × 10 rounds. RPE 6-7. HR 140-155 BPM. Small amplitude, high frequency.", reps: "10 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    } else {
      const pool = [
        { name: "Z. Finisher — Sled Push", detail: "20m moderate push / walk back × 8 rounds. RPE 6-7. HR 140-155 BPM. Light load — stay tall, drive from hips.", reps: "10 min" },
        { name: "Z. Finisher — Bike Tempo", detail: "30s moderate / 30s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. Even effort — build engine.", reps: "10 min" },
        { name: "Z. Finisher — Rower Tempo", detail: "30s moderate / 30s easy × 10 rounds. RPE 6-7. HR 140-155 BPM. Smooth and rhythmic.", reps: "10 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    }
  }

  // ─── MESO 2: Build — RPE 7, increased density ───
  if (meso === 2) {
    if (isFirstUpper) {
      const pool = [
        { name: "Z. Finisher — Bike Sprint Intervals", detail: "25s hard / 35s easy × 10 rounds. RPE 7. HR 150-165 BPM. Explosive start, hold wattage.", reps: "10 min" },
        { name: "Z. Finisher — Row Repeats", detail: "250m strong / 50s rest × 5 rounds. RPE 7. HR 150-165 BPM. Consistent splits ±2 sec.", reps: "10 min" },
        { name: "Z. Finisher — Ski Erg Intervals", detail: "25s hard / 35s easy × 10 rounds. RPE 7. HR 150-165 BPM. Full hip hinge, aggressive pull.", reps: "10 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    } else {
      const pool = [
        { name: "Z. Finisher — Battle Rope Cascade", detail: "25s waves / 35s rest × 10 rounds. RPE 7. HR 150-165 BPM. Tight core, high frequency.", reps: "10 min" },
        { name: "Z. Finisher — Bike/Row Alternating", detail: "1 min Bike + 1 min Row × 5 rounds. RPE 7. HR 150-165 BPM. No rest between transitions.", reps: "10 min" },
        { name: "Z. Finisher — Sled Push Intervals", detail: "20m push / walk back × 10 rounds. RPE 7. HR 150-165 BPM. Heavier than Meso 1.", reps: "10 min" },
      ];
      return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
    }
  }

  // ─── MESO 3: Peak — RPE 7-8, peak intensity ───
  if (isFirstUpper) {
    const pool = [
      { name: "Z. Finisher — Bike Sprint", detail: "30s hard / 30s easy × 10 rounds. RPE 7-8. HR 155-170 BPM. Peak wattage, hold form.", reps: "10 min" },
      { name: "Z. Finisher — Row Repeats", detail: "300m strong / 60s rest × 4 rounds. RPE 7-8. HR 155-170 BPM. Sub-1:45/500m pace.", reps: "10 min" },
      { name: "Z. Finisher — Mixed Modal", detail: "1 min Bike + 1 min Ski Erg × 5 rounds. RPE 7-8. HR 155-170 BPM. Zero transition rest.", reps: "10 min" },
    ];
    return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
  } else {
    const pool = [
      { name: "Z. Finisher — Ski Erg Sprint", detail: "30s hard / 30s easy × 10 rounds. RPE 7-8. HR 155-170 BPM. Full hip extension, aggressive pull.", reps: "10 min" },
      { name: "Z. Finisher — Bike Descending", detail: "40s / 30s / 20s hard (30s rest between) × 4 rounds. RPE 7-8. HR 155-170 BPM. Each gets harder.", reps: "10 min" },
      { name: "Z. Finisher — Rower Pyramid", detail: "200m / 300m / 400m / 300m / 200m (45s rest). RPE 7-8. HR 155-170 BPM. Pace the 400m.", reps: "10 min" },
    ];
    return [e(pool[wim - 1].name, pool[wim - 1].detail, 1, pool[wim - 1].reps, null, null, "conditioning")];
  }
}

// ═══════════════════════════════════════════════════════════
// MIXED MODAL CONDITIONING (Lower Hypertrophy day, 15-20 min)
// Placed AFTER lower hypertrophy work.
// Structure: cyclical + upper + lower (moderate) + carry/core
// ═══════════════════════════════════════════════════════════

function buildMixedModal(dayNum: number): any | null {
  const meso = getMeso(dayNum);
  const wim = getWeekInMeso(dayNum);

  if (isDeload(dayNum)) {
    return e("Z. Mixed Modal — Recovery Circuit",
      "3 rounds @ easy pace: 200m Row (cyclical) + 8 Push-Ups (upper) + 8 Goblet Squats light (lower) + 20m Farmer Carry (carry). RPE 5-6. HR 125-140 BPM. 60s rest between rounds. Movement quality only. Total time: ~10 min.",
      1, "10 min", null, null, "conditioning");
  }

  // ─── MESO 1: Base — RPE 6-7, build capacity ───
  if (meso === 1) {
    const circuits = [
      {
        detail: "4 rounds for quality: 250m Row (cyclical) + 8 DB Push Press (upper push) + 10 Goblet Squats (lower) + 30m Farmer Carry (carry). RPE 6-7. HR 140-155 BPM. 45s rest between rounds. Pacing focus. Total time: ~18 min.",
        reps: "18 min",
      },
      {
        detail: "4 rounds for quality: 12 Cal Bike (cyclical) + 10 TRX Rows (upper pull) + 10 Box Step-Ups (lower) + 30s Suitcase Carry (core). RPE 6-7. HR 140-155 BPM. 45s rest between rounds. Total time: ~18 min.",
        reps: "18 min",
      },
      {
        detail: "5 rounds for quality: 200m Row (cyclical) + 8 DB Floor Press (upper push) + 8 KB Swings (lower/hinge) + 20m Overhead Carry (core). RPE 6-7. HR 140-155 BPM. 30s rest. Earn the conditioning. Total time: ~20 min.",
        reps: "20 min",
      },
    ];
    const pick = circuits[wim - 1];
    return e("Z. Mixed Modal — Base Circuit", pick.detail, 1, pick.reps, null, null, "conditioning");
  }

  // ─── MESO 2: Build — RPE 7, density focus ───
  if (meso === 2) {
    const circuits = [
      {
        detail: "EMOM 16 — Min 1: 12 Cal Bike (cyclical) | Min 2: 8 DB Push Press (upper push) | Min 3: 10 Goblet Squats (lower) | Min 4: 30m Farmer Carry (carry). RPE 7. HR 145-160 BPM. 4 rounds. Work 35-40s, rest 20-25s.",
        reps: "16 min",
      },
      {
        detail: "EMOM 20 — Min 1: 12 Cal Row (cyclical) | Min 2: 8 DB Rows (upper pull) | Min 3: 10 KB Front Squats (lower) | Min 4: 30m Sled Push light (locomotive). RPE 7. HR 145-160 BPM. 5 rounds. Density > intensity.",
        reps: "20 min",
      },
      {
        detail: "4 rounds, 45s rest: 300m Row (cyclical) + 10 Push-Ups (upper push) + 10 DB Walking Lunges (lower) + 40m Farmer Carry heavy (carry). RPE 7. HR 150-165 BPM. Track total time. Total time: ~18 min.",
        reps: "18 min",
      },
    ];
    const pick = circuits[wim - 1];
    return e("Z. Mixed Modal — Density Block", pick.detail, 1, pick.reps, null, null, "conditioning");
  }

  // ─── MESO 3: Peak — RPE 7-8, maintain duration, increase output ───
  const circuits = [
    {
      detail: "EMOM 20 — Min 1: 14 Cal Bike (cyclical) | Min 2: 8 DB Thrusters (upper + lower) | Min 3: 14 Cal Row (cyclical) | Min 4: 30m Heavy Farmer Carry (carry). RPE 7-8. HR 155-170 BPM. 5 rounds. Peak output — track everything.",
      reps: "20 min",
    },
    {
      detail: "5 rounds, 30s rest: 250m Row (cyclical) + 8 Push-Ups + 5 Burpee Step-Overs (upper/lower) + 10 KB Swings (power) + 20m Overhead Carry (core). RPE 7-8. HR 155-170 BPM. Track total time. Total time: ~20 min.",
      reps: "20 min",
    },
    {
      detail: "EMOM 16 — Min 1: 16 Cal Bike (cyclical) | Min 2: 6 Power Cleans 50% (upper pull/power) | Min 3: 10 Box Jumps (lower/reactive) | Min 4: 40m Farmer Carry heavy (carry). RPE 7-8. HR 160-175 BPM. 4 rounds. Peak week — max sustainable.",
      reps: "16 min",
    },
  ];
  const pick = circuits[wim - 1];
  return e("Z. Mixed Modal — Peak Output", pick.detail, 1, pick.reps, null, null, "conditioning");
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
      mixed_modal_added: 0,
      mixed_modal_minutes: 0,
    };

    for (const day of allDays || []) {
      const dayNum = day.day_number;
      const pos = getPos(dayNum);
      const exercises = (day.exercises as any[]) || [];

      // Skip rest days (pos 3, 6, 7)
      if (pos === 3 || pos === 6 || pos === 7) continue;

      // ─── UPPER DAYS: Add finishers ───
      if (isUpperDay(dayNum)) {
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

      // ─── LOWER HYPERTROPHY: Add mixed modal ───
      if (isLowerHypertrophyDay(dayNum)) {
        const cleaned = exercises.filter(
          (ex: any) =>
            !ex.name?.startsWith("Z.") &&
            !ex.name?.toLowerCase().includes("mixed modal") &&
            !ex.name?.toLowerCase().includes("finisher")
        );

        const mm = buildMixedModal(dayNum);
        if (!mm) continue;
        const updated = [...cleaned, mm];

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

        const mins = parseInt(mm.reps) || 18;
        stats.mixed_modal_added++;
        stats.mixed_modal_minutes += mins;
        results.push(`✅ Day ${dayNum} "${day.label}" — ${mm.name} (${mins} min)`);
      }
    }

    // ─── CONDITIONING SUMMARY ───
    const zone2 = 30; // On rest days — user's responsibility
    const trainingFinishers = 10 * 2; // 2×10 on training weeks
    const deloadFinishers = 5 * 2;    // 2×5 on deload weeks
    const trainingMM = Math.round((stats.mixed_modal_minutes - 30) / 9); // subtract 3 deload × 10
    const deloadMM = 10;

    const trainingTotal = zone2 + trainingFinishers + trainingMM;
    const deloadTotal = zone2 + deloadFinishers + deloadMM;

    const weeklyBreakdown = {
      zone_2: `${zone2} min (rest day / separate session — not programmed into training days)`,
      finishers: `Training: ${trainingFinishers} min (2×10) | Deload: ${deloadFinishers} min (2×5)`,
      mixed_modal: `Training: ${trainingMM} min (after lower hypertrophy) | Deload: ${deloadMM} min`,
      training_week_total: `${trainingTotal} min`,
      deload_week_total: `${deloadTotal} min (intentionally reduced)`,
      validation: trainingTotal >= 60
        ? `✅ VALID — Training weeks: ${trainingTotal} min | Deload: ${deloadTotal} min`
        : `❌ INVALID — only ${trainingTotal} min (minimum 60)`,
      placement: {
        day_1_or_2_upper: "Finisher (10 min)",
        day_2_or_1_lower_strength: "NO conditioning",
        day_4_or_5_upper: "Finisher (10 min)",
        day_4_or_5_lower_hypertrophy: "Mixed Modal (15-20 min)",
        rest_days: "Zone 2 (30 min — optional separate session)",
      },
      meso_progression: "Meso 1: Base (RPE 6-7) → Meso 2: Build (RPE 7) → Meso 3: Peak (RPE 7-8)",
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
