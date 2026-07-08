/**
 * Schedule Engine
 * Maps program days to a modified weekly layout based on training frequency.
 *
 * Programs repeat a 7-day cycle:
 *   Pos 1 – Upper Strength
 *   Pos 2 – Lower Strength
 *   Pos 3 – Core + Conditioning
 *   Pos 4 – Upper Hypertrophy
 *   Pos 5 – Lower Hypertrophy
 *   Pos 6 – Athletic Conditioning
 *   Pos 7 – Rest
 */

export type DayType = "training" | "rest" | "optional" | "merged";

export interface ScheduleDayConfig {
  type: DayType;
  /** Primary program day to load */
  primaryDay: number;
  /** Additional program days whose exercises should be merged in */
  mergeDays: number[];
  /** Display label override */
  label: string | null;
}

/**
 * Get the position within a 7-day cycle (1-7) for a given program day number.
 */
export function getWeekPosition(dayNum: number): number {
  return ((dayNum - 1) % 7) + 1;
}

/**
 * Get the first day number of the week containing dayNum.
 */
function weekStart(dayNum: number): number {
  return dayNum - getWeekPosition(dayNum) + 1;
}

/**
 * Given a program day number and training frequency, return how
 * the day should be displayed.
 */
export function getScheduleForDay(
  dayNum: number,
  totalDays: number,
  trainingDays: number
): ScheduleDayConfig {
  const pos = getWeekPosition(dayNum);
  const ws = weekStart(dayNum);

  // ── 4-day mode: Train, Train, Rest, Train, Train, Rest, Rest ──
  if (trainingDays === 4) {
    if (pos === 3) {
      return { type: "rest", primaryDay: dayNum, mergeDays: [], label: "Active Recovery" };
    }
    if (pos === 6 || pos === 7) {
      return { type: "rest", primaryDay: dayNum, mergeDays: [], label: "Rest & Recover" };
    }
    return { type: "training", primaryDay: dayNum, mergeDays: [], label: null };
  }

  // ── 6-day mode: full program, day 7 = rest ──
  if (trainingDays === 6) {
    if (pos === 7) {
      return { type: "rest", primaryDay: dayNum, mergeDays: [], label: "Rest Day" };
    }
    return { type: "training", primaryDay: dayNum, mergeDays: [], label: null };
  }

  // ── 5-day mode ──
  if (trainingDays === 5) {
    if (pos === 6 || pos === 7) {
      return { type: "rest", primaryDay: dayNum, mergeDays: [], label: "Rest Day" };
    }
    const conditioningDay = ws + 5;
    if (pos === 5 && conditioningDay <= totalDays) {
      return {
        type: "merged",
        primaryDay: dayNum,
        mergeDays: [conditioningDay],
        label: "Lower Hypertrophy + Conditioning",
      };
    }
    return { type: "training", primaryDay: dayNum, mergeDays: [], label: null };
  }

  return { type: "training", primaryDay: dayNum, mergeDays: [], label: null };
}

/**
 * For merged days, return the full set of exercises from the merge source.
 * In 5-day mode, Day 5 gets all of Day 6's conditioning appended.
 */
export function splitMergeExercises<T>(
  exercises: T[],
  _dayNum: number
): T[] {
  // No splitting needed — Day 5 gets all conditioning exercises
  return exercises;
}
