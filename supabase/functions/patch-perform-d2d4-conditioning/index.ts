import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

function getPhase(dayNum: number): 1 | 2 | 3 {
  if (dayNum <= 56) return 1;
  if (dayNum <= 112) return 2;
  return 3;
}

function getGlobalWeek(dayNum: number): number {
  return Math.ceil(dayNum / 7);
}

function getWeekInMeso(dayNum: number): number {
  const phase = getPhase(dayNum);
  const phaseStart = phase === 1 ? 1 : phase === 2 ? 57 : 113;
  const wip = Math.ceil((dayNum - phaseStart + 1) / 7);
  return ((wip - 1) % 4) + 1;
}

function isDeload(dayNum: number): boolean {
  return getWeekInMeso(dayNum) === 4;
}

function e(
  name: string, detail: string, sets: number, reps: string | null,
  rest: number | null, rir: string | null, type: string,
  group: string | null = null, superset_label: string | null = null
) {
  return { name, detail, sets, reps, rest, rir, type, group, superset_label };
}

// ─── Day 2 (Lower Strength) — Short Controlled Intervals ───
// Only in Phase 2+, non-deload. 6-8 min, RPE 6-7.
// Protects squat/deadlift recovery: moderate intensity, upper-body or low-impact modality.
function buildDay2Conditioning(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const gw = getGlobalWeek(dayNum);
  const wm = getWeekInMeso(dayNum);

  // Phase 1: No intervals on lower days — protect base-building
  if (phase === 1 || isDeload(dayNum)) return [];

  const grp = `COND_W${gw}D2`;

  if (phase === 2) {
    // 6-minute controlled intervals, RPE 6-7, bike/row only (no leg-taxing modalities)
    const options = [
      { name: "Bike Flush Intervals", detail: "20s moderate / 40s easy × 6 rounds. RPE 6-7, HR 140-155 BPM. Smooth cadence — flush the legs, don't fry them. This is recovery-focused conditioning.", reps: "6 min" },
      { name: "Row Easy Intervals", detail: "150m moderate / 45s easy × 5 rounds. RPE 6, HR 135-150 BPM. Light pulls, focus on rhythm. Your squat matters more than this row.", reps: "6 min" },
      { name: "Bike Tempo Cooldown", detail: "30s moderate / 30s easy × 6 rounds. RPE 6-7, HR 140-155 BPM. Consistent power, don't ramp. Think of this as active recovery.", reps: "6 min" },
    ];
    const pick = options[(gw + wm) % options.length];
    return [
      e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
    ];
  } else {
    // Phase 3: 6-8 min, slightly sharper, RPE 6-7 still
    const options = [
      { name: "Bike Sprint Flush", detail: "15s hard / 45s easy × 6-8 rounds. RPE 6-7, HR 150-165 BPM. Explosive first 3 pedals, then settle. Protect your legs for the next session.", reps: "6-8 min" },
      { name: "Row Repeats", detail: "200m @ controlled effort / 60s rest × 4 rounds. RPE 6-7, HR 150-165 BPM. Consistent split times — this is pacing practice, not a race.", reps: "7 min" },
      { name: "Ski Erg Intervals", detail: "20s moderate / 40s easy × 7 rounds. RPE 6-7, HR 150-165 BPM. Full hip extension, controlled arm pull. Low impact on legs.", reps: "7 min" },
    ];
    const pick = options[(gw + wm) % options.length];
    return [
      e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
    ];
  }
}

