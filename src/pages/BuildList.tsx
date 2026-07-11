// M2F OS · The Build List — Build Roadmap.
// Campaign-style progression: one phase at a time, with a Required section
// (drives phase %) and an Optional section (never blocks completion).
// Phase 6 (Father Mode) unlocks when the due date has passed or baby arrived.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check, Lock, Sparkles, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLatestReadiness } from "@/hooks/useReadiness";
import { useBuildList, useToggleMilestone, type BuildMilestone, type MilestonePriority } from "@/hooks/useBuildList";
import { PHASES, FATHER_MODE, getPhase, daysRemaining } from "@/lib/phases";
import { BottomNav } from "@/components/BottomNav";

type PhaseStatus = "complete" | "active" | "upcoming" | "past-incomplete";

interface PhaseSummary {
  id: number;
  slug: string;
  name: string;
  pregWindow: string;
  hisJob: string;
  briefing: string;
  items: BuildMilestone[];
  required: BuildMilestone[];
  optional: BuildMilestone[];
  requiredDone: number;
  requiredTotal: number;
  done: number;
  total: number;
  pct: number; // based on REQUIRED — optional never blocks
  status: PhaseStatus;
  unlocked: boolean;
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
  const arrived = !!readiness?.babyArrivedAt;
  const phase = getPhase(days, arrived);
  // Father Mode unlocks when baby has arrived OR the due date has passed.
  const fatherModeUnlocked = arrived || (days != null && days === 0);
  const currentPhaseId = phase?.id === 6 ? 6 : phase && phase.id <= 5 ? phase.id : 5;

  // Include Phase 6 (Father Mode) in the roadmap so its tasks render.
  const allPhases = useMemo(
    () => [...PHASES, FATHER_MODE],
    [],
  );

  // Build per-phase summaries.
  const phases: PhaseSummary[] = useMemo(() => {
    return allPhases.map((p) => {
      const items = milestones.filter((m) => m.phase === p.id);
      const required = items.filter((i) => i.required);
      const optional = items.filter((i) => !i.required);
      const requiredDone = required.filter((i) => i.completed).length;
      const requiredTotal = required.length;
      const done = items.filter((i) => i.completed).length;
      const total = items.length;
      // % is based on REQUIRED; if no required, fall back to all.
      const pctBase = requiredTotal || total;
      const pctDone = requiredTotal ? requiredDone : done;
      const pct = pctBase ? Math.round((pctDone / pctBase) * 100) : 0;

      const unlocked = p.id === 6 ? fatherModeUnlocked : true;
      let status: PhaseStatus;
      if (requiredTotal > 0 && requiredDone === requiredTotal) status = "complete";
      else if (!unlocked) status = "upcoming";
      else if (p.id === currentPhaseId) status = "active";
      else if (p.id < currentPhaseId) status = "past-incomplete";
      else status = "upcoming";

      return {
        id: p.id, slug: p.slug, name: p.name,
        pregWindow: p.pregWindow, hisJob: p.hisJob, briefing: p.briefing,
        items, required, optional,
        requiredDone, requiredTotal,
        done, total, pct, status, unlocked,
      };
    });
  }, [milestones, currentPhaseId, allPhases, fatherModeUnlocked]);

