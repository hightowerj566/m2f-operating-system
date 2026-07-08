import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 6-day program
const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

// Meso 2 = weeks 5-8 = days 29-56 (7 days per week incl rest)
const MESO2_START = 29;
const MESO2_END = 56;

function weekNum(dayNumber: number): number {
  return Math.ceil(dayNumber / 7);
}

function dayInWeek(dayNumber: number): number {
  return ((dayNumber - 1) % 7) + 1;
}

function makeLateralBound(wk: number): any {
  return {
    name: "A0. Lateral Bound",
    sets: 3,
    reps: "4/side",
    rest: 50,
    rir: null,
    type: "exercise",
    group: `A0W${wk}D2`,
    detail: "Explode laterally. Stick landing 2s. Neural primer, not conditioning. Alternate sides.",
    superset_label: null,
  };
}

function makeMedBallChestPass(wk: number): any {
  return {
    name: "A0. Med Ball Chest Pass",
    sets: 3,
    reps: "3-5",
    rest: 60,
    rir: null,
    type: "exercise",
    group: `A0W${wk}D1`,
    detail: "Max intent. Reset each rep. Explosive. Upper body power primer.",
    superset_label: null,
  };
}

function makeMedBallRotationalThrow(wk: number, day: string): any {
  return {
    name: "A0. Med Ball Rotational Throw",
    sets: 3,
    reps: "4/side",
    rest: 50,
    rir: null,
    type: "exercise",
    group: `RTW${wk}${day}`,
    detail: "Load hips → rotate violently → finish tall. Reset each rep. Athletic intent.",
    superset_label: null,
  };
}

function makeInclineDBPress(wk: number): any {
  return {
    name: "B2. Incline DB Press",
    sets: 3,
    reps: "8-10",
    rest: 90,
    rir: 3,
    type: "exercise",
    group: `B2W${wk}D4`,
    detail: "Slight incline (20-30°). Controlled eccentric. Elbows slightly tucked. Chest stimulus #2.",
    superset_label: null,
  };
}

function makeChestSupportedDBRow(wk: number): any {
  return {
    name: "B3. Chest Supported DB Row",
    sets: 3,
    reps: "10-12",
    rest: 75,
    rir: 3,
    type: "exercise",
    group: `B3W${wk}D4`,
    detail: "Full stretch. No momentum. 1s squeeze at top. Pull dominance builder.",
    superset_label: null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all Meso 2 days
  const { data: days, error } = await supabase
    .from("program_days")
    .select("id, day_number, label, exercises")
    .eq("program_id", PROGRAM_ID)
    .gte("day_number", MESO2_START)
    .lte("day_number", MESO2_END)
    .order("day_number");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const updates: { id: string; day_number: number; label: string; action: string }[] = [];

  for (const day of days) {
    const label = (day.label || "").toLowerCase();
    const exercises = day.exercises as any[];
    const wk = weekNum(day.day_number);
    const diw = dayInWeek(day.day_number);
    let modified = false;

    // DAY 2 (Squat) — Add Lateral Bound at top
    if (label.includes("squat")) {
      // Check if already has Lateral Bound
      const hasLB = exercises.some((e: any) => e.name?.toLowerCase().includes("lateral bound"));
      if (!hasLB) {
        exercises.unshift(makeLateralBound(wk));
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Lateral Bound primer" });
      }
    }

    // DAY 1 (Horizontal) — Add Med Ball Chest Pass before primary
    if (label.includes("horizontal")) {
      // Check if already has chest pass
      const hasCP = exercises.some((e: any) => e.name?.toLowerCase().includes("chest pass"));
      if (!hasCP) {
        // Insert at position 0 (before everything, including existing power primers)
        // Actually insert at index 0 to be the very first exercise
        exercises.unshift(makeMedBallChestPass(wk));
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Med Ball Chest Pass primer" });
      }
    }

    // DAY 3 (Recovery) — Add Med Ball Rotational Throw
    if (label.includes("recover")) {
      const hasRT = exercises.some((e: any) => e.name?.toLowerCase().includes("rotational throw"));
      if (!hasRT) {
        // Insert before conditioning/cardio but after existing rotational slam
        // Find the first conditioning exercise index
        const condIdx = exercises.findIndex((e: any) => e.type === "conditioning");
        if (condIdx > 0) {
          exercises.splice(condIdx, 0, makeMedBallRotationalThrow(wk, "D3"));
        } else {
          // Insert after the rotational slam if present
          const slamIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("rotational") && e.name?.toLowerCase().includes("slam"));
          if (slamIdx >= 0) {
            exercises.splice(slamIdx + 1, 0, makeMedBallRotationalThrow(wk, "D3"));
          } else {
            exercises.unshift(makeMedBallRotationalThrow(wk, "D3"));
          }
        }
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Med Ball Rotational Throw" });
      }
    }

    // DAY 4 (Vertical) — Add Incline DB Press after OHP, Chest Supported DB Row after rows
    if (label.includes("vertical")) {
      const hasIDP = exercises.some((e: any) => e.name?.toLowerCase().includes("incline db press"));
      const hasCSR = exercises.some((e: any) => 
        e.name?.toLowerCase().includes("chest supported db row") || 
        (e.name?.toLowerCase().includes("chest supported") && e.name?.toLowerCase().includes("db row"))
      );

      if (!hasIDP) {
        // Insert after OHP (A1) but before Lat Pulldown (B1)
        const ohpIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("ohp") || e.name?.toLowerCase().includes("overhead press"));
        const latIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("lat pulldown"));
        const insertIdx = ohpIdx >= 0 ? ohpIdx + 1 : (latIdx >= 0 ? latIdx : 1);
        exercises.splice(insertIdx, 0, makeInclineDBPress(wk));
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Incline DB Press" });
      }

      // Re-check after potential splice
      const hasCSR2 = exercises.some((e: any) => 
        e.name?.toLowerCase().includes("chest supported db row")
      );
      if (!hasCSR2) {
        // Insert after Cable Row or after Lat Pulldown
        const cableRowIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("cable row"));
        const latIdx2 = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("lat pulldown"));
        const insertAfter = cableRowIdx >= 0 ? cableRowIdx + 1 : (latIdx2 >= 0 ? latIdx2 + 1 : exercises.length - 3);
        exercises.splice(insertAfter, 0, makeChestSupportedDBRow(wk));
        modified = true;
        updates.push({ id: day.id, day_number: day.day_number, label: day.label, action: "Added Chest Supported DB Row" });
      }
    }

    // DAY 6 (Condition and Carry) — Add Med Ball Rotational Throw (optional)
    if (label.includes("condition") && label.includes("carry")) {
      const hasRT = exercises.some((e: any) => e.name?.toLowerCase().includes("rotational throw"));
      if (!hasRT) {
        // Insert after Movement Prep / Pre-Conditioning block
        const preCondIdx = exercises.findIndex((e: any) => e.name?.toLowerCase().includes("pre-conditioning"));
        if (preCondIdx >= 0) {
          exercises.splice(preCondIdx + 1, 0, makeMedBallRotationalThrow(wk, "D6"));
        } else {
          // Insert after warmup
          const warmupEnd = exercises.findIndex((e: any) => e.type !== "warmup" && e.type !== "note");
          exercises.splice(Math.max(warmupEnd, 1), 0, makeMedBallRotationalThrow(wk, "D6"));
        }
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
