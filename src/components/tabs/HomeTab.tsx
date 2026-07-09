// M2F OS · Home v3 — command center rebuilt around the three-decision rule.
// Above the fold: Countdown hero → 3 CommandCards (Today / Progress / Next).
// Deeper Tools sit below the fold.

import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLatestReadiness } from "@/hooks/useReadiness";
import {
  Dumbbell, ClipboardCheck, ChevronRight, Target, Check, Users,
  Hammer, Heart, MessageCircle, CalendarRange, BookOpen, Flame,
  TrendingUp, Map, Sunrise,
} from "lucide-react";
import { useWeeklyMission, useCompleteMission } from "@/hooks/useMissions";
import { cohortMonthFromDueDate, cohortName, useCohortMemberCount } from "@/hooks/useM2fOs";
import { useBuildList, applyMilestoneBoost, surfaceMilestones } from "@/hooks/useBuildList";
import { getPhase, daysRemaining as calcDaysRemaining, pregnancyWeek, phaseBrief } from "@/lib/phases";
import { askHerTonight } from "@/content/fatherhood";
import { CATEGORIES, countdownParts, daysAsDad } from "@/lib/readiness";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const COHORT_MIN_MEMBERS = 10;

interface HomeTabProps {
  onOpenToday: () => void;
  onOpenProgress: () => void;
  onOpenWorkout: () => void;
  onOpenStandards: () => void;
  programName?: string | null;
}

