// Home: compact "This Week's Focus" — the four coach-assigned priorities.
// Full coaching notes stay on /weekly-review/:weekStart.
import { useNavigate } from "react-router-dom";
import { Check, Dumbbell, Utensils, Heart, Baby, ChevronRight } from "lucide-react";
import { useWeeklyPriorities, useUpdatePriorityStatus, effectiveStatus } from "@/hooks/useWeeklyPriorities";
import { useCurrentWeeklyCheckIn } from "@/hooks/useWeeklyCheckIns";
import { PRIORITY_CATEGORY_LABELS, PRIORITY_STATUS, CHECK_IN_STATUS, type PriorityCategory } from "@/lib/coaching/coachingConstants";
import { currentWeekStart, previousWeekStart } from "@/lib/coaching/weekLogic";

const ICONS: Record<PriorityCategory, typeof Dumbbell> = {
  fitness: Dumbbell, nutrition: Utensils, relationship: Heart, fatherhood: Baby,
};

export function WeeklyFocusCard() {
  const navigate = useNavigate();
  const { checkIn, previousCheckIn } = useCurrentWeeklyCheckIn();
  // Priorities activate on acknowledgment; the "active" set may belong to this
  // week's check-in (assigned last Sunday for the week ahead).
  const activeWeek =
    checkIn?.status === CHECK_IN_STATUS.ACKNOWLEDGED ? currentWeekStart() :
    previousCheckIn?.status === CHECK_IN_STATUS.ACKNOWLEDGED ? previousWeekStart(currentWeekStart()) : null;
  const { data: priorities } = useWeeklyPriorities(activeWeek ?? undefined);
  const update = useUpdatePriorityStatus();

  if (!activeWeek || !priorities?.length) return null;
  const done = priorities.filter((p) => ["completed", "verified"].includes(effectiveStatus(p))).length;

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <button onClick={() => navigate(`/weekly-review/${activeWeek}`)} className="w-full flex items-center justify-between">
        <h2 className="font-semibold text-foreground">This Week's Focus</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {done}/{priorities.length} done <ChevronRight className="h-4 w-4" />
        </span>
      </button>
      <ul className="space-y-2">
        {priorities.map((p) => {
          const Icon = ICONS[p.category];
          const status = effectiveStatus(p);
          const complete = status === "completed" || status === "verified";
          const na = status === PRIORITY_STATUS.NOT_APPLICABLE;
          return (
            <li key={p.id} className="flex items-start gap-3">
              <button
                disabled={na || update.isPending || status === "verified"}
                onClick={() => update.mutate({ id: p.id, status: complete ? PRIORITY_STATUS.IN_PROGRESS : PRIORITY_STATUS.COMPLETED })}
                className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  complete ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                }`}
                aria-label={complete ? "Mark not done" : "Mark done"}
              >
                {complete && <Check className="h-3 w-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{PRIORITY_CATEGORY_LABELS[p.category]}</span>
                  {status === "overdue" && <span className="text-[11px] text-destructive">Overdue</span>}
                  {status === "verified" && <span className="text-[11px] text-primary">Coach verified</span>}
                </div>
                <p className={`text-sm ${complete ? "text-muted-foreground line-through" : "text-foreground"}`}>{p.title}</p>
                {p.description && !complete && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
