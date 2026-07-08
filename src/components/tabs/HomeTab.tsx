// M2F OS · Home — the new default tab.
// Three elements, in order: the countdown, the Readiness ring, this week's stack.

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ClipboardCheck, RefreshCw, ChevronRight, Target, Check, Users, Hammer } from "lucide-react";
import { ReadinessRing } from "@/components/ReadinessRing";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useWeeklyMission, useCompleteMission } from "@/hooks/useMissions";
import { cohortMonthFromDueDate, cohortName } from "@/hooks/useM2fOs";
import { useBuildList, applyMilestoneBoost, surfaceMilestones } from "@/hooks/useBuildList";
import { getPhase, daysRemaining as calcDaysRemaining } from "@/lib/phases";
import { CATEGORIES, countdownParts, daysAsDad, type Category, type CategorySlug } from "@/lib/readiness";

interface HomeTabProps {
  onOpenWorkout: () => void;
  onOpenStandards: () => void;
  programName?: string | null;
}

export function HomeTab({ onOpenWorkout, onOpenStandards, programName }: HomeTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useLatestReadiness(user?.id);
  const weakestForMission = data?.latest?.byCategory
    ? [...CATEGORIES].sort(
        (a, b) => (data.latest!.byCategory![a.slug] ?? 0) - (data.latest!.byCategory![b.slug] ?? 0),
      )[0]
    : null;
  const { data: weeklyMission } = useWeeklyMission(user?.id, weakestForMission?.id);
  const completeMission = useCompleteMission(user?.id);
  const myCohortName = cohortName(cohortMonthFromDueDate(data?.dueDate));
  const phase = getPhase(calcDaysRemaining(data?.dueDate), !!data?.babyArrivedAt);
  const { data: buildMilestones = [] } = useBuildList(user?.id);

  const countdown = countdownParts(data?.dueDate);
  const dadDays = daysAsDad(data?.babyArrivedAt);
  const latest = data?.latest ?? null;
  const byCategory = latest?.byCategory;
  const delta =
    latest && data?.previousTotal != null ? latest.total_score - data.previousTotal : null;
  const liveScore = byCategory ? applyMilestoneBoost(byCategory, buildMilestones) : null;
  const nextMilestone = surfaceMilestones(buildMilestones, phase && phase.id <= 5 ? phase.id : 5, 1)[0];
  const builtCount = buildMilestones.filter((m) => m.completed).length;

  const weakest: Category | null = byCategory
    ? [...CATEGORIES].sort(
        (a, b) => (byCategory[a.slug] ?? 0) - (byCategory[b.slug] ?? 0),
      )[0]
    : null;

  const focusCopy: Record<CategorySlug, string> = {
    physical: "Weakest link: your body. This week's training sessions carry double weight.",
    mindset: "Weakest link: your head. Say one fear out loud this week — to her, not the mirror.",
    knowledge: "Weakest link: you don't know the playbook yet. Learn what happens at the hospital.",
    home: "Weakest link: the house isn't ready for her. Pick one thing and finish it.",
    relationship: "Weakest link: prepare WITH her, not next to her. One real conversation this week.",
    finances: "Weakest link: the numbers. Find out what year one actually costs.",
    habits: "Weakest link: your evenings. She's going to inherit your routines — build ones worth inheriting.",
  };

  return (
    <div className="px-5 pt-8 pb-28">
      {/* ── THE CLOCK ── */}
      <div className="text-center mb-8">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
          Man to Father
        </p>
        {dadDays != null ? (
          <>
            <h1 className="text-6xl font-black tracking-tight text-foreground leading-none">
              DAY {dadDays}
            </h1>
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
            {phase && (
              <span className="inline-block mt-3 text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
                {phase.name} — {phase.focus}
              </span>
            )}
          </>
        ) : (
          <>
            <h1 className="text-4xl font-black tracking-tight text-foreground">THE CLOCK ISN'T SET</h1>
            <p className="text-muted-foreground mt-2">Take the Readiness Assessment to start your countdown.</p>
          </>
        )}
      </div>

      {/* ── THE SCORE ── */}
      <div className="flex flex-col items-center mb-8">
        {latest ? (
          <>
            <ReadinessRing
              total={liveScore ? liveScore.total : latest.total_score}
              byCategory={liveScore ? liveScore.byCategory : byCategory}
              size={210}
            />
            {liveScore && liveScore.boost > 0 && (
              <span className="mt-3 text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                +{liveScore.boost} verified from the Build List
              </span>
            )}
            {delta != null && delta !== 0 && (
              <span
                className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${
                  delta > 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} since last test
              </span>
            )}
            <button
              onClick={() => navigate("/readiness")}
              className="mt-3 text-muted-foreground text-xs flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Re-test my readiness
            </button>
          </>
        ) : (
          <div className="w-full bg-card border border-border rounded-2xl p-6 text-center">
            <p className="font-bold text-lg mb-1">No Readiness Score yet</p>
            <p className="text-muted-foreground text-sm mb-4">
              Seven categories. One number. Two minutes.
            </p>
            <Button
              onClick={() => navigate("/readiness")}
              disabled={isLoading}
              className="gold-gradient text-primary-foreground font-bold rounded-xl px-6"
            >
              Get My Score <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── THIS WEEK ── */}
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
        This Week
      </p>
      <div className="space-y-3">
        {weeklyMission ? (
          <div className="bg-card border border-primary/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">
                This Week's Mission · {CATEGORIES.find((c) => c.id === weeklyMission.mission.category_id)?.name}
              </p>
            </div>
            <p className="font-bold text-foreground mb-1">{weeklyMission.mission.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">{weeklyMission.mission.directive}</p>
            {weeklyMission.mission.proof_hint && (
              <p className="text-xs text-muted-foreground italic mb-3">Proof: {weeklyMission.mission.proof_hint}</p>
            )}
            {weeklyMission.status === "completed" ? (
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <Check className="w-4 h-4" /> Mission complete. New one drops Monday.
              </div>
            ) : (
              <Button
                onClick={() => completeMission(weeklyMission.id)}
                size="sm"
                className="gold-gradient text-primary-foreground font-bold rounded-lg"
              >
                Mark Complete <Check className="ml-1 w-4 h-4" />
              </Button>
            )}
          </div>
        ) : weakest ? (
          <div className="bg-card border border-primary/40 rounded-2xl p-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1">
              Focus · {weakest.name}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{focusCopy[weakest.slug]}</p>
          </div>
        ) : null}

        {/* Build List card — next milestone, event-driven */}
        {user && buildMilestones.length > 0 && (
          <button
            onClick={() => navigate("/build-list")}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary transition-colors"
          >
            <span className="bg-primary p-2.5 rounded-xl">
              <Hammer className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="flex-1">
              <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
                The Build List · {builtCount}/{buildMilestones.length}
              </span>
              <span className="block font-bold">
                {nextMilestone ? nextMilestone.title : "Everything's built. Hold the line."}
              </span>
              {nextMilestone && (
                <span className="block text-xs text-muted-foreground">
                  +{nextMilestone.points} {CATEGORIES.find((c) => c.id === nextMilestone.category_id)?.name} when done
                </span>
              )}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <button
          onClick={onOpenWorkout}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary transition-colors"
        >
          <span className="bg-primary p-2.5 rounded-xl">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="flex-1">
            <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              Physical
            </span>
            <span className="block font-bold">Today's Training</span>
            <span className="block text-xs text-muted-foreground">
              {phase ? phase.trainingGuidance : programName || "Your track is waiting"}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={onOpenStandards}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary transition-colors"
        >
          <span className="bg-primary p-2.5 rounded-xl">
            <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="flex-1">
            <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              Habits
            </span>
            <span className="block font-bold">Daily Standards</span>
            <span className="block text-xs text-muted-foreground">Hold the line today</span>
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Cohort card */}
        {myCohortName && (
          <button
            onClick={() => navigate("/cohort")}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary transition-colors"
          >
            <span className="bg-primary p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="flex-1">
              <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
                The Cohort
              </span>
              <span className="block font-bold">{myCohortName}</span>
              <span className="block text-xs text-muted-foreground">Men on your exact countdown</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
