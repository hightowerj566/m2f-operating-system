// /weekly-check-in — member weekly check-in (form, status, history).
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Lock } from "lucide-react";
import { useCurrentWeeklyCheckIn, useWeeklyCheckInHistory } from "@/hooks/useWeeklyCheckIns";
import { WeeklyCheckInForm } from "@/components/coaching/WeeklyCheckInForm";
import { CHECK_IN_STATUS } from "@/lib/coaching/coachingConstants";
import { weekLabel } from "@/lib/coaching/weekLogic";
import { useAuth } from "@/hooks/useAuth";

export default function WeeklyCheckIn() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { checkIn, weekStart, overdue, isLoading } = useCurrentWeeklyCheckIn();
  const { data: history } = useWeeklyCheckInHistory();

  if (!loading && !user) { navigate("/auth"); return null; }
  if (isLoading) return <div className="min-h-dvh bg-background" />;

  const submitted = checkIn && checkIn.status !== CHECK_IN_STATUS.DRAFT;
  const locked = !!checkIn?.review_started_at;
  const editable = submitted && !locked && checkIn.status === CHECK_IN_STATUS.SUBMITTED;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center gap-3">
          <button onClick={() => navigate("/")} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="font-bold text-lg">Weekly Check-In</h1>
            <p className="text-xs text-muted-foreground">{weekLabel(weekStart)}{overdue && <span className="text-destructive"> · Overdue</span>}</p>
          </div>
        </header>

        {!submitted && <WeeklyCheckInForm weekStart={weekStart} existing={checkIn} />}

        {submitted && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="font-semibold">Check-in submitted</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Jason will review your week and set your next priorities. Your review will appear here and on Home when it's ready.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Submitted {checkIn.submitted_at ? new Date(checkIn.submitted_at).toLocaleString() : ""}</p>
              <p className="flex items-center gap-1">
                {locked ? <><Lock className="h-3 w-3" /> Coach reviewing — submission locked</> : <><Clock className="h-3 w-3" /> Status: {checkIn.status.replace(/_/g, " ")}</>}
              </p>
            </div>
            {editable && (
              <EditableForm weekStart={weekStart} checkIn={checkIn} />
            )}
            {checkIn.status === CHECK_IN_STATUS.RESPONSE_READY && (
              <button onClick={() => navigate(`/weekly-review/${weekStart}`)}
                className="w-full py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm">
                View Your Coaching Review
              </button>
            )}
          </div>
        )}

        {/* History */}
        {history && history.length > (submitted ? 1 : 0) && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Check-Ins</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {history.filter((h) => h.week_start !== weekStart || !submitted).map((h) => (
                <button key={h.id} onClick={() => navigate(`/weekly-review/${h.week_start}`)}
                  className="w-full flex justify-between items-center p-3 text-sm">
                  <span>{weekLabel(h.week_start)}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.overall_rating ? `${h.overall_rating}/10 · ` : ""}{h.status.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EditableForm({ weekStart, checkIn }: { weekStart: string; checkIn: NonNullable<ReturnType<typeof useCurrentWeeklyCheckIn>["checkIn"]> }) {
  return (
    <details className="pt-1">
      <summary className="text-sm text-primary cursor-pointer">Edit answers (until coach begins review)</summary>
      <div className="pt-4">
        <WeeklyCheckInForm weekStart={weekStart} existing={checkIn} />
      </div>
    </details>
  );
}
