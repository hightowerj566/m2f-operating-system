import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

function getPrefix(name: string): string | null {
  const m = name.match(/^([A-Z]\d?)[\.\s]/);
  return m ? m[1] : null;
}

function isPrimer(e: any): boolean {
  const n = (e.name || "").toLowerCase();
  return n.includes("a0.") || 
    (n.includes("lateral bound") && !n.includes("a1")) ||
    (n.includes("reactive lateral bound"));
}

function sortExercises(exercises: any[]): any[] {
  // Split into categories
  const warmups: any[] = [];
  const primers: any[] = [];
  const grouped: Map<string, any[]> = new Map();
  const ungrouped: any[] = [];
  const shoulder_health: any[] = [];
  const missions: any[] = [];

  for (const e of exercises) {
    const t = e.type || "";
    const n = (e.name || "").toLowerCase();

    if (t === "dad_mission" || t === "mindset") {
      missions.push(e);
      continue;
    }
    if (t === "warmup") {
      warmups.push(e);
      continue;
    }
    if (isPrimer(e)) {
      primers.push(e);
      continue;
    }
    // Shoulder health (no prefix, known names)
    if (!getPrefix(e.name || "") && (
      n.includes("face pull") || n.includes("external rotation") || 
      n.includes("serratus") || n.includes("trap 3") || n.includes("wall ankle") ||
      n.includes("dead hang")
    )) {
      shoulder_health.push(e);
      continue;
    }

    const prefix = getPrefix(e.name || "");
    if (prefix) {
      const letter = prefix[0]; // Group by letter
      if (!grouped.has(letter)) grouped.set(letter, []);
      grouped.get(letter)!.push(e);
    } else {
      ungrouped.push(e);
    }
  }

  // Sort grouped by letter order
  const sortedGroups = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  
  const result = [
    ...warmups,
    ...primers,
  ];

  for (const [, group] of sortedGroups) {
    // Sort within group by number suffix
    group.sort((a: any, b: any) => {
      const pa = getPrefix(a.name || "") || "";
      const pb = getPrefix(b.name || "") || "";
      return pa.localeCompare(pb);
    });
    result.push(...group);
  }

  result.push(...ungrouped, ...shoulder_health, ...missions);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch Meso 2 + Meso 3 days (29-84), skip rest days
  const { data: days, error } = await supabase
    .from("program_days")
    .select("id, day_number, label, exercises")
    .eq("program_id", PROGRAM_ID)
    .gte("day_number", 29)
    .lte("day_number", 84)
    .not("label", "ilike", "%Recover and Be Present%")
    .order("day_number");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const fixes: { day_number: number; label: string; changes: string[] }[] = [];

  for (const day of days) {
    const exercises = day.exercises as any[];
    const changes: string[] = [];

    // Fix 1: Rename duplicate C1 on Day 57-type horizontal days
    const c1s = exercises.filter((e: any) => (e.name || "").startsWith("C1."));
    if (c1s.length > 1) {
      // Second C1 becomes C2
      let found = 0;
      for (let i = 0; i < exercises.length; i++) {
        if ((exercises[i].name || "").startsWith("C1.")) {
          found++;
          if (found === 2) {
            exercises[i].name = exercises[i].name.replace("C1.", "C2.");
            changes.push(`Renamed duplicate C1 → C2: ${exercises[i].name}`);
          }
        }
      }
    }

    // Fix 2: Orphaned B1 without B2 — check if there's a logical pair
    const hasB1 = exercises.some((e: any) => (e.name || "").startsWith("B1."));
    const hasB2 = exercises.some((e: any) => (e.name || "").startsWith("B2."));
    // Don't force pair if B1 is a standalone primary lift

    // Fix 3: Reorder for superset adjacency
    const sorted = sortExercises(exercises);
    
    // Check if order changed
    const origNames = exercises.map((e: any) => e.name);
    const sortedNames = sorted.map((e: any) => e.name);
    let orderChanged = false;
    for (let i = 0; i < origNames.length; i++) {
      if (origNames[i] !== sortedNames[i]) {
        orderChanged = true;
        break;
      }
    }

    if (orderChanged) {
      changes.push("Reordered exercises for proper superset adjacency");
    }

    if (changes.length > 0) {
      const { error: upErr } = await supabase
        .from("program_days")
        .update({ exercises: sorted })
        .eq("id", day.id);

      if (upErr) {
        return new Response(JSON.stringify({ error: `Day ${day.day_number}: ${upErr.message}`, fixes }), {
          status: 500, headers: corsHeaders,
        });
      }
      fixes.push({ day_number: day.day_number, label: day.label, changes });
    }
  }

  return new Response(JSON.stringify({ success: true, total_fixed: fixes.length, fixes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
