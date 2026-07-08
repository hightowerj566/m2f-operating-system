import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROGRAM_ID = "cac5ec9d-e465-4fdc-a460-d5bea36bf06e";

const DAY_LETTERS = ["a", "b", "c", "d", "e", "f"];

const BLOCK_CODES: Record<string, string> = {
  "Explosive Primer": "pp", "Olympic Primer": "pp",
  "Primary Strength Lift": "ps", "Secondary Superset": "sc",
  "Accessory Superset A": "ha", "Accessory Superset B": "hb",
  "Accessory Superset B + Biceps": "hb", "Accessory Superset B + Triceps": "hb",
  "Conditioning Finisher": "cf", "Anti-Extension": "core", "Anti-Rotation": "core",
  "Vertical Core": "core", "Rotational Power": "core", "Loaded Carry": "core",
  "Dead Bug": "core", "Zone 2 Cardio": "cf", "Circuit A": "cf",
  "Circuit B": "cf", "Circuit C": "cf",
};

const BLOCK_PREFIXES: Record<string, string> = {
  "Explosive Primer": "A", "Olympic Primer": "A",
  "Primary Strength Lift": "B", "Secondary Superset": "C",
  "Accessory Superset A": "D", "Accessory Superset B": "E",
  "Accessory Superset B + Biceps": "E", "Accessory Superset B + Triceps": "E",
  "Conditioning Finisher": "F", "Anti-Extension": "B", "Anti-Rotation": "C",
  "Vertical Core": "D", "Rotational Power": "E", "Loaded Carry": "F",
  "Dead Bug": "G", "Zone 2 Cardio": "A", "Circuit A": "B",
  "Circuit B": "C", "Circuit C": "D",
};

function getRIR(week: number, baseRIR: any): string | null {
  if (baseRIR === null || baseRIR === undefined) return null;
  const s = String(baseRIR);
  if (s.includes("to")) {
    const [start, end] = s.split("to").map(x => parseInt(x.trim()));
    const wip = week <= 5 ? week : week - 5;
    const total = week <= 5 ? 5 : 4;
    const rir = Math.round(start - ((wip - 1) / (total - 1)) * (start - end));
    return String(rir);
  }
  return s;
}

function buildDetail(p: any): string {
  const parts: string[] = [];
  if (p.technique) parts.push(p.technique);
  if (p.notes) parts.push(p.notes);
  if (p.load_guidance && !p.load_guidance.includes("1RM")) parts.push(p.load_guidance);
  return parts.join(". ").replace(/\.\./g, ".").trim();
}

function convertDay(dayData: any, week: number, dayIndex: number): any[] {
  const pk = week <= 5 ? "P1" : "P2";
  const dl = DAY_LETTERS[dayIndex];
  const exercises: any[] = [];
  if (!dayData.blocks) return [];

  for (const block of dayData.blocks) {
    const bn = block.block;
    const bc = BLOCK_CODES[bn] || "misc";
    const bp = BLOCK_PREFIXES[bn] || "X";
    const gid = `${bc}${week}${dl}`;
    const ss = block.superset === true;
    const sl = ss ? bn : null;

    if (bn === "Zone 2 Cardio") {
      const pn = block.phases?.[pk]?.notes || "";
      const opts = (block.options || []).join(", ");
      exercises.push({
        name: `${bp}1. Zone 2 Cardio`, detail: `${block.duration_minutes} min. Options: ${opts}. ${pn}`.trim(),
        sets: 1, reps: null, rest: null, rir: null, type: "exercise", group: gid, superset_label: null,
      });
      continue;
    }
    if (!block.exercises) continue;

    block.exercises.forEach((ex: any, i: number) => {
      const pd = ex.phases ? (ex.phases[pk] || ex.phases["P1"] || ex.phases["P2"]) : {
        sets: ex.sets, reps: ex.reps, load_guidance: ex.load_guidance || "",
        RIR: ex.RIR, rest_seconds: ex.rest_seconds || block.rest_seconds || 60, notes: ex.notes || "",
      };
      if (!pd) return;

      const obj: any = {
        name: `${bp}${i + 1}. ${ex.exercise}`, detail: buildDetail(pd),
        sets: typeof pd.sets === "number" ? pd.sets : null, reps: pd.reps || null,
        rest: pd.rest_seconds || block.rest_seconds || null, rir: getRIR(week, pd.RIR),
        type: "exercise", group: gid, superset_label: sl,
      };

      // Olympic lift percentages
      const en = ex.exercise;
      if (en.includes("Power Clean") || en.includes("Hang Power Clean")) {
        obj.percentage = pk === "P1" ? 0.625 : 0.685;
        obj.percentageBase = "Power Clean";
      } else if (en.includes("Power Snatch") || en.includes("Hang Power Snatch")) {
        obj.percentage = pk === "P1" ? 0.575 : 0.635;
        obj.percentageBase = "Power Snatch";
      }

      exercises.push(obj);
    });
  }

  if (dayData.mindset) exercises.push({ name: "Mindset Moment", detail: dayData.mindset, sets: null, reps: null, rest: null, rir: null, type: "mindset", group: null, superset_label: null });
  if (dayData.dad_mission) exercises.push({ name: "Dad Mission", detail: dayData.dad_mission, sets: null, reps: null, rest: null, rir: null, type: "mission", group: null, superset_label: null });

  return exercises;
}

const DAY_THEMES: Record<number, string> = {
  1: "Heavy Upper (Chest Priority)", 2: "Heavy Lower", 3: "Core + Conditioning",
  4: "Hypertrophy Upper + Biceps", 5: "Hypertrophy Lower + Triceps", 6: "Athletic Conditioning",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { template, dry_run } = await req.json();
    if (!template?.days) {
      return new Response(JSON.stringify({ error: "Missing template.days" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: any[] = [];
    const trainingDays = template.days.filter((d: any) => d.day >= 1 && d.day <= 6);

    for (let week = 1; week <= 9; week++) {
      for (const dayData of trainingDays) {
        const dow = dayData.day;
        const dn = (week - 1) * 7 + dow;
        const exercises = convertDay(dayData, week, dow - 1);
        if (exercises.length === 0) continue;

        const label = `Day ${dow} — ${DAY_THEMES[dow]}`;

        if (dry_run) { results.push({ week, dn, label, count: exercises.length }); continue; }

        const { data: existing } = await supabase.from("program_days").select("id")
          .eq("program_id", PROGRAM_ID).eq("day_number", dn).single();

        if (existing) {
          const { error } = await supabase.from("program_days").update({ exercises, label }).eq("id", existing.id);
          results.push(error ? { week, dn, error: error.message } : { week, dn, action: "updated", count: exercises.length });
        } else {
          const { error } = await supabase.from("program_days").insert({ program_id: PROGRAM_ID, day_number: dn, label, exercises });
          results.push(error ? { week, dn, error: error.message } : { week, dn, action: "inserted", count: exercises.length });
        }
      }
      console.log(`Week ${week} done`);
    }

    return new Response(JSON.stringify({ success: true, total: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
