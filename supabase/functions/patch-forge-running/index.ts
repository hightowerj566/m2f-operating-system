import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PID='d7a417b5-bdb6-4c2c-a91a-be89b278b2ca';
const ex=(name:string,detail:string,reps:any,type='conditioning',group='CONDITIONING',sets=1)=>({rir:null,name,reps,rest:null,sets,type,group,detail,superset_label:null});

const meso=(w:number)=>Math.ceil(w/4), wim=(w:number)=>((w-1)%4)+1, dl=(w:number)=>wim(w)===4;

// ---------- Monday: POWER ----------
function power(w:number){
  const m=meso(w);
  const blocks=({
    1:{t:'Power Block — 6 min',d:'Every 60s × 6:\n• Odd minutes: 5 Medicine-Ball Slams (max intent)\n• Even minutes: 8 KB Swings (moderate, hip-driven)\nRest the remainder of each minute. Stop the block early if bar speed or throw distance drops.'},
    2:{t:'Power Block — 7 min',d:'Every 60s × 7:\n• Odd minutes: 3 Non-Countermovement Box Jumps (step down)\n• Even minutes: 8 KB Swings (moderate-heavy)\nRest the remainder of each minute. Quality over fatigue — this is not conditioning.'},
    3:{t:'Power Block — 8 min',d:'Every 60s × 8:\n• Odd minutes: 5 Rotational Medicine-Ball Throws per side\n• Even minutes: 6 Heavy KB Swings\nFull recovery inside each minute. End the block if speed drops.'},
    4:{t:'Power Block — 7 min',d:'Every 60s × 7:\n• Odd minutes: 3 Broad Jumps (soft, controlled landings)\n• Even minutes: 1 × 20 m Acceleration (build, do not sprint maximally)\nWalk back and reset. Athletic, not exhausting.'},
    5:{t:'Power Block — 6 min',d:'Every 60s × 6:\n• Odd minutes: 5 Medicine-Ball Slams\n• Even minutes: 8 KB Swings (moderate)\nDeliberately short — this block protects the highest lifting-volume mesocycle.'},
    6:{t:'Power Block — 8 min',d:'Every 60s × 8:\n• Minute A: 3 Vertical Jumps (max intent)\n• Minute B: 4 Rotational Medicine-Ball Throws per side\n• Minute C: 1 × 25 m Acceleration\nRepeat the rotation. Every rep fast or the block is over.'},
  } as any)[m];
  if(dl(w)) return [ex('Power Block — 4 min','Every 60s × 4:\n• Odd minutes: 4 Medicine-Ball Slams\n• Even minutes: 6 KB Swings (light-moderate)\nDeload — sharpness only, zero fatigue.','4 min')];
  return [ex(blocks.t,blocks.d,blocks.t.split('— ')[1])];
}

