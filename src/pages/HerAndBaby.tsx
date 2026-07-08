// M2F OS · Her & Baby This Week (S9) — pregnancy-week grounded, three lines:
// what the baby's doing, what she's feeling, and his move.

import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft } from "lucide-react";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { daysRemaining, pregnancyWeek } from "@/lib/phases";
import { weekCard, PREGNANCY_WEEKS } from "@/content/pregnancyWeeks";

export default function HerAndBaby() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const week = pregnancyWeek(daysRemaining(readiness?.dueDate));
  const card = weekCard(week);
  const partner = readiness?.babyName ? null : null; // partner name lives on profile; header stays universal

  if (!card) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-black mb-2">Set the clock first.</h1>
        <p className="text-muted-foreground mb-4">This page runs on your due date.</p>
        <button onClick={() => navigate("/start")} className="text-primary font-bold">Set it up →</button>
      </div>
    );
  }

  const upcoming = PREGNANCY_WEEKS.filter((c) => c.week > card.week).slice(0, 2);

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-6 pb-16">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">Her & Baby</p>
      <h1 className="text-3xl font-black tracking-tight mb-6">Week {card.week}</h1>

      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">Your daughter</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{card.baby}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">Your wife</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{card.her}</p>
        </div>
        <div className="bg-card border border-primary/40 rounded-2xl p-5">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">Your move this week</p>
          <p className="text-sm font-semibold text-foreground leading-relaxed">{card.move}</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mt-8 mb-3">Coming up</p>
          <div className="space-y-2">
            {upcoming.map((c) => (
              <div key={c.week} className="bg-card border border-border rounded-xl p-4 opacity-70">
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Week {c.week}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.baby}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
