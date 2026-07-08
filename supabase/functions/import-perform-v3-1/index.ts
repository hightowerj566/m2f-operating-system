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
  tempo: string | null;
  rir: number | null;
  rest: number;
  role: string;
  pair: string | null;
  intensity: string | null;
  notes: string;
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
  tempo_defaults: Record<string, string>;
  rir_defaults: Record<string, number | null>;
  intensity_budget: string;
  conditioning_focus: string;
  mesocycles: Mesocycle[];
}

interface ProgramJSON {
  program: string;
  phases: Phase[];
}

// ─── Content pools ─────────────────────────────────────────────────

const MINDSET = [
  "Strength isn't built in comfort — it's forged in the struggle. Show your kids what consistency looks like.",
  "Your family is watching. Every rep you do today shows them what discipline really means.",
  "Recovery isn't weakness — it's wisdom. Rest hard so you can train harder tomorrow.",
  "The hinges of your life — your back, your hips — deserve the same attention you give the mirror muscles.",
  "Lead from the front. When your kids see you push through hard things, they learn they can too.",
  "You don't have to be perfect — you just have to keep showing up. That's the lesson your kids need.",
  "Today's rest makes tomorrow's performance possible. Trust the process.",
  "The strongest thing a father can do is take care of himself so he can take care of everyone else.",
  "Progress isn't always visible. Some of your best growth happens when nobody's watching.",
  "Your kids won't remember your PRs — they'll remember that you never quit.",
];
const MISSIONS = [
  "Spend 10 minutes helping your child with something they're struggling with — guide, don't take over.",
  "Put your phone away during dinner tonight. Be fully present.",
  "Take a 15-minute walk with your family today. No agenda, just connection.",
  "Tell your kid about a time you failed and what you learned from it.",
  "Ask your child what made them laugh today — then really listen.",
  "Do something active with your kids today — play catch, wrestle, race them in the yard.",
  "Today is for recharging. Spend quality time with your family without screens.",
  "Write a short note to your kid telling them something you're proud of about them.",
  "Let your child teach you something today. Be the student.",
  "Plan something fun with your family for this weekend. Anticipation matters.",
];

function getMindset(w: number, d: number): string {
  return MINDSET[((w - 1) * 5 + (d - 1)) % MINDSET.length];
}
function getMission(w: number, d: number): string {
  return MISSIONS[((w - 1) * 5 + (d - 1)) % MISSIONS.length];
}

