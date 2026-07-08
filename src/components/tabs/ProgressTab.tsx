import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Flame, Target, Trophy, Calendar, Dumbbell, CheckCircle2, Award } from "lucide-react";

type TimeRange = "week" | "month" | "all";

interface WeightEntry {
  weigh_date: string;
  weight_lbs: number;
}

interface MaxEntry {
  exercise_name: string;
  weight_lbs: number;
  updated_at: string;
}

interface CheckIn {
  check_date: string;
  compliance: string;
  actual_protein_g: number | null;
}

interface WorkoutLog {
  workout_date: string;
  exercise_name: string;
}

interface DailyEntry {
  standard_date: string;
  completions: Record<string, boolean>;
}

interface StandardDef {
  key: string;
  label: string;
  emoji: string;
}

export function ProgressTab() {
  const { user } = useAuth();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [maxes, setMaxes] = useState<MaxEntry[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [targets, setTargets] = useState<{ protein_g: number } | null>(null);
  const [weightRange, setWeightRange] = useState<TimeRange>("month");
  const [standardsHistory, setStandardsHistory] = useState<DailyEntry[]>([]);
  const [standards, setStandards] = useState<StandardDef[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("daily_weights").select("weigh_date, weight_lbs").eq("user_id", user.id).order("weigh_date", { ascending: true }),
      supabase.from("user_maxes").select("exercise_name, weight_lbs, updated_at").eq("user_id", user.id),
      supabase.from("daily_check_ins").select("check_date, compliance, actual_protein_g").eq("user_id", user.id).order("check_date", { ascending: false }).limit(90),
      supabase.from("workout_logs").select("workout_date, exercise_name").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(200),
      supabase.from("macro_targets").select("protein_g").eq("user_id", user.id).single(),
      supabase.from("daily_standards").select("standard_date, completions").eq("user_id", user.id).order("standard_date", { ascending: false }).limit(90),
      supabase.from("standard_definitions").select("key, label, emoji").or(`and(is_global.eq.true,target_user_id.is.null),target_user_id.eq.${user.id},created_by.eq.${user.id}`).eq("is_active", true).order("sort_order"),
    ]).then(([wRes, mRes, cRes, lRes, tRes, sRes, sdRes]) => {
      if (wRes.data) setWeights(wRes.data as WeightEntry[]);
      if (mRes.data) setMaxes(mRes.data as MaxEntry[]);
      if (cRes.data) setCheckIns(cRes.data as CheckIn[]);
      if (lRes.data) setWorkoutLogs(lRes.data as WorkoutLog[]);
      if (tRes.data) setTargets(tRes.data as any);
      if (sRes.data) setStandardsHistory((sRes.data as any[]).map(h => ({ standard_date: h.standard_date, completions: h.completions || {} })));
      if (sdRes.data) setStandards(sdRes.data as any[]);
    });
  }, [user]);

  const filteredWeights = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (weightRange === "week") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7); }
    else if (weightRange === "month") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30); }
    else return weights;
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return weights.filter((w) => w.weigh_date >= cutoffStr);
  }, [weights, weightRange]);

  const weightChartData = useMemo(() => {
    const raw = filteredWeights.map((w) => ({
      date: new Date(w.weigh_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: Number(w.weight_lbs),
      trend: 0,
    }));
    // Compute 7-day exponential moving average for trend line
    if (raw.length > 0) {
      const alpha = 2 / (Math.min(7, raw.length) + 1);
      raw[0].trend = raw[0].weight;
      for (let i = 1; i < raw.length; i++) {
        raw[i].trend = +(alpha * raw[i].weight + (1 - alpha) * raw[i - 1].trend).toFixed(1);
      }
    }
    return raw;
  }, [filteredWeights]);

  const weightChange = useMemo(() => {
    if (filteredWeights.length < 2) return null;
    return +(Number(filteredWeights[filteredWeights.length - 1].weight_lbs) - Number(filteredWeights[0].weight_lbs)).toFixed(1);
  }, [filteredWeights]);

  // Workout stats
  const workoutStreak = useMemo(() => {
    const uniqueDates = [...new Set(workoutLogs.map((l) => l.workout_date))].sort().reverse();
    if (uniqueDates.length === 0) return 0;
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today); expected.setDate(expected.getDate() - i);
      if (uniqueDates.includes(expected.toISOString().split("T")[0])) streak++;
      else break;
    }
    return streak;
  }, [workoutLogs]);

  const workoutsThisWeek = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return new Set(workoutLogs.filter((l) => l.workout_date >= cutoff.toISOString().split("T")[0]).map((l) => l.workout_date)).size;
  }, [workoutLogs]);

  const workoutsThisMonth = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return new Set(workoutLogs.filter((l) => l.workout_date >= cutoff.toISOString().split("T")[0]).map((l) => l.workout_date)).size;
  }, [workoutLogs]);

  // Nutrition
  const proteinCompliance = useMemo(() => {
    if (checkIns.length === 0 || !targets?.protein_g) return null;
    const last30 = checkIns.slice(0, 30);
    const hitDays = last30.filter((c) => c.actual_protein_g && c.actual_protein_g >= targets.protein_g * 0.9).length;
    return Math.round((hitDays / last30.length) * 100);
  }, [checkIns, targets]);

  const macroAdherence = useMemo(() => {
    if (checkIns.length === 0) return null;
    const last30 = checkIns.slice(0, 30);
    return Math.round((last30.filter((c) => c.compliance === "at").length / last30.length) * 100);
  }, [checkIns]);

  // Standards streak & weekly score
  const standardsStreak = useMemo(() => {
    if (standardsHistory.length === 0 || standards.length === 0) return 0;
    let count = 0;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const threshold = Math.max(1, Math.floor(standards.length * 0.75));
    for (let i = 0; i < standardsHistory.length; i++) {
      const expected = new Date(now); expected.setDate(expected.getDate() - i);
      const expStr = expected.toISOString().split("T")[0];
      const entry = standardsHistory.find((h) => h.standard_date === expStr);
      if (!entry) break;
      const dayScore = standards.filter((s) => entry.completions[s.key]).length;
      if (dayScore >= threshold) count++;
      else break;
    }
    return count;
  }, [standardsHistory, standards]);

  const weeklyStandardsScore = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const weekEntries = standardsHistory.filter((h) => h.standard_date >= cutoffStr);
    if (weekEntries.length === 0 || standards.length === 0) return 0;
    const totalHit = weekEntries.reduce((sum, entry) => sum + standards.filter((s) => entry.completions[s.key]).length, 0);
    return Math.round((totalHit / (weekEntries.length * standards.length)) * 100);
  }, [standardsHistory, standards]);

  // Strength PRs
  const keyLifts = ["Bench Press", "Squat", "Deadlift"];
  const currentMaxes = useMemo(() => keyLifts.map((lift) => {
    const entry = maxes.find((m) => m.exercise_name === lift);
    return { name: lift, weight: entry ? Number(entry.weight_lbs) : null };
  }), [maxes]);

  const totalMaxes = useMemo(() => {
    const big3 = keyLifts.map(l => maxes.find(m => m.exercise_name === l));
    if (big3.every(m => m)) return big3.reduce((s, m) => s + Number(m!.weight_lbs), 0);
    return null;
  }, [maxes]);

  const RangeSelector = ({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) => (
    <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
      {(["week", "month", "all"] as TimeRange[]).map((r) => (
        <button key={r} onClick={() => onChange(r)}
          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${value === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {r === "week" ? "7D" : r === "month" ? "30D" : "ALL"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Command Center Header */}
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Command Center</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground mt-1">Progress</h1>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{standardsStreak}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Streak</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{weeklyStandardsScore}%</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Standards</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{workoutsThisWeek}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Workouts</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{proteinCompliance !== null ? `${proteinCompliance}%` : "—"}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Protein</p>
        </div>
      </div>

      {/* Bodyweight Progress */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {weightChange !== null && weightChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-success" />
              ) : (
                <TrendingUp className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Bodyweight</p>
              {weightChange !== null && (
                <p className={`text-[10px] font-semibold ${weightChange < 0 ? "text-success" : weightChange > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {weightChange > 0 ? "+" : ""}{weightChange} lbs
                </p>
              )}
            </div>
          </div>
          <RangeSelector value={weightRange} onChange={setWeightRange} />
        </div>
        {weightChartData.length > 1 ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
                <Line type="monotone" dataKey="trend" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Trend" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">Log daily weigh-ins to see your trend</p>
        )}
      </div>

      {/* Strength Overview */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Strength</p>
          </div>
          {totalMaxes && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Big 3 Total</p>
              <p className="text-lg font-black text-primary">{totalMaxes} lbs</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {currentMaxes.map((lift) => (
            <div key={lift.name} className="bg-secondary/50 rounded-xl p-3 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase truncate">{lift.name.replace(" Press", "")}</p>
              <p className="text-lg font-black text-foreground">{lift.weight ? `${lift.weight}` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">lbs</p>
            </div>
          ))}
        </div>
        {currentMaxes.every((m) => m.weight === null) && (
          <p className="text-xs text-muted-foreground text-center">Use the 1RM Calculator in Tools to track strength</p>
        )}
      </div>

      {/* Workout Consistency */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Workout Consistency</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/50 rounded-xl p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Streak</p>
            <p className="text-2xl font-black text-primary">{workoutStreak}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">This Week</p>
            <p className="text-2xl font-black text-foreground">{workoutsThisWeek}</p>
            <p className="text-[10px] text-muted-foreground">workouts</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">This Month</p>
            <p className="text-2xl font-black text-foreground">{workoutsThisMonth}</p>
            <p className="text-[10px] text-muted-foreground">workouts</p>
          </div>
        </div>
      </div>

      {/* Nutrition Compliance */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Nutrition Compliance</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Protein Target Hit</p>
            <p className="text-3xl font-black text-primary">{proteinCompliance !== null ? `${proteinCompliance}%` : "—"}</p>
            <p className="text-[10px] text-muted-foreground">of days (last 30)</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Macro Adherence</p>
            <p className="text-3xl font-black text-foreground">{macroAdherence !== null ? `${macroAdherence}%` : "—"}</p>
            <p className="text-[10px] text-muted-foreground">on target (last 30)</p>
          </div>
        </div>
        {checkIns.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">Log daily check-ins in the Macros tab to see compliance</p>
        )}
      </div>

      {/* Standards Weekly Breakdown */}
      {standards.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Standards This Week</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {standards.map((s) => {
              const now = new Date();
              const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
              const cutoffStr = cutoff.toISOString().split("T")[0];
              const weekEntries = standardsHistory.filter((h) => h.standard_date >= cutoffStr);
              const hits = weekEntries.filter((e) => e.completions[s.key]).length;
              return (
                <div key={s.key} className="bg-secondary/50 rounded-xl p-2 text-center space-y-0.5">
                  <span className="text-lg">{s.emoji}</span>
                  <p className="text-lg font-black text-foreground">{hits}<span className="text-xs text-muted-foreground font-normal">/7</span></p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
