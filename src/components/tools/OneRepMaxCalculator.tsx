import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Save, TrendingUp, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function brzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight * 2;
  return Math.round(weight * (36 / (37 - reps)));
}

const PERCENTAGE_TABLE = [100, 95, 90, 85, 80, 75, 70, 65, 60];

interface MaxHistory {
  exercise_name: string;
  weight_lbs: number;
  recorded_at: string;
}

export function OneRepMaxCalculator() {
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<MaxHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryExercise, setSelectedHistoryExercise] = useState<string | null>(null);

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  const hasInput = w > 0 && r > 0 && r <= 30;
  const estimated1RM = hasInput ? Math.round((epley(w, r) + brzycki(w, r)) / 2) : 0;

  // Load 1RM history
  useEffect(() => {
    if (!user) return;
    supabase
      .from("max_history")
      .select("exercise_name, weight_lbs, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true })
      .then(({ data }) => {
        if (data) setHistory(data as MaxHistory[]);
      });
  }, [user]);

  const uniqueExercises = useMemo(() => {
    return [...new Set(history.map((h) => h.exercise_name))].sort();
  }, [history]);

  const selectedHistory = useMemo(() => {
    if (!selectedHistoryExercise) return [];
    return history
      .filter((h) => h.exercise_name === selectedHistoryExercise)
      .map((h) => ({
        date: new Date(h.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: Number(h.weight_lbs),
      }));
  }, [history, selectedHistoryExercise]);

  const saveMax = async () => {
    if (!user || !exerciseName.trim() || !estimated1RM || saving) return;
    setSaving(true);

    try {
      // Save to user_maxes (current max)
      const { error: upsertError } = await supabase.from("user_maxes").upsert(
        { user_id: user.id, exercise_name: exerciseName.trim(), weight_lbs: estimated1RM },
        { onConflict: "user_id,exercise_name" }
      );
      if (upsertError) {
        console.error("upsert error:", upsertError);
        toast({ title: "Error saving 1RM", description: upsertError.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      // Save to max_history (historical record)
      const { error: historyError } = await supabase.from("max_history").insert({
        user_id: user.id,
        exercise_name: exerciseName.trim(),
        weight_lbs: estimated1RM,
      });
      if (historyError) {
        console.error("history error:", historyError);
      }

      // Refresh history
      const { data } = await supabase
        .from("max_history")
        .select("exercise_name, weight_lbs, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true });
      if (data) setHistory(data as MaxHistory[]);

      toast({ title: `${exerciseName} 1RM saved as ${estimated1RM} lbs` });
    } catch (err) {
      console.error("save error:", err);
      toast({ title: "Error saving 1RM", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Exercise Name */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exercise Name</label>
        <input type="text" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} placeholder="e.g. Bench Press"
          className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Weight + Reps */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight (lbs)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="225"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-lg font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="5" min="1" max="30"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-lg font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      {/* Result */}
      {hasInput && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Estimated 1 Rep Max</p>
            <p className="text-5xl font-black text-primary">{estimated1RM}</p>
            <p className="text-sm text-muted-foreground">lbs</p>
          </div>

          {exerciseName.trim() && user && (
            <button onClick={saveMax} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : `Save as ${exerciseName} 1RM`}
            </button>
          )}

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Percentage Chart</p>
            <div className="space-y-1">
              {PERCENTAGE_TABLE.map((pct) => (
                <div key={pct} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                  <span className="text-sm font-semibold text-muted-foreground">{pct}%</span>
                  <span className="text-sm font-black text-foreground">{Math.round(estimated1RM * (pct / 100))} lbs</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Average of Epley ({epley(w, r)} lbs) and Brzycki ({brzycki(w, r)} lbs) formulas
          </p>
        </div>
      )}

      {r > 30 && (
        <p className="text-xs text-destructive text-center">Enter 30 reps or fewer for an accurate estimate</p>
      )}

      {/* 1RM History */}
      {uniqueExercises.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">1RM History</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{uniqueExercises.length} exercises</span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div className="px-4 pb-4 space-y-3">
              {/* Exercise list — each row is clickable */}
              <div className="space-y-1.5">
                {uniqueExercises.map((ex) => {
                  const latestEntry = [...history].reverse().find(h => h.exercise_name === ex);
                  const latestWeight = latestEntry ? Number(latestEntry.weight_lbs) : null;
                  const isSelected = selectedHistoryExercise === ex;
                  return (
                    <button key={ex} onClick={() => setSelectedHistoryExercise(isSelected ? null : ex)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-transparent hover:border-border"}`}>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>{ex}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {latestWeight && (
                          <span className="text-sm font-black text-foreground">{latestWeight} lbs</span>
                        )}
                        {isSelected ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chart for selected exercise */}
              {selectedHistoryExercise && selectedHistory.length > 1 ? (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={35} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : selectedHistoryExercise && selectedHistory.length === 1 ? (
                <div className="text-center py-4">
                  <p className="text-2xl font-black text-primary">{selectedHistory[0].weight} lbs</p>
                  <p className="text-xs text-muted-foreground mt-1">Recorded {selectedHistory[0].date}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Save more estimates to see trends</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
