import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

function getMeso(dn: number): number {
  if (dn <= 28) return 1;
  if (dn <= 56) return 2;
  if (dn <= 84) return 3;
  return 4;
}
function getDow(dn: number): number { return ((dn - 1) % 7) + 1; }

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
    const meso = getMeso(dn);
    const dow = getDow(dn);
    let exercises = [...(day.exercises as any[])];
    let changed = false;
    const tag = `D${dn} (M${meso} DOW${dow})`;

    if (meso === 1 && dow === 1) {
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && /chest supported row/i.test(exercises[i].name || "")) {
          const oldName = exercises[i].name;
          exercises[i] = {
            ...exercises[i],
            name: exercises[i].name.replace(/Chest Supported Row/i, "Cable Row"),
            detail: "Tempo 2-0-1-1. Seated cable row — squeeze shoulder blades, controlled return."
          };
          log.push(`${tag}: ${oldName} → ${exercises[i].name}`);
          changed = true;
        }
      }
    }

    if (meso === 2 && dow === 1) {
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && /machine chest press/i.test(exercises[i].name || "")) {
          const oldName = exercises[i].name;
          const label = (oldName.match(/^[A-Z]\d+\./) || ["E1."])[0];
          exercises[i] = {
            ...exercises[i],
            name: `${label} Lat Pulldown`,
            detail: "Tempo 2-0-1-1. Wide grip, lean back slightly. Squeeze lats at bottom."
          };
          log.push(`${tag}: ${oldName} → ${exercises[i].name}`);
          changed = true;
        }
      }
    }

    if (meso === 3 && dow === 2) {
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && /goblet squat/i.test(exercises[i].name || "")) {
          const oldName = exercises[i].name;
          const label = (oldName.match(/^[A-Z]\d+\./) || ["E1."])[0];
          exercises[i] = {
            ...exercises[i],
            name: `${label} Reverse Lunge`,
            detail: "DB in each hand. Controlled step back, upright torso. Drive through front heel."
          };
          log.push(`${tag}: ${oldName} → ${exercises[i].name}`);
          changed = true;
        }
      }
    }

    if (dow === 3) {
      const c1Indices: number[] = [];
      for (let i = 0; i < exercises.length; i++) {
        if (/^C1\./i.test(exercises[i].name || "")) {
          c1Indices.push(i);
        }
      }
      if (c1Indices.length > 1) {
        for (const idx of c1Indices) {
          if (/carry/i.test(exercises[idx].name || "")) {
            const oldName = exercises[idx].name;
            exercises[idx] = {
              ...exercises[idx],
              name: exercises[idx].name.replace(/^C1\./, "D1.")
            };
            log.push(`${tag}: Fixed duplicate C1 → ${exercises[idx].name}`);
            changed = true;
          }
        }
      }
    }

    if (dow === 3) {
      const e0Idx = exercises.findIndex(e =>
        e.type === "exercise" && /^E0\.\s*Cable Lateral Raise/i.test(e.name || "")
      );
      if (e0Idx >= 0 && e0Idx < 3) {
        const removed = exercises.splice(e0Idx, 1)[0];
        let armIdx = exercises.findIndex(e =>
          e.type === "exercise" && /^[DE]1\.\s*(EZ|Incline DB Curl|Concentration|Hammer|Dip)/i.test(e.name || "")
        );
        if (armIdx < 0) {
          armIdx = exercises.findIndex(e => e.type === "mindset" || e.type === "mission");
          if (armIdx < 0) armIdx = exercises.length;
        }
        exercises.splice(armIdx, 0, removed);
        log.push(`${tag}: Repositioned E0. Cable Lateral Raise from pos ${e0Idx + 1} to pos ${armIdx + 1} (before arms)`);
        changed = true;
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

  const verification: any[] = [];
  if (dryRun) {
    for (const day of allDays) {
      const dn = day.day_number;
      const dow = getDow(dn);
      const meso = getMeso(dn);
      if (meso > 3) continue;
      if (![1, 2, 3].includes(dow)) continue;
      const names = (day.exercises as any[])
        .filter((e: any) => e.type === "exercise")
        .map((e: any) => e.name);
      verification.push({ day_number: dn, meso, dow, label: day.label, exercises: names });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    dry_run: dryRun,
    updated,
    total_days: allDays.length,
    changes: log,
    ...(dryRun ? { verification } : {})
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
