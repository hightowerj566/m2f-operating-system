// M2F OS · Missions engine (Slice 2).
// One mission per man per week, drawn from his weakest readiness category.
// Auto-assigns on first load of the week; never repeats a completed mission.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface Mission {
  id: string;
  category_id: number;
  title: string;
  directive: string;
  proof_hint: string | null;
  difficulty: number;
}

export interface UserMission {
  id: string;
  mission_id: string;
  week_start: string;
  status: "assigned" | "completed" | "skipped";
  completed_at: string | null;
  mission: Mission;
}

/** Monday of the current week, yyyy-mm-dd (local). */
export function weekStart(d: Date = new Date()): string {
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

/**
 * Fetch this week's mission; if none is assigned yet, assign one from the
 * weakest category (skipping missions the user has already completed).
 */
export function useWeeklyMission(userId: string | undefined, weakestCategoryId: number | undefined) {
  return useQuery<UserMission | null>({
    queryKey: ["weekly-mission", userId, weekStart()],
    enabled: !!userId,
    queryFn: async () => {
      const ws = weekStart();

      // 1. Already assigned this week?
      const { data: existing } = await db
        .from("user_missions")
        .select("id, mission_id, week_start, status, completed_at, mission:missions(id, category_id, title, directive, proof_hint, difficulty)")
        .eq("user_id", userId)
        .eq("week_start", ws)
        .maybeSingle();
      if (existing?.mission) return existing as UserMission;

      // 2. Nothing to assign from without a score
      if (!weakestCategoryId) return null;

      // 3. Pick from the weakest category, excluding previously completed missions
      const { data: done } = await db
        .from("user_missions")
        .select("mission_id")
        .eq("user_id", userId)
        .eq("status", "completed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doneIds: string[] = (done ?? []).map((r: any) => r.mission_id);

      let query = db
        .from("missions")
        .select("id, category_id, title, directive, proof_hint, difficulty")
        .eq("category_id", weakestCategoryId)
        .eq("is_active", true)
        .order("sort_order");
      if (doneIds.length > 0) query = query.not("id", "in", `(${doneIds.join(",")})`);
      const { data: candidates } = await query;

      // Weakest category exhausted → fall back to any not-yet-completed mission
      let pick: Mission | undefined = candidates?.[0];
      if (!pick) {
        let anyQuery = db
          .from("missions")
          .select("id, category_id, title, directive, proof_hint, difficulty")
          .eq("is_active", true)
          .order("sort_order");
        if (doneIds.length > 0) anyQuery = anyQuery.not("id", "in", `(${doneIds.join(",")})`);
        const { data: anyCandidates } = await anyQuery;
        pick = anyCandidates?.[0];
      }
      if (!pick) return null;

      // 4. Assign it
      const { data: inserted } = await db
        .from("user_missions")
        .insert({ user_id: userId, mission_id: pick.id, week_start: ws })
        .select("id, mission_id, week_start, status, completed_at")
        .single();
      if (!inserted) return null;

      return { ...inserted, mission: pick } as UserMission;
    },
  });
}

export function useCompleteMission(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async (userMissionId: string) => {
    await db
      .from("user_missions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", userMissionId)
      .eq("user_id", userId);
    queryClient.invalidateQueries({ queryKey: ["weekly-mission", userId, weekStart()] });
  };
}
