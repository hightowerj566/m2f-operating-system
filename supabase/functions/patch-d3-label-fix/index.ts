import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // M2 D3 days (31,38,45,52) + M3 D3 days (59,66,73,80)
  const targetDays = [31, 38, 45, 52, 59, 66, 73, 80];

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

  const log: string[] = [];
  let updated = 0;

  for (const day of days!) {
    const dn = day.day_number;
    const meso = dn <= 56 ? 2 : 3;
    let exercises = [...(day.exercises as any[])];
    let changed = false;

    if (meso === 2) {
      // M2 D3: D1. Farmer Carry should be C1. Farmer Carry (no C1 conflict)
      // Then D1. Incline DB Curl stays D1, D2. Dip stays D2
      for (let i = 0; i < exercises.length; i++) {
        const n = exercises[i].name || "";
        if (n === "D1. Farmer Carry") {
          exercises[i] = { ...exercises[i], name: "C1. Farmer Carry" };
          changed = true;
          log.push(`D${dn}: Reverted D1. Farmer Carry → C1. Farmer Carry`);
        }
      }
    } else {
      // M3 D3: D1. Overhead Carry → C3. Overhead Carry
      // D1. Concentration Curl stays D1, D2. Skull Crusher stays D2
      for (let i = 0; i < exercises.length; i++) {
        const n = exercises[i].name || "";
        if (n === "D1. Overhead Carry") {
          exercises[i] = { ...exercises[i], name: "C3. Overhead Carry" };
          changed = true;
          log.push(`D${dn}: Relabeled D1. Overhead Carry → C3. Overhead Carry`);
        }
      }
    }

    if (changed) {
      const { error: upErr } = await supabase
        .from("program_days").update({ exercises }).eq("id", day.id);
      if (upErr) log.push(`ERROR D${dn}: ${upErr.message}`);
      else updated++;
    }
  }

  return new Response(JSON.stringify({ success: true, updated, changes: log }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
