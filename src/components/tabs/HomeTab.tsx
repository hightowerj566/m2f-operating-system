// M2F OS · Home v2 — rebuilt per the member-experience audit.
// Hierarchy: countdown hero → one-sentence phase brief → THE mission →
// today's remaining standards (3 max) → Ask Her Tonight → slim secondary rows.

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dumbbell, ClipboardCheck, RefreshCw, ChevronRight, Target, Check, Users,
  Hammer, Heart, MessageCircle, CalendarRange, BookOpen,
} from "lucide-react";
import { ReadinessRing } from "@/components/ReadinessRing";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useWeeklyMission, useCompleteMission } from "@/hooks/useMissions";
import { cohortMonthFromDueDate, cohortName, useCohortMemberCount } from "@/hooks/useM2fOs";
import { useBuildList, applyMilestoneBoost, surfaceMilestones } from "@/hooks/useBuildList";
import { getPhase, daysRemaining as calcDaysRemaining, pregnancyWeek, phaseBrief } from "@/lib/phases";
import { askHerTonight } from "@/content/fatherhood";
import { CATEGORIES, countdownParts, daysAsDad } from "@/lib/readiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const COHORT_MIN_MEMBERS = 10; // audit: hide the cohort until it's a room, not a hallway

interface HomeTabProps {
  onOpenWorkout: () => void;
  onOpenStandards: () => void;
  programName?: string | null;
}

