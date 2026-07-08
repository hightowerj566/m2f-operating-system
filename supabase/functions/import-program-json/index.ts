import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExInput {
  exercise: string;
  sets: number;
  reps: string | null;
  rir: number | null;
  intensity_technique: string | null;
  notes?: string | null;
}

interface Conditioning {
  type: string;
  duration: string;
  description: string;
}

interface Workout {
  day: number;
  focus: string;
  movement_pattern_emphasis: string;
  warmup: ExInput[];
  explosive_movement: ExInput[];
  primary_strength: ExInput[];
  secondary_strength: ExInput[];
  accessories: ExInput[];
  core: ExInput[];
  conditioning: Conditioning | null;
}

interface Week {
  week: number;
  workouts: Workout[];
}

interface Phase {
  phase_name: string;
  weeks: Week[];
}

interface ProgramJSON {
  program_name: string;
  phases: Phase[];
}

// ─── Audit Fix #1-7 ────────────────────────────────────────────────
// Applied during import to correct volume imbalances, redundancy, and ratio issues
function applyAuditFixes(workout: Workout, phaseIdx: number): Workout {
  const w: Workout = JSON.parse(JSON.stringify(workout));

  // ── Fix 1: Replace Leg Press → Leg Extension on Day 1 (all phases) ──
  if (w.day === 1) {
    w.accessories = w.accessories.map((ex) => {
      if (/leg press/i.test(ex.exercise)) {
        return {
          ...ex,
          exercise: "Leg Extension",
          intensity_technique: null,
          notes:
            "Low-fatigue quad isolation. Full ROM — squeeze at top, control the negative. Replaces Leg Press to eliminate bilateral quad compound stacking.",
        };
      }
      return ex;
    });
  }

  // ── Fix 2: Day 4 hinge stacking ──
  if (w.day === 4) {
    // Phase 1 (Hypertrophy): Replace SL RDL → Reverse Lunge, fix conditioning
    if (phaseIdx === 0) {
      w.accessories = w.accessories.map((ex) => {
        if (/single.leg rdl/i.test(ex.exercise)) {
          return {
            ...ex,
            exercise: "Reverse Lunge (dumbbell)",
            reps: "10 each",
            notes:
              "Unilateral knee-dominant. Step back, drive through front heel. Eliminates hinge stacking.",
          };
        }
        return ex;
      });
      // Replace hinge-based conditioning with non-hinge
      if (w.conditioning) {
        w.conditioning = {
          type: "High-Intensity",
          duration: "8 min",
          description:
            "4 Rounds: 20s Assault Bike Sprint | 40s rest. Max effort — no hinge overlap.",
        };
      }
    }

    // Phase 2 (Strength): Replace Deficit DL → Barbell Row, SL RDL → Reverse Lunge
    if (phaseIdx === 1) {
      w.secondary_strength = (w.secondary_strength || []).map((ex) => {
        if (/deficit/i.test(ex.exercise)) {
          return {
            ...ex,
            exercise: "Barbell Bent-Over Row",
            reps: "6",
            intensity_technique: "cluster set",
            notes:
              "Adds pulling volume to hinge day. 2-rep clusters, 20s rest. Fixes pull:press ratio.",
          };
        }
        return ex;
      });
      w.accessories = w.accessories.map((ex) => {
        if (/single.leg rdl/i.test(ex.exercise)) {
          return {
            ...ex,
            exercise: "Reverse Lunge (dumbbell)",
            reps: "10 each",
            notes:
              "Unilateral knee-dominant. Eliminates hinge stacking on DL day.",
          };
        }
        return ex;
      });
    }

    // Phase 3 (Power): Replace SL RDL → Reverse Lunge + Add calves (missing entirely)
    if (phaseIdx === 2) {
      w.accessories = w.accessories.map((ex) => {
        if (/single.leg rdl/i.test(ex.exercise)) {
          return {
            ...ex,
            exercise: "Reverse Lunge (dumbbell)",
            reps: "8 each",
            notes:
              "Unilateral knee-dominant. Eliminates hinge stacking on DL day during Power phase.",
          };
        }
        return ex;
      });
      const hasCalves = w.accessories.some((ex) => /calf/i.test(ex.exercise));
      if (!hasCalves) {
        w.accessories.push({
          exercise: "Standing Calf Raise",
          sets: 3,
          reps: "10",
          rir: 2,
          intensity_technique: null,
          notes: "Maintains calf volume during Power phase.",
        });
      }
    }
  }

  // ── Fix 3: Add pulling volume to Day 2 — replace DB Fly with a Row ──
  if (w.day === 2) {
    w.accessories = w.accessories.map((ex) => {
      if (/fly|flye/i.test(ex.exercise)) {
        const rowName =
          phaseIdx === 2 ? "Chest-Supported Row" : "Seated Cable Row";
        const rowReps = phaseIdx === 2 ? "8" : phaseIdx === 1 ? "10" : "12";
        return {
          ...ex,
          exercise: rowName,
          reps: rowReps,
          intensity_technique: phaseIdx === 0 ? "myo-reps" : null,
          notes:
            "Horizontal pull — fixes pull:press ratio. Squeeze shoulder blades at contraction.",
        };
      }
      return ex;
    });
  }

  // ── Fix 4: Increase calf volume — bump all calf exercises +1 set ──
  if (w.day !== 3) {
    w.accessories = w.accessories.map((ex) => {
      if (/calf/i.test(ex.exercise) && ex.sets < 5) {
        return { ...ex, sets: ex.sets + 1 };
      }
      return ex;
    });
  }

  // ── Fix 5: Increase side delt volume — bump lat raises on D2 and D5 ──
  if (w.day === 2 || w.day === 5) {
    let boosted = false;
    w.accessories = w.accessories.map((ex) => {
      if (/lateral raise/i.test(ex.exercise) && !boosted) {
        boosted = true;
        return { ...ex, sets: Math.min(ex.sets + 1, 4) };
      }
      return ex;
    });
  }

  // ── Fix 6: Reduce core volume — cap at 2 sets per exercise (except D3) ──
  if (w.day !== 3) {
    w.core = w.core.map((ex) => ({
      ...ex,
      sets: Math.min(ex.sets, 2),
    }));
  }

  // ── Fix 7a: Phase 2 Day 5 — Remove Seated DB Press (redundant V. push), add pulling ──
  if (w.day === 5 && phaseIdx === 1) {
    w.accessories = w.accessories.filter(
      (ex) => !/seated db press/i.test(ex.exercise)
    );
    // Add a pulling isolation to replace the removed press
    w.accessories.push({
      exercise: "Straight-Arm Pulldown",
      sets: 3,
      reps: "12",
      rir: 2,
      intensity_technique: null,
      notes:
        "Lat isolation. Replaces redundant vertical press. Fixes pull:press ratio.",
    });
  }

  // ── Fix 7b: Phase 3 Day 5 — Add arm isolation (currently 0 direct sets) ──
  if (w.day === 5 && phaseIdx === 2) {
    const hasCurl = w.accessories.some((ex) => /curl/i.test(ex.exercise));
    if (!hasCurl) {
      w.accessories.push({
        exercise: "EZ-Bar Curl",
        sets: 3,
        reps: "8",
        rir: 2,
        intensity_technique: null,
        notes: "Arm maintenance during Power phase. Superset with pushdowns.",
      });
      w.accessories.push({
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "8",
        rir: 2,
        intensity_technique: null,
        notes:
          "Arm maintenance during Power phase. Superset with curls for time efficiency.",
      });
    }
  }

  // ── Fix 8: Day 5 — Replace Incline DB Press with Landmine Press (distinct from D2's flat bench + incline DB) ──
  if (w.day === 5) {
    const replaceIncline = (list: ExInput[]) =>
      list.map((ex) => {
        if (/incline\s*(dumbbell|db)\s*press/i.test(ex.exercise)) {
          const lmReps = phaseIdx === 2 ? "6 each" : phaseIdx === 1 ? "8 each" : "10 each";
          return {
            ...ex,
            exercise: "Landmine Press",
            reps: lmReps,
            notes:
              "Unique pressing angle between incline and overhead. Hits upper chest + anterior delt without duplicating D2's flat bench + incline DB. Unilateral — brace core, press at ~45° angle.",
          };
        }
        return ex;
      });
    w.secondary_strength = replaceIncline(w.secondary_strength || []);
    w.accessories = replaceIncline(w.accessories);
  }

  return w;
}

