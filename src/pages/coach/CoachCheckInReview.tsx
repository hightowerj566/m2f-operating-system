// /coach/check-ins/:checkInId — one consolidated review page:
// A) client snapshot  B) member answers  C) performance data  D) trends,
// plus flags and the response/priorities editor. No tab-hopping.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachCheckInReview, useBeginReview } from "@/hooks/useCoachCheckIns";
import { ClientWeeklySnapshot } from "@/components/coaching/ClientWeeklySnapshot";
import { NutritionReviewCard } from "@/components/coaching/NutritionReviewCard";
import { CoachingFlagsPanel } from "@/components/coaching/CoachingFlagsPanel";
import { WeeklyTrendCharts } from "@/components/coaching/WeeklyTrendCharts";
import { CoachResponseEditor } from "@/components/coaching/CoachResponseEditor";
import { CHECK_IN_STATUS, ENERGY_LABELS, STRESS_LABELS, CONNECTION_LABELS, SLEEP_OPTIONS, TRAINING_OPTIONS, NUTRITION_OPTIONS, SUPPORT_OPTIONS } from "@/lib/coaching/coachingConstants";
import { weekLabel } from "@/lib/coaching/weekLogic";

export default function CoachCheckInReview() {
  const { checkInId = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isCoach, setIsCoach] = useState<boolean | null>(null);
  const { data, isLoading, refetch } = useCoachCheckInReview(checkInId);
  const begin = useBeginReview();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle()
      .then(({ data: d }) => setIsCoach(!!d));
  }, [user, loading, navigate]);

  // Opening the review locks the member submission
  useEffect(() => {
    if (isCoach && data?.checkIn && data.checkIn.status === CHECK_IN_STATUS.SUBMITTED) {
      begin.mutate(data.checkIn.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, data?.checkIn?.id, data?.checkIn?.status]);

  if (isCoach === false) { navigate("/"); return null; }
  if (isCoach === null || isLoading || !data?.checkIn) return <div className="min-h-dvh bg-background" />;

  const { checkIn: ci, snapshot, flags, response, priorities, profile, history, macros, previousPriorities, previousResponse } = data;
  const name = profile?.display_name ?? "Member";
  const low = (v: number | null, threshold: number) => v != null && v <= threshold;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3 sticky top-0 bg-background z-10">
        <button onClick={() => navigate("/coach/check-ins")} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold">{name} · {weekLabel(ci.week_start)}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {ci.status.replace(/_/g, " ")}
            {ci.review_started_at && <><Lock className="h-3 w-3" /> submission locked</>}
          </p>
        </div>
        {ci.overall_rating != null && (
          <span className={`text-2xl font-bold ${ci.overall_rating <= 4 ? "text-destructive" : "gold-text"}`}>{ci.overall_rating}/10</span>
        )}
      </header>

      <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Left: review content */}
        <div className="space-y-6">
          {/* A · Client Snapshot */}
          <Section title="Client Snapshot">
            <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Kv k="Goal" v={profile?.goal?.replace(/_/g, " ") ?? "—"} />
              <Kv k="Timeline" v={snapshot?.days_until_due != null ? `${snapshot.days_until_due} days until due` : snapshot?.baby_age_days != null ? `Baby ${snapshot.baby_age_days} days old` : profile?.due_date ? `Due ${profile.due_date}` : "—"} />
              <Kv k="Macros" v={macros ? `${macros.calories} kcal · ${macros.protein_g}P/${macros.carbs_g}C/${macros.fat_g}F` : "—"} />
              <Kv k="Program" v={snapshot?.program_id ? "Assigned" : "None assigned"} />
              {previousPriorities.length > 0 && (
                <div className="sm:col-span-2 pt-1">
                  <p className="text-muted-foreground text-xs mb-1">Previous week's focus</p>
                  {previousPriorities.map((p) => (
                    <p key={p.id} className="text-xs">• {p.title} <span className="text-muted-foreground">({p.status.replace(/_/g, " ")})</span></p>
                  ))}
                </div>
              )}
              {previousResponse?.written_response && (
                <div className="sm:col-span-2 pt-1">
                  <p className="text-muted-foreground text-xs mb-1">Previous coach response</p>
                  <p className="text-xs line-clamp-3 whitespace-pre-wrap">{previousResponse.written_response}</p>
                </div>
              )}
            </div>
          </Section>

          {/* Flags */}
          <Section title={`Intervention Flags (${flags.length})`}>
            <CoachingFlagsPanel flags={flags} />
          </Section>

          {/* B · Member Answers */}
          <Section title="Member Answers">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <Answer q="Biggest win" a={ci.biggest_win} />
              <Answer q="Biggest challenge" a={ci.biggest_struggle} emphasize />
              <Answer q="Energy" a={ci.energy_rating ? `${ci.energy_rating}/5 — ${ENERGY_LABELS[ci.energy_rating - 1]}` : null} warn={low(ci.energy_rating, 2)} />
              <Answer q="Stress" a={ci.stress_rating ? `${ci.stress_rating}/5 — ${STRESS_LABELS[ci.stress_rating - 1]}` : null} warn={ci.stress_rating != null && ci.stress_rating >= 4} />
              <Answer q="Sleep" a={SLEEP_OPTIONS.find((o) => o.value === ci.sleep_range)?.label} warn={ci.sleep_range === "<5" || ci.sleep_range === "5-6"} />
              <Answer q="Training" a={TRAINING_OPTIONS.find((o) => o.value === ci.training_rating)?.label} warn={ci.training_rating === "barely" || ci.training_rating === "none"} />
              <Answer q="Training notes" a={ci.training_notes} />
              <Answer q="Nutrition" a={NUTRITION_OPTIONS.find((o) => o.value === ci.nutrition_rating)?.label} warn={ci.nutrition_rating === "<50" || ci.nutrition_rating === "not_tracked"} />
              <Answer q="Nutrition notes" a={ci.nutrition_notes} />
              <Answer q="Partner connection" a={ci.relationship_rating ? `${ci.relationship_rating}/5 — ${CONNECTION_LABELS[ci.relationship_rating - 1]}` : null} warn={low(ci.relationship_rating, 2)} />
              <Answer q="Relationship notes" a={ci.relationship_notes} emphasize />
              <Answer q="Baby readiness" a={ci.fatherhood_confidence ? `${ci.fatherhood_confidence}/10` : null} warn={low(ci.fatherhood_confidence, 4)} />
              <Answer q="Fatherhood task" a={ci.fatherhood_task_notes} />
              <Answer q="Least confident about" a={ci.next_week_concern} emphasize />
              <Answer q="Wants from coach" a={SUPPORT_OPTIONS.find((o) => o.value === ci.support_type)?.label} emphasize />
              <Answer q="Support notes" a={ci.support_notes} emphasize />
            </div>
          </Section>

          {/* C · Performance Data */}
          <Section title="Performance Data">
            <ClientWeeklySnapshot snapshot={snapshot} />
          </Section>

          {/* C2 · Nutrition & Macro Review */}
          <Section title="Nutrition & Macro Review">
            <NutritionReviewCard
              snapshot={snapshot}
              macros={macros as never}
              profile={profile as never}
              nutrition_rating={ci.nutrition_rating}
              nutrition_notes={ci.nutrition_notes}
            />
          </Section>

          {/* D · Trends */}
          <Section title="Trends">
            <WeeklyTrendCharts history={history} />
          </Section>
        </div>

        {/* Right: response editor (sticky on desktop) */}
        <div className="lg:sticky lg:top-20 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Coach Response</h2>
          <CoachResponseEditor checkIn={ci} response={response} priorities={priorities}
            previousPriorities={previousPriorities} flags={flags} onSent={refetch} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return <p><span className="text-muted-foreground">{k}:</span> {v}</p>;
}

function Answer({ q, a, warn, emphasize }: { q: string; a: string | null | undefined; warn?: boolean; emphasize?: boolean }) {
  if (!a) return null;
  return (
    <div className="p-3 text-sm flex gap-4 justify-between">
      <span className="text-muted-foreground shrink-0">{q}</span>
      <span className={`text-right ${warn ? "text-destructive font-medium" : emphasize ? "text-foreground font-medium" : "text-foreground"}`}>{a}</span>
    </div>
  );
}
