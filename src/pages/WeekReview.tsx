// M2F OS · The Weekly Review — Sunday-night scoreboard.
// Score movement, mission status, standards %, milestones built, days left.

import { useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, TrendingUp, Target, ClipboardCheck, Hammer } from "lucide-react";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, applyMilestoneBoost } from "@/hooks/useBuildList";
import { weekStart } from "@/hooks/useMissions";
import { daysRemaining } from "@/lib/phases";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function WeekReview() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);
  const { data: milestones = [] } = useBuildList(user?.id);

  const ws = weekStart();

  const { data: weekData } = useQuery({
    queryKey: ["week-review", user?.id, ws],
    enabled: !!user?.id,
    queryFn: async () => {
      const weekStartDate = new Date(ws + "T00:00:00");
      const [{ data: mission }, { data: standards }, { data: builtThisWeek }] = await Promise.all([
        db.from("user_missions").select("status").eq("user_id", user!.id).eq("week_start", ws).maybeSingle(),
        db.from("daily_standards").select("completions, date").eq("user_id", user!.id).gte("date", ws),
        db.from("user_milestones").select("milestone_id, completed_at").eq("user_id", user!.id).gte("completed_at", weekStartDate.toISOString()),
      ]);
      // Standards %: completed / possible across logged days this week
      let done = 0, possible = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (standards ?? []).forEach((d: any) => {
        const c = d.completions ?? {};
        const vals = Object.values(c);
        possible += vals.length;
        done += vals.filter(Boolean).length;
      });
      return {
        missionDone: mission?.status === "completed",
        missionAssigned: !!mission,
        standardsPct: possible > 0 ? Math.round((done / possible) * 100) : null,
        milestonesBuilt: builtThisWeek?.length ?? 0,
      };
    },
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const latest = readiness?.latest ?? null;
  const live = latest?.byCategory ? applyMilestoneBoost(latest.byCategory, milestones) : null;
  const currentScore = live ? live.total : latest?.total_score ?? null;
  const scoreDelta =
    currentScore != null && readiness?.previousTotal != null ? currentScore - readiness.previousTotal : null;
  const days = daysRemaining(readiness?.dueDate);

  const verdict = () => {
    const wins = [
      weekData?.missionDone,
      (weekData?.standardsPct ?? 0) >= 70,
      (weekData?.milestonesBuilt ?? 0) > 0,
      (scoreDelta ?? 0) > 0,
    ].filter(Boolean).length;
    if (wins >= 3) return "Strong week. You're already ahead of most men.";
    if (wins === 2) return "Solid week. One more front next week and it's a strong one.";
    if (wins === 1) return "You showed up somewhere. Next week, show up everywhere.";
    return "Rough week. It happens. The clock didn't stop — neither do you.";
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto px-5 pt-6 pb-16">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">Weekly Review</p>
      <h1 className="text-3xl font-black tracking-tight mb-1">The scoreboard.</h1>
      {days != null && (
        <p className="text-muted-foreground text-sm mb-6">{days} days left. Here's what this week bought you.</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <TrendingUp className="w-4 h-4 text-primary mb-2" />
          <p className="text-2xl font-black">
            {currentScore ?? "—"}
            {scoreDelta != null && scoreDelta !== 0 && (
              <span className={`text-sm ml-1 ${scoreDelta > 0 ? "text-primary" : "text-destructive"}`}>
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
            )}
          </p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-0.5">Readiness /70</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Target className="w-4 h-4 text-primary mb-2" />
          <p className="text-2xl font-black">{weekData?.missionDone ? "✓" : weekData?.missionAssigned ? "…" : "—"}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-0.5">This week's mission</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <ClipboardCheck className="w-4 h-4 text-primary mb-2" />
          <p className="text-2xl font-black">{weekData?.standardsPct != null ? `${weekData.standardsPct}%` : "—"}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-0.5">Standards held</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Hammer className="w-4 h-4 text-primary mb-2" />
          <p className="text-2xl font-black">{weekData?.milestonesBuilt ?? 0}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-0.5">Milestones built</p>
        </div>
      </div>

      <div className="bg-card border border-primary/40 rounded-2xl p-5 mb-6">
        <p className="text-sm font-bold leading-relaxed">{verdict()}</p>
      </div>

      <Button
        onClick={() => navigate("/readiness")}
        variant="outline"
        className="w-full font-bold rounded-xl py-5 mb-3"
      >
        Re-test my Readiness
      </Button>
      <Button
        onClick={() => navigate("/")}
        className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl"
      >
        Next week starts now
      </Button>
    </div>
  );
}
