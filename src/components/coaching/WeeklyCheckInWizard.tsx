import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeAdjustment } from "@/lib/adjustmentEngine";
import { toast } from "@/hooks/use-toast";
import { X, ChevronRight, Scale, TrendingUp, TrendingDown, Minus, Zap, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";

interface WeeklyCheckInWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const ENERGY_LEVELS = ["😴 Drained", "😐 Low", "💪 Good", "🔥 Great", "⚡ Unstoppable"];
const HUNGER_LEVELS = ["🤤 Starving", "😋 Hungry", "😌 Manageable", "😊 Satisfied", "🫡 Not thinking about food"];

export function WeeklyCheckInWizard({ onClose, onComplete }: WeeklyCheckInWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  // Data from DB
  const [thisWeekWeights, setThisWeekWeights] = useState<number[]>([]);
  const [lastWeekWeights, setLastWeekWeights] = useState<number[]>([]);
  const [checkIns, setCheckIns] = useState<{ compliance: string }[]>([]);
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [profile, setProfile] = useState<{ goal_rate_lb_per_week: number | null; body_fat_pct: number | null; goal: string | null } | null>(null);

  // User inputs
  const [energy, setEnergy] = useState(2);
  const [hunger, setHunger] = useState(2);
  const [win, setWin] = useState("");
  const [struggle, setStruggle] = useState("");

  // Adjustment result
  const [adjResult, setAdjResult] = useState<ReturnType<typeof computeAdjustment> | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekStr = thisWeekStart.toISOString().split("T")[0];
    const lastWeekStr = lastWeekStart.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    Promise.all([
      supabase.from("daily_weights").select("weight_lbs, weigh_date").eq("user_id", user.id)
        .gte("weigh_date", thisWeekStr).lte("weigh_date", todayStr).order("weigh_date"),
      supabase.from("daily_weights").select("weight_lbs, weigh_date").eq("user_id", user.id)
        .gte("weigh_date", lastWeekStr).lt("weigh_date", thisWeekStr).order("weigh_date"),
      supabase.from("daily_check_ins").select("compliance, actual_calories").eq("user_id", user.id)
        .gte("check_date", thisWeekStr).lte("check_date", todayStr),
      supabase.from("macro_targets").select("calories, protein_g, carbs_g, fat_g").eq("user_id", user.id).single(),
      supabase.from("profiles").select("goal_rate_lb_per_week, body_fat_pct, goal").eq("user_id", user.id).single(),
    ]).then(([twRes, lwRes, ciRes, tRes, pRes]) => {
      if (twRes.data) setThisWeekWeights(twRes.data.map((d: any) => Number(d.weight_lbs)));
      if (lwRes.data) setLastWeekWeights(lwRes.data.map((d: any) => Number(d.weight_lbs)));
      if (ciRes.data) setCheckIns(ciRes.data as any);
      if (tRes.data) setTargets(tRes.data as MacroTargets);
      if (pRes.data) setProfile(pRes.data as any);
    });
  }, [user]);

  const thisWeekAvg = useMemo(() => {
    if (thisWeekWeights.length === 0) return null;
    return +(thisWeekWeights.reduce((a, b) => a + b, 0) / thisWeekWeights.length).toFixed(1);
  }, [thisWeekWeights]);

  const lastWeekAvg = useMemo(() => {
    if (lastWeekWeights.length === 0) return null;
    return +(lastWeekWeights.reduce((a, b) => a + b, 0) / lastWeekWeights.length).toFixed(1);
  }, [lastWeekWeights]);

  const weightChange = thisWeekAvg && lastWeekAvg ? +(thisWeekAvg - lastWeekAvg).toFixed(1) : null;

  const compliancePct = useMemo(() => {
    if (checkIns.length === 0) return 0;
    return Math.round((checkIns.filter(c => c.compliance === "at").length / checkIns.length) * 100);
  }, [checkIns]);

  const avgDailyCalories = useMemo(() => {
    const withCals = checkIns.filter((c: any) => c.actual_calories);
    if (withCals.length === 0) return targets?.calories || 2000;
    return Math.round(withCals.reduce((s: number, c: any) => s + Number(c.actual_calories), 0) / withCals.length);
  }, [checkIns, targets]);

  // Run adjustment engine when reaching the results step
  const runAdjustment = () => {
    if (!targets || !profile || thisWeekAvg === null || lastWeekAvg === null) return;
    const result = computeAdjustment({
      lastWeekAvgWeight: lastWeekAvg,
      thisWeekAvgWeight: thisWeekAvg,
      goalRateLbPerWeek: profile.goal_rate_lb_per_week || 0,
      avgDailyCalories,
      currentProteinG: targets.protein_g,
      currentCarbsG: targets.carbs_g,
      currentFatG: targets.fat_g,
      compliancePct,
      daysTracked: checkIns.length,
      bodyFatPct: profile.body_fat_pct,
    });
    setAdjResult(result);
  };

  const applyAdjustment = async () => {
    if (!user || !adjResult || !targets) return;
    setApplying(true);

    // Save to macro_adjustments
    await supabase.from("macro_adjustments").insert({
      user_id: user.id,
      last_week_avg_weight: lastWeekAvg!,
      this_week_avg_weight: thisWeekAvg!,
      actual_rate_lb_per_week: adjResult.actualWeeklyChange,
      goal_rate_lb_per_week: profile?.goal_rate_lb_per_week || 0,
      avg_daily_calories: avgDailyCalories,
      compliance_pct: compliancePct,
      days_tracked: checkIns.length,
      current_protein_g: targets.protein_g,
      current_carbs_g: targets.carbs_g,
      current_fat_g: targets.fat_g,
      suggested_calories: adjResult.suggestedCalories,
      suggested_protein_g: adjResult.suggestedProteinG,
      suggested_carbs_g: adjResult.suggestedCarbsG,
      suggested_fat_g: adjResult.suggestedFatG,
      suggested_calorie_change: adjResult.suggestedCalorieChange,
      energy_error_kcal_day: adjResult.energyErrorKcalDay,
      energy_error_kcal_week: adjResult.energyErrorKcalWeek,
      rate_error_g: adjResult.rateErrorG,
      rate_error_lb: adjResult.rateErrorLb,
      explanation: adjResult.explanation,
      status: "approved",
      applied_calories: adjResult.suggestedCalories,
      applied_protein_g: adjResult.suggestedProteinG,
      applied_carbs_g: adjResult.suggestedCarbsG,
      applied_fat_g: adjResult.suggestedFatG,
      resolved_at: new Date().toISOString(),
    });

    // Update macro_targets
    await supabase.from("macro_targets").update({
      calories: adjResult.suggestedCalories,
      protein_g: adjResult.suggestedProteinG,
      carbs_g: adjResult.suggestedCarbsG,
      fat_g: adjResult.suggestedFatG,
    }).eq("user_id", user.id);

    setApplying(false);
    toast({ title: "Macros updated! 🔥", description: "New targets are locked in." });
    onComplete();
  };

  const skipAdjustment = async () => {
    if (!user || !adjResult || !targets) return;
    // Save as deferred
    await supabase.from("macro_adjustments").insert({
      user_id: user.id,
      last_week_avg_weight: lastWeekAvg!,
      this_week_avg_weight: thisWeekAvg!,
      actual_rate_lb_per_week: adjResult.actualWeeklyChange,
      goal_rate_lb_per_week: profile?.goal_rate_lb_per_week || 0,
      avg_daily_calories: avgDailyCalories,
      compliance_pct: compliancePct,
      days_tracked: checkIns.length,
      current_protein_g: targets.protein_g,
      current_carbs_g: targets.carbs_g,
      current_fat_g: targets.fat_g,
      suggested_calories: adjResult.suggestedCalories,
      suggested_protein_g: adjResult.suggestedProteinG,
      suggested_carbs_g: adjResult.suggestedCarbsG,
      suggested_fat_g: adjResult.suggestedFatG,
      suggested_calorie_change: adjResult.suggestedCalorieChange,
      energy_error_kcal_day: adjResult.energyErrorKcalDay,
      energy_error_kcal_week: adjResult.energyErrorKcalWeek,
      rate_error_g: adjResult.rateErrorG,
      rate_error_lb: adjResult.rateErrorLb,
      explanation: adjResult.explanation,
      status: "deferred",
      defer_reason: "User chose to keep current targets",
    });
    toast({ title: "Check-in saved", description: "Keeping current targets." });
    onComplete();
  };

  const totalSteps = 5;
  const canProceed = () => {
    if (step === 0) return true; // welcome
    if (step === 1) return true; // weight review (auto)
    if (step === 2) return true; // compliance (auto)
    if (step === 3) return true; // energy/hunger
    return true;
  };

  const goNext = () => {
    if (step === 3) {
      // Before showing results, run adjustment engine
      runAdjustment();
    }
    setStep(s => Math.min(s + 1, totalSteps - 1));
  };

  const goalLabel = profile?.goal === "fat_loss" ? "Fat Loss" : profile?.goal === "muscle_gain" ? "Muscle Gain" : "Maintenance";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Weekly Check-In</p>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6 pt-8">
            <div className="text-center space-y-3">
              <span className="text-5xl">📋</span>
              <h2 className="text-2xl font-black text-foreground">Let's Review Your Week</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We'll walk through your progress together — just like sitting down with your coach.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Weight Trend</p>
                  <p className="text-xs text-muted-foreground">{thisWeekWeights.length} weigh-ins this week</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Nutrition Check</p>
                  <p className="text-xs text-muted-foreground">{checkIns.length} daily check-ins logged</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">How You're Feeling</p>
                  <p className="text-xs text-muted-foreground">Energy, hunger & mindset</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Weight Review */}
        {step === 1 && (
          <div className="space-y-5 pt-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Step 1</p>
              <h2 className="text-xl font-black text-foreground mt-1">Weight Check</h2>
              <p className="text-xs text-muted-foreground mt-1">Here's what the scale says this week.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Last Week Avg</p>
                <p className="text-2xl font-black text-foreground">{lastWeekAvg ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">lbs</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">This Week Avg</p>
                <p className="text-2xl font-black text-foreground">{thisWeekAvg ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">lbs</p>
              </div>
            </div>

            {weightChange !== null && (
              <div className={`bg-card border rounded-2xl p-4 text-center space-y-1 ${
                weightChange < 0 ? "border-green-500/30" : weightChange > 0 ? "border-yellow-500/30" : "border-border"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {weightChange < 0 ? <TrendingDown className="w-5 h-5 text-green-500" /> :
                   weightChange > 0 ? <TrendingUp className="w-5 h-5 text-yellow-500" /> :
                   <Minus className="w-5 h-5 text-muted-foreground" />}
                  <p className="text-xl font-black text-foreground">{weightChange > 0 ? "+" : ""}{weightChange} lbs</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile?.goal === "fat_loss"
                    ? weightChange < 0 ? "Trending in the right direction 💪" : "Scale went up — let's look at the data."
                    : profile?.goal === "muscle_gain"
                    ? weightChange > 0 ? "Gaining as planned 💪" : "Scale went down — let's review."
                    : "Staying steady."}
                </p>
              </div>
            )}

            {thisWeekWeights.length < 3 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚠️ Only {thisWeekWeights.length} weigh-in{thisWeekWeights.length !== 1 ? "s" : ""} this week. Aim for 5+ for an accurate average.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Nutrition Compliance */}
        {step === 2 && (
          <div className="space-y-5 pt-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Step 2</p>
              <h2 className="text-xl font-black text-foreground mt-1">Nutrition Review</h2>
              <p className="text-xs text-muted-foreground mt-1">How consistent were you with your macros?</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-3">
              <p className="text-5xl font-black text-primary">{compliancePct}%</p>
              <p className="text-sm font-semibold text-foreground">Macro Compliance</p>
              <p className="text-xs text-muted-foreground">
                {compliancePct >= 80 ? "Solid consistency — the engine has good data to work with." :
                 compliancePct >= 50 ? "Room to improve. More consistent tracking = better adjustments." :
                 "Low compliance this week. Focus on hitting targets before adjusting macros."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "At Target", count: checkIns.filter(c => c.compliance === "at").length, color: "text-green-500" },
                { label: "Below", count: checkIns.filter(c => c.compliance === "below").length, color: "text-yellow-500" },
                { label: "Above", count: checkIns.filter(c => c.compliance === "above").length, color: "text-red-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>

            {targets && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Avg Daily Intake</p>
                <p className="text-lg font-black text-foreground">{avgDailyCalories} <span className="text-xs font-normal text-muted-foreground">kcal/day</span></p>
                <p className="text-xs text-muted-foreground">Target: {targets.calories} kcal</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Energy, Hunger & Wins */}
        {step === 3 && (
          <div className="space-y-5 pt-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Step 3</p>
              <h2 className="text-xl font-black text-foreground mt-1">How Are You Feeling?</h2>
              <p className="text-xs text-muted-foreground mt-1">This helps us make smarter decisions beyond the numbers.</p>
            </div>

            {/* Energy */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Energy Level This Week</p>
              <div className="grid grid-cols-5 gap-1.5">
                {ENERGY_LEVELS.map((label, i) => (
                  <button key={i} onClick={() => setEnergy(i)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      energy === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                    }`}>
                    <span className="text-lg block">{label.split(" ")[0]}</span>
                    <span className="text-[8px] text-muted-foreground block leading-tight mt-0.5">{label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hunger */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Hunger Level This Week</p>
              <div className="grid grid-cols-5 gap-1.5">
                {HUNGER_LEVELS.map((label, i) => (
                  <button key={i} onClick={() => setHunger(i)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      hunger === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                    }`}>
                    <span className="text-lg block">{label.split(" ")[0]}</span>
                    <span className="text-[8px] text-muted-foreground block leading-tight mt-0.5">{label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Win */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">🏆 Biggest Win This Week</p>
              <input value={win} onChange={e => setWin(e.target.value)} placeholder="e.g. Hit protein every day"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>

            {/* Struggle */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">🔥 Biggest Challenge</p>
              <input value={struggle} onChange={e => setStruggle(e.target.value)} placeholder="e.g. Late night snacking"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
        )}

        {/* Step 4: Adjustment Recommendation */}
        {step === 4 && (
          <div className="space-y-5 pt-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Step 4</p>
              <h2 className="text-xl font-black text-foreground mt-1">Your Recommendation</h2>
              <p className="text-xs text-muted-foreground mt-1">Based on your data, here's what the engine suggests.</p>
            </div>

            {/* Summary card */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <p className="text-sm font-bold text-foreground">Week Summary</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <span className="text-muted-foreground">Weight Δ</span>
                  <p className="font-bold text-foreground">{weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange} lbs` : "N/A"}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <span className="text-muted-foreground">Goal</span>
                  <p className="font-bold text-foreground">{goalLabel} ({profile?.goal_rate_lb_per_week ? `${profile.goal_rate_lb_per_week > 0 ? "+" : ""}${profile.goal_rate_lb_per_week} lb/wk` : "—"})</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <span className="text-muted-foreground">Compliance</span>
                  <p className="font-bold text-foreground">{compliancePct}%</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <span className="text-muted-foreground">Days Tracked</span>
                  <p className="font-bold text-foreground">{checkIns.length}/7</p>
                </div>
              </div>
            </div>

            {adjResult && (
              <>
                {/* Recommendation */}
                {!adjResult.eligible ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">⏸ No Change Recommended</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{adjResult.ineligibleReason}</p>
                  </div>
                ) : adjResult.suggestedCalorieChange === 0 && !adjResult.holdSteady ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">✅ You're On Track</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Keep doing what you're doing. No macro changes needed this week.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{adjResult.holdSteady ? "⏸" : adjResult.tooFast ? "⚠️" : "🎯"}</span>
                      <p className="text-sm font-bold text-foreground">
                        {adjResult.holdSteady ? "Hold Steady" :
                         adjResult.tooFast ? "Slow Down" :
                         `${Math.abs(adjResult.suggestedCalorieChange)} cal/day ${adjResult.suggestedCalorieChange > 0 ? "decrease" : "increase"}`}
                      </p>
                    </div>

                    {/* Current vs Suggested */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Suggested New Targets</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Cal", current: targets?.calories, suggested: adjResult.suggestedCalories },
                          { label: "P", current: targets?.protein_g, suggested: adjResult.suggestedProteinG },
                          { label: "C", current: targets?.carbs_g, suggested: adjResult.suggestedCarbsG },
                          { label: "F", current: targets?.fat_g, suggested: adjResult.suggestedFatG },
                        ].map(m => {
                          const diff = (m.suggested ?? 0) - (m.current ?? 0);
                          return (
                            <div key={m.label} className="text-center bg-secondary/50 rounded-xl p-2 space-y-0.5">
                              <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                              <p className="text-sm font-black text-foreground">{m.suggested}</p>
                              {diff !== 0 && (
                                <p className={`text-[10px] font-bold ${diff > 0 ? "text-green-500" : "text-red-500"}`}>
                                  {diff > 0 ? "+" : ""}{diff}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {adjResult.hitCalorieFloor && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">
                          ⚠️ Calorie floor reached. Consider adding steps or cardio instead of cutting further.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={applyAdjustment} disabled={applying}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {applying ? "Applying..." : "Apply Changes 🔥"}
                      </button>
                      <button onClick={skipAdjustment}
                        className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors">
                        Keep Current
                      </button>
                    </div>
                  </div>
                )}

                {/* If no change needed or ineligible, just close */}
                {(!adjResult.eligible || (adjResult.suggestedCalorieChange === 0 && !adjResult.holdSteady)) && (
                  <button onClick={() => { skipAdjustment(); }}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                    Complete Check-In ✓
                  </button>
                )}
              </>
            )}

            {!adjResult && thisWeekAvg === null && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                  Not enough weight data to run the adjustment engine. Log daily weigh-ins for better recommendations.
                </p>
                <button onClick={onComplete} className="mt-3 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                  Complete Check-In ✓
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav (not on last step) */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <button onClick={goNext} disabled={!canProceed()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {step === 0 ? "Let's Go" : step === 3 ? "See Recommendation" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
