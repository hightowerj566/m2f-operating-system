// Section C of the coach review: training / nutrition / readiness / fatherhood /
// standards performance data from the immutable snapshot. Shows "Not enough data"
// instead of misleading zeros.
import type { WeeklySnapshot } from "@/lib/coaching/coachingTypes";

const na = "Not enough data";
const fmt = (v: number | null | undefined, suffix = "") => (v == null ? na : `${v}${suffix}`);
const delta = (v: number | null | undefined, suffix = "") => (v == null ? na : `${v > 0 ? "+" : ""}${v}${suffix}`);

export function ClientWeeklySnapshot({ snapshot }: { snapshot: WeeklySnapshot | null }) {
  if (!snapshot) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No snapshot recorded for this check-in.</div>;
  }
  const s = snapshot;
  const macros = (s.snapshot_json?.macro_targets ?? null) as { calories: number; protein_g: number } | null;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Block title="Training">
        <Row k="Completed / scheduled" v={s.workouts_scheduled != null ? `${s.workouts_completed ?? 0} / ${s.workouts_scheduled}` : `${s.workouts_completed ?? 0} logged`} />
        <Row k="Compliance" v={fmt(s.workout_compliance_pct, "%")} />
      </Block>
      <Block title="Nutrition">
        <Row k="Days logged" v={fmt(s.nutrition_days_logged)} />
        <Row k="Compliance" v={fmt(s.nutrition_compliance_pct, "%")} />
        <Row k="Avg calories" v={fmt(s.avg_calories)} />
        <Row k="Avg protein" v={fmt(s.avg_protein_g, "g")} />
        {macros && <Row k="Targets" v={`${macros.calories} kcal · ${macros.protein_g}g protein`} />}
        <Row k="Weight avg" v={fmt(s.weekly_avg_weight, " lb")} />
        <Row k="Weight change" v={delta(s.weight_change, " lb")} highlight={s.weight_change != null && Math.abs(s.weight_change) >= 1.5} />
      </Block>
      <Block title="Readiness">
        <Row k="Current score" v={fmt(s.readiness_score)} />
        <Row k="Previous" v={fmt(s.previous_readiness_score)} />
        <Row k="Movement" v={delta(s.readiness_delta)} highlight={s.readiness_delta != null && s.readiness_delta <= -5} />
      </Block>
      <Block title="Fatherhood Prep">
        <Row k="Build tasks this week" v={fmt(s.build_tasks_completed)} highlight={s.build_tasks_completed === 0} />
        <Row k="Lessons completed" v={fmt(s.lessons_completed)} />
        <Row k="Weekly mission" v={s.mission_completed == null ? na : s.mission_completed ? "Completed" : "Not completed"} />
        <Row k="Timeline" v={s.days_until_due != null ? `${s.days_until_due} days until due` : s.baby_age_days != null ? `Baby ${s.baby_age_days} days old` : na} />
      </Block>
      <Block title="Standards & Consistency">
        <Row k="Standards completion" v={fmt(s.standards_completion_pct, "%")} highlight={s.standards_completion_pct != null && s.standards_completion_pct < 50} />
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "text-destructive font-medium" : "text-foreground"}>{v}</span>
    </div>
  );
}
