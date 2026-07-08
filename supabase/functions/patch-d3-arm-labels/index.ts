import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

function getDow(dn: number): number { return ((dn - 1) % 7) + 1; }
function getMeso(dn: number): number {
  if (dn <= 28) return 1;
  if (dn <= 56) return 2;
  if (dn <= 84) return 3;
  return 4;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "true";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let allDays: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("program_days").select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID).order("day_number")
      .range(from, from + 499);
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
    allDays = allDays.concat(data || []);
    if (!data || data.length < 500) break;
    from += 500;
  }

  const log: string[] = [];
  let updated = 0;

  for (const day of allDays) {
    const dn = day.day_number;
    const dow = getDow(dn);
    const meso = getMeso(dn);
    if (meso > 3 || dow !== 3) continue;

    let exercises = [...(day.exercises as any[])];
    let changed = false;
    const tag = `D${dn} (M${meso})`;

    // Find E0. Cable Lateral Raise position
    const e0Idx = exercises.findIndex(e =>
      e.type === "exercise" && /^E0\./i.test(e.name || "")
    );
    if (e0Idx < 0) continue;

    // Find exercises AFTER E0 that are arms (curl, tricep, dip, skull, etc.) 
    // and relabel them to E1, E2 if they have wrong labels (D1/D2)
    let armCounter = 1;
    for (let i = e0Idx + 1; i < exercises.length; i++) {
      const ex = exercises[i];
      if (ex.type !== "exercise") continue;
      const name = ex.name || "";
      
      // Check if this is an arm exercise with wrong label
      if (/curl|tricep|extension|dip|skull|pushdown|hammer/i.test(name)) {
        const expectedLabel = `E${armCounter}`;
        const currentLabel = (name.match(/^([A-Z]\d+)\./) || [])[1];
        
        if (currentLabel && currentLabel !== expectedLabel) {
          exercises[i] = {
            ...ex,
            name: name.replace(/^[A-Z]\d+\./, `${expectedLabel}.`)
          };
          log.push(`${tag}: Relabeled ${name} → ${exercises[i].name}`);
          changed = true;
        }
        armCounter++;
      }
    }

    if (changed) {
      if (!dryRun) {
        const { error: upErr } = await supabase
          .from("program_days").update({ exercises }).eq("id", day.id);
        if (upErr) log.push(`ERROR ${tag}: ${upErr.message}`);
        else updated++;
      } else {
        updated++;
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    dry_run: dryRun,
    updated,
    changes: log
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
