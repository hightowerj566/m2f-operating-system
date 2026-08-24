/**
 * JACKED + CAPABLE  v3.0-expanded  ->  v4.1-cardiocore
 *
 * Deterministic, idempotent transform. No LLM, no randomness, no timestamps.
 * Running it twice on the same input produces byte-identical output.
 *
 * Usage:
 *   bun scripts/transform-jacked-capable-v4.ts [inputPath] [outDir]
 *
 * Defaults:
 *   inputPath = ./JACKED-CAPABLE-24-week-expanded.json
 *   outDir    = dirname(inputPath)
 */

import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// ────────────────────────────────────────────────────────────── types (loose)

type Any = Record<string, any>;

// ────────────────────────────────────────────────────────────── io

const inputPath = resolve(process.argv[2] ?? "JACKED-CAPABLE-24-week-expanded.json");
if (!existsSync(inputPath)) {
  fail(`Input file not found: ${inputPath}`);
}
const outDir = resolve(process.argv[3] ?? dirname(inputPath));

const src: Any = JSON.parse(readFileSync(inputPath, "utf8"));

function fail(msg: string): never {
  console.error(`\n✖ FAIL: ${msg}\n`);
  process.exit(1);
}

// ────────────────────────────────────────────────────────────── helpers

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Split an exercise name into every movement it can resolve to. */
function options(name: string): string[] {
  return name
    .split(/\s+or\s+|\//gi)
    .map((s) => s.replace(/,.*$/, ""))
    .map(norm)
    .filter(Boolean);
}

function appendNote(ex: Any, line: string) {
  const existing = typeof ex.note === "string" ? ex.note.trim() : "";
  if (existing.includes(line)) return; // idempotent
  ex.note = existing ? `${existing} ${line}` : line;
}

const liftingBlockCodes = new Set(["A", "B", "C"]);

// ────────────────────────────────────────────────────────────── 1. leg curls

const SEATED = "Seated Leg Curl";
const LYING = "Lying Leg Curl";
const DAY3_NOTE =
  "Machine fallback is deliberately set to the variation Day 4 does not use, so the week never runs the same leg curl twice. Do not swap it.";

let legCurlFixes = 0;

function fixLegCurls(week: Any) {
  const days: Any[] = week.days ?? [];
  const day3 = days.find((d) => d.day === 3);
  const day4 = days.find((d) => d.day === 4);
  if (!day3) return;

  let day4Uses: "seated" | "lying" | null = null;
  for (const block of day4?.blocks ?? []) {
    for (const ex of block.exercises ?? []) {
      const n = norm(String(ex.name ?? ""));
      if (n.includes("seated leg curl")) day4Uses = "seated";
      else if (n.includes("lying leg curl")) day4Uses = day4Uses ?? "lying";
    }
  }

  // Day 4 seated -> Day 3 offers lying. Otherwise Day 3 offers seated.
  const fallback = day4Uses === "seated" ? LYING : SEATED;
  const newName = `Nordic Curl or ${fallback}`;

  for (const block of day3.blocks ?? []) {
    for (const ex of block.exercises ?? []) {
      const n = norm(String(ex.name ?? ""));
      if (!n.startsWith("nordic curl")) continue;
      const oldName = String(ex.name);
      ex.name = newName;
      appendNote(ex, DAY3_NOTE);
      if (block.role_split && typeof block.role_split === "object") {
        syncRoleSplit(block.role_split, oldName, newName);
      }
      legCurlFixes++;
    }
  }
}

function syncRoleSplit(node: any, oldName: string, newName: string) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === "string") {
        if (node[i].includes(oldName)) node[i] = node[i].split(oldName).join(newName);
        else if (/nordic curl or/i.test(node[i])) node[i] = node[i].replace(/Nordic Curl or [A-Za-z ]*Leg Curl/i, newName);
      } else if (node[i] && typeof node[i] === "object") syncRoleSplit(node[i], oldName, newName);
    }
    return;
  }
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string") {
        if (v.includes(oldName)) node[k] = v.split(oldName).join(newName);
        else if (/nordic curl or/i.test(v)) node[k] = v.replace(/Nordic Curl or [A-Za-z ]*Leg Curl/i, newName);
      } else if (v && typeof v === "object") syncRoleSplit(v, oldName, newName);
    }
  }
}

