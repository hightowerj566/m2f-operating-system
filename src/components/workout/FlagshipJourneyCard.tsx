// M2F OS · Flagship Guided Journey — non-training day card.
// Renders rest, active-recovery, mobility, conditioning-without-resolved-exercises,
// optional-training, assessment, transition, birth-window, post-birth-recovery,
// needs-due-date, and pre-program states using the flagship metadata returned by
// `loadFlagshipDay`. Deliberately does NOT depend on the legacy `scheduleConfig`.

import { Dumbbell, Zap, Coffee, Wind, Moon, HeartPulse, Baby, Calendar, ClipboardCheck, Check } from "lucide-react";
import type { FlagshipDayResult } from "@/lib/flagshipWorkoutAdapter";

const ICONS: Record<string, typeof Dumbbell> = {
  training: Dumbbell,
  rest: Moon,
  "active-recovery": HeartPulse,
  mobility: Wind,
  conditioning: Zap,
  "optional-training": Zap,
  assessment: ClipboardCheck,
  transition: Calendar,
  "birth-window": Baby,
  "post-birth-recovery": Coffee,
};

const EMOJI: Record<string, string> = {
  rest: "😴",
  "active-recovery": "🚶",
  mobility: "🧘",
  conditioning: "🔥",
  "optional-training": "⚡",
  assessment: "📋",
  transition: "🕒",
  "birth-window": "👶",
  "post-birth-recovery": "☕",
};

export function FlagshipJourneyCard({
  result,
  completed,
  onMarkComplete,
  onAddDueDate,
}: {
  result: FlagshipDayResult;
  completed?: boolean;
  onMarkComplete?: () => void;
  onAddDueDate?: () => void;
}) {
  const { meta } = result;
  const Icon = ICONS[meta.dayType] ?? Calendar;
  const emoji = EMOJI[meta.dayType] ?? "📅";

  const isNeedsDueDate = meta.status === "needs-due-date";
  const isPreProgram = meta.status === "pre-program";

  return (
    <div className="space-y-4">
      <div className="text-center py-6 space-y-2">
        <span className="text-5xl">{emoji}</span>
        <p className="text-lg font-black text-foreground">{result.label}</p>
        {!isNeedsDueDate && !isPreProgram && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span className="uppercase tracking-wider font-bold">{meta.dayType.replace(/-/g, " ")}</span>
            {!meta.isRequired && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold">Optional</span>
            )}
          </div>
        )}
      </div>

      {meta.objective && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm text-foreground leading-relaxed">{meta.objective}</p>
        </div>
      )}

      {meta.activities && meta.activities.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Today's Activities</p>
          <ul className="space-y-1.5">
            {meta.activities.map((a, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <span className="font-semibold capitalize">{a.type}</span>: {a.target}
                  {a.intensity && a.intensity !== "none" && (
                    <span className="text-muted-foreground"> ({a.intensity})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.completionCriteria && meta.completionCriteria.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Completion</p>
          <ul className="space-y-1.5">
            {meta.completionCriteria.map((c, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.completionMessage && (
        <p className="text-xs text-muted-foreground text-center px-4">{meta.completionMessage}</p>
      )}

      {isNeedsDueDate && onAddDueDate && (
        <button
          onClick={onAddDueDate}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Add Your Due Date
        </button>
      )}

      {!isNeedsDueDate && !isPreProgram && onMarkComplete && (
        <button
          onClick={onMarkComplete}
          disabled={completed}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
            completed
              ? "bg-primary/20 text-primary cursor-default"
              : "bg-secondary text-foreground border border-border hover:border-primary/40"
          }`}
        >
          <Check className="w-4 h-4" />
          {completed ? "Day Complete" : `Mark ${meta.dayType.replace(/-/g, " ")} Complete`}
        </button>
      )}
    </div>
  );
}
