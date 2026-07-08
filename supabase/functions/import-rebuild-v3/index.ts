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

interface DayTemplate { name: string; exercises: Exercise[]; }
interface Mesocycle { meso: number; days: DayTemplate[]; }
interface Phase { name: string; rep_style: Record<string, string>; intensity_budget: number; mesocycles: Mesocycle[]; }
interface ProgramJSON { program: string; phases: Phase[]; }

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

function getMindset(w: number, d: number): string { return MINDSET[((w - 1) * 5 + (d - 1)) % MINDSET.length]; }
function getMission(w: number, d: number): string { return MISSIONS[((w - 1) * 5 + (d - 1)) % MISSIONS.length]; }

// ─── Rebuild EMOM Mesocycles ───────────────────────────────────────

interface WeekSession { moves: [string, string, string, string]; note: string; }
interface MesocycleConditioning { weeks: [WeekSession, WeekSession, WeekSession, WeekSession]; }

const REBUILD_MESOCYCLES: MesocycleConditioning[] = [
  { weeks: [
    { moves: ["15/12 Cal Row", "12 KB Swings (moderate)", "14/11 Cal Bike", "12 Ring Rows"], note: "KB swings Russian-style — hip snap, not arm pull. Ring rows chest-to-rings, adjust foot position to scale." },
    { moves: ["14/11 Cal Ski Erg", "10 DB Goblet Squats (moderate)", "15/12 Cal Row", "12 Box Step-Ups (20\", alternating)"], note: "Goblet squats controlled 2s descent. Step-ups alternating legs, drive through heel. No jumping." },
    { moves: ["12/9 Cal Bike", "8 DB Hang Cleans (4 each arm)", "150m Shuttle Run", "10 Hanging Knee Raises"], note: "DB hang cleans smooth — hinge, pop, catch at shoulders. Knee raises controlled, no kipping." },
    { moves: ["15/12 Cal Row", "10 Wall Balls (14/10 lb)", "14/11 Cal Ski Erg", "50 Jump Rope Singles"], note: "Wall balls lighter weight. Jump rope steady rhythm. Push pace on final 2 rounds." },
  ]},
  { weeks: [
    { moves: ["12/9 Cal Bike", "10 Goblet Squats (moderate KB)", "15/12 Cal Row", "15 Push-Ups"], note: "Goblet squats below parallel. Push-ups full ROM — scale to knees if breaking before round 5." },
    { moves: ["15/12 Cal Row", "10 DB Reverse Lunges (moderate)", "14/11 Cal Ski Erg", "12 Box Step-Ups (20\", alternating)"], note: "Reverse lunges DBs at sides — no front rack. Step-ups controlled. Ski smooth pulls." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "8 Incline Push-Ups + 8 Air Squats"], note: "Incline push-ups on bench reduces shoulder load. Air squats controlled with pause at bottom." },
    { moves: ["12/9 Cal Bike", "10 DB Floor Press (moderate)", "15/12 Cal Row", "12 Ring Rows"], note: "Floor press eliminates shoulder stress — control the negative. Ring rows adjust angle for difficulty." },
  ]},
  { weeks: [
    { moves: ["14/11 Cal Ski Erg", "8 DB Hang Cleans (4 each arm)", "12/9 Cal Bike", "10 Hanging Knee Raises"], note: "DB hang cleans explosive hip drive. Knee raises slow and controlled. Ski long pulls." },
    { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "30m Farmer Carry (moderate)", "12 Box Step-Ups (20\", alternating)"], note: "Farmer carry moderate grip challenge. Goblet squats controlled. Step-ups drive through heel." },
    { moves: ["12/9 Cal Bike", "10 Wall Balls (14/10 lb)", "15/12 Cal Row", "50 Jump Rope Singles"], note: "Wall balls lighter, unbroken every round. Jump rope steady rhythm. Row at 1:50–1:55/500m." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "15 Push-Ups"], note: "Long EMOM — conserve early. KB swings controlled. Push-ups full ROM. Build effort final 3 rounds." },
  ]},
  { weeks: [
    { moves: ["15/12 Cal Row", "10 DB Goblet Squats (moderate)", "14/11 Cal Ski Erg", "12 Ring Rows"], note: "Goblet squats focus on depth and control. Ring rows chest to rings. Row moderate pace." },
    { moves: ["12/9 Cal Bike", "8 DB Hang Cleans (4 each arm)", "15/12 Cal Row", "10 Hanging Knee Raises"], note: "Hang cleans smooth transitions. Knee raises no swinging. Bike steady cadence." },
    { moves: ["14/11 Cal Ski Erg", "10 DB Floor Press (moderate)", "12/9 Cal Bike", "8 Incline Push-Ups + 8 Air Squats"], note: "Floor press controlled negatives. Incline push-ups on bench. Air squats with pause." },
    { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "150m Shuttle Run", "12 Ring Rows + 10 Dead Bugs"], note: "Longest duration — pacing is key. Dead bugs slow, press low back to floor. Shuttle runs controlled." },
  ]},
  { weeks: [
    { moves: ["12/9 Cal Bike", "10 DB Reverse Lunges (moderate)", "15/12 Cal Row", "15 Push-Ups"], note: "Reverse lunges DBs at sides. Push-ups full ROM. Bike steady. Pace 6/10 early." },
    { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "50 Jump Rope Singles"], note: "KB swings hip snap — explosive but controlled. Jump rope steady rhythm. Ski smooth." },
    { moves: ["15/12 Cal Row", "10 DB Goblet Squats (moderate)", "14/11 Cal Ski Erg", "12 Box Step-Ups (20\", alternating)"], note: "Goblet squats controlled descent. Step-ups alternating, no jumping. Row at 1:50/500m." },
    { moves: ["12/9 Cal Bike", "10 Wall Balls (14/10 lb)", "15/12 Cal Row", "12 Ring Rows"], note: "Wall balls lighter, unbroken. Ring rows full extension to contraction. Final 3 rounds push effort." },
  ]},
  { weeks: [
    { moves: ["15/12 Cal Row", "8 DB Hang Cleans (4 each arm)", "12/9 Cal Bike", "10 Hanging Knee Raises"], note: "Hang cleans explosive. Knee raises controlled. Row moderate. Pace 7/10." },
    { moves: ["14/11 Cal Ski Erg", "10 DB Floor Press (moderate)", "15/12 Cal Row", "15 Push-Ups"], note: "Floor press controlled. Push-ups chest to floor. Ski long pulls. Build effort mid-rounds." },
    { moves: ["12/9 Cal Bike", "12 KB Swings (moderate)", "14/11 Cal Ski Erg", "8 Incline Push-Ups + 8 Air Squats"], note: "KB swings eye level. Incline push-ups on bench. Air squats paused. Bike high cadence." },
    { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "12/9 Cal Bike", "50 Jump Rope Singles"], note: "Longest EMOM — discipline the pace. Goblet squats controlled. Jump rope steady." },
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
    case "primary": return "3-1-1-0";
    case "secondary": return "3-0-1-1";
    case "accessory": return "2-0-1-1";
    case "core": case "structural": return "2-1-2-0";
    case "explosive": case "conditioning": return null;
    default: return "2-0-1-1";
  }
}

