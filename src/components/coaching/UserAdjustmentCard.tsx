import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Info, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdjustmentRecord {
  id: string;
  created_at: string;
  status: string;
  explanation: string | null;
  suggested_calorie_change: number;
  applied_calories: number | null;
  applied_protein_g: number | null;
  applied_carbs_g: number | null;
  applied_fat_g: number | null;
  suggested_calories: number;
  suggested_protein_g: number;
  suggested_carbs_g: number;
  suggested_fat_g: number;
  actual_rate_lb_per_week: number;
  goal_rate_lb_per_week: number;
  coach_id: string | null;
}

interface UserAdjustmentCardProps {
  onMacrosUpdated?: (macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number }) => void;
}

export function UserAdjustmentCard({ onMacrosUpdated }: UserAdjustmentCardProps) {
  const { user } = useAuth();
  const [latest, setLatest] = useState<AdjustmentRecord | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("macro_adjustments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setLatest(data[0] as any);
      });
  }, [user]);

  if (!latest) return null;

  const isRecent = (new Date().getTime() - new Date(latest.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (!isRecent) return null;

  const isPending = latest.status === "pending";
  const applied = latest.status === "approved" || latest.status === "overridden";
  const deferred = latest.status === "deferred";
  const isCoachSuggestion = !!latest.coach_id;

  const approveAdjustment = async () => {
    if (!user || !latest) return;
    setApplying(true);

    const macros = {
      calories: latest.suggested_calories,
      protein_g: latest.suggested_protein_g,
      carbs_g: latest.suggested_carbs_g,
      fat_g: latest.suggested_fat_g,
    };

    // Update adjustment status
    await supabase.from("macro_adjustments").update({
      status: "approved",
      applied_calories: macros.calories,
      applied_protein_g: macros.protein_g,
      applied_carbs_g: macros.carbs_g,
      applied_fat_g: macros.fat_g,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", latest.id);

    // Apply new macros
    await supabase.from("macro_targets").update(macros).eq("user_id", user.id);

    setLatest({ ...latest, status: "approved", applied_calories: macros.calories, applied_protein_g: macros.protein_g, applied_carbs_g: macros.carbs_g, applied_fat_g: macros.fat_g });
    onMacrosUpdated?.(macros);
    setApplying(false);
    toast({ title: "Macros updated! 🔥", description: "New targets are locked in." });
  };

  const declineAdjustment = async () => {
    if (!user || !latest) return;
    setApplying(true);

    await supabase.from("macro_adjustments").update({
      status: "deferred",
      defer_reason: "Client declined suggested changes",
      resolved_at: new Date().toISOString(),
    } as any).eq("id", latest.id);

    setLatest({ ...latest, status: "deferred" });
    setApplying(false);
    toast({ title: "Changes declined", description: "Keeping current targets." });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 p-4 hover:bg-secondary/30 transition-colors">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex-1 text-left">
          {isPending ? "Pending Macro Review" : "Weekly Adjustment"}
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isPending ? "bg-primary/10 text-primary animate-pulse" :
          applied ? "bg-green-500/10 text-green-500" :
          deferred ? "bg-yellow-500/10 text-yellow-500" :
          "bg-secondary text-muted-foreground"
        }`}>
          {isPending ? "Action Needed" : applied ? "Applied" : deferred ? "Declined" : "Pending"}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {/* Coach badge */}
          {isCoachSuggestion && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-primary font-bold uppercase">Coach Recommendation</p>
            </div>
          )}

          {/* Explanation */}
          {latest.explanation && (
            <div className="bg-secondary/50 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground whitespace-pre-line">{latest.explanation}</p>
            </div>
          )}

          {/* Suggested change */}
          {latest.suggested_calorie_change !== 0 && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <span className={`text-2xl font-black ${latest.suggested_calorie_change > 0 ? "text-destructive" : "text-green-500"}`}>
                {latest.suggested_calorie_change > 0 ? "" : "+"}{-latest.suggested_calorie_change}
              </span>
              <span className="text-xs text-muted-foreground ml-1">kcal/day</span>
            </div>
          )}

          {/* Suggested targets */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2">
              {applied ? "Applied Targets" : "Suggested New Targets"}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: applied ? latest.applied_calories : latest.suggested_calories, unit: "" },
                { label: "Protein", value: applied ? latest.applied_protein_g : latest.suggested_protein_g, unit: "g" },
                { label: "Carbs", value: applied ? latest.applied_carbs_g : latest.suggested_carbs_g, unit: "g" },
                { label: "Fat", value: applied ? latest.applied_fat_g : latest.suggested_fat_g, unit: "g" },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-lg font-black text-foreground">{m.value}{m.unit}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons for pending adjustments */}
          {isPending && (
            <div className="flex gap-2">
              <button onClick={approveAdjustment} disabled={applying}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> {applying ? "Applying..." : "Approve Changes"}
              </button>
              <button onClick={declineAdjustment} disabled={applying}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Reviewed {new Date(latest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}