// ---------- Tuesday: QUALITY RUN ----------
const runPlan={
 1:{t:'Quality Run — 6 × 1 min',d:'Warm up 10 min easy jog + drills.\n6 × 1 min controlled-hard (RPE 8) / 2 min easy jog recovery.\nCool down 5 min easy.\nRepeatability rule: rep 1 should not be faster than rep 6.'},
 2:{t:'Quality Run — 7 × 1 min',d:'Warm up 10 min easy jog + drills.\n7 × 1 min controlled-hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nOnly the number of reps went up this week — hold the same pace.'},
 3:{t:'Quality Run — 8 × 1 min',d:'Warm up 10 min easy jog + drills.\n8 × 1 min controlled-hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nSame pace as Week 2 — reps are the only progression.'},
 4:{t:'Quality Run — 4 × 1 min (Deload)',d:'Warm up 10 min easy.\n4 × 1 min controlled-hard (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — roughly half the normal volume. Keep the exposure, drop the fatigue.'},
 5:{t:'Quality Run — 5 × 2 min',d:'Warm up 10 min easy jog + drills.\n5 × 2 min hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nInterval duration is the new variable — back the pace off slightly from the 1-min work.'},
 6:{t:'Quality Run — 6 × 2 min',d:'Warm up 10 min easy jog + drills.\n6 × 2 min hard (RPE 8) / 2 min easy jog.\nCool down 5 min.\nSame pace, one more rep.'},
 7:{t:'Quality Run — 6 × 2 min (short recovery)',d:'Warm up 10 min easy jog + drills.\n6 × 2 min hard (RPE 8) / 90 s easy jog.\nCool down 5 min.\nRecovery shortened — pace stays exactly the same as last week.'},
 8:{t:'Quality Run — 3 × 2 min (Deload)',d:'Warm up 10 min easy.\n3 × 2 min hard (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — half volume, controlled effort.'},
 9:{t:'Quality Run — 4 × 3 min',d:'Warm up 10 min easy jog + drills.\n4 × 3 min strong-steady (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nHeavy strength block — run controlled. If legs are flat from Monday, hold the easy end.'},
 10:{t:'Quality Run — 5 × 3 min',d:'Warm up 10 min easy jog + drills.\n5 × 3 min strong-steady (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nOne more rep, same pace.'},
 11:{t:'Quality Run — 5 × 3 min (short recovery)',d:'Warm up 10 min easy jog + drills.\n5 × 3 min strong-steady (RPE 8) / 90 s easy jog.\nCool down 5 min.\nRecovery is the only change. Protect hamstrings and calves — no heroics.'},
 12:{t:'Quality Run — 3 × 3 min (Deload)',d:'Warm up 10 min easy.\n3 × 3 min steady (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload — roughly 45% of normal running stress.'},
 13:{t:'Quality Run — 6 × 200 m',d:'Warm up 10 min easy jog + 4 build-ups.\n6 × 200 m fast but relaxed (RPE 8, ~mile effort) / walk-jog 90 s.\nCool down 5 min.\nSpeed block — smooth mechanics beat straining. Rep 1 ≈ rep 6.'},
 14:{t:'Quality Run — 8 × 200 m',d:'Warm up 10 min easy jog + 4 build-ups.\n8 × 200 m fast but relaxed (RPE 8) / walk-jog 90 s.\nCool down 5 min.\nSame pace as Week 13 — reps only.'},
 15:{t:'Quality Run — 10 × 200 m',d:'Warm up 10 min easy jog + 4 build-ups.\n10 × 200 m fast but relaxed (RPE 8) / walk-jog 90 s.\nCool down 5 min.\nIf the last two reps fall off badly, you opened too fast.'},
 16:{t:'Quality Run — 5 × 200 m (Deload)',d:'Warm up 10 min easy jog + 3 build-ups.\n5 × 200 m relaxed-fast (RPE 7) / walk-jog 2 min.\nCool down 5 min.\nDeload — half the reps, full recovery.'},
 17:{t:'Quality Run — 3 × 4 min',d:'Warm up 10 min easy jog + drills.\n3 × 4 min steady-hard (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nPeak hypertrophy block — running maintains, it does not peak. Keep it honest but sub-maximal.'},
 18:{t:'Quality Run — 4 × 4 min',d:'Warm up 10 min easy jog + drills.\n4 × 4 min steady-hard (RPE 7-8) / 2 min easy jog.\nCool down 5 min.\nOne added rep. Nothing else changes.'},
 19:{t:'Quality Run — 4 × 4 min (stronger)',d:'Warm up 10 min easy jog + drills.\n4 × 4 min at controlled 10K effort (RPE 8) / 2 min easy jog.\nCool down 5 min.\nPace is the only progression. If squats felt heavy yesterday, hold RPE 7.'},
 20:{t:'Quality Run — 2 × 4 min (Deload)',d:'Warm up 10 min easy.\n2 × 4 min steady (RPE 7) / 2 min easy jog.\nCool down 5 min.\nDeload before the final block — cut running stress roughly in half.'},
 21:{t:'Quality Run — 5 × 3 min',d:'Warm up 10 min easy jog + drills.\n5 × 3 min at controlled 10K effort (RPE 8) / 2 min easy jog.\nCool down 5 min.\nRe-sharpening for the assessment weeks.'},
 22:{t:'Quality Run — 6 × 400 m',d:'Warm up 10 min easy jog + 4 build-ups.\n6 × 400 m at controlled 5K effort / 90 s walk-jog.\nCool down 5 min.\nRecord every split. Even splits are the standard.'},
 23:{t:'Quality Run — 3 × 800 m',d:'Warm up 10 min easy jog + 4 build-ups.\n3 × 800 m at controlled 5K effort / 3 min easy jog.\nCool down 5 min.\nRecord splits. This is your dress rehearsal for the 2-mile test.'},
 24:{t:'2-Mile Assessment',d:'Warm up 12 min easy jog + 4 build-ups.\n2-mile time trial. Even effort — negative split if anything.\nCool down 8 min easy.\nRecord the time next to your Week 1 lifts. This is the proof the 24 weeks worked.'},
};
const run=(w:number)=>[ex((runPlan as any)[w].t,(runPlan as any)[w].d,null)];

// ---------- Wednesday: ZONE 2 ----------
const z2min={1:'35 min',2:'38 min',3:'40 min',4:'40 min',5:'45 min',6:'40 min'};
function zone2(w:number){
  const m=meso(w);
  const mins=dl(w)?'25 min':(z2min as any)[m];
  const d=`Bike, incline treadmill walk, rower, or easy ruck. ${dl(w)?'Deload volume. ':''}Nasal-breathing pace, HR ~60-70% max, RPE 4-5 — you should be able to hold a conversation the whole time.\nNo running today. Tuesday and Saturday already cover your impact exposure.`;
  return {name:`A1. Zone 2 — ${mins}`,reps:mins,detail:d};
}

