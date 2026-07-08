import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";
const MESO3_START = 57;
const MESO3_END = 84;

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
    .gte("day_number", MESO3_START)
    .lte("day_number", MESO3_END)
    .order("day_number");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const updates: { id: string; day_number: number; label: string; action: string }[] = [];

  for (const day of days) {
    const label = (day.label || "").toLowerCase();
    const exercises = day.exercises as any[];
    let modified = false;

    // ═══════════════════════════════════════════
    // D2 (Squat day) — Update "Lateral Bound to Stick" → "Reactive Lateral Bound (Continuous)"
    // Labels: "express your power (squat)" or "move like an athlete (squat)"
    // ═══════════════════════════════════════════
    if (label.includes("squat")) {
      const lbIdx = exercises.findIndex((e: any) => 
        e.name?.toLowerCase().includes("lateral bound")
      );
      if (lbIdx >= 0) {
        exercises[lbIdx].name = "Reactive Lateral Bound (Continuous)";
        exercises[lbIdx].reps = "4/side";
        exercises[lbIdx].rest = 50;
        exercises[lbIdx].detail = "3×4/side. No reset between reps. Absorb and immediately rebound. Train elasticity and force transfer. Continuous reactive movement. Progressed from M2 stick-and-hold.";
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Updated Lateral Bound → Reactive Lateral Bound (Continuous)" });
      }
    }

    // ═══════════════════════════════════════════
    // D1 (Horizontal day) — Add Step-In Med Ball Chest Pass before Plyo Push-Ups
    // Labels: "express your power (horizontal)" or "push and pull (horizontal)"
    // ═══════════════════════════════════════════
    if (label.includes("horizontal")) {
      const hasCP = exercises.some((e: any) => e.name?.toLowerCase().includes("chest pass"));
      if (!hasCP) {
        // Insert after warmup but before Plyo Push-Ups
        const plyoIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("plyo push"));
        const insertIdx = plyoIdx >= 0 ? plyoIdx : exercises.findIndex((e: any) => e.type === "exercise");
        exercises.splice(Math.max(insertIdx, 0), 0, {
          name: "A0. Step-In Med Ball Chest Pass",
          sets: 3, reps: "3-5", rest: 65, rir: null,
          type: "exercise", tempo: null,
          detail: "3×3-5. Add forward step or increase ball weight. Max intent every rep. Progressed upper body power primer.",
        });
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Step-In Med Ball Chest Pass" });
      }
    }

    // ═══════════════════════════════════════════
    // D3 (Recovery/Core day) — Add Med Ball Rotational Throw
    // Labels: "recover like it's training"
    // ═══════════════════════════════════════════
    if (label.includes("recover")) {
      const hasRT = exercises.some((e: any) => e.name?.toLowerCase().includes("rotational throw"));
      if (!hasRT) {
        // Insert before Zone 2 cardio or after rotational work
        const landmineIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("landmine rotation"));
        const zoneIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("zone 2"));
        let insertIdx = landmineIdx >= 0 ? landmineIdx + 1 : (zoneIdx >= 0 ? zoneIdx : exercises.length - 2);
        exercises.splice(insertIdx, 0, {
          name: "Med Ball Rotational Throw",
          sets: 3, reps: "3-4/side", rest: 65, rir: null,
          type: "exercise", tempo: null,
          detail: "3×3-4/side. Full hip load → violent rotation → stick finish. Do NOT rush reps. Explosive rotational power.",
        });
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Med Ball Rotational Throw" });
      }
    }

    // ═══════════════════════════════════════════
    // D4 (Vertical day) — Add Incline DB Press after Push Press, +1 set to Lat Pulldown
    // Labels: "push and pull (vertical)"
    // ═══════════════════════════════════════════
    if (label.includes("vertical")) {
      // Add Incline DB Press
      const hasIDP = exercises.some((e: any) => e.name?.toLowerCase().includes("incline db press"));
      if (!hasIDP) {
        const ohpIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("ohp") || e.name?.toLowerCase().includes("overhead press"));
        const insertIdx = ohpIdx >= 0 ? ohpIdx + 1 : 1;
        exercises.splice(insertIdx, 0, {
          name: "A2. Incline DB Press",
          sets: 3, reps: "6-8", rest: 90, rir: "RIR 2",
          type: "exercise", tempo: null,
          detail: "3×6-8. RIR 2. Heavier loading than M2. Controlled eccentric. Elbows slightly tucked. PRIMARY hypertrophy driver for chest.",
        });
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Incline DB Press (3×6-8)" });
      }

      // +1 set to Lat Pulldown
      const latIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("lat pulldown"));
      if (latIdx >= 0) {
        const currentSets = exercises[latIdx].sets || 3;
        if (currentSets < 4) {
          exercises[latIdx].sets = currentSets + 1;
          exercises[latIdx].detail = (exercises[latIdx].detail || "") + " (+1 set for pull bias under peak fatigue phase)";
          modified = true;
          updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: `Lat Pulldown: ${currentSets} → ${currentSets + 1} sets` });
        }
      }

      // Add Chest Supported DB Row if not present
      const hasCSR = exercises.some((e: any) => 
        e.name?.toLowerCase().includes("chest supported") && e.name?.toLowerCase().includes("row")
      );
      if (!hasCSR) {
        // Insert after existing row work
        const rowIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("row"));
        const insertAfter = rowIdx >= 0 ? rowIdx + 1 : exercises.length - 2;
        // Don't add if there's already a chest supported row
      } else {
        // Bump sets if only 2
        const csrIdx = exercises.findIndex((e: any) => 
          e.name?.toLowerCase().includes("chest supported") && e.name?.toLowerCase().includes("row")
        );
        if (csrIdx >= 0 && exercises[csrIdx].sets < 3) {
          exercises[csrIdx].sets = 3;
          exercises[csrIdx].detail = (exercises[csrIdx].detail || "") + " (+1 set for pull dominance)";
          modified = true;
          updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Chest Supported Row bumped to 3 sets" });
        }
      }
    }

    // ═══════════════════════════════════════════
    // D6 (Condition day) — Optional Med Ball Rotational Throw
    // Labels: "condition and carry"
    // ═══════════════════════════════════════════
    if (label.includes("condition") && label.includes("carry")) {
      const hasRT = exercises.some((e: any) => e.name?.toLowerCase().includes("rotational throw"));
      if (!hasRT) {
        // Insert at start (before conditioning)
        const firstExIdx = exercises.findIndex((e: any) => e.type === "conditioning" || e.type === "exercise");
        exercises.splice(Math.max(firstExIdx, 0), 0, {
          name: "A0. Med Ball Rotational Throw",
          sets: 3, reps: "3/side", rest: 60, rir: null,
          type: "exercise", tempo: null,
          detail: "3×3/side. Explosive intent. Full reset between reps. Rotational power expression before conditioning.",
        });
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Med Ball Rotational Throw (D6)" });
      }
    }

    if (modified) {
      const { error: upErr } = await supabase
        .from("program_days")
        .update({ exercises })
        .eq("id", day.id);
      if (upErr) {
        return new Response(JSON.stringify({ error: `Update day ${day.day_number}: ${upErr.message}`, updates }), {
          status: 500, headers: corsHeaders,
        });
      }
    }
  }

  return new Response(JSON.stringify({ success: true, updates_applied: updates.length, updates }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
