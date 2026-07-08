// M2F OS · The Plan (S5) — the money screen.
// A vertical timeline from today to her arrival: phase transitions and Build
// List milestones plotted by target day, so he sees the whole path at once.

import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, Circle } from "lucide-react";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, type BuildMilestone } from "@/hooks/useBuildList";
import { PHASES, getPhase, daysRemaining, pregnancyWeek } from "@/lib/phases";

// Each phase's "target by" day (days remaining when the phase ENDS)
const PHASE_END_DAYS: Record<number, number> = { 1: 181, 2: 121, 3: 61, 4: 31, 5: 0 };

export default function Plan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);
  const { data: milestones = [] } = useBuildList(user?.id);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const days = daysRemaining(readiness?.dueDate);
  const currentPhase = getPhase(days, !!readiness?.babyArrivedAt);
  const week = pregnancyWeek(days);

  if (days == null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-black mb-2">No clock, no plan.</h1>
        <p className="text-muted-foreground mb-6">Set your due date to see your full path.</p>
        <Button onClick={() => navigate("/start")} className="gold-gradient text-primary-foreground font-bold rounded-xl px-8 py-5">
          Set It Up
        </Button>
      </div>
    );
  }

  // Phases still ahead of (or containing) today, in order
  const visiblePhases = PHASES.filter((p) => PHASE_END_DAYS[p.id] <= (days ?? 0) + 200);
  const milestonesFor = (phaseId: number): BuildMilestone[] =>
    milestones.filter((m) => m.phase === phaseId);

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto px-5 pt-6 pb-16">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">Your Plan</p>
        <h1 className="text-3xl font-black tracking-tight">The next {days} days.</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Week {week} of pregnancy. Every milestone below is plotted against her arrival — this is the whole path.
        </p>
      </div>

      {/* TODAY marker */}
      <div className="relative pl-6 border-l-2 border-primary/50">
        <div className="mb-8 relative">
          <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full gold-gradient border-2 border-background" />
          <p className="text-xs font-bold tracking-widest uppercase text-primary">Today · T-minus {days} days</p>
          {currentPhase && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{currentPhase.hisJob}</p>
          )}
        </div>

        {visiblePhases.map((p) => {
          const endDays = PHASE_END_DAYS[p.id];
          const isPast = (days ?? 0) < endDays && p.id < (currentPhase?.id ?? 1);
          const isCurrent = p.id === currentPhase?.id;
          const items = milestonesFor(p.id);
          if (endDays > (days ?? 0) && !isCurrent && p.id < (currentPhase?.id ?? 1)) return null;
          return (
            <div key={p.id} className="mb-8 relative">
              <span
                className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                  isCurrent ? "bg-primary" : isPast ? "bg-muted-foreground" : "bg-border"
                }`}
              />
              <p className={`text-xs font-bold tracking-widest uppercase ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                {p.name} · {p.pregWindow}
                {isCurrent && " · YOU ARE HERE"}
              </p>
              <p className="text-sm font-bold text-foreground mt-1">{p.focus}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.hisJob}</p>

              {items.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {items.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={m.completed ? "text-muted-foreground line-through" : "text-foreground/90"}>
                        {m.title}
                      </span>
                      {p.id <= 5 && (
                        <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                          by T-{PHASE_END_DAYS[p.id]}d
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Arrival */}
        <div className="relative">
          <span className="absolute -left-[33px] top-0 w-5 h-5 rounded-full gold-gradient flex items-center justify-center border-2 border-background">
            <Flag className="w-2.5 h-2.5 text-primary-foreground" />
          </span>
          <p className="text-xs font-bold tracking-widest uppercase text-primary">Day Zero</p>
          <p className="text-lg font-black">She arrives. Everything changes.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Then Father Mode begins — and the app changes with you.</p>
        </div>
      </div>

      <Button
        onClick={() => navigate("/")}
        className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-10"
      >
        Start Today's Work <ChevronRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
}
