// M2F OS · The Build List data layer.
// Milestones are one-time, phase-gated, category-mapped. Completing one
// boosts the live Readiness Score — capped at 10 per category so verified
// work can fill a category but never overflow it.
//
// Field notes:
// - `recommended_week` — for phases 1–5 this is the pregnancy week; for
//   phase 6 (Father Mode) it is DAYS after birth (1–40).
// - `required` — optional tasks never block phase completion.
// - `priority` — critical | standard | bonus. Drives surfacing + UI dot.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type CategorySlug } from "@/lib/readiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type MilestonePriority = "critical" | "standard" | "bonus";

export interface BuildMilestone {
  id: string;
  category_id: number;
  phase: number;
  title: string;
  detail: string | null;
  points: number;
  sort_order: number;
  why_it_matters: string | null;
  est_minutes: number | null;
  priority: MilestonePriority;
  recommended_week: number | null;
  required: boolean;
  completed: boolean;
  completed_at?: string | null;
}

export function useBuildList(userId: string | undefined) {
  return useQuery<BuildMilestone[]>({
    queryKey: ["build-list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: milestones }, { data: done }] = await Promise.all([
        db
          .from("build_milestones")
          .select(
            "id, category_id, phase, title, detail, points, sort_order, why_it_matters, est_minutes, priority, recommended_week, required",
          )
          .eq("is_active", true)
          .order("phase")
          .order("sort_order"),
        db.from("user_milestones").select("milestone_id, completed_at").eq("user_id", userId),
      ]);
      if (!milestones) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doneMap = new Map((done ?? []).map((r: any) => [r.milestone_id, r.completed_at]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return milestones.map((m: any) => ({
        ...m,
        priority: (m.priority ?? "standard") as MilestonePriority,
        required: m.required ?? true,
        completed: doneMap.has(m.id),
        completed_at: doneMap.get(m.id) ?? null,
      })) as BuildMilestone[];
    },
  });
}

export function useToggleMilestone(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async (milestoneId: string, complete: boolean) => {
    if (!userId) return;
    if (complete) {
      await db.from("user_milestones").upsert(
        { user_id: userId, milestone_id: milestoneId },
        { onConflict: "user_id,milestone_id" },
      );
    } else {
      await db.from("user_milestones").delete().eq("user_id", userId).eq("milestone_id", milestoneId);
    }
    queryClient.invalidateQueries({ queryKey: ["build-list", userId] });
  };
}

// ─────────────────────────────────────────────
// Live score math (pure — unit tested)
// ─────────────────────────────────────────────

/**
 * Apply completed-milestone points on top of assessment category scores.
 * Each category is CAPPED at 10 — verified work fills a category, never
 * overflows it. Returns adjusted per-category scores + adjusted total.
 */
export function applyMilestoneBoost(
  byCategory: Record<CategorySlug, number>,
  milestones: Pick<BuildMilestone, "category_id" | "points" | "completed">[],
): { byCategory: Record<CategorySlug, number>; total: number; boost: number } {
  const adjusted = { ...byCategory };
  for (const m of milestones) {
    if (!m.completed) continue;
    const cat = CATEGORIES.find((c) => c.id === m.category_id);
    if (!cat) continue;
    adjusted[cat.slug] = Math.min(10, (adjusted[cat.slug] ?? 0) + m.points);
  }
  const total = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const baseTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);
  return { byCategory: adjusted, total, boost: total - baseTotal };
}

/**
 * Event-driven surfacing (v3 — week-aware, lock-safe). Ranking:
 *   1. Overdue CRITICAL (earlier unlocked phase, priority=critical)
 *   2. Recommended for the client's exact current pregnancy week
 *   3. Overdue, any priority, from an earlier unlocked phase
 *   4. Upcoming — recommended within the next 1–2 weeks — if unlocked
 *   5. Current-phase CRITICAL
 *   6. Current-phase STANDARD
 *   7. Current-phase BONUS / any other unlocked phase, pulled forward last
 *
 * Milestones from a locked phase are NEVER returned — locking is derived
 * from currentPregnancyWeek via lib/phases, using currentPhase (as set by
 * the caller from getPhase()) as the signal for whether Father Mode (and
 * therefore the full pregnancy roadmap) has been reached. Completed items
 * are always excluded. Home should pass limit = 1–3.
 */
export function surfaceMilestones(
  milestones: Pick<
    BuildMilestone,
    "id" | "category_id" | "phase" | "title" | "detail" | "points" | "sort_order" | "completed" | "priority" | "recommended_week" | "required"
  >[],
  currentPhase: number | null,
  currentPregnancyWeek: number | null = null,
  limit = 3,
): BuildMilestone[] {
  const phase = currentPhase ?? 1;
  const fatherModeReached = phase === FATHER_MODE.id;

  const unlocked = unlockedPhaseIds({
    currentPregnancyWeek,
    babyArrived: fatherModeReached,
    dueDatePassed: fatherModeReached,
  });

  const incomplete = milestones.filter((m) => !m.completed && unlocked.has(m.phase));
  const priorityWeight = (p: string | undefined) =>
    p === "critical" ? 0 : p === "standard" ? 1 : 2;

  const isRecommendedThisWeek = (m: (typeof incomplete)[number]) =>
    currentPregnancyWeek != null && m.recommended_week === currentPregnancyWeek;

  const isUpcomingSoon = (m: (typeof incomplete)[number]) =>
    currentPregnancyWeek != null &&
    m.recommended_week != null &&
    m.recommended_week > currentPregnancyWeek &&
    m.recommended_week <= currentPregnancyWeek + 2;

  const bucket = (m: (typeof incomplete)[number]) => {
    if (m.phase < phase && m.priority === "critical") return 0; // overdue critical
    if (isRecommendedThisWeek(m)) return 1; // recommended for exactly this week
    if (m.phase < phase) return 2; // overdue, any priority
    if (isUpcomingSoon(m)) return 3; // recommended within the next 1–2 weeks
    if (m.phase === phase && m.priority === "critical") return 4;
    if (m.phase === phase && m.priority === "standard") return 5;
    if (m.phase === phase) return 6; // bonus in current phase
    return 7; // future unlocked phase pulled forward, lowest priority
  };

  const ranked = [...incomplete].sort((a, b) => {
    const bd = bucket(a) - bucket(b);
    if (bd !== 0) return bd;
    // Within a bucket: by recommended_week (nulls last), then priority, then sort_order
    const aw = a.recommended_week ?? 999;
    const bw = b.recommended_week ?? 999;
    if (aw !== bw) return aw - bw;
    const pd = priorityWeight(a.priority) - priorityWeight(b.priority);
    if (pd !== 0) return pd;
    return a.sort_order - b.sort_order;
  });
  return ranked.slice(0, limit) as BuildMilestone[];
}
