import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface WarmUpSectionProps {
  exercises: { name: string; detail: string }[];
  programWarmUps?: { name: string; detail: string }[];
}

interface WarmUpMove {
  name: string;
  detail: string;
}

// ── Warm-up detection (exported for use in Index) ──

const WARMUP_KEYWORDS = [
  "warm", "activation", "foam roll", "cat-cow", "cat cow", "hip circle",
  "hip 90/90", "hip flexor stretch", "kneeling hip flexor",
  "shoulder car", "wall slide", "band pull-apart", "band pull apart",
  "arm circle", "scapular push", "dead bug", "glute bridge hold",
  "ankle dorsiflexion", "knee-to-wall", "thoracic extension",
  "thoracic rotation", "world.s greatest stretch", "inchworm",
  "leg swing", "deep bodyweight squat hold", "walking lunge.*twist",
  "cuban rotation", "mobility", "dynamic stretch",
  "banded ankle", "t-spine", "bird.dog", "90.90",
];

export function isWarmUpExercise(
  name: string,
  supersetLabel?: string | null,
  type?: string | null,
): boolean {
  // Coach explicitly marked it as warm-up.
  if (type === "warmup") return true;
  // Working sets (supersets, labeled A1/F1/CORE1 blocks) and post-workout
  // conditioning/mobility blocks stay in the workout where they were written.
  if (supersetLabel) return false;
  if (type === "conditioning") return false;
  if (/^[A-Za-z]{1,4}\d+[\.\:\)\-]/.test(name.trim())) return false;
  const lower = name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '').toLowerCase();
  return WARMUP_KEYWORDS.some((kw) => new RegExp(kw, "i").test(lower));
}

// ── Pattern detection (fallback auto-generation) ──

const PUSH_KEYWORDS = ["bench", "press", "push-up", "pushup", "dip", "incline", "decline", "close-grip", "machine press", "chest press"];
const PULL_KEYWORDS = ["row", "pull-up", "pullup", "pulldown", "lat pull", "face pull", "cable row", "seal row", "chin-up", "chinup"];
const SQUAT_KEYWORDS = ["squat", "leg press", "lunge", "split squat", "step-up", "hack squat", "goblet", "front squat", "leg extension"];
const HINGE_KEYWORDS = ["deadlift", "rdl", "romanian", "good morning", "hip thrust", "hip hinge", "block pull", "leg curl", "hamstring", "glute bridge", "ghd", "nordic", "ghr"];
const SHOULDER_KEYWORDS = ["shoulder", "lateral raise", "rear delt", "overhead", "ohp", "military", "arnold", "face pull", "upright row"];
const CORE_KEYWORDS = ["ab", "core", "plank", "crunch", "pallof", "anti-rotation", "woodchop", "dead bug", "hollow", "rollout"];
const CARRY_KEYWORDS = ["carry", "farmer", "suitcase", "waiter", "sled"];

function detectPatterns(exercises: { name: string }[]) {
  const names = exercises.map((e) => e.name.toLowerCase());
  const has = (keywords: string[]) => names.some((n) => keywords.some((k) => n.includes(k)));
  return {
    push: has(PUSH_KEYWORDS),
    pull: has(PULL_KEYWORDS),
    squat: has(SQUAT_KEYWORDS),
    hinge: has(HINGE_KEYWORDS),
    shoulder: has(SHOULDER_KEYWORDS),
    core: has(CORE_KEYWORDS),
    carry: has(CARRY_KEYWORDS),
  };
}

function generateWarmUp(p: ReturnType<typeof detectPatterns>): WarmUpMove[] {
  // Structure: pulse raiser → 2 mobility → 2 activation → ramp-up sets. 6–7 moves, ~8 min.
  const hasLower = p.squat || p.hinge;
  const hasUpper = p.push || p.pull || p.shoulder;
  const moves: WarmUpMove[] = [
    { name: hasLower ? "Bike or Rower — Easy" : "Rower or Jump Rope — Easy", detail: "3 min — build to a light sweat" },
  ];

  // Mobility (2)
  const mobility: WarmUpMove[] = [];
  if (p.squat) mobility.push({ name: "Deep Bodyweight Squat Hold", detail: "30s — elbows push knees out, chest tall" });
  if (p.hinge) mobility.push({ name: "Cat-Cow", detail: "8 slow reps — move through the whole spine" });
  if (hasLower) mobility.push({ name: "Hip 90/90 Switches", detail: "6 each side — open the hips" });
  if (p.push || p.shoulder) mobility.push({ name: "Wall Slides", detail: "10 reps — arms overhead, ribs down" });
  if (hasUpper) mobility.push({ name: "Open Book Thoracic Rotation", detail: "6 each side — upper back rotation" });
  if (!mobility.length) mobility.push({ name: "World's Greatest Stretch", detail: "4 each side — hips, hamstrings, upper back" }, { name: "Inchworms", detail: "5 reps — full body" });
  moves.push(...mobility.slice(0, 2));

  // Activation (2)
  const activation: WarmUpMove[] = [];
  if (p.hinge) activation.push({ name: "Glute Bridge", detail: "2 × 10 with 2s squeeze — wake up the glutes" });
  if (p.squat) activation.push({ name: "Bodyweight Reverse Lunge", detail: "6 each leg — controlled" });
  if (p.pull) activation.push({ name: "Band Pull-Aparts", detail: "15 reps — upper back and rear shoulders" });
  if (p.push) activation.push({ name: "Scapular Push-Ups", detail: "10 reps — push the floor away at the top" });
  if (p.shoulder && !p.push) activation.push({ name: "Band External Rotation", detail: "12 each arm — rotator cuff" });
  if (p.core || p.carry || activation.length < 2) activation.push({ name: "Dead Bugs", detail: "6 each side — slow, lower back flat" });
  moves.push(...activation.slice(0, 2));

  moves.push({
    name: "Ramp-Up Sets",
    detail: "First lift: empty bar or light × 8, ~50% × 5, ~70% × 3, ~85% × 1 — then start working sets",
  });
  return moves;
}

export function WarmUpSection({ exercises, programWarmUps }: WarmUpSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const warmUp = useMemo(() => {
    // Use program-embedded warm-ups if available
    // Use the coach-written warm-up only when it's a real routine (3+ moves)
    if (programWarmUps && programWarmUps.length >= 3) {
      return programWarmUps.map((w) => ({
        name: w.name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, ''),
        detail: w.detail,
      }));
    }
    // Fallback: auto-generate based on exercise patterns
    const patterns = detectPatterns(exercises);
    return generateWarmUp(patterns);
  }, [exercises, programWarmUps]);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-foreground">Warm-Up</span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {warmUp.length} moves · ~{Math.max(5, Math.round(warmUp.length * 1.25))} min
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {warmUp.map((move, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <span className="text-xs font-black text-primary w-5 text-right mt-0.5">{i + 1}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{move.name}</p>
                <p className="text-xs text-muted-foreground">{move.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