// ─── Exercise conversion helpers ───────────────────────────────────

function buildDetail(ex: ExInput): string {
  const parts: string[] = [];
  if (ex.intensity_technique) {
    parts.push(`[${ex.intensity_technique.toUpperCase()}]`);
  }
  if (ex.notes) {
    parts.push(ex.notes.trim());
  }
  return parts.join(" ").trim() || "";
}

/**
 * Chunk an array into superset groups of 2-3 items.
 * Rules: groups of 2 preferred. If odd count, last group becomes a tri-set.
 * 1 item = solo. 2 = superset. 3 = tri-set.
 * 4 = 2+2. 5 = 2+3. 6 = 3+3 or 2+2+2. 7 = 2+2+3.
 */
function chunkSupersets<T>(items: T[], maxSize: number = 3): T[][] {
  if (items.length <= maxSize) return items.length > 0 ? [items] : [];
  const chunks: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;
    if (remaining <= maxSize) {
      chunks.push(items.slice(i));
      break;
    }
    if (remaining === 4) {
      // 2 + 2 is better than 3 + 1
      chunks.push(items.slice(i, i + 2));
      i += 2;
    } else {
      // Take 2 by default; take 3 if remaining would leave a solo
      const take = (remaining - 2 === 1) ? 3 : 2;
      chunks.push(items.slice(i, i + take));
      i += take;
    }
  }
  return chunks;
}

