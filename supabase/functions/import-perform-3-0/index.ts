import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types ─────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  role: string;
  pair: string | null;
  rest: number | null;
  intensity: string | null;
}

interface DayTemplate {
  name: string;
  exercises: Exercise[];
}

interface Mesocycle {
  meso: number;
  days: DayTemplate[];
}

interface Phase {
  name: string;
  rep_style: Record<string, string>;
  intensity_budget: number;
  mesocycles: Mesocycle[];
}

interface ProgramJSON {
  program: string;
  phases: Phase[];
}

// ─── EMOM Mesocycle Conditioning (Perform) ─────────────────────────

interface WeekSession {
  moves: [string, string, string, string];
  note: string;
}

interface MesocycleConditioning {
  weeks: [WeekSession, WeekSession, WeekSession, WeekSession];
}

const PERFORM_MESOCYCLES: MesocycleConditioning[] = [
  { weeks: [
    { moves: ["15/12 Cal Row", "12 DB Thrusters (moderate)", "14/11 Cal Bike", "12 Toes-to-Bar"], note: "Thrusters fluid — breathe at the top. TTB unbroken or 2 quick sets. Pace machines at 7/10 effort." },
    { moves: ["14/11 Cal Ski Erg", "8 Power Cleans (50% 1RM)", "15/12 Cal Row", "10 Burpee Box Jumps (20\")"], note: "Cleans touch-and-go — if doing singles by round 4, go lighter. Step down on box jumps." },
    { moves: ["12/9 Cal Bike", "8 DB Snatches (4 each arm)", "150m Shuttle Run", "10 Pull-Ups"], note: "DB snatches alternate arms each rep. Shuttle runs 25m out-and-back x3. Pull-ups scale to 8 if breaking." },
    { moves: ["15/12 Cal Row", "10 Wall Balls (20/14 lb)", "14/11 Cal Ski Erg", "50 Double Unders"], note: "Wall balls unbroken — use 14 lb if breaking before round 7. Scale DU to 60 singles." },
  ]},
  { weeks: [
    { moves: ["12/9 Cal Bike", "12 KB Swings (heavy)", "15/12 Cal Row", "15 Push-Ups"], note: "KB swings Russian-style to eye level. Push-ups full ROM, chest to floor. Bike steady cadence 70+ RPM." },
    { moves: ["15/12 Cal Row", "8 Sandbag Cleans (moderate)", "14/11 Cal Ski Erg", "10 Box Jumps (20\", step down)"], note: "Sandbag cleans bear hug and stand. No sandbag? Sub 10 DB Hang Cleans. Step down every box jump." },
    { moves: ["14/11 Cal Ski Erg", "10 Goblet Squats (heavy KB)", "12/9 Cal Bike", "8 Burpees"], note: "Goblet squats below parallel. Burpees steady, not sprinted. Breathe on the way down." },
    { moves: ["12/9 Cal Bike", "10 DB Thrusters (moderate)", "15/12 Cal Row", "12 Toes-to-Bar"], note: "Duration is long — pace 6/10 for rounds 1–5, build to 8/10 in rounds 8–10." },
  ]},
  { weeks: [
    { moves: ["14/11 Cal Ski Erg", "6 Power Cleans (55% 1RM)", "12/9 Cal Bike", "10 Pull-Ups"], note: "Cleans heavier this meso — crisp singles or touch-and-go doubles. Pull-ups strict: scale to 8." },
    { moves: ["15/12 Cal Row", "8 DB Snatches (4 each arm)", "30m Farmer Carry (heavy)", "10 Burpee Box Jumps (20\")"], note: "Farmer carry heavy — grip is the limiter. DB snatches explosive hip drive. Step down box jumps." },
    { moves: ["12/9 Cal Bike", "10 Wall Balls (20/14 lb)", "15/12 Cal Row", "50 Double Unders"], note: "Wall balls unbroken. DU scale to 60 singles. Row at 1:45–1:50/500m pace." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (heavy)", "12/9 Cal Bike", "15 Push-Ups"], note: "Long EMOM — conserve early. KB swings explosive but controlled. Final 3 rounds push to 8/10." },
  ]},
];

const EMOM_DURATIONS: Record<number, { minutes: number; rounds: number }> = {
  1: { minutes: 28, rounds: 7 },
  2: { minutes: 32, rounds: 8 },
  3: { minutes: 36, rounds: 9 },
  4: { minutes: 40, rounds: 10 },
};

// ─── Weekly progression ────────────────────────────────────────────

function adjustSetsForWeek(baseSets: number, role: string, weekInMeso: number): number {
  if (weekInMeso === 4) return Math.max(2, Math.ceil(baseSets * 0.5));
  if (weekInMeso >= 2 && (role === "secondary" || role === "accessory")) return baseSets + 1;
  return baseSets;
}

function getRIR(weekInMeso: number, role: string): string | null {
  if (role === "conditioning") return null;
  if (weekInMeso === 4) return "4";
  if (role === "explosive") return weekInMeso === 1 ? "3" : "2";
  if (role === "primary") return weekInMeso === 1 ? "3" : weekInMeso === 2 ? "2" : "1";
  if (role === "core" || role === "structural") return weekInMeso === 1 ? "3" : "2";
  return weekInMeso === 1 ? "3" : weekInMeso === 2 ? "2" : "1";
}

function getTempo(role: string): string | null {
  switch (role) {
    case "primary":      return "3-1-1-0";
    case "secondary":    return "3-0-1-1";
    case "accessory":    return "2-0-1-1";
    case "core":         return "2-1-2-0";
    case "structural":   return "2-1-2-0";
    case "explosive":    return null;
    case "conditioning": return null;
    default:             return "2-0-1-1";
  }
}

// ─── Day converter (no mindset/missions) ───────────────────────────

function convertDay(dayTemplate: DayTemplate, dayIdx: number, weekNum: number, weekInMeso: number): any[] {
  const exercises: any[] = [];
  const wk = `W${weekNum}D${dayIdx + 1}`;

  const pairGroups: Record<string, Exercise[]> = {};
  const processed = new Set<string>();

  dayTemplate.exercises.forEach((ex) => {
    if (ex.pair) {
      if (!pairGroups[ex.pair]) pairGroups[ex.pair] = [];
      pairGroups[ex.pair].push(ex);
    }
  });

  let letterIdx = 0;
  const LETTERS = "ABCDEFGHIJK";

  for (let i = 0; i < dayTemplate.exercises.length; i++) {
    const ex = dayTemplate.exercises[i];

    if (ex.pair) {
      if (processed.has(ex.pair)) continue;
      processed.add(ex.pair);

      const group = pairGroups[ex.pair];
      const letter = LETTERS[letterIdx++];
      const groupId = `${letter}${wk}`;
      const label = group.length >= 3 ? "Tri-Set" : group.length === 2 ? "Superset" : null;

      group.forEach((gEx, gi) => {
        const sets = adjustSetsForWeek(gEx.sets, gEx.role, weekInMeso);
        const rir = getRIR(weekInMeso, gEx.role);
        const isLast = gi === group.length - 1;
        const tempo = getTempo(gEx.role);
        const detailParts: string[] = [];
        if (tempo) detailParts.push(`Tempo ${tempo}`);
        if (gEx.intensity) detailParts.push(gEx.intensity);
        const detail = detailParts.length > 0 ? detailParts.join(". ") : "";

        exercises.push({
          name: `${letter}${gi + 1}. ${gEx.name}`,
          detail,
          sets,
          reps: gEx.reps,
          rir,
          rest: isLast ? (gEx.rest || 60) : null,
          type: gEx.role === "conditioning" ? "conditioning" : "exercise",
          group: groupId,
          superset_label: group.length > 1 ? label : null,
        });
      });
    } else {
      const letter = LETTERS[letterIdx++];
      const groupId = `${letter}${wk}`;
      const sets = adjustSetsForWeek(ex.sets, ex.role, weekInMeso);
      const rir = getRIR(weekInMeso, ex.role);
      const tempo = getTempo(ex.role);
      const detailParts: string[] = [];
      if (tempo) detailParts.push(`Tempo ${tempo}`);
      if (ex.intensity) detailParts.push(ex.intensity);
      const detail = detailParts.length > 0 ? detailParts.join(". ") : "";

      exercises.push({
        name: `${letter}1. ${ex.name}`,
        detail,
        sets,
        reps: ex.reps,
        rir,
        rest: ex.rest,
        type: ex.role === "conditioning" ? "conditioning" : "exercise",
        group: groupId,
        superset_label: null,
      });
    }
  }

  return exercises;
}

// ─── Rest day builder (no mindset/mission) ─────────────────────────

function buildRestDay(dayInWeek: number): any[] {
  const isActive = dayInWeek === 6;
  return [
    {
      name: isActive ? "Active Recovery" : "Full Rest Day",
      detail: isActive
        ? "Light movement day. Focus on mobility, stretching, and low-intensity activity."
        : "Complete rest. Sleep in, eat well, hydrate. Your body grows during recovery, not during training.",
      sets: 1, reps: null, rir: null, rest: null,
      type: "rest", group: null, superset_label: null,
    },
    ...(isActive ? [{
      name: "Mobility Flow",
      detail: "10-15 min full body stretch. Hip openers, thoracic spine rotation, hamstring stretches, shoulder dislocates.",
      sets: 1, reps: "10-15 min", rir: null, rest: null,
      type: "warmup", group: null, superset_label: null,
    }] : []),
  ];
}

// ─── Saturday EMOM conditioning builder (no mindset/mission) ───────

function buildConditioningDay(globalMeso: number, weekInMeso: number): any[] {
  const meso = PERFORM_MESOCYCLES[(globalMeso - 1) % PERFORM_MESOCYCLES.length];
  const session = meso.weeks[weekInMeso - 1];
  const dur = EMOM_DURATIONS[weekInMeso];
  const detail = session.moves.map((m, i) => `Minute ${i + 1}: ${m}`).join("\n");

  return [
    {
      name: `EMOM ${dur.minutes} Minutes`,
      detail,
      sets: dur.rounds,
      reps: `${dur.minutes} min`,
      rir: null, rest: null,
      type: "conditioning", group: null, superset_label: null,
    },
    {
      name: "Coaching Note",
      detail: `${session.note} Repeat for ${dur.rounds} rounds.`,
      sets: 1, reps: null, rir: null, rest: null,
      type: "note", group: null, superset_label: null,
    },
  ];
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { program_json, days_per_week = 7 } = body;
    let { program_id } = body;

    if (!program_json) {
      return new Response(JSON.stringify({ error: "program_json required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auto-create program if not supplied
    if (!program_id) {
      const { data: prog, error: pErr } = await supabase
        .from("programs")
        .insert({
          name: program_json.program || "M2F Perform 3.0",
          description: "M2F Perform 3.0 — 6 mesocycles × 4 weeks. Physique Build → Strength & Performance.",
          is_published: true,
        })
        .select("id")
        .single();
      if (pErr || !prog) {
        return new Response(JSON.stringify({ error: `Program create failed: ${pErr?.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      program_id = prog.id;
    } else {
      // Clear any existing days for a clean re-import
      await supabase.from("program_days").delete().eq("program_id", program_id);
    }

    const data: ProgramJSON = program_json;
    const results: string[] = [];
    const allRows: any[] = [];
    let globalWeek = 0;
    let globalMeso = 0;

    for (const phase of data.phases) {
      for (const meso of phase.mesocycles) {
        globalMeso++;
        for (let weekInMeso = 1; weekInMeso <= 4; weekInMeso++) {
          globalWeek++;
          const deloadTag = weekInMeso === 4 ? " [DELOAD]" : "";

          for (let dayIdx = 0; dayIdx < meso.days.length; dayIdx++) {
            const dayTemplate = meso.days[dayIdx];
            const dayNumber = (globalWeek - 1) * days_per_week + (dayIdx + 1);
            const exercises = convertDay(dayTemplate, dayIdx, globalWeek, weekInMeso);
            const label = `Day ${dayIdx + 1} — ${dayTemplate.name}${deloadTag}`;
            allRows.push({ program_id, day_number: dayNumber, label, exercises });
            results.push(`W${globalWeek} D${dayIdx + 1}: ${exercises.length} ex`);
          }

          const d6 = (globalWeek - 1) * days_per_week + 6;
          const d6Exercises = buildConditioningDay(globalMeso, weekInMeso);
          const d6Dur = EMOM_DURATIONS[weekInMeso];
          allRows.push({ program_id, day_number: d6, label: `Day 6 — Saturday Conditioning: EMOM ${d6Dur.minutes}`, exercises: d6Exercises });

          const d7 = (globalWeek - 1) * days_per_week + 7;
          allRows.push({ program_id, day_number: d7, label: `Day 7 — Rest Day${deloadTag}`, exercises: buildRestDay(7) });
        }
      }
    }

    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) results.push(`Batch ${Math.floor(i / 50) + 1} error: ${error.message}`);
    }

    const totalDays = globalWeek * days_per_week;
    await supabase.from("programs").update({ total_days: totalDays, published_through_day: totalDays }).eq("id", program_id);

    return new Response(JSON.stringify({
      success: true,
      program_id,
      total_weeks: globalWeek,
      total_days: totalDays,
      rows_inserted: allRows.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