  // Single-open accordion.
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised || phases.length === 0) return;
    if (focusTaskId) {
      const found = milestones.find((m) => m.id === focusTaskId);
      if (found) {
        setExpandedId(found.phase);
        setInitialised(true);
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

  // Phase-complete celebration.
  const [celebrated, setCelebrated] = useState<Set<number>>(new Set());
  const [celebratingPhase, setCelebratingPhase] = useState<PhaseSummary | null>(null);
  useEffect(() => {
    const justFinished = phases.find(
      (p) => p.requiredTotal > 0 && p.requiredDone === p.requiredTotal && !celebrated.has(p.id),
    );
    if (!justFinished || !initialised) return;
    if (celebrated.size === 0) {
      const initial = new Set(
        phases.filter((p) => p.requiredTotal > 0 && p.requiredDone === p.requiredTotal).map((p) => p.id),
      );
      setCelebrated(initial);
      return;
    }
    setCelebratingPhase(justFinished);
    setCelebrated((s) => new Set(s).add(justFinished.id));
    const next = phases.find((p) => p.id > justFinished.id && p.requiredTotal > 0 && p.unlocked);
    const t = setTimeout(() => {
      setCelebratingPhase(null);
      if (next) setExpandedId(next.id);
    }, 2400);
    return () => clearTimeout(t);
  }, [phases, initialised, celebrated]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const overallDone = phases.reduce((s, p) => s + p.requiredDone, 0);
  const overallTotal = phases.reduce((s, p) => s + p.requiredTotal, 0);

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
          {overallDone} of {overallTotal} required milestones complete. One phase at a time.
        </p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading the roadmap…</p>
      ) : (
        <div className="relative pl-6">
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

      <BottomNav />
    </div>
  );
}

function nextPhaseName(phases: PhaseSummary[], id: number): string | null {
  const next = phases.find((p) => p.id > id && p.requiredTotal > 0);
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
  const locked = !phase.unlocked;

  const statusChip = locked
    ? { label: phase.id === 6 ? "Unlocks Day One" : "Upcoming", cls: "bg-secondary text-muted-foreground border-border" }
    : isComplete
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
      <span
        className={`absolute -left-[26px] top-6 w-4 h-4 rounded-full border-2 ${dotCls} flex items-center justify-center transition-all`}
      >
        {isComplete && <Check className="w-2.5 h-2.5 text-black" strokeWidth={4} />}
        {(isUpcoming || locked) && <Lock className="w-2 h-2 text-muted-foreground" />}
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
        } ${(isUpcoming || locked) ? "opacity-70" : ""}`}
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

          {phase.requiredTotal > 0 && <ProgressRing pct={phase.pct} complete={isComplete} />}

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
          {phase.requiredTotal > 0 && (
            <span className="text-[11px] text-muted-foreground font-semibold tabular-nums">
              {phase.requiredDone}/{phase.requiredTotal}
            </span>
          )}
        </div>
      </motion.button>

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
                disabled={locked}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// PhaseBody — Required + Optional sections
// ─────────────────────────────────────────────
interface PhaseBodyProps {
  phase: PhaseSummary;
  onToggleTask: (id: string, complete: boolean) => void;
  focusTaskId: string | null;
  disabled: boolean;
}

function PhaseBody({ phase, onToggleTask, focusTaskId, disabled }: PhaseBodyProps) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{phase.briefing}</p>

      {phase.requiredTotal > 0 && (
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-black text-foreground">
              {phase.requiredDone} / {phase.requiredTotal} Required
            </p>
            <p className="text-xs font-bold text-muted-foreground tabular-nums">{phase.pct}%</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${phase.pct}%` }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className={`h-full rounded-full ${phase.requiredDone === phase.requiredTotal && phase.requiredTotal > 0 ? "bg-emerald-500" : "bg-primary"}`}
            />
          </div>
        </div>
      )}

      <TaskSection
        label="Required"
        items={phase.required}
        onToggleTask={onToggleTask}
        disabled={disabled}
        focusTaskId={focusTaskId}
      />

      {phase.optional.length > 0 && (
        <div className="mt-4">
          <TaskSection
            label="Optional"
            items={phase.optional}
            onToggleTask={onToggleTask}
            disabled={disabled}
            focusTaskId={focusTaskId}
            muted
          />
        </div>
      )}

      {disabled && (
        <p className="mt-4 text-[11px] text-muted-foreground italic text-center">
          {phase.id === 6
            ? "Unlocks the day she arrives."
            : "Preview only — recommended starting soon."}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TaskSection
// ─────────────────────────────────────────────
interface TaskSectionProps {
  label: string;
  items: BuildMilestone[];
  onToggleTask: (id: string, complete: boolean) => void;
  disabled: boolean;
  focusTaskId: string | null;
  muted?: boolean;
}

function TaskSection({ label, items, onToggleTask, disabled, focusTaskId, muted }: TaskSectionProps) {
  if (items.length === 0) return null;
  const done = items.filter((i) => i.completed).length;
  return (
    <div className="rounded-xl bg-background/60 border border-border/60">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`text-[11px] font-bold tracking-[0.2em] uppercase ${muted ? "text-muted-foreground" : "text-foreground/90"}`}>
          {label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-semibold tabular-nums">
          {done}/{items.length}
        </span>
      </div>
      <div className="px-2 pb-2 space-y-1.5">
        {items.map((m) => (
          <TaskRow
            key={m.id}
            milestone={m}
            disabled={disabled}
            onToggle={() => onToggleTask(m.id, !m.completed)}
            highlight={m.id === focusTaskId}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TaskRow — with priority dot + est_minutes badge
// ─────────────────────────────────────────────
interface TaskRowProps {
  milestone: BuildMilestone;
  onToggle: () => void;
  disabled: boolean;
  highlight: boolean;
}

function priorityDot(p: MilestonePriority): string {
  if (p === "critical") return "bg-rose-500";
  if (p === "bonus") return "bg-muted";
  return "bg-muted-foreground/60";
}

function TaskRow({ milestone, onToggle, disabled, highlight }: TaskRowProps) {
  const done = milestone.completed;
  const est = milestone.est_minutes;
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
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot(milestone.priority)}`}
            aria-label={`Priority: ${milestone.priority}`}
          />
          <p
            className={`text-sm font-semibold leading-snug transition-colors flex-1 min-w-0 ${
              done ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {milestone.title}
          </p>
        </div>
        {milestone.detail && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{milestone.detail}</p>
        )}
        {milestone.why_it_matters && (
          <p className="text-[11px] text-foreground/70 mt-1 leading-relaxed italic">
            {milestone.why_it_matters}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/80">
          {est != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{est}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProgressRing
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
