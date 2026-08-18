import { Clock } from "lucide-react";
import { TIME_BUDGETS, type TimeBudget } from "@/lib/timeBudget";

interface Props {
  value: TimeBudget;
  onChange: (value: TimeBudget) => void;
  trimmed?: boolean;
}

/** Top-of-session switch: how much time the member has today. */
export function TimeAvailableSelector({ value, onChange, trimmed }: Props) {
  const active = TIME_BUDGETS.find((b) => b.value === value);

  return (
    <div className="px-5 py-3 border-b border-border space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Time available</p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time available">
        {TIME_BUDGETS.map((budget) => (
          <button
            key={budget.value}
            onClick={() => onChange(budget.value)}
            aria-pressed={budget.value === value}
            className={`rounded-xl px-2 py-2 text-sm font-bold border transition-colors ${
              budget.value === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:border-primary/40"
            }`}
          >
            {budget.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {active?.blurb}
        {trimmed ? " — accessories trimmed to fit. Primary lifts stay." : ""}
      </p>
    </div>
  );
}
