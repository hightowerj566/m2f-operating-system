import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";

interface Ex {
  name: string; sets: number; reps: string; detail: string;
  rest: number | null; rir: number | null; type: string;
  group: string | null; superset_label: string | null;
}

function mkEx(name: string, sets: number, reps: string, detail: string, rest = 60, rir: number | null = 2, group: string | null = null, ss: string | null = null): Ex {
  return { name, sets, reps, detail, rest, rir, type: "exercise", group, superset_label: ss };
}

function hasExercise(exercises: Ex[], pattern: RegExp): boolean {
  return exercises.some(e => e.type === "exercise" && pattern.test(e.name || ""));
}

function findExIdx(exercises: Ex[], pattern: RegExp): number {
  return exercises.findIndex(e => e.type === "exercise" && pattern.test(e.name || ""));
}

function insertBefore(exercises: Ex[], beforeType: string, ...newExercises: Ex[]): Ex[] {
  const idx = exercises.findIndex(e => e.type === beforeType);
  const pos = idx >= 0 ? idx : exercises.length;
  exercises.splice(pos, 0, ...newExercises);
  return exercises;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Paginated fetch
  let allDays: any[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data, error } = await supabase
      .from("program_days").select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID).order("day_number")
      .range(from, from + PAGE - 1);
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
    allDays = allDays.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  const log: string[] = [];
  let updated = 0;

  for (const day of allDays) {
    const dn = day.day_number;
    const dow = ((dn - 1) % 7) + 1; // 1-7
    const meso = dn <= 28 ? 1 : dn <= 56 ? 2 : dn <= 84 ? 3 : 4;
    const weekInMeso = Math.ceil(((dn - 1) % 28 + 1) / 7);
    const isDeload = weekInMeso === 4;
    let exercises = [...(day.exercises as Ex[])];
    let changed = false;

    // ═══════════════════════════════════════════════════════
    // DAY 1 (DOW 1): Lower Squat days — Fix quad concentration
    // ═══════════════════════════════════════════════════════
    if (dow === 1 && (day.label || "").toLowerCase().includes("lower")) {
      // FIX 1: Reduce Leg Press from 3 to 2 sets (M1 has 80% quads on D1)
      const lpIdx = findExIdx(exercises, /leg press/i);
      if (lpIdx >= 0 && exercises[lpIdx].sets > 2 && !isDeload) {
        exercises[lpIdx] = { ...exercises[lpIdx], sets: 2 };
        changed = true;
        log.push(`D${dn}: Leg Press 3→2 sets (quad redistribution)`);
      }

      // FIX 2: Add Tibialis Raise on lower squat days
      if (!hasExercise(exercises, /tibialis/i)) {
        const calfIdx = findExIdx(exercises, /calf/i);
        const pos = calfIdx >= 0 ? calfIdx + 1 : exercises.length;
        exercises.splice(pos, 0, mkEx(
          "Tibialis Raise", isDeload ? 2 : 3, "15",
          "Toes on elevated surface. Control eccentric. Ankle durability.",
          45, null, null, null
        ));
        changed = true;
        log.push(`D${dn}: +Tibialis Raise ${isDeload ? 2 : 3}×15`);
      }
    }

    // ═══════════════════════════════════════════════════════
    // DAY 2 (DOW 2): Upper Horizontal — Fix chest concentration + add back
    // ═══════════════════════════════════════════════════════
    if (dow === 2 && (day.label || "").toLowerCase().includes("upper")) {
      // FIX 3: Add DB Row if back volume < 2 exercises on this day
      const backCount = exercises.filter(e => e.type === "exercise" && /row|pull/i.test(e.name || "")).length;
      if (backCount < 2 && !hasExercise(exercises, /db row|dumbbell row/i)) {
        const rowIdx = findExIdx(exercises, /row/i);
        const pos = rowIdx >= 0 ? rowIdx + 1 : 3;
        exercises.splice(pos, 0, mkEx(
          "Single Arm DB Row", isDeload ? 2 : 3, "10/side",
          "Full stretch at bottom. Control scap retraction.",
          60, isDeload ? 4 : 2, null, null
        ));
        changed = true;
        log.push(`D${dn}: +Single Arm DB Row ${isDeload ? 2 : 3}×10/side (back boost)`);
      }

      // FIX 4: Add Seated Leg Curl for hamstring redistribution (moves some ham volume off D4/D5)
      // Only in M1 where hams are concentrated
      if (meso === 1 && !hasExercise(exercises, /leg curl|ham/i)) {
        // Actually DOW 2 is upper day in M1 — skip this, do it on lower days
      }
    }

    // ═══════════════════════════════════════════════════════
    // DAY 3 (DOW 3): Zone 2 + Core + Arms — Boost arms
    // ═══════════════════════════════════════════════════════
    if (dow === 3) {
      // FIX 5: Ensure bicep work exists (M1 only has 4 bi sets/wk)
      if (!hasExercise(exercises, /curl/i) && meso === 1) {
        exercises = insertBefore(exercises, "mindset",
          mkEx("Incline DB Curl", isDeload ? 2 : 3, "12",
            "Full stretch at bottom. Control the negative.", 45, isDeload ? 4 : 2,
            `A${weekInMeso}D3`, "Superset"),
          mkEx("Overhead Cable Extension", isDeload ? 2 : 3, "12",
            "Full stretch overhead. Squeeze at lockout.", 45, isDeload ? 4 : 2,
            `A${weekInMeso}D3`, "Superset")
        );
        changed = true;
        log.push(`D${dn}: +Incline DB Curl + Overhead Cable Extension (M1 arm boost)`);
      }

      // FIX 6: Add Scap Push-Ups for shoulder health on core day
      if (!hasExercise(exercises, /scap push|serratus/i) && !isDeload) {
        exercises = insertBefore(exercises, "mindset",
          mkEx("Scap Push-Up", 2, "12",
            "Lock arms straight. Only move scapulae — protract and retract.",
            30, null, null, null)
        );
        changed = true;
        log.push(`D${dn}: +Scap Push-Up 2×12 (shoulder health)`);
      }
    }

    // ═══════════════════════════════════════════════════════
    // DAY 4 (DOW 4): Upper Vertical / Hinge — Boost back volume
    // ═══════════════════════════════════════════════════════
    if (dow === 4) {
      // In M1 this is "Lower Hinge", in M2-4 it's "Upper Vertical"
      const isUpperDay = (day.label || "").toLowerCase().includes("upper");
      const isHingeDay = (day.label || "").toLowerCase().includes("hinge");

      if (isUpperDay) {
        // FIX 7: Ensure Chest Supported Row exists for back volume on upper vert day
        if (!hasExercise(exercises, /chest supported|cable row|seated row/i)) {
          const pulldownIdx = findExIdx(exercises, /pulldown|pull-up|chin/i);
          const pos = pulldownIdx >= 0 ? pulldownIdx + 1 : 2;
          exercises.splice(pos, 0, mkEx(
            "Chest Supported Row", isDeload ? 2 : 3, "10",
            "Squeeze scaps together. No momentum. Upper back focus.",
            60, isDeload ? 4 : 2, null, null
          ));
          changed = true;
          log.push(`D${dn}: +Chest Supported Row ${isDeload ? 2 : 3}×10 (back boost)`);
        }

        // FIX 8: Ensure lateral delt work is at target (4+ sets)
        const latDelts = exercises.filter(e => e.type === "exercise" && /lateral raise|lat raise/i.test(e.name || ""));
        const totalLatSets = latDelts.reduce((s, e) => s + (e.sets || 3), 0);
        if (totalLatSets < 4 && latDelts.length > 0) {
          const idx = findExIdx(exercises, /lateral raise|lat raise/i);
          if (idx >= 0 && !isDeload) {
            exercises[idx] = { ...exercises[idx], sets: 4 };
            changed = true;
            log.push(`D${dn}: Lateral Raise bumped to 4 sets`);
          }
        }
      }

      if (isHingeDay) {
        // FIX 9: Add Tibialis Raise on hinge days too
        if (!hasExercise(exercises, /tibialis/i)) {
          const calfIdx = findExIdx(exercises, /calf/i);
          const pos = calfIdx >= 0 ? calfIdx + 1 : exercises.length;
          exercises.splice(pos, 0, mkEx(
            "Tibialis Raise", isDeload ? 1 : 2, "15",
            "Control through full range. Ankle durability work.",
            45, null, null, null
          ));
          changed = true;
          log.push(`D${dn}: +Tibialis Raise ${isDeload ? 1 : 2}×15 (hinge day)`);
        }

        // FIX 10: Reduce ham volume if > 8 sets on this single day
        const hamExs = exercises.filter(e => e.type === "exercise" && /rdl|romanian|deadlift|leg curl|ham|nordic/i.test(e.name || ""));
        const hamSets = hamExs.reduce((s, e) => s + (e.sets || 3), 0);
        if (hamSets > 8 && !isDeload) {
          // Reduce the accessory ham exercise by 1 set
          const curlIdx = findExIdx(exercises, /leg curl|seated.*curl/i);
          if (curlIdx >= 0 && exercises[curlIdx].sets > 2) {
            exercises[curlIdx] = { ...exercises[curlIdx], sets: exercises[curlIdx].sets - 1 };
            changed = true;
            log.push(`D${dn}: Leg Curl ${exercises[curlIdx].sets + 1}→${exercises[curlIdx].sets} sets (ham fatigue mgmt)`);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // DAY 5 (DOW 5): Upper Vertical (M1) / Lower Hinge (M2-4)
    // ═══════════════════════════════════════════════════════
    if (dow === 5) {
      const isLowerDay = (day.label || "").toLowerCase().includes("lower");
      const isUpperDay = (day.label || "").toLowerCase().includes("upper");

      if (isLowerDay) {
        // FIX 11: Add DB Row on lower hinge day for back volume distribution
        if (!hasExercise(exercises, /row|pull/i) && meso >= 2) {
          const hingeIdx = findExIdx(exercises, /deadlift|rdl|romanian/i);
          const pos = hingeIdx >= 0 ? hingeIdx + 1 : 2;
          exercises.splice(pos, 0, mkEx(
            "Meadows Row", isDeload ? 2 : 3, "10/side",
            "Elbow tight. Pull to hip. Full lat stretch at bottom.",
            60, isDeload ? 4 : 2, null, null
          ));
          changed = true;
          log.push(`D${dn}: +Meadows Row ${isDeload ? 2 : 3}×10/side (back distribution to hinge day)`);
        }

        // FIX 12: Add Tibialis on hinge days
        if (!hasExercise(exercises, /tibialis/i)) {
          const calfIdx = findExIdx(exercises, /calf/i);
          const pos = calfIdx >= 0 ? calfIdx + 1 : exercises.length;
          exercises.splice(pos, 0, mkEx(
            "Tibialis Raise", isDeload ? 1 : 2, "15",
            "Control through full range. Ankle durability.",
            45, null, null, null
          ));
          changed = true;
          log.push(`D${dn}: +Tibialis Raise (hinge day)`);
        }

        // FIX 13: Add Leg Extension for quad redistribution (move some quad volume off D2)
        if (!hasExercise(exercises, /leg ext/i) && meso >= 2) {
          exercises = insertBefore(exercises, "mindset",
            mkEx("Leg Extension", isDeload ? 2 : 3, "12",
              "Controlled tempo. Squeeze at top. Quad balance on hinge day.",
              45, isDeload ? 4 : 1, null, null)
          );
          changed = true;
          log.push(`D${dn}: +Leg Extension ${isDeload ? 2 : 3}×12 (quad redistribution)`);
        }

        // FIX 14: M4 ham overload — replace RDL with Seated Leg Curl if both heavy DL + RDL exist
        if (meso === 4 && !isDeload) {
          const dlIdx = findExIdx(exercises, /conventional|sumo.*deadlift|deadlift/i);
          const rdlIdx = findExIdx(exercises, /romanian|rdl/i);
          if (dlIdx >= 0 && rdlIdx >= 0 && rdlIdx !== dlIdx) {
            exercises[rdlIdx] = mkEx(
              "Seated Leg Curl", 3, "12",
              "Control eccentric. Reduces axial fatigue while maintaining ham volume.",
              60, 2, null, null
            );
            changed = true;
            log.push(`D${dn}: RDL → Seated Leg Curl (M4 ham overload fix)`);
          }
        }
      }

      if (isUpperDay) {
        // FIX 15: Ensure Face Pull exists on upper vert day
        if (!hasExercise(exercises, /face pull/i)) {
          exercises = insertBefore(exercises, "mindset",
            mkEx("Face Pull", isDeload ? 2 : 3, "15",
              "External rotation at top. Scap squeeze.",
              45, null, null, null)
          );
          changed = true;
          log.push(`D${dn}: +Face Pull ${isDeload ? 2 : 3}×15`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // DAY 6 (DOW 6): Delts + Arms + Conditioning
    // ═══════════════════════════════════════════════════════
    if (dow === 6) {
      // FIX 16: Ensure lateral delt sets are at least 4 on this day
      const latIdx = findExIdx(exercises, /lateral raise|lat raise/i);
      if (latIdx >= 0 && exercises[latIdx].sets < 4 && !isDeload) {
        exercises[latIdx] = { ...exercises[latIdx], sets: 4 };
        changed = true;
        log.push(`D${dn}: Lateral Raise bumped to 4 sets on D6`);
      }

      // FIX 17: Add External Rotation if missing on D6
      if (!hasExercise(exercises, /external rot/i) && !hasExercise(exercises, /prone y/i)) {
        exercises = insertBefore(exercises, "mindset",
          mkEx("DB External Rotation", isDeload ? 1 : 2, "15/side",
            "Elbow at 90°. Slow and controlled. Shoulder health.",
            30, null, null, null)
        );
        changed = true;
        log.push(`D${dn}: +DB External Rotation (shoulder health)`);
      }

      // FIX 18: Ensure at least one back exercise on D6 for volume distribution
      if (!hasExercise(exercises, /row|pull|face pull/i) && meso >= 3) {
        const firstIdx = findExIdx(exercises, /lateral raise|lat raise/i);
        const pos = firstIdx >= 0 ? firstIdx + 1 : 1;
        exercises.splice(pos, 0, mkEx(
          "Face Pull", isDeload ? 2 : 3, "15",
          "Wide grip. External rotate at top. Rear delt + scap support.",
          45, null, null, null
        ));
        changed = true;
        log.push(`D${dn}: +Face Pull ${isDeload ? 2 : 3}×15 (back/rear delt distribution)`);
      }
    }

    // ═══════════════════════════════════════════════════════
    // CROSS-MESO: Ensure M2 D2 has quad redistribution
    // ═══════════════════════════════════════════════════════
    if (dow === 2 && (day.label || "").toLowerCase().includes("lower") && meso >= 2) {
      // FIX: Reduce quad overconcentration — cap Zercher/secondary squat at 2 sets
      const secondarySquatIdx = exercises.findIndex(e =>
        e.type === "exercise" && /zercher|anderson|hack/i.test(e.name || "") && (e.sets || 3) > 2
      );
      if (secondarySquatIdx >= 0 && !isDeload) {
        const old = exercises[secondarySquatIdx].sets;
        exercises[secondarySquatIdx] = { ...exercises[secondarySquatIdx], sets: 2 };
        changed = true;
        log.push(`D${dn}: ${exercises[secondarySquatIdx].name} ${old}→2 sets (quad cap)`);
      }

      // Add Seated Leg Curl for ham redistribution
      if (!hasExercise(exercises, /leg curl|ham curl/i)) {
        exercises = insertBefore(exercises, "mindset",
          mkEx("Seated Leg Curl", isDeload ? 2 : 3, "12",
            "Control eccentric. Redistributes hamstring volume off hinge day.",
            60, isDeload ? 4 : 2, null, null)
        );
        changed = true;
        log.push(`D${dn}: +Seated Leg Curl (ham redistribution to squat day)`);
      }

      // Add Tibialis
      if (!hasExercise(exercises, /tibialis/i)) {
        const calfIdx = findExIdx(exercises, /calf/i);
        const pos = calfIdx >= 0 ? calfIdx + 1 : exercises.length;
        exercises.splice(pos, 0, mkEx(
          "Tibialis Raise", isDeload ? 1 : 2, "15",
          "Toes elevated. Control full ROM.",
          45, null, null, null
        ));
        changed = true;
        log.push(`D${dn}: +Tibialis Raise (squat day ankle work)`);
      }
    }

    if (changed) {
      const { error: upErr } = await supabase.from("program_days").update({ exercises }).eq("id", day.id);
      if (upErr) log.push(`ERROR D${dn}: ${upErr.message}`);
      else updated++;
    }
  }

  return new Response(JSON.stringify({ 
    success: true, updated, total_days: allDays.length, changes: log 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
