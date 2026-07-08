import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Volume contribution model: primary=1, secondary=0.5, isolation=1
interface MuscleHit { muscle: string; contribution: number; }

function classifyExercise(name: string, detail: string): MuscleHit[] {
  const n = name.toLowerCase().replace(/^[a-z]\d+\.\s*/i, "");
  const hits: MuscleHit[] = [];

  // ── CHEST ──
  if (n.includes("bench press") || n.includes("db press") || n.includes("dumbbell press")) {
    if (n.includes("incline")) hits.push({ muscle: "Chest (Upper)", contribution: 1 });
    else if (n.includes("close grip") || n.includes("cg")) hits.push({ muscle: "Chest", contribution: 0.5 });
    else hits.push({ muscle: "Chest", contribution: 1 });
    hits.push({ muscle: "Triceps", contribution: 0.5 });
    hits.push({ muscle: "Front Delt", contribution: 0.5 });
  }
  if (n.includes("push-up") || n.includes("pushup") || n.includes("push up")) {
    hits.push({ muscle: "Chest", contribution: 0.5 });
    hits.push({ muscle: "Triceps", contribution: 0.5 });
  }
  if (n.includes("fly") || n.includes("flye") || n.includes("pec deck")) {
    hits.push({ muscle: "Chest", contribution: 1 });
  }
  if (n.includes("dip")) {
    hits.push({ muscle: "Chest", contribution: 0.5 });
    hits.push({ muscle: "Triceps", contribution: 1 });
  }

  // ── BACK ──
  if (n.includes("row") && !n.includes("upright")) {
    hits.push({ muscle: "Back", contribution: 1 });
    hits.push({ muscle: "Biceps", contribution: 0.5 });
    if (n.includes("meadows") || n.includes("single") || n.includes("1-arm") || n.includes("one-arm"))
      hits.push({ muscle: "Rear Delt", contribution: 0.5 });
  }
  if (n.includes("pull-up") || n.includes("pullup") || n.includes("chin-up") || n.includes("chinup") || n.includes("chin up") || n.includes("pull up")) {
    hits.push({ muscle: "Back", contribution: 1 });
    hits.push({ muscle: "Biceps", contribution: 0.5 });
  }
  if (n.includes("lat pull") || n.includes("pulldown")) {
    hits.push({ muscle: "Back", contribution: 1 });
    hits.push({ muscle: "Biceps", contribution: 0.5 });
  }

  // ── SHOULDERS ──
  if ((n.includes("ohp") || n.includes("overhead press") || n.includes("military press") || n.includes("push press") || n.includes("landmine press")) && !n.includes("bench")) {
    hits.push({ muscle: "Front Delt", contribution: 1 });
    hits.push({ muscle: "Triceps", contribution: 0.5 });
  }
  if (n.includes("lateral raise") || n.includes("lat raise")) {
    hits.push({ muscle: "Lateral Delt", contribution: 1 });
  }
  if (n.includes("upright row")) {
    hits.push({ muscle: "Lateral Delt", contribution: 1 });
    hits.push({ muscle: "Front Delt", contribution: 0.5 });
  }
  if (n.includes("face pull")) {
    hits.push({ muscle: "Rear Delt", contribution: 1 });
    hits.push({ muscle: "Shoulder Health", contribution: 1 });
  }
  if (n.includes("reverse fly") || n.includes("reverse pec") || n.includes("rear delt fly")) {
    hits.push({ muscle: "Rear Delt", contribution: 1 });
  }
  if (n.includes("external rotation") || n.includes("ext rotation") || n.includes("prone y") || n.includes("prone t") || n.includes("prone i") || n.includes("y raise") || n.includes("scarecrow") || n.includes("powell") || n.includes("band pull-apart") || n.includes("band pull apart")) {
    hits.push({ muscle: "Shoulder Health", contribution: 1 });
    if (n.includes("prone y") || n.includes("band pull")) hits.push({ muscle: "Rear Delt", contribution: 0.5 });
  }

  // ── QUADS ──
  if (n.includes("squat") || n.includes("leg press")) {
    hits.push({ muscle: "Quads", contribution: 1 });
    hits.push({ muscle: "Glutes", contribution: 0.5 });
  }
  if (n.includes("lunge") || n.includes("split squat") || n.includes("step-up") || n.includes("step up")) {
    hits.push({ muscle: "Quads", contribution: 1 });
    hits.push({ muscle: "Glutes", contribution: 0.5 });
  }
  if (n.includes("leg extension") || n.includes("leg ext")) {
    hits.push({ muscle: "Quads", contribution: 1 });
  }

  // ── HAMSTRINGS / GLUTES ──
  if (n.includes("deadlift") || n.includes("rdl") || n.includes("romanian")) {
    hits.push({ muscle: "Hamstrings", contribution: 1 });
    hits.push({ muscle: "Glutes", contribution: 1 });
    hits.push({ muscle: "Back", contribution: 0.5 });
  }
  if (n.includes("hip thrust") || n.includes("glute bridge")) {
    hits.push({ muscle: "Glutes", contribution: 1 });
    hits.push({ muscle: "Hamstrings", contribution: 0.5 });
  }
  if (n.includes("leg curl") || n.includes("hamstring curl") || n.includes("nordic")) {
    hits.push({ muscle: "Hamstrings", contribution: 1 });
  }
  if (n.includes("good morning") || n.includes("back extension") || n.includes("45 degree") || n.includes("hyperextension")) {
    hits.push({ muscle: "Hamstrings", contribution: 0.5 });
    hits.push({ muscle: "Glutes", contribution: 0.5 });
  }

  // ── ARMS ──
  if (n.includes("curl") && !n.includes("leg curl") && !n.includes("hamstring")) {
    hits.push({ muscle: "Biceps", contribution: 1 });
  }
  if (n.includes("tricep") || n.includes("skull crush") || n.includes("pushdown") || n.includes("push down") || n.includes("overhead extension") || n.includes("french press")) {
    hits.push({ muscle: "Triceps", contribution: 1 });
  }

  // ── CALVES ──
  if (n.includes("calf") || n.includes("calves")) {
    hits.push({ muscle: "Calves", contribution: 1 });
  }

  // ── CORE ──
  if (n.includes("ab ") || n.includes("plank") || n.includes("pallof") || n.includes("woodchop") || n.includes("dead bug") || n.includes("rollout") || n.includes("crunch") || n.includes("leg raise") || n.includes("hanging knee") || n.includes("hanging leg") || n.includes("sit-up") || n.includes("sit up") || n.includes("anti-") || n.includes("copenhagen") || n.includes("cable chop") || n.includes("rotation") && n.includes("core")) {
    hits.push({ muscle: "Core", contribution: 1 });
  }

  // ── CARRY / FARMER ──
  if (n.includes("carry") || n.includes("farmer") || n.includes("suitcase")) {
    hits.push({ muscle: "Core", contribution: 0.5 });
    hits.push({ muscle: "Grip/Forearms", contribution: 1 });
  }

  return hits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    // Evidence-based weekly volume targets (sets)
    const TARGETS: Record<string, [number, number]> = {
      "Chest": [10, 20],
      "Back": [10, 20],
      "Quads": [10, 18],
      "Hamstrings": [8, 16],
      "Glutes": [6, 14],
      "Front Delt": [6, 12],
      "Lateral Delt": [10, 20],
      "Rear Delt": [8, 16],
      "Biceps": [8, 14],
      "Triceps": [8, 14],
      "Calves": [8, 16],
      "Core": [6, 12],
      "Shoulder Health": [6, 12],
    };

    // Audit per week (group by 7-day blocks)
    const totalWeeks = Math.ceil(allDays!.length / 7);
    const weeklyAudits: Record<number, Record<string, number>> = {};
    const weeklyExerciseCounts: Record<number, Record<number, number>> = {};

    for (const day of allDays!) {
      const week = Math.ceil(day.day_number / 7);
      const dow = ((day.day_number - 1) % 7) + 1;
      if (!weeklyAudits[week]) weeklyAudits[week] = {};
      if (!weeklyExerciseCounts[week]) weeklyExerciseCounts[week] = {};

      const exercises = day.exercises as any[];
      const exerciseCount = exercises.filter((e: any) => e.type === "exercise").length;
      weeklyExerciseCounts[week][dow] = exerciseCount;

      for (const ex of exercises) {
        if (ex.type !== "exercise") continue;
        const sets = ex.sets || 3;
        const hits = classifyExercise(ex.name || "", ex.detail || "");
        for (const hit of hits) {
          weeklyAudits[week][hit.muscle] = (weeklyAudits[week][hit.muscle] || 0) + (sets * hit.contribution);
        }
      }
    }

    // Aggregate across all weeks for averages, and find gaps
    const muscleAvgs: Record<string, number> = {};
    const muscleWeeklyData: Record<string, number[]> = {};

    for (const muscle of Object.keys(TARGETS)) {
      muscleWeeklyData[muscle] = [];
      for (let w = 1; w <= totalWeeks; w++) {
        const val = weeklyAudits[w]?.[muscle] || 0;
        muscleWeeklyData[muscle].push(Math.round(val * 10) / 10);
      }
      const sum = muscleWeeklyData[muscle].reduce((a, b) => a + b, 0);
      muscleAvgs[muscle] = Math.round((sum / totalWeeks) * 10) / 10;
    }

    // Identify gaps
    const gaps: { muscle: string; avg: number; target: [number, number]; status: string }[] = [];
    for (const [muscle, [low, high]] of Object.entries(TARGETS)) {
      const avg = muscleAvgs[muscle];
      let status = "✅ OK";
      if (avg < low) status = "🔴 UNDER";
      else if (avg > high) status = "🟡 OVER";
      gaps.push({ muscle, avg, target: [low, high], status });
    }

    // Session exercise counts
    const sessionCounts: Record<number, { avg: number; max: number }> = {};
    for (let d = 1; d <= 5; d++) {
      const counts: number[] = [];
      for (let w = 1; w <= totalWeeks; w++) {
        if (weeklyExerciseCounts[w]?.[d] !== undefined) {
          counts.push(weeklyExerciseCounts[w][d]);
        }
      }
      if (counts.length > 0) {
        sessionCounts[d] = {
          avg: Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10,
          max: Math.max(...counts),
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_weeks: totalWeeks,
        volume_summary: gaps,
        session_exercise_counts: sessionCounts,
        weekly_detail_sample: {
          week1: weeklyAudits[1],
          week5: weeklyAudits[5],
          week13: weeklyAudits[13],
          week19: weeklyAudits[19],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[AUDIT-VOLUME] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
