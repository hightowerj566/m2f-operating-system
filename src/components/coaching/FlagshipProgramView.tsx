// M2F OS · Flagship program preview for the coach.
// The M2F Guided Journey is code-driven from src/data/m2f_training_programs.json
// rather than stored in `program_days`. This panel shows the journey structure
// so coaches can review it, plus a validation banner surfacing any missing
// exerciseId references so the training data stays trustworthy.

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { validateFlagship } from "@/lib/flagshipValidator";
import { PRE_BIRTH_PROGRAMS } from "@/content/preBirthTraining";
import { POST_BIRTH_PROGRAMS } from "@/content/postBirthTraining";

export function FlagshipProgramView() {
  const report = useMemo(() => validateFlagship(), []);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const eras = [
    { label: "Pregnancy", programs: PRE_BIRTH_PROGRAMS },
    { label: "Father Mode", programs: POST_BIRTH_PROGRAMS },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
        <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-1">
          Flagship · Time-Based Journey
        </p>
        <p className="text-sm text-foreground/85">
          This program is auto-generated from the M2F Guided Journey training file —
          it progresses with each member's pregnancy week or baby's age, so it does
          not use the standard Day-by-Day editor below.
        </p>
      </div>

      {report.ok ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">All exercise references valid</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {report.totalExerciseRefs.toLocaleString()} references across{" "}
              {report.totalWorkouts} workouts resolve to the {report.librarySize}-exercise library.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-300">
                {report.missing.length} exercise reference{report.missing.length === 1 ? "" : "s"} need attention
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every workout should map to an entry in the exercise library. Fix these
                in <code className="text-[10px]">src/data/m2f_training_programs.json</code>.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
            {report.missing.slice(0, 50).map((m, i) => (
              <li key={i} className="flex items-baseline gap-2 border-t border-amber-500/20 pt-1.5">
                <span className="font-bold text-amber-300 uppercase text-[9px] tracking-wider">
                  {m.reason === "missing-id" ? "missing" : "unknown"}
                </span>
                <span className="text-foreground/80">{m.exerciseName}</span>
                <span className="text-muted-foreground truncate">
                  · {m.workoutName} · {m.version}
                  {m.exerciseId ? ` · ${m.exerciseId}` : ""}
                </span>
              </li>
            ))}
            {report.missing.length > 50 && (
              <li className="text-muted-foreground pt-1.5">
                …and {report.missing.length - 50} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Journey Structure</p>
        {eras.map((era) => (
          <div key={era.label} className="mb-5">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-2">
              {era.label}
            </p>
            <div className="space-y-2">
              {era.programs.map((p) => {
                const open = openSlug === p.slug;
                return (
                  <div key={p.slug} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenSlug(open ? null : p.slug)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.phaseWindow} · {p.workouts.length} workouts
                        </p>
                      </div>
                      {open ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {open && (
                      <ul className="border-t border-border divide-y divide-border">
                        {p.workouts.map((w) => {
                          const count = w.versions.full?.exercises.length ?? 0;
                          return (
                            <li key={w.slug} className="px-4 py-2 flex items-baseline justify-between gap-3">
                              <span className="text-xs text-foreground/85 truncate">
                                <span className="text-muted-foreground mr-2">
                                  Wk {w.week} · D{w.day}
                                </span>
                                {w.name}
                              </span>
                              <span className="text-[10px] font-bold text-primary tabular-nums shrink-0">
                                {count} ex
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