// ─── EMOM Conditioning (reuse from Perform system) ─────────────────

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
  { weeks: [
    { moves: ["15/12 Cal Row", "8 Sandbag Squats (moderate)", "14/11 Cal Ski Erg", "12 Toes-to-Bar"], note: "Sandbag squats bear hug — below parallel. TTB unbroken or quick doubles." },
    { moves: ["12/9 Cal Bike", "6 Power Cleans (50% 1RM)", "15/12 Cal Row", "10 Box Jumps (20\", step down)"], note: "Cleans crisp and controlled. Step down every box jump. Bike at 7/10." },
    { moves: ["14/11 Cal Ski Erg", "10 DB Thrusters (moderate)", "12/9 Cal Bike", "8 Burpees"], note: "Thrusters fluid — use the legs. Burpees at a pace you can hold for all 9 rounds." },
    { moves: ["15/12 Cal Row", "10 Goblet Squats (heavy KB)", "150m Shuttle Run", "10 Pull-Ups"], note: "Longest duration — pacing is everything. Goblet squats controlled. Pull-ups scale to 8 if failing." },
  ]},
  { weeks: [
    { moves: ["12/9 Cal Bike", "8 DB Snatches (4 each arm)", "15/12 Cal Row", "15 Push-Ups"], note: "DB snatches alternate arms. Push-ups full ROM — scale to knees if breaking before round 5." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (heavy)", "12/9 Cal Bike", "50 Double Unders"], note: "KB swings Russian-style, explosive. DU unbroken or scale to 60 singles." },
    { moves: ["15/12 Cal Row", "8 Sandbag Cleans (moderate)", "14/11 Cal Ski Erg", "10 Burpee Box Jumps (20\")"], note: "Sandbag cleans explosive — no grinding. Step down box jumps." },
    { moves: ["12/9 Cal Bike", "10 Wall Balls (20/14 lb)", "15/12 Cal Row", "12 Toes-to-Bar"], note: "Final week is long — discipline the pace. Wall balls unbroken. TTB quick sets of 4–6 if needed." },
  ]},
  { weeks: [
    { moves: ["15/12 Cal Row", "6 Power Cleans (55% 1RM)", "12/9 Cal Bike", "10 Box Jumps (20\", step down)"], note: "Cleans heavy singles — no touch-and-go above 55%. Step down box jumps." },
    { moves: ["14/11 Cal Ski Erg", "10 DB Thrusters (moderate)", "15/12 Cal Row", "10 Pull-Ups"], note: "Thrusters unbroken — breathe at the top. Pull-ups kipping or strict." },
    { moves: ["12/9 Cal Bike", "12 KB Swings (heavy)", "14/11 Cal Ski Erg", "8 Burpees"], note: "KB swings eye level — hip snap. Burpees controlled. Build effort rounds 7–9." },
    { moves: ["15/12 Cal Row", "8 DB Snatches (4 each arm)", "12/9 Cal Bike", "50 Double Unders"], note: "Longest EMOM — pacing wins. DB snatches crisp. DU unbroken or 60 singles." },
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
  if (weekInMeso === 3 && (role === "primary" || role === "secondary")) return baseSets + 1;
  if (weekInMeso >= 2 && (role === "accessory")) return baseSets + 1;
  return baseSets;
}

function getRIR(weekInMeso: number, role: string, baseRir: number | null): string | null {
  if (role === "conditioning" || role === "structural") return baseRir != null ? String(baseRir) : null;
  if (weekInMeso === 4) return "4";
  if (role === "explosive") return null;
  if (baseRir == null) return null;
  // Scale RIR across the meso: week 1 = base, week 2 = base-1, week 3 = base-2
  const scaled = Math.max(0, baseRir - (weekInMeso - 1));
  return String(scaled);
}

// ─── Day converter ─────────────────────────────────────────────────

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
  const LETTERS = "ABCDEFGHIJKLM";

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
        const rir = getRIR(weekInMeso, gEx.role, gEx.rir);
        const isLast = gi === group.length - 1;

        const detailParts: string[] = [];
        if (gEx.notes) detailParts.push(gEx.notes);
        if (gEx.tempo && gEx.tempo !== "X") detailParts.push(`Tempo ${gEx.tempo}`);
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
      const rir = getRIR(weekInMeso, ex.role, ex.rir);

      const detailParts: string[] = [];
      if (ex.notes) detailParts.push(ex.notes);
      if (ex.tempo && ex.tempo !== "X") detailParts.push(`Tempo ${ex.tempo}`);
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

  exercises.push({
    name: "Mindset Moment",
    detail: getMindset(weekNum, dayIdx + 1),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mindset", group: null, superset_label: null,
  });
  exercises.push({
    name: "Dad Mission",
    detail: getMission(weekNum, dayIdx + 1),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mission", group: null, superset_label: null,
  });

  return exercises;
}

// ─── Rest day builder ──────────────────────────────────────────────

function buildRestDay(weekNum: number, dayInWeek: number): any[] {
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
    {
      name: isActive ? "Mobility Flow" : "Mindset Moment",
      detail: isActive
        ? "10-15 min full body stretch. Hip openers, thoracic spine rotation, hamstring stretches, shoulder dislocates."
        : getMindset(weekNum, dayInWeek),
      sets: 1, reps: isActive ? "10-15 min" : null, rir: null, rest: null,
      type: isActive ? "warmup" : "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: getMission(weekNum, dayInWeek),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ─── Saturday EMOM conditioning builder ────────────────────────────

function buildConditioningDay(globalMeso: number, weekInMeso: number, weekNum: number): any[] {
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
    {
      name: "Mindset Moment",
      detail: getMindset(weekNum, 6),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: getMission(weekNum, 6),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { program_id, storage_path, days_per_week = 7 } = await req.json();
    if (!program_id || !storage_path) {
      return new Response(JSON.stringify({ error: "program_id and storage_path required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Download JSON from storage
    const { data: fileData, error: dlError } = await supabase.storage.from("exercise-videos").download(storage_path);
    if (dlError || !fileData) {
      return new Response(JSON.stringify({ error: `Download failed: ${dlError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data: ProgramJSON = JSON.parse(await fileData.text());
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

          // 5 training days
          for (let dayIdx = 0; dayIdx < meso.days.length; dayIdx++) {
            const dayTemplate = meso.days[dayIdx];
            const dayNumber = (globalWeek - 1) * days_per_week + (dayIdx + 1);
            const exercises = convertDay(dayTemplate, dayIdx, globalWeek, weekInMeso);
            const label = `Day ${dayIdx + 1} — ${dayTemplate.name}${deloadTag}`;
            allRows.push({ program_id, day_number: dayNumber, label, exercises });
            results.push(`✅ W${globalWeek} D${dayIdx + 1} (#${dayNumber}): ${exercises.length} ex [M${meso.meso} ${phase.name}]`);
          }

          // Day 6: Saturday EMOM Conditioning
          const d6 = (globalWeek - 1) * days_per_week + 6;
          const d6Exercises = buildConditioningDay(globalMeso, weekInMeso, globalWeek);
          const d6Dur = EMOM_DURATIONS[weekInMeso];
          allRows.push({ program_id, day_number: d6, label: `Day 6 — Saturday Conditioning: EMOM ${d6Dur.minutes}${deloadTag}`, exercises: d6Exercises });
          results.push(`✅ W${globalWeek} D6 (#${d6}): EMOM ${d6Dur.minutes}`);

          // Day 7: Full Rest
          const d7 = (globalWeek - 1) * days_per_week + 7;
          allRows.push({ program_id, day_number: d7, label: `Day 7 — Rest Day${deloadTag}`, exercises: buildRestDay(globalWeek, 7) });
          results.push(`✅ W${globalWeek} D7 (#${d7}): Rest`);
        }
      }
    }

    // Batch upsert in chunks of 50
    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) {
        results.push(`❌ Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
      }
    }

    // Update program total_days
    const totalDays = globalWeek * days_per_week;
    await supabase.from("programs").update({ total_days: totalDays, published_through_day: totalDays }).eq("id", program_id);

    return new Response(JSON.stringify({
      success: true,
      total_weeks: globalWeek,
      total_days: totalDays,
      phases: data.phases.length,
      mesocycles: data.phases.reduce((s, p) => s + p.mesocycles.length, 0),
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