// ─── Day converter ─────────────────────────────────────────────────

function convertDay(dayTemplate: DayTemplate, dayIdx: number, weekNum: number, weekInMeso: number): any[] {
  const exercises: any[] = [];
  const wk = `W${weekNum}D${dayIdx + 1}`;
  const pairGroups: Record<string, Exercise[]> = {};
  const processed = new Set<string>();

  dayTemplate.exercises.forEach((ex) => {
    if (ex.pair) { if (!pairGroups[ex.pair]) pairGroups[ex.pair] = []; pairGroups[ex.pair].push(ex); }
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
        exercises.push({ name: `${letter}${gi + 1}. ${gEx.name}`, detail: detailParts.join(". "), sets, reps: gEx.reps, rir, rest: isLast ? (gEx.rest || 60) : null, type: "exercise", group: groupId, superset_label: group.length > 1 ? label : null });
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
      exercises.push({ name: `${letter}1. ${ex.name}`, detail: detailParts.join(". "), sets, reps: ex.reps, rir, rest: ex.rest, type: ex.role === "conditioning" ? "conditioning" : "exercise", group: groupId, superset_label: null });
    }
  }

  exercises.push({ name: "Mindset Moment", detail: getMindset(weekNum, dayIdx + 1), sets: 1, reps: null, rir: null, rest: null, type: "mindset", group: null, superset_label: null });
  exercises.push({ name: "Dad Mission", detail: getMission(weekNum, dayIdx + 1), sets: 1, reps: null, rir: null, rest: null, type: "mission", group: null, superset_label: null });
  return exercises;
}

// ─── Rest day builder ──────────────────────────────────────────────

