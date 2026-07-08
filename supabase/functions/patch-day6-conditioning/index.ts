import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types ─────────────────────────────────────────────────────────

interface WeekSession {
  moves: [string, string, string, string]; // Engine, Strength, Engine, Skill
  note: string;
}

interface MesocycleConditioning {
  weeks: [WeekSession, WeekSession, WeekSession, WeekSession];
}

// ─── Duration Progression (per week in meso) ───────────────────────

const EMOM_DURATIONS: Record<number, { minutes: number; rounds: number }> = {
  1: { minutes: 28, rounds: 7 },
  2: { minutes: 32, rounds: 8 },
  3: { minutes: 36, rounds: 9 },
  4: { minutes: 40, rounds: 10 },
};

// ─── PERFORM Mesocycles (6 total, 24 weeks) ────────────────────────

const PERFORM_MESOCYCLES: MesocycleConditioning[] = [
  // Meso 1 — Row/Bike Foundation
  {
    weeks: [
      { moves: ["15/12 Cal Row", "12 DB Thrusters (moderate)", "14/11 Cal Bike", "12 Toes-to-Bar"], note: "Thrusters fluid — breathe at the top, don't rush the press. TTB unbroken or 2 quick sets. Pace machines at 7/10 effort." },
      { moves: ["14/11 Cal Ski Erg", "8 Power Cleans (50% 1RM)", "15/12 Cal Row", "10 Burpee Box Jumps (20\")"], note: "Cleans touch-and-go — if doing singles by round 4, go lighter. Step down on box jumps every rep. Ski smooth pulls." },
      { moves: ["12/9 Cal Bike", "8 DB Snatches (4 each arm)", "150m Shuttle Run", "10 Pull-Ups"], note: "DB snatches alternate arms each rep. Shuttle runs 25m out-and-back x3. Pull-ups kipping or strict — scale to 8 if breaking." },
      { moves: ["15/12 Cal Row", "10 Wall Balls (20/14 lb)", "14/11 Cal Ski Erg", "50 Double Unders"], note: "Wall balls unbroken every round — use 14 lb if breaking before round 7. Scale DU to 60 singles. Push pace on final 2 rounds." },
    ],
  },
  // Meso 2 — KB & Bodyweight
  {
    weeks: [
      { moves: ["12/9 Cal Bike", "12 KB Swings (heavy)", "15/12 Cal Row", "15 Push-Ups"], note: "KB swings Russian-style to eye level — hip snap, not arm pull. Push-ups full ROM, chest to floor. Bike steady cadence 70+ RPM." },
      { moves: ["15/12 Cal Row", "8 Sandbag Cleans (moderate)", "14/11 Cal Ski Erg", "10 Box Jumps (20\", step down)"], note: "Sandbag cleans — bear hug and stand. No sandbag? Sub 10 DB Hang Cleans. Step down every box jump to manage fatigue." },
      { moves: ["14/11 Cal Ski Erg", "10 Goblet Squats (heavy KB)", "12/9 Cal Bike", "8 Burpees"], note: "Goblet squats below parallel — controlled descent. Burpees steady, not sprinted. Breathe on the way down." },
      { moves: ["12/9 Cal Bike", "10 DB Thrusters (moderate)", "15/12 Cal Row", "12 Toes-to-Bar"], note: "Duration is long — pace 6/10 for rounds 1–5, build to 8/10 in rounds 8–10. Thrusters unbroken every round." },
    ],
  },
  // Meso 3 — Barbell Power
  {
    weeks: [
      { moves: ["14/11 Cal Ski Erg", "6 Power Cleans (55% 1RM)", "12/9 Cal Bike", "10 Pull-Ups"], note: "Cleans heavier this meso — crisp singles or touch-and-go doubles. Pull-ups strict: scale to 8 if needed." },
      { moves: ["15/12 Cal Row", "8 DB Snatches (4 each arm)", "30m Farmer Carry (heavy)", "10 Burpee Box Jumps (20\")"], note: "Farmer carry heavy — grip is the limiter. DB snatches explosive hip drive. Step down every box jump." },
      { moves: ["12/9 Cal Bike", "10 Wall Balls (20/14 lb)", "15/12 Cal Row", "50 Double Unders"], note: "Wall balls unbroken. DU scale to 60 singles. Row at 1:45–1:50/500m pace. Stay controlled through round 7." },
      { moves: ["14/11 Cal Ski Erg", "12 KB Swings (heavy)", "12/9 Cal Bike", "15 Push-Ups"], note: "Long EMOM — conserve early. KB swings explosive but controlled. Push-ups full ROM. Final 3 rounds push to 8/10." },
    ],
  },
  // Meso 4 — Sandbag & Skill
  {
    weeks: [
      { moves: ["15/12 Cal Row", "8 Sandbag Squats (moderate)", "14/11 Cal Ski Erg", "12 Toes-to-Bar"], note: "Sandbag squats bear hug — below parallel. TTB unbroken or quick doubles. Row moderate cadence." },
      { moves: ["12/9 Cal Bike", "6 Power Cleans (50% 1RM)", "15/12 Cal Row", "10 Box Jumps (20\", step down)"], note: "Cleans crisp and controlled. Step down every box jump. Bike at 7/10 — don't redline early." },
      { moves: ["14/11 Cal Ski Erg", "10 DB Thrusters (moderate)", "12/9 Cal Bike", "8 Burpees"], note: "Thrusters fluid — use the legs. Burpees at a pace you can hold for all 9 rounds. Breathe between stations." },
      { moves: ["15/12 Cal Row", "10 Goblet Squats (heavy KB)", "150m Shuttle Run", "10 Pull-Ups"], note: "Longest duration — pacing is everything. Goblet squats controlled. Shuttle runs 25m x3. Pull-ups scale to 8 if failing." },
    ],
  },
  // Meso 5 — DB & Plyometric
  {
    weeks: [
      { moves: ["12/9 Cal Bike", "8 DB Snatches (4 each arm)", "15/12 Cal Row", "15 Push-Ups"], note: "DB snatches alternate arms. Push-ups full ROM — scale to knees if breaking before round 5. Bike steady." },
      { moves: ["14/11 Cal Ski Erg", "12 KB Swings (heavy)", "12/9 Cal Bike", "50 Double Unders"], note: "KB swings Russian-style, explosive. DU unbroken or scale to 60 singles. Ski smooth, long pulls." },
      { moves: ["15/12 Cal Row", "8 Sandbag Cleans (moderate)", "14/11 Cal Ski Erg", "10 Burpee Box Jumps (20\")"], note: "Sandbag cleans explosive — no grinding. Step down box jumps. Row at 1:50/500m or faster." },
      { moves: ["12/9 Cal Bike", "10 Wall Balls (20/14 lb)", "15/12 Cal Row", "12 Toes-to-Bar"], note: "Final week is long — discipline the pace. Wall balls unbroken. TTB quick sets of 4–6 if needed." },
    ],
  },
  // Meso 6 — Power & Gymnastics
  {
    weeks: [
      { moves: ["15/12 Cal Row", "6 Power Cleans (55% 1RM)", "12/9 Cal Bike", "10 Box Jumps (20\", step down)"], note: "Cleans heavy singles — no touch-and-go above 55%. Step down box jumps. Row controlled." },
      { moves: ["14/11 Cal Ski Erg", "10 DB Thrusters (moderate)", "15/12 Cal Row", "10 Pull-Ups"], note: "Thrusters unbroken — breathe at the top. Pull-ups kipping or strict. Ski long pulls, 7/10 effort." },
      { moves: ["12/9 Cal Bike", "12 KB Swings (heavy)", "14/11 Cal Ski Erg", "8 Burpees"], note: "KB swings eye level — hip snap. Burpees controlled. Bike high cadence. Build effort rounds 7–9." },
      { moves: ["15/12 Cal Row", "8 DB Snatches (4 each arm)", "12/9 Cal Bike", "50 Double Unders"], note: "Longest EMOM — pacing wins. DB snatches crisp. DU unbroken or 60 singles. Row at conversational pace through round 6." },
    ],
  },
];

