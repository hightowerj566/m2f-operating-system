/**
 * Weekly Macro Adjustment Engine
 * 
 * Based on the BiaBody DIY Nutrition guide methodology:
 * - Uses 5.9 kcal/g energy density (drug-free athlete populations)
 * - Enforces calorie floor of 22.5 kcal/kg LBM
 * - 5% compliance tolerance before adjusting
 * - Hold-steady rule for muscle gain (wait if exceeding 2 weeks of targets)
 * - Too-fast fat loss detection with calorie increase suggestion
 * - Cardio-first recommendation when hitting calorie floor
 */

export interface AdjustmentInput {
  lastWeekAvgWeight: number;   // lb
  thisWeekAvgWeight: number;   // lb
  goalRateLbPerWeek: number;   // e.g. -1.0 for fat loss, +0.5 for gain
  avgDailyCalories: number;    // kcal consumed this week
  currentProteinG: number;
  currentCarbsG: number;
  currentFatG: number;
  compliancePct: number;       // 0–100
  daysTracked: number;         // 0–7
  bodyFatPct?: number | null;  // optional, for calorie floor calc
  weekNumber?: number;         // optional, for hold-steady logic
}

export interface AdjustmentResult {
  // Step 1
  actualWeeklyChange: number;  // lb
  goalWeeklyChange: number;    // lb
  differenceFromGoal: number;  // lb

  // Step 2
  rateErrorLb: number;         // lb/week

  // Step 3
  rateErrorG: number;          // g/week

  // Step 4
  energyErrorKcalWeek: number;
  energyErrorKcalDay: number;

  // Step 5
  eligible: boolean;
  ineligibleReason: string | null;
  suggestedCalorieChange: number;  // kcal/day (rounded to 25)
  suggestedCalories: number;

  // Step 6
  suggestedProteinG: number;
  suggestedCarbsG: number;
  suggestedFatG: number;

  // Calorie floor
  calorieFloor: number | null;
  hitCalorieFloor: boolean;

  // Hold-steady / too-fast flags
  holdSteady: boolean;
  tooFast: boolean;

  // Step 8
  explanation: string;
}

// Constants — per BiaBody DIY Nutrition guide
const LB_TO_GRAMS = 453.59237;
const KCAL_PER_GRAM = 5.9;
const COMPLIANCE_THRESHOLD = 80;
const MIN_TRACKING_DAYS = 5;
const MAX_ADJUSTMENT_KCAL = 250;
const MAX_ADJUSTMENT_PCT = 0.15;
const MACRO_ROUND = 5;
const CAL_ROUND = 25;
const MIN_CARBS_FLOOR = 100;
const MIN_FAT_PER_LB = 0.3;
const CALORIE_FLOOR_PER_KG_LBM = 22.5;
const LB_TO_KG = 0.453592;
const COMPLIANCE_TOLERANCE_PCT = 5;

