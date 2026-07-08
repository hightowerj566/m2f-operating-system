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
    const dow = ((dn - 1) % 7) + 1;
    let exercises = [...(day.exercises as any[])];
    let changed = false;

    // ═══════════════════════════════════════════════════════
    // REORDER: Enforce proper exercise flow on every day
    // Order: warmup → exercise (power → strength → accessories → calves/tibialis → carry/core) → conditioning → mindset → dad_mission
    // ═══════════════════════════════════════════════════════

    // Separate by type
    const warmups = exercises.filter(e => e.type === "warmup");
    const exs = exercises.filter(e => e.type === "exercise");
    const conditioning = exercises.filter(e => e.type === "conditioning");
    const mindset = exercises.filter(e => e.type === "mindset");
    const dadMission = exercises.filter(e => e.type === "dad_mission");
    const other = exercises.filter(e => !["warmup","exercise","conditioning","mindset","dad_mission"].includes(e.type));

    // For exercises, establish proper labeling/grouping
    // Assign proper letter prefixes to orphaned exercises
    const labeled: any[] = [];
    const orphaned: any[] = [];

    for (const ex of exs) {
      if (/^[A-Z]\d+\./.test(ex.name || "")) {
        labeled.push(ex);
      } else {
        orphaned.push(ex);
      }
    }

    // Classify orphans into categories for proper placement
    const categoryOrder = (name: string): number => {
      const n = (name || "").toLowerCase();
      // Power/explosive
      if (/med ball|box jump|broad jump|depth jump|plyo|sprint|kettlebell swing/i.test(n)) return 0;
      // Primary compound
      if (/squat|bench|deadlift|press|row|pull/i.test(n)) return 1;
      // Secondary compound / structural
      if (/lunge|split squat|hip thrust|dip|carry|zercher|anderson/i.test(n)) return 2;
      // Accessories - hypertrophy
      if (/curl|extension|fly|raise|pull.*apart|face pull|pec deck|meadows/i.test(n)) return 3;
      // Leg curl / ham accessory
      if (/leg curl|seated.*curl/i.test(n)) return 3;
      // Leg extension
      if (/leg ext/i.test(n)) return 3;
      // Chest supported row
      if (/chest supported|cable row/i.test(n)) return 2;
      // Calves / tibialis
      if (/calf|calves|tibialis/i.test(n)) return 4;
      // Core / carry
      if (/woodchop|pallof|plank|carry|suitcase|rotation/i.test(n)) return 5;
      // Shoulder health
      if (/external rot|scap push|serratus/i.test(n)) return 5;
      return 3;
    };

    // Sort orphans by category
    orphaned.sort((a, b) => categoryOrder(a.name) - categoryOrder(b.name));

    // Find where to insert orphans — after the last labeled exercise
    // First, find proper insertion points by looking at labeled exercises
    let lastLabeledIdx = -1;
    for (let i = labeled.length - 1; i >= 0; i--) {
      const cat = categoryOrder(labeled[i].name);
      if (cat <= 3) { lastLabeledIdx = i; break; }
    }

    // Build the exercise list in order:
    // 1. All labeled exercises that are power/compound (categories 0-2)
    // 2. Orphaned power/compound exercises
    // 3. All labeled accessories
    // 4. Orphaned accessories
    // 5. Calves/tibialis (labeled then orphaned)
    // 6. Core/carry/shoulder health (labeled then orphaned)

    const sortedExs: any[] = [];
    const allExercises = [...labeled, ...orphaned];

    // Group by category
    const byCategory: any[][] = [[], [], [], [], [], []];
    for (const ex of allExercises) {
      const cat = categoryOrder(ex.name);
      byCategory[Math.min(cat, 5)].push(ex);
    }

    // Within each category, labeled exercises first (preserve their order)
    for (const group of byCategory) {
      const lab = group.filter(e => /^[A-Z]\d+\./.test(e.name || ""));
      const orph = group.filter(e => !/^[A-Z]\d+\./.test(e.name || ""));
      sortedExs.push(...lab, ...orph);
    }

    // Rebuild full exercise list
    const newExercises = [...warmups, ...sortedExs, ...conditioning, ...other, ...mindset, ...dadMission];

    // Check if order changed
    const oldOrder = exercises.map(e => e.name).join("|");
    const newOrder = newExercises.map(e => e.name).join("|");
    if (oldOrder !== newOrder) {
      exercises = newExercises;
      changed = true;
      log.push(`D${dn}: Reordered exercises for proper flow`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX: D3 (Zone 2) — move arm exercises BEFORE conditioning
    // ═══════════════════════════════════════════════════════
    if (dow === 3) {
      // Already handled by the reorder above — exercises come before conditioning
    }

    // ═══════════════════════════════════════════════════════
    // LABEL: Give proper labels to orphaned exercises
    // ═══════════════════════════════════════════════════════
    // Find the highest letter used in labeled exercises
    let maxLetter = "A";
    for (const ex of exercises) {
      if (ex.type !== "exercise") continue;
      const match = (ex.name || "").match(/^([A-Z])\d+\./);
      if (match && match[1] > maxLetter) maxLetter = match[1];
    }

    let nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1);
    let labelCounter = 1;
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (ex.type !== "exercise") continue;
      if (!/^[A-Z]\d+\./.test(ex.name || "")) {
        const newName = `${nextLetter}${labelCounter}. ${ex.name}`;
        exercises[i] = { ...ex, name: newName };
        labelCounter++;
        if (labelCounter > 2) {
          nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
          labelCounter = 1;
        }
        changed = true;
      }
    }

    if (changed) {
      const { error: upErr } = await supabase.from("program_days").update({ exercises }).eq("id", day.id);
      if (upErr) log.push(`ERROR D${dn}: ${upErr.message}`);
      else updated++;
    }
  }

  return new Response(JSON.stringify({ success: true, updated, changes: log }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
