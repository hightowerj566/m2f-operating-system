// M2F OS · The Build List — one-time milestones that prove the preparation.
// Phase-gated, event-driven, and score-adjusting (capped per category).

import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, CheckCircle2, Circle, Hammer } from "lucide-react";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, useToggleMilestone } from "@/hooks/useBuildList";
import { CATEGORIES } from "@/lib/readiness";
import { PHASES, getPhase, daysRemaining } from "@/lib/phases";

export default function BuildList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);
  const { data: milestones = [], isLoading } = useBuildList(user?.id);
  const toggle = useToggleMilestone(user?.id);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const days = daysRemaining(readiness?.dueDate);
  const phase = getPhase(days, !!readiness?.babyArrivedAt);
  const currentPhaseId = phase && phase.id <= 5 ? phase.id : 5;

  const completedCount = milestones.filter((m) => m.completed).length;
  const totalPoints = milestones.filter((m) => m.completed).reduce((s, m) => s + m.points, 0);

  const categoryName = (id: number) => CATEGORIES.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-6 pb-16">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <div className="mb-6">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">Before She Arrives</p>
        <h1 className="text-3xl font-black tracking-tight">
          {completedCount}/{milestones.length} built
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          One-time milestones. Each one you finish adds verified points to your Readiness Score
          {totalPoints > 0 ? ` — you've earned +${totalPoints} so far.` : "."}
        </p>
      </div>

      {phase && (
        <div className="bg-card border border-primary/40 rounded-2xl p-4 mb-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1">
            {phase.name} · {phase.window}
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">{phase.briefing}</p>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading the list…</p>
      ) : (
        PHASES.map((p) => {
          const items = milestones.filter((m) => m.phase === p.id);
          if (items.length === 0) return null;
          const isPast = p.id < currentPhaseId;
          const isCurrent = p.id === currentPhaseId;
          const done = items.filter((i) => i.completed).length;
          return (
            <div key={p.id} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-xs font-bold tracking-widest uppercase ${
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {p.name}
                  {isCurrent && " · NOW"}
                  {isPast && done < items.length && " · OVERDUE"}
                </p>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {done}/{items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id, !m.completed)}
                    className={`w-full text-left bg-card border rounded-2xl p-4 flex items-start gap-3 transition-all ${
                      m.completed ? "border-primary/40 opacity-70" : "border-border hover:border-primary"
                    }`}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`font-bold text-sm ${m.completed ? "line-through" : ""}`}>
                          {m.title}
                        </span>
                        <span className="text-[10px] font-bold text-primary whitespace-nowrap">
                          +{m.points} {categoryName(m.category_id)}
                        </span>
                      </span>
                      {m.detail && (
                        <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                          {m.detail}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
        <Hammer className="w-3.5 h-3.5" />
        <span>Finish a phase early and the next one pulls forward. The calendar doesn't run you.</span>
      </div>
    </div>
  );
}
