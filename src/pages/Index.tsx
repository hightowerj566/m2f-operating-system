import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, TrendingUp, Menu, Lock, Sparkles, Check, LayoutDashboard, Home, ClipboardList, LineChart, Wrench, X, Map } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { ConditioningCard, ConditioningBlockCard, isConditioningExercise, parseConditioningBlock } from "@/components/workout/ConditioningCard";
import { TrainingScheduleSelector } from "@/components/workout/TrainingScheduleSelector";
import { RestCard } from "@/components/workout/RestCard";
import { RestTimerModal } from "@/components/workout/RestTimerModal";
import { ExerciseModal } from "@/components/workout/ExerciseModal";
import { WorkoutFeedbackModal, type DifficultyRating } from "@/components/workout/WorkoutFeedbackModal";
import { LoadRecommendationBanner } from "@/components/workout/LoadRecommendationBanner";
import { WarmUpSection, isWarmUpExercise } from "@/components/workout/WarmUpSection";
import { IntensityTechniquesBanner } from "@/components/workout/IntensityTechniquesBanner";
import { MoreTab } from "@/components/tabs/MoreTab";
import { MacrosTab } from "@/components/tabs/MacrosTab";
import { ProgressTab } from "@/components/tabs/ProgressTab";
import { DailyStandardsTab } from "@/components/tabs/DailyStandardsTab";
import { FitnessToolsTab } from "@/components/tools/FitnessToolsTab";
import { HomeTab } from "@/components/tabs/HomeTab";
import { useDueDatePass } from "@/hooks/useM2fOs";
import { StreakMilestonePopup } from "@/components/streak/StreakMilestonePopup";
import { DayPickerModal } from "@/components/workout/DayPickerModal";
import { ProgramPickerModal } from "@/components/workout/ProgramPickerModal";
import { TIERS, PERFORMANCE_ONLY_TABS, getPriceId } from "@/lib/subscriptionTiers";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { getScheduleForDay, splitMergeExercises, type ScheduleDayConfig } from "@/lib/scheduleEngine";
import { saveWorkoutFeedback, getWorkoutRecommendations, type LoadRecommendation } from "@/lib/adaptiveEngine";
import { getExpressWorkout } from "@/lib/expressEngine";
import { getWeekAdjustedReps, getWeekTechnique, cleanNotesForWeek, getWeekFromDay } from "@/lib/weekAdjustments";
import { useOffline } from "@/hooks/useOffline";
import { addDays, startOfDay } from "date-fns";
import { loadFlagshipDay, type FlagshipDayResult } from "@/lib/flagshipWorkoutAdapter";
import { isFlagshipProgram } from "@/lib/training/isFlagshipProgram";
import { loadTrainingContent } from "@/lib/training/loadTrainingContent";
import { PRE_BIRTH_JOURNEY_LENGTH_DAYS } from "@/lib/training/flagshipJourney";
import { decideProgramTrack } from "@/lib/programTrackResolver";
import { FlagshipJourneyCard } from "@/components/workout/FlagshipJourneyCard";

interface ProgramExercise {
  name: string;
  detail: string;
  type: "exercise" | "rest" | "mindset" | "mission";
  sets: number | null;
  reps: number | null;
  percentage: number | null;
  percentageBase?: string | null;
  seconds: number | null;
  video_url: string | null;
  video_type: "youtube" | "upload" | null;
  group?: string;
  rest?: number;
  superset_label?: string;
  rir?: string | null;
  repsRaw?: string | null;
}

interface WorkoutGroup {
  label: string;
  exercises: ProgramExercise[];
}

const baseNavItems = [
  { icon: Home, label: "Home" },
  { icon: Dumbbell, label: "Workout" },
  { icon: Map, label: "Roadmap" },
  { icon: Menu, label: "More" },
];

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).replace(/(\d+)$/, (d) => {
    const n = parseInt(d);
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return d + (s[(v - 20) % 10] || s[v] || s[0]);
  });
}