// ────────────────────────────────────────────────────────────── 2. strip core

/**
 * Trunk flexion / anti-extension / anti-rotation work that moves to Wednesday.
 * Copenhagen Plank is adductor work and is explicitly NOT in this list.
 */
const CORE_MATCHERS: Array<{ label: string; test: (n: string) => boolean }> = [
  { label: "Cable Crunch", test: (n) => n.includes("cable crunch") },
  { label: "Hanging Leg Raise", test: (n) => n.includes("hanging leg raise") || n.includes("hanging knee raise") || n.includes("toes to bar") },
  { label: "Weighted Decline Sit-up", test: (n) => n.includes("decline sit up") || n.includes("decline situp") },
  { label: "Ab Wheel", test: (n) => n.includes("ab wheel") },
  { label: "Pallof Press", test: (n) => n.includes("pallof") },
  { label: "Stir-the-Pot", test: (n) => n.includes("stir the pot") },
  { label: "Long-Lever Plank / Body Saw", test: (n) => n.includes("body saw") || n.includes("long lever plank") },
  { label: "Landmine Rotation", test: (n) => n.includes("landmine rotation") },
  { label: "Anti-Rotation Chop", test: (n) => n.includes("anti rotation") || n.includes("cable chop") },
];

const isCore = (name: string) => {
  const n = norm(name);
  if (n.includes("copenhagen")) return false; // adductor work, stays
  return CORE_MATCHERS.some((m) => m.test(n));
};

const removalCounts: Record<string, number> = {};

function stripCore(day: Any) {
  for (const block of day.blocks ?? []) {
    if (!liftingBlockCodes.has(String(block.code))) continue;
    if (!Array.isArray(block.exercises)) continue;
    block.exercises = block.exercises.filter((ex: Any) => {
      const name = String(ex.name ?? "");
      if (!isCore(name)) return true;
      const label = CORE_MATCHERS.find((m) => m.test(norm(name)))?.label ?? name;
      removalCounts[label] = (removalCounts[label] ?? 0) + 1;
      return false;
    });
  }
}

// ────────────────────────────────────────────────────────────── 3. Wednesday

type CoreMove = { name: string; sets: number; reps: string; fn: string; note: string };

