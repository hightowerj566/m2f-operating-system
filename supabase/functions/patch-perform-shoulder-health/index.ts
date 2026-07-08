import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";
    const { url } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const debugDay = body.debug_day || null;

    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    // Debug mode: just return exercises for a specific day
    if (debugDay) {
      const day = allDays!.find((d: any) => d.day_number === debugDay);
      if (!day) return new Response(JSON.stringify({ error: "Day not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const exercises = day.exercises as any[];
      return new Response(JSON.stringify({
        day_number: day.day_number,
        label: day.label,
        dow: ((day.day_number - 1) % 7) + 1,
        exercise_count: exercises.length,
        exercise_names: exercises.map((e: any) => ({ name: e.name, type: e.type })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let totalFixes = 0;
    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    for (const day of allDays!) {
      const dn = day.day_number;
      const dow = ((dn - 1) % 7) + 1; // 1-7
      const week = Math.ceil(dn / 7);
      const mesoWeek = ((week - 1) % 4) + 1;
      const isDeload = mesoWeek === 4;
      let exercises = [...(day.exercises as any[])];
      let modified = false;

      // ── FIX 1: D2 (dow=2, Lower Strength) — Add DB External Rotation ──
      if (dow === 2) {
        const hasER = exercises.some((e: any) =>
          /external\s*rot/i.test(e.name || "")
        );
        if (!hasER) {
          const insertIdx = findInsertBeforeMindset(exercises);
          exercises.splice(insertIdx, 0, {
            name: "Dumbbell External Rotation",
            type: "exercise",
            sets: isDeload ? 2 : 2,
            reps: "15 each",
            rest: 45,
            rir: null,
            detail: "Side-lying or standing. Elbow pinned at 90°. Slow eccentric (3s). Alternate weekly with Band ER.",
            group: `ERW${week}D2`,
            superset_label: null,
          });
          fixes.push(`Day ${dn} (D2 W${week}): Added DB External Rotation`);
          modified = true;
        }
      }

      // ── FIX 2: D5 (dow=5, Lower Hypertrophy) — Add Band/DB External Rotation ──
      if (dow === 5) {
        const hasER = exercises.some((e: any) =>
          /external\s*rot/i.test(e.name || "")
        );
        if (!hasER) {
          const insertIdx = findInsertBeforeMindset(exercises);
          const isOddWeek = week % 2 === 1;
          exercises.splice(insertIdx, 0, {
            name: isOddWeek ? "Band External Rotation" : "Dumbbell External Rotation",
            type: "exercise",
            sets: isDeload ? 2 : 2,
            reps: "15 each",
            rest: 45,
            rir: null,
            detail: isOddWeek
              ? "Band at elbow height. Squeeze at end range. 2s hold."
              : "Side-lying. Elbow pinned at 90°. Slow eccentric (3s).",
            group: `ERW${week}D5`,
            superset_label: null,
          });
          fixes.push(`Day ${dn} (D5 W${week}): Added ${isOddWeek ? "Band" : "DB"} External Rotation`);
          modified = true;
        }
      }

      // ── FIX 3: D3 (dow=3, Conditioning + Core) — Add Scap Push-Up ──
      if (dow === 3) {
        const hasScapPU = exercises.some((e: any) =>
          /scap\s*push/i.test(e.name || "")
        );
        if (!hasScapPU) {
          // Insert before mindset/mission
          const insertIdx = findInsertBeforeMindset(exercises);
          exercises.splice(insertIdx, 0, {
            name: "Scap Push-Up",
            type: "exercise",
            sets: isDeload ? 2 : 2,
            reps: "12",
            rest: 45,
            rir: null,
            detail: "Full protraction at top — push the floor away. No elbow bend. Serratus activation.",
            group: `SCAPW${week}D3`,
            superset_label: null,
          });
          fixes.push(`Day ${dn} (D3 W${week}): Added Scap Push-Up`);
          modified = true;
        }
      }

      // ── FIX 4: D1 (dow=1, Upper Strength) — Verify Serratus Wall Slide ──
      if (dow === 1) {
        const hasSerratus = exercises.some((e: any) =>
          /serratus/i.test(e.name || "")
        );
        if (!hasSerratus) {
          const insertIdx = findInsertBeforeMindset(exercises);
          exercises.splice(insertIdx, 0, {
            name: "Serratus Wall Slide",
            type: "exercise",
            sets: isDeload ? 2 : 3,
            reps: "12",
            rest: 45,
            rir: null,
            detail: "Slow control. Full upward rotation. Keep ribs down. Forearms flat on wall.",
            group: `SERW${week}D1`,
            superset_label: null,
          });
          fixes.push(`Day ${dn} (D1 W${week}): Restored missing Serratus Wall Slide`);
          modified = true;
        }
      }

      // ── FIX 5: D4 (dow=4) — Bump Prone Y Raise sets in Mesos 3-4 (weeks 9+) ──
      if (dow === 4 && week > 8) {
        const proneYIdx = exercises.findIndex((e: any) =>
          /prone\s*y/i.test(e.name || "")
        );
        if (proneYIdx >= 0) {
          const currentSets = exercises[proneYIdx].sets || 2;
          const targetSets = isDeload ? 2 : 3;
          if (currentSets < targetSets) {
            exercises[proneYIdx] = { ...exercises[proneYIdx], sets: targetSets };
            fixes.push(`Day ${dn} (D4 W${week}): Prone Y Raise ${currentSets}→${targetSets} sets`);
            modified = true;
          }
        }
      }

      // ── FIX 6: D1 + D4 — Add scap cue to B1 pressing ──
      if (dow === 1 || dow === 4) {
        for (let i = 0; i < exercises.length; i++) {
          const name = exercises[i].name || "";
          if (/^B1\./i.test(name) || /bench|press|incline/i.test(name) && /^B/i.test(name)) {
            const detail = exercises[i].detail || "";
            if (!detail.includes("Set scaps")) {
              exercises[i] = {
                ...exercises[i],
                detail: detail.trimEnd() + " Set scaps: retract + depress before unracking.",
              };
              fixes.push(`Day ${dn} (D${dow} W${week}): Added scap cue to ${name}`);
              modified = true;
              break; // only first B1
            }
          }
        }
      }

      // ── FIX 7: D6 (dow=6, Hybrid Conditioning) — Add Face Pull ──
      if (dow === 6) {
        const hasFP = exercises.some((e: any) =>
          /face\s*pull/i.test(e.name || "")
        );
        if (!hasFP) {
          // Insert at start (pre-conditioning warm-up)
          exercises.splice(0, 0, {
            name: "Face Pull",
            type: "exercise",
            sets: isDeload ? 2 : 3,
            reps: "15",
            rest: 45,
            rir: null,
            detail: "External rotation at top. Squeeze rear delts. Light weight, perfect form.",
            group: `FPW${week}D6`,
            superset_label: null,
          });
          fixes.push(`Day ${dn} (D6 W${week}): Added Face Pull`);
          modified = true;
        }
      }

      // ── FIX 8: D6 — Add Lateral Raise ──
      if (dow === 6) {
        const hasLR = exercises.some((e: any) =>
          /lateral\s*raise|lat\s*raise/i.test(e.name || "")
        );
        if (!hasLR) {
          // Insert after face pull
          const fpIdx = exercises.findIndex((e: any) => /face\s*pull/i.test(e.name || ""));
          const insertIdx = fpIdx >= 0 ? fpIdx + 1 : 1;
          const isOddWeek = week % 2 === 1;
          exercises.splice(insertIdx, 0, {
            name: isOddWeek ? "Dumbbell Lateral Raise" : "Cable Lateral Raise",
            type: "exercise",
            sets: isDeload ? 2 : 3,
            reps: "12",
            rest: 45,
            rir: null,
            detail: isOddWeek
              ? "Slight forward lean. Lead with pinkies. 3s eccentric."
              : "Single arm, cable behind body. Peak squeeze at top. 2s hold.",
            group: `LRW${week}D6`,
            superset_label: "Superset",
          });
          fixes.push(`Day ${dn} (D6 W${week}): Added ${isOddWeek ? "DB" : "Cable"} Lateral Raise`);
          modified = true;
        }
      }

      if (modified) {
        updates.push({ id: day.id, exercises });
        totalFixes++;
      }
    }

    // Apply updates (unless dry run)
    if (!dryRun) {
      for (const upd of updates) {
        const { error: updErr } = await supabase
          .from("program_days")
          .update({ exercises: upd.exercises })
          .eq("id", upd.id);
        if (updErr) throw new Error(`Update ${upd.id} failed: ${updErr.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        days_modified: totalFixes,
        total_fixes: fixes.length,
        fixes_by_type: {
          d2_db_external_rotation: fixes.filter(f => f.includes("D2") && f.includes("External")).length,
          d5_band_db_external_rotation: fixes.filter(f => f.includes("D5") && f.includes("External")).length,
          d3_scap_pushup: fixes.filter(f => f.includes("Scap Push")).length,
          d1_serratus_restored: fixes.filter(f => f.includes("Serratus")).length,
          d4_prone_y_bump: fixes.filter(f => f.includes("Prone Y")).length,
          b1_scap_cue: fixes.filter(f => f.includes("scap cue")).length,
          d6_face_pull: fixes.filter(f => f.includes("Face Pull")).length,
          d6_lateral_raise: fixes.filter(f => f.includes("Lateral Raise")).length,
        },
        details: fixes.slice(0, 50),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PATCH-SHOULDER-SYSTEM] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function findInsertBeforeMindset(exercises: any[]): number {
  for (let i = 0; i < exercises.length; i++) {
    if (exercises[i].type === "mindset" || exercises[i].type === "mission") return i;
  }
  return exercises.length;
}
