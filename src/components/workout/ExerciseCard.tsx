import { useState } from "react";
import { Dumbbell, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface ExerciseCardProps {
  name: string;
  detail: string;
  sets?: number | null;
  reps?: number | null;
  rir?: string | null;
  onTap: () => void;
}

/** Extract intensity techniques from the detail string */
function parseIntensity(detail: string): { tags: string[]; cue: string } {
  const tags: string[] = [];
  let cue = detail;

  // Tempo — matches "tempo 3111", "3-1-1 tempo", "3-1-1-0 tempo", "Tempo: 3111", "2-0-2 tempo"
  const tempo4Match = cue.match(/tempo\s*[:=]?\s*(\d{4})/i);
  const tempoDashMatch = !tempo4Match && cue.match(/(\d-\d-\d(?:-\d)?)\s*tempo/i);
  const tempoLeadMatch = !tempo4Match && !tempoDashMatch && cue.match(/tempo\s*[:=]?\s*(\d-\d-\d(?:-\d)?)/i);
  if (tempo4Match) {
    tags.push(`Tempo ${tempo4Match[1]}`);
    cue = cue.replace(tempo4Match[0], "");
  } else if (tempoDashMatch) {
    tags.push(`Tempo ${tempoDashMatch[1]}`);
    cue = cue.replace(tempoDashMatch[0], "");
  } else if (tempoLeadMatch) {
    tags.push(`Tempo ${tempoLeadMatch[1]}`);
    cue = cue.replace(tempoLeadMatch[0], "");
  }
  // Also catch standalone eccentric cues like "3s eccentric"
  const eccentricMatch = !tempo4Match && !tempoDashMatch && !tempoLeadMatch && cue.match(/(\d)s\s*eccentric/i);
  if (eccentricMatch) {
    tags.push(`Tempo ${eccentricMatch[1]}s ecc`);
  }

  // RPE
  const rpeMatch = cue.match(/RPE\s*(\d[\d.-]*)/i);
  if (rpeMatch) {
    tags.push(`RPE ${rpeMatch[1]}`);
    cue = cue.replace(rpeMatch[0], "");
  }

  // AMRAP
  if (/amrap/i.test(cue)) {
    tags.push("AMRAP");
  }

  // EMOM
  if (/emom/i.test(cue)) {
    tags.push("EMOM");
  }

  // Drop set
  if (/drop\s*set/i.test(cue)) {
    tags.push("Drop Set");
    cue = cue.replace(/drop\s*set/gi, "");
  }

  // Myo-reps
  if (/myo[\s-]*rep/i.test(cue)) {
    tags.push("Myo-Reps");
    cue = cue.replace(/myo[\s-]*reps?/gi, "");
  }

  // Rest-pause
  if (/rest[\s-]*pause/i.test(cue)) {
    tags.push("Rest-Pause");
    cue = cue.replace(/rest[\s-]*pause/gi, "");
  }

  // Pause reps (e.g. "pause at bottom", "2s pause at chest", "1s pause", "2s pause") — but not rest-pause
  if (/(?<!rest[\s-])pause\s*(rep|at|for|\d)/i.test(cue) || /\d+s\s*pause/i.test(cue) || /\bpaused\b/i.test(cue)) {
    tags.push("Pause");
  }

  // Cluster sets
  if (/cluster/i.test(cue)) {
    tags.push("Cluster");
  }

  // Strip the leading "NxN —" pattern (e.g. "4×6 — ") since sets/reps are shown separately
  cue = cue.replace(/^\d+\s*[×x]\s*\d+\s*[—–-]\s*/i, "");

  // Strip "[DELOAD]" tag (already shown in day label)
  cue = cue.replace(/\[deload\]/gi, "").trim();

  // Strip RIR from cue text since it's shown as a prop
  cue = cue.replace(/,?\s*RIR\s*\d[\d-]*/gi, "").trim();

  // Clean up dangling punctuation
  cue = cue.replace(/^[,—–\-\s]+/, "").replace(/[,—–\-\s]+$/, "").trim();

  // Collapse double spaces
  cue = cue.replace(/\s{2,}/g, " ");

  return { tags, cue };
}

export function ExerciseCard({ name, detail, sets, reps, rir, onTap }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { tags, cue } = parseIntensity(detail);
  const normalizedRir = rir ? String(rir).replace(/^RIR\s*/i, "").trim() : null;

  // Extract inline "N × REPS" from cue when reps prop is null (express / adjusted workouts)
  let displayReps: string | null = reps ? `${reps} reps` : null;
  let cleanCue = cue;
  if (!reps) {
    const inlineMatch = cleanCue.match(/^(\d+)\s*[×x]\s*([^\s.]+(?:\s*\([^)]+\))?)\.\s*/i);
    if (inlineMatch) {
      const inlineSets = parseInt(inlineMatch[1]);
      const inlineReps = inlineMatch[2];
      if (!sets || sets === inlineSets) {
        displayReps = inlineReps;
      } else {
        displayReps = inlineReps;
      }
      cleanCue = cleanCue.replace(inlineMatch[0], "").trim();
    }
  }

  const parts = [
    sets ? `${sets} sets` : null,
    displayReps ? `${displayReps}` : null,
    normalizedRir ? `RIR ${normalizedRir}` : null,
  ].filter(Boolean);
  const setsRepsText = parts.length > 0 ? parts.join(" × ") : null;

  const handleToggleExpand = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden transition-all">
      <button onClick={onTap}
        className="w-full flex items-center gap-3 p-3 hover:border-primary/40 active:scale-[0.98] transition-all text-left">
        <div className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground leading-tight">{name}</p>
          {(setsRepsText || tags.length > 0) && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {setsRepsText && (
                <span className="text-xs font-semibold text-primary/70">{setsRepsText}</span>
              )}
              {tags.map((tag) => (
                <span key={tag} className="text-[9px] font-bold text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      {cleanCue && (
        <div className="px-3 pb-2">
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            {expanded ? (
              <span className="whitespace-pre-wrap leading-relaxed">{cleanCue}</span>
            ) : (
              <span className="truncate">{cleanCue}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
