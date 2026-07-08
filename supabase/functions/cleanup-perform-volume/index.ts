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

    // ── EXERCISES TO REMOVE (by day-of-week + name keyword) ──
    // D1 (dow=1): Cable Lateral Raise, Band Pull-Apart, Cable External Rotation, Incline DB Curl
    // D4 (dow=4): Reverse Pec Deck
    // D5 (dow=5): DB Lateral Raise
    const REMOVE_MAP: Record<number, string[]> = {
      1: ["cable lateral raise", "band pull-apart", "band pull apart", "cable external rotation", "incline db curl", "incline dumbbell curl"],
      4: ["reverse pec deck"],
      5: ["db lateral raise", "dumbbell lateral raise"],
    };

    // ── SHOULDER HEALTH exercises to RE-BUMP (+1 set, cap 4) ──
    const SHOULDER_HEALTH_KEYWORDS = [
      "face pull", "prone y", "prone t", "prone i",
      "external rotation", "ext rotation", "cable external",
      "y raise", "scarecrow", "powell raise",
    ];

    function matchesAny(name: string, keywords: string[]): boolean {
      const lower = name.toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    }

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1;
      let modified = false;
      const original = day.exercises as any[];

      // Step 1: Remove injected exercises for this day-of-week
      const removeKeywords = REMOVE_MAP[dow] || [];
      let exercises = original.filter((ex: any) => {
        if (ex.type !== "exercise") return true;
        const name = (ex.name || "").toLowerCase();
        // Strip leading group labels like "F1. " or "D1. "
        const cleanName = name.replace(/^[a-z]\d+\.\s*/i, "");
        if (removeKeywords.some((kw) => cleanName.includes(kw) || name.includes(kw))) {
          modified = true;
          fixes.push(`Day ${day.day_number} (D${dow}): REMOVED ${ex.name}`);
          return false;
        }
        return true;
      });

      // Step 2: Re-bump shoulder health exercises (+1, cap 4)
      // Only on days that ORIGINALLY had them (not on days we're removing from)
      exercises = exercises.map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name = (ex.name || "");
        if (matchesAny(name, SHOULDER_HEALTH_KEYWORDS)) {
          const currentSets = ex.sets || 2;
          const newSets = Math.min(currentSets + 1, 4);
          if (newSets !== currentSets) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${name}: ${currentSets}→${newSets} sets`);
            return { ...ex, sets: newSets };
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
    console.error("[CLEANUP-VOLUME] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
