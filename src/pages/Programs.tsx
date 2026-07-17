// M2F OS · Programs home. The single answer to "what am I training today?".
// Presents the current stage as a hero, this week's schedule as a horizontal
// strip, and the full journey timeline underneath. Coach programs render
// with a Coach badge and swap out only the training details.

import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, ChevronRight, Dumbbell, Home, LayoutDashboard, Lock, Map, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProgram } from "@/hooks/useMemberProgram";
import type { PBWorkout } from "@/content/postBirthTraining";

const isDoneKey = (workout: PBWorkout, dateISO: string) => `m2f.pbworkout.${workout.slug}.${dateISO}`;

export default function Programs() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useMemberProgram(user?.id);

  const completed = useMemo(() => {
    if (!data) return new Set<string>();
    const set = new Set<string>();
    data.weekSchedule.forEach((cell) => {
      if (!cell.workout) return;
      const iso = cell.date.toISOString().slice(0, 10);
      if (localStorage.getItem(isDoneKey(cell.workout, iso)) === "1") set.add(iso);
    });
    return set;
  }, [data]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-5">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Current Program
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-4xl font-black tracking-tight">
            {isLoading ? "…" : data?.stage?.name ?? data?.coach?.programName ?? "Journey"}
          </h1>
          {data?.track === "coach" && (
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-primary/15 text-primary border border-primary/40 rounded-full px-2.5 py-1">
              Coach
            </span>
          )}
        </div>
        {data?.eraDetail && (
          <p className="text-sm text-muted-foreground mt-1">{data.eraDetail}</p>
        )}
      </div>

      {isLoading || !data ? (
        <div className="px-5 text-muted-foreground text-sm">Loading your program…</div>
      ) : !data.stage && !data.coach ? (
        <EmptyState onSet={() => navigate("/?tab=More")} />
      ) : (
        <>
          {/* Hero card */}
          <div className="mx-5 rounded-2xl border border-border bg-card p-5 mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
                  Week
                </p>
                <p className="text-3xl font-black leading-none">
                  {data.weekInStage}
                  {data.stageTotalWeeks && (
                    <span className="text-lg text-muted-foreground font-bold"> / {data.stageTotalWeeks}</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
                  Progress
                </p>
                <p className="text-3xl font-black leading-none text-primary">{data.progressPct}%</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
              <div className="h-full bg-primary" style={{ width: `${data.progressPct}%` }} />
            </div>

            <button
              onClick={() => data.todayWorkout && navigate(`/programs/workout/${data.todayWorkout.slug}`)}
              disabled={!data.todayWorkout}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Dumbbell className="w-4 h-4" />
              {data.todayWorkout ? "Start Today's Workout" : "Rest Day — recovery earns tomorrow"}
            </button>

            <div className="flex gap-2 mt-3">
              {data.stage && (
                <button
                  onClick={() => navigate(`/programs/stage/${data.stage!.slug}`)}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-foreground/80 hover:bg-secondary/50 transition-colors"
                >
                  Program Details
                </button>
              )}
              <button
                onClick={() => {
                  const el = document.getElementById("week-strip");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-foreground/80 hover:bg-secondary/50 transition-colors"
              >
                View Week
              </button>
            </div>
          </div>

          {/* Week strip */}
          <div id="week-strip" className="px-5 mb-8">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-3">
              This Week
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {data.weekSchedule.map((cell, i) => {
                const iso = cell.date.toISOString().slice(0, 10);
                const done = completed.has(iso);
                const isPast = cell.date < new Date(new Date().toDateString());
                const isFuture = cell.date > new Date(new Date().toDateString());
                return (
                  <button
                    key={i}
                    onClick={() => cell.workout && navigate(`/programs/workout/${cell.workout.slug}`)}
                    disabled={!cell.workout || isFuture}
                    className={`rounded-xl p-2 flex flex-col items-center gap-1 border transition-colors min-h-[74px] ${
                      cell.isToday
                        ? "border-primary bg-primary/10"
                        : done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : cell.workout && !isFuture
                        ? "border-border bg-secondary/40 hover:border-primary/30"
                        : "border-border/50 bg-transparent"
                    } ${!cell.workout || isFuture ? "opacity-70" : ""}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {cell.dayLabel}
                    </span>
                    <span className="text-sm font-black">{cell.date.getDate()}</span>
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                    ) : !cell.workout ? (
                      <span className="text-[9px] text-muted-foreground">Rest</span>
                    ) : isFuture ? (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    ) : cell.isToday ? (
                      <span className="text-[9px] font-bold text-primary">TODAY</span>
                    ) : isPast ? (
                      <span className="text-[9px] text-muted-foreground">Missed</span>
                    ) : (
                      <Dumbbell className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="px-5 mb-6">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-3">
              The Journey
            </p>
            <div className="space-y-1.5">
              {data.timeline.map(({ stage, status }) => (
                <button
                  key={stage.slug}
                  onClick={() => navigate(`/programs/stage/${stage.slug}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    status === "current"
                      ? "border-primary bg-primary/10"
                      : status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : status === "locked"
                      ? "border-border/40 opacity-50"
                      : "border-border bg-card/40"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      status === "completed"
                        ? "bg-emerald-500 text-black"
                        : status === "current"
                        ? "bg-primary text-primary-foreground"
                        : status === "locked"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {status === "completed" ? "✓" : status === "locked" ? <Lock className="w-3 h-3" /> : ""}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{stage.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{stage.window}</p>
                  </div>
                  {status === "current" && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Now</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <ProgramsBottomNav />
    </div>
  );
}

function EmptyState({ onSet }: { onSet: () => void }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-lg font-black mb-2">Your journey starts with a date.</p>
      <p className="text-sm text-muted-foreground mb-5">
        Set your due date (or your baby's arrival date) and the app maps the whole training arc — from Foundation to Father Athlete.
      </p>
      <button
        onClick={onSet}
        className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-black text-sm"
      >
        Go to Settings
      </button>
    </div>
  );
}

function ProgramsBottomNav() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40">
      <div className="flex justify-around">
        {[
          { icon: Home, label: "Home", route: "/" },
          { icon: Dumbbell, label: "Programs", route: "/programs", active: true },
          { icon: Map, label: "Roadmap", route: "/build-list" },
          { icon: Menu, label: "More", route: "/?tab=More" },
        ].map(({ icon: Icon, label, route, active }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {active ? (
              <span className="bg-primary p-2 rounded-xl">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </span>
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
