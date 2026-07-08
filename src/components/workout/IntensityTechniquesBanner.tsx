import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";

interface IntensityTechniquesBannerProps {
  exercises: { name: string; detail: string }[];
}

interface Technique {
  key: string;
  label: string;
  emoji: string;
  summary: string;
  match: (text: string) => string | null; // returns specific instance or null
}

const TECHNIQUES: Technique[] = [
  {
    key: "tempo",
    label: "Tempo",
    emoji: "⏱️",
    summary: "Controlled rep speed. Read as Eccentric / Bottom / Concentric / Top. E.g. 4011 = 4s down, 0s pause at bottom, 1s up, 1s hold at top.",
    match: (text) => {
      // Match "tempo 4011", "tempo 4-0-1-1", "3-1-1 tempo", "3-1-2" patterns
      const m = text.match(/tempo\s*[:=]?\s*(\d{4})/i) ||
                text.match(/tempo\s*[:=]?\s*(\d[-]\d[-]\d[-]\d)/i) ||
                text.match(/(\d[-]\d[-]\d[-]\d)\s*tempo/i) ||
                text.match(/(\d[-]\d[-]\d)\s*(?:presses|curls|pulls|rows|extensions|raises|flyes)/i) ||
                text.match(/tempo\s*[:=]?\s*(\d[-]\d[-]\d)/i);
      if (m) {
        const digits = m[1].replace(/-/g, "").split("");
        if (digits.length === 4) {
          return `Tempo ${m[1]} — ${digits[0]}s down, ${digits[1]}s bottom, ${digits[2]}s up, ${digits[3]}s top`;
        } else if (digits.length === 3) {
          return `Tempo ${m[1]} — ${digits[0]}s eccentric, ${digits[1]}s pause, ${digits[2]}s concentric`;
        }
      }
      return null;
    },
  },
  {
    key: "dropset",
    label: "Drop Set",
    emoji: "⬇️",
    summary: "Reduce weight immediately after failure and continue repping. Extends time under tension without rest.",
    match: (text) => /drop\s*set/i.test(text) ? "Drop Set detected" : null,
  },
  {
    key: "myoreps",
    label: "Myo-Reps",
    emoji: "🔁",
    summary: "Activation set to near-failure, then short rest (3-5 deep breaths) followed by mini-sets of 3-5 reps until you can't hit the minimum.",
    match: (text) => /myo[\s-]*rep/i.test(text) ? "Myo-Reps detected" : null,
  },
  {
    key: "superset",
    label: "Superset",
    emoji: "🔗",
    summary: "Two exercises performed back-to-back with no rest between them. Rest only after completing both moves.",
    match: (text) => /super\s*set/i.test(text) ? "Superset detected" : null,
  },
  {
    key: "amrap",
    label: "AMRAP",
    emoji: "💥",
    summary: "As Many Reps As Possible. Push to technical failure — stop when form breaks down, not when it hurts.",
    match: (text) => /amrap/i.test(text) ? "AMRAP detected" : null,
  },
  {
    key: "pause",
    label: "Pause Reps",
    emoji: "⏸️",
    summary: "Hold the weight at the hardest point of the lift (usually the bottom) for 1-3 seconds. Builds strength out of the hole and eliminates momentum.",
    match: (text) => /pause\s*(rep|at|for|\d)/i.test(text) ? "Pause Reps detected" : null,
  },
  {
    key: "rpe",
    label: "RPE",
    emoji: "📊",
    summary: "Rate of Perceived Exertion on a 1-10 scale. RPE 8 = you had ~2 reps left. RPE 10 = absolute failure.",
    match: (text) => {
      const m = text.match(/rpe\s*(\d+)/i);
      return m ? `RPE ${m[1]}` : null;
    },
  },
  {
    key: "rir",
    label: "RIR",
    emoji: "🎯",
    summary: "Reps In Reserve — how many reps you could still do. RIR 2 means stop with 2 reps left in the tank.",
    match: (text) => {
      const m = text.match(/rir\s*(\d[\d-]*)/i);
      return m ? `RIR ${m[1]}` : null;
    },
  },
  {
    key: "cluster",
    label: "Cluster Set",
    emoji: "🧱",
    summary: "Break a heavy set into mini-sets with 10-20s intra-set rest. Allows more total reps at a heavier load.",
    match: (text) => /cluster/i.test(text) ? "Cluster Set detected" : null,
  },
  {
    key: "emom",
    label: "EMOM",
    emoji: "⏰",
    summary: "Every Minute On the Minute. Start your reps at the top of each minute; rest for whatever time remains.",
    match: (text) => /emom/i.test(text) ? "EMOM detected" : null,
  },
  {
    key: "restpause",
    label: "Rest-Pause",
    emoji: "💤",
    summary: "Hit failure, rest 10-15 seconds, then rep out again. Recruits more motor units than straight sets.",
    match: (text) => /rest[\s-]*pause/i.test(text) ? "Rest-Pause detected" : null,
  },
];

export function IntensityTechniquesBanner({ exercises }: IntensityTechniquesBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const detected = useMemo(() => {
    const allText = exercises.map((e) => `${e.name} ${e.detail}`).join(" ");
    const found: { technique: Technique; instance: string }[] = [];

    for (const tech of TECHNIQUES) {
      const instance = tech.match(allText);
      if (instance) {
        found.push({ technique: tech, instance });
      }
    }
    return found;
  }, [exercises]);

  if (detected.length === 0) return null;

  return (
    <div className="bg-accent/30 border border-accent/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Intensity Techniques</span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {detected.length} used today
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <span className="text-base mt-0.5">⚡</span>
            <div>
              <p className="text-sm font-bold text-foreground">General Rule</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Intensity techniques apply to the <span className="font-semibold text-foreground">last 1–2 sets only</span> — complete your straight sets first, then push the final set(s) beyond failure. Exception: Tempo and Cluster sets apply to all sets.
              </p>
            </div>
          </div>
          {detected.map(({ technique }) => (
            <div key={technique.key} className="flex items-start gap-3">
              <span className="text-base mt-0.5">{technique.emoji}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{technique.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{technique.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
