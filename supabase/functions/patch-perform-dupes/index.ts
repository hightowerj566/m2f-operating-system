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

  const targetDays = [29, 36, 43, 50];

  const { data: days, error } = await supabase
    .from("program_days")
    .select("id, day_number, exercises")
    .eq("program_id", PROGRAM_ID)
    .in("day_number", targetDays)
    .order("day_number");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fixes: { day: number; action: string }[] = [];

  for (const day of days!) {
    const exercises = day.exercises as any[];

    const passIdx = exercises.findIndex((e: any) =>
      (e.name || "").toLowerCase().includes("med ball chest pass")
    );
    const throwIdx = exercises.findIndex((e: any) =>
      (e.name || "").toLowerCase().includes("med ball chest throw")
    );

    if (passIdx < 0 || throwIdx < 0) {
      fixes.push({ day: day.day_number, action: "skipped — one or both not found" });
      continue;
    }

    const isDeload = day.day_number === 50;
    const mergedSets = isDeload ? 3 : 4;

    exercises[passIdx].sets = mergedSets;
    exercises[passIdx].reps = "5";
    exercises[passIdx].detail = `${mergedSets}×5. Max intent. Full reset between reps. Explosive horizontal power primer.`;

    // Remove Throws
    exercises.splice(throwIdx, 1);

    const { error: upErr } = await supabase
      .from("program_days")
      .update({ exercises })
      .eq("id", day.id);

    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message, fixes }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    fixes.push({ day: day.day_number, action: `Merged → Med Ball Chest Pass ${mergedSets}×5, removed Throws` });
  }

  return new Response(JSON.stringify({ success: true, fixes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});