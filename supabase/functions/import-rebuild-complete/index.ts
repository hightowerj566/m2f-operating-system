import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "3da785bc-a03d-4fe9-ae7f-dfed52fb8124";

// ─── Content pools ───
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

function getMindset(w: number, d: number): string { return MINDSET[((w - 1) * 7 + (d - 1)) % MINDSET.length]; }
function getMission(w: number, d: number): string { return MISSIONS[((w - 1) * 7 + (d - 1)) % MISSIONS.length]; }

// ─── Exercise builder ───
function ex(
  name: string, detail: string, sets: number, reps: string | null,
  rest: number | null, rir: string | null, type: string,
  group: string | null = null, superset_label: string | null = null
) {
  return { name, detail, sets, reps, rest, rir, type, group, superset_label };
}

// ─── Convert a workout from JSON → program_days exercises array ───
function convertWorkout(workout: any, globalWeek: number, phaseIdx: number): any[] {
  const exercises: any[] = [];
  const LETTERS = "ABCDEFGHIJKLMNOP";
  let letterIdx = 0;
  const wk = `W${globalWeek}D${workout.day}`;

  // Helper to add a block of exercises
  function addBlock(items: any[], blockType: string, prefix?: string) {
    if (!items || items.length === 0) return;

    for (const item of items) {
      const letter = LETTERS[letterIdx++];
      const groupId = `${letter}${wk}`;
      const name = prefix ? `${letter}1. ${item.exercise}` : `${letter}1. ${item.exercise}`;
      const detailParts: string[] = [];
      if (item.notes) detailParts.push(item.notes);
      if (item.intensity_technique) detailParts.push(`Intensity: ${item.intensity_technique}`);

      const rirStr = item.rir !== null && item.rir !== undefined ? String(item.rir) : null;
      const type = blockType === "conditioning" ? "conditioning" : blockType === "warmup" ? "warmup" : "exercise";

      exercises.push(ex(
        name,
        detailParts.join(". ") || "",
        item.sets || 1,
        item.reps || null,
        item.rest_seconds || null,
        rirStr,
        type,
        groupId,
        null
      ));
    }
  }

  // Helper for conditioning (different format)
  function addConditioning(items: any[]) {
    if (!items || items.length === 0) return;
    for (const item of items) {
      const letter = LETTERS[letterIdx++];
      exercises.push(ex(
        `${letter}1. ${item.type || "Conditioning"}`,
        item.description || "",
        1,
        item.duration || null,
        null,
        null,
        "conditioning",
        `${letter}${wk}`,
        null
      ));
    }
  }

  // Process blocks in order
  addBlock(workout.warmup, "warmup");
  addBlock(workout.explosive_movement, "exercise");
  addBlock(workout.primary_strength, "exercise");
  addBlock(workout.secondary_strength, "exercise");
  addBlock(workout.accessories, "exercise");
  addBlock(workout.core, "exercise");
  addConditioning(workout.conditioning);

  // Add Mindset + Mission
  exercises.push(ex("Mindset Moment", getMindset(globalWeek, workout.day), 1, null, null, null, "mindset", null, null));
  exercises.push(ex("Dad Mission", getMission(globalWeek, workout.day), 1, null, null, null, "mission", null, null));

  return exercises;
}

// ─── Saturday Hybrid Conditioning (same architecture as Rebuild spec) ───
function buildDay6(globalWeek: number, weekInPhase: number, phaseIdx: number): any[] {
  const exercises: any[] = [];
  const deload = weekInPhase === 4;

  // Warm-up
  const warmups = [
    "2 rounds: 10 Jumping Jacks + 5 Inchworms + 10 Bodyweight Squats + 5 Push-Ups. Easy pace.",
    "2 rounds: 10 Lateral Shuffles each + 5 World's Greatest Stretch each + 10 Glute Bridges.",
    "2 rounds: 200m Easy Jog + 10 Leg Swings each + 5 Broad Jumps (soft landing).",
  ];
  exercises.push(ex("Movement Prep", warmups[(globalWeek - 1) % warmups.length], 1, "5 min", null, null, "warmup", null, null));

  if (deload) {
    exercises.push(ex("Easy Movement Flow", "15 min mixed low-intensity: Walk + Light Kettlebell Swings + Easy Bike. RPE 4-5, HR 120-140 BPM.", 1, "15 min", null, null, "conditioning", null, null));
    exercises.push(ex("Coaching Note", "Deload — active recovery. No scoring. Conversational pace.", 1, null, null, null, "note", null, null));
  } else {
    const durBase = phaseIdx === 0 ? 20 : phaseIdx === 1 ? 24 : 28;
    const duration = durBase + (weekInPhase - 1) * 4;
    const rounds = Math.floor(duration / 4);

    const circuits: string[][] = [
      // Phase 1 circuits
      [
        `Every 4 min × ${rounds} rounds:\n• 12/10 Cal Bike\n• 10 Kettlebell Swings (light-moderate)\n• 10/8 Cal Row\n• 8 Air Squats + 8 Push-Ups\nRPE 6-7, HR 140-155 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 200m Row\n• 8 Goblet Squats + 8 Ring Rows\n• 12/10 Cal Bike\n• 30s Farmer Carry + 30s Plank\nRPE 6-7, HR 140-155 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 10/8 Cal Ski Erg\n• 12 Dumbbell Deadlifts (moderate)\n• 12/10 Cal Bike\n• 10 Push-Ups + 20 Mountain Climbers\nRPE 6-7, HR 140-155 BPM.`,
      ],
      // Phase 2 circuits
      [
        `Every 4 min × ${rounds} rounds:\n• 15/12 Cal Row\n• 8 Dumbbell Thrusters (moderate)\n• 12/10 Cal Bike\n• 8 Pull-Ups + 40m Farmer Carry\nRPE 6-7, HR 145-160 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 200m Row\n• 10 Kettlebell Swings + 5 Box Jumps (step down)\n• 14/11 Cal Bike\n• 40m Sled Push (moderate)\nRPE 6-7, HR 145-160 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 12/10 Cal Ski Erg\n• 10 Dumbbell Snatches (alternating)\n• 15/12 Cal Bike\n• 8 Medicine Ball Slams + 20m Bear Crawl\nRPE 6-7, HR 145-160 BPM.`,
      ],
      // Phase 3 circuits
      [
        `Every 4 min × ${rounds} rounds:\n• 15/12 Cal Row (strong)\n• 10 Dumbbell Thrusters (moderate-heavy)\n• 14/11 Cal Bike\n• 40m Farmer Carry (heavy) + 10 V-Ups\nRPE 7, HR 150-165 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 250m Row\n• 12 Kettlebell Swings (moderate-heavy) + 6 Burpees\n• 15/12 Cal Bike\n• 40m Sled Push + 10 Medicine Ball Slams\nRPE 7, HR 150-165 BPM.`,
        `Every 4 min × ${rounds} rounds:\n• 12/10 Cal Ski Erg\n• 10 Dumbbell Snatches (alternating, moderate)\n• 14/11 Cal Bike\n• 10 Burpee Box Step-Ups + 30s Plank\nRPE 7, HR 150-165 BPM.`,
      ],
    ];

    const pool = circuits[phaseIdx] || circuits[0];
    const pick = pool[(globalWeek - 1) % pool.length];
    const phaseNames = ["Foundation", "Build", "Capacity"];
    exercises.push(ex(`${phaseNames[phaseIdx]} Circuit: ${duration} min`, pick, rounds, `${duration} min`, null, null, "conditioning", null, null));
  }

  exercises.push(ex("Mindset Moment", getMindset(globalWeek, 6), 1, null, null, null, "mindset", null, null));
  exercises.push(ex("Dad Mission", getMission(globalWeek, 6), 1, null, null, null, "mission", null, null));
  return exercises;
}

