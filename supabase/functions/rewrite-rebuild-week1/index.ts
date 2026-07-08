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
    const RIR_NOTE = "(RIR = Reps In Reserve: RIR 3 means 3 reps left before failure)";
    const P1_LOAD_LOWER = "Add 5 lb to lower body compounds each week when all sets are completed at RIR 3+.";
    const P1_LOAD_UPPER = "Add 2.5 lb to upper body compounds each week when all sets are completed at RIR 3+.";

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 1: Lower Body — Squat Emphasis
    // ════════════════════════════════════════════
    const day1 = [
      // ── WARM-UP / ACTIVATION (8 min) ──
      { name: "W1. Foam Roller Thoracic Extension", detail: "Lie face-up with foam roller across mid-back. Arms crossed over chest. Gently extend over the roller, hold 2s, reposition slightly higher/lower. Mobilizes thoracic spine for squat posture.", sets: 1, reps: "45s", rest: 0, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W2. Cat-Cow", detail: "On all fours, inhale to arch (cow), exhale to round (cat). Move slowly through full spinal range. Activates paraspinals and teaches segmental spinal control.", sets: 1, reps: "10", rest: 0, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W3. Kneeling Hip Flexor Stretch", detail: "Half-kneeling, rear knee on pad. Tuck pelvis under (posterior tilt), lean forward gently until stretch is felt in the front of the rear hip. Hold. Releases psoas for better squat depth.", sets: 1, reps: "60s each side", rest: 0, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W4. Hip 90/90 Stretch", detail: "Sit with both legs at 90°. Rotate torso over front shin, maintaining tall posture. Switch sides. Opens hip internal and external rotation.", sets: 1, reps: "60s each side", rest: 30, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W5. Glute Bridge (bodyweight)", detail: "Squeeze glutes at the top, avoid overextending lower back. Focus on hip extension, not lumbar hyperextension. Hold top for 2s.", sets: 2, reps: "12", rest: 45, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W6. Bodyweight Squat with Pause", detail: "Descend to full depth, pause 2s at the bottom, maintain tension in quads and glutes, stand up. Groove the squat pattern before loading.", sets: 2, reps: "8", rest: 45, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },
      { name: "W7. Band Pull-Apart", detail: "Keep arms straight, squeeze shoulder blades together at end range. Maintains shoulder health on non-upper days.", sets: 2, reps: "15", rest: 30, rir: null, type: "warmup", group: "wuW1D1", superset_label: null },

      // ── POWER / PLYOMETRIC ──
      { name: "A1. Squat Jump (bodyweight)", detail: "Light, controlled jump. Land softly, absorbing impact through hips and knees. Reset fully between reps — do not rush. Full recovery between sets.", sets: 3, reps: "4", rest: 60, rir: null, type: "exercise", group: "ppW1D1", superset_label: null },

      // ── PRIMARY COMPOUND ──
      { name: "B1. Goblet Squat", detail: `Tempo 3-1-1-0. Hold dumbbell vertically against chest. Keep chest proud, brace core hard, push knees out over toes, descend with a 3-second count, pause 1s at bottom, drive up powerfully. ${P1_LOAD_LOWER} ${RIR_NOTE}`, sets: 3, reps: "8", rest: 90, rir: "3", type: "exercise", group: "psW1D1", superset_label: null },
      { name: "B1 — Coaching Note", detail: "The goblet squat teaches proper squat mechanics before barbell loading. Keep elbows inside the knees at the bottom — if they flare wide, the weight is too heavy. Think 'sit between your hips' not 'sit back.'", sets: null, reps: null, rest: null, rir: null, type: "note", group: "psW1D1", superset_label: null },

      // ── SECONDARY COMPOUND ──
      { name: "C1. Romanian Deadlift (dumbbell)", detail: `Tempo 3-0-1-1. Maintain slight knee bend, push hips back, keep dumbbells close to legs. Feel deep hamstring stretch, maintain neutral spine throughout. ${P1_LOAD_LOWER}`, sets: 3, reps: "10", rest: 90, rir: "3", type: "exercise", group: "scW1D1", superset_label: null },

      // ── ACCESSORIES ──
      { name: "D1. Step-Up (bodyweight or light dumbbell)", detail: "Tempo 2-0-1-1. Step onto box, driving through heel of lead leg. Control the descent — do not drop. Focus on stability and single-leg strength.", sets: 3, reps: "10 each side", rest: 60, rir: "3", type: "exercise", group: "haW1D1", superset_label: null },
      { name: "D2. Lying Leg Curl (machine)", detail: "Tempo 2-0-1-1. Squeeze hamstrings hard at peak contraction. Control the eccentric — 2s lowering. Avoid using momentum or lifting hips off pad.", sets: 3, reps: "10", rest: 60, rir: "3", type: "exercise", group: "hbW1D1", superset_label: null },
      { name: "D3. Standing Calf Raise", detail: "Tempo 2-0-1-2. Rise fully onto the balls of your feet, pause 2s at the top, lower with control into a full stretch at the bottom. Full ROM is critical.", sets: 3, reps: "15", rest: 45, rir: "3", type: "exercise", group: "calfW1D1", superset_label: null },
      { name: "D4. Reverse Lunge (bodyweight or light dumbbell)", detail: "Tempo 2-0-1-1. Step back, lower until rear knee nearly touches floor, drive through front heel to return. Builds unilateral capacity for Bulgarian split squats in Phase 2.", sets: 2, reps: "10 each side", rest: 60, rir: "3", type: "exercise", group: "luW1D1", superset_label: null },

      // ── CORE (superset) ──
      { name: "E1. Dead Bug", detail: "Keep lower back pressed into the floor throughout. Extend opposite arm and leg slowly, maintaining full core tension. Exhale as you extend.", sets: 3, reps: "8 each side", rest: 0, rir: null, type: "exercise", group: "coreW1D1", superset_label: "Core Circuit" },
      { name: "E2. Glute Bridge Hold", detail: "Lift hips to form a straight line from knees to shoulders. Squeeze glutes maximally and hold. Do not let hips sag — if they drop, the set is over.", sets: 3, reps: "30s", rest: 60, rir: null, type: "exercise", group: "coreW1D1", superset_label: "Core Circuit" },

      // ── CONDITIONING / FINISHER (always last) ──
      { name: "F. Incline Treadmill Walk", detail: "10–15 minutes at 3.0–3.5 mph, 8–12% incline. Heart rate 125–145 BPM (Zone 2), RPE 4–5. Maintain conversational pace. Nasal breathing preferred. This goes AFTER all lifting is complete.", sets: 1, reps: "10-15 min", rest: null, rir: null, type: "conditioning", group: "cfW1D1", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 2: Upper Body — Horizontal Push
    // ════════════════════════════════════════════
    const day2 = [
      // ── WARM-UP / ACTIVATION (7 min) ──
      { name: "W1. Shoulder CARs", detail: "Controlled Articular Rotations — move each arm through its full pain-free range slowly: forward, up, behind, down. No compensation from the trunk. Builds shoulder health and proprioception.", sets: 2, reps: "5 each arm", rest: 0, rir: null, type: "warmup", group: "wuW1D2", superset_label: null },
      { name: "W2. Wall Slide", detail: "Stand with back, head, and arms flat against wall. Slide arms up overhead maintaining contact. If arms come off the wall, that's your current range — don't force it.", sets: 2, reps: "10", rest: 0, rir: null, type: "warmup", group: "wuW1D2", superset_label: null },
      { name: "W3. Band Pull-Apart", detail: "Keep arms straight, pull band apart by squeezing shoulder blades together. Control the return — don't let the band snap back.", sets: 3, reps: "12", rest: 30, rir: null, type: "warmup", group: "wuW1D2", superset_label: null },
      { name: "W4. Push-Up (slow eccentric)", detail: "Descend for 3 full seconds, then push up explosively. If needed, perform on knees or with hands elevated. Primes pressing pattern.", sets: 2, reps: "6", rest: 45, rir: null, type: "warmup", group: "wuW1D2", superset_label: null },

      // ── POWER / PLYOMETRIC ──
      { name: "A1. Medicine Ball Rotational Throw", detail: "Stand sideways to a solid wall. Load the trail hip, rotate through the core, throw with hip and trunk rotation. Catch on the rebound. Reset fully between reps. Develops transverse plane power.", sets: 3, reps: "5 each side", rest: 60, rir: null, type: "exercise", group: "ppW1D2", superset_label: null },

      // ── PRIMARY COMPOUND ──
      { name: "B1. Dumbbell Bench Press", detail: `Tempo 3-1-1-0. Retract and depress shoulder blades, maintain slight arch in lower back, control the 3s eccentric, pause 1s at chest, drive dumbbells up and slightly inward. ${P1_LOAD_UPPER} ${RIR_NOTE}`, sets: 3, reps: "8", rest: 90, rir: "3", type: "exercise", group: "psW1D2", superset_label: null },
      { name: "B1 — Coaching Note", detail: "Think 'bend the bar' with the dumbbells — externally rotate at the shoulder to protect the joint. Shoulder blades should be pinched together the entire set. If you lose that retraction, the set is over.", sets: null, reps: null, rest: null, rir: null, type: "note", group: "psW1D2", superset_label: null },

      // ── SECONDARY COMPOUND ──
      { name: "C1. Seated Cable Row", detail: `Tempo 3-0-1-1. Sit tall, pull handle towards lower abdomen, squeezing shoulder blades together at peak contraction. Control the stretch on the return — 3s eccentric. ${P1_LOAD_UPPER}`, sets: 3, reps: "10", rest: 90, rir: "3", type: "exercise", group: "scW1D2", superset_label: null },

      // ── ACCESSORIES ──
      { name: "D1. Incline Dumbbell Press", detail: "Tempo 2-0-1-1. 30° incline. Focus on upper chest contraction and controlled movement. Don't flare elbows past 45°.", sets: 3, reps: "10", rest: 60, rir: "3", type: "exercise", group: "haW1D2", superset_label: null },
      { name: "D2. Face Pull (cable)", detail: "Tempo 2-0-1-1. Pull rope towards face, externally rotating shoulders at the top. Focus on squeezing upper back and rear delts. Keep elbows high.", sets: 3, reps: "12", rest: 60, rir: "3", type: "exercise", group: "hbW1D2", superset_label: null },
      { name: "D3. DB Lateral Raise", detail: "Tempo 2-0-1-1. Slight forward lean, raise dumbbells to shoulder height leading with elbows. Control the descent — no swinging. Builds medial delt width.", sets: 3, reps: "12-15", rest: 45, rir: "3", type: "exercise", group: "latW1D2", superset_label: null },
      { name: "D4. Cable Woodchop (high-to-low)", detail: "NOT IN PHASE 1 — placeholder removed. Woodchops begin Phase 2.", sets: null, reps: null, rest: null, rir: null, type: "note", group: "skipW1D2", superset_label: null },
      { name: "D4. Dumbbell Curl", detail: "Tempo 2-0-1-1. Full ROM — extend completely at the bottom, supinate at the top. No body English. Builds bicep volume for joint health.", sets: 2, reps: "10", rest: 45, rir: "3", type: "exercise", group: "biW1D2", superset_label: null },

      // ── CORE (superset) ──
      { name: "E1. Forearm Plank", detail: "Maintain a straight line from head to heels. Brace core as if about to be punched. If hips sag, the set is done.", sets: 3, reps: "30s", rest: 0, rir: null, type: "exercise", group: "coreW1D2", superset_label: "Core Circuit" },
      { name: "E2. Pallof Press", detail: "Stand perpendicular to cable, press handle straight out, resisting rotation. Maintain stable hips and shoulders. Anti-rotation strength.", sets: 3, reps: "10 each side", rest: 60, rir: null, type: "exercise", group: "coreW1D2", superset_label: "Core Circuit" },

      // ── INJURY RESILIENCE FINISHER ──
      { name: "F1. Band Pull-Apart (rear delt finisher)", detail: "2 sets of 15. Zero ego, feel the rear delt and external rotators contract. Never skip this — it's your shoulder insurance policy. RPE 5–6.", sets: 2, reps: "15", rest: 30, rir: null, type: "exercise", group: "finW1D2", superset_label: null },

      // ── CONDITIONING / FINISHER ──
      { name: "F2. Assault Bike or Rower (easy)", detail: "8–10 minutes. Heart rate 125–145 BPM (Zone 2), RPE 4–5. Conversational pace. Nasal breathing. Flush metabolites from the pressing session.", sets: 1, reps: "8-10 min", rest: null, rir: null, type: "conditioning", group: "cfW1D2", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 3: Zone 2 / Active Recovery
    // ════════════════════════════════════════════
    const day3 = [
      // ── WARM-UP / MOBILITY (8-10 min) ──
      { name: "W1. Full Body Mobility Sequence", detail: "Perform gentle, controlled movements targeting hips, ankles, thoracic spine, and shoulders. Move through various ranges of motion. 8–10 minutes.", sets: 1, reps: "8-10 min", rest: null, rir: null, type: "warmup", group: "wuW1D3", superset_label: null },

      // ── CORE / CORRECTIVE ──
      { name: "E1. Dead Bug", detail: "Keep lower back pressed into floor. Extend opposite arm and leg slowly. This is the ONLY day Dead Bug appears. Focus on quality anti-extension.", sets: 2, reps: "8 each side", rest: 60, rir: null, type: "exercise", group: "coreW1D3", superset_label: null },
      { name: "E2. Bird Dog", detail: "Start on all fours, extend opposite arm and leg while keeping core stable and hips level. Avoid rotation.", sets: 2, reps: "10 each side", rest: 60, rir: null, type: "exercise", group: "coreW1D3", superset_label: null },
      { name: "E3. Side Plank", detail: "Support body on forearm and side of foot, maintaining a straight line from head to heels. Brace core.", sets: 2, reps: "20s each side", rest: 60, rir: null, type: "exercise", group: "coreW1D3", superset_label: null },

      // ── ZONE 2 CONDITIONING ──
      { name: "F. Zone 2 — Incline Treadmill Walk or Light Jog", detail: "25–35 minutes. Heart rate 125–145 BPM (Zone 2), RPE 4–5. Maintain conversational pace. Prioritize nasal breathing throughout. This is aerobic base building — do NOT push intensity.", sets: 1, reps: "25-35 min", rest: null, rir: null, type: "conditioning", group: "cfW1D3", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 4: Lower Body — Hinge Emphasis
    // ════════════════════════════════════════════
    const day4 = [
      // ── WARM-UP / ACTIVATION (8 min) ──
      { name: "W1. Foam Roller Thoracic Extension", detail: "Lie face-up with foam roller across mid-back. Gently extend over the roller, hold 2s. Mobilizes thoracic spine.", sets: 1, reps: "45s", rest: 0, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W2. Cat-Cow", detail: "On all fours, inhale to arch (cow), exhale to round (cat). Move slowly through full spinal range.", sets: 1, reps: "10", rest: 0, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W3. Kneeling Hip Flexor Stretch", detail: "Half-kneeling, rear knee on pad. Posterior pelvic tilt, lean forward gently. Hold. Releases psoas for better hip extension.", sets: 1, reps: "60s each side", rest: 0, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W4. Hip 90/90 Stretch", detail: "Sit with both legs at 90°. Rotate torso over front shin. Opens hip rotation.", sets: 1, reps: "60s each side", rest: 30, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W5. Banded Good Morning", detail: "Band around neck and under feet. Push hips back with slight knee bend, feel hamstring stretch, squeeze glutes to stand. Primes hinge pattern.", sets: 2, reps: "10", rest: 45, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W6. Single-Leg Glute Bridge", detail: "One foot planted, opposite knee pulled to chest. Drive hips up through the planted foot. 2s hold at top. Activates glutes unilaterally.", sets: 2, reps: "8 each side", rest: 45, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },
      { name: "W7. Band Pull-Apart", detail: "Keep arms straight, squeeze shoulder blades together at end range. Maintains shoulder health on non-upper days.", sets: 2, reps: "15", rest: 30, rir: null, type: "warmup", group: "wuW1D4", superset_label: null },

      // ── POWER / PLYOMETRIC ──
      { name: "A1. Kettlebell Swing", detail: "Hinge explosively, project the bell with hip drive — not arm pull. Snap hips forward, squeeze glutes at the top. Bell should float, not be muscled up. Full recovery between sets.", sets: 3, reps: "8", rest: 60, rir: null, type: "exercise", group: "ppW1D4", superset_label: null },

      // ── PRIMARY COMPOUND ──
      { name: "B1. Dumbbell Romanian Deadlift", detail: `Tempo 3-1-1-0. Push hips back, keep dumbbells close to legs, feel deep hamstring stretch. Pause 1s at the bottom (just below knee), then drive hips forward. Maintain neutral spine throughout — if back rounds, the weight is too heavy. ${P1_LOAD_LOWER} ${RIR_NOTE}`, sets: 3, reps: "8", rest: 90, rir: "3", type: "exercise", group: "psW1D4", superset_label: null },
      { name: "B1 — Coaching Note", detail: "The RDL is a HIP exercise, not a back exercise. Initiate by pushing your hips back as if closing a car door with your butt. The dumbbells travel straight down — they don't drift forward.", sets: null, reps: null, rest: null, rir: null, type: "note", group: "psW1D4", superset_label: null },

      // ── SECONDARY COMPOUND ──
      { name: "C1. Goblet Squat", detail: `Tempo 3-0-1-1. Cross-pattern squat on hinge day provides quad stimulus without fatiguing the posterior chain. Chest proud, knees out, full depth. ${P1_LOAD_LOWER}`, sets: 3, reps: "10", rest: 90, rir: "3", type: "exercise", group: "scW1D4", superset_label: null },

      // ── ACCESSORIES ──
      { name: "D1. Walking Lunge (dumbbell)", detail: "Tempo 2-0-1-1. Controlled steps, rear knee nearly touches floor, drive through front heel. Builds unilateral strength and hip stability.", sets: 3, reps: "10 each side", rest: 60, rir: "3", type: "exercise", group: "haW1D4", superset_label: null },
      { name: "D2. Lying Leg Curl (machine)", detail: "Tempo 2-0-1-1. Squeeze hamstrings hard at peak contraction. Control the eccentric. Avoid lifting hips off pad.", sets: 3, reps: "10", rest: 60, rir: "3", type: "exercise", group: "hbW1D4", superset_label: null },
      { name: "D3. Standing Calf Raise", detail: "Tempo 2-0-1-2. Rise fully, pause 2s at top, lower with control into full stretch. Full ROM.", sets: 3, reps: "15", rest: 45, rir: "3", type: "exercise", group: "calfW1D4", superset_label: null },

      // ── CORE (superset) ──
      { name: "E1. Dead Bug", detail: "Lower back pressed into floor. Extend opposite arm and leg slowly. Exhale on extension.", sets: 3, reps: "8 each side", rest: 0, rir: null, type: "exercise", group: "coreW1D4", superset_label: "Core Circuit" },
      { name: "E2. Glute Bridge Hold", detail: "Hips up, straight line knees to shoulders, squeeze glutes maximally and hold.", sets: 3, reps: "30s", rest: 60, rir: null, type: "exercise", group: "coreW1D4", superset_label: "Core Circuit" },

      // ── CONDITIONING / FINISHER (always last) ──
      { name: "F. Incline Treadmill Walk", detail: "10–15 minutes at 3.0–3.5 mph, 8–12% incline. Heart rate 125–145 BPM (Zone 2), RPE 4–5. Conversational pace. Goes AFTER all lifting.", sets: 1, reps: "10-15 min", rest: null, rir: null, type: "conditioning", group: "cfW1D4", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 5: Upper Body — Vertical Push
    // ════════════════════════════════════════════
    const day5 = [
      // ── WARM-UP / ACTIVATION (7 min) ──
      { name: "W1. Shoulder CARs", detail: "Controlled Articular Rotations — move each arm through its full pain-free range slowly. No trunk compensation.", sets: 2, reps: "5 each arm", rest: 0, rir: null, type: "warmup", group: "wuW1D5", superset_label: null },
      { name: "W2. Wall Slide", detail: "Stand with back, head, and arms flat against wall. Slide arms up overhead maintaining wall contact throughout.", sets: 2, reps: "10", rest: 0, rir: null, type: "warmup", group: "wuW1D5", superset_label: null },
      { name: "W3. Band Pull-Apart", detail: "Squeeze shoulder blades together at end range. Primes upper back for pressing stability.", sets: 2, reps: "15", rest: 30, rir: null, type: "warmup", group: "wuW1D5", superset_label: null },
      { name: "W4. Band Shoulder Dislocate", detail: "Wide grip on band, pass overhead and behind back in a smooth arc. Move slowly and only through pain-free range.", sets: 2, reps: "8", rest: 30, rir: null, type: "warmup", group: "wuW1D5", superset_label: null },

      // ── POWER / PLYOMETRIC ──
      { name: "A1. Medicine Ball Slam", detail: "Reach ball overhead, brace core, slam with full-body force. Reset fully between reps. Develops upper body power and rate of force development.", sets: 3, reps: "5", rest: 60, rir: null, type: "exercise", group: "ppW1D5", superset_label: null },

      // ── PRIMARY COMPOUND ──
      { name: "B1. Standing Dumbbell Overhead Press", detail: `Tempo 3-1-1-0. Standing requires full-body bracing — feet hip-width, brace core as if about to be punched, press directly overhead without lumbar hyperextension. 3s eccentric, 1s pause at shoulders, press up. ${P1_LOAD_UPPER} ${RIR_NOTE}`, sets: 3, reps: "8", rest: 90, rir: "3", type: "exercise", group: "psW1D5", superset_label: null },
      { name: "B1 — Coaching Note", detail: "The standing press is a full-body lift. If your ribs flare or lower back arches, the weight is too heavy. Think 'push yourself away from the dumbbells' — your feet should be driving into the floor.", sets: null, reps: null, rest: null, rir: null, type: "note", group: "psW1D5", superset_label: null },

      // ── SECONDARY COMPOUND ──
      { name: "C1. Lat Pulldown (wide grip)", detail: `Tempo 3-0-1-1. Pull to upper chest, squeeze lats at bottom, control the stretch on return. Lean back slightly, don't yank. ${P1_LOAD_UPPER}`, sets: 3, reps: "10", rest: 90, rir: "3", type: "exercise", group: "scW1D5", superset_label: null },

      // ── ACCESSORIES ──
      { name: "D1. Dumbbell Arnold Press", detail: "Tempo 2-0-1-1. Start palms facing you, rotate as you press up. Hits all three delt heads through a full ROM.", sets: 3, reps: "10", rest: 60, rir: "3", type: "exercise", group: "haW1D5", superset_label: null },
      { name: "D2. Single-Arm Dumbbell Row", detail: "Tempo 2-0-1-1. Hand and knee on bench, pull dumbbell to hip, squeeze lat at top. Full stretch at bottom.", sets: 3, reps: "10 each side", rest: 60, rir: "3", type: "exercise", group: "hbW1D5", superset_label: null },
      { name: "D3. Cable Lateral Raise", detail: "Tempo 2-0-1-1. Cross-body cable setup, raise to shoulder height leading with elbow. Constant tension from the cable.", sets: 3, reps: "12-15", rest: 45, rir: "3", type: "exercise", group: "latW1D5", superset_label: null },

      // ── CORE (superset) ──
      { name: "E1. Dead Bug", detail: "Lower back pressed into floor. Opposite arm/leg extension. Quality reps only.", sets: 3, reps: "8 each side", rest: 0, rir: null, type: "exercise", group: "coreW1D5", superset_label: "Core Circuit" },
      { name: "E2. Glute Bridge Hold", detail: "Hips up, squeeze glutes, hold steady. If hips drop, set is over.", sets: 3, reps: "30s", rest: 60, rir: null, type: "exercise", group: "coreW1D5", superset_label: "Core Circuit" },

      // ── INJURY RESILIENCE FINISHER ──
      { name: "F1. Face Pull (cable, rear delt finisher)", detail: "2 sets of 15. Zero ego, feel the rear delt and external rotators. Shoulder insurance — never skip this.", sets: 2, reps: "15", rest: 30, rir: null, type: "exercise", group: "finW1D5", superset_label: null },

      // ── CONDITIONING / FINISHER (always last) ──
      { name: "F2. Assault Bike or Rower (easy)", detail: "8–10 minutes. Heart rate 125–145 BPM (Zone 2), RPE 4–5. Conversational pace. Goes AFTER all lifting and accessories are complete.", sets: 1, reps: "8-10 min", rest: null, rir: null, type: "conditioning", group: "cfW1D5", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 6: Saturday Athletic Conditioning
    // ════════════════════════════════════════════
    const day6 = [
      // ── WARM-UP (5 min) ──
      { name: "W1. Jump Rope or Light Jog", detail: "2–3 minutes easy effort to elevate heart rate. RPE 3–4.", sets: 1, reps: "2-3 min", rest: 0, rir: null, type: "warmup", group: "wuW1D6", superset_label: null },
      { name: "W2. Bodyweight Squat", detail: "Full depth, controlled pace. Wake up the legs.", sets: 1, reps: "10", rest: 0, rir: null, type: "warmup", group: "wuW1D6", superset_label: null },
      { name: "W3. Band Pull-Apart", detail: "Shoulder activation.", sets: 1, reps: "15", rest: 0, rir: null, type: "warmup", group: "wuW1D6", superset_label: null },
      { name: "W4. Inchworm", detail: "Walk hands out to plank, walk feet to hands. Full body primer.", sets: 1, reps: "5", rest: 30, rir: null, type: "warmup", group: "wuW1D6", superset_label: null },

      // ── EMOM CONDITIONING ──
      { name: "A. EMOM 28 (7 rounds × 4 minutes)", detail: "Heart rate target: 145–165 BPM (RPE 6–7). Perform the prescribed work at the top of each minute, rest the remainder of that minute. Maintain consistent effort — if you can't complete the work within the minute, reduce reps by 1–2.\n\nMinute 1 (Engine): Assault Bike 12 calories\nMinute 2 (Strength): Kettlebell Swing × 10\nMinute 3 (Engine): Row 12 calories\nMinute 4 (Gymnastics): Box Step-Up × 8 total (alternating)", sets: 7, reps: "4-min rounds", rest: null, rir: null, type: "conditioning", group: "emomW1D6", superset_label: null },

      // ── COOLDOWN ──
      { name: "B. Cooldown Walk", detail: "5 minutes easy pace. Heart rate below 130 BPM. Nasal breathing.", sets: 1, reps: "5 min", rest: null, rir: null, type: "conditioning", group: "cdW1D6", superset_label: null },
    ];

    // ════════════════════════════════════════════
    // WEEK 1 — DAY 7: Full Rest
    // ════════════════════════════════════════════
    const day7 = [
      { name: "Rest Day", detail: "Complete rest. No training. Prioritize sleep (7–9 hours), hydration (½ bodyweight in oz), and family time. Walk if you want — nothing structured.", sets: null, reps: null, rest: null, rir: null, type: "rest", group: "restW1D7", superset_label: null },
    ];

    // ── Apply updates ──
    const weekData = [
      { dayNumber: 1, exercises: day1, label: "Day 1 — Lower Body: Squat Emphasis" },
      { dayNumber: 2, exercises: day2, label: "Day 2 — Upper Body: Horizontal Push Emphasis" },
      { dayNumber: 3, exercises: day3, label: "Day 3 — Zone 2 / Active Recovery" },
      { dayNumber: 4, exercises: day4, label: "Day 4 — Lower Body: Hinge Emphasis" },
      { dayNumber: 5, exercises: day5, label: "Day 5 — Upper Body: Vertical Push Emphasis" },
      { dayNumber: 6, exercises: day6, label: "Day 6 — Saturday Athletic Conditioning" },
      { dayNumber: 7, exercises: day7, label: "Day 7 — Rest" },
    ];

    const results: string[] = [];

    for (const wd of weekData) {
      // Remove the D4 placeholder note on Day 2
      const cleanExercises = wd.exercises.filter(
        (e: any) => !(e.type === "note" && e.detail?.includes("NOT IN PHASE 1"))
      );

      const { error } = await supabase
        .from("program_days")
        .update({ exercises: cleanExercises, label: wd.label })
        .eq("program_id", PROGRAM_ID)
        .eq("day_number", wd.dayNumber);

      if (error) {
        results.push(`Day ${wd.dayNumber}: FAILED — ${error.message}`);
      } else {
        results.push(`Day ${wd.dayNumber}: Updated (${cleanExercises.length} items)`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, week: 1, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[REWRITE-REBUILD-W1] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
