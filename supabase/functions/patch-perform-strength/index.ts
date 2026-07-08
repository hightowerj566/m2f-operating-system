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

  let allDays: any[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .order("day_number")
      .range(from, from + PAGE - 1);
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
    allDays = allDays.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  const log: string[] = [];
  let updated = 0;

  for (const day of allDays) {
    const dn = day.day_number;
    const dow = ((dn - 1) % 7) + 1;
    const weekInMeso = Math.ceil(((dn - 1) % 28 + 1) / 7);
    const isDeload = weekInMeso === 4;
    let exercises = [...(day.exercises as any[])];
    let changed = false;

    // DAY 1: +A2 Rotational Throw, +F3 Serratus Wall Slide
    if (dow === 1) {
      if (!exercises.some((e: any) => /rotational\s*throw/i.test(e.name || ""))) {
        const a1 = exercises.findIndex((e: any) => /^A1\./i.test(e.name || ""));
        exercises.splice(a1 >= 0 ? a1 + 1 : 1, 0, {
          name: "A2. Med Ball Rotational Throw", sets: isDeload ? 2 : 3, reps: "4/side", rest: "90", rir: null,
          detail: "Alternate weekly with chest pass. Max intent. Rotate through hips.",
          group: `A2W${weekInMeso}D1`, type: "exercise", superset_label: null,
        });
        changed = true; log.push(`D${dn}: +A2 Rotational Throw`);
      }
      if (!exercises.some((e: any) => /serratus\s*wall/i.test(e.name || ""))) {
        const mi = exercises.findIndex((e: any) => e.type === "mindset");
        exercises.splice(mi >= 0 ? mi : exercises.length, 0, {
          name: "F3. Serratus Wall Slide", sets: isDeload ? 2 : 3, reps: "12", rest: "45", rir: null,
          detail: "Slow control. Full upward rotation. Keep ribs down.",
          group: `FW${weekInMeso}D1`, type: "exercise", superset_label: "Superset",
        });
        changed = true; log.push(`D${dn}: +F3 Serratus Wall Slide`);
      }
    }

    // DAY 2: Modify Walking Lunge, +F3 Lateral Step-Down
    if (dow === 2) {
      const li = exercises.findIndex((e: any) => /walking\s*lunge/i.test(e.name || ""));
      if (li >= 0 && !/alternate.*lateral/i.test(exercises[li].detail || "")) {
        exercises[li] = { ...exercises[li], detail: "Alternate weekly with Lateral Lunge. Build frontal plane strength. Sit into hip, control knee tracking." };
        changed = true; log.push(`D${dn}: Updated Walking Lunge`);
      }
      if (!exercises.some((e: any) => /lateral\s*step.down/i.test(e.name || ""))) {
        const mi = exercises.findIndex((e: any) => e.type === "mindset");
        exercises.splice(mi >= 0 ? mi : exercises.length, 0, {
          name: "F3. Lateral Step-Down", sets: isDeload ? 1 : 2, reps: "10/side", rest: "45", rir: null,
          detail: "Control knee tracking. Build frontal stability.",
          group: `FW${weekInMeso}D2`, type: "exercise", superset_label: null,
        });
        changed = true; log.push(`D${dn}: +F3 Lateral Step-Down`);
      }
    }

    // DAY 3: Update Slam reps to 6/side
    if (dow === 3) {
      const si = exercises.findIndex((e: any) => /rotational.*slam/i.test(e.name || ""));
      if (si >= 0 && exercises[si].reps !== "6/side") {
        exercises[si] = { ...exercises[si], reps: isDeload ? "4/side" : "6/side", detail: "Explosive rotation. Reset each rep. Perform before intervals." };
        changed = true; log.push(`D${dn}: Slam → 6/side`);
      }
    }

    // DAY 4: +F3 Trap 3 Raise, +F4 Serratus Wall Slide
    if (dow === 4) {
      if (!exercises.some((e: any) => /trap\s*3\s*raise/i.test(e.name || ""))) {
        const lr = exercises.findIndex((e: any) => /lateral\s*raise/i.test(e.name || ""));
        const mi = exercises.findIndex((e: any) => e.type === "mindset");
        exercises.splice(lr >= 0 ? lr : (mi >= 0 ? mi : exercises.length), 0, {
          name: "F3. Trap 3 Raise", sets: isDeload ? 2 : 3, reps: "12", rest: "45", rir: null,
          detail: "Light weight. Control scap. No shrugging.",
          group: `FW${weekInMeso}D4`, type: "exercise", superset_label: "Superset",
        });
        changed = true; log.push(`D${dn}: +F3 Trap 3 Raise`);
      }
      if (!exercises.some((e: any) => /serratus\s*wall/i.test(e.name || ""))) {
        const t3 = exercises.findIndex((e: any) => /trap\s*3\s*raise/i.test(e.name || ""));
        exercises.splice(t3 >= 0 ? t3 + 1 : exercises.length, 0, {
          name: "F4. Serratus Wall Slide", sets: isDeload ? 1 : 2, reps: "12", rest: "45", rir: null,
          detail: "Focus on upward rotation.",
          group: `FW${weekInMeso}D4`, type: "exercise", superset_label: "Superset",
        });
        changed = true; log.push(`D${dn}: +F4 Serratus Wall Slide`);
      }
    }

    // DAY 5: +F3 Cossack Squat
    if (dow === 5) {
      if (!exercises.some((e: any) => /cossack/i.test(e.name || ""))) {
        const mi = exercises.findIndex((e: any) => e.type === "mindset");
        exercises.splice(mi >= 0 ? mi : exercises.length, 0, {
          name: "F3. Cossack Squat", sets: isDeload ? 1 : 2, reps: "8/side", rest: "60", rir: null,
          detail: "Mobility + strength. Sit deep into hip.",
          group: `FW${weekInMeso}D5`, type: "exercise", superset_label: null,
        });
        changed = true; log.push(`D${dn}: +F3 Cossack Squat`);
      }
    }

    // DAY 6: +Pre-Conditioning Movement Block
    if (dow === 6) {
      if (!exercises.some((e: any) => /pre.*conditioning.*movement/i.test(e.name || ""))) {
        const wi = exercises.findIndex((e: any) => e.type === "warmup");
        exercises.splice(wi >= 0 ? wi + 1 : 0, 0, {
          name: "Pre-Conditioning Movement Block", sets: 3, reps: "3 drills", rest: "60", rir: null,
          detail: "• Lateral Shuffle (10m down/back)\n• Forward Sprint (10-20m)\n• Deceleration Stick (hard stop)\nFocus on movement quality, not fatigue.",
          group: `MW${weekInMeso}D6`, type: "exercise", superset_label: null,
        });
        changed = true; log.push(`D${dn}: +Movement Block`);
      }
    }

    if (changed) {
      const { error: upErr } = await supabase.from("program_days").update({ exercises }).eq("id", day.id);
      if (upErr) log.push(`ERROR D${dn}: ${upErr.message}`);
      else updated++;
    }
  }

  return new Response(JSON.stringify({ updated, total_days: allDays.length, changes: log }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