const CORE_ROTATION: Record<number, CoreMove[]> = {
  1: [
    { name: "Ab Wheel Rollout", sets: 3, reps: "8-10", fn: "anti-extension", note: "Ribs down, glutes squeezed. Roll only as far as you can go without the low back arching." },
    { name: "Cable Crunch", sets: 3, reps: "12-15", fn: "loaded flexion", note: "Hips stay fixed. Flex the spine to shorten the abs — this is not a hip hinge." },
    { name: "Half-Kneeling Pallof Press", sets: 3, reps: "12/side", fn: "anti-rotation / anti-lateral", note: "Resist the pull. Slow press out, slow return, no hip shift." },
    { name: "Hanging Leg Raise", sets: 3, reps: "10-12", fn: "hip flexion + posterior tilt", note: "Finish each rep by tilting the pelvis under. No swinging." },
  ],
  2: [
    { name: "Long-Lever Plank / Body Saw", sets: 3, reps: "8-10", fn: "anti-extension", note: "Elbows further forward than a normal plank. Short range, high tension." },
    { name: "Weighted Decline Sit-up", sets: 3, reps: "10-12", fn: "loaded flexion", note: "Control the descent. Hold the plate at the chest, not overhead." },
    { name: "Suitcase Carry", sets: 3, reps: "40m/side", fn: "anti-rotation / anti-lateral", note: "Stay square. Do not lean away from the load to make it easier." },
    { name: "Hanging Knee Raise, posterior tilt", sets: 3, reps: "12-15", fn: "hip flexion + posterior tilt", note: "The rep is the pelvic tilt at the top, not the knee lift." },
  ],
  3: [
    { name: "Ab Wheel Rollout", sets: 4, reps: "8-10", fn: "anti-extension", note: "Extend the range from meso 1 only if the low back stays neutral." },
    { name: "Cable Crunch", sets: 4, reps: "10-12", fn: "loaded flexion", note: "Heavier than meso 1. Same fixed hips, same full contraction." },
    { name: "Half-Kneeling Landmine Rotation", sets: 3, reps: "10/side", fn: "anti-rotation / anti-lateral", note: "Rotate from the trunk, not the arms. Front knee stays stacked." },
    { name: "Hanging Leg Raise", sets: 3, reps: "12", fn: "hip flexion + posterior tilt", note: "Add reps before you add load." },
  ],
  4: [
    { name: "Stir-the-Pot", sets: 3, reps: "10/dir", fn: "anti-extension", note: "Small circles, braced ribcage. Both directions counts as one set." },
    { name: "Weighted Decline Sit-up", sets: 3, reps: "12", fn: "loaded flexion", note: "Same load as meso 2, two more reps. Progress by reps first." },
    { name: "Cable Anti-Rotation Chop", sets: 3, reps: "12/side", fn: "anti-rotation / anti-lateral", note: "Arms are a lever, the trunk does the work. No hip rotation." },
    { name: "Toes-to-Bar or Hanging Leg Raise", sets: 3, reps: "8-12", fn: "hip flexion + posterior tilt", note: "Take toes-to-bar only if it is strict. Kipping is not core work." },
  ],
  5: [
    { name: "Ab Wheel Rollout", sets: 4, reps: "10", fn: "anti-extension", note: "Peak volume block. Stop the set the moment the low back gives." },
    { name: "Cable Crunch", sets: 4, reps: "12-15", fn: "loaded flexion", note: "Back to higher reps at the heaviest load you can still control." },
    { name: "Suitcase Carry", sets: 3, reps: "40m/side", fn: "anti-rotation / anti-lateral", note: "Heavier than meso 2. Same posture standard." },
    { name: "Hanging Leg Raise", sets: 4, reps: "12", fn: "hip flexion + posterior tilt", note: "Fourth set added. Cut it before you cut form." },
  ],
  6: [
    { name: "Long-Lever Plank / Body Saw", sets: 3, reps: "10", fn: "anti-extension", note: "Expression block — hold quality over hold length." },
    { name: "Cable Crunch", sets: 3, reps: "12", fn: "loaded flexion", note: "Volume pulled back. Keep the load, drop the set." },
    { name: "Half-Kneeling Pallof Press", sets: 3, reps: "12/side", fn: "anti-rotation / anti-lateral", note: "Back where the program started, with a far stronger trunk." },
    { name: "Hanging Leg Raise", sets: 3, reps: "12", fn: "hip flexion + posterior tilt", note: "Strict, controlled, no swing. Finish the block clean." },
  ],
};

const Z2_BY_MESO: Record<number, string> = {
  1: "35-40 min",
  2: "40-45 min",
  3: "35-40 min",
  4: "40-45 min",
  5: "40-50 min",
  6: "35-40 min",
};

const Z2_MODALITIES = ["Bike", "Rower", "Incline treadmill walk", "Light ruck", "Easy swim"];

const HARD_CONSTRAINTS = [
  "Core to 1-2 RIR. Not an AMRAP, not for time.",
  "No conditioning finisher, no metabolic circuit. The moment Wednesday becomes hard, the 2/1/2/2 structure has been wasted.",
  "If beat up, cut core to two movements and keep the Zone 2. Never the reverse.",
];

const SEQUENCING_RULE =
  "Core comes before cardio. Zone 2 is low enough intensity that a pre-fatigued trunk does not compromise it, and core done after 40 minutes of aerobic work is core done badly.";

