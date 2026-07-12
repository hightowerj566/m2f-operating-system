// Member-facing live program screen. One week at a time, prev/next constrained
// to the accessible window. Backend RLS is the real gate — this is UX polish.

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock, Calendar } from "lucide-react";
import { useLiveSchedule, currentWeekNumber, accessibleRange, ScheduledWeek } from "@/hooks/useLiveSchedule";
import { formatDateRange, unlockLabel, daysUntil } from "@/lib/liveSchedule";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function LiveProgram() {
  const { data, isLoading } = useLiveSchedule();
  const weeks = data?.weeks ?? [];
  const assignment = data?.assignment ?? null;

  const cur = useMemo(() => currentWeekNumber(weeks), [weeks]);
  const range = useMemo(() => accessibleRange(weeks), [weeks]);
  const [viewingWeek, setViewingWeek] = useState<number | null>(cur);
  useEffect(() => { if (cur != null && viewingWeek == null) setViewingWeek(cur); }, [cur, viewingWeek]);

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24">
        <div className="max-w-md mx-auto p-6 space-y-4">
          <h1 className="text-2xl font-semibold">No active program</h1>
          <p className="text-muted-foreground">Ask your coach to assign Forge or Rebuild to see your weekly plan here.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const nextLocked = weeks.find((w) => new Date(w.unlock_at).getTime() > Date.now());
  const week = weeks.find((w) => w.display_week_number === viewingWeek);
  const totalWeeks = weeks.length;
  const canPrev = viewingWeek != null && range.min != null && viewingWeek > range.min;
  const canNext = viewingWeek != null && range.max != null && viewingWeek < range.max;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <div className="max-w-md mx-auto p-5 space-y-5">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{assignment.program.name}</p>
          <h1 className="text-3xl font-semibold leading-tight">
            {viewingWeek != null ? `Week ${viewingWeek} of ${totalWeeks}` : `Starts ${assignment.scheduled_start_date}`}
          </h1>
          {week && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" /> {formatDateRange(week.start_date, week.end_date)}
            </p>
          )}
          {assignment.status === "paused" && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm px-3 py-2">
              Program paused. No new weeks will open until your coach resumes.
            </div>
          )}
        </header>

        {/* Weekly nav */}
        <div className="flex items-center justify-between rounded-2xl bg-card border border-border px-2 py-2">
          <button
            disabled={!canPrev}
            onClick={() => canPrev && setViewingWeek((v) => (v ?? 1) - 1)}
            className="p-2 rounded-xl disabled:opacity-30"
            aria-label="Previous week"
          >
            <ChevronLeft />
          </button>
          <div className="text-sm font-medium">
            {viewingWeek === cur ? "This week" : viewingWeek != null ? `Week ${viewingWeek}` : "—"}
          </div>
          <button
            disabled={!canNext}
            onClick={() => canNext && setViewingWeek((v) => (v ?? 0) + 1)}
            className="p-2 rounded-xl disabled:opacity-30"
            aria-label="Next week"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Current week content */}
        {week ? <WeekPanel week={week} /> : null}

        {/* Locked-next card */}
        {nextLocked && (
          <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Locked</span>
            </div>
            <h3 className="text-lg font-semibold">Week {nextLocked.display_week_number}</h3>
            <p className="text-sm text-muted-foreground">
              Unlocks {unlockLabel(nextLocked.unlock_at, assignment.member_timezone)}
              {" · "}
              {daysUntil(nextLocked.unlock_at) === 0 ? "later today" : `in ${daysUntil(nextLocked.unlock_at)} day${daysUntil(nextLocked.unlock_at) === 1 ? "" : "s"}`}
            </p>
            <p className="text-sm text-foreground/80">Your next week opens Sunday. Finish the work in front of you.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function WeekPanel({ week }: { week: ScheduledWeek }) {
  // Empty-shell programs won't have workouts wired yet — we render notes plus
  // a placeholder so the surface still communicates state.
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Week {week.display_week_number}</h2>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">{week.access_status}</span>
      </div>
      {week.member_notes ? (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{week.member_notes}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Your coach hasn't published workouts for this week yet.</p>
      )}
    </div>
  );
}
