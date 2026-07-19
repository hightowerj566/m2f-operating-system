// /weekly-review/:weekStart — member views coach response, priorities, week
// summary, and activates the upcoming week.
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Dumbbell, Utensils, Heart, Baby, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWeeklyReview, useAcknowledgeReview } from "@/hooks/useWeeklyCheckIns";
import { effectiveStatus, useUpdatePriorityStatus } from "@/hooks/useWeeklyPriorities";
import { CHECK_IN_STATUS, PRIORITY_CATEGORY_LABELS, PRIORITY_STATUS, type PriorityCategory } from "@/lib/coaching/coachingConstants";
import { weekLabel } from "@/lib/coaching/weekLogic";
import { toast } from "@/hooks/use-toast";

const ICONS: Record<PriorityCategory, typeof Dumbbell> = { fitness: Dumbbell, nutrition: Utensils, relationship: Heart, fatherhood: Baby };

export default function WeeklyReview() {
  const { weekStart = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useWeeklyReview(weekStart);
  const ack = useAcknowledgeReview();
  const update = useUpdatePriorityStatus();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Signed URL for private coach video
  useEffect(() => {
    const path = data?.response?.video_storage_path;
    if (!path) { setVideoUrl(data?.response?.video_url ?? null); return; }
    supabase.storage.from("coach-response-videos").createSignedUrl(path, 3600)
      .then(({ data: d }) => setVideoUrl(d?.signedUrl ?? null));
  }, [data?.response]);

  if (isLoading) return <div className="min-h-dvh bg-background" />;
  const { checkIn, response, priorities, snapshot } = data ?? {};

  if (!checkIn) {
    return (
      <Shell onBack={() => navigate(-1)} title="Weekly Review" subtitle={weekLabel(weekStart)}>
        <p className="text-sm text-muted-foreground">No check-in found for this week.</p>
      </Shell>
    );
  }

  const acknowledged = checkIn.status === CHECK_IN_STATUS.ACKNOWLEDGED || checkIn.status === CHECK_IN_STATUS.CLOSED;
  const responseReady = !!response;

  return (
    <Shell onBack={() => navigate("/")} title="Your Weekly Review" subtitle={weekLabel(weekStart)}>
      {!responseReady && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {checkIn.status === CHECK_IN_STATUS.SUBMITTED || checkIn.status === CHECK_IN_STATUS.IN_REVIEW
            ? "Your coach is reviewing your week. Your response and priorities will appear here."
            : "No coach response for this week."}
        </div>
      )}

      {videoUrl && (
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <video src={videoUrl} controls playsInline className="w-full aspect-video bg-black" />
          <p className="p-3 text-xs text-muted-foreground flex items-center gap-1"><Play className="h-3 w-3" /> Message from your coach</p>
        </div>
      )}

      {response?.written_response && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h2 className="font-semibold gold-text text-sm uppercase tracking-wide">From Your Coach</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{response.written_response}</p>
        </section>
      )}

      {/* Week summary */}
      {snapshot && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Your Week in Numbers</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Workouts" value={snapshot.workouts_completed ?? "—"} />
            <Stat label="Nutrition" value={snapshot.nutrition_compliance_pct != null ? `${snapshot.nutrition_compliance_pct}%` : "—"} />
            <Stat label="Weight Δ" value={snapshot.weight_change != null ? `${snapshot.weight_change > 0 ? "+" : ""}${snapshot.weight_change} lb` : "—"} />
          </div>
        </section>
      )}

      {/* Priorities */}
      {priorities && priorities.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Four Priorities</h2>
          {priorities.map((p) => {
            const Icon = ICONS[p.category];
            const status = effectiveStatus(p);
            const done = status === "completed" || status === "verified";
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex gap-3">
                <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{PRIORITY_CATEGORY_LABELS[p.category]}</p>
                  <p className="font-medium text-sm">{p.title}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  {p.completion_criteria && <p className="text-xs text-primary mt-1">Done when: {p.completion_criteria}</p>}
                </div>
                {acknowledged && status !== PRIORITY_STATUS.NOT_APPLICABLE && (
                  <button
                    disabled={update.isPending || status === "verified"}
                    onClick={() => update.mutate({ id: p.id, status: done ? PRIORITY_STATUS.IN_PROGRESS : PRIORITY_STATUS.COMPLETED })}
                    className={`self-center h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                      done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                    }`}
                  >
                    {done && <Check className="h-4 w-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {responseReady && !acknowledged && (
        <button
          disabled={ack.isPending}
          onClick={async () => {
            await ack.mutateAsync(checkIn.id);
            toast({ title: "Week activated", description: "Your four priorities are now live on Home." });
            navigate("/");
          }}
          className="w-full py-3.5 rounded-lg gold-gradient text-primary-foreground font-semibold"
        >
          Start My Week
        </button>
      )}
    </Shell>
  );
}

function Shell({ children, onBack, title, subtitle }: { children: React.ReactNode; onBack: () => void; title: string; subtitle: string }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="font-bold text-lg">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-bold gold-text">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