function buildCardioDay(week: Any): Any {
  const meso: number = week.mesocycle;
  const deload: boolean = week.is_deload === true;
  const rotation = CORE_ROTATION[meso];
  if (!rotation) fail(`No core rotation defined for mesocycle ${meso} (week ${week.week_number})`);

  const chosen = deload ? rotation.slice(0, 2) : rotation;
  const exercises = chosen.map((m) => ({
    name: m.name,
    sets: deload ? 2 : m.sets,
    reps: m.reps,
    rir: deload ? "3-4" : "1-2",
    rest: "60-75s",
    function: m.fn,
    note: m.note,
  }));
  const weeklyCoreSets = exercises.reduce((s, e) => s + e.sets, 0);

  const z2Duration = deload ? "25-30 min" : Z2_BY_MESO[meso];

  return {
    day: "W",
    name: "Cardio + Core",
    purpose: deload
      ? "Deload Wednesday. Keep the aerobic habit and the trunk pattern alive at a fraction of the cost, so week 1 of the next mesocycle starts fresh."
      : "One dedicated slot for aerobic base and the entire week's trunk work, placed between two lifting blocks so it costs nothing and starves nothing.",
    sequencing_rule: SEQUENCING_RULE,
    blocks: [
      {
        code: "CORE",
        label: "CORE (do this first, while fresh)",
        weekly_core_sets: weeklyCoreSets,
        exercises,
      },
      {
        code: "Z2",
        label: "ZONE 2",
        prescription: `${z2Duration} continuous Zone 2`,
        target: "Conversational pace. Roughly 60-70% max HR — you can speak in full sentences the whole way.",
        modalities: Z2_MODALITIES,
        note: "Pick the modality that leaves your legs freshest for Thursday. Rotate it week to week if you want; the dose is what matters, not the machine.",
        impact_rule: "Low impact only. Running is not permitted on Wednesday — save it for the optional Saturday LISS.",
      },
    ],
    hard_constraints: HARD_CONSTRAINTS,
    floor_session_20_min: {
      description: "The version you do when the day fell apart.",
      work: [
        `${exercises[0].name} 2 sets`,
        `${exercises[1].name} 2 sets`,
        "10-12 min Zone 2, any low-impact modality",
      ],
      rule: "Done beats skipped. This still counts as the week's core.",
    },
    time_options: {
      "20_min": "Floor session: two core movements at 2 sets each + 10-12 min Zone 2.",
      "35_min": "Full core block + 20-25 min Zone 2.",
      "60_min": `Full core block + ${z2Duration} Zone 2 + 5-10 min easy cooldown or mobility.`,
    },
    week_number: week.week_number,
    mesocycle: meso,
    is_deload: deload,
    calendar_label: `Week ${week.week_number} — Wednesday — Cardio + Core`,
  };
}

// ────────────────────────────────────────────────────────────── 4. re-timing

const TIME_OPTIONS_NOTE =
  "Core is no longer inside these options — it lives on Wednesday. A short week trims lifting volume without starving the trunk.";

const CORE_TOKEN_RE =
  /\b(ab wheel(?: rollout)?|cable crunch(?:es)?|hanging (?:leg|knee) raises?|toes[- ]to[- ]bar|weighted decline sit[- ]?ups?|pallof press(?:es)?|stir[- ]the[- ]pot|body saw)\b/gi;

