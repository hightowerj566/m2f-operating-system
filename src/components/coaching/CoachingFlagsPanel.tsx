// Intervention flags: transparent rule outputs with coach actions.
// Displayed with a clear disclaimer — coaching prompts, never diagnoses.
import { useState } from "react";
import { AlertTriangle, Flag as FlagIcon, Info } from "lucide-react";
import { useUpdateFlag } from "@/hooks/useCoachCheckIns";
import { FLAG_STATUS } from "@/lib/coaching/coachingConstants";
import type { CoachingFlag } from "@/lib/coaching/coachingTypes";

export function CoachingFlagsPanel({ flags }: { flags: CoachingFlag[] }) {
  const update = useUpdateFlag();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (!flags.length) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No open flags.</div>;
  }

  return (
    <div className="space-y-2">
      {flags.map((f) => {
        const Icon = f.severity === "critical" ? AlertTriangle : f.severity === "medium" ? FlagIcon : Info;
        const color = f.severity === "critical" ? "text-destructive" : f.severity === "medium" ? "text-yellow-500" : "text-muted-foreground";
        return (
          <div key={f.id} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.explanation}</p>
                {f.coach_note && <p className="text-xs text-primary mt-1">Note: {f.coach_note}</p>}
              </div>
              <span className={`text-[10px] uppercase ${color}`}>{f.severity}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Action onClick={() => update.mutate({ id: f.id, status: FLAG_STATUS.RESOLVED, resolution_reason: "Addressed in weekly response" })}>Resolve</Action>
              <Action onClick={() => update.mutate({ id: f.id, status: FLAG_STATUS.DISMISSED, resolution_reason: "Not actionable" })}>Dismiss</Action>
              <Action onClick={() => update.mutate({ id: f.id, status: FLAG_STATUS.REVIEWING })}>Reviewing</Action>
              {f.severity !== "critical" && <Action onClick={() => update.mutate({ id: f.id, severity: "critical" })}>Escalate</Action>}
              <Action onClick={() => { setNoteFor(noteFor === f.id ? null : f.id); setNote(f.coach_note ?? ""); }}>Add note</Action>
            </div>
            {noteFor === f.id && (
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs" placeholder="Private coach note" />
                <Action onClick={() => { update.mutate({ id: f.id, coach_note: note }); setNoteFor(null); }}>Save</Action>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground pt-1">
        M2F is a coaching platform, not an emergency, medical, or mental-health monitoring service. Flags are transparent rule matches to guide coaching — not diagnoses.
      </p>
    </div>
  );
}

function Action({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground">{children}</button>;
}