export default function Index() {
  const { user, loading } = useAuth();
  const { subscribed, tier, subscriptionEnd, cancelAtPeriodEnd, loading: subLoading, refresh: refreshSub } = useSubscription(user?.id);
  const isOffline = useOffline();
  const { hasPass } = useDueDatePass(user?.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState(() => searchParams.get("tab") || "Home");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== activeNav) {
      setActiveNav(t);
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [pendingNextExercise, setPendingNextExercise] = useState<{ name: string; detail: string; sets: number; reps: number | null; video_url: string | null; video_type: string | null; defaultWeight: number | null } | null>(null);
  const [activeExercise, setActiveExercise] = useState<{ name: string; detail: string; sets: number; reps: number | null; video_url: string | null; video_type: string | null; defaultWeight: number | null } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Program state
  const [programName, setProgramName] = useState<string | null>(null);
  const [baseDay, setBaseDay] = useState(1); // the assigned current_day (today's program day)
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, up to +7
  const [totalDays, setTotalDays] = useState(1);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [groups, setGroups] = useState<WorkoutGroup[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [userMaxes, setUserMaxes] = useState<Record<string, number>>({});
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [assignmentLoaded, setAssignmentLoaded] = useState(false);
  const [trainingDays, setTrainingDays] = useState(6);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleDayConfig | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loadRecommendations, setLoadRecommendations] = useState<LoadRecommendation[]>([]);
  const [standardsStreak, setStandardsStreak] = useState(0);
  const [showFitnessTools, setShowFitnessTools] = useState(false);

  // ── Flagship (M2F Guided Journey) state ──
  // Kept explicit and separate from the legacy assignment-driven state above.
  // The flagship is date-driven: it does not require a program_assignments
  // row, and its "current day" is derived from the member's due date /
  // baby_arrived_at rather than a stored current_day.
  const [flagshipDayResult, setFlagshipDayResult] = useState<FlagshipDayResult | null>(null);
  const [isFlagshipActive, setIsFlagshipActive] = useState(false);
  const [flagshipDayOffset, setFlagshipDayOffset] = useState(0); // calendar-day offset from today
  const [flagshipLoadError, setFlagshipLoadError] = useState<string | null>(null);
  const [flagshipCompletedKeys, setFlagshipCompletedKeys] = useState<Set<string>>(new Set());

  // The displayed program day based on offset
  const displayedDay = isFlagshipActive
    ? flagshipDayResult?.meta.programDay ?? flagshipDayResult?.meta.postpartumDay ?? 0
    : Math.min(baseDay + dayOffset, totalDays);

  // The displayed date based on offset
  const displayedDate = isFlagshipActive
    ? addDays(startOfDay(new Date()), flagshipDayOffset)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        return d;
      })();

  // Check onboarding (fatherhood essentials) status
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [trainingProfileComplete, setTrainingProfileComplete] = useState<boolean | null>(null);
  const [hasJourneyDate, setHasJourneyDate] = useState(false);

  // ── Temporary flagship non-training completion store ──
  // No persistent journey-completion table exists yet. This is a deliberately
  // isolated, client-only mechanism (localStorage) so non-training flagship
  // days (rest/recovery/mobility/etc.) can be marked complete without
  // inventing a fake Supabase schema. Training-day completion continues to
  // use the real workout-completion system (saveWorkoutFeedback) below.
  const flagshipCompletionStorageKey = user ? `m2f_flagship_completions_${user.id}` : null;
  useEffect(() => {
    if (!flagshipCompletionStorageKey) return;
    try {
      const raw = localStorage.getItem(flagshipCompletionStorageKey);
      setFlagshipCompletedKeys(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setFlagshipCompletedKeys(new Set());
    }
  }, [flagshipCompletionStorageKey]);

  const markFlagshipDayComplete = useCallback((contentId: string) => {
    if (!flagshipCompletionStorageKey) return;
    setFlagshipCompletedKeys((prev) => {
      const next = new Set(prev);
      next.add(contentId);
      try {
        localStorage.setItem(flagshipCompletionStorageKey, JSON.stringify([...next]));
      } catch {
        // Best-effort only — completion state is non-critical UI sugar here.
      }
      return next;
    });
  }, [flagshipCompletionStorageKey]);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete, training_profile_complete, due_date, baby_arrived_at")
        .eq("user_id", user.id)
        .single();
      if (data && !(data as any).onboarding_complete) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setTrainingProfileComplete(!!(data as any)?.training_profile_complete);
      setHasJourneyDate(Boolean((data as any)?.due_date || (data as any)?.baby_arrived_at));
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, [user, navigate]);

  // Gate: opening Training or Nutrition requires a training profile.
  useEffect(() => {
    if (!onboardingChecked || trainingProfileComplete !== false) return;
    if (activeNav === "Workout") {
      navigate("/training-profile?next=today", { replace: true });
    } else if (activeNav === "Macros") {
      navigate("/training-profile?next=macros", { replace: true });
    }
  }, [activeNav, trainingProfileComplete, onboardingChecked, navigate]);

  // Load a single calendar date of the flagship journey. Clears stale exercise
  // groups before/while loading so the prior day's workout never flashes or
  // remains visible, and reports a controlled error state on resolver failure
  // instead of silently rendering an empty workout.
  const loadFlagshipJourneyDate = useCallback(async (uid: string, date: Date) => {
    setFlagshipLoadError(null);
    setGroups([]);
    setScheduleConfig(null);
    setLoadRecommendations([]);
    try {
      const result = await loadFlagshipDay(uid, "full", date);
      if (!result) {
        throw new Error("The flagship journey resolver returned no result for this date.");
      }
      setFlagshipDayResult(result);
      if (result.exercises.length > 0) {
        setGroups([{ label: result.label, exercises: result.exercises }]);
      } else {
        setGroups([]);
      }
    } catch (err) {
      setFlagshipDayResult(null);
      setGroups([]);
      setFlagshipLoadError(
        "We couldn't load today's journey. Your program data may contain a missing workout or exercise reference.",
      );
      if (import.meta.env.DEV) {
        console.error("[Flagship Journey] resolution failed", {
          userId: uid,
          selectedDate: date.toISOString(),
          error: err instanceof Error ? err.message : err,
        });
      }
    }
  }, []);

  // Load assignment + maxes + training days preference, then decide which
  // program track the member is on using the required priority:
  //   1. Active non-flagship coach assignment
  //   2. Due-date / baby-arrival-driven flagship Guided Journey (no
  //      program_assignments row required)
  //   3. Needs due date (no program at all)
  // A flagship program_assignments row (if one exists from legacy data) is
  // never treated as a coach override — isFlagshipProgram() distinguishes it.
  useEffect(() => {
    if (!user || !onboardingChecked) return;
    const load = async () => {
      // Load maxes, training-day preference, and journey profile fields in parallel
      const [{ data: maxData }, { data: profileData }, { data: journeyProfile }] = await Promise.all([
        supabase.from("user_maxes").select("exercise_name, weight_lbs").eq("user_id", user.id),
        supabase.from("profiles").select("training_days_per_week").eq("user_id", user.id).single(),
        supabase.from("profiles").select("due_date, baby_arrived_at").eq("user_id", user.id).maybeSingle(),
      ]);
      if (maxData) {
        const m: Record<string, number> = {};
        maxData.forEach((r: any) => { m[r.exercise_name] = Number(r.weight_lbs); });
        setUserMaxes(m);
      }
      const prefDays = profileData?.training_days_per_week && [4, 5, 6].includes(profileData.training_days_per_week)
        ? profileData.training_days_per_week
        : 6;
      setTrainingDays(prefDays);

      const memberHasJourneyDate = Boolean((journeyProfile as any)?.due_date || (journeyProfile as any)?.baby_arrived_at);

      const { data: assignments } = await supabase.from("program_assignments").select("id, current_day, program_id, assigned_at").eq("user_id", user.id).eq("is_active", true).limit(1);
      const assignment = assignments && assignments.length > 0 ? (assignments[0] as any) : null;

      let assignmentProgramName: string | null = null;
      if (assignment) {
        const { data: prog } = await supabase.from("programs").select("name").eq("id", assignment.program_id).single();
        assignmentProgramName = prog ? (prog as any).name as string : null;
      }

      const assignmentIsFlagship = assignment ? isFlagshipProgram(assignment.program_id, assignmentProgramName) : false;

      const track = decideProgramTrack({
        assignment,
        assignmentIsFlagship,
        hasJourneyDate: memberHasJourneyDate,
      });

      if (track.kind === "coach") {
        setIsFlagshipActive(false);
        setFlagshipDayResult(null);
        setAssignmentId(track.assignmentId);
        setProgramId(track.programId);
        const { data: prog } = await supabase.from("programs").select("name, total_days, published_through_day").eq("id", track.programId).single();
        const days = (prog as any)?.total_days || 1;
        const publishedThrough = (prog as any)?.published_through_day;
        const loadedProgramName = prog ? (prog as any).name as string : null;
        if (prog) {
          setProgramName(loadedProgramName);
          setTotalDays(publishedThrough != null ? Math.min(days, publishedThrough) : days);
        }
        const savedDay = Math.min(track.currentDay, days);
        setBaseDay(savedDay);
        loadLegacyProgramDay(track.programId, savedDay, days, prefDays, user.id, loadedProgramName);
      } else if (track.kind === "flagship") {
        // No program_assignments record is required. If one happens to exist
        // (a flagship assignment row), we keep its id for compatibility but
        // never use its current_day as the source of truth.
        const content = loadTrainingContent();
        setIsFlagshipActive(true);
        setAssignmentId(track.assignmentId);
        setProgramId(content.programId);
        setProgramName(content.programName);
        setTotalDays(PRE_BIRTH_JOURNEY_LENGTH_DAYS);
        setBaseDay(1);
        setDayOffset(0);
        setFlagshipDayOffset(0);
        await loadFlagshipJourneyDate(user.id, startOfDay(new Date()));
      } else {
        // Needs due date — no program at all yet.
        setIsFlagshipActive(false);
        setFlagshipDayResult(null);
        setAssignmentId(track.assignmentId);
      }

      setHasJourneyDate(memberHasJourneyDate);
      setAssignmentLoaded(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onboardingChecked]);

  // Legacy program day loader — handles coach-assigned programs and
  // legacy program_days content. The flagship Guided Journey no longer flows
  // through this function; it uses loadFlagshipJourneyDate exclusively.
  const loadLegacyProgramDay = useCallback(async (
    pid: string,
    dayNum: number,
    total: number,
    schedDays: number,
    uid?: string,
    loadedProgramName?: string | null,
  ) => {
    const config = getScheduleForDay(dayNum, total, schedDays);
    setScheduleConfig(config);

    const activeProgramName = loadedProgramName ?? programName;

    // Rest days – no exercises
    if (config.type === "rest") {
      setGroups([]);
      return;
    }

    // ── Express mode: use static JSON instead of DB ──
    if (schedDays === 5 && activeProgramName) {
      const express = getExpressWorkout(activeProgramName, dayNum);
      if (express) {
        let exercises: ProgramExercise[] = express.exercises;

        // Apply saved exercise swaps
        if (uid) {
          const { data: swaps } = await supabase
            .from("user_exercise_swaps")
            .select("original_exercise, replacement_name, scope, day_number")
            .eq("user_id", uid)
            .eq("program_id", pid);
          if (swaps && swaps.length > 0) {
            exercises = exercises.map(ex => {
              const clean = ex.name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');
              const swap = (swaps as any[]).find(s =>
                s.original_exercise === clean &&
                (s.scope === "mesocycle" || (s.scope === "workout" && s.day_number === dayNum))
              );
              if (swap) {
                const prefix = ex.name.match(/^(\d+[a-zA-Z]?[\.\)\-]\s*)/)?.[1] || '';
                return { ...ex, name: prefix + swap.replacement_name };
              }
              return ex;
            });
          }
        }

        setGroups([{ label: express.label, exercises }]);
        if (uid) {
          const recs = await getWorkoutRecommendations(uid, pid, dayNum,
            exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps }))
          );
          setLoadRecommendations(recs);
        }
        return;
      }
    }

    // ── Standard mode: load from DB ──
    // Load primary day
    const { data } = await supabase.from("program_days").select("label, exercises").eq("program_id", pid).eq("day_number", dayNum).single();
    let exercises: ProgramExercise[] = data ? ((data as any).exercises as ProgramExercise[]) : [];
    let label = data ? ((data as any).label || `Day ${dayNum}`) : `Day ${dayNum}`;

    // Override label if schedule provides one
    if (config.label) label = config.label;

    // For merged days, load and append exercises from merge targets
    if (config.type === "merged" && config.mergeDays.length > 0) {
      for (const mergeDay of config.mergeDays) {
        const { data: mergeData } = await supabase.from("program_days").select("exercises").eq("program_id", pid).eq("day_number", mergeDay).single();
        if (mergeData) {
          const mergeExercises = (mergeData as any).exercises as ProgramExercise[];
          // Split core exercises so pos 1 and pos 4 each get half
          const portion = splitMergeExercises(mergeExercises, dayNum);
          exercises = [...exercises, ...portion];
        }
      }
    }

    if (exercises.length > 0) {
      // Apply week-specific rep and detail adjustments for eligible programs
      const week = getWeekFromDay(dayNum);
      if (activeProgramName && ["M2F Perform 2.0", "M2F Rebuild 2.0"].includes(activeProgramName)) {
        exercises = exercises.map(ex => {
          const detail = ex.detail || "";
          const repsStr = ex.reps != null ? String(ex.reps) : "";
          const adjustedReps = getWeekAdjustedReps(repsStr, detail, week);
          const technique = getWeekTechnique(detail, week);
          const cleanedDetail = cleanNotesForWeek(detail, week);

          // Build updated detail with technique tags
          let newDetail = cleanedDetail;
          if (technique && !newDetail.includes(technique)) {
            newDetail = technique + ". " + newDetail;
          }

          if (adjustedReps !== repsStr) {
            // Reps changed — put adjusted reps in the detail as "sets × reps" for ExerciseCard to parse
            return {
              ...ex,
              reps: null,
              detail: `${ex.sets || 4} × ${adjustedReps}. ${newDetail}`,
            };
          }

          return { ...ex, detail: newDetail };
        });
      }

      // Apply saved exercise swaps
      if (uid) {
        const { data: swaps } = await supabase
          .from("user_exercise_swaps")
          .select("original_exercise, replacement_name, scope, day_number")
          .eq("user_id", uid)
          .eq("program_id", pid);
        if (swaps && swaps.length > 0) {
          exercises = exercises.map(ex => {
            const clean = ex.name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');
            const swap = (swaps as any[]).find(s =>
              s.original_exercise === clean &&
              (s.scope === "mesocycle" || (s.scope === "workout" && s.day_number === dayNum))
            );
            if (swap) {
              const prefix = ex.name.match(/^(\d+[a-zA-Z]?[\.\)\-]\s*)/)?.[1] || '';
              return { ...ex, name: prefix + swap.replacement_name };
            }
            return ex;
          });
        }
      }

      setGroups([{ label, exercises }]);
      // Load adaptive recommendations
      if (uid) {
        const recs = await getWorkoutRecommendations(uid, pid, dayNum,
          exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps }))
        );
        setLoadRecommendations(recs);
      }
    } else {
      setGroups([]);
      setLoadRecommendations([]);
    }
  }, [programName]);

  const handleDaySelect = async (day: number) => {
    setBaseDay(day);
    setDayOffset(0);
    if (assignmentId && programId) {
      await supabase.from("program_assignments").update({ current_day: day }).eq("id", assignmentId);
      loadLegacyProgramDay(programId, day, totalDays, trainingDays, user?.id);
    }
  };

  const handleScheduleChange = (days: number) => {
    setTrainingDays(days);
    if (programId) {
      const currentDisplayedDay = baseDay + dayOffset;
      loadLegacyProgramDay(programId, currentDisplayedDay, totalDays, days, user?.id);
    }
    toast({ title: "Program adjusted for your training schedule." });
  };

  const handleProgramSwitch = async (newPid: string, newTotal: number) => {
    // Map current displayed day to equivalent position in new program
    const currentDay = baseDay + dayOffset;
    const mappedDay = Math.min(Math.max(1, currentDay), newTotal);

    // This is an explicit user/coach-driven program switch, so it's allowed
    // to move the member off the flagship (see fix spec §8).
    setIsFlagshipActive(false);
    setFlagshipDayResult(null);
    setFlagshipLoadError(null);

    setProgramId(newPid);
    setTotalDays(newTotal);
    const { data: progData } = await supabase.from("programs").select("name").eq("id", newPid).single();
    if (progData) setProgramName((progData as any).name);

    // Deactivate current, activate/create assignment for new program at mapped day
    await supabase.from("program_assignments").update({ is_active: false }).eq("user_id", user!.id).eq("is_active", true);

    const { data: existing } = await supabase
      .from("program_assignments")
      .select("id")
      .eq("user_id", user!.id)
      .eq("program_id", newPid)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase.from("program_assignments").update({ is_active: true, current_day: mappedDay }).eq("id", existing[0].id);
      setAssignmentId(existing[0].id);
    } else {
      const { data: newAssignment } = await supabase.from("program_assignments").insert({
        user_id: user!.id, program_id: newPid, assigned_by: user!.id,
        current_day: mappedDay, is_active: true,
      }).select("id").single();
      if (newAssignment) setAssignmentId((newAssignment as any).id);
    }

    setBaseDay(mappedDay);
    setDayOffset(0);
    const newTrainingDays = newTotal <= 84 ? 4 : 6;
    setTrainingDays(newTrainingDays);
    loadLegacyProgramDay(newPid, mappedDay, newTotal, newTrainingDays, user!.id);
    toast({ title: `Switched to ${newTrainingDays}-day version.` });
  };

  const stripPrefix = (name: string): string => {
    return name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');
  };

  /** Render the right card type based on whether the exercise is conditioning */
  const renderExerciseOrConditioning = (ex: ProgramExercise, idx: number | string) => {
    const cleanName = stripPrefix(ex.name);
    const isCond = isConditioningExercise(ex.name, ex.rir, ex.repsRaw ?? null);
    const tapHandler = () => setActiveExercise({
      name: cleanName,
      detail: isCond ? ex.detail : calcWeight(ex),
      sets: ex.sets ?? 3,
      reps: ex.reps ?? null,
      video_url: ex.video_url,
      video_type: ex.video_type,
      defaultWeight: calcDefaultWeight(ex),
    });

    if (isCond) {
      return (
        <ConditioningCard
          key={idx}
          name={cleanName}
          detail={ex.detail}
          sets={ex.sets}
          reps={ex.repsRaw ?? null}
          rest={ex.rest}
          onTap={tapHandler}
        />
      );
    }

    return (
      <ExerciseCard
        key={idx}
        name={cleanName}
        detail={calcWeight(ex)}
        sets={ex.sets}
        reps={ex.reps}
        rir={ex.rir}
        onTap={tapHandler}
      />
    );
  };

  const getRepScheme = (exercise: ProgramExercise): string => {
    let detail = exercise.detail;

    // For percentage-based exercises (Olympic lifts with percentageBase)
    if (exercise.percentage && exercise.percentageBase) {
      const baseMax = userMaxes[exercise.percentageBase];
      if (baseMax) {
        const weight = Math.round(baseMax * exercise.percentage);
        detail += ` → ${weight} lbs (${Math.round(exercise.percentage * 100)}% of ${exercise.percentageBase})`;
      }
    } else if (exercise.percentage) {
      const cleanName = stripPrefix(exercise.name);
      const max = userMaxes[cleanName] || userMaxes[exercise.name];
      if (max) {
        const weight = Math.round(max * exercise.percentage);
        detail += ` (${weight} lbs)`;
      }
    } else {
      const cleanName = stripPrefix(exercise.name);
      const max = userMaxes[cleanName] || userMaxes[exercise.name];
      if (max) {
        const match = detail.match(/(\d+)\s*%/);
        if (match) {
          const weight = Math.round(max * Number(match[1]) / 100);
          detail += ` (${weight} lbs)`;
        }
      }
    }

    return detail;
  };

  const calcWeight = (exercise: ProgramExercise): string => {
    return getRepScheme(exercise);
  };

  const calcDefaultWeight = (exercise: ProgramExercise): number | null => {
    // Olympic lift percentage-based loading
    if (exercise.percentage && exercise.percentageBase) {
      const baseMax = userMaxes[exercise.percentageBase];
      if (baseMax) return Math.round(baseMax * exercise.percentage);
    }
    if (exercise.percentage && exercise.name && userMaxes[exercise.name]) {
      return Math.round(userMaxes[exercise.name] * exercise.percentage);
    }
    const cleanName = stripPrefix(exercise.name);
    const max = userMaxes[cleanName] || userMaxes[exercise.name];
    if (max) {
      const match = exercise.detail.match(/(\d+)\s*%/);
      if (match) return Math.round(max * Number(match[1]) / 100);
    }
    return null;
  };

  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").then(({ data }) => {
      if (data && data.length > 0) setIsCoach(true);
    });
  }, [user]);

  // Load standards streak for milestone popup
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("daily_standards").select("standard_date, completions").eq("user_id", user.id).order("standard_date", { ascending: false }).limit(90),
      supabase.from("standard_definitions").select("key").or(`and(is_global.eq.true,target_user_id.is.null),target_user_id.eq.${user.id},created_by.eq.${user.id}`).eq("is_active", true),
    ]).then(([hRes, sRes]) => {
      const hist = (hRes.data as any[]) || [];
      const stds = (sRes.data as any[]) || [];
      if (hist.length === 0 || stds.length === 0) return;
      const threshold = Math.max(1, Math.floor(stds.length * 0.75));
      let count = 0;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      for (let i = 0; i < hist.length; i++) {
        const expected = new Date(now); expected.setDate(expected.getDate() - i);
        const expStr = expected.toISOString().split("T")[0];
        const entry = hist.find((h: any) => h.standard_date === expStr);
        if (!entry) break;
        const completions = entry.completions || {};
        const dayScore = stds.filter((s: any) => completions[s.key]).length;
        if (dayScore >= threshold) count++;
        else break;
      }
      setStandardsStreak(count);
    });
  }, [user]);

  // Show program picker only for subscribers who have neither a coach-assigned
  // program nor a due date. Members with a due date are automatically on the
  // date-driven Guided Journey — the picker would just loop them.
  useEffect(() => {
    if (assignmentLoaded && subscribed && !assignmentId && !isCoach && !hasJourneyDate) {
      setShowProgramPicker(true);
    }
  }, [assignmentLoaded, subscribed, assignmentId, isCoach, hasJourneyDate]);

  const navItems = isCoach
    ? [...baseNavItems, { icon: LayoutDashboard, label: "Coach" }]
    : baseNavItems;

  const handleNavClick = (label: string) => {
    if (label === "Coach") {
      navigate("/coach");
      return;
    }
    if (label === "Roadmap") {
      navigate("/build-list");
      return;
    }
    // Coaches get full access
    if (isCoach) {
      setActiveNav(label);
      return;
    }
    // Check if tab requires Performance tier (Macros is accessed via More)
    if (PERFORMANCE_ONLY_TABS.includes(label) && tier !== "performance") {
      setShowUpgradeModal(true);
      return;
    }
    // Gate premium tabs when no subscription
    const openTabs = ["Home", "More", "Progress"];
    if (!subscribed && !hasPass && !openTabs.includes(label)) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveNav(label);
  };

  const handleCheckout = async (priceId: string) => {
    setCheckingOut(true);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { price_id: priceId },
    });
    setCheckingOut(false);
    if (error || data?.error) {
      toast({ title: data?.error || "Failed to start checkout", variant: "destructive" });
      return;
    }
    if (data?.url) window.open(data.url, "_blank");
  };

  // Build flat exercise list for prev/next navigation in ExerciseModal
  type ExerciseEntry = { name: string; detail: string; sets: number; reps: number | null; video_url: string | null; video_type: string | null; defaultWeight: number | null; restAfter: number };
  const flatExercises = useMemo<ExerciseEntry[]>(() => {
    const allExercises = groups.flatMap(g => g.exercises);
    const getLetterGroup = (name: string): string | null => {
      const m = name.match(/^(\d+)?([a-zA-Z])\d*[\.\)\-]/);
      return m ? m[2].toUpperCase() : null;
    };
    const getDefaultRest = (letter: string | null): number => {
      if (!letter) return 90;
      switch (letter) {
        case 'A': return 120;
        case 'B': return 90;
        case 'C': return 75;
        case 'D': return 60;
        default: return 60;
      }
    };

    return allExercises
      .filter(ex => ex.type !== "rest")
      .map(ex => ({
        name: stripPrefix(ex.name),
        detail: calcWeight(ex),
        sets: ex.sets ?? 3,
        reps: ex.reps ?? null,
        video_url: ex.video_url ?? null,
        video_type: ex.video_type ?? null,
        defaultWeight: calcDefaultWeight(ex),
        restAfter: ex.rest ?? getDefaultRest(getLetterGroup(ex.name)),
      }));
  }, [groups, userMaxes]);

  const activeExerciseIndex = activeExercise ? flatExercises.findIndex(e => e.name === activeExercise.name) : -1;

  const navigateExercise = (direction: "prev" | "next") => {
    if (activeExerciseIndex < 0) return;
    const newIdx = direction === "prev" ? activeExerciseIndex - 1 : activeExerciseIndex + 1;
    if (newIdx >= 0 && newIdx < flatExercises.length) {
      const nextEx = flatExercises[newIdx];
      // When moving forward, close exercise modal, show rest timer, then open next exercise after
      if (direction === "next") {
        const currentEx = flatExercises[activeExerciseIndex];
        if (currentEx.restAfter > 0) {
          setActiveExercise(null);
          setPendingNextExercise(nextEx);
          setRestTimer({ seconds: currentEx.restAfter });
          return;
        }
      }
      setActiveExercise(nextEx);
    }
  };


  if (loading || subLoading) return <div className="flex items-center justify-center min-h-dvh bg-background"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!onboardingChecked) return <div className="flex items-center justify-center min-h-dvh bg-background"><div className="text-muted-foreground">Loading...</div></div>;

  // No subscription → show pricing (coaches bypass)
  if (!subscribed && !isCoach) {
    return (
      <div className="flex flex-col min-h-dvh bg-background max-w-md mx-auto pt-safe">
        <PricingView
          currentTier={tier}
          onCheckout={handleCheckout}
          checkingOut={checkingOut}
        />
      </div>
    );
  }

  const FLAGSHIP_NAV_WINDOW_DAYS = 30; // bound how far a member can browse from today
  const canGoBack = isFlagshipActive
    ? flagshipDayOffset > -FLAGSHIP_NAV_WINDOW_DAYS
    : (baseDay + dayOffset) > 1;
  const canGoForward = isFlagshipActive
    ? flagshipDayOffset < FLAGSHIP_NAV_WINDOW_DAYS
    : (dayOffset < 7 && (baseDay + dayOffset) < totalDays);

  const prevDay = () => {
    if (!canGoBack || !user) return;
    if (isFlagshipActive) {
      const newOffset = flagshipDayOffset - 1;
      setFlagshipDayOffset(newOffset);
      loadFlagshipJourneyDate(user.id, addDays(startOfDay(new Date()), newOffset));
      return;
    }
    const newOffset = dayOffset - 1;
    setDayOffset(newOffset);
    if (programId) loadLegacyProgramDay(programId, baseDay + newOffset, totalDays, trainingDays, user?.id);
  };

  const nextDay = () => {
    if (!canGoForward || !user) return;
    if (isFlagshipActive) {
      const newOffset = flagshipDayOffset + 1;
      setFlagshipDayOffset(newOffset);
      loadFlagshipJourneyDate(user.id, addDays(startOfDay(new Date()), newOffset));
      return;
    }
    const newOffset = dayOffset + 1;
    setDayOffset(newOffset);
    if (programId) loadLegacyProgramDay(programId, baseDay + newOffset, totalDays, trainingDays, user?.id);
  };

  // Flagship header identity — never displays the legacy assigned current_day
  // as the source of truth; always derived from the resolved flagship result.
  const flagshipHeaderLine = (): string => {
    if (!flagshipDayResult) return "Loading your journey…";
    const { meta } = flagshipDayResult;
    if (meta.status === "needs-due-date") return "Set your due date to unlock your journey";
    if (meta.status === "pre-program") return flagshipDayResult.label; // "Starts in N days"
    if (meta.status === "post-due-date") return "Birth Window";
    if (meta.status === "post-birth") {
      return `Post-Birth Day ${meta.postpartumDay}${meta.stageName ? ` · ${meta.stageName}` : ""}`;
    }
    // active
    const dayLine = `Day ${meta.programDay}${meta.stageName ? ` · ${meta.stageName}` : ""}`;
    return dayLine;
  };

  const flagshipPregnancyWeekLine = (): string | null => {
    if (!flagshipDayResult) return null;
    const { meta } = flagshipDayResult;
    if (meta.status === "active" && meta.pregnancyWeek != null) {
      return `Pregnancy Week ${meta.pregnancyWeek}`;
    }
    return null;
  };

  const renderTabContent = () => {
    switch (activeNav) {
      case "Home":
        return (
          <HomeTab
            programName={programName}
            onOpenToday={() => handleNavClick("Workout")}
            onOpenProgress={() => handleNavClick("Progress")}
            onOpenWorkout={() => handleNavClick("Workout")}
            onOpenStandards={() => handleNavClick("Daily")}
            onOpenMacros={() => handleNavClick("Macros")}
            onOpenMore={() => handleNavClick("More")}
          />
        );
      case "Daily":
        return <DailyStandardsTab />;
      case "Fuel":
      case "Macros":
        return <MacrosTab />;
      case "Progress":
        return <ProgressTab />;
      case "More":
        return <MoreTab tier={tier} subscriptionEnd={subscriptionEnd} cancelAtPeriodEnd={cancelAtPeriodEnd} onRefreshSub={refreshSub} currentProgramId={programId} onProgramChanged={() => window.location.reload()} onOpenStandards={() => handleNavClick("Daily")} onOpenMacros={() => handleNavClick("Macros")} />;
      case "Workout":
        return (
          <>
            <div className="px-5 pt-8 pb-4">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                {isFlagshipActive ? "M2F Flagship Guided Journey" : (programName || "NO PROGRAM ASSIGNED")}
              </p>
              <h1 className="text-5xl font-black tracking-tight text-foreground mb-1">
                {isFlagshipActive ? "GUIDED JOURNEY" : "TODAY"}
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                {isFlagshipActive
                  ? [flagshipHeaderLine(), flagshipPregnancyWeekLine()].filter(Boolean).join(" · ")
                  : "Train. Hold the standards. Own the day."}
              </p>
              <div className="flex gap-3 flex-wrap">
                {isFlagshipActive ? (
                  <div className="flex items-center gap-2 bg-secondary text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border">
                    <span className="text-primary">📅</span> {displayedDay > 0 ? `Day ${displayedDay}` : "—"}
                  </div>
                ) : isCoach ? (
                  <button onClick={() => setShowDayPicker(true)}
                    className="flex items-center gap-2 bg-secondary text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border hover:border-primary/40 transition-colors">
                    <span className="text-primary">📅</span> Day {displayedDay}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-secondary text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border">
                    <span className="text-primary">📅</span> Day {displayedDay}
                  </div>
                )}
                <button onClick={() => setShowFitnessTools(true)}
                  className="flex items-center gap-2 bg-secondary text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border hover:border-primary/40 transition-colors">
                  <Wrench className="w-4 h-4 text-primary" /> Fitness Tools
                </button>
              </div>
            </div>
            {/* The training-schedule selector remaps days through the legacy
                schedule engine, which does not apply to the date-driven
                flagship journey — hide it rather than let it corrupt journey state. */}
            {!isFlagshipActive && user && <TrainingScheduleSelector userId={user.id} programName={programName} programId={programId} onChange={handleScheduleChange} onProgramSwitch={handleProgramSwitch} />}
            <div className="flex items-center justify-between px-5 py-3 border-y border-border">
              <button onClick={prevDay} disabled={!canGoBack} className={`p-1 transition-colors ${canGoBack ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm font-bold text-foreground">
                {isFlagshipActive
                  ? (flagshipDayOffset === 0 ? 'Today' : formatDate(displayedDate))
                  : (dayOffset === 0 ? 'Today' : formatDate(displayedDate))}
              </span>
              <button onClick={nextDay} disabled={!canGoForward} className={`p-1 transition-colors ${canGoForward ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'}`}><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-6">
              {isFlagshipActive && flagshipLoadError ? (
                <div className="text-center py-12 space-y-3">
                  <span className="text-4xl">⚠️</span>
                  <p className="text-base font-black text-foreground">We couldn't load today's journey.</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Your program data may contain a missing workout or exercise reference.
                  </p>
                  <button
                    onClick={() => user && loadFlagshipJourneyDate(user.id, displayedDate)}
                    className="mt-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold"
                  >
                    Retry
                  </button>
                </div>
              ) : isFlagshipActive && flagshipDayResult && flagshipDayResult.exercises.length === 0 ? (
                <FlagshipJourneyCard
                  result={flagshipDayResult}
                  completed={flagshipCompletedKeys.has(flagshipDayResult.meta.contentId)}
                  onMarkComplete={() => markFlagshipDayComplete(flagshipDayResult.meta.contentId)}
                  onAddDueDate={() => navigate("/training-profile?next=today")}
                />
              ) : !isFlagshipActive && scheduleConfig && (scheduleConfig.type === "rest" || scheduleConfig.type === "optional") && groups.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <span className="text-5xl">{scheduleConfig.type === "rest" ? "😴" : "🏃"}</span>
                  <p className="text-lg font-black text-foreground">{scheduleConfig.label}</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {scheduleConfig.type === "rest"
                      ? "Recovery is part of the program. Rest today and come back stronger."
                      : "This session is optional. Add conditioning if you have the energy."}
                  </p>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">{programName ? "No exercises programmed for this day." : "No program assigned yet. Ask your coach to assign one."}</p>
                </div>
              ) : (
                <>
                  {/* Warm-Up & Intensity Techniques */}
                  {groups.length > 0 && (() => {
                    const allExercises = groups.flatMap(g => g.exercises).filter(e => e.type !== "rest").map(e => ({ name: e.name, detail: e.detail }));
                    const programWarmUps = allExercises.filter(e => isWarmUpExercise(e.name));
                    const nonWarmUpExercises = allExercises.filter(e => !isWarmUpExercise(e.name));
                    return allExercises.length > 0 ? (
                      <div className="space-y-2">
                        <WarmUpSection exercises={nonWarmUpExercises} programWarmUps={programWarmUps.length > 0 ? programWarmUps : undefined} />
                        <IntensityTechniquesBanner exercises={nonWarmUpExercises} />
                      </div>
                    ) : null;
                  })()}
                  {groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3 px-1">{group.label}</p>
                    <div className="space-y-2">
                      {(() => {
                        const exercises = group.exercises;
                        const rendered: JSX.Element[] = [];

                        // Parse letter prefix from exercise name (e.g., "A1:", "B2:", "C1:")
                        const getLetterGroup = (name: string): string | null => {
                          const match = name.match(/^([A-Za-z])\d+[\.\:\)\-]/);
                          return match ? match[1].toUpperCase() : null;
                        };

                        // Determine rest seconds based on group letter
                        const getRestSeconds = (letter: string | null): number => {
                          if (!letter) return 90;
                          switch (letter) {
                            case 'A': return 90;    // Power block – 90s
                            case 'B': return 150;   // Primary strength – 2-3 min
                            case 'C': return 90;    // Secondary strength/hypertrophy – 90s
                            case 'D': return 60;    // Accessory – 60-90s
                            default: return 90;
                          }
                        };

                        // Group exercises by their letter prefix
                        const filteredExercises = exercises.filter(ex => ex.type !== "mindset" && ex.type !== "mission" && !isWarmUpExercise(ex.name));

                        // ── Pre-scan: find the trailing conditioning finisher block ──
                        // Only exercises at the END of the list get grouped into one card.
                        let condFinisherStartIdx = filteredExercises.length; // default: no finisher
                        for (let j = filteredExercises.length - 1; j >= 0; j--) {
                          const fEx = filteredExercises[j];
                          if (isConditioningExercise(fEx.name, fEx.rir, fEx.repsRaw ?? null)) {
                            condFinisherStartIdx = j;
                          } else {
                            break; // stop as soon as we hit a non-conditioning exercise
                          }
                        }

                        // Also check for single EMOM/AMRAP blocks anywhere (they have multiline detail)
                        let i = 0;
                        while (i < filteredExercises.length) {
                          const ex = filteredExercises[i];

                          // ── Trailing conditioning finisher block ──
                          if (i === condFinisherStartIdx && i < filteredExercises.length) {
                            const condGroup = filteredExercises.slice(condFinisherStartIdx);
                            i = filteredExercises.length; // consume all remaining

                            // Single conditioning exercise → render as individual card (not block)
                            if (condGroup.length === 1) {
                              const block = parseConditioningBlock(condGroup[0].name, condGroup[0].detail);
                              if (block) {
                                rendered.push(
                                  <ConditioningBlockCard
                                    key={`cond-block-${condFinisherStartIdx}`}
                                    type={block.type}
                                    duration={block.duration}
                                    exercises={block.exercises}
                                    notes={block.notes}
                                    onTap={() => setActiveExercise({
                                      name: stripPrefix(condGroup[0].name),
                                      detail: condGroup[0].detail,
                                      sets: condGroup[0].sets ?? 1,
                                      reps: condGroup[0].reps ?? null,
                                      video_url: condGroup[0].video_url,
                                      video_type: condGroup[0].video_type,
                                      defaultWeight: null,
                                    })}
                                  />
                                );
                              } else {
                                // Single non-EMOM/AMRAP finisher (Rower, Assault Bike, etc.)
                                rendered.push(renderExerciseOrConditioning(condGroup[0], condFinisherStartIdx));
                              }
                              continue;
                            }

                            // Multiple conditioning exercises → single block card
                            const groupLabel = group.label.toLowerCase();
                            const blockType: "EMOM" | "AMRAP" | "Conditioning" = /emom/i.test(groupLabel) ? "EMOM" : /amrap/i.test(groupLabel) ? "AMRAP" : "Conditioning";
                            const durMatch = groupLabel.match(/(\d+)\s*min/i);
                            const duration = durMatch ? `${durMatch[1]} min` : "";

                            const condExercises = condGroup.map((cEx, cIdx) => {
                              const cleanName = stripPrefix(cEx.name);
                              const repsStr = cEx.repsRaw || (cEx.reps ? `${cEx.reps}` : "");
                              const restStr = cEx.rest ? (cEx.rest >= 60 ? `${Math.round(cEx.rest / 60)}min rest` : `${cEx.rest}s rest`) : "";
                              const parts = [repsStr, restStr].filter(Boolean).join(" · ");
                              return {
                                label: `${cIdx + 1}`,
                                text: parts ? `${cleanName} — ${parts}` : cleanName,
                              };
                            });

                            rendered.push(
                              <ConditioningBlockCard
                                key={`cond-group-${condFinisherStartIdx}`}
                                type={blockType}
                                duration={duration}
                                exercises={condExercises}
                                notes=""
                                onTap={() => {}}
                              />
                            );
                            continue;
                          }

                          // Handle explicit group property (from coach builder or new format)
                          if (ex.group) {
                            const groupId = ex.group;
                            const groupExercises: { ex: ProgramExercise; idx: number }[] = [];
                            while (i < filteredExercises.length && filteredExercises[i].group === groupId) {
                              groupExercises.push({ ex: filteredExercises[i], idx: i });
                              i++;
                            }

                            // Split groups of 4 into two pairs of supersets
                            const subGroups: { ex: ProgramExercise; idx: number }[][] = [];
                            if (groupExercises.length === 4) {
                              subGroups.push(groupExercises.slice(0, 2), groupExercises.slice(2, 4));
                            } else {
                              subGroups.push(groupExercises);
                            }

                            for (const sg of subGroups) {
                              const lastEx = sg[sg.length - 1]?.ex;
                              const restSec = lastEx?.rest ?? getRestSeconds(getLetterGroup(sg[0]?.ex.name || ''));
                              const supersetLabel = sg[0]?.ex.superset_label || 
                                (sg.length >= 3 ? 'Tri-Set' : 'Superset');

                              if (sg.length > 1) {
                                rendered.push(
                                  <div key={`group-${groupId}-${sg[0].idx}`} className="border border-primary/20 rounded-xl p-2 space-y-2 bg-primary/5">
                                    <span className="text-[10px] font-bold text-primary uppercase px-2">{supersetLabel}</span>
                                    {sg.map(({ ex: gEx, idx: gIdx }) =>
                                      gEx.type === "rest" ? (
                                        <RestCard key={gIdx} detail={`${gEx.seconds} seconds`} seconds={gEx.seconds!} onTap={() => setRestTimer({ seconds: gEx.seconds! })} />
                                      ) : (
                                        renderExerciseOrConditioning(gEx, gIdx)
                                      )
                                    )}
                                    {restSec > 0 && (
                                      <RestCard detail={`${restSec} seconds`} seconds={restSec} onTap={() => setRestTimer({ seconds: restSec })} />
                                    )}
                                  </div>
                                );
                              } else {
                                const soloEx = sg[0].ex;
                                const soloIdx = sg[0].idx;
                                const soloRest = soloEx.rest ?? getRestSeconds(getLetterGroup(soloEx.name));
                                rendered.push(
                                  <div key={`solo-g-${soloIdx}`} className="space-y-2">
                                    {renderExerciseOrConditioning(soloEx, `solo-g-inner-${soloIdx}`)}
                                    {soloRest > 0 && (
                                      <RestCard detail={`${soloRest} seconds`} seconds={soloRest} onTap={() => setRestTimer({ seconds: soloRest })} />
                                    )}
                                  </div>
                                );
                              }
                            }
                            continue;
                          }

                          // Handle rest type
                          if (ex.type === "rest") {
                            rendered.push(<RestCard key={i} detail={`${ex.seconds} seconds`} seconds={ex.seconds!} onTap={() => setRestTimer({ seconds: ex.seconds! })} />);
                            i++;
                            continue;
                          }

                          // Auto-detect letter grouping from name prefix
                          const letter = getLetterGroup(ex.name);

                          // Non-prefixed items: technique inserts get special rendering
                          if (!letter) {
                            const isTechnique = ex.name.toLowerCase().includes('technique') || ex.name.toLowerCase().includes('insert');
                            if (isTechnique) {
                              rendered.push(
                                <div key={i} className="bg-secondary/60 border border-border rounded-xl p-4 space-y-1.5">
                                  <p className="text-xs font-bold text-primary uppercase tracking-wide">{stripPrefix(ex.name)}</p>
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ex.detail}</p>
                                </div>
                              );
                            } else {
                              rendered.push(renderExerciseOrConditioning(ex, i));
                            }
                            i++;
                            continue;
                          }

                          // Collect all exercises with the same letter prefix
                          const sameLetterExercises: { ex: ProgramExercise; idx: number }[] = [];
                          while (i < filteredExercises.length && getLetterGroup(filteredExercises[i].name) === letter) {
                            sameLetterExercises.push({ ex: filteredExercises[i], idx: i });
                            i++;
                          }

                          const restSec = getRestSeconds(letter);

                          if (sameLetterExercises.length > 1) {
                            // Multiple exercises with same letter = superset
                            rendered.push(
                              <div key={`auto-${letter}-${sameLetterExercises[0].idx}`} className="border border-primary/20 rounded-xl p-2 space-y-2 bg-primary/5">
                                <span className="text-[10px] font-bold text-primary uppercase px-2">Superset</span>
                                {sameLetterExercises.map(({ ex: gEx, idx: gIdx }) => (
                                  renderExerciseOrConditioning(gEx, gIdx)
                                ))}
                                <RestCard detail={`${restSec} seconds`} seconds={restSec} onTap={() => setRestTimer({ seconds: restSec })} />
                              </div>
                            );
                          } else {
                            // Single exercise = standalone with rest after
                            const soloEx = sameLetterExercises[0].ex;
                            const soloIdx = sameLetterExercises[0].idx;
                            rendered.push(
                              <div key={`solo-${soloIdx}`} className="space-y-2">
                                {renderExerciseOrConditioning(soloEx, `solo-inner-${soloIdx}`)}
                                <RestCard detail={`${restSec} seconds`} seconds={restSec} onTap={() => setRestTimer({ seconds: restSec })} />
                              </div>
                            );
                          }
                        }
                        return rendered;
                      })()}
                    </div>
                  </div>
                  ))}

                  {/* Mindset Moment & Dad Mission — always at the very bottom */}
                  {(() => {
                    const allItems = groups.flatMap(g => g.exercises);
                    const mindset = allItems.find(ex => ex.type === "mindset");
                    const mission = allItems.find(ex => ex.type === "mission");
                    if (!mindset && !mission) return null;
                    return (
                      <div className="space-y-3 mt-4">
                        {mindset && (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                            <p className="text-xs font-bold tracking-widest uppercase text-primary">💭 Mindset Moment</p>
                            <p className="text-sm text-foreground leading-relaxed">{mindset.detail}</p>
                          </div>
                        )}
                        {mission && (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                            <p className="text-xs font-bold tracking-widest uppercase text-primary">🎯 Dad Mission</p>
                            <p className="text-sm text-foreground leading-relaxed">{mission.detail}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Load Recommendations Banner */}
              {groups.length > 0 && loadRecommendations.length > 0 && (
                <LoadRecommendationBanner recommendations={loadRecommendations} />
              )}

              {/* Complete Workout Button */}
              {groups.length > 0 && (isFlagshipActive ? flagshipDayOffset === 0 : dayOffset === 0) && (
                <div className="pb-4">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(true);
                    }}
                    disabled={workoutCompleted}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      workoutCompleted
                        ? 'bg-primary/20 text-primary cursor-default'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    {workoutCompleted ? 'Workout Completed' : 'Complete Workout'}
                  </button>
                </div>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const isTabLocked = (label: string) => {
    if (isCoach) return false;
    if (PERFORMANCE_ONLY_TABS.includes(label) && tier !== "performance") return true;
    return false;
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background max-w-md mx-auto pt-safe relative">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-destructive/90 text-destructive-foreground text-center py-2 text-xs font-bold sticky top-0 z-50">
          📡 You're offline — showing cached data
        </div>
      )}
      {renderTabContent()}

      {/* Fitness Tools overlay (opens from Today pill) */}
      {showFitnessTools && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto pb-24">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 bg-background z-10 border-b border-border">
            <button
              onClick={() => setShowFitnessTools(false)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Fitness Tools</p>
            <div className="w-10" />
          </div>
          <FitnessToolsTab />
        </div>
      )}


      {/* Streak Milestone Popup */}
      {standardsStreak > 0 && (
        <StreakMilestonePopup streak={standardsStreak} onDismiss={() => {}} />
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-around">
          {navItems.map(({ icon: Icon, label }) => {
            const locked = isTabLocked(label);
            return (
              <button key={label} onClick={() => handleNavClick(label)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${activeNav === label ? "text-foreground" : "text-muted-foreground"}`}>
                {activeNav === label ? (
                  <span className="bg-primary p-2 rounded-xl"><Icon className="w-5 h-5 text-primary-foreground" /></span>
                ) : (
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {locked && (
                      <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-muted-foreground" />
                    )}
                  </div>
                )}
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Program Picker Modal */}
      {showProgramPicker && user && (
        <ProgramPickerModal
          userId={user.id}
          currentProgramId={programId}
          onComplete={async (assignment) => {
            setShowProgramPicker(false);
            if (!assignment) return;

            setIsFlagshipActive(false);
            setFlagshipDayResult(null);
            setAssignmentId(assignment.id);
            setProgramId(assignment.program_id);
            setBaseDay(assignment.current_day || 1);
            setDayOffset(0);

            const { data: prog } = await supabase
              .from("programs")
              .select("name, total_days, published_through_day")
              .eq("id", assignment.program_id)
              .single();

            const days = (prog as any)?.total_days || 1;
            const publishedThrough = (prog as any)?.published_through_day;
            const loadedProgramName = prog ? ((prog as any).name as string) : null;
            setProgramName(loadedProgramName);
            setTotalDays(publishedThrough != null ? Math.min(days, publishedThrough) : days);
            loadLegacyProgramDay(assignment.program_id, assignment.current_day || 1, days, trainingDays, user.id, loadedProgramName);
            toast({ title: "Program selected." });
          }}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowUpgradeModal(false)}>
          <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 text-primary mx-auto" />
              <h2 className="text-xl font-black text-foreground">Upgrade to Performance</h2>
              <p className="text-sm text-muted-foreground">Unlock nutrition coaching, macro tracking, and weekly check-ins.</p>
            </div>
            <div className="space-y-2">
              {TIERS.performance.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-3xl font-black text-foreground">${TIERS.performance.monthly_price}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <button onClick={() => { setShowUpgradeModal(false); handleCheckout(TIERS.performance.monthly_price_id); }} disabled={checkingOut}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {checkingOut ? "Opening checkout..." : "Upgrade Now"}
            </button>
            <button onClick={() => setShowUpgradeModal(false)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {showDayPicker && <DayPickerModal totalDays={totalDays} currentDay={displayedDay} onSelect={handleDaySelect} onClose={() => setShowDayPicker(false)} />}
      {restTimer && <RestTimerModal seconds={restTimer.seconds} onClose={() => {
        setRestTimer(null);
        if (pendingNextExercise) {
          setActiveExercise(pendingNextExercise);
          setPendingNextExercise(null);
        }
      }} />}
      {activeExercise && (
        <ExerciseModal
          exercise={activeExercise}
          programId={programId}
          dayNumber={displayedDay}
          onClose={() => setActiveExercise(null)}
          onPrev={activeExerciseIndex > 0 ? () => navigateExercise("prev") : undefined}
          onNext={activeExerciseIndex < flatExercises.length - 1 ? () => navigateExercise("next") : undefined}
          exerciseLabel={activeExerciseIndex >= 0 ? `${activeExerciseIndex + 1} of ${flatExercises.length}` : undefined}
          onSwap={async (originalName, newName, newDetail, scope) => {
            if (!user || !programId) return;
            // Save swap to database
            await supabase.from("user_exercise_swaps").insert({
              user_id: user.id,
              program_id: programId,
              original_exercise: originalName,
              replacement_name: newName,
              replacement_detail: newDetail,
              scope,
              day_number: scope === "workout" ? displayedDay : null,
            } as any);
            // Apply swap in current UI immediately
            setGroups(prev => prev.map(g => ({
              ...g,
              exercises: g.exercises.map(ex => {
                const clean = ex.name.replace(/^\d+[a-zA-Z]?[\.\)\-]\s*/, '');
                if (clean === originalName) {
                  const prefix = ex.name.match(/^(\d+[a-zA-Z]?[\.\)\-]\s*)/)?.[1] || '';
                  return { ...ex, name: prefix + newName };
                }
                return ex;
              })
            })));
            toast({ title: `Swapped to ${newName}`, description: scope === "mesocycle" ? "Applied for the rest of this mesocycle." : "Applied for this workout only." });
          }}
        />
      )}

      {/* Post-Workout Feedback Modal */}
      {showFeedbackModal && user && programId && (
        <WorkoutFeedbackModal
          dayNumber={displayedDay}
          onSubmit={async (difficulty: DifficultyRating) => {
            await saveWorkoutFeedback(user.id, programId, displayedDay, difficulty);
            setWorkoutCompleted(true);

            if (isFlagshipActive) {
              // The flagship's "current day" is derived from the due date,
              // never stored — do not touch program_assignments here.
              toast({ title: "Workout Complete! 💪" });
              return;
            }

            // Advance to next day in the program
            const nextDay = displayedDay < totalDays ? displayedDay + 1 : displayedDay;
            if (assignmentId && nextDay !== displayedDay) {
              await supabase.from("program_assignments").update({ current_day: nextDay }).eq("id", assignmentId);
              setBaseDay(nextDay);
              setDayOffset(0);
            }

            toast({ title: "Workout Complete! 💪", description: `Day ${displayedDay} done. Day ${nextDay} is up next!` });
          }}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

// Pricing page shown to users with no subscription
function PricingView({ currentTier, onCheckout, checkingOut }: {
  currentTier: string | null;
  onCheckout: (priceId: string) => void;
  checkingOut: boolean;
}) {
  const { signOut } = useAuth();
  const [yearly, setYearly] = useState(true);

  return (
    <div className="px-5 pt-10 pb-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground">Select a plan to get started with your coaching program.</p>
        <p className="text-xs font-semibold text-primary">All plans include a 7-day free trial</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={`text-sm font-semibold ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Annual <span className="text-xs text-primary font-bold">Save more</span>
        </span>
      </div>

      {/* Training Only */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-lg font-black text-foreground">{TIERS.base.name}</h3>
          <div className="mt-1">
            {yearly ? (
              <>
                <span className="text-3xl font-black text-foreground">${Math.round(TIERS.base.yearly_price / 12)}</span>
                <span className="text-sm text-muted-foreground">/month</span>
                <p className="text-sm font-bold text-primary mt-0.5">${TIERS.base.yearly_price} total billed annually</p>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-foreground">${TIERS.base.monthly_price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {TIERS.base.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onCheckout(getPriceId("base", yearly))} disabled={checkingOut}
          className="w-full flex flex-col items-center gap-0.5 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50">
          <span>{checkingOut ? "Loading..." : "Get Started"}</span>
          <span className="text-[10px] font-normal text-muted-foreground">Start with 7-day free trial</span>
        </button>
      </div>

      {/* Total Transformation */}
      <div className="bg-card border-2 border-primary rounded-2xl p-5 space-y-4 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">{TIERS.performance.name}</h3>
          <div className="mt-1">
            {yearly ? (
              <>
                <span className="text-3xl font-black text-foreground">${Math.round(TIERS.performance.yearly_price / 12)}</span>
                <span className="text-sm text-muted-foreground">/month</span>
                <p className="text-sm font-bold text-primary mt-0.5">${TIERS.performance.yearly_price} total billed annually</p>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-foreground">${TIERS.performance.monthly_price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {TIERS.performance.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onCheckout(getPriceId("performance", yearly))} disabled={checkingOut}
          className="w-full flex flex-col items-center gap-0.5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          <span>{checkingOut ? "Loading..." : "Get Total Transformation"}</span>
          <span className="text-[10px] font-normal opacity-80">Start with 7-day free trial</span>
        </button>
      </div>

      <button onClick={signOut} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
        Log out
      </button>
    </div>
  );
}
