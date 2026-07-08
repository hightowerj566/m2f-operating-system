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

    // RIR per week within each meso (4-week cycle)
    function getRIR(weekInMeso: number): number {
      if (weekInMeso === 1) return 3;
      if (weekInMeso === 2) return 2;
      if (weekInMeso === 3) return 1;
      return 4;
    }

    for (const day of allDays!) {
      const dow = ((day.day_number - 1) % 7) + 1;
      if (dow > 5) continue; // skip D6/D7

      const week = Math.ceil(day.day_number / 7);
      const weekInMeso = ((week - 1) % 4) + 1;
      const meso = Math.ceil(week / 4); // 2 or 3
      const rir = getRIR(weekInMeso);
      const deload = weekInMeso === 4;
      const weekLabel = `W${week}D${dow}`;

      let exercises = [...(day.exercises as any[])];
      let modified = false;

      // ═══════════════════════════════════════════════════
      // D1 FIXES (Upper Strength)
      // ═══════════════════════════════════════════════════
      if (dow === 1) {
        // Add A0. Rotational Med Ball Scoop Toss before existing primer
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
          fixes.push(`Day ${day.day_number} (M${meso} D1): ADDED A0. Rotational Scoop Toss`);
        }

        // Meso 3: Fix Landmine Press → Landmine Rotation on D-block
        if (meso === 3) {
          exercises = exercises.map((ex: any) => {
            if (ex.type !== "exercise") return ex;
            const name = (ex.name || "").toLowerCase();
            if (name.includes("landmine press")) {
              modified = true;
              fixes.push(`Day ${day.day_number} (M3 D1): REPLACED Landmine Press → Landmine Rotation`);
              return {
                ...ex,
                name: "D1. Half-Kneeling Landmine Rotation",
                detail: "Controlled rotation through thoracic spine. Anti-rotation on decel.",
              };
            }
            return ex;
          });

          // Add F1. Band Pull-Apart if missing (to pair with F2. Prone Y Raise)
          const hasBandPullApart = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("pull-apart")
          );
          if (!hasBandPullApart) {
            // Find Prone Y Raise
            const yRaiseIdx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
            );
            if (yRaiseIdx !== -1) {
              // Update Y Raise to F2 with superset
              exercises[yRaiseIdx] = {
                ...exercises[yRaiseIdx],
                name: "F2. Prone Y Raise",
                group: `F${weekLabel}`,
                superset_label: "Superset",
              };
              exercises.splice(yRaiseIdx, 0, {
                name: "F1. Band Pull-Apart",
                detail: "Tempo 2-1-2-0. Squeeze shoulder blades.",
                sets: deload ? 2 : 3,
                reps: "15",
                rest: null,
                rir: rir,
                type: "exercise",
                group: `F${weekLabel}`,
                superset_label: "Superset",
              });
              modified = true;
              fixes.push(`Day ${day.day_number} (M3 D1): ADDED F1. Band Pull-Apart (paired w/ F2. Prone Y Raise)`);
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // D2 FIXES (Lower Strength)
      // ═══════════════════════════════════════════════════
      if (dow === 2) {
        // Add Suitcase Carry if missing
        const hasCarry = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("suitcase carry")
        );
        if (!hasCarry) {
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
          fixes.push(`Day ${day.day_number} (M${meso} D2): ADDED F1. Suitcase Carry`);
        }

        // Reduce Reverse Lunge / Walking Lunge if over-volume (cap at 3 sets non-deload)
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if ((name.includes("reverse lunge") || name.includes("walking lunge")) && !deload) {
            const targetSets = Math.min(ex.sets || 3, 3);
            if ((ex.sets || 0) > targetSets) {
              modified = true;
              fixes.push(`Day ${day.day_number} (M${meso} D2): ${ex.name} ${ex.sets}→${targetSets} sets`);
              return { ...ex, sets: targetSets };
            }
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════════
      // D3 FIXES (Conditioning + Core + Arms)
      // ═══════════════════════════════════════════════════
      if (dow === 3) {
        // Add A0. Rotational Med Ball Slam at start if missing
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
          fixes.push(`Day ${day.day_number} (M${meso} D3): ADDED A0. Rotational Slam`);
        }

        // Fix Cable Lateral Raise labeling
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("lateral raise") && name.includes("cable") && !ex.name.startsWith("A1.")) {
            modified = true;
            const targetSets = deload ? 2 : 4;
            if ((ex.sets || 0) !== targetSets) {
              fixes.push(`Day ${day.day_number} (M${meso} D3): Cable Lat Raise ${ex.sets}→${targetSets} sets`);
            }
            return {
              ...ex,
              name: "A1. Cable Lateral Raise",
              sets: targetSets,
              group: `A${weekLabel}`,
              superset_label: null,
            };
          }
          return ex;
        });

        // Meso 2 D3: Add D1. Incline DB Curl if missing (before D2. Dip)
        if (meso === 2) {
          const hasCurl = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("curl") &&
            !(e.name || "").toLowerCase().includes("woodchop") &&
            !(e.name || "").toLowerCase().includes("leg curl") &&
            !(e.name || "").toLowerCase().includes("nordic")
          );
          if (!hasCurl) {
            const dipIdx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("dip")
            );
            if (dipIdx !== -1) {
              exercises[dipIdx] = {
                ...exercises[dipIdx],
                name: "D2. Dip",
                group: `D${weekLabel}`,
                superset_label: "Superset",
                rest: 60,
              };
              exercises.splice(dipIdx, 0, {
                name: "D1. Incline DB Curl",
                detail: "Tempo 2-0-1-1. Full stretch at bottom.",
                sets: deload ? 2 : 3,
                reps: "12",
                rest: null,
                rir: rir,
                type: "exercise",
                group: `D${weekLabel}`,
                superset_label: "Superset",
              });
              modified = true;
              fixes.push(`Day ${day.day_number} (M2 D3): ADDED D1. Incline DB Curl (paired w/ D2. Dip)`);
            }
          }
        }

        // Meso 3 D3: Add D1. Concentration Curl if missing (before D2. Skull Crusher)
        if (meso === 3) {
          const hasCurl = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("curl") &&
            !(e.name || "").toLowerCase().includes("leg curl")
          );
          if (!hasCurl) {
            const skullIdx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("skull crusher")
            );
            if (skullIdx !== -1) {
              exercises[skullIdx] = {
                ...exercises[skullIdx],
                name: "D2. Skull Crusher",
                group: `D${weekLabel}`,
                superset_label: "Superset",
                rest: 60,
              };
              exercises.splice(skullIdx, 0, {
                name: "D1. Concentration Curl",
                detail: "Tempo 2-0-1-1. Full contraction at top.",
                sets: deload ? 2 : 3,
                reps: "12",
                rest: null,
                rir: rir,
                type: "exercise",
                group: `D${weekLabel}`,
                superset_label: "Superset",
              });
              modified = true;
              fixes.push(`Day ${day.day_number} (M3 D3): ADDED D1. Concentration Curl (paired w/ D2. Skull Crusher)`);
            }
          }
        }

        // Ensure Woodchop has proper sets (2 non-deload, 1 deload)
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("woodchop")) {
            const targetSets = deload ? 1 : 2;
            if ((ex.sets || 0) > targetSets + 1) {
              modified = true;
              fixes.push(`Day ${day.day_number} (M${meso} D3): Woodchop ${ex.sets}→${targetSets} sets`);
              return { ...ex, sets: targetSets };
            }
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════════
      // D4 FIXES (Upper Hypertrophy)
      // ═══════════════════════════════════════════════════
      if (dow === 4) {
        // Fix DB Lateral Raise grouping (ungrouped on many days)
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if ((name === "db lateral raise" || (name.includes("db lateral raise") && !name.startsWith("f"))) && (!ex.group || !ex.group.startsWith("F"))) {
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

        // Meso 2: Fix Face Pull numbering (D1 not D2), add D2. Reverse Fly if standalone
        if (meso === 2) {
          // Face Pull should be paired. Check if D1 is missing
          const facePullIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("face pull")
          );
          if (facePullIdx !== -1) {
            const fp = exercises[facePullIdx];
            // If labeled D1 or D2 but no superset partner, fix labeling
            if (fp.name && fp.name.startsWith("D1.")) {
              // Already D1, ensure superset
              exercises[facePullIdx] = {
                ...fp,
                group: `D${weekLabel}`,
                superset_label: "Superset",
              };
            } else if (fp.name && fp.name.startsWith("D2.")) {
              // Fix to D1
              exercises[facePullIdx] = {
                ...fp,
                name: "D1. Cable Face Pull",
                group: `D${weekLabel}`,
                superset_label: "Superset",
              };
              modified = true;
            }
          }

          // Add Prone Y Raise if missing
          const hasYRaise = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
          );
          if (!hasYRaise) {
            // Find Trap 3 or last scap exercise to place before
            const trap3Idx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("trap 3")
            );
            if (trap3Idx !== -1) {
              // Replace Trap 3 with Prone Y Raise (similar scap function, reduces redundancy with Reverse Fly)
              exercises[trap3Idx] = {
                ...exercises[trap3Idx],
                name: "G1. Prone Y Raise",
                detail: "Tempo 2-1-2-0. Thumbs up, squeeze scapulae.",
                group: `G${weekLabel}`,
                superset_label: null,
              };
              modified = true;
              fixes.push(`Day ${day.day_number} (M2 D4): REPLACED Trap 3 Raise → G1. Prone Y Raise (scap variety)`);
            }
          }
        }

        // Meso 3: Add scap work if missing
        if (meso === 3) {
          const hasYRaise = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("y raise")
          );
          const hasWallSlide = exercises.some((e: any) =>
            e.type === "exercise" && (e.name || "").toLowerCase().includes("wall slide")
          );

          // Add Prone Y Raise if no Y Raise exists (Wall Slides serve different function)
          if (!hasYRaise) {
            const wallSlideIdx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("wall slide")
            );
            if (wallSlideIdx !== -1) {
              // Add after Wall Slides as superset pair
              exercises[wallSlideIdx] = {
                ...exercises[wallSlideIdx],
                name: "F1. Wall Slides",
                group: `F${weekLabel}`,
                superset_label: "Superset",
              };
              exercises.splice(wallSlideIdx + 1, 0, {
                name: "F2. Prone Y Raise",
                detail: "Tempo 2-1-2-0. Thumbs up, squeeze scapulae.",
                sets: deload ? 2 : 3,
                reps: "12",
                rest: 45,
                rir: rir,
                type: "exercise",
                group: `F${weekLabel}`,
                superset_label: "Superset",
              });
              modified = true;
              fixes.push(`Day ${day.day_number} (M3 D4): ADDED F2. Prone Y Raise (paired w/ F1. Wall Slides)`);
            }
          }

          // Fix Rear Delt Fly numbering if it's D2 without a D1
          exercises = exercises.map((ex: any) => {
            if (ex.type !== "exercise") return ex;
            const name = (ex.name || "").toLowerCase();
            if (name.includes("rear delt fly") && ex.name && ex.name.startsWith("D2.")) {
              modified = true;
              return {
                ...ex,
                name: "D1. Rear Delt Fly",
                group: `D${weekLabel}`,
                superset_label: null,
              };
            }
            return ex;
          });
        }

        // Meso 2 D4: Add Landmine Rotation if missing rotation work
        if (meso === 2) {
          const hasRotation = exercises.some((e: any) =>
            e.type === "exercise" && (
              (e.name || "").toLowerCase().includes("rotation") ||
              (e.name || "").toLowerCase().includes("woodchop")
            )
          );
          if (!hasRotation) {
            // Insert after the primary row, before pressing accessories
            const csrIdx = exercises.findIndex((e: any) =>
              e.type === "exercise" && (e.name || "").toLowerCase().includes("chest supported row")
            );
            if (csrIdx !== -1) {
              // CSR stays as C2, add C0. Landmine Rotation before C1
              const floorPressIdx = exercises.findIndex((e: any) =>
                e.type === "exercise" && (e.name || "").toLowerCase().includes("floor press")
              );
              if (floorPressIdx !== -1) {
                exercises.splice(floorPressIdx, 0, {
                  name: "C0. Half-Kneeling Landmine Rotation",
                  detail: "Controlled rotation through thoracic spine.",
                  sets: deload ? 2 : 3,
                  reps: "8 each",
                  rest: 45,
                  rir: rir,
                  type: "exercise",
                  group: `C0${weekLabel}`,
                  superset_label: null,
                });
                modified = true;
                fixes.push(`Day ${day.day_number} (M2 D4): ADDED C0. Landmine Rotation`);
              }
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // D5 FIXES (Lower Hypertrophy)
      // ═══════════════════════════════════════════════════
      if (dow === 5) {
        // Add Prone Ham Curl if missing
        const hasProneCurl = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("prone") &&
          (e.name || "").toLowerCase().includes("curl")
        );
        if (!hasProneCurl) {
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
          fixes.push(`Day ${day.day_number} (M${meso} D5): ADDED F1. Prone Ham Curl`);
        }

        // Meso 3 D5: Reduce Walking Lunge if over-volume
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name = (ex.name || "").toLowerCase();
          if (name.includes("walking lunge") && !deload) {
            const targetSets = Math.min(ex.sets || 3, 3);
            if ((ex.sets || 0) > targetSets) {
              modified = true;
              fixes.push(`Day ${day.day_number} (M${meso} D5): Walking Lunge ${ex.sets}→${targetSets} sets`);
              return { ...ex, sets: targetSets };
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
    console.error("[PATCH-MESO2-3] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
