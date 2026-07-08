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

    // Get body params
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .gte("day_number", 1)
      .lte("day_number", 28)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    // RIR by week: W1=3, W2=2, W3=1, W4=4(deload)
    function getRIR(week: number): number {
      if (week === 1) return 3;
      if (week === 2) return 2;
      if (week === 3) return 1;
      return 4; // deload
    }

    function isDeload(week: number): boolean {
      return week === 4;
    }

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1; // 1=D1, 2=D2, etc.
      const week = Math.ceil(day.day_number / 7);
      if (dow === 6 || dow === 7) continue; // skip conditioning/rest
      
      const rir = getRIR(week);
      const deload = isDeload(week);
      let exercises = [...(day.exercises as any[])];
      let modified = false;
      const weekLabel = `W${week}D${dow}`;

      // ═══════════════════════════════════════════════════
      // D1 FIXES: Add A0. Rotational Scoop Toss if missing
      // ═══════════════════════════════════════════════════
      if (dow === 1) {
        const hasScoopToss = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("scoop toss")
        );
        if (!hasScoopToss) {
          exercises.unshift({
            name: "A0. Rotational Med Ball Scoop Toss",
            detail: "Explosive rotational power. Alternate sides. Full hip turn, release at chest height.",
            sets: deload ? 2 : 3,
            reps: "4 each",
            rest: 60,
            rir: null,
            type: "exercise",
            group: `A0${weekLabel}`,
            superset_label: null,
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED A0. Rotational Scoop Toss`);
        }
      }

      // ═══════════════════════════════════════════════════
      // D2 FIXES: Add Suitcase Carry, reduce Walking Lunge
      // ═══════════════════════════════════════════════════
      if (dow === 2) {
        // Reduce Walking Lunge
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("walking lunge") || name.includes("lunge")) {
            const targetSets = deload ? 2 : (week === 1 ? 2 : 3);
            if ((ex.sets || 0) > targetSets) {
              modified = true;
              fixes.push(`Day ${day.day_number}: Walking Lunge ${ex.sets}→${targetSets} sets`);
              return { ...ex, sets: targetSets, rir: rir };
            }
          }
          return ex;
        });

        // Add Suitcase Carry if missing
        const hasSuitcase = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("suitcase carry")
        );
        if (!hasSuitcase) {
          // Insert before mindset/mission
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (["mindset", "mission", "conditioning"].includes(exercises[i].type)) {
              insertIdx = i;
            }
          }
          exercises.splice(insertIdx, 0, {
            name: "F1. Suitcase Carry",
            detail: "Anti-lateral flexion. Brace hard, walk tall. Switch hands each set.",
            sets: deload ? 2 : 3,
            reps: "30m each",
            rest: 60,
            rir: null,
            type: "exercise",
            group: `F${weekLabel}`,
            superset_label: null,
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED F1. Suitcase Carry`);
        }
      }

      // ═══════════════════════════════════════════════════
      // D3 FIXES: Add Rotational Slam, Add Woodchop, bump Lat Raise, reorder
      // ═══════════════════════════════════════════════════
      if (dow === 3) {
        // Add Rotational Slam at start if missing
        const hasSlam = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("slam")
        );
        if (!hasSlam) {
          exercises.unshift({
            name: "A0. Rotational Med Ball Slam",
            detail: "Explosive rotational slam. Full hip rotation, slam into ground. Alternate sides.",
            sets: deload ? 2 : 3,
            reps: "5 each",
            rest: 60,
            rir: null,
            type: "exercise",
            group: `A0${weekLabel}`,
            superset_label: null,
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED A0. Rotational Slam`);
        }

        // Bump Cable Lateral Raise to 4 sets (or 2 for deload)
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise")) {
            const targetSets = deload ? 2 : 4;
            if ((ex.sets || 0) !== targetSets) {
              modified = true;
              fixes.push(`Day ${day.day_number}: Cable Lat Raise ${ex.sets}→${targetSets} sets`);
              return { ...ex, sets: targetSets, rir: Math.max(rir - 1, 1), group: `A${weekLabel}` };
            }
          }
          return ex;
        });

        // Add Cable Woodchop if missing
        const hasWoodchop = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("woodchop")
        );
        if (!hasWoodchop) {
          // Find the Pallof Press to add woodchop after it
          const pallofIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("pallof")
          );
          const insertIdx = pallofIdx !== -1 ? pallofIdx + 1 : exercises.length;

          // Get the group from the Pallof
          const pallofGroup = pallofIdx !== -1 ? exercises[pallofIdx].group : `C${weekLabel}`;

          exercises.splice(insertIdx, 0, {
            name: "C3. Cable Woodchop",
            detail: "Controlled rotation. Anti-rotation emphasis on decel.",
            sets: deload ? 1 : 2,
            reps: "10 each",
            rest: 45,
            rir: rir,
            type: "exercise",
            group: pallofGroup || `C${weekLabel}`,
            superset_label: "Superset",
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED C3. Cable Woodchop (${deload ? 1 : 2} sets)`);
        }

        // Fix grouping: ensure core exercises are C-block triset
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("ab wheel")) {
            return { ...ex, name: "C1. Ab Wheel", group: `C${weekLabel}`, superset_label: "Superset" };
          }
          if (name.includes("pallof")) {
            return { ...ex, name: "C2. Pallof Press", group: `C${weekLabel}`, superset_label: "Superset" };
          }
          if (name.includes("woodchop")) {
            return { ...ex, name: "C3. Cable Woodchop", group: `C${weekLabel}`, superset_label: "Superset" };
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════════
      // D4 FIXES: Landmine Rotation, CS DB Row, Hammer Curl, Prone Y, Lat Raise grouping
      // ═══════════════════════════════════════════════════
      if (dow === 4) {
        // Replace Landmine Press with Landmine Rotation
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("landmine press")) {
            modified = true;
            fixes.push(`Day ${day.day_number}: REPLACED Landmine Press → Landmine Rotation`);
            return {
              ...ex,
              name: "C1. Half-Kneeling Landmine Rotation",
              detail: "Controlled rotation through thoracic spine. Anti-rotation emphasis on decel.",
              group: `C${weekLabel}`,
              superset_label: "Superset",
            };
          }
          return ex;
        });

        // Add B2. Chest Supported DB Row if missing
        const hasCSDBRow = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("chest supported db row")
        );
        if (!hasCSDBRow) {
          const barRowIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("barbell row")
          );
          if (barRowIdx !== -1) {
            // Update Barbell Row to have superset label
            exercises[barRowIdx] = {
              ...exercises[barRowIdx],
              group: `B${weekLabel}`,
              superset_label: "Superset",
            };
            exercises.splice(barRowIdx + 1, 0, {
              name: "B2. Chest Supported DB Row",
              detail: "Tempo 2-0-1-1. Squeeze at top.",
              sets: deload ? 2 : 3,
              reps: "10",
              rest: 60,
              rir: rir,
              type: "exercise",
              group: `B${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number}: ADDED B2. Chest Supported DB Row (${deload ? 2 : 3} sets)`);
          }
        }

        // Add D2. Hammer Curl if missing (pair with Pushdown)
        const hasHammerCurl = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("hammer curl")
        );
        if (!hasHammerCurl) {
          const pushdownIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("pushdown")
          );
          if (pushdownIdx !== -1) {
            // Fix pushdown grouping
            exercises[pushdownIdx] = {
              ...exercises[pushdownIdx],
              name: "D1. Cable Pushdown",
              group: `D${weekLabel}`,
              superset_label: "Superset",
              rest: null,
            };
            exercises.splice(pushdownIdx + 1, 0, {
              name: "D2. Hammer Curl",
              detail: "Tempo 2-0-1-1. Controlled eccentric.",
              sets: deload ? 2 : 3,
              reps: "12",
              rest: 60,
              rir: rir,
              type: "exercise",
              group: `D${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number}: ADDED D2. Hammer Curl, paired with D1. Pushdown`);
          }
        }

        // Add E3. Prone Y Raise if missing
        const hasYRaise = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
        );
        if (!hasYRaise) {
          const reverseFlyIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("reverse fly")
          );
          const insertIdx = reverseFlyIdx !== -1 ? reverseFlyIdx + 1 : exercises.length;
          exercises.splice(insertIdx, 0, {
            name: "E3. Prone Y Raise",
            detail: "Tempo 2-1-2-0. Thumbs up, squeeze scapulae.",
            sets: deload ? 2 : 3,
            reps: "12",
            rest: 45,
            rir: rir,
            type: "exercise",
            group: `E${weekLabel}`,
            superset_label: "Superset",
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED E3. Prone Y Raise`);
        }

        // Fix DB Lateral Raise grouping
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise") && name.includes("db") && !ex.group?.startsWith("F")) {
            modified = true;
            return {
              ...ex,
              name: "F1. DB Lateral Raise",
              group: `F${weekLabel}`,
              superset_label: null,
            };
          }
          // Also catch ungrouped DB Lateral Raise
          if (name === "db lateral raise" || (name.includes("db lateral raise") && !name.startsWith("f"))) {
            modified = true;
            return {
              ...ex,
              name: "F1. DB Lateral Raise",
              group: `F${weekLabel}`,
              superset_label: null,
            };
          }
          return ex;
        });

        // Fix existing exercise groups and labels
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("external rotation")) {
            return { ...ex, name: "E1. Cable External Rotation", group: `E${weekLabel}`, superset_label: "Superset" };
          }
          if (name.includes("reverse fly")) {
            return { ...ex, name: "E2. Reverse Fly", group: `E${weekLabel}`, superset_label: "Superset" };
          }
          if (name.includes("seated cable row")) {
            return { ...ex, name: "C2. Seated Cable Row", group: `C${weekLabel}`, superset_label: "Superset" };
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════════
      // D5 FIXES: Add Prone Ham Curl if missing
      // ═══════════════════════════════════════════════════
      if (dow === 5) {
        const hasProneCurl = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("prone") &&
          (e.name || "").toLowerCase().includes("curl")
        );
        if (!hasProneCurl) {
          // Insert before mindset/mission
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (["mindset", "mission", "conditioning"].includes(exercises[i].type)) {
              insertIdx = i;
            }
          }
          exercises.splice(insertIdx, 0, {
            name: "F1. Prone Hamstring Curl",
            detail: "Tempo 2-0-1-2. Squeeze at top, slow negative.",
            sets: deload ? 1 : 2,
            reps: "12",
            rest: 60,
            rir: rir,
            type: "exercise",
            group: `F${weekLabel}`,
            superset_label: null,
          });
          modified = true;
          fixes.push(`Day ${day.day_number}: ADDED F1. Prone Ham Curl (${deload ? 1 : 2} sets)`);
        }
      }

      // ═══════════════════════════════════════════════════
      // ALL DAYS: Update RIR on all exercises for consistency
      // ═══════════════════════════════════════════════════
      if (week > 1) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          // Don't touch RIR on explosive/carry movements
          if (name.includes("scoop toss") || name.includes("slam") ||
              name.includes("box jump") || name.includes("kb swing") ||
              name.includes("kettlebell") || name.includes("carry") ||
              name.includes("med ball")) {
            return ex;
          }
          // Update RIR if it exists and differs
          if (ex.rir !== null && ex.rir !== undefined && ex.rir !== rir) {
            // Lat raise gets rir-1
            if (name.includes("lateral raise")) {
              const latRir = Math.max(rir - 1, 1);
              if (ex.rir !== latRir) {
                return { ...ex, rir: latRir };
              }
            } else if (ex.rir !== rir) {
              return { ...ex, rir: rir };
            }
          }
          return ex;
        });
      }

      if (modified) {
        updates.push({ id: day.id, exercises });
      }
    }

    // Apply updates
    if (!dryRun) {
      for (const upd of updates) {
        const { error: updErr } = await supabase
          .from("program_days")
          .update({ exercises: upd.exercises })
          .eq("id", upd.id);
        if (updErr) throw new Error(`Update day ${upd.id} failed: ${updErr.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        days_modified: updates.length,
        total_fixes: fixes.length,
        details: fixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PATCH-PHASE1-PROPAGATE] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