// ---------- Thursday: LOADED CAPACITY ----------
function carry(w:number){
  const m=meso(w);
  if(dl(w)) return [ex('Loaded Capacity — 6 min','6 min continuous, easy pace:\n• 30 m Farmer Carry (moderate)\n• 30 m Suitcase Carry each side (moderate)\nDeload — posture and grip only. No grinding.','6 min')];
  const blocks=({
    1:{t:'Loaded Capacity — 8 min',d:'8 min continuous:\n• 40 m Farmer Carry\n• 40 m Suitcase Carry (20 m each side)\n• Walk 30 s\nProgression this meso: add load week to week, keep distance fixed. Ribs down, tall posture, no leaning.'},
    2:{t:'Loaded Capacity — 8 min',d:'8 min continuous:\n• 50 m Farmer Carry\n• 40 m Suitcase Carry (20 m each side)\n• Walk 30 s\nProgression this meso: distance goes up, load holds. Sled push (40 m) may replace the farmer carry if available.'},
    3:{t:'Loaded Capacity — 9 min',d:'9 min continuous:\n• 40 m Heavy Farmer Carry\n• 40 m Sled Push or Drag (moderate)\n• Walk 30 s\nProgression this meso: load. Grip failing before the trunk means the load is right.'},
    4:{t:'Loaded Capacity — 9 min',d:'9 min continuous:\n• 40 m Farmer Carry (heavy)\n• 40 m Suitcase Carry (20 m each side)\n• 30 m Sled Drag (backward) or ruck walk\nProgression this meso: density — same work, less standing around.'},
    5:{t:'Loaded Capacity — 8 min',d:'8 min continuous:\n• 40 m Farmer Carry (heavy)\n• 40 m Sled Push (moderate)\n• Walk 30 s\nKept short on purpose — this is the peak hypertrophy block. Load, do not extend.'},
    6:{t:'Loaded Capacity — 10 min',d:'10 min continuous:\n• 50 m Heavy Farmer Carry\n• 40 m Sled Push (heavy)\n• 40 m Suitcase Carry (20 m each side)\nProgression this meso: load and density. Log the total load carried — this is testable.'},
  } as any)[m];
  return [ex(blocks.t,blocks.d,blocks.t.split('— ')[1])];
}

// ---------- Saturday: EASY RUN ----------
const satMin={1:[20,25,30,15],2:[25,30,35,18],3:[30,35,40,20],4:[30,35,40,20],5:[35,40,45,22],6:[35,40,30,20]};
function easyRun(w:number){
  const m=meso(w), i=wim(w)-1;
  const mins=(satMin as any)[m][i];
  const strides=(m===4&&!dl(w))?'\nFinish with 4-6 × 20 s relaxed strides, walking back between each. Strides are smooth and fast — never maximal sprints.':'';
  const note=dl(w)?'\nDeload week — shortened on purpose. Keep the habit, drop the load.':'';
  const m5=(m===5&&!dl(w))?'\nHighest lifting-volume block: if your legs are beat up from Friday, take the short end of the range and keep it truly easy.':'';
  const w24=(w===24)?'\nShakeout only — you tested 2 miles on Tuesday. Nothing heroic.':'';
  return [ex(`Easy Run — ${mins} min`,`${mins} min continuous easy running. Conversational pace, RPE 4-5, nasal breathing where possible.\nThis is programmed aerobic work, not optional cardio — duration progresses before pace, and easy stays easy.\nIf impact is limited today: easy bike, rower or incline walk for the same duration.${strides}${m5}${note}${w24}`,`${mins} min`)];
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
      if (w > 24 || dow === 7) continue;
      const list = (d.exercises as any[]) ?? [];
      const keep = list.filter((x) => !["conditioning", "mindset", "mission"].includes(x.type));
      const tail = list.filter((x) => ["mindset", "mission"].includes(x.type));
      let next = list;
      let label = d.label as string;

      if (dow === 1) next = [...keep, ...power(w), ...tail];
      else if (dow === 2) {
        next = [...keep, ...run(w), ...tail];
        label = label.replace(/ \+ Engine( Benchmark)?$/, " + Quality Run");
      } else if (dow === 3) {
        const z = zone2(w);
        next = list.map((x) =>
          typeof x.name === "string" && x.name.startsWith("A1. ") && (x.name.includes("LISS") || x.name.includes("Zone 2"))
            ? { ...x, name: z.name, reps: z.reps, detail: z.detail, type: "conditioning", group: "CONDITIONING" }
            : x,
        );
        label = "Day 3 — Zone 2 + Core";
      } else if (dow === 4) next = [...keep, ...carry(w), ...tail];
      else if (dow === 5) {
        next = list.filter((x) => x.type !== "conditioning");
        label = label.replace(/ \+ Mixed( Benchmark)?$/, "");
      } else if (dow === 6) {
        next = [...easyRun(w), ...list.filter((x) => x.type !== "conditioning")];
        label = "Day 6 — Easy Run";
      }

      const { error: upErr } = await supabase.from("program_days").update({ exercises: next, label }).eq("id", d.id);
      results.push(upErr ? `\u274c D${d.day_number}: ${upErr.message}` : `\u2705 D${d.day_number} (${label})`);
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