export function HomeTab({ onOpenToday, onOpenProgress, onOpenWorkout, onOpenStandards, programName }: HomeTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useLatestReadiness(user?.id);
  const { data: buildMilestones = [] } = useBuildList(user?.id);

  const trainingMode = data?.journey === "training" && !data?.dueDate;
  const days = calcDaysRemaining(data?.dueDate);
  const arrived = !!data?.babyArrivedAt;
  const phase = getPhase(days, arrived);
  const week = pregnancyWeek(days);
  const countdown = countdownParts(data?.dueDate);
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
  const completeMission = useCompleteMission(user?.id);

  const nextMilestone = surfaceMilestones(buildMilestones, phase && phase.id <= 5 ? phase.id : 5, 1)[0];
  const builtCount = buildMilestones.filter((m) => m.completed).length;
  const buildPct = buildMilestones.length > 0 ? Math.round((builtCount / buildMilestones.length) * 100) : 0;

  const myCohortMonth = cohortMonthFromDueDate(data?.dueDate);
  const myCohortName = cohortName(myCohortMonth);
  const { data: cohortCount = 0 } = useCohortMemberCount(myCohortMonth);

  // Today's remaining standards
  const today = new Date().toISOString().slice(0, 10);
  const { data: standardsToday } = useQuery({
    queryKey: ["home-standards", user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: defs }, { data: log }, { data: prefs }] = await Promise.all([
        db.from("standard_definitions").select("id, key, label, emoji, is_global, target_user_id, is_active, sort_order").eq("is_active", true).or(`is_global.eq.true,target_user_id.eq.${user!.id}`).order("sort_order"),
        db.from("daily_standards").select("completions").eq("user_id", user!.id).eq("date", today).maybeSingle(),
        db.from("user_standard_prefs").select("standard_definition_id, enabled").eq("user_id", user!.id),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const disabled = new Set((prefs ?? []).filter((p: any) => p.enabled === false).map((p: any) => p.standard_definition_id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active = (defs ?? []).filter((d: any) => !disabled.has(d.id));
      const completions = log?.completions ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remaining = active.filter((d: any) => !completions[d.key]);
      return { total: active.length, done: active.length - remaining.length, next: remaining.slice(0, 3) };
    },
  });

  // Standards streak (last 30d simplified)
  const { data: streak = 0 } = useQuery({
    queryKey: ["home-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: hist } = await db
        .from("daily_standards")
        .select("date, completions")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(60);
      if (!hist || hist.length === 0) return 0;
      let count = 0;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      for (let i = 0; i < 60; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = hist.find((h: any) => h.date === key);
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
      const day = start.getDay(); // 0=Sun
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const { count } = await db
        .from("workout_feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", start.toISOString());
      return count || 0;
    },
  });

  // Partner name for Ask Her Tonight header
  const { data: partnerName } = useQuery({
    queryKey: ["partner-name", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: p } = await db.from("profiles").select("partner_name").eq("user_id", user!.id).maybeSingle();
      return (p?.partner_name as string | null) ?? null;
    },
  });

  const prompt = askHerTonight(new Date(), partnerName);

  // Day completion % (workout + standards)
  const standardsPct = standardsToday && standardsToday.total > 0
    ? Math.round((standardsToday.done / standardsToday.total) * 100)
    : 0;
  const dayCompletion = Math.round((standardsPct + (workoutsThisWeek > 0 ? 100 : 0)) / 2);

  return (
    <div className="px-5 pt-8 pb-nav">
      {/* ── HERO: THE CLOCK ── */}
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase mb-3">
          Man to Father Operating System
        </p>
        {dadDays != null ? (
          <>
            <h1 className="text-6xl font-black tracking-tight text-foreground leading-none">DAY {dadDays}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              of being {data?.babyName ? `${data.babyName}'s` : "her"} dad
            </p>
          </>
        ) : countdown ? (
          <>
            <h1 className="text-6xl font-black tracking-tight text-foreground leading-none">
              {countdown.weeks}
              <span className="text-2xl font-bold text-muted-foreground ml-1">W</span>{" "}
              {countdown.days}
              <span className="text-2xl font-bold text-muted-foreground ml-1">D</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">until everything changes</p>
            <p className="text-foreground/90 mt-4 text-sm max-w-xs mx-auto leading-relaxed">
              Your job today: become 1% more prepared than yesterday.
            </p>
          </>
        ) : trainingMode ? (
          <>
            <h1 className="text-5xl font-black tracking-tight text-foreground leading-none">BUILD THE MAN</h1>
            <p className="text-muted-foreground mt-2 text-sm">{programName || "The rest can wait."}</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-black tracking-tight text-foreground">YOUR SYSTEM NEEDS A DATE</h1>
            <p className="text-muted-foreground mt-2 mb-4 text-sm">
              M2F runs on one date. Ninety seconds of setup and the whole system comes alive.
            </p>
            <Button onClick={() => navigate("/start")} className="gold-gradient text-primary-foreground font-bold rounded-xl px-8 h-12">
              Start The Build <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* ── THREE COMMAND CARDS ── */}
      <div className="space-y-3 mb-8">
        {/* CARD A · TODAY */}
        <CommandCard
          eyebrow="Today"
          title="What to do right now"
          icon={Sunrise}
          onClick={onOpenToday}
          cta="Open Today"
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Workout" value={phase ? phase.trainingGuidance.split(",")[0] : programName || "Set program"} />
            <MiniStat label="Standards" value={standardsToday ? `${standardsToday.done}/${standardsToday.total}` : "—"} />
            <MiniStat label="Mission" value={weeklyMission?.status === "completed" ? "Done ✓" : weeklyMission ? "Open" : "—"} />
            <MiniStat label="Day complete" value={`${dayCompletion}%`} />
          </div>
          {standardsToday && standardsToday.next.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 truncate">
              Next: {standardsToday.next.map((s: { emoji: string; label: string }) => `${s.emoji} ${s.label}`).join(" · ")}
            </p>
          )}
        </CommandCard>

        {/* CARD B · PROGRESS */}
        <CommandCard
          eyebrow="Progress"
          title="Am I improving?"
          icon={TrendingUp}
          onClick={onOpenProgress}
          cta="View Progress"
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              label="Father Readiness"
              value={readinessScore != null ? `${readinessScore}%` : "—"}
              accent={delta != null && delta !== 0 ? (delta > 0 ? `+${delta}` : `${delta}`) : undefined}
            />
            <MiniStat label="Standards streak" value={streak > 0 ? `${streak}d 🔥` : "—"} />
            <MiniStat label="Workouts / wk" value={`${workoutsThisWeek}`} />
            <MiniStat label="Build list" value={buildMilestones.length > 0 ? `${buildPct}%` : "—"} />
          </div>
        </CommandCard>

        {/* CARD C · NEXT */}
        <CommandCard
          eyebrow="Next"
          title="What's coming"
          icon={Map}
          onClick={() => navigate("/plan")}
          cta="See The Road Ahead"
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              label={arrived ? "Days as dad" : "Days remaining"}
              value={arrived ? `${dadDays}` : days != null ? `${days}` : "—"}
            />
            <MiniStat label="Phase" value={phase ? phase.name : trainingMode ? "Training" : "—"} />
            <MiniStat label="Week" value={week ? `${week}` : "—"} />
            <MiniStat label="Next milestone" value={nextMilestone ? nextMilestone.title : "All built"} />
          </div>
          {phase && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {phaseBrief(phase, days).split(" — ")[0]}
            </p>
          )}
        </CommandCard>
      </div>

      {/* ── MISSION (surfaced when active) ── */}
      {weeklyMission && !trainingMode && weeklyMission.status !== "completed" && (
        <div className="bg-card border border-primary/40 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">
              This Week's Mission · {CATEGORIES.find((c) => c.id === weeklyMission.mission.category_id)?.name}
            </p>
          </div>
          <p className="font-bold text-foreground mb-1">{weeklyMission.mission.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{weeklyMission.mission.directive}</p>
          <Button onClick={() => completeMission(weeklyMission.id)} size="sm" className="gold-gradient text-primary-foreground font-bold rounded-lg">
            Mark Complete <Check className="ml-1 w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── ASK HER TONIGHT ── */}
      {user && !arrived && data?.dueDate && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
            Ask {partnerName || "her"} tonight
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed italic">"{prompt}"</p>
        </div>
      )}

      {/* ── DEEPER TOOLS ── */}
      <div className="mt-2">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3 px-1">
          Deeper Tools
        </p>
        <div className="space-y-2">
          <SlimRow icon={Dumbbell} label="Today's Training" sub={phase ? phase.trainingGuidance : programName || ""} onClick={onOpenWorkout} />
          <SlimRow icon={ClipboardCheck} label="Daily Standards" sub={standardsToday ? `${standardsToday.done}/${standardsToday.total} held today` : "Hold the standard"} onClick={onOpenStandards} />
          {user && buildMilestones.length > 0 && !trainingMode && (
            <SlimRow
              icon={Hammer}
              label={`Before She Arrives · ${builtCount}/${buildMilestones.length}`}
              sub={nextMilestone ? `Next: ${nextMilestone.title}` : "Everything's built. Hold the line."}
              onClick={() => navigate("/build-list")}
            />
          )}
          {user && data?.dueDate && !arrived && (
            <SlimRow icon={Heart} label={`Her & Baby · Week ${week}`} sub="What she's feeling, what baby's doing, your move" onClick={() => navigate("/her-and-baby")} />
          )}
          {user && data?.dueDate && (
            <SlimRow icon={CalendarRange} label="The Plan" sub={days != null ? `Your next ${days} days, plotted` : "The full path"} onClick={() => navigate("/plan")} />
          )}
          {user && (arrived || (days != null && days <= 60)) && (
            <SlimRow icon={BookOpen} label={arrived ? "The First 40 Days" : "The Day One Playbook"} sub={arrived ? "The postpartum operating manual" : "What to do the moment it starts"} onClick={() => navigate("/day-one")} />
          )}
          {user && !trainingMode && (
            <SlimRow icon={Flame} label="Weekly Review" sub="The Sunday scoreboard" onClick={() => navigate("/week-review")} />
          )}
          {myCohortName && cohortCount >= COHORT_MIN_MEMBERS && (
            <SlimRow icon={Users} label={myCohortName} sub={`${cohortCount} men on your exact countdown`} onClick={() => navigate("/cohort")} />
          )}
          {trainingMode && (
            <SlimRow
              icon={Heart}
              label="Baby on the way?"
              sub="Set your due date — the full M2F system switches on"
              onClick={() => navigate("/start")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** CommandCard — one of the three major above-the-fold decisions. */
function CommandCard({
  eyebrow,
  title,
  icon: Icon,
  onClick,
  cta,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">{eyebrow}</p>
      </div>
      <h2 className="text-lg font-black text-foreground mb-4">{title}</h2>
      {children}
      <button
        onClick={onClick}
        className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
      >
        {cta} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/** MiniStat — a small labeled stat inside a CommandCard. */
function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg px-3 py-2 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-bold text-foreground truncate">
        {value}
        {accent && <span className="ml-1.5 text-[10px] text-primary font-bold">{accent}</span>}
      </p>
    </div>
  );
}

function SlimRow({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 text-left hover:border-primary transition-colors min-h-[56px]">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-sm truncate">{label}</span>
        {sub && <span className="block text-xs text-muted-foreground truncate">{sub}</span>}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
