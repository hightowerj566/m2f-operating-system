import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, Clock, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProgram } from "@/hooks/useMemberProgram";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { WorkoutExerciseCard } from "@/components/training/WorkoutExerciseCard";
import { WorkoutVersionSelector } from "@/components/training/WorkoutVersionSelector";
import { loadTrainingContent } from "@/lib/training/loadTrainingContent";
import { resolveWorkoutById } from "@/lib/training/resolveWorkout";
import type { WorkoutVersionKey } from "@/lib/training/types";

function isVersion(value: string | null): value is WorkoutVersionKey {
  return value === "full" || value === "express" || value === "minimum";
}

const selectedVersionKey = (workoutId: string) => `m2f.workout-version.${workoutId}`;

export default function ProgramWorkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useMemberProgram(user?.id);
  const requestedVersion = searchParams.get("version");
  const [version, setVersion] = useState<WorkoutVersionKey>(() => {
    if (isVersion(requestedVersion)) return requestedVersion;
    const remembered = localStorage.getItem(selectedVersionKey(slug));
    return isVersion(remembered) ? remembered : "full";
  });

  useEffect(() => {
    if (isVersion(requestedVersion)) setVersion(requestedVersion);
  }, [requestedVersion, slug]);

  const resolved = useMemo(() => {
    try {
      return { workout: resolveWorkoutById(slug, version), error: null };
    } catch (cause) {
      return {
        workout: null,
        error: cause instanceof Error ? cause.message : "The workout could not be resolved.",
      };
    }
  }, [slug, version]);

  const journeyDay = data?.flagshipDay;
  const programDay =
    journeyDay?.status === "active" && journeyDay.day.workoutId === slug
      ? journeyDay.programDay
      : journeyDay?.status === "post-birth" && journeyDay.day?.workoutId === slug
      ? journeyDay.postpartumDay
      : 0;
  const content = loadTrainingContent();
  const { getSet, updateSet, completedSetCount } = useWorkoutProgress({
    memberId: user?.id ?? "anonymous",
    programId: content.programId,
    programDay,
    workoutId: slug,
    workoutVersion: version,
  });

  const workout = resolved.workout;
  const totalSets = workout?.exercises.reduce((sum, exercise) => {
    const sets = typeof exercise.sets === "number" ? exercise.sets : Number.parseInt(exercise.sets, 10) || 1;
    return sum + sets;
  }, 0) ?? 0;
  const done = totalSets > 0 && completedSetCount >= totalSets;
  const legacyCompletionKey = `m2f.pbworkout.${slug}.${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    if (!workout || completedSetCount > 0 || localStorage.getItem(legacyCompletionKey) !== "1") return;
    for (const exercise of workout.exercises) {
      const sets = typeof exercise.sets === "number" ? exercise.sets : Number.parseInt(exercise.sets, 10) || 1;
      for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
        updateSet(exercise.exerciseId, setNumber, { completed: true });
      }
    }
  }, [completedSetCount, legacyCompletionKey, updateSet, workout]);

  useEffect(() => {
    if (done) localStorage.setItem(legacyCompletionKey, "1");
    else if (completedSetCount > 0) localStorage.removeItem(legacyCompletionKey);
  }, [completedSetCount, done, legacyCompletionKey]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const changeVersion = (next: WorkoutVersionKey) => {
    setVersion(next);
    localStorage.setItem(selectedVersionKey(slug), next);
    setSearchParams({ version: next }, { replace: true });
  };

  const completeWorkout = () => {
    if (!workout) return;
    for (const exercise of workout.exercises) {
      const sets = typeof exercise.sets === "number" ? exercise.sets : Number.parseInt(exercise.sets, 10) || 1;
      for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
        updateSet(exercise.exerciseId, setNumber, { completed: !done, skipped: false });
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button onClick={() => navigate("/programs")} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Programs
      </button>

      {!workout ? (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-5">
          <h1 className="text-2xl font-black tracking-tight mb-2">Workout content error</h1>
          <p className="text-sm text-foreground/80">{resolved.error}</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">
            {journeyDay?.status === "active" ? `Program Day ${journeyDay.programDay}` : data?.stage?.name ?? "Guided Journey"}
          </p>
          <h1 className="text-3xl font-black tracking-tight mb-1">{workout.name}</h1>
          <p className="text-muted-foreground text-sm mb-4">{workout.objective}</p>

          <WorkoutVersionSelector value={version} onChange={changeVersion} />
          <p className="text-[11px] text-muted-foreground mt-2 mb-3">
            Your last version choice is remembered for this workout.
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {workout.minutes} min</span>
            <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {workout.equipment}</span>
            <span className="capitalize">{workout.difficulty}</span>
          </div>

          {workout.format && <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-bold mb-4">{workout.format}</p>}

          <div className="space-y-3 mb-5">
            {workout.exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={exercise.prescriptionId}
                exercise={exercise}
                getSet={(setNumber) => getSet(exercise.exerciseId, setNumber)}
                updateSet={(setNumber, patch) => updateSet(exercise.exerciseId, setNumber, patch)}
              />
            ))}
          </div>

          {workout.coachingNote && (
            <div className="rounded-xl border border-border bg-card/60 p-4 mb-5">
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-1">Coaching note</p>
              <p className="text-sm text-foreground/80">{workout.coachingNote}</p>
            </div>
          )}

          <button onClick={completeWorkout} className={`w-full h-12 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 ${done ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40" : "bg-primary text-primary-foreground"}`}>
            {done ? <><Check className="w-4 h-4" strokeWidth={3} /> Completed — tap to undo</> : `Complete workout · ${completedSetCount}/${totalSets} sets`}
          </button>
        </>
      )}
    </div>
  );
}
