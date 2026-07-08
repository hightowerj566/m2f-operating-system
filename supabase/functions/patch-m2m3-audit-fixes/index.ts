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

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    // Fetch Meso 2 (days 29-56) and Meso 3 (days 57-84)
    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .gte("day_number", 29)
      .lte("day_number", 84)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    function getRIR(weekInMeso: number): number {
      if (weekInMeso === 1) return 3;
      if (weekInMeso === 2) return 2;
      if (weekInMeso === 3) return 1;
      return 4;
    }

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1;
      if (dow > 5) continue;

      const week = Math.ceil(day.day_number / 7);
      const weekInMeso = ((week - 1) % 4) + 1;
      const meso = Math.ceil(week / 4);
      const rir = getRIR(weekInMeso);
      const deload = weekInMeso === 4;
      const weekLabel = `W${week}D${dow}`;

      let exercises = [...(day.exercises as any[])];
      let modified = false;

      // ═══════════════════════════════════════════════════
      // FIX 1: M2 D3 — Replace Suitcase Carry → Farmer Carry (dupe with D2)
      // ═══════════════════════════════════════════════════
      if (meso === 2 && dow === 3) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("suitcase carry")) {
            modified = true;
            fixes.push(`Day ${day.day_number} (M2 D3): REPLACED Suitcase Carry → Farmer Carry`);
            return {
              ...ex,
              name: ex.name.replace(/suitcase carry/i, "Farmer Carry"),
              detail: "Heavy bilateral carry. Brace core, walk tall. Grip hard.",
            };
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════════
      // FIX 2: M2 D1 (W7-W8) — Restore F1/F2 Band Pull-Apart + Face Pull
      // ═══════════════════════════════════════════════════
      if (meso === 2 && dow === 1 && (weekInMeso === 3 || weekInMeso === 4)) {
        const hasBandPullApart = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("pull-apart")
        );
        const hasFacePull = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
        );

        if (!hasBandPullApart || !hasFacePull) {
          // Find insert point — before mindset/mission/conditioning
          let insertIdx = exercises.length;
          for (let i = exercises.length - 1; i >= 0; i--) {
            if (["mindset", "mission", "conditioning"].includes(exercises[i].type)) {
              insertIdx = i;
            }
          }

          if (!hasBandPullApart) {
            exercises.splice(insertIdx, 0, {
              name: "F1. Band Pull-Apart",
              detail: "Tempo 2-1-2-0. Squeeze shoulder blades at end range.",
              sets: deload ? 2 : 3,
              reps: "15",
              rest: null,
              rir: rir,
              type: "exercise",
              group: `F${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (M2 D1 W${weekInMeso}): RESTORED F1. Band Pull-Apart`);
            insertIdx++;
          }

          if (!hasFacePull) {
            exercises.splice(insertIdx, 0, {
              name: "F2. Face Pull",
              detail: "External rotation at top. Tempo 2-1-2-0.",
              sets: deload ? 2 : 3,
              reps: "15",
              rest: 45,
              rir: rir,
              type: "exercise",
              group: `F${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (M2 D1 W${weekInMeso}): RESTORED F2. Face Pull`);
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // FIX 3: M2 D4 — Correct G1→F1 sequencing (Y Raise before Lat Raise)
      // FIX 7 (M3): Resolve F1 label conflict — shift Lat Raise to G1
      // ═══════════════════════════════════════════════════
      if (dow === 4) {
        const yRaiseIdx = exercises.findIndex((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
        );
        const latRaiseIdx = exercises.findIndex((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("lat") &&
          (e.name || "").toLowerCase().includes("raise") &&
          !(e.name || "").toLowerCase().includes("y raise")
        );

        if (yRaiseIdx !== -1 && latRaiseIdx !== -1) {
          // Y Raise should come before Lat Raise in the exercise list
          // Fix labels: Y Raise = F-block, Lat Raise = G-block
          const yRaise = exercises[yRaiseIdx];
          const latRaise = exercises[latRaiseIdx];

          // Fix Y Raise label to F-block
          if (yRaise.name && !yRaise.name.startsWith("F")) {
            exercises[yRaiseIdx] = {
              ...yRaise,
              name: yRaise.name.replace(/^[A-Z]\d\./, "F1."),
              group: `F${weekLabel}`,
            };
            modified = true;
            fixes.push(`Day ${day.day_number} (M${meso} D4): Fixed Y Raise → F1 label`);
          }

          // Fix Lat Raise label to G-block
          if (latRaise.name && !latRaise.name.startsWith("G")) {
            exercises[latRaiseIdx] = {
              ...latRaise,
              name: latRaise.name.replace(/^[A-Z]\d\./, "G1."),
              group: `G${weekLabel}`,
            };
            modified = true;
            fixes.push(`Day ${day.day_number} (M${meso} D4): Fixed Lat Raise → G1 label`);
          }

          // Ensure Y Raise appears before Lat Raise
          const updatedYIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
          );
          const updatedLatIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").startsWith("G1.")
          );
          if (updatedYIdx > updatedLatIdx && updatedLatIdx !== -1) {
            const [yEx] = exercises.splice(updatedYIdx, 1);
            exercises.splice(updatedLatIdx, 0, yEx);
            modified = true;
            fixes.push(`Day ${day.day_number} (M${meso} D4): REORDERED Y Raise before Lat Raise`);
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // FIX 4: M2 D4 (W7-W8) — Restore missing D2. Reverse Fly
      // ═══════════════════════════════════════════════════
      if (meso === 2 && dow === 4 && (weekInMeso === 3 || weekInMeso === 4)) {
        const hasReverseFly = exercises.some((e: any) =>
          e.type === "exercise" && (
            (e.name || "").toLowerCase().includes("reverse fly") ||
            (e.name || "").toLowerCase().includes("rear delt fly")
          )
        );

        if (!hasReverseFly) {
          // Find Face Pull to pair with
          const facePullIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
          );
          if (facePullIdx !== -1) {
            exercises[facePullIdx] = {
              ...exercises[facePullIdx],
              name: "D1. Cable Face Pull",
              group: `D${weekLabel}`,
              superset_label: "Superset",
            };
            exercises.splice(facePullIdx + 1, 0, {
              name: "D2. Reverse Fly",
              detail: "Tempo 2-1-2-0. Pinch shoulder blades, control descent.",
              sets: deload ? 2 : 3,
              reps: "15",
              rest: 45,
              rir: rir,
              type: "exercise",
              group: `D${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (M2 D4 W${weekInMeso}): RESTORED D2. Reverse Fly (paired w/ D1. Face Pull)`);
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // FIX 5: M3 D3 — Replace Landmine Rotation → Cable Woodchop (dupe with D1)
      // ═══════════════════════════════════════════════════
      if (meso === 3 && dow === 3) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("landmine rotation")) {
            modified = true;
            fixes.push(`Day ${day.day_number} (M3 D3): REPLACED Landmine Rotation → Cable Woodchop`);
            return {
              ...ex,
              name: ex.name.replace(/.*landmine rotation.*/i, "C1. Cable Woodchop"),
              detail: "High-to-low chop. Rotate through thoracic spine, brace core.",
              reps: "10 each",
            };
          }
          return ex;
        });

        // FIX 9: M3 D3 — Add Pallof Press to core block if missing
        const hasPallof = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("pallof")
        );
        if (!hasPallof) {
          // Find the core block (C-block or after woodchop)
          const woodchopIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("woodchop")
          );
          if (woodchopIdx !== -1) {
            // Make woodchop C1 and add Pallof as C2 superset
            exercises[woodchopIdx] = {
              ...exercises[woodchopIdx],
              group: `C${weekLabel}`,
              superset_label: "Superset",
              rest: null,
            };
            exercises.splice(woodchopIdx + 1, 0, {
              name: "C2. Pallof Press",
              detail: "Anti-rotation hold. Press out, hold 2s, return. Brace hard.",
              sets: deload ? 2 : 3,
              reps: "10 each",
              rest: 45,
              rir: rir,
              type: "exercise",
              group: `C${weekLabel}`,
              superset_label: "Superset",
            });
            modified = true;
            fixes.push(`Day ${day.day_number} (M3 D3): ADDED C2. Pallof Press (paired w/ C1. Woodchop)`);
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // FIX 6: M3 D4 — Replace F2. Prone Y Raise → Face Pull (dupe with D1)
      // ═══════════════════════════════════════════════════
      if (meso === 3 && dow === 4) {
        // Check if Prone Y Raise exists on D1 of same week
        // Since it does (per audit), replace F2 Y Raise with Face Pull on D4
        const yRaiseIdx = exercises.findIndex((e: any) => {
          if (e.type !== "exercise") return false;
          const name = (e.name || "").toLowerCase();
          return name.includes("y raise") && (e.name || "").includes("F2");
        });

        if (yRaiseIdx !== -1) {
          exercises[yRaiseIdx] = {
            ...exercises[yRaiseIdx],
            name: "F2. Face Pull",
            detail: "External rotation at top. Tempo 2-1-2-0. Squeeze scapulae.",
            reps: "15",
          };
          modified = true;
          fixes.push(`Day ${day.day_number} (M3 D4): REPLACED F2. Prone Y Raise → F2. Face Pull`);
        }

        // FIX 8: M3 D4 — Reduce Rear Delt Fly to 3 sets, pair with Face Pull
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("rear delt fly") && (ex.sets || 0) > 3 && !deload) {
            modified = true;
            fixes.push(`Day ${day.day_number} (M3 D4): Rear Delt Fly ${ex.sets}→3 sets`);
            return { ...ex, sets: 3 };
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
    console.error("[PATCH-M2M3-AUDIT] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
