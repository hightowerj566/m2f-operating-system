// Re-applies the M2F Forge conditioning / running framework after a program re-import.
// Day 1 Power · Day 2 Quality Run · Day 3 Loaded Capacity · Day 4 no finisher
// Day 5 Rest · Day 6 Easy Run + mobility · Day 7 Rest
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PID = "d7a417b5-bdb6-4c2c-a91a-be89b278b2ca";

const ex = (name: string, detail: string, reps: string | null) => ({
  rir: null,
  name,
  reps,
  rest: null,
  sets: 1,
  type: "conditioning",
  group: "CONDITIONING",
  detail,
  superset_label: null,
});

const meso = (w: number) => Math.ceil(w / 4);
const wim = (w: number) => ((w - 1) % 4) + 1;
const dl = (w: number) => wim(w) === 4;

// ---------- Day 1: POWER ----------
function power(w: number) {
  const m = meso(w);
  const blocks = ({
    1: { t: "Power Block — 6 min", d: "Every 60s × 6:\n• Odd minutes: 5 Medicine-Ball Slams (max intent)\n• Even minutes: 8 Kettlebell Swings (moderate, hip-driven)\nRest the remainder of each minute. Stop early if speed drops." },
    2: { t: "Power Block — 7 min", d: "Every 60s × 7:\n• Odd minutes: 3 Non-Countermovement Box Jumps (step down)\n• Even minutes: 8 Kettlebell Swings (moderate-heavy)\nQuality over fatigue — this is not conditioning." },
    3: { t: "Power Block — 8 min", d: "Every 60s × 8:\n• Odd minutes: 5 Rotational Medicine-Ball Throws per side\n• Even minutes: 6 Heavy Kettlebell Swings\nFull recovery inside each minute. End the block if speed drops." },
    4: { t: "Power Block — 7 min", d: "Every 60s × 7:\n• Odd minutes: 3 Broad Jumps (soft, controlled landings)\n• Even minutes: 1 × 20 m Acceleration (build, do not sprint maximally)\nWalk back and reset. Athletic, not exhausting." },
    5: { t: "Power Block — 6 min", d: "Every 60s × 6:\n• Odd minutes: 5 Medicine-Ball Slams\n• Even minutes: 8 Kettlebell Swings (moderate)\nDeliberately short — this block protects the highest lifting-volume mesocycle." },
    6: { t: "Power Block — 8 min", d: "Every 60s × 8:\n• Odd minutes: 3 Vertical Jumps (max intent)\n• Even minutes: 4 Rotational Medicine-Ball Throws per side\nEvery rep fast or the block is over." },
  } as Record<number, { t: string; d: string }>)[m];
  if (dl(w)) return [ex("Power Block — 4 min", "Every 60s × 4:\n• Odd minutes: 4 Medicine-Ball Slams\n• Even minutes: 6 Kettlebell Swings (light-moderate)\nDeload — sharpness only, zero fatigue.", "4 min")];
  return [ex(blocks.t, blocks.d, blocks.t.split("— ")[1])];
}

