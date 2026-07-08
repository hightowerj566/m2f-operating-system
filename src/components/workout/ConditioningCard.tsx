import { Zap, Timer, ChevronRight } from "lucide-react";

interface ConditioningCardProps {
  name: string;
  detail: string;
  sets: number | null;
  reps: string | null;
  rest?: number | null;
  onTap: () => void;
}

/** Multi-exercise conditioning block (EMOM / AMRAP) */
interface ConditioningBlockCardProps {
  type: "EMOM" | "AMRAP" | "Conditioning";
  duration: string;
  exercises: { label: string; text: string }[];
  notes?: string;
  onTap: () => void;
}

/** Parse conditioning-specific display values from reps string */
function parseConditioningMeta(reps: string | null, sets: number | null, rest?: number | null) {
  const meta: { label: string; value: string }[] = [];

  if (sets && sets > 1) {
    meta.push({ label: "Rounds", value: `${sets}` });
  }

  if (reps) {
    // Time-based: "30s all-out", "20 min", "30s moderate-hard", "30s hard"
    const timeMatch = reps.match(/^(\d+\s*(?:s|sec|min))\s*(.*)/i);
    if (timeMatch) {
      meta.push({ label: "Work", value: timeMatch[1].replace(/\s+/g, '') });
      if (timeMatch[2]) {
        meta.push({ label: "Effort", value: timeMatch[2].trim() });
      }
    }
    // Distance: "40m", "25m ea", "30m"
    else if (/^\d+m/i.test(reps)) {
      meta.push({ label: "Distance", value: reps });
    }
    // Rep count: "6 each", "10", "5 each"
    else {
      meta.push({ label: "Reps", value: reps });
    }
  }

  if (rest != null && rest > 0) {
    meta.push({ label: "Rest", value: rest >= 60 ? `${Math.round(rest / 60)}min` : `${rest}s` });
  }

  return meta;
}

/** Detect whether an exercise is a conditioning/finisher type */
export function isConditioningExercise(name: string, rir: string | null | undefined, reps: string | null): boolean {
  const lowerName = name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '').toLowerCase();

  // ── Exclusions: core / strength exercises that happen to use time-based reps ──
  const coreExclusions = [
    "plank", "dead bug", "bird dog", "pallof", "hollow hold",
    "ab wheel", "ab rollout", "crunch", "sit-up", "situp",
    "leg raise", "hanging raise", "v-up", "flutter kick",
    "russian twist", "woodchop", "side bend",
    "copenhagen", "suitcase hold",
    "rotational slam", "med ball rotational",
  ];
  if (coreExclusions.some(kw => lowerName.includes(kw))) return false;

  // ── Explicit conditioning exercises — checked BEFORE RIR so Day 6 items aren't excluded ──
  const conditioningKeywords = [
    "assault bike", "bike sprint", "row sprint", "treadmill",
    "zone 2", "farmer carry", "farmer walk", "farmers walk", "farmers carry",
    "suitcase carry", "overhead carry",
    "kb snatch", "kb clean", "clean pull", "hang high pull",
    "med ball slam", "db hang clean", "kb goblet squat",
    "kb front squat", "kb sumo squat",
    "sled", "prowler", "battle rope", "jump rope",
    "box jump", "burpee", "mountain climber",
    "rowing", "ski erg", "stairmaster",
    "saturday conditioning", "sunday conditioning",
  ];

  if (conditioningKeywords.some(kw => lowerName.includes(kw))) return true;

  // EMOM / AMRAP / Tabata / circuit / finisher / interval / conditioning keywords in name
  if (/emom|amrap|tabata|circuit|finisher|interval|conditioning|metcon|cardio|sprint/i.test(lowerName)) return true;

  // Exercises with a numeric RIR are strength work, not conditioning
  if (rir && /^\d/.test(rir)) return false;

  // Time-based reps with N/A rir = conditioning
  if (rir === "N/A" || rir === null) {
    if (reps && /^\d+\s*(s|sec|min)/i.test(reps)) return true;
    // Distance-based
    if (reps && /^\d+m/i.test(reps)) return true;
  }

  return false;
}

/** Check if an exercise name represents an EMOM or AMRAP block */
export function getConditioningBlockType(name: string): "EMOM" | "AMRAP" | null {
  const clean = name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');
  if (/emom/i.test(clean)) return "EMOM";
  if (/amrap/i.test(clean)) return "AMRAP";
  return null;
}

