// M2F OS · Home — command center matching the Operating System mockup.
// Header (logo · title · avatar) → greeting + countdown hero → 3 numbered cards
// (Today / Progress / Next) → horizontal Deeper Tools row.

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLatestReadiness } from "@/hooks/useReadiness";
import {
  Dumbbell, CheckCircle2, MessageSquare, Home as HomeIcon, ChevronRight, ChevronDown,
  ArrowRight, Flame, Users, Calendar, Star, Clock, Utensils, BookOpen,
  Heart, TrendingUp, User, Check,

} from "lucide-react";
import { useWeeklyMission } from "@/hooks/useMissions";
import { useBuildList, applyMilestoneBoost, surfaceMilestones } from "@/hooks/useBuildList";
import { getPhase, daysRemaining as calcDaysRemaining, pregnancyWeek } from "@/lib/phases";
import { askHerTonight } from "@/content/fatherhood";
import { CATEGORIES, daysAsDad } from "@/lib/readiness";

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

export function HomeTab({
  onOpenToday, onOpenProgress, onOpenMacros, onOpenMore, programName,
}: HomeTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useLatestReadiness(user?.id);
  const { data: buildMilestones = [] } = useBuildList(user?.id);
  const [expanded, setExpanded] = useState<null | "standards" | "ask">(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const days = calcDaysRemaining(data?.dueDate);
  const arrived = !!data?.babyArrivedAt;
  const phase = getPhase(days, arrived);
  const week = pregnancyWeek(days);
  const dadDays = daysAsDad(data?.babyArrivedAt);

  const latest = data?.latest ?? null;
  const byCategory = latest?.byCategory;
  const liveScore = byCategory ? applyMilestoneBoost(byCategory, buildMilestones) : null;
  const delta =
    latest && data?.previousTotal != null ? latest.total_score - data.previousTotal : null;
  const readinessScore = liveScore ? liveScore.total : latest?.total_score ?? null;

  const weakestForMission = byCategory
    ? [...CATEGORIES].sort((a, b) => (byCategory[a.slug] ?? 0) - (byCategory[b.slug] ?? 0))[0]
    : null;
  const { data: weeklyMission } = useWeeklyMission(user?.id, weakestForMission?.id);

  const nextMilestone = surfaceMilestones(buildMilestones, phase && phase.id <= 5 ? phase.id : 5, 1)[0];
  const nextOpenBuild = buildMilestones.find((m) => !m.completed) ?? null;
  const builtCount = buildMilestones.filter((m) => m.completed).length;
  const buildPct = buildMilestones.length > 0 ? Math.round((builtCount / buildMilestones.length) * 100) : 0;

  // Profile: first name + partner
  const { data: profile } = useQuery({
    queryKey: ["home-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: p } = await db
        .from("profiles")
        .select("display_name, first_name, name, partner_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return p as { display_name?: string; first_name?: string; name?: string; partner_name?: string } | null;
    },
  });

  const rawName =
    profile?.first_name || profile?.display_name || profile?.name ||
    user?.email?.split("@")[0] || "Dad";
  const firstName = rawName.split(" ")[0];
  const greetPrefix = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // Today's standards
  const today = new Date().toISOString().slice(0, 10);
  const standardsKey = ["home-standards", user?.id, today];
  const { data: standardsToday } = useQuery({
    queryKey: standardsKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: defs }, { data: log }, { data: prefs }] = await Promise.all([
        db.from("standard_definitions")
          .select("id, key, label, emoji, is_global, target_user_id, is_active, sort_order")
          .eq("is_active", true)
          .or(`is_global.eq.true,target_user_id.eq.${user!.id}`)
          .order("sort_order"),
        db.from("daily_standards").select("id, completions").eq("user_id", user!.id).eq("standard_date", today).maybeSingle(),
        db.from("user_standard_prefs").select("standard_definition_id, enabled").eq("user_id", user!.id),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const disabled = new Set((prefs ?? []).filter((p: any) => p.enabled === false).map((p: any) => p.standard_definition_id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active = (defs ?? []).filter((d: any) => !disabled.has(d.id));
      const completions = (log?.completions ?? {}) as Record<string, boolean>;
      const done = active.filter((d: { key: string }) => completions[d.key]).length;
      return {
        total: active.length,
        done,
        logId: log?.id ?? null,
        completions,
        items: active as Array<{ id: string; key: string; label: string; emoji: string | null }>,
      };
    },
  });

  const toggleStandard = async (key: string) => {
    if (!user || !standardsToday || savingKey) return;
    setSavingKey(key);
    const newCompletions = { ...standardsToday.completions, [key]: !standardsToday.completions[key] };
    // Optimistic
    qc.setQueryData(standardsKey, {
      ...standardsToday,
      completions: newCompletions,
      done: standardsToday.items.filter((s) => newCompletions[s.key]).length,
    });
    const payload = {
      user_id: user.id,
      standard_date: today,
      completions: newCompletions,
      wake_on_time: !!newCompletions.wake_on_time,
      workout_completed: !!newCompletions.workout_completed,
      protein_hit: !!newCompletions.protein_hit,
      steps_hit: !!newCompletions.steps_hit,
      scripture_read: !!newCompletions.scripture_read,
      family_time: !!newCompletions.family_time,
      no_phone_at_dinner: !!newCompletions.no_phone_at_dinner,
      hydration_hit: !!newCompletions.hydration_hit,
    };
    if (standardsToday.logId) {
      await db.from("daily_standards").update(payload).eq("id", standardsToday.logId);
    } else {
      const { data: ins } = await db.from("daily_standards").insert(payload).select("id").single();
      if (ins) qc.setQueryData(standardsKey, (prev: typeof standardsToday | undefined) =>
        prev ? { ...prev, logId: ins.id } : prev);
    }
    qc.invalidateQueries({ queryKey: ["home-streak", user.id] });
    setSavingKey(null);
  };

  // Standards streak
  const { data: streak = 0 } = useQuery({
    queryKey: ["home-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: hist } = await db
        .from("daily_standards")
        .select("standard_date, completions")
        .eq("user_id", user!.id)
        .order("standard_date", { ascending: false })
        .limit(60);
      if (!hist || hist.length === 0) return 0;
      let count = 0;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      for (let i = 0; i < 60; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = hist.find((h: any) => h.standard_date === key);
        if (!entry) break;
        const doneCount = Object.values(entry.completions || {}).filter(Boolean).length;
        if (doneCount >= 3) count++;
        else break;
      }
      return count;
    },
  });

  // Workouts logged this week
  const { data: workoutsThisWeek = 0 } = useQuery({
    queryKey: ["home-workouts-week", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const { count } = await db
        .from("workout_feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", start.toISOString());
      return count || 0;
    },
  });

  // Conversations this month (mission completions this calendar month as proxy)
  const { data: conversationsMonth = 0 } = useQuery({
    queryKey: ["home-convos-month", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await db
        .from("user_missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .gte("completed_at", start.toISOString());
      return count || 0;
    },
  });

  const partnerName = profile?.partner_name ?? null;
  const prompt = askHerTonight(new Date(), partnerName);

  const standardsPct = standardsToday && standardsToday.total > 0
    ? Math.round((standardsToday.done / standardsToday.total) * 100)
    : 0;
  // Day completion = standards progress + workout logged today
  const dayCompletion = Math.round((standardsPct + (workoutsThisWeek > 0 ? 100 : 0)) / 2);
  const standardsExpanded = expanded === "standards";
  const askExpanded = expanded === "ask";

  const bigDays = arrived ? dadDays ?? 0 : days ?? 0;
  const bigLabel = arrived ? "DAYS IN" : "DAYS";
  const bigSub = arrived ? "since everything changed" : "until everything changes";

  const workoutName = phase ? phase.trainingGuidance.split(",")[0] : programName || "Rest & recover";

  return (
    <div className="pb-nav">
      {/* ── HEADER ROW ── */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <div className="flex items-baseline gap-0 font-black tracking-tight text-lg leading-none">
          <span className="text-foreground">M2</span>
          <span className="text-primary">F</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight text-center max-w-[140px]">
          Man to Father<br />Operating System
        </p>
        <button
          onClick={onOpenMore}
          aria-label="Profile"
          className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden"
        >
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── COUNTDOWN HERO ── */}
      <div className="px-5 pt-6">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-muted-foreground mb-2">
          {greetPrefix}, {firstName}
        </p>
        <h1 className="font-black tracking-tight leading-none text-[68px]">
          <span className="text-foreground">{bigDays}</span>
          <span className="text-primary ml-2 text-[40px] align-top relative top-3">{bigLabel}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{bigSub}</p>
        <div className="mt-4 border-l-2 border-primary pl-3">
          <p className="text-sm text-foreground/90 leading-snug">
            Your job today: become 1% more prepared than yesterday.
          </p>
        </div>
      </div>

      {/* ── 3 COMMAND CARDS ── */}
      <div className="px-5 pt-6 space-y-4">
        {/* CARD 1 · TODAY (blue) */}
        <NumberedCard
          n={1}
          title="TODAY"
          subtitle="Your plan for today"
          ctaLabel="Open Today"
          onCta={onOpenToday}
          tone="blue"
        >
          <ul className="divide-y divide-border/60">
            <TodayRow
              icon={<Dumbbell className="w-4 h-4 text-primary" />}
              label="Workout"
              value={workoutName}
              onClick={onOpenToday}
            />
            <TodayRow
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              label="Daily Standards"
              value={standardsToday ? `${standardsToday.done} / ${standardsToday.total}` : "—"}
              valueClassName="text-emerald-400 font-bold"
              expanded={standardsExpanded}
              onClick={() => setExpanded(standardsExpanded ? null : "standards")}
            />
            {standardsExpanded && standardsToday && (
              <li className="py-2 space-y-1">
                {standardsToday.items.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2">No standards configured yet.</p>
                )}
                {standardsToday.items.map((s) => {
                  const checked = !!standardsToday.completions[s.key];
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStandard(s.key)}
                      disabled={savingKey === s.key}
                      className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/40 transition-colors text-left disabled:opacity-60"
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-emerald-500 border-emerald-500" : "border-border"}`}>
                        {checked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                      </span>
                      {s.emoji && <span className="text-sm">{s.emoji}</span>}
                      <span className={`text-sm flex-1 truncate ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </li>
            )}
            <TodayRow
              icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
              label="Ask Her Tonight"
              value={arrived ? "Check in with her" : "Tonight's question"}
              expanded={askExpanded}
              onClick={() => setExpanded(askExpanded ? null : "ask")}
            />
            {askExpanded && !arrived && (
              <li className="py-3 px-2">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-400 mb-2">
                  Ask {partnerName || "her"} tonight
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed italic mb-3">"{prompt}"</p>
                <button
                  onClick={() => navigate("/her-and-baby")}
                  className="text-xs font-bold text-purple-400 flex items-center gap-1"
                >
                  See her & baby this week <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            )}
            <TodayRow
              icon={<HomeIcon className="w-4 h-4 text-amber-400" />}
              label="Build Task"
              value={nextOpenBuild?.title ?? (buildMilestones.length ? "All built ✓" : "Set your list")}
              onClick={() => navigate("/build-list")}
            />
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground shrink-0">
              Day Completion
            </p>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${dayCompletion}%` }} />
            </div>
            <p className="text-sm font-black text-foreground tabular-nums">{dayCompletion}%</p>
          </div>
        </NumberedCard>

        {/* CARD 2 · PROGRESS (green) */}
        <NumberedCard
          n={2}
          title="PROGRESS"
          subtitle="You vs. yesterday"
          ctaLabel="View Progress"
          onCta={onOpenProgress}
          tone="green"
        >
          <div className="grid grid-cols-5 gap-2 pt-1">
            <ProgressStat
              value={readinessScore != null ? `${readinessScore}%` : "—"}
              label="Readiness"
              accent={delta != null && delta !== 0 ? (delta > 0 ? `+${delta}% this week` : `${delta}% this week`) : undefined}
              accentPositive={delta != null && delta > 0}
              icon={<span className="inline-block w-8 h-8 rounded-full border-2 border-emerald-400/70" />}
            />
            <ProgressStat
              value={`${streak}`}
              label="Day Streak"
              icon={<Flame className="w-5 h-5 text-amber-400" />}
            />
            <ProgressStat
              value={`${workoutsThisWeek} / ${phase ? 5 : 4}`}
              label="Workouts"
              sub="This Week"
              icon={<Dumbbell className="w-5 h-5 text-emerald-400" />}
            />
            <ProgressStat
              value={`${buildPct}%`}
              label="Build List"
              sub={buildMilestones.length ? `${builtCount} / ${buildMilestones.length} done` : "—"}
              icon={<HomeIcon className="w-5 h-5 text-amber-400" />}
            />
            <ProgressStat
              value={`${conversationsMonth}`}
              label="Conversations"
              sub="This Month"
              icon={<Users className="w-5 h-5 text-primary" />}
            />
          </div>
        </NumberedCard>

        {/* CARD 3 · NEXT (purple) */}
        <NumberedCard
          n={3}
          title="NEXT"
          subtitle="What's coming up"
          ctaLabel="See Road Ahead"
          onCta={() => navigate("/plan")}
          tone="purple"
        >
          <div className="grid grid-cols-3 gap-3">
            <NextCol
              icon={<Calendar className="w-4 h-4 text-purple-400" />}
              eyebrow="Next Milestone"
              headline={week ? `Week ${week + 1}` : phase ? phase.name : "—"}
              sub={nextMilestone?.title ?? "Baby's development continues."}
            />
            <NextCol
              icon={<Star className="w-4 h-4 text-purple-400" />}
              eyebrow="Focus"
              headline={weeklyMission?.mission?.title ?? (phase ? phase.name : "Foundation")}
              sub={weakestForMission ? `Category: ${weakestForMission.name}` : "Hold the standard."}
            />
            <NextCol
              icon={<Clock className="w-4 h-4 text-purple-400" />}
              eyebrow="Days Remaining"
              headline={arrived ? `Day ${dadDays}` : `${days ?? "—"}`}
              sub={arrived ? "The best part is now." : "Stay consistent. Finish strong."}
            />
          </div>
        </NumberedCard>
      </div>

      {/* ── DEEPER TOOLS ── */}
      <div className="px-5 pt-8">
        <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-muted-foreground mb-3">
          Deeper Tools
        </p>
        <div className="grid grid-cols-5 gap-2">
          <ToolButton icon={Utensils} label="Nutrition" onClick={onOpenMacros ?? onOpenMore ?? (() => {})} />
          <ToolButton icon={Dumbbell} label="Programs" onClick={onOpenMore ?? (() => {})} />
          <ToolButton icon={TrendingUp} label="Readiness" onClick={() => navigate("/readiness")} />
          <ToolButton icon={Heart} label="Coach" onClick={() => navigate("/coach")} />
          <ToolButton icon={BookOpen} label="Learn" onClick={() => navigate("/plan")} />


        </div>
      </div>
    </div>
  );
}

/* ─────────────── Components ─────────────── */

type Tone = "blue" | "green" | "purple";
const TONE: Record<Tone, { border: string; bg: string; badge: string; cta: string; ctaText: string }> = {
  blue: {
    border: "border-primary/40",
    bg: "bg-gradient-to-b from-primary/10 to-transparent",
    badge: "bg-primary text-primary-foreground",
    cta: "border-primary/60 hover:border-primary",
    ctaText: "text-primary",
  },
  green: {
    border: "border-emerald-500/40",
    bg: "bg-gradient-to-b from-emerald-500/10 to-transparent",
    badge: "bg-emerald-500 text-black",
    cta: "border-emerald-500/60 hover:border-emerald-400",
    ctaText: "text-emerald-400",
  },
  purple: {
    border: "border-purple-500/40",
    bg: "bg-gradient-to-b from-purple-500/10 to-transparent",
    badge: "bg-purple-500 text-white",
    cta: "border-purple-500/60 hover:border-purple-400",
    ctaText: "text-purple-400",
  },
};

function NumberedCard({
  n, title, subtitle, ctaLabel, onCta, tone, children,
}: {
  n: number; title: string; subtitle: string; ctaLabel: string;
  onCta: () => void; tone: Tone; children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <section className={`rounded-2xl border ${t.border} ${t.bg} bg-card/60 backdrop-blur p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-8 h-8 rounded-full ${t.badge} flex items-center justify-center font-black text-sm shrink-0`}>
            {n}
          </span>
          <div className="min-w-0">
            <h2 className="font-black text-foreground tracking-tight text-base leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onCta}
          className={`shrink-0 h-9 px-3 rounded-lg border ${t.cta} ${t.ctaText} text-xs font-bold flex items-center gap-1.5 transition-colors`}
        >
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </section>
  );
}

function TodayRow({
  icon, label, value, valueClassName, onClick, expanded,
}: {
  icon: React.ReactNode; label: string; value: string; valueClassName?: string;
  onClick?: () => void; expanded?: boolean;
}) {
  const Chevron = expanded === undefined ? ChevronRight : (expanded ? ChevronDown : ChevronRight);
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 py-3 text-left min-h-[48px]"
      >
        <span className="w-6 flex justify-center shrink-0">{icon}</span>
        <span className="font-bold text-sm text-foreground flex-1 truncate">{label}</span>
        <span className={`text-sm text-muted-foreground truncate max-w-[45%] text-right ${valueClassName ?? ""}`}>
          {value}
        </span>
        <Chevron className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    </li>
  );
}

function ProgressStat({
  value, label, sub, accent, accentPositive, icon,
}: {
  value: string; label: string; sub?: string;
  accent?: string; accentPositive?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1 min-w-0">
      <div className="h-6 flex items-center justify-center">{icon}</div>
      <p className="text-lg font-black text-foreground leading-none tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold text-foreground/90 leading-tight truncate w-full">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground leading-tight truncate w-full">{sub}</p>}
      {accent && (
        <p className={`text-[9px] font-bold leading-tight ${accentPositive ? "text-emerald-400" : "text-destructive"}`}>
          {accent}
        </p>
      )}
    </div>
  );
}

function NextCol({
  icon, eyebrow, headline, sub,
}: { icon: React.ReactNode; eyebrow: string; headline: string; sub: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-purple-400 truncate">{eyebrow}</p>
      </div>
      <p className="font-black text-foreground text-sm leading-tight mb-1">{headline}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
    </div>
  );
}

function ToolButton({
  icon: Icon, label, onClick,
}: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
    >
      <Icon className="w-4 h-4 text-foreground/80" />
      <span className="text-[10px] font-semibold text-foreground/90">{label}</span>
    </button>
  );
}
