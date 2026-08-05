// M2F OS · Home — Coach Focus.
// The client's personalized weekly prescription from the coach, sourced from
// weekly_priorities (assigned + acknowledged via the weekly check-in flow).
// This is intentionally a separate data source and label from the Build
// Roadmap's milestones — see useBuildList.ts / ThisWeeksRoadmapCard.

import { useNavigate } from "react-router-dom";
import { Check, Dumbbell, Utensils, Heart, Baby, ChevronRight } from "lucide-react";
import { useWeeklyPriorities, useUpdatePriorityStatus, effectiveStatus } from "@/hooks/useWeeklyPriorities";
import { useCurrentWeeklyCheckIn } from "@/hooks/useWeeklyCheckIns";
import {
  PRIORITY_CATEGORY_LABELS, PRIORITY_STATUS, CHECK_IN_STATUS, type PriorityCategory,
} from "@/lib/coaching/coachingConstants";
import { currentWeekStart, previousWeekStart } from "@/lib/coaching/weekLogic";

const ICONS: Record<PriorityCategory, typeof Dumbbell> = {
  fitness: Dumbbell, nutrition: Utensils, relationship: Heart, fatherhood: Baby,
};

export function CoachFocusCard() {
  const navigate = useNavigate();
  const { checkIn, previousCheckIn } = useCurrentWeeklyCheckIn();
  // Priorities activate on acknowledgment; the "active" set may belong to
  // this week's check-in (assigned last Sunday for the week ahead).
  const activeWeek =
    checkIn?.status === CHECK_IN_STATUS.ACKNOWLEDGED ? currentWeekStart() :
    previousCheckIn?.status === CHECK_IN_STATUS.ACKNOWLEDGED ? previousWeekStart(currentWeekStart()) : null;
  const { data: priorities } = useWeeklyPriorities(activeWeek ?? undefined);
  const update = useUpdatePriorityStatus();

  const items = activeWeek ? (priorities ?? []) : [];
  const done = items.filter((p) => ["completed", "verified"].includes(effectiveStatus(p))).length;

  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary">Coach Focus</h2>
        {items.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {done} of {items.length}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Your personalized priority from Jason this week.</p>

      {items.length === 0 ? (
        <button
          onClick={() => navigate("/build-list")}
          className="w-full flex items-center justify-between gap-3 text-left rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors px-3 py-3"
        >
          <span className="text-sm text-muted-foreground">
            No personalized focus assigned yet. Continue with this week's roadmap milestones.
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => {
            const Icon = ICONS[p.category];
            const status = effectiveStatus(p);
            const complete = status === "completed" || status === "verified";
            const na = status === PRIORITY_STATUS.NOT_APPLICABLE;
            return (
              <li key={p.id} className="flex items-start gap-3">
                <button
                  disabled={na || update.isPending || status === "verified"}
                  onClick={() =>
                    update.mutate({
                      id: p.id,
                      status: complete ? PRIORITY_STATUS.IN_PROGRESS : PRIORITY_STATUS.COMPLETED,
                    })
                  }
                  aria-label={complete ? "Mark not done" : "Mark done"}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    complete
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {complete && <Check className="w-3.5 h-3.5 text-black" strokeWidth={4} />}
                </button>

                <button
                  onClick={() => navigate(`/weekly-review/${activeWeek}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {PRIORITY_CATEGORY_LABELS[p.category]}
                    </span>
                    {status === "overdue" && (
                      <span className="text-[10px] text-destructive">Overdue</span>
                    )}
                    {status === "verified" && (
                      <span className="text-[10px] text-primary">Coach verified</span>
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${complete ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {p.title}
                  </p>
                  {p.description && !complete && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {p.description}
                    </p>
                  )}
                  {p.due_date && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Due {p.due_date}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
