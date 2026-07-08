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

    // Only Phase 1: days 1-42
    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .gte("day_number", 1)
      .lte("day_number", 42)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1; // 1-7
      const week = Math.ceil(day.day_number / 7);
      const weekInMeso = ((week - 1) % 4) + 1;
      const isDeload = weekInMeso === 4;
      const meso = week <= 4 ? 1 : 2;
      let exercises = [...(day.exercises as any[])];
      let modified = false;

      // ══════════════════════════════════════════════════════════
      // FIX 1: Meso 2 D1 (Days 29, 36) — Add Face Pull (missing)
      // Meso 1 D1 has F2. Face Pull 4×15. Meso 2 has nothing.
      // Add as F1. Band Pull-Apart superset with F2. Face Pull
      // to match the shoulder health slot.
      // ══════════════════════════════════════════════════════════
      if (meso === 2 && dow === 1) {
        const hasFacePull = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
        );
        const hasShouldHealth = exercises.some((e: any) =>
          e.type === "exercise" && (
            (e.name || "").toLowerCase().includes("face pull") ||
            (e.name || "").toLowerCase().includes("pull-apart") ||
            (e.name || "").toLowerCase().includes("external rotation") ||
            (e.name || "").toLowerCase().includes("prone")
          )
        );

        if (!hasShouldHealth) {
          // Find insertion point: before mindset/mission/conditioning
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (["mindset", "mission", "conditioning"].includes(exercises[i].type)) {
              insertIdx = i;
            }
          }

          const weekLabel = `W${week}D1`;
          const rir = isDeload ? 4 : (weekInMeso === 1 ? 3 : weekInMeso === 2 ? 2 : 1);
          const sets = isDeload ? 2 : 4;

          exercises.splice(insertIdx, 0, {
            name: "F1. Band Pull-Apart",
            detail: "Tempo 2-1-2-0. Squeeze shoulder blades",
            sets: isDeload ? 2 : 3,
            reps: "15",
            rest: null,
            rir: rir,
            type: "exercise",
            group: `F${weekLabel}`,
            superset_label: "Superset",
          });
          exercises.splice(insertIdx + 1, 0, {
            name: "F2. Face Pull",
            detail: "Tempo 2-1-2-0",
            sets: sets,
            reps: "15",
            rest: 45,
            rir: rir,
            type: "exercise",
            group: `F${weekLabel}`,
            superset_label: "Superset",
          });

          modified = true;
          fixes.push(`Day ${day.day_number} (Meso 2 D1): ADDED F1. Band Pull-Apart ${isDeload ? 2 : 3}×15 + F2. Face Pull ${sets}×15`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // FIX 2: Meso 1 D1 — Fix F2 Face Pull (solo, no F1 partner)
      // Add F1. Band Pull-Apart to create proper superset
      // ══════════════════════════════════════════════════════════
      if (meso === 1 && dow === 1) {
        const facePullIdx = exercises.findIndex((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
        );
        const hasBandPullApart = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("pull-apart")
        );

        if (facePullIdx !== -1 && !hasBandPullApart) {
          const weekLabel = `W${week}D1`;
          const rir = isDeload ? 4 : (weekInMeso === 1 ? 3 : weekInMeso === 2 ? 2 : 1);

          // Update face pull to have superset label if missing
          exercises[facePullIdx] = {
            ...exercises[facePullIdx],
            group: `F${weekLabel}`,
            superset_label: "Superset",
          };

          // Insert F1 before F2
          exercises.splice(facePullIdx, 0, {
            name: "F1. Band Pull-Apart",
            detail: "Tempo 2-1-2-0. Squeeze shoulder blades",
            sets: isDeload ? 2 : 3,
            reps: "15",
            rest: null,
            rir: rir,
            type: "exercise",
            group: `F${weekLabel}`,
            superset_label: "Superset",
          });

          modified = true;
          fixes.push(`Day ${day.day_number} (Meso 1 D1): ADDED F1. Band Pull-Apart ${isDeload ? 2 : 3}×15 (paired with F2. Face Pull)`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // FIX 3: Meso 2 D3 (Days 31, 38) — Add Bicep Curl (missing)
      // Meso 1 has D1. EZ Bar Curl + D2. OH Tricep Extension
      // Meso 2 only has D2. Dip — need to add D1. Incline DB Curl
      // ══════════════════════════════════════════════════════════
      if (meso === 2 && dow === 3) {
        const hasCurl = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("curl") &&
          !(e.name || "").toLowerCase().includes("leg curl") &&
          !(e.name || "").toLowerCase().includes("nordic")
        );

        if (!hasCurl) {
          // Find the Dip exercise to insert curl before it as D1
          const dipIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("dip")
          );

          if (dipIdx !== -1) {
            const weekLabel = `W${week}D3`;
            const rir = isDeload ? 4 : (weekInMeso === 1 ? 3 : weekInMeso === 2 ? 2 : 1);
            const sets = isDeload ? 2 : (weekInMeso === 1 ? 3 : 4);

            // Fix the Dip to be D2 with proper superset grouping
            exercises[dipIdx] = {
              ...exercises[dipIdx],
              name: "D2. Dip",
              group: `D${weekLabel}`,
              superset_label: "Superset",
              rest: 60,
            };

            // Insert D1 Incline DB Curl before the Dip
            exercises.splice(dipIdx, 0, {
              name: "D1. Incline DB Curl",
              detail: "Tempo 2-0-1-1",
              sets: sets,
              reps: "12",
              rest: null,
              rir: rir,
              type: "exercise",
              group: `D${weekLabel}`,
              superset_label: "Superset",
            });

            modified = true;
            fixes.push(`Day ${day.day_number} (Meso 2 D3): ADDED D1. Incline DB Curl ${sets}×12, paired with D2. Dip as superset`);
          }
        }
      }

      // ══════════════════════════════════════════════════════════
      // FIX 4: D4 All weeks — Fix exercise numbering gaps
      // Currently: A→B→C→(skip D)→E→F
      // Should flow: A→B→C→D→E→F
      // The Cable Pushdown is labeled E2 but should be D1/D2
      // ══════════════════════════════════════════════════════════
      if (dow === 4) {
        const weekLabel = `W${week}D4`;

        // In Meso 1: A1.OHP, B1.Row, C1.Landmine+C2.Cable Row, [gap], E2.Pushdown, F1.ExtRot
        // In Meso 2: A1.Push Press, B1.Row, C1.Machine Press+C2.Row, [gap], D2.Face Pull, E1.Curl+E2.OH Ext, F1.Trap3

        // Fix Meso 1 D4: Pushdown should be D1, ExtRot+something should be E
        if (meso === 1) {
          exercises = exercises.map((ex: any) => {
            if (ex.type !== "exercise") return ex;
            const name = (ex.name || "").toLowerCase();

            // Cable Pushdown: relabel from E2 to D1
            if (name.includes("pushdown") || name.includes("push down")) {
              modified = true;
              return {
                ...ex,
                name: "D1. Cable Pushdown",
                group: `D${weekLabel}`,
                superset_label: null,
                rest: 60,
              };
            }

            // Cable External Rotation: relabel from F1 to E1
            if (name.includes("external rotation")) {
              modified = true;
              return {
                ...ex,
                name: "E1. Cable External Rotation",
                group: `E${weekLabel}`,
                superset_label: "Superset",
              };
            }

            return ex;
          });

          // Add Reverse Fly as E2 partner for External Rotation if missing
          const hasReverseFly = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("reverse fly")
          );
          const extRotIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("external rotation")
          );

          if (!hasReverseFly && extRotIdx !== -1) {
            const rir = isDeload ? 4 : (weekInMeso === 1 ? 3 : weekInMeso === 2 ? 2 : 1);
            exercises.splice(extRotIdx + 1, 0, {
              name: "E2. Reverse Fly",
              detail: "Tempo 2-1-2-0. Squeeze at top",
              sets: isDeload ? 2 : 3,
              reps: "15",
              rest: 45,
              rir: rir,
              type: "exercise",
              group: `E${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (Meso 1 D4): ADDED E2. Reverse Fly ${isDeload ? 2 : 3}×15 (paired with E1. External Rotation)`);
          }

          if (modified) {
            fixes.push(`Day ${day.day_number} (Meso 1 D4): Renumbered Pushdown→D1, External Rotation→E1`);
          }
        }

        // Fix Meso 2 D4: D2.Face Pull should be D1, Curl+Ext should be E
        if (meso === 2) {
          exercises = exercises.map((ex: any) => {
            if (ex.type !== "exercise") return ex;
            const name = (ex.name || "").toLowerCase();

            // Face Pull: relabel from D2 to D1
            if (name.includes("face pull")) {
              modified = true;
              return {
                ...ex,
                name: "D1. Cable Face Pull",
                group: `D${weekLabel}`,
                superset_label: "Superset",
                rest: null,
              };
            }

            // Preacher Curl: keep as E1
            if (name.includes("preacher curl")) {
              return {
                ...ex,
                name: "E1. Preacher Curl",
                group: `E${weekLabel}`,
                superset_label: "Superset",
              };
            }

            // OH Tricep Extension: keep as E2
            if (name.includes("overhead tricep") || name.includes("oh tricep")) {
              return {
                ...ex,
                name: "E2. Overhead Tricep Extension",
                group: `E${weekLabel}`,
                superset_label: "Superset",
              };
            }

            // Trap 3 Raise: relabel from F1 to stays F1
            if (name.includes("trap 3")) {
              return {
                ...ex,
                name: "F1. Trap 3 Raise",
                group: `F${weekLabel}`,
                superset_label: null,
              };
            }

            return ex;
          });

          // Add D2. Reverse Fly as partner for D1. Face Pull
          const hasReverseFly = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("reverse fly")
          );
          const facePullIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
          );

          if (!hasReverseFly && facePullIdx !== -1) {
            const rir = isDeload ? 4 : (weekInMeso === 1 ? 3 : weekInMeso === 2 ? 2 : 1);
            exercises.splice(facePullIdx + 1, 0, {
              name: "D2. Reverse Fly",
              detail: "Tempo 2-1-2-0. Squeeze at top",
              sets: isDeload ? 2 : 3,
              reps: "15",
              rest: 45,
              rir: rir,
              type: "exercise",
              group: `D${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (Meso 2 D4): ADDED D2. Reverse Fly ${isDeload ? 2 : 3}×15 (paired with D1. Face Pull)`);
          }

          if (modified) {
            fixes.push(`Day ${day.day_number} (Meso 2 D4): Renumbered Face Pull→D1, Curl→E1, Ext→E2`);
          }
        }

        // ══════════════════════════════════════════════════════════
        // FIX 5: D4 — Add group to DB Lateral Raise (currently ungrouped)
        // Place it as G1 (solo) with proper group label
        // ══════════════════════════════════════════════════════════
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise") && name.includes("db") && !ex.group) {
            modified = true;
            return {
              ...ex,
              group: `G${weekLabel}`,
              superset_label: null,
            };
          }
          return ex;
        });
      }

      // ══════════════════════════════════════════════════════════
      // FIX 6: D3 — Add group to Cable Lateral Raise (currently ungrouped)
      // ══════════════════════════════════════════════════════════
      if (dow === 3) {
        const weekLabel = `W${week}D3`;
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise") && name.includes("cable") && !ex.group) {
            modified = true;
            return {
              ...ex,
              name: "A1. Cable Lateral Raise",
              group: `A${weekLabel}`,
              superset_label: null,
            };
          }
          return ex;
        });
      }

      if (modified) {
        updates.push({ id: day.id, exercises });
      }
    }

    // Apply all updates
    for (const upd of updates) {
      const { error: updErr } = await supabase
        .from("program_days")
        .update({ exercises: upd.exercises })
        .eq("id", upd.id);
      if (updErr) throw new Error(`Update day ${upd.id} failed: ${updErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        days_modified: updates.length,
        total_fixes: fixes.length,
        details: fixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PATCH-PHASE1-STRUCTURE] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
