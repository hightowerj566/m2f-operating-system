// M2F OS · Home — Daily Briefing.
// One screen answers 5 questions: how long until baby, how prepared am I,
// what do I do today, what should I learn, what's next. Nothing else.

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, applyMilestoneBoost, surfaceMilestones } from "@/hooks/useBuildList";
import { getPhase, daysRemaining as calcDaysRemaining, pregnancyWeek } from "@/lib/phases";
import { askHerTonight } from "@/content/fatherhood";
import { recommendedForWeek } from "@/content/learn";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import m2fLogo from "@/assets/m2f-logo.png.asset.json";
import { Countdown } from "@/components/home/Countdown";
import { weeklyContent } from "@/content/weeklyPregnancy";
import {
  ArrowRight, Check, ChevronRight, Dumbbell, Flame, MessageSquare,
  Home as HomeIcon, Sparkles, BookOpen, Baby, User, Utensils, Heart, Calculator,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface HomeTabProps {
  onOpenToday: () => void;
  onOpenProgress: () => void;
  onOpenWorkout: () => void;
  onOpenStandards: () => void;
  onOpenMacros?: () => void;
  onOpenMore?: () => void;
  programName?: string | null;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function HomeTab({ onOpenToday, onOpenMore, onOpenMacros }: HomeTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useLatestReadiness(user?.id);
  const { data: buildMilestones = [] } = useBuildList(user?.id);
  const { completed: completedLessons, markViewed } = useLearnProgress();

  const days = calcDaysRemaining(data?.dueDate);
  const arrived = !!data?.babyArrivedAt;
  const phase = getPhase(days, arrived);
  const week = pregnancyWeek(days);
  const babyName = data?.babyName ?? null;

  // Readiness score + delta
  const latest = data?.latest ?? null;
  const byCategory = latest?.byCategory;
  const live = byCategory ? applyMilestoneBoost(byCategory, buildMilestones) : null;
  const readinessRaw = live ? live.total : latest?.total_score ?? null;
  const readinessPct = readinessRaw != null ? Math.round((readinessRaw / 70) * 100) : null;
  const prevPct = data?.previousTotal != null ? Math.round((data.previousTotal / 70) * 100) : null;
  const delta = readinessPct != null && prevPct != null ? readinessPct - prevPct : null;

  // Profile (first name + partner)
  const { data: profile } = useQuery({
    queryKey: ["home-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: p } = await db
        .from("profiles")
        .select("display_name, partner_name")
        .eq("user_id", user!.id).maybeSingle();
      return p as { display_name?: string; partner_name?: string } | null;
    },
  });
  const queryClient = useQueryClient();
  const rawName = profile?.display_name || "";
  const looksLikeEmail = /@/.test(rawName);
  const hasRealName = !!rawName && !looksLikeEmail;
  const firstName = hasRealName ? rawName.split(" ")[0] : "Dad";
  const partnerName = profile?.partner_name ?? null;

  const promptForName = async () => {
    if (!user?.id) return;
    const entered = window.prompt("What's your first name?", hasRealName ? firstName : "");
    const trimmed = entered?.trim();
    if (!trimmed) return;
    const { error } = await db.from("profiles").update({ display_name: trimmed }).eq("user_id", user.id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["home-profile", user.id] });
  };

  // Macro targets — mission complete once user has set up nutrition
  const { data: hasMacros = false } = useQuery({
    queryKey: ["home-has-macros", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await db
        .from("macro_targets")
        .select("calories")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data?.calories;
    },
  });

  // Mission 1: Workout logged today (via workout_feedback)
  const { data: workoutDoneToday = false } = useQuery({
    queryKey: ["home-workout-today", user?.id, todayISO()],
    enabled: !!user?.id,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { count } = await db.from("workout_feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", start.toISOString());
      return (count || 0) > 0;
    },
  });

  // Per-day mission toggle overrides (allows user to check/uncheck any mission)
  const overrideKey = (key: string) => `m2f.mission.${key}.${todayISO()}`;
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    ["workout", "nutrition", "ask", "build"].forEach((k) => {
      next[k] = localStorage.getItem(overrideKey(k)) === "1";
    });
    setOverrides(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleOverride = (key: string) => {
    setOverrides((prev) => {
      const nextVal = !prev[key];
      if (nextVal) localStorage.setItem(overrideKey(key), "1");
      else localStorage.removeItem(overrideKey(key));
      return { ...prev, [key]: nextVal };
    });
  };

  const askDone = overrides.ask === true;
  const nutriDone = overrides.nutrition === true;
  const prompt = askHerTonight(new Date(), partnerName);
  const openNutrition = () => {
    if (!nutriDone) toggleOverride("nutrition");
    if (onOpenMacros) onOpenMacros();
    else onOpenMore?.();
  };

  // Mission 4: Next open build task
  const nextBuild = buildMilestones.find((m) => !m.completed) ?? null;
  const buildDone = !nextBuild;

  const workoutEffectiveDone = workoutDoneToday || overrides.workout === true;
  const buildEffectiveDone = !nextBuild || overrides.build === true;

  const missions = [
    ...(!hasMacros
      ? [{
          key: "set-macros",
          icon: Calculator,
          title: "Set your macros",
          done: false,
          onClick: () => (onOpenMacros ? onOpenMacros() : onOpenMore?.()),
          detail: "Dial in calories & your rate of loss/gain",
        }]
      : []),
    {
      key: "workout",
      icon: Dumbbell,
      title: workoutEffectiveDone ? "Workout complete" : "Complete today's workout",
      done: workoutEffectiveDone,
      onClick: onOpenToday,
    },
    {
      key: "nutrition",
      icon: Utensils,
      title: nutriDone ? "Nutrition logged" : "Log today's nutrition",
      done: nutriDone,
      onClick: openNutrition,
    },
    {
      key: "ask",
      icon: MessageSquare,
      title: askDone
        ? `You asked ${partnerName || "her"} tonight's question`
        : `Ask ${partnerName || "her"} tonight's question`,
      done: askDone,
      onClick: () => navigate("/her-and-baby"),
      detail: askDone ? undefined : `"${prompt}"`,
    },
    {
      key: "build",
      icon: HomeIcon,
      title: buildEffectiveDone ? "Build list complete" : (nextBuild?.title ?? "Set your build list"),
      done: buildEffectiveDone,
      onClick: () => navigate("/build-list"),
    },
  ];
  const missionsDone = missions.filter((m) => m.done).length;
  const allMissionsDone = missionsDone === missions.length;

  // Celebration one-shot per day
  const celebKey = `m2f.celebrated.${todayISO()}`;
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (allMissionsDone && localStorage.getItem(celebKey) !== "1") {
      localStorage.setItem(celebKey, "1");
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2600);
      return () => clearTimeout(t);
    }
  }, [allMissionsDone, celebKey]);

  // Today's lesson — one, based on pregnancy week (or earliest gap)
  const todaysLesson = useMemo(() => {
    const rec = recommendedForWeek(week ?? null, 8);
    return rec.find((l) => !completedLessons.has(l.slug)) ?? rec[0] ?? null;
  }, [week, completedLessons]);

  // Streak (mission-completion streak: at least one of the 3 done)
  const { data: streak = 0 } = useQuery({
    queryKey: ["home-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: hist } = await db
        .from("daily_standards")
        .select("standard_date, completions")
        .eq("user_id", user!.id)
        .order("standard_date", { ascending: false })
        .limit(90);
      if (!hist?.length) return 0;
      let count = 0;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      for (let i = 0; i < 90; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = hist.find((h: any) => h.standard_date === key);
        if (!entry) break;
        const doneCount = Object.values(entry.completions || {}).filter(Boolean).length;
        if (doneCount >= 1) count++;
        else break;
      }
      return count;
    },
  });

  const { data: totalMissionsCompleted = 0 } = useQuery({
    queryKey: ["home-total-missions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await db
        .from("user_missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "completed");
      return count || 0;
    },
  });

  // Next milestone
  const nextMilestone = surfaceMilestones(buildMilestones, phase && phase.id <= 5 ? phase.id : 5, 1)[0];
  const milestoneLabel = nextMilestone?.title ?? (phase ? `${phase.name} · ${phase.focus}` : "Set your due date");
  const milestoneWhen = week ? `Week ${(week ?? 0) + 1}` : phase?.window ?? "";

  // Header greeting + readiness status
  const statusLine = arrived
    ? "Father mode. Steady wins."
    : (delta != null && delta > 0)
      ? "You're on track."
      : (readinessPct != null && readinessPct >= 60)
        ? "You're on track."
        : "One step today.";

  return (
    <div className="pb-nav">
      {/* Celebration flash */}
      {celebrate && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-24">
          <div className="animate-in fade-in zoom-in duration-500 bg-card border border-primary/50 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="font-black text-foreground text-sm">Day complete.</p>
              <p className="text-xs text-muted-foreground">You showed up. That's the work.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Minimal header ── */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <img src={m2fLogo.url} alt="M2F" className="h-9 w-auto object-contain" />

        <button
          onClick={onOpenMore}
          aria-label="Profile"
          className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center"
        >
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── 1 · Emotional Countdown Header ── */}
      <div className="px-5 pt-8">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-muted-foreground mb-3">
          Good to see you,{" "}
          <button
            onClick={promptForName}
            className={`underline-offset-2 ${hasRealName ? "hover:underline" : "underline text-primary"}`}
          >
            {hasRealName ? firstName : "add your name"}
          </button>
        </p>
        <Countdown
          days={days}
          arrived={arrived}
          babyArrivedAt={data?.babyArrivedAt}
          week={week}
          babyName={babyName}
          firstName={firstName}
        />
      </div>

      {/* ── 2 · Father Readiness Ring ── */}
      <button
        onClick={() => navigate(latest ? "/readiness" : "/readiness/assessment")}
        className="w-full text-left px-5 pt-8"
      >
        <div className={`rounded-2xl border ${latest ? "border-border" : "border-primary/50"} bg-card/60 backdrop-blur p-5 flex items-center gap-5 active:scale-[0.99] transition-transform`}>
          <ReadinessRing pct={readinessPct ?? 0} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-1">
              Father Readiness
            </p>
            {latest ? (
              <>
                <p className="font-black text-foreground text-2xl leading-none">
                  {readinessPct}%
                </p>
                {delta != null && delta !== 0 && (
                  <p className={`text-xs font-bold mt-2 ${delta > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {delta > 0 ? `↑ +${delta}% this week` : `↓ ${delta}% this week`}
                  </p>
                )}
                {delta == null && (
                  <p className="text-xs text-muted-foreground mt-2">Tap for the full breakdown</p>
                )}
              </>
            ) : (
              <>
                <p className="font-black text-foreground text-lg leading-tight">
                  Ready to see where you stand?
                </p>
                <p className="text-xs font-bold text-primary mt-2 flex items-center gap-1">
                  Take the 2-minute assessment <ArrowRight className="w-3 h-3" />
                </p>
              </>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </button>

      {/* ── 3 · Today's Mission Card ── */}
      <div className="px-5 pt-4">
        <section className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent bg-card/60 backdrop-blur p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary">Today's Mission</p>
              <p className="text-foreground font-black text-lg leading-tight mt-0.5">
                {allMissionsDone ? "You crushed today." : "A few moves. That's it."}
              </p>
            </div>
            <p className="text-xs font-bold text-muted-foreground tabular-nums shrink-0">
              {missionsDone} of {missions.length}
            </p>
          </div>

          <ul className="space-y-2">
            {missions.map((m) => (
              <li key={m.key}>
                <div className="w-full flex items-center gap-3 py-3 px-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-left min-h-[56px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleOverride(m.key); }}
                    aria-label={m.done ? "Mark incomplete" : "Mark complete"}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      m.done ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-primary"
                    }`}
                  >
                    {m.done && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                  </button>
                  <button
                    onClick={m.onClick}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <m.icon className={`w-4 h-4 shrink-0 ${m.done ? "text-muted-foreground" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${m.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {m.title}
                      </p>
                      {m.detail && (
                        <p className="text-[11px] text-muted-foreground italic leading-snug mt-0.5 line-clamp-2">
                          {m.detail}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </li>
            ))}
          </ul>


          <button
            onClick={onOpenToday}
            className="mt-4 w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          >
            {allMissionsDone ? "Review Today" : "Start Today"} <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* ── 4 · Today's Lesson ── */}
      {todaysLesson && (
        <div className="px-5 pt-4">
          <button
            onClick={() => {
              markViewed(todaysLesson.slug);
              navigate(`/learn/lesson/${todaysLesson.slug}`);
            }}
            className="w-full text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary">
                {todaysLesson.minutes}-Minute Lesson
              </p>
            </div>
            <p className="font-black text-foreground text-lg leading-tight">{todaysLesson.title}</p>
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{todaysLesson.summary}</p>
            <p className="text-xs font-bold text-primary mt-3 flex items-center gap-1">
              Start lesson <ArrowRight className="w-3 h-3" />
            </p>
          </button>
        </div>
      )}

      {/* ── 5 · Progress Streak ── */}
      <div className="px-5 pt-4">
        <button
          onClick={() => navigate("/readiness")}
          className="w-full text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex items-center gap-4 active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-foreground text-lg leading-tight">
              {streak > 0 ? `${streak}-Day Progress Streak` : "Start your streak today"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalMissionsCompleted > 0
                ? `You've completed ${totalMissionsCompleted} missions. Keep going.`
                : "One check-in today starts the streak."}
            </p>
          </div>
        </button>
      </div>

      {/* ── 6 · This Week: Baby + Mom ── */}
      {(() => {
        const wk = weeklyContent(week);
        if (arrived || !wk) return null;
        return (
          <div className="px-5 pt-4">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-purple-400">
                    Week {wk.week} · Baby
                  </p>
                </div>
                <p className="font-black text-foreground text-base leading-tight">
                  About the size of a {wk.size}.
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{wk.baby}</p>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-rose-400">
                    How to help {partnerName || "her"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  <span className="text-foreground/90">{wk.mom}</span>
                </p>
                <p className="text-sm text-foreground mt-2 leading-snug font-medium">
                  → {wk.help}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Readiness ring (pure SVG, no deps) ── */
function ReadinessRing({ pct }: { pct: number }) {
  const size = 88;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * pct));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  const dash = (display / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="hsl(var(--primary))" strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black text-foreground text-lg tabular-nums">{display}%</span>
      </div>
    </div>
  );
}
