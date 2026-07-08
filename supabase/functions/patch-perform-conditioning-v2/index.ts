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

function getPhase(dayNum: number): 1 | 2 | 3 {
  if (dayNum <= 56) return 1;
  if (dayNum <= 112) return 2;
  return 3;
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

function getGlobalWeek(dayNum: number): number {
  return Math.ceil(dayNum / 7);
}

// ═══════════════════════════════════════════════════════════════
// DAY 1 — Upper Strength: Zone 2 (15–20 min, RPE 4-5)
// ═══════════════════════════════════════════════════════════════
function buildDay1Zone2(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const wm = getWeekInMeso(dayNum);
  const gw = getGlobalWeek(dayNum);
  if (isDeload(dayNum)) return [];

  const baseMin = phase === 1 ? 15 : phase === 2 ? 18 : 15;
  const duration = baseMin + (wm - 1) * 2;

  const modalities = [
    "Incline Walk (10-12% grade, 3.2-3.5 mph)",
    "Stationary Bike (easy cadence, 70-80 RPM)",
    "Elliptical (low resistance, smooth stride)",
  ];
  return [
    e("Z. Zone 2 Cardio", `${modalities[(gw - 1) % modalities.length]} — HR 125-140 BPM, RPE 4-5. Nasal breathing only. Recovery work — if you can't breathe through your nose, slow down.`, 1, `${duration} min`, null, null, "conditioning", null, null),
  ];
}

// ═══════════════════════════════════════════════════════════════
// DAY 3 — Conditioning Day: Zone 2 + Primary Intervals
// ═══════════════════════════════════════════════════════════════
function buildDay3(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const wm = getWeekInMeso(dayNum);
  const gw = getGlobalWeek(dayNum);
  const deload = isDeload(dayNum);
  const exercises: any[] = [];

  // Zone 2 base
  const z2Base = phase === 1 ? 20 : phase === 2 ? 22 : 20;
  const z2Duration = deload ? Math.round(z2Base * 0.7) : z2Base + (wm - 1) * 3;
  const z2Mods = ["Bike, Incline Walk, or Elliptical", "Row, Bike, or Incline Walk", "Incline Walk, Elliptical, or Row"];
  exercises.push(
    e("A1. Zone 2 Cardio", `${z2Mods[(gw - 1) % z2Mods.length]} — HR 120-140 BPM, RPE 5-6. Nasal breathing preferred. ${deload ? "Deload: easy effort only." : "Steady conversational pace."}`, 1, `${z2Duration} min`, null, null, "conditioning", null, null)
  );

  if (!deload) {
    const intervals: Record<number, any[]> = {
      1: [
        { name: "Bike Intervals", detail: "30s moderate / 60s easy × 5-6 rounds. RPE 7, HR 150-165 BPM. Build rhythm — don't sprint.", reps: "6-8 min" },
        { name: "Row Intervals", detail: "200m moderate / 45s easy × 4-5 rounds. RPE 7, HR 150-165 BPM. Drive through legs.", reps: "6-8 min" },
        { name: "Ski Erg Intervals", detail: "30s work / 60s easy × 5-6 rounds. RPE 7, HR 150-165 BPM. Full hip hinge each pull.", reps: "6-8 min" },
      ],
      2: [
        { name: "Bike Intervals", detail: "30s hard / 30s easy × 8-10 rounds. RPE 7-8, HR 155-170 BPM. Consistent power each round.", reps: "8-10 min" },
        { name: "Row Repeats", detail: "250m @ strong effort / 60s rest × 5-6 rounds. RPE 7-8, HR 155-170 BPM. Hold consistent split.", reps: "8-10 min" },
        { name: "Assault Bike Intervals", detail: "20s all-out / 40s easy × 8-10 rounds. RPE 7-8, HR 160-175 BPM. Full body drive.", reps: "8-10 min" },
      ],
      3: [
        { name: "Bike Sprint Intervals", detail: "20s max effort / 40s recovery × 10-12 rounds. RPE 8, HR 165-180 BPM. Explosive start each interval.", reps: "10-12 min" },
        { name: "Row Sprint Repeats", detail: "200m sprint / 60s rest × 6-8 rounds. RPE 8, HR 165-180 BPM. Attack the drive.", reps: "10-12 min" },
        { name: "Mixed Intervals", detail: "30s Bike + 30s Row alternating, 40s rest × 6-8 rounds. RPE 8, HR 165-180 BPM.", reps: "10-12 min" },
      ],
    };
    const pool = intervals[phase];
    const offset = phase === 1 ? 0 : phase === 2 ? 8 : 16;
    const pick = pool[(gw - 1 - offset) % pool.length];
    exercises.push(e(`A2. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", null, null));
  }

  return exercises;
}

// ═══════════════════════════════════════════════════════════════
// DAY 4 — Upper Hypertrophy: Interval Finisher (6–10 min)
// ═══════════════════════════════════════════════════════════════
function buildDay4Intervals(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const gw = getGlobalWeek(dayNum);
  if (isDeload(dayNum)) return [];

  const pools: Record<number, any[]> = {
    1: [
      { name: "Bike Finisher", detail: "30s moderate / 30s easy × 6 rounds. RPE 7, HR 150-160 BPM.", reps: "6 min" },
      { name: "Row Finisher", detail: "150m moderate / 30s easy × 5 rounds. RPE 7, HR 150-160 BPM.", reps: "6 min" },
    ],
    2: [
      { name: "Bike Intervals", detail: "30s hard / 30s easy × 8 rounds. RPE 7-8, HR 155-170 BPM.", reps: "8 min" },
      { name: "Row Intervals", detail: "200m controlled / 45s rest × 5-6 rounds. RPE 7-8, HR 155-170 BPM.", reps: "8 min" },
      { name: "Sled Push Intervals", detail: "20m moderate push / walk back × 6-8 rounds. RPE 7-8.", reps: "8 min" },
    ],
    3: [
      { name: "Assault Bike Intervals", detail: "20s sprint / 40s easy × 8-10 rounds. RPE 8, HR 160-175 BPM.", reps: "8-10 min" },
      { name: "KB Swing EMOM", detail: "EMOM × 8-10 min: 12 KB Swings (mod-heavy). RPE 8. Rest remainder.", reps: "8-10 min" },
      { name: "Row Sprint Finisher", detail: "150m sprint / 45s rest × 6-8 rounds. RPE 8, HR 165-175 BPM.", reps: "8-10 min" },
    ],
  };
  const pool = pools[phase];
  const offset = phase === 1 ? 0 : phase === 2 ? 8 : 16;
  const pick = pool[(gw - 1 - offset) % pool.length];
  return [e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", null, null)];
}

// ═══════════════════════════════════════════════════════════════
// DAY 6 — Saturday: Hybrid Conditioning (20–32 min)
// ═══════════════════════════════════════════════════════════════
function buildDay6(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const wm = getWeekInMeso(dayNum);
  const gw = getGlobalWeek(dayNum);
  const deload = isDeload(dayNum);
  const exercises: any[] = [];

  const warmups = [
    "2 rounds: 10 Jumping Jacks + 5 Inchworms + 10 BW Squats + 5 Push-Ups.",
    "2 rounds: 10 Lateral Shuffles each + 5 World's Greatest Stretch each + 10 Glute Bridges.",
    "2 rounds: 200m Easy Jog + 10 Leg Swings each + 5 Broad Jumps (soft landing).",
  ];
  exercises.push(e("Movement Prep", warmups[(gw - 1) % warmups.length], 1, "5 min", null, null, "warmup", null, null));

  if (deload) {
    exercises.push(e("Easy Movement Flow", "15 min mixed low-intensity: Walk + Light KB Swings + Easy Bike. RPE 4-5, HR 120-140 BPM.", 1, "15 min", null, null, "conditioning", null, null));
    exercises.push(e("Coaching Note", "Deload — active recovery. No scoring. Conversational pace.", 1, null, null, null, "note", null, null));
    return exercises;
  }

  const durBase = phase === 1 ? 20 : 24;
  const duration = durBase + (wm - 1) * 4;

  if (phase === 3) {
    exercises.push(e("Athletic Primer", "4 min: 2 × (10m lateral shuffle each + 10m high knees + 10m backpedal + 2 broad jumps). Smooth and athletic.", 1, "4 min", null, null, "conditioning", null, null));
  }

  const circuits: Record<number, string[]> = {
    1: [
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 12/10 Cal Bike\n• 10 KB Swings (light-mod)\n• 10/8 Cal Row\n• 8 Air Squats + 8 Push-Ups\nRPE 6-7, HR 140-155 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 200m Row\n• 8 Goblet Squats + 8 Ring Rows\n• 12/10 Cal Bike\n• 30s Farmer Carry + 30s Plank\nRPE 6-7, HR 140-155 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 10/8 Cal Ski Erg\n• 12 DB Deadlifts (mod)\n• 12/10 Cal Bike\n• 10 Push-Ups + 20 Mountain Climbers\nRPE 6-7, HR 140-155 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 15/12 Cal Bike\n• 10 KB Goblet Squats + 5 Burpees (no push-up)\n• 200m Row\n• 40m Suitcase Carry (each hand)\nRPE 6-7, HR 140-155 BPM.`,
    ],
    2: [
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 15/12 Cal Row\n• 8 DB Thrusters (mod)\n• 12/10 Cal Bike\n• 8 Pull-Ups + 40m Farmer Carry\nRPE 6-7, HR 145-160 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 200m Row\n• 6 Hang Cleans (40-50%) + 6 Front Squats\n• 14/11 Cal Bike\n• 40m Sled Push (mod)\nRPE 6-7, HR 145-160 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 12/10 Cal Ski Erg\n• 10 DB Snatches (alt)\n• 15/12 Cal Bike\n• 8 Med Ball Slams + 20m Bear Crawl\nRPE 6-7, HR 145-160 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 250m Row\n• 10 KB Swings + 5 Box Jumps (step down)\n• 12/10 Cal Bike\n• 40m Farmer Carry (heavy) + 30s Dead Bug\nRPE 6-7, HR 145-160 BPM.`,
    ],
    3: [
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 15/12 Cal Row (strong)\n• 5 Power Cleans (50-55%) + 5 Box Jumps (step down)\n• 14/11 Cal Bike\n• 40m Farmer Carry (heavy) + 10 V-Ups\nRPE 7, HR 155-170 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 250m Row (strong pull)\n• 8 DB Thrusters (mod-heavy) + 6 Burpees\n• 15/12 Cal Bike\n• 40m Sled Push + 10 Med Ball Slams\nRPE 7, HR 155-170 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 12/10 Cal Ski Erg\n• 8 Hang Cleans (50-55%) + 8 Front Rack Lunges\n• 14/11 Cal Bike\n• 10 Burpee Box Jumps (step down) + 30s Plank\nRPE 7, HR 155-170 BPM.`,
      `Every 4 min × ${Math.floor(duration / 4)} rounds:\n• 200m Row + 100m Run\n• 6 DB Snatches each arm + 8 Box Jumps (step down)\n• 15/12 Cal Bike\n• 40m Farmer Carry (heavy) + 10 Push-Ups\nRPE 7, HR 155-170 BPM.`,
    ],
  };
  const pool = circuits[phase];
  const offset = phase === 1 ? 0 : phase === 2 ? 8 : 16;
  const label = phase === 3 ? "Performance Circuit" : "Hybrid Circuit";
  exercises.push(e(`${label}: ${duration} min`, pool[(gw - 1 - offset) % pool.length], Math.floor(duration / 4), `${duration} min`, null, null, "conditioning", null, null));

  const summaries: Record<number, string> = {
    1: "Weekly Conditioning: Intervals ×2 (D3 + D4) + Zone 2 ×1 (D1) + Hybrid ×1 (D6). Lower days: ZERO. ~55-70 min total.",
    2: "Weekly Conditioning: Intervals ×2 (D3 + D4) + Zone 2 ×1 (D1) + Hybrid ×1 (D6). Lower days: ZERO. ~60-80 min total.",
    3: "Weekly Conditioning: Intervals ×2 (D3 + D4) + Zone 2 ×1 (D1) + Hybrid ×1 (D6). Lower days: ZERO. ~60-80 min total.",
  };
  exercises.push(e("Weekly Summary", summaries[phase], 1, null, null, null, "note", null, null));

  return exercises;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const results: string[] = [];

    const targetDays: number[] = [];
    for (let d = 1; d <= 168; d++) {
      const diw = d % 7;
      if ([1, 2, 3, 4, 5, 6].includes(diw)) targetDays.push(d);
    }

    const allDays: any[] = [];
    for (let i = 0; i < targetDays.length; i += 50) {
      const batch = targetDays.slice(i, i + 50);
      const { data, error } = await supabase.from("program_days").select("id, day_number, label, exercises").eq("program_id", PROGRAM_ID).in("day_number", batch).order("day_number");
      if (error) throw error;
      if (data) allDays.push(...data);
    }

    const stripCond = (exs: any[]) => exs.filter((x: any) => x.type !== "conditioning");
    const stripNotes = (exs: any[]) => exs.filter((x: any) => !(x.type === "note" && ["Coaching Note", "Weekly Summary"].includes(x.name)));

    for (const day of allDays) {
      const diw = day.day_number % 7;
      const existing = (day.exercises as any[]) || [];
      const phase = getPhase(day.day_number);
      const deload = isDeload(day.day_number);
      const gw = getGlobalWeek(day.day_number);

      if (diw === 1) {
        const cleaned = stripCond(stripNotes(existing));
        const z2 = buildDay1Zone2(day.day_number);
        const { error } = await supabase.from("program_days").update({ exercises: [...cleaned, ...z2] }).eq("id", day.id);
        results.push(error ? `❌ D${day.day_number}(D1): ${error.message}` : `✅ D${day.day_number}(D1) Zone 2 ${z2.length ? "added" : "skip(deload)"}`);

      } else if (diw === 2 || diw === 5) {
        const cleaned = stripCond(stripNotes(existing));
        if (cleaned.length !== existing.length) {
          const { error } = await supabase.from("program_days").update({ exercises: cleaned }).eq("id", day.id);
          results.push(error ? `❌ D${day.day_number}(D${diw}): ${error.message}` : `🗑️ D${day.day_number}(D${diw}) stripped ${existing.length - cleaned.length} conditioning`);
        } else {
          results.push(`⬜ D${day.day_number}(D${diw}) clean`);
        }

      } else if (diw === 3) {
        const coreArms = existing.filter((x: any) => x.type !== "conditioning" && x.type !== "note");
        const newCond = buildDay3(day.day_number);
        const { error } = await supabase.from("program_days").update({ exercises: [...newCond, ...coreArms] }).eq("id", day.id);
        results.push(error ? `❌ D${day.day_number}(D3): ${error.message}` : `✅ D${day.day_number}(D3) ${newCond.length} blocks`);

      } else if (diw === 4) {
        const cleaned = stripCond(stripNotes(existing));
        const intervals = buildDay4Intervals(day.day_number);
        const { error } = await supabase.from("program_days").update({ exercises: [...cleaned, ...intervals] }).eq("id", day.id);
        results.push(error ? `❌ D${day.day_number}(D4): ${error.message}` : `✅ D${day.day_number}(D4) intervals ${intervals.length ? "added" : "skip(deload)"}`);

      } else if (diw === 6) {
        const newEx = buildDay6(day.day_number);
        const phaseNames: Record<number, string> = { 1: "Foundation", 2: "Build", 3: "Performance" };
        const newLabel = deload ? "Day 6 — Active Recovery [DELOAD]" : `Day 6 — ${phaseNames[phase]} Hybrid Conditioning`;
        const { error } = await supabase.from("program_days").update({ exercises: newEx, label: newLabel }).eq("id", day.id);
        results.push(error ? `❌ D${day.day_number}(D6): ${error.message}` : `✅ D${day.day_number}(D6) Wk${gw} P${phase}${deload ? " [DELOAD]" : ""}`);
      }
    }

    const stripped = results.filter(r => r.includes("🗑️")).length;
    const updated = results.filter(r => r.includes("✅")).length;

    return new Response(JSON.stringify({
      success: true,
      summary: { total: allDays.length, stripped_lower_days: stripped, updated },
      weekly_structure: {
        "D1 (Upper Strength)": "Zone 2 (15-20 min, RPE 4-5)",
        "D2 (Lower Strength)": "ZERO conditioning",
        "D3 (Conditioning)": "Zone 2 + Intervals (6-12 min, RPE 7-8)",
        "D4 (Upper Hypertrophy)": "Intervals (6-10 min, RPE 7-8)",
        "D5 (Lower Hypertrophy)": "ZERO conditioning",
        "D6 (Saturday)": "Hybrid (20-32 min, RPE 6-7)",
      },
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
