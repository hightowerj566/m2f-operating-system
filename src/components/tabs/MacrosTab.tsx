import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Scale, Target, TrendingUp, TrendingDown, Minus, CheckCircle, ArrowUp, ArrowDown, Calendar, Footprints, Briefcase, Dumbbell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UserAdjustmentCard } from "@/components/coaching/UserAdjustmentCard";
import { WeeklyCheckInWizard } from "@/components/coaching/WeeklyCheckInWizard";
import { calculateTDEE, type JobType, type Sex, type Goal as TDEEGoal } from "@/lib/tdeeCalculator";
import { Slider } from "@/components/ui/slider";
import bfUnder15 from "@/assets/bf-under15.png";
import bf1522 from "@/assets/bf-15-22.png";
import bf2230 from "@/assets/bf-22-30.png";
import bfOver30 from "@/assets/bf-over30.png";

const BF_OPTIONS = [
  { value: 12, label: "Sub 15%", image: bfUnder15 },
  { value: 18, label: "15–22%", image: bf1522 },
  { value: 26, label: "22–30%", image: bf2230 },
  { value: 35, label: "30%+", image: bfOver30 },
];

type Goal = "muscle_gain" | "fat_loss" | "maintenance";

const GOAL_LABELS: Record<Goal, string> = {
  muscle_gain: "Muscle Gain",
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
};