function convertWorkout(workout: Workout, weekNum: number): any[] {
  const exercises: any[] = [];
  const wk = `W${weekNum}D${workout.day}`;

  // ── Warmups: group as circuit (already 2-3 exercises) ──
  workout.warmup.forEach((ex, i) => {
    exercises.push({
      name: `W${i + 1}. ${ex.exercise}`,
      detail: buildDetail(ex),
      sets: ex.sets,
      reps: ex.reps ? String(ex.reps) : null,
      rir: null,
      rest: i === workout.warmup.length - 1 ? 45 : null,
      type: "warmup",
      group: `wu${wk}`,
      superset_label: null,
    });
  });

  // ── Explosive: contrast training pair (grouped together) ──
  const explosiveGroup = `ppA${wk}`;
  const explosiveLabel = workout.explosive_movement.length >= 3 ? "Tri-Set" :
                          workout.explosive_movement.length === 2 ? "Contrast" : null;
  workout.explosive_movement.forEach((ex, i) => {
    const isLast = i === workout.explosive_movement.length - 1;
    exercises.push({
      name: `A${i + 1}. ${ex.exercise}`,
      detail: buildDetail(ex),
      sets: ex.sets,
      reps: ex.reps ? String(ex.reps) : null,
      rir: ex.rir != null ? String(ex.rir) : "N/A",
      rest: isLast ? 90 : null,
      type: "exercise",
      group: explosiveGroup,
      superset_label: workout.explosive_movement.length > 1 ? explosiveLabel : null,
    });
  });

  // ── Primary Strength: always solo (heavy compound, long rest) ──
  workout.primary_strength.forEach((ex, i) => {
    exercises.push({
      name: `B${i + 1}. ${ex.exercise}`,
      detail: buildDetail(ex),
      sets: ex.sets,
      reps: ex.reps ? String(ex.reps) : null,
      rir: ex.rir != null ? String(ex.rir) : null,
      rest: 150,
      type: "exercise",
      group: `psB${i}${wk}`,
      superset_label: null,
    });
  });

  // ── Secondary Strength: superset if 2+, solo if 1 ──
  const secChunks = chunkSupersets(workout.secondary_strength, 2);
  secChunks.forEach((chunk, chunkIdx) => {
    const groupId = `sc${chunkIdx}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, i) => {
      const globalIdx = secChunks.slice(0, chunkIdx).reduce((s, c) => s + c.length, 0) + i;
      const isLast = i === chunk.length - 1;
      exercises.push({
        name: `C${globalIdx + 1}. ${ex.exercise}`,
        detail: buildDetail(ex),
        sets: ex.sets,
        reps: ex.reps ? String(ex.reps) : null,
        rir: ex.rir != null ? String(ex.rir) : null,
        rest: isLast ? 90 : null,
        type: "exercise",
        group: groupId,
        superset_label: chunk.length > 1 ? label : null,
      });
    });
  });

  // ── Accessories: chunk into supersets of 2-3 ──
  const accChunks = chunkSupersets(workout.accessories, 3);
  accChunks.forEach((chunk, chunkIdx) => {
    const groupId = `ha${chunkIdx}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, i) => {
      const globalIdx = accChunks.slice(0, chunkIdx).reduce((s, c) => s + c.length, 0) + i;
      const isLast = i === chunk.length - 1;
      exercises.push({
        name: `D${globalIdx + 1}. ${ex.exercise}`,
        detail: buildDetail(ex),
        sets: ex.sets,
        reps: ex.reps ? String(ex.reps) : null,
        rir: ex.rir != null ? String(ex.rir) : null,
        rest: isLast ? 60 : null,
        type: "exercise",
        group: groupId,
        superset_label: chunk.length > 1 ? label : null,
      });
    });
  });

  // ── Core: natural superset (2 exercises) ──
  const coreChunks = chunkSupersets(workout.core, 3);
  coreChunks.forEach((chunk, chunkIdx) => {
    const groupId = `core${chunkIdx}${wk}`;
    const label = chunk.length >= 3 ? "Tri-Set" : chunk.length === 2 ? "Superset" : null;
    chunk.forEach((ex, i) => {
      const globalIdx = coreChunks.slice(0, chunkIdx).reduce((s, c) => s + c.length, 0) + i;
      const isLast = i === chunk.length - 1;
      exercises.push({
        name: `E${globalIdx + 1}. ${ex.exercise}`,
        detail: buildDetail(ex),
        sets: ex.sets,
        reps: ex.reps ? String(ex.reps) : null,
        rir: null,
        rest: isLast ? 45 : null,
        type: "exercise",
        group: groupId,
        superset_label: chunk.length > 1 ? label : null,
      });
    });
  });

  if (workout.conditioning) {
    const c = workout.conditioning;
    const condName =
      c.type === "Zone 2"
        ? `F. Zone 2 Cardio — ${c.duration}`
        : `F. Conditioning — ${c.duration}`;
    exercises.push({
      name: condName,
      detail: c.description,
      sets: 1,
      reps: null,
      rir: "N/A",
      rest: null,
      type: "conditioning",
      group: `cf${wk}`,
      superset_label: null,
    });
  }

  exercises.push({
    name: "Mindset Moment",
    detail: getMindsetMoment(weekNum, workout.day),
    sets: 1,
    reps: null,
    rir: null,
    rest: null,
    type: "mindset",
    group: null,
    superset_label: null,
  });

  exercises.push({
    name: "Dad Mission",
    detail: getDadMission(weekNum, workout.day),
    sets: 1,
    reps: null,
    rir: null,
    rest: null,
    type: "mission",
    group: null,
    superset_label: null,
  });

  return exercises;
}

