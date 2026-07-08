import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: days, error } = await supabase
    .from("program_days")
    .select("id, day_number, label, exercises")
    .eq("program_id", PROGRAM_ID)
    .gte("day_number", 29)
    .lte("day_number", 84)
    .not("label", "ilike", "%Recover%")
    .order("day_number");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fixes: { day: number; changes: string[] }[] = [];

  for (const day of days) {
    const exercises = day.exercises as any[];
    const changes: string[] = [];
    let modified = false;

    // 1. Remove duplicate RIR from detail text
    for (const ex of exercises) {
      const rir = ex.rir;
      const detail = ex.detail || "";
      if (rir && detail.includes("RIR")) {
        // Strip patterns like "RIR 3." or "RIR 3," or "RIR 2-3." from detail
        const cleaned = detail
          .replace(/\s*RIR\s*\d+[-–]?\d*\.?\s*/gi, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        if (cleaned !== detail) {
          ex.detail = cleaned;
          changes.push(`Fixed RIR dupe in ${ex.name}`);
          modified = true;
        }
      }
    }

    // 2. Remove Chest Supported DB Row from vertical days
    const label = (day.label || "").toLowerCase();
    if (label.includes("vertical")) {
      const idx = exercises.findIndex((e: any) =>
        (e.name || "").toLowerCase().includes("chest supported")
      );
      if (idx >= 0) {
        const removed = exercises.splice(idx, 1);
        changes.push(`Removed ${removed[0].name}`);
        modified = true;
      }
    }

    if (modified) {
      const { error: upErr } = await supabase
        .from("program_days")
        .update({ exercises })
        .eq("id", day.id);

      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message, fixes }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      fixes.push({ day: day.day_number, changes });
    }
  }

  return new Response(JSON.stringify({ success: true, total_fixed: fixes.length, fixes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