export function HomeTab({ onOpenWorkout, onOpenStandards, programName }: HomeTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useLatestReadiness(user?.id);
  const { data: buildMilestones = [] } = useBuildList(user?.id);

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

  const weakestForMission = byCategory
    ? [...CATEGORIES].sort((a, b) => (byCategory[a.slug] ?? 0) - (byCategory[b.slug] ?? 0))[0]
    : null;
  const { data: weeklyMission } = useWeeklyMission(user?.id, weakestForMission?.id);
  const completeMission = useCompleteMission(user?.id);

  const nextMilestone = surfaceMilestones(buildMilestones, phase && phase.id <= 5 ? phase.id : 5, 1)[0];
  const builtCount = buildMilestones.filter((m) => m.completed).length;

  const myCohortMonth = cohortMonthFromDueDate(data?.dueDate);
  const myCohortName = cohortName(myCohortMonth);
  const { data: cohortCount = 0 } = useCohortMemberCount(myCohortMonth);

  // Today's remaining standards — the 3 that matter now
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

  return (
    <div className="px-5 pt-8 pb-28">
      {/* ── HERO: THE CLOCK ── */}
      <div className="text-center mb-6">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
          Man to Father
        </p>
        {dadDays != null ? (
          <>
            <h1 className="text-6xl font-black tracking-tight text-foreground leading-none">DAY {dadDays}</h1>
            <p className="text-muted-foreground mt-2">
              of being {data?.babyName ? `${data.babyName}'s` : "her"} dad
            </p>
          </>
        ) : countdown ? (
          <>
            <h1 className="text-6xl font-black tracking-tight text-foreground leading-none">
              {countdown.weeks}
              <span className="text-2xl font-bold text-muted-foreground ml-2">WKS</span>{" "}
              {countdown.days}
              <span className="text-2xl font-bold text-muted-foreground ml-2">DAYS</span>
            </h1>
            <p className="text-muted-foreground mt-2">until everything changes</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-black tracking-tight text-foreground">THE CLOCK ISN'T SET</h1>
            <p className="text-muted-foreground mt-2 mb-4">
              M2F runs on one date. Ninety seconds of setup and the whole system comes alive.
            </p>
            <Button onClick={() => navigate("/start")} className="gold-gradient text-primary-foreground font-bold rounded-xl px-8">
              Start The Build <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* ── ONE-SENTENCE PHASE BRIEF (replaces the chip) ── */}
      {phase && (
        <p className="text-center text-sm text-foreground/90 leading-relaxed mb-6 max-w-sm mx-auto">
          <span className="font-bold text-primary">{phaseBrief(phase, days).split(" — ")[0]}</span>
          {" — "}
          {phase.hisJob}
        </p>
      )}

      {/* ── THE SCORE ── */}
      <div className="flex flex-col items-center mb-8">
        {latest ? (
          <>
            <ReadinessRing
              total={liveScore ? liveScore.total : latest.total_score}
              byCategory={liveScore ? liveScore.byCategory : byCategory}
              size={190}
            />
            <div className="flex items-center gap-2 mt-3">
              {liveScore && liveScore.boost > 0 && (
                <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  +{liveScore.boost} verified
                </span>
              )}
              {delta != null && delta !== 0 && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${delta > 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                  {delta > 0 ? `+${delta}` : delta} vs last test
                </span>
              )}
              <button onClick={() => navigate("/readiness")} className="text-muted-foreground text-[10px] flex items-center gap-1 hover:text-foreground transition-colors">
                <RefreshCw className="w-3 h-3" /> Re-test
              </button>
            </div>
          </>
        ) : user && !isLoading ? (
          <div className="w-full bg-card border border-border rounded-2xl p-5 text-center">
            <p className="font-bold mb-1">No Readiness Score yet</p>
            <p className="text-muted-foreground text-sm mb-3">Seven categories. One number. Two minutes.</p>
            <Button onClick={() => navigate("/readiness")} className="gold-gradient text-primary-foreground font-bold rounded-xl px-6">
              Get My Score <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── THE MISSION (the one thing) ── */}
      {weeklyMission && (
        <div className="bg-card border border-primary/40 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">
              This Week's Mission · {CATEGORIES.find((c) => c.id === weeklyMission.mission.category_id)?.name}
            </p>
          </div>
          <p className="font-bold text-foreground mb-1">{weeklyMission.mission.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{weeklyMission.mission.directive}</p>
          {weeklyMission.status === "completed" ? (
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
              <Check className="w-4 h-4" /> Done. New one drops Monday.
            </div>
          ) : (
            <Button onClick={() => completeMission(weeklyMission.id)} size="sm" className="gold-gradient text-primary-foreground font-bold rounded-lg">
              Mark Complete <Check className="ml-1 w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* ── TODAY'S STANDARDS (3 max) ── */}
      {user && standardsToday && standardsToday.total > 0 && (
        <button onClick={onOpenStandards} className="w-full bg-card border border-border rounded-2xl p-4 mb-3 text-left hover:border-primary transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> Today's Standards
            </p>
            <span className="text-[10px] font-bold text-primary">{standardsToday.done}/{standardsToday.total}</span>
          </div>
          {standardsToday.next.length === 0 ? (
            <p className="text-sm font-bold text-primary">All held. That's the standard. ✓</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {standardsToday.next.map((s: any) => (
                <span key={s.id} className="text-xs bg-secondary px-2.5 py-1 rounded-full text-foreground/90">
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
          )}
        </button>
      )}

      {/* ── ASK HER TONIGHT ── */}
      {user && !arrived && data?.dueDate && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
            Ask {partnerName || "her"} tonight
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed italic">"{prompt}"</p>
        </div>
      )}

      {/* ── SECONDARY ROWS ── */}
      <div className="space-y-2 mt-5">
        <SlimRow icon={Dumbbell} label="Today's Training" sub={phase ? phase.trainingGuidance : programName || ""} onClick={onOpenWorkout} />
        {user && buildMilestones.length > 0 && (
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
        {user && (
          <SlimRow icon={Target} label="Weekly Review" sub="The Sunday scoreboard" onClick={() => navigate("/week-review")} />
        )}
        {myCohortName && cohortCount >= COHORT_MIN_MEMBERS && (
          <SlimRow icon={Users} label={myCohortName} sub={`${cohortCount} men on your exact countdown`} onClick={() => navigate("/cohort")} />
        )}
      </div>
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
    <button onClick={onClick} className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 text-left hover:border-primary transition-colors">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-sm truncate">{label}</span>
        {sub && <span className="block text-xs text-muted-foreground truncate">{sub}</span>}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