// ─── Content pools ─────────────────────────────────────────────────

const MINDSET_MOMENTS = [
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

const DAD_MISSIONS = [
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

function getMindsetMoment(week: number, day: number): string {
  return MINDSET_MOMENTS[
    ((week - 1) * 5 + (day - 1)) % MINDSET_MOMENTS.length
  ];
}

function getDadMission(week: number, day: number): string {
  return DAD_MISSIONS[((week - 1) * 5 + (day - 1)) % DAD_MISSIONS.length];
}

function buildRestDay(weekNum: number, dayInWeek: number): any[] {
  const isActiveRecovery = dayInWeek === 6;
  return [
    {
      name: isActiveRecovery ? "Active Recovery" : "Full Rest Day",
      detail: isActiveRecovery
        ? "Light movement day. Focus on mobility, stretching, and low-intensity activity. Walk with your family, do yoga, or play with your kids. Keep heart rate below 120 BPM."
        : "Complete rest. Sleep in, eat well, hydrate. Your body grows during recovery, not during training. Spend quality time with your family.",
      sets: 1,
      reps: null,
      rir: null,
      rest: null,
      type: "rest",
      group: null,
      superset_label: null,
    },
    {
      name: isActiveRecovery ? "Mobility Flow" : "Mindset Moment",
      detail: isActiveRecovery
        ? "10-15 min full body stretch. Hip openers, thoracic spine rotation, hamstring stretches, shoulder dislocates. Foam roll any tight areas."
        : getMindsetMoment(weekNum, dayInWeek),
      sets: 1,
      reps: isActiveRecovery ? "10-15 min" : null,
      rir: null,
      rest: null,
      type: isActiveRecovery ? "warmup" : "mindset",
      group: null,
      superset_label: null,
    },
    {
      name: "Dad Mission",
      detail: getDadMission(weekNum, dayInWeek),
      sets: 1,
      reps: null,
      rir: null,
      rest: null,
      type: "mission",
      group: null,
      superset_label: null,
    },
  ];
}

function buildLabel(workout: Workout): string {
  return `Day ${workout.day} — ${workout.focus}`;
}

function getPhaseLabel(phaseIdx: number): string {
  const labels = ["Hypertrophy", "Strength", "Power & Peaking"];
  return labels[phaseIdx % labels.length];
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      program_id,
      storage_path,
      total_weeks = 52,
      days_per_week = 7,
      start_week = 1,
      end_week,
      apply_audit_fixes = false,
    } = await req.json();

    if (!program_id || !storage_path) {
      return new Response(
        JSON.stringify({ error: "program_id and storage_path required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download JSON from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("exercise-videos")
      .download(storage_path);

    if (dlError || !fileData) {
      return new Response(
        JSON.stringify({
          error: `Storage download failed: ${dlError?.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jsonText = await fileData.text();
    const data: ProgramJSON = JSON.parse(jsonText);

    // Flatten all workouts from all phases into a linear list of weeks
    const sourceWeeks: { phaseIdx: number; week: Week }[] = [];
    data.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week) => {
        sourceWeeks.push({ phaseIdx, week });
      });
    });
    const sourceWeekCount = sourceWeeks.length;

    const finalEndWeek = end_week || total_weeks;
    const results: string[] = [];
    let fixesApplied = 0;

    for (
      let targetWeek = start_week;
      targetWeek <= finalEndWeek;
      targetWeek++
    ) {
      const sourceIdx = (targetWeek - 1) % sourceWeekCount;
      const { phaseIdx, week: sourceWeek } = sourceWeeks[sourceIdx];
      const phaseLabel = getPhaseLabel(phaseIdx);

      for (const workout of sourceWeek.workouts) {
        const dayNumber = (targetWeek - 1) * days_per_week + workout.day;

        // Apply audit fixes if enabled
        const finalWorkout = apply_audit_fixes
          ? applyAuditFixes(workout, phaseIdx)
          : workout;
        if (apply_audit_fixes) fixesApplied++;

        const exercises = convertWorkout(finalWorkout, targetWeek);

        const weekInMeso = ((targetWeek - 1) % 4) + 1;
        const deloadTag = weekInMeso === 4 ? " [DELOAD]" : "";
        const label = `${buildLabel(finalWorkout)}${deloadTag}`;

        const { error } = await supabase.from("program_days").upsert(
          { program_id, day_number: dayNumber, label, exercises },
          { onConflict: "program_id,day_number" }
        );

        if (error) {
          results.push(
            `❌ W${targetWeek} D${workout.day} (#${dayNumber}): ${error.message}`
          );
        } else {
          results.push(
            `✅ W${targetWeek} D${workout.day} (#${dayNumber}): ${exercises.length} ex [${phaseLabel}]`
          );
        }
      }

      // Day 6: Active Recovery
      const day6Number = (targetWeek - 1) * days_per_week + 6;
      const day6Exercises = buildRestDay(targetWeek, 6);
      const { error: d6Err } = await supabase.from("program_days").upsert(
        {
          program_id,
          day_number: day6Number,
          label: "Day 6 — Active Recovery & Mobility",
          exercises: day6Exercises,
        },
        { onConflict: "program_id,day_number" }
      );
      if (d6Err)
        results.push(`❌ W${targetWeek} D6 (#${day6Number}): ${d6Err.message}`);
      else results.push(`✅ W${targetWeek} D6 (#${day6Number}): Recovery`);

      // Day 7: Full Rest
      const day7Number = (targetWeek - 1) * days_per_week + 7;
      const day7Exercises = buildRestDay(targetWeek, 7);
      const { error: d7Err } = await supabase.from("program_days").upsert(
        {
          program_id,
          day_number: day7Number,
          label: "Day 7 — Rest Day",
          exercises: day7Exercises,
        },
        { onConflict: "program_id,day_number" }
      );
      if (d7Err)
        results.push(`❌ W${targetWeek} D7 (#${day7Number}): ${d7Err.message}`);
      else results.push(`✅ W${targetWeek} D7 (#${day7Number}): Rest`);
    }

    // Update program total_days
    const newTotalDays = finalEndWeek * days_per_week;
    await supabase
      .from("programs")
      .update({ total_days: newTotalDays })
      .eq("id", program_id);

    return new Response(
      JSON.stringify({
        success: true,
        total_weeks: finalEndWeek,
        total_days: newTotalDays,
        source_weeks: sourceWeekCount,
        fixes_applied: fixesApplied,
        audit_fixes_enabled: apply_audit_fixes,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
