import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Image, SkipForward } from "lucide-react";
import type { WorkoutSetProgress } from "@/hooks/useWorkoutProgress";
import type { ResolvedWorkoutExercise } from "@/lib/training/types";

type EditableSetFields = Partial<
  Pick<
    WorkoutSetProgress,
    | "completed"
    | "repsCompleted"
    | "load"
    | "rpe"
    | "notes"
    | "skipped"
    | "substitutionId"
  >
>;

function numericValue(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function WorkoutExerciseCard({
  exercise,
  getSet,
  updateSet,
}: {
  exercise: ResolvedWorkoutExercise;
  getSet: (setNumber: number) => WorkoutSetProgress | undefined;
  updateSet: (setNumber: number, patch: EditableSetFields) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const setCount =
    typeof exercise.sets === "number" ? exercise.sets : Number.parseInt(exercise.sets, 10) || 1;
  const setNumbers = Array.from({ length: setCount }, (_, index) => index + 1);
  const complete = setNumbers.every((setNumber) => {
    const value = getSet(setNumber);
    return value?.completed || value?.skipped;
  });

  const skipExercise = () => {
    const next = !setNumbers.every((setNumber) => getSet(setNumber)?.skipped);
    setNumbers.forEach((setNumber) =>
      updateSet(setNumber, { skipped: next, completed: false }),
    );
  };

  return (
    <article className={`rounded-2xl border bg-card overflow-hidden ${complete ? "border-emerald-500/50" : "border-border"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${complete ? "bg-emerald-500 text-black" : "bg-primary/15 text-primary"}`}>
            {complete ? <Check className="w-4 h-4" /> : exercise.order}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-base leading-tight">{exercise.displayName}</h2>
            <p className="text-sm font-bold text-primary mt-1">
              {setCount} sets × {exercise.reps}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Tempo {exercise.tempo} · Rest {exercise.restSeconds} sec
              {exercise.rpe != null ? ` · RPE ${exercise.rpe}` : ""}
              {exercise.rir != null ? ` / ${exercise.rir} RIR` : ""}
            </p>
          </div>
          <button type="button" onClick={skipExercise} className="text-muted-foreground p-1" aria-label={`Skip ${exercise.displayName}`}>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {exercise.tactileCue && (
          <div className="rounded-xl bg-secondary/50 px-3 py-2 mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cue</p>
            <p className="text-xs text-foreground/85 mt-0.5">{exercise.tactileCue}</p>
          </div>
        )}

        {(exercise.videoUrl || exercise.thumbnailUrl) && (
          <a
            href={exercise.videoUrl || exercise.thumbnailUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 h-10 rounded-xl border border-border flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Image className="w-4 h-4" /> View demonstration
          </a>
        )}

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[36px_1fr_1fr_1fr_40px] gap-2 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
            <span>Set</span><span>Reps</span><span>Load</span><span>RPE</span><span>Done</span>
          </div>
          {setNumbers.map((setNumber) => {
            const value = getSet(setNumber);
            return (
              <div key={setNumber} className={`grid grid-cols-[36px_1fr_1fr_1fr_40px] gap-2 items-center ${value?.skipped ? "opacity-45" : ""}`}>
                <span className="text-xs font-black text-center">{setNumber}</span>
                <input aria-label={`${exercise.displayName} set ${setNumber} reps`} inputMode="numeric" value={value?.repsCompleted ?? ""} onChange={(event) => updateSet(setNumber, { repsCompleted: numericValue(event.target.value) })} className="h-9 min-w-0 rounded-lg border border-border bg-secondary/40 px-2 text-sm text-center" />
                <input aria-label={`${exercise.displayName} set ${setNumber} load`} inputMode="decimal" value={value?.load ?? ""} onChange={(event) => updateSet(setNumber, { load: numericValue(event.target.value) })} className="h-9 min-w-0 rounded-lg border border-border bg-secondary/40 px-2 text-sm text-center" />
                <input aria-label={`${exercise.displayName} set ${setNumber} RPE`} inputMode="decimal" value={value?.rpe ?? ""} onChange={(event) => updateSet(setNumber, { rpe: numericValue(event.target.value) })} className="h-9 min-w-0 rounded-lg border border-border bg-secondary/40 px-2 text-sm text-center" />
                <button type="button" aria-label={`Complete ${exercise.displayName} set ${setNumber}`} onClick={() => updateSet(setNumber, { completed: !value?.completed, skipped: false })} className={`w-9 h-9 rounded-lg border flex items-center justify-center ${value?.completed ? "border-emerald-500 bg-emerald-500 text-black" : "border-border"}`}>
                  {value?.completed && <Check className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>

        {exercise.substitutions.length > 0 && (
          <label className="block mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Substitution
            <select
              value={getSet(1)?.substitutionId ?? ""}
              onChange={(event) => setNumbers.forEach((setNumber) => updateSet(setNumber, { substitutionId: event.target.value || null }))}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground normal-case tracking-normal font-medium"
            >
              <option value="">Original exercise</option>
              {exercise.substitutions.map((substitution) => <option key={substitution.id} value={substitution.id}>{substitution.name}</option>)}
            </select>
          </label>
        )}

        <label className="block mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Notes
          <input value={getSet(1)?.notes ?? ""} onChange={(event) => updateSet(1, { notes: event.target.value })} placeholder="Technique, pain, or adjustment" className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground normal-case tracking-normal font-normal" />
        </label>
      </div>

      <button type="button" onClick={() => setExpanded((value) => !value)} className="w-full border-t border-border px-4 py-3 flex items-center justify-between text-xs font-bold text-muted-foreground">
        Instructions & coaching cues
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3 text-xs text-foreground/80 space-y-3">
          <ol className="list-decimal pl-4 space-y-1">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
          {exercise.coachingCues.length > 0 && <ul className="list-disc pl-4 space-y-1">{exercise.coachingCues.map((cue) => <li key={cue}>{cue}</li>)}</ul>}
        </div>
      )}
    </article>
  );
}
