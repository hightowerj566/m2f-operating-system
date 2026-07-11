// M2F OS · The Build List — Build Roadmap.
// Campaign-style progression: one phase at a time, grouped by category,
// with premium Apple-style expand/collapse motion.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronDown, ChevronRight, Check, Lock, Sparkles, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, useToggleMilestone, type BuildMilestone } from "@/hooks/useBuildList";
import { CATEGORIES } from "@/lib/readiness";
import { PHASES, getPhase, daysRemaining } from "@/lib/phases";
import { BottomNav } from "@/components/BottomNav";

// ─────────────────────────────────────────────
// Task time estimate — derived, not stored.
// Small heuristic based on points so the UI feels concrete.
// ─────────────────────────────────────────────
function estimatedTime(points: number): string {
  if (points >= 2) return "30–60 min";
  return "10–20 min";
}

type PhaseStatus = "complete" | "active" | "upcoming" | "past-incomplete";

interface PhaseSummary {
  id: number;
  slug: string;
  name: string;
  pregWindow: string;
  hisJob: string;
  briefing: string;
  items: BuildMilestone[];
  done: number;
  total: number;
  pct: number;
  status: PhaseStatus;
}

export default function BuildList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusTaskId = params.get("task");

  const { data: readiness } = useLatestReadiness(user?.id);
  const { data: milestones = [], isLoading } = useBuildList(user?.id);
  const toggle = useToggleMilestone(user?.id);

  const days = daysRemaining(readiness?.dueDate);
  const phase = getPhase(days, !!readiness?.babyArrivedAt);
  const currentPhaseId = phase && phase.id <= 5 ? phase.id : 5;

  // Build per-phase summaries.
  const phases: PhaseSummary[] = useMemo(() => {
    return PHASES.map((p) => {
      const items = milestones.filter((m) => m.phase === p.id);
      const done = items.filter((i) => i.completed).length;
      const total = items.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      let status: PhaseStatus;
      if (total > 0 && done === total) status = "complete";
      else if (p.id === currentPhaseId) status = "active";
      else if (p.id < currentPhaseId) status = "past-incomplete";
      else status = "upcoming";
      return {
        id: p.id, slug: p.slug, name: p.name,
        pregWindow: p.pregWindow, hisJob: p.hisJob, briefing: p.briefing,
        items, done, total, pct, status,
      };
    });
  }, [milestones, currentPhaseId]);

  // Which phase is expanded (single-open accordion).
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised || phases.length === 0) return;
    // If a task was requested, expand its phase. Otherwise default to active.
    if (focusTaskId) {
      const found = milestones.find((m) => m.id === focusTaskId);
      if (found) {
        setExpandedId(found.phase);
        setInitialised(true);
        // scroll after mount
        setTimeout(() => {
          document.getElementById(`task-${focusTaskId}`)?.scrollIntoView({
            behavior: "smooth", block: "center",
          });
        }, 400);
        return;
      }
    }
    const first = phases.find((p) => p.status === "active")
      ?? phases.find((p) => p.status === "past-incomplete")
      ?? phases[0];
    setExpandedId(first?.id ?? null);
    setInitialised(true);
  }, [phases, milestones, focusTaskId, initialised]);

  // Phase-complete celebration (one-shot per phase per session).
  const [celebrated, setCelebrated] = useState<Set<number>>(new Set());
  const [celebratingPhase, setCelebratingPhase] = useState<PhaseSummary | null>(null);
  useEffect(() => {
    const justFinished = phases.find(
      (p) => p.total > 0 && p.done === p.total && !celebrated.has(p.id),
    );
    if (!justFinished || !initialised) return;
    // Skip celebrating phases that were already complete on first load.
    if (celebrated.size === 0 && phases.every((p) => p.id !== justFinished.id || p.done === p.total)) {
      // Mark all currently-complete phases as celebrated silently on first mount.
      const initial = new Set(phases.filter((p) => p.total > 0 && p.done === p.total).map((p) => p.id));
      setCelebrated(initial);
      return;
    }
    setCelebratingPhase(justFinished);
    setCelebrated((s) => new Set(s).add(justFinished.id));
    // Auto-expand the next phase.
    const next = phases.find((p) => p.id > justFinished.id && p.total > 0);
    const t = setTimeout(() => {
      setCelebratingPhase(null);
      if (next) setExpandedId(next.id);
    }, 2400);
    return () => clearTimeout(t);
  }, [phases, initialised, celebrated]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const overallDone = phases.reduce((s, p) => s + p.done, 0);
  const overallTotal = phases.reduce((s, p) => s + p.total, 0);

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-primary mb-2">
          Build Roadmap
        </p>
        <h1 className="text-4xl font-black tracking-tight leading-[1.05]">
          Everything you'll build before your baby arrives.
        </h1>
        <p className="text-muted-foreground text-sm mt-3">
          {overallDone} of {overallTotal} milestones complete. One phase at a time.
        </p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading the roadmap…</p>
      ) : (
        <div className="relative pl-6">
          {/* Timeline spine */}
          <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-3">
            {phases.map((p) => (
              <PhaseCard
                key={p.id}
                phase={p}
                expanded={expandedId === p.id}
                onToggle={() =>
                  setExpandedId((cur) => (cur === p.id ? null : p.id))
                }
                onToggleTask={(id, complete) => toggle(id, complete)}
                focusTaskId={focusTaskId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Phase-complete celebration overlay */}
      <AnimatePresence>
        {celebratingPhase && (
          <motion.div
            key={celebratingPhase.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bg-card border border-primary/50 rounded-3xl px-8 py-6 shadow-2xl text-center max-w-sm w-full"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-primary mb-2">
                Phase Complete
              </p>
              <p className="text-xl font-black text-foreground leading-tight">
                {titleCase(celebratingPhase.name)} is complete.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {nextPhaseName(phases, celebratingPhase.id)
                  ? `Time to move into ${titleCase(nextPhaseName(phases, celebratingPhase.id)!)}.`
                  : "You built the whole thing. She's lucky."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function nextPhaseName(phases: PhaseSummary[], id: number): string | null {
  const next = phases.find((p) => p.id > id && p.total > 0);
  return next?.name ?? null;
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────
// PhaseCard
// ─────────────────────────────────────────────
interface PhaseCardProps {
  phase: PhaseSummary;
  expanded: boolean;
  onToggle: () => void;
  onToggleTask: (id: string, complete: boolean) => void;
  focusTaskId: string | null;
}

function PhaseCard({ phase, expanded, onToggle, onToggleTask, focusTaskId }: PhaseCardProps) {
  const isComplete = phase.status === "complete";
  const isActive = phase.status === "active";
  const isUpcoming = phase.status === "upcoming";
  const isOverdue = phase.status === "past-incomplete";

  const statusChip = isComplete
    ? { label: "Complete", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
    : isActive
      ? { label: "Active", cls: "bg-primary/15 text-primary border-primary/40" }
      : isOverdue
        ? { label: "Overdue", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
        : { label: "Upcoming", cls: "bg-secondary text-muted-foreground border-border" };

  const dotCls = isComplete
    ? "bg-emerald-500 border-emerald-500"
    : isActive
      ? "bg-primary border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
      : isOverdue
        ? "bg-amber-500 border-amber-500"
        : "bg-background border-border";

  return (
    <div className="relative">
      {/* Timeline dot */}
      <span
        className={`absolute -left-[26px] top-6 w-4 h-4 rounded-full border-2 ${dotCls} flex items-center justify-center transition-all`}
      >
        {isComplete && <Check className="w-2.5 h-2.5 text-black" strokeWidth={4} />}
        {isUpcoming && <Lock className="w-2 h-2 text-muted-foreground" />}
      </span>

      <motion.button
        layout
        onClick={onToggle}
        className={`w-full text-left rounded-2xl border p-4 transition-colors ${
          expanded
            ? "border-primary/40 bg-card"
            : isComplete
              ? "border-emerald-500/25 bg-card/70"
              : isActive
                ? "border-border bg-card hover:border-primary/40"
                : "border-border bg-card/50"
        } ${isUpcoming ? "opacity-70" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
              Phase {phase.id}
            </p>
            <p className="text-lg font-black tracking-tight leading-tight mt-0.5">
              {titleCase(phase.name)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{phase.pregWindow}</p>
          </div>

          {/* Progress ring */}
          {phase.total > 0 && <ProgressRing pct={phase.pct} complete={isComplete} />}

          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="text-muted-foreground shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusChip.cls}`}
          >
            {statusChip.label}
          </span>
          {phase.total > 0 && (
            <span className="text-[11px] text-muted-foreground font-semibold tabular-nums">
              {phase.done}/{phase.total}
            </span>
          )}
          {isUpcoming && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              Recommended {phase.pregWindow.split("–")[0].replace("Weeks ", "Week ")}
            </span>
          )}
        </div>
      </motion.button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1">
              <PhaseBody
                phase={phase}
                onToggleTask={onToggleTask}
                focusTaskId={focusTaskId}
                isUpcoming={isUpcoming}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// PhaseBody — progress bar + category groups
// ─────────────────────────────────────────────
interface PhaseBodyProps {
  phase: PhaseSummary;
  onToggleTask: (id: string, complete: boolean) => void;
  focusTaskId: string | null;
  isUpcoming: boolean;
}

function PhaseBody({ phase, onToggleTask, focusTaskId, isUpcoming }: PhaseBodyProps) {
  // Group by readiness category
  const groups = useMemo(() => {
    const map = new Map<number, BuildMilestone[]>();
    for (const m of phase.items) {
      if (!map.has(m.category_id)) map.set(m.category_id, []);
      map.get(m.category_id)!.push(m);
    }
    return Array.from(map.entries())
      .map(([catId, items]) => ({
        cat: CATEGORIES.find((c) => c.id === catId),
        items,
        done: items.filter((i) => i.completed).length,
      }))
      .filter((g) => g.cat)
      .sort((a, b) => (a.cat!.id - b.cat!.id));
  }, [phase.items]);

  // Track expanded categories (default: first one open, or the one holding the focused task)
  const [openCats, setOpenCats] = useState<Set<number>>(() => {
    if (focusTaskId) {
      const focused = phase.items.find((m) => m.id === focusTaskId);
      if (focused) return new Set([focused.category_id]);
    }
    return new Set(groups.slice(0, 1).map((g) => g.cat!.id));
  });

  const toggleCat = (id: number) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{phase.briefing}</p>

      {/* Progress bar */}
      {phase.total > 0 && (
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-black text-foreground">
              {phase.done} / {phase.total} Complete
            </p>
            <p className="text-xs font-bold text-muted-foreground tabular-nums">{phase.pct}%</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${phase.pct}%` }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className={`h-full rounded-full ${phase.done === phase.total && phase.total > 0 ? "bg-emerald-500" : "bg-primary"}`}
            />
          </div>
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-2">
        {groups.map((g) => {
          const open = openCats.has(g.cat!.id);
          return (
            <div key={g.cat!.id} className="rounded-xl bg-background/60 border border-border/60">
              <button
                onClick={() => toggleCat(g.cat!.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              >
                <motion.span
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.span>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/90">
                  {g.cat!.name}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground font-semibold tabular-nums">
                  {g.done}/{g.items.length}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-2 space-y-1.5">
                      {g.items.map((m) => (
                        <TaskRow
                          key={m.id}
                          milestone={m}
                          disabled={isUpcoming}
                          onToggle={() => onToggleTask(m.id, !m.completed)}
                          highlight={m.id === focusTaskId}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {isUpcoming && (
        <p className="mt-4 text-[11px] text-muted-foreground italic text-center">
          Preview only — recommended starting {phase.pregWindow.split("–")[0].replace("Weeks ", "Week ")}.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TaskRow
// ─────────────────────────────────────────────
interface TaskRowProps {
  milestone: BuildMilestone;
  onToggle: () => void;
  disabled: boolean;
  highlight: boolean;
}

function TaskRow({ milestone, onToggle, disabled, highlight }: TaskRowProps) {
  const done = milestone.completed;
  return (
    <div
      id={`task-${milestone.id}`}
      className={`rounded-xl px-3 py-3 flex items-start gap-3 transition-colors ${
        highlight ? "ring-1 ring-primary/50 bg-primary/5" : ""
      } ${done ? "bg-emerald-500/5" : "hover:bg-secondary/40"}`}
    >
      <button
        onClick={() => {
          if (disabled) return;
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try { (navigator as Navigator).vibrate?.(done ? 8 : [10, 30, 10]); } catch { /* ignore */ }
          }
          onToggle();
        }}
        disabled={disabled}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          done
            ? "bg-emerald-500 border-emerald-500 scale-100"
            : disabled
              ? "border-border/60 opacity-50"
              : "border-border hover:border-primary active:scale-90"
        }`}
      >
        <AnimatePresence>
          {done && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Check className="w-3.5 h-3.5 text-black" strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold leading-snug transition-colors ${
            done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {milestone.title}
        </p>
        {milestone.detail && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{milestone.detail}</p>
        )}
        <p className="text-[10px] text-muted-foreground/80 mt-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {estimatedTime(milestone.points)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProgressRing — tiny SVG ring for phase cards
// ─────────────────────────────────────────────
function ProgressRing({ pct, complete }: { pct: number; complete: boolean }) {
  const size = 34;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = complete ? "hsl(var(--primary))" : "hsl(var(--primary))";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={complete ? "rgb(16 185 129)" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {complete ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3.5} />
        ) : (
          <span className="text-[9px] font-black tabular-nums text-foreground">{pct}%</span>
        )}
      </div>
    </div>
  );
}
