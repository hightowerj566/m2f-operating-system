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

      // ── FIX 1: Add Lateral Raise to D3 (Conditioning/Core/Arms) ──
      // D4 already has one (3 sets). Adding to D3 gives us ~6 sets/wk total.
      // For a PERFORM program, 6-10 lateral delt sets is appropriate.
      if (dow === 3) {
        const hasLatRaise = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("lateral raise")
        );
        if (!hasLatRaise) {
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (["conditioning", "cooldown", "mindset", "dad_mission"].includes(exercises[i].type)) {
              insertIdx = i;
            }
          }
          exercises.splice(insertIdx, 0, {
            name: "Cable Lateral Raise",
            detail: "Controlled eccentric, slight lean",
            sets: isDeload ? 2 : 3,
            reps: "12-15",
            rest: 60,
            rir: isDeload ? 4 : 2,
            type: "exercise",
            group: null,
            superset_label: null,
          });
          modified = true;
          fixes.push(`Day ${day.day_number} (D3): ADDED Cable Lateral Raise ${isDeload ? 2 : 3}×12-15`);
        }
      }

      // ── FIX 2: Bump D4 Lateral Raise from 3→4 sets ──
      if (dow === 4) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise")) {
            const current = ex.sets || 3;
            const target = isDeload ? 2 : 4;
            if (target !== current) {
              modified = true;
              fixes.push(`Day ${day.day_number} ${ex.name}: ${current}→${target} sets`);
              return { ...ex, sets: target };
            }
          }
          return ex;
        });
      }

      // ── FIX 3: Bump Chest — D4 fly/press accessories (+1 set) ──
      // D1 bench already bumped. Now bump D4 chest accessories.
      if (dow === 4) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("fly") || name.includes("flye") || name.includes("pec deck") ||
              (name.includes("press") && (name.includes("incline") || name.includes("db")) && !name.includes("leg"))) {
            const current = ex.sets || 3;
            const target = Math.min(current + 1, isDeload ? 3 : 4);
            if (target !== current) {
              modified = true;
              fixes.push(`Day ${day.day_number} ${ex.name}: ${current}→${target} sets`);
              return { ...ex, sets: target };
            }
          }
          return ex;
        });
      }

      // ── FIX 4: Bump Rear Delt — any reverse fly / rear delt work (+1, cap 4) ──
      exercises = exercises.map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name = (ex.name || "").toLowerCase();
        if (name.includes("reverse fly") || name.includes("rear delt") || name.includes("reverse pec")) {
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

      // ── FIX 5: Bump Band Pull-Apart on D3/D5 if present (+1, cap 4) ──
      if (dow === 3 || dow === 5) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("band pull-apart") || name.includes("band pull apart")) {
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
      }

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
    console.error("[FIX-GAPS-V2] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