// ─── REBUILD Mesocycles (6 total) ──────────────────────────────────

const REBUILD_MESOCYCLES: MesocycleConditioning[] = [
  // Meso 1 — Row/Bike Foundation (Rebuild)
  {
    weeks: [
      { moves: ["15/12 Cal Row", "12 KB Swings (moderate)", "14/11 Cal Bike", "12 Ring Rows"], note: "KB swings Russian-style — hip snap, not arm pull. Ring rows chest-to-rings, adjust foot position to scale difficulty." },
      { moves: ["14/11 Cal Ski Erg", "10 DB Goblet Squats (moderate)", "15/12 Cal Row", "12 Box Step-Ups (20\", alternating)"], note: "Goblet squats controlled 2s descent. Step-ups alternating legs, drive through heel. No jumping." },
      { moves: ["12/9 Cal Bike", "8 DB Hang Cleans (4 each arm)", "150m Shuttle Run", "10 Hanging Knee Raises"], note: "DB hang cleans smooth — hinge, pop, catch at shoulders. Knee raises controlled, no kipping." },
      { moves: ["15/12 Cal Row", "10 Wall Balls (14/10 lb)", "14/11 Cal Ski Erg", "50 Jump Rope Singles"], note: "Wall balls lighter weight. Jump rope steady rhythm. Push pace on final 2 rounds." },
    ],
  },
  // Meso 2 — KB & Bodyweight (Rebuild)
  {
    weeks: [
      { moves: ["12/9 Cal Bike", "10 Goblet Squats (moderate KB)", "15/12 Cal Row", "15 Push-Ups"], note: "Goblet squats below parallel. Push-ups full ROM — scale to knees if breaking before round 5." },
      { moves: ["15/12 Cal Row", "10 DB Reverse Lunges (moderate)", "14/11 Cal Ski Erg", "12 Box Step-Ups (20\", alternating)"], note: "Reverse lunges DBs at sides — no front rack. Step-ups controlled. Ski smooth pulls." },
      { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "8 Incline Push-Ups + 8 Air Squats"], note: "Incline push-ups on bench reduces shoulder load. Air squats controlled with pause at bottom." },
      { moves: ["12/9 Cal Bike", "10 DB Floor Press (moderate)", "15/12 Cal Row", "12 Ring Rows"], note: "Floor press eliminates shoulder stress — control the negative. Ring rows adjust angle for difficulty." },
    ],
  },
  // Meso 3 — Functional Strength (Rebuild)
  {
    weeks: [
      { moves: ["14/11 Cal Ski Erg", "8 DB Hang Cleans (4 each arm)", "12/9 Cal Bike", "10 Hanging Knee Raises"], note: "DB hang cleans explosive hip drive. Knee raises slow and controlled. Ski long pulls." },
      { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "30m Farmer Carry (moderate)", "12 Box Step-Ups (20\", alternating)"], note: "Farmer carry moderate grip challenge. Goblet squats controlled. Step-ups drive through heel." },
      { moves: ["12/9 Cal Bike", "10 Wall Balls (14/10 lb)", "15/12 Cal Row", "50 Jump Rope Singles"], note: "Wall balls lighter weight, unbroken every round. Jump rope steady rhythm. Row at 1:50–1:55/500m." },
      { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "15 Push-Ups"], note: "Long EMOM — conserve early. KB swings controlled. Push-ups full ROM. Build effort final 3 rounds." },
    ],
  },
  // Meso 4 — Movement Quality (Rebuild)
  {
    weeks: [
      { moves: ["15/12 Cal Row", "10 DB Goblet Squats (moderate)", "14/11 Cal Ski Erg", "12 Ring Rows"], note: "Goblet squats focus on depth and control. Ring rows chest to rings. Row moderate pace." },
      { moves: ["12/9 Cal Bike", "8 DB Hang Cleans (4 each arm)", "15/12 Cal Row", "10 Hanging Knee Raises"], note: "Hang cleans smooth transitions. Knee raises no swinging. Bike steady cadence." },
      { moves: ["14/11 Cal Ski Erg", "10 DB Floor Press (moderate)", "12/9 Cal Bike", "8 Incline Push-Ups + 8 Air Squats"], note: "Floor press controlled negatives. Incline push-ups on bench. Air squats with pause." },
      { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "150m Shuttle Run", "12 Ring Rows + 10 Dead Bugs"], note: "Longest duration — pacing is key. Dead bugs slow, press low back to floor. Shuttle runs controlled." },
    ],
  },
  // Meso 5 — Endurance Build (Rebuild)
  {
    weeks: [
      { moves: ["12/9 Cal Bike", "10 DB Reverse Lunges (moderate)", "15/12 Cal Row", "15 Push-Ups"], note: "Reverse lunges DBs at sides. Push-ups full ROM. Bike steady. Pace 6/10 early." },
      { moves: ["14/11 Cal Ski Erg", "12 KB Swings (moderate)", "12/9 Cal Bike", "50 Jump Rope Singles"], note: "KB swings hip snap — explosive but controlled. Jump rope steady rhythm. Ski smooth." },
      { moves: ["15/12 Cal Row", "10 DB Goblet Squats (moderate)", "14/11 Cal Ski Erg", "12 Box Step-Ups (20\", alternating)"], note: "Goblet squats controlled descent. Step-ups alternating, no jumping. Row at 1:50/500m." },
      { moves: ["12/9 Cal Bike", "10 Wall Balls (14/10 lb)", "15/12 Cal Row", "12 Ring Rows"], note: "Wall balls lighter, unbroken. Ring rows full extension to contraction. Final 3 rounds push effort." },
    ],
  },
  // Meso 6 — Athletic Capacity (Rebuild)
  {
    weeks: [
      { moves: ["15/12 Cal Row", "8 DB Hang Cleans (4 each arm)", "12/9 Cal Bike", "10 Hanging Knee Raises"], note: "Hang cleans explosive. Knee raises controlled. Row moderate. Pace 7/10." },
      { moves: ["14/11 Cal Ski Erg", "10 DB Floor Press (moderate)", "15/12 Cal Row", "15 Push-Ups"], note: "Floor press controlled. Push-ups chest to floor. Ski long pulls. Build effort mid-rounds." },
      { moves: ["12/9 Cal Bike", "12 KB Swings (moderate)", "14/11 Cal Ski Erg", "8 Incline Push-Ups + 8 Air Squats"], note: "KB swings eye level. Incline push-ups on bench. Air squats paused. Bike high cadence." },
      { moves: ["15/12 Cal Row", "10 Goblet Squats (moderate KB)", "12/9 Cal Bike", "50 Jump Rope Singles"], note: "Longest EMOM — discipline the pace. Goblet squats controlled. Jump rope steady. Row conversational pace through round 6." },
    ],
  },
];

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

