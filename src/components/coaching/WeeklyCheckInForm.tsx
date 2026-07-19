// Sectioned, mobile-first weekly check-in. Auto-saves drafts, restores them,
// warns before leaving, ends with a review screen. Direct and action-focused —
// not a medical intake form.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  SLEEP_OPTIONS, TRAINING_OPTIONS, NUTRITION_OPTIONS, SUPPORT_OPTIONS,
  ENERGY_LABELS, STRESS_LABELS, CONNECTION_LABELS,
} from "@/lib/coaching/coachingConstants";
import { weekLabel, weekRange } from "@/lib/coaching/weekLogic";
import { useSaveCheckInDraft, useSubmitWeeklyCheckIn } from "@/hooks/useWeeklyCheckIns";
import type { WeeklyCheckIn } from "@/lib/coaching/coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Answers = Partial<WeeklyCheckIn>;

const SECTIONS = ["Your Week", "Body & Recovery", "Training & Nutrition", "Her & the Baby", "Support & Review"] as const;

export function WeeklyCheckInForm({ weekStart, existing }: { weekStart: string; existing: WeeklyCheckIn | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState(0);
  const [a, setA] = useState<Answers>(existing ?? {});
  const dirty = useRef(false);
  const saveDraft = useSaveCheckInDraft();
  const submit = useSubmitWeeklyCheckIn();

  // Build List tasks completed this week → selectable for Q10
  const { start, end } = weekRange(weekStart);
  const { data: weekTasks } = useQuery({
    queryKey: ["week-build-tasks", user?.id, weekStart],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("user_milestones")
        .select("milestone_id, completed_at, build_milestones(title)")
        .eq("user_id", user!.id)
        .gte("completed_at", `${start}T00:00:00`).lte("completed_at", `${end}T23:59:59`);
      return (data ?? []).map((r: { build_milestones: { title: string } | null }) => r.build_milestones?.title).filter(Boolean) as string[];
    },
  });

  const set = (patch: Answers) => { dirty.current = true; setA((prev) => ({ ...prev, ...patch })); };

  // Debounced auto-save
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      saveDraft.mutate({ week_start: weekStart, ...a });
      dirty.current = false;
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const sectionValid = useMemo(() => {
    switch (section) {
      case 0: return !!a.overall_rating && !!a.biggest_win?.trim() && !!a.biggest_struggle?.trim();
      case 1: return !!a.energy_rating && !!a.stress_rating && !!a.sleep_range;
      case 2: return !!a.training_rating && !!a.nutrition_rating;
      case 3: return !!a.relationship_rating && !!a.fatherhood_confidence;
      case 4: return !!a.next_week_concern?.trim() && !!a.support_type;
      default: return true;
    }
  }, [section, a]);

  const [reviewing, setReviewing] = useState(false);

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({ week_start: weekStart, ...a });
      dirty.current = false;
      toast({ title: "Check-in submitted", description: "Jason will review your week and set your next priorities." });
      navigate("/weekly-check-in", { replace: true });
    } catch (e) {
      toast({ title: "Submission failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  if (reviewing) {
    return (
      <ReviewScreen a={a} onBack={() => setReviewing(false)} onSubmit={handleSubmit} submitting={submit.isPending} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{SECTIONS[section]}</span>
          <span>{section + 1} of {SECTIONS.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full gold-gradient transition-all" style={{ width: `${((section + 1) / SECTIONS.length) * 100}%` }} />
        </div>
      </div>

      {section === 0 && (
        <div className="space-y-6">
          <ScaleQ label="How would you rate your week overall?" required min={1} max={10}
            value={a.overall_rating ?? null} onChange={(v) => set({ overall_rating: v })} />
          <TextQ label="What was your biggest win this week?" required value={a.biggest_win ?? ""}
            onChange={(v) => set({ biggest_win: v })} placeholder="One sentence. Own it." />
          <TextQ label="What was your biggest challenge this week?" required value={a.biggest_struggle ?? ""}
            onChange={(v) => set({ biggest_struggle: v })} placeholder="Be honest — this is what your coach works from." />
        </div>
      )}

      {section === 1 && (
        <div className="space-y-6">
          <ScaleQ label="How was your energy this week?" required min={1} max={5} labels={ENERGY_LABELS}
            value={a.energy_rating ?? null} onChange={(v) => set({ energy_rating: v })} />
          <ScaleQ label="How high was your stress this week?" required min={1} max={5} labels={STRESS_LABELS}
            value={a.stress_rating ?? null} onChange={(v) => set({ stress_rating: v })} />
          <ChoiceQ label="How many hours of sleep did you average?" required options={SLEEP_OPTIONS}
            value={a.sleep_range ?? null} onChange={(v) => set({ sleep_range: v })} />
        </div>
      )}

      {section === 2 && (
        <div className="space-y-6">
          <ChoiceQ label="How did training go?" required options={TRAINING_OPTIONS}
            value={a.training_rating ?? null} onChange={(v) => set({ training_rating: v })} />
          <TextQ label="Anything affect your training?" value={a.training_notes ?? ""}
            onChange={(v) => set({ training_notes: v })} optional />
          <ChoiceQ label="How closely did you follow your nutrition plan?" required options={NUTRITION_OPTIONS}
            value={a.nutrition_rating ?? null} onChange={(v) => set({ nutrition_rating: v })} />
          <TextQ label="What made nutrition easier or harder?" value={a.nutrition_notes ?? ""}
            onChange={(v) => set({ nutrition_notes: v })} optional />
        </div>
      )}

      {section === 3 && (
        <div className="space-y-6">
          <ScaleQ label="How connected did you feel to your partner this week?" required min={1} max={5} labels={CONNECTION_LABELS}
            value={a.relationship_rating ?? null} onChange={(v) => set({ relationship_rating: v })} />
          <TextQ label="Anything you want support with in your relationship or communication?" optional
            value={a.relationship_notes ?? ""} onChange={(v) => set({ relationship_notes: v })} />
          <ScaleQ label="How prepared do you feel for the baby right now?" required min={1} max={10}
            value={a.fatherhood_confidence ?? null} onChange={(v) => set({ fatherhood_confidence: v })} />
          <div className="space-y-2">
            <Label text="What fatherhood-prep task did you complete this week?" optional />
            {weekTasks && weekTasks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {weekTasks.map((t) => (
                  <button key={t} onClick={() => set({ fatherhood_task_notes: t })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      a.fatherhood_task_notes === t ? "border-primary text-primary" : "border-border text-muted-foreground"
                    }`}>{t}</button>
                ))}
              </div>
            )}
            <TextInput value={a.fatherhood_task_notes ?? ""} onChange={(v) => set({ fatherhood_task_notes: v })}
              placeholder={weekTasks?.length ? "Or type your own…" : "e.g. Installed the car seat"} />
          </div>
        </div>
      )}

      {section === 4 && (
        <div className="space-y-6">
          <TextQ label="What are you least confident about heading into next week?" required
            value={a.next_week_concern ?? ""} onChange={(v) => set({ next_week_concern: v })} />
          <ChoiceQ label="What do you need most from your coach this week?" required options={SUPPORT_OPTIONS}
            value={a.support_type ?? null} onChange={(v) => set({ support_type: v })} />
          <TextQ label="Anything else your coach should know?" optional
            value={a.support_notes ?? ""} onChange={(v) => set({ support_notes: v })} />
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3 pt-2">
        {section > 0 && (
          <button onClick={() => setSection((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-3 rounded-lg border border-border text-sm text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button
          disabled={!sectionValid}
          onClick={() => (section < SECTIONS.length - 1 ? setSection((s) => s + 1) : setReviewing(true))}
          className="flex-1 flex items-center justify-center gap-1 px-4 py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-40"
        >
          {section < SECTIONS.length - 1 ? <>Next <ChevronRight className="h-4 w-4" /></> : "Review & Submit"}
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">{weekLabel(weekStart)} · drafts save automatically</p>
    </div>
  );
}

// ── Review screen ──
function ReviewScreen({ a, onBack, onSubmit, submitting }: { a: Answers; onBack: () => void; onSubmit: () => void; submitting: boolean }) {
  const rows: [string, string | number | null | undefined][] = [
    ["Week rating", a.overall_rating && `${a.overall_rating}/10`],
    ["Biggest win", a.biggest_win],
    ["Biggest challenge", a.biggest_struggle],
    ["Energy", a.energy_rating && ENERGY_LABELS[a.energy_rating - 1]],
    ["Stress", a.stress_rating && STRESS_LABELS[a.stress_rating - 1]],
    ["Sleep", SLEEP_OPTIONS.find((o) => o.value === a.sleep_range)?.label],
    ["Training", TRAINING_OPTIONS.find((o) => o.value === a.training_rating)?.label],
    ["Nutrition", NUTRITION_OPTIONS.find((o) => o.value === a.nutrition_rating)?.label],
    ["Connection", a.relationship_rating && CONNECTION_LABELS[a.relationship_rating - 1]],
    ["Baby readiness", a.fatherhood_confidence && `${a.fatherhood_confidence}/10`],
    ["Least confident about", a.next_week_concern],
    ["Coach support", SUPPORT_OPTIONS.find((o) => o.value === a.support_type)?.label],
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg text-foreground">Review your check-in</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 p-3 text-sm">
            <span className="text-muted-foreground shrink-0">{k}</span>
            <span className="text-foreground text-right">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-3 rounded-lg border border-border text-sm text-foreground">Edit</button>
        <button onClick={onSubmit} disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-60">
          <CheckCircle2 className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit Check-In"}
        </button>
      </div>
    </div>
  );
}

// ── Field primitives (existing M2F visual language) ──
function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <p className="text-sm font-medium text-foreground">
      {text}{required && <span className="text-primary"> *</span>}
      {optional && <span className="text-muted-foreground font-normal"> (optional)</span>}
    </p>
  );
}

function ScaleQ({ label, min, max, labels, value, onChange, required }: {
  label: string; min: number; max: number; labels?: string[]; value: number | null; onChange: (v: number) => void; required?: boolean;
}) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="space-y-2">
      <Label text={label} required={required} />
      <div className="flex gap-1.5 flex-wrap">
        {nums.map((n) => (
          <button key={n} onClick={() => onChange(n)}
            className={`h-10 min-w-10 px-1 rounded-lg border text-sm font-medium transition-colors ${
              value === n ? "gold-gradient text-primary-foreground border-transparent" : "border-border text-muted-foreground"
            }`}>{n}</button>
        ))}
      </div>
      {labels && value && <p className="text-xs text-primary">{labels[value - min]}</p>}
    </div>
  );
}

function ChoiceQ({ label, options, value, onChange, required }: {
  label: string; options: { value: string; label: string }[]; value: string | null; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label text={label} required={required} />
      <div className="grid gap-2">
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              value === o.value ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground"
            }`}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function TextQ({ label, value, onChange, required, optional, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; optional?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label text={label} required={required} optional={optional} />
      <TextInput value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
    />
  );
}
