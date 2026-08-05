// M2F OS · Home — This Week's Roadmap.
// Up to 3 incomplete Build Roadmap milestones applicable to the client's
// current pregnancy week, ranked by useBuildList's surfaceMilestones().
// Never includes milestones from a locked future phase. Distinct data
// source and label from Coach Focus — see CoachFocusCard.tsx.

import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { BuildMilestone } from "@/hooks/useBuildList";

export function ThisWeeksRoadmapCard({ items }: { items: BuildMilestone[] }) {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
        This Week's Roadmap
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing due this week — you're caught up. Check the full roadmap for what's ahead.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => navigate(`/build-list?task=${m.id}`)}
                className="w-full flex items-center gap-3 text-left py-2.5 px-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    m.priority === "critical" ? "bg-amber-400" : "bg-muted-foreground/50"
                  }`}
                />
                <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                  {m.title}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate("/build-list")}
        className="text-xs font-bold text-primary flex items-center gap-1"
      >
        View Full Roadmap <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </section>
  );
}
