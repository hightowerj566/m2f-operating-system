// Coach review queue — summarized rows, filterable and sortable, dense and scannable.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, Flag } from "lucide-react";
import { useCoachCheckInQueue } from "@/hooks/useCoachCheckIns";
import { CHECK_IN_STATUS } from "@/lib/coaching/coachingConstants";
import { weekLabel } from "@/lib/coaching/weekLogic";
import type { CoachQueueRow } from "@/lib/coaching/coachingTypes";

const FILTERS = [
  { id: "needs_review", label: "Needs Review" },
  { id: "in_review", label: "In Review" },
  { id: "response_sent", label: "Sent" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "high_risk", label: "High Risk" },
  { id: "all", label: "All" },
] as const;

const SORTS = [
  { id: "risk", label: "Highest risk" },
  { id: "oldest", label: "Oldest unreviewed" },
  { id: "compliance", label: "Lowest compliance" },
  { id: "readiness", label: "Readiness decline" },
  { id: "recent", label: "Most recent" },
  { id: "name", label: "Name" },
] as const;

export function CoachCheckInQueue() {
  const navigate = useNavigate();
  const { data: rows, isLoading, error } = useCoachCheckInQueue();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("needs_review");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("risk");

  const filtered = useMemo(() => {
    if (!rows) return [];
    let out = rows.filter((r) => {
      switch (filter) {
        case "needs_review": return r.status === CHECK_IN_STATUS.SUBMITTED;
        case "in_review": return r.status === CHECK_IN_STATUS.IN_REVIEW;
        case "response_sent": return r.status === CHECK_IN_STATUS.RESPONSE_READY;
        case "acknowledged": return r.status === CHECK_IN_STATUS.ACKNOWLEDGED;
        case "high_risk": return r.flagCounts.critical > 0;
        default: return true;
      }
    });
    const riskScore = (r: CoachQueueRow) => r.flagCounts.critical * 100 + r.flagCounts.medium * 10 + r.flagCounts.info;
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "risk": return riskScore(b) - riskScore(a);
        case "oldest": return (a.submitted_at ?? "").localeCompare(b.submitted_at ?? "");
        case "compliance": return (a.snapshot?.workout_compliance_pct ?? 101) - (b.snapshot?.workout_compliance_pct ?? 101);
        case "readiness": return (a.snapshot?.readiness_delta ?? 0) - (b.snapshot?.readiness_delta ?? 0);
        case "recent": return (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "");
        case "name": return (a.profile?.full_name ?? "").localeCompare(b.profile?.full_name ?? "");
      }
    });
    return out;
  }, [rows, filter, sort]);

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Loading queue…</p>;
  if (error) return <p className="text-sm text-destructive p-6">Failed to load check-ins.</p>;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs border ${filter === f.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="ml-auto bg-card border border-border rounded-lg text-xs px-2 py-1.5 text-foreground">
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nothing here. Clean queue.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((r) => {
          const name = r.profile?.full_name ?? "Member";
          const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          const s = r.snapshot;
          return (
            <button key={r.id} onClick={() => navigate(`/coach/check-ins/${r.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">{initials}</div>
              <div className="flex-1 min-w-0 grid md:grid-cols-[1fr_auto] gap-1">
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {name}
                    {r.flagCounts.critical > 0 && <span className="flex items-center gap-0.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{r.flagCounts.critical}</span>}
                    {r.flagCounts.medium > 0 && <span className="flex items-center gap-0.5 text-xs text-yellow-500"><Flag className="h-3 w-3" />{r.flagCounts.medium}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {weekLabel(r.week_start)} · {r.status.replace(/_/g, " ")}
                    {s?.days_until_due != null && ` · ${s.days_until_due}d to due date`}
                    {s?.baby_age_days != null && ` · baby ${s.baby_age_days}d`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <QueueStat label="Week" value={r.overall_rating != null ? `${r.overall_rating}/10` : "—"} />
                  <QueueStat label="Train" value={s?.workout_compliance_pct != null ? `${s.workout_compliance_pct}%` : "—"} />
                  <QueueStat label="Nutr" value={s?.nutrition_compliance_pct != null ? `${s.nutrition_compliance_pct}%` : "—"} />
                  <QueueStat label="Wt Δ" value={s?.weight_change != null ? `${s.weight_change > 0 ? "+" : ""}${s.weight_change}` : "—"} />
                  <QueueStat label="Ready Δ" value={s?.readiness_delta != null ? `${s.readiness_delta > 0 ? "+" : ""}${s.readiness_delta}` : "—"} />
                  <QueueStat label="Dad tasks" value={s?.build_tasks_completed ?? "—"} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QueueStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="font-semibold text-foreground">{value}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
}
