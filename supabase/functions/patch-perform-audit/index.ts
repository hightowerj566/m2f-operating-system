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
      const dow = ((day.day_number - 1) % 7) + 1; // 1=Mon..7=Sun
      const week = Math.ceil(day.day_number / 7);

      // Determine phase: exercises change every 4-week meso
      // Meso 1-2 (wk 1-8) = Phase 1, Meso 3-4 (wk 9-16) = Phase 2,
      // Meso 5-6 (wk 17-24) = Phase 3/4
      const phaseNum = week <= 8 ? 1 : week <= 16 ? 2 : 3;

      let modified = false;
      const exercises = (day.exercises as any[]).map((ex: any) => {
        const name: string = ex.name || "";
        const detail: string = ex.detail || "";
        const group: string = ex.group || "";

        // ─── FIX 1: Primary lift tempos (B1 exercises on strength days) ───
        if (group.match(/^B/) && ex.type === "exercise" && (dow === 1 || dow === 2)) {
          let newTempo: string | null = null;

          if (phaseNum === 1) {
            // Phase 1: 3-1-1-0 (controlled) — already correct
          } else if (phaseNum === 2) {
            // Phase 2 (Strength): 2-1-X-0
            if (detail.includes("3-1-1-0")) {
              newTempo = "2-1-X-0";
            }
          } else {
            // Phase 3/4 (Athletic): 2-0-X-0
            if (detail.includes("3-1-1-0")) {
              newTempo = "2-0-X-0";
            }
          }

          if (newTempo) {
            const newDetail = detail.replace(/Tempo \d-\d-\d-\d/, `Tempo ${newTempo}`);
            modified = true;
            fixes.push(`Day ${day.day_number} ${name}: tempo → ${newTempo}`);
            return { ...ex, detail: newDetail };
          }
        }

        // ─── FIX 2: Push Press / Landmine Push Press tempos ───
        if (
          (name.includes("Push Press") || name.includes("Landmine Push Press")) &&
          detail.includes("Tempo")
        ) {
          // Explosive movement — remove tempo, add "Explosive intent"
          const newDetail = detail
            .replace(/Tempo \d-\d-[\dX]-\d\.?\s*/, "")
            .trim();
          const finalDetail = newDetail
            ? `${newDetail}. Explosive intent`
            : "Explosive intent";
          modified = true;
          fixes.push(`Day ${day.day_number} ${name}: removed tempo, added explosive intent`);
          return { ...ex, detail: finalDetail };
        }

        // ─── FIX 3: Carry exercises — remove tempo ───
        if (
          (name.includes("Farmer Carry") ||
            name.includes("Suitcase Carry") ||
            name.includes("Trap Bar Carry")) &&
          detail.includes("Tempo")
        ) {
          const newDetail = detail
            .replace(/Tempo \d-\d-[\dX]-\d\.?\s*/, "")
            .trim() || "Controlled pace, brace core throughout";
          modified = true;
          fixes.push(`Day ${day.day_number} ${name}: removed tempo`);
          return { ...ex, detail: newDetail };
        }

        // ─── FIX 4: Calf raise pause reps — fix tempo ───
        if (
          name.includes("Calf Raise") &&
          detail.includes("pause reps") &&
          detail.includes("Tempo 2-0-1-1")
        ) {
          const newDetail = detail.replace("Tempo 2-0-1-1. pause reps", "Tempo 2-0-1-2 (2s pause at stretch)");
          modified = true;
          fixes.push(`Day ${day.day_number} ${name}: fixed pause tempo → 2-0-1-2`);
          return { ...ex, detail: newDetail };
        }

        return ex;
      });

      // ─── FIX 5: Phase 3 Day 2 missing unilateral work ───
      // Phase 3 = weeks 13-18, Day 2 = dow 2
      if (phaseNum === 2 && dow === 2 && week >= 13) {
        const hasUnilateral = exercises.some(
          (e: any) =>
            e.type === "exercise" &&
            (e.name.includes("Lunge") ||
              e.name.includes("Split Squat") ||
              e.name.includes("Step-Up"))
        );

        if (!hasUnilateral) {
          // Find calf raise position and insert walking lunge before it
          const calfIdx = exercises.findIndex(
            (e: any) => e.type === "exercise" && e.name.includes("Calf Raise")
          );
          if (calfIdx > 0) {
            const weekStr = `W${week}D2`;
            const supersetGroup = `EW${week}D2`;

            // Convert calf raise into a superset with walking lunge
            const lunge = {
              name: `E1. Walking Lunge`,
              detail: "Tempo 2-0-1-1",
              sets: 3,
              reps: "10 each",
              rest: null,
              rir: exercises[calfIdx].rir,
              type: "exercise",
              group: supersetGroup,
              superset_label: "Superset",
            };

            // Update calf to E2
            exercises[calfIdx] = {
              ...exercises[calfIdx],
              name: exercises[calfIdx].name.replace(/^[A-Z]\d\./, "E2."),
              group: supersetGroup,
              superset_label: "Superset",
            };

            exercises.splice(calfIdx, 0, lunge);
            modified = true;
            fixes.push(`Day ${day.day_number}: added Walking Lunge to Lower Strength`);
          }
        }
      }

      if (modified) {
        updates.push({ id: day.id, exercises });
      }
    }

    // Apply all updates
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
        total_fixes: fixes.length,
        days_modified: updates.length,
        details: fixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PATCH-AUDIT] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
