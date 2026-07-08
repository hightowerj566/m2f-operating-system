import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  "The bar doesn't lie. Your effort is the only currency that matters here.",
  "Discipline is doing the right thing when no one is watching. Your family benefits from the man you become in the gym.",
  "Every set you finish is a promise kept to yourself. Stack enough of those and you become unstoppable.",
  "The weight on the bar is just a tool. The real work is showing up when you don't feel like it.",
  "Your body adapts to what you consistently demand of it. Demand more.",
  "Rest days aren't days off — they're days your body catches up to the work you've done.",
  "The man who trains when it's hard raises kids who don't quit when things get tough.",
  "You're not just building muscle. You're building the example your kids will follow.",
  "Fatigue is temporary. The confidence you build in here lasts forever.",
  "One more rep. One more set. One more day. That's how legacies are built.",
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
  "Do 10 push-ups with your kid on your back. Let them count.",
  "Ask your partner how their day really was — and listen without fixing.",
  "Read to your kid tonight. Even if they're 'too old for it.'",
  "Challenge your kid to a race. Let them win sometimes.",
  "Cook a meal together with your family tonight. Process over perfection.",
  "Tell your kid one specific thing they did today that made you proud.",
  "Teach your child one thing about taking care of their body.",
  "Give your partner 30 uninterrupted minutes tonight. No phone.",
  "Ask your kid what they're worried about. Just listen.",
  "Share a meal with your family and ask everyone their highlight of the day.",
];

function getMindset(w: number, d: number): string {
  return MINDSET[((w - 1) * 7 + (d - 1)) % MINDSET.length];
}
function getMission(w: number, d: number): string {
  return MISSIONS[((w - 1) * 7 + (d - 1)) % MISSIONS.length];
}

const LETTERS = "ABCDEFGHIJKLMNOP";

function parseRest(rest?: number | string | null): number | null {
  if (!rest) return null;
  if (typeof rest === "number") return rest;
  const match = String(rest).match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Map block_type to exercise type
function blockToType(blockType: string): string {
  const bt = blockType.toLowerCase();
  if (bt === "prep") return "warmup";
  if (bt.includes("conditioning") || bt.includes("recovery") || bt === "speed") return "conditioning";
  return "exercise";
}

// Determine if block exercises should be solo (no supersets)
function isSoloBlock(blockType: string): boolean {
  const bt = blockType.toLowerCase();
  return bt === "power" || bt === "primary_strength" || bt === "secondary_strength" ||
    bt === "speed" || bt === "conditioning" || bt === "recovery";
}

function chunkSupersets<T>(items: T[], maxSize = 2): T[][] {
  if (items.length <= maxSize) return items.length > 0 ? [items] : [];
  const chunks: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;
    if (remaining <= maxSize) { chunks.push(items.slice(i)); break; }
    if (remaining === 3 && maxSize === 2) { chunks.push(items.slice(i, i + 2)); i += 2; }
    else { const take = Math.min(maxSize, remaining); chunks.push(items.slice(i, i + take)); i += take; }
  }
  return chunks;
}

