import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

function getDow(dn: number): number { return ((dn - 1) % 7) + 1; }
function getMeso(dn: number): number {
  if (dn <= 28) return 1;
  if (dn <= 56) return 2;
  if (dn <= 84) return 3;
  return 4;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "true";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let allDays: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("program_days").select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID).order("day_number")
      .range(from, from + 499);
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
    allDays = allDays.concat(data || []);
    if (!data || data.length < 500) break;
    from += 500;
  }

  const log: string[] = [];
  let updated = 0;

  function removeAt(arr: any[], idx: number): any {
    return arr.splice(idx, 1)[0];
  }

  function findByPattern(arr: any[], pattern: RegExp, type = "exercise"): number {
    return arr.findIndex(e => e.type === type && pattern.test(e.name || ""));
  }

  function renumberBlock(arr: any[], letter: string): boolean {
    const indices: number[] = [];
    const re = new RegExp(`^${letter}\\d+\\.`);
    for (let i = 0; i < arr.length; i++) {
      if (re.test(arr[i].name || "")) indices.push(i);
    }
    let changed = false;
    for (let j = 0; j < indices.length; j++) {
      const newLabel = `${letter}${j + 1}`;
      const oldName = arr[indices[j]].name;
      const newName = oldName.replace(new RegExp(`^${letter}\\d+\\.`), `${newLabel}.`);
      if (oldName !== newName) {
        arr[indices[j]] = { ...arr[indices[j]], name: newName };
        changed = true;
      }
    }
    return changed;
  }

  for (const day of allDays) {
    const dn = day.day_number;
    const dow = getDow(dn);
    const meso = getMeso(dn);
    if (meso > 3) continue;

    let exercises = [...(day.exercises as any[])];
    let changed = false;
    const tag = `D${dn} (M${meso} Day${dow})`;

    if ((dow === 1 || dow === 3) && meso >= 2) {
      const a0Indices: number[] = [];
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && /^A0\./.test(exercises[i].name || "")) {
          a0Indices.push(i);
        }
      }
      if (a0Indices.length > 1) {
        for (let i = a0Indices.length - 1; i >= 1; i--) {
          const removed = removeAt(exercises, a0Indices[i]);
          log.push(`${tag}: Removed duplicate A0 primer: ${removed.name}`);
          changed = true;
        }
      }
    }

    if (dow === 1 && meso >= 2) {
      const slamIdx = findByPattern(exercises, /^A1\.\s*Med Ball Slam/i);
      if (slamIdx >= 0) {
        const removed = removeAt(exercises, slamIdx);
        log.push(`${tag}: Removed excess 3rd primer: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 3 && meso >= 2) {
      const throwIdx = findByPattern(exercises, /med ball rotational throw/i);
      if (throwIdx >= 0) {
        const removed = removeAt(exercises, throwIdx);
        log.push(`${tag}: Removed redundant med ball: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 6 && meso >= 2) {
      const throwIdx = findByPattern(exercises, /med ball rotational throw/i);
      if (throwIdx >= 0) {
        const removed = removeAt(exercises, throwIdx);
        log.push(`${tag}: Removed redundant med ball from conditioning day: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 3) {
      for (let i = 0; i < exercises.length; i++) {
        if (/^A1\.\s*Cable Lateral Raise/i.test(exercises[i].name || "")) {
          const oldName = exercises[i].name;
          exercises[i] = { ...exercises[i], name: "E0. Cable Lateral Raise" };
          log.push(`${tag}: Relabeled ${oldName} → E0. Cable Lateral Raise (not a primer)`);
          changed = true;
        }
      }
    }

    if (dow === 3) {
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && (exercises[i].name || "").trim() === "Scap Push-Up") {
          exercises[i] = { ...exercises[i], name: "C1b. Scap Push-Up" };
          log.push(`${tag}: Labeled orphan → C1b. Scap Push-Up`);
          changed = true;
        }
      }
    }

    if (dow === 3 && meso >= 2) {
      const c1Carry = exercises.findIndex(e =>
        /^C1\./.test(e.name || "") && /carry/i.test(e.name || "")
      );
      if (c1Carry >= 0) {
        exercises[c1Carry] = { ...exercises[c1Carry], name: exercises[c1Carry].name.replace(/^C1\./, "D1.") };
        log.push(`${tag}: Relabeled C1. Farmer Carry → D1.`);
        changed = true;
      }
    }

    if (dow === 4) {
      const rowIndices: number[] = [];
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].type === "exercise" && /row|meadows/i.test(exercises[i].name || "")) {
          rowIndices.push(i);
        }
      }
      if (rowIndices.length >= 3) {
        let removeIdx = -1;
        for (const ri of rowIndices) {
          const n = exercises[ri].name || "";
          if (/^B3\./i.test(n) || /^C3\./i.test(n) || /seated cable row/i.test(n)) {
            removeIdx = ri;
            break;
          }
        }
        if (removeIdx === -1) removeIdx = rowIndices[rowIndices.length - 1];
        const removed = removeAt(exercises, removeIdx);
        log.push(`${tag}: Removed redundant 3rd row: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 4 && meso >= 2) {
      const floorIdx = findByPattern(exercises, /db floor press/i);
      if (floorIdx >= 0) {
        const removed = removeAt(exercises, floorIdx);
        log.push(`${tag}: Removed redundant pressing: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 4 && meso === 3) {
      const machineIdx = findByPattern(exercises, /incline machine press/i);
      if (machineIdx >= 0) {
        const removed = removeAt(exercises, machineIdx);
        log.push(`${tag}: Removed redundant pressing: ${removed.name}`);
        changed = true;
      }
    }

    if (dow === 4) {
      const trap3Idx = findByPattern(exercises, /trap 3 raise/i);
      const serratusIdx = findByPattern(exercises, /serratus wall slide/i);
      if (trap3Idx >= 0 && serratusIdx >= 0) {
        exercises[trap3Idx] = {
          ...exercises[trap3Idx],
          detail: ((exercises[trap3Idx].detail || "") + " Superset with Serratus Wall Slides 2×8.").trim(),
          superset_with: "Serratus Wall Slide"
        };
        removeAt(exercises, serratusIdx);
        log.push(`${tag}: Merged Serratus Wall Slide into Trap 3 Raise superset`);
        changed = true;
      }
    }

    if (dow === 4 && meso >= 2) {
      const b2Idx = exercises.findIndex(e => /^B2\./.test(e.name || ""));
      const b1Idx = exercises.findIndex(e => /^B1\./.test(e.name || ""));
      if (b2Idx >= 0 && b1Idx >= 0 && b2Idx < b1Idx) {
        const temp = exercises[b2Idx];
        exercises[b2Idx] = exercises[b1Idx];
        exercises[b1Idx] = temp;
        log.push(`${tag}: Swapped B1/B2 into correct order`);
        changed = true;
      }
    }

    if (dow === 4) {
      for (let i = 0; i < exercises.length; i++) {
        if (/^C0\./.test(exercises[i].name || "")) {
          exercises[i] = { ...exercises[i], name: exercises[i].name.replace(/^C0\./, "C1.") };
          log.push(`${tag}: Fixed C0 → C1 label`);
          changed = true;
        }
      }
    }

    if (dow === 2 || dow === 5) {
      if (renumberBlock(exercises, "F")) {
        log.push(`${tag}: Renumbered F-block sequentially`);
        changed = true;
      }
    }

    if (dow === 4) {
      for (let i = 0; i < exercises.length; i++) {
        if (/^G1\./.test(exercises[i].name || "")) {
          exercises[i] = { ...exercises[i], name: exercises[i].name.replace(/^G1\./, "F99.") };
          changed = true;
        }
      }

      for (const letter of ["C", "D", "E", "F"]) {
        if (renumberBlock(exercises, letter)) {
          changed = true;
        }
      }
      log.push(`${tag}: Renumbered C/D/E/F blocks sequentially`);
    }

    if (dow === 6) {
      let bIdx = 1;
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (ex.type === "exercise" && !/^[A-Z]\d+\./.test(ex.name || "")) {
          const oldName = ex.name || "";
          let prefix: string;
          if (/movement block|movement prep/i.test(oldName)) {
            prefix = "A1";
          } else {
            prefix = `B${bIdx}`;
            bIdx++;
          }
          exercises[i] = { ...ex, name: `${prefix}. ${oldName}` };
          log.push(`${tag}: Labeled ${oldName} → ${prefix}. ${oldName}`);
          changed = true;
        }
      }
    }

    if (changed) {
      if (!dryRun) {
        const { error: upErr } = await supabase
          .from("program_days").update({ exercises }).eq("id", day.id);
        if (upErr) log.push(`ERROR ${tag}: ${upErr.message}`);
        else updated++;
      } else {
        updated++;
      }
    }
  }

  const summary: any[] = [];
  if (dryRun) {
    for (const day of allDays) {
      const dn = day.day_number;
      const dow = getDow(dn);
      const meso = getMeso(dn);
      if (meso > 3 || dow === 7) continue;
      const exCount = (day.exercises as any[]).filter((e: any) => e.type === "exercise").length;
      summary.push({ day_number: dn, meso, dow, label: day.label, exercise_count: exCount });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    dry_run: dryRun,
    updated,
    total_days: allDays.length,
    changes: log,
    ...(dryRun ? { post_fix_summary: summary } : {})
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