const GOAL_ICONS: Record<Goal, typeof TrendingUp> = {
  muscle_gain: TrendingUp,
  fat_loss: TrendingDown,
  maintenance: Minus,
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDefaultRate(goal: Goal): number {
  if (goal === "fat_loss") return -1.0;
  if (goal === "muscle_gain") return 0.5;
  return 0;
}

interface Profile {
  height_inches: number | null;
  weight_lbs: number | null;
  age: number | null;
  sex: string | null;
  goal: string | null;
  weekly_checkin_day: number | null;
  goal_rate_lb_per_week: number | null;
  body_fat_pct: number | null;
}

interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function MacrosTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ height_inches: null, weight_lbs: null, age: null, sex: null, goal: null, weekly_checkin_day: 0, goal_rate_lb_per_week: null, body_fat_pct: null });
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [todayWeight, setTodayWeight] = useState("");
  const [weightHistory, setWeightHistory] = useState<{ weigh_date: string; weight_lbs: number }[]>([]);
  const [setupMode, setSetupMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check-in state
  const [todayCheckIn, setTodayCheckIn] = useState<{ compliance: string; actual_calories: number; actual_protein_g: number; actual_carbs_g: number; actual_fat_g: number } | null>(null);
  const [checkCompliance, setCheckCompliance] = useState<"at" | "above" | "below" | "">("");
  const [checkCalories, setCheckCalories] = useState("");
  const [checkProtein, setCheckProtein] = useState("");
  const [checkCarbs, setCheckCarbs] = useState("");
  const [checkFat, setCheckFat] = useState("");

  // Form state for setup
  const [formHeight, setFormHeight] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formSex, setFormSex] = useState("male");
  const [formGoal, setFormGoal] = useState<Goal>("maintenance");
  const [formGoalRate, setFormGoalRate] = useState<number>(-1.0);
  const [formBodyFat, setFormBodyFat] = useState<number | null>(null);
  const [formSteps, setFormSteps] = useState("8000");
  const [formTrainingDays, setFormTrainingDays] = useState("5");
  const [formJobType, setFormJobType] = useState<JobType>("desk");
  const [setupStep, setSetupStep] = useState(1); // 1 = stats, 2 = activity, 3 = preview

  // Weekly check-in day
  const [weeklyDay, setWeeklyDay] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [checkedInThisWeek, setCheckedInThisWeek] = useState(false);
  const isWeeklyCheckinDay = new Date().getDay() === weeklyDay;

  useEffect(() => {
    if (!user) return;
    // Load profile
    supabase.from("profiles").select("height_inches, weight_lbs, age, sex, goal, weekly_checkin_day, body_fat_pct, goal_rate_lb_per_week, avg_daily_steps, training_days_per_week, job_type").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data as any);
        if (!data.height_inches && !data.age) setSetupMode(true);
        setFormHeight(data.height_inches ? String(data.height_inches) : "");
        setFormWeight(data.weight_lbs ? String(data.weight_lbs) : "");
        setFormAge(data.age ? String(data.age) : "");
        setFormSex(data.sex || "male");
        setFormGoal((data.goal as Goal) || "maintenance");
        const g = (data.goal as Goal) || "maintenance";
        setFormGoalRate((data as any).goal_rate_lb_per_week ?? getDefaultRate(g));
        setWeeklyDay((data as any).weekly_checkin_day ?? 0);
        setFormBodyFat((data as any).body_fat_pct ?? null);
        setFormSteps((data as any).avg_daily_steps ? String((data as any).avg_daily_steps) : "8000");
        setFormTrainingDays((data as any).training_days_per_week ? String((data as any).training_days_per_week) : "5");
        setFormJobType(((data as any).job_type as JobType) || "desk");
      }
    });
    // Load macro targets
    supabase.from("macro_targets").select("calories, protein_g, carbs_g, fat_g").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setTargets(data as MacroTargets);
    });
    // Load weight history
    supabase.from("daily_weights").select("weigh_date, weight_lbs").eq("user_id", user.id).order("weigh_date", { ascending: false }).limit(14).then(({ data }) => {
      if (data) setWeightHistory(data as any);
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = data?.find((d: any) => d.weigh_date === today);
      if (todayEntry) setTodayWeight(String((todayEntry as any).weight_lbs));
    });
    // Load today's check-in
    const today = new Date().toISOString().split("T")[0];
    supabase.from("daily_check_ins").select("compliance, actual_calories, actual_protein_g, actual_carbs_g, actual_fat_g").eq("user_id", user.id).eq("check_date", today).single().then(({ data }) => {
      if (data) {
        setTodayCheckIn(data as any);
        setCheckCompliance((data as any).compliance);
        if ((data as any).actual_calories) setCheckCalories(String((data as any).actual_calories));
        if ((data as any).actual_protein_g) setCheckProtein(String((data as any).actual_protein_g));
        if ((data as any).actual_carbs_g) setCheckCarbs(String((data as any).actual_carbs_g));
        if ((data as any).actual_fat_g) setCheckFat(String((data as any).actual_fat_g));
      }
    });
    // Check if already completed weekly check-in this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    supabase.from("macro_adjustments").select("id").eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString()).limit(1).then(({ data }) => {
        if (data && data.length > 0) setCheckedInThisWeek(true);
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      height_inches: Number(formHeight) || null,
      weight_lbs: Number(formWeight) || null,
      age: Number(formAge) || null,
      sex: formSex,
      goal: formGoal,
      goal_rate_lb_per_week: formGoalRate,
      body_fat_pct: formBodyFat,
      avg_daily_steps: Number(formSteps) || null,
      training_days_per_week: Number(formTrainingDays) || null,
      job_type: formJobType,
    } as any).eq("user_id", user.id);

    // Calculate macros using TDEE engine
    const tdeeGoal: TDEEGoal = formGoal === "fat_loss" ? "cut" : formGoal === "muscle_gain" ? "bulk" : "maintain";
    const result = calculateTDEE({
      weight_lbs: Number(formWeight) || 170,
      height_inches: Number(formHeight) || 70,
      age: Number(formAge) || 30,
      sex: (formSex === "female" ? "female" : "male") as Sex,
      avg_daily_steps: Number(formSteps) || 8000,
      training_days_per_week: Number(formTrainingDays) || 5,
      job_type: formJobType,
      body_fat_pct: formBodyFat,
      goal: tdeeGoal,
      goal_rate_lb_per_week: Math.abs(formGoalRate),
    });

    const { target_calories: calories, protein_g, carbs_g, fat_g } = result;

    await supabase.from("macro_targets").upsert({
      user_id: user.id,
      calories, protein_g, carbs_g, fat_g,
    }, { onConflict: "user_id" });

    setTargets({ calories, protein_g, carbs_g, fat_g });
    setProfile({ height_inches: Number(formHeight), weight_lbs: Number(formWeight), age: Number(formAge), sex: formSex, goal: formGoal, weekly_checkin_day: weeklyDay, goal_rate_lb_per_week: formGoalRate, body_fat_pct: formBodyFat });
    setSetupMode(false);
    setSetupStep(1);
    setSaving(false);
  };

  // Live TDEE preview calculation
  const getTDEEPreview = () => {
    const tdeeGoal: TDEEGoal = formGoal === "fat_loss" ? "cut" : formGoal === "muscle_gain" ? "bulk" : "maintain";
    return calculateTDEE({
      weight_lbs: Number(formWeight) || 170,
      height_inches: Number(formHeight) || 70,
      age: Number(formAge) || 30,
      sex: (formSex === "female" ? "female" : "male") as Sex,
      avg_daily_steps: Number(formSteps) || 8000,
      training_days_per_week: Number(formTrainingDays) || 5,
      job_type: formJobType,
      body_fat_pct: formBodyFat,
      goal: tdeeGoal,
      goal_rate_lb_per_week: Math.abs(formGoalRate),
    });
  };

  const saveWeight = async () => {
    if (!user || !todayWeight) return;
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("daily_weights").upsert({
      user_id: user.id,
      weight_lbs: Number(todayWeight),
      weigh_date: today,
    }, { onConflict: "user_id,weigh_date" });
  };

  const saveCheckIn = async () => {
    if (!user || !checkCompliance) return;
    const today = new Date().toISOString().split("T")[0];
    const payload = {
      user_id: user.id,
      check_date: today,
      compliance: checkCompliance,
      actual_calories: checkCalories ? Number(checkCalories) : null,
      actual_protein_g: checkProtein ? Number(checkProtein) : null,
      actual_carbs_g: checkCarbs ? Number(checkCarbs) : null,
      actual_fat_g: checkFat ? Number(checkFat) : null,
    };
    await supabase.from("daily_check_ins").upsert(payload, { onConflict: "user_id,check_date" });
    setTodayCheckIn(payload as any);
    toast({ title: "Check-in saved!" });
  };

  const saveWeeklyDay = async (day: number) => {
    if (!user) return;
    setWeeklyDay(day);
    await supabase.from("profiles").update({ weekly_checkin_day: day } as any).eq("user_id", user.id);
    toast({ title: `Weekly check-in set to ${DAY_NAMES[day]}` });
  };

  if (setupMode) {
    const preview = getTDEEPreview();

    return (
      <div className="px-4 pt-4 pb-nav space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= setupStep ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {setupStep === 1 && (
          <>
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Step 1 · Body Stats</p>
              <p className="text-xs text-muted-foreground">Enter your measurements to calculate your metabolic rate.</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">Height (in)</label>
                  <input type="number" value={formHeight} onChange={e => setFormHeight(e.target.value)} placeholder="70"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">Weight (lbs)</label>
                  <input type="number" value={formWeight} onChange={e => setFormWeight(e.target.value)} placeholder="180"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors mt-1" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">Age</label>
                  <input type="number" value={formAge} onChange={e => setFormAge(e.target.value)} placeholder="28"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">Sex</label>
                  <select value={formSex} onChange={e => setFormSex(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors mt-1">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Estimated Body Fat % */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Estimated Body Fat %</label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
                  Select the image that best matches your current physique.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {BF_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setFormBodyFat(opt.value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        formBodyFat === opt.value ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border hover:border-primary/30"
                      }`}>
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden">
                        <img src={opt.image} alt={opt.label}
                          className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10px] font-bold ${formBodyFat === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Goal</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["muscle_gain", "fat_loss", "maintenance"] as Goal[]).map(g => {
                    const Icon = GOAL_ICONS[g];
                    return (
                      <button key={g} onClick={() => { setFormGoal(g); setFormGoalRate(getDefaultRate(g)); }}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all ${
                          formGoal === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                        }`}>
                        <Icon className="w-4 h-4" />
                        {GOAL_LABELS[g]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Rate Slider */}
              {formGoal !== "maintenance" && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {formGoal === "fat_loss" ? "Weight Loss Rate" : "Weight Gain Rate"}
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
                    {formGoal === "fat_loss"
                      ? "0.5–1% of body weight per week (default ~1 lb/wk)"
                      : "0.25–0.5% of body weight per week (default ~0.5 lb/wk)"}
                  </p>
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                    <Slider
                      value={[Math.abs(formGoalRate)]}
                      onValueChange={([v]) => setFormGoalRate(formGoal === "fat_loss" ? -v : v)}
                      min={formGoal === "fat_loss" ? 0.5 : 0.25}
                      max={formGoal === "fat_loss" ? 2.0 : 1.0}
                      step={0.25}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">{formGoal === "fat_loss" ? "0.5 lb/wk" : "0.25 lb/wk"}</span>
                      <span className="text-sm font-black text-primary">{Math.abs(formGoalRate).toFixed(2)} lb/wk</span>
                      <span className="text-[10px] text-muted-foreground">{formGoal === "fat_loss" ? "2.0 lb/wk" : "1.0 lb/wk"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setSetupStep(2)}
              disabled={!formHeight || !formWeight || !formAge}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              Next → Activity Level
            </button>
          </>
        )}

        {setupStep === 2 && (
          <>
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Step 2 · Activity Level</p>
              <p className="text-xs text-muted-foreground">This helps us estimate your daily energy expenditure more accurately.</p>
            </div>

            <div className="space-y-4">
              {/* Average Daily Steps */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5" /> Average Daily Steps
                </label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">Check your phone's health app for your average.</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "4000", label: "< 5K", desc: "Sedentary" },
                    { value: "7000", label: "5–8K", desc: "Light" },
                    { value: "10000", label: "8–12K", desc: "Moderate" },
                    { value: "14000", label: "12K+", desc: "Very Active" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setFormSteps(opt.value)}
                      className={`flex flex-col items-center gap-0.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        formSteps === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      <span className="text-sm font-black">{opt.label}</span>
                      <span className="text-[10px]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input type="number" value={formSteps} onChange={e => setFormSteps(e.target.value)} placeholder="Custom"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-center" />
                </div>
              </div>

              {/* Training Days */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" /> Training Days Per Week
                </label>
                <div className="grid grid-cols-7 gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <button key={d} onClick={() => setFormTrainingDays(String(d))}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        Number(formTrainingDays) === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Job Type
                </label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">Helps estimate non-exercise activity.</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "desk" as JobType, label: "Desk Job", icon: "💻" },
                    { value: "on_feet" as JobType, label: "On My Feet", icon: "🚶" },
                    { value: "labor" as JobType, label: "Physical Labor", icon: "🔨" },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setFormJobType(opt.value)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        formJobType === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      <span className="text-lg">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSetupStep(1)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors">
                ← Back
              </button>
              <button onClick={() => setSetupStep(3)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                Next → Preview
              </button>
            </div>
          </>
        )}

        {setupStep === 3 && (
          <>
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Step 3 · Your Plan</p>
              <p className="text-xs text-muted-foreground">Here's your calculated daily targets based on your stats and activity.</p>
            </div>

            {/* TDEE Breakdown */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Energy Breakdown</p>
              <div className="space-y-2">
                {[
                  { label: "BMR (Basal Metabolic Rate)", value: preview.bmr },
                  { label: "NEAT (Steps + Job)", value: preview.neat },
                  { label: "TEF (Thermic Effect)", value: preview.tef },
                  { label: "Exercise Activity", value: preview.eef },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-xs font-bold text-foreground">+{row.value} kcal</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Maintenance TDEE</span>
                  <span className="text-sm font-black text-foreground">{preview.tdee} kcal</span>
                </div>
                {formGoal !== "maintenance" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formGoal === "fat_loss" ? "Deficit" : "Surplus"} ({Math.abs(formGoalRate).toFixed(2)} lb/wk)
                    </span>
                    <span className={`text-xs font-bold ${formGoal === "fat_loss" ? "text-destructive" : "text-primary"}`}>
                      {preview.target_calories - preview.tdee > 0 ? "+" : ""}{preview.target_calories - preview.tdee} kcal
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Macro Targets */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="text-center">
                <span className="text-4xl font-black text-foreground">{preview.target_calories}</span>
                <span className="text-sm text-muted-foreground ml-1">cal/day</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Protein", value: preview.protein_g, unit: "g", color: "text-primary" },
                  { label: "Carbs", value: preview.carbs_g, unit: "g", color: "text-foreground" },
                  { label: "Fat", value: preview.fat_g, unit: "g", color: "text-foreground" },
                ].map(m => (
                  <div key={m.label} className="text-center bg-secondary/50 rounded-xl py-3">
                    <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">{m.label} ({m.unit})</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSetupStep(2)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors">
                ← Back
              </button>
              <button onClick={saveProfile} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Lock It In 🔥"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const GoalIcon = (profile.goal ? GOAL_ICONS[profile.goal as Goal] : null) || Target;
  const bfLabel = profile.body_fat_pct != null
    ? BF_OPTIONS.find(o => o.value === profile.body_fat_pct)?.label || `~${profile.body_fat_pct}%`
    : null;

  return (
    <div className="px-4 pt-4 pb-nav space-y-5">
      {/* Goal badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-2">
          <GoalIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{profile.goal ? GOAL_LABELS[profile.goal as Goal] : "Set Goal"}</span>
        </div>
        {profile.goal_rate_lb_per_week != null && profile.goal !== "maintenance" && (
          <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-lg px-3 py-1.5">
            {Math.abs(profile.goal_rate_lb_per_week).toFixed(2)} lb/wk
          </span>
        )}
        {bfLabel && (
          <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-lg px-3 py-1.5">
            BF: {bfLabel}
          </span>
        )}
        <button onClick={() => { setSetupStep(1); setSetupMode(true); }} className="text-xs text-muted-foreground hover:text-foreground underline">Edit Stats</button>
      </div>

      {/* Weekly Check-In Wizard */}
      {showWizard && (
        <WeeklyCheckInWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            setCheckedInThisWeek(true);
            // Reload targets
            if (user) {
              supabase.from("macro_targets").select("calories, protein_g, carbs_g, fat_g").eq("user_id", user.id).single().then(({ data }) => {
                if (data) setTargets(data as MacroTargets);
              });
            }
          }}
        />
      )}

      {/* Weekly Check-In Day Banner */}
      {isWeeklyCheckinDay && !checkedInThisWeek && (
        <button onClick={() => setShowWizard(true)}
          className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 hover:bg-primary/15 transition-colors">
          <span className="text-2xl">📋</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">Weekly Check-In</p>
            <p className="text-xs text-muted-foreground">Tap to review your week with your coach</p>
          </div>
          <span className="text-primary font-bold text-xs">Start →</span>
        </button>
      )}

      {/* Completed check-in confirmation */}
      {isWeeklyCheckinDay && checkedInThisWeek && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Check-In Complete</p>
            <p className="text-xs text-muted-foreground">You've reviewed your week. Keep crushing it!</p>
          </div>
        </div>
      )}

      {/* Pending coach adjustment or past adjustment card */}
      <UserAdjustmentCard onMacrosUpdated={(macros) => setTargets(macros)} />
      {/* Macro Targets */}
      {targets && (
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Daily Targets</p>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="text-center mb-2">
              <span className="text-3xl font-black text-foreground">{targets.calories}</span>
              <span className="text-sm text-muted-foreground ml-1">cal</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label="Protein" value={targets.protein_g} unit="g" color="hsl(var(--primary))" />
              <MacroBar label="Carbs" value={targets.carbs_g} unit="g" color="hsl(43, 90%, 65%)" />
              <MacroBar label="Fat" value={targets.fat_g} unit="g" color="hsl(0, 62%, 50%)" />
            </div>
          </div>
        </div>
      )}

      {/* Daily Weigh-In */}
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Daily Weigh-In</p>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary" />
            <input type="number" inputMode="decimal" placeholder="Enter weight" value={todayWeight}
              onChange={e => setTodayWeight(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            <span className="text-xs text-muted-foreground">lbs</span>
            <button onClick={saveWeight} className="text-xs font-bold text-primary hover:text-primary/80">Save</button>
          </div>
          {weightHistory.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Recent</p>
              {weightHistory.slice(0, 7).map((w, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{new Date(w.weigh_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="text-foreground font-semibold">{w.weight_lbs} lbs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Macro Check-In */}
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Daily Macro Check-In</p>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground">How did you do with your macros today?</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "below" as const, label: "Below", icon: ArrowDown, color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
              { value: "at" as const, label: "At Target", icon: CheckCircle, color: "text-green-500 border-green-500/30 bg-green-500/10" },
              { value: "above" as const, label: "Above", icon: ArrowUp, color: "text-red-500 border-red-500/30 bg-red-500/10" },
            ]).map(opt => (
              <button key={opt.value} onClick={() => setCheckCompliance(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  checkCompliance === opt.value ? opt.color : "border-border text-muted-foreground hover:border-primary/30"
                }`}>
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>

          {checkCompliance && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">What did you actually eat?</p>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Protein (g)</label>
                    <input type="number" inputMode="numeric" value={checkProtein} onChange={e => {
                      setCheckProtein(e.target.value);
                      const p = Number(e.target.value) || 0;
                      const c = Number(checkCarbs) || 0;
                      const f = Number(checkFat) || 0;
                      setCheckCalories(String(p * 4 + c * 4 + f * 9));
                    }} placeholder="—"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:border-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Carbs (g)</label>
                    <input type="number" inputMode="numeric" value={checkCarbs} onChange={e => {
                      setCheckCarbs(e.target.value);
                      const p = Number(checkProtein) || 0;
                      const c = Number(e.target.value) || 0;
                      const f = Number(checkFat) || 0;
                      setCheckCalories(String(p * 4 + c * 4 + f * 9));
                    }} placeholder="—"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:border-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Fat (g)</label>
                    <input type="number" inputMode="numeric" value={checkFat} onChange={e => {
                      setCheckFat(e.target.value);
                      const p = Number(checkProtein) || 0;
                      const c = Number(checkCarbs) || 0;
                      const f = Number(e.target.value) || 0;
                      setCheckCalories(String(p * 4 + c * 4 + f * 9));
                    }} placeholder="—"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:border-primary mt-1" />
                  </div>
                </div>
                <div className="text-center py-2 bg-secondary/50 rounded-lg">
                  <span className="text-2xl font-black text-foreground">{checkCalories || "0"}</span>
                  <span className="text-xs text-muted-foreground ml-1">cal (auto-calculated)</span>
                </div>
              </div>
              <button onClick={saveCheckIn}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                {todayCheckIn ? "Update Check-In" : "Submit Check-In"}
              </button>
            </div>
          )}

          {todayCheckIn && !checkCompliance && (
            <div className="text-center py-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                todayCheckIn.compliance === "at" ? "bg-green-500/15 text-green-500" :
                todayCheckIn.compliance === "above" ? "bg-red-500/15 text-red-500" :
                "bg-yellow-500/15 text-yellow-500"
              }`}>
                Checked in: {todayCheckIn.compliance === "at" ? "At Target" : todayCheckIn.compliance === "above" ? "Above" : "Below"} ✓
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Check-In Day Picker */}
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Weekly Check-In Day</p>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Choose the day your coach will review your weekly progress.</p>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_SHORT.map((day, i) => (
              <button key={i} onClick={() => saveWeeklyDay(i)}
                className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                  weeklyDay === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}>
                {day}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isWeeklyCheckinDay
              ? "📋 Today is your weekly check-in day!"
              : `Next check-in: ${DAY_NAMES[weeklyDay]}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</p>
      <div className="w-full h-1 rounded-full bg-border mt-1">
        <div className="h-full rounded-full" style={{ width: "100%", background: color }} />
      </div>
    </div>
  );
}