// ─── Rest day ───
function buildDay7(globalWeek: number): any[] {
  return [
    ex("Full Rest Day", "Complete rest. Sleep in, eat well, hydrate. Recovery is where gains are made.", 1, null, null, null, "rest", null, null),
    ex("Mindset Moment", getMindset(globalWeek, 7), 1, null, null, null, "mindset", null, null),
    ex("Dad Mission", getMission(globalWeek, 7), 1, null, null, null, "mission", null, null),
  ];
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results: string[] = [];
    const allRows: any[] = [];

    // Read the JSON from storage
    const { data: fileData, error: dlErr } = await supabase.storage.from("exercise-videos").download("imports/m2f_rebuild_complete.json");
    if (dlErr || !fileData) throw new Error(`Download failed: ${dlErr?.message}`);
    const programData = JSON.parse(await fileData.text());

    let globalWeek = 0;

    for (let phaseIdx = 0; phaseIdx < programData.phases.length; phaseIdx++) {
      const phase = programData.phases[phaseIdx];

      for (let weekIdx = 0; weekIdx < phase.weeks.length; weekIdx++) {
        globalWeek++;
        const week = phase.weeks[weekIdx];
        const weekInPhase = weekIdx + 1;
        const deloadTag = weekInPhase === 4 ? " [DELOAD]" : "";

        // Days 1-5 from JSON
        for (const workout of week.workouts) {
          const dayNumber = (globalWeek - 1) * 7 + workout.day;
          const exercises = convertWorkout(workout, globalWeek, phaseIdx);
          const label = `Day ${workout.day} — ${workout.focus}${deloadTag}`;

          allRows.push({
            program_id: PROGRAM_ID,
            day_number: dayNumber,
            label,
            exercises,
          });
          results.push(`✅ W${globalWeek} D${workout.day} (#${dayNumber}): ${exercises.length} exercises [${phase.phase_name}]`);
        }

        // Day 6 — Saturday Hybrid Conditioning
        const d6Num = (globalWeek - 1) * 7 + 6;
        const d6Ex = buildDay6(globalWeek, weekInPhase, phaseIdx);
        const phaseLabel = phaseIdx === 0 ? "Foundation" : phaseIdx === 1 ? "Build" : "Capacity";
        allRows.push({
          program_id: PROGRAM_ID,
          day_number: d6Num,
          label: weekInPhase === 4 ? "Day 6 — Active Recovery [DELOAD]" : `Day 6 — ${phaseLabel} Hybrid Conditioning`,
          exercises: d6Ex,
        });
        results.push(`✅ W${globalWeek} D6 (#${d6Num}): ${d6Ex.length} exercises [${phase.phase_name}]`);

        // Day 7 — Rest
        const d7Num = (globalWeek - 1) * 7 + 7;
        const d7Ex = buildDay7(globalWeek);
        allRows.push({
          program_id: PROGRAM_ID,
          day_number: d7Num,
          label: `Day 7 — Rest Day${deloadTag}`,
          exercises: d7Ex,
        });
        results.push(`✅ W${globalWeek} D7 (#${d7Num}): Rest`);
      }
    }

    // Upsert in batches
    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) results.push(`❌ Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
    }

    // Update program metadata
    const totalDays = globalWeek * 7;
    await supabase.from("programs").update({
      total_days: totalDays,
      published_through_day: totalDays,
    }).eq("id", PROGRAM_ID);

    return new Response(JSON.stringify({
      success: true,
      total_weeks: globalWeek,
      total_days: totalDays,
      total_rows: allRows.length,
      phases: programData.phases.length,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