function roundTo(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

/**
 * Detect if muscle-gain client is gaining too fast (>2 weeks ahead of target).
 * PDF rule: if weekly avg weight exceeds 2 weeks of predicted gains, hold steady.
 */
function shouldHoldSteady(
  goalRateLbPerWeek: number,
  actualWeeklyChange: number
): boolean {
  // Only applies to muscle gain (positive goal rate)
  if (goalRateLbPerWeek <= 0) return false;
  // If gained more than 2x the weekly target in a single week, hold steady
  return actualWeeklyChange > goalRateLbPerWeek * 2;
}

/**
 * Detect if fat-loss client is losing too fast (>2x target rate).
 * PDF: if weekly avg weight loss exceeds 2 weeks of predicted targets, increase cals.
 */
function isLosingTooFast(
  goalRateLbPerWeek: number,
  actualWeeklyChange: number
): boolean {
  // Only applies to fat loss (negative goal rate)
  if (goalRateLbPerWeek >= 0) return false;
  // If lost more than 2x the weekly target
  return actualWeeklyChange < goalRateLbPerWeek * 2;
}

export function computeAdjustment(input: AdjustmentInput): AdjustmentResult {
  const {
    lastWeekAvgWeight, thisWeekAvgWeight, goalRateLbPerWeek,
    avgDailyCalories, currentProteinG, currentCarbsG, currentFatG,
    compliancePct, daysTracked, bodyFatPct,
  } = input;

  // Step 1 — Actual Weekly Change
  const actualWeeklyChange = thisWeekAvgWeight - lastWeekAvgWeight;
  const goalWeeklyChange = goalRateLbPerWeek;
  const differenceFromGoal = actualWeeklyChange - goalWeeklyChange;

  // Step 2 — Rate Error
  const rateErrorLb = actualWeeklyChange - goalRateLbPerWeek;

  // Step 3 — Convert to grams
  const rateErrorG = rateErrorLb * LB_TO_GRAMS;

  // Step 4 — Convert to energy using 5.9 kcal/g
  const energyErrorKcalWeek = rateErrorG * KCAL_PER_GRAM;
  const energyErrorKcalDay = energyErrorKcalWeek / 7;

  // Step 5 — Guardrails
  const eligible = compliancePct >= COMPLIANCE_THRESHOLD && daysTracked >= MIN_TRACKING_DAYS;
  const ineligibleReason = !eligible
    ? `No macro change recommended — improve consistency first. Stay within 5% of your targets daily (compliance: ${compliancePct}%, days tracked: ${daysTracked}). Take another week on the same targets before adjusting.`
    : null;

  // Hold-steady & too-fast checks
  const holdSteady = shouldHoldSteady(goalRateLbPerWeek, actualWeeklyChange);
  const tooFast = isLosingTooFast(goalRateLbPerWeek, actualWeeklyChange);

  // Calorie floor calculation
  let calorieFloor: number | null = null;
  let hitCalorieFloor = false;
  if (bodyFatPct != null && bodyFatPct > 0) {
    const lbmLbs = thisWeekAvgWeight * (1 - bodyFatPct / 100);
    const lbmKg = lbmLbs * LB_TO_KG;
    calorieFloor = Math.round(lbmKg * CALORIE_FLOOR_PER_KG_LBM);
  }

  let suggestedCalorieChange = 0;
  const currentCalories = currentProteinG * 4 + currentCarbsG * 4 + currentFatG * 9;
  let suggestedCalories = currentCalories;
  let suggestedProteinG = currentProteinG;
  let suggestedCarbsG = currentCarbsG;
  let suggestedFatG = currentFatG;

  if (eligible) {
    if (holdSteady) {
      // Muscle gain: gained too fast, hold current targets for another week
      suggestedCalorieChange = 0;
      suggestedCalories = currentCalories;
    } else {
      // Cap adjustment
      const capKcal = Math.min(MAX_ADJUSTMENT_KCAL, currentCalories * MAX_ADJUSTMENT_PCT);

      if (tooFast) {
        // Fat loss too aggressive — increase calories (positive change)
        const increaseNeeded = Math.abs(energyErrorKcalDay);
        const clampedIncrease = Math.min(capKcal, increaseNeeded);
        suggestedCalorieChange = -roundTo(clampedIncrease, CAL_ROUND); // negative = add cals
        suggestedCalories = roundTo(currentCalories + clampedIncrease, CAL_ROUND);
      } else {
        // Normal adjustment: subtract energy error from current
        const clamped = Math.max(-capKcal, Math.min(capKcal, energyErrorKcalDay));
        suggestedCalorieChange = roundTo(clamped, CAL_ROUND);
        suggestedCalories = roundTo(currentCalories - suggestedCalorieChange, CAL_ROUND);
      }

      // Enforce calorie floor
      if (calorieFloor != null && suggestedCalories < calorieFloor) {
        suggestedCalories = calorieFloor;
        hitCalorieFloor = true;
        suggestedCalorieChange = currentCalories - calorieFloor;
      }

      // Step 6 — Macro distribution
      suggestedProteinG = currentProteinG;

      // Fat minimum
      const fatMinimum = Math.round(thisWeekAvgWeight * MIN_FAT_PER_LB);
      suggestedFatG = Math.max(currentFatG, fatMinimum);

      // Remaining calories to carbs
      const carbCalories = suggestedCalories - (suggestedProteinG * 4) - (suggestedFatG * 9);
      suggestedCarbsG = Math.round(carbCalories / 4);

      // Carb floor check
      if (suggestedCarbsG < MIN_CARBS_FLOOR) {
        suggestedCarbsG = MIN_CARBS_FLOOR;
        const remainingForFat = suggestedCalories - (suggestedProteinG * 4) - (suggestedCarbsG * 4);
        suggestedFatG = Math.max(fatMinimum, Math.round(remainingForFat / 9));
        suggestedCalories = suggestedProteinG * 4 + suggestedCarbsG * 4 + suggestedFatG * 9;
      }

      // Round macros to nearest 5g
      suggestedProteinG = roundTo(suggestedProteinG, MACRO_ROUND);
      suggestedCarbsG = roundTo(suggestedCarbsG, MACRO_ROUND);
      suggestedFatG = roundTo(suggestedFatG, MACRO_ROUND);

      // Recalculate final calories from rounded macros
      suggestedCalories = suggestedProteinG * 4 + suggestedCarbsG * 4 + suggestedFatG * 9;

      // Re-check calorie floor after rounding
      if (calorieFloor != null && suggestedCalories < calorieFloor) {
        hitCalorieFloor = true;
      }
    }
  }

  // Step 8 — Explanation
  let explanation: string;

  if (!eligible) {
    explanation = ineligibleReason!;
  } else if (holdSteady) {
    explanation = `Your goal was +${goalRateLbPerWeek} lb/week. Actual was +${actualWeeklyChange.toFixed(2)} lb/week — that's more than 2× your target.\n\n📋 **Hold steady.** Per the BiaBody guide, when muscle gain exceeds 2 weeks of predicted targets, hold your current calories for another week. Your weight will likely realign with your goal by next week.\n\nKeep targets at ${currentCalories} kcal (${currentProteinG}P / ${currentCarbsG}C / ${currentFatG}F).`;
  } else if (tooFast) {
    const deficitActual = Math.abs(actualWeeklyChange) * LB_TO_GRAMS * KCAL_PER_GRAM / 7;
    explanation = `Your goal was ${goalRateLbPerWeek} lb/week. Actual was ${actualWeeklyChange.toFixed(2)} lb/week — you're losing more than 2× your target rate.\n\n⚠️ **Losing too fast.** Per the BiaBody guide, when fat loss exceeds 2 weeks of predicted targets, increase calories to slow down the rate. Aggressive loss risks muscle loss and metabolic adaptation.\n\nActual daily deficit: ~${deficitActual.toFixed(0)} kcal/day. Increasing targets by ${Math.abs(suggestedCalorieChange)} kcal/day to ${suggestedCalories} kcal.`;
    if (hitCalorieFloor) {
      explanation += `\n\n⚠️ Calorie floor reached (${calorieFloor} kcal). Consider increasing activity (steps/cardio) instead of further calorie cuts.`;
    }
  } else {
    const direction = suggestedCalorieChange > 0 ? "reduced" : suggestedCalorieChange < 0 ? "increased" : "unchanged";
    const deficitNeeded = Math.abs(goalRateLbPerWeek) * LB_TO_GRAMS * KCAL_PER_GRAM / 7;
    explanation = `Your goal was ${goalRateLbPerWeek > 0 ? "+" : ""}${goalRateLbPerWeek} lb/week. Actual was ${actualWeeklyChange > 0 ? "+" : ""}${actualWeeklyChange.toFixed(2)} lb/week — that's ${Math.abs(rateErrorLb).toFixed(2)} lb/week off target.\n\nUsing 5.9 kcal/g energy density, that's ${Math.abs(rateErrorG).toFixed(0)}g/week = ${Math.abs(energyErrorKcalWeek).toFixed(0)} kcal/week = ~${Math.abs(energyErrorKcalDay).toFixed(0)} kcal/day gap. Your required daily deficit for this goal is ~${deficitNeeded.toFixed(0)} kcal/day.\n\nYour target is ${direction} by ${Math.abs(suggestedCalorieChange)} kcal/day to get back on track.`;
    if (hitCalorieFloor) {
      explanation += `\n\n⚠️ Calorie floor reached (${calorieFloor} kcal). Consider increasing activity (steps/cardio) instead of further calorie cuts.`;
    }
  }

  return {
    actualWeeklyChange,
    goalWeeklyChange,
    differenceFromGoal,
    rateErrorLb,
    rateErrorG,
    energyErrorKcalWeek,
    energyErrorKcalDay,
    eligible,
    ineligibleReason,
    suggestedCalorieChange,
    suggestedCalories,
    suggestedProteinG,
    suggestedCarbsG,
    suggestedFatG,
    calorieFloor,
    hitCalorieFloor,
    holdSteady,
    tooFast,
    explanation,
  };
}
