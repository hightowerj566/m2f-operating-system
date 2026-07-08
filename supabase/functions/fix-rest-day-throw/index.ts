import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find all rest days (Day 7) that have rotational throws
  const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";
  const { data: days } = await supabase
    .from("program_days")
    .select("id, day_number, label, exercises")
    .eq("program_id", PROGRAM_ID)
    .ilike("label", "%Recover and Be Present%")
    .order("day_number");

  const fixes: string[] = [];

  for (const day of (days || [])) {
    const exercises = (day.exercises as any[]).filter(
      (e: any) => !e.name?.toLowerCase().includes("rotational throw")
    );

    if (exercises.length < (day.exercises as any[]).length) {
      await supabase.from("program_days").update({ exercises }).eq("id", day.id);
      fixes.push(`Day ${day.day_number}: removed rotational throw from rest day`);
    }
  }

  return new Response(JSON.stringify({ success: true, fixes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
