// The four-priority editor: one per category, templates, carry-forward from
// last week, Build List linking for fatherhood, N/A only with a reason.
// Deliberately NOT a general task manager.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Utensils, Heart, Baby, RotateCcw } from "lucide-react";
import {
  PRIORITY_CATEGORIES, PRIORITY_CATEGORY_LABELS, PRIORITY_TEMPLATES, PRIORITY_STATUS,
  type PriorityCategory,
} from "@/lib/coaching/coachingConstants";
import { useSavePriority } from "@/hooks/useCoachCheckIns";
import type { WeeklyPriority } from "@/lib/coaching/coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const ICONS: Record<PriorityCategory, typeof Dumbbell> = { fitness: Dumbbell, nutrition: Utensils, relationship: Heart, fatherhood: Baby };

export function WeeklyPriorityEditor({ checkInId, userId, weekStart, priorities, previousPriorities }: {
  checkInId: string;
  userId: string;
  weekStart: string;
  priorities: WeeklyPriority[];
  previousPriorities: WeeklyPriority[];
}) {
  return (
    <div className="space-y-3">
      {PRIORITY_CATEGORIES.map((cat) => (
        <PriorityRow key={cat} category={cat} checkInId={checkInId} userId={userId} weekStart={weekStart}
          existing={priorities.find((p) => p.category === cat) ?? null}
          previous={previousPriorities.find((p) => p.category === cat) ?? null} />
      ))}
    </div>
  );
}

function PriorityRow({ category, checkInId, userId, weekStart, existing, previous }: {
  category: PriorityCategory; checkInId: string; userId: string; weekStart: string;
  existing: WeeklyPriority | null; previous: WeeklyPriority | null;
}) {
  const Icon = ICONS[category];
  const save = useSavePriority(checkInId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [criteria, setCriteria] = useState(existing?.completion_criteria ?? "");
  const [dueDate, setDueDate] = useState(existing?.due_date ?? "");
  const [linked, setLinked] = useState<{ type: string | null; id: string | null }>({
    type: existing?.linked_entity_type ?? null, id: existing?.linked_entity_id ?? null,
  });
  const [naReason, setNaReason] = useState(existing?.na_reason ?? "");
  const [isNa, setIsNa] = useState(existing?.status === PRIORITY_STATUS.NOT_APPLICABLE);
  const dirty = title !== (existing?.title ?? "") || description !== (existing?.description ?? "")
    || criteria !== (existing?.completion_criteria ?? "") || dueDate !== (existing?.due_date ?? "")
    || isNa !== (existing?.status === PRIORITY_STATUS.NOT_APPLICABLE) || naReason !== (existing?.na_reason ?? "");

  // Fatherhood: pull open Build List milestones as linkable options
  const { data: milestones } = useQuery({
    queryKey: ["open-milestones", userId],
    enabled: category === "fatherhood",
    queryFn: async () => {
      const [{ data: all }, { data: done }] = await Promise.all([
        db.from("build_milestones").select("id, title").limit(100),
        db.from("user_milestones").select("milestone_id").eq("user_id", userId),
      ]);
      const doneIds = new Set((done ?? []).map((d: { milestone_id: string }) => d.milestone_id));
      return (all ?? []).filter((m: { id: string }) => !doneIds.has(m.id)) as { id: string; title: string }[];
    },
  });

  // Debounced auto-save when fields are valid
  useEffect(() => {
    if (!dirty) return;
    const valid = isNa ? naReason.trim().length > 0 : title.trim().length > 0;
    if (!valid) return;
    const t = setTimeout(() => {
      save.mutate({
        user_id: userId, week_start: weekStart, category,
        title: title.trim() || `${PRIORITY_CATEGORY_LABELS[category]} — N/A`,
        description: description || null,
        completion_criteria: criteria || null,
        due_date: dueDate || null,
        linked_entity_type: linked.type, linked_entity_id: linked.id,
        status: isNa ? PRIORITY_STATUS.NOT_APPLICABLE : existing?.status && existing.status !== PRIORITY_STATUS.NOT_APPLICABLE ? existing.status : PRIORITY_STATUS.NOT_STARTED,
        na_reason: isNa ? naReason : null,
        carried_from_priority_id: existing?.carried_from_priority_id ?? null,
      });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, criteria, dueDate, linked, isNa, naReason]);

  const applyTemplate = (t: { title: string; criteria: string }) => { setTitle(t.title); setCriteria(t.criteria); setIsNa(false); };
  const carryForward = () => {
    if (!previous) return;
    setTitle(previous.title); setDescription(previous.description ?? ""); setCriteria(previous.completion_criteria ?? "");
    setIsNa(false);
    save.mutate({
      user_id: userId, week_start: weekStart, category, title: previous.title,
      description: previous.description, completion_criteria: previous.completion_criteria,
      status: PRIORITY_STATUS.NOT_STARTED, carried_from_priority_id: previous.id,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{PRIORITY_CATEGORY_LABELS[category]}</span>
        {previous && (
          <button onClick={carryForward} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Carry forward
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRIORITY_TEMPLATES[category].map((t) => (
          <button key={t.title} onClick={() => applyTemplate(t)}
            className="px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground hover:border-primary/50">{t.title}</button>
        ))}
      </div>
      {category === "fatherhood" && milestones && milestones.length > 0 && (
        <select
          value={linked.type === "milestone" ? linked.id ?? "" : ""}
          onChange={(e) => {
            const m = milestones.find((x) => x.id === e.target.value);
            if (m) { setTitle(m.title); setCriteria("Milestone marked complete in the Build List"); setLinked({ type: "milestone", id: m.id }); setIsNa(false); }
            else setLinked({ type: null, id: null });
          }}
          className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground">
          <option value="">Link an open Build List task…</option>
          {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      )}
      {!isNa && (
        <>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Priority title *"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          <input value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Completion criteria * (what 'done' means)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-2 text-sm" />
          </div>
        </>
      )}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={isNa} onChange={(e) => setIsNa(e.target.checked)} />
        Not applicable this week
      </label>
      {isNa && (
        <input value={naReason} onChange={(e) => setNaReason(e.target.value)} placeholder="Reason required *"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
      )}
      {save.isPending && <p className="text-[10px] text-muted-foreground">Saving…</p>}
    </div>
  );
}