// ─── Build conditioning day ────────────────────────────────────────

function buildConditioningDay(
  mesocycles: MesocycleConditioning[],
  globalMeso: number,
  weekInMeso: number,
  weekNum: number,
): any[] {
  const meso = mesocycles[(globalMeso - 1) % mesocycles.length];
  const session = meso.weeks[weekInMeso - 1];
  const dur = EMOM_DURATIONS[weekInMeso];
  const detail = session.moves.map((m, i) => `Minute ${i + 1}: ${m}`).join("\n");

  return [
    {
      name: `EMOM ${dur.minutes} Minutes`,
      detail,
      sets: dur.rounds,
      reps: `${dur.minutes} min`,
      rir: null,
      rest: null,
      type: "conditioning",
      group: null,
      superset_label: null,
    },
    {
      name: "Coaching Note",
      detail: `${session.note} Repeat for ${dur.rounds} rounds.`,
      sets: 1,
      reps: null,
      rir: null,
      rest: null,
      type: "note",
      group: null,
      superset_label: null,
    },
    {
      name: "Mindset Moment",
      detail: MINDSET[((weekNum - 1) * 5 + 5) % MINDSET.length],
      sets: 1, reps: null, rir: null, rest: null,
      type: "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: MISSIONS[((weekNum - 1) * 5 + 5) % MISSIONS.length],
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { program_id, total_weeks, program_type = "perform" } = await req.json();
    if (!program_id || !total_weeks) {
      return new Response(JSON.stringify({ error: "program_id and total_weeks required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const mesocycles = program_type === "rebuild" ? REBUILD_MESOCYCLES : PERFORM_MESOCYCLES;
    const results: string[] = [];
    const rows: any[] = [];

    let globalMeso = 0;
    for (let week = 1; week <= total_weeks; week++) {
      const weekInMeso = ((week - 1) % 4) + 1;
      if (weekInMeso === 1) globalMeso++;

      const dayNumber = (week - 1) * 7 + 6;
      const dur = EMOM_DURATIONS[weekInMeso];
      const exercises = buildConditioningDay(mesocycles, globalMeso, weekInMeso, week);

      rows.push({
        program_id,
        day_number: dayNumber,
        label: `Day 6 — Saturday Conditioning: EMOM ${dur.minutes}`,
        exercises,
      });

      const mesoIdx = ((globalMeso - 1) % mesocycles.length) + 1;
      results.push(`✅ W${week} D6 (#${dayNumber}): EMOM ${dur.minutes} [${program_type === "rebuild" ? "Rebuild" : "Perform"} Meso ${mesoIdx} Wk ${weekInMeso}]`);
    }

    // Batch upsert in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) results.push(`❌ Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, updated: rows.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
