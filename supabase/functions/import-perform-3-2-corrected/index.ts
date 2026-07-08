import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

function mapSectionToType(section: string): string {
  const s = section.toLowerCase();
  if (s.includes("warmup") || s.includes("activation") || s.includes("prep block")) return "warmup";
  if (s.includes("conditioning") || s.includes("interval") || s.includes("mixed modal")) return "conditioning";
  return "exercise";
}

function getExerciseType(name: string, sectionType: string): string {
  const n = name.toLowerCase();
  if (n.includes("mindset moment") || n === "mindset") return "mindset";
  if (n.includes("dad mission") || n === "dad_mission") return "dad_mission";
  if (sectionType === "warmup") return "warmup";
  if (sectionType === "conditioning") return "conditioning";
  return "exercise";
}

function parseRest(rest: string | null | undefined): number | null {
  if (!rest) return null;
  const s = String(rest).trim();
  // "2:30" format
  const colonMatch = s.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  // "90s" or "90 sec"
  const secMatch = s.match(/^(\d+)\s*s/i);
  if (secMatch) return parseInt(secMatch[1]);
  // "2min"
  const minMatch = s.match(/^(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  // Just a number
  const num = parseInt(s);
  return isNaN(num) ? null : num;
}

function buildDetail(ex: any): string {
  const parts: string[] = [];
  if (ex.sets && ex.reps) parts.push(`${ex.sets}×${ex.reps}`);
  if (ex.tempo) parts.push(`Tempo: ${ex.tempo}`);
  if (ex.notes) parts.push(ex.notes);
  // Only append RIR if notes don't already contain it
  if (ex.rir && !(ex.notes && ex.notes.includes("RIR"))) {
    parts.push(`RIR: ${ex.rir}`);
  }
  return parts.join(". ") || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  // Allow overriding program_id and data key via query params or body
  const url = new URL(req.url);
  const PROGRAM_ID = url.searchParams.get("program_id") || body.program_id || DEFAULT_PROGRAM_ID;
  const dataKey = url.searchParams.get("data_key") || "data_6day";

  // Support both { data_6day: [...] } and { data: [...] } and raw array
  const programData = body[dataKey] || body.data_6day || body.data || (Array.isArray(body) ? body : null);
  if (!Array.isArray(programData)) {
    return new Response(JSON.stringify({ error: `Expected '${dataKey}' or 'data_6day' or 'data' array of weeks` }), { status: 400, headers: corsHeaders });
  }

  // Delete existing days
  const { error: delErr } = await supabase
    .from("program_days")
    .delete()
    .eq("program_id", PROGRAM_ID);
  if (delErr) {
    return new Response(JSON.stringify({ error: `Delete failed: ${delErr.message}` }), { status: 500, headers: corsHeaders });
  }

  const rows: any[] = [];
  let globalDay = 0;
  const insertRestDays = url.searchParams.get("insert_rest") === "true";
  // 4-day pattern: Train, Train, Rest, Train, Train, Rest, Rest
  const weekPattern = [true, true, false, true, true, false, false];

  for (const week of programData) {
    const days = week.days || [];
    if (insertRestDays) {
      // Insert training days into the 7-day week pattern
      let trainingIdx = 0;
      for (let slot = 0; slot < 7; slot++) {
        globalDay++;
        if (weekPattern[slot] && trainingIdx < days.length) {
          const day = days[trainingIdx];
          trainingIdx++;
          const label = day.day || `Day ${globalDay}`;
          const exercises: any[] = [];
          for (const section of (day.sections || [])) {
            const sectionType = mapSectionToType(section.section || "");
            for (const ex of (section.exercises || [])) {
              const raw = ex.exercise || "";
              const type = getExerciseType(raw, sectionType);
              const displayName = type === "warmup" ? raw.replace(/^[A-Z]\d+\.\s*/, "") : raw;
              exercises.push({
                name: displayName, type,
                sets: ex.sets || null, reps: ex.reps || null,
                rest: parseRest(ex.rest), rir: ex.rir || null,
                tempo: ex.tempo || null, detail: buildDetail(ex),
              });
            }
          }
          rows.push({ program_id: PROGRAM_ID, day_number: globalDay, label, exercises });
        } else {
          // Rest day
          rows.push({
            program_id: PROGRAM_ID,
            day_number: globalDay,
            label: slot === 2 ? "Active Recovery" : "Rest & Recover",
            exercises: [],
          });
        }
      }
    } else {
      for (const day of days) {
        globalDay++;
        const label = day.day || `Day ${globalDay}`;
        const exercises: any[] = [];
        for (const section of (day.sections || [])) {
          const sectionType = mapSectionToType(section.section || "");
          for (const ex of (section.exercises || [])) {
            const raw = ex.exercise || "";
            const type = getExerciseType(raw, sectionType);
            const displayName = type === "warmup" ? raw.replace(/^[A-Z]\d+\.\s*/, "") : raw;
            exercises.push({
              name: displayName, type,
              sets: ex.sets || null, reps: ex.reps || null,
              rest: parseRest(ex.rest), rir: ex.rir || null,
              tempo: ex.tempo || null, detail: buildDetail(ex),
            });
          }
        }
        rows.push({ program_id: PROGRAM_ID, day_number: globalDay, label, exercises });
      }
    }
  }

  // Update total_days
  await supabase.from("programs").update({ total_days: globalDay }).eq("id", PROGRAM_ID);

  // Insert in chunks of 50
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error: insErr } = await supabase.from("program_days").insert(chunk);
    if (insErr) {
      return new Response(JSON.stringify({ error: `Insert chunk ${i}: ${insErr.message}`, inserted }), {
        status: 500, headers: corsHeaders,
      });
    }
    inserted += chunk.length;
  }

  return new Response(JSON.stringify({ success: true, program_id: PROGRAM_ID, total_days: globalDay, inserted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
