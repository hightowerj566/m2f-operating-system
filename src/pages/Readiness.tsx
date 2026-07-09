// M2F OS · Readiness dashboard — 8 categories, overall score, top recommendation,
// weekly report link, and pregnancy timeline. Simple mapping: 7 assessment
// categories + a Nutrition score derived from macro compliance.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { countdownParts } from "@/lib/readiness";
import {
  ArrowLeft,
  Dumbbell,
  Utensils,
  Brain,
  Heart,
  Baby,
  Home as HomeIcon,
  Wallet,
  ShieldAlert,
  Sparkles,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface CategoryCard {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number | null; // 0-100
  detail: string;
  tone: string;
}

export default function Readiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);
  const [nutritionPct, setNutritionPct] = useState<number | null>(null);
  const [emergencyPct, setEmergencyPct] = useState<number | null>(null);

  // Nutrition = 30-day protein hit-rate. Emergency Prep = build_milestones
  // completion rate for "prep"/"emergency"-flavored items (best-effort fallback).
  useEffect(() => {
    if (!user) return;
    (async () => {
      const checksRes = await supabase
        .from("daily_check_ins")
        .select("actual_protein_g")
        .eq("user_id", user.id)
        .order("check_date", { ascending: false })
        .limit(30);
      const targetRes = await supabase
        .from("macro_targets")
        .select("protein_g")
        .eq("user_id", user.id)
        .maybeSingle();
      const totalRes = await supabase
        .from("build_milestones")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      const doneRes = await supabase
        .from("user_milestones")
        .select("milestone_id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const checks = checksRes.data ?? [];
      const target = targetRes.data;
      if (checks.length > 0 && target?.protein_g) {
        const hit = checks.filter(
          (c) => c.actual_protein_g && c.actual_protein_g >= target.protein_g * 0.9,
        ).length;
        setNutritionPct(Math.round((hit / checks.length) * 100));
      } else {
        setNutritionPct(null);
      }
      const total = totalRes.count ?? 0;
      const done = doneRes.count ?? 0;
      setEmergencyPct(total > 0 ? Math.round((done / total) * 100) : null);
    })();
  }, [user]);

  const byCategory = readiness?.latest?.byCategory;
  const overall = readiness?.latest?.total_score ?? null; // /70
  const overallPct = overall != null ? Math.round((overall / 70) * 100) : null;
  const prevTotal = readiness?.previousTotal ?? null;
  const trend = overall != null && prevTotal != null ? overall - prevTotal : null;

  const cards: CategoryCard[] = useMemo(() => {
    const pct = (v: number | undefined | null) => (v == null ? null : Math.round((v / 10) * 100));
    return [
      {
        key: "fitness",
        label: "Fitness",
        icon: Dumbbell,
        score: pct(byCategory?.physical),
        detail: "Training & physical capacity",
        tone: "text-blue-400",
      },
      {
        key: "nutrition",
        label: "Nutrition",
        icon: Utensils,
        score: nutritionPct,
        detail: nutritionPct != null ? "Protein target hit-rate (30d)" : "Log check-ins in Macros",
        tone: "text-green-400",
      },
      {
        key: "mindset",
        label: "Mindset",
        icon: Brain,
        score: pct(byCategory?.mindset),
        detail: "Fear, honesty, resilience",
        tone: "text-purple-400",
      },
      {
        key: "relationship",
        label: "Relationship",
        icon: Heart,
        score: pct(byCategory?.relationship),
        detail: "Partner communication & prep",
        tone: "text-pink-400",
      },
      {
        key: "fatherhood",
        label: "Fatherhood Skills",
        icon: Baby,
        score: pct(byCategory?.knowledge),
        detail: "Hospital, newborn basics",
        tone: "text-amber-400",
      },
      {
        key: "home",
        label: "Home Prep",
        icon: HomeIcon,
        score: pct(byCategory?.home),
        detail: "Nursery, hospital-day plan",
        tone: "text-teal-400",
      },
      {
        key: "finance",
        label: "Finance",
        icon: Wallet,
        score: pct(byCategory?.finances),
        detail: "Budget & first-year costs",
        tone: "text-emerald-400",
      },
      {
        key: "emergency",
        label: "Emergency Prep",
        icon: ShieldAlert,
        score: emergencyPct,
        detail:
          emergencyPct != null ? "Build List milestones done" : "Complete Build List milestones",
        tone: "text-red-400",
      },
    ];
  }, [byCategory, nutritionPct, emergencyPct]);

  const topRec = useMemo(() => {
    const scored = cards.filter((c) => c.score != null) as (CategoryCard & { score: number })[];
    if (scored.length === 0) return null;
    return scored.reduce((min, c) => (c.score < min.score ? c : min));
  }, [cards]);

  const countdown = countdownParts(readiness?.dueDate);
  const pregnancyWeek =
    countdown != null ? Math.max(1, Math.min(42, 40 - countdown.weeks)) : null;
  const trimester =
    pregnancyWeek == null ? null : pregnancyWeek <= 13 ? 1 : pregnancyWeek <= 27 ? 2 : 3;

  const hasAssessment = !!readiness?.latest;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Command Center
            </p>
            <h1 className="text-lg font-black tracking-tight">Readiness</h1>
          </div>
          <button
            onClick={() => navigate("/readiness/assessment")}
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
          >
            {hasAssessment ? "Retake" : "Assess"}
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Overall Score */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${((overallPct ?? 0) / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black leading-none">{overallPct ?? "—"}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">
                /100
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Overall Readiness
            </p>
            <p className="text-lg font-black leading-tight mt-1">
              {overall == null
                ? "Take the assessment"
                : trend == null
                ? "Baseline set"
                : trend > 0
                ? `+${trend} vs. last check`
                : trend < 0
                ? `${trend} vs. last check`
                : "Holding steady"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              8 categories · 15-question assessment · updates weekly
            </p>
          </div>
        </div>

        {/* Top recommendation */}
        {topRec && (
          <button
            onClick={() => navigate("/build-list")}
            className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
                Top Recommendation
              </p>
              <p className="text-sm font-bold leading-tight mt-0.5">
                Focus on {topRec.label} — {topRec.score}% ready
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{topRec.detail}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        )}

        {/* Small link to Daily Standards */}
        <button
          onClick={() => navigate("/daily-standards")}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center justify-between px-1 -mt-1"
        >
          <span>Log today's Daily Standards →</span>
        </button>

        {/* 8 category progress bars */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground px-1">
            Categories
          </p>
          {cards.map((c) => {
            const Icon = c.icon;
            const pct = c.score ?? 0;
            return (
              <div key={c.key} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${c.tone}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{c.label}</p>
                      <p className="text-sm font-black tabular-nums">
                        {c.score != null ? `${c.score}%` : "—"}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{c.detail}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly report */}
        <button
          onClick={() => navigate("/week-review")}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Weekly Report</p>
            <p className="text-xs text-muted-foreground">
              Review last 7 days of standards, workouts, and score movement
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Pregnancy timeline */}
        {countdown != null && pregnancyWeek != null && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  Pregnancy Timeline
                </p>
                <p className="text-lg font-black leading-tight mt-0.5">
                  Week {pregnancyWeek} · Trimester {trimester}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary leading-none">{countdown.weeks}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                  weeks left
                </p>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                style={{ width: `${(pregnancyWeek / 40) * 100}%` }}
              />
              {/* Trimester marks at 13 & 27 */}
              <div className="absolute inset-y-0 left-[32.5%] w-px bg-background/70" />
              <div className="absolute inset-y-0 left-[67.5%] w-px bg-background/70" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase">
              <span>T1</span>
              <span>T2</span>
              <span>T3</span>
              <span>Due</span>
            </div>
          </div>
        )}

        {!hasAssessment && (
          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-2">
            <p className="text-sm font-bold">No assessment yet</p>
            <p className="text-xs text-muted-foreground">
              Take the 15-question Readiness Assessment to unlock your category scores.
            </p>
            <button
              onClick={() => navigate("/readiness/assessment")}
              className="mt-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              Start Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
