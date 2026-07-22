// Coach-facing nutrition review: compares current macro targets against the
// week's actual intake and weight change, recommends adjustments, and lets the
// coach approve the suggestion, dismiss it, or manually edit macros in place.
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  userId: string;
  coachId?: string | null;
  snapshot: WeeklySnapshot | null;
  macros: MacroTargets | null;
  profile: Profile | null;
  nutrition_rating: string | null;
  nutrition_notes: string | null;
  onUpdated?: () => void;
}

type Recommendation = {
  status: "on_track" | "adjust" | "insufficient_data";
  headline: string;
  detail: string;
  suggestion?: string;
  suggested?: { calories: number; protein_g: number; carbs_g: number; fat_g: number } | null;
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
  const target = macros?.calories ?? null;

  if (daysLogged < 3 || change == null) {
    return {
      status: "insufficient_data",
      headline: "Not enough data",
      detail: `Only ${daysLogged} day${daysLogged === 1 ? "" : "s"} of nutrition logged and weight trend unavailable.`,
      suggestion: "Ask member to log nutrition and weight consistently before adjusting macros.",
    };
  }

  const expected = goal === "cut" ? -Math.abs(rate) : goal === "bulk" ? Math.abs(rate) : 0;
  const delta = change - expected;

  if (Math.abs(delta) <= 0.5) {
    return {
      status: "on_track",
      headline: "On track — no macro change needed",
      detail: `Weight change ${change.toFixed(1)} lb matches ${goal} goal (expected ${expected.toFixed(1)} lb/wk).`,
    };
  }

  const direction = delta > 0 ? "reduce" : "increase";
  const kcalShift = Math.round(Math.abs(delta) * 250 / 25) * 25;
  const newTarget = target ? (direction === "reduce" ? target - kcalShift : target + kcalShift) : null;

  // Rebalance carbs/fat proportionally around unchanged protein.
  let suggested: Recommendation["suggested"] = null;
  if (macros?.calories && macros.protein_g && macros.carbs_g != null && macros.fat_g != null && newTarget) {
    const proteinKcal = macros.protein_g * 4;
    const nonProteinKcal = Math.max(0, newTarget - proteinKcal);
    const currentCarbKcal = macros.carbs_g * 4;
    const currentFatKcal = macros.fat_g * 9;
    const currentNonProtein = currentCarbKcal + currentFatKcal || 1;
    const carbShare = currentCarbKcal / currentNonProtein;
    const newCarbs = Math.round((nonProteinKcal * carbShare) / 4 / 5) * 5;
    const newFat = Math.round((nonProteinKcal * (1 - carbShare)) / 9 / 5) * 5;
    suggested = {
      calories: newTarget,
      protein_g: macros.protein_g,
      carbs_g: newCarbs,
      fat_g: newFat,
    };
  }

  return {
    status: "adjust",
    headline: `Consider adjusting macros — ${direction} calories`,
    detail: `Weight change ${change.toFixed(1)} lb vs expected ${expected.toFixed(1)} lb/wk (${delta > 0 ? "+" : ""}${delta.toFixed(1)} off target).`,
    suggestion: target && newTarget
      ? `Suggest ${direction} of ~${kcalShift} kcal → new target ~${newTarget} kcal (from ${target}).`
      : `Suggest ${direction} of ~${kcalShift} kcal/day.`,
    suggested,
  };
}

