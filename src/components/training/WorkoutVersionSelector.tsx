import type { WorkoutVersionKey } from "@/lib/training/types";

const LABELS: Record<WorkoutVersionKey, string> = {
  full: "Full",
  express: "Express",
  minimum: "Minimum",
};

export function WorkoutVersionSelector({
  value,
  onChange,
}: {
  value: WorkoutVersionKey;
  onChange: (version: WorkoutVersionKey) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-1.5 grid grid-cols-3 gap-1.5">
      {(Object.keys(LABELS) as WorkoutVersionKey[]).map((version) => (
        <button
          key={version}
          type="button"
          onClick={() => onChange(version)}
          className={`h-10 rounded-xl text-xs font-black tracking-wide transition-colors ${
            value === version
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[version]}
        </button>
      ))}
    </div>
  );
}
