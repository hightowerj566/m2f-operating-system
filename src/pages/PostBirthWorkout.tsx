// M2F OS · Post-birth workout player (lightweight).
// Renders the current phase's program with Full / Express / Minimum versions.
// The full Supabase program player (LiveProgram) is untouched — this page only
// serves the post-birth TS-defined programs. Completion is one localStorage
// key per day (same pattern as HomeTab mission overrides), so switching
// versions never duplicates a completion.

import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ChevronLeft, Check, Clock, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { babyAgeDays, getPostBirthPhase } from "@/lib/phases";
import {
  programForSlug,
  VERSION_LABELS,
  type WorkoutVersion,
  type PBWorkout,
} from "@/content/postBirthTraining";

const todayISO = () => new Date().toISOString().slice(0, 10);
const doneKey = (slug: string) => `m2f.pbworkout.${slug}.${todayISO()}`;

export default function PostBirthWorkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data } = useLatestReadiness(user?.id);

  const ageDays = babyAgeDays(data?.babyArrivedAt);
  const phase = getPostBirthPhase(ageDays);
  const program = phase ? programForSlug(phase.programSlug) : null;

  const [workoutIdx, setWorkoutIdx] = useState(0);
  const workout: PBWorkout | null = program?.workouts[workoutIdx] ?? null;

  const [version, setVersion] = useState<WorkoutVersion>("full");
  const [done, setDone] = useState<boolean>(() =>
    workout ? localStorage.getItem(doneKey(workout.slug)) === "1" : false,
  );

  const spec = useMemo(() => (workout ? workout.versions[version] : null), [workout, version]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const markComplete = () => {
    if (!workout) return;
    const next = !done;
    setDone(next);
    if (next) localStorage.setItem(doneKey(workout.slug), "1");
    else localStorage.removeItem(doneKey(workout.slug));
  };

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      {!phase || !program || !workout ? (
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2">No post-birth program yet</h1>
          <p className="text-muted-foreground text-sm">
            Enter your baby's arrival date from the More tab to unlock phase-based training.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">
            {program.name} · {phase.name}
          </p>
          <h1 className="text-3xl font-black tracking-tight mb-1">{workout.name}</h1>
          <p className="text-muted-foreground text-sm mb-4">{workout.objective}</p>

          {program.workouts.length > 1 && (
            <div className="flex gap-2 mb-4">
              {program.workouts.map((w, i) => (
                <button
                  key={w.slug}
                  onClick={() => {
                    setWorkoutIdx(i);
                    setDone(localStorage.getItem(doneKey(w.slug)) === "1");
                  }}
                  className={`px-3 h-9 rounded-full text-xs font-bold border transition-colors ${
                    i === workoutIdx
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border"
                  }`}
                >
                  Day {w.day}
                </button>
              ))}
            </div>
          )}

          {/* Version switch — Full / Express / Minimum */}
          <div className="rounded-2xl border border-border bg-card/60 p-1.5 grid grid-cols-3 gap-1.5 mb-2">
            {(Object.keys(VERSION_LABELS) as WorkoutVersion[]).map((v) => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`h-10 rounded-xl text-xs font-black tracking-wide transition-colors ${
                  version === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {VERSION_LABELS[v].label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mb-1">{VERSION_LABELS[version].hint}</p>
          {version === "minimum" && (
            <p className="text-[11px] text-primary font-semibold mb-2">
              Rough night? Minimum Mode still counts as a completed day.
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {spec?.minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" /> {workout.equipment}
            </span>
            <span className="capitalize">{workout.difficulty}</span>
          </div>

          {spec?.format && (
            <p className="text-sm font-bold text-foreground mb-2">{spec.format}</p>
          )}

          <ul className="space-y-2 mb-5">
            {spec?.exercises.map((ex) => (
              <li key={ex.name} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">{ex.name}</p>
                  <p className="text-sm font-black text-primary tabular-nums shrink-0">
                    {ex.sets ? `${ex.sets} × ${ex.reps}` : ex.reps}
                  </p>
                </div>
                {(ex.rest || ex.effort) && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {[ex.rest && `Rest ${ex.rest}`, ex.effort].filter(Boolean).join(" · ")}
                  </p>
                )}
                {ex.cue && (
                  <p className="text-[11px] text-foreground/70 italic mt-1">{ex.cue}</p>
                )}
                {ex.substitution && (
                  <p className="text-[11px] text-muted-foreground mt-1">Sub: {ex.substitution}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-card/60 p-4 mb-5">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-1">
              Coaching note
            </p>
            <p className="text-sm text-foreground/80">{workout.coachingNote}</p>
          </div>

          <button
            onClick={markComplete}
            className={`w-full h-12 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.99] transition-transform ${
              done
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {done ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} /> Completed — tap to undo
              </>
            ) : (
              "Mark workout complete"
            )}
          </button>
        </>
      )}
    </div>
  );
}