// ─── Convert block-based day to flat exercises ─────────────────────
function convertBlockDay(
  blocks: any[],
  weekNum: number,
  dayInWeek: number,
): any[] {
  const result: any[] = [];
  const wk = `W${weekNum}D${dayInWeek}`;
  let letterIdx = 0;

  for (const block of blocks) {
    const blockType = block.block_type || "";
    const exercises = block.exercises || [];
    const exType = blockToType(blockType);
    const solo = isSoloBlock(blockType);

    if (solo) {
      // Each exercise gets its own letter group
      for (const ex of exercises) {
        const letter = LETTERS[letterIdx++];
        const detailParts: string[] = [];
        if (ex.notes) detailParts.push(ex.notes);
        if (ex.tempo && ex.tempo !== "controlled") detailParts.push(`Tempo: ${ex.tempo}`);
        if (ex.rir) detailParts.push(`RIR: ${ex.rir}`);
        if (ex.intensity_technique) detailParts.push(`Technique: ${ex.intensity_technique.replace(/_/g, " ")}`);

        result.push({
          name: `${letter}1. ${ex.name}`,
          detail: detailParts.join(" | "),
          sets: typeof ex.sets === "object" ? 5 : ex.sets,
          reps: String(ex.reps),
          rir: ex.rir || null,
          rest: parseRest(ex.rest_seconds) || (exType === "warmup" ? 30 : 120),
          type: exType,
          group: `${letter}${wk}`,
          superset_label: null,
          tempo: (ex.tempo && ex.tempo !== "controlled") ? ex.tempo : null,
        });
      }
    } else {
      // Superset accessory-style blocks in pairs
      const chunks = chunkSupersets(exercises, 2);
      for (const chunk of chunks) {
        const letter = LETTERS[letterIdx++];
        const groupId = `${letter}${wk}`;
        const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;

        chunk.forEach((ex: any, gi: number) => {
          const isLast = gi === chunk.length - 1;
          const detailParts: string[] = [];
          if (ex.notes) detailParts.push(ex.notes);
          if (ex.tempo && ex.tempo !== "controlled") detailParts.push(`Tempo: ${ex.tempo}`);
          if (ex.rir) detailParts.push(`RIR: ${ex.rir}`);
          if (ex.intensity_technique) detailParts.push(`Technique: ${ex.intensity_technique.replace(/_/g, " ")}`);

          result.push({
            name: `${letter}${gi + 1}. ${ex.name}`,
            detail: detailParts.join(" | "),
            sets: typeof ex.sets === "object" ? 5 : ex.sets,
            reps: String(ex.reps),
            rir: ex.rir || null,
            rest: isLast ? (parseRest(ex.rest_seconds) || 60) : null,
            type: exType,
            group: groupId,
            superset_label: chunk.length > 1 ? label : null,
            tempo: (ex.tempo && ex.tempo !== "controlled") ? ex.tempo : null,
          });
        });
      }
    }
  }

  // Mindset + Mission
  result.push({
    name: "Mindset Moment", detail: getMindset(weekNum, dayInWeek),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mindset", group: null, superset_label: null,
  });
  result.push({
    name: "Dad Mission", detail: getMission(weekNum, dayInWeek),
    sets: 1, reps: null, rir: null, rest: null,
    type: "mission", group: null, superset_label: null,
  });

  return result;
}

function buildRestDay(weekNum: number, dayInWeek: number, isActiveRecovery = false): any[] {
  return [
    {
      name: isActiveRecovery ? "Active Recovery" : "Full Rest Day",
      detail: isActiveRecovery
        ? "Light movement day. 20–30 min walk or easy bike + 10 min mobility flow."
        : "Complete rest. Sleep in, eat well, hydrate. Your body grows during recovery.",
      sets: 1, reps: isActiveRecovery ? "20-30 min" : null, rir: null, rest: null,
      type: isActiveRecovery ? "conditioning" : "rest", group: null, superset_label: null,
    },
    {
      name: "Mindset Moment", detail: getMindset(weekNum, dayInWeek),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mindset", group: null, superset_label: null,
    },
    {
      name: "Dad Mission", detail: getMission(weekNum, dayInWeek),
      sets: 1, reps: null, rir: null, rest: null,
      type: "mission", group: null, superset_label: null,
    },
  ];
}

