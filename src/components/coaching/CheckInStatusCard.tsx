// Home card: weekly check-in status. Prominent on Sunday, persistent while overdue,
// switches to "review ready" when the coach responds.
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, ChevronRight, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useCurrentWeeklyCheckIn } from "@/hooks/useWeeklyCheckIns";
import { CHECK_IN_STATUS } from "@/lib/coaching/coachingConstants";
import { weekLabel } from "@/lib/coaching/weekLogic";

export function CheckInStatusCard() {
  const navigate = useNavigate();
  const { checkIn, previousCheckIn, weekStart, overdue, isLoading } = useCurrentWeeklyCheckIn();
  if (isLoading) return null;

  // Coach response ready (this week or last week, unacknowledged)
  const readyCheckIn = [checkIn, previousCheckIn].find((c) => c?.status === CHECK_IN_STATUS.RESPONSE_READY);
  if (readyCheckIn) {
    return (
      <button
        onClick={() => navigate(`/weekly-review/${readyCheckIn.week_start}`)}
        className="w-full text-left rounded-xl border border-primary/40 bg-card p-4 glow-gold flex items-center gap-3"
      >
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Your weekly coaching review is ready</p>
          <p className="text-sm text-muted-foreground">Watch it, then start your week.</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    );
  }

  const isSunday = new Date().getDay() === 0;
  const status = checkIn?.status;

  // Already submitted / in review / done for the week
  if (status && status !== CHECK_IN_STATUS.DRAFT) {
    const label =
      status === CHECK_IN_STATUS.SUBMITTED ? "Submitted — coach will review soon" :
      status === CHECK_IN_STATUS.IN_REVIEW ? "Coach is reviewing your week" :
      status === CHECK_IN_STATUS.ACKNOWLEDGED ? "Week active — priorities in play" :
      "Week complete";
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Weekly check-in</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  }

  // Due / overdue / draft
  const isDraft = status === CHECK_IN_STATUS.DRAFT;
  if (!isSunday && !overdue && !isDraft) return null;
  return (
    <button
      onClick={() => navigate("/weekly-check-in")}
      className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 bg-card ${
        overdue ? "border-destructive/50" : "border-primary/40 glow-gold"
      }`}
    >
      {overdue
        ? <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        : <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">
          {overdue ? "Weekly check-in overdue" : isDraft ? "Finish your weekly check-in" : "Weekly check-in due today"}
        </p>
        <p className="text-sm text-muted-foreground">{weekLabel(weekStart)} · ~5 minutes</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