// ---------- Day 2: QUALITY RUN ----------
const runPlan: Record<number, { t: string; d: string }> = {
  1: { t: "Quality Run — 6 × 1 min", d: "Warm up 10 min easy jog + drills.\n6 × 1 min controlled-hard (RPE 8) / 2 min easy jog recovery.\nCool down 5 min easy.\nRepeatability rule: rep 1 should not be faster than rep 6." },
  2: { t: "Quality Run — 7 × 1 min", d: "Warm up 10 min easy jog + drills.\n7 × 1 min controlled-hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nOnly the number of reps went up — hold the same pace." },
  3: { t: "Quality Run — 8 × 1 min", d: "Warm up 10 min easy jog + drills.\n8 × 1 min controlled-hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nSame pace as last week — reps are the only progression." },
  4: { t: "Quality Run — 4 × 1 min (Deload)", d: "Warm up 10 min easy.\n4 × 1 min controlled-hard (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — keep the exposure, drop the fatigue." },
  5: { t: "Quality Run — 5 × 2 min", d: "Warm up 10 min easy jog + drills.\n5 × 2 min hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nInterval duration is the new variable — back the pace off slightly." },
  6: { t: "Quality Run — 6 × 2 min", d: "Warm up 10 min easy jog + drills.\n6 × 2 min hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nSame pace, one more rep." },
  7: { t: "Quality Run — 6 × 2 min (short recovery)", d: "Warm up 10 min easy jog + drills.\n6 × 2 min hard (RPE 8) / 90 s easy jog.\nCool down 5 min.\nRecovery shortened — pace stays the same." },
  8: { t: "Quality Run — 3 × 2 min (Deload)", d: "Warm up 10 min easy.\n3 × 2 min hard (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — half volume, controlled effort." },
  9: { t: "Quality Run — 4 × 3 min", d: "Warm up 10 min easy jog + drills.\n4 × 3 min strong-steady (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nHeavy strength block — run controlled." },
  10: { t: "Quality Run — 5 × 3 min", d: "Warm up 10 min easy jog + drills.\n5 × 3 min strong-steady (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nOne more rep, same pace." },
  11: { t: "Quality Run — 5 × 3 min (short recovery)", d: "Warm up 10 min easy jog + drills.\n5 × 3 min strong-steady (RPE 8) / 90 s easy jog.\nCool down 5 min.\nRecovery is the only change." },
  12: { t: "Quality Run — 3 × 3 min (Deload)", d: "Warm up 10 min easy.\n3 × 3 min steady (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — roughly 45% of normal running stress." },
  13: { t: "Quality Run — 6 × 200 m", d: "Warm up 10 min easy jog + 4 build-ups.\n6 × 200 m fast but relaxed (RPE 8) / walk-jog 90 s.\nCool down 5 min.\nSmooth mechanics beat straining." },
  14: { t: "Quality Run — 8 × 200 m", d: "Warm up 10 min easy jog + 4 build-ups.\n8 × 200 m fast but relaxed (RPE 8) / walk-jog 90 s.\nCool down 5 min.\nSame pace as last week — reps only." },
  15: { t: "Quality Run — 10 × 200 m", d: "Warm up 10 min easy jog + 4 build-ups.\n10 × 200 m fast but relaxed (RPE 8) / walk-jog 90 s.\nCool down 5 min.\nIf the last two reps fall off badly, you opened too fast." },
  16: { t: "Quality Run — 5 × 200 m (Deload)", d: "Warm up 10 min easy jog + 3 build-ups.\n5 × 200 m relaxed-fast (RPE 7) / walk-jog 2 min.\nCool down 5 min.\nDeload — half the reps, full recovery." },
  17: { t: "Quality Run — 3 × 4 min", d: "Warm up 10 min easy jog + drills.\n3 × 4 min steady-hard (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nPeak hypertrophy block — running maintains, it does not peak." },
  18: { t: "Quality Run — 4 × 4 min", d: "Warm up 10 min easy jog + drills.\n4 × 4 min steady-hard (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nOne added rep. Nothing else changes." },
  19: { t: "Quality Run — 4 × 4 min (stronger)", d: "Warm up 10 min easy jog + drills.\n4 × 4 min at controlled 10K effort (RPE 8) / 2 min easy jog.\nCool down 5 min.\nPace is the only progression." },
  20: { t: "Quality Run — 2 × 4 min (Deload)", d: "Warm up 10 min easy.\n2 × 4 min steady (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload before the final block." },
  21: { t: "Quality Run — 5 × 3 min", d: "Warm up 10 min easy jog + drills.\n5 × 3 min at controlled 10K effort (RPE 8) / 2 min easy jog.\nCool down 5 min.\nRe-sharpening for the assessment weeks." },
  22: { t: "Quality Run — 6 × 400 m", d: "Warm up 10 min easy jog + 4 build-ups.\n6 × 400 m at controlled 5K effort / 90 s walk-jog.\nCool down 5 min.\nRecord every split. Even splits are the standard." },
  23: { t: "Quality Run — 3 × 800 m", d: "Warm up 10 min easy jog + 4 build-ups.\n3 × 800 m at controlled 5K effort / 3 min easy jog.\nCool down 5 min.\nDress rehearsal for the 2-mile test." },
  24: { t: "2-Mile Assessment", d: "Warm up 12 min easy jog + 4 build-ups.\n2-mile time trial. Even effort — negative split if anything.\nCool down 8 min easy.\nRecord the time next to your Week 1 lifts." },
};
const run = (w: number) => [ex(runPlan[w].t, runPlan[w].d, null)];

