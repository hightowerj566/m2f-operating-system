// M2F OS · Program workout detail with Full/Express/Minimum switcher.
// Slug-addressable so the week strip, timeline, and old post-birth link
// all route here. Falls back to the guided journey if the slug matches.

import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, Clock, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProgram } from "@/hooks/useMemberProgram";
import { VERSION_LABELS, type WorkoutVersion, type PBWorkout } from "@/content/postBirthTraining";
import { PRE_BIRTH_PROGRAMS } from "@/content/preBirthTraining";
import { POST_BIRTH_PROGRAMS } from "@/content/postBirthTraining";
import { recommendVersion } from "@/lib/smartRecommendation";
import { babyAgeDays } from "@/lib/phases";

const todayISO = () => new Date().toISOString().slice(0, 10);
const doneKey = (slug: string) => `m2f.pbworkout.${slug}.${todayISO()}`;

function findWorkout(slug: string): PBWorkout | null {
  for (const p of PRE_BIRTH_PROGRAMS) {
    const w = p.workouts.find((x) => x.slug === slug);
    if (w) return w;
  }
  for (const p of POST_BIRTH_PROGRAMS) {
    const w = p.workouts.find((x) => x.slug === slug);
    if (w) return w;
  }
  return null;
}

export default function ProgramWorkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const { data } = useMemberProgram(user?.id);

  const workout = useMemo(() => findWorkout(slug) ?? data?.todayWorkout ?? null, [slug, data]);
  const [version, setVersion] = useState<WorkoutVersion>("full");
  const [done, setDone] = useState<boolean>(() =>
    workout ? localStorage.getItem(doneKey(workout.slug)) === "1" : false,
  );

  const recommendation = useMemo(() => {
    return recommendVersion({
      babyAgeDays: data?.currentWeek != null && data?.stage?.era === "post-birth"
        ? babyAgeDays(new Date(Date.now() - (data.currentWeek * 7 * 86400_000)).toISOString())
        : null,
    });
  }, [data]);

  const spec = workout ? workout.versions[version] : null;

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const markComplete = () => {
    if (!workout) return;
    const next = !done;
    setDone(next);
    if (next) {
      localStorage.setItem(doneKey(workout.slug), "1");
      // Record version_used for future coach-dashboard analytics.
      const history = JSON.parse(localStorage.getItem("m2f.pbworkout.history") || "[]");
      history.push({
        slug: workout.slug,
        version,
        completedAt: new Date().toISOString(),
        stageSlug: data?.stage?.slug ?? null,
      });
      localStorage.setItem("m2f.pbworkout.history", JSON.stringify(history.slice(-500)));
    } else {
      localStorage.removeItem(doneKey(workout.slug));
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/programs")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Programs
      </button>

      {!workout ? (
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Workout not found</h1>
          <p className="text-muted-foreground text-sm">This session isn't part of your current program.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">
            {data?.stage?.name ?? "Session"}
          </p>
          <h1 className="text-3xl font-black tracking-tight mb-1">{workout.name}</h1>
          <p className="text-muted-foreground text-sm mb-4">{workout.objective}</p>

          {/* Smart recommendation banner */}
          {recommendation.visible && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 mb-4">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1">
                Recommended today · {VERSION_LABELS[recommendation.version].label}
              </p>
              <p className="text-sm text-foreground/85">{recommendation.reason}</p>
            </div>
          )}

          {/* Version switch */}
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
          <p className="text-[11px] text-muted-foreground mb-2">{VERSION_LABELS[version].hint}</p>

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
            {spec?.exercises.map((ex, i) => (
              <li key={`${ex.name}-${i}`} className="rounded-xl border border-border bg-secondary/30 p-4">
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