/** Parse an EMOM/AMRAP detail string into structured exercises */
export function parseConditioningBlock(name: string, detail: string): {
  type: "EMOM" | "AMRAP";
  duration: string;
  exercises: { label: string; text: string }[];
  notes: string;
} | null {
  const blockType = getConditioningBlockType(name);
  if (!blockType) return null;

  const clean = name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');

  // Extract duration from name like "EMOM 12 Minutes", "AMRAP 8 Minutes", "EMOM 10 min"
  const durMatch = clean.match(/(\d+)\s*(?:min(?:utes?)?)/i);
  const duration = durMatch ? `${durMatch[1]} min` : "";

  // Parse the detail into individual exercises
  // Formats:
  //   "Minute 1: 12 KB Swings\nMinute 2: 8 Push-Ups\n..."
  //   "• 5 Pull-Ups\n• 10 Push-Ups\n..."
  //   Numbered: "1- 12 pull ups\n2- 10 KBS\n..."
  const lines = detail.split(/\n/).map(l => l.trim()).filter(Boolean);
  const exercises: { label: string; text: string }[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    // "Minute N: ..." format
    const minuteMatch = line.match(/^Minute\s*(\d+)\s*:\s*(.+)/i);
    if (minuteMatch) {
      exercises.push({ label: minuteMatch[1], text: minuteMatch[2].trim() });
      continue;
    }
    // Bullet "• text" format
    const bulletMatch = line.match(/^[•·\-]\s*(.+)/);
    if (bulletMatch) {
      exercises.push({ label: `${exercises.length + 1}`, text: bulletMatch[1].trim() });
      continue;
    }
    // "N- text" or "N. text" format
    const numMatch = line.match(/^(\d+)\s*[-.)]\s*(.+)/);
    if (numMatch) {
      exercises.push({ label: numMatch[1], text: numMatch[2].trim() });
      continue;
    }
    // "As many rounds as possible:" header — skip
    if (/as many rounds/i.test(line)) continue;
    // Everything else is a note
    noteLines.push(line);
  }

  return {
    type: blockType,
    duration,
    exercises,
    notes: noteLines.join(" ").trim(),
  };
}

export function ConditioningBlockCard({ type, duration, exercises, notes, onTap }: ConditioningBlockCardProps) {
  return (
    <button onClick={onTap}
      className="w-full bg-accent/30 border border-accent/50 rounded-xl p-4 hover:border-primary/40 active:scale-[0.98] transition-all text-left">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent/50 flex-shrink-0 flex items-center justify-center">
          {type === "EMOM" ? (
            <Timer className="w-5 h-5 text-primary" />
          ) : (
            <Zap className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded uppercase">{type}</span>
            {duration && <span className="text-sm font-bold text-primary">{duration}</span>}
          </div>
        </div>
      </div>

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div className="space-y-1.5 ml-1">
          {exercises.map((ex, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs font-bold text-primary/70 w-4 text-right flex-shrink-0">{ex.label}.</span>
              <span className="text-sm text-foreground leading-snug">{ex.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {notes && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{notes}</p>
      )}
    </button>
  );
}

export function ConditioningCard({ name, detail, sets, reps, rest, onTap }: ConditioningCardProps) {
  // Check if this is an EMOM/AMRAP block that should render as a block card
  const block = parseConditioningBlock(name, detail);
  if (block) {
    return (
      <ConditioningBlockCard
        type={block.type}
        duration={block.duration}
        exercises={block.exercises}
        notes={block.notes}
        onTap={onTap}
      />
    );
  }

  const meta = parseConditioningMeta(reps, sets, rest);

  // Clean detail: strip leading "NxN —" and clean up
  let cue = detail
    .replace(/^\d+\s*[×x]\s*[^\s.]+(?:\s*\([^)]+\))?\.\s*/i, "")
    .replace(/,?\s*RIR\s*N\/A/gi, "")
    .replace(/^[,—–\-\s]+/, "")
    .replace(/[,—–\-\s]+$/, "")
    .trim();

  return (
    <button onClick={onTap}
      className="w-full flex items-start gap-3 bg-accent/30 border border-accent/50 rounded-xl p-3 hover:border-primary/40 active:scale-[0.98] transition-all text-left">
      <div className="w-12 h-12 rounded-lg bg-accent/50 flex-shrink-0 flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground leading-tight">{name}</p>

        {/* Structured meta pills */}
        {meta.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {meta.map((m) => (
              <div key={m.label} className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{m.label}</span>
                <span className="text-xs font-semibold text-primary">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Coaching cue */}
        {cue && (
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{cue}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
    </button>
  );
}
