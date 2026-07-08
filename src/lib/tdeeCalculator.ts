/**
 * TDEE Calculator using Mifflin-St Jeor equation
 * with activity multiplier derived from steps, job type, and training frequency.
 */

export type JobType = "desk" | "on_feet" | "labor";
export type Sex = "male" | "female";
export type Goal = "cut" | "maintain" | "bulk";

interface TDEEInput {
  weight_lbs: number;
  height_inches: number;
  age: number;
  sex: Sex;
  avg_daily_steps: number;
  training_days_per_week: number;
  job_type: JobType;
  body_fat_pct?: number | null;
  goal: Goal;
  goal_rate_lb_per_week?: number | null; // positive = gain, negative = loss
}

interface MacroResult {
  bmr: number;
  neat: number;
  tef: number;
  eef: number;
  tdee: number;
  target_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

// Mifflin-St Jeor BMR
function calcBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

// NEAT from steps + job type
function calcNEAT(steps: number, jobType: JobType): number {
  // Approximate NEAT calories from steps (~0.04 kcal/step average)
  const stepCalories = steps * 0.04;

  // Job type baseline NEAT addition
  const jobNEAT: Record<JobType, number> = {
    desk: 200,
    on_feet: 400,
    labor: 700,
  };

  return stepCalories + jobNEAT[jobType];
}

// Exercise Energy Expenditure from training days
function calcEEF(trainingDays: number, weightKg: number): number {
  // Approximate ~5 kcal/kg/session for resistance training, averaged daily
  const perSession = 5 * weightKg;
  return (perSession * trainingDays) / 7;
}

export function calculateTDEE(input: TDEEInput): MacroResult {
  const weightKg = input.weight_lbs * 0.453592;
  const heightCm = input.height_inches * 2.54;

  const bmr = Math.round(calcBMR(weightKg, heightCm, input.age, input.sex));
  const neat = Math.round(calcNEAT(input.avg_daily_steps, input.job_type));
  const eef = Math.round(calcEEF(input.training_days_per_week, weightKg));
  const tef = Math.round(bmr * 0.1); // Thermic effect of food ~10% of BMR

  const tdee = bmr + neat + tef + eef;

  // Calorie target based on goal
  let calorieAdjustment = 0;
  if (input.goal === "cut") {
    // Default -500 kcal/day for ~1 lb/week loss, scale by rate
    const rate = input.goal_rate_lb_per_week ?? 1;
    calorieAdjustment = -Math.round(rate * 500);
  } else if (input.goal === "bulk") {
    // Default +300 kcal/day for lean gain, scale by rate
    const rate = input.goal_rate_lb_per_week ?? 0.5;
    calorieAdjustment = Math.round(rate * 500);
  }

  let targetCalories = tdee + calorieAdjustment;

  // Calorie floor: 22.5 kcal/kg LBM
  const lbm = input.body_fat_pct
    ? input.weight_lbs * (1 - input.body_fat_pct / 100)
    : input.weight_lbs * 0.8; // estimate 20% bf if unknown
  const lbmKg = lbm * 0.453592;
  const calorieFloor = Math.round(22.5 * lbmKg);
  targetCalories = Math.max(targetCalories, calorieFloor);

  // Round to nearest 25
  targetCalories = Math.round(targetCalories / 25) * 25;

  // Protein: 1g/lb bodyweight if bf < 15%, else 1g/lb LBM
  let protein_g: number;
  if (input.body_fat_pct && input.body_fat_pct >= 15) {
    protein_g = Math.round(lbm);
  } else {
    protein_g = Math.round(input.weight_lbs);
  }
  // Round to nearest 5
  protein_g = Math.round(protein_g / 5) * 5;

  // Fat: 0.35g/lb bodyweight (minimum 0.3g/lb)
  let fat_g = Math.round(input.weight_lbs * 0.35);
  fat_g = Math.max(fat_g, Math.round(input.weight_lbs * 0.3));
  fat_g = Math.round(fat_g / 5) * 5;

  // Carbs: remaining calories
  const proteinCals = protein_g * 4;
  const fatCals = fat_g * 9;
  let carbs_g = Math.round((targetCalories - proteinCals - fatCals) / 4);
  carbs_g = Math.max(carbs_g, 75); // carb floor
  carbs_g = Math.round(carbs_g / 5) * 5;

  // Recalculate final calories from macros
  const finalCalories = protein_g * 4 + carbs_g * 4 + fat_g * 9;

  return {
    bmr,
    neat,
    tef,
    eef,
    tdee,
    target_calories: finalCalories,
    protein_g,
    fat_g,
    carbs_g,
  };
}
