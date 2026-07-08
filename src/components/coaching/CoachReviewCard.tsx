import { useState, useMemo } from "react";
import { computeAdjustment, type AdjustmentInput, type AdjustmentResult } from "@/lib/adjustmentEngine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, AlertTriangle, Check, Edit3, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface CoachReviewCardProps {
  clientUserId: string;
  coachId: string;
  clientWeights: { weigh_date: string; weight_lbs: number }[];
  clientCheckIns: { check_date: string; compliance: string; actual_calories: number | null; actual_protein_g: number | null; actual_carbs_g: number | null; actual_fat_g: number | null }[];
  currentMacros: { calories: number; protein_g: number; carbs_g: number; fat_g: number } | null;
  clientGoal: string | null;
  clientGoalRate: number | null;
  onMacrosUpdated: (macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number }) => void;
}

export function CoachReviewCard({
  clientUserId, coachId, clientWeights, clientCheckIns, currentMacros, clientGoal, clientGoalRate, onMacrosUpdated
}: CoachReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"review" | "edit" | "defer">("review");
  const [deferReason, setDeferReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [overrideCalories, setOverrideCalories] = useState(0);
  const [overrideProtein, setOverrideProtein] = useState(0);
  const [overrideCarbs, setOverrideCarbs] = useState(0);
  const [overrideFat, setOverrideFat] = useState(0);
  const [goalRate, setGoalRate] = useState(() => {
    if (clientGoalRate != null) return clientGoalRate;
    if (clientGoal === "fat_loss") return -1.0;
    if (clientGoal === "muscle_gain") return 0.5;
    return 0;
  });

  // Compute weekly averages from weight data
  const { lastWeekAvg, thisWeekAvg, daysTrackedThisWeek, compliancePct, avgDailyCalories } = useMemo(() => {
    const today = new Date();
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - today.getDay());
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekWeights = clientWeights.filter(w => {
      const d = new Date(w.weigh_date + "T00:00:00");
      return d >= startOfThisWeek && d <= today;
    });
    const lastWeekWeights = clientWeights.filter(w => {
      const d = new Date(w.weigh_date + "T00:00:00");
      return d >= startOfLastWeek && d < startOfThisWeek;
    });

    const thisWeekAvg = thisWeekWeights.length > 0
      ? thisWeekWeights.reduce((s, w) => s + Number(w.weight_lbs), 0) / thisWeekWeights.length
      : null;
    const lastWeekAvg = lastWeekWeights.length > 0
      ? lastWeekWeights.reduce((s, w) => s + Number(w.weight_lbs), 0) / lastWeekWeights.length
      : null;

    // Check-ins this week
    const thisWeekCheckIns = clientCheckIns.filter(ci => {
      const d = new Date(ci.check_date + "T00:00:00");
      return d >= startOfThisWeek && d <= today;
    });

    const daysTracked = thisWeekCheckIns.length;
    const atTarget = thisWeekCheckIns.filter(ci => ci.compliance === "at").length;
    const compliancePct = daysTracked > 0 ? Math.round((atTarget / daysTracked) * 100) : 0;

    const withCalories = thisWeekCheckIns.filter(ci => ci.actual_calories != null);
    const avgDailyCalories = withCalories.length > 0
      ? Math.round(withCalories.reduce((s, ci) => s + (ci.actual_calories || 0), 0) / withCalories.length)
      : currentMacros?.calories || 2000;

    return { lastWeekAvg, thisWeekAvg, daysTrackedThisWeek: daysTracked, compliancePct, avgDailyCalories };
  }, [clientWeights, clientCheckIns, currentMacros]);

  const canCompute = lastWeekAvg !== null && thisWeekAvg !== null && currentMacros !== null;

  const result: AdjustmentResult | null = useMemo(() => {
    if (!canCompute || !currentMacros) return null;
    const input: AdjustmentInput = {
      lastWeekAvgWeight: lastWeekAvg!,
      thisWeekAvgWeight: thisWeekAvg!,
      goalRateLbPerWeek: goalRate,
      avgDailyCalories,
      currentProteinG: currentMacros.protein_g,
      currentCarbsG: currentMacros.carbs_g,
      currentFatG: currentMacros.fat_g,
      compliancePct,
      daysTracked: daysTrackedThisWeek,
    };
    return computeAdjustment(input);
  }, [canCompute, lastWeekAvg, thisWeekAvg, goalRate, avgDailyCalories, currentMacros, compliancePct, daysTrackedThisWeek]);

  // Initialize override values when result changes
  const initOverrides = () => {
    if (result) {
      setOverrideCalories(result.suggestedCalories);
      setOverrideProtein(result.suggestedProteinG);
      setOverrideCarbs(result.suggestedCarbsG);
      setOverrideFat(result.suggestedFatG);
    }
  };

  const savePending = async () => {
    if (!result || !currentMacros) return;
    setSaving(true);
    await supabase.from("macro_adjustments").insert({
      user_id: clientUserId,
      coach_id: coachId,
      last_week_avg_weight: lastWeekAvg!,
      this_week_avg_weight: thisWeekAvg!,
      goal_rate_lb_per_week: goalRate,
      avg_daily_calories: avgDailyCalories,
      current_protein_g: currentMacros.protein_g,
      current_carbs_g: currentMacros.carbs_g,
      current_fat_g: currentMacros.fat_g,
      compliance_pct: compliancePct,
      days_tracked: daysTrackedThisWeek,
      actual_rate_lb_per_week: result.actualWeeklyChange,
      rate_error_lb: result.rateErrorLb,
      rate_error_g: result.rateErrorG,
      energy_error_kcal_week: result.energyErrorKcalWeek,
      energy_error_kcal_day: result.energyErrorKcalDay,
      suggested_calorie_change: result.suggestedCalorieChange,
      suggested_calories: result.suggestedCalories,
      suggested_protein_g: result.suggestedProteinG,
      suggested_carbs_g: result.suggestedCarbsG,
      suggested_fat_g: result.suggestedFatG,
      status: "pending",
      explanation: result.explanation,
    } as any);
    setSaving(false);
    setMode("review");
    toast({ title: "Sent to client for approval" });
  };

  const saveAdjustment = async (status: "approved" | "overridden" | "deferred") => {
    if (!result || !currentMacros) return;
    setSaving(true);

    const appliedMacros = status === "overridden"
      ? { calories: overrideCalories, protein_g: overrideProtein, carbs_g: overrideCarbs, fat_g: overrideFat }
      : status === "approved"
        ? { calories: result.suggestedCalories, protein_g: result.suggestedProteinG, carbs_g: result.suggestedCarbsG, fat_g: result.suggestedFatG }
        : null;

    // Insert adjustment log
    await supabase.from("macro_adjustments").insert({
      user_id: clientUserId,
      coach_id: coachId,
      last_week_avg_weight: lastWeekAvg!,
      this_week_avg_weight: thisWeekAvg!,
      goal_rate_lb_per_week: goalRate,
      avg_daily_calories: avgDailyCalories,
      current_protein_g: currentMacros.protein_g,
      current_carbs_g: currentMacros.carbs_g,
      current_fat_g: currentMacros.fat_g,
      compliance_pct: compliancePct,
      days_tracked: daysTrackedThisWeek,
      actual_rate_lb_per_week: result.actualWeeklyChange,
      rate_error_lb: result.rateErrorLb,
      rate_error_g: result.rateErrorG,
      energy_error_kcal_week: result.energyErrorKcalWeek,
      energy_error_kcal_day: result.energyErrorKcalDay,
      suggested_calorie_change: result.suggestedCalorieChange,
      suggested_calories: result.suggestedCalories,
      suggested_protein_g: result.suggestedProteinG,
      suggested_carbs_g: result.suggestedCarbsG,
      suggested_fat_g: result.suggestedFatG,
      status,
      applied_calories: appliedMacros?.calories ?? null,
      applied_protein_g: appliedMacros?.protein_g ?? null,
      applied_carbs_g: appliedMacros?.carbs_g ?? null,
      applied_fat_g: appliedMacros?.fat_g ?? null,
      defer_reason: status === "deferred" ? deferReason : null,
      resolved_at: new Date().toISOString(),
      explanation: result.explanation,
    } as any);

    // Apply new macros if approved or overridden
    if (appliedMacros) {
      await supabase.from("macro_targets").update({
        ...appliedMacros,
        set_by: coachId,
      }).eq("user_id", clientUserId);
      onMacrosUpdated(appliedMacros);
    }

    setSaving(false);
    setMode("review");
    toast({ title: status === "deferred" ? "Adjustment deferred" : "Macros updated" });
  };

  if (!canCompute) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-bold text-muted-foreground uppercase">Weekly Adjustment Engine</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Need at least 2 weeks of weight data to compute adjustments.
          {lastWeekAvg === null && " Missing last week weights."}
          {thisWeekAvg === null && " Missing this week weights."}
          {!currentMacros && " No macro targets set."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase flex-1 text-left">Weekly Adjustment Engine</span>
        {result && !result.eligible && (
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Low Compliance</span>
        )}
        {result && result.eligible && result.suggestedCalorieChange !== 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            result.suggestedCalorieChange > 0 ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
          }`}>
            {result.suggestedCalorieChange > 0 ? "" : "+"}{-result.suggestedCalorieChange} kcal/day
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && result && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Goal rate input */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Goal Rate (lb/week)</label>
            <input type="number" step="0.1" value={goalRate} onChange={e => setGoalRate(Number(e.target.value))}
              className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:border-primary" />
            <span className="text-[10px] text-muted-foreground">
              {goalRate < 0 ? "(fat loss)" : goalRate > 0 ? "(muscle gain)" : "(maintenance)"}
            </span>
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Last Week Avg</p>
              <p className="text-lg font-black text-foreground">{lastWeekAvg!.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">lbs</span></p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">This Week Avg</p>
              <p className="text-lg font-black text-foreground">{thisWeekAvg!.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">lbs</span></p>
            </div>
          </div>

          {/* Computed values */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Goal Rate</span>
              <span className="font-bold text-foreground">{goalRate > 0 ? "+" : ""}{goalRate} lb/week</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Actual Rate</span>
              <span className="font-bold text-foreground">{result.actualWeeklyChange > 0 ? "+" : ""}{result.actualWeeklyChange.toFixed(2)} lb/week</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Rate Error</span>
              <span className={`font-bold ${result.rateErrorLb > 0 ? "text-red-500" : result.rateErrorLb < 0 ? "text-green-500" : "text-foreground"}`}>
                {result.rateErrorLb > 0 ? "+" : ""}{result.rateErrorLb.toFixed(2)} lb/week ({Math.abs(result.rateErrorG).toFixed(0)} g)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Energy Error</span>
              <span className="font-bold text-foreground">
                {Math.abs(result.energyErrorKcalWeek).toFixed(0)} kcal/week ({Math.abs(result.energyErrorKcalDay).toFixed(0)} kcal/day)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Compliance</span>
              <span className={`font-bold ${compliancePct >= 80 ? "text-green-500" : "text-yellow-500"}`}>
                {compliancePct}% ({daysTrackedThisWeek}/7 days)
              </span>
            </div>
          </div>

          {/* Ineligible warning */}
          {!result.eligible && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-600">{result.ineligibleReason}</p>
            </div>
          )}

          {/* Suggested new targets */}
          {result.eligible && (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2">Suggested Change</p>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <span className={`text-2xl font-black ${result.suggestedCalorieChange > 0 ? "text-red-500" : result.suggestedCalorieChange < 0 ? "text-green-500" : "text-foreground"}`}>
                    {result.suggestedCalorieChange > 0 ? "" : "+"}{-result.suggestedCalorieChange}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">kcal/day</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2">Suggested New Targets</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Calories", current: currentMacros!.calories, suggested: result.suggestedCalories, unit: "" },
                    { label: "Protein", current: currentMacros!.protein_g, suggested: result.suggestedProteinG, unit: "g" },
                    { label: "Carbs", current: currentMacros!.carbs_g, suggested: result.suggestedCarbsG, unit: "g" },
                    { label: "Fat", current: currentMacros!.fat_g, suggested: result.suggestedFatG, unit: "g" },
                  ].map(m => {
                    const diff = m.suggested - m.current;
                    return (
                      <div key={m.label} className="text-center">
                        <p className="text-lg font-black text-foreground">{m.suggested}{m.unit}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                        <p className={`text-[10px] font-bold ${diff < 0 ? "text-red-500" : diff > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                          {diff > 0 ? "+" : ""}{diff}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Manual edit mode */}
          {mode === "edit" && (
            <div className="space-y-3 border border-primary/20 rounded-lg p-3 bg-primary/5">
              <p className="text-[10px] text-primary uppercase font-bold">Manual Override</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Protein (g)", value: overrideProtein, set: setOverrideProtein },
                  { label: "Carbs (g)", value: overrideCarbs, set: setOverrideCarbs },
                  { label: "Fat (g)", value: overrideFat, set: setOverrideFat },
                ].map(m => (
                  <div key={m.label}>
                    <label className="text-[10px] text-muted-foreground uppercase">{m.label}</label>
                    <input type="number" value={m.value} onChange={e => {
                      m.set(Number(e.target.value));
                      if (m.label.includes("Protein")) setOverrideCalories(Number(e.target.value) * 4 + overrideCarbs * 4 + overrideFat * 9);
                      else if (m.label.includes("Carbs")) setOverrideCalories(overrideProtein * 4 + Number(e.target.value) * 4 + overrideFat * 9);
                      else setOverrideCalories(overrideProtein * 4 + overrideCarbs * 4 + Number(e.target.value) * 9);
                    }}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary mt-1" />
                  </div>
                ))}
              </div>
              <div className="text-center py-2 bg-secondary/50 rounded-lg">
                <span className="text-2xl font-black text-foreground">{overrideCalories}</span>
                <span className="text-xs text-muted-foreground ml-1">cal</span>
              </div>
            </div>
          )}

          {/* Defer mode */}
          {mode === "defer" && (
            <div className="space-y-2 border border-yellow-500/20 rounded-lg p-3 bg-yellow-500/5">
              <p className="text-[10px] text-yellow-600 uppercase font-bold">Defer Reason</p>
              <textarea value={deferReason} onChange={e => setDeferReason(e.target.value)} placeholder="Why are you deferring this adjustment?"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary min-h-[60px]" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {mode === "review" && (
              <>
                <button onClick={() => saveAdjustment("approved")} disabled={saving || !result.eligible}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Apply Now"}
                </button>
                <button onClick={() => savePending()} disabled={saving || !result.eligible}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50">
                  <Clock className="w-3.5 h-3.5" /> Send to Client
                </button>
                <button onClick={() => { initOverrides(); setMode("edit"); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 border border-border transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setMode("defer")}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 border border-border transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Defer
                </button>
              </>
            )}
            {mode === "edit" && (
              <>
                <button onClick={() => saveAdjustment("overridden")} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Apply Override"}
                </button>
                <button onClick={() => setMode("review")} className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border">Cancel</button>
              </>
            )}
            {mode === "defer" && (
              <>
                <button onClick={() => saveAdjustment("deferred")} disabled={saving || !deferReason}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold text-xs hover:bg-yellow-500/90 transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Confirm Defer"}
                </button>
                <button onClick={() => setMode("review")} className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
