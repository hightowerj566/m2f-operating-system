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

    // Keywords for exercises to REMOVE entirely (these were injected)
    const REMOVE_KEYWORDS = [
      "lateral raise",
      "lat raise",
      "incline db curl",
      "incline dumbbell curl",
      "cable curl",
      "bicep curl",
      "hammer curl",
      "ez curl",
      "barbell curl",
    ];

    // Keywords for exercises to REVERT sets (-1, min 2)
    const REVERT_SET_KEYWORDS = [
      "face pull",
      "band pull-apart",
      "band pull apart",
      "prone y",
      "prone i",
      "prone t",
      "external rotation",
      "ext rotation",
      "ext. rotation",
      "cable external",
      "y raise",
      "scarecrow",
    ];

    function matchesAny(name: string, keywords: string[]): boolean {
      const lower = name.toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    }

    for (const day of allDays!) {
      let modified = false;
      const original = day.exercises as any[];

      // Step 1: Remove injected exercises
      let exercises = original.filter((ex: any) => {
        if (ex.type !== "exercise") return true;
        const name: string = ex.name || "";
        if (matchesAny(name, REMOVE_KEYWORDS)) {
          modified = true;
          fixes.push(`Day ${day.day_number}: REMOVED ${name}`);
          return false;
        }
        return true;
      });

      // Step 2: Revert shoulder health sets (-1, min 2)
      exercises = exercises.map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name: string = ex.name || "";
        if (matchesAny(name, REVERT_SET_KEYWORDS)) {
          const currentSets = ex.sets || 3;
          const newSets = Math.max(currentSets - 1, 2);
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
    console.error("[REVERT-VOLUME] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
