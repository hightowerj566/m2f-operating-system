// Section D: small decision-useful trend charts (recharts, already a dependency).
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HistoryRow {
  week_start: string;
  overall_rating: number | null;
  weekly_check_in_snapshots?: {
    weekly_avg_weight: number | null;
    workout_compliance_pct: number | null;
    nutrition_compliance_pct: number | null;
    readiness_score: number | null;
  }[] | { weekly_avg_weight: number | null; workout_compliance_pct: number | null; nutrition_compliance_pct: number | null; readiness_score: number | null } | null;
}

const snap = (r: HistoryRow) => Array.isArray(r.weekly_check_in_snapshots) ? r.weekly_check_in_snapshots[0] : r.weekly_check_in_snapshots;

export function WeeklyTrendCharts({ history }: { history: HistoryRow[] }) {
  const data = [...history].reverse().map((r) => ({
    week: r.week_start.slice(5),
    rating: r.overall_rating,
    weight: snap(r)?.weekly_avg_weight ?? null,
    training: snap(r)?.workout_compliance_pct ?? null,
    nutrition: snap(r)?.nutrition_compliance_pct ?? null,
    readiness: snap(r)?.readiness_score ?? null,
  }));
  if (data.length < 2) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Not enough weekly history for trends yet.</div>;
  }
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Chart title="Weight (weekly avg)" data={data} dataKey="weight" />
      <Chart title="Training compliance %" data={data} dataKey="training" domain={[0, 100]} />
      <Chart title="Nutrition compliance %" data={data} dataKey="nutrition" domain={[0, 100]} />
      <Chart title="Readiness score" data={data} dataKey="readiness" />
      <Chart title="Week rating" data={data} dataKey="rating" domain={[0, 10]} />
    </div>
  );
}

function Chart({ title, data, dataKey, domain }: { title: string; data: Record<string, unknown>[]; dataKey: string; domain?: [number, number] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={domain ?? ["auto", "auto"]} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--gold))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
