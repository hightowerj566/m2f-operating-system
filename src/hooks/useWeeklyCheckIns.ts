// Member-side weekly check-in data layer (TanStack Query).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currentWeekStart, previousWeekStart, isOverdue } from "@/lib/coaching/weekLogic";
import { CHECK_IN_STATUS } from "@/lib/coaching/coachingConstants";
import { buildWeeklySnapshot } from "@/lib/coaching/snapshotEngine";
import { evaluateCoachingFlags } from "@/lib/coaching/flagEngine";
import type { WeeklyCheckIn } from "@/lib/coaching/coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const checkInKeys = {
  current: (uid?: string) => ["weekly-check-in", "current", uid] as const,
  history: (uid?: string) => ["weekly-check-in", "history", uid] as const,
  review: (weekStart: string, uid?: string) => ["weekly-review", weekStart, uid] as const,
};

/**
 * The check-in that is "actionable" right now: the one for the most recent
 * Sunday. Also returns overdue state and last week's check-in for reference.
 */
export function useCurrentWeeklyCheckIn() {
  const { user } = useAuth();
  const weekStart = currentWeekStart();
  const q = useQuery({
    queryKey: checkInKeys.current(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("weekly_check_ins").select("*")
        .eq("user_id", user!.id)
        .in("week_start", [weekStart, previousWeekStart(weekStart)])
        .order("week_start", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as WeeklyCheckIn[];
      return {
        current: rows.find((r) => r.week_start === weekStart) ?? null,
        previous: rows.find((r) => r.week_start === previousWeekStart(weekStart)) ?? null,
      };
    },
  });
  const current = q.data?.current ?? null;
  return {
    ...q,
    weekStart,
    checkIn: current,
    previousCheckIn: q.data?.previous ?? null,
    overdue: isOverdue(weekStart, current?.submitted_at ?? null),
  };
}

export function useWeeklyCheckInHistory(limit = 12) {
  const { user } = useAuth();
  return useQuery({
    queryKey: checkInKeys.history(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("weekly_check_ins").select("*")
        .eq("user_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as WeeklyCheckIn[];
    },
  });
}

/** Upsert a draft (auto-save). */
export function useSaveCheckInDraft() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Partial<WeeklyCheckIn> & { week_start: string }) => {
      const { data, error } = await db
        .from("weekly_check_ins")
        .upsert({ user_id: user!.id, status: CHECK_IN_STATUS.DRAFT, ...fields }, { onConflict: "user_id,week_start" })
        .select().single();
      if (error) throw error;
      return data as WeeklyCheckIn;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weekly-check-in"] }),
  });
}

/** Submit: mark submitted, build snapshot, evaluate + store flags. */
export function useSubmitWeeklyCheckIn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Partial<WeeklyCheckIn> & { week_start: string }) => {
      const now = new Date().toISOString();
      const { data: checkIn, error } = await db
        .from("weekly_check_ins")
        .upsert(
          { user_id: user!.id, ...fields, status: CHECK_IN_STATUS.SUBMITTED, submitted_at: now },
          { onConflict: "user_id,week_start" },
        )
        .select().single();
      if (error) throw error;

      // Snapshot (insert-only; ignore duplicate if resubmitting an edit)
      const snapshot = await buildWeeklySnapshot(user!.id, checkIn.id, fields.week_start);
      const { error: snapErr } = await db.from("weekly_check_in_snapshots").insert(snapshot);
      if (snapErr && !`${snapErr.message}`.includes("duplicate")) console.warn("snapshot insert:", snapErr.message);

      // Flags (unique on user_id+week_start+flag_type → upsert-safe)
      const flags = evaluateCoachingFlags(checkIn, snapshot);
      if (flags.length) {
        await db.from("coaching_flags").upsert(
          flags.map((f) => ({ ...f, user_id: user!.id, check_in_id: checkIn.id, week_start: fields.week_start, source: "rule_engine" })),
          { onConflict: "user_id,week_start,flag_type", ignoreDuplicates: true },
        );
      }
      return checkIn as WeeklyCheckIn;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weekly-check-in"] }),
  });
}

/** Member weekly review page data: check-in + sent coach response + priorities. */
export function useWeeklyReview(weekStart: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: checkInKeys.review(weekStart, user?.id),
    enabled: !!user && !!weekStart,
    queryFn: async () => {
      const { data: checkIn, error } = await db
        .from("weekly_check_ins").select("*")
        .eq("user_id", user!.id).eq("week_start", weekStart).maybeSingle();
      if (error) throw error;
      if (!checkIn) return { checkIn: null, response: null, priorities: [], snapshot: null };
      const [respRes, priRes, snapRes] = await Promise.all([
        db.from("coach_weekly_responses").select("*").eq("check_in_id", checkIn.id).eq("status", "sent").maybeSingle(),
        db.from("weekly_priorities").select("*").eq("check_in_id", checkIn.id).order("category"),
        db.from("weekly_check_in_snapshots").select("*").eq("check_in_id", checkIn.id).maybeSingle(),
      ]);
      return { checkIn, response: respRes.data, priorities: priRes.data ?? [], snapshot: snapRes.data };
    },
  });
}

/** Member acknowledges the coach response → activates the week. */
export function useAcknowledgeReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkInId: string) => {
      const { error } = await db
        .from("weekly_check_ins")
        .update({ status: CHECK_IN_STATUS.ACKNOWLEDGED, acknowledged_at: new Date().toISOString() })
        .eq("id", checkInId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-check-in"] });
      qc.invalidateQueries({ queryKey: ["weekly-review"] });
      qc.invalidateQueries({ queryKey: ["weekly-priorities"] });
    },
  });
}