// ─── Main handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      program_id,
      program_name,
      program_json,
      variant, // "6day" or "4day"
      create_program = false,
    } = body;

    if (!program_json) {
      return new Response(JSON.stringify({ error: "program_json required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id || null;
    }

    const data = program_json;
    const program = data.program;
    const mesocycles = program.mesocycles || [];
    let targetProgramId = program_id;

    // Create program if needed
    if (create_program && !targetProgramId) {
      const name = program_name || program.program_name || "Imported Program";
      const desc = `${program.display_tier} • ${program.version_type}`;
      const { data: prog, error: progErr } = await supabase
        .from("programs")
        .insert({
          name,
          description: desc,
          total_days: 1,
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          is_published: false
        } as any)
        .select().single();
      if (progErr) {
        return new Response(JSON.stringify({ error: `Create program failed: ${progErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      targetProgramId = (prog as any).id;
    }

    if (!targetProgramId) {
      return new Response(JSON.stringify({ error: "program_id or create_program required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const is4Day = variant === "4day" || program.version_type?.includes("4_day") || program.schedule_type?.includes("2_on");
    const results: string[] = [];
    const allRows: any[] = [];
    let dayNumber = 1;

    for (const meso of mesocycles) {
      const mesoWeeks = meso.weeks || [1, 2, 3, 4];
      const trainingDays = meso.days || [];

      for (const weekNum of mesoWeeks) {
        if (is4Day) {
          // 4-day: iterate all 7 day slots
          for (let pos = 1; pos <= 7; pos++) {
            const td = trainingDays.find((d: any) => d.day === pos);
            const hasBlocks = td?.blocks && td.blocks.length > 0;

            if (hasBlocks) {
              const exercises = convertBlockDay(td.blocks, weekNum, pos);
              const dayLabel = td.label || `Training Day ${pos}`;
              const label = `Day ${pos} — ${dayLabel}`;
              allRows.push({ program_id: targetProgramId, day_number: dayNumber, label, exercises });
              results.push(`✅ W${weekNum} D${pos} (#${dayNumber}): ${exercises.length} items — ${dayLabel}`);
            } else {
              const isActive = td?.label?.toLowerCase().includes("rest") || pos === 3;
              const restLabel = td?.label || (pos === 3 ? "Rest / Active Recovery" : "Off");
              allRows.push({
                program_id: targetProgramId,
                day_number: dayNumber,
                label: `Day ${pos} — ${restLabel}`,
                exercises: buildRestDay(weekNum, pos, pos === 3),
              });
              results.push(`✅ W${weekNum} D${pos} (#${dayNumber}): ${restLabel}`);
            }
            dayNumber++;
          }
        } else {
          // 6-day schedule: Days 1-6 train, Day 7 rest
          for (let di = 0; di < 6; di++) {
            const td = trainingDays.find((d: any) => d.day === di + 1);
            if (td) {
              const exercises = convertBlockDay(td.blocks || [], weekNum, di + 1);
              const dayTitle = program.weekly_structure?.find((s: any) => s.day === di + 1)?.title || `Training Day ${di + 1}`;
              const label = `Day ${di + 1} — ${dayTitle}`;
              allRows.push({ program_id: targetProgramId, day_number: dayNumber, label, exercises });
              results.push(`✅ W${weekNum} D${di + 1} (#${dayNumber}): ${exercises.length} items — ${dayTitle}`);
            }
            dayNumber++;
          }

          // Day 7 — Rest
          allRows.push({
            program_id: targetProgramId,
            day_number: dayNumber,
            label: "Day 7 — Rest Day",
            exercises: buildRestDay(weekNum, 7),
          });
          results.push(`✅ W${weekNum} D7 (#${dayNumber}): Rest`);
          dayNumber++;
        }
      }
    }

    // Batch upsert
    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      const { error } = await supabase.from("program_days").upsert(chunk, { onConflict: "program_id,day_number" });
      if (error) results.push(`❌ Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
    }

    // Update total_days
    const totalDays = dayNumber - 1;
    await supabase.from("programs").update({
      total_days: totalDays,
      published_through_day: totalDays,
      is_published: true,
    }).eq("id", targetProgramId);

    return new Response(JSON.stringify({
      success: true,
      program_id: targetProgramId,
      variant: is4Day ? "4-day" : "6-day",
      total_days_imported: allRows.length,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
