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

// ─── Helpers ───────────────────────────────────────────────────────
const LETTERS = "ABCDEFGHIJKLMNOP";

function parseRest(rest?: string): number | null {
  if (!rest || rest === "N/A") return null;
  const match = rest.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1]);
    if (rest.includes("min")) return val * 60;
    return val;
  }
  return null;
}

function getType(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("conditioning") || r.includes("zone")) return "conditioning";
  if (r.includes("warmup") || r.includes("warm-up") || r.includes("warm up")) return "warmup";
  if (r.includes("power primer")) return "exercise";
  return "exercise";
}

function chunkSupersets<T>(items: T[], maxSize = 2): T[][] {
  if (items.length <= maxSize) return items.length > 0 ? [items] : [];
  const chunks: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;
    if (remaining <= maxSize) { chunks.push(items.slice(i)); break; }
    if (remaining === 3 && maxSize === 2) { chunks.push(items.slice(i, i + 2)); i += 2; }
    else { const take = remaining - maxSize === 1 ? maxSize + 1 : maxSize; chunks.push(items.slice(i, i + Math.min(take, 3))); i += Math.min(take, 3); }
  }
  return chunks;
}

// ─── Convert new-format day (flat exercises array) ─────────────────
function convertNewFormatDay(
  exercises: any[],
  conditioning: any | null,
  weekNum: number,
  dayInWeek: number,
): any[] {
  const result: any[] = [];
  const wk = `W${weekNum}D${dayInWeek}`;

  // Categorize by role
  const primers: any[] = [];
  const primaries: any[] = [];
  const secondaries: any[] = [];
  const accessories: any[] = [];
  const coreExercises: any[] = [];
  const calves: any[] = [];
  const frontalPlane: any[] = [];

  for (const ex of exercises) {
    const role = (ex.role || "").toLowerCase();
    if (role.includes("power primer")) primers.push(ex);
    else if (role.includes("primary")) primaries.push(ex);
    else if (role.includes("secondary")) secondaries.push(ex);
    else if (role.includes("core")) coreExercises.push(ex);
    else if (role.includes("frontal")) frontalPlane.push(ex);
    else if (/calf|calves/i.test(ex.pattern || "") || /calf/i.test(ex.name || "")) calves.push(ex);
    else accessories.push(ex);
  }

  let letterIdx = 0;

  // Power primers (solo — full rest)
  for (const ex of primers) {
    const letter = LETTERS[letterIdx++];
    const detailParts: string[] = [];
    if (ex.coaching_cue) detailParts.push(ex.coaching_cue);
    if (ex.week1_note) detailParts.push(ex.week1_note);
    result.push({
      name: `${letter}1. ${ex.name}`,
      detail: detailParts.join(" "),
      sets: ex.sets, reps: String(ex.reps),
      rir: null, rest: parseRest(ex.rest) || 120,
      type: "exercise", group: `${letter}${wk}`, superset_label: null,
    });
  }

  // Primary compounds (solo)
  for (const ex of primaries) {
    const letter = LETTERS[letterIdx++];
    const detailParts: string[] = [];
    if (ex.coaching_cue) detailParts.push(ex.coaching_cue);
    if (ex.week1_note) detailParts.push(ex.week1_note);
    result.push({
      name: `${letter}1. ${ex.name}`,
      detail: detailParts.join(" "),
      sets: ex.sets, reps: String(ex.reps),
      rir: null, rest: parseRest(ex.rest) || 150,
      type: "exercise", group: `${letter}${wk}`, superset_label: null,
    });
  }

  // Secondary compounds (superset if 2+)
  const secChunks = chunkSupersets(secondaries, 2);
  for (const chunk of secChunks) {
    const letter = LETTERS[letterIdx++];
    const groupId = `${letter}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, gi) => {
      const isLast = gi === chunk.length - 1;
      const detailParts: string[] = [];
      if (ex.coaching_cue) detailParts.push(ex.coaching_cue);
      if (ex.week1_note) detailParts.push(ex.week1_note);
      result.push({
        name: `${letter}${gi + 1}. ${ex.name}`,
        detail: detailParts.join(" "),
        sets: ex.sets, reps: String(ex.reps),
        rir: null, rest: isLast ? (parseRest(ex.rest) || 90) : null,
        type: "exercise", group: groupId, superset_label: chunk.length > 1 ? label : null,
      });
    });
  }

  // Accessories + frontal plane + calves — superset pairs
  const allAcc = [...accessories, ...frontalPlane, ...calves];
  const accChunks = chunkSupersets(allAcc, 2);
  for (const chunk of accChunks) {
    const letter = LETTERS[letterIdx++];
    const groupId = `${letter}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, gi) => {
      const isLast = gi === chunk.length - 1;
      const detailParts: string[] = [];
      if (ex.coaching_cue) detailParts.push(ex.coaching_cue);
      if (ex.week1_note) detailParts.push(ex.week1_note);
      result.push({
        name: `${letter}${gi + 1}. ${ex.name}`,
        detail: detailParts.join(" "),
        sets: ex.sets, reps: String(ex.reps),
        rir: null, rest: isLast ? (parseRest(ex.rest) || 60) : null,
        type: "exercise", group: groupId, superset_label: chunk.length > 1 ? label : null,
      });
    });
  }

  // Core (superset pairs)
  const coreChunks = chunkSupersets(coreExercises, 2);
  for (const chunk of coreChunks) {
    const letter = LETTERS[letterIdx++];
    const groupId = `${letter}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, gi) => {
      const isLast = gi === chunk.length - 1;
      const detailParts: string[] = [];
      if (ex.coaching_cue) detailParts.push(ex.coaching_cue);
      if (ex.week1_note) detailParts.push(ex.week1_note);
      result.push({
        name: `${letter}${gi + 1}. ${ex.name}`,
        detail: detailParts.join(" "),
        sets: ex.sets, reps: String(ex.reps),
        rir: null, rest: isLast ? (parseRest(ex.rest) || 60) : null,
        type: "exercise", group: groupId, superset_label: chunk.length > 1 ? label : null,
      });
    });
  }

  // Conditioning block
  if (conditioning) {
    const letter = LETTERS[letterIdx++];
    result.push({
      name: `${letter}1. ${conditioning.format || conditioning.type || "Conditioning"}`,
      detail: `${conditioning.description || ""}${conditioning.notes ? ` | ${conditioning.notes}` : ""}`,
      sets: 1, reps: conditioning.format || null,
      rir: null, rest: null,
      type: "conditioning", group: `${letter}${wk}`, superset_label: null,
    });
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

// ─── Rest / recovery day builders ──────────────────────────────────
function buildRestDay(weekNum: number, dayInWeek: number): any[] {
  const isActive = dayInWeek === 6;
  return [
    {
      name: isActive ? "Active Recovery" : "Full Rest Day",
      detail: isActive
        ? "Light movement day. 20–30 min Zone 2 cardio + 10 min mobility work."
        : "Complete rest. Sleep in, eat well, hydrate. Your body grows during recovery.",
      sets: 1, reps: isActive ? "20-30 min" : null, rir: null, rest: null,
      type: isActive ? "conditioning" : "rest", group: null, superset_label: null,
    },
    {
      name: isActive ? "Mobility Flow" : "Mindset Moment",
      detail: isActive
        ? "10-15 min full body stretch. Hip openers, thoracic spine rotation, hamstring stretches."
        : getMindset(weekNum, dayInWeek),
      sets: 1, reps: isActive ? "10-15 min" : null, rir: null, rest: null,
      type: isActive ? "warmup" : "mindset", group: null, superset_label: null,
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
      start_day = 1,
      days_per_week = 7,
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
    let targetProgramId = program_id;

    // Create program if needed
    if (create_program && !targetProgramId) {
      const name = program_name || data.meta?.program || "Imported Program";
      const desc = data.meta?.goal || data.meta?.phase_name || null;
      const { data: prog, error: progErr } = await supabase
        .from("programs")
        .insert({ name, description: desc, total_days: 1, created_by: userId || "00000000-0000-0000-0000-000000000000", is_published: false } as any)
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

    const results: string[] = [];
    const allRows: any[] = [];
    let dayNumber = start_day;

    // Process mesocycles
    const mesocycles = data.mesocycles || [];
    for (const meso of mesocycles) {
      const weeks = meso.weeks || [];
      for (const week of weeks) {
        const weekNum = week.week || 1;
        const isDeload = (week.week_label || "").toLowerCase().includes("deload");
        const trainingDays = week.days || [];

        for (let di = 0; di < trainingDays.length; di++) {
          const td = trainingDays[di];
          const exercises = convertNewFormatDay(td.exercises || [], td.conditioning || null, weekNum, di + 1);
          const deloadTag = isDeload ? " [DELOAD]" : "";
          const label = `Day ${di + 1} — ${td.day_label || `Training Day ${di + 1}`}${deloadTag}`;
          allRows.push({ program_id: targetProgramId, day_number: dayNumber, label, exercises });
          results.push(`✅ W${weekNum} D${di + 1} (#${dayNumber}): ${exercises.length} items`);
          dayNumber++;
        }

        // Fill remaining days with rest/recovery
        const trainingCount = trainingDays.length;
        for (let extra = trainingCount; extra < days_per_week; extra++) {
          const dayInWeek = extra + 1;
          const isDeloadDay = isDeload;
          const deloadTag = isDeloadDay ? " [DELOAD]" : "";
          if (dayInWeek === 6) {
            allRows.push({
              program_id: targetProgramId, day_number: dayNumber,
              label: `Day 6 — Active Recovery${deloadTag}`,
              exercises: buildRestDay(weekNum, 6),
            });
            results.push(`✅ W${weekNum} D6 (#${dayNumber}): Active Recovery`);
          } else {
            allRows.push({
              program_id: targetProgramId, day_number: dayNumber,
              label: `Day 7 — Rest Day${deloadTag}`,
              exercises: buildRestDay(weekNum, 7),
            });
            results.push(`✅ W${weekNum} D7 (#${dayNumber}): Rest`);
          }
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
    if (start_day === 1) {
      await supabase.from("programs").update({ total_days: totalDays, published_through_day: totalDays }).eq("id", targetProgramId);
    } else {
      const { data: cur } = await supabase.from("programs").select("total_days").eq("id", targetProgramId).single();
      const newTotal = Math.max((cur as any)?.total_days || 0, totalDays);
      await supabase.from("programs").update({ total_days: newTotal, published_through_day: newTotal }).eq("id", targetProgramId);
    }

    return new Response(JSON.stringify({
      success: true, program_id: targetProgramId,
      total_days_imported: allRows.length, start_day, end_day: dayNumber - 1, results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