// ---------- Day 3: LOADED CAPACITY ----------
function carry(w: number) {
  const m = meso(w);
  if (dl(w)) return [ex("Loaded Capacity — 6 min", "6 min continuous, easy pace:\n• 30 m Farmer Carry (moderate)\n• 30 m Suitcase Carry each side (moderate)\nDeload — posture and grip only.", "6 min")];
  const blocks = ({
    1: { t: "Loaded Capacity — 8 min", d: "8 min continuous:\n• 40 m Farmer Carry\n• 40 m Suitcase Carry (20 m each side)\n• Walk 30 s\nProgression this block: add load, keep distance fixed. Ribs down, tall posture." },
    2: { t: "Loaded Capacity — 8 min", d: "8 min continuous:\n• 50 m Farmer Carry\n• 40 m Suitcase Carry (20 m each side)\n• Walk 30 s\nProgression this block: distance up, load holds. Sled push may replace the farmer carry." },
    3: { t: "Loaded Capacity — 9 min", d: "9 min continuous:\n• 40 m Heavy Farmer Carry\n• 40 m Sled Push or Drag (moderate)\n• Walk 30 s\nGrip failing before the trunk means the load is right." },
    4: { t: "Loaded Capacity — 9 min", d: "9 min continuous:\n• 40 m Farmer Carry (heavy)\n• 40 m Suitcase Carry (20 m each side)\n• 30 m Backward Sled Drag or ruck walk\nProgression this block: density." },
    5: { t: "Loaded Capacity — 8 min", d: "8 min continuous:\n• 40 m Farmer Carry (heavy)\n• 40 m Sled Push (moderate)\n• Walk 30 s\nKept short on purpose — load, do not extend." },
    6: { t: "Loaded Capacity — 10 min", d: "10 min continuous:\n• 50 m Heavy Farmer Carry\n• 40 m Sled Push (heavy)\n• 40 m Suitcase Carry (20 m each side)\nLog the total load carried — this is testable." },
  } as Record<number, { t: string; d: string }>)[m];
  return [ex(blocks.t, blocks.d, blocks.t.split("— ")[1])];
}

// ---------- Day 6: EASY RUN ----------
const satMin: Record<number, number[]> = {
  1: [20, 25, 30, 15], 2: [25, 30, 35, 18], 3: [30, 35, 40, 20],
  4: [30, 35, 40, 20], 5: [35, 40, 45, 22], 6: [35, 40, 30, 20],
};
function easyRun(w: number) {
  const m = meso(w);
  const mins = satMin[m][wim(w) - 1];
  const strides = m === 4 && !dl(w) ? "\nFinish with 4-6 × 20 s relaxed strides, walking back between each." : "";
  const note = dl(w) ? "\nDeload week — shortened on purpose. Keep the habit, drop the load." : "";
  const w24 = w === 24 ? "\nShakeout only — you tested 2 miles earlier this week." : "";
  return [ex(`Easy Run — ${mins} min`, `${mins} min continuous easy running. Conversational pace, RPE 4-5, nasal breathing where possible.\nThis is programmed aerobic work — duration progresses before pace, and easy stays easy.\nIf impact is limited today: easy bike, rower or incline walk for the same duration.${strides}${note}${w24}`, `${mins} min`)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: days, error } = await supabase
      .from("program_days")
      .select("id, day_number, label, exercises")
      .eq("program_id", PID)
      .order("day_number");
    if (error) throw error;

    const results: string[] = [];
    for (const d of days ?? []) {
      const w = Math.ceil(d.day_number / 7);
      const dow = ((d.day_number - 1) % 7) + 1;
      if (w > 24) continue;
      const list = ((d.exercises as any[]) ?? []);
      const keep = list.filter((x) => !["conditioning", "mindset", "mission"].includes(x.type));
      const tail = list.filter((x) => ["mindset", "mission"].includes(x.type));
      let next = list;
      let label = String(d.label ?? "");

      if (dow === 1) {
        next = [...keep, ...power(w), ...tail];
        label = label.replace(/ \+ (Power|Engine|Mixed)$/, "") + " + Power";
      } else if (dow === 2) {
        next = [...keep, ...run(w), ...tail];
        label = label.replace(/ \+ (Engine|Mixed|Power)$/, "") + " + Quality Run";
      } else if (dow === 3) {
        next = [...keep, ...carry(w), ...tail];
        label = label.replace(/ \+ (Loaded Capacity|Engine|Mixed)$/, "") + " + Loaded Capacity";
      } else if (dow === 4) {
        next = [...keep, ...tail];
        label = label.replace(/ \+ (Mixed|Engine)$/, "");
      } else if (dow === 5 || dow === 7) {
        label = `Day ${dow} — Rest Day`;
      } else if (dow === 6) {
        next = [...easyRun(w), ...keep, ...tail];
        label = "Day 6 — Easy Run + Mobility";
      }

      const { error: upErr } = await supabase
        .from("program_days")
        .update({ exercises: next, label })
        .eq("id", d.id);
      results.push(upErr ? `FAIL D${d.day_number}: ${upErr.message}` : `OK D${d.day_number} (${label})`);
    }

    return new Response(JSON.stringify({ success: true, updated: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
