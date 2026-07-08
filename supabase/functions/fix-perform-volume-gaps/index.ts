import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1;
      const week = Math.ceil(day.day_number / 7);
      const isDeload = ((week - 1) % 4 + 1) === 4;
      let modified = false;
      let exercises = [...(day.exercises as any[])];

      // ── FIX 1: Add Lateral Raise to D4 (Upper Hypertrophy) ──
      // This is where lateral delts belong — shoulder-focused day
      // Add as last accessory before any conditioning/cooldown
      if (dow === 4) {
        const hasLatRaise = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("lateral raise")
        );
        if (!hasLatRaise) {
          // Find insertion point: before conditioning or at end of exercises
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (exercises[i].type === "conditioning" || exercises[i].type === "cooldown" || exercises[i].type === "mindset" || exercises[i].type === "dad_mission") {
              insertIdx = i;
            }
          }
          const latRaise = {
            name: "DB Lateral Raise",
            detail: "Controlled tempo, slight lean forward",
            sets: isDeload ? 2 : 3,
            reps: "12-15",
            rest: 60,
            rir: isDeload ? 4 : 2,
            type: "exercise",
            group: null,
            superset_label: null,
          };
          exercises.splice(insertIdx, 0, latRaise);
          modified = true;
          fixes.push(`Day ${day.day_number} (D4): ADDED DB Lateral Raise ${isDeload ? 2 : 3}×12-15`);
        }
      }

      // ── FIX 2: Bump Face Pull sets (+1, cap 4) for Rear Delt + Shoulder Health ──
      exercises = exercises.map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name = (ex.name || "").toLowerCase();
        
        if (name.includes("face pull")) {
          const current = ex.sets || 3;
          const target = Math.min(current + 1, 4);
          if (target !== current) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${ex.name}: ${current}→${target} sets`);
            return { ...ex, sets: target };
          }
        }
        return ex;
      });

      // ── FIX 3: Bump Chest press sets on D1 (+1 set on primary bench, cap 5) ──
      // Chest is at 8.3 avg, needs ~10+
      if (dow === 1) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          // Target the primary bench press (B1 group)
          if ((name.includes("bench press") || name.includes("db press")) && 
              ex.group && ex.group.match(/^B/)) {
            const current = ex.sets || 4;
            const target = Math.min(current + 1, isDeload ? 3 : 6);
            if (target !== current) {
              modified = true;
              fixes.push(`Day ${day.day_number} ${ex.name}: ${current}→${target} sets`);
              return { ...ex, sets: target };
            }
          }
          return ex;
        });
      }

      // ── FIX 4: Bump External Rotation sets (+1, cap 4) for Shoulder Health ──
      exercises = exercises.map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name = (ex.name || "").toLowerCase();
        if (name.includes("external rotation") || name.includes("ext rotation") || name.includes("prone y") || name.includes("prone t")) {
          const current = ex.sets || 2;
          const target = Math.min(current + 1, 4);
          if (target !== current) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${ex.name}: ${current}→${target} sets`);
            return { ...ex, sets: target };
          }
        }
        return ex;
      });

      if (modified) {
        updates.push({ id: day.id, exercises });
      }
    }

    for (const upd of updates) {
      const { error: updErr } = await supabase
        .from("program_days")
        .update({ exercises: upd.exercises })
        .eq("id", upd.id);
      if (updErr) throw new Error(`Update ${upd.id} failed: ${updErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        days_modified: updates.length,
        total_fixes: fixes.length,
        details: fixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[FIX-VOLUME-GAPS] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