export function NutritionReviewCard({ userId, coachId, snapshot, macros, profile, nutrition_rating, nutrition_notes, onUpdated }: Props) {
  const { toast } = useToast();
  const rec = evaluate(snapshot, macros, profile);
  const daysLogged = snapshot?.nutrition_days_logged ?? 0;
  const avgCals = snapshot?.avg_calories;
  const avgProtein = snapshot?.avg_protein_g;
  const weightChange = snapshot?.weight_change;
  const goal = profile?.goal?.replace(/_/g, " ") ?? "—";
  const rate = profile?.goal_rate_lb_per_week;
  const ratingLabel = NUTRITION_OPTIONS.find((o) => o.value === nutrition_rating)?.label;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [form, setForm] = useState({
    calories: macros?.calories ?? 0,
    protein_g: macros?.protein_g ?? 0,
    carbs_g: macros?.carbs_g ?? 0,
    fat_g: macros?.fat_g ?? 0,
  });

  useEffect(() => {
    setForm({
      calories: macros?.calories ?? 0,
      protein_g: macros?.protein_g ?? 0,
      carbs_g: macros?.carbs_g ?? 0,
      fat_g: macros?.fat_g ?? 0,
    });
  }, [macros?.calories, macros?.protein_g, macros?.carbs_g, macros?.fat_g]);

  const badge =
    rec.status === "on_track"
      ? { icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" }
      : rec.status === "adjust"
      ? { icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" }
      : { icon: AlertTriangle, cls: "bg-muted text-muted-foreground border-border" };
  const Icon = badge.icon;

  const calDelta = avgCals != null && macros?.calories ? avgCals - macros.calories : null;
  const proteinDelta = avgProtein != null && macros?.protein_g ? avgProtein - macros.protein_g : null;

  async function saveMacros(next: { calories: number; protein_g: number; carbs_g: number; fat_g: number }, label: string) {
    if (!userId) return;
    if ([next.calories, next.protein_g, next.carbs_g, next.fat_g].some((n) => !Number.isFinite(n) || n < 0)) {
      toast({ title: "Enter valid macro numbers", variant: "destructive" });
      return;
    }
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db
      .from("macro_targets")
      .upsert(
        {
          user_id: userId,
          calories: Math.round(next.calories),
          protein_g: Math.round(next.protein_g),
          carbs_g: Math.round(next.carbs_g),
          fat_g: Math.round(next.fat_g),
          set_by: coachId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't update macros", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: label });
    setEditing(false);
    onUpdated?.();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Recommendation banner */}
      <div className={`rounded-lg border p-3 flex gap-3 ${badge.cls}`}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-semibold text-sm">{rec.headline}</p>
          <p className="text-xs opacity-90">{rec.detail}</p>
          {rec.suggestion && <p className="text-xs opacity-90">{rec.suggestion}</p>}

          {rec.status === "adjust" && !dismissed && (
            <div className="flex flex-wrap gap-2 pt-2">
              {rec.suggested && (
                <button
                  disabled={saving}
                  onClick={() => saveMacros(rec.suggested!, "Suggestion approved — macros updated")}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500 text-black px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Approve suggestion
                </button>
              )}
              <button
                disabled={saving}
                onClick={() => { setEditing(true); if (rec.suggested) setForm(rec.suggested); }}
                className="inline-flex items-center gap-1 rounded-md border border-current px-3 py-1.5 text-xs font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" /> Adjust manually
              </button>
              <button
                disabled={saving}
                onClick={() => { setDismissed(true); toast({ title: "Suggestion dismissed — macros unchanged" }); }}
                className="inline-flex items-center gap-1 rounded-md border border-current px-3 py-1.5 text-xs font-semibold"
              >
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
            </div>
          )}
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

      {/* Targets vs actuals OR editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {editing ? "Edit macro targets" : "Target vs Actual (7-day avg)"}
          </p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Pencil className="h-3 w-3" /> Edit macros
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MacroInput label="Calories" unit="kcal" value={form.calories} onChange={(v) => setForm((f) => ({ ...f, calories: v }))} />
              <MacroInput label="Protein" unit="g" value={form.protein_g} onChange={(v) => setForm((f) => ({ ...f, protein_g: v }))} />
              <MacroInput label="Carbs" unit="g" value={form.carbs_g} onChange={(v) => setForm((f) => ({ ...f, carbs_g: v }))} />
              <MacroInput label="Fat" unit="g" value={form.fat_g} onChange={(v) => setForm((f) => ({ ...f, fat_g: v }))} />
            </div>
            <p className="text-xs text-muted-foreground">
              Computed: {form.protein_g * 4 + form.carbs_g * 4 + form.fat_g * 9} kcal from macros
            </p>
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={() => saveMacros(form, "Macros updated")}
                className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save macros"}
              </button>
              <button
                disabled={saving}
                onClick={() => { setEditing(false); setForm({ calories: macros?.calories ?? 0, protein_g: macros?.protein_g ?? 0, carbs_g: macros?.carbs_g ?? 0, fat_g: macros?.fat_g ?? 0 }); }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
        )}
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

function MacroInput({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label} ({unit})</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
      />
    </label>
  );
}
