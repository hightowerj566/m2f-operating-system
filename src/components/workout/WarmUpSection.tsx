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

export function isWarmUpExercise(name: string): boolean {
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
  const moves: WarmUpMove[] = [];
  const hasLower = p.squat || p.hinge;
  const hasUpper = p.push || p.pull || p.shoulder;

  moves.push({ name: "Jumping Jacks", detail: "30 seconds — elevate heart rate" });

  if (hasLower) {
    moves.push({ name: "Hip 90/90 Switches", detail: "8 each side — open hip capsule" });
    moves.push({ name: "Hip Circles (Standing)", detail: "10 each direction — lubricate hip joint" });
  }

  if (p.squat) {
    moves.push({ name: "Deep Bodyweight Squat Hold", detail: "30s — sit in bottom position, drive knees out" });
    moves.push({ name: "Walking Lunges w/ Twist", detail: "6 each leg — hip flexors + thoracic rotation" });
    moves.push({ name: "Leg Swings (Front-to-Back)", detail: "10 each leg — dynamic hip flexor/hamstring stretch" });
  }

  if (p.hinge) {
    moves.push({ name: "Cat-Cow", detail: "10 reps — spinal flexion/extension, wake up posterior chain" });
    moves.push({ name: "Single-Leg RDL (bodyweight)", detail: "8 each leg — activate glutes + hamstrings" });
    moves.push({ name: "Glute Bridge Hold", detail: "2 × 10s — fire glutes before hinging" });
    if (!p.squat) {
      moves.push({ name: "Leg Swings (Side-to-Side)", detail: "10 each leg — adductor mobility" });
    }
  }

  if (p.push || p.shoulder) {
    moves.push({ name: "Arm Circles", detail: "10 forward + 10 backward — shoulder capsule warm-up" });
    moves.push({ name: "Scapular Push-Ups", detail: "10 reps — protract/retract, activate serratus" });
    moves.push({ name: "Wall Slides", detail: "10 reps — scapular upward rotation + shoulder mobility" });
  }

  if (p.pull) {
    moves.push({ name: "Band Pull-Aparts", detail: "15 reps — rear delt + mid-trap activation" });
    moves.push({ name: "Scapular Pull-Up Hangs", detail: "2 × 5 reps — depress/retract scapulae for pulling" });
    if (!p.push && !p.shoulder) {
      moves.push({ name: "Arm Circles", detail: "10 forward + 10 backward — shoulder capsule warm-up" });
    }
  }

  if (p.shoulder) {
    moves.push({ name: "Cuban Rotations (light)", detail: "10 reps — external rotation + rotator cuff prep" });
  }

  if (p.core || hasLower) {
    moves.push({ name: "Dead Bugs", detail: "8 each side — brace core, anti-extension" });
  }

  if (p.carry) {
    moves.push({ name: "Pallof Press Hold", detail: "2 × 10s each side — anti-rotation core brace" });
  }

  if (!hasUpper && !hasLower) {
    moves.push({ name: "Inchworms", detail: "6 reps — full body flow" });
    moves.push({ name: "World's Greatest Stretch", detail: "5 each side — hip, thoracic, hamstring" });
  }

  moves.push({ name: "Light Set / Empty Bar", detail: "1–2 sets × 8–10 reps of your first exercise at 40–50% — groove the movement pattern" });

  return moves;
}

export function WarmUpSection({ exercises, programWarmUps }: WarmUpSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const warmUp = useMemo(() => {
    // Use program-embedded warm-ups if available
    if (programWarmUps && programWarmUps.length > 0) {
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
            {warmUp.length} moves · ~5 min
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
