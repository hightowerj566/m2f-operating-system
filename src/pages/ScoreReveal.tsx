// M2F OS · Score Reveal — the moment after the assessment.
// Ring fills → band name + copy → category bars worst-first → weakest-category CTA.
// Anonymous users → /auth; authed users → home.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight } from "lucide-react";
import { ReadinessRing } from "@/components/ReadinessRing";
import { CATEGORIES, getBand, type CategorySlug } from "@/lib/readiness";
import { REVEAL_STORAGE_KEY } from "@/pages/FatherAthleteQuiz";

interface RevealState {
  total: number;
  byCategory: Record<CategorySlug, number>;
  weakest: CategorySlug;
  weeksRemaining: number | null;
  dueDate: string;
  track: string;
  name: string;
}

export default function ScoreReveal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState(0); // 0 ring → 1 band → 2 bars → 3 CTA

  const state: RevealState | null = useMemo(() => {
    if (location.state && typeof (location.state as RevealState).total === "number") {
      return location.state as RevealState;
    }
    try {
      const stored = sessionStorage.getItem(REVEAL_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as RevealState) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  useEffect(() => {
    if (!state) {
      navigate("/readiness", { replace: true });
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 1400),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state, navigate]);

  if (!state) return null;

  const band = getBand(state.total);
  const weakestCat = CATEGORIES.find((c) => c.slug === state.weakest) ?? CATEGORIES[0];
  const weakestScore = state.byCategory[state.weakest] ?? 0;
  const sorted = [...CATEGORIES].sort(
    (a, b) => (state.byCategory[a.slug] ?? 0) - (state.byCategory[b.slug] ?? 0),
  );

  const ctaHeadline =
    state.weeksRemaining != null
      ? `Your ${weakestCat.name} score is ${weakestScore}/10 and you have ${state.weeksRemaining} weeks.`
      : `Your ${weakestCat.name} score is ${weakestScore}/10.`;

  const handleCta = () => {
    if (user) {
      navigate("/", { replace: true });
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12">
      <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2">Man to Father</p>
      <h1 className="text-2xl font-black tracking-tight mb-8">
        {state.name ? `${state.name}, here's the truth.` : "Here's the truth."}
      </h1>

      {/* Ring */}
      <ReadinessRing total={state.total} byCategory={state.byCategory} size={240} />

      {/* Band */}
      <div
        className={`text-center mt-8 transition-opacity duration-700 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-muted-foreground mb-1">Build status</p>
        <h2 className="text-2xl md:text-3xl font-black gold-text mb-2">{band.name}</h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">{band.copy(state.weeksRemaining)}</p>
      </div>

      {/* Category bars, worst first */}
      <div
        className={`w-full max-w-md mt-10 space-y-3 transition-opacity duration-700 ${phase >= 2 ? "opacity-100" : "opacity-0"}`}
      >
        {sorted.map((cat) => {
          const score = state.byCategory[cat.slug] ?? 0;
          return (
            <div key={cat.slug}>
              <div className="flex justify-between text-xs font-bold tracking-wider mb-1">
                <span className={cat.slug === state.weakest ? "text-destructive" : "text-foreground"}>
                  {cat.name}
                </span>
                <span className="text-muted-foreground">{score}/10</span>
              </div>
              <div className="compliance-bar w-full">
                <div
                  className="compliance-fill"
                  style={{ width: `${(score / 10) * 100}%`, transition: "width 0.8s ease" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div
        className={`w-full max-w-md mt-10 text-center transition-opacity duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-lg font-bold mb-1">{ctaHeadline}</p>
          <p className="text-muted-foreground text-sm mb-5">
            Here's the plan: your training track ({state.track}), weekly missions, and men on your exact countdown.
          </p>
          <Button
            onClick={handleCta}
            className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl"
          >
            {user ? "Open My Plan" : "Start The Build"} <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-muted-foreground text-xs mt-3">
            Your full breakdown is on its way to your inbox.
          </p>
        </div>
      </div>
    </div>
  );
}
