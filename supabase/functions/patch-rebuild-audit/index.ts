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

    const PROGRAM_ID = "3da785bc-a03d-4fe9-ae7f-dfed52fb8124";

    const { data: allDays, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises, label")
      .eq("program_id", PROGRAM_ID)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    const fixes: string[] = [];
    const updates: { id: string; exercises: unknown[] }[] = [];

    // ─── Helpers ───
    function getWeekInfo(dayNumber: number) {
      const week = Math.ceil(dayNumber / 7);
      const dow = ((dayNumber - 1) % 7) + 1; // 1-6 training, 7=rest
      const phase = week <= 4 ? 1 : week <= 8 ? 2 : 3;
      const mesoWeek = ((week - 1) % 4) + 1; // 1-4 within mesocycle
      return { week, dow, phase, mesoWeek };
    }

    function getTempos(phase: number) {
      if (phase === 1) return { primary: "3-1-1-0", secondary: "3-0-1-1", accessory: "2-0-1-1" };
      if (phase === 2) return { primary: "2-1-1-0", secondary: "3-0-1-1", accessory: "2-0-1-1" };
      return { primary: "2-0-X-0", secondary: "2-0-1-1", accessory: "2-0-1-0" };
    }

    function getTargetRIR(mesoWeek: number): string {
      if (mesoWeek === 1) return "3";
      if (mesoWeek === 2) return "2";
      if (mesoWeek === 3) return "1";
      return "4"; // deload
    }

    function parseReps(reps: string): { num: number; suffix: string } | null {
      const match = String(reps || "").match(/^(\d+)(.*)/);
      if (!match) return null;
      return { num: parseInt(match[1]), suffix: match[2] };
    }

    function isSkipForRIR(name: string, rir: any): boolean {
      return name.startsWith("A1") || name.startsWith("E") || name.startsWith("F") ||
        name.includes("EMOM") || name.includes("Conditioning") || name.includes("Circuit") ||
        rir === null || rir === "null" || rir === "no RIR" || !rir;
    }

    function isSkipForTempo(name: string, type: string): boolean {
      return type === "conditioning" || type === "warmup" ||
        name.startsWith("A1") || name.startsWith("F") ||
        name.includes("Carry") || name.includes("EMOM") ||
        name.includes("Conditioning") || name.includes("Circuit") ||
        name.includes("Plank") || name.includes("Dead Bug") ||
        name.includes("Pallof") || name.includes("Bird Dog") ||
        name.includes("Hollow") || name.includes("Glute Bridge Hold") ||
        name.includes("Copenhagen") || name.includes("Row ") && !name.startsWith("C1") && !name.startsWith("D");
    }

    // ─── Unique Mindset Moments (32 unique entries for 78 training days) ───
    const mindsetPool = [
      "Building a strong body is like building a strong family — it starts with showing up consistently, not perfectly. Your kids don't need a perfect dad; they need a present one.",
      "Recovery isn't weakness — it's strategy. The strongest men know when to push and when to pull back. Model that wisdom for your family today.",
      "Your body adapts to the stress you give it. So does your character. Each challenging rep builds more than muscle — it builds the discipline your family depends on.",
      "Foundations aren't glamorous, but nothing lasting is built without them. Your patience in this phase will pay dividends in every phase that follows.",
      "Controlled movement requires more discipline than explosive movement. Measured responses to chaos show your kids what real strength looks like.",
      "Soreness fades. The habit stays. You're not just training your body — you're training your identity as someone who follows through.",
      "Progress isn't always visible in the mirror. Some weeks, progress is just showing up when you didn't feel like it. Your kids are watching that more than your physique.",
      "Deload weeks aren't about doing less — they're about recovering smarter. Rest isn't laziness; it's preparation for what's next.",
      "The barbell doesn't care about your excuses. Neither does fatherhood. Both reward the men who show up and do the work, especially when it's hard.",
      "Strength isn't just about what you can lift — it's about what you can carry. The weight of responsibility gets lighter when you're physically and mentally prepared.",
      "New challenges feel awkward at first. That front squat felt foreign, just like your first days as a dad. Keep practicing. Competence follows commitment.",
      "Your body is learning a new language this phase — heavier loads, more demand. Growth always starts with discomfort. Lean into it.",
      "Consistency beats intensity over time. You don't need to crush every session — you need to complete every session. That's the lesson worth teaching.",
      "Mid-program is where most people quit. Not you. You're building something that lasts — in the gym and at home.",
      "Heavy weight teaches you to breathe under pressure. So does a toddler meltdown at the grocery store. Both require calm, focus, and trusting your training.",
      "Deload doesn't mean you've lost ground. It means you're smart enough to let your body consolidate the gains. Apply that patience to your relationships too.",
      "You've earned this level. The foundation is set, the strength is built, and now you're refining the machine. That's what maturity looks like — in training and in fatherhood.",
      "Athletic movement requires coordination, not just force. Being a great dad requires the same — knowing when to be firm, when to be gentle, when to listen.",
      "Intensity techniques push you past comfort. That's where growth lives. Your kids need to see a dad who isn't afraid of being uncomfortable.",
      "Power is controlled force applied at the right time. In the gym and at home, timing matters as much as effort.",
      "You started this program building basics. Now you're performing. Show your kids that earned confidence beats inherited arrogance.",
      "Sprint finishers hurt. So does watching your kid struggle through something hard. Both teach the same lesson: discomfort is temporary, growth is permanent.",
      "Conditioning days reveal your true fitness — not how much you can lift, but how long you can sustain effort. Fatherhood is the ultimate endurance event.",
      "EMOMs teach you to work within constraints — limited time, limited rest, maximum output. Sound familiar? That's every weeknight as a dad.",
      "The clock doesn't lie, and neither does your effort today. Push the pace, recover quickly, and repeat. That's the rhythm of a capable father.",
      "Saturday conditioning isn't about perfection — it's about sustained effort under fatigue. That separates dads who get by from dads who thrive.",
      "Active recovery isn't passive — it's intentional restoration. Your body and family both need you to recharge with purpose.",
      "Zone 2 work builds the aerobic engine that powers everything else. Think of today as maintenance on the machine your family depends on.",
      "Low-intensity days build the foundation for high-intensity performance. Recovery is not the opposite of training — it's part of training.",
      "Today is about moving well, not moving hard. Quality movement patterns now prevent injuries that would take you away from your family later.",
      "The finish line isn't the end — it's proof that you can start again at a higher level. Carry that energy into your next chapter as a father.",
      "Final push. You didn't just survive this program — you adapted, grew, and showed up. That's the example your kids will remember.",
    ];

    // ─── Unique Dad Missions (32 unique entries) ───
    const missionPool = [
      "Spend 10 minutes on the floor with your youngest child doing whatever they want to do. Follow their lead completely.",
      "Ask your child about the hardest part of their day and just listen — no fixing, no advice, just presence.",
      "Teach your child one physical movement with proper form: a push-up, a squat, or a plank. Make it fun.",
      "Write a short note to your child about something you admire about them. Leave it where they'll find it.",
      "Do a household chore your partner usually handles without being asked or mentioned.",
      "Spend 5 minutes making eye contact and giving full attention to each family member today.",
      "Play a physical game with your kids — wrestling, tag, or racing. Let them win once, then show them effort.",
      "Take a 10-minute walk with your child. Ask them what they'd change about the world if they could.",
      "Cook a meal with your child. Let them measure, stir, and make mistakes. Process over product.",
      "Tell your child about a time you failed at something and what you learned from it.",
      "Sit with your family for dinner without your phone in sight. Be fully present for the conversation.",
      "Read to your child for 10 minutes — even if they say they're too old for it.",
      "Do something active with your kids — shoot hoops, kick a ball, or go for a bike ride. No coaching, just playing.",
      "Ask your partner what one thing would make their week easier, then do it today.",
      "Teach your child a life skill: tying shoes, making the bed, or packing a bag for school.",
      "Write down three things your child did this week that made you proud. Share one with them before bed.",
      "Challenge your child to a plank hold contest. Celebrate their effort regardless of who wins.",
      "Take your child outside and point out three things in nature. Ask what they notice that you don't.",
      "Give your child a real job to help with — fixing, organizing, or building something together.",
      "Ask your kid what superpower they'd want and why. Share yours. Let the conversation wander.",
      "Reflect on one moment today where you modeled discipline for your kids. Did they see it?",
      "Plan one weekend activity your family hasn't done before — a new park, recipe, or adventure.",
      "Practice active listening at dinner: repeat back what each person says before responding.",
      "Take your child to do something you enjoy and explain why you love it. Share your world.",
      "Do 10 push-ups with your child before breakfast. Start a new father-child tradition.",
      "Walk your child to school or the bus stop. Use those minutes for real conversation.",
      "Roughhouse with your kids for 5 minutes. Physical play builds trust and connection.",
      "Help your child organize their backpack or one area of their room. Teach, don't just do.",
      "Sit with your child while they do homework. Don't help unless asked — just be present.",
      "Before bed, tell your child one specific thing from today you're proud of them for.",
      "Spend 5 minutes stretching or doing mobility with your child. Model caring for your body.",
      "Take a family photo today — not for social media, just because you want to remember this season.",
    ];

    let mindsetIdx = 0;
    let missionIdx = 0;
    const usedMindsets = new Set<string>();
    const usedMissions = new Set<string>();

    for (const day of allDays!) {
      const { week, dow, phase, mesoWeek } = getWeekInfo(day.day_number);
      const tempos = getTempos(phase);
      const targetRIR = getTargetRIR(mesoWeek);
      const isDeload = mesoWeek === 4;
      const isWeek3 = mesoWeek === 3;
      const isLowerDay = dow === 1 || dow === 4;

      let modified = false;
      let exercises = [...(day.exercises as any[])];

      // ═══════════════════════════════════════════════
      // FIX 1: Cap Week 3 reps at base + 2
      // ═══════════════════════════════════════════════
      if (isWeek3) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name: string = ex.name || "";
          const reps = parseReps(ex.reps);
          if (!reps || name.startsWith("A1") || name.startsWith("E") || name.startsWith("F")) return ex;

          // Primary lifts: base 8 → cap 10
          if (name.startsWith("B1") && reps.num > 10) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${name}: reps ${reps.num} → 10 (week 3 cap)`);
            return { ...ex, reps: `10${reps.suffix}` };
          }
          // Secondary & accessories: base 10 → cap 12
          if ((name.startsWith("C1") || name.startsWith("D")) && reps.num > 12) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${name}: reps ${reps.num} → 12 (week 3 cap)`);
            return { ...ex, reps: `12${reps.suffix}` };
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════
      // FIX 2: Fix deload week cues & RIR
      // ═══════════════════════════════════════════════
      if (isDeload) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name: string = ex.name || "";
          let detail: string = ex.detail || "";
          let changed = false;

          // Remove "+5% load" language
          if (detail.includes("+5%")) {
            detail = detail
              .replace(/,?\s*\+5% load[^.]*\.?\s*/gi, ". ")
              .replace(/\.\s*\./g, ".")
              .replace(/^\.\s*/, "")
              .trim();
            changed = true;
            fixes.push(`Day ${day.day_number} ${name}: removed "+5% load" deload cue`);
          }

          // Set RIR to 4 for working exercises
          if (!isSkipForRIR(name, ex.rir) && String(ex.rir) !== "4") {
            fixes.push(`Day ${day.day_number} ${name}: RIR ${ex.rir} → 4 (deload)`);
            changed = true;
            return { ...ex, detail, rir: "4" };
          }

          return changed ? { ...ex, detail } : ex;
        });
        modified = true;
      }

      // ═══════════════════════════════════════════════
      // FIX 3: Add formal tempo notation
      // ═══════════════════════════════════════════════
      exercises = exercises.map((ex: any) => {
        const name: string = ex.name || "";
        const detail: string = ex.detail || "";

        if (ex.type !== "exercise" || detail.includes("Tempo ") || isSkipForTempo(name, ex.type)) return ex;

        // Skip circuit sub-exercises (no letter prefix like B1, C1, D1)
        if (!name.match(/^[A-F]\d\./)) return ex;

        let tempo: string;
        if (name.startsWith("B1")) tempo = tempos.primary;
        else if (name.startsWith("C1")) tempo = tempos.secondary;
        else tempo = tempos.accessory;

        // Calf raises get pause tempo
        if (name.toLowerCase().includes("calf raise")) tempo = "2-0-1-2";

        modified = true;
        fixes.push(`Day ${day.day_number} ${name}: added Tempo ${tempo}`);
        return { ...ex, detail: `Tempo ${tempo}. ${detail}` };
      });

      // ═══════════════════════════════════════════════
      // FIX 4: Add calves to lower days missing them
      // ═══════════════════════════════════════════════
      if (isLowerDay) {
        const hasCalves = exercises.some((e: any) =>
          e.type === "exercise" && (e.name || "").toLowerCase().includes("calf")
        );

        if (!hasCalves) {
          // Insert before core section (E exercises)
          const coreIdx = exercises.findIndex((e: any) =>
            e.type === "exercise" && (e.name || "").match(/^E\d?\./)
          );

          if (coreIdx > 0) {
            const calfEx = {
              name: "D3. Standing Calf Raise",
              detail: "Tempo 2-0-1-2. Rise fully onto the balls of your feet, pause 2 seconds at the top, lower with control into a full stretch.",
              sets: isDeload ? 2 : 3,
              reps: "15",
              rest: 45,
              rir: isDeload ? "4" : targetRIR,
              type: "exercise",
              group: `calfW${week}D${dow}`,
              superset_label: null,
            };
            exercises.splice(coreIdx, 0, calfEx);
            modified = true;
            fixes.push(`Day ${day.day_number}: added Standing Calf Raise`);
          }
        }
      }

      // ═══════════════════════════════════════════════
      // FIX 5: Add shoulder prehab to lower day warmups
      // ═══════════════════════════════════════════════
      if (isLowerDay) {
        const warmups = exercises.filter((e: any) => e.type === "warmup");
        const hasShoulderWork = warmups.some((e: any) => {
          const n = (e.name || "").toLowerCase();
          return n.includes("band pull") || n.includes("face pull") || n.includes("external rotation");
        });

        if (!hasShoulderWork) {
          const lastWarmupIdx = exercises.reduce(
            (acc: number, e: any, i: number) => (e.type === "warmup" ? i : acc),
            -1
          );

          if (lastWarmupIdx >= 0) {
            const shoulderPrehab = {
              name: "W4. Band Pull-Apart",
              detail: "Keep arms straight, squeeze shoulder blades together at end range. Maintains shoulder health on non-upper days.",
              sets: 2,
              reps: "15",
              rest: 30,
              rir: null,
              type: "warmup",
              group: exercises[lastWarmupIdx]?.group || `wuW${week}D${dow}`,
              superset_label: null,
            };
            exercises.splice(lastWarmupIdx + 1, 0, shoulderPrehab);
            modified = true;
            fixes.push(`Day ${day.day_number}: added Band Pull-Apart to warmup`);
          }
        }
      }

      // ═══════════════════════════════════════════════
      // FIX 6: Fix RIR progression (non-deload weeks)
      // ═══════════════════════════════════════════════
      if (!isDeload) {
        exercises = exercises.map((ex: any) => {
          if (ex.type !== "exercise") return ex;
          const name: string = ex.name || "";
          if (isSkipForRIR(name, ex.rir)) return ex;

          const currentRIR = String(ex.rir);
          // Normalize ranges like "1-2" to the target
          if (currentRIR !== targetRIR) {
            modified = true;
            fixes.push(`Day ${day.day_number} ${name}: RIR ${currentRIR} → ${targetRIR}`);
            return { ...ex, rir: targetRIR };
          }
          return ex;
        });
      }

      // ═══════════════════════════════════════════════
      // FIX 7: Deduplicate Mindset Moments & Dad Missions
      // ═══════════════════════════════════════════════
      exercises = exercises.map((ex: any) => {
        if (ex.type === "mindset") {
          const text = ex.detail || "";
          if (usedMindsets.has(text)) {
            // Pick unique replacement
            let replacement = mindsetPool[mindsetIdx % mindsetPool.length];
            let attempts = 0;
            while (usedMindsets.has(replacement) && attempts < mindsetPool.length) {
              mindsetIdx++;
              replacement = mindsetPool[mindsetIdx % mindsetPool.length];
              attempts++;
            }
            usedMindsets.add(replacement);
            mindsetIdx++;
            modified = true;
            fixes.push(`Day ${day.day_number}: replaced duplicate Mindset Moment`);
            return { ...ex, detail: replacement };
          }
          usedMindsets.add(text);
          mindsetIdx++;
        }

        if (ex.type === "mission") {
          const text = ex.detail || "";
          if (usedMissions.has(text)) {
            let replacement = missionPool[missionIdx % missionPool.length];
            let attempts = 0;
            while (usedMissions.has(replacement) && attempts < missionPool.length) {
              missionIdx++;
              replacement = missionPool[missionIdx % missionPool.length];
              attempts++;
            }
            usedMissions.add(replacement);
            missionIdx++;
            modified = true;
            fixes.push(`Day ${day.day_number}: replaced duplicate Dad Mission`);
            return { ...ex, detail: replacement };
          }
          usedMissions.add(text);
          missionIdx++;
        }

        return ex;
      });

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
      if (updErr) throw new Error(`Update ${upd.id} failed: ${updErr.message}`);
    }

    // ─── Summary Stats ───
    const fixCounts = {
      rep_caps: fixes.filter(f => f.includes("week 3 cap")).length,
      deload_cues: fixes.filter(f => f.includes("deload")).length,
      tempos_added: fixes.filter(f => f.includes("added Tempo")).length,
      calves_added: fixes.filter(f => f.includes("Calf Raise")).length,
      shoulder_prehab: fixes.filter(f => f.includes("Band Pull-Apart")).length,
      rir_fixes: fixes.filter(f => f.includes("RIR") && !f.includes("deload")).length,
      mindset_deduped: fixes.filter(f => f.includes("Mindset")).length,
      mission_deduped: fixes.filter(f => f.includes("Dad Mission")).length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        total_fixes: fixes.length,
        days_modified: updates.length,
        summary: fixCounts,
        details: fixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PATCH-REBUILD] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
