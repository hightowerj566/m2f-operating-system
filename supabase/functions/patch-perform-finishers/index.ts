import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

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

// ─── Day 5 Finishers (Phase 2+, non-deload) ───
function buildDay5Finisher(dayNum: number): any[] {
  const phase = getPhase(dayNum);
  const gw = getGlobalWeek(dayNum);
  const wm = getWeekInMeso(dayNum);

  if (phase === 1 || isDeload(dayNum)) return [];

  const grp = `FIN_W${gw}D5`;

  if (phase === 2) {
    // 6-8 min, RPE 6-7, aerobic-focused
    const finishers = [
      { name: "Bike Sprint Finisher", detail: "15s hard / 45s easy × 6 rounds. RPE 6-7, HR 150-165 BPM. Legs are pre-fatigued — match effort to recovery.", reps: "6 min" },
      { name: "Row Interval Finisher", detail: "200m moderate / 45s easy × 5 rounds. RPE 6-7, HR 150-165 BPM. Drive through the legs, keep the stroke smooth.", reps: "7 min" },
      { name: "Sled Push Finisher", detail: "20m moderate push / walk back × 6 rounds. RPE 6-7. Light load — this is conditioning, not strength.", reps: "6-8 min" },
      { name: "Bike Tempo Finisher", detail: "30s moderate / 30s easy × 8 rounds. RPE 6-7, HR 145-160 BPM. Consistent power output each round.", reps: "8 min" },
    ];
    const pick = finishers[(gw - 9 + wm) % finishers.length];
    return [
      e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
    ];
  } else {
    // Phase 3: 8-10 min, RPE 7, more demanding
    const finishers = [
      { name: "Bike Sprint Finisher", detail: "20s hard / 40s easy × 8 rounds. RPE 7, HR 160-175 BPM. Explosive first 5 pedal strokes, then hold.", reps: "8 min" },
      { name: "Row Repeats Finisher", detail: "250m @ strong effort / 60s rest × 4 rounds. RPE 7, HR 160-175 BPM. Aim for consistent split times.", reps: "8-10 min" },
      { name: "Ski Erg Finisher", detail: "30s hard / 30s easy × 8 rounds. RPE 7, HR 160-175 BPM. Full hip extension, aggressive arm pull.", reps: "8 min" },
      { name: "Mixed Finisher", detail: "1 min Bike + 1 min Row, alternating × 4 rounds. RPE 7, HR 160-175 BPM. No rest between transitions.", reps: "8 min" },
    ];
    const pick = finishers[(gw - 17 + wm) % finishers.length];
    return [
      e(`Z. ${pick.name}`, pick.detail, 1, pick.reps, null, null, "conditioning", grp, null),
    ];
  }
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

    // Day 5 = day_number % 7 === 5
    const day5Numbers = Array.from({ length: 24 }, (_, i) => (i * 7) + 5);

    const { data: allDays, error: fetchErr } = await supabase
      .from("program_days")
      .select("id, day_number, label, exercises")
      .eq("program_id", PROGRAM_ID)
      .in("day_number", day5Numbers)
      .order("day_number");

    if (fetchErr) throw fetchErr;

    for (const day of allDays || []) {
      const existingExercises = (day.exercises as any[]) || [];
      const finisher = buildDay5Finisher(day.day_number);

      if (finisher.length === 0) {
        results.push(`⏭️ Day ${day.day_number} — Phase 1 or deload, no finisher added`);
        continue;
      }

      // Remove any existing finishers (start with "Z.") and mindset/mission
      const cleaned = existingExercises.filter(
        (ex: any) =>
          !ex.name?.startsWith("Z.") &&
          ex.type !== "mindset" &&
          ex.type !== "mission"
      );

      const updated = [...cleaned, ...finisher];

      const { error: updateErr } = await supabase
        .from("program_days")
        .update({ exercises: updated })
        .eq("id", day.id);

      if (updateErr) {
        results.push(`❌ Day ${day.day_number}: ${updateErr.message}`);
      } else {
        results.push(`✅ Day ${day.day_number} (D5) — added ${finisher[0].name}`);
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