// ─── Day 4 (Upper Hypertrophy) — Zone 2 or Hybrid ───
// Phase 1: Zone 2 (15-20 min) to hit 2x/week requirement
// Phase 2: Zone 2 (15 min) or light hybrid
// Phase 3: Short hybrid circuit (10-12 min) — athletic transfer
function buildDay4Conditioning(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const gw = getGlobalWeek(dayNum);
  const wm = getWeekInMeso(dayNum);

  if (isDeload(dayNum)) {
    // Deload: Light 10-min Zone 2 walk
    return [
      e("Z. Zone 2 Walk", "10 min incline treadmill walk or easy bike. HR 120-135 BPM, RPE 4. Nasal breathing only. Active recovery.", 1, "10 min", null, null, "conditioning", `COND_W${gw}D4`, null),
    ];
  }

  const grp = `COND_W${gw}D4`;

  if (phase === 1) {
    // Zone 2: 15-20 min progression over mesocycle. Hits 2x/week with Day 3.
    const duration = 15 + (wm - 1) * 2; // 15, 17, 19 min
    const options = [
      { name: "Zone 2 Bike", detail: `${duration} min steady-state cycling. HR 125-145 BPM, RPE 4-5. Nasal breathing, conversational pace. Building your aerobic engine without touching recovery.` },
      { name: "Zone 2 Incline Walk", detail: `${duration} min incline treadmill walk (8-12% grade, 3.0-3.5 mph). HR 125-145 BPM, RPE 4-5. Nasal breathing only. This builds the foundation everything else sits on.` },
      { name: "Zone 2 Row", detail: `${duration} min easy rowing. HR 125-145 BPM, RPE 4-5. Stroke rate 18-22 spm. Smooth and relaxed — this is aerobic base work.` },
    ];
    const pick = options[(gw + wm) % options.length];
    return [
      e(`Z. ${pick.name}`, pick.detail, 1, `${duration} min`, null, null, "conditioning", grp, null),
    ];
  }

  if (phase === 2) {
    // Alternate: Zone 2 (15 min) and light hybrid (8-10 min)
    if (wm % 2 === 1) {
      // Zone 2 weeks
      return [
        e("Z. Zone 2 Bike", "15 min steady-state cycling. HR 125-145 BPM, RPE 4-5. Nasal breathing. Maintain aerobic base while intensity builds elsewhere.", 1, "15 min", null, null, "conditioning", grp, null),
      ];
    } else {
      // Light hybrid weeks
      const options = [
        { name: "Upper Body Circuit", detail: "3 rounds: 8 Med Ball Slams + 10 Push-Ups + 200m Row. RPE 6, HR 145-160 BPM. Rest 60s between rounds. Movement quality first.", reps: "8-10 min" },
        { name: "Carry + Core Circuit", detail: "3 rounds: 30m Farmer Carry + 10 KB Swings + 30s Plank. RPE 6, HR 140-155 BPM. Rest 60s between rounds. Controlled breathing throughout.", reps: "8-10 min" },
      ];
      const pick = options[(gw) % options.length];
      return [
        e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
      ];
    }
  }

  // Phase 3: Athletic hybrid conditioning (10-12 min)
  const options = [
    { name: "Athletic Transfer Circuit", detail: "3 rounds: 5 Box Jump + 8 Med Ball Slam + 200m Row. RPE 7, HR 155-170 BPM. Rest 60s between rounds. Explosive intent on every rep.", reps: "10-12 min" },
    { name: "Power Endurance Circuit", detail: "3 rounds: 6 KB Clean & Press + 30m Sled Push (light) + 10 Push-Ups. RPE 7, HR 155-170 BPM. Rest 60s. Transfer your strength to real-world output.", reps: "10-12 min" },
    { name: "Carry + Sprint Circuit", detail: "4 rounds: 30m Farmer Carry + 30m Sprint (70%) + 8 Med Ball Chest Pass. RPE 7, HR 155-170 BPM. Rest 90s. Athletic movement under controlled fatigue.", reps: "10-12 min" },
  ];
  const pick = options[(gw + wm) % options.length];
  return [
    e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
  ];
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

    // Get Day 2 and Day 4 positions (pos 2 and pos 4 in 7-day cycle)
    const targetDayNumbers: number[] = [];
    for (let i = 0; i < 24; i++) {
      targetDayNumbers.push(i * 7 + 2); // Day 2
      targetDayNumbers.push(i * 7 + 4); // Day 4
    }

    const { data: allDays, error: fetchErr } = await supabase
      .from("program_days")
      .select("id, day_number, label, exercises")
      .eq("program_id", PROGRAM_ID)
      .in("day_number", targetDayNumbers)
      .order("day_number");

    if (fetchErr) throw fetchErr;

    for (const day of allDays || []) {
      const pos = ((day.day_number - 1) % 7) + 1;
      const existingExercises = (day.exercises as any[]) || [];

      let conditioning: any[];
      if (pos === 2) {
        conditioning = buildDay2Conditioning(day.day_number);
      } else {
        conditioning = buildDay4Conditioning(day.day_number);
      }

      if (conditioning.length === 0) {
        results.push(`⏭️ Day ${day.day_number} (D${pos}) — No conditioning needed (Phase 1 lower or deload)`);
        continue;
      }

      // Remove any existing conditioning (Z. prefix) and mindset/mission (preserve those)
      const cleaned = existingExercises.filter(
        (ex: any) => !ex.name?.startsWith("Z.")
      );

      const updated = [...cleaned, ...conditioning];

      const { error: updateErr } = await supabase
        .from("program_days")
        .update({ exercises: updated })
        .eq("id", day.id);

      if (updateErr) {
        results.push(`❌ Day ${day.day_number} (D${pos}): ${updateErr.message}`);
      } else {
        results.push(`✅ Day ${day.day_number} (D${pos}) — added ${conditioning[0].name}`);
      }
    }

    // Build weekly summary
    const summary = {
      phase_1: {
        zone_2: "2x/week (Day 3 + Day 4)",
        intervals: "None on lower days — protect base-building",
        hybrid: "Day 6 only",
        total: "3 conditioning sessions/week"
      },
      phase_2: {
        zone_2: "1-2x/week (Day 3 + alternating Day 4)",
        intervals: "Day 2 (6 min flush) + Day 3 (short) + Day 5 (finisher) = 2-3x/week",
        hybrid: "Day 4 (alternating) + Day 6",
        total: "4-5 conditioning sessions/week"
      },
      phase_3: {
        zone_2: "1x/week (Day 3)",
        intervals: "Day 2 (6-8 min) + Day 5 (8-10 min) = 2x/week",
        hybrid: "Day 4 (10-12 min athletic) + Day 6 = 2x/week",
        total: "5 conditioning sessions/week"
      }
    };

    return new Response(JSON.stringify({ success: true, results, weekly_summary: summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