function buildRestDay(weekNum: number, dayInWeek: number): any[] {
  const isActive = dayInWeek === 6;
  return [
    { name: isActive ? "Active Recovery" : "Full Rest Day", detail: isActive ? "Light movement day. Focus on mobility, stretching, and low-intensity activity." : "Complete rest. Sleep in, eat well, hydrate.", sets: 1, reps: null, rir: null, rest: null, type: "rest", group: null, superset_label: null },
    { name: isActive ? "Mobility Flow" : "Mindset Moment", detail: isActive ? "10-15 min full body stretch. Hip openers, thoracic spine rotation, hamstring stretches." : getMindset(weekNum, dayInWeek), sets: 1, reps: isActive ? "10-15 min" : null, rir: null, rest: null, type: isActive ? "warmup" : "mindset", group: null, superset_label: null },
    { name: "Dad Mission", detail: getMission(weekNum, dayInWeek), sets: 1, reps: null, rir: null, rest: null, type: "mission", group: null, superset_label: null },
  ];
}

// ─── Saturday EMOM conditioning builder (Rebuild) ──────────────────

function buildConditioningDay(globalMeso: number, weekInMeso: number, weekNum: number): any[] {
  const meso = REBUILD_MESOCYCLES[(globalMeso - 1) % REBUILD_MESOCYCLES.length];
  const session = meso.weeks[weekInMeso - 1];
  const dur = EMOM_DURATIONS[weekInMeso];
  const detail = session.moves.map((m, i) => `Minute ${i + 1}: ${m}`).join("\n");

  return [
    { name: `EMOM ${dur.minutes} Minutes`, detail, sets: dur.rounds, reps: `${dur.minutes} min`, rir: null, rest: null, type: "conditioning", group: null, superset_label: null },
    { name: "Coaching Note", detail: `${session.note} Repeat for ${dur.rounds} rounds.`, sets: 1, reps: null, rir: null, rest: null, type: "note", group: null, superset_label: null },
    { name: "Mindset Moment", detail: getMindset(weekNum, 6), sets: 1, reps: null, rir: null, rest: null, type: "mindset", group: null, superset_label: null },
    { name: "Dad Mission", detail: getMission(weekNum, 6), sets: 1, reps: null, rir: null, rest: null, type: "mission", group: null, superset_label: null },
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

          for (let dayIdx = 0; dayIdx < meso.days.length; dayIdx++) {
            const dayTemplate = meso.days[dayIdx];
            const dayNumber = (globalWeek - 1) * days_per_week + (dayIdx + 1);
            const exercises = convertDay(dayTemplate, dayIdx, globalWeek, weekInMeso);
            const label = `Day ${dayIdx + 1} — ${dayTemplate.name}${deloadTag}`;
            allRows.push({ program_id, day_number: dayNumber, label, exercises });
            results.push(`✅ W${globalWeek} D${dayIdx + 1} (#${dayNumber}): ${exercises.length} ex [M${meso.meso} ${phase.name}]`);
          }

          const d6 = (globalWeek - 1) * days_per_week + 6;
          const d6Exercises = buildConditioningDay(globalMeso, weekInMeso, globalWeek);
          const d6Dur = EMOM_DURATIONS[weekInMeso];
          const mesoIdx = ((globalMeso - 1) % REBUILD_MESOCYCLES.length) + 1;
          allRows.push({ program_id, day_number: d6, label: `Day 6 — Saturday Conditioning: EMOM ${d6Dur.minutes}`, exercises: d6Exercises });
          results.push(`✅ W${globalWeek} D6 (#${d6}): EMOM ${d6Dur.minutes} [Rebuild Meso ${mesoIdx} Wk ${weekInMeso}]`);

          const d7 = (globalWeek - 1) * days_per_week + 7;
          allRows.push({ program_id, day_number: d7, label: `Day 7 — Rest Day${deloadTag}`, exercises: buildRestDay(globalWeek, 7) });
          results.push(`✅ W${globalWeek} D7 (#${d7}): Rest`);
        }
      }
    }

    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) results.push(`❌ Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
    }

    const totalDays = globalWeek * days_per_week;
    await supabase.from("programs").update({ total_days: totalDays, published_through_day: totalDays }).eq("id", program_id);

    return new Response(JSON.stringify({ success: true, total_weeks: globalWeek, total_days: totalDays, phases: data.phases.length, mesocycles: data.phases.reduce((s, p) => s + p.mesocycles.length, 0), results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