function scrubCoreFromString(s: string): string {
  if (typeof s !== "string") return s;
  let out = s.replace(CORE_TOKEN_RE, "");
  out = out
    .replace(/\s*\+\s*(?=\+|,|\.|;|$)/g, "")
    .replace(/,\s*(?=,|\.|;|$)/g, "")
    .replace(/\(\s*[x×]?\s*\d*\s*(?:sets?)?\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/^[\s,+]+/, "")
    .replace(/[\s,+]+$/, "")
    .trim();
  return out;
}

function blockIsEmpty(day: Any, code: string): boolean {
  const b = (day.blocks ?? []).find((x: Any) => String(x.code) === code);
  if (!b) return true;
  return !Array.isArray(b.exercises) || b.exercises.length === 0;
}

function retimeDay(day: Any) {
  const to = day.time_options ?? (day.time_options = {});
  to["30_min"] = "A (3 sets) + B primary pair only + D (5 min). Warm-up cut to 3 min, ramp only.";

  if (blockIsEmpty(day, "C") && typeof to["60_min"] === "string") {
    to["60_min"] = to["60_min"]
      .replace(/\s*\+\s*C\b(?:\s*\([^)]*\))?/g, "")
      .replace(/\bC\s*\+\s*/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  to.note = TIME_OPTIONS_NOTE;

  if (typeof day.optional_top_up_75_min === "string") {
    day.optional_top_up_75_min = scrubCoreFromString(day.optional_top_up_75_min);
  } else if (day.optional_top_up_75_min && typeof day.optional_top_up_75_min === "object") {
    const node = day.optional_top_up_75_min;
    if (Array.isArray(node)) {
      day.optional_top_up_75_min = node
        .map((v: any) => (typeof v === "string" ? scrubCoreFromString(v) : v))
        .filter((v: any) => v !== "");
    } else {
      for (const k of Object.keys(node)) {
        if (typeof node[k] === "string") node[k] = scrubCoreFromString(node[k]);
        else if (Array.isArray(node[k]))
          node[k] = node[k]
            .map((v: any) => (typeof v === "string" ? scrubCoreFromString(v) : v))
            .filter((v: any) => v !== "");
      }
    }
  }
}

// ────────────────────────────────────────────────────────────── 5. week shape

const WEEKLY_PATTERN = {
  monday: "Day 1",
  tuesday: "Day 2",
  wednesday: "Cardio + Core — 35-50 min Zone 2 low impact plus the week's entire trunk block",
  thursday: "Day 3",
  friday: "Day 4",
  saturday: "Optional short LISS, 20-30 min, running permitted, skip freely",
  sunday: "Off. Fully off.",
  structure: "2 on / cardio + core / 2 on / 2 off",
};

const OPTIONAL_SATURDAY_LISS = {
  duration: "20-30 min",
  intensity: "Zone 2, low end. Deliberately easier and shorter than Wednesday.",
  modalities: ["Easy run", "Walk", "Ruck", "Bike", "Row", "Hike"],
  impact_rule: "This is the only slot in the week where running is permitted.",
  rules: [
    "Never longer than 30 minutes. Want more aerobic work? Lengthen Wednesday instead.",
    "Never a workout. No intervals, no hills for time, no carries.",
    "Skip it in any deload week, any deficit block, and any week where 4 of 4 lifting days left you beat up.",
    "If Saturday LISS starts costing Monday's squat, it is gone for the rest of the mesocycle.",
  ],
};

const NEW_INTERRUPTION = {
  cardio_core_day:
    "Wednesday is the first thing to cut in a bad week, not the last. Three days available → run Days 1, 3, 4 and drop Wednesday. Only two days available → keep Wednesday; aerobic base and trunk work are cheaper to recover from than a fourth lifting day.",
  saturday_liss:
    "Optional means optional. Missing it is not a missed session and does not count against the 3-of-4.",
};

const NEW_STANDING_RULES = [
  "Core is Wednesday's job and Wednesday's alone. Do not add ab work back onto lifting days — that is how a recovery day quietly becomes a fifth session.",
  "Wednesday stays easy. Zone 2 means conversational. If you can't hold a conversation you're not doing Zone 2, you're doing a workout you didn't program.",
  "Saturday LISS is optional and shorter than Wednesday on purpose. Two full off days is the point of this layout — protect them.",
  "No exercise repeats inside a week. Patterns may repeat across days only when the resistance profile differs.",
];

// ────────────────────────────────────────────────────────────── run transform

const out: Any = src;

if (!Array.isArray(out.weeks) || out.weeks.length !== 24) {
  fail(`Expected 24 weeks, found ${Array.isArray(out.weeks) ? out.weeks.length : "none"}`);
}

for (const week of out.weeks) {
  if (!Array.isArray(week.days) || week.days.length !== 4) {
    fail(`Week ${week.week_number}: expected 4 days, found ${week.days?.length}`);
  }
  fixLegCurls(week);
  for (const day of week.days) {
    stripCore(day);
    retimeDay(day);
  }
  week.cardio_day = buildCardioDay(week);
}

out.weekly_pattern = WEEKLY_PATTERN;
out.optional_saturday_liss = OPTIONAL_SATURDAY_LISS;

out.interruption_protocol = { ...(out.interruption_protocol ?? {}), ...NEW_INTERRUPTION };

const baseRules: string[] = Array.isArray(out.standing_rules) ? out.standing_rules.slice() : [];
out.standing_rules = [...baseRules.filter((r) => !NEW_STANDING_RULES.includes(r)), ...NEW_STANDING_RULES];

// Rebuild flat arrays from the edited weeks.
out.sessions = out.weeks.flatMap((w: Any) => w.days);
out.cardio_sessions = out.weeks.map((w: Any) => w.cardio_day);

out.version = "4.1-cardiocore";
out.description =
  "24-week strength and hypertrophy program on a 2 on / cardio + core / 2 on / 2 off week. Four primary lifting days (Mon, Tue, Thu, Fri), a dedicated Wednesday Cardio + Core day carrying the entire week's trunk work plus 35-50 min low-impact Zone 2, and an optional 20-30 min Saturday LISS. All dedicated core work has been removed from the lifting days.";

const totalRemoved = Object.values(removalCounts).reduce((a, b) => a + b, 0);

out.changelog_v4 = [
  {
    change: "leg_curl_collision_fix",
    detail:
      "Day 3's 'Nordic Curl or <machine>' fallback is now set per week to the leg curl variation Day 4 does not use, so the machine fallback can never duplicate Day 4.",
    count: legCurlFixes,
  },
  {
    change: "core_removed_from_lifting_days",
    detail:
      "All trunk flexion / anti-extension / anti-rotation work removed from blocks A, B and C on all four lifting days. Copenhagen Plank retained (adductor work). Face Pull and DB Upright Row retained in block C.",
    count: totalRemoved,
    breakdown: removalCounts,
  },
  {
    change: "cardio_core_day_added",
    detail:
      "One Wednesday 'Cardio + Core' day per week at weeks[].cardio_day. Core block rotates by mesocycle across four functions; Zone 2 duration scales by mesocycle. Core before cardio.",
    count: out.cardio_sessions.length,
  },
  {
    change: "time_options_retimed",
    detail:
      "30_min changed to 'A (3 sets) + B primary pair only + D (5 min). Warm-up cut to 3 min, ramp only.' 60_min drops block C where C is now empty. Relocated core movements scrubbed from optional_top_up_75_min.",
    count: 96,
  },
  {
    change: "week_restructured",
    detail:
      "weekly_pattern rewritten to 2 on / cardio + core / 2 on / 2 off. Added optional_saturday_liss, two interruption_protocol entries, and four standing rules.",
    count: 1,
  },
];

out.schema_notes = {
  "weeks[].days":
    "Exactly 4 entries per week, the primary lifting days. `day` is always an int 1-4. The Wednesday session is NOT in this array — mixed types here break downstream parsers.",
  "weeks[].cardio_day":
    "Sibling key to `days`. A single Cardio + Core day object with `day: \"W\"`, a CORE block and a Z2 block.",
  sessions: "Flat array of all 96 primary lifting day objects, rebuilt from weeks[].days after editing.",
  cardio_sessions: "Flat array of the 24 Wednesday Cardio + Core day objects, one per week.",
};

// ────────────────────────────────────────────────────────────── validation

const failures: string[] = [];
const lines: string[] = [];

// 1 + 2 — duplicates and option collisions
let dupCount = 0;
let collisionCount = 0;

for (const week of out.weeks) {
  const allDays: Any[] = [...week.days, week.cardio_day];
  const exactSeen = new Map<string, number>();
  const optionSeen = new Map<string, string[]>();

  for (const day of allDays) {
    for (const block of day.blocks ?? []) {
      for (const ex of block.exercises ?? []) {
        const raw = String(ex.name ?? "");
        if (!raw) continue;
        const key = norm(raw);
        exactSeen.set(key, (exactSeen.get(key) ?? 0) + 1);
        for (const opt of options(raw)) {
          const arr = optionSeen.get(opt) ?? [];
          arr.push(raw);
          optionSeen.set(opt, arr);
        }
      }
    }
  }

  for (const [k, n] of exactSeen) {
    if (n > 1) {
      dupCount += n - 1;
      failures.push(`Week ${week.week_number}: exact duplicate "${k}" ×${n}`);
    }
  }
  for (const [k, srcs] of optionSeen) {
    if (srcs.length > 1) {
      collisionCount += srcs.length - 1;
      failures.push(`Week ${week.week_number}: option collision "${k}" reachable via ${srcs.join(" | ")}`);
    }
  }
}

lines.push(`1. Exact-name duplicates within a week: ${dupCount}`);
lines.push(`2. Option collisions within a week:      ${collisionCount}`);

// 3 — days array shape
let shapeOk = true;
for (const week of out.weeks) {
  if (week.days.length !== 4) {
    shapeOk = false;
    failures.push(`Week ${week.week_number}: days.length = ${week.days.length}`);
  }
  for (const d of week.days) {
    if (!Number.isInteger(d.day) || d.day < 1 || d.day > 4) {
      shapeOk = false;
      failures.push(`Week ${week.week_number}: bad day value ${JSON.stringify(d.day)}`);
    }
  }
}
lines.push(`3. weeks[].days shape (4 int days each):  ${shapeOk ? "OK" : "BROKEN"}`);

// 4 — flat array lengths
if (out.sessions.length !== 96) failures.push(`sessions.length = ${out.sessions.length}, expected 96`);
if (out.cardio_sessions.length !== 24) failures.push(`cardio_sessions.length = ${out.cardio_sessions.length}, expected 24`);
lines.push(`4. sessions = ${out.sessions.length}, cardio_sessions = ${out.cardio_sessions.length}`);

// 5 — core sets per week
let coreSetsOk = true;
for (const week of out.weeks) {
  const coreBlock = week.cardio_day.blocks.find((b: Any) => b.code === "CORE");
  const sets = coreBlock.exercises.reduce((s: number, e: Any) => s + e.sets, 0);
  const expected = week.is_deload ? 4 : 12;
  if (sets !== expected || coreBlock.weekly_core_sets !== sets) {
    coreSetsOk = false;
    failures.push(`Week ${week.week_number}: core sets = ${sets}, expected ${expected}`);
  }
}
lines.push(`5. Core sets per week (12 normal / 4 deload): ${coreSetsOk ? "OK" : "BROKEN"}`);

// ────────────────────────────────────────────────────────────── write output

const fullPath = join(outDir, "JACKED-CAPABLE-24-week-v4.1.json");
const litePath = join(outDir, "JACKED-CAPABLE-24-week-v4.1-lite.json");

const { sessions: _s, cardio_sessions: _c, ...liteBase } = out;
const lite = { ...liteBase, schema_notes: { ...out.schema_notes, lite: "sessions and cardio_sessions omitted — they duplicate weeks[]." } };

writeFileSync(fullPath, JSON.stringify(out), "utf8");
writeFileSync(litePath, JSON.stringify(lite), "utf8");

// 6 — both files parse, report sizes
const kb = (p: string) => (statSync(p).size / 1024).toFixed(1);
try {
  JSON.parse(readFileSync(fullPath, "utf8"));
  JSON.parse(readFileSync(litePath, "utf8"));
} catch (e: any) {
  failures.push(`Output failed to re-parse: ${e.message}`);
}
const liteKb = parseFloat(kb(litePath));
lines.push(`6. ${fullPath} — ${kb(fullPath)} KB`);
lines.push(`   ${litePath} — ${liteKb} KB${liteKb > 550 ? "  ⚠ over 550 KB target" : ""}`);

// ────────────────────────────────────────────────────────────── report

console.log("\nJACKED + CAPABLE  v3.0-expanded → v4.1-cardiocore");
console.log("─".repeat(60));
console.log(`Leg curl fallbacks rewritten: ${legCurlFixes}`);
console.log(`Core exercises relocated:     ${totalRemoved}  ${JSON.stringify(removalCounts)}`);
console.log(`Cardio + Core days created:   ${out.cardio_sessions.length}`);
console.log("─".repeat(60));
for (const l of lines) console.log(l);
console.log("─".repeat(60));

if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const f of failures.slice(0, 60)) console.error(`  • ${f}`);
  if (failures.length > 60) console.error(`  … and ${failures.length - 60} more`);
  fail("Validation did not pass.");
}

console.log("✓ All checks passed.\n");
