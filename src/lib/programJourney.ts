// M2F OS · Journey resolver.
// Given a user's due date, birth date, and any active coach assignment,
// return the current program track, stage, week, today's workout, and the
// full weekly schedule. Pure — no Supabase calls. Callers pass in resolved
// values so this stays unit-testable and safe to run inside render.

import {
  JOURNEY_STAGES,
  stageBySlug,
  type JourneyStage,
  type StageStatus,
} from "@/content/journeyStages";
import {
  babyAgeDays,
  daysRemaining,
  getPostBirthPhase,
  pregnancyWeek,
  POST_BIRTH_PHASES,
} from "@/lib/phases";
import {
  preBirthProgramForPregnancyWeek,
  preBirthWorkoutsForPregnancyWeek,
} from "@/content/preBirthTraining";
import { programForSlug, type PBProgram, type PBWorkout } from "@/content/postBirthTraining";
import { isFlagshipProgram } from "@/lib/training/isFlagshipProgram";

export type Track = "guided" | "coach";

export interface DayCell {
  /** Mon..Sun label */
  dayLabel: string;
  /** Full date */
  date: Date;
  isToday: boolean;
  /** Underlying workout for this day, if any */
  workout: PBWorkout | null;
  /** Rest day, optional day, or the completed state */
  state: "workout" | "rest" | "optional" | "future-locked";
}

export interface CoachAssignmentInput {
  programId: string;
  programName: string;
  currentDay: number;
  totalDays: number;
  assignedAt: string;
  assignedByCoachName?: string | null;
}

export interface JourneyResolveInput {
  dueDate: string | null | undefined;
  babyArrivedAt: string | null | undefined;
  coachAssignment: CoachAssignmentInput | null;
  /** For tests. Defaults to now. */
  now?: Date;
}

export interface ResolvedJourney {
  track: Track;
  stage: JourneyStage | null;
  /** For pregnancy: pregnancy week (4–42). For post-birth: baby age in weeks. */
  currentWeek: number | null;
  /** Total weeks in the stage — null when ongoing. */
  stageTotalWeeks: number | null;
  weekInStage: number;
  progressPct: number;
  program: PBProgram | null;
  /** Session prescribed for today */
  todayWorkout: PBWorkout | null;
  /** Mon–Sun schedule for the current week */
  weekSchedule: DayCell[];
  /** All stages annotated with a status (completed / current / upcoming / locked). */
  timeline: Array<{ stage: JourneyStage; status: StageStatus }>;
  /** Coach data when track = "coach". */
  coach: CoachAssignmentInput | null;
  /** Human label for the era. */
  eraLabel: string;
  /** "Week 26 of Pregnancy" / "8 weeks old" etc. */
  eraDetail: string | null;
}

// ─── Helpers ─────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mondayOf(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function preBirthStageForWeek(week: number): JourneyStage | null {
  if (week >= 4 && week <= 14) return stageBySlug("foundation");
  if (week >= 15 && week <= 23) return stageBySlug("framing");
  if (week >= 24 && week <= 31) return stageBySlug("durability");
  if (week >= 32) return stageBySlug("staging-mission-mode");
  return null;
}

function postBirthStageForAge(days: number): JourneyStage | null {
  if (days < 42) return stageBySlug("survival");
  if (days < 84) return stageBySlug("foundation-postbirth");
  return stageBySlug("father-athlete");
}

function stageWeekBounds(stage: JourneyStage): { start: number; end: number | null } {
  // Pre-birth stages use pregnancy weeks; post-birth uses baby age in weeks.
  switch (stage.slug) {
    case "foundation": return { start: 4, end: 14 };
    case "framing": return { start: 15, end: 23 };
    case "durability": return { start: 24, end: 31 };
    case "staging-mission-mode": return { start: 32, end: 40 };
    case "survival": return { start: 0, end: 6 };
    case "foundation-postbirth": return { start: 6, end: 12 };
    case "father-athlete": return { start: 12, end: null };
    default: return { start: 0, end: null };
  }
}

function buildWeeklySchedule(
  today: Date,
  workoutForWeekday: (weekdayIdx: number) => PBWorkout | null,
): DayCell[] {
  const start = mondayOf(today);
  const cells: DayCell[] = [];
  const todayISO = today.toISOString().slice(0, 10);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const w = workoutForWeekday(i);
    const isToday = d.toISOString().slice(0, 10) === todayISO;
    cells.push({
      dayLabel: DAY_LABELS[i],
      date: d,
      isToday,
      workout: w,
      state: w ? "workout" : "rest",
    });
  }
  return cells;
}

// ─── Pre-birth resolver ─────────────────────────────────

function resolvePreBirth(now: Date, dueDate: string): ResolvedJourney | null {
  const daysLeft = daysRemaining(dueDate);
  const week = pregnancyWeek(daysLeft);
  if (week == null || week < 4) return null;

  const clampedWeek = Math.min(40, Math.max(4, week));
  const stage = preBirthStageForWeek(clampedWeek);
  const program = preBirthProgramForPregnancyWeek(clampedWeek);
  const weekWorkouts = preBirthWorkoutsForPregnancyWeek(clampedWeek);

  // Session-per-weekday mapping: workouts carry day: 1..5.
  const byDay = new Map<number, PBWorkout>();
  weekWorkouts.forEach((w) => byDay.set(w.day, w));
  const schedule = buildWeeklySchedule(now, (weekdayIdx) => {
    // Weekday 0=Mon → workout day 1 ... weekday 4=Fri → workout day 5. Sat/Sun rest.
    const workoutDay = weekdayIdx + 1;
    return byDay.get(workoutDay) ?? null;
  });

  const today = schedule.find((c) => c.isToday)?.workout ?? null;
  const { start, end } = stage ? stageWeekBounds(stage) : { start: clampedWeek, end: clampedWeek };
  const weekInStage = Math.max(1, clampedWeek - start + 1);
  const stageTotal = end ? end - start + 1 : null;
  const progressPct = stageTotal ? Math.min(100, Math.round((weekInStage / stageTotal) * 100)) : 0;

  return {
    track: "guided",
    stage,
    currentWeek: clampedWeek,
    stageTotalWeeks: stageTotal,
    weekInStage,
    progressPct,
    program,
    todayWorkout: today,
    weekSchedule: schedule,
    timeline: timelineFor(stage),
    coach: null,
    eraLabel: "Pregnancy",
    eraDetail: `Week ${clampedWeek} of Pregnancy`,
  };
}

