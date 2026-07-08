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
      if (dow !== 4) continue;

      const week = Math.ceil(day.day_number / 7);
      const isDeload = ((week - 1) % 4 + 1) === 4;
      let modified = false;

      const exercises = (day.exercises as any[]).map((ex: any) => {
        if (ex.type !== "exercise") return ex;
        const name = (ex.name || "").toLowerCase();

        // Target chest press and fly accessories on D4
        const isChestWork =
          name.includes("fly") || name.includes("flye") || name.includes("pec deck") ||
          (name.includes("press") && !name.includes("leg") && !name.includes("shoulder") &&
           !name.includes("ohp") && !name.includes("push press") &&
           (name.includes("incline") || name.includes("db") || name.includes("dumbbell") ||
            name.includes("machine") || name.includes("bench") || name.includes("chest")));

        if (isChestWork) {
          const current = ex.sets || 3;
          const cap = isDeload ? 3 : 5;
          const target = Math.min(current + 1, cap);
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
      JSON.stringify({ success: true, days_modified: updates.length, total_fixes: fixes.length, details: fixes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
