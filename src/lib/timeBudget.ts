/**
 * Time-available budgeting.
 * Members pick how much time they have; the session trims from the bottom of the
 * accessory stack (and the conditioning finisher) so the primary work always survives.
 */

export type TimeBudget = 30 | 45 | 60;

export const TIME_BUDGETS: { value: TimeBudget; label: string; blurb: string }[] = [
  { value: 30, label: "30 min", blurb: "Primary lifts only" },
  { value: 45, label: "45 min", blurb: "Primary + key accessories" },
  { value: 60, label: "60+ min", blurb: "Full session" },
];

const STORAGE_KEY = "m2f.timeBudget";

export function loadTimeBudget(): TimeBudget {
  const raw = Number(localStorage.getItem(STORAGE_KEY));
  return raw === 30 || raw === 45 ? raw : 60;
}

export function saveTimeBudget(value: TimeBudget) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

const CONDITIONING_RE = /zone 2|conditioning|emom|amrap|interval|finisher|sprint|circuit|tabata|active recovery|carry/i;

function isConditioning(item: { name?: string; type?: string | null }): boolean {
  if (item.type === "conditioning") return true;
  return CONDITIONING_RE.test(item.name ?? "");
}

function isStrength(item: { name?: string; type?: string | null }): boolean {
  if (item.type && item.type !== "exercise") return false;
  return !isConditioning(item);
}

const STRENGTH_CAP: Record<TimeBudget, number> = { 30: 4, 45: 6, 60: Infinity };
const CONDITIONING_CAP: Record<TimeBudget, number> = { 30: 0, 45: 1, 60: Infinity };

/**
 * Trim a day's item list to fit the selected time budget.
 * Non-training items (warm-ups, mindset, mission, rest) always pass through, and
 * a session made purely of conditioning (the Zone 2 day) is never emptied.
 */
export function trimItemsForTime<T extends { name?: string; type?: string | null }>(
  items: T[],
  budget: TimeBudget,
): T[] {
  if (budget === 60) return items;

  const hasStrength = items.some(isStrength);
  if (!hasStrength) return items;

  let strengthKept = 0;
  let conditioningKept = 0;

  return items.filter((item) => {
    if (isConditioning(item)) {
      conditioningKept += 1;
      return conditioningKept <= CONDITIONING_CAP[budget];
    }
    if (isStrength(item)) {
      strengthKept += 1;
      return strengthKept <= STRENGTH_CAP[budget];
    }
    return true;
  });
}

/** True when the budget actually removed work — used to surface an honest note. */
export function wasTrimmed(original: number, trimmed: number): boolean {
  return trimmed < original;
}