// ─── Post-birth resolver ────────────────────────────────

function resolvePostBirth(now: Date, babyArrivedAt: string): ResolvedJourney | null {
  const ageDays = babyAgeDays(babyArrivedAt);
  if (ageDays == null) return null;
  const stage = postBirthStageForAge(ageDays);
  const program = stage ? programForSlug(stage.programSlug) : null;
  if (!program) return null;

  const ageWeeks = Math.floor(ageDays / 7);
  const byDay = new Map<number, PBWorkout>();
  program.workouts.forEach((w) => {
    if (!byDay.has(w.day)) byDay.set(w.day, w);
  });
  const schedule = buildWeeklySchedule(now, (weekdayIdx) => {
    const workoutDay = weekdayIdx + 1;
    return byDay.get(workoutDay) ?? null;
  });
  const today = schedule.find((c) => c.isToday)?.workout ?? null;

  const bounds = stage ? stageWeekBounds(stage) : { start: 0, end: null };
  const weekInStage = Math.max(1, ageWeeks - bounds.start + 1);
  const stageTotal = bounds.end ? bounds.end - bounds.start : null;
  const progressPct = stageTotal ? Math.min(100, Math.round((weekInStage / stageTotal) * 100)) : 0;

  const phase = getPostBirthPhase(ageDays);
  return {
    track: "guided",
    stage,
    currentWeek: ageWeeks,
    stageTotalWeeks: stageTotal,
    weekInStage,
    progressPct,
    program,
    todayWorkout: today,
    weekSchedule: schedule,
    timeline: timelineFor(stage),
    coach: null,
    eraLabel: phase?.name ?? "Father Mode",
    eraDetail: `${ageWeeks} weeks · baby is ${ageDays} days old`,
  };
}

// ─── Timeline annotation ────────────────────────────────

function timelineFor(current: JourneyStage | null): ResolvedJourney["timeline"] {
  const currentIdx = current ? JOURNEY_STAGES.findIndex((s) => s.slug === current.slug) : -1;
  return JOURNEY_STAGES.map((stage, idx) => {
    let status: StageStatus;
    if (currentIdx === -1) status = "locked";
    else if (idx < currentIdx) status = "completed";
    else if (idx === currentIdx) status = "current";
    else if (stage.era === "post-birth" && current?.era === "pregnancy") status = "locked";
    else status = "upcoming";
    return { stage, status };
  });
}

// ─── Public API ─────────────────────────────────────────

export function resolveJourney(input: JourneyResolveInput): ResolvedJourney {
  const now = input.now ?? new Date();

  // Compute the guided journey first so we always have stage + timeline context
  // (pregnancy week, upcoming stages) — even when a coach program is assigned.
  let guided: ResolvedJourney | null = null;
  if (input.babyArrivedAt) guided = resolvePostBirth(now, input.babyArrivedAt);
  if (!guided && input.dueDate) guided = resolvePreBirth(now, input.dueDate);

  // Coach assignment always wins as the *active program* — EXCEPT when the
  // assigned program is the flagship "M2F Guided Journey", which is itself
  // the time-based track. In that case, render the guided journey directly.
  if (
    input.coachAssignment &&
    !isFlagshipProgram(input.coachAssignment.programId, input.coachAssignment.programName)
  ) {
    const weekNum = Math.max(1, Math.ceil(input.coachAssignment.currentDay / 7));
    const totalWeeks = Math.max(1, Math.ceil(input.coachAssignment.totalDays / 7));
    return {
      track: "coach",
      stage: guided?.stage ?? null,
      currentWeek: weekNum,
      stageTotalWeeks: totalWeeks,
      weekInStage: weekNum,
      progressPct: Math.min(
        100,
        Math.round((input.coachAssignment.currentDay / input.coachAssignment.totalDays) * 100),
      ),
      program: null,
      todayWorkout: null,
      weekSchedule: guided?.weekSchedule ?? buildWeeklySchedule(now, () => null),
      timeline: guided?.timeline ?? timelineFor(null),
      coach: input.coachAssignment,
      eraLabel: input.coachAssignment.programName,
      eraDetail: guided?.eraDetail
        ? `${guided.eraDetail} · Day ${input.coachAssignment.currentDay} of ${input.coachAssignment.totalDays}`
        : `Day ${input.coachAssignment.currentDay} of ${input.coachAssignment.totalDays}`,
    };
  }

  // No coach assignment — fall back to pure guided journey when available.
  if (guided) return guided;


  // Nothing to render
  return {
    track: "guided",
    stage: null,
    currentWeek: null,
    stageTotalWeeks: null,
    weekInStage: 0,
    progressPct: 0,
    program: null,
    todayWorkout: null,
    weekSchedule: buildWeeklySchedule(now, () => null),
    timeline: timelineFor(null),
    coach: null,
    eraLabel: "Get Started",
    eraDetail: "Set your due date to unlock the guided journey.",
  };
}

// Re-exports for consumers
export { POST_BIRTH_PHASES };
export type { JourneyStage };
