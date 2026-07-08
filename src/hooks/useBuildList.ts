// M2F OS · The Build List data layer.
// Milestones are one-time, phase-gated, category-mapped. Completing one
// boosts the live Readiness Score — capped at 10 per category so verified
// work can fill a category but never overflow it.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type CategorySlug } from "@/lib/readiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface BuildMilestone {
  id: string;
  category_id: number;
  phase: number;
  title: string;
  detail: string | null;
  points: number;
  sort_order: number;
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
          .select("id, category_id, phase, title, detail, points, sort_order")
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
 * Event-driven surfacing: the current phase's incomplete items first;
 * if the current phase is fully built, the next phase pulls forward.
 * Never shows items from phases already passed unless still incomplete.
 */
export function surfaceMilestones(
  milestones: BuildMilestone[],
  currentPhase: number | null,
  limit = 3,
): BuildMilestone[] {
  const phase = currentPhase ?? 1;
  const incomplete = milestones.filter((m) => !m.completed);
  // Overdue (earlier phases) first, then current phase, then future phases pulled forward
  const ranked = [...incomplete].sort((a, b) => {
    const rank = (m: BuildMilestone) => (m.phase < phase ? 0 : m.phase === phase ? 1 : 2 + (m.phase - phase));
    return rank(a) - rank(b) || a.sort_order - b.sort_order;
  });
  return ranked.slice(0, limit);
}
