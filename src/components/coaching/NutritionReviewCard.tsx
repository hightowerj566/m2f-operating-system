// Coach-facing nutrition review: compares current macro targets against the
// week's actual intake and weight change, and recommends whether macros need
// an adjustment based on the member's goal and rate.
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import type { WeeklySnapshot } from "@/lib/coaching/coachingTypes";
import { NUTRITION_OPTIONS } from "@/lib/coaching/coachingConstants";

interface MacroTargets {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  updated_at?: string | null;
}

interface Profile {
  goal?: string | null;
  goal_rate_lb_per_week?: number | null;
  weight_lbs?: number | null;
}

interface Props {
  snapshot: WeeklySnapshot | null;
  macros: MacroTargets | null;
  profile: Profile | null;
  nutrition_rating: string | null;
  nutrition_notes: string | null;
}

type Recommendation = {
  status: "on_track" | "adjust" | "insufficient_data";
  headline: string;
  detail: string;
  suggestion?: string;
};

function evaluate(
  snapshot: WeeklySnapshot | null,
  macros: MacroTargets | null,
  profile: Profile | null,
): Recommendation {
  const goal = (profile?.goal ?? "maintain") as "cut" | "bulk" | "maintain";
  const rate = profile?.goal_rate_lb_per_week ?? (goal === "cut" ? -1 : goal === "bulk" ? 0.5 : 0);
  const change = snapshot?.weight_change ?? null;
  const daysLogged = snapshot?.nutrition_days_logged ?? 0;
  const avgCals = snapshot?.avg_calories ?? null;
  const target = macros?.calories ?? null;

  if (daysLogged < 3 || change == null) {
    return {
      status: "insufficient_data",
      headline: "Not enough data",
      detail: `Only ${daysLogged} day${daysLogged === 1 ? "" : "s"} of nutrition logged and weight trend unavailable.`,
      suggestion: "Ask member to log nutrition and weight consistently before adjusting macros.",
    };
  }

  // Expected weekly change based on goal (cut = negative rate)
  const expected = goal === "cut" ? -Math.abs(rate) : goal === "bulk" ? Math.abs(rate) : 0;
  const delta = change - expected; // positive = gaining more/losing less than expected

  // Tolerance: ±0.5 lb from expected
  if (Math.abs(delta) <= 0.5) {
    return {
      status: "on_track",
      headline: "On track — no macro change needed",
      detail: `Weight change ${change.toFixed(1)} lb matches ${goal} goal (expected ${expected.toFixed(1)} lb/wk).`,
    };
  }

  // Off track — suggest adjustment
  const direction = delta > 0 ? "reduce" : "increase";
  const kcalShift = Math.round(Math.abs(delta) * 250 / 25) * 25; // ~250 kcal per lb/wk, round to 25
  const newTarget = target ? (direction === "reduce" ? target - kcalShift : target + kcalShift) : null;

  return {
    status: "adjust",
    headline: `Consider adjusting macros — ${direction} calories`,
    detail: `Weight change ${change.toFixed(1)} lb vs expected ${expected.toFixed(1)} lb/wk (${delta > 0 ? "+" : ""}${delta.toFixed(1)} off target).`,
    suggestion: target && newTarget
      ? `Suggest ${direction} of ~${kcalShift} kcal → new target ~${newTarget} kcal (from ${target}).`
      : `Suggest ${direction} of ~${kcalShift} kcal/day.`,
  };
}

export function NutritionReviewCard({ snapshot, macros, profile, nutrition_rating, nutrition_notes }: Props) {
  const rec = evaluate(snapshot, macros, profile);
  const daysLogged = snapshot?.nutrition_days_logged ?? 0;
  const avgCals = snapshot?.avg_calories;
  const avgProtein = snapshot?.avg_protein_g;
  const weightChange = snapshot?.weight_change;
  const goal = profile?.goal?.replace(/_/g, " ") ?? "—";
  const rate = profile?.goal_rate_lb_per_week;

  const ratingLabel = NUTRITION_OPTIONS.find((o) => o.value === nutrition_rating)?.label;

  const badge =
    rec.status === "on_track"
      ? { icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" }
      : rec.status === "adjust"
      ? { icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" }
      : { icon: AlertTriangle, cls: "bg-muted text-muted-foreground border-border" };
  const Icon = badge.icon;

  const calDelta = avgCals != null && macros?.calories ? avgCals - macros.calories : null;
  const proteinDelta = avgProtein != null && macros?.protein_g ? avgProtein - macros.protein_g : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Recommendation banner */}
      <div className={`rounded-lg border p-3 flex gap-3 ${badge.cls}`}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">{rec.headline}</p>
          <p className="text-xs opacity-90">{rec.detail}</p>
          {rec.suggestion && <p className="text-xs opacity-90">{rec.suggestion}</p>}
        </div>
      </div>

      {/* Goal context */}
      <div className="grid sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
        <p><span className="text-muted-foreground">Goal:</span> {goal}</p>
        <p><span className="text-muted-foreground">Target rate:</span> {rate != null ? `${rate > 0 ? "+" : ""}${rate} lb/wk` : "—"}</p>
        <p className="flex items-center gap-1.5">
          <span className="text-muted-foreground">This week:</span>
          {weightChange != null ? (
            <>
              {weightChange > 0 ? <TrendingUp className="h-4 w-4 text-amber-500" /> : <TrendingDown className="h-4 w-4 text-emerald-500" />}
              {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} lb
            </>
          ) : "—"}
        </p>
      </div>

      {/* Targets vs actuals */}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Target vs Actual (7-day avg)</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <MacroRow label="Calories" target={macros?.calories} actual={avgCals} delta={calDelta} unit="kcal" />
          <MacroRow label="Protein" target={macros?.protein_g} actual={avgProtein} delta={proteinDelta} unit="g" />
          <div>
            <p className="text-muted-foreground text-xs">Carbs target</p>
            <p className="font-medium">{macros?.carbs_g ?? "—"} g</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fat target</p>
            <p className="font-medium">{macros?.fat_g ?? "—"} g</p>
          </div>
        </div>
      </div>

      {/* Member self-report */}
      <div className="pt-2 border-t border-border space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Days logged</span>
          <span className={daysLogged < 4 ? "text-destructive font-medium" : ""}>{daysLogged}/7</span>
        </div>
        {ratingLabel && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Member rating</span>
            <span className={nutrition_rating === "<50" || nutrition_rating === "not_tracked" ? "text-destructive font-medium" : ""}>
              {ratingLabel}
            </span>
          </div>
        )}
        {nutrition_notes && (
          <div className="pt-1">
            <p className="text-muted-foreground text-xs mb-1">Member notes</p>
            <p className="text-sm whitespace-pre-wrap">{nutrition_notes}</p>
          </div>
        )}
        {macros?.updated_at && (
          <p className="text-xs text-muted-foreground pt-1">
            Macros last set {new Date(macros.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, target, actual, delta, unit }: { label: string; target: number | null | undefined; actual: number | null | undefined; delta: number | null; unit: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">
        {actual != null ? Math.round(actual) : "—"} <span className="text-muted-foreground text-xs">/ {target ?? "—"} {unit}</span>
      </p>
      {delta != null && (
        <p className={`text-xs ${Math.abs(delta) > (unit === "kcal" ? 150 : 15) ? "text-amber-500" : "text-muted-foreground"}`}>
          {delta > 0 ? "+" : ""}{Math.round(delta)} vs target
        </p>
      )}
    </div>
  );
}
