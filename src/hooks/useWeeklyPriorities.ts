import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currentWeekStart, parseISODateLocal } from "@/lib/coaching/weekLogic";
import { PRIORITY_STATUS, type PriorityStatus } from "@/lib/coaching/coachingConstants";
import type { WeeklyPriority } from "@/lib/coaching/coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Effective display status: mark overdue client-side without mutating rows. */
export function effectiveStatus(p: WeeklyPriority, now: Date = new Date()): PriorityStatus {
  if (p.status === PRIORITY_STATUS.NOT_STARTED || p.status === PRIORITY_STATUS.IN_PROGRESS) {
    if (p.due_date && now.getTime() > parseISODateLocal(p.due_date).getTime() + 86400000) {
      return PRIORITY_STATUS.OVERDUE;
    }
  }
  return p.status;
}

/** Member: this week's active priorities (only visible after acknowledgment gate handled by caller). */
export function useWeeklyPriorities(weekStart?: string) {
  const { user } = useAuth();
  const ws = weekStart ?? currentWeekStart();
  return useQuery({
    queryKey: ["weekly-priorities", user?.id, ws],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("weekly_priorities").select("*")
        .eq("user_id", user!.id).eq("week_start", ws)
        .order("category");
      if (error) throw error;
      return (data ?? []) as WeeklyPriority[];
    },
  });
}

/** Member marks a priority complete / in progress (cannot touch coach verification). */
export function useUpdatePriorityStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PriorityStatus }) => {
      const patch: Record<string, unknown> = { status };
      patch.completed_at = status === PRIORITY_STATUS.COMPLETED ? new Date().toISOString() : null;
      const { error } = await db.from("weekly_priorities").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weekly-priorities"] }),
  });
}
